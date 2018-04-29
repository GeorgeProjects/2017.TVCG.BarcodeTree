define([
  'require',
  'marionette',
  'underscore',
  'backbone'
], function (require, Mn, _, Backbone) {
  'use strict'

  window.Variables = new (Backbone.Model.extend({
    defaults: {
      BARCODETREE_GLOBAL_PARAS: {
        Selection_State: 'NULL', //'SUBTREE', 'NODE', 'NULL'(NULL表示当前处于不高亮节点的状态, 但是选择之后仍然高亮整个subtree)
        Subtree_Compact: false, //subbarcodeTree是否是comapct的展示模式
        Align_State: false, //subbarcodeTree是否是comapct的展示模式
        Comparison_Result_Display: false, //  展示barcodeTree的比较结果
        Max_Real_Level: 3,
        Align_Lock: false,
        Sort_Option: 'DATE',//'DATE', 'DAY', 'ATTRIBUTE', 'NODENUMBER', 'SIMILARITY'
        Comparison_Mode: 'TOPOLOGY', //'TOPOLOGY' 'ATTRIBUTE'
        Node_Arrangement: false,
        Horizontal_Fit_In_Screen: false
      },
      BARCODE_COLOR: {
        ROOT_COLOR: '#000000',
        LEAF_COLOR: '#DCDCDC',
        ADD_NODE_COLOR: '#a1d76a',
        MISS_NODE_COLOR: '#e9a3c9',
        SAME_NODE_COLOR: 'black'
      },
      //  允许的最小的icon size的大小, iconsize也要随着屏幕的大小的变化相应的变化
      minIconSize: 20,
      //  是否使用padding显示不存在的节点
      is_show_padding_node: false,
      //  是否对于节点进行高亮的选项
      highlight_node: false,
      //  只是高亮节点的选项
      only_highlight_node: false,  // 对立面是取消高亮其他的节点
      //  判断当前是否显示father与child之间的链接
      show_father_child_link: true,
      //  判断当前是否处于enable lasso的状态
      enable_lasso: false,
      //  missed node class
      missed_node_class: 'missed-node-highlight',
      //  general_missed_node_class
      general_missed_node_class: 'node-missed',
      //  当前的barcode是否经过了mouseover
      mouseover_state: true,
      //  barcode的高度与barcode的container的占比, barcodeHeight传递到服务器端需要增加一定的比例, 因为barcode的节点的上部分与下部分都是存在一定的间隙
      barcodeHeightRatio: 0.8,
      //  barcode的柱状图的高度占比
      barcodeHistogramRatio: 0.6,
      //  刷选高亮的节点对象数组
      brushHighlightObjArray: new Array(),
      //  barcodeTree中节点的最小值
      MIN_HEIGHT: 0,
      //  power的参数
      POW_EXPONENT: 0.4,
      //  标记barcode的高度
      barcodeHeight: 40,
      //  标记barcode的最大高度
      barcodeNodeHeightMinValue: 10,
      //  标记barcode的最小高度
      barcodeNodeHeightMaxValue: 100,
      //  =======================================================
      //  当前的barcode比较视图的宽度
      barcodetreeViewWidth: 0,
      //  当前的barcode比较视图的高度
      barcodetreeViewHeight: 0,
      //  barcode的最大的宽度
      barcodeNodexMaxX: 0,
      //  barcode的最大的高度
      barcodeNodeyMaxY: 0,
      //  barcode视图的margin
      comparisonViewMargin: {left: 30, right: 50},
      //  对齐的节点
      alignedLevel: 0,
      //  标记不同的barcode背景颜色的对象
      selectedItemColorObj: {},
      //  默认的barcode的颜色
      defaultBarcodeColor: 'rgb(128, 128, 128)',
      //  barcode的比较模式
      TOPOLOGICAL: 'TOPOLOGICAL',
      ATTRIBUTE: 'ATTRIBUTE',
      //  当前刷选部分的barcode的范围的节点属性值分布对象
      brushBarcodeNodeCollectionObj: {},
      //  当前刷选部分的barcode的范围的节点属性值分布对象
      brushBarcodeNodeCollectionObjWithId: {},
      //  当前对齐的barcode的范围的节点属性值分布对象
      barcodeNodeCollectionObj: {},
      //  带有节点的id的节点属性值分布对象
      barcodeNodeCollectionObjWithId: {},
      //  tooltip的宽度, 在tooltip的边界超过视图的边界, 那么就会移动tooltip的位置
      tipWidth: 220,
      //  supertree的状态, false表示关闭, true表示打开
      superTreeViewState: false,
      //*************************
      //  treeconfigView视图中的参数
      current_config_barcodeTreeId: null,
      //*************************
      //  在superTreeView视图中的参数
      //  barcode的上方padding的距离
      supertreeView_barcodePaddingLeft: 40,
      //*************************
      //  在barcode.single.view视图中的参数
      SingleView_renderBarcodeNodeWidthThredhold: 1,
      //  判断显示的barcode是否同步变化的参数
      barcodeTreeIsLocked: true,
      //  display布局的方法
      displayMode: 'ORIGINAL',//或者 COMPACT ORIGINAL GLOBAL
      //  当前hover的节点
      currentHoveringBarcodeId: null,
      //  标记编辑节点的颜色
      edit_icon_color: 'white',
      //  标记选择节点的颜色
      select_icon_color: 'black',
      //  用于计算barcode collection视图的高度
      barcodeViewPaddingBottom: 5,
      //  barcodeTree在Original模式下的最小的高度
      minimumRatio: 0.6,
      //****************************************************
      //  在barcode.collection.view视图中的参数
      // barcodeViewPaddingRight: 20,
      //  最大的subtree的sawtooth的宽度
      globalCompressPaddingNodeWidth: null, // 初始值是null
      //****************************************************
      //  top.toolbar.view视图中的参数
      alignedBarcodeLevel: 0,
      similarityRange: [0, 0],
      //  新增的barcode group的数量
      addedGroupNum: 0,
      //  表示当前是否处于选择barcode的状态
      selectionState: false,
      //  选择的集合操作的barcode的数组
      selectionBarcodeObject: {},
      //  当前是否处于选择状态, dropdown的视图的对应操作是不同的, 当closable为true时, 表示点击可以关闭, false表示点击无法关闭
      closable: true,
      //  当前处于的选择状态, 选择节点还是选择一个子树
      nodeSubtreeSelectionState: 'NODE',
      //****************************************************
      //  柱状图中的颜色
      selectionColor: null,
      histogramHeightRem: 14,
      //****************************************************
      //  BarcodeTree的设置参数
      //  1. 当前渲染的barcode数据集
      currentDataSetName: 'DailyRecordTree', //'DailyRecordTree', 'NBATeamTree', 'LibraryRecordTree'
      //  2. barcode当前的显示模式
      barcodeMode: 'original', //'DailyRecordTree', 'NBATeamTree', 'LibraryRecordTree'
      //  3. 每一列barcode压缩的数量
      compactNum: 5,
      //  4. barcode的节点之间的间距
      barcodeNodeInterval: 3,
      //  4.1. 改变之间的状态的属性: barcode的节点之间的间距
      barcodeNodeInterval_previous: 3,
      //  4.2. barcode节点间距的最小值
      barcodeNodeIntervalMinValue: 3,
      //  4.3. barcode节点间距的最大值
      barcodeNodeIntervalMaxValue: 10,
      //  5. 标记各层的bar的宽度
      barcodeWidthArray: [18, 12, 8, 4, 0],
      //  5.1. 最大的barcode的宽度
      maxBarcodeWidth: 18,
      //  5.2. 最小的barcode的宽度
      minBarcodeWidth: 2,
      //  5.3. barcode节点的最小宽度
      barcodeNodeWidthMinValue: 2,
      //  5.4. barcode节点的最大宽度
      barcodeNodeWidthMaxValue: 40,
      //  5.5. 改变之间的状态的属性: 各层的bar的宽度
      barcodeWidthArray_previous: [18, 12, 8, 4, 0],
      //  6. 当前显示的节点的层次数组, 出现在这个数组的层级的节点会显示
      selectedLevels: [0, 1, 2, 3],
      //  7. barcode视图中最大的sawtooth的长度
      maxBarcodePaddingNodeWidth: 300,
      //  8. barcode的前的label距离barcode左边界的宽度
      barcodeTextPaddingLeft: 15,
      //  9. barcode的边界宽度
      barcodePaddingLeft: 45,
      //  10. comparison result的宽度
      comparisonResultPadding: 80,
      //  11. 默认情况下的视图宽度
      init_width: 1600,
      //  12. 默认情况下的视图高度
      init_height: 900,
      //****************************************************
      'finishInit': false,
      //  whether loading page show
      'loading': true,
      //在histogram上选中的item的数组
      'selectItemNameArray': [],
      //  集合操作得到的barcode的列表
      'setOperationArray': [],
      //  width同步进行变化状态
      'changeMeanTime': true,
      //  在fish eye模式下不同的barcode类型的高度的数量
      'differentHeightNumber': 20,
      //  最小的barcode的高度
      'minBarcodeHeight': 2,
      //  histogram和barcode都需要的变量
      //  给virtual的结点的description的标签
      'virtualNodeDescription': 'virtual',
      //  存储最后一个被选中的bar对应的数据在文件数组中的index，即时间维的index
      'lastSelectBarIndex': 2,
      //  displayed Last Level
      'displayedLastLevel': 3,
      //  supertree的高度
      'superTreeHeight': 50,
      //  barcodetree config视图的高度
      'barcodeTreeConfigHeight': 33,
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
      barHeight: 40,
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
      'layoutMode': 'ORIGINAL', //UNION || ORIGINAL
      //  barcode的margin对象
      barcodeMargin: {top: 0, left: 1 / 25, bottom: 1 / 90, right: 0},
      //  datelinechart的margin对象
      dateLineChartMargin: {top: 0, left: 1 / 20, bottom: 1 / 90, right: 1 / 10},
      //  subtreelinechart的margin对象
      subtreeLineChartMargin: {top: 1 / 70, left: 1 / 25, bottom: 1 / 70, right: 1 / 50},
      //  histogram的margin对象
      histogramMargin: {top: 1 / 10, left: 1 / 20, bottom: 1 / 6, right: 1 / 60},
      //  当前渲染的数据集名称
      currentDataSet: null,
      //  barcode的宽度数组
      barcodeWidthObject: {},
      //  barcode的高度
      maxBarcodeHeight: 0,
      //  渲染的树的最大深度
      maxDepth: 3,
      //  当前实现的树的最大的个数
      fileMaxDepth: null,
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
      var setOperationArray = self.get('setOperationArray')
      var barcodeHeight = self.get('barcodeHeight')
      var compactNum = self.get('compactNum')
      var superTreeHeight = +$('#supertree-scroll-panel').height()
      var barcodeTreeConfigHeight = +$('#top-toolbar-container').height()//self.get('barcodeTreeConfigHeight')
      var barcodeViewPaddingBottom = self.get('barcodeViewPaddingBottom')
      var barcodeViewHeight = (+$('#barcode-view').height()) - superTreeHeight - barcodeTreeConfigHeight - barcodeViewPaddingBottom
      var updatedHeight = barcodeViewHeight / (selectItemNameArray.length + setOperationArray.length)
      var minimumRatio = Variables.get('minimumRatio')
      //  根据当前barcode的不同的模式变换barcode的高度
      if (Variables.get('layoutMode') === 'ORIGINAL') {
        //  当前的barcode是original的模式, 按照原始的barcode的高度进行绘制
        if (updatedHeight < barcodeHeight * minimumRatio) {
          // 如果增加了barcode之后, 更新的barcode高度小于barcode高度的一半, 那么仍然按照原始barcode高度的一半进行设置
          window.barcodeHeight = barcodeHeight * minimumRatio
        } else {
          // 如果增加了barcode之后, 更新的barcode高度没有那么小, 那就就按照更新的barcode高度进行计算
          //  当然barcode的高度也不能过于大, 最大的高度即为默认的barcode的高度 barcodeHeight
          window.barcodeHeight = updatedHeight > barcodeHeight ? barcodeHeight : updatedHeight.toFixed(2)
        }
        if (updatedHeight < barcodeHeight) {//  理论计算小于实际的barcode的高度, 那么应该是存在scrollBar
          $('#barcodetree-scrollpanel').css({'overflow-y': 'auto'})
        } else {
          $('#barcodetree-scrollpanel').css({'overflow-y': 'hidden'})
        }
      } else {
        //  当前的barcode是非original的模式
        window.barcodeHeight = updatedHeight > barcodeHeight ? barcodeHeight : updatedHeight.toFixed(2)
      }
      self.change_barcode_node_config(window.barcodeHeight)
      // window.Datacenter.barcodeCollection.update_height()
      // window.Datacenter.barcodeCollection.update_barcode_location()
    },
    change_barcode_node_config: function (barcodeHeight) {
      var self = this
      $("#range-input-height").val(barcodeHeight)
    },
    //  更新barcodeTree中的选中的层级以及选中层级的对应宽度
    update_max_depth: function (max_depth) {
      var self = this
      // 更新barcode选定的层级以及层级的宽度, 默认的情况下显示4层的barcodeTree
      self.set('fileMaxDepth', max_depth)
      //  根据更新的层次结构数据的层级更新选中的层级
      self.init_selected_levels()
      //  计算barcodeTree每一个层级的宽度
      self.update_selected_levels_width()
      //  在得到了barcode的最大深度之后, 需要初始化barcode不同层级节点的颜色
      self.init_nodes_color()
    },
    // 根据更新的层次结构数据的层级更新选中的层级(默认情况下选中的层级为所有的层级)
    init_selected_levels: function () {
      var self = this
      var max_depth = self.get('maxDepth')
      var selectedLevels = []
      for (var level = 0; level <= max_depth; level++) {
        selectedLevels.push(level)
      }
      window.selectedLevels = selectedLevels
      self.set('selectedLevels', selectedLevels)
    },
    //  更新barcode选定的层级以及层级的宽度, 目前的做法是只显示barcodeTree的前四层,逐层向下地进行探索
    update_selected_levels_width: function () {
      var self = this
      var max_depth = self.get('maxDepth')
      var barcodeWidthArray = []
      for (var level = 0; level <= max_depth; level++) {
        //  将所有的层级添加到selectedLevel数组中
        var width = self.uniform_width_for_each_level(level, max_depth)
        barcodeWidthArray.push(width)
      }
      //  更新barcode的宽度,以及选定的barcode的层级
      window.barcodeWidthArray = barcodeWidthArray
      self.set('barcodeWidthArray', barcodeWidthArray)
    },
    //  采用平均的方法计算barcode的节点的宽度
    uniform_width_for_each_level: function (level, max_depth) {
      var self = this
      var maxBarcodeWidth = self.get('maxBarcodeWidth')
      var minBarcodeWidth = self.get('minBarcodeWidth')
      var barcodeLevelPerWidth = Math.round(maxBarcodeWidth / max_depth)
      if (level === max_depth) {
        return minBarcodeWidth
      }
      return (max_depth - level) * barcodeLevelPerWidth
    },
    //  初始化节点的颜色
    init_nodes_color: function () {
      var self = this
      var maxDepth = self.get('maxDepth') + 1
      var barcodeNodeColorArray = self.get('barcodeNodeColorArray')
      var RootColor = self.get('BARCODE_COLOR')['ROOT_COLOR']
      var LeafColor = self.get('BARCODE_COLOR')['LEAF_COLOR']
      var linear = d3.scale.linear()
        .domain([0, maxDepth])
        .range([0, 1])
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