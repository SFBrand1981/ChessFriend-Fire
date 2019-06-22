// database
module.exports = function (window) {

    // dependencies
    var path = require('path')
    var PGNHandler = require(path.join(process.cwd(), '/app/pgn.js'))
    var ph = new PGNHandler()

    var SettingsHandler = require(path.join(process.cwd(), '/app/settings.js'))
    var sh = new SettingsHandler()
    
    var Dexie = require('dexie')
    var db = new Dexie('ChessFriendFireDB')
    
    db.version(1).stores({
	games: "++id, star, white, elow, black, elob, res, event, date, *tags, *positions",
	nodes: "game_id"
    })

    var searchParams = JSON.parse(localStorage.getItem('searchParams'))


    function addGame(gameInfo, nodes) {

	var game_id
	
	return db.games.add({
	    star: gameInfo.star,
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
	    positions: getPositions(nodes)
	}).then(function(id) {
	    game_id = id
	    return db.nodes.add({
		game_id: id,
		nodes: nodes
	    })
	}).then(function() {
	    return db.games.count()
	}).then(function(count) {
	    return localStorage.setItem('dbCount', count)
	}).then(function() {
	    return game_id
	})
    }
    
    
    function importPGNsFromFile(fh) {

	return db.transaction("rw", db.games, db.nodes, function() {

	    var ph = new PGNHandler()
	    ph.readGamesFromFile(fh, function(pgn) {
		var pgnData = ph.parsePGNData(pgn)
		var nodes = ph.pgnMovesToNodes(pgnData['Moves'], pgnData['FEN'])

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
		
		addGame(gameInfo, nodes)  
		    .catch(function (e) {
			alert ("Error: " + (e.stack || e))
		    })
	    })
	    
	}).catch(function (error) {
	    alert ("Error: " + (e.stack || e))
	})

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


    var updateSearchParamsEvt = new CustomEvent("updateSearchParamsEvt", {
	details: 'updated'
    })


    function indicateSearchOrder(order) {
	var searchField = window.document.getElementById("searchorder_" + order)
	searchField.classList.add("searchordered")
    }

    
    function updateSearchParams(param, value) {

	// indicate search order
	var searchFields = window.document.getElementsByClassName("searchordered")
	for (var i = 0, len = searchFields.length; i < len; i++) {
	    searchFields[i].classList.remove("searchordered")
	}

	if (param == "orderBy") {
	    if (searchParams.orderBy == value) {
		// reset
		searchParams.orderBy = 'id'
	    } else {
		// change
		searchParams.orderBy = value
		indicateSearchOrder(value)
	    }
	} else {
	    searchParams[param] = value
	}
	
	searchParams.searching = true
	searchParams.pageNum = 0

	if (!searchParams.FEN &&
	    !searchParams.white &&
	    !searchParams.black &&
	    !searchParams.event &&
	    !searchParams.tags) {

	    // default
	    searchParams.searching = false
	}


	localStorage.setItem('searchParams', JSON.stringify(searchParams))
	var dbEntries = window.document.getElementById('db-entries')
	displayDBEntries(dbEntries)
	window.dispatchEvent(updateSearchParamsEvt)
    }


    function resetSearchparams(btn, container) {

	if (searchParams.container == 'visible') {
	
	    // reset
	    var defaultParams = {
		pageNum: 0,
		orderBy: 'id',
		container: 'hidden'
	    }
	    btn.classList.remove('filtering')
	    searchParams = defaultParams
	    localStorage.setItem('searchParams', JSON.stringify(defaultParams))
	    window.open('/views/main.html', '_self')

	} else {
	    searchParams.container = 'visible'
	    localStorage.setItem('searchParams', JSON.stringify(searchParams))
	    container.classList.remove('hidden')
	    btn.classList.add('filtering')
	}
    }
    

    function displaySearchparams(container) {

	var filterBtn = window.document.getElementById('filterBtn')
	var FEN = window.document.getElementById('searchparam_FEN')
	var white = window.document.getElementById('searchparam_white')
	var black = window.document.getElementById('searchparam_black')
	var event = window.document.getElementById('searchparam_event')
	var tags = window.document.getElementById('searchparam_tags')

	if (searchParams.container == 'hidden') {
	    container.classList.add('hidden')
	    filterBtn.classList.remove('filtering')
	} else {
	    container.classList.remove('hidden')
	    filterBtn.classList.add('filtering')
	}


	if (searchParams) {
	    FEN.value = searchParams.FEN ? searchParams.FEN : ''
	    white.value = searchParams.white ? searchParams.white : ''
	    black.value = searchParams.black ? searchParams.black : ''
	    event.value = searchParams.event ? searchParams.event : ''
	    tags.value = searchParams.tags ? searchParams.tags : ''
	}
	
	// modify search parameters
	FEN.addEventListener('change', function (evt) {
	    updateSearchParams('FEN', FEN.value)
	})

	white.addEventListener('change', function (evt) {
	    updateSearchParams('white', white.value)
	})
	
	black.addEventListener('change', function (evt) {
	    updateSearchParams('black', black.value)
	})

	event.addEventListener('change', function (evt) {
	    updateSearchParams('event', event.value)
	})

	tags.addEventListener('change', function (evt) {
	    updateSearchParams('tags', tags.value)
	})


	// modify search order
	var starOrder = window.document.getElementById('searchorder_star')
	var whiteOrder = window.document.getElementById('searchorder_white')
	var blackOrder = window.document.getElementById('searchorder_black')
	var elowOrder = window.document.getElementById('searchorder_elow')
	var elobOrder = window.document.getElementById('searchorder_elob')
	var resOrder = window.document.getElementById('searchorder_res')
	var eventOrder = window.document.getElementById('searchorder_event')
	var dateOrder = window.document.getElementById('searchorder_date')

	starOrder.addEventListener('click', function (evt) {
	    updateSearchParams('orderBy', 'star')
	})
	whiteOrder.addEventListener('click', function (evt) {
	    updateSearchParams('orderBy', 'white')
	})
	blackOrder.addEventListener('click', function (evt) {
	    updateSearchParams('orderBy', 'black')
	})
	elowOrder.addEventListener('click', function (evt) {
	    updateSearchParams('orderBy', 'elow')
	})
	elobOrder.addEventListener('click', function (evt) {
	    updateSearchParams('orderBy', 'elob')
	})
	resOrder.addEventListener('click', function (evt) {
	    updateSearchParams('orderBy', 'res')
	})
	eventOrder.addEventListener('click', function (evt) {
	    updateSearchParams('orderBy', 'event')
	})
	dateOrder.addEventListener('click', function (evt) {
	    updateSearchParams('orderBy', 'date')
	})

    }

    
    function displayDBEntries(container) {

	// cleanup
	while (container.lastChild) {
	    container.removeChild(container.lastChild)
	}

	var limit = parseInt(localStorage.getItem('pageSize'))
	var offset = parseInt(searchParams.pageNum * limit)

	if (searchParams.orderBy != 'id') {
	    indicateSearchOrder(searchParams.orderBy)
	}
	
	console.log(searchParams)
	console.log("offset: " + offset)
	console.log("limit: " + limit)

    
	if (searchParams.searching && searchParams.orderBy != 'id') {

	    console.log("searching 1")
	    var queryKeys
	    var pageKeys = []
	    var hits = 0
	    
	    var reversed
	    switch (searchParams.orderBy) {
	    case 'star':
	    case 'elow':
	    case 'elob':
	    case 'date':
		reversed = true
		break
	    default:
		reversed = false
	    }
		
	    return getQueryCount().then(count => {
		
		if (count < 200) {
		    
		    // FAST: Sort in memory
		    return db.games
			.where(queryFromSearchParams())
			.sortBy(searchParams.orderBy)
			.then(entries => {

			    if (reversed) {
				entries = entries.reverse()
			    }
			    
			    for (var i = 0, len = entries.length; i < len; i++) {

				if (i >= limit || i + offset >= len) {
				    break
				}

				displayDBEntry(entries[i+offset], container)
			    }
			}).catch( e => {
			    alert(e)
			})

		} else {

		    // SLOW: Arbitrary query and ordering on (non-unique) indices
		    return db.games
			.where(queryFromSearchParams())
			.primaryKeys(keys => {
			    console.log(keys)
			    queryKeys = new Set(keys)
			}).then(() => {
			    return reversed ?
				db.games.orderBy(searchParams.orderBy).reverse() :
				db.games.orderBy(searchParams.orderBy)
			}).then(collection => {
			    return collection
				.until(() => {
				    return (pageKeys.length === limit)
				})
				.eachPrimaryKey(id => {
				    if (queryKeys.has(id)) {
					hits += 1
					if (hits > offset) {
					    pageKeys.push(id)
					}
				    }
				})
			}).then(() => {
			    return Promise.all(pageKeys.map(id => db.games.get(id)))		    
			}).then(entries => {
			    for (var i = 0, len = entries.length; i < len; i++) {
				displayDBEntry(entries[i], container)
			    }
			}).catch( e => {
			    alert(e)
			})

		}
	    })
	    
	} else if (searchParams.searching) {

	    console.log("searching 2")
	    // FAST: No ordering
	    
	    return db.games
		.where(queryFromSearchParams())
		.reverse()
		.offset(offset)
		.limit(limit)
		.toArray( entries => {
		    for (var i = 0, len = entries.length; i < len; i++) {
	    		displayDBEntry(entries[i], container)
	    	    }		    
		}).catch( e => {
		    alert (e)
		})
	    
	    
	} else {

	    console.log("searching 3")
	    // FAST: No query
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
	    	.toArray( entries => {
	    	    for (var i = 0, len = entries.length; i < len; i++) {
	    		displayDBEntry(entries[i], container)
	    	    }		    
	    	}).catch(function (e) {
	    	    alert (e)
	    	})
	}
    }


    function queryFromSearchParams() {
	var query = {}
	if (searchParams.FEN) {
	    query.positions = searchParams.FEN
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
	if (searchParams.tags) {
	    query.tags = searchParams.tags
	}

	return query
    }

    function displayDBEntry(entry, container) {

	var tr = document.createElement('tr')

	var td1 = document.createElement('td')
	td1.classList.add('db-entry-star')
	if (entry.star == 1) {
	    td1.innerHTML = '<i class="fa starred">&#xf005;</i>'
	} else {
	    td1.innerHTML = '<i class="fa">&#xf006;</i>'
	}

	td1.addEventListener('click', function(evt) {
	    if (this.firstChild.classList.contains('starred')) {
		this.innerHTML = '<i class="fa">&#xf006;</i>'
	    } else {
		this.innerHTML = '<i class="fa starred">&#xf005;</i>'
	    }
	    starEntry(entry.id)
	})

	var td2 = document.createElement('td')
	td2.classList.add('db-entry-player')
	td2.innerHTML = entry.white

	var td3 = document.createElement('td')
	td3.classList.add('db-entry-dwz')
	td3.innerHTML = entry.elow

	var td4 = document.createElement('td')
	td4.classList.add('db-entry-player')
	td4.innerHTML = entry.black

	var td5 = document.createElement('td')
	td5.classList.add('db-entry-dwz')
	td5.innerHTML = entry.elob

	var td6 = document.createElement('td')
	td6.classList.add('db-entry-res')
	switch (parseInt(entry.res)) {
	case 1: 
	    td6.innerHTML = "1-0"
	    break
	case 2: 
	    td6.innerHTML = "1/2"
	    break
	case 3: 
	    td6.innerHTML = "0-1"
	    break
	case 4: 
	    td6.innerHTML = "*"
	    break
	}
	    
	var td7 = document.createElement('td')
	td7.classList.add('db-entry-event')
	td7.innerHTML = entry.event

	var td8 = document.createElement('td')
	td8.classList.add('db-entry-date')
	td8.innerHTML = entry.date ? entry.date.slice(0,4) : ""



	td2.addEventListener('click', function (evt) {
	    loadEntry(entry)
	})
	td3.addEventListener('click', function (evt) {
	    loadEntry(entry)
	})
	td4.addEventListener('click', function (evt) {
	    loadEntry(entry)
	})
	td5.addEventListener('click', function (evt) {
	    loadEntry(entry)
	})
	td6.addEventListener('click', function (evt) {
	    loadEntry(entry)
	})
	td7.addEventListener('click', function (evt) {
	    loadEntry(entry)
	})
	td8.addEventListener('click', function (evt) {
	    loadEntry(entry)
	})	

	tr.appendChild(td1)
	tr.appendChild(td2)
	tr.appendChild(td3)
	tr.appendChild(td4)
	tr.appendChild(td5)
	tr.appendChild(td6)
	tr.appendChild(td7)
	tr.appendChild(td8)

	container.appendChild(tr)

    }

    function starEntry(id) {

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

    
    function loadEntry(entry) {

	var game_id = entry.id.toString()
	var title = entry.white + ' - ' + entry.black
	
	var loadEntryEvt = new CustomEvent("loadEntryEvt", {
	    detail : { game_id : game_id,
		       title: title }
	})
	window.document.dispatchEvent(loadEntryEvt)
	
    }


    async function getSearchCount(query) {

	var count = await db.games.where(query).count()
	return count
    }


    function getQueryCount() {

	if (searchParams.searching) {
	    return getSearchCount(queryFromSearchParams())
	} else {
	    return parseInt(localStorage.getItem('dbCount'))
	}
	
    }


    function pageNext() {
	searchParams.pageNum += 1
	localStorage.setItem('searchParams', JSON.stringify(searchParams))
    }


    function pagePrev() {
	searchParams.pageNum -= 1
	localStorage.setItem('searchParams', JSON.stringify(searchParams))
    }


    module.addGame = addGame
    module.importPGNsFromFile = importPGNsFromFile 
    module.displayDBEntries = displayDBEntries
    module.getPositions = getPositions
    module.getSearchCount = getSearchCount
    module.displaySearchparams = displaySearchparams
    module.resetSearchparams = resetSearchparams
    module.getQueryCount = getQueryCount
    module.pageNext = pageNext
    module.pagePrev = pagePrev
    module.db = db
    module.indicateSearchOrder = indicateSearchOrder
    
    return module

}
