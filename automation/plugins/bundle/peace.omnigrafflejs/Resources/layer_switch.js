(function () {
    return new PlugIn.Action(function (selection) {
        var that = this;
        var layerSwitcher = that.plugIn.library("memory")["LayerSwitcher"];
        layerSwitcher.switch(selection.graphics[0]);
    });
})();
