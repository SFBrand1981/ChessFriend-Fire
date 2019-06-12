// run tests

var path = require('path')
var PGNHandler = require(path.join(process.cwd(), 'src/app/pgn.js'))


var errCount = {}

function testPGNParser() {

    console.log("testPGNParser")
    var ph = new PGNHandler()
    
    var pgn_file = path.join(process.cwd(), '/tests/test6.pgn')
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


function runTests() {


    testPGNParser(errCount)
    console.log("TEST COMPLETED")

}

runTests()

