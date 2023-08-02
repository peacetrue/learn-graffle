SCRIPT:=$(SRC)/script
# 从脚本目录拷贝到构建目录
$(BUILD)/%: $(SCRIPT)/% $(BUILD)
	cp $< $@

# encode 函数，编码文件内容。brew install jq。
# Shell 如何传递命令行参数，保证参数能正确接受。echo 如何正确输出 ['"]，如何正确传递转义后的字符。echo "'\"" > a.txt; echo `cat a.txt`。
$(BUILD)/%.encode: $(BUILD)/%
	cat $< | grep -v '//' | jq -sRr @uri > $@

#自动化执行
script_content?=default-statement.js
script_argument?=default-argument.json
omnijs_run=open "omnigraffle:///omnijs-run?script=$(1)&arg=$(2)"
omnijs-run:
	$(call omnijs_run,$(script_content),$(script_argument))
omnijs-run-file: $(BUILD)/$(script_content) $(BUILD)/$(script_argument)
	$(call omnijs_run,`cat $<`,`cat $(word 2,$^)`)
omnijs-run-file-encode:
	make omnijs-run-file script_content=$(script_content).encode script_argument=$(script_argument).encode
omnijs-run-file-encode/%:
	make omnijs-run-file-encode script_content=$*.js script_argument=$*.json

omnijs.plugin-view.case: omnijs-run-file-encode/plugin-view;
omnijs.plugin-perform.case: omnijs-run-file-encode/plugin-perform;

# 编译 ts 文件
tsc:
	command -v tsc && cd $(SRC)/plugins/bundle/peace.omnigrafflejs/Resources && tsc || true

# 绘制内存
## 绘制方向
memory.directions:=BOTTOM_UP
#memory.directions:=LEFT_RIGHT RIGHT_LEFT UP_BOTTOM BOTTOM_UP
# json 数据添加方向参数
define memory.direction
$(BUILD)/%.$(1): $(BUILD)/%;
	@echo '["$(1)",$$(shell cat $$<)]' > $$@
endef
$(foreach target,$(memory.directions),$(eval $(call memory.direction,$(target))))

#字面量化，将文件中的内容转换为字面量形式，-z 使用 \0 而非 \n 分割行
literalify=$(shell cat $(1) | sed -z 's/"/\\"/g;s/\n/\\n/g')
$(BUILD)/%.json: $(BUILD)/%
	cat $< | sed -z 's/"/\\"/g;s/\n/\\n/g;s/^/"/;s/$$/"/' > $@
literal.test: $(BUILD)/demo-memory.maps.json

# 绘制 4 个方向的内存图
omnijs.memory.case: tsc;
	@for direction in $(memory.directions) ; do \
		make omnijs-run-file script_content=demo-memory.js.encode script_argument=demo-memory.json.$$direction.encode; \
	done
omnijs.memory.clean.case: clean/*memory.*

memory.abstract.case:
	cd plugins/bundle/peace.omnigrafflejs/Resources && tsc || true
	make automation script_content=demo-memory.js script_argument=demo-memory.json

# 外部使用案例，可通过 script_argument 指定 maps 文件绝对路径
demo-memory.call.case: $(BUILD)
	$(eval name:=$(notdir $(patsubst %/,%,$(dir $(script_argument)))).maps)
	cp $(script_argument) $(BUILD)/$(name)
	make automation script_content=demo-memory.js script_argument=$(name)
