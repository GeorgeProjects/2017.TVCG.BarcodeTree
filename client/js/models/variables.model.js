define([
  'require',
  'marionette',
  'underscore',
  'backbone'
], function (require, Mn, _, Backbone) {
  'use strict'

  window.Variables = new (Backbone.Model.extend({
    defaults: {
      //****************************************************
      //  当前渲染的barcode数据集
      currentDataSetName: 'DailyRecordTree',
      //  当前的barcode比较视图的宽度
      barcodetreeViewWidth: 0,
      //  当前的barcode比较视图的高度
      barcodetreeViewHeight: 0,
      //  barcode的最大的宽度
      barcodeNodexMaxX: 0,
      //  barcode视图的margin
      comparisonViewMargin: { left: 30, right: 50 },
      //  对齐的节点
      alignedLevel: 0,
      //  标记不同的barcode背景颜色的对象
      selectedItemColorObj: {},
      //  barcode的比较模式
      comparisonMode: 'TOPOLOGICAL', //'TOPOLOGICAL' 'ATTRIBUTE'
      TOPOLOGICAL: 'TOPOLOGICAL',
      ATTRIBUTE: 'ATTRIBUTE',
      //  barcode的边界宽度
      barcodePadding: 40,
      //  当前对齐的barcode的范围的节点属性值分布对象
      barcodeNodeCollectionObj: {},
      //  带有节点的id的节点属性值分布对象
      barcodeNodeCollectionObjWithId: {},
      //  tooltip的宽度, 在tooltip的边界超过视图的边界, 那么就会移动tooltip的位置
      tipWidth: 220,
      //  supertree的状态, false表示关闭, true表示打开
      superTreeViewState: false,
      //****************************************************
      'finishInit': false,
      //  whether loading page show
      'loading': true,
      //在histogram上选中的item的数组
      'selectItemNameArray': [],
      //  标记各层的bar的宽度
      'barcodeWidthArray': [ 18, 12, 8, 4, 1 ],
      //  标记barcode的高度
      'barcodeHeight': 40,
      //  在fish eye模式下不同的barcode类型的高度的数量
      'differentHeightNumber': 15,
      //  barcodeHeight传递到服务器端需要增加一定的比例, 因为barcode的节点的上部分与下部分都是存在一定的间隙
      'barcodeHeightRatio': 0.8,
      //  最小的barcode的高度
      'minBarcodeHeight': 2,
      //  最大的barcode的宽度
      'maxBarcodeWidth': 20,
      //  最小的barcode的宽度
      'minBarcodeWidth': 1,
      //  histogram和barcode都需要的变量
      //  给virtual的结点的description的标签
      'virtualNodeDescription': 'virtual',
      //  存储最后一个被选中的bar对应的数据在文件数组中的index，即时间维的index
      'lastSelectBarIndex': 2,
      //  当前显示的节点的层次数组, 出现在这个数组的层级的节点会显示
      'selectedLevels': [],
      //  displayed Last Level
      'displayedLastLevel': 3,
      //  supertree的高度
      'superTreeHeight': 60,
      //  当前的config panel的状态, 打开(open)或者关闭(close)
      'configPanelState': 'close',
      'removeBarId': undefined,
      //  标记当前是否正在单击选着lastSelectBar
      'maintainingLastSelectBar': true,
      //  双击选中的一组bar
      'selectBarArray': [],
      //  选中的bar的名称
      'selectBarNameArray': [],
      //  对齐的节点的数组
      'alignedNodeIdArray': [],
      //  Barcode中不同层级的node的颜色
      'barcodeNodeColorArray': [],
      //  按照time排序之后的histogram数组
      'selectBarNameArrayTimeSort': [],
      //  排序之后的选中的bar的数组
      'selectBarNameArrayAfterSort': [],
      //  barcode需要的变量
      //  1. 需要根据数据格式手动调整的量
      //  手动设置的总层数
      'sumLevel': 5,
      //  当前绘制出的的层级
      'currentLevel': 4,
      //  barcode某个层级范围内节点数量
      'maxLeveledNumArray': [],
      //  2. 可以通过按钮调整的量
      //  标记当前处在barcode的完全展开或者压缩状态
      'compressBarcodeMode': false,
      //  当前应该被展示的层级的集合
      'displayedLevel': [],
      //  标记mouseover时是否highlightsibling
      'highlightSibling': false,
      //  标记mouseover时是否highlightcousin
      'highlightCousin': false,
      //  设置bar允许的最小宽度
      'minWidth': 1,
      //  设置bar允许的最大宽度
      'maxWidth': 30,
      //  设置bar允许的最小高度
      'minHeight': 1,
      //  设置bar允许的最大高度
      'maxHeight': 100,
      //  标记所有bar的高度
      'barHeight': 40,
      //  3. 与数据格式无关，但是也不会暴露出来的在代码中调整的样式参数
      //  相邻的bar之间的距离
      'barInterval': 1.5,
      //  reduce状态下一列里面有多少个方块
      'squarenumOfColumn': 5,
      //  histogram需要的变量
      //  取"time"或"value"
      'histogramSortMode': 'time',
      //  取"sum_flowSize"或"nonvirtual_sum_node"
      'histogramValueDim': 'sum_flowSize',
      //  barcode布局的方法
      'layoutMode': 'UNION', //或者FISHEYE
      //  display布局的方法
      'displayMode': 'GLOBAL',//或者  COMPACT ORIGINAL GLOBAL
      //  barcode的margin对象
      barcodeMargin: { top: 0, left: 1 / 25, bottom: 1 / 90, right: 0 },
      //  datelinechart的margin对象
      dateLineChartMargin: { top: 0, left: 1 / 20, bottom: 1 / 90, right: 1 / 10 },
      //  subtreelinechart的margin对象
      subtreeLineChartMargin: { top: 1 / 70, left: 1 / 25, bottom: 1 / 70, right: 1 / 50 },
      //  histogram的margin对象
      histogramMargin: { top: 1 / 10, left: 1 / 20, bottom: 1 / 6, right: 1 / 60 },
      //  当前渲染的数据集名称
      currentDataSet: null,
      //  barcode的宽度数组
      barcodeWidthObject: {},
      //  barcode的高度
      maxBarcodeHeight: 0,
      //  每一列barcode压缩的数量
      compactNum: 5,
      //  barcode当前的显示模式
      barcodeMode: 'original',
      //  渲染的树的最大深度
      maxDepth: null,
      //  每个barcode的宽度数组,以barcode的名称为索引
      barcodeMaxWidthObj: {},
      //  树的最大宽度
      maxTreeNodeWidth: null,
      //  树的高度变化的比率
      formerCurrentHeightRatio: 1,
      //  树宽度变化的比率
      formerCurrentWidthRatio: 1,
      //  树高度的累积变化比率
      formerAggreCurrentHeightRatio: 1,
      //  树宽的累积变化比率
      formerAggreCurrentWidthRatio: 1,
      //  定义barcode位置的对象, 对象的索引是barcode的item名称, 属性数值是名称对应的位置
      barcodeItemLocationObj: null,
      //  增加了brush之后每个barcode在brush之后都有自己对应的singleWidthArray
      barcodeSingleWidthArrayObj: {},
      //  在superTree中也会存在对应的widthArray
      barcodeSuperWidthArray: undefined,
      //  当前系统compact的最大限度
      compactTolerance: 0,
      //  barcode是否是superTree
      barcodeCategory: 'supertreeline', // 或者是single || super || supertreeline
      //  barcodeView的高度
      barcodeViewHeight: 0,

      //  treeline的高度
      treeLineHeight: 0,
      //  treeline包括gap的高度
      treeLineWholeHeight: 0,
      //  刷选放大到detail的barcode数组, 存放barcode的名称
      brushDetailedBarArray: [],
      //  将barcode转换成在一个屏幕中显示需要的widthRatio
      widthRatio: 0,
      //  在barcodeview的右侧增加dragbar的宽度
      dragRightMargin: 100,
      //  在superTree上面选中的节点
      selectionSubTreeArray: [],
      //  为了增加tooltip在superTree与barcode之间增加的距离
      tooltipGapHeight: 5,
      //  判断superTree是整个树还是由多个树组成的superTree
      superTreeMode: 'TheWholeTree', // 或者是TheWholeTree || TheSuperTree
      //  在barcodeMain视图以及superTree视图中是否将树压缩到一个屏幕的范围内
      expandCompressMode: 'ExpandMode', // compress
      //  收缩的barcode节点的数组
      collapsedChildrenArray: [],
      //  伸展的barcode节点的数组
      expandChildrenArray: [],
      //  选择的barcode节点的数组
      selectChildrenNodeLabelArray: [],
    },
    initialize: function () {
    },
    //  全局的变量都在variable.model中进行更新
    update_barcode_attr: function () {
      var self = this
      var selectItemNameArray = self.get('selectItemNameArray')
      var barcodeHeight = self.get('barcodeHeight')
      var compactNum = self.get('compactNum')
      var superTreeHeight = $('#supertree-scroll-panel').height()
      var barcodeViewHeight = $('#barcode-view').height() - superTreeHeight - selectItemNameArray.length
      var updatedHeight = new Number(barcodeViewHeight / selectItemNameArray.length).toFixed(1)
      window.barcodeHeight = updatedHeight > barcodeHeight ? barcodeHeight : updatedHeight
      // window.Datacenter.barcodeCollection.update_height()
      window.Datacenter.barcodeCollection.update_barcode_location()
    },
    initNodesColor: function () {
      var self = this
      var maxDepth = self.get('maxDepth') + 1
      var barcodeNodeColorArray = self.get('barcodeNodeColorArray')
      var RootColor = Config.get('BARCODE_COLOR')[ 'ROOT_COLOR' ]
      var LeafColor = Config.get('BARCODE_COLOR')[ 'LEAF_COLOR' ]
      var linear = d3.scale.linear()
        .domain([ 0, maxDepth ])
        .range([ 0, 1 ])
      var d3RootColor = d3.rgb(RootColor)
      var d3LeafColor = d3.rgb(LeafColor)
      var compute = d3.interpolate(d3RootColor, d3LeafColor)
      for (var lI = 0; lI < maxDepth; lI++) {
        barcodeNodeColorArray.push(compute(linear(lI)))
      }
    }
  }))()
  return window.Variables
});