# 2016.INFOVIS.BarcodedTreeCode
barcodedTree-structure
using Js backbone structure 

#程序入口：app.js
Marionette定义的application框架
main.js -> app.js -> controller.js(作为router，对于程序的实现顺序进行控制)router.js现在有什么用途还不太清楚 -> 
app.view(主要的界面，是其他的界面的容器) 
-> 启动datacenter.model对于其他的数据处理进行控制
	->basicDataModel:
      主要加载一些基本的数据，整个数据处理的过程中最原始的数据
		将所有的barcode文件都加载进去
      将所有的树结构的部分组织成一个真正的树
	->histogramModel:
      将绘制histogram的数据组织在一起
	->barcodeModel:
      null
	->barcodeCollection:
      计算barcode中各个节点需要放置的位置，主要分为两种情况，reduce的barcode以及unreduce的barcode
-> 加载其他的上层视图，即为layoutview，主要包括
   	   -> toolbarView
   	   	  主要是加载toolbarview上的基本元素，包括在toolbarview上面的交互方式
   	   -> sidebarView
   	   	  主要是加载在sidebar上面的一些控制元素，包括鼠标hover过程中对于选择元素的介绍
   	   -> histogramView
   	   	  histogramView是一个LayoutView用于控制显示内部的子视图
   	   	  histogramView主要是用于加载histogramMainView，在histogramMainView加载的时候向其中传入的是一个关于全部的文件统计得到的model
   	   -> barcodeView
   	      barcodeview中加载多个子视图 
   	      在barcodeView中传入的是barcodeModel？barcodeModel的内容


-> 允许调整视图的各个部分的大小

Server端:

data_process_index.js => 数据预处理的入口, 运行该程序会预处理数据, 选择适当的预处理函数处理对应的数据

index.js => server端的启动入口


