// sidebar
module.exports = function (window) {

    var path = require('path')
    var DnDHandler = require(path.join(process.cwd(), '/app/dragNdrop.js'))
    var HistoryHandler = require(path.join(process.cwd(), '/app/history.js'))

    var dnd = new DnDHandler()
    var hh = new HistoryHandler()
    
    var openGames = new Map (JSON.parse(localStorage.getItem('openGames')))
    
    function selectGameInSidebar(game_id, title) {

	var gameSelectedInSidebarEvt = new CustomEvent("gameSelectedInSidebarEvt", {
	    detail: { game_id : game_id,
		      title : title}
	})
	window.document.dispatchEvent(gameSelectedInSidebarEvt)
    }

    function createSidebarElement(container, desc) {
	var li = document.createElement('li')
	li.classList.add('sidebarItem')

	var liContainer = document.createElement('div')
	liContainer.classList.add('liContainer')

	var liText = document.createElement('div')
	liText.classList.add('liText')
	liText.innerHTML = desc
	liText.id = desc

	li.appendChild(liContainer)
	liContainer.appendChild(liText)

	container.appendChild(li)
    }

    
    function createSidebar(container) {

	createSidebarElement(container, "Games")
	createSidebarElement(container, "Database")
	createSidebarElement(container, "Setup position")


	// sidebar separator
	var li = document.createElement('li')
	li.classList.add('sidebarSeparator')
	container.appendChild(li)


	// sidebar events
	createImportModal()

	var gamesBtn = window.document.getElementById('Games')
	gamesBtn.addEventListener('click', function(e) {
	    window.open('/views/main.html', '_self')
	})

	
	var dbImportBtn = window.document.getElementById('Database')
	dbImportBtn.addEventListener('click', function(e) {
	    window.open('/views/import.html', '_self')
	})	


	var setupBtn = window.document.getElementById('Setup position')
	setupBtn.addEventListener('click', function(e) {
	    window.open('/views/search.html', '_self')
	})


	// event listeners
	window.document.addEventListener('gameEditedEvt', function(evt) {

	    // mark game as edited
	    var game_id = evt.detail.id
	    var openGame = openGames.get(game_id)
	    var title = openGame.title
	    var status = openGame.status

	    if (status != "edited") {
		openGames.set(game_id, { title : title, status: 'edited' })
		localStorage.setItem('openGames', JSON.stringify([...openGames]))

		// update status in sidebar
		var sidebarItem = window.document.getElementById(game_id)
		sidebarItem.insertAdjacentHTML('afterbegin', '*')
	    }
	})


	window.document.addEventListener('importCompletedEvt', function(evt) {
	    confirmImport()
	})
	
    }


    function updateSidebarGame(game_id, title) {
	var sidebarItem = window.document.getElementById(game_id)
	sidebarItem.innerHTML = title

	openGames.set(game_id, { title : title, status: 'loaded' })
	localStorage.setItem('openGames', JSON.stringify([...openGames]))
    }
    

    function createImportModal() {
	var importModal = document.createElement('div')
	importModal.classList.add('modal')
	importModal.id = 'importModal'
	
	var importModalContent = document.createElement('div')
	importModalContent.classList.add('modal-content')

	var importModalLoader = document.createElement('div')
	importModalLoader.classList.add('loader')
	importModalLoader.id = 'importModalLoader'
	
	var importStatusBar = document.createElement('div')
	importStatusBar.id = 'importStatusBar'
	importStatusBar.innerHTML = 'Processing'
	
	var importConfirm = document.createElement('span')
	importConfirm.id = 'importConfirm'
	importConfirm.classList.add('btn')
	importConfirm.innerHTML = 'Ok'
	importConfirm.style.display = 'none'

	importConfirm.addEventListener('click', function(evt) {
	    window.open('/views/main.html', '_self')
	})

	importModalContent.appendChild(importModalLoader)
	importModalContent.appendChild(importStatusBar)
	importModalContent.appendChild(importConfirm)
	importModal.appendChild(importModalContent)	
	window.document.body.appendChild(importModal)

	var importPGNDialog = document.createElement('input')
	importPGNDialog.style.display = 'none'
	importPGNDialog.type = 'file'
	importPGNDialog.accept = '.pgn'
	importPGNDialog.id = 'importPGNDialog'
	window.document.body.appendChild(importPGNDialog)

	var importJSONDialog = document.createElement('input')
	importJSONDialog.style.display = 'none'
	importJSONDialog.type = 'file'
	importJSONDialog.multiple = true
	importJSONDialog.accept = '.json'
	importJSONDialog.id = 'importJSONDialog'
	window.document.body.appendChild(importJSONDialog)
    }

    
    function confirmImport() {
	var loader = window.document.getElementById("importModalLoader")
	var importStatusBar = window.document.getElementById("importStatusBar")
	var importConfirm = window.document.getElementById("importConfirm")

	loader.style.display = 'none'
	importConfirm.style.display = 'inline-block'
    }


    function createGameElement(container, id, title, status) {

	var li = document.createElement('li')
	li.classList.add('sidebarItem')
	li.setAttribute('draggable', 'true')
	
	var liContainer = document.createElement('div')
	liContainer.classList.add('liContainer')
	
	var liText = document.createElement('div')
	liText.classList.add('liText')
	liText.innerHTML = (status == 'edited') ? '*' : ''
	liText.innerHTML += title
	liText.id = id
	    
	// icon to remove the game from the sidebar
	var liIcon = document.createElement('div')
	liIcon.classList.add('liIcon')
	liIcon.innerHTML = '<i class="fa">&#xf057;</i>'


	li.appendChild(liContainer)
	liContainer.appendChild(liText)
	liContainer.appendChild(liIcon)	

	// add item to sidebar
	container.appendChild(li)

	// make drag 'n dropable
	dnd.addDnDHandlers(li)

    }


    function createDummy(container) {
	var dummy = document.createElement('li')
	dummy.classList.add('sidebarItem', 'dummy')
	container.appendChild(dummy)
	dnd.addDnDHandlers(dummy)
    }
    

    // add game to sidebar on load
    function addGameToSidebar(container, evt) {

	var title = evt.detail['title']
	var game_id = evt.detail['game_id']

	if (openGames.get(game_id)) {
	    // game is already attached to sidebar
	    return
	}

	// NOT NECESSARY IF WINDOW GETS RELOADED AFTERWARDS
	// if (container.lastChild &&
	//     container.lastChild.classList.contains("dummy")) {
	    
	//     container.removeChild(container.lastChild)
	// }
	// createGameElement(container, game_id, title)
	// createDummy(container)
	
	openGames.set(game_id, { title : title, status: 'loaded' })
	localStorage.setItem('openGames', JSON.stringify([...openGames]))
    }


    function removeGameFromSidebar(game_id) {

	openGames.delete(game_id)
	localStorage.setItem('openGames', JSON.stringify([...openGames]))

	// remove game from current sidebar
	var qs = window.document.querySelectorAll('#openGames .liText')
	for (var i = 0; i < qs.length; i++) {
	    if (qs[i].id == game_id) {
		var parent = qs[i].parentNode
		while (parent.lastChild) {
		    parent.removeChild(parent.lastChild)
		}
		break
	    }
	}


	// forget about removed game
	sessionStorage.removeItem(game_id)
	
	
	// load last game from history
	loadLastGameFromHistory(game_id)


	// remove game from nodes to free up memory
	var removeNodesEvt = new CustomEvent("removeNodesEvt", {
	    detail: { game_id : game_id }
	})
	window.document.dispatchEvent(removeNodesEvt)

    }


    function loadLastGameFromHistory(game_id) {
	var prevGameId = hh.previousGame(game_id)
	if (prevGameId != null && !window.location.pathname.endsWith('/main.html')) {
	    var prevTitle = openGames.get(prevGameId).title
	    selectGameInSidebar(prevGameId, prevTitle)
	} else {
	    window.open('/views/main.html', '_self')
	}
    }
    

    function addOpenGamesToSidebar(container) {

	while (container.lastChild) {
	    container.removeChild(container.lastChild)
	}

	for (var key of openGames.keys()) {
	    var game_id = key
	    var title = openGames.get(key)['title']
	    var status = openGames.get(key)['status']
	    
	    createGameElement(container, game_id, title, status)

	}
	// dummy element for easier drag 'n drop
	createDummy(container)


	// make open games clickable	
	container.addEventListener('click', function(evt) {
	    if (evt.target.matches('.liText')) {
		selectGameInSidebar(evt.target.id, evt.target.innerHTML)
	    } else if (evt.target.matches('.fa')) {
		var parentId = evt.target.parentNode.parentNode.firstChild.id
	 	removeGameFromSidebar(parentId)
	    }
	})


	// reorder after drag 'n drop
	container.addEventListener("sidebarReorderedEvt", function (evt) {
	    var qs = window.document.querySelectorAll('#openGames .liText')
	    var newOpenGames = new Map()
	    for (var i = 0; i < qs.length; i++) {
		var key = qs[i].id
		newOpenGames.set(key, openGames.get(key))
		localStorage.setItem('openGames', JSON.stringify([...newOpenGames]))
	    }

	    // update current
	    openGames = newOpenGames
	})

    }


    function setActiveSidebarItem(item) {

	// reset
	var selected = window.document.getElementsByClassName("activeSidebarItem")
	for (var i = 0, len = selected.length; i < len; i++) {
	    selected[i].classList.remove('activeSidebarItem')
	}

	// (re-)apply
	var activeBtn = window.document.getElementById(item)
	activeBtn.classList.add('activeSidebarItem')
    }
    
	
    // Module exports
    module.createSidebar = createSidebar
    module.createImportModal = createImportModal
    module.confirmImport = confirmImport
    module.addGameToSidebar = addGameToSidebar
    module.addOpenGamesToSidebar = addOpenGamesToSidebar
    module.updateSidebarGame = updateSidebarGame
    module.removeGameFromSidebar = removeGameFromSidebar
    module.setActiveSidebarItem = setActiveSidebarItem
    module.loadLastGameFromHistory = loadLastGameFromHistory
    
    return module
}
