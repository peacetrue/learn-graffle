(() => {

    let action = new PlugIn.Action(function (selection) {
        this.plugIn.library("common").switchLayers(selection.graphics[0]);
    });

    action.validate = function (selection) {
        return selection && selection.graphics && selection.graphics.length === 1;
    }

    return action;
})();
