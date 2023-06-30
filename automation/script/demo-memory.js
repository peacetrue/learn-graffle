(function demo(content) {
    try {
        function trys() {
            let plugIn = PlugIn.find("com.github.peacetrue.learn.graffle");
            // 初次打开应用，可能尚未加载插件，等待插件加载完成
            if (!plugIn) return Timer.once(1, trys);
            plugIn.library("memory").drawMemoryForMaps(null, null, content, content)
                .then(response => {
                    document.windows[0].selection.view.select([response], true);
                    //let common = plugIn.library("common");
                    // let layer = common.canvas().newLayer();
                    // layer.name = "虚拟内存图";
                    // response.layer = layer;
                    // common.locateCenter();
                });
        }

        trys();
    } catch (e) {
        console.error("demo-memory: ", e);
    }
})(argument)
