# 排序文件内容，同一图形每次拷贝的代码会发生变化，统一排序后便于对比
$(BUILD)/%.sort: $(SRC)/code/% $(BUILD)
	cat $< | sort > $@
points: point.1.js.sort point.2.js.sort;
fonts: font.normal.js.sort font.bold.js.sort;
lines: line.straight.js.sort line.straight.reverse.js.sort line.straight.label.js.sort line.angle.js.sort line.point.js.sort;
texts: text.js.sort text.b.js.sort;
