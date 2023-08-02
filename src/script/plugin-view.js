// https://www.omni-automation.com/plugins/api.html
// 查看所有插件信息。参数为属性名集合，设置显示插件的哪些属性
(function viewPlugins(properties) {
    let plugins = PlugIn.all
        .sort((left, right) => left.identifier.localeCompare(right.identifier))
        .map(plugin => {
            return properties.map(property => `${property}: ${plugin[property]}\n`).join('');
        });
    new Alert("PlugIns View", plugins.join('\n\n')).show();
    // console.info(plugins.join('\n\n'));
})(argument)
