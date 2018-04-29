var hierarchicalDataProcessor = require('../processor/barcodetree_processor')
var dataCenter = require('../dataCenter/dataCenter')
var clone = require('clone')

var handlerAndOperation = function (request, response) {
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
  var groupId = reqBody['groupId']
  //  将barcodeWidth的数组内部的元素转换为数字
  for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
    barcodeWidthArray[bI] = +barcodeWidthArray[bI]
  }
  var selectedLevelStr = ''
  //  将selectedLevels的数组内部的元素转换为数字
  if (typeof(selectedLevels) === 'undefined') {
    selectedLevels = []
  }
  for (var sI = 0; sI < selectedLevels.length; sI++) {
    selectedLevels[sI] = +selectedLevels[sI]
    selectedLevelStr = selectedLevelStr + selectedLevels[sI]
  }
  //  选择一个barcodeTree的情况下, 将其变成数组, 方便后续的处理
  if (dataItemType === 'string') {
    dataItemNameArray = [dataItemNameArray]
  }
  var initDepth = 0
  var andTreeObject = get_and_tree_obj(dataItemNameArray, dataSetName, groupId)
  var andTreeNodeArray = hierarchicalDataProcessor.treeLinearization(andTreeObject[groupId], initDepth)
  var andTreeNodeArrayObj = {}
  andTreeNodeArrayObj[groupId] = andTreeNodeArray
  var andTreeNodeLocArray = read_tree_node_array_obj(andTreeNodeArrayObj, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval)
  sendTreeNodeArray(andTreeObject, andTreeNodeLocArray)
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
}

var handlerOrOperation = function (request, response) {
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
  var groupId = reqBody['groupId']
  //  将barcodeWidth的数组内部的元素转换为数字
  for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
    barcodeWidthArray[bI] = +barcodeWidthArray[bI]
  }
  var selectedLevelStr = ''
  //  将selectedLevels的数组内部的元素转换为数字
  if (typeof(selectedLevels) === 'undefined') {
    selectedLevels = []
  }
  for (var sI = 0; sI < selectedLevels.length; sI++) {
    selectedLevels[sI] = +selectedLevels[sI]
    selectedLevelStr = selectedLevelStr + selectedLevels[sI]
  }
  //  选择一个barcodeTree的情况下, 将其变成数组, 方便后续的处理
  if (dataItemType === 'string') {
    dataItemNameArray = [dataItemNameArray]
  }
  var initDepth = 0
  var orTreeObject = get_or_tree_obj(dataItemNameArray, dataSetName, groupId)
  var orTreeNodeArray = hierarchicalDataProcessor.treeLinearization(orTreeObject[groupId], initDepth)
  var orTreeNodeArrayObj = {}
  orTreeNodeArrayObj[groupId] = orTreeNodeArray
  var orTreeLocNodeArray = read_tree_node_array_obj(orTreeNodeArrayObj, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval)
  sendTreeNodeArray(orTreeObject, orTreeLocNodeArray)
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
}

var handlerComplementOperation = function (request, response) {
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
  var groupId = reqBody['groupId']
  //  将barcodeWidth的数组内部的元素转换为数字
  for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
    barcodeWidthArray[bI] = +barcodeWidthArray[bI]
  }
  var selectedLevelStr = ''
  //  将selectedLevels的数组内部的元素转换为数字
  if (typeof(selectedLevels) === 'undefined') {
    selectedLevels = []
  }
  for (var sI = 0; sI < selectedLevels.length; sI++) {
    selectedLevels[sI] = +selectedLevels[sI]
    selectedLevelStr = selectedLevelStr + selectedLevels[sI]
  }
  //  选择一个barcodeTree的情况下, 将其变成数组, 方便后续的处理
  if (dataItemType === 'string') {
    dataItemNameArray = [dataItemNameArray]
  }
  var initDepth = 0
  var complementTreeObject = get_complement_tree_obj(dataItemNameArray, dataSetName, groupId)
  var complementTreeNodeArray = hierarchicalDataProcessor.treeLinearization(complementTreeObject[groupId], initDepth)
  var complementTreeNodeArrayObj = {}
  complementTreeNodeArrayObj[groupId] = complementTreeNodeArray
  var complementTreeNodeLocArray = read_tree_node_array_obj(complementTreeNodeArrayObj, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval)
  sendTreeNodeArray(complementTreeObject, complementTreeNodeLocArray)
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
}

/**
 * 1. 从文件中读取tree object对象
 * 2. 将treeObject对象进行线性化转换成treeNodeArray数组
 * 3. 对于数组中的treeObject计算并集
 */
