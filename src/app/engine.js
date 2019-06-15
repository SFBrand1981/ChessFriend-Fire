// uci support
module.exports = function (window) {

    var path = require('path')
    var fs = require('fs')
    var Chess = require('chess.js').Chess

    var numEngineLines = localStorage.getItem('numEngineLines')

    const { fork } = require('child_process');
    var engine

    var engineInfo = {
	status : undefined, 
	position : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // FEN of initial position
	moves : {}
    }
    
    function createEngineControls(container) {

	var controlStart = document.createElement('div')
	controlStart.innerHTML = '<i class="fa">&#xf04b;</i>'
	controlStart.addEventListener("click", startEngine)
	controlStart.id = 'controlStart'


	var startTooltip = document.createElement('span')
	startTooltip.innerHTML = 'start engine'
	startTooltip.classList.add('tooltip')
	controlStart.appendChild(startTooltip)
	
	var controlStop = document.createElement('div')
	controlStop.innerHTML = '<i class="fa">&#xf04c;</i>'
	controlStop.addEventListener("click", stopEngine)
	controlStop.style.display = "none"
	controlStop.id = 'controlStop'

	var stopTooltip = document.createElement('span')
	stopTooltip.innerHTML = 'stop engine'
	stopTooltip.classList.add('tooltip')
	controlStop.appendChild(stopTooltip)

	var boardControlContainer = window.document.getElementById(
	    "boardControlContainer")
	
	boardControlContainer.appendChild(controlStart)
	boardControlContainer.appendChild(controlStop)

	var engineOut = document.createElement('div')
	engineOut.classList.add("engineOut")

	var engineStatusContainer = document.createElement('div')
	engineStatusContainer.classList.add("engineStatusContainer")

	var engineStatus = document.createElement('div')
	engineStatus.id = "engineStatus"
	engineStatus.classList.add("engineStatus")
	
	var engineDepth = document.createElement('div')
	engineDepth.id = "engineDepth"
	engineDepth.classList.add("engineDepth")

	var engineCurrmove = document.createElement('div')
	engineCurrmove.id = "engineCurrmove"
	engineCurrmove.classList.add("engineCurrmove")
	
	var engineLines = document.createElement('div')
	engineLines.classList.add("engineLines")
	
	for (var i = 0; i < numEngineLines; i++) {
	    
	    var engineLine = document.createElement('div')
	    engineLine.id = "engineLine" + (i+1).toString()
	    engineLine.classList.add("engineLine")

	    engineLine.addEventListener("click", function (evt) {
		insertEngineMove(this.id)
	    })

	    engineLines.appendChild(engineLine)
	}	

	engineStatusContainer.appendChild(engineStatus)
	engineStatusContainer.appendChild(engineDepth)
	engineStatusContainer.appendChild(engineCurrmove)
	
	engineOut.appendChild(engineStatusContainer)
	engineOut.appendChild(engineLines)
	
	container.appendChild(engineOut)
	
    }


    window.document.addEventListener("boardInitializedEvt", function(evt) {
	engineInfo.position = evt.detail['FEN']
    })
    

    function initEngine() {

	engineInfo.status = 'initialized'
	
	engine = fork(path.join(process.cwd(), '/app/uciWorker.js'))
	engine.send({ uci : 'init' })
	
	engine.on('message', (msg) => {
	    
	    if (msg.engineInfo.status) {
		
	    	var engineStatus = window.document.getElementById("engineStatus")
	    	engineStatus.innerHTML = "Engine: " + msg.engineInfo.status

		console.log(msg.engineInfo.status)

		if (msg.engineInfo.status == 'initialized') {
		    engine.send({ uci : 'start',
				  position : engineInfo.position })
		}
	    }

	    if (msg.engineInfo.depth) {
		
	    	var engineDepth = window.document.getElementById("engineDepth")
	    	var engineCurrmove = window.document.getElementById("engineCurrmove")
		
	    	engineDepth.innerHTML = "Depth: " + msg.engineInfo.depth
	    	engineCurrmove.innerHTML = "Current move: "
	    	    + figurine(uciToSan(msg.engineInfo.currmove, calcMvNr = false))
	    }

	    if (msg.engineInfo.eval) {
	    	var chess = new Chess(engineInfo.position)
	    	var numMoves = chess.moves().length
		var multipv = msg.engineInfo.multipv
		var pv = msg.engineInfo.pv

		engineInfo.moves["engineLine" + multipv] = pv
		
	    	var engineLine = window.document.getElementById("engineLine" + multipv)
	    	engineLine.style.display = "inline-block"
	    	engineLine.innerHTML = '<span class="engineEval">'
	    	    + msg.engineInfo.eval + '</span>'
	    	    + figurine(uciToSan(pv))

	    	if (numMoves < numEngineLines) {
	    	    for (var i = numMoves; i < numEngineLines; i++) {
	    		var unused = window.document.getElementById(
	    		    "engineLine" + (i+1).toString())
			
	    		unused.style.display = "none"
	    	    }
	    	}
	    }
	    
	})

    }

    
    function startEngine() {
	
	window.document.getElementById('controlStart').style.display = 'none'
	window.document.getElementById('controlStop').style.display = 'block'

	
	if (engineInfo.status != 'initialized') {
	    console.log("starting engine")
	    initEngine()
	} else {
	    engine.send({ uci : 'start',
			  position : engineInfo.position })
	}
    }

    
    function stopEngine() {
	window.document.getElementById('controlStart').style.display = 'block'
	window.document.getElementById('controlStop').style.display = 'none'
	engine.send({ uci : 'stop' })
    }

    
    function quitEngine() {

	if (engineInfo.status) {
	    engine.send({ uci : 'quit' })
	}
    }

    
    function updateEnginePosition(pos) {
	engineInfo.position = pos

	if (engineInfo.status) {
	    engine.send({ uci : 'updatePosition',
			  position : pos })
	}
    }


    function parseFEN(fen) {
	
	var a = fen.split(/\s/)
	var obj = {}
	try {
	    obj['position'] = a[0]
	    obj['sideToMove'] = a[1]
	    obj['castling'] = a[2]
	    obj['enPassant'] = a[3]
	    obj['halfmoveClock'] = parseInt(a[4])
	    obj['moveNr'] = parseInt(a[5])
	    
	    return obj
	} catch {
	    console.error('Invalid FEN: ' + fen)
	    return 1
	}
    }


    function uciToSan(u, calcMvNr = true) {
	
	var chess = new Chess(engineInfo.position);
	var uci_moves = u.split(" ");
	var san = "";
	
	for (var i = 0; i < uci_moves.length; i++) {
            var f = uci_moves[i][0]+uci_moves[i][1]
            var t = uci_moves[i][2]+uci_moves[i][3]
	    var p = uci_moves[i][4]
	    
	    var parsedFEN = parseFEN(chess.fen())
	    var mvNr
	    if (calcMvNr) {
		if (i === 0) {
		    if (parsedFEN['sideToMove'] === 'w') {
			mvNr = parsedFEN['moveNr'] + '. '
		    } else {
			mvNr = parsedFEN['moveNr'] + '. ... '
		    }
		} else {
		    if (parsedFEN['sideToMove'] === 'w') {
			mvNr = parsedFEN['moveNr'] + '. '
		    } else {
			mvNr = ''
		    }
		}
	    } else {
		mvNr = ''
	    }
	    
            var c = (p === undefined) ?
		chess.move({from: f, to: t}) :
		chess.move({from: f, to: t, promotion: p})
	    
            if (c != null) {
		san += mvNr + c['san']+" "
            }
	    
	}
	
	return san
    }


    function figurine(s) {
	var r = s;
	// r = r.replace(/K/g, "&#9812;");
	// r = r.replace(/Q/g, "&#9813;");
	// r = r.replace(/R/g, "&#9814;");
	// r = r.replace(/B/g, "&#9815;");
	// r = r.replace(/N/g, "&#9816;");


	if (true) {
	    r = r.replace(/K/g, '<span class="figurine">n</span>');
	    r = r.replace(/Q/g, '<span class="figurine">m</span>');
	    r = r.replace(/R/g, '<span class="figurine">l</span>');
	    r = r.replace(/B/g, '<span class="figurine">j</span>');
	    r = r.replace(/N/g, '<span class="figurine">k</span>');
	} else {
	    r = r.replace(/<span class="figurine">n<\/span>/g, 'K');
	    r = r.replace(/<span class="figurine">m<\/span>/g, 'Q');
	    r = r.replace(/<span class="figurine">l<\/span>/g, 'R');
	    r = r.replace(/<span class="figurine">j<\/span>/g, 'B');
	    r = r.replace(/<span class="figurine">k<\/span>/g, 'N');
	}
	    
	return r;
    }
    

    function insertEngineMove(engineLineId) {
	var move = engineInfo.moves[engineLineId].split(' ')[0]
	var insertEngineMoveEvent = new CustomEvent("insertEngineMoveEvt", {
	    detail: { move : move }
	})
	window.document.dispatchEvent(insertEngineMoveEvent)
    }


    window.document.addEventListener("insertFirstEngineMoveEvt", function (evt) {
	insertEngineMove('engineLine1')
    })

    
    // Module exports
    module.createEngineControls = createEngineControls
    module.initEngine = initEngine
    module.quitEngine = quitEngine
    module.updateEnginePosition = updateEnginePosition
    
    return module
}
