(function demo(content) {
    try {
        function trys() {
            let plugIn = PlugIn.find("com.github.peacetrue.learn.graffle");
            // 初次打开应用，可能尚未加载插件，等待插件加载完成
            if (!plugIn) return Timer.once(1, trys);

            let layer = document.windows[0].selection.canvas.newLayer();
            layer.name = "虚拟内存图";
            let group = plugIn.library("memory").drawMemoryForMaps(null, null, content);
            group.layer = layer;
            document.windows[0].selection.view.select(layer.graphics, false);
            plugIn.library("common").locateCenter();
        }

        trys();
    } catch (e) {
        console.error("demo-memory: ", e);
    }
})(...argument)
