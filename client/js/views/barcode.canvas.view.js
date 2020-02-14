define([
		'require',
		'marionette',
		'underscore',
		'jquery',
		'backbone',
		'd3',
		'konva',
		'datacenter',
		'config',
		'variables',
		'text!templates/barcode.canvas.tpl'
], function (require, Mn, _, $, Backbone, d3, Konva, Datacenter, Config, Variables, Tpl) {
		'use strict'
		//  barcode.view中包含三个视图, 分别是比较barcodeTree的主视图, barcode的superTree视图, barcode的参数控制视图
		return Mn.LayoutView.extend({
				tagName: 'div',
				template: _.template(Tpl),
				regions: {
						'container': '#knova-container'
				},
				default: {
						stage: null,
				},
				attributes: {
						'style': 'height: 100%; width: 100%',
				},
				events: {},
				init_event: function () {
						var self = this
						//	更新barcodeTree的视图
						Backbone.Events.on(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'], function () {
								self.render_barcodetree_collection()
						})
						//	通过点击barcodeTree的柱状图, 删除barcodeTree中的节点
						Backbone.Events.on(Config.get('EVENTS')['REMOVE_BARCODE_NODE'], function (event) {
								var barcodeTreeIdArray = event.barcodeTreeIdArray
								self.remove_barcode_node(barcodeTreeIdArray)
						})
						//	监听barcodeTree视图的高度与宽度的变化
						self.listenTo(Variables, 'change:barcodeNodexMaxX', self.update_barcode_view_width)
						self.listenTo(Variables, 'change:barcodeNodeyMaxY', self.update_barcode_view_height)
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
				//	更新barcodeTree视图的宽度
				update_barcode_view_width: function () {
						var self = this
						var barcodeNodexMaxX = +Variables.get('barcodeNodexMaxX')
						var stage = self.stage
						stage.width(barcodeNodexMaxX)
				},
				//	更新barcodeTree视图的高度
				update_barcode_view_height: function () {
						var self = this
						var barcodeNodeYMaxY = Variables.get('barcodeNodeyMaxY')
						var stage = self.stage
						stage.height(barcodeNodeYMaxY)
				},
				initialize: function () {
						var self = this
						self.init_paras()
						self.init_event()
				},
				//	初始化视图中的参数
				init_paras: function () {
						var self = this
						var collection = self.options.barcodeCollection
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
						self.barcodeUnexistedNodeStrokeColor = Variables.get('barcodeUnexistedNodeStrokeColor')
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
				},
				//	更新视图的参数
				update_paras: function () {
						var self = this
						self.hoveringVerticalLineLength = window.barcodeHeight * 0.2
				},
				/**
					* 用户取消选择histogram的柱形, 即删除barcodeTree的节点
					*/
				remove_barcode_node: function (barcodeTreeIdArray) {
						var self = this
						for (var bI = 0; bI < barcodeTreeIdArray.length; bI++) {
								var barcodeTreeId = barcodeTreeIdArray[bI]
								self.layer.find('.' + barcodeTreeId).each(function (shape) {
										var barcodeNodeId = shape.attrs.id
										delete self.rectObject[barcodeNodeId]
										shape.remove()
								})
						}
						self.layer.draw()
				},
				onShow: function () {
						var self = this
						var width = $('#knova-container').width()
						var height = $('#knova-container').height()
						var stage = new Konva.Stage({
								container: 'knova-container',
								width: width,
								height: height
						})
						self.stage = stage
						var layer = new Konva.Layer()
						stage.add(layer)
						self.layer = layer
						var beginRenderTime = +new Date()
						self.render_barcodetree_collection()
						var endRenderTime = +new Date()
						var tooltipLayer = new Konva.Layer()
						self.tooltipLayer = tooltipLayer
						//	在barcodeTree的stage上层增加tooltip的layer
						self.render_tooltip()
						//	在barcodeTree的layer层增加hovering的tooltip
						self.add_layer_mouseover_event()
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
				render_barcodetree_collection: function () {
						var self = this
						var collection = self.options.barcodeCollection
						var tweenDuration = self.tweenDuration
						//	重新更新barcodeTree中的参数
						self.update_paras()
						var layer = self.layer
						//	如果存在选择的节点, 那么默认刷新的节点的颜色是unHighlightColor
						// 如果不存在选择的节点, 那么默认刷新节点的颜色是barcodeNodeColor
						var barcodeNodeColor = self.barcodeNodeColor
						if (!collection.is_selected_node_empty()) {
								barcodeNodeColor = self.unHighlightColor
						}
						//	 barcodeTreeNodePaddingLeft是barcodeTree的最左侧节点距离屏幕左侧边界的距离
						var barcodeTreeNodePaddingLeft = self.barcodeTreeNodePaddingLeft
						//		barcodeTree中不存在的节点的stroke的颜色
						var barcodeUnexistedNodeStrokeColor = self.barcodeUnexistedNodeStrokeColor
						//	存储barcodeTree中的label的对象
						var tweenObject = {}
						var sumNodeNum = 0
						var tweenDeferArray = []
						var tweenDeferIndex = 0
						var alignedLevel = Variables.get('alignedLevel')
						collection.each(function (model) {
								//	barcodeTree的索引值
								var barcodeTreeIndex = model.get('originalBarcodeIndex')
								//	barcodeTree的id
								var barcodeTreeId = model.get('barcodeTreeId')
								//	barcodeTree中的节点数组
								var barcodeNodeArray = self.get_barcode_node_array(model)
								//	barcodeTreeYLocation是barcodeTree的距离上边界的距离
								var barcodeTreeYLocation = model.get('barcodeTreeYLocation')
								//	barcodePaddingTop是在barcodeTree的内部距离上边界的距离
								var barcodePaddingTop = model.get('barcodePaddingTop')
								//	对于具体的barcodeTree中的节点的纵坐标位置
								var barcodeTreeNodePaddingTop = barcodeTreeYLocation + barcodePaddingTop
								//	barcodeTree中在padding范围的起始节点id的数组
								var paddingStartIdArray = model.get('global_padding_start_id_array')
								//	barcodeTree中在padding范围的节点id的数组
								var paddingRangeIdArray = model.get('global_padding_range_id_array')
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
								self.layer.draw()
								//	将所有的节点都存储到rectObject对象中
								//	为什么节点无法删除的原因是在节点数组中已经不存在这些对齐部分的节点, 所以无法再次选中他们
								for (var rI = 0; rI < barcodeNodeArray.length; rI++) {
										sumNodeNum = sumNodeNum + barcodeNodeArray.length
										var barcodeNodeObj = barcodeNodeArray[rI]
										//	barcodeTree中节点的id, 在节点的id中增加barcodeTree的index数值
										var barcodeNodeId = barcodeNodeObj.id + '=' + barcodeTreeIndex
										//	筛选不属于padding范围的节点, padding指的是节点被收缩的范围
										if (self.barcodetree_node_filter(barcodeNodeObj, paddingStartIdArray, paddingRangeIdArray)) {
												//	计算得到的每个节点的高度
												var nodeHeight = self.height_handler(barcodeNodeObj)
												//	计算得到的每个节点的纵坐标
												var nodeY = self.y_handler(barcodeNodeObj)
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
														//	如果节点收缩, 那么节点的opacity为0
														var nodeOpacity = 0
														if (barcodeNodeObj.width !== 0) {
																nodeOpacity = 1
														}
														if (is_attr_different(self.rectObject[barcodeNodeId], barcodeNodeObj, nodeY, nodeHeight,
																		barcodeTreeNodePaddingTop, barcodeTreeNodePaddingLeft)) {
																//	节点在aligned范围内需要使用tween进行过渡
																var tween = new Konva.Tween({
																		node: self.rectObject[barcodeNodeId],
																		duration: tweenDuration,
																		easing: Konva.Easings.EaseInOut,
																		x: +barcodeTreeNodePaddingLeft + barcodeNodeObj.x,
																		y: barcodeTreeNodePaddingTop + nodeY,
																		width: +barcodeNodeObj.width,
																		height: nodeHeight,
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
														} else {
																tweenDeferArray[tweenDeferIndex].resolve()
														}
														tweenDeferIndex = tweenDeferIndex + 1
												}
												else {
														//	否则直接在canvas上新增加节点
														var rect = null
														if (barcodeNodeObj.existed) {
																//	如果节点存在, 那么按照正常的绘制方式绘制barcodeTree中的节点
																rect = new Konva.Rect({
																		x: +barcodeTreeNodePaddingLeft + barcodeNodeObj.x,
																		y: barcodeTreeNodePaddingTop + nodeY,
																		width: +barcodeNodeObj.width,
																		height: nodeHeight,
																		fill: barcodeNodeColor,
																		name: 'barcode-node ' + barcodeNodeObj.id + ' ' + barcodeTreeId,
																		id: barcodeNodeId
																})
																rect.show_tooltip = true
																rect.existed = true
														} else if (barcodeNodeObj.depth <= alignedLevel) {
																//	如果节点不存在, 那么将比aligned层级更深的节点变成空心的节点
																rect = new Konva.Rect({
																		x: +barcodeTreeNodePaddingLeft + barcodeNodeObj.x,
																		y: barcodeTreeNodePaddingTop + nodeY,
																		width: +barcodeNodeObj.width,
																		height: nodeHeight,
																		stroke: barcodeUnexistedNodeStrokeColor,
																		fill: 'white',
																		strokeWidth: +barcodeNodeObj.width / 10,
																		name: 'barcode-padding-node ' + barcodeNodeObj.id + ' ' + barcodeTreeId,
																		id: barcodeNodeId
																})
																rect.show_tooltip = false
																rect.existed = false
														}
														//	判断点击的矩形是否为null
														if (rect != null) {
																rect.on('mouseover', function (e) {
																		//	改变鼠标悬停在rect上的cursor
																		self.stage.container().style.cursor = 'pointer'
																		var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
																		self.barcodenode_mouseover_handler(this)
																		//	发送信号, 发送当前鼠标悬停在的BarcodeTree的id
																		self.trigger_hovering_barcodetree_event(barcodeTreeId)
																})
																rect.on('mouseout', function (e) {
																		//	改变鼠标离开在rect上的cursor
																		self.stage.container().style.cursor = 'default'
																		// self.barcodenode_mouseout_handler(this)
																		//	当前的状态是取消其他节点的高亮状态
																		// self.highlight_barcodetree_node()
																		self.trigger_unhovering_barcodetree_event()
																		self.barcodenode_mouseout_handler()
																		//	删除hovering节点上增加的stroke
																		// self.remove_hovering_node_stroke(e, self)
																})
																//	设置的点击的时间 间隔的函数
																var timeoutID = null
																//	标记点击次数的变量
																var a = 0
																rect.on("click", function (e) {
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
																self.rectObject[barcodeNodeId] = rect
														}
												}
										}
								}
						})
						//	重新绘制barcodeTree的文本
						var allBarcodeTreeLabelObj = collection.get_barcode_tree_label_obj()
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
						var allTrianglePointObj = collection.get_collapsed_triangle_point_array()
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
						var allDisgonalStripObj = collection.get_all_diagonal_strip_obj()
						self.remove_unexisted_diagonal_strip(allDisgonalStripObj)
						var diagonalStripObject = self.diagonalStripObject
						for (var diagonalStripId in allDisgonalStripObj) {
								var diagonalStripShape = diagonalStripObject[diagonalStripId]
								if (typeof (diagonalStripShape) !== 'undefined') {
										var deferObj = $.Deferred()
										tweenDeferArray.push(deferObj)
								}
						}
						for (var diagonalStripId in allDisgonalStripObj) {
								var diagonalStripObj = allDisgonalStripObj[diagonalStripId]
								var diagonalStripShape = diagonalStripObject[diagonalStripId]
								if (typeof (diagonalStripShape) !== 'undefined') {
										var diagonalStripTween = new Konva.Tween({
												node: diagonalStripShape,
												duration: tweenDuration,
												easing: Konva.Easings.EaseInOut,
												x: diagonalStripObj.x,
												y: diagonalStripObj.y,
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
						var allBoxAttrObject = collection.get_all_box_attr_obj()
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
										var boxAttr = allBoxAttrObject[selectedTreeNodeBoxId]
										var treeNodeBoxTween = new Konva.Tween({
												node: selectedTreeNodeBoxShape,
												points: [boxAttr.left, boxAttr.top, boxAttr.left, boxAttr.bottom, boxAttr.right, boxAttr.bottom, boxAttr.right, boxAttr.top, boxAttr.left, boxAttr.top],
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
						var allBoxAttrLabelObject = collection.get_all_box_label_obj()
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
						//	重新绘制整个视图
						self.layer.draw()
						//	结束defer的监听函数
						$.when.apply(null, tweenDeferArray).done(function () {
								//	在播放完成动画之后, 渲染其他的节点, 防止遮挡, 同时也减少动画播放过程中其他部分的选他
								// console.log('self.rectObject', JSON.parse(JSON.stringify(self.rectObject)))
								//	删除非动画部分的节点, 并且返回该部分节点的id, 如果不存在
								// self.remove_all_nodes(tweenObject)
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
								//	删除全部的barcodeTree中的label
								self.highlight_whole_selected_nodes()
								//	增加barcodeTree的label
								self.render_barcodetree_label(allBarcodeTreeLabelObj)
								//	增加点击选择的子树的标记
								self.render_subtree_triangle(allTrianglePointObj)
								//	增加diagonal Strip的标记
								self.render_diagonal_strip(allDisgonalStripObj)
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
						//	单击节点的响应事件
						function single_click_handler(e) {
								//	在barcodeTree中节点上的点击选择事件
								var nodeBarcodeTreeId = e.target.attrs.id
								var nodeIdArray = nodeBarcodeTreeId.split('=')
								var nodeId = nodeIdArray[0]
								var treeDataModel = self.model
								var nodeObj = treeDataModel.get_node_obj_by_id(nodeId)
								//	在barcodeTree中点击选择的事件
								self.single_click_select_handler(nodeObj, treeDataModel)
						}

						//	双击节点的响应事件
						function double_click_handler(e) {
								var nodeBarcodeTreeId = e.target.attrs.id
								var nodeIdArray = nodeBarcodeTreeId.split('=')
								var nodeId = nodeIdArray[0]
								var barcodeNodeName = e.target.attrs.name
								var barcodeNodeNameAttrArray = barcodeNodeName.split(' ')
								//	barcodeTree中节点的id
								var barcodeTreeId = barcodeNodeNameAttrArray[self.barcodeTreeIdIndex]
								var barcodeModelFindResults = collection.where({barcodeTreeId: barcodeTreeId})
								if (barcodeModelFindResults.length <= 0) {
										return
								}
								var treeDataModel = barcodeModelFindResults[0]
								var nodeObj = treeDataModel.get_node_obj_by_id(nodeId)
								var collapsedNodeIdArray = collection.collapsedNodeIdArray
								if (collapsedNodeIdArray.indexOf(nodeObj.id) === -1) {
										self.collapse_all_subtree(nodeObj)
								} else {
										self.uncollapse_all_subtree(nodeObj)
								}
						}

						// 判断点击的节点与rectObj是不是具有相同的属性
						function is_attr_different(rectObjectShape, barcodeNodeObj, nodeY, nodeHeight, barcodeTreeNodePaddingTop, barcodeTreeNodePaddingLeft) {
								var nodeX = +barcodeTreeNodePaddingLeft + barcodeNodeObj.x
								var nodeY = +barcodeTreeNodePaddingTop + nodeY
								var nodeWidth = +barcodeNodeObj.width
								var nodeHeight = +nodeHeight
								var shapeAttr = rectObjectShape.attrs
								var shapeX = +shapeAttr.x
								var shapeY = +shapeAttr.y
								var shapeWidth = +shapeAttr.width
								var shapeHeight = +shapeAttr.height
								var attrSame = ((nodeX === shapeX) && (nodeY === shapeY) && (nodeWidth === shapeWidth) && (nodeHeight === shapeHeight))
								return (!attrSame)
						}
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
				add_layer_mouseover_event: function () {
						var self = this
						var layer = self.layer
						var textPaddingTop = 10
						var tooltipBgMargin = self.tooltipBgMargin
						layer.on("mousemove", function (e) {
								//	当前表示不会显示tooltip, 那么直接返回
								if (!Variables.get('show_tooltip')) {
										return
								}
								var show_tooltip = e.target.show_tooltip
								if ((typeof (show_tooltip) === 'undefined') || (!show_tooltip)) {
										//	在shape节点的show_tooltip属性为undefined或者false时, 鼠标mouseover不会显示tooltip
										return
								}
								var className = e.target.className
								//	按照鼠标悬停的对象的类型不同, 分为label以及barcodeTree中的节点两种
								if (className === 'Text') {
										//	如果鼠标选择的节点是文本
										self.tooltip.text('Name:' + e.target.attrs.text)
										var textWidth = self.tooltip.textWidth
										var textHeight = self.tooltip.textHeight
										var rectY = e.target.attrs.y
										var textHeight = self.tooltip.textHeight
										//	tooltip的横坐标位置
										var tooltipPoxitionX = tooltipBgMargin.left
										//	tooltip的纵坐标位置
										var tooltipPoxitionY = rectY - textHeight - textPaddingTop
										//	移动tooltip的纵坐标的位置
										if (tooltipPoxitionY < 0) {
												//	label的宽度
												var labelHeight = e.target.textHeight
												tooltipPoxitionY = rectY + labelHeight + textPaddingTop
										}
										//	改变tooltip的背景矩形的位置以及大小
										self.tooltipBg.position({
												x: tooltipPoxitionX - tooltipBgMargin.left,
												y: tooltipPoxitionY - tooltipBgMargin.top
										})
										self.tooltipBg.width(textWidth + tooltipBgMargin.left + tooltipBgMargin.right)
										self.tooltipBg.height(textHeight + tooltipBgMargin.top + tooltipBgMargin.bottom)
										self.tooltip.position({
												x: tooltipPoxitionX,
												y: tooltipPoxitionY
										})
								} else {
										//	如果鼠标选择的节点不是文本, 而是rect
										var barcodeTreeIdIndex = self.barcodeTreeIdIndex
										var nodeId = e.target.attrs.id
										if (typeof (nodeId) === 'undefined') {
												return
										}
										var collection = self.options.barcodeCollection
										var nodeIdArray = nodeId.split('=')
										var barcodeTreeNodeId = nodeIdArray[0]
										var nodeName = e.target.attrs.name
										var nodeNameAttrArray = nodeName.split(' ')
										var barcodeTreeId = nodeNameAttrArray[barcodeTreeIdIndex]
										var barcodeModelFindResults = collection.where({barcodeTreeId: barcodeTreeId})
										//	剩余的barcodeModel
										var barcodeModel = null
										if (barcodeModelFindResults.length !== 0) {
												barcodeModel = barcodeModelFindResults[0]
										}
										if ((barcodeModel == null) || (typeof (barcodeModel) === 'undefined')) {
												return
										}
										var barcodeTreeIndex = barcodeModel.get('originalBarcodeIndex')
										var barcodeModel = collection.at(barcodeTreeIndex)
										var nodeObj = barcodeModel.get_node_obj_by_id(barcodeTreeNodeId)
										if (typeof (nodeObj) === 'undefined') {
												return
										}
										var categoryName = nodeObj.categoryName
										var nodeNum = nodeObj.num
										// update tooltip
										self.tooltip.text(categoryName + ", " + nodeNum)
										var textWidth = self.tooltip.textWidth
										var textHeight = self.tooltip.textHeight
										var rectX = e.target.attrs.x
										var rectY = e.target.attrs.y
										var rectWidth = e.target.attrs.width
										var rectHeight = e.target.attrs.height
										//	tooltip的横坐标位置
										var tooltipPoxitionX = rectX - textWidth - tooltipBgMargin.left - tooltipBgMargin.right
										//	tooltip的纵坐标位置
										var tooltipPoxitionY = rectY + rectHeight + tooltipBgMargin.top + self.hoveringVerticalLineLength
										//	移动tooltip的纵坐标的位置
										if (tooltipPoxitionY < 0) {
												tooltipPoxitionY = rectY + rectHeight + textPaddingTop
										}
										//	移动tooltip的横坐标的位置
										if (tooltipPoxitionX < 0) {
												tooltipPoxitionX = tooltipBgMargin.left
										}
										//	改变tooltip的背景矩形的位置以及大小
										self.tooltipBg.position({
												x: tooltipPoxitionX - tooltipBgMargin.left,
												y: tooltipPoxitionY - tooltipBgMargin.top
										})
										self.tooltipBg.width(textWidth + tooltipBgMargin.left + tooltipBgMargin.right)
										self.tooltipBg.height(textHeight + tooltipBgMargin.top + tooltipBgMargin.bottom)
										self.tooltip.position({
												x: tooltipPoxitionX,
												y: tooltipPoxitionY
										})
								}

								self.tooltipBg.show()
								self.tooltip.show()
								self.tooltipLayer.draw()
						})
						layer.on("mouseout", function () {
								self.tooltipBg.hide()
								self.tooltip.hide()
								self.tooltipLayer.draw()
						});
				},
				//	遍历整个collection, 高亮选择的barcodeTree中的节点
				highlight_whole_selected_nodes: function () {
						var self = this
						var collection = self.options.barcodeCollection
						//	节点的点击选择有两个方面, 一个是节点的高亮, 另一个是选择的节点周围增加框
						//	在高亮选择的节点之前首先取消全部的barcodeTree的节点的高亮
						self.refresh_all_barcode_node()
						//	高亮model中选择的节点, 存在两种高亮方式:
						// 1. 高亮删除或者新增的节点; 2. 高亮子树中的节点
						collection.each(function (model) {
								self.highlight_single_selected_nodes(model)
						})
				},
				//	高亮点击选择的barcodeTree中的节点
				highlight_single_selected_nodes: function (model) {
						var self = this
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var barcodeTreeIndex = model.get('originalBarcodeIndex')
						var selectedComparisonResults = model.get('selectedComparisonResults')
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
								if (false) {
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
						var collection = self.options.barcodeCollection
						//	选择barcodeTree中节点的默认颜色
						var barcodeNodeColor = self.barcodeNodeColor
						if (!collection.is_selected_node_empty()) {
								barcodeNodeColor = self.unHighlightColor
						}
						self.layer.find('.barcode-node').each(function (shape) {
								//	如果节点不处于aligned的范围之内, 那么直接删除shape节点
								shape.fill(barcodeNodeColor)
						})
				},
				//	删除点击的BarcodeTree以及节点
				remove_all_tree_labels_box: function () {
						var self = this
						var labelBoxLineName = self.labelBoxLineName
						self.layer.find('.label-box-line').each(function (shape) {
								console.log('shape', shape)
								shape.remove()
						})
				},
				//	删除点击的BarcodeTree以及节点
				remove_all_tree_nodes_box: function () {
						var self = this
						var nodeBoxLineName = self.nodeBoxLineName
						self.layer.find('.' + nodeBoxLineName).each(function (shape) {
								console.log('shape', shape)
								shape.remove()
						})
				},
				//	高亮点击的节点所在子树的label
				add_box_clicked_tree_labels: function () {
						var self = this
						var collection = self.options.barcodeCollection
						var barcodeNodeColor = self.barcodeNodeColor
						var boxStrokeWidth = self.boxStrokeWidth
						var labelBoxLineName = self.labelBoxLineName
						var selectedTreeLabelBoxObj = self.selectedTreeLabelBoxObj
						var allBoxAttrLabelObject = collection.get_all_box_label_obj()
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
						for (var nodeObjId in boxLabelLineObj) {
								var boxLine = boxLabelLineObj[nodeObjId]
								selectedTreeLabelBoxObj[nodeObjId] = boxLine
								self.layer.add(boxLine)
						}
				},
				//	高亮点击的BarcodeTree以及节点
				add_box_clicked_tree_nodes: function () {
						var self = this
						var collection = self.options.barcodeCollection
						var barcodeNodeColor = self.barcodeNodeColor
						var boxStrokeWidth = self.boxStrokeWidth
						var selectedTreeNodeBoxObj = self.selectedTreeNodeBoxObj
						var allBoxAttrObject = collection.get_all_box_attr_obj()
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
				highlight_barcodetree_node: function () {
						var self = this
						var collection = self.options.barcodeCollection
						//	unhighlightOpacity是节点默认的透明度
						var unhighlightOpacity = 1
						var relatedHighlight = self.relatedHighlight
						// self.remove_parent_child_link()
						var barcodeNodeColor = self.barcodeNodeColor
						var unHighlightColor = self.unHighlightColor
						if (!collection.is_selected_node_empty()) {
								//	如果存在选择的节点, 首先恢复到全部取消高亮的状态
								self.layer.find('.barcode-node').each(function (shape) {
										shape.setFill(unHighlightColor)
								})
								self.layer.find('.barcode-padding-node').each(function (shape) {
										shape.stroke(unHighlightColor)
								})
								//	然后高亮选择的节点
								self.highlight_whole_selected_nodes()
						} else {
								//	如果不存在选择的节点
								self.layer.find('.barcode-node').each(function (shape) {
										shape.setFill(barcodeNodeColor)
								})
								self.layer.find('.barcode-padding-node').each(function (shape) {
										shape.stroke(unHighlightColor)
								})
						}
						self.layer.draw();
				},
				/**
					* 删除aligned的部分不存在的节点
					*/
				remove_unaligned_padding_nodes: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						self.layer.find('.barcode-padding-node').each(function (shape) {
								var barcodeNodeName = shape.attrs.name
								var barcodeNodeNameAttrArray = barcodeNodeName.split(' ')
								//	barcodeTree中节点的id
								var barcodeTreeId = barcodeNodeNameAttrArray[self.barcodeTreeIdIndex]
								var treeNodeId = shape.attrs.id
								var nodeIdArray = treeNodeId.split('=')
								var barcodeNodeObjId = nodeIdArray[0]
								var barcodeModelFindResults = barcodeCollection.where({barcodeTreeId: barcodeTreeId})
								if (barcodeModelFindResults.length <= 0) {
										return
								}
								var treeDataModel = barcodeModelFindResults[0]
								if (!((treeDataModel.is_aligned_start(barcodeNodeObjId)) || (treeDataModel.is_aligned_range(barcodeNodeObjId)))) {
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
						var treeLabelObj = self.treeLabelObj
						var addedTreeLabelObj = {}
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
										simpleText.id = barcodeTreeLabelObj.barcodeTreeLabelId
										simpleText.on('mouseover', function (e) {
												//	改变鼠标悬停在rect上的cursor
												self.stage.container().style.cursor = 'pointer'
										})
										simpleText.on('mouseout', function () {
												//	改变鼠标离开在rect上的cursor
												self.stage.container().style.cursor = 'default'
												self.highlight_barcodetree_node()
												self.highlight_all_labels()
												self.trigger_unhovering_barcodetree_event()
										})
										treeLabelObj[barcodeTreeLabelId] = simpleText
										addedTreeLabelObj[barcodeTreeLabelId] = simpleText
								}
						}
						for (var item in addedTreeLabelObj) {
								self.layer.add(addedTreeLabelObj[item])
						}
				},
				// remove_all_nodes: function () {
				// 		var self = this
				// 		var collection = self.options.barcodeCollection
				// 		self.layer.find('.barcode-node').each(function (shape) {
				// 				var barcodeNodeName = shape.attrs.name
				// 				var barcodeNodeId = shape.attrs.id
				// 				var barcodeNodeNameAttrArray = barcodeNodeName.split(' ')
				// 				//	barcodeTree中节点的id
				// 				var barcodeNodeAttrArray = barcodeNodeId.split('=')
				// 				var barcodeTreeNodeId = barcodeNodeAttrArray[0]
				// 				var barcodeTreeId = barcodeNodeNameAttrArray[self.barcodeTreeIdIndex]
				// 				var barcodeModelFindResults = collection.where({barcodeTreeId: barcodeTreeId})
				// 				//	剩余的barcodeModel
				// 				var barcodeModel = null
				// 				if (barcodeModelFindResults.length !== 0) {
				// 						barcodeModel = barcodeModelFindResults[0]
				// 				}
				// 				if (barcodeModelFindResults.length <= 0) {
				// 						//	如果当前的barcodeModel已经被删除了, 那么需要删除全部的shape
				// 						self.remove_all_barcode_model_node(barcodeTreeId)
				// 						delete self.rectObject[barcodeNodeId]
				// 				} else {
				// 						barcodeModel = barcodeModelFindResults[0]
				// 						if (!(barcodeModel.is_aligned_start(barcodeTreeNodeId) || barcodeModel.is_aligned_range(barcodeTreeNodeId)
				// 								|| (barcodeModel.is_collapsed_subtree_range(barcodeTreeNodeId)))) {
				// 								//	如果节点不处于aligned的范围之内, 那么直接删除shape节点
				// 								shape.remove()
				// 						}
				// 				}
				// 		})
				// },
				render_subtree_triangle: function (allTrianglePointObj) {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
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
				//	绘制diagonal strip
				render_diagonal_strip: function (allDisgonalStripObj) {
						var self = this
						var diagonalStripObject = self.diagonalStripObject
						var addDiagonalStrip = false
						var addedDiagonalStrip = {}
						var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var barcodeTreeComparisonMode = Config.get('BARCODETREE_COMPARISON_MODE')
						for (var diagonalStripId in allDisgonalStripObj) {
								var diagonalStripObj = allDisgonalStripObj[diagonalStripId]
								//	计算diagonal strip的节点高度
								var diagonalStripNodeHeight = diagonalStripObj.height
								if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['ATTRIBUTE']) {
										diagonalStripNodeHeight = diagonalStripObj.height_value
								}
								if (self.layer.find('#' + diagonalStripObj).length === 0) {
										//  在svg上面绘制path
										var diagonalStrip = new Konva.Rect({
												x: diagonalStripObj.x,
												y: diagonalStripObj.y,
												width: diagonalStripObj.width,
												height: diagonalStripNodeHeight,
												fill: 'red',
												name: 'diagonal-strip',
												id: diagonalStripId
										})
										diagonalStripObject[diagonalStripId] = diagonalStrip
										addedDiagonalStrip[diagonalStripId] = diagonalStrip
										addDiagonalStrip = true
								}
						}
						//	在layer中增加diagonal strip
						if (addDiagonalStrip) {
								for (var diagonalStripId in addedDiagonalStrip) {
										self.layer.add(addedDiagonalStrip[diagonalStripId])
								}
								self.layer.draw()
						}
				},
				/**
					* 通过barcodeTree的id获取barcodeTree的model
					*/
				get_barcodetree_model_by_id: function (barcodeTreeId) {
						var self = this
						var collection = self.options.barcodeCollection
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
						var barcodeCollection = self.options.barcodeCollection
						var nodeObjId = nodeObj.id
						var nodeObjDepth = nodeObj.depth
						//	首先将子树的节点折叠之后的位置计算好
						barcodeCollection.collapse_subtree(nodeObjId, nodeObjDepth)
						//	将点击的根节点插入到折叠的数组中
						barcodeCollection.add_to_collapsed_array(nodeObjId)
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
						var barcodeCollection = self.options.barcodeCollection
						var nodeObjId = nodeObj.id
						var nodeObjDepth = nodeObj.depth
						//	首先将子树的节点取消折叠之后的位置计算好
						barcodeCollection.uncollapse_subtree(nodeObjId, nodeObjDepth)
						//	按照align的顺序更新barcodeTree中节点的位置
						barcodeCollection.update_barcode_node_attr_array()
						//	将点击的根节点从折叠的数组中删除
						barcodeCollection.remove_from_collapsed_array(nodeObjId)
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
						console.log('triangleObject', triangleObject)
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
				//	在hovering节点的子树节点上增加边框的响应事件
				// add_hovering_subtree_stroke: function (e, self) {
				// 		var collection = self.options.barcodeCollection
				// 		var hoveringNode = e.target
				// 		var treeNodeId = hoveringNode.attrs.id
				// 		var nodeIdArray = treeNodeId.split('=')
				// 		var barcodeTreeIndex = nodeIdArray[nodeIdArray.length - 1]
				// 		var barcodeTreeNodeId = nodeIdArray[0]
				// 		var treeDataModel = collection.at(barcodeTreeIndex)
				// 		var nodeObj = treeDataModel.get_node_obj_by_id(barcodeTreeNodeId)
				// 		//	找到与hover节点的相关节点
				// 		var findingNodesObj = treeDataModel.find_related_nodes(nodeObj)
				// 		var childrenNodes = findingNodesObj.childrenNodes
				// 		for (var cI = 0; cI < childrenNodes.length; cI++) {
				// 				var childNode = childrenNodes[cI]
				// 				var rectId = childNode.id + '=' + barcodeTreeIndex
				// 				self.layer.find('#' + rectId).each(function (shape) {
				// 						shape.stroke('black')
				// 						shape.strokeWidth(2)
				// 						shape.addName('hovering')
				// 						shape.draw()
				// 				})
				// 		}
				// },
				//	在hovering节点上增加边框的响应事件
				// add_hovering_node_stroke: function (e, self) {
				// 		var hoveringNode = e.target
				// 		hoveringNode.stroke('black')
				// 		hoveringNode.strokeWidth(2)
				// 		hoveringNode.addName('hovering')
				// 		self.layer.draw()
				// },
				//	在hovering节点上增加边框的响应事件
				// remove_hovering_node_stroke: function (e, self) {
				// 		var hoveringNode = e.target
				// 		self.layer.find('.hovering').each(function (shape) {
				// 				shape.strokeWidth(0)
				// 				shape.stroke(null)
				// 				shape.removeName('hovering')
				// 		})
				// 		self.layer.draw()
				// },
				/**
					* 鼠标放在barcodeTree的label上的事件
					*/
				// barcodelabel_mouseover_handler: function (e) {
				// 		var self = this
				// 		//	取消高亮barcodeTree上的全部节点以及label
				// 		self.unhighlight_all_nodes()
				// 		var target = e.target
				// 		var barcodeTreeId = target.attrs.id
				// 		self.unhighlight_all_labels()
				// 		//	发送信号, 发送当前鼠标悬停在的BarcodeTree的id
				// 		self.trigger_hovering_barcodetree_event(barcodeTreeId)
				// 		//	高亮选中的barcodeTree
				// 		self.highlight_mouseover_barcodetree(barcodeTreeId)
				// },
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
						if (!window.unhighlight) {
								//	当window.unhighlight为false, 即节点没有被unhighlight的情况下
								//	首先将全部的节点的颜色设置为#eeeeee
								self.layer.find('.barcodetree-label').each(function (shape) {
										shape.setFill(highlightColor)
								})
								self.layer.draw();
						}
				},
				//	取消高亮canvas上全部的barcodeTree中的节点以及label
				unhighlight_all_nodes: function () {
						var self = this
						var unHighlightColor = self.unHighlightColor
						if (!window.unhighlight) {
								//	当window.unhighlight为false, 即节点没有被unhighlight的情况下
								//	首先将全部的节点的颜色设置为#eeeeee
								self.layer.find('.barcode-node').each(function (shape) {
										shape.setFill(unHighlightColor)
								})
								self.layer.draw();
						}
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
						self.layer.find('.hover-circle').each(function (shape) {
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
						var collection = self.options.barcodeCollection
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
						var barcodeNodeName = node.attrs.name
						var barcodeNodeNameAttrArray = barcodeNodeName.split(' ')
						//	barcodeTree中节点的id
						var barcodeTreeId = barcodeNodeNameAttrArray[self.barcodeTreeIdIndex]
						var treeNodeId = node.attrs.id
						var nodeIdArray = treeNodeId.split('=')
						var nodeId = nodeIdArray[0]
						//	取消高亮barcodeTree上的全部节点以及label
						// self.unhighlight_all_nodes()
						var collection = self.options.barcodeCollection
						var barcodeModelFindResults = collection.where({barcodeTreeId: barcodeTreeId})
						if (barcodeModelFindResults.length <= 0) {
								return
						}
						var treeDataModel = barcodeModelFindResults[0]
						var barcodeTreeId = treeDataModel.get('barcodeTreeId')
						//	发送信号, 发送当前鼠标悬停在的BarcodeTree的id
						self.trigger_hovering_barcodetree_event(barcodeTreeId)
						// self.recover_unhighlight_node_stroke()
						var nodeObj = treeDataModel.get_node_obj_by_id(nodeId)
						if (typeof (nodeObj) !== 'undefined') {
								//	找到该节点的相关节点, 然后高亮相关的节点
								var findingNodesObj = treeDataModel.find_related_nodes(nodeObj)
								self.highlight_finding_node(nodeObj, findingNodesObj, barcodeTreeId)
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
						var barcodeCollection = self.options.barcodeCollection
						var nodeObjId = nodeData.id
						var nodeObjDepth = nodeData.depth
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var elementExisted = true
						//  根据当前点击是否处于locked的状态决定barcodeTree的点击表现形式
						// if (!BARCODETREE_GLOBAL_PARAS['Align_Lock']) {
						//	当前点击的状态不是align_lock的状态
						if (!barcodeCollection.in_selected_array(barcodeTreeId, nodeObjId)) {
								//  在增加新的数据之前首先需要删除与当前点击的节点出现重叠的节点, 比如点选节点的孩子节点或者父亲节点
								barcodeCollection.remove_crossed_node_alignment(nodeObjId)
								barcodeCollection.add_selected_node(treeDataModel, nodeData)
								elementExisted = false
						} else {
								var removedNodeObj = {nodeObjId: nodeObjId, nodeObjDepth: nodeObjDepth}
								barcodeCollection.remove_selected_node([removedNodeObj])
								//	将barcodeTree选择的最大层级作为alignedLevel
								elementExisted = true
						}
						//  如果当前处于aligned状态, 需要在add节点之后对于节点进行对齐
						// if (BarcodeGlobalSetting['Align_State']) {
						// 		console.log('======Align_State=======')
						// 		//	将barcodeTree选择的最大层级作为alignedLevel
						// 		barcodeCollection.set_aligned_level_as_max_level()
						// 		barcodeCollection.align_node_in_selected_list()
						// }
						// }
						// else {
						// //  在locked的情况下点击的节点必须是aligned范围的节点
						// if (treeDataModel.is_aligned_start(nodeObjId) || treeDataModel.is_aligned_range(nodeObjId)) {
						// 		//  在alignedlock状态下的点击响应事件
						// 		var nodeObj = {
						// 				nodeObjId: nodeObjId,
						// 				barcodeTreeId: barcodeTreeId,
						// 				nodeDepth: nodeObjDepth
						// 		}
						// 		//  这个操作的目的是对于barcodeTree取消之前选择的高亮状态, 将节点放到这个数组中就会取消高亮
						// 		barcodeCollection.update_in_avoid_highlight_nodearray(nodeObj)
						// 		//  在aligned lock状态下的高亮的操作
						// 		if (!barcodeCollection.in_aligned_selected_array(barcodeTreeId, nodeObjId)) {
						// 				// 判断该节点是否已经被选择
						// 				barcodeCollection.add_aligned_selected_node(barcodeTreeId, nodeObjId, nodeObjDepth, nodeObjCategory, siblingNodesArray, childrenNodesArray)
						// 				elementExisted = false
						// 		} else {
						// 				//	如果删除aligned lock状态下选择的节点, 需要该节点处于active的状态, 即该节点为locked情况下当前选择排序的节点
						// 				if (barcodeCollection.is_aligned_selected_sort_obj(nodeObj)) {
						// 						barcodeCollection.remove_aligned_selected_node(nodeObjId)
						// 						elementExisted = true
						// 				}
						// 		}
						// 		//	判断是否在locked情况下当前选择的节点
						// 		if (barcodeCollection.is_aligned_selected_sort_obj(nodeObj)) {
						// 				//	该节点是当前aligned情况下选择的节点 => 删除该当前选择排序的节点, 当前选择排序的节点为null
						// 				barcodeCollection.remove_aligned_selected_sort_obj(nodeObj)
						// 		} else {
						// 				//	该节点不是当前aligned情况下选择的节点 => 设置该节点为当前选择排序的节点
						// 				barcodeCollection.set_aligned_selected_sort_obj(nodeObj)
						// 		}
						// }
						// }
						//	高亮选择的节点barcodeTree collection
						self.highlight_whole_selected_nodes()
						self.remove_all_tree_labels_box()
						self.remove_all_tree_nodes_box()
						self.add_box_clicked_tree_labels()
						self.add_box_clicked_tree_nodes()
						self.layer.draw()
						// return elementExisted
				},
				/**
					*
					*/
				highlight_finding_node: function (thisNodeObj, findingNodesObj, barcodeTreeId) {
						var self = this
						var collection = self.options.barcodeCollection
						var childrenNodes = findingNodesObj.childrenNodes
						var fatherCurrentNodes = findingNodesObj.fatherCurrentNodes
						var siblingNodes = findingNodesObj.siblingNodes
						collection.each(function (model) {
								var barcodeTreeIndex = model.get('originalBarcodeIndex')
								var thisBarcodeTreeId = model.get('barcodeTreeId')
								//	barcodeTreeYLocation是barcodeTree的距离上边界的距离
								var barcodeTreeYLocation = model.get('barcodeTreeYLocation')
								//	对于具体的barcodeTree中的节点的纵坐标位置
								var barcodeTreeNodeHoverLineY = (+barcodeTreeYLocation) + (+window.barcodeHeight)
								if (thisBarcodeTreeId === barcodeTreeId) {
										if (!collection.is_selected_node_empty()) {
												//  只有当前选择的节点不为空时, 其余的节点为unhighlight的状态, 才会高亮当前的节点以及当前节点的孩子节点
												self.highlight_current_subtree_nodes(childrenNodes, fatherCurrentNodes, siblingNodes, barcodeTreeIndex)
										}
										//	在相关的节点上增加line对于相关的节点进行标注
										self.add_related_nodes_line(thisNodeObj, childrenNodes, fatherCurrentNodes, siblingNodes, barcodeTreeNodeHoverLineY)
								} else if (thisBarcodeTreeId !== barcodeTreeId) {
										//		高亮两个barcodeTree的比较结果
										self.compare_highlight_subtree_nodes(model, barcodeTreeIndex, thisNodeObj, findingNodesObj, barcodeTreeNodeHoverLineY)
								}
								// if (thisBarcodeTreeId === barcodeTreeId) {
								// 		self.showFatherChildLinks(model, fatherCurrentNodes)
								// }
						})
						self.layer.draw()
				},
				/**
					* 高亮子树上的全部节点
					*/
				compare_highlight_subtree_nodes: function (model, barcodeTreeIndex, thisNodeObj, findingNodesObj, barcodeTreeNodeHoverLineY) {
						var self = this
						var collection = self.options.barcodeCollection
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
										thisTreeFindingNodesObj.siblingNodes, barcodeTreeNodeHoverLineY)
						}
						//	高亮与hovering子树的比较结果
						// var comparedResultsObj = model.compareNodes(findingNodesObj, thisTreeFindingNodesObj)
						// self.highlight_subtree_nodes(thisNodeObj, comparedResultsObj, barcodeTreeIndex)
				},
				highlight_current_subtree_nodes: function (childrenNodes, fatherCurrentNodes, siblingNodes, barcodeTreeIndex) {
						var self = this
						self.highlightChildrenNodes(childrenNodes, barcodeTreeIndex)
						self.highlightFatherAndCurrentNodes(fatherCurrentNodes, barcodeTreeIndex)
						self.highlightSiblingNodes(siblingNodes, barcodeTreeIndex)
				},
				add_related_nodes_line: function (thisNodeObj, childrenNodes, fatherCurrentNodes, siblingNodes, barcodeTreeNodeHoverLineY) {
						var self = this
						self.add_children_hover_horizontal_line(childrenNodes, barcodeTreeNodeHoverLineY)
						self.add_father_current_horizontal_line(fatherCurrentNodes, barcodeTreeNodeHoverLineY)
						self.add_sibling_hover_vertical_line(siblingNodes, barcodeTreeNodeHoverLineY)
						self.add_hover_vertical_line(thisNodeObj, barcodeTreeNodeHoverLineY)
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
						var barcodeNodeColor = self.barcodeNodeColor
						var relatedHighlight = self.relatedHighlight
						var barcodeNodeId = thisNodeObj.id + '=' + barcodeTreeIndex
						self.layer.find('#' + barcodeNodeId).each(function (shape) {
								if (shape.existed) {
										shape.fill(barcodeNodeColor)
								} else {
										shape.fill('white')
								}
								shape.addName(relatedHighlight)
						})
				},
				add_hover_line: function (nodeArrray, barcodeTreeNodePaddingTop) {
						var self = this
						if (nodeArrray.length > 0) {
								var lineStartX = nodeArrray[0].x + self.barcodeTreeNodePaddingLeft
								var lineEndX = nodeArrray[nodeArrray.length - 1].x + nodeArrray[nodeArrray.length - 1].width + self.barcodeTreeNodePaddingLeft
								var lineY = +barcodeTreeNodePaddingTop
								var hoverLine = new Konva.Line({
										points: [lineStartX, lineY, lineEndX, lineY],
										stroke: self.hoverLineColor,
										strokeWidth: self.hoveringLineStrokeWidth,
										name: 'hover-line'
								})
								self.layer.add(hoverLine)
						}
				},
				add_hover_vertical_line: function (nodeObj, barcodeTreeNodePaddingTop) {
						var self = this
						var hoveringCircleColor = self.barcodeSiblingNodeColor
						var hoveringVerticalLineLength = self.hoveringVerticalLineLength
						var lineX = nodeObj.x + nodeObj.width / 2 + self.barcodeTreeNodePaddingLeft
						var lineStartY = barcodeTreeNodePaddingTop - window.barcodeHeight * 0.1
						var lineEndY = lineStartY + hoveringVerticalLineLength
						var hoverVerticalLine = new Konva.Line({
								points: [lineX, lineStartY, lineX, lineEndY],
								stroke: self.hoverLineColor,
								strokeWidth: self.hoveringLineStrokeWidth,
								name: 'hover-line'
						})
						self.layer.add(hoverVerticalLine)
				},
				//	高亮当前节点的孩子节点中缺失的部分
				highlightMissedChildrenNodes: function (missChildrenNodes, barcodeTreeIndex) {
						var self = this
						var relatedHighlight = self.relatedHighlight
						var barcodeMissingNodeColor = self.barcodeMissingNodeColor
						// var barcodeNodeColor = self.barcodeNodeColor
						for (var cI = 0; cI < missChildrenNodes.length; cI++) {
								var missingNode = missChildrenNodes[cI]
								var rectId = missingNode.id + '=' + barcodeTreeIndex
								self.layer.find('#' + rectId).each(function (shape) {
										var nodeWidth = shape.attrs.width
										shape.stroke(barcodeMissingNodeColor)
										shape.strokeWidth(nodeWidth / 10)
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
						for (var cI = 0; cI < addChildrenNodes.length; cI++) {
								var addNode = addChildrenNodes[cI]
								var rectId = addNode.id + '=' + barcodeTreeIndex
								self.layer.find('#' + rectId).each(function (shape) {
										shape.fill(barcodeAddNodeColor)
										shape.addName(relatedHighlight)
								})
						}
				},
				//	高亮某个节点的孩子节点部分
				add_children_hover_horizontal_line: function (childrenNodes, barcodeTreeNodeHoverLineY) {
						var self = this
						self.add_hover_line(childrenNodes, barcodeTreeNodeHoverLineY)
				},
				//	高亮当前节点的孩子节点中相同的部分
				highlightChildrenNodes: function (childrenNodes, barcodeTreeIndex) {
						var self = this
						var relatedHighlight = self.relatedHighlight
						var barcodeNodeColor = self.barcodeNodeColor
						for (var cI = 0; cI < childrenNodes.length; cI++) {
								var childNode = childrenNodes[cI]
								var rectId = childNode.id + '=' + barcodeTreeIndex
								self.layer.find('#' + rectId).each(function (shape) {
										if (shape.existed) {
												shape.fill(barcodeNodeColor)
										} else {
												shape.fill('white')
										}
										shape.addName(relatedHighlight)
								})
						}
				},
				//	高亮当前节点的父亲节点以及当前节点
				add_father_current_horizontal_line: function (fatherCurrentNodes, barcodeTreeNodePaddingTop) {
						var self = this
						//	数组中的第1个是当前hover的节点
						for (var cI = 0; cI < fatherCurrentNodes.length; cI++) {
								self.add_hover_line([fatherCurrentNodes[cI]], barcodeTreeNodePaddingTop)
						}
				},
				//	高亮当前节点的父亲节点以及当前节点
				highlightFatherAndCurrentNodes: function (fatherCurrentNodes, barcodeTreeIndex) {
						var self = this
						var relatedHighlight = self.relatedHighlight
						var barcodeNodeColor = self.barcodeNodeColor
						for (var cI = 0; cI < fatherCurrentNodes.length; cI++) {
								var addNode = fatherCurrentNodes[cI]
								var rectId = addNode.id + '=' + barcodeTreeIndex
								self.layer.find('#' + rectId).each(function (shape) {
										shape.fill(barcodeNodeColor)
										shape.addName(relatedHighlight)
								})
						}
				},
				//	高亮当前节点的父亲节点以及当前节点
				add_sibling_hover_vertical_line: function (siblingNodes, barcodeTreeNodePaddingTop) {
						var self = this
						for (var cI = 0; cI < siblingNodes.length; cI++) {
								self.add_hover_vertical_line(siblingNodes[cI], barcodeTreeNodePaddingTop)
						}
				},
				//	高亮当前节点的父亲节点以及当前节点
				highlightSiblingNodes: function (siblingNodes, barcodeTreeIndex) {
						// var self = this
						// var relatedHighlight = self.relatedHighlight
						// var barcodeSiblingNodeColor = self.barcodeSiblingNodeColor
						// var barcodeSiblingNodeOpacity = self.barcodeSiblingNodeOpacity
						// for (var cI = 0; cI < siblingNodes.length; cI++) {
						// 		var addNode = siblingNodes[cI]
						// 		var rectId = addNode.id + '=' + barcodeTreeIndex
						// 		self.layer.find('#' + rectId).each(function (shape) {
						// 				shape.fill(barcodeSiblingNodeColor)
						// 				shape.opacity(barcodeSiblingNodeOpacity)
						// 				shape.addName(relatedHighlight)
						// 				shape.draw()
						// 		})
						// }
				},
				/**
					* 获取当前的视图中使用的barcodeNodeArray
					*/
				get_barcode_node_array: function (treeDataModel) {
						var self = this
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
						//	padding属于compact的类型且节点不属于compact的范围内的
						var compact_not_padding_state = BARCODETREE_GLOBAL_PARAS['Subtree_Compact'] && (paddingStartIdArray.indexOf(d.id) === -1) && (paddingRangeIdArray.indexOf(d.id) === -1)
						var not_compact = !BARCODETREE_GLOBAL_PARAS['Subtree_Compact']
						var isShowPaddngNode = Variables.get('is_show_padding_node')
						//	padding节点不会compact || padding属于compact的类型且节点不属于compact的范围内的的情况下会正常显示
						return (isShowPaddngNode || d.existed) && (compact_not_padding_state || not_compact)
				},
				/**
					* 计算barcode节点的高度y的数值
					*/
				y_handler: function (d) {
						if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
								var barcodeTreeComparisonMode = Config.get('BARCODETREE_COMPARISON_MODE')
								var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
								//  barcodeTree的原始显示模式
								if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['ATTRIBUTE']) {
										if (typeof (d.height_value) === 'undefined') {
												return +d.height
										}
										return (+d.height) - (+d.height_value)
								} else if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['TOPOLOGY']) {
										return 0
								}
						} else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
								//  barcodeTree的compact的显示模式
								return d.y
						}
				},
				/**
					* 高度的handler
					*/
				height_handler: function (d) {
						var barcodeTreeComparisonMode = Config.get('BARCODETREE_COMPARISON_MODE')
						var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
						if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['ATTRIBUTE']) {
								if (typeof (d.height_value) === 'undefined') {
										return 0
								}
								return d.height_value
						} else if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['TOPOLOGY']) {
								return +d.height
						}
				}
		})
})
