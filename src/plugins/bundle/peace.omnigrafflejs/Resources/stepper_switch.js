(function () {
    return new PlugIn.Action(function (selection) {
        var that = this;
        var stepper = that.plugIn.library("common")["Stepper"];
        stepper.switch();
    });
})();
