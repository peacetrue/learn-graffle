(function (classType, ...args) {
    try {
        function trys() {
            // let Common = PlugIn.find("com.github.peacetrue.learn.graffle").library("common")["MemoryPainter"];
            let plugIn = PlugIn.find("com.github.peacetrue.learn.graffle");
            // 初次打开应用，可能尚未加载插件，等待插件加载完成
            if (!plugIn) return Timer.once(1, trys);
            let library = plugIn.library("common");
            // with (library) {
            // eval(classType)
            // }
            let Class = library[classType];
            let group = Class.drawScript.apply(Class, args);
            if (!group instanceof Array) group = [group];
            document.windows[0].selection.view.select(group);
        }

        trys();
    } catch (e) {
        console.error("exec script error: ", e);
    }
})(...argument)
