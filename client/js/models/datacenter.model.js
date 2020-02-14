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
		'models/sorting.model',
		'models/rawData.model',
		'collections/barcode.collection'
], function (require, Mn, _, Backbone, Variables, Config, HistogramModel, BarcodeModel, SuperTreeModel, SortingModel, RawDataModel, BarcodeCollection) {
		'use strict'

		window.Datacenter = new (Backbone.Model.extend({
				defaults: {},
				initialize: function () {
						var self = this
						self.histogramModel = new HistogramModel()
						self.barcodeCollection = new BarcodeCollection()
						self.supertreeModel = new SuperTreeModel()
						self.sortingModel = new SortingModel()
						self.rawDataModel = new RawDataModel()
				},
				//  DataCenter在初始化之后向服务器端请求histogram的数据
				//  程序的默认状态, 由config中的变量控制
				start: function () {
						var self = this
						self.init_dataset_mode()
						self.init_diagonal_strip2()
						self.request_histogram_dataset()
				},
				/**
					* 初始化需要加载的diagonal strip的图片资源
					*/
				init_diagonal_strip2: function () {
						var self = this
						var disgonalStripeImageNames = {}
						var imagePath = './assets/diagonalstrip3/'
						var stripeDensityNum = Variables.get('stripeDensityNum')
						for (var stripeDensity = 1; stripeDensity <= stripeDensityNum; stripeDensity++) {
								var diagonalStripeImageName = stripeDensity + '.png'
								disgonalStripeImageNames[stripeDensity] = imagePath + diagonalStripeImageName
						}
						loadImages(disgonalStripeImageNames)
						function loadImages(sources) {
								var images = {};
								var loadedImages = 0;
								var numImages = 0;
								// get num of sources
								for (var src in sources) {
										numImages++;
								}
								for (var src in sources) {
										images[src] = new Image();
										images[src].onload = function () {
												if (++loadedImages >= numImages) {
														Variables.set('disgonalStripeImageSources', images)
												}
										};
										images[src].src = sources[src];
								}
						}
				},
				/**
					* 初始化需要加载的图片资源
					*/
				init_diagonal_strip: function () {
						//	加载diagonal stripe的图像数据
						var disgonalStripeImageNames = {}
						var imagePath = '../../assets/diagonalstrip/'
						var stripeWidthNum = Variables.get('stripeWidthNum')
						var stripeSpaceNum = Variables.get('stripeSpaceNum')
						for (var stripeSize = 0; stripeSize <= (stripeWidthNum + 1); stripeSize++) {
								for (var stripeSpace = 0; stripeSpace <= (stripeWidthNum + 1); stripeSpace++) {
										var diagonalStripeName = stripeSize + '-' + stripeSpace
										var diagonalStripeImageName = stripeSize + '-' + stripeSpace + '.png'
										disgonalStripeImageNames[diagonalStripeName] = imagePath + diagonalStripeImageName
								}
						}
						loadImages(disgonalStripeImageNames)
						function loadImages(sources, callback) {
								var images = {};
								var loadedImages = 0;
								var numImages = 0;
								// get num of sources
								for (var src in sources) {
										numImages++;
								}
								for (var src in sources) {
										images[src] = new Image();
										images[src].onload = function () {
												if (++loadedImages >= numImages) {
														Variables.set('disgonalStripeImageSources', images)
														console.log('images', images)
												}
										};
										images[src].src = sources[src];
								}
						}
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
								//	处理获取到的histogram数据
								self.request_histogram_handler(result)
								//	向服务器端预请求数据
								self.rawDataModel.pre_read_barcode_tree(result)
								// self.pre_request_barcode_tree(result)
						}
						//  将loading的图标进行显示, 每次点击toolbar中的按钮获取数据, 都需要将loading进行显示
						$('#loading').css({visibility: 'visible'})
						self.requestDataFromServer(url, formData, requestHistogramSuccessFunc)
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
				//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
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
						console.log('defaultBarcodeWidthArray', defaultBarcodeWidthArray)
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
						Variables.set('originalBarcodeNodeInterval', defaultBarcodeNodeInterval)
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
						Variables.set('originalBarcodeHeight', defaultBarcodeHeight)
						window.barcodeHeight = defaultBarcodeHeight
						//  9. 更新superTree的高度
						var defaultSuperTreeHeight = Variables.get('superTreeHeight')
						defaultSuperTreeHeight = self.update_height_by_ratio(defaultSuperTreeHeight)
						var superTreeHeight = defaultSuperTreeHeight * 0.8
						var minSuperTreeHeight = Variables.get('minSuperTreeHeight')
						superTreeHeight = superTreeHeight < minSuperTreeHeight ? minSuperTreeHeight : superTreeHeight
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
						//	 13. 更新barcodeTree的label的大小
						var barcodeTreeTextMaxSize = Variables.get('barcodeTreeTextMaxSize')
						barcodeTreeTextMaxSize = self.update_height_by_ratio(barcodeTreeTextMaxSize)
						Variables.set('barcodeTreeTextMaxSize', barcodeTreeTextMaxSize)
						window.barcodeTreeTextMaxSize = barcodeTreeTextMaxSize
						//	14. 更新barcodeTree的diagonal strip rectangle padding的大小
						var BARCODETREE_VIEW_SETTING = Config.get('BARCODETREE_VIEW_SETTING')
						var barcodeNodePaddingLength = BARCODETREE_VIEW_SETTING['BARCODE_NODE_PADDING_LENGTH']
						BARCODETREE_VIEW_SETTING['BARCODE_NODE_PADDING_LENGTH'] = self.update_height_by_ratio(barcodeNodePaddingLength)
						//	15. 更新barcodeTree的COMPARISON_RESULT_PADDING的大小
						var comparisonResultPadding = BARCODETREE_VIEW_SETTING['COMPARISON_RESULT_PADDING']
						BARCODETREE_VIEW_SETTING['COMPARISON_RESULT_PADDING'] = self.update_height_by_ratio(comparisonResultPadding)
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
				/**
					* 在histogram-main中调用这个方法, 主要用于获取BarcodeTree的节点数组, 包括节点上的属性
					* @param url
					* @param selectedItemsArray
					*/
				requestDataCenter: function (selectedItemsArray) {
						var self = this
						window.requestDataCenterBeginTime = new Date()
						var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
						console.log('window.barcodeWidthArray', window.barcodeWidthArray)
						var barcdoeWidthArray = window.barcodeWidthArray
						var barcodeHeight = window.barcodeHeight * Variables.get('barcodeHeightRatio')
						var selectedLevels = window.selectedLevels
						var barcdoeNodeLocArray = self.rawDataModel.get_barcode_node_location_array(selectedItemsArray, barcodeNodeInterval, barcdoeWidthArray, barcodeHeight, selectedLevels)
						console.log('barcdoeNodeLocArray', barcdoeNodeLocArray)
						var nodeSum = 0
						var treeNum = 0
						for (var item in barcdoeNodeLocArray) {
									var nodeArray = barcdoeNodeLocArray[item]
									nodeSum = nodeSum + nodeArray.length
									treeNum = treeNum + 1
						}
						console.log('nodeSum', nodeSum)
						console.log('treeNum', treeNum)
						window.requestDataCenterEndTime = new Date()
						window.renderDataCenterStartTime = new Date()
						self.original_tree_object_request_handler(barcdoeNodeLocArray)
						window.renderDataCenterEndTime = new Date()
						// var formData = {
						// 		'dataItemNameArray': selectedItemsArray,
						// 		'allSelectedDataItemNameArray': Variables.get('selectItemNameArray'),
						// 		'dataSetName': window.dataSetName,
						// 		'barcodeWidthArray':,
						// 		'barcodeNodeInterval': barcodeNodeInterval,
						// 		'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
						// 		'selectedLevels': window.selectedLevels,
						// 		'compactNum': window.compactNum,
						// 		'maxDepth': Variables.get('maxDepth')
						// }
						// var originalDatasuccessFunc = function (result) {
						// 		window.requestDataCenterEndTime = new Date()
						// 		console.log('request original BarcodeTree End', (+window.requestDataCenterEndTime))
						// 		var timeDifference = window.requestDataCenterEndTime - window.requestDataCenterBeginTime
						// 		console.log('request original BarcodeTree Data time', timeDifference)
						// 		console.log('received results', result)
						// 		window.rendertDataCenterEndTime = new Date()
						// 		console.log('render original BarcodeTree End', (+window.rendertDataCenterEndTime))
						// 		console.log('render original BarcodeTree Data time', (+window.rendertDataCenterEndTime - window.requestDataCenterEndTime))
						// 		//  更新完成之后重新获取compact barcodeTree, 以提高速度
						// 		// self.requestCompactDataCenter(selectedItemsArray)
						// }
						// self.requestDataFromServer(url, formData, originalDatasuccessFunc)
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
								window.requestCompactDataCenterEndTime = new Date()
								var timeDifference = window.requestCompactDataCenterEndTime - window.requestCompactDataCenterStartTime
								console.log('request compact BarcodeTree Data time', timeDifference)
								self.compact_tree_object_request_handler(result)
						}
						window.requestCompactDataCenterStartTime = new Date()
						self.requestDataFromServer(url, formData, originalDatasuccessFunc)
				},
				/**
					* @param url
					* @param selectedItemsArray
					*/
				updateDateCenter: function () {
						var self = this
						var selectedItemsArray = Variables.get('selectItemNameArray')
						var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
						var barcdoeWidthArray = window.barcodeWidthArray
						var barcodeHeight = window.barcodeHeight * Variables.get('barcodeHeightRatio')
						var selectedLevels = window.selectedLevels
						var barcodeNodeLocArrayObj = self.rawDataModel.get_barcode_node_location_array(selectedItemsArray, barcodeNodeInterval,
								barcdoeWidthArray, barcodeHeight, selectedLevels)
						for (var bItem in barcodeNodeLocArrayObj) {
								var barcodeNodeAttrArray = barcodeNodeLocArrayObj[bItem]
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										barcodeNodeAttrArray[bI].existed = true
								}
								var alignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(barcodeNodeAttrArray))
								var filteredModel = self.barcodeCollection.where({barcodeTreeId: bItem})
								if (filteredModel.length !== 0) {
										var barcodeModel = filteredModel[0]
										barcodeModel.set('barcodeNodeAttrArray', barcodeNodeAttrArray)
										barcodeModel.set('alignedBarcodeNodeAttrArray', alignedBarcodeNodeAttrArray)
								}
						}
						//	更新barcodeTree中节点的高度
						self.barcodeCollection.update_all_barcode_tree_node_height()
						//	在数据发生变化的时候需要更新选择的节点对象中, 不同部分的节点选择
						self.barcodeCollection.align_node_in_selected_list()
						// var url = 'barcode_original_data'
						// var selectedItemsArray = Variables.get('selectItemNameArray')
						// var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
						// var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
						// var formData = {
						// 		'dataItemNameArray': selectedItemsArray,
						// 		'dataSetName': window.dataSetName,
						// 		'barcodeWidthArray': window.barcodeWidthArray,
						// 		'barcodeHeight': window.barcodeHeight * barcodeHeightRatio,
						// 		'selectedLevels': window.selectedLevels,
						// 		'barcodeNodeInterval': barcodeNodeInterval
						// }
						// var originalDatasuccessUpdateFunc = function (result) {
						// 		var treeNodeArrayObject = result.treeNodeArrayObject
						// 		var originalTreeObjObject = result.originalTreeObjObject
						// 		var selectItemNameArray = Variables.get('selectItemNameArray')
						// 		for (var item in treeNodeArrayObject) {
						// 				var barcodeNodeAttrArray = treeNodeArrayObject[item]
						// 				for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
						// 						barcodeNodeAttrArray[bI].existed = true
						// 				}
						// 				var alignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(barcodeNodeAttrArray))
						// 				var originalTreeObj = originalTreeObjObject[item]
						// 				var filteredModel = self.barcodeCollection.where({barcodeTreeId: item})
						// 				if (filteredModel.length !== 0) {
						// 						var barcodeModel = filteredModel[0]
						// 						barcodeModel.set('barcodeNodeAttrArray', barcodeNodeAttrArray)
						// 						barcodeModel.set('alignedBarcodeNodeAttrArray', alignedBarcodeNodeAttrArray)
						// 						barcodeModel.set('originalTreeObj', originalTreeObj)
						// 				}
						// 		}
						// 		self.barcodeCollection.align_node_in_selected_list()
						// }
						// self.requestDataFromServer(url, formData, originalDatasuccessUpdateFunc)
				},
				//  在barcode.single.view中被调用, 主要是在选定根节点之后构建superTree
				buildSuperTree: function (rootId, rootLevel, rootCategory, alignedLevel, deferObj) {
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
						var Node_Arrangement_State = BARCODETREE_GLOBAL_PARAS['Node_Arrangement']
						var originalSequenceState = 'ORIGINAL'
						if (Node_Arrangement_State) {
								originalSequenceState = 'SORTING'
						}
						//  为什么选择displayed level
						var selectedLevels = window.selectedLevels
						var displayMaxDepth = selectedLevels.max()
						var maxDepth = Variables.get('fileMaxDepth')  //默认的情况下显示4层的barcodeTree
						var compactNum = window.compactNum
						var formData = {
								'dataItemNameArray': selectedItemsArray,
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
								// window.buildSuperTreeEndTime = +new Date()
								// console.log('build supertree time', (window.buildSuperTreeEndTime - window.buildSuperTreeStartTime))
								self.build_super_tree_handler(rootId, rootLevel, rootCategory, result, deferObj)
								// window.finishRenderSuperTreeTime = +new Date()
								// console.log('finish render supertree time', (window.finishRenderSuperTreeTime - window.buildSuperTreeEndTime))
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
						var superTreeObj = result.treeNodeObject.superTreeObj
						/**
							* 新增加的barcode-node中的existed属性都设置为false, 需要根据对齐的层级将existed属性重新设置为true
							*/
						for (var tI = 0; tI < superTreeNodeArray.length; tI++) {
								superTreeNodeArray[tI].existed = false
						}
						self.barcodeCollection.update_barcode_subtree_aligned_part(rootId, rootCategory, rootLevel, superTreeNodeArray, maxNodeNumTreeNodeLocArray)
						self.barcodeCollection.update_all_barcode_tree_node_height()
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
				original_tree_object_request_handler: function (treeNodeArrayObject) {
						var self = this
						var addedBarcodeModelArray = []
						var compactNum = window.compactNum
						//  将展示全部的barcode压缩到屏幕的范围内
						for (var item in treeNodeArrayObject) {
								//  1. 对于全局的categoryNodeObj的处理
								var barcodeNodeAttrArray = treeNodeArrayObject[item]
								var alignedBarcodeNodeAttrArray = JSON.parse(JSON.stringify(barcodeNodeAttrArray))
								var barcodeModel = new BarcodeModel({
										'barcodeTreeId': item,
										'barcodeNodeAttrArray': barcodeNodeAttrArray,
										'alignedBarcodeNodeAttrArray': alignedBarcodeNodeAttrArray
								})
								barcodeModel.initialize()
								addedBarcodeModelArray.push(barcodeModel)
						}
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
				//  与服务器端通信的方法, 在dataCenter.model中被调用
				requestDataFromServer: function (Url, formData, originalDatasuccessFunc) {
						var self = this
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