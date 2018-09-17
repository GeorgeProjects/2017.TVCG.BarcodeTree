define([
		'require',
		'marionette',
		'underscore',
		'backbone',
		'config',
		'jquery',
		'd3',
		'variables',
		'views/svg-base.addon'
], function (require, Mn, _, Backbone, Config, $, d3, Variables, SVGBase) {
		'use strict'

		return Mn.ItemView.extend(_.extend({
						tagName: 'g',
						template: false,
						default: {
								barcodePaddingLeft: null,
								barcodeTextPaddingLeft: null,
								barcodePaddingTop: null,
								hoveringNodeId: null,
								clickedObject: null
						},
						initialize: function () {
								var self = this
								self.init_event()
						},
						//  初始化事件监听函数
						init_event: function () {
								var self = this
								var treeDataModel = self.model
								self.listenTo(treeDataModel, 'change:viewUpdateSelectionState', self.node_mouseout_handler)
								self.listenTo(treeDataModel, 'change:viewUpdateConcurrentValue', self.render_barcode_tree)
								Backbone.Events.on(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'], function () {
										self.render_barcode_tree()
								})
								Backbone.Events.on(Config.get('EVENTS')['UPDATE_ANIATION_BARCODE_VIEW'], function () {
										self.render_animation_compact_barcode_tree()
								})
								Backbone.Events.on(Config.get('EVENTS')['UPDATE_BARCODE_LOC'], function () {
										self.update_view_location()
								})
								Backbone.Events.on(Config.get('EVENTS')['UPDATE_SUMMARY'], function () {
										self.add_summary()
								})
								Backbone.Events.on(Config.get('EVENTS')['REMOVE_SUMMARY_STATE'], function (event) {
										var nodeObjId = event.nodeObjId
										self.remove_summary_state(nodeObjId)
								})
								Backbone.Events.on(Config.get('EVENTS')['SHOW_SUMMARY_STATE'], function (event) {
										var nodeObjId = event.nodeObjId
										self.show_summary_state(nodeObjId)
								})
								Backbone.Events.on(Config.get('EVENTS')['UPDATE_FILTERING_HIGHLIGHT_NODES'], function (event) {
										var highlightObjArray = event.highlightObjArray
										var distributionLevel = event.distributionLevel
										self.update_filtering_nodes(highlightObjArray, distributionLevel)
								})
								Backbone.Events.on(Config.get('EVENTS')['HIGH_RELATED_NODES'], function (event) {
										var thisNodeObj = event.thisNodeObj
										var findingNodesObj = event.findingNodesObj
										var barcodeTreeId = event.barcodeTreeId
										self.highlight_finding_node(thisNodeObj, findingNodesObj, barcodeTreeId)
								})
								//  取消mouseover的高亮效果
								Backbone.Events.on(Config.get('EVENTS')['NODE_MOUSEOUT'], function (event) {
										self.node_mouseout_handler()
								})
								//  高亮所有的相关节点
								Backbone.Events.on(Config.get('EVENTS')['HIGHLIGHT_ALL_RELATED_NODE'], function (event) {
										var nodeObj = event.nodeObj
										self.higlight_all_related_nodes(nodeObj)
								})
								//  高亮所有的相关节点
								Backbone.Events.on(Config.get('EVENTS')['HIGHLIGHT_ALL_SELECTED_NODE_SUPERTREEVIEW'], function () {
										self.highlight_selection_supertree_selection_nodes()
								})
								//  点击某个group之后,选择group中的BArcodeTree
								Backbone.Events.on(Config.get('EVENTS')['SELECT_GROUP_BARCODETREE'], function (event) {
										var selectionArray = event.selectionArray
										self.select_group_barcodetree(selectionArray)
								})
								//  点击某个选择的group之后, 取消选择group中的BarcodeTree
								Backbone.Events.on(Config.get('EVENTS')['UNSELECT_GROUP_BARCODETREE'], function () {
										self.unselect_group_barcodetree()
								})
								//  向barcode的align的部分增加locked-align的class
								Backbone.Events.on(Config.get('EVENTS')['ADD_LOCKED_ALIGN_CLASS'], function () {
										self.add_locked_align_class()
								})
								//  删除locked-align的class
								Backbone.Events.on(Config.get('EVENTS')['REMOVE_LOCKED_ALIGN_CLASS'], function () {
										self.remove_locked_align_class()
								})
						},
						//  将鼠标hovering的barcode的id进行广播
						trigger_hovering_event: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								Backbone.Events.trigger(Config.get('EVENTS')['HOVERING_BARCODE_EVENT'], {
										'barcodeTreeId': barcodeTreeId
								})
						},
						//  点击选中barcdoe触发的事件
						trigger_click_event: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								Backbone.Events.trigger(Config.get('EVENTS')['SELECT_BARCODE_EVENT'], {
										'barcodeTreeId': barcodeTreeId
								})
						},
						//  点击取消选中barcode触发的事件
						trigger_unclick_event: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								Backbone.Events.trigger(Config.get('EVENTS')['UNSELECT_BARCODE_EVENT'], {
										'barcodeTreeId': barcodeTreeId
								})
						},
						//  在barcodetree视图中双击选择某个barcodeTree会取消对于BarcodeTree的选择
						trigger_remove_tree_selection: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_SELECTION'], {
										'barcodeTreeId': barcodeTreeId
								})
						},
						//  点击选择barcode进行集合操作的事件
						trigger_click_selection_event: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								Backbone.Events.trigger(Config.get('EVENTS')['SET_SELECT_BARCODE_EVENT'], {
										'barcodeTreeId': barcodeTreeId
								})
						},
						//  点击取消选择barcode进行集合操作的事件
						trigger_unclick_selection_event: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								Backbone.Events.trigger(Config.get('EVENTS')['SET_UNSELECT_BARCODE_EVENT'], {
										'barcodeTreeId': barcodeTreeId
								})
						},
						//  将鼠标hovering的barcode的节点的相关信息进行广播
						trigger_hovering_node_event: function (thisNodeObj, findingNodesObj) {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								Backbone.Events.trigger(Config.get('EVENTS')['HIGH_RELATED_NODES'], {
										'thisNodeObj': thisNodeObj,
										'findingNodesObj': findingNodesObj,
										'barcodeTreeId': barcodeTreeId
								})
						},
						//  在锁定的状态下切换barcode的显示模式, 那么需要所有的barcode同时变化, 进行渲染
						trigger_update_barcode_view: function () {
								Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
						},
						//  发出mouseout的信号
						trigger_mouseout_event: function () {
								if (Variables.get('mouseover_state')) {
										Backbone.Events.trigger(Config.get('EVENTS')['NODE_MOUSEOUT'])
										//  刚刚trigger了mouseout的信号, 不需要再次被trigger
										Variables.set('mouseover_state', false)
								}
						},
						//  更新tree config的视图
						trigger_update_tree_config_view: function () {
								Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_TREE_CONFIG_VIEW'])
						},
						//  更新supertree的视图
						trigger_super_view_update: function () {
								Backbone.Events.trigger(Config.get('EVENTS')['RENDER_SUPERTREE'])
						},
						//  删除summary的柱状图
						trigger_remove_summary_state: function (nodeObjId) {
								Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_SUMMARY_STATE'], {
										'nodeObjId': nodeObjId
								})
						},
						//  显示summary的柱状图
						trigger_show_summary_state: function (nodeObjId) {
								Backbone.Events.trigger(Config.get('EVENTS')['SHOW_SUMMARY_STATE'], {
										'nodeObjId': nodeObjId
								})
						},
						onShow: function () {
								var self = this
								//  计算barcodeTree的label和左侧边界的距离
								self.barcodePaddingLeft = Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')
								var treeDataModel = self.model
								var barcodePaddingLeft = self.barcodePaddingLeft
								var barcodeNodeHeight = window.barcodeHeight
								//  判断该barcodeTree是不是比较的基准树
								var compareBased = treeDataModel.get('compareBased')
								var barcodeIndex = treeDataModel.get('barcodeIndex')
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeRectBgColor = treeDataModel.get('barcodeRectBgColor')
								var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var barcodePaddingTop = treeDataModel.get('barcodePaddingTop')
								//  判断当前的barcode是怎样得到的
								var operationType = treeDataModel.get('operationType')
								var containerWidth = $('#barcodetree-scrollpanel').width()
								var tip = window.tip
								self.d3el.call(tip)
								self.d3el.attr('id', barcodeTreeId)
										.attr('class', 'single-tree')
										.attr('transform', 'translate(' + 0 + ',' + barcodeTreeYLocation + ')')
								self.add_barcode_dbclick_click_handler()
								var barcodeTreeLabelMonthDday = self.barcodetree_label_handler(barcodeTreeId, operationType)
								//  barcode的label的位置的左边界是紧邻着barcode的右侧的label
								var barcodeLabelX = Variables.get('barcodeTextPaddingLeft')

								self.d3el.append('text')
										.attr('id', 'label-' + barcodeTreeId)
										.attr('class', 'barcode-label barcode-class')
										.attr('x', barcodeLabelX)
										.attr('y', barcodeHeight / 2)
										.attr('text-anchor', 'start')
										.attr('alignment-baseline', 'middle')
										.style("cursor", "pointer")
										.text(barcodeTreeLabelMonthDday)
										.on('mouseover', function (d, i) {
												//  绘制barcodeTree的背景矩形
												self.append_barcode_bg()
												self.trigger_hovering_event()
												var dayArray = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
												if (barcodeTreeId.indexOf('-') !== -1) {
														var dateInTip = barcodeTreeId.split('-')[1].replaceAll('_', '/')
														var date = barcodeTreeId.split('-')[1].replaceAll('_', '-')
														var curDay = new Date(date).getDay()
														var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>date: " + dateInTip
																+ ", Day: " + dayArray[curDay] + "</span></span>"
												} else {
														var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + "Day: " + barcodeTreeId + "</span></span>"
												}
												if (Config.get('BARCODETREE_TOOLTIP_ENABLE')) {
														tip.show(tipValue)
												}
												self.flipTooltipLeft()
												self.flipTooltipRight()
										})
										.on('mouseout', function (d, i) {
												self.remove_barcode_bg()
												self.d3el.select('.bg').classed('hovering-highlight', false)
												tip.hide()
										})
								self.barcodeContainer = self.d3el.append('g')
										.attr('transform', 'translate(' + barcodePaddingLeft + ',' + barcodePaddingTop + ')')
										.attr('id', 'barcode-container')
								// 更新barcode的标签的字体大小
								var labelFontSize = self.get_font_size()
								self.d3el.select('#barcode-label')
										.style('font-size', function (d) {
												return labelFontSize + 'em'
										})
										.attr('y', barcodeHeight / 2)
								self.add_label_dbclick_click_handler()
						},
						/**
							* 在barcodeTree的背后增加背景矩形
							*/
						append_barcode_bg: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeIndex = treeDataModel.get('barcodeIndex')
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')
								var containerWidth = $('#barcodetree-scrollpanel').width()
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var BarcodeTreeSplit = BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split']
								var barcodeNodeRearrangeObjArray = treeDataModel.get('barcodeNodeRearrangeObjArray')
								var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
								//  sankey diagram的连接线是
								var lineGenerator = d3.svg.line().x(function (d) {
										return d[0]
								}).y(function (d) {
										return d[1]
								}).interpolate('basis')
								//  切割的不同的subtree object对应的背景矩形没有计算左侧的边界部分, 因此需要增加边界的部分
								var barcodePaddingLeft = self.barcodePaddingLeft
								if (BarcodeTreeSplit) {
										//  如果是切割的barcodeTree, 那么需要在每一段的背后增加背景矩形
										for (var bI = 0; bI < barcodeNodeRearrangeObjArray.length; bI++) {
												var barcodeNodeRearrangeObj = barcodeNodeRearrangeObjArray[bI]
												var subtreeIndex = barcodeNodeRearrangeObj.barcodeTreeIndex
												var subtreeLocChange = 0
												if ((typeof (subtreeIndex) !== 'undefined') && (typeof (barcodeIndex) !== 'undefined')) {
														subtreeLocChange = (subtreeIndex - barcodeIndex) * barcodeHeight
												}
												var maxSubTreeLength = barcodeNodeRearrangeObj.maxSubTreeLength
												var subtreeStartX = barcodeNodeRearrangeObj.subtreeStartX
												//  下面实际绘制的barcodeTree背景矩形的起始位置以及宽度
												var subtreeBgStartX = 0
												var subtreeBgWidth = 0
												var subtreeBgY = (+barcodeTreeYLocation) + subtreeLocChange
												//  在增加背景矩形的时候, 在背景矩形的长度的基础上增加barcodeNodeInterval, 在横轴的坐标基础上减少barcodeNodeInterval, 从而能够显示barcodeTree的背景更加明显
												if (bI === 0) {
														subtreeBgStartX = 0
														subtreeBgWidth = barcodePaddingLeft + maxSubTreeLength + barcodeNodeInterval
														d3.select('#barcodetree-bg-g')
																.append('rect')
																.attr('class', function () {
																		var colorClass = 'bg ' + 'barcode-bg ' + barcodeTreeId
																		return colorClass
																})
																.attr('x', subtreeBgStartX)
																.attr('y', subtreeBgY)
																.attr('width', subtreeBgWidth)
																.attr('height', barcodeHeight)
												} else {
														subtreeBgStartX = subtreeStartX + barcodePaddingLeft - barcodeNodeInterval
														subtreeBgWidth = maxSubTreeLength + barcodeNodeInterval * 2
														if (!isNaN(subtreeBgStartX)) {
																d3.select('#barcodetree-bg-g')
																		.append('rect')
																		.attr('class', function () {
																				var colorClass = 'bg ' + 'barcode-bg ' + barcodeTreeId
																				return colorClass
																		})
																		.attr('x', subtreeBgStartX)
																		.attr('y', subtreeBgY)
																		.attr('width', subtreeBgWidth)
																		.attr('height', barcodeHeight)
														}
												}
												//  在绘制完成一个barcodeTree的背景矩形之后, 需要绘制barcodeTree的背景矩形与下一个背景矩形之间的连接curve
												if ((bI + 1) < barcodeNodeRearrangeObjArray.length) {
														var subtreeBgYCenter = subtreeBgY + barcodeHeight / 2
														var subtreeBgEndX = subtreeBgStartX + subtreeBgWidth
														//  下一个BarcodeTree背景矩形的起始坐标
														var nextSubtreeBgStartX = barcodeNodeRearrangeObjArray[bI + 1].subtreeStartX + barcodePaddingLeft - barcodeNodeInterval
														var nextSubtreeIndexX = barcodeNodeRearrangeObjArray[bI + 1].barcodeTreeIndex
														var nextSubtreeLocChange = 0
														if ((typeof (nextSubtreeBgStartX) !== 'undefined') && (typeof (barcodeIndex) !== 'undefined')) {
																nextSubtreeLocChange = (nextSubtreeIndexX - barcodeIndex) * barcodeHeight
														}
														var nextSubtreeBgY = (+barcodeTreeYLocation) + nextSubtreeLocChange
														var nextSubtreeBgYCenter = nextSubtreeBgY + barcodeHeight / 2
														if (!isNaN(nextSubtreeBgStartX)) {
																//  构建barcodeTree的背景的控制点之间的连线
																var curvePoints = [
																		[subtreeBgEndX, subtreeBgYCenter],
																		[(subtreeBgEndX + nextSubtreeBgStartX) / 2, subtreeBgYCenter],
																		[(subtreeBgEndX + nextSubtreeBgStartX) / 2, nextSubtreeBgYCenter],
																		[nextSubtreeBgStartX, nextSubtreeBgYCenter]
																]
																var pathData = lineGenerator(curvePoints)
																d3.select('#barcodetree-bg-g')
																		.append('path')
																		.attr('class', 'barcodetree-link barcode-bg ' + barcodeTreeId)
																		.attr('d', pathData)
																		.style('stroke-width', barcodeHeight)
														}
												}
										}
								} else {
										//  如果是完整的barcodeTree, 那么在整个barcodeTree的背后增加背景矩形
										d3.select('#barcodetree-bg-g')
												.append('rect')
												.attr('class', function () {
														var colorClass = 'bg ' + 'barcode-bg ' + barcodeTreeId
														return colorClass
												})
												.attr('width', containerWidth)
												.attr('height', barcodeHeight)
												.attr('x', 0)
												.attr('y', barcodeTreeYLocation)
								}

						},
						/**
							* 删除barcodeTree的背景矩形
							*/
						remove_barcode_bg: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								d3.select('#barcodetree-bg-g')
										.selectAll('.' + barcodeTreeId)
										.remove()
						},
						/**
							*  计算得到barcodeTree前面的label的函数
							*/
						barcodetree_label_handler: function (barcodeTreeId, operationType) {
								var currentDataSetName = Variables.get('currentDataSetName')
								if (currentDataSetName === Config.get('DataSetCollection')['LibraryTree_DailyName']) {
										if (barcodeTreeId.indexOf('-') !== -1) {
												var barcodeTreeLabelYearMonthDday = barcodeTreeId.split('-')[1]
												var barcodeTreeLabelMonthDday = barcodeTreeLabelYearMonthDday.substring(5, barcodeTreeLabelYearMonthDday.length).replaceAll('_', '/')
										} else {
												barcodeTreeLabelMonthDday = barcodeTreeId.split('_')[0]
												barcodeTreeLabelMonthDday = barcodeTreeLabelMonthDday.toUpperCase()
												if (typeof (operationType) !== 'undefined') {
														var operationTypeLabel = operationType.substring(0, 1).toUpperCase()
														barcodeTreeLabelMonthDday = barcodeTreeLabelMonthDday + "(" + operationTypeLabel + ")"
												}
										}
								} else if (currentDataSetName === Config.get('DataSetCollection')['NBATeamTreeName']) {
										var barcodeTreeLabelMonthDday = barcodeTreeId.replace('tree', '')
								}
								return barcodeTreeLabelMonthDday
						},
						/**
							* 确认当前barcodeTree选择的函数
							*/
						tree_selection_handler: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeCollection = window.Datacenter.barcodeCollection
								//  点击barcode的背景矩形的响应函数
								self.trigger_click_event()
								self.add_compare_based_anchor()
								//  在当前状态下相当于增加compare-based的子树
								self.set_compare_based_subtree()
								barcodeCollection.set_based_model(barcodeTreeId)
						},
						/**
							* 取消barcodeTree选择的函数
							*/
						cancel_tree_selection_handler: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeCollection = window.Datacenter.barcodeCollection
								self.trigger_unclick_event()
								//  在当前状态下相当于删除compare-based的子树
								// self.set_compare_based_subtree()
								self.remove_compare_based_anchor()
								barcodeCollection.unset_based_model(barcodeTreeId)
								//  删除选择比较的barcodeTree之后, 按照barcode原始的选择序列重新排序
								barcodeCollection.recover_barcode_model_sequence()
						},
						/**
							* 设定barcodeTree之间比较的subtree
							*/
						set_compare_based_subtree: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeCollection = window.Datacenter.barcodeCollection
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var alignedNodeIdArray = barcodeCollection.get_aligned_node_id_array()
								if (alignedNodeIdArray.length !== 0) {
										for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
												var nodeData = treeDataModel.get_node_obj_from_id(alignedNodeIdArray[aI])
												var nodeExisted = self.single_click_select_handler(nodeData)
												if (nodeExisted) {
														aI = aI - 1
												}
										}
								} else {
										var nodeData = barcodeNodeAttrArray[0]
										var nodeExisted = self.single_click_select_handler(nodeData)
								}
						},
						/**
							*  barcodeTree上label的单击事件
							*/
						barcode_tree_label_click_handler: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeCollection = window.Datacenter.barcodeCollection
								var selectionState = Variables.get('selectionState')
								if (selectionState) {
										//  当前处于选择状态
										if (!self.d3el.select('.bg').empty()) {
												if (self.d3el.select('.bg').classed('set-operation-selection')) {
														self.trigger_unclick_selection_event()
														self.remove_set_operation_selection_anchor()
												} else {
														//  点击barcode的背景矩形的响应函数
														self.trigger_click_selection_event()
														self.add_set_operation_selection_anchor()
												}
										}
								} else {
										//  当前处于非选择状态
										if (!self.d3el.select('.bg').empty()) {
												if (self.d3el.select('.bg').classed('compare-based-selection')) {
														self.cancel_tree_selection_handler()
												} else {
														self.tree_selection_handler()
												}
										}
								}
								//  在改变based barcodemodel之后需要触发更新视图的信号
								barcodeCollection.update_all_barcode_view()
								barcodeCollection.clear_filter_barcode()
						},
						/**
							*  在barcodeTree的标签上增加单击以及双击的选择事件
							*/
						add_label_dbclick_click_handler: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeCollection = window.Datacenter.barcodeCollection
								//  捕捉所有的在barcode节点上的事件
								var cc = clickcancel()
								self.d3el.selectAll('.barcode-label').call(cc)
								//  捕捉单击的事件
								cc.on('click', function (el) {
										//  设置mouseover的状态为true, 表示需要trigger mouseout的信号
										Variables.set('mouseover_state', true)
										self.barcode_tree_label_click_handler()
								});
								cc.on('dblclick', function (el) {
										//  设置mouseover的状态为true, 表示需要trigger mouseout的信号
										Variables.set('mouseover_state', true)
										//  删除当前barcodeTree的选择状态
										self.trigger_remove_tree_selection()
										barcodeCollection.remove_item_and_model(barcodeTreeId)
										self.remove_barcode_bg()
										window.Variables.update_barcode_attr()
										barcodeCollection.update_after_remove_models()
										//  传递信号, 在服务器端更新dataCenter删除选中的item数组, 进而更新superTree
										window.Datacenter.request_remove_item([barcodeTreeId])
										//  取消在set operation selection上的选择状态
										self.trigger_unclick_selection_event()
										self.remove_set_operation_selection_anchor()
										//  取消树的选择状态
										self.cancel_tree_selection_handler()
								});
								//  捕捉click事件,将他分发到不同的方法中进行处理
								function clickcancel(d, i) {
										var event = d3.dispatch('click', 'dblclick');

										function cc(selection) {
												var down,
														tolerance = 5,
														last,
														wait = null;
												// euclidean distance
												function dist(a, b) {
														if ((typeof (a) !== 'undefined') && (typeof (b) !== 'undefined')) {
																return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
														}
														return 0;
												}

												selection.on('mousedown', function () {
														down = d3.mouse(document.body);
														last = +new Date();
												});
												selection.on('mouseup', function () {
														if (dist(down, d3.mouse(document.body)) > tolerance) {
																return;
														} else {
																if (wait) {
																		window.clearTimeout(wait);
																		wait = null;
																		event.dblclick(d3.event);
																} else {
																		wait = window.setTimeout((function (e) {
																				return function () {
																						event.click(e);
																						wait = null;
																				};
																		})(d3.event), 300);
																}
														}
												})
										}

										return d3.rebind(cc, event, 'on');
								}
						},
						/**
							* 在barcode的节点上增加点击的事件
							*/
						add_node_dbclick_click_handler: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								//  捕捉所有的在barcode节点上的事件
								var cc = clickcancel()
								self.d3el.selectAll('.barcode-node').call(cc)
								//  捕捉单击的事件
								cc.on('click', function (el) {
										//  设置mouseover的状态为true, 表示需要trigger mouseout的信号
										Variables.set('mouseover_state', true)
										var srcElement = el.srcElement
										var nodeObj = d3.select(srcElement)
										var nodeData = nodeObj.data()[0]
										if (nodeData.existed) {
												//  如果处于compact模式下, template的节点是不能被点击的
												if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
														//  切换到原始的barcodeTree的compact的显示模式
														if (nodeData.compactAttr === Config.get('CONSTANT').TEMPLATE) {
																return
														}
												}
												self.single_click_select_handler(nodeData)
												self.trigger_mouseout_event()
										}
								})
								//  捕捉click事件,将他分发到不同的方法中进行处理
								function clickcancel(d, i) {
										var event = d3.dispatch('click', 'dblclick')

										function cc(selection) {
												var down,
														tolerance = 5,
														last,
														wait = null;
												// euclidean distance
												function dist(a, b) {
														if ((typeof (a) !== 'undefined') && (typeof (b) !== 'undefined')) {
																return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
														}
														return 0;
												}

												selection.on('mousedown', function () {
														down = d3.mouse(document.body);
														last = +new Date();
												})
												selection.on('mouseup', function () {
														if (dist(down, d3.mouse(document.body)) > tolerance) {
																return;
														} else {
																if (wait) {
																		window.clearTimeout(wait);
																		wait = null;
																		event.dblclick(d3.event);
																} else {
																		wait = window.setTimeout((function (e) {
																				return function () {
																						event.click(e);
																						wait = null;
																				};
																		})(d3.event), 300);
																}
														}
												});
										};
										return d3.rebind(cc, event, 'on');
								}
						},
						/**
							* 单击barcode中的节点的响应事件
							*/
						single_click_select_handler: function (nodeData) {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeCollection = window.Datacenter.barcodeCollection
								var nodeObjId = nodeData.id
								var nodeObjDepth = nodeData.depth
								var nodeObjCategory = nodeData.category
								var nodeObjCategoryName = nodeData.categoryName
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var elementExisted = true
								//  根据当前点击是否处于locked的状态决定barcodeTree的点击表现形式
								if (!BARCODETREE_GLOBAL_PARAS['Align_Lock']) {//	当前点击的状态不是align_lock的状态
										if (!barcodeCollection.in_selected_array(barcodeTreeId, nodeObjId)) {//  当前点击的节点没有被选择
												var siblingNodesArray = treeDataModel.find_sibling_nodes(nodeData)
												var childrenNodesArray = treeDataModel.find_children_nodes(nodeData)
												//  在增加新的数据之前首先需要删除与当前点击的节点出现重叠的节点
												barcodeCollection.remove_crossed_node_alignment(nodeObjId)
												barcodeCollection.add_selected_node(barcodeTreeId, nodeObjId, nodeObjDepth, nodeObjCategory, nodeObjCategoryName, siblingNodesArray, childrenNodesArray)
												elementExisted = false
										} else {
												var removedNodeObj = {nodeObjId: nodeObjId, nodeObjDepth: nodeObjDepth}
												barcodeCollection.remove_selected_node([removedNodeObj])
												//	将barcodeTree选择的最大层级作为alignedLevel
												barcodeCollection.set_aligned_level_as_max_level()
												//	按照更新的barcodeModel之后的alignLevel重新计算布局
												barcodeCollection.align_node_in_selected_list()
												elementExisted = true
										}
								} else {
										//  在locked的情况下点击的节点必须是aligned范围的节点
										if (treeDataModel.is_aligned_start(nodeObjId) || treeDataModel.is_aligned_range(nodeObjId)) {
												var siblingNodesArray = treeDataModel.find_sibling_nodes(nodeData)
												var childrenNodesArray = treeDataModel.find_children_nodes(nodeData)
												//  在alignedlock状态下的点击响应事件
												var nodeObj = {
														nodeObjId: nodeObjId,
														barcodeTreeId: barcodeTreeId,
														nodeDepth: nodeObjDepth
												}
												d3.selectAll('.select-icon').remove()
												//  这个操作的目的是对于barcodeTree取消之前选择的高亮状态, 将节点放到这个数组中就会取消高亮
												barcodeCollection.update_in_avoid_highlight_nodearray(nodeObj)
												//  在aligned lock状态下的高亮的操作
												if (!barcodeCollection.in_aligned_selected_array(barcodeTreeId, nodeObjId)) {
														// 判断该节点是否已经被选择
														barcodeCollection.add_aligned_selected_node(barcodeTreeId, nodeObjId, nodeObjDepth, nodeObjCategory, siblingNodesArray, childrenNodesArray)
														elementExisted = false
												} else {
														//	如果删除aligned lock状态下选择的节点, 需要该节点处于active的状态, 即该节点为locked情况下当前选择排序的节点
														if (barcodeCollection.is_aligned_selected_sort_obj(nodeObj)) {
																barcodeCollection.remove_aligned_selected_node(nodeObjId)
																elementExisted = true
														}
												}
												//	判断是否在locked情况下当前选择的节点
												if (barcodeCollection.is_aligned_selected_sort_obj(nodeObj)) {
														//	该节点是当前aligned情况下选择的节点 => 删除该当前选择排序的节点, 当前选择排序的节点为null
														barcodeCollection.remove_aligned_selected_sort_obj(nodeObj)
												} else {
														//	该节点不是当前aligned情况下选择的节点 => 设置该节点为当前选择排序的节点
														barcodeCollection.set_aligned_selected_sort_obj(nodeObj)
												}
										}
								}
								self.update_current_selected_icon()
								return elementExisted
						},
						/**
							* 更新none-node的class, 判断是否其已经变成了node-missed
							*/
						update_class_nodes_none: function () {
								var self = this
								var treeDataModel = self.model
								var missed_node_class = Variables.get('missed_node_class')
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var selectedLevels = Variables.get('selectedLevels')
								//  取消barcodeTree中的节点上的template属性
								self.d3el.select('#barcode-container')
										.selectAll('.barcode-node')
										.each(function (d, i) {
												if (d.compactAttr === Config.get('CONSTANT').TEMPLATE) {
														d3.select(this).classed('template', true)
												} else {
														d3.select(this).classed('template', false)
												}
										})
								var barcodeNode = self.d3el.select('#barcode-container')
										.selectAll('.barcode-node')
										.data(barcodeNodeAttrArray.filter(function (d, i) {
												//  只有当subtree处于收缩状态时才会绘制paddingNode的节点
												return !(d.existed)
										}), function (d, i) {
												return d.id
										})
								barcodeNode.each(function (d, i) {
										var removedClassArray = []
										if (d3.select(this).classed(missed_node_class)) {
												removedClassArray.push(missed_node_class)
										}
										// if (d3.select(this).classed('selection-unhighlight')) {
										// 		removedClassArray.push('selection-unhighlight')
										// }
										d3.select(this).attr('class', self.node_class_name_handler(d))
										for (var rI = 0; rI < removedClassArray.length; rI++) {
												d3.select(this).classed(removedClassArray[rI], true)
										}
								})
						},
						/**
							* 渲染覆盖在padding barcode上面带有纹理的矩形
							*/
						render_padding_cover_rect: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeNodeHeight = treeDataModel.get('barcodeNodeHeight') * 0.8
								var paddingNodeObjArray = self.get_padding_node_array()
								var BARCODETREE_VIEW_SETTING = Config.get('BARCODETREE_VIEW_SETTING')
								var barcodeNodePaddingLength = BARCODETREE_VIEW_SETTING['BARCODE_NODE_PADDING_LENGTH']
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var Subtree_Compact = BARCODETREE_GLOBAL_PARAS['Subtree_Compact']
								self.d3el.select('#barcode-container')
										.selectAll('.padding-covered-rect')
										.remove()
								var paddingCoverRectObj = self.d3el.select('#barcode-container')
										.selectAll('.padding-covered-rect')
										.data(paddingNodeObjArray.filter(function (d, i) {
												//  只有当subtree处于收缩状态时才会绘制paddingNode的节点
												return ((d.paddingNodeStartIndex <= d.paddingNodeEndIndex) && (Subtree_Compact))
										}), function (d, i) {
												return 'covered-rect-' + i
										})
								paddingCoverRectObj.enter()
										.append('rect')
										.attr('id', function (d, i) {
												return 'covered-rect-' + i
										})
										.attr('class', function (d, i) {
												return 'padding-covered-rect covered-rect-' + i
										})
										.attr('x', function (d, i) {
												if (isNaN(+d.paddingNodeX)) {
														return 0
												}
												return d.paddingNodeX
										})
										.attr('y', 0)
										.attr('width', function (d, i) {
												return barcodeNodePaddingLength
										})
										.attr('height', barcodeNodeHeight)
										.style("fill", self.fill_style_handler.bind(self))
										.on('mouseover', function (d, i) {
												var startIndex = d.paddingNodeStartIndex
												var endIndex = d.paddingNodeEndIndex
												var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>range: " + startIndex + "-" + endIndex + "</span></span>"
												if (Config.get('BARCODETREE_TOOLTIP_ENABLE')) {
														tip.show(tipValue)
												}
										})
										.on('mouseout', function (d, i) {
												var nodeStyle = self.fill_style_handler(d, i)
										})
								paddingCoverRectObj.attr('x', function (d, i) {
										if (isNaN(+d.paddingNodeX)) {
												return 0
										}
										return d.paddingNodeX
								})
										.attr('y', 0)
										.attr('width', function (d, i) {
												return barcodeNodePaddingLength
										})
										.attr('height', barcodeNodeHeight)
								paddingCoverRectObj.exit().remove()
						},
						/**
							* 绘制barcodeTree
							*/
						render_barcode_tree: function () {
								var self = this
								self.update_barcode_font()
								self.update_barcode_bg()
								self.update_barcode_loc()
								//  实际渲染barcodeTree中的节点之前执行的方法
								update_before_render()
								//  实际渲染barcodeTree中节点的渲染函数, 传入的是在渲染barcodeTree结束之后的函数
								self.render_barcode_tree_node()
								//  渲染BarcodeTree中辅助的一些信息
								update_after_render()
								//  虽然在update_padding_barcode_node方法之后会更新padding_cover_rect,
								//  但是为了在更新过程中不会出现背后的barcode节点的视觉干扰, 所以在后面紧接着调用render_padding_cover_rect
								self.render_padding_cover_rect()
								self.add_node_dbclick_click_handler()
								self.highlight_selection_supertree_selection_nodes()
								//  在绘制barcode之前要先更新的视图部分
								function update_before_render() {
										self.remove_summary_histogram()
								}

								//  在更新barcodeTree的节点之后的显示
								function update_after_render() {
										self.remove_unselected_padding_node()
										self.add_summary()
										self.remove_unpadding_node()
										self.render_padding_cover_rect()
										self.update_class_nodes_none()
										self.add_aligned_lock_class()
										self.node_mouseout_handler()
										self.add_barcode_tree_set_selection()
										self.update_interaction_icon()
								}
						},
						/**
							* 删除padding范围的节点
							*/
						remove_unpadding_node: function () {
								var self = this
								var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
								//  只有在子树处于compact状态的时候才会删除padding范围的节点
								if (BarcodeGlobalSetting['Subtree_Compact']) {
										var barcodeModel = self.model
										if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
												var paddingStartIdArray = barcodeModel.get('global_padding_start_id_array')
												var paddingRangeIdArray = barcodeModel.get('global_padding_range_id_array')
										} else if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
												var paddingStartIdArray = barcodeModel.get('padding_start_id_array')
												var paddingRangeIdArray = barcodeModel.get('padding_range_id_array')
										}
										if ((paddingStartIdArray.length !== 0) && (paddingRangeIdArray.length !== 0)) {
												self.d3el.select('#barcode-container')
														.selectAll('.barcode-node')
														.each(function (d, i) {
																var id = d.id
																//  如果这个节点不属于padding start, 同时也不属于padding range, 那么久删除这个节点
																if ((paddingStartIdArray.indexOf(id) !== -1) || (paddingRangeIdArray.indexOf(id) !== -1)) {
																		self.d3el.select('#' + id).remove()
																}
														})
										}
								}
						},
						/**
							* 更新选择的树
							*/
						add_barcode_tree_set_selection: function () {
								var self = this
								var groupId = window.current_select_group_id
								var selectionBarcodeObject = Variables.get('selectionBarcodeObject')
								var barcodetreeSelectionArray = selectionBarcodeObject[groupId]
								if (typeof (barcodetreeSelectionArray) !== 'undefined') {
										self.select_group_barcodetree(barcodetreeSelectionArray)
								}
						},
						/**
							* 动态更新barcodeTree的内部节点
							*/
						render_animation_compact_barcode_tree: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeIndex = treeDataModel.get('barcodeIndex')
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var compactBarcodeNodeAttrArrayObj = self.get_comact_barcode_node_array_obj()
								var maxCompactLevel = 0
								var minCompactLevel = 100000000
								var compactPrefix = 'compact-'
								for (var compactItem in compactBarcodeNodeAttrArrayObj) {
										var compactLevel = +compactItem.replace(compactPrefix, '')
										if (compactLevel > maxCompactLevel) {
												maxCompactLevel = compactLevel
										}
										if (compactLevel < minCompactLevel) {
												minCompactLevel = compactLevel
										}
								}
								//  删除所有先前存在的barcode节点
								self.d3el.select('#barcode-container')
										.selectAll('.barcode-node').remove()
								if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
										//  表示从original模式变换到compact模式
										var initCompactLevel = maxCompactLevel
										var stopCompactLevel = minCompactLevel
								} else if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
										//  表示从compact模式变换到original模式
										var initCompactLevel = minCompactLevel
										var stopCompactLevel = maxCompactLevel
								}
								render_compact_barcode_tree(initCompactLevel, stopCompactLevel)
								function render_compact_barcode_tree(compactLevel, stopCompactLevel) {
										var barcodeNodeAttrArray = compactBarcodeNodeAttrArrayObj[compactPrefix + compactLevel]
										var displayMode = Variables.get('displayMode')
										var isShowPaddngNode = Variables.get('is_show_padding_node')
										var DURATION = Config.get('TRANSITON_DURATION')
										var barcodeNode = self.d3el.select('#barcode-container')
												.selectAll('.barcode-node')
												.data(barcodeNodeAttrArray.filter(function (d, i) {
														return !(((!isShowPaddngNode)) && (!d.existed))
												}), function (d, i) {
														return d.id
												})
										barcodeNode.enter()
												.append('rect')
												.attr('class', function (d, i) {
														return self.node_class_name_handler(d, i)
												})
												.attr('id', function (d, i) {
														return d.id
												})
												.attr('x', function (d) {
														if (isNaN(+d.x)) {
																return 0
														}
														return +d.x
												})
												.attr('y', function (d) {
														return +self.y_handler(d)
												})
												.attr('width', function (d) {
														return +d.width
												})
												.attr('height', function (d) {
														return self.height_handler(d)
												})
												.style("cursor", "pointer")
												.on('mouseover', function (d, i) {
														self.node_mouseover_handler(d, self)
												})
												.style("fill", function (d, i) {
														return self.fill_handler(d, i, self)
												})
										barcodeNode.attr('width', function (d) {
												return +d.width
										})
												.transition()
												.duration(DURATION)
												.attr('x', function (d) {
														if (isNaN(+d.x)) {
																return 0
														}
														return +d.x
												})
												.attr('height', function (d) {
														return self.height_handler(d)
												})
												.attr('y', function (d) {
														return +self.y_handler(d)
												})
												.style("fill", function (d, i) {
														return self.fill_handler(d, i, self)
												})
												.call(self.endall, function (d, i) {
														if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
																compactLevel = compactLevel - 1
																if (compactLevel < stopCompactLevel) {
																		// next_step_func()
																		//  不需要每一个barcodeTree执行完成animation都需要trigger信号
																		if (barcodeIndex === 0) {
																				self.trigger_update_barcode_view()
																		}
																} else {
																		render_compact_barcode_tree(compactLevel, stopCompactLevel)
																}
														} else if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
																compactLevel = compactLevel + 1
																if (compactLevel > stopCompactLevel) {
																		// next_step_func()
																		//  不需要每一个barcodeTree执行完成animation都需要trigger信号
																		if (barcodeIndex === 0) {
																				self.trigger_update_barcode_view()
																		}
																} else {
																		render_compact_barcode_tree(compactLevel, stopCompactLevel)
																}
														}
												})
										barcodeNode.exit().remove()
								}
						},
						/**
							* 更新barcodeTree的内部节点
							* 之前是将所有的节点依次进行绘制,
							*/
						render_barcode_tree_node: function (next_step_func) {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeIndex = treeDataModel.get('barcodeIndex')
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var barcodeNodeHeight = barcodeHeight * 0.8
								var displayMode = Variables.get('displayMode')
								//  TODO
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var selectedLevels = Variables.get('selectedLevels')
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								//  在global模式以及original模式下的padding节点数组
								if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
										var paddingStartIdArray = treeDataModel.get('global_padding_start_id_array')
										var paddingRangeIdArray = treeDataModel.get('global_padding_range_id_array')
								} else if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
										var paddingStartIdArray = treeDataModel.get('padding_start_id_array')
										var paddingRangeIdArray = treeDataModel.get('padding_range_id_array')
								}
								//  节点显示存在以下两种情况:
								//  1. (compact_not_padding_state || not_compact)这是节点显示的第一种情况
								//      - isShowPaddingNode是判断barcodeTreeNodeArray中节点中的padding node类型的节点是否显示
								//      - Subtree_Compact是判断padding节点是否是被压缩显示的, 如果Subtree_Compact为true, 那么除aligned范围的节点, 其他部分的节点被压缩, 否则正常显示
								//      - compact_not_padding_state是判断barcodeTree是否处于压缩显示的状态, 并且节点在压缩显示的范围以外
								//      - not_compact是判断barcodeTree是否处于压缩显示的状态
								//  2. 除此之外, 节点显示需要或者节点是存在的, 或者isShowPaddingNode为true, 因此状态为isShowPaddngNode || d.existed
								var barcodeNodeRearrangeObjArray = treeDataModel.get('barcodeNodeRearrangeObjArray')
								var BarcodeTreeSplit = BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split']
								// 在重新绘制之前, 删除所有的barcodetree之间的link
								remove_all_barcodetree_link()
								//	重新绘制之前, 删除所有的barcodetree中的节点
								remove_all_barcodetree_node()
								//  根据当前的切割状态对于BarcodeTree进行绘制
								if (BarcodeTreeSplit) {
										//  在对于BarcodeTree进行切割的情况下对于BarcodeTree的绘制函数
										for (var bI = 0; bI < barcodeNodeRearrangeObjArray.length; bI++) {
												var barcodeNodeRearrangeObj = barcodeNodeRearrangeObjArray[bI]
												var barcodeNodeArray = barcodeNodeRearrangeObj.node_array
												var subtreeIndex = barcodeNodeRearrangeObj.barcodeTreeIndex
												var maxSubTreeXAxis = barcodeNodeRearrangeObj.maxSubTreeXAxis
												append_barcode_node(barcodeNodeArray, subtreeIndex, barcodeTreeIndex)
												if ((bI + 1) < barcodeNodeRearrangeObjArray.length) {
														var nextBarcodeNodeRearrangeObj = barcodeNodeRearrangeObjArray[bI + 1]
														var nextSubtreeIndex = nextBarcodeNodeRearrangeObj.barcodeTreeIndex
														var nextMinSubTreeXAxis = nextBarcodeNodeRearrangeObj.minSubTreeXAxis
														if (typeof (nextMinSubTreeXAxis) !== 'undefined') {
																var barcodeTreeLinkLength = nextMinSubTreeXAxis - maxSubTreeXAxis
																var subtreeOrder = bI
																//  除了前后的barcodeTree所处于的纵向index之外, 用户需要制定连接的barcodeTree的序列的index值
																append_barcode_link(maxSubTreeXAxis, barcodeTreeLinkLength, subtreeIndex, nextSubtreeIndex, barcodeTreeIndex, subtreeOrder)
														}
												}
										}
										var labelIndex = barcodeNodeRearrangeObjArray[0].barcodeTreeIndex
										//	在split的情况下, 改变barcodeTree的Label的位置, 第一个segment的index是label的index值
										change_barcodetree_label_loc(barcodeTreeIndex, labelIndex)
								} else {
										var barcodeTreeIndex = treeDataModel.get('barcodeTreeIndex')
										//  在不被切割的情况下, 根据BarcodeTreeNodeArray绘制BarcodeTree
										append_barcode_node(barcodeNodeAttrArray, barcodeTreeIndex, barcodeTreeIndex)
								}
								//  删除所有的barcodeTree之间的link
								function remove_all_barcodetree_link() {
										self.d3el.selectAll('.barcode-link')
												.remove()
								}

								//	删除所有的barcodeTree中的节点
								function remove_all_barcodetree_node() {
										self.d3el.selectAll('.barcode-node')
												.remove()
								}

								//	 改变barcodeTree中的label的位置
								function change_barcodetree_label_loc(barcodeTreeIndex, labelIndex) {
										var subtreeLocChange = 0
										if ((typeof (barcodeTreeIndex) !== 'undefined') && (typeof (labelIndex) !== 'undefined')) {
												subtreeLocChange = (labelIndex - barcodeTreeIndex) * barcodeHeight
										}
										self.d3el.select('#label-' + barcodeTreeId)
												.attr('y', barcodeHeight / 2 + subtreeLocChange)
								}

								//  绘制barcodeTree中的节点的渲染函数
								function append_barcode_node(barcodeNodeAttrArray, subtreeIndex, barcodeTreeIndex) {
										var subtreeLocChange = 0
										if ((typeof (subtreeIndex) !== 'undefined') && (typeof (barcodeTreeIndex) !== 'undefined')) {
												subtreeLocChange = (subtreeIndex - barcodeTreeIndex) * barcodeHeight
										}
										var barcodeNode = self.d3el.select('#barcode-container')
												.selectAll('.barcode-node')
												.data(barcodeNodeAttrArray.filter(barcodetree_node_filter), function (d, i) {
														return d.id
												})
										barcodeNode.enter()
												.append('rect')
												.attr('class', function (d, i) {
														return self.node_class_name_handler(d, i)
												})
												.attr('id', function (d, i) {
														return d.id
												})
												.attr('x', function (d) {
														if (isNaN(+d.x)) {
																return 0
														}
														return +d.x
												})
												.attr('y', function (d) {
														return +self.y_handler(d) + subtreeLocChange
												})
												.attr('width', function (d) {
														return +d.width
												})
												.attr('height', function (d) {
														return self.height_handler(d)
												})
												.style("cursor", cursor_handler)
												.on('mouseover', function (d, i) {
														self.node_mouseover_handler(d, self)
														self.append_barcode_bg()
												})
												.on('mouseout', function () {
														d3.select(this).classed('default-highlight', false)
														self.remove_barcode_bg()
														self.node_mouseout_handler()
												})
												.style("fill", function (d, i) {
														return self.fill_handler(d, i, self)
												})
										barcodeNode.attr('class', function (d, i) {
												return self.node_class_name_handler(d, i)
										})
												.attr('width', function (d) {
														return +d.width
												})
												.attr('x', function (d) {
														if (isNaN(+d.x)) {
																return 0
														}
														return +d.x
												})
												.attr('height', function (d) {
														return self.height_handler(d)
												})
												.attr('y', function (d) {
														return +self.y_handler(d) + subtreeLocChange
												})
												.style("fill", function (d, i) {
														return self.fill_handler(d, i, self)
												})
												.style("cursor", cursor_handler)
								}

								//  在切割BarcodeTree的情况下, 绘制barcodeTree之间的link的渲染函数
								function append_barcode_link(maxSubTreeXAxis, barcodeTreeLinkLength, beginSubtreeIndex, endSubtreeIndex, barcodeTreeIndex, subtreeOrder) {
										//	barcodeTree的不同的segment之间的连线存在一定的偏差, 因此增加barcodeLinkPadding用于调整这个偏差, 使其位于中心的位置
										var barcodeLinkPadding = barcodeHeight / 10
										var BarcodeTreeSplitWidth = Variables.get('BarcodeTree_Split_Width')
										var beginSubtreeLoc = 0
										var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
										if ((typeof (beginSubtreeIndex) !== 'undefined') && (typeof (barcodeTreeIndex) !== 'undefined')) {
												beginSubtreeLoc = (beginSubtreeIndex - barcodeTreeIndex) * barcodeHeight + barcodeHeight / 2 - barcodeLinkPadding
										}
										var endSubtreeLoc = 0
										if ((typeof (endSubtreeIndex) !== 'undefined') && (typeof (barcodeTreeIndex) !== 'undefined')) {
												endSubtreeLoc = (endSubtreeIndex - barcodeTreeIndex) * barcodeHeight + barcodeHeight / 2 - barcodeLinkPadding
										}
										var barcodetreeLinkId = 'startsubtree' + subtreeOrder + '-endsubtree' + (subtreeOrder + 1)
										self.d3el.select('#' + barcodetreeLinkId).remove()
										self.d3el.select('#barcode-container')
												.append('line')
												.attr('class', 'barcode-link')
												.attr('id', barcodetreeLinkId)
												.attr('x1', maxSubTreeXAxis + barcodeNodeInterval)
												.attr('y1', beginSubtreeLoc)
												.attr('x2', (maxSubTreeXAxis + barcodeTreeLinkLength - barcodeNodeInterval))
												.attr('y2', endSubtreeLoc)
								}

								//  判断barcodetree中的节点是否被过滤的函数
								function barcodetree_node_filter(d, i) {
										//	padding属于compact的类型且节点不属于compact的范围内的
										var compact_not_padding_state = BARCODETREE_GLOBAL_PARAS['Subtree_Compact'] && (paddingStartIdArray.indexOf(d.id) === -1) && (paddingRangeIdArray.indexOf(d.id) === -1)
										var not_compact = !BARCODETREE_GLOBAL_PARAS['Subtree_Compact']
										var isShowPaddngNode = Variables.get('is_show_padding_node')
										//	padding节点不会compact || padding属于compact的类型且节点不属于compact的范围内的的情况下会正常显示
										return (isShowPaddngNode || d.existed) && (compact_not_padding_state || not_compact)
								}

								//		得到BarcodeTree的cursor值的函数
								function cursor_handler(d, i) {
										var nodeId = d.id
										//	处于可以比较的comparison的状态
										var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
										var isLockedComparison = BARCODETREE_GLOBAL_PARAS['Align_Lock']
										//	处于padding状态
										var isPaddingStart = treeDataModel.is_padding_start(nodeId)
										var isPaddingRange = treeDataModel.is_padding_range(nodeId)
										//	处于aligned状态
										var isAlignedRange = treeDataModel.is_aligned_range(nodeId)
										//	处于locked状态 && 范围是padding的范围内 => cursor是disable类型, 否则 => cursor是pointer类型
										if ((isLockedComparison) && (isPaddingStart || isPaddingRange)) {
												return 'not-allowed'
										} else {
												return 'pointer'
										}
								}
						},
						/**
							* y的handler
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
										// return +d.height
										return +d.height
								}
						},
						is_global_comparison_state_root_select: function () {
								var selectedNodesIdObj = window.Datacenter.barcodeCollection.get_selected_nodes_id()
								var alignedSelectedNodesIdObj = window.Datacenter.barcodeCollection.get_aligned_tree_selected_node()
								//  在global comparison的最初始的选择的节点为root节点且children节点数组为undefined或者空数组
								var unSelectComparisonReference = (alignedSelectedNodesIdObj == null)
								//  当前没有选中对齐的节点或者子树, 并且当前处于global的状态
								// var initialRootSelected = (typeof (alignedSelectedNodesIdObj.selectedChildrenNodeIdArray) === 'undefined') || (alignedSelectedNodesIdObj.selectedChildrenNodeIdArray.length === 0)
								return (!(unSelectComparisonReference && (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL)))
						},
						/**
							*  节点的class计算函数fill
							*/
						node_class_name_handler: function (d) {
								var self = this
								var treeDataModel = self.model
								var nodeId = d.id
								var classArray = []
								var hollowClass = 'node-missed'
								var hiddenClass = 'node-hidden'
								var strokeClass = 'template-stroke'
								classArray.push('barcode-node')
								classArray.push('barcode-class')
								classArray.push('barcode-node-level-' + d.depth)
								//	节点不存在 => 超出aligned的层级范围,
								if (!d.existed) {
										if (typeof(d.beyondAlign) !== 'undefined') {
												if (d.beyondAlign) {
														classArray.push(hiddenClass)
												} else {
														classArray.push(hollowClass)
												}
										} else {
												classArray.push(hollowClass)
										}
								}
								//	template节点 => 增加stroke边框
								if (d.compactAttr === Config.get('CONSTANT').TEMPLATE) {
										classArray.push(strokeClass)
								}
								//	处于可以比较的comparison的状态
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								//	处于padding状态
								var isPaddingStart = treeDataModel.is_padding_start(nodeId)
								var isPaddingRange = treeDataModel.is_padding_range(nodeId)
								//	处于aligned状态
								var isAlignedRange = treeDataModel.is_aligned_range(nodeId)
								//	locked状态+padding节点 => 节点的class中增加selection-unhighlight类
								if (isPaddingStart || isPaddingRange) {
										classArray.push('selection-unhighlight')
										if (BARCODETREE_GLOBAL_PARAS['Align_Lock']) {
												classArray.push('cancel-node')
										}
								}
								return self.get_class_name(classArray)
						},
						add_aligned_lock_class: function () {
								var self = this
								var treeDataModel = self.model
								var alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
								var paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
								var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
								self.d3el.selectAll('.barcode-node')
										.each(function (d, i) {
												var nodeId = d.id
												if ((treeDataModel.is_aligned_start(nodeId) || treeDataModel.is_aligned_range(nodeId)) && (BarcodeGlobalSetting['Align_Lock'])) {
														d3.select(this).classed('locked-align', true)
												} else {
														d3.select(this).classed('locked-align', false)
												}
										})

						},
						remove_summary_histogram: function () {
								var self = this
								var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
								if (!BarcodeGlobalSetting['Comparison_Result_Display']) {
										self.d3el.selectAll('.stat-summary').style('visibility', 'hidden')
								}
						},
						/**
							* 更新barcode中的字体大小
							*/
						update_barcode_font: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								if (barcodeHeight < 16) {
										self.d3el.selectAll('.barcode-label')
												.style('font-size', function (d) {
														return barcodeHeight / 19 + 'rem'
												})
								} else {
										self.d3el.selectAll('.barcode-label')
												.style('font-size', function (d) {
														return '1rem'
												})
								}
								self.d3el.selectAll('.barcode-label')
										.attr('y', barcodeHeight / 2)
						},
						/**
							* 更新barcode中的背景
							*/
						update_barcode_bg: function () {
								var self = this
								var treeDataModel = self.model
								var containerWidth = $('#barcodetree-view').width()
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								self.d3el.selectAll('rect.bg')
										.attr('width', containerWidth)
										.attr('height', barcodeHeight)
						}
						,
						/**
							* 依据在barcodeModel中计算得到的barcodePaddingTop, 在更改不同模式的情况下更改barcode的container的位置
							*/
						update_barcode_loc: function () {
								var self = this
								var treeDataModel = self.model
								var barcodePaddingLeft = self.barcodePaddingLeft
								var barcodePaddingTop = treeDataModel.get('barcodePaddingTop')
								var barcodeTreeYLocation = +treeDataModel.get('barcodeTreeYLocation')
								self.d3el
								// .transition()
								// .duration(Config.get('TRANSITON_DURATION'))
										.attr('transform', 'translate(' + 0 + ',' + barcodeTreeYLocation + ')')
								self.d3el.select('#barcode-container')
										.attr('transform', 'translate(' + barcodePaddingLeft + ',' + barcodePaddingTop + ')')
						},
						//	删除padding Node中的is_existed部分为false的部分
						remove_unselected_padding_node: function () {
								var self = this
								var treeDataModel = self.model
								self.d3el.select('#barcode-container')
										.selectAll('.barcode-node')
										.each(function (d, i) {
												//	判断节点是否被删除的参数 => paddingRangeObj为undefined的情况下, 则isRemoved为false
												var barcodeNodeId = d3.select(this).attr('id')
												//	节点对应的paddingNodeObj
												var paddingRangeObj = treeDataModel.get_padding_range_obj(barcodeNodeId)
												var isRemoved = false
												if (typeof (paddingRangeObj) !== 'undefined') {
														isRemoved = paddingRangeObj.is_removed
												}
												if (isRemoved) {
														d3.select(this).remove()
												}
										})
						},
						/**
							* 增加总结的柱状图
							*/
						add_summary: function () {
								var self = this
								var treeDataModel = self.model
								var basedModel = treeDataModel.get('basedModel')
								if (basedModel == null) {
										self.add_comparison_summary()
								} else {
										self.add_missed_added_summary()
								}
						},
						/**
							*  更新高亮在tree以及superTree中选择的节点
							*/
						highlight_selection_supertree_selection_nodes: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeCollection = window.Datacenter.barcodeCollection
								var thisBarcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var supertreeSelectedNodesIdObj = barcodeCollection.get_supertree_selected_nodes_id()
								var selectedNodesIdObj = barcodeCollection.get_selected_nodes_id()
								var alignedTreeSelectedNodesIdObj = barcodeCollection.get_aligned_tree_selected_node()
								//  首先将所有的节点取消selection的高亮
								self.cancel_selection_highlight()
								/**
									* 对于barcodeTree选择的高亮共有三种情况, 分别是:
									* 1. 在barcodeTree中点击选择的节点; 2. 在superTree中点击选择的节点; 3. 在aligned以及locked的情况下点击选择的节点;
									*/
								//  所有节点 => 增加selection-unhighlight
								if (is_selected_nodes_exist(selectedNodesIdObj, supertreeSelectedNodesIdObj, alignedTreeSelectedNodesIdObj)) {
										self.d3el.selectAll('.barcode-node').classed('selection-unhighlight', true)
								}
								//  1. 高亮从superTree中选择的节点, 并且对于选择的节点进行计数
								var selectedSuperNodesIdLength = 0
								for (var item in supertreeSelectedNodesIdObj) {
										var nodeId = item
										var nodeDepth = supertreeSelectedNodesIdObj[nodeId]
										//	superTree中选择的节点 => 高亮全部相关节点
										highlight_all_nodes(nodeId, nodeDepth)
										selectedSuperNodesIdLength = selectedSuperNodesIdLength + 1
								}
								//  2. 高亮从barcodeTree中选择的节点, 并且对于选择的节点进行计数
								var selectedNodesIdLength = 0
								// 按照选择的状态对于节点进行高亮
								for (var item in selectedNodesIdObj) {
										var nodeId = item
										var nodeDepth = selectedNodesIdObj[item].nodeObjDepth
										var barcodeTreeId = selectedNodesIdObj[item].barcodeTreeId
										var nodeObj = {
												nodeObjId: nodeId,
												barcodeTreeId: selectedNodesIdObj[item].barcodeTreeId
										}
										//	在locked的状态下, 避免选择的子树部分的高亮, 从而允许用户在对齐的子树部分上继续进行选择
										if (barcodeCollection.get_index_in_avoid_highlight_nodearray(nodeObj) === -1) {
												self.highlight_selected_nodes(nodeId, nodeDepth, nodeObjCategoryName, selectedNodesIdObj, barcodeTreeId, thisBarcodeTreeId)
												selectedNodesIdLength = selectedNodesIdLength + 1
										}
								}
								//  在locked状态下对于选择的节点进行高亮
								if (BARCODETREE_GLOBAL_PARAS['Align_Lock']) {
										var alignedSelectedNodesIdLength = 0
										// 按照选择的状态对于节点进行高亮
										for (var item in alignedTreeSelectedNodesIdObj) {
												var nodeId = item
												var nodeDepth = alignedTreeSelectedNodesIdObj[item].nodeObjDepth
												var nodeObjCategoryName = alignedTreeSelectedNodesIdObj[item].categoryName
												var barcodeTreeId = alignedTreeSelectedNodesIdObj[item].barcodeTreeId
												var nodeObj = {
														nodeObjId: nodeId,
														barcodeTreeId: alignedTreeSelectedNodesIdObj[item].barcodeTreeId
												}
												self.highlight_selected_nodes(nodeId, nodeDepth, nodeObjCategoryName, alignedTreeSelectedNodesIdObj, barcodeTreeId, thisBarcodeTreeId)
												alignedSelectedNodesIdLength = alignedSelectedNodesIdLength + 1
										}
										if ((alignedSelectedNodesIdLength === 0) && (selectedSuperNodesIdLength === 0)) {
												cancel_aligned_lock_unhighlightNodes()
										}
								}
								if ((selectedSuperNodesIdLength === 0) && (selectedNodesIdLength === 0)) {
										//	当前即没有从superTree上选择节点, 也没有从barcodeTree中选择节点
										if (BARCODETREE_GLOBAL_PARAS['Align_Lock']) {
												if (alignedSelectedNodesIdLength === 0) {
														cancel_aligned_lock_unhighlightNodes()
												}
										} else {
												self.cancel_selection_unhighlightNodes()
										}
								}
								//  判断用户是否已经从barcodeTree的superTree视图中选择了节点
								function is_selected_nodes_exist(selectedNodesIdObj, supertreeSelectedNodesIdObj, alignedTreeSelectedNodesIdObj) {
										var selectNum = 0
										for (var item in selectedNodesIdObj) {
												selectNum = selectNum + 1
										}
										for (var item in supertreeSelectedNodesIdObj) {
												selectNum = selectNum + 1
										}
										for (var item in alignedTreeSelectedNodesIdObj) {
												selectNum = selectNum + 1
										}
										//  返回true表示存在选择的节点, 返回false表示selectNum为0即不存在选择的节点
										return (selectNum !== 0)
								}

								//	在locked的情况下取消对于节点的selection-unhighlight的情况
								function cancel_aligned_lock_unhighlightNodes() {
										self.d3el.selectAll('.locked-align').each(function (d, i) {
												d3.select(this).classed('selection-unhighlight', false)
										})
								}

								//  选择在该子树中的所有部分的节点
								function highlight_all_nodes(nodeId, nodeDepth) {
										var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
										var relatedNodesObj = treeDataModel.find_related_nodes({id: nodeId, depth: nodeDepth})
										self.highlight_single_selection_node(nodeId, nodeDepth)
										if ((BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['NULL_SELECTION'])) {
												var selectedChildrenNodeIdArray = relatedNodesObj.childrenNodes
												if (typeof (selectedChildrenNodeIdArray) !== 'undefined') {
														highlight_selection_node(selectedChildrenNodeIdArray)
												}
										} else if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
												var selectedSiblingNodeObjArray = relatedNodesObj.siblingNodes
												if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
														highlight_sibling_node(selectedSiblingNodeObjArray)
												}
												var selectedChildrenNodeIdArray = relatedNodesObj.childrenNodes
												if (typeof (selectedChildrenNodeIdArray) !== 'undefined') {
														highlight_selection_node(selectedChildrenNodeIdArray)
												}
										}
								}
						},
						/**
							* 只是选择在该子树中的选择部分的节点
							*/
						highlight_selected_nodes: function (nodeId, nodeDepth, nodeObjCategoryName, selectedNodesIdObj, barcodeTreeId, thisBarcodeTreeId) {
								var self = this
								var treeDataModel = self.model
								var barcodeCollection = window.Datacenter.barcodeCollection
								var thisBarcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
								var barcodeNodeAttrArrayObj = treeDataModel.get('barcodeNodeAttrArrayObj')
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['NODE_SELECTION']) {
										var nodeExisted = node_existed(barcodeNodeAttrArrayObj, nodeId)
										if (nodeExisted) {
												self.highlight_single_selection_node(nodeId, nodeDepth)
										} else {
												self.highlight_miss_selection_node(nodeId)
										}
										//  找到与该节点以及该节点的孩子节点具有相同name的节点并且进行高亮
										if (barcodeTreeId !== thisBarcodeTreeId) {
												var thisNodeObj = {
														categoryName: nodeObjCategoryName,
														depth: nodeDepth
												}
												var sameCategoryNodeObjArray = self.find_single_same_category_node(thisNodeObj)
												if (typeof (sameCategoryNodeObjArray) !== 'undefined') {
														highlight_selection_node(sameCategoryNodeObjArray)
												}
										}
								} else if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
										//  与选择子树的比较结果
										var comparedResultsObj = treeDataModel.get_selected_comparison_result(nodeId)
										if ((comparedResultsObj == null) || (typeof (comparedResultsObj) === 'undefined')) {
												var thisTreeFindingNodesObj = treeDataModel.find_related_nodes({id: nodeId, depth: nodeDepth})
												var findingNodesObj = {
														siblingNodes: selectedNodesIdObj[nodeId].selectedSiblingNodeObjArray,
														childrenNodes: selectedNodesIdObj[nodeId].selectedChildrenNodeIdArray
												}
												comparedResultsObj = treeDataModel.compareNodes(findingNodesObj, thisTreeFindingNodesObj)
										}
										//  找到与该节点以及该节点的孩子节点具有相同name的节点并且进行高亮
										if (barcodeTreeId !== thisBarcodeTreeId) {
												var sameCategoryNodeObjArray = self.find_same_category_node_array(selectedNodesIdObj[nodeId].selectedChildrenNodeIdArray)
												if (typeof (sameCategoryNodeObjArray) !== 'undefined') {
														highlight_selection_node(sameCategoryNodeObjArray)
												}
										}
										var nodeExisted = treeDataModel.is_node_existed(nodeId)
										// var nodeExisted = node_existed(thisTreeFindingFatherCurrentNodes, nodeId)
										if (nodeExisted) {
												self.highlight_single_selection_node(nodeId, nodeDepth)
										} else {
												self.highlight_miss_selection_node(nodeId)
										}
										var selectedSiblingNodeObjArray = selectedNodesIdObj[nodeId].selectedSiblingNodeObjArray
										if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
												highlight_sibling_node(selectedSiblingNodeObjArray)
										}
										// var selectedChildrenNodeIdArray = selectedNodesIdObj[nodeId].selectedChildrenNodeIdArray
										var sameChildrenNodeIdArray = comparedResultsObj.childrenNodes.same
										if (typeof (sameChildrenNodeIdArray) !== 'undefined') {
												highlight_selection_node(sameChildrenNodeIdArray)
										}
										var addChildrenNodeIdArray = comparedResultsObj.childrenNodes.add
										//  必须当前不处于全局对齐的状态才会增加add_miss的状态
										if (typeof (addChildrenNodeIdArray) !== 'undefined') {
												highlight_add_selection_node(addChildrenNodeIdArray)
										}
										var missChildrenNodeIdArray = comparedResultsObj.childrenNodes.miss
										if (typeof (missChildrenNodeIdArray) !== 'undefined') {
												highlight_miss_selection_node(missChildrenNodeIdArray)
										}
								} else if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['NULL_SELECTION']) {
										//  仅仅高亮孩子节点
										var comparedResultsObj = treeDataModel.get_selected_comparison_result(nodeId)
										if (comparedResultsObj == null) {
												var thisTreeFindingNodesObj = treeDataModel.find_related_nodes({id: nodeId, depth: nodeDepth})
												var findingNodesObj = {
														siblingNodes: selectedNodesIdObj[nodeId].selectedSiblingNodeObjArray,
														childrenNodes: selectedNodesIdObj[nodeId].selectedChildrenNodeIdArray
												}
												comparedResultsObj = treeDataModel.compareNodes(findingNodesObj, thisTreeFindingNodesObj)
										}
										var nodeExisted = treeDataModel.is_node_existed(nodeId)
										// var nodeExisted = node_existed(thisTreeFindingFatherCurrentNodes, nodeId)
										if (nodeExisted) {
												self.highlight_single_selection_node(nodeId, nodeDepth)
										} else {
												self.highlight_miss_selection_node(nodeId)
										}
										var sameChildrenNodeIdArray = comparedResultsObj.childrenNodes.same
										if (typeof (sameChildrenNodeIdArray) !== 'undefined') {
												highlight_selection_node(sameChildrenNodeIdArray)
										}
										var addChildrenNodeIdArray = comparedResultsObj.childrenNodes.add
										//  必须当前不处于全局对齐的状态才会增加add_miss的状态
										if (typeof (addChildrenNodeIdArray) !== 'undefined') {
												highlight_add_selection_node(addChildrenNodeIdArray)
										}
										var missChildrenNodeIdArray = comparedResultsObj.childrenNodes.miss
										if (typeof (missChildrenNodeIdArray) !== 'undefined') {
												highlight_miss_selection_node(missChildrenNodeIdArray)
										}
								}
								//  高亮兄弟节点
								function highlight_sibling_node(selectedSiblingNodeObjArray) {
										if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
												for (var sI = 0; sI < selectedSiblingNodeObjArray.length; sI++) {
														var selectedSiblingNode = selectedSiblingNodeObjArray[sI]
														var nodeId = selectedSiblingNode.id
														var nodeDepth = selectedSiblingNode.depth
														self.highlight_single_sibling_node(nodeId, nodeDepth)
												}
										}
								}

								//  高亮增加部分的孩子节点
								function highlight_add_selection_node(addChildrenNodeIdArray) {
										if (typeof (addChildrenNodeIdArray) !== 'undefined') {
												for (var sI = 0; sI < addChildrenNodeIdArray.length; sI++) {
														var addChildrenNode = addChildrenNodeIdArray[sI]
														var nodeId = addChildrenNode.id
														self.highlight_add_selection_node(nodeId)
												}
										}
								}

								//  高亮缺失部分的孩子节点
								function highlight_miss_selection_node(missChildrenNodeIdArray) {
										if (typeof (missChildrenNodeIdArray) !== 'undefined') {
												for (var sI = 0; sI < missChildrenNodeIdArray.length; sI++) {
														var missChildrenNode = missChildrenNodeIdArray[sI]
														var nodeId = missChildrenNode.id
														self.highlight_miss_selection_node(nodeId)
												}
										}
								}

								//  高亮相同部分的孩子节点
								function highlight_selection_node(selectedChildrenNodeIdArray) {
										for (var sI = 0; sI < selectedChildrenNodeIdArray.length; sI++) {
												var selectedChildrenNode = selectedChildrenNodeIdArray[sI]
												var nodeId = selectedChildrenNode.id
												var nodeDepth = selectedChildrenNode.depth
												self.highlight_single_selection_node(nodeId, nodeDepth)
										}
								}

								//  判断节点是否存在
								function node_existed(barcodeNodeAttrArrayObj, nodeId) {
										var nodeExisted = false
										var nodeObj = barcodeNodeAttrArrayObj[nodeId]
										if (typeof (nodeObj) === 'undefined') {
												return nodeExisted
										}
										return nodeObj.existed
								}
						},
						/**
							* 取消所有节点的高亮, 恢复到最原始的状态
							*/
						cancel_selection_highlight: function () {
								var self = this
								self.d3el.selectAll('.selection-highlight')
										.classed('selection-highlight', false)
										.style('fill', function (d, i) {
												return self.fill_handler(d, i, self)
										})
								self.d3el.selectAll('.selection-sibling-highlight')
										.classed('selection-sibling-highlight', false)
						},
						/**
							* 在该节点的孩子节点部分增加locked-aligned的class
							*/
						add_locked_align_class: function (nodeId, nodeDepth) {
								var self = this
								var treeDataModel = self.model
								var barcodeCollection = window.Datacenter.barcodeCollection
								var selectedNodesIdObj = barcodeCollection.get_selected_nodes_id()
								// 然后按照选择的状态对于节点进行高亮
								for (var item in selectedNodesIdObj) {
										var nodeId = item
										var nodeDepth = selectedNodesIdObj[item].nodeObjDepth
										var relatedNodesObj = treeDataModel.find_related_nodes({id: nodeId, depth: nodeDepth})
										// self.remove_node_unhighlight(nodeId, nodeDepth)
										self.add_single_locked_align_class(nodeId, nodeDepth)
										var selectedChildrenNodeIdArray = relatedNodesObj.childrenNodes
										if (typeof (selectedChildrenNodeIdArray) !== 'undefined') {
												// cancel_node_unhighlight(selectedChildrenNodeIdArray)
												add_node_locked_align(selectedChildrenNodeIdArray)
										}
								}

								//  在节点上增加locked-aligned的class
								function add_node_locked_align(selectedChildrenNodeIdArray) {
										for (var sI = 0; sI < selectedChildrenNodeIdArray.length; sI++) {
												var selectedChildrenNode = selectedChildrenNodeIdArray[sI]
												var nodeId = selectedChildrenNode.id
												var nodeDepth = selectedChildrenNode.depth
												self.add_single_locked_align_class(nodeId, nodeDepth)
										}
								}
						}
						,
						/**
							*  删除节点中所有的locked-aligned的类别
							*/
						remove_locked_align_class: function () {
								var self = this
								self.d3el.selectAll('.locked-align').classed('locked-align', false)
						}
						,
						/**
							* 在节点上增加locked-aligned的class
							*/
						add_single_locked_align_class: function (nodeId, nodeDepth) {
								var self = this
								self.d3el.select('#' + nodeId)
										.classed('locked-align', true)
						}
						,
						//  取消节点的unhighlight的状态
						remove_node_unhighlight: function (nodeId, nodeDepth) {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								self.d3el.select('#' + nodeId)
										.classed('selection-unhighlight', false)
						}
						,
						//  高亮缺失的选择的后代的节点
						highlight_miss_selection_node: function (nodeId) {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
								var missed_node_class = Variables.get('missed_node_class')
								self.d3el.select('#' + nodeId)
										.classed(missed_node_class, true)
										.classed('selection-unhighlight', false)
										.classed('unhighlight', false)
						}
						,
						//  高亮增加的选择的后代的节点
						highlight_add_selection_node: function (nodeId) {
								var self = this
								var treeDataModel = self.model
								var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
								self.d3el.select('#' + nodeId)
										.classed('selection-unhighlight', false)
										.classed('unhighlight', false)
								//  在当前处于global aligned的状态下, 不会classed到added-node-highlight的状态中
								if (self.is_global_comparison_state_root_select()) {
										self.d3el.select('#' + nodeId)
												.classed('added-node-highlight', true)
								}
						}
						,
						//  高亮选择的后代的节点
						highlight_single_selection_node: function (nodeId, nodeDepth) {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
								self.d3el.select('#' + nodeId)
										.classed('selection-highlight', true)
										.style('fill', function (d, i) {
														if (self.is_global_comparison_state_root_select()) {
																return barcodeNodeColorArray[nodeDepth]
														}
														return null
												}
										)
								self.d3el.select('#' + nodeId)
										.classed('selection-sibling-highlight', false)
								self.d3el.select('#' + nodeId)
										.classed('selection-unhighlight', false)
						}
						,
						//  高亮选择的兄弟节点
						highlight_single_sibling_node: function (nodeId, nodeDepth) {
								var self = this
								if (!self.d3el.select('#' + nodeId).empty()) {
										if (!self.d3el.select('#' + nodeId).classed('selection-highlight')) {
												self.d3el.select('#' + nodeId)
														.classed('selection-sibling-highlight', true)
										}
								}
						},
						/**
							*  刷新标记当前操作节点的icon的方法
							*/
						update_interaction_icon: function () {
								var self = this
								_remove_interaction_icon()
								_inner_update_interaction_icon()
								var ICON_WAIT_DURATION = Config.get('BARCODETREE_VIEW_SETTING')['ICON_WAIT_DURATION']
								setTimeout(function () {
										_inner_update_interaction_icon()
								}, ICON_WAIT_DURATION)
								//  更新当前操作的节点
								function _inner_update_interaction_icon() {
										//  增加标记barcodetree的子树节点折叠的icon
										self.add_collapsed_triangle()
										//  更新标记当前选择子树节点的icon
										self.update_current_selected_icon()
										// //  更新标记当前编辑子树节点的icon
										// self.update_current_edit_icon()
										//  更新编辑当前align节点的icon
										// self.update_aligned_sort_icon()
										//  更新barcodetree当前标记的icon
										self.update_compare_based_anchor()
								}

								//  删除在该barcode上所有的interactive icon
								function _remove_interaction_icon() {
										self.d3el.selectAll('.align-sort-icon').remove()
								}
						}
						,
						/**
							*  节点的颜色填充函数fill
							*/
						fill_handler: function (d, i, self) {
								var treeDataModel = self.model
								var barcodeRectBgColor = treeDataModel.get('barcodeRectBgColor')
								return barcodeRectBgColor
						}
						,
						//  判断节点是否是aligned范围, 如果属于aligned范围, 那么绘制节点; 否则这些节点不会被绘制
						isBelongAligned: function (nodeIndex, alignedRangeObjArray) {
								if (alignedRangeObjArray.length === 0) {
										return true
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
						},
						//  高亮鼠标悬停的节点
						highlight_current_node: function (nodeObj) {
								var self = this
								self.d3el.selectAll('rect#' + nodeObj.id)
										.classed('father-highlight', true)
										.style('fill', 'black')
								self.d3el.selectAll('path#' + nodeObj.id)
										.classed('current-highlight', true)
								self.d3el.selectAll('#' + nodeObj.id)// 需要对于当前鼠标hover的节点取消高亮
										.classed('unhighlight', false)
								self.d3el.selectAll('#' + nodeObj.id)// 取消对于非选择部分的unhighlight
										.classed('selection-unhighlight', false)
						}
						,
						unhighlight_current_node: function () {
								var self = this
								self.d3el.selectAll('.father-highlight')// 需要对于当前鼠标hover的节点取消高亮
										.classed('father-highlight', false)
										.classed('selection-unhighlight', false)
										.style('fill', function (d, i) {
												return self.fill_handler(d, i, self)
										})
						}
						,
						unhighlight_children_node: function () {
								var self = this
								self.d3el.selectAll('.children-highlight')// 需要对于当前鼠标hover的节点取消高亮
										.classed('children-highlight', false)
										.classed('selection-unhighlight', false)
										.style('fill', function (d, i) {
												return self.fill_handler(d, i, self)
										})
						}
						,
						unhighlight_sibling_node: function () {
								var self = this
								self.d3el.selectAll('.sibling-highlight')// 需要对于当前鼠标hover的节点取消高亮
										.classed('sibling-highlight', false)
										.classed('selection-unhighlight', false)
										.style('fill', function (d, i) {
												return self.fill_handler(d, i, self)
										})
						}
						,
						//  高亮节点的总函数, 在这个对象中调用高亮孩子节点, 父亲等路径节点, 兄弟节点等节点
						highlight_finding_node: function (thisNodeObj, findingNodesObj, barcodeTreeId) {
								var self = this
								var treeDataModel = self.model
								var thisBarcodeTreeId = treeDataModel.get('barcodeTreeId')
								//  高亮当前的节点
								// var findingNodesObj = treeDataModel.find_related_nodes(thisNodeObj)
								var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var onlyHighlightNode = Variables.get('only_highlight_node')
								if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['NODE_SELECTION']) {
										if (!onlyHighlightNode) {
												self.unhighlightNodes()
												self.cancel_selection_unhighlightNodes()
										}
										//  取消高亮当前的节点
										self.unhighlight_current_node()
										self.highlight_current_node(thisNodeObj)
										//  找到与该节点具有相同name的节点进行高亮
										if (barcodeTreeId !== thisBarcodeTreeId) {
												var sameCategoryNodeObjArray = self.find_single_same_category_node(thisNodeObj)
												if (typeof (sameCategoryNodeObjArray) !== 'undefined') {
														for (var sI = 0; sI < sameCategoryNodeObjArray.length; sI++) {
																self.highlight_current_node(sameCategoryNodeObjArray[sI])
														}
												}
										}
								} else if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
										if (!onlyHighlightNode) {
												self.unhighlightNodes()
												self.cancel_selection_unhighlightNodes()
										}
										//  取消高亮当前的节点以及当前节点的孩子节点
										self.unhighlight_current_node()
										self.unhighlight_children_node()
										self.unhighlight_sibling_node()
										var childrenNodes = findingNodesObj.childrenNodes
										var fatherCurrentNodes = findingNodesObj.fatherCurrentNodes
										var siblingNodes = findingNodesObj.siblingNodes
										var thisTreeFindingNodesObj = treeDataModel.find_related_nodes(thisNodeObj)
										var comparedResultsObj = treeDataModel.compareNodes(findingNodesObj, thisTreeFindingNodesObj)
										var sameChildrenNodes = comparedResultsObj.childrenNodes.same
										self.highlightChildrenNodes(sameChildrenNodes)
										var missChildrenNodes = comparedResultsObj.childrenNodes.miss
										self.highlightMissedChildrenNodes(missChildrenNodes)
										var addChildrenNodes = comparedResultsObj.childrenNodes.add
										self.highlightAddChildrenNodes(addChildrenNodes)
										self.highlightFatherAndCurrentNodes(fatherCurrentNodes)
										// if (!onlyHighlightNode) {
										self.highlightSiblingNodes(siblingNodes)
										// }
										//  找到与该节点以及该节点的孩子节点具有相同name的节点并且进行高亮
										if (barcodeTreeId !== thisBarcodeTreeId) {
												var sameCategoryNodeObjArray = self.find_single_same_category_node(thisNodeObj)
												if (typeof (sameCategoryNodeObjArray) !== 'undefined') {
														for (var sI = 0; sI < sameCategoryNodeObjArray.length; sI++) {
																self.highlight_current_node(sameCategoryNodeObjArray[sI])
														}
												}
												var sameCategoryNodeObjArray = self.find_same_category_node_array(childrenNodes)
												if (typeof (sameCategoryNodeObjArray) !== 'undefined') {
														self.highlightChildrenNodes(sameCategoryNodeObjArray)
												}
										}
								}
						}
						,
						/**
							* 找到具有相同的category的节点
							*/
						find_single_same_category_node: function (nodeObj) {
								var self = this
								var treeDataModel = self.model
								var categoryName = nodeObj.categoryName
								var barcodeNodeAttrArrayCategoryIndexObj = treeDataModel.get('barcodeNodeAttrArrayCategoryIndexObj')
								if (typeof (categoryName) !== 'undefined') {
										var sameCategoryNodeArray = barcodeNodeAttrArrayCategoryIndexObj[categoryName]
										if (typeof (sameCategoryNodeArray) !== 'undefined') {
												for (var sI = 0; sI < sameCategoryNodeArray.length; sI++) {
														if (sameCategoryNodeArray[sI].depth !== nodeObj.depth) {
																sameCategoryNodeArray.splice(sI, 1)
														}
												}
										}
								}
								return sameCategoryNodeArray
						}
						,
						/**
							* 找到具有相同的category的节点数组
							*/
						find_same_category_node_array: function (nodeObjArray) {
								var self = this
								var sameCategoryNodeArray = []
								if (typeof (nodeObjArray) !== 'undefined') {
										for (var nI = 0; nI < nodeObjArray.length; nI++) {
												var singleSameCategoryNodeArray = self.find_single_same_category_node(nodeObjArray[nI])
												if (typeof(singleSameCategoryNodeArray) !== 'undefined') {
														for (var sI = 0; sI < singleSameCategoryNodeArray.length; sI++) {
																sameCategoryNodeArray.push(singleSameCategoryNodeArray[sI])
														}
												}
										}
								}
								return sameCategoryNodeArray
						}
						,
						/**
							* 高亮孩子节点
							*/
						highlightChildrenNodes: function (childrenNodesArray) {
								var self = this
								var currentChildrenNodesArray = []
								var onlyHighlightNode = Variables.get('only_highlight_node')
								for (var sI = 0; sI < childrenNodesArray.length; sI++) {
										var currentChildrenNode = self.findCurrentNodeObj(childrenNodesArray[sI])
										if (currentChildrenNode != null) {
												currentChildrenNodesArray.push(currentChildrenNode)
										}
								}
								var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
								for (var cI = 0; cI < currentChildrenNodesArray.length; cI++) {
										var childrenNodeDepth = currentChildrenNodesArray[cI].depth
										self.d3el.select('#' + currentChildrenNodesArray[cI].id)
												.classed('children-highlight', true)
												.style('fill', function (d, i) {
														if (!onlyHighlightNode) {
																return barcodeNodeColorArray[childrenNodeDepth]
														} else {
																return 'black'
														}
												})
										self.d3el.select('#' + currentChildrenNodesArray[cI].id)
												.classed('unhighlight', false)
								}
						}
						,
						/**
							*  高亮缺失部分的孩子节点
							*/
						highlightMissedChildrenNodes: function (missedChildrenNodesArray) {
								var self = this
								for (var mI = 0; mI < missedChildrenNodesArray.length; mI++) {
										var missedChildrenNodeObjId = missedChildrenNodesArray[mI].id
										self.highlight_miss_selection_node(missedChildrenNodeObjId)
								}
						}
						,
						/**
							* 高亮增加部分的孩子节点
							*/
						highlightAddChildrenNodes: function (addChildrenNodesArray) {
								var self = this
								for (var aI = 0; aI < addChildrenNodesArray.length; aI++) {
										var addChildrenNodeObjId = addChildrenNodesArray[aI].id
										self.highlight_add_selection_node(addChildrenNodeObjId)
								}
						}
						,
						/**
							* 鼠标离开节点
							*/
						node_mouseout_handler: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var missed_node_class = Variables.get('missed_node_class')
								//	取消barcodeTree节点上的tip
								window.tip.hide()
								self.d3el.selectAll('.link-circle').remove()
								self.d3el.selectAll('.node-link').remove()
								self.d3el.selectAll('.children-highlight').style('fill', function (d, i) {
										if (typeof (d) !== 'undefined') {
												return self.fill_handler(d, i, self)
										} else {
												return null
										}
								})
								self.d3el.selectAll('.father-highlight').style('fill', function (d, i) {
										if (typeof (d) !== 'undefined') {
												return self.fill_handler(d, i, self)
										} else {
												return null
										}
								})
								self.d3el.selectAll('.sibling-highlight').classed('sibling-highlight', false)
								self.d3el.selectAll('.barcode-node').classed('unhighlight', false)
								self.d3el.selectAll('.stat-summary').classed('unhighlight', false)
								self.d3el.selectAll('.added-node-highlight').classed('added-node-highlight', false)
								self.d3el.selectAll('.' + missed_node_class).classed(missed_node_class, false)
								d3.select('#barcodetree-svg').selectAll('.collapse-triangle.' + barcodeTreeId)
										.classed('sibling-highlight', false).classed('unhighlight', false)
								//  更新原始的barcodeTree以及superTree中选择的节点
								self.highlight_selection_supertree_selection_nodes()
						}
						,
						/**
							* 增加当前选择的节点的icon
							*/
						update_current_selected_icon: function () {
								var self = this
								var barcodeCollection = window.Datacenter.barcodeCollection
								var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
								self.d3el.selectAll('.select-icon').remove()
								var selectedNodesIdObj = barcodeCollection.get_selected_nodes_id()
								if (!BarcodeGlobalSetting['Align_Lock']) {
										for (var item in selectedNodesIdObj) {
												var barcodeTreeId = selectedNodesIdObj[item].barcodeTreeId
												var nodeObjId = item
												var nodeObj = {
														nodeObjId: nodeObjId,
														barcodeTreeId: barcodeTreeId
												}
												if (self.is_global_comparison_state_root_select()) {
														if (BarcodeGlobalSetting['Align_Lock']) {
																if (barcodeCollection.get_index_in_avoid_highlight_nodearray(nodeObj) === -1) {
																		//  在aligned locked情况下, 之前选择的节点不存在highlight all children nodes的情况下才会增加selectedIcon
																		self._add_single_selection_icon(barcodeTreeId, nodeObjId)
																}
														} else {
																//  之前选择的节点不存在highlight all children nodes的情况下才会增加selectedIcon
																self._add_single_selection_icon(barcodeTreeId, nodeObjId)
														}
												}
										}
								}
								//  还需要增加在对齐的状态下增加的节点的edit icon
								if (BarcodeGlobalSetting['Align_Lock']) {
										var alignedLockedSelectedSortObj = barcodeCollection.get_aligned_locked_selected_sort_obj()
										if (alignedLockedSelectedSortObj != null) {
												var barcodeTreeId = alignedLockedSelectedSortObj.barcodeTreeId
												var nodeObjId = alignedLockedSelectedSortObj.nodeObjId
												//  之前选择的节点不存在highlight all children nodes的情况下才会增加selectedIcon
												self._add_single_selection_icon(barcodeTreeId, nodeObjId)
										}
								}
						}
						,
						/**
							* 增加单个当前选择的节点
							*/
						_add_single_selection_icon: function (barcodeTreeId, nodeObjId) {
								var self = this
								var treeDataModel = self.model
								var barcodeNodeAttrArrayObj = treeDataModel.get('barcodeNodeAttrArrayObj')
								var thisBarcodeTreeId = treeDataModel.get('barcodeTreeId')
								self.d3el.select('#barcode-container').select('.select-icon#' + nodeObjId).remove()
								var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var comparisonResultDisplay = BarcodeGlobalSetting['Comparison_Result_Display']
								if (barcodeTreeId === thisBarcodeTreeId) {
										var nodeData = barcodeNodeAttrArrayObj[nodeObjId]
										var nodeX = +self.d3el.select('#' + nodeObjId).attr('x')
										var nodeWidth = +self.d3el.select('#' + nodeObjId).attr('width')
										var nodeY = +self.d3el.select('#' + nodeObjId).attr('y')
										var nodeHeight = +self.d3el.select('#' + nodeObjId).attr('height')
										var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
										var minIconSize = window.minIconSize
										iconSize = iconSize > minIconSize ? iconSize : minIconSize
										var iconX = nodeX - 2
										var iconY = nodeY + nodeHeight / 2
										var selectIconColor = Variables.get('select_icon_color')
										var comparisonResultPadding = Variables.get('comparisonResultPadding')
										var textAnchorType = 'end'
										//  如果当前的状态是显示selectIcon, 那么需要将selectIcon左移一部分距离, 避免与summaryHistogram的重叠
										if (comparisonResultDisplay) {
												iconX = iconX - (comparisonResultPadding / 4 * 3)
												textAnchorType = 'start'
										}
										if (nodeWidth !== 0) {
												self.d3el.select('#barcode-container')
														.append('text')
														.attr('text-anchor', textAnchorType)
														.attr('dominant-baseline', 'middle')
														.attr('cursor', 'pointer')
														.attr('class', 'select-icon')
														.attr('id', nodeObjId)
														.attr('font-family', 'FontAwesome')
														.attr('x', iconX)
														.attr('y', iconY)
														.text('\uf061')
														.style('fill', selectIconColor)
														.style('font-size', iconSize + 'px')
														.on('click', function (d, i) {
																self.single_click_select_handler(nodeData)
														})
										}
								}
						}
						,
						/**
							* 获取当前视图中使用的alignRangeArray
							*/
						get_aligned_range_array: function () {
								var self = this
								var treeDataModel = self.model
								var alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
								return alignedRangeObjArray
						}
						,
						/**
							* 获取当前视图中使用的paddingNodeArray
							*/
						get_padding_node_array: function () {
								var self = this
								var treeDataModel = self.model
								var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
								if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
										var globalPaddingRangeObjArray = treeDataModel.get('globalPaddingRangeObjArray1')
										return globalPaddingRangeObjArray
								} else if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
										var paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
										return paddingNodeObjArray
								}
						}
						,
						/**
							* 获取当前的视图中使用的compactBarcodeNodeArrayObject
							*/
						get_comact_barcode_node_array_obj: function () {
								var self = this
								var treeDataModel = self.model
								var compactBarcodeNodeAttrArrayObj = treeDataModel.get('compactBarcodeNodeAttrArrayObj')
								return compactBarcodeNodeAttrArrayObj
						}
						,
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
						}
						,
						//  在对齐节点之前增加比较的统计结果
						add_comparison_summary: function () {
								var self = this
								var treeDataModel = self.model
								//  TODO
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var alignedRangeObjArray = self.get_aligned_range_array()
								var alignedComparisonResultArray = treeDataModel.get('alignedComparisonResultArray')
								var selectedLevels = Variables.get('selectedLevels')
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								//  将add-miss-summary比较中高亮的节点取消高亮
								if (alignedComparisonResultArray != null)
										return
								self.d3el.select('#barcode-container').selectAll('.add-miss-summary').remove()
								self.d3el.select('#barcode-container').selectAll('.stat-summary').remove()
								// self.d3el.selectAll('.same-node-highlight').classed('same-node-highlight', false)
								// self.d3el.selectAll('.added-node-highlight').classed('added-node-highlight', false)
								// self.d3el.selectAll('.missed-node-highlight').classed('missed-node-highlight', false)
								for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
										var alignObjIndex = alignedRangeObjArray[aI].alignedObjIndex
										var alignedObj = alignedRangeObjArray[aI]
										var rangeStartNodeIndex = alignedObj.rangeStartNodeIndex
										var alignObjId = barcodeNodeAttrArray[rangeStartNodeIndex].id
										var alignObjDepth = barcodeNodeAttrArray[rangeStartNodeIndex].depth
										var rangeEndNodeIndex = alignedObj.rangeEndNodeIndex
										var nodeDistribution = get_node_distribution(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray)
										draw_comparison_summary(alignObjIndex, alignObjId, alignObjDepth, nodeDistribution, rangeStartNodeIndex, barcodeNodeAttrArray)
								}
								//  计算得到在某一个子树下
								function get_node_distribution(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray) {
										var distributionObj = {}
										distributionObj.wholeNodeNum = 0
										for (var sI = rangeStartNodeIndex; sI <= rangeEndNodeIndex; sI++) {
												if (typeof (barcodeNodeAttrArray[sI]) !== 'undefined') {
														var nodeLevel = barcodeNodeAttrArray[sI].depth
														if (selectedLevels.indexOf(nodeLevel) !== -1) {
																if (barcodeNodeAttrArray[sI].existed) {
																		if (typeof(distributionObj[nodeLevel]) === 'undefined') {
																				distributionObj[nodeLevel] = 0
																		}
																		distributionObj[nodeLevel] = distributionObj[nodeLevel] + 1
																}
																distributionObj.wholeNodeNum = distributionObj.wholeNodeNum + 1
														}
												} else {
														console.log('sI', sI)
												}
										}
										return distributionObj
								}

								function draw_comparison_summary(alignObjIndex, alignObjId, alignObjDepth, nodeDistribution, rangeStartNodeIndex, barcodeNodeAttrArray) {
										var initRangeStartNodeX = barcodeNodeAttrArray[rangeStartNodeIndex].x
										var comparisonResultsPadding = Variables.get('comparisonResultPadding')
										var barcodeNodeGap = Config.get('BARCODE_NODE_GAP')
										var maxDepth = Variables.get('maxDepth')
										var subtreeDepth = maxDepth - alignObjDepth + 1
										var wholeNodeNum = nodeDistribution.wholeNodeNum
										var nodeDistributionArray = []
										for (var item in nodeDistribution) {
												if (item !== 'wholeNodeNum') {
														nodeDistributionArray.push(nodeDistribution[item])
												}
										}
										var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
										var DURATION = Config.get('TRANSITON_DURATION')
										//  因为默认存在 barcodeHeight / 8的向下的偏移
										var summaryRectY = 0
										var singleComparisonHeightWithPadding = self.get_comparison_summary_height(subtreeDepth)
										var singleComparisonHeight = singleComparisonHeightWithPadding * 0.9
										var nodeDistributionSummary = self.d3el.select('#barcode-container')
												.selectAll('.' + alignObjId)
												.data(nodeDistributionArray)
										nodeDistributionSummary.enter()
												.append('rect')
												.attr('class', 'stat-summary ' + alignObjId)
												.attr('id', function (d, i) {
														return 'stat-summary-' + alignObjIndex + '-' + i
												})
												.attr('width', function (d, i) {
														var nodeDistriutionNum = +d
														return nodeDistriutionNum / wholeNodeNum * comparisonResultsPadding
												})
												.attr('height', singleComparisonHeight)
												.attr('x', function (d, i) {
														var summaryRectWidth = +d / wholeNodeNum * comparisonResultsPadding
														var rangeStartNodeX = initRangeStartNodeX - barcodeNodeGap - summaryRectWidth
														return rangeStartNodeX
												})
												.attr('y', function (d, i) {
														return summaryRectY + singleComparisonHeightWithPadding * i
												})
												.style('fill', function (d, i) {
														var depth = alignObjDepth + i
														return barcodeNodeColorArray[depth]
												})
												.style('visibility', function () {
														return aligned_summary_visible_state()
												})
										nodeDistributionSummary.transition()
												.duration(DURATION)
												.attr('width', function (d, i) {
														var nodeDistriutionNum = +d
														return nodeDistriutionNum / wholeNodeNum * comparisonResultsPadding
												})
												.attr('height', singleComparisonHeight)
												.attr('x', function (d, i) {
														var summaryRectWidth = +d / wholeNodeNum * comparisonResultsPadding
														var rangeStartNodeX = initRangeStartNodeX - barcodeNodeGap - summaryRectWidth
														return rangeStartNodeX
												})
												.attr('y', function (d, i) {
														return summaryRectY + singleComparisonHeightWithPadding * i
												})
												.style('fill', function (d, i) {
														var depth = alignObjDepth + i
														return barcodeNodeColorArray[depth]
												})
												.style('visibility', function () {
														return aligned_summary_visible_state()
												})
										nodeDistributionSummary.exit().remove()
										//  判断统计barcodeTree的每层数量的柱状图是否显示的函数
										function aligned_summary_visible_state() {
												var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
												if (BarcodeGlobalSetting['Comparison_Result_Display']) {
														return 'visible'
												} else {
														return 'hidden'
												}
										}
								}
						}
						,
						//  计算增加,减少的柱状图的高度
						get_add_miss_summary_height: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var barcodeComparisonHeight = barcodeHeight * 0.8
								var addMissCategoryNum = 3
								var singleComparisonHeightWithPadding = barcodeComparisonHeight / addMissCategoryNum
								return singleComparisonHeightWithPadding
						}
						,
						//  计算comparison summary的柱状图的高度
						get_comparison_summary_height: function (subtree_depth) {
								var self = this
								var treeDataModel = self.model
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var barcodeComparisonHeight = barcodeHeight * 0.8
								var maxDepth = Variables.get('maxDepth')
								var singleComparisonHeightWithPadding = barcodeComparisonHeight / subtree_depth
								if (subtree_depth === 0) {
										singleComparisonHeightWithPadding = 0
								}
								return singleComparisonHeightWithPadding
						},
						//  ============================================================================
						//  选择点击的的barcodeTree的数组
						select_group_barcodetree: function (selectionArray) {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								//  首先取消当前树的选择状态
								self.remove_set_operation_selection_anchor()
								if (selectionArray.indexOf(barcodeTreeId) !== -1) {
										// 如果当前的树的id包括在选择的数组中, 那么久增加当前树的选择状态
										self.add_set_operation_selection_anchor()
								}
						},
						//  取消选择点击的的barcodeTree的数组
						unselect_group_barcodetree: function () {
								//  取消当前树的选择状态
								var self = this
								self.remove_set_operation_selection_anchor()
						},
						//  barcodeTree视图的字体大小
						get_font_size: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var labelFontSize = barcodeHeight / 19
								return labelFontSize
						},
						update_filtering_nodes: function (highlightObjArray, distributionLevel) {
								var self = this
								var barcodeTreeId = self.model.get('barcodeTreeId')
								if (distributionLevel === 'ratio') {
										if (highlightObjArray.length > 0) {
												self.d3el.selectAll('.barcode-node')
														.classed('distribution-unhighlight', true)
										} else {
												self.d3el.selectAll('.barcode-node')
														.classed('distribution-unhighlight', false)
										}
								} else {
										if (highlightObjArray.length > 0) {
												self.d3el.selectAll('.barcode-node')
														.classed('distribution-unhighlight', true)
										} else {
												self.d3el.selectAll('.barcode-node')
														.classed('distribution-unhighlight', false)
										}
								}
								// .classed('filtering-unhighlight', true)
								for (var hI = 0; hI < highlightObjArray.length; hI++) {
										if (barcodeTreeId === highlightObjArray[hI].treeId) {
												self.d3el.selectAll('#' + highlightObjArray[hI].nodeId)
														.classed('distribution-unhighlight', false)
										}
								}
						},
						//  点击barcode收缩时先判断动画是否结束
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
						},
						//  根据当前barcode collection中的记录, 绘制折叠的barcode子树的三角形
						add_collapsed_triangle: function () {
								var self = this
								var barcodeCollection = window.Datacenter.barcodeCollection
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var collapsedNodeIdArray = barcodeCollection.get_collapsed_nodes_id()
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var maxWidthHeight = self.get_tree_max_width_height(collapsedNodeIdArray, barcodeNodeAttrArray)
								d3.select('#barcodetree-svg').selectAll('.collapse-triangle.' + barcodeTreeId).remove()
								for (var cI = 0; cI < collapsedNodeIdArray.length; cI++) {
										self.add_single_collapsed_triangle(collapsedNodeIdArray[cI], maxWidthHeight)
								}
						},
						//  计算层次结构数据的最大的宽度以及高度
						get_tree_max_width_height: function (collapsedNodeIdArray) {
								var self = this
								var maxWidth = 0
								var maxHeight = 0
								for (var cI = 0; cI < collapsedNodeIdArray.length; cI++) {
										var treeAttr = self.get_subtree_width_height(collapsedNodeIdArray[cI])
										if (maxWidth < treeAttr.width) {
												maxWidth = treeAttr.width
										}
										if (maxHeight < treeAttr.height) {
												maxHeight = treeAttr.height
										}
										return {maxWidth: maxWidth, maxHeight: maxHeight}
								}
						},
						//  获取节点为根的子树的宽度
						get_subtree_width_height: function (nodeId) {
								var self = this
								var leveledNodeObj = self.get_leveled_node_obj(nodeId)
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
						//  根据节点id在节点的底部增加代表节点所代表子树的三角形
						add_single_collapsed_triangle: function (nodeId, maxWidthHeight) {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var triangleYPadding = 1
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var maxWidth = maxWidthHeight.maxWidth
								var maxHeight = maxWidthHeight.maxHeight
								var rootWidth = window.barcodeWidthArray[0]
								var minNodeWidth = window.barcodeWidthArray[window.barcodeWidthArray.length - 1]
								var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var barcodeGapHeight = barcodeHeight * (1 - 0.8) * 0.5
								var heightScale = d3.scale.linear().domain([0, maxHeight]).range([0, barcodeGapHeight])
								var widthScale = d3.scale.linear().domain([0, maxWidth]).range([minNodeWidth, (rootWidth + barcodeNodeInterval)])
								var treeAttr = self.get_subtree_width_height(nodeId, barcodeNodeAttrArray)
								var subtreeWidth = widthScale(treeAttr.width)
								var subtreeHeight = heightScale(treeAttr.height)
								append_triangle(nodeId, subtreeHeight, subtreeWidth)
								//  在barcodeTree中增加triangle
								function append_triangle(node_id, subtree_height, subtree_width) {
										var selectedNode = self.d3el.select('#barcode-container')
												.select('.barcode-node#' + node_id)
										if (self.d3el.select('#barcode-container').select('.barcode-node#' + node_id).empty()) {
												return
										}
										var barcodePaddingTop = treeDataModel.get('barcodePaddingTop')
										var barcodePaddingLeft = self.barcodePaddingLeft
										var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')

										var nodeX = +selectedNode.attr('x')
										var nodeY = +selectedNode.attr('y')
										var nodeWidth = +selectedNode.attr('width')
										var nodeHeight = +selectedNode.attr('height')
										var triangleY = nodeY + nodeHeight + triangleYPadding
										var triangleX = nodeX + nodeWidth / 2

										var triangleSvgY = barcodeTreeYLocation + barcodePaddingTop + triangleY
										var triangleSvgX = barcodePaddingLeft + triangleX

										subtree_height = subtree_height * 2
										//  三角形的直线的点的数据
										var lineData = [{"x": 0, "y": 0}, {"x": -subtree_width / 2, "y": subtree_height},
												{"x": subtree_width / 2, "y": subtree_height}, {"x": 0, "y": 0}]
										//  将三角形上的点连接成直线
										var lineFunction = d3.svg.line()
												.x(function (d) {
														return d.x;
												})
												.y(function (d) {
														return d.y;
												})
												.interpolate("linear");
										//  在svg上面绘制path
										var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
										var lineGraph = d3.select('#barcodetree-svg')
												.append("path")
												.attr('class', 'collapse-triangle ' + barcodeTreeId)
												.attr('id', node_id)
												.attr("d", lineFunction(lineData))
												.attr('transform', 'translate(' + triangleSvgX + ',' + triangleSvgY + ')')
								}
						},
						//  将以节点为根节点的子树中的所有节点进行分层
						get_leveled_node_obj: function (nodeId) {
								var self = this
								var nodeDepth = 0
								var nodeStartIndex = 0
								var nodeEndIndex = 0
								var depthAttrPrefix = 'depth-'
								var barcodeNodeAttrArray = self.get_barcode_node_array()
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
								return leveledNodeObj
						}
						,
						//  在barcode的背景上的节点上增加点击与双击的事件
						add_barcode_dbclick_click_handler: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var barcodeCollection = window.Datacenter.barcodeCollection
								var cc = clickcancel()
								self.d3el.selectAll('.bg').call(cc)
								cc.on('click', function (el) {
								})
								cc.on('dblclick', function (el) {
								})
								function clickcancel(d, i) {
										var event = d3.dispatch('click', 'dblclick');

										function cc(selection) {
												var down,
														tolerance = 5,
														last,
														wait = null;
												// euclidean distance
												function dist(a, b) {
														if ((typeof (a) !== 'undefined') && (typeof (b) !== 'undefined')) {
																return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
														}
														return 0
												}

												selection.on('mousedown', function () {
														down = d3.mouse(document.body);
														last = +new Date();
												});
												selection.on('mouseup', function () {
														if (dist(down, d3.mouse(document.body)) > tolerance) {
																return;
														} else {
																if (wait) {
																		window.clearTimeout(wait);
																		wait = null;
																		event.dblclick(d3.event);
																} else {
																		wait = window.setTimeout((function (e) {
																				return function () {
																						event.click(e);
																						wait = null;
																				};
																		})(d3.event), 300);
																}
														}
												});
										};
										return d3.rebind(cc, event, 'on');
								}
						},
						// 更新当前选择的节点的icon
						update_aligned_sort_icon: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeCollection = window.Datacenter.barcodeCollection
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								var unalignItemList = barcodeCollection.get_unaligned_item()
								d3.select('g#' + barcodeTreeId).selectAll('.align-sort-icon').remove()
								for (var uI = 0; uI < unalignItemList.length; uI++) {
										var nodeData = unalignItemList[uI].nodeData
										var barcodeTreeId = unalignItemList[uI].barcodeTreeId
										var srcElement = unalignItemList[uI].srcElement
										if (typeof (srcElement) !== 'undefined') {
												var nodeDataId = nodeData.id
												if (!d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).empty()) {
														var nodeX = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('x')
														var nodeWidth = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('width')
														var nodeY = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('y')
														var nodeHeight = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('height')
														var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
														var iconX = nodeX + nodeWidth / 2
														var iconY = nodeY + nodeHeight / 2
														var selectIconColor = Variables.get('select_icon_color')
														d3.select('g#' + barcodeTreeId)
																.select('#barcode-container')
																.append('text')
																.attr('text-anchor', 'middle')
																.attr('dominant-baseline', 'middle')
																.attr('cursor', 'pointer')
																.attr('class', 'align-sort-icon')
																.attr('id', nodeDataId)
																.attr('font-family', 'FontAwesome')
																.attr('x', iconX)
																.attr('y', iconY)
																.text('\uf0dc')
																.style('fill', selectIconColor)
																.style('font-size', iconSize + 'px')
												}
										}
								}
						},
						//  更新标记当前选择的基准barcode的icon
						update_compare_based_anchor: function () {
								var self = this
								var treeDataModel = self.model
								var compareBased = treeDataModel.get('compareBased')
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
								var textPadding = barcodeTextPaddingLeft / 2
								var fontSizeHeight = barcodeTextPaddingLeft < barcodeHeight ? barcodeTextPaddingLeft : barcodeHeight
								if (compareBased) {
										d3.select('#barcodetree-svg').selectAll('.compare-based-text').remove()
										self.d3el.append('text')
												.attr('text-anchor', 'middle')
												.attr('dominant-baseline', 'middle')
												.attr('cursor', 'pointer')
												.attr('class', 'compare-based-text')
												.attr('font-family', 'FontAwesome')
												.attr('x', textPadding)
												.attr('y', barcodeHeight / 2)
												.text('\uf061')
												.style('font-size', fontSizeHeight + 'px')
										//  改变compared barcodeTree的背景颜色
										d3.select('#barcodetree-svg').selectAll('.bg').classed('compare-based-selection', false)
										self.d3el.select('.bg').classed('compare-based-selection', true)
								}
						}
						,
