
module.exports = function (window) {

    var root = window.document.documentElement

    // root.style.setProperty('--base0-color', '#FF0000')
    
    function setSetting(k, d) {
	var l = localStorage.getItem(k)
        
	if (!l) {
	    localStorage.setItem(k, d)
	}
    }

    // Default settings
    module.setDefaults = function() {
	setSetting('sidebarRatio', 0.68)
	setSetting('numEngineLines', 5)
	setSetting('draggableSidebarItems', JSON.stringify([]))
	setSetting('pageSize', 100)
	setSetting('maxNumOfItemsSortedInMemory', 5000)
	setSetting('numAwesompleteSuggestions', 20)
	
	// reset on startup
	if (!sessionStorage.getItem('initialized')) {
	    sessionStorage.setItem('initialized', true)
	}
    }


    var resEnum = {'1-0': '1',
	           '1/2-1/2': '2',
	           '0-1': '3',
	           '*': '4'}

    module.resToEnum = function(res) {
        return resEnum[res]
    }


    module.enumToRes = function(n) {
        
        for (var key in resEnum) {
            if (resEnum[key] == n) {
                return key
            }
        }
    }
    
    return module
}
