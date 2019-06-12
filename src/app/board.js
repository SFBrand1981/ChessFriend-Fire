// chess board object
module.exports = function () {

    var Chess = require('chess.js').Chess
    
    var board = {
	flipped : false,
	hlSquares : [], // e.g. ['e4', 'c5']
	FEN : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
	curNodeIndx : '(0)',
	nodes : {},
	id : undefined
    }


    function copyBoard(board) {
	var newBoard = {}
	newBoard['flipped'] = board['flipped']
	newBoard['hlSquares'] = board['hlSquares']
	newBoard['FEN'] = board['FEN']
	newBoard['curNodeIndx'] = board['curNodeIndx']
	newBoard['nodes'] = board['nodes']
	newBoard['id'] = board['id']
	newBoard['gameInfo'] = board['gameInfo']
	return newBoard
    }

    module.board = board
    module.copyBoard = copyBoard
    
    return module
}
