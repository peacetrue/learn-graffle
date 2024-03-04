(() => {
  let action = new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let library = that.plugIn.library("common");
    let _TablePainter: typeof TablePainter = library["TablePainter"];
    _TablePainter.draw();
  });
  action.validate = function (selection: Selection) {
    return true;
  }
  return action;
})();
