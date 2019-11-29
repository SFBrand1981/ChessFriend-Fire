// resize
module.exports = function (window) {

    var isResizing = false,
	lastDownX = 0;


    // custom event handler
    var sidebarResizedEvent = new CustomEvent("sidebarResized", {
	detail: {},
	bubbles: false,
	cancelable: true
    })
    

    module.makeResizable = function(container, left, right, handle) {

	handle.onmousedown = function(e) {
            isResizing = true
            lastDownX = e.clientX
	};

	
	window.document.addEventListener('mousemove', function(e) {
            // we don't want to do anything if we aren't resizing.
            if (!isResizing) {
		return
            }
	    
            var offsetRight = container.clientWidth - (e.clientX - container.offsetLeft);
	    var ratio = offsetRight/window.outerWidth
            
	    if (ratio <= 0.9 && ratio >= 0.5) {
	
                left.style.right = offsetRight + "px"
                right.style.width = offsetRight + "px"        
	        e.currentTarget.dispatchEvent(sidebarResizedEvent)

                // save sidebar width
		localStorage.setItem('sidebarRatio', offsetRight/window.outerWidth)
	    }
	    
	}, false)

	
	window.document.addEventListener('mouseup', function(e) {
            // stop resizing
            isResizing = false
	}, false)


	window.addEventListener('resize', function(e) {
                
            // keep sidebar proportions on resize
	    var ratio = parseFloat(localStorage.getItem('sidebarRatio'))
	    module.restoreSidebar(left, right, ratio)
            window.document.dispatchEvent(sidebarResizedEvent)
            
	}, false);

    
    };


    module.restoreSidebar = function(left, right, ratio) {
	var offsetRight = ratio*window.outerWidth
	left.style.right =  offsetRight + "px"
	right.style.width =  offsetRight + "px"	
    }

   
    
    return module
}
