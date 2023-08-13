(() => {
  let action = new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let library = that.plugIn.library("common");
    // let common: typeof Common = library["Common"];
    let Painter: typeof StringGroupPainter = library["StringGroupPainter"];
    Painter.draw();
  });
  action.validate = function (selection: Selection) {
    return true;
  }
  return action;
})();
