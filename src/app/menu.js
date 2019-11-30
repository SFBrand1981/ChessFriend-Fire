
module.exports = function (window) {

    module.menues = {}

    function promoteVariation() {
        
        var promoteVariationEvent = new CustomEvent("promoteVariation", {
        })
        window.document.dispatchEvent(promoteVariationEvent)
    }

    
    function stripVariation() {
        
        var stripVariationEvent = new CustomEvent("stripVariation", {
        })
        window.document.dispatchEvent(stripVariationEvent)
    }

    
    function copyFEN() {
        
        var copyFENEvent = new CustomEvent("copyFEN", {
        })
        window.document.dispatchEvent(copyFENEvent)
    }

    
    function NAGHandler(nag) {
        
        var insertNAGEvent = new CustomEvent("insertNAG", {
            detail: nag
        })
        window.document.dispatchEvent(insertNAGEvent)
    }


    function insertNullMove() {
        
        var insertNullMoveEvent = new CustomEvent("insertNullMove", {
        })
        window.document.dispatchEvent(insertNullMoveEvent)
    }


    function undoEdit() {
        
        var undoEditEvent = new CustomEvent("undoEdit", {
        })
        window.document.dispatchEvent(undoEditEvent)
    }


    function redoEdit() {
        
        var redoEditEvent = new CustomEvent("redoEdit", {
        })
        window.document.dispatchEvent(redoEditEvent)
    }
    

    function insertComment(commentType) {
        
        var insertCommentEvent = new CustomEvent("insertComment", {
            detail: commentType
        })
        window.document.dispatchEvent(insertCommentEvent)
    }


    function duplicateGame(commentType) {
        
        var duplicateGameEvent = new CustomEvent("duplicateGame", {
            detail: commentType
        })
        window.document.dispatchEvent(duplicateGameEvent)
    }


    function deleteGame(commentType) {
        
        var deleteGameEvent = new CustomEvent("deleteGame", {
            detail: commentType
        })
        window.document.dispatchEvent(deleteGameEvent)
    }


    function searchPosition(commentType) {
        
        var searchPositionEvent = new CustomEvent("searchPosition", {
            detail: commentType
        })
        window.document.dispatchEvent(searchPositionEvent)
    }


    function exportToPGN(filename) {
        
        var exportToPGNEvent = new CustomEvent("exportToPGN", {
            detail: filename
        })
        window.document.dispatchEvent(exportToPGNEvent)
    }
    
    
    // menu
    module.createContextMenu = function(container) {


        var contextMenu = module.menues.contextMenu
        var menu = contextMenu.menu

        // Hooks for the "contextmenu" event
        container.addEventListener('contextmenu', function(ev) {
            // Prevent to showing default context menu event
            //ev.preventDefault();
            // display Popup the native context menu at place you clicked
            menu.popup(ev.x, ev.y)  
        })

        if (contextMenu.initialized) {
            return
        } 

        contextMenu.initialized = true
        
        // Add menu items with label in this menu
        menu.append(new nw.MenuItem({
            label: 'Promote variation',
            click: function(){
                promoteVariation()
            }
        }))
    
        
        menu.append(new nw.MenuItem({
            label: 'Strip variation to end',
            click: function(){
                stripVariation()
            }
        }))


        menu.append(new nw.MenuItem({
            label: 'Copy FEN',
            click: function(){
                copyFEN()
            }
        }))
        
        menu.append(new nw.MenuItem({ type: 'separator' }))

        var submenu = new nw.Menu();
        submenu.append(new nw.MenuItem({ label: '[None]', click: function(){NAGHandler('')} }))
        submenu.append(new nw.MenuItem({ label: '!', click: function(){NAGHandler('$1')} }))
        submenu.append(new nw.MenuItem({ label: '?', click: function(){NAGHandler('$2')} }))
        submenu.append(new nw.MenuItem({ label: '!?', click: function(){NAGHandler('$5')} }))
        submenu.append(new nw.MenuItem({ label: '?!', click: function(){NAGHandler('$6')} }))
        submenu.append(new nw.MenuItem({ label: '!!', click: function(){NAGHandler('$3')} }))
        submenu.append(new nw.MenuItem({ label: '??', click: function(){NAGHandler('$4')} }))
        submenu.append(new nw.MenuItem({ label: '+/=', click: function(){NAGHandler('$14')} }))
        submenu.append(new nw.MenuItem({ label: '=/+', click: function(){NAGHandler('$15')} }))
        submenu.append(new nw.MenuItem({ label: '+-', click: function(){NAGHandler('$18')} }))
        submenu.append(new nw.MenuItem({ label: '-+', click: function(){NAGHandler('$19')} }))
        submenu.append(new nw.MenuItem({ label: '∞', click: function(){NAGHandler('$13')} }))
        submenu.append(new nw.MenuItem({ label: '=', click: function(){NAGHandler('$11')} }))


        menu.append(new nw.MenuItem({
            label: 'Insert NAG',
            submenu: submenu
        }))

        menu.append(new nw.MenuItem({
            label: 'Insert null move',
            click: function(){
                insertNullMove()
            }
        }))

        // startComment disabled at the moment.
        // Reason: Cannot parse:
        // 1. d4 {comment after 1.d4} {startComment before 1...d5} 1...d5
        //
        // menu.append(new nw.MenuItem({
        //     label: 'Comment before move',
        //     click: function(){
        //         insertComment('startComment')
        //     }
        // }))
        
        menu.append(new nw.MenuItem({
            label: 'Comment',
            click: function(){
                insertComment('comment')
            }
        }))

        menu.append(new nw.MenuItem({ type: 'separator' }))


        menu.append(new nw.MenuItem({
            label: 'Duplicate game',
            click: function(){
                duplicateGame()
            }
        }))
        
        menu.append(new nw.MenuItem({
            label: 'Delete game',
            click: function(){
                deleteGame()
            }
        }))
        
        menu.append(new nw.MenuItem({
            label: 'Search position',
            click: function(){
                searchPosition()
            }
        }))

        menu.append(new nw.MenuItem({ type: 'separator' }))


        menu.append(new nw.MenuItem({
            label: 'Undo edit',
            click: function(){
                undoEdit()
            }
        }))

        menu.append(new nw.MenuItem({
            label: 'Redo edit',
            click: function(){
                redoEdit()
            }
        }))
        

        menu.append(new nw.MenuItem({ type: 'separator' }))
        
    //     menu.append(new nw.MenuItem({
    //         label: 'Export to LaTeX',
    //         click: function(){

    //          var exportDialog = document.createElement('input')
    //          exportDialog.style.display = 'none'
    //          exportDialog.type = 'file'
    //          exportDialog.id = 'exportDialog'
    //          exportDialog.accept = '.tex'
    //          exportDialog.nwsaveas = "ChessFriend-Fire_Export.tex"
    //          window.document.body.appendChild(exportDialog)
    //          exportDialog.click()
    //          exportDialog.addEventListener("change", function (evt) {
    //              boardState.exportGameAsTex(this.value)
    //          })
                
    //         }
    //     }))

        menu.append(new nw.MenuItem({
            label: 'Export to PGN',
            click: function(){
                
                var exportDialog = document.createElement('input')
                exportDialog.style.display = 'none'
                exportDialog.type = 'file'
                exportDialog.id = 'exportDialog'
                exportDialog.accept = '.pgn'
                exportDialog.nwsaveas = "ChessFriend-Fire_Export.pgn"
                window.document.body.appendChild(exportDialog)
                exportDialog.click()
                exportDialog.addEventListener("change", function (evt) {
                    exportToPGN(this.value)
                })
                
            }
        }))
        
        
        

    }

    
    return module

}
