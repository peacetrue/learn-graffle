(() => {
  return new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let layerSwitcher: typeof LayerSwitcher = that.plugIn.library("common")["LayerSwitcher"];
    layerSwitcher.switch(selection.graphics[0]);
  });
})();
