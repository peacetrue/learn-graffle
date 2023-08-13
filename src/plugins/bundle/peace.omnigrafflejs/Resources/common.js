var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b;
/** 日志级别 */
var LoggerLevel;
(function (LoggerLevel) {
    LoggerLevel[LoggerLevel["OFF"] = 0] = "OFF";
    LoggerLevel[LoggerLevel["ERROR"] = 1] = "ERROR";
    LoggerLevel[LoggerLevel["WARN"] = 2] = "WARN";
    LoggerLevel[LoggerLevel["INFO"] = 3] = "INFO";
    LoggerLevel[LoggerLevel["DEBUG"] = 4] = "DEBUG";
})(LoggerLevel || (LoggerLevel = {}));
/** 日志类 */
var Logger = /** @class */ (function () {
    function Logger(category) {
        this.category = category;
    }
    /** 记录内部日志 */
    Logger.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // @ts-ignore
        if (Logger.enabledInnerLogger)
            console.info.apply(console, args);
    };
    /** 获取日志实例对象，按日志分类缓存日志实例对象 */
    Logger.getLogger = function (category) {
        if (category === void 0) { category = Logger.functionCategory; }
        Logger.log("Logger.getLogger: ".concat(category));
        var logger = Logger.loggers[category];
        Logger.log("category: ".concat(category, "=").concat(logger));
        if (logger)
            return logger;
        logger = new Logger(category);
        Logger.loggers[category] = logger;
        Logger.log("category: ".concat(category, "=").concat(logger));
        return logger;
    };
    /** 获取日志级别，默认使用根日志分类的基本 */
    Logger.prototype.getLevel = function () {
        for (var category in Logger.config) {
            if (this.category.startsWith(category))
                return Logger.config[category];
        }
        return Logger.config[Logger.CATEGORY_ROOT];
    };
    /** 是否启用了指定的日志级别 */
    Logger.prototype.isLevelEnabled = function (level) {
        // 配置的级别 >= 使用的级别
        var thisLevel = this.getLevel();
        Logger.log("isLevelEnabled: ".concat(LoggerLevel[thisLevel], " >= ").concat(LoggerLevel[level]));
        return thisLevel >= level;
    };
    /** 记录日志信息 */
    Logger.prototype.log = function (level, args) {
        Logger.log("Logger.log: level=".concat(level, ", args=").concat(args));
        if (!this.isLevelEnabled(level))
            return;
        var levelName = LoggerLevel[level];
        var formattedLevelName = Logger.leftPad(levelName, 5, ' ');
        var indent = "  ".repeat(Logger.functionHierarchy);
        levelName = levelName.toLowerCase();
        Logger.log("Logger.log: levelName=".concat(levelName, ", levelName in console="), levelName in console);
        // console.info(BigInt(1)) 导致程序异常退出
        args.forEach(function (value, index) { return typeof value === "bigint" && (args[index] = value.toString()); });
        console[levelName in console ? levelName : "info"].apply(console, __spreadArray(["[".concat(formattedLevelName, "]"), indent], args, false));
    };
    Logger.leftPad = function (src, length, paddingChar) {
        if (paddingChar === void 0) { paddingChar = ' '; }
        if (src.length >= length)
            return src;
        return paddingChar.repeat(length - src.length) + src;
    };
    Logger.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.log(LoggerLevel.ERROR, args);
    };
    Logger.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.log(LoggerLevel.WARN, args);
    };
    Logger.prototype.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.log(LoggerLevel.INFO, args);
    };
    Logger.prototype.debug = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.log(LoggerLevel.DEBUG, args);
    };
    /**
     * 代理类实例上的函数
     *
     * @param instance 类实例对象
     * @return 类实例对象的代理对象
     */
    Logger.proxyInstance = function (instance) {
        return new Proxy(instance, {
            get: function (target, name, receiver) {
                var value = target[name];
                // 排除继承的方法，例如：Object 上的
                if (!(name in Object.prototype) && typeof value === "function") {
                    return Logger.buildFunctionProxy(value, instance.constructor.name, name.toString());
                }
                // if (Logger.isCustomType(value)) return Logger.proxyInstance(value);
                return value;
            },
        });
    };
    Logger.isCustomType = function (value) {
        return value != null && value.constructor && !Logger.isSimpleType(value);
    };
    Logger.isSimpleType = function (value) {
        return [Object, Number, Boolean, String, Array]
            .map(function (item) { return item.name; })
            .includes(value.constructor.name);
    };
    /**
     * 代理类上的静态函数，不代理类函数本身
     * @param clazz JS 类，本质还是一个函数
     * @see buildFunctionProxy
     */
    Logger.proxyClassStaticFunction = function (clazz) {
        var properties = Object.getOwnPropertyNames(clazz);
        properties.filter(function (property) { return typeof clazz[property] === "function"; }).forEach(function (property) {
            clazz[property] = Logger.buildFunctionProxy(clazz[property], clazz.name || clazz.constructor.name, property);
        });
    };
    /**
     * 构建函数日志代理。
     * INFO  级别添加方法签名日志
     * DEBUG 级别添加参数日志
     * DEBUG 级别添加返回值日志
     * @param func 要代理的函数
     * @param [ownerName] 函数的所有者对象名称，通常是类名也可以设置为自定义名称
     * @param [functionName] 函数名称
     * @return 函数的日志代理对象
     */
    Logger.buildFunctionProxy = function (func, ownerName, functionName) {
        return new Proxy(func, {
            apply: function (target, thisArg, argumentsList) {
                var name = ownerName || thisArg.constructor.name;
                name += "." + (functionName || target.name);
                var logger = Logger.getLogger(name);
                Logger.functionCategory = name;
                Logger.functionHierarchy++;
                logger.info("".concat(name, "(arguments ").concat(argumentsList.length, ")"));
                argumentsList.forEach(function (argument, index) { return logger.debug("[".concat(index, "]: ").concat(Logger.formatArray(argument))); });
                var result = target.apply(thisArg, argumentsList);
                logger.debug("".concat(name, "(result): "), typeof result === "string" ? "'".concat(result, "'") : Logger.formatArray(result));
                Logger.functionHierarchy--;
                return result;
            }
        });
    };
    Logger.formatArray = function (argument) {
        return argument instanceof Array ? ('array[' + argument.length + ']') : argument;
    };
    /** 是否启用内部日志，仅针对 Logger 自身的方法 */
    Logger.enabledInnerLogger = false;
    /** 根日志分类 */
    Logger.CATEGORY_ROOT = "ROOT";
    /** 日志配置，不同的类和方法使用不同的日志级别 */
    Logger.config = (_a = {},
        _a[Logger.CATEGORY_ROOT] = LoggerLevel.DEBUG,
        _a["Common.canvas"] = LoggerLevel.WARN,
        _a["Common.selection"] = LoggerLevel.WARN,
        _a["Common.windowCenterPoint"] = LoggerLevel.WARN,
        _a["Common"] = LoggerLevel.DEBUG,
        _a["MemoryPainter.incrementOrigin"] = LoggerLevel.WARN,
        _a["MemoryPainter.subtract"] = LoggerLevel.WARN,
        _a["MemoryPainter.getDirectionHandler"] = LoggerLevel.WARN,
        _a["EntityProperty.parse"] = LoggerLevel.WARN,
        _a);
    /** 日志缓存，category 为 key */
    Logger.loggers = {};
    /** 当前函数所处的层级 */
    Logger.functionHierarchy = 0;
    /** 当前函数所处的日志分类 */
    Logger.functionCategory = Logger.CATEGORY_ROOT;
    return Logger;
}());
var Common = /** @class */ (function () {
    function Common() {
    }
    /**
     * 操作选项。
     *
     * @param object
     * @param key
     * @param [value]
     * @return
     */
    Common.option = function (object, key, value) {
        var _this_1 = this;
        var actions = {
            "Canvas": function (object, key, value) { return _this_1.canvasOption(object, key, value); },
            "*": function (object, key, value) { return value === undefined ? object.userData[key] : object.setUserData(key, value); },
        };
        var className = object.constructor.name;
        var action = actions[className] || actions['*'];
        return action(object, key, value);
    };
    /**
     * 操作 canvas 选项。
     *
     * @param canvas
     * @param key
     * @param [value]
     * @return
     */
    Common.canvasOption = function (canvas, key, value) {
        var options = this.canvasOptions[canvas.name];
        if (!options) {
            options = {};
            this.canvasOptions[canvas.name] = options;
        }
        return value === undefined ? options[key] : (options[key] = value);
    };
    /** URL.fetch to Promise。*/
    Common.promiseUrlFetch = function (url) {
        return new Promise(function (resolve, reject) {
            url.fetch(function (response) { return resolve({ url: url, data: response.toString() }); }, function (response) { return reject(response); });
        });
    };
    Common.promise = function (data) {
        return new Promise(function (resolve, reject) { return resolve(data); });
    };
    /** 获取当前选中对象。*/
    Common.selection = function () {
        return document.windows[0].selection;
    };
    /** 获取当前选中的画布。*/
    Common.canvas = function () {
        return this.selection().canvas;
    };
    /** 获取当前选中的第一个元素。*/
    Common.selectedGraphic = function () {
        return this.selection().graphics[0];
    };
    /** 获取当前窗口中心点。*/
    Common.windowCenterPoint = function () {
        return document.windows[0].centerVisiblePoint;
    };
    /**
     * 选择文件。
     *
     * @param [types] 文件类型集合
     * @return
     */
    Common.selectFile = function (types) {
        var _this_1 = this;
        var filePicker = new FilePicker();
        filePicker.types = types;
        return filePicker.show().then(function (response) {
            return _this_1.promiseUrlFetch(response[0]);
        });
    };
    /**
     * 选择文件后，记录下文件位置。
     *
     * @param object 关联对象
     * @param locationKey 位置键
     */
    Common.selectFileAssociatively = function (object, locationKey) {
        var _this_1 = this;
        return this.selectFile().then(function (response) {
            _this_1.option(object, locationKey, response.url.toString());
            return response;
        });
    };
    /**
     * 读取文件内容。
     *
     * @param location 文件位置
     */
    Common.readFileContent = function (location) {
        !location.startsWith('file:') && (location = "file://".concat(location));
        return this.promiseUrlFetch(URL.fromString(location));
    };
    /**
     * 从关联对象中读取文件内容。
     *
     * @param object 关联对象
     * @param locationKey 文件位置键
     */
    Common.readFileContentAssociatively = function (object, locationKey) {
        var _this_1 = this;
        if (app.shiftKeyDown) {
            this.option(object, locationKey, null);
            return Promise.reject("clear cache!");
        }
        var location = this.option(object, locationKey);
        if (!location)
            return this.selectFileAssociatively(object, locationKey);
        return this.readFileContent(location).catch(function (response) {
            // response:  Error: 未能完成操作。（kCFErrorDomainCFNetwork错误1。）
            console.error("promiseUrlFetch response: ", response);
            return _this_1.selectFileAssociatively(object, locationKey);
        });
    };
    /**
     * 选择性地读取文件内容。
     *
     * @param object 关联对象
     * @param locationKey 文件位置键
     * @param [content] 可选的内容
     */
    Common.readFileContentSelectively = function (object, locationKey, content) {
        return (content
            ? Common.promise({ url: null, data: content })
            : Common.readFileContentAssociatively(object, locationKey));
    };
    /**
     * 从文件读取内容后设置到图形中。
     * 文件内容过多，可分开显示到多个图形中。
     *
     * @param graphics 图形集合
     * @param locationKey 位置键
     * @param [length] 图形数目
     */
    Common.loadGraphicsText = function (graphics, locationKey, length) {
        var _this_1 = this;
        var graphic = graphics[0];
        length = length || graphic.userData['length'] || 1;
        return this.readFileContentAssociatively(graphic, locationKey)
            .then(function (response) {
            var canvas = _this_1.canvas();
            var location = graphic.userData[locationKey];
            graphics = canvas.allGraphicsWithUserDataForKey(location, locationKey);
            if (graphics.length < length)
                graphics = _this_1.duplicateGraphicToLayers(canvas, graphic, length);
            _this_1.setGraphicsText(graphics, response.data);
            return response;
        })
            .catch(function (response) {
            console.error("loadGraphicsText response: ", response);
        });
    };
    /**
     * 将内容拆分后均匀分摊到图形集合。
     *
     * @param graphics 图形集合
     * @param text 文本内容
     */
    Common.setGraphicsText = function (graphics, text) {
        if (graphics.length === 1) {
            return graphics[0].text = text;
        }
        var lines = text.split("\n");
        var lineCountPerGraphic = lines.length / graphics.length;
        var index = 0;
        for (var _i = 0, graphics_1 = graphics; _i < graphics_1.length; _i++) {
            var graphic = graphics_1[_i];
            graphic.text = lines.slice(index, index += lineCountPerGraphic).join("\n");
        }
        if (index < lines.length - 1) {
            graphics.at(-1).text += "\n" + lines.slice(index).join("\n");
        }
    };
    /**
     * 设置图形内容为行号。
     *
     * @param graphic 图形
     * @param lineCountKey 行数键
     * @param lineCountValue 行数值
     */
    Common.setGraphicLineNumber = function (graphic, lineCountKey, lineCountValue) {
        if (lineCountKey === void 0) { lineCountKey = "line.count"; }
        if (lineCountValue === void 0) { lineCountValue = 10; }
        lineCountValue = graphic.userData[lineCountKey] || lineCountValue;
        graphic.text = Array.from({ length: lineCountValue }, function (_, i) { return i + 1; }).join("\n");
    };
    /**
     * 复制图形到一个新创建的图层中。
     * 图层命名为：layer-0、layer-1。
     *
     * @param canvas 画布
     * @param graphic 图形
     * @param {int} length 图形数目
     * @return {void}
     */
    Common.duplicateGraphicToLayers = function (canvas, graphic, length) {
        var graphics = [graphic];
        var layerName = graphic.layer.name.split('-')[0];
        var prevLayer = graphic.layer;
        for (var i = graphics.length; i < length; i++) {
            var newLayer = canvas.newLayer();
            newLayer.name = "".concat(layerName, "-").concat(i);
            newLayer.orderBelow(prevLayer);
            newLayer.visible = false;
            prevLayer = newLayer;
            var duplicate = graphic.duplicateTo(graphic.geometry.origin);
            duplicate.layer = newLayer;
            if (graphic.userData) {
                for (var key in graphic.userData) {
                    duplicate.setUserData(key, graphic.userData[key]);
                }
            }
            graphics.push(duplicate);
        }
        return graphics;
    };
    /**
     * 清除图形内的文本。
     *
     * @param graphics 图形
     */
    Common.clearGraphicsText = function (graphics) {
        var _this_1 = this;
        if (graphics instanceof Array) {
            graphics.forEach(function (graphic) { return _this_1.clearGraphicsText(graphic); });
            return;
        }
        if (graphics instanceof Group) {
            graphics.graphics.forEach(function (graphic) { return _this_1.clearGraphicsText(graphic); });
        }
        else {
            // 带边框的图形
            graphics instanceof Solid && graphics.strokeType && (graphics.text = "");
        }
    };
    /**
     * 获取矩形指定位置处的点。方位顺序：上下左右，top-left。
     *
     * @param rect 矩形
     * @param location 位置，top、middle、bottom、left、center、right
     * @return 点
     */
    Common.pointOfRect = function (rect, location) {
        var parts = location.split('-');
        var vertical = parts.shift(), horizontal = parts.shift();
        var offsetWidth = 0;
        horizontal === 'left' && (offsetWidth = -rect.width / 2);
        horizontal === 'right' && (offsetWidth = rect.width / 2);
        var offsetHeight = 0;
        vertical === 'top' && (offsetHeight = -rect.height / 2);
        vertical === 'bottom' && (offsetHeight = rect.height / 2);
        return rect.center.add(new Point(offsetWidth, offsetHeight));
    };
    /**
     * 获取矩形各个位置处的点。
     *
     * PlugIn.find('com.github.peacetrue.learn.graffle').library('common').pointsOfRect();
     *
     * @param rect 矩形
     * @return {Point[]} 点集合
     */
    Common.pointsOfRect = function (rect) {
        var points = {};
        var verticals = ['top', 'middle', 'bottom'];
        var horizontals = ['left', 'center', 'right'];
        for (var _i = 0, verticals_1 = verticals; _i < verticals_1.length; _i++) {
            var vertical = verticals_1[_i];
            for (var _a = 0, horizontals_1 = horizontals; _a < horizontals_1.length; _a++) {
                var horizontal = horizontals_1[_a];
                var key = "".concat(vertical, "-").concat(horizontal);
                points[key] = this.pointOfRect(rect, key);
            }
        }
        return points;
    };
    /**
     * 获取两点之间的中间点。
     *
     * @param start 起点
     * @param end 终点
     * @return 中点
     */
    Common.centerOfPoints = function (start, end) {
        return new Point((start.x + end.x) / 2, (start.y + end.y) / 2);
    };
    /**
     * 绘线，并在线上添加描述。
     *
     * @param canvas 画布
     * @param {Point[]} points 起止点集合
     * @param [description] 描述
     * @param {Boolean} [center] 默认在起点处绘制文本，true 在中点处绘制文本
     * @return  线（或带文本）
     */
    Common.drawLine = function (canvas, points, description, center) {
        var line = canvas.newLine();
        line.shadowColor = null;
        line.points = points;
        line.headType = "FilledArrow";
        if (!description)
            return line;
        var location = center ? this.centerOfPoints(points[0], points[points.length - 1]) : points[0];
        return new Group([line, canvas.addText(description, location)]);
    };
    Common.getPosition = function (start, end, target) {
        var endVector = end.subtract(start);
        var targetVector = target.subtract(start);
        return endVector.x * targetVector.y - endVector.y * targetVector.x;
    };
    /** return 是无意义的，只是为了将代码写到一行。
     *
     * @param line
     * @return {any}
     */
    Common.align = function (line) {
        var _this_1 = this;
        if (line instanceof Array)
            return line.forEach(function (_line) { return _this_1.align(_line); });
        var points = line.points;
        if (points.length !== 3)
            return;
        var position = this.getPosition(points[0], points[2], points[1]);
        if (position === 0)
            return;
        if ((points[2].y > points[0].y && position > 0) || (points[2].y < points[0].y && position < 0))
            points[1] = new Point(points[0].x, points[2].y);
        if ((points[2].y > points[0].y && position < 0) || (points[2].y < points[0].y && position > 0))
            points[1] = new Point(points[2].x, points[0].y);
        line.points = points; //必须，触发视图渲染
    };
    Common.adjustTable = function (table, rows, columns) {
        var maxRows = Math.max(rows, table.rows);
        var maxColumns = Math.max(columns, table.columns);
        for (var i = 0; i < maxRows; i++) {
            for (var j = 0; j < maxColumns; j++) {
                var graphic = table.graphicAt(i, j);
                if (graphic == null) {
                    var prevGraphic = table.graphicAt(i, j - 1);
                    var geometry = prevGraphic.geometry;
                    // shape.geometry = new Rect(point.x, point.y, size.width, size.height);//几何体边界：矩形
                    prevGraphic.duplicateTo(prevGraphic, new Point(geometry.x + geometry.width, geometry.y));
                }
            }
        }
    };
    /**
     * 提取表格数据。
     * @param table 表格
     * @returns {[][]} 二位数组
     */
    Common.extractTable = function (table) {
        var data = [];
        for (var i = 0; i < table.rows; i++) {
            data.push([]);
            for (var j = 0; j < table.columns; j++) {
                var graphic = table.graphicAt(i, j);
                graphic && (data[i][j] = graphic.text);
            }
        }
        return data;
    };
    /**
     * 使用数据填充表格。
     * @param table 表格
     * @param data 二位数组
     */
    Common.fillTable = function (table, data) {
        for (var i = 0; i < table.rows; i++) {
            for (var j = 0; j < table.columns; j++) {
                var graphic = table.graphicAt(i, j);
                graphic.text = (data[i] || [])[j] || "";
            }
        }
    };
    /** 定位到选中图形所在位置 */
    Common.locateCenter = function () {
        var window = document.windows[0];
        var selection = window.selection;
        var graphics = selection.graphics;
        if (graphics.length === 0)
            return;
        window.setViewForCanvas(selection.canvas, window.zoom, graphics[0].geometry.center);
    };
    /**
     * 获取正向连接的图形，忽略反向连接的。
     *
     * @param source 源始图形集合
     * @param target 目标图形集合
     */
    Common.addConnected = function (source, target) {
        var _this_1 = this;
        if (!source)
            return;
        if (source instanceof Array) {
            source.forEach(function (item) { return _this_1.addConnected(item, target); });
        }
        else {
            target.push(source);
            if (source instanceof Line) {
                this.addConnected(source.head, target);
            }
            else if (source instanceof Graphic) {
                this.addConnected(source.outgoingLines, target);
            }
        }
    };
    /**
     * 高亮选中及连接的图形。
     *
     * @param graphics 图形集合
     */
    Common.highlightConnected = function (graphics) {
        var target = [];
        this.addConnected(graphics, target);
        document.windows[0].selection.view.select(target, false);
    };
    /**
     * 设置自动化动作。
     *
     * PlugIn.find("com.github.peacetrue.learn.graffle").library("common").setAutomationAction();
     */
    Common.setAutomationAction = function (action) {
        if (action === void 0) { action = "graphic_lighlight"; }
        document.windows[0].selection.graphics.forEach(function (graphic) {
            graphic.automationAction = ["com.github.peacetrue.learn.graffle", action];
        });
    };
    // library.plugIn.resourceNamed("libs/logger.js").fetch(response => eval(response.toString()));
    // 反例：其他类库未完成初始化时，不能获取当前类库
    // 正例：library.plugIn.resourceNamed("logger.js").fetch(response => eval(response.toString()));
    // eval 时需要注意绑定的对象
    Common.loadClass = function (plugIn, name, path) {
        if (path === void 0) { path = "libs/".concat(name, ".js"); }
        if (name in Object) {
            return new Promise(function (resolve, reject) { return resolve(Object[name]); });
        }
        return this.promiseUrlFetch(plugIn.resourceNamed(path))
            .then(function (response) {
            var content = response.data;
            eval(content);
            eval("Object[name] = ".concat(name));
            return Object[name];
        });
    };
    Common.move = function (graphic, distance) {
        if (distance === void 0) { distance = new Point(0, 30); }
        graphic instanceof Line
            ? this.moveLine(graphic, distance)
            : this.moveSolid(graphic, distance);
    };
    Common.moveLine = function (line, distance) {
        line.points = line.points.map(function (item) { return item.add(distance); });
        line.head = null;
        line.tail = null;
    };
    Common.moveSolid = function (solid, distance) {
        solid.geometry = solid.geometry.offsetBy(distance.x, distance.y);
    };
    Common.moveToSolid = function (solid, origin) {
        solid.geometry = new Rect(origin.x, origin.y, solid.geometry.width, solid.geometry.height);
    };
    /** TODO 删除元素很慢 */
    Common.clearLayer = function (layer, limit) {
        if (limit === void 0) { limit = 1; }
        return layer.graphics.length <= limit
            ? Common.clearLayerByRemoveGraphics(layer)
            : Common.clearLayerByRebuildLayer(layer);
    };
    Common.clearLayerByRemoveGraphics = function (layer) {
        layer.graphics.forEach(function (item) { return item.remove(); });
        return layer;
    };
    Common.clearLayerByRebuildLayer = function (layer) {
        if (layer.graphics.length === 0)
            return layer;
        var name = layer.name;
        layer.remove();
        layer = Common.canvas().newLayer();
        layer.name = name;
        return layer;
    };
    /**
     * 格式化内存空间。
     * @param  sizeInBytes 内存空间
     * @returns  带单位的内存空间
     */
    Common.formatMemorySize = function (sizeInBytes) {
        var units = ["B", "KB", "MB", "GB", "TB", "PB"];
        var size = sizeInBytes;
        var unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return "".concat(size.toFixed(2), " ").concat(units[unitIndex]);
    };
    Common.leftPad = function (src, length, paddingChar) {
        if (paddingChar === void 0) { paddingChar = ' '; }
        if (src.length >= length)
            return src;
        return paddingChar.repeat(length - src.length) + src;
    };
    Common.bolder = function (graphic) {
        var _this_1 = this;
        if (graphic instanceof Solid)
            graphic.fontName = "PingFangSC-Semibold";
        else if (graphic instanceof Group) {
            graphic.graphics
                .filter(function (item) { return item instanceof Solid; })
                .forEach(function (item) { return _this_1.bolder(item); });
        }
    };
    Common.size2point = function (size) {
        return new Point(size.width, size.height);
    };
    Common.invokeCachely = function (cache, key, invoker) {
        var value = cache[key];
        if (value)
            return value;
        value = invoker(key);
        cache[key] = value;
        return value;
    };
    /**  9 个磁极，9 宫格 */
    Common.magnets_6 = [
        new Point(-1.00, -1.00), new Point(-1.00, 0), new Point(-1.00, 1.00),
        new Point(0, -1.00), new Point(0, 0), new Point(0, 1.00),
        new Point(1.00, -1.00), new Point(1.00, 0), new Point(1.00, 1.00),
    ];
    /** 保存各 canvas 的配置，以 canvas.name 为 key */
    Common.canvasOptions = {};
    return Common;
}());
/**
 * 枚举，key 为名称，value 为索引，即针对后 3 项
 * GroupDirection：{0: "BOTTOM_UP", 1: "LEFT_RIGHT", 2: "RIGHT_LEFT", BOTTOM_UP: 0, LEFT_RIGHT: 1, RIGHT_LEFT: 2}
 */
