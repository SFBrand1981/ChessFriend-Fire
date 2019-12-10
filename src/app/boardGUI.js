// 
module.exports = function (window, board) {


    var path = require('path')
    var tools = require(path.join(process.cwd(), '/app/tools.js'))
    
    var PGNHandler = require(path.join(process.cwd(), '/app/pgn.js'))
    var ph = new PGNHandler()

    var settingsHandler = require(path.join(process.cwd(), '/app/settings.js'))
    var settings = new settingsHandler(window)

    var ChessHandler = require('chess.js').Chess
    var chess = new ChessHandler()

    var selectedPiece
    
    function toggleSearchBar() {
        
        var toggleSearchBarEvent = new CustomEvent("toggleSearchBar", {
        })
        window.document.dispatchEvent(toggleSearchBarEvent)
    }

    function setupBoardEdited(fen) {
        
        var setupBoardEditedEvent = new CustomEvent("setupBoardEdited", {
            detail: fen
        })
        window.document.dispatchEvent(setupBoardEditedEvent)
    }

    function setupBoardCleared() {
        
        var setupBoardClearedEvent = new CustomEvent("setupBoardCleared", {
        })
        window.document.dispatchEvent(setupBoardClearedEvent)
    }

    function setupPosition(detail) {
        
        var setupPositionEvent = new CustomEvent("setupPosition", {
            detail: detail
        })
        window.document.dispatchEvent(setupPositionEvent)
    }
    
    function loadNextDBPage() {
        
        var loadNextDBPageEvent = new CustomEvent("loadNextDBPage", {
        })
        window.document.dispatchEvent(loadNextDBPageEvent)
    }

    function loadPrevDBPage() {
        
        var loadPrevDBPageEvent = new CustomEvent("loadPrevDBPage", {
        })
        window.document.dispatchEvent(loadPrevDBPageEvent)
    }


    function prevDBGame() {
        var prevDBGameEvent = new CustomEvent("prevDBGame", {
        })
        window.document.dispatchEvent(prevDBGameEvent)
    }


    function nextDBGame() {
        var nextDBGameEvent = new CustomEvent("nextDBGame", {
        })
        window.document.dispatchEvent(nextDBGameEvent)
    }

    
    function editSearchParams(searchParam) {
        
        var editSearchParamsEvent = new CustomEvent("editSearchParams", {
            detail: {key: searchParam.key, value: searchParam.value}
        })
        window.document.dispatchEvent(editSearchParamsEvent)
    }
    
    function makeSquareClickable(sq) {

        var squareClickedEvent = new CustomEvent("squareClicked", {
            detail: sq.id
        })

        sq.addEventListener('click', evt => {
            window.document.dispatchEvent(squareClickedEvent)
        })
    }

    function saveEntry() {
        
        var saveEntryEvent = new CustomEvent("saveEntry", {
        })
        window.document.dispatchEvent(saveEntryEvent)
    }

    function pinEntry() {
        
        var pinEntryEvent = new CustomEvent("pinEntryEvt", {
        })
        window.document.dispatchEvent(pinEntryEvent)
    }

    function flipBoard() {
        
        var flipBoardEvent = new CustomEvent("flipBoard", {
        })
        window.document.dispatchEvent(flipBoardEvent)
    }

    function startEngine() {
        
        var startEngineEvent = new CustomEvent("startEngine", {
        })

        window.document.dispatchEvent(startEngineEvent)
    }

    function stopEngine() {
        
        var stopEngineEvent = new CustomEvent("stopEngine", {
        })

        window.document.dispatchEvent(stopEngineEvent)
    }

    function starEntry(id) {

        var starEntryEvent = new CustomEvent("starEntry", {
            detail: id
        })
        window.document.dispatchEvent(starEntryEvent)
    }

    function setSortOrder(id) {
        
        var setSortOrderEvent = new CustomEvent("setSortOrder", {
            detail: id
        })
        window.document.dispatchEvent(setSortOrderEvent)
    }

    
    function makeDBEntryClickable(entry) {

        var star = window.document.getElementById('star' + entry.id)
        var starred = 0
        if (star.firstChild.classList.contains('starred')) {
            starred = 1
        }
        
        var dbEntryClickedEvent = new CustomEvent("dbEntryClicked", {
            detail: {entry: entry, starred: starred}
        })
        

        window.document.dispatchEvent(dbEntryClickedEvent)
    }


    function makeMoveSelectable(mv) {

        var moveClickedEvent = new CustomEvent("moveClicked", {
            detail: mv.id
        })

        mv.addEventListener('click', evt => {
            window.document.dispatchEvent(moveClickedEvent)
        })

    }


    module.makeBoardEdited = function (board) {
        
        var boardEditedEvent = new CustomEvent("boardEdited", {
            detail: board.getBoard().game_id
        })
        
        window.document.dispatchEvent(boardEditedEvent)
    }

    
    module.updateNumDBSearchResults = function(low, high, num) {

        var from = window.document.getElementById("numFromDBSearchResults")
        var to = window.document.getElementById("numToDBSearchResults")
        var sr = window.document.getElementById("numDBSearchResults")
        if (sr) {
            console.log("update numDBSearchResults", num)
            from.innerHTML = low + " to "
            to.innerHTML = high
            sr.innerHTML = " of " + num
        }
    }


    module.displayNeedsSaving = function() {
        var saveBtn = window.document.getElementById('saveBtn')
        if (saveBtn) {
            saveBtn.classList.add("needsSaving")
        }
    }


    module.displaySaved = function() {
        var saveBtn = window.document.getElementById('saveBtn')
        if (saveBtn) {
            saveBtn.classList.remove("needsSaving")
        }
    }
    
    
    module.makeMovesSelectable = function (nodes) {
       
        console.log("making moves selectable")
        var moves = window.document.getElementsByClassName("selectableMove")
               
        for (let i = 0, len = moves.length; i < len; i++) {
            makeMoveSelectable(moves[i])
        }
    }    


    module.displayStopEngineButton = function() {
        var startBtn = window.document.getElementById("startEngineBtn")
        var stopBtn = window.document.getElementById("stopEngineBtn")
        
        startBtn.classList.add("display__none")
        stopBtn.classList.remove("display__none")
    }
    
    
    module.displayStartEngineButton = function() {
        var startBtn = window.document.getElementById("startEngineBtn")
        var stopBtn = window.document.getElementById("stopEngineBtn")

        if (startBtn) {
            startBtn.classList.remove("display__none")
        }

        if (stopBtn) {
            stopBtn.classList.add("display__none")
        }
    }

    
    module.drawChessboardWithCoords = function(container) {

        var boardContainer = document.createElement('div')
        boardContainer.classList.add('boardContainer')
        
        var table = document.createElement('table')
        table.classList.add("board")
        
        for (var r = 8; r > 0; r--) {

            var tr = document.createElement('tr')

            var coord = document.createElement('td')        
            coord.classList.add('coord')
            coord.id = 'row' + r.toString()
            coord.innerHTML = (board.flipped) ? (9-r).toString() : r.toString()

            tr.appendChild(coord)

            var row = document.createElement('td')
            row.classList.add('rowOfSquares')
            
            var color
            for (var col = 0; col < 8; col++) {


                if (col === 0) {
                    r%2 === 0 ? color = 'white' : color = 'black'
                } else {
                    color === 'white' ? color = 'black' : color = 'white' 
                }
                
                var outer_div = document.createElement('div')
                outer_div.classList.add('square', color)

                var inner_div = document.createElement('div')
                inner_div.classList.add('innerSquare', color)
                var int_id = (r-1)*8 + col +1
                inner_div.id = 'sq' + int_id.toString()

                outer_div.appendChild(inner_div)
                row.appendChild(outer_div)
                
                // make square clickable
                makeSquareClickable(inner_div)


            }

            tr.appendChild(row)        
            table.appendChild(tr)
        }


        // File description below the board
        var tr = document.createElement('tr')

        var dummy = document.createElement('td')
        dummy.classList.add('coord')
        tr.appendChild(dummy)


        var coords = document.createElement('td')
        
        var file_names = (board.flipped) ? "hgfedcba" : "abcdefgh"
        
        for (var i = 1; i < 9; i++) {
            var file = document.createElement('div')
            file.classList.add('fileDescription')
            file.classList.add('coord')
            file.id = "col" + i.toString()
            file.innerHTML = file_names[i-1]

            coords.appendChild(file)
        }
        
        tr.appendChild(coords)
        table.appendChild(tr)


        boardContainer.appendChild(table)
        container.appendChild(boardContainer)

        
    }


    module.drawCoords = function(board) {

	for (var r = 8; r > 0; r--) {
	    var coord = window.document.getElementById('row' + r.toString())
	    coord.innerHTML = (board.flipped) ? (9-r).toString() : r.toString()
	}
	
	var file_names = (board.flipped) ? "hgfedcba" : "abcdefgh"
        
	for (var i = 1; i < 9; i++) {
	    var coord = window.document.getElementById('col' + i.toString())
	    coord.innerHTML = file_names[i-1]
	}
    }


    module.doResizeSquares = function() {
        
        // fixes an annoying rounding error problem which shows itself
        // in a small white border around a row of chess squares
        var x = window.document.getElementsByClassName("square")
        var y = window.document.getElementsByClassName("fileDescription")

        var elem = window.document.getElementsByClassName("rowOfSquares")[0]
        var pB = parseFloat(window.getComputedStyle(elem, null).getPropertyValue("width")/8.0)
        
        if (x.length != 0) {     
            for (var i = 0, len = x.length; i < len; i++) {
                x[i].style.width = parseInt(pB) +'px'
                x[i].style.paddingBottom = parseInt(pB)+'px'
            }    
        }

        if (y.length != 0) {     
            for (var i = 0, len = y.length; i < len; i++) {
                y[i].style.width = parseInt(pB) +'px'
            }    
        }
    }


    module.drawHighlightedSquares = function(board) {
        
        removeClass("highlightedSquare")
        
        // highlight selected squares
        board.getBoard().hlSquares.forEach( sqId => {
            
            var sq = window.document.getElementById(sqId)
            sq.classList.add("highlightedSquare")
        })
        
    }


    module.scrollIntoView = function(nodeIndx) {

        var node = window.document.getElementById(nodeIndx)
        
        // scroll into view
        if (!tools.isScrolledIntoView(window, node)) {
            
            node.scrollIntoView({block: 'center'})
        }
    }
    

    module.highlightSAN = function(id) {
        removeClass("highlightedSAN")
        removeClass("highlightedMv")
        
        var san = window.document.getElementById(id)
        san.classList.add('highlightedSAN')

        
        var mv = window.document.getElementById("mvNr" + id)
        mv.classList.add('highlightedMv')

    }


    module.resetSearchParams = function() {

        var inputs = window.document.getElementsByClassName("searchInfoInput")
        for (var i = 0, len = inputs.length; i < len; i++) {
            inputs[i].value = ""
        }
        
    }
    

    function removeClass(classname) {

        var query = window.document.querySelectorAll("." + classname)
        
        for (let i = 0, len = query.length; i < len; i++) {
            query[i].classList.remove(classname)
        }
    }
    

    function drawDBEntry({container: container,
                          entry: entry}) {

        var tr = document.createElement('tr')

        var td1 = document.createElement('td')
        td1.id = "star" + entry.id
        td1.classList.add('db-entry-star')
        if (entry.star == 1) {
            td1.innerHTML = '<i class="fa starred">&#xf005;</i>'
        } else {
            td1.innerHTML = '<i class="fa">&#xf006;</i>'
        }

        td1.addEventListener('click', function(evt) {
            if (this.firstChild.classList.contains('starred')) {
                this.innerHTML = '<i class="fa">&#xf006;</i>'
            } else {
                this.innerHTML = '<i class="fa starred">&#xf005;</i>'
            }
            starEntry(entry.id)
        })

        var td2 = document.createElement('td')
        td2.classList.add('db-entry-player')
        td2.innerHTML = entry.white

        var td3 = document.createElement('td')
        td3.classList.add('db-entry-dwz')
        td3.innerHTML = entry.elow

        var td4 = document.createElement('td')
        td4.classList.add('db-entry-player')
        td4.innerHTML = entry.black

        var td5 = document.createElement('td')
        td5.classList.add('db-entry-dwz')
        td5.innerHTML = entry.elob

        var td6 = document.createElement('td')
        td6.classList.add('db-entry-res')
        switch (parseInt(entry.res)) {
        case 1: 
            td6.innerHTML = "1-0"
            break
        case 2: 
            td6.innerHTML = "1/2"
            break
        case 3: 
            td6.innerHTML = "0-1"
            break
        case 4: 
            td6.innerHTML = "*"
            break
        }
        
        var td7 = document.createElement('td')
        td7.classList.add('db-entry-event')
        td7.innerHTML = entry.event

        var td8 = document.createElement('td')
        td8.classList.add('db-entry-date')
        td8.innerHTML = entry.date ? entry.date.slice(0,4) : ""


        td2.addEventListener('click', function (evt) {
            makeDBEntryClickable(entry)
        })
        td3.addEventListener('click', function (evt) {
            makeDBEntryClickable(entry)
        })
        td4.addEventListener('click', function (evt) {
            makeDBEntryClickable(entry)
        })
        td5.addEventListener('click', function (evt) {
            makeDBEntryClickable(entry)
        })
        td6.addEventListener('click', function (evt) {
            makeDBEntryClickable(entry)
        })
        td7.addEventListener('click', function (evt) {
            makeDBEntryClickable(entry)
        })
        td8.addEventListener('click', function (evt) {
            makeDBEntryClickable(entry)
        })      

        tr.appendChild(td1)
        tr.appendChild(td2)
        tr.appendChild(td3)
        tr.appendChild(td4)
        tr.appendChild(td5)
        tr.appendChild(td6)
        tr.appendChild(td7)
        tr.appendChild(td8)

        container.appendChild(tr)

    }


    function addEventListenerOnChangeToSearchInfo(input) {
        
        input.addEventListener('change', function (evt) {

            var searchParams = {}
            
            if (input.id == 'searchParam_tags') {
                // array
                searchParams[input.id] = input.value.split(',').map(e => e.trim())
                
            } else {
                // primitive type
                searchParams[input.id] = input.value
            }
            
            console.log("Edited", input.id, input.value)
            editSearchParams({key: input.id, value: searchParams[input.id]})

        })
        
    }
    

    function drawSearchInfoTable(container, searchParams) {

        var searchInfoContainer = document.createElement('div')
        var searchInfoTable = document.createElement('table')
        searchInfoContainer.classList.add("searchInfoContainer")
        searchInfoTable.classList.add("searchInfoTable")
        searchInfoTable.id = "searchInfoTable"

        var searchStatusBar = document.createElement('div')
        searchStatusBar.classList.add("searchStatusBar")
        
        var dummy = document.createElement('div')
        var numRes = document.createElement('div')
        var searchBtn = document.createElement('div')
        searchBtn.id = "searchStatusBarBtn"
        dummy.innerHTML = ""

        var prevDBPage = document.createElement('div')
        var nextDBPage = document.createElement('div')
        prevDBPage.classList.add("searchStatusPager")
        nextDBPage.classList.add("searchStatusPager")
        prevDBPage.innerHTML = '<i class="fa">&#xf104;</i>'
        nextDBPage.innerHTML = '<i class="fa">&#xf105;</i>'


        var numDBSearchResults = document.createElement('span')
        numDBSearchResults.id = "numDBSearchResults"

        var numFromDBSearchResults = document.createElement('span')
        numFromDBSearchResults.id = "numFromDBSearchResults"

        var numToDBSearchResults = document.createElement('span')
        numToDBSearchResults.id = "numToDBSearchResults"

        numRes.appendChild(prevDBPage)
        numRes.appendChild(numFromDBSearchResults)
        numRes.appendChild(numToDBSearchResults)
        numRes.appendChild(numDBSearchResults)
        numRes.appendChild(nextDBPage)
        
        searchBtn.innerHTML = '<i class="fa">&#xf002;</i>'

        searchBtn.addEventListener("click", function(evt) {
            toggleSearchBar()
        })

        prevDBPage.addEventListener("click", function(evt) {
            loadPrevDBPage()
        })

        nextDBPage.addEventListener("click", function(evt) {
            loadNextDBPage()
        })

        searchStatusBar.appendChild(dummy)
        searchStatusBar.appendChild(numRes)
        searchStatusBar.appendChild(searchBtn)

        for (var i = 0; i < 5; i++) {
            var tr = document.createElement('tr')
            var tdDesc = document.createElement('td')
            var tdInput = document.createElement('td')
            var input = document.createElement('input')
            input.classList.add("searchInfoInput")

            switch (i) {
            case 0:
                tdDesc.innerHTML = "FEN:"
                input.id = "searchParam_fen"
                input.value = searchParams['fen']
                break
            case 1:
                tdDesc.innerHTML = "White:"
                input.id = "searchParam_white"
                input.value = searchParams['white']
                break
            case 2:
                tdDesc.innerHTML = "Black:"
                input.id = "searchParam_black"
                input.value = searchParams['black']
                break
            case 3:
                tdDesc.innerHTML = "Event:"
                input.id = "searchParam_event"
                input.value = searchParams['event']
                break
            case 4:
                tdDesc.innerHTML = "Tags:"
                input.id = "searchParam_tags"
                var taglist = searchParams['tags']
                input.value = taglist ? taglist.join(', ') : ""
                break
            }
            
            tdInput.appendChild(input)
            tr.appendChild(tdDesc)
            tr.appendChild(tdInput)
            searchInfoTable.appendChild(tr)
            addEventListenerOnChangeToSearchInfo(input)
        }


        // search controls
        var searchControl = document.createElement('div')
        searchControl.id = "searchControl"
        searchControl.classList.add("searchControl")

        var ignoreColorDiv = document.createElement('div')
        ignoreColorDiv.classList.add("searchControlDiv")
        
        var ignoreColorDesc = document.createElement('div')
        ignoreColorDesc.innerHTML = "Ignore colors"
       
        var ignoreColorOpt = document.createElement('input')
        ignoreColorOpt.type = "checkbox"
        ignoreColorOpt.name = "ignoreColor"

        
        ignoreColorOpt.checked = (searchParams.ignoreColor == false) ? false : true
        ignoreColorOpt.id = "searchParam_ignoreColor"
        addEventListenerOnChangeToSearchInfo(ignoreColorOpt)


        ignoreColorDiv.appendChild(ignoreColorOpt)
        ignoreColorDiv.appendChild(ignoreColorDesc)

        searchControl.appendChild(searchInfoTable)
        searchControl.appendChild(ignoreColorDiv)
        
        searchInfoContainer.appendChild(searchStatusBar)
        searchInfoContainer.appendChild(searchControl)
        container.appendChild(searchInfoContainer)

        
        // hide searchbar if not searching
        if (!searchParams.displaySearchBar) {
            searchControl.classList.add("display__none")
        }

    }


    module.displaySortIndicator = function(id) {
        var sortIndicator = window.document.getElementById("sortIndicatorDown__" + id)
        if (sortIndicator) {
            sortIndicator.classList.add("sorted")
        }
    }

    
    module.drawDBEntries = function({container: container,
                                     entries: entries,
                                     searchInfo: searchInfo}) {
        
        // separate
        var stickyDiv = document.createElement('div')
        stickyDiv.classList.add('stickyOnTop')
        
        var descTable = document.createElement('table')  
        var thead = document.createElement('thead')
        descTable.classList.add('db-entries')


        function createSortableHeaderWithText(container, text, id) {

            var wrapper = document.createElement('div')
            wrapper.classList.add('db-sortable-header')
            
            var sortUp = document.createElement('i')
            sortUp.classList.add('fa')
            sortUp.classList.add('sortIndicator')
            sortUp.innerHTML = "&#xf0de;"

            var sortDown = document.createElement('i')
            sortDown.classList.add('fa')
            sortDown.classList.add('sortIndicator')
            sortDown.innerHTML = "&#xf0dd;"
            sortDown.id = "sortIndicatorDown__" + id

            var div = document.createElement('div')
            div.innerHTML = text
            
            wrapper.appendChild(div)
            wrapper.appendChild(sortDown)
            container.appendChild(wrapper)

            wrapper.addEventListener("click", evt => {
                removeClass("sorted")
                sortDown.classList.add("sorted")
                setSortOrder(id)
            })

        }
        
        for (let i = 0; i < 8; i++) {

            let th = document.createElement('th')
            
            switch (i) {
            case 0:
                th.classList.add('db-entry-star')
                createSortableHeaderWithText(th, '<i class="fa">&#xf006;</i>', 'star')
                break
            case 1:
                th.classList.add('db-entry-player')
                createSortableHeaderWithText(th, 'White', 'white')
                break
            case 2:
                th.classList.add('db-entry-dwz')
                createSortableHeaderWithText(th, 'Elo W', 'elow')
                break
            case 3:
                th.classList.add('db-entry-player')
                createSortableHeaderWithText(th, 'Black', 'black')
                break
            case 4:
                th.classList.add('db-entry-dwz')
                createSortableHeaderWithText(th, 'Elo B', 'elob')
                break
            case 5:
                th.classList.add('db-entry-res')
                // res is not sortable
                // createSortableHeaderWithText(th, 'Res', 'res')
                var wrapper = document.createElement('div')
            
                var div = document.createElement('div')
                div.innerHTML = "Res"

                var dummySort = document.createElement('i')
                dummySort.classList.add('sortIndicator')
                dummySort.innerHTML = "&nbsp;"
                
                wrapper.appendChild(div)
                wrapper.appendChild(dummySort)
                th.appendChild(wrapper)
                break
            case 6:
                th.classList.add('db-entry-event')
                createSortableHeaderWithText(th, 'Event', 'event')
                break
            case 7:
                th.classList.add('db-entry-date')
                createSortableHeaderWithText(th, 'Year', 'date')
                break
            default:
                break
            }

            thead.appendChild(th)
        }

        // prepend searchInfo
        drawSearchInfoTable(stickyDiv, searchParams)

        
        descTable.appendChild(thead)
        stickyDiv.appendChild(descTable)
        container.appendChild(stickyDiv)
        
        var table = document.createElement('table')
        var tbody = document.createElement('tbody')
        
        table.classList.add("db-entries")
        
        for (let i = 0, len = Object.keys(entries).length; i < len; i++) {
            drawDBEntry({container: tbody, entry: entries[i]})
        }


        table.appendChild(tbody)
        container.appendChild(table)
    }
        

    module.drawNotation = function({container: container, nodes: nodes}) {

        var notation = ''
        var pgnContainer = document.createElement('div')
        pgnContainer.classList.add('pgnContainer')
        
        ph.traverseNodes(nodes, function(nodeIndx) {
            notation += ph.nodesToHTML(nodes, nodeIndx)
        })

        pgnContainer.innerHTML = notation
        container.appendChild(pgnContainer)
    }


    module.drawFEN = function(board) {

        clearBoard()        
        var boardParams = board.getBoard()

        fenVisitor(boardParams.currentFEN, boardParams.flipped, function(piece, square) {
            setPieceToSquare(piece, square)
        })
        
    }

    
    function clearBoard() {

        console.log("boardGUI: clearBoard")
        for (var i = 1; i <= 64; i++) {
            
            var square = window.document.getElementById("sq"+i.toString())
            if (square.childNodes[0] != null){
                square.removeChild(square.childNodes[0])
            }
        }
    }

    
    function fenVisitor(fen, flipped, callback) {
        var row = fen.split(" ")[0].split('/')
        var squareCount = 0
        
        row.reverse().forEach( function (r) {
            for (var i = 0; i < r.length; i++) {
                if (isNaN(parseInt(r[i]))) {
                    
                    callback(r[i], squareFromInt(squareCount, flipped))
                    squareCount ++
                    
                } else {
                    // skip empty squares
                    for (var n = 0; n < parseInt(r[i]); n++) {
                        squareCount ++
                    }
                }
            }
        })
    }

    
    function squareFromInt(i, flipped) {        
        if (flipped === true) {
            return "sq"+(64 - i).toString()
        } else {
            return "sq"+(i + 1).toString()
        }
    }

    
    function setPieceToSquare(p, sq) {

        var piece = window.document.createElement("img")
        piece.classList.add('valign')
        piece.classList.add('piecesize')

        switch(p) {
        case 'P':
            piece.src = "../assets/pieces/wp.svg"
            break
        case 'N':
            piece.src = "../assets/pieces/wn.svg"
            break
        case 'B':
            piece.src = "../assets/pieces/wb.svg"
            break
        case 'R':
            piece.src = "../assets/pieces/wr.svg"
            break
        case 'Q':
            piece.src = "../assets/pieces/wq.svg"
            break
        case 'K':
            piece.src = "../assets/pieces/wk.svg"
            break
        case 'p':
            piece.src = "../assets/pieces/bp.svg"
            break
        case 'n':
            piece.src = "../assets/pieces/bn.svg"
            break
        case 'b':
            piece.src = "../assets/pieces/bb.svg"
            break
        case 'r':
            piece.src = "../assets/pieces/br.svg"
            break
        case 'q':
            piece.src = "../assets/pieces/bq.svg"
            break
        case 'k':
            piece.src = "../assets/pieces/bk.svg"
            break
        default:
            //
        }

        if (p != ''){
            window.document.getElementById(sq).appendChild(piece)
        }

    }


    function addTooltip(element, text) {
        var tooltip = document.createElement('span')
        tooltip.innerHTML = text
        tooltip.classList.add('tooltip')
        element.appendChild(tooltip)
        element.classList.add('tooltipContainer')
    }

    
    module.drawGameControlBar = function ({container: container,
                                           board: board,
                                           starred: starred}) {

        var controlContainer = document.createElement('div')
        var star = document.createElement('div')

        
        if (starred) {
            star.innerHTML = '<i class="fa starred">&#xf005;</i>'
        } else {
            star.innerHTML = '<i class="fa">&#xf006;</i>'
        }
        
        star.addEventListener('click', function(evt) {
            if (this.firstChild.classList.contains('starred')) {
                this.innerHTML = '<i class="fa">&#xf006;</i>'
            } else {
                this.innerHTML = '<i class="fa starred">&#xf005;</i>'
            }
            addTooltip(star, 'star')
            starEntry(board.game_id)
        })

        var save = document.createElement('div')
        save.id = "saveBtn"
        save.innerHTML = '<i class="fa">&#xf0c7;</i>'
        save.addEventListener('click', function(evt) {
            saveEntry()
        })

        if (board.edited) {
            save.classList.add("needsSaving")
        }
        
        var trash = document.createElement('div')
        trash.innerHTML = '<i class="fa">&#xf1f8;</i>'
        trash.addEventListener('click', function(evt) {
            //saveEntry()
        })


        var pin = document.createElement('div')
        pin.innerHTML = '<i class="fa">&#xf08d;</i>'
        pin.addEventListener('click', function(evt) {
            pinEntry()
        })


        var clone = document.createElement('div')
        clone.innerHTML = '<i class="fa">&#xf24d;</i>'
        clone.addEventListener('click', function(evt) {
            //cloneEntry()
        })

        var flip = document.createElement('div')
        flip.innerHTML = '<i class="fa">&#xf021;</i>'
        flip.addEventListener('click', function(evt) {
            flipBoard()
        })


        var start = document.createElement('div')
        start.id = "startEngineBtn"
        start.innerHTML = '<i class="fa">&#xf04b;</i>'
        start.addEventListener('click', function(evt) {
            startEngine()
        })

        
        var stop = document.createElement('div')
        stop.id = "stopEngineBtn"
        stop.classList.add('display__none')
        stop.innerHTML = '<i class="fa">&#xf04c;</i>'
        stop.addEventListener('click', function(evt) {
            stopEngine()
        })
     
        var left = document.createElement('div')
        left.innerHTML = '<i class="fa">&#xf060;</i>'
        left.addEventListener('click', function(evt) {
            prevDBGame()
        })

        var right = document.createElement('div')
        right.innerHTML = '<i class="fa">&#xf061;</i>'
        right.addEventListener('click', function(evt) {
            nextDBGame()
        })

        addTooltip(star, 'star')
        addTooltip(save, 'save')
        addTooltip(trash, 'delete')
        addTooltip(pin, 'pin to sidebar')
        addTooltip(clone, 'duplicate')
        addTooltip(flip, 'flip')
        addTooltip(start, 'start engine')
        addTooltip(stop, 'stop engine')
        addTooltip(left, 'prev. game')
        addTooltip(right, 'next game')
        
        controlContainer.classList.add("stickyOnTop")
        controlContainer.classList.add("gameControlContainer")
        controlContainer.appendChild(star)
        // controlContainer.appendChild(save)
        // controlContainer.appendChild(trash)
        // controlContainer.appendChild(clone)
        controlContainer.appendChild(pin)
        controlContainer.appendChild(flip)
        controlContainer.appendChild(start)
        controlContainer.appendChild(stop)
        controlContainer.appendChild(left)
        controlContainer.appendChild(right)
        container.insertBefore(controlContainer, container.firstChild)
        
    }


    module.updateGameInfo = function(gameInfo) {
        var event = window.document.getElementById('gameInfo_event')
        var site = window.document.getElementById('gameInfo_site')
        var round = window.document.getElementById('gameInfo_round')
        var date = window.document.getElementById('gameInfo_date')
        var white = window.document.getElementById('gameInfo_white')
        var elow = window.document.getElementById('gameInfo_elow')
        var black = window.document.getElementById('gameInfo_black')
        var elob = window.document.getElementById('gameInfo_elob')
        var res = window.document.getElementById('gameInfo_res')
        var tags = window.document.getElementById('gameInfo_tags')

        event.value = gameInfo.event
        round.value = gameInfo.round
        date.value = gameInfo.date
        site.value = gameInfo.site
        white.value = gameInfo.white
        elow.value = gameInfo.elow
        black.value = gameInfo.black
        elob.value = gameInfo.elob
        res.value = gameInfo.res
        tags.value = gameInfo.tags.join(", ")
        
    }

    
    module.drawGameInfo = function ({container: container,
                                     gameInfo: gameInfo}) {

        var infoContainer = document.createElement('div')
        var infoTable = document.createElement('table')
        
        infoContainer.classList.add("gameInfoContainer")
        infoTable.classList.add("gameInfoTable")
        
        
        for (var i = 0; i < 10; i++) {
            
            var tr = document.createElement('tr')
            var desc = document.createElement('td')
            var inputContainer = document.createElement('td')
            var input = document.createElement('input')
            input.setAttribute('type', 'text')
            input.classList.add("gameInfoInput")
            
            switch(i) {
            case 0:
                desc.innerHTML = 'Event:'
                input.value = gameInfo['event']
                input.name = "event"
                input.id = 'gameInfo_event'
                break
            case 1:
                desc.innerHTML = 'Site:'
                input.value = gameInfo['site']
                input.name = "site"
                input.id = 'gameInfo_site'
                break
            case 2:
                desc.innerHTML = 'Date:'
                input.value = gameInfo['date']
                input.name = "date"
                input.id = 'gameInfo_date'
                break
            case 3:
                desc.innerHTML = 'Round:'
                input.value = gameInfo['round']
                input.name = "round"
                input.id = 'gameInfo_round'
                break
            case 4:
                desc.innerHTML = 'White:'
                input.value = gameInfo['white']
                input.name = "white"
                input.id = 'gameInfo_white'
                break
            case 5:
                desc.innerHTML = 'Elo White:'
                input.value = gameInfo['elow']
                input.name = "elow"
                input.id = 'gameInfo_elow'
                break
            case 6:
                desc.innerHTML = 'Black:'
                input.value = gameInfo['black']
                input.name = "black"
                input.id = 'gameInfo_black'
                break
            case 7:
                desc.innerHTML = 'Elo Black:'
                input.value = gameInfo['elob']
                input.name = "elob"
                input.id = 'gameInfo_elob'
                break
            case 8:
                desc.innerHTML = 'Result:'

                input = document.createElement('select') 
                input.classList.add("gameInfoSelect")
                optionW = window.document.createElement('option')
                optionD = window.document.createElement('option')
                optionL = window.document.createElement('option')
                optionU = window.document.createElement('option')
                optionW.value = 1
                optionD.value = 2
                optionL.value = 3
                optionU.value = 4
                optionW.innerHTML = '1-0'
                optionD.innerHTML = '1/2-1/2'
                optionL.innerHTML = '0-1'
                optionU.innerHTML = '*'
                input.appendChild(optionW)
                input.appendChild(optionD)
                input.appendChild(optionL)
                input.appendChild(optionU)
                
                input.value = gameInfo['res']
                input.name = "res"
                input.id = 'gameInfo_res'
                break
            case 9:
                desc.innerHTML = 'Tags:'
                input.value = gameInfo['tags'].join(', ')
                input.name = "tags"
                input.id = 'gameInfo_tags'
                break
            }

            addEventListenerOnChangeToInput(input)
            inputContainer.appendChild(input)
            tr.appendChild(desc)
            tr.appendChild(inputContainer)
            infoTable.appendChild(tr)

        }
        
        infoContainer.appendChild(infoTable)
        container.appendChild(infoContainer)
        
    }


    function addEventListenerOnChangeToInput(input) {

        input.addEventListener('change', function (evt) {
            
            var newGameInfo = board.getBoard().gameInfo

            if (input.name == 'tags') {
                // array
                newGameInfo[input.name] = input.value.split(',').map(e => e.trim())
                
            } else {
                // primitive type
                newGameInfo[input.name] = input.value
            }
            
            console.log("Edited", input.name, input.value)
            board.setEdited(true)
            module.makeBoardEdited(board)
        })
        
    }


    module.drawSearchInfo = function(container) {

        var searchInfoContainer = document.createElement('div')
        var searchInfoTable = document.createElement('table')
        searchInfoContainer.classList.add("setupPosition")
        searchInfoTable.classList.add("setupPositionTable")

        var tr1 = document.createElement('tr')
        var td1_1 = document.createElement('td')
        var td1_2 = document.createElement('td')

        td1_1.innerHTML = '<i class="fa">&#xf192;</i>'
        td1_2.colSpan = 2
        td1_2.innerHTML = "Search position in database"
        tr1.classList.add("setupPositionTableRow")
        tr1.classList.add("setupPosition__selected")

        tr1.appendChild(td1_1)
        tr1.appendChild(td1_2)
        searchInfoTable.appendChild(tr1)


        var tr2 = document.createElement('tr')
        var td2_1 = document.createElement('td')
        var td2_2 = document.createElement('td')

        td2_1.innerHTML = '<i class="fa">&#xf10c;</i>'
        td2_2.colSpan = 2
        td2_2.innerHTML = "Create new game from position"
        tr2.classList.add("setupPositionTableRow")
        

        tr2.appendChild(td2_1)
        tr2.appendChild(td2_2)
        searchInfoTable.appendChild(tr2)

        
        var tr3 = document.createElement('tr')
        var td3_1 = document.createElement('td')
        var td3_2 = document.createElement('td')
        var td3_3 = document.createElement('td')

        var inputFEN = document.createElement('input')
        inputFEN.type = "text"
        inputFEN.id = "setupBoardFENInput"
        inputFEN.classList.add("searchInfoInput")
        
        td3_1.innerHTML = ""
        td3_2.innerHTML = "FEN:"
        td3_3.appendChild(inputFEN)

        tr3.appendChild(td3_1)
        tr3.appendChild(td3_2)
        tr3.appendChild(td3_3)
        searchInfoTable.appendChild(tr3)


        var tr4 = document.createElement('tr')
        var td4_1 = document.createElement('td')
        var td4_2 = document.createElement('td')
        var td4_3 = document.createElement('td')

        var selectSTM = document.createElement('select')
        var option1 = document.createElement('option')
        var option2 = document.createElement('option')
        
        selectSTM.classList.add("searchInfoSelect")
        option1.value = 'w'
        option1.innerHTML = "White"
        option2.value = 'b'
        option2.innerHTML = "Black"

        selectSTM.appendChild(option1)
        selectSTM.appendChild(option2)
        
        td4_1.innerHTML = ""
        td4_2.innerHTML = "Side to move:"
        td4_3.appendChild(selectSTM)

        tr4.appendChild(td4_1)
        tr4.appendChild(td4_2)
        tr4.appendChild(td4_3)
        searchInfoTable.appendChild(tr4)



        var tr5 = document.createElement('tr')
        var td5_1 = document.createElement('td')
        var td5_2 = document.createElement('td')
        var td5_3 = document.createElement('td')
        
        var inputMvNr = document.createElement('input')
        inputMvNr.type = "number"
        inputMvNr.min = 1
        inputMvNr.value = 1
        inputMvNr.classList.add("searchInfoInput")
        
        td5_1.innerHTML = ""
        td5_2.innerHTML = "Move &#8470;:"
        td5_3.appendChild(inputMvNr)

        tr5.appendChild(td5_1)
        tr5.appendChild(td5_2)
        tr5.appendChild(td5_3)
        searchInfoTable.appendChild(tr5)

        
        searchInfoContainer.appendChild(searchInfoTable)
        container.appendChild(searchInfoContainer)


        var buttons = document.createElement('div')
        buttons.classList.add('setupPosition__buttons')
        
        
        var btnConfirm = document.createElement('div')
        btnConfirm.innerHTML = 'Search position'

        buttons.appendChild(btnConfirm)
        container.appendChild(buttons)


        btnConfirm.addEventListener("click", function(evt) {

            var detail = {}
            
            if (tr1.classList.contains("setupPosition__selected")) {
                detail['option'] = "search"
                detail['fen'] = board.getBoard().currentFEN
            } else {
                detail['option'] = "createNew"
                detail['fen'] = inputFEN.value
                detail['stm'] = selectSTM.value
                detail['mvNr'] = inputMvNr.value
            }
            
            setupPosition(detail)
        })


        inputFEN.addEventListener("change", function(evt) {
            setupBoardEdited(this.value)
        })

                                  
        tr1.addEventListener("click", function(evt) {

            if(!tr1.classList.contains("setupPosition__selected")) {
                tr1.classList.add("setupPosition__selected")
                tr2.classList.remove("setupPosition__selected")
                tr3.classList.remove("setupPosition__desc-selected")
                tr4.classList.remove("setupPosition__desc-selected")
                tr5.classList.remove("setupPosition__desc-selected")

                td1_1.innerHTML = '<i class="fa">&#xf192;</i>'
                td2_1.innerHTML = '<i class="fa">&#xf10c;</i>'
                btnConfirm.innerHTML = "Search position"
            }
        })
                                  

        tr2.addEventListener("click", function(evt) {
            
            if(!tr2.classList.contains("setupPosition__selected")) {
                tr2.classList.add("setupPosition__selected")
                tr3.classList.add("setupPosition__desc-selected")
                tr4.classList.add("setupPosition__desc-selected")
                tr5.classList.add("setupPosition__desc-selected")
                tr1.classList.remove("setupPosition__selected")

                td2_1.innerHTML = '<i class="fa">&#xf192;</i>'
                td1_1.innerHTML = '<i class="fa">&#xf10c;</i>'
                btnConfirm.innerHTML = "Create new game"
            }
        })
        
    }


    
    function getPieceFromCoord (fen, coord) {
        
        var colIndx = "abcdefgh".indexOf(coord[0]) + 1
        var rowIndx = 8 - coord[1]
        var row = fen.split(" ")[0].split('/')[rowIndx]
        
        if (row == undefined) {
            // invalid fen
            return 
        }
        
        var squareCount = 0
        var piece
        
        for (var i = 0; i < 8; i++) {
            
            if (isNaN(parseInt(row[i]))) {
                piece = row[i]
                squareCount ++
            } else {
                // skip empty squares
                piece = undefined
                squareCount += parseInt(row[i])
            }
            
            if (squareCount >= colIndx) {
                return piece
            }
        }
        
    }

    module.getPieceFromCoord = getPieceFromCoord

    module.putPieceToSq = function(board, p, sq) {
        
        var pieceDistribution = {}
        
        // get piece distribution from current fen
        fenVisitor(board.currentFEN, board.flipped, function(piece, square) {
            pieceDistribution[square] = piece
        })

        // update pieceDistribution
        pieceDistribution[sq] = p


        function FENfromPieceDistribution() {
            var fen = ''
            for (var r = 8; r > 0; r--) {

                var emptySquareCount = 0
                for (var s = 0; s < 8; s++) {
                    var i = (r-1)*8 + s + 1


                    var currentPiece = pieceDistribution[squareFromInt(i-1, board.flipped)]
                    
                    if (currentPiece !== undefined &&
                        currentPiece.match(/^(p|b|n|r|q|k|P|B|N|R|Q|K)$/)) {
                        
                        if (emptySquareCount > 0) {
                            fen += emptySquareCount.toString()
                        }
                        emptySquareCount = 0
                        fen += pieceDistribution[squareFromInt(i-1, board.flipped)]
                    } else {
                        emptySquareCount += 1
                    }
                }

                fen += (emptySquareCount !== 0) ? emptySquareCount : ''
                fen += (r === 1) ? '' : '/'
            }

            return fen
        }

        return FENfromPieceDistribution()
        
    }


    module.resetCursor = function(container) {

        container.classList.remove("bp_cursor")
        container.classList.remove("bn_cursor")
        container.classList.remove("bb_cursor")
        container.classList.remove("br_cursor")
        container.classList.remove("bq_cursor")
        container.classList.remove("bk_cursor")
        container.classList.remove("wp_cursor")
        container.classList.remove("wn_cursor")
        container.classList.remove("wb_cursor")
        container.classList.remove("wr_cursor")
        container.classList.remove("wq_cursor")
        container.classList.remove("wk_cursor")
    }


    module.drawPieceSelector = function(container) {

        var controlContainer = window.document.createElement("div")
        controlContainer.classList.add("setupControlContainer")
        controlContainer.id = "setupControlContainer"
        container.appendChild(controlContainer)

        
        var pieceContainer = window.document.createElement("div")
        pieceContainer.classList.add("pieceContainer")
        pieceContainer.id = "pieceSelector"
        container.appendChild(pieceContainer)


        var flip = document.createElement('div')
        flip.innerHTML = '<i class="fa">&#xf021;</i>'
        flip.addEventListener('click', function(evt) {
            flipBoard()
        })

        var erase = document.createElement('div')
        erase.innerHTML = '<i class="fa">&#xf12d;</i>'
        erase.addEventListener('click', function(evt) {
            setupBoardCleared()
        })

        
        addTooltip(flip, 'flip')
        addTooltip(erase, 'clear board')

        controlContainer.appendChild(flip)
        controlContainer.appendChild(erase)
        
        
        var wpSquare = window.document.createElement("div")
        wpSquare.classList.add("searchSquare")
        var wp = window.document.createElement("img")
        wp.classList.add("pieces")
        wp.id = "P"
        wp.src = '../assets/pieces/wp.svg'
        wpSquare.appendChild(wp)
        pieceContainer.appendChild(wpSquare)

        var bpSquare = window.document.createElement("div")
        bpSquare.classList.add("searchSquare")
        var bp = window.document.createElement("img")
        bp.classList.add("pieces")
        bp.id = "p"
        bp.src = '../assets/pieces/bp.svg'
        bpSquare.appendChild(bp)
        pieceContainer.appendChild(bpSquare)

        var wnSquare = window.document.createElement("div")
        wnSquare.classList.add("searchSquare")
        var wn = window.document.createElement("img")
        wn.classList.add("pieces")
        wn.id = "N"
        wn.src = '../assets/pieces/wn.svg'
        wnSquare.appendChild(wn)
        pieceContainer.appendChild(wnSquare)

        var bnSquare = window.document.createElement("div")
        bnSquare.classList.add("searchSquare")
        var bn = window.document.createElement("img")
        bn.classList.add("pieces")
        bn.id = "n"
        bn.src = '../assets/pieces/bn.svg'
        bnSquare.appendChild(bn)
        pieceContainer.appendChild(bnSquare)

        var wbSquare = window.document.createElement("div")
        wbSquare.classList.add("searchSquare")
        var wb = window.document.createElement("img")
        wb.classList.add("pieces")
        wb.id = "B"
        wb.src = '../assets/pieces/wb.svg'
        wbSquare.appendChild(wb)
        pieceContainer.appendChild(wbSquare)

        var bbSquare = window.document.createElement("div")
        bbSquare.classList.add("searchSquare")
        var bb = window.document.createElement("img")
        bb.classList.add("pieces")
        bb.id = "b"
        bb.src = '../assets/pieces/bb.svg'
        bbSquare.appendChild(bb)
        pieceContainer.appendChild(bbSquare)

        var wrSquare = window.document.createElement("div")
        wrSquare.classList.add("searchSquare")
        var wr = window.document.createElement("img")
        wr.classList.add("pieces")
        wr.id = "R"
        wr.src = '../assets/pieces/wr.svg'
        wrSquare.appendChild(wr)
        pieceContainer.appendChild(wrSquare)

        var brSquare = window.document.createElement("div")
        brSquare.classList.add("searchSquare")
        var br = window.document.createElement("img")
        br.classList.add("pieces")
        br.id = "r"
        br.src = '../assets/pieces/br.svg'
        brSquare.appendChild(br)
        pieceContainer.appendChild(brSquare)
        
        var wqSquare = window.document.createElement("div")
        wqSquare.classList.add("searchSquare")
        var wq = window.document.createElement("img")
        wq.classList.add("pieces")
        wq.id = "Q"
        wq.src = '../assets/pieces/wq.svg'
        wqSquare.appendChild(wq)
        pieceContainer.appendChild(wqSquare)

        var bqSquare = window.document.createElement("div")
        bqSquare.classList.add("searchSquare")
        var bq = window.document.createElement("img")
        bq.classList.add("pieces")
        bq.id = "q"
        bq.src = '../assets/pieces/bq.svg'
        bqSquare.appendChild(bq)
        pieceContainer.appendChild(bqSquare)
        
        var wkSquare = window.document.createElement("div")
        wkSquare.classList.add("searchSquare")
        var wk = window.document.createElement("img")
        wk.classList.add("pieces")
        wk.id = "K"
        wk.src = '../assets/pieces/wk.svg'
        wkSquare.appendChild(wk)
        pieceContainer.appendChild(wkSquare)
        
        var bkSquare = window.document.createElement("div")
        bkSquare.classList.add("searchSquare")
        var bk = window.document.createElement("img")
        bk.classList.add("pieces")
        bk.id = "k"
        bk.src = '../assets/pieces/bk.svg'
        bkSquare.appendChild(bk)
        pieceContainer.appendChild(bkSquare)
        
        var empty_square = window.document.createElement("div")
        empty_square.classList.add("pieces", "empty-square")
        empty_square.id = "0"
        //pieceContainer.appendChild(empty_square)


        var pieces = window.document.getElementsByClassName("pieces")
        
        for (var i = 0; i < pieces.length; i++) {
            pieces[i].addEventListener("click", function(evt) {

                
                if (this.classList.contains("selected")) {
                    this.classList.remove("selected")
                    selectedPiece = undefined
                } else {
                    var selectedPieces = window.document.getElementsByClassName("selected")
                    while (selectedPieces.length > 0) {
                        selectedPieces[0].classList.remove("selected")
                    }
                    this.classList.add("selected")
                    selectedPiece = this.id
                }

                module.resetCursor(container)
                
                switch (selectedPiece) {
                case 'p':
                    container.classList.add("bp_cursor")
                    break
                case 'n':
                    container.classList.add("bn_cursor")
                    break
                case 'b':
                    container.classList.add("bb_cursor")
                    break
                case 'r':
                    container.classList.add("br_cursor")
                    break
                case 'q':
                    container.classList.add("bq_cursor")
                    break
                case 'k':
                    container.classList.add("bk_cursor")
                    break
                case 'P':
                    container.classList.add("wp_cursor")
                    break
                case 'N':
                    container.classList.add("wn_cursor")
                    break
                case 'B':
                    container.classList.add("wb_cursor")
                    break
                case 'R':
                    container.classList.add("wr_cursor")
                    break
                case 'Q':
                    container.classList.add("wq_cursor")
                    break
                case 'K':
                    container.classList.add("wk_cursor")
                    break
                }
                
                console.log("selected piece: " + selectedPiece)
            })
        }

    }


    module.hidePieceSelector = function() {
        var pieceSelector = window.document.getElementById("pieceSelector")
        var scc = window.document.getElementById("setupControlContainer")

        pieceSelector.classList.add("display__none")
        scc.classList.add("display__none")

        // reset selected piece
        selectedPiece = undefined
    }


    module.showPieceSelector = function() {
        var pieceSelector = window.document.getElementById("pieceSelector")
        var scc = window.document.getElementById("setupControlContainer")
        
        pieceSelector.classList.remove("display__none")
        scc.classList.remove("display__none")
    }
    

    module.getSelectedPiece = function() {
        return selectedPiece
    }


    function parseFEN(fen) {
        
        var a = fen.split(/\s/)
        var obj = {}
        try {
            obj['position'] = a[0]
            obj['sideToMove'] = a[1]
            obj['castling'] = a[2]
            obj['enPassant'] = a[3]
            obj['halfmoveClock'] = parseInt(a[4])
            obj['moveNr'] = parseInt(a[5])

            return obj
        } catch {
            console.error('Invalid FEN: ' + fen)
            return 1
        }
    }


    module.validateFEN = function(fen, stm, mvNr) {
        
        var myFEN
        
        // defaults
        stm = (!stm) ? 'w' : stm
        mvNr = (!mvNr) ? 1 : mvNr

        
        if (fen.split(" ").length === 6) {
            // fen appears to be valid fen already, use it
            var parsedFEN = parseFEN(fen)
            myFEN = parsedFEN['position'] + ' ' + stm + ' '
                + parsedFEN['castling'] + ' '
                + parsedFEN['enPassant'] + ' '
                + parsedFEN['halfmoveClock'] + ' ' + mvNr
            
        } else {

            // assume castling rights if king and rook are on their initial squares
            var wkMoved =  (getPieceFromCoord(fen, "e1") === 'K') ? false : true
            var bkMoved =  (getPieceFromCoord(fen, "e8") === 'k') ? false : true
            var wqrMoved = (getPieceFromCoord(fen, "a1") === 'R') ? false : true
            var bqrMoved = (getPieceFromCoord(fen, "a8") === 'r') ? false : true
            var wkrMoved = (getPieceFromCoord(fen, "h1") === 'R') ? false : true
            var bkrMoved = (getPieceFromCoord(fen, "h8") === 'r') ? false : true

            var wCastle = ''
            var bCastle = ''

            if (!wkMoved && !wkrMoved) {wCastle += 'K'}
            if (!wkMoved && !wqrMoved) {wCastle += 'Q'}
            if (!bkMoved && !bkrMoved) {bCastle += 'k'}
            if (!bkMoved && !bqrMoved) {bCastle += 'q'}

            if (wCastle === '' && bCastle === '') { wCastle = '-' }
            
            // ignore half-move clock and en-passant
            myFEN = fen + ' ' + stm + ' ' + wCastle + bCastle + ' - 0 ' + mvNr
        }

        
        var valid = chess.validate_fen(myFEN)
        valid.FEN = myFEN

        function countPieces(p) {
            var re = new RegExp(p, 'g')
            return ((myFEN.split(" ")[0] || '').match(re) || []).length
        }
        
        // additional validity tests
        if (countPieces('K') > 1) { valid.valid = false; valid.error = "More than one white king" }
        if (countPieces('k') > 1) { valid.valid = false; valid.error = "More than one black king" }
        
        if (countPieces('K') === 0) { valid.valid = false; valid.error = "No white king" }
        if (countPieces('k') === 0) { valid.valid = false; valid.error = "No black king" }
        
        if (countPieces('P')  > 8) { valid.valid = false; valid.error = "Too many white pawns" }
        if (countPieces('p') > 8) { valid.valid = false; valid.error = "Too many black pawns" }
        
        return new Promise (function(resolve, reject) {
            if (valid.valid) {
                resolve(valid)
            } else {
                reject(valid)
            }
        })
        
    }


    module.drawVariationModal = function({container: container,
                                          board: board}) {


        // remove existing
        var existing = window.document.getElementById('variationModal')
        if (existing) {
            existing.parentNode.removeChild(existing)
        }
        
        var modal = document.createElement('div')
        modal.classList.add('modal')
        modal.id = 'variationModal'
        
        var modalContent = document.createElement('div')
        modalContent.classList.add('modal-content')

        var modalText = document.createElement('div')
        modalText.classList.add('modal-text')
        modalText.innerHTML = 'Select variation'

        var modalButtons = document.createElement('div')
        modalButtons.classList.add('modal-buttons')

        var modalAbort = document.createElement('div')
        modalAbort.innerHTML = 'Cancel'

        var children = board.nodes[board.hlNodeIndx]['children']
        var varContainer = document.createElement('div')
        varContainer.classList.add('modal-varContainer')
        
        for (var i = 0, len = children.length; i < len; i++) {
            var div = document.createElement('div')
            div.id = children[i]
            var san = board.nodes[children[i]]['SAN']
            var fen = board.nodes[children[i]]['FEN']
            var mvNr = fen.split(' ')[5]
            var sideToMove = fen.split(' ')[1]

            if (sideToMove == 'b') {
                div.innerHTML = mvNr + '. ' + san
            } else {
                div.innerHTML = parseInt(mvNr)-1 + '... ' + san
            }
            varContainer.appendChild(div)
            makeMoveSelectable(div)

            div.addEventListener('click', evt => {
                modal.parentNode.removeChild(modal)
            })
        }
        
        modalAbort.addEventListener('click', evt => {
            modal.parentNode.removeChild(modal)
        })
        
        modalButtons.appendChild(modalAbort)
        modalContent.appendChild(modalText)
        modalContent.appendChild(varContainer)
        modalContent.appendChild(modalButtons)
        modal.appendChild(modalContent)
        
        container.appendChild(modal)


    }

    
    
    return module
}
