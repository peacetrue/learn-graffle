(() => {

    let library = new PlugIn.Library(new Version("0.1"));
    library.plugIn.resourceNamed("libs/logger.js").fetch(response => eval(response.toString()));
    // 反例：其他类库未完成初始化时，不能获取当前类库
    // 正例：library.plugIn.resourceNamed("logger.js").fetch(response => eval(response.toString()));
    // eval 时需要注意绑定的对象
    library.loadClass = function (name, path = `libs/${name}.js`) {
        console.info("loadLib: ", path);
        if (name in Object) {
            console.info(`lib '${path}' loaded`);
            return new Promise((resolve, reject) => resolve(Object[name]))
        }
        return this.promiseUrlFetch(this.plugIn.resourceNamed(path))
            .then(response => {
                let content = response.data;
                console.info(`lib '${path}': \n`, content);
                eval(content);
                eval(`Object[name] = ${name}`);
                return Object[name];
            });
    }

    // library.plugIn.resourceNamed("libs/PeaceTable.js").fetch(response => {
    //     eval(response.toString());
    //     Object.PeaceTable = PeaceTable;
    // });

    library.test = function () {
        console.info("PeaceTable: ", Object.PeaceTable);
    }


    /** 如果想添加未事先声明的变量，需要使用 variables */
    library.dynamic = {};


    /**
     * 操作选项。
     *
     * @param {Canvas|Graphic|Object} object
     * @param {String} key
     * @param {Object} [value]
     * @return {Object}
     */
    library.option = function (object, key, value) {
        console.info(`option. object: ${object}, key: ${key}, value: ${value}`);
        let actions = {
            "Canvas": (key, value) => this.canvasOption(object, key, value),
            "*": (key, value) => value === undefined ? object.userData[key] : object.setUserData(key, value),
        }
        let className = object.constructor.name;
        let action = actions[className] || actions['*'];
        return action(key, value);
    }

    /** 保存各 canvas 的配置，以 canvas.name 为 key */
    library.canvases = {};

    /**
     * 操作 canvas 选项。
     *
     * @param {Canvas} canvas
     * @param {String} key
     * @param {Object} [value]
     * @return {Object}
     */
    library.canvasOption = function (canvas, key, value) {
        console.info(`canvasOption. canvas: ${canvas}, key: ${key}, value: ${value}`);
        let options = this.canvases[canvas.name];
        if (!options) {
            options = {};
            this.canvases[canvas.name] = options
        }
        return value === undefined ? options[key] : (options[key] = value);
    }

    /**
     * URL.fetch to Promise。
     *
     * @param {URL} url url
     * @return {Promise} URL.fetch(Data)
     */
    library.promiseUrlFetch = function (url) {
        return new Promise((resolve, reject) => {
            url.fetch(
                response => resolve({url, data: response.toString()}),
                response => reject(response)
            );
        });
    }

    /**
     * 设置画布。警告此方法无效，反面示例。
     *
     * 无法直接在 library 上设置属性，事先设置一个全局变量，例如：library.share = {}，然后操作该全局变量。
     *
     * @param {Canvas} canvas 画布
     */
    library.setCanvas = function (canvas) {
        this.canvas = canvas;
        console.info("this.canvas: ", this.canvas);
        this.share.canvas = canvas;
        console.info("this.share.canvas: ", this.share.canvas);
        // TypeError: Attempting to define property on object that is not extensible.
        Object.defineProperty(this, "canvas", {
            value: canvas,
            writable: true,
            enumerable: true,
            configurable: true
        });
    }


    /**
     * 获取当前选中的画布。
     *
     * PlugIn.find("com.github.peacetrue.learn.graffle").library("common").canvas()
     *
     * @return {Canvas}
     */
    library.canvas = function () {
        return document.windows[0].selection.canvas;
    }

    library.selectedGraphic = function () {
        return document.windows[0].selection.graphics[0];
    }

    /**
     * 获取当前窗口中心点。
     *
     * @return {Point}
     */
    library.windowCenterPoint = function () {
        return document.windows[0].centerVisiblePoint;
    }

    /**
     * 切换图层。不停地点击一个图形，以控制显示不同的图层。
     *
     * @param {Graphic} graphic 图形
     * @param {String} [layerKey] 图形键
     * @return {void}
     */
    library.switchLayers = function (graphic, layerKey = 'layer') {
        console.info("switchLayers");
        let parts = graphic.userData[layerKey].split('-');
        console.info("prev layer: ", ...parts);
        let layers = this.canvas().layers.filter(layer => layer.name.startsWith(parts[0]));
        for (let layer of layers) layer.visible = false;
        let index = parseInt(parts[1]) + 1;
        (index === layers.length) && (index = 0);
        layers[index].visible = true;
        graphic.setUserData(layerKey, `${parts[0]}-${index}`);
    }

    /**
     * 选择文件。
     *
     * @param {TypeIdentifier[]} [types] 文件类型集合
     * @return {Promise} URL.fetch -> Data
     */
    library.selectFile = function (types) {
        console.info("selectFile");
        let filePicker = new FilePicker();
        // filePicker.types = [TypeIdentifier.plainText, TypeIdentifier.csv, TypeIdentifier.json];
        filePicker.types = types;
        return filePicker.show().then(response => {
            console.info("filePicker.show response: ", response);
            return this.promiseUrlFetch(response[0]);
        });
    }

    /**
     * 为图形选择文件。选择文件后，记录下文件位置。
     *
     * @param {Graphic} graphic 图形
     * @param {String} locationKey 位置键
     * @return {Promise} URL.fetch(Data)
     */
    library.selectFileForGraphic = function (graphic, locationKey) {
        console.info("selectFileForGraphic");
        return this.selectFile()
            .then(response => {
                this.option(graphic, locationKey, response.url.toString());
                return response;
            })
            .catch(response => console.error("response: ", response));
    }

    /**
     * 读取文件内容。
     *
     * @param {String} location 文件位置
     * @return {Promise}
     */
    library.readFileContent = function (location) {
        !location.startsWith('file:') && (location = `file://${location}`);
        return this.promiseUrlFetch(URL.fromString(location));
    }

    /**
     * 从图形中读取文件内容。
     *
     * @param {Graphic} graphic 图形
     * @param {String} locationKey 文件位置键
     * @return {Promise} URL.fetch(Data)
     */
    library.readFileContentForGraphic = function (graphic, locationKey) {
        console.info("readFileContentForGraphic");
        let location = this.option(graphic, locationKey);
        console.info("location: ", location);
        if (!location) return this.selectFileForGraphic(graphic, locationKey);
        return this.readFileContent(location).catch(response => {
            // response:  Error: 未能完成操作。（kCFErrorDomainCFNetwork错误1。）
            console.error("promiseUrlFetch response: ", response);
            return this.selectFileForGraphic(graphic, locationKey);
        });
    }

    /**
     * 从文件读取内容后设置到图形中。
     * 文件内容过多，可分开显示到多个图形中。
     *
     * @param {Graphic[]} graphics 图形集合
     * @param {String} locationKey 位置键
     * @param {int} [length] 图形数目
     * @return {Promise}
     */
    library.loadGraphicsText = function (graphics, locationKey, length) {
        console.info("loadGraphicsText graphics.length: ", graphics.length);
        let graphic = graphics[0];
        length = length || graphic.userData['length'] || 1;
        return this.readFileContentForGraphic(graphic, locationKey)
            .then(response => {
                let canvas = this.canvas();
                let location = graphic.userData[locationKey];
                graphics = canvas.allGraphicsWithUserDataForKey(location, locationKey);
                console.info("allGraphicsWithUserDataForKey.length: ", graphics.length);
                if (graphics.length < length) graphics = this.duplicateGraphicToLayers(canvas, graphic, length);
                this.setGraphicsText(graphics, response.data);
                return response;
            })
            .catch(response => {
                console.error("readFileContentForGraphic response: ", response);
            });
    }

    /**
     * 将内容拆分后均匀分摊到图形集合。
     *
     * @param {Graphic[]} graphics 图形集合
     * @param {String} content 文本内容
     * @return {void}
     */
    library.setGraphicsText = function (graphics, content) {
        console.info("setGraphicsText");
        if (graphics.length === 1) return graphics[0].text = content;

        let lines = content.split("\n");
        let lineCountPerGraphic = lines.length / graphics.length;
        let index = 0;
        for (let graphic of graphics) {
            graphic.text = lines.slice(index, index += lineCountPerGraphic).join("\n");
        }
        if (index < lines.length - 1) {
            graphics.at(-1).text += "\n" + lines.slice(index).join("\n");
        }
    }

    /**
     * 复制图形到一个新创建的图层中。
     * 图层命名为：layer-0、layer-1。
     *
     * @param {Canvas} canvas 画布
     * @param {Graphic} graphic 图形
     * @param {int} length 图形数目
     * @return {void}
     */
    library.duplicateGraphicToLayers = function (canvas, graphic, length) {
        console.info("duplicateGraphicToLayers");
        let graphics = [graphic];
        let layerName = graphic.layer.name.split('-')[0];
        let prevLayer = graphic.layer;
        for (let i = graphics.length; i < length; i++) {
            let newLayer = canvas.newLayer();
            newLayer.name = `${layerName}-${i}`;
            newLayer.orderBelow(prevLayer);
            newLayer.visible = false;
            prevLayer = newLayer;

            let duplicate = graphic.duplicateTo(graphic.geometry.origin);
            duplicate.layer = newLayer;
            if (graphic.userData) {
                for (let key in graphic.userData) {
                    duplicate.setUserData(key, graphic.userData[key]);
                }
            }
            graphics.push(duplicate);
        }
        return graphics;
    }

    /**
     * 清除图形内的文本。
     *
     * @param {Graphic[]} graphics  图形
     */
    library.clearGraphicsText = function (graphics) {
        if (graphics instanceof Array) {
            return graphics.forEach(graphic => this.clearGraphicsText(graphic));
        }

        if (graphics instanceof Group) {
            graphics.graphics.forEach(graphic => this.clearGraphicsText(graphic))
        } else {
            graphics.strokeType && (graphics.text = "");
        }
    }

    /**
     * 获取矩形指定位置处的点。方位顺序：上下左右，top-left。
     *
     * @param {Rect} rect 矩形
     * @param {String} location 位置，top、middle、bottom、left、center、right
     * @return {Point} 点
     */
    library.pointOfRect = function (rect, location) {
        let parts = location.split('-');
        let vertical = parts.shift(), horizontal = parts.shift();
        let offsetWidth = 0;
        horizontal === 'left' && (offsetWidth = -rect.width / 2);
        horizontal === 'right' && (offsetWidth = rect.width / 2);
        let offsetHeight = 0;
        vertical === 'top' && (offsetHeight = -rect.height / 2);
        vertical === 'bottom' && (offsetHeight = rect.height / 2);
        return rect.center.add(new Point(offsetWidth, offsetHeight));
    }

    /**
     * 获取矩形各个位置处的点。
     *
     * PlugIn.find('com.github.peacetrue.learn.graffle').library('common').pointsOfRect();
     *
     * @param {Rect} rect 矩形
     * @return {Point[]} 点集合
     */
    library.pointsOfRect = function (rect) {
        let points = {};
        let verticals = ['top', 'middle', 'bottom']
        let horizontals = ['left', 'center', 'right']
        for (let vertical of verticals) {
            for (let horizontal of horizontals) {
                let key = `${vertical}-${horizontal}`;
                points[key] = this.pointOfRect(rect, key);
                // console.info(`${key}: ${points[key]}`);
            }
        }
        return points;
    }

    /**
     * 获取两点之间的中间点。
     *
     * @param {Point} start 起点
     * @param {Point} end 终点
     * @return {Point} 中点
     */
    library.centerOfPoints = function (start, end) {
        return new Point(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2,
        );
    }


    /**
     * 绘线，并在线上添加描述。
     *
     * @param {Canvas} canvas 画布
     * @param {Point[]} points 起止点集合
     * @param {String} [description] 描述
     * @param {Boolean} [center] 默认在起点处绘制文本，true 在中点处绘制文本
     * @return {Graphic} 线（或带文本）
     */
    library.drawLine = function (canvas, points, description, center) {
        let line = canvas.newLine();
        line.shadowColor = null;
        line.points = points;
        line.headType = "FilledArrow";
        if (!description) return line;
        let location = center ? this.centerOfPoints(points[0], points[points.length - 1]) : points[0];
        return new Group([line, canvas.addText(description, location)]);
    }


    library.getPosition = function (start, end, target) {
        const endVector = end.subtract(start);
        const targetVector = target.subtract(start);
        return endVector.x * targetVector.y - endVector.y * targetVector.x;
    }

    /** return 是无意义的，只是为了将代码写到一行。
     *
     * @param line
     * @return {any}
     */
    library.align = function (line) {
        if (line instanceof Array) return line.forEach(_line => this.align(_line));

        let points = line.points;
        if (points.length !== 3) return console.error("points.length: ", points.length);

        let position = this.getPosition(points[0], points[2], points[1]);
        if (position === 0) return;
        if ((points[2].y > points[0].y && position > 0) || (points[2].y < points[0].y && position < 0)) points[1] = new Point(points[0].x, points[2].y);
        if ((points[2].y > points[0].y && position < 0) || (points[2].y < points[0].y && position > 0)) points[1] = new Point(points[2].x, points[0].y);
        line.points = points; //必须，触发视图渲染
    }

    library.adjustTable = function (table, rows, columns) {
        let maxRows = Math.max(rows, table.rows);
        let maxColumns = Math.max(columns, table.columns);
        for (let i = 0; i < maxRows; i++) {
            for (let j = 0; j < maxColumns; j++) {
                let graphic = table.graphicAt(i, j);
                if (graphic == null) {
                    let prevGraphic = table.graphicAt(i, j - 1);
                    let geometry = prevGraphic.geometry;
                    // shape.geometry = new Rect(point.x, point.y, size.width, size.height);//几何体边界：矩形
                    prevGraphic.duplicateTo(prevGraphic, new Point(geometry.x + geometry.width, geometry.y));
                }
            }
        }
    }

    /**
     * 提取表格数据。
     * @param table 表格
     * @returns {[][]} 二位数组
     */
    library.extractTable = function (table) {
        let data = [];
        for (let i = 0; i < table.rows; i++) {
            data.push([]);
            for (let j = 0; j < table.columns; j++) {
                let graphic = table.graphicAt(i, j);
                graphic && (data[i][j] = graphic.text);
            }
        }
        return data;
    }

    /**
     * 使用数据填充表格。
     * @param table 表格
     * @param data 二位数组
     */
    library.fillTable = function (table, data) {
        for (let i = 0; i < table.rows; i++) {
            for (let j = 0; j < table.columns; j++) {
                let graphic = table.graphicAt(i, j);
                graphic.text = (data[i] || [])[j] || "";
            }
        }
    }

    /**
     * 定位到选中图形所在位置。
     */
    library.locateCenter = function () {
        let window = document.windows[0];
        let selection = window.selection;
        let graphics = selection.graphics;
        if (graphics.length === 0) return console.warn("locateCenter: no selection.graphics");
        window.setViewForCanvas(selection.canvas, window.zoom, graphics[0].geometry.center);
    }

    /**
     * 获取正向连接的图形，忽略反向连接的。
     *
     * @param {Graphic[]} source 源始图形集合
     * @param {Graphic[]} target 目标图形集合
     */
    library.addConnected = function (source, target) {
        console.info(`addConnected. target.length=${target.length}`);
        if (!source) return;

        if (source instanceof Array) {
            source.forEach(item => this.addConnected(item, target));
        } else {
            target.push(source);
            if (source instanceof Line) {
                this.addConnected(source.head, target);
            } else if (source instanceof Graphic) {
                this.addConnected(source.outgoingLines, target);
            }
        }
    }

    /**
     * 高亮选中及连接的图形。
     *
     * @param {Graphic[]} graphics 图形集合
     */
    library.highlightConnected = function (graphics) {
        console.info(`highlightConnected. graphics.length=${graphics.length}`);
        let target = [];
        this.addConnected(graphics, target);
        console.info(`target.length=${target.length}`);
        document.windows[0].selection.view.select(target, false);
    }

    /**
     * 设置自动化动作。
     *
     * PlugIn.find("com.github.peacetrue.learn.graffle").library("common").setAutomationAction();
     */
    library.setAutomationAction = function (action = "graphic_lighlight") {
        document.windows[0].selection.graphics.forEach(graphic => {
            graphic.automationAction = ["com.github.peacetrue.learn.graffle", action];
        });
    }


    return library;
})();
