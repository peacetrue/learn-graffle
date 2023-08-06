(function () {
    var action = new PlugIn.Action(function (selection) {
        var that = this; // 为了 ts 类型提示
        var library = that.plugIn.library("common");
        var _Common = library["Common"];
        _Common.clearGraphicsText(selection.graphics);
    });
    action.validate = function (selection) {
        return selection.solids.length > 0;
    };
    return action;
})();
