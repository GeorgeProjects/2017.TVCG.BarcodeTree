define([
		'require',
		'marionette',
		'underscore',
		'jquery',
		'backbone',
		'd3',
		'datacenter',
		'config',
		'variables',
		'views/supertree.view',
		'views/barcode.comparison.view',
		'views/barcode.canvas.view',
		'views/barcode.collection.view',
		'views/tree.config.view',
		'views/barcode.distribution.view',
		'views/top.toolbar.view',
		'views/sorting.view',
		'views/brush.selection.view',
		'text!templates/barcodeView.tpl'
], function (require, Mn, _, $, Backbone, d3, Datacenter, Config, Variables, SuperTreeView,
													BarcodeComparisonView, BarcodeCanvasView, BarcodeCollectionView, TreeConfigView,
													BarcodeDistributionView, TopToolBarView, SortingView, BrushSelectionView, Tpl) {
		'use strict'
		//  barcode.view中包含三个视图, 分别是比较barcodeTree的主视图, barcode的superTree视图, barcode的参数控制视图
		return Mn.LayoutView.extend({
				tagName: 'div',
				template: _.template(Tpl),
				default: {
						duration: 500
				},
				regions: {
						'topToolbarView': '#top-toolbar-container',
						'supertreeView': '#supertree-view',
						'sortingControlView': '#sorting-scroll-panel',
						'barcodetreeView': '#barcodetree-view',
						'distributionView': '#barcode-distribution-view',
						'tooltipView': '#tooltip-view',
						'brushSelectionView': '#brush-view'
				},
				attributes: {
						'style': 'height: 100%; width: 100%',
				},
				events: {},
				initialize: function () {
						var self = this
						self.init_event()
				},
				init_event: function () {
						var self = this
						//  打开distribution视图
						Backbone.Events.on(Config.get('EVENTS')['OPEN_DISTRIBUTION_VIEW'], function (event) {
								self.open_config_view()
						})
						//  关闭distribution视图
						Backbone.Events.on(Config.get('EVENTS')['CLOSE_DISTRIBUTION_VIEW'], function (event) {
								self.close_config_view()
						})
						//  打开supertree视图
						Backbone.Events.on(Config.get('EVENTS')['OPEN_SUPER_TREE'], function (event) {
								self.open_supertree_view()
						})
						//  关闭supertree视图
						Backbone.Events.on(Config.get('EVENTS')['CLOSE_SUPER_TREE'], function (event) {
								self.close_supertree_view()
						})
						//	监听barcodeTree视图的高度与宽度的变化
						self.listenTo(Variables, 'change:barcodeNodexMaxX', self.update_barcode_view_width)
						self.listenTo(Variables, 'change:barcodeNodeyMaxY', self.update_barcode_view_height)
				},
				trigger_open_supertree: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['OPEN_SUPER_TREE'])
				},
				trigger_close_supertree: function () {
						Backbone.Events.trigger(Config.get('EVENTS')['CLOSE_SUPER_TREE'])
				},
				init_tooltip: function () {
						$(function () {
								$('[data-toggle = "tooltip"]').tooltip()
						})
				},
				//	更新barcodeTree视图的宽度
				update_barcode_view_width: function () {
						var self = this
						var barcodeTreeContainerWidth = +$('#barcodetree-scrollpanel').width()
						//	初始设置barcodTree的宽度为container视图的宽度
						var barcodetreeViewWidth = barcodeTreeContainerWidth
						var barcodeNodexMaxX = +Variables.get('barcodeNodexMaxX')
						//	如果是barcodeTree的宽度比container的宽度更大, 那么更新内部视图的宽度
						if ((!isNaN(barcodeNodexMaxX)) && (typeof(barcodeNodexMaxX) !== 'undefined')) {
								barcodetreeViewWidth = barcodeTreeContainerWidth > barcodeNodexMaxX ? barcodeTreeContainerWidth : barcodeNodexMaxX
						}
						$('#barcodetree-view').width(barcodetreeViewWidth)
						$('#supertree-view').width(barcodetreeViewWidth)
						$('#sorting-control-view').width(barcodetreeViewWidth)
				},
				//	更新barcodeTree的视图的高度
				update_barcode_view_height: function () {
						var self = this
						var barcodeNodeYMaxY = Variables.get('barcodeNodeyMaxY')
						$('#barcodetree-view').height(barcodeNodeYMaxY)
				},
				onShow: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						//  initBarcodeView的参数
						self.init_tooltip()
						self.init_sync()
						//  barcode视图上方的toolbar视图
						var topToolBarView = new TopToolBarView({
								barcodeCollection: barcodeCollection
						})
						self.showChildView('topToolbarView', topToolBarView)
						//  绘制superTree的视图, 主要是对于barcodeView进行一定的控制
						var superTreeView = new SuperTreeView({
								barcodeCollection: barcodeCollection
						})
						self.showChildView('supertreeView', superTreeView)
						// 绘制barcode进行比较的主视图
						// var barcodeComparisonView = new BarcodeComparisonView({
						// 		barcodeCollection: barcodeCollection
						// })
						var barcodeCollectionView = new BarcodeCollectionView({
								collection: barcodeCollection
						})
						// var barcodeCanvasView = new BarcodeCanvasView({
						// 		barcodeCollection: barcodeCollection
						// })
						// var barcodeCollectionView = new BarcodeCollectionView({
						// 		barcodeCollection: barcodeCollection
						// })
						// self.showChildView('barcodetreeView', barcodeComparisonView)
						self.showChildView('barcodetreeView', barcodeCollectionView)
						//  绘制barcode右侧的config panel的视图, 在config panel上面存在对于barcode视图中通用的控制
						var distributionView = new BarcodeDistributionView({
								barcodeCollection: barcodeCollection
						})
						self.showChildView('distributionView', distributionView)
						// //  绘制控制barcodeTree的视图
						// var sortingControlView = new SortingControlView({
						// 		model: sortingModel,
						// 		barcodeCollection: barcodeCollection
						// })
						// self.showChildView('sortingControlView', sortingControlView)
						var sortingView = new SortingView({
								barcodeCollection: barcodeCollection
						})
						self.showChildView('sortingControlView', sortingView)
						/**
							* 显示用户brush选择的视图
							*/
						var brushSelectionView = new BrushSelectionView({
								barcodeCollection: barcodeCollection
						})
						self.showChildView('brushSelectionView', brushSelectionView)
						/**
							* 右侧的控制视图打开按钮的控制函数
							*/
						$('#distribution-view-toggle').click(function () {
								var configPanelState = Variables.get('configPanelState')
								if (configPanelState === 'close') {
										//  当前的状态是关闭, 点击按钮将config panel打开
										self.open_config_view()
								} else if (configPanelState === 'open') {
										//  当前的状态是打开, 点击按钮将config panel关闭
										self.close_config_view()
								}
						})
						//  控制distribution的toggle在不同状态下的透明度
						$('#distribution-view-toggle').mousemove(function () {
								$('#distribution-view-toggle').css('opacity', 1)
						})
						$('#distribution-view-toggle').mouseout(function () {
								$('#distribution-view-toggle').css('opacity', 0.3)
						})
						/**
							* 在supertree-view-toggle按钮上增加监听函数, 将superTree视图打开
							*/
						$('#supertree-view-toggle').click(function () {
								var superTreeViewState = Variables.get('superTreeViewState')
								if (superTreeViewState) {
										//  当前的状态是打开的状态, 转变成关闭的状态
										self.trigger_close_supertree()
								} else {
										//  当前的状态是关闭的状态, 转变成打开的状态
										self.open_supertree_view()
										self.trigger_open_supertree()
								}
						})
						//  控制superTree view的toggle在不同状态下的透明度
						$('#supertree-view-toggle').mousemove(function () {
								$('#supertree-view-toggle').css('opacity', 1)
						})
						$('#supertree-view-toggle').mouseout(function () {
								$('#supertree-view-toggle').css('opacity', 0.3)
						})
				},
				open_config_view: function () {
						var self = this
						var duration = self.duration
						var barcodeDistributionViewWidth = +$('#barcode-config').width()
						var configPanelState = Variables.get('configPanelState')
						if (configPanelState === 'close') {
								$('#barcode-config').animate({
										right: '+=' + barcodeDistributionViewWidth,
								}, duration, function () {
										$('#distribution-view-controller').attr('class', 'glyphicon glyphicon-chevron-right')
								})
								Variables.set('configPanelState', 'open')
						}
				},
				close_config_view: function () {
						var self = this
						var duration = self.duration
						var barcodeDistributionViewWidth = +$('#barcode-config').width()
						var configPanelState = Variables.get('configPanelState')
						if (configPanelState === 'open') {
								$('#barcode-config').animate({
										right: '-=' + barcodeDistributionViewWidth,
								}, duration, function () {
										$('#distribution-view-controller').attr('class', 'glyphicon glyphicon-chevron-left')
								})
								Variables.set('configPanelState', 'close')
						}
				},
				//  打开supertree视图
				open_supertree_view: function () {
						var self = this
						window.Variables.update_barcode_attr()
						$('#supertree-state-controller').attr('class', 'glyphicon glyphicon-chevron-up')
				},
				//  关闭supertree视图
				close_supertree_view: function () {
						var self = this
						window.Variables.update_barcode_attr()
						$('#supertree-state-controller').attr('class', 'glyphicon glyphicon-chevron-down')
				},
				/**
					* 控制superTree视图与barcodeTree视图能够同时左右滚动
					*/
				init_sync: function () {
						var self = this
						$('#supertree-scroll-panel').scroll(function () {
								$('#sorting-scroll-panel').scrollLeft($(this).scrollLeft())
								$('#barcodetree-scrollpanel').scrollLeft($(this).scrollLeft())
						})
						$('#barcodetree-scrollpanel').scroll(function () {
								$('#sorting-scroll-panel').scrollLeft($(this).scrollLeft())
								$('#supertree-scroll-panel').scrollLeft($(this).scrollLeft())
						})
						$('#sorting-scroll-panel').scroll(function () {
								$('#supertree-scroll-panel').scrollLeft($(this).scrollLeft())
								$('#barcodetree-scrollpanel').scrollLeft($(this).scrollLeft())
						})
						$('#barcodetree-scrollpanel').scroll(function () {
								$('#brush-scroll-view').scrollTop($(this).scrollTop())
						})
						$('#brush-scroll-view').scroll(function () {
								$('#barcodetree-scrollpanel').scrollLeft($(this).scrollLeft())
						})
				}
		})
})
