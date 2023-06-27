var _ = function(){
	var action = new PlugIn.Action(function(selection){
		// if called externally (from script) generate selection object
		if (typeof selection == 'undefined'){selection = document.windows[0].selection}
		var aFillColor = Color.RGB(1, 0, 0, 1)
		// change the value of the fill color of each selected graphic
		selection.graphics.forEach(function(aGraphic){
			aGraphic.fillColor = aFillColor
		})
	});

	// result determines if the action menu item is enabled
	action.validate = function(selection){
		// check to see if any graphics are selected
		// if called externally (from script) generate selection object
		if (typeof selection == 'undefined'){selection = document.windows[0].selection}
		if (selection.graphics.length > 0){return true} else {return false}
	};

	return action;
}();
_;