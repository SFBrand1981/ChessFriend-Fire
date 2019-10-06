// drag and drop
module.exports = function () {

    var dragSrcEl = null;
    
    function handleDragStart(e) {
	// Target (this) element is the source node.
	dragSrcEl = this;
	
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/html', this.outerHTML);
	
	this.classList.add('dragElem');
    }
    
    function handleDragOver(e) {
	if (e.preventDefault) {
	    e.preventDefault(); // Necessary. Allows us to drop.
	}
	this.classList.add('over');

	e.dataTransfer.dropEffect = 'move'; 

	return false;
    }

    function handleDragEnter(e) {
	// this / e.target is the current hover target.
    }

    function handleDragLeave(e) {
	this.classList.remove('over');  // this / e.target is previous target element.
    }

    function handleDrop(e) {
	// this/e.target is current target element.

	if (e.stopPropagation) {
	    e.stopPropagation(); // Stops some browsers from redirecting.
	}

	// Don't do anything if dropping the same column we're dragging.
	if (dragSrcEl != this) {
	    // Set the source column's HTML to the HTML of the column we dropped on.
	    //alert(this.outerHTML);
	    //dragSrcEl.innerHTML = this.innerHTML;
	    //this.innerHTML = e.dataTransfer.getData('text/html');
	    this.parentNode.removeChild(dragSrcEl);
	    var dropHTML = e.dataTransfer.getData('text/html');
	    this.insertAdjacentHTML('beforebegin',dropHTML);
	    var dropElem = this.previousSibling;
	    addDnDHandlers(dropElem);

	    var sidebarReorderedEvt = new CustomEvent("sidebarReorderedEvt", {
		detail: {}
	    })
	    this.parentNode.dispatchEvent(sidebarReorderedEvt)
	    
	}
	this.classList.remove('over');
	return false;
    }

    function handleDragEnd(e) {
	// this/e.target is the source node.
	this.classList.remove('over');

	/*[].forEach.call(cols, function (col) {
	  col.classList.remove('over');
	  });*/
    }

    function addDnDHandlers(elem) {
	elem.addEventListener('dragstart', handleDragStart, false);
	elem.addEventListener('dragenter', handleDragEnter, false)
	elem.addEventListener('dragover', handleDragOver, false);
	elem.addEventListener('dragleave', handleDragLeave, false);
	elem.addEventListener('drop', handleDrop, false);
	elem.addEventListener('dragend', handleDragEnd, false);
    }

    function makeDragNDropable(qs) {
	for (var i = 0; i < qs.length; i++) {
	    addDnDHandlers(qs[i])
	}
    }

    
    // Module exports
    module.makeDragNDropable = makeDragNDropable
    module.addDnDHandlers = addDnDHandlers
    
    return module
}
