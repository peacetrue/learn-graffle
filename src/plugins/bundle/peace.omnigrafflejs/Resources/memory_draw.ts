(() => {
  let action = new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let library = that.plugIn.library("common");
    // let common: typeof Common = library["Common"];
    let memory: typeof MemoryPainter = library["MemoryPainter"];
    memory.drawMemory();
  });
  action.validate = function (selection: Selection) {
    return true;
  }
  return action;
})();
