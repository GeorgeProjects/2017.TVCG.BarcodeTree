var hierarchicalDataProcessor = require('../processor/barcodetree_processor')
var clone = require('clone')
var dataCenter = require('../dataCenter/dataCenter')

var handlerBuildSuperTree = function (request, response) {
  var reqBody = request.body
  var dataSetName = reqBody.dataSetName
  var dataItemNameArray = reqBody['dataItemNameArray']
  var dataItemType = typeof(dataItemNameArray)
  var selectedLevels = reqBody['selectedLevels']
  var barcodeWidthArray = reqBody['barcodeWidthArray']
  var barcodeHeight = reqBody['barcodeHeight']
  var barcodeTreeSplitWidth = +reqBody['barcodeTreeSplitWidth']
  var barcodeNodeInterval = +reqBody['barcodeNodeInterval']
  var rootId = reqBody.rootId
  var rootLevel = +reqBody.rootLevel
  var maxLevel = +reqBody.maxLevel
  var alignedLevel = reqBody.alignedLevel
  var originalSequenceState = reqBody.originalSequenceState
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
  //  如果只是一个文件, 需要将该文件名称的string类型转换为数组类型
  if (dataItemType === 'string') {
    dataItemNameArray = [dataItemNameArray]
  }
  //  读取subtreeObjectArray
  var subtreeObjArray = []
  if (typeof (dataItemNameArray) !== 'undefined') {
    for (var sI = 0; sI < dataItemNameArray.length; sI++) {
      var subtreeObj = dataCenter.get_subtree_id_index_data(dataSetName, dataItemNameArray[sI], rootId)
      if (typeof(subtreeObj) !== 'undefined') {
        var filteredSubtreeObj = JSON.parse(JSON.stringify(subtreeObj))
        filter_depth(filteredSubtreeObj, maxLevel)
        subtreeObjArray.push(filteredSubtreeObj)
      }
    }
  }
  var maxSubtreeWidth = 0
  for (var sI = 0; sI < subtreeObjArray.length; sI++) {
    hierarchicalDataProcessor.addSubtreeDepth(subtreeObjArray[sI], rootLevel)
    getMaxSubtreeNodes(subtreeObjArray[sI], barcodeWidthArray, barcodeNodeInterval)
    if (typeof(subtreeObjArray[sI]) !== 'undefined') {
      if (subtreeObjArray[sI].subtreeWidth > maxSubtreeWidth) {
        maxSubtreeWidth = subtreeObjArray[sI].subtreeWidth
      }
    }
  }
  if ((maxLevel == alignedLevel) && (rootLevel == 0)) {
    var superTreeObjCenter = dataCenter.get_super_tree_obj()
    var unionTree = superTreeObjCenter.superTreeObj
    var maxNumTree = superTreeObjCenter.superTreeObj
  } else {
    var unionTree = hierarchicalDataProcessor.buildUnionTree(JSON.parse(JSON.stringify(subtreeObjArray)))
    var maxNumTree = hierarchicalDataProcessor.buildMaxTree(JSON.parse(JSON.stringify(subtreeObjArray)), alignedLevel)
    //  向子树中增加节点的nodenum属性
    hierarchicalDataProcessor.add_node_num(unionTree)
    hierarchicalDataProcessor.add_node_num(maxNumTree)
  }
  var initDepth = rootLevel
  var superTreeNodeLocArray = get_node_location_array(unionTree, initDepth, barcodeWidthArray, selectedLevels, barcodeHeight, barcodeNodeInterval, originalSequenceState)
  var maxNodeNumTreeNodeLocArray = get_node_partition_location_array(rootId, maxNumTree, initDepth, barcodeWidthArray, selectedLevels, barcodeHeight, barcodeNodeInterval, originalSequenceState, alignedLevel, barcodeTreeSplitWidth)
  var maxSubtreeWidth = hierarchicalDataProcessor.compute_max_subtree_width(maxNodeNumTreeNodeLocArray, barcodeWidthArray, barcodeNodeInterval)
  superTreeNodeLocArray[0].subtreeWidth = maxSubtreeWidth
  maxNodeNumTreeNodeLocArray[0].subtreeWidth = maxSubtreeWidth
  var superTreeObj = {
    'superTreeNodeLocArray': superTreeNodeLocArray,
    'maxNodeNumTreeNodeLocArray': maxNodeNumTreeNodeLocArray,
    'superTreeObj': unionTree
  }
  sendTreeNodeArray(superTreeObj)
  //  根据层次结构数据的对象计算得到带有位置属性的节点数组
  function get_node_location_array(tree_obj, init_depth, barcode_width_array, selected_levels, barcode_height, barcode_node_interval, originalSequenceState) {
    hierarchicalDataProcessor.sortChildren(tree_obj)
    //  对于树对象进行线性化得到节点序列
    var treeNodeArray = hierarchicalDataProcessor.treeLinearization(tree_obj, init_depth, originalSequenceState)
    //  根据线性化的节点序列得到节点的位置属性
    var superTreeNodeLocArray = hierarchicalDataProcessor.computeOriginalNodeLocation(treeNodeArray, barcode_width_array, selected_levels, barcode_height, barcode_node_interval)
    return superTreeNodeLocArray
  }

  //  根据层次结构数据的对象计算带有位置属性的节点数组, 计算的是切割之后的barcodeTree的节点位置数组
  function get_node_partition_location_array(rootId, tree_obj, init_depth, barcode_width_array, selected_levels, barcode_height, barcode_node_interval, originalSequenceState, alignedLevel, barcodeTreeSplitWidth) {
    hierarchicalDataProcessor.sortChildren(tree_obj)
    //  对于树对象进行线性化得到节点序列
    console.log('get_node_partition_location_array')
    var treeNodeArray = hierarchicalDataProcessor.treeLinearization(tree_obj, init_depth, originalSequenceState)
    var subtreeRange = hierarchicalDataProcessor.getSubtreeRange(rootId, init_depth, treeNodeArray)
    //  根据线性化的节点序列得到节点的位置属性
    var superTreeNodeLocArray = hierarchicalDataProcessor.computePartitionNodeLocation(treeNodeArray, subtreeRange, barcode_width_array, selected_levels, barcode_height, barcode_node_interval, alignedLevel, barcodeTreeSplitWidth)
    return superTreeNodeLocArray
  }

  //  根据当前最深的层级筛选当前的树
  function filter_depth(subtreeObj, maxLevel) {
    if (subtreeObj.depth === maxLevel) {
      if (typeof (subtreeObj.children) !== 'undefined') {
        delete subtreeObj.children
      }
    }
    var subtreeChildren = subtreeObj.children
    if (typeof (subtreeChildren) !== 'undefined') {
      for (var sI = 0; sI < subtreeChildren.length; sI++) {
        var subtree = subtreeChildren[sI]
        filter_depth(subtree, maxLevel)
      }
    }
    return subtree
  }

  //  向客户端传递barcode的节点位置, 大小等信息
  function sendTreeNodeArray(superTreeObj) {
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    var treeNodeObject = {'treeNodeObject': superTreeObj}
    response.send(JSON.stringify(treeNodeObject, null, 3))
  }

  //  传入treeobj对象, 计算其中的节点的子树最大的宽度
  function getMaxSubtreeNodes(treeObj, barcodeWidthArray, barcodeNodeInterval) {
    innerGetMaxSubtreeWidth(treeObj)
    function innerGetMaxSubtreeWidth(treeObj) {
      if ((typeof(treeObj.children) !== 'undefined') && (treeObj.children != null)) {
        for (var cI = 0; cI < treeObj.children.length; cI++) {
          innerGetMaxSubtreeWidth(treeObj.children[cI])
        }
        var subtreeWidth = barcodeWidthArray[treeObj['depth']]
        for (var cI = 0; cI < treeObj.children.length; cI++) {
          if (treeObj.children[cI].subtreeWidth !== 0) {
            subtreeWidth = subtreeWidth + treeObj.children[cI].subtreeWidth + barcodeNodeInterval
          }
        }
        treeObj.subtreeWidth = subtreeWidth
      } else {
        var depth = treeObj['depth']
        var nodeWidth = barcodeWidthArray[depth]
        if (typeof (nodeWidth) === 'undefined') {
          nodeWidth = 0
        }
        treeObj.subtreeWidth = nodeWidth
      }
    }
  }
}
/**
 *  想读取的树的对象中增加节点数量的属性
 */
function _add_node_num(fileObject) {
  if (typeof (fileObject.children) !== 'undefined') {
    var sumNodeNum = 0
    for (var fI = 0; fI < fileObject.children.length; fI++) {
      _add_node_num(fileObject.children[fI])
      sumNodeNum = sumNodeNum + fileObject.children[fI].nodeNum
    }
    fileObject.nodeNum = sumNodeNum
  } else {
    fileObject.nodeNum = 1
  }
  return
}
exports.handlerBuildSuperTree = handlerBuildSuperTree
