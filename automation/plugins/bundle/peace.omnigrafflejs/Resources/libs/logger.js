/** 日志类库。仅封装日志级别。 */
Console.LEVELS = ["OFF", "ERROR", "WARN", "INFO", "DEBUG"];
Console.level = "DEBUG";

Console.setLevel = function (level) {
    this.level = level;
}

Console.isLevelEnabled = function (level) {
    return Console.LEVELS.indexOf(this.level) <= Console.LEVELS.indexOf(level);
}

Console.log = function (level, ...args) {
    if (this.isLevelEnabled(level)) console[level.toLowerCase()](...args);
}

Console.error = function (...args) {
    this.log("ERROR", ...args);
}

Console.warn = function (...args) {
    this.log("WARN", ...args);
}

Console.info = function (...args) {
    this.log("INFO", ...args);
}

Console.debug = function (...args) {
    // console.debug 未定义
    if (this.isLevelEnabled("DEBUG")) console.info(...args);
}
