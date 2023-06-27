// https://www.omni-automation.com/plugins/calling.html
(function drawEntities(entities) {
    let library = PlugIn.find("com.github.peacetrue.learn.graffle.peace-library").library("peace-library");
    library.drawEntities(document.windows[0].selection.canvas, entities, document.windows[0].centerVisiblePoint);
})(argument)
