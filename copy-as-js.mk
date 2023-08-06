# 排序文件内容，同一图形每次拷贝的代码会发生变化，统一排序后便于对比
$(BUILD)/%.sort: $(SRC)/code/% $(BUILD)
	cat $< | sort > $@
points: $(BUILD)/point.1.js.sort $(BUILD)/point.2.js.sort;
fonts: $(BUILD)/font.normal.js.sort $(BUILD)/font.bold.js.sort;
lines: $(BUILD)/line.straight.js.sort $(BUILD)/line.straight.reverse.js.sort $(BUILD)/line.straight.label.js.sort $(BUILD)/line.angle.js.sort $(BUILD)/line.point.js.sort;
texts: $(BUILD)/text.js.sort $(BUILD)/text.b.js.sort;
