var dataCenter = require('../dataCenter/dataCenter')
var hierarchicalDataProcessor = require('../processor/barcodetree_processor')
var clone = require('clone')
var fs = require('fs')
var process = require('process')

var removeUpdateCurrentSuperTree = function (request, response) {
  //  读取传递的的数据
  var reqBody = request.body
  var dataItemNameArray = reqBody['removedDataItemNameArray']
  var allSelectedDataItemNameArray = reqBody['allSelectedDataItemNameArray']
  var dataSetName = reqBody.dataSetName
  var globalSuperTreeObj = dataCenter.get_super_tree_obj()
  globalSuperTreeObj.itemNameArray = allSelectedDataItemNameArray
  var unionTreeArray = []
  if (typeof (allSelectedDataItemNameArray) !== 'undefined') {
    for (var dI = 0; dI < allSelectedDataItemNameArray.length; dI++) {
      var dataItem = allSelectedDataItemNameArray[dI]
      var originalData = dataCenter.get_single_original_data(dataSetName, dataItem)
      unionTreeArray.push(originalData)
    }
  }
  var unionTree = hierarchicalDataProcessor.buildUnionTree(unionTreeArray)
  dataCenter.update_super_tree_obj_item_array(dataItemNameArray)
  dataCenter.update_super_tree_obj_super_tree(unionTree)
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.send(JSON.stringify({}, null, 3))
}

exports.removeUpdateCurrentSuperTree = removeUpdateCurrentSuperTree
