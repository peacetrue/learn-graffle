
build:
	mkdir -p $@
clean:
	rm -rf build

%.sort: build
	cat $* | sort > build/$@

points: 磁极.1.js.sort 磁极.2.js.sort;
fonts: 文字.常规.js.sort 文字.粗体.js.sort;

