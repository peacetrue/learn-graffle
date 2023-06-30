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
	mkdir -p $(BUILD)

#排序文件内容，同一图形每次拷贝的代码会发生变化，统一排序后便于对比
$(BUILD)/%.sort: code/% $(BUILD)
	cat $< | sort > $@
points: point.1.js.sort point.2.js.sort;
fonts: font.normal.js.sort font.bold.js.sort;
lines: line.straight.js.sort line.straight.reverse.js.sort line.straight.label.js.sort line.angle.js.sort line.point.js.sort;
texts: text.js.sort text.b.js.sort;

# 从脚本目录拷贝到构建目录
$(BUILD)/%: $(SCRIPT)/% $(BUILD)
	cp $< $@
#字面量化，将文件中的内容转换为字面量形式，-z 使用 \0 而非 \n 分割行
literalify=$(shell cat $(1) | sed -z 's/"/\\"/g;s/\n/\\n/g')
$(BUILD)/%.json: $(BUILD)/%
	cat $< | sed -z 's/"/\\"/g;s/\n/\\n/g;s/^/"/;s/$$/"/' > $@
literal.test: $(BUILD)/demo-memory.maps.json

#encode 函数，编码文件内容。brew install jq。
# Shell 如何传递命令行参数，保证参数能正确接受。echo 如何正确输出 ['"]，如何正确传递转义后的字符。echo "'\"" > a.txt; echo `cat a.txt`。
encode=$(shell echo "$(1)" | grep -v '//' | jq -sRr @uri)
encode.test:
	@echo "$(call encode,1)"
	@echo "$(call encode,'1')"
	@echo "$(call encode,"1")"
	@echo "$(call encode,`cat script/plugin-view.js`)"
$(BUILD)/%.encode: $(BUILD)/%
	cat $< | grep -v '//' | jq -sRr @uri > $@

#自动化执行
script_content:=default-statement.js
script_argument:=default-argument.json
# 如果是文件，读取文件内容；否则直接作为文件内容
#script_resolve=$(if $(filter $(suffix $(1)),$(2)),`cat $(1)`,$(1))
script_resolve=`cat $(1)`#当前都是文件
script_resolve.test:
	echo "$(call script_resolve,$(script_content),.js)"
	echo "$(call script_resolve,$(script_argument),.json .maps .txt)"
omnijs_run=$(shell open "omnigraffle:///omnijs-run?script=$(1)&arg=$(2)")
omnijs_run_encode=$(call omnijs_run,$(call encode,$(1)),$(call encode,$(2)))
omnijs_run_encode_resolve=$(call omnijs_run_encode,$(call script_resolve,$(1),.js),$(call script_resolve,$(2),.json .maps .txt))
#automation:
#	$(call omnijs_run_encode_resolve,$(script_content),$(script_argument))
automation: $(BUILD)/$(script_content).encode $(BUILD)/$(script_argument).json.encode
	open "omnigraffle:///omnijs-run?script=`cat $(word 1,$^)`&arg=`cat $(word 2,$^)`"
automation/%:
	make automation script_content=$*.js script_argument=$*

plugin-view.case: automation/plugin-view;
plugin-perform.case: automation/plugin-perform;

# 本地测试案例
demo-memory.case:
	make automation script_content=demo-memory.js script_argument=demo-memory.maps

# 外部使用案例，可通过 script_argument 指定 maps 文件绝对路径
demo-memory.call.case: $(BUILD)
	$(eval name:=$(notdir $(patsubst %/,%,$(dir $(script_argument)))).maps)
	cp $(script_argument) $(BUILD)/$(name)
	make automation script_content=demo-memory.js script_argument=$(name)

# 命令替换中 shell 和 `` 的区别
shell.case:
	echo "$(shell cat script/plugin-view.js)"
	@echo -------------------
	echo "`cat script/plugin-view.js`"