function read_tree_node_array_obj(originalTreeNodeArrayObj, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval) {
  var treeNodeArrayObj = {}
  for (var item in originalTreeNodeArrayObj) {
    var originalTreeObj = clone(originalTreeNodeArrayObj[item])
    var treeNodeArray = hierarchicalDataProcessor.computeOriginalNodeLocation(originalTreeObj, barcodeWidthArray, selectedLevels, barcodeHeight, barcodeNodeInterval)
    treeNodeArrayObj[item] = treeNodeArray
  }
  return treeNodeArrayObj
}
/**
 * 计算补集树
 */
function get_complement_tree_obj(dataItemNameArray, dataSetName, groupId) {
  var dataItemType = typeof(dataItemNameArray)
  if (dataItemType === 'string') {
    dataItemNameArray = [dataItemNameArray]
  }
  var filePath = '../data/' + dataSetName + '/originalData/'
  var originalTreeObjObject = {}
  if (dataItemNameArray.length > 0) {
    var superTreeObj = dataCenter.get_single_original_data(dataSetName, dataItemNameArray[0])
    // var superTreeObj = clone(require(filePath + dataItemNameArray[0] + '.json'))
    for (var fI = 1; fI < dataItemNameArray.length; fI++) {
      var dataItemName = dataItemNameArray[fI]
      var fileName = dataItemName + '.json'
      // var cloneOriginalTreeObj = clone(require(filePath + fileName))
      var cloneOriginalTreeObj = dataCenter.get_single_original_data(dataSetName, dataItemName)
      superTreeObj = hierarchicalDataProcessor.complementTwoTreeObj(superTreeObj, cloneOriginalTreeObj)
    }
  } else {
    superTreeObj = {}
  }
  originalTreeObjObject[groupId] = superTreeObj
  return originalTreeObjObject
}
/**
 *  计算并集树
 */
function get_or_tree_obj(dataItemNameArray, dataSetName, groupId) {
  var dataItemType = typeof(dataItemNameArray)
  if (dataItemType === 'string') {
    dataItemNameArray = [dataItemNameArray]
  }
  var superTreeObj = null
  var originalTreeObjObject = {}
  var filePath = '../data/' + dataSetName + '/originalData/'
  for (var fI = 0; fI < dataItemNameArray.length; fI++) {
    var dataItemName = dataItemNameArray[fI]
    var fileName = dataItemName + '.json'
    // var originalTreeObj = clone(require(filePath + fileName))
    var cloneOriginalTreeObj = dataCenter.get_single_original_data(dataSetName, dataItemName)
    // var cloneOriginalTreeObj = JSON.parse(JSON.stringify(originalTreeObj))
    superTreeObj = hierarchicalDataProcessor.mergeTwoTreeObj(superTreeObj, cloneOriginalTreeObj)
  }
  originalTreeObjObject[groupId] = superTreeObj
  return originalTreeObjObject
}
/**
 *  计算交集树
 */
function get_and_tree_obj(dataItemNameArray, dataSetName, groupId) {
  var dataItemType = typeof(dataItemNameArray)
  if (dataItemType === 'string') {
    dataItemNameArray = [dataItemNameArray]
  }
  //  初始化superTreeObject
  var filePath = '../data/' + dataSetName + '/originalData/'
  var originalTreeObjObject = {}
  if (dataItemNameArray.length > 0) {
    // var superTreeObj = clone(require(filePath + dataItemNameArray[0] + '.json'))
    var superTreeObj = dataCenter.get_single_original_data(dataSetName, dataItemNameArray[0])
    for (var fI = 1; fI < dataItemNameArray.length; fI++) {
      var dataItemName = dataItemNameArray[fI]
      var fileName = dataItemName + '.json'
      // var cloneOriginalTreeObj = clone(require(filePath + fileName))
      var cloneOriginalTreeObj = dataCenter.get_single_original_data(dataSetName, dataItemName)
      superTreeObj = hierarchicalDataProcessor.interactTwoTreeObj(superTreeObj, cloneOriginalTreeObj)
    }
  } else {
    superTreeObj = {}
  }
  originalTreeObjObject[groupId] = superTreeObj
  return originalTreeObjObject
}

/**
 *  从文件中读取原始的tree object对象
 */
function read_original_tree_object(fileNameArray, dataSetName) {
  var originalTreeObjObject = {}
  var fileName = null
  var filePath = '../data/' + dataSetName + '/originalData/'
  if (typeof (fileNameArray) !== 'undefined') {
    for (var fI = 0; fI < fileNameArray.length; fI++) {
      var dataItemName = fileNameArray[fI]
      fileName = dataItemName + '.json'
      var originalTreeObj = clone(require(filePath + fileName))
      originalTreeObjObject[dataItemName] = originalTreeObj
    }
  }
  return originalTreeObjObject
}

exports.handlerComplementOperation = handlerComplementOperation
exports.handlerOrOperation = handlerOrOperation
exports.handlerAndOperation = handlerAndOperation




