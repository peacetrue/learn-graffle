(() => {

    let action = new PlugIn.Action(function (selection) {
        let graphic = selection.graphics[0];
        console.info("graphic: ", graphic);
        let library = this.plugIn.library("memory");
        let data = library.extractGraphicTexts(graphic);
        let location = graphic.userData["location"];
        // if (location) return URL.fromString(`file://${location}`);
        let fileSaver = new FileSaver();
        fileSaver.types = [TypeIdentifier.json];
        fileSaver.show(FileWrapper.withContents(location, Data.fromString(JSON.stringify(data))));
    });

    action.validate = function (selection) {
        return selection && selection.graphics && selection.graphics.length > 0;
    }

    return action;
})();
