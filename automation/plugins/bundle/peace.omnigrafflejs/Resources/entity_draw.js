(() => {
    return new PlugIn.Action(function () {
        this.plugIn.library("entity").drawEntitiesFromFile();
    });
})();
