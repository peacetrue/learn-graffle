// https://www.omni-automation.com/plugins/calling.html
// 执行插件动作。参数为插件标志和动作名
(function performPlugInAction(pluginId, actionName) {
    let plugin = PlugIn.find(pluginId)
    if (plugin === null) throw new Error("Plug-in not installed.")
    let absent = plugin.actions.filter(action => action.name === actionName).length === 0;
    if (absent) throw new Error(`Action "${actionName}" is not in the plug-in.`)
    let action = plugin.action(actionName);
    if (!action.validate()) throw new Error(`The action "${actionName}" is not validated to execute.`)
    action.perform();
})(...argument)
