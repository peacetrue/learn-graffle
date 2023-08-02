(() => {

    let library = new PlugIn.Library(new Version("0.1"));
    library.size = new Size(200, 20);

    /**
     * 绘制实体集合。
     *
     * @param {Canvas} [canvas] 画布
     * @param {Point} [origin] 原点
     * @return {Shape} 形状
     */
    library.drawEntitiesFromFile = function (canvas, origin) {
        console.info("drawEntitiesFromFile");
        let common = this.plugIn.library("common");
        canvas = canvas || common.canvas();
        origin = origin || common.windowCenterPoint();
        let graphic = common.selectedGraphic();
        let promise = graphic
            ? common.readFileContentForGraphic(graphic, "location-entity")
            : common.selectFile([TypeIdentifier.json]);
        promise
            .then(response => {
                let entities = JSON.parse(response.data);
                this.drawEntities(canvas, origin, entities);
            })
            .catch(response => {
                console.error("response: ", response);
            });
    }

    /**
     * 绘制实体集合。
     *
     * @param {Canvas} canvas 画布
     * @param {Point} origin 原点
     * @param {Object[]} entities 实体
     * @return {Shape} 形状
     */
    library.drawEntities = function (canvas, origin, entities) {
        let shapes = [];
        for (let entity of entities) {
            if (shapes.length > 0) origin = origin.add(new Point(0, shapes[shapes.length - 1].geometry.height));
            shapes.push(this.drawEntity(canvas, origin, entity));
        }
        return shapes;
    }

    /**
     * 绘制实体。
     *
     * @param {Canvas} canvas 画布
     * @param {Point} origin 原点
     * @param {Object} entity 实体
     * @return {Shape} 形状
     */
    library.drawEntity = function (canvas, origin, entity) {
        let shapes = [];
        let header = this.drawShape(canvas, origin);
        header.fontName = "PingFangSC-Semibold";
        header.text = entity.name;
        shapes.push(header);
        for (let property of entity.properties) {
            origin = new Point(origin.x, origin.y + this.size.height);
            let shape = this.drawShape(canvas, origin);
            shape.text = `${property.type} ${property.name}`;
            shape.textHorizontalAlignment = HorizontalTextAlignment.Left;
            shapes.push(shape);
        }
        return new Group(shapes);
    }

    /**
     * 绘制形状。
     *
     * @param {Canvas} canvas 画布
     * @param {Point} origin 原点
     * @return {Shape} 形状
     */
    library.drawShape = function (canvas, origin) {
        let size = this.size;
        let shape = canvas.newShape();
        shape.geometry = new Rect(origin.x, origin.y, size.width, size.height);//几何体边界：矩形
        shape.shadowColor = null;//阴影颜色
        shape.strokeThickness = 1;//边框宽度
        //磁体、磁极：可连线的点
        shape.magnets = [
            new Point(0, 0),
            new Point(-size.width / 2, 0),
            new Point(size.width / 2, 0),
        ];
        return shape;
    }

    return library;
})();
