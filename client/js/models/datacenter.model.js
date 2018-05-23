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
		'models/barcode.model',
		'models/supertree.model',
		'collections/barcode.collection'
], function (require, Mn, _, Backbone, Variables, Config, HistogramModel, BarcodeModel, SuperTreeModel, BarcodeCollection) {
		'use strict'
		window.Datacenter = new (Backbone.Model.extend({
				defaults: {},
				initialize: function (url) {
						var self = this
						self.histogramModel = new HistogramModel()
						self.barcodeCollection = new BarcodeCollection()
						self.supertreeModel = new SuperTreeModel()
				},
				//  DataCenter在初始化之后向服务器端请求histogram的数据
				//  程序的默认状态, 由config中的变量控制
				start: function () {
						var self = this
						self.init_dataset_mode()
						self.request_histogram_dataset()
				},
				trigger_hide_loading_icon: function () {
						var self = this
						Backbone.Events.trigger(Config.get('EVENTS')['HIDE_LOADING_ICON'])
				},
				init_dataset_mode: function () {
						var self = this
						//  1. 初始化barcodeViewPaddingRight, 在不同的屏幕上的padding right是不同的
						window.dataSetName = Variables.get('currentDataSetName')
						//  2. 更新barcode的模式
						window.barcodeMode = Variables.get('barcodeMode')
						//  3. 更新barcode的node width的大小
						//  barcodeWidth和selectedLevels首先赋予默认的数值, 在获得不同的histogram数据之后相对应的更新这两个数据集
						var defaultBarcodeWidthArray = JSON.parse(JSON.stringify(Variables.get('barcodeWidthArray')))
						for (var dI = 0; dI < defaultBarcodeWidthArray.length; dI++) {
								defaultBarcodeWidthArray[dI] = self.update_width_by_ratio(defaultBarcodeWidthArray[dI])
						}
						Variables.set('barcodeWidthArray', defaultBarcodeWidthArray)
						//  设置未更改之前的barcode节点宽度的数组
						Variables.set('barcodeWidthArray_previous', JSON.parse(JSON.stringify(defaultBarcodeWidthArray)))
						window.barcodeWidthArray = defaultBarcodeWidthArray
						//  根据width ratio计算与width ratio相关的变量
						//  4. 更新barcode的node interval的大小
						var defaultBarcodeNodeInterval = Variables.get('barcodeNodeInterval')
						var updateBarcodeNodeInterval = self.update_width_by_ratio(defaultBarcodeNodeInterval)
						defaultBarcodeNodeInterval = updateBarcodeNodeInterval > defaultBarcodeNodeInterval ? updateBarcodeNodeInterval : defaultBarcodeNodeInterval
						Variables.set('barcodeNodeInterval', defaultBarcodeNodeInterval)
						window.barcodeNodeInterval = defaultBarcodeNodeInterval
						//  5. 更新barcode的max barcodeNode Width的大小
						var maxBarcodeWidth = Variables.get('maxBarcodeWidth')
						var updateMaxBarcodeWidth = self.update_width_by_ratio(maxBarcodeWidth)
						Variables.set('maxBarcodeWidth', updateMaxBarcodeWidth)
						//  2.2 更新barcodeTree的min barcodeNode width的大小
						var minBarcodeWidth = Variables.get('minBarcodeWidth')
						var updateMinBarcodeWidth = self.update_width_by_ratio(minBarcodeWidth)
						Variables.set('minBarcodeWidth', updateMinBarcodeWidth)
						//  3. 更新barcodeNode padding的大小
						var maxBarcodePaddingNodeWidth = Variables.get('maxBarcodePaddingNodeWidth')
						var maxBarcodePaddingNodeWidth = self.update_width_by_ratio(maxBarcodePaddingNodeWidth)
						Variables.set('maxBarcodePaddingNodeWidth', maxBarcodePaddingNodeWidth)
						//  4. 更新barcode的左侧Text的偏移量的大小
						var defaultBarcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
						var barcodeTextPaddingLeft = self.update_width_by_ratio(defaultBarcodeTextPaddingLeft)
						Variables.set('barcodeTextPaddingLeft', barcodeTextPaddingLeft)
						//  5. 更新barcode的左侧的偏移量的
						var defaultBarcodePaddingLeft = Variables.get('barcodePaddingLeft')
						var barcodePaddingLeft = self.update_width_by_ratio(defaultBarcodePaddingLeft)
						Variables.set('barcodePaddingLeft', barcodePaddingLeft)
						//  6. 更新比较结果的padding的大小
						var defaultComparisonResultPadding = Variables.get('comparisonResultPadding')
						var comparisonResultPadding = self.update_width_by_ratio(defaultComparisonResultPadding)
						Variables.set('comparisonResultPadding', comparisonResultPadding)
						//  根据计算得到的height ratio计算与height ratio相关的变量
						//  7. 更新barcodeTree的config的height的大小
						var defaultBarcodeTreeConfigHeight = Variables.get('barcodeTreeConfigHeight')
						var barcodeTreeConfigHeight = self.update_height_by_ratio(defaultBarcodeTreeConfigHeight) // 这个地方本来是用width ratio进行更新的
						Variables.set('barcodeTreeConfigHeight', barcodeTreeConfigHeight)
						//  8. 更新BarcodeTree的高度
						var defaultBarcodeHeight = Variables.get('barcodeHeight')
						defaultBarcodeHeight = self.update_height_by_ratio(defaultBarcodeHeight)
						Variables.set('barcodeHeight', defaultBarcodeHeight)
						window.barcodeHeight = defaultBarcodeHeight
						//  9. 更新superTree的高度
						var defaultSuperTreeHeight = Variables.get('superTreeHeight')
						defaultSuperTreeHeight = self.update_height_by_ratio(defaultSuperTreeHeight)
						var superTreeHeight = defaultSuperTreeHeight * 0.8
						Variables.set('superTreeHeight', superTreeHeight)
						//  10. 更新barcode的compactNum
						window.compactNum = Variables.get('compactNum')
						//  11. 更新选择的层级
						window.selectedLevels = Variables.get('selectedLevels')
						//  12. 更新最小的selection icon的大小
						var minIconSize = Variables.get('minIconSize')
						minIconSize = self.update_height_by_ratio(minIconSize)
						Variables.set('minIconSize', minIconSize)
						window.minIconSize = minIconSize
				},
				/**
					* 按照比例更新barcode的节点的宽度相关的属性
					*/
				update_width_by_ratio: function (width) {
						//  1600的宽度, 892的屏幕高度 对应的是当前的barcode高度50和当前barcode宽度[ 18, 12, 8, 4, 0 ], 那么需要对于该设置参数按按照比例进行变化
						var viewWidth = $(document).width()
						var initWidth = Variables.get('init_width')
						var widthRatio = viewWidth / initWidth
						var changedWidth = Math.round(widthRatio * width)
						return changedWidth
				},
				/**
					* 按照比例更新barcode节点的高度相关的属性
					*/
				update_height_by_ratio: function (height) {
						//  1600的宽度, 892的屏幕高度 对应的是当前的barcode高度50和当前barcode宽度[ 18, 12, 8, 4, 0 ], 那么需要对于该设置参数按按照比例进行变化
						var viewHeight = $(document).height()
						var initHeight = Variables.get('init_height')
						var heightRatio = viewHeight / initHeight
						var changedHeight = Math.round(height * heightRatio)
						return changedHeight
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
						//  将loading的图标进行显示, 每次点击toolbar中的按钮获取数据, 都需要将loading进行显示
						$('#loading').css({visibility: 'visible'})
						self.requestDataFromServer(url, formData, requestHistogramSuccessFunc)
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
								'allSelectedDataItemNameArray': Variables.get('selectItemNameArray'),
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
								self.barcodeCollection.align_node_in_selected_list()
						}
						self.requestDataFromServer(url, formData, originalDatasuccessUpdateFunc)
				},
				//  在barcode.single.view中被调用, 主要是在选定根节点之后构建superTree
				buildSuperTree: function (rootId, rootLevel, rootCategory, subtreeObjArray, alignedLevel, deferObj) {
						var self = this
						var url = 'build_super_tree'
						var selectedItemsArray = Variables.get('selectItemNameArray')
						var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
						var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						//  切割BarcodeTree中不同段之间的距离, 在当前不处于切割状态的情况下, 那么将该数值置为0传递到后台部分
						var BarcodeTree_Split = BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split']
						var BarcodeTreeSplitWidth = 0
						var segmentLevel = Variables.get('segmentLevel')
						var alignedLevel = Variables.get('alignedLevel')
						//	只有当segement的层级比aligned层级更深时, 才会将subtree的正常的宽度的基础上增加BarcodeTreeSplitWidth的长度
						if (BarcodeTree_Split) {
								BarcodeTreeSplitWidth = Variables.get('BarcodeTree_Split_Width')
						}
						console.log('BarcodeTreeSplitWidth', BarcodeTreeSplitWidth)
						var Node_Arrangement_State = BARCODETREE_GLOBAL_PARAS['Node_Arrangement']
						var originalSequenceState = 'ORIGINAL'
						if (Node_Arrangement_State) {
								originalSequenceState = 'SORTING'
						}
						//  为什么选择displayed level
						var selectedLevels = Variables.get('selectedLevels')
						var displayMaxDepth = selectedLevels.max()
						var maxDepth = Variables.get('fileMaxDepth')  //默认的情况下显示4层的barcodeTree
						var compactNum = window.compactNum
						var formData = {
								'dataItemNameArray': selectedItemsArray,
								// 'subtreeObjArray': subtreeObjArray,
								'dataSetName': window.dataSetName,
								'barcodeWidthArray': window.barcodeWidthArray,
								'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
								'selectedLevels': window.selectedLevels,
								'barcodeNodeInterval': barcodeNodeInterval,
								'barcodeTreeSplitWidth': BarcodeTreeSplitWidth,
								'rootId': rootId,
								'rootLevel': rootLevel,
								'maxLevel': maxDepth,
								'alignedLevel': alignedLevel,
								'segmentLevel': segmentLevel,
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
								'allSelectedDataItemNameArray': Variables.get('selectItemNameArray'),
								'dataSetName': window.dataSetName
						}
						var buildSuperTreeSuccessFunc = function () {
								self.barcodeCollection.update_after_remove_models()
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
						window.get_barcode_time_datacenter303 = new Date()
						var loadOriginalDataTime = window.get_barcode_time_datacenter303.getDifference(window.request_barcode_time_histogram435)
						self.barcodeCollection.add_barcode_dataset(addedBarcodeModelArray)
						self.trigger_hide_loading_icon()
				},
				init_selected_levels: function () {
						var self = this
						var max_depth = Variables.get('maxDepth')
						var selectedLevels = []
						for (var level = 0; level <= max_depth; level++) {
								selectedLevels.push(level)
						}
						window.selectedLevels = selectedLevels
						Variables.set('selectedLevels', selectedLevels)
				},
				//  更新barcode选定的层级以及层级的宽度, 目前的做法是只显示barcodeTree的前四层,逐层向下地进行探索
				update_selected_levels_width: function () {
						var self = this
						var max_depth = Variables.get('maxDepth')
						var barcodeWidthArray = []
						for (var level = 0; level <= max_depth; level++) {
								//  将所有的层级添加到selectedLevel数组中
								var width = uniform_width_for_each_level(level, max_depth)
								barcodeWidthArray.push(width)
						}
						//  更新barcode的宽度,以及选定的barcode的层级
						window.barcodeWidthArray = barcodeWidthArray
						Variables.set('barcodeWidthArray', barcodeWidthArray)
						//  采用平均的方法计算barcode的节点的宽度
						function uniform_width_for_each_level(level, max_depth) {
								var maxBarcodeWidth = Variables.get('maxBarcodeWidth')
								var minBarcodeWidth = Variables.get('minBarcodeWidth')
								var barcodeLevelPerWidth = Math.round(maxBarcodeWidth / max_depth)
								if (level === max_depth) {
										return minBarcodeWidth
								}
								return (max_depth - level) * barcodeLevelPerWidth
						}
				},
				//  获取histogram数据的后续处理函数
				request_histogram_handler: function (result) {
						var self = this
						var histogramModel = self.histogramModel
						//  获取了层次结构数据之后更新Variable中关于层级的属性, 包括最大的层级, 显示的层级, 不同层级节点的宽度, 以及不同层级节点的颜色
						window.Variables.update_max_depth(result.maxDepth)
						//  处理读取的histogram的数据, 更新histogram的model
						histogramModel.handle_histogram_data(result)
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
						window.get_barcode_time_datacenter303 = new Date()
						var loadOriginalDataTime = window.get_barcode_time_datacenter303.getDifference(window.request_barcode_time_histogram435)
						self.barcodeCollection.add_barcode_dataset(addedBarcodeModelArray)
						self.trigger_hide_loading_icon()
				}
		}))()
		return window.Datacenter
})