define([
		'require',
		'marionette',
		'underscore',
		'jquery',
		'd3',
		'jquery-ui',
		'backbone',
		'datacenter',
		'config',
		'variables',
		'bootstrap-slider',
		'views/svg-base.addon',
		'text!templates/sorting.control.tpl'
], function (require, Mn, _, $, jqueryUI, d3, Backbone, Datacenter, Config, Variables, bootstrapSlider, SVGBase, Tpl) {
		'user strict'

		return Mn.LayoutView.extend({
				tagName: 'div',
				attributes: {
						'style': 'width:100%; height: 100%',
						'id': 'sorting-control-view'
				},
				template: function () {
						return _.template(Tpl)
				},
				events: {},
				initialize: function () {
						var self = this
						self.initEventFunc()
				},
				initEventFunc: function () {
						var self = this
						var sortingModel = self.model
						self.listenTo(sortingModel, 'change:sortingModelUpdate', self.update_sorting_panel_view)
				},
				onShow: function () {
						var self = this
				},
				/**
					* 更新sorting的视图
					*/
				update_sorting_panel_view: function () {
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var self = this
						var sortingModel = self.model
						var barcodeCollection = self.options.barcodeCollection
						var sortingDataObjectArray = sortingModel.get('sortingDataObjectArray')
						if (sortingDataObjectArray.length > 0) {
								//	sortingDataObjectArray不为空
								self.open_sorting_panel_view()
						} else {
								//	sortingDataObjectArray为空
								self.close_sorting_panel_view()
						}
						self.clear_all_sorting_icon()
						self.clear_all_padding_control_icon()
						for (var sI = 0; sI < sortingDataObjectArray.length; sI++) {
								var sortingDataObj = sortingDataObjectArray[sI]
								self.add_sorting_icon(sortingDataObj)
						}
						//	在sorting视图中增加代表padding节点的icon, 用于空时是否删除padding节点
						var paddingNodeObjArray = barcodeCollection.get_padding_node_object_array()
						for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
								var paddingNodeObj = paddingNodeObjArray[pI]
								if (paddingNodeObj.maxPaddingNodeLength > 0) {
										self.add_padding_control_icon(paddingNodeObj, pI)
								}
						}
				},
				/**
					* 打开sorting的控制视图
					*/
				open_sorting_panel_view: function () {
						var self = this
						var barcodeTreeConfigHeight = $('#top-toolbar-container').height()
						//  因为需要保证superTree视图不发生变化, 所以改变sorting视图的位置以及高度时直接读取superTree视图的高度
						var superTreeHeight = +($('#supertree-scroll-panel').css('height').replace('px', ''))
						var sortingPanelHeight = window.rem_px * Variables.get('sortingPanelHeight')
						$('#sorting-scroll-panel').css('height', sortingPanelHeight + 'px')
						var barcodeTreeScrollPanelTop = barcodeTreeConfigHeight + superTreeHeight + sortingPanelHeight
						$('#barcodetree-scrollpanel').css('top', (barcodeTreeScrollPanelTop) + 'px')
				},
				/**
					* 关闭sorting的控制视图
					*/
				close_sorting_panel_view: function () {
						var barcodeTreeConfigHeight = $('#top-toolbar-container').height()
						var sortingPanelHeight = 0
						//  因为需要保证superTree视图不发生变化, 所以改变sorting视图的位置以及高度时直接读取superTree视图的高度
						var superTreeHeight = +($('#supertree-scroll-panel').css('height').replace('px', ''))
						var barcodeTreeScrollPanelTop = barcodeTreeConfigHeight + superTreeHeight + sortingPanelHeight
						$('#sorting-scroll-panel').css('height', sortingPanelHeight + 'px')
						$('#barcodetree-scrollpanel').css('top', barcodeTreeScrollPanelTop + 'px')
				},
				/**
					* 在sorting的控制视图中增加padding的control的icon
					*/
				add_padding_control_icon: function (paddingNodeObj, pI) {
						var self = this
						var paddingNodeX = paddingNodeObj.paddingNodeX
						//	paddingRange的最大宽度
						var BARCODETREE_VIEW_SETTING = Config.get('BARCODETREE_VIEW_SETTING')
						var maxPaddingNodeLength = paddingNodeObj.maxPaddingNodeLength
						if (paddingNodeObj.is_removed) {
								maxPaddingNodeLength = paddingNodeObj.maxNodeWidth
						}
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						var Subtree_Compact = BARCODETREE_GLOBAL_PARAS['Subtree_Compact']
						if (Subtree_Compact) {
								maxPaddingNodeLength = BARCODETREE_VIEW_SETTING['BARCODE_NODE_PADDING_LENGTH']
						}
						var paddingNodeIconX = paddingNodeX + maxPaddingNodeLength / 2
						var paddingIconPaddingLeft = Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')
						var paddingNodeIconAbsoluteX = paddingNodeIconX + paddingIconPaddingLeft
						var paddingNodeId = 'padding-obj-' + pI
						var paddingNodeObjIcon = 'fa-minus-circle'
						if (paddingNodeObj.is_removed) {
								var paddingNodeObjIcon = 'fa-plus-circle'
						}
						var paddingIconItem = "<span class = 'padding-icon btn btn-default btn-lg' id = '" + paddingNodeId + "'> <i class='fa " + paddingNodeObjIcon + "' aria-hidden='true'></i></span>"
						$('#sorting-scroll-panel > #sorting-control-view').append(paddingIconItem)
						var sortingControlViewHeight = $('#sorting-scroll-panel > #sorting-control-view').height()
						var paddingIconHeight = $('#sorting-control-view > #' + paddingNodeId).outerHeight()
						var iconTop = (sortingControlViewHeight - paddingIconHeight) / 2
						$('#sorting-scroll-panel > #sorting-control-view > #' + paddingNodeId).css('top', iconTop)
						if (!paddingNodeObj.is_removed) {
								$('#sorting-scroll-panel > #sorting-control-view > #' + paddingNodeId).css('width', maxPaddingNodeLength)
						}
						var paddingIconWidth = $('#sorting-control-view > #' + paddingNodeId).outerWidth()
						var paddingIconPaddingLeft = paddingNodeIconAbsoluteX - paddingIconWidth
						if (!paddingNodeObj.is_removed) {
								paddingIconPaddingLeft = paddingNodeIconAbsoluteX - paddingIconWidth / 2
						}
						$('#sorting-scroll-panel > #sorting-control-view > #' + paddingNodeId).css('left', paddingIconPaddingLeft)
						self.add_padding_control_dbclick_click_handler()
				},
				/**
					* padding control按钮的点击事件
					*/
				add_padding_control_dbclick_click_handler: function () {
						var self = this
						differentiate_click_dbclick()
						function differentiate_click_dbclick() {
								var DELAY = 700, clicks = 0, timer = null
								$(function () {
										$('.padding-icon').unbind("click")
										$('.padding-icon').on("click", function (e) {
												var clickedCompareNodeId = $(this).attr('id')
												var paddingControlObjIndex = clickedCompareNodeId.replace('padding-obj-', '')
												clicks++;  //count clicks
												if (clicks === 1) {
														timer = setTimeout(function () {
																self._padding_control_click_handler(paddingControlObjIndex)
																clicks = 0;             //after action performed, reset counter
														}, DELAY);
												} else {
														clearTimeout(timer);    //prevent single-click action
														clicks = 0;             //after action performed, reset counter
												}
										})
												.on("dblclick", function (e) {
														e.preventDefault();  //cancel system double-click event
												});
								});
						}
				},
				/**
					* padding control视图中的icon的单击事件 => 将padding范围的节点删除
					*/
				_padding_control_click_handler: function (paddingControlObjIndex) {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						barcodeCollection.update_padding_node_object_array(paddingControlObjIndex)
						//	对于barcodeTree model进行重新计算
						barcodeCollection.process_barcode_model_data()
						//	按照更新之后的结果切割barcodeTree
						barcodeCollection.segment_all_barcodetree()
						//	更新barcodeTree视图的最大宽度
						barcodeCollection.updateBarcodeNodexMaxX()
						//	更新全部的barcodeTree的视图
						barcodeCollection.update_all_barcode_view()
						//	更新barcodeTree的排序视图
						self.update_sorting_panel_view()
				},
				/**
					* 在sorting的控制视图中增加sorting的icon, sorting的icon位于纵向的中心位置处
					*/
				add_sorting_icon: function (sortingDataObj) {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var SortingIconObj = Variables.get('Sorting_Icon_Obj')
						var asc_desc_para = sortingDataObj.asc_desc_para
						var comparedNodeId = sortingDataObj.comparedNodeId
						var sortOption = sortingDataObj.sortOption
						var sortOptionIcon = SortingIconObj[sortOption]
						var ascDescIcon = SortingIconObj[asc_desc_para]
						//	在append排序的object对应的sorting的图标之前, 首先删除已经存在的icon
						self.remove_sorting_icon(comparedNodeId)
						var sortingIconItem = "<span class = 'sorting-icon btn btn-default btn-lg'" + "id = '" + comparedNodeId + "'> <i class='fa " + sortOptionIcon + "' aria-hidden='true'></i>+<i class='fa " + ascDescIcon + "' aria-hidden='true'></i> </span>"
						$('#sorting-scroll-panel > #sorting-control-view').append(sortingIconItem)
						var sortingControlViewHeight = $('#sorting-scroll-panel > #sorting-control-view').height()
						var sortingIconHeight = $('#sorting-control-view > #' + comparedNodeId).outerHeight()
						var sortingIconWidth = $('#sorting-control-view > #' + comparedNodeId).outerWidth()
						var iconTop = (sortingControlViewHeight - sortingIconHeight) / 2
						$('#sorting-scroll-panel > #sorting-control-view > #' + comparedNodeId).css('top', iconTop)
						var sortingIconPaddingLeft = Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')
						if (comparedNodeId !== Variables.get('wholeTreeCompareNodeId')) {
								var sortingDataObjLocObj = barcodeCollection.get_sort_data_loc(sortingDataObj)
								sortingIconPaddingLeft = sortingIconPaddingLeft + sortingDataObjLocObj.startX
								var selectedSubtreeWidth = sortingDataObjLocObj.endX - sortingDataObjLocObj.startX
								if (selectedSubtreeWidth > sortingIconWidth) {
										$('#sorting-scroll-panel > #sorting-control-view > #' + comparedNodeId).css('width', selectedSubtreeWidth)
								} else {
										var iconMovedLeftX = (sortingIconWidth - selectedSubtreeWidth) / 2
										sortingIconPaddingLeft = sortingIconPaddingLeft - iconMovedLeftX
								}
						} else {
								if (sortingIconPaddingLeft > sortingIconWidth) {
										sortingIconWidth = sortingIconPaddingLeft
										$('#sorting-scroll-panel > #sorting-control-view > #' + comparedNodeId).css('width', sortingIconWidth)
								}
								sortingIconPaddingLeft = 0
						}
						$('#sorting-scroll-panel > #sorting-control-view > #' + comparedNodeId).css('left', sortingIconPaddingLeft)
						self.add_sorting_control_dbclick_click_handler()
				},
				/**
					* 在barcodesorting视图中的sorting按钮上增加排序的icon的监听事件: 1. single click handler; 2. dblclick click handler
					* @param comparedNodeId
					*/
				add_sorting_control_dbclick_click_handler: function (comparedNodeId) {
						var self = this
						differentiate_click_dbclick()
						function differentiate_click_dbclick() {
								var DELAY = 700, clicks = 0, timer = null;
								$(function () {
										$('.sorting-icon').unbind("click")
										$(".sorting-icon").on("click", function (e) {
												var clickedCompareNodeId = $(this).attr('id')
												clicks++;  //count clicks
												if (clicks === 1) {
														timer = setTimeout(function () {
																self._sorting_control_click_handler(clickedCompareNodeId)
																clicks = 0;             //after action performed, reset counter
														}, DELAY);
												} else {
														clearTimeout(timer);    //prevent single-click action
														self._sorting_control_dbl_click_handler(clickedCompareNodeId)
														clicks = 0;             //after action performed, reset counter
												}
										})
												.on("dblclick", function (e) {
														e.preventDefault();  //cancel system double-click event
												});
								});
						}
				},
				/**
					* 在sorting control视图中单击sorting icon的监听函数: 切换barcodeTree的sorting熟悉怒
					*/
				_sorting_control_click_handler: function (clickedCompareNodeId) {
						var self = this
						var sortingModel = self.model
						var barcodeCollection = self.options.barcodeCollection
						var sortingDataObj = sortingModel.get_sort_data_obj(clickedCompareNodeId)
						if (typeof (sortingDataObj) !== 'undefined') {
								//	更新barcodeTree sortingobj的参数
								if (sortingDataObj.asc_desc_para === 'asc') {
										sortingDataObj.asc_desc_para = 'desc'
								} else {
										sortingDataObj.asc_desc_para = 'asc'
								}
								// sortingModel.remove_sorting_data([clickedCompareNodeId])
								// sortingModel.add_sorting_data(updatedSortingDataObj)
								//	按照修改后的结果, 对于barcodeTree的model进行排序
								barcodeCollection.init_sort_barcode_model()
						}
				},
				/**
					* 在sorting control视图中双击sorting icon的监听函数: 删除barcodeTree中的排序
					*/
				_sorting_control_dbl_click_handler: function (clickedCompareNodeId) {
						var self = this
						var sortingModel = self.model
						var barcodeCollection = self.options.barcodeCollection
						//	删除该排序对象
						sortingModel.remove_sorting_data([clickedCompareNodeId])
						//	将该排序对象对应的barcodeTree的对象设置为整个BarcodeTree的inde值
						barcodeCollection.reset_sorting_result([clickedCompareNodeId])
						//	按照修改后的结果, 对于barcodeTree的model进行排序
						barcodeCollection.init_sort_barcode_model()
						barcodeCollection.uniform_layout()
				},
				/**
					* 在sorting的控制视图中删除sorting的icon
					*/
				remove_sorting_icon: function (sortingIconId) {
						var self = this
						$('#sorting-scroll-panel > #sorting-control-view > #' + sortingIconId).remove()
				},
				/**
					* 删除sorting视图中所有的sorting的icon
					*/
				clear_all_sorting_icon: function () {
						var self = this
						$('.sorting-icon').remove()
				},
				/**
					* 删除sorting视图中所有的padding control的icon
					*/
				clear_all_padding_control_icon: function () {
						$('.padding-icon').remove()
				}
		})
})
