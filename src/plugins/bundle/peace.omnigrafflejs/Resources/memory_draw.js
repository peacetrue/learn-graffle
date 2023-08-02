(function () {
    var action = new PlugIn.Action(function (selection) {
        var that = this;
        var library = that.plugIn.library("common");
        // let common: typeof Common = library["Common"];
        var memory = library["MemoryPainter"];
        memory.drawMemory();
    });
    action.validate = function (selection) {
        return true;
    };
    return action;
})();
