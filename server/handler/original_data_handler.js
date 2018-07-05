var hierarchicalDataProcessor = require('../processor/barcodetree_processor')
var dataCenter = require('../dataCenter/dataCenter')
var clone = require('clone')

var handleCompactData = function (request, response) {
  //  读取传递的的数据
  var reqBody = request.body
  var dataSetName = reqBody.dataSetName
  var dataItemNameArray = reqBody['dataItemNameArray']
  var dataItemType = typeof(dataItemNameArray)
  var selectedLevels = reqBody['selectedLevels']
  var barcodeWidthArray = reqBody['barcodeWidthArray']
  var barcodeHeight = reqBody['barcodeHeight']
  var compactNum = reqBody['compactNum']
  var maxDepth = reqBody['maxDepth']
  var barcodeNodeInterval = +reqBody['barcodeNodeInterval']
  //  将barcodeWidth的数组内部的元素转换为数字
  for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
    barcodeWidthArray[bI] = +barcodeWidthArray[bI]
  }
  //  将selectedLevels的数组内部的元素转换为数字
  if (typeof(selectedLevels) === 'undefined') {
    selectedLevels = []
  }
  for (var sI = 0; sI < selectedLevels.length; sI++) {
    selectedLevels[sI] = +selectedLevels[sI]
  }
  //  选择一个barcodeTree的情况下, 将其变成数组, 方便后续的处理
  if (dataItemType === 'string') {
    dataItemNameArray = [dataItemNameArray]
  }
  var compactLinearTreeNodeArrayObject = dataCenter.get_compact_linear_data(dataSetName, dataItemNameArray, selectedLevels)
  var compactLinearTreeNodeLocArrayObject = compute_compact_node_location(compactLinearTreeNodeArrayObject, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval, compactNum)
  //  将计算得到的compact类型的BarcodeTree的相关信息发送给客户端
  sendTreeNodeArray(compactLinearTreeNodeLocArrayObject)
  //  向客户端传递barcode的节点位置, 大小等信息
  function sendTreeNodeArray(compactLinearTreeNodeLocArrayObject) {
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    var treeNodeObject = {
      'compactLineatTreeNodeLocArrayObject': compactLinearTreeNodeLocArrayObject
    }
    response.send(JSON.stringify(treeNodeObject, null, 3))
  }
}

