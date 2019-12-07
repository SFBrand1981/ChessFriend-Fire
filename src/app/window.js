// main controller
module.exports = function (window) {

    var path = require('path')
    var os = require('os')
    var fs = require('fs')
    

    var clipboard = nw.Clipboard.get()
    const { fork } = require('child_process')

    var Awesomplete = require('awesomplete')
    var tools = require(path.join(process.cwd(), '/app/tools.js'))
    
    var dbHandler = require(path.join(process.cwd(), '/app/db.js'))
    var db = new dbHandler()

    var boardHandler = require(path.join(process.cwd(), '/app/board.js'))
    var board = new boardHandler()

    var LabelHandler = require(path.join(process.cwd(), '/app/labels.js'))
    var lh = new LabelHandler()

    var PGNHandler = require(path.join(process.cwd(), '/app/pgn.js'))
    var ph = new PGNHandler()

    var menuHandler = require(path.join(process.cwd(), '/app/menu.js'))
    var menu = new menuHandler(window)
    
    var guiHandler = require(path.join(process.cwd(), '/app/gui.js'))
    var gui = new guiHandler(window)

    var settingsHandler = require(path.join(process.cwd(), '/app/settings.js'))
    var settings = new settingsHandler(window)

    var ResizeHandler = require(path.join(process.cwd(), '/app/resize.js'))
    var rh = new ResizeHandler(window)

    var boardGUIHandler = require(path.join(process.cwd(), '/app/boardGUI.js'))
    var boardGUI = new boardGUIHandler(window, board)

    var engineHandler = require(path.join(process.cwd(), '/app/engine.js'))
    var engine = new engineHandler(window)


    // GUI elements from HTML
    var navbarContainer = window.document.getElementById("sidebar__stickyItems")
    var gameContainer = window.document.getElementById("sidebar__draggableItems")
    var mainContainer = window.document.getElementById("main-container"),
        leftPanel = window.document.getElementById("left-panel"),
        rightPanel = window.document.getElementById("right-panel"),
        handle = window.document.getElementById("resize-handle")
    
    var leftPane = window.document.getElementById("split-container__left-pane")
    var rightPane = window.document.getElementById("split-container__right-pane")

    
    // event listeners
    var evtTimeout
    window.document.addEventListener("sidebarResized", evt => {

        clearTimeout(evtTimeout)
        evtTimeout = setTimeout(function(){

            console.log("Evt sidebarResized")
            boardGUI.doResizeSquares()
            
        }, 10)
    })


    window.addEventListener("unload", evt => {
        engine.quitEngine()
    })
    

    window.document.addEventListener("toggleSearchBar", evt => {
        console.log("Evt toggleSearchBar")
        toggleSearchBar()
    })

    
    window.document.addEventListener("undoEdit", evt => {
        console.log("Evt undoEdit")

        board.undoEdit(board.getBoard()).then( hlNodeIndx => {
            boardGUI.updateGameInfo(board.getBoard().gameInfo)
            updateBoardAndNotation(hlNodeIndx)
        })
    })


    window.document.addEventListener("redoEdit", evt => {
        console.log("Evt redoEdit")

        board.redoEdit(board.getBoard()).then( hlNodeIndx => {
            boardGUI.updateGameInfo(board.getBoard().gameInfo)
            updateBoardAndNotation(hlNodeIndx)
        })
    })
    

    window.document.addEventListener("setupPosition", evt => {
        console.log("Evt setupPosition", evt.detail)

        boardGUI.resetCursor(leftPane)
        
        if (evt.detail.option == "search") {
            searchPosition()
        } else {

            var fen = evt.detail.fen ? evt.detail.fen : board.getBoard().currentFEN
            var stm = evt.detail.stm
            var mvNr = parseInt(evt.detail.mvNr)
            
            return boardGUI.validateFEN(fen, stm, mvNr).then(rv => {

                board.setCurrentFEN(rv.FEN)
                var gameInfo = board.getBoard().gameInfo
                var nodes = board.getBoard().nodes
                nodes[lh.rootNode()]['FEN'] = rv.FEN

                console.log("Create new game from position", gameInfo)
                return db.addGame(gameInfo, nodes)

            }).then(game_id => {
                alert ("New game has been created from position!")
                return db.getEntry(game_id)
                
            }).then( entry => {
                console.log("loading", entry)
                loadEntry(entry, entry.star)
                
            }).catch(function (e) {
                console.log("Invalid FEN", e)
                alert ("Invalid FEN: " + (e.error || e.stack || e))
            })
            
        }
    })


    window.document.addEventListener("prevDBGame", evt => {
        console.log("Evt prevDBGame")

        var curIndx = db.searchParams.gameList.indexOf(board.getBoard().game_id)
        if (curIndx > 0) {
            
            var nextId = db.searchParams.gameList[curIndx - 1]
            loadEntryById(nextId)
        }
    })


    window.document.addEventListener("nextDBGame", evt => {
        console.log("Evt nextDBGame")

        var curIndx = db.searchParams.gameList.indexOf(board.getBoard().game_id)
        if (curIndx != -1 && (curIndx + 1 < db.searchParams.queryCount)) {

            var nextId = db.searchParams.gameList[curIndx + 1]
            loadEntryById(nextId)
        }
        
    })


    window.document.addEventListener("setupBoardEdited", evt => {
        console.log("Evt setupBoardEdited", evt.detail)
        board.setCurrentFEN(evt.detail)
        boardGUI.drawFEN(board)
    })

    
    window.document.addEventListener("setupBoardCleared", evt => {
        console.log("Evt setupBoardCleared")
        board.setCurrentFEN('8/8/8/8/8/8/8/8')
        boardGUI.drawFEN(board)
    })


    window.document.addEventListener("flipBoard", evt => {
        console.log("Evt flipBoard")
        board.flipBoard().then(rv => {
            console.log("set board.flipped", rv)
            boardGUI.drawHighlightedSquares(board)
            boardGUI.drawCoords(board.getBoard())
            boardGUI.drawFEN(board)
        })
    })
    
    
    window.document.addEventListener("loadNextDBPage", evt => {
        console.log("Evt loadNextDBPage")

        var sp = db.searchParams
        
        if (sp.searching && !(sp.limit*(sp.pageNum+1) >= sp.queryCount)) {
            sp.pageNum += 1
        } else if (!sp.searching && !(sp.limit*(sp.pageNum+1) >= sp.totalCount)) {
            sp.pageNum += 1
        }
        
        drawDBEntries()
    })


    window.document.addEventListener("loadPrevDBPage", evt => {
        console.log("Evt loadPrevDBPage")
        
        if (db.searchParams.pageNum > 0) {
            db.searchParams.pageNum -= 1
        }
        
        drawDBEntries()
    })


    window.document.addEventListener("editSearchParams", evt => {
        console.log("Evt editSearchParams", evt.detail)

        var key = evt.detail.key.replace(/^searchParam_/, '')
        var value = evt.detail.value
        var needsRedraw = true
        
        db.searchParams['pageNum'] = 0

        if (key == "ignoreColor") {
            db.searchParams['ignoreColor'] = (db.searchParams['ignoreColor'] == true) ? false : true
        } else {
            db.searchParams[key] = value
        }
        
        
        if (db.searchParams['fen'] == "" &&
            db.searchParams['white'] == "" &&
            db.searchParams['black'] == "" &&
            db.searchParams['event'] == "" &&
            db.searchParams['tags'].length == 1 &&
            db.searchParams['tags'][0] == "") {

            db.searchParams['searching'] = false

            if (key == "ignoreColor") {
                needsRedraw = false
            }
            
        } else {
            db.searchParams['searching'] = true
        }

        console.log("set gui.searchParams", db.searchParams)

        if (needsRedraw) {
            drawDBEntries()
        }
        
    })

    
    window.document.addEventListener("staticSidebarItemClicked", evt => {
        console.log("Evt sidebarItemClicked", evt.detail)
        sidebarItemClicked()
    })


    window.document.addEventListener("exportToPGN", evt => {
        console.log("Evt exportToPGN", evt.detail)

	var pgnData = {}
	pgnData.filename = evt.detail
	pgnData.nodes = board.getBoard().nodes
	pgnData.gameInfo = board.getBoard().gameInfo
	ph.exportGameAsPGN(pgnData)	
    })

    
    window.document.addEventListener("boardEdited", evt => {
        console.log("Evt boardEdited" + evt.detail)

        // manual save
        //boardGUI.displayNeedsSaving()

        // autosave
        db.updateGame(board.getBoard().gameInfo, board.getBoard().nodes)
        boardGUI.displaySaved()
        board.setEdited(false)
        board.addVersion(board.getBoard())
        gui.updateDraggableSidebarItem(board.getBoard().gameInfo)
    })


    window.document.addEventListener("squareClicked", evt => {
        console.log("Evt squareClicked", evt.detail)

        var selectedPiece = boardGUI.getSelectedPiece()
        
        if (selectedPiece) {

            var fen = board.getBoard().currentFEN
            if (boardGUI.getPieceFromCoord(fen, board.getCoordFromId(evt.detail))
                == selectedPiece) {

                // remove piece from square
                selectedPiece = undefined
            }


            var newFEN = boardGUI.putPieceToSq(board.getBoard(),
                                               selectedPiece,
                                               evt.detail)

            console.log("set piece to square")
            board.setCurrentFEN(newFEN)
            boardGUI.drawFEN(board)

            // remove highlights
            board.setHlSquares([])
            boardGUI.drawHighlightedSquares(board)
            
        } else {
            board.toggleHighlightedSquare(evt.detail)
        }
        
        var hlSquares = board.getBoard().hlSquares
        
        if (hlSquares.length == 2) {
            
            var start = board.getCoordFromId(hlSquares[0])
            var stop = board.getCoordFromId(hlSquares[1])

            // remove highlights
            board.setHlSquares([])
            boardGUI.drawHighlightedSquares(board)

            
            if (board.getBoard().game_id == "setupBoard") {
                return new Promise(function(resolve, reject) {
                    console.log("updating setupBoard")
                    var fen = board.getBoard().currentFEN
                    var selectedPiece = boardGUI.getPieceFromCoord(fen, start)

                    
                    // delete piece from start square
                    board.setCurrentFEN(boardGUI.putPieceToSq(board.getBoard(),
                                                              undefined,
                                                              hlSquares[0]))

                    // put piece to stop square
                    var newFEN = boardGUI.putPieceToSq(board.getBoard(),
                                                       selectedPiece,
                                                       hlSquares[1])

                    board.setCurrentFEN(newFEN)
                    boardGUI.drawFEN(board)

                    // update FEN input
                    var FENinp = window.document.getElementById("setupBoardFENInput")
                    FENinp.value = newFEN
                        
                    resolve(0)
                    
                })
                
            } else {
            
                return board.makeMove(start, stop).then( nodeIndx => {
                    
                // update notation
                    updateBoardAndNotation(nodeIndx)
                    
                }).catch(function (e) {
                    alert ("Error: " + (e.stack || e))
                })

            }
            
        } else {

            // highlight selected square
            boardGUI.drawHighlightedSquares(board)
        }
        
    })


    window.document.addEventListener("moveClicked", evt => {
        console.log("Evt moveClicked", evt.detail)
        selectMove(evt.detail)
    })

    
    window.document.addEventListener("dbEntryClicked", evt => {
        console.log("Evt dbEntryClicked", evt.detail)

        loadEntry(evt.detail.entry, evt.detail.starred)
        
    })

    window.document.addEventListener("pinEntryEvt", evt => {
        console.log("Evt pinEntryEvt")

        var gameInfo = board.getBoard().gameInfo
        console.log("gameInfo", gameInfo)
        
        // add game to sidebar
        var title = gameInfo.white + " - " + gameInfo.black
        var id = gameInfo.id
        
        if (gui.getDraggableSidebarItemIndx(id) == -1) {
            
            gui.drawSidebarItem({container: gameContainer,
                                 id: id,
                                 title: title,
                                 draggable: true})
            
            makeDraggableSidebarItemClickable(id)
            gui.addToDraggableSidebarItems(id, title)
        }
        
        
    })    

    
    window.document.addEventListener("starEntry", evt => {
        console.log("Evt starEntry", evt.detail)
        db.starEntry(evt.detail)
    })


    window.document.addEventListener("saveEntry", evt => {
        console.log("Evt saveEntry")
        db.updateGame(board.getBoard().gameInfo, board.getBoard().nodes)
        boardGUI.displaySaved()
        board.setEdited(false)
        board.addVersion(board.getBoard())
        gui.updateDraggableSidebarItem(board.getBoard().gameInfo)
    })

    
    window.document.addEventListener("setSortOrder", evt => {
        console.log("Evt setSortOrder", evt.detail)

        if (db.searchParams.orderBy == evt.detail) {
            // reset search order
            db.searchParams.orderBy = 'id'
        } else {
            db.searchParams.orderBy = evt.detail
        }
        drawDBEntries()
    })


    window.document.addEventListener("insertEngineMove", evt => {
        console.log("Evt insertEngineMove", evt.detail)
    })


    window.document.addEventListener("promoteVariation", evt => {
        console.log("Evt promoteVariation")

        board.promoteVariationHandler().then( newHlNodeIndx => {
            return updateBoardAndNotation(newHlNodeIndx)
        })
    })

    
    window.document.addEventListener("insertNAG", evt => {
        console.log("Evt insertNAG", evt.detail)

        board.insertNAGHandler(evt.detail).then( newHlNodeIndx => {
            return updateBoardAndNotation(newHlNodeIndx)
        })
    })

    
    window.document.addEventListener("insertNullMove", evt => {
        console.log("Evt insertNullMove")
        
        board.insertNullMoveHandler().then( newHlNodeIndx => {
            return updateBoardAndNotation(newHlNodeIndx)
        })
    })

    
    window.document.addEventListener("stripVariation", evt => {
        console.log("Evt stripVariation")
        
        board.stripVariationHandler().then( newHlNodeIndx => {
            return updateBoardAndNotation(newHlNodeIndx)
        })
    })


    window.document.addEventListener("copyFEN", evt => {
        console.log("Evt copyFEN")
        clipboard.set(board.getBoard().currentFEN, 'text')
    })

    
    window.document.addEventListener("startEngine", evt => {
        console.log("Evt startEngine")
        engine.displayEngineOut()
        engine.displayEngineLines()
        engine.startEngine()
        boardGUI.displayStopEngineButton()
    })
    
    
    window.document.addEventListener("stopEngine", evt => {
        console.log("Evt stopEngine")
        
        engine.stopEngine()
        boardGUI.displayStartEngineButton()
    })


    window.document.addEventListener("duplicateGame", evt => {
        console.log("Evt duplicateGame")
        var currentBoard = board.getBoard()
        
        return db.addGame(currentBoard.gameInfo, currentBoard.nodes).then(game_id => {
            alert("Game has been duplicated!")            
            return db.getEntry(game_id)
            
        }).then( entry => {
            console.log("loading", entry)
            loadEntry(entry, entry.star)
            
        }).catch(function(e) {
	    alert(e.error)
	})
    })


    window.document.addEventListener("deleteGame", evt => {
        console.log("Evt deleteGame")

        return db.deleteGame(board.getBoard().gameInfo.id).then( id => {
            console.log("deleted game", id)
            sidebarItemClicked()
            
            var sidebarItem = window.document.getElementById("sidebarItem" + id)
            if (sidebarItem) {
                gui.removeSidebarItem(id)
            }

            return 0
	}).then( () => {

            alert("Game has been deleted!")
            drawDBEntries()
        })
      
    })


    window.document.addEventListener("searchPosition", evt => {
        console.log("Evt searchPosition")
        searchPosition()
    })
    
    
    window.document.addEventListener("insertComment", evt => {
        console.log("Evt insertComment", evt.detail)
        
        var type = evt.detail
        var curBoard = board.getBoard()
        var curNode = window.document.getElementById(curBoard.hlNodeIndx)

        var actNode = curNode
        
        var newComment = window.document.createElement('div')
        var firstNodeIndx = lh.getNextMainlineIndx(lh.rootNode())
        

        // startComment of first node is comment of root node
        if (curBoard.hlNodeIndx == firstNodeIndx &&
            type == 'startComment') {
            
            actNode = window.document.getElementById(lh.rootNode())
        }

            
        // startComment of first node is comment
        if (actNode.id == lh.rootNode()) {
            type = 'comment'
            actNode.parentNode.insertBefore(newComment, actNode.nextSibling)

        } else {
        
            if (type == 'startComment') {
                var actMvNr = window.document.getElementById("mvNr" + actNode.id)
                actNode.parentNode.insertBefore(newComment, actMvNr)
            } else {
                actNode.parentNode.insertBefore(newComment, actNode.nextSibling)
            }
        }

        newComment.classList.add(type)
        newComment.contentEditable = "true"
        newComment.focus()
        
        var comment = curBoard.nodes[actNode.id][type]
        var oldComment = window.document.getElementById(type + actNode.id)
        
        if (comment) {
            newComment.innerHTML = comment
            
            // remove existing comment
            oldComment.parentNode.removeChild(oldComment)
            
        } else {
            newComment.innerHTML =  ''
        }
        
        
        // disable other keyboard eventlisteners for the moment
        window.document.removeEventListener('keydown', window.document.listenForArrowKeys, false)
        // window.document.removeEventListener('keydown', window.document.listenForAlphanumeric, false)
        // window.document.removeEventListener('keyup', window.document.listenForSpace, false)
        
        
        // wait for confirmation
        window.document.addEventListener('keydown', window.document.listenForEnterKey = function (evt) {
            
            if (evt.which === 13) {
                evt.preventDefault()
                // trigger the blur event on newComment
                console.log("Edit comment returned")
                newComment.blur()
            }
            
        }, false)
        
        
        // save/ abort when element loses focus
        newComment.addEventListener("blur", function (evt) {
            
            // re-enable keyboard commands
            enableKeyboardCommands()
            window.document.removeEventListener('keydown', window.document.listenForEnterKey, false)
            
            console.log("Edit comment blurred", newComment.innerHTML)
            
            board.editCommentHandler(newComment.innerHTML,
                                     actNode.id,
                                     type).then( newHlNodeIndx => {
                return updateBoardAndNotation(newHlNodeIndx)
            })
            
        })
        
    })
    
    
    gameContainer.addEventListener("sidebarReordered", evt => {
        
        console.log("Evt sidebarReordered ", evt.detail)
        makeDraggableSidebarItemClickable(evt.detail.id)
        gui.reorderDraggableSidebarItems()

    })


    // sidebar actions

    function makeDraggableSidebarItemClickable(id) {
        var text = window.document.getElementById(id)
        var icon = [...text.parentElement.childNodes].filter(e => e.classList.contains("sidebarItem__icon"))[0]
        
        attachEventListenersToDraggableSidebarItem(text, icon)
    }

    function attachEventListenersToDraggableSidebarItem(text, icon) {

        var id = text.id
        text.addEventListener("click", evt => {
            console.log("Text " + id + " has been clicked")
            sidebarItemClicked()

            game_id = parseInt(id.replace(/^sidebarItem/, ''))
            loadEntryById(game_id)
        })
        
        icon.addEventListener("click", evt => {
            console.log("Icon " + id + " has been clicked")
            sidebarItemClicked()
            gui.removeSidebarItem(id)
            
        })
    }
    
    function attachEventListenersToDraggableSidebarItems () {

        var parent = window.document.querySelector("#sidebar__draggableItems")
        var children = parent.childNodes

        for (var i = 0, len = children.length; i < len; i++) {
            let text = children[i].querySelector(".sidebarItem__text")
            let icon = children[i].querySelector(".sidebarItem__icon")

            if (text && icon) {
                attachEventListenersToDraggableSidebarItem(text, icon)
            }
        }
    }
    
    function maximizeLeftPane() {
        gui.maximizeSplitContainerLeftPane(leftPane, rightPane)
        boardGUI.doResizeSquares()
    }

    function maximizeRightPane() {
        gui.maximizeSplitContainerRightPane(leftPane, rightPane)
    }

    function restorePanes() {
        gui.restoreSplitContainer(leftPane, rightPane)
        boardGUI.doResizeSquares()
    }

    function drawFileImport() {
        gui.drawFileImport({container: window.document.body,
                            filetype: ".pgn",
                            callback: importFileWithImportWorker})
    }

    function importFileWithImportWorker(pgn_file) {

        console.log("importing " + pgn_file)
        var importWorker = fork(path.join(process.cwd(), '/app/importWorker.js'))
        
        importWorker.send({
            importWorker : {startPGNImport : true,
                            pgn_file : pgn_file}
        })
        
            
        importWorker.on('message', (msg) => {
            
            // worker has read one game
            if (msg.importWorker.readGame) {
                var num_games = msg.importWorker.num_games
                var pgnData = msg.importWorker.pgnData
                var nodes = msg.importWorker.nodes
                
                
                console.log('Imported ' + num_games.toString())
                

                var gameInfo = {}               
                gameInfo.star = 0
                gameInfo.white = pgnData['White']
                gameInfo.elow = pgnData['WhiteElo']
                gameInfo.black = pgnData['Black']
                gameInfo.elob = pgnData['BlackElo']
                gameInfo.res = settings.resToEnum(pgnData['Result'])
                gameInfo.event = pgnData['Event']
                gameInfo.site = pgnData['Site']
                gameInfo.round = pgnData['Round']
                gameInfo.date = pgnData['Date']
                gameInfo.tags = []

                // save to DB
                db.addGame(gameInfo, nodes)
                
                // resume reading
                importWorker.send({
                    importWorker : {resumeImport : true}
                })
            }


            // worker has finished reading
            if (msg.importWorker.completedImport) {
                alert("Import completed!")
            }
            
        })

    }

    
    function drawDBEntries() {
        gui.maximizeSplitContainerRightPane(leftPane, rightPane)
        gui.cleanup(rightPane)
        db.queryDBEntries().then((entries) => {
            boardGUI.drawDBEntries({container: rightPane,
                                    entries: entries,
                                    searchInfo: db.searchParams})

            var [low, high, num] = db.getSearchLimits()
            boardGUI.updateNumDBSearchResults(low, high, num)

            enableAwesomplete()

        }).then( () => {
            boardGUI.displaySortIndicator(db.searchParams.orderBy)
        })

    }


    function selectMove (nodeIndx) {

        boardGUI.highlightSAN(nodeIndx)
        board.setHlNodeIndx(nodeIndx)

        var fen = board.getFENfromNodeIndx(nodeIndx)
        board.setCurrentFEN(fen)
        boardGUI.drawFEN(board)
        
        engine.updateEnginePosition(fen)
    }


    function sidebarItemClicked() {
        engine.stopEngine()
        boardGUI.displayStartEngineButton()
        boardGUI.resetCursor(leftPane)
    }


    function loadEntryById(id) {
        return db.getEntry(id).then( entry => {
            console.log("loading", entry)
            loadEntry(entry, entry.star)
        })
    }

    function loadEntry(entry, starred) {

        // The arguments "entry.starred" and "starred" may
        // not be identical if entry is read from memory

        restorePanes()
        gui.cleanup(rightPane)

        // read nodes
        return board.readNodesFromFile(entry).then(rv => {
            
            // reset hlSquares on load
            board.setHlSquares([])
            boardGUI.drawHighlightedSquares(board)

            // update engine position
            engine.displayEngineOut()
            engine.updateEnginePosition(board.getBoard().currentFEN)
            
            boardGUI.drawGameInfo({container: rightPane, gameInfo: board.getBoard().gameInfo})
            boardGUI.drawNotation({container: rightPane, nodes: rv})
            boardGUI.makeMovesSelectable()
            boardGUI.hidePieceSelector()
            boardGUI.drawFEN(board)
            boardGUI.scrollIntoView(board.getBoard().hlNodeIndx)
            boardGUI.highlightSAN(board.getBoard().hlNodeIndx)
            boardGUI.drawGameControlBar({container: rightPane,
                                         board: board.getBoard(),
                                         starred: starred})

            return 0
            
        }).then(() => {

            // context menu
            var pgnContainer = window.document.querySelector('.pgnContainer')
            var gameInfoContainer = window.document.querySelector('.gameInfoContainer')
            menu.createContextMenu(pgnContainer)
            menu.createContextMenu(gameInfoContainer)
            
        })
        
    }
    

    function toggleSearchBar() {
        
        var searchControl = window.document.getElementById("searchControl")
        if (db.searchParams.displaySearchBar) {
            db.searchParams.displaySearchBar = false
            searchControl.classList.add("display__none")
            db.searchParams.searching = false
            
        } else {
            db.searchParams.displaySearchBar = true
            searchControl.classList.remove("display__none")
        }

        db.resetSearchParams()
        boardGUI.resetSearchParams()
        console.log("toggleSearchBar", db.searchParams)

        if (! db.searchParams.searching) {
            drawDBEntries()
        }
    }


    function enableAwesomplete() {
        var white = window.document.getElementById('searchParam_white')
        var black = window.document.getElementById('searchParam_black')
        var event = window.document.getElementById('searchParam_event')
        var tags = window.document.getElementById('searchParam_tags')
        
        var ahWhite = new Awesomplete(white)
        var ahBlack = new Awesomplete(black)
        var ahEvent = new Awesomplete(event)
        var ahTags = new Awesomplete(tags)

        var limit = localStorage.getItem("numAwesompleteSuggestions")

        
        white.addEventListener('input', function() {
            var val = this.value.toLowerCase()
            db.getAWPlayerList(ahWhite, val)
        })

        black.addEventListener('input', function() {
            var val = this.value.toLowerCase()
            db.getAWPlayerList(ahBlack, val)
        })

        event.addEventListener('input', function() {
            var val = this.value.toLowerCase()
            db.getAWEventList(ahEvent, val)
        })

        tags.addEventListener('input', function() {
            var val = this.value.toLowerCase()
            db.getAWTagList(ahTags, val)
        })
        

    }


    function updateNotation(nodeIndx) {
        console.log("update notation")
        
        return new Promise(function(resolve, reject) {
            
            var pgnContainer = window.document.querySelector('.pgnContainer')
            rightPane.removeChild(pgnContainer)
            boardGUI.drawNotation({container: rightPane, nodes: board.getBoard().nodes})
            boardGUI.makeMovesSelectable()
            
            // update board
            selectMove(nodeIndx)
            
            if (board.getBoard().edited) {
                boardGUI.makeBoardEdited(board)
            }
            
            resolve(0)       
        })
    }
    

    function updateBoardAndNotation(nodeIndx) {
        
        return updateNotation(nodeIndx).then( () => {
            console.log("update context menu")
            var pgnContainer = window.document.querySelector('.pgnContainer')
            var gameInfoContainer = window.document.querySelector('.gameInfoContainer')
            menu.createContextMenu(pgnContainer)
            menu.createContextMenu(gameInfoContainer)
            
            return 0
        })
    }


    function setupPosition() {
        console.log("setup position")
        restorePanes()
        gui.cleanup(rightPane)
        engine.hideEngineOut()
        boardGUI.showPieceSelector()

        return board.createSetupBoard().then(rv => {

            // reset hlSquares on load
            board.setHlSquares([])
            boardGUI.drawHighlightedSquares(board)
                        
            boardGUI.drawFEN(board)
            boardGUI.drawSearchInfo(rightPane)

            return 0
            
        })
    }


    function enableKeyboardCommands() {

        // arrow keys
        window.document.addEventListener('keydown', window.document.listenForArrowKeys = function (evt) {
            
            if (evt.which === 37) {

                var startEngineBtn = window.document.getElementById("startEngineBtn")
                if (!startEngineBtn) {
                    console.log("no move to select")
                    return
                }
                
                var hlNodeIndx = board.getBoard().hlNodeIndx

                if (hlNodeIndx == lh.rootNode()) {
                    console.log("no move to select")
                    return
                }
                
                var prevNodeIndx = board.getBoard().nodes[hlNodeIndx]['parentIndx']
                console.log("keyboard select prevMove", prevNodeIndx)
                boardGUI.scrollIntoView(prevNodeIndx)
                selectMove(prevNodeIndx)
                
	    } else if (evt.which === 39) {

                var startEngineBtn = window.document.getElementById("startEngineBtn")
                if (!startEngineBtn) {
                    console.log("no move to select")
                    return
                }
                
                var nextNodeIndx = lh.getNextMainlineIndx(board.getBoard().hlNodeIndx)
                if (board.getBoard().nodes[nextNodeIndx] == undefined) {
                    console.log("no move to select")
                    return
                }
                
                console.log("keyboard select nextMove", nextNodeIndx)
                boardGUI.scrollIntoView(nextNodeIndx)
                selectMove(nextNodeIndx)
                
	    }	    
            
        }, false)
    }


    function searchPosition() {

        db.resetSearchParams()
        
        db.searchParams['displaySearchBar'] = true
        db.searchParams['searching'] = true
        db.searchParams['fen'] = board.getBoard().currentFEN.split(' ')[0]
        
        drawDBEntries()
    }

    
    module.passContextMenu = function(contextMenu) {
        menu.menues['contextMenu'] = {menu: contextMenu, initialized: false}
    }
    
    
    // startup
    module.init = function() {

        //window.document.title = "ChessFriend-Fire"
        console.log("function window.js init")

        // load default settings
        settings.setDefaults()

        // draw navbar
        gui.drawSidebarItem({container: navbarContainer, title: '<span class="sidebarIcon"><i class="fa">&#xf1c0;</i></span>Database', callbackOnClick: drawDBEntries})
        gui.drawSidebarItem({container: navbarContainer, title: '<span class="sidebarIcon">&#x265F;</span>Setup position', callbackOnClick: setupPosition})
        gui.drawSidebarItem({container: navbarContainer, title: '<span class="sidebarIcon"><i class="fa">&#xf019;</i></span>Import PGN', callbackOnClick: drawFileImport})
        // gui.drawSidebarItem({container: navbarContainer, title: "MaxBoard", callbackOnClick: maximizeLeftPane})
        // gui.drawSidebarItem({container: navbarContainer, title: "MaxNotation", callbackOnClick: maximizeRightPane})
        // gui.drawSidebarItem({container: navbarContainer, title: "Restore", callbackOnClick: restorePanes})
       
        
        // draggable sidebar items
        gui.drawSidebarSeparator(navbarContainer)
        gui.drawDummySidebarItem(gameContainer)
        gui.guiElements.draggableSidebarItems = JSON.parse(localStorage.getItem('draggableSidebarItems'))

        var sdbi = gui.guiElements.draggableSidebarItems
        for (var i = 0, len = sdbi.length; i < len; i++) {
            gui.drawSidebarItem({container: gameContainer,
                                 id: sdbi[i].id,
                                 title: sdbi[i].title,
                                 draggable: true})
        }
        attachEventListenersToDraggableSidebarItems()

        
        // make sidebar resizable
        rh.makeResizable(mainContainer, leftPanel, rightPanel, handle)
        rh.restoreSidebar(leftPanel, rightPanel,
                          parseFloat(localStorage.getItem('sidebarRatio')))
        

        // draw chessboard for later reference
        boardGUI.drawChessboardWithCoords(leftPane)


        // engine
        engine.drawEngineOutput(leftPane)
        engine.initEngine()
        engine.hideEngineLines()


        // pieceSelector
        boardGUI.drawPieceSelector(leftPane)


        // get actual DB count from DB
        db.initSearchParams().then(() => {
            // drawDBEntries
            drawDBEntries()
        })


        // keyboard navigation
        enableKeyboardCommands()
        
    }


         
    return module
}
