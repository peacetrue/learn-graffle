/** 日志级别 */
enum LoggerLevel {
  OFF,
  ERROR,
  WARN,
  INFO,
  DEBUG,
}

/** 日志类 */
class Logger {

  /** 是否启用内部日志，仅针对 Logger 自身的方法 */
  public static enabledInnerLogger: boolean = false;
  /** 根日志分类 */
  public static CATEGORY_ROOT: string = "ROOT";
  /** 日志配置，不同的类和方法使用不同的日志级别 */
  public static config: Record<string, LoggerLevel> = {
    [Logger.CATEGORY_ROOT]: LoggerLevel.DEBUG,
    "Common.canvas": LoggerLevel.WARN,
    "Common.selection": LoggerLevel.WARN,
    "Common.windowCenterPoint": LoggerLevel.WARN,
    "Common": LoggerLevel.DEBUG,
    "MemoryPainter.incrementOrigin": LoggerLevel.WARN,
    "MemoryPainter.subtract": LoggerLevel.WARN,
    "MemoryPainter.getDirectionHandler": LoggerLevel.WARN,
    "EntityProperty.parse": LoggerLevel.WARN,
  };
  /** 日志缓存，category 为 key */
  public static loggers: Record<string, Logger> = {};
  /** 当前函数所处的层级 */
  public static functionHierarchy: number = 0;
  /** 当前函数所处的日志分类 */
  public static functionCategory: string = Logger.CATEGORY_ROOT;

  /** 日志分类 */
  public category: string;

  constructor(category: string) {
    this.category = category;
  }

  /** 记录内部日志 */
  public static log(...args) {
    // @ts-ignore
    if (Logger.enabledInnerLogger) console.info(...args);
  }

  /** 获取日志实例对象，按日志分类缓存日志实例对象 */
  public static getLogger(category: string = Logger.functionCategory) {
    Logger.log(`Logger.getLogger: ${category}`);
    let logger = Logger.loggers[category];
    Logger.log(`category: ${category}=${logger}`);
    if (logger) return logger;
    logger = new Logger(category);
    Logger.loggers[category] = logger;
    Logger.log(`category: ${category}=${logger}`);
    return logger;
  }

  /** 获取日志级别，默认使用根日志分类的基本 */
  public getLevel() {
    for (let category in Logger.config) {
      if (this.category.startsWith(category)) return Logger.config[category];
    }
    return Logger.config[Logger.CATEGORY_ROOT];
  }

  /** 是否启用了指定的日志级别 */
  public isLevelEnabled(level: LoggerLevel) {
    // 配置的级别 >= 使用的级别
    let thisLevel = this.getLevel();
    Logger.log(`isLevelEnabled: ${LoggerLevel[thisLevel]} >= ${LoggerLevel[level]}`);
    return thisLevel >= level;
  }

  /** 记录日志信息 */
  public log(level: LoggerLevel, args: any[]) {
    Logger.log(`Logger.log: level=${level}, args=${args}`);
    if (!this.isLevelEnabled(level)) return;
    let levelName = LoggerLevel[level];
    let formattedLevelName = Logger.leftPad(levelName, 5, ' ');
    let indent = "  ".repeat(Logger.functionHierarchy);
    levelName = levelName.toLowerCase();
    Logger.log(`Logger.log: levelName=${levelName}, levelName in console=`, levelName in console);
    // console.info(BigInt(1)) 导致程序异常退出
    args.forEach((value, index) => typeof value === "bigint" && (args[index] = value.toString()))
    console[levelName in console ? levelName : "info"](`[${formattedLevelName}]`, indent, ...args);
  }

  static leftPad(src: string, length: number, paddingChar = ' ') {
    if (src.length >= length) return src;
    return paddingChar.repeat(length - src.length) + src;
  }

  public error(...args: any[]) {
    this.log(LoggerLevel.ERROR, args);
  }

  public warn(...args: any[]) {
    this.log(LoggerLevel.WARN, args);
  }

  public info(...args: any[]) {
    this.log(LoggerLevel.INFO, args);
  }

  public debug(...args: any[]) {
    this.log(LoggerLevel.DEBUG, args);
  }


  /**
   * 代理类实例上的函数
   *
   * @param instance 类实例对象
   * @return 类实例对象的代理对象
   */
  public static proxyInstance<T extends object>(instance: T) {
    return new Proxy(instance, {
      get(target, name, receiver) {
        let value = target[name];
        // 排除继承的方法，例如：Object 上的
        if (!(name in Object.prototype) && typeof value === "function") {
          return Logger.buildFunctionProxy(value, instance.constructor.name, name.toString());
        }
        // if (Logger.isCustomType(value)) return Logger.proxyInstance(value);
        return value;
      },
    });
  }

  private static isCustomType(value: any): boolean {
    return value != null && value.constructor && !Logger.isSimpleType(value);
  }

  private static isSimpleType(value: any): boolean {
    return [Object, Number, Boolean, String, Array]
      .map(item => item.name)
      .includes(value.constructor.name);
  }

  /**
   * 代理类上的静态函数，不代理类函数本身
   * @param clazz JS 类，本质还是一个函数
   * @see buildFunctionProxy
   */
  public static proxyClassStaticFunction(clazz: Function) {
    let properties = Object.getOwnPropertyNames(clazz);
    properties.filter(property => typeof clazz[property] === "function").forEach(property => {
      clazz[property] = Logger.buildFunctionProxy(clazz[property], clazz.name || clazz.constructor.name, property);
    })
  }

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
  public static buildFunctionProxy(func: Function, ownerName?: string, functionName?: string) {
    return new Proxy(func, {
      apply(target, thisArg, argumentsList) {
        let name = ownerName || thisArg.constructor.name;
        name += "." + (functionName || target.name);
        let logger = Logger.getLogger(name);
        Logger.functionCategory = name;
        Logger.functionHierarchy++;
        logger.info(`${name}(arguments ${argumentsList.length})`);
        argumentsList.forEach((argument, index) => logger.debug(`[${index}]: ${Logger.formatArray(argument)}`));
        let result = target.apply(thisArg, argumentsList);
        logger.debug(`${name}(result): `, typeof result === "string" ? `'${result}'` : Logger.formatArray(result));
        Logger.functionHierarchy--;
        return result;
      }
    });
  }

  static formatArray(argument: any) {
    return argument instanceof Array ? ('array[' + argument.length + ']') : argument;
  }
}


class Common {

  /**  9 个磁极，9 宫格 */
  public static magnets_6 = [
    new Point(-1.00, -1.00), new Point(-1.00, 0), new Point(-1.00, 1.00),
    new Point(0, -1.00), new Point(0, 0), new Point(0, 1.00),
    new Point(1.00, -1.00), new Point(1.00, 0), new Point(1.00, 1.00),
  ];
  /** 保存各 canvas 的配置，以 canvas.name 为 key */
  public static canvasOptions = {};

  /**
   * 操作选项。
   *
   * @param object
   * @param key
   * @param [value]
   * @return
   */
  public static option(object: Solid | Canvas, key: string, value?: string) {
    let actions = {
      "Canvas": (object: Canvas, key, value) => this.canvasOption(object, key, value),
      "*": (object: Graphic, key, value) => value === undefined ? object.userData[key] : object.setUserData(key, value),
    }
    let className = object.constructor.name;
    let action = actions[className] || actions['*'];
    return action(object, key, value);
  }


  /**
   * 操作 canvas 选项。
   *
   * @param canvas
   * @param key
   * @param [value]
   * @return
   */
  public static canvasOption(canvas: Canvas, key, value) {
    let options = this.canvasOptions[canvas.name];
    if (!options) {
      options = {};
      this.canvasOptions[canvas.name] = options
    }
    return value === undefined ? options[key] : (options[key] = value);
  }

  /** URL.fetch to Promise。*/
  public static promiseUrlFetch(url: URL): Promise<{ url: URL, data: string }> {
    return new Promise((resolve, reject) => {
      url.fetch(
        response => resolve({url, data: response.toString()}),
        response => reject(response)
      );
    });
  }

  public static promise<T>(data: T): Promise<T> {
    return new Promise((resolve, reject) => resolve(data));
  }

  /** 获取当前选中对象。*/
  public static selection(): Selection {
    return document.windows[0].selection;
  }

  /** 获取当前选中的画布。*/
  public static canvas(): Canvas {
    return this.selection().canvas;
  }

  /** 获取当前选中的第一个元素。*/
  public static selectedGraphic(): Graphic | undefined {
    return this.selection().graphics[0];
  }

  /** 获取当前窗口中心点。*/
  public static windowCenterPoint() {
    return document.windows[0].centerVisiblePoint;
  }


  /**
   * 选择文件。
   *
   * @param [types] 文件类型集合
   * @return
   */
  public static selectFile(types?: TypeIdentifier[]) {

    let filePicker = new FilePicker();
    filePicker.types = types;
    return filePicker.show().then(response => {

      return this.promiseUrlFetch(response[0]);
    });
  }

  /**
   * 选择文件后，记录下文件位置。
   *
   * @param object 关联对象
   * @param locationKey 位置键
   */
  public static selectFileAssociatively(object: Solid | Canvas, locationKey: string) {

    return this.selectFile().then(response => {
      this.option(object, locationKey, response.url.toString());
      return response;
    })
      // selectFileForGraphic error:  Error: User cancelled 操作已被取消。
      // .catch(response => {
      //     Logger.getLogger().error("selectFileForGraphic error: ", response);
      // })
      ;
  }

  /**
   * 读取文件内容。
   *
   * @param location 文件位置
   */
  public static readFileContent(location: string) {
    !location.startsWith('file:') && (location = `file://${location}`);
    return this.promiseUrlFetch(URL.fromString(location));
  }

