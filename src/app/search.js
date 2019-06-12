// uci support
module.exports = function (window) {

    var path = require('path')
    var BoardStateHandler = require(path.join(process.cwd(), '/app/boardState.js'))
    var DBHandler = require(path.join(process.cwd(), '/app/db.js'))

    var bh = new BoardStateHandler(window)
    var db = new DBHandler(window)
    
    var selectedPiece 
    var selectedAction 
    
    function createSearchControls() {

	var controlClear = document.createElement('div')
	controlClear.innerHTML = '<i class="fa">&#xf12d;</i>'
	controlClear.addEventListener("click", clearBoard)
	controlClear.id = 'controlClear'

	var boardControlContainer = window.document.getElementById("boardControlContainer")
	boardControlContainer.appendChild(controlClear)

	var gameBoard = window.document.querySelector(".game-board")
	gameBoard.classList.add('searchBoard')


	var searchSelected = window.document.getElementById("searchSelected")
	var addNewSelected = window.document.getElementById("addNewSelected")
	var searchSelectedLabel = window.document.getElementById("searchSelectedLabel")
	var addNewSelectedLabel = window.document.getElementById("addNewSelectedLabel")


	selectedAction = 'search'
	searchSelected.innerHTML = "&#xf192;"
	addNewSelected.innerHTML = "&#xf10c;"
	searchSelected.parentNode.parentNode.classList.add("actionSelected")

	function selectSearch() {
	    if (!(searchSelected.classList.contains("actionSelected"))) {
		searchSelected.innerHTML = "&#xf192;"
		addNewSelected.innerHTML = "&#xf10c;"
		searchSelected.parentNode.parentNode.classList.add("actionSelected")
		addNewSelected.parentNode.parentNode.classList.remove("actionSelected")
		selectedAction = 'search'
	    }
	}

	function selectAddNew() {
	    if (!(addNewSelected.classList.contains("actionSelected"))) {
		searchSelected.innerHTML = "&#xf10c;"
		addNewSelected.innerHTML = "&#xf192;"
		searchSelected.parentNode.parentNode.classList.remove("actionSelected")
		addNewSelected.parentNode.parentNode.classList.add("actionSelected")
		selectedAction = 'addNew'
	    }
	}
	
	searchSelected.addEventListener('click', function (evt) {
	    selectSearch()
	})
	
	addNewSelected.addEventListener('click', function (evt) {
	    selectAddNew()
	})

	searchSelectedLabel.addEventListener('click', function (evt) {
	    selectSearch()
	})
	
	addNewSelectedLabel.parentNode.addEventListener('click', function (evt) {
	    selectAddNew()
	})

	
	
	var searchBtn = document.createElement('div')
	searchBtn.classList.add('btn')
	searchBtn.tabIndex = 0;
	searchBtn.innerHTML = 'Ok'

	var searchBtnContainer = window.document.querySelector(".searchBtnContainer")
	searchBtnContainer.appendChild(searchBtn)
	
	searchBtn.addEventListener('click', function (evt) {

	    var fen = bh.getFEN()
	    var pos = fen.split(' ')[0]
	    var mvNr = window.document.getElementById('mvNr_inp').value
	    var stm = window.document.getElementById('stm_inp').value


	    if (selectedAction == 'search') {

		// search position
		bh.validateFEN(fen, stm, mvNr).then(function(valid) {
		    return db.getSearchCount({positions: pos})
		}).then(function(count) {
		    console.log(count)

		    if (count > 0) {
			var searchParams = {
			    pageNum: 0,
			    orderBy: 'id',
			    searching: true,
			    FEN: fen,
			    container: 'visible'
			}
			localStorage.setItem('searchParams', JSON.stringify(searchParams))
			window.open('/views/main.html', '_self')
			
		    } else {
			alert("No games have been found")
		    }
		    
		}).catch(function(e) {
		    alert(e.error)
		})

	    } else {

		// add new game
		bh.validateFEN(fen, stm, mvNr).then(function(valid) {

		    var gameInfo = {}		
		    gameInfo.star = 0
		    gameInfo.white = '{White}'
		    gameInfo.elow = ''
		    gameInfo.black = '{Black}'
		    gameInfo.elob = ''
		    gameInfo.res = '4' // res_enum
		    gameInfo.event = '{Event}'
		    gameInfo.site = '{Site}'
		    gameInfo.round = '{Round}'
		    gameInfo.date = ''
		    gameInfo.tags = []
		    
		    var nodes = {}
		    nodes['(0)'] = {}
		    nodes['(0)']['FEN'] = valid.FEN
		    nodes['(0)']['branchLevel'] = 0
		    nodes['(0)']['children'] = []
		    
		    
		    // save to DB
		    db.addGame(gameInfo, nodes).then( (id) => {

			var game_id = id.toString()
			var title = gameInfo.white + ' - ' + gameInfo.black
			
			var loadEntryEvt = new CustomEvent("loadEntryEvt", {
			    detail : { game_id : game_id,
				       title: title }
			})
			window.document.dispatchEvent(loadEntryEvt)
			
		    }).catch(function(e) {
			alert(e.error)
		    })
		})

	    }
	})	
	
    }
    

    function clearBoard() {
	bh.eraseAndUpdateBoard()
    }

    
    function overwriteClickBoard() {

	bh.removeClickEventListener()
	
	var x = window.document.getElementsByClassName("innerSquare")
	for (var i = 0; i < x.length; i++) {
	    x[i].addEventListener("click", function(evt) {
		//var coord = bh.getCoordFromSq(this.id, bh)
		bh.putPieceToSqAndUpdateBoard(selectedPiece, this.id)
	    })
	}
	
    }


    function createSelectablePieces(container) {

	var pieceContainer = window.document.createElement("div")
	pieceContainer.classList.add("pieceContainer")
	container.appendChild(pieceContainer)

	var wp = window.document.createElement("img")
	wp.classList.add("pieces")
	wp.id = "P"
	wp.src = '../assets/pieces/wp.svg'
	pieceContainer.appendChild(wp)

	var bp = window.document.createElement("img")
	bp.classList.add("pieces")
	bp.id = "p"
	bp.src = '../assets/pieces/bp.svg'
	pieceContainer.appendChild(bp)

	var wn = window.document.createElement("img")
	wn.classList.add("pieces")
	wn.id = "N"
	wn.src = '../assets/pieces/wn.svg'
	pieceContainer.appendChild(wn)

	var bn = window.document.createElement("img")
	bn.classList.add("pieces")
	bn.id = "n"
	bn.src = '../assets/pieces/bn.svg'
	pieceContainer.appendChild(bn)

	var wb = window.document.createElement("img")
	wb.classList.add("pieces")
	wb.id = "B"
	wb.src = '../assets/pieces/wb.svg'
	pieceContainer.appendChild(wb)

	var bb = window.document.createElement("img")
	bb.classList.add("pieces")
	bb.id = "b"
	bb.src = '../assets/pieces/bb.svg'
	pieceContainer.appendChild(bb)

	var wr = window.document.createElement("img")
	wr.classList.add("pieces")
	wr.id = "R"
	wr.src = '../assets/pieces/wr.svg'
	pieceContainer.appendChild(wr)

	var br = window.document.createElement("img")
	br.classList.add("pieces")
	br.id = "r"
	br.src = '../assets/pieces/br.svg'
	pieceContainer.appendChild(br)

	var wq = window.document.createElement("img")
	wq.classList.add("pieces")
	wq.id = "Q"
	wq.src = '../assets/pieces/wq.svg'
	pieceContainer.appendChild(wq)

	var bq = window.document.createElement("img")
	bq.classList.add("pieces")
	bq.id = "q"
	bq.src = '../assets/pieces/bq.svg'
	pieceContainer.appendChild(bq)

	var wk = window.document.createElement("img")
	wk.classList.add("pieces")
	wk.id = "K"
	wk.src = '../assets/pieces/wk.svg'
	pieceContainer.appendChild(wk)

	var bk = window.document.createElement("img")
	bk.classList.add("pieces")
	bk.id = "k"
	bk.src = '../assets/pieces/bk.svg'
	pieceContainer.appendChild(bk)
	
	var empty_square = window.document.createElement("div")
	empty_square.classList.add("pieces", "empty-square")
	empty_square.id = "0"
	//pieceContainer.appendChild(empty_square)

	
	var pieces = window.document.getElementsByClassName("pieces")
	
	for (var i = 0; i < pieces.length; i++) {
       	    pieces[i].addEventListener("click", function(evt) {

		
       		if (this.classList.contains("selected")) {
       		    this.classList.remove("selected")
		    selectedPiece = undefined
       		} else {
       		    var selectedPieces = window.document.getElementsByClassName("selected")
       		    while (selectedPieces.length > 0) {
       			selectedPieces[0].classList.remove("selected")
      		    }
       		    this.classList.add("selected")
		    selectedPiece = this.id
       		}


		container.classList.remove("bp_cursor")
		container.classList.remove("bn_cursor")
		container.classList.remove("bb_cursor")
		container.classList.remove("br_cursor")
		container.classList.remove("bq_cursor")
		container.classList.remove("bk_cursor")
		container.classList.remove("wp_cursor")
		container.classList.remove("wn_cursor")
		container.classList.remove("wb_cursor")
		container.classList.remove("wr_cursor")
		container.classList.remove("wq_cursor")
		container.classList.remove("wk_cursor")

		
		switch (selectedPiece) {
		case 'p':
		    container.classList.add("bp_cursor")
		    break
		case 'n':
		    container.classList.add("bn_cursor")
		    break
		case 'b':
		    container.classList.add("bb_cursor")
		    break
		case 'r':
		    container.classList.add("br_cursor")
		    break
		case 'q':
		    container.classList.add("bq_cursor")
		    break
		case 'k':
		    container.classList.add("bk_cursor")
		    break
		case 'P':
		    container.classList.add("wp_cursor")
		    break
		case 'N':
		    container.classList.add("wn_cursor")
		    break
		case 'B':
		    container.classList.add("wb_cursor")
		    break
		case 'R':
		    container.classList.add("wr_cursor")
		    break
		case 'Q':
		    container.classList.add("wq_cursor")
		    break
		case 'K':
		    container.classList.add("wk_cursor")
		    break
		}
		
		console.log("selected piece: " + selectedPiece)
	    })
	}
    }

    
    // Module exports
    module.createSearchControls = createSearchControls
    module.overwriteClickBoard = overwriteClickBoard
    module.createSelectablePieces = createSelectablePieces
    
    return module
}