var Enum = /** @class */ (function () {
    function Enum() {
    }
    Enum.view = function (enums) {
        var keys = Object.keys(enums);
        console.info("keys: ", keys);
        var values = Object.values(enums);
        console.info("values: ", values);
    };
    /**
     * 获取 键 集合，键是枚举名称。
     * Object.keys(GroupDirection)：0,1,2,3,LEFT_RIGHT,RIGHT_LEFT,UP_BOTTOM,BOTTOM_UP
     */
    Enum.keys = function (enums) {
        var keys = Object.keys(enums);
        return keys.slice(keys.length / 2);
    };
    /**
     * 获取 值 集合，值是枚举索引
     * Object.values(GroupDirection)：LEFT_RIGHT,RIGHT_LEFT,UP_BOTTOM,BOTTOM_UP,0,1,2,3
     */
    Enum.values = function (enums) {
        var keys = Object.values(enums);
        return keys.slice(keys.length / 2);
    };
    return Enum;
}());
/** 索引切换者。*/
var IndexSwitcher = /** @class */ (function () {
    function IndexSwitcher(start, end, current) {
        if (start === void 0) { start = 0; }
        if (end === void 0) { end = 10; }
        if (current === void 0) { current = 0; }
        this.step = 1;
        this.start = start;
        this.end = end;
        this.current = current;
    }
    IndexSwitcher.prototype.isStart = function () {
        return this.current === this.start;
    };
    IndexSwitcher.prototype.isEnd = function () {
        return this.current === this.end - 1;
    };
    IndexSwitcher.prototype.prev = function () {
        this.current = this.isStart() ? this.end : this.current - this.step;
        return this.current;
    };
    IndexSwitcher.prototype.next = function () {
        this.current = this.isEnd() ? this.start : this.current + this.step;
        return this.current;
    };
    return IndexSwitcher;
}());
/** 步进器上下文 */
var StepperContext = /** @class */ (function () {
    function StepperContext() {
        /**图形缓存，提供 key 共享访问*/
        this.graphics = {};
        /**不需要访问的图形，自动使用内部索引*/
        this.graphicIndex = 0;
    }
    StepperContext.prototype.addGraphic = function (graphic, key) {
        //删除已存在的图形
        if (key && key in this.graphics)
            this.graphics[key].remove();
        graphic.layer = this.layer;
        this.graphics[key || this.graphicIndex++] = graphic;
    };
    StepperContext.prototype.getGraphic = function (key) {
        return this.graphics[key];
    };
    StepperContext.prototype.clear = function () {
        var _this_1 = this;
        this.layer = Common.clearLayer(this.layer, 100);
        Object.keys(this.graphics).forEach(function (key) { return delete _this_1.graphics[key]; });
        return this;
    };
    return StepperContext;
}());
/**
 * 步进器。
 */