  /**
   * 从关联对象中读取文件内容。
   *
   * @param object 关联对象
   * @param locationKey 文件位置键
   */
  public static readFileContentAssociatively(object: Solid | Canvas, locationKey: string) {
    if (app.shiftKeyDown) {
      this.option(object, locationKey, null);
      return Promise.reject("clear cache!");
    }
    let location = this.option(object, locationKey);
    if (!location) return this.selectFileAssociatively(object, locationKey);
    return this.readFileContent(location).catch(response => {
      // response:  Error: 未能完成操作。（kCFErrorDomainCFNetwork错误1。）
      console.error("promiseUrlFetch response: ", response);
      return this.selectFileAssociatively(object, locationKey);
    });
  }

  /**
   * 选择性地读取文件内容。
   *
   * @param object 关联对象
   * @param locationKey 文件位置键
   * @param [content] 可选的内容
   */
  public static readFileContentSelectively(object: Solid | Canvas, locationKey: string, content?: string) {
    return (
      content
        ? Common.promise({url: null as URL, data: content})
        : Common.readFileContentAssociatively(object, locationKey)
    )
      // .then(response => {
      //   Logger.getLogger().debug("response.data: \n", response.data);
      //   return {...response, data: JSON.parse(response.data)};
      // })
      ;
  }

  /**
   * 从文件读取内容后设置到图形中。
   * 文件内容过多，可分开显示到多个图形中。
   *
   * @param graphics 图形集合
   * @param locationKey 位置键
   * @param [length] 图形数目
   */
  public static loadGraphicsText(graphics: Solid[], locationKey: string, length?: number) {
    let graphic = graphics[0];
    length = length || graphic.userData['length'] || 1;
    return this.readFileContentAssociatively(graphic, locationKey)
      .then(response => {
        let canvas = this.canvas();
        let location = graphic.userData[locationKey];
        graphics = canvas.allGraphicsWithUserDataForKey(location, locationKey) as Solid[];

        if (graphics.length < length) graphics = this.duplicateGraphicToLayers(canvas, graphic, length);
        this.setGraphicsText(graphics, response.data);
        return response;
      })
      .catch(response => {
        console.error("loadGraphicsText response: ", response);
      });
  }