//  删除该align对象所对应的summary state的柱状图
						remove_summary_state: function (nodeObjId) {
								var self = this
								self.d3el.selectAll('.stat-summary.' + nodeObjId).style('visibility', 'hidden')
								self.d3el.selectAll('.add-miss-summary.' + nodeObjId).style('visibility', 'hidden')
						}
						,
						//  展示该align对象所对应的summary state的柱状图
						show_summary_state: function (nodeObjId) {
								var self = this
								self.d3el.selectAll('.stat-summary.' + nodeObjId).style('visibility', 'visible')
								self.d3el.selectAll('.add-miss-summary.' + nodeObjId).style('visibility', 'visible')
						},
						//  高亮所有的相关节点
						higlight_all_related_nodes: function (nodeObj) {
								var self = this
								var treeDataModel = self.model
								var findingNodesObj = treeDataModel.find_related_nodes(nodeObj)
								self.highlight_finding_node(nodeObj, findingNodesObj)
						},
						//  鼠标离开节点的handler
						node_mouseover_handler: function (d, globalObj) {
								var self = this
								var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
								//  设置mouseover的状态为true, 表示需要trigger mouseout的信号
								var tipValue = null
								var treeDataModel = self.model
								if (treeDataModel.is_aligned_state() && (BarcodeGlobalSetting['Align_Lock'])) {
										if (!(treeDataModel.is_aligned_start(d.id) || (treeDataModel.is_aligned_range(d.id)))) {
												return
										}
								}
								if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
										//  切换到原始的barcodeTree的compact的显示模式
										if (d.compactAttr === Config.get('CONSTANT').TEMPLATE) {
												return
										}
								}
								if (d != null) {
										self.hoveringNodeId = d.id
								}
								var tip = window.tip
								if (d.existed) {
										//  在将d3-tip的类变成d3-tip-flip的情况下, 需要将d3-tip-flip再次变成d3-tip
										$('.d3-tip-flip').removeClass('d3-tip-flip').addClass('d3-tip')
										if (typeof(d.categoryName) !== 'undefined') {
												tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + d.categoryName + ", " + d.num + "</span></span>"
										} else {
												var category = d.category
												var categoryArray = category.split('-')
												var categoryName = categoryArray[0]
												tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + categoryName + ", " + d.num + "</span></span>"
										}
										//  如果tooptip的显示状态是true
										if (Config.get('BARCODETREE_TOOLTIP_ENABLE')) {
												tip.show(tipValue)
										}
										self.flipTooltipLeft()
										self.flipTooltipRight()
										globalObj.trigger_hovering_event()
										var thisNodeObj = d
										var highlightNode = Variables.get('highlight_node')
										var onlyHighlightNode = Variables.get('only_highlight_node')
										if (highlightNode) {
												//  当前处于不高亮节点的状态
												if (!onlyHighlightNode) {
														//  取消在选择状态的所有的高亮
														globalObj.trigger_mouseout_event()
												}
												var findingNodesObj = treeDataModel.find_related_nodes(d)
												globalObj.trigger_hovering_node_event(thisNodeObj, findingNodesObj)
												Variables.set('mouseover_state', true)
										} else {
												// 当前处于高亮节点的状态
												self.d3el.select('#' + d.id).classed('default-highlight', true)
										}
								}
						},
						//  将tooltip向左进行移动, 保证tooltip出现在屏幕的范围内
						flipTooltipLeft: function () {
								var d3TipLeft = $(".d3-tip").position().left
								if (d3TipLeft < 0) {
										var tipLeft = d3TipLeft - 10
										$('#tip-content').css({left: -tipLeft});
								}
						},
						//  将tooltip向右进行移动, 保证tooltip出现在屏幕范围内
						flipTooltipRight: function () {
								var d3TipLeft = $(".d3-tip").position().left
								var d3TipWidth = $('#tip-content').width()
								//  柱状图视图的宽度
								var divWidth = $('#histogram-main-panel').width()
								if ((d3TipLeft + d3TipWidth) > divWidth) {
										var tipDivLeft = (d3TipLeft + d3TipWidth) - divWidth
										$('#tip-content').css({left: -tipDivLeft});
								}
						},
						//
						fill_style_handler: function (d, i) {
								var self = this
								var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var barcodeTreeComparisonMode = Config.get('BARCODETREE_COMPARISON_MODE')
								var paddingNodeValue = 0, maxpaddingNodeValue = 0, minpaddingNodeValue = 0
								if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['ATTRIBUTE']) {
										paddingNodeValue = d.paddingNodeAttrNum
										maxpaddingNodeValue = d.maxpaddingNodeNumber
										minpaddingNodeValue = d.minpaddingNodeNumber
								} else if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['TOPOLOGY']) {
										paddingNodeValue = d.paddingNodeAttrNum
										maxpaddingNodeValue = d.maxpaddingNodeAttrNum
										minpaddingNodeValue = d.minpaddingNodeAttrNum
								}
								var coverRectFillMaxNum = 6
								var coverRectFillMinNum = 1
								var fillScale = d3.scale.linear()
										.domain([maxpaddingNodeValue, minpaddingNodeValue])
										.range([coverRectFillMaxNum, coverRectFillMinNum])
								var paddingFillNum = Math.round(fillScale(paddingNodeValue))
								return "url(#diagonal-stripe-" + paddingFillNum + ")"
						},
						//  计算某个范围内, 在某些层级上的节点数量
						get_node_number: function (rangeStart, rangeEnd) {
								var self = this
								var treeDataModel = self.model
								var nodeNumber = 0
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var selectedLevels = Variables.get('selectedLevels')
								for (var bI = rangeStart; bI <= rangeEnd; bI++) {
										if (typeof (barcodeNodeAttrArray[bI]) !== 'undefined') {
												if ((barcodeNodeAttrArray[bI].existed) && (selectedLevels.indexOf(barcodeNodeAttrArray[bI].depth) !== -1)) {//barcodeNodeAttrArray[ bI ].depth < 4
														nodeNumber = nodeNumber + 1
												}
										} else {
												// console.log('bI', bI)
										}
								}
								return nodeNumber
						}
						,
					//  因为对于当前barcode的绘制是基于level的筛选的, 所以需要通过nodeId获取在实际的barcodeNodeAttrArray中的具体index值
						get_node_index: function (nodeId) {
								var self = this
								var treeDataModel = self.model
								// TODO
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										if (barcodeNodeAttrArray[bI].id === nodeId) {
												return bI
										}
								}
						}
						,
