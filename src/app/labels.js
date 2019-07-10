// labels for chess nodes
module.exports = function () {

    function rootNode() {
	return '1z'
    }


    function getNextMainlineIndx(nodeIndx) {
	var indx = nodeIndx.match(/(\d+)z$/)

	if (indx == undefined) {
	    return nodeIndx + '1z'
	} else {
	    return nodeIndx.replace(/\d+z$/, "") + (parseInt(indx[1]) + 1) + 'z' 
	}
    }

    
    function getNextSiblingIndx(nodeIndx, numSibling) {
	if (numSibling == 0) {
	    return getNextMainlineIndx(nodeIndx)
	} else {
	    return nodeIndx + numSibling.toString() + 'n'
	}
    }

    
    function getChildIndx(nodeIndx) {
	var indx = nodeIndx.match(/(\d+)n$/)

	if (indx == undefined) {
	    // by convention, mainline has childIndx 0
	    return 0
	} else {
	    return parseInt(indx[1])
	}
    }
    

    function getBranchNode(selectedNode) {

	if (!/n/.test(selectedNode)) {
	    // branch is already mainline
	    return
	}

	// strip trailing zeros
	var parent = selectedNode.replace(/\d+z$/, "")
	var stem = parent.replace(/\d+n$/, "")
	
	// replace last index with mainline index
	if (stem.endsWith('n')) {
	    return parent.replace(/\d+n$/, "1z")
	} else {
	    var mainlineIndx = parseInt(stem.match(/(\d+)z$/)[1])
	    return stem.replace(/(\d+)z$/, (mainlineIndx + 1) + "z")
	}
	    
    }

        
    module.rootNode = rootNode
    module.getBranchNode = getBranchNode
    module.getNextMainlineIndx = getNextMainlineIndx
    module.getNextSiblingIndx = getNextSiblingIndx
    module.getChildIndx = getChildIndx
    
    return module
}
