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
    start: function () {
      var self = this
      self.init_dataset_mode()
      var histogramModel = self.histogramModel
      // //  获取category dataset 当鼠标mouseover的时候得到barcode的名称
      // var categoryModel = self.categoryModel
      var barcodeCollection = self.barcodeCollection
      self.request_category_dataset()
      self.request_histogram_dataset()
      // histogramModel.request_histogram_dataset()
      barcodeCollection.request_barcode_dataset()
    },
    init_dataset_mode: function () {
      var defaultSettings = Config.get('DEFAULT_SETTINGS')
      var defaultDataSetName = defaultSettings.default_dataset
      var defaultBarcodeMode = defaultSettings.default_mode
      var defaultBarcodeWidthArray = defaultSettings.default_width_array
      var defaultHeight = defaultSettings.default_barcode_height
      var defaultSelectedLevels = defaultSettings.default_selected_levels
      var compactNum = defaultSettings.compact_num
      Variables.set('barcodeMode', defaultBarcodeMode)
      Variables.set('currentDataSetName', defaultDataSetName)
      Variables.set('barcodeWidthArray', defaultBarcodeWidthArray)
      Variables.set('barcodeHeight', defaultHeight)
      Variables.set('selectedLevels', defaultSelectedLevels)
      Variables.set('compactNum', compactNum)
      window.barcodeMode = defaultBarcodeMode
      window.dataSetName = defaultDataSetName
      window.barcodeWidthArray = defaultBarcodeWidthArray
      window.barcodeHeight = defaultHeight
      window.selectedLevels = defaultSelectedLevels
      window.compactNum = compactNum
    },
    /**
     * 将barcode的宽度控制在视图的范围内
     */
    transformBarcodeWidth2ViewWidth: function (categoryNodeObjArray) {
      var self = this
      var barcodetreeViewWidth = Variables.get('barcodetreeViewWidth')
      console.log('barcodetreeViewWidth', barcodetreeViewWidth)
      var categoryBarcodeWidth = categoryNodeObjArray[ categoryNodeObjArray.length - 1 ].x + categoryNodeObjArray[ categoryNodeObjArray.length - 1 ].width
      var changeRatio = barcodetreeViewWidth / categoryBarcodeWidth
      changeRatio = changeRatio > 1 ? 1 : changeRatio
      for (var cI = 0; cI < categoryNodeObjArray.length; cI++) {
        categoryNodeObjArray[ cI ].x = categoryNodeObjArray[ cI ].x * changeRatio
        categoryNodeObjArray[ cI ].width = categoryNodeObjArray[ cI ].width * changeRatio
      }
    },
    /**
     * 将遍历得到的node数组转换为对象
     */
    transfromNodeArray2NodeObj: function (barcodeNodeArray) {
      var self = this
      var barcodeNodeObj = {}
      for (var bI = 0; bI < barcodeNodeArray.length; bI++) {
        var nodeCategory = barcodeNodeArray[ bI ].nodeCategory
        barcodeNodeObj[ nodeCategory ] = barcodeNodeArray[ bI ]
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
        result.xTicksValueArray = [ 5, 36, 66, 98, 128, 159, 189, 220, 252, 283 ]
        result.xTicksFormatArray = [ 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec' ]
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
        categoryNameObj[ dataSetName ] = result
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
        'barcodeWidthArray': barcodeWidthArray,
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
    requestDataCenter: function (url, selectedItemsArray) {
      var self = this
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var formData = {
        'dataItemNameArray': selectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'compactNum': window.compactNum,
        'maxDepth': Variables.get('maxDepth')
      }
      var originalDatasuccessFunc = function (result) {
        var treeNodeObject = result.treeNodeObject
        var selectItemNameArray = Variables.get('selectItemNameArray')
        var addedBarcodeModelArray = []
        //  将展示全部的barcode压缩到屏幕的范围内
        self.transformBarcodeWidth2ViewWidth(result.categoryNodeObjArray)
        for (var item in treeNodeObject) {
          var categoryNodeObjArray = JSON.parse(JSON.stringify(result.categoryNodeObjArray))
          var categoryNodeObj = self.transfromNodeArray2NodeObj(categoryNodeObjArray)
          var barcodeNodeAttrArray = treeNodeObject[ item ]
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            barcodeNodeAttrArray[ bI ].existed = true
            var nodeId = barcodeNodeAttrArray[ bI ].id
            if (typeof (categoryNodeObj[ nodeId ]) !== 'undefined') {
              categoryNodeObj[ nodeId ].existed = true
            }
          }
          var alignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(barcodeNodeAttrArray))
          var barcodeIndex = selectItemNameArray.indexOf(item)
          var barcodeNodeHeight = window.barcodeHeight
          //  传递两个相同的节点数组barcodeNodeAttrArray和alignedBarcodeNodeAttrArray是因为用户在交互过程中需要改变节点数组中的值,
          //  而原始的数组维护了一个原始的数值
          var filteredModel = self.barcodeCollection.where({ barcodeTreeId: item })
          var barcodeBgColor = null
          var selectedItemColorObj = Variables.get('selectedItemColorObj')
          if (typeof (selectedItemColorObj) !== 'undefined') {
            if (typeof (selectedItemColorObj[ item ]) !== 'undefined') {
              barcodeBgColor = selectedItemColorObj[ item ]
            }
          }
          var sumAttributeValue = 0
          if (filteredModel.length === 0) {
            var barcodeModel = new BarcodeModel({
              'barcodeTreeId': item,
              'barcodeNodeAttrArray': barcodeNodeAttrArray,
              'categoryNodeObjArray': categoryNodeObjArray,
              'alignedBarcodeNodeAttrArray': alignedBarcodeNodeAttrArray,
              'barcodeNodeHeight': barcodeNodeHeight,
              'barcodeIndex': barcodeIndex,
              'originalBarcodeIndex': barcodeIndex,
              'barcodeRectBgColor': barcodeBgColor,
              'sumAttributeValue': barcodeNodeAttrArray[ 0 ].num
            })
            addedBarcodeModelArray.push(barcodeModel)
          } else {
            filteredModel[ 0 ].set('barcodeNodeAttrArray', barcodeNodeAttrArray)
            filteredModel[ 0 ].set('alignedBarcodeNodeAttrArray', alignedBarcodeNodeAttrArray)
          }
        }
        Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW' ])
        self.barcodeCollection.add_barcode_dataset(addedBarcodeModelArray)
        // self.barcodeCollection.trigger_barcode_view_render_update()
        // self.barcodeCollection.update_barcode_height()
        // self.barcodeCollection.align_added_model()
        Backbone.Events.trigger(Config.get('EVENTS')[ 'HIDE_LOADING_ICON' ])
      }
      self.requestDataFromServer(url, formData, originalDatasuccessFunc)
    },
    /**
     *  在histogram-main中调用这个方法, 获取compact形式的BarcodeTree节点数组
     */
    requestCompactData: function (url, selectedItemsArray) {
      var self = this
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var formData = {
        'dataItemNameArray': selectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'compactNum': window.compactNum,
        'maxDepth': Variables.get('maxDepth')
      }
      var originalDatasuccessFunc = function (result) {
        var treeNodeObject = result.treeNodeObject
        var selectItemNameArray = Variables.get('selectItemNameArray')
        var addedCompactBarcodeModelArray = []
        var categoryNodeArray = result.categoryNodeArray
        console.log('categoryNodeArray', categoryNodeArray)
        for (var item in treeNodeObject) {
          var compactBarcodeNodeAttrArray = treeNodeObject[ item ][ 'compact-level-0' ]
          for (var bI = 0; bI < compactBarcodeNodeAttrArray.length; bI++) {
            compactBarcodeNodeAttrArray[ bI ].existed = true
          }
          var compactAlignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(compactBarcodeNodeAttrArray))
          var barcodeIndex = selectItemNameArray.indexOf(item)
          var barcodeNodeHeight = window.barcodeHeight
          //  传递两个相同的节点数组barcodeNodeAttrArray和alignedBarcodeNodeAttrArray是因为用户在交互过程中需要改变节点数组中的值,
          //  而原始的数组维护了一个原始的数值
          var filteredModel = self.barcodeCollection.where({ barcodeTreeId: item })
          console.log('compactBarcodeNodeAttrArray[ 0 ].num', compactBarcodeNodeAttrArray[ 0 ].num)
          if (typeof (filteredModel) !== 'undefined') {
            var barcodeModel = new BarcodeModel({
              'barcodeTreeId': item,
              'compactBarcodeNodeAttrArray': compactBarcodeNodeAttrArray,
              'compactAlignedBarcodeNodeAttrArray': compactAlignedBarcodeNodeAttrArray,
              'barcodeNodeHeight': barcodeNodeHeight,
              'barcodeIndex': barcodeIndex,
              'originalBarcodeIndex': barcodeIndex,
              'sumAttributeValue': compactBarcodeNodeAttrArray[ 0 ].num
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
        Backbone.Events.trigger(Config.get('EVENTS')[ 'HIDE_LOADING_ICON' ])
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
      var formData = {
        'dataItemNameArray': selectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels
      }
      var originalDatasuccessUpdateFunc = function (result) {
        var treeNodeObject = result.treeNodeObject
        var selectItemNameArray = Variables.get('selectItemNameArray')
        for (var item in treeNodeObject) {
          var barcodeNodeAttrArray = treeNodeObject[ item ]
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            barcodeNodeAttrArray[ bI ].existed = true
          }
          var alignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(barcodeNodeAttrArray))
          var filteredModel = self.barcodeCollection.where({ barcodeTreeId: item })
          if (filteredModel.length !== 0) {
            var barcodeModel = filteredModel[ 0 ]
            barcodeModel.set('barcodeNodeAttrArray', barcodeNodeAttrArray)
            barcodeModel.set('alignedBarcodeNodeAttrArray', alignedBarcodeNodeAttrArray)
          }
        }
        // Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW' ])
        self.barcodeCollection.add_all_super_subtree()
      }
      self.requestDataFromServer(url, formData, originalDatasuccessUpdateFunc)
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
    buildSuperTree: function (rootId, rootLevel, rootCategory, deferObj) {
      var self = this
      var url = 'build_super_tree'
      var selectedItemsArray = Variables.get('selectItemNameArray')
      var alignedLevel = Variables.get('alignedLevel')
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var compactNum = window.compactNum
      var formData = {
        'dataItemNameArray': selectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
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
        var superTreeNodeArray = result.treeNodeObject.originalSuperTreeObj.superTreeNodeLocArray
        var maxNodeNumTreeNodeLocArray = result.treeNodeObject.originalSuperTreeObj.maxNodeNumTreeNodeLocArray
        var compactSuperTreeNodeLocArray = result.treeNodeObject.compactSuperTreeObj.compactSuperTreeNodeLocArray
        var compactMaxNodeNumTreeNodeLocArray = result.treeNodeObject.compactSuperTreeObj.compactMaxNodeNumTreeNodeLocArray
        /**
         * 新增加的barcode-node中的existed属性都设置为false, 需要根据对齐的层级将existed属性重新设置为true
         */
        for (var tI = 0; tI < superTreeNodeArray.length; tI++) {
          superTreeNodeArray[ tI ].existed = false
        }
        for (var tI = 0; tI < compactSuperTreeNodeLocArray.length; tI++) {
          compactSuperTreeNodeLocArray[ tI ].existed = false
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