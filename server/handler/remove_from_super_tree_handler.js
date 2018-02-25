var dataCenter = require('../dataCenter/dataCenter')
var hierarchicalDataProcessor = require('../processor/signaltree_processor')
var clone = require('clone')
var fs = require('fs')
var process = require('process')

var removeUpdateCurrentSuperTree = function (request, response) {
  //  读取传递的的数据
  var reqBody = request.body
  var dataItemNameArray = reqBody['removedDataItemNameArray']
  var dataSetName = reqBody.dataSetName
  var globalSuperTreeObj = dataCenter.get_super_tree_obj()
  var currentItemNameArray = globalSuperTreeObj.itemNameArray
  //  遍历原始的dataItemNameArray, 在dataItemNameArray去除选中的dataItem数组
  for (var dI = 0; dI < dataItemNameArray.length; dI++) {
    var item = dataItemNameArray[dI]
    if (typeof (currentItemNameArray) !== 'undefined') {
      var itemIndex = currentItemNameArray.indexOf(item)
      if (itemIndex === -1) {
        dataItemNameArray.splice(itemIndex, 1)
      }
    }
  }
  var unionTreeArray = []
  for (var dI = 0; dI < dataItemNameArray.length; dI++) {
    var dataItem = dataItemNameArray[dI]
    var originalData = dataCenter.get_single_original_data(dataSetName, dataItem)
    unionTreeArray.push(originalData)
  }
  var unionTree = hierarchicalDataProcessor.buildUnionTree(unionTreeArray)
  dataCenter.update_super_tree_obj_item_array(dataItemNameArray)
  dataCenter.update_super_tree_obj_super_tree(unionTree)
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.send(JSON.stringify({}, null, 3))
}

exports.removeUpdateCurrentSuperTree = removeUpdateCurrentSuperTree
