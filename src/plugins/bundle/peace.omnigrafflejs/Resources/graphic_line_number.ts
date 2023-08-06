(() => {
  let action = new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let library = that.plugIn.library("common");
    let _Common: typeof Common = library["Common"];
    _Common.setGraphicLineNumber(selection.solids[0]);
  });
  action.validate = function (selection: Selection) {
    return selection && selection.solids.length > 0;
  }
  return action;
})();
