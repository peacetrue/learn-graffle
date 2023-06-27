CODE=code
PLUGINS=plugins
SCRIPT=script
BUILD=build

.SUFFIXES:#取消默认文件后缀识别
.SECONDARY:#保留中间过程文件

%: $(BUILD)/%;

$(BUILD):
	mkdir -p $@
clean:
	rm -rf $(BUILD)

#排序文件内容，同一图形每次拷贝的代码会发生变化，统一排序后便于对比
$(BUILD)/%.sort: $(CODE)/% $(BUILD)
	cat $< | sort > $@
points: point.1.js.sort point.2.js.sort;
fonts: font.normal.js.sort font.bold.js.sort;
lines: line.straight.js.sort line.straight.reverse.js.sort line.straight.label.js.sort line.angle.js.sort line.point.js.sort;
texts: text.js.sort text.b.js.sort;

#编码文件内容 brew install jq
# make default-statement.js.encode
# make plugin.js.encode
$(BUILD)/%.encode: $(SCRIPT)/% $(BUILD)
	cat $< | grep -v '//' | jq -sRr @uri > $@
#自动化
script_content=default-statement.js
script_argument=default-argument.json
# make automation
# make automation script_content=default-function.js
# make automation script_content=entity-draw.js script_argument=demo-jdk.json
$(BUILD)/automation: $(BUILD)/$(script_content).encode $(BUILD)/$(script_argument).encode
	open "omnigraffle:///omnijs-run?script=$(shell cat $<)&arg=$(shell cat $(BUILD)/$(script_argument).encode)"
# make plugin-view.automation
# make plugin-perform.automation
# make demo-jdk.automation
$(BUILD)/%.automation:
	make $(BUILD)/automation script_content=$*.js script_argument=$*.json
