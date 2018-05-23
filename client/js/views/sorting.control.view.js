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
				events: {
				},
				initialize: function () {
						var self = this
						console.log('initialize sorting control view')
						self.initEventFunc()
				},
				initEventFunc: function () {
						var self = this
						Backbone.Events.on(Config.get('EVENTS')['OPEN_SORTING_VIEW'], function (event) {
								self.open_sorting_panel_view()
						})
						Backbone.Events.on(Config.get('EVENTS')['CLOSE_SORTING_VIEW'], function (event) {
								self.close_sorting_panel_view()
						})
				},
				onShow: function () {
						var self = this
				},
				/**
					* 打开sorting的控制视图
					*/
				open_sorting_panel_view: function () {
						var barcodeTreeConfigHeight = $('#top-toolbar-container').height()
						//  因为需要保证superTree视图不发生变化, 所以改变sorting视图的位置以及高度时直接读取superTree视图的高度
						var superTreeHeight = +($('#supertree-scroll-panel').css('height').replace('px', ''))
						var sortingPanelHeight = window.rem_px * 2
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
				}
		})
})
