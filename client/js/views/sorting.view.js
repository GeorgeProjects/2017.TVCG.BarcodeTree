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
						self.init_events()
						self.init_paras()
				},
				//	初始化排序相关的参数
				init_paras: function () {
						var self = this
						self.itemSortOptions = ['DATE', 'DAY']
						self.nodeSortOptions = ['NODENUM', 'ATTRIBUTE', 'SIMILARITY']
						self.defaultItemSort = 'DATE'
						self.defaultNodeSort = 'NODENUM'
						self.itemSortingId = 'barcodetree-sorting'
						self.sortingNodeIconClass = 'sorting-node-icon'
						self.sortingItemIconClass = 'sorting-item-icon'
						self.currentSelectedItemSort = self.defaultItemSort
						self.currentSelectedNodeSort = self.defaultNodeSort
						self.sortingRecords = {}
						self.sortingRecords[self.itemSortingId] = self.defaultItemSort
						self.sortingIconObj = null
						self.ascSortingMode = 'asc'
						self.descSortingMode = 'desc'
						self.sortingNodeId = null
				},
				//	初始化所有的事件
				init_events: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						Backbone.Events.on(Config.get('EVENTS')['UPDATE_SORTING_VIEW'], function (event) {
								var sortingIconObj = self.sortingIconObj
								if (typeof (event) !== 'undefined') {
										sortingIconObj = event.sortingIconObj
								}
								if (sortingIconObj != null) {
										var barcodeTreeId = sortingIconObj.barcodeTreeId
										var treeDataModelResults = barcodeCollection.where({barcodeTreeId: barcodeTreeId})
										if (treeDataModelResults.length > 0) {
												var treeDataModel = treeDataModelResults[0]
												var nodeId = sortingIconObj.id
												self.sortingNodeId = nodeId
												var nodeObj = treeDataModel.get_node_obj_by_id(nodeId)
												sortingIconObj.x = nodeObj.x + Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')
												self.update_sorting_icon(sortingIconObj)
										}
								}
								//	按照当前排序的节点更新排序的icon
								if (typeof (event) === 'undefined') {
										if ((self.sortingNodeId != null) && (typeof (self.sortingNodeId) !== 'undefined')) {
												self.update_sorting_icon_pos(self.sortingNodeId)
										}
								}
						})
						Backbone.Events.on(Config.get('EVENTS')['REMOVE_SORTING_VIEW_ICON'], function (event) {
								var removedNodeObjArray = event.removedNodeObjArray
								for (var rI = 0; rI < removedNodeObjArray.length; rI++) {
										var removedNodeObj = removedNodeObjArray[rI]
										var removedNodeObjId = removedNodeObj.nodeObjId
										$('#sorting-control-view > #' + removedNodeObjId).remove()
								}
								self.sortingNodeId = null
								self.sortingIconObj = null
						})
						Backbone.Events.on(Config.get('EVENTS')['INIT_ITEM_SORTING_VIEW_ICON'], function (event) {
								self.add_item_sort_icon()
						})
						Backbone.Events.on(Config.get('EVENTS')['REMOVE_ALL_ITEM_SORTING_VIEW_ICON'], function (event) {
								self.remove_all_item_sorting_icon()
						})
						Backbone.Events.on(Config.get('EVENTS')['REMOVE_ALL_NODE_SORTING_VIEW_ICON'], function (event) {
								$('.sorting-node-icon').remove()
								self.sortingNodeId = null
								self.sortingIconObj = null
						})
				},
				//	更新sorting的视图
				update_sorting_icon: function (sortingIconObj) {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var sortingIconArray = barcodeCollection.get_sorting_icon_array()
						var sortingNodeIconClass = self.sortingNodeIconClass
						var sortingIconClass = self.sortingNodeIconClass
						var nodeId = sortingIconObj.id
						//	删除按照barcodeTree的节点sorting的icon
						if ($('#sorting-control-view > #' + sortingIconObj.id).length) {
								$('#sorting-control-view > #' + sortingIconObj.id).css('left', sortingIconObj.x)
						} else {
								$('.' + sortingNodeIconClass).remove()
								if (typeof (sortingIconObj) !== 'undefined') {
										var sortingIconId = sortingIconObj.id
										var centerPos = sortingIconObj.x
										var positionParas = 'left'
										if (typeof (self.sortingRecords[sortingIconId]) === 'undefined') {
												self.sortingRecords[sortingIconId] = self.defaultNodeSort
										}
										//	在对于BArcodeTree排序的选项中, 排序控制部分的id是不确定的, 需要依据点击的barcodeTree中节点的id进行确定
										var defaultNodeSort = self.sortingRecords[sortingIconId]
										self.append_node_sorting_icon(sortingIconId, sortingIconClass, defaultNodeSort, centerPos, positionParas)
										self.sortingIconObj = sortingIconObj
								}
						}
				},
				//	删除所有的sorting的icon
				remove_all_item_sorting_icon: function () {
						var self = this
						var sortingItemIconClass = self.sortingItemIconClass
						$('.' + sortingItemIconClass).remove()
				},
				onShow: function () {
						var self = this
						self.init_click_func()
						self.remove_all_item_sorting_icon()
				},
				init_click_func: function () {
						$('#sorting-control-view').click(function (event) {
								$('#selection-options').remove()
						})
				},
				//	初始化排序整个barcodeTree的icon
				add_item_sort_icon: function () {
						var self = this
						var sortingIconId = self.itemSortingId
						var defaultItemSort = self.defaultItemSort
						var sortingItemIconClass = self.sortingItemIconClass
						var positionParas = 'center'
						self.sortingRecords[sortingIconId] = defaultItemSort
						var centerPos = (Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')) / 2
						$('.' + sortingItemIconClass).remove()
						self.append_node_sorting_icon(sortingIconId, sortingItemIconClass, self.sortingRecords[sortingIconId], centerPos, positionParas)
				},
				//	在视图上增加排序选择的选项
				append_selection_option: function (sortingIconId, itemSortOptions, defaultItemSort) {
						var self = this
						$('.selection-group').remove()
						var dropDownItem1 = "<div id='selection-options' class='selection-group list-group'>"
						var dropDownItem3 = "<ul>"
						var dropDownItem8 = "</ul>"
						var dropDownItem9 = "</div>"
						var dropdownHead = dropDownItem1 + dropDownItem3
						var dropdownContent = ""
						for (var iI = 0; iI < itemSortOptions.length; iI++) {
								if (defaultItemSort === itemSortOptions[iI]) {
										var dropDownItem = "<a class='list-group-item active' href='#'>" + itemSortOptions[iI] + "</a>"
								} else {
										var dropDownItem = "<a class='list-group-item' href='#'>" + itemSortOptions[iI] + "</a>"
								}
								dropdownContent = dropdownContent + dropDownItem
						}
						var dropdownTail = dropDownItem8 + dropDownItem9
						var selectionOption = dropdownHead + dropdownContent + dropdownTail
						$('#barcode-view').append(selectionOption)
						$('.list-group-item').click(function () {
								$('.list-group-item').removeClass('active')
								$(this).addClass('active')
								var sortingOption = $(this).html()
								$('#' + sortingIconId + ' > #sorting-criteria').html(sortingOption)
								self.sortingRecords[sortingIconId] = sortingOption
								$('.selection-group').remove()
								//	寻找当前的排序选项中有排序的按钮处于active的状态, 那么点击其他的排序准则之后需要自动进行排序
								var sortingModeIcon = $('#' + sortingIconId + ' .active').parent()
								if (sortingModeIcon.length !== 0) {
										var sortingModeIconId = sortingModeIcon.attr('id')
										if (sortingModeIconId === 'sort-descend-span') {
												self.click_sorting_handler(sortingIconId, self.descSortingMode)
										} else if (sortingModeIconId === 'sort-ascend-span') {
												self.click_sorting_handler(sortingIconId, self.ascSortingMode)
										}
								}
						})
						var topToolBarHeight = +$('#top-toolbar-container').height()
						var sortingScrollPanelHeight = +$('#sorting-scroll-panel').height()
						var supertreeScrollPanelHeight = +$('#supertree-scroll-panel').height()
						$('.selection-group').css('top', (topToolBarHeight + sortingScrollPanelHeight + supertreeScrollPanelHeight))
						var selectionOptionWidth = +$('#selection-options').width()
						var position = $("#" + sortingIconId + " > .sorting-criteria").position()
						var sortingElementLeft = position.left
						$('#selection-options').css('visibility', 'hidden')
				},
				//	在视图上增加排序BarcodeTree的某个子树部分的选项
				append_node_sorting_icon: function (sortingIconId, sortingIconClass, defaultNodeSort, center_pos, position_para) {
						var self = this
						var sortingAscendItemHead = "<span class = 'sorting-controller-span' id = 'sort-ascend-span'>"
						var sortingAscendItemTail = "</span>"
						var sortingDescendItemHead = "<span class = 'sorting-controller-span' id = 'sort-descend-span'>"
						var sortingDescendItemTail = "</span>"
						//	升序排序的图标
						var ascendIconItem = "<i class='fa fa-caret-up sort-controller' id = 'sort-ascend' aria-hidden='true'></i>"
						//	降序排序的图标
						var descendIconItem = "<i class='fa fa-caret-down sort-controller' id = 'sort-descend' aria-hidden='true'></i>"
						var ascSortingItem = sortingAscendItemHead + ascendIconItem + sortingAscendItemTail
						var descSortingItem = sortingDescendItemHead + descendIconItem + sortingDescendItemTail
						//	排序准则的文本
						var sortingCriteria = "<span class='sorting-criteria' id='sorting-criteria'>" + defaultNodeSort + "</span>"
						//	排序的控制选项
						var sortingIconItem = "<div" + " id = '" + sortingIconId + "' class = 'sorting-icon " + sortingIconClass + "'>" + ascSortingItem + descSortingItem + sortingCriteria + "</div>"
						//	在排序视图中增加排序的控制选项
						$('#sorting-scroll-panel > #sorting-control-view').append(sortingIconItem)
						//	计算控制选项的竖直方向的位置, 并且使他们居中显示
						var sortingScrollPanelHeight = +$('#sorting-scroll-panel').height()
						var sortingControllerSpanHeight = +$('#sorting-control-view > #' + sortingIconId + '> .sorting-controller-span').height()
						var sortingControllerSpanWidth = +$('#sorting-control-view > #' + sortingIconId + '> .sorting-controller-span').width()
						var sortingControlVerticalCenterPaddingTop = (sortingScrollPanelHeight - sortingControllerSpanHeight) / 2
						$('#sorting-control-view > #' + sortingIconId + '> .sorting-controller-span').css('top', sortingControlVerticalCenterPaddingTop)
						$('#sorting-control-view > #' + sortingIconId + '> #sort-ascend-span').css('left', 0)
						$('#sorting-control-view > #' + sortingIconId + '> #sort-descend-span').css('left', sortingControllerSpanWidth)
						var sortingCriteriaHeight = +$('#sorting-control-view > #' + sortingIconId + '> .sorting-criteria').height()
						var sortingCriteriaVerticalCenterPaddingTop = (sortingScrollPanelHeight - sortingCriteriaHeight) / 2
						var sortingCriteriaWidth = +$('#sorting-control-view > #' + sortingIconId + '> .sorting-criteria').width()
						$('#sorting-control-view > #' + sortingIconId + '> .sorting-criteria').css('top', sortingCriteriaVerticalCenterPaddingTop)
						$('#sorting-control-view > #' + sortingIconId + '> .sorting-criteria').css('left', sortingControllerSpanWidth * 2)
						//	计算全部排序准则部分的宽度sortingControlWidth
						var sortingControlWidth = sortingControllerSpanWidth * 2 + sortingCriteriaWidth
						var centerPos = center_pos
						if (position_para === 'center') {
								centerPos = centerPos - sortingControlWidth / 2
						} else if (position_para === 'left') {
								centerPos = centerPos
						}
						centerPos = centerPos < 0 ? 0 : centerPos
						//	设置排序控制选项的水平方向的位置, 使其居中显示
						$('#sorting-control-view > #' + sortingIconId).css('left', centerPos)
						//	增加sorting视图中criteria的点击事件
						self.add_criteria_click_event(sortingIconId)
						self.add_sorting_click_event(sortingIconId)
				},
				//	增加点击事件
				add_criteria_click_event: function (sortingIconId) {
						var self = this
						//	在排序的准则上增加点击响应的事件, 即打开排序选项的按钮
						$('#' + sortingIconId + ' > #sorting-criteria').click(function (event) {
								event.stopPropagation()
								var sortingRecords = self.sortingRecords
								if ($('#selection-options').length) {
										$('#selection-options').remove()
								} else {
										var element = $(this).parent()
										var parentNodeId = $(element).attr("id")
										var defaultSort = sortingRecords[parentNodeId]
										//
										if (parentNodeId === self.itemSortingId) {
												var itemSortOptions = self.itemSortOptions
												self.append_selection_option(parentNodeId, itemSortOptions, defaultSort)
										} else {
												var nodeSortOptions = self.nodeSortOptions
												self.append_selection_option(parentNodeId, nodeSortOptions, defaultSort)
										}
										var parentElementLeft = $(this).parent().position().left
										var sortingElementLeft = $(this).position().left
										var sortingElementWidth = $(this).width()
										var selectionOptionWidth = +$('#selection-options').width()
										$('#selection-options').css('left', (parentElementLeft + sortingElementLeft + sortingElementWidth / 2 - selectionOptionWidth / 2))
										$('#selection-options').css('visibility', 'visible')
								}
						})
				},
				//	增加点击排序事件
				add_sorting_click_event: function (sortingIconId) {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var sortingRecords = self.sortingRecords
						$('#' + sortingIconId + ' #sort-ascend').click(function () {
								$('#sorting-control-view .sort-controller').removeClass('active')
								$(this).addClass('active')
								self.click_sorting_handler(sortingIconId, self.ascSortingMode)
								self.update_sorting_icon_pos(sortingIconId)
						})
						$('#' + sortingIconId + ' #sort-descend').click(function () {
								$('#sorting-control-view .sort-controller').removeClass('active')
								$(this).addClass('active')
								self.click_sorting_handler(sortingIconId, self.descSortingMode)
								self.update_sorting_icon_pos(sortingIconId)
						})
				},
				//	点击按钮进行排序的选项
				click_sorting_handler: function (sortingIconId, sortingMode) {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var sortingRecords = self.sortingRecords
						var sortOption = sortingRecords[sortingIconId]
						var comparedNodeId = sortingIconId
						barcodeCollection.uniform_sort_handler(sortingMode, sortOption, comparedNodeId)
				},
				//	更新排序部分按钮的水平位置
				update_sorting_icon_pos: function (sortingIconId) {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var barcodeNodeObj = barcodeCollection.get_node_obj_from_id(sortingIconId)
						if (typeof (barcodeNodeObj) !== 'undefined') {
								var centerPos = barcodeNodeObj.x + Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')
								if ($('#sorting-control-view > #' + sortingIconId).length > 0) {
										$('#sorting-control-view > #' + sortingIconId).animate({
												left: centerPos
										}, {
												duration: 500
										})
								}
						}
				}
		})
})
