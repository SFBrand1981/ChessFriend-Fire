// main controller
module.exports = function (window) {

    var path = require('path')

    var DnDHandler = require(path.join(process.cwd(), '/app/dragNdrop.js'))
    var dnd = new DnDHandler()

    
    module.guiElements = { draggableSidebarItems: [] }


    function makeSidebarItemClickable(element) {
        
        var sidebarItemClickedEvent = new CustomEvent("staticSidebarItemClicked", {
            detail: element.id
        })
        
        element.addEventListener('click', evt => {
            window.document.dispatchEvent(sidebarItemClickedEvent)
        })
    }
    

    module.drawSidebarItem = function({container: container,
                                       id: id,
                                       title: title,
                                       statusIndicator: statusIndicator,
                                       draggable: draggable,
                                       callbackOnClick: callbackOnClick}) {


        var li = document.createElement('li')
        li.classList.add('sidebarItem')
            
        var liContainer = document.createElement('div')
        liContainer.classList.add('sidebarItem__container')
        
        var liText = document.createElement('div')
        liText.classList.add('sidebarItem__text')
        liText.innerHTML = title

        // id
        if (id) {
            liText.id = id
            li.id = "sidebarItem" + id
        }

        
        // status indicator
        if (statusIndicator) {
            liText.insertAdjacentHTML("afterbegin", statusIndicator)
        }
        
        // icon to remove the item from the sidebar
        var liIcon = document.createElement('div')
        liIcon.classList.add('sidebarItem__icon')

        
        // make drag 'n dropable
        if (draggable) {
            li.setAttribute('draggable', 'true')
            liIcon.innerHTML = '<i class="fa">&#xf057;</i>'
            dnd.addDnDHandlers(li)
        }
        
        li.appendChild(liContainer)
        liContainer.appendChild(liText)
        liContainer.appendChild(liIcon) 

        // add item to sidebar
        if (draggable) {
            container.insertBefore(li, container.lastChild)            
        } else {
            container.appendChild(li)
        }


        
        // event listeners
        if (!draggable) {
            makeSidebarItemClickable(liText)
        }

        if (callbackOnClick) {
            liText.addEventListener("click", evt => {
                callbackOnClick(id)
            })
        }

    }


    module.reorderDraggableSidebarItems = function() {

        var parent = window.document.querySelector("#sidebar__draggableItems")
        var children = parent.childNodes
        
        var sortOrder = []
        var toRemove = []
        
        for (let i = 0, len = children.length; i < len; i++) {
            let text = children[i].querySelector(".sidebarItem__text")
            let icon = children[i].querySelector(".sidebarItem__icon")
            
            if (text) {
                sortOrder.push(text.id)
            }

            // meta tags
            if (!icon && !text && !children[i].classList.contains("dummy")) {
                toRemove.push(children[i])
            }
        }

        for (let i = 0, len = toRemove.length; i < len; i++) {
            console.log("remove element", toRemove[i])
            parent.removeChild(toRemove[i])
        }

        module.guiElements.draggableSidebarItems.sort(function(a,b) {
            var sort = sortOrder.indexOf(a.id.toString()) - sortOrder.indexOf(b.id.toString())
            return sort
        })
        console.log("draggableSidebarItems sorted", module.guiElements.draggableSidebarItems)
        localStorage.setItem('draggableSidebarItems', JSON.stringify(module.guiElements.draggableSidebarItems))

    }

    
    module.getDraggableSidebarItemIndx = function(id) {

        var sdbi = module.guiElements.draggableSidebarItems
        var sdbi_indx = -1
        
        for (var i = 0, len = sdbi.length; i < len; i++) {
            if (sdbi[i].id == id) {
                sdbi_indx = i
                break
            }
        }
        
        return sdbi_indx
    }


    module.addToDraggableSidebarItems = function(id, title) {

        var sdbi = module.guiElements.draggableSidebarItems
        sdbi.push({id: id, title: title})
        localStorage.setItem('draggableSidebarItems', JSON.stringify(sdbi))
        console.log("added sidebarItem", id,
                    "to draggableSidebarItems", sdbi)
   
    }

    
    module.removeSidebarItem = function(id) {

        var elem = window.document.getElementById("sidebarItem" + id)
        elem.parentNode.removeChild(elem)
        
        var sdbi = module.guiElements.draggableSidebarItems
        var sdbi_indx = module.getDraggableSidebarItemIndx(id)
        
        if (sdbi_indx != -1) {
            sdbi.splice(sdbi_indx, 1)
            localStorage.setItem('draggableSidebarItems', JSON.stringify(sdbi))
            console.log("removed sidebarItem", id,
                        "from draggableSidebarItems", sdbi)
        }

    }


    module.updateDraggableSidebarItem = function (gameInfo) {


        var id = gameInfo.id
        var title = gameInfo.white + " - " + gameInfo.black
        
        var sdbi = module.guiElements.draggableSidebarItems
        var sdbi_indx = module.getDraggableSidebarItemIndx(id)
        var elem = window.document.getElementById(id)
        
        if (sdbi_indx != -1) {
            sdbi.splice(sdbi_indx, 1, {id: id, title: title})
            elem.innerHTML = title
            localStorage.setItem('draggableSidebarItems', JSON.stringify(sdbi))
            console.log("updated sidebarItem", id,
                        "of draggableSidebarItems", sdbi)
        }
        
    }
    
    
    module.drawSidebarSeparator = function(container) {

        var li = document.createElement('li')
        var div = document.createElement('div')

        div.innerHTML = '<i class="fa">&#xf08d;</i> pinned games:'
        li.appendChild(div)
        
        li.classList.add('sidebarSeparator')
        container.appendChild(li)
        
    }


    module.drawDummySidebarItem = function(container) {
        
        var dummy = document.createElement('li')
        dummy.classList.add('sidebarItem', 'dummy')
        container.appendChild(dummy)
        dnd.addDnDHandlers(dummy)
    }
    
    
    module.drawParagraph = function(container, text) {
        var div = document.createElement('div')
        div.innerHTML = text
        container.appendChild(div)
    }


    module.drawColorPicker = function(container, color) {

        var div = document.createElement('div')
        
        var inp = document.createElement('input')
        inp.type = "color"
        inp.name = "base0"
        inp.value = "#e66465"

        var label = document.createElement('label')
        label.innerHTML = "Label"
        
        
        
        var btn = document.createElement('button')
        btn.innerHTML = "confirm"
        
        div.appendChild(inp)
        div.appendChild(label)
        div.appendChild(btn)
        container.appendChild(div)
        
    }


    module.maximizeSplitContainerLeftPane = function(leftPane, rightPane) {

        leftPane.style.width = "100%"

        rightPane.style.display = "none"
        leftPane.style.display = "block"
        
    }


    module.maximizeSplitContainerRightPane = function(leftPane, rightPane) {

        rightPane.style.width = "100%"

        rightPane.style.display = "block"
        leftPane.style.display = "none"
        
    }

    
    module.restoreSplitContainer = function(leftPane, rightPane, callback) {
                
        rightPane.style.width = "62%"
        leftPane.style.width = "38%"

        rightPane.style.display = "block"
        leftPane.style.display = "flex"

    }


    module.drawModal = function({container: container,
                                 text: text,
                                 callback: callback}) {
        
        var modal = document.createElement('div')
        modal.classList.add('modal')
        
        var modalContent = document.createElement('div')
        modalContent.classList.add('modal-content')

        var modalText = document.createElement('div')
        modalText.classList.add('modal-text')
        modalText.innerHTML = text

        var modalButtons = document.createElement('div')
        modalButtons.classList.add('modal-buttons')

        var modalAbort = document.createElement('div')
        modalAbort.innerHTML = 'Cancel'

        var modalConfirm = document.createElement('div')
        modalConfirm.innerHTML = 'Ok'
        
        if (callback) {
            modalConfirm.addEventListener('click', evt => {
                callback()
            })
        }


        modalAbort.addEventListener('click', evt => {
            modal.parentNode. removeChild(modal)
        })
        
        modalButtons.appendChild(modalAbort)
        modalButtons.appendChild(modalConfirm)
        modalContent.appendChild(modalText)
        modalContent.appendChild(modalButtons)
        modal.appendChild(modalContent)
        
        container.appendChild(modal)


    }


    module.drawFileImport = function({container: container,
                                      filetype: filetype,
                                      callback: callback}) {
        
        var input = document.createElement('input')
        input.style.display = 'none'
        input.type = 'file'
        input.accept = filetype
        

        container.appendChild(input)
        input.click()

        input.addEventListener("change", function (evt) {
            callback(this.value)
        })


    }
    

    module.cleanup = function(container) {
        while (container.lastChild) {
            container.removeChild(container.lastChild)
        }
    }

    
    return module
}
