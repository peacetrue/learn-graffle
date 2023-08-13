# 构建通用文件，声明构建目录的创建和清除
override src:=src#源始文件目录，作为常量使用，请勿改变该值
SRC:=$(src)#作为变量使用
DEBUG_VARS+=src SRC

override build:=build#目标文件目录，作为常量使用，请勿改变该值
BUILD:=$(build)#作为变量使用
DEBUG_VARS+=build BUILD

mkdir/%:; mkdir -p $*
mkdir: mkdir/$(BUILD);
#所有不带食谱的规则，需要以分号结尾。去掉 $(BUILD)/% 后的分号，执行 make common.case，出现以下错误
# make: *** No rule to make target `build/test', needed by `common.case'.  Stop.
#$(BUILD): mkdir;#此写法导致依赖于 $(BUILD) 的目标每次都触发 mkdir -p build，当文件名与目标名相同时的选择策略为何？
$(BUILD):; mkdir -p $(BUILD) #此写法能触发文件缓存
#$(BUILD)/%: mkdir/$(BUILD)/%; #此目标导致 $(BUILD)/%.txt 类写法全部失效

#如果是删除 build 目录，使用 -f 强制删除
rm/%:; rm -r$(if $(filter $(build)%,$*),f,) $*
rm: rm/$(BUILD);
clean: rm;
clean/%: rm/$(BUILD)/%;

# 从源目录拷贝到目标目录
# $(BUILD)/%: $(EXTERNAL_SRC)/% $(BUILD); cp $< $@
EXTERNAL_SRC?=$(SRC)
$(foreach item,$(EXTERNAL_SRC),$(eval $(BUILD)/%: $(item)/% $(BUILD); cp $$< $$@))
DEBUG_VARS+=EXTERNAL_SRC
