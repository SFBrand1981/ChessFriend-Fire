// record history
module.exports = function () {


    function addGame(g) {

	var history = JSON.parse(localStorage.getItem('gameHistory'))
	
	// add game as last element to history 
	var newHistory = history.filter( function (ele) {
	    return ele != g
	})

	newHistory.push(g)
	localStorage.setItem('gameHistory', JSON.stringify(newHistory))
	return newHistory
    }


    function previousGame(g) {
	var history = JSON.parse(localStorage.getItem('gameHistory'))

	// forget about game g
	var newHistory = history.filter( function (ele) {
	    return ele != g
	})

	localStorage.setItem('gameHistory', JSON.stringify(newHistory))

	if (newHistory.length > 0) {
	    return newHistory[newHistory.length-1]
	} else {
	    return null
	}
    }

    
    module.addGame = addGame
    module.previousGame = previousGame
    
    return module
}
