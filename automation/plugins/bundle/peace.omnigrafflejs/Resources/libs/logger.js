/** 日志类库。仅封装日志级别。 */
Console.LEVELS = ["OFF", "ERROR", "WARN", "INFO", "DEBUG"];
Console.prototype.level = "INFO";
console.level = Console.prototype.level;

Console.prototype.setLevel = function (level) {
    this.level = level;
}

Console.prototype.isLevelEnabled = function (level) {
    return Console.LEVELS.indexOf(this.level) >= Console.LEVELS.indexOf(level);
}

Console.prototype.debug = function (...args) {
    // console.debug 未定义
    if (this.isLevelEnabled("DEBUG")) this.info("DEBUG - ", ...args);
}
