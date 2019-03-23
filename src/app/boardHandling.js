//

module.exports = function (window,
			   Container,
			   DB) {

    var Chess = require('chess.js').Chess
    var fs = require('fs')
    var path = require('path')
    var cfdt = require(path.join(process.cwd(), '/app/chessfriendDevTools'))
    
    const { fork } = require('child_process');
    
    var board = {
	FEN : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
	sideToMove : 'w',
	hlSquares : [], // e.g. ['e4', 'c5']
	flipped : false,
	nodes : {},
	nodeIndx : undefined,
	editComment : false,
	editHeader : false,
	numEngineLines : 5,
	Event : "?",
	Site : "?",
	Round : "?",
	Date : "??.??.????",
	White : "?",
	WhiteElo : "?",
	Black : "?",
	BlackElo : "?",
	Result : "?",
	Tags : "",
	selectedPiece : undefined,
	edited : false,
	_DB_Id : undefined,
	_DB_created : undefined
    }


    // Display chess board
    function createChessboard() {
	
	var table = window.document.createElement('table')
	table.classList.add("board")
	table.classList.add("game-board")
	
	for (var r = 8; r > 0; r--) {

	    var tr = window.document.createElement('tr')

	    var coord = window.document.createElement('td')
	    coord.classList.add('coord')
	    coord.id = 'row' + r.toString()
	    coord.innerHTML = (board.flipped) ? (9-r).toString() : r.toString()

	    tr.appendChild(coord)

	    var row = window.document.createElement('td')
	    row.classList.add('chessrow')

	    var color
	    for (var col = 0; col < 8; col++) {


		if (col === 0) {
		    r%2 === 0 ? color = 'white' : color = 'black'
		} else {
		    color === 'white' ? color = 'black' : color = 'white' 
		}
		
		var outer_div = window.document.createElement('div')
		outer_div.classList.add('square', color)

		var inner_div = window.document.createElement('div')
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
	var tr = window.document.createElement('tr')
	
	var dummy = window.document.createElement('td')
	dummy.classList.add('coord')
	dummy.innerHTML = '&nbsp'
	tr.appendChild(dummy)

	var coords = window.document.createElement('td')
	coords.classList.add('chessrow')

	var coord_table = window.document.createElement('table')
	coord_table.classList.add('board')

	var coord_tr  = window.document.createElement('tr')
	
	var file_names = (board.flipped) ? "hgfedcba" : "abcdefgh"
	
	for (var i = 1; i < 9; i++) {
	    var file = window.document.createElement('td')
	    file.classList.add('coord')
	    file.id = "col" + i.toString()
	    file.innerHTML = file_names[i-1]

	    coord_tr.appendChild(file)
	}
	
	coord_table.appendChild(coord_tr)
	coords.appendChild(coord_table)
	tr.appendChild(coords)
	table.appendChild(tr)

	Container.boardContainer.appendChild(table)

	// make table clickable
	var x = window.document.getElementsByClassName("innerSquare")
	for (var i = 0; i < x.length; i++) {
	    x[i].addEventListener("click", function (evt) {
		highlightSquareById(this.id)
		listenForMove()
	    }, false)
	} 
    }


    function getCoordFromId(sq_id) {

	var i = sq_id.substr(2)
	if (board.flipped === true) {
            return 'abcdefgh'[(64-i)%8] + (8-parseInt((i-1)/8)).toString()
	} else {
            return 'abcdefgh'[(i-1)%8] + (parseInt((i-1)/8)+1).toString()
	}
    }


    function clearHighlightedSquares() {

	var x = window.document.getElementsByClassName("highlightedSquare")

	while (x.length > 0) {
	    x[0].classList.remove("highlightedSquare");
	}
	
	board.hlSquares = []

    }


    function uciToSan(u, calcMvNr = true) {
	var chess = new Chess(board.FEN);
	var uci_moves = u.split(" ");
	var san = "";
	
	for (var i = 0; i < uci_moves.length; i++) {
            var f = uci_moves[i][0]+uci_moves[i][1]
            var t = uci_moves[i][2]+uci_moves[i][3]
	    var p = uci_moves[i][4]
	    
	    var parsedFEN = parseFEN(chess.fen())
	    var mvNr
	    if (calcMvNr) {
		if (i === 0) {
		    if (parsedFEN['sideToMove'] === 'w') {
			mvNr = parsedFEN['moveNr'] + '. '
		    } else {
			mvNr = parsedFEN['moveNr'] + '. ... '
		    }
		} else {
		    if (parsedFEN['sideToMove'] === 'w') {
			mvNr = parsedFEN['moveNr'] + '. '
		    } else {
			mvNr = ''
		    }
		}
	    } else {
		mvNr = ''
	    }
	    
            var c = (p === undefined) ? chess.move({from: f, to: t}) : chess.move({from: f, to: t, promotion: p})
            if (c != null) {
		san += mvNr + c['san']+" "
            }
	    
	}
	
	return san;
    }


    function figurine(s) {
	var r = s;
	// r = r.replace(/K/g, "&#9812;");
	// r = r.replace(/Q/g, "&#9813;");
	// r = r.replace(/R/g, "&#9814;");
	// r = r.replace(/B/g, "&#9815;");
	// r = r.replace(/N/g, "&#9816;");

	r = r.replace(/K/g, '<span class="figurine">n</span>');
	r = r.replace(/Q/g, '<span class="figurine">m</span>');
	r = r.replace(/R/g, '<span class="figurine">l</span>');
	r = r.replace(/B/g, '<span class="figurine">j</span>');
	r = r.replace(/N/g, '<span class="figurine">k</span>');

	return r;
    }
    
    
    function highlightSquareById(sq_id) {

	if (window.document.getElementById(sq_id).parentElement.classList.contains('highlightedSquare')){
            window.document.getElementById(sq_id).parentElement.classList.remove('highlightedSquare')
            board.hlSquares.splice(board.hlSquares.indexOf(getCoordFromId(sq_id)), 1)

	} else {

            window.document.getElementById(sq_id).parentElement.classList.add('highlightedSquare')
            board.hlSquares.push(getCoordFromId(sq_id))
	}
    }


    function highlightSquareByCoord(coord) {

	var col = 'abcdefgh'.indexOf(coord[0])
	var row = coord[1]

	if (board.flipped) {
            var n = 64 - (row -1)*8 - col
            highlightSquareById('sq'+ n.toString())

	} else {
            var n = (row -1)*8 + col +1
            highlightSquareById('sq'+ n.toString())
	}
    }


    function setPieceToSquare(p, sq) {

	var piece = window.document.createElement("img")
	piece.classList.add('valign')
	piece.classList.add('piecesize')

	switch(p) {
	case 'P':
            piece.src = "../assets/alternative/wp.svg"
            break
	case 'N':
            piece.src = "../assets/alternative/wn.svg"
            break
	case 'B':
            piece.src = "../assets/alternative/wb.svg"
            break
	case 'R':
            piece.src = "../assets/alternative/wr.svg"
            break
	case 'Q':
            piece.src = "../assets/alternative/wq.svg"
            break
	case 'K':
            piece.src = "../assets/alternative/wk.svg"
            break
	case 'p':
            piece.src = "../assets/alternative/bp.svg"
            break
	case 'n':
            piece.src = "../assets/alternative/bn.svg"
            break
	case 'b':
            piece.src = "../assets/alternative/bb.svg"
            break
	case 'r':
            piece.src = "../assets/alternative/br.svg"
            break
	case 'q':
            piece.src = "../assets/alternative/bq.svg"
            break
	case 'k':
            piece.src = "../assets/alternative/bk.svg"
            break
	default:
            //
	}

	if (p != ''){
            window.document.getElementById(sq).appendChild(piece)
	}

    }


    function displayFEN(fen) {
	clearBoard()
	
	fenVisitor(fen, function(piece, square) {
	    setPieceToSquare(piece, square)
	})
    }


    function insertFEN(fen) {
	displayFEN(fen)
	board.FEN = fen
    }
	

    function fenVisitor(fen, callback) {
	var row = fen.split(" ")[0].split('/')
	var squareCount = 0
	
	row.reverse().forEach( function (r) {
            for (var i = 0; i < r.length; i++) {
		if (isNaN(parseInt(r[i]))) {

		    callback(r[i], squareFromInt(squareCount))
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


    function getPieceFromSquare(fen, sq) {

	var colIndx = "abcdefgh".indexOf(sq[0]) + 1
	var rowIndx = 8 - sq[1]
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
    
    
    function clearBoard() {
	var i
	for (i = 1; i <= 64; i++) {

            var square = window.document.getElementById("sq"+i.toString())
            if (square.childNodes[0] != null){
		square.removeChild(square.childNodes[0])
            }
	}
    }


    function resizeSquares() {
	// fixes an annoying rounding error problem which shows itself
	// in a small white border around a row of chess squares

	var x = window.document.getElementsByClassName("square")
	var elem = window.document.getElementsByClassName("chessrow")[0]

	if (x.length != 0) {
            var pB = parseFloat(window.getComputedStyle(elem, null).getPropertyValue("width"))/8.0

            for (var i = 0; i < x.length; i++) {
		x[i].style.paddingBottom = parseInt(pB)+'px'
            }
	}

    }


    function randomGame() {
	var chess = new Chess()

	while (!chess.game_over()) {
	    var moves = chess.moves()
	    var move = moves[Math.floor(Math.random() * moves.length)]
	    chess.move(move)
	}

	cfdt.log(chess.pgn({max_width: 72}))
    }

    function validateFEN(fen, stm, mvNr, callback) {

	var myFEN 
	
	if (fen.split(" ").length === 6) {
	    // fen appears to be valid fen already, use it
	    var parsedFEN = parseFEN(fen)
	    myFEN = parsedFEN['position'] + ' ' + stm + ' '
		+ parsedFEN['castling'] + ' '
		+ parsedFEN['enPassant'] + ' '
		+ parsedFEN['halfmoveClock'] + ' ' + mvNr
	    
	} else {

	    // assume castling rights if king and rook are on their initial squares
	    var wkMoved =  (getPieceFromSquare(fen, "e1") === 'K') ? false : true
	    var bkMoved =  (getPieceFromSquare(fen, "e8") === 'k') ? false : true
	    var wqrMoved = (getPieceFromSquare(fen, "a1") === 'R') ? false : true
	    var bqrMoved = (getPieceFromSquare(fen, "a8") === 'r') ? false : true
	    var wkrMoved = (getPieceFromSquare(fen, "h1") === 'R') ? false : true
	    var bkrMoved = (getPieceFromSquare(fen, "h8") === 'r') ? false : true

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
	if (countPieces('K') > 1) { valid.valid = false; valid.error = "Two white kings" }
	if (countPieces('k') > 1) { valid.valid = false; valid.error = "Two black kings" }
	
	if (countPieces('K') === 0) { valid.valid = false; valid.error = "No white king" }
	if (countPieces('k') === 0) { valid.valid = false; valid.error = "No black king" }
	
	if (countPieces('P')  > 8) { valid.valid = false; valid.error = "Too many white pawns" }
	if (countPieces('p') > 8) { valid.valid = false; valid.error = "Two many black pawns" }

	
	if (callback) {
	    callback(valid)
	}
    }


    function readPGN(pgn_file, callback) {
	
	fs.readFile(pgn_file, 'utf8', function (err, data) {
            if (err) {
		cfdt.info("There was an error attempting to read your data.")
		cfdt.warn(err.message)
		return
            } else {
		readGamesFromData(data, callback)
            }
	})
    }


    function readGamesFromData(data, callback) {

	var games = data.split(/(\[Event\s.*\])/)
	var i = -1;
	var num_games = 0
		
	for (var n = 0; n < games.length /2 - 1; n++) {

	    i += 2
	    num_games += 1
	    var game = games[i] + games[i+1]
	    
	    importOneGame(game, callback)
	}
	return
    }


    function importOneGame(game, callback) { 
	
	// replace newlines with spaces
	game = game.replace(/\r?\n|\r/g, ' ')
	var re = /\[[^%].*?\]/g

	var pgn = {}
	
	while(true) {

	    var match_header = re.exec(game)
	    
	    if(match_header) {

		var header = match_header[0]
		var kv = header.match('\\[(.*)\\s"(.*)"\\]')


		if (kv !== null && kv[1] && kv[2]) {
		    pgn[kv[1]] = kv[2]
		} else {
		    cfdt.log('Invalid PGN-header: ' + header)
		}

	    } else {

		var moves = game.replace(/\[[^%].*?\]/g, '')

		// Remove all spaces except in comments
		//var moves = pgn['Moves'].replace(/\s(?=(((?!}).)*{)|[^{}]*$)/g, '')
		
		// Separate NAGs by whitespace
		moves = moves.replace(/\$/g, ' $')

		// Separate comments by whitespace
		moves = moves.replace(/{/g, ' { ')
		moves = moves.replace(/}/g, ' } ')

		// Separate variations by whitespace
		moves = moves.replace(/\(/g, ' ( ')
		moves = moves.replace(/\)/g, ' ) ')

		// Separate move numbers by whitespace
		// outside comments
		moves = moves.replace(/(\d+)(\.)+(?=(((?!}).)*{)|[^{}]*$)/g, '$1. ')
		// inside comments
		moves = moves.replace(/(\d+\.)(\.+)(?=((?!{).)*?})/g, '$1 $2')

		
		// Remove repeated whitespace
		moves = moves.replace(/\s\s+/g, ' ')

		// Delete leading whitespace
		moves = moves.trim()


		pgn['Moves'] = moves

		// Test required fields
		if (pgn['Event']  === undefined || 
		    pgn['Site']   === undefined ||
		    pgn['Date']   === undefined ||
		    pgn['Round']  === undefined ||
		    pgn['White']  === undefined ||
		    pgn['Black']  === undefined ||
		    pgn['Result'] === undefined) {

		    cfdt.log('Invalid PGN format; required fields: "Event", "Site", "Date", "Round", "White", "Black", "Result"')
		    alert('Invalid PGN format; required fields: "Event", "Site", "Date", "Round", "White", "Black", "Result"')
		    return
		    
		} else {
		    callback(pgn)
		    break
		    
		}
	    }
	}

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
	    cfdt.error('Invalid FEN: ' + fen)
	    return 1
	}
    }

        
    function parsePGN(nodes, callback) {

	var pgn = {}
	
	if (DB.userSelected.startmode === 'custom') {

	    // create new
	    pgn['Event']  = "?"  
	    pgn['Site']   = "?"  
	    pgn['Date']   = "????.??.??"
	    pgn['Round']  = "?"
	    pgn['White']  = "?" 
	    pgn['Black']  = "?" 
	    pgn['Result'] = "*"
	    pgn['FEN'] = DB.userSelected.startFEN
	    pgn['Moves'] = '*'
	    
	    createNodesFromPGN(pgn, nodes, callback)
	    board.edited = true

	} else if (DB.userSelected.startmode === 'fromDB') {
	    
	    readNodesFromDB(nodes, callback)
	    
	} else {

	    // load from file
	    var parentDir = path.resolve(process.cwd(), '..')
	    var pgn_file = parentDir + '/tests/example.pgn'
	    
	    readPGN(pgn_file, function(pgn) {
		createNodesFromPGN(pgn, nodes, function(n) {
		    save()
		})
	    })
	}
	
    }

    function readNodesFromDB(nodes, callback) {

	DB.DB.findOne({ _id: DB.userSelected['id'] }, function (err, pgn) {

	    board.Event = pgn['Event']
	    board.Site = pgn['Site']
	    board.Date = pgn['Date']
	    board.Round = pgn['Round']
	    board.White = pgn['White']
	    board.Black = pgn['Black']
	    board.Result = pgn['Result']
	    board.WhiteElo = pgn['WhiteElo']
	    board.BlackElo = pgn['BlackElo']
	    board.Tags = pgn['tags'] ? pgn['tags'].join(", ") : ""
	    
	    nodes = pgn['nodes']
	    board.FEN = nodes['(0)']['FEN']
	    board.nodeIndx = '(0)'
	    board.sideToMove = parseFEN(board.FEN)['sideToMove']
	    board.nodes = nodes
	    board._DB_Id = DB.userSelected['id']
	    board._DB_created = pgn['created']
	    
	    if(callback) {
		callback(nodes)
	    }

	})
    }

    function createNodesFromPGN(pgn, nodes, callback) {
   
	var chess = new Chess()
	var moves = pgn['Moves'].split(/\s/)    
	
	board.Event = pgn['Event']
	board.Site = pgn['Site']
	board.Date = pgn['Date']
	board.Round = pgn['Round']
	board.White = pgn['White']
	board.Black = pgn['Black']
	board.Result = pgn['Result']
	board.WhiteElo = (pgn['WhiteElo'] !== undefined) ? pgn['WhiteElo'] : "?"
	board.BlackElo = (pgn['BlackElo'] !== undefined) ? pgn['BlackElo'] : "?"

	
	function isMoveDesc(pos) {
	    if ((/^\d/.test(moves[pos]) && !/^0/.test(moves[pos])) || moves[pos] === '...')  {
		return true
	    } else {
		return false
	    }
	}
	
	
	function appendComment(pos, nodeIndx, callback) {
	    nodes[nodeIndx]['Comment'] = ''


	    var i = pos
	    while (moves[i] !== '}') {
		
		nodes[nodeIndx]['Comment'] += ((i === pos) ? '' : ' ') + moves[i]
		i += 1
	    }
	    
	    if (callback) {
		callback(i)
	    }
	}


	function consumeVariation(pos, callback) {

	    var openParens = 1
	    var i = pos
	    while (openParens !== 0) {
		
		i += 1 
		if (moves[i] === '(') {
		    openParens += 1
		}

		if (moves[i] === ')') {
		    openParens -= 1
		}
	    }

	    if (callback) {
		callback(i)
	    }
	    
	}


	function appendEndOfGame(root, pos, indx) {
	    var nodeIndx = root

	    if (nodes[nodeIndx]['Comment'] === undefined) {
		nodes[nodeIndx]['Comment'] = ''
	    }
	    
	    // normalize result
	    if (moves[pos] === "1/2-1/2") {
		nodes[nodeIndx]['Comment'] += "½-½"
	    } else {
		nodes[nodeIndx]['Comment'] += moves[pos]
	    }
	}
	
	function appendNode(root, pos, indx) {

	    chess.load(nodes[root]['FEN'])
	    chess.move(moves[pos])

	    var nodeIndx = root + '(' + indx.toString() + ')'
	    if (nodes[nodeIndx] === undefined) {
		nodes[nodeIndx] = {}
	    }
	    nodes[nodeIndx]['FEN'] = chess.fen()
	    nodes[nodeIndx]['SAN'] = figurine(moves[pos])

	    
	    var i = pos
	    while (moves[i+1] !== undefined) {
	
		i += 1

		
		// End of game
		if (moves[i] === '1-0' || moves[i] === '0-1' || moves[i] === "1/2-1/2") {
		    appendEndOfGame(nodeIndx, i, 0)
		    return
		}
		
	    	// Nags
	    	if (/^\$/.test(moves[i])) {
	    	    nodes[nodeIndx]['NAG'] = moves[i]
	    	    continue
	    	}

		
		// Move description
		if (isMoveDesc(i)) {
		    continue
		}

	
	    	// Comments
	    	if (moves[i] === '{') {

		    i += 1
		    appendComment(i, nodeIndx, function(commentEndPos) {
			i = commentEndPos 
		    })
	    	    continue
	    	}

	    	
	    	// Continue mainline
	    	if ('abcdefghRBNQKO0'.indexOf(moves[i][0]) !== -1 && moves[i-1] !== '{') {
		    appendNode(nodeIndx, i, 0)
		    return
		}

		
	    	// Consume variations
		if (moves[i] === '(') {

		    var varIndx = indx
		    
		    while (moves[i] === '(') {
			
			i += 1
			var preComment = ''
			
			if (moves[i] === '{') {
			    
                            i += 1
                            while(moves[i] !== '}') {
				preComment === '' ? preComment += moves[i] : preComment += ' ' + moves[i]
				i += 1
                            }
			    
                            i += 1
			}
			
			while (isMoveDesc(i)) {
                            i += 1
			}
			
                        varIndx += 1
			appendNode(root, i, varIndx)
			
			if (preComment !== '') {
                            var preCommentIndx = root + '(' + varIndx.toString() + ')'
                            nodes[preCommentIndx]['preComment'] = preComment
			}
			
			consumeVariation(i, function(varEndPos) {
                            i = varEndPos + 1
			})  
		    }
					 
		    if (moves[i] == ')') {
			return
		    } else {
			continue
		    }
		}
		
		
		// End variation
		if (moves[i] === ')' || moves[i] === '*') {
		    return
		}

		// Precomment
		if (moves[i-1] === '{') {

		    var preComment = ''

                    while(moves[i] !== '}') {
			preComment === '' ? preComment += moves[i] : preComment += ' ' + moves[i]
			i += 1
                    }
		    
                    i += 1
	    
                    var preCommentIndx = nodeIndx + '(0)'

		    if (nodes[preCommentIndx] === undefined) {
			nodes[preCommentIndx] = {}
		    }
		    nodes[preCommentIndx]['preComment'] = preComment		    
		    continue
		}
		
	    	// Something unforeseen
	    	cfdt.error('Cannot parse: ' + moves[i])
	    	return
	    }
	}

	
	// Parse root node
	nodes = {}
	nodes['(0)'] = {}	

	if (pgn['FEN'] === undefined) {
	    nodes['(0)']['FEN'] = chess.fen()
	} else {
	    nodes['(0)']['FEN'] = pgn['FEN']
	    chess.load(pgn['FEN'])
	}


	board.FEN = nodes['(0)']['FEN']
	board.nodeIndx = '(0)'
	board.sideToMove = parseFEN(board.FEN)['sideToMove']

	if (moves[0] === '{') {

	    // Game starts with a comment
	    appendComment(1, '(0)', function(commentEndPos) {

		var i = commentEndPos
		
		while (isMoveDesc(i + 1)) {
		    i += 1
		}


		if (moves[i+1] !== '*') {
		    appendNode('(0)', i+1, 0)
		}
	    })
	    
	} else if (/^\d/.test(moves[0])) {
	    
	    var startpos = 1
	    while (isMoveDesc(startpos)) {
		startpos += 1
	    }

	    appendNode('(0)', startpos, 0)
	    
	} else if (moves[0] === '*') {
	    // empty pgn, nothing to parse
	    if (board.sideToMove === 'w') {
		nodes['(0)']['Comment'] = 'White to move'
	    } else {
		nodes['(0)']['Comment'] = 'Black to move'
	    }
	    
	} else {
	    cfdt.error('PGN does neither start with a comment nor a move number')
	}

	board.nodes = nodes

	
	if (callback) {
	    callback(nodes)
	}
	
    }


    function isScrolledIntoView(el) {
	var rect = el.getBoundingClientRect();
	var elemTop = rect.top;
	var elemBottom = rect.bottom;

	// Only completely visible elements return true:
	var isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
	// Partially visible elements return true:
	//isVisible = elemTop < window.innerHeight && elemBottom >= 0;
	return isVisible;
    }


    function highlightNotation(nodes, callback) {
	var x = window.document.getElementsByClassName("highlightedMove")
	while (x.length > 0) {
	    x[0].classList.remove("highlightedMove")
	}

	if (board.nodeIndx !== '(0)') {
	    var y = window.document.getElementById('move' + board.nodeIndx)
	    y.classList.add("highlightedMove")
	    if(!isScrolledIntoView(y)) {
		y.scrollIntoView({block: 'center'})
	    }
	}
	    
	if (callback) {
	    callback(nodes)
	}

    }


    function displayNotation(nodes, callback) {


	function childIndx(nodeIndx, i) {
	    return nodeIndx + '(' + i.toString() + ')'
	}


	function varIndicator(branchLevel, dir) {
	    if (dir === "left") {

		switch(branchLevel) {
		case 1:
		    return '<div class="varIndicator">&#8227;</div>'

		case 2:
		    return '<div class="varIndicator">&#8729;</div>'

		case 3:
		    return '<div class="varIndicator">&#8282;</div>'
		    
		case 4:
		    return '<div class="varIndicator">&#8285;</div>'
		    
		case 5:
		    return '<div class="varIndicator">&#8286;</div>'
		    
		default:
		    return '('
		}
		
	    } else if (dir === "right") {
		if (branchLevel > 6) {
		    return (branchLevel === 6) ? ') ' : ') '
		} else {
		    return ''
		}
	    } else {
		return ''
	    }

	}


	function convertNAG2Symbol(nag) {
	    switch(nag) {
	    case "$1":
		return "!"
	    case "$2":
		return "?"
	    case "$3":
		return "!!"
	    case "$4":
		return "??"
	    case "$5":
		return "!?"
	    case "$6":
		return "?!"
	    case "$8":
		return "□"
	    case "$10":
		return " ="
	    case "$13":
		return " ∞"
	    case "$14":
		return " +/="
	    case "$15":
		return " =/+"
	    case "$16":
		return " +/-"
	    case "$17":
		return " -/+"
	    case "$18":
		return " +-"
	    case "$19":
		return " -+"
	    case "$40":
		return " ↑"
	    case "$41":
		return " ↑"
	    case "$44":
		return " =/∞"
	    case "$146":
		return " N"
	    default:
		return nag
	    }
	}
	
	
	function addNextMove(subEl, mvNr, mvDesc, color, branchLevel, nodeIndx, nodes, skipAppend = false) {

	    if (!skipAppend) {
		var move = window.document.createElement('div')
		move.classList.add("move")
		move.classList.add("level" + branchLevel.toString())
		move.id = "move" + nodeIndx

		move.innerHTML = ""

		var NAG = (nodes[nodeIndx]['NAG'] !== undefined) ? convertNAG2Symbol(nodes[nodeIndx]['NAG']) : ""
		move.innerHTML = mvDesc + ' ' + '<span class="san">' + figurine(nodes[nodeIndx]['SAN']) + NAG + '</span>'

		if (nodes[nodeIndx]['Comment'] !== undefined) {
		    move.innerHTML += ' <span class="comment">' + nodes[nodeIndx]['Comment'] + "</span>"
		}

		if (branchLevel === 1){
		    moves.appendChild(move)
		} else {
		    subEl.appendChild(move)
		}
	    }
	    
	    nextNodes = []

	    
	    for (var i = 0; nodes[childIndx(nodeIndx, i)] !== undefined; i++) {
		nextNodes.push(childIndx(nodeIndx, i))
	    }
	    
	    var numNextNodes = nextNodes.length
	    
	    if (numNextNodes > 1) {

		
		// Append main line
		var mainMove = window.document.createElement('div')
		var mainNodeIndx = nodeIndx + '(0)'
		mainMove.classList.add("move")
		mainMove.classList.add("level" + branchLevel.toString())
		mainMove.id = "move" + mainNodeIndx
		
		var mainMoveDesc
		var mainMoveNr

		if (nodes[nodeIndx]['Comment'] !== undefined) {
		    if (color === 'w') {
			mainMoveNr = mvNr
			mainMoveDesc = ' ' + mainMoveNr.toString() + '. ...'
		    } else {
			mainMoveNr = mvNr + 1
			mainMoveDesc = ' ' + mainMoveNr.toString() + '.'
		    }
		} else {
		    if (color === 'w') {
			mainMoveNr = mvNr
			mainMoveDesc = skipAppend ? mvNr +'. ...' : ''
		    } else {
			mainMoveNr = mvNr + 1
			mainMoveDesc = ' ' + mainMoveNr.toString() + '.'
		    }		    
		}

		var NAG = (nodes[mainNodeIndx]['NAG'] !== undefined) ? convertNAG2Symbol(nodes[mainNodeIndx]['NAG']) : ""
		mainMove.innerHTML = mainMoveDesc + ' ' + '<span class="san">' + figurine(nodes[mainNodeIndx]['SAN']) + NAG + '</san>'

		if (nodes[mainNodeIndx]['Comment'] !== undefined) {
		    mainMove.innerHTML += ' <span class="comment">' + nodes[mainNodeIndx]['Comment'] + "</span>"
		}

		if (branchLevel === 1){
		    moves.appendChild(mainMove)
		} else {
		    subEl.appendChild(mainMove)
		}

		
		// Append variations

		for (var i = 1; i < numNextNodes; i++) {

		    
		    var nextColor = (color === 'w') ? 'b' : 'w'
		    var nextNodeIndx = childIndx(nodeIndx, i)

		    var nextMvNr
		    var nextMvDesc = (i === 1) ? ' ' : ''

		    var pc = ''
		    if (nodes[nextNodeIndx]['preComment'] !== undefined) {
			pc = '<span class="precomment">' + nodes[nextNodeIndx]['preComment'] + ' ' + '</span>'
		    }
		    

		    if (nextColor === 'w') {
			nextMvNr = mvNr + 1
			nextMvDesc += varIndicator(branchLevel, "left") + pc + nextMvNr.toString() + '.'
		    } else {
			nextMvNr = mvNr
			nextMvDesc += varIndicator(branchLevel, "left") + pc + nextMvNr.toString() + '. ...'
		    }
		    

		    var subVar = window.document.createElement('div')
		    subVar.classList.add('subvar')
		    subVar.classList.add('level' + branchLevel.toString())
		    subEl.appendChild(subVar)
		    
		    addNextMove(subVar, nextMvNr, nextMvDesc, nextColor, branchLevel + 1, nextNodeIndx, nodes)

		    if (nodes[nodeIndx + '(0)(0)'] === undefined && i === numNextNodes - 1) {			
			subVar.lastChild.innerHTML += varIndicator(branchLevel, "right")
		    }
		    
		}


		// Continue with main line after variations
		
		if (nodes[nodeIndx + '(0)(0)'] !== undefined) {
		    
		    var nextColor = (color === 'w') ? 'b' : 'w'
		    var nextNodeIndx = nodeIndx + '(0)'

		    var nextMvNr
		    var nextMvDesc
		    
		    if (nextColor === 'w') {
			nextMvNr = mvNr + 1
		    } else {
			nextMvNr = mvNr
		    }
		    
		    addNextMove(subEl, nextMvNr, nextMvDesc, nextColor, branchLevel, nextNodeIndx, nodes, skipAppend = true)

		}

	    } else if (numNextNodes === 1) {

		var nextColor = (color === 'w') ? 'b' : 'w'
		var mainNodeIndx = nodeIndx + '(0)'
		var mainMoveDesc
		var mainMoveNr


		var sibling = parseInt(nodeIndx.match(/\((\d*)\)$/)[1]) + 1
		var siblingIndx = nodeIndx.replace(/\(\d*\)$/, '') + '(' + sibling.toString() + ')'
		var hasSibling = (nodes[siblingIndx] === undefined) ? false : true

		
		if (nodes[nodeIndx]['Comment'] !== undefined) {

		    if (nextColor === 'w') {
			mainMoveNr = mvNr + 1
			mainMoveDesc = ' ' + mainMoveNr.toString() + '.'
		    } else {
			mainMoveNr = mvNr
			mainMoveDesc = ' ' + mainMoveNr.toString() + '. ...'
		    }
	
		} else {
		    
		    if (nextColor === 'w') {
			mainMoveNr = mvNr + 1
			mainMoveDesc = ' ' + mainMoveNr.toString() + '.'
		    } else {
			mainMoveNr = mvNr

			if (mainNodeIndx === '(0)(0)') {
			    // Main variation should always start with a move description
			    mainMoveDesc = mainMoveNr.toString() + '. ...'
			} else {
			    mainMoveDesc = (hasSibling && sibling === 1) ? mainMoveNr.toString() + '. ...' : ''
			}
		    }
		}

		addNextMove(subEl, mainMoveNr, mainMoveDesc, nextColor, branchLevel, mainNodeIndx, nodes)
	
		
	    } else {
		// End of variation
		if (branchLevel > 3) {
		    move.innerHTML += varIndicator(branchLevel, "right")
		}
	    }

	}

	var moves = window.document.createElement('div')
	moves.classList.add("move-container")

	var first_move = window.document.createElement('div')
	first_move.classList.add("move")
	first_move.classList.add("level1")
	first_move.id = "move(0)"
	
	if (nodes['(0)']['Comment'] !== undefined) {
	    first_move.innerHTML = '<span class="comment intro-comment">' + nodes['(0)']['Comment'] + '</span>'
	} else {
	    first_move.innerHTML = '<span class="comment intro-comment">' + '</span>'
	}
	moves.appendChild(first_move)
	

	var parsedFEN = parseFEN(nodes['(0)']['FEN'])
	
	if (parsedFEN['sideToMove'] === 'w') {
	    addNextMove(moves, parsedFEN['moveNr'] - 1, '', 'b', 1, '(0)', nodes, skipAppend = true)
	} else {
	    addNextMove(moves, parsedFEN['moveNr'], '', 'w', 1, '(0)', nodes, skipAppend = true)
	}

	removeBlurEventlistenerFromComments()

	while (Container.moveContainer.lastChild) {
	    Container.moveContainer.removeChild(Container.moveContainer.lastChild);
	}

	Container.moveContainer.appendChild(moves)	
	    
	// make moves clickable
	var x = window.document.getElementsByClassName("move")
	for (var i = 0; i < x.length; i++) {
	    x[i].addEventListener("click", function (evt) {
		var nodeIndx = this.id.replace(/move/g, '')
		var fen = nodes[nodeIndx]['FEN']
		updateBoard(fen, nodeIndx)
	    }, false) 
	} 


	if (callback) {
	    callback(nodes)
	}

    }


    function displayCurrentFEN(nodes, callback) {

	displayFEN(board.FEN)

	if (callback) {
	    callback(nodes)
	}
    }

    function createBoardControls(withEngineControls = true, withSearchControls = false) {

	var controlContainer = window.document.createElement('div')
	controlContainer.classList.add('controlContainer')
	
	var control = window.document.createElement('table')
	control.classList.add('control')

	var tr = window.document.createElement('tr')

	var controlDatabase = window.document.createElement('td')
	controlDatabase.innerHTML = '<i class="fa move-nav">&#xf03a;</i>'
	
	if (Container.modalContainer !== undefined) {
	
	    controlDatabase.addEventListener("click", function (evt) {

		if (board.edited === true) {
		    Container.modalContainer.style.display = "flex"
		} else {
		    window.open('/views/main.html', '_self')
		}
	    })
	} else {
	    controlDatabase.addEventListener("click", function (evt) {
		window.open('/views/main.html', '_self')
	    })
	}

	
	var controlFlip = window.document.createElement('td')
	controlFlip.innerHTML = '<i class="fa move-nav">&#xf01e;</i>'
	controlFlip.addEventListener("click", function (evt) {
	    flipBoard()
	})


	tr.appendChild(controlDatabase)
	tr.appendChild(controlFlip)

	
	control.appendChild(tr)
	controlContainer.appendChild(control)
	Container.boardContainer.appendChild(controlContainer)


	function createSearchControls() {
	    var controlErase = window.document.createElement('td')
	    controlErase.innerHTML = '<i class="fa move-nav">&#xf12d;</i>'
	    controlErase.addEventListener("click", function (evt) {
		var emptyFEN = '8/8/8/8/8/8/8/8'
		insertFEN(emptyFEN)
		Container.FENContainer.value = emptyFEN
	    })

	    tr.appendChild(controlErase)

	}
	
	
	function createEngineControls() {

	    var controlStart = window.document.createElement('td')
	    controlStart.innerHTML = '<i class="fa move-nav">&#xf04b;</i>'
	    controlStart.addEventListener("click", startEngine)
	    controlStart.id = 'controlStart'

	    var controlStop = window.document.createElement('td')
	    controlStop.innerHTML = '<i class="fa move-nav">&#xf04c;</i>'
	    controlStop.addEventListener("click", stopEngine)
	    controlStop.style.display = "none"
	    controlStop.id = 'controlStop'
	    

	    tr.appendChild(controlStart)
	    tr.appendChild(controlStop)

	    var engineOut = window.document.createElement('div')
	    engineOut.classList.add("engineOut")

	    var engineSTM = window.document.createElement('div')
	    engineSTM.id = "engineSTM"
	    engineSTM.classList.add("engineSTM")
	    engineSTM.innerHTML = '<i class="fa">&#xf0c8;</i>'

	    var engineStatus = window.document.createElement('div')
	    engineStatus.id = "engineStatus"
	    engineStatus.classList.add("engineStatus")
	    
	    var engineDepth = window.document.createElement('div')
	    engineDepth.id = "engineDepth"
	    engineDepth.classList.add("engineDepth")

	    var engineCurrmove = window.document.createElement('div')
	    engineCurrmove.id = "engineCurrmove"
	    engineCurrmove.classList.add("engineCurrmove")

	    var engineLines = window.document.createElement('div')
	    engineLines.classList.add("engineLines")
	    
	    for (var i = 0; i < board.numEngineLines; i++) {
		
		var engineLine = window.document.createElement('div')
		engineLine.id = "engineLine" + (i+1).toString()
		engineLine.classList.add("engineLine")

		engineLines.appendChild(engineLine)
	    }

	    engineOut.appendChild(engineSTM)
	    engineOut.appendChild(engineStatus)
	    engineOut.appendChild(engineDepth)
	    engineOut.appendChild(engineCurrmove)
	    engineOut.appendChild(engineLines)
	    
	    Container.boardContainer.appendChild(engineOut)

	}


	if (withEngineControls) {
	    createEngineControls()
	}

	if (withSearchControls) {
	    createSearchControls()
	}
	
	
    }



    function flipBoard() {


	board.flipped = (board.flipped) ? false : true

	// clear current highlights
	var curHLSquare = board.hlSquares;
	clearHighlightedSquares()

	
	for (var r = 8; r > 0; r--) {
	    var coord = window.document.getElementById('row' + r.toString())
	    coord.innerHTML = (board.flipped) ? (9-r).toString() : r.toString()
	}

	var file_names = (board.flipped) ? "hgfedcba" : "abcdefgh"

	for (var i = 1; i < 9; i++) {
	    var coord = window.document.getElementById('col' + i.toString())
	    coord.innerHTML = file_names[i-1]
	}

	// reapply highlights
        for (i = 0; i < curHLSquare.length; i++) {
            highlightSquareByCoord(curHLSquare[i]);
        }

	displayFEN(board.FEN)
	
    }


    function listenForMove() {

	if (Container.moveContainer !== undefined) {
	    if (board.hlSquares.length === 2) {
		makeMove()
	    }
	} else if (Container.FENContainer !== undefined) {
	    
	    if (board.selectedPiece !== undefined) {

		putPiecesToFEN(board.selectedPiece, board.hlSquares[0])
		Container.FENContainer.value = board.FEN
		displayFEN(board.FEN)
		clearHighlightedSquares()

	    } else {
		// move piece
		if (board.hlSquares.length === 2) {

		    putPiecesToFEN(getPieceFromSquare(board.FEN, board.hlSquares[0]), board.hlSquares[1])
		    putPiecesToFEN("0", board.hlSquares[0])
		    Container.FENContainer.value = board.FEN
		    displayFEN(board.FEN)
		    clearHighlightedSquares()
		    board.selectedPiece = undefined
		}
	    }
	} else {
	    //
	}
    }


    function squareFromInt(i) {
        if (board.flipped === true) {
	    return "sq"+(64 - i).toString()
        } else {
	    return "sq"+(i + 1).toString()
        }
    }


    function makePiecesClickable() {

	var pieceContainer = Container.pieceContainer
	var label = window.document.createElement("span")
	label.innerHTML = "Select pieces:"
	label.style.display = "block"  
	pieceContainer.appendChild(label)
	
	var wp = window.document.createElement("img")
	wp.classList.add("pieces")
	wp.id = "P"
	wp.src = '../assets/alternative/wp.svg'
	pieceContainer.appendChild(wp)

	var bp = window.document.createElement("img")
	bp.classList.add("pieces")
	bp.id = "p"
	bp.src = '../assets/alternative/bp.svg'
	pieceContainer.appendChild(bp)

	var wn = window.document.createElement("img")
	wn.classList.add("pieces")
	wn.id = "N"
	wn.src = '../assets/alternative/wn.svg'
	pieceContainer.appendChild(wn)

	var bn = window.document.createElement("img")
	bn.classList.add("pieces")
	bn.id = "n"
	bn.src = '../assets/alternative/bn.svg'
	pieceContainer.appendChild(bn)

	var wb = window.document.createElement("img")
	wb.classList.add("pieces")
	wb.id = "B"
	wb.src = '../assets/alternative/wb.svg'
	pieceContainer.appendChild(wb)

	var bb = window.document.createElement("img")
	bb.classList.add("pieces")
	bb.id = "b"
	bb.src = '../assets/alternative/bb.svg'
	pieceContainer.appendChild(bb)


	var wr = window.document.createElement("img")
	wr.classList.add("pieces")
	wr.id = "R"
	wr.src = '../assets/alternative/wr.svg'
	pieceContainer.appendChild(wr)

	var br = window.document.createElement("img")
	br.classList.add("pieces")
	br.id = "r"
	br.src = '../assets/alternative/br.svg'
	pieceContainer.appendChild(br)

	var wq = window.document.createElement("img")
	wq.classList.add("pieces")
	wq.id = "Q"
	wq.src = '../assets/alternative/wq.svg'
	pieceContainer.appendChild(wq)

	var bq = window.document.createElement("img")
	bq.classList.add("pieces")
	bq.id = "q"
	bq.src = '../assets/alternative/bq.svg'
	pieceContainer.appendChild(bq)

	var wk = window.document.createElement("img")
	wk.classList.add("pieces")
	wk.id = "K"
	wk.src = '../assets/alternative/wk.svg'
	pieceContainer.appendChild(wk)

	var bk = window.document.createElement("img")
	bk.classList.add("pieces")
	bk.id = "k"
	bk.src = '../assets/alternative/bk.svg'
	pieceContainer.appendChild(bk)
		

	var empty_square = window.document.createElement("div")
	empty_square.classList.add("pieces", "empty-square")
	empty_square.id = "0"
	pieceContainer.appendChild(empty_square)

	
	var pieces = window.document.getElementsByClassName("pieces")
	
	for (var i = 0; i < pieces.length; i++) {
       	    pieces[i].addEventListener("click", function(evt) {
		
       		if (this.classList.contains("selected")) {
       		    this.classList.remove("selected")
		    board.selectedPiece = undefined
       		} else {
       		    var selectedPieces = window.document.getElementsByClassName("selected")
       		    while (selectedPieces.length > 0) {
       			selectedPieces[0].classList.remove("selected")
      		    }
       		    this.classList.add("selected")
		    board.selectedPiece = this.id
       		}
	    })
	}
    }


    function putPiecesToFEN(p, coord) {
	var col = 'abcdefgh'.indexOf(coord[0])
	var row = parseInt(coord[1])
	var sq = squareFromInt((row-1)*8 + col)
	
	var pieceDistribution = {}

	// get piece distribution from current fen
	fenVisitor(board.FEN, function(piece, square) {
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


		    var currentPiece = pieceDistribution[squareFromInt(i-1)]
		    
		    if (currentPiece !== undefined && currentPiece.match(/^(p|b|n|r|q|k|P|B|N|R|Q|K)$/)) {
			if (emptySquareCount > 0) {
			    fen += emptySquareCount.toString()
			}
			emptySquareCount = 0
			fen += pieceDistribution[squareFromInt(i-1)]
		    } else {
			emptySquareCount += 1
		    }
		}

		fen += (emptySquareCount !== 0) ? emptySquareCount : ''
		fen += (r === 1) ? '' : '/'
	    }

	    return fen
	}

	board.FEN = FENfromPieceDistribution()
    }


    function makeMove() {
	var chess = new Chess()
	chess.load(board.FEN)
	var move

	if (chess.get(board.hlSquares[0]) === null) {
	    // no piece to move
	    clearHighlightedSquares()
	    return 1
	}

	if (chess.get(board.hlSquares[0]).type === 'p' && ((board.hlSquares[1])[1] === '8' || (board.hlSquares[1])[1] === '1')) {
	    //promotion
	    move = chess.move({from: board.hlSquares[0], to: board.hlSquares[1], promotion: 'q'})
	} else {
	    move = chess.move({from: board.hlSquares[0], to: board.hlSquares[1]})
	}
	
	var fen = chess.fen()

	if (move === null) {
	    // illegal move
	    alert('illegal move')
	    clearHighlightedSquares()
	    return 1
	}

	
	// test if move is new move 
	var i = 0
	while (true) {
	    
	    var childIndx = board.nodeIndx + '(' + i.toString() + ')'
	    
	    if (board.nodes[childIndx] !== undefined) {
		if (board.nodes[childIndx]['FEN'] === fen) {
		    updateBoard(fen, childIndx)
		    break
		} else {
		    i += 1
		    continue
		}
		
	    } else {

		// insert new node
		board.nodes[childIndx] = {}
		board.nodes[childIndx]['FEN'] = fen
		board.nodes[childIndx]['SAN'] = move.san
		displayNotation(board.nodes)
		makeCommentsClickable(board.nodes)
		updateBoard(fen, childIndx)
		board.edited = true
		board.editComment = false
		board.editHeader = false
		break
	    }
	}
    }


    function updateBoard(fen, nodeIndx) {

	board.FEN = fen
	board.sideToMove = parseFEN(board.FEN)['sideToMove']
	board.nodeIndx = nodeIndx
	clearHighlightedSquares()		

	cfdt.chain(
	    displayCurrentFEN,
	    highlightNotation,
	    updateMoveIndicator
	)(board.nodes)

	updateEnginePosition()
    }


    function updateMoveIndicator (nodes, callback) {
	var stm = window.document.getElementById("engineSTM")
	stm.style.color = (board.sideToMove === 'w') ? "white" : "black"
	
	if (callback) {
	    callback(nodes)
	}
    }

    function makeCommentClickable(el) {
	el.addEventListener("click", function(evt) {
	    board.editComment = true		
	    el.contentEditable = "true"
	    el.focus()
	})

	el.addEventListener("blur", el.blur =  function(evt) {
	    finishInput()
	    highlightNotation(board.nodes)
	})
	
    }
    
    function makeCommentsClickable(nodes, callback) {
	var comments = window.document.getElementsByClassName("comment")

	for (var i = 0; i < comments.length; i++) {
	    makeCommentClickable(comments[i])
	}

	if (callback) {
	    callback(nodes)
	}
    }

    function removeBlurEventlistenerFromComments() {
	var comments = window.document.getElementsByClassName("comment")

	for (var i = 0; i < comments.length; i++) {
	    comments[i].removeEventListener("blur", comments[i].blur)
	}

    }
    
    function parseKeypress(evt) {
	
	if (evt.which === 13) {
	    
	    // return key
	    evt.preventDefault()
	    finishInput(board.nodes, function(nodes) {
		updateBoard(board.FEN, board.nodeIndx)
	    })

	} else if (/[a-zA-Z0-9\!\?\+-=]/.test(evt.key) && board.editHeader === false) {

	    board.editComment = true
	    
	    var move = window.document.getElementById("move" + board.nodeIndx)	    
	    var comment = move.getElementsByClassName("comment")	    
	    
	    if (comment.length === 0) {
		// create new comment
		
		var newComment = window.document.createElement("span")
		newComment.classList.add("comment")
		newComment.contentEditable = "true"
		move.appendChild(newComment)
		newComment.focus()

	    } else {
		// edit existing comment
		var oldComment = comment[0]
		oldComment.contentEditable = "true"
		oldComment.focus()
	    }

	}
    }


    // UCI chess engine
    var engine

    function initEngine() {

	engine = fork(path.join(process.cwd(), '/app/uci_worker.js'))
	
	engine.on('message', (msg) => {
	    
	    if (msg.engineInfo.status) {

		var engineStatus = window.document.getElementById("engineStatus")
		engineStatus.innerHTML = "Engine: " + msg.engineInfo.status
	    }

	    if (msg.engineInfo.depth) {
		
		var engineDepth = window.document.getElementById("engineDepth")
		var engineCurrmove = window.document.getElementById("engineCurrmove")
		
		engineDepth.innerHTML = "Depth: " + msg.engineInfo.depth
		engineCurrmove.innerHTML = "Current move: " + figurine(uciToSan(msg.engineInfo.currmove, calcMvNr = false))
	    }

	    if (msg.engineInfo.eval) {
		var chess = new Chess(board.FEN)
		var numMoves = chess.moves().length
		
		var engineLine = window.document.getElementById("engineLine" + msg.engineInfo.multipv)
		engineLine.style.display = "inline-block"
		engineLine.innerHTML = '<span class="engineEval">' + msg.engineInfo.eval + '</span>' + figurine(uciToSan(msg.engineInfo.pv))

		if (numMoves < board.numEngineLines) {
		    for (var i = numMoves; i < board.numEngineLines; i++) {
			var unused = window.document.getElementById("engineLine" + (i+1).toString())
			unused.style.display = "none"
		    }
		}
	    }

	    
	})

	engine.send({ uci : 'init' });

    }

    function startEngine() {
	window.document.getElementById('controlStart').style.display = 'none'
	window.document.getElementById('controlStop').style.display = 'table-cell'
	engine.send({ uci : 'start', position : board.FEN })
    }

    function stopEngine() {
	window.document.getElementById('controlStart').style.display = 'table-cell'
	window.document.getElementById('controlStop').style.display = 'none'
	engine.send({ uci : 'stop' })
    }

    function quitEngine() {
	engine.send({ uci : 'quit' })
    }

    function updateEnginePosition() {
	engine.send({ uci : 'updatePosition', position : board.FEN })
    }

    function setPGN_Header(nodes, callback) {

	var pgnHeader = window.document.getElementById('pgnHeader')

	var table = window.document.createElement('table')
	table.classList.add("game-desc", "noBorder")

	
	var pgnEventDesc = window.document.createElement('td')
	var pgnEvent = window.document.createElement('input')
	pgnEventDesc.innerHTML = "Event:"
	pgnEventDesc.classList.add("noBorder", "pgnHeaderDesc")
	pgnEvent.classList.add("pgnHeader")
	pgnEvent.id = "pgnEvent"
	pgnEvent.type = "text"
	pgnEvent.value = board.Event
	pgnEvent.addEventListener("input", function (evt) {
	    board.Event = this.value
	    board.edited = true
	})

	var pgnSiteDesc = window.document.createElement('td')
	var pgnSite = window.document.createElement('input')
	pgnSiteDesc.innerHTML = "Site:"
	pgnSiteDesc.classList.add("noBorder", "pgnHeaderDesc")
	pgnSite.classList.add("pgnHeader")
	pgnSite.id = "pgnSite"
	pgnSite.type = "text"
	pgnSite.value = board.Site
	pgnSite.addEventListener("input", function (evt) {
	    board.Site = this.value
	    board.edited = true
	})


	var pgnDateDesc = window.document.createElement('td')
	var pgnDate = window.document.createElement('input')
	pgnDateDesc.innerHTML = "Date:"
	pgnDateDesc.classList.add("noBorder", "pgnHeaderDesc")
	pgnDate.classList.add("pgnHeader", "pgnHeaderDate")
	pgnDate.id = "pgnDate"	
	pgnDate.type = "text"
	pgnDate.value= board.Date
	pgnDate.addEventListener("input", function (evt) {
	    var input = this.value;
	    var dateEntered = new Date(input);
	    board.Date = cfdt.formatDate(dateEntered)
	    board.edited = true
	})

	
	var pgnRoundDesc = window.document.createElement('td')
	var pgnRound = window.document.createElement('input')
	pgnRoundDesc.innerHTML = "Round:"
	pgnRoundDesc.classList.add("noBorder", "pgnHeaderDesc")
	pgnRound.classList.add("pgnHeader")
	pgnRound.id = "pgnRound"
	pgnRound.type = "text"
	pgnRound.value = board.Round
	pgnRound.addEventListener("input", function (evt) {
	    board.Round = this.value
	    board.edited = true
	})

	
	var pgnWhiteDesc = window.document.createElement('td')
	var pgnWhite = window.document.createElement('input')
	pgnWhiteDesc.innerHTML = "White:"
	pgnWhiteDesc.classList.add("noBorder", "pgnHeaderDesc")
	pgnWhite.classList.add("pgnHeader")
	pgnWhite.id = "pgnWhite"
	pgnWhite.type = "text"
	pgnWhite.value = board.White
	pgnWhite.addEventListener("input", function (evt) {
	    board.White = this.value
	    board.edited = true
	})


	var pgnWhiteEloDesc = window.document.createElement('td')
	var pgnWhiteElo = window.document.createElement('input')
	pgnWhiteEloDesc.innerHTML = "Elo White:"
	pgnWhiteEloDesc.classList.add("noBorder", "pgnHeaderDesc")
	pgnWhiteElo.classList.add("pgnHeader")
	pgnWhiteElo.id = "pgnWhiteElo"
	pgnWhiteElo.type  = "text" 
	pgnWhiteElo.value = board.WhiteElo
	pgnWhiteElo.addEventListener("input", function (evt) {
	    board.WhiteElo = parseInt(this.value)
	    board.edited = true
	})

	
	var pgnBlackDesc = window.document.createElement('td')
	var pgnBlack = window.document.createElement('input')
	pgnBlackDesc.innerHTML = "Black:"
	pgnBlackDesc.classList.add("noBorder", "pgnHeaderDesc")
	pgnBlack.classList.add("pgnHeader")
	pgnBlack.id = "pgnBlack"
	pgnBlack.type = "text"
	pgnBlack.value = board.Black
	pgnBlack.addEventListener("input", function (evt) {
	    board.Black = this.value
	    board.edited = true
	})

	
	var pgnBlackEloDesc = window.document.createElement('td')
	var pgnBlackElo = window.document.createElement('input')
	pgnBlackEloDesc.innerHTML = "Elo Black:"
	pgnBlackEloDesc.classList.add("noBorder", "pgnHeaderDesc")
	pgnBlackElo.classList.add("pgnHeader")
	pgnBlackElo.id = "pgnBlackElo"
	pgnBlackElo.type = "text"
	pgnBlackElo.value = board.BlackElo
	pgnBlackElo.addEventListener("input", function (evt) {
	    board.BlackElo = parseInt(this.value)
	    board.edited = true
	})

	
	var pgnResultDesc = window.document.createElement('td')
	var pgnResult = window.document.createElement('select')
	pgnResultDesc.innerHTML = "Result:"
	pgnResultDesc.classList.add("noBorder", "pgnHeaderDesc")
	pgnResult.classList.add("pgnHeaderSelect", "pgnHeader")
	pgnResult.id = "pgnResult"
	pgnResult.innerHTML = '<option value="*">*</option>'
	    + '<option value="1-0">1-0</option>'
	    + '<option value="0-1">0-1</option>'
	    + '<option value="½-½">½-½</option>'
	pgnResult.value = board.Result	    
	pgnResult.addEventListener("input", function (evt) {
	    board.Result = this.value
	    board.edited = true
	})

	var pgnTagDesc = window.document.createElement('td')
	var pgnTag = window.document.createElement('input')
	pgnTagDesc.innerHTML = "Tags:"
	pgnTagDesc.classList.add("noBorder", "pgnHeaderDesc")
	pgnTag.classList.add("pgnHeader")
	pgnTag.id = "pgnTags"
	pgnTag.type = "text"
	pgnTag.value = board.Tags
	pgnTag.addEventListener("input", function (evt) {
	    board.Tags = this.value
	    board.edited = true
	})


	for (var i = 0; i < 10; i++) {
	    var tr = window.document.createElement('tr')
	    switch(i) {
	    case 0:
		tr.appendChild(pgnEventDesc)
		tr.appendChild(pgnEvent)
		break
	    case 1:
		tr.appendChild(pgnSiteDesc)
		tr.appendChild(pgnSite)
		break
	    case 2:
		tr.appendChild(pgnDateDesc)
		tr.appendChild(pgnDate)
		break
	    case 3:
		tr.appendChild(pgnRoundDesc)
		tr.appendChild(pgnRound)
		break
	    case 4:
		tr.appendChild(pgnWhiteDesc)
		tr.appendChild(pgnWhite)
		break
	    case 5:
		tr.appendChild(pgnWhiteEloDesc)
		tr.appendChild(pgnWhiteElo)
		break
	    case 6:
		tr.appendChild(pgnBlackDesc)
		tr.appendChild(pgnBlack)
		break
	    case 7:
		tr.appendChild(pgnBlackEloDesc)
		tr.appendChild(pgnBlackElo)
		break
	    case 8:
		tr.appendChild(pgnResultDesc)
		tr.appendChild(pgnResult)
		break
	    case 9:
		tr.appendChild(pgnTagDesc)
		tr.appendChild(pgnTag)
		break
	    default:
		//
	    }
	    table.appendChild(tr)
	}

	pgnHeader.appendChild(table)

	function editHeader(id) {
	    var header = window.document.getElementById(id)
	    board.editHeader = true
	    header.contentEditable = "true"
	    header.focus()
	}
	    
	// make PGN header editable
	var x = window.document.getElementsByClassName("pgnHeader")
	for (var i = 0; i < x.length; i++) {
	    x[i].addEventListener("click", function (evt) {
		editHeader(this.id)
	    }, false)
	}

	// make PGN header description clickable
	var x = window.document.getElementsByClassName("pgnHeaderDesc")
	for (var i = 0; i < x.length; i++) {
	    x[i].addEventListener("click", function (evt) {
		editHeader(this.nextSibling.id)
	    }, false)
	} 
	

	if (callback) {
	    callback(nodes)
	}
    }


    function finishInput(nodes, callback) {

	if (board.editComment) {
	    saveComment(function() {
		board.editComment = false
	    })
	}

	if (board.editHeader) {
	    // remove focus from PGN header
	    var header = window.document.activeElement
	    header.blur()
	    board.editHeader = false
        }

	if (callback) {
	    callback(nodes)
	}
    }
    

    function saveComment(callback) {

	var move = window.document.getElementById("move" + board.nodeIndx)
	var comment = move.getElementsByClassName("comment")[0]

	if (comment !== undefined) {
	    
	    var commentText = comment.innerHTML 

	    if (commentText !== "") {

		// test if comment is NAG
		if (commentText.match(/^\!\!\s?(.*)/)) {
		    // winning move
		    board.nodes[board.nodeIndx]['NAG'] = '!!'
		    commentText = commentText.substring(2)
		}

		if (commentText.match(/^\?\?\s?(.*)/)) {
		    // losing move
		    board.nodes[board.nodeIndx]['NAG'] = '??'
		    commentText = commentText.substring(2)
		}

		if (commentText.match(/^\!\?\s?(.*)/)) {
		    // interesting move
		    board.nodes[board.nodeIndx]['NAG'] = '!?'
		    commentText = commentText.substring(2)
		}

		if (commentText.match(/^\?\!\s?(.*)/)) {
		    // questionable move
		    board.nodes[board.nodeIndx]['NAG'] = '?!'
		    commentText = commentText.substring(2)
		}
		
		if (commentText.match(/^\!\s?(.*)/)) {
		    // good move
		    board.nodes[board.nodeIndx]['NAG'] = '!'
		    commentText = commentText.substring(1)
		}
		
		if (commentText.match(/^\?\s?(.*)/)) {
		    // bad move
		    board.nodes[board.nodeIndx]['NAG'] = '?'
		    commentText = commentText.substring(1)
		}

		

		if (commentText.match(/^=\s?(.*)/)) {
		    board.nodes[board.nodeIndx]['NAG'] = '$10'
		    commentText = commentText.substring(1)
		}
		if (commentText.match(/^∞\s?(.*)/)) {
		    board.nodes[board.nodeIndx]['NAG'] = '$13'
		    commentText = commentText.substring(1)
		}
		if (commentText.match(/^\+\/=\s?(.*)/)) {
		    board.nodes[board.nodeIndx]['NAG'] = '$14'
		    commentText = commentText.substring(3)
		}
		if (commentText.match(/^=\/\+\s?(.*)/)) {
		    board.nodes[board.nodeIndx]['NAG'] = '$15'
		    commentText = commentText.substring(3)
		}
		if (commentText.match(/^\+\/-\s?(.*)/)) {
		    board.nodes[board.nodeIndx]['NAG'] = '$16'
		    commentText = commentText.substring(3)
		}
		if (commentText.match(/^-\/\+\s?(.*)/)) {
		    board.nodes[board.nodeIndx]['NAG'] = '$17'
		    commentText = commentText.substring(3)
		}
		if (commentText.match(/^\+-s?(.*)/)) {
		    board.nodes[board.nodeIndx]['NAG'] = '$18'
		    commentText = commentText.substring(2)
		}
		if (commentText.match(/^-\+\s?(.*)/)) {
		    board.nodes[board.nodeIndx]['NAG'] = '$19'
		    commentText = commentText.substring(2)
		}
		if (commentText.match(/^=\/∞\s?(.*)/)) {
		    board.nodes[board.nodeIndx]['NAG'] = '$144'
		    commentText = commentText.substring(3)
		}
		if (commentText.match(/^N$/)) {
		    // just 'N'
		    board.nodes[board.nodeIndx]['NAG'] = '$146'
		    commentText = commentText.substring(1)
		}
		if (commentText.match(/^N[\s,(&nbsp;)]+/)) {
		    board.nodes[board.nodeIndx]['NAG'] = '$146'
		    commentText = commentText.substring(1)
		}
		

		if (commentText !== "") {
		    board.nodes[board.nodeIndx]['Comment'] = commentText
		} else {
		    // comment consists only of NAG
		    delete board.nodes[board.nodeIndx]['Comment']
		}
		
	    } else {
		// remove comment
		delete board.nodes[board.nodeIndx]['Comment']
	    }
	}
	
	displayNotation(board.nodes)
	makeCommentsClickable(board.nodes)
	board.edited = true

	if (callback) {
	    callback()
	}

    }

    function parseArrowkeys(evt) {
	
	if (board.editComment === true || board.editHeader === true) {
	    return
	}
	
	if (evt.which === 37) {
	    if (board.nodeIndx !== '(0)') {
		var prevNode = board.nodeIndx.replace(/\(\d*\)$/, '')
		var fen = board.nodes[prevNode]['FEN']
		updateBoard(fen, prevNode)
	    }	
	    
	} else if (evt.which === 39) {

	    var nextNode = board.nodeIndx + '(0)'
	    if (board.nodes[nextNode] !== undefined) {
		var fen = board.nodes[nextNode]['FEN']
		updateBoard(fen, nextNode)
	    }
	}
    }


    // Import worker
    var importWorker

    function initImportWorker() {

	importWorker = fork(path.join(process.cwd(), '/app/importWorker.js'))	
	importWorker.on('message', (msg) => {

	
	    if (msg.importWorker.importing) {
		
		var imported = msg.importWorker.pgn
		board.Event = imported.Event
		board.Site = imported.Site
		board.Date = imported.Date
		board.Round = imported.Round
		board.White = imported.White
		board.Black = imported.Black
		board.Result = imported.Result
		board.WhiteElo = (imported['WhiteElo'] !== undefined) ? imported['WhiteElo'] : "?"
		board.BlackElo = (imported['BlackElo'] !== undefined) ? imported['BlackElo'] : "?"
	    
		board.nodes = msg.importWorker.nodes

		// save to DB
		save()


		var numGames = window.document.getElementById("numGames")
		if (numGames.value == msg.importWorker.num_imported) {


		    var importLoader = window.document.getElementById("importLoader")
		    importLoader.style.display = "none";
		    
		    var confirmImport = window.document.getElementById("confirmImport")
		    confirmImport.style.display = "inline-block";
		    confirmImport.addEventListener("click", function(evt) {
			window.open('/views/main.html', '_self')			
		    })
		}

	    }

	    if (msg.importWorker.batch_completed) {
		var numGames = window.document.getElementById("numGames")
		var numImported = window.document.getElementById("numImported")
		numImported.value = msg.importWorker.num_imported
		
		if (numGames.value > msg.importWorker.num_imported) {
		    importWorker.send({ importWorker : 'continueImport' })
		}
	    }

	    if (msg.importWorker === 'imported') {
		var numImported = window.document.getElementById("numImported")
		numImported.value = 'ALL'
		DB.initialized = false
	    }

	    if (msg.importWorker.num_games) {
		var numGames = window.document.getElementById("numGames")
		numGames.value = msg.importWorker.num_games
	    }
	
	})
    }


    function importGames() {

	importWorker.send({ importWorker : {startImport : true,
					    filename : DB.userSelected['filename']} })

    }
    
    
    function loadForAnalysis() {

	createChessboard()
	createBoardControls()

	cfdt.chain(
	    parsePGN,
	    displayNotation,
	    displayCurrentFEN,
	    highlightNotation,
	    setPGN_Header,
	    makeCommentsClickable,
	    updateMoveIndicator
	)(board.nodes)

	initEngine()
	
	window.addEventListener("resize", resizeSquares)
	window.document.addEventListener("DOMContentLoaded", resizeSquares)
	window.document.addEventListener("keypress", parseKeypress)
	window.document.addEventListener("keydown", parseArrowkeys)
	window.addEventListener("unload", quitEngine)

    }


    function loadForSearch() {

	createChessboard()
	createBoardControls(withEngineControls = false, withSearchControls = true)

	cfdt.chain(
	    displayCurrentFEN,
	)(board.nodes)

	makePiecesClickable()
	
	window.addEventListener("resize", resizeSquares)
	window.document.addEventListener("DOMContentLoaded", resizeSquares)

    }

    function getPositions(nodes) {
	var positions = []
	for (var key in nodes) {
	    positions.push(nodes[key].FEN.split(' ')[0])
	}
	return positions
    }
    
    function save(callback) {

	if (DB.userSelected['startmode'] === "custom" ||
	    DB.userSelected['startmode'] === "fromFile") {


	    // normalize date
	    board.Date = board.Date.replace(/-/g, '.')

	    // normalize results
	    switch (board.Result) {
	    case "1/2-1/2" :
	    case "0.5-0.5" :
		board.Result = "½-½"
		break
	    }


	    DB.DBCount += 1
	    DB.MinId -= 1
	    var min_id = DB.MinId.toString(16)
	    var hex_id = min_id.toString(16)

	    var game = new DB.DB({ _id: hex_id,
				   created: new Date(),
				   Event: board.Event,
				   Site: board.Site,
				   Date: board.Date,
				   Round: board.Round,
				   White: board.White,
				   Black: board.Black,
				   Result: board.Result,
				   WhiteElo: board.WhiteElo,
				   BlackElo: board.BlackElo,
				   nodes: board.nodes,
				   positions: getPositions(board.nodes),
				   tags: []
				 })

	    game.save(function (err) {
		if (callback) {
		    callback(err)
		}		
	    })
	    

	} else {

	    DB.DB.findOne({ _id: board._DB_Id }, function (err, entry) {
	    
		entry.created = board._DB_created
		entry.Event = board.Event
		entry.Site = board.Site
		entry.Date = board.Date
		entry.Round = board.Round
		entry.White = board.White
		entry.Black = board.Black
		entry.Result = board.Result
		entry.WhiteElo = board.WhiteElo
		entry.BlackElo = board.BlackElo
		entry.nodes = board.nodes
		entry.positions = getPositions(board.nodes)

		// update tags
		var tag_array = board.Tags.split(",")
		var entry_tags = []
		var taglist = []
		if (localStorage.taglist === undefined || localStorage.taglist.length === 0) {
		    taglist = []
		} else {
		    taglist = localStorage.taglist.split(',')
		}
		
		for (var i = 0; i < tag_array.length; i++) {
		    var newTag = tag_array[i].trim()
		    
		    if (!entry_tags.includes(newTag)) {
			entry_tags.push(newTag)
		    }
		    
		    if (!taglist.includes(newTag) && newTag !== "") {
			taglist.push(newTag)
		    }
		}

		entry.tags = entry_tags

		localStorage.taglist = taglist
		
		DB.DB.save(entry, function(err, entries) {

		    if (callback) {
			callback(err)
		    }
		})
	    })
	}

    }


    function deleteGame(callback) {
	DB.DB.findOne({ _id: board._DB_Id }, function (err, entry) {
    	    entry.remove(function(){
		callback(err)
    	    })  
	})
    }

    
    function promoteVariation() {

	var selectedNode = board.nodeIndx

	// strip zeros and determine branch node
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

	branchNode = branchNode.replace(/\(\d*\)$/, '(0)')	

	// swap branchNode with selected node
	var splitIndx = 0
	for (var i = 0; i < branchNode.split(")(").length; i++) {
	    if (branchNode.split(")(")[i] !== selectedNode.split(")(")[i]) {
		splitIndx = i
		break
	    }
	}

	var replStr = selectedNode.split(")(").slice(0, splitIndx + 1).join(")(")
	if (!replStr.endsWith(')')) {
	    replStr += ')'
	}
	

	function escapeRegExp(string) {
	    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	var newNodes = {}
	
	for (key in board.nodes) {
	    if (key.startsWith(branchNode)) {
		var re = new RegExp('^' + escapeRegExp(branchNode))
		var newKey = key.replace(re, replStr)
		newNodes[newKey] = board.nodes[key]

	    } else if (key.startsWith(replStr)) {
		var re = new RegExp('^' + escapeRegExp(replStr))
		var newKey = key.replace(re, branchNode)
		newNodes[newKey] = board.nodes[key]

	    } else {
		newNodes[key] = board.nodes[key]
	    }
	}

	updateNodes(newNodes, branchNode)
    }



    function deleteVariation() {
	
	var selectedNode = board.nodeIndx

	if (selectedNode === '(0)') {
	    return
	}
	
	branchNode = selectedNode.replace(/\(\d*\)$/, '')
	var newNodes = {}
	
	for (key in board.nodes) {
	    if (key.startsWith(selectedNode)) {
		continue
		
	    } else {
		newNodes[key] = board.nodes[key]
	    }
	}

	updateNodes(newNodes, branchNode)
    }


    function updateNodes(newNodes, branchNode) {
	board.nodes = newNodes
	displayNotation(board.nodes, function(nodes) {
	    makeCommentsClickable(nodes)
	    updateBoard(nodes[branchNode]['FEN'], branchNode)
	})
	board.edited = true
	board.editComment = false
	board.editHeader = false
    }


    function selectRootNode() {
	var nodeIndx = '(0)'
	var fen = board.nodes[nodeIndx]['FEN']
	updateBoard(fen, nodeIndx)
    }
    
    // Module exports
    module.loadForAnalysis = loadForAnalysis
    module.loadForSearch = loadForSearch
    module.insertFEN = insertFEN
    module.validateFEN = validateFEN
    module.save = save
    module.importGames = importGames
    module.importOneGame = importOneGame
    module.createNodesFromPGN = createNodesFromPGN
    module.initImportWorker = initImportWorker
    module.promoteVariation = promoteVariation
    module.deleteVariation = deleteVariation
    module.selectRootNode = selectRootNode
    module.deleteGame = deleteGame
    
    return module

}

