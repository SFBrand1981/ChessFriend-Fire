// Worker to import large number of PGNs into DB

var path = require('path')
var fs = require('fs')
var es = require('event-stream');
var PGNHandler = require(path.join(process.cwd(), '/app/pgn.js'))
var ph = new PGNHandler()

// NOT WORKING WITH CURRENT NWJS VERSION
// const setGlobalVars = require('indexeddbshim')
// const Dexie = require('dexie')

// //
// // Configure Dexie to use the IndexedDB shim.
// //
// // The intermediary shim object is required so we can pull out the objects
// // we need to configure Dexie without needing to pollute the global namespace.
// //
// // checkOrigin:false is required to avoid  SecurityError Cannot open
// // an IndexedDB database from an opaque origin.
// //
// const shim = {}
// setGlobalVars(shim, {checkOrigin: false})
// const { indexedDB, IDBKeyRange } = shim
// Dexie.dependencies.indexedDB = indexedDB
// Dexie.dependencies.IDBKeyRange = IDBKeyRange

// // Test Dexie
// const db = new Dexie('hellodb')
// db.version(1).stores({
//   tasks: '++id,date,description,done'
// })

// db.tasks.bulkPut([
//   {date: Date.now(), description: 'First item', done: 0},
//   {data: Date.now(), description: 'Second item', done: 1},
//   {data: Date.now(), description: 'Third item', done: 0}
// ]).then(() => {
//   db.tasks.where('done').above(0).toArray().then((tasks) => {
//     console.log(`Completed tasks: ${JSON.stringify(tasks, 0, 2)}`)
//   })
// }).catch((e) => {
//   console.error(`Error: ${e}`)
// })

var readstream
var pgn
var num_games

function parseNodesFromGameInfo() {

    var pgnData = ph.parsePGNData(pgn)
    var nodes = ph.pgnMovesToNodes(pgnData['Moves'], pgnData['FEN'])
    
    process.send({
	
     	importWorker : {readGame : true,
     			num_games : num_games,
     			pgnData: pgnData,
     			nodes: nodes}
    })
}


function extractNodesFromPGN() {
    
    var pgnData = ph.parsePGNData(pgn)
    var nodes = ph.extractedPGNMovesToNodes(pgnData['Moves'], pgnData['FEN'])
    
    process.send({
	
     	importWorker : {readGame : true,
     			num_games : num_games,
     			pgnData: pgnData,
     			nodes: nodes}
    })
}

process.on('message', (msg) => {

    function readGamesFromStream(callback) {

	num_games = 0
	pgn = ''

	readstream = fs.createReadStream(msg.importWorker.pgn_file)
	    .pipe(es.split())
	    .pipe(es.mapSync(function(line){

		// pause the readstream
		readstream.pause();
		
		// process line here and call s.resume() when rdy		
		if (/(\[Event\s.*\])/.test(line)) {

		    if (num_games !== 0) {
			callback()
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

		callback()

		// finish
		process.send({
		    importWorker : {completedImport : true,
				    num_games : num_games }
		})

	    }))
    }


    
    if (msg.importWorker.startPGNImport) {
	readGamesFromStream(parseNodesFromGameInfo)
    }

    if (msg.importWorker.startDBImport) {
	readGamesFromStream(extractNodesFromPGN)
    }

    if (msg.importWorker.resumeImport) {
	readstream.resume()
    }
})

