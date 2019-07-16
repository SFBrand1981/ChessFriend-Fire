// run tests

var path = require('path')
var fs = require('fs')
var es = require('event-stream')
var PGNHandler = require(path.join(process.cwd(), 'app/pgn.js'))
var LabelHandler = require(path.join(process.cwd(), 'app/labels.js'))
var SettingsHandler = require(path.join(process.cwd(), '/app/settings.js'))

var errCount = {}

function testPGNParser() {

    console.log("testPGNParser")
    var ph = new PGNHandler()
    
    var pgn_file = path.join(process.cwd(), '../tests/test6.pgn')
    console.log("Reading pgn from file " + pgn_file + '\n')
    
    ph.readGamesFromFile(pgn_file, function(pgn) {

	console.log("Num games: " + pgn.num_games)
	console.log("Current game: " + pgn.game_num)
	var pgnData = ph.parsePGNData(pgn.pgn)
	var nodes = ph.pgnMovesToNodes(pgnData['Moves'], pgnData['FEN'])

	var rv = ''
	ph.traverseNodes(nodes, function(nodeIndx) {
	    rv += ph.nodesToHTML(nodes, nodeIndx)
	})

	console.log(nodes)
	//console.log(rv)
    })

}


function testPGNExtractParser() {

    console.log("testPGNExtractParser")

    var starttime = Date.now()
    console.log(starttime)
    
    var ph = new PGNHandler()
    var sh = new SettingsHandler()
    
    var pgn_file = path.join(process.cwd(), '../DB/with_fens.pgn')
    console.log("Reading pgn from file " + pgn_file + '\n')

    var games_stream = fs.createWriteStream("../DB/appendG.pgn", {flags:'a'})
    var nodes_stream = fs.createWriteStream("../DB/appendN.pgn", {flags:'a'})


    var num_games = 0
    var pgn = ''

    var readstream = fs.createReadStream(pgn_file)
	.pipe(es.split())
	.pipe(es.mapSync(function(line){

	    // pause the readstream
	    readstream.pause();
	    
	    // process line here and call s.resume() when rdy		
	    if (/(\[Event\s.*\])/.test(line)) {

		if (num_games !== 0) {
		    processGameInfo()
		    num_games += 1
		    pgn = ' ' + line
		} else {
		    num_games += 1
		    pgn += line
		    readstream.resume()
		}
	    } else {
		// continue reading
		pgn += ' ' + line 
		readstream.resume()
	    }
	    
	}).on('error', function(err){
	    console.log('Error while reading file.', err);
	}).on('end', function(){

	    //finish
	    processGameInfo()
	    games_stream.end()
	    nodes_stream.end()
	    console.log("Duration: " + (Date.now()-starttime).toString())
	    
	}))

    
    
    function processGameInfo() {

	console.log("Current game: " + num_games)

	if (num_games > 50000) {
	    // avoid too much memory consumption
	    readstream.end()
	    return
	}
	
	var pgnData = ph.parsePGNData(pgn)
	var game_id = num_games
	var nodes = ph.extractedPGNMovesToNodes(pgnData['Moves'], pgnData['FEN'])
	
	var gameInfo = {}		
	gameInfo.star = 0
	gameInfo.white = pgnData['White']
	gameInfo.elow = pgnData['WhiteElo']
	gameInfo.black = pgnData['Black']
	gameInfo.elob = pgnData['BlackElo']
	gameInfo.res = sh.res_enum[pgnData['Result']]
	gameInfo.event = pgnData['Event']
	gameInfo.site = pgnData['Site']
	gameInfo.round = pgnData['Round']
	gameInfo.date = pgnData['Date']
	gameInfo.tags = []
	gameInfo.positions = ph.getPositions(nodes)
	gameInfo.id = game_id

	var prefix = (game_id == 1) ? '' : ",\n"
	games_stream.write(prefix + JSON.stringify(gameInfo))
	
	var nodeInfo = {}
	nodeInfo.game_id = game_id
	nodeInfo.nodes = nodes
	nodes_stream.write(prefix + JSON.stringify(nodeInfo))

	readstream.resume()

    }
    
}


function testLabelHandler() {
    console.log("testLabelHandler\n")
    var lh = new LabelHandler()

    errCount['testLabelHandler'] = 0

    console.log('Test root node')
    console.log(lh.rootNode())
    console.log()
    if (lh.rootNode() != '1z') {
	errCount['testLabelHandler'] += 1
    }


    console.log('Test getBranchNode')
    var labelsToTest = {}
    labelsToTest[0] = lh.rootNode()
    labelsToTest[1] = '3z1n'
    labelsToTest[2] = '1z1n1z1n'
    labelsToTest[3] = '3z1n2n'
    labelsToTest[4] = '3z1n2n1z'
    labelsToTest[5] = '2z1n1z'
    labelsToTest[6] = '2z1n2z'
    labelsToTest[7] = '2z5n2z'
    labelsToTest[8] = '2z5n2n2z'
    labelsToTest[9] = '2z5n2n2z1n'
    labelsToTest[10] = '2z'
    
    

    for (let [key, value] of Object.entries(labelsToTest)) {
	console.log(labelsToTest[key] + ': ' + lh.getBranchNode(labelsToTest[key]))
	console.log()
    }
    console.log()
    
}


function runTests() {

    testPGNExtractParser(errCount)
    // testPGNParser(errCount)
    // testLabelHandler()
    
    console.log("TEST COMPLETED")
    console.log("Errors:")
    console.log(errCount)

}

runTests()

