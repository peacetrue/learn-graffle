/** 日志类库。仅封装日志级别。 */
Console.LEVELS = ["OFF", "ERROR", "WARN", "INFO", "DEBUG"];
// Console.prototype.level = "DEBUG";
console.level = "DEBUG";

console.setLevel = function (level) {
    this.level = level;
}


console.isLevelEnabled = function (level) {
    return Console.LEVELS.indexOf(this.level) >= Console.LEVELS.indexOf(level);
}

console.debug = function (...args) {
    // console.debug 未定义
    if (this.isLevelEnabled("DEBUG")) this.info(...args);
}
