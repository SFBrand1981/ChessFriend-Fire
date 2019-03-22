// Load requirements
var fs = require('fs')
var path = require('path')
var cfdt = require(path.join(process.cwd(), '/app/chessfriendDevTools'))
var os = require('os')

var cfSettings = {
    language : "en",
    theme : "dark",
    screenX : 800,
    screenY : 800,
    outerWidth : 14,
    innerHeight : 42,
    saveWindowPosition : true,
    saveWindowSize : false
}

// initialize engine parameters
var filePath = path.join(process.cwd(), "engineParams");
var engineParams = {}

if (os.platform() === "darwin") {
    engineParams['enginePath'] = cfdt.getConfigParam('enginePath', path.join(process.cwd(), '/bin/stockfish-10-64'))
} else if (os.platform() === "linux") {
    engineParams['enginePath'] = cfdt.getConfigParam('enginePath', path.join(process.cwd(), '/bin/stockfish_10_x64'))
} else if (os.platform() === "win64") {
    engineParams['enginePath'] = cfdt.getConfigParam('enginePath', path.join(process.cwd(), '/bin/stockfish_10_x64.exe'))
} else {
    engineParams['enginePath'] = cfdt.getConfigParam('enginePath', path.join(process.cwd(), '/bin/stockfish-10-64'))
}
    
engineParams['numThreads'] = cfdt.getConfigParam('numThreads', 4)
engineParams['multiPV'] = cfdt.getConfigParam('multiPV', 5)

fs.writeFile(filePath, JSON.stringify(engineParams), function (err) {
})

// // Read settings on load
// window.onload = () => {

//     cfdt.readSettings(function (settings) {

// 	if (settings.screenX != undefined && settings.screenY != undefined) {
// 	    window.moveTo(settings.screenX, settings.screenY)
// 	}
//     })
// }



// Create an empty menubar
let mainMenu = new nw.Menu({
    type: "menubar"
})

//menu.createMacBuiltin('chessfriend', {hideEdit: "true"} )


// Create a submenu as the 2nd level menu
let submenu = new nw.Menu()
submenu.append(new nw.MenuItem({
    label: "About"
}))

submenu.append(new nw.MenuItem({
    label: "Preferences",
    click: function() {
	window.open('/views/settings.html', '_self')
    },
    key: ",",
    modifiers: "command",
}))

item = new nw.MenuItem({ type: 'separator' });

submenu.append(new nw.MenuItem({
    type: "separator"
}))

submenu.append(new nw.MenuItem({
    label: "Quit",
    click: function() {
	nw.App.quit()
    },
    key: "Q",
    modifiers: "command",
}))

// Create and append the 1st level menu to the menubar
mainMenu.append(new nw.MenuItem({
    label: "Menu",
    submenu: submenu
}))


// Assign menu to `window.menu`
nw.Window.get().menu = mainMenu


// Remove menu on page leave
window.onunload = () => {
    nw.Window.get().menu = null
}


// // Save settings before window unloads 
// window.addEventListener("beforeunload", function() {

//     cfSettings.screenX = window.screenX 
//     cfSettings.screenY = window.screenY
    
//     cfdt.saveSettings(cfSettings, function() {
// 	cfdt.log("Settings saved")
//     })
// })



