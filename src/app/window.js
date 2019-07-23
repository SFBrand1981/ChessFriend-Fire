// window
module.exports = function (window) {

    var path = require('path')
    var os = require('os')
    var fs = require('fs')
    var tools = require(path.join(process.cwd(), '/app/tools.js'))
    var ResizeHandler = require(path.join(process.cwd(), '/app/resize.js'))
    var DBHandler = require(path.join(process.cwd(), '/app/db.js'))
    var BoardStateHandler = require(path.join(process.cwd(), '/app/boardState.js'))
    var SidebarHandler = require(path.join(process.cwd(), '/app/sidebar.js'))
    var SettingsHandler = require(path.join(process.cwd(), '/app/settings.js'))
    var EngineHandler = require(path.join(process.cwd(), '/app/engine.js'))
    var HistoryHandler = require(path.join(process.cwd(), '/app/history.js'))
    var SearchHandler = require(path.join(process.cwd(), '/app/search.js'))
    var Awesomplete = require('awesomplete')
    var DownloadHandler = require('downloadjs')
    var PGNHandler = require(path.join(process.cwd(), 'app/pgn.js'))
    
    const { fork } = require('child_process');


    // enable pointer events on load
    window.addEventListener("load", function (evt) {
	window.document.body.style.pointerEvents = "auto"
    })

    
    // read settings
    var sh = new SettingsHandler()
    sh.setDefaults()


    // history of open games
    var hh = new HistoryHandler()


    // create sidebar
    var sb = new SidebarHandler(window)
    var sidebarItems = window.document.getElementById('sidebarItems')
    var openGames = window.document.getElementById('openGames')
    sb.createSidebar(sidebarItems)
    sb.addOpenGamesToSidebar(openGames)

    
    // make sidebar resizable
    var container = window.document.getElementById("container"),
	left = window.document.getElementById("left_panel"),
	right = window.document.getElementById("right_panel"),
	handle = window.document.getElementById("drag")
    var rh = new ResizeHandler()
    rh.makeResizable(window, container, left, right, handle)
    rh.restoreSidebar(window, left, right,
		      parseFloat(localStorage.getItem('sidebarRatio')))

        
    // display DB entries
    var db = new DBHandler(window)
    var dbEntries = window.document.getElementById('db-entries')
    function displayDBEntries() {
	db.displayDBEntries(dbEntries)
    }


    // display DB entry count
    var dbEntryCount = window.document.getElementById('dbEntryCount')
    var pageSize = localStorage.getItem('pageSize')
    function displayDBEntryCount() {

	db.getQueryCount().then(function (count) {

	    // if (count == 0) {
	    // 	alert('Your database is empty!')
	    // }
	    
	    var searchParams = JSON.parse(localStorage.getItem('searchParams'))
	    var lower = (count == 0) ? 0 : searchParams.pageNum * pageSize + 1
	    var upper = Math.min(count, (searchParams.pageNum + 1) * pageSize)
  
	    dbEntryCount.innerHTML = lower + '-' + upper + ' of ' + count
	})
    }


    // update DB entry count
    window.addEventListener("updateSearchParamsEvt", function (evt) {
	displayDBEntryCount()
    })
    

    // import games from PGN file
    window.document.addEventListener("sidebarImportEvt", function(evt) {

    })
    

    var importPGNDialog = window.document.getElementById("importPGNDialog")
    importPGNDialog.addEventListener("change", function (evt) {
	displayImportModal()
	importFileWithImportWorker(this.value)
    })


    var importDBDialog = window.document.getElementById("importDBDialog")
    importDBDialog.addEventListener("change", function (evt) {
	displayImportModal()
	importDBWithImportWorker(this.value)
    })


    function displayImportModal() {
	// show modal while importing
	var modalContainer = window.document.getElementById("importModal")
	modalContainer.style.display = "flex"
    }


    function importFileWithImportWorker(pgn_file) {

	var importWorker = fork(path.join(process.cwd(), '/app/importWorker.js'))
	
	importWorker.send({
	    importWorker : {startPGNImport : true,
			    pgn_file : pgn_file}
	})

	    
	importWorker.on('message', (msg) => {

	    // worker has read one game
	    if (msg.importWorker.readGame) {
		var num_games = msg.importWorker.num_games
		var pgnData = msg.importWorker.pgnData
		var nodes = msg.importWorker.nodes
		
		var importStatusBar = window.document.getElementById('importStatusBar')
		importStatusBar.innerHTML = 'Imported ' + num_games.toString()
		

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

		// save to DB
		db.addGame(gameInfo, nodes)
		    .catch(function (e) {
			alert ("Error: " + (e.stack || e))
		    })		
		
		// resume reading
		importWorker.send({
		    importWorker : {resumeImport : true}
		})
	    }


	    // worker has finished reading
	    if (msg.importWorker.completedImport) {
		sb.confirmImport()
	    }
	    
	})

    }


    function importDBWithImportWorker(pgn_file) {

	var starttime = Date.now()
	console.log(starttime)

	var importWorker = fork(path.join(process.cwd(), '/app/importWorker.js'))
	
	importWorker.send({
	    importWorker : {startDBImport : true,
			    pgn_file : pgn_file}
	})

	var bulkSize = 5000
	var gamesToAdd = []
	var nodesToAdd = []
	var namesToAdd = []
	var lastId = 0

	var importStatusBar = window.document.getElementById('importStatusBar')
	
	function savePGNs(gameArray, nodeArray, nameArray) {

	    return db.db.games.bulkAdd(gameArray).then(function (id) {

		lastId = id
		console.log("lastId: " + lastId)
		for (var i = 0, len = gameArray.length; i < len; i++) {
		    var game_id = id - len + i + 1
		    var pgnData = {}
		    pgnData.filename = path.join(process.cwd(), '../database/' + ph.pathFromNumber(game_id))
		    pgnData.nodes = nodeArray[i]
		    pgnData.gameInfo = gameArray[i]
		    ph.exportGameAsPGN(pgnData)	
		}

	    }).then(function() {
		return db.db.players.bulkPut(nameArray)
	    }).catch(function (e) {
		alert ("Error: " + (e.stack || e))
	    })
	}

	
	importWorker.on('message', (msg) => {

	    // worker has read one game
	    if (msg.importWorker.readGame) {

		var num_games = msg.importWorker.num_games
		var pgnData = msg.importWorker.pgnData
		var nodes = msg.importWorker.nodes
		
		importStatusBar.innerHTML = 'Imported ' + 1000 * parseInt(num_games/1000) + ' games'
		
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
		gameInfo.positions = db.getPositions(nodes)

		gamesToAdd.push(gameInfo)
		nodesToAdd.push(nodes)
		namesToAdd.push({ name: pgnData['White'].toLowerCase(), fullName: pgnData['White'] })
		namesToAdd.push({ name: pgnData['Black'].toLowerCase(), fullName: pgnData['Black'] })

		if (num_games % bulkSize == 0) {

		    // save to DB
		    console.log("Saving to DB " + num_games)
		    savePGNs(gamesToAdd, nodesToAdd, namesToAdd)

		    // reset
		    gamesToAdd = []
		    nodesToAdd = []
		    namesToAdd = []
		    
		}	
		
		// resume reading
		importWorker.send({
		    importWorker : {resumeImport : true}
		})
		
	    }


	    // worker has finished reading
	    if (msg.importWorker.completedImport) {

		var num_games = msg.importWorker.num_games
		importStatusBar.innerHTML = 'Imported ' + num_games.toString() + ' games'

		// save remaining games
		savePGNs(gamesToAdd, nodesToAdd, namesToAdd).then(function () {    
		    return db.db.games.count()
		}).then(function (count) {
		    return localStorage.setItem('dbCount', count)
		}).then(function () {
		    sb.confirmImport()
		    console.log("Duration: " + (Date.now()-starttime).toString())
		})
		
	    }
	    
	})

    }


    // init db
    function enableDBExport() {


	setActiveSidebarItem("Database")
	var actionSelected = "importPGN"
	
	var importPGNBtn = window.document.getElementById("importPGNSelected")
	var importDBBtn = window.document.getElementById("importDBSelected")
	// var exportJSONBtn = window.document.getElementById("exportJSONSelected")
	var confirmImportBtn = window.document.getElementById("confirmImportBtn")

	
	function removeSearchSelected() {
	    var q = window.document.querySelectorAll(".actionSelected")
	    for (var i = 0, len = q.length; i < len; i ++) {
		q[i].classList.remove("actionSelected")
	    }

	    var s = window.document.querySelectorAll(".selectable")
	    for (var i = 0, len = s.length; i < len; i ++) {
		s[i].firstElementChild.innerHTML = '<i class="fa">&#xf10c;</i>'
	    }
	}
	

	importPGNBtn.addEventListener('click', function(e) {
	    removeSearchSelected()
	    this.firstElementChild.innerHTML = '<i class="fa">&#xf192;</i>'
	    this.classList.add('actionSelected')
	    actionSelected = "importPGN"
	})


	importDBBtn.addEventListener('click', function(e) {
	    removeSearchSelected()
	    this.firstElementChild.innerHTML = '<i class="fa">&#xf192;</i>'
	    this.classList.add('actionSelected')
	    actionSelected = "importDB"
	})

	
	// exportJSONBtn.addEventListener('click', function(e) {
	//     removeSearchSelected()
	//     this.firstElementChild.innerHTML = '<i class="fa">&#xf192;</i>'
	//     this.classList.add('actionSelected')
	//     actionSelected = "exportJSON"
	// })

	
	confirmImportBtn.addEventListener('click', function(e) {

	    switch (actionSelected) {
	    case "importPGN":
		importPGNDialog.click()
		break
	    case "importDB":
		importDBDialog.click()
		break
	    case "exportJSON":
		displayImportModal()
		exportDB()
		break
	    default:
		console.log(actionSelected)
	    }
	})

	
	async function exportDB() {
	    try {
		const blob = await db.db.export({prettyJson: true, progressCallback})

		DownloadHandler(blob, "ChessFriend-Fire-export.json", "application/json")
		
		var importCompletedEvt = new CustomEvent("importCompletedEvt", {
		})
		window.document.dispatchEvent(importCompletedEvt)
		
	    } catch (error) {
		console.error(''+error)
	    }
	}
		    
	
	function progressCallback ({totalRows, completedRows}) {
	    console.log(`Progress: ${completedRows} of ${totalRows} rows completed`)
	    
	    var importStatusBar = window.document.getElementById('importStatusBar')
	    importStatusBar.innerHTML = 'Exported ' + parseInt(completedRows/2).toString() + ' games'
	}

	
    }    

    // display chessboard
    var boardState = new BoardStateHandler(window)
    var boardContainer = window.document.getElementById('boardContainer')
    function createChessboard(){
	boardState.initChessboard(boardContainer)
    }


    // display move indicator
    function createMoveIndicator() {
	boardState.createMoveIndicator(boardContainer)

	window.document.addEventListener("boardInitializedEvt", function(evt) {
	    boardState.updateMoveIndicator(evt.detail['FEN'])
	})

	window.document.addEventListener("moveSelectedEvt", function(evt) {
	    boardState.updateMoveIndicator(evt.detail['FEN'])
	})
    }
    

    // display board controls
    function createBoardControls(){
	boardState.createBoardControls(boardContainer)
    }


    // sidebar clicked
    window.document.addEventListener("gameSelectedInSidebarEvt", function(evt) {
	var game_id = evt.detail['game_id']
	hh.addGame(game_id)
	window.open('/views/game.html?id=' + game_id, '_self')
    })

    
    // load game
    window.document.addEventListener("loadEntryEvt", function (evt) {

	var title = evt.detail['title']
	var game_id = evt.detail['game_id']
	
	sb.addGameToSidebar(openGames, evt)
	hh.addGame(game_id)
	window.open('/views/game.html?id='+game_id, '_self') // replaces current page
    })

    // display notation
    var ph = new PGNHandler()
    function displayNotation() {

	// load game from DB
	var game_id = tools.getParams(window.location.href).id
	
	db.db.nodes.get({game_id: parseInt(game_id)}, function (entry) {

	    var gameNodes = {} 
	    if (entry == undefined) {
		// reread nodes from disk
		var pgn_file = path.join(process.cwd(), '../database/' + ph.pathFromNumber(game_id))
		console.log("Reading pgn from file " + pgn_file)
		
		ph.readGamesFromFile(pgn_file, function(pgn) {

		    var pgnData = ph.parsePGNData(pgn.pgn)
		    gameNodes = ph.pgnMovesToNodes(pgnData['Moves'], pgnData['FEN'])
		})
	    } else {
		gameNodes = entry.nodes
	    }
	    
	    // initialize board state
	    boardState.initNodes(game_id, gameNodes)

	    // enable keyboard navigation
	    boardState.enableKeyboard()

	    // set active in sidebar
	    sb.setActiveSidebarItem(game_id)

	    // add nodes to DB for later reference
	    if (entry == undefined) {
		console.log("Adding new")
		return db.db.nodes.add({
		    game_id: parseInt(game_id),
		    nodes: gameNodes
		})
	    }
	    
	}).catch(function (e) {
	    alert ("Error: " + (e.stack || e))
	})
	
    }


    // load game meta data
    var notationContainer = window.document.getElementById('notationContainer')
    function displayGameInfo() {
	
	// load game from DB
	var game_id = tools.getParams(window.location.href).id
	db.db.games.get(parseInt(game_id), function (entry) {

	    boardState.displayGameInfo(notationContainer, entry)
	    
	}).catch(function (e) {
	    alert ("Error: " + (e.stack || e))
	})
    }



    // update game
    window.document.addEventListener('gameSavedEvt', function(evt) {

	var game_id = evt.detail.currentBoard.id
	var data = evt.detail.currentBoard.gameInfo
	var nodes = evt.detail.currentBoard.nodes
	var title = data.white + ' - ' + data.black
	
	db.db.games.update(parseInt(game_id), {
	    white: data['white'],
	    black: data['black'],
	    res: data['res'],
	    event: data['event'],
	    site: data['site'],
	    round: data['round'],
	    date: data['date'],
	    tags: data['tags'],	    
	    positions: db.getPositions(nodes)	    
	}).then(function(rv) {
	    return db.db.nodes.update(parseInt(game_id), {nodes: nodes})
	}).then(function(rv) {
	    sb.updateSidebarGame(game_id, title)
	}).catch(function (e) {
	    alert ("Error: " + (e.stack || e))
	})
    })


    // kiosk mode
    var kioskMode = false
    window.document.addEventListener('kioskModeEvt', function(evt) {

	if (!kioskMode) {
	    notationContainer.style.display = 'none'
	    boardContainer.style.width = '100%'
	    boardContainer.style.maxWidth = '100%'
	    
	    
	    var engineLines = window.document.querySelector('.engineOut')
	    engineLines.style.display = 'none'

	    var boardControlContainer = window.document.getElementById("boardControlContainer")
	    boardControlContainer.style.marginBottom = "24px"

	    boardState.resizeSquares()

	    var controlStart = window.document.getElementById("controlStart")
	    controlStart.style.display = 'none'

	    var saveBtn = window.document.getElementById("saveBtn")
	    saveBtn.style.display = 'none'

	    var kioskBtn = window.document.getElementById("kioskBtn")
	    kioskBtn.innerHTML = '<i class="fa">&#xf2d2;</i>'


	    var tooltip = document.createElement('span')
	    tooltip.innerHTML = 'restore windows'
	    tooltip.classList.add('tooltip')
	    tooltip.id = 'kioskTooltip'
	    kioskBtn.appendChild(tooltip)
	    
	    kioskMode = true

	} else {

	    var activeSidebarItem = window.document.querySelector('.activeSidebarItem')
	    activeSidebarItem.click()

	}
	    
	
    })

    
    // engine handling
    var eh = new EngineHandler(window)
    function createEngineControls() {
	
	eh.createEngineControls(boardContainer)
	window.addEventListener("unload", eh.quitEngine)
	
	window.document.addEventListener("moveSelectedEvt", function(evt) {
	    eh.updateEnginePosition(evt.detail['FEN'])
	})
    }


    // search controls
    var seh = new SearchHandler(window)    
    function createSearchControls() {
	seh.createSearchControls()
	seh.overwriteClickBoard()
	seh.createSelectablePieces(boardContainer)
    }

    
    // paginate DB entries
    var paginatePrev = window.document.getElementById('paginatePrev')
    var paginateNext = window.document.getElementById('paginateNext')
    function enablePagination () {

	paginateNext.addEventListener('click', function (evt) {
	    db.getQueryCount().then(function (count) {
		var searchParams = JSON.parse(localStorage.getItem('searchParams'))
		if ((searchParams.pageNum + 1) * pageSize < count) {
		    db.pageNext()
		    db.displayDBEntries(dbEntries)
		    displayDBEntryCount()
		}
	    })
	})
	
	paginatePrev.addEventListener('click', function (evt) {
	    db.getQueryCount().then(function (count) {
		var searchParams = JSON.parse(localStorage.getItem('searchParams'))
		if (searchParams.pageNum - 1 >= 0) { 
		    db.pagePrev()
		    db.displayDBEntries(dbEntries)
		    displayDBEntryCount()
		}
	    })
	})
    }
    

    // search parameters
    var mainSearchInfoContainer = window.document.querySelector(".mainSearchInfoContainer")
    function displaySearchparams() {
	db.displaySearchparams(mainSearchInfoContainer)
    }
    
    // filter DB entries
    var filterBtn = window.document.getElementById('filterBtn')
    function enableFilterBtn() {
	filterBtn.addEventListener('click', function (evt) {
	    db.resetSearchparams(filterBtn, mainSearchInfoContainer)
	})
    }

    
    function enableAwesomplete() {
	var white = window.document.getElementById('searchparam_white')
	var black = window.document.getElementById('searchparam_black')
	var event = window.document.getElementById('searchparam_event')
	//var tags = window.document.getElementById('searchparam_tags')
	var ahWhite = new Awesomplete(white)
	var ahBlack = new Awesomplete(black)
	var ahEvent = new Awesomplete(event)
	//var ahTags = new Awesomplete(tags)

	function getListFromInput(aw, inp) {
	    return db.db.players.where('name')
		.startsWith(inp)
		.limit(5)
		.toArray().then(function(arr) {
		   
		    aw.list = arr.map( a => a.fullName)
		    aw.evaluate()
		})
	}

	
	white.addEventListener('input', function() {
	    var val = this.value.toLowerCase()
	    getListFromInput(ahWhite, val)
	})

	black.addEventListener('input', function() {
	    var val = this.value.toLowerCase()
	    getListFromInput(ahBlack, val)
	})

	event.addEventListener('input', function() {
	    var val = this.value.toLowerCase()
	    return db.db.events.where('name')
		.startsWith(val)
		.limit(5)
		.toArray().then(function(arr) {
		    
		    ahEvent.list = arr.map( a => a.fullName)
		    ahEvent.evaluate()
		})
	})
	

	// db.db.games.orderBy('tags').uniqueKeys(function (keys) {
	//     ahTags.list = keys
	//     ahTags.filter = Awesomplete.FILTER_CONTAINS
	// })

    }

    function createContextMenu(menu) {

	// Add menu items with label in this menu
	menu.append(new nw.MenuItem({
	    label: 'Promote variation',
	    click: function(){
		boardState.promoteVariationHandler()
	    }
	}))

	
	menu.append(new nw.MenuItem({
	    label: 'Strip variation to end',
	    click: function(){
		boardState.stripVariationHandler()
	    }
	}))


	menu.append(new nw.MenuItem({ type: 'separator' }))

	var submenu = new nw.Menu();
	submenu.append(new nw.MenuItem({ label: '[None]', click: function(){boardState.insertNAGHandler('')} }))
	submenu.append(new nw.MenuItem({ label: '!', click: function(){boardState.insertNAGHandler('$1')} }))
	submenu.append(new nw.MenuItem({ label: '?', click: function(){boardState.insertNAGHandler('$2')} }))
	submenu.append(new nw.MenuItem({ label: '!?', click: function(){boardState.insertNAGHandler('$5')} }))
	submenu.append(new nw.MenuItem({ label: '?!', click: function(){boardState.insertNAGHandler('$6')} }))
	submenu.append(new nw.MenuItem({ label: '!!', click: function(){boardState.insertNAGHandler('$3')} }))
	submenu.append(new nw.MenuItem({ label: '??', click: function(){boardState.insertNAGHandler('$4')} }))
	submenu.append(new nw.MenuItem({ label: '+/=', click: function(){boardState.insertNAGHandler('$14')} }))
	submenu.append(new nw.MenuItem({ label: '=/+', click: function(){boardState.insertNAGHandler('$15')} }))
	submenu.append(new nw.MenuItem({ label: '+-', click: function(){boardState.insertNAGHandler('$18')} }))
	submenu.append(new nw.MenuItem({ label: '-+', click: function(){boardState.insertNAGHandler('$19')} }))
	submenu.append(new nw.MenuItem({ label: '∞', click: function(){boardState.insertNAGHandler('$13')} }))
	submenu.append(new nw.MenuItem({ label: '=', click: function(){boardState.insertNAGHandler('$11')} }))


	menu.append(new nw.MenuItem({
	    label: 'Insert NAG',
	    submenu: submenu
	}))
	
	menu.append(new nw.MenuItem({
	    label: 'Comment before move',
	    click: function(){
		boardState.insertComment('startComment')
	    }
	}))

	menu.append(new nw.MenuItem({
	    label: 'Comment after move',
	    click: function(){
		boardState.insertComment('comment')
	    }
	}))

	menu.append(new nw.MenuItem({ type: 'separator' }))


	menu.append(new nw.MenuItem({
	    label: 'Duplicate game',
	    click: function(){
		boardState.duplicateGame()
	    }
	}))
	
	menu.append(new nw.MenuItem({
	    label: 'Delete game',
	    click: function(){
		boardState.deleteGame()
	    }
	}))

	menu.append(new nw.MenuItem({ type: 'separator' }))
	
	menu.append(new nw.MenuItem({
	    label: 'Export to LaTeX',
	    click: function(){

		var exportDialog = document.createElement('input')
		exportDialog.style.display = 'none'
		exportDialog.type = 'file'
		exportDialog.id = 'exportDialog'
		exportDialog.accept = '.tex'
		exportDialog.nwsaveas = "ChessFriend-Fire_Export.tex"
		window.document.body.appendChild(exportDialog)
		exportDialog.click()
		exportDialog.addEventListener("change", function (evt) {
		    boardState.exportGameAsTex(this.value)
		})
		
	    }
	}))

	menu.append(new nw.MenuItem({
	    label: 'Export to PGN',
	    click: function(){

		var exportDialog = document.createElement('input')
		exportDialog.style.display = 'none'
		exportDialog.type = 'file'
		exportDialog.id = 'exportDialog'
		exportDialog.accept = '.pgn'
		exportDialog.nwsaveas = "ChessFriend-Fire_Export.pgn"
		window.document.body.appendChild(exportDialog)
		exportDialog.click()
		exportDialog.addEventListener("change", function (evt) {
		    boardState.exportGameAsPGN(this.value)
		})
		
	    }
	}))
	
	
	// Hooks for the "contextmenu" event
	notationContainer.addEventListener('contextmenu', function(ev) {
	    // Prevent to showing default context menu event
	    //ev.preventDefault();
	    // display Popup the native context menu at place you clicked
	    menu.popup(ev.x, ev.y)  
	})


    }

    // duplicate game
    window.document.addEventListener("gameDuplicatedEvt", function(evt) {

	var gameInfo = evt.detail.gameInfo
	var nodes = evt.detail.nodes

	db.addGame(gameInfo, nodes).then( (id) => {
	    
	    var game_id = id.toString()
	    var title = gameInfo.white + ' - ' + gameInfo.black
	    
	    var loadEntryEvt = new CustomEvent("loadEntryEvt", {
		detail : { game_id : game_id,
			   title: title }
	    })

	    alert("Game has been duplicated!")
	    window.document.dispatchEvent(loadEntryEvt)
	    
	}).catch(function(e) {
	    alert(e.error)
	})
	
    })

    // delete game
    window.document.addEventListener("gameDeletedEvt", function(evt) {

	var game_id = parseInt(evt.detail.game_id)
	
	db.db.nodes.where({game_id: game_id}).delete()
	    .then(() => {
		db.db.games.delete(game_id)
	    }).then(() => {
		var count = parseInt(localStorage.getItem('dbCount'))
		return localStorage.setItem('dbCount', count - 1)
	    }).then(() => {
		sb.removeGameFromSidebar(evt.detail.game_id)
	    })	
    })


    // remove nodes
    window.document.addEventListener("removeNodesEvt", function (evt) {

	var game_id = parseInt(evt.detail.game_id)
	db.db.nodes.where({game_id: game_id}).delete()
    })

    function setActiveSidebarItem(item) {
	sb.setActiveSidebarItem(item)
    }


    function createSaveBtn() {
	boardState.createSaveBtn()
    }

    
    function createKioskBtn() {
	boardState.createKioskBtn()
    }


    // insert engine move
    window.document.addEventListener("insertEngineMoveEvt", function (evt) {
	var move = evt.detail.move
	console.log("Engine move: " + move)
	var sq_start = move[0] + move[1]
	var sq_end = move[2] + move[3]
	boardState.insertEngineMove(sq_start, sq_end)
    })


    // engine settings
    function createEngineSettingsMenu(menu) {

	// Add menu items with label in this menu
	menu.append(new nw.MenuItem({
	    label: 'Engine settings',
	    click: function(){
		window.open('/views/engineSettings.html', '_self')
	    }
	}))


	var engineLines = window.document.querySelector('.engineOut')
	engineLines.addEventListener('contextmenu', function(ev) {
	    // Prevent to showing default context menu event
	    //ev.preventDefault();
	    // display Popup the native context menu at place you clicked
	    menu.popup(ev.x, ev.y)  
	})


    }


    // save engine settins
    function makeSettingsConfirmable() {

	var engineSettingsTable = window.document.getElementById("engineSettings")
	var tbody = window.document.createElement('tbody')
	engineSettingsTable.appendChild(tbody)

	
	function createSettingEntry(key, value) {
	    var tr = window.document.createElement('tr')
	    var tdKey = window.document.createElement('td')
	    var tdValue = window.document.createElement('td')
	    var inp = window.document.createElement('input')


	    tdKey.innerHTML = key

	    inp.classList.add("big-table-input")
	    inp.type = 'text'
	    inp.value = value
	    inp.id = key

	    tdValue.appendChild(inp)
	    tr.appendChild(tdKey)
	    tr.appendChild(tdValue)
	    tbody.appendChild(tr)
	    
	}

	var engineSettings = sh.readEngineSettings()
	var enginePath
	
	if (engineSettings['Engine path'] == 'default') { 
	    switch (os.platform()) {
	    case 'win32':
	    case 'win64':
		enginePath = path.join(process.cwd(), '/bin/stockfish_10_x64.exe')
		break
	    case 'linux':
		enginePath = path.join(process.cwd(), '/bin/stockfish_10_x64')
		break
	    case 'darwin':
	    default:
		enginePath = path.join(process.cwd(), '/bin/stockfish-10-64')
		break
	    }
	} else {
	    enginePath = engineSettings['Engine path']
	}

	createSettingEntry("Engine path", enginePath)
	createSettingEntry("multiPV", engineSettings['multiPV'])
	createSettingEntry("Threads", engineSettings['Threads'])
	

	var confirmSettingsBtn = window.document.getElementById('confirmSettings')
	confirmSettingsBtn.addEventListener('click', function (evt) {

	    var newSettings = {}
	    var values = window.document.querySelectorAll('.big-table-input')
	    for (var i = 0, len = values.length; i < len; i++) {
		newSettings[values[i]['id']] = values[i]['value']
	    }
	    
	    
	    sh.saveEngineSettings(JSON.stringify(newSettings)).then( settings => {
		sb.loadLastGameFromHistory(undefined)
	    }).catch( e => {
		alert(e)
	    })
	})
    }
    
    
    // Module exports
    module.displayDBEntries = displayDBEntries
    module.displayDBEntryCount = displayDBEntryCount
    module.createChessboard = createChessboard
    module.createMoveIndicator = createMoveIndicator
    module.createBoardControls = createBoardControls
    module.displayNotation = displayNotation
    module.displayGameInfo = displayGameInfo
    module.createEngineControls = createEngineControls
    module.createSearchControls = createSearchControls
    module.displaySearchparams = displaySearchparams
    module.enableFilterBtn = enableFilterBtn
    module.enablePagination = enablePagination
    module.enableAwesomplete = enableAwesomplete
    module.createContextMenu = createContextMenu
    module.setActiveSidebarItem = setActiveSidebarItem
    module.createSaveBtn = createSaveBtn
    module.createKioskBtn = createKioskBtn
    module.createEngineSettingsMenu = createEngineSettingsMenu
    module.makeSettingsConfirmable = makeSettingsConfirmable
    module.enableDBExport = enableDBExport
    
    return module
}
