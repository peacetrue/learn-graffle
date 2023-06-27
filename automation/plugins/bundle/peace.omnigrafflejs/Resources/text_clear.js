(() => {

    let action = new PlugIn.Action(function (selection) {
        this.plugIn.library("common").clearGraphicsText(selection.graphics);
    });

    action.validate = function (selection) {
        return selection && selection.graphics && selection.graphics.length > 0;
    }

    return action;
})();
