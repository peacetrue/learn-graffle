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
    "Common": LoggerLevel.DEBUG,
    "Memory.incrementOrigin": LoggerLevel.INFO,
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
    if (this.isLevelEnabled(level)) {
      let levelName = LoggerLevel[level];
      let formattedLevelName = Logger.leftPad(levelName, 5, ' ');
      let indent = "  ".repeat(Logger.functionHierarchy);
      levelName = levelName.toLowerCase();
      Logger.log(`Logger.log: levelName=${levelName}, levelName in console=`, levelName in console);
      console[levelName in console ? levelName : "info"](`[${formattedLevelName}]`, indent, ...args);
    }
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
        if (target.hasOwnProperty(name)) {
          return Reflect.get(target, name, receiver);
        }

        let value = target[name];
        if (typeof value === "function") {
          return Logger.buildFunctionProxy(value, instance.constructor.name, name.toString());
        }

        return value;
      },
    });
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
        argumentsList.forEach((argument, index) => logger.debug(`[${index}]: ${argument}`));
        let result = target.apply(thisArg, argumentsList);
        logger.debug(`${name}(result): `, typeof result === "string" ? `'${result}'` : result);
        Logger.functionHierarchy--;
        return result;
      }
    });
  }
}


class Common {

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

    if (app.optionKeyDown) {
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
        ? Common.promise({data: content})
        : Common.readFileContentAssociatively(object, locationKey)
    )
      .then(response => {
        return {...response, data: JSON.parse(response.data)};
      });
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
   * @param graphics  图形
   */
  public static clearGraphicsText(graphics) {
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
   * @param location 位置，top、middle、bottom、left、center、right
   * @return 点
   */
  public static pointOfRect(rect, location) {
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

  /**
   * 定位到选中图形所在位置。
   */
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
  public static loadClass(name, path = `libs/${name}.js`) {

    if (name in Object) {

      return new Promise((resolve, reject) => resolve(Object[name]))
    }
    return this.promiseUrlFetch(this.plugIn.resourceNamed(path))
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


  public static test() {

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
      let form = new Form()
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

class PeaceTable {

  public static defaults: PeaceTable = PeaceTable.instance(
    new Size(200, 70), 12, Color.RGB(1.0, 1.0, 0.75, null)
  );
  public static small: PeaceTable = PeaceTable.instance(
    new Size(200, 20), 12, Color.RGB(1.0, 1.0, 0.75, null)
  );

  public static cellFillColors: Record<string, Color> = {
    "[anon]": Color.RGB(0.75, 1.0, 0.75, null),// 浅绿，已占用但不知道具体用途
    "": Color.RGB(0.8, 0.8, 0.8, null),        // 灰色，无描述表示未使用
    "*": Color.RGB(0.75, 1.0, 1.0, null),      // 蓝色，有效数据
  };
  public cellSize: Size = new Size(200, 70);
  public cellTextSize: number = 12;
  public cellFillColor: Color = Color.RGB(1.0, 1.0, 0.75, null);// 黄色

  public static instance(cellSize: Size, cellTextSize: number, cellFillColor: Color) {
    let table = new PeaceTable();
    table.cellSize = cellSize;
    table.cellTextSize = cellTextSize;
    table.cellFillColor = cellFillColor;
    return table;
  }

  /**
   * 绘制表格。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param texts 文本
   * @return 形状
   */
  public drawTable(canvas: Canvas, origin: Point, texts: string[][]): Group {

    let increase = new Point(0, this.cellSize.height);
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

    let increase = new Point(this.cellSize.width, 0);
    return new Group(texts.map((text, index) => {
      return this.drawCell(canvas, index === 0 ? origin : origin = origin.add(increase), text);
    }));
  }

  public static bolder(group: Group): Group {
    for (let graphic of group.graphics) {
      if (graphic instanceof Solid) graphic.fontName = "PingFangSC-Semibold";
    }
    return group;
  }

  /**
   * 绘制列。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param texts 文本
   * @return 形状
   */
  public drawColumn(canvas: Canvas, origin: Point, texts: string[]): Group {

    let increase = new Point(0, this.cellSize.height);
    return new Group(texts.map((text, index) => {
      return this.drawCell(canvas, index === 0 ? origin : origin = origin.add(increase), text);
    }));
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
    this.cellFillColor = PeaceTable.cellFillColors[text || ""] || PeaceTable.cellFillColors["*"];
    this.cellFillColor && (shape.fillColor = this.cellFillColor);
    text && (shape.text = text);
    // 5 个磁极：中上下左右
    shape.magnets = [new Point(0, 0),
      new Point(1.00, 1.00), new Point(1.00, -1.00),
      new Point(-1.00, -1.00), new Point(-1.00, 1.00),
    ];
    return shape;
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
 * 内存块。
 */
class MemoryBlock {

  public startAddress: number | bigint;//起始地址
  public endAddress: number | bigint;//结束地址
  public description?: string; //描述

  constructor(startAddress: number | bigint, endAddress: number | bigint, description?: string) {
    this.startAddress = startAddress;
    this.endAddress = endAddress;
    this.description = description;
  }

  public size() {
    return MemoryBlock.subtract(this.endAddress, this.startAddress);
  }

  public toString() {
    return `'${this.description}':${this.startAddress}~${this.endAddress}`;
  }

  public static subtract(left: number | bigint, right: number | bigint) {
    return Number(BigInt(left) - BigInt(right));
  }

  /** 将记录转换为内存块对象 */
  public static wraps(object: Record<string, any>[]): MemoryBlock[] {
    return object.map(item => this.wrap(item));
  }

  /** 将记录转换为内存块对象 */
  public static wrap(object: Record<string, any>): MemoryBlock {
    return object instanceof MemoryBlock ? object
      : new MemoryBlock(
        parseInt(object['startAddress']),
        parseInt(object['endAddress']),
        object['description'],
      )
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
          blocks.splice(i, 0, new MemoryBlock(prev.endAddress, curr.startAddress));
          i++;
        }
      } else {
        if (prev.startAddress > curr.endAddress) {
          blocks.splice(i, 0, new MemoryBlock(curr.endAddress, prev.startAddress));
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

/** 内存绘制方向 */
enum MemoryDirection {
  BOTTOM_UP,//从下往上，虚拟地址空间图
  LEFT_RIGHT,//从左往右，每个地址都对应一个字节，字节内部各标志位使用情况；eflags 寄存器各标志位使用情况
}

/** 内存绘制方向影响相关图形起点的递增方式 */
type MemoryOriginIncrementer = (origin: Point, memory: Memory) => Point;


class Memory {

  public static defaults: Memory = Logger.proxyInstance(Memory.instance());
  public static small: Memory = Logger.proxyInstance(Memory.instance());
  public static abstract: Memory = Logger.proxyInstance(Memory.instanceAbstractly());
  public static horizontal: Memory = Logger.proxyInstance(Memory.instanceHorizontal());

  public static blockIncrementers: MemoryOriginIncrementer[] = Memory.buildBlockIncrementers();
  public static addressLineIncrementers: MemoryOriginIncrementer[] = Memory.buildAddressLineIncrementers();
  public static addressLabelIncrementers: MemoryOriginIncrementer[] = Memory.buildAddressLabelIncrementers();

  public table: PeaceTable = PeaceTable.small;
  public direction: MemoryDirection = MemoryDirection.BOTTOM_UP; //绘制方向
  public showAddress: boolean = true;   // 是否显示地址
  public addressLineLength: number = 50;
  public addressLabelSize: Size = new Size(150, 20);
  public addressLabelTextBase: number = 16; // 标签文本显示内存地址时使用的进制，栈时使用 10 进制，其他使用 16 进制
  public addressLabelTextLength: number = 64 / 8 * 2; // 64 位系统使用 16 进制表示的长度
  public showSize: boolean = true;      // 是否显示占用空间
  public sizeStyle: string = "inner";   // 占用空间显示样式：outer、inner

  public static instance() {
    return new Memory();
  }

  public static instanceAbstractly() {
    let memory = new Memory();
    memory.showAddress = false;
    memory.showSize = false;
    return memory;
  }

  public static instanceHorizontal() {
    let memory = new Memory();
    memory.direction = MemoryDirection.LEFT_RIGHT;
    memory.addressLineLength = 25;
    memory.addressLabelTextBase = 10;
    memory.showSize = false;
    return memory;
  }

  public static buildBlockIncrementers(): MemoryOriginIncrementer[] {
    let incrementers: MemoryOriginIncrementer[] = [];
    incrementers[MemoryDirection.BOTTOM_UP] = function (origin: Point, memory: Memory) {
      return origin.add(new Point(0, memory.table.cellSize.height))
    }
    incrementers[MemoryDirection.LEFT_RIGHT] = function (origin: Point, memory: Memory) {
      return origin.add(new Point(memory.table.cellSize.width, 0))
    }
    return incrementers;
  }

  public static buildAddressLineIncrementers(): MemoryOriginIncrementer[] {
    let incrementers: MemoryOriginIncrementer[] = [];
    incrementers[MemoryDirection.BOTTOM_UP] = function (origin: Point, memory: Memory) {
      return origin.subtract(new Point(memory.addressLineLength, 0));
    }
    incrementers[MemoryDirection.LEFT_RIGHT] = function (origin: Point, memory: Memory) {
      return origin.subtract(new Point(0, memory.addressLineLength));
    }
    return incrementers;
  }

  public static buildAddressLabelIncrementers(): MemoryOriginIncrementer[] {
    let incrementers: MemoryOriginIncrementer[] = [];
    incrementers[MemoryDirection.BOTTOM_UP] = function (origin: Point, memory: Memory) {
      return origin.subtract(new Point(memory.addressLabelTextLength / 2 * 8, 0));
    }
    incrementers[MemoryDirection.LEFT_RIGHT] = function (origin: Point, memory: Memory) {
      return origin.subtract(new Point(0, 12 / 2));
    }
    return incrementers;
  }

  public incrementOrigin(increments: MemoryOriginIncrementer[], origin: Point) {
    return increments[this.direction](origin, this);
  }

  public getNextBlockOrigin(origin: Point) {
    return this.incrementOrigin(Memory.blockIncrementers, origin);
  }

  public getLineEndpoint(origin: Point) {
    return this.incrementOrigin(Memory.addressLineIncrementers, origin);
  }

  public getAddressLabelOrigin(origin: Point) {
    return this.incrementOrigin(Memory.addressLabelIncrementers, origin);
  }

  /**
   * 基于内存映射，绘制虚拟内存。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param [content] 内容
   * @return  虚拟内存图
   */
  public drawMemoryForMaps(canvas: Canvas, origin: Point, content?: string) {
    // readFileContentForGraphic(canvas, "maps-location")
    return (content ? Common.promise({data: content}) : Common.selectFile())
      // return (location ? common.readFileContent(location) : common.selectFile())
      .then(response => {

        let blocks = Memory.resolveMaps(response.data);
        blocks.unshift(new MemoryBlock(BigInt(0), blocks[0].startAddress));// 从 0 开始显示
        blocks.push(new MemoryBlock(
          blocks[blocks.length - 1].endAddress,// bigint 和 bigint 才能相减求 size
          BigInt("0xffffffffffffffff"),// 截止到 16 个 f，数值溢出，需要使用 bigint
        ));

        blocks = MemoryBlock.padding(MemoryBlock.descend(blocks));

        blocks = MemoryBlock.merge(blocks);

        return this.drawMemoryBlocks(canvas, origin, blocks);
      })
      .catch(response => {

      });
  }

  /**
   * 解析内存映射。
   *
   * @param content 内存映射内容
   * @return  内存块
   */
  public static resolveMaps(content: string): MemoryBlock[] {
    //1                                  2     3         4      5        6
    //561d970c5000-561d970c6000          r--p  00000000  08:03  1581273  /usr/lib/jvm/java-17-openjdk-amd64/bin/java
    let lines = content.split("\n");

    // blocks.unshift(new MemoryBlock(
    //   blocks[blocks.length - 1].endAddress,// bigint 和 bigint 才能相减求 size
    //   BigInt("0xffffffffffffffff"),// 截止到 16 个 f，数值溢出，需要使用 bigint
    // ));
    // blocks.push(new MemoryBlock(BigInt(0), blocks[0].startAddress));// 从 0 开始显示
    return lines.filter(line => line)
      .map(line => line.split(/ +/))
      .map(cells => {
        let addresses = cells[0].split("-");
        // 16 个 f 需要使用 bigint 才能表示
        return new MemoryBlock(
          BigInt(parseInt(addresses.shift(), 16)),
          BigInt(parseInt(addresses.shift(), 16)),
          (cells[5] || "").split("/").pop() || "[anon]",//全路径太长，只取末尾的程序名
        )
      });
  }

  /**
   * 基于内存映射，绘制虚拟内存。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param [content] 内容
   * @return 虚拟内存图
   */
  public drawMemory(canvas: Canvas = Common.canvas(), origin: Point = Common.windowCenterPoint(), content?: string) {
    return Common.readFileContentSelectively(canvas, "drawMemory", content)
      .then(response => this.drawMemoryBlocks(canvas, origin, MemoryBlock.wraps(response.data)))
      .catch(response => Logger.getLogger().error(response));
  }

  /**
   * 绘制虚拟内存单元，从下往上绘制。
   *
   * @param canvas 画布
   * @param origin 起点，矩形的左下点
   * @param  blocks 内存块集合
   * @return  绘制的图形
   */
  public drawMemoryBlocks(canvas: Canvas, origin: Point, blocks: MemoryBlock[]) {
    MemoryBlock.descend(blocks);
    MemoryBlock.padding(blocks, false);
    this.addressLabelTextLength = String(blocks[0].endAddress).length;
    // MemoryBlock.merge(blocks);
    let array = blocks.map((block, index) => {
      if (index !== 0) origin = this.getNextBlockOrigin(origin);
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
    let endPoint = this.getNextBlockOrigin(origin);
    let graphics: Graphic[] = [cell];
    if (this.showAddress) {
      graphics.push(this.drawMemoryAddress(canvas, origin, block.endAddress))
      graphics.push(this.drawMemoryAddress(canvas, endPoint, block.startAddress))
    }
    if (this.showSize) {
      let size = block.size();
      if (this.sizeStyle === 'outer') graphics.push(this.drawMemorySize(canvas, endPoint, size));
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
    line.points = [origin, this.getLineEndpoint(origin)];
    line.shadowColor = null;
    let formattedAddress = this.formatMemoryAddress(address);
    let labelOrigin = this.getAddressLabelOrigin(line.points[1]);
    return new Group([line, canvas.addText(formattedAddress, labelOrigin)]);
  }

  /**
   * 格式化内存地址。
   *
   * PlugIn.find('com.github.peacetrue.learn.graffle').library('memory').formatMemoryAddress(bigint("0xffffffffffffffff"))
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
  library["Common"] = Common;
  library["Stepper"] = Stepper;
  library["LayerSwitcher"] = LayerSwitcher;
  library["Memory"] = Memory;
  Logger.proxyClassStaticFunction(Common);
  // Logger.proxy(Common.name, _this);


  //因为不能直接在 library 上添加属性，所以将属性都定义在 dynamic 中
  library.dynamic = {
    direction: "up", //绘制方向
    rectSize: new Size(200, 70),
    rectTextSize: undefined,// 字体大小，默认 16
    rectFillColors: {
      "[anon]": Color.RGB(0.75, 1.0, 0.75),// 浅绿，已占用但不知道具体用途
      "": Color.RGB(0.8, 0.8, 0.8),        // 灰色，无描述表示未使用
      "*": Color.RGB(0.75, 1.0, 1.0),      // 蓝色，有效数据
    },
    lineWidth: 100,
    labelSize: new Size(150, 20),
    labelTextBase: 16,// 标签文本显示内存地址时使用的进制，栈时使用 10 进制，其他使用 16 进制
    labelTextLength: 16,
    showSize: true,     // 是否显示占用空间
    sizeStyle: 'outer', // 占用空间显示样式：outer、inner
  };


  // Object.defineProperties(library, {
  //   "dynamic": {
  //     value: library.dynamic
  //   }
  // });

  library.extractGraphicTexts = function (graphic) {
    return PeaceTable.extractGraphicTexts(graphic);
  }

  /**
   * 设置绘图样式。
   *
   * @param style 绘图样式：large、small
   * @return {void}
   */
  library.setStyle = function (style) {
    let dynamic = this.dynamic;
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
  }

  /**
   * 绘制抽象的虚拟内存。
   *
   * @param canvas 画布
   * @param [origin] 起点
   * @return  虚拟内存图
   */
  library.drawMemoryAbstractly = function (canvas: Canvas, origin: Point, data?: string[]) {

    let locationKey = "drawMemoryAbstractly.location";
    let common = this.plugIn.library("common");

    if (app.optionKeyDown) return common.option(canvas, locationKey, null);
    (data
        ? new Promise((resolve) => resolve(data))
        : common.readFileContentForGraphic(canvas, locationKey).then(response => JSON.parse(response.data))
    )
      .then(response => PeaceTable.small.drawColumn(canvas, origin, response.reverse()))
      .catch(response => console.error("drawMemoryAbstractly error: ", response))
  }

  library.drawTableColumn = function (canvas: Canvas, origin: Point) {

    let locationKey = "drawTableColumn.location";
    Common.readFileContentAssociatively(canvas, locationKey)
      .then(response => JSON.parse(response.data))
      .then(response => PeaceTable.small.drawColumn(canvas, origin, response))
      .catch(response => console.error("drawMemoryAbstractly error: ", response))
  }

  /**
   * 绘制抽象的虚拟内存。
   *
   * @param canvas 画布
   * @param [origin] 起点
   * @return  虚拟内存图
   */
  library.drawMemoryStandardly = function (canvas, origin) {

    this.setStyle('large');
    let common = this.plugIn.library("common");
    canvas = canvas || common.canvas();
    origin = origin || common.windowCenterPoint();
    // echo '"", "代码段(.text)", "已初始化的数据(.data)", "未初始化的数据(.bss)", "堆", "", "共享库的内存映射区域", "", "用户栈", ""' | sed "1i $(seq -s ',' 0 10)" | column -t -s , -o ,
    //  0 ,1               ,2                       ,3                  ,4    ,5  ,6                 ,7  ,8        ,9
    let descriptions = [
      "", "代码段(.text)", "已初始化的数据(.data)", "未初始化的数据(.bss)", "堆", "", "共享库的内存映射区域", "", "用户栈", ""
    ];
    let group = this.drawMemoryBlocksAbstractly(canvas, origin, descriptions);
    let graphics = group.graphics;

    let heapRect = graphics.find(graphic => graphic.text === "堆").geometry;
    let heapLineStartPoint = common.pointOfRect(heapRect, 'top-center');
    let heapLineEndPoint = new Point(heapLineStartPoint.x, heapLineStartPoint.y - this.dynamic.rectSize.height);
    let heapLine = common.drawLine(canvas, [heapLineStartPoint, heapLineEndPoint], "向上增长", true);

    let mmapRect = graphics.find(graphic => graphic.text === "共享库的内存映射区域").geometry;
    let mmapLineStartPoint = common.pointOfRect(mmapRect, 'bottom-right').add(new Point(20, 0));
    let mmapLineEndPoint = new Point(mmapLineStartPoint.x, mmapLineStartPoint.y + this.dynamic.rectSize.height);
    let mmapLine = common.drawLine(canvas, [mmapLineStartPoint, mmapLineEndPoint], "malloc 向下增长", true);

    let stackLineStartPoint = common.pointOfRect(graphics.find(graphic => graphic.text === "用户栈").geometry, 'bottom-center');
    let stackLineEndPoint = new Point(stackLineStartPoint.x, stackLineStartPoint.y + this.dynamic.rectSize.height);
    let stackLine = common.drawLine(canvas, [stackLineStartPoint, stackLineEndPoint], "向下增长", true);

    let brkLineEndPoint = heapRect.origin.add(new Point(this.dynamic.rectSize.width, 0));
    let brkLineStartPoint = brkLineEndPoint.add(new Point(this.dynamic.rectSize.width / 2, 0));
    let brkLine = common.drawLine(canvas, [brkLineStartPoint, brkLineEndPoint], "堆顶（brk 变量）");

    let directionOffset = new Point(-this.dynamic.rectSize.width, 0);
    let directionStartPoint = graphics[graphics.length - 1].geometry.center.add(directionOffset);
    let directionEndPoint = graphics[0].geometry.center.add(directionOffset);
    let directionLine = common.drawLine(canvas, [directionStartPoint, directionEndPoint], "低地址");
    let directionEndText = canvas.addText("高地址", directionEndPoint.add(new Point(0, -20)));
    return new Group([heapLine, mmapLine, stackLine, brkLine, directionLine, directionEndText, group]);
  }

  /**
   * 绘制虚拟内存单元，抽象地。
   *
   * @param canvas 画布
   * @param origin 起点，矩形左下角处位置
   * @param {String[]} descriptions 内存块描述集合
   * @return  虚拟内存单元图
   */
  library.drawMemoryBlocksAbstractly = function (canvas, origin, descriptions) {

    let pointOperator = this.dynamic.direction === "down" ? "add" : "subtract";
    return new Group(
      descriptions.map((description, index) => {
        if (index > 0) {
          origin = origin[pointOperator](new Point(0, this.dynamic.rectSize.height));
        }
        return this.drawMemoryRect(canvas, origin, description);
      })
    );
  }


  /**
   * 绘制栈区抽象虚拟内存。案例参考：variable.stack.json。
   *
   * @param canvas 画布
   * @param [origin] 起点
   */
  library.drawStackMemoryAbstractly = function (canvas, origin) {

    this.setStyle("small");
    this.dynamic.labelTextBase = 10;//为什么栈使用 10 进制，汇编中类似 16(%rip) 的偏移地址使用了 10 进制
    this.dynamic.showSize = false;
    let common = this.plugIn.library("common");
    canvas = canvas || common.canvas();
    origin = origin || common.windowCenterPoint();
    common.readFileContentForGraphic(common.selectedGraphic() || canvas, "location-drawStackMemoryAbstractly")
      .then(responce => {
        let data = JSON.parse(responce.data);
        let size = data.size + 8;  // 从 start(=0) + step 到 size
        this.dynamic.labelTextLength = size.toString().length;
        this.dynamic.labelSize.width = 50;
        let blocks = this.buildBlocksForFrame(size);

        blocks = this.sortBlocks(blocks);
        this.setBlocksForFrame(blocks, data.blocks);
        this.drawMemoryBlocks(canvas, origin, blocks);
      })
      .catch(response => {
        console.error("readFileContentForGraphic response: ", response);
      });
  }

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
  library.buildBlocksForFrame = function (size, start = 0, step = 8) {

    let count = size / step;
    let blocks = [];
    for (let i = 0; i < count; i++) {
      blocks.push({startAddress: start, endAddress: start + step});
      start -= step;
    }
    return blocks;
  }

  /**
   * 设置栈帧内存块集合。
   *
   * @param  template 模板内存块集合
   * @param  content 内容内存块集合
   * @param [step] 步调，每格字节数
   */
  library.setBlocksForFrame = function (template, content, step = 8) {

    for (let contentBlock of content) {
      let index = template.findIndex(block => block.startAddress === contentBlock.startAddress);
      if (index === -1) return
      let endAddress = contentBlock.startAddress + (contentBlock.size || step);
      while (template[index] && template[index].endAddress <= endAddress) {
        template[index++].description = contentBlock.description;
      }
    }
  }

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

    this.setStyle('small');
    let common = this.plugIn.library("common");
    canvas = canvas || common.canvas();
    origin = origin || common.windowCenterPoint();
    // readFileContentForGraphic(canvas, "maps-location")
    return (content ? new Promise(resolve => resolve({data: content})) : common.selectFile())
      // return (location ? common.readFileContent(location) : common.selectFile())
      .then(response => {

        let blocks = this.resolveMaps(response.data);
        blocks.unshift({startAddress: 0n, endAddress: blocks[0].startAddress});// 从 0 开始显示
        blocks.push({
          startAddress: blocks[blocks.length - 1].endAddress,// bigint 和 bigint 才能相减求 size
          endAddress: bigint("0xffffffffffffffff"), // 截止到 16 个 f，数值溢出，需要使用 bigint
        });

        blocks = this.paddingBlocks(this.sortBlocks(blocks));

        blocks = this.mergeBlocks(blocks);

        return this.drawMemoryBlocks(canvas, origin, blocks);
      })
      .catch(response => {
        console.error("selectFile response: ", response);
      });
  }

  /**
   * 解析内存映射。
   *
   * @param content 内存映射内容
   * @return  内存块
   */
  library.resolveMaps = function (content) {
    //1                                  2     3         4      5        6
    //561d970c5000-561d970c6000          r--p  00000000  08:03  1581273  /usr/lib/jvm/java-17-openjdk-amd64/bin/java

    let lines = content.split("\n");

    return lines.filter(line => line)
      .map(line => line.split(/ +/))
      .map(cells => {
        let addresses = cells[0].split("-");
        // 16 个 f 需要使用 bigint 才能表示
        return {
          // startAddress: parseInt(addresses.shift(), 16),
          startAddress: bigint(parseInt(addresses.shift(), 16)),
          // endAddress: parseInt(addresses.shift(), 16),
          endAddress: bigint(parseInt(addresses.shift(), 16)),
          description: (cells[5] || "").split("/").pop() || "[anon]" //全路径太长，只取末尾的程序名
        };
      });
  }

  /**
   * 合并相同描述的相邻内存块。此处假设相同描述的内存块是连续的。
   *
   * @param  blocks 内存块集合
   * @return  内存块集合
   */
  library.mergeBlocks = function (blocks) {
    for (let i = 1; i < blocks.length; i++) {
      let prev = blocks[i - 1], curr = blocks[i];
      if (prev.description === curr.description) {
        prev.endAddress = curr.endAddress; // 上一块的结束地址指向当前块的结束地址
        blocks.splice(i, 1); // 删除当前块
        i--;
      }
    }
    return blocks;
  }

  /**
   * 排序内存块集合。
   * @param  blocks 内存块集合
   * @return  等于输入的内存块集合
   */
  library.sortBlocks = function (blocks) {
    blocks.sort((left, right) => left.startAddress - right.startAddress);
    return blocks;
  }

  /**
   * 对齐内存块集合。
   * 内存地址应该是连续的，在空缺处补齐。
   * @param  blocks 内存块集合
   * @return  等于输入的内存块集合
   */
  library.paddingBlocks = function (blocks) {
    for (let i = 1; i < blocks.length; i++) {
      let prev = blocks[i - 1], curr = blocks[i];
      //地址不连续，补齐空缺
      if (prev.endAddress < curr.startAddress) {
        blocks.splice(i, 0, {startAddress: prev.endAddress, endAddress: curr.startAddress});
        i++;
      }
    }
    return blocks;
  }

  /**
   * 绘制虚拟内存单元，从下往上绘制。
   *
   * @param canvas 画布
   * @param origin 起点，矩形的左下点
   * @param  blocks 内存块集合
   * @return  绘制的图形
   */
  library.drawMemoryBlocks = function (canvas, origin, blocks) {

    let array = blocks.map((block, index) => {
      // PeaceConsole.root.info(`block: ${JSON.stringify(block)}`);
      if (index === 0) return this.drawMemoryBlock(canvas, origin, block);

      origin = origin.subtract(new Point(0, this.dynamic.rectSize.height));
      let prev = blocks[index - 1], curr = blocks[index];
      if (prev.endAddress < curr.startAddress) {
        origin = origin.subtract(new Point(0, this.dynamic.rectSize.height));
      } else if (prev.endAddress > curr.startAddress) {
        origin = origin.add(new Point(0, this.dynamic.rectSize.height / 2));
      }
      return this.drawMemoryBlock(canvas, origin, block)
    });
    return new Group(array);
  }


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
    let dynamic = this.dynamic;
    let endPoint = new Point(startPoint.x, startPoint.y - dynamic.rectSize.height);
    let graphics = [
      this.drawMemoryRect(canvas, endPoint, block.description),
      this.drawMemoryAddress(canvas, startPoint, block.startAddress),
      this.drawMemoryAddress(canvas, endPoint, block.endAddress),
    ];
    if (!dynamic.showSize) return new Group(graphics);
    let size = Number(block.endAddress - block.startAddress);
    if (dynamic.sizeStyle === 'outer') graphics.push(this.drawMemorySize(canvas, endPoint, size));
    else graphics[0].text += ` (${Number.formatMemorySize(size)})`;
    return new Group(graphics);
  }

  /**
   * 绘制内存矩形。
   *
   * @param canvas 画布
   * @param location 位置
   * @param [description] 描述
   * @return {Shape} 绘制的图形
   */
  library.drawMemoryRect = function (canvas, location, description) {
    let dynamic = this.dynamic, rectSize = dynamic.rectSize;
    let shape = canvas.newShape();
    shape.geometry = new Rect(location.x, location.y, rectSize.width, rectSize.height);
    shape.shadowColor = null;
    dynamic.rectTextSize && (shape.textSize = dynamic.rectTextSize);
    // Color.RGB(1.0, 1.0, 0.75)
    shape.fillColor = dynamic.rectFillColors[description || ""] || dynamic.rectFillColors["*"];
    description && (shape.text = description);
    //磁体、磁极：可连线的点
    shape.magnets = [new Point(0, 0), new Point(1.00, 1.00), new Point(1.00, -1.00), new Point(-1.00, -1.00), new Point(-1.00, 1.00),];
    return shape;
  }

  /**
   * 绘制虚拟内存单元地址。
   *
   * @param canvas 画布
   * @param origin 起点
   * @param {Number|bigint} address 地址
   * @return 绘制的图形
   */
  library.drawMemoryAddress = function (canvas, origin, address) {
    let line = canvas.newLine();
    line.shadowColor = null;
    let lineStartPoint = origin;
    let lineEndPoint = new Point(lineStartPoint.x - this.dynamic.lineWidth, lineStartPoint.y);
    line.points = [lineStartPoint, lineEndPoint];

    let label = canvas.newShape();
    label.geometry = new Rect(
      lineEndPoint.x - this.dynamic.labelSize.width,
      lineEndPoint.y - this.dynamic.labelSize.height / 2,
      this.dynamic.labelSize.width, this.dynamic.labelSize.height
    );
    label.shadowColor = null;
    label.strokeThickness = 0;
    label.text = this.formatMemoryAddress(address);
    label.textSize = 12;
    label.fillColor = null;
    label.textHorizontalAlignment = HorizontalTextAlignment.Right;
    return new Group([line, label]);
  }

  /**
   * 格式化内存地址。
   *
   * PlugIn.find('com.github.peacetrue.learn.graffle').library('memory').formatMemoryAddress(bigint("0xffffffffffffffff"))
   *
   * @param {Number|bigint} address 内存地址
   * @return  内存地址描述
   */
  library.formatMemoryAddress = function (address) {
    let dynamic = this.dynamic;
    let text = address < 0 ? '-' : ' '; //符号位
    if (dynamic.labelTextBase === 16) text += '0x'; //16 进制标志
    let absAddress = address > 0 ? address : -address;
    return text + absAddress.toString(dynamic.labelTextBase).leftPad(dynamic.labelTextLength, '0');
  }

  /**
   * 绘制内存空间尺寸。
   *
   * @param canvas 画布
   * @param location 位置
   * @param size 空间尺寸
   * @return 绘制的图形
   */
  library.drawMemorySize = function (canvas, location, size) {
    let dynamic = this.dynamic;
    let upLine = canvas.newLine();
    upLine.shadowColor = null;
    let upLineStartPoint = new Point(location.x - dynamic.lineWidth - dynamic.labelSize.width / 2, location.y + dynamic.labelSize.height / 2);
    let upLineEndPoint = new Point(upLineStartPoint.x, upLineStartPoint.y + dynamic.rectSize.height / 2 - dynamic.labelSize.height);
    upLine.points = [upLineStartPoint, upLineEndPoint];
    upLine.headType = "FilledArrow";

    let label = canvas.newShape();
    label.geometry = new Rect(upLineStartPoint.x - dynamic.labelSize.width / 2, upLineEndPoint.y, dynamic.labelSize.width, dynamic.labelSize.height);
    label.shadowColor = null;
    label.strokeThickness = 0;
    label.text = Number.formatMemorySize(size);
    label.textSize = 12;
    label.fillColor = null;
    label.textHorizontalAlignment = HorizontalTextAlignment.Center;

    let bottomLine = canvas.newLine();
    bottomLine.shadowColor = null;
    let bottomLineStartPoint = new Point(upLineStartPoint.x, location.y + dynamic.rectSize.height - dynamic.labelSize.height / 2);
    let bottomLineEndPoint = new Point(bottomLineStartPoint.x, bottomLineStartPoint.y - dynamic.rectSize.height / 2 + dynamic.labelSize.height);
    bottomLine.points = [bottomLineStartPoint, bottomLineEndPoint];
    bottomLine.headType = "FilledArrow";
    return new Group([upLine, label, bottomLine]);
  }

  return library;
})();
