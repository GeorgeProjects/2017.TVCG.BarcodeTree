define([
		'require',
		'marionette',
		'underscore',
		'jquery',
		'backbone',
		'datacenter',
		'config',
		'variables',
		'views/histogram.main.view',
		'views/svg-base.addon',
		'text!templates/histogram.view.tpl'
], function (require, Mn, _, $, Backbone, Datacenter, Config, Variables, HistogramMain, SVGBase, Tpl) {
		'user strict'

		return Mn.LayoutView.extend({
				tagName: 'div',
				attributes: {
						'style': 'width:100%; height: 100%',
						'id': 'barcode-height'
				},
				template: function () {
						return _.template(Tpl)
				},
				regions: {
						'histogramMainView': '#histogram-main-panel'
				},
				events: {
						'click #histogram-close': 'close_histogram_view'
				},
				initialize: function () {
						var self = this
				},
				onShow: function () {
						var self = this
						var histogramModel = self.model
						var barcodeCollection = self.options.barcodeCollection
						self.showChildView('histogramMainView', new HistogramMain({
								model: histogramModel,
								barcodeCollection: barcodeCollection
						}))
						$('#histogram-view').on('mouseover', function () {
								$('#histogram-close').css('visibility', 'visible')
						})
								.mouseout(function () {
										$('#histogram-close').css('visibility', 'hidden')
								})
						//	在histogram-close增加mouseover的事件
						$('#histogram-close').on('mouseover', function () {
								$('#histogram-close').css('color', 'red')
						})
								.mouseout(function () {
										$('#histogram-close').css('color', 'black')
								})
				},
				/**
					* 关闭histogram视图
					*/
				close_histogram_view: function () {
						//	将histogram视图关闭
						$('#open-histogram-view').css('visibility', 'visible')
						var toolBarViewHeight = $('#toolbar-view').height()
						$('#histogram-view').css('visibility', 'hidden')
						$('#barcode-view').css('top', toolBarViewHeight)
						//	重新计算控制icicleplot的视图按钮的位置
						var toolbarViewDivHeight = +$('#toolbar-view-div').height()
						var histogramViewHeight = +$('#histogram-view').height()
						var topToolbarViewHeight = +$('#top-toolbar-container').height()
						$('#supertree-view-toggle').css('top', (toolbarViewDivHeight + topToolbarViewHeight) + 'px')
				}
		})
})
