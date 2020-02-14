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
		'd3'
], function (require, Mn, _, Config, Backbone, d3) {
		'use strict'

		return Backbone.Model.extend({
				defaults: {
						originalData: {},
						linearData: {}
				},
				initialize: function () {
				},
				//		从本地读取所需的层次结构数据
				pre_read_barcode_tree: function (result) {
						var self = this
						var dataSetName = window.dataSetName
						var originalData = {}
						var linearData = {}
						var deferArray = []
						var initDepth = 0
						var selectedItemsArray = self.get_selected_item_array(result)
						for (var sI = 0; sI < selectedItemsArray.length; sI++) {
								deferArray.push($.Deferred())
						}
						console.log('selectedItemsArray.length', selectedItemsArray.length)
						for (var sI = 0; sI < selectedItemsArray.length; sI++) {
								var fileNameWithoutJson = selectedItemsArray[sI]
								var fileName = selectedItemsArray[sI] + '.json'
								// var filePath = "../../data/" + dataSetName + '/originalData/' + fileName
								var filePath = "./data/" + dataSetName + '/originalData/' + fileName
								var deferObj = deferArray[sI]
								read_data(deferObj, fileNameWithoutJson)
						}
						$.when.apply($, deferArray)
								.done(function () {
										linearize_data()
										self.set('linearData', linearData)
										self.set('originalData', originalData)
										//
								})
						//	读取数据
						function read_data(deferObj, fileNameWithoutJson) {
								d3.json(filePath, function (data) {
										originalData[fileNameWithoutJson] = data
										deferObj.resolve()
								})
						}
						// 线性化层次结构数据
						function linearize_data() {
								for (var item in originalData) {
										var treeNodeArray = self.treeLinearization(originalData[item], initDepth)
										linearData[item] = treeNodeArray
								}
						}
				},
				//	计算得到选择的barcodeTree的数组
				get_selected_item_array: function (result) {
						var selectedItemArray = []
						var fileInfo = result.fileInfo
						for (var fI = 0; fI < fileInfo.length; fI++) {
								selectedItemArray.push(fileInfo[fI].name)
						}
						return selectedItemArray
				},
				//	对于treeObject进行线性化
				treeLinearization: function (treeObj, initDepth, originalSequenceState) {
						var treeNodeArray = []
						//  向barcodeTree的节点中增加index属性, 即node-depth-nodeName
						function addNodeIndex(treeObj, depth) {
								var nodeName = treeObj.name
								depth = +depth
								treeObj.index = 'node-' + depth + '-' + nodeName
								if ((typeof (treeObj.children) !== 'undefined') && (treeObj.children != null)) {
										depth = depth + 1
										for (var cI = 0; cI < treeObj.children.length; cI++) {
												if (treeObj.children[cI] != null) {
														addNodeIndex(treeObj.children[cI], depth)
												}
										}
								}
						}

						//  线性化barcodeTree的节点, 得到treeNodeArray
						function innerLinearizeTreeObj(treeObj, depth, treeNodeArray, originalSequenceState) {
								depth = +depth
								var nodeName = treeObj.name
								var treeNodeId = 'node-' + depth + '-' + nodeName
								treeObj.index = treeNodeId
								treeObj.depth = +depth
								treeNodeArray.push(treeObj)
								if ((typeof (treeObj.children) !== 'undefined') && (treeObj.children != null)) {
										depth = depth + 1
										//  对于该节点的孩子节点进行排序
										if (treeObj.children.length !== 0) {
												treeObj.children = treeObj.children.sort(function (a, b) {
														var aName = a.name
														var bName = b.name
														return a_minus_b(aName, bName)
												})
										}
										for (var cI = 0; cI < treeObj.children.length; cI++) {
												if (treeObj.children[cI] != null) {
														if ((treeObj.children[cI].name === 'root') || is_a_b_c(treeObj.children[cI].name)) {
																innerLinearizeTreeObj(treeObj.children[cI], depth, treeNodeArray, originalSequenceState)
														}
												}
										}
								}
								return
						}

						//判断name是否是a_b_c的形式
						function is_a_b_c(name) {
								if ((name == null) || (typeof (name) === 'undefined')) {
										return false
								}
								var nameArray = name.split('_')
								if (nameArray.length === 3) {
										// if ((nameArray[0] == 5) || (nameArray[0] == 6)) {
										// 		return true
										// } else {
										// 		return false
										// }
										return true
								}
						}

						//  排序中使用到的的函数
						function a_minus_b(aName, bName) {
								var aNameArray = transform_num_array(aName)
								var bNameArray = transform_num_array(bName)
								for (var nI = 0; nI < aNameArray.length; nI++) {
										var aNum = +aNameArray[nI]
										var bNum = +bNameArray[nI]
										if (aNum !== bNum) {
												return aNum - bNum
										}
								}
						}

						//  将name转变成num的数组
						function transform_num_array(name) {
								var nameArray = name.split('_')
								return nameArray
						}

						var depth = initDepth
						if (treeObj != null) {
								addNodeIndex(treeObj, depth)
								innerLinearizeTreeObj(treeObj, depth, treeNodeArray, originalSequenceState)
						}
						return treeNodeArray
				},
				//	根据sequence 计算barcodeTree每个节点位置, 在这个地方对于BarcdoeTree中节点的属性值进行赋值, 包括节点的高度,宽度
				get_barcode_node_location_array: function (selectedItemsArray, barcodeNodeInterval, barcdoeWidthArray, barcodeHeight, selectedLevels) {
						var self = this
						var treeNodeArrayObject = {}
						var linearData = self.get('linearData')
						var originalData = self.get('originalData')
						for (var sI = 0; sI < selectedItemsArray.length; sI++) {
								var selectedItem = selectedItemsArray[sI]
								var selectedLinearData = linearData[selectedItem]
								var originalTreeData = originalData[selectedItem]
								var nodeLocationArray = compute_node_location(selectedLinearData, barcodeNodeInterval, barcdoeWidthArray, barcodeHeight, selectedLevels)
								treeNodeArrayObject[selectedItem] = nodeLocationArray
						}
						return treeNodeArrayObject
						//	具体计算每个节点的位置等属性从而进行绘制
						function compute_node_location(treeNodeArray, barcodeNodeInterval, barcodeWidthArray, barcodeHeight, selectedLevels) {
								var xLoc = 0
								var treeNodeLocArray = []
								for (var i = 0; i < treeNodeArray.length; i++) {
										var treeNodeObj = treeNodeArray[i]
										var depth = +treeNodeObj.depth
										var treeNodeLocObj = {}
										var rectWidth = barcodeWidthArray[depth]
										xLoc = +xLoc.toFixed(2)
										treeNodeLocObj.x = xLoc
										treeNodeLocObj.y = 0
										treeNodeLocObj.category = self.transfrom_name_id(treeNodeObj.name)
										treeNodeLocObj.categoryName = treeNodeObj.categoryName
										treeNodeLocObj.id = treeNodeObj.index
										treeNodeLocObj.depth = depth
										treeNodeLocObj.width = rectWidth
										treeNodeLocObj.height = barcodeHeight
										treeNodeLocObj.num = treeNodeObj.num
										if (selectedLevels.indexOf(depth) !== -1) {
												treeNodeLocObj.width = rectWidth
												if (barcdoeWidthArray[depth] !== 0) {
														xLoc = xLoc + barcdoeWidthArray[depth] + barcodeNodeInterval
												}
										}
										treeNodeLocArray.push(treeNodeLocObj)
								}
								return treeNodeLocArray
						}
				},
				transfrom_name_id: function (name) {
						var id = ""
						if (typeof (name) !== 'undefined') {
								id = name.replace('/', '')
										.replaceAll('&', '')
										.replaceAll(':', '')
										.replaceAll(',', '')
										.replaceAll('.', '')
										.replaceAll('(', '')
										.replaceAll(')', '')
										.replaceAll(';', '')
										.replaceAll('\'', '')
										.replaceAll('?', '')
										.replaceAll('=', '')
										.replaceAll('>', '')
										.replaceAll('[', '')
										.replaceAll(']', '')
										.replaceAll('!', '')
										.replaceAll('"', '')
										.replaceAll('+', '')
										.replaceAll('/', '')
										.replaceAll('@', '')
										.replaceAll('*', '')
										.replaceAll('#', '')
										.replaceAll('$', '')
								var nodeId = id.replaceAll(' ', '-')
								return nodeId
						}
						return id
				}
		})
})
