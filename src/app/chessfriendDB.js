
// DBs
var path = require('path')
var cfdt = require(path.join(process.cwd(), '/app/chessfriendDevTools'))

var LinvoDB = require("linvodb3")

LinvoDB.defaults.store = { db: require("level-js") }
LinvoDB.dbPath = process.cwd() 
    

// Let's assume this dataset

var modelName = "Database";
var schema = { }; // Non-strict always, can be left empty
var options = { };
var Games = new LinvoDB(modelName, schema, options)

var live = Games.find({}).limit(20).live() 
var starred = Games.find({ starred: true}).live() 
var tagged = Games.find({ tags: {$exists: true} }).live()


var chessfriendDB = {
    DB : Games,
    live : live,
    starred : starred,
    userSelected : {},
    initialized : false,
    forceInitialization : false,
    last_view : {},
    DBCount : 0,
    MinId : parseInt("20000000000000", 16),
    sorting: "created",
    lastSearch : {}
}


module.exports = chessfriendDB
