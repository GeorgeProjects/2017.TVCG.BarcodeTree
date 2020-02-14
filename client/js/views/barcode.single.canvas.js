define([
		'require',
		'marionette',
		'underscore',
		'backbone',
		'config',
		'jquery',
		'jquery-ui',
		'd3',
		'variables',
		'views/svg-base.addon'
], function (require, Mn, _, Backbone, Config, $, JqueryUI, d3, Variables, SVGBase) {
		'use strict'

		return Mn.ItemView.extend(_.extend({
						tagName: 'div',
						template: false,
						attributes: {
								'class': 'barcode-single-tree-div',
								// 'style': 'top: 500px; height: 180px; width: 300px'
						},
						initialize: function () {
								var self = this
								self.init_event()
								self.init_paras()
						},
						init_event: function () {
								var self = this
								self.listenTo(self.model, 'change:barcodeTreeYLocation', self.render_barcodetree_container)
								//	监听barcodeTree视图的高度与宽度的变化
								self.listenTo(Variables, 'change:barcodeNodexMaxX', self.update_barcode_view_width)
								self.listenTo(Variables, 'change:barcodeNodeyMaxY', self.update_barcode_view_height)
								self.listenTo(Variables, 'change:hoveringBarcodeTreeNode', self.find_highlight_related_node)
								self.listenTo(Variables, 'change:barcodeTreeSelectionUpdate', self.update_draw_all_selection_nodes)
								self.listenTo(Variables, 'change:barcodeHeight', self.update_barcodetree_view_height)
								self.listenTo(Variables, 'change:selectedBarcodeTreeArray change:filterBarcodeTreeIdArray', self.highlight_selection_tree_label)
								Backbone.Events.on(Config.get('EVENTS')['REMOVE_ALL_LABELS_NODES'], function (event) {
										var nodeObjId = event.nodeObjId
										self.remove_box_clicked_tree_labels(nodeObjId)
										self.remove_box_clicked_tree_nodes(nodeObjId)
								})
								Backbone.Events.on(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'], function (event) {
										self.render_barcodetree()
								})
								Backbone.Events.on(Config.get('EVENTS')['CLEAR_ALL'], function (event) {
										self.clear_selected_nodes()
								})
								Backbone.Events.on(Config.get('EVENTS')['UPDATE_FILTERING_HIGHLIGHT_NODES'], function (event) {
										var filterHighlightObjArray = event.highlightObjArray
										self.filterHighlightObjArray = filterHighlightObjArray
										self.highlight_filter_node_obj()
								})
						},
						//	更新全部选择的节点
						update_draw_all_selection_nodes: function () {
								var self = this
								self.highlight_whole_selected_nodes()
								//	删除所有的label上的box并且重新绘制
								self.remove_all_tree_labels_box()
								self.add_box_clicked_tree_labels()
								//	删除所有的节点上的box并且重新绘制
								self.remove_all_tree_nodes_box()
								self.add_box_clicked_tree_nodes()
								self.layer.draw()
						},
						//  将鼠标hovering的barcode的id进行广播
						trigger_hovering_barcodetree_event: function (barcodeTreeId) {
								var self = this
								Backbone.Events.trigger(Config.get('EVENTS')['HOVERING_BARCODE_EVENT'], {
										'barcodeTreeId': barcodeTreeId
								})
						},
						//  鼠标离开histogram的bar上, 可以取消对于barcode的高亮
						trigger_unhovering_barcodetree_event: function () {
								Backbone.Events.trigger(Config.get('EVENTS')['UN_HOVERING_BARCODE_EVENT'])
						},
						trigger_remove_all_clicked_tree_labels_nodes_box: function (nodeObjId) {
								Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_ALL_LABELS_NODES'], {
										nodeObjId: nodeObjId
								})
						},
						highlight_filter_node_obj: function () {
								var self = this
								var filterHighlightObjArray = self.filterHighlightObjArray
								var filterBarcodeTreeIdArray = []
								if (typeof (filterHighlightObjArray) !== 'undefined') {
										var barcodeTreeModel = self.model
										var barcodeTreeId = barcodeTreeModel.get('barcodeTreeId')
										var barcodeTreeIndex = barcodeTreeModel.get('originalBarcodeIndex')
										//	如果filter的节点数组为空, 那么恢复原始的节点选择的高亮状态
										if (filterHighlightObjArray == null) {
												//	清空所有选择节点的高亮
												self.refresh_all_barcode_node()
												//	高亮model中选择的节点, 存在两种高亮方式:
												// 1. 高亮删除或者新增的节点; 2. 高亮子树中的节点
												self.highlight_single_selected_nodes()
										} else {
												self.unhighlight_all_nodes()
												for (var fI = 0; fI < filterHighlightObjArray.length; fI++) {
														var filterHighlightObj = filterHighlightObjArray[fI]
														var treeId = filterHighlightObj.treeId
														var nodeId = filterHighlightObj.nodeId
														if (treeId === barcodeTreeId) {
																var thisNodeObj = barcodeTreeModel.get_node_obj_by_id(nodeId)
																self.highlight_current_nodes(thisNodeObj, barcodeTreeIndex)
														}
												}
										}
										self.layer.draw()
								}
						},
						/**
							* 更新barcodeTree视图的高度
							*/
						update_barcodetree_view_height: function () {
								var self = this
								var stage = self.stage
								stage.height(window.barcodeHeight)
								$(self.el).css('height', window.barcodeHeight + 'px')
						},
						render_barcodetree_container: function () {
								var self = this
								var barcodeTreeModel = self.model
								var barcodeTreeYLocation = barcodeTreeModel.get('barcodeTreeYLocation')
								var divTop = +$(this.el).position().top
								var distances = Math.abs(barcodeTreeYLocation - divTop)
								$(this.el).animate({
										top: barcodeTreeYLocation
								}, {
										duration: +distances * 2
								})
						},
						//	初始化视图中的参数
						init_paras: function () {
								var self = this
								var barcodeTreeModel = self.model
								var barcodeTreeId = barcodeTreeModel.get('barcodeTreeId')
								var barcodeTreeYLocation = barcodeTreeModel.get('barcodeTreeYLocation')
								//	barcodeTree的container的id
								self.thiselId = 'container-' + barcodeTreeId
								//	初始化其他的参数
								self.barcodeViewTop = +$('#top-toolbar-container').height() + $('#supertree-scroll-panel').height() + $('#sorting-scroll-panel').height()
								self.relatedHighlight = Variables.get('relatedHighlight')
								self.barcodeSiblingNodeOpacity = Variables.get('barcodeSiblingNodeOpacity')
								self.barcodeSiblingNodeColor = Variables.get('barcodeSiblingNodeColor')
								self.barcodeAddNodeColor = Variables.get('barcodeAddNodeColor')
								self.barcodeMissingNodeColor = Variables.get('barcodeMissingNodeColor')
								self.barcodeTreeLabelColor = Variables.get('barcodeTreeLabelColor')
								self.barcodeNodeColor = Variables.get('barcodeNodeColor')
								self.unHighlightColor = Variables.get('unHighlightColor')
								self.boxStrokeWidth = Variables.get('boxStrokeWidth')
								self.hoveringLineStrokeWidth = Variables.get('hoveringLineStrokeWidth')
								self.barcodeTreePaddingLeft = Variables.get('barcodePaddingLeft')
								self.barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
								self.barcodeTreeNodePaddingLeft = self.barcodeTreePaddingLeft + self.barcodeTextPaddingLeft
								self.hoverLineColor = Variables.get('hoverLineColor')
								self.collapseTriangleColor = Variables.get('collapseTriangleColor')
								self.tweenDuration = Variables.get('tweenDuration')
								self.barcodeTreeIdIndex = 2
								self.hoveringVerticalLineLength = window.barcodeHeight * 0.2
								self.rectObject = {}
								self.triangleObject = {}
								self.treeLabelObj = {}
								self.diagonalStripObject = {}
								self.selectedTreeNodeBoxObj = {}
								self.selectedTreeLabelBoxObj = {}
								self.nodeBoxLineName = 'node-box-line'
								self.labelBoxLineName = 'label-box-line'
								self.tooltipBgMargin = {top: 0, bottom: 6, left: 0, right: 8}
								self.barcodeNodeStrokeWidth = Variables.get('barcodeNodeStrokeWidth')
								self.filterHighlightObjArray = null
								//	设置这个itemview的id以及参数值top和height
								self.el.id = self.thiselId
								$(this.el).css('top', barcodeTreeYLocation + 'px')
								$(this.el).css('height', window.barcodeHeight + 'px')
						},
						//	更新视图的参数
						update_paras: function () {
								var self = this
								self.hoveringVerticalLineLength = window.barcodeHeight * 0.2
						},
						onShow: function () {
								var self = this
								var barcodeTreeModel = self.model
								var barcodeTreeId = barcodeTreeModel.get('barcodeTreeId')
								var width = $(this.el).width()
								var height = $(this.el).height()
								var stage = new Konva.Stage({
										container: self.thiselId,
										width: width,
										height: height
								})
								self.stage = stage
								var layer = new Konva.Layer()
								stage.add(layer)
								self.layer = layer
								var beginRenderTime = +new Date()
								if (barcodeTreeModel.get('render_added')) {
										self.render_barcodetree()
								}
								$(self.el).on('click', function (e) {
										//	在single view的这个层级对于点击的事件进行拦截, 使得这个事件不会传播到collectionView的视图
										e.originalEvent.cancelBubble = true
										e.stopPropagation()
								})
								var endRenderTime = +new Date()
						},
						//	更新barcodeTree中itemview视图中的参数width
						update_barcode_view_width: function () {
								var self = this
								var barcodeNodexMaxX = +Variables.get('barcodeNodexMaxX')
								var stage = self.stage
								$(self.el).css('width', barcodeNodexMaxX + 'px')
								stage.width(barcodeNodexMaxX)
						},
						//	更新barcodeTree中itemview视图中的参数height
						update_barcode_view_height: function () {
								var self = this
								var model = self.model
								// var barcodeNodeYMaxY = Variables.get('barcodeNodeyMaxY')
								var stage = self.stage
								stage.height(window.barcodeHeight)
								$(self.el).css('height', window.barcodeHeight + 'px')
								if (model.get('render_added')) {
										self.render_barcodetree()
								}
						},
						/**
							* 重新渲染barcodeTree
							* 1. 首先label需要删除重新进行绘制 => 如果barcodeTree的高度变化, label可能会出现覆盖的情况
							* 2. 删除标记barcodeTree节点选择的box
							* 3. 设置barcodeTree更新的颜色, 如果处于选择状态, 那么BarcodeTree会变成浅色
							* 4. 重新遍历barcodeTree的节点, 选择动画形式变化的节点以及直接绘制变化的节点
							*    动画形式变化的节点: 1. 对齐部分 2. 折叠部分
							*    动画形式变化的节点的原始节点不需要删除, 其他的节点需要删除
							* ==========以上已经删除了全部的节点, 需要重新进行绘制============
							* 5. 原始的barcodeTree中的节点不变, 先将动画部分的节点移动到对应的位置
							*/
						render_barcodetree: function () {
								var self = this
								var model = self.model
								var collection = window.Datacenter.barcodeCollection
								collection.is_selected_node_empty()
								var tweenDuration = self.tweenDuration
								//	重新更新barcodeTree中的参数
								self.update_paras()
								var layer = self.layer
								//	 barcodeTreeNodePaddingLeft是barcodeTree的最左侧节点距离屏幕左侧边界的距离
								var barcodeTreeNodePaddingLeft = self.barcodeTreeNodePaddingLeft
								//	存储barcodeTree中的label的对象
								var tweenObject = {}
								var sumNodeNum = 0
								var tweenDeferArray = []
								var tweenDeferIndex = 0
								//	当前对齐的层级
								var alignedLevel = Variables.get('alignedLevel')
								//	barcodeTree的索引值
								var barcodeTreeIndex = model.get('originalBarcodeIndex')
								//	barcodeTree的id
								var barcodeTreeId = model.get('barcodeTreeId')
								//	barcodeTree中的节点数组
								var barcodeNodeArray = self.get_barcode_node_array()
								var barcodeNodeArrayObj = self.get_node_obj_from_array(barcodeNodeArray)
								//	barcodePaddingTop是在barcodeTree的内部距离上边界的距离
								var barcodePaddingTop = model.get('barcodePaddingTop')
								//	该视图的纵向的位置
								var barcodeTreeYLocation = model.get('barcodeTreeYLocation')
								//	barcodeTree中在padding范围的起始节点id的数组
								var paddingStartIdArray = model.get('padding_start_id_array')
								//	barcodeTree中在padding范围的节点id的数组
								var paddingRangeIdArray = model.get('padding_range_id_array')
								//	获取在当前的树中选择的比较部分的节点的id数组, 根据选择的id数组判断padding节点是否高亮
								var selectedComparisonResults = model.get('selectedComparisonResults')
								//	barcodeTree中显示的参数
								var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var barcodeTreeComparisonMode = Config.get('BARCODETREE_COMPARISON_MODE')
								var currentSelectedNodeIdArray = []
								//	获取barcodetree-scrollpanel上移的距离
								var scrollTop = $('#barcodetree-scrollpanel').scrollTop()
								var barcodeTreeViewHeight = $('#barcodetree-scrollpanel').height()
								var scrollBottom = scrollTop + barcodeTreeViewHeight
								var thisTreeTransition = false
								if ((barcodeTreeYLocation >= scrollTop) && (barcodeTreeYLocation <= scrollBottom)) {
										thisTreeTransition = true
								}
								//	是否采用transition的方式改变节点
								var enableTransition = Variables.get('EnableTransition')
								for (var item in selectedComparisonResults) {
										var comparedResultsObj = selectedComparisonResults[item]
										//	在选择的节点数组中增加孩子节点的id
										var childrenNodes = comparedResultsObj.childrenNodes
										for (var item in childrenNodes) {
												var nodeArray = childrenNodes[item]
												for (var nI = 0; nI < nodeArray.length; nI++) {
														currentSelectedNodeIdArray.push(nodeArray[nI].id)
												}
										}
										var currentSelectedNode = comparedResultsObj.currentSelectedNode
										//	在选择的节点数组中增加当前节点的id
										currentSelectedNodeIdArray.push(currentSelectedNode.id)
								}
								//	删除现有视图中绘制的节点, 在选择的层级发生变换之后, 全集的节点, 即存储在rectObject中的节点会发生变化
								var shapeNum = 0
								self.layer.find('.barcode-node, .barcode-padding-node').each(function (shape) {
										shapeNum = shapeNum + 1
										var shapeId = shape.attrs.id
										var nodeIdArray = shapeId.split('=')
										var nodeId = nodeIdArray[0]
										if (typeof (barcodeNodeArrayObj[nodeId]) === 'undefined') {
												shape.remove()
												delete self.rectObject[shapeId]
										}
								})
								for (var rI = 0; rI < barcodeNodeArray.length; rI++) {
										var barcodeNodeObj = barcodeNodeArray[rI]
										//	删除对齐部分不存在, 且比对齐节点更深的节点
										if (!barcodeNodeObj.existed) {
												var barcodeNodeId = barcodeNodeObj.id + '=' + barcodeTreeIndex
												self.layer.find('#' + barcodeNodeId).each(function (shape) {
														shape.remove()
														delete self.rectObject[barcodeNodeId]
												})
										}
								}
								//	为什么在这个地方先将之前的部分画出来
								self.layer.draw()
								//	将所有的节点都存储到rectObject对象中
								//	为什么节点无法删除的原因是在节点数组中已经不存在这些对齐部分的节点, 所以无法再次选中他们
								for (var rI = 0; rI < barcodeNodeArray.length; rI++) {
										sumNodeNum = sumNodeNum + barcodeNodeArray.length
										var barcodeNodeObj = barcodeNodeArray[rI]
										//	barcodeTree中节点的id, 在节点的id中增加barcodeTree的index数值
										var barcodeNodeId = barcodeNodeObj.id + '=' + barcodeTreeIndex
										//	当前的节点处于padidng的状态下
										var inPaddingState = self.barcodetree_node_filter(barcodeNodeObj, paddingStartIdArray, paddingRangeIdArray)
										//	筛选不属于padding范围的节点, padding指的是节点被收缩的范围
										if (true) {
												//	计算得到的每个节点的高度
												var nodeHeight = self.height_handler(barcodeNodeObj)
												//	计算得到的每个节点的纵坐标
												var nodeY = self.y_handler(barcodeNodeObj)
												//	如果存在选择的节点, 那么默认刷新的节点的颜色是unHighlightColor
												// 如果不存在选择的节点, 那么默认刷新节点的颜色是barcodeNodeColor
												// var barcodeNodeColor = self.barcodeNodeColor
												var barcodeNodeColor = self.color_handler(barcodeNodeObj)
												if (!collection.is_selected_node_empty()) {
														barcodeNodeColor = self.unHighlightColor
												}
												//	计算获取所有的需要进行transition的节点的总数
												//	在barcodeTree的节点中增加barcode-node通用的类,
												// barcodeNodeObj.id即节点id: 用于选择不同树中的对应节点,
												// barcodeTreeId即barcodeTree的id: 用于选择一个barcodeTree中的所有的节点
												//	存在两个条件可以使用tween过渡: 1。在aling的范围内或者在collapse的范围内 2。属于之前已经存在的节点
												//	遍历全部的barcodeTree得到defer的数量
												// if ((model.is_aligned_start(barcodeNodeObj.id) || model.is_aligned_range(barcodeNodeObj.id) || (model.is_collapsed_subtree_range(barcodeNodeObj.id)))//	第一个条件
												// 		&& (typeof (self.rectObject[barcodeNodeId]) !== 'undefined')) {
												if ((typeof (self.rectObject[barcodeNodeId]) !== 'undefined') && (barcodeNodeObj.existed)) {
														var deferObj = $.Deferred()
														tweenDeferArray.push(deferObj)
												}
												// if ((model.is_aligned_start(barcodeNodeObj.id) || model.is_aligned_range(barcodeNodeObj.id) || (model.is_collapsed_subtree_range(barcodeNodeObj.id)))//	第一个条件
												// 		&& (typeof (self.rectObject[barcodeNodeId]) !== 'undefined')) {
												if ((typeof (self.rectObject[barcodeNodeId]) !== 'undefined') && (barcodeNodeObj.existed)) {
														//	为了防止出现tween对应的节点在layer中不存在的情况, 在layer中先增加节点
														if (self.layer.find('#' + barcodeNodeId).length <= 0) {
																self.layer.add(self.rectObject[barcodeNodeId])
														}
														//	根据节点的宽度判断tween结束时节点的opacity
														// 如果当前的节点的opacity为0的条件: 1. 节点的层级被filter过滤(width === 0); 2. 节点处于padding的状态下(isPaddingState === true)
														var nodeOpacity = 1
														if ((barcodeNodeObj.width == 0) || (inPaddingState)) {
																nodeOpacity = 0
														}
														if ((is_attr_different(self.rectObject[barcodeNodeId], barcodeNodeObj, nodeY, nodeHeight,
																		barcodePaddingTop, barcodeTreeNodePaddingLeft, barcodeNodeColor)) && (thisTreeTransition) && (enableTransition)) {
																//	节点在aligned范围内需要使用tween进行过渡
																if (barcodeNodeColor !== self.unHighlightColor) {
																		self.rectObject[barcodeNodeId].fill(barcodeNodeColor).stroke(barcodeNodeColor)
																}
																var tween = new Konva.Tween({
																		node: self.rectObject[barcodeNodeId],
																		duration: tweenDuration,
																		easing: Konva.Easings.EaseInOut,
																		x: +barcodeTreeNodePaddingLeft + barcodeNodeObj.x,
																		y: barcodePaddingTop + nodeY,
																		width: +barcodeNodeObj.width,
																		height: nodeHeight,
																		// fill: barcodeNodeColor,
																		// stroke: barcodeNodeColor,
																		opacity: nodeOpacity,
																		onFinish: function () {
																				var deferIndex = this.index
																				tweenDeferArray[deferIndex].resolve()
																		}
																})
																tween.id = barcodeNodeId
																//	在tween对象的属性
																tween.index = tweenDeferIndex
																//	当全部的tween播放完成时, 重新绘制boxLine
																tweenObject[barcodeNodeId] = tween
																tweenDeferIndex = tweenDeferIndex + 1
														}
														else {
																tweenDeferArray[tweenDeferIndex].resolve()
																tweenDeferIndex = tweenDeferIndex + 1
														}
												}
												else {
														// console.log('add new node')
														//	否则直接在canvas上新增加节点, 这一部分是在canvas上增加新的节点
														var rect = null
														if ((barcodeNodeObj.existed) && (barcodeNodeObj.width !== 0)) {
																//	如果节点存在, 那么按照正常的绘制方式绘制barcodeTree中的节点
																rect = new Konva.Rect({
																		x: +barcodeTreeNodePaddingLeft + barcodeNodeObj.x,
																		y: barcodePaddingTop + nodeY,
																		width: +barcodeNodeObj.width,
																		height: nodeHeight,
																		fill: barcodeNodeColor,
																		stroke: barcodeNodeColor,
																		strokeWidth: self.barcodeNodeStrokeWidth,
																		name: 'barcode-node ' + barcodeNodeObj.id + ' ' + barcodeTreeId,
																		id: barcodeNodeId
																})
																rect.show_tooltip = true
																rect.existed = true
																self.rectObject[barcodeNodeId] = rect
														} else if (barcodeNodeObj.depth <= alignedLevel) {
																//	如果节点不存在, 那么将比aligned层级更深的节点变成空心的节点
																//		barcodeTree中不存在的节点的stroke的颜色
																// console.log('currentSelectedNodeIdArray', currentSelectedNodeIdArray)
																// //	当被选择的节点数组不为空, 并且当前节点没有被选中的情况下 => 该节点的颜色为unhighlightColor
																// //	否则当被选择的节点数组为空 => 全部的节点都是barcodeNodeColor, 或者当前节点被选择 => 当前节点是barcodeNodeColor
																// if ((currentSelectedNodeIdArray.indexOf(barcodeNodeId) === -1) && (currentSelectedNodeIdArray.length !== 0)) {
																// 		barcodeNodeStrokeColor = self.unHighlightColor
																// }
																if ((!barcodeTreeGlobalParas['BarcodeTree_Height_Encoding']) && (!barcodeTreeGlobalParas['BarcodeTree_Color_Encoding'])) {
																		rect = new Konva.Rect({
																				x: +barcodeTreeNodePaddingLeft + barcodeNodeObj.x,
																				y: barcodePaddingTop + nodeY,
																				width: +barcodeNodeObj.width,
																				height: nodeHeight,
																				stroke: self.unHighlightColor,
																				fill: 'white',
																				strokeWidth: self.barcodeNodeStrokeWidth,
																				name: 'barcode-padding-node ' + barcodeNodeObj.id + ' ' + barcodeTreeId,
																				id: barcodeNodeId
																		})
																		rect.show_tooltip = true
																		rect.existed = false
																		self.rectObject[barcodeNodeId] = rect
																}
														}
												}
												//	判断点击的矩形是否为null
												if (rect != null) {
														rect.on('mouseenter', function (e) {
																var nodeBarcodeTreeId = e.target.attrs.id
																//	改变鼠标悬停在rect上的cursor
																self.stage.container().style.cursor = 'pointer'
																var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
																self.barcodenode_mouseover_handler(e.target)
																//	发送信号, 发送当前鼠标悬停在的BarcodeTree的id
																self.trigger_hovering_barcodetree_event(barcodeTreeId)
																self.mouseover_highlight_tree_label(barcodeTreeId)
														})
														rect.on('mouseleave', function (e) {
																//	改变鼠标离开在rect上的cursor
																self.stage.container().style.cursor = 'default'
																// self.barcodenode_mouseout_handler(this)
																//	当前的状态是取消其他节点的高亮状态
																// self.highlight_barcodetree_node()
																self.trigger_unhovering_barcodetree_event()
																Variables.set('hoveringBarcodeTreeNode', null)
																self.mouseout_unhighlight_tree_label(barcodeTreeId)
																//	隐藏barcodeTree中节点的tooltip
																self.hide_tooltip()
																//	隐藏barcodeTree节点下方的红线
																self.barcodenode_mouseout_handler()
																//	删除hovering节点上增加的stroke
																// self.remove_hovering_node_stroke(e, self)
														})
														//	设置的点击的时间 间隔的函数
														var timeoutID = null
														//	标记点击次数的变量
														var a = 0
														rect.on("click", function (e) {
																//	取消事件的冒泡传播
																a = a + 1
																if (timeoutID != null) {
																		clearTimeout(timeoutID)
																}
																timeoutID = window.setTimeout(function () {
																		if (a == 1) {
																				single_click_handler(e)
																		} else if (a > 1) {
																				double_click_handler(e)
																		}
																		a = 0
																}, 200);
														})
												}
										}
								}
								// console.log('tweenDeferIndex', tweenDeferIndex)
								//	重新绘制barcodeTree的文本
								var allBarcodeTreeLabelObj = model.get_barcode_tree_label_obj()
								self.remove_unexisted_tree_label(allBarcodeTreeLabelObj)
								var treeLabelObj = self.treeLabelObj
								for (var treeLabelId in allBarcodeTreeLabelObj) {
										var treeLabelShape = treeLabelObj[treeLabelId]
										if (typeof (treeLabelShape) !== 'undefined') {
												var deferObj = $.Deferred()
												tweenDeferArray.push(deferObj)
										}
								}
								for (var treeLabelId in allBarcodeTreeLabelObj) {
										var treeLabelAttrObj = allBarcodeTreeLabelObj[treeLabelId]
										var treeLabelShape = treeLabelObj[treeLabelId]
										if (typeof (treeLabelShape) !== 'undefined') {
												var treeLabelTween = new Konva.Tween({
														node: treeLabelShape,
														y: treeLabelAttrObj.y,
														duration: tweenDuration,
														easing: Konva.Easings.EaseInOut,
														fontSize: treeLabelAttrObj.fontSize,
														name: 'barcodetree-label ' + treeLabelAttrObj.barcodeTreeLabelId,
														onFinish: function () {
																var deferIndex = this.index
																tweenDeferArray[deferIndex].resolve()
														}
												})
												treeLabelTween.id = treeLabelId
												treeLabelTween.index = tweenDeferIndex
												//	当全部的tween播放完成时, 重新绘制boxLine
												tweenObject[treeLabelId] = treeLabelTween
												tweenDeferIndex = tweenDeferIndex + 1
										}
								}
								//	重新绘制barcodeCollection的三角形
								var allTrianglePointObj = model.get_collapsed_triangle_point_array()
								self.remove_unexisted_triangle(allTrianglePointObj)
								var triangleObject = self.triangleObject
								for (var triangleId in allTrianglePointObj) {
										var barcodeTriangleId = triangleId + '=triangle'
										var triangleShape = triangleObject[barcodeTriangleId]
										if (typeof (triangleShape) !== 'undefined') {
												var deferObj = $.Deferred()
												tweenDeferArray.push(deferObj)
										}
								}
								for (var triangleId in allTrianglePointObj) {
										var trianglePointObj = allTrianglePointObj[triangleId]
										var trianglePointArray = trianglePointObj.trianglePointArray
										var barcodeTriangleId = triangleId + '=triangle'
										var triangleShape = triangleObject[barcodeTriangleId]
										if (typeof (triangleShape) !== 'undefined') {
												var collapseTriangleTween = new Konva.Tween({
														node: triangleShape,
														duration: tweenDuration,
														easing: Konva.Easings.EaseInOut,
														points: trianglePointArray,
														onFinish: function () {
																var deferIndex = this.index
																tweenDeferArray[deferIndex].resolve()
														}
												})
												collapseTriangleTween.id = barcodeTriangleId
												collapseTriangleTween.index = tweenDeferIndex
												//	当全部的tween播放完成时, 重新绘制boxLine
												tweenObject[barcodeTriangleId] = collapseTriangleTween
												tweenDeferIndex = tweenDeferIndex + 1
										}
								}
								//	重新绘制表示padding barcodeTree节点的diagonal-strip节点
								var allDisgonalStripObj = model.get_all_diagonal_strip_obj()
								self.remove_unexisted_diagonal_strip(allDisgonalStripObj)
								var diagonalStripObject = self.diagonalStripObject
								var disgonalStripeImageSources = Variables.get('disgonalStripeImageSources')
								for (var diagonalStripId in allDisgonalStripObj) {
										var diagonalStripShape = diagonalStripObject[diagonalStripId]
										if (typeof (diagonalStripShape) !== 'undefined') {
												var deferObj = $.Deferred()
												tweenDeferArray.push(deferObj)
										}
								}
								var basedHeight = Variables.get('basedHeight')
								var basedWidth = Variables.get('basedWidth')
								for (var diagonalStripId in allDisgonalStripObj) {
										var diagonalStripObj = allDisgonalStripObj[diagonalStripId]
										//	判断当前的显示状态, 从而计算得到barcodeTree compact的节点的高度
										var diagonalStripNodeHeight = diagonalStripObj.height
										var diagonalStripNodeY = diagonalStripObj.y
										if (barcodeTreeGlobalParas['BarcodeTree_Height_Encoding']) {
												diagonalStripNodeHeight = diagonalStripObj.height_value
												diagonalStripNodeY = diagonalStripObj.y_value
										}
										var diagonalStripShape = diagonalStripObject[diagonalStripId]
										if (typeof (diagonalStripShape) !== 'undefined') {
												var diagonalStripTween = new Konva.Tween({
														node: diagonalStripShape,
														duration: tweenDuration,
														easing: Konva.Easings.EaseInOut,
														x: diagonalStripObj.x,
														y: diagonalStripNodeY,
														width: diagonalStripObj.width,
														height: diagonalStripNodeHeight,
														onFinish: function () {
																var deferIndex = this.index
																tweenDeferArray[deferIndex].resolve()
														}
												})
												diagonalStripTween.id = diagonalStripId
												diagonalStripTween.index = tweenDeferIndex
												//	当全部的tween播放完成时, 重新绘制boxLine
												tweenObject[diagonalStripId] = diagonalStripTween
												tweenDeferIndex = tweenDeferIndex + 1
										}
								}
								//	重新绘制框选barcodeTree中节点的box节点
								var selectedTreeNodeBoxObj = self.selectedTreeNodeBoxObj
								var allBoxAttrObject = model.get_all_box_attr_obj()
								self.remove_unexisted_tree_node_box(allBoxAttrObject)
								for (var selectedTreeNodeBoxId in allBoxAttrObject) {
										var selectedTreeNodeBoxShape = selectedTreeNodeBoxObj[selectedTreeNodeBoxId]
										if (typeof (selectedTreeNodeBoxShape) !== 'undefined') {
												var deferObj = $.Deferred()
												tweenDeferArray.push(deferObj)
										}
								}
								for (var selectedTreeNodeBoxId in allBoxAttrObject) {
										var selectedTreeNodeBoxShape = selectedTreeNodeBoxObj[selectedTreeNodeBoxId]
										if (typeof (selectedTreeNodeBoxShape) !== 'undefined') {
												//	如果之前不存在selectedTreeNodeBoxShape, 那么需要先将这个对象添加到layer中
												if (self.layer.find('#' + selectedTreeNodeBoxId).length === 0) {
														self.layer.add(selectedTreeNodeBoxShape)
												}
												var boxAttr = allBoxAttrObject[selectedTreeNodeBoxId]
												var treeNodeBoxTween = new Konva.Tween({
														node: selectedTreeNodeBoxShape,
														points: [boxAttr.left, boxAttr.top, boxAttr.left, boxAttr.bottom, boxAttr.right,
																boxAttr.bottom, boxAttr.right, boxAttr.top, boxAttr.left, boxAttr.top],
														duration: tweenDuration,
														easing: Konva.Easings.EaseInOut,
														onFinish: function () {
																var deferIndex = this.index
																tweenDeferArray[deferIndex].resolve()
														}
												})
												treeNodeBoxTween.id = selectedTreeNodeBoxId
												treeNodeBoxTween.index = tweenDeferIndex
												//	当全部的tween播放完成时, 重新绘制boxLine
												tweenObject[selectedTreeNodeBoxId] = treeNodeBoxTween
												tweenDeferIndex = tweenDeferIndex + 1
										}
								}
								//	重新绘制框选barcodeTree中label的box节点
								var selectedTreeLabelBoxObj = self.selectedTreeLabelBoxObj
								var allBoxAttrLabelObject = model.get_all_box_label_obj()
								self.remove_unexisted_tree_label_box(allBoxAttrLabelObject)
								for (var selectedTreeLabelBoxId in allBoxAttrLabelObject) {
										var selectedTreeLabelBoxShape = selectedTreeLabelBoxObj[selectedTreeLabelBoxId]
										if (typeof (selectedTreeLabelBoxShape) !== 'undefined') {
												var deferObj = $.Deferred()
												tweenDeferArray.push(deferObj)
										}
								}
								for (var selectedTreeLabelBoxId in allBoxAttrLabelObject) {
										var selectedTreeLabelBoxShape = selectedTreeLabelBoxObj[selectedTreeLabelBoxId]
										if (typeof (selectedTreeLabelBoxShape) !== 'undefined') {
												var boxAttr = allBoxAttrLabelObject[selectedTreeLabelBoxId]
												var treeNodeBoxTween = new Konva.Tween({
														node: selectedTreeLabelBoxShape,
														points: [boxAttr.left, boxAttr.top, boxAttr.left, boxAttr.bottom, boxAttr.right, boxAttr.bottom, boxAttr.right, boxAttr.top, boxAttr.left, boxAttr.top],
														duration: tweenDuration,
														easing: Konva.Easings.EaseInOut,
														onFinish: function () {
																var deferIndex = this.index
																tweenDeferArray[deferIndex].resolve()
														}
												})
												treeNodeBoxTween.id = selectedTreeLabelBoxId
												treeNodeBoxTween.index = tweenDeferIndex
												//	当全部的tween播放完成时, 重新绘制boxLine
												tweenObject[selectedTreeLabelBoxId] = treeNodeBoxTween
												tweenDeferIndex = tweenDeferIndex + 1
										}
								}
								//	改变宽度为0的节点的边框的颜色
								self.layer.find('.barcode-node').each(function (shape) {
										var shapeWidth = shape.width()
										if (shapeWidth === 0) {
												shape.stroke('white')
										}
								})
								//	重新绘制整个视图
								self.layer.draw()
								//	结束defer的监听函数
								$.when.apply(null, tweenDeferArray).done(function () {
										//	现在动画移动所有的现存部分的节点, 但是现在不存在的节点需要增加上去,
										// 比如当对齐的层级逐渐加深, 那么需要增加新的padding部分的节点
										var filteredRectObject = {}
										for (var item in self.rectObject) {
												if (typeof (tweenObject[item]) === 'undefined') {
														//	在向layer中增加新的object之前, 首先删除已经存在的rect
														filteredRectObject[item] = self.rectObject[item]
												}
										}
										for (var item in filteredRectObject) {
												layer.add(self.rectObject[item])
										}
										//	重新渲染diagonal strip对象
										self.render_diagonal_strip(allDisgonalStripObj)
										//	这一部分主要是代替tween的部分, 即使没有tween的动画,
										// 也能够得到相同的结果, 只不过去掉了中间的过渡过程
										self.update_barcode_tree_node()
										//	根据选择的子树高亮节点
										self.highlight_whole_selected_nodes()
										//	增加barcodeTree的label
										self.render_barcodetree_label(allBarcodeTreeLabelObj)
										//	增加点击选择的子树的标记
										self.render_subtree_triangle(allTrianglePointObj)
										//	要先将所有的diagonal strip删除, diagonal strip需要重新绘制, 因为上面的纹理需要更新
										//	增加diagonal Strip的标记
										// self.remove_all_diagonal_strip()
										//	在绘制标记选择的barcodeTree的节点时, 删除全部的box-line
										self.add_box_clicked_tree_nodes()
										//	绘制标记选择的barcodeTree的label的box
										self.add_box_clicked_tree_labels()
										//	删除在barcodeTree中不是对齐, 且padding的节点
										//	这些节点主要是在删除对齐节点的时候产生的
										self.remove_unaligned_padding_nodes()
										layer.draw()
								})
								//	播放align过程中的动画
								for (var item in tweenObject) {
										tweenObject[item].play()
								}
								// 判断点击的节点与rectObj是不是具有相同的属性
								function is_attr_different(rectObjectShape, barcodeNodeObj, nodeY, nodeHeight, barcodePaddingTop, barcodeTreeNodePaddingLeft, barcodeNodeColor) {
										var nodeX = +barcodeTreeNodePaddingLeft + barcodeNodeObj.x
										var nodeY = +barcodePaddingTop + nodeY
										var nodeWidth = +barcodeNodeObj.width
										var nodeHeight = +nodeHeight
										var shapeAttr = rectObjectShape.attrs
										var shapeX = +shapeAttr.x
										var shapeY = +shapeAttr.y
										var shapeWidth = +shapeAttr.width
										var shapeHeight = +shapeAttr.height
										var fill = +shapeAttr.fill
										var attrSame = ((nodeX === shapeX) && (nodeY === shapeY) && (nodeWidth === shapeWidth) && (nodeHeight === shapeHeight))//&& (fill === barcodeNodeColor)
										return (!attrSame)
								}

								//	单击节点的响应事件
								function single_click_handler(e) {
										//	在barcodeTree中节点上的点击选择事件
										var nodeBarcodeTreeId = e.target.attrs.id
										var nodeIdArray = nodeBarcodeTreeId.split('=')
										var nodeId = nodeIdArray[0]
										var nodeObj = model.get_node_obj_by_id(nodeId)
										//	在barcodeTree中点击选择的事件
										self.single_click_select_handler(nodeObj, model)
								}

								//	双击节点的响应事件
								function double_click_handler(e) {
										var nodeBarcodeTreeId = e.target.attrs.id
										var nodeIdArray = nodeBarcodeTreeId.split('=')
										var nodeId = nodeIdArray[0]
										var nodeObj = model.get_node_obj_by_id(nodeId)
										var collapsedNodeIdArray = window.Datacenter.barcodeCollection.collapsedNodeIdArray
										if (collapsedNodeIdArray.indexOf(nodeObj.id) === -1) {
												self.collapse_all_subtree(nodeObj)
										} else {
												self.uncollapse_all_subtree(nodeObj)
										}
								}
						},
						/**
							* 更新barcodeTree中的节点
							*/
						update_barcode_tree_node: function () {
								var self = this
								var model = self.model
								var barcodeNodeArray = self.get_barcode_node_array()
								//	barcodeTree中在padding范围的起始节点id的数组
								var paddingStartIdArray = model.get('padding_start_id_array')
								//	barcodeTree中在padding范围的节点id的数组
								var paddingRangeIdArray = model.get('padding_range_id_array')
								//	 barcodeTreeNodePaddingLeft是barcodeTree的最左侧节点距离屏幕左侧边界的距离
								var barcodeTreeNodePaddingLeft = self.barcodeTreeNodePaddingLeft
								//	barcodePaddingTop是在barcodeTree的内部距离上边界的距离
								var barcodePaddingTop = model.get('barcodePaddingTop')
								//	barcodeTree的索引值
								var barcodeTreeIndex = model.get('originalBarcodeIndex')
								for (var rI = 0; rI < barcodeNodeArray.length; rI++) {
										var barcodeNodeObj = barcodeNodeArray[rI]
										var paddingState = self.barcodetree_node_filter(barcodeNodeObj, paddingStartIdArray, paddingRangeIdArray)
										var nodeOpacity = 1
										if ((barcodeNodeObj.width == 0) || paddingState) {
												nodeOpacity = 0
										}
										var barcodeNodeId = barcodeNodeObj.id + '=' + barcodeTreeIndex
										//	筛选不属于padding范围的节点, padding指的是节点被收缩的范围
										//	计算得到的每个节点的高度
										var nodeHeight = self.height_handler(barcodeNodeObj)
										//	计算得到的每个节点的纵坐标
										var nodeY = self.y_handler(barcodeNodeObj)
										if (typeof (self.rectObject[barcodeNodeId]) !== 'undefined') {
												self.rectObject[barcodeNodeId].x(+barcodeTreeNodePaddingLeft + barcodeNodeObj.x)
												self.rectObject[barcodeNodeId].y(+barcodePaddingTop + nodeY)
												self.rectObject[barcodeNodeId].width(+barcodeNodeObj.width)
												self.rectObject[barcodeNodeId].height(+nodeHeight)
												self.rectObject[barcodeNodeId].opacity(nodeOpacity)
										}
								}
						},
						/**
							* 计算barcode的数组对应的对象
							*/
						get_node_obj_from_array: function (barcodeNodeArray) {
								var self = this
								var barcodeNodeArrayObj = {}
								for (var bI = 0; bI < barcodeNodeArray.length; bI++) {
										var barcodeNodeId = barcodeNodeArray[bI].id
										barcodeNodeArrayObj[barcodeNodeId] = barcodeNodeArray[bI]
								}
								return barcodeNodeArrayObj
						},
						//	在视图上增加tooltip的layer, 在上面增加tooltip的背景以及文本, 但是将其进行隐藏
						render_tooltip: function () {
								var self = this
								var tooltipLayer = self.tooltipLayer
								var tooltipBg = new Konva.Rect({
										x: 0,
										y: 0,
										width: 10,
										height: 10,
										visible: false,
										fill: "gray",
										opacity: 0.7
								})
								var tooltip = new Konva.Text({
										text: "huahua",
										fontFamily: "Calibri",
										fontSize: 15,
										padding: 5,
										align: 'center',
										visible: false,
										fill: "white",
										opacity: 1
								})
								self.tooltipBg = tooltipBg
								self.tooltip = tooltip
								//	在tooltip的layer层增加tooltip
								tooltipLayer.add(tooltipBg)
								tooltipLayer.add(tooltip)
								self.stage.add(tooltipLayer)
						},
						//	在barcdoeTree的layer增加mouseover显示tooltip的事件
						// add_layer_mouseover_event: function () {
						// 		var self = this
						// 		var layer = self.layer
						// 		var textPaddingTop = 10
						// 		var tooltipBgMargin = self.tooltipBgMargin
						// 		layer.on("mousemove", function (e) {
						// 				//	当前表示不会显示tooltip, 那么直接返回
						// 				if (!Variables.get('show_tooltip')) {
						// 						return
						// 				}
						// 				var show_tooltip = e.target.show_tooltip
						// 				if ((typeof (show_tooltip) === 'undefined') || (!show_tooltip)) {
						// 						//	在shape节点的show_tooltip属性为undefined或者false时, 鼠标mouseover不会显示tooltip
						// 						return
						// 				}
						// 				var className = e.target.className
						// 				//	按照鼠标悬停的对象的类型不同, 分为label以及barcodeTree中的节点两种
						// 				if (className === 'Text') {
						// 						//	如果鼠标选择的节点是文本
						// 						self.tooltip.text('Name:' + e.target.attrs.text)
						// 						var textWidth = self.tooltip.textWidth
						// 						var textHeight = self.tooltip.textHeight
						// 						var rectY = e.target.attrs.y
						// 						var textHeight = self.tooltip.textHeight
						// 						//	tooltip的横坐标位置
						// 						var tooltipPoxitionX = tooltipBgMargin.left
						// 						//	tooltip的纵坐标位置
						// 						var tooltipPoxitionY = rectY - textHeight - textPaddingTop
						// 						//	移动tooltip的纵坐标的位置
						// 						if (tooltipPoxitionY < 0) {
						// 								//	label的宽度
						// 								var labelHeight = e.target.textHeight
						// 								tooltipPoxitionY = rectY + labelHeight + textPaddingTop
						// 						}
						// 						//	改变tooltip的背景矩形的位置以及大小
						// 						self.tooltipBg.position({
						// 								x: tooltipPoxitionX - tooltipBgMargin.left,
						// 								y: tooltipPoxitionY - tooltipBgMargin.top
						// 						})
						// 						self.tooltipBg.width(textWidth + tooltipBgMargin.left + tooltipBgMargin.right)
						// 						self.tooltipBg.height(textHeight + tooltipBgMargin.top + tooltipBgMargin.bottom)
						// 						self.tooltip.position({
						// 								x: tooltipPoxitionX,
						// 								y: tooltipPoxitionY
						// 						})
						// 				} else {
						// 						//	如果鼠标选择的节点不是文本, 而是rect
						// 						var barcodeTreeIdIndex = self.barcodeTreeIdIndex
						// 						var nodeId = e.target.attrs.id
						// 						if (typeof (nodeId) === 'undefined') {
						// 								return
						// 						}
						// 						var collection = window.Datacenter.barcodeCollection
						// 						var nodeIdArray = nodeId.split('=')
						// 						var barcodeTreeNodeId = nodeIdArray[0]
						// 						var nodeName = e.target.attrs.name
						// 						var nodeNameAttrArray = nodeName.split(' ')
						// 						var barcodeTreeId = nodeNameAttrArray[barcodeTreeIdIndex]
						// 						var barcodeModelFindResults = collection.where({barcodeTreeId: barcodeTreeId})
						// 						//	剩余的barcodeModel
						// 						var barcodeModel = null
						// 						if (barcodeModelFindResults.length !== 0) {
						// 								barcodeModel = barcodeModelFindResults[0]
						// 						}
						// 						if ((barcodeModel == null) || (typeof (barcodeModel) === 'undefined')) {
						// 								return
						// 						}
						// 						var barcodeTreeIndex = barcodeModel.get('originalBarcodeIndex')
						// 						var barcodeModel = collection.at(barcodeTreeIndex)
						// 						var nodeObj = barcodeModel.get_node_obj_by_id(barcodeTreeNodeId)
						// 						if (typeof (nodeObj) === 'undefined') {
						// 								return
						// 						}
						// 						var categoryName = nodeObj.categoryName
						// 						var nodeNum = nodeObj.num
						// 						// update tooltip
						// 						self.tooltip.text(categoryName + ", " + nodeNum)
						// 						var textWidth = self.tooltip.textWidth
						// 						var textHeight = self.tooltip.textHeight
						// 						var rectX = e.target.attrs.x
						// 						var rectY = e.target.attrs.y
						// 						var rectWidth = e.target.attrs.width
						// 						var rectHeight = e.target.attrs.height
						// 						//	tooltip的横坐标位置
						// 						var tooltipPoxitionX = rectX - textWidth - tooltipBgMargin.left - tooltipBgMargin.right
						// 						//	tooltip的纵坐标位置
						// 						var tooltipPoxitionY = rectY + rectHeight + tooltipBgMargin.top + self.hoveringVerticalLineLength
						// 						//	移动tooltip的纵坐标的位置
						// 						if (tooltipPoxitionY < 0) {
						// 								tooltipPoxitionY = rectY + rectHeight + textPaddingTop
						// 						}
						// 						//	移动tooltip的横坐标的位置
						// 						if (tooltipPoxitionX < 0) {
						// 								tooltipPoxitionX = tooltipBgMargin.left
						// 						}
						// 						//	改变tooltip的背景矩形的位置以及大小
						// 						self.tooltipBg.position({
						// 								x: tooltipPoxitionX - tooltipBgMargin.left,
						// 								y: tooltipPoxitionY - tooltipBgMargin.top
						// 						})
						// 						self.tooltipBg.width(textWidth + tooltipBgMargin.left + tooltipBgMargin.right)
						// 						self.tooltipBg.height(textHeight + tooltipBgMargin.top + tooltipBgMargin.bottom)
						// 						self.tooltip.position({
						// 								x: tooltipPoxitionX,
						// 								y: tooltipPoxitionY
						// 						})
						// 				}
						//
						// 				self.tooltipBg.show()
						// 				self.tooltip.show()
						// 				self.tooltipLayer.draw()
						// 		})
						// 		layer.on("mouseout", function () {
						// 				self.tooltipBg.hide()
						// 				self.tooltip.hide()
						// 				self.tooltipLayer.draw()
						// 		});
						// },
						//	遍历整个collection, 高亮选择的barcodeTree中的节点
						highlight_whole_selected_nodes: function () {
								var self = this
								var filterHighlightObjArray = self.filterHighlightObjArray
								//	节点的点击选择有两个方面, 一个是节点的高亮, 另一个是选择的节点周围增加框
								//	在高亮选择的节点之前首先取消全部的barcodeTree的节点的高亮
								self.refresh_all_barcode_node()
								//	高亮model中选择的节点, 存在两种高亮方式:
								// 1. 高亮删除或者新增的节点; 2. 高亮子树中的节点
								self.highlight_single_selected_nodes()
								//	高亮filter的节点
								self.highlight_filter_node_obj()
						},
						//	高亮点击选择的barcodeTree中的节点
						highlight_single_selected_nodes: function () {
								var self = this
								var model = self.model
								var barcodeTreeIndex = model.get('originalBarcodeIndex')
								var selectedComparisonResults = model.get('selectedComparisonResults')
								var BarcodeTreeComparisonMode = Variables.get('BARCODETREE_GLOBAL_PARAS')['BarcodeTree_Comparison_Mode']
								//	对于点击节点的高亮
								for (var item in selectedComparisonResults) {
										var comparedResultsObj = selectedComparisonResults[item]
										var nodeObj = comparedResultsObj.currentSelectedNode
										self.highlight_current_nodes(nodeObj, barcodeTreeIndex)
										var childrenNodes = comparedResultsObj.childrenNodes
										//	高亮点击节点的全部孩子节点
										var sameChildrenNodes = childrenNodes.same
										self.highlightChildrenNodes(sameChildrenNodes, barcodeTreeIndex)
										var missChildrenNodes = childrenNodes.miss
										var addChildrenNodes = childrenNodes.add
										if (BarcodeTreeComparisonMode) {
												//	在当前处于unlocked状态, 将barcodeTree中的节点进行简单的highlight
												self.highlightMissedChildrenNodes(missChildrenNodes, barcodeTreeIndex)
												self.highlightAddChildrenNodes(addChildrenNodes, barcodeTreeIndex)
										} else {
												//	在当前处于locked状态, 将barcodeTree中的节点进行简单的highlight
												self.highlightChildrenNodes(missChildrenNodes, barcodeTreeIndex)
												self.highlightChildrenNodes(addChildrenNodes, barcodeTreeIndex)
										}
								}
						},
						//	取消全部的barcodeTree的节点的高亮
						refresh_all_barcode_node: function () {
								var self = this
								var barcodeModel = self.model
								var barcodeNodeAttrArrayObj = barcodeModel.get('barcodeNodeAttrArrayObj')
								var barcodeNodeAttrArray = barcodeModel.get('barcodeNodeAttrArray')
								var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var collection = window.Datacenter.barcodeCollection
								//	选择barcodeTree中节点的默认颜色
								self.layer.find('.barcode-node').each(function (shape) {
										//	如果节点不处于aligned的范围之内, 那么直接删除shape节点
										if (!collection.is_selected_node_empty()) {
												shape.fill(self.unHighlightColor)
												shape.stroke(self.unHighlightColor)
										} else {
												var nodeIdTreeIndex = shape.attrs.id
												var nodeIdAttrArray = nodeIdTreeIndex.split('=')
												var barcodeNodeColor = self.get_color_by_shape_id(nodeIdTreeIndex, barcodeNodeAttrArrayObj, barcodeTreeGlobalParas)
												shape.fill(barcodeNodeColor)
												shape.stroke(barcodeNodeColor)
										}
								})
								//	将所有的padding节点恢复到原始的状态
								//	原始的状态是: 1. 如果存在选择的节点, 那么节点的边框为unhighlightColor, 否则节点的边框颜色为barcodeNodeColor
								self.layer.find('.barcode-padding-node').each(function (shape) {
										//	如果节点不处于aligned的范围之内, 那么直接删除shape节点
										if (!collection.is_selected_node_empty()) {
												shape.fill('white')
												shape.stroke(self.unHighlightColor)
										} else {
												var barcodeNodeColor = self.barcodeNodeColor
												shape.fill('white')
												shape.stroke(barcodeNodeColor)
										}
								})
						},
						//	删除点击的BarcodeTree以及节点
						remove_all_tree_labels_box: function () {
								var self = this
								var labelBoxLineName = self.labelBoxLineName
								self.layer.find('.label-box-line').each(function (shape) {
										shape.remove()
								})
						},
						//	清空存储节点的object
						clear_selected_nodes: function () {
								var self = this
						},
						//	删除点击的BarcodeTree以及节点
						remove_all_tree_nodes_box: function () {
								var self = this
								var nodeBoxLineName = self.nodeBoxLineName
								self.layer.find('.' + nodeBoxLineName).each(function (shape) {
										shape.remove()
								})
						},
						//	删除点击节点所对应的barcodeTree的label的box
						remove_box_clicked_tree_labels: function (barcodeNodeId) {
								var self = this
								var boxLabelObjId = barcodeNodeId + '=labelbox'
								self.layer.find('#' + boxLabelObjId).each(function (shape) {
										shape.remove()
								})
						},
						//	删除点击节点部分的box
						remove_box_clicked_tree_nodes: function (barcodeNodeId) {
								var self = this
								var boxNodeObjId = barcodeNodeId + '=nodebox'
								self.layer.find('#' + boxNodeObjId).each(function (shape) {
										shape.remove()
								})
						},
						//	在选中的子树的label上增加box
						add_single_box_clicked_tree_labels: function (nodeObjId) {
								var self = this
								var model = self.model
								var selectedTreeLabelBoxObj = self.selectedTreeLabelBoxObj
								var boxLabelAttr = model.get_single_box_label_attr()
								var boxLabelObjId = nodeObjId + '=labelbox'
								if (self.layer.find('#' + boxLabelObjId).length <= 0) {
										var boxLabelLine = new Konva.Line({
												points: [boxLabelAttr.left, boxLabelAttr.top, boxLabelAttr.left, boxLabelAttr.bottom,
														boxLabelAttr.right, boxLabelAttr.bottom, boxLabelAttr.right, boxLabelAttr.top,
														boxLabelAttr.left, boxLabelAttr.top],
												stroke: self.barcodeNodeColor,
												strokeWidth: self.boxStrokeWidth,
												name: self.labelBoxLineName,
												id: boxLabelObjId
										})
										self.layer.add(boxLabelLine)
										selectedTreeLabelBoxObj[boxLabelObjId] = boxLabelLine
								}
						},
						//	在选中的子树的节点上增加box标志该部分的节点被选中
						add_single_box_clicked_tree_nodes: function (nodeObjId) {
								var self = this
								var model = self.model
								var selectedTreeNodeBoxObj = self.selectedTreeNodeBoxObj
								var boxAttr = model.get_single_box_node_attr(nodeObjId)
								var boxObjId = nodeObjId + '=nodebox'
								if (self.layer.find('#' + boxObjId).length <= 0) {
										var boxLine = new Konva.Line({
												points: [boxAttr.left, boxAttr.top, boxAttr.left, boxAttr.bottom, boxAttr.right, boxAttr.bottom,
														boxAttr.right, boxAttr.top, boxAttr.left, boxAttr.top],
												stroke: self.barcodeNodeColor,
												strokeWidth: self.boxStrokeWidth,
												name: self.labelBoxLineName,
												id: boxObjId
										})
										selectedTreeNodeBoxObj[boxObjId] = boxLine
										self.layer.add(boxLine)
								}
						},
						//	高亮点击的节点所在子树的label
						add_box_clicked_tree_labels: function () {
								var self = this
								var model = self.model
								var barcodeNodeColor = self.barcodeNodeColor
								var boxStrokeWidth = self.boxStrokeWidth
								var labelBoxLineName = self.labelBoxLineName
								var selectedTreeLabelBoxObj = self.selectedTreeLabelBoxObj
								var allBoxAttrLabelObject = model.get_all_box_label_obj()
								var boxLabelLineObj = {}
								for (var boxLabelObjId in allBoxAttrLabelObject) {
										var boxLabelAttr = allBoxAttrLabelObject[boxLabelObjId]
										if (self.layer.find('#' + boxLabelObjId).length <= 0) {
												var boxLabelLine = new Konva.Line({
														points: [boxLabelAttr.left, boxLabelAttr.top, boxLabelAttr.left, boxLabelAttr.bottom,
																boxLabelAttr.right, boxLabelAttr.bottom, boxLabelAttr.right, boxLabelAttr.top,
																boxLabelAttr.left, boxLabelAttr.top],
														stroke: barcodeNodeColor,
														strokeWidth: boxStrokeWidth,
														name: labelBoxLineName,
														id: boxLabelObjId
												})
												boxLabelLineObj[boxLabelObjId] = boxLabelLine
										}
								}
								for (var labelObjId in boxLabelLineObj) {
										var boxLine = boxLabelLineObj[labelObjId]
										selectedTreeLabelBoxObj[labelObjId] = boxLine
										self.layer.add(boxLine)
								}
						},
						//	高亮点击的BarcodeTree以及节点
						add_box_clicked_tree_nodes: function () {
								var self = this
								var model = self.model
								var barcodeNodeColor = self.barcodeNodeColor
								var boxStrokeWidth = self.boxStrokeWidth
								var selectedTreeNodeBoxObj = self.selectedTreeNodeBoxObj
								var allBoxAttrObject = model.get_all_box_attr_obj()
								var nodeBoxLineName = self.nodeBoxLineName
								var boxLineObj = {}
								for (var boxObjId in allBoxAttrObject) {
										var boxAttr = allBoxAttrObject[boxObjId]
										if (self.layer.find('#' + boxObjId).length <= 0) {
												var boxLine = new Konva.Line({
														points: [boxAttr.left, boxAttr.top, boxAttr.left, boxAttr.bottom, boxAttr.right, boxAttr.bottom,
																boxAttr.right, boxAttr.top, boxAttr.left, boxAttr.top],
														stroke: barcodeNodeColor,
														strokeWidth: boxStrokeWidth,
														name: nodeBoxLineName,
														id: boxObjId
												})
												boxLineObj[boxObjId] = boxLine
										}
								}
								for (var boxObjId in boxLineObj) {
										var boxLine = boxLineObj[boxObjId]
										selectedTreeNodeBoxObj[boxObjId] = boxLine
										self.layer.add(boxLine)
								}
						},
						//	将所有的barcdoeTree的节点恢复高亮的状态
						// highlight_barcodetree_node: function () {
						// 		var self = this
						// 		var model = self.model
						// 		var collection = window.Datacenter.barcodeCollection
						// 		var barcodeNodeAttrArrayObj = model.get('barcodeNodeAttrArrayObj')
						// 		var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
						// 		// self.remove_parent_child_link()
						// 		var barcodeNodeColor = self.barcodeNodeColor
						// 		var unHighlightColor = self.unHighlightColor
						// 		self.highlight_whole_selected_nodes()
						//
						// 		if (!collection.is_selected_node_empty()) {
						// 				//	如果存在选择的节点, 首先恢复到全部取消高亮的状态
						// 				self.layer.find('.barcode-node').each(function (shape) {
						// 						shape.setFill(unHighlightColor)
						// 						shape.stroke(unHighlightColor)
						// 				})
						// 				self.layer.find('.barcode-padding-node').each(function (shape) {
						// 						shape.setFill(unHighlightColor)
						// 						shape.stroke(unHighlightColor)
						// 				})
						// 				//	然后高亮选择的节点
						// 		} else {
						// 				//	如果不存在选择的节点
						// 				self.layer.find('.barcode-node').each(function (shape) {
						// 						var nodeIdTreeIndex = shape.attrs.id
						// 						var barcodeNodeColor = self.get_color_by_shape_id(nodeIdTreeIndex, barcodeNodeAttrArrayObj, barcodeTreeGlobalParas)
						// 						shape.setFill(barcodeNodeColor)
						// 						shape.stroke(barcodeNodeColor)
						// 				})
						// 				self.layer.find('.barcode-padding-node').each(function (shape) {
						// 						shape.setFill(barcodeNodeColor)
						// 						shape.stroke(barcodeNodeColor)
						// 				})
						// 		}
						// 		self.layer.draw();
						// },
						/**
							* 删除aligned的部分不存在的节点
							*/
						remove_unaligned_padding_nodes: function () {
								var self = this
								// var barcodeCollection = window.Datacenter.barcodeCollection
								var model = self.model
								self.layer.find('.barcode-padding-node').each(function (shape) {
										var barcodeNodeName = shape.attrs.name
										var barcodeNodeNameAttrArray = barcodeNodeName.split(' ')
										//	barcodeTree中节点的id
										var barcodeTreeId = barcodeNodeNameAttrArray[self.barcodeTreeIdIndex]
										var treeNodeId = shape.attrs.id
										var nodeIdArray = treeNodeId.split('=')
										var barcodeNodeObjId = nodeIdArray[0]
										if (!((model.is_aligned_start(barcodeNodeObjId)) || (model.is_aligned_range(barcodeNodeObjId)))) {
												shape.remove()
										}
								})
						},
						/**
							* 删除当前渲染的全部barcode节点以及label
							*/
						remove_all_nodes: function (tweenObject) {
								var self = this
								self.layer.find('.barcode-node').each(function (shape) {
										var barcodeNodeId = shape.attrs.id
										if (typeof (tweenObject[barcodeNodeId]) === 'undefined') {
												//	在向layer中增加新的object之前, 首先删除已经存在的rect
												shape.remove()
										}
								})
						},
						//	渲染barcodeTree的label
						render_barcodetree_label: function (allBarcodeTreeLabelObj) {
								var self = this
								//	当前的barcodeTree的model
								var model = self.model
								var treeLabelObj = self.treeLabelObj
								//	barcodeTree的id
								var barcodeTreeId = model.get('barcodeTreeId')
								var selectedBarcodeTreeArray = JSON.parse(JSON.stringify(Variables.get('selectedBarcodeTreeArray')))
								var addedTreeLabelObj = {}
								var treeDate = model.get_barcode_tree_date_day()
								var treeHighlightColor = Variables.get('treeHighlightColor')
								for (var barcodeTreeLabelId in allBarcodeTreeLabelObj) {
										var barcodeTreeLabelObj = allBarcodeTreeLabelObj[barcodeTreeLabelId]
										if (self.layer.find('#' + barcodeTreeLabelId).length === 0) {
												//	将所有的文本节点存储到textObject对象中
												var simpleText = new Konva.Text({
														x: self.barcodeTextPaddingLeft,
														y: barcodeTreeLabelObj.y,
														text: barcodeTreeLabelObj.text,
														fontSize: barcodeTreeLabelObj.fontSize,
														fontFamily: 'FontAwesome',
														align: 'right',
														fill: self.barcodeTreeLabelColor,
														name: 'barcodetree-label ' + barcodeTreeLabelId,
														id: barcodeTreeLabelObj.barcodeTreeLabelId
												})
												simpleText.tooltipX = self.barcodeTextPaddingLeft
												simpleText.tooltipY = window.barcodeHeight
												simpleText.tooltipText = treeDate.date + ', ' + treeDate.day
												simpleText.id = barcodeTreeLabelObj.barcodeTreeLabelId
												simpleText.on('mouseover', function (e) {
														var treeLabel = e.target
														//	改变鼠标悬停在rect上的cursor
														self.stage.container().style.cursor = 'pointer'
														//	发送信号, 发送当前鼠标悬停在的BarcodeTree的id
														self.trigger_hovering_barcodetree_event(barcodeTreeId)
														var tooltipX = treeLabel.tooltipX
														var tooltipY = treeLabel.tooltipY
														var tooltipText = treeLabel.tooltipText
														//	显示text上的tooltip
														self.show_tooltip(tooltipX, tooltipY, tooltipText)
												})
												simpleText.on('mouseout', function (e) {
														var treeLabel = e.target
														//	改变鼠标离开在rect上的cursor
														self.stage.container().style.cursor = 'default'
														// self.highlight_barcodetree_node()
														self.trigger_unhovering_barcodetree_event()
														self.hide_tooltip()
												})
												simpleText.on('click', function (e) {
														var treeLabel = e.target
														//	改变鼠标离开在rect上的cursor
														var treeLabelColor = treeLabel.fill()
														if (treeLabelColor === 'black') {
																self.add_single_tree_selection()
														} else if (treeLabelColor === treeHighlightColor) {
																self.remove_single_tree_selection()
														}
												})
												treeLabelObj[barcodeTreeLabelId] = simpleText
												addedTreeLabelObj[barcodeTreeLabelId] = simpleText
										}
								}
								for (var item in addedTreeLabelObj) {
										self.layer.add(addedTreeLabelObj[item])
								}
						},
						//	高亮树的label
						mouseover_highlight_tree_label: function (treeLabelId) {
								var self = this
								var treeHighlightColor = Variables.get('treeHighlightColor')
								self.layer.find('#' + treeLabelId + '=label').each(function (shape) {
										shape.fill(treeHighlightColor)
										shape.fontStyle('bold')
								})
								self.layer.draw()
						},
						//	取消高亮树的label
						mouseout_unhighlight_tree_label: function (treeLabelId) {
								var self = this
								self.layer.find('#' + treeLabelId + '=label').each(function (shape) {
										shape.fill('black')
										shape.fontStyle('normal')
								})
								//	因为在highlight选择的树的label时需要重新渲染layer的所有图形
								self.highlight_selection_tree_label()
						},
						// 增加树的选择
						add_single_tree_selection: function () {
								var self = this
								var model = self.model
								var barcodeTreeId = model.get('barcodeTreeId')
								var selectedBarcodeTreeArray = JSON.parse(JSON.stringify(Variables.get('selectedBarcodeTreeArray')))
								//	增加选择的barcodeTree的id
								selectedBarcodeTreeArray.push(barcodeTreeId)
								Variables.set('selectedBarcodeTreeArray', selectedBarcodeTreeArray)
						},
						// 删除树的选择
						remove_single_tree_selection: function () {
								var self = this
								var model = self.model
								var barcodeTreeId = model.get('barcodeTreeId')
								var selectedBarcodeTreeArray = JSON.parse(JSON.stringify(Variables.get('selectedBarcodeTreeArray')))
								//	增加选择的barcodeTree的id
								var barcodeTreeIndex = selectedBarcodeTreeArray.indexOf(barcodeTreeId)
								selectedBarcodeTreeArray.splice(barcodeTreeIndex, 1)
								Variables.set('selectedBarcodeTreeArray', selectedBarcodeTreeArray)
						},
						//	选择这个树的label
						highlight_selection_tree_label: function () {
								var self = this
								var model = self.model
								var treeHighlightColor = Variables.get('treeHighlightColor')
								var selectedBarcodeTreeArray = Variables.get('selectedBarcodeTreeArray')
								var filterBarcodeTreeIdArray = Variables.get('filterBarcodeTreeIdArray')
								self.layer.find('.barcodetree-label').each(function (shape) {
										shape.fill('black')
										shape.fontStyle('normal')
								})
								//	高亮用户从brush selection视图中选择的barcodeTree的label
								for (var sI = 0; sI < selectedBarcodeTreeArray.length; sI++) {
										var barcodeTreeId = selectedBarcodeTreeArray[sI]
										var barcodeTreeLabelId = barcodeTreeId + '=label'
										self.layer.find('#' + barcodeTreeLabelId).each(function (shape) {
												shape.fill(treeHighlightColor)
												shape.fontStyle('bold')
										})
								}
								//	高亮从distribution视图中选择的barcodeTree的label
								for (var fI = 0; fI < filterBarcodeTreeIdArray.length; fI++) {
										var barcodeTreeId = filterBarcodeTreeIdArray[fI]
										var barcodeTreeLabelId = barcodeTreeId + '=label'
										self.layer.find('#' + barcodeTreeLabelId).each(function (shape) {
												shape.fill(treeHighlightColor)
												shape.fontStyle('bold')
										})
								}
								self.layer.draw()
						},
						//	取消选择这个树的label
						unhighlight_this_tree_label: function () {
								var self = this
								var model = self.model
								var treeHighlightColor = Variables.get('treeHighlightColor')
								var selectedBarcodeTreeArray = JSON.parse(JSON.stringify(Variables.get('selectedBarcodeTreeArray')))
								var barcodeTreeId = model.get('barcodeTreeId')
								var barcodeTreeLabelId = barcodeTreeId + '=label'
								selectedBarcodeTreeArray.push(barcodeTreeId)
								self.layer.find('.barcodetree-label').each(function (shape) {
										shape.fill('black')
										shape.fontStyle('normal')
								})
								self.layer.find('#' + barcodeTreeLabelId).each(function (shape) {
										shape.fill(treeHighlightColor)
										shape.fontStyle('bold')
								})
								self.layer.draw()
						},
						render_subtree_triangle: function (allTrianglePointObj) {
								var self = this
								var barcodeCollection = window.Datacenter.barcodeCollection
								var triangleObject = self.triangleObject
								for (var barcodeNodeId in allTrianglePointObj) {
										var trianglePointObj = allTrianglePointObj[barcodeNodeId]
										var trianglePointArray = trianglePointObj.trianglePointArray
										var barcodeTriangleId = barcodeNodeId + '=triangle'
										var nodeId = barcodeNodeId.split('=')[0]
										var triangleClass = nodeId + '=triangle'
										if (self.layer.find('#' + barcodeTriangleId).length === 0) {
												//  在svg上面绘制path
												var collapseTriangle = new Konva.Line({
														points: trianglePointArray,
														fill: self.collapseTriangleColor,
														name: 'collapse-triangle ' + triangleClass,
														closed: true,
														id: barcodeTriangleId
												})
												self.layer.add(collapseTriangle)
												triangleObject[barcodeTriangleId] = collapseTriangle
										}
								}
						},
						//	删除不存在的triangle对象
						remove_unexisted_triangle: function (allTrianglePointObj) {
								var self = this
								var triangleObject = self.triangleObject
								self.layer.find('.collapse-triangle').each(function (shape) {
										var barcodeNodeTriangleId = shape.attrs.id
										var barcodeNodeId = barcodeNodeTriangleId.replace('=triangle', '')
										if (typeof (allTrianglePointObj[barcodeNodeId]) === 'undefined') {
												shape.remove()
												delete triangleObject[barcodeNodeTriangleId]
										}
								})
						},
						//	删除不存在的圈选的barcodeTree的label的box
						remove_unexisted_tree_label_box: function (allBoxAttrLabelObject) {
								var self = this
								var selectedTreeLabelBoxObj = self.selectedTreeLabelBoxObj
								var labelBoxLineName = self.labelBoxLineName
								self.layer.find('.' + labelBoxLineName).each(function (shape) {
										var nodeBoxLineId = shape.attrs.id
										if (typeof (allBoxAttrLabelObject[nodeBoxLineId]) === 'undefined') {
												shape.remove()
												delete selectedTreeLabelBoxObj[nodeBoxLineId]
										}
								})
						},
						//	删除不存在的圈选barcodeTree节点的box
						remove_unexisted_tree_node_box: function (allBoxAttrObject) {
								var self = this
								var selectedTreeNodeBoxObj = self.selectedTreeNodeBoxObj
								var nodeBoxLineName = self.nodeBoxLineName
								self.layer.find('.' + nodeBoxLineName).each(function (shape) {
										var nodeBoxLineId = shape.attrs.id
										if (typeof (allBoxAttrObject[nodeBoxLineId]) === 'undefined') {
												shape.remove()
												delete selectedTreeNodeBoxObj[nodeBoxLineId]
										}
								})
						},
						//	删除不存在的diagonal strip的对象
						remove_unexisted_diagonal_strip: function (allDisgonalStripObj) {
								var self = this
								var diagonalStripObject = self.diagonalStripObject
								self.layer.find('.diagonal-strip').each(function (shape) {
										var diagonalStripId = shape.attrs.id
										if (typeof (allDisgonalStripObj[diagonalStripId]) === 'undefined') {
												shape.remove()
												delete diagonalStripObject[diagonalStripId]
										}
								})
						},
						//	删除不存在的tree label对象
						remove_unexisted_tree_label: function (allBarcodeTreeLabelObj) {
								var self = this
								var treeLabelObj = self.treeLabelObj
								self.layer.find('.barcodetree-label').each(function (shape) {
										var barcodeTreeLabelId = shape.id
										if (typeof (allBarcodeTreeLabelObj[barcodeTreeLabelId]) === 'undefined') {
												shape.remove()
												delete treeLabelObj[barcodeTreeLabelId]
										}
								})
						},
						//	删除所有的diagonal strip对象
						remove_all_diagonal_strip: function () {
								var self = this
								self.layer.find('.diagonal-strip').each(function (shape) {
										shape.remove()
								})
						},
						//	绘制diagonal strip
						render_diagonal_strip: function (allDisgonalStripObj) {
								var self = this
								var model = self.model
								var barcodeTreeId = model.get('barcodeTreeId')
								var diagonalStripObject = self.diagonalStripObject
								var addDiagonalStrip = false
								var disgonalStripeImageSources = Variables.get('disgonalStripeImageSources')
								var addedDiagonalStrip = {}
								var disgonalStripNum = 0
								var basedHeight = Variables.get('basedHeight')
								var basedWidth = Variables.get('basedWidth')
								var treeDate = model.get_barcode_tree_date_day()
								//	得到当前的barcodeTree比较的状态
								var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
								for (var diagonalStripId in allDisgonalStripObj) {
										var diagonalStripObj = allDisgonalStripObj[diagonalStripId]
										disgonalStripNum = disgonalStripNum + 1
										var diagonalStripImage = diagonalStripObj.stripeDensityLevel
										if ((self.layer.find('#' + diagonalStripId).length === 0) || (diagonalStripObj.diagonalStripImage !== diagonalStripImage)) {
												self.layer.find('#' + diagonalStripId).each(function (shape) {
														shape.remove()
												})
												//	判断当前的显示状态, 从而计算得到barcodeTree compact的节点的高度
												var diagonalStripNodeHeight = diagonalStripObj.height
												var diagonalStripNodeY = diagonalStripObj.y
												if (barcodeTreeGlobalParas['BarcodeTree_Height_Encoding']) {
														diagonalStripNodeHeight = diagonalStripObj.height_value
														diagonalStripNodeY = diagonalStripObj.y_value
												}
												//  在svg上面绘制path
												var diagonalStrip = new Konva.Rect({
														x: diagonalStripObj.x,
														y: diagonalStripNodeY,
														width: diagonalStripObj.width,
														height: diagonalStripNodeHeight,
														fillPatternImage: disgonalStripeImageSources[diagonalStripImage],
														fillPatternScale: {x: diagonalStripObj.width / basedWidth, y: diagonalStripObj.width / basedWidth},//diagonalStripObj.height / basedHeight
														strokeWidth: self.barcodeNodeStrokeWidth,
														name: 'diagonal-strip',
														id: diagonalStripId
												})
												diagonalStrip.diagonalStripImage = diagonalStripImage
												diagonalStrip.startIndex = diagonalStripObj.startIndex
												diagonalStrip.endIndex = diagonalStripObj.endIndex
												diagonalStrip.attrNum = diagonalStripObj.attrNum
												diagonalStrip.tooltipX = diagonalStripObj.x
												diagonalStrip.tooltipY = diagonalStripNodeY + diagonalStripNodeHeight
												diagonalStripObject[diagonalStripId] = diagonalStrip
												addedDiagonalStrip[diagonalStripId] = diagonalStrip
												addDiagonalStrip = true
												//	在diagonalStrip对象上添加mouseover的事件
												diagonalStrip.on('mouseover', function (e) {
														//	改变鼠标悬停在rect上的cursor
														var diagonalStripObj = e.target
														var tooltipX = diagonalStripObj.tooltipX
														var tooltipY = diagonalStripObj.tooltipY
														self.stage.container().style.cursor = 'pointer'
														var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
														var tooltipText = 'Range:' + diagonalStripObj.startIndex + '-' + diagonalStripObj.endIndex + ', ' + diagonalStripObj.attrNum
																+ ', ' + treeDate.date + ', ' + treeDate.day
														//	显示tooltip
														self.show_tooltip(tooltipX, tooltipY, tooltipText)
														self.trigger_hovering_barcodetree_event(barcodeTreeId)
												})
												diagonalStrip.on('mouseout', function (e) {
														//	改变鼠标离开在rect上的cursor
														self.stage.container().style.cursor = 'default'
														//	隐藏barcodeTree中节点的tooltip
														self.hide_tooltip()
														self.trigger_unhovering_barcodetree_event()
												})
										}
								}
								//	在layer中增加diagonal strip
								if (addDiagonalStrip) {
										for (var diagonalStripId in addedDiagonalStrip) {
												self.layer.add(addedDiagonalStrip[diagonalStripId])
										}
								}
						},
						/**
							* 通过barcodeTree的id获取barcodeTree的model
							*/
						get_barcodetree_model_by_id: function (barcodeTreeId) {
								var self = this
								var collection = window.Datacenter.barcodeCollection
								var barcodeModelFindResults = collection.where({barcodeTreeId: barcodeTreeId})
								if (barcodeModelFindResults.length <= 0) {
										return
								}
								var treeDataModel = barcodeModelFindResults[0]
								return treeDataModel
						},
						/**
							* 折叠全部的子树
							*/
						collapse_all_subtree: function (nodeObj) {
								var self = this
								var barcodeCollection = window.Datacenter.barcodeCollection
								var nodeObjId = nodeObj.id
								var nodeObjDepth = nodeObj.depth
								//	首先将子树的节点折叠之后的位置计算好
								barcodeCollection.collapse_subtree(nodeObjId, nodeObjDepth)
								//	将点击的根节点插入到折叠的数组中
								barcodeCollection.add_to_collapsed_array(nodeObjId)
								//	更新barcodeTree折叠的子树的最大的宽度和高度
								barcodeCollection.update_triangle_max_width_height()
								// //	更新折叠子树的节点数组, 保证在更新视图的时候这部分节点是动画的形式
								// barcodeCollection.add_collapse_nodes()
								//	更新视图
								barcodeCollection.update_data_all_view()
						},
						/**
							* 取消折叠全部的子树
							*/
						uncollapse_all_subtree: function (nodeObj) {
								var self = this
								var barcodeCollection = window.Datacenter.barcodeCollection
								var nodeObjId = nodeObj.id
								var nodeObjDepth = nodeObj.depth
								//	首先将子树的节点取消折叠之后的位置计算好
								barcodeCollection.uncollapse_subtree(nodeObjId, nodeObjDepth)
								//	按照align的顺序更新barcodeTree中节点的位置
								barcodeCollection.update_barcode_node_attr_array()
								//	将点击的根节点从折叠的数组中删除
								barcodeCollection.remove_from_collapsed_array(nodeObjId)
								//	更新barcodeTree折叠的子树的最大的宽度和高度
								barcodeCollection.update_triangle_max_width_height()
								//	删除伸展的子树下方对应的三角形
								self.remove_collapsed_triangle(nodeObjId)
								//	更新视图
								barcodeCollection.update_data_all_view()
								// //	更新折叠子树的节点数组, 后面删除是因为要保证子树的节点全部以动画的形式移动
								// barcodeCollection.remove_uncollapse_nodes(nodeObjId, nodeObjDepth)
						},
						/**
							* 删除折叠子树下方的三角形
							*/
						remove_collapsed_triangle: function (nodeObjId) {
								var self = this
								var triangleObject = self.triangleObject
								var triangleClass = nodeObjId + '=triangle'
								self.layer.find('.' + triangleClass).each(function (shape) {
										shape.remove()
										var triangleId = shape.attrs.id
										delete triangleObject[triangleId]
								})
						},
						/**
							* 删除全部的barcodeModel中的节点
							*/
						remove_all_barcode_model_node: function (barcodeTreeId) {
								var self = this
								self.layer.find('.' + barcodeTreeId).each(function (shape) {
										shape.remove()
								})
						},
						//	高亮鼠标选中的barcodeTree的全部节点
						highlight_mouseover_barcodetree: function (barcodeTreeId) {
								var self = this
								var barcodeNodeColor = self.barcodeNodeColor
								var barcodeLabelColor = 'black'
								self.layer.find('.' + barcodeTreeId).each(function (shape) {
										if (shape.className === "Rect") {
												shape.setFill(barcodeNodeColor)
										} else if (shape.className === "Text") {
												shape.setFill(barcodeLabelColor)
										}
										shape.draw()
								})
						},
						//	取消高亮canvas上全部的barcodeTree中的节点以及label
						unhighlight_all_labels: function () {
								var self = this
								var unHighlightColor = self.unHighlightColor
								//	当window.unhighlight为false, 即节点没有被unhighlight的情况下
								//	首先将全部的节点的颜色设置为#eeeeee
								self.layer.find('.barcodetree-label').each(function (shape) {
										shape.setFill(unHighlightColor)
								})
								self.layer.draw();
						},
						//	高亮canvas上全部的barcodeTree中的节点以及label
						highlight_all_labels: function () {
								var self = this
								var highlightColor = 'black'
								//	当window.unhighlight为false, 即节点没有被unhighlight的情况下
								//	首先将全部的节点的颜色设置为#eeeeee
								self.layer.find('.barcodetree-label').each(function (shape) {
										shape.setFill(highlightColor)
								})
								self.layer.draw();
						},
						//	取消高亮canvas上全部的barcodeTree中的节点以及label
						unhighlight_all_nodes: function () {
								var self = this
								var unHighlightColor = self.unHighlightColor
								//	当window.unhighlight为false, 即节点没有被unhighlight的情况下
								//	首先将全部的节点的颜色设置为#eeeeee
								self.layer.find('.barcode-node').each(function (shape) {
										shape.setFill(unHighlightColor)
										shape.stroke(unHighlightColor)
								})
								self.layer.draw();
						},
						/**
							*  高亮barcodeTree的label
							*/
						highlight_barcodetree_label: function (barcodeTreeId) {
								var self = this
								var barcodeLabelColor = 'black'
								self.layer.find('#' + barcodeTreeId).each(function (shape) {
										if (shape.className === "Text") {
												shape.setFill(barcodeLabelColor)
										}
										shape.draw()
								})
						},
						/**
							* 鼠标离开barcodeTree的节点上的事件
							*/
						barcodenode_mouseout_handler: function () {
								var self = this
								self.layer.find('.hover-line').each(function (shape) {
										shape.remove()
								})
								//	如果存在选择的节点, 那么默认刷新的节点的颜色是unHighlightColor
								// 如果不存在选择的节点, 那么默认刷新节点的颜色是barcodeNodeColor
								// self.recover_unhighlight_node_stroke()
								self.highlight_whole_selected_nodes()
								self.layer.draw()
						},
						/**
							* 恢复到原始的BarcodeTree的stroke的颜色
							*/
						recover_unhighlight_node_stroke: function () {
								var self = this
								var collection = window.Datacenter.barcodeCollection
								var barcodeNodeColor = self.barcodeNodeColor
								if (!collection.is_selected_node_empty()) {
										barcodeNodeColor = self.unHighlightColor
								}
								var barcodeUnexistedNodeColor = self.barcodeUnexistedNodeColor
								var barcodeNodeOpacity = 1
								self.layer.find('.' + self.relatedHighlight).each(function (shape) {
										shape.opacity(barcodeNodeOpacity)
										var barcodeNodeWidth = shape.attrs.width
										if (typeof (shape.attrs.strokeWidth) !== 'undefined') {
												shape.stroke(barcodeUnexistedNodeColor)
												shape.strokeWidth(+barcodeNodeWidth / 10)
												shape.fill('white')
										} else {
												shape.fill(barcodeNodeColor)
										}
								})
						},
						/**
							* 鼠标悬停在barcodeTree的节点上的事件
							*/
						barcodenode_mouseover_handler: function (node) {
								var self = this
								//	barcodeTree中节点的id
								var treeNodeId = node.attrs.id
								var nodeIdArray = treeNodeId.split('=')
								var nodeId = nodeIdArray[0]
								//	取消高亮barcodeTree上的全部节点以及label
								// self.unhighlight_all_nodes()
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								//	发送信号, 发送当前鼠标悬停在的BarcodeTree的id
								// self.recover_unhighlight_node_stroke()
								var nodeObj = treeDataModel.get_node_obj_by_id(nodeId)
								//	显示mouseover的barcode节点的tip
								var model = self.model
								var treeDate = model.get_barcode_tree_date_day()
								var tipText = nodeObj.categoryName + ', ' + nodeObj.num + ', ' + treeDate.date + ', ' + treeDate.day
								var nodeX = node.attrs.x
								var nodeY = node.attrs.y
								var nodeHeight = node.attrs.height
								self.show_tooltip(nodeX, (nodeY + nodeHeight), tipText)
								Variables.set('hoveringBarcodeTreeNode', nodeObj)
								// self.find_highlight_related_node(nodeObj)
						},
						find_highlight_related_node: function (nodeObj) {
								var self = this
								var model = self.model
								var filterBarcodeTreeIdArray = Variables.get('filterBarcodeTreeIdArray')
								var barcodeTreeId = model.get('barcodeTreeId')
								var nodeObj = Variables.get('hoveringBarcodeTreeNode')
								if ((typeof (nodeObj) !== 'undefined') && (nodeObj != null)) {
										var currentModeNodeObj = model.get_node_obj_by_id(nodeObj.id)
										if (typeof (currentModeNodeObj) !== 'undefined') {
												//	找到该节点的相关节点, 然后高亮相关的节点
												if (filterBarcodeTreeIdArray.length == 0) {
														var findingNodesObj = model.find_related_nodes(currentModeNodeObj)
														self.highlight_finding_node(currentModeNodeObj, findingNodesObj, barcodeTreeId)
												}
										}
								} else {
										self.barcodenode_mouseout_handler()
								}
						},
						/**
							* 获取当前视图中使用的paddingNodeArray
							*/
						get_padding_node_array: function (treeDataModel) {
								var self = this
								if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
										var globalPaddingRangeObjArray = treeDataModel.get('globalPaddingRangeObjArray1')
										return globalPaddingRangeObjArray
								} else if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
										var paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
										return paddingNodeObjArray
								}
						},
						/**
							* 删除父亲与孩子之间的连线
							*/
						remove_parent_child_link: function () {
								var self = this
								self.layer.find('.parent-child-link').each(function (shape) {
										shape.remove()
								})
								self.layer.draw()
						},
						/**
							* 高亮全部的barcodeTree中的当前的节点
							*/
						highlight_all_current_node: function (nodeObj) {
								var self = this
								var barcodeNodeColor = self.barcodeNodeColor
								var rectId = nodeObj.id
								self.layer.find('.' + rectId).each(function (shape) {
										shape.fill(barcodeNodeColor)
										shape.draw()
								})
						},
						/**
							* 比较子树的节点
							*/
						highlight_subtree_nodes: function (thisNodeObj, comparedResultsObj, barcodeTreeIndex) {
								var self = this
								var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var sameChildrenNodes = comparedResultsObj.childrenNodes.same
								self.highlightChildrenNodes(sameChildrenNodes, barcodeTreeIndex)
								//	高亮比较得到的增加的节点和删除的节点
								var missChildrenNodes = comparedResultsObj.childrenNodes.miss
								var addChildrenNodes = comparedResultsObj.childrenNodes.add
								if (BarcodeGlobalSetting['Align_Lock']) {
										self.highlightChildrenNodes(missChildrenNodes, barcodeTreeIndex)
										self.highlightChildrenNodes(addChildrenNodes, barcodeTreeIndex)
								} else {
										self.highlightMissedChildrenNodes(missChildrenNodes, barcodeTreeIndex)
										self.highlightAddChildrenNodes(addChildrenNodes, barcodeTreeIndex)
								}
								self.highlight_current_nodes(thisNodeObj, barcodeTreeIndex)
						},
						/**
							* 点选barcodeTree中节点的事件
							*/
						single_click_select_handler: function (nodeData, treeDataModel) {
								var self = this
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeCollection = window.Datacenter.barcodeCollection
								var nodeObjId = nodeData.id
								var nodeObjDepth = nodeData.depth
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								//  根据当前点击是否处于locked的状态决定barcodeTree的点击表现形式
								// if (!BARCODETREE_GLOBAL_PARAS['Align_Lock']) {
								//	当前点击的状态不是align_lock的状态
								if (!barcodeCollection.in_selected_array(barcodeTreeId, nodeObjId)) {
										barcodeCollection.add_selected_node(barcodeTreeId, nodeData)
										//  在增加新的数据之前首先需要删除与当前点击的节点出现重叠的节点, 比如点选节点的孩子节点或者父亲节点
										// barcodeCollection.remove_crossed_node_alignment(nodeObjId)
										self.trigger_remove_all_clicked_tree_labels_nodes_box(nodeObjId)
										self.add_single_box_clicked_tree_labels(nodeObjId)
										self.add_single_box_clicked_tree_nodes(nodeObjId)
								} else {
										var removedNodeObj = {nodeObjId: nodeObjId, nodeObjDepth: nodeObjDepth}
										barcodeCollection.remove_selected_node([removedNodeObj])
										//	将barcodeTree选择的最大层级作为alignedLevel
										self.remove_box_clicked_tree_labels(nodeObjId)
										self.remove_box_clicked_tree_nodes(nodeObjId)
										//	更新sorting视图
										Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_SORTING_VIEW_ICON'], {
												removedNodeObjArray: [removedNodeObj]
										})
								}
								//	高亮选择的节点barcodeTree collection
								Variables.set('barcodeTreeSelectionUpdate', (Variables.get('barcodeTreeSelectionUpdate') + 1) % 2)
								// self.highlight_whole_selected_nodes()
								// self.layer.draw()
						},
						/**
							*
							*/
						highlight_finding_node: function (thisNodeObj, findingNodesObj) {
								var self = this
								var model = self.model
								var childrenNodes = findingNodesObj.childrenNodes
								var fatherCurrentNodes = findingNodesObj.fatherCurrentNodes
								var siblingNodes = findingNodesObj.siblingNodes
								var barcodeTreeIndex = model.get('originalBarcodeIndex')
								self.highlight_current_subtree_nodes(childrenNodes, fatherCurrentNodes, siblingNodes, barcodeTreeIndex)
								self.add_related_nodes_line(thisNodeObj, childrenNodes, fatherCurrentNodes, siblingNodes)
								// collection.each(function (model) {
								// 		var barcodeTreeIndex = model.get('originalBarcodeIndex')
								// 		var thisBarcodeTreeId = model.get('barcodeTreeId')
								// 		if (thisBarcodeTreeId === barcodeTreeId) {
								// 				if (!collection.is_selected_node_empty()) {
								// 						//  只有当前选择的节点不为空时, 其余的节点为unhighlight的状态, 才会高亮当前的节点以及当前节点的孩子节点
								// 						self.highlight_current_subtree_nodes(childrenNodes, fatherCurrentNodes, siblingNodes, barcodeTreeIndex)
								// 				}
								// 				//	在相关的节点上增加line对于相关的节点进行标注
								// 				self.add_related_nodes_line(thisNodeObj, childrenNodes, fatherCurrentNodes, siblingNodes)
								// 		} else if (thisBarcodeTreeId !== barcodeTreeId) {
								// 				//		高亮两个barcodeTree的比较结果
								// 				self.compare_highlight_subtree_nodes(model, barcodeTreeIndex, thisNodeObj, findingNodesObj)
								// 		}
								// 		// if (thisBarcodeTreeId === barcodeTreeId) {
								// 		// 		self.showFatherChildLinks(model, fatherCurrentNodes)
								// 		// }
								// })
								self.layer.draw()
						},
						/**
							* 高亮子树上的全部节点
							*/
						compare_highlight_subtree_nodes: function (model, barcodeTreeIndex, thisNodeObj, findingNodesObj) {
								var self = this
								var collection = window.Datacenter.barcodeCollection
								//	找到在另外的一个model中的相关的节点
								var thisTreeFindingNodesObj = model.find_related_nodes(thisNodeObj)
								if (!collection.is_selected_node_empty()) {
										//  只有当前选择的节点不为空时, 其余的节点为unhighlight的状态, 才会高亮当前的节点以及当前节点的孩子节点
										//	如果该节点不在对齐的范围内, 那么需要将相关的节点取消高亮
										//	在存在选中节点的情况下, 在相关节点的下方增加vertical line
										self.highlight_current_subtree_nodes(thisTreeFindingNodesObj.childrenNodes, thisTreeFindingNodesObj.fatherCurrentNodes,
												thisTreeFindingNodesObj.siblingNodes, barcodeTreeIndex)
								}
								//	高亮其他的barcodeTree上的节点部分
								var thisTreeNodeObj = model.get_node_obj_by_id(thisNodeObj.id)
								if (typeof (thisTreeNodeObj) !== 'undefined') {
										//	在存在选中节点的情况下, 高亮某个节点的相关节点
										self.add_related_nodes_line(thisTreeNodeObj, thisTreeFindingNodesObj.childrenNodes, thisTreeFindingNodesObj.fatherCurrentNodes,
												thisTreeFindingNodesObj.siblingNodes)
								}
								//	高亮与hovering子树的比较结果
								// var comparedResultsObj = model.compareNodes(findingNodesObj, thisTreeFindingNodesObj)
								// self.highlight_subtree_nodes(thisNodeObj, comparedResultsObj, barcodeTreeIndex)
						},
						highlight_current_subtree_nodes: function (childrenNodes, fatherCurrentNodes, siblingNodes, barcodeTreeIndex) {
								var self = this
								self.mouseover_highlightChildrenNodes(childrenNodes, barcodeTreeIndex)
								self.mouseover_highlightFatherAndCurrentNodes(fatherCurrentNodes, barcodeTreeIndex)
								self.highlightSiblingNodes(siblingNodes, barcodeTreeIndex)
						},
						add_related_nodes_line: function (thisNodeObj, childrenNodes, fatherCurrentNodes, siblingNodes) {
								var self = this
								self.add_children_hover_horizontal_line(childrenNodes)
								self.add_father_current_horizontal_line(fatherCurrentNodes)
								self.add_sibling_hover_vertical_line(siblingNodes)
								self.add_hover_vertical_line(thisNodeObj)
						},
						showFatherChildLinks: function (model, fatherNodesArray) {
								var self = this
								var beginX = 0
								var endX = 0
								//	barcodeTreeYLocation是barcodeTree的距离上边界的距离
								var barcodeTreeYLocation = model.get('barcodeTreeYLocation')
								//	barcodePaddingTop是在barcodeTree的内部距离上边界的距离
								var barcodePaddingTop = model.get('barcodePaddingTop')
								//	对于具体的barcodeTree中的节点的纵坐标位置
								var barcodeTreeNodePaddingTop = barcodeTreeYLocation + barcodePaddingTop
								//	 barcodeTreeNodePaddingLeft是barcodeTree的最左侧节点距离屏幕左侧边界的距离
								var barcodeTreeNodePaddingLeft = self.barcodeTreeNodePaddingLeft
								//  只有在对齐的情况下才会绘制从根节点到当前节点的连接线
								for (var fI = 0; fI < fatherNodesArray.length; fI++) {
										if (fatherNodesArray[fI].width !== 0) {
												beginX = fatherNodesArray[fI].x + fatherNodesArray[fI].width / 2
												break
										}
								}
								for (var fI = (fatherNodesArray.length - 1); fI >= 0; fI--) {
										if (fatherNodesArray[fI].width !== 0) {
												endX = fatherNodesArray[fI].x + fatherNodesArray[fI].width / 2
												break
										}
								}
								var barcodeHeight = window.barcodeHeight
								var centerY = barcodeHeight / 2 - barcodePaddingTop + barcodeTreeNodePaddingTop
								var strokeWidth = barcodeHeight / 10
								var radius = barcodeHeight / 10
								beginX = beginX + barcodeTreeNodePaddingLeft
								endX = endX + barcodeTreeNodePaddingLeft
								var blueLine = new Konva.Line({
										points: [beginX, centerY, endX, centerY],
										stroke: 'black',
										strokeWidth: strokeWidth,
										name: 'parent-child-link'
								})
								self.layer.add(blueLine);
								blueLine.draw()
								for (var fI = 0; fI < fatherNodesArray.length; fI++) {
										if (fatherNodesArray[fI].width !== 0) {
												var circleX = fatherNodesArray[fI].x + fatherNodesArray[fI].width / 2
												var circleY = centerY
												circleX = circleX + barcodeTreeNodePaddingLeft
												var circle = new Konva.Circle({
														x: circleX,
														y: circleY,
														radius: radius,
														fill: 'black',
														stroke: 'steelblue',
														strokeWidth: 0.5,
														name: 'parent-child-link'
												});
												self.layer.add(circle);
												circle.draw()
										}
								}
						},
						/**
							* 高亮某个barcodeTree中的节点
							*/
						highlight_current_nodes: function (thisNodeObj, barcodeTreeIndex) {
								var self = this
								var barcodeNodeColor = self.color_handler(thisNodeObj)
								var relatedHighlight = self.relatedHighlight
								var barcodeNodeId = thisNodeObj.id + '=' + barcodeTreeIndex
								self.layer.find('#' + barcodeNodeId).each(function (shape) {
										if (shape.existed) {
												shape.fill(barcodeNodeColor)
												shape.stroke(barcodeNodeColor)
										} else {
												shape.fill('white')
												shape.stroke(self.unHighlightColor)
										}
										shape.addName(relatedHighlight)
								})
						},
						add_hover_line: function (nodeArrray) {
								var self = this
								var model = self.model
								//	barcodeTree中在padding范围的起始节点id的数组
								var paddingStartIdArray = model.get('padding_start_id_array')
								//	barcodeTree中在padding范围的节点id的数组
								var paddingRangeIdArray = model.get('padding_range_id_array')
								if (nodeArrray.length > 0) {
										var lineStartX = nodeArrray[0].x + self.barcodeTreeNodePaddingLeft
										var lineEndX = nodeArrray[nodeArrray.length - 1].x + nodeArrray[nodeArrray.length - 1].width + self.barcodeTreeNodePaddingLeft
										var startPaddingState = self.barcodetree_node_filter(nodeArrray[0], paddingStartIdArray, paddingRangeIdArray)
										var endPaddingState = self.barcodetree_node_filter(nodeArrray[nodeArrray.length - 1], paddingStartIdArray, paddingRangeIdArray)
										if ((!startPaddingState) && (!endPaddingState)) {
												var lineY = +window.barcodeHeight * 0.9
												var hoverLine = new Konva.Line({
														points: [lineStartX, lineY, lineEndX, lineY],
														stroke: self.hoverLineColor,
														strokeWidth: self.hoveringLineStrokeWidth,
														name: 'hover-line'
												})
												self.layer.add(hoverLine)
										}
								}
						},
						add_hover_vertical_line: function (nodeObj) {
								var self = this
								var model = self.model
								//	barcodeTree中在padding范围的起始节点id的数组
								var paddingStartIdArray = model.get('padding_start_id_array')
								//	barcodeTree中在padding范围的节点id的数组
								var paddingRangeIdArray = model.get('padding_range_id_array')
								var hoveringCircleColor = self.barcodeSiblingNodeColor
								var hoveringVerticalLineLength = self.hoveringVerticalLineLength
								var lineX = nodeObj.x + nodeObj.width / 2 + self.barcodeTreeNodePaddingLeft
								var lineStartY = window.barcodeHeight - window.barcodeHeight * 0.2
								var lineEndY = lineStartY + hoveringVerticalLineLength
								//	判断节点是否在padding的范围内
								var paddingState = self.barcodetree_node_filter(nodeObj, paddingStartIdArray, paddingRangeIdArray)
								if (!paddingState) {
										var hoverVerticalLine = new Konva.Line({
												points: [lineX, lineStartY, lineX, lineEndY],
												stroke: self.hoverLineColor,
												strokeWidth: self.hoveringLineStrokeWidth,
												name: 'hover-line'
										})
										self.layer.add(hoverVerticalLine)
								}
						},
						//	高亮当前节点的孩子节点中缺失的部分
						highlightMissedChildrenNodes: function (missChildrenNodes, barcodeTreeIndex) {
								var self = this
								var relatedHighlight = self.relatedHighlight
								var barcodeMissingNodeColor = self.barcodeMissingNodeColor
								var barcodeNodeStrokeWidth = self.barcodeNodeStrokeWidth
								// var barcodeNodeColor = self.barcodeNodeColor
								for (var cI = 0; cI < missChildrenNodes.length; cI++) {
										var missingNode = missChildrenNodes[cI]
										var rectId = missingNode.id + '=' + barcodeTreeIndex
										self.layer.find('#' + rectId).each(function (shape) {
												var nodeWidth = shape.attrs.width
												shape.stroke(barcodeMissingNodeColor)
												shape.strokeWidth(barcodeNodeStrokeWidth)
												shape.fill('white')
												shape.addName(relatedHighlight)
										})
								}
						},
						//	高亮当前节点的孩子节点中增加的部分
						highlightAddChildrenNodes: function (addChildrenNodes, barcodeTreeIndex) {
								var self = this
								var barcodeAddNodeColor = self.barcodeAddNodeColor
								var relatedHighlight = self.relatedHighlight
								var barcodeNodeStrokeWidth = self.barcodeNodeStrokeWidth
								for (var cI = 0; cI < addChildrenNodes.length; cI++) {
										var addNode = addChildrenNodes[cI]
										var rectId = addNode.id + '=' + barcodeTreeIndex
										self.layer.find('#' + rectId).each(function (shape) {
												shape.fill(barcodeAddNodeColor)
												shape.addName(relatedHighlight)
												shape.stroke(barcodeAddNodeColor)
												shape.strokeWidth(barcodeNodeStrokeWidth)
										})
								}
						},
						//	高亮某个节点的孩子节点部分
						add_children_hover_horizontal_line: function (childrenNodes) {
								var self = this
								var subtreeNodeArray2 = segment_children_node_array(childrenNodes)
								for (var sI = 0; sI < subtreeNodeArray2.length; sI++) {
										var subtreeChildrenNodes = subtreeNodeArray2[sI]
										self.add_hover_line(subtreeChildrenNodes)
								}

								//	将children节点的数组进行分段
								function segment_children_node_array(childrenNodesArray) {
										var segmentNodeArray2 = []
										if (childrenNodes.length > 0) {
												var segmentStartIndex = 0
												var subtreeDepth = childrenNodesArray[0].depth
												for (var cI = 1; cI < childrenNodesArray.length; cI++) {
														var childNodeObj = childrenNodesArray[cI]
														if (childNodeObj.depth === subtreeDepth) {
																var segmentEndIndex = cI - 1
																var segmentNodeArray = extract_node_array(childrenNodesArray, segmentStartIndex, segmentEndIndex)
																segmentNodeArray2.push(segmentNodeArray)
																segmentStartIndex = cI
														}
														if (cI === (childrenNodesArray.length - 1)) {
																var segmentEndIndex = cI
																var segmentNodeArray = extract_node_array(childrenNodesArray, segmentStartIndex, segmentEndIndex)
																segmentNodeArray2.push(segmentNodeArray)
														}
												}
										}
										return segmentNodeArray2
								}

								//	提取children的节点
								function extract_node_array(childrenNodesArray, segmentStartIndex, segmentEndIndex) {
										var extractNodeArray = []
										for (var sI = segmentStartIndex; sI <= segmentEndIndex; sI++) {
												extractNodeArray.push(childrenNodesArray[sI])
										}
										return extractNodeArray
								}
						},
						/**
							* 鼠标悬停高亮孩子节点
							*/
						mouseover_highlightChildrenNodes: function (childrenNodes, barcodeTreeIndex) {
								var self = this
								var relatedHighlight = self.relatedHighlight
								var unHighlightColor = self.unHighlightColor
								for (var cI = 0; cI < childrenNodes.length; cI++) {
										var childNode = childrenNodes[cI]
										// var barcodeNodeColor = self.barcodeNodeColor
										var barcodeNodeColor = self.color_handler(childNode)
										var rectId = childNode.id + '=' + barcodeTreeIndex
										self.layer.find('#' + rectId).each(function (shape) {
												var previousColor = shape.fill()
												//	只有在当前节点处于unhighlight的状态时, 才会高亮
												if (previousColor === unHighlightColor) {
														if (shape.existed) {
																shape.fill(barcodeNodeColor)
																shape.stroke(barcodeNodeColor)
														} else {
																shape.fill('white')
																shape.stroke(self.unHighlightColor)
														}
														shape.addName(relatedHighlight)
												}
										})
								}
						},
						//	鼠标悬停高亮父亲以及当前节点, 父亲节点一定是存在的
						mouseover_highlightFatherAndCurrentNodes: function (fatherCurrentNodes, barcodeTreeIndex) {
								var self = this
								var relatedHighlight = self.relatedHighlight
								var unHighlightColor = self.unHighlightColor
								for (var cI = 0; cI < fatherCurrentNodes.length; cI++) {
										var addNode = fatherCurrentNodes[cI]
										var barcodeNodeColor = self.color_handler(fatherCurrentNodes[cI])
										var rectId = addNode.id + '=' + barcodeTreeIndex
										self.layer.find('#' + rectId).each(function (shape) {
												var previousColor = shape.fill()
												//	只有在当前节点处于unhighlight的状态时, 才会高亮
												if (previousColor === unHighlightColor) {
														shape.fill(barcodeNodeColor)
														shape.stroke(barcodeNodeColor)
														shape.addName(relatedHighlight)
												}
										})
								}
						},
						/**
							* 高亮当前节点的孩子节点中相同的部分, 只有在当前的节点颜色为unhighlight的颜色时才会改变颜色 => 需要增加判断条件
							* 否则节点的颜色为比较的绿色或者表示属性值的颜色时, mouseover会导致颜色的变化
							*/
						highlightChildrenNodes: function (childrenNodes, barcodeTreeIndex) {
								var self = this
								var relatedHighlight = self.relatedHighlight
								for (var cI = 0; cI < childrenNodes.length; cI++) {
										var childNode = childrenNodes[cI]
										// var barcodeNodeColor = self.barcodeNodeColor
										var barcodeNodeColor = self.color_handler(childNode)
										var rectId = childNode.id + '=' + barcodeTreeIndex
										self.layer.find('#' + rectId).each(function (shape) {
												if (shape.existed) {
														shape.fill(barcodeNodeColor)
														shape.stroke(barcodeNodeColor)
												} else {
														shape.fill('white')
														shape.stroke(self.unHighlightColor)
												}
												shape.addName(relatedHighlight)
										})
								}
						},
						//	高亮当前节点的父亲节点以及当前节点
						add_father_current_horizontal_line: function (fatherCurrentNodes) {
								var self = this
								//	数组中的第1个是当前hover的节点
								for (var cI = 0; cI < fatherCurrentNodes.length; cI++) {
										self.add_hover_line([fatherCurrentNodes[cI]])
								}
						},
						//	高亮当前节点的父亲节点以及当前节点, 父亲节点一定是存在的
						highlightFatherAndCurrentNodes: function (fatherCurrentNodes, barcodeTreeIndex) {
								var self = this
								var relatedHighlight = self.relatedHighlight
								for (var cI = 0; cI < fatherCurrentNodes.length; cI++) {
										var addNode = fatherCurrentNodes[cI]
										var barcodeNodeColor = self.color_handler(fatherCurrentNodes[cI])
										var rectId = addNode.id + '=' + barcodeTreeIndex
										self.layer.find('#' + rectId).each(function (shape) {
												shape.fill(barcodeNodeColor)
												shape.stroke(barcodeNodeColor)
												shape.addName(relatedHighlight)
										})
								}
						},
						//	高亮当前节点的父亲节点以及当前节点
						add_sibling_hover_vertical_line: function (siblingNodes) {
								var self = this
								for (var cI = 0; cI < siblingNodes.length; cI++) {
										self.add_hover_vertical_line(siblingNodes[cI])
								}
						},
						//	高亮当前节点的父亲节点以及当前节点
						highlightSiblingNodes: function (siblingNodes, barcodeTreeIndex) {
								var self = this
								var relatedHighlight = self.relatedHighlight
								var unHighlightColor = self.unHighlightColor
								for (var cI = 0; cI < siblingNodes.length; cI++) {
										var siblingNode = siblingNodes[cI]
										var barcodeNodeColor = self.color_handler(siblingNodes[cI])
										var rectId = siblingNode.id + '=' + barcodeTreeIndex
										self.layer.find('#' + rectId).each(function (shape) {
												var previousColor = shape.fill()
												//	只有在当前节点处于unhighlight的状态时, 才会高亮
												if (previousColor === unHighlightColor) {
														shape.fill(barcodeNodeColor)
														shape.stroke(barcodeNodeColor)
														shape.addName(relatedHighlight)
												}
										})
								}
						},
						/**
							* 获取当前的视图中使用的barcodeNodeArray
							*/
						get_barcode_node_array: function () {
								var self = this
								var treeDataModel = self.model
								if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
										//  切换到原始的barcodeTree的compact的显示模式
										var compactBarcodeNodeAttrArrayObj = treeDataModel.get('compactBarcodeNodeAttrArrayObj')
										barcodeNodeAttrArray = compactBarcodeNodeAttrArrayObj['compact-0']
								} else if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
										//  切换到原始的barcodeTree的显示模式
										var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
								}
								return barcodeNodeAttrArray
						},
						/**
							* 判断barcodetree中的节点是否被过滤的函数
							*/
						barcodetree_node_filter: function (d, paddingStartIdArray, paddingRangeIdArray) {
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								//	筛选在compact状态下, 并且处于padding范围内的节点
								var compactPaddingState = BARCODETREE_GLOBAL_PARAS['Subtree_Compact'] && ((paddingStartIdArray.indexOf(d.id) !== -1) || (paddingRangeIdArray.indexOf(d.id) !== -1))
								return compactPaddingState
						},
						/**
							* 计算barcode节点的高度y的数值
							*/
						y_handler: function (d) {
								if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
										var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
										//  barcodeTree的原始显示模式
										if (barcodeTreeGlobalParas['BarcodeTree_Height_Encoding']) {
												if (typeof (d.height_value) === 'undefined') {
														return +d.height
												}
												//	如果节点不存在, 那么节点的纵坐标为0
												if (!d.existed) {
														return 0
												}
												return (+d.height) - (+d.height_value)
										} else if (!barcodeTreeGlobalParas['BarcodeTree_Height_Encoding']) {
												return 0
										}
								} else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
										//  barcodeTree的compact的显示模式
										return d.y
								}
						},
						get_color_by_shape_id: function (nodeIdTreeIndex, barcodeNodeAttrArrayObj, barcodeTreeGlobalParas) {
								var self = this
								var nodeIdAttrArray = nodeIdTreeIndex.split('=')
								var nodeId = nodeIdAttrArray[0]
								var barcodeNodeColor = self.barcodeNodeColor
								if (((typeof (barcodeNodeAttrArrayObj[nodeId])) !== 'undefined') && (barcodeTreeGlobalParas['BarcodeTree_Color_Encoding'])) {
										var nodeColor = barcodeNodeAttrArrayObj[nodeId].color_value
										if (typeof (nodeColor) !== 'undefined') {
												barcodeNodeColor = nodeColor
										}
								}
								return barcodeNodeColor
						},
						/**
							* barcodeTree的颜色的handler
							*/
						color_handler: function (d) {
								var self = this
								var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
								//  barcodeTree的原始显示模式
								if (barcodeTreeGlobalParas['BarcodeTree_Color_Encoding']) {
										return d.color_value
								} else if (!barcodeTreeGlobalParas['BarcodeTree_Color_Encoding']) {
										return self.barcodeNodeColor
								}
						},
						/**
							* 高度的handler
							*/
						height_handler: function (d) {
								var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
								if (barcodeTreeGlobalParas['BarcodeTree_Height_Encoding']) {
										if (typeof (d.height_value) === 'undefined') {
												return 0
										}
										if (!d.existed) {
												return d.height
										}
										return d.height_value
								} else if (!barcodeTreeGlobalParas['BarcodeTree_Height_Encoding']) {
										return +d.height
								}
						},
						/**
							* 使用tooltip的形式显示barcodeNode节点的信息
							*/
						show_tooltip: function (tip_left, tip_top, tip_content) {
								var self = this
								var barcodeModel = self.model
								var superTreeViewHeight = +$('#supertree-scroll-panel').height()
								var barcodeTreeYLocation = +barcodeModel.get('barcodeTreeYLocation')
								var barcodePaddingTop = +barcodeModel.get('barcodePaddingTop')
								//	计算tooltip的纵坐标的位置
								//	self.barcodeViewTop是整个barcodeTree视图距离上方的距离
								//	barcodeTreeYLocation是当前的barcodeTree距离上边界的距离
								// barcodePaddingTop是barcodeTree的内部, 节点距离上边界的距离
								var barcodeTreeScrollTop = +$('#barcodetree-scrollpanel').scrollTop()
								var barcodeTreeScrollLeft = +$('#barcodetree-scrollpanel').scrollLeft()
								var brushScrollViewWidth = +$('#brush-scroll-view').width()
								tip_top = tip_top + self.barcodeViewTop + barcodePaddingTop + barcodeTreeYLocation +
										superTreeViewHeight - barcodeTreeScrollTop + barcodeHeight * Variables.get('barcodePaddingBottomRatio')
								$('#tooltip-view').html(tip_content)
								var tooltipViewWidth = +$('#tooltip-view')[0].clientWidth
								tip_left = tip_left - tooltipViewWidth - barcodeTreeScrollLeft + brushScrollViewWidth
								tip_left = tip_left < 0 ? 0 : tip_left
								$('#tooltip-view').css('visibility', 'visible')
								$('#tooltip-view').css('left', tip_left + 'px')
								$('#tooltip-view').css('top', tip_top + 'px')

						},
						/**
							* 将tooltip进行隐藏
							*/
						hide_tooltip: function () {
								$('#tooltip-view').css('visibility', 'hidden')
						}
				})
		)
})
