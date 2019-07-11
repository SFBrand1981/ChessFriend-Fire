// run tests

var path = require('path')
var PGNHandler = require(path.join(process.cwd(), 'app/pgn.js'))
var LabelHandler = require(path.join(process.cwd(), 'app/labels.js'))


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

    testPGNParser(errCount)
    testLabelHandler()
    console.log("TEST COMPLETED")
    console.log("Errors:")
    console.log(errCount)

}

runTests()

