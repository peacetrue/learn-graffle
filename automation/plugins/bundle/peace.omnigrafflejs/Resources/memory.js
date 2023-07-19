/**
 * 虚拟内存：
 * 抽象虚拟内存：没有虚拟地址或者虚拟地址是不真实的
 * 具体虚拟内存：虚拟地址是真实的
 * 程序运行起来才能得到具体虚拟地址，否则就使用抽象的方法分析虚拟内存。
 * PlugIn.find("com.github.peacetrue.learn.graffle").library("common").canvas()
 */
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
var _a;
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
        var _this = this;
        console.info("option. object: ".concat(object, ", key: ").concat(key, ", value: ").concat(value));
        var actions = {
            "Canvas": function (object, key, value) { return _this.canvasOption(object, key, value); },
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
        console.info("canvasOption. canvas: ".concat(canvas, ", key: ").concat(key, ", value: ").concat(value));
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
        var _this = this;
        console.info("selectFile");
        var filePicker = new FilePicker();
        filePicker.types = types;
        return filePicker.show().then(function (response) {
            console.info("selectFile response: ", response);
            return _this.promiseUrlFetch(response[0]);
        });
    };
    /**
     * 选择文件后，记录下文件位置。
     *
     * @param object 关联对象
     * @param locationKey 位置键
     */
    Common.selectFileAssociatively = function (object, locationKey) {
        var _this = this;
        console.info("selectFileAssociatively");
        return this.selectFile().then(function (response) {
            _this.option(object, locationKey, response.url.toString());
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
        var _this = this;
        console.info("readFileContentAssociatively");
        console.debug("app.optionKeyDown: ".concat(app.optionKeyDown));
        if (app.optionKeyDown) {
            this.option(object, locationKey, null);
            return Promise.reject("clear cache!");
        }
        var location = this.option(object, locationKey);
        console.info("location: ", location);
        if (!location)
            return this.selectFileAssociatively(object, locationKey);
        return this.readFileContent(location).catch(function (response) {
            // response:  Error: 未能完成操作。（kCFErrorDomainCFNetwork错误1。）
            console.error("promiseUrlFetch response: ", response);
            return _this.selectFileAssociatively(object, locationKey);
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
        var _this = this;
        console.info("loadGraphicsText");
        console.debug("graphics.length: ".concat(graphics.length));
        var graphic = graphics[0];
        length = length || graphic.userData['length'] || 1;
        return this.readFileContentAssociatively(graphic, locationKey)
            .then(function (response) {
            var canvas = _this.canvas();
            var location = graphic.userData[locationKey];
            graphics = canvas.allGraphicsWithUserDataForKey(location, locationKey);
            console.info("allGraphicsWithUserDataForKey.length: ".concat(graphics.length));
            if (graphics.length < length)
                graphics = _this.duplicateGraphicToLayers(canvas, graphic, length);
            _this.setGraphicsText(graphics, response.data);
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
        console.info("setGraphicsText");
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
        console.info("duplicateGraphicToLayers");
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
        var _this = this;
        if (graphics instanceof Array) {
            return graphics.forEach(function (graphic) { return _this.clearGraphicsText(graphic); });
        }
        if (graphics instanceof Group) {
            graphics.graphics.forEach(function (graphic) { return _this.clearGraphicsText(graphic); });
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
     * @return {Point} 点
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
                // console.info(`${key}: ${points[key]}`);
            }
        }
        return points;
    };
    /**
     * 获取两点之间的中间点。
     *
     * @param {Point} start 起点
     * @param {Point} end 终点
     * @return {Point} 中点
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
        var _this = this;
        if (line instanceof Array)
            return line.forEach(function (_line) { return _this.align(_line); });
        var points = line.points;
        if (points.length !== 3)
            return console.error("points.length: ", points.length);
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
            return console.warn("locateCenter: no selection.graphics");
        window.setViewForCanvas(selection.canvas, window.zoom, graphics[0].geometry.center);
    };
    /**
     * 获取正向连接的图形，忽略反向连接的。
     *
     * @param source 源始图形集合
     * @param target 目标图形集合
     */
    Common.addConnected = function (source, target) {
        var _this = this;
        console.info("addConnected. target.length=".concat(target.length));
        if (!source)
            return;
        if (source instanceof Array) {
            source.forEach(function (item) { return _this.addConnected(item, target); });
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
        console.info("highlightConnected. graphics.length=".concat(graphics.length));
        var target = [];
        this.addConnected(graphics, target);
        console.info("target.length=".concat(target.length));
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
        console.info("loadLib: ", path);
        if (name in Object) {
            console.info("lib '".concat(path, "' loaded"));
            return new Promise(function (resolve, reject) { return resolve(Object[name]); });
        }
        return this.promiseUrlFetch(this.plugIn.resourceNamed(path))
            .then(function (response) {
            var content = response.data;
            console.info("lib '".concat(path, "': \n"), content);
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
        console.debug("move line by ".concat(distance));
        line.points = line.points.map(function (item) { return item.add(distance); });
        line.head = null;
        line.tail = null;
    };
    Common.moveSolid = function (solid, distance) {
        console.debug("move solid by ".concat(distance));
        solid.geometry = solid.geometry.offsetBy(distance.x, distance.y);
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
    Common.test = function () {
        console.info("PeaceTable: ", Object.PeaceTable);
    };
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
        console.debug("IndexSwitcher.prev");
        this.current = this.isStart() ? this.end : this.current - this.step;
        return this.current;
    };
    IndexSwitcher.prototype.next = function () {
        console.debug("IndexSwitcher.next");
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
        var _this = this;
        console.info("StepperContext.clear: ".concat(Object.keys(this.layer.graphics).length));
        this.layer = Common.clearLayer(this.layer, 100);
        Object.keys(this.graphics).forEach(function (key) { return delete _this.graphics[key]; });
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
        console.info("static Stepper.switch");
        var canvasName = Common.canvas().name;
        console.debug("canvasName: ".concat(canvasName));
        var stepper = Stepper.steppers[canvasName];
        console.debug("stepper: ".concat(stepper));
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
        console.info("static Stepper.init: ".concat(ctxName));
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
        var _this = this;
        var layer = Common.canvas().layers.find(function (layer) { return layer.name === _this.layerName; });
        if (!layer) {
            layer = Common.canvas().newLayer();
            layer.name = this.layerName;
        }
        return layer;
    };
    Stepper.prototype.switch = function () {
        console.info("Stepper.switch");
        this.invoke(app.optionKeyDown ? this.indexSwitcher.prev() : this.indexSwitcher.next());
    };
    Stepper.prototype.invoke = function (index) {
        var _this = this;
        if (index === void 0) { index = this.indexSwitcher.current; }
        console.info("Stepper.invoke. index: ".concat(index));
        this.settings[index].forEach(function (handler) { return handler(_this.context); });
    };
    Stepper.prototype.autoSwitch = function (interval) {
        var _this = this;
        if (interval === void 0) { interval = 1; }
        this.switch();
        if (this.indexSwitcher.isEnd())
            return;
        Timer.once(interval, function () { return _this.autoSwitch(); });
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
        console.info("Make.setup");
        var context = stepper.context;
        context.refer = (Common.selectedGraphic() || Common.canvas().graphicWithName(Make.referName));
        context.origin = context.refer.geometry.origin.add(new Point(context.refer.geometry.width, 0));
        context.lineHeight = Make.calLineHeight(context.refer);
        console.debug("context: ".concat(context));
        var moveStep1 = Make.moveLinePointer;
        var moveStep2 = Make.buildMoveLinePointer(2);
        var moveStep3 = Make.buildMoveLinePointer(3.5);
        var moveStep5 = Make.buildMoveLinePointer(7);
        var moveStep_10 = Make.buildMoveLinePointer(-10);
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
        settings.push([moveStep5, Make.immediateAssign3]);
        settings.push([moveStep_10, function (ctx) { return Make.drawText(ctx, "  phases.1"); }]);
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
        console.info("static Make.newLinePointer");
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
        console.info("static Make.newImmediate");
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
        console.info("static LayerSwitcher.switch");
        graphic && this.layerNamePrefixKey in graphic.userData
            ? this.switchByGraphic(graphic)
            : this.switchByForm();
    };
    /**
     * 切换图层通过表单参数。
     */
    LayerSwitcher.switchByForm = function () {
        var _this = this;
        console.info("static LayerSwitcher.switchByForm");
        var canvasName = Common.canvas().name;
        console.debug("canvasName: ".concat(canvasName));
        var layerSwitcher = LayerSwitcher.layerSwitchers[canvasName];
        console.debug("layerSwitcher: ".concat(layerSwitcher));
        // shift 强制重新配置
        if (app.shiftKeyDown || !layerSwitcher) {
            var form = new Form();
            form.addField(new Form.Field.String(this.layerNamePrefixKey, "图层名称前缀", this.layerNamePrefix, null), 0);
            form.addField(new Form.Field.Option(this.layerSwitchModeKey, "图层切换模式", Object.values(LayerSwitchMode).slice(3), ["轮换", "渐显", "自定义"], this.layerSwitchMode, null), 1);
            form.addField(new Form.Field.String(this.layerCustomSettingsKey, "图层自定义配置", JSON.stringify(this.layerCustomSettings), null), 2);
            return form.show("配置图层切换参数", "确定")
                .then(function (response) {
                var values = response.values;
                LayerSwitcher.layerSwitchers[canvasName] = LayerSwitcher.init(values[_this.layerNamePrefixKey], values[_this.layerSwitchModeKey], JSON.parse(values[_this.layerCustomSettingsKey]));
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
        console.info("static LayerSwitcher.switchByGraphic");
        var layerSwitcher = LayerSwitcher.layerSwitchers[graphic.name];
        console.debug("layerSwitcher: ".concat(layerSwitcher));
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
        console.info("static LayerSwitcher.init");
        console.debug("layerNamePrefix: ".concat(layerNamePrefix, ", layerSwitchMode: ").concat(layerSwitchMode));
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
        console.debug("settings: ".concat(JSON.stringify(layerSwitcher.settings)));
        layerSwitcher.indexSwitcher = new IndexSwitcher(0, layerSwitcher.settings.length);
        layerSwitcher.show();
        return layerSwitcher;
    };
    LayerSwitcher.prototype.switch = function () {
        console.info("LayerSwitcher.switch");
        this.show(app.optionKeyDown ? this.indexSwitcher.prev() : this.indexSwitcher.next());
    };
    LayerSwitcher.prototype.show = function (index) {
        var _this = this;
        if (index === void 0) { index = this.indexSwitcher.current; }
        console.info("LayerSwitcher.show: ".concat(index));
        this.hiddenAll();
        index in this.settings
            && this.settings[index]
                .filter(function (item) { return item in _this.layers; })
                .forEach(function (item) { return _this.layers[item].visible = true; });
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
    LayerSwitcher.layerArguments = (_a = {},
        _a[LayerSwitcher.layerNamePrefixKey] = LayerSwitcher.layerNamePrefix,
        _a[LayerSwitcher.layerSwitchModeKey] = LayerSwitcher.layerSwitchMode,
        _a[LayerSwitcher.layerCustomSettingsKey] = LayerSwitcher.layerCustomSettings,
        _a);
    LayerSwitcher.layerSwitchers = {};
    return LayerSwitcher;
}());
var PeaceTable = /** @class */ (function () {
    function PeaceTable(cellSize, cellTextSize, cellFillColor) {
        this.cellSize = new Size(200, 70);
        this.cellTextSize = 12;
        this.cellFillColor = Color.RGB(1.0, 1.0, 0.75, null); // 黄色
        this.cellSize = cellSize;
        this.cellTextSize = cellTextSize;
        this.cellFillColor = cellFillColor;
    }
    /**
     * 绘制表格。
     *
     * @param canvas 画布
     * @param origin 起点
     * @param texts 文本
     * @return 形状
     */
    PeaceTable.prototype.drawTable = function (canvas, origin, texts) {
        var _this = this;
        console.info("drawTable: ", texts.length);
        var increase = new Point(0, this.cellSize.height);
        return new Group(texts.map(function (item, index) {
            origin = index === 0 ? origin : origin = origin.add(increase);
            return _this.drawRow(canvas, origin, item);
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
        var _this = this;
        console.info("drawRow: ", texts.length);
        var increase = new Point(this.cellSize.width, 0);
        return new Group(texts.map(function (text, index) {
            return _this.drawCell(canvas, index === 0 ? origin : origin = origin.add(increase), text);
        }));
    };
    PeaceTable.bolder = function (group) {
        for (var _i = 0, _a = group.graphics; _i < _a.length; _i++) {
            var graphic = _a[_i];
            if (graphic instanceof Solid)
                graphic.fontName = "PingFangSC-Semibold";
        }
        return group;
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
        var _this = this;
        console.info("drawColumn: ".concat(texts.length));
        var increase = new Point(0, this.cellSize.height);
        return new Group(texts.map(function (text, index) {
            return _this.drawCell(canvas, index === 0 ? origin : origin = origin.add(increase), text);
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
        console.debug("drawCell: ", text);
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
        var _this = this;
        var texts = [];
        if (!(graphic instanceof Array))
            graphic = [graphic];
        console.info("extractGraphicTexts: graphic.length=", graphic.length);
        graphic.forEach(function (item) { return _this.extractGraphicTextsRecursively(item, texts); });
        return texts;
    };
    PeaceTable.extractGraphicTextsRecursively = function (graphic, texts) {
        console.info("extractGraphicTextsRecursively: ", graphic);
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
        console.info("extractTableTexts: ", table);
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
        console.debug("extractSolidText: ".concat(solid.text));
        return solid.text;
    };
    PeaceTable.defaults = new PeaceTable(new Size(200, 70), 12, Color.RGB(1.0, 1.0, 0.75, null));
    PeaceTable.small = new PeaceTable(new Size(200, 20), 12, Color.RGB(1.0, 1.0, 0.75, null));
    PeaceTable.cellFillColors = {
        "[anon]": Color.RGB(0.75, 1.0, 0.75, null),
        "": Color.RGB(0.8, 0.8, 0.8, null),
        "*": Color.RGB(0.75, 1.0, 1.0, null), // 蓝色，有效数据
    };
    return PeaceTable;
}());
(function () {
    var library = new PlugIn.Library(new Version("0.1"));
    library["Common"] = Common;
    library["Stepper"] = Stepper;
    library["LayerSwitcher"] = LayerSwitcher;
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
     * @param [canvas] 画布
     * @param {Point} [origin] 起点
     * @return  虚拟内存图
     */
    library.drawMemoryAbstractly = function (canvas, origin, data) {
        console.info("drawMemoryAbstractly");
        var locationKey = "drawMemoryAbstractly.location";
        var common = this.plugIn.library("common");
        console.debug("app.optionKeyDown: ", app.optionKeyDown);
        if (app.optionKeyDown)
            return common.option(canvas, locationKey, null);
        (data
            ? new Promise(function (resolve) { return resolve(data); })
            : common.readFileContentForGraphic(canvas, locationKey).then(function (response) { return JSON.parse(response.data); }))
            .then(function (response) { return PeaceTable.small.drawColumn(canvas, origin, response.reverse()); })
            .catch(function (response) { return console.error("drawMemoryAbstractly error: ", response); });
    };
    library.drawTableColumn = function (canvas, origin) {
        console.info("drawTableColumn");
        var locationKey = "drawTableColumn.location";
        Common.readFileContentAssociatively(canvas, locationKey)
            .then(function (response) { return JSON.parse(response.data); })
            .then(function (response) { return PeaceTable.small.drawColumn(canvas, origin, response); })
            .catch(function (response) { return console.error("drawMemoryAbstractly error: ", response); });
    };
    /**
     * 绘制抽象的虚拟内存。
     *
     * @param [canvas] 画布
     * @param {Point} [origin] 起点
     * @return  虚拟内存图
     */
    library.drawMemoryStandardly = function (canvas, origin) {
        console.info("drawMemoryStandardly");
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
     * @param {Point} origin 起点，矩形左下角处位置
     * @param {String[]} descriptions 内存块描述集合
     * @return  虚拟内存单元图
     */
    library.drawMemoryBlocksAbstractly = function (canvas, origin, descriptions) {
        var _this = this;
        console.info("drawMemoryBlocksAbstractly。 descriptions.length=", descriptions.length);
        var pointOperator = this.dynamic.direction === "down" ? "add" : "subtract";
        return new Group(descriptions.map(function (description, index) {
            if (index > 0) {
                origin = origin[pointOperator](new Point(0, _this.dynamic.rectSize.height));
            }
            return _this.drawMemoryRect(canvas, origin, description);
        }));
    };
    /**
     * 绘制栈区抽象虚拟内存。案例参考：variable.stack.json。
     *
     * @param [canvas] 画布
     * @param {Point} [origin] 起点
     */
    library.drawStackMemoryAbstractly = function (canvas, origin) {
        var _this = this;
        console.info("drawStackMemoryAbstractly");
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
            _this.dynamic.labelTextLength = size.toString().length;
            _this.dynamic.labelSize.width = 50;
            var blocks = _this.buildBlocksForFrame(size);
            console.info("blocks.length: ", blocks.length);
            blocks = _this.sortBlocks(blocks);
            _this.setBlocksForFrame(blocks, data.blocks);
            _this.drawMemoryBlocks(canvas, origin, blocks);
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
     * @param {Number} size 空间，字节数
     * @param {Number} start 起始地址，从 0 开始，和汇编代码相匹配
     * @param {Number} step 步调，每格字节数
     * @return {MemoryBlock[]} 内存块集合
     */
    library.buildBlocksForFrame = function (size, start, step) {
        if (start === void 0) { start = 0; }
        if (step === void 0) { step = 8; }
        console.info("buildBlocksForFrame");
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
     * @param {MemoryBlock[]} template 模板内存块集合
     * @param {MemoryBlock[]} content 内容内存块集合
     * @param {Number} [step] 步调，每格字节数
     */
    library.setBlocksForFrame = function (template, content, step) {
        if (step === void 0) { step = 8; }
        console.info("setBlocksForFrame. total length: ".concat(template.length, ", content length: ").concat(content.length));
        var _loop_1 = function (contentBlock) {
            var index = template.findIndex(function (block) { return block.startAddress === contentBlock.startAddress; });
            if (index === -1)
                return { value: console.error("can't found ".concat(address)) };
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
     * @param [canvas] 画布
     * @param {Point} [origin] 起点
     * @param [content] 内容
     * @param [location] 内容
     * @return  虚拟内存图
     */
    library.drawMemoryForMaps = function (canvas, origin, content, location) {
        var _this = this;
        console.info("drawMemoryForMaps");
        this.setStyle('small');
        var common = this.plugIn.library("common");
        canvas = canvas || common.canvas();
        origin = origin || common.windowCenterPoint();
        // readFileContentForGraphic(canvas, "maps-location")
        return (content ? new Promise(function (resolve) { return resolve({ data: content }); }) : common.selectFile())
            // return (location ? common.readFileContent(location) : common.selectFile())
            .then(function (response) {
            console.info("selectFile response: ", response);
            var blocks = _this.resolveMaps(response.data);
            blocks.unshift({ startAddress: 0n, endAddress: blocks[0].startAddress }); // 从 0 开始显示
            blocks.push({
                startAddress: blocks[blocks.length - 1].endAddress,
                endAddress: BigInt("0xffffffffffffffff"), // 截止到 16 个 f，数值溢出，需要使用 BigInt
            });
            console.info("original blocks.length: ", blocks.length);
            blocks = _this.paddingBlocks(_this.sortBlocks(blocks));
            console.info("padding blocks.length: ", blocks.length);
            blocks = _this.mergeBlocks(blocks);
            console.info("merged blocks.length: ", blocks.length);
            return _this.drawMemoryBlocks(canvas, origin, blocks);
        })
            .catch(function (response) {
            console.error("selectFile response: ", response);
        });
    };
    /**
     * 解析内存映射。
     *
     * @param content 内存映射内容
     * @return {MemoryBlock[]} 内存块
     */
    library.resolveMaps = function (content) {
        //1                                  2     3         4      5        6
        //561d970c5000-561d970c6000          r--p  00000000  08:03  1581273  /usr/lib/jvm/java-17-openjdk-amd64/bin/java
        console.info("resolveMaps");
        var lines = content.split("\n");
        console.info("lines.length: ", lines.length);
        return lines.filter(function (line) { return line; })
            .map(function (line) { return line.split(/ +/); })
            .map(function (cells) {
            // console.info("cells: ", cells);
            var addresses = cells[0].split("-");
            // 16 个 f 需要使用 BigInt 才能表示
            return {
                startAddress: BigInt(parseInt(addresses.shift(), 16)),
                endAddress: BigInt(parseInt(addresses.shift(), 16)),
                description: (cells[5] || "").split("/").pop() || "[anon]" //全路径太长，只取末尾的程序名
            };
        });
    };
    /**
     * 合并相同描述的相邻内存块。此处假设相同描述的内存块是连续的。
     *
     * @param {MemoryBlock[]} blocks 内存块集合
     * @return {MemoryBlock[]} 内存块集合
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
     * @param {MemoryBlock[]} blocks 内存块集合
     * @return {MemoryBlock[]} 等于输入的内存块集合
     */
    library.sortBlocks = function (blocks) {
        blocks.sort(function (left, right) { return left.startAddress - right.startAddress; });
        return blocks;
    };
    /**
     * 对齐内存块集合。
     * 内存地址应该是连续的，在空缺处补齐。
     * @param {MemoryBlock[]} blocks 内存块集合
     * @return {MemoryBlock[]} 等于输入的内存块集合
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
     * @param {Point} origin 起点，矩形的左下点
     * @param {MemoryBlock[]} blocks 内存块集合
     * @return  绘制的图形
     */
    library.drawMemoryBlocks = function (canvas, origin, blocks) {
        var _this = this;
        console.info("drawMemoryBlocks");
        var array = blocks.map(function (block, index) {
            // console.info("block: ", JSON.stringify(block));
            if (index === 0)
                return _this.drawMemoryBlock(canvas, origin, block);
            origin = origin.subtract(new Point(0, _this.dynamic.rectSize.height));
            var prev = blocks[index - 1], curr = blocks[index];
            if (prev.endAddress < curr.startAddress) {
                origin = origin.subtract(new Point(0, _this.dynamic.rectSize.height));
            }
            else if (prev.endAddress > curr.startAddress) {
                origin = origin.add(new Point(0, _this.dynamic.rectSize.height / 2));
            }
            return _this.drawMemoryBlock(canvas, origin, block);
        });
        return new Group(array);
    };
    /**
     * 绘制虚拟内存单元，从下往上绘制。
     *
     * @param canvas 画布
     * @param {Point} startPoint 起点，矩形左下角处位置
     * @param {MemoryBlock} block 内存块
     * @return  绘制的图形
     */
    library.drawMemoryBlock = function (canvas, startPoint, block) {
        // console.info(`drawMemoryBlock. startPoint=${startPoint}, block=${block}`);
        var dynamic = this.dynamic;
        var endPoint = new Point(startPoint.x, startPoint.y - dynamic.rectSize.height);
        var graphics = [
            this.drawMemoryRect(canvas, endPoint, block.description),
            this.drawMemoryAddress(canvas, startPoint, block.startAddress),
            this.drawMemoryAddress(canvas, endPoint, block.endAddress),
        ];
        if (!dynamic.showSize)
            return new Group(graphics);
        var size = Number(block.endAddress - block.startAddress);
        if (dynamic.sizeStyle === 'outer')
            graphics.push(this.drawMemorySize(canvas, endPoint, size));
        else
            graphics[0].text += " (".concat(Number.formatMemorySize(size), ")");
        return new Group(graphics);
    };
    /**
     * 绘制内存矩形。
     *
     * @param canvas 画布
     * @param {Point} location 位置
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
     * @param {Point} origin 起点
     * @param {Number|BigInt} address 地址
     * @return {Group} 绘制的图形
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
     * PlugIn.find('com.github.peacetrue.learn.graffle').library('memory').formatMemoryAddress(BigInt("0xffffffffffffffff"))
     *
     * @param {Number|BigInt} address 内存地址
     * @return  内存地址描述
     */
    library.formatMemoryAddress = function (address) {
        // console.info(`formatMemoryAddress. address=${address}`);
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
     * @param {Point} location 位置
     * @param {Number} size 空间尺寸
     * @return {Group} 绘制的图形
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
        label.text = Number.formatMemorySize(size);
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