//  将该树中所有的节点的颜色变暗
						unhighlightNodes: function () {
								var self = this
								self.d3el.selectAll('.barcode-node').classed('unhighlight', true)
								self.d3el.selectAll('.tooth').classed('unhighlight', true)
								self.d3el.selectAll('.stat-summary').classed('unhighlight', true)
								d3.select('#barcodetree-svg').selectAll('.collapse-triangle').classed('unhighlight', true)
						}
						,
//  高亮兄弟节点
						highlightSiblingNodes: function (siblingNodesArray) {
								var self = this
								for (var sI = 0; sI < siblingNodesArray.length; sI++) {
										if (!d3.select('.collapse-triangle#' + siblingNodesArray[sI].id).empty()) {
												d3.selectAll('.collapse-triangle#' + siblingNodesArray[sI].id)
														.classed('sibling-highlight', true)
														.classed('unhighlight', true)
										}
										self.d3el.selectAll('#' + siblingNodesArray[sI].id)
												.classed('sibling-highlight', true)
										self.d3el.selectAll('#' + siblingNodesArray[sI].id)
												.classed('unhighlight', true)
								}
						}
						,
						//  高亮从根节点到当前节点路径上的节点
						highlightFatherAndCurrentNodes: function (fatherNodesArray) {
								var self = this
								var treeDataModel = self.model
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var barcodeNodeHeight = barcodeHeight * 0.8
								var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
								var beginX = 0
								var endX = 0
								var onlyHighlightNode = Variables.get('only_highlight_node')
								//  在非对齐的情况下也要将节点进行高亮
								var currentFatherNodesArray = []
								for (var fI = 0; fI < fatherNodesArray.length; fI++) {
										var currentFatherNode = self.findSiblingCurrentNodeObj(fatherNodesArray[fI])
										if (currentFatherNode != null) {
												currentFatherNodesArray.push(currentFatherNode)
										}
								}
								for (var fI = 0; fI < currentFatherNodesArray.length; fI++) {
										if (currentFatherNodesArray[fI].width !== 0) {
												var fatherNodeDepth = currentFatherNodesArray[fI].depth
												self.d3el.selectAll('rect#' + currentFatherNodesArray[fI].id)
														.classed('father-highlight', true)
														.style('fill', function () {
																if (!onlyHighlightNode) {
																		return barcodeNodeColorArray[fatherNodeDepth]
																} else {
																		return 'black'
																}
														})
												self.d3el.selectAll('#' + currentFatherNodesArray[fI].id)// 需要对于当前鼠标hover的节点取消高亮
														.classed('unhighlight', false)
										}
								}
								if (Variables.get('show_father_child_link')) {
										//  只有在对齐的情况下才会绘制从根节点到当前节点的连接线
										currentFatherNodesArray = []
										for (var fI = 0; fI < fatherNodesArray.length; fI++) {
												var currentFatherNode = self.findCurrentNodeObj(fatherNodesArray[fI])
												if (currentFatherNode != null) {
														currentFatherNodesArray.push(currentFatherNode)
												}
										}
										for (var fI = 0; fI < currentFatherNodesArray.length; fI++) {
												if (currentFatherNodesArray[fI].width !== 0) {
														beginX = currentFatherNodesArray[fI].x + currentFatherNodesArray[fI].width / 2
														break
												}
										}
										for (var fI = (currentFatherNodesArray.length - 1); fI >= 0; fI--) {
												if (currentFatherNodesArray[fI].width !== 0) {
														endX = currentFatherNodesArray[fI].x + currentFatherNodesArray[fI].width / 2
														break
												}
										}
										var lineY = barcodeNodeHeight / 2
										var strokeWidth = barcodeNodeHeight / 10
										var radius = barcodeNodeHeight / 16
										self.d3el.select('#barcode-container')
												.append('line')
												.attr('class', 'node-link')
												.style('stroke-width', strokeWidth)
												.attr('x1', beginX)
												.attr('y1', lineY)
												.attr('x2', endX)
												.attr('y2', lineY)
										for (var fI = 0; fI < currentFatherNodesArray.length; fI++) {
												if (currentFatherNodesArray[fI].width !== 0) {
														var circleX = currentFatherNodesArray[fI].x + currentFatherNodesArray[fI].width / 2
														var circleY = barcodeNodeHeight / 2
														self.d3el.select('#barcode-container')
																.append('circle')
																.attr('class', 'link-circle')
																.attr('cx', circleX)
																.attr('cy', circleY)
																.style('r', radius)
																.style('stroke', 'steelblue')
												}
										}
								}
						}
						,
