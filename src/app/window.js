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
    var fileDialog = window.document.getElementById("fileDialog")
    window.document.addEventListener("sidebarImportEvt", function(evt) {
	fileDialog.click()
    })
    
    
    fileDialog.addEventListener("change", function (evt) {
	displayImportModal()
	importFileWithImportWorker(this.value)
    })
    

    function displayImportModal() {
	// show modal while importing
	var modalContainer = window.document.getElementById("importModal")
	modalContainer.style.display = "flex"
    }


    function importFileWithImportWorker(pgn_file) {

	var importWorker = fork(path.join(process.cwd(), '/app/importWorker.js'))

	importWorker.send({
	    importWorker : {startImport : true,
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


    function convertFileWithImportWorker(pgn_file) {

	var importWorker = fork(path.join(process.cwd(), '/app/importWorker.js'))

	importWorker.send({
	    importWorker : {startImport : true,
			    pgn_file : pgn_file}
	})

	var game_id = 1
	
	importWorker.on('message', (msg) => {

	    // worker has read one game
	    if (msg.importWorker.readGame) {
		var num_games = msg.importWorker.num_games
		var pgnData = msg.importWorker.pgnData

		var nodeInfo = {}
		nodeInfo.nodes = msg.importWorker.nodes
		nodeInfo.game_id = game_id
		
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
		gameInfo.positions = db.getPositions(nodeInfo.nodes)
		gameInfo.id = game_id

		
		// save to file
		var gamesfile = '/Users/weischen/Develop/ChessFriend-Fire/DB/CFF-converted-games.json'
		var nodesfile = '/Users/weischen/Develop/ChessFriend-Fire/DB/CFF-converted-nodes.json'

		fs.appendFile(gamesfile, JSON.stringify(gameInfo, null, 2) + ',', (err) => {
				  
		    if (err) throw err
		    console.log("converted game " + game_id)
		    
		    fs.appendFile(nodesfile, JSON.stringify(nodeInfo, null, 2) + ',', (err) => {				  
			if (err) throw err
			game_id += 1
		    })
				  
		})
		

		// resume reading
		importWorker.send({
		    importWorker : {resumeImport : true}
		})
	    }


	    // worker has finished reading
	    if (msg.importWorker.completedImport) {
		console.log("worker finished")
	    }
	    
	})	
    }
    

    // init db
    function enableDBExport() {

	var exportLink = window.document.getElementById("exportLink")
	exportLink.onclick = async () => {
	    try {
		const blob = await db.db.export({prettyJson: true, progressCallback})
		DownloadHandler(blob, "ChessFriend-Fire-export.json", "application/json")
	    } catch (error) {
		console.error(''+error)
	    }
	}


	var convertLink = window.document.getElementById("convertLink")
	convertLink.onclick = () => {
	    convertFileWithImportWorker('/Users/weischen/Develop/ChessFriend-Fire/KingBaseLite2019-04.pgn')
	}


	var importDZ = window.document.getElementById("importDZ")
	importDZ.ondragover = event => {
	    event.stopPropagation()
	    event.preventDefault()
	    event.dataTransfer.dropEffect = 'copy'
	}

	
	importDZ.ondrop = async ev => {

	    ev.stopPropagation()
	    ev.preventDefault()

	    const file = ev.dataTransfer.files[0]
	    db.importDB(file)
	}
	    
	
	function progressCallback ({totalRows, completedRows}) {
	    console.log(`Progress: ${completedRows} of ${totalRows} rows completed`)
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
    function displayNotation() {

	// load game from DB
	var game_id = tools.getParams(window.location.href).id
	
	db.db.nodes.get({game_id: parseInt(game_id)}, function (entry) {
	    
	    // initialize board state
	    boardState.initNodes(game_id, entry.nodes)

	    // enable keyboard navigation
	    boardState.enableKeyboard()

	    // set active in sidebar
	    sb.setActiveSidebarItem(game_id)
	    
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
		console.log("COUNT: "+ count)
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
		console.log("COUNT: "+ count)
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
	var tags = window.document.getElementById('searchparam_tags')
	var ahWhite = new Awesomplete(white)
	var ahBlack = new Awesomplete(black)
	var ahEvent = new Awesomplete(event)
	var ahTags = new Awesomplete(tags)
	
	db.db.games.orderBy('white').uniqueKeys(function (keys) {
	    ahWhite.list = keys
	    ahWhite.filter = Awesomplete.FILTER_STARTSWITH
	})

	db.db.games.orderBy('black').uniqueKeys(function (keys) {
	    ahBlack.list = keys
	    ahBlack.filter = Awesomplete.FILTER_STARTSWITH
	})

	db.db.games.orderBy('event').uniqueKeys(function (keys) {
	    ahEvent.list = keys
	    ahEvent.filter = Awesomplete.FILTER_CONTAINS
	})

	db.db.games.orderBy('tags').uniqueKeys(function (keys) {
	    ahTags.list = keys
	    ahTags.filter = Awesomplete.FILTER_CONTAINS
	})

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


	menu.append(new nw.MenuItem({
	    label: 'Delete annotation glyph',
	    click: function(){
		console.log('delete annotation glyph')
	    }
	}))

	menu.append(new nw.MenuItem({ type: 'separator' }))

	var submenu = new nw.Menu();
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
	    label: 'Delete game',
	    click: function(){
		boardState.deleteGame()
	    }
	}))

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
	
	// Hooks for the "contextmenu" event
	notationContainer.addEventListener('contextmenu', function(ev) {
	    // Prevent to showing default context menu event
	    //ev.preventDefault();
	    // display Popup the native context menu at place you clicked
	    menu.popup(ev.x, ev.y)  
	})


    }


    // delete game
    window.document.addEventListener("gameDeletedEvt", function(evt) {

	var game_id = parseInt(evt.detail.game_id)
	
	db.db.nodes.where({game_id: game_id}).delete()
	    .then(() => {
		db.db.games.delete(game_id)
	    }).then(() => {
		return db.db.games.count()
	    }).then(count => {
		return localStorage.setItem('dbCount', count)
	    }).then(() => {
		sb.removeGameFromSidebar(evt.detail.game_id)
	    })	
    })


    function setActiveSidebarItem(item) {
	sb.setActiveSidebarItem(item)
    }


    function createSaveBtn() {
	boardState.createSaveBtn()
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
    module.createEngineSettingsMenu = createEngineSettingsMenu
    module.makeSettingsConfirmable = makeSettingsConfirmable
    module.enableDBExport = enableDBExport
    
    return module
}
