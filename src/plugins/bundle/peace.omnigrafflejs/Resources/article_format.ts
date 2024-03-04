(() => {
  let action = new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let library = that.plugIn.library("common");
    let instance: typeof ArticleTitles = library["ArticleTitles"];
    instance.defaults.format(selection.canvas);
  });
  action.validate = function (selection: Selection) {
    return true;
  }
  return action;
})();