var handleOriginalData = function (request, response) {
  //  读取传递的的数据
  var reqBody = request.body
  var dataSetName = reqBody.dataSetName
  var dataItemNameArray = reqBody['dataItemNameArray']
  var allSelectedDataItemNameArray = reqBody['allSelectedDataItemNameArray']
  var dataItemType = typeof(dataItemNameArray)
  var allSelectedItemType = typeof(allSelectedDataItemNameArray)
  var selectedLevels = reqBody['selectedLevels']
  var barcodeWidthArray = reqBody['barcodeWidthArray']
  var barcodeHeight = reqBody['barcodeHeight']
  var compactNum = reqBody['compactNum']
  var maxDepth = reqBody['maxDepth']
  var barcodeNodeInterval = +reqBody['barcodeNodeInterval']
  //  将barcodeWidth的数组内部的元素转换为数字
  for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
    barcodeWidthArray[bI] = +barcodeWidthArray[bI]
  }
  //  将selectedLevels的数组内部的元素转换为数字
  if (typeof(selectedLevels) === 'undefined') {
    selectedLevels = []
  }
  for (var sI = 0; sI < selectedLevels.length; sI++) {
    selectedLevels[sI] = +selectedLevels[sI]
  }
  //  选择一个barcodeTree的情况下, 将其变成数组, 方便后续的处理
  if (dataItemType === 'string') {
    dataItemNameArray = [dataItemNameArray]
  }
  if (allSelectedItemType === 'string') {
    allSelectedDataItemNameArray = [allSelectedDataItemNameArray]
  }
  //  删除之后allSelectedDataItemNameArray所包含的元素是需要读取的barcodeItem
  var originalTreeObjObject = dataCenter.get_original_data(dataSetName, dataItemNameArray)
  var linearTreeNodeArrayObject = dataCenter.get_linear_data(dataSetName, dataItemNameArray, selectedLevels)
  var linearizedTreeNodeLocArrayObj = compute_node_location(linearTreeNodeArrayObject, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval)
  //  将线性化的节点对象传递给客户端
  sendTreeNodeArray(originalTreeObjObject, linearizedTreeNodeLocArrayObj)
  //  更新构建的superTree
  buildUpdateSuperTree(originalTreeObjObject, allSelectedDataItemNameArray)
  //  向客户端传递barcode的节点位置, 大小等信息
  function sendTreeNodeArray(originalTreeObjObject, linearizedTreeNodeArrayObj) {
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    var treeNodeObject = {
      'originalTreeObjObject': originalTreeObjObject,
      'treeNodeArrayObject': linearizedTreeNodeArrayObj
    }
    response.send(JSON.stringify(treeNodeObject, null, 3))
  }

  /**
   *  构建superTree, 在已经对齐的情况下, 用户在刷选之后需要将刷选的barcodeTree马上进行对齐
   *  所以需要提升构建superTree的效率
   */
  function buildUpdateSuperTree(originalTreeObjObject, allSelectedDataItemNameArray) {
    var globalSuperTreeObj = dataCenter.get_super_tree_obj()
    var unionTreeArray = []
    if ((typeof (globalSuperTreeObj.superTreeObj) !== 'undefined') && (globalSuperTreeObj.superTreeObj != null)) {
      var superTreeObj = globalSuperTreeObj.superTreeObj
      unionTreeArray.push(superTreeObj)
    }
    for (var item in originalTreeObjObject) {
      var originalTreeObj = originalTreeObjObject[item]
      unionTreeArray.push(originalTreeObj)
    }
    var unionTree = hierarchicalDataProcessor.buildUnionTree(unionTreeArray)
    //  构建unionTree时在节点上增加node Num的属性
    if (unionTree != null) {
      hierarchicalDataProcessor.add_node_num(unionTree)
      dataCenter.update_super_tree_obj_item_array(allSelectedDataItemNameArray)
      dataCenter.update_super_tree_obj_super_tree(unionTree)
    }
  }
}
/**
 *  计算compact的BarcodeTree的节点位置
 */

function compute_compact_node_location(compactLinearTreeNodeArrayObject, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval, compactNum) {
  var multiCompactTreeNodeArrayObj = {}
  for (var treeId in compactLinearTreeNodeArrayObject) {
    var compactLinearTreeNodeArrayObj = clone(compactLinearTreeNodeArrayObject[treeId])
    var singleCompactTreeNodeLocArrayObj = {}
    for (var compactItem in compactLinearTreeNodeArrayObj) {
      var compactLinearTreeNodeArray = compactLinearTreeNodeArrayObj[compactItem]
      var treeNodeArray = hierarchicalDataProcessor.compute_compact_node_location(compactLinearTreeNodeArray, barcodeHeight, barcodeWidthArray, compactNum, selectedLevels, barcodeNodeInterval)
      singleCompactTreeNodeLocArrayObj[compactItem] = treeNodeArray
    }
    multiCompactTreeNodeArrayObj[treeId] = singleCompactTreeNodeLocArrayObj
  }
  return multiCompactTreeNodeArrayObj
}
/**
 * 1. 从文件中读取tree object对象
 * 2. 将treeObject对象进行线性化转换成treeNodeArray数组
 */
function compute_node_location(linearTreeNodeArrayObject, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval) {
  var treeNodeArrayObj = {}
  for (var item in linearTreeNodeArrayObject) {
    var linearTreeNodeArray = clone(linearTreeNodeArrayObject[item])
    var treeNodeArray = hierarchicalDataProcessor.computeOriginalNodeLocation(linearTreeNodeArray, barcodeWidthArray, selectedLevels, barcodeHeight, barcodeNodeInterval)
    treeNodeArrayObj[item] = treeNodeArray
  }
  return treeNodeArrayObj
}

exports.handleOriginalData = handleOriginalData
exports.handleCompactData = handleCompactData

