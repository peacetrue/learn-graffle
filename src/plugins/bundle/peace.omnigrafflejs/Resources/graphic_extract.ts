// see https://omni-automation.com/omnifocus/plug-in-share-clipboard-text.html
// see https://omni-automation.com/omnioutliner/pasteboard.html
(() => {
  let action = new PlugIn.Action(function (selection: Selection) {
    let that: PlugIn.Action = this;
    let library = that.plugIn.library("common");
    let _Graphics: typeof Graphics = library["Graphics"];
    _Graphics.extractTextToClipboard(selection.graphics);
  });

  action.validate = function (selection, sender) {
    return selection.graphics.length > 0;
  };
  return action;
})();
