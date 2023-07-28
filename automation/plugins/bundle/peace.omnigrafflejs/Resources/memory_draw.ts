(() => {
  let action = new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let library = that.plugIn.library("memory");
    // let common: typeof Common = library["Common"];
    let memory: typeof Memory = library["Memory"];
    memory.drawMemory();
  });
  action.validate = function (selection: Selection) {
    return true;
  }
  return action;
})();
