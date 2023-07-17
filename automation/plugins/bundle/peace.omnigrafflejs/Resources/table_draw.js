(() => {
    return new PlugIn.Action(function (selection) {
        this.plugIn.library("memory").drawTableColumn(
            selection.canvas,
            document.windows[0].centerVisiblePoint.subtract(new Point(300, 300))
        );
    });
})();
