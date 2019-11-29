
module.exports = function () {

    var path = require('path')
    var tools = require(path.join(process.cwd(), '/app/tools.js'))
    
    var PGNHandler = require(path.join(process.cwd(), '/app/pgn.js'))
    var ph = new PGNHandler()
    
    var ChessHandler = require('chess.js').Chess
    var chess = new ChessHandler()

    var LabelHandler = require(path.join(process.cwd(), '/app/labels.js'))
    var lh = new LabelHandler()
        

    function boardConstructor(dbEntry, nodes) {
        this.flipped = false
        this.hlSquares = []
        this.currentFEN = nodes['1z'].FEN
        this.hlNodeIndx = "1z"
        this.nodes = nodes
        this.annotationsForNode = {}
        this.game_id = dbEntry.id
        this.gameInfo = dbEntry
        this.edited = false
    }


    var board = {}
    var store = {}
   

    var versions = {}
    
    // var stack = {
    //     store: [],
    //     push: function push(element) { this.store.push(element); return this; },
    //     pop: function pop() { return this.store.pop(); }
    // }


    module.toggleHighlightedSquare = function (sq) {

        if (board.hlSquares.includes(sq)) {
            board.hlSquares.pop()
        } else {
            board.hlSquares.push(sq)
        }
        
        console.log("set board.hlSquares: ", board.hlSquares)
    }

    module.getBoard = function() {
        return board
    }

    module.getBoardFromStore = function(id) {
        return store[id]
    }

    module.addVersion = function(board) {

        // add initial version to history
        if (versions[board.game_id] == undefined) {
            versions[board.game_id] = {}
            versions[board.game_id]['currentVersion'] = 0
            versions[board.game_id]['stack'] = []
            versions[board.game_id]['stack'].push(JSON.parse(JSON.stringify(board)))

        } else {

            // add current version
            versions[board.game_id]['currentVersion'] =
                versions[board.game_id]['stack'].length
            
            versions[board.game_id]['stack'].push(JSON.parse(JSON.stringify(board)))
        }

        console.log("board.addVersion", versions[board.game_id])
    }


    module.undoEdit = function () {

        return new Promise(function(resolve, reject) {
            
            if (versions[board.game_id]['currentVersion'] == 0) {
                alert("Already at oldest change")
            } else {
                versions[board.game_id]['currentVersion'] -= 1
                var version = versions[board.game_id]['currentVersion']
                board = versions[board.game_id]['stack'][version]
                console.log("set board version", versions[board.game_id])
            }

            resolve (board.hlNodeIndx)
        })
    }


    module.redoEdit = function () {

        return new Promise(function(resolve, reject) {
            
            if ((versions[board.game_id]['currentVersion'] + 1) ==
                versions[board.game_id]['stack'].length) {
                
                alert("Already at newest change")
                
            } else {
                versions[board.game_id]['currentVersion'] += 1
                var version = versions[board.game_id]['currentVersion']
                board = versions[board.game_id]['stack'][version]
                console.log("set board version", versions[board.game_id])
            }

            resolve (board.hlNodeIndx)
        })
    }
    

    module.flipBoard = function () {

        return new Promise (function(resolve, reject) {

            board.flipped = board.flipped ? false : true

            // adjust hlSquares on each flip
            var flippedHlSquares = []            
            board.hlSquares.forEach( sqId => {

                var id = sqId.replace(/^sq/, '')
                id = 65 - id
                flippedHlSquares.push('sq' + id)
            })
        
            module.setHlSquares(flippedHlSquares)
            resolve (board.flipped)
        })
    }
    
    module.setNodes = function (nodes) {
        console.log("set board.nodes:", nodes)
        board.nodes = nodes
    }

    module.setEdited = function(edited) {
        console.log("set board.edited:", edited)
        board.edited = edited
    }
    
    module.setHlNodeIndx = function (node_id) {
        board.hlNodeIndx = node_id
        console.log("set board.hlNodeIndx:", board.hlNodeIndx)
    }
    
    module.getFENfromNodeIndx = function(nodeIndx) {
        return board.nodes[nodeIndx]['FEN']
    }
    
    module.setCurrentFEN = function (fen) {
        board.currentFEN = fen
        console.log("set board.currentFEN:", board.currentFEN)
    }

    module.setHlSquares = function (hlSquares) {
        board.hlSquares = hlSquares
        console.log("set board.hlSquares: ", board.hlSquares)
    }

    module.readNodesFromFile = function(entry) {

        return new Promise(function(resolve, reject) {

            if (store[entry.id] != undefined) {

                console.log("Reading nodes for " + entry.id + " from store", store)
                board = store[entry.id]
                resolve(board.nodes)
                
            } else {
                               
                var pgn_file = ph.pathFromNumber(entry.id)
                console.log("Reading pgn from file " + pgn_file)
                            
                
                ph.readGamesFromFile(pgn_file, function(pgn) {
                    var pgnData = ph.parsePGNData(pgn.pgn)
                    var nodes = ph.pgnMovesToNodes(pgnData['Moves'], pgnData['FEN'])
                    var newBoard = new boardConstructor(entry, nodes)
                    
                    board = newBoard
                    store[entry.id] = newBoard

                    // add version 
                    module.addVersion(board)
                    
                    resolve(nodes)
                })
            }
        })
        
    }

    
    module.createSetupBoard = function() {

        return new Promise(function(resolve, reject) {

            if (store['setupBoard'] != undefined) {

                console.log("Reading nodes for setupBoard from store", store)
                board = store['setupBoard']
                resolve(board.nodes)
                
            } else {
                               
                console.log("Creating new setupBoard")
                            
                var gameInfo = {}
                gameInfo.star = 0
                gameInfo.white = "{White}"
                gameInfo.elow = ""
                gameInfo.black = "{Black}"
                gameInfo.elob = ""
                gameInfo.res = "4"
                gameInfo.event = "{Event}"
                gameInfo.site = "{Site}"
                gameInfo.round = "{Round}"
                gameInfo.date = tools.formatDate(new Date())
                gameInfo.tags = []
                gameInfo.id = ['setupBoard']
                
                var nodes = {}
                nodes['1z'] = {}
                nodes['1z']['FEN'] = tools.getInitialFEN()
                nodes['1z']['branchLevel'] = 0
                nodes['1z']['children'] = []
                
                
                var newBoard = new boardConstructor(gameInfo, nodes)
                    
                board = newBoard
                store['setupBoard'] = newBoard
                
                //console.log(store)
                resolve(nodes)
                
            }
        })
        
    }

    
    module.getCoordFromId = function(sq_id) {
        
        var i = sq_id.substr(2)
        if (board.flipped === true) {
            return 'abcdefgh'[(64-i)%8] + (8-parseInt((i-1)/8)).toString()
        } else {
            return 'abcdefgh'[(i-1)%8] + (parseInt((i-1)/8)+1).toString()
        }
    }


    module.makeMove = function (coordStart, coordStop) {
                
        chess.load(board.currentFEN)
        console.log("sq_start: ", coordStart)
        console.log("sq_stop: ", coordStop)
        
        return new Promise(function(resolve, reject) {

            // no piece to move
            if (chess.get(coordStart) === null) {
                
                reject ("No piece to move on " + coordStart) 
            }        

            var move

            // promotion
            if (chess.get(coordStart).type === 'p' &&
                (coordStop[1] === '8' || coordStop[1] === '1')) {
                
                // TODO: allow promotion to other piece than queen
                move = chess.move({from: coordStart, to: coordStop, promotion: 'q'})
            } else {
                move = chess.move({from: coordStart, to: coordStop})
            }

            // illegal move
            if (move === null) {
                reject ("Illegal move")
            }


            // test if move is new move
            var fen = chess.fen()
            var children = board.nodes[board.hlNodeIndx]['children']

            
            for (var i = 0; i < children.length; i++) {
                if (board.nodes[children[i]]['FEN'] == fen) {
                    // return node index of  known move
                    return resolve(children[i])
                }
            }

            
            // insert new move
            var curNode = board.nodes[board.hlNodeIndx]
            var newNodeIndx = lh.getNextSiblingIndx(board.hlNodeIndx, children.length)

            console.log("Inserting new move", move.san)
            
            board.nodes[board.hlNodeIndx]['children'].push(newNodeIndx)
            board.nodes[newNodeIndx] = {}
            board.nodes[newNodeIndx]['FEN'] = fen
            board.nodes[newNodeIndx]['SAN'] = move.san
            board.nodes[newNodeIndx]['children'] = []
            board.nodes[newNodeIndx]['parentIndx'] = board.hlNodeIndx
            
            if (children.length == 1) {
                // new node is only child
                board.nodes[newNodeIndx]['branchLevel'] = curNode['branchLevel']
            } else {
                board.nodes[newNodeIndx]['branchLevel'] = curNode['branchLevel'] + 1
            }

            // mark board as edited
            board.edited = true
            
            resolve(newNodeIndx)
        })
        
    }


    function promoteVariation (board) {
        
        var selectedNode = board.hlNodeIndx     
        var branchNode = lh.getBranchNode(selectedNode)
        var newCurIndx 
        
        var splitIndx = selectedNode
        while (board.nodes[splitIndx]['parentIndx'] != board.nodes[branchNode]['parentIndx']) {
            splitIndx = board.nodes[splitIndx]['parentIndx']
        }
        
        
        function addOtherNodes(nodeIndx) {
            if (nodeIndx != branchNode && nodeIndx != splitIndx) {
                newNodes[nodeIndx] = board.nodes[nodeIndx]
                
                var children = board.nodes[nodeIndx]['children']
                for (var i = 0, len = children.length; i < len; i++) {
                    addOtherNodes(children[i])
                }
            }
        }
        
        
        var newNodes = {}
        addOtherNodes(lh.rootNode())
        
        
        function renameNode(oldIndx, newIndx, newParentIndx, branchLevelDelta) {
            
            newNodes[newIndx] = board.nodes[oldIndx]
            newNodes[newIndx]['branchLevel'] += branchLevelDelta
            newNodes[newIndx]['parentIndx'] = newParentIndx
            
            if (oldIndx == selectedNode) {
                newCurIndx = newIndx
            }
            
            var mainlineContinuation = lh.getNextMainlineIndx(oldIndx)    
            var children = board.nodes[oldIndx]['children']
            var newChildren = []
            
            for (var i = 0, len = children.length; i < len; i++) {
                
                if (children[i] == mainlineContinuation) {
                    newChildren.push(lh.getNextMainlineIndx(newIndx))
                    renameNode(mainlineContinuation, lh.getNextMainlineIndx(newIndx), newIndx, branchLevelDelta)
                } else {
                    var newChildIndx = newIndx + lh.getChildIndx(children[i]) + 'n'
                    newChildren.push(newChildIndx)
                    renameNode(children[i], newChildIndx, newIndx, branchLevelDelta)
                }
            }
            
            newNodes[newIndx]['children'] = newChildren
            
        }
        
        
        renameNode(branchNode, splitIndx, board.nodes[branchNode]['parentIndx'], +1)
        renameNode(splitIndx, branchNode, board.nodes[branchNode]['parentIndx'], -1)
        
                
        return [newNodes, newCurIndx]
    }
    

    module.promoteVariationHandler = function() {

        return new Promise (function(resolve, reject) {

            if (board.nodes[board.hlNodeIndx]['branchLevel'] == 0) {
                // already mainline
                resolve(board.hlNodeIndx)
                
            } else {    
                
                var [newNodes, newHlNodeIndx] = promoteVariation(board)
                board.nodes = newNodes
                board.hlNodeIndx = newHlNodeIndx
                board.edited = true
                resolve(newHlNodeIndx)
            }
        })
    }


    function stripVariation(board) {
        
        var selectedNode = board.hlNodeIndx
        
        if (selectedNode === lh.rootNode()) {
            return
        }
        
        
        function addOtherNodes(nodeIndx) {
            if (nodeIndx != selectedNode) {
                newNodes[nodeIndx] = board.nodes[nodeIndx]
                
                var children = board.nodes[nodeIndx]['children']
                for (var i = 0, len = children.length; i < len; i++) {
                    addOtherNodes(children[i])
                }
            }
        }
        
        
        var newNodes = {}
        addOtherNodes(lh.rootNode())
        
        
        // remove node from its parent
        var parentIndx = board.nodes[selectedNode]['parentIndx']
        var siblings = board.nodes[parentIndx]['children']
        var newSiblings = []
        
        for (var i = 0, len = siblings.length - 1; i < len; i++) {
            newSiblings.push(lh.getNextSiblingIndx(parentIndx, i))
        }
        newNodes[parentIndx]['children'] = newSiblings
        
        
        // rename siblings
        for (var i = lh.getChildIndx(selectedNode) + 1, len = siblings.length; i < len; i++) {
            
            var branchLevelDelta = (i == 1) ? -1 : 0
            renameSibling(lh.getNextSiblingIndx(parentIndx, i),
                          lh.getNextSiblingIndx(parentIndx, i-1),
                          branchLevelDelta,
                          parentIndx)
        }
        
        
        function renameSibling(oldIndx, newIndx, branchLevelDelta, parentIndx) {
            
            delete newNodes[oldIndx]
            newNodes[newIndx] = board.nodes[oldIndx]
            newNodes[newIndx]['parentIndx'] = parentIndx
            newNodes[newIndx]['branchLevel'] += branchLevelDelta
            
            var children = board.nodes[oldIndx]['children']
            var newChildren = []
            
            for (var i = 0, len = children.length; i < len; i++) {
                var newChildIndx = lh.getNextSiblingIndx(newIndx, i)
                newChildren.push(newChildIndx)
                renameSibling(children[i], newChildIndx, branchLevelDelta, newIndx)
            }
            
            newNodes[newIndx]['children'] = newChildren
            
        }
        
        
        var newHlNodeIndx = parentIndx
        return [newNodes, newHlNodeIndx]
    }
    
    
    module.stripVariationHandler = function() {

        return new Promise (function(resolve, reject) {
            
            var [newNodes, newHlNodeIndx] = stripVariation(board)
            board.nodes = newNodes
            board.hlNodeIndx = newHlNodeIndx
            board.edited = true
            resolve(newHlNodeIndx)
            
        })
    }


    module.insertNAGHandler = function(nag) {
        
        return new Promise (function(resolve, reject) {
            board.nodes[board.hlNodeIndx]['NAG'] = nag
            board.edited = true
            resolve(board.hlNodeIndx)
        })
    }


    function insertNullMove(board) {

        var newBoard = new boardConstructor(board.gameInfo, board.nodes)
        
        // test if move is new move
        var fen = ph.nullMove(board.currentFEN)
        var children = newBoard.nodes[board.hlNodeIndx]['children']
        
        for (var i = 0; i < children.length; i++) {
            if (newBoard.nodes[children[i]]['FEN'] == fen) {
                // null move already inserted
                var newHlNodeIndx = children[i]
                return [board.nodes, newHlNodeIndx]
            }
        }
        
        // insert null move
        var curNode = board.nodes[board.hlNodeIndx]
        var newNodeIndx = lh.getNextSiblingIndx(board.hlNodeIndx, children.length)
        newBoard.hlSquares = []
        newBoard.FEN = fen
        newBoard.hlNodeIndx = newNodeIndx
        newBoard.nodes[board.hlNodeIndx]['children'].push(newNodeIndx)
        newBoard.nodes[newNodeIndx] = {}
        newBoard.nodes[newNodeIndx]['FEN'] = fen
        newBoard.nodes[newNodeIndx]['SAN'] = '--'
        newBoard.nodes[newNodeIndx]['children'] = []
        newBoard.nodes[newNodeIndx]['parentIndx'] = board.hlNodeIndx
        
        if (children.length == 1) {
            // new node is only child
            newBoard.nodes[newNodeIndx]['branchLevel'] = curNode['branchLevel']
        } else {
            newBoard.nodes[newNodeIndx]['branchLevel'] = curNode['branchLevel'] + 1
        }

        return [newBoard.nodes, newBoard.hlNodeIndx]
        
    }
    
    
    module.insertNullMoveHandler = function() {
        
        return new Promise (function(resolve, reject) {

            var [newNodes, newHlNodeIndx] = insertNullMove(board)
            board.nodes = newNodes
            board.hlNodeIndx = newHlNodeIndx
            board.edited = true
            resolve(board.hlNodeIndx)
        })
    }


    function editComment(comment, nodeIndx, type) {
        
        if (comment) {
            board.nodes[nodeIndx][type] = comment
        } else {
            delete board.nodes[nodeIndx][type]
        }

        console.log("Commented", board.nodes)
        
        return [board.nodes, board.hlNodeIndx]
    }

    
    module.editCommentHandler = function(comment, nodeIndx, type) {

        return new Promise (function(resolve, reject) {
            
            var [newNodes, newHlNodeIndx] = editComment(comment, nodeIndx, type)
            board.nodes = newNodes
            board.hlNodeIndx = newHlNodeIndx
            board.edited = true
            resolve(board.hlNodeIndx)
        })
    }

    
    return module
    
}
