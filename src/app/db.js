// database

var Dexie = require('dexie')
var db = new Dexie('ChessFriendFireDB')

db.version(1).stores({
    games: "++id, star, white, elow, black, elob, event, date, *positions, *tags",
    nodes: "game_id",
    players: "&name",
    events: "&name",
    tags: "&name"
})


module.exports = function () {


    var path = require('path')
    var tools = require(path.join(process.cwd(), '/app/tools.js'))
    
    var PGNHandler = require(path.join(process.cwd(), '/app/pgn.js'))
    var ph = new PGNHandler()


    searchParams = {orderBy: 'id',
                    limit: undefined,
                    awesompleteLimit: undefined,
                    pageNum: 0,
                    totalCount: undefined,
                    queryCount: undefined,
                    gameList: [],
                    searching: false,
                    displaySearchBar: false,
                    fen: "",
                    white: "",
                    black: "",
                    event: "",
                    tags: [""]
                   }

    module.searchParams = searchParams


    module.resetSearchParams = function() {
        console.log("db.resetSearchParams")
        searchParams.fen = ""
        searchParams.white = ""
        searchParams.black = ""
        searchParams.event = ""
        searchParams.tags = [""]
        searchParams.gameList = []
    }
    
    
    module.getSearchLimits = function() {

        var sp = module.searchParams
        var num = sp.searching ? sp.queryCount : sp.totalCount
        var low = sp.pageNum * sp.limit + 1

        var high = (sp.pageNum + 1) * sp.limit
        if (num) { 
            high = Math.min(num, high)
        }

        if (num == 0) {
            return [0, 0, 0]
        } else {
            return [low, high, num]
        }
    }


    module.initSearchParams = function() {

        searchParams.limit = parseInt(localStorage.getItem('pageSize'))
        searchParams.awesompleteLimit =
            parseInt(localStorage.getItem('numAwesompleteSuggestions'))

        searchParams.totalCount = parseInt(localStorage.getItem('totalCount'))

        console.log("set searchParams.limit", searchParams.limit)
        console.log("set searchParams.awesompleteLimit", searchParams.awesompleteLimit)
        console.log("set searchParams.totalCount", searchParams.totalCount)

        
        if (!searchParams.totalCount) {

            console.log("Counting games in database")
            return db.games.count().then( count => {
                searchParams.totalCount = count
                localStorage.setItem('totalCount', count)
                return count
            })
            
        } else {
            
            return new Promise (function(resolve, reject) {
                resolve(searchParams.totalCount)
            })
        }
    }


    module.queryDBEntries = function() {

        var limit = parseInt(searchParams.limit)
        var offset = parseInt(searchParams.pageNum * limit)

        
        if (searchParams.searching) {

            var query = {}
            
            if (searchParams.fen) {
	        query.positions = searchParams.fen
	    }
	    if (searchParams.white) {
	        query.white = searchParams.white
	    }
	    if (searchParams.black) {
	        query.black = searchParams.black
	    }
	    if (searchParams.event) {
		query.event = searchParams.event
	    }
            
            var queries = []
            if (Object.keys(query).length > 0) {
                queries = [db.games.where(query).primaryKeys()]
            }

            if (searchParams.tags[0] != "") {
                for (var i = 0, len = searchParams.tags.length; i < len; i++) {
                    queries.push(db.games.where('tags').equals(searchParams.tags[i]).primaryKeys())
                }
	    }
            
            return Promise.all(queries).then(keys => {

                // Find all common primary keys
                var intersection = tools.intersect([...keys])
                searchParams.queryCount = intersection.length
                
                // Look up the actual objects from these primary keys
                return db.games.bulkGet(intersection).then(entries => {
                
                    var sp = module.searchParams
                    var low = sp.pageNum * sp.limit                        
                    var high = (sp.pageNum + 1) * sp.limit -1

                    var sorted = entries.sort(function(a, b) {

                        var valA = a[searchParams.orderBy]
                        var valB = b[searchParams.orderBy]
                        var comparison = 0
                        
                        if (valA && valB) {
                            comparison = (valA < valB) ? -1 : 1
                        } else if (valA) {
                            comparison = -1
                        } else if (valB) {
                            comparison = 1
                        }

                        if (searchParams.orderBy == "white" ||
                            searchParams.orderBy == "black") {
                            
                            return comparison
                        } else {
                            return comparison * (-1)
                        }
                    })

                    // reset gameList
                    searchParams.gameList = []
                    sorted.slice(low, high).forEach( x => {
                        searchParams.gameList.push(x.id)
                    })
                    
                    return sorted.slice(low, high)
                })
            })
            
            
        } else {
            // default
        
            let myOrderedTable = (() => {

                if (searchParams.orderBy == 'id') {
                    return db.games.reverse()
                } else if (searchParams.orderBy == 'star') {
                    return db.games.orderBy('star').reverse()
                } else if (searchParams.orderBy == 'elow') {
                    return db.games.orderBy('elow').reverse()
                } else if (searchParams.orderBy == 'elob') {
                    return db.games.orderBy('elob').reverse()
                } else if (searchParams.orderBy == 'date') {
                    return db.games.orderBy('date').reverse()
                } else {
                    return db.games.orderBy(searchParams.orderBy)
                }
            })()

            
            return myOrderedTable
                .offset(offset)
                .limit(limit)
                .toArray()
                .catch(function (e) {
                    alert (e)
                })

        }

    }



    module.addGame = function(gameInfo, nodes) {

        return db.transaction("rw", db.games, db.players, db.events, function() {
            
            var game_id = db.games.add({
                star: 0,
                white: gameInfo.white,
                elow: gameInfo.elow,
                black: gameInfo.black,
                elob: gameInfo.elob,
                res: gameInfo.res,
                event: gameInfo.event,
                site: gameInfo.site,
                round: gameInfo.round,
                date: gameInfo.date,
                tags: [],
                positions: ph.getPositions(nodes)
                
            })

            db.players.put({
                name: gameInfo.white.toLowerCase(),
                fullName: gameInfo.white
            })
            
            db.players.put({
                name: gameInfo.black.toLowerCase(),
                fullName: gameInfo.black
            })
            
            db.events.put({
                name: gameInfo.event.toLowerCase(),
                fullName: gameInfo.event
            })

            return game_id
            
        }).then(function(game_id) {
            return ph.createPathFromNumber(game_id)
            
        }).then(function(game_id) {

            var pgnData = {}
            pgnData.filename = ph.pathFromNumber(game_id)
            pgnData.nodes = nodes
            pgnData.gameInfo = gameInfo            
            ph.exportGameAsPGN(pgnData) 
            return game_id
            
        }).then(function(game_id) {
            // entry has been saved,
            // update totalCount and return
            if (searchParams.totalCount) {
                searchParams.totalCount += 1
            } else {
                searchParams.totalCount = 1
            }
            return game_id
            
        }).catch(function (e) {
            alert ("Error: " + (e.stack || e))
        })              
    }


    module.updateGame = function(gameInfo, nodes) {

        var game_id = gameInfo.id

        var taglist = []
        for (var i = 0, len = gameInfo['tags'].length; i < len; i++) {
            var tagname = gameInfo['tags'][i]
            taglist.push( {name: tagname.toLowerCase(), fullName: tagname })
        }

        
        db.transaction("rw", db.games, db.players, db.events, db.tags, function() {
            
            db.games.update(parseInt(game_id), {
                star: gameInfo['star'],
                white: gameInfo['white'],
                elow: gameInfo['elow'],
                black: gameInfo['black'],
                elob: gameInfo['elob'],
                res: gameInfo['res'],
                event: gameInfo['event'],
                site: gameInfo['site'],
                round: gameInfo['round'],
                date: gameInfo['date'],
                tags: gameInfo['tags'],     
                positions: ph.getPositions(nodes)           
            })

            
            db.players.put({
                name: gameInfo.white.toLowerCase(),
                fullName: gameInfo.white
            })
            
            db.players.put({
                name: gameInfo.black.toLowerCase(),
                fullName: gameInfo.black
            })
            
            db.events.put({
                name: gameInfo.event.toLowerCase(),
                fullName: gameInfo.event
            })

            db.tags.bulkPut(taglist)
            
            return 0

        }).then(function() {
            
            var pgnData = {}
            pgnData.filename = ph.pathFromNumber(game_id)
            pgnData.nodes = nodes
            pgnData.gameInfo = gameInfo            
            ph.exportGameAsPGN(pgnData)

            console.log("Record " + game_id + " has been updated")
            return 0
                
        }).catch(function (e) {
            alert ("Error: " + (e.stack || e))
        })
            
        
    }

    module.getEntry = function(id) {

        return db.games.get(id, function (entry) {

            return entry
                               
        }).catch(function (e) {
            alert ("Error: " + (e.stack || e))
        })
        
    }


    module.starEntry = function(id) {
        
        db.games.get(id, function (entry) {
            if (entry.star == 0) {
                return db.games.update(id, {star: 1})
            } else {
                return db.games.update(id, {star: 0})
            }
        }).catch(function (e) {
            alert ("Error: " + (e.stack || e))
        })
        
    }


    module.getAWPlayerList = function(aw, inp) {
	return db.players.where('name')
	    .startsWith(inp)
	    .limit(searchParams.awesompleteLimit)
		.toArray().then(function(arr) {
		    
		    aw.list = arr.map( a => a.fullName)
		    aw.evaluate()
		})
    }

    
    module.getAWEventList = function(aw, inp) {
	return db.events.where('name')
	    .startsWith(inp)
	    .limit(searchParams.awesompleteLimit)
	    .toArray().then(function(arr) {
		
		aw.list = arr.map( a => a.fullName)
		aw.evaluate()
	    })
    }
    

    module.getAWTagList = function(aw, inp) {
	return db.tags.where('name')
	    .startsWith(inp)
	    .limit(searchParams.awesompleteLimit)
	    .toArray().then(function(arr) {
		
		aw.list = arr.map( a => a.fullName)
		aw.evaluate()
	    })
    }


    module.deleteGame = function(id) {
        
	return db.games.delete(id).then(() => {
            
            if (searchParams.totalCount) {
                searchParams.totalCount -= 1
            }
            
            return id
        })	
    }

    
    return module
    
}
