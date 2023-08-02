(() => {

    let action = new PlugIn.Action(function (selection) {
        this.plugIn.library("common").loadGraphicsText(selection.graphics, 'location');
    });

    action.validate = function (selection) {
        return selection && selection.graphics && selection.graphics.length >= 1;
    }

    return action;
})();
