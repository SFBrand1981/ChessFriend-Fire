// Worker to import large number of PGNs into DB
var fs = require('fs')
var path = require('path')
var cfdt = require(path.join(process.cwd(), '/app/chessfriendDevTools'))
var BoardHandling = require(path.join(process.cwd(), '/app/boardHandling.js'))

var board = new BoardHandling()
var nodes = {}

var batch_size = 100

var import_data
var num_games
var num_imported

board.setNotationStyle('algebraic') // faster!

function importBatch() {

    var games = import_data.split(/(\[Event\s.*\])/)
    var offset = num_imported

    
    for (var i = 2*offset; i < 2*(offset + batch_size); i += 2) {

	if (i >= 2*num_games) {
	    return
	}
	
	var game = games[i+1] + games[i+2]

	board.importOneGame(game, function(pgn) {
	    board.createNodesFromPGN(pgn, nodes, function(n) {
		
		num_imported += 1
		
		process.send({ importWorker : {importing : true,
	     				       pgn : pgn,
	     				       nodes : n,
	     				       num_imported : num_imported} })

		if (num_imported === num_games) {
		    process.send({ importWorker : 'imported' })
		}
		
	    })
	})

    }
    
    process.send({ importWorker : {batch_completed : true,
	     			   num_imported : num_imported} })

	
}



process.on('message', (msg) => {


    if (msg.importWorker.startImport) {
	
	fs.readFile(msg.importWorker.filename, 'utf8', function (err, data) {

	    if (err) {
		alert("There was an error attempting to read your data.")
		cfdt.warn(err.message)
		return
	    }
	
	    function count() {
		const re = /\[Event\s.*\]/g
		return ((data || '').match(re) || []).length
	    }
	    
	    num_games = count()
	    process.send({ importWorker : {num_games : num_games} })
	    
	    import_data = data
	    num_imported = 0

	    importBatch()

	})
	
    }

    if (msg.importWorker === 'continueImport') {
	importBatch()
    }
})

