(function demo(direction, content) {
    try {
        function trys() {
            // let Common = PlugIn.find("com.github.peacetrue.learn.graffle").library("common")["MemoryPainter"];
            let plugIn = PlugIn.find("com.github.peacetrue.learn.graffle");
            // 初次打开应用，可能尚未加载插件，等待插件加载完成
            if (!plugIn) return Timer.once(1, trys);
            let library = plugIn.library("common");
            let Common = library["Common"], MemoryBlock = library["MemoryBlock"];
            let group = library["MemoryPainter"][direction].drawMemoryBlocks(
                Common.canvas(), Common.windowCenterPoint(), MemoryBlock.parse(content)
            )
            document.windows[0].selection.view.select([group], true);
            //let common = plugIn.library("common");
            // let layer = common.canvas().newLayer();
            // layer.name = "虚拟内存图";
            // response.layer = layer;
            // common.locateCenter();
        }

        trys();
    } catch (e) {
        console.error("demo-memory: ", e);
    }
})(...argument)
