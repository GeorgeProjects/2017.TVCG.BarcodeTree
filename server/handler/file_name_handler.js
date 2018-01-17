var dataCenter = require('../dataCenter/dataCenter')
var clone = require('clone')
var fs = require('fs')
var process = require('process')
var hierarchicalDataProcessor = require('../processor/signaltree_processor')


var fileNameHandler = function (request, response) {
  var dataSetName = request.body.DataSetName
  var directoryName = './server/data/' + dataSetName + '/originalData/'//'../data/' + sampleDataName + '/originalData/'
  var readFileDirectory = '../data/' + dataSetName + '/originalData/'
  read_directory_file(dataSetName, directoryName, readFileDirectory, function (dataSetObj, linearObj, fileInfoObj) {
    dataCenter.add_original_data_set(dataSetName, dataSetObj)
    dataCenter.add_linear_data_set(dataSetName, linearObj)
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.send(JSON.stringify(fileInfoObj, null, 3))
  }, function (err) {
    throw err;
  })
}

function read_directory_file(dataSetName, dirname, readFileDirectory, fileReadEnd, onError) {
  fs.readdir(dirname, function (err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    var dataSetObj = {}
    var linearObj = {}
    var fileInfoObj = {}
    var fileInfoArray = []
    var initDepth = 0
    var maxDepthObj = {maxDepth: 0}
    filenames.forEach(function (filename) {
      var fileObject = clone(require(readFileDirectory + filename))
      var fileNameRemovedJson = filename.replace('.json', '')
      dataSetObj[fileNameRemovedJson] = fileObject
      //  在tree的每个节点上增加深度并且获取整个数据集的最大的树的深度
      _add_depth_find_max_depth(initDepth, fileObject, maxDepthObj)
      //  在tree中的每个节点上增加节点数量的属性值
      hierarchicalDataProcessor.addNodeNum(fileObject)
      //  对于树对象中的孩子节点进行排序
      sort_children(fileObject)
      //  将树的对象进行线性化得到线性化的节点数组
      var treeNodeArray = hierarchicalDataProcessor.treeLinearization(fileObject, initDepth)
      linearObj[fileNameRemovedJson] = treeNodeArray
      var fileObjNum = fileObject["num"]
      var fileObjNodeNum = fileObject["nodeNum"]
      //  仅仅对于dailyRecordTree的筛选条件
      if ((fileObjNum > 1800) && (dataSetName === 'DailyRecordTree')) {
        fileObjNum = 0
      }
      fileInfoArray.push({
        "num": fileObjNum,//fileObjNodeNum
        "nodenum": fileObjNodeNum,
        "name": fileNameRemovedJson
      })
    });
    fileInfoObj.fileInfo = fileInfoArray
    fileInfoObj.maxDepth = maxDepthObj.maxDepth
    fileReadEnd(dataSetObj, linearObj, fileInfoObj)
  });
}
/**
 *  向读取的树的对象中增加depth属性, 同时计算所有的tree对象中的最大的深度
 */
function _add_depth_find_max_depth(initDepth, fileObject, maxDepthObj) {
  fileObject.depth = initDepth
  if (typeof (fileObject.children) !== 'undefined') {
    for (var fI = 0; fI < fileObject.children.length; fI++) {
      _add_depth_find_max_depth(initDepth + 1, fileObject.children[fI], maxDepthObj)
    }
  } else {
    if (maxDepthObj.maxDepth < initDepth) {
      maxDepthObj.maxDepth = initDepth
    }
  }
}
/**
 * 对于对象形式的树的孩子节点label大小进行排序
 * @param tree: 对象形式的树
 */
function sort_children(tree) {
  innerSortChildren(tree)
  function innerSortChildren(tree) {
    if (tree != null) {
      if (typeof (tree.children) !== 'undefined') {
        tree.children.sort(function (a, b) {
          var aName = a.name
          var bName = b.name
          return aName - bName
        })
        for (var i = 0; i < tree.children.length; i++) {
          innerSortChildren(tree.children[i])
        }
      }
    }
  }
}

exports.fileNameHandler = fileNameHandler
