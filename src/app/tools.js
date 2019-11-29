
exports.newObjFrom = function(obj) {

    var newObj = {}

    Object.entries(obj).forEach(([key, value]) => {
	newObj[key] = value
    })

    console.log("Created new object: ", newObj)
    return newObj
}


exports.intersect = function (a) {
    if (a.length > 2)
        return intersect([intersect(a.slice(0, a.length / 2)),
                          intersect(a.slice(a.length / 2))])
        
    if (a.length == 1)
        return a[0]
    
    return a[0].filter(function(item) {
        return a[1].indexOf(item) !== -1
    })
}


exports.isScrolledIntoView = function isScrolledIntoView(window, el) {
    var rect = el.getBoundingClientRect();
    var elemTop = rect.top;
    var elemBottom = rect.bottom;
    
    // Only completely visible elements return true:
    var isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);

    // Partially visible elements return true:
    //isVisible = elemTop < window.innerHeight && elemBottom >= 0;

    return isVisible;
}


exports.getInitialFEN = function() {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
}


exports.formatDate = function(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear()
    
    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day
    
    return [year, month, day].join('.')
}
