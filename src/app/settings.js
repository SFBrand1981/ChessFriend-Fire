// settings
module.exports = function () {

    // Default settings
    function setDefaults() {
	setSetting('sidebarRatio', 0.68)
	setSetting('numEngineLines', 5)
	setSetting('openGames', JSON.stringify([...new Map()]))
	setSetting('gameHistory', JSON.stringify([]))
	setSetting('pageSize', 5)

	
	// reset on startup
	if (!sessionStorage.getItem('initialized')) {
	    sessionStorage.setItem('initialized', true)

	    // openGames
	    var openGames = new Map (JSON.parse(localStorage.getItem('openGames')))
	    openGames.forEach(function (value, key, map) {
		value['status'] = "loaded"
		map.set(key, value)
	    })
	    localStorage.setItem('openGames', JSON.stringify([...openGames]))

	    // search params
	    localStorage.setItem('searchParams', JSON.stringify({
		pageNum: 0,
		orderBy: 'id',
		container: 'hidden'
	    }))
	}
    }

    
    function setSetting(k, d) {
	var l = localStorage.getItem(k)

	if (!l) {
	    localStorage.setItem(k, d)
	}
    }


    var res_enum = {
	'1-0': '1',
	'1/2-1/2': '2',
	'0-1': '3',
	'*': '4'
    }

    
    // Module exports
    module.setDefaults = setDefaults
    module.res_enum = res_enum
    
    return module
}
