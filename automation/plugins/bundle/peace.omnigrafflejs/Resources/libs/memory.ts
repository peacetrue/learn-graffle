/**
 * 虚拟内存：
 * 抽象虚拟内存：没有虚拟地址或者虚拟地址是不真实的
 * 具体虚拟内存：虚拟地址是真实的
 * 程序运行起来才能得到具体虚拟地址，否则就使用抽象的方法分析虚拟内存。
 */
(() => {
    let library = new PlugIn.Library(new Version("0.1"));
    // 加载第三方类库，eval 作用域有限制
    library.plugIn.resourceNamed("libs/api.js").fetch(response => eval(response.toString()));
    library.plugIn.resourceNamed("libs/logger.js").fetch(response => eval(response.toString()));

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

    /**
     * 设置绘图样式。
     *
     * @param {String} style 绘图样式：large、small
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
     * @param {Canvas} [canvas] 画布
     * @param {Point} [origin] 起点
     * @return {Graphic} 虚拟内存图
     */
    library.drawMemoryAbstractly = function (canvas, origin) {
        console.info("drawMemoryAbstractly");
        this.setStyle("small");
        let common = this.plugIn.library("common");
        canvas = canvas || common.canvas();
        origin = origin || common.windowCenterPoint();
        let graphic = common.selectedGraphic();
        Console.debug("graphic: ", graphic);
        this.dynamic.direction = common.option(graphic || canvas, "memory.direction") || this.dynamic.direction;
        let promise = graphic
            ? common.readFileContentForGraphic(graphic, "location-drawMemoryAbstractly")
            : common.selectFile([TypeIdentifier.json]);
        promise
            .then(response => {
                console.info("response: ", JSON.stringify(response));
                this.drawMemoryBlocksAbstractly(canvas, origin, JSON.parse(response.data));
            })
            .catch(response => Console.error("drawMemoryAbstractly error: ", response))
    }

    /**
     * 绘制抽象的虚拟内存。
     *
     * @param {Canvas} [canvas] 画布
     * @param {Point} [origin] 起点
     * @return {Graphic} 虚拟内存图
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
     * @param {Canvas} canvas 画布
     * @param {Point} origin 起点，矩形左下角处位置
     * @param {String[]} descriptions 内存块描述集合
     * @return {Graphic} 虚拟内存单元图
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
     * @param {Canvas} [canvas] 画布
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
     * @param {Canvas} [canvas] 画布
     * @param {Point} [origin] 起点
     * @param {String} [content] 内容
     * @param {String} [location] 内容
     * @return {Graphic} 虚拟内存图
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
     * @param {String} content 内存映射内容
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
     * @param {Canvas} canvas 画布
     * @param {Point} origin 起点，矩形的左下点
     * @param {MemoryBlock[]} blocks 内存块集合
     * @return {Graphic} 绘制的图形
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
     * @param {Canvas} canvas 画布
     * @param {Point} startPoint 起点，矩形左下角处位置
     * @param {MemoryBlock} block 内存块
     * @return {Graphic} 绘制的图形
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
     * @param {Canvas} canvas 画布
     * @param {Point} location 位置
     * @param {String} [description] 描述
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
     * @param {Canvas} canvas 画布
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
     * @return {String} 内存地址描述
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
     * @param {Canvas} canvas 画布
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
