#字面量化，将文件中的内容转换为字面量形式，-z 使用 \0 而非 \n 分割行
omnijs.literalify=sed -z 's/"/\\"/g;s/\n/\\n/g'
$(BUILD)/%.maps.json: $(BUILD)/%.maps
	cat $< | sed -z 's/"/\\"/g;s/\n/\\n/g' | sed 's/^/["MemoryPainter",{"type":"maps","content":"/;s/$$/"}]/' > $@
$(BUILD)/%.frames.json: $(BUILD)/%.frames
	cat $< | sed '1d' | sed -z 's/"/\\"/g;s/\n/\\n/g' | sed 's/^/["MemoryPainter",{"type":"frames","content":"/; s/$$/"}]/' > $@
$(BUILD)/%.class-diagram.json: $(BUILD)/%.json
	@echo '["ClassDiagramPainter",{"entry":"CONSTANT_InvokeDynamic_info","entities":$(shell cat $<)}]' > $@
#	cat $< | sed -z 's/"/\\"/g;s/\n/\\n/g' | | sed 's/^/["ClassDiagramPainter",{"entry":"CONSTANT_InvokeDynamic_info","entities":"/; s/$$/"}]/' > $@
$(BUILD)/%.json: $(BUILD)/%
	cat $< | sed -z 's/"/\\"/g;s/\n/\\n/g' | sed 's/^/"/;s/$$/"/' > $@
#$(BUILD)/%.load: $(BUILD)/%
#	@echo '["Common.load",$(shell cat $<)]' > $@

# encode 函数，编码文件内容。brew install jq。
# shell 如何传递命令行参数，保证参数能正确接受。echo 如何正确输出 ['"]，如何正确传递转义后的字符。echo "'\"" > a.txt; echo `cat a.txt`。
$(BUILD)/%.encode: $(BUILD)/%
	cat $< | grep -v '^//' | jq -sRr @uri > $@

#自动化执行
SCRIPT_CONTENT?=default-statement.js
SCRIPT_ARGUMENT?=default-argument.json
omnijs_run=open "omnigraffle:///omnijs-run?script=$(1)&arg=$(2)"
omnijs-run:
	$(call omnijs_run,$(SCRIPT_CONTENT),$(SCRIPT_ARGUMENT))
omnijs-run-file: $(BUILD)/$(SCRIPT_CONTENT) $(BUILD)/$(SCRIPT_ARGUMENT)
	$(call omnijs_run,`cat $<`,`cat $(word 2,$^)`)
omnijs-run-file-encode:
	make omnijs-run-file SCRIPT_CONTENT=$(SCRIPT_CONTENT).encode SCRIPT_ARGUMENT=$(SCRIPT_ARGUMENT).encode
omnijs-run-file-encode/%:
	make omnijs-run-file-encode SCRIPT_CONTENT=$*.js SCRIPT_ARGUMENT=$*.json

omnijs.plugin-view.case: omnijs-run-file-encode/plugin-view;
omnijs.plugin-perform.case: omnijs-run-file-encode/plugin-perform;

# 编译 ts 文件
tsc.delay:=1 # tsc 之后立即绘制，JS 文件更新不及时，等待 1 秒
tsc:
	cd $(SRC)/plugins/bundle/peace.omnigrafflejs/Resources && tsc
	sleep $(tsc.delay)

# 绘制 4 个方向的组图
## 绘制方向
#group.directions:=LEFT_RIGHT
group.directions:=LEFT_RIGHT RIGHT_LEFT UP_BOTTOM BOTTOM_UP
$(BUILD)/%.StringGroupPainter: $(BUILD)/%
	@echo '["StringGroupPainter",{"direction":"$(DIRECTION)","content":$(shell cat $<)}]' > $@
omnijs.group.case: tsc
	@for direction in $(group.directions) ; do \
		make clean/demo-group.json.StringGroupPainter* omnijs-run-file DIRECTION=$$direction SCRIPT_CONTENT=class-caller.js.encode SCRIPT_ARGUMENT=demo-group.json.StringGroupPainter.encode; \
	done
omnijs.group.clean.case: clean/*group.*;

# 绘制 4 个方向的内存图
# json 数据添加方向参数
define memory.direction
$(BUILD)/%.$(1): $(BUILD)/%;
	@echo '["MemoryPainter",{"direction":"$(1)","type":"raw","content":$$(shell cat $$<)}]' > $$@
endef
$(foreach target,$(group.directions),$(eval $(call memory.direction,$(target))))

omnijs.memory.case: tsc
	@for direction in $(group.directions) ; do \
		make omnijs-run-file SCRIPT_CONTENT=class-caller.js.encode SCRIPT_ARGUMENT=demo-memory.json.$$direction.encode; \
	done
omnijs.memory.clean.case: clean/*memory.*;

# 绘制类图
omnijs.class-diagram.case: omnijs.class-diagram.clean.case tsc
	make omnijs-run-file SCRIPT_CONTENT=class-caller.js.encode SCRIPT_ARGUMENT=ConstantPool.class-diagram.json.encode
omnijs.class-diagram.clean.case: clean/*class-diagram*;
