(function () {
    var action = new PlugIn.Action(function (selection) {
        var that = this;
        var stepper = that.plugIn.library("memory")["Common"];
        stepper.setGraphicLineNumber(selection.solids[0]);
    });
    action.validate = function (selection) {
        return selection && selection.solids.length > 0;
    };
    return action;
})();
