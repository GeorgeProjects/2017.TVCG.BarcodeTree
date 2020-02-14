define([
		'require',
		'marionette',
		'underscore',
		'backbone',
		'config',
		'd3',
		'd3Barchart',
		'variables',
		'text!templates/selectionConfig.tpl'
], function (require, Mn, _, Backbone, Config, d3, d3BarChart, Variables, Tpl) {
		'use strict'

		return Mn.LayoutView.extend({
				tagName: 'div',
				template: _.template(Tpl),
				attributes: {
						'style': 'height: 100%; width: 100%',
				},
				initialize: function () {
						var self = this
				},
				onShow: function () {
						var self = this
						self.render_selection_config_view()
						//	在config视图上的按钮的点击事件
						self.selection_click_event()
				},
				//	渲染selection的配置视图
				render_selection_config_view: function () {
						$('#selection-config-div #config-minimize').on('mouseover', function () {
								$('#selection-config-div #config-minimize').css({'-webkit-text-fill-color': 'black'})
						})
						$('#selection-config-div #config-minimize').on('mouseout', function () {
								$('#selection-config-div #config-minimize').css({'-webkit-text-fill-color': '#aaa'})
						})
						$('#selection-config-div #config-close').on('mouseover', function () {
								$('#selection-config-div #config-close').css({'-webkit-text-fill-color': 'red'})
						})
						$('#selection-config-div #config-close').on('mouseout', function () {
								$('#selection-config-div #config-close').css({'-webkit-text-fill-color': '#aaa'})
						})
						$('#selection-config-div #config-close').on('click', function () {
								$('#selection-config-div').css({visibility: 'hidden'})
								$('#selection-config-panel-toggle').removeClass('active')
						})
						$('#selection-config-div').draggable()
				},
				//	初始化在selection视图上的点击事件
				selection_click_event: function () {
						var self = this
						$('#tooltip-mode-button').click(function () {
								if ($('#tooltip-mode-button').hasClass('active')) {
										//	当前不显示tooltip
										$('#tooltip-mode-button').removeClass('active')
										$('#tooltip-mode-label').html('Off')
										Variables.set('show_tooltip', false)
								} else {
										//	当前显示tooltip
										$('#tooltip-mode-button').addClass('active')
										$('#tooltip-mode-label').html('On')
										Variables.set('show_tooltip', true)
								}
						})
						$('#selection-unhighlight-button').click(function () {
								if ($('#selection-unhighlight-button').hasClass('active')) {
										//	当前状态: 其他的节点不会被unhighlight
										$('#selection-unhighlight-button').removeClass('active')
										$('#selection-highlight-button').addClass('active')
										Variables.set('unhighlight_other_nodes', false)
								} else {
										//	当前状态: 其他的节点会被unhighlight
										$('#selection-unhighlight-button').addClass('active')
										$('#selection-highlight-button').removeClass('active')
										Variables.set('unhighlight_other_nodes', true)
								}
						})
						$('#selection-highlight-button').click(function () {
								if ($('#selection-highlight-button').hasClass('active')) {
										//	当前状态: 其他的节点会被unhighlight
										$('#selection-highlight-button').removeClass('active')
										$('#selection-unhighlight-button').addClass('active')
										Variables.set('unhighlight_other_nodes', true)

								} else {
										//	当前状态: 其他的节点不会被unhighlight
										$('#selection-highlight-button').addClass('active')
										$('#selection-unhighlight-button').removeClass('active')
										Variables.set('unhighlight_other_nodes', false)
								}
						})
				}
		})
})