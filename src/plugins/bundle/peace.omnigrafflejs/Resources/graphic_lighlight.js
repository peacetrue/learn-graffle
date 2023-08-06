(function () {
    var action = new PlugIn.Action(function (selection) {
        var that = this;
        var library = that.plugIn.library("common");
        var _Common = library["Common"];
        _Common.highlightConnected(selection.graphics);
    });
    action.validate = function (selection) {
        return selection && selection.solids.length > 0;
    };
    return action;
})();
