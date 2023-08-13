.SECONDARY:#保留中间过程文件

EXTERNAL_SRC+=$(SRC)/script $(SRC)/code
include build.common.mk
include copy-as-js.mk
include omnijs.mk
