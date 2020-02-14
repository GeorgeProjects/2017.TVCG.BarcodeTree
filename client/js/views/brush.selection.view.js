define([
		'require',
		'marionette',
		'underscore',
		'backbone',
		'd3',
		'config',
		'variables',
		'bootstrap',
		'bootstrap-slider',
		'text!templates/brushSelection.tpl'
], function (require, Mn, _, Backbone, d3, Config, Variables, Bootstrap, BootstrapSlider, Tpl) {
		'use strict'
		/**
			* superTree视图的整体是一个冰柱图, 由不同层级的节点依次构成, 默认最上方时根节点, 根节点的长度是所有的BarcodeTree中的最宽的长度
			* superTree视图的设计有两个目的, 第一个是在对于barcodeTree中的没有对齐的状态下, 只是提供BarcodeTree进行数值比较的功能, 与BarcodeTree的节点数值比较相对应
			* focus并不是对齐比较, 在不focus到任何子树的情况下, 相当于focus到根节点的子树, focus到整体的子树或者整个树, 此时仅仅比较下一层子树的节点数目, 或者属性值数目
			* 在对齐节点进行比较的情况下, 就要具体的移动superTree中子树的根节点的位置, 移动到对应的位置上
			*/
		return Mn.LayoutView.extend({
				tagName: 'div',
				template: _.template(Tpl),
				attributes: {
						style: 'width: 100%; height: 100%;',
						id: 'brush-selection'
				},
				default: {},
				events: {},
				initialize: function () {
						var self = this
						self.init_event()
				},
				init_event: function () {
						var self = this
						//  更新选中的barcdoeTree的层级
						Backbone.Events.on(Config.get('EVENTS')['UPDATE_BRUSH_SELECTION_VIEW'], function () {
								self.update_slider_bar()
						})
						self.listenTo(Variables, 'change:barcodeNodeyMaxY', self.update_slider_bar)
				},
				onShow: function () {
						var self = this
						//	更新选择barcodeTree的范围的slider bar
						var barcodeCollection = self.options.barcodeCollection
						var barcodeTreeNum = barcodeCollection.length
						var selectionViewHeight = window.barcodeHeight * barcodeTreeNum
						$('#brush-view').height(selectionViewHeight)
						var selectionRange = [0, 0]
						self.brush_slider = new BootstrapSlider("#ex18b", {
								id: 'ex18b',
								min: 0,
								max: barcodeTreeNum,
								value: selectionRange,
								orientation: 'vertical',
								labelledby: ['ex18-label-2a', 'ex18-label-2b']
						}).on('slide', function () {
						}).on('slideStop', function () {
								var selectionRange = self.brush_slider.getValue()
								var selectedBarcodeTreeArray = []
								for (var sI = selectionRange[0]; sI < selectionRange[1]; sI++) {
										var barcodeModelFilterResult = barcodeCollection.where({barcodeIndex: sI})
										if (barcodeModelFilterResult.length > 0) {
												var barcodeModel = barcodeModelFilterResult[0]
												var barcodeTreeId = barcodeModel.get('barcodeTreeId')
												if (selectedBarcodeTreeArray.indexOf(barcodeTreeId) === -1) {
														selectedBarcodeTreeArray.push(barcodeTreeId)
												}
										}
								}
								Variables.set('selectedBarcodeTreeArray', selectedBarcodeTreeArray)
						})
						if (barcodeTreeNum === 0) {
								$('#brush-view').css('visibility', 'hidden')
						} else {
								$('#brush-view').css('visibility', 'visible')
						}
				},
				//	更新sliderbar
				update_slider_bar: function () {
						var self = this
						var barcodeCollection = self.options.barcodeCollection
						var barcodeTreeNum = barcodeCollection.length
						var selectionViewHeight = window.barcodeHeight * barcodeTreeNum
						$('#brush-view').height(selectionViewHeight)
						self.brush_slider.options.min = 0
						self.brush_slider.options.max = barcodeTreeNum
						self.brush_slider.resize()
						var selectionRange = self.brush_slider.getValue()
						self.brush_slider.setValue(selectionRange)
						if (barcodeTreeNum === 0) {
								$('#brush-view').css('visibility', 'hidden')
						} else {
								$('#brush-view').css('visibility', 'visible')
						}
				}
		})
})
