define([
		'require',
		'marionette',
		'underscore',
		'backbone',
		'd3',
		'config',
		'variables',
		'views/svg-base.addon'
], function (require, Mn, _, Backbone, d3, Config, Variables, SVGBase) {
		'use strict'
		/**
			* superTree视图的整体是一个冰柱图, 由不同层级的节点依次构成, 默认最上方时根节点, 根节点的长度是所有的BarcodeTree中的最宽的长度
			* superTree视图的设计有两个目的, 第一个是在对于barcodeTree中的没有对齐的状态下, 只是提供BarcodeTree进行数值比较的功能, 与BarcodeTree的节点数值比较相对应
			* focus并不是对齐比较, 在不focus到任何子树的情况下, 相当于focus到根节点的子树, focus到整体的子树或者整个树, 此时仅仅比较下一层子树的节点数目, 或者属性值数目
			* 在对齐节点进行比较的情况下, 就要具体的移动superTree中子树的根节点的位置, 移动到对应的位置上
			*/
		return Mn.ItemView.extend(_.extend({
				tagName: 'svg',
				template: false, //  for the itemview, we must define the template value false
				attributes: {
						style: 'width: 100%; height: 100%;',
						id: 'supertree-svg'
				},
				default: {
						barcodePaddingLeft: null,
						barcodeHeight: null,
						barcodeOriginalNodeHeight: Variables.get('barcodeHeight')
				},
				events: {},
				initialize: function () {
						var self = this
						self.initEventFunc()
						self.initParaFunc()
						self.initSuperTreeToggleLoc()
				},
				initEventFunc: function () {
						var self = this
						self.listenTo(Variables, 'change:hoveringBarcodeTreeNode', self.find_highlight_related_node)
						Backbone.Events.on(Config.get('EVENTS')['OPEN_SUPER_TREE'], function () {
								self.open_supertree_view()
						})
						Backbone.Events.on(Config.get('EVENTS')['CLOSE_SUPER_TREE'], function () {
								self.close_supertree_view()
								//  在关闭superTree视图的时候需要清空所有的参数设置
								//  清空barcode collection中的tablelens数组
								var barcodeCollection = self.options.barcodeCollection
								barcodeCollection.clear_tablelens_array()
						})
						Backbone.Events.on(Config.get('EVENTS')['RENDER_SUPERTREE'], function () {
								self.draw_super_tree()
						})
						//  取消mouseover的高亮效果
						Backbone.Events.on(Config.get('EVENTS')['NODE_MOUSEOUT'], function () {
								self.node_mouseout_handler()
						})
						//  清空所有的选择
						Backbone.Events.on(Config.get('EVENTS')['CLEAR_ALL'], function () {
								self.clear_all_supertree_elements()
								self.close_supertree_view()
						})
				},
				//	寻找选择的节点并且高亮
				find_highlight_related_node: function () {
						var hoveringBarcodeTreeNodeObj = Variables.get('hoveringBarcodeTreeNode')
						if (hoveringBarcodeTreeNodeObj == null) {
								d3.select('.default-highlight').classed('default-highlight', false)
						} else {
								var nodeId = hoveringBarcodeTreeNodeObj.id
								if (typeof (nodeId) !== 'undefined') {
										d3.select('.supertree-icicle-node#' + nodeId).classed('default-highlight', true)
								}
						}
				},
				trigger_higlight_all_selected_nodes: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['HIGHLIGHT_ALL_SELECTED_NODE_SUPERTREEVIEW'])
				},
				initParaFunc: function () {
						var self = this
						var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
						var barcodePaddingLeft = Variables.get('barcodePaddingLeft')
						self.barcodePaddingLeft = barcodeTextPaddingLeft + barcodePaddingLeft
				},
				initSuperTreeToggleLoc: function () {
						var self = this
						console.log('initSuperTreeToggleLoc')
						var histogramHeightRem = Variables.get('histogramHeightRem')
						var toolbarViewDivHeight = +$('#toolbar-view-div').height()
						var histogramViewHeight = +$('#histogram-view').height()
						var topToolbarViewHeight = +$('#top-toolbar-container').height()
						$('#supertree-view-toggle').css('top', (toolbarViewDivHeight + histogramViewHeight + topToolbarViewHeight) + 'px')
				},
				//  清空superTree视图中的所有元素
				clear_all_supertree_elements: function () {
						var self = this
						self.d3el.select('.level-g').remove()
				},
				node_mouseout_handler: function () {
						var self = this
						self.d3el.selectAll('.unhighlight')
								.classed('unhighlight', false)
						self.d3el.selectAll('.children-highlight')
								.style('fill', null)
						self.d3el.selectAll('.children-highlight')
								.classed('children-highlight', false)
						self.d3el.selectAll('.father-highlight')
								.style('fill', null)
						self.d3el.selectAll('.father-highlight')
								.classed('father-highlight', false)
						self.d3el.selectAll('.selection-sibling-highlight')
								.classed('selection-sibling-highlight', false)
				},
				//  取消所有节点的高亮, 恢复到最原始的状态
				cancel_selection_highlight: function () {
						var self = this
						self.d3el.selectAll('.selection-unhighlight')
								.classed('selection-unhighlight', false)
						self.d3el.selectAll('.selection-highlight')
								.classed('selection-highlight', false)
								.style('fill', null)
						self.d3el.selectAll('.father-highlight')
								.classed('father-highlight', false)
								.style('fill', null)
						self.d3el.selectAll('.selection-sibling-highlight')
								.classed('selection-sibling-highlight', false)
				},
				selection_unhighlightNodes: function () {
						var self = this
						self.d3el.selectAll('.supertree-icicle-node').classed('selection-unhighlight', true)
				},
				//  高亮选择的后代的节点
				highlight_single_selection_node: function (nodeId, nodeDepth) {
						var self = this
						var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
						self.d3el.select('.supertree-icicle-node#' + nodeId)
								.classed('selection-highlight', true)
								.style('fill', barcodeNodeColorArray[nodeDepth])
						self.d3el.select('.supertree-icicle-node#' + nodeId)
								.classed('selection-sibling-highlight', false)
						self.d3el.select('.supertree-icicle-node#' + nodeId)
								.classed('selection-unhighlight', false)
						self.d3el.select('.supertree-icicle-node#' + nodeId)
								.classed('unhighlight', false)
				}
				,
				//  高亮选择的兄弟节点
				highlight_single_sibling_node: function (nodeId, nodeDepth) {
						var self = this
						if (!self.d3el.select('.supertree-icicle-node#' + nodeId).empty()) {
								if (!self.d3el.select('.supertree-icicle-node#' + nodeId).classed('selection-highlight')) {
										self.d3el.select('.supertree-icicle-node#' + nodeId)
												.classed('selection-sibling-highlight', true)
										self.d3el.select('.supertree-icicle-node#' + nodeId)
												.classed('selection-unhighlight', false)
								}
						}
				},
				/**
					* 根据其他视图传动的节点对象,找到在该视图中的节点
					* @param 其他视图传递的节点对象
					* @returns 在该视图中找到的节点对象, 如果没有找到则返回null
					*/
				findCurrentNodeObj: function (nodeObj) {
						var self = this
						var treeDataModel = self.get_super_tree_data_model()
						var barcodeNodeAttrArray = self.get_barcode_node_array()
						var alignedRangeObjArray = self.get_aligned_range_array()
						var paddingNodeObjArray = self.get_padding_node_array()
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if ((barcodeNodeAttrArray[bI].depth === nodeObj.depth) && (barcodeNodeAttrArray[bI].id === nodeObj.id) && (barcodeNodeAttrArray[bI].existed) && (self.isBelongAligned(bI, alignedRangeObjArray, paddingNodeObjArray))) {
										return barcodeNodeAttrArray[bI]
								}
						}
						return null
				},
				onShow: function () {
						var self = this
						var barcodeHeight = Variables.get('superTreeHeight')
						self.barcodeHeight = barcodeHeight
						var barcodePaddingGap = 8
						self.barcodePaddingGap = barcodePaddingGap
						var barcodePaddingTop = barcodeHeight * 0.4
						self.barcodePaddingTop = barcodePaddingTop
						var barcodeNodeHeight = barcodeHeight * 0.6 - barcodePaddingGap
						self.barcodeNodeHeight = barcodeNodeHeight
						var barcodePaddingLeft = self.barcodePaddingLeft
						var superTreeWidth = $('#supertree-scroll-panel').width()
						self.d3el.append('rect')
								.attr('class', 'container-bg')
								.attr('id', 'container-bg')
								.attr('width', superTreeWidth)
								.attr('height', self.barcodeHeight)
								.on('mouseover', function (d, i) {
								})
						var tip = window.tip
						self.d3el.call(tip)
						self.barcodeContainer = self.d3el.append('g')
								.attr('transform', 'translate(' + barcodePaddingLeft + ',' + 0 + ')') // transformY (barcodePaddingTop + barcodePaddingGap / 2)
								.attr('id', 'barcode-container')
				},
				//  根据当前focus的子树决定子树的层级, 在superTree中增加的节点
				update_supertree_height: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var alignedNodeObjArray = barcodeCollection.get_aligned_subtree()
						var maxDepth = 0
						for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
								if (alignedNodeObjArray[aI].alignedNodeLevel > maxDepth) {
										maxDepth = alignedNodeObjArray[aI].alignedNodeLevel
								}
						}
						//  如果maxDepth是1, 说明focus到了第一层, 那么应该在上面存在一个根节点层, 在下面存在一个subtree层
						//  增加两个1是因为自然的maxDepth少一层, 再加一个1是因为maxDepth后面还需要扩展一层
						maxDepth = maxDepth + 1 + 1
						var selectedLevels = Variables.get('selectedLevels')
						var maxSelectedLevel = selectedLevels.max()
						maxDepth = maxDepth > maxSelectedLevel ? maxSelectedLevel : maxDepth
						self._change_supertreeview_height(maxDepth)
				},
				//  改变supertree视图的高度
				_change_supertreeview_height: function (maxDepth) {
						var self = this
						var superTreeVisibleHeight = Variables.get('superTreeHeight')
						var levelHeight = superTreeVisibleHeight / 2
						d3.select('#supertree-svg').attr('height', levelHeight * maxDepth)
						d3.select('#supertree-svg').select('#container-bg').attr('height', levelHeight * maxDepth)
						$('#supertree-view').height(levelHeight * maxDepth)
				},
				//  计算在不同层级上的aligned节点
				get_aligned_nodes_different_level: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var treeDataModel = self.get_super_tree_data_model()
						if (typeof (treeDataModel) === 'undefined') {
								return
						}
						var alignedNodeObjArray = barcodeCollection.get_aligned_subtree()
						var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
						//  所有对齐部分的节点数组
						var allAlignedNodesArray = []
						//  首先在superTree中一定存在根节点作为对齐的节点, 所以将根节点作为对象push
						if (barcodeNodeAttrArray.length > 0) {
								var alignedNodeObj = JSON.parse(JSON.stringify(barcodeNodeAttrArray[0]))
								allAlignedNodesArray.push(alignedNodeObj)
						}
						//  如果当前的状态不是全局对齐的状态, 而是用户选择子树部分进行对齐的状态
						if (Variables.get('displayMode') !== Config.get('CONSTANT').GLOBAL) {
								for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
										var alignedNodeObj = alignedNodeObjArray[aI]
										alignedNodeObj.id = alignedNodeObj.alignedNodeId
										alignedNodeObj.depth = alignedNodeObj.alignedNodeLevel
										//  找到该节点alignedNodeObj的所有父亲节点以及当前的节点
										var fatherNodeArray = barcodeCollection.find_all_father_current_nodes(alignedNodeObj)
										//  对于fatherNodeArray数组进行遍历
										for (var fI = 0; fI < fatherNodeArray.length; fI++) {
												var fatherNode = JSON.parse(JSON.stringify(fatherNodeArray[fI]))
												if (!is_exist(fatherNode, allAlignedNodesArray)) {
														allAlignedNodesArray.push(fatherNode)
												}
										}
								}
						}
						//  构建allAlignedNodesObj, 按照层次进行划分, 不同层级的为不同的属性
						var allAlignedNodesObj = {}
						for (var aI = 0; aI < allAlignedNodesArray.length; aI++) {
								var nodeDepth = allAlignedNodesArray[aI].depth
								if (typeof (allAlignedNodesObj[nodeDepth]) === 'undefined') {
										allAlignedNodesObj[nodeDepth] = []
								}
								allAlignedNodesObj[nodeDepth].push(allAlignedNodesArray[aI])
						}
						return allAlignedNodesObj
						//  输入nodeObj对象以及alignNodesArray数组, 判断对象是否在数组中是否存在
						function is_exist(nodeObj, alignedNodesArray) {
								var existState = false
								for (var aI = 0; aI < alignedNodesArray.length; aI++) {
										if (nodeObj.id === alignedNodesArray[aI].id) {
												existState = true
												break
										}
								}
								return existState
						}
				},
				//  鼠标移开barcdoeTree中节点的响应函数
				node_mouseout_highlight: function () {
						d3.selectAll('.default-highlight').classed('default-highlight', false)
						Variables.set('hoveringBarcodeTreeNode', null)
				},
				//  鼠标放置到barcdoeTree中节点的响应函数
				node_mouseover_highlight: function (self, nodeId) {
						var barcodeCollection = self.options.barcodeCollection
						var nodeObjResults = barcodeCollection.get_node_obj_by_id(nodeId)
						Variables.set('hoveringBarcodeTreeNode', nodeObjResults.nodeObj)
				},
				//  依次计算每一层的节点的位置并且进行渲染
				append_supernodes_different_level: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var treeDataModel = self.get_super_tree_data_model()
						var superTreeVisibleHeight = Variables.get('superTreeHeight')
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var levelNodeHeight = superTreeVisibleHeight / 2
						//  获取得到对齐部分的节点对象
						var allAlignedNodesObj = self.get_aligned_nodes_different_level()
						var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
						//  在global的模式下并且当前用户选择了focus的子树, 那么需要对于增加的冰柱图的节点进行筛选
						var maxLevel = 0
						var selectedLevels = Variables.get('selectedLevels')
						var maxSelectedLevel = selectedLevels.max()
						for (var item in allAlignedNodesObj) {
								var level = +item
								if (level > maxLevel) {
										maxLevel = level
								}
						}
						self.d3el.select('#barcode-container').selectAll('.level-g').remove()
						var alignedLevel = Variables.get('alignedLevel')
						for (var item in allAlignedNodesObj) {
								var alignedNodeArray = allAlignedNodesObj[item]
								item = +item
								for (var aI = 0; aI < alignedNodeArray.length; aI++) {
										var fatherNodeArray = barcodeCollection.find_all_father_current_nodes(alignedNodeArray[aI])
										for (var fI = 0; fI < fatherNodeArray.length; fI++) {
												var nodeId = fatherNodeArray[fI].id
												var nodeDepth = fatherNodeArray[fI].depth
												append_icicle(nodeDepth, nodeId, levelNodeHeight, fatherNodeArray[fI])
												if (nodeDepth === maxLevel) {
														//  如果当前是点击选择的节点的下一层节点
														var underLevel = maxLevel + 1
														if (underLevel < maxSelectedLevel) {
																//  对于aligned节点的下层节点也需要进行区别, 如果是已经对齐的层, 那么也是准确的icice plot的节点, 否则是icicle plot中的成比例的节点
																//  判断aligned level是否align到当前的层级, 即underLevel
																if (alignedLevel < underLevel) {
																		//  如果没有align到当前的层级, 那么就在underLevel层级下面增加表示比例的proportion icicle
																		append_proportion_icicle(underLevel, nodeId, levelNodeHeight, fatherNodeArray[fI])
																} else {
																		//  如果align到当前的层级, 那么就在underLevel层级下面增加表示范围的certain icicle
																		append_certain_icicle(underLevel, nodeId, levelNodeHeight, fatherNodeArray[fI])
																}
														}
												}
										}
								}
						}
						if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
								var maxLevel = 0
								var tablelensNodesIdArray = barcodeCollection.get_tablelens_nodes_id()
								for (var tI = 0; tI < tablelensNodesIdArray.length; tI++) {
										var nodeId = tablelensNodesIdArray[tI]
										var nodeObj = treeDataModel.get_node_obj_from_id(nodeId)
										var underLevel = nodeObj.depth + 1
										maxLevel = maxLevel > underLevel ? maxLevel : underLevel
								}
								if (tablelensNodesIdArray.length !== 0) {
										self._change_supertreeview_height(maxLevel + 1)
										//  对于global模式下的barcode, 需要确定下一层的barcode节点是tablelens的节点, 并且节点的大小和位置的确定方式是准确的
										for (var tI = 0; tI < tablelensNodesIdArray.length; tI++) {
												var fatherNodeArray = barcodeCollection.find_all_father_current_nodes(nodeObj)
												for (var fI = 0; fI < fatherNodeArray.length; fI++) {
														var nodeId = fatherNodeArray[fI].id
														// var nodeObj = treeDataModel.get_node_obj_from_id(nodeId)
														var underLevel = fatherNodeArray[fI].depth + 1
														append_certain_icicle(underLevel, nodeId, levelNodeHeight, fatherNodeArray[fI])
												}
										}
								}
						}
						//  在superTree视图中增加冰柱图的每一层
						function append_icicle(node_level, node_id, level_node_height, alignedNodeObj) {
								init_icicle_level_g(node_level, level_node_height)
								//  计算最大的BarcodeTree的width大小
								var icicleNodeObject = barcodeCollection.get_max_barcode_node_width(node_id, node_level, alignedNodeObj)
								var icicleNodeX = icicleNodeObject.x
								var icicleNodeWidth = icicleNodeObject.width
								if (icicleNodeWidth < 0) {
								}
								if (self.d3el.select('#barcode-container').select('#level-' + node_level).select('#' + node_id).empty()) {
										self.d3el.select('#barcode-container')
												.select('#level-' + node_level)
												.append('rect')
												.attr('id', node_id)
												.attr('class', 'supertree-icicle-node')
												.attr('x', icicleNodeX)
												.attr('y', 0)
												.attr('height', level_node_height)
												.attr('width', icicleNodeWidth)
												.on('mouseover', function (d, i) {
														var nodeId = d3.select(this).attr('id')
														// var nodeObject = treeDataModel.get_node_obj_from_id(nodeId)
														// d3.select(this).classed('default-highlight', true)
														// var nodeObjResults = barcodeCollection.get_node_obj_by_id(nodeId)
														// Variables.set('hoveringBarcodeTreeNode', nodeObjResults.nodeObj)
														self.node_mouseover_highlight(self, nodeId)
												})
												.on('mouseout', function (d, i) {
														self.node_mouseout_highlight()
												})
								} else {
										self.d3el.select('#barcode-container')
												.select('#level-' + node_level)
												.select('#' + node_id)
												.attr('x', icicleNodeX)
												.attr('y', 0)
												.attr('height', level_node_height)
												.attr('width', icicleNodeWidth)
								}
								return icicleNodeObject
						}

						//  在focus层级的barcodeTree下增加不确定的一层, 在这种模式下不能完全对应, 但是可以反映出不同类型的子树所占的比例
						function append_proportion_icicle(node_level, node_id, level_node_height, aligned_node_obj) {
								var nodeUpperLevel = node_level - 1
								var upperLevelIcicleNodeObject = barcodeCollection.get_max_barcode_node_width(node_id, nodeUpperLevel, aligned_node_obj)
								var upperLevelIcicleNodeX = upperLevelIcicleNodeObject.x
								var upperLevelIcicleNodeWidth = upperLevelIcicleNodeObject.width
								var globalAlignedNodeIdArray = barcodeCollection.get_global_aligned_nodeid_array()
								var filterMode = ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) && (BarcodeGlobalSetting['Subtree_Compact']) && (globalAlignedNodeIdArray.length !== 0))
								//  计算得到不同的subtree所占的比例, 如果是在attribute的状态下, 得到的是属性值的比例, 在topology的状态下, 得到的是节点数目的比例
								var barcodeSubtreeProportionArray = barcodeCollection.get_barcode_proportion(node_id)
								for (var bI = 0; bI < barcodeSubtreeProportionArray.length; bI++) {
										barcodeSubtreeProportionArray[bI].width = barcodeSubtreeProportionArray[bI].proportion * upperLevelIcicleNodeWidth
								}
								init_icicle_level_g(node_level, level_node_height)
								//  计算最大的BarcodeTree的width大小
								var proportionIcicleNodes = self.d3el.select('#barcode-container')
										.select('#level-' + node_level)
										.selectAll('.supertree-node-father-' + node_id)
										.data(barcodeSubtreeProportionArray.filter(function (d, i) {
												return ((filterMode && (globalAlignedNodeIdArray.indexOf(d.id) !== -1)) || (!filterMode))
										}), function (d, i) {
												return d.id
										})
								//  在非对齐情况下, 在icicle的视图中增加icicle的节点
								proportionIcicleNodes.enter()
										.append('rect')
										.attr('class', 'supertree-icicle-node ' + 'supertree-node-father-' + node_id)
										.attr('id', function (d, i) {
												return d.id
										})
										.attr('x', function (d, i) {
												return upperLevelIcicleNodeX + upperLevelIcicleNodeWidth * d.aggregatedProportion
										})
										.attr('y', 0)
										.attr('height', level_node_height)
										.attr('width', function (d, i) {
												return upperLevelIcicleNodeWidth * d.proportion
										})
										.on('mouseover', function (d, i) {
												var nodeId = d3.select(this).attr('id')
												console.log('nodeId', nodeId)
												self.node_mouseover_highlight(self, nodeId)
										})
										.on('mouseout', function (d, i) {
												self.node_mouseout_highlight()
										})
								//  在非对齐情况下, 更新在icicle的视图中的icicle的节点
								proportionIcicleNodes
										.attr('x', function (d, i) {
												return upperLevelIcicleNodeX + upperLevelIcicleNodeWidth * d.aggregatedProportion
										})
										.attr('y', 0)
										.attr('height', level_node_height)
										.attr('width', function (d, i) {
												return upperLevelIcicleNodeWidth * d.proportion
										})
								//  在非对齐情况下, 删除在icicle的视图中的多余icicle的节点
								proportionIcicleNodes.exit().remove()
						}

						//  在focus层级的barcodeTree下增加确定的一层, 这种模式下的节点可以完全对应, 所有节点的最大的范围上增加superTree上的节点
						function append_certain_icicle(node_level, node_id, level_node_height, aligned_node_obj) {
								init_icicle_level_g(node_level, level_node_height)
								//  计算得到不同的subtree所占的比例, 如果是在attribute的状态下, 得到的是属性值的比例, 在topology的状态下, 得到的是节点数目的比例
								var barcodeDetailedSubtreeArray = barcodeCollection.get_barcode_detailed_subtree(node_id, node_level)
								var globalAlignedNodeIdArray = barcodeCollection.get_global_aligned_nodeid_array()
								var filterMode = ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) && (BarcodeGlobalSetting['Subtree_Compact']) && (globalAlignedNodeIdArray.length !== 0))
								var certainIcicleNodes = self.d3el.select('#barcode-container')
										.select('#level-' + node_level)
										.selectAll('.supertree-node-father-' + node_id)
										.data(barcodeDetailedSubtreeArray.filter(function (d, i) {
												return ((filterMode && (globalAlignedNodeIdArray.indexOf(d.id) !== -1)) || (!filterMode))
										}), function (d, i) {
												return d.id
										})
								//  在非对齐情况下, 在icicle的视图中增加icicle的节点
								certainIcicleNodes.enter()
										.append('rect')
										.attr('class', 'supertree-icicle-node ' + 'supertree-node-father-' + node_id)
										.attr('id', function (d, i) {
												return d.id
										})
										.attr('x', function (d, i) {
												return d.subtreeStartX
										})
										.attr('y', 0)
										.attr('height', level_node_height)
										.attr('width', function (d, i) {
												var certainIcicleNodeWidth = 0
												if ((d.subtreeEndX - d.subtreeStartX) >= 0) {
														certainIcicleNodeWidth = d.subtreeEndX - d.subtreeStartX
												}
												return certainIcicleNodeWidth
										})
										.on('mouseover', function (d, i) {
												console.log('d.id', d.id)
												self.node_mouseover_highlight(self, d.id)
										})
										.on('mouseout', function (d, i) {
												self.node_mouseout_highlight()
										})
								//  在非对齐情况下, 更新在icicle的视图中的icicle的节点
								certainIcicleNodes
										.attr('x', function (d, i) {
												return d.subtreeStartX
										})
										.attr('y', 0)
										.attr('height', level_node_height)
										.attr('width', function (d, i) {
												var certainIcicleNodeWidth = 0
												if ((d.subtreeEndX - d.subtreeStartX) >= 0) {
														certainIcicleNodeWidth = d.subtreeEndX - d.subtreeStartX
												}
												return certainIcicleNodeWidth
										})
								//  在非对齐情况下, 删除在icicle的视图中的多余icicle的节点
								certainIcicleNodes.exit().remove()
						}

						//  初始化绘制icicle plot每一层节点的g
						function init_icicle_level_g(node_level, level_node_height) {
								var translateX = 0
								if (self.d3el.select('#barcode-container').select('g#level-' + node_level).empty()) {
										self.d3el.select('#barcode-container')
												.append('g')
												.attr('id', 'level-' + node_level)
												.attr('class', 'level-g')
												.attr('transform', 'translate(' + translateX + ',' + level_node_height * node_level + ')')
								}
						}
				},
				add_single_category_text: function () {
						var self = this
						var barcodeHeight = self.barcodeHeight
						var barcodeCollection = self.options.barcodeCollection
						var treeDataModel = self.get_super_tree_data_model()
						if (typeof (treeDataModel) === 'undefined') {
								return
						}
						var barcodeTreeId = treeDataModel.get('barcodeTreeId')
						var barcodePaddingTop = self.barcodePaddingTop
						var barcodePaddingLeft = self.barcodePaddingLeft
						var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
						var filteredAlignedElement = self.filtered_aligned_element()
						var barcodeCategoryHeight = 0
						if ((filteredAlignedElement.length === 0) || (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL)) {
								barcodeCategoryHeight = barcodeHeight
						} else {
								barcodeCategoryHeight = barcodePaddingTop
						}
						var tip = window.tip
						self.d3el.selectAll('.category-text').remove()
						d3.selectAll('.supertree-icicle-node')
								.each(function (d, i) {
										var rectX = +d3.select(this).attr('x')
										var rectWidth = +d3.select(this).attr('width')
										var rectY = +d3.select(this).attr('y')
										var rectHeight = +d3.select(this).attr('height')
										var rectId = d3.select(this).attr('id')
										var parentNodeId = d3.select(this.parentNode).attr('id')
										var level = parentNodeId.replace('level-', '')
										var nodeObject = treeDataModel.get_node_obj_from_id(rectId)
										if (typeof (nodeObject) !== 'undefined') {
												nodeObject.textWidth = rectWidth
										}
										d3.select(this.parentNode).select('.category-text#' + rectId).remove()
										d3.select(this.parentNode)
												.append("text")
												.attr('class', 'category-text')
												.attr('id', rectId)
												.attr("x", rectX + rectWidth / 2)
												.attr("y", rectY + rectHeight / 2)
												.attr("font-family", "FontAwesome")
												.attr('text-anchor', 'middle')
												.attr('alignment-baseline', 'middle')
												.text(function () {
														return textAbbr(nodeObject)
												})
												.style('cursor', 'pointer')
												.style('font-size', (rectHeight / 2) + 'px')
												.on('mouseover', function (d, i) {
														var thisObjId = d3.select(this).attr('id')
														console.log('thisObjId', thisObjId)
														self.node_mouseover_highlight(self, thisObjId)
														d3.select('rect#' + thisObjId).classed('mouseover-highlight', true)
														var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + nodeObject.categoryName + "</span></span>"
														if (nodeObject.categoryName !== textAbbr(nodeObject)) {
																tip.show(tipValue)
														}
												})
												.on('mouseout', function (d, i) {
														tip.hide()
														self.node_mouseout_highlight()
												})
								})
						function textAbbr(nodeObj) {
								if (typeof (nodeObj) !== 'undefined') {
										var category_name = nodeObj.categoryName
										var textWidth = nodeObj.textWidth
										var singleTextWidth = window.rem_px
										var textNum = Math.round(textWidth / singleTextWidth)
										var remainedWidth = textWidth - textNum * singleTextWidth
										if (typeof (category_name) !== 'undefined') {
												if (category_name.length > textNum) {
														var categoryName = category_name.substring(0, textNum)
														if (remainedWidth > singleTextWidth) {
																categoryName = categoryName + '...'
														} else {
																categoryName = categoryName + '.'
														}
														return categoryName
												} else {
														return category_name
												}
										}
								} else {
										return ''
								}

						}
				},
				/**
					* 打开supertree视图
					*/
				open_supertree_view: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						Variables.set('superTreeViewState', true)
						var superTreeHeight = Variables.get('superTreeHeight')
						var barcodeTreeConfigHeight = $('#top-toolbar-container').height()
						var histogramHeightRem = Variables.get('histogramHeightRem')
						$('#supertree-scroll-panel').css('top', '0px')
						$('#supertree-scroll-panel').css('height', superTreeHeight + 'px')
						var toolbarViewDivHeight = +$('#toolbar-view-div').height()
						var histogramViewHeight = +$('#histogram-view').height()
						$('#sorting-scroll-panel').css('top', (superTreeHeight) + 'px')
						var sortingPanelHeight = $('#sorting-scroll-panel').height()
						$('#supertree-view-toggle').css('top', (toolbarViewDivHeight + histogramViewHeight + barcodeTreeConfigHeight + superTreeHeight) + 'px')
						var barcodeTreeScrollPanelTop = superTreeHeight + sortingPanelHeight
						$('#barcodetree-scrollpanel').css('top', barcodeTreeScrollPanelTop + 'px')
						//	修改brush scroll的视图的top坐标
						$('#brush-scroll-view').css('top', (barcodeTreeScrollPanelTop + barcodeTreeConfigHeight) + 'px')
						window.Variables.update_barcode_attr()
						barcodeCollection.change_layout_mode()
						//  更新在具有attribute的情况下的barcode节点高度
						barcodeCollection.update_attribute_height()
						self.update_supertree_height()
				},
				/**
					* 关闭superTree视图
					*/
				close_supertree_view: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						Variables.set('superTreeViewState', false)
						var superTreeHeight = Variables.get('superTreeHeight')
						var barcodeTreeConfigHeight = +$('#top-toolbar-container').height()
						var histogramHeightRem = Variables.get('histogramHeightRem')
						var toolbarViewDivHeight = +$('#toolbar-view-div').height()
						var histogramViewHeight = +$('#histogram-view').height()
						$('#supertree-scroll-panel').css('height', '0px')
						$('#sorting-scroll-panel').css('top', '0px')
						var sortingPanelHeight = $('#sorting-scroll-panel').height()
						$('#supertree-view-toggle').css('top', (toolbarViewDivHeight + histogramViewHeight + barcodeTreeConfigHeight) + 'px')
						$('#barcodetree-scrollpanel').css('top', sortingPanelHeight + 'px')
						$('#supertree-scroll-panel').css('height', '0px')
						//	修改brush scroll的视图的top坐标
						var sortingScrollPanelHeight = $('#sorting-scroll-panel').height()
						//	根据当前的superTree视图的高度决定scroll视图中scroll的位置
						var currentSuperTreeViewHeight = $('#supertree-scroll-panel').height()
						$('#brush-scroll-view').css('top', (currentSuperTreeViewHeight + barcodeTreeConfigHeight + sortingPanelHeight) + 'px')
						window.Variables.update_barcode_attr()
						barcodeCollection.change_layout_mode()
						barcodeCollection.update_attribute_height()
						self.update_supertree_height()
				},
				/**
					* 绘制superTree
					*/
				draw_super_tree: function () {
						var self = this
						self.update_supertree_height()
						self.append_supernodes_different_level()
						self.add_single_category_text()
				},
				//  过滤得到所有在superTree视图中绘制出来的对象
				filtered_aligned_element: function () {
						var self = this
						var filteredArray = []
						var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
						var alignedRangeObjArray = self.get_super_tree_aligned_range_obj()
						for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
								if ((barcodeNodeAttrArray[bI].depth < 4) && (self.isBelongAligned(bI, alignedRangeObjArray)) && (barcodeNodeAttrArray[bI].id !== 'node-0-root')) {
										filteredArray.push(barcodeNodeAttrArray[bI])
								}
						}
						return filteredArray
				},
				/**
					* 点击barcode收缩时先判断动画是否结束
					* @param transition
					* @param callback
					*/
				endall: function (transition, callback) {
						if (transition.size() === 0) {
								callback()
						}
						var n = 0;
						transition
								.each(function () {
										++n;
								})
								.each("end", function () {
										if (!--n) callback.apply(this, arguments);
								});
				}
				,
				/**
					* 判断节点是否是aligned范围, 如果属于aligned范围, 那么绘制节点; 否则这些节点不会被绘制
					* @param nodeIndex
					* @returns {boolean}
					*/
				isBelongAligned: function (nodeIndex, alignedRangeObjArray) {
						if (alignedRangeObjArray.length === 0) {
								return false
						} else {
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										var rangeStartNodeIndex = alignedRangeObjArray[aI].rangeStartNodeIndex
										var rangeEndNodeIndex = alignedRangeObjArray[aI].rangeEndNodeIndex
										if ((nodeIndex >= rangeStartNodeIndex) && (nodeIndex <= rangeEndNodeIndex)) {
												return true
										}
								}
						}
						return false
				}
				,
				// 获取supertree视图中的barcodeNodeArray的节点
				get_super_tree_barcode_node_array: function () {
						var self = this
						var barcodeNodeAttrArray = []
						var treeDataModel = self.get_super_tree_data_model()
						if (typeof (treeDataModel) === 'undefined') {
								return barcodeNodeAttrArray
						}
						if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
								//  切换到原始的barcodeTree的compact的显示模式
								var compactBarcodeNodeAttrArrayObj = treeDataModel.get('compactBarcodeNodeAttrArrayObj')
								barcodeNodeAttrArray = compactBarcodeNodeAttrArrayObj['compact-0']
						} else if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
								//  切换到原始的barcodeTree的显示模式
								barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
						}
						return barcodeNodeAttrArray
				}
				,
				//  获取supertree视图中的align的节点
				get_super_tree_aligned_range_obj: function () {
						var self = this
						var alignedRangeObjArray = []
						var treeDataModel = self.get_super_tree_data_model()
						if (typeof (treeDataModel) === 'undefined') {
								return alignedRangeObjArray
						}
						alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
						return alignedRangeObjArray
				}
				,
				//  获取supertree视图中的data model
				get_super_tree_data_model: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var selectItemNameArray = Variables.get('selectItemNameArray')
						var treeDataModel = barcodeCollection.where({barcodeIndex: 0})[0]
						return treeDataModel
				}
				,
				fill_style_handler: function (d, i) {
						var self = this
						var nodeNum = self.get_node_number(d.paddingNodeStartIndex, d.paddingNodeEndIndex)
						var maxLeveledNumArray = Variables.get('maxLeveledNumArray')
						var partition = maxLeveledNumArray[4] / 6
						var styleIndex = Math.ceil(nodeNum / partition + 1)
						return "url(#diagonal-stripe-" + styleIndex + ")"
				}
				,
				// 计算某个范围内, 在某些层级上的节点数量
				get_node_number: function (rangeStart, rangeEnd) {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var selectItemNameArray = Variables.get('selectItemNameArray')
						var treeDataModel = barcodeCollection.where({barcodeTreeId: selectItemNameArray[0]})[0]
						var nodeNumber = 0
						var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
						for (var bI = rangeStart; bI <= rangeEnd; bI++) {
								if ((barcodeNodeAttrArray[bI].existed) && (barcodeNodeAttrArray[bI].depth < 4)) {
										nodeNumber = nodeNumber + 1
								}
						}
						return nodeNumber
				}
				,
				get_class_name: function (classNameArray) {
						var className = ''
						for (var cI = 0; cI < classNameArray.length; cI++) {
								className = className + ' ' + classNameArray[cI]
						}
						return className
				}
		}, SVGBase))
})
