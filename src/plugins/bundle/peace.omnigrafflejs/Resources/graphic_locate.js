(function () {
    var action = new PlugIn.Action(function (selection) {
        var that = this;
        var library = that.plugIn.library("common");
        var _Common = library["Common"];
        _Common.locateCenter();
    });
    action.validate = function (selection) {
        return selection.graphics.length > 0;
    };
    return action;
})();
