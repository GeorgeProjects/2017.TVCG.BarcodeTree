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
		'text!templates/toolbar.tpl'
], function (require, Mn, _, $, jqueryUI, Backbone, Datacenter, Config, Variables, bootstrapSlider, SVGBase, Tpl) {
		'user strict'

		return Mn.LayoutView.extend({
				tagName: 'div',
				attributes: {
						'style': 'width:100%; height: 100%',
						'id': 'toolbar-view-div'
				},
				template: function () {
						return _.template(Tpl)
				},
				events: {
						'click #show-tooltip': 'show_tooltip',
						'click #open-histogram-view': 'open_histogram_view'
				},
				initialize: function () {
						var self = this
						//	初始化数据的名字
						var currentDataSetName = Variables.get('currentDataSetName')
						$('#dataset-name').html(currentDataSetName)
				},
				onShow: function () {
						var self = this
						var currentDataSetName = window.dataSetName
				},
				//  控制tooltip是否显示
				show_tooltip: function () {
						var self = this
						if ($('#show-tooltip').hasClass('active')) {
								$('#show-tooltip').removeClass('active')
						} else {
								$('#show-tooltip').addClass('active')
						}
				},
				//	打开histogram视图
				open_histogram_view: function () {
						$('#open-histogram-view').css('visibility', 'hidden')
						//	将histogram视图重新打开
						var toolBarViewHeight = $('#toolbar-view').height()
						$('#histogram-view').css('visibility', 'visible')
						var histogramViewHeight = $('#histogram-view').height()
						$('#barcode-view').css('top', (toolBarViewHeight + histogramViewHeight))
						//	重新计算控制icicleplot的视图按钮的位置
						var toolbarViewDivHeight = +$('#toolbar-view-div').height()
						var histogramViewHeight = +$('#histogram-view').height()
						var topToolbarViewHeight = +$('#top-toolbar-container').height()
						$('#supertree-view-toggle').css('top', (toolbarViewDivHeight + histogramViewHeight + topToolbarViewHeight) + 'px')
				}
		})
})
