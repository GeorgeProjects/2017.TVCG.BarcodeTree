var hierarchicalDataProcessor = require('../processor/signaltree_processor')
var dataCenter = require('../dataCenter/dataCenter')
var clone = require('clone')
var ITERATION_NUM = 200
var updateBarcodeTreeSequence = function (request, response) {
  var reqBody = request.body
  var alignedObjPercentageArrayObjArray = reqBody.alignedObjPercentageArrayObjArray
  var dataItemNameArray = reqBody.dataItemNameArray
  var rowSequenceSame = false, columnSequenceSame = false
  var interateNum = 0
  while ((!rowSequenceSame) || (!columnSequenceSame)) {
    var previousRowSequence = get_row_sequence(alignedObjPercentageArrayObjArray)
    var previousColumnSequence = get_column_sequence(alignedObjPercentageArrayObjArray)
    //  更新barcodeTree的每个节点的sum_value并且更新barcodeTree的行序
    update_sum_value(alignedObjPercentageArrayObjArray)
    alignedObjPercentageArrayObjArray = alignedObjPercentageArrayObjArray.sort(function (a, b) {
      return a.sum_value < b.sum_value
    })
    //  更新了行序之后对于列序进行更新
    var alignedNodeObjRecordingValue = update_subtree_aligned_obj_value(alignedObjPercentageArrayObjArray)
    var reorderingSequenceObj = new Object()
    for (var alignedItem in alignedNodeObjRecordingValue) {
      var alignedValueObj = alignedNodeObjRecordingValue[alignedItem]
      var alignedValueArray = transform_node_obj_node_array(alignedValueObj)
      alignedValueArray = alignedValueArray.sort(function (a1, a2) {
        return a1.value < a2.value
      })
      alignedNodeObjRecordingValue[alignedItem] = alignedValueArray
      var reorderingSequence = []
      for (var aI = 0; aI < alignedValueArray.length; aI++) {
        reorderingSequence.push(alignedValueArray[aI].id)
      }
      reorderingSequenceObj[alignedItem] = reorderingSequence
    }
    //  得到了reordering sequence之后, 对于alignedObjPercentageArrayObjArray中的元素进行重排序
    subtree_reordering(reorderingSequenceObj, alignedObjPercentageArrayObjArray)
    var currentRowSequence = get_row_sequence(alignedObjPercentageArrayObjArray)
    var currentColumnSequence = get_column_sequence(alignedObjPercentageArrayObjArray)
    //  判断sequence的顺序是否改变
    rowSequenceSame = is_sequence_same(previousRowSequence, currentRowSequence)
    columnSequenceSame = is_sequence_obj_same(previousColumnSequence, currentColumnSequence)
    interateNum = interateNum + 1

    if (interateNum > ITERATION_NUM) {
      break
    }
  }
  var currentColumnSequence = get_column_sequence(alignedObjPercentageArrayObjArray)
  var currentRowSequence = get_row_sequence(alignedObjPercentageArrayObjArray)
  //  在dataCenter中设置currentColumnSequence
  dataCenter.set_column_sorting_sequence(currentColumnSequence)
  dataCenter.set_row_sorting_sequence(currentRowSequence)
  sendTreeNodeArray(alignedObjPercentageArrayObjArray, alignedNodeObjRecordingValue)
  //  向客户端传递barcode的节点位置, 大小等信息
  function sendTreeNodeArray(alignedObjPercentageArrayObjArray, alignedNodeObjRecordingValue) {
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    var treeNodeObject = {
      'alignedObjPercentageArrayObjArray': alignedObjPercentageArrayObjArray,
      'alignedNodeObjRecordingValue': alignedNodeObjRecordingValue
    }
    response.send(JSON.stringify(treeNodeObject, null, 3))
  }

  //  获取行的sequence
  function get_row_sequence(alignedObjPercentageArrayObjArray) {
    var rowSequence = []
    for (var aI = 0; aI < alignedObjPercentageArrayObjArray.length; aI++) {
      var alignedObjPercentageArrayObj = alignedObjPercentageArrayObjArray[aI]
      var barcodeTreeId = alignedObjPercentageArrayObj.barcodeTreeId
      rowSequence.push(barcodeTreeId)
    }
    return rowSequence
  }

  //  判断row sequence是否相同
  function is_sequence_same(sequence1, sequence2) {
    if ((typeof (sequence1) === 'undefined') || (typeof (sequence2) === 'undefined')) {
      return false
    } else if (sequence1.length !== sequence2.length) {
      return false
    } else {
      var sequenceSame = true
      for (var sI = 0; sI < sequence1.length; sI++) {
        if (sequence1[sI] !== sequence2[sI]) {
          sequenceSame = false
          break
        }
      }
      return sequenceSame
    }
  }

  //  判断column sequence是否相同
  function is_sequence_obj_same(sequence_obj1, sequence_obj2) {
    for (var item in sequence_obj1) {
      if (typeof (sequence_obj2[item]) === 'undefined') {
        return false
      }
    }
    for (var item in sequence_obj2) {
      if (typeof (sequence_obj1[item]) === 'undefined') {
        return false
      }
    }
    for (var item in sequence_obj1) {
      var sequence1 = sequence_obj1[item]
      var sequence2 = sequence_obj2[item]
      if (!is_sequence_same(sequence1, sequence2)) {
        return false
      }
    }
    return true
  }

  //  获取列的sequence
  function get_column_sequence(alignedObjPercentageArrayObjArray) {
    var columnSequenceObj = {}
    var firstAlignedObjPercentageArrayObj = alignedObjPercentageArrayObjArray[0]
    var alignedObjPercentageArray = firstAlignedObjPercentageArrayObj.alignedObjPercentageArray
    for (var aI = 0; aI < alignedObjPercentageArray.length; aI++) {
      var alignedNodeId = alignedObjPercentageArray[aI].alignedNodeId
      columnSequenceObj[alignedNodeId] = []
      var nextPercentageArray = alignedObjPercentageArray[aI].nextPercentageArray
      for (var nI = 0; nI < nextPercentageArray.length; nI++) {
        var barcodeNodeId = nextPercentageArray[nI].barcodeNode_id
        columnSequenceObj[alignedNodeId].push(barcodeNodeId)
      }
    }
    return columnSequenceObj
  }

  //  将数值的对象转换为数值的数组
  function transform_node_obj_node_array(alignedValueObj) {
    var alignedValueArray = []
    for (var aItem in  alignedValueObj) {
      alignedValueArray.push({
        id: aItem,
        value: alignedValueObj[aItem]
      })
    }
    return alignedValueArray
  }
}

