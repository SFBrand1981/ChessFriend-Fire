// read and parse pgn
module.exports = function () {

    var fs = require('fs')
    var path = require('path')
    var Chess = require('chess.js').Chess

    var LabelHandler = require(path.join(process.cwd(), '/app/labels.js'))
    var lh = new LabelHandler()

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


    function exportGameAsTex(templateValues) {

	// read LaTeX template
	var templPath = path.join(process.cwd(), '/assets/latex/template.tex')
	var template = fs.readFileSync(templPath, 'utf8')
	var callback

	var tex = ''


	template = template.replace('--playerWhite--', templateValues.playerWhite)
	template = template.replace('--playerBlack--', templateValues.playerBlack)
	template = template.replace('--event--', templateValues.event)
	
	traverseNodes(templateValues.nodes, function(nodeIndx) {
	    tex += nodesToLaTeX(templateValues.nodes, nodeIndx)
	})

	template = template.replace('--latexCode--', tex)
	template = template.replace(/\#\s/g, '\\# ')


	fs.writeFile(templateValues.filename, template, function (err) {
            if (err) {
		console.info("There was an error attempting to save your data.")
		console.warn(err.message)
		return
            } else if (callback) {
		// callback()
            }
	})
    }

    function exportGameAsPGN(pgnData) {
	
	// read LaTeX template
	var filepath = path.join(pgnData.filename)
	pgn_stream = fs.createWriteStream(filepath, {flags:'w'})
	
	var gameInfo = pgnData.gameInfo
	console.log(gameInfo)

	var startFEN = pgnData.nodes[lh.rootNode()]['FEN']
	var res
	switch (gameInfo.res) {
	case '1':
	    res = '1-0'
	    break
	case '2':
	    res = '1/2-1/2'
	    break
	case '3':
	    res = '0-1'
	    break
	case '4':
	    res = '*'
	    break
	}

	pgn_stream.write('[Event "' + gameInfo.event + '"]\n')
	pgn_stream.write('[Site "' + gameInfo.site + '"]\n')
	pgn_stream.write('[Date "' + gameInfo.date + '"]\n')
	pgn_stream.write('[Round "' + gameInfo.round + '"]\n')
	pgn_stream.write('[White "' + gameInfo.white + '"]\n')
	pgn_stream.write('[Black "' + gameInfo.black + '"]\n')
	pgn_stream.write('[Result "' + res + '"]\n')
	pgn_stream.write('[WhiteElo "' + gameInfo.elow + '"]\n')
	pgn_stream.write('[BlackElo "' + gameInfo.elob + '"]\n')
	if (startFEN != 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
	    pgn_stream.write('[FEN "' + startFEN + '"]\n')
	} 
	pgn_stream.write('\n')

	var pgn = ''
	traverseNodes(pgnData.nodes, function(nodeIndx) {
	    pgn += nodesToPGN(pgnData.nodes, nodeIndx)
	})
	pgn += ' ' + res + '\n'
	pgn_stream.write(pgn)
	
	pgn_stream.end()
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
    	var parentIndx = lh.rootNode()
    	var curIndx = lh.getNextMainlineIndx(lh.rootNode())
    	var branchIndx = {}
    	var branchLevel = 0
    	var commentIndx = lh.getNextMainlineIndx(lh.rootNode())

	
    	// init root node
    	nodes[lh.rootNode()] = {}
    	nodes[lh.rootNode()]['children'] = []
    	nodes[lh.rootNode()]['branchLevel'] = 0
    	nodes[lh.rootNode()]['FEN'] = startFEN ?
    	    startFEN : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

    	chess.load(nodes[lh.rootNode()]['FEN'])
	
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
    		curIndx = lh.getNextMainlineIndx(curIndx) // superfluous nodes may be created, delete them later

    	 	i += 1
    	 	continue
    	    }

    	    // start of variation
    	    if (moves[i] == '(') {
    		startsWithComment = true
    		branchLevel += 1
    		parentIndx = nodes[branchIndx[branchLevel]]['parentIndx']

    		var numSiblings = nodes[parentIndx]['children'].length
    		curIndx = lh.getNextSiblingIndx(parentIndx, numSiblings)
    		commentIndx = curIndx
    		i += 1
    		continue
    	    }

    	    // end of variation
    	    if (moves[i] == ')') {
    		startsWithComment = true
    		parentIndx = branchIndx[branchLevel]
    		curIndx = lh.getNextMainlineIndx(parentIndx)
    		commentIndx = curIndx
    		branchLevel -= 1
    		i += 1
    		continue
    	    }
    	}


    	// delete superfluous nodes
    	var keys = Object.keys(nodes)
    	for (var k = 0; k < keys.length; k++) {

    	    if (keys[k] == lh.rootNode()) {
    		continue
    	    }
	    
    	    var n = nodes[keys[k]]
    	    if (n['SAN'] == undefined) {
    		delete nodes[keys[k]]
    	    }
    	}

	
    	return nodes
	
    }


    function extractedPGNMovesToNodes(pgnMoves, startFEN) {
	
    	var moves = pgnMoves.split(/\s/)

    	// init
    	var nodes = {}
    	var parentIndx = lh.rootNode()
    	var curIndx = lh.getNextMainlineIndx(lh.rootNode())
    	var branchIndx = {}
    	var branchLevel = 0
    	var commentIndx = lh.getNextMainlineIndx(lh.rootNode())

	
    	// init root node
    	nodes[lh.rootNode()] = {}
    	nodes[lh.rootNode()]['children'] = []
    	nodes[lh.rootNode()]['branchLevel'] = 0
    	nodes[lh.rootNode()]['FEN'] = startFEN ?
    	    startFEN : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
	
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
    		i += 1
    		continue
    	    }
	    

    	    // move nr or move description
    	    if ( /^[1-9]/.test(moves[i]) || /^\.+$/.test(moves[i]) ) {
    		i += 1
    		continue
    	    }

    	    // FEN from comment
    	    if (moves[i] == '{') {

    		i += 1
    		var FEN = ''
    		while(moves[i] !== '}') {
    		    FEN += ' ' + moves[i]
    		    i += 1
    		}

    		nodes[commentIndx]['FEN'] = FEN.trim()
    		i += 1
    		continue
    	    }

    	    // SAN
    	    if ('abcdefghRBNQKO0'.indexOf(moves[i][0]) !== -1) {

    		nodes[parentIndx]['children'].push(curIndx)
    		branchIndx[branchLevel+1] = curIndx
    		nodes[curIndx]['SAN'] = moves[i]
    		commentIndx = curIndx
		
		
    		// prepare next iteration
    		parentIndx = curIndx
    		curIndx = lh.getNextMainlineIndx(curIndx) 

    	 	i += 1
    	 	continue
    	    }

    	}


    	// delete superfluous nodes
    	if (nodes[curIndx] != lh.rootNode() && nodes[curIndx]['SAN'] == undefined) {
    	    delete nodes[curIndx]
    	} 
	
    	return nodes
	
    }


    function numOfClosedParenthesesAfterNode(nodes, nodeIndx) {

	if (nodes[nodeIndx]['children'].length > 0) {
	    // node is not end node
	    return {num: 0, isLast: false}
	}

	
	var childIndx = lh.getChildIndx(nodeIndx)
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

		
		childIndx = lh.getChildIndx(branchIndx)
		branchIndx = nodes[branchIndx]['parentIndx']
		branchSAN = nodes[branchIndx]['SAN']
	    }

	    var numBranches = nodes[branchIndx]['children'].length

	    if (nodes[lh.getNextMainlineIndx(lh.getNextMainlineIndx(branchIndx))]) {
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


    function numOfSiblingBranches(nodes, nodeIndx) {


	if (nodes[nodeIndx]['branchLevel'] == 0) {
	    // mainline has no siblings
	    return 0
	}
	
	var branchIndx = nodes[nodeIndx]['parentIndx']
	var childIndx = nodeIndx
	var branchLevel = nodes[nodeIndx]['branchLevel']
	
	while(nodes[branchIndx]['branchLevel'] != branchLevel-1) {
	    childIndx = branchIndx
	    branchIndx = nodes[branchIndx]['parentIndx']
	}

	var numSiblings = nodes[branchIndx]['children'].length - 1
	var siblingIndx = lh.getChildIndx(childIndx)


	return {numSiblings: numSiblings, siblingIndx: siblingIndx}
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
	if (nodeIndx === lh.rootNode()) {
	    rv += '<div class="notation branchLevel0"><span id="' + lh.rootNode() + '"></span>'
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

	if (nodeIndx !== lh.rootNode() && sideToMove === 'b') {
	    displayMvNr = true
	}


	// move number
	rv += '<span id="mvNr' + nodeIndx + '">'
	
	if (displayMvNr === true || nodeIndx === lh.getNextMainlineIndx(lh.rootNode())) {
	    
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

	    
	    var mainlineIndx = lh.getNextMainlineIndx(indx)

	    if (nodes[mainlineIndx] != undefined && !seenNodes.includes(mainlineIndx)) {
		formatFunc(mainlineIndx)
		seenNodes.push(mainlineIndx)
	    }


	    var i = 1
	    while (true) {
		var childIndx = lh.getNextSiblingIndx(indx, i)
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
	parseNode(lh.rootNode())
	
    }
    

    function nodesToLaTeX(nodes, nodeIndx) {

	var parentIndx = nodes[nodeIndx]['parentIndx']
	var grandParent = nodes[parentIndx] ?
	    nodes[parentIndx]['parentIndx'] : undefined

	var children = nodes[nodeIndx]['children']
	var branchLevel = nodes[nodeIndx]['branchLevel']
	var FEN = nodes[nodeIndx]['FEN']
	var mvNr = FEN.split(' ')[5]
	var sideToMove = FEN.split(' ')[1]
	var mvDesc = (sideToMove === 'b') ? mvNr + '.' : parseInt(mvNr)-1 + '...'
	var displayMvNr = false
	var numSiblings = numOfSiblingBranches(nodes, nodeIndx)
	var startBold = false

	var rv = ''


	// continuation after comment
	if (nodes[parentIndx] &&
	    nodes[parentIndx]['comment'] != undefined) {

	    displayMvNr = true
	    startBold = (branchLevel == 0) ? true : false
	}
	
	// beginning of variation
	if (nodes[parentIndx] &&
	    nodes[parentIndx]['branchLevel'] !== nodes[nodeIndx]['branchLevel']) {

	    if (branchLevel < HTMLIndentLevel) {

		if (numSiblings.numSiblings == 1) {
		    rv += (branchLevel == 1) ? '\n\n' : '('
		} else {
		    if (numSiblings.siblingIndx == 1) {
			rv += '\n\n\\begin{enumerate}\n\\item\n'
		    } else {
			rv += '\n\n\\item\n'
		    }
		}

	    } else {
		rv += '('
	    }
	    
	    displayMvNr = true
	}

	// mainline continuation after variation
	if (nodes[parentIndx] && nodes[grandParent] &&
	    nodes[grandParent]['branchLevel'] === nodes[nodeIndx]['branchLevel'] &&
	    nodes[grandParent]['children'].length > 1) {

	    displayMvNr = true
	    startBold = (branchLevel == 0) ? true : false
	}

	if (nodes[nodeIndx]['startComment'] != undefined) {

	    rv += (branchLevel == 0) ? '\n\n' : ''
	    rv += nodes[nodeIndx]['startComment'] 
	    rv += (branchLevel == 0) ? '\n\n' : ' '

	    displayMvNr = true
	    startBold = (branchLevel == 0) ? true : false
	}

	if (nodeIndx !== lh.rootNode() && sideToMove === 'b') {
	    displayMvNr = true
	}


	// mainline SAN
	if (startBold) {
	    rv += '{\\bf '
	} else {
	    if (nodeIndx == lh.getNextMainlineIndx(lh.rootNode())) {
		rv += '{\\bf '
	    }
	}
	

	// move number
	if (displayMvNr === true || nodeIndx === lh.getNextMainlineIndx(lh.rootNode())) {
	    rv += mvDesc
	}

	
	if (nodes[nodeIndx]['SAN'] != undefined) {

	    var spacing = (children.length == 0) ? '' : ' '
	    
	    
	    var NAG = nodes[nodeIndx]['NAG']
	    if (NAG != undefined) {
		rv += nodes[nodeIndx]['SAN'] + convertNAG2Symbol(NAG) + spacing
	    } else {
		rv += nodes[nodeIndx]['SAN'] + spacing
	    }

	    
	    if (branchLevel == 0 && nodes[nodeIndx]['comment'] != undefined) {
		rv += '}'
	    } else {
		if (branchLevel == 0 &&
		    nodes[parentIndx] && nodes[parentIndx]['children'].length > 1) {
		    rv += '}'
		}
	    }

	    
	}

	
	// comments
	if (nodes[nodeIndx]['comment'] != undefined) {
	    
	    rv += (branchLevel == 0) ? '\n\n' : ' '

	    if (/\\diagram/.test(nodes[nodeIndx]['comment'])) {
		var diagram = '\\diagram{'
		    + nodes[nodeIndx]['FEN'] + '}{'
		    + mvDesc
		    + nodes[nodeIndx]['SAN'] + '}'
		rv += nodes[nodeIndx]['comment'].replace(/\\diagram/, diagram)
	    } else {
		rv += nodes[nodeIndx]['comment']
	    }

	    rv += (branchLevel == 0) ? '\n\n' : ' '
	}

	
	// end of variation
	if (children.length === 0) {
	    
	    if (branchLevel >= HTMLIndentLevel) {
		var numClosed = numOfClosedParenthesesAfterNode(nodes, nodeIndx)
		for (var i = 0; i < numClosed.num; i++) {
		    rv += ')'
		}
	    } else {

		if (branchLevel == 0) {
		    // end of game
		} else if (numSiblings.numSiblings == 1) {
		    rv += (branchLevel == 1) ? '\n\n' : ') '
		} else {

		    if ((numSiblings.siblingIndx) == numSiblings.numSiblings) {
			rv += '\n\\end{enumerate}\n\n'
		    }
		}
	    }
	}

	return rv
    }


    function nodesToPGN(nodes, nodeIndx) {

	var parentIndx = nodes[nodeIndx]['parentIndx']
	var grandParent = nodes[parentIndx] ?
	    nodes[parentIndx]['parentIndx'] : undefined

	var children = nodes[nodeIndx]['children']
	var branchLevel = nodes[nodeIndx]['branchLevel']
	var FEN = nodes[nodeIndx]['FEN']
	var mvNr = FEN.split(' ')[5]
	var sideToMove = FEN.split(' ')[1]
	var mvDesc = (sideToMove === 'b') ? mvNr + '.' : parseInt(mvNr)-1 + '...'
	var displayMvNr = false
	var numSiblings = numOfSiblingBranches(nodes, nodeIndx)

	var rv = ''


	// continuation after comment
	if (nodes[parentIndx] &&
	    nodes[parentIndx]['comment'] != undefined) {

	    displayMvNr = true
	}
	
	// beginning of variation
	if (nodes[parentIndx] &&
	    nodes[parentIndx]['branchLevel'] !== nodes[nodeIndx]['branchLevel']) {
	    
	    rv += '('	    
	    displayMvNr = true
	}

	// mainline continuation after variation
	if (nodes[parentIndx] && nodes[grandParent] &&
	    nodes[grandParent]['branchLevel'] === nodes[nodeIndx]['branchLevel'] &&
	    nodes[grandParent]['children'].length > 1) {

	    displayMvNr = true
	    startBold = (branchLevel == 0) ? true : false
	}

	if (nodes[nodeIndx]['startComment'] != undefined) {

	    rv += ' {' + nodes[nodeIndx]['startComment'] + '} '
	    displayMvNr = true
	}

	if (nodeIndx !== lh.rootNode() && sideToMove === 'b') {
	    displayMvNr = true
	}

	
	// move number
	if (displayMvNr === true || nodeIndx === lh.getNextMainlineIndx(lh.rootNode())) {
	    rv += mvDesc
	}

	
	if (nodes[nodeIndx]['SAN'] != undefined) {

	    var spacing = (children.length == 0) ? '' : ' '
	    
	    var NAG = nodes[nodeIndx]['NAG']
	    if (NAG) {
		rv += nodes[nodeIndx]['SAN'] + NAG + spacing
	    } else {
		rv += nodes[nodeIndx]['SAN'] + spacing
	    }
	    
	}

	
	// comments
	if (nodes[nodeIndx]['comment'] != undefined) {
	    
	    rv += ' {' + nodes[nodeIndx]['comment'] + '} '
	}

	
	// end of variation
	if (children.length === 0) {
	    
	    if (branchLevel != 0) {
		var numClosed = numOfClosedParenthesesAfterNode(nodes, nodeIndx)
		for (var i = 0; i < numClosed.num; i++) {
		    rv += ')'
		}
		rv += ' '
	    } else {
		// end of game
	    }
	}

	return rv
    }


    function getPositions(nodes) {
	var positions = []
	
	for (var k in nodes) {	    
	    var pos = nodes[k]['FEN'].split(' ')[0]
	    
	    if (!(pos in positions) && pos != "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR") {
		positions.push(pos)
	    }
	}
	
	return positions
    }

    
    // Module exports
    module.readGamesFromFile = readGamesFromFile
    module.parsePGNData = parsePGNData
    module.pgnMovesToNodes = pgnMovesToNodes
    module.extractedPGNMovesToNodes = extractedPGNMovesToNodes
    module.nodesToHTML = nodesToHTML
    module.traverseNodes = traverseNodes
    module.exportGameAsTex = exportGameAsTex
    module.exportGameAsPGN = exportGameAsPGN
    module.getPositions = getPositions
    
    return module
}