var Stepper = /** @class */ (function () {
    function Stepper() {
        /** 有多少步，每步执行哪些动作 */
        this.settings = [];
    }
    Stepper.switch = function (graphic) {
        var canvasName = Common.canvas().name;
        var stepper = Stepper.steppers[canvasName];
        // shift 强制重新配置
        if (app.shiftKeyDown || !stepper) {
            if (stepper)
                stepper.context.clear();
            var ctxName = this.ctxNameValue;
            graphic && (ctxName = graphic.userData[this.ctxNameKey]);
            return Stepper.steppers[canvasName] = Stepper.init(ctxName);
        }
        stepper.switch();
    };
    Stepper.init = function (ctxName) {
        var stepper = new Stepper();
        stepper.context = new StepperContext();
        stepper.context.stepper = stepper;
        stepper.context.layer = this.getLayer();
        // see Make.setup
        eval(ctxName).setup(stepper);
        stepper.indexSwitcher = new IndexSwitcher(0, stepper.settings.length);
        stepper.invoke();
        return stepper;
    };
    Stepper.getLayer = function () {
        var _this_1 = this;
        var layer = Common.canvas().layers.find(function (layer) { return layer.name === _this_1.layerName; });
        if (!layer) {
            layer = Common.canvas().newLayer();
            layer.name = this.layerName;
        }
        return layer;
    };
    Stepper.prototype.switch = function () {
        this.invoke(app.optionKeyDown ? this.indexSwitcher.prev() : this.indexSwitcher.next());
    };
    Stepper.prototype.invoke = function (index) {
        var _this_1 = this;
        if (index === void 0) { index = this.indexSwitcher.current; }
        this.settings[index].forEach(function (handler) { return handler(_this_1.context); });
    };
    Stepper.prototype.autoSwitch = function (interval) {
        var _this_1 = this;
        if (interval === void 0) { interval = 1; }
        this.switch();
        if (this.indexSwitcher.isEnd())
            return;
        Timer.once(interval, function () { return _this_1.autoSwitch(); });
    };
    Stepper.clear = function (ctx) {
        ctx.clear();
    };
    Stepper.next = function (ctx) {
        ctx.stepper.switch();
    };
    Stepper.steppers = {};
    Stepper.ctxNameKey = "stepper.ctx";
    Stepper.ctxNameValue = "Make";
    Stepper.layerName = "stepper";
    return Stepper;
}());
var MakeStepperContext = /** @class */ (function (_super) {
    __extends(MakeStepperContext, _super);
    function MakeStepperContext() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MakeStepperContext;
}(StepperContext));
var Make = /** @class */ (function () {
    function Make() {
    }
    Make.setup = function (stepper) {
        var context = stepper.context;
        context.refer = (Common.selectedGraphic() || Common.canvas().graphicWithName(Make.referName));
        context.origin = context.refer.geometry.origin.add(new Point(context.refer.geometry.width, 0));
        context.lineHeight = Make.calLineHeight(context.refer);
        var moveStep1 = Make.moveLinePointer;
        var moveStep2 = Make.buildMoveLinePointer(2);
        var moveStep3 = Make.buildMoveLinePointer(3.5);
        var moveStep7 = Make.buildMoveLinePointer(7);
        var backStep10 = Make.buildMoveLinePointer(-10);
        var settings = [];
        settings.push([Stepper.clear, Stepper.next]);
        settings.push([Make.newLinePointer]);
        settings.push([moveStep1, Make.newImmediate]);
        settings.push([moveStep1, Make.newDeferred]);
        settings.push([moveStep1, Make.newImmediate2]);
        settings.push([moveStep1, Make.immediateAssign2]);
        settings.push([moveStep1, function (ctx) { return Make.drawText(ctx, "phases.1:"); }]);
        settings.push([moveStep2, function (ctx) { return Make.drawText(ctx, "phases.2:"); }]);
        settings.push([moveStep2, function (ctx) { return Make.drawText(ctx, "phases.case: phases.1 phases.2"); }]);
        settings.push([moveStep7, Make.immediateAssign3]);
        settings.push([backStep10, function (ctx) { return Make.drawText(ctx, "  phases.1"); }]);
        settings.push([moveStep2, function (ctx) { return Make.drawText(ctx, "   phases.2"); }]);
        settings.push([moveStep3, function (ctx) { return Make.drawText(ctx, "   phases.1 phases.2"); }]);
        settings.push([moveStep1, function (ctx) { return Make.drawText(ctx, "   phases.immediate: 3"); }]);
        settings.push([moveStep1, function (ctx) { return Make.drawText(ctx, "   phases.immediate2: 1"); }]);
        settings.push([moveStep1, function (ctx) { return Make.drawText(ctx, "   phases.deferred: 3"); }]);
        stepper.settings = settings;
    };
    Make.calLineHeight = function (graphic) {
        var lineCount = graphic.text.split("\n").length;
        var totalLineHeight = graphic.geometry.height - graphic.textVerticalPadding * 2;
        return totalLineHeight / lineCount;
    };
    Make.newLinePointer = function (ctx) {
        var line = Common.canvas().newLine();
        var start = ctx.origin.add(new Point(-100, ctx.refer.textVerticalPadding + ctx.lineHeight / 2 + ctx.lineHeight * 2));
        line.points = [start, start.subtract(new Point(Make.linePointerWidth, 0))];
        line.headType = "FilledArrow";
        ctx.addGraphic(line, Make.linePointer);
    };
    Make.moveLinePointer = function (ctx, stepCount) {
        if (stepCount === void 0) { stepCount = 1; }
        Common.moveLine(ctx.getGraphic(Make.linePointer), new Point(0, ctx.lineHeight * stepCount));
    };
    Make.buildMoveLinePointer = function (stepCount) {
        if (stepCount === void 0) { stepCount = 1; }
        return function (ctx) { return Make.moveLinePointer(ctx, stepCount); };
    };
    Make.currentContentPoint = function (ctx) {
        var linePointer = ctx.getGraphic(Make.linePointer);
        return new Point(ctx.origin.x + Make.contentOffset, linePointer.points[0].y);
    };
    Make.drawText = function (ctx, text, key, offset) {
        var point = Make.currentContentPoint(ctx);
        if (offset)
            point = point.add(offset);
        var solid = Common.canvas().addText(text, point);
        solid.textSize = 12;
        ctx.addGraphic(solid, key);
        return solid;
    };
    Make.connect = function (ctx, head, tail, key) {
        var line = Common.canvas().connect(head, tail);
        line.headType = "FilledArrow";
        ctx.addGraphic(line, key);
        return line;
    };
    Make.newImmediate = function (ctx) {
        var immediate = Make.drawText(ctx, "phases.immediate", Make.immediate);
        var value1 = Make.drawText(ctx, "1", Make.value1, new Point(150, 0));
        Make.connect(ctx, immediate, value1, Make.immediateLine);
    };
    Make.newDeferred = function (ctx) {
        var deferred = Make.drawText(ctx, "phases.deferred", Make.deferred, new Point(-50, 0));
        Make.connect(ctx, deferred, ctx.getGraphic(Make.immediate), Make.deferredLine);
    };
    Make.newImmediate2 = function (ctx) {
        var immediate2 = Make.drawText(ctx, "phases.immediate2", Make.immediate2);
        Make.connect(ctx, immediate2, ctx.getGraphic(Make.value1), Make.immediate2Line);
    };
    Make.immediateAssign2 = function (ctx) {
        var value2 = Make.drawText(ctx, "2", Make.value2, new Point(150, 0));
        Make.connect(ctx, ctx.getGraphic(Make.immediate), value2, Make.immediateLine);
    };
    Make.immediateAssign3 = function (ctx) {
        var value3 = Make.drawText(ctx, "3", Make.value3, new Point(150, 0));
        Make.connect(ctx, ctx.getGraphic(Make.immediate), value3, Make.immediateLine);
    };
    Make.linePointerWidth = 100;
    Make.contentOffset = 100;
    Make.referName = "case";
    Make.linePointer = "linePointer";
    Make.immediate = "immediate";
    Make.value1 = "value1";
    Make.immediateLine = "immediateLine";
    Make.deferred = "deferred";
    Make.deferredLine = "deferredLine";
    Make.immediate2 = "immediate2";
    Make.immediate2Line = "immediate2Line";
    Make.value2 = "value2";
    Make.value3 = "value3";
    return Make;
}());
/** 图层切换模式 */
var LayerSwitchMode;
(function (LayerSwitchMode) {
    LayerSwitchMode[LayerSwitchMode["rotate"] = 0] = "rotate";
    LayerSwitchMode[LayerSwitchMode["increase"] = 1] = "increase";
    LayerSwitchMode[LayerSwitchMode["custom"] = 2] = "custom";
})(LayerSwitchMode || (LayerSwitchMode = {}));
/**
 * 图层切换器。
 */
