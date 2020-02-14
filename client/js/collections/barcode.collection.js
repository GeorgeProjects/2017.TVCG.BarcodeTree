define([
		'require',
		'marionette',
		'underscore',
		'jquery',
		'backbone',
		'config',
		'd3',
		'variables',
		'models/barcode.model'
], function (require, Mn, _, $, Backbone, Config, d3, Variables, BarcodeModel) {
		'use strict'

		return Backbone.Collection.extend({
				model: BarcodeModel,
				defaults: {
						hovering_barcodetree_node: null
				},
				initialize: function () {
						var self = this
						self.subtreeNodeArrayObj = {}
						self.alignedNodeIdArray = []
						self.globalAlignedNodeIdArray = []
						self.globalAlignedNodeObjArray = []
						self.alignedNodeObjArray = []
						self.selectedNodesId = {}
						self.superTreeSelectedNodesId = {}
						self.basedModel = null
						self.basedModelId = null
						self.sortSimilarityConfigState = false
						self.collapsedNodeIdArray = []
						self.tablelensSubtreeArray = []
						self.categoryNodeObjArray = null
						self.operationItemList = []
						self.unalignItemList = []
						self.selectedNodesIdObj = {}
						self.alignedTreeSelectedNodesIdObj = {}
						self.alignedLockedSelectedSortObj = null
						self.paddingSubtreeRangeObject = {}
						self.barcodeNodeYMaxY = 0
						//	存放排序参数设置的对象
						self.sortConfigObj = {}
						self.barcodeTreeNodeSumNum = 0
						//	折叠的子树部分的最大的属性值
						self.maxCollapseTriangleInfo = {}
						Variables.set('alignedNodeIdArray', self.alignedNodeIdArray)
						//  判断barcode当前的模式, 如果是global模式, 那么需要将barcode中的对齐部分进行改变
						var displayMode = Variables.get('displayMode')
						if (displayMode === Config.get("CONSTANT").GLOBAL) {
								init_global_align()
						}
						function init_global_align() {
								var rootId = 'root'
								var rootLevel = 0
								var rootCategory = 'root'
								self.alignedNodeIdArray.push(rootId)
								self.alignedNodeObjArray.push({
										alignedNodeId: rootId,
										alignedNodeLevel: rootLevel,
										alignedNodeCategory: rootCategory
								})
						}
				},
				/**
					* 删除所有的排序对象
					*/
				clear_sorting_obj: function () {
						var self = this
						self.sortConfigObj = {}
				},
				//  清空所有的padding节点
				clear_global_padding_node: function () {
						var self = this
						self.each(function (model) {
								model.clear_global_padding_node()
						})
				},
				//  清空所有的barcodeModel
				clear_all: function () {
						var self = this
						var barcodeModelIdArray = []
						self.each(function (model) {
								barcodeModelIdArray.push(model.get('barcodeTreeId'))
						})
						for (var bI = 0; bI < barcodeModelIdArray.length; bI++) {
								var barcodeModelId = barcodeModelIdArray[bI]
								self.remove(self.where({barcodeTreeId: barcodeModelId}))
						}
						self.sortConfigObj = {}
				},
				//	计算得到padding的对象数组
				get_padding_node_object_array: function () {
						var self = this
						var barcodeSize = self.length
						if (barcodeSize > 0) {
								var firstBarcodeModelFilterResult = self.where({barcodeIndex: 0})
								if (firstBarcodeModelFilterResult.length > 0) {
										var firstBarcodeModel = firstBarcodeModelFilterResult[0]
										var paddingNodeObjArray = firstBarcodeModel.get('paddingNodeObjArray')
										return paddingNodeObjArray
								}
						}
				},
				//	更新计算得到的padding对象数组中的is_removed属性值
				update_padding_node_object_array: function (paddingControlObjIndex) {
						var self = this
						self.each(function (model) {
								model.update_padding_node_object_array(paddingControlObjIndex)
						})
				},
				//  根据传递节点的id计算下面的子树节点的对应位置
				get_barcode_detailed_subtree: function (node_id, node_level) {
						var self = this
						var barcodeModel = self.at(0)
						var finalSubtreeRangeObject = barcodeModel.get_next_subtree_range(node_id, node_level)
						var finalSubtreeRangeObjectArray = []
						self.each(function (barcodeModel) {
								var subtreeRangeObject = barcodeModel.get_next_subtree_range(node_id, node_level)
								for (var item in subtreeRangeObject) {
										if (typeof (finalSubtreeRangeObject[item]) !== 'undefined') {
												var finalSubtreeStartX = finalSubtreeRangeObject[item].subtreeStartX
												var finalSubtreeEndX = finalSubtreeRangeObject[item].subtreeEndX
												var subtreeStartX = subtreeRangeObject[item].subtreeStartX
												var subtreeEndX = subtreeRangeObject[item].subtreeEndX
												finalSubtreeRangeObject[item].subtreeStartX = finalSubtreeStartX > subtreeStartX ? subtreeStartX : finalSubtreeStartX
												finalSubtreeRangeObject[item].subtreeEndX = finalSubtreeEndX < subtreeEndX ? subtreeEndX : finalSubtreeEndX
										} else {
												finalSubtreeRangeObject[item] = new Object()
												finalSubtreeRangeObject[item].subtreeStartX = subtreeRangeObject[item].subtreeStartX
												finalSubtreeRangeObject[item].subtreeEndX = subtreeRangeObject[item].subtreeEndX
										}
										if (typeof (finalSubtreeEndX) === 'undefined') {
												finalSubtreeRangeObject[item].subtreeEndX = subtreeEndX
										}
										if (typeof (finalSubtreeStartX) === 'undefined') {
												finalSubtreeRangeObject[item].subtreeStartX = finalSubtreeStartX
										}
								}
						})
						for (var item in finalSubtreeRangeObject) {
								finalSubtreeRangeObjectArray.push(finalSubtreeRangeObject[item])
						}
						return finalSubtreeRangeObjectArray
				},
				//  根据传递的节点的id计算节点下面的子树节点所占比例
				get_barcode_proportion: function (node_id) {
						var self = this
						var barcodeSize = self.length
						var sumSubtreeLengthObj = {}
						var averageSubtreeLengthObj = {}
						var proportionSubtreeObj = {}
						var proportionSubtreeObjArray = []
						self.each(function (model) {
								var subtreeLengthObj = model.get_subree_size_obj_array(node_id)
								for (var item in subtreeLengthObj) {
										if (typeof (sumSubtreeLengthObj[item]) === 'undefined') {
												sumSubtreeLengthObj[item] = 0
										}
										sumSubtreeLengthObj[item] = sumSubtreeLengthObj[item] + subtreeLengthObj[item]
								}
						})
						//  计算subtree的节点数目的平均值
						var sumAverageSubtreeLength = 0
						for (var item in sumSubtreeLengthObj) {
								if (barcodeSize > 0) {
										averageSubtreeLengthObj[item] = sumSubtreeLengthObj[item] / barcodeSize
										sumAverageSubtreeLength = sumAverageSubtreeLength + averageSubtreeLengthObj[item]
								}
						}
						//  计算subtree的节点数目的比例值
						for (var item in averageSubtreeLengthObj) {
								proportionSubtreeObj[item] = averageSubtreeLengthObj[item] / sumAverageSubtreeLength
						}
						for (var item in proportionSubtreeObj) {
								proportionSubtreeObjArray.push({
										id: item,
										proportion: proportionSubtreeObj[item]
								})
						}
						proportionSubtreeObjArray = proportionSubtreeObjArray.sort(function (a, b) {
								return a.id > b.id
						})
						// 在前面先将所有找到的barcodeTree的节点进行排序
						var aggregatedProportion = 0
						for (var pI = 0; pI < proportionSubtreeObjArray.length; pI++) {
								proportionSubtreeObjArray[pI].aggregatedProportion = aggregatedProportion
								aggregatedProportion = aggregatedProportion + proportionSubtreeObjArray[pI].proportion
						}
						return proportionSubtreeObjArray
				},
				//  from supertreeview.js 在superTree视图中调用
				get_max_barcode_node_width: function (nodeId, nodeLevel, alignedNodeObj) {
						var self = this
						var barcodeMaxRightLoc = -Infinity
						var barcodeMinLeftLoc = Infinity
						//  根据节点的id计算节点最大的宽度值, 以及最右侧的位置
						self.each(function (model) {
								var barcodeRightLoc = 0, barcodeLeftLoc = 0
								//  判断这个对齐的对象是否准确的已知节点的边界
								//  如果节点的边界是准确的
								barcodeRightLoc = model.get_right_loc(nodeId, nodeLevel)
								barcodeLeftLoc = model.get_left_loc(nodeId, nodeLevel)
								// if (alignedNodeObj.accurate_subtree) {
								// } else {
								//   //  如果节点的边界是不准确的
								//   // barcodeRightLoc = model.get_padding_node_right_loc(alignedNodeObj.accurate_subtree_id, nodeLevel)
								//   var accurateBarcodeRightLoc = model.get_right_loc(nodeId, nodeLevel)
								//   //  在计算superTree的节点右侧的边界时, 需要判断选择精确地边界还是有paddingNode的glyph确定的边界, 因为有可能用户展开最右侧的glyph从而得到精确的节点
								//   // barcodeRightLoc = barcodeRightLoc > accurateBarcodeRightLoc ? barcodeRightLoc : accurateBarcodeRightLoc
								//   barcodeRightLoc = accurateBarcodeRightLoc
								//   // barcodeLeftLoc = model.get_padding_node_left_loc(alignedNodeObj.accurate_subtree_id, nodeLevel)
								//   barcodeLeftLoc = model.get_left_loc(nodeId, nodeLevel)
								// }
								if ((barcodeRightLoc != null) && (typeof (barcodeRightLoc) !== 'undefined') && (!isNaN(barcodeRightLoc))) {
										if (barcodeRightLoc > barcodeMaxRightLoc) {
												barcodeMaxRightLoc = barcodeRightLoc
										}
										//  如果初始设置的barcodeMaxRightLoc是一个不符合规定的数值, 那么就直接替换该数据
										if ((barcodeMaxRightLoc == null) || (typeof (barcodeMaxRightLoc) === 'undefined') || (isNaN(barcodeMaxRightLoc))) {
												barcodeMaxRightLoc = barcodeRightLoc
										}
								}
								if ((barcodeLeftLoc != null) && (typeof (barcodeLeftLoc) !== 'undefined') && (!isNaN(barcodeLeftLoc))) {
										if (barcodeLeftLoc < barcodeMinLeftLoc) {
												barcodeMinLeftLoc = barcodeLeftLoc
										}
										//  如果初始设置的barcodeMinLeftLoc是一个不符合规定的数值, 那么就直接替换该数据
										if ((barcodeMinLeftLoc == null) || (typeof (barcodeMinLeftLoc) === 'undefined') || (isNaN(barcodeMinLeftLoc))) {
												barcodeMinLeftLoc = barcodeLeftLoc
										}
								}
						})
						var barcodeMaxWidth = barcodeMaxRightLoc - barcodeMinLeftLoc
						//  保证冰柱图的宽度barcodeMaxWidth不为0
						if (barcodeMaxWidth < 0) {
								barcodeMaxWidth = 0
						}
						var icicleNodeObject = {x: barcodeMinLeftLoc, width: barcodeMaxWidth}
						return icicleNodeObject
				},
				//  获取当前对齐的最深的子树部分
				get_aligned_subtree: function () {
						var self = this
						return self.alignedNodeObjArray
				},
				//  获取table lens的array
				get_tablelens_subtree_array: function () {
						var self = this
						return self.tablelensSubtreeArray
				},
				get_collapse_node_id_array: function () {
						var self = this
						return self.collapsedNodeIdArray
				},
				//  获取当前的状态, 是否存在节点正在对齐的状态
				get_current_aligned_state: function () {
						var self = this
						var alignedNodeIdArray = self.alignedNodeIdArray
						var alignedState = false
						if (alignedNodeIdArray.length > 0) {
								alignedState = true
						}
						return alignedState
				}
				,
				//  在操作的节点数组中增加节点
				add_operation_item: function (nodeData, barcodeTreeId, srcElement) {
						var self = this
						var operationItemList = self.operationItemList
						var nodeObjId = nodeData.id
						var nodeObjDepth = nodeData.depth
						var elementExisted = false
						for (var oI = 0; oI < operationItemList.length; oI++) {
								var testNodeData = operationItemList[oI].nodeData
								if ((nodeObjId === testNodeData.id) && (nodeObjDepth === testNodeData.depth)) {
										elementExisted = true
										break
								}
						}
						if (!elementExisted) {
								operationItemList.push({'nodeData': nodeData, 'barcodeTreeId': barcodeTreeId, 'srcElement': srcElement})
						}
				},
				//  判断是否存在align的节点
				is_exist_align_part: function () {
						var self = this
						var alignedNodeObjArray = self.alignedNodeObjArray
						if (alignedNodeObjArray.length > 0) {
								return true
						} else {
								return false
						}
				},
				//  记录选择的unaligned的item
				add_unaligned_item: function (nodeData, barcodeTreeId, srcElement) {
						var self = this
						var unalignItemList = self.unalignItemList
						var nodeObjId = nodeData.id
						var nodeObjDepth = nodeData.depth
						var elementExisted = false
						for (var oI = 0; oI < unalignItemList.length; oI++) {
								var testNodeData = unalignItemList[oI].nodeData
								if ((nodeObjId === testNodeData.id) && (nodeObjDepth === testNodeData.depth)) {
										elementExisted = true
										break
								}
						}
						if (!elementExisted) {
								unalignItemList.push({'nodeData': nodeData, 'barcodeTreeId': barcodeTreeId, 'srcElement': srcElement})
						}
				}
				,
				//  记录选择的unaligned的item
				remove_unaligned_item: function (nodeData, barcodeTreeId) {
						var self = this
						var unalignItemList = self.unalignItemList
						var nodeObjId = nodeData.id
						var nodeObjDepth = nodeData.depth
						var elementExisted = false
						for (var oI = 0; oI < unalignItemList.length; oI++) {
								var testNodeData = unalignItemList[oI].nodeData
								if ((nodeObjId === testNodeData.id) && (nodeObjDepth === testNodeData.depth)) {
										unalignItemList.splice(oI, 1)
										break
								}
						}
				}
				,
				//  在操作的节点数组中删除节点
				remove_operation_item: function (nodeData) {
						var self = this
						var operationItemList = self.operationItemList
						var nodeObjId = nodeData.id
						var nodeObjDepth = nodeData.depth
						for (var oI = 0; oI < operationItemList.length; oI++) {
								var testNodeData = operationItemList[oI].nodeData
								if ((nodeObjId === testNodeData.id) && (nodeObjDepth === testNodeData.depth)) {
										operationItemList.splice(oI, 1)
										break
								}
						}
						var updateOperationItem = operationItemList[operationItemList.length - 1]
						return updateOperationItem
				}
				,
				//  获取操作的节点数组
				get_operation_item: function () {
						var self = this
						return self.operationItemList
				}
				,
				//  获取要删除对齐的节点数组
				get_unaligned_item: function () {
						var self = this
						return self.unalignItemList
				},
				set_operation_results_existed: function (itemArray, operationType) {
						var self = this
						var sameCount = 0
						self.each(function (barcodeModel) {
								var existedItemArray = barcodeModel.get('itemArray')
								var existedOperationType = barcodeModel.get('operationType')
								if ((typeof (existedItemArray)) !== 'undefined') {
										if ((itemArray.samewith(existedItemArray)) && (operationType === existedOperationType)) {
												sameCount = sameCount + 1
										}
								}
						})
						if (sameCount === 0) {
								return false
						} else {
								return true
						}
				},
				/**
					*  更新现有的barcodemodel的颜色
					*/
				update_barcode_model_color: function (selectedItemsArray, selectionColor) {
						var self = this
						for (var sI = 0; sI < selectedItemsArray.length; sI++) {
								var filterModelArray = self.where({barcodeTreeId: selectedItemsArray[sI]})
								if (filterModelArray.length !== 0) {
										var filterModel = filterModelArray[0]
										filterModel.set('barcodeRectBgColor', selectionColor)
								}
						}
				},
				/**
					* 更新全局的window.barcodeHeight的变量
					*/
				update_barcode_attr: function () {
						var self = this
						var selectItemNameArray = Variables.get('selectItemNameArray')
						var barcodeHeight = Variables.get('originalBarcodeHeight')
						var compactNum = Variables.get('compactNum')
						var superTreeHeight = +$('#supertree-scroll-panel').height()
						var barcodeTreeConfigHeight = +$('#top-toolbar-container').height()//self.get('barcodeTreeConfigHeight')
						var barcodeViewPaddingBottom = Variables.get('barcodeViewPaddingBottom')
						var sortingViewHeight = +$('#sorting-scroll-panel').height()
						var barcodeViewHeight = (+$('#barcode-view').height()) - superTreeHeight - barcodeTreeConfigHeight - barcodeViewPaddingBottom - sortingViewHeight
						var updatedHeight = barcodeViewHeight / selectItemNameArray.length
						var minimumRatio = Variables.get('minimumRatio')
						//  根据当前barcode的不同的模式变换barcode的高度
						// if (Variables.get('layoutMode') === 'ORIGINAL') {
						//  当前的barcode是original的模式, 按照原始的barcode的高度进行绘制
						if (updatedHeight < barcodeHeight * minimumRatio) {
								// 如果增加了barcode之后, 更新的barcode高度小于barcode高度的一半, 那么仍然按照原始barcode高度的一半进行设置
								window.barcodeHeight = barcodeHeight * minimumRatio
						} else {
								// 如果增加了barcode之后, 更新的barcode高度没有那么小, 那就就按照更新的barcode高度进行计算
								//  当然barcode的高度也不能过于大, 最大的高度即为默认的barcode的高度 barcodeHeight
								window.barcodeHeight = updatedHeight > barcodeHeight ? barcodeHeight : updatedHeight
						}
						if (Variables.get('barcodeHeight') !== window.barcodeHeight) {
								Variables.set('barcodeHeight', window.barcodeHeight)
								// self.update_data_all_view()
						}
						$('#barcodetree-scrollpanel').css({'overflow-y': 'auto'})
						// if (updatedHeight < barcodeHeight) {//  理论计算小于实际的barcode的高度, 那么应该是存在scrollBar
						// 		$('#barcodetree-scrollpanel').css({'overflow-y': 'auto'})
						// } else {
						// 		$('#barcodetree-scrollpanel').css({'overflow-y': 'hidden'})
						// }
						// } else {
						// 		//  当前的barcode是非original的模式
						// 		window.barcodeHeight = updatedHeight > barcodeHeight ? barcodeHeight : updatedHeight.toFixed(2)
						// }
				},
				/**
					* 向barcodeCollection中增加新的barcodeModel
					*/
				add_barcode_dataset: function (barcodeModelArray) {
						var self = this
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						//	获取当前需要对齐节点的数组, 根据这个数组判断是否需要在对齐之后绘制节点
						var selectedAlignedItemList = self.filter_by_aligned_level(self.get_selected_aligned_item_list())
						for (var bI = 0; bI < barcodeModelArray.length; bI++) {
								var barcodeModel = barcodeModelArray[bI]
								// self.adjust_barcode_model(barcodeModel)
								barcodeModel.update_statistics_info()
								barcodeModel.set('basedModel', self.basedModel)
								// 将barcodeModel加入到collection中之后则barcode就直接绘制出来了, 所以在add之前需要将barcode的height改变
								// barcodeModel.uniform_layout_height_update()
								barcodeModel.collapse_all_subtree()
								// barcodeModel.tablelens_single_subtree()
								//	比较barcodeModel得到比较的结果
								self.compare_barcode_model(barcodeModel)
								if (selectedAlignedItemList.length > 0) {
										barcodeModel.set('render_added', false)
								} else {
										barcodeModel.set('render_added', true)
								}
								self.add(barcodeModel)
								if (self.length === 1) {
										Backbone.Events.trigger(Config.get('EVENTS')['INIT_ITEM_SORTING_VIEW_ICON'])
								}
						}
						//	更新brush 选择的视图
						self.trigger_brush_selection_view()
						//	根据全集的数据更新barcodeTree的高度
						self.update_all_barcode_tree_node_height()
						self.update_barcode_model_default_index()
						for (var bI = 0; bI < barcodeModelArray.length; bI++) {
								var barcodeModel = barcodeModelArray[bI]
								barcodeModel.update_tree_id_index_obj()
						}
						self.update_barcode_view_transition_controller()
						self.updateBarcodeNodexMaxX()
						self.updateBarcodeNodeyMaxY()
						//  增加barcode之后, 更新节点属性值的分布的对象
						self.update_barcode_node_collection_obj()
						//  在对齐现有的节点之前需要将Node_Arrangement的参数设置为false
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						$('#node-arrangement').removeClass('active')
						BarcodeGlobalSetting['Node_Arrangement'] = false
						//	对于整体的barcodeTree按照预定的顺序排序
						self.init_sort_barcode_model()
						//  接着进行节点顺序的重新排列
						if (self.sortSimilarityConfigState) {
								self.sort_accord_similarity()
						}
						self.uniform_layout()
						//  恢复到原始的barcodeTree的排列顺序, 并且更新barcodeTree的视图
						// self.recover_barcode_model_sequence()
						if (selectedAlignedItemList.length > 0) {
								self.align_node_in_selected_list()
						}
						if ((BarcodeGlobalSetting['BarcodeTree_Color_Encoding']) || (BarcodeGlobalSetting['BarcodeTree_Height_Encoding'])
								|| (BarcodeGlobalSetting['Subtree_Compact'])) {
								if (selectedAlignedItemList.length === 0) {
										//	增加selectedAlignedItemList !== 0是因为在这种情况下在align BarcodeTree的情况下已经更新了全部的视图, 不需要再次更新
										self.update_data_all_view()
								}
						} else {
								//	存在对齐, 或者编码属性的状态下, 需要更新全部视图, 那么superTree视图也响应的更新了。
								// 但是如果不是这种情况下, 也需要更新superTree视图, 视图中显示的BarcodeTree发生了变化
								self.trigger_render_supertree()
						}
				},
				//	更新barcodeTree的参数
				update_padding_node_paras: function () {
						var self = this
						self.each(function (model) {
								model.init_padding_node_location()
						})
				},
				//	根据barcodeTree collection中的节点数量判断barcodeTree是否采用transition的方式变换
				update_barcode_view_transition_controller: function () {
						var self = this
						var barcodeTreeNodeSumNum = 0
						self.each(function (model) {
								var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
								barcodeTreeNodeSumNum = barcodeTreeNodeSumNum + barcodeNodeAttrArray.length
						})
						self.barcodeTreeNodeSumNum = barcodeTreeNodeSumNum
						if (self.barcodeTreeNodeSumNum > Variables.get('MaxTransitionNodeNum')) {
								Variables.set('EnableTransition', false)
						} else {
								Variables.set('EnableTransition', true)
						}
				},
				/**
					* 更新全局的window.barcodeHeight的变量
					*/
				// update_barcode_attr: function () {
				// 		var self = this
				// 		var barcodeHeight = self.get('barcodeHeight')
				// 		var selectItemNameArray = Variables.get('selectItemNameArray')
				// 		// var superTreeHeight = +$('#supertree-scroll-panel').height()
				// 		// var barcodeTreeConfigHeight = +$('#top-toolbar-container').height()//self.get('barcodeTreeConfigHeight')
				// 		// var barcodeViewPaddingBottom = self.get('barcodeViewPaddingBottom')
				// 		// var sortingViewHeight = +$('#sorting-scroll-panel').height()
				// 		// var barcodeViewHeight = (+$('#barcode-view').height()) - superTreeHeight - barcodeTreeConfigHeight - barcodeViewPaddingBottom - sortingViewHeight
				// 		var barcodeViewHeight = $('#barcodetree-scrollpanel').height
				// 		var updatedHeight = barcodeViewHeight / self.length
				// 		var minimumRatio = Variables.get('minimumRatio')
				// 		//  根据当前barcode的不同的模式变换barcode的高度
				// 		// if (Variables.get('layoutMode') === 'ORIGINAL') {
				// 		//  当前的barcode是original的模式, 按照原始的barcode的高度进行绘制
				// 		if (updatedHeight < barcodeHeight * minimumRatio) {
				// 				// 如果增加了barcode之后, 更新的barcode高度小于barcode高度的一半, 那么仍然按照原始barcode高度的一半进行设置
				// 				window.barcodeHeight = barcodeHeight * minimumRatio
				// 		} else {
				// 				// 如果增加了barcode之后, 更新的barcode高度没有那么小, 那就就按照更新的barcode高度进行计算
				// 				//  当然barcode的高度也不能过于大, 最大的高度即为默认的barcode的高度 barcodeHeight
				// 				window.barcodeHeight = updatedHeight > barcodeHeight ? barcodeHeight : updatedHeight.toFixed(2)
				// 		}
				// 		// if (updatedHeight < barcodeHeight) {//  理论计算小于实际的barcode的高度, 那么应该是存在scrollBar
				// 		// 		$('#barcodetree-scrollpanel').css({'overflow-y': 'auto'})
				// 		// } else {
				// 		// 		$('#barcodetree-scrollpanel').css({'overflow-y': 'hidden'})
				// 		// }
				// 		// } else {
				// 		// 		//  当前的barcode是非original的模式
				// 		// 		window.barcodeHeight = updatedHeight > barcodeHeight ? barcodeHeight : updatedHeight.toFixed(2)
				// 		// }
				// },
				/**
					* 更新当前排序的参数设置
					*/
				update_sort_config: function (asc_desc_para, comparedNodeId, sortOption) {
						var self = this
						self.sortConfigObj.asc_desc_para = asc_desc_para
						self.sortConfigObj.comparedNodeId = comparedNodeId
						self.sortConfigObj.sortOption = sortOption
				},
				/**
					* 在初始化的时候对于BarcodeTree的model进行排序
					*/
				init_sort_barcode_model: function () {
						var self = this
						var sortConfigObj = self.sortConfigObj
						var asc_desc_para = sortConfigObj.asc_desc_para
						var sortOption = sortConfigObj.sortOption
						var compareNodeId = sortConfigObj.comparedNodeId
						if ((typeof (asc_desc_para) !== 'undefined') && (typeof (sortOption) !== 'undefined') && (typeof (compareNodeId) !== 'undefined')) {
								self.uniform_sort_handler(asc_desc_para, sortOption, compareNodeId)
						}
				},
				//	对于barcodeTree进行排序的统一接口
				uniform_sort_handler: function (asc_desc_para, sortOption, comparedNodeId) {
						var self = this
						window.sort_state = true
						if (comparedNodeId == null) {
								return
						}
						if ((sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_DATE_SORT'])
								|| (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_DAY_SORT'])) {
								//	按照属性排序
								self.date_sort_barcode_model(asc_desc_para, comparedNodeId, sortOption)
						} else {
								//	按照时序排序
								self.sort_barcode_model(asc_desc_para, comparedNodeId, sortOption)
						}
						//	更新当前排序的参数设置
						self.update_sort_config(asc_desc_para, comparedNodeId, sortOption)
				},
				/**
					* 更新全部的barcodeTree中节点的高度属性
					*/
				update_all_barcode_tree_node_height: function () {
						var self = this
						var barcodeTreeNodeMaxValue = self.get_all_max_node_value()
						//	修改barcdoeTree节点中属性最大的值
						Variables.set('barcodeTreeNodeMaxValue', barcodeTreeNodeMaxValue)
						var miniHeight = Variables.get('MIN_HEIGHT')
						var powExponenet = Variables.get('POW_EXPONENT')
						var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
						var barcodeHeight = window.barcodeHeight * barcodeHeightRatio
						var heightScale = d3.scale.pow().exponent(powExponenet).domain([0, barcodeTreeNodeMaxValue]).range([miniHeight, barcodeHeight]).clamp(true)
						// console.log('maxValue', maxValue)
						//	初始化颜色的color Scale
						// var colorArray = ["#eeeeee", "black"]
						// var colorArray = ["#2c7bb6", "#00a6ca", "#00ccbc", "#90eb9d", "#ffff8c", "#f9d057", "#f29e2e", "#e76818", "#d7191c"]
						// var colorArray = ["#d73127", "#f46d43", "#fead61", "#fee08b", "#fffec2", "#d9ee90", "#a7d770", "#6abb67", "#1f9850"]
						// var colorArray = ["#1f9850", "#6abb67", "#a7d770", "#d9ee90", "#fffec2", "#fee08b", "#fead61", "#f46d43", "#d73127"]
						// var colorArray = ['#dddddd', '#000000']
						var colorArray = ["#ffffcc", "#ffeda0", '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026']
						var colorDomainArray = []
						var colorNum = colorArray.length
						for (var cI = 0; cI < colorNum; cI++) {
								colorDomainArray.push(cI / colorNum)
						}
						var colorScale = d3.scale.linear().domain(colorDomainArray).range(colorArray);
						self.each(function (model) {
								var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										var barcodeNode = barcodeNodeAttrArray[bI]
										barcodeNode.height_value = heightScale(barcodeNode.num)
										barcodeNode.color_value = colorScale(Math.log(barcodeNode.num) / Math.log(barcodeTreeNodeMaxValue))
										barcodeNode.height = barcodeHeight
								}
						})
				},
				/**
					* 计算得到barcodeTree中最大的节点属性值
					*/
				get_all_max_node_value: function () {
						var self = this
						var allMaxValue = 0
						self.each(function (model) {
								var maxValue = model.get_max_node_value()
								if (maxValue > allMaxValue) {
										allMaxValue = maxValue
								}
						})
						return allMaxValue
				},
				/**
					* barcodeModel在添加的时候会默认增加barcode的index值, 在删除的时候需要默认的更新barcode的index值
					*/
				update_barcode_model_default_index: function () {
						var self = this
						var selectItemNameArray = Variables.get('selectItemNameArray')
						self.each(function (model) {
								model.update_barcode_model_default_index()
						})
				},
				/**
					* 根据barcode的id在barcode collection和selectItem数组中删除对应的barcode
					*/
				remove_item_and_model: function (barId) {
						var self = this
						var selectItemNameArray = Variables.get('selectItemNameArray')
						var itemIndex = selectItemNameArray.indexOf(barId)
						if (itemIndex !== -1) {
								selectItemNameArray.splice(itemIndex, 1)
						}
						var newSelectItemNameArray = []
						for (var sI = 0; sI < selectItemNameArray.length; sI++) {
								newSelectItemNameArray.push(selectItemNameArray[sI])
						}
						Variables.set('selectItemNameArray', newSelectItemNameArray)
						self.remove_barcode_dataset(barId)
						if (self.length === 0) {
								Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_ALL_ITEM_SORTING_VIEW_ICON'])
						}
				},
				/**
					* 在histogram.main.js中取消选择一个barcode文件, 顺序需要做的是update_barcode_location, 删除对应的barcode.model
					* 相应的改变barcode的位置
					*/
				remove_barcode_dataset: function (barcodeTreeId) {
						var self = this
						var filteredModel = self.where({'barcodeTreeId': barcodeTreeId})
						if (filteredModel.length !== 0) {
								self.remove(self.where({'barcodeTreeId': barcodeTreeId}))
						}
						if (self.length === 0) {
								self.reset_all_barcode_collection_parameter()
						}
						//	更新barcodeTree视图是否使用transition方式变换的变量
						self.update_barcode_view_transition_controller()
				},
				/**
					* 删除barcodeModel之后需要对于节点的对齐状况以及视图进行更新
					*/
				update_after_remove_models: function () {
						var self = this
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if (BARCODETREE_GLOBAL_PARAS.Align_State) {
								self.align_node_in_selected_list()
						}
						// self.update_barcode_model_default_index()
						self.uniform_layout()
						// self.update_data_all_view()
				},
				add_tablelens_nodes_global_selection_nodes: function () {
						var self = this
						// barcodeCollection.remove_crossed_node_alignment(nodeObjId)
						// barcodeCollection.add_selected_node(barcodeTreeId, nodeObjId, nodeObjDepth, nodeObjCategory, nodeObjCategoryName, siblingNodesArray, childrenNodesArray)
						var tablelensSubtreeArray = self.tablelensSubtreeArray
						for (var tI = 0; tI < tablelensSubtreeArray.length; tI++) {
								var nodeObjId = tablelensSubtreeArray[tI]
								self.remove_crossed_node_alignment(nodeObjId)
								var nodeObjInfo = self.get_node_obj_by_id(nodeObjId)
								if (nodeObjInfo != null) {
										var barcodeTreeId = nodeObjInfo.barcodeTreeId
										var nodeObj = nodeObjInfo.nodeObj
										var nodeObjId = nodeObj.id
										var nodeObjDepth = nodeObj.depth
										var nodeObjCategory = nodeObj.category
										var nodeObjCategoryName = nodeObj.categoryName
										var siblingNodesArray = []
										var childrenNodesArray = []
										self.add_selected_node(barcodeTreeId, nodeObjId, nodeObjDepth, nodeObjCategory, nodeObjCategoryName, siblingNodesArray, childrenNodesArray)
								}
						}
				},
				get_node_obj_by_id: function (nodeObjId) {
						var self = this
						var nodeObjInfo = null
						self.each(function (model) {
								var barcodeNodeAttrArrayObj = model.get('barcodeNodeAttrArrayObj')
								if ((typeof (barcodeNodeAttrArrayObj[nodeObjId])) !== 'undefined') {
										var findingNodeObj = barcodeNodeAttrArrayObj[nodeObjId]
										nodeObjInfo = {
												nodeObj: findingNodeObj,
												barcodeTreeId: model.get('barcodeTreeId')
										}
								}
						})
						return nodeObjInfo
				},
				//  判断两个节点的范围是否是存在交叉的
				is_crossed_node_range: function (nodeObjId1, nodeObjId2) {
						var self = this
						//  点击的节点是否是之前选择的节点的父亲
						var isParent = self.is_first_node_parent(nodeObjId1, nodeObjId2)
						//  点击的节点是否是之前选择的节点的孩子
						var isChild = self.is_second_node_parent(nodeObjId1, nodeObjId2)
						if (isParent || isChild) {
								return true
						}
				},
				/**
					* 使用tablelens的方法对于BarcodeTree进行变形
					*/
				tablelens_interested_subtree: function (nodeDataArray) {
						var self = this
						var tablelensSubtreeArray = self.tablelensSubtreeArray
						for (var nI = 0; nI < nodeDataArray.length; nI++) {
								var nodeData = nodeDataArray[nI]
						}
						//  将选择的节点增加到
						for (var nI = 0; nI < nodeDataArray.length; nI++) {
								var nodeId = nodeDataArray[nI].id
								var nodeDepth = nodeDataArray[nI].depth
								var nodeCategory = nodeDataArray[nI].category
								//  首先删除掉tablelensSubtreeArray中所有的与nodeDataArray冲突的节点
								for (var tI = 0; tI < tablelensSubtreeArray.length; tI++) {
										var existedNodeId = tablelensSubtreeArray[tI]
										if (self.is_crossed_node_range(nodeId, existedNodeId)) {
												//  说明之前存在于该节点交叉的节点, 那么就去除原本的交叉的节点, :删除的是原本存在的节点
												tablelensSubtreeArray.splice(tI, 1)
												self.remove_supertree_selected_subtree_id(existedNodeId)
												self.remove_global_zoom_node_array(existedNodeId)
										}
								}
								//  判断该节点在tablelen数组中是否存在, 如果存在就删除该节点
								var rootIdIndex = tablelensSubtreeArray.indexOf(nodeId)
								if (rootIdIndex !== -1) {
										//  如果之前已经进行了tablelens进行focus, 那么就删除当前focus的点
										tablelensSubtreeArray.splice(rootIdIndex, 1)
										self.remove_supertree_selected_subtree_id(nodeId)
										self.remove_global_zoom_node_array(nodeId)
								} else {
										tablelensSubtreeArray.push(nodeId)
										self.update_global_zoom_node_array(nodeId, nodeDepth, nodeCategory)
								}
						}
						//  在更新barcode的zoom节点数组之后, 需要及时的更新barcode的zoom和padding的节点范围
						// self.compute_global_zoom_padding_range()
						var ratioAndSubtreeObj = self.get_focus_ratio_obj(tablelensSubtreeArray)
						self.each(function (model) {
								if (ratioAndSubtreeObj != null) {
										model.tablelens_interested_subtree(tablelensSubtreeArray, ratioAndSubtreeObj)
								}
						})
						return (rootIdIndex === -1)
				},
				/**
					* 更新barcodeTree中对齐部分的节点数组
					*/
				update_barcode_subtree_aligned_part: function (rootId, rootCategory, rootLevel, subtreeNodeArray, maxNodeNumTreeNodeLocArray) {
						var self = this
						//  在barcode collection中的model中增加子树的节点
						self.each(function (barcodeModel) {
								var cloneSubtreeNodeArray = JSON.parse(JSON.stringify(subtreeNodeArray))
								var cloneMaxNodeNumTreeNodeLocArray = JSON.parse(JSON.stringify(maxNodeNumTreeNodeLocArray))
								barcodeModel.update_single_barcode_subtree(rootId, rootCategory, rootLevel, cloneSubtreeNodeArray, cloneMaxNodeNumTreeNodeLocArray)
						})
				},
				/**
					* 在singlebarcodetree视图中点击节点进行选中子树的对齐
					*/
				add_super_subtree: function (rootId, rootLevel, rootCategory, alignedLevel, finishAlignDeferObj) {
						var self = this
						self.update_aligned_node_array(rootId, rootLevel, rootCategory)
						//  当addedSubtreeDeferObj对象被resolved的时候, 标志着对齐的子树节点数组被插入到子树的节点数组中, 并且相应的状态已经被更新
						var addedSubtreeDeferObj = $.Deferred()
						$.when(addedSubtreeDeferObj)
								.done(function () {
										//  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
										self.compute_aligned_subtree_range()
										// window.Datacenter.barcodeCollection.update_all_barcode_view()
										finishAlignDeferObj.resolve()
										window.finish_build_supertree_collection511 = new Date()
								})
								.fail(function () {
										console.log('defer fail')
								})
						//  遍历barcodeCollection中的所有barcodeModel, 得到要进行构建superTree的对象
						if (self.length >= 0) {
								window.Datacenter.buildSuperTree(rootId, rootLevel, rootCategory, alignedLevel, addedSubtreeDeferObj)
						}
				},
				/**
					*  获取globalAlignedNodeObjArray节点对象数组
					*/
				get_global_aligned_nodeobj_array: function () {
						var self = this
						var globalAlignedNodeObjArray = self.globalAlignedNodeObjArray
						return globalAlignedNodeObjArray
				},
				/**
					*  获取globalAlignedNodeObjArray节点数组
					*/
				get_global_aligned_nodeid_array: function () {
						var self = this
						var globalAlignedNodeIdArray = self.globalAlignedNodeIdArray
						return globalAlignedNodeIdArray
				},
				/**
					* 更新在全局状态下zoom的节点数组
					*/
				update_global_zoom_node_array: function (rootId, rootLevel, rootCategory) {
						var self = this
						var globalAlignedNodeIdArray = self.globalAlignedNodeIdArray
						var globalAlignedNodeObjArray = self.globalAlignedNodeObjArray
						if (globalAlignedNodeIdArray.indexOf(rootId) === -1) {
								globalAlignedNodeIdArray.push(rootId)
								globalAlignedNodeObjArray.push({
										alignedNodeId: rootId,
										alignedNodeLevel: rootLevel,
										alignedNodeCategory: rootCategory
								})
						}
				},
				/**
					* 更新在全局状态下zoom的节点数组, 删除当前点击的节点数组
					*/
				remove_global_zoom_node_array: function (rootId) {
						var self = this
						var globalAlignedNodeIdArray = self.globalAlignedNodeIdArray
						var globalAlignedNodeObjArray = self.globalAlignedNodeObjArray
						var addedTreeIndex = globalAlignedNodeIdArray.indexOf(rootId)
						if (addedTreeIndex !== -1) {
								globalAlignedNodeIdArray.splice(addedTreeIndex, 1)
								globalAlignedNodeObjArray.splice(addedTreeIndex, 1)
						}
				},
				/**
					* 更新对齐的节点数组
					*/
				update_aligned_node_array: function (rootId, rootLevel, rootCategory) {
						var self = this
						//  alignedNodeIdArray记录已经对齐的节点数组
						var alignedNodeIdArray = self.alignedNodeIdArray
						var alignedNodeObjArray = self.alignedNodeObjArray
						if (alignedNodeIdArray.indexOf(rootId) === -1) {
								alignedNodeIdArray.push(rootId)
								alignedNodeObjArray.push({
										alignedNodeId: rootId,
										alignedNodeLevel: rootLevel,
										alignedNodeCategory: rootCategory
								})
						}
				},
				/**
					*  TODO 在新增了superTree中的节点之后, 重新进行对齐
					*/
				compute_aligned_subtree_range: function () {
						var self = this
						if (self.length <= 0) {
								return
						}
						self.preprocess_barcode_model_data()
						self.process_barcode_model_data()
						//	更新id作为index的对象
						self.update_all_tree_id_index_obj()
						//	在对齐节点之后更新在此之前已经选择的节点部分, 包括孩子节点, 父亲节点等节点数组
						self.update_all_selected_nodes_obj()
				},
				/**
					* 折叠所有的subtree
					*/
				collapse_all_subtree: function () {
						var self = this
						var collapsedNodeIdArray = self.collapsedNodeIdArray
						for (var cI = 0; cI < collapsedNodeIdArray.length; cI++) {
								var nodeObjId = collapsedNodeIdArray[cI]
								var nodeDataDepth = self.get_node_depth_from_id(nodeObjId)
								self.collapse_subtree(nodeObjId, nodeDataDepth)
						}
				},
				//	从节点的id中获取节点的深度
				get_node_depth_from_id: function (nodeDataId) {
						var self = this
						var nodeDataArray = nodeDataId.split('-')
						var nodeDataDepth = nodeDataArray[1]
						return nodeDataDepth
				},
				/**
					* 对每一个model进行遍历以及对于遍历的结果进行整合是作为barcodeTree更新的preprocess
					* 主要是更新barcode的paddingNode和alignedNode的属性信息
					*/
				preprocess_barcode_model_data: function () {
						var self = this
						var alignedNodeIdArray = self.alignedNodeIdArray
						self.preprocess_barcode_model_data_func(alignedNodeIdArray)
				},
				/**
					*  在全局模式下对于barcode model的预处理函数
					*/
				preprocess_barcode_model_data_func: function (zoomNodeIdArray) {
						var self = this
						self.each(function (model) {
								//  计算每个barcode对齐的节点范围以及节点对齐的长度
								model.compute_single_aligned_subtree_range(zoomNodeIdArray)
								//  初始化padding node的节点位置以及padding节点的长度
								model.init_padding_node_location()
								//  更新barcode model的对齐部分的节点数组
								model.update_align_id_array()
								//  更新barcode model的padding部分的节点数组
								model.update_padding_id_array()
						})
						//  需要先将padding node所占据的最大的长度计算出来, 然后更新barcode的节点位置, 因为对齐的需要, 对齐节点需要以padding node的最大节点
						//  在compact的模式下也需要计算padding node所占据的最大的长度, 因为compact模式下的padding node使用锯齿表示, 不同的锯齿的长度是不同的
						self.compute_padding_node_max_length()
						//	计算其他的相关的参数
						self.compute_padding_node_max_statistic2()
						//  在compact的模式下计算align的barcode占据的最大的长度
						self.compute_align_node_max_length()
				},
				/**
					*  计算tablelens之后zoom节点以及padding节点的范围
					*/
				compute_global_zoom_padding_range: function () {
						var self = this
						var globalAlignedNodeIdArray = self.globalAlignedNodeIdArray
						self.each(function (model) {
								//  计算每个global zoom的节点zoom的范围以及padding节点的范围
								model.compute_global_zoom_subtree_range(globalAlignedNodeIdArray)
								//  计算padding节点的范围
								model.compute_global_padding_subtree_range()
								//  计算global的模式下 padding节点的id数组
								model.update_global_padding_id_array()
						})
				},
				/**
					* 清空之前计算的所有的tablelen的zoom节点以及padding节点的范围
					*/
				clear_global_zoom_padding_range: function () {
						var self = this
						self.each(function (model) {
								model.clear_global_zoom_ralated_range()
						})
				},
				/**
					* 删除在全局状态下的zoom节点数组
					*/
				clear_global_zoom_node_array: function () {
						var self = this
						self.globalAlignedNodeIdArray = []
						self.globalAlignedNodeObjArray = []
				},
				/**
					* TODO
					* 更新barcodeTree的视图的具体数据, 进而继续更新视图的信息
					* 如果没有变换barcodeModel中align部分最大长度, padding部分最大长度的数据
					* 而只是处理barcode model中的具体的节点的信息
					*/
				process_barcode_model_data: function () {
						var self = this
						//  更新barcode节点的属性数组
						self.update_barcode_node_attr_array()
				},
				/**
					* 计算global模式下padding node的最大长度, 以及paddingNode的
					*/
				compute_global_padding_node_max_statistic: function () {
						var self = this
						if (self.length === 0) {
								return
						}
						var basedModel = self.at(0)
						var basedPaddingNodeObjArray = basedModel.get('globalPaddingRangeObjArray')
						self.each(function (model) {
								var globalPaddingRangeObjArray = model.get('globalPaddingRangeObjArray')
								for (var pI = 0; pI < globalPaddingRangeObjArray.length; pI++) {
										if (typeof(globalPaddingRangeObjArray) !== 'undefined') {
												if (typeof (basedPaddingNodeObjArray[pI]) !== 'undefined') {
														if (globalPaddingRangeObjArray[pI].maxPaddingNodeLength > basedPaddingNodeObjArray[pI].maxPaddingNodeLength) {
																basedPaddingNodeObjArray[pI].maxPaddingNodeLength = globalPaddingRangeObjArray[pI].maxPaddingNodeLength
														}
														//  计算padding部分的node节点数量, 包括最大值和最小值
														if (globalPaddingRangeObjArray[pI].maxpaddingNodeNumber > basedPaddingNodeObjArray[pI].maxpaddingNodeNumber) {
																basedPaddingNodeObjArray[pI].maxpaddingNodeNumber = globalPaddingRangeObjArray[pI].maxpaddingNodeNumber
														}
														if (globalPaddingRangeObjArray[pI].minpaddingNodeNumber < basedPaddingNodeObjArray[pI].minpaddingNodeNumber) {
																basedPaddingNodeObjArray[pI].minpaddingNodeNumber = globalPaddingRangeObjArray[pI].minpaddingNodeNumber
														}
														//  计算padding部分的node的属性值的数量, 包括最大值和最小值
														if (globalPaddingRangeObjArray[pI].maxpaddingNodeAttrNum > basedPaddingNodeObjArray[pI].maxpaddingNodeAttrNum) {
																basedPaddingNodeObjArray[pI].maxpaddingNodeAttrNum = globalPaddingRangeObjArray[pI].maxpaddingNodeAttrNum
														}
														if (globalPaddingRangeObjArray[pI].minpaddingNodeAttrNum < basedPaddingNodeObjArray[pI].minpaddingNodeAttrNum) {
																basedPaddingNodeObjArray[pI].minpaddingNodeAttrNum = globalPaddingRangeObjArray[pI].minpaddingNodeAttrNum
														}
												}
										}
								}
						})
						self.each(function (model) {
								var globalPaddingRangeObjArray = model.get('globalPaddingRangeObjArray')
								for (var pI = 0; pI < globalPaddingRangeObjArray.length; pI++) {
										globalPaddingRangeObjArray[pI].maxPaddingNodeLength = basedPaddingNodeObjArray[pI].maxPaddingNodeLength
										//  padding节点范围的节点数量
										globalPaddingRangeObjArray[pI].maxpaddingNodeNumber = basedPaddingNodeObjArray[pI].maxpaddingNodeNumber
										globalPaddingRangeObjArray[pI].minpaddingNodeNumber = basedPaddingNodeObjArray[pI].minpaddingNodeNumber
										//  padding节点的node属性值大小
										globalPaddingRangeObjArray[pI].maxpaddingNodeAttrNum = basedPaddingNodeObjArray[pI].maxpaddingNodeAttrNum
										globalPaddingRangeObjArray[pI].minpaddingNodeAttrNum = basedPaddingNodeObjArray[pI].minpaddingNodeAttrNum
								}
								model.set('globalPaddingRangeObjArray1', globalPaddingRangeObjArray)
						})
				},
				compute_padding_node_max_statistic: function () {
						var self = this
						var basedModel = self.at(0)
						var basedPaddingNodeObjArray = basedModel.get('paddingNodeObjArray')
						self.each(function (model) {
								var paddingNodeObjArray = model.get('paddingNodeObjArray')
								for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
										if (typeof(paddingNodeObjArray) !== 'undefined') {
												if (typeof (basedPaddingNodeObjArray[pI]) === 'undefined') {
														basedPaddingNodeObjArray[pI] = new Object()
												}
												if (paddingNodeObjArray[pI].maxPaddingNodeLength > basedPaddingNodeObjArray[pI].maxPaddingNodeLength) {
														basedPaddingNodeObjArray[pI].maxPaddingNodeLength = paddingNodeObjArray[pI].maxPaddingNodeLength
												}
												//  计算padding部分的node节点数量, 包括最大值和最小值
												if (paddingNodeObjArray[pI].maxpaddingNodeNumber > basedPaddingNodeObjArray[pI].maxpaddingNodeNumber) {
														basedPaddingNodeObjArray[pI].maxpaddingNodeNumber = paddingNodeObjArray[pI].maxpaddingNodeNumber
												}
												if (paddingNodeObjArray[pI].minpaddingNodeNumber < basedPaddingNodeObjArray[pI].minpaddingNodeNumber) {
														basedPaddingNodeObjArray[pI].minpaddingNodeNumber = paddingNodeObjArray[pI].minpaddingNodeNumber
												}
												//  计算padding部分的node的属性值的数量, 包括最大值和最小值
												if (paddingNodeObjArray[pI].maxpaddingNodeAttrNum > basedPaddingNodeObjArray[pI].maxpaddingNodeAttrNum) {
														basedPaddingNodeObjArray[pI].maxpaddingNodeAttrNum = paddingNodeObjArray[pI].maxpaddingNodeAttrNum
												}
												if (paddingNodeObjArray[pI].minpaddingNodeAttrNum < basedPaddingNodeObjArray[pI].minpaddingNodeAttrNum) {
														basedPaddingNodeObjArray[pI].minpaddingNodeAttrNum = paddingNodeObjArray[pI].minpaddingNodeAttrNum
												}
										}
								}
						})
						self.each(function (model) {
								var paddingNodeObjArray = model.get('paddingNodeObjArray')
								for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
										paddingNodeObjArray[pI].maxPaddingNodeLength = basedPaddingNodeObjArray[pI].maxPaddingNodeLength
										//  padding节点范围的节点数量
										paddingNodeObjArray[pI].maxpaddingNodeNumber = basedPaddingNodeObjArray[pI].maxpaddingNodeNumber
										paddingNodeObjArray[pI].minpaddingNodeNumber = basedPaddingNodeObjArray[pI].minpaddingNodeNumber
										//  padding节点的node属性值大小
										paddingNodeObjArray[pI].maxpaddingNodeAttrNum = basedPaddingNodeObjArray[pI].maxpaddingNodeAttrNum
										paddingNodeObjArray[pI].minpaddingNodeAttrNum = basedPaddingNodeObjArray[pI].minpaddingNodeAttrNum
								}
								var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
								for (var pI = 0; pI < _paddingNodeObjArray.length; pI++) {
										_paddingNodeObjArray[pI].maxPaddingNodeLength = basedPaddingNodeObjArray[pI].maxPaddingNodeLength
										//  padding节点范围的节点数量
										_paddingNodeObjArray[pI].maxpaddingNodeNumber = basedPaddingNodeObjArray[pI].maxpaddingNodeNumber
										_paddingNodeObjArray[pI].minpaddingNodeNumber = basedPaddingNodeObjArray[pI].minpaddingNodeNumber
										//  padding节点的node属性值大小
										_paddingNodeObjArray[pI].maxpaddingNodeAttrNum = basedPaddingNodeObjArray[pI].maxpaddingNodeAttrNum
										_paddingNodeObjArray[pI].minpaddingNodeAttrNum = basedPaddingNodeObjArray[pI].minpaddingNodeAttrNum
								}
						})
				},
				/**
					* 计算padding node的最大长度, 以及paddingNode的
					*/
				compute_padding_node_max_length: function () {
						var self = this
						var basedModel = self.at(0)
						var basedPaddingNodeObjArray = basedModel.get('paddingNodeObjArray')
						self.each(function (model) {
								var paddingNodeObjArray = model.get('paddingNodeObjArray')
								for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
										if (typeof(paddingNodeObjArray) !== 'undefined') {
												if (typeof (basedPaddingNodeObjArray[pI]) === 'undefined') {
														basedPaddingNodeObjArray[pI] = new Object()
												}
												if (paddingNodeObjArray[pI].maxPaddingNodeLength > basedPaddingNodeObjArray[pI].maxPaddingNodeLength) {
														basedPaddingNodeObjArray[pI].maxPaddingNodeLength = paddingNodeObjArray[pI].maxPaddingNodeLength
												}
										}
								}
						})
						self.each(function (model) {
								var paddingNodeObjArray = model.get('paddingNodeObjArray')
								for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
										paddingNodeObjArray[pI].maxPaddingNodeLength = basedPaddingNodeObjArray[pI].maxPaddingNodeLength
								}
								var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
								for (var pI = 0; pI < _paddingNodeObjArray.length; pI++) {
										_paddingNodeObjArray[pI].maxPaddingNodeLength = basedPaddingNodeObjArray[pI].maxPaddingNodeLength
								}
						})
				},
				compute_padding_node_max_statistic2: function () {
						var self = this
						var maxpaddingNodeNumber = 0, minpaddingNodeNumber = 1000000,
								maxpaddingNodeAttrNum = 0, minpaddingNodeAttrNum = 1000000;
						self.each(function (model) {
								var paddingNodeObjArray = model.get('paddingNodeObjArray')
								for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
										if (typeof(paddingNodeObjArray) !== 'undefined') {
												//  计算padding部分的node节点数量, 包括最大值和最小值
												if (paddingNodeObjArray[pI].maxpaddingNodeNumber > maxpaddingNodeNumber) {
														maxpaddingNodeNumber = paddingNodeObjArray[pI].maxpaddingNodeNumber
												}
												if (paddingNodeObjArray[pI].minpaddingNodeNumber < minpaddingNodeNumber) {
														minpaddingNodeNumber = paddingNodeObjArray[pI].minpaddingNodeNumber
												}
												//  计算padding部分的node的属性值的数量, 包括最大值和最小值
												if (paddingNodeObjArray[pI].maxpaddingNodeAttrNum > maxpaddingNodeAttrNum) {
														maxpaddingNodeAttrNum = paddingNodeObjArray[pI].maxpaddingNodeAttrNum
												}
												if (paddingNodeObjArray[pI].minpaddingNodeAttrNum < minpaddingNodeAttrNum) {
														minpaddingNodeAttrNum = paddingNodeObjArray[pI].minpaddingNodeAttrNum
												}
										}
								}
						})
						self.each(function (model) {
								var paddingNodeObjArray = model.get('paddingNodeObjArray')
								for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
										//  padding节点范围的节点数量
										paddingNodeObjArray[pI].maxpaddingNodeNumber = maxpaddingNodeNumber
										paddingNodeObjArray[pI].minpaddingNodeNumber = minpaddingNodeNumber
										//  padding节点的node属性值大小
										paddingNodeObjArray[pI].maxpaddingNodeAttrNum = maxpaddingNodeAttrNum
										paddingNodeObjArray[pI].minpaddingNodeAttrNum = minpaddingNodeAttrNum
								}
								var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
								for (var pI = 0; pI < _paddingNodeObjArray.length; pI++) {
										//  padding节点范围的节点数量
										_paddingNodeObjArray[pI].maxpaddingNodeNumber = maxpaddingNodeNumber
										_paddingNodeObjArray[pI].minpaddingNodeNumber = minpaddingNodeNumber
										//  padding节点的node属性值大小
										_paddingNodeObjArray[pI].maxpaddingNodeAttrNum = maxpaddingNodeAttrNum
										_paddingNodeObjArray[pI].minpaddingNodeAttrNum = minpaddingNodeAttrNum
								}
						})
				},
				/**
					*  计算aligned 节点部分的最大长度
					*/
				compute_align_node_max_length: function () {
						var self = this
						var basedModel = self.at(0)
						var basedAlignedRangeObjArray = basedModel.get('_alignedRangeObjArray')
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						// var BarcodeTreeSplitWidth = 0
						// var BarcodeTree_Split = BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split']
						// if (BarcodeTree_Split) {
						//   BarcodeTreeSplitWidth = Variables.get('BarcodeTree_Split_Width')
						// }
						var basedAlignedRangeObjObject = {}
						for (var bI = 0; bI < basedAlignedRangeObjArray.length; bI++) {
								var alignedObjIndex = basedAlignedRangeObjArray[bI].alignedObjIndex
								basedAlignedRangeObjObject[alignedObjIndex] = basedAlignedRangeObjArray[bI]
						}
						self.each(function (model) {
								var alignedRangeObjArray = model.get('_alignedRangeObjArray')
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										var alignedObjIndex = alignedRangeObjArray[aI].alignedObjIndex
										var alignedLength = alignedRangeObjArray[aI].alignedLength
										var basedAlignedLength = basedAlignedRangeObjObject[alignedObjIndex].alignedLength
										if (alignedLength > basedAlignedLength) {
												basedAlignedRangeObjObject[alignedObjIndex].alignedLength = alignedLength
										}
								}
						})
						self.each(function (model) {
								var alignedRangeObjArray = model.get('alignedRangeObjArray')
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										var alignedObjIndex = alignedRangeObjArray[aI].alignedObjIndex
										alignedRangeObjArray[aI].maxAlignedLength = basedAlignedRangeObjObject[alignedObjIndex].alignedLength
								}
						})
				},
				/**
					*  在当前处于global的状态下, 并且当前的display mode为压缩barcodeTree的状态的情况下, 将padding范围的节点进行压缩, 其他范围的节点依次向前排布
					*/
				update_zoomed_range_location: function () {
						var self = this
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						self.each(function (model) {
								if ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) && (BarcodeGlobalSetting['Subtree_Compact'])) {
										model.update_zoomed_range_location()
								}
						})
				},
				update_tablelens_interested_node: function () {
						var self = this
						var tablelensSubtreeArray = self.tablelensSubtreeArray
						for (var tI = 0; tI < tablelensSubtreeArray.length; tI++) {
								self.tablelens_interested_subtree(tablelensSubtreeArray[tI])
						}
				},
				/**
					* 在当前处于global的状态下的process函数, 在preprocess函数之后执行, 主要执行两个部分,
					* 第一是按照tablelens的模式处理节点, 对于节点进行zoom 以及压缩
					* 第二是按照focus的模式, 移动对应节点的位置
					*/
				global_process_barcode_model_data: function () {
						var self = this
						// self.update_tablelens_interested_node()
						// self.update_zoomed_range_location()
				},
				//  在全局状态下的预处理函数, 预处理函数主要包括更新aligned以及padding节点的范围, 并且计算padding节点的最大的属性值
				// global_preprocess_barcode_model_data: function () {
				// 		var self = this
				// 		//  更新全局状态下对齐的tablelen子树的范围
				// 		self.compute_global_zoom_padding_range()
				// 		//  计算对齐的情况下 padding节点的最大值和最小值
				// 		self.compute_global_padding_node_max_statistic()
				// },
				/**
					*  TODO 更新barcode节点的属性数组
					**/
				update_barcode_node_attr_array: function () {
						var self = this
						self.each(function (model) {
								model.update_barcode_node_array()
								model.update_aligned_barcode_node()
								model.update_unaligned_barcode_node()
								model.update_align_followed_node()
								model.update_padding_node_location()
						})
						// //  对于更新完成的barcode的节点数组进行tablelens
						// if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
						//   console.log('****************global process************')
						//   self.global_preprocess_barcode_model_data()
						//   self.global_process_barcode_model_data()
						// }
						//  更新barcode distribution的对象
						self.update_barcode_node_collection_obj()
				}
				,
				/**
					* 更新所有的数据和视图
					*/
				update_data_all_view: function () {
						var self = this
						// self.update_barcode_node_attr_array()
						//  更新 barcode collection 中的 categoryNodeArray
						if (this.length > 0) {
								var basedBarcodeModel = self.at(0)
								if (typeof (basedBarcodeModel) === 'undefined') {
										basedBarcodeModel = self.at(1)
								}
								self.set_category_nodeobj_array(basedBarcodeModel.get('barcodeNodeAttrArray'))
						} else {
								var categoryNodeObjArray = []
								self.set_category_nodeobj_array(categoryNodeObjArray)
						}
						//  更新barcode comparison视图的最大的宽度
						self.updateBarcodeNodexMaxX()
						//  更新barcode comparison视图的最大的高度
						self.updateBarcodeNodeyMaxY()
						// self.update_all_barcode_view()
						self.trigger_update_barcode_view()
						//  在更新了comparison视图的max width以及max height之后, 需要重新更新选择barcodeTree的函数
						self.trigger_render_supertree()
						//	更新排序视图
						self.trigger_update_sorting_view()
				},
				//	不会增加比alignedLevel更深的节点
				filter_by_aligned_level: function (selectedAlignedItemList) {
						var self = this
						var filteredAlignedItemList = []
						var removeNodeObjArray = []
						var alignedLevel = Variables.get('alignedLevel')
						for (var sI = 0; sI < selectedAlignedItemList.length; sI++) {
								var selectedAlignedItem = selectedAlignedItemList[sI]
								var nodeData = selectedAlignedItem['nodeData']
								var nodeDepth = nodeData.depth
								var nodeId = nodeData.id
								if (alignedLevel >= nodeDepth) {
										filteredAlignedItemList.push(selectedAlignedItem)
								}
								// else {
								// 		var removedNodeObj = {nodeObjId: nodeId, nodeObjDepth: nodeDepth}
								// 		removeNodeObjArray.push(removedNodeObj)
								// }
						}
						// if (removeNodeObjArray.length !== 0) {
						// 		self.remove_selected_node(removeNodeObjArray)
						// }
						return filteredAlignedItemList
				},
				/**
					* 将aligned的层级设置为barcodeTree中选择节点的最大深度
					*/
				set_aligned_level_as_max_level: function () {
						var self = this
						var alignedLevel = +Variables.get('alignedLevel')
						var selectedAlignedItemList = self.get_selected_aligned_item_list()
						for (var sI = 0; sI < selectedAlignedItemList.length; sI++) {
								var selectedAlignedItem = selectedAlignedItemList[sI]
								var nodeData = selectedAlignedItem['nodeData']
								var nodeDepth = nodeData.depth
								if (nodeDepth > alignedLevel) {
										alignedLevel = nodeDepth
								}
						}
						console.log('alignedLevel', alignedLevel)
						Variables.set('alignedLevel', alignedLevel)
				},
				/**
					* 根据对齐的数组得到对齐节点的对象
					*/
				get_aligned_node_id_obj: function (selectedAlignedItemList) {
						var alignedNodesIdObj = {}
						for (var sI = 0; sI < selectedAlignedItemList.length; sI++) {
								var selectedAlignedItem = selectedAlignedItemList[sI]
								var nodeData = selectedAlignedItem.nodeData
								var nodeObjId = nodeData.id
								alignedNodesIdObj[nodeObjId] = selectedAlignedItem
						}
						return alignedNodesIdObj
				},
				/**
					* 根据当前处于selectedNodesId中的节点, 对于barcodeCollection中的barcodeTree进行对齐
					*/
				align_node_in_selected_list: function () {
						var self = this
						var selectedAlignedItemList = self.filter_by_aligned_level(self.get_selected_aligned_item_list())
						//	每次对齐全部的BarcodeTree之后需要记录当前对齐的节点
						var alignedNodesIdObj = self.get_aligned_node_id_obj(selectedAlignedItemList)
						//	对齐之前需要判断当前的对齐的节点部分, 找到当前的对齐列表相对于之前的对齐的部分删除的节点, 也需要删除该部分节点
						var removedAlignedItemList = []
						var previousAlignedNodesIdObj = self.alignedNodesId
						for (var pItem in previousAlignedNodesIdObj) {
								if (typeof (alignedNodesIdObj[pItem]) === 'undefined') {
										//	之前对齐的节点现在不需要继续对齐, 那么删除之前节点的对齐状态
										removedAlignedItemList.push(previousAlignedNodesIdObj[pItem])
								}
						}
						self.remove_aligned_part(removedAlignedItemList)
						//	按照从前到后的顺序排序BarcodeTree, 这个顺序也是对齐的顺序
						selectedAlignedItemList = selectedAlignedItemList.sort(function (item_a, item_b) {
								return item_a.nodeData.id > item_b.nodeData.id
						})
						self.alignedNodesId = alignedNodesIdObj
						//  将选中需要align部分的子树全部取消折叠
						// for (var sI = 0; sI < selectedAlignedItemList.length; sI++) {
						// 		var nodeData = selectedAlignedItemList[sI].nodeData
						// 		var nodeObjId = nodeData.id
						// 		var nodeObjDepth = nodeData.depth
						// 		self.uncollapse_subtree(nodeObjId, nodeObjDepth)
						// }
						//  如果当前对齐的节点数量为0, 那么需要自动的对于选中的barcodeTree进行更新
						if (selectedAlignedItemList.length === 0) {
								//	在更新视图之前首先更新选择的barcodeTree中的节点
								self.update_all_tree_id_index_obj()
								self.update_all_selected_nodes_obj()
								self.update_data_all_view()
						}
						self.subtree_node_focus(selectedAlignedItemList)
				},
				/**
					* 删除当前对齐部分的节点
					*/
				remove_aligned_part: function (selectedAlignedItemList) {
						var self = this
						//  将选中需要align部分的子树全部取消折叠
						self.each(function (model) {
								model.remove_aligned_part(selectedAlignedItemList)
						})
						var alignedNodeIdArray = self.alignedNodeIdArray
						var alignedNodeObjArray = self.alignedNodeObjArray
						var isRemoved = false
						for (var sI = 0; sI < selectedAlignedItemList.length; sI++) {
								var unAlignedNodeId = selectedAlignedItemList[sI].nodeData.id
								var unAlignedNodeIdIndex = alignedNodeIdArray.indexOf(unAlignedNodeId)
								var unalignedNodeObjIndex = get_aligned_node_obj_index(alignedNodeObjArray, unAlignedNodeId)
								if (unAlignedNodeIdIndex !== -1) {
										alignedNodeIdArray.splice(unAlignedNodeIdIndex, 1)
										isRemoved = true
								}
								if (unalignedNodeObjIndex !== -1) {
										alignedNodeObjArray.splice(unalignedNodeObjIndex, 1)
										isRemoved = true
								}
						}
						//	如果存在将节点删除, 那么需要更新整个视图
						if (isRemoved) {
								self.update_aligned_level()
								self.compute_aligned_subtree_range()
						}
						//  从alignedNodeObjArray获取unAlignedNodeId的index值
						function get_aligned_node_obj_index(alignedNodeObjArray, unAlignedNodeId) {
								for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
										if (alignedNodeObjArray[aI].alignedNodeId === unAlignedNodeId) {
												return aI
										}
								}
								return -1
						}
				},
				//  更新对齐的层级
				update_aligned_level: function () {
						var self = this
						var alignedLevel = Variables.get('alignedLevel')
						var alignedNodeObjArray = self.alignedNodeObjArray
						for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
								var alignedNodeId = alignedNodeObjArray[aI].alignedNodeId
								var alignedNodeLevel = alignedNodeObjArray[aI].alignedNodeLevel
								if (alignedNodeLevel > alignedLevel) {
										alignedLevel = alignedNodeLevel
								}
						}
						//  只有在alignedNodeObjArray不为空时, 更新alignedLvel
						if (alignedNodeObjArray.length > 0) {
								Variables.set('alignedLevel', alignedLevel)
						}
						//  如果将所有的对齐部分的节点都删除, 那么需要将对齐的层级以及fixed的层级还原
						if (alignedNodeObjArray.length === 0) {
								//  设置alignedLevel, 不是显示的层级
								Variables.set('alignedLevel', 0)
								Variables.set('displayFixedLevel', 0)
								//  显示的barcode的对齐层级最小是1
								Variables.set('displayAlignedLevel', 1)
						}
						Variables.set('alignedLevel', alignedLevel)
				},
				/**
					* 根据在selectNodeId中的节点得到需要对齐的节点的列表
					*/
				get_selected_aligned_item_list: function () {
						var self = this
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var selectedNodeIdObj = self.get_selected_nodes_id_removed_contain()
						var selectedAlignedItemList = []
						for (var item in selectedNodeIdObj) {
								var nodeObjId = item
								var nodeObjDepth = selectedNodeIdObj[item].nodeObjDepth
								var barcodeTreeId = selectedNodeIdObj[item].barcodeTreeId
								var nodeObjCategory = selectedNodeIdObj[item].nodeObjCategory
								var nodeData = {id: nodeObjId, depth: nodeObjDepth, category: nodeObjCategory}
								//  对齐之前要将collapse的节点展开
								selectedAlignedItemList.push({nodeData: nodeData, barcodeTreeId: barcodeTreeId})
						}
						return selectedAlignedItemList
				},
				/**
					*  传入当前选择的节点数组, 对于选择的节点数组中的节点进行对齐, 更新数据完成只有控制视图的更新
					*/
				subtree_node_focus: function (selectedAlignedItemList) {
						var self = this
						//  判断是否所有选中的节点都已经处于对齐的状态
						var alignedSubtreeArray = self.get_aligned_subtree()
						for (var oI = 0; oI < selectedAlignedItemList.length; oI++) {
								var operationItemId = selectedAlignedItemList[oI]
								if (is_exist_aligned_subtree_array(operationItemId, alignedSubtreeArray)) {
										//	判断节点是否处于align的状态
										selectedAlignedItemList.splice(oI, 1)
										oI--
								}
						}
						if (selectedAlignedItemList.length !== 0) {
								//  选择focus的节点进行对齐之后, barcode的config视图中会取消对于节点选择selection, 以及subtree的折叠的事件
								//  disable之后需要取消config button的高亮状态
								$('#subtree-collapse-operation .config-button').removeClass('active')
								var deferObj = $.Deferred()
								$.when(deferObj)
										.done(function () {
												//  对于更新完成的barcode的节点数组进行tablelens
												// self.global_preprocess_barcode_model_data()
												self.global_process_barcode_model_data()
												//  在更新完成所有的视图之后, 用户需要首先改变BarcodeTree的model中存储barcodeTree节点的数组的数据结构
												self.update_data_all_view()
										})
										.fail(function () {
												console.log('defer fail')
										})
								var beginIndex = 0
								self._align_single_operation_item(selectedAlignedItemList, beginIndex, deferObj)
						} else {
								self.update_all_tree_id_index_obj()
								//	在对齐节点之后更新在此之前已经选择的节点部分, 包括孩子节点, 父亲节点等节点数组
								self.update_all_selected_nodes_obj()
						}
						//  判断节点是否处于align的状态
						function is_exist_aligned_subtree_array(operationItemId, alignedSubtreeArray) {
								for (var aI = 0; aI < alignedSubtreeArray.length; aI++) {
										if (alignedSubtreeArray[aI].alignedNodeId === operationItemId) {
												return true
										}
								}
								return false
						}
				},
				transform_similarity_matrix: function (distance_matrix, max_distance) {
						var similarityMatrix = []
						var MAX_SIMILARITY = 1
						for (var dI = 0; dI < distance_matrix.length; dI++) {
								var similarityArray = []
								for (var cI = 0; cI < distance_matrix[dI].length; cI++) {
										if (distance_matrix[dI][cI] === 0) {
												similarityArray.push(MAX_SIMILARITY)
										} else {
												if (distance_matrix[dI][cI] !== 0) {
														similarityArray.push(1 / distance_matrix[dI][cI])
												}
										}
								}
								similarityMatrix.push(similarityArray)
						}
						return similarityMatrix
				},
				//  寻找所有的父亲以及当前节点
				find_all_father_current_nodes: function (nodeObj) {
						var self = this
						var allFatherNodesArray = []
						self.each(function (model) {
								var fatherNodesArray = model.find_all_father_current_nodes(nodeObj)
								for (var fI = 0; fI < fatherNodesArray.length; fI++) {
										if (!is_in_array(fatherNodesArray[fI], allFatherNodesArray)) {
												allFatherNodesArray.push(fatherNodesArray[fI])
										}
								}
						})
						return allFatherNodesArray
						function is_in_array(node_obj, node_obj_array) {
								var existed = false
								for (var nI = 0; nI < node_obj_array.length; nI++) {
										if (node_obj_array[nI].id === node_obj.id) {
												existed = true
										}
								}
								return existed
						}
				},
				/**
					*  传入当前选择的节点数组, 依次按照顺序对于选择的节点进行对齐
					*/
				_align_single_operation_item: function (operation_item_list, operation_index, finish_align_defer) {
						var self = this
						var alignedLevel = Variables.get('alignedLevel')
						if ((operation_index === operation_item_list.length) || (operation_item_list.length === 0)) {
								finish_align_defer.resolve()
								return
						}
						var nodeData = operation_item_list[operation_index].nodeData
						var barcodeTreeId = operation_item_list[operation_index].barcodeTreeId
						// self.uncollapse_subtree(nodeData.id, nodeData.depth)
						var alignedUpperParent = self.get_aligned_uppest_parent(nodeData, barcodeTreeId)
						// var alignedChildren = self.get_aligned_children(nodeData)
						//  如果对齐状态的最上层父亲节点为空, 那么直接对齐当前的子树
						if (alignedUpperParent == null) {
								var finishAlignDeferObj = $.Deferred()
								$.when(finishAlignDeferObj)
										.done(function () {
												self._align_single_operation_item(operation_item_list, (operation_index + 1), finish_align_defer)
										})
								//  具体对齐选中的子树
								self.add_super_subtree(nodeData.id, nodeData.depth, nodeData.category, alignedLevel, finishAlignDeferObj)
						}
				},
				//  获取最上层对齐的父亲节点
				get_aligned_uppest_parent: function (node_data, operated_tree_id) {
						var self = this
						var filterModelArray = self.where({barcodeTreeId: operated_tree_id})
						if (filterModelArray.length > 0) {
								var treeDataModel = filterModelArray[0]
								var fatherCurrentNodes = treeDataModel.find_father_current_nodes(node_data)
								for (var fI = (fatherCurrentNodes.length - 1); fI >= 1; fI--) {
										if (self.get_aligned_state(fatherCurrentNodes[fI].id, fatherCurrentNodes[fI].depth)) {
												return fatherCurrentNodes[fI]
										}
								}
						}
						return null
				},
				//  获取下层的孩子节点
				get_aligned_children: function (node_data) {
						var self = this
						var nodeDataId = node_data.id
						var alignedNodeIdArray = self.alignedNodeIdArray
						if (nodeDataId === 'node-0-root') {

						} else {
								for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
										var singleAlignedNodeId = alignedNodeIdArray[aI]
										if (nodeDataId !== singleAlignedNodeId) {
												if (self.is_first_node_parent(nodeDataId, singleAlignedNodeId)) {
												}
										}
								}
						}
				},
				//  判断一个character是否是'A'或者'0', 进而验证是否是父亲节点
				is_character_zero_A: function (character) {
						var self = this
						if ((character === "0") || (character === "A")) {
								return true
						}
				},
				//  判断第一个节点是否是第二个节点的父亲
				is_first_node_parent: function (parentNodeId, childNodeId) {
						var self = this
						var parentNodeIdArray = self._transform_node_id_node_id_array(parentNodeId)
						var childNodeIdArray = self._transform_node_id_node_id_array(childNodeId)
						var parentNodeDepth = self._get_node_depth_from_node_id(parentNodeId)
						var childNodeDepth = self._get_node_depth_from_node_id(childNodeId)
						//	如果parentNodeDepth的深度比childNodeDepth更深, 那么第二个节点一定不会是第一个节点的父亲节点
						if (parentNodeDepth >= childNodeDepth) {
								return false
						}
						if (parentNodeId === 'node-0-root') {
								return true
						}
						for (var cI = 0; cI < parentNodeIdArray.length; cI++) {
								if ((parentNodeIdArray[cI] === childNodeIdArray[cI]) || ((self.is_character_zero_A(parentNodeIdArray[cI])) && (!self.is_character_zero_A(childNodeIdArray[cI])))) {
										//  满足是parent节点的条件
								} else {
										//  不满足是parent节点的条件
										return false
								}
						}
						if (childNodeId === parentNodeId) {
								return true
						}
						return true
				},
				//  判断第二个节点是否是第一个节点的父亲
				is_second_node_parent: function (childNodeId, parentNodeId) {
						var self = this
						var parentNodeIdArray = self._transform_node_id_node_id_array(parentNodeId)
						var childNodeIdArray = self._transform_node_id_node_id_array(childNodeId)
						var parentNodeDepth = self._get_node_depth_from_node_id(parentNodeId)
						var childNodeDepth = self._get_node_depth_from_node_id(childNodeId)
						//	如果parentNodeDepth的深度比childNodeDepth更深, 那么第二个节点一定不会是第一个节点的父亲节点
						if (parentNodeDepth >= childNodeDepth) {
								return false
						}
						if (parentNodeId === 'node-0-root') {
								return true
						}
						for (var cI = 0; cI < parentNodeIdArray.length; cI++) {
								if ((parentNodeIdArray[cI] === childNodeIdArray[cI]) || ((self.is_character_zero_A(parentNodeIdArray[cI])) && (!self.is_character_zero_A(childNodeIdArray[cI])))) {
										//  满足是parent节点的条件
								} else {
										//  不满足是parent节点的条件
										return false
								}
						}
						if (childNodeId === parentNodeId) {
								return true
						}
						return true
				},
				//	从节点id中提取节点的深度
				_get_node_depth_from_node_id: function (node_data_id) {
						var self = this
						if (typeof (node_data_id) !== 'undefined') {
								var nodeDataIdArray = node_data_id.split('-')
								var nodeDataDepth = nodeDataIdArray[1]
								return nodeDataDepth
						}
						return null
				},
				//  将节点的id转换成节点的id的character的数组
				_transform_node_id_node_id_array: function (node_data_id) {
						var self = this
						if (typeof (node_data_id) !== 'undefined') {
								var nodeDataIdArray = node_data_id.split('-')
								var nodeDataId = nodeDataIdArray[nodeDataIdArray.length - 1]
								//  选择的节点的id数组
								var splitCharacter = window.split_character
								var nodeDataIdArray = nodeDataId.split(splitCharacter)
								return nodeDataIdArray
						}
						return []
				},
				/**
					* 取消barcode中的某个子树对齐
					*/
				_subtree_unalign_handler: function (nodeData, finishRemoveAlignDeferObj) {
						var self = this
						var alignedLevel = Variables.get('alignedLevel')
						var selectedAlignedItemList = [{nodeData: nodeData}]
						self.remove_aligned_part(selectedAlignedItemList)
						finishRemoveAlignDeferObj.resolve()
				},
				/**
					* 改变subtree的展示模式
					*/
				change_subtree_display_mode: function () {
						var self = this
						var sortingModel = Datacenter.sortingModel
						self.process_barcode_model_data()
						// if ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL)) {
						// 		self.update_zoomed_range_location()
						// } else if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL)) {
						// }
						//  在更新完成所有的视图之后, 用户需要首先改变BarcodeTree的model中存储barcodeTree节点的数组的数据结构
						//	sortingModel的sortingModelUpdate变量, 因此视图会更新
						// sortingModel.update_sorting_view()
						self.update_data_all_view()
				},
				/**
					* 判断该节点是否是在锁定的aligned情况下的点选的排序节点
					*/
				is_aligned_selected_sort_obj: function (nodeObj) {
						var self = this
						var alignedLockedSelectedSortObj = self.alignedLockedSelectedSortObj
						if (alignedLockedSelectedSortObj != null) {
								//	判断点击的节点是之前选择的节点有两个维度, 一个是节点的id相同, 另一个是选择的barcodeTree的id相同
								if ((nodeObj.nodeObjId === alignedLockedSelectedSortObj.nodeObjId) && (nodeObj.barcodeTreeId === alignedLockedSelectedSortObj.barcodeTreeId)) {
										return true
								}
						}
						return false
				},
				/**
					* 删除在锁定的aligned的情况下选择的节点
					*/
				remove_aligned_selected_sort_obj: function () {
						var self = this
						self.alignedLockedSelectedSortObj = null
				},
				/**
					* 设置在锁定的aligned的情况下选择的节点
					*/
				set_aligned_selected_sort_obj: function (nodeObj) {
						var self = this
						self.alignedLockedSelectedSortObj = JSON.parse(JSON.stringify(nodeObj))
				},
				/**
					* 获取在locked的情况下, 选择排序的barcodeTree的节点
					*/
				get_aligned_locked_selected_sort_obj: function () {
						var self = this
						return self.alignedLockedSelectedSortObj
				},
				//  判断选择节点的对象是否为空
				is_selected_node_empty: function () {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						var itemNum = 0
						for (var item in selectedNodesIdObj) {
								itemNum = itemNum + 1
						}
						if (itemNum === 0) {
								return true
						} else {
								return false
						}
				},
				/**
					* 更新选择的节点
					*/
				update_selected_node_attr: function () {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						for (var sItem in selectedNodesIdObj) {
								var selectNode = selectedNodesIdObj[sItem]
								var nodeData = selectNode.nodeData
								var barcodeTreeId = selectNode.barcodeTreeId
								var treeDataModelResults = self.where({barcodeTreeId: barcodeTreeId})
								if (treeDataModelResults.length > 0) {
										var treeDataModel = treeDataModelResults[0]
										var siblingNodesArray = treeDataModel.find_sibling_nodes(nodeData)
										var childrenNodesArray = treeDataModel.find_children_nodes(nodeData)
										var allChildrenNodesArray = treeDataModel.find_all_children_nodes(nodeData)
										selectedNodesIdObj.selectedChildrenNodeIdArray = childrenNodesArray
										selectedNodesIdObj.selectedSiblingNodeObjArray = siblingNodesArray
										selectedNodesIdObj.selectedAllChildrenNodeIdArray = allChildrenNodesArray
								}
						}
				},
				/**
					*  增加一个选择的节点, 提供所有需要的数据, childrenNodeArray & siblingNodeArray
					*/
				add_selected_node: function (barcodeTreeId, nodeData) {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						//	在添加节点之前, 判断该节点在此之前是否已经被选择
						var nodeExisted = false
						//	如果在存储选择节点的对象中存在, 那么该节点已经被选择
						if (typeof (selectedNodesIdObj[nodeData.id]) !== 'undefined') {
								nodeExisted = true
						}
						//	删除与当前节点之间存在交叉部分的已选择的节点
						self.remove_crossed_node_selection(nodeData.id)
						//	删除现有的部分
						// self.remove_crossed_node_alignment(nodeData.id)
						self.update_selected_nodes_obj(barcodeTreeId, nodeData)
						//	更新sorting视图
						self.trigger_update_sorting_view(barcodeTreeId, nodeData)
						//	对齐barcodeTree, 只有节点不存在才会重新更新视图
						if (!nodeExisted) {
								// if (BARCODETREE_GLOBAL_PARAS.Align_State) {
								// 		self.align_node_in_selected_list()
								// } else {
								// 		self.update_data_all_view()
								// }
								// self.update_data_all_view()
						}
				},
				//	更新所有的树节点的id索引的对象
				update_all_tree_id_index_obj: function () {
						var self = this
						self.each(function (model) {
								model.update_tree_id_index_obj()
						})
				},
				/**
					* 在barcodeTree节点数组变化之后, 需要更新之前已经选择的节点对象
					*/
				update_all_selected_nodes_obj: function () {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						for (var sItem in selectedNodesIdObj) {
								var barcodeTreeId = selectedNodesIdObj[sItem].barcodeTreeId
								var nodeData = selectedNodesIdObj[sItem].nodeData
								self.update_selected_nodes_obj(barcodeTreeId, nodeData)
						}
				},
				/**
					* 更新选择的节点对象
					*/
				update_selected_nodes_obj: function (barcodeTreeId, nodeData) {
						var self = this
						var treeDataModelResults = self.where({barcodeTreeId: barcodeTreeId})
						if (treeDataModelResults.length > 0) {
								var treeDataModel = treeDataModelResults[0]
						} else {
								return
						}
						var barcodeTreeIndex = treeDataModel.get('barcodeIndex')
						var nodeObjId = nodeData.id
						var nodeObjDepth = nodeData.depth
						var nodeObjCategory = nodeData.category
						var nodeObjCategoryName = nodeData.categoryName
						//  如果当前点击的节点没有被选择, 那么需要点击该节点即选择该节点
						var siblingNodesArray = treeDataModel.find_sibling_nodes(nodeData)
						var childrenNodesArray = treeDataModel.find_children_nodes(nodeData)
						var allChildrenNodesArray = treeDataModel.find_all_children_nodes(nodeData)
						var selectedNodesIdObj = self.selectedNodesId
						//  该节点之前没有被选择, 如果选择的是不同的barcodeTree的相同的节点, 那么选择会被自动的更新
						selectedNodesIdObj[nodeObjId] = {
								barcodeTreeIndex: barcodeTreeIndex,
								barcodeTreeId: barcodeTreeId,
								nodeObjId: nodeObjId,
								nodeObjDepth: nodeObjDepth,
								nodeObjCategory: nodeObjCategory,
								nodeData: nodeData,
								nodeObjCategoryName: nodeObjCategoryName,
								selectedChildrenNodeIdArray: childrenNodesArray,
								selectedSiblingNodeObjArray: siblingNodesArray,
								selectedAllChildrenNodeIdArray: allChildrenNodesArray
						}
						var basedFindingNodesObj = {
								siblingNodes: siblingNodesArray,
								childrenNodes: childrenNodesArray
						}
						//	选择的时候增加比较的结果
						self.add_selected_node_comparison_result(nodeObjId, basedFindingNodesObj)
				},
				/**
					* 在新增加barcodeModel之后, 需要比较新增加的barcodeModel与之前选择的节点,
					* 根据选择的全部节点部分比较barcodeModel
					*/
				compare_barcode_model: function (model) {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						for (var nodeObjId in selectedNodesIdObj) {
								var siblingNodes = selectedNodesIdObj[nodeObjId].selectedSiblingNodeObjArray
								var childrenNodes = selectedNodesIdObj[nodeObjId].selectedChildrenNodeIdArray
								var basedFindingNodesObj = {
										siblingNodes: siblingNodes,
										childrenNodes: childrenNodes
								}
								model.add_selected_node_comparison_result(nodeObjId, basedFindingNodesObj)
						}
				},
				/**
					* 增加了一个选择节点之后得到对于该选择节点的比较的结果, 用户可以直接通过比较的结果进行绘制
					*/
				add_selected_node_comparison_result: function (nodeObjId, basedFindingNodesObj) {
						var self = this
						//  在这个循环中计算得到model的子树中每个节点的最大值和最小值的范围
						self.each(function (model) {
								model.add_selected_node_comparison_result(nodeObjId, basedFindingNodesObj)
						})
				},
				/**
					* 更新所有选择部分的节点
					*/
				update_all_selected_barcodetree_node: function () {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						//  在这个循环中计算得到model的子树中每个节点的最大值和最小值的范围
						self.each(function (model) {
								model.update_selected_barcodetree_node(selectedNodesIdObj)
						})
				}
				,
				/**
					* 根据节点的id获取节点对象
					*/
				get_node_obj_from_id: function (nodeObjId) {
						var self = this
						var barcodeTreeNum = self.length
						var foundObj = {}
						for (var bI = 0; bI < barcodeTreeNum; bI++) {
								var barcodeTreeModel = self.where({barcodeIndex: bI})[0]
								if (typeof (barcodeTreeModel) !== 'undefined') {
										var barcodeNodeAttrArrayObj = barcodeTreeModel.get('barcodeNodeAttrArrayObj')
										if (typeof (barcodeNodeAttrArrayObj[nodeObjId]) !== 'undefined') {
												foundObj = barcodeNodeAttrArrayObj[nodeObjId]
												return foundObj
										}
								}
						}
				},
				//	删除交叉部分的节点的选择
				remove_crossed_node_selection: function (nodeObjId) {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						var removedNodeObjArray = []
						for (var sItem in selectedNodesIdObj) {
								//  点击的节点是否是之前选择的节点的父亲
								var isParent = self.is_first_node_parent(nodeObjId, sItem)
								//  点击的节点是否是之前选择的节点的孩子
								var isChild = self.is_second_node_parent(nodeObjId, sItem)
								//	如果其中一个节点是点击节点的孩子或者父亲, 那么删除之前存在的该节点
								if (isParent || isChild) {
										var removedNodeObj = {
												nodeObjId: sItem
										}
										removedNodeObjArray.push(removedNodeObj)
										delete selectedNodesIdObj[sItem]
								}
						}
						self.each(function (model) {
								model.remove_comparison_results(removedNodeObjArray)
						})
				},
				//  删除交叉部分的节点的对齐情况
				remove_crossed_node_alignment: function (nodeObjId) {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var removedNodeObjArray = []
						//  判断是否是父亲节点或者是孩子节点
						for (var sItem in selectedNodesIdObj) {
								//  点击的节点是否是之前选择的节点的父亲
								var isParent = self.is_first_node_parent(nodeObjId, sItem)
								//  点击的节点是否是之前选择的节点的孩子
								var isChild = self.is_second_node_parent(nodeObjId, sItem)
								if (isParent || isChild) {
										//  如果其中一个节点是点击节点的孩子或者父亲, 那么删除之前存在的该节点
										var nodeObjDepth = selectedNodesIdObj[sItem].nodeObjDepth
										var removedNodeObj = {
												nodeObjId: sItem,
												nodeObjDepth: nodeObjDepth
										}
										removedNodeObjArray.push(removedNodeObj)
										// delete selectedNodesIdObj[sItem]
								}
						}
						if (removedNodeObjArray.length !== 0) {
								self.remove_selected_node(removedNodeObjArray)
						}
				},
				//  删除其中某一个选择的节点
				remove_selected_node: function (removedNodeObjArray) {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						//  取消对于barcodeTree的选择时, 需要将收缩的barcodeTree展开, 仅仅寻找到的findNodeDataIdIndex!==-1时, barcodeTree才会被展开
						var selectedAlignedItemList = []
						for (var rI = 0; rI < removedNodeObjArray.length; rI++) {
								var removedNodeObj = removedNodeObjArray[rI]
								var nodeObjId = removedNodeObj.nodeObjId
								var nodeObjDepth = removedNodeObj.nodeObjDepth
								var selectedAlignedNodeObj = {nodeData: {id: nodeObjId, depth: nodeObjDepth}}
								selectedAlignedItemList.push(selectedAlignedNodeObj)
								delete selectedNodesIdObj[nodeObjId]
						}
						self.each(function (model) {
								model.remove_comparison_results(removedNodeObjArray)
						})
						self.remove_aligned_part(selectedAlignedItemList)
						self.update_data_all_view()
				},
				//	计算得到排序的对象数组
				get_sorting_icon_array: function () {
						var self = this
						var barcodeTreePaddingLeft = Variables.get('barcodePaddingLeft')
						var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
						var sortingIconArray = []
						var selectedNodesIdObj = self.selectedNodesId
						for (var nodeObjId in selectedNodesIdObj) {
								var sortingIconObj = {}
								var selectedNodes = selectedNodesIdObj[nodeObjId]
								var barcodeTreeId = selectedNodes.barcodeTreeId
								var nodeObjId = selectedNodes.nodeObjId
								var barcodeModelResults = self.where({barcodeIndex: 0})
								if (barcodeModelResults.length > 0) {
										var barcodeModel = barcodeModelResults[0]
										var nodeObj = barcodeModel.get_node_obj_from_id(nodeObjId)
										var sortingIconX = nodeObj.x + nodeObj.width / 2 + barcodeTreePaddingLeft + barcodeTextPaddingLeft
										sortingIconObj.x = sortingIconX
										sortingIconObj.id = nodeObjId
								}
								sortingIconArray.push(sortingIconObj)
						}
						return sortingIconArray
				},
				/**
					* 判断一个节点是否在选择的节点数组范围之内
					*/
				in_selected_array: function (barcodeTreeId, nodeId) {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						if (typeof (selectedNodesIdObj[nodeId]) === 'undefined') {
								return false
						} else {
								//  只有在节点的id与tree的id相同时, 才说明该节点是已经被选择的
								if (selectedNodesIdObj[nodeId].barcodeTreeId === barcodeTreeId) {
										return true
								}
						}
						return false
				},
				/**
					* 设置barcodeTree的segment部分的index值 => 设置为整个barcodeTree的index值
					*/
				reset_sorting_result: function (dataNodeIdArray) {
						var self = this
						self.each(function (model) {
								model.reset_sorting_result(dataNodeIdArray)
						})
				},
				/**
					* 取消点击lock按钮的时候, 会将选择的alignedTreeSelectedNodesIdObj对象进行清空
					*/
				clear_aligned_selected_node: function () {
						var self = this
						self.alignedTreeSelectedNodesIdObj = {}
				},
				/**
					* 获取alignedTreeSelectedNodesIdObj的对象
					*/
				get_aligned_tree_selected_node: function () {
						var self = this
						return self.alignedTreeSelectedNodesIdObj
				},
				/**
					*  判断一个节点是否在选择的节点数组范围之内
					*/
				in_aligned_selected_array: function (barcodeTreeId, nodeId) {
						var self = this
						var alignedTreeSelectedNodesIdObj = self.alignedTreeSelectedNodesIdObj
						if ((alignedTreeSelectedNodesIdObj == null) || (typeof (alignedTreeSelectedNodesIdObj[nodeId]) === 'undefined')) {
								return false
						} else {
								//  只有在节点的id与tree的id相同时, 才说明该节点是已经被选择的
								if (alignedTreeSelectedNodesIdObj[nodeId].barcodeTreeId === barcodeTreeId) {
										return true
								}
						}
						return false
				},
				/**
					* 在aligned状态下新增加选择的节点
					*/
				add_aligned_selected_node: function (barcodeTreeId, nodeObjId, nodeObjDepth, nodeObjCategory, siblingNodesArray, childrenNodesArray) {
						var self = this
						var alignedTreeSelectedNodesIdObj = self.alignedTreeSelectedNodesIdObj
						// var alignedTreeSelectedNodesIdObj = {}
						//  该节点之前没有被选择, 如果选择的是不同的barcodeTree的相同的节点, 那么选择会被自动的更新
						alignedTreeSelectedNodesIdObj[nodeObjId] = {
								barcodeTreeId: barcodeTreeId,
								nodeObjDepth: nodeObjDepth,
								nodeObjCategory: nodeObjCategory,
								selectedChildrenNodeIdArray: childrenNodesArray,
								selectedSiblingNodeObjArray: siblingNodesArray
						}
						var basedFindingNodesObj = {
								siblingNodes: siblingNodesArray,
								childrenNodes: childrenNodesArray
						}
						self.add_selected_node_comparison_result(nodeObjId, basedFindingNodesObj)
				},
				/**
					*  删除在aligned状态下的新增加的选择的节点
					*/
				remove_aligned_selected_node: function (nodeObjId) {
						var self = this
						var alignedTreeSelectedNodesIdObj = self.alignedTreeSelectedNodesIdObj
						delete alignedTreeSelectedNodesIdObj[nodeObjId]
				},
				//  更新当前的barcode视图的宽度
				updateBarcodeNodexMaxX: function () {
						var self = this
						var maxX = 0
						self.each(function (model) {
								var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
								var locationX = findMaxX(barcodeNodeAttrArray)
								maxX = maxX > locationX ? maxX : locationX
						})
						var barcodeNodexMaxX = maxX
						var comparisonViewMargin = Variables.get('comparisonViewMargin')
						var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
						var barcodePaddingLeft = Variables.get('barcodePaddingLeft')
						//  增加barcode左侧padding的距离
						barcodeNodexMaxX = barcodeNodexMaxX + barcodeTextPaddingLeft + barcodePaddingLeft
						//  增加barcode右侧padding的距离
						barcodeNodexMaxX = barcodeNodexMaxX + comparisonViewMargin.right
						var barcodeTreeCollectionWidth = $('#collection-view').width()
						barcodeNodexMaxX = barcodeNodexMaxX > barcodeTreeCollectionWidth? barcodeNodexMaxX : barcodeTreeCollectionWidth
						Variables.set('barcodeNodexMaxX', barcodeNodexMaxX)
						return barcodeNodexMaxX

						function findMaxX(barcodeNodeAttrArray) {
								var maxX = 0
								for (var bI = (barcodeNodeAttrArray.length - 1); bI > 0; bI--) {
										if (barcodeNodeAttrArray[bI].width !== 0) {
												maxX = +barcodeNodeAttrArray[bI].x + +barcodeNodeAttrArray[bI].width
												break
										}
								}
								return maxX
						}
				}
				,
				/**
					* 更新当前的barcode视图的高度
					*/
				updateBarcodeNodeyMaxY: function () {
						var self = this
						var selectItemNameArray = Variables.get('selectItemNameArray')
						var barcodetreeScrollPanelHeight = +$('#barcodetree-scrollpanel').height()
						var barcodeViewUpdateHeight = 0
						// if (Variables.get('layoutMode') === 'ORIGINAL') {
						var barcodeHeight = window.barcodeHeight
						var barcodeViewPaddingBottom = Variables.get('barcodeViewPaddingBottom')
						barcodeViewUpdateHeight = barcodeViewPaddingBottom + barcodeHeight * selectItemNameArray.length
						barcodeViewUpdateHeight = barcodeViewUpdateHeight > barcodetreeScrollPanelHeight ? barcodeViewUpdateHeight : barcodetreeScrollPanelHeight
						// } else {
						// 		barcodeViewUpdateHeight = $('#barcodetree-scrollpanel').height()
						// }
						Variables.set('barcodeNodeyMaxY', barcodeViewUpdateHeight)
				}
				,
				/**
					* 设置完整的层次结构数据对象
					* @param categoryNodeObjArray
					*/
				set_category_nodeobj_array: function (categoryNodeObjArray) {
						var self = this
						self.categoryNodeObjArray = categoryNodeObjArray
				},
				/**
					* 更新brush的barcode node节点属性值分布的对象
					*/
				update_brush_barcode_node_obj: function (brushedNodeAttrObj) {
						var self = this
						var barcodeNodeCollectionObj = {}
						var barcodeNodeCollectionObjWithId = {}
						for (var item in brushedNodeAttrObj) {
								var brushedNodeAttrArray = brushedNodeAttrObj[item]['nodeAttrArray']
								var brushedNodeMaxNum = brushedNodeAttrObj[item]['maxNum']
								var barcodeTreeId = item
								if (typeof (brushedNodeAttrArray) !== 'undefined') {
										for (var bI = 0; bI < brushedNodeAttrArray.length; bI++) {
												var nodeDepth = brushedNodeAttrArray[bI].depth
												var nodeId = brushedNodeAttrArray[bI].id
												if (typeof (barcodeNodeCollectionObj[nodeDepth]) !== 'undefined') {
														barcodeNodeCollectionObj[nodeDepth].push(brushedNodeAttrArray[bI].num)
														barcodeNodeCollectionObjWithId[nodeDepth].push({
																treeId: barcodeTreeId,
																nodeId: nodeId,
																value: brushedNodeAttrArray[bI].num
														})
														if (typeof (barcodeNodeCollectionObj['ratio']) === 'undefined') {
																barcodeNodeCollectionObj['ratio'] = new Array()
														}
														barcodeNodeCollectionObj['ratio'].push(brushedNodeAttrArray[bI].num / brushedNodeMaxNum)
														if (typeof (barcodeNodeCollectionObjWithId['ratio']) === 'undefined') {
																barcodeNodeCollectionObjWithId['ratio'] = new Array()
														}
														barcodeNodeCollectionObjWithId['ratio'].push({
																treeId: barcodeTreeId,
																nodeId: nodeId,
																value: brushedNodeAttrArray[bI].num / brushedNodeMaxNum
														})
												} else {
														barcodeNodeCollectionObj[nodeDepth] = new Array()
														barcodeNodeCollectionObjWithId[nodeDepth] = new Array()
														barcodeNodeCollectionObj[nodeDepth].push(brushedNodeAttrArray[bI].num)
														barcodeNodeCollectionObjWithId[nodeDepth].push({
																treeId: barcodeTreeId,
																nodeId: nodeId,
																value: brushedNodeAttrArray[bI].num
														})
												}
										}
								}
						}
						Variables.set('brushBarcodeNodeCollectionObj', barcodeNodeCollectionObj)
						Variables.set('brushBarcodeNodeCollectionObjWithId', barcodeNodeCollectionObjWithId)
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BRUSH_DISTRIBUTION_VIEW'])
				},
				/**
					* 更新barcode节点属性值分布的对象
					*/
				update_barcode_node_collection_obj: function () {
						var self = this
						var barcodeNodeCollectionObj = {}
						var barcodeNodeCollectionObjWithId = {}
						self.each(function (model) {
								var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
								var globalPaddingRangeIdArray = model.get('global_padding_range_id_array')
								var barcodeTreeId = model.get('barcodeTreeId')
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										if ((barcodeNodeAttrArray[bI].existed) && (barcodeNodeAttrArray[bI].width !== 0)) {
												var nodeDepth = barcodeNodeAttrArray[bI].depth
												var nodeId = barcodeNodeAttrArray[bI].id
												//  在非对齐状态下, 选择非对齐状态的全部节点; 在对齐状态下, 选择对齐状态的全部节点
												if ((!model.is_aligned_state()) || ((model.is_aligned_range(nodeId) || model.is_aligned_start(nodeId)) && (model.is_aligned_state()))) {
														if (typeof (barcodeNodeCollectionObj[nodeDepth]) === 'undefined') {
																barcodeNodeCollectionObj[nodeDepth] = new Array()
																barcodeNodeCollectionObjWithId[nodeDepth] = new Array()
																barcodeNodeCollectionObj[nodeDepth].push(barcodeNodeAttrArray[bI].num)
														}
														barcodeNodeCollectionObj[nodeDepth].push(barcodeNodeAttrArray[bI].num)
														barcodeNodeCollectionObjWithId[nodeDepth].push({
																treeId: barcodeTreeId,
																nodeId: nodeId,
																value: barcodeNodeAttrArray[bI].num
														})
														if (typeof (barcodeNodeCollectionObj['ratio']) === 'undefined') {
																barcodeNodeCollectionObj['ratio'] = new Array()
														}
														barcodeNodeCollectionObj['ratio'].push(barcodeNodeAttrArray[bI].num / barcodeNodeAttrArray[0].num)
														if (typeof (barcodeNodeCollectionObjWithId['ratio']) === 'undefined') {
																barcodeNodeCollectionObjWithId['ratio'] = new Array()
														}
														barcodeNodeCollectionObjWithId['ratio'].push({
																treeId: barcodeTreeId,
																nodeId: nodeId,
																value: barcodeNodeAttrArray[bI].num / barcodeNodeAttrArray[0].num
														})
												}
										}
								}
						})
						Variables.set('barcodeNodeCollectionObj', barcodeNodeCollectionObj)
						Variables.set('barcodeNodeCollectionObjWithId', barcodeNodeCollectionObjWithId)
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var Comparison_Mode = BARCODETREE_GLOBAL_PARAS['Comparison_Mode']
						var BARCODETREE_COMPARISON_MODE = Config.get('BARCODETREE_COMPARISON_MODE')
						//  之前只有在当前的状态是attribute的显示状态才会更新distribution的视图
						// if (Comparison_Mode === BARCODETREE_COMPARISON_MODE['ATTRIBUTE']) {
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_DISTRIBUTION_VIEW'])
						// }
				},
				// ==========================================================
				//  重置barcode collection中所有的参数
				reset_all_barcode_collection_parameter: function () {
						var self = this
						self.subtreeNodeArrayObj = {}
						self.alignedNodeIdArray = []
						self.alignedNodeObjArray = []
						self.selectedNodesId = {}
						self.selectedNodesIdObj = {}
						self.globalAlignedNodeIdArray = []
						self.globalAlignedNodeObjArray = []
						self.superTreeSelectedNodesId = {}
						self.basedModel = null
						self.basedModelId = null
						self.sortSimilarityConfigState = false
						self.collapsedNodeIdArray = []
						self.tablelensSubtreeArray = []
						self.categoryNodeObjArray = null
						self.operationItemList = []
						self.unalignItemList = []
						self.alignedTreeSelectedNodesIdObj = {}
						self.alignedLockedSelectedSortObj = null
						self.paddingSubtreeRangeObject = {}
						self.barcodeNodeYMaxY = 0
						//	存放排序参数设置的对象
						self.sortConfigObj = {}
						self.barcodeTreeNodeSumNum = 0
						//	折叠的子树部分的最大的属性值
						self.maxCollapseTriangleInfo = {}
				}
				,
				//  trigger信号UPDATE_BARCODE_ATTR, 更新barcode视图
				update_barcode_view: function () {
						var self = this
						self.uniform_layout()
						self.update_data_all_view()
				},
				reset_attribute: function () {
						var self = this
						self.subtreeNodeArrayObj = {}
						self.alignedNodeIdArray = []
						self.alignedNodeObjArray = []
						self.basedModel = null
						self.each(function (model) {
								model.reset_attribute()
						})
				}
				,
				//  获取从superTree上选择的节点的数组
				get_supertree_selected_nodes_id: function () {
						var self = this
						return self.superTreeSelectedNodesId
				}
				,
				//  获取选择的节点的数组
				get_selected_nodes_id: function () {
						var self = this
						return self.selectedNodesId
				}
				,
				//  获取删除元素之间包含关系的对象
				get_selected_nodes_id_removed_contain: function () {
						var self = this
						var selectedNodesIdRemovedContain = JSON.parse(JSON.stringify(self.selectedNodesId))
						for (var item in selectedNodesIdRemovedContain) {
								var selectedNodeId = item
								var barcodeTreeId = selectedNodesIdRemovedContain[selectedNodeId].barcodeTreeId
								var nodeObjDepth = selectedNodesIdRemovedContain[selectedNodeId].nodeObjDepth
								var filterModelArray = self.where({barcodeTreeId: barcodeTreeId})
								if (filterModelArray.length > 0) {
										var barcodeModel = filterModelArray[0]
										var nodeObj = {id: item, depth: nodeObjDepth}
										var fatherNodesArray = barcodeModel.find_father_nodes(nodeObj)
										if (is_existed(fatherNodesArray, selectedNodesIdRemovedContain)) {
												delete selectedNodesIdRemovedContain[item]
										}
								}
						}
						return selectedNodesIdRemovedContain
						//  判断fatherNodesArray中的元素是否出现在selectedNodesIdRemovedContain中, 用于去除存在包含关系的节点
						function is_existed(fatherNodesArray, selectedNodesIdRemovedContain) {
								for (var fI = 0; fI < fatherNodesArray.length; fI++) {
										var nodeId = fatherNodesArray[fI].id
										if (typeof (selectedNodesIdRemovedContain[nodeId]) !== 'undefined') {
												//  说明该节点的父节点已经被选择过, 那么就要返回true表示删除该节点
												return true
										}
								}
								return false
						}
				},
				//  获取折叠的节点的数组
				get_collapsed_nodes_id: function () {
						var self = this
						return self.collapsedNodeIdArray
				}
				,
				//  获取进行tablelens的节点数组
				get_tablelens_nodes_id: function () {
						var self = this
						return self.tablelensSubtreeArray
				}
				,
				//  设置当前的对齐节点是否显示summary的状态
				set_summary_state: function (nodeObjId, summary_state) {
						var self = this
						var alignedNodeObjArray = self.alignedNodeObjArray
						for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
								if (alignedNodeObjArray[aI].alignedNodeId === nodeObjId) {
										alignedNodeObjArray[aI].summary_state = summary_state
								}
						}
				},
				//  设置当前的节点是否比较子树节点数目的状态
				set_node_num_comparison_state: function (nodeObjId, node_num_comparison_state) {
						var self = this
						var alignedNodeObjArray = self.alignedNodeObjArray
						for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
								if (alignedNodeObjArray[aI].alignedNodeId === nodeObjId) {
										alignedNodeObjArray[aI].node_num_comparison_state = node_num_comparison_state
								}
						}
				}
				,
				//  获取当前的节点是否比较子树节点数目的状态
				get_node_num_comparison_state: function (nodeObjId) {
						var self = this
						var alignedNodeObjArray = self.alignedNodeObjArray
						for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
								if (alignedNodeObjArray[aI].alignedNodeId === nodeObjId) {
										if (typeof (alignedNodeObjArray[aI].node_num_comparison_state) !== 'undefined') {
												return alignedNodeObjArray[aI].node_num_comparison_state
										} else {
												return false
										}
								}
						}
						return false
				}
				,
				//  获取当前节点的对齐状态, 该节点是否已经对齐
				get_aligned_state: function (nodeObjId) {
						var self = this
						var alignedNodeIdArray = self.alignedNodeIdArray
						//  判断该节点是否已经对齐
						if (alignedNodeIdArray.indexOf(nodeObjId) === -1) {
								//  alignedNodeIdArray中不存在该节点, 说明没有对齐
								return false
						} else {
								//  alignedNodeIdArray中存在该节点, 说明没有对齐
								return true
						}
				},
				/**
					* 获取alignedNodeIdArray
					*/
				get_aligned_node_id_array: function () {
						var self = this
						return self.alignedNodeIdArray
				},
				//  获取节点的选择状态
				get_selection_state: function (nodeObjId, nodeObjDepth) {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						var selectionState = Config.get('CONSTANT')['NOT_SELECTED']
						if (typeof (selectedNodesIdObj[nodeObjId]) === 'undefined') {
								selectionState = Config.get('CONSTANT')['NOT_SELECTED']
						} else {
								selectionState = selectedNodesIdObj[nodeObjId].selectedType
						}
						return selectionState
				}
				,
				//  在superTree视图中点击barcode节点选中
				add_supertree_selected_subtree_id: function (nodeObjId, nodeObjDepth) {
						var self = this
						var superTreeSelectedNodesId = self.superTreeSelectedNodesId
						superTreeSelectedNodesId[nodeObjId] = nodeObjDepth
				}
				,
				//  在superTree视图中点击barcode节点取消选中
				remove_supertree_selected_subtree_id: function (nodeObjId) {
						var self = this
						var superTreeSelectedNodesId = self.superTreeSelectedNodesId
						delete superTreeSelectedNodesId[nodeObjId]
				},
				//  清楚在superTree中选择的subtree的id
				clear_supertree_selected_subtree_id: function () {
						var self = this
						self.superTreeSelectedNodesId = {}
				},
				//  删除全部选择的节点
				remove_all_selected_node: function () {
						var self = this
						var selectedNodesIdObj = self.selectedNodesId
						var removedNodeObjArray = []
						for (var item in selectedNodesIdObj) {
								var nodeObjId = item
								var nodeObjDepth = selectedNodesIdObj[item].depth
								var removedNodeObj = {
										nodeObjId: nodeObjId,
										nodeObjDepth: nodeObjDepth
								}
								removedNodeObjArray.push(removedNodeObj)
						}
						self.remove_selected_node(removedNodeObjArray)
				},
				/**
					* 清空所有的tablelens的数组
					*/
				clear_tablelens_array: function () {
						var self = this
						self.tablelensSubtreeArray = []
				},
				/**
					*  获取子树的变化的比例
					*/
				get_focus_ratio_obj: function (tablelens_subtree_array) {
						var self = this
						var categoryNodeObjArray = self.categoryNodeObjArray
						if ((categoryNodeObjArray === null) || (categoryNodeObjArray.length === 0)) {
								return null
						}
						var barcodetreeViewHeight = Variables.get('barcodetreeViewHeight')
						var barcodetreeViewWidth = Variables.get('barcodetreeViewWidth')
						var focusTreeLength = 0
						var subtreeObjArray = []
						//  当tablelenssubtreeArray数组中选择的节点为0时, 那么节点不需要压缩和拉伸
						if (tablelens_subtree_array.length === 0) {
								return {ratioObj: {focusRatio: 1, contextRatio: 1}, subtreeObjArray: []}
						}
						for (var tI = 0; tI < tablelens_subtree_array.length; tI++) {
								var subtreeRootId = tablelens_subtree_array[tI]
								var subtreeObj = get_subtree_length(subtreeRootId, categoryNodeObjArray)
								subtreeObjArray.push(subtreeObj)
								focusTreeLength = focusTreeLength + subtreeObj.subtreeLength
						}
						var barcodetreeViewWidth = Variables.get('barcodetreeViewWidth')
						var barcodePaddingLeft = Variables.get('barcodePaddingLeft')
						var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
						var categoryPaddingRight = Config.get('TABLE_LENS_PARA')['category_padding_right']
						barcodetreeViewWidth = barcodetreeViewWidth - barcodePaddingLeft - barcodeTextPaddingLeft - categoryPaddingRight
						var barcodeTreeOriginalWidth = get_subtree_length(categoryNodeObjArray[0].id, categoryNodeObjArray).subtreeLength
						var defaultRatio = barcodetreeViewWidth / barcodeTreeOriginalWidth
						var ratioObj = get_tablelens_ratio(barcodeTreeOriginalWidth, focusTreeLength, barcodetreeViewWidth, defaultRatio)
						var focusRatio = ratioObj.focusRatio
						var contextRatio = ratioObj.contextRatio
						var ratioAndSubtreeObj = {ratioObj: ratioObj, subtreeObjArray: subtreeObjArray}
						return ratioAndSubtreeObj
						//  计算得到tablelens的放大和压缩的比率
						function get_tablelens_ratio(wholeTreeLength, focusTreeLength, viewWidth, defaultRatio) {
								var tablelensMinimumRatio = Config.get('TABLE_LENS_PARA')['minimum_ratio']
								tablelensMinimumRatio = defaultRatio * 0.75
								var focusRatio = Variables.get('maxBarcodeWidth') / window.barcodeWidthArray[0]
								var contextRatio = (viewWidth - focusTreeLength * focusRatio) / (wholeTreeLength - focusTreeLength)// 按照原始的比率进行放大, 所以在视图中和原始的树的长度是相同的
								if (contextRatio > tablelensMinimumRatio) {
										// 改变之后的ratio大于tablelens最小的比率, 那么就按照change的ratio进行计算
										//  改变之后的focusRatio是1, 此时是默认的情况, focusRatio是1, contextRatio是根据focusRatio计算得到的结果
								} else {
										//  否则就重新计算change的ratio, 按照tablelens的最小的比率计算focus的ratio的大小
										var contextViewLength = (wholeTreeLength - focusTreeLength) * tablelensMinimumRatio
										var focusViewLength = viewWidth - contextViewLength
										var focusRatio = focusViewLength / focusTreeLength
										contextRatio = tablelensMinimumRatio
								}
								return {focusRatio: focusRatio, contextRatio: contextRatio}
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
												subtreeObj.startX = categoryNodeObjArray[cI].x
										}
										//  对于root节点, 可以一直读取到最终的节点位置上
										if (cI === categoryNodeObjArray.length) {
												subtreeObj.endIndex = cI
												subtreeObj.endX = categoryNodeObjArray[cI].x
												break
										}
								}
								subtreeObj.subtreeLength = subtreeLength
								return subtreeObj
						}
				}
				,
				/**
					* 更新所有的barcodeModel中的节点的高度
					*/
				update_attribute_height: function () {
						var self = this
						self.each(function (model) {
								model.add_attribute_height()
						})
				},
				/**
					* 更新barcode显示节点的层级
					*/
				update_displayed_level: function () {
						var self = this
						var alignedNodeIdArray = self.alignedNodeIdArray
						self.each(function (model) {
								model.update_displayed_level()
								model.update_covered_rect_obj(alignedNodeIdArray)
						})
				},
				//	将某个子树进行展开
				uncollapse_subtree: function (nodeDataId, nodeDataDepth) {
						var self = this
						//  在collapsedNodeIdArray中已经存在点击的节点
						self.each(function (model) {
								model.uncollapse_subtree(nodeDataId, nodeDataDepth)
						})
				},
				//	更新折叠的子树的最大宽度和高度
				update_triangle_max_width_height: function () {
						var self = this
						var collapsedNodeIdArray = self.get_collapsed_nodes_id()
						//	遍历全部的treeDataModel以及collapsedNode, 获取表示全集的wholeTreeAttrObj
						var wholeTreeAttrObj = {}
						self.each(function (treeDataModel) {
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								//  计算层次结构数据的最大的宽度以及高度
								var treeAttrObj = treeDataModel.get_tree_width_height(collapsedNodeIdArray)
								wholeTreeAttrObj[barcodeTreeId] = treeAttrObj
						})
						//	根据上面计算的全集的折叠子树的信息, 计算折叠子树信息的最大的属性值
						var maxWidth = 0
						var maxHeight = 0
						for (var treeId in wholeTreeAttrObj) {
								var treeObj = wholeTreeAttrObj[treeId]
								for (var nodeId in treeObj) {
										var collapsedTreeAttr = treeObj[nodeId]
										var collapsedTreeWidth = collapsedTreeAttr.width
										var collapsedTreeHeight = collapsedTreeAttr.height
										if (collapsedTreeWidth > maxWidth) {
												maxWidth = collapsedTreeWidth
										}
										if (collapsedTreeHeight > maxHeight) {
												maxHeight = collapsedTreeHeight
										}
								}
						}
						var maxCollapseTriangleInfo = {width: maxWidth, height: maxHeight}
						self.maxCollapseTriangleInfo = maxCollapseTriangleInfo
				},
				//	删除uncollapse的节点
				remove_uncollapse_nodes: function (nodeDataId, nodeDataDepth) {
						var self = this
						self.each(function (model) {
								model.remove_uncollapse_nodes(nodeDataId, nodeDataDepth)
						})
				},
				//	折叠某个子树
				collapse_subtree: function (nodeDataId, nodeDataDepth) {
						var self = this
						self.each(function (model) {
								model.collapse_subtree(nodeDataId, nodeDataDepth)
						})
				},
				//	增加折叠子树部分的节点
				add_collapse_nodes: function (nodeDataId, nodeDataDepth) {
						var self = this
						self.each(function (model) {
								model.add_collapse_nodes(nodeDataId, nodeDataDepth)
						})
				},
				//	从折叠的子树根节点数组中删除选择的节点
				remove_from_collapsed_array: function (nodeDataId) {
						var self = this
						var collapsedNodeIdArray = self.collapsedNodeIdArray
						var nodeDataIdIndex = collapsedNodeIdArray.indexOf(nodeDataId)
						if (nodeDataIdIndex !== -1) {
								collapsedNodeIdArray.splice(nodeDataIdIndex, 1)
						}
				},
				//	向折叠的子树根节点数组中添加选择的节点
				add_to_collapsed_array: function (nodeDataId) {
						var self = this
						//  在collapsedNodeIdArray中不存在点击的节点
						var collapsedNodeIdArray = self.collapsedNodeIdArray
						if (collapsedNodeIdArray.indexOf(nodeDataId) === -1) {
								collapsedNodeIdArray.push(nodeDataId)
						}
				},
				/**
					* uniform 的布局模式
					*/
				uniform_layout: function () {
						var self = this
						var barcodeModelArray = []
						var selectItemNameArray = Variables.get('selectItemNameArray')
						self.each(function (model) {
								// console.log('barcodeModelType', model.get('barcodeModelType'))
								// if ((typeof (model.get('barcodeModelType'))) !== 'undefined') {
								//   model.set('barcodeIndex', -1)
								// }
								barcodeModelArray.push(model)
								// var barcodeTreeId = model.get('barcodeTreeId')
								// var barcodeIndex = selectItemNameArray.indexOf(barcodeTreeId)
								// model.set('barcodeIndex', barcodeIndex)
						})
						barcodeModelArray = barcodeModelArray.sort(function (model_a, model_b) {
								return model_a.get('barcodeIndex') - model_b.get('barcodeIndex')
						})
						var barcodeHeight = Variables.get('barcodeHeight')
						// var compactNum = window.compactNum
						// var superTreeHeight = $('#supertree-scroll-panel').height()
						// var barcodeTreeConfigHeight = Variables.get('barcodeTreeConfigHeight')
						// var barcodeViewHeight = $('#barcode-view').height() - superTreeHeight - barcodeTreeConfigHeight
						// var updatedHeight = +new Number(barcodeViewHeight / selectItemNameArray.length).toFixed(1)
						// window.barcodeHeight = +updatedHeight > +barcodeHeight ? +barcodeHeight : +updatedHeight
						var barcodeContainerHeight = +window.barcodeHeight
						// var barcodeHeightRatio = Variables.get('barcodeHeightRatio')
						// var barcodeHistogramRatio = Variables.get('barcodeHistogramRatio')
						// var barcodeOriginalNodeHeight = barcodeContainerHeight * barcodeHeightRatio
						// var barcodeOriginalSummaryHeight = barcodeContainerHeight * barcodeHistogramRatio
						// var barcodeCompactNodeHeight = barcodeOriginalNodeHeight / (compactNum + (compactNum - 1) / 4)
						// var barcodeCompactNodeGap = barcodeCompactNodeHeight / 4
						// var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
						var barcodeYLocation = Variables.get('barcodeViewPaddingBottom') - 5 // 5是为了留一点边界, 保证barcodeTree能够完全显示
						for (var barcodeIndex = 0; barcodeIndex < barcodeModelArray.length; barcodeIndex++) {
								var treeDataModel = barcodeModelArray[barcodeIndex]
								if (typeof(treeDataModel) !== 'undefined') {
										//  更新barcode.model的barcodeNodeHeight和barcodeTreeYLocation属性,控制barcode的container的位置以及高度
										// treeDataModel.set('barcodeOriginalNodeHeight', barcodeOriginalNodeHeight)
										// treeDataModel.set('barcodeCompactNodeHeight', barcodeCompactNodeHeight)
										treeDataModel.set_barcode_padding_top()
										//  改变barcode初始模式的节点数组的节点的高度
										var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
										for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
												barcodeNodeAttrArray[bI].height = barcodeContainerHeight * Variables.get('barcodeHeightRatio')
										}
										//  改变barcode的compact模式的节点数组的节点的高度
										// var compactBarcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
										// for (var cI = 0; cI < compactBarcodeNodeAttrArray.length; cI++) {
										// 		if (compactBarcodeNodeAttrArray[cI].compactAttr === ABSOLUTE_COMPACT_FATHER) {
										// 				compactBarcodeNodeAttrArray[cI].height = barcodeCompactNodeHeight
										// 				compactBarcodeNodeAttrArray[cI].y = compactBarcodeNodeAttrArray[cI].compactCount * (barcodeCompactNodeHeight + barcodeCompactNodeGap)
										// 		} else {
										// 				compactBarcodeNodeAttrArray[cI].height = barcodeOriginalNodeHeight
										// 		}
										// }
										// treeDataModel.set('barcodeNodeHeight', barcodeContainerHeight)
										treeDataModel.set('barcodeTreeYLocation', barcodeYLocation)
										// treeDataModel.set('barcodeOriginalSummaryHeight', barcodeOriginalSummaryHeight)
										// treeDataModel.set('viewUpdateConcurrentValue', (treeDataModel.get('viewUpdateConcurrentValue') + 1) % 2)
										barcodeYLocation = barcodeYLocation + barcodeContainerHeight
								}
						}
				},
				/**
					* 按照现在的barcode中的对齐节点, 对于增加的barcodeModel中的节点数组进行调整
					* @param barcodeModel
					*/
				adjust_barcode_model: function (barcodeModel) {
						var self = this
						var barcodeNodeGap = Variables.get('barcodeNodeInterval')
						var alignedNodeIdArray = self.alignedNodeIdArray
						var alignedObj = {}
						var basedBarcodeModel = self.at(0)
						var basedBarcodeNodeAttrArray = null
						var basedCompactBarcodeNodeAttrArray = null
						if (typeof(basedBarcodeModel) !== 'undefined') {
								basedBarcodeNodeAttrArray = basedBarcodeModel.get('barcodeNodeAttrArray')
								basedCompactBarcodeNodeAttrArray = basedBarcodeModel.get('compactBarcodeNodeAttrArray')
						}
						var thisBarcodeNodeAttrArray = barcodeModel.get('barcodeNodeAttrArray')
						var thisCompactBarcodeNodeAttrArray = barcodeModel.get('compactBarcodeNodeAttrArray')
						var isAdjustBasedModel = (self.length !== 0)
						//  按照align的节点排列
						if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
								_inner_adjust_barcode_model(isAdjustBasedModel, basedBarcodeNodeAttrArray, thisBarcodeNodeAttrArray)
						}
						function _inner_adjust_barcode_model(isAdjustBasedModel, basedBarcodeNodeAttrArray, thisBarcodeNodeAttrArray) {
								//  取得当前对齐节点的x位置, 计算的方法是通过获取对齐节点的数组, 然后得到该数组中的相对应节点的位置
								if (isAdjustBasedModel) {
										for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
												for (var bI = 0; bI < basedBarcodeNodeAttrArray.length; bI++) {
														if (basedBarcodeNodeAttrArray[bI].id === alignedNodeIdArray[aI]) {
																alignedObj[alignedNodeIdArray[aI]] = +basedBarcodeNodeAttrArray[bI].x
														}
												}
										}
								}
								//  将增加的barcode model中的节点数组进行相应的变换, 即如果不是对齐的节点, 那么按照从左到右累计进行计算。
								for (var tI = 1; tI < thisBarcodeNodeAttrArray.length; tI++) {
										var barcodeNodeId = thisBarcodeNodeAttrArray[tI].id
										if (thisBarcodeNodeAttrArray[tI - 1].width !== 0) {
												thisBarcodeNodeAttrArray[tI].x = thisBarcodeNodeAttrArray[tI - 1].x + thisBarcodeNodeAttrArray[tI - 1].width + barcodeNodeGap
										} else {
												thisBarcodeNodeAttrArray[tI].x = thisBarcodeNodeAttrArray[tI - 1].x
										}
										if (alignedNodeIdArray.indexOf(barcodeNodeId) !== -1) {
												if (alignedObj[barcodeNodeId] > thisBarcodeNodeAttrArray[tI].x) {
														thisBarcodeNodeAttrArray[tI].x = alignedObj[barcodeNodeId]
												}
										}
								}
						}
				}
				,
				/**
					* 更新单个的BarcodeTree视图显示
					*/
				update_single_barcode_view: function () {
						var self = this
						var currentConfigBarcodeTreeId = Variables.get('current_config_barcodeTreeId')
						if (currentConfigBarcodeTreeId != null) {
								var filteredModel = self.where({barcodeTreeId: currentConfigBarcodeTreeId})
								if (filteredModel.length !== 0) {
										filteredModel[0].set('viewUpdateConcurrentValue', (filteredModel[0].get('viewUpdateConcurrentValue') + 1) % 2)
								}
						}
				}
				,
				/**
					* 更新所有视图的选择状态
					*/
				update_barcode_selection_state: function () {
						var self = this
						self.each(function (barcodeModel) {
								barcodeModel.set('viewUpdateSelectionState', (barcodeModel.get('viewUpdateSelectionState') + 1) % 2)
						})
				}
				,
				/**
					* 更新所有的BarcodeTree视图显示
					*/
				update_all_barcode_view: function () {
						var self = this
						self.each(function (barcodeModel) {
								barcodeModel.set('viewUpdateConcurrentValue', (barcodeModel.get('viewUpdateConcurrentValue') + 1) % 2)
						})
				}
				,
				/**
					* 获取单个BarcodeTree的模式
					*/
				get_current_single_barcode_mode: function () {
						var self = this
						var currentConfigBarcodeTreeId = Variables.get('current_config_barcodeTreeId')
						if (currentConfigBarcodeTreeId != null) {
								var filteredModel = self.where({barcodeTreeId: currentConfigBarcodeTreeId})
								if (filteredModel.length !== 0) {
										var barcodeMode = filteredModel[0].get('displayMode')
										return barcodeMode
								}
						}
				}
				,
				/**
					* 更新所有BarcodeTree的模式
					* @param barcode_mode
					*/
				update_all_barcode_mode: function (barcode_mode) {
						var self = this
						self.each(function (model) {
								model.set('displayMode', barcode_mode)
						})
				}
				,
				/**
					* 更新单个BarcodeTree的模式
					*/
				update_single_barcode_mode: function (barcode_mode) {
						var self = this
						var currentConfigBarcodeTreeId = Variables.get('current_config_barcodeTreeId')
						if (currentConfigBarcodeTreeId != null) {
								var filteredModel = self.where({barcodeTreeId: currentConfigBarcodeTreeId})
								if (filteredModel.length !== 0) {
										filteredModel[0].set('displayMode', barcode_mode)
								}
						}
				}
				,
				remove_barcode_subtree: function (rootId, rootCategory, rootLevel, supertreeNodeObj, compactSuperTreeNodeLocObj) {
						var self = this
						//  在barcode collection中的model中增加子树的节点
						self.each(function (barcodeModel) {
								var barcodeTreeId = barcodeModel.get('barcodeTreeId')
								var supertreeNodeArray = supertreeNodeObj[barcodeTreeId]
								var compactSuperTreeNodeLocArray = compactSuperTreeNodeLocObj[barcodeTreeId]
								if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
										var cloneSubtreeNodeArray = JSON.parse(JSON.stringify(supertreeNodeArray))
										var cloneMaxNodeNumTreeNodeLocArray = JSON.parse(JSON.stringify(supertreeNodeArray))
										barcodeModel.update_single_barcode_subtree(rootId, rootCategory, rootLevel, cloneSubtreeNodeArray, cloneMaxNodeNumTreeNodeLocArray)
								} else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
										var cloneCompactSuperTreeNodeLocArray = JSON.parse(JSON.stringify(compactSuperTreeNodeLocArray))
										var cloneCompactMaxNodeNumTreeNodeLocArray = JSON.parse(JSON.stringify(compactSuperTreeNodeLocArray))
										barcodeModel.update_single_compact_barcode_subtree(rootId, rootCategory, rootLevel, cloneCompactSuperTreeNodeLocArray, cloneCompactMaxNodeNumTreeNodeLocArray)
								}
						})
				}
				,
				update_aligned_node_para: function (rootId, rootCategory, rootLevel) {
						var self = this
						var subtreeNodeIdArray = []
						for (var sI = 0; sI < subtreeNodeArray.length; sI++) {
								subtreeNodeIdArray.push(subtreeNodeArray[sI].id)
						}
				}
				,
				/**
					* 获取最大的x值
					*/
				getGlobalMaxX: function (d, barcodeAlignedNodeGap) {
						function getX(barcodeNodeAttrArray) {
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										if (barcodeNodeAttrArray[bI].id === rootId) {
												return barcodeNodeAttrArray[bI].x + barcodeAlignedNodeGap
										}
								}
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										var thisCategory = +barcodeNodeAttrArray[bI].category
										if ((category != NaN) && (thisCategory != NaN)) {
												if (thisCategory > category) {
														return barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width + barcodeAlignedNodeGap
												}
										}
								}
						}

						var self = this
						var maxX = 0
						var rootId = d.id
						var category = +d.category
						self.each(function (d) {
								var barcodeNodeAttrArray = d.get('barcodeNodeAttrArray')
								var locationX = getX(barcodeNodeAttrArray, category)
								maxX = maxX > locationX ? maxX : locationX
						})
						return maxX
				},
				// recover_whole_barcode_model: function () {
				//   var self = this
				//   var modelArray = []
				//   self.each(function (model) {
				//     modelArray.push(model)
				//   })
				//   modelArray.sort(function (model_a, model_b) {
				//     var nodeIndexA = model_a.get('originalBarcodeIndex')
				//     var nodeIndexB = model_b.get('originalBarcodeIndex')
				//     return nodeIndexA - nodeIndexB
				//   })
				//
				//   for (var mI = 0; mI < modelArray.length; mI++) {
				//     modelArray[ mI ].set('barcodeIndex', mI)
				//   }
				//   self.update_barcode_location()
				//   self.trigger_barcode_loc()
				// },
				sort_vertical_barcode_model: function (barcodeTreeVerticalSequence) {
						var self = this
						self.each(function (model) {
								var barcodeTreeId = model.get('barcodeTreeId')
								var barcodeTreeIndex = barcodeTreeVerticalSequence.indexOf(barcodeTreeId)
								model.set('barcodeIndex', barcodeTreeIndex)
						})
						self.uniform_layout()
				},
				/**
					* 按照barcodeTree的时序进行排序, 可以升序排序, 也可以降序排序
					* @param asc_desc_para
					*/
				date_sort_barcode_model: function (asc_desc_para, comparedNodeId, sortOption) {
						var self = this
						var barcodeModelArray = []
						self.each(function (model) {
								barcodeModelArray.push(model)
						})
						var currentDataSetName = Variables.get('currentDataSetName')
						//  只有在sortOption维按照date或者day进行排序的状态
						if ((sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_DATE_SORT'])
								|| (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_DAY_SORT'])) {
								barcodeModelArray = barcodeModelArray.sort(function (model_a, model_b) {
										//  如果数据集是LibraryTree_DailyName
										return library_tree_handler(model_a, model_b, sortOption, asc_desc_para)
								})
						}
						//	完成排序 => 设置barcodeTree的排序结果
						self.set_sorting_results(barcodeModelArray, comparedNodeId)
						self.uniform_layout()
						//  library tree的排序函数
						function library_tree_handler(model_a, model_b, sortOption, asc_desc_para) {
								var barcodeTreeId_a = model_a.get('barcodeTreeId')
								var barcodeTreeId_b = model_b.get('barcodeTreeId')
								var date_a = barcodeTreeId_a.split('-')[1].replaceAll('_', '-')
								var curDay_a = new Date(date_a).getDay()
								var date_b = barcodeTreeId_b.split('-')[1].replaceAll('_', '-')
								var curDay_b = new Date(date_b).getDay()
								var month_day_a = date_a.split('-')[1] + date_a.split('-')[2]
								var month_day_b = date_b.split('-')[1] + date_b.split('-')[2]
								if (sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_DATE_SORT']) {
										//  如果当前的状态是按照日期先后进行排序
										if (asc_desc_para === 'asc') {
												return (+month_day_a) - (+month_day_b)
										} else {
												return (+month_day_b) - (+month_day_a)
										}
								} else {
										if ((+curDay_a) !== (+curDay_b)) {
												if (asc_desc_para === 'asc') {
														return (+curDay_a) - (+curDay_b)
												} else {
														return (+curDay_b) - (+curDay_a)
												}
										} else {
												if (asc_desc_para === 'asc') {
														return (+month_day_a) - (+month_day_b)
												} else {
														return (+month_day_b) - (+month_day_a)
												}
										}
								}
						}
				},
				/**
					*  对于barcode model的属性进行排序, 可以升序也可以降序
					*  @param asc_desc_para
					*/
				sort_barcode_model: function (asc_desc_para, comparedNodeId, sortOption) {
						var self = this
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						//  只有一个节点的情况下
						var Selection_State = BARCODETREE_GLOBAL_PARAS['Selection_State']// 选择的是一个节点还是一个子树
						var modelArray = []
						self.each(function (model) {
								modelArray.push(model)
						})
						modelArray = modelArray.sort(function (model_a, model_b) {
								return sort_handler(model_a, model_b, asc_desc_para, comparedNodeId, sortOption)
						})
						//	如果当前的排序准则是按照树之间的similarity进行排序
						if ((sortOption === Config.get('BARCODETREE_STATE')['BARCODETREE_SIMILARITY_SORT']) && (asc_desc_para === 'asc')) {
								//	将排在最后一个的barcodeTree提取出来, 放到第一个位置处
								var lastBarcodeModel = modelArray.splice(modelArray.length - 1, modelArray.length)
								modelArray.unshift(lastBarcodeModel[0])
						}
						//	完成排序 => 设置排序的结果
						self.set_sorting_results(modelArray, comparedNodeId)
						self.uniform_layout()
						// barcode排序的准则
						function sort_handler(model_a, model_b, asc_desc_para, comparedNodeId, sortOption) {
								var modelAValue = model_a.get_sorting_subtree_value(sortOption, comparedNodeId)
								var modelBValue = model_b.get_sorting_subtree_value(sortOption, comparedNodeId)
								var barcodeTreeIdA = model_a.get('barcodeTreeId')
								var barcodeTreeIdB = model_b.get('barcodeTreeId')
								if (asc_desc_para === 'asc') {
										var modelValueDiff = modelAValue - modelBValue
										if (modelValueDiff !== 0) {
												return modelValueDiff
										} else {
												var barcodeTreeIdA = model_a.get('barcodeTreeId')
												var barcodeTreeIdB = model_b.get('barcodeTreeId')
												return barcodeTreeIdA < barcodeTreeIdB
										}
								} else if (asc_desc_para === 'desc') {
										var modelValueDiff = modelBValue - modelAValue
										if (modelValueDiff !== 0) {
												return modelValueDiff
										} else {
												var barcodeTreeIdA = model_a.get('barcodeTreeId')
												var barcodeTreeIdB = model_b.get('barcodeTreeId')
												return barcodeTreeIdA > barcodeTreeIdB
										}
								}
						}
				},
				/**
					*  取消barcode collection中的based model的设置
					*/
				unset_based_model: function () {
						var self = this
						self.sortSimilarityConfigState = false
						self.basedModel = null
						self.basedModelId = null
						self.each(function (model) {
								model.set('compareBased', false)
								model.set('basedModel', null)
								model.set('alignedComparisonResultArray', null)
						})
						// self.trigger_null_color_encoding()
						// self.trigger_barcode_loc()
				}
				,
				/**
					* 将选中的barcode的model放到collection数组的第一个位置作为比较的based model
					*/
				set_based_model: function (barcodeTreeId) {
						var self = this
						var basedModel = self.where({'barcodeTreeId': barcodeTreeId})[0]
						self.each(function (model) {
								model.set('compareBased', false)
								model.set('basedModel', basedModel)
						})
						basedModel.set('compareBased', true)
						self.basedModelId = barcodeTreeId
						self.basedModel = basedModel
						self.get_comparison_result()
						// self.trigger_barcode_loc()
				}
				,
				/**
					*  按照barcodetree选择的顺序重新进行排序, 并且更新位置
					*/
				resort_default_barcodetree: function () {
						var self = this
						var self = this
						self.sortSimilarityConfigState = false
						self.reset_select_sequence()
						self.uniform_layout()
				}
				,
				/**
					* 按照选择的barcodeTree进行排序
					*/
				sort_selected_barcodetree: function () {
						var self = this
						var basedModel = self.basedModel
						if (basedModel == null) {
								return
						}
						var alignedRangeObjArray = null
						if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
								alignedRangeObjArray = basedModel.get('alignedRangeObjArray')
						} else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
								alignedRangeObjArray = basedModel.get('compactAlignedRangeObjArray')
						}
						if (alignedRangeObjArray.length !== 0) {
								self.sort_accord_similarity()
						} else {
								self.sort_based_as_first()
						}
						self.uniform_layout()
				},
				/**
					* 设置BarcodeTree的比较结果
					*/
				set_sorting_results: function (barcodeModelArray) {
						var self = this
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						//	在当前不是split的情况下
						self.set_whole_barcodetree_sorting_result(barcodeModelArray)
				},
				/**
					* 对于整个barcodeTree按照date或者day等时间属性排序时, 改变排序结果设置中整个BarcodeTree的纵向位置
					*/
				set_whole_barcodetree_sorting_result: function (modelArray) {
						var self = this
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						for (var mI = 0; mI < modelArray.length; mI++) {
								//  如果当前处于切割的状态, 改变切割的barcodeTree的subtree的每一段的index值
								modelArray[mI].set_all_barcode_segement_index(mI)
								//  如果当前处于非切割状态, 那么改变整个barcodeTree的index数值
								modelArray[mI].set('barcodeIndex', mI)
						}
				},
				change_layout_mode: function () {
						var self = this
						self.updateBarcodeNodexMaxX()
						self.updateBarcodeNodeyMaxY()
						self.uniform_layout()
						// self.trigger_barcode_loc()
						self.trigger_update_summary()
				},
				// update_barcode_model_height: function (addedBarcodeModel) {
				// 		var self = this
				// 		self.uniform_layout_height_update(addedBarcodeModel)
				// },
				/**
					* 更新barcode的位置的方法, 在这个方法内对于uniform layout和fish eye layout进行统一控制
					*/
				update_barcode_location: function () {
						var self = this
						var layoutMode = Variables.get('layoutMode')
				}
				,
				sort_based_as_first: function () {
						var self = this
						var basedModel = self.basedModel
						if (basedModel == null) {
								return
						}
						basedModel.set('barcodeIndex', -1)
						var modelArray = []
						self.each(function (model) {
								modelArray.push(model)
						})
						modelArray.sort(function (model_a, model_b) {
								var barcodeIndexA = getBarcodeIndexAttr(model_a)
								var barcodeIndexB = getBarcodeIndexAttr(model_b)
								return barcodeIndexA - barcodeIndexB
						})
						for (var mI = 0; mI < modelArray.length; mI++) {
								modelArray[mI].set('barcodeIndex', mI)
						}
						function getBarcodeIndexAttr(model) {
								var barcodeIndex = model.get('barcodeIndex')
								return barcodeIndex
						}
				}
				,
				//  根据barcodeModel与basedBarcodeModel比较的结果进行排序
				sort_accord_similarity: function () {
						var self = this
						self.sortSimilarityConfigState = true
						var modelArray = []
						self.each(function (model) {
								modelArray.push(model)
						})
						modelArray.sort(function (model_a, model_b) {
								var nodeDifferenceA = model_a.get_node_difference()
								var nodeDifferenceB = model_b.get_node_difference()
								return nodeDifferenceA - nodeDifferenceB
						})
						for (var mI = 0; mI < modelArray.length; mI++) {
								var barcodeTreeId = modelArray[mI].get('barcodeTreeId')
								// var encodedColor = self.get_color_accord_similarity(mI)
								modelArray[mI].set('barcodeIndex', mI)
						}
						//  有的情况下basedTree没有排在最上方, 所以需要增加一个sort_based_as_first排序
						self.sort_based_as_first()
				}
				,
				get_color_accord_similarity: function (barcodeIndex) {
						var mostSimilarity = d3.rgb(158, 202, 225)
						var lessSimilarity = d3.rgb(255, 255, 255)
						var colorCompute = d3.interpolate(mostSimilarity, lessSimilarity)
						var selectItemNameArray = Variables.get('selectItemNameArray')
						var colorLinear = d3.scale.linear()
								.domain([0, selectItemNameArray.length - 1])
								.range([0, 1])
						return colorCompute(colorLinear(barcodeIndex))
				}
				,
				/**
					* 获取basedModel对象
					*/
				get_based_model: function () {
						var self = this
						return self.basedModel
				}
				,
				/**
					* 恢复按照barcode选择顺序进行排序的状态
					*/
				reset_select_sequence: function () {
						var self = this
						var selectItemNameArray = Variables.get('selectItemNameArray')
						self.each(function (model) {
								var barcodeTreeId = model.get('barcodeTreeId')
								var barcodeIndex = +selectItemNameArray.indexOf(barcodeTreeId)
								model.set('barcodeIndex', barcodeIndex)
						})
				}
				,
				/**
					* 获得barcode比较的结果
					*/
				get_comparison_result: function () {
						var self = this
						self.each(function (model) {
								model.get_single_comparison_result()
						})
				}
				,
				/**
					*  筛选与当前barcode比较一定相似度范围的barcode
					*/
				filter_barcode: function (percentage_value) {
						var self = this
						var percentageMinValue = percentage_value[0] / 100
						var percentageMaxValue = percentage_value[1] / 100
						self.each(function (model) {
								var nodeDifference = model.get_node_difference()
								if (nodeDifference != null) {
										if ((nodeDifference <= percentageMaxValue) && (nodeDifference >= percentageMinValue)) {
												model.set('filterState', true)
										} else {
												model.set('filterState', false)
										}
								}
						})
				}
				,
				/**
					*  清空所有筛选的barcode
					*/
				clear_filter_barcode: function () {
						var self = this
						self.each(function (model) {
								model.set('filterState', false)
						})
				}
				,
				/**
					* 按照paddingnode的长度进行barcode的排序
					* @param coverRectIndex
					*/
				sort_cover_rect_barcode_model: function (coverRectIndex, parameter) {
						var self = this
						var modelArray = []
						self.each(function (model) {
								modelArray.push(model)
						})
						modelArray.sort(function (model_a, model_b) {
								var nodeNumberA = getNodeNumber(model_a, coverRectIndex)
								var nodeNumberB = getNodeNumber(model_b, coverRectIndex)
								if (parameter === 'asc')
										return nodeNumberA - nodeNumberB
								return nodeNumberB - nodeNumberA
						})
						for (var mI = 0; mI < modelArray.length; mI++) {
								var barcodeTreeId = modelArray[mI].get('barcodeTreeId')
								modelArray[mI].set('barcodeIndex', mI)
						}
						self.uniform_layout()
						// self.trigger_barcode_loc()
						function getNodeNumber(model, coverRectIndex) {
								var paddingNodeObjArray = model.get('paddingNodeObjArray')
								var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
								var paddingNodeStartIndex = paddingNodeObjArray[coverRectIndex].paddingNodeStartIndex
								var paddingNodeEndIndex = paddingNodeObjArray[coverRectIndex].paddingNodeEndIndex
								var nodeValue = 0
								if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
										nodeValue = self.get_node_number(paddingNodeStartIndex, paddingNodeEndIndex, barcodeNodeAttrArray)
								} else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
										nodeValue = self.get_sum_attr_value(paddingNodeStartIndex, paddingNodeEndIndex, barcodeNodeAttrArray)
								}
								return nodeValue
						}
				}
				,
				/**
					*  按照原始选择的顺序对于barcode进行排序
					*/
				recover_barcode_model_sequence: function () {
						var self = this
						var modelArray = []
						self.each(function (model) {
								modelArray.push(model)
						})
						modelArray.sort(function (model_a, model_b) {
								var nodeIndexA = model_a.get('originalBarcodeIndex')
								var nodeIndexB = model_b.get('originalBarcodeIndex')
								return nodeIndexA - nodeIndexB
						})

						for (var mI = 0; mI < modelArray.length; mI++) {
								modelArray[mI].set('barcodeIndex', mI)
						}
						self.uniform_layout()
						// self.trigger_barcode_loc()
				}
				,
				/**
					* 计算某个范围内, 在某些层级上的节点数量
					*/
				get_node_number: function (rangeStart, rangeEnd, barcodeNodeAttrArray) {
						var self = this
						var nodeNumber = 0
						var currentLevel = Variables.get('currentLevel')
						for (var bI = rangeStart; bI <= rangeEnd; bI++) {
								if ((barcodeNodeAttrArray[bI].existed) && (barcodeNodeAttrArray[bI].depth < currentLevel)) {
										nodeNumber = nodeNumber + 1
								}
						}
						return nodeNumber
				}
				,
				get_sum_attr_value: function (rangeStart, rangeEnd, barcodeNodeAttrArray) {
						var self = this
						var sumValue = 0
						var maxDepth = Variables.get('maxDepth')
						for (var bI = rangeStart; bI <= rangeEnd; bI++) {
								if (barcodeNodeAttrArray[bI].existed) {
										if (barcodeNodeAttrArray[bI].depth === maxDepth) {
												sumValue = sumValue + barcodeNodeAttrArray[bI].num
										}
								}
						}
						return sumValue
				},

				/**
					* 获取排序的barcodeTree中的node的id
					*/
				get_sort_data_loc: function (sortingDataObj) {
						var self = this
						var barcodeSize = self.length
						var sortDataLocObj = {}
						if (barcodeSize > 0) {
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								//	如果当前不处于BarcodeTree_Split的状态, 那么直接寻找barcodeIndex为0的barcodeModel即可
								if (!BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split']) {
										var firstBarcodeModelFilterResult = self.where({barcodeIndex: 0})
										if (firstBarcodeModelFilterResult.length > 0) {
												var firstBarcodeModel = firstBarcodeModelFilterResult[0]
												sortDataLocObj = firstBarcodeModel.get_node_location(sortingDataObj.comparedNodeId)
										}
								} else {
										//	如果当前处于BarcodeTree_Split的状态, 寻找comparedNodeId对应的segment对应的barcodeTreeIndex为0的barcodeTree
										self.each(function (model) {
												var barcodeTreeSegmentIndex = model.get_segment_index(sortingDataObj.comparedNodeId)
												if (barcodeTreeSegmentIndex === 0) {
														sortDataLocObj = model.get_node_location(sortingDataObj.comparedNodeId)
														return false
												}
										})
								}
						}
						return sortDataLocObj
				},
				/**
					*  barcode节点之间的interval变化的响应函数
					*/
				change_barcode_interval: function () {
						var self = this
						//  首先按照当前的状态改变节点的属性值
						self.change_barcode_attr_array()
						self.update_barcode_node_attr_array()
						self.align_node_in_selected_list()
				}
				,
				/**
					*  barcode的节点变化的响应函数
					*/
				change_barcode_horizontal_attr: function () {
						var self = this
						//  首先按照当前的状态改变节点的属性值
						self.change_barcode_attr_array()
						self.update_barcode_node_attr_array()
						self.align_node_in_selected_list()
				}
				,
				/**
					*  首先根据变换得到的不同的属性值计算新的barcode attr array
					*/
				change_barcode_attr_array: function () {
						var self = this
						self.each(function (model) {
								model.change_barcode_attr_array()
								model.collapse_all_subtree()
						})
						self.updateBarcodeNodexMaxX()
				},
				trigger_update_barcode_view: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
				},
				/**
					* trigger信号更新superTree视图中的aligned icon
					*/
				trigger_update_superview_aligned_icon: function () {
						var self = this
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_ALIGNED_ICON'])
				}
				,
				/**
					* 触发关闭superTree视图的信号
					*/
				trigger_close_supertree_view: function () {
						var self = this
						Backbone.Events.trigger(Config.get('EVENTS')['CLOSE_SUPER_TREE'])
				}
				,
				/**
					* trigger 更新barcode位置的信号, 在barcode single view中进行更新
					* @param comparedNodeId
					*/
				trigger_barcode_loc: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_LOC'])
				}
				,
				/**
					* trigger信号 更新barcodeview的宽度
					*/
				trigger_barcode_view_width: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW_WIDTH'])
				}
				,
				/**
					*  trigger 更新barcode的summary的信号, 在barcode single view中进行更新
					*/
				trigger_update_summary: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_SUMMARY'])
				},
				/**
					* 更新brush选择的视图
					*/
				trigger_brush_selection_view: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BRUSH_SELECTION_VIEW'])
				},
				/**
					* 更新sortingModelUpdate变量, 从而更新sorting视图
					*/
				trigger_update_sorting_view: function (barcodeTreeId, nodeData) {
						if ((typeof (barcodeTreeId) !== 'undefined') && (typeof (nodeData) !== 'undefined')) {
								var sortingIconObj = {
										barcodeTreeId: barcodeTreeId,
										id: nodeData.id
								}
								Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_SORTING_VIEW'], {
										sortingIconObj: sortingIconObj
								})
						} else {
								Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_SORTING_VIEW'])
						}
				},
				/**
					* 在向barcode collection中增加了barcode model之后更新barcode view视图
					*/
				trigger_render_supertree: function (subtreeNodeArrayObj) {
						var self = this
						Backbone.Events.trigger(Config.get('EVENTS')['RENDER_SUPERTREE'])
				},
				//	更新filter筛选的节点
				trigger_filter_highlight_nodes: function () {
						var allHighlightObjArray = Variables.get('allHighlightObjArray')
						Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_FILTERING_HIGHLIGHT_NODES'], {
								highlightObjArray: allHighlightObjArray
						})
				},
				update_covered_rect_obj: function () {
						var self = this
						self.each(function (model) {
								model.update_covered_rect_obj(self.alignedNodeIdArray)
						})
				}
		})
})
