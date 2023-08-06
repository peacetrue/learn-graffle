(() => {
  let action = new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let library = that.plugIn.library("common");
    let _Common: typeof Common = library["Common"];
    _Common.locateCenter();
  });
  action.validate = function (selection: Selection) {
    return selection.graphics.length > 0;
  }
  return action;
})();
