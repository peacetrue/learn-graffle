String.prototype.format = function () {
    const args = arguments;
    return this.replace(/{(\d+)}/g, function (match, index) {
        return typeof args[index] !== 'undefined' ? args[index] : match;
    });
};

String.prototype.leftPad = function (length, paddingChar) {
    let str = this;
    if (str.length >= length) return `${str}`;// 不能直接返回 str
    return paddingChar.repeat(length - str.length) + str;
}

/**
 * 格式化内存空间。
 * @param {Number} sizeInBytes 内存空间
 * @returns {string} 带单位的内存空间
 */
Number.formatMemorySize = function (sizeInBytes) {
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let size = sizeInBytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}


