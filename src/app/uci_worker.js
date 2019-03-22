// uci support
var fs = require('fs')
var readline = require('readline');
var path = require('path')
var cfdt = require(path.join(process.cwd(), '/app/chessfriendDevTools'))


const { spawn } = require('child_process')


// init engine and its interface
var filePath = path.join(process.cwd(), "engineParams")
var engineParams = JSON.parse(fs.readFileSync(filePath, 'utf8'))


var engineInfo = {
    status : undefined,
    targetStatus : undefined,
    position : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    targetPosition : undefined,
    multiPV : parseInt(engineParams['multiPV']),
    threads : parseInt(engineParams['numThreads'])
}


const engine = spawn(path.resolve(engineParams['enginePath']))
//cfdt.log(`Spawned engine pid: ${engine.pid}`)


var rl = readline.createInterface({
    input: engine.stdout,
    output: process.stdout,
    terminal: false
})


engine.on('close', function(code, signal) {
    //cfdt.log(`Engine ${engine.pid} exited with code ${code} and signal ${signal}`)
})

rl.on('line', function(line) {

    
    switch(line) {
    case 'uciok':
	engineInfo.status = "initialized"
	process.send({ engineInfo : { status : "initialized" }})
	// engine is ready in uci mode, set options
	uciCmd('setoption name MultiPV value ' + engineInfo.multiPV)
	uciCmd('setoption name Threads value ' + engineInfo.threads)
	uciCmd('ucinewgame')
	uciCmd('isready')
	break
    case 'readyok':
	engineInfo.status = 'readyok'
	process.send({ engineInfo : { status : "readyok" }})

	if (engineInfo.targetStatus === 'analyzing') {
	    startEngine(engineInfo.targetPosition)
	}
	
	break
    default:
	// parse engine info
	// engine search depth
	
        if(match = line.match(/^info .*\bdepth (\d+) .*\bcurrmove (\w+)/)) {
	    process.send({ engineInfo : { depth : match[1], currmove : match[2] }})
        }

        // Is it sending feedback with a score?
        if(match = line.match(/^info .*\bmultipv (\d+) .*\bscore (\w+) (-?\d+) .*\bpv (.*)/)) {
	    var score = parseInt(match[3])
	    var eval
	    
	    // Is it measuring in centipawns?
	    if(match[2] == 'cp') {
		var sign = (engineInfo.position.split(/\s/)[1] === 'w') ? 1 : -1
                eval = (sign * score / 100.0).toFixed(2)
                // Did it find a mate?
	    } else if(match[2] == 'mate') {
                eval = 'Mate in ' + Math.abs(score)
	    }
	    
	    // Is the score bounded?
	    if(bounds = line.match(/\b(upper|lower)bound\b/)) {
		eval = (bounds[1] == 'upper' ? '<= ' : '>=') + eval
	    }

	    process.send({ engineInfo : { eval : eval, multipv : match[1], pv: match[4] }})
        }
	
    }
    
})


    
function cleanExit() {
    engine.stdin.write('quit')
    engine.stdin.end()
}


function uciCmd(cmd) {
    engine.stdin.write(cmd + '\n')
}


function initEngine() {
    engineInfo.targetStatus = 'readyok'
    uciCmd('uci')
}


function stopEngine() {
    engineInfo.targetStatus = 'readyok'
    uciCmd('stop')
    uciCmd('isready')
}


function startEngine(position) {

    engineInfo.targetStatus = 'analyzing'
    engineInfo.targetPosition = position

    
    switch(engineInfo.status) {
    case undefined:
	initEngine()
	break
	
    case 'readyok':

	if (engineInfo.position !== engineInfo.targetPosition) {
	    uciCmd('position fen ' + engineInfo.targetPosition)
	    engineInfo.position = engineInfo.targetPosition
	}
	uciCmd('go infinite')
	engineInfo.status = 'analyzing'
	process.send({ engineInfo : { status : "analyzing" }})
	break
	
    case 'analyzing':
	if (engineInfo.position  === engineInfo.targetPosition) {
	    // continue analyzing
	} else {
	    // abort calculation and start new one
	    uciCmd('stop')
	    uciCmd('ucinewgame')
	    uciCmd('isready')
	}
	
	break
    default:
	//
    }
}


function updatePosition(position) {
    if (engineInfo.status === 'analyzing') {
	startEngine(position)
    }
}


process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill


process.on('message', (msg) => {
    
    if (msg.uci === 'quit') {
	cleanExit()
    } else if (msg.uci === 'start') {
	startEngine(msg.position)
    } else if (msg.uci === 'stop') {
	stopEngine()
    } else if (msg.uci === 'init') {
	initEngine()
    } else if (msg.uci === 'updatePosition') {
	updatePosition(msg.position)
    } else {
	cfdt.log('Message from parent:', msg);
    }
})

// let counter = 0;

// var myInt = setInterval(() => {
//   process.send({ counter: counter++ });
// }, 1000);


