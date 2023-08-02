(function () {
    return new PlugIn.Action(function (selection) {
        var that = this;
        var layerSwitcher = that.plugIn.library("common")["LayerSwitcher"];
        layerSwitcher.switch(selection.graphics[0]);
    });
})();