var LayerSwitcher = /** @class */ (function () {
    function LayerSwitcher() {
        /**哪些图层参与切换*/
        this.layers = [];
        /**可以切换多少次，每次显示哪些图层*/
        this.settings = [];
    }
    /**
     * 切换图层。
     * @param [graphic] 图形，该图形上记录着图层切换参数
     */
    LayerSwitcher.switch = function (graphic) {
        graphic && this.layerNamePrefixKey in graphic.userData
            ? this.switchByGraphic(graphic)
            : this.switchByForm();
    };
    /**
     * 切换图层通过表单参数。
     */
    LayerSwitcher.switchByForm = function () {
        var _this_1 = this;
        var canvasName = Common.canvas().name;
        var layerSwitcher = LayerSwitcher.layerSwitchers[canvasName];
        // shift 强制重新配置
        if (app.shiftKeyDown || !layerSwitcher) {
            var form = new Form();
            form.addField(new Form.Field.String(this.layerNamePrefixKey, "图层名称前缀", this.layerNamePrefix, null), 0);
            form.addField(new Form.Field.Option(this.layerSwitchModeKey, "图层切换模式", Object.values(LayerSwitchMode).slice(3), ["轮换", "渐显", "自定义"], this.layerSwitchMode, null), 1);
            form.addField(new Form.Field.String(this.layerCustomSettingsKey, "图层自定义配置", JSON.stringify(this.layerCustomSettings), null), 2);
            return form.show("配置图层切换参数", "确定")
                .then(function (response) {
                var values = response.values;
                LayerSwitcher.layerSwitchers[canvasName] = LayerSwitcher.init(values[_this_1.layerNamePrefixKey], values[_this_1.layerSwitchModeKey], JSON.parse(values[_this_1.layerCustomSettingsKey]));
            })
                .catch(function (response) { return console.error("error:", response); });
        }
        layerSwitcher.switch();
    };
    /**
     * 切换图层通过图形参数。
     *
     * @param graphic 图形，该图形上记录着图层切换参数
     */
    LayerSwitcher.switchByGraphic = function (graphic) {
        var layerSwitcher = LayerSwitcher.layerSwitchers[graphic.name];
        if (app.shiftKeyDown || !layerSwitcher) {
            var layerNamePrefix = graphic.userData[this.layerNamePrefixKey];
            var layerSwitchMode = LayerSwitchMode[graphic.userData[this.layerSwitchModeKey]];
            var layerCustomSettings = graphic.userData[this.layerCustomSettingsKey];
            return this.layerSwitchers[graphic.name] = LayerSwitcher.init(layerNamePrefix, layerSwitchMode, layerCustomSettings);
        }
        layerSwitcher.switch();
    };
    LayerSwitcher.init = function (layerNamePrefix, layerSwitchMode, layerCustomSettings) {
        if (layerNamePrefix === void 0) { layerNamePrefix = LayerSwitcher.layerNamePrefix; }
        if (layerSwitchMode === void 0) { layerSwitchMode = LayerSwitchMode.rotate; }
        var layerSwitcher = new LayerSwitcher();
        // 图层顺序：底部的图层排在前面，顶上的图层排在后面
        layerSwitcher.layers = Common.canvas().layers.filter(function (layer) { return layer.name.startsWith(layerNamePrefix); }).reverse();
        if (layerSwitchMode == LayerSwitchMode.rotate) {
            layerSwitcher.settings = layerSwitcher.layers.map(function (layer, index) { return [index]; });
        }
        else if (layerSwitchMode == LayerSwitchMode.increase) {
            layerSwitcher.settings = layerSwitcher.layers.map(function (layer, index) { return Array.from({ length: index + 1 }, function (_, i) { return i; }); });
        }
        else {
            layerSwitcher.settings = layerCustomSettings;
        }
        layerSwitcher.settings.unshift([]); //最初不显示任何图层
        layerSwitcher.indexSwitcher = new IndexSwitcher(0, layerSwitcher.settings.length);
        layerSwitcher.show();
        return layerSwitcher;
    };
    LayerSwitcher.prototype.switch = function () {
        this.show(app.optionKeyDown ? this.indexSwitcher.prev() : this.indexSwitcher.next());
    };
    LayerSwitcher.prototype.show = function (index) {
        var _this_1 = this;
        if (index === void 0) { index = this.indexSwitcher.current; }
        this.hiddenAll();
        index in this.settings
            && this.settings[index]
                .filter(function (item) { return item in _this_1.layers; })
                .forEach(function (item) { return _this_1.layers[item].visible = true; });
    };
    LayerSwitcher.prototype.hiddenAll = function () {
        for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
            var layer = _a[_i];
            layer.visible = false;
        }
    };
    /**图形名称前缀键*/
    LayerSwitcher.layerNamePrefixKey = "layer-name-prefix";
    /**图形切换模式键*/
    LayerSwitcher.layerSwitchModeKey = "layer-switch-mode";
    /**图形自定义设置键*/
    LayerSwitcher.layerCustomSettingsKey = "layer-custom-settings";
    LayerSwitcher.layerNamePrefix = "layer";
    LayerSwitcher.layerSwitchMode = LayerSwitchMode.increase;
    LayerSwitcher.layerCustomSettings = [[0]];
    LayerSwitcher.layerArguments = (_b = {},
        _b[LayerSwitcher.layerNamePrefixKey] = LayerSwitcher.layerNamePrefix,
        _b[LayerSwitcher.layerSwitchModeKey] = LayerSwitcher.layerSwitchMode,
        _b[LayerSwitcher.layerCustomSettingsKey] = LayerSwitcher.layerCustomSettings,
        _b);
    LayerSwitcher.layerSwitchers = {};
    return LayerSwitcher;
}());
var TablePainter = /** @class */ (function () {
    function TablePainter() {
    }
    /**
     * 绘制表格。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param texts 文本
     * @return 形状
     */
    TablePainter.prototype.drawTable = function (canvas, origin, texts) {
        var _this_1 = this;
        var increase = new Point(0, 0);
        return new Group(texts.map(function (item, index) {
            origin = index === 0 ? origin : origin = origin.add(increase);
            return _this_1.drawRow(canvas, origin, item);
        }));
    };
    /**
     * 绘制行。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param texts 文本
     * @return 形状
     */
    TablePainter.prototype.drawRow = function (canvas, origin, texts) {
        return undefined;
    };
    TablePainter.extractGraphicTexts = function (graphic) {
        var _this_1 = this;
        var texts = [];
        if (!(graphic instanceof Array))
            graphic = [graphic];
        graphic.forEach(function (item) { return _this_1.extractGraphicTextsRecursively(item, texts); });
        return texts;
    };
    TablePainter.extractGraphicTextsRecursively = function (graphic, texts) {
        if (graphic instanceof Solid) {
            texts.push(this.extractSolidText(graphic));
        }
        else if (graphic instanceof Group) {
            if (graphic instanceof Table) {
                texts.push.apply(texts, this.extractTableTexts(graphic));
            }
            else {
                for (var _i = 0, _a = graphic.graphics; _i < _a.length; _i++) {
                    var subGraphic = _a[_i];
                    this.extractGraphicTextsRecursively(subGraphic, texts);
                }
            }
        }
    };
    TablePainter.extractTableTexts = function (table) {
        var texts = [];
        for (var i = 0; i < table.rows; i++) {
            texts.push([]);
            for (var j = 0; j < table.columns; j++) {
                var graphic = table.graphicAt(i, j);
                graphic && graphic instanceof Solid && (texts[i][j] = this.extractSolidText(graphic));
            }
        }
        return texts;
    };
    TablePainter.extractSolidText = function (solid) {
        return solid.text;
    };
    return TablePainter;
}());
/**
 * 组方向即数据展示方向。
 * 绘图方向始终是从上向下，数据展示方向则有多种可能。
 * 内存块集合传入时约定为升序排列（无序会自动排序），
 * 通过控制内存块集合的排序（升序/降序），可以控制内存的显示方向
 */
