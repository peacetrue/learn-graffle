(() => {
  let action = new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let common: typeof Common = that.plugIn.library("common")["Common"];
    common.setGraphicLineNumber(selection.solids[0]);
  });
  action.validate = function (selection: Selection) {
    return selection && selection.solids.length > 0;
  }
  return action;
})();
