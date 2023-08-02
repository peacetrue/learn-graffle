(function () {
    var action = new PlugIn.Action(function (selection) {
        var that = this;
        var common = that.plugIn.library("common")["Common"];
        common.setGraphicLineNumber(selection.solids[0]);
    });
    action.validate = function (selection) {
        return selection && selection.solids.length > 0;
    };
    return action;
})();
