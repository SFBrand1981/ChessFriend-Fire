// Logging to stdout and debug.log during development
var util = require('util');
var fs = require('fs');
var path = require('path');


var parentDir = path.resolve(process.cwd(), '..');
var log_file = fs.createWriteStream(path.join(parentDir, '/debug.log'), {flags : 'w'});
var log_stdout = process.stdout;
var settings_file = 'chessfriend-settings.json';


function log(d) {
    console.log(d);
    log_file.write("LOG: " + util.format(d) + '\n');
    log_stdout.write("LOG: " + util.format(d) + '\n');
}

function info(d) { 
    console.info(d);
    log_file.write("INFO: " + util.format(d) + '\n');
    log_stdout.write("INFO: " + util.format(d) + '\n');
};

function error(d) { 
    console.error(d);
    log_file.write("ERROR: " + util.format(d) + '\n');
    log_stdout.write("ERROR: " + util.format(d) + '\n');
};

function warn(d) { 
    console.warn(d);
    log_file.write("WARN: " + util.format(d) + '\n');
    log_stdout.write("WARN: " + util.format(d) + '\n');
};

exports.log = log
exports.info = info
exports.error = error
exports.warn = warn


// Saving settings to disk
exports.saveSettings = function (settings, callback) {
    var filePath = path.join(nw.App.dataPath, settings_file);

    console.log(nw.App.dataPath)
    
    fs.writeFile(filePath, JSON.stringify(settings), function (err) {
        if (err) {
            info("There was an error attempting to save your data.")
            warn(err.message)
            return;
        } else if (callback) {
            callback()
        }
    })
}


// Read settings from disk
function readSettings (callback) {
    var filePath = path.join(nw.App.dataPath, settings_file);

    fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
            info("There was an error attempting to read your data.");
            warn(err.message);
            return;
        } else if (callback) {
            callback(JSON.parse(data));
        }
    });
};


exports.readSettings = readSettings


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
    
    return [year, month, day].join('-')
}


function getConfigParam(name, def) {

    if (localStorage[name] === undefined) {
	return def
    } else {
	return localStorage[name]
    }
}

exports.getConfigParam = getConfigParam


exports.waitForWebfonts = function(fonts, callback) {
    var loadedFonts = 0;
    for(var i = 0, l = fonts.length; i < l; ++i) {
        (function(font) {
	    var node = window.document.createElement('span');
	    // Characters that vary significantly among different fonts
	    node.innerHTML = 'giItT1WQy@!-/#';
	    // Visible - so we can measure it - but not on the screen
	    node.style.position      = 'absolute';
	    node.style.left          = '-10000px';
	    node.style.top           = '-10000px';
	    // Large font size makes even subtle changes obvious
	    node.style.fontSize      = '300px';
	    // Reset any font properties
	    node.style.fontFamily    = 'sans-serif';
	    node.style.fontVariant   = 'normal';
	    node.style.fontStyle     = 'normal';
	    node.style.fontWeight    = 'normal';
	    node.style.letterSpacing = '0';
	    window.document.body.appendChild(node);

	    // Remember width with no applied web font
	    var width = node.offsetWidth;

	    node.style.fontFamily = font;

	    var interval;
	    function checkFont() {
                // Compare current width with original width
                if(node && node.offsetWidth != width) {
		    ++loadedFonts;
		    node.parentNode.removeChild(node);
		    node = null;
                }

                // If all fonts have been loaded
                if(loadedFonts >= fonts.length) {
		    if(interval) {
                        clearInterval(interval);
		    }
		    if(loadedFonts == fonts.length) {
                        callback(font);
                        return true;
		    }
                }
	    };

	    if(!checkFont()) {
                interval = setInterval(checkFont, 50);
	    }
        })(fonts[i]);
    }
};