var GroupDirection;
(function (GroupDirection) {
    GroupDirection[GroupDirection["LEFT_RIGHT"] = 0] = "LEFT_RIGHT";
    GroupDirection[GroupDirection["RIGHT_LEFT"] = 1] = "RIGHT_LEFT";
    GroupDirection[GroupDirection["UP_BOTTOM"] = 2] = "UP_BOTTOM";
    GroupDirection[GroupDirection["BOTTOM_UP"] = 3] = "BOTTOM_UP";
})(GroupDirection || (GroupDirection = {}));
/** 提供空实现。 */
var GroupDirectionHandlerAdapter = /** @class */ (function () {
    function GroupDirectionHandlerAdapter() {
    }
    GroupDirectionHandlerAdapter.prototype.order = function (blocks) {
    };
    GroupDirectionHandlerAdapter.prototype.getNextOrigin = function (painter, origin) {
        return origin;
    };
    return GroupDirectionHandlerAdapter;
}());
/** 顺序的 */
var SequentialGroupDirectionHandler = /** @class */ (function (_super) {
    __extends(SequentialGroupDirectionHandler, _super);
    function SequentialGroupDirectionHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SequentialGroupDirectionHandler.defaults = new SequentialGroupDirectionHandler();
    return SequentialGroupDirectionHandler;
}(GroupDirectionHandlerAdapter));
/** 逆序的 */
var ReverseGroupDirectionHandler = /** @class */ (function (_super) {
    __extends(ReverseGroupDirectionHandler, _super);
    function ReverseGroupDirectionHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /** 排序内存块集合 */
    ReverseGroupDirectionHandler.prototype.order = function (blocks) {
        blocks.reverse();
    };
    ReverseGroupDirectionHandler.defaults = new ReverseGroupDirectionHandler();
    return ReverseGroupDirectionHandler;
}(GroupDirectionHandlerAdapter));
var HorizontalGroupDirectionHandler = /** @class */ (function (_super) {
    __extends(HorizontalGroupDirectionHandler, _super);
    function HorizontalGroupDirectionHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HorizontalGroupDirectionHandler.prototype.getNextOrigin = function (painter, origin) {
        return origin.add(new Point(painter.cellSize.width, 0));
    };
    HorizontalGroupDirectionHandler.defaults = new HorizontalGroupDirectionHandler();
    return HorizontalGroupDirectionHandler;
}(GroupDirectionHandlerAdapter));
var VerticalGroupDirectionHandler = /** @class */ (function (_super) {
    __extends(VerticalGroupDirectionHandler, _super);
    function VerticalGroupDirectionHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VerticalGroupDirectionHandler.prototype.getNextOrigin = function (painter, origin) {
        return origin.add(new Point(0, painter.cellSize.height));
    };
    VerticalGroupDirectionHandler.defaults = new VerticalGroupDirectionHandler();
    return VerticalGroupDirectionHandler;
}(GroupDirectionHandlerAdapter));
var CompositeGroupDirectionHandler = /** @class */ (function () {
    function CompositeGroupDirectionHandler(orderHandler, axisHandler) {
        this.orderHandler = orderHandler;
        this.axisHandler = axisHandler;
    }
    CompositeGroupDirectionHandler.prototype.order = function (elements) {
        this.orderHandler.order(elements);
    };
    CompositeGroupDirectionHandler.prototype.getNextOrigin = function (painter, origin) {
        return this.axisHandler.getNextOrigin(painter, origin);
    };
    return CompositeGroupDirectionHandler;
}());
/**
 * 组绘制者，绘制一组相关元素。
 *
 * @param <E> 元素类型
 */
var GroupPainter = /** @class */ (function () {
    function GroupPainter() {
        this.cellSize = new Size(200, 20);
        this.cellTextSize = 12;
        this.cellFillColor = Color.RGB(1.0, 1.0, 0.75, null); // 黄色
        this.direction = GroupDirection.UP_BOTTOM;
    }
    GroupPainter.buildDirectionHandlers = function () {
        var _a;
        var directionHandlers = (_a = {},
            _a[GroupDirection.LEFT_RIGHT] = new CompositeGroupDirectionHandler(SequentialGroupDirectionHandler.defaults, HorizontalGroupDirectionHandler.defaults),
            _a[GroupDirection.RIGHT_LEFT] = new CompositeGroupDirectionHandler(ReverseGroupDirectionHandler.defaults, HorizontalGroupDirectionHandler.defaults),
            _a[GroupDirection.UP_BOTTOM] = new CompositeGroupDirectionHandler(SequentialGroupDirectionHandler.defaults, VerticalGroupDirectionHandler.defaults),
            _a[GroupDirection.BOTTOM_UP] = new CompositeGroupDirectionHandler(ReverseGroupDirectionHandler.defaults, VerticalGroupDirectionHandler.defaults),
            _a);
        Object.keys(directionHandlers).forEach(function (value, index) {
            directionHandlers[value] = Logger.proxyInstance(directionHandlers[value]);
        });
        return directionHandlers;
    };
    /**
     * 绘制。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param content 内容
     * @return 形状
     */
    GroupPainter.prototype.draw = function (canvas, origin, content) {
        var _this_1 = this;
        var directionHandler = this.getDirectionHandler();
        directionHandler.order(content);
        return new Group(content.map(function (text, index) {
            origin = index === 0 ? origin : directionHandler.getNextOrigin(_this_1, origin);
            return _this_1.drawCell(canvas, origin, text);
        }));
    };
    GroupPainter.prototype.getDirectionHandler = function () {
        return GroupPainter.directionHandlers[this.direction];
    };
    GroupPainter.directionHandlers = GroupPainter.buildDirectionHandlers();
    GroupPainter.cellFillColors = {
        "[anon]": Color.RGB(0.75, 1.0, 0.75, null),
        "": Color.RGB(0.8, 0.8, 0.8, null),
        "*": Color.RGB(0.75, 1.0, 1.0, null), // 蓝色，有效数据
    };
    return GroupPainter;
}());
/**
 * 组绘制者，绘制一组相关元素。
 *
 * @param <E> 元素类型
 */
var StringGroupPainter = /** @class */ (function (_super) {
    __extends(StringGroupPainter, _super);
    function StringGroupPainter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    StringGroupPainter.instance = function (options) {
        return Logger.proxyInstance(Object.assign(new StringGroupPainter(), options));
    };
    /**
     * 绘制地址空间布局。
     *
     * @param canvas 画布
     * @param origin 起点
     * @return 虚拟内存图
     */
    StringGroupPainter.draw = function (canvas, origin) {
        var _this_1 = this;
        if (canvas === void 0) { canvas = Common.canvas(); }
        if (origin === void 0) { origin = Common.windowCenterPoint(); }
        var canvasName = canvas.name;
        var painter = StringGroupPainter.canvasCache[canvasName];
        // shift 强制重新配置
        if (app.shiftKeyDown || !painter) {
            var form = new Form();
            form.addField(new Form.Field.Option(this.modeKey, "绘制模式", Enum.values(GroupDirection), Enum.keys(GroupDirection), this.modeValue, null), 0);
            return form.show("配置地址空间绘制参数", "确定")
                .then(function (response) {
                painter = _this_1.instance({ direction: response.values[_this_1.modeKey] });
                StringGroupPainter.canvasCache[canvasName] = painter;
                painter.drawInteractively(canvas, origin);
            })
                .catch(function (response) { return Logger.getLogger().error("error:", response); });
        }
        // option 重新选择文件
        if (app.optionKeyDown)
            Common.option(canvas, MemoryPainter.drawMemoryLocationKey, null);
        return painter.drawInteractively(canvas, origin);
    };
    StringGroupPainter.drawScript = function (options) {
        return this.instance(__assign(__assign({}, options), { direction: GroupDirection[options.direction] }))
            .draw(Common.canvas(), Common.windowCenterPoint(), options.content);
    };
    /**
     * 交互式地绘制虚拟内存。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param [content] 内容
     * @return 虚拟内存图
     */
    StringGroupPainter.prototype.drawInteractively = function (canvas, origin, content) {
        var _this_1 = this;
        if (canvas === void 0) { canvas = Common.canvas(); }
        if (origin === void 0) { origin = Common.windowCenterPoint(); }
        return Common.readFileContentSelectively(canvas, StringGroupPainter.locationKey, content)
            .then(function (response) {
            return JSON.parse(response.data);
        })
            .then(function (response) { return _this_1.draw(canvas, origin, response); })
            .catch(function (response) { return Logger.getLogger().error(response); });
    };
    /**
     * 绘制单元格。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param text 文本
     * @return 形状
     */
    StringGroupPainter.prototype.drawCell = function (canvas, origin, text) {
        var shape = canvas.newShape();
        shape.geometry = new Rect(origin.x, origin.y, this.cellSize.width, this.cellSize.height);
        shape.shadowColor = null;
        this.cellTextSize && (shape.textSize = this.cellTextSize);
        this.cellFillColor = StringGroupPainter.cellFillColors[text || ""] || StringGroupPainter.cellFillColors["*"];
        this.cellFillColor && (shape.fillColor = this.cellFillColor);
        text && (shape.text = text);
        shape.magnets = Common.magnets_6;
        return shape;
    };
    var _c;
    _c = StringGroupPainter;
    /** 倾向于水平绘图，宽度调小 */
    StringGroupPainter.horizontal = StringGroupPainter.instance({ cellSize: new Size(150, 20) });
    StringGroupPainter.vertical = StringGroupPainter.instance({ cellSize: new Size(200, 20) });
    StringGroupPainter.defaults = _c.horizontal;
    /** 缓存每个 canvas 使用的 Painter */
    StringGroupPainter.canvasCache = {};
    /** 绘制模式-键 */
    StringGroupPainter.modeKey = "mode";
    /** 绘制模式-默认值*/
    StringGroupPainter.modeValue = GroupDirection.BOTTOM_UP;
    /** 文件位置键 */
    StringGroupPainter.locationKey = _c.name;
    return StringGroupPainter;
}(GroupPainter));
var ClassDiagram = /** @class */ (function () {
    function ClassDiagram() {
    }
    ClassDiagram.parse = function (content) {
        var classDiagram = Object.assign(new ClassDiagram(), content);
        classDiagram.entities = content.entities.map(function (item) { return Entity.parse(item); });
        return classDiagram;
    };
    return ClassDiagram;
}());
var Entity = /** @class */ (function () {
    function Entity() {
    }
    Entity.parse = function (content) {
        var entity = Object.assign(new Entity(), content);
        entity.properties = content.properties.map(function (item) { return EntityProperty.parse(item); });
        return entity;
    };
    Entity.prototype.toString = function () {
        var _a;
        return JSON.stringify(__assign(__assign({}, this), { properties: (_a = this.properties) === null || _a === void 0 ? void 0 : _a.length }));
    };
    return Entity;
}());
var EntityProperty = /** @class */ (function () {
    function EntityProperty() {
    }
    EntityProperty.parse = function (content) {
        return Object.assign(new EntityProperty(), content);
    };
    EntityProperty.prototype.toString = function () {
        var _a;
        return JSON.stringify(__assign(__assign({}, this), { entity: (_a = this.entity) === null || _a === void 0 ? void 0 : _a.name }));
    };
    return EntityProperty;
}());
var Instance = /** @class */ (function () {
    function Instance() {
    }
    Instance.parse = function (content) {
        var entity = Object.assign(new Instance(), content);
        entity.properties = content.properties.map(function (item) { return InstanceProperty.parse(__assign(__assign({}, item), { instance: entity })); });
        return entity;
    };
    Instance.prototype.toString = function () {
        var _a;
        return JSON.stringify(__assign(__assign({}, this), { properties: (_a = this.properties) === null || _a === void 0 ? void 0 : _a.length }));
    };
    return Instance;
}());
var InstanceProperty = /** @class */ (function () {
    function InstanceProperty() {
    }
    InstanceProperty.parse = function (content) {
        return Object.assign(new InstanceProperty(), content);
    };
    InstanceProperty.prototype.toString = function () {
        var _a;
        return JSON.stringify(__assign(__assign({}, this), { instance: (_a = this.instance) === null || _a === void 0 ? void 0 : _a.type }));
    };
    return InstanceProperty;
}());
var ClassDiagramPainter = /** @class */ (function () {
    function ClassDiagramPainter() {
        this.table = StringGroupPainter.defaults;
        this.offset = new Size(100, 100);
    }
    /** 插件入口 */
    ClassDiagramPainter.draw = function (canvas, origin) {
        if (canvas === void 0) { canvas = Common.canvas(); }
        if (origin === void 0) { origin = Common.windowCenterPoint(); }
        return this.defaults.drawInteractively(canvas, origin);
    };
    /** 脚本入口 */
    ClassDiagramPainter.drawScript = function (content) {
        return this.defaults.draw(Common.canvas(), Common.windowCenterPoint(), ClassDiagram.parse(content));
    };
    ClassDiagramPainter.prototype.drawInteractively = function (canvas, origin) {
        var _this_1 = this;
        return Common.readFileContentAssociatively(canvas, ClassDiagramPainter.locationKey)
            .then(function (response) {
            return _this_1.draw(canvas, origin, ClassDiagram.parse(JSON.parse(response.data)));
        })
            .catch(function (response) { return Logger.getLogger().error(response); });
    };
    ClassDiagramPainter.resetCache = function (entities) {
        ClassDiagramPainter.entities = entities;
        ClassDiagramPainter.entityGraphics = {};
    };
    ClassDiagramPainter.invokeCachely = function (key, invoker) {
        return Common.invokeCachely(ClassDiagramPainter.entityGraphics, key, invoker);
    };
    ClassDiagramPainter.prototype.draw = function (canvas, origin, classDiagram) {
        var _this_1 = this;
        ClassDiagramPainter.resetCache(classDiagram.entities);
        // 水平方法绘制实体类
        var increase = new Point(this.table.cellSize.width + this.offset.width, 0);
        // let increase: Point = new Point(0, this.table.cellSize.height + this.offset.height);
        var entities = classDiagram.entities;
        if (classDiagram.entry)
            entities = classDiagram.entities.filter(function (item) { return item.name == classDiagram.entry; });
        return entities.map(function (entity, index) {
            return ClassDiagramPainter.invokeCachely(entity.name, function () {
                origin = index === 0 ? origin : origin.add(increase);
                return _this_1.drawEntity(canvas, origin, entity);
            });
        });
    };
    ClassDiagramPainter.prototype.drawEntity = function (canvas, origin, entity) {
        var _this_1 = this;
        var increase = new Point(0, this.table.cellSize.height);
        var header = this.drawHeader(canvas, origin, entity.name);
        var properties = entity.properties.map(function (property, index) {
            return _this_1.drawProperty(canvas, origin = origin.add(increase), property);
        });
        return new Group(__spreadArray([header], properties, true));
    };
    ClassDiagramPainter.prototype.drawHeader = function (canvas, origin, name) {
        var header = this.table.drawCell(canvas, origin, name);
        Common.bolder(header);
        return header;
    };
    ClassDiagramPainter.prototype.drawProperty = function (canvas, origin, property) {
        var cell = this.table.drawCell(canvas, origin, "".concat(property.type, ":").concat(property.name));
        cell.textHorizontalAlignment = HorizontalTextAlignment.Left;
        this.drawPropertyRef(canvas, origin, cell, property);
        return cell;
    };
    ClassDiagramPainter.prototype.drawPropertyRef = function (canvas, origin, propertyCell, property) {
        var _this_1 = this;
        if (!property.ref)
            return;
        var entity = ClassDiagramPainter.entities.find(function (item) { return item.name == property.ref; });
        if (!entity)
            return;
        origin = origin.add(new Point(this.table.cellSize.width + this.offset.width, 0));
        var entityGroup = ClassDiagramPainter.invokeCachely(entity.name, function () { return _this_1.drawEntity(canvas, origin, entity); });
        var entityHeader = entityGroup.graphics[entityGroup.graphics.length - 1];
        var line = canvas.connect(propertyCell, entityHeader);
        line.lineType = LineType.Orthogonal; // 直角
        line.tailMagnet = 8; // 磁极索引从 1 开始，逆时针转动
        line.headType = "FilledArrow";
        line.headMagnet = 2;
    };
    ClassDiagramPainter.locationKey = ClassDiagramPainter.name;
    ClassDiagramPainter.defaults = Logger.proxyInstance(new ClassDiagramPainter());
    ClassDiagramPainter.entities = [];
    ClassDiagramPainter.entityGraphics = {};
    return ClassDiagramPainter;
}());
/** 内存 */
var Memory = /** @class */ (function () {
    function Memory() {
        this.blocks = []; //内存块集合
        this.notes = []; //内存块注释
    }
    Memory.instance = function (content) {
        return Object.assign(new Memory(), content);
    };
    /** 解析内存数据 */
    Memory.parse = function (content, type) {
        if (type === "json") {
            var object = JSON.parse(content);
            return object instanceof Array
                ? this.instance({ blocks: MemoryBlock.parseObject(object) })
                : this.instance(__assign(__assign({}, object), { notes: MemoryNote.parseObject(object.notes), blocks: MemoryBlock.parseObject(object.blocks) }));
        }
        return this.instance({ blocks: MemoryBlock.parse(content, type) });
    };
    Memory.prototype.toString = function () {
        var _a;
        return JSON.stringify(__assign(__assign({}, this), { blocks: "[".concat((_a = this.blocks) === null || _a === void 0 ? void 0 : _a.length, "]") }));
    };
    return Memory;
}());
/** 内存块 */
var MemoryBlock = /** @class */ (function () {
    function MemoryBlock() {
    }
    MemoryBlock.construct = function (startAddress, endAddress, description) {
        var block = new MemoryBlock();
        block.startAddress = startAddress;
        block.endAddress = endAddress;
        block.description = description;
        return block;
    };
    /** 实例化 */
    MemoryBlock.instance = function (object) {
        if (typeof object === "string")
            return MemoryBlock.construct(undefined, undefined, object);
        return Object.assign(new MemoryBlock(), object);
    };
    MemoryBlock.parse = function (content, type) {
        switch (type) {
            case "maps":
                return this.parseMaps(content);
            case "frames":
                return this.parseFrames(content);
            case "json":
                return this.parseJson(content);
            default:
                return this.parseObject(content);
        }
    };
    /** 从 json 字符串解析 */
    MemoryBlock.parseJson = function (content) {
        return this.parseObject(JSON.parse(content));
    };
    MemoryBlock.parseObject = function (content) {
        var _this_1 = this;
        return content.map(function (item) { return _this_1.instance(item); });
    };
    /** 解析内存映射，升序排列。linux 下 /proc/<pid>/maps 内容 */
    MemoryBlock.parseMaps = function (content) {
        //1                                  2     3         4      5        6
        //561d970c5000-561d970c6000          r--p  00000000  08:03  1581273  /usr/lib/jvm/java-17-openjdk-amd64/bin/java
        var lines = content.split("\n");
        var blocks = lines
            .filter(function (line) { return line.trim(); }) // 删除空行
            .map(function (line) { return line.split(/ +/); }) // 按空格分割
            .map(function (elements) {
            var addresses = elements[0].split("-");
            // 16 个 f 需要使用 bigint 才能表示
            return MemoryBlock.construct(BigInt(parseInt(addresses[0], 16)), BigInt(parseInt(addresses[1], 16)), (elements[5] || "").split("/").pop() || "[anon]");
        });
        // 填充顶部
        blocks.unshift(MemoryBlock.construct(BigInt(0), blocks[0].startAddress)); // 从 0 开始显示
        // 填充尾部
        blocks.push(MemoryBlock.construct(blocks[blocks.length - 1].endAddress, // bigint 和 bigint 才能相减求 size
        BigInt("0xffffffffffffffff")));
        this.merge(blocks);
        return blocks;
    };
    /** 解析栈帧信息，升序排列 */
    MemoryBlock.parseFrames = function (content) {
        // * thread #1, name = 'thread.bin'
        //   * {"startAddress": "0x00007fffffffdf70", "endAddress": "0x00007fffffffe050", "description": "libc.so.6`__GI___futex_abstimed_wait_cancelable64" }
        var lines = content.split("\n").filter(function (item) { return item.trim(); });
        lines = Array.from(new Set(lines)); // 除重
        return lines.map(function (line) { return line.substr(line.indexOf("*") + 1); })
            .map(function (item) { return JSON.parse(item); })
            .map(function (item) { return MemoryBlock.construct(parseInt(item.startAddress, 16), parseInt(item.endAddress, 16), item.description); })
            // 过滤掉 {"startAddress": "0x00007fffffffe1b0", "endAddress": "0x0000000000000000", "description": "thread.bin`_start" }
            .filter(function (item) { return item.endAddress > item.startAddress; });
    };
    MemoryBlock.prototype.size = function () {
        return MemoryBlock.subtract(this.endAddress, this.startAddress);
    };
    MemoryBlock.prototype.toString = function () {
        return "'".concat(this.description, "':").concat(this.startAddress, "~").concat(this.endAddress);
    };
    /** 获取最大的地址长度，需要将所有地址格式化成统一长度 */
    MemoryBlock.getMaxAddressLength = function (blocks, base) {
        if (base === void 0) { base = 10; }
        return Math.max.apply(Math, blocks.map(function (block) { return block.endAddress == null ? 0 : block.endAddress.toString(base).length; }));
    };
    MemoryBlock.subtract = function (left, right) {
        return Number(BigInt(left) - BigInt(right));
    };
    /** 按内存地址升序排列 */
    MemoryBlock.ascend = function (blocks) {
        blocks.sort(function (left, right) { return MemoryBlock.subtract(left.startAddress, right.startAddress); });
    };
    /** 按内存地址降序排列 */
    MemoryBlock.descend = function (blocks) {
        blocks.sort(function (left, right) { return MemoryBlock.subtract(right.startAddress, left.startAddress); });
    };
    /**
     * 对齐内存块集合，此函数要求内存块集合已有序排列。
     * 内存地址应该是连续的，在空缺处补齐。
     *
     * @param blocks 内存块集合
     * @param [asc] 内存块集合是否升序排列
     */
    MemoryBlock.padding = function (blocks, asc) {
        if (asc === void 0) { asc = true; }
        for (var i = 1; i < blocks.length; i++) {
            var prev = blocks[i - 1], curr = blocks[i];
            //地址不连续，补齐空缺
            if (asc) {
                if (prev.endAddress < curr.startAddress) {
                    blocks.splice(i, 0, MemoryBlock.construct(prev.endAddress, curr.startAddress));
                    i++;
                }
            }
            else {
                if (prev.startAddress > curr.endAddress) {
                    blocks.splice(i, 0, MemoryBlock.construct(curr.endAddress, prev.startAddress));
                    i++;
                }
            }
        }
    };
    /**
     * 合并相同描述的相邻内存块，此函数要求内存块集合已有序排列。
     *
     * @param blocks 内存块集合
     */
    MemoryBlock.merge = function (blocks) {
        for (var i = 1; i < blocks.length; i++) {
            var prev = blocks[i - 1], curr = blocks[i];
            if (prev.description === curr.description) {
                prev.endAddress = curr.endAddress; // 上一块的结束地址指向当前块的结束地址
                blocks.splice(i, 1); // 删除当前块
                i--;
            }
        }
    };
    return MemoryBlock;
}());
var MemoryNote = /** @class */ (function () {
    function MemoryNote() {
    }
    /** 实例化 */
    MemoryNote.instance = function (object) {
        return Object.assign(new MemoryNote(), object);
    };
    MemoryNote.parseObject = function (content) {
        var _this_1 = this;
        return content === null || content === void 0 ? void 0 : content.map(function (item) { return _this_1.instance(item); });
    };
    return MemoryNote;
}());
var MemoryDirectionHandlerAdapter = /** @class */ (function () {
    function MemoryDirectionHandlerAdapter() {
    }
    MemoryDirectionHandlerAdapter.prototype.order = function (blocks) {
    };
    MemoryDirectionHandlerAdapter.prototype.getNextOrigin = function (painter, origin) {
        return origin;
    };
    MemoryDirectionHandlerAdapter.prototype.getAddressLineOrigin = function (painter, origin) {
        return origin;
    };
    MemoryDirectionHandlerAdapter.prototype.getAddressLineEndpoint = function (painter, origin) {
        return origin;
    };
    MemoryDirectionHandlerAdapter.prototype.getAddressLabelOrigin = function (painter, origin) {
        return origin;
    };
    MemoryDirectionHandlerAdapter.prototype.getAddressStartValue = function (painter, block) {
        throw new Error("The method must be overwrite!");
    };
    MemoryDirectionHandlerAdapter.prototype.getAddressEndValue = function (painter, block) {
        throw new Error("The method must be overwrite!");
    };
    return MemoryDirectionHandlerAdapter;
}());
/** 顺序 */
var MemoryOrderHandler = /** @class */ (function (_super) {
    __extends(MemoryOrderHandler, _super);
    function MemoryOrderHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /** 排序内存块集合 */
    MemoryOrderHandler.prototype.order = function (blocks) {
        if (blocks.length > 0 && blocks[0].startAddress == undefined)
            return; //只有描述，没有坐标
        MemoryBlock.ascend(blocks);
        MemoryBlock.padding(blocks, true);
    };
    MemoryOrderHandler.prototype.getAddressStartValue = function (painter, block) {
        return block.startAddress;
    };
    MemoryOrderHandler.prototype.getAddressEndValue = function (painter, block) {
        return block.endAddress;
    };
    MemoryOrderHandler.defaults = new MemoryOrderHandler();
    return MemoryOrderHandler;
}(MemoryDirectionHandlerAdapter));
/** 逆序 */
var MemoryReverseHandler = /** @class */ (function (_super) {
    __extends(MemoryReverseHandler, _super);
    function MemoryReverseHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /** 排序内存块集合 */
    MemoryReverseHandler.prototype.order = function (blocks) {
        if (blocks.length > 0 && blocks[0].startAddress == undefined)
            return; //只有描述，没有坐标
        MemoryBlock.descend(blocks);
        MemoryBlock.padding(blocks, false);
    };
    MemoryReverseHandler.prototype.getAddressStartValue = function (painter, block) {
        return block.endAddress;
    };
    MemoryReverseHandler.prototype.getAddressEndValue = function (painter, block) {
        return block.startAddress;
    };
    MemoryReverseHandler.defaults = new MemoryReverseHandler();
    return MemoryReverseHandler;
}(MemoryDirectionHandlerAdapter));
var MemoryHorizontalHandler = /** @class */ (function (_super) {
    __extends(MemoryHorizontalHandler, _super);
    function MemoryHorizontalHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MemoryHorizontalHandler.prototype.getNextOrigin = function (painter, origin) {
        return origin.add(new Point(painter.table.cellSize.width, 0));
    };
    MemoryHorizontalHandler.prototype.getAddressLineOrigin = function (painter, origin) {
        return origin.add(new Point(0, painter.table.cellSize.height));
    };
    MemoryHorizontalHandler.prototype.getAddressLineEndpoint = function (painter, origin) {
        return origin.add(new Point(0, painter.addressLineLength));
    };
    MemoryHorizontalHandler.prototype.getAddressLabelOrigin = function (painter, origin) {
        return origin.add(new Point(0, 12 / 2));
    };
    MemoryHorizontalHandler.defaults = new MemoryHorizontalHandler();
    return MemoryHorizontalHandler;
}(MemoryDirectionHandlerAdapter));
var MemoryVerticalHandler = /** @class */ (function (_super) {
    __extends(MemoryVerticalHandler, _super);
    function MemoryVerticalHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MemoryVerticalHandler.prototype.getNextOrigin = function (painter, origin) {
        return origin.add(new Point(0, painter.table.cellSize.height));
    };
    MemoryVerticalHandler.prototype.getAddressLineEndpoint = function (painter, origin) {
        return origin.subtract(new Point(painter.addressLineLength, 0));
    };
    MemoryVerticalHandler.prototype.getAddressLabelOrigin = function (painter, origin) {
        return origin.subtract(new Point(painter.addressLabelTextLength / 2 * 8, 0));
    };
    MemoryVerticalHandler.defaults = new MemoryVerticalHandler();
    return MemoryVerticalHandler;
}(MemoryDirectionHandlerAdapter));
var AbstractMemoryDirectionHandler = /** @class */ (function () {
    function AbstractMemoryDirectionHandler(orderHandler, directionHandler) {
        this.orderHandler = orderHandler;
        this.directionHandler = directionHandler;
    }
    AbstractMemoryDirectionHandler.prototype.order = function (blocks) {
        this.orderHandler.order(blocks);
    };
    AbstractMemoryDirectionHandler.prototype.getAddressLabelOrigin = function (painter, origin) {
        return this.directionHandler.getAddressLabelOrigin(painter, origin);
    };
    AbstractMemoryDirectionHandler.prototype.getAddressLineEndpoint = function (painter, origin) {
        return this.directionHandler.getAddressLineEndpoint(painter, origin);
    };
    AbstractMemoryDirectionHandler.prototype.getAddressLineOrigin = function (painter, origin) {
        return this.directionHandler.getAddressLineOrigin(painter, origin);
    };
    AbstractMemoryDirectionHandler.prototype.getNextOrigin = function (painter, origin) {
        return this.directionHandler.getNextOrigin(painter, origin);
    };
    AbstractMemoryDirectionHandler.prototype.getAddressStartValue = function (painter, block) {
        return this.orderHandler.getAddressStartValue(painter, block);
    };
    AbstractMemoryDirectionHandler.prototype.getAddressEndValue = function (painter, block) {
        return this.orderHandler.getAddressEndValue(painter, block);
    };
    return AbstractMemoryDirectionHandler;
}());
var LeftRightHandler = /** @class */ (function (_super) {
    __extends(LeftRightHandler, _super);
    function LeftRightHandler() {
        return _super.call(this, MemoryOrderHandler.defaults, MemoryHorizontalHandler.defaults) || this;
    }
    return LeftRightHandler;
}(AbstractMemoryDirectionHandler));
var RightLeftHandler = /** @class */ (function (_super) {
    __extends(RightLeftHandler, _super);
    function RightLeftHandler() {
        return _super.call(this, MemoryReverseHandler.defaults, MemoryHorizontalHandler.defaults) || this;
    }
    return RightLeftHandler;
}(AbstractMemoryDirectionHandler));
var UpBottomHandler = /** @class */ (function (_super) {
    __extends(UpBottomHandler, _super);
    function UpBottomHandler() {
        return _super.call(this, MemoryOrderHandler.defaults, MemoryVerticalHandler.defaults) || this;
    }
    return UpBottomHandler;
}(AbstractMemoryDirectionHandler));
var BottomUpHandler = /** @class */ (function (_super) {
    __extends(BottomUpHandler, _super);
    function BottomUpHandler() {
        return _super.call(this, MemoryReverseHandler.defaults, MemoryVerticalHandler.defaults) || this;
    }
    return BottomUpHandler;
}(AbstractMemoryDirectionHandler));
/** 内存画师 */
var MemoryPainter = /** @class */ (function () {
    function MemoryPainter() {
        this.table = StringGroupPainter.defaults;
        this.direction = GroupDirection.BOTTOM_UP; //绘制方向
        this.showAddress = true; // 是否显示地址
        this.addressLineLength = 50;
        this.addressLabelSize = new Size(150, 20);
        this.addressLabelTextBase = 16; // 标签文本显示内存地址时使用的进制，栈时使用 10 进制，其他使用 16 进制
        this.addressLabelTextLength = 64 / 8 * 2; // 64 位系统使用 16 进制表示的长度
        this.showSize = true; // 是否显示占用空间
        this.sizeStyle = "inner"; // 占用空间显示样式：outer、inner
    }
    MemoryPainter._instance = function (painter, options) {
        Object.assign(painter, options);
        return Logger.proxyInstance(painter);
    };
    MemoryPainter.instance = function (options) {
        return this._instance(new MemoryPainter(), options);
    };
    MemoryPainter.instanceHorizontal = function (options) {
        var painter = new MemoryPainter();
        painter.table = StringGroupPainter.horizontal;
        painter.addressLineLength = 25;
        painter.addressLabelTextBase = 10;
        painter.showSize = false;
        return this._instance(painter, options);
    };
    MemoryPainter.buildDirectionHandlers = function () {
        var _a;
        var directionHandlers = (_a = {},
            _a[GroupDirection.LEFT_RIGHT] = new LeftRightHandler(),
            _a[GroupDirection.RIGHT_LEFT] = new RightLeftHandler(),
            _a[GroupDirection.UP_BOTTOM] = new UpBottomHandler(),
            _a[GroupDirection.BOTTOM_UP] = new BottomUpHandler(),
            _a);
        Object.keys(directionHandlers).forEach(function (value, index) {
            directionHandlers[value] = Logger.proxyInstance(directionHandlers[value]);
        });
        return directionHandlers;
    };
    MemoryPainter.prototype.getDirectionHandler = function () {
        return MemoryPainter.directionHandlers[this.direction];
    };
    /**
     * 绘制地址空间布局。
     *
     * @param canvas 画布
     * @param origin 起点
     * @return 虚拟内存图
     */
    MemoryPainter.drawMemory = function (canvas, origin) {
        var _this_1 = this;
        if (canvas === void 0) { canvas = Common.canvas(); }
        if (origin === void 0) { origin = Common.windowCenterPoint(); }
        var canvasName = canvas.name;
        var memory = MemoryPainter.canvasCache[canvasName];
        // shift 强制重新配置
        if (app.shiftKeyDown || !memory) {
            var form = new Form();
            form.addField(new Form.Field.Option(this.modeKey, "绘制模式", Enum.values(GroupDirection), Enum.keys(GroupDirection), this.modeValue, null), 0);
            return form.show("配置地址空间绘制参数", "确定")
                .then(function (response) {
                // Logger.getLogger().debug("form: ", response.values); // error
                Logger.getLogger().debug("modeKey: ", response.values[_this_1.modeKey]);
                Logger.getLogger().debug("GroupDirection: ", GroupDirection[response.values[_this_1.modeKey]]);
                memory = MemoryPainter[GroupDirection[response.values[_this_1.modeKey]]];
                Logger.getLogger().debug("direction: ", memory.direction);
                MemoryPainter.canvasCache[canvasName] = memory;
                memory.drawMemoryInteractively(canvas, origin);
            })
                .catch(function (response) { return Logger.getLogger().error("error:", response); });
        }
        // option 重新选择文件
        if (app.optionKeyDown)
            Common.option(canvas, MemoryPainter.drawMemoryLocationKey, null);
        return memory.drawMemoryInteractively(canvas, origin);
    };
    MemoryPainter.drawScript = function (_a) {
        var _b = _a.direction, direction = _b === void 0 ? GroupDirection[GroupDirection.BOTTOM_UP] : _b, _d = _a.type, type = _d === void 0 ? "json" : _d, content = _a.content;
        return this[direction].drawMemoryBlocks(Common.canvas(), Common.windowCenterPoint(), MemoryBlock.parse(content, type));
    };
    /**
     * 交互式地绘制虚拟内存。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param [content] 内容
     * @return 虚拟内存图
     */
    MemoryPainter.prototype.drawMemoryInteractively = function (canvas, origin, content) {
        var _this_1 = this;
        if (canvas === void 0) { canvas = Common.canvas(); }
        if (origin === void 0) { origin = Common.windowCenterPoint(); }
        return Common.readFileContentSelectively(canvas, MemoryPainter.drawMemoryLocationKey, content)
            .then(function (response) {
            return Memory.parse(response.data, response.url.toString().split(".").pop());
        })
            .then(function (response) { return _this_1.drawMemory(canvas, origin, response); })
            .catch(function (response) { return Logger.getLogger().error(response); });
    };
    /** 绘制虚拟内存 */
    MemoryPainter.prototype.drawMemory = function (canvas, origin, memory) {
        var blocks = this.drawMemoryBlocks(canvas, origin, memory.blocks);
        if (!memory.title)
            return blocks;
        var title = this.drawTitle(canvas, origin, memory.title);
        origin = Common.pointOfRect(blocks.geometry, "top-left");
        Common.moveToSolid(title, origin.subtract(new Point(0, title.geometry.height)));
        return new Group([title, blocks]);
    };
    /** 绘制虚拟内存标题 */
    MemoryPainter.prototype.drawTitle = function (canvas, origin, title) {
        var solid = canvas.addText(title, origin);
        Common.bolder(solid);
        solid.textSize = this.table.cellTextSize + 2;
        return solid;
    };
    /**
     * 绘制虚拟内存块，从下往上绘制。
     *
     * @param canvas 画布
     * @param origin 起点，矩形的左下点
     * @param blocks 内存块集合
     * @return 绘制的图形
     */
    MemoryPainter.prototype.drawMemoryBlocks = function (canvas, origin, blocks) {
        var _this_1 = this;
        this.getDirectionHandler().order(blocks);
        this.addressLabelTextLength = MemoryBlock.getMaxAddressLength(blocks, this.addressLabelTextBase);
        // MemoryBlock.merge(blocks);
        var array = blocks.map(function (block, index) {
            if (index !== 0)
                origin = _this_1.getDirectionHandler().getNextOrigin(_this_1, origin);
            // let prev = blocks[index - 1], curr = blocks[index];
            // if (prev.endAddress < curr.startAddress) {
            //   origin = origin.subtract(new Point(0, this.table.cellSize.height));
            // } else if (prev.endAddress > curr.startAddress) {
            //   origin = origin.add(new Point(0, this.table.cellSize.height / 2));
            // }
            return _this_1.drawMemoryBlock(canvas, origin, block);
        });
        return new Group(array);
    };
    /**
     * 绘制虚拟内存单元，从下往上绘制。
     *
     * @param canvas 画布
     * @param origin 起点，矩形左下角处位置
     * @param block 内存块
     * @return  绘制的图形
     */
    MemoryPainter.prototype.drawMemoryBlock = function (canvas, origin, block) {
        var cell = this.table.drawCell(canvas, origin, block.description);
        var directionHandler = this.getDirectionHandler();
        var endpoint = directionHandler.getNextOrigin(this, origin);
        var graphics = [cell];
        if (this.showAddress) {
            block.endAddress != null && graphics.push(this.drawMemoryAddress(canvas, origin, directionHandler.getAddressStartValue(this, block)));
            block.startAddress != null && graphics.push(this.drawMemoryAddress(canvas, endpoint, directionHandler.getAddressEndValue(this, block)));
        }
        if (this.showSize && block.startAddress != null && block.endAddress != null) {
            var size = block.size();
            if (this.sizeStyle === 'outer')
                graphics.push(this.drawMemorySize(canvas, endpoint, size));
            else
                cell.text += " (".concat(Common.formatMemorySize(size), ")");
        }
        return new Group(graphics);
    };
    /**
     * 绘制虚拟内存单元地址。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param address 地址
     * @return 绘制的图形
     */
    MemoryPainter.prototype.drawMemoryAddress = function (canvas, origin, address) {
        var line = canvas.newLine();
        origin = this.getDirectionHandler().getAddressLineOrigin(this, origin);
        line.points = [origin, this.getDirectionHandler().getAddressLineEndpoint(this, origin)];
        line.shadowColor = null;
        var formattedAddress = this.formatMemoryAddress(address);
        var labelOrigin = this.getDirectionHandler().getAddressLabelOrigin(this, line.points[1]);
        var label = canvas.addText(formattedAddress, labelOrigin);
        label.magnets = Common.magnets_6;
        this.table.cellTextSize && (label.textSize = this.table.cellTextSize);
        return new Group([line, label]);
    };
    /**
     * 格式化内存地址。
     *
     * @param address 内存地址
     * @return 内存地址描述
     */
    MemoryPainter.prototype.formatMemoryAddress = function (address) {
        var text = address < 0 ? '-' : ''; //符号位
        if (this.addressLabelTextBase === 16)
            text += '0x'; //16 进制标志
        var absAddress = address > 0 ? address : -address;
        var addressString = absAddress.toString(this.addressLabelTextBase);
        return text + Common.leftPad(addressString, this.addressLabelTextLength, '0').toUpperCase();
    };
    /**
     * 绘制内存空间尺寸。
     *
     * @param canvas 画布
     * @param origin 位置
     * @param size 空间尺寸
     * @return 绘制的图形
     */
    MemoryPainter.prototype.drawMemorySize = function (canvas, origin, size) {
        var upLine = canvas.newLine();
        upLine.shadowColor = null;
        var upLineStartPoint = new Point(origin.x - this.addressLineLength - this.addressLabelSize.width / 2, origin.y + this.addressLabelSize.height / 2);
        var upLineEndPoint = new Point(upLineStartPoint.x, upLineStartPoint.y + this.table.cellSize.height / 2 - this.addressLabelSize.height);
        upLine.points = [upLineStartPoint, upLineEndPoint];
        upLine.headType = "FilledArrow";
        var label = canvas.newShape();
        label.geometry = new Rect(upLineStartPoint.x - this.addressLabelSize.width / 2, upLineEndPoint.y, this.addressLabelSize.width, this.addressLabelSize.height);
        label.shadowColor = null;
        label.strokeThickness = 0;
        label.text = Common.formatMemorySize(size);
        label.textSize = 12;
        label.fillColor = null;
        label.textHorizontalAlignment = HorizontalTextAlignment.Center;
        var bottomLine = canvas.newLine();
        bottomLine.shadowColor = null;
        var bottomLineStartPoint = new Point(upLineStartPoint.x, origin.y + this.table.cellSize.height - this.addressLabelSize.height / 2);
        var bottomLineEndPoint = new Point(bottomLineStartPoint.x, bottomLineStartPoint.y - this.table.cellSize.height / 2 + this.addressLabelSize.height);
        bottomLine.points = [bottomLineStartPoint, bottomLineEndPoint];
        bottomLine.headType = "FilledArrow";
        return new Group([upLine, label, bottomLine]);
    };
    MemoryPainter.LEFT_RIGHT = MemoryPainter.instanceHorizontal({ direction: GroupDirection.LEFT_RIGHT });
    MemoryPainter.RIGHT_LEFT = MemoryPainter.instanceHorizontal({ direction: GroupDirection.RIGHT_LEFT });
    MemoryPainter.UP_BOTTOM = MemoryPainter.instance({ direction: GroupDirection.UP_BOTTOM });
    MemoryPainter.BOTTOM_UP = MemoryPainter.instance({ direction: GroupDirection.BOTTOM_UP });
    MemoryPainter.directionHandlers = MemoryPainter.buildDirectionHandlers();
    /** 缓存每个 canvas 使用的 MemoryPainter */
    MemoryPainter.canvasCache = {};
    /** 绘制模式-键 */
    MemoryPainter.modeKey = "mode";
    /** 绘制模式-默认值*/
    MemoryPainter.modeValue = GroupDirection.BOTTOM_UP;
    MemoryPainter.drawMemoryLocationKey = "drawMemoryLocation";
    return MemoryPainter;
}());
// 获取到当前 this 对象，代理其上属性时需要重新赋值
// var _this = this; // 错误的方式
//@formatter:off
var _this = (function () { return this; })();
//@formatter:on
(function () {
    var library = new PlugIn.Library(new Version("0.1"));
    [Common,
        GroupPainter, StringGroupPainter,
        Memory, MemoryBlock, MemoryPainter,
        ClassDiagram, Entity, EntityProperty, ClassDiagramPainter,
        Stepper, LayerSwitcher]
        .forEach(function (item) {
        library[item.name] = item;
        Logger.proxyClassStaticFunction(item);
    });
    // library.plugIn.resourceNamed("libs/logger.js").fetch(response => eval(response.toString()));
    // 反例：其他类库未完成初始化时，不能获取当前类库
    // 正例：library.plugIn.resourceNamed("logger.js").fetch(response => eval(response.toString()));
    // eval 时需要注意绑定的对象
    // library.loadClass = function (name, path = `libs/${name}.js`) {
    //   console.info("loadLib: ", path);
    //   if (name in Object) {
    //     console.info(`lib '${path}' loaded`);
    //     return new Promise((resolve, reject) => resolve(Object[name]))
    //   }
    //   return this.promiseUrlFetch(this.plugIn.resourceNamed(path))
    //     .then(response => {
    //       let content = response.data;
    //       console.info(`lib '${path}': \n`, content);
    //       eval(content);
    //       eval(`Object[name] = ${name}`);
    //       return Object[name];
    //     });
    // }
    // Logger.proxy(Common.name, _this);
    return library;
})();