function update_sum_value(alignedObjPercentageArrayObjArray) {
  //  alignedObjPercentageArrayObjArray中的每一个元素是一行的barcodeTree中的各个对齐部分的percentage的数值
  for (var aI = 0; aI < alignedObjPercentageArrayObjArray.length; aI++) {
    //  这里的aI代表的是一行的barcodeTree
    var alignedObjPercentageArrayObj = alignedObjPercentageArrayObjArray[aI]
    var alignedObjPercentageArray = alignedObjPercentageArrayObj.alignedObjPercentageArray
    var sumValue = 0
    //  这里的pI代表的是有几个aligned的部分
    for (var pI = 0; pI < alignedObjPercentageArray.length; pI++) {
      var nextPercentageArray = alignedObjPercentageArray[pI].nextPercentageArray
      //  这里的nI代表的是aligned部分的节点, 对于每个节点的计算值依次累加
      var reorderingColNum = nextPercentageArray.length
      for (var nI = 0; nI < nextPercentageArray.length; nI++) {
        var existedPercentage = nextPercentageArray[nI].existed_percentage
        if (typeof (existedPercentage) === 'undefined') {
          nextPercentageArray[nI].existed_percentage = 0
        }
        sumValue = sumValue + existedPercentage * Math.pow(2, reorderingColNum - nI)
      }
    }
    alignedObjPercentageArrayObj.sum_value = sumValue
  }
}
//  移动子树的位置
function subtree_reordering(reorderingSequenceObj, alignedObjPercentageArrayObjArray) {
  for (var aI = 0; aI < alignedObjPercentageArrayObjArray.length; aI++) {
    //  这里的aI代表的是一行的barcodeTree
    var alignedObjPercentageArrayObj = alignedObjPercentageArrayObjArray[aI]
    var alignedObjPercentageArray = alignedObjPercentageArrayObj.alignedObjPercentageArray
    for (var pI = 0; pI < alignedObjPercentageArray.length; pI++) {
      var alignedNodeId = alignedObjPercentageArray[pI].alignedNodeId
      var reorderingSequence = reorderingSequenceObj[alignedNodeId]
      var nextPercentageArray = alignedObjPercentageArray[pI].nextPercentageArray
      alignedObjPercentageArray[pI].nextPercentageArray = nextPercentageArray.sort(function (a, b) {
        var aId = a.barcodeNode_id
        var bId = b.barcodeNode_id
        var aIndex = reorderingSequence.indexOf(aId)
        var bIndex = reorderingSequence.indexOf(bId)
        return aIndex > bIndex
      })
    }
  }
}
//  更新对齐的子树部分的数值
function update_subtree_aligned_obj_value(alignedObjPercentageArrayObjArray) {
  var alignedNodeObjRecordingValue = {}
  var reorderingRowNum = alignedObjPercentageArrayObjArray.length
  //  alignedObjPercentageArrayObjArray中的每一个元素是一行的barcodeTree中的各个对齐部分的percentage的数值
  for (var aI = 0; aI < alignedObjPercentageArrayObjArray.length; aI++) {
    //  这里的aI代表的是一行的barcodeTree
    var alignedObjPercentageArrayObj = alignedObjPercentageArrayObjArray[aI]
    var alignedObjPercentageArray = alignedObjPercentageArrayObj.alignedObjPercentageArray
    var sumValue = 0
    //  这里的pI代表的是有几个aligned的部分
    for (var pI = 0; pI < alignedObjPercentageArray.length; pI++) {
      var alignedNodeId = alignedObjPercentageArray[pI].alignedNodeId
      var nextPercentageArray = alignedObjPercentageArray[pI].nextPercentageArray
      //  如果该对齐的子树的根节点在统计的alignedNodeObj对象中没有出现过, 那么就新建一个对象
      if (typeof (alignedNodeObjRecordingValue[alignedNodeId]) === 'undefined') {
        alignedNodeObjRecordingValue[alignedNodeId] = {}
      }
      //  这里的nI代表的是aligned部分的节点, 对于每个节点的计算值依次累加
      var reorderingColNum = nextPercentageArray.length
      for (var nI = 0; nI < nextPercentageArray.length; nI++) {
        var reorderingNodesId = nextPercentageArray[nI].barcodeNode_id
        if (typeof (alignedNodeObjRecordingValue[alignedNodeId][reorderingNodesId]) === 'undefined') {
          alignedNodeObjRecordingValue[alignedNodeId][reorderingNodesId] = 0
        }
        var existedPercentage = nextPercentageArray[nI].existed_percentage
        if (typeof (existedPercentage) === 'undefined') {
          nextPercentageArray[nI].existed_percentage = 0
        }
        alignedNodeObjRecordingValue[alignedNodeId][reorderingNodesId] = alignedNodeObjRecordingValue[alignedNodeId][reorderingNodesId] + existedPercentage * Math.pow(2, reorderingRowNum - aI)
        sumValue = sumValue + existedPercentage * Math.pow(2, reorderingColNum - nI)
      }
    }
    alignedObjPercentageArrayObj.sum_value = sumValue
  }
  return alignedNodeObjRecordingValue
}
exports.updateBarcodeTreeSequence = updateBarcodeTreeSequence
