/**
 * 加载第三方类库。
 * 第三方类库必须将自己注册到已知的全局变量上，比如：String、Number、Object、Console 上，
 * 以便 omni 类库中能够访问。
 */
(function () {
    let library = new PlugIn.Library(new Version("0.1"));
    ["api", "logger"].forEach(item => {
        library.plugIn.resourceNamed(`libs/${item}.js`).fetch(response => eval(response.toString()));
    })
    return library;
})();
