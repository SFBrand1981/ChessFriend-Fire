// run tests
var path = require('path')

var guiHandler = require(path.join(process.cwd(), '/js/gui.js'))
var gui = new guiHandler()


var errCount = {}

function testDrawParagraph() {


    console.log("Dies ist ein TEST")
    
}


function runTests() {
    
    testDrawParagraph()
    
    console.log("TEST COMPLETED")
    console.log("Errors:")
    console.log(errCount)
    
}

runTests()