  /**
   * 将内容拆分后均匀分摊到图形集合。
   *
   * @param graphics 图形集合
   * @param text 文本内容
   */
  public static setGraphicsText(graphics: Solid[], text) {

    if (graphics.length === 1) {
      return graphics[0].text = text;
    }

    let lines = text.split("\n");
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
   * 设置图形内容为行号。
   *
   * @param graphic 图形
   * @param lineCountKey 行数键
   * @param lineCountValue 行数值
   */
  public static setGraphicLineNumber(graphic: Solid, lineCountKey: string = "line.count", lineCountValue: number = 10) {
    lineCountValue = graphic.userData[lineCountKey] || lineCountValue;
    graphic.text = Array.from({length: lineCountValue}, (_, i) => i + 1).join("\n");
  }

  /**
   * 复制图形到一个新创建的图层中。
   * 图层命名为：layer-0、layer-1。
   *
   * @param canvas 画布
   * @param graphic 图形
   * @param {int} length 图形数目
   * @return {void}
   */
  public static duplicateGraphicToLayers(canvas, graphic, length) {

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
   * @param graphics 图形
   */
  public static clearGraphicsText(graphics: Graphic | Graphic[]) {
    if (graphics instanceof Array) {
      graphics.forEach(graphic => this.clearGraphicsText(graphic));
      return;
    }

    if (graphics instanceof Group) {
      graphics.graphics.forEach(graphic => this.clearGraphicsText(graphic))
    } else {
      // 带边框的图形
      graphics instanceof Solid && graphics.strokeType && (graphics.text = "");
    }
  }

  /**
   * 获取矩形指定位置处的点。方位顺序：上下左右，top-left。
   *
   * @param rect 矩形
   * @param location 位置，top、middle、bottom、left、center、right
   * @return 点
   */
  public static pointOfRect(rect: Rect, location: string) {
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
   * @param rect 矩形
   * @return {Point[]} 点集合
   */
  public static pointsOfRect(rect) {
    let points = {};
    let verticals = ['top', 'middle', 'bottom']
    let horizontals = ['left', 'center', 'right']
    for (let vertical of verticals) {
      for (let horizontal of horizontals) {
        let key = `${vertical}-${horizontal}`;
        points[key] = this.pointOfRect(rect, key);
      }
    }
    return points;
  }

  /**
   * 获取两点之间的中间点。
   *
   * @param start 起点
   * @param end 终点
   * @return 中点
   */
  public static centerOfPoints(start, end) {
    return new Point(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2,
    );
  }


  /**
   * 绘线，并在线上添加描述。
   *
   * @param canvas 画布
   * @param {Point[]} points 起止点集合
   * @param [description] 描述
   * @param {Boolean} [center] 默认在起点处绘制文本，true 在中点处绘制文本
   * @return  线（或带文本）
   */
  public static drawLine(canvas: Canvas, points, description, center) {
    let line = canvas.newLine();
    line.shadowColor = null;
    line.points = points;
    line.headType = "FilledArrow";
    if (!description) return line;
    let location = center ? this.centerOfPoints(points[0], points[points.length - 1]) : points[0];
    return new Group([line, canvas.addText(description, location)]);
  }


  public static getPosition(start, end, target) {
    const endVector = end.subtract(start);
    const targetVector = target.subtract(start);
    return endVector.x * targetVector.y - endVector.y * targetVector.x;
  }

  /** return 是无意义的，只是为了将代码写到一行。
   *
   * @param line
   * @return {any}
   */
  public static align(line) {
    if (line instanceof Array) return line.forEach(_line => this.align(_line));

    let points = line.points;
    if (points.length !== 3) return

    let position = this.getPosition(points[0], points[2], points[1]);
    if (position === 0) return;
    if ((points[2].y > points[0].y && position > 0) || (points[2].y < points[0].y && position < 0)) points[1] = new Point(points[0].x, points[2].y);
    if ((points[2].y > points[0].y && position < 0) || (points[2].y < points[0].y && position > 0)) points[1] = new Point(points[2].x, points[0].y);
    line.points = points; //必须，触发视图渲染
  }

  public static adjustTable(table, rows, columns) {
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
  public static extractTable(table) {
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
  public static fillTable(table, data) {
    for (let i = 0; i < table.rows; i++) {
      for (let j = 0; j < table.columns; j++) {
        let graphic = table.graphicAt(i, j);
        graphic.text = (data[i] || [])[j] || "";
      }
    }
  }

  /** 定位到选中图形所在位置 */
  public static locateCenter() {
    let window = document.windows[0];
    let selection = window.selection;
    let graphics = selection.graphics;
    if (graphics.length === 0) return
    window.setViewForCanvas(selection.canvas, window.zoom, graphics[0].geometry.center);
  }

  /**
   * 获取正向连接的图形，忽略反向连接的。
   *
   * @param source 源始图形集合
   * @param target 目标图形集合
   */
  public static addConnected(source, target) {
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
   * @param graphics 图形集合
   */
  public static highlightConnected(graphics) {
    let target = [];
    this.addConnected(graphics, target);
    document.windows[0].selection.view.select(target, false);
  }

  /**
   * 设置自动化动作。
   *
   * PlugIn.find("com.github.peacetrue.learn.graffle").library("common").setAutomationAction();
   */
  public static setAutomationAction(action = "graphic_lighlight") {
    document.windows[0].selection.graphics.forEach(graphic => {
      graphic.automationAction = ["com.github.peacetrue.learn.graffle", action];
    });
  }

  // library.plugIn.resourceNamed("libs/logger.js").fetch(response => eval(response.toString()));
  // 反例：其他类库未完成初始化时，不能获取当前类库
  // 正例：library.plugIn.resourceNamed("logger.js").fetch(response => eval(response.toString()));
  // eval 时需要注意绑定的对象
  public static loadClass(plugIn: PlugIn, name, path = `libs/${name}.js`) {
    if (name in Object) {
      return new Promise((resolve, reject) => resolve(Object[name]))
    }
    return this.promiseUrlFetch(plugIn.resourceNamed(path))
      .then(response => {
        let content = response.data;
        eval(content);
        eval(`Object[name] = ${name}`);
        return Object[name];
      });
  }

  public static move(graphic: Graphic, distance: Point = new Point(0, 30)) {
    graphic instanceof Line
      ? this.moveLine(graphic, distance)
      : this.moveSolid(graphic as Solid, distance)
  }

  public static moveLine(line: Line, distance: Point) {
    line.points = line.points.map(item => item.add(distance));
    line.head = null;
    line.tail = null;
  }

  public static moveSolid(solid: Solid, distance: Point) {
    solid.geometry = solid.geometry.offsetBy(distance.x, distance.y);
  }

  public static moveToSolid(solid: Solid, origin: Point) {
    solid.geometry = new Rect(origin.x, origin.y, solid.geometry.width, solid.geometry.height);
  }

  /** TODO 删除元素很慢 */
  public static clearLayer(layer: Layer, limit: number = 1) {
    return layer.graphics.length <= limit
      ? Common.clearLayerByRemoveGraphics(layer)
      : Common.clearLayerByRebuildLayer(layer);
  }

  public static clearLayerByRemoveGraphics(layer: Layer) {
    layer.graphics.forEach(item => item.remove());
    return layer;
  }

  public static clearLayerByRebuildLayer(layer: Layer) {
    if (layer.graphics.length === 0) return layer;
    let name = layer.name;
    layer.remove();
    layer = Common.canvas().newLayer();
    layer.name = name;
    return layer;
  }

  /**
   * 格式化内存空间。
   * @param  sizeInBytes 内存空间
   * @returns  带单位的内存空间
   */
  public static formatMemorySize(sizeInBytes: number) {
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let size = sizeInBytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  public static leftPad(src: string, length: number, paddingChar = ' ') {
    if (src.length >= length) return src;
    return paddingChar.repeat(length - src.length) + src;
  }

  public static bolder(graphic: Graphic) {
    if (graphic instanceof Solid) graphic.fontName = "PingFangSC-Semibold";
    else if (graphic instanceof Group) {
      graphic.graphics
        .filter(item => item instanceof Solid)
        .forEach(item => this.bolder(item));
    }
  }

  public static size2point(size: Size): Point {
    return new Point(size.width, size.height);
  }

  public static invokeCachely<K extends string, V>(cache: Record<K, V>, key: K, invoker: (key: K) => V) {
    let value = cache[key];
    if (value) return value;
    value = invoker(key);
    cache[key] = value;
    return value;
  }

}

/**
 * 枚举，key 为名称，value 为索引，即针对后 3 项
 * GroupDirection：{0: "BOTTOM_UP", 1: "LEFT_RIGHT", 2: "RIGHT_LEFT", BOTTOM_UP: 0, LEFT_RIGHT: 1, RIGHT_LEFT: 2}
 */
class Enum {
  public static view(enums: Record<string | number, number | string>) {
    let keys = Object.keys(enums);
    console.info("keys: ", keys);
    let values = Object.values(enums);
    console.info("values: ", values);
  }

  /**
   * 获取 键 集合，键是枚举名称。
   * Object.keys(GroupDirection)：0,1,2,3,LEFT_RIGHT,RIGHT_LEFT,UP_BOTTOM,BOTTOM_UP
   */
  public static keys(enums: Record<string | number, number | string>) {
    let keys = Object.keys(enums);
    return keys.slice(keys.length / 2);
  }

  /**
   * 获取 值 集合，值是枚举索引
   * Object.values(GroupDirection)：LEFT_RIGHT,RIGHT_LEFT,UP_BOTTOM,BOTTOM_UP,0,1,2,3
   */
  public static values(enums: Record<string | number, number | string>) {
    let keys = Object.values(enums);
    return keys.slice(keys.length / 2) as number[];
  }
}


/** 索引切换者。*/
class IndexSwitcher {
  public start: number;// include
  public end: number;// exclude
  public current: number;
  private step: number = 1;

  constructor(start: number = 0, end: number = 10, current: number = 0) {
    this.start = start;
    this.end = end;
    this.current = current;
  }

  public isStart() {
    return this.current === this.start;
  }

  public isEnd() {
    return this.current === this.end - 1;
  }

  public prev() {

    this.current = this.isStart() ? this.end : this.current - this.step;
    return this.current;
  }

  public next() {

    this.current = this.isEnd() ? this.start : this.current + this.step;
    return this.current;
  }
}


/** 步进器上下文 */
class StepperContext implements Record<string, any> {
  public stepper: Stepper;
  /**单独使用一个图层绘制元素*/
  public layer: Layer;
  /**图形缓存，提供 key 共享访问*/
  private graphics: Record<string, Graphic> = {};
  /**不需要访问的图形，自动使用内部索引*/
  private graphicIndex: number = 0;

  public addGraphic(graphic: Graphic, key?: string) {
    //删除已存在的图形
    if (key && key in this.graphics) this.graphics[key].remove();
    graphic.layer = this.layer;
    this.graphics[key || this.graphicIndex++] = graphic;
  }

  public getGraphic<T extends Graphic>(key: string): T {
    return this.graphics[key] as T;
  }

  public clear() {

    this.layer = Common.clearLayer(this.layer, 100);
    Object.keys(this.graphics).forEach(key => delete this.graphics[key]);
    return this;
  }

}

/** 步进器处理器 */
type StepperHandler = (ctx: StepperContext) => any;

/**
 * 步进器。
 */
class Stepper {

  public static steppers: Record<string, Stepper> = {};
  public static ctxNameKey: string = "stepper.ctx";
  public static ctxNameValue: string = "Make";
  public static layerName: string = "stepper";

  /** 有多少步，每步执行哪些动作 */
  public settings: StepperHandler[][] = [];
  /** 控制执行到哪一步 */
  public indexSwitcher: IndexSwitcher;
  /** 执行过程中，动作使用的共享上下文信息 */
  public context: StepperContext;

  public static switch(graphic?: Graphic) {

    let canvasName = Common.canvas().name;

    let stepper = Stepper.steppers[canvasName];

    // shift 强制重新配置
    if (app.shiftKeyDown || !stepper) {
      if (stepper) stepper.context.clear();
      let ctxName = this.ctxNameValue;
      graphic && (ctxName = graphic.userData[this.ctxNameKey]);
      return Stepper.steppers[canvasName] = Stepper.init(ctxName);
    }
    stepper.switch();
  }

  public static init(ctxName: string) {

    let stepper = new Stepper();
    stepper.context = new StepperContext();
    stepper.context.stepper = stepper;
    stepper.context.layer = this.getLayer();
    // see Make.setup
    eval(ctxName).setup(stepper);
    stepper.indexSwitcher = new IndexSwitcher(0, stepper.settings.length);
    stepper.invoke();
    return stepper;
  }

  public static getLayer() {
    let layer = Common.canvas().layers.find(layer => layer.name === this.layerName);
    if (!layer) {
      layer = Common.canvas().newLayer();
      layer.name = this.layerName;
    }
    return layer;
  }

  public switch() {

    this.invoke(app.optionKeyDown ? this.indexSwitcher.prev() : this.indexSwitcher.next());
  }

  public invoke(index: number = this.indexSwitcher.current) {

    this.settings[index].forEach(handler => handler(this.context));
  }

  public autoSwitch(interval: number = 1) {
    this.switch();
    if (this.indexSwitcher.isEnd()) return;
    Timer.once(interval, () => this.autoSwitch());
  }

  public static clear(ctx: StepperContext) {
    ctx.clear();
  }

  public static next(ctx: StepperContext) {
    ctx.stepper.switch();
  }

}

class MakeStepperContext extends StepperContext {
  public refer: Solid;
  public origin: Point;
  public lineHeight: number;
}

class Make {

  public static linePointerWidth: number = 100;
  public static contentOffset: number = 100;
  public static referName: string = "case";

  public static linePointer: string = "linePointer";
  public static immediate: string = "immediate";
  public static value1: string = "value1";
  public static immediateLine: string = "immediateLine";
  public static deferred: string = "deferred";
  public static deferredLine: string = "deferredLine";
  public static immediate2: string = "immediate2";
  public static immediate2Line: string = "immediate2Line";
  public static value2: string = "value2";
  public static value3: string = "value3";

  public static setup(stepper: Stepper) {

    let context = stepper.context as MakeStepperContext;
    context.refer = (Common.selectedGraphic() || Common.canvas().graphicWithName(Make.referName)) as Solid;
    context.origin = context.refer.geometry.origin.add(new Point(context.refer.geometry.width, 0));
    context.lineHeight = Make.calLineHeight(context.refer);


    let moveStep1: StepperHandler = Make.moveLinePointer;
    let moveStep2: StepperHandler = Make.buildMoveLinePointer(2);
    let moveStep3: StepperHandler = Make.buildMoveLinePointer(3.5);
    let moveStep7: StepperHandler = Make.buildMoveLinePointer(7);
    let backStep10: StepperHandler = Make.buildMoveLinePointer(-10);

    let settings: StepperHandler[][] = [];
    settings.push([Stepper.clear, Stepper.next]);
    settings.push([Make.newLinePointer]);
    settings.push([moveStep1, Make.newImmediate]);
    settings.push([moveStep1, Make.newDeferred]);
    settings.push([moveStep1, Make.newImmediate2]);
    settings.push([moveStep1, Make.immediateAssign2]);
    settings.push([moveStep1, ctx => Make.drawText(ctx, "phases.1:")]);
    settings.push([moveStep2, ctx => Make.drawText(ctx, "phases.2:")]);
    settings.push([moveStep2, ctx => Make.drawText(ctx, "phases.case: phases.1 phases.2")]);
    settings.push([moveStep7, Make.immediateAssign3]);
    settings.push([backStep10, ctx => Make.drawText(ctx, "  phases.1")]);
    settings.push([moveStep2, ctx => Make.drawText(ctx, "   phases.2")]);
    settings.push([moveStep3, ctx => Make.drawText(ctx, "   phases.1 phases.2")]);
    settings.push([moveStep1, ctx => Make.drawText(ctx, "   phases.immediate: 3")]);
    settings.push([moveStep1, ctx => Make.drawText(ctx, "   phases.immediate2: 1")]);
    settings.push([moveStep1, ctx => Make.drawText(ctx, "   phases.deferred: 3")]);
    stepper.settings = settings;
  }

  public static calLineHeight(graphic: Solid) {
    let lineCount = graphic.text.split("\n").length;
    let totalLineHeight = graphic.geometry.height - graphic.textVerticalPadding * 2;
    return totalLineHeight / lineCount;
  }

  public static newLinePointer(ctx: MakeStepperContext) {

    let line = Common.canvas().newLine();
    let start = ctx.origin.add(new Point(-100, ctx.refer.textVerticalPadding + ctx.lineHeight / 2 + ctx.lineHeight * 2));
    line.points = [start, start.subtract(new Point(Make.linePointerWidth, 0))];
    line.headType = "FilledArrow";
    ctx.addGraphic(line, Make.linePointer);
  }


  public static moveLinePointer(ctx: MakeStepperContext, stepCount: number = 1) {
    Common.moveLine(ctx.getGraphic(Make.linePointer), new Point(0, ctx.lineHeight * stepCount));
  }

  public static buildMoveLinePointer(stepCount: number = 1) {
    return (ctx: MakeStepperContext) => Make.moveLinePointer(ctx, stepCount);
  }

  public static currentContentPoint(ctx: StepperContext) {
    let linePointer = ctx.getGraphic<Line>(Make.linePointer);
    return new Point((ctx as MakeStepperContext).origin.x + Make.contentOffset, linePointer.points[0].y);
  }

  public static drawText(ctx: StepperContext, text: string, key?: string, offset?: Point) {
    let point = Make.currentContentPoint(ctx);
    if (offset) point = point.add(offset);
    let solid = Common.canvas().addText(text, point);
    solid.textSize = 12;
    ctx.addGraphic(solid, key);
    return solid;
  }

  public static connect(ctx: StepperContext, head: Solid, tail: Solid, key?: string) {
    let line = Common.canvas().connect(head, tail);
    line.headType = "FilledArrow";
    ctx.addGraphic(line, key);
    return line;
  }

  public static newImmediate(ctx: StepperContext) {

    let immediate = Make.drawText(ctx, "phases.immediate", Make.immediate);
    let value1 = Make.drawText(ctx, "1", Make.value1, new Point(150, 0));
    Make.connect(ctx, immediate, value1, Make.immediateLine);
  }

  public static newDeferred(ctx: StepperContext) {
    let deferred = Make.drawText(ctx, "phases.deferred", Make.deferred, new Point(-50, 0));
    Make.connect(ctx, deferred, ctx.getGraphic<Solid>(Make.immediate), Make.deferredLine);
  }

  public static newImmediate2(ctx: StepperContext) {
    let immediate2 = Make.drawText(ctx, "phases.immediate2", Make.immediate2);
    Make.connect(ctx, immediate2, ctx.getGraphic<Solid>(Make.value1), Make.immediate2Line);
  }

  public static immediateAssign2(ctx: StepperContext) {
    let value2 = Make.drawText(ctx, "2", Make.value2, new Point(150, 0));
    Make.connect(ctx, ctx.getGraphic<Solid>(Make.immediate), value2, Make.immediateLine);
  }

  public static immediateAssign3(ctx: StepperContext) {
    let value3 = Make.drawText(ctx, "3", Make.value3, new Point(150, 0));
    Make.connect(ctx, ctx.getGraphic<Solid>(Make.immediate), value3, Make.immediateLine);
  }
}

/** 图层切换模式 */
enum LayerSwitchMode {
  rotate,//轮换
  increase, //渐显
  custom,//自定义
}

/**
 * 图层切换器。
 */
class LayerSwitcher {

  /**图形名称前缀键*/
  public static layerNamePrefixKey: string = "layer-name-prefix";
  /**图形切换模式键*/
  public static layerSwitchModeKey: string = "layer-switch-mode";
  /**图形自定义设置键*/
  public static layerCustomSettingsKey: string = "layer-custom-settings";
  public static layerNamePrefix: string = "layer";
  public static layerSwitchMode: LayerSwitchMode = LayerSwitchMode.increase;
  public static layerCustomSettings: number[][] = [[0]];
  public static layerArguments: Record<string, any> = {
    [LayerSwitcher.layerNamePrefixKey]: LayerSwitcher.layerNamePrefix,
    [LayerSwitcher.layerSwitchModeKey]: LayerSwitcher.layerSwitchMode,
    [LayerSwitcher.layerCustomSettingsKey]: LayerSwitcher.layerCustomSettings,
  };
  public static layerSwitchers: Record<string, LayerSwitcher> = {};

  /**哪些图层参与切换*/
  public layers: Layer[] = [];
  /**可以切换多少次，每次显示哪些图层*/
  public settings: number[][] = [];
  /**控制切换到哪个索引位置*/
  public indexSwitcher: IndexSwitcher;
  /**参数缓存*/
  public layerArguments;

  /**
   * 切换图层。
   * @param [graphic] 图形，该图形上记录着图层切换参数
   */
  public static switch(graphic?: Graphic) {

    graphic && this.layerNamePrefixKey in graphic.userData
      ? this.switchByGraphic(graphic)
      : this.switchByForm();
  }

  /**
   * 切换图层通过表单参数。
   */
  public static switchByForm() {

    let canvasName = Common.canvas().name;

    let layerSwitcher = LayerSwitcher.layerSwitchers[canvasName];

    // shift 强制重新配置
    if (app.shiftKeyDown || !layerSwitcher) {
      let form = new Form();
      form.addField(new Form.Field.String(this.layerNamePrefixKey, "图层名称前缀", this.layerNamePrefix, null), 0);
      form.addField(new Form.Field.Option(this.layerSwitchModeKey, "图层切换模式", Object.values(LayerSwitchMode).slice(3), ["轮换", "渐显", "自定义"], this.layerSwitchMode, null), 1);
      form.addField(new Form.Field.String(this.layerCustomSettingsKey, "图层自定义配置", JSON.stringify(this.layerCustomSettings), null), 2);
      return form.show("配置图层切换参数", "确定")
        .then(response => {
          let values = response.values;
          LayerSwitcher.layerSwitchers[canvasName] = LayerSwitcher.init(
            values[this.layerNamePrefixKey], values[this.layerSwitchModeKey], JSON.parse(values[this.layerCustomSettingsKey]),
          );
        })
        .catch(response => console.error("error:", response));
    }

    layerSwitcher.switch();
  }

  /**
   * 切换图层通过图形参数。
   *
   * @param graphic 图形，该图形上记录着图层切换参数
   */
  public static switchByGraphic(graphic: Graphic) {

    let layerSwitcher = LayerSwitcher.layerSwitchers[graphic.name];

    if (app.shiftKeyDown || !layerSwitcher) {
      let layerNamePrefix = graphic.userData[this.layerNamePrefixKey];
      let layerSwitchMode = LayerSwitchMode[graphic.userData[this.layerSwitchModeKey]];
      let layerCustomSettings = graphic.userData[this.layerCustomSettingsKey];
      return this.layerSwitchers[graphic.name] = LayerSwitcher.init(
        layerNamePrefix, layerSwitchMode as any, layerCustomSettings
      );
    }

    layerSwitcher.switch();
  }

  public static init(layerNamePrefix: string = LayerSwitcher.layerNamePrefix,
                     layerSwitchMode = LayerSwitchMode.rotate,
                     layerCustomSettings: number[][]): LayerSwitcher {


    let layerSwitcher = new LayerSwitcher();
    // 图层顺序：底部的图层排在前面，顶上的图层排在后面
    layerSwitcher.layers = Common.canvas().layers.filter(layer => layer.name.startsWith(layerNamePrefix)).reverse();
    if (layerSwitchMode == LayerSwitchMode.rotate) {
      layerSwitcher.settings = layerSwitcher.layers.map((layer, index) => [index]);
    } else if (layerSwitchMode == LayerSwitchMode.increase) {
      layerSwitcher.settings = layerSwitcher.layers.map((layer, index) => Array.from({length: index + 1}, (_, i) => i));
    } else {
      layerSwitcher.settings = layerCustomSettings;
    }
    layerSwitcher.settings.unshift([]);//最初不显示任何图层

    layerSwitcher.indexSwitcher = new IndexSwitcher(0, layerSwitcher.settings.length);
    layerSwitcher.show();
    return layerSwitcher;
  }

  public switch() {

    this.show(app.optionKeyDown ? this.indexSwitcher.prev() : this.indexSwitcher.next());
  }

  public show(index: number = this.indexSwitcher.current) {

    this.hiddenAll();
    index in this.settings
    && this.settings[index]
      .filter(item => item in this.layers)
      .forEach(item => this.layers[item].visible = true);
  }

  private hiddenAll() {
    for (let layer of this.layers) layer.visible = false;
  }
}

class TablePainter {
  /**
   * 绘制表格。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param texts 文本
   * @return 形状
   */
  public drawTable(canvas: Canvas, origin: Point, texts: string[][]): Group {
    let increase = new Point(0, 0);
    return new Group(
      texts.map((item, index) => {
        origin = index === 0 ? origin : origin = origin.add(increase);
        return this.drawRow(canvas, origin, item);
      })
    );
  }

  /**
   * 绘制行。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param texts 文本
   * @return 形状
   */
  public drawRow(canvas: Canvas, origin: Point, texts: string[]): Group {
    return undefined;
  }


  public static extractGraphicTexts(graphic: Graphic | Graphic[]): any[] {
    let texts: object[] = [];
    if (!(graphic instanceof Array)) graphic = [graphic];

    graphic.forEach(item => this.extractGraphicTextsRecursively(item, texts));
    return texts;
  }

  public static extractGraphicTextsRecursively(graphic: Graphic, texts: any[]): void {

    if (graphic instanceof Solid) {
      texts.push(this.extractSolidText(graphic));
    } else if (graphic instanceof Group) {
      if (graphic instanceof Table) {
        texts.push(...this.extractTableTexts(graphic));
      } else {
        for (let subGraphic of graphic.graphics) {
          this.extractGraphicTextsRecursively(subGraphic, texts);
        }
      }
    }
  }

  public static extractTableTexts(table: Table): string[][] {
    let texts: string[][] = [];
    for (let i = 0; i < table.rows; i++) {
      texts.push([]);
      for (let j = 0; j < table.columns; j++) {
        let graphic = table.graphicAt(i, j);
        graphic && graphic instanceof Solid && (texts[i][j] = this.extractSolidText(graphic));
      }
    }
    return texts;
  }

  public static extractSolidText(solid: Solid): string {
    return solid.text;
  }
}

/**
 * 组方向即数据展示方向。
 * 绘图方向始终是从上向下，数据展示方向则有多种可能。
 * 内存块集合传入时约定为升序排列（无序会自动排序），
 * 通过控制内存块集合的排序（升序/降序），可以控制内存的显示方向
 */
enum GroupDirection {
  LEFT_RIGHT,//从左往右
  RIGHT_LEFT,//从右往左，每个地址都对应一个字节，字节内部各标志位使用情况；eflags 寄存器各标志位使用情况
  UP_BOTTOM,//从上往下
  BOTTOM_UP,//从下往上，虚拟地址空间图
}

/** 处理与组方向相关的内容 */
interface GroupDirectionHandler {

  /** 排序元素集合 */
  order(elements: any[]): void;

  /** 获取下一个元素起点 */
  getNextOrigin(painter: GroupPainter<any>, origin: Point): Point;
}

/** 提供空实现。 */
class GroupDirectionHandlerAdapter implements GroupDirectionHandler {

  order(blocks: any[]): void {
  }

  getNextOrigin(painter: GroupPainter<any>, origin: Point): Point {
    return origin;
  }

}

/** 顺序的 */
class SequentialGroupDirectionHandler extends GroupDirectionHandlerAdapter {

  public static defaults: SequentialGroupDirectionHandler = new SequentialGroupDirectionHandler();

}

/** 逆序的 */
class ReverseGroupDirectionHandler extends GroupDirectionHandlerAdapter {

  public static defaults: ReverseGroupDirectionHandler = new ReverseGroupDirectionHandler();

  /** 排序内存块集合 */
  order(blocks: any[]): void {
    blocks.reverse();
  }

}

class HorizontalGroupDirectionHandler extends GroupDirectionHandlerAdapter {

  public static defaults: HorizontalGroupDirectionHandler = new HorizontalGroupDirectionHandler();

  getNextOrigin(painter: GroupPainter<any>, origin: Point): Point {
    return origin.add(new Point(painter.cellSize.width, 0));
  }

}

class VerticalGroupDirectionHandler extends GroupDirectionHandlerAdapter {

  public static defaults: VerticalGroupDirectionHandler = new VerticalGroupDirectionHandler();

  getNextOrigin(painter: GroupPainter<any>, origin: Point): Point {
    return origin.add(new Point(0, painter.cellSize.height));
  }

}

class CompositeGroupDirectionHandler implements GroupDirectionHandler {

  /** 顺序 / 逆序 */
  private orderHandler: GroupDirectionHandler;
  /** 水平 / 垂直 */
  private axisHandler: GroupDirectionHandler;

  constructor(orderHandler: GroupDirectionHandler, axisHandler: GroupDirectionHandler) {
    this.orderHandler = orderHandler;
    this.axisHandler = axisHandler;
  }

  order(elements: any[]): void {
    this.orderHandler.order(elements);
  }

  getNextOrigin(painter: GroupPainter<any>, origin: Point): Point {
    return this.axisHandler.getNextOrigin(painter, origin);
  }

}

/**
 * 组绘制者，绘制一组相关元素。
 *
 * @param <E> 元素类型
 */
abstract class GroupPainter<E> {

  public static directionHandlers = GroupPainter.buildDirectionHandlers();

  public static buildDirectionHandlers() {
    let directionHandlers: Record<GroupDirection, GroupDirectionHandler> = {
      [GroupDirection.LEFT_RIGHT]: new CompositeGroupDirectionHandler(SequentialGroupDirectionHandler.defaults, HorizontalGroupDirectionHandler.defaults),
      [GroupDirection.RIGHT_LEFT]: new CompositeGroupDirectionHandler(ReverseGroupDirectionHandler.defaults, HorizontalGroupDirectionHandler.defaults),
      [GroupDirection.UP_BOTTOM]: new CompositeGroupDirectionHandler(SequentialGroupDirectionHandler.defaults, VerticalGroupDirectionHandler.defaults),
      [GroupDirection.BOTTOM_UP]: new CompositeGroupDirectionHandler(ReverseGroupDirectionHandler.defaults, VerticalGroupDirectionHandler.defaults),
    }
    Object.keys(directionHandlers).forEach((value, index) => {
      directionHandlers[value] = Logger.proxyInstance(directionHandlers[value]);
    });
    return directionHandlers;
  }

  public static cellFillColors: Record<string, Color> = {
    "[anon]": Color.RGB(0.75, 1.0, 0.75, null),// 浅绿，已占用但不知道具体用途
    "": Color.RGB(0.8, 0.8, 0.8, null),        // 灰色，无描述表示未使用
    "*": Color.RGB(0.75, 1.0, 1.0, null),      // 蓝色，有效数据
  };

  public cellSize: Size = new Size(200, 20);
  public cellTextSize: number = 12;
  public cellFillColor: Color = Color.RGB(1.0, 1.0, 0.75, null);// 黄色
  public direction: GroupDirection = GroupDirection.UP_BOTTOM;

  /**
   * 绘制。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param content 内容
   * @return 形状
   */
  public draw(canvas: Canvas, origin: Point, content: E[]): Group {
    let directionHandler = this.getDirectionHandler();
    directionHandler.order(content);
    return new Group(content.map((text, index) => {
      origin = index === 0 ? origin : directionHandler.getNextOrigin(this, origin);
      return this.drawCell(canvas, origin, text);
    }));
  }

  public getDirectionHandler() {
    return GroupPainter.directionHandlers[this.direction];
  }

  public abstract drawCell(canvas: Canvas, origin: Point, element: E);

}

/**
 * 组绘制者，绘制一组相关元素。
 *
 * @param <E> 元素类型
 */
class StringGroupPainter extends GroupPainter<string> {

  /** 倾向于水平绘图，宽度调小 */
  public static horizontal = StringGroupPainter.instance({cellSize: new Size(150, 20)});
  public static vertical = StringGroupPainter.instance({cellSize: new Size(200, 20)});
  public static defaults = this.horizontal;

  public static instance<T>(options: Partial<StringGroupPainter>) {
    return Logger.proxyInstance(Object.assign(new StringGroupPainter(), options));
  }

  /** 缓存每个 canvas 使用的 Painter */
  public static canvasCache: Record<string, StringGroupPainter> = {};
  /** 绘制模式-键 */
  public static modeKey: string = "mode";
  /** 绘制模式-默认值*/
  public static modeValue: number = GroupDirection.BOTTOM_UP;
  /** 文件位置键 */
  public static locationKey = this.name;

  /**
   * 绘制地址空间布局。
   *
   * @param canvas 画布
   * @param origin 起点
   * @return 虚拟内存图
   */
  public static draw(canvas: Canvas = Common.canvas(), origin: Point = Common.windowCenterPoint()) {
    let canvasName = canvas.name;
    let painter = StringGroupPainter.canvasCache[canvasName];
    // shift 强制重新配置
    if (app.shiftKeyDown || !painter) {
      let form = new Form();
      form.addField(new Form.Field.Option(this.modeKey, "绘制模式", Enum.values(GroupDirection), Enum.keys(GroupDirection), this.modeValue, null), 0);
      return form.show("配置地址空间绘制参数", "确定")
        .then(response => {
          painter = this.instance({direction: response.values[this.modeKey]});
          StringGroupPainter.canvasCache[canvasName] = painter;
          painter.drawInteractively(canvas, origin);
        })
        .catch(response => Logger.getLogger().error("error:", response));
    }
    // option 重新选择文件
    if (app.optionKeyDown) Common.option(canvas, MemoryPainter.drawMemoryLocationKey, null);
    return painter.drawInteractively(canvas, origin);
  }

  public static drawScript(options: { direction: string, content: string[] }) {
    return this.instance({...options, direction: GroupDirection[options.direction]})
      .draw(Common.canvas(), Common.windowCenterPoint(), options.content);
  }

  /**
   * 交互式地绘制虚拟内存。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param [content] 内容
   * @return 虚拟内存图
   */
  public drawInteractively(canvas: Canvas = Common.canvas(), origin: Point = Common.windowCenterPoint(), content?: string) {
    return Common.readFileContentSelectively(canvas, StringGroupPainter.locationKey, content)
      .then(response => {
        return JSON.parse(response.data);
      })
      .then(response => this.draw(canvas, origin, response))
      .catch(response => Logger.getLogger().error(response));
  }

  /**
   * 绘制单元格。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param text 文本
   * @return 形状
   */
  public drawCell(canvas: Canvas, origin: Point, text?: string): Shape {
    let shape = canvas.newShape();
    shape.geometry = new Rect(origin.x, origin.y, this.cellSize.width, this.cellSize.height);
    shape.shadowColor = null;
    this.cellTextSize && (shape.textSize = this.cellTextSize);
    this.cellFillColor = StringGroupPainter.cellFillColors[text || ""] || StringGroupPainter.cellFillColors["*"];
    this.cellFillColor && (shape.fillColor = this.cellFillColor);
    text && (shape.text = text);
    shape.magnets = Common.magnets_6;
    return shape;
  }

}

class ClassDiagram {

  public entities: Entity[];
  public entry?: string; //入口类名

  public static parse(content: Partial<ClassDiagram>) {
    let classDiagram = Object.assign(new ClassDiagram(), content);
    classDiagram.entities = content.entities.map(item => Entity.parse(item));
    return classDiagram;
  }

  // public toString() {
  //   return JSON.stringify({...this, entities: this.entities?.length});
  // }
}

class Entity {
  public name: string;
  public properties: EntityProperty[];

  public static parse(content: Partial<Entity>) {
    let entity = Object.assign(new Entity(), content);
    entity.properties = content.properties.map(item => EntityProperty.parse(item));
    return entity;
  }

  public toString() {
    return JSON.stringify({...this, properties: this.properties?.length});
  }
}

class EntityProperty {
  public entity?: Entity;
  public type: string;
  public name: string;
  public ref?: string;

  public static parse(content: Partial<EntityProperty>) {
    return Object.assign(new EntityProperty(), content);
  }

  public toString() {
    return JSON.stringify({...this, entity: this.entity?.name});
  }
}

class Instance {
  public type: string;
  public properties: InstanceProperty[];

  public static parse(content: Partial<Instance>) {
    let entity = Object.assign(new Instance(), content);
    entity.properties = content.properties.map(item => InstanceProperty.parse({...item, instance: entity}));
    return entity;
  }

  public toString() {
    return JSON.stringify({...this, properties: this.properties?.length});
  }
}

class InstanceProperty {
  public instance?: Instance;
  public name: string;
  public value: string;

  public static parse(content: Partial<InstanceProperty>) {
    return Object.assign(new InstanceProperty(), content);
  }

  public toString() {
    return JSON.stringify({...this, instance: this.instance?.type});
  }
}

class ClassDiagramPainter {

  public static locationKey: string = ClassDiagramPainter.name;
  public static defaults: ClassDiagramPainter = Logger.proxyInstance(new ClassDiagramPainter());
  public table: StringGroupPainter = StringGroupPainter.defaults;
  public offset: Size = new Size(100, 100);

  /** 插件入口 */
  public static draw(canvas: Canvas = Common.canvas(), origin: Point = Common.windowCenterPoint()) {
    return this.defaults.drawInteractively(canvas, origin);
  }

  /** 脚本入口 */
  public static drawScript(content: Record<string, any>) {
    return this.defaults.draw(Common.canvas(), Common.windowCenterPoint(), ClassDiagram.parse(content));
  }

  public drawInteractively(canvas: Canvas, origin: Point) {
    return Common.readFileContentAssociatively(canvas, ClassDiagramPainter.locationKey)
      .then(response => {
        return this.draw(canvas, origin, ClassDiagram.parse(JSON.parse(response.data)));
      })
      .catch(response => Logger.getLogger().error(response));
  }

  private static entities: Entity[] = [];
  private static entityGraphics: Record<string, Group> = {};

  public static resetCache(entities: Entity[]) {
    ClassDiagramPainter.entities = entities;
    ClassDiagramPainter.entityGraphics = {};
  }

  public static invokeCachely(key: string, invoker: (key: string) => Group) {
    return Common.invokeCachely(ClassDiagramPainter.entityGraphics, key, invoker);
  }

  public draw(canvas: Canvas, origin: Point, classDiagram: ClassDiagram) {
    ClassDiagramPainter.resetCache(classDiagram.entities);
    // 水平方法绘制实体类
    let increase: Point = new Point(this.table.cellSize.width + this.offset.width, 0);
    // let increase: Point = new Point(0, this.table.cellSize.height + this.offset.height);
    let entities = classDiagram.entities;
    if (classDiagram.entry) entities = classDiagram.entities.filter(item => item.name == classDiagram.entry);
    return entities.map((entity, index) => {
      return ClassDiagramPainter.invokeCachely(entity.name, () => {
        origin = index === 0 ? origin : origin.add(increase);
        return this.drawEntity(canvas, origin, entity);
      });
    });
  }


  public drawEntity(canvas: Canvas, origin: Point, entity: Entity) {
    let increase: Point = new Point(0, this.table.cellSize.height);
    let header = this.drawHeader(canvas, origin, entity.name);
    let properties = entity.properties.map((property, index) => {
      return this.drawProperty(canvas, origin = origin.add(increase), property);
    });
    return new Group([header, ...properties]);
  }

  public drawHeader(canvas: Canvas, origin: Point, name) {
    let header = this.table.drawCell(canvas, origin, name);
    Common.bolder(header);
    return header;
  }

  public drawProperty(canvas: Canvas, origin: Point, property: EntityProperty) {
    let cell = this.table.drawCell(canvas, origin, `${property.type}:${property.name}`);
    cell.textHorizontalAlignment = HorizontalTextAlignment.Left;
    this.drawPropertyRef(canvas, origin, cell, property);
    return cell;
  }

  public drawPropertyRef(canvas: Canvas, origin: Point, propertyCell: Shape, property: EntityProperty) {
    if (!property.ref) return;
    let entity = ClassDiagramPainter.entities.find(item => item.name == property.ref);
    if (!entity) return;
    origin = origin.add(new Point(this.table.cellSize.width + this.offset.width, 0));
    let entityGroup = ClassDiagramPainter.invokeCachely(entity.name, () => this.drawEntity(canvas, origin, entity));
    let entityHeader = entityGroup.graphics[entityGroup.graphics.length - 1];
    let line = canvas.connect(propertyCell, entityHeader);
    line.lineType = LineType.Orthogonal; // 直角
    line.tailMagnet = 8; // 磁极索引从 1 开始，逆时针转动
    line.headType = "FilledArrow";
    line.headMagnet = 2;
  }

}

/** 内存 */
class Memory {

  public title: string;//标题
  public blocks: MemoryBlock[] = [];//内存块集合
  public notes: MemoryNote[] = [];//内存块注释

  public static instance(content: Partial<Memory>) {
    return Object.assign(new Memory(), content);
  }

  /** 解析内存数据 */
  public static parse(content: string, type: string) {
    if (type === "json") {
      let object: any = JSON.parse(content);
      return object instanceof Array
        ? this.instance({blocks: MemoryBlock.parseObject(object)})
        : this.instance({
          ...object,
          notes: MemoryNote.parseObject(object.notes),
          blocks: MemoryBlock.parseObject(object.blocks)
        });
    }
    return this.instance({blocks: MemoryBlock.parse(content, type)});
  }

  public toString() {
    return JSON.stringify({...this, blocks: `[${this.blocks?.length}]`});
  }


}

/** 内存块 */
class MemoryBlock {

  public startAddress: number | bigint;//起始地址
  public endAddress: number | bigint;//结束地址
  public description?: string; //描述

  public static construct(startAddress?: number | bigint, endAddress?: number | bigint, description?: string) {
    let block = new MemoryBlock();
    block.startAddress = startAddress;
    block.endAddress = endAddress;
    block.description = description;
    return block;
  }

  /** 实例化 */
  public static instance(object: string | Partial<MemoryBlock>): MemoryBlock {
    if (typeof object === "string") return MemoryBlock.construct(undefined, undefined, object);
    return Object.assign(new MemoryBlock(), object);
  }

  public static parse(content: string | Record<string, any>[], type: string): MemoryBlock[] {
    switch (type) {
      case "maps":
        return this.parseMaps(content as string);
      case "frames":
        return this.parseFrames(content as string);
      case "json":
        return this.parseJson(content as string);
      default:
        return this.parseObject(content as Record<string, any>[]);
    }
  }

  /** 从 json 字符串解析 */
  public static parseJson(content: string): MemoryBlock[] {
    return this.parseObject(JSON.parse(content));
  }

  public static parseObject(content: (string | Record<string, any>)[]): MemoryBlock[] {
    return content.map(item => this.instance(item));
  }

  /** 解析内存映射，升序排列。linux 下 /proc/<pid>/maps 内容 */
  public static parseMaps(content: string): MemoryBlock[] {
    //1                                  2     3         4      5        6
    //561d970c5000-561d970c6000          r--p  00000000  08:03  1581273  /usr/lib/jvm/java-17-openjdk-amd64/bin/java
    let lines = content.split("\n");
    let blocks = lines
      .filter(line => line.trim())   // 删除空行
      .map(line => line.split(/ +/)) // 按空格分割
      .map(elements => {
        let addresses = elements[0].split("-");
        // 16 个 f 需要使用 bigint 才能表示
        return MemoryBlock.construct(
          BigInt(parseInt(addresses[0], 16)),
          BigInt(parseInt(addresses[1], 16)),
          (elements[5] || "").split("/").pop() || "[anon]",//全路径太长，只取末尾的程序名
        )
      });
    // 填充顶部
    blocks.unshift(MemoryBlock.construct(BigInt(0), blocks[0].startAddress));// 从 0 开始显示
    // 填充尾部
    blocks.push(MemoryBlock.construct(
      blocks[blocks.length - 1].endAddress,// bigint 和 bigint 才能相减求 size
      BigInt("0xffffffffffffffff"),// 截止到 16 个 f，数值溢出，需要使用 bigint
    ));
    this.merge(blocks);
    return blocks;
  }

  /** 解析栈帧信息，升序排列 */
  public static parseFrames(content: string): MemoryBlock[] {
    // * thread #1, name = 'thread.bin'
    //   * {"startAddress": "0x00007fffffffdf70", "endAddress": "0x00007fffffffe050", "description": "libc.so.6`__GI___futex_abstimed_wait_cancelable64" }
    let lines = content.split("\n").filter(item => item.trim());
    lines = Array.from(new Set(lines)); // 除重
    return lines.map(line => line.substr(line.indexOf("*") + 1))
      .map(item => JSON.parse(item))
      .map(item => MemoryBlock.construct(parseInt(item.startAddress, 16), parseInt(item.endAddress, 16), item.description))
      // 过滤掉 {"startAddress": "0x00007fffffffe1b0", "endAddress": "0x0000000000000000", "description": "thread.bin`_start" }
      .filter(item => item.endAddress > item.startAddress)
      ;
  }


  public size() {
    return MemoryBlock.subtract(this.endAddress, this.startAddress);
  }

  public toString() {
    return `'${this.description}':${this.startAddress}~${this.endAddress}`;
  }

  /** 获取最大的地址长度，需要将所有地址格式化成统一长度 */
  public static getMaxAddressLength(blocks: MemoryBlock[], base: number = 10) {
    return Math.max(...blocks.map(block => block.endAddress == null ? 0 : block.endAddress.toString(base).length));
  }

  public static subtract(left: number | bigint, right: number | bigint) {
    return Number(BigInt(left) - BigInt(right));
  }


  /** 按内存地址升序排列 */
  public static ascend(blocks: MemoryBlock[]) {
    blocks.sort((left, right) => MemoryBlock.subtract(left.startAddress, right.startAddress));
  }

  /** 按内存地址降序排列 */
  public static descend(blocks: MemoryBlock[]) {
    blocks.sort((left, right) => MemoryBlock.subtract(right.startAddress, left.startAddress));
  }

  /**
   * 对齐内存块集合，此函数要求内存块集合已有序排列。
   * 内存地址应该是连续的，在空缺处补齐。
   *
   * @param blocks 内存块集合
   * @param [asc] 内存块集合是否升序排列
   */
  public static padding(blocks: MemoryBlock[], asc: boolean = true) {
    for (let i = 1; i < blocks.length; i++) {
      let prev = blocks[i - 1], curr = blocks[i];
      //地址不连续，补齐空缺
      if (asc) {
        if (prev.endAddress < curr.startAddress) {
          blocks.splice(i, 0, MemoryBlock.construct(prev.endAddress, curr.startAddress));
          i++;
        }
      } else {
        if (prev.startAddress > curr.endAddress) {
          blocks.splice(i, 0, MemoryBlock.construct(curr.endAddress, prev.startAddress));
          i++;
        }
      }
    }
  }

  /**
   * 合并相同描述的相邻内存块，此函数要求内存块集合已有序排列。
   *
   * @param blocks 内存块集合
   */
  public static merge(blocks: MemoryBlock[]) {
    for (let i = 1; i < blocks.length; i++) {
      let prev = blocks[i - 1], curr = blocks[i];
      if (prev.description === curr.description) {
        prev.endAddress = curr.endAddress; // 上一块的结束地址指向当前块的结束地址
        blocks.splice(i, 1); // 删除当前块
        i--;
      }
    }
  }


}

class MemoryNote {
  public start: number;//起始地址
  public end: number;//结束地址
  public description: string; //描述

  /** 实例化 */
  public static instance(object: Partial<MemoryNote>) {
    return Object.assign(new MemoryNote(), object);
  }

  public static parseObject(content?: Record<string, any>[]): MemoryNote[] {
    return content?.map(item => this.instance(item));
  }

}


/** 内存绘制方向影响相关图形起点的处理方式 */
interface MemoryDirectionHandler {
  order(blocks: MemoryBlock[]): void;

  getNextOrigin(painter: MemoryPainter, origin: Point): Point;

  getAddressLineOrigin(painter: MemoryPainter, origin: Point): Point;

  getAddressLineEndpoint(painter: MemoryPainter, origin: Point): Point;

  getAddressLabelOrigin(painter: MemoryPainter, origin: Point): Point;

  getAddressStartValue(painter: MemoryPainter, block: MemoryBlock): number | bigint;

  getAddressEndValue(painter: MemoryPainter, block: MemoryBlock): number | bigint;
}

class MemoryDirectionHandlerAdapter implements MemoryDirectionHandler {

  order(blocks: MemoryBlock[]): void {
  }

  getNextOrigin(painter: MemoryPainter, origin: Point): Point {
    return origin;
  }

  getAddressLineOrigin(painter: MemoryPainter, origin: Point): Point {
    return origin;
  }

  getAddressLineEndpoint(painter: MemoryPainter, origin: Point): Point {
    return origin;
  }

  getAddressLabelOrigin(painter: MemoryPainter, origin: Point): Point {
    return origin;
  }

  getAddressStartValue(painter: MemoryPainter, block: MemoryBlock): number | bigint {
    throw new Error("The method must be overwrite!");
  }

  getAddressEndValue(painter: MemoryPainter, block: MemoryBlock): number | bigint {
    throw new Error("The method must be overwrite!");
  }

}

/** 顺序 */
class MemoryOrderHandler extends MemoryDirectionHandlerAdapter {

  public static defaults: MemoryOrderHandler = new MemoryOrderHandler();

  /** 排序内存块集合 */
  order(blocks: MemoryBlock[]): void {
    if (blocks.length > 0 && blocks[0].startAddress == undefined) return;//只有描述，没有坐标
    MemoryBlock.ascend(blocks);
    MemoryBlock.padding(blocks, true);
  }

  getAddressStartValue(painter: MemoryPainter, block: MemoryBlock): number | bigint {
    return block.startAddress;
  }

  getAddressEndValue(painter: MemoryPainter, block: MemoryBlock): number | bigint {
    return block.endAddress;
  }

}

/** 逆序 */
class MemoryReverseHandler extends MemoryDirectionHandlerAdapter {
  public static defaults: MemoryOrderHandler = new MemoryReverseHandler();

  /** 排序内存块集合 */
  order(blocks: MemoryBlock[]): void {
    if (blocks.length > 0 && blocks[0].startAddress == undefined) return;//只有描述，没有坐标
    MemoryBlock.descend(blocks);
    MemoryBlock.padding(blocks, false);
  }

  getAddressStartValue(painter: MemoryPainter, block: MemoryBlock): number | bigint {
    return block.endAddress;
  }

  getAddressEndValue(painter: MemoryPainter, block: MemoryBlock): number | bigint {
    return block.startAddress;
  }

}

class MemoryHorizontalHandler extends MemoryDirectionHandlerAdapter {

  public static defaults: MemoryHorizontalHandler = new MemoryHorizontalHandler();

  getNextOrigin(painter: MemoryPainter, origin: Point): Point {
    return origin.add(new Point(painter.table.cellSize.width, 0));
  }

  getAddressLineOrigin(painter: MemoryPainter, origin: Point): Point {
    return origin.add(new Point(0, painter.table.cellSize.height));
  }

  getAddressLineEndpoint(painter: MemoryPainter, origin: Point): Point {
    return origin.add(new Point(0, painter.addressLineLength));
  }

  getAddressLabelOrigin(painter: MemoryPainter, origin: Point): Point {
    return origin.add(new Point(0, 12 / 2));
  }
}

class MemoryVerticalHandler extends MemoryDirectionHandlerAdapter {

  public static defaults: MemoryVerticalHandler = new MemoryVerticalHandler();

  getNextOrigin(painter: MemoryPainter, origin: Point): Point {
    return origin.add(new Point(0, painter.table.cellSize.height));
  }

  getAddressLineEndpoint(painter: MemoryPainter, origin: Point): Point {
    return origin.subtract(new Point(painter.addressLineLength, 0));
  }

  getAddressLabelOrigin(painter: MemoryPainter, origin: Point): Point {
    return origin.subtract(new Point(painter.addressLabelTextLength / 2 * 8, 0));
  }
}

class AbstractMemoryDirectionHandler implements MemoryDirectionHandler {

  private orderHandler: MemoryDirectionHandler;
  private directionHandler: MemoryDirectionHandler;

  constructor(orderHandler: MemoryDirectionHandler, directionHandler: MemoryDirectionHandler) {
    this.orderHandler = orderHandler;
    this.directionHandler = directionHandler;
  }

  order(blocks: MemoryBlock[]) {
    this.orderHandler.order(blocks);
  }

  getAddressLabelOrigin(painter: MemoryPainter, origin: Point): Point {
    return this.directionHandler.getAddressLabelOrigin(painter, origin);
  }

  getAddressLineEndpoint(painter: MemoryPainter, origin: Point): Point {
    return this.directionHandler.getAddressLineEndpoint(painter, origin);
  }

  getAddressLineOrigin(painter: MemoryPainter, origin: Point): Point {
    return this.directionHandler.getAddressLineOrigin(painter, origin);
  }

  getNextOrigin(painter: MemoryPainter, origin: Point): Point {
    return this.directionHandler.getNextOrigin(painter, origin);
  }

  getAddressStartValue(painter: MemoryPainter, block: MemoryBlock): number | bigint {
    return this.orderHandler.getAddressStartValue(painter, block);
  }

  getAddressEndValue(painter: MemoryPainter, block: MemoryBlock): number | bigint {
    return this.orderHandler.getAddressEndValue(painter, block);
  }

}

class LeftRightHandler extends AbstractMemoryDirectionHandler {
  constructor() {
    super(MemoryOrderHandler.defaults, MemoryHorizontalHandler.defaults);
  }
}

class RightLeftHandler extends AbstractMemoryDirectionHandler {
  constructor() {
    super(MemoryReverseHandler.defaults, MemoryHorizontalHandler.defaults);
  }
}

class UpBottomHandler extends AbstractMemoryDirectionHandler {
  constructor() {
    super(MemoryOrderHandler.defaults, MemoryVerticalHandler.defaults);
  }
}

class BottomUpHandler extends AbstractMemoryDirectionHandler {
  constructor() {
    super(MemoryReverseHandler.defaults, MemoryVerticalHandler.defaults);
  }
}


/** 内存画师 */
class MemoryPainter {

  public static LEFT_RIGHT: MemoryPainter = MemoryPainter.instanceHorizontal({direction: GroupDirection.LEFT_RIGHT});
  public static RIGHT_LEFT: MemoryPainter = MemoryPainter.instanceHorizontal({direction: GroupDirection.RIGHT_LEFT});
  public static UP_BOTTOM: MemoryPainter = MemoryPainter.instance({direction: GroupDirection.UP_BOTTOM});
  public static BOTTOM_UP: MemoryPainter = MemoryPainter.instance({direction: GroupDirection.BOTTOM_UP});
  public static directionHandlers = MemoryPainter.buildDirectionHandlers();

  public table: StringGroupPainter = StringGroupPainter.defaults;
  public direction: GroupDirection = GroupDirection.BOTTOM_UP; //绘制方向
  public showAddress: boolean = true;   // 是否显示地址
  public addressLineLength: number = 50;
  public addressLabelSize: Size = new Size(150, 20);
  public addressLabelTextBase: number = 16; // 标签文本显示内存地址时使用的进制，栈时使用 10 进制，其他使用 16 进制
  public addressLabelTextLength: number = 64 / 8 * 2; // 64 位系统使用 16 进制表示的长度
  public showSize: boolean = true;      // 是否显示占用空间
  public sizeStyle: string = "inner";   // 占用空间显示样式：outer、inner

  public static _instance(painter: MemoryPainter, options: Partial<MemoryPainter>) {
    Object.assign(painter, options);
    return Logger.proxyInstance(painter);
  }

  public static instance(options: Partial<MemoryPainter>) {
    return this._instance(new MemoryPainter(), options);
  }

  public static instanceHorizontal(options: Partial<MemoryPainter>) {
    let painter = new MemoryPainter();
    painter.table = StringGroupPainter.horizontal;
    painter.addressLineLength = 25;
    painter.addressLabelTextBase = 10;
    painter.showSize = false;
    return this._instance(painter, options);
  }

  public static buildDirectionHandlers() {
    let directionHandlers: Record<GroupDirection, MemoryDirectionHandler> = {
      [GroupDirection.LEFT_RIGHT]: new LeftRightHandler(),
      [GroupDirection.RIGHT_LEFT]: new RightLeftHandler(),
      [GroupDirection.UP_BOTTOM]: new UpBottomHandler(),
      [GroupDirection.BOTTOM_UP]: new BottomUpHandler(),
    }
    Object.keys(directionHandlers).forEach((value, index) => {
      directionHandlers[value] = Logger.proxyInstance(directionHandlers[value]);
    })
    return directionHandlers;
  }

  public getDirectionHandler(): MemoryDirectionHandler {
    return MemoryPainter.directionHandlers[this.direction];
  }


  /** 缓存每个 canvas 使用的 MemoryPainter */
  public static canvasCache: Record<string, MemoryPainter> = {};
  /** 绘制模式-键 */
  public static modeKey: string = "mode";
  /** 绘制模式-默认值*/
  public static modeValue: number = GroupDirection.BOTTOM_UP;
  public static drawMemoryLocationKey = "drawMemoryLocation";


  /**
   * 绘制地址空间布局。
   *
   * @param canvas 画布
   * @param origin 起点
   * @return 虚拟内存图
   */
  public static drawMemory(canvas: Canvas = Common.canvas(), origin: Point = Common.windowCenterPoint()) {
    let canvasName = canvas.name;
    let memory: MemoryPainter = MemoryPainter.canvasCache[canvasName];
    // shift 强制重新配置
    if (app.shiftKeyDown || !memory) {
      let form = new Form();
      form.addField(new Form.Field.Option(this.modeKey, "绘制模式", Enum.values(GroupDirection), Enum.keys(GroupDirection), this.modeValue, null), 0);
      return form.show("配置地址空间绘制参数", "确定")
        .then(response => {
          // Logger.getLogger().debug("form: ", response.values); // error
          Logger.getLogger().debug("modeKey: ", response.values[this.modeKey]);
          Logger.getLogger().debug("GroupDirection: ", GroupDirection[response.values[this.modeKey]]);
          memory = MemoryPainter[GroupDirection[response.values[this.modeKey]]];
          Logger.getLogger().debug("direction: ", memory.direction);
          MemoryPainter.canvasCache[canvasName] = memory;
          memory.drawMemoryInteractively(canvas, origin);
        })
        .catch(response => Logger.getLogger().error("error:", response));
    }
    // option 重新选择文件
    if (app.optionKeyDown) Common.option(canvas, MemoryPainter.drawMemoryLocationKey, null);
    return memory.drawMemoryInteractively(canvas, origin);
  }

  public static drawScript({
                             direction = GroupDirection[GroupDirection.BOTTOM_UP],
                             type = "json",
                             content
                           }: Record<string, any>) {
    return (this[direction] as MemoryPainter).drawMemoryBlocks(
      Common.canvas(), Common.windowCenterPoint(), MemoryBlock.parse(content, type)
    );
  }

  /**
   * 交互式地绘制虚拟内存。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param [content] 内容
   * @return 虚拟内存图
   */
  public drawMemoryInteractively(canvas: Canvas = Common.canvas(), origin: Point = Common.windowCenterPoint(), content?: string) {
    return Common.readFileContentSelectively(canvas, MemoryPainter.drawMemoryLocationKey, content)
      .then(response => {
        return Memory.parse(response.data, response.url.toString().split(".").pop());
      })
      .then(response => this.drawMemory(canvas, origin, response))
      .catch(response => Logger.getLogger().error(response));
  }

  /** 绘制虚拟内存 */
  public drawMemory(canvas: Canvas, origin: Point, memory: Memory) {
    let blocks = this.drawMemoryBlocks(canvas, origin, memory.blocks);
    if (!memory.title) return blocks;
    let title = this.drawTitle(canvas, origin, memory.title);
    origin = Common.pointOfRect(blocks.geometry, "top-left");
    Common.moveToSolid(title, origin.subtract(new Point(0, title.geometry.height)));
    return new Group([title, blocks]);
  }

  /** 绘制虚拟内存标题 */
  public drawTitle(canvas: Canvas, origin: Point, title: string) {
    let solid = canvas.addText(title, origin);
    Common.bolder(solid);
    solid.textSize = this.table.cellTextSize + 2;
    return solid;
  }

  /**
   * 绘制虚拟内存块，从下往上绘制。
   *
   * @param canvas 画布
   * @param origin 起点，矩形的左下点
   * @param blocks 内存块集合
   * @return 绘制的图形
   */
  public drawMemoryBlocks(canvas: Canvas, origin: Point, blocks: MemoryBlock[]) {
    this.getDirectionHandler().order(blocks);
    this.addressLabelTextLength = MemoryBlock.getMaxAddressLength(blocks, this.addressLabelTextBase);
    // MemoryBlock.merge(blocks);
    let array = blocks.map((block, index) => {
      if (index !== 0) origin = this.getDirectionHandler().getNextOrigin(this, origin);
      // let prev = blocks[index - 1], curr = blocks[index];
      // if (prev.endAddress < curr.startAddress) {
      //   origin = origin.subtract(new Point(0, this.table.cellSize.height));
      // } else if (prev.endAddress > curr.startAddress) {
      //   origin = origin.add(new Point(0, this.table.cellSize.height / 2));
      // }
      return this.drawMemoryBlock(canvas, origin, block)
    });
    return new Group(array);
  }

  /**
   * 绘制虚拟内存单元，从下往上绘制。
   *
   * @param canvas 画布
   * @param origin 起点，矩形左下角处位置
   * @param block 内存块
   * @return  绘制的图形
   */
  public drawMemoryBlock(canvas: Canvas, origin: Point, block: MemoryBlock) {
    let cell = this.table.drawCell(canvas, origin, block.description);
    let directionHandler = this.getDirectionHandler();
    let endpoint = directionHandler.getNextOrigin(this, origin);
    let graphics: Graphic[] = [cell];
    if (this.showAddress) {
      block.endAddress != null && graphics.push(this.drawMemoryAddress(canvas, origin, directionHandler.getAddressStartValue(this, block)))
      block.startAddress != null && graphics.push(this.drawMemoryAddress(canvas, endpoint, directionHandler.getAddressEndValue(this, block)))
    }
    if (this.showSize && block.startAddress != null && block.endAddress != null) {
      let size = block.size();
      if (this.sizeStyle === 'outer') graphics.push(this.drawMemorySize(canvas, endpoint, size));
      else cell.text += ` (${Common.formatMemorySize(size)})`;
    }
    return new Group(graphics);
  }

  /**
   * 绘制虚拟内存单元地址。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param address 地址
   * @return 绘制的图形
   */
  public drawMemoryAddress(canvas: Canvas, origin: Point, address: number | bigint) {
    let line = canvas.newLine();
    origin = this.getDirectionHandler().getAddressLineOrigin(this, origin);
    line.points = [origin, this.getDirectionHandler().getAddressLineEndpoint(this, origin)];
    line.shadowColor = null;

    let formattedAddress = this.formatMemoryAddress(address);
    let labelOrigin = this.getDirectionHandler().getAddressLabelOrigin(this, line.points[1]);
    let label = canvas.addText(formattedAddress, labelOrigin);
    label.magnets = Common.magnets_6;
    this.table.cellTextSize && (label.textSize = this.table.cellTextSize);
    return new Group([line, label]);
  }

  /**
   * 格式化内存地址。
   *
   * @param address 内存地址
   * @return 内存地址描述
   */
  public formatMemoryAddress(address: number | bigint) {
    let text = address < 0 ? '-' : ''; //符号位
    if (this.addressLabelTextBase === 16) text += '0x'; //16 进制标志
    let absAddress = address > 0 ? address : -address;
    let addressString = absAddress.toString(this.addressLabelTextBase);
    return text + Common.leftPad(addressString, this.addressLabelTextLength, '0').toUpperCase();
  }

  /**
   * 绘制内存空间尺寸。
   *
   * @param canvas 画布
   * @param origin 位置
   * @param size 空间尺寸
   * @return 绘制的图形
   */
  public drawMemorySize(canvas: Canvas, origin: Point, size: number) {
    let upLine = canvas.newLine();
    upLine.shadowColor = null;
    let upLineStartPoint = new Point(origin.x - this.addressLineLength - this.addressLabelSize.width / 2, origin.y + this.addressLabelSize.height / 2);
    let upLineEndPoint = new Point(upLineStartPoint.x, upLineStartPoint.y + this.table.cellSize.height / 2 - this.addressLabelSize.height);
    upLine.points = [upLineStartPoint, upLineEndPoint];
    upLine.headType = "FilledArrow";

    let label = canvas.newShape();
    label.geometry = new Rect(upLineStartPoint.x - this.addressLabelSize.width / 2, upLineEndPoint.y, this.addressLabelSize.width, this.addressLabelSize.height);
    label.shadowColor = null;
    label.strokeThickness = 0;
    label.text = Common.formatMemorySize(size);
    label.textSize = 12;
    label.fillColor = null;
    label.textHorizontalAlignment = HorizontalTextAlignment.Center;

    let bottomLine = canvas.newLine();
    bottomLine.shadowColor = null;
    let bottomLineStartPoint = new Point(upLineStartPoint.x, origin.y + this.table.cellSize.height - this.addressLabelSize.height / 2);
    let bottomLineEndPoint = new Point(bottomLineStartPoint.x, bottomLineStartPoint.y - this.table.cellSize.height / 2 + this.addressLabelSize.height);
    bottomLine.points = [bottomLineStartPoint, bottomLineEndPoint];
    bottomLine.headType = "FilledArrow";
    return new Group([upLine, label, bottomLine]);
  }

}

// 获取到当前 this 对象，代理其上属性时需要重新赋值
// var _this = this; // 错误的方式
//@formatter:off
var _this = (function () {return this;})();
//@formatter:on
(() => {
  let library = new PlugIn.Library(new Version("0.1"));
  [Common,
    GroupPainter, StringGroupPainter,
    Memory, MemoryBlock, MemoryPainter,
    ClassDiagram, Entity, EntityProperty, ClassDiagramPainter,
    Stepper, LayerSwitcher]
    .forEach(item => {
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
