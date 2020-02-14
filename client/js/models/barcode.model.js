define([
		'require',
		'marionette',
		'underscore',
		'backbone',
		'variables',
		'config'
], function (require, Mn, _, Backbone, Variables, Config) {
		'use strict'

		return Backbone.Model.extend({
				defaults: {
						//****************************
						'sumAttributeValue': 0,
						//****************************
						'ALIGN_START': Config.get('BARCODETREE_MODEL_SETTING')['ALIGN_START'],
						'ALIGN_RANGE': Config.get('BARCODETREE_MODEL_SETTING')['ALIGN_RANGE'],
						'PADDING_RANGE': Config.get('BARCODETREE_MODEL_SETTING')['PADDING_RANGE'],
						'PADDING_BEGIN': Config.get('BARCODETREE_MODEL_SETTING')['PADDING_BEGIN'],
						'align_start_id_array': [],
						'align_range_id_array': [],
						//  padding范围内的节点的id数组
						'padding_start_id_array': [],
						'global_padding_start_id_array': [],
						'padding_range_id_array': [],
						'global_padding_range_id_array': [],
						//	根据padding节点的id获取padding的对象(在sortingicon视图中点击remove时)
						'padding_node_id2padding_obj': {},
						//  标志barcodeTree的id, 在barcodeTreeComparison视图与histogram视图中都会使用这个id
						'barcodeTreeId': 'barcode-tree-1',
						//  barcodeTree上面每个节点的信息: 节点的id, 节点的位置, 每个节点的书目名称, 每个节点上书的数量, ......
						'barcodeNodeAttrArray': [],
						//  根据barcodeNodeAttrArray建立的object对象
						'barcodeNodeAttrArrayObj': {},
						//  对齐的barcode节点的数组信息
						'alignedBarcodeNodeAttrArray': [],
						//  compact的barcode节点数组
						'compactBarcodeNodeAttrArray': [],
						//  全部的barcode节点数组
						'categoryNodeObjArray': [],
						//  对齐的compact的barcode节点数组
						'compactAlignedBarcodeNodeAttrArray': [],
						//  对齐的节点的对象的信息
						'alignedBarcodeNodeAttrObj': {},
						//  compact模式下的对齐节点的对象的信息
						'compactAlignedBarcodeNodeAttrObj': {},
						//  标志barcodeTree的位置
						'barcodeTreeYLocation': -1,
						//  标志barcodeTree的index值,用于决定barcode背后的rect的颜色
						'barcodeIndex': 0,
						//  用于恢复原始顺序的originalBarcodeIndex
						'originalBarcodeIndex': 0,
						//  标志barcodeTree的节点高度值
						'barcodeNodeHeight': 0,
						//  对齐的节点数组
						'coveredRectObjArray': [],
						//  在barcodeNodeAttrArray中对齐的节点数组
						'alignedRangeObjArray': [],
						//  在global的模式下zoom的节点数组
						'globalZoomRangeObjArray': [],
						//  在alignedBarcodeNodeAttrArray中对齐的节点数组
						'_alignedRangeObjArray': [],
						//  在compactBarcodeNodeAttrArray中能够对齐的节点数组
						'compactAlignedRangeObjArray': [],
						//  在barcodeNodeAttrArray中节点填充的数组
						'paddingNodeObjArray': [],
						//  在global模式下填充的节点子树的范围
						'globalPaddingRangeObjArray1': [],
						//  在alignedBarcodeNodeAttrArray中节点填充的数组
						'_paddingNodeObjArray': [],
						//  在compactBarcodeNoeAttrArray中padding部分的节点数组
						'compactPaddingNodeObjArray': [],
						//  在alignedBarcodeNodeAttrArray中节点填充的数组
						'_compactPaddingNodeObjArray': [],
						//  padding的第二层subtree所处的范围, 通过这个范围计算在superTree中的节点的最左侧和最右侧的位置, 对象的属性是第二层节点的id, 属性值为x值
						'paddingSubtreeRangeObject': {},
						//  判断barcode视图中的高度与位置是否被更新的变量
						'viewHeightUpdateValue': 0,
						//  视图的选择状态是否更新的变量
						'viewUpdateSelectionState': 0,
						//  判断视图是否被更新的变量
						'viewUpdateValue': 0,
						//  判断视图是否多种类型的节点同时更新的变量
						'viewUpdateConcurrentValue': 0,
						//  判断barcode先移动, 在增加padding节点的变量
						'moveFirstPaddingNextUpdateValue': 0,
						//  当前的barcode是否是compare-based
						'compareBased': false,
						//  当前的barcodeModel是否被筛选
						'filterState': false,
						//  被比较的model
						'basedModel': null,
						//  对齐部分的比较结果
						'alignedComparisonResultArray': null,
						//  barcode的背景
						'barcodeRectBgColor': null,
						//  单个barcode的显示模式
						'displayMode': Variables.get('displayMode'),
						//  选择的节点的比较结果
						'selectedComparisonResults': {},
						//  切割barcodeTree之后得到的结果
						'barcodeNodeRearrangeObjArray': [],
						//	折叠部分节点的id数组
						'collapsedSubtreeIdArray': []
				},
				initialize: function () {
						var self = this
						//  在dataCenter中设置的参数都转移到initialize中进行设置
						var barcodePaddingTopRatio = Variables.get('barcodePaddingTopRatio')
						self.set('barcodeNodeHeight', window.barcodeHeight)
						self.set('barcodePaddingTop', window.barcodeHeight * barcodePaddingTopRatio)
						var selectItemNameArray = Variables.get('selectItemNameArray')
						var barcodeTreeId = self.get('barcodeTreeId')
						//  barcodeTree的位置的index值
						var barcodeTreeIndex = selectItemNameArray.indexOf(barcodeTreeId)
						self.set('barcodeIndex', barcodeTreeIndex)
						self.set('originalBarcodeIndex', barcodeTreeIndex)
						//  barcodeTree的背景颜色
						var selectedItemColorObj = Variables.get('selectedItemColorObj')
						if (typeof (selectedItemColorObj) !== 'undefined') {
								if (typeof (selectedItemColorObj[barcodeTreeId]) !== 'undefined') {
										var barcodeBgColor = selectedItemColorObj[barcodeTreeId]
								}
						}
						self.set('barcodeRectBgColor', barcodeBgColor)
						//  设置当前的展示模式
						self.init_barcodetree_array()
						self.update_tree_id_index_obj()
						self.set('displayMode', Variables.get('displayMode'))
						//  设置coveredRectObjArray
						self.set('coveredRectObjArray', [])
						//  初始化selectedComparisonResults作为比较的结果
						self.set('selectedComparisonResults', new Object())
						self.set('barcodeNodeAttrArrayObj', new Object())
				},
				/**
					* 设置barcodeTree中距离上方的边距
					*/
				set_barcode_padding_top: function () {
						var self = this
						var barcodePaddingTopRatio = Variables.get('barcodePaddingTopRatio')
						self.set('barcodePaddingTop', window.barcodeHeight * barcodePaddingTopRatio)
				},
				/**
					* 获取当前barcodeTree的日期
					*/
				get_barcode_tree_date_day: function () {
						var self = this
						var DAY_ARRAY = Config.get('DAY_ARRAY')
						var barcodeTreeId = self.get('barcodeTreeId')
						var barcodeTreeDateStr = barcodeTreeId.split('-')[1].replaceAll('_', '-')
						var barcodeTreeDate = new Date(barcodeTreeDateStr)
						var barcodeTreeDay = DAY_ARRAY[barcodeTreeDate.getDay()]
						return {
								date: barcodeTreeDateStr,
								day: barcodeTreeDay
						}
				},
				/**
					* 获取子树的高度和宽度
					*/
				get_tree_width_height: function (collapsedNodeIdArray) {
						var self = this
						var treeAttrObj = {}
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						for (var cI = 0; cI < collapsedNodeIdArray.length; cI++) {
								var treeAttr = self.get_subtree_width_height(collapsedNodeIdArray[cI], barcodeNodeAttrArray)
								treeAttrObj[collapsedNodeIdArray[cI]] = treeAttr
						}
						return treeAttrObj
				},
				/**
					* 获取barcodeTree label的对象
					*/
				get_barcode_tree_label_obj: function () {
						var self = this
						//	计算barcodeTree的label的大小
						var barcodeTreeLabelSize = Variables.get('barcodeTreeTextMaxSize') > window.barcodeHeight ? window.barcodeHeight : Variables.get('barcodeTreeTextMaxSize')
						var treeLabelObj = {}
						var barcodeTreeId = self.get('barcodeTreeId')
						var barcodeTreeLabelId = barcodeTreeId + '=label'
						var barcodeTreeText = self.get_barcodetree_label()
						var topBarcodeTreeTextPadding = Math.abs(window.barcodeHeight - barcodeTreeLabelSize) / 3
						//	barcodeTreeYLocation是barcodeTree的距离上边界的距离
						var barcodeTreeYLocation = self.get('barcodeTreeYLocation')
						//	barcodePaddingTop是在barcodeTree的内部距离上边界的距离
						var barcodePaddingTop = self.get('barcodePaddingTop')
						//	具体的barcodeTree中的label的纵坐标位置
						var barcodeTreeTextPaddingTop = topBarcodeTreeTextPadding + barcodePaddingTop
						treeLabelObj[barcodeTreeLabelId] = {
								y: barcodeTreeTextPaddingTop,
								fontSize: barcodeTreeLabelSize,
								text: barcodeTreeText,
								barcodeTreeLabelId: barcodeTreeLabelId
						}
						return treeLabelObj
				},
				/**
					*  在折叠的子树上增加三角形
					*/
				get_collapsed_triangle_point_array: function () {
						var self = this
						var barcodeCollection = window.Datacenter.barcodeCollection
						var barcodeTreeIndex = self.get('originalBarcodeIndex')
						var allTrianglePointObj = {}
						var collapsedNodeIdArray = barcodeCollection.get_collapsed_nodes_id()
						//	遍历全部的treeDataModel以及collapsedNode, 获取表示全集的wholeTreeAttrObj
						var barcodeTreeId = self.get('barcodeTreeId')
						//  计算层次结构数据的最大的宽度以及高度
						var treeObj = self.get_tree_width_height(collapsedNodeIdArray)
						var maxInfo = barcodeCollection.maxCollapseTriangleInfo
						//	计算得到全部的triangle对象
						for (var nodeId in treeObj) {
								var collapsedTreeAttr = treeObj[nodeId]
								var collapsedTreeWidth = collapsedTreeAttr.width
								var collapsedTreeHeight = collapsedTreeAttr.height
								var trianglePointArray = self.get_single_collapsed_triangle_point_array(nodeId, barcodeTreeIndex, maxInfo, collapsedTreeWidth, collapsedTreeHeight)
								var triangleId = nodeId + '=' + barcodeTreeIndex
								allTrianglePointObj[triangleId] = {trianglePointArray: trianglePointArray, barcodeTreeIndex: barcodeTreeIndex}
						}
						return allTrianglePointObj
				},
				//  根据节点id在节点的底部增加代表节点所代表子树的三角形
				get_single_collapsed_triangle_point_array: function (nodeId, barcodeTreeIndex, maxInfo, collapsedTreeWidth, collapsedTreeHeight) {
						var self = this
						var maxWidth = maxInfo.width
						var maxHeight = maxInfo.height
						var rootWidth = window.barcodeWidthArray[0]
						var minNodeWidth = window.barcodeWidthArray[window.barcodeWidthArray.length - 1]
						var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
						var barcodeHeight = (+window.barcodeHeight)
						var barcodeGapHeight = barcodeHeight * (1 - 0.8) * 0.5
						var heightScale = d3.scale.linear().domain([0, maxHeight]).range([0, barcodeGapHeight])
						var widthScale = d3.scale.linear().domain([0, maxWidth]).range([minNodeWidth, (rootWidth + barcodeNodeInterval)])
						var subtreeWidth = widthScale(collapsedTreeWidth)
						var subtreeHeight = heightScale(collapsedTreeHeight)
						//  在barcodeTree中增加triangle
						var barcodeNodeId = nodeId + '=' + barcodeTreeIndex
						//	barcodePaddingTop是在barcodeTree的内部距离上边界的距离
						var barcodePaddingTop = self.get('barcodePaddingTop')
						//	对于具体的barcodeTree中的节点的纵坐标位置
						var barcodeTreeNodePaddingTop = +barcodePaddingTop
						var barcodeNodeObj = self.get_node_obj_by_id(nodeId)
						if (typeof (barcodeNodeObj) === 'undefined') {
								return
						}
						var barcodeNodeX = barcodeNodeObj.x + barcodeNodeObj.width / 2 + Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')
						var barcodeNodeY = barcodeNodeObj.y + barcodeNodeObj.height + barcodeTreeNodePaddingTop
						subtreeHeight = subtreeHeight * 2
						//  三角形的直线的点的数据
						var lineDataArray = [{"x": 0, "y": 0}, {"x": -subtreeWidth / 2, "y": subtreeHeight},
								{"x": subtreeWidth / 2, "y": subtreeHeight}, {"x": 0, "y": 0}]
						//	绘制line的节点数组
						var pointArray = []
						for (var lI = 0; lI < lineDataArray.length; lI++) {
								var lineDataObj = lineDataArray[lI]
								pointArray.push(lineDataObj.x + barcodeNodeX)
								pointArray.push(lineDataObj.y + barcodeNodeY)
						}
						return pointArray
				},
				//	计算barcodeTree节点的高度的scale
				get_barcode_tree_node_height_scale: function () {
						var barcodeTreeNodeMaxValue = Variables.get('barcodeTreeNodeMaxValue')
						var miniHeight = Variables.get('MIN_HEIGHT')
						var powExponenet = Variables.get('POW_EXPONENT')
						var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
						var barcodeHeight = window.barcodeHeight * barcodeHeightRatio
						var heightScale = d3.scale.pow().exponent(powExponenet).domain([0, barcodeTreeNodeMaxValue]).range([miniHeight, barcodeHeight]).clamp(true)
						return heightScale
				},
				//	计算得到所有的diagonal strip的节点
				get_all_diagonal_strip_obj: function () {
						var self = this
						var allDiagonalStripObject = {}
						var barcodeTreeIndex = self.get('originalBarcodeIndex')
						var barcodeNodeHeight = window.barcodeHeight * 0.8
						var paddingNodeObjArray = self.get('paddingNodeObjArray')
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var Subtree_Compact = BARCODETREE_GLOBAL_PARAS['Subtree_Compact']
						var BARCODETREE_VIEW_SETTING = Config.get('BARCODETREE_VIEW_SETTING')
						var barcodeNodePaddingLength = BARCODETREE_VIEW_SETTING['BARCODE_NODE_PADDING_LENGTH']
						var barcodeTreeNodePaddingLeft = Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')
						//	对于具体的barcodeTree中的节点的纵坐标位置
						var barcodeTreeNodePaddingTop = self.get('barcodePaddingTop')
						var heightScale = self.get_barcode_tree_node_height_scale()
						var diagonalStripRectArray = []
						for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
								var paddingNodeObj = paddingNodeObjArray[pI]
								if ((paddingNodeObj.paddingNodeStartIndex <= paddingNodeObj.paddingNodeEndIndex) && (Subtree_Compact)) {
										var rectX = paddingNodeObj.paddingNodeX
										if (isNaN(+rectX)) {
												rectX = 0
										}
										//	我们使用stripe的宽度以及stripe间隙的宽度映射折叠子树部分的数据
										//	映射主要有两个方面, 一个方面是折叠部分的节点数量, 一个方面是折叠部分的属性值大小,
										// 节点数量映射到stripe的宽度, 属性值大小映射到stripe中的间隙的宽度
										var maxpaddingNodeAttrNum = paddingNodeObj.maxpaddingNodeAttrNum
										var minpaddingNodeAttrNum = paddingNodeObj.minpaddingNodeAttrNum
										var paddingNodeAttrNum = paddingNodeObj.paddingNodeAttrNum
										//	stripe部分的节点数量属性映射。 数量越大, 那么映射到对应的space的level应该越低
										var maxpaddingNodeNumber = paddingNodeObj.maxpaddingNodeNumber
										var minpaddingNodeNumber = paddingNodeObj.minpaddingNodeNumber
										var paddingNodeNumber = paddingNodeObj.paddingNodeNumber
										var paddingNodeStartIndex = paddingNodeObj.paddingNodeStartIndex
										var paddingNodeEndIndex = paddingNodeObj.paddingNodeEndIndex
										var stripeSpaceNum = Variables.get('stripeSpaceNum')
										var stripeSpaceLevel = stripeSpaceNum - Math.round((paddingNodeNumber - minpaddingNodeNumber) / (maxpaddingNodeNumber - minpaddingNodeNumber) * stripeSpaceNum) + 1
										//	将属性值映射到stripe的宽度属性上
										var stripeDensityNum = Variables.get('stripeDensityNum')
										var BARCODETREE_VIEW_SETTING = Config.get('BARCODETREE_VIEW_SETTING')
										var barcodeNodePaddingLength = BARCODETREE_VIEW_SETTING['BARCODE_NODE_PADDING_LENGTH']
										var stripeDensityLevel = stripeDensityNum - (Math.round((paddingNodeNumber - minpaddingNodeNumber) / (maxpaddingNodeNumber - minpaddingNodeNumber) * (stripeDensityNum - 1)))
										// var barcodeNodePaddingScale = d3.scale.linear().range([barcodeNodePaddingLength / 4, barcodeNodePaddingLength]).domain([minpaddingNodeNumber, maxpaddingNodeNumber])
										// var stripeDensityLevel = 2
										//	将节点数量映射到stripe间隙的宽度属性上
										var stripeSpaceNum = Variables.get('stripeSpaceNum')
										var diagonalStripId = paddingNodeObj.paddingNodeId + '=' + barcodeTreeIndex + '=diagonalstrip'
										var rectWidth = barcodeNodePaddingLength
										// var rectWidth = barcodeNodePaddingScale(paddingNodeNumber)
										var rectHeight = barcodeNodeHeight
										var diagonalStripRect = {
												x: barcodeTreeNodePaddingLeft + rectX,
												y: barcodeTreeNodePaddingTop,
												y_value: barcodeTreeNodePaddingTop + rectHeight - heightScale(paddingNodeAttrNum),
												width: +rectWidth,
												height: +rectHeight,
												height_value: heightScale(paddingNodeAttrNum),
												id: diagonalStripId,
												stripeDensityLevel: stripeDensityLevel,
												startIndex: paddingNodeStartIndex,
												endIndex: paddingNodeEndIndex,
												attrNum: paddingNodeAttrNum
										}
										allDiagonalStripObject[diagonalStripId] = diagonalStripRect
								}
						}
						return allDiagonalStripObject
				},
				/**
					* 获取所选择的节点部分的box的边界位置
					*/
				get_all_box_attr_obj: function () {
						var self = this
						var allBoxAttr = {}
						var selectedNodesId = window.Datacenter.barcodeCollection.selectedNodesId
						var thisBarcodeTreeId = self.get('barcodeTreeId')
						for (var nodeObjId in selectedNodesId) {
								var boxNodeObjId = nodeObjId + '=nodebox'
								var barcodeTreeId = selectedNodesId[nodeObjId].barcodeTreeId
								if (thisBarcodeTreeId === barcodeTreeId) {
										var boxAttr = self.get_single_box_node_attr(nodeObjId)
										allBoxAttr[boxNodeObjId] = boxAttr
								}
						}
						return allBoxAttr
				},
				/**
					* 传入单个barcodeTree中节点的id, 得到该节点对应的子树的范围
					*/
				get_single_box_node_attr: function (nodeObjId) {
						var self = this
						var barcodeTreeNodePaddingLeft = Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')
						var selectedNodesId = window.Datacenter.barcodeCollection.selectedNodesId
						var selectedChildrenNodeIdArray = selectedNodesId[nodeObjId].selectedChildrenNodeIdArray
						var selectedAllChildrenNodeIdArray = selectedNodesId[nodeObjId].selectedAllChildrenNodeIdArray
						var nodeObj = self.get_node_obj_by_id(nodeObjId)
						var selectedBoxLeft = nodeObj.x
						var selectedBoxRight = nodeObj.x + nodeObj.width
						// if (selectedChildrenNodeIdArray.length > 0) {
						// 		var rightMostNodeObj2 = selectedChildrenNodeIdArray[selectedChildrenNodeIdArray.length - 1]
						// 		var rightMostNodeObjId2 = rightMostNodeObj2.id
						// 		rightMostNodeObj2 = self.get_node_obj_by_id(rightMostNodeObjId2)
						// 		var rightMostNodeRight2 = rightMostNodeObj2.x + rightMostNodeObj2.width
						// 		if (rightMostNodeRight2 > selectedBoxRight) {
						// 				selectedBoxRight = rightMostNodeRight2
						// 		}
						// }
						if (selectedAllChildrenNodeIdArray.length > 0) {
								var rightMostNodeObj = selectedAllChildrenNodeIdArray[selectedAllChildrenNodeIdArray.length - 1]
								if ((rightMostNodeObj.width + rightMostNodeObj.x) > selectedBoxRight) {
										selectedBoxRight = rightMostNodeObj.width + rightMostNodeObj.x
								}
								if (rightMostNodeObj.existed) {
										var rightMostNodeObjId = rightMostNodeObj.id
										rightMostNodeObj = self.get_node_obj_by_id(rightMostNodeObjId)
										var rightMostNodeRight = rightMostNodeObj.x + rightMostNodeObj.width
										if (rightMostNodeRight > selectedBoxRight) {
												selectedBoxRight = rightMostNodeRight
										}
								} else {
										var rightMostNodeObj = null
										for (var sI = (selectedAllChildrenNodeIdArray.length - 1); sI >= 0; sI--) {
												var nodeObj = selectedAllChildrenNodeIdArray[sI]
												//	向前找到第一个不存在的节点, 且层次最高; 如果节点不存在, 并且节点的深度比前一个节点的深度更大或者等于, 那么可以继续向前;
												// 否则就break, 该节点即是要找的节点
												// => 如果节点存在, 那么一定会break, 停在这个地方; 但是如果是因为节点存在从而停止, 那么就需要判断具体的原因
												if (!((!nodeObj.existed) && (selectedAllChildrenNodeIdArray[sI].depth >= selectedAllChildrenNodeIdArray[sI - 1].depth))) {
														rightMostNodeObj = nodeObj
														break
												}
										}
										var rightMostNodeRight = rightMostNodeObj.x + rightMostNodeObj.width
										if (rightMostNodeRight > selectedBoxRight) {
												selectedBoxRight = rightMostNodeRight
										}
								}
						}
						var selectedBoxHeight = +window.barcodeHeight * (1 - Variables.get('barcodePaddingBottomRatio'))
						selectedBoxLeft = selectedBoxLeft - window.barcodeNodeInterval / 2 + barcodeTreeNodePaddingLeft
						selectedBoxRight = selectedBoxRight + window.barcodeNodeInterval / 2 + barcodeTreeNodePaddingLeft
						var boxAttr = {
								top: 0,
								left: +selectedBoxLeft,
								right: +selectedBoxRight,
								bottom: +selectedBoxHeight
						}
						return boxAttr
				},
				/**
					* 获取所选择的子树的label部分的box的边界位置
					*/
				get_all_box_label_obj: function () {
						var self = this
						var allBoxLabelAttr = {}
						var thisBarcodeTreeId = self.get('barcodeTreeId')
						var selectedNodesId = window.Datacenter.barcodeCollection.selectedNodesId
						for (var nodeObjId in selectedNodesId) {
								var boxLabelObjId = nodeObjId + '=labelbox'
								var barcodeTreeId = selectedNodesId[nodeObjId].barcodeTreeId
								if (barcodeTreeId === thisBarcodeTreeId) {
										allBoxLabelAttr[boxLabelObjId] = self.get_single_box_label_attr()
								}
						}
						return allBoxLabelAttr
				},
				/**
					*  计算点击的节点的box
					*/
				get_single_box_label_attr: function () {
						var selectedLabelBoxHeight = +window.barcodeHeight * (1 - Variables.get('barcodePaddingBottomRatio'))
						var barcodeTreeNodePaddingLeft = Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft') - window.barcodeNodeInterval / 2
						var selectedLabelLeft = 0
						var selectedLabelRight = barcodeTreeNodePaddingLeft
						var labelBoxAttr = {
								top: +0,
								left: +selectedLabelLeft,
								right: +selectedLabelRight,
								bottom: +selectedLabelBoxHeight
						}
						return labelBoxAttr
				},
				/**
					* 获取节点为根的子树的宽度
					*/
				get_subtree_width_height: function (nodeId, barcodeNodeAttrArray) {
						var self = this
						var leveledNodeObj = self.get_leveled_node_obj(nodeId, barcodeNodeAttrArray)
						var wholeWidth = 0
						var height = 0
						for (var item in leveledNodeObj) {
								var barcodeLevelWidth = leveledNodeObj[item]
								wholeWidth = wholeWidth + barcodeLevelWidth
								height = height + 1
						}
						var treeAttr = {
								width: wholeWidth / height,
								height: height
						}
						return treeAttr
				},
				/**
					* 将以节点为根节点的子树中的所有节点进行分层
					*/
				get_leveled_node_obj: function (nodeId, barcodeNodeAttrArray) {
						var self = this
						var nodeDepth = 0
						var nodeStartIndex = 0
						var nodeEndIndex = 0
						var depthAttrPrefix = 'depth-'
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if (barcodeNodeAttrArray[bI].id === nodeId) {
										nodeStartIndex = bI
										nodeDepth = barcodeNodeAttrArray[bI].depth
										break
								}
						}
						for (var bI = (nodeStartIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
								if ((barcodeNodeAttrArray[bI].depth === nodeDepth) || (bI === (barcodeNodeAttrArray.length - 1))) {
										nodeEndIndex = bI
										break
								}
						}
						var leveledNodeObj = {}
						var barcodeWidthArray = Variables.get('barcodeWidthArray')
						for (var bI = nodeStartIndex; bI < nodeEndIndex; bI++) {
								var nodeDepth = barcodeNodeAttrArray[bI].depth
								if (barcodeNodeAttrArray[bI].existed) {
										if (barcodeWidthArray[nodeDepth] !== 0) {
												var nodeDepthAttrName = depthAttrPrefix + nodeDepth
												if (typeof (leveledNodeObj[nodeDepthAttrName]) !== 'undefined') {
														//  已经被初始化了
														leveledNodeObj[nodeDepthAttrName] = +leveledNodeObj[nodeDepthAttrName] + 1
												} else {
														//  还没有被初始化, 则设置初始值为1
														leveledNodeObj[nodeDepthAttrName] = 1
												}
										}
								}
						}
						return leveledNodeObj
				}
				,
				/**
					* 删除与选择的barcodeTree的子树部分的比较结果
					*/
				remove_comparison_results: function (removedNodeObjArray) {
						var self = this
						var selectedComparisonResults = self.get('selectedComparisonResults')
						for (var rI = 0; rI < removedNodeObjArray.length; rI++) {
								var removedNodeObj = removedNodeObjArray[rI]
								var nodeObjId = removedNodeObj.nodeObjId
								delete selectedComparisonResults[nodeObjId]
						}
				}
				,
				/**
					* 通过节点的id获取barcodeTree数组中的节点对象
					*/
				get_node_obj_by_id: function (nodeId) {
						var self = this
						var barcodeNodeAttrArrayObj = self.get('barcodeNodeAttrArrayObj')
						var nodeObj = barcodeNodeAttrArrayObj[nodeId]
						return nodeObj
				},
				/**
					* barcodeModel在添加的时候会默认增加barcode的index值, 在删除的时候需要默认的更新barcode的index值
					*/
				update_barcode_model_default_index: function () {
						var self = this
						var selectItemNameArray = Variables.get('selectItemNameArray')
						var barcodeTreeId = self.get('barcodeTreeId')
						//  barcodeTree的位置的index值
						var barcodeTreeIndex = selectItemNameArray.indexOf(barcodeTreeId)
						self.set('barcodeIndex', barcodeTreeIndex)
						var barcodeTreeYLocation = self.get('barcodeTreeYLocation')
				}
				,
				/**
					* 初始化两个索引对象, 方便用户根据id获取子树以及节点, 这一部分在barcode绘制之后进行
					*/
				update_tree_id_index_obj: function () {
						var self = this
						//  设置barcodeTree的总量
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						self.set('sumAttributeValue', barcodeNodeAttrArray[0].num)
						//  处理barcodeNodeAttrArray, 以barcodeNodeId为索引建立对象
						var barcodeNodeAttrArrayObj = {}
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								var barcodeNodeId = barcodeNodeAttrArray[bI].id
								barcodeNodeAttrArrayObj[barcodeNodeId] = barcodeNodeAttrArray[bI]
						}
						self.set('barcodeNodeAttrArrayObj', barcodeNodeAttrArrayObj)
				},
				/**
					* 初始化barcodeTree中节点数组中节点的existed属性
					*/
				init_barcodetree_array: function () {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								barcodeNodeAttrArray[bI].existed = true
						}
				},
				/**
					* 初始化编码属性值的barcode的节点数组
					*/
				add_attribute_height: function () {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var barcodeMaxAttribute = barcodeNodeAttrArray[0].num
						var barcodeHeight = barcodeNodeAttrArray[0].height
						var miniHeight = Variables.get('MIN_HEIGHT')
						var powExponenet = Variables.get('POW_EXPONENT')
						// var heightScale = d3.scale.linear().domain([0, barcodeMaxAttribute]).range([miniHeight, barcodeHeight]).clamp(true)
						var heightScale = self.get_height_scale()
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								barcodeNodeAttrArray[bI].height_value = heightScale(barcodeNodeAttrArray[bI].num)
						}
						//  更新barcodeTree的视图
						var barcodeTreeComparisonMode = Config.get('BARCODETREE_COMPARISON_MODE')
						var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['ATTRIBUTE']) {
								self.set('viewHeightUpdateValue', (self.get('viewHeightUpdateValue') + 1) % 2)
						}
				}
				,
				/**
					*  获取该barcodeTree的scale
					*/
				get_height_scale: function () {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
						var barcodeMaxAttribute = barcodeNodeAttrArray[0].num
						var barcodeHeight = +barcodeNodeAttrArray[0].height
						var miniHeight = Variables.get('MIN_HEIGHT')
						var powExponenet = Variables.get('POW_EXPONENT')
						var heightScale = d3.scale.pow().exponent(powExponenet).domain([0, barcodeMaxAttribute]).range([miniHeight, barcodeHeight]).clamp(true)
						return heightScale
				},
				/**
					* 对于单个barcodeTree的对齐部分进行更新
					*/
				update_single_barcode_subtree: function (rootId, rootCategory, rootLevel, cloneSubtreeNodeArray, cloneMaxNodeNumTreeNodeLocArray) {
						var self = this
						var barcodeTreeId = self.get('barcodeTreeId')
						var barcodeCollection = window.Datacenter.barcodeCollection
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						var replacedNodeObj = self.get_replaced_nodes_array(rootId, rootCategory, rootLevel, barcodeNodeAttrArray)
						//  为什么需要维持alignedBarcodeNodeAttrArray这个对象是因为在比较节点数目时, 需要首先按照MaxNodeNumTree确定一些节点的节点位置, 然后才能够依次排放其他的节点, 进而比较节点的数量
						var alignedReplaceNodeObj = self.get_replaced_nodes_array(rootId, rootCategory, rootLevel, alignedBarcodeNodeAttrArray)
						var replacedNodesArray = barcodeNodeAttrArray.splice(replacedNodeObj.subtreeRootIndex, replacedNodeObj.subtreeLength,...cloneSubtreeNodeArray
						)
						var alignedReplacedNodesArray = alignedBarcodeNodeAttrArray.splice(alignedReplaceNodeObj.subtreeRootIndex, alignedReplaceNodeObj.subtreeLength,...cloneMaxNodeNumTreeNodeLocArray
						)
						var allReplacedNodesObj = self.get_all_replace_nodes_obj(replacedNodesArray)
						//	对齐层级之后替换得到的对象
						var allAlignedReplacedNodesObj = self.get_all_replace_nodes_obj(alignedReplacedNodesArray)
						var replaceNodesObj = allReplacedNodesObj.replaceNodesObj
						var replaceNotExistedNodesObj = allReplacedNodesObj.replaceNotExistedNodesObj
						// 修改replace节点数组的nodeNum属性
						self.change_node_num_attr(replaceNodesObj, replaceNotExistedNodesObj, alignedBarcodeNodeAttrArray)
						// 根据replace得到的节点修改对齐之后的节点是否存在的属性
						// self.reset_node_num_attr(replaceNodesObj, replaceNotExistedNodesObj, barcodeNodeAttrArray)
						self.change_exist_num_attr(replacedNodesArray, replaceNodesObj, replaceNotExistedNodesObj, barcodeNodeAttrArray)
						// console.log('barcodeNodeAttrArray', JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
						var alignedNodeIndexObjArray = self.get_aligned_node_index_array(barcodeNodeAttrArray)
						//  根据alignedbarcodeNodeAttrArray建立索引构建alignedBarcodeNodeAttrObj
						self.build_aligned_barcode_node_obj()
				},
				/**
					* 更新对于所增加的barcode的相关统计信息, 主要包括在不同的层级范围内的节点的数量信息
					*/
				update_statistics_info: function () {
						var self = this
						var maxDepth = Variables.get('maxDepth')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var leveledNodeNumArray = []
						for (var mI = 0; mI <= maxDepth; mI++) {
								leveledNodeNumArray.push(0)
						}
						//  计算barcode节点数组中不同层级的节点的数量
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								var nodeDepth = barcodeNodeAttrArray[bI].depth
								for (var ibI = nodeDepth; ibI <= maxDepth; ibI++) {
										leveledNodeNumArray[ibI] = leveledNodeNumArray[ibI] + 1
								}
						}
						//  得到所有的层次结构数据中不同层次节点的数目的最大值, 从而用于计算对应的scale
						var maxLeveledNumArray = Variables.get('maxLeveledNumArray')
						if (maxLeveledNumArray.length === 0) {
								maxLeveledNumArray = leveledNodeNumArray
						} else {
								for (var lI = 0; lI < leveledNodeNumArray.length; lI++) {
										if (leveledNodeNumArray[lI] > maxLeveledNumArray[lI]) {
												maxLeveledNumArray[lI] = leveledNodeNumArray[lI]
										}
								}
						}
						Variables.set('maxLeveledNumArray', maxLeveledNumArray)
				},
				/**
					* 获取barcodeTree中节点数组中的最大的属性值
					*/
				get_max_node_value: function () {
						var self = this
						var maxNodeValue = 0
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if ((barcodeNodeAttrArray[bI].existed) && (barcodeNodeAttrArray[bI].width !== 0)) {
										var nodeValue = barcodeNodeAttrArray[bI].num
										if (nodeValue > maxNodeValue) {
												maxNodeValue = nodeValue
										}
								}
						}
						return maxNodeValue
				},
				/**
					* 按照uniform布局模式更新barcode的高度
					*/
				uniform_layout_height_update: function () {
						var self = this
						var selectItemNameArray = Variables.get('selectItemNameArray')
						var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var heightScale = self.get_height_scale()
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								barcodeNodeAttrArray[bI].height = window.barcodeHeight * barcodeHeightRatio
								barcodeNodeAttrArray[bI].height_value = heightScale(barcodeNodeAttrArray[bI].num)
						}
				},
				/**
					* 对于新增加的barcodeModel需要折叠所有的记录的被折叠的子树
					*/
				collapse_all_subtree: function () {
						var self = this
						var barcodeCollection = window.Datacenter.barcodeCollection
						var collapsedNodeIdArray = barcodeCollection.get_collapse_node_id_array()
						var collapsedNodeObjArray = []
						for (var cI = 0; cI < collapsedNodeIdArray.length; cI++) {
								var collapseNodeDepth = +collapsedNodeIdArray[cI].split('-')[1]
								collapsedNodeObjArray.push({
										id: collapsedNodeIdArray[cI],
										depth: collapseNodeDepth
								})
						}
						for (var cI = 0; cI < collapsedNodeObjArray.length; cI++) {
								var collapsedNodeId = collapsedNodeObjArray[cI].id
								var collapseNodeDepth = collapsedNodeObjArray[cI].depth
								self.collapse_subtree(collapsedNodeId, collapseNodeDepth)
						}
				}
				,
				/**
					* 按照现有的tablelens方法使用tablelens的方法对于传入的进行变形
					*/
				tablelens_single_subtree: function () {
						var self = this
						var barcodeCollection = window.Datacenter.barcodeCollection
						var tablelensSubtreeArray = barcodeCollection.get_tablelens_subtree_array()
						var ratioAndSubtreeObj = barcodeCollection.get_focus_ratio_obj(tablelensSubtreeArray)
						if ((ratioAndSubtreeObj != null) && (tablelensSubtreeArray.length !== 0)) {
								self.tablelens_interested_subtree(tablelensSubtreeArray, ratioAndSubtreeObj)
						}
				}
				,
				/**
					* 获取子树在原始节点数组中替换的范围
					*/
				get_replaced_nodes_array: function (rootId, rootCategory, rootLevel, barcodeNodeAttrArray) {
						var self = this
						var subtreeRootIndex = -1
						var subtreeLength = 1
						var replacedNodeObj = {}
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if (barcodeNodeAttrArray[bI].id === rootId) {
										subtreeRootIndex = bI
										break
								}
						}
						//  如果在该子树中存在想要替换的子树, 那么计算该子树的长度, 否则替换的子树长度为0
						if (subtreeRootIndex !== -1) {
								for (var bI = (subtreeRootIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
										if (barcodeNodeAttrArray[bI].depth > rootLevel) {
												subtreeLength = subtreeLength + 1
										} else if (barcodeNodeAttrArray[bI].depth <= rootLevel) {
												break
										}
								}
						} else {
								var rootCategoryNum = rootCategory
								//  不能够找到该节点的情况下
								for (var bI = 1; bI < barcodeNodeAttrArray.length; bI++) {
										var thisCategory = barcodeNodeAttrArray[bI].category
										if ((thisCategory != NaN) && (rootCategoryNum != NaN)) {
												if (self.is_first_category_bigger(thisCategory, rootCategoryNum)) {
														subtreeRootIndex = bI
														break
												}
										}
								}
								subtreeLength = 0
						}
						if (subtreeRootIndex === -1) {
								/**
									*  如果在整个barcodeTree的节点数组中没有找到比目标的节点的序数更大的节点,
									*  那么只需要将对齐部分的节点拼接在BarcodeTree节点的后面
									*/
								subtreeRootIndex = barcodeNodeAttrArray.length
						}
						replacedNodeObj.subtreeRootIndex = subtreeRootIndex
						replacedNodeObj.subtreeLength = subtreeLength
						return replacedNodeObj
				}
				,
				/**
					* 判断两个category的数值的先后关系
					*/
				is_first_category_bigger: function (later_category, former_category) {
						later_category = later_category.toString()
						former_category = former_category.toString()
						var splitCharacter = window.split_character
						var formerCategoryArray = former_category.split(splitCharacter)
						var laterCategoryArray = later_category.split(splitCharacter)
						//  如果length不同, 那么比较的准则明确, 哪一个数字的位数比较大, 那么这个数字就较大, 因为位数小的是因为前面有0
						for (var fI = 0; fI < formerCategoryArray.length; fI++) {
								if ((+formerCategoryArray[fI]) < (+laterCategoryArray[fI])) {
										return true
								} else if ((+formerCategoryArray[fI]) === (+laterCategoryArray[fI])) {
										//  相等就继续下一轮的比较
								} else {
										break
								}
						}
						return false
				}
				,
				/**
					* 为了计算包围点击的barcodeTree中子树的box, 因此计算
					*/
				get_all_children_node_x: function (nodeObjId) {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var nodeIndex = 0
						var nodeDepth = 0
						var maxRightChildX = 0
						for (nodeIndex = 0; nodeIndex < barcodeNodeAttrArray.length; nodeIndex++) {
								var barcodeNodeObj = barcodeNodeAttrArray[nodeIndex]
								if (barcodeNodeObj.id === nodeObjId) {
										nodeDepth = barcodeNodeObj.depth
										break
								}
						}
						for (; nodeIndex < barcodeNodeAttrArray.length; nodeIndex++) {
								var barcodeNodeObj = barcodeNodeAttrArray[nodeIndex]
								var rightChildX = barcodeNodeObj.x + barcodeNodeObj.width
								if (rightChildX > maxRightChildX) {
										maxRightChildX = rightChildX
								}
								if (nodeDepth === barcodeNodeObj.depth) {
										break
								}
						}
						return maxRightChildX
				}
				,
				/**
					* 为alignedBarcode中的节点建立索引, 从而构成alignedBarcodeNodeAttrObj对象
					*/
				build_aligned_barcode_node_obj: function () {
						var self = this
						var alignedBarcodeNodeAttrObj = {}
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						for (var aI = 0; aI < alignedBarcodeNodeAttrArray.length; aI++) {
								var nodeId = alignedBarcodeNodeAttrArray[aI].id
								alignedBarcodeNodeAttrObj[nodeId] = alignedBarcodeNodeAttrArray[aI]
						}
						self.set('alignedBarcodeNodeAttrObj', alignedBarcodeNodeAttrObj)
				},
				/**
					* 重新设置节点的属性值
					*/
				// reset_node_num_attr: function (replaceNodesObj, replaceNotExistedNodesObj, barcodeNodeAttrArray) {
				// 		var self = this
				// 		for (var aI = 0; aI < barcodeNodeAttrArray.length; aI++) {
				// 				var nodeId = barcodeNodeAttrArray[aI].id
				// 				if (typeof(replaceNodesObj[nodeId]) !== 'undefined') {
				// 						// replaceNodesObj[nodeId].sumNodeNum = alignedBarcodeNodeAttrArray[aI].nodeNum
				// 						alignedBarcodeNodeAttrArray[aI].nodeNum
				// 				}
				// 				if (typeof(replaceNotExistedNodesObj[nodeId]) !== 'undefined') {
				// 						replaceNotExistedNodesObj[nodeId].sumNodeNum = alignedBarcodeNodeAttrArray[aI].nodeNum
				// 				}
				// 		}
				// },
				/**
					* 改变replacedNodesArray中的node num的节点属性值
					*/
				change_node_num_attr: function (replaceNodesObj, replaceNotExistedNodesObj, alignedBarcodeNodeAttrArray) {
						var self = this
						for (var aI = 0; aI < alignedBarcodeNodeAttrArray.length; aI++) {
								var nodeId = alignedBarcodeNodeAttrArray[aI].id
								if (typeof(replaceNodesObj[nodeId]) !== 'undefined') {
										alignedBarcodeNodeAttrArray[aI].num = replaceNodesObj[nodeId].num
										alignedBarcodeNodeAttrArray[aI].color_value = replaceNodesObj[nodeId].color_value
								}
								if (typeof(replaceNotExistedNodesObj[nodeId]) !== 'undefined') {
										alignedBarcodeNodeAttrArray[aI].num = replaceNotExistedNodesObj[nodeId].num
								}
						}
				},
				/**
					* 获取replaceNodesObj
					*/
				get_all_replace_nodes_obj: function (replacedNodesArray) {
						var self = this
						var replaceNodesObj = {}
						var replaceNotExistedNodesObj = {}
						for (var rI = 0; rI < replacedNodesArray.length; rI++) {
								if (replacedNodesArray[rI].existed) { //&& ()
										replaceNodesObj[replacedNodesArray[rI].id] = replacedNodesArray[rI]
								} else {
										replaceNotExistedNodesObj[replacedNodesArray[rI].id] = replacedNodesArray[rI]
								}
						}
						var allReplaceNodesObj = {
								replaceNodesObj: replaceNodesObj,
								replaceNotExistedNodesObj: replaceNotExistedNodesObj
						}
						return allReplaceNodesObj
				}
				,
				/**
					* 将新增加的nodeArray中的属性existed赋值为true
					*/
				change_exist_num_attr: function (replacedNodesArray, replaceNodesObj, replaceNotExistedNodesObj, barcodeNodeAttrArray) {
						var self = this
						//  如果替换的是整个barcodeTree,需要在获取heightScale之前更新barcodeTree根节点的属性值
						if (typeof (replacedNodesArray) !== 'undefined') {
								if (replacedNodesArray.length > 0) {
										if (replacedNodesArray[0].category === 'root') {
												barcodeNodeAttrArray[0].num = replacedNodesArray[0].num
										}
								}
						}
						var heightScale = self.get_height_scale()
						var barcodeNodeAttrArrayObj = self.get('barcodeNodeAttrArrayObj')
						//  在使用supertree替换了之前子树的节点数组之后, 需要利用替换的结果, 对于替换之后的节点数组中的节点进行标记
						//  在替换之前存在的节点的existed属性均为true, 在替换之后将之前存在的节点属性设置为true
						for (var cI = 0; cI < barcodeNodeAttrArray.length; cI++) {
								var nodeId = barcodeNodeAttrArray[cI].id
								if (typeof(replaceNodesObj[nodeId]) !== 'undefined') {
										//	如果这个节点存在
										barcodeNodeAttrArray[cI].existed = true
										barcodeNodeAttrArray[cI].num = replaceNodesObj[nodeId].num
										// barcodeNodeAttrArray[cI].height_value = heightScale(barcodeNodeAttrArray[cI].num)
										barcodeNodeAttrArray[cI].height_value = replaceNodesObj[nodeId].height_value
										barcodeNodeAttrArray[cI].color_value = replaceNodesObj[nodeId].color_value
										barcodeNodeAttrArrayObj[nodeId] = barcodeNodeAttrArray[cI]
								} else if (typeof (replaceNotExistedNodesObj[nodeId]) !== 'undefined') {
										//	如果这个节点不存在
										barcodeNodeAttrArray[cI].existed = false
										barcodeNodeAttrArray[cI].height_value = 0
										barcodeNodeAttrArray[cI].similarity = 0
										//  计算的是barcode节点上的属性值大小
										barcodeNodeAttrArray[cI].num = 0
								}
						}
				}
				,
				/**
					* 获取get_aligned_node_array
					*/
				get_aligned_node_index_array: function (barcodeNodeAttrArray) {
						var self = this
						var barcodeCollection = window.Datacenter.barcodeCollection
						var alignedNodeIdArray = barcodeCollection.get_aligned_node_id_array()
						var alignedNodeIndexObjArray = []
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								var barcodeNode = barcodeNodeAttrArray[bI]
								var barcodeNodeId = barcodeNode.id
								var barcodeNodeDepth = barcodeNode.depth
								if (alignedNodeIdArray.indexOf(barcodeNodeId) !== -1) {
										alignedNodeIndexObjArray.push({id: barcodeNodeId, index: bI, depth: barcodeNodeDepth})
								}
						}
						return alignedNodeIndexObjArray
				},
				/**
					* 更新当前的barcode zoomed子树的范围
					*/
				// update_zoomed_range_location: function () {
				// 		var self = this
				// 		var BARCODETREE_VIEW_SETTING = Config.get('BARCODETREE_VIEW_SETTING')
				// 		var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
				// 		var globalZoomRangeObjArray = self.get('globalZoomRangeObjArray')
				// 		var globalPaddingRangeObjArray = self.get('globalPaddingRangeObjArray1')
				// 		//  如果global zoom对象数组为空, 或者global padding的对象数组为空
				// 		if ((globalZoomRangeObjArray.length === 0) || (globalPaddingRangeObjArray.length === 0)) {
				// 				return
				// 		}
				// 		var nodeLoc = 0
				// 		var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
				// 		for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
				// 				barcodeNodeAttrArray[bI].x = nodeLoc
				// 				if (is_in_global_padding_range(bI, globalPaddingRangeObjArray)) {
				// 						if (is_global_padding_end(bI, globalPaddingRangeObjArray)) {
				// 								//  判断节点是否处在padding节点的end位置处
				// 								var barcodeNodePaddingLength = BARCODETREE_VIEW_SETTING['BARCODE_NODE_PADDING_LENGTH']
				// 								nodeLoc = nodeLoc + barcodeNodePaddingLength + barcodeNodeInterval
				// 						}
				// 						var isPaddingNodeStart = is_global_padding_start(bI, globalPaddingRangeObjArray)
				// 						if (isPaddingNodeStart !== -1) {
				// 								//  判断节点是否处在padding节点的start位置处
				// 								globalPaddingRangeObjArray[isPaddingNodeStart].paddingNodeX = nodeLoc
				// 						}
				// 				} else if (is_in_global_zoom_range(bI, globalZoomRangeObjArray)) {
				// 						nodeLoc = nodeLoc + barcodeNodeAttrArray[bI].width + barcodeNodeInterval
				// 				}
				// 		}
				// 		//  是否在global padding的范围内
				// 		function is_in_global_padding_range(bI, globalPaddingRangeObjArray) {
				// 				for (var gI = 0; gI < globalPaddingRangeObjArray.length; gI++) {
				// 						var paddingNodeStartIndex = globalPaddingRangeObjArray[gI].paddingNodeStartIndex
				// 						var paddingNodeEndIndex = globalPaddingRangeObjArray[gI].paddingNodeEndIndex
				// 						if ((bI >= paddingNodeStartIndex) && (bI <= paddingNodeEndIndex)) {
				// 								return true
				// 						}
				// 				}
				// 				return false
				// 		}
				//
				// 		//  判断节点是否在global zoom的范围内
				// 		function is_in_global_zoom_range(bI, globalZoomRangeObjArray) {
				// 				for (var gI = 0; gI < globalZoomRangeObjArray.length; gI++) {
				// 						var rangeStartNodeIndex = globalZoomRangeObjArray[gI].rangeStartNodeIndex
				// 						var rangeEndNodeIndex = globalZoomRangeObjArray[gI].rangeEndNodeIndex
				// 						if ((bI >= rangeStartNodeIndex) && (bI <= rangeEndNodeIndex)) {
				// 								return true
				// 						}
				// 				}
				// 				return false
				// 		}
				//
				// 		//  判断节点是否在padding的开始位置处
				// 		function is_global_padding_end(bI, globalPaddingRangeObjArray) {
				// 				for (var gI = 0; gI < globalPaddingRangeObjArray.length; gI++) {
				// 						var paddingNodeEndIndex = globalPaddingRangeObjArray[gI].paddingNodeEndIndex
				// 						if (bI === paddingNodeEndIndex) {
				// 								return true
				// 						}
				// 				}
				// 				return false
				// 		}
				//
				// 		//  判断节点是否在padding的开始位置处
				// 		function is_global_padding_start(bI, globalPaddingRangeObjArray) {
				// 				for (var gI = 0; gI < globalPaddingRangeObjArray.length; gI++) {
				// 						var paddingNodeStartIndex = globalPaddingRangeObjArray[gI].paddingNodeStartIndex
				// 						if (bI === paddingNodeStartIndex) {
				// 								return gI
				// 						}
				// 				}
				// 				return -1
				// 		}
				// },
				/**
					* 清空global的对齐情况下的zoom子树的范围
					*/
				// clear_global_zoom_ralated_range: function () {
				// 		var self = this
				// 		self.set('globalZoomRangeObjArray', [])
				// 		self.set('globalPaddingRangeObjArray', [])
				// 		self.set('global_padding_start_id_array', [])
				// 		self.set('global_padding_range_id_array', [])
				// },
				/**
					* 计算global的对齐情况下的zoom子树的范围
					*/
				// compute_global_zoom_subtree_range: function (globalAlignedNodeIdArray) {
				// 		var self = this
				// 		var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
				// 		var globalZoomRangeObjArray = self.compute_aligned_node_range_stat(barcodeNodeAttrArray, globalAlignedNodeIdArray)
				// 		self.set('globalZoomRangeObjArray', globalZoomRangeObjArray)
				// },
				/**
					* 计算每个barcode对齐的节点范围以及节点对齐的长度
					*/
				compute_single_aligned_subtree_range: function (alignedNodeIdArray) {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var alignedRangeObjArray = self.compute_aligned_node_range_stat(barcodeNodeAttrArray, alignedNodeIdArray)
						self.set('alignedRangeObjArray', alignedRangeObjArray)
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						var _alignedRangeObjArray = self.compute_aligned_node_range_stat(alignedBarcodeNodeAttrArray, alignedNodeIdArray)
						self.set('_alignedRangeObjArray', _alignedRangeObjArray)
				}
				,
				/**
					* 传入节点数组和对齐的节点的id的数组, 具体计算对齐节点的范围以及统计信息
					*/
				compute_aligned_node_range_stat: function (barcodeNodeAttrArray, alignedNodeIdArray) {
						var self = this
						var alignedRangeObjArray = []
						var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
						for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
								//  根据aligned节点得到节点的index数值
								var rangeStartNodeIndex = self.get_node_index_from_id(alignedNodeIdArray[aI], barcodeNodeAttrArray)
								if (typeof (rangeStartNodeIndex) !== 'undefined') {
										//  根据开始的节点的index数值, 计算align结束的index数值范围
										var rangeEndNodeIndex = getAlignedNodeRangeEnd(rangeStartNodeIndex, barcodeNodeAttrArray)
										var rangeStartX = barcodeNodeAttrArray[rangeStartNodeIndex].x
										var rangeEndX = barcodeNodeAttrArray[rangeEndNodeIndex].x + barcodeNodeAttrArray[rangeEndNodeIndex].width + barcodeNodeInterval
										//  对于BarcodeTree进行切割产生的间距, 用来绘制barcodeTree之间的连线
										var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
										var BarcodeTreeSplitWidth = 0
										var BarcodeTree_Split = BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split']
										if (BarcodeTree_Split) {
												BarcodeTreeSplitWidth = Variables.get('BarcodeTree_Split_Width')
										}
										//  对齐节点的长度
										var alignedLength = rangeEndX - rangeStartX//+ barcodeNodePadding
										alignedRangeObjArray.push({
												'alignedObjIndex': aI,
												'alignedObjId': barcodeNodeAttrArray[rangeStartNodeIndex].id,
												'rangeStartNodeIndex': rangeStartNodeIndex,
												'rangeEndNodeIndex': rangeEndNodeIndex,
												'alignedLength': alignedLength, //+ BarcodeTreeSplitWidth,
												'alignedEmpty': false
										})
								} else {
										var rangeRelatedNodeIndex = self.get_related_index_from_id(alignedNodeIdArray[aI], barcodeNodeAttrArray)
										alignedRangeObjArray.push({
												'alignedObjIndex': aI,
												'alignedObjId': barcodeNodeAttrArray[rangeRelatedNodeIndex].id,
												'rangeStartNodeIndex': rangeRelatedNodeIndex,
												'rangeEndNodeIndex': rangeRelatedNodeIndex - 1,
												'alignedLength': 0,
												'alignedEmpty': true
										})
								}
						}
						alignedRangeObjArray.sort(function (a1, a2) {
								return a1.rangeStartNodeIndex - a2.rangeStartNodeIndex
						})
						return alignedRangeObjArray
						//  获得barcodeTree对齐部分借书的节点index
						function getAlignedNodeRangeEnd(nodeIndex, barcodeNodeAttrArray) {
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								// if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
								if (typeof (barcodeNodeAttrArray[nodeIndex]) === 'undefined') {
										return nodeIndex
								}
								var nodeLevel = barcodeNodeAttrArray[nodeIndex].depth
								for (var bI = (nodeIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
										if (barcodeNodeAttrArray[bI].depth <= nodeLevel) {
												return bI - 1
										}
								}
								if ((bI === barcodeNodeAttrArray.length) || (nodeIndex === 0)) {
										return barcodeNodeAttrArray.length - 1
								}
						}
				}
				,
				/**
					*  计算global对齐的情况下的padding子树的范围
					*/
				compute_global_padding_subtree_range: function () {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var globalZoomRangeObjArray = self.get('globalZoomRangeObjArray')
						var globalPaddingRangeObjArray = self.compute_padding_node_range_stat(globalZoomRangeObjArray, barcodeNodeAttrArray)
						self.set('globalPaddingRangeObjArray', globalPaddingRangeObjArray)
				}
				,
				/**
					* 计算padding node的节点位置, 并且计算padding node伸展情况下的长度
					*/
				init_padding_node_location: function () {
						var self = this
						var alignedRangeObjArray = self.get('alignedRangeObjArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var paddingNodeObjArray = self.compute_padding_node_range_stat(alignedRangeObjArray, barcodeNodeAttrArray)
						self.set('paddingNodeObjArray', paddingNodeObjArray)
						var _alignedRangeObjArray = self.get('_alignedRangeObjArray')
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						var _paddingNodeObjArray = self.compute_padding_node_range_stat(_alignedRangeObjArray, alignedBarcodeNodeAttrArray)
						self.set('_paddingNodeObjArray', _paddingNodeObjArray)
				}
				,
				/**
					* 计算padding node节点的范围
					*/
				compute_padding_node_range_stat: function (alignedRangeObjArray, barcodeNodeAttrArray) {
						var self = this
						var paddingNodeObjArray = null
						var displayMode = Variables.get('displayMode')
						if (alignedRangeObjArray.length > 0) {
								paddingNodeObjArray = [{
										'paddingNodeStartIndex': 0,
										'is_removed': false
								}]
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										// if(alignedRangeObjArray[aI].empty)
										paddingNodeObjArray[paddingNodeObjArray.length - 1].paddingNodeEndIndex = alignedRangeObjArray[aI].rangeStartNodeIndex - 1
										//  ==================================
										if ((alignedRangeObjArray[aI].rangeEndNodeIndex + 1) < barcodeNodeAttrArray.length) {
												paddingNodeObjArray.push({
														'paddingNodeStartIndex': alignedRangeObjArray[aI].rangeEndNodeIndex + 1,
														'is_removed': false
												})
										}
								}
								//  当节点align的范围持续到最后barcodeNodeAttrArray的末尾节点, 那么就不需要修改paddingNodeEndIndex
								if ((alignedRangeObjArray[alignedRangeObjArray.length - 1].rangeEndNodeIndex + 1) < barcodeNodeAttrArray.length) {
										paddingNodeObjArray[paddingNodeObjArray.length - 1].paddingNodeEndIndex = barcodeNodeAttrArray.length - 1
								}
						} else {
								paddingNodeObjArray = []
						}
						paddingNodeObjArray.sort(function (p1, p2) {
								return p1.paddingNodeStartIndex - p2.paddingNodeStartIndex
						})
						for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
								var paddingNodeStatisticObj = computePaddingNodeStatistic(paddingNodeObjArray[pI], barcodeNodeAttrArray)
								paddingNodeObjArray[pI].paddingNodeId = paddingNodeStatisticObj.paddingNodeId
								paddingNodeObjArray[pI].maxNodeWidth = paddingNodeStatisticObj.maxNodeWidth
								//  计算得到paddingNode的长度
								paddingNodeObjArray[pI].maxPaddingNodeLength = paddingNodeStatisticObj.paddingNodeLength
								//  计算得到paddingNode所指代范围的节点数量
								paddingNodeObjArray[pI].paddingNodeNumber = paddingNodeStatisticObj.paddingNodeNumber
								paddingNodeObjArray[pI].maxpaddingNodeNumber = paddingNodeStatisticObj.paddingNodeNumber
								paddingNodeObjArray[pI].minpaddingNodeNumber = paddingNodeStatisticObj.paddingNodeNumber
								//  计算得到paddingNode所指代范围的属性值大小
								paddingNodeObjArray[pI].paddingNodeAttrNum = paddingNodeStatisticObj.paddingNodeAttrNum
								paddingNodeObjArray[pI].maxpaddingNodeAttrNum = paddingNodeStatisticObj.paddingNodeAttrNum
								paddingNodeObjArray[pI].minpaddingNodeAttrNum = paddingNodeStatisticObj.paddingNodeAttrNum
						}
						return paddingNodeObjArray
						//  计算paddingNode的节点的index的范围的统计信息
						function computePaddingNodeStatistic(paddingNodeObj, barcodeNodeAttrArray) {
								var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
								var paddingNodeStartIndex = +paddingNodeObj.paddingNodeStartIndex
								var paddingNodeEndIndex = +paddingNodeObj.paddingNodeEndIndex
								var paddingNodeId = barcodeNodeAttrArray[paddingNodeStartIndex].id
								var selectedLevels = Variables.get('selectedLevels')
								var paddingNodeLength = 0
								var paddingNodeNumber = 0
								var paddingNodeAttrNum = 0
								var maxNodeWidth = 0
								for (var pI = +paddingNodeStartIndex; pI <= paddingNodeEndIndex; pI++) {
										var depth = barcodeNodeAttrArray[pI].depth
										if (barcodeNodeAttrArray[pI].width > maxNodeWidth) {
												maxNodeWidth = barcodeNodeAttrArray[pI].width
										}
										if (selectedLevels.indexOf(depth) !== -1) {
												if (barcodeNodeAttrArray[pI].width !== 0) {
														paddingNodeLength = paddingNodeLength + barcodeNodeAttrArray[pI].width + barcodeNodeInterval
												}
										}
										var deepestLevel = selectedLevels.max()
										if ((barcodeNodeAttrArray[pI].existed) && (selectedLevels.indexOf(depth) !== -1)) {
												paddingNodeNumber = paddingNodeNumber + 1
												if (depth === deepestLevel) {
														//  计算padding部分的属性只需要计算最底层节点的属性值之和, 因为上层节点的属性值计算会出现重复的结果
														paddingNodeAttrNum = paddingNodeAttrNum + barcodeNodeAttrArray[pI].num
												}
										}
								}
								//  paddingNodeLength是所有的paddingNode的长度, paddingNodeNumber是所有的padding的长度, paddingNodeAttrNum是所有paddingNode的属性值之和
								var paddingNodeStatisticObj = {
										paddingNodeId: paddingNodeId,
										maxNodeWidth: maxNodeWidth,
										paddingNodeLength: paddingNodeLength,
										paddingNodeNumber: paddingNodeNumber,
										paddingNodeAttrNum: paddingNodeAttrNum
								}
								// paddingNodeLength = paddingNodeLength - barcodeNodeInterval
								return paddingNodeStatisticObj
						}
				}
				,
				/*
					* 在计算得到padding node和aligned node之后, 更新barcodeNodeAttr的节点的属性
					* 在singleView中对于paddingNodeArray与alignedNodeArray进行更新之后, 调用这个方法可以更新barcodeNodeAttr的属性值
					* **********************
					* 具体算法: 对于节点的更新主要是按照节点的类型计算其节点的位置, 节点的类型主要包括:
					* 初始对齐节点 - 对于该类节点,需要从前向后一次增加, 在这个过程中将align部分考虑在内
					* 对齐节点中部的节点 - 该类节点是基于对齐部分的初始节点, 依次向后增加
					* padding节点 - padding节点的特点是在该范围内的节点的x不会依次向后增加
					*/
				update_barcode_node_array: function () {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var alignedLevel = Variables.get('alignedLevel')
						var displayedLastLevel = Variables.get('displayedLastLevel')
						var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
						var comparisonResultPadding = Variables.get('comparisonResultPadding')
						var alignedBegin = self.get('ALIGN_START')
						var alignedRange = self.get('ALIGN_RANGE')
						var paddingRange = self.get('PADDING_RANGE')
						var paddingBegin = self.get('PADDING_BEGIN')
						var alignedRangeObjArray = self.get('alignedRangeObjArray')
						var paddingNodeObjArray = self.get('paddingNodeObjArray')
						var compactAlignedRangeObjArray = self.get('compactAlignedRangeObjArray')
						var compactPaddingNodeObjArray = self.get('compactPaddingNodeObjArray')
						nodeLocUpdate(barcodeNodeAttrArray, alignedRangeObjArray, paddingNodeObjArray)
						self.update_padding_node_location()
						//  非compact形式的barcodeNodeArray更新节点属性
						function nodeLocUpdate(barcodeNodeAttrArray, alignedRangeObjArray, paddingNodeObjArray) {
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var Subtree_Compact = BARCODETREE_GLOBAL_PARAS['Subtree_Compact']
								var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
								//  对于BarcodeTree进行切割产生的间距, 用来绘制barcodeTree之间的连线
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var BarcodeTreeSplitWidth = 0
								var BarcodeTree_Split = BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split']
								if (BarcodeTree_Split) {
										BarcodeTreeSplitWidth = Variables.get('BarcodeTree_Split_Width')
								}
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										//  默认的初始对于barcodeNodeAttrArray中的节点进行赋值, 放止在不存在padding和align节点的情况下的异常情况
										if ((bI - 1) >= 0) {
												if (barcodeNodeAttrArray[bI - 1].width !== 0) {
														barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width + barcodeNodeInterval
												} else {
														barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x
												}
										} else {
												barcodeNodeAttrArray[bI].x = 0
										}
										//  下面是针对实际情况节点位置的计算
										// var nodeType = self._node_category(bI, alignedRangeObjArray, paddingNodeObjArray)
										var nodeType = self._node_category(barcodeNodeAttrArray[bI].id)
										if (nodeType === alignedBegin) {
												// barcodeNodeAttrArray[ bI ].x = barcodeNodeAttrArray[ bI - 1 ].x + barcodeNodePadding + comparisonResultPadding
												barcodeNodeAttrArray[bI].x = getAlignedNodeLoc(bI, alignedRangeObjArray, paddingNodeObjArray)
										} else if (nodeType === alignedRange) {
												//  当节点的深度小于aligned的深度时, 此时不需要考虑节点是否存在, 对于每一个节点都要计算节点的位置进行排列
												if ((bI - 1) >= 0) {
														if (barcodeNodeAttrArray[bI - 1].width !== 0) {
																barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width + barcodeNodeInterval
														} else {
																barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x
														}
												} else {
														barcodeNodeAttrArray[bI].x = 0
												}
										} else if (nodeType === paddingBegin) {
												if (bI > 0) {
														barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width + barcodeNodeInterval + BarcodeTreeSplitWidth
												} else {
														barcodeNodeAttrArray[bI].x = 0
												}
										} else if (nodeType === paddingRange) {
												if ((bI - 1) >= 0) {
														var paddingRangeObj = self.get_padding_range_obj(barcodeNodeAttrArray[bI].id)
														//	TODO
														if (Subtree_Compact || paddingRangeObj.is_removed) {
																//  如果subtree处于压缩状态, 那么padding范围的节点就不会累加
																barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x
														} else {//  如果subtree处于非压缩状态, 那么padding范围的节点就依次累加
																if (barcodeNodeAttrArray[bI - 1].width !== 0) {
																		barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width + barcodeNodeInterval
																} else {
																		barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x
																}
														}
												} else {
														barcodeNodeAttrArray[bI].x = 0
												}
										}
								}
						}

						function getAlignedNodeLoc(nodeIndex, alignedRangeObjArray, paddingNodeObjArray) {
								var BARCODETREE_VIEW_SETTING = Config.get('BARCODETREE_VIEW_SETTING')
								var barcodeNodePaddingLength = BARCODETREE_VIEW_SETTING['BARCODE_NODE_PADDING_LENGTH']
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var Subtree_Compact = BARCODETREE_GLOBAL_PARAS['Subtree_Compact']
								var Comparison_Result_Display = BARCODETREE_GLOBAL_PARAS['Comparison_Result_Display']
								var comparisonResultPadding = 0
								if (Comparison_Result_Display) {
										comparisonResultPadding = Variables.get('comparisonResultPadding')
								}
								var BarcodeTree_Split = BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split']
								var BarcodeTreeSplitWidth = 0
								if (BarcodeTree_Split) {
										BarcodeTreeSplitWidth = Variables.get('BarcodeTree_Split_Width')
								}
								var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
								var alignedNodeLoc = 0
								for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
										//  因为在padding node所代表的节点为空时, paddingNodeEndIndex是小于paddingNodeStartIndex的
										if ((nodeIndex >= paddingNodeObjArray[pI].paddingNodeStartIndex) || (nodeIndex >= paddingNodeObjArray[pI].paddingNodeEndIndex)) {
												var maxPaddingNodeLength = paddingNodeObjArray[pI].maxPaddingNodeLength
												if (typeof (maxPaddingNodeLength) === 'undefined') {
														maxPaddingNodeLength = 0
												}
												if ((Subtree_Compact) || (paddingNodeObjArray[pI].is_removed)) {//  如果subtree处于压缩状态, 那么累加计算距离时, 增加的是barcodePadding节点的宽度
														if (paddingNodeObjArray[pI].paddingNodeStartIndex <= paddingNodeObjArray[pI].paddingNodeEndIndex) {
																//  如果不是一个空白的paddingNode节点, 那么就需要增加新的barcodeNodePaddingLength的长度
																if (Subtree_Compact) {
																		alignedNodeLoc = alignedNodeLoc + barcodeNodePaddingLength + comparisonResultPadding + BarcodeTreeSplitWidth + barcodeNodeInterval * 2
																} else {
																		alignedNodeLoc = alignedNodeLoc + comparisonResultPadding + BarcodeTreeSplitWidth + barcodeNodeInterval * 2
																}
														} else {
																if (paddingNodeObjArray[pI].maxPaddingNodeLength === 0) {
																		//  如果是所有的barcodeTree中该节点是一个空白节点, 那么就不会增加新的barcodeNodePaddingLength的长度
																		alignedNodeLoc = alignedNodeLoc + comparisonResultPadding + BarcodeTreeSplitWidth + barcodeNodeInterval * 2
																} else {
																		//  如果只有一个barcodeTree中该节点是一个一个空白, 那么需要增加barcodeNodePaddingLength的长度
																		if (Subtree_Compact) {
																				alignedNodeLoc = alignedNodeLoc + barcodeNodePaddingLength + comparisonResultPadding + BarcodeTreeSplitWidth + barcodeNodeInterval * 2
																		} else if (paddingNodeObjArray[pI].is_removed) {
																				alignedNodeLoc = alignedNodeLoc + comparisonResultPadding + BarcodeTreeSplitWidth + barcodeNodeInterval * 2
																		}
																}
														}
												} else {//  如果subtree处于非压缩状态, 那么累加计算距离时, 增加的是barcode的原始的节点的宽度
														if (paddingNodeObjArray[pI].paddingNodeStartIndex <= paddingNodeObjArray[pI].paddingNodeEndIndex) {
																alignedNodeLoc = alignedNodeLoc + maxPaddingNodeLength + comparisonResultPadding + BarcodeTreeSplitWidth + barcodeNodeInterval
														} else {
																if (maxPaddingNodeLength > 0) {
																		alignedNodeLoc = alignedNodeLoc + maxPaddingNodeLength + comparisonResultPadding + BarcodeTreeSplitWidth + barcodeNodeInterval
																} else {
																		if (paddingNodeObjArray[pI].paddingNodeStartIndex !== 0) {
																				alignedNodeLoc = alignedNodeLoc + comparisonResultPadding + BarcodeTreeSplitWidth
																		} else {
																				alignedNodeLoc = alignedNodeLoc + comparisonResultPadding
																		}
																}
														}
												}
												//	如果在这个范围内的paddingNode的maxPaddingNodeLength为0, 那么就存在一个BarcodeTree的对齐的部分相连的情况
												if (paddingNodeObjArray[pI].maxPaddingNodeLength === 0) {
														alignedNodeLoc = alignedNodeLoc - BarcodeTreeSplitWidth
												}
										}
								}
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										if (nodeIndex > alignedRangeObjArray[aI].rangeEndNodeIndex) {
												alignedNodeLoc = alignedNodeLoc + alignedRangeObjArray[aI].maxAlignedLength + BarcodeTreeSplitWidth
										}
								}
								return alignedNodeLoc
						}
				}
				,
				//	获取padding节点的object对象
				get_padding_range_obj: function (nodeId) {
						var self = this
						var padding_node_id2padding_obj = self.get('padding_node_id2padding_obj')
						var paddingRangeObj = padding_node_id2padding_obj[nodeId]
						return paddingRangeObj
				}
				,
				/**
					* 更新align相关的节点的id
					*/
				update_align_id_array: function () {
						var self = this
						var self = this
						var alignStartIdArray = []
						var alignRangeIdArray = []
						var alignedRangeObjArray = self.get('alignedRangeObjArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
								var alignedRangeObj = alignedRangeObjArray[aI]
								var rangeStartNodeIndex = +alignedRangeObj.rangeStartNodeIndex
								var rangeEndNodeIndex = +alignedRangeObj.rangeEndNodeIndex
								//  向alignStartIdArray增加新的id
								alignStartIdArray.push(barcodeNodeAttrArray[rangeStartNodeIndex].id)
								for (var rI = (rangeStartNodeIndex + 1); rI <= rangeEndNodeIndex; rI++) {
										//  向alignStartIdArray增加新的id
										alignRangeIdArray.push(barcodeNodeAttrArray[rI].id)
								}
						}
						self.set('align_start_id_array', alignStartIdArray)
						self.set('align_range_id_array', alignRangeIdArray)
				}
				,
				/**
					* 更新全局状态下的padding相关的节点的id
					*/
				update_global_padding_id_array: function () {
						var self = this
						var paddingStartIdArray = []
						var paddingRangeIdArray = []
						var paddingNodeObjArray = self.get('globalPaddingRangeObjArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						for (var aI = 0; aI < paddingNodeObjArray.length; aI++) {
								var paddingRangeObj = paddingNodeObjArray[aI]
								var paddingNodeStartIndex = +paddingRangeObj.paddingNodeStartIndex
								var paddingNodeEndIndex = +paddingRangeObj.paddingNodeEndIndex
								if (paddingNodeStartIndex <= paddingNodeEndIndex) {
										//  向alignStartIdArray增加新的id
										paddingStartIdArray.push(barcodeNodeAttrArray[paddingNodeStartIndex].id)
										for (var rI = (paddingNodeStartIndex + 1); rI <= paddingNodeEndIndex; rI++) {
												//  向alignStartIdArray增加新的id
												paddingRangeIdArray.push(barcodeNodeAttrArray[rI].id)
										}
								}
						}
						self.set('global_padding_start_id_array', paddingStartIdArray)
						self.set('global_padding_range_id_array', paddingRangeIdArray)
				}
				,
				/**
					* 更新padding相关的节点的id
					*/
				update_padding_id_array: function () {
						var self = this
						var paddingStartIdArray = []
						var paddingRangeIdArray = []
						//	根据padding节点的id得到paddingNodeObj对象
						var paddingNodeId2paddingObj = {}
						var paddingNodeObjArray = self.get('paddingNodeObjArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						for (var aI = 0; aI < paddingNodeObjArray.length; aI++) {
								var paddingRangeObj = paddingNodeObjArray[aI]
								var paddingNodeStartIndex = +paddingRangeObj.paddingNodeStartIndex
								var paddingNodeEndIndex = +paddingRangeObj.paddingNodeEndIndex
								if (paddingNodeStartIndex <= paddingNodeEndIndex) {
										//  向alignStartIdArray增加新的id
										paddingStartIdArray.push(barcodeNodeAttrArray[paddingNodeStartIndex].id)
										paddingNodeId2paddingObj[barcodeNodeAttrArray[paddingNodeStartIndex].id] = paddingRangeObj
										for (var rI = (paddingNodeStartIndex + 1); rI <= paddingNodeEndIndex; rI++) {
												//  向alignStartIdArray增加新的id
												paddingRangeIdArray.push(barcodeNodeAttrArray[rI].id)
												paddingNodeId2paddingObj[barcodeNodeAttrArray[rI].id] = paddingRangeObj
										}
								}
						}
						self.set('padding_start_id_array', paddingStartIdArray)
						self.set('padding_range_id_array', paddingRangeIdArray)
						self.set('padding_node_id2padding_obj', paddingNodeId2paddingObj)
				}
				,
				/*
					按照alignedBarcodeNodeAttrObj获得已经align的节点的位置从而进行更新
					*/
				update_aligned_barcode_node: function () {
						var self = this
						//  非compact类型的节点的更新
						var alignedDepth = Variables.get('alignedLevel')
						var alignedRangeObjArray = self.get('alignedRangeObjArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						var alignedBarcodeNodeAttrObj = self.get('alignedBarcodeNodeAttrObj')
						inner_update_aligned_barcode_node(alignedRangeObjArray, barcodeNodeAttrArray, alignedBarcodeNodeAttrArray)
						function inner_update_aligned_barcode_node(alignedRangeObjArray, barcodeNodeAttrArray, alignedBarcodeNodeAttrArray) {
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										var alignedRangeObj = alignedRangeObjArray[aI]
										var rangeStartNodeIndex = +alignedRangeObj.rangeStartNodeIndex
										var rangeEndNodeIndex = +alignedRangeObj.rangeEndNodeIndex
										var alignedSubtreeRootX = getAlignedBarcodeNodeAttrX(alignedBarcodeNodeAttrArray, barcodeNodeAttrArray[rangeStartNodeIndex].id)
										var originalSubtreeRootX = barcodeNodeAttrArray[rangeStartNodeIndex].x
										var subtreeRootMovedX = originalSubtreeRootX - alignedSubtreeRootX
										for (var rI = (rangeStartNodeIndex + 1); rI <= rangeEndNodeIndex; rI++) {
												var depth = barcodeNodeAttrArray[rI].depth
												if (depth <= alignedDepth) {
														var nodeId = barcodeNodeAttrArray[rI].id
														// barcodeNodeAttrArray[ rI ].x = alignedBarcodeNodeAttrObj[ nodeId ].x
														barcodeNodeAttrArray[rI].x = getAlignedBarcodeNodeAttrX(alignedBarcodeNodeAttrArray, nodeId) + subtreeRootMovedX
												}
										}
								}
						}

						function getAlignedBarcodeNodeAttrX(alignedBarcodeNodeAttrArray, nodeId) {
								for (var aI = 0; aI < alignedBarcodeNodeAttrArray.length; aI++) {
										if (alignedBarcodeNodeAttrArray[aI].id === nodeId) {
												return alignedBarcodeNodeAttrArray[aI].x
										}
								}
								return 0
						}
				}
				,
				/**
					* 删除barcode model中的对齐的部分
					*/
				remove_aligned_part: function (unAlignedItemList) {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var alignedRangeObjArray = self.get('alignedRangeObjArray')
						var unAlignedRangeObjArray = get_unaligned_range_obj_array(unAlignedItemList, alignedRangeObjArray)
						for (var uI = 0; uI < unAlignedRangeObjArray.length; uI++) {
								var rangeStartNodeIndex = unAlignedRangeObjArray[uI].rangeStartNodeIndex
								var rangeEndNodeIndex = unAlignedRangeObjArray[uI].rangeEndNodeIndex
								remove_aligned_items(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray)
						}
						//  删除所有编辑为removed的节点
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if (barcodeNodeAttrArray[bI].removed) {
										barcodeNodeAttrArray.splice(bI, 1)
										bI = bI - 1
								} else {
										var nodeDepth = barcodeNodeAttrArray[bI].depth
										barcodeNodeAttrArray[bI].width = window.barcodeWidthArray[nodeDepth]
								}
						}
						//  根据传入的rangeStartNodeIndex, rangeEndNodeIndex和barcodeNodeAttrArray删除在这个范围内的aligned部分的节点
						function remove_aligned_items(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray) {
								for (var bI = rangeStartNodeIndex; bI <= rangeEndNodeIndex; bI++) {
										if (typeof (barcodeNodeAttrArray[bI]) !== 'undefined') {
												if (!barcodeNodeAttrArray[bI].existed) {
														barcodeNodeAttrArray[bI].removed = true
												}
										}
								}
						}

						//  根据传入的un_aligned_item_list提取得到所有需要unaligned部分的范围
						function get_unaligned_range_obj_array(un_aligned_item_list, aligned_range_obj_array) {
								var unalignedRangeObjArray = []
								var unAlignedIdList = []
								for (var uI = 0; uI < un_aligned_item_list.length; uI++) {
										unAlignedIdList.push(unAlignedItemList[uI].nodeData.id)
								}
								for (var uI = 0; uI < aligned_range_obj_array.length; uI++) {
										var alignedObjId = aligned_range_obj_array[uI].alignedObjId
										if (unAlignedIdList.indexOf(alignedObjId) !== -1) {
												unalignedRangeObjArray.push(aligned_range_obj_array[uI])
										}
								}
								return unalignedRangeObjArray
						}
				}
				,
				/**
					*  判断节点是否存在
					*/
				is_node_existed: function (nodeObjId) {
						var self = this
						var barcodeNodeAttrArrayObj = self.get('barcodeNodeAttrArrayObj')
						var nodeExisted = true
						if (typeof (barcodeNodeAttrArrayObj[nodeObjId]) === 'undefined') {
								nodeExisted = false
						} else {
								nodeExisted = true
						}
						return nodeExisted
				}
				,
				/**
					*  是否处于aligned状态
					*/
				is_aligned_state: function () {
						var self = this
						var alignStartIdArray = self.get('align_start_id_array')
						if (alignStartIdArray.length === 0) {
								return false
						}
						return true
				}
				,
				is_aligned_start: function (nodeObjId) {
						var self = this
						var alignStartIdArray = self.get('align_start_id_array')
						if (alignStartIdArray.indexOf(nodeObjId) !== -1) {
								return true
						}
						return false
				}
				,
				is_aligned_range: function (nodeObjId) {
						var self = this
						var alignRangeIdArray = self.get('align_range_id_array')
						if (alignRangeIdArray.indexOf(nodeObjId) !== -1) {
								return true
						}
						return false
				}
				,
				is_padding_start: function (nodeObjId) {
						var self = this
						var paddingStartIdArray = self.get('padding_start_id_array')
						if (paddingStartIdArray.indexOf(nodeObjId) !== -1) {
								return true
						}
						return false
				}
				,
				is_padding_range: function (nodeObjId) {
						var self = this
						var paddingRangeIdArray = self.get('padding_range_id_array')
						if (paddingRangeIdArray.indexOf(nodeObjId) !== -1) {
								return true
						}
						return false
				}
				,
				//  根据节点的index, 计算节点所述的类型
				_node_category: function (nodeObjId) {
						var self = this
						var alignedBegin = self.get('ALIGN_START')
						var alignedRange = self.get('ALIGN_RANGE')
						var paddingRange = self.get('PADDING_RANGE')
						var paddingBegin = self.get('PADDING_BEGIN')
						if (self.is_aligned_start(nodeObjId)) {
								return alignedBegin
						}
						if (self.is_aligned_range(nodeObjId)) {
								return alignedRange
						}
						if (self.is_padding_start(nodeObjId)) {
								return paddingBegin
						}
						if (self.is_padding_range(nodeObjId)) {
								return paddingRange
						}
				},
				/**
					*  计算得到barcodeTree前面的label的函数
					*/
				get_barcodetree_label: function () {
						var self = this
						var barcodeTreeId = self.get('barcodeTreeId')
						var currentDataSetName = Variables.get('currentDataSetName')
						if (barcodeTreeId.indexOf('-') !== -1) {
								var barcodeTreeLabelYearMonthDday = barcodeTreeId.split('-')[1]
								var barcodeTreeLabelMonthDday = barcodeTreeLabelYearMonthDday.substring(5, barcodeTreeLabelYearMonthDday.length).replaceAll('_', '/')
						} else {
								barcodeTreeLabelMonthDday = barcodeTreeId.split('_')[0]
								barcodeTreeLabelMonthDday = barcodeTreeLabelMonthDday.toUpperCase()
						}
						return barcodeTreeLabelMonthDday
				},
				/**
					* 在点击选择一个节点的情况下, 获取排序依据的指标的大小
					*/
				get_sorting_node_value: function (sortOption, comparedNodeId) {
						var self = this
						if (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_NODENUMBER_SORT']) {
								//  依据节点的数量排序
								return self.get_single_node_num(comparedNodeId)
						} else if (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_ATTRIBUTE_SORT']) {
								//  依据属性值大小排序
								return self.get_subtree_sum_value(comparedNodeId)
						} else if (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_SIMILARITY_SORT']) {
								//  依据子树相似度排序
								return self.get_node_similarity(comparedNodeId)
						}
				}
				,
				/**
					* 在点击选择一个子树的情况下, 获取排序依据的子树的指标的大小
					*/
				get_sorting_subtree_value: function (sortOption, comparedNodeId) {
						var self = this
						if (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_NODENUMBER_SORT']) {
								//  依据节点的数量排序
								return self.get_subtree_node_num(comparedNodeId)
						} else if (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_ATTRIBUTE_SORT']) {
								//  依据属性值大小排序
								return self.get_subtree_sum_value(comparedNodeId)
						} else if (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_SIMILARITY_SORT']) {
								//  依据子树相似度排序
								return self.get_subtree_similarity(comparedNodeId)
						}
				}
				,
				/**
					*  singleView视图中获取比较的结果
					*/
				get_selected_comparison_result: function (nodeObjId) {
						var self = this
						var selectedComparisonResults = self.get('selectedComparisonResults')
						var selectedNodeComparisonResult = selectedComparisonResults[nodeObjId]
						if (typeof (selectedNodeComparisonResult) === 'undefined') {
								selectedNodeComparisonResult = null
						}
						return selectedNodeComparisonResult
				}
				,
				/**
					*  单个节点的相似性
					*/
				get_node_similarity: function (comparedNodeId) {
						var self = this
						var nodeExisted = self.is_node_existed(comparedNodeId)
						//  如果节点存在, 则返回1, 否则返回0
						if (nodeExisted) {
								return 1
						} else {
								return 0
						}
				}
				,
				/**
					*  单个子树的相似性
					*/
				get_subtree_similarity: function (comparedNodeId) {
						var self = this
						var selectedComparisonResults = self.get('selectedComparisonResults')
						var comparisonResult = selectedComparisonResults[comparedNodeId]
						var childrenNodes = comparisonResult.childrenNodes
						var sameNodesArrayLength = (typeof (childrenNodes.same) === 'undefined') ? 0 : childrenNodes.same.length
						var addNodesArrayLength = (typeof (childrenNodes.add) === 'undefined') ? 0 : childrenNodes.add.length
						var removeNodesArrayLength = (typeof (childrenNodes.miss) === 'undefined') ? 0 : childrenNodes.miss.length
						var similarity = sameNodesArrayLength / (sameNodesArrayLength + addNodesArrayLength + removeNodesArrayLength)
						return similarity
				},
				/**
					*  增加选择的节点, 并且更新比较的结果
					*/
				add_selected_node_comparison_result: function (nodeObjId, basedFindingNodesObj) {
						var self = this
						var barcodeCollection = window.Datacenter.barcodeCollection
						var selectedComparisonResults = self.get('selectedComparisonResults')
						var barcodeNodeAttrArrayObj = self.get('barcodeNodeAttrArrayObj')
						//	获取得到barcodeTree中的node对应的对象
						var nodeObj = barcodeNodeAttrArrayObj[nodeObjId]
						if (typeof (nodeObj) === 'undefined') {
								nodeObj = barcodeCollection.get_node_obj_from_id(nodeObjId)
						}
						if (typeof (nodeObj) !== 'undefined') {
								var thisFindingNodesObj = self.find_related_nodes(nodeObj)
								var comparedResultsObj = self.compareNodes(basedFindingNodesObj, thisFindingNodesObj, nodeObj)
								comparedResultsObj.currentSelectedNode = nodeObj
								selectedComparisonResults[nodeObjId] = comparedResultsObj
						}
				},
				/**
					*  与选择的节点进行比较, 得到比较的结果
					*/
				compareNodes: function (basedFindingNodesObj, thisTreeFindingNodesObj, nodeObj) {
						var self = this
						var globalCompareResult = {}
						var basedFindingNodesObj = JSON.parse(JSON.stringify(basedFindingNodesObj))
						var thisTreeFindingNodesObj = JSON.parse(JSON.stringify(thisTreeFindingNodesObj))
						//  如果该节点不是最深的节点, 并且该节点的孩子节点为空, 且sibling节点为空, 那么久设置全部的node为same node
						if ((typeof (basedFindingNodesObj.childrenNodes) !== 'undefined') && (typeof (basedFindingNodesObj.siblingNodes) !== 'undefined')) {
								if ((basedFindingNodesObj.childrenNodes.length === 0) && (basedFindingNodesObj.siblingNodes.length === 0)) {
										globalCompareResult.childrenNodes = {same: thisTreeFindingNodesObj.childrenNodes, add: [], miss: []}
										return globalCompareResult
								}
						}
						globalCompareResult.childrenNodes = innerCompare(basedFindingNodesObj.childrenNodes, thisTreeFindingNodesObj.childrenNodes)
						// globalCompareResult.fatherCurrentNodes = innerCompare(basedFindingNodesObj.fatherCurrentNodes, thisTreeFindingNodesObj.fatherCurrentNodes)
						// globalCompareResult.siblingNodes = innerCompare(basedFindingNodesObj.siblingNodes, thisTreeFindingNodesObj.siblingNodes)
						return globalCompareResult
						//  比较array1和array2的结果, 标记处缺失的节点以及增加的节点, 第一个数组是basedArray, 第二个数组是比较的array
						function innerCompare(array1, array2) {
								if (typeof (array1) !== 'undefined') {
										for (var a1I = 0; a1I < array1.length; a1I++) {
												for (var a2I = 0; a2I < array2.length; a2I++) {
														if (array1[a1I].id === array2[a2I].id) {
																array1[a1I].compare_result = 'same'
																array2[a2I].compare_result = 'same'
														}
												}
										}
								}
								if (typeof (array1) !== 'undefined') {
										for (var a1I = 0; a1I < array1.length; a1I++) {
												if (array1[a1I].compare_result !== 'same') {
														array1[a1I].compare_result = 'miss'
												}
										}
								}
								for (var a2I = 0; a2I < array2.length; a2I++) {
										if (array2[a2I].compare_result !== 'same') {
												array2[a2I].compare_result = 'add'
										}
								}
								var compareResultObj = {}
								compareResultObj.same = []
								compareResultObj.add = []
								compareResultObj.miss = []
								if (typeof (array1) !== 'undefined') {
										for (var a1I = 0; a1I < array1.length; a1I++) {
												if (array1[a1I].compare_result === 'miss') {
														compareResultObj.miss.push(array1[a1I])
												}
										}
								}
								for (var a2I = 0; a2I < array2.length; a2I++) {
										if (array2[a2I].compare_result === 'same') {
												compareResultObj.same.push(array2[a2I])
										} else if (array2[a2I].compare_result === 'add') {
												compareResultObj.add.push(array2[a2I])
										}
								}
								// //  array1 是based Tree所发现的节点, 所以当based Tree中的节点为空时, 返回的是另一个tree中的节点, 即array2
								// if ((typeof (array1) === 'undefined') || (array1.length === 0)) {
								//   compareResultObj.same = JSON.parse(JSON.stringify(array2))
								// }
								return compareResultObj
						}
				},
				/**
					*  对于当前的图书馆目录的数据, sumValue指的就是点击的节点的value值
					*  但是对于其他类型的数据, 应该计算的sunValue是节点的num之和
					*/
				get_subtree_sum_value: function (comparedNodeId) {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var barcodeNodeAttrArrayObj = self.get('barcodeNodeAttrArrayObj')
						var comparedNodeValue = 0
						if (typeof (barcodeNodeAttrArrayObj[comparedNodeId]) !== 'undefined') {
								comparedNodeValue = barcodeNodeAttrArrayObj[comparedNodeId].num
						}
						return comparedNodeValue
				}
				,
				/**
					* 计算得到subtree的节点数目
					*/
				get_subtree_node_num: function (comparedNodeId) {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var nodeDepth = null
						var nodeCount = 0
						var selectedLevels = Variables.get('selectedLevels')
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if (nodeDepth != null) {
										//  如果节点的深度超过选择节点的nodeDepth, 并且这个节点的深度满足一定的条件, 那么增加节点的计数
										if (barcodeNodeAttrArray[bI].depth > nodeDepth) {
												if ((barcodeNodeAttrArray[bI].width !== 0) && (barcodeNodeAttrArray[bI].existed) && (selectedLevels.indexOf(barcodeNodeAttrArray[bI].depth) !== -1)) {
														nodeCount = nodeCount + 1
												}
										}
										//  当节点的深度为原始节点的深度时, 停止节点的数量的计数
										if (barcodeNodeAttrArray[bI].depth == nodeDepth) {
												nodeDepth = null
										}
								}
								//  遍历barcodeNodeAttrArray计算相应的subtree上的节点数量
								//  当节点的id === comparedNodeId时开始计时
								if (barcodeNodeAttrArray[bI].id === comparedNodeId) {
										if ((barcodeNodeAttrArray[bI].width !== 0) && (barcodeNodeAttrArray[bI].existed)) {
												nodeDepth = barcodeNodeAttrArray[bI].depth
												nodeCount = nodeCount + 1
										}
								}
						}
						return nodeCount
				}
				,
				/**
					* 计算得到单个节点的节点数量
					*/
				get_single_node_num: function (comparedNodeId) {
						var self = this
						var singleNodeNum = 0
						if (self.is_node_existed(comparedNodeId)) {
								singleNodeNum = 1
						} else {
								singleNodeNum = 0
						}
						return singleNodeNum
				}
				,
				//  更新barcode的subtree的范围
				update_single_barcode_padding_subtree_range: function () {
						var self = this
						var paddingNodeObjArray = self.get('paddingNodeObjArray')
						var paddingSubtreeRangeObject = {}
						for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
								var subtreeObjectArray = paddingNodeObjArray[pI].subtreeObjectArray
								var paddingNodeX = paddingNodeObjArray[pI].paddingNodeX
								for (var sI = 0; sI < subtreeObjectArray.length; sI++) {
										subtreeObjectArray[sI].realCompressNodeStartX = paddingNodeX
										paddingNodeX = paddingNodeX + subtreeObjectArray[sI].realCompressNodeWidth
										subtreeObjectArray[sI].realCompressNodeEndX = paddingNodeX
										var subtreeRootId = subtreeObjectArray[sI].subtreeRootId
										if (typeof (paddingSubtreeRangeObject[subtreeRootId]) === 'undefined') {
												paddingSubtreeRangeObject[subtreeRootId] = JSON.parse(JSON.stringify(subtreeObjectArray[sI]))
										} else {
												paddingSubtreeRangeObject[subtreeRootId].realCompressNodeStartX = subtreeObjectArray[sI].realCompressNodeStartX > paddingSubtreeRangeObject[subtreeRootId].realCompressNodeStartX ? paddingSubtreeRangeObject[subtreeRootId].realCompressNodeStartX : subtreeObjectArray[sI].realCompressNodeStartX
												paddingSubtreeRangeObject[subtreeRootId].realCompressNodeEndX = subtreeObjectArray[sI].realCompressNodeEndX < paddingSubtreeRangeObject[subtreeRootId].realCompressNodeEndX ? paddingSubtreeRangeObject[subtreeRootId].realCompressNodeEndX : subtreeObjectArray[sI].realCompressNodeEndX
										}
								}
						}
						self.set('paddingSubtreeRangeObject', paddingSubtreeRangeObject)
				}
				,
				reset_attribute: function () {
						var self = this
						self.set('alignedBarcodeNodeAttrObj', {})
						self.set('compactAlignedBarcodeNodeAttrObj', {})
						self.set('coveredRectObjArray', [])
						self.set('alignedRangeObjArray', [])
						self.set('_alignedRangeObjArray', [])
						self.set('compactAlignedRangeObjArray', [])
						self.set('paddingNodeObjArray', [])
						self.set('_paddingNodeObjArray', [])
						self.set('compactPaddingNodeObjArray', [])
						self.set('_compactPaddingNodeObjArray', [])
						d3.selectAll('.stat-summary').remove()
				}
				,
				get_next_subtree_range: function (node_id, node_level) {
						var self = this
						var nodeIndex = self.get_node_index(node_id)
						var nextSubtreeLevel = node_level
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						var subtreeRangeObjArray = []
						for (var bI = (nodeIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
								var barcodeNode = barcodeNodeAttrArray[bI]
								if (barcodeNode.depth === nextSubtreeLevel) {
										if (subtreeRangeObjArray.length > 0) {
												subtreeRangeObjArray[subtreeRangeObjArray.length - 1].subtreeEndX = barcodeNodeAttrArray[bI].x
										}
										subtreeRangeObjArray.push({
												id: barcodeNodeAttrArray[bI].id,
												subtreeStartX: barcodeNodeAttrArray[bI].x //+ barcodeNodeAttrArray[bI].width
										})
								}
								if (barcodeNode.depth === (node_level - 1)) {
										for (var iBI = (bI - 1); iBI > 0; iBI--) {
												if ((barcodeNodeAttrArray[iBI].width !== 0) && (barcodeNodeAttrArray[iBI].existed)) {
														subtreeRangeObjArray[subtreeRangeObjArray.length - 1].subtreeEndX = barcodeNodeAttrArray[iBI].x + barcodeNodeAttrArray[iBI].width
														break
												}
										}
										break
								}
						}
						if (typeof (subtreeRangeObjArray[subtreeRangeObjArray.length - 1]) !== 'undefined') {
								if (typeof (subtreeRangeObjArray[subtreeRangeObjArray.length - 1].subtreeEndX) === 'undefined') {
										subtreeRangeObjArray[subtreeRangeObjArray.length - 1].subtreeEndX = barcodeNodeAttrArray[barcodeNodeAttrArray.length - 1].x + barcodeNodeAttrArray[barcodeNodeAttrArray.length - 1].width
								}
						}
						var subtreeRangeObj = {}
						for (var sI = 0; sI < subtreeRangeObjArray.length; sI++) {
								var subtreeStartId = subtreeRangeObjArray[sI].id
								subtreeRangeObj[subtreeStartId] = subtreeRangeObjArray[sI]
						}
						return subtreeRangeObj
				}
				,
				//  根据传入的节点id计算节点下层的子树大小比例
				get_subree_size_obj_array: function (node_id) {
						var self = this
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						// var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var nodeIndex = self.get_node_index(node_id)
						var subtreeLengthObj = {}
						if ((typeof (subtreeLengthObj) !== 'undefined') && (typeof (barcodeNodeAttrArray[nodeIndex]) !== 'undefined')) {
								//  barcodeNode节点的深度
								var fatherNodeDepth = barcodeNodeAttrArray[nodeIndex].depth
								var subtreeRootDepth = fatherNodeDepth + 1
								//  当前计数的subtree的root节点id
								var currentAddedSubtreeRootId = null
								for (var bI = (nodeIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
										var barcodeNode = barcodeNodeAttrArray[bI]
										var barcodeNodeId = barcodeNode.id
										var barcodeNodeDepth = barcodeNode.depth
										//  遇到下一个subtree, 更换当前计数的subtree的根节点id
										if (barcodeNodeDepth === subtreeRootDepth) {
												currentAddedSubtreeRootId = barcodeNodeId
												subtreeLengthObj[barcodeNodeId] = 0
										}
										//  如果当前计数的subtree根节点id不为null, 那么就在当前技术的subtree增加1
										if (currentAddedSubtreeRootId != null) {
												if (window.selectedLevels.indexOf(barcodeNodeDepth) !== -1) {
														if (barcodeNode.existed) {
																subtreeLengthObj[currentAddedSubtreeRootId] = subtreeLengthObj[currentAddedSubtreeRootId] + 1
														}
												}
										}
										//  如果当前的节点的的depth为节点深度的depth, 那么就暂停计数
										if (barcodeNodeDepth === fatherNodeDepth) {
												break
										}
								}
						}
						return subtreeLengthObj
				}
				,
				//  根据padding node计算最右侧孩子节点的位置
				get_padding_node_right_loc: function (nodeId, nodeLevel) {
						var self = this
						var paddingNodeRightLoc = 0
						var paddingSubtreeRangeObject = self.get('paddingSubtreeRangeObject')
						if (nodeLevel === 0) {
								paddingNodeRightLoc = get_global_max_end_x(paddingSubtreeRangeObject)
						} else {
								paddingNodeRightLoc = paddingSubtreeRangeObject[nodeId].realCompressNodeEndX
						}
						return paddingNodeRightLoc
						function get_global_max_end_x(paddingSubtreeRangeObject) {
								var globalMaxX = 0
								for (var item in paddingSubtreeRangeObject) {
										globalMaxX = globalMaxX > paddingSubtreeRangeObject[item].realCompressNodeEndX ? globalMaxX : paddingSubtreeRangeObject[item].realCompressNodeEndX
								}
								return globalMaxX
						}
				}
				,
				//  根据padding node计算最左侧孩子节点的位置
				get_padding_node_left_loc: function (nodeId, nodeLevel) {
						var self = this
						var paddingNodeLeftLoc = 0
						var paddingSubtreeRangeObject = self.get('paddingSubtreeRangeObject')
						if (nodeLevel === 0) {
								paddingNodeLeftLoc = get_global_min_end_x(paddingSubtreeRangeObject)
						} else {
								paddingNodeLeftLoc = paddingSubtreeRangeObject[nodeId].realCompressNodeStartX
						}
						return paddingNodeLeftLoc
						function get_global_min_end_x(paddingSubtreeRangeObject) {
								var globalMinX = 0
								for (var item in paddingSubtreeRangeObject) {
										globalMinX = globalMinX < paddingSubtreeRangeObject[item].realCompressNodeStartX ? globalMinX : paddingSubtreeRangeObject[item].realCompressNodeStartX
								}
								return globalMinX
						}
				}
				,
				//  计算该节点的最右侧孩子节点的位置
				get_right_loc: function (node_id, node_level) {
						var self = this
						var rightLoc = 0
						var nodeIndex = self.get_node_index(node_id)
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						for (var bI = (nodeIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
								var barcodeNode = barcodeNodeAttrArray[bI]
								if (barcodeNode.depth === node_level) {
										break
								}
								if ((barcodeNode.width > 0) && (barcodeNode.existed)) {
										rightLoc = barcodeNode.x + barcodeNode.width
								}
								if (bI === (barcodeNodeAttrArray.length - 1)) {
										break
								}
						}
						return rightLoc
				}
				,
				//  计算该节点的最左侧孩子节点的位置
				get_left_loc: function (node_id, node_level) {
						var self = this
						var nodeIndex = self.get_node_index(node_id)
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						var leftLoc = null
						var nextExistBarcodeNode = find_next_exist_nodes(nodeIndex, barcodeNodeAttrArray)
						if (typeof (nextExistBarcodeNode) !== 'undefined') {
								leftLoc = nextExistBarcodeNode.x
						}
						return leftLoc
						function find_next_exist_nodes(node_index, barcode_node_attr_array) {
								for (var bI = (node_index + 1); bI < barcode_node_attr_array.length; bI++) {
										if ((barcode_node_attr_array[bI].width !== 0) && (barcode_node_attr_array[bI].existed)) {
												return barcode_node_attr_array[bI]
										}
								}
						}
				}
				,
				//  获取BarcodeNode的节点对象
				get_barcode_node: function (subtreeRootId) {
						var self = this
						var barcodeNodeAttrArrayObj = self.get('barcodeNodeAttrArrayObj')
						var barcodeNodeObj = barcodeNodeAttrArrayObj[subtreeRootId]
						if (typeof (barcodeNodeObj) === 'undefined') {
								return null
						}
						return barcodeNodeObj
				}
				,
				//  获取barcodeTree的显示模式
				get_barcode_tree_display_mode: function () {
						var self = this
						var barcodeTreeIsLocked = Variables.get('barcodeTreeIsLocked')
						var currentDisplayMode = null
						if (barcodeTreeIsLocked) {
								//  如果displaymode是全局控制
								currentDisplayMode = Variables.get('displayMode')
						} else {
								//  如果displaymode是不是全局控制
								currentDisplayMode = self.get('displayMode')
						}
						return currentDisplayMode
				}
				,
				//  获取当前使用的barcode节点数组
				get_barcode_node_array: function () {
						var self = this
						//  切换到原始的barcodeTree的显示模式
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						return barcodeNodeAttrArray
				}
				,
				//  根据node的id获取node的index
				get_node_index: function (nodeId) {
						var self = this
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if (barcodeNodeAttrArray[bI].id === nodeId) {
										return bI
								}
						}
				}
				,
				//  根据node的id获取node在categoryNodeObjArray的index
				get_category_node_index: function (nodeId) {
						var self = this
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if (barcodeNodeAttrArray[bI].id === nodeId) {
										return bI
								}
						}
				}
				,
				//  根据已知的节点的属性, 寻找所有与这个节点相关的节点的属性
				find_related_nodes: function (nodeObj) {
						var self = this
						var findingNodesObj = {}
						findingNodesObj.childrenNodes = self.find_children_nodes(nodeObj)
						findingNodesObj.fatherCurrentNodes = self.find_father_current_nodes(nodeObj)
						findingNodesObj.siblingNodes = self.find_sibling_nodes(nodeObj)
						return findingNodesObj
				}
				,
				//  根据已知的节点的属性, 寻找所有与这个节点相关的节点的属性
				find_super_tree_related_nodes: function (nodeObj) {
						var self = this
						var findingNodesObj = {}
						findingNodesObj.childrenNodes = self.find_super_tree_children_nodes(nodeObj)
						findingNodesObj.fatherCurrentNodes = self.find_super_tree_father_current_nodes(nodeObj)
						findingNodesObj.siblingNodes = self.find_super_tree_sibling_nodes(nodeObj)
						return findingNodesObj
				}
				,
				//  获取节点的sibling节点
				find_sibling_nodes: function (nodeObj) {
						var self = this
						var treeDataModel = self.model
						var nodeIndex = self.get_node_index(nodeObj.id)
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						var siblingNodesArray = []
						var nodeDepth = nodeObj.depth
						//  向后遍历
						for (var nI = (nodeIndex - 1); nI > 0; nI--) {
								if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
										if (barcodeNodeAttrArray[nI].existed) {
												siblingNodesArray.push(barcodeNodeAttrArray[nI])
										}
								}
								if (barcodeNodeAttrArray[nI].depth < nodeDepth) {
										break
								}
						}
						//  向前遍历
						for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
								if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
										if (barcodeNodeAttrArray[nI].existed) {
												siblingNodesArray.push(barcodeNodeAttrArray[nI])
										}
								}
								if (barcodeNodeAttrArray[nI].depth < nodeDepth) {
										break
								}
						}
						return siblingNodesArray
				}
				,
				//  获取节点的children节点
				find_children_nodes: function (nodeObj) {
						var self = this
						var nodeIndex = self.get_node_index(nodeObj.id)
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						var childrenNodesArray = []
						var nodeDepth = nodeObj.depth
						for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
								if (barcodeNodeAttrArray[nI].depth > nodeDepth) {
										if (barcodeNodeAttrArray[nI].existed) {
												childrenNodesArray.push(barcodeNodeAttrArray[nI])
										}
								}
								if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
										break
								}
						}
						// self.highlightChildrenNodes(childrenNodesArray)
						return childrenNodesArray
				}
				,
				//  获取节点的全部children节点, 包括不存在的节点
				find_all_children_nodes: function (nodeObj) {
						var self = this
						var nodeIndex = self.get_node_index(nodeObj.id)
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						var childrenNodesArray = []
						var nodeDepth = nodeObj.depth
						for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
								if (barcodeNodeAttrArray[nI].depth > nodeDepth) {
										childrenNodesArray.push(barcodeNodeAttrArray[nI])
								}
								if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
										break
								}
						}
						// self.highlightChildrenNodes(childrenNodesArray)
						return childrenNodesArray
				}
				,
				//  寻找父亲节点
				find_father_nodes: function (nodeObj) {
						var self = this
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var nodeIndex = self.get_node_index(nodeObj.id)
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						var fatherNodesArray = []
						var nodeDepth = nodeObj.depth - 1
						for (var nI = nodeIndex; nI >= 0; nI--) {
								if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
										if (barcodeNodeAttrArray[nI].existed) {
												if ((self.is_aligned_state()) && (BarcodeGlobalSetting['Align_Lock'])) {
														if ((self.is_aligned_range(barcodeNodeAttrArray[nI].id)) || (self.is_aligned_start(barcodeNodeAttrArray[nI].id))) {
																fatherNodesArray.push(barcodeNodeAttrArray[nI])
														}
												} else {
														fatherNodesArray.push(barcodeNodeAttrArray[nI])
												}
										}
								}
								nodeDepth = nodeDepth - 1
						}
						return fatherNodesArray
				}
				,
				//  寻找所有的父亲以及当前节点, 即使是在padding范围内的也找出来
				find_all_father_current_nodes: function (nodeObj) {
						var self = this
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var nodeIndex = self.get_node_index(nodeObj.id)
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						var fatherNodesArray = []
						var nodeDepth = nodeObj.depth
						for (var nI = nodeIndex; nI >= 0; nI--) {
								if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
										if (barcodeNodeAttrArray[nI].existed) {
												fatherNodesArray.push(barcodeNodeAttrArray[nI])
										}
										nodeDepth = nodeDepth - 1
								}
						}
						return fatherNodesArray
				}
				,
				//  寻找父亲以及当前节点
				find_father_current_nodes: function (nodeObj) {
						var self = this
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var nodeIndex = self.get_node_index(nodeObj.id)
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						var fatherNodesArray = []
						var nodeDepth = nodeObj.depth
						for (var nI = nodeIndex; nI >= 0; nI--) {
								if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
										if (barcodeNodeAttrArray[nI].existed) {
												if ((self.is_aligned_state()) && (BarcodeGlobalSetting['Align_Lock'])) {
														if ((self.is_aligned_range(barcodeNodeAttrArray[nI].id)) || (self.is_aligned_start(barcodeNodeAttrArray[nI].id))) {
																fatherNodesArray.push(barcodeNodeAttrArray[nI])
														}
												} else {
														fatherNodesArray.push(barcodeNodeAttrArray[nI])
												}
										}
										nodeDepth = nodeDepth - 1
								}
						}
						return fatherNodesArray
				}
				,
				//  获取节点的sibling节点
				find_super_tree_sibling_nodes: function (nodeObj) {
						var self = this
						var siblingNodesArray = []
						if (typeof (nodeObj) !== 'undefined') {
								var treeDataModel = self.model
								var nodeIndex = self.get_category_node_index(nodeObj.id)
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var nodeDepth = nodeObj.depth
								//  向后遍历
								for (var nI = (nodeIndex - 1); nI > 0; nI--) {
										if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
												siblingNodesArray.push(barcodeNodeAttrArray[nI])
										}
										if (barcodeNodeAttrArray[nI].depth < nodeDepth) {
												break
										}
								}
								//  向前遍历
								for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
										if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
												siblingNodesArray.push(barcodeNodeAttrArray[nI])
										}
										if (barcodeNodeAttrArray[nI].depth < nodeDepth) {
												break
										}
								}
						}
						return siblingNodesArray
				}
				,
				//  获取节点的children节点
				find_super_tree_children_nodes: function (nodeObj) {
						var self = this
						var childrenNodesArray = []
						if (typeof (nodeObj) !== 'undefined') {
								var nodeIndex = self.get_category_node_index(nodeObj.id)
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var nodeDepth = nodeObj.depth
								for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
										if (barcodeNodeAttrArray[nI].depth > nodeDepth) {
												childrenNodesArray.push(barcodeNodeAttrArray[nI])
										}
										if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
												break
										}
								}
						}
						// self.highlightChildrenNodes(childrenNodesArray)
						return childrenNodesArray
				}
				,
				//  寻找父亲以及当前节点
				find_super_tree_father_current_nodes: function (nodeObj) {
						var self = this
						var fatherNodesArray = []
						if (typeof (nodeObj) !== 'undefined') {
								var nodeIndex = self.get_category_node_index(nodeObj.id)
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var nodeDepth = nodeObj.depth
								for (var nI = nodeIndex; nI >= 0; nI--) {
										if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
												fatherNodesArray.push(barcodeNodeAttrArray[nI])
												nodeDepth = nodeDepth - 1
										}
								}
						}
						return fatherNodesArray
				}
				,
				change_barcode_attr_array: function () {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						change_single_attr_array(barcodeNodeAttrArray)
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						change_single_attr_array(alignedBarcodeNodeAttrArray)
						var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
						change_single_attr_array(compactBarcodeNodeAttrArray)

						function change_single_attr_array(nodeAttrArray) {
								var barcodeNodeInterval_previous = Variables.get('barcodeNodeInterval_previous')
								var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
								var barcodeWidthArray = Variables.get('barcodeWidthArray')
								var barcodeWidthArray_previous = Variables.get('barcodeWidthArray_previous')
								//  首先保存先前状态的x坐标
								for (var nI = 0; nI < nodeAttrArray.length; nI++) {
										nodeAttrArray[nI].previousX = nodeAttrArray[nI].x
								}
								for (var nI = 0; nI < nodeAttrArray.length; nI++) {
										var depth = nodeAttrArray[nI].depth
										var previousWidth = barcodeWidthArray_previous[depth]
										var currentWidth = barcodeWidthArray[depth]
										nodeAttrArray[nI].width = barcodeWidthArray[depth]
										if ((nI + 1) < nodeAttrArray.length) {
												var currentNodePreviousX = nodeAttrArray[nI].previousX
												var nextNodexPreviousX = nodeAttrArray[nI + 1].previousX
												if (currentNodePreviousX === nextNodexPreviousX) {
														//  当barcode节点之间的间距为0, 那么现在的间距仍然需要为0
														nodeAttrArray[nI + 1].x = nodeAttrArray[nI].x
												} else if (((barcodeNodeInterval_previous + currentNodePreviousX + previousWidth) === nextNodexPreviousX) ||
														((barcodeNodeInterval + currentNodePreviousX + previousWidth) === nextNodexPreviousX) ||
														((barcodeNodeInterval_previous + currentNodePreviousX + currentWidth) === nextNodexPreviousX) ||
														(((barcodeNodeInterval + currentNodePreviousX + currentWidth) === nextNodexPreviousX))) {
														//  不知道在调用改变barcode的attr之前改变的是barcode的什么属性, 所以在满足interval和width的条件的情况下都需要重新计算barcode节点的位置
														//  如果barcode之前的间距为interval, 那么需要根据现在的变化进行改变
														nodeAttrArray[nI + 1].x = nodeAttrArray[nI].x + nodeAttrArray[nI].width + barcodeNodeInterval
												} else {
														//  当barcode节点之间间距不是interval, 可能是增加的统计柱状图, 那么仍然要维持现在的间距
														//  其实可以和第一个判断条件相结合得到一个统一的判断
														nodeAttrArray[nI + 1].x = nodeAttrArray[nI].x + (nextNodexPreviousX - currentNodePreviousX)
												}
										}
								}
						}
				}
				,
				// 删除uncollapse的子树中的节点
				remove_uncollapse_nodes: function (nodeDataId, nodeDataDepth) {
						var self = this
						var collapsedSubtreeIdArray = self.get('collapsedSubtreeIdArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						remove_subtree_nodes(barcodeNodeAttrArray, nodeDataId, nodeDataDepth)
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						remove_subtree_nodes(alignedBarcodeNodeAttrArray, nodeDataId, nodeDataDepth)

						function remove_subtree_nodes(nodeAttrArray, nodeDataId, nodeDataDepth) {
								var collapsedRootNodeIndex = 0
								var collapsedNextRootNodeIndex = 0
								var barcodeWidthArray = Variables.get('barcodeWidthArray')
								var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
								var foundClickedNode = false
								if (nodeAttrArray.length === 0) {
										return
								}
								//  第一段寻找点击的node节点的index值
								for (var nI = 0; nI < nodeAttrArray.length; nI++) {
										if ((nodeAttrArray[nI].id === nodeDataId) && (nodeAttrArray[nI].depth === nodeDataDepth)) {
												collapsedRootNodeIndex = nI
												foundClickedNode = true
												break
										}
								}
								if (!foundClickedNode)
										return
								//  第二段依次伸展
								for (var nI = (collapsedRootNodeIndex + 1); nI < nodeAttrArray.length; nI++) {
										if (nodeAttrArray[nI].depth === nodeDataDepth) {
												collapsedNextRootNodeIndex = nI
												break
										}
										//	从折叠部分子树的节点数组中删除该部分子树的节点
										var nodeId = nodeAttrArray[nI].id
										var nodeIdIndex = collapsedSubtreeIdArray.indexOf(nodeId)
										if (nodeIdIndex !== -1) {
												collapsedSubtreeIdArray.splice(nodeIdIndex, 1)
										}
								}
						}
				}
				,
				//	增加折叠子树部分的节点
				add_collapse_nodes: function (nodeDataId, nodeDataDepth) {
						var self = this
						var collapsedSubtreeIdArray = self.get('collapsedSubtreeIdArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						add_subtree_node(barcodeNodeAttrArray, nodeDataId, nodeDataDepth)
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						add_subtree_node(alignedBarcodeNodeAttrArray, nodeDataId, nodeDataDepth)
						var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
						add_subtree_node(compactBarcodeNodeAttrArray, nodeDataId, nodeDataDepth)

						function add_subtree_node(nodeAttrArray, nodeDataId, nodeDataDepth) {
								var collapsedRootNodeIndex = 0
								var collapsedNextRootNodeIndex = -1
								var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
								var foundClickedNode = false
								if (nodeAttrArray.length === 0) {
										return
								}
								//  第一段寻找点击的node节点的index值
								for (var nI = 0; nI < nodeAttrArray.length; nI++) {
										if ((nodeAttrArray[nI].id === nodeDataId) && (nodeAttrArray[nI].depth === nodeDataDepth)) {
												collapsedRootNodeIndex = nI
												foundClickedNode = true
												break
										}
								}
								if (!foundClickedNode)
										return
								//  第二段依次缩进
								for (var nI = (collapsedRootNodeIndex + 1); nI < nodeAttrArray.length; nI++) {
										if (nodeAttrArray[nI].depth === nodeDataDepth) {
												collapsedNextRootNodeIndex = nI
												break
										}
										//	将折叠部分的节点依次放入折叠的节点数组中
										var nodeId = nodeAttrArray[nI].id
										if (collapsedSubtreeIdArray.indexOf(nodeId) === -1) {
												collapsedSubtreeIdArray.push(nodeId)
										}
								}
						}
				}
				,
				//  点击节点使得节点所在的子树被uncollapse所调用的方法
				uncollapse_subtree: function (nodeDataId, nodeDataDepth) {
						var self = this
						var collapsedSubtreeIdArray = self.get('collapsedSubtreeIdArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						uncollapse_subtree_location(barcodeNodeAttrArray, nodeDataId, nodeDataDepth)
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						uncollapse_subtree_location(alignedBarcodeNodeAttrArray, nodeDataId, nodeDataDepth)

						function uncollapse_subtree_location(nodeAttrArray, nodeDataId, nodeDataDepth) {
								var collapsedRootNodeIndex = 0
								var collapsedNextRootNodeIndex = 0
								var barcodeWidthArray = Variables.get('barcodeWidthArray')
								var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
								var foundClickedNode = false
								if (nodeAttrArray.length === 0) {
										return
								}
								//  第一段寻找点击的node节点的index值
								for (var nI = 0; nI < nodeAttrArray.length; nI++) {
										if ((nodeAttrArray[nI].id === nodeDataId) && (nodeAttrArray[nI].depth === nodeDataDepth)) {
												collapsedRootNodeIndex = nI
												foundClickedNode = true
												break
										}
								}
								if (!foundClickedNode)
										return
								//  第二段依次伸展
								for (var nI = (collapsedRootNodeIndex + 1); nI < nodeAttrArray.length; nI++) {
										if (nodeAttrArray[nI].depth === nodeDataDepth) {
												collapsedNextRootNodeIndex = nI
												break
										}
										if (nodeAttrArray[nI - 1].width !== 0) {
												nodeAttrArray[nI].x = nodeAttrArray[nI - 1].x + nodeAttrArray[nI - 1].width + barcodeNodeInterval
										} else {
												nodeAttrArray[nI].x = nodeAttrArray[nI - 1].x
										}
										var depth = nodeAttrArray[nI].depth
										nodeAttrArray[nI].width = barcodeWidthArray[depth]
								}
								//  第三段开始
								//  首先从collapsedNextRootNodeIndex节点向前依次找到width不为0的节点
								var collapsedNextRootIndexBefore = 0
								for (var nI = collapsedNextRootNodeIndex - 1; nI >= 0; nI--) {
										if (nodeAttrArray[nI].width !== 0) {
												collapsedNextRootIndexBefore = nI
												break
										}
								}
								//  第三段依次进行变化
								var currentNodeX = nodeAttrArray[collapsedNextRootIndexBefore].x + nodeAttrArray[collapsedNextRootIndexBefore].width + barcodeNodeInterval
								var differenceX = currentNodeX - nodeAttrArray[collapsedNextRootNodeIndex].x
								if (collapsedNextRootNodeIndex === 0) {
										differenceX = 0
								}
								for (var nI = collapsedNextRootNodeIndex; nI < nodeAttrArray.length; nI++) {
										nodeAttrArray[nI].x = nodeAttrArray[nI].x + differenceX
								}
						}
				}
				,
				//  点击节点使得其为根节点所在的子树被折叠
				collapse_subtree: function (nodeDataId, nodeDataDepth) {
						var self = this
						var collapsedSubtreeIdArray = self.get('collapsedSubtreeIdArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						collapse_change_location(barcodeNodeAttrArray, nodeDataId, nodeDataDepth)
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						collapse_change_location(alignedBarcodeNodeAttrArray, nodeDataId, nodeDataDepth)
						var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
						collapse_change_location(compactBarcodeNodeAttrArray, nodeDataId, nodeDataDepth)

						function collapse_change_location(nodeAttrArray, nodeDataId, nodeDataDepth) {
								var collapsedRootNodeIndex = 0
								var collapsedNextRootNodeIndex = -1
								var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
								var foundClickedNode = false
								if (nodeAttrArray.length === 0) {
										return
								}
								//  第一段寻找点击的node节点的index值
								for (var nI = 0; nI < nodeAttrArray.length; nI++) {
										if ((nodeAttrArray[nI].id === nodeDataId) && (nodeAttrArray[nI].depth === nodeDataDepth)) {
												collapsedRootNodeIndex = nI
												foundClickedNode = true
												break
										}
								}
								if (!foundClickedNode)
										return
								//  第二段依次缩进
								for (var nI = (collapsedRootNodeIndex + 1); nI < nodeAttrArray.length; nI++) {
										if (nodeAttrArray[nI].depth === nodeDataDepth) {
												collapsedNextRootNodeIndex = nI
												break
										}
										//	将折叠部分的节点依次放入折叠的节点数组中
										var nodeId = nodeAttrArray[nI].id
										if (collapsedSubtreeIdArray.indexOf(nodeId) === -1) {
												collapsedSubtreeIdArray.push(nodeId)
										}
										nodeAttrArray[nI].x = nodeAttrArray[collapsedRootNodeIndex].x + nodeAttrArray[collapsedRootNodeIndex].width / 2
										nodeAttrArray[nI].width = 0
								}
								//  下一个root节点不存在,就直接返回
								if (collapsedNextRootNodeIndex === -1) {
										return
								}
								//  第三段依次进行变化
								var currentNodeX = nodeAttrArray[collapsedRootNodeIndex].x + nodeAttrArray[collapsedRootNodeIndex].width + barcodeNodeInterval
								var differenceX = currentNodeX - nodeAttrArray[collapsedNextRootNodeIndex].x
								if (collapsedRootNodeIndex === 0) {
										differenceX = 0
								}
								for (var nI = collapsedNextRootNodeIndex; nI < nodeAttrArray.length; nI++) {
										nodeAttrArray[nI].x = nodeAttrArray[nI].x + differenceX
								}
						}
				}
				,
				//		判断一个节点是否在折叠的节点范围之内
				is_collapsed_subtree_range: function (barcodeNodeId) {
						var self = this
						var collapsedSubtreeIdArray = self.get('collapsedSubtreeIdArray')
						// console.log('collapsedSubtreeIdArray', collapsedSubtreeIdArray)
						// console.log('barcodeNodeId', barcodeNodeId)
						if (collapsedSubtreeIdArray.indexOf(barcodeNodeId) !== -1) {
								return true
						}
						return false
				}
				,
				//  计算barcode对齐部分的子树对应的alignedRangeObj对象
				get_aligned_subtree_obj: function (barcodeNode) {
						var self = this
						var alignedRangeObjArray = self.get('alignedRangeObjArray')
						for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
								var alignedRangeObj = alignedRangeObjArray[aI]
								var alignedObjId = alignedRangeObj.alignedObjId
								if (alignedObjId === barcodeNode.id) {
										return alignedRangeObj
								}
						}
				}
				,
				//  更新对齐部分的后续节点
				update_align_followed_node: function () {
						var self = this
						//  对于原始类型的节点进行改变
						var alignedRangeObjArray = self.get('alignedRangeObjArray')
						var paddingNodeObjArray = self.get('paddingNodeObjArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var _alignedRangeObjArray = self.get('_alignedRangeObjArray')
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						//  对于compact类型的节点进行改变
						var compactAlignedRangeObjArray = self.get('compactAlignedRangeObjArray')
						var compactPaddingNodeObjArray = self.get('compactPaddingNodeObjArray')
						var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
						var _compactAlignedRangeObjArray = self.get('_alignedRangeObjArray')
						var compactAlignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						inner_update_align_followed_node(alignedRangeObjArray, paddingNodeObjArray, barcodeNodeAttrArray)
						inner_update_align_followed_node(_alignedRangeObjArray, paddingNodeObjArray, alignedBarcodeNodeAttrArray)
						/**
							* inner_update_align_followed_node - 移动在对齐节点之后节点
							* @param alignedRangeObjArray - 记录alignRange对象的数组
							* @param barcodeNodeAttrArray - 记录barcode节点属性对象的数组
							*/
						function inner_update_align_followed_node(alignedRangeObjArray, paddingNodeObjArray, barcodeNodeAttrArray) {
								var barcodeNodeGap = Variables.get('barcodeNodeInterval')
								var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
								//  比较结果summary所占的宽度
								var comparisonResultPadding = Variables.get('comparisonResultPadding')
								// for (var aI = (alignedRangeObjArray.length - 1); aI >= 0; aI--) {
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										var rangeStartIndex = alignedRangeObjArray[aI].rangeStartNodeIndex
										//  对于每一个align的节点, 对应的陆续移动其后续节点
										aligned_followed_node(barcodeNodeAttrArray, rangeStartIndex, alignedRangeObjArray, paddingNodeObjArray)
								}
								/**
									* aligned_followed_node - 对齐后续节点的方法是找到一个平移的距离值。
									* align之后存在一个之前的x值以及移动之后移动到的x值, 我们不能直接按照barcode的序列依次相加计算得到barcode中节点的位置, 因为在其中存在各种各样的情况, 将所有情况记录下来的方法过于复杂, 因此我们采用的是将
									* @param barcodeNodeAttrArray - 记录barcode节点属性对象的数组
									* @param rangeStartIndex - 对齐对象的startIndex属性
									* @param alignedRangeObjArray - 对齐对象的数组
									*/
								function aligned_followed_node(barcodeNodeAttrArray, rangeStartIndex, alignedRangeObjArray, paddingNodeObjArray) {
										var barcodeNode = barcodeNodeAttrArray[rangeStartIndex]
										var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
										var rangeAlignedNodeId = barcodeNodeAttrArray[rangeStartIndex].id
										//  根据align节点的id判断当前focus的子树是否是在比较节点数目的状态
										// var barcodeNodeSubtreeWidth = barcodeNode.subtreeWidth
										var barcodeNodeSubtreeWidth = null
										var alignedRangeObj = self.get_aligned_subtree_obj(barcodeNode)//barcodeNode.subtreeWidth
										if (typeof (alignedRangeObj) !== 'undefined') {
												barcodeNodeSubtreeWidth = alignedRangeObj.maxAlignedLength
										}
										var nextAlignedIndex = null
										var movedX = 0
										var BarcodeTreeSplitWidth = 0
										var BarcodeTree_Split = BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split']
										if (BarcodeTree_Split) {
												BarcodeTreeSplitWidth = Variables.get('BarcodeTree_Split_Width')
										}
										//  nextAlignedIndex的含义是在这个index处, 所有的barcodeTree的相应节点的x值是相同的
										for (var bI = (rangeStartIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
												if (barcodeNodeAttrArray[bI].depth <= barcodeNode.depth) {
														nextAlignedIndex = bI
														break
												}
										}
										//  如果当前的align节点是最开始的部分, 那么就不进行移动
										if (rangeStartIndex === 0) {
												nextAlignedIndex = 0
												movedX = 0
										} else {
												if (typeof (barcodeNodeAttrArray[nextAlignedIndex]) !== 'undefined') {
														var previousX = barcodeNodeAttrArray[nextAlignedIndex].x
														if (isAlignedNodeStartIndex(alignedRangeObjArray, nextAlignedIndex)) {//  判断下面的一个节点是否是对齐的aligned部分的第一个节点
																/**
																	* nextAlignedIndex指的是后面的一个所有的barcodeTree具有相同x位置的节点
																	* 对于每一个align的barcode片段计算其后面的barcode节点的位置:
																	* 对于某一个align节点而言, 如果其后面是另一个align节点, 那么表示遇到了padding节点所代表的节点数量为空的情况, 在该情况下,
																	* 从align的barcode节点到另外一个align的barcode节点, 相隔的有barcodeNode.subtreeWidth, barcodeNodeGap, comparisonResultPadding,并且根据paddingObj是否compact增加其宽度
																	*/
																		//  说明找到的这个节点和之前的aligned节点之间存在一个padding node
																var paddingNodeObj = findBeforePaddingNode(nextAlignedIndex, paddingNodeObjArray) //  根据这个align节点的第一个节点的index找到其前面的padding节点
																// previousX = previousX - comparisonResultPadding - barcodeNodeGap - barcodeNodePadding
																if (paddingNodeObj == null) { // 如果没有返回信息,说明这种情况下是BarcodeTree的align部分后面空一部分, 然后紧接着align的部分
																		barcodeNodeAttrArray[nextAlignedIndex].x = barcodeNode.x + barcodeNodeSubtreeWidth + barcodeNodeGap + comparisonResultPadding //+ paddingNodeObj.realCompressPaddingNodeWidth// (modify) barcodeNodePadding //+ barcodeNodePadding//+
																} else {
																		//  在padding node为空时, 前后都要去掉增加的barcodeNodeGap, 所以不是增加barcodeNodeGap,反而减一个barcodeNodeGap
																		barcodeNodeAttrArray[nextAlignedIndex].x = barcodeNode.x + barcodeNodeSubtreeWidth + comparisonResultPadding - barcodeNodeGap - barcodeNode.width// // (modify) barcodeNodePadding //+ barcodeNodePadding//+
																}
																movedX = barcodeNodeAttrArray[nextAlignedIndex].x - previousX
																if (isAlignedNodeStartIndex(alignedRangeObjArray, nextAlignedIndex)) {
																		// 如果中间不存在padding的节点, 那么就不进行移动, 将移动的节点重新移动回去
																		barcodeNodeAttrArray[nextAlignedIndex].x = previousX
																}
														} else {
																barcodeNodeAttrArray[nextAlignedIndex].x = barcodeNode.x + barcodeNodeSubtreeWidth + barcodeNodeGap
																movedX = barcodeNodeAttrArray[nextAlignedIndex].x - previousX
														}
														movedX = movedX + BarcodeTreeSplitWidth
												} else {
														movedX = 0
												}
										}
										//  正常的情况下nextAlignedIndex是一个paddingNode的开始节点, 如果这个alignedNode之后紧跟着另一个alingedNode,
										//  那么nextAlignedIndex是alignNode开始的节点
										if ((nextAlignedIndex != null)) {//&& !(isAlignedNodeStartIndex(alignedRangeObjArray, nextAlignedIndex))
												if (!isAlignedNodeStartIndex(alignedRangeObjArray, nextAlignedIndex)) { // 如果中间不存在padding的节点, 那么就不进行移动
														barcodeNodeAttrArray[nextAlignedIndex].x = barcodeNodeAttrArray[nextAlignedIndex].x + BarcodeTreeSplitWidth
														for (var bI = (nextAlignedIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
																if (isAlignedNodeStartIndex(alignedRangeObjArray, bI)) {
																		break
																}
																// if (isAlignedNodeStartIndex(alignedRangeObjArray, nextAlignedIndex)) {
																//   break
																// }
																barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI].x + movedX
														}
												}
										}
								}
						}

						/**
							* 已知某一个aling的节点的前面是一个padding节点, 并且在paddingNodeObjArray中存储着这个barcode的每一个padding片段的属性信息,
							* 该方法可以返回该align片段所对应的padding对象的信息
							* @param nextAlignedIndex - align片段的初始节点
							* @param paddingNodeObjArray - barcodeTree中padding片段的属性信息
							* @returns {*}
							*/
						function findBeforePaddingNode(nextAlignedIndex, paddingNodeObjArray) {
								for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
										if (paddingNodeObjArray[pI].paddingNodeStartIndex === nextAlignedIndex) {
												return paddingNodeObjArray[pI]
										}
								}
								return null
						}

						function isAlignedNodeStartIndex(alignedRangeObjArray, nodeIndex) {
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										if (!alignedRangeObjArray[aI].alignedEmpty) {
												if (nodeIndex === alignedRangeObjArray[aI].rangeStartNodeIndex) {
														return true
												}
										}
								}
								return false
						}
				}
				,
				update_single_compact_barcode_subtree: function (rootId, rootCategory, rootLevel, cloneCompactSuperTreeNodeLocArray, cloneCompactMaxNodeNumTreeNodeLocArray) {
						var self = this
						var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
						var compactAlignedBarcodeNodeAttrArray = self.get('compactAlignedBarcodeNodeAttrArray')
						var compactReplacedNodeObj = self.get_replaced_nodes_array(rootId, rootCategory, rootLevel, compactBarcodeNodeAttrArray)
						//  为什么需要维持alignedBarcodeNodeAttrArray这个对象是因为在比较节点数目时, 需要首先按照MaxNodeNumTree确定一些节点的节点位置, 然后才能够依次排放其他的节点, 进而比较节点的数量
						var compactAlignedReplaceNodeObj = self.get_replaced_nodes_array(rootId, rootCategory, rootLevel, compactAlignedBarcodeNodeAttrArray)
						var compactReplacedNodesArray = compactBarcodeNodeAttrArray.splice(compactReplacedNodeObj.subtreeRootIndex, compactReplacedNodeObj.subtreeLength,...cloneCompactSuperTreeNodeLocArray
						)
						var alignedReplacedNodesArray = compactAlignedBarcodeNodeAttrArray.splice(compactAlignedReplaceNodeObj.subtreeRootIndex, compactAlignedReplaceNodeObj.subtreeLength,...cloneCompactMaxNodeNumTreeNodeLocArray
						)
						self.update_compact_aligned_barcode_node_obj()
						self.chang_compact_exist_attr(compactReplacedNodesArray, compactBarcodeNodeAttrArray)
				}
				,
				update_compact_aligned_barcode_node_obj: function () {
						var self = this
						var compactAlignedBarcodeNodeAttrObj = {}
						var compactAlignedBarcodeNodeAttrArray = self.get('compactAlignedBarcodeNodeAttrArray')
						for (var cI = 0; cI < compactAlignedBarcodeNodeAttrArray.length; cI++) {
								var nodeId = compactAlignedBarcodeNodeAttrArray[cI].id
								compactAlignedBarcodeNodeAttrObj[nodeId] = compactAlignedBarcodeNodeAttrArray[cI]
						}
						self.set('compactAlignedBarcodeNodeAttrObj', compactAlignedBarcodeNodeAttrObj)
				}
				,
				//  将新增加的compact nodeArray中的属性existed赋值为true
				chang_compact_exist_attr: function (replacedNodesArray, barcodeNodeAttrArray) {
						var replaceNodesObj = {}
						for (var rI = 0; rI < replacedNodesArray.length; rI++) {
								if (replacedNodesArray[rI].existed) {
										replaceNodesObj[replacedNodesArray[rI].id] = replacedNodesArray[rI]
								}
						}
						//  在使用supertree替换了之前子树的节点数组之后, 需要利用替换的结果, 对于替换之后的节点数组中的节点进行标记
						//  在替换之前存在的节点的existed属性均为true, 在替换之后将之前存在的节点属性设置为true
						for (var cI = 0; cI < barcodeNodeAttrArray.length; cI++) {
								var nodeId = barcodeNodeAttrArray[cI].id
								if (typeof(replaceNodesObj[nodeId]) !== 'undefined') {
										barcodeNodeAttrArray[cI].existed = true
								}
						}
						//  改变template节点的exist属性, 如果template节点后面的节点存在一个的absolute_father的exist属性为true, 那么template节点的exist属性为true, 否则为false
						var currentTemplateNodeArray = []
						var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
						var TEMPLATE = Config.get('CONSTANT')['TEMPLATE']
						for (var cI = 0; cI < barcodeNodeAttrArray.length; cI++) {
								if (barcodeNodeAttrArray[cI].compactAttr === TEMPLATE) {
										barcodeNodeAttrArray[cI].existed = false
								}
						}
						for (var cI = 0; cI < barcodeNodeAttrArray.length; cI++) {
								if (barcodeNodeAttrArray[cI].compactAttr === TEMPLATE) {
										currentTemplateNodeArray.push(barcodeNodeAttrArray[cI])
								} else if (barcodeNodeAttrArray[cI].compactAttr === ABSOLUTE_COMPACT_FATHER) {
										if (barcodeNodeAttrArray[cI].existed) {
												for (var tI = 0; tI < currentTemplateNodeArray.length; tI++) {
														currentTemplateNodeArray[tI].existed = true
												}
										}
								} else {
										currentTemplateNodeArray = []
								}
						}
				},
				//  计算得到比较的结果
				get_single_comparison_result: function () {
						var self = this
						var basedModel = self.get('basedModel')
						if (basedModel != null) {
								var alignedComparisonResultArray = []
								var basedAlignedRangeObjArray = basedModel.get('alignedRangeObjArray')
								var basedBarcodeNodeAttrArray = basedModel.get('barcodeNodeAttrArray')
								var alignedRangeObjArray = self.get('alignedRangeObjArray')
								var barcodeNodeAttrArray = self.get_barcode_node_attr_array()
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										var alignedObjIndex = alignedRangeObjArray[aI].alignedObjIndex
										var singleAlignedResult = getSingleAlignedObjComparisonResult(basedAlignedRangeObjArray[aI], basedBarcodeNodeAttrArray, alignedRangeObjArray[aI], barcodeNodeAttrArray)
										singleAlignedResult.alignedObjIndex = alignedObjIndex
										alignedComparisonResultArray.push(singleAlignedResult)
								}
								self.set('alignedComparisonResultArray', alignedComparisonResultArray)
						}
						//  对于每一个间隔的对齐对象获取比较结果
						function getSingleAlignedObjComparisonResult(basedAlignedRangeObj, basedBarcodeNodeAttrArray, alignedRangeObj, barcodeNodeAttrArray) {
								var singleAlignedResult = {}
								var basedStartNodeIndex = basedAlignedRangeObj.rangeStartNodeIndex
								var startNodeIndex = alignedRangeObj.rangeStartNodeIndex
								var alignedLength = basedAlignedRangeObj.rangeEndNodeIndex - basedStartNodeIndex
								var sameNodeIdArray = []
								var addedNodeIdArray = []
								var missedNodeIdArray = []
								for (var bI = 0; bI < alignedLength; bI++) {
										var baseNodeIndex = basedStartNodeIndex + bI
										var nodeIndex = startNodeIndex + bI
										var nodeDepth = basedBarcodeNodeAttrArray[baseNodeIndex].depth
										var selectedLevels = Variables.get('selectedLevels')
										if (selectedLevels.indexOf(nodeDepth) !== -1) {
												if ((typeof(barcodeNodeAttrArray[nodeIndex]) !== 'undefined') && (typeof (basedBarcodeNodeAttrArray[baseNodeIndex]) !== 'undefined')) {
														if ((basedBarcodeNodeAttrArray[baseNodeIndex].existed) && (barcodeNodeAttrArray[nodeIndex].existed)) {
																//   based barcode 和 当前的barcode都存在 -> same节点
																sameNodeIdArray.push(basedBarcodeNodeAttrArray[baseNodeIndex].id)
														} else if ((!basedBarcodeNodeAttrArray[baseNodeIndex].existed) && (barcodeNodeAttrArray[nodeIndex].existed)) {
																// based barcode 不存在, 当前的barcode存在 -> added节点
																addedNodeIdArray.push(basedBarcodeNodeAttrArray[baseNodeIndex].id)
														} else if ((basedBarcodeNodeAttrArray[baseNodeIndex].existed) && (!barcodeNodeAttrArray[nodeIndex].existed)) {
																// based barcode存在, 当前的barcode不存在 -> missed节点
																missedNodeIdArray.push(basedBarcodeNodeAttrArray[baseNodeIndex].id)
														}
												}
										}
								}
								singleAlignedResult.sameNodeIdArray = sameNodeIdArray
								singleAlignedResult.addedNodeIdArray = addedNodeIdArray
								singleAlignedResult.missedNodeIdArray = missedNodeIdArray
								return singleAlignedResult
						}
				}
				,
				//  更新barcode显示节点的层级
				update_displayed_level: function () {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var alignedRangeObjArray = self.get('alignedRangeObjArray')
						var paddingNodeObjArray = self.get('paddingNodeObjArray')
						self._update_barcode_node_width(barcodeNodeAttrArray)
						self._update_barcode_node_array(barcodeNodeAttrArray, alignedRangeObjArray, paddingNodeObjArray)
						var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
						var _alignedRangeObjArray = self.get('_alignedRangeObjArray')
						var _paddingNodeObjArray = self.get('_paddingNodeObjArray')
						self._update_barcode_node_width(alignedBarcodeNodeAttrArray)
						self._update_barcode_node_array(alignedBarcodeNodeAttrArray, _alignedRangeObjArray, _paddingNodeObjArray)
				}
				,
				_update_barcode_node_width: function (barcodeNodeAttrArray) {
						var barcodeWidthArray = window.barcodeWidthArray
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								var depth = barcodeNodeAttrArray[bI].depth
								barcodeNodeAttrArray[bI].width = barcodeWidthArray[depth]
						}
				}
				,
				_update_barcode_node_array: function (node_attr_array, aligned_obj_array, padding_obj_array) {
						var self = this
						var ALIGN_START = self.get('ALIGN_START')
						var ALIGN_RANGE = self.get('ALIGN_RANGE')
						var PADDING_RANGE = self.get('PADDING_RANGE')
						var BARCODE_NODE_GAP = Variables.get('barcodeNodeInterval')
						var BARCODE_NODE_PADDING = Config.get('BARCODE_NODE_PADDING')
						var COMPARISON_RESULT_PADDING = Variables.get('comparisonResultPadding')
						var nodeLocationX = 0
						for (var nI = 0; nI < node_attr_array.length; nI++) {
								if (self._node_category(node_attr_array[nI].id) === ALIGN_START) {
										//  该节点是align范围的开始节点
										nodeLocationX = nodeLocationX + BARCODE_NODE_PADDING + COMPARISON_RESULT_PADDING
										node_attr_array[nI].x = nodeLocationX
										if (node_attr_array[nI].width === 0) {
												nodeLocationX = nodeLocationX
										} else {
												nodeLocationX = nodeLocationX + node_attr_array[nI].width + BARCODE_NODE_GAP
										}
								} else if (self._node_category(node_attr_array[nI].id) === ALIGN_RANGE) {
										//  该节点是align范围内的节点
										node_attr_array[nI].x = nodeLocationX
										if (node_attr_array[nI].width === 0) {
												nodeLocationX = nodeLocationX
										} else {
												nodeLocationX = nodeLocationX + node_attr_array[nI].width + BARCODE_NODE_GAP
										}
								} else if (self._node_category(node_attr_array[nI].id) === PADDING_RANGE) {
										//  该节点是padding范围内的节点
										node_attr_array[nI].x = nodeLocationX
								}
						}
				}
				,
				show_NaN_node: function () {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if (isNaN(barcodeNodeAttrArray[bI].x)) {
								}
						}
				}
				,
				//  使用tablelens的方法对于BarcodeTree的子树进行变形
				tablelens_interested_subtree: function (tablelensSubtreeArray, ratioAndSubtreeObj) {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var ratioObj = ratioAndSubtreeObj.ratioObj
						var subtreeObjArray = ratioAndSubtreeObj.subtreeObjArray
						var focusRatio = ratioObj.focusRatio
						var contextRatio = ratioObj.contextRatio
						var barcodeWidthArray = window.barcodeWidthArray
						var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
						//  初始化barcode的root节点的宽度以及位置
						var rootIndex = 0
						var rootLevel = 0
						var barcodeNodeLoc = 0
						//  在global模式下的当前对齐层级
						var alignedLevel = Variables.get('alignedLevel')
						if (isInFocus(rootIndex, subtreeObjArray)) {
								barcodeNodeAttrArray[rootIndex].x = barcodeNodeLoc
								barcodeNodeAttrArray[rootIndex].width = barcodeWidthArray[rootLevel] * focusRatio
								barcodeNodeLoc = barcodeNodeLoc + barcodeNodeAttrArray[rootIndex].width + barcodeNodeInterval * focusRatio
						}
						//  依次计算barcode的后续节点的宽度以及位置
						for (var cI = 0; cI < barcodeNodeAttrArray.length; cI++) {
								var nodeDepth = barcodeNodeAttrArray[cI].depth
								var nodeWidth = barcodeWidthArray[nodeDepth]
								if (isInFocus(cI, subtreeObjArray)) {
										if (nodeWidth !== 0) {
												nodeWidth = nodeWidth * focusRatio
												barcodeNodeAttrArray[cI].x = barcodeNodeLoc
												barcodeNodeAttrArray[cI].width = nodeWidth
												barcodeNodeLoc = barcodeNodeLoc + nodeWidth + barcodeNodeInterval * focusRatio
										}
								} else {
										if (nodeWidth !== 0) {
												nodeWidth = nodeWidth * contextRatio
												barcodeNodeAttrArray[cI].x = barcodeNodeLoc
												barcodeNodeAttrArray[cI].width = nodeWidth
												barcodeNodeLoc = barcodeNodeLoc + nodeWidth + barcodeNodeInterval * contextRatio
										}
								}
						}
						//  判断节点是否在focus的范围之内
						function isInFocus(bI, subtreeObjArray) {
								for (var sI = 0; sI < subtreeObjArray.length; sI++) {
										var startIndex = subtreeObjArray[sI].startIndex
										var endIndex = subtreeObjArray[sI].endIndex
										if ((bI >= startIndex) && (bI <= endIndex)) {
												return true
										}
								}
								return false
						}
				}
				,
				//  使用tablelens的方法对于BarcodeTree的子树进行变形
				// tablelens_interested_subtree: function (tablelensSubtreeArray, ratioAndSubtreeObj) {
				//   var self = this
				//   var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
				//   var ratioObj = ratioAndSubtreeObj.ratioObj
				//   var subtreeObjArray = ratioAndSubtreeObj.subtreeObjArray
				//   var focusRatio = ratioObj.focusRatio
				//   var contextRatio = ratioObj.contextRatio
				//   var barcodeWidthArray = window.barcodeWidthArray
				//   var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
				//   //  初始化barcode的root节点的宽度以及位置
				//   var rootIndex = 0
				//   var rootLevel = 0
				//   var barcodeNodeLoc = 0
				//   if (isInFocus(rootIndex, subtreeObjArray)) {
				//     barcodeNodeAttrArray[rootIndex].x = barcodeNodeLoc
				//     barcodeNodeAttrArray[rootIndex].width = barcodeWidthArray[rootLevel] * focusRatio
				//     barcodeNodeLoc = barcodeNodeLoc + barcodeNodeAttrArray[rootIndex].width + barcodeNodeInterval * focusRatio
				//   }
				//   //  依次计算barcode的后续节点的宽度以及位置
				//   for (var cI = 0; cI < barcodeNodeAttrArray.length; cI++) {
				//     var nodeDepth = barcodeNodeAttrArray[cI].depth
				//     var nodeWidth = barcodeWidthArray[nodeDepth]
				//     if (isInFocus(cI, subtreeObjArray)) {
				//       if (nodeWidth !== 0) {
				//         nodeWidth = nodeWidth * focusRatio
				//         barcodeNodeAttrArray[cI].x = barcodeNodeLoc
				//         barcodeNodeAttrArray[cI].width = nodeWidth
				//         barcodeNodeLoc = barcodeNodeLoc + nodeWidth + barcodeNodeInterval * focusRatio
				//       }
				//     } else {
				//       if (nodeWidth !== 0) {
				//         nodeWidth = nodeWidth * contextRatio
				//         barcodeNodeAttrArray[cI].x = barcodeNodeLoc
				//         barcodeNodeAttrArray[cI].width = nodeWidth
				//         barcodeNodeLoc = barcodeNodeLoc + nodeWidth + barcodeNodeInterval * contextRatio
				//       }
				//     }
				//   }
				//   //  判断节点是否在focus的范围之内
				//   function isInFocus(bI, subtreeObjArray) {
				//     for (var sI = 0; sI < subtreeObjArray.length; sI++) {
				//       var startIndex = subtreeObjArray[sI].startIndex
				//       var endIndex = subtreeObjArray[sI].endIndex
				//       if ((bI >= startIndex) && (bI <= endIndex)) {
				//         return true
				//       }
				//     }
				//     return false
				//   }
				// }
				// ,
				print_barcode_node_array: function () {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						// var alignedRangeObjArray = self.get('alignedRangeObjArray')
						// for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
						//   var rangeStartNodeIndex = +alignedRangeObjArray[aI].rangeStartNodeIndex
						//   console.log('******after rangeStartNode******' + aI, JSON.parse(JSON.stringify(barcodeNodeAttrArray[rangeStartNodeIndex].x)))
						// }
				}
				,
				//  按照对齐的最大深度更新barcode节点的位置, 这个方法是按照已经aligned的节点的位置, 依次计算得到unaligned节点的位置
				update_unaligned_barcode_node: function () {
						var self = this
						//  更新原始的非对齐的barcode节点
						var alignedRangeObjArray = self.get('alignedRangeObjArray')
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						//  更新compact形式的非对齐barcode节点
						var compactAlignedRangeObjArray = self.get('compactAlignedRangeObjArray')
						var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
						// 增加了变量previousNode节点, 所代表的含义是当前节点的前一个存在的节点
						inner_update_unaligned_barcode_node(alignedRangeObjArray, barcodeNodeAttrArray)
						//  对于focus部分的非aligned的节点部分
						function inner_update_unaligned_barcode_node(alignedRangeObjArray, barcodeNodeAttrArray) {
								var barcodeNodeGap = Variables.get('barcodeNodeInterval')
								var alignedDepth = Variables.get('alignedLevel')
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										var previousNode = null
										var alignedRangeObj = alignedRangeObjArray[aI]
										var rangeStartNodeIndex = +alignedRangeObj.rangeStartNodeIndex
										var rangeEndNodeIndex = +alignedRangeObj.rangeEndNodeIndex
										for (var rI = rangeStartNodeIndex; rI <= rangeEndNodeIndex; rI++) {
												var depth = barcodeNodeAttrArray[rI].depth
												if (previousNode != null) {
														if (depth > alignedDepth) {
																//  当节点的深度大于aligned的深度时, 此时需要考虑节点是否存在的问题, 不存在的节点的宽度为0, 同时也不需要增加gap
																if (barcodeNodeAttrArray[rI].existed) {
																		//  当节点属性中的existed为true
																		if ((rI - 1) >= 0) {
																				if (barcodeNodeAttrArray[rI - 1].width !== 0) {
																						barcodeNodeAttrArray[rI].x = previousNode.x + previousNode.width + barcodeNodeGap
																				} else {
																						if (depth > previousNode.depth) {
																								barcodeNodeAttrArray[rI].x = previousNode.x + previousNode.width + barcodeNodeGap
																						} else {
																								barcodeNodeAttrArray[rI].x = barcodeNodeAttrArray[rI - 1].x
																						}
																				}
																		} else {
																				barcodeNodeAttrArray[rI].x = 0
																		}
																} else {
																		//  当节点属性中的existed为false
																		if ((rI - 1) >= 0) {
																				barcodeNodeAttrArray[rI].x = barcodeNodeAttrArray[rI - 1].x
																		} else {
																				barcodeNodeAttrArray[rI].x = 0
																		}
																}
																barcodeNodeAttrArray[rI].beyondAlign = true
														} else {
																barcodeNodeAttrArray[rI].beyondAlign = false
														}
												} else {
														if (depth > alignedDepth) {
																barcodeNodeAttrArray[rI].beyondAlign = true
														} else {
																barcodeNodeAttrArray[rI].beyondAlign = false
														}
												}
												//  选择初始节点, 后续节点依次在初始节点上增加x, 从而组成barcode
												//  初始节点的选择需要保证节点存在, 并且节点的宽度不为0; 或者节点的层次是对齐的层级以上, 即该节点已经对齐
												if (((barcodeNodeAttrArray[rI].existed) && (barcodeNodeAttrArray[rI].width != 0)) || (barcodeNodeAttrArray[rI].depth <= alignedDepth)) {
														previousNode = barcodeNodeAttrArray[rI]
												}
										}
								}
						}
				}
				,
				//  首先更新存在部分的节点, 然后移动padding的节点, 最后更新视图
				existed_first_padding_next_view_update: function () {
						var self = this
						var viewUpdateValue = (self.get('viewUpdateValue') + 1) % 2
						self.set('viewUpdateValue', viewUpdateValue)
				}
				,
				//  直接一起更新视图, 没有按照节点类型分卡的先后顺序
				concurrent_view_update: function () {
						var self = this
						var viewUpdateConcurrentValue = (self.get('viewUpdateConcurrentValue') + 1) % 2
						self.set('viewUpdateConcurrentValue', viewUpdateConcurrentValue)
				}
				,
				aligned_move_first_padding_next_view_update: function () {
						var self = this
						var moveFirstPaddingNextUpdateValue = (self.get('moveFirstPaddingNextUpdateValue') + 1) % 2
						self.set('moveFirstPaddingNextUpdateValue', moveFirstPaddingNextUpdateValue)
				}
				,
				//  计算得到paddingNode的位置。计算paddingNode的方式是按照paddingnode的startIndex值计算barcodeTree的的位置
				update_padding_node_location: function () {
						var self = this
						var barcodeNodeAttrArray = self.get_barcode_node_attr_array()
						var paddingNodeObjArray = self.get('paddingNodeObjArray')
						inner_update_padding_node_location(paddingNodeObjArray, barcodeNodeAttrArray)
						// console.log(JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
						// console.log(JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
						function inner_update_padding_node_location(paddingNodeObjArray, barcodeNodeAttrArray) {
								var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
								var comparisonResultPadding = Variables.get('comparisonResultPadding')
								for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
										var paddingNodeStartIndex = paddingNodeObjArray[pI].paddingNodeStartIndex
										var paddingNodeEndIndex = paddingNodeObjArray[pI].paddingNodeEndIndex
										if (paddingNodeStartIndex <= paddingNodeEndIndex) {
												paddingNodeObjArray[pI].paddingNodeX = barcodeNodeAttrArray[paddingNodeStartIndex].x
										} else {
												if (paddingNodeEndIndex < 0) {
														paddingNodeObjArray[pI].paddingNodeX = 0
												} else {
														if ((paddingNodeStartIndex >= barcodeNodeAttrArray.length) || (typeof (paddingNodeStartIndex) === 'undefined')) {
																paddingNodeStartIndex = barcodeNodeAttrArray.length - 1
														}
														paddingNodeObjArray[pI].paddingNodeX = barcodeNodeAttrArray[paddingNodeStartIndex].x - barcodeNodePadding - barcodeNodePadding - comparisonResultPadding// + barcodeNodeAttrArray[ paddingNodeEndIndex ].width
												}
										}
								}
						}
				}
				,
				//  根据节点的id获取节点的对象
				get_node_obj_from_id: function (nodeId) {
						var self = this
						var barcodeNodeAttrArrayObj = self.get('barcodeNodeAttrArrayObj')
						var nodeObj = barcodeNodeAttrArrayObj[nodeId]
						if (typeof (nodeObj) === 'undefined') {
								nodeObj = window.Datacenter.barcodeCollection.get_node_obj_from_id(nodeId)
						}
						return nodeObj
				}
				,
				get_node_index_from_id: function (nodeId, barcodeNodeAttrArray) {
						var self = this
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if (barcodeNodeAttrArray[bI].id === nodeId) {
										return bI
								}
						}
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								var barcodeNodeId = barcodeNodeAttrArray[bI].id
								if (barcodeNodeId > nodeId) {
										return bI
								}
						}
				}
				,
				get_related_index_from_id: function (nodeId, barcodeNodeAttrArray) {
						var self = this
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								var barcodeNodeId = barcodeNodeAttrArray[bI].id
								if (barcodeNodeId > nodeId) {
										return bI
								}
						}
				}
				,
				update_barcode_subtree: function (rootId, rootCategory, rootLevel, maxX, subtreeNodeArray, alignedNodeIdArray) {
						var self = this
						var subtreeRootIndex = -1
						var subtreeEndIndex = -1
						var subtreeLength = 1
						var barcodeAlignNodeGap = Config.get('BARCODE_ALIGNED_NODE_GAP')
						//  保存最初始状态下的节点数组, 数组中保存着节点的位置信息
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var replacedNodeAttrObj = {}
						var back_up_barcodeNodeAttrArray = _.clone(barcodeNodeAttrArray)
						self.set('back_up_barcodeNodeAttrArray', back_up_barcodeNodeAttrArray)
						//  获取点击的节点在该子树中的index值
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if (barcodeNodeAttrArray[bI].id === rootId) {
										subtreeRootIndex = bI
										break
								}
						}
						//  如果在该子树中存在想要替换的子树, 那么计算该子树的长度, 否则替换的子树长度为0
						if (subtreeRootIndex !== -1) {
								for (var bI = (subtreeRootIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
										if (barcodeNodeAttrArray[bI].depth > rootLevel) {
												subtreeEndIndex = bI
												subtreeLength = subtreeLength + 1
										} else if (barcodeNodeAttrArray[bI].depth <= rootLevel) {
												break
										}
								}
						} else {
								var rootCategoryNum = rootCategory
								//  不能够找到该节点的情况下
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										var thisCategory = barcodeNodeAttrArray[bI].category
										if ((thisCategory != NaN) && (rootCategoryNum != NaN)) {
												// if (thisCategory > rootCategoryNum) {
												if (self.is_first_category_bigger(thisCategory, rootCategoryNum)) {
														subtreeRootIndex = bI
														break
												}
										}
								}
								subtreeLength = 0
						}
						if (subtreeRootIndex === -1) {
								subtreeRootIndex = barcodeNodeAttrArray.length
						}
						// //  如果在遍历所有的barcode之后仍然找不到该子树应该所在的位置, 那么就将子树放到最后
						// if (subtreeRootIndex === -1) {
						//   subtreeRootIndex = barcodeNodeAttrArray.length - 1
						// }
						//  插入节点数组
						var replacedNodesArray = barcodeNodeAttrArray.splice(subtreeRootIndex, subtreeLength,...subtreeNodeArray
						)
						//  对齐的子树的长度, 用来对于子树进行对齐
						var subtreeNodeArrayLength = subtreeNodeArray.length
						//  对于barcodeNodeAttrArray建立索引, 方便判断该节点是否在之前存在
						// for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
						//   barcodeNodeAttrObj[ barcodeNodeAttrArray[ bI ].id ] = barcodeNodeAttrArray[ bI ]
						// }
						//  对于替换的节点数组建立索引
						for (var rI = 0; rI < replacedNodesArray.length; rI++) {
								replacedNodeAttrObj[replacedNodesArray[rI].id] = replacedNodesArray[rI]
						}
						//  遍历新增加的节点, 如果之前存在并且exist属性为true, 则existed属性设置为true
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								var nodeId = barcodeNodeAttrArray[bI].id
								if (typeof(replacedNodeAttrObj[nodeId]) !== 'undefined') {
										if (replacedNodeAttrObj[nodeId].existed) {
												barcodeNodeAttrArray[bI].existed = true
										}
								}
						}
						// 将插入的节点数组, 后面的节点继续向后进行移动, 一直到整个数组是连续的
						barcodeNodeAttrArray[subtreeRootIndex].x = maxX
						var nodeGap = Variables.get('barcodeNodeInterval') //barcodeNodeAttrArray[ 1 ].x - (barcodeNodeAttrArray[ 0 ].x + barcodeNodeAttrArray[ 0 ].width)
						var alignedObjArray = []
						for (var bI = (subtreeRootIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {//(subtreeRootIndex + 1)
								var thisNodeId = barcodeNodeAttrArray[bI].id
								var thisNodeX = barcodeNodeAttrArray[bI].x
								var formerNodeX = barcodeNodeAttrArray[bI - 1].x
								var formerNodeWidth = barcodeNodeAttrArray[bI - 1].width
								//  下一个节点是对齐的节点, 并且距离aligned节点之间存在一定的间隙, 则不对该节点进行移动, 否则按照计算的准则更改节点的位置
								if (alignedNodeIdArray.indexOf(thisNodeId) !== -1) { //&& (bI !== subtreeRootIndex))
										var computedNodeX = formerNodeX + formerNodeWidth + nodeGap
										//  如果计算得到的节点的位置x大于当前的节点, 即可能遇到下一个对齐的部分, 对于下一个对齐的部分应该怎样移动
										if (computedNodeX > thisNodeX) {
												alignedObjArray.push({'alignedNodeId': thisNodeId, 'alignedNodeX': computedNodeX})
												barcodeNodeAttrArray[bI].x = computedNodeX
										}
								} else {
										if (barcodeNodeAttrArray[bI - 1].width !== 0) {
												barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width + nodeGap
										} else {
												barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x
										}
										if (bI === (subtreeRootIndex + subtreeNodeArrayLength)) {
												barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI].x + barcodeAlignNodeGap
										}
								}
						}
						return alignedObjArray
						// var alignedObj = { 'alignedNodeId': alignedNodeId, 'movedX': movedX }
						// for (var bI = (subtreeRootIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {//(subtreeRootIndex + 1)
						//   var thisNodeId = barcodeNodeAttrArray[ bI ].id
						//   var thisNodeX = barcodeNodeAttrArray[ bI ].x
						//   var formerNodeX = barcodeNodeAttrArray[ bI - 1 ].x
						//   var formerNodeWidth = barcodeNodeAttrArray[ bI - 1 ].width
						//   //  下一个节点是对齐的节点, 并且距离aligned节点之间存在一定的间隙, 则不对该节点进行移动, 否则按照计算的准则更改节点的位置
						//   if (alignedNodeIdArray.indexOf(thisNodeId) !== -1) { //&& (bI !== subtreeRootIndex))
						//     var computedNodeX = formerNodeX + formerNodeWidth + nodeGap
						//     //  如果计算得到的节点的位置x大于当前的节点, 即可能遇到下一个对齐的部分, 对于下一个对齐的部分应该怎样移动
						//     if (computedNodeX > thisNodeX) {
						//       alignedObj.movedX = computedNodeX - thisNodeX
						//     }
						//     alignedObj.alignedNodeId = thisNodeId
						//     break
						//   } else {
						//     if (barcodeNodeAttrArray[ bI - 1 ].width !== 0) {
						//       barcodeNodeAttrArray[ bI ].x = barcodeNodeAttrArray[ bI - 1 ].x + barcodeNodeAttrArray[ bI - 1 ].width + nodeGap
						//     } else {
						//       barcodeNodeAttrArray[ bI ].x = barcodeNodeAttrArray[ bI - 1 ].x
						//     }
						//     if (bI === (subtreeRootIndex + subtreeNodeArrayLength)) {
						//       barcodeNodeAttrArray[ bI ].x = barcodeNodeAttrArray[ bI ].x + barcodeAlignNodeGap
						//     }
						//   }
						// }
						// return alignedObj
				}
				,
				update_covered_rect_obj: function () {
						var self = this
						var alignedNodeIdArray = Variables.get('alignedNodeIdArray')
						var barcodeNodeAttrArray = null
						barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						var coveredRectObjArray = []
						if (alignedNodeIdArray.length !== 0) {
								coveredRectObjArray.push({
										'startX': 0
								})
								var alignedNodeLevel = -1
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										var barcodeNodeId = barcodeNodeAttrArray[bI].id
										var barcodeNodeDepth = barcodeNodeAttrArray[bI].depth
										if (barcodeNodeDepth <= alignedNodeLevel) {
												coveredRectObjArray.push({
														'startX': barcodeNodeAttrArray[bI].x
												})
												alignedNodeLevel = -1
										}
										if (alignedNodeIdArray.indexOf(barcodeNodeId) !== -1) {
												if (bI !== 0) {
														coveredRectObjArray[coveredRectObjArray.length - 1].endX = barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width
												} else {
														coveredRectObjArray[coveredRectObjArray.length - 1].endX = 0
												}
												alignedNodeLevel = barcodeNodeAttrArray[bI].depth
										}
								}
								if (typeof(coveredRectObjArray[coveredRectObjArray.length - 1].endX) === 'undefined') {
										coveredRectObjArray[coveredRectObjArray.length - 1].endX = barcodeNodeAttrArray[barcodeNodeAttrArray.length - 1].x + barcodeNodeAttrArray[barcodeNodeAttrArray.length - 1].width
								}
								var cloneCoveredRectObjArray = JSON.parse(JSON.stringify(coveredRectObjArray))
								self.set('coveredRectObjArray', cloneCoveredRectObjArray)
						}
				}
				,
				//  根据当前所处的状态获取barcodeNodeAttrArray
				get_barcode_node_attr_array: function () {
						var self = this
						var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
						return barcodeNodeAttrArray
				}
				,
				//	更新计算得到的padding对象数组中的is_removed属性值
				update_padding_node_object_array: function (paddingControlObjIndex) {
						var self = this
						var paddingNodeObjArray = self.get('paddingNodeObjArray')
						if (paddingNodeObjArray[paddingControlObjIndex].is_removed) {
								paddingNodeObjArray[paddingControlObjIndex].is_removed = false
						} else {
								paddingNodeObjArray[paddingControlObjIndex].is_removed = true
						}
				},
				//	设置barcodeTree所有对应的segement的index值
				set_all_barcode_segement_index: function (mI) {
						var self = this
						var barcodeNodeRearrangeObjArray = self.get('barcodeNodeRearrangeObjArray')
						for (var bI = 0; bI < barcodeNodeRearrangeObjArray.length; bI++) {
								var barcodeNodeRearrangeObj = barcodeNodeRearrangeObjArray[bI]
								barcodeNodeRearrangeObj.barcodeTreeIndex = mI
						}
				}
		})
})
