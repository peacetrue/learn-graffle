(() => {
  return new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let stepper: typeof Stepper = that.plugIn.library("common")["Stepper"];
    stepper.switch();
  });
})();