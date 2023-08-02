(() => {
    // 在画布菜单栏中选中图形后，定位到图形所在位置

    let action = new PlugIn.Action(function (selection) {
        this.plugIn.library("common").locateCenter();
    });

    action.validate = function (selection) {
        return selection && selection.graphics.length > 0;
    }

    return action;
})();
