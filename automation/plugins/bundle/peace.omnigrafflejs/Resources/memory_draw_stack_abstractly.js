(() => {
    return new PlugIn.Action(function () {
        this.plugIn.library("memory").drawStackMemoryAbstractly();
    });
})();