//  根据其他视图传动的节点对象,找到在该视图中的节点
						findCurrentNodeObj: function (nodeObj) {
								var self = this
								var treeDataModel = self.model
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var alignedRangeObjArray = self.get_aligned_range_array()
								var paddingNodeObjArray = self.get_padding_node_array()
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										if ((barcodeNodeAttrArray[bI].depth === nodeObj.depth) && (barcodeNodeAttrArray[bI].id === nodeObj.id) && (barcodeNodeAttrArray[bI].existed)) {
												return barcodeNodeAttrArray[bI]
										}
								}
								return null
						}
						,
						findSiblingCurrentNodeObj: function (nodeObj) {
								var self = this
								var treeDataModel = self.model
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								var alignedRangeObjArray = self.get_aligned_range_array()
								var paddingNodeObjArray = self.get_padding_node_array()
								for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
										if ((barcodeNodeAttrArray[bI].depth === nodeObj.depth) && (barcodeNodeAttrArray[bI].id === nodeObj.id) && (barcodeNodeAttrArray[bI].existed)) {//&& (self.isBelongAligned(bI, alignedRangeObjArray, paddingNodeObjArray))
												return barcodeNodeAttrArray[bI]
										}
								}
								return null
						}
						,
						selection_update_handler: function () {
								var self = this
								//  点击之后想要马上看到点击的效果, 而不是将鼠标移开之后, 因此需要点击的时候将鼠标悬浮的效果去除掉
								self.node_mouseout_handler()
								self.highlight_selection_supertree_selection_nodes()
						}
						,
						selection_unhighlightNodes: function () {
								var self = this
						}
						,
						cancel_selection_unhighlightNodes: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTreeId = treeDataModel.get('barcodeTreeId')
								self.d3el.selectAll('.barcode-node').classed('selection-unhighlight', false)
								self.d3el.selectAll('.selection-highlight').style('fill', function (d, i) {
										return self.fill_handler(d, i, self)
								})
						},
						//  在barcode视图中增加描述缺失或者增加节点数目的总结
						add_missed_added_summary: function () {
								var self = this
								var treeDataModel = self.model
								var missed_node_class = Variables.get('missed_node_class')
								var barcodeNodeHeight = +treeDataModel.get('barcodeNodeHeight')
								var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
								var barcodeComparisonHeight = barcodeNodeHeight * 0.6
								var summaryRectY = barcodeNodeHeight * 0.1
								var ADD_NODE_COLOR = Config.get('BARCODE_COLOR').ADD_NODE_COLOR
								var MISS_NODE_COLOR = Config.get('BARCODE_COLOR').MISS_NODE_COLOR
								var SAME_NODE_COLOR = Config.get('BARCODE_COLOR').SAME_NODE_COLOR
								var alignedComparisonResultArray = treeDataModel.get('alignedComparisonResultArray')
								if (alignedComparisonResultArray == null)
										return
								var alignedRangeObjArray = self.get_aligned_range_array()
								var barcodeNodeAttrArray = self.get_barcode_node_array()
								self.d3el.selectAll('.same-node-highlight').classed('same-node-highlight', false)
								self.d3el.selectAll('.added-node-highlight').classed('added-node-highlight', false)
								self.d3el.selectAll('.' + missed_node_class).classed(missed_node_class, false)
								self.d3el.select('#barcode-container').selectAll('.stat-summary').remove()
								self.d3el.select('#barcode-container').selectAll('.add-miss-summary').remove()
								for (var aI = 0; aI < alignedComparisonResultArray.length; aI++) {
										var alignedComparisonResult = alignedComparisonResultArray[aI]
										var alignedObjIndex = alignedComparisonResult.alignedObjIndex
										// var alignedObjId =
										var sameNodeIdArray = alignedComparisonResult.sameNodeIdArray
										// highlightSameNodes(sameNodeIdArray)
										// if (!BarcodeGlobalSetting['Align_State']) {
										// if (!(Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL)) {
										if (self.is_global_comparison_state_root_select()) {
												//  在当前不是global comparison state状态的时候会高亮增加的节点
												var addedNodeIdArray = alignedComparisonResult.addedNodeIdArray
												highlightAddedNodes(addedNodeIdArray)
										}
										var missedNodeIdArray = alignedComparisonResult.missedNodeIdArray
										highlightMissedNodes(missedNodeIdArray)
										var rangeStartNodeIndex = alignedRangeObjArray[aI].rangeStartNodeIndex
										var alignedObjId = barcodeNodeAttrArray[rangeStartNodeIndex].id
										var rangeEndNodeIndex = alignedRangeObjArray[aI].rangeEndNodeIndex
										var nodeDistribution = {}
										nodeDistribution.wholeNodeNum = get_whole_num(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray)
										nodeDistribution.sameNode = sameNodeIdArray.length
										nodeDistribution.addNode = addedNodeIdArray.length
										nodeDistribution.missNode = missedNodeIdArray.length
										var itemArray = ['addNode', 'missNode', 'sameNode']
										var colorArray = {addNode: ADD_NODE_COLOR, missNode: MISS_NODE_COLOR, sameNode: SAME_NODE_COLOR}
										draw_comparison_summary(nodeDistribution, alignedObjId, alignedObjIndex, itemArray, colorArray, rangeStartNodeIndex, barcodeNodeAttrArray)
								}

								function highlightSameNodes(sameNodeIdArray) {
										for (var sI = 0; sI < sameNodeIdArray.length; sI++) {
												self.d3el.select('#' + sameNodeIdArray[sI]).classed('same-node-highlight', true)
										}
								}

								function highlightAddedNodes(addedNodeIdArray) {
										for (var aI = 0; aI < addedNodeIdArray.length; aI++) {
												self.d3el.select('#' + addedNodeIdArray[aI]).classed('added-node-highlight', true)
										}
								}

								function highlightMissedNodes(missedNodeIdArray) {
										var missed_node_class = Variables.get('missed_node_class')
										for (var mI = 0; mI < missedNodeIdArray.length; mI++) {
												self.d3el.select('#' + missedNodeIdArray[mI]).classed(missed_node_class, true)
										}
								}

								//  获取在对齐比较部分内的barcode,选中层级的节点数量
								function get_whole_num(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray) {
										var selectedLevels = Variables.get('selectedLevels')
										var wholeNum = 0
										for (var bI = rangeStartNodeIndex; bI <= rangeEndNodeIndex; bI++) {
												var nodeLevel = barcodeNodeAttrArray[bI].depth
												if (selectedLevels.indexOf(nodeLevel) !== -1) {
														wholeNum = wholeNum + 1
												}
										}
										return wholeNum
								}

								function draw_comparison_summary(nodeDistribution, alignedObjId, alignedObjIndex, itemArray, colorArray, rangeStartNodeIndex, barcodeNodeAttrArray) {
										var initStartNodeX = barcodeNodeAttrArray[rangeStartNodeIndex].x
										var comparisonResultsPadding = Variables.get('comparisonResultPadding')
										var barcodeNodeGap = Config.get('BARCODE_NODE_GAP')
										var maxDepth = Variables.get('maxDepth')
										var wholeNodeNum = nodeDistribution.wholeNodeNum
										var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
										var DURATION = Config.get('TRANSITON_DURATION')
										//  因为默认存在 barcodeHeight / 8的向下的偏移
										var summaryRectY = 0
										var singleComparisonHeightWithPadding = self.get_add_miss_summary_height()
										var singleComparisonHeight = singleComparisonHeightWithPadding * 0.9
										for (var itemIndex = 0; itemIndex < itemArray.length; itemIndex++) {
												var rangeStartNodeX = 0
												var summaryRectWidth = nodeDistribution[itemArray[itemIndex]] / wholeNodeNum * comparisonResultsPadding
												if (summaryRectWidth !== 0) {
														rangeStartNodeX = initStartNodeX - summaryRectWidth - barcodeNodeGap
												}
												if (self.d3el.select('#barcode-container').select('#add-miss-summary-' + alignedObjIndex + '-' + itemIndex).empty()) {
														self.d3el.select('#barcode-container')
																.append('rect')
																.attr('class', 'add-miss-summary ' + alignedObjId)
																.attr('id', 'add-miss-summary-' + alignedObjIndex + '-' + itemIndex)
																.attr('width', summaryRectWidth)
																.attr('height', singleComparisonHeight)
																.attr('x', rangeStartNodeX)
																.attr('y', summaryRectY + singleComparisonHeightWithPadding * itemIndex)
																.style('fill', function () {
																		return colorArray[itemArray[itemIndex]]
																})
																.style('visibility', function () {
																		return aligned_summary_visible_state(alignedObjId)
																})
												} else {
														self.d3el.select('#barcode-container')
																.select('#add-miss-summary-' + alignedObjIndex + '-' + itemIndex)
																.transition()
																.duration(DURATION)
																.attr('width', summaryRectWidth)
																.attr('height', singleComparisonHeight)
																.attr('x', rangeStartNodeX)
																.attr('y', summaryRectY + singleComparisonHeightWithPadding * itemIndex)
																.style('visibility', function () {
																		return aligned_summary_visible_state(alignedObjId)
																})
												}
										}
								}

								//  判断统计增加与减少的柱状图是否显示的函数
								function aligned_summary_visible_state() {
										var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
										if (BarcodeGlobalSetting['Comparison_Result_Display']) {
												return 'visible'
										} else {
												return 'hidden'
										}
								}
						}
						,
						update_view_location: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeIndex = treeDataModel.get('barcodeIndex')
								var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')
								var basedModel = treeDataModel.get('basedModel')
								self.d3el
										.transition()
										.duration(Config.get('TRANSITON_DURATION'))
										.attr('transform', 'translate(' + 0 + ',' + barcodeTreeYLocation + ')')
								if (treeDataModel.get('compareBased')) {
										self.d3el.select('.bg').classed('compare-based-selection', true)
								} else {
										self.d3el.select('.bg').classed('compare-based-selection', false)
										self.remove_compare_based_anchor()
								}
								// if (basedModel == null) {
								//   self.add_comparison_summary()
								// } else {
								//   self.add_missed_added_summary()
								// }
								// var barcodeRectBgColor = treeDataModel.get('barcodeRectBgColor')
								// self.d3el.select('.bg').style('fill', barcodeRectBgColor)
						}
						,
						//  增加集合操作的标注
						add_set_operation_selection_anchor: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var textPadding = barcodeTextPaddingLeft / 2
								var fontSizeHeight = barcodeTextPaddingLeft < barcodeHeight ? barcodeTextPaddingLeft : barcodeHeight
								//  增加compare based的barcodeTree的pin的标签
								self.d3el.append('text')
										.attr('text-anchor', 'middle')
										.attr('dominant-baseline', 'middle')
										.attr('cursor', 'pointer')
										.attr('class', 'set-operation-selection-text')
										.attr('font-family', 'FontAwesome')
										.attr('x', textPadding)
										.attr('y', barcodeHeight / 2)
										.text('\uf067')
										.style('font-size', fontSizeHeight + 'px')
								self.d3el.select('.bg').classed('set-operation-selection-selection', true)
						}
						,
						//  删除集合操作的标注
						remove_set_operation_selection_anchor: function () {
								var self = this
								var treeDataModel = self.model
								self.d3el
										.selectAll('.set-operation-selection-text')
										.remove()
								self.d3el.select('.bg').classed('set-operation-selection-selection', false)
						}
						,
						add_compare_based_anchor: function () {
								var self = this
								var treeDataModel = self.model
								var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
								var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
								var textPadding = barcodeTextPaddingLeft / 2
								var fontSizeHeight = barcodeTextPaddingLeft < barcodeHeight ? barcodeTextPaddingLeft : barcodeHeight
								//  增加compare based的barcodeTree的pin的标签
								d3.select('#barcodetree-svg').selectAll('.compare-based-text').remove()
								self.d3el.append('text')
										.attr('text-anchor', 'middle')
										.attr('dominant-baseline', 'middle')
										.attr('cursor', 'pointer')
										.attr('class', 'compare-based-text')
										.attr('font-family', 'FontAwesome')
										.attr('x', textPadding)
										.attr('y', barcodeHeight / 2)
										.text('\uf08d')
										.style('font-size', fontSizeHeight + 'px')
								//  改变compared barcodeTree的背景颜色
								d3.select('#barcodetree-svg').selectAll('.bg').classed('compare-based-selection', false)
								self.d3el.select('.bg').classed('compare-based-selection', true)
						}
						,
						//  删除当前的compare_based的标记
						remove_compare_based_anchor: function () {
								var self = this
								var treeDataModel = self.model
								var compareBased = treeDataModel.get('compareBased')
								self.d3el.selectAll('.compare-based-text').remove()
								self.d3el.select('.bg').classed('compare-based-selection', false)
						},
						//  鼠标点击节点的时候, 将superTree的视图打开
						open_supertree_view: function () {
								var self = this
								Backbone.Events.trigger(Config.get('EVENTS')['OPEN_SUPER_TREE'])
								window.Variables.update_barcode_attr()
								// self.model.update_height()
						}
						,
						get_class_name: function (classNameArray) {
								var className = ''
								for (var cI = 0; cI < classNameArray.length; cI++) {
										className = className + ' ' + classNameArray[cI]
								}
								return className
						}
				},
				SVGBase
				)
		)
})
