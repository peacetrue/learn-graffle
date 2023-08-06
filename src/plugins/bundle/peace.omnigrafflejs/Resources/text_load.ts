(() => {
  let action = new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this; // 为了 ts 类型提示
    let library = that.plugIn.library("common");
    let _Common: typeof Common = library["Common"];
    _Common.loadGraphicsText(selection.solids, 'location');
  });

  action.validate = function (selection: Selection) {
    return selection.solids.length > 0;
  }
  return action;
})();
