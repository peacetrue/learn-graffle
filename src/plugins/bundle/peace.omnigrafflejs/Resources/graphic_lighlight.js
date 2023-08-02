(() => {

    let action = new PlugIn.Action(function (selection) {
        this.plugIn.library("common").highlightConnected(selection.graphics);
    });

    action.validate = function (selection) {
        return selection && selection.graphics && selection.graphics.length > 0;
    }

    return action;
})();
