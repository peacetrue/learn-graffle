(() => {

    let library = new PlugIn.Library(new Version("0.1"));

    library.size = new Size(150, 30);

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
            shape.text = `${property.name}: ${property.type}`;
            shapes.push(shape);
        }
        return new Group(shapes);
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
        let shape;
        for (let entity of entities) {
            if (shape) origin = origin.add(new Point(0, shape.geometry.height));
            shape = this.drawEntity(canvas, origin, entity);
        }
    }

    /**
     * 绘制实体集合。
     *
     * @param {Canvas} [canvas] 画布
     * @param {Point} [origin] 原点
     * @return {Shape} 形状
     */
    library.drawEntitiesFromFile = function (canvas, origin) {
        let common = this.plugIn.library("common");
        canvas = canvas || common.canvas();
        origin = origin || common.windowCenterPoint();
        common.selectFile([TypeIdentifier.json])
            .then(response => {
                let entities = JSON.parse(response.data);
                this.drawEntities(canvas, origin, entities);
            })
            .catch(response => {
                console.error("response: ", response);
            });
    }

    return library;
})();
