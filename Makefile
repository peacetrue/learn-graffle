.SECONDARY:#保留中间过程文件

SRC:=src/script src/code
include build.common.mk
include copy-as-js.mk
include omnijs.mk
include make.debug.mk
