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
      self.init_dataset_mode(viewWidth, viewHeight)
      var histogramModel = self.histogramModel
      // //  获取category dataset 当鼠标mouseover的时候得到barcode的名称
      // var categoryModel = self.categoryModel
      var barcodeCollection = self.barcodeCollection
      // self.request_category_dataset()
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
      var defaultBarcodeWidthArray = defaultSettings.default_width_array
      //  根据width ratio计算与width ratio相关的变量
      var defaultBarcodeNodeInterval = widthRatio > 1 ? Math.round(defaultSettings.barcode_node_interval * widthRatio) : defaultSettings.barcode_node_interval
      for (var dI = 0; dI < defaultBarcodeWidthArray.length; dI++) {
        defaultBarcodeWidthArray[dI] = Math.round(defaultBarcodeWidthArray[dI] * widthRatio)
      }
      var MAX_BARCODE_NODE_PADDING = Config.get('MAX_BARCODE_NODE_PADDING')
      var defaultBarcodeTreeConfigHeight = Variables.get('barcodeTreeConfigHeight')
      var defaultSuperTreeHeight = Variables.get('superTreeHeight')
      var maxBarcodePaddingNodeWidth = MAX_BARCODE_NODE_PADDING * widthRatio
      defaultSettings.original_width_array = JSON.parse(JSON.stringify(defaultBarcodeWidthArray))
      //  根据计算得到的height ratio计算与height ratio相关的变量
      var defaultHeight = Math.round(defaultSettings.default_barcode_height * heightRatio)
      var defaultSelectedLevels = defaultSettings.default_selected_levels
      var barcodeTreeConfigHeight = defaultBarcodeTreeConfigHeight * widthRatio
      Variables.set('barcodeTreeConfigHeight', barcodeTreeConfigHeight)
      var defaultBarcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
      var barcodeTextPaddingLeft = defaultBarcodeTextPaddingLeft * widthRatio
      Variables.set('barcodeTextPaddingLeft', barcodeTextPaddingLeft)
      var defaultBarcodePaddingLeft = Variables.get('barcodePaddingLeft')
      var barcodePaddingLeft = defaultBarcodePaddingLeft * widthRatio
      Variables.set('barcodePaddingLeft', barcodePaddingLeft)
      var superTreeHeight = defaultSuperTreeHeight * heightRatio * 0.8
      Variables.set('superTreeHeight', superTreeHeight)
      var defaultComparisonResultPadding = Config.get('COMPARISON_RESULT_PADDING')
      var comparisonResultPadding = defaultComparisonResultPadding * widthRatio
      Config.set('COMPARISON_RESULT_PADDING', comparisonResultPadding)
      var compactNum = defaultSettings.compact_num
      Variables.set('barcodeMode', defaultBarcodeMode)
      Variables.set('currentDataSetName', defaultDataSetName)
      Variables.set('barcodeWidthArray', defaultBarcodeWidthArray)
      Variables.set('barcodeHeight', defaultHeight)
      Variables.set('selectedLevels', defaultSelectedLevels)
      Variables.set('compactNum', compactNum)
      Variables.set('barcodeNodeInterval', defaultBarcodeNodeInterval)
      Variables.set('maxBarcodePaddingNodeWidth', maxBarcodePaddingNodeWidth)
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
      var url = 'file_name'
      var formData = {
        'DataSetName': Variables.get('currentDataSetName')
      }
      var requestHistogramSuccessFunc = function (result) {
        self.request_histogram_handler(result)
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
    //  去除selectedItemArray数组中的组合的id, 因为这些在背后的requestData中找不到
    remove_group_id: function (selectedItemsArray) {
      var self = this
      var selectedItemsArray = JSON.parse(JSON.stringify(selectedItemsArray))
      for (var sI = 0; sI < selectedItemsArray.length; sI++) {
        var selectedItem = selectedItemsArray[sI]
        if (selectedItem.substring(0, 5) === 'group') {
          selectedItemsArray.splice(sI, 1)
        }
      }
      return selectedItemsArray
    },
    //  获取交集的原始的Barcode的数据
    requestAndDataCenter: function (selectedItemsArray, groupId) {
      var self = this
      var barcodeCollection = self.barcodeCollection
      var url = 'and_operation_result'
      var operationType = 'and'
      groupId = groupId + '_' + operationType
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      var removedSelectedItemsArray = self.remove_group_id(selectedItemsArray)
      var formData = {
        'dataItemNameArray': removedSelectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeNodeInterval': barcodeNodeInterval,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'compactNum': window.compactNum,
        'maxDepth': Variables.get('maxDepth'),
        'groupId': groupId
      }
      var originalDatasuccessFunc = function (result) {
        self.and_operation_handler(result, removedSelectedItemsArray, operationType)
      }
      if (!barcodeCollection.set_operation_results_existed(removedSelectedItemsArray, operationType)) {
        self.requestDataFromServer(url, formData, originalDatasuccessFunc)
      }
    },
    //  获取并集的原始的Barcode的数据
    requestOrDataCenter: function (selectedItemsArray, groupId) {
      var self = this
      var url = 'or_operation_result'
      var operationType = 'or'
      groupId = groupId + '_' + operationType
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      var removedSelectedItemsArray = self.remove_group_id(selectedItemsArray)
      var formData = {
        'dataItemNameArray': removedSelectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeNodeInterval': barcodeNodeInterval,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'compactNum': window.compactNum,
        'maxDepth': Variables.get('maxDepth'),
        'groupId': groupId
      }
      var originalDatasuccessFunc = function (result) {
        self.or_operation_handler(result, removedSelectedItemsArray, operationType)
      }
      if (!self.barcodeCollection.set_operation_results_existed(removedSelectedItemsArray, operationType)) {
        self.requestDataFromServer(url, formData, originalDatasuccessFunc)
      }
    },
    //  获取补集的原始的Barcode的数据
    requestComplementDataCenter: function (selectedItemsArray, groupId) {
      var self = this
      var url = 'complement_operation_result'
      var operationType = 'complement'
      groupId = groupId + '_' + operationType
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      var removedSelectedItemsArray = self.remove_group_id(selectedItemsArray)
      var formData = {
        'dataItemNameArray': removedSelectedItemsArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeNodeInterval': barcodeNodeInterval,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'compactNum': window.compactNum,
        'maxDepth': Variables.get('maxDepth'),
        'groupId': groupId
      }
      var originalDatasuccessFunc = function (result) {
        self.complement_operation_handler(result, removedSelectedItemsArray, operationType)
      }
      var complementCriteriaNum = 2
      //  如果当前选择的barcodeTree的个数为2, 那么可以在barcodeTree之间完成补集的操作
      if (removedSelectedItemsArray.length === complementCriteriaNum) {
        if (!self.barcodeCollection.set_operation_results_existed(removedSelectedItemsArray, operationType)) {
          self.requestDataFromServer(url, formData, originalDatasuccessFunc)
        }
      }
    },
    /**
     * 在histogram-main中调用这个方法, 主要用于获取BarcodeTree的节点数组, 包括节点上的属性
     * @param url
     * @param selectedItemsArray
     */
    requestDataCenter: function (selectedItemsArray) {
      var url = 'barcode_original_data'
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
        self.original_tree_object_request_handler(result)
        //  更新完成之后重新获取compact barcodeTree, 以提高速度
        self.requestCompactDataCenter(selectedItemsArray)
      }
      self.requestDataFromServer(url, formData, originalDatasuccessFunc)
    },
    /**
     * 在获取原始的属性之后开始获取compact barcodeTree
     * @param url
     * @param selectedItemsArray
     */
    requestCompactDataCenter: function (selectedItemsArray) {
      var url = 'barcode_compact_data'
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
        self.compact_tree_object_request_handler(result)
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
    updateDateCenter: function () {
      var self = this
      var url = 'barcode_original_data'
      var selectedItemsArray = Variables.get('selectItemNameArray')
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
        var treeNodeArrayObject = result.treeNodeArrayObject
        var originalTreeObjObject = result.originalTreeObjObject
        var selectItemNameArray = Variables.get('selectItemNameArray')
        for (var item in treeNodeArrayObject) {
          var barcodeNodeAttrArray = treeNodeArrayObject[item]
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            barcodeNodeAttrArray[bI].existed = true
          }
          var alignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(barcodeNodeAttrArray))
          var originalTreeObj = originalTreeObjObject[item]
          var filteredModel = self.barcodeCollection.where({barcodeTreeId: item})
          if (filteredModel.length !== 0) {
            var barcodeModel = filteredModel[0]
            barcodeModel.set('barcodeNodeAttrArray', barcodeNodeAttrArray)
            barcodeModel.set('alignedBarcodeNodeAttrArray', alignedBarcodeNodeAttrArray)
            barcodeModel.set('originalTreeObj', originalTreeObj)
          }
        }
        // Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW' ])
        // self.barcodeCollection.add_all_super_subtree()
        self.barcodeCollection.align_node_in_selected_list()
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
        //
        self.barcodeCollection.remove_barcode_subtree(rootId, rootCategory, rootLevel, supertreeNodeObj, compactSuperTreeNodeLocObj)
        deferObj.resolve()
      }
      self.requestDataFromServer(url, formData, buildSuperTreeSuccessFunc)
    },
    //  在barcode.single.view中被调用, 主要是在选定根节点之后构建superTree
    buildSuperTree: function (rootId, rootLevel, rootCategory, subtreeObjArray, alignedLevel, deferObj) {
      var self = this
      var url = 'build_super_tree'
      var selectedItemsArray = Variables.get('selectItemNameArray')
      var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
      var Node_Arrangement_State = BARCODETREE_GLOBAL_PARAS['Node_Arrangement']
      var originalSequenceState = 'ORIGINAL'
      if (Node_Arrangement_State) {
        originalSequenceState = 'SORTING'
      }
      var compactNum = window.compactNum
      var formData = {
        'dataItemNameArray': selectedItemsArray,
        'subtreeObjArray': subtreeObjArray,
        'dataSetName': window.dataSetName,
        'barcodeWidthArray': window.barcodeWidthArray,
        'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
        'selectedLevels': window.selectedLevels,
        'barcodeNodeInterval': barcodeNodeInterval,
        'rootId': rootId,
        'rootLevel': rootLevel,
        'maxLevel': Variables.get('maxDepth'),
        'alignedLevel': alignedLevel,
        'compactNum': compactNum,
        'originalSequenceState': originalSequenceState
      }
      var buildSuperTreeSuccessFunc = function (result) {
        self.build_super_tree_handler(rootId, rootLevel, rootCategory, result, deferObj)
      }
      self.requestDataFromServer(url, formData, buildSuperTreeSuccessFunc)
    },
    //  删除选中的某个元素的handler
    request_remove_item: function (removedSelectedItemsArray) {
      var self = this
      var url = 'remove_from_super_tree'
      var formData = {
        'removedDataItemNameArray': removedSelectedItemsArray,
        'dataSetName': window.dataSetName
      }
      var buildSuperTreeSuccessFunc = function () {
        console.log('globalSuperTreeUpdate successfully!')
      }
      self.requestDataFromServer(url, formData, buildSuperTreeSuccessFunc)
    },
    //  与服务器端通信的方法, 在dataCenter.model中被调用
    requestDataFromServer: function (Url, formData, originalDatasuccessFunc) {
      var self = this
      var barcodeTreeId = formData.dataItemName
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
    },
    /**
     * 更新barcodeTree的纵向顺序
     */
    update_barcode_tree_reordering_sequence: function () {
      var self = this
      var url = 'update_barcode_tree_vertical_sequence'
      var formData = {}
      var updateTreeVerticalSuccessFunc = function (result) {
        var barcodeTreeVerticalSequence = result.barcodeTreeVerticalSequence
        self.barcodeCollection.sort_vertical_barcode_model(barcodeTreeVerticalSequence)
      }
      self.requestDataFromServer(url, formData, updateTreeVerticalSuccessFunc)
    },
    /**
     * 更新barcodeTree中的节点的排列顺序
     */
    update_barcode_tree_sequence: function (collectionAlignedObjPercentageArrayObjArray) {
      var self = this
      var url = 'update_barcode_tree_sequence'
      var selectedItemsArray = Variables.get('selectItemNameArray')
      var formData = {
        'alignedObjPercentageArrayObjArray': collectionAlignedObjPercentageArrayObjArray,
        'dataItemNameArray': selectedItemsArray
      }
      var buildSuperTreeSuccessFunc = function (result) {
      }
      self.requestDataFromServer(url, formData, buildSuperTreeSuccessFunc)
    },
    build_super_tree_handler: function (rootId, rootLevel, rootCategory, result, deferObj) {
      var self = this
      /**
       * 计算得到替换的节点数组
       * superTreeNodeLocArray - 计算当前的树中的某一部分子树的superTree
       * maxNodeNumTreeNodeLocArray - 根据当前的alignedlevel, 计算得到当前选中的树中某一部分子树的具有最大的节点数量部分的合并
       */
      if (typeof (result.treeNodeObject.originalSuperTreeObj) === 'undefined') {
        deferObj.resolve()
      }
      var superTreeNodeArray = result.treeNodeObject.superTreeNodeLocArray
      var maxNodeNumTreeNodeLocArray = result.treeNodeObject.maxNodeNumTreeNodeLocArray
      /**
       * 新增加的barcode-node中的existed属性都设置为false, 需要根据对齐的层级将existed属性重新设置为true
       */
      for (var tI = 0; tI < superTreeNodeArray.length; tI++) {
        superTreeNodeArray[tI].existed = false
      }
      self.barcodeCollection.update_barcode_subtree_aligned_part(rootId, rootCategory, rootLevel, superTreeNodeArray, maxNodeNumTreeNodeLocArray)
      deferObj.resolve()
    },
    //  compact数据的处理函数
    compact_tree_object_request_handler: function (result) {
      var self = this
      var compactLineatTreeNodeLocArrayObject = result.compactLineatTreeNodeLocArrayObject
      for (var item in compactLineatTreeNodeLocArrayObject) {
        var compactBarcodeNodeAttrArrayObj = compactLineatTreeNodeLocArrayObject[item]
        var filteredModel = self.barcodeCollection.where({barcodeTreeId: item})
        if (filteredModel.length !== 0) {
          var barcodeModel = filteredModel[0]
          barcodeModel.set('compactBarcodeNodeAttrArrayObj', compactBarcodeNodeAttrArrayObj)
        }
      }
    },
    //  原始数据的处理函数
    original_tree_object_request_handler: function (result) {
      var self = this
      var originalTreeObjObject = result.originalTreeObjObject
      var treeNodeArrayObject = result.treeNodeArrayObject
      var compactLineatTreeNodeLocArrayObject = result.compactLineatTreeNodeLocArrayObject
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var addedBarcodeModelArray = []
      var compactNum = window.compactNum
      //  将展示全部的barcode压缩到屏幕的范围内
      for (var item in treeNodeArrayObject) {
        //  1. 对于全局的categoryNodeObj的处理
        var barcodeNodeAttrArray = treeNodeArrayObject[item]
        var alignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(barcodeNodeAttrArray))
        var originalTreeObj = originalTreeObjObject[item]
        var barcodeModel = new BarcodeModel({
          'barcodeTreeId': item,
          'barcodeNodeAttrArray': barcodeNodeAttrArray,
          'alignedBarcodeNodeAttrArray': alignedBarcodeNodeAttrArray,
          'originalTreeObj': originalTreeObj,
          'compactNum': compactNum
        })
        barcodeModel.initialize()
        addedBarcodeModelArray.push(barcodeModel)
      }
      // Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
      window.get_barcode_time_datacenter303 = new Date()
      var loadOriginalDataTime = window.get_barcode_time_datacenter303.getDifference(window.request_barcode_time_histogram435)
      self.barcodeCollection.add_barcode_dataset(addedBarcodeModelArray)
      self.trigger_hide_loading_icon()
    },
    //
    add_to_set_operation_array: function (item, operationType) {
      var setOperationArray = Variables.get('setOperationArray')
      var operationBarcodeModelId = item + '-' + operationType
      setOperationArray.push(operationBarcodeModelId)
    },
    //  并集操作的handler
    or_operation_handler: function (result, orSelectedItemsArray, operationType) {
      var self = this
      var originalTreeObjObject = result.originalTreeObjObject
      var treeNodeArrayObject = result.treeNodeArrayObject
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var addedBarcodeModelArray = []
      //  将展示全部的barcode压缩到屏幕的范围内
      for (var item in treeNodeArrayObject) {
        //  1. 对于全局的categoryNodeObj的处理
        var barcodeNodeAttrArray = treeNodeArrayObject[item]
        var originalTreeObj = originalTreeObjObject[item]
        var barcodeModel = new BarcodeModel({
          'barcodeModelType': operationType,
          'barcodeTreeId': item,
          'barcodeIndex': -1,
          'barcodeNodeAttrArray': barcodeNodeAttrArray,
          'originalTreeObj': originalTreeObj,
          'itemArray': orSelectedItemsArray,
          'operationType': operationType
        })
        barcodeModel.initialize()
        addedBarcodeModelArray.push(barcodeModel)
        self.add_to_set_operation_array(item, operationType)
      }
      // Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
      window.get_barcode_time_datacenter303 = new Date()
      var loadOriginalDataTime = window.get_barcode_time_datacenter303.getDifference(window.request_barcode_time_histogram435)
      self.barcodeCollection.add_barcode_dataset(addedBarcodeModelArray)
      self.trigger_hide_loading_icon()
    },
    //  获取histogram数据的后续处理函数
    request_histogram_handler: function (result) {
      var self = this
      var histogramModel = self.histogramModel
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
    },
    //  交集操作的handler
    and_operation_handler: function (result, andSelectedItemsArray, operationType) {
      var self = this
      var originalTreeObjObject = result.originalTreeObjObject
      var treeNodeArrayObject = result.treeNodeArrayObject
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var addedBarcodeModelArray = []
      //  将展示全部的barcode压缩到屏幕的范围内
      for (var item in treeNodeArrayObject) {
        //  1. 对于全局的categoryNodeObj的处理
        var barcodeNodeAttrArray = treeNodeArrayObject[item]
        var originalTreeObj = originalTreeObjObject[item]
        var barcodeModel = new BarcodeModel({
          'barcodeModelType': operationType,
          'barcodeTreeId': item,
          'barcodeIndex': -1,
          'barcodeNodeAttrArray': barcodeNodeAttrArray,
          'originalTreeObj': originalTreeObj,
          'itemArray': andSelectedItemsArray,
          'operationType': operationType
        })
        barcodeModel.initialize()
        addedBarcodeModelArray.push(barcodeModel)
        self.add_to_set_operation_array(item, operationType)
      }
      // Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
      window.get_barcode_time_datacenter303 = new Date()
      var loadOriginalDataTime = window.get_barcode_time_datacenter303.getDifference(window.request_barcode_time_histogram435)
      self.barcodeCollection.add_barcode_dataset(addedBarcodeModelArray)
      self.trigger_hide_loading_icon()
    },
    //  补集操作的handler
    complement_operation_handler: function (result, complementSelectedItemsArray, operationType) {
      var self = this
      var originalTreeObjObject = result.originalTreeObjObject
      var treeNodeArrayObject = result.treeNodeArrayObject
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var addedBarcodeModelArray = []
      //  将展示全部的barcode压缩到屏幕的范围内
      for (var item in treeNodeArrayObject) {
        //  1. 对于全局的categoryNodeObj的处理
        var barcodeNodeAttrArray = treeNodeArrayObject[item]
        var originalTreeObj = originalTreeObjObject[item]
        var barcodeModel = new BarcodeModel({
          'barcodeModelType': operationType,
          'barcodeTreeId': item,
          'barcodeIndex': -1,
          'barcodeNodeAttrArray': barcodeNodeAttrArray,
          'originalTreeObj': originalTreeObj,
          'itemArray': complementSelectedItemsArray,
          'operationType': operationType
        })
        barcodeModel.initialize()
        addedBarcodeModelArray.push(barcodeModel)
        self.add_to_set_operation_array(item, operationType)
      }
      // Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
      window.get_barcode_time_datacenter303 = new Date()
      var loadOriginalDataTime = window.get_barcode_time_datacenter303.getDifference(window.request_barcode_time_histogram435)
      self.barcodeCollection.add_barcode_dataset(addedBarcodeModelArray)
      self.trigger_hide_loading_icon()
    }
  }))()
  return window.Datacenter
})