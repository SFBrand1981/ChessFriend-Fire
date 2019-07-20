
// Binding and chaining functions
function bind(f, g) {
    return function(a, callback) {
        f(a, function(result) {
	    return g(result, callback)
	})
    }
}

function chain() {
    var args = Array.prototype.slice.call(arguments),
        f = args.shift()
    while (args.length > 0) {
        f = bind(f, args.shift())
    }
    return f
}

exports.chain = chain


// Date format
exports.formatDate = function(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear()
    
    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day
    
    return [year, month, day].join('.')
}


// Query parameters
exports.getParams = function (url) {
    var params = {};
    var parser = document.createElement('a');
    parser.href = url;
    var query = parser.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
	var pair = vars[i].split('=');
	params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
};


// Check if element is visible after scrolling
exports.isScrolledIntoView = function isScrolledIntoView(el) {
    var rect = el.getBoundingClientRect();
    var elemTop = rect.top;
    var elemBottom = rect.bottom;
    
    // Only completely visible elements return true:
    var isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
    // Partially visible elements return true:
    //isVisible = elemTop < window.innerHeight && elemBottom >= 0;
    return isVisible;
}
