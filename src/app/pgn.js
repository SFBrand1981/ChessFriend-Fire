// read and parse pgn
module.exports = function () {

    var fs = require('fs')
    var Chess = require('chess.js').Chess


    var HTMLIndentLevel = 5

    function readGamesFromFile(fh, callback) {
	var data = fs.readFileSync(fh, 'utf8');
	var games = data.split(/(\[Event\s.*\])/)
	var i = -1;
	var num_games = (games.length-1)/2
	var game_num = 0
	
	for (var n = 0; n < num_games; n++) {
	    i += 2
	    game_num += 1
	    var pgn = games[i] + games[i+1]  
	    callback({ pgn: pgn, num_games: num_games, game_num: game_num })
	}	
    }


    function parsePGNData(pgn) {

	var pgnData = {}

	// replace newlines with spaces
	var stripped = pgn.replace(/\r?\n|\r/g, ' ')
	var re = /^\s*\[[^%].*?\]/
	var match_header = re.exec(stripped)
	
	while(match_header) {
	    
	    var header = match_header[0]
	    var kv = header.match('\\[(.*)\\s"(.*)"\\]')

	    if (kv !== null && kv[1] && kv[2]) {
		pgnData[kv[1]] = kv[2]
		stripped = stripped.replace(header, '')
		match_header = re.exec(stripped)
		
	    } else {
		console.log('Invalid PGN-header: ' + header)
		break
	    }

	}



	// Test required fields
	if (pgnData['Event']  === undefined || 
	    pgnData['Site']   === undefined ||
	    pgnData['Date']   === undefined ||
	    pgnData['Round']  === undefined ||
	    pgnData['White']  === undefined ||
	    pgnData['Black']  === undefined ||
	    pgnData['Result'] === undefined) {

	    console.log('Invalid PGN format; required fields: \n' +
			'"Event", "Site", "Date", "Round", "White", "Black", "Result"')

	    return
	}

	pgnData['Moves'] = normalizePGNMoves(stripped)

	// required for DB
	pgnData['WhiteElo'] = pgnData['WhiteElo'] ? pgnData['WhiteElo'] : '?'
	pgnData['BlackElo'] = pgnData['BlackElo'] ? pgnData['BlackElo'] : '?'	
	
	return pgnData
    }


    function normalizePGNMoves(pgn) {

	var moves = pgn.replace(/\[[^%].*?\]/g, '')

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
	moves = moves.replace(/(\d+)(\.+)(?=(((?!}).)*{)|[^{}]*$)/g, '$1. ')
	// inside comments
	//moves = moves.replace(/(\d+\.)(\.+)(?=((?!{).)*?})/g, '$1 $2')
	
	// Remove repeated whitespace
	moves = moves.replace(/\s\s+/g, ' ')

	// Delete leading whitespace
	moves = moves.trim()

	return moves
	
    }

    function pgnMovesToNodes(pgnMoves, startFEN) {

	var chess = new Chess()
	var moves = pgnMoves.split(/\s/)

	// init
	var nodes = {}
	var parentIndx = '(0)'
	var curIndx = '(0)(0)'
	var branchIndx = {}
	var branchLevel = 0
	var commentIndx = '(0)(0)'

	// init root node
	nodes['(0)'] = {}
	nodes['(0)']['children'] = []
	nodes['(0)']['branchLevel'] = 0
	nodes['(0)']['FEN'] = startFEN ?
	    startFEN : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

	chess.load(nodes['(0)']['FEN'])
	
	var startsWithComment = true	
	var i = 0

	// iterate over data
	len = moves.length
	while (i < len) {

	    if (nodes[curIndx] == undefined) {
		nodes[curIndx] = {}
		nodes[curIndx]['children'] = []
	    }

	    nodes[curIndx]['parentIndx'] = parentIndx
	    nodes[curIndx]['branchLevel'] = branchLevel
	    
	    // end of game
	    if (moves[i] === '*' ||
		moves[i] === '1-0' ||
		moves[i] === '0-1' ||
		moves[i] === "1/2-1/2") {
		startsWithComment = false
		i += 1
		continue
	    }

	    // NAGs
	    if (/^\$/.test(moves[i])) {
		startsWithComment = false
		nodes[commentIndx]['NAG'] = moves[i]
		i += 1
		continue
	    }

	    // move nr or move description
	    if ( /^[1-9]/.test(moves[i]) || /^\.+$/.test(moves[i]) ) {
		startsWithComment = false
		i += 1
		continue
	    }

	    // comment
	    if (moves[i] == '{') {

		i += 1
		var comment = ''
		while(moves[i] !== '}') {
		    comment += ' ' + moves[i]
		    i += 1
		}

		if(startsWithComment == true) {
		    nodes[commentIndx]['startComment'] = comment.trim()
		} else {
		    nodes[commentIndx]['comment'] = comment.trim()
		}

		startsWithComment = false
		i += 1
		continue
	    }

	    // SAN
	    if ('abcdefghRBNQKO0'.indexOf(moves[i][0]) !== -1) {

		startsWithComment = false
		nodes[parentIndx]['children'].push(curIndx)
		branchIndx[branchLevel+1] = curIndx
		nodes[curIndx]['SAN'] = moves[i]
		commentIndx = curIndx
		
		// calculate FEN
		chess.load(nodes[parentIndx]['FEN'])
		chess.move(moves[i])
		nodes[curIndx]['FEN'] = chess.fen()
		
		// prepare next iteration
		parentIndx = curIndx
		curIndx += '(0)' // superfluous nodes may be created, delete them later

		i += 1
		continue
	    }

	    // start of variation
	    if (moves[i] == '(') {
		startsWithComment = true
		branchLevel += 1
		parentIndx = nodes[branchIndx[branchLevel]]['parentIndx']

		var numSiblings = nodes[parentIndx]['children'].length
		curIndx = parentIndx + '(' + numSiblings.toString() + ')'
		commentIndx = curIndx
		i += 1
		continue
	    }

	    // end of variation
	    if (moves[i] == ')') {
		startsWithComment = true
		parentIndx = branchIndx[branchLevel]
		curIndx = parentIndx + '(0)'
		commentIndx = curIndx
		branchLevel -= 1
		i += 1
		continue
	    }
	}


	// delete superfluous nodes
	var keys = Object.keys(nodes)
	for (var k = 0; k < keys.length; k++) {

	    if (keys[k] == '(0)') {
		continue
	    }
	    
	    var n = nodes[keys[k]]
	    if (n['SAN'] == undefined) {
		delete nodes[keys[k]]
	    }
	}

	
	return nodes
	
    }


    function numOfClosedParenthesesAfterNode(nodes, nodeIndx) {

	if (nodes[nodeIndx]['children'].length > 0) {
	    // node is not end node
	    return {num: 0, isLast: false}
	}

	
	var childIndx = parseInt(nodeIndx.match(/\((\d*)\)$/)[1])
	var branchIndx = nodes[nodeIndx]['parentIndx']

	
	if (childIndx == 0 && nodes[branchIndx]['children'].length > 1) {
	    // node belongs to mainline and has siblings
	    return {num: 0, isLast: false}
	}
	
	var numClosed = 1
	var branchLevel = nodes[nodeIndx]['branchLevel']
	var branchSAN = nodes[branchIndx]['SAN']

	
	// Test if node is last child of current branch
	function testLastChild() {
	    while(nodes[branchIndx]['branchLevel'] != branchLevel-1) {
		childIndx = parseInt(branchIndx.match(/\((\d*)\)$/)[1])
		branchIndx = nodes[branchIndx]['parentIndx']
		branchSAN = nodes[branchIndx]['SAN']
	    }

	    var numBranches = nodes[branchIndx]['children'].length

	    if (nodes[branchIndx + '(0)(0)']) {
		// mainline continues after branch node
		return {num: numClosed, isLast: false}

		
	    } else {
		if (numBranches == childIndx + 1 && branchLevel > HTMLIndentLevel) {
		    // node ends previous branch.
		    numClosed += 1
		    branchLevel -= 1
		    return testLastChild()
		} else if (branchLevel == HTMLIndentLevel &&
			   numBranches == childIndx + 1) {
		    
		    return {num: numClosed, isLast: true}
		    
		} else {
		    return {num: numClosed, isLast: false} 
		}
	    }
	}

	return testLastChild()
    }

    
    function nodesToHTML(nodes, nodeIndx) {

	var parentIndx = nodes[nodeIndx]['parentIndx']
	var grandParent = nodes[parentIndx] ?
	    nodes[parentIndx]['parentIndx'] : undefined

	var children = nodes[nodeIndx]['children']
	var branchLevel = nodes[nodeIndx]['branchLevel']
	var FEN = nodes[nodeIndx]['FEN']
	var mvNr = FEN.split(' ')[5]
	var sideToMove = FEN.split(' ')[1]
	var displayMvNr = false
	var rv = ''

	
	// root node
	if (nodeIndx === '(0)') {
	    rv += '<div class="notation branchLevel0"><span id="(0)"></span>'
	}

	// continuation after comment
	if (nodes[parentIndx] &&
	    nodes[parentIndx]['comment'] != undefined) {

	    displayMvNr = true
	}
	
	// beginning of variation
	if (nodes[parentIndx] &&
	    nodes[parentIndx]['branchLevel'] !== nodes[nodeIndx]['branchLevel']) {

	    if (branchLevel < HTMLIndentLevel) {
		rv += '<div class="notation branchLevel' + branchLevel + '">'
	    } else {
		rv += '<div class="notation branchLevel5">'
		rv += '<span class="openParen">(</span>'
	    }
	    displayMvNr = true

	}

	// mainline continuation after variation
	if (nodes[parentIndx] && nodes[grandParent] &&
	    nodes[grandParent]['branchLevel'] === nodes[nodeIndx]['branchLevel'] &&
	    nodes[grandParent]['children'].length > 1) {

	    displayMvNr = true

	    if (branchLevel < HTMLIndentLevel - 1) {
		rv += '<div class="notation branchLevel' + branchLevel + '">'
	    } else {
		rv += ' '
	    }
	}

	if (nodes[nodeIndx]['startComment'] != undefined) {

	    rv += '<span class="startComment" id="startComment' + nodeIndx + '">'
	    rv += nodes[nodeIndx]['startComment'] + ' '
	    rv += '</span>'

	    displayMvNr = true
	}

	if (nodeIndx !== '(0)' && sideToMove === 'b') {
	    displayMvNr = true
	}


	// move number
	rv += '<span id="mvNr' + nodeIndx + '">'
	
	if (displayMvNr === true || nodeIndx === '(0)(0)') {
	    
	    if (sideToMove === 'b') {
		rv += mvNr + '.'
	    } else {
		rv += parseInt(mvNr)-1  + '...'
	    }
	    rv += '&nbsp;'
	}
	rv += '</span>'

	
	if (nodes[nodeIndx]['SAN'] != undefined) {
	    rv += '<span id="' + nodeIndx
		+ '" class="selectableMove"'
		+ '>'
	    rv += nodes[nodeIndx]['SAN']
	
	    var NAG = nodes[nodeIndx]['NAG']
	    if (NAG != undefined) {
		rv += convertNAG2Symbol(NAG)
	    }

	    rv += ' &#8203;</span>'
	}

	if (nodes[nodeIndx]['comment'] != undefined) {
	    rv += '<span class="comment" id="comment' + nodeIndx + '">'
	    rv += nodes[nodeIndx]['comment'] + ' '
	    rv += '</span>'
	}

	
	// end of variation
	if (children.length === 0) {
	    
	    if (branchLevel >= HTMLIndentLevel) {
		var numClosed = numOfClosedParenthesesAfterNode(nodes, nodeIndx)
		for (var i = 0; i < numClosed.num; i++) {
		    rv += '<span class="closeParen">)</span>'
		}

		if (numClosed.isLast) {
		    rv += '</div>'
		}
	    }

	    
	    if (branchLevel == HTMLIndentLevel - 1) {

		if (nodes[parentIndx]['children'].length > 1) {
		    // close if numOfClosedParenthesisAfterNode.isLast
		    rv += ''
		} else {
		    rv += '</div>'
		}
		
	    } else {
		rv += '</div>'
	    }
	}


	// branch point
	if (nodes[parentIndx] &&
	    nodes[parentIndx]['branchLevel'] == branchLevel &&
	    nodes[parentIndx]['children'].length > 1) {

	    if (branchLevel < HTMLIndentLevel - 1 ) {
		rv += '</div>'
	    }
	    
	}

	return rv
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
	case "$11":
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
    
    

    function traverseNodes(nodes, formatFunc) {

	var seenNodes = []
	
	function parseNode(indx) {

	    if (!seenNodes.includes(indx)) {
		formatFunc(indx)
		seenNodes.push(indx)
	    }

	    
	    var mainlineIndx = indx + '(0)'

	    if (nodes[mainlineIndx] != undefined && !seenNodes.includes(mainlineIndx)) {
		formatFunc(mainlineIndx)
		seenNodes.push(mainlineIndx)
	    }


	    var i = 1
	    while (true) {
		var childIndx = indx + '(' + i.toString() + ')'
		if (nodes[childIndx] != undefined) {
		    parseNode(childIndx)
		} else {
		    break
		}

		i += 1
	    }


	    if (nodes[mainlineIndx] != undefined) {
		parseNode(mainlineIndx)
	    }
	}
	
	// start with root node
	parseNode('(0)')
	
    }
    
    
    // Module exports
    module.readGamesFromFile = readGamesFromFile
    module.parsePGNData = parsePGNData
    module.pgnMovesToNodes = pgnMovesToNodes
    module.nodesToHTML = nodesToHTML
    module.traverseNodes = traverseNodes
    
    return module
}
