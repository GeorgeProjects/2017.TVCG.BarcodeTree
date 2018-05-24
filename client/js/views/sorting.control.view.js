define([
		'require',
		'marionette',
		'underscore',
		'jquery',
		'jquery-ui',
		'backbone',
		'datacenter',
		'config',
		'variables',
		'bootstrap-slider',
		'views/svg-base.addon',
		'text!templates/sorting.control.tpl'
], function (require, Mn, _, $, jqueryUI, Backbone, Datacenter, Config, Variables, bootstrapSlider, SVGBase, Tpl) {
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
						console.log('BarcodeTree_Split', BARCODETREE_GLOBAL_PARAS['BarcodeTree_Split'])
						var self = this
						var sortingModel = self.model
						var sortingDataObjectArray = sortingModel.get('sortingDataObjectArray')
						if (sortingDataObjectArray.length > 0) {
								//	sortingDataObjectArray不为空
								self.open_sorting_panel_view()
						} else {
								//	sortingDataObjectArray为空
								self.close_sorting_panel_view()
						}
						self.clear_all_sorting_icon()
						for (var sI = 0; sI < sortingDataObjectArray.length; sI++) {
								var sortingDataObj = sortingDataObjectArray[sI]
								self.add_sorting_icon(sortingDataObj)
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
						$('#sorting-panel').css('height', sortingPanelHeight + 'px')
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
						$('#sorting-panel').css('height', sortingPanelHeight + 'px')
						$('#barcodetree-scrollpanel').css('top', barcodeTreeScrollPanelTop + 'px')
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
						var sortMode = sortingDataObj.sortMode
						var sortModeIcon = SortingIconObj[sortMode]
						var ascDescIcon = SortingIconObj[asc_desc_para]
						//	在append排序的object对应的sorting的图标之前, 首先删除已经存在的icon
						self.remove_sorting_icon(comparedNodeId)
						var sortingIconItem = "<span class = 'sorting-icon btn btn-default btn-lg'" + "id = '" + comparedNodeId + "'> <i class='fa " + sortModeIcon + "' aria-hidden='true'></i>+<i class='fa " + ascDescIcon + "' aria-hidden='true'></i> </span>"
						$('#sorting-panel > #sorting-control-view').append(sortingIconItem)
						var sortingControlViewHeight = $('#sorting-panel > #sorting-control-view').height()
						var sortingIconHeight = $('#sorting-control-view > #' + comparedNodeId).outerHeight()
						var sortingIconWidth = $('#sorting-control-view > #' + comparedNodeId).outerWidth()
						var iconTop = (sortingControlViewHeight - sortingIconHeight) / 2
						$('#sorting-panel > #sorting-control-view > #' + comparedNodeId).css('top', iconTop)
						var sortingIconPaddingLeft = Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')
						if (comparedNodeId !== Variables.get('wholeTreeCompareNodeId')) {
								var sortingDataObjLoc = barcodeCollection.get_sort_data_loc(sortingDataObj)
								sortingIconPaddingLeft = sortingIconPaddingLeft + sortingDataObjLoc
						} else {
								sortingIconPaddingLeft = sortingIconPaddingLeft / 2
						}
						$('#sorting-panel > #sorting-control-view > #' + comparedNodeId).css('left', (sortingIconPaddingLeft - sortingIconWidth / 2))
				},
				/**
					* 在sorting的控制视图中删除sorting的icon
					*/
				remove_sorting_icon: function (sortingIconId) {
						var self = this
						$('#sorting-panel > #sorting-control-view > #' + sortingIconId).remove()
				},
				/**
					* 删除sorting视图中所有的sorting的icon
					*/
				clear_all_sorting_icon: function () {
						var self = this
						$('.sorting-icon').remove()
				}
		})
})
