/**
	* [created by guozheng Li 2017/2/10]
	* @param  {[type]} sortingDataModel     [description]
	* @return {[type]}                      [description]
	*/
define([
		'require',
		'marionette',
		'underscore',
		'config',
		'backbone',
		'variables'
], function (require, Mn, _, Config, Backbone, Variables) {
		'use strict'

		return Backbone.Model.extend({
				defaults: {
						'sortingDataObjectArray': [],
						'paddingControlObjectArray': [],
						'sortingModelUpdate': 1
				},
				initialize: function () {
				},
				//	获取排序BarcodeTreeModel的对象
				get_sort_data_obj_array: function () {
						var self = this
						return JSON.parse(JSON.stringify(self.get('sortingDataObjectArray')))
				},
				//	控制barcodeTree的padding部分的icon object
				add_padding_control_obj: function (paddingControlObj) {
						var self = this
						var paddingControlObjectArray = self.get('paddingControlObjectArray')
						paddingControlObjectArray.push(JSON.parse(JSON.stringify(paddingControlObj)))
						//	更新barcodeTree的视图的update变量
						self.update_sorting_view()
				},
				//	清空barcodeTree的padding部分的icon object对应的数组
				clear_padding_control_obj_array: function () {
						var self = this
						self.set('paddingControlObjectArray', [])
				},
				//	在dataModel的sortingDataObjectArray中增加排序的对象
				add_sorting_data: function (sortingDataObj) {
						var self = this
						var sortingDataObjectArray = self.get('sortingDataObjectArray')
						sortingDataObjectArray.push(JSON.parse(JSON.stringify(sortingDataObj)))
						//	更新barcodeTree的视图的update变量
						self.update_sorting_view()
				},
				//	在dataModel的sortingDataObectArray中删除排序的对象
				remove_sorting_data: function (dataNodeIdArray) {
						var self = this
						var sortingDataObjectArray = self.get('sortingDataObjectArray')
						for (var sI = 0; sI < sortingDataObjectArray.length; sI++) {
								var sortingDataObject = sortingDataObjectArray[sI]
								var comparedNodeId = sortingDataObject.comparedNodeId
								if (dataNodeIdArray.indexOf(comparedNodeId) !== -1) {
										sortingDataObjectArray.splice(sI, 1)
										//	删除icon的object对象之后更新sorting视图
										self.update_sorting_view()
								}
						}
				},
				//	清空所有的排序对象
				clear_sorting_data: function () {
						var self = this
						console.log('***************clear_sorting_data*******************')
						var sortingDataObjectArray = self.get('sortingDataObjectArray')
						if (sortingDataObjectArray.length > 0) {
								//	将sortingDataObjectArray设置为空
								self.set('sortingDataObjectArray', [])
								//	更新barcodeTree的视图的update变量
								self.update_sorting_view()
						}
				},
				//	更新sortingModelUpdate变量, 从而更新sorting视图
				update_sorting_view: function () {
						var self = this
						var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
						self.set('sortingModelUpdate', (self.get('sortingModelUpdate') + 1) % 2)
				},
				//	获取sortingDataObjectArray中的某个排序对象
				get_sort_data_obj: function (selected_comparedNodeId) {
						var self = this
						var sortingDataObjectArray = self.get('sortingDataObjectArray')
						for (var sI = 0; sI < sortingDataObjectArray.length; sI++) {
								if (sortingDataObjectArray[sI].comparedNodeId === selected_comparedNodeId) {
										return sortingDataObjectArray[sI]
								}
						}
				}
		})
})
