// manage board state
module.exports = function (window) {

    var path = require('path')
    var Chess = require('chess.js').Chess
    var tools = require(path.join(process.cwd(), '/app/tools.js'))
    var BoardHandler = require(path.join(process.cwd(), '/app/board.js'))

    var PGNHandler = require(path.join(process.cwd(), '/app/pgn.js'))
    var ph = new PGNHandler()
    
    // reference to current board state
    var bh = new BoardHandler()
    var currentBoard = bh.board

    var SettingsHandler = require(path.join(process.cwd(), '/app/settings.js'))
    var sh = new SettingsHandler()
    
    function triggerGameEditedEvent(game_id) {
	var gameEditedEvent = new CustomEvent("gameEditedEvt", {
	    detail: { id : game_id }
	})
	window.document.dispatchEvent(gameEditedEvent)
    }

    
    function initNodes(game_id, nodes) {

	var stored = sessionStorage.getItem(game_id)

	if (!stored) {

	    // pass nodes to current board
	    currentBoard.nodes = nodes
	    
	    // display notation
	    displayNotation()
	    
	    // display board
	    currentBoard.FEN = nodes['(0)'].FEN
	    displayFEN(currentBoard.FEN, false)

	    // broadcast initial position
	    var boardInitializedEvent = new CustomEvent("boardInitializedEvt", {
		detail: { FEN : nodes['(0)'].FEN }
	    })
	    window.document.dispatchEvent(boardInitializedEvent)

	    // save to session storage
	    currentBoard['id'] = game_id
	    sessionStorage.setItem(game_id, JSON.stringify(currentBoard))
	    
	} else {

	    // restore
	    currentBoard = JSON.parse(stored)

	    // display notation
	    displayNotation()

	    // highlight last move
	    clearHighlightedSAN()
	    clearHighlightedSquares()
	    displayFEN(currentBoard.FEN, currentBoard.flipped)

	    // highlight notation
	    var selectedMove = window.document.getElementById(currentBoard.curNodeIndx)
	    if (selectedMove) { // nodeIndx (0) might not exist
		selectedMove.classList.add('highlightedSAN')
	    }

	    // display board
	    displayFEN(currentBoard.FEN, currentBoard.flipped)

	    // broadcast initial position
	    var boardInitializedEvent = new CustomEvent("boardInitializedEvt", {
		detail: { FEN : currentBoard.FEN }
	    })
	    window.document.dispatchEvent(boardInitializedEvent)
	}
    }


    function displayNotation() {

	var container = window.document.getElementById('notationContainer')
	var notation = ''
	
	ph.traverseNodes(currentBoard.nodes, function(nodeIndx) {
	    notation += ph.nodesToHTML(currentBoard.nodes, nodeIndx)
	})

	
	var PGNContainer = window.document.getElementById('PGNContainer')
	if (!PGNContainer) {
	    PGNContainer = window.document.createElement('div')
	    PGNContainer.id = 'PGNContainer'
	    container.appendChild(PGNContainer)
	}
	PGNContainer.innerHTML = notation

	
	// make moves in notation selectable
	makeMovesSelectable()


	// make container selectable
	PGNContainer.addEventListener('click', function (evt) {
	    if (evt.target.classList.contains('notation')) {
		currentBoard = selectMove('(0)')
		sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	    }
	})
	
    }


    function createSaveBtn() {
	var saveBtn = window.document.createElement('div')
	saveBtn.innerHTML = '<i class="fa">&#xf0c7;</i>'


	var tooltip = document.createElement('span')
	tooltip.innerHTML = 'save'
	tooltip.classList.add('tooltip')
	saveBtn.appendChild(tooltip)
	
	saveBtn.addEventListener('click', function (evt) {
	    var gameSavedEvent = new CustomEvent("gameSavedEvt", {
		detail: { currentBoard : currentBoard }
	    })
	    window.document.dispatchEvent(gameSavedEvent)
	})
	var container = window.document.getElementById('boardControlContainer')
	container.insertBefore(saveBtn, container.firstChild)
    }

    
    function displayGameInfo(container, entry) {

	var infoContainer = window.document.createElement('div')
	var infoTable = window.document.createElement('table')
	
	infoContainer.classList.add("gameInfoContainer")
	infoTable.classList.add("gameInfoTable")
	
	var gameInfo = {}
	var values
	
	if(currentBoard.gameInfo) {
	    values = currentBoard.gameInfo
	} else {
	    values = entry
	}

	for (var i = 0; i < 8; i++) {
	    
	    var tr = window.document.createElement('tr')
	    var desc = window.document.createElement('td')
	    var inputContainer = window.document.createElement('td')
	    var input = window.document.createElement('input')
	    input.setAttribute('type', 'text')
	    input.classList.add("gameInfoInput")
	    
	    switch(i) {
	    case 0:
		desc.innerHTML = 'Event:'
		input.value = values['event']
		input.id = "event_input"
		gameInfo.event = values['event']
		break
	    case 1:
		desc.innerHTML = 'Site:'
		input.value = values['site']
		input.id = "site_input"
		gameInfo.site = values['site']
		break
	    case 2:
		desc.innerHTML = 'Date:'
		input.id = "date_input"
		gameInfo.date = values['date']
		if(entry.date == "") {
		    input.placeholder = "YYYY.DD.MM"
		} else {
		    input.value = values['date']
		}
		break
	    case 3:
		desc.innerHTML = 'Round:'
		input.value = values['round']
		input.id = "round_input"
		gameInfo.round = values['round']
		break
	    case 4:
		desc.innerHTML = 'White:'
		input.value = values['white']
		input.id = "white_input"
		gameInfo.white = values['white']
		break
	    case 5:
		desc.innerHTML = 'Black:'
		input.value = values['black']
		input.id = "black_input"
		gameInfo.black = values['black']
		break
	    case 6:
		desc.innerHTML = 'Result:'

		input = window.document.createElement('select') 
		input.id = "res_input"
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
		
		input.value = values['res']
		gameInfo.res = values['res']
		break
	    case 7:
		desc.innerHTML = 'Tags:'
		input.value = values['tags'].join(', ')
		input.id = "tags_input"
		gameInfo.tags = values['tags']
		break
	    }
	    
	    inputContainer.appendChild(input)
	    tr.appendChild(desc)
	    tr.appendChild(inputContainer)
	    infoTable.appendChild(tr)

	    input.addEventListener('change', function (evt) {

		currentBoard = editGameInfo(currentBoard)
		sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
		
		triggerGameEditedEvent(currentBoard.id)		
	    })
	}

	if (!currentBoard.gameInfo) {
	    currentBoard.gameInfo = gameInfo
	    sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	}

	infoContainer.appendChild(infoTable)
	container.insertBefore(infoContainer, container.firstChild)
    }


    function editGameInfo(board) {
	var newBoard = bh.copyBoard(board)

	var gameInfo = {}
	gameInfo.event = window.document.getElementById("event_input").value
	gameInfo.site = window.document.getElementById("site_input").value
	gameInfo.date = window.document.getElementById("date_input").value
	gameInfo.round = window.document.getElementById("round_input").value
	gameInfo.white = window.document.getElementById("white_input").value
	gameInfo.black = window.document.getElementById("black_input").value
	gameInfo.res = window.document.getElementById("res_input").value
	gameInfo.tags = window.document.getElementById("tags_input").value.replace(/ /g,'').split(',')

	newBoard.gameInfo = gameInfo
	return newBoard
    }

    
    function initChessboard(container){

	// create chess board
	createChessboard(container)
	displayFEN(currentBoard.FEN, false)
	makeBoardClickable()

	// prevent nasty sub-pixel rendering issues
	resizeSquares()
	window.addEventListener("resize", resizeSquares)
	window.document.addEventListener("sidebarResized", resizeSquares)
    }
    

    function createBoardControls(container) {
	
	var div = document.createElement('div')
	div.classList.add('boardControlContainer')
	div.id = 'boardControlContainer'
	
	var flip = document.createElement('div')
	flip.innerHTML = '<i class="fa">&#xf021;</i>'

	var tooltip = document.createElement('span')
	tooltip.innerHTML = 'flip board'
	tooltip.classList.add('tooltip')
	flip.appendChild(tooltip)
	
	flip.addEventListener("click", function(evt) {
	    currentBoard = flipBoard(currentBoard)
	    sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	})
	
	div.appendChild(flip)
	container.appendChild(div)
    }


    function flipBoard(board) {

	var newBoard = bh.copyBoard(board)
	newBoard.flipped = (board.flipped) ? false : true
	
	// clear current highlights
	clearHighlightedSquares()

	
	for (var r = 8; r > 0; r--) {
	    var coord = window.document.getElementById('row' + r.toString())
	    coord.innerHTML = (newBoard.flipped) ? (9-r).toString() : r.toString()
	}
	
	var file_names = (newBoard.flipped) ? "hgfedcba" : "abcdefgh"
	
	for (var i = 1; i < 9; i++) {
	    var coord = window.document.getElementById('col' + i.toString())
	    coord.innerHTML = file_names[i-1]
	}
	
	// reapply highlights
        for (i = 0; i < newBoard['hlSquares'].length; i++) {
            highlightSquareByCoord(newBoard['hlSquares'][i]);
        }


	// display FEN
	displayFEN(newBoard.FEN, newBoard.flipped)
	
	return newBoard
    }


    function highlightSquareById(sq_id) {

	if (window.document.getElementById(sq_id).parentElement
	    .classList.contains('highlightedSquare')){
	    
            window.document.getElementById(sq_id).parentElement
		.classList.remove('highlightedSquare')
	    
	} else {
            window.document.getElementById(sq_id).parentElement
		.classList.add('highlightedSquare')
	}
    }


    function highlightSquareByCoord(coord) {

	var col = 'abcdefgh'.indexOf(coord[0])
	var row = coord[1]

	if (currentBoard.flipped) {
            var n = 64 - (row -1)*8 - col
            highlightSquareById('sq'+ n.toString())
	    
	} else {
            var n = (row -1)*8 + col +1
            highlightSquareById('sq'+ n.toString())
	}
    }


    function getSquareFromCoord(board, coord) {

	var col = 'abcdefgh'.indexOf(coord[0])
	var row = coord[1]

	if (board.flipped) {
            var n = 64 - (row -1)*8 - col
	} else {
            var n = (row -1)*8 + col +1
	}

	return 'sq' + n.toString()
    }
    

    function makeBoardClickable() {
	var x = window.document.getElementsByClassName("innerSquare")
	for (var i = 0; i < x.length; i++) {

	    // include hook for deletion of event listener
	    x[i].addEventListener("click", x[i].fn = function (evt) {
		currentBoard = clickBoard(currentBoard, this.id)
		sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	    }, false)
	}
    }


    function removeClickEventListener() {
	var x = window.document.getElementsByClassName("innerSquare")
	for (var i = 0; i < x.length; i++) {
	    x[i].removeEventListener("click", x[i].fn, false)
	}
    }
    
	
    function makeMovesSelectable() {
	var moves = window.document.getElementsByClassName("selectableMove")
	for (var i = 0; i < moves.length; i++) {
	    moves[i].addEventListener("click", function(evt) {
		currentBoard = selectMove(this.id)
		sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	    })
	}
    }    

    
    function selectMove(nodeIndx) {

	// update board
	clearHighlightedSAN()
	clearHighlightedSquares()
	displayFEN(currentBoard.nodes[nodeIndx]['FEN'], currentBoard.flipped)

	// highlight notation
	var selectedMove = window.document.getElementById(nodeIndx)
	if (selectedMove) { // nodeIndx (0) might not exist
	    selectedMove.classList.add('highlightedSAN')
	}

	// scroll into view
	if (nodeIndx != '(0)' && !tools.isScrolledIntoView(selectedMove)) {
	    selectedMove.scrollIntoView({block: 'center'})
	}

	// trigger custom event
	var moveSelectedEvent = new CustomEvent("moveSelectedEvt", {
	    detail: { FEN : currentBoard.nodes[nodeIndx]['FEN'] }
	})
	window.document.dispatchEvent(moveSelectedEvent)

	// return board with updated state
	var newBoard = bh.copyBoard(currentBoard)
	newBoard.hlSquares = []
	newBoard.curNodeIndx = nodeIndx
	newBoard.FEN = currentBoard.nodes[nodeIndx]['FEN']
	return newBoard
    }


    function getCoordFromId(sq_id, flipped) {
	
	var i = sq_id.substr(2)
	if (flipped === true) {
            return 'abcdefgh'[(64-i)%8] + (8-parseInt((i-1)/8)).toString()
	} else {
            return 'abcdefgh'[(i-1)%8] + (parseInt((i-1)/8)+1).toString()
	}
    }
    

    function highlightSquareOnBoard(board, sq_id) {

	var newBoard = bh.copyBoard(board)
	var coord = getCoordFromId(sq_id, newBoard.flipped)
	
	// deselect square if already selected
	highlightSquareById(sq_id)
	if (newBoard.hlSquares.includes(coord)) {
	    newBoard.hlSquares.splice(newBoard.hlSquares.indexOf(coord), 1)
	} else {
	    newBoard.hlSquares.push(coord)
	}

	return newBoard
    }

    
    function insertMove(board, sq_start, sq_stop) {

	var newBoard = bh.copyBoard(board)
	newBoard.hlSquares[0] = sq_start
	newBoard.hlSquares[1] = sq_stop
	
	var chess = new Chess()
	chess.load(newBoard.FEN)

	// no piece to move
	if (chess.get(newBoard.hlSquares[0]) === null) {
	    clearHighlightedSquares()
	    newBoard.hlSquares = []
	    return newBoard
	}

	var move
	if (chess.get(newBoard.hlSquares[0]).type === 'p' &&
	    ((newBoard.hlSquares[1])[1] === '8' ||
	     (newBoard.hlSquares[1])[1] === '1')) {

	    //promotion
	    // TODO: allow promotion to other piece than queen
	    move = chess.move({from: newBoard.hlSquares[0],
			       to: newBoard.hlSquares[1],
			       promotion: 'q'})
	} else {
	    move = chess.move({from: newBoard.hlSquares[0],
			       to: newBoard.hlSquares[1]})
	}

	// illegal move
	if (move === null) {
	    alert('illegal move')
	    clearHighlightedSquares()
	    newBoard.hlSquares = []
	    return newBoard
	}

	// test if move is new move
	var fen = chess.fen()
	var children = newBoard.nodes[newBoard.curNodeIndx]['children']
	
	for (var i = 0; i < children.length; i++) {
	    if (newBoard.nodes[children[i]]['FEN'] == fen) {
		// select known move
		return selectMove(children[i])
	    }
	}

	// insert new move
	var curNode = currentBoard.nodes[currentBoard.curNodeIndx]
	var newNodeIndx = newBoard.curNodeIndx + '(' + children.length + ')'
	newBoard.hlSquares = []
	newBoard.FEN = fen
	newBoard.curNodeIndx = newNodeIndx
	newBoard.nodes[currentBoard.curNodeIndx]['children'].push(newNodeIndx)
	newBoard.nodes[newNodeIndx] = {}
	newBoard.nodes[newNodeIndx]['FEN'] = fen
	newBoard.nodes[newNodeIndx]['SAN'] = move.san
	newBoard.nodes[newNodeIndx]['children'] = []
	newBoard.nodes[newNodeIndx]['parentIndx'] = currentBoard.curNodeIndx

	if (children.length == 1) {
	    // new node is only child
	    newBoard.nodes[newNodeIndx]['branchLevel'] = curNode['branchLevel']
	} else {
	    newBoard.nodes[newNodeIndx]['branchLevel'] = curNode['branchLevel'] + 1
	}

	clearHighlightedSquares()
	displayNotation()
	selectMove(newNodeIndx)
	triggerGameEditedEvent(currentBoard.id)

	return newBoard
    }
    
    
    function clickBoard(board, sq_id) {

	var newBoard = highlightSquareOnBoard(board, sq_id)
	
	// make move only if start and target squares are defined
	if (newBoard.hlSquares.length != 2) {
	    return newBoard
	}
		
	return insertMove(newBoard, newBoard.hlSquares[0], newBoard.hlSquares[1])
    }


    function displayFEN(fen, flipped) {
	clearBoard()

	fenVisitor(fen, flipped, function(piece, square) {
	    setPieceToSquare(piece, square)
	})

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


    function createMoveIndicator(container) {
	var boardSTM = document.createElement('div')
	boardSTM.id = "boardSTM"
	boardSTM.classList.add("boardSTM")
	boardSTM.innerHTML = '&nbsp;'
	container.appendChild(boardSTM)
    }


    function updateMoveIndicator(fen) {
	var stm = fen.split(' ')[1]
	var boardSTM = window.document.getElementById("boardSTM")
	if (stm == 'w') {
	    boardSTM.innerHTML = '<i class="fa board_wtm">&#xf0c8;</i>'
	    boardSTM.innerHTML += '<span>White to move</span>'
	} else {
	    boardSTM.innerHTML = '<i class="fa board_btm">&#xf096;</i>'
	    boardSTM.innerHTML += '<span>Black to move</span>'
	}
    }
    
    
    function createChessboard(container) {
	
	var table = document.createElement('table')
	table.classList.add("board")
	table.classList.add("game-board")
	
	for (var r = 8; r > 0; r--) {

	    var tr = document.createElement('tr')

	    var coord = document.createElement('td')	    
	    coord.classList.add('coord')
	    coord.id = 'row' + r.toString()
	    coord.innerHTML = (currentBoard.flipped) ? (9-r).toString() : r.toString()

	    tr.appendChild(coord)

	    var row = document.createElement('td')
	    row.classList.add('chessrow')
	    
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

	    }

	    tr.appendChild(row)
	    table.appendChild(tr)
	}


	// File description below the board
	var tr = document.createElement('tr')
	
	var dummy = document.createElement('td')
	dummy.classList.add('coord')
	dummy.innerHTML = '&nbsp'
	tr.appendChild(dummy)

	var coords = document.createElement('td')
	coords.classList.add('chessrow')
	var coord_table = document.createElement('table')
	coord_table.classList.add('board')

	var coord_tr  = document.createElement('tr')
	
	var file_names = (currentBoard.flipped) ? "hgfedcba" : "abcdefgh"
	
	for (var i = 1; i < 9; i++) {
	    var file = document.createElement('td')
	    file.classList.add('coord')
	    file.id = "col" + i.toString()
	    file.innerHTML = file_names[i-1]

	    coord_tr.appendChild(file)
	}
	
	coord_table.appendChild(coord_tr)
	coords.appendChild(coord_table)
	tr.appendChild(coords)
	table.appendChild(tr)
	container.appendChild(table)
    }


    function resizeSquares() {
	
	// fixes an annoying rounding error problem which shows itself
	// in a small white border around a row of chess squares
	var x = window.document.getElementsByClassName("square");

	var elem = window.document.getElementsByClassName("chessrow")[0];

	if (x.length != 0) { 
            var pB = parseFloat(window.getComputedStyle(elem, null).getPropertyValue("width"))/8.0
	    
            for (var i = 0, len = x.length; i < len; i++) {
		x[i].style.paddingBottom = parseInt(pB)+'px'
		x[i].style.width = parseInt(pB)+'px'
            }    
	}    
    }


    function clearHighlightedSquares() {
	var x = window.document.getElementsByClassName("highlightedSquare")
	while (x.length > 0) {
	    x[0].classList.remove("highlightedSquare");
	}
    }
    
    
    function clearHighlightedSAN() {
	var x = window.document.getElementsByClassName("highlightedSAN")
	while (x.length > 0) {
	    x[0].classList.remove("highlightedSAN");
	}	
    }
    
    
    function clearBoard() {
	var i
	for (i = 1; i <= 64; i++) {
	    
            var square = window.document.getElementById("sq"+i.toString())
            if (square.childNodes[0] != null){
		square.removeChild(square.childNodes[0])
            }
	}
    }


    function eraseBoard() {
	var newBoard = bh.copyBoard(currentBoard)
	newBoard.FEN = '8/8/8/8/8/8/8/8 w KQkq - 0 1'
	return newBoard
    }


    function eraseAndUpdateBoard () {
	eraseBoard()
	currentBoard = eraseBoard()
	displayFEN(currentBoard.FEN, currentBoard.flipped)
    }

    
    function putPieceToSq(board, p, sq) {
	
	var pieceDistribution = {}

	// get piece distribution from current fen
	fenVisitor(board.FEN, board.flipped, function(piece, square) {
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


		    var currentPiece = pieceDistribution[squareFromInt(i-1, currentBoard.flipped)]
		    
		    if (currentPiece !== undefined &&
			currentPiece.match(/^(p|b|n|r|q|k|P|B|N|R|Q|K)$/)) {
			
			if (emptySquareCount > 0) {
			    fen += emptySquareCount.toString()
			}
			emptySquareCount = 0
			fen += pieceDistribution[squareFromInt(i-1, currentBoard.flipped)]
		    } else {
			emptySquareCount += 1
		    }
		}

		fen += (emptySquareCount !== 0) ? emptySquareCount : ''
		fen += (r === 1) ? '' : '/'
	    }

	    return fen
	}

	var newBoard = bh.copyBoard(board)
	newBoard.FEN = FENfromPieceDistribution()

	return newBoard
    }


    function getPieceFromCoord(fen, coord) {
	
	var colIndx = "abcdefgh".indexOf(coord[0]) + 1
	var rowIndx = 8 - coord[1]
	var row = fen.split(" ")[0].split('/')[rowIndx]
	
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
    
    
    function putPieceToSqAndUpdateBoard(p, sq) {

	if (p) {
	    // piece has been selected
	    var piece = getPieceFromCoord(currentBoard.FEN, getCoordFromId(sq, currentBoard.flipped))
	    if (piece == p) {
		// piece already there, delete it
		currentBoard = putPieceToSq(currentBoard, undefined, sq)
	    } else {
		// put piece to square
		currentBoard = putPieceToSq(currentBoard, p, sq)
	    }
	    
	} else {

	    var newBoard = highlightSquareOnBoard(currentBoard, sq)

	    if (newBoard.hlSquares.length == 1) {
		return newBoard
		
	    } else if (newBoard.hlSquares.length == 0) {
		// piece has been moved to itself, delete it
		currentBoard = putPieceToSq(newBoard, undefined, sq)
		
	    } else {

		var startSquare = getSquareFromCoord(newBoard, newBoard.hlSquares[0])
		var endSquare = sq
		var piece = getPieceFromCoord(newBoard.FEN, newBoard.hlSquares[0])

		newBoard.hlSquares = []
		clearHighlightedSquares()
	    
		newBoard = putPieceToSq(newBoard, undefined, startSquare)
		currentBoard = putPieceToSq(newBoard, piece, endSquare)
	    }
	}

	displayFEN(currentBoard.FEN, currentBoard.flipped)

    }


    function getFEN() {
	return currentBoard.FEN
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

    
    function validateFEN(fen, stm, mvNr) {

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
	
	var chess = new Chess()
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


    function nextMove() {
	// select next move from child nodes
	var childNode = currentBoard.nodes[currentBoard.curNodeIndx]['children'].sort()[0]
	if(childNode) {
	    currentBoard = selectMove(childNode)
	    sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	}
    }


    function prevMove() {
	// select prev move from parent node
	var parentNode = currentBoard.nodes[currentBoard.curNodeIndx]['parentIndx']
	if(parentNode) {
	    currentBoard = selectMove(parentNode)
	    sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	}
    }

    
    function enableKeyboard() {

	// navigation with arrow keys
	window.document.addEventListener("keydown", window.document.listenForArrowKeys = function (evt) {

	    if (evt.which === 37) {
		prevMove()
	    } else if (evt.which === 39) {
		nextMove()
	    }	    
	}, false)


	// // commenting
	// window.document.addEventListener("keydown", window.document.listenForAlphanumeric = function (evt) {

	//     if (evt.ctrlKey && evt.key === 'c') {
	// 	console.log("action")
	//     }

	// }, false)


	// first engine move
	window.document.addEventListener("keyup", window.document.listenForSpace = function (evt) {
	    
	    if (evt.which === 32) {
		var insertFirstEngineMoveEvent = new CustomEvent("insertFirstEngineMoveEvt", {
		    detail: {}
		})
		window.document.dispatchEvent(insertFirstEngineMoveEvent)
	    }

	}, false)

    }


    function getBranchNode(selectedNode) {

	var branchNode = selectedNode
	var branchIndx = branchNode.match(/\((\d*)\)$/)[1]

	while (branchIndx == "0") {
	    branchNode = branchNode.replace(/\(\d*\)$/, '')
	    
	    // branchNode is already mainline
	    if (branchNode == "") {
		return
	    }
	    
	    branchIndx = branchNode.match(/\((\d*)\)$/)[1]
	}

	return branchNode.replace(/\(\d*\)$/, '(0)')

    }


    function getSplitIndx(branchNode, selectedNode) {
	var splitIndx = 0
	for (var i = 0; i < branchNode.split(")(").length; i++) {
	    if (branchNode.split(")(")[i] !== selectedNode.split(")(")[i]) {
		splitIndx = i
		break
	    }
	}
	
	return splitIndx
    }

    
    function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
    

    function promoteVariation(board) {

	var selectedNode = board.curNodeIndx	
	var branchNode = getBranchNode(selectedNode)
	
	var splitIndx = getSplitIndx(branchNode, selectedNode)
	var replStr = selectedNode.split(")(").slice(0, splitIndx + 1).join(")(")
	if (!replStr.endsWith(')')) {
	    replStr += ')'
	}

	var newNodes = {}
	var newCurNodeIndx = '(0)'
	var branchLevelDelta = board.nodes[replStr]['branchLevel']
	    - board.nodes[branchNode]['branchLevel']
	
	// swap nodes:	
	for (key in board.nodes) {

	    if (key.startsWith(branchNode)) {
		// branchNode => replStr
		var re = new RegExp('^' + escapeRegExp(branchNode))
		var newKey = key.replace(re, replStr)
		newNodes[newKey] = board.nodes[key]
		
	    } else if (key.startsWith(replStr)) {
		// replStr => branchNode
		var re = new RegExp('^' + escapeRegExp(replStr))
		var newKey = key.replace(re, branchNode)
		newNodes[newKey] = board.nodes[key]

		if (key == selectedNode) {
		    newCurNodeIndx = newKey
		}

	    } else {
		newNodes[key] = board.nodes[key]
	    }

	}


	for (key in newNodes) {

	    if (key.startsWith(branchNode)) {
		// branchNode => replStr
		var re = new RegExp('^' + escapeRegExp(branchNode))
		var newKey = key.replace(re, replStr)
		newNodes[key]['branchLevel'] = board.nodes[newKey]['branchLevel'] - branchLevelDelta
		
	    } else if (key.startsWith(replStr)) {
		// replStr => branchNode
		var re = new RegExp('^' + escapeRegExp(replStr))
		var newKey = key.replace(re, branchNode)
		newNodes[key]['branchLevel'] = board.nodes[newKey]['branchLevel'] + branchLevelDelta
	    }

	    
	    var children = newNodes[key]['children']
	    var newChildren = []
	    for (var i = 0, len = children.length; i < len; i++) {

		if (children[i].startsWith(branchNode)) {
		    var re = new RegExp('^' + escapeRegExp(branchNode))
		    newChildren.push(children[i].replace(re, replStr))
		    
		} else if (children[i].startsWith(replStr)) {
		    var re = new RegExp('^' + escapeRegExp(replStr))
		    newChildren.push(children[i].replace(re, branchNode))

		} else {
		    newChildren.push(children[i])
		}
		
	    }
	    newNodes[key]['children'] = newChildren

	    if (newNodes[key]['parentIndx']) {
		if (newNodes[key]['parentIndx'].startsWith(branchNode)) {
	    	    var re = new RegExp('^' + escapeRegExp(branchNode))
	    	    newNodes[key]['parentIndx'] = newNodes[key]['parentIndx'].replace(re, replStr)
		    
		} else if (newNodes[key]['parentIndx'].startsWith(replStr)) {
	    	    var re = new RegExp('^' + escapeRegExp(replStr))
	    	    newNodes[key]['parentIndx'] = newNodes[key]['parentIndx'].replace(re, branchNode)
		    
		}
	    }
	    
	}

	var newBoard = bh.copyBoard(board)
	newBoard.nodes = newNodes
	newBoard.curNodeIndx = newCurNodeIndx
	
	return newBoard
    }
    

    function promoteVariationHandler() {

	var selectedIndx = parseInt(currentBoard.curNodeIndx.match(/\((\d*)\)$/)[1])	
	if (selectedIndx == 0) {
	    // already mainline
	    return
	}
	
	currentBoard = promoteVariation(currentBoard)
	displayNotation()
	selectMove(currentBoard.curNodeIndx)
	sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	triggerGameEditedEvent(currentBoard.id)

    }
    

    function stripVariation(board) {

	var selectedNode = board.curNodeIndx
	
	if (selectedNode === '(0)') {
	    return
	}

	// remove node from its parent
	var parentIndx = board.nodes[selectedNode]['parentIndx']
	var childrenOfParent = board.nodes[parentIndx]['children']
	var childIndx = childrenOfParent.indexOf(selectedNode)
	if (childIndx > -1) {
	    childrenOfParent.splice(childIndx, 1)
	}
	
	var newNodes = {}
	for (key in board.nodes) {
	    if (key.startsWith(selectedNode)) {
		continue
	    } else {
		newNodes[key] = board.nodes[key]
	    }
	}

	// adjust indices
	var adjustIndx = parseInt(selectedNode.match(/\((\d*)\)$/)[1])
	var adjustKey = parentIndx + '(' + (1+adjustIndx).toString() + ')'
	var replKey = parentIndx + '(' + adjustIndx.toString() + ')'
	
	while(board.nodes[adjustKey]) {

	    // replace all occurences of adjustKey with replKey
	    for (key in newNodes) {

		// replace adjustKey in children of newNodes
		var children = newNodes[key]['children']
		for (var i = 0, len = children.length; i < len; i++) {
		    if (children[i].startsWith(adjustKey)) {
			var re = new RegExp('^' + escapeRegExp(adjustKey))
			children[i] = children[i].replace(re, replKey)
		    }
		}

		// replace adjustKey in parents of newNodes
		if (newNodes[key]['parentIndx'] && key.startsWith(adjustKey)) {
	    	    var re = new RegExp('^' + escapeRegExp(adjustKey))
	    	    newNodes[key]['parentIndx'] = newNodes[key]['parentIndx'].replace(re, replKey)
		}

	    }

	    for (key in newNodes) {
		// replace adjustKey in keys 
		if (key.startsWith(adjustKey)) {
		    var re = new RegExp('^' + escapeRegExp(adjustKey))
		    var newKey = key.replace(re, replKey)
		    newNodes[newKey] = newNodes[key]
		    delete newNodes[key]
		}
		
	    }
	    
	    
	    // when stripping main line, promote first child to new main line
	    if (adjustIndx == 0) {
		for (key in newNodes) {
		    if (key.startsWith(replKey)) {
			newNodes[key].branchLevel -= 1
		    }
		}
	    }
	    
	    
	    adjustIndx += 1
	    adjustKey = parentIndx + '(' + (1+adjustIndx).toString() + ')'
	    replKey = parentIndx + '(' + adjustIndx.toString() + ')'
	}
	
	
	
	var newBoard = bh.copyBoard(board)
	newBoard.nodes = newNodes
	newBoard.curNodeIndx = parentIndx
	return newBoard
    }
    

    function stripVariationHandler() {
	currentBoard = stripVariation(currentBoard)	
	displayNotation()
	selectMove(currentBoard.curNodeIndx)
	sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	triggerGameEditedEvent(currentBoard.id)		
    }


    function editComment(comment, board, type) {

	var newBoard = bh.copyBoard(board)	
	if (comment) {
	    newBoard.nodes[board.curNodeIndx][type] = comment
	} else {
	    delete newBoard.nodes[board.curNodeIndx][type]
	}
	return newBoard
    }
    
    
    function insertComment(type) {

	var newComment = window.document.createElement('div')
	newComment.classList.add(type)

	// startComment of first node is comment
	if (currentBoard.curNodeIndx == '(0)') {
	    type = 'comment'
	}

	var curNode = window.document.getElementById(currentBoard.curNodeIndx)

	
	if (type == 'startComment') {
	    var curMvNr = window.document.getElementById("mvNr" + currentBoard.curNodeIndx)
	    curNode.parentNode.insertBefore(newComment, curMvNr)
	} else {
	    curNode.parentNode.insertBefore(newComment, curNode.nextSibling)
	}
	    
	newComment.contentEditable = "true"
	newComment.focus()
	
	var comment = currentBoard.nodes[currentBoard.curNodeIndx][type]
	if (comment) {
	    newComment.innerHTML = comment

	    // remove existing comment
	    var oldComment = window.document.getElementById(type + currentBoard.curNodeIndx)
	    oldComment.parentNode.removeChild(oldComment)
	    
	} else {
	    newComment.innerHTML =  ''
	}

	
	// disable other keyboard eventlisteners for the moment
	window.document.removeEventListener('keydown', window.document.listenForArrowKeys, false)
	window.document.removeEventListener('keyup', window.document.listenForSpace, false)


	// wait for confirmation
	window.document.addEventListener('keydown', window.document.listenForEnterKey = function (evt) {

	    if (evt.which === 13) {
		evt.preventDefault()
		window.document.activeElement.blur() // triggers the blur event on newComment
	    }
	    
	}, false)


	// save/ abort when element loses focus
	newComment.addEventListener("blur", function (evt) {
	    enableKeyboard()
	    window.document.removeEventListener('keydown', window.document.listenForEnterKey, false)
	    currentBoard = editComment(newComment.innerHTML, currentBoard, type)
	    displayNotation()
	    selectMove(currentBoard.curNodeIndx)
	    sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	    triggerGameEditedEvent(currentBoard.id)
	})
	
    }


    function insertNAG(nag) {
	var newBoard = bh.copyBoard(currentBoard)
	newBoard.nodes[currentBoard.curNodeIndx]['NAG'] = nag
	return newBoard
    }
    

    function insertNAGHandler(nag) {
	currentBoard = insertNAG(nag)
	displayNotation()
	selectMove(currentBoard.curNodeIndx)
	sessionStorage.setItem(currentBoard.id, JSON.stringify(currentBoard))
	triggerGameEditedEvent(currentBoard.id)		
    }


    function createDeletionModal() {
	var deletionModal = document.createElement('div')
	deletionModal.classList.add('modal')
	deletionModal.id = 'deletionModal'
	deletionModal.style.display = "flex"
	
	var deletionModalContent = document.createElement('div')
	deletionModalContent.classList.add('modal-content')

	var deletionModalText = document.createElement('div')
	deletionModalText.classList.add('modal-text')
	deletionModalText.innerHTML = 'Do you really want to delete the current game?'
	deletionModalText.innerHTML += ' This action cannot be undone.'


	var btnContainer = document.createElement('div')
	btnContainer.classList.add('modalBtnContainer')
	
	var deletionModalConfirm = document.createElement('div')
	deletionModalConfirm.id = 'deletionModalConfirm'
	deletionModalConfirm.classList.add('btn')
	deletionModalConfirm.innerHTML = 'Delete'

	var deletionModalAbort = document.createElement('div')
	deletionModalAbort.id = 'deletionModalAbort'
	deletionModalAbort.classList.add('btn')
	deletionModalAbort.innerHTML = 'Abort'
	

	deletionModalConfirm.addEventListener('click', function(evt) {
	    var gameDeletedEvent = new CustomEvent("gameDeletedEvt", {
		detail: { game_id : currentBoard.id }
	    })
	    window.document.dispatchEvent(gameDeletedEvent)
	    
	})

	deletionModalAbort.addEventListener('click', function(evt) {
	    console.log("aborted")
	    deletionModal.style.display = 'none'
	})

	deletionModalContent.appendChild(deletionModalText)
	btnContainer.appendChild(deletionModalAbort)
	btnContainer.appendChild(deletionModalConfirm)
	deletionModalContent.appendChild(btnContainer)
	deletionModal.appendChild(deletionModalContent)	
	window.document.body.appendChild(deletionModal)
    }

    
    function deleteGame() {
	createDeletionModal()
    }


    function insertEngineMove(sq_start, sq_stop) {
	currentBoard = insertMove(currentBoard, sq_start, sq_stop)
    }


    function exportGameAsTex(filename) {

	var templateValues = {}
	templateValues.filename = filename
	templateValues.nodes = currentBoard.nodes
	ph.exportGameAsTex(templateValues)
	
    }
    
    module.createMoveIndicator = createMoveIndicator
    module.createBoardControls = createBoardControls
    module.updateMoveIndicator = updateMoveIndicator
    module.initChessboard = initChessboard
    module.initNodes = initNodes
    module.eraseAndUpdateBoard = eraseAndUpdateBoard
    module.removeClickEventListener = removeClickEventListener
    module.putPieceToSqAndUpdateBoard = putPieceToSqAndUpdateBoard
    module.displayGameInfo = displayGameInfo 
    module.getFEN = getFEN
    module.validateFEN = validateFEN
    module.enableKeyboard = enableKeyboard
    module.promoteVariationHandler = promoteVariationHandler
    module.stripVariationHandler = stripVariationHandler
    module.insertComment = insertComment
    module.insertNAGHandler = insertNAGHandler
    module.deleteGame = deleteGame
    module.createSaveBtn = createSaveBtn
    module.insertEngineMove = insertEngineMove
    module.exportGameAsTex = exportGameAsTex
    
    return module
}
