CODE=code
PLUGINS=plugins
SCRIPT=script
SUBDIR:=#在子目录下构建时使用，默认为空格，设置时需要以 / 起始，例如：SUBDIR=/dynamic
BUILD:=build$(SUBDIR)#设置构建目录
#删除 BUILD 中的空格，避免执行 clean 时，误删根目录。如果传入 SUBDIR=' / sub'，则删除命令为 rm -rf build / sub，结果很惨烈，好在是虚拟机
BUILD:=$(shell echo "$(BUILD)" | tr -d ' ')

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
# make automation # make automation script_content=default-function.js # make automation script_content=entity-draw.js script_argument=demo-jdk.json
automation: $(BUILD)/$(script_content).encode $(BUILD)/$(script_argument).encode
	open "omnigraffle:///omnijs-run?script=$(shell cat $<)&arg=$(shell cat $(BUILD)/$(script_argument).encode)"
# make automation/plugin-view # make automation/plugin-perform # make automation/demo-jdk
automation/%:
	make automation script_content=$*.js script_argument=$*.json
demo-memory.case:
	make automation/demo-memory
#	make automation script_content=demo-memory.js
