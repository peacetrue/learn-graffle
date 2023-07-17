/**
 * 虚拟内存：
 * 抽象虚拟内存：没有虚拟地址或者虚拟地址是不真实的
 * 具体虚拟内存：虚拟地址是真实的
 * 程序运行起来才能得到具体虚拟地址，否则就使用抽象的方法分析虚拟内存。
 */
class Common {

  /** 保存各 canvas 的配置，以 canvas.name 为 key */
  public static canvasOptions = {};

  /**
   * 操作选项。
   *
   * @param  object
   * @param  key
   * @param  [value]
   * @return
   */
  public static option(object: Graphic | Canvas, key: string, value?: string) {
    console.info(`option. object: ${object}, key: ${key}, value: ${value}`);
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
   * @param  canvas
   * @param  key
   * @param  [value]
   * @return
   */
  public static canvasOption(canvas: Canvas, key, value) {
    console.info(`canvasOption. canvas: ${canvas}, key: ${key}, value: ${value}`);
    let options = this.canvasOptions[canvas.name];
    if (!options) {
      options = {};
      this.canvasOptions[canvas.name] = options
    }
    return value === undefined ? options[key] : (options[key] = value);
  }

  /**
   * URL.fetch to Promise。
   *
   * @param {URL} url url
   * @return {Promise} URL.fetch(Data)
   */
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

  public static document() {
    return document;
  }

  /**
   * 获取当前选中的画布。
   *
   * PlugIn.find("com.github.peacetrue.learn.graffle").library("common").canvas()
   *
   * @return
   */
  public static canvas(): Canvas {
    return this.document().windows[0].selection.canvas;
  }

  public static selectedGraphic() {
    return this.document().windows[0].selection.graphics[0];
  }

  /**
   * 获取当前窗口中心点。
   *
   * @return {Point}
   */
  public static windowCenterPoint() {
    return this.document().windows[0].centerVisiblePoint;
  }


  /**
   * 选择文件。
   *
   * @param  [types] 文件类型集合
   * @return
   */
  public static selectFile(types?: TypeIdentifier[]) {
    console.info("selectFile");
    let filePicker = new FilePicker();
    filePicker.types = types;
    return filePicker.show().then(response => {
      console.info("selectFile response: ", response);
      return this.promiseUrlFetch(response[0]);
    });
  }

  /**
   * 为图形选择文件。选择文件后，记录下文件位置。
   *
   * @param  object 图形
   * @param  locationKey 位置键
   * @return {Promise} URL.fetch(Data)
   */
  public static selectFileForGraphic(object: Graphic | Canvas, locationKey: string) {
    console.info("selectFileForGraphic");
    return this.selectFile().then(response => {
      this.option(object, locationKey, response.url.toString());
      return response;
    })
      // selectFileForGraphic error:  Error: User cancelled 操作已被取消。
      // .catch(response => {
      //     console.error("selectFileForGraphic error: ", response);
      // })
      ;
  }

  /**
   * 读取文件内容。
   *
   * @param  location 文件位置
   * @return {Promise}
   */
  public static readFileContent(location: string) {
    !location.startsWith('file:') && (location = `file://${location}`);
    return this.promiseUrlFetch(URL.fromString(location));
  }

  /**
   * 从图形中读取文件内容。
   *
   * @param  object 图形
   * @param  locationKey 文件位置键
   * @return {Promise} URL.fetch(Data)
   */
  public static readFileContentForGraphic(object: Graphic | Canvas, locationKey) {
    console.info("readFileContentForGraphic");
    console.debug("app.optionKeyDown: ", app.optionKeyDown);
    if (app.optionKeyDown) {
      this.option(object, locationKey, null);
      return Promise.reject("clear cache!");
    }
    let location = this.option(object, locationKey);
    console.info("location: ", location);
    if (!location) return this.selectFileForGraphic(object, locationKey);
    return this.readFileContent(location).catch(response => {
      // response:  Error: 未能完成操作。（kCFErrorDomainCFNetwork错误1。）
      console.error("promiseUrlFetch response: ", response);
      return this.selectFileForGraphic(object, locationKey);
    });
  }

  /**
   * 从文件读取内容后设置到图形中。
   * 文件内容过多，可分开显示到多个图形中。
   *
   * @param {Graphic[]} graphics 图形集合
   * @param  locationKey 位置键
   * @param {int} [length] 图形数目
   * @return {Promise}
   */
  public static loadGraphicsText(graphics, locationKey, length) {
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
   * @param  content 文本内容
   * @return {void}
   */
  public static setGraphicsText(graphics, content) {
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
   * @param  canvas 画布
   * @param  graphic 图形
   * @param {int} length 图形数目
   * @return {void}
   */
  public static duplicateGraphicToLayers(canvas, graphic, length) {
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
   * @param  location 位置，top、middle、bottom、left、center、right
   * @return {Point} 点
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
  public static centerOfPoints(start, end) {
    return new Point(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2,
    );
  }


  /**
   * 绘线，并在线上添加描述。
   *
   * @param  canvas 画布
   * @param {Point[]} points 起止点集合
   * @param  [description] 描述
   * @param {Boolean} [center] 默认在起点处绘制文本，true 在中点处绘制文本
   * @return  线（或带文本）
   */
  public static drawLine(canvas, points, description, center) {
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
    if (points.length !== 3) return console.error("points.length: ", points.length);

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
    if (graphics.length === 0) return console.warn("locateCenter: no selection.graphics");
    window.setViewForCanvas(selection.canvas, window.zoom, graphics[0].geometry.center);
  }

  /**
   * 获取正向连接的图形，忽略反向连接的。
   *
   * @param {Graphic[]} source 源始图形集合
   * @param {Graphic[]} target 目标图形集合
   */
  public static addConnected(source, target) {
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
  public static highlightConnected(graphics) {
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

  public static test() {
    console.info("PeaceTable: ", Object.PeaceTable);
  }

}

/** 索引切换者。*/
class IndexSwitcher {
  public start: number;
  public end: number;
  public current: number;

  constructor(start: number = 0, end: number = 10, current: number = 0) {
    this.start = start;
    this.end = end;
    this.current = current;
  }

  public prev() {
    console.info("IndexSwitcher.prev");
    this.current = this.current <= this.start ? this.end : this.current - 1;
    return this.current;
  }

  public next() {
    console.info("IndexSwitcher.next");
    this.current = this.current >= this.end ? this.start : this.current + 1;
    return this.current;
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
  public static layerSwitchMode: LayerSwitchMode = LayerSwitchMode.rotate;
  public static layerCustomSettings: number[][] = [[]];
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
   * @param  [graphic] 图形，该图形上记录着图层切换参数
   */
  public static switch(graphic?: Graphic) {
    console.info("static LayerSwitcher.switch");
    graphic && this.layerNamePrefixKey in graphic.userData
      ? this.switchByGraphic(graphic)
      : this.switchByForm();
  }

  /**
   * 切换图层通过表单参数。
   */
  public static switchByForm() {
    console.info("static LayerSwitcher.switchByForm");
    let canvasName = Common.canvas().name;
    let layerSwitcher = LayerSwitcher.layerSwitchers[canvasName];
    console.debug(`layerSwitcher: ${layerSwitcher}`);
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
            values[this.layerNamePrefixKey], values[this.layerSwitchModeKey], values[this.layerCustomSettingsKey],
          );
        });
    }

    layerSwitcher.switch();
  }

  /**
   * 切换图层通过图形参数。
   *
   * @param  graphic 图形，该图形上记录着图层切换参数
   */
  public static switchByGraphic(graphic: Graphic) {
    console.info("static LayerSwitcher.switchByGraphic");
    let layerSwitcher = LayerSwitcher.layerSwitchers[graphic.name];
    console.debug(`layerSwitcher: ${layerSwitcher}`);
    if (app.shiftKeyDown || !layerSwitcher) {
      let layerNamePrefix = graphic.userData[this.layerNamePrefixKey] || this.layerNamePrefix;
      let layerSwitchMode = LayerSwitchMode[graphic.userData[this.layerSwitchModeKey]] || this.layerSwitchMode;
      let layerCustomSettings = graphic.userData[this.layerCustomSettingsKey] || this.layerCustomSettings;
      return this.layerSwitchers[graphic.name] = LayerSwitcher.init(
        layerNamePrefix, layerSwitchMode, layerCustomSettings
      );
    }

    layerSwitcher.switch();
  }

  public static init(layerNamePrefix: string = LayerSwitcher.layerNamePrefix,
                     layerSwitchMode = LayerSwitchMode.rotate,
                     layerCustomSettings?: number[][]): LayerSwitcher {
    console.info("static LayerSwitcher.init");
    console.debug(`layerNamePrefix: ${layerNamePrefix}, layerSwitchMode: ${layerSwitchMode}`);
    let layerSwitcher = new LayerSwitcher();
    // 图层顺序：底部的图层排在前面，顶上的图层排在后面
    layerSwitcher.layers = Common.canvas().layers.filter(layer => layer.name.startsWith(layerNamePrefix)).reverse()
    if (layerSwitchMode == LayerSwitchMode.rotate) {
      layerSwitcher.settings = layerSwitcher.layers.map((layer, index) => [index]);
    } else if (layerSwitchMode == LayerSwitchMode.increase) {
      layerSwitcher.settings = layerSwitcher.layers.map((layer, index) => Array.from({length: index + 1}, (_, i) => i));
    } else {
      layerSwitcher.settings = layerCustomSettings;
    }
    layerSwitcher.settings.unshift([]);
    console.debug(`layerSwitcher.settings: ${JSON.stringify(layerSwitcher.settings)}`);
    layerSwitcher.indexSwitcher = new IndexSwitcher(0, layerSwitcher.layers.length);
    layerSwitcher.show();
    return layerSwitcher;
  }

  public show(index: number = this.indexSwitcher.current) {
    this.hiddenAll();
    index in this.settings && this.settings[index].forEach(item => this.layers[item].visible = true)
  }

  private hiddenAll() {
    for (let layer of this.layers) layer.visible = false;
  }

  public switch() {
    console.info("LayerSwitcher.switch");
    this.show(app.optionKeyDown ? this.indexSwitcher.prev() : this.indexSwitcher.next());
  }
}

class PeaceTable {

  public static defaults: PeaceTable = new PeaceTable(
    new Size(200, 70), 12, Color.RGB(1.0, 1.0, 0.75, null)
  );
  public static small: PeaceTable = new PeaceTable(
    new Size(200, 20), 12, Color.RGB(1.0, 1.0, 0.75, null)
  );

  public static cellFillColors: Object = {
    "[anon]": Color.RGB(0.75, 1.0, 0.75, null),// 浅绿，已占用但不知道具体用途
    "": Color.RGB(0.8, 0.8, 0.8, null),        // 灰色，无描述表示未使用
    "*": Color.RGB(0.75, 1.0, 1.0, null),      // 蓝色，有效数据
  };
  public cellSize: Size = new Size(200, 70);
  public cellTextSize: number = 12;
  public cellFillColor: Color = Color.RGB(1.0, 1.0, 0.75, null);// 黄色

  constructor(cellSize: Size, cellTextSize: number, cellFillColor: Color) {
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
  public drawTable(canvas: Canvas, origin: Point, texts: string[][]): Group {
    console.info("drawTable: ", texts.length);
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
    console.info("drawRow: ", texts.length);
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
    console.info("drawColumn: ", texts.length);
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
  public drawCell(canvas: Canvas, origin: Point, text: string): Shape {
    console.debug("drawCell: ", text);
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
    console.info("extractGraphicTexts: graphic.length=", graphic.length);
    graphic.forEach(item => this.extractGraphicTextsRecursively(item, texts));
    return texts;
  }

  public static extractGraphicTextsRecursively(graphic: Graphic, texts: any[]): void {
    console.info("extractGraphicTextsRecursively: ", graphic);
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
    console.info("extractTableTexts: ", table);
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
    console.debug("extractSolidText: ", solid.text);
    return solid.text;
  }
}

(() => {
  let library = new PlugIn.Library(new Version("0.1"));
  library.Common = Common;
  library.LayerSwitcher = LayerSwitcher;

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
   * @param  style 绘图样式：large、small
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
   * @param  [canvas] 画布
   * @param {Point} [origin] 起点
   * @return  虚拟内存图
   */
  library.drawMemoryAbstractly = function (canvas: Canvas, origin: Point, data?: string[]) {
    console.info("drawMemoryAbstractly");
    let locationKey = "drawMemoryAbstractly.location";
    let common = this.plugIn.library("common");
    console.debug("app.optionKeyDown: ", app.optionKeyDown);
    if (app.optionKeyDown) return common.option(canvas, locationKey, null);
    (data
        ? new Promise((resolve) => resolve(data))
        : common.readFileContentForGraphic(canvas, locationKey).then(response => JSON.parse(response.data))
    )
      .then(response => PeaceTable.small.drawColumn(canvas, origin, response.reverse()))
      .catch(response => console.error("drawMemoryAbstractly error: ", response))
  }

  library.drawTableColumn = function (canvas: Canvas, origin: Point) {
    console.info("drawTableColumn");
    let locationKey = "drawTableColumn.location";
    Common.readFileContentForGraphic(canvas, locationKey)
      .then(response => JSON.parse(response.data))
      .then(response => PeaceTable.small.drawColumn(canvas, origin, response))
      .catch(response => console.error("drawMemoryAbstractly error: ", response))
  }

  /**
   * 绘制抽象的虚拟内存。
   *
   * @param  [canvas] 画布
   * @param {Point} [origin] 起点
   * @return  虚拟内存图
   */
  library.drawMemoryStandardly = function (canvas, origin) {
    console.info("drawMemoryStandardly");
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
   * @param  canvas 画布
   * @param {Point} origin 起点，矩形左下角处位置
   * @param {String[]} descriptions 内存块描述集合
   * @return  虚拟内存单元图
   */
  library.drawMemoryBlocksAbstractly = function (canvas, origin, descriptions) {
    console.info("drawMemoryBlocksAbstractly。 descriptions.length=", descriptions.length);
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
   * @param  [canvas] 画布
   * @param {Point} [origin] 起点
   */
  library.drawStackMemoryAbstractly = function (canvas, origin) {
    console.info("drawStackMemoryAbstractly");
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
        console.info("blocks.length: ", blocks.length);
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
   * @param {Number} size 空间，字节数
   * @param {Number} start 起始地址，从 0 开始，和汇编代码相匹配
   * @param {Number} step 步调，每格字节数
   * @return {MemoryBlock[]} 内存块集合
   */
  library.buildBlocksForFrame = function (size, start = 0, step = 8) {
    console.info("buildBlocksForFrame");
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
   * @param {MemoryBlock[]} template 模板内存块集合
   * @param {MemoryBlock[]} content 内容内存块集合
   * @param {Number} [step] 步调，每格字节数
   */
  library.setBlocksForFrame = function (template, content, step = 8) {
    console.info(`setBlocksForFrame. total length: ${template.length}, content length: ${content.length}`);
    for (let contentBlock of content) {
      let index = template.findIndex(block => block.startAddress === contentBlock.startAddress);
      if (index === -1) return console.error(`can't found ${address}`);
      let endAddress = contentBlock.startAddress + (contentBlock.size || step);
      while (template[index] && template[index].endAddress <= endAddress) {
        template[index++].description = contentBlock.description;
      }
    }
  }

  /**
   * 基于内存映射，绘制虚拟内存。
   *
   * @param  [canvas] 画布
   * @param {Point} [origin] 起点
   * @param  [content] 内容
   * @param  [location] 内容
   * @return  虚拟内存图
   */
  library.drawMemoryForMaps = function (canvas, origin, content, location) {
    console.info("drawMemoryForMaps");
    this.setStyle('small');
    let common = this.plugIn.library("common");
    canvas = canvas || common.canvas();
    origin = origin || common.windowCenterPoint();
    // readFileContentForGraphic(canvas, "maps-location")
    return (content ? new Promise(resolve => resolve({data: content})) : common.selectFile())
      // return (location ? common.readFileContent(location) : common.selectFile())
      .then(response => {
        console.info("selectFile response: ", response);
        let blocks = this.resolveMaps(response.data);
        blocks.unshift({startAddress: 0n, endAddress: blocks[0].startAddress});// 从 0 开始显示
        blocks.push({
          startAddress: blocks[blocks.length - 1].endAddress,// BigInt 和 BigInt 才能相减求 size
          endAddress: BigInt("0xffffffffffffffff"), // 截止到 16 个 f，数值溢出，需要使用 BigInt
        });
        console.info("original blocks.length: ", blocks.length);
        blocks = this.paddingBlocks(this.sortBlocks(blocks));
        console.info("padding blocks.length: ", blocks.length);
        blocks = this.mergeBlocks(blocks);
        console.info("merged blocks.length: ", blocks.length);
        return this.drawMemoryBlocks(canvas, origin, blocks);
      })
      .catch(response => {
        console.error("selectFile response: ", response);
      });
  }

  /**
   * 解析内存映射。
   *
   * @param  content 内存映射内容
   * @return {MemoryBlock[]} 内存块
   */
  library.resolveMaps = function (content) {
    //1                                  2     3         4      5        6
    //561d970c5000-561d970c6000          r--p  00000000  08:03  1581273  /usr/lib/jvm/java-17-openjdk-amd64/bin/java
    console.info("resolveMaps");
    let lines = content.split("\n");
    console.info("lines.length: ", lines.length);
    return lines.filter(line => line)
      .map(line => line.split(/ +/))
      .map(cells => {
        // console.info("cells: ", cells);
        let addresses = cells[0].split("-");
        // 16 个 f 需要使用 BigInt 才能表示
        return {
          startAddress: BigInt(parseInt(addresses.shift(), 16)),
          endAddress: BigInt(parseInt(addresses.shift(), 16)),
          description: (cells[5] || "").split("/").pop() || "[anon]" //全路径太长，只取末尾的程序名
        };
      });
  }

  /**
   * 合并相同描述的相邻内存块。此处假设相同描述的内存块是连续的。
   *
   * @param {MemoryBlock[]} blocks 内存块集合
   * @return {MemoryBlock[]} 内存块集合
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
   * @param {MemoryBlock[]} blocks 内存块集合
   * @return {MemoryBlock[]} 等于输入的内存块集合
   */
  library.sortBlocks = function (blocks) {
    blocks.sort((left, right) => left.startAddress - right.startAddress);
    return blocks;
  }

  /**
   * 对齐内存块集合。
   * 内存地址应该是连续的，在空缺处补齐。
   * @param {MemoryBlock[]} blocks 内存块集合
   * @return {MemoryBlock[]} 等于输入的内存块集合
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
   * @param  canvas 画布
   * @param {Point} origin 起点，矩形的左下点
   * @param {MemoryBlock[]} blocks 内存块集合
   * @return  绘制的图形
   */
  library.drawMemoryBlocks = function (canvas, origin, blocks) {
    console.info("drawMemoryBlocks");
    let array = blocks.map((block, index) => {
      // console.info("block: ", JSON.stringify(block));
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
   * @param  canvas 画布
   * @param {Point} startPoint 起点，矩形左下角处位置
   * @param {MemoryBlock} block 内存块
   * @return  绘制的图形
   */
  library.drawMemoryBlock = function (canvas, startPoint, block) {
    // console.info(`drawMemoryBlock. startPoint=${startPoint}, block=${block}`);
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
   * @param  canvas 画布
   * @param {Point} location 位置
   * @param  [description] 描述
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
   * @param  canvas 画布
   * @param {Point} origin 起点
   * @param {Number|BigInt} address 地址
   * @return {Group} 绘制的图形
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
   * PlugIn.find('com.github.peacetrue.learn.graffle').library('memory').formatMemoryAddress(BigInt("0xffffffffffffffff"))
   *
   * @param {Number|BigInt} address 内存地址
   * @return  内存地址描述
   */
  library.formatMemoryAddress = function (address) {
    // console.info(`formatMemoryAddress. address=${address}`);
    let dynamic = this.dynamic;
    let text = address < 0 ? '-' : ' '; //符号位
    if (dynamic.labelTextBase === 16) text += '0x'; //16 进制标志
    let absAddress = address > 0 ? address : -address;
    return text + absAddress.toString(dynamic.labelTextBase).leftPad(dynamic.labelTextLength, '0');
  }

  /**
   * 绘制内存空间尺寸。
   *
   * @param  canvas 画布
   * @param {Point} location 位置
   * @param {Number} size 空间尺寸
   * @return {Group} 绘制的图形
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
