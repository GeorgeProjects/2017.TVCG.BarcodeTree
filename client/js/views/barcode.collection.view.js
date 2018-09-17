define([
		'require',
		'marionette',
		'underscore',
		'jquery',
		'backbone',
		'config',
		'd3',
		'variables',
		// 'views/barcode.single.view',
		'views/barcode.single.canvas',
		'views/svg-base.addon'
], function (require, Mn, _, $, Backbone, Config, d3, Variables, BarcodeSingleCanvas, SVGBase) {
		'use strict';

		return Mn.CollectionView.extend(_.extend({
				tagName: 'div',
				childView: BarcodeSingleCanvas,
				attributes: {
						'id': 'collection-view',
						'class': 'barcode-tree-collection-div',
				},
				initialize: function () {
						var self = this
						self.listenTo(this.collection, 'add', self.add)
						self.listenTo(this.collection, 'remove', self.remove)
						self.listenTo(Variables, 'change:selectedBarcodeTreeArray', self.update_barcode_tree_selection)
						//  鼠标悬浮在barcode上面广播的事件
						Backbone.Events.on(Config.get('EVENTS')['HOVERING_BARCODE_EVENT'], function (event) {
								var barcodeTreeId = event.barcodeTreeId
						})
						//  鼠标从barcode上面移开广播的事件
						Backbone.Events.on(Config.get('EVENTS')['UN_HOVERING_BARCODE_EVENT'], function (event) {
						})
				},
				//	更新barcdoeTree的选择
				update_barcode_tree_selection: function () {
						var self = this
						var selectedBarcodeTreeArray = Variables.get('selectedBarcodeTreeArray')
				},
				onShow: function () {
						var self = this
						// $('#collection-view').on('click', function () {
						// 		var barcodeCollection = self.collection
						// 		//	删除在sorting视图中表示排序的icon
						// 		Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_ALL_NODE_SORTING_VIEW_ICON'])
						// 		//  重置对齐的参数
						// 		Variables.set('alignedLevel', 0)
						// 		//	在barcodeCollection中删除所有选择的节点
						// 		barcodeCollection.remove_all_selected_node()
						// })
				},
				add: function () {
						var self = this
				},
				remove: function () {
						var self = this
				},
				//	在选择的barcodeTree上增加表示选择的div边框
				append_selection_div: function () {
						var self = this

				},
				//	删除选择的div的边框
				remove_selection_div: function () {
						var self = this

				}
		}))
})