//

module.exports = function (window, DB) {

    
    var fs = require('fs')
    var path = require('path')
    var cfdt = require(path.join(process.cwd(), '/app/chessfriendDevTools'))
    var taglist = []
    var table_el
    var cursor_el
    var counter_el

    function getDBCount(callback) {

	DB.DB.count({}, function(err, count) {
	    DB.DBCount = count
	    callback(count)
	})
    }

    function getMinId(callback) {

	DB.DB.find({})
	    .map(function(x) { return parseInt(x._id, 16) })
	    .reduce(function(a,b) { return Math.min(a,b) }, parseInt("20000000000000", 16) )
	    .exec(function (err, res) {
		callback(res)
	    })
    }


    function initLastView() {
	
	hideInitLoader()
	DB.sorting = "created"

	DB.live.skip(0).exec(function (err, games) {

	    getDBCount(function(count) {
		counter_el.innerHTML = count

		if (counter_el.innerHTML === "0") {
                    cursor_el.innerHTML = "0"
		} else {
                    cursor_el.innerHTML = "1-" + games.length
		}
	    
		DB.last_view['query'] = 'live'
		DB.last_view['skip'] = 0
		DB.last_view['counter'] = count
		DB.last_view['cursor'] = cursor_el.innerHTML
		
		listDBEntries(games, table_el)
	    })
	})
    }


    function restoreLastView() {

	hideInitLoader()
	switch (DB.last_view.query) {
	case 'live':
	    counter_el.innerHTML = DB.DBCount
	    cursor_el.innerHTML = (DB.last_view.skip + 1).toString() + "-"
		+ (DB.last_view.skip + DB.live.res.length).toString()
	    DB.live.skip(DB.last_view['skip']).exec(function (err, games) {
		listDBEntries(games, table_el)
	    })
	    break
	case 'starred':
	    sortLiveRes(DB.starred.res)
	    counter_el.innerHTML = DB.starred.res.length
	    cursor_el.innerHTML = "1-" + DB.starred.res.length.toString()
	    listDBEntries(DB.starred.res, table_el)
	    break
	case 'tagged':
	    DB.DB.find({ tags: DB.last_view.tag }).exec(function (err, games) {
		sortLiveRes(games)
		counter_el.innerHTML = games.length
		cursor_el.innerHTML = "1-" + games.length.toString()
		listDBEntries(games, table_el)
	    })
	    break
	case 'search':
	    DB.DB.find(DB.lastSearch).exec(function(err, entries) {
		sortLiveRes(entries)
		counter_el.innerHTML = entries.length
		cursor_el.innerHTML = "1-" + entries.length.toString()
		listDBEntries(entries, table_el)
	    })
	    break
	}
    }


    function initTaglist() {

	if (localStorage.taglist === undefined || localStorage.taglist.length === 0) {
	    taglist = []
	} else {
	    taglist = localStorage.taglist.split(',')
	}

	var taglist_el = window.document.getElementById("taglist")
	var tags = window.document.getElementById("tags")

	if (localStorage.taglistHidden === undefined || localStorage.taglistHidden === "false") {
	    taglist_el.classList.remove("hiddenTaglist")

	} else {
	    taglist_el.classList.add("hiddenTaglist")
	}
	
	
	// reset taglist
	while (taglist_el.lastChild) {
	    taglist_el.removeChild(taglist_el.lastChild);
	}

	taglist.sort()
	
	for (var i = 0; i < taglist.length; i++) {
	    var tag = window.document.createElement('p')
	    tag.classList.add("tag")
	    tag.id = "tag_" + taglist[i]
	    tag.innerHTML = '<i class="menu fa">&#xf02b;</i>' + taglist[i]

	    tag.addEventListener("click", function (evt) {
		var tagname = this.id.replace(/^tag_/,'')
		
		DB.DB.find({ tags: tagname }).exec(function(err, entries) {

		    // delete tag if it is no longer used
		    if (entries.length === 0) {

			alert("Tag is no longer used")
			for( var j = 0; j < taglist.length; j++){ 
			    if (taglist[j] === tagname) {
				taglist.splice(j, 1)
				localStorage.taglist = taglist
			    }
			}

			initTaglist()
			initLastView()
		    }

		    counter_el.innerHTML = entries.length
		    cursor_el.innerHTML = "1-" + counter_el.innerHTML
		    sortLiveRes(entries)
		    listDBEntries(entries, table_el)

		    if (counter_el.innerHTML === "0") {
			cursor_el.innerHTML = "0"
		    } else {
			cursor_el.innerHTML = "1-" + counter_el.innerHTML
		    }

		    DB.last_view.query = 'tagged'
		    DB.last_view.count = counter_el.innerHTML
		    DB.last_view.cursor = cursor_el.innerHTML
		    DB.last_view.skip = 0
		    DB.last_view.tag = tagname
		    
		})
	    })
	    
	    taglist_el.appendChild(tag)
	}
    }
    
    function initDBListener(table_element, counter_element, cursor_element) {

	table_el = table_element
	cursor_el = cursor_element
	counter_el = counter_element

	initTaglist()

	var taglist = document.getElementById("taglist")


	if (DB.forceInitialization) {
	    initLastView()
	    DB.forceInitialization = false
	    return
	}

	// restore on page reload
	if (DB.initialized) {

	    restoreLastView()
	    return
	}
	
	// initial values
	counter_el.innerHTML = "counting"
	
	DB.DB.on("liveQueryUpdate", function() {

	    if (DB.initialized) {
		// prevent multiple liveQueryUpdates
		return
	    }
	    initLastView()
	    DB.initialized = true
	})	
    }
    
    
    function hideInitLoader() {
	var initLoader = window.document.getElementById("initLoader")
	if (initLoader) {
	    initLoader.parentElement.removeChild(initLoader)
	}
    }
    
    
    function sortByCreated(table_el, counter_el, cursor_el) {
	initLastView()
    }


    function nextCursor(table_el, counter_el, cursor_el) {

	if(DB.last_view['query'] !== 'live') {
	    return
	}
	
	if (DB.last_view['skip'] === counter_el.value) {
	    return
	}

	var limit = DB.live.res.length
	DB.last_view['skip'] += limit
	var cursorLimit = Math.min(DB.last_view['skip']+limit, counter_el.value)


	if (DB.last_view['skip'] >= cursorLimit) {
	    DB.last_view['skip'] -= limit
	    return
	}
	
	DB.live.skip(DB.last_view['skip']).exec(function (err, games) {
	    listDBEntries(games, table_el)
	    cursor_el.innerHTML = (DB.last_view['skip'] + 1).toString() + "-" + cursorLimit.toString()
	    DB.last_view['cursor'] = cursor_el.innerHTML 
	})

    }


    function prevCursor(table_el, counter_el, cursor_el) {

	if(DB.last_view['query'] !== 'live') {
	    return
	}
	
	if (DB.last_view['skip'] === 0) {
	    return
	}
	
	var limit = DB.live.res.length
	DB.last_view['skip'] -= limit
	var cursorLimit = Math.min(DB.last_view['skip']+limit, counter_el.value)
	
	
	if (DB.last_view['skip'] < 0) {
	    DB.last_view['skip'] += limit
	    return
	}
	
	DB.live.skip(DB.last_view['skip']).exec(function (err, games) {
	    listDBEntries(games, table_el)
	    cursor_el.innerHTML = (DB.last_view['skip'] + 1).toString() + "-" + cursorLimit.toString()
	    DB.last_view['cursor'] = cursor_el.innerHTML  
	})
	
    }

    
    function sortByStarred(table_el, counter_el, cursor_el) {

	counter_el.innerHTML = DB.starred.res.length
	cursor_el.innerHTML = "1-" + counter_el.innerHTML

	if (counter_el.innerHTML === "0") {
	    cursor_el.innerHTML = "0"
	} else {
	    cursor_el.innerHTML = "1-" + counter_el.innerHTML
	}

	DB.last_view.query = 'starred'
	DB.last_view.count = counter_el.innerHTML
	DB.last_view.cursor = cursor_el.innerHTML
	DB.last_view.skip = 0

	sortLiveRes(DB.starred.res)
	listDBEntries(DB.starred.res, table_el)
    }


    function sortLiveRes(games) {
	switch (DB.sorting) {
	case "created":
	    // default sorting by id
	    games.sort((a, b) => (a._id > b._id) ? 1 : -1)
	    break
	case "white":
	    games.sort((a, b) => (a.White > b.White) ? 1 : -1)
	    break
	case "black":
	    games.sort((a, b) => (a.Black > b.Black) ? 1 : -1)
	    break
	case "elo_white":
	    games.sort((a, b) => (a.WhiteElo < b.WhiteElo) ? 1 : -1)
	    break
	case "elo_black":
	    games.sort((a, b) => (a.BlackElo < b.BlackElo) ? 1 : -1)
	    break
	case "result":
	    games.sort((a, b) => (a.Result < b.Result) ? 1 : -1)
	    break
	case "event":
	    games.sort((a, b) => (a.Event > b.Event) ? 1 : -1)
	    break
	case "year":
	    games.sort((a, b) => (a.Date > b.Date) ? 1 : -1)
	    break
	}

    }
    
    
    // Display DB entries in table view
    function listDBEntries(games, el) {

	
	// cleanup
	while (el.lastChild) {
	    el.removeChild(el.lastChild);
	}

	
	var table_header = window.document.createElement('table')
	table_header.classList.add("db-entries", "db-sticky-table")

	var table_body = window.document.createElement('table')
	table_body.classList.add("db-entries")

	
	var thead = window.document.createElement('thead')
	var tr = window.document.createElement('tr')
	tr.classList.add('clickable-db-entry-row', 'db-table-header')

	
	for (var n = 0; n < 9; n++) {
	    var th = window.document.createElement('th')

	    switch (n) {

	    case 0:
		th.classList.add("db-entry", "db-entry-star")
		th.innerHTML = ''
		break
	    case 1:
		th.classList.add("db-entry", "db-entry-player")
		th.innerHTML = 'White'
		break
	    case 2:
		th.classList.add("db-entry", "db-entry-dwz")
		th.innerHTML = 'Elo W'
		break
	    case 3:
		th.classList.add("db-entry", "db-entry-player")
		th.innerHTML = 'Black'
		break
	    case 4:
		th.classList.add("db-entry", "db-entry-dwz")
		th.innerHTML = 'Elo B'
		break
	    case 5:
		th.classList.add("db-entry", "db-entry-res")
		th.innerHTML = 'Result'
		break
	    case 6:
		th.classList.add("db-entry", "db-entry-event")
		th.innerHTML = 'Event'
		break
	    case 7:
		th.classList.add("db-entry", "db-entry-year")
		th.innerHTML = 'Year'
		break
	    case 8:
		th.classList.add("db-entry", "db-entry-tag")
		th.innerHTML = ''
		break
	    // case 9:
	    // 	th.classList.add("db-entry", "db-entry-trash")
	    // 	th.innerHTML = ''
	    // 	break
	    default:
		//
	    }

	    tr.appendChild(th)
	}
	thead.appendChild(tr)
	table_header.appendChild(thead)

	
	var tbody = window.document.createElement('tbody')
	
	for (var i = 0; i < games.length; i++) {
	    var tr = window.document.createElement('tr')
	    tr.classList.add('clickable-db-entry-row')
	    tr.id = games[i]['_id']

	    var starred = games[i]['starred']
	    var tagged = (games[i]['tags'] === null ||
			  games[i]['tags'] === undefined ||
			  games[i]['tags'].length === 1 && games[i]['tags'][0] === "" ||
			  games[i]['tags'].length === 0 ) ? false : true


	    for (var n = 0; n < 9; n++) {
		var td = window.document.createElement('td')

		switch (n) {

		case 0:
		    td.classList.add("db-entry", "db-entry-star")
		    if (starred) {
			td.innerHTML = '<i class="fa starred">&#xf005;</i>'
		    } else {
			td.innerHTML = '<i class="fa">&#xf006</i>'
		    }
		    break
		case 1:
		    td.classList.add("db-entry", "db-entry-player")
		    td.innerHTML = games[i]['White']
		    break
		case 2:
		    td.classList.add("db-entry", "db-entry-dwz")
		    td.innerHTML = games[i]['WhiteElo']	    
		    break
		case 3:
		    td.classList.add("db-entry", "db-entry-player")
		    td.innerHTML = games[i]['Black']
		    break
		case 4:
		    td.classList.add("db-entry", "db-entry-dwz")
		    td.innerHTML = games[i]['BlackElo']
		    break
		case 5:
		    td.classList.add("db-entry", "db-entry-res")
		    td.innerHTML = games[i]['Result']
		    break
		case 6:
		    td.classList.add("db-entry", "db-entry-event")
		    td.innerHTML = games[i]['Event']
		    break
		case 7:
		    td.classList.add("db-entry", "db-entry-year")
		    td.innerHTML = games[i]['Date'].slice(0, 4)
		    break
		case 8:
		    td.classList.add("db-entry", "db-entry-tag")

		    if (tagged) {
			td.innerHTML = '<i class="fa tagged">&#xf02b</i>'
		    } else {
			td.innerHTML = '<i class="fa">&#xf02b</i>'
		    }
		    break
		// case 9:
		//     td.classList.add("db-entry", "db-entry-trash")
		//     td.innerHTML = '<i class="fa">&#xf014</i>'
		//     break
		default:
		    //
		}

		tr.appendChild(td)

	    }

	    tbody.appendChild(tr)
	    
	}

	table_body.appendChild(tbody)
	el.appendChild(table_header)
	el.appendChild(table_body)

	// make table clickable
	var x = window.document.getElementsByClassName("db-entry")
	for (var i = 0; i < x.length; i++) {

	    if (x[i].parentNode.classList.contains('db-table-header')) {
		if (x[i].innerHTML === "White") {
		    x[i].addEventListener("click", function (evt) {
			DB.sorting = "white"
			restoreLastView()
		    })
		} else if (x[i].innerHTML === "Black") {
		    x[i].addEventListener("click", function (evt) {
			DB.sorting = "black"
			restoreLastView()
		    })
		} else if (x[i].innerHTML === "Elo W") {
		    x[i].addEventListener("click", function (evt) {
			DB.sorting = "elo_white"
			restoreLastView()
		    })
		} else if (x[i].innerHTML === "Elo B") {
		    x[i].addEventListener("click", function (evt) {
			DB.sorting = "elo_black"
			restoreLastView()
		    })
		} else if (x[i].innerHTML === "Result") {
		    x[i].addEventListener("click", function (evt) {
			DB.sorting = "result"
			restoreLastView()
		    })
		} else if (x[i].innerHTML === "Event") {
		    x[i].addEventListener("click", function (evt) {
			DB.sorting = "event"
			restoreLastView()
		    })
		} else if (x[i].innerHTML === "Year") {
		    x[i].addEventListener("click", function (evt) {
			DB.sorting = "year"
			restoreLastView()
		    })
		}

		// disable sort for DB view
		if (DB.last_view['query'] !== 'live') {
		    x[i].parentNode.classList.add("hoverable")
		}
		
		continue
	    }

	    x[i].addEventListener("click", function (evt) {

		if (this.classList.contains("db-entry-trash")) {
		    alert('TRASHED: ' + this.parentNode.rowIndex)
		} else if (this.classList.contains("db-entry-star")) {
		    doStar(this.parentNode.id)
		} else if (this.classList.contains("db-entry-tag")) {
		    getTags(this.parentNode.id)
		} else {
		    DB.userSelected['startmode'] = "fromDB"
		    DB.userSelected['id'] = this.parentNode.id
		    window.open('/views/game.html', '_self') // replaces current page
		}
	    }, false)
	}
    }

    function doStar(id) {

	DB.DB.findOne({ _id: id }, function (err, entry) {
	    if (entry.starred === undefined || entry.starred === false) {
		entry.starred = true
	    } else {
		entry.starred = false
	    }

	    DB.DB.save(entry, function(err, entries) {
		// 
	    })
	})
	
	var tr = window.document.getElementById(id)
	for (var i = 0; i < tr.childNodes.length; i++) {
	    if(tr.childNodes[i].classList.contains("db-entry-star")) {
		var star_el = tr.childNodes[i].childNodes[0]
		var starred = star_el.classList.contains("starred")
		if (starred) {
		    tr.childNodes[i].innerHTML = '<i class="fa">&#xf006</i>'
		} else {
		    tr.childNodes[i].innerHTML = '<i class="fa starred">&#xf005;</i>'
		}
		break
	    }
	}
    }

    
    function getTags(id, modal) {

	var tagModal = window.document.getElementById("tagModal")
	var tagInput = window.document.getElementById("tagInput")
	var tagEntry = window.document.getElementById("tagEntry")
	
	DB.DB.findOne({ _id: id }, function (err, entry) {

	    if (entry.tags !== undefined) {
		tagInput.value = entry.tags.join(", ")
	    } else {
		tagInput.value = ""
	    }
	    
	    tagEntry.value = id
	    tagModal.style.display = "flex"
	    tagInput.focus()
	})
    }

    function setTags(id, tags) {
	
	DB.DB.findOne({ _id: id }, function (err, entry) {

	    entry.tags = []
	    
	    if (tags !== "") {
		var tag_array = tags.split(",")
		for (var i = 0; i < tag_array.length; i++) {
		    entry.tags.push(tag_array[i].trim())
		    
		    if (!taglist.includes(tag_array[i].trim())) {
			taglist.push(tag_array[i].trim())
			localStorage.taglist = taglist
		    }
		}
	    }

	    DB.DB.save(entry, function(err, entries) {
		initTaglist()
	    })
	    

	    var tr = window.document.getElementById(id)
	    for (var i = 0; i < tr.childNodes.length; i++) {
		if(tr.childNodes[i].classList.contains("db-entry-tag")) {
		    var tag_el = tr.childNodes[i].childNodes[0]

		    var tagged = (entry.tags.length === 0) ? false : true
		    if (tagged) {
			tr.childNodes[i].innerHTML = '<i class="fa tagged">&#xf02b</i>'
		    } else {
			tr.childNodes[i].innerHTML = '<i class="fa">&#xf02b;</i>'
		    }
		    break
		}
	    }
	})
    }


    function updateTaglist() {

	var new_taglist = []

	DB.DB.find({}).exec(function(err, entries) {

	    for (var i = 0; i < entries.length; i++) {

		if (entries[i].tags !== undefined) {
		
		    for (var j = 0; j < entries[i].tags.length; j++) {
			if (new_taglist.includes((entries[i].tags)[j])) {
			    //
			} else {
			    new_taglist.push((entries[i].tags)[j])
			}
		    }
		}
	    }

	    taglist = new_taglist
	})
    }


    function searchDB(searchObj) {

	DB.DB.find(searchObj).exec(function(err, entries) {
	    var count = entries.length
	    if (count !== 0) {
		DB.lastSearch = searchObj
		DB.last_view['query'] = 'search'
		DB.last_view['skip'] = 0
		DB.last_view['counter'] = count
		DB.last_view['cursor'] = "1-" + count.toString()

		window.open('/views/main.html', '_self')
	    } else {
		alert ("No matching entries can be found")
	    }
	    
	})
    }


    function trashDB() {

	DB.DB.find({}).exec(function (err, games) {
    	    for (var i = 0; i < games.length; i++) {
    		games[i].remove(function(){
    		    //
    		})
    	    }
	})
    }

    
    
    // Module exports
    module.initDBListener = initDBListener
    module.sortByStarred = sortByStarred
    module.sortByCreated = sortByCreated
    module.nextCursor = nextCursor
    module.prevCursor = prevCursor
    module.setTags = setTags
    module.searchDB = searchDB
    module.trashDB = trashDB
    module.getMinId = getMinId
    
    return module

}

