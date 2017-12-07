/**
 * [description] control the data stream of this program, models only initialize once,
 *         and other part get the model from the datacenter
 * @param  {[type]} Variables                 [Needed data]
 * @param  {[type]} Config                    [????????]
 * @param  {[type]} BasicDataModel            [correspond the overview initialize data]
 * @param  {[type]} HistogramModel            [correspond the histogram view]
 * @param  {[type]} BarcodeModel              [correspond one line barcode view]
 * @param  {[type]} BarcodeCollection      [correspond several barcode view ]
 */
define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'variables',
  'config',
  'models/histogram.model',
  'models/arclink.model',
  'models/categoryName.model',
  'models/barcode.model',
  'models/supertree.model',
  'models/single.barcode.model',
  'collections/barcode.collection'
], function (require, Mn, _, Backbone, Variables, Config, HistogramModel, ArcLinkModel, CategoryModel, BarcodeModel, SuperTreeModel, SingleBarcode, BarcodeCollection) {
  'use strict'
  window.Datacenter = new (Backbone.Model.extend({
    defaults: {},
    initialize: function (url) {
      var self = this
      // self.arcLinkDataModel = new ArcLinkModel()
      self.histogramModel = new HistogramModel()
      self.categoryModel = new CategoryModel()
      self.barcodeCollection = new BarcodeCollection()
      self.supertreeModel = new SuperTreeModel()
      self.singleBarcodeModel = new SingleBarcode()
    },
    //  DataCenter在初始化之后向服务器端请求histogram的数据
    //  程序的默认状态, 由config中的变量控制
    start: function (viewWidth, viewHeight) {
      var self = this
      console.log('viewWidth:' + viewWidth + ",viewHeight:" + viewHeight)
      self.init_dataset_mode(viewWidth, viewHeight)
      var histogramModel = self.histogramModel
      // //  获取category dataset 当鼠标mouseover的时候得到barcode的名称
      // var categoryModel = self.categoryModel
      var barcodeCollection = self.barcodeCollection
      self.request_category_dataset()
      self.request_histogram_dataset()
      // histogramModel.request_histogram_dataset()
      barcodeCollection.request_barcode_dataset()
    },
    trigger_hide_loading_icon: function () {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')['HIDE_LOADING_ICON'])
    },
    init_dataset_mode: function (viewWidth, viewHeight) {
      //  1600的宽度, 892的屏幕高度 对应的是当前的barcode高度50和当前barcode宽度[ 18, 12, 8, 4, 0 ], 那么需要对于该设置参数按按照比例进行变化
      var defaultSettings = Config.get('DEFAULT_SETTINGS')
      var initHeight = defaultSettings.init_height
      var initWidth = defaultSettings.init_width
      var heightRatio = viewHeight / initHeight
      var widthRatio = viewWidth / initWidth
      var defaultDataSetName = defaultSettings.default_dataset
      var defaultBarcodeMode = defaultSettings.default_mode
      console.log('widthRatio', widthRatio)
      var defaultBarcodeWidthArray = defaultSettings.default_width_array
      console.log('defaultSettings.barcode_node_interval', defaultSettings.barcode_node_interval)
      var defaultBarcodeNodeInterval = widthRatio > 1 ? Math.round(defaultSettings.barcode_node_interval * widthRatio) : defaultSettings.barcode_node_interval
      for (var dI = 0; dI < defaultBarcodeWidthArray.length; dI++) {
        defaultBarcodeWidthArray[dI] = Math.round(defaultBarcodeWidthArray[dI] * widthRatio)
      }
      defaultSettings.original_width_array = JSON.parse(JSON.stringify(defaultBarcodeWidthArray))
      var defaultHeight = Math.round(defaultSettings.default_barcode_height * heightRatio)
      var defaultSelectedLevels = defaultSettings.default_selected_levels
      var compactNum = defaultSettings.compact_num
      Variables.set('barcodeMode', defaultBarcodeMode)
      Variables.set('currentDataSetName', defaultDataSetName)
      Variables.set('barcodeWidthArray', defaultBarcodeWidthArray)
      Variables.set('barcodeHeight', defaultHeight)
      Variables.set('selectedLevels', defaultSelectedLevels)
      Variables.set('compactNum', compactNum)
      Variables.set('barcodeNodeInterval', defaultBarcodeNodeInterval)
      //  初始化barcodeViewPaddingRight, 在不同的屏幕上的padding right是不同的
      //TODO
      window.barcodeMode = defaultBarcodeMode
      window.dataSetName = defaultDataSetName
      window.barcodeWidthArray = defaultBarcodeWidthArray
      window.barcodeHeight = defaultHeight
      window.selectedLevels = defaultSelectedLevels
      window.compactNum = compactNum
      window.barcodeNodeInterval = defaultBarcodeNodeInterval
    },
    /**
     * 将barcode的宽度控制在视图的范围内
     */
    transformBarcodeWidth2ViewWidth: function (categoryNodeObjArray) {
      var self = this
      var barcodetreeViewWidth = Variables.get('barcodetreeViewWidth')
      var barcodePaddingLeft = Variables.get('barcodePaddingLeft')
      var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
      var categoryPaddingRight = Config.get('TABLE_LENS_PARA')['category_padding_right']
      var barcodetreeWidth = barcodetreeViewWidth - barcodePaddingLeft - barcodeTextPaddingLeft - categoryPaddingRight
      var categoryBarcodeWidth = get_subtree_length(categoryNodeObjArray[0].id, categoryNodeObjArray).subtreeLength
      var changeRatio = barcodetreeWidth / categoryBarcodeWidth
      changeRatio = changeRatio > 1 ? 1 : changeRatio
      for (var cI = 0; cI < categoryNodeObjArray.length; cI++) {
        categoryNodeObjArray[cI].x = categoryNodeObjArray[cI].x * changeRatio
        categoryNodeObjArray[cI].width = categoryNodeObjArray[cI].width * changeRatio
      }
      //  计算得到子树的长度
      function get_subtree_length(subtreeRootId, categoryNodeObjArray) {
        var subtreeLength = 0
        var subtreeRootDepth = null
        var barcodeWidthArray = window.barcodeWidthArray
        var subtreeAttrArray = []
        var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
        var subtreeObj = {}
        for (var cI = 0; cI < categoryNodeObjArray.length; cI++) {
          if (categoryNodeObjArray[cI].depth === subtreeRootDepth) {
            subtreeObj.endIndex = cI - 1
            break
          }
          if (subtreeRootDepth != null) {
            if (barcodeWidthArray[categoryNodeObjArray[cI].depth] !== 0) {
              subtreeLength = subtreeLength + barcodeWidthArray[categoryNodeObjArray[cI].depth] + barcodeNodeInterval
            }
          }
          if (categoryNodeObjArray[cI].id === subtreeRootId) {
            subtreeRootDepth = categoryNodeObjArray[cI].depth
            subtreeObj.startIndex = cI
          }
          //  对于root节点, 可以一直读取到最终的节点位置上
          if (cI === categoryNodeObjArray.length) {
            subtreeObj.endIndex = cI
            break
          }
        }
        subtreeObj.subtreeLength = subtreeLength
        return subtreeObj
      }
    },
    /**
     * 将遍历得到的node数组转换为对象
     */
    transfromNodeArray2NodeObj: function (barcodeNodeArray) {
      var self = this
      var barcodeNodeObj = {}
      for (var bI = 0; bI < barcodeNodeArray.length; bI++) {
        var nodeCategory = barcodeNodeArray[bI].category
        barcodeNodeObj[nodeCategory] = barcodeNodeArray[bI]
      }
      return barcodeNodeObj
    },
    /**
     * 在dataCenter.model的start方法中调用, 主要用于初始化histogram.model
     */
    request_histogram_dataset: function () {
      var self = this
      var histogramModel = self.histogramModel
      var url = 'file_name'
      var formData = {
        'DataSetName': Variables.get('currentDataSetName')
      }
      var requestHistogramSuccessFunc = function (result) {
        result.fileInfo = histogramModel.sort_higtogram_array_accord_time(result.fileInfo)
        result.minValue = histogramModel.get_min_value(result.fileInfo)
        result.maxValue = histogramModel.get_max_value(result.fileInfo)
        //  TODO 这个地方会修改成按照文件里面的属性决定scale的类型
        result.scaleType = 'linear'//'log'
        //  y轴上的标注
        var hundredNum = +Math.ceil((+result.maxValue) / 100)
        var yTicksValueArray = []
        for (var hI = 1; hI < hundredNum; hI++) {
          yTicksValueArray.push(hI * 100)
        }
        result.yTicksValueArray = yTicksValueArray//[ 100, 1000, result.maxValue ]
        result.yTicksFormatArray = yTicksValueArray//[ '0.1k', '1k', '6k' ]
        //  x轴上的标注
        result.xTicksValueArray = [5, 36, 66, 98, 128, 159, 189, 220, 252, 283]
        result.xTicksFormatArray = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
        result.className = 'barcodetree-class'
        //  设置读取数据的相应属性, maxDepth - 树的最大深度, fileInfo - 树的基本信息
        histogramModel.set('histogramDataObject', result)
        Variables.set('maxDepth', result.maxDepth)
        //  在得到了barcode的最大深度之后, 需要初始化barcode不同层级节点的颜色
        window.Variables.initNodesColor()
        //  trigger 渲染histogram的信号, histogram-main视图中会渲染得到相应的结果
        histogramModel.trigger_render_signal()
      }
      self.requestDataFromServer(url, formData, requestHistogramSuccessFunc)
    },
    /**
     * 在dataCenter.model start方法中调用的方法, 主要用于初始化categoryName.Model中的数据
     * @param url
     */
    request_category_dataset: function (url) {
      var self = this
      var url = 'category_name'
      var formData = {
        'DataSetName': Variables.get('currentDataSetName')
      }
      var requestCategorySuccessFunc = function (result) {
        var categoryNameObj = self.categoryModel.get('categoryNameObj')
        var dataSetName = Variables.get('currentDataSetName')
        categoryNameObj[dataSetName] = result
      }
      self.requestDataFromServer(url, formData, requestCategorySuccessFunc)
    },
    /**
     * 获取每个树上的节点id的数组
     */
    requestBarcodeNodeIdArray: function (url, treeObjArray) {
      var self = this
      var formData = {
        'treeObjArray': treeObjArray
      }
      var originalDatasuccessFunc = function (result) {
        var barcodeTreeNodeIdArray = result.treeNodeIdArrayObj
        self.singleBarcodeModel.update_supertree_array(barcodeTreeNodeIdArray)
      }
      self.requestDataFromServer(url, formData, originalDatasuccessFunc)
    },
    /**
     * 根据上传的tree的对象计算节点数组
     */
    requestSuperTreeAndSuperBarcodeNodeArray: function (url, treeObjArray) {
      var self = this
      //  在BarcodeTree|NodelinkTree的模式下original width array和selected levels是最原始的状态
      var barcodeWidthArray = Config.get('DEFAULT_SETTINGS').original_width_array
      var originalSelectedLevels = []
      for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
        originalSelectedLevels.push(bI)
      }
      var rootId = 'root'
      var rootLevel = 0
      var alignedLevel = Variables.get('alignedLevel')
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var formData = {
        'treeObjArray': treeObjArray,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': originalSelectedLevels,
        'rootId': rootId,
        'rootLevel': rootLevel,
        'alignedLevel': alignedLevel
      }
      var originalDatasuccessFunc = function (result) {
        var barcodeTreeArray = result.treeNodeObject

        //  将treeNodeObject对象添加到single.barcode.model对象中
        //  treeNodeObject对象的内部属性为 {maxNodeNumTreeNodeLocArray: {}, superTreeNodeLocArray: {}}
        self.singleBarcodeModel.update_supertree_array(barcodeTreeArray)
      }
      self.requestDataFromServer(url, formData, originalDatasuccessFunc)
    },
    /**
     * 在histogram-main中调用这个方法, 主要用于获取BarcodeTree的节点数组, 包括节点上的属性
     * @param url
     * @param selectedItemsArray
     */
    requestDataCenter: function (url, selectedItemsArray, alignExistTree) {
      var self = this
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      var formData = {
        'dataItemNameArray': selectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeNodeInterval': barcodeNodeInterval,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'compactNum': window.compactNum,
        'maxDepth': Variables.get('maxDepth')
      }
      var originalDatasuccessFunc = function (result) {
        var treeNodeObject = result.treeNodeObject
        var compactTreeNodeArrayObj = result.compactTreeNodeArrayObj
        var selectItemNameArray = Variables.get('selectItemNameArray')
        var addedBarcodeModelArray = []
        //  将展示全部的barcode压缩到屏幕的范围内
        self.transformBarcodeWidth2ViewWidth(result.categoryNodeObjArray)
        //  按照每个barcode中存在的节点修改categoryTree节点的存在与否
        for (var item in treeNodeObject) {
          //  1. 对于全局的categoryNodeObj的处理
          var categoryNodeObjArray = JSON.parse(JSON.stringify(result.categoryNodeObjArray))
          var categoryNodeObj = self.transfromNodeArray2NodeObj(categoryNodeObjArray)
          var barcodeNodeAttrArray = treeNodeObject[item]
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            barcodeNodeAttrArray[bI].existed = true
            var nodeId = barcodeNodeAttrArray[bI].id
            var nodeNum = barcodeNodeAttrArray[bI].num
            if (typeof (categoryNodeObj[nodeId]) !== 'undefined') {
              categoryNodeObj[nodeId].existed = true
              categoryNodeObj[nodeId].num = nodeNum
            }
          }
          //  2. 对于普通模式下的barcodeNodeObj的处理
          var alignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(barcodeNodeAttrArray))
          var barcodeIndex = selectItemNameArray.indexOf(item)
          var barcodeNodeHeight = window.barcodeHeight
          //  传递两个相同的节点数组barcodeNodeAttrArray和alignedBarcodeNodeAttrArray是因为用户在交互过程中需要改变节点数组中的值,
          //  而原始的数组维护了一个原始的数值
          var barcodeBgColor = null
          var selectedItemColorObj = Variables.get('selectedItemColorObj')
          if (typeof (selectedItemColorObj) !== 'undefined') {
            if (typeof (selectedItemColorObj[item]) !== 'undefined') {
              barcodeBgColor = selectedItemColorObj[item]
            }
          }
          //  3. 对于compact模式下的barcode的处理
          var compactBarcodeNodeAttrArray = compactTreeNodeArrayObj[item]['compact-level-0']
          for (var bI = 0; bI < compactBarcodeNodeAttrArray.length; bI++) {
            compactBarcodeNodeAttrArray[bI].existed = true
          }
          var compactAlignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(compactBarcodeNodeAttrArray))
          self.barcodeCollection.remove_barcode_dataset(item, alignExistTree)
          // if (filteredModel.length === 0) {
          var barcodeModel = new BarcodeModel({
            'barcodeTreeId': item,
            'displayMode': Variables.get('displayMode'),
            'barcodeNodeAttrArray': barcodeNodeAttrArray,
            'categoryNodeObjArray': categoryNodeObjArray,
            'alignedBarcodeNodeAttrArray': alignedBarcodeNodeAttrArray,
            'compactBarcodeNodeAttrArray': compactBarcodeNodeAttrArray,
            'compactAlignedBarcodeNodeAttrArray': compactAlignedBarcodeNodeAttrArray,
            'barcodeNodeHeight': barcodeNodeHeight,
            'barcodeIndex': barcodeIndex,
            'originalBarcodeIndex': barcodeIndex,
            'barcodeRectBgColor': barcodeBgColor,
            'sumAttributeValue': barcodeNodeAttrArray[0].num
          })
          addedBarcodeModelArray.push(barcodeModel)
          // } else {
          //   filteredModel[0].set('barcodeNodeAttrArray', barcodeNodeAttrArray)
          //   filteredModel[0].set('alignedBarcodeNodeAttrArray', alignedBarcodeNodeAttrArray)
          //   filteredModel[0].set('compactBarcodeNodeAttrArray', compactBarcodeNodeAttrArray)
          //   filteredModel[0].set('compactAlignedBarcodeNodeAttrArray', compactAlignedBarcodeNodeAttrArray)
          //   filteredModel[0].reset_node_obj_array()
          // }
        }
        // Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
        window.get_barcode_time_datacenter303 = new Date()
        var loadOriginalDataTime = window.get_barcode_time_datacenter303.getDifference(window.request_barcode_time_histogram435)
        console.log('window.get_barcode_time_datacenter303', loadOriginalDataTime)
        self.barcodeCollection.set_category_nodeobj_array(categoryNodeObjArray)
        self.barcodeCollection.add_barcode_dataset(addedBarcodeModelArray)
        // window.Variables.update_barcode_attr()
        // self.barcodeCollection.trigger_barcode_view_render_update()
        // self.barcodeCollection.update_barcode_height()
        // self.barcodeCollection.align_added_model()
        self.trigger_hide_loading_icon()
      }
      self.requestDataFromServer(url, formData, originalDatasuccessFunc)
    },
    /**
     *  在histogram-main中调用这个方法, 获取compact形式的BarcodeTree节点数组
     */
    requestCompactData: function (url, selectedItemsArray) {
      var self = this
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      var formData = {
        'dataItemNameArray': selectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'compactNum': window.compactNum,
        'maxDepth': Variables.get('maxDepth'),
        'barcodeNodeInterval': barcodeNodeInterval
      }
      var originalDatasuccessFunc = function (result) {
        var treeNodeObject = result.treeNodeObject
        var selectItemNameArray = Variables.get('selectItemNameArray')
        var addedCompactBarcodeModelArray = []
        var categoryNodeArray = result.categoryNodeArray
        for (var item in treeNodeObject) {
          var compactBarcodeNodeAttrArray = treeNodeObject[item]['compact-level-0']
          for (var bI = 0; bI < compactBarcodeNodeAttrArray.length; bI++) {
            compactBarcodeNodeAttrArray[bI].existed = true
          }
          var compactAlignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(compactBarcodeNodeAttrArray))
          var barcodeIndex = selectItemNameArray.indexOf(item)
          var barcodeNodeHeight = window.barcodeHeight
          //  传递两个相同的节点数组barcodeNodeAttrArray和alignedBarcodeNodeAttrArray是因为用户在交互过程中需要改变节点数组中的值,
          //  而原始的数组维护了一个原始的数值
          var filteredModel = self.barcodeCollection.where({barcodeTreeId: item})
          if (typeof (filteredModel) !== 'undefined') {
            var barcodeModel = new BarcodeModel({
              'barcodeTreeId': item,
              'displayMode': Variables.get('displayMode'),
              'compactBarcodeNodeAttrArray': compactBarcodeNodeAttrArray,
              'compactAlignedBarcodeNodeAttrArray': compactAlignedBarcodeNodeAttrArray,
              'barcodeNodeHeight': barcodeNodeHeight,
              'barcodeIndex': barcodeIndex,
              'originalBarcodeIndex': barcodeIndex,
              'sumAttributeValue': compactBarcodeNodeAttrArray[0].num
            })
            addedCompactBarcodeModelArray.push(barcodeModel)
          } else {
            filteredModel.set('compactBarcodeNodeAttrArray', compactBarcodeNodeAttrArray)
            filteredModel.set('compactAlignedBarcodeNodeAttrArray', compactAlignedBarcodeNodeAttrArray)
          }
        }
        self.barcodeCollection.add_barcode_dataset(addedCompactBarcodeModelArray)
        // self.barcodeCollection.update_barcode_height()
        // self.barcodeCollection.align_added_model()
        self.trigger_hide_loading_icon()
      }
      self.requestDataFromServer(url, formData, originalDatasuccessFunc)
    },
    /**
     * @param url
     * @param selectedItemsArray
     */
    updateDateCenter: function (url, selectedItemsArray) {
      var self = this
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      var formData = {
        'dataItemNameArray': selectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'barcodeNodeInterval': barcodeNodeInterval
      }
      var originalDatasuccessUpdateFunc = function (result) {
        var treeNodeObject = result.treeNodeObject
        var selectItemNameArray = Variables.get('selectItemNameArray')
        for (var item in treeNodeObject) {
          var barcodeNodeAttrArray = treeNodeObject[item]
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            barcodeNodeAttrArray[bI].existed = true
          }
          var alignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(barcodeNodeAttrArray))
          var filteredModel = self.barcodeCollection.where({barcodeTreeId: item})
          if (filteredModel.length !== 0) {
            var barcodeModel = filteredModel[0]
            barcodeModel.set('barcodeNodeAttrArray', barcodeNodeAttrArray)
            barcodeModel.set('alignedBarcodeNodeAttrArray', alignedBarcodeNodeAttrArray)
          }
        }
        // Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW' ])
        // self.barcodeCollection.add_all_super_subtree()
        self.barcodeCollection.align_multi_subtree()
      }
      self.requestDataFromServer(url, formData, originalDatasuccessUpdateFunc)
    },
    /**
     * removeSuperTree方法就是将superTree对象替换成未对齐的对象
     * @param rootId
     * @param rootLevel
     * @param rootCategory
     * @param deferObj
     * @param alignedLevel
     */
    removeSuperTree: function (rootId, rootLevel, rootCategory, deferObj, alignedLevel) {
      var self = this
      var url = 'remove_super_tree'
      var selectedItemsArray = Variables.get('selectItemNameArray')
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      var compactNum = window.compactNum
      var formData = {
        'dataItemNameArray': selectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'barcodeNodeInterval': barcodeNodeInterval,
        'rootId': rootId,
        'rootLevel': rootLevel,
        'alignedLevel': alignedLevel,
        'compactNum': compactNum,
        'maxDepth': Variables.get('maxDepth')
      }
      var buildSuperTreeSuccessFunc = function (result) {
        /**
         * 计算得到替换的节点数组
         * superTreeNodeLocArray - 计算当前的树中的某一部分子树的superTree
         * maxNodeNumTreeNodeLocArray - 根据当前的alignedlevel, 计算得到当前选中的树中某一部分子树的具有最大的节点数量部分的合并
         */
        if (typeof (result.treeNodeObject) === 'undefined') {
          deferObj.resolve()
        }
        var supertreeNodeObj = JSON.parse(JSON.stringify(result.treeNodeObject))
        var compactSuperTreeNodeLocObj = JSON.parse(JSON.stringify(result.compactTreeNodeArrayObj))
        console.log('supertreeNodeObj', supertreeNodeObj)
        console.log('compactSuperTreeNodeLocObj', compactSuperTreeNodeLocObj)
        //
        self.barcodeCollection.remove_barcode_subtree(rootId, rootCategory, rootLevel, supertreeNodeObj, compactSuperTreeNodeLocObj)
        deferObj.resolve()
      }
      self.requestDataFromServer(url, formData, buildSuperTreeSuccessFunc)
    },
    /**
     * 在barcode.single.view中被调用, 主要是在选定根节点之后构建superTree
     * @param url
     * @param selectedItemsArray
     * @param rootId
     * @param rootLevel
     * @param rootCategory
     * @param maxX
     */
    buildSuperTree: function (rootId, rootLevel, rootCategory, deferObj, alignedLevel) {
      var self = this
      var url = 'build_super_tree'
      var selectedItemsArray = Variables.get('selectItemNameArray')
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      var compactNum = window.compactNum
      var formData = {
        'dataItemNameArray': selectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'barcodeNodeInterval': barcodeNodeInterval,
        'rootId': rootId,
        'rootLevel': rootLevel,
        'alignedLevel': alignedLevel,
        'compactNum': compactNum
      }
      var buildSuperTreeSuccessFunc = function (result) {
        /**
         * 计算得到替换的节点数组
         * superTreeNodeLocArray - 计算当前的树中的某一部分子树的superTree
         * maxNodeNumTreeNodeLocArray - 根据当前的alignedlevel, 计算得到当前选中的树中某一部分子树的具有最大的节点数量部分的合并
         */
        if (typeof (result.treeNodeObject.originalSuperTreeObj) === 'undefined') {
          deferObj.resolve()
        }
        var superTreeNodeArray = result.treeNodeObject.originalSuperTreeObj.superTreeNodeLocArray
        var maxNodeNumTreeNodeLocArray = result.treeNodeObject.originalSuperTreeObj.maxNodeNumTreeNodeLocArray
        var compactSuperTreeNodeLocArray = result.treeNodeObject.compactSuperTreeObj.compactSuperTreeNodeLocArray
        var compactMaxNodeNumTreeNodeLocArray = result.treeNodeObject.compactSuperTreeObj.compactMaxNodeNumTreeNodeLocArray
        /**
         * 新增加的barcode-node中的existed属性都设置为false, 需要根据对齐的层级将existed属性重新设置为true
         */
        for (var tI = 0; tI < superTreeNodeArray.length; tI++) {
          superTreeNodeArray[tI].existed = false
        }
        for (var tI = 0; tI < compactSuperTreeNodeLocArray.length; tI++) {
          compactSuperTreeNodeLocArray[tI].existed = false
        }
        self.barcodeCollection.update_barcode_subtree(rootId, rootCategory, rootLevel, superTreeNodeArray, maxNodeNumTreeNodeLocArray, compactSuperTreeNodeLocArray, compactMaxNodeNumTreeNodeLocArray)
        deferObj.resolve()
      }
      self.requestDataFromServer(url, formData, buildSuperTreeSuccessFunc)
    },
    /**
     * 与服务器端通信的方法, 在dataCenter.model中被调用
     * @param Url
     * @param formData
     * @param originalDatasuccessFunc
     */
    requestDataFromServer: function (Url, formData, originalDatasuccessFunc) {
      var self = this
      var barcodeTreeId = formData.dataItemName
      var finishInitEvent = 'finish-read-' + barcodeTreeId
      $.ajax({
        url: Url,
        type: 'POST',
        datatype: 'json',
        data: formData,
        crossDomain: true,
        success: function (result) {
          originalDatasuccessFunc(result)
        },
        error: function (result) {
          console.log('error', result) // Optional
        }
      })
    }
  }))()
  return window.Datacenter
})