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
        if (this.isLevelEnabled(level)) {
            var levelName = LoggerLevel[level];
            var formattedLevelName = Logger.leftPad(levelName, 5, ' ');
            var indent = "  ".repeat(Logger.functionHierarchy);
            levelName = levelName.toLowerCase();
            Logger.log("Logger.log: levelName=".concat(levelName, ", levelName in console="), levelName in console);
            console[levelName in console ? levelName : "info"].apply(console, __spreadArray(["[".concat(formattedLevelName, "]"), indent], args, false));
        }
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
                if (target.hasOwnProperty(name)) {
                    return Reflect.get(target, name, receiver);
                }
                var value = target[name];
                if (typeof value === "function") {
                    return Logger.buildFunctionProxy(value, instance.constructor.name, name.toString());
                }
                return value;
            },
        });
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
                argumentsList.forEach(function (argument, index) { return logger.debug("[".concat(index, "]: ").concat(argument)); });
                var result = target.apply(thisArg, argumentsList);
                logger.debug("".concat(name, "(result): "), typeof result === "string" ? "'".concat(result, "'") : result);
                Logger.functionHierarchy--;
                return result;
            }
        });
    };
    /** 是否启用内部日志，仅针对 Logger 自身的方法 */
    Logger.enabledInnerLogger = false;
    /** 根日志分类 */
    Logger.CATEGORY_ROOT = "ROOT";
    /** 日志配置，不同的类和方法使用不同的日志级别 */
    Logger.config = (_a = {},
        _a[Logger.CATEGORY_ROOT] = LoggerLevel.DEBUG,
        _a["Common"] = LoggerLevel.DEBUG,
        _a["MemoryPainter.incrementOrigin"] = LoggerLevel.WARN,
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
            ? Common.promise({ data: content })
            : Common.readFileContentAssociatively(object, locationKey))
            .then(function (response) {
            Logger.getLogger().debug("response.data: \n", response.data);
            return __assign(__assign({}, response), { data: JSON.parse(response.data) });
        });
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
     * @param graphics  图形
     */
    Common.clearGraphicsText = function (graphics) {
        var _this_1 = this;
        if (graphics instanceof Array) {
            return graphics.forEach(function (graphic) { return _this_1.clearGraphicsText(graphic); });
        }
        if (graphics instanceof Group) {
            graphics.graphics.forEach(function (graphic) { return _this_1.clearGraphicsText(graphic); });
        }
        else {
            graphics.strokeType && (graphics.text = "");
        }
    };
    /**
     * 获取矩形指定位置处的点。方位顺序：上下左右，top-left。
     *
     * @param {Rect} rect 矩形
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
     * @param {Rect} rect 矩形
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
    /**
     * 定位到选中图形所在位置。
     */
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
    Common.loadClass = function (name, path) {
        if (path === void 0) { path = "libs/".concat(name, ".js"); }
        if (name in Object) {
            return new Promise(function (resolve, reject) { return resolve(Object[name]); });
        }
        return this.promiseUrlFetch(this.plugIn.resourceNamed(path))
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
    Common.test = function () {
    };
    /** 上下左右中 5 个磁极 */
    Common.magnets_5 = [new Point(0, 0),
        new Point(1.00, 1.00), new Point(1.00, -1.00),
        new Point(-1.00, -1.00), new Point(-1.00, 1.00),
    ];
    /** 保存各 canvas 的配置，以 canvas.name 为 key */
    Common.canvasOptions = {};
    return Common;
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
var PeaceTable = /** @class */ (function () {
    function PeaceTable() {
        this.cellSize = new Size(200, 70);
        this.cellTextSize = 12;
        this.cellFillColor = Color.RGB(1.0, 1.0, 0.75, null); // 黄色
    }
    PeaceTable.instance = function (cellSize, cellTextSize, cellFillColor) {
        var table = new PeaceTable();
        table.cellSize = cellSize;
        table.cellTextSize = cellTextSize;
        table.cellFillColor = cellFillColor;
        return table;
    };
    /**
     * 绘制表格。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param texts 文本
     * @return 形状
     */
    PeaceTable.prototype.drawTable = function (canvas, origin, texts) {
        var _this_1 = this;
        var increase = new Point(0, this.cellSize.height);
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
    PeaceTable.prototype.drawRow = function (canvas, origin, texts) {
        var _this_1 = this;
        var increase = new Point(this.cellSize.width, 0);
        return new Group(texts.map(function (text, index) {
            return _this_1.drawCell(canvas, index === 0 ? origin : origin = origin.add(increase), text);
        }));
    };
    /**
     * 绘制列。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param texts 文本
     * @return 形状
     */
    PeaceTable.prototype.drawColumn = function (canvas, origin, texts) {
        var _this_1 = this;
        var increase = new Point(0, this.cellSize.height);
        return new Group(texts.map(function (text, index) {
            return _this_1.drawCell(canvas, index === 0 ? origin : origin = origin.add(increase), text);
        }));
    };
    /**
     * 绘制单元格。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param text 文本
     * @return 形状
     */
    PeaceTable.prototype.drawCell = function (canvas, origin, text) {
        var shape = canvas.newShape();
        shape.geometry = new Rect(origin.x, origin.y, this.cellSize.width, this.cellSize.height);
        shape.shadowColor = null;
        this.cellTextSize && (shape.textSize = this.cellTextSize);
        this.cellFillColor = PeaceTable.cellFillColors[text || ""] || PeaceTable.cellFillColors["*"];
        this.cellFillColor && (shape.fillColor = this.cellFillColor);
        text && (shape.text = text);
        // 5 个磁极：中上下左右
        shape.magnets = [new Point(0, 0),
            new Point(1.00, 1.00), new Point(1.00, -1.00),
            new Point(-1.00, -1.00), new Point(-1.00, 1.00),
        ];
        return shape;
    };
    PeaceTable.extractGraphicTexts = function (graphic) {
        var _this_1 = this;
        var texts = [];
        if (!(graphic instanceof Array))
            graphic = [graphic];
        graphic.forEach(function (item) { return _this_1.extractGraphicTextsRecursively(item, texts); });
        return texts;
    };
    PeaceTable.extractGraphicTextsRecursively = function (graphic, texts) {
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
    PeaceTable.extractTableTexts = function (table) {
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
    PeaceTable.extractSolidText = function (solid) {
        return solid.text;
    };
    PeaceTable.defaults = Logger.proxyInstance(PeaceTable.instance(new Size(200, 70), 12, Color.RGB(1.0, 1.0, 0.75, null)));
    PeaceTable.small = Logger.proxyInstance(PeaceTable.instance(new Size(200, 20), 12, Color.RGB(1.0, 1.0, 0.75, null)));
    PeaceTable.cellFillColors = {
        "[anon]": Color.RGB(0.75, 1.0, 0.75, null),
        "": Color.RGB(0.8, 0.8, 0.8, null),
        "*": Color.RGB(0.75, 1.0, 1.0, null), // 蓝色，有效数据
    };
    return PeaceTable;
}());
/** 内存 */
var Memory = /** @class */ (function () {
    function Memory() {
        this.blocks = []; //内存块集合
    }
    Memory.instance = function (title, blocks) {
        var memory = new Memory();
        memory.title = title;
        memory.blocks = blocks;
        return memory;
    };
    /** 解析内存数据 */
    Memory.parse = function (data) {
        if (data instanceof Array) {
            return this.instance(null, MemoryBlock.parse(data));
        }
        return this.instance(data["title"], MemoryBlock.parse(data["blocks"]));
    };
    return Memory;
}());
/** 内存块 */
var MemoryBlock = /** @class */ (function () {
    function MemoryBlock(startAddress, endAddress, description) {
        this.startAddress = startAddress;
        this.endAddress = endAddress;
        this.description = description;
    }
    MemoryBlock.prototype.size = function () {
        return MemoryBlock.subtract(this.endAddress, this.startAddress);
    };
    MemoryBlock.prototype.toString = function () {
        return "'".concat(this.description, "':").concat(this.startAddress, "~").concat(this.endAddress);
    };
    MemoryBlock.getMaxAddressLength = function (blocks, base) {
        if (base === void 0) { base = 10; }
        return Math.max.apply(Math, blocks.map(function (block) { return block.endAddress == null ? 0 : block.endAddress.toString(base).length; }));
    };
    MemoryBlock.subtract = function (left, right) {
        return Number(BigInt(left) - BigInt(right));
    };
    /** 将记录转换为内存块对象 */
    MemoryBlock.parse = function (object) {
        var _this_1 = this;
        return object.map(function (item) { return _this_1.wrap(item); });
    };
    /** 将记录转换为内存块对象 */
    MemoryBlock.wrap = function (object) {
        return object instanceof MemoryBlock ? object
            : new MemoryBlock(parseInt(object['startAddress']), parseInt(object['endAddress']), object['description']);
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
                    blocks.splice(i, 0, new MemoryBlock(prev.endAddress, curr.startAddress));
                    i++;
                }
            }
            else {
                if (prev.startAddress > curr.endAddress) {
                    blocks.splice(i, 0, new MemoryBlock(curr.endAddress, prev.startAddress));
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
/** 内存绘制方向 */
var MemoryDirection;
(function (MemoryDirection) {
    MemoryDirection[MemoryDirection["BOTTOM_UP"] = 0] = "BOTTOM_UP";
    MemoryDirection[MemoryDirection["LEFT_RIGHT"] = 1] = "LEFT_RIGHT";
})(MemoryDirection || (MemoryDirection = {}));
var MemoryOriginHandler = /** @class */ (function () {
    function MemoryOriginHandler(memoryPainter) {
        this.memoryPainter = memoryPainter;
    }
    MemoryOriginHandler.prototype.getAddressLineOrigin = function (origin) {
        return origin;
    };
    return MemoryOriginHandler;
}());
var BottomUpHandler = /** @class */ (function (_super) {
    __extends(BottomUpHandler, _super);
    function BottomUpHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BottomUpHandler.prototype.getNextBlockOrigin = function (origin) {
        return origin.add(new Point(0, this.memoryPainter.table.cellSize.height));
    };
    BottomUpHandler.prototype.getAddressLineEndpoint = function (origin) {
        return origin.subtract(new Point(this.memoryPainter.addressLineLength, 0));
    };
    BottomUpHandler.prototype.getAddressLabelOrigin = function (origin) {
        return origin.subtract(new Point(this.memoryPainter.addressLabelTextLength / 2 * 8, 0));
    };
    return BottomUpHandler;
}(MemoryOriginHandler));
var LeftRightHandler = /** @class */ (function (_super) {
    __extends(LeftRightHandler, _super);
    function LeftRightHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LeftRightHandler.prototype.getNextBlockOrigin = function (origin) {
        return origin.add(new Point(this.memoryPainter.table.cellSize.width, 0));
    };
    LeftRightHandler.prototype.getAddressLineOrigin = function (origin) {
        return origin.add(new Point(0, this.memoryPainter.table.cellSize.height));
    };
    LeftRightHandler.prototype.getAddressLineEndpoint = function (origin) {
        return origin.add(new Point(0, this.memoryPainter.addressLineLength));
    };
    LeftRightHandler.prototype.getAddressLabelOrigin = function (origin) {
        return origin.add(new Point(0, 12 / 2));
    };
    return LeftRightHandler;
}(MemoryOriginHandler));
/** 内存画师 */
var MemoryPainter = /** @class */ (function () {
    function MemoryPainter() {
        this.table = PeaceTable.small;
        this.direction = MemoryDirection.BOTTOM_UP; //绘制方向
        this.showAddress = true; // 是否显示地址
        this.addressLineLength = 50;
        this.addressLabelSize = new Size(150, 20);
        this.addressLabelTextBase = 16; // 标签文本显示内存地址时使用的进制，栈时使用 10 进制，其他使用 16 进制
        this.addressLabelTextLength = 64 / 8 * 2; // 64 位系统使用 16 进制表示的长度
        this.showSize = true; // 是否显示占用空间
        this.sizeStyle = "inner"; // 占用空间显示样式：outer、inner
    }
    MemoryPainter.instanceVertical = function () {
        var painter = new MemoryPainter();
        painter.direction = MemoryDirection.BOTTOM_UP;
        painter.originHandler = Logger.proxyInstance(new BottomUpHandler(painter));
        return painter;
    };
    MemoryPainter.instanceHorizontal = function () {
        var painter = new MemoryPainter();
        painter.direction = MemoryDirection.LEFT_RIGHT;
        painter.originHandler = Logger.proxyInstance(new LeftRightHandler(painter));
        painter.addressLineLength = 25;
        painter.addressLabelTextBase = 10;
        painter.showSize = false;
        return painter;
    };
    /**
     * 绘制地址空间布局。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param [content] 内容
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
            form.addField(new Form.Field.Option(this.modeKey, "绘制模式", ["vertical", "horizontal"], ["垂直", "水平"], this.modeValue, null), 0);
            return form.show("配置地址空间绘制参数", "确定")
                .then(function (response) { return MemoryPainter.canvasCache[canvasName] = MemoryPainter[response.values[_this_1.modeKey]]; })
                .then(function (response) { return MemoryPainter.canvasCache[canvasName].drawMemorySelectively(canvas, origin); })
                .catch(function (response) { return Logger.getLogger().error("error:", response); });
        }
        if (app.optionKeyDown)
            Common.option(canvas, MemoryPainter.drawMemoryLocationKey, null);
        memory.drawMemorySelectively(canvas, origin);
    };
    /**
     * 基于内存映射，绘制虚拟内存。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param [content] 内容
     * @return  虚拟内存图
     */
    MemoryPainter.prototype.drawMemoryForMaps = function (canvas, origin, content) {
        var _this_1 = this;
        // readFileContentForGraphic(canvas, "maps-location")
        return (content ? Common.promise({ data: content }) : Common.selectFile())
            // return (location ? common.readFileContent(location) : common.selectFile())
            .then(function (response) {
            var blocks = MemoryPainter.resolveMaps(response.data);
            blocks.unshift(new MemoryBlock(BigInt(0), blocks[0].startAddress)); // 从 0 开始显示
            blocks.push(new MemoryBlock(blocks[blocks.length - 1].endAddress, // bigint 和 bigint 才能相减求 size
            BigInt("0xffffffffffffffff")));
            blocks = MemoryBlock.padding(MemoryBlock.descend(blocks));
            blocks = MemoryBlock.merge(blocks);
            return _this_1.drawMemoryBlocks(canvas, origin, blocks);
        })
            .catch(function (response) {
        });
    };
    /**
     * 解析内存映射。
     *
     * @param content 内存映射内容
     * @return  内存块
     */
    MemoryPainter.resolveMaps = function (content) {
        //1                                  2     3         4      5        6
        //561d970c5000-561d970c6000          r--p  00000000  08:03  1581273  /usr/lib/jvm/java-17-openjdk-amd64/bin/java
        var lines = content.split("\n");
        // blocks.unshift(new MemoryBlock(
        //   blocks[blocks.length - 1].endAddress,// bigint 和 bigint 才能相减求 size
        //   BigInt("0xffffffffffffffff"),// 截止到 16 个 f，数值溢出，需要使用 bigint
        // ));
        // blocks.push(new MemoryBlock(BigInt(0), blocks[0].startAddress));// 从 0 开始显示
        return lines.filter(function (line) { return line; })
            .map(function (line) { return line.split(/ +/); })
            .map(function (cells) {
            var addresses = cells[0].split("-");
            // 16 个 f 需要使用 bigint 才能表示
            return new MemoryBlock(BigInt(parseInt(addresses.shift(), 16)), BigInt(parseInt(addresses.shift(), 16)), (cells[5] || "").split("/").pop() || "[anon]");
        });
    };
    /**
     * 基于内存映射，绘制虚拟内存。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param [content] 内容
     * @return 虚拟内存图
     */
    MemoryPainter.prototype.drawMemorySelectively = function (canvas, origin, content) {
        var _this_1 = this;
        if (canvas === void 0) { canvas = Common.canvas(); }
        if (origin === void 0) { origin = Common.windowCenterPoint(); }
        return Common.readFileContentSelectively(canvas, MemoryPainter.drawMemoryLocationKey, content)
            .then(function (response) { return _this_1.drawMemory(canvas, origin, response.data); })
            .catch(function (response) { return Logger.getLogger().error(response); });
    };
    MemoryPainter.prototype.drawMemory = function (canvas, origin, data) {
        var memory = Memory.parse(data);
        var blocks = this.drawMemoryBlocks(canvas, origin, memory.blocks);
        if (!memory.title)
            return blocks;
        var title = this.drawTitle(canvas, origin, memory.title);
        origin = Common.pointOfRect(blocks.geometry, "top-left");
        Common.moveToSolid(title, origin.subtract(new Point(0, title.geometry.height)));
        return new Group([title, blocks]);
    };
    MemoryPainter.prototype.drawTitle = function (canvas, origin, title) {
        var solid = canvas.addText(title, origin);
        Common.bolder(solid);
        solid.textSize = this.table.cellTextSize + 2;
        return solid;
    };
    /**
     * 绘制虚拟内存单元，从下往上绘制。
     *
     * @param canvas 画布
     * @param origin 起点，矩形的左下点
     * @param  blocks 内存块集合
     * @return  绘制的图形
     */
    MemoryPainter.prototype.drawMemoryBlocks = function (canvas, origin, blocks) {
        var _this_1 = this;
        MemoryBlock.descend(blocks);
        MemoryBlock.padding(blocks, false);
        this.addressLabelTextLength = MemoryBlock.getMaxAddressLength(blocks, this.addressLabelTextBase);
        // MemoryBlock.merge(blocks);
        var array = blocks.map(function (block, index) {
            if (index !== 0)
                origin = _this_1.originHandler.getNextBlockOrigin(origin);
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
        var endpoint = this.originHandler.getNextBlockOrigin(origin);
        var graphics = [cell];
        if (this.showAddress) {
            block.endAddress != null && graphics.push(this.drawMemoryAddress(canvas, origin, block.endAddress));
            block.startAddress != null && graphics.push(this.drawMemoryAddress(canvas, endpoint, block.startAddress));
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
        origin = this.originHandler.getAddressLineOrigin(origin);
        line.points = [origin, this.originHandler.getAddressLineEndpoint(origin)];
        line.shadowColor = null;
        var formattedAddress = this.formatMemoryAddress(address);
        var labelOrigin = this.originHandler.getAddressLabelOrigin(line.points[1]);
        var label = canvas.addText(formattedAddress, labelOrigin);
        label.magnets = Common.magnets_5;
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
    MemoryPainter.vertical = Logger.proxyInstance(MemoryPainter.instanceVertical());
    MemoryPainter.horizontal = Logger.proxyInstance(MemoryPainter.instanceHorizontal());
    MemoryPainter.canvasCache = {};
    MemoryPainter.modeKey = "mode";
    MemoryPainter.modeValue = "vertical";
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
    library["Common"] = Common;
    library["Stepper"] = Stepper;
    library["LayerSwitcher"] = LayerSwitcher;
    library["Memory"] = MemoryPainter;
    [Common, Memory, MemoryBlock].forEach(function (item) { return Logger.proxyClassStaticFunction(item); });
    // Logger.proxy(Common.name, _this);
    //因为不能直接在 library 上添加属性，所以将属性都定义在 dynamic 中
    library.dynamic = {
        direction: "up",
        rectSize: new Size(200, 70),
        rectTextSize: undefined,
        rectFillColors: {
            "[anon]": Color.RGB(0.75, 1.0, 0.75),
            "": Color.RGB(0.8, 0.8, 0.8),
            "*": Color.RGB(0.75, 1.0, 1.0), // 蓝色，有效数据
        },
        lineWidth: 100,
        labelSize: new Size(150, 20),
        labelTextBase: 16,
        labelTextLength: 16,
        showSize: true,
        sizeStyle: 'outer', // 占用空间显示样式：outer、inner
    };
    // Object.defineProperties(library, {
    //   "dynamic": {
    //     value: library.dynamic
    //   }
    // });
    library.extractGraphicTexts = function (graphic) {
        return PeaceTable.extractGraphicTexts(graphic);
    };
    /**
     * 设置绘图样式。
     *
     * @param style 绘图样式：large、small
     * @return {void}
     */
    library.setStyle = function (style) {
        var dynamic = this.dynamic;
        dynamic.labelSize = new Size(150, 20);
        dynamic.labelTextBase = 16;
        dynamic.labelTextLength = 16;
        dynamic.showSize = true;
        switch (style) {
            case 'large':
                dynamic.rectSize = new Size(200, 70);
                dynamic.rectTextSize = null;
                dynamic.lineWidth = 100;
                dynamic.sizeStyle = 'outer';
                break;
            case 'small':
                dynamic.rectSize = new Size(300, 20);
                dynamic.rectTextSize = 12;
                dynamic.lineWidth = 20;
                dynamic.sizeStyle = 'inner';
                break;
        }
    };
    /**
     * 绘制抽象的虚拟内存。
     *
     * @param canvas 画布
     * @param [origin] 起点
     * @return  虚拟内存图
     */
    library.drawMemoryAbstractly = function (canvas, origin, data) {
        var locationKey = "drawMemoryAbstractly.location";
        var common = this.plugIn.library("common");
        if (app.optionKeyDown)
            return common.option(canvas, locationKey, null);
        (data
            ? new Promise(function (resolve) { return resolve(data); })
            : common.readFileContentForGraphic(canvas, locationKey).then(function (response) { return JSON.parse(response.data); }))
            .then(function (response) { return PeaceTable.small.drawColumn(canvas, origin, response.reverse()); })
            .catch(function (response) { return console.error("drawMemoryAbstractly error: ", response); });
    };
    library.drawTableColumn = function (canvas, origin) {
        var locationKey = "drawTableColumn.location";
        Common.readFileContentAssociatively(canvas, locationKey)
            .then(function (response) { return JSON.parse(response.data); })
            .then(function (response) { return PeaceTable.small.drawColumn(canvas, origin, response); })
            .catch(function (response) { return console.error("drawMemoryAbstractly error: ", response); });
    };
    /**
     * 绘制抽象的虚拟内存。
     *
     * @param canvas 画布
     * @param [origin] 起点
     * @return  虚拟内存图
     */
    library.drawMemoryStandardly = function (canvas, origin) {
        this.setStyle('large');
        var common = this.plugIn.library("common");
        canvas = canvas || common.canvas();
        origin = origin || common.windowCenterPoint();
        // echo '"", "代码段(.text)", "已初始化的数据(.data)", "未初始化的数据(.bss)", "堆", "", "共享库的内存映射区域", "", "用户栈", ""' | sed "1i $(seq -s ',' 0 10)" | column -t -s , -o ,
        //  0 ,1               ,2                       ,3                  ,4    ,5  ,6                 ,7  ,8        ,9
        var descriptions = [
            "", "代码段(.text)", "已初始化的数据(.data)", "未初始化的数据(.bss)", "堆", "", "共享库的内存映射区域", "", "用户栈", ""
        ];
        var group = this.drawMemoryBlocksAbstractly(canvas, origin, descriptions);
        var graphics = group.graphics;
        var heapRect = graphics.find(function (graphic) { return graphic.text === "堆"; }).geometry;
        var heapLineStartPoint = common.pointOfRect(heapRect, 'top-center');
        var heapLineEndPoint = new Point(heapLineStartPoint.x, heapLineStartPoint.y - this.dynamic.rectSize.height);
        var heapLine = common.drawLine(canvas, [heapLineStartPoint, heapLineEndPoint], "向上增长", true);
        var mmapRect = graphics.find(function (graphic) { return graphic.text === "共享库的内存映射区域"; }).geometry;
        var mmapLineStartPoint = common.pointOfRect(mmapRect, 'bottom-right').add(new Point(20, 0));
        var mmapLineEndPoint = new Point(mmapLineStartPoint.x, mmapLineStartPoint.y + this.dynamic.rectSize.height);
        var mmapLine = common.drawLine(canvas, [mmapLineStartPoint, mmapLineEndPoint], "malloc 向下增长", true);
        var stackLineStartPoint = common.pointOfRect(graphics.find(function (graphic) { return graphic.text === "用户栈"; }).geometry, 'bottom-center');
        var stackLineEndPoint = new Point(stackLineStartPoint.x, stackLineStartPoint.y + this.dynamic.rectSize.height);
        var stackLine = common.drawLine(canvas, [stackLineStartPoint, stackLineEndPoint], "向下增长", true);
        var brkLineEndPoint = heapRect.origin.add(new Point(this.dynamic.rectSize.width, 0));
        var brkLineStartPoint = brkLineEndPoint.add(new Point(this.dynamic.rectSize.width / 2, 0));
        var brkLine = common.drawLine(canvas, [brkLineStartPoint, brkLineEndPoint], "堆顶（brk 变量）");
        var directionOffset = new Point(-this.dynamic.rectSize.width, 0);
        var directionStartPoint = graphics[graphics.length - 1].geometry.center.add(directionOffset);
        var directionEndPoint = graphics[0].geometry.center.add(directionOffset);
        var directionLine = common.drawLine(canvas, [directionStartPoint, directionEndPoint], "低地址");
        var directionEndText = canvas.addText("高地址", directionEndPoint.add(new Point(0, -20)));
        return new Group([heapLine, mmapLine, stackLine, brkLine, directionLine, directionEndText, group]);
    };
    /**
     * 绘制虚拟内存单元，抽象地。
     *
     * @param canvas 画布
     * @param origin 起点，矩形左下角处位置
     * @param {String[]} descriptions 内存块描述集合
     * @return  虚拟内存单元图
     */
    library.drawMemoryBlocksAbstractly = function (canvas, origin, descriptions) {
        var _this_1 = this;
        var pointOperator = this.dynamic.direction === "down" ? "add" : "subtract";
        return new Group(descriptions.map(function (description, index) {
            if (index > 0) {
                origin = origin[pointOperator](new Point(0, _this_1.dynamic.rectSize.height));
            }
            return _this_1.drawMemoryRect(canvas, origin, description);
        }));
    };
    /**
     * 绘制栈区抽象虚拟内存。案例参考：variable.stack.json。
     *
     * @param canvas 画布
     * @param [origin] 起点
     */
    library.drawStackMemoryAbstractly = function (canvas, origin) {
        var _this_1 = this;
        this.setStyle("small");
        this.dynamic.labelTextBase = 10; //为什么栈使用 10 进制，汇编中类似 16(%rip) 的偏移地址使用了 10 进制
        this.dynamic.showSize = false;
        var common = this.plugIn.library("common");
        canvas = canvas || common.canvas();
        origin = origin || common.windowCenterPoint();
        common.readFileContentForGraphic(common.selectedGraphic() || canvas, "location-drawStackMemoryAbstractly")
            .then(function (responce) {
            var data = JSON.parse(responce.data);
            var size = data.size + 8; // 从 start(=0) + step 到 size
            _this_1.dynamic.labelTextLength = size.toString().length;
            _this_1.dynamic.labelSize.width = 50;
            var blocks = _this_1.buildBlocksForFrame(size);
            blocks = _this_1.sortBlocks(blocks);
            _this_1.setBlocksForFrame(blocks, data.blocks);
            _this_1.drawMemoryBlocks(canvas, origin, blocks);
        })
            .catch(function (response) {
            console.error("readFileContentForGraphic response: ", response);
        });
    };
    /**
     * 构建栈帧内存块集合。
     *
     * 汇编代码 'subq    $88, %rsp' 不一定代表栈帧空间。
     *
     * @param size 空间，字节数
     * @param start 起始地址，从 0 开始，和汇编代码相匹配
     * @param step 步调，每格字节数
     * @return  内存块集合
     */
    library.buildBlocksForFrame = function (size, start, step) {
        if (start === void 0) { start = 0; }
        if (step === void 0) { step = 8; }
        var count = size / step;
        var blocks = [];
        for (var i = 0; i < count; i++) {
            blocks.push({ startAddress: start, endAddress: start + step });
            start -= step;
        }
        return blocks;
    };
    /**
     * 设置栈帧内存块集合。
     *
     * @param  template 模板内存块集合
     * @param  content 内容内存块集合
     * @param [step] 步调，每格字节数
     */
    library.setBlocksForFrame = function (template, content, step) {
        if (step === void 0) { step = 8; }
        var _loop_1 = function (contentBlock) {
            var index = template.findIndex(function (block) { return block.startAddress === contentBlock.startAddress; });
            if (index === -1)
                return { value: void 0 };
            var endAddress = contentBlock.startAddress + (contentBlock.size || step);
            while (template[index] && template[index].endAddress <= endAddress) {
                template[index++].description = contentBlock.description;
            }
        };
        for (var _i = 0, content_1 = content; _i < content_1.length; _i++) {
            var contentBlock = content_1[_i];
            var state_1 = _loop_1(contentBlock);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    };
    /**
     * 基于内存映射，绘制虚拟内存。
     *
     * @param canvas 画布
     * @param [origin] 起点
     * @param [content] 内容
     * @param [location] 内容
     * @return  虚拟内存图
     */
    library.drawMemoryForMaps = function (canvas, origin, content, location) {
        var _this_1 = this;
        this.setStyle('small');
        var common = this.plugIn.library("common");
        canvas = canvas || common.canvas();
        origin = origin || common.windowCenterPoint();
        // readFileContentForGraphic(canvas, "maps-location")
        return (content ? new Promise(function (resolve) { return resolve({ data: content }); }) : common.selectFile())
            // return (location ? common.readFileContent(location) : common.selectFile())
            .then(function (response) {
            var blocks = _this_1.resolveMaps(response.data);
            blocks.unshift({ startAddress: 0n, endAddress: blocks[0].startAddress }); // 从 0 开始显示
            blocks.push({
                startAddress: blocks[blocks.length - 1].endAddress,
                endAddress: bigint("0xffffffffffffffff"), // 截止到 16 个 f，数值溢出，需要使用 bigint
            });
            blocks = _this_1.paddingBlocks(_this_1.sortBlocks(blocks));
            blocks = _this_1.mergeBlocks(blocks);
            return _this_1.drawMemoryBlocks(canvas, origin, blocks);
        })
            .catch(function (response) {
            console.error("selectFile response: ", response);
        });
    };
    /**
     * 解析内存映射。
     *
     * @param content 内存映射内容
     * @return  内存块
     */
    library.resolveMaps = function (content) {
        //1                                  2     3         4      5        6
        //561d970c5000-561d970c6000          r--p  00000000  08:03  1581273  /usr/lib/jvm/java-17-openjdk-amd64/bin/java
        var lines = content.split("\n");
        return lines.filter(function (line) { return line; })
            .map(function (line) { return line.split(/ +/); })
            .map(function (cells) {
            var addresses = cells[0].split("-");
            // 16 个 f 需要使用 bigint 才能表示
            return {
                // startAddress: parseInt(addresses.shift(), 16),
                startAddress: bigint(parseInt(addresses.shift(), 16)),
                // endAddress: parseInt(addresses.shift(), 16),
                endAddress: bigint(parseInt(addresses.shift(), 16)),
                description: (cells[5] || "").split("/").pop() || "[anon]" //全路径太长，只取末尾的程序名
            };
        });
    };
    /**
     * 合并相同描述的相邻内存块。此处假设相同描述的内存块是连续的。
     *
     * @param  blocks 内存块集合
     * @return  内存块集合
     */
    library.mergeBlocks = function (blocks) {
        for (var i = 1; i < blocks.length; i++) {
            var prev = blocks[i - 1], curr = blocks[i];
            if (prev.description === curr.description) {
                prev.endAddress = curr.endAddress; // 上一块的结束地址指向当前块的结束地址
                blocks.splice(i, 1); // 删除当前块
                i--;
            }
        }
        return blocks;
    };
    /**
     * 排序内存块集合。
     * @param  blocks 内存块集合
     * @return  等于输入的内存块集合
     */
    library.sortBlocks = function (blocks) {
        blocks.sort(function (left, right) { return left.startAddress - right.startAddress; });
        return blocks;
    };
    /**
     * 对齐内存块集合。
     * 内存地址应该是连续的，在空缺处补齐。
     * @param  blocks 内存块集合
     * @return  等于输入的内存块集合
     */
    library.paddingBlocks = function (blocks) {
        for (var i = 1; i < blocks.length; i++) {
            var prev = blocks[i - 1], curr = blocks[i];
            //地址不连续，补齐空缺
            if (prev.endAddress < curr.startAddress) {
                blocks.splice(i, 0, { startAddress: prev.endAddress, endAddress: curr.startAddress });
                i++;
            }
        }
        return blocks;
    };
    /**
     * 绘制虚拟内存单元，从下往上绘制。
     *
     * @param canvas 画布
     * @param origin 起点，矩形的左下点
     * @param  blocks 内存块集合
     * @return  绘制的图形
     */
    library.drawMemoryBlocks = function (canvas, origin, blocks) {
        var _this_1 = this;
        var array = blocks.map(function (block, index) {
            // PeaceConsole.root.info(`block: ${JSON.stringify(block)}`);
            if (index === 0)
                return _this_1.drawMemoryBlock(canvas, origin, block);
            origin = origin.subtract(new Point(0, _this_1.dynamic.rectSize.height));
            var prev = blocks[index - 1], curr = blocks[index];
            if (prev.endAddress < curr.startAddress) {
                origin = origin.subtract(new Point(0, _this_1.dynamic.rectSize.height));
            }
            else if (prev.endAddress > curr.startAddress) {
                origin = origin.add(new Point(0, _this_1.dynamic.rectSize.height / 2));
            }
            return _this_1.drawMemoryBlock(canvas, origin, block);
        });
        return new Group(array);
    };
    /**
     * 绘制虚拟内存单元，从下往上绘制。
     *
     * @param canvas 画布
     * @param startPoint 起点，矩形左下角处位置
     * @param block 内存块
     * @return  绘制的图形
     */
    library.drawMemoryBlock = function (canvas, startPoint, block) {
        // PeaceConsole.root.info(`drawMemoryBlock. startPoint=${startPoint}, block=${block}`);
        var dynamic = this.dynamic;
        var endpoint = new Point(startPoint.x, startPoint.y - dynamic.rectSize.height);
        var graphics = [
            this.drawMemoryRect(canvas, endpoint, block.description),
            this.drawMemoryAddress(canvas, startPoint, block.startAddress),
            this.drawMemoryAddress(canvas, endpoint, block.endAddress),
        ];
        if (!dynamic.showSize)
            return new Group(graphics);
        var size = Number(block.endAddress - block.startAddress);
        if (dynamic.sizeStyle === 'outer')
            graphics.push(this.drawMemorySize(canvas, endpoint, size));
        else
            graphics[0].text += " (".concat(Common.formatMemorySize(size), ")");
        return new Group(graphics);
    };
    /**
     * 绘制内存矩形。
     *
     * @param canvas 画布
     * @param location 位置
     * @param [description] 描述
     * @return {Shape} 绘制的图形
     */
    library.drawMemoryRect = function (canvas, location, description) {
        var dynamic = this.dynamic, rectSize = dynamic.rectSize;
        var shape = canvas.newShape();
        shape.geometry = new Rect(location.x, location.y, rectSize.width, rectSize.height);
        shape.shadowColor = null;
        dynamic.rectTextSize && (shape.textSize = dynamic.rectTextSize);
        // Color.RGB(1.0, 1.0, 0.75)
        shape.fillColor = dynamic.rectFillColors[description || ""] || dynamic.rectFillColors["*"];
        description && (shape.text = description);
        //磁体、磁极：可连线的点
        shape.magnets = [new Point(0, 0), new Point(1.00, 1.00), new Point(1.00, -1.00), new Point(-1.00, -1.00), new Point(-1.00, 1.00),];
        return shape;
    };
    /**
     * 绘制虚拟内存单元地址。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param {Number|bigint} address 地址
     * @return 绘制的图形
     */
    library.drawMemoryAddress = function (canvas, origin, address) {
        var line = canvas.newLine();
        line.shadowColor = null;
        var lineStartPoint = origin;
        var lineEndPoint = new Point(lineStartPoint.x - this.dynamic.lineWidth, lineStartPoint.y);
        line.points = [lineStartPoint, lineEndPoint];
        var label = canvas.newShape();
        label.geometry = new Rect(lineEndPoint.x - this.dynamic.labelSize.width, lineEndPoint.y - this.dynamic.labelSize.height / 2, this.dynamic.labelSize.width, this.dynamic.labelSize.height);
        label.shadowColor = null;
        label.strokeThickness = 0;
        label.text = this.formatMemoryAddress(address);
        label.textSize = 12;
        label.fillColor = null;
        label.textHorizontalAlignment = HorizontalTextAlignment.Right;
        return new Group([line, label]);
    };
    /**
     * 格式化内存地址。
     *
     * PlugIn.find('com.github.peacetrue.learn.graffle').library('memory').formatMemoryAddress(bigint("0xffffffffffffffff"))
     *
     * @param {Number|bigint} address 内存地址
     * @return  内存地址描述
     */
    library.formatMemoryAddress = function (address) {
        var dynamic = this.dynamic;
        var text = address < 0 ? '-' : ' '; //符号位
        if (dynamic.labelTextBase === 16)
            text += '0x'; //16 进制标志
        var absAddress = address > 0 ? address : -address;
        return text + absAddress.toString(dynamic.labelTextBase).leftPad(dynamic.labelTextLength, '0');
    };
    /**
     * 绘制内存空间尺寸。
     *
     * @param canvas 画布
     * @param location 位置
     * @param size 空间尺寸
     * @return 绘制的图形
     */
    library.drawMemorySize = function (canvas, location, size) {
        var dynamic = this.dynamic;
        var upLine = canvas.newLine();
        upLine.shadowColor = null;
        var upLineStartPoint = new Point(location.x - dynamic.lineWidth - dynamic.labelSize.width / 2, location.y + dynamic.labelSize.height / 2);
        var upLineEndPoint = new Point(upLineStartPoint.x, upLineStartPoint.y + dynamic.rectSize.height / 2 - dynamic.labelSize.height);
        upLine.points = [upLineStartPoint, upLineEndPoint];
        upLine.headType = "FilledArrow";
        var label = canvas.newShape();
        label.geometry = new Rect(upLineStartPoint.x - dynamic.labelSize.width / 2, upLineEndPoint.y, dynamic.labelSize.width, dynamic.labelSize.height);
        label.shadowColor = null;
        label.strokeThickness = 0;
        label.text = Common.formatMemorySize(size);
        label.textSize = 12;
        label.fillColor = null;
        label.textHorizontalAlignment = HorizontalTextAlignment.Center;
        var bottomLine = canvas.newLine();
        bottomLine.shadowColor = null;
        var bottomLineStartPoint = new Point(upLineStartPoint.x, location.y + dynamic.rectSize.height - dynamic.labelSize.height / 2);
        var bottomLineEndPoint = new Point(bottomLineStartPoint.x, bottomLineStartPoint.y - dynamic.rectSize.height / 2 + dynamic.labelSize.height);
        bottomLine.points = [bottomLineStartPoint, bottomLineEndPoint];
        bottomLine.headType = "FilledArrow";
        return new Group([upLine, label, bottomLine]);
    };
    return library;
})();
