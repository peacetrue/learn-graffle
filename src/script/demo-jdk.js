(function demoJdk(entities) {
    try {
        let layer = document.windows[0].selection.canvas.newLayer();
        layer.name = "jdk源码类图";

        function tryDrawEntities() {
            let plugIn = PlugIn.find("com.github.peacetrue.learn.graffle.peace-library");
            // 初次打开应用，可能尚未加载插件，等待插件加载完成
            if (plugIn == null) return Timer.once(1, tryDrawEntities);
            let library = plugIn.library("peace-library");
            library.drawEntities(layer, entities, document.windows[0].centerVisiblePoint);
            document.windows[0].selection.view.select(layer.graphics, false);
        }

        tryDrawEntities();
    } catch (e) {
        console.error("demo-jdk: ", e);
    }
})(argument)
