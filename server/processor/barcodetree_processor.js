var fs = require('fs')
var clone = require('clone')
var logger = require('../logger.js').initialize()
var dataCenter = require('../dataCenter/dataCenter')

var ed = require('edit-distance')
var ABSOLUTE_COMPACT_CHILDREN = 'ABSOLUTE_COMPACT_CHILDREN'
var ABSOLUTE_COMPACT_FATHER = 'ABSOLUTE_COMPACT_FATHER'
var TEMPLATE = 'TEMPLATE'
var PER_GAP_WIDTH = 4

//  replaceAll函数在原始的string类型中是不存在, 需要先定义之后才能在函数transfrom_name_id中使用
String.prototype.replaceAll = function (find, replace) {
  var str = this
  return str.replace(new RegExp(find.replace(/[-\/\\^$*+?!.()><|[\]{}]/g, '\\$&'), 'g'), replace)
}

/**
 * 对于tree线性化返回的是节点数据, 标记barcode中节点的大小, 位置等属性
 */
function treeLinearization(treeObj, initDepth, originalSequenceState) {
  var treeNodeArray = []
  var globalColumnSequenceObj = dataCenter.get_column_sorting_sequence()

  function is_numeric(str) {
    return /^\d+$/.test(str)
  }

  function zFill(str) {
    var pad = "000"
    var ans = str + pad.substring(0, pad.length - str.length)
    return ans
  }

  //  向barcodeTree的节点中增加index属性, 即node-depth-nodeName
  function addNodeIndex(treeObj, depth) {
    var nodeName = treeObj.name
    if (typeof (nodeName) === 'undefined') {
      nodeName = ""
    }
    if (is_numeric(nodeName)) {
      nodeName = zFill(nodeName)
    } else {
      nodeName = transfrom_name_id(nodeName)
    }
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
    var nodeName = treeObj.name
    var nodeId = ""
    var categoryName = treeObj.categoryName
    if (typeof (nodeName) === 'undefined') {
      nodeName = ""
    }
    if (is_numeric(nodeName)) {
      nodeId = zFill(nodeName)
    } else {
      nodeId = transfrom_name_id(nodeName)
    }
    depth = +depth
    treeObj.id = nodeId
    treeObj.name = nodeName
    treeObj.index = 'node-' + depth + '-' + nodeId
    treeObj.depth = +depth
    treeNodeArray.push(treeObj)
    var treeNodeId = 'node-' + depth + '-' + nodeId
    if ((typeof (treeObj.children) !== 'undefined') && (treeObj.children != null)) {
      depth = depth + 1
      //  对于该节点的孩子节点进行排序
      if (((typeof (globalColumnSequenceObj[treeNodeId])) !== 'undefined') && (typeof (originalSequenceState) !== 'undefined') && (originalSequenceState === 'SORTING')) { //
        var columnSequence = globalColumnSequenceObj[treeNodeId]
        treeObj.children = treeObj.children.sort(function (a, b) {
          var aI = columnSequence.indexOf(a.index)
          var bI = columnSequence.indexOf(b.index)
          return aI > bI
        })
      } else {
        treeObj.children = treeObj.children.sort(function (a, b) {
          var aName = a.name
          var bName = b.name
          return a_minus_b(aName, bName)
        })
      }
      for (var cI = 0; cI < treeObj.children.length; cI++) {
        if (treeObj.children[cI] != null) {
          innerLinearizeTreeObj(treeObj.children[cI], depth, treeNodeArray, originalSequenceState)
        }
      }
    }
    return
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
}
/**
 *  对于线性化的节点数组, 数组中的每个节点存在节点中的状态描述
 *  根据数组计算原始状态的barcode的每个节点的位置以及大小
 */
function computeOriginalNodeLocation(treeNodeArray, widthArray, selectedLevels, barcodeHeight, barcodeNodeInterval) {
  var xLoc = 0
  var treeNodeLocArray = []
  for (var i = 0; i < treeNodeArray.length; i++) {
    var treeNodeObj = treeNodeArray[i]
    var depth = treeNodeObj.depth
    var treeNodeLocObj = {}
    var rectWidth = widthArray[depth]
    xLoc = +xLoc.toFixed(2)
    treeNodeLocObj.x = xLoc
    treeNodeLocObj.y = 0
    treeNodeLocObj.category = treeNodeObj.name
    treeNodeLocObj.categoryName = treeNodeObj.categoryName
    treeNodeLocObj.id = treeNodeObj.index
    treeNodeLocObj.depth = depth
    treeNodeLocObj.width = 0
    treeNodeLocObj.height = barcodeHeight
    treeNodeLocObj.maxnum = treeNodeObj.maxnum
    treeNodeLocObj.num = treeNodeObj.num
    if (selectedLevels.indexOf(depth) !== -1) {
      treeNodeLocObj.width = rectWidth
      if (widthArray[depth] !== 0) {
        xLoc = xLoc + widthArray[depth] + barcodeNodeInterval
      }
    }
    treeNodeLocArray.push(treeNodeLocObj)
  }
  return treeNodeLocArray
}
/**
 * 根据传入的subtreeObject的数组, 构建superTree
 */
function buildUnionTree(subtreeObjArray) {
  var superTree = null
  //   完全合并所有的子树
  for (var sI = 0; sI < subtreeObjArray.length; sI++) {
    superTree = mergeTwoTreeObj(superTree, subtreeObjArray[sI])
  }
  return superTree
}
/**
 * 根据传入的subtreeObject的数组, 构建具有最多子树节点的数组, 只是对齐到某一层, 后面的层级不保持对齐的状态
 */
function buildMaxTree(subtreeObjArray, alignedLevel) {
  var maxNodeNumTree = null
  //   合并所有的子树中的最大的子树, 仅仅对齐到某一层级
  for (var sI = 0; sI < subtreeObjArray.length; sI++) {
    maxNodeNumTree = findMaxNodeNumTree(maxNodeNumTree, subtreeObjArray[sI], alignedLevel)
  }
  return maxNodeNumTree
}
//  ===================================================================
/**
 * 去除name中的符号, 仅保留字符, 可以成为id
 * @param fatherNameLabel
 * @returns 去掉字符后的fatherNameLabel -> fatherclass
 */
function transfrom_name_id(name) {
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
/**
 *
 * @param nodeLabel
 * @returns {string}
 */
function transform_nodelabel_nodecategory(nodeLabel) {
  var nodeLabelArray = nodeLabel.split('-')
  nodeLabelArray.splice(0, 1)
  var nodeCategory = ''
  for (var nI = 0; nI < 3; nI++) {
    if (nI < nodeLabelArray.length) {
      nodeCategory = nodeCategory + nodeLabelArray[nI]
    } else {
      nodeCategory = nodeCategory + '0'
    }
  }
  return nodeCategory
}
/**
 * 判断一个数组中是否存在某个元素
 */
function has_elements(nodeArray, fatherNameLabel, depth) {
  if (typeof (nodeArray) !== 'undefined') {
    for (var nI = 0; nI < nodeArray.length; nI++) {
      if (nodeArray[nI] === (depth + '-' + fatherNameLabel)) {
        return true
      }
    }
    return false
  } else {
    return false
  }
}
/**
 * 将原始的treeObj转换为compact tree obj
 */
function transform_original_obj_compact_obj(treeObj, selectedLevels) {
  var compactDepth = 0
  var compactTolerance = 0
  var treeObj = JSON.parse(JSON.stringify(treeObj))
  var compactTreeObj = compactDepthTreeAddTemplateTree(treeObj, compactDepth, compactTolerance, selectedLevels)
  return compactTreeObj
}
/**
 *  传递treeObject计算compact模式下的节点数组
 *  首先将tree object按照节点内部的children计算compact模式, 即将具有相似结构的children的孩子节点删除;
 *  将compact模式下的对象进行线性化, 得到节点数组。在compact模式下的节点数组中需要标记compact模式的节点
 *  根据计算得到的节点数组计算节点的位置, 并且计算得到位置属性, x, y, width, height赋值在节点数组中的节点对象中
 */
function loadCompactSingleData(treeObj, barcodeWidthArray, fileObjData, selectedLevels, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval) {
  var compactTreeNodeArray = []
  var compactTolerance = 0
  var initDepth = 0
  addSubtreeDepth(treeObj, initDepth)
  sortCompactChildren(treeObj, selectedLevels)
  //  fileObjData内部存储不同compact层级的BarcodeTree的数据
  for (var compactDepth = 0; compactDepth >= 0; compactDepth--) { // compactDepth >= 1 maxDepth - 1
    var compactOption = 'compact-level-' + compactDepth
    fileObjData[compactOption] = {}
    var compactDataObjOption = fileObjData[compactOption]
    var cloneTreeObj1 = JSON.parse(JSON.stringify(treeObj))
    compactDepthTreeAddTemplateTree(cloneTreeObj1, compactDepth, compactTolerance, selectedLevels)
    compactTreeNodeArray = compactTreeLinearization(cloneTreeObj1, initDepth)
    compactDataObjOption['compactTreeNodeArray'] = compactTreeNodeArray
    // var compactTreeNodeObj = {}
    // for (var cI = 0; cI < compactTreeNodeArray.length; cI++) {
    //   var index = compactTreeNodeArray[ cI ].index
    //   compactTreeNodeObj[ index ] = compactTreeNodeArray[ cI ]
    // }
    // compactDataObjOption[ 'compactTreeNodeObj' ] = compactTreeNodeObj
    var compactTreeNodeLocArray = computeCompactNodeLocation(compactTreeNodeArray, barcodeHeight, barcodeWidthArray, compactNum, selectedLevels, barcodeNodeInterval)
    compactDataObjOption['compactTreeNodeLocArray'] = compactTreeNodeLocArray
  }
  // 动画结束时的compactTreeNodeArray
  var cloneTreeObj2 = JSON.parse(JSON.stringify(treeObj))
  var compactTreeNodeArray = treeLinearization(cloneTreeObj2, initDepth)
  var finalCompactTreeNodeObj = {}
  for (var fI = 0; fI < compactTreeNodeArray.length; fI++) {
    var index = compactTreeNodeArray[fI].index
    finalCompactTreeNodeObj[index] = compactTreeNodeArray[fI]
  }
  fileObjData['treeNodeObj'] = finalCompactTreeNodeObj
}
/**
 * 根据TreeObject的数组返回得到包含TreeObjectId的数据
 * @param treeObjArray
 */
function getTreeObjectIdArray(treeObjArray) {
  var treeObjectIdArray = []
  var initDepth = 0
  for (var tI = 0; tI < treeObjArray.length; tI++) {
    var treeObj = treeObjArray[tI]
    var treeNodeArray = treeLinearization(treeObj, initDepth)
    var treeNodeId = []
    for (var tI = 0; tI < treeNodeArray.length; tI++) {
      treeNodeId.push(treeNodeArray[tI].id)
    }
    treeObjectIdArray.push(treeNodeId)
  }
  return treeObjectIdArray
}
/**
 * transformFileNameArrayToFileObj将存在的
 * @param fileNameArray
 * @param existedFileObj
 * @param selectedLevelStr
 * @returns {Array}
 */
function transformFileNameArrayToFileObj(fileNameArray, existedFileObj, selectedLevelStr) {
  var treeObjArray = []
  for (var fI = 0; fI < fileNameArray.length; fI++) {
    var dataItemNameWithOptions = fileNameArray[fI] + selectedLevelStr
    var treeNodeObj = existedFileObj[dataItemNameWithOptions]['treeNodeObj']
    treeObjArray.push(treeNodeObj)
  }
  return treeObjArray
}
/**
 *
 */
function getCompactSuperTreeNodeFromTreeObjArray(treeObjArray, barcodeWidthArray, barcodeHeight, selectedLevels, rootId, rootLevel, alignedLevel, compactNum) {
  var compactSuperTree = null
  var compactMaxNodeNumTree = null
  var maxSubtreeWidth = 0
  var maxCompactSubtreeWidth = 0
  for (var tI = 0; tI < treeObjArray.length; tI++) {
    var treeNodeObj = treeObjArray[tI]
    var rootObj = treeNodeObj['node-0-root']
    if (typeof(rootObj) === 'undefined') {
      rootObj = treeNodeObj
    }
    //  递归计算子树的宽度
    getMaxSubtreeNodes(rootObj, barcodeWidthArray)
    if (typeof(treeNodeObj[rootId]) !== 'undefined') {
      if (treeNodeObj[rootId].subtreeWidth > maxSubtreeWidth) {
        maxSubtreeWidth = treeNodeObj[rootId].subtreeWidth
      }
    }
    var subtree_supertree = null
    var subtree_maxnodenum = null
    if (typeof(treeNodeObj[rootId]) !== 'undefined') {
      subtree_supertree = JSON.parse(JSON.stringify(treeNodeObj[rootId]))
      subtree_maxnodenum = JSON.parse(JSON.stringify(treeNodeObj[rootId]))
    } else {
      subtree_supertree = JSON.parse(JSON.stringify(treeNodeObj))
      subtree_maxnodenum = JSON.parse(JSON.stringify(treeNodeObj))
    }
    compactSuperTree = mergeTwoTreeObj(compactSuperTree, subtree_supertree)
    //   合并所有的子树中的最大的子树
    compactMaxNodeNumTree = findCompactMaxNodeNumTree(compactMaxNodeNumTree, subtree_maxnodenum, alignedLevel)
  }
  // compactDepth是压缩到的树的层级
  var compactDepth = +rootLevel
  var compactTolerance = 0
  var initDepth = +rootLevel
  sortChildren(compactSuperTree)
  sortChildren(compactMaxNodeNumTree)
  addSubtreeDepth(compactSuperTree, initDepth)
  addSubtreeDepth(compactMaxNodeNumTree, initDepth)
  compactDepthTreeAddTemplateTree(compactSuperTree, compactDepth, compactTolerance, selectedLevels)
  compactDepthTreeAddTemplateTree(compactMaxNodeNumTree, compactDepth, compactTolerance, selectedLevels)
  //  对于树对象进行线性化得到节点序列
  var compactSuperTreeNodeArray = compactTreeLinearization(compactSuperTree, initDepth)
  var compactMaxNodeNumTreeNodeArray = compactTreeLinearization(compactMaxNodeNumTree, initDepth)
  //  根据线性化的节点序列得到节点的位置属性
  var compactSuperTreeNodeLocArray = computeCompactNodeLocation(compactSuperTreeNodeArray, barcodeHeight, barcodeWidthArray, compactNum, selectedLevels)
  var compactMaxNodeNumTreeNodeLocArray = computeCompactNodeLocation(compactMaxNodeNumTreeNodeArray, barcodeHeight, barcodeWidthArray, compactNum, selectedLevels)
  maxCompactSubtreeWidth = compute_compact_max_subtree_width(compactSuperTreeNodeLocArray)
  compactSuperTreeNodeLocArray[0].subtreeWidth = compactSuperTreeNodeLocArray[compactSuperTreeNodeLocArray.length - 1].x + compactSuperTreeNodeLocArray[compactSuperTreeNodeLocArray.length - 1].width - compactSuperTreeNodeLocArray[0].x
  compactMaxNodeNumTreeNodeLocArray[0].subtreeWidth = compactMaxNodeNumTreeNodeLocArray[compactMaxNodeNumTreeNodeLocArray.length - 1].x + compactMaxNodeNumTreeNodeLocArray[compactMaxNodeNumTreeNodeLocArray.length - 1].width - compactSuperTreeNodeLocArray[0].x
  compactMaxNodeNumTreeNodeLocArray
  var compactSuperTreeObj = {
    'compactSuperTreeNodeLocArray': compactSuperTreeNodeLocArray,
    'compactMaxNodeNumTreeNodeLocArray': compactMaxNodeNumTreeNodeLocArray,
    'superTreeObj': compactSuperTree
  }
  return compactSuperTreeObj
}

/**
 * getSuperTreeNodeFromTreeObjArray
 * @param treeObjArray
 * @param barcodeWidthArray
 * @param selectedLevels
 * @param rootId
 * @param rootLevel
 * @param alignedLevel
 */
function getSuperTreeNodeFromTreeObjArray(treeObjArray, barcodeWidthArray, barcodeHeight, selectedLevels, rootId, rootLevel, alignedLevel, barcodeNodeInterval) {
  var superTree = null
  var maxNodeNumTree = null
  var maxSubtreeWidth = 0
  for (var tI = 0; tI < treeObjArray.length; tI++) {
    // var dataItemNameWithOptions = fileNameArray[ fI ] + selectedLevelStr
    // var treeNodeObj = existedFileObj[ dataItemNameWithOptions ][ 'treeNodeObj' ]
    var treeNodeObj = treeObjArray[tI]
    //  按照显示的节点更新barcode中子树的最大宽度
    var rootObj = treeNodeObj['node-0-root']
    if (typeof(rootObj) === 'undefined') {
      rootObj = treeNodeObj
    }
    getMaxSubtreeNodes(rootObj, barcodeWidthArray)
    if (typeof(treeNodeObj[rootId]) !== 'undefined') {
      if (treeNodeObj[rootId].subtreeWidth > maxSubtreeWidth) {
        maxSubtreeWidth = treeNodeObj[rootId].subtreeWidth
      }
    }
    var subtree_supertree = null
    var subtree_maxnodenum = null
    if (typeof(treeNodeObj[rootId]) !== 'undefined') {
      subtree_supertree = JSON.parse(JSON.stringify(treeNodeObj[rootId]))
      subtree_maxnodenum = JSON.parse(JSON.stringify(treeNodeObj[rootId]))
    } else {
      subtree_supertree = JSON.parse(JSON.stringify(treeNodeObj))
      subtree_maxnodenum = JSON.parse(JSON.stringify(treeNodeObj))
    }
    superTree = mergeTwoTreeObj(superTree, subtree_supertree)
    //   合并所有的子树中的最大的子树
    maxNodeNumTree = findMaxNodeNumTree(maxNodeNumTree, subtree_maxnodenum, alignedLevel)
  }
  var initDepth = rootLevel
  //  首先对于树对象的孩子节点按照其索引值大小进行排序, 线性化的过程与孩子节点在数组中的顺序相关
  sortChildren(superTree)
  sortChildren(maxNodeNumTree)
  //  对于树对象进行线性化得到节点序列
  var superTreeNodeArray = treeLinearization(superTree, initDepth)
  // console.log('superTreeNodeArray', superTreeNodeArray)
  var maxNodeNumTreeNodeArray = treeLinearization(maxNodeNumTree, initDepth)
  //  根据线性化的节点序列得到节点的位置属性
  var superTreeNodeLocArray = computeOriginalNodeLocation(superTreeNodeArray, barcodeWidthArray, selectedLevels, barcodeHeight, barcodeNodeInterval)
  var maxNodeNumTreeNodeLocArray = computeOriginalNodeLocation(maxNodeNumTreeNodeArray, barcodeWidthArray, selectedLevels, barcodeHeight, barcodeNodeInterval)
  // var maxNodeNumTreeNodeLocArray = computeOriginalNodeLocationSameWidth(maxNodeNumTreeNodeArray, barcodeWidthArray, selectedLevels, barcodeHeight, rootLevel)
  maxSubtreeWidth = compute_max_subtree_width(maxNodeNumTreeNodeLocArray, barcodeWidthArray, barcodeNodeInterval)
  var maxAlignedSubtreeWidth = compute_aligned_max_subtree_width(maxNodeNumTreeNodeLocArray, barcodeWidthArray, rootLevel, alignedLevel, barcodeNodeInterval)
  superTreeNodeLocArray[0].subtreeWidth = maxSubtreeWidth
  maxNodeNumTreeNodeLocArray[0].subtreeWidth = maxSubtreeWidth
  superTreeNodeLocArray[0].alignedSubtreeWidth = maxAlignedSubtreeWidth
  maxNodeNumTreeNodeLocArray[0].alignedSubtreeWidth = maxAlignedSubtreeWidth
  var superTreeObj = {
    'superTreeNodeLocArray': superTreeNodeLocArray,
    'maxNodeNumTreeNodeLocArray': maxNodeNumTreeNodeLocArray,
    'superTreeObj': superTree
  }
  return superTreeObj
}
/**
 *  对于线性化的节点数组, 数组中的每个节点存在节点中的状态描述
 *  根据数组计算原始状态的barcode的每个节点的位置以及大小
 */
function computeOriginalNodeLocationSameWidth(treeNodeArray, widthArray, selectedLevels, barcodeHeight, alignedLevel) {
  var xLoc = 0
  var perGapWidth = PER_GAP_WIDTH
  var treeNodeLocArray = []
  var alignedLevel = +alignedLevel
  var alignedNodeWidth = widthArray[alignedLevel]
  if ((alignedLevel + 1) < widthArray.length) {
    if (widthArray[alignedLevel + 1] !== 0) {
      alignedNodeWidth = widthArray[alignedLevel + 1]
    }
  }
  for (var i = 0; i < treeNodeArray.length; i++) {
    var treeNodeObj = treeNodeArray[i]
    var depth = treeNodeObj.depth
    var treeNodeLocObj = {}
    var rectWidth = widthArray[depth]
    xLoc = +xLoc.toFixed(2)
    treeNodeLocObj.x = xLoc
    treeNodeLocObj.y = 0
    treeNodeLocObj.category = treeNodeObj.id
    treeNodeLocObj.id = treeNodeObj.index
    treeNodeLocObj.depth = depth
    treeNodeLocObj.width = 0
    treeNodeLocObj.height = barcodeHeight
    treeNodeLocObj.maxnum = treeNodeObj.maxnum
    // if (typeof(treeNodeObj.maxnum) === 'undefined') {
    //   treeNodeLocObj.maxnum = treeNodeObj.num
    // } else {
    //   treeNodeLocObj.maxnum = treeNodeObj.maxnum
    // }
    treeNodeLocObj.num = treeNodeObj.num
    if (selectedLevels.indexOf(depth) !== -1) {
      treeNodeLocObj.width = rectWidth
      if (widthArray[depth] !== 0) {
        if (depth > alignedLevel) {
          xLoc = xLoc + alignedNodeWidth + perGapWidth
        } else {
          xLoc = xLoc + widthArray[depth] + perGapWidth
        }
        //
      }
    }
    // if (selectedLevels.indexOf(depth) !== -1) {
    treeNodeLocArray.push(treeNodeLocObj)
    // }
  }
  return treeNodeLocArray
}
/**
 * 根据树的节点数组以及节点的状态计算节点位置
 */
function computeCompactNodeLocation(compactTreeNodeArray, barcodeHeight, barcodeWidthArray, compactNum, selectedLevels, barcodeNodeInterval) {
  var xLoc = 0
  var compactCount = 0
  var treeNodeLocArray = []
  compactNum = +compactNum
  barcodeNodeInterval = +barcodeNodeInterval
  var compactNodeHeight = barcodeHeight / (compactNum + (compactNum - 1) / 4)
  var previousRectWidth = 0
  var previousDepth = 0
  var previousCompact = false
  for (var cI = 0; cI < compactTreeNodeArray.length; cI++) {
    var treeNodeObj = compactTreeNodeArray[cI]
    var depth = treeNodeObj.depth
    var treeNodeLocObj = {}
    var rectWidth = barcodeWidthArray[depth]
    var compactAttr = treeNodeObj.compactAttr
    treeNodeLocObj.compactAttr = compactAttr
    treeNodeLocObj.depth = depth
    treeNodeLocObj.existed = true
    treeNodeLocObj.category = treeNodeObj.id
    treeNodeLocObj.categoryName = treeNodeObj.categoryName
    treeNodeLocObj.id = treeNodeObj.index
    treeNodeLocObj.maxnum = treeNodeObj.maxnum
    treeNodeLocObj.num = treeNodeObj.num
    if (compactAttr === ABSOLUTE_COMPACT_FATHER) {
      xLoc = +xLoc.toFixed(2)
      compactNodeHeight = +compactNodeHeight.toFixed(2)
      //  在两个不同层级的compact类型的节点连接起来的情况下
      if (depth < previousDepth) {
        //  增加判断上一个节点是否是compact是为了避免上一个节点是uncompact模式, 已经在xLoc上增加了值, 此时不需要继续在xLoc上增加width和gap
        if ((previousCompact) && (compactCount !== 0)) {
          xLoc = xLoc + previousRectWidth + barcodeNodeInterval
        }
        compactCount = 0
      }
      treeNodeLocObj.x = xLoc
      treeNodeLocObj.y = (compactNodeHeight + compactNodeHeight / 4) * compactCount
      treeNodeLocObj.compactCount = compactCount
      treeNodeLocObj.height = compactNodeHeight
      if (selectedLevels.indexOf(depth) !== -1) {
        treeNodeLocObj.width = rectWidth
        compactCount = compactCount + 1
        compactCount = compactCount % compactNum
        if (rectWidth !== 0) {
          if (compactCount === 0) {
            xLoc = xLoc + rectWidth + barcodeNodeInterval
          }
          previousRectWidth = rectWidth
          previousDepth = depth
          previousCompact = true
        }
      }
    } else {
      //  如果compactCount为0, 那么就不需要增加previousRectWidth, 因为已经增加过rectWidth
      if (compactCount !== 0) {
        xLoc = xLoc + previousRectWidth + barcodeNodeInterval
      }
      compactCount = 0
      xLoc = +xLoc.toFixed(2)
      treeNodeLocObj.x = xLoc
      treeNodeLocObj.y = 0
      treeNodeLocObj.width = 0
      treeNodeLocObj.height = barcodeHeight
      if (selectedLevels.indexOf(depth) !== -1) {
        treeNodeLocObj.width = rectWidth
        if (rectWidth !== 0) {
          xLoc = xLoc + rectWidth + barcodeNodeInterval
          previousRectWidth = rectWidth
          previousDepth = depth
          previousCompact = false
        }
      }
    }
    treeNodeLocArray.push(treeNodeLocObj)
  }
  return treeNodeLocArray
}

// function computeCompactNodeLocation(compactTreeNodeArray, barcodeHeight, barcodeWidthArray, compactNum, selectedLevels, barcodeNodeInterval) {
//   var xLoc = 0
//   var compactCount = 0
//   var treeNodeLocArray = []
//   compactNum = +compactNum
//   barcodeNodeInterval = +barcodeNodeInterval
//   var compactNodeHeight = barcodeHeight / (compactNum + (compactNum - 1) / 4)
//   var previousRectWidth = 0
//   var previousDepth = 0
//   var previousCompact = false
//   for (var cI = 0; cI < compactTreeNodeArray.length; cI++) {
//     var treeNodeObj = compactTreeNodeArray[cI]
//     var depth = treeNodeObj.depth
//     var treeNodeLocObj = {}
//     var rectWidth = barcodeWidthArray[depth]
//     var compactAttr = treeNodeObj.compactAttr
//     treeNodeLocObj.compactAttr = compactAttr
//     treeNodeLocObj.depth = depth
//     treeNodeLocObj.category = treeNodeObj.id
//     treeNodeLocObj.id = treeNodeObj.index
//     if (compactAttr === ABSOLUTE_COMPACT_FATHER) {
//       compactNodeHeight = +compactNodeHeight.toFixed(2)
//       //  在两个不同层级的compact类型的节点连接起来的情况下
//       if (depth < previousDepth) {
//         //  增加判断上一个节点是否是compact是为了避免上一个节点是uncompact模式, 已经在xLoc上增加了值, 此时不需要继续在xLoc上增加width和gap
//         if ((previousCompact) && (compactCount !== 0)) {
//           xLoc = xLoc + previousRectWidth + barcodeNodeInterval
//         }
//         compactCount = 0
//       }
//       treeNodeLocObj.x = xLoc
//       treeNodeLocObj.y = (compactNodeHeight + compactNodeHeight / 4) * compactCount
//       treeNodeLocObj.compactCount = compactCount
//       treeNodeLocObj.height = compactNodeHeight
//       if (selectedLevels.indexOf(depth) !== -1) {
//         treeNodeLocObj.width = rectWidth
//         compactCount = compactCount + 1
//         compactCount = compactCount % compactNum
//         if (rectWidth !== 0) {
//           if (compactCount === 0) {
//             xLoc = xLoc + rectWidth + barcodeNodeInterval
//           }
//           previousRectWidth = rectWidth
//           previousDepth = depth
//           previousCompact = true
//         }
//       }
//     } else {
//       //  如果compactCount为0, 那么就不需要增加previousRectWidth, 因为已经增加过rectWidth
//       if (compactCount !== 0) {
//         xLoc = xLoc + previousRectWidth + barcodeNodeInterval
//       }
//       compactCount = 0
//       treeNodeLocObj.x = xLoc
//       treeNodeLocObj.y = 0
//       treeNodeLocObj.width = 0
//       treeNodeLocObj.height = barcodeHeight
//       if (selectedLevels.indexOf(depth) !== -1) {
//         treeNodeLocObj.width = rectWidth
//         if (rectWidth !== 0) {
//           xLoc = xLoc + rectWidth + barcodeNodeInterval
//           previousRectWidth = rectWidth
//           previousDepth = depth
//           previousCompact = false
//         }
//       }
//     }
//     treeNodeLocArray.push(treeNodeLocObj)
//   }
//   return treeNodeLocArray
// }
/**
 * getSuperTreeNodes
 * 传递用户选择的树的名称数组, 对于选择的树建立superTree并且返回superTree的节点数组
 */
function getSuperTreeNodes(fileNameArray, existedFileObj, selectedLevelStr, barcodeWidthArray, barcodeHeight, selectedLevels, rootId, rootLevel, alignedLevel, compactNum, barcodeNodeInterval) {
  // var treeObjArray = transformFileNameArrayToFileObj(fileNameArray, existedFileObj, selectedLevelStr)
  // var compactTreeObjArray = transformFileNameArrayToCompactFileObj(fileNameArray, existedFileObj, selectedLevelStr)
  var originalSuperTreeObj = getSuperTreeNodeFromTreeObjArray(treeObjArray, barcodeWidthArray, barcodeHeight, selectedLevels, rootId, rootLevel, alignedLevel, barcodeNodeInterval)
  // var compactSuperTreeObj = getCompactSuperTreeNodeFromTreeObjArray(compactTreeObjArray, barcodeWidthArray, barcodeHeight, selectedLevels, rootId, rootLevel, alignedLevel, compactNum, barcodeNodeInterval)
  return {
    'originalSuperTreeObj': originalSuperTreeObj,
    // 'compactSuperTreeObj': compactSuperTreeObj
  }
}
/**
 * 根据compact的barcode节点数组计算barcode的宽度
 */
function compute_compact_max_subtree_width(maxNodeNumTreeNodeLocArray, barcodeWidthArray) {
  var rootNodeX = maxNodeNumTreeNodeLocArray[0].x
  var maxLeafNode = maxNodeNumTreeNodeLocArray[maxNodeNumTreeNodeLocArray.length - 1]
  var maxLeafNodeX = maxLeafNode.x + maxLeafNode.width
  return (maxLeafNodeX - rootNodeX)
}
/**
 * 根据barcode节点数组计算align之后的barcode的宽度, 相对于compute_max_subtree_width, 这个方法所计算的subtreeWidth长于另一个方法计算的结果
 * 因为在该方法中的节点的宽度都是按照aligned的宽度进行计算的
 */
function compute_aligned_max_subtree_width(maxNodeNumTreeNodeLocArray, barcodeWidthArray, rootLevel, globalAlignedLevel, barcodeNodeInterval) {
  var maxSubtreeWidth = 0
  rootLevel = +rootLevel
  globalAlignedLevel = +globalAlignedLevel
  var alignedLevel = rootLevel > globalAlignedLevel ? rootLevel : globalAlignedLevel
  var alignedNodeWidth = barcodeWidthArray[alignedLevel]
  if ((alignedLevel + 1) < barcodeWidthArray.length) {
    if (barcodeWidthArray[alignedLevel + 1] !== 0) {
      alignedNodeWidth = barcodeWidthArray[alignedLevel + 1]
    }
  }
  for (var mI = 0; mI < maxNodeNumTreeNodeLocArray.length; mI++) {
    var depth = maxNodeNumTreeNodeLocArray[mI].depth
    if (barcodeWidthArray[depth] !== 0) {
      if (depth > alignedLevel) {
        maxSubtreeWidth = maxSubtreeWidth + alignedNodeWidth + barcodeNodeInterval
      } else {
        maxSubtreeWidth = maxSubtreeWidth + barcodeWidthArray[depth] + barcodeNodeInterval
      }
    } else {
      maxSubtreeWidth = maxSubtreeWidth + barcodeWidthArray[depth]
    }
  }
  return maxSubtreeWidth
}
/**
 * 根据barcode节点数组计算barcode的整个宽度
 */
function compute_max_subtree_width(maxNodeNumTreeNodeLocArray, barcodeWidthArray, barcodeNodeInterval) {
  var perGapWidth = PER_GAP_WIDTH
  var maxSubtreeWidth = 0
  for (var mI = 0; mI < maxNodeNumTreeNodeLocArray.length; mI++) {
    var depth = maxNodeNumTreeNodeLocArray[mI].depth
    if (barcodeWidthArray[depth] !== 0) {
      maxSubtreeWidth = maxSubtreeWidth + barcodeWidthArray[depth] + barcodeNodeInterval
    } else {
      maxSubtreeWidth = maxSubtreeWidth + barcodeWidthArray[depth]
    }
  }
  return maxSubtreeWidth
}
/**
 *
 */
function getCompactMaxSubtreeNodesWidth(treeObj, barcodeWidthArray) {
  var perGapWidth = PER_GAP_WIDTH
  var cloneTreeObj = JSON.parse(JSON.stringify(treeObj))
  sortChildren(cloneTreeObj)
  innerGetMaxSubtreeWidth(treeObj)
  function innerGetMaxSubtreeWidth(treeObj) {
    if ((typeof(treeObj.children) !== 'undefined') && (treeObj.children != null)) {
      for (var cI = 0; cI < treeObj.children.length; cI++) {
        innerGetMaxSubtreeWidth(treeObj.children[cI])
      }
      var subtreeWidth = getCompactSubtreeWidth(treeObj)
      for (var cI = 0; cI < treeObj.children.length; cI++) {
        if (treeObj.children[cI].subtreeWidth !== 0) {
          subtreeWidth = subtreeWidth + treeObj.children[cI].subtreeWidth + perGapWidth
        }
      }
    } else {
      var depth = treeObj['depth']
      var nodeWidth = barcodeWidthArray[depth]
      treeObj.subtreeWidth = nodeWidth
    }
  }

  function getCompactSubtreeWidth(treeObj) {

  }
}
/**
 * 计算树中每一个子树下面孩子节点的数目, 并且计算所占据的长度
 */
function getMaxSubtreeNodes(treeObj, barcodeWidthArray) {
  var perGapWidth = PER_GAP_WIDTH
  innerGetMaxSubtreeWidth(treeObj)
  function innerGetMaxSubtreeWidth(treeObj) {
    if ((typeof(treeObj.children) !== 'undefined') && (treeObj.children != null)) {
      for (var cI = 0; cI < treeObj.children.length; cI++) {
        innerGetMaxSubtreeWidth(treeObj.children[cI])
      }
      var subtreeWidth = barcodeWidthArray[treeObj['depth']]
      for (var cI = 0; cI < treeObj.children.length; cI++) {
        if (treeObj.children[cI].subtreeWidth !== 0) {
          subtreeWidth = subtreeWidth + treeObj.children[cI].subtreeWidth + perGapWidth
        }
      }
      treeObj.subtreeWidth = subtreeWidth
    } else {
      var depth = treeObj['depth']
      var nodeWidth = barcodeWidthArray[depth]
      treeObj.subtreeWidth = nodeWidth
    }
  }
}
/**
 * 将所有comapct子树中节点数目最多的子树拼接起来得到的unionTree
 * @param treeObj1
 * @param treeObj2
 * @param alignedLevel
 * @returns {*}
 */
function findCompactMaxNodeNumTree(treeObj1, treeObj2, alignedLevel) {
  if ((treeObj1 == null) || (typeof(treeObj1) === 'undefined')) {
    return treeObj2
  } else if ((treeObj2 == null) || (typeof (treeObj2) === 'undefined')) {
    return treeObj1
  } else {
    var superTreeObj = {}
    superTreeObj['name'] = treeObj1['name']
    superTreeObj['num'] = treeObj1['num']
    superTreeObj['subtreeWidth'] = treeObj1['subtreeWidth']
    superTreeObj['depth'] = treeObj1['depth']
    if (typeof (treeObj1.children) !== 'undefined') {
      superTreeObj.children = treeObj1.children
    }
    var nodeExist = false
    // if (alignedLevel <= superTreeObj.depth) {
    //   if (superTreeObj[ 'subtreeWidth' ] < treeObj2[ 'subtreeWidth' ]) {
    //     superTreeObj.children = JSON.parse(JSON.stringify(treeObj2.children))
    //     superTreeObj[ 'subtreeWidth' ] = treeObj2[ 'subtreeWidth' ]
    //   }
    // } else {
    if (typeof (treeObj2.children) !== 'undefined') {
      for (var i = 0; i < treeObj2.children.length; i++) {
        var findObj = false
        var childrenName = treeObj2.children[i].name
        if (typeof (superTreeObj.children) === 'undefined') {
          superTreeObj.children = []
        }
        for (var j = 0; j < superTreeObj.children.length; j++) {
          var superTreeObjName = superTreeObj.children[j].name
          if (childrenName === superTreeObjName) {
            //  寻找孩子的节点数目/占空间部分最大的子树, 其实对齐的是找到的空间部分最大的子树, 也就是该superTreeObj的下一个层级的节点
            // if (alignedLevel <= (superTreeObj.depth + 1)) {
            //   var superTreeChildWidth = superTreeObj.children[ j ].subtreeWidth
            //   var mergedTreeChildWidth = treeObj2.children[ i ].subtreeWidth
            //   if (mergedTreeChildWidth > superTreeChildWidth) {
            //     superTreeObj.children[ j ] = JSON.parse(JSON.stringify(treeObj2.children[ i ]))
            //   }
            // } else {
            superTreeObj.children[j] = findCompactMaxNodeNumTree(superTreeObj.children[j], treeObj2.children[i], alignedLevel)
            // }
            findObj = true
          }
        }
        if (!findObj) {
          var addedObj = JSON.parse(JSON.stringify(treeObj2.children[i]))
          superTreeObj.children.push(addedObj)
        }
        var treeObj2SubtreeWidth = 0
        for (var cI = 0; cI < superTreeObj.children.length; cI++) {
          treeObj2SubtreeWidth = treeObj2SubtreeWidth + superTreeObj.children[cI].subtreeWidth
        }
        superTreeObj.subtreeWidth = treeObj2SubtreeWidth
      }
    }
    // }
    return superTreeObj
  }
}
/**
 * 将所有子树中节点数目最多的子树拼接起来得到的unionTree
 */
function findMaxNodeNumTree(treeObj1, treeObj2, alignedLevel) {
  if ((treeObj1 == null) || (typeof(treeObj1) === 'undefined')) {
    return treeObj2
  } else if ((treeObj2 == null) || (typeof (treeObj2) === 'undefined')) {
    return treeObj1
  } else {
    var superTreeObj = {}
    superTreeObj['name'] = treeObj1['name']
    superTreeObj['num'] = treeObj1['num']
    superTreeObj['categoryName'] = treeObj1['categoryName']
    superTreeObj['subtreeWidth'] = treeObj1['subtreeWidth']
    superTreeObj['depth'] = treeObj1['depth']
    if (typeof (treeObj1.children) !== 'undefined') {
      superTreeObj.children = treeObj1.children
    }
    var nodeExist = false
    if (alignedLevel <= superTreeObj.depth) {
      if (superTreeObj['subtreeWidth'] < treeObj2['subtreeWidth']) {
        superTreeObj.children = JSON.parse(JSON.stringify(treeObj2.children))
        superTreeObj['subtreeWidth'] = treeObj2['subtreeWidth']
      }
    } else {
      if (typeof (treeObj2.children) !== 'undefined') {
        for (var i = 0; i < treeObj2.children.length; i++) {
          var findObj = false
          var childrenName = treeObj2.children[i].name
          if (typeof (superTreeObj.children) !== 'undefined') {
            for (var j = 0; j < superTreeObj.children.length; j++) {
              var superTreeObjName = superTreeObj.children[j].name
              if (childrenName === superTreeObjName) {
                //  寻找孩子的节点数目/占空间部分最大的子树, 其实对齐的是找到的空间部分最大的子树, 也就是该superTreeObj的下一个层级的节点
                // if (alignedLevel <= (superTreeObj.depth + 1)) {
                //   var superTreeChildWidth = superTreeObj.children[ j ].subtreeWidth
                //   var mergedTreeChildWidth = treeObj2.children[ i ].subtreeWidth
                //   if (mergedTreeChildWidth > superTreeChildWidth) {
                //     superTreeObj.children[ j ] = JSON.parse(JSON.stringify(treeObj2.children[ i ]))
                //   }
                // } else {
                superTreeObj.children[j] = findMaxNodeNumTree(superTreeObj.children[j], treeObj2.children[i], alignedLevel)
                // }
                findObj = true
              }
            }
          }
          if (!findObj) {
            var addedObj = JSON.parse(JSON.stringify(treeObj2.children[i]))
            if (typeof (superTreeObj.children) === 'undefined') {
              superTreeObj.children = []
            }
            superTreeObj.children.push(addedObj)
          }
          var treeObj2SubtreeWidth = 0
          for (var cI = 0; cI < superTreeObj.children.length; cI++) {
            treeObj2SubtreeWidth = treeObj2SubtreeWidth + superTreeObj.children[cI].subtreeWidth
          }
          superTreeObj.subtreeWidth = treeObj2SubtreeWidth
        }
      }
    }
    return superTreeObj
  }
}
/**
 * 计算两个树的补集
 */
function complementTwoTreeObj(treeObj1, treeObj2) {
  if ((treeObj1 == null) || (typeof(treeObj1) === 'undefined')) {
    return null
  } else if ((treeObj2 == null) || (typeof (treeObj2) === 'undefined')) {
    return null
  } else {
    var superTreeObj = {}
    superTreeObj['name'] = treeObj1['name']
    superTreeObj['categoryName'] = treeObj1['categoryName']
    if (typeof (treeObj1.children) !== 'undefined') {
      superTreeObj.children = treeObj1.children
      if (typeof (superTreeObj.children) === 'undefined') {
        superTreeObj.children = []
      }
    }
    if (typeof(superTreeObj.children) !== 'undefined') {
      for (var j = 0; j < superTreeObj.children.length; j++) {
        var superTreeObjName = superTreeObj.children[j].name
        var nodeExisted = false
        for (var i = 0; i < treeObj2.children.length; i++) {
          var childrenName = treeObj2.children[i].name
          if (superTreeObjName === childrenName) {
            var interactSuperTree = interactTwoTreeObj(superTreeObj.children[j], treeObj2.children[i])
            superTreeObj.children.splice(j, 1, interactSuperTree)
            nodeExisted = true
          }
        }
        if (nodeExisted) {
          superTreeObj.children.splice(j, 1)
          j = j - 1
        }
      }
    } else {
      superTreeObj.children = []
    }
    return superTreeObj
  }
  return
}
/**
 *  计算两个树的交集
 */
function interactTwoTreeObj(treeObj1, treeObj2) {
  if ((treeObj1 == null) || (typeof(treeObj1) === 'undefined')) {
    return null
  } else if ((treeObj2 == null) || (typeof (treeObj2) === 'undefined')) {
    return null
  } else {
    var superTreeObj = {}
    superTreeObj['name'] = treeObj1['name']
    superTreeObj['categoryName'] = treeObj1['categoryName']
    if (typeof (treeObj1.children) !== 'undefined') {
      superTreeObj.children = treeObj1.children
      if (typeof (superTreeObj.children) === 'undefined') {
        superTreeObj.children = []
      }
    }
    if (typeof(superTreeObj.children) !== 'undefined') {
      for (var j = 0; j < superTreeObj.children.length; j++) {
        var superTreeObjName = superTreeObj.children[j].name
        var nodeExisted = false
        for (var i = 0; i < treeObj2.children.length; i++) {
          var childrenName = treeObj2.children[i].name
          if (superTreeObjName === childrenName) {
            var interactSuperTree = interactTwoTreeObj(superTreeObj.children[j], treeObj2.children[i])
            superTreeObj.children.splice(j, 1, interactSuperTree)
            nodeExisted = true
          }
        }
        if (!nodeExisted) {
          superTreeObj.children.splice(j, 1)
          j = j - 1
        }
      }
    } else {
      superTreeObj.children = []
    }
    return superTreeObj
  }
  return
}
/**
 *  合并两个树,得到合并之后的树的结构
 */
function mergeTwoTreeObj(treeObj1, treeObj2) {
  if ((treeObj1 == null) || (typeof(treeObj1) === 'undefined')) {
    if (typeof (treeObj2) !== 'undefined') {
      treeObj2['maxnum'] = treeObj2['num']
      return treeObj2
    }
  } else if ((treeObj2 == null) || (typeof (treeObj2) === 'undefined')) {
    if (typeof (treeObj1) !== 'undefined') {
      treeObj1['maxnum'] = treeObj1['num']
      return treeObj1
    }
  } else {
    var superTreeObj = {}
    superTreeObj['name'] = treeObj1['name']
    superTreeObj['categoryName'] = treeObj1['categoryName']
    superTreeObj['num'] = treeObj1['num']
    var treeObj1MaxNum = 0
    var treeObj2MaxNum = 0
    if (typeof (treeObj1['maxnum']) !== 'undefined') {
      treeObj1MaxNum = +treeObj1['maxnum']
    } else {
      treeObj1MaxNum = +treeObj1['num']
    }
    if (typeof (treeObj2['maxnum']) !== 'undefined') {
      treeObj2MaxNum = +treeObj2['maxnum']
    } else {
      treeObj2MaxNum = +treeObj2['num']
    }
    if ((typeof (treeObj2MaxNum) !== 'undefined') && (typeof (treeObj1MaxNum) !== 'undefined')) {
      superTreeObj['maxnum'] = treeObj1MaxNum > treeObj2MaxNum ? treeObj1MaxNum : treeObj2MaxNum
    } else if (typeof (treeObj2MaxNum) === 'undefined') {
      superTreeObj['maxnum'] = treeObj1MaxNum
    } else if (typeof (treeObj1MaxNum) !== 'undefined') {
      superTreeObj['maxnum'] = treeObj2MaxNum
    }
    if (typeof (treeObj1.children) !== 'undefined') {
      superTreeObj.children = treeObj1.children
      if (typeof (superTreeObj.children) === 'undefined') {
        superTreeObj.children = []
      }
    }
    var nodeExist = false
    if (typeof (treeObj2.children) !== 'undefined') {
      for (var i = 0; i < treeObj2.children.length; i++) {
        nodeExist = false
        var childrenName = treeObj2.children[i].name
        if (typeof(superTreeObj.children) === 'undefined') {
          superTreeObj.children = []
        }
        for (var j = 0; j < superTreeObj.children.length; j++) {
          var superTreeObjName = superTreeObj.children[j].name
          if (childrenName === superTreeObjName) {
            nodeExist = true
            var mergeSubChild1 = superTreeObj.children[j]
            var mergeSubChild2 = treeObj2.children[i]
            var mergedSuperTree = mergeTwoTreeObj(mergeSubChild1, mergeSubChild2)
            mergedSuperTree['num'] = (+mergeSubChild1['num']) + (+mergeSubChild2['num'])
            superTreeObj.children.splice(j, 1, mergedSuperTree)
            superTreeObj['num'] = (+superTreeObj['num']) + (+mergeSubChild2['num'])
            break
          }
        }
        if (!nodeExist) {
          superTreeObj.children.push(treeObj2.children[i])
          superTreeObj['num'] = (+superTreeObj['num']) + (+treeObj2.children[i]['num'])
        }
      }
    }
    return superTreeObj
  }
  return
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
/**
 * 对于对象形式的树的孩子节点label大小进行排序
 * @param tree: 对象形式的树
 */
function sortCompactChildren(tree, selectedLevels) {
  innerSortCompactChildren(tree, selectedLevels)
  function innerSortCompactChildren(tree, selectedLevels) {
    if (typeof (tree.children) !== 'undefined') {
      tree.children = sortChildren(tree.children, selectedLevels)
      // tree.children.sort(function (a, b) {
      //   var aName = a.name
      //   var bName = b.name
      //   return aName - bName
      // })
      for (var i = 0; i < tree.children.length; i++) {
        innerSortCompactChildren(tree.children[i], selectedLevels)
      }
    }
  }

  function sortChildren(childrenArray, selectedLevels) {
    var cloneChildrenArray = []
    for (var cI = 0; cI < childrenArray.length; cI++) {
      if (!childrenArray[cI].isPicked) {
        pickChildren(cloneChildrenArray, childrenArray[cI])
        for (var iI = (cI + 1); iI < childrenArray.length; iI++) {
          if (!childrenArray[iI].isPicked) {
            if (treeDistance(childrenArray[cI], childrenArray[iI], selectedLevels) === 0) {
              pickChildren(cloneChildrenArray, childrenArray[iI])
            }
          }
        }
      }
    }
    return cloneChildrenArray
    function pickChildren(childrenArray, child) {
      childrenArray.push(child)
      child.isPicked = true
    }
  }
}
/**
 * transformFileNameArrayToFileObj将存在的
 * @param fileNameArray
 * @param existedFileObj
 * @param selectedLevelStr
 * @returns {Array}
 */
function transformFileNameArrayToCompactFileObj(fileNameArray, existedFileObj, selectedLevelStr) {
  var treeObjArray = []
  for (var fI = 0; fI < fileNameArray.length; fI++) {
    var dataItemNameWithOptions = fileNameArray[fI] + 'compact-' + selectedLevelStr
    if (typeof(existedFileObj[dataItemNameWithOptions]) !== 'undefined') {
      var treeNodeObj = existedFileObj[dataItemNameWithOptions]['treeNodeObj']
      treeObjArray.push(treeNodeObj)
    }
  }
  return treeObjArray
}
/**
 * 将原始的treeObj转换为compact tree obj
 */
function transform_original_obj_compact_obj(treeObj, selectedLevels) {
  var minDepth = treeObj.depth
  var maxDepth = 0
  for (var sI = 0; sI < selectedLevels.length; sI++) {
    var selectedLevel = +selectedLevels[sI]
    if (maxDepth < selectedLevel) {
      maxDepth = selectedLevel
    }
  }
  var compactTreeObjectObj = {}
  var compactTolerance = 0
  for (var mI = maxDepth; mI >= minDepth; mI--) {
    var compactDepth = mI
    var compactTreeObj = clone(treeObj)
    compactDepthTreeAddTemplateTree(compactTreeObj, compactDepth, compactTolerance, selectedLevels)
    var compactAttr = 'compact-' + compactDepth
    compactTreeObjectObj[compactAttr] = compactTreeObj
  }
  return compactTreeObjectObj
}
/**
 *  将compact之后的树对象转换为compact的节点数组
 */
function compactTreeLinearization(treeObj) {
  var treeNodeArray = []
  var treeObj = clone(treeObj)
  var initDepth = treeObj.depth

  function is_numeric(str) {
    return /^\d+$/.test(str)
  }

  function zFill(str) {
    var pad = "000"
    var ans = str + pad.substring(0, pad.length - str.length)
    return ans
  }

  function innerLinearizeTreeObj(treeObj, depth, treeNodeArray) {
    var nodeName = treeObj.name
    if (is_numeric(nodeName)) {
      nodeName = zFill(nodeName)
    } else {
      nodeName = transfrom_name_id(nodeName)
    }
    depth = +depth
    treeObj.id = nodeName
    treeObj.index = 'node-' + depth + '-' + nodeName
    treeObj.depth = +depth
    treeNodeArray.push(treeObj)
    if ((typeof (treeObj.children) !== 'undefined') && (treeObj.children != null)) {
      depth = depth + 1
      for (var cI = 0; cI < treeObj.children.length; cI++) {
        innerLinearizeTreeObj(treeObj.children[cI], depth, treeNodeArray)
      }
    }
    return
  }

  var depth = initDepth
  innerLinearizeTreeObj(treeObj, depth, treeNodeArray)
  return treeNodeArray
}
/**
 *  对于线性化的节点数组, 数组中的每个节点存在节点中的状态描述
 *  根据数组计算原始状态的barcode的每个节点的位置以及大小
 */
function computeOriginalNodeLocation(treeNodeArray, widthArray, selectedLevels, barcodeHeight, barcodeNodeInterval) {
  var xLoc = 0
  var treeNodeLocArray = []
  for (var i = 0; i < treeNodeArray.length; i++) {
    var treeNodeObj = treeNodeArray[i]
    var depth = treeNodeObj.depth
    if (selectedLevels.indexOf(depth) !== -1) {
      var treeNodeLocObj = {}
      var rectWidth = widthArray[depth]
      xLoc = +xLoc.toFixed(2)
      treeNodeLocObj.x = xLoc
      treeNodeLocObj.y = 0
      treeNodeLocObj.category = treeNodeObj.name
      treeNodeLocObj.categoryName = treeNodeObj.categoryName
      treeNodeLocObj.id = treeNodeObj.index
      treeNodeLocObj.depth = depth
      treeNodeLocObj.width = 0
      treeNodeLocObj.height = barcodeHeight
      treeNodeLocObj.maxnum = treeNodeObj.maxnum
      treeNodeLocObj.num = treeNodeObj.num
      treeNodeLocObj.nodeNum = treeNodeObj.nodeNum
      treeNodeLocObj.width = rectWidth
      if (widthArray[depth] !== 0) {
        xLoc = xLoc + widthArray[depth] + barcodeNodeInterval
      }
      treeNodeLocArray.push(treeNodeLocObj)
    }
  }
  return treeNodeLocArray
}
/**
 * 压缩所有的具有相同结构的子树
 * @param tree
 * @param compactDepth
 * @param tolerance
 */
function compactDepthTreeAddTemplateTree(tree, compactDepth, tolerance, selectedLevels) {
  //  在树的叶节点中的children属性才为undefined, 被压缩节点的children属性为null
  if ((typeof (tree.children) !== 'undefined') && (tree.children !== null)) {
    if (tree.depth >= compactDepth) {
      for (var i = 0; i < tree.children.length; i++) {
        //  遍历树中的所有孩子节点, 将其中的重复的节点进行压缩
        if (((typeof(tree.children[i]) !== 'undefined')) && (tree.children[i] !== null) && (tree.children[i].compactAttr !== ABSOLUTE_COMPACT_FATHER)) { //  对于已经被压缩过的节点不再以此节点为基准进行压缩
          //  先判断以某一个节点为基准, 该节点是否存在重复节点
          var existRepeat = false
          if ((i + 1) < tree.children.length) {
            var twoTreeDistance = treeDistance(tree.children[i], tree.children[i + 1], selectedLevels)
            if (twoTreeDistance <= tolerance) {
              existRepeat = true
            }
          }
          /*
           *  如果存在重复节点, 那么需要增加一个模板节点, 这个模板节点是没有被压缩的
           *  将这个模板节点的isCompact属性复制为 false
           *  如果不存在重复节点, 那么不需要添加模板节点, 而把 **这个节点** 的isCompact属性赋值为 false
           */
          if (existRepeat) {
            var addedObject = clone(tree.children[i])
            addIsCompactToNodes(false, addedObject)
            addedObject.name = 'template-' + Math.round(Math.random() * 10000)
            addCompactAttr(addedObject, TEMPLATE)
            tree.children.splice(i, 0, addedObject)
            tree.children[i].isCompact = false
          } else {
            tree.children[i].isCompact = false
          }
          existRepeat = false
          //  再次遍历树的孩子节点, 对于孩子节点中重复的节点进行压缩, 具体是将children赋值为null
          //  children的值存储在_children属性中记录, 同时这个节点以及其子节点的isCompact属性赋值为true
          for (var j2 = (i + 1); j2 < tree.children.length; j2++) {
            var twoTreeDistance = treeDistance(tree.children[i], tree.children[j2], selectedLevels)
            if (twoTreeDistance <= tolerance) {
              // if (typeof (tree.children[ j2 ].children) !== 'undefined') {
              addIsCompactToNodes(true, tree.children[j2])
              addCompactAttr(tree.children[j2], ABSOLUTE_COMPACT_CHILDREN)
              tree.children[j2].compactAttr = ABSOLUTE_COMPACT_FATHER
              modifyChildren2_Children(tree.children[j2])
            } else {
              break
            }
          }
        }
      }
    }
    //  递归的调用这个函数, 对于子树压缩, 添加模板节点, 并且增加是否收缩的属性
    for (var k = 0; k < tree.children.length; k++) {
      if ((tree.children[k].compactAttr !== ABSOLUTE_COMPACT_FATHER) && (tree.children[k].compactAttr !== TEMPLATE)) {
        compactDepthTreeAddTemplateTree(tree.children[k], compactDepth, tolerance, selectedLevels)
      }
    }
  }
  return
}
// function compactDepthTreeAddTemplateTree(tree, compactDepth, tolerance, selectedLevels) {
//   var tree = clone(tree)
//   //  在树的叶节点中的children属性才为undefined, 被压缩节点的children属性为null
//   if ((typeof (tree.children) !== 'undefined') && (tree.children !== null)) {
//     if (tree.depth >= compactDepth) {
//       for (var i = 0; i < tree.children.length; i++) {
//         //  遍历树中的所有孩子节点, 将其中的重复的节点进行压缩
//         if (((typeof(tree.children[i]) !== 'undefined')) && (tree.children[i] !== null) && (tree.children[i].compactAttr !== ABSOLUTE_COMPACT_FATHER)) { //  对于已经被压缩过的节点不再以此节点为基准进行压缩
//           //  先判断以某一个节点为基准, 该节点是否存在重复节点
//           var existRepeat = false
//           if ((i + 1) < tree.children.length) {
//             var twoTreeDistance = treeDistance(tree.children[i], tree.children[i + 1], selectedLevels)
//             if (twoTreeDistance <= tolerance) {
//               existRepeat = true
//             }
//           }
//           /*
//            *  如果存在重复节点, 那么需要增加一个模板节点, 这个模板节点是没有被压缩的
//            *  将这个模板节点的isCompact属性复制为 false
//            *  如果不存在重复节点, 那么不需要添加模板节点, 而把 **这个节点** 的isCompact属性赋值为 false
//            */
//           if (existRepeat) {
//             var addedObject = clone(tree.children[i])
//             addIsCompactToNodes(false, addedObject)
//             addedObject.name = 'template-' + Math.round(Math.random() * 10000)
//             addCompactAttr(addedObject, TEMPLATE)
//             tree.children.splice(i, 0, addedObject)
//             tree.children[i].isCompact = false
//           } else {
//             tree.children[i].isCompact = false
//           }
//           existRepeat = false
//           //  再次遍历树的孩子节点, 对于孩子节点中重复的节点进行压缩, 具体是将children赋值为null
//           //  children的值存储在_children属性中记录, 同时这个节点以及其子节点的isCompact属性赋值为true
//           for (var j2 = (i + 1); j2 < tree.children.length; j2++) {
//             var twoTreeDistance = treeDistance(tree.children[i], tree.children[j2], selectedLevels)
//             if (twoTreeDistance <= tolerance) {
//               // if (typeof (tree.children[ j2 ].children) !== 'undefined') {
//               addIsCompactToNodes(true, tree.children[j2])
//               addCompactAttr(tree.children[j2], ABSOLUTE_COMPACT_CHILDREN)
//               tree.children[j2].compactAttr = ABSOLUTE_COMPACT_FATHER
//               modifyChildren2_Children(tree.children[j2])
//             } else {
//               break
//             }
//           }
//         }
//       }
//     }
//     //  递归的调用这个函数, 对于子树压缩, 添加模板节点, 并且增加是否收缩的属性
//     for (var k = 0; k < tree.children.length; k++) {
//       if ((tree.children[k].compactAttr !== ABSOLUTE_COMPACT_FATHER) && (tree.children[k].compactAttr !== TEMPLATE)) {
//         compactDepthTreeAddTemplateTree(tree.children[k], compactDepth, tolerance, selectedLevels)
//       }
//     }
//   }
//   return tree
// }
/**
 * 只是压缩相邻的相同具有相同结构的子树
 * @param tree
 * @param compactDepth
 * @param tolerance
 */
// function compactDepthTreeAddTemplateTree(tree, compactDepth, tolerance, selectedLevels) {
//   //  在树的叶节点中的children属性才为undefined, 被压缩节点的children属性为null
//   if ((typeof (tree.children) !== 'undefined') && (tree.children !== null)) {
//     if (tree.depth >= compactDepth) {
//       for (var i = 0; i < tree.children.length; i++) {
//         //  遍历树中的所有孩子节点, 将其中的重复的节点进行压缩
//         if (((typeof(tree.children[i]) !== 'undefined')) && (tree.children[i] !== null) && (tree.children[i].compactAttr !== ABSOLUTE_COMPACT_FATHER)) { //  对于已经被压缩过的节点不再以此节点为基准进行压缩
//           //  先判断以某一个节点为基准, 该节点是否存在重复节点
//           var existRepeat = false
//           if ((i + 1) < tree.children.length) {
//             var twoTreeDistance = treeDistance(tree.children[i], tree.children[i + 1], selectedLevels)
//             if (twoTreeDistance <= tolerance) {
//               existRepeat = true
//             }
//           }
//           /*
//            *  如果存在重复节点, 那么需要增加一个模板节点, 这个模板节点是没有被压缩的
//            *  将这个模板节点的isCompact属性复制为 false
//            *  如果不存在重复节点, 那么不需要添加模板节点, 而把 **这个节点** 的isCompact属性赋值为 false
//            */
//           if (existRepeat) {
//             var addedObject = clone(tree.children[i])
//             addIsCompactToNodes(false, addedObject)
//             addedObject.name = 'template-' + Math.round(Math.random() * 10000)
//             addCompactAttr(addedObject, TEMPLATE)
//             tree.children.splice(i, 0, addedObject)
//             tree.children[i].isCompact = false
//           } else {
//             tree.children[i].isCompact = false
//           }
//           existRepeat = false
//           //  再次遍历树的孩子节点, 对于孩子节点中重复的节点进行压缩, 具体是将children赋值为null
//           //  children的值存储在_children属性中记录, 同时这个节点以及其子节点的isCompact属性赋值为true
//           for (var j2 = (i + 1); j2 < tree.children.length; j2++) {
//             var twoTreeDistance = treeDistance(tree.children[i], tree.children[j2], selectedLevels)
//             if (twoTreeDistance <= tolerance) {
//               // if (typeof (tree.children[ j2 ].children) !== 'undefined') {
//               addIsCompactToNodes(true, tree.children[j2])
//               addCompactAttr(tree.children[j2], ABSOLUTE_COMPACT_CHILDREN)
//               tree.children[j2].compactAttr = ABSOLUTE_COMPACT_FATHER
//               modifyChildren2_Children(tree.children[j2])
//             } else {
//               break
//             }
//           }
//         }
//       }
//     }
//     //  递归的调用这个函数, 对于子树压缩, 添加模板节点, 并且增加是否收缩的属性
//     for (var k = 0; k < tree.children.length; k++) {
//       if ((tree.children[k].compactAttr !== ABSOLUTE_COMPACT_FATHER) && (tree.children[k].compactAttr !== TEMPLATE)) {
//         compactDepthTreeAddTemplateTree(tree.children[k], compactDepth, tolerance, selectedLevels)
//       }
//     }
//   }
//   return
// }

/**
 * @param treeNode
 * 将节点下面的children复制到_children属性中
 */
function modifyChildren2_Children(treeNode) {
  treeNode._children = treeNode.children
  treeNode.children = null
}
//  将节点下面的_children复制到children属性中
function modify_Children2Children(treeNode) {
  treeNode.children = treeNode._children
  treeNode._children = null
}
//  向树的节点中增加是否压缩的属性,描述节点是否完全被压缩
function addCompactAttr(tree, absoluteCompactChildren) {
  function innerAddCompactAttr(tree, absoluteCompactChildren) {
    tree.compactAttr = absoluteCompactChildren
    if ((typeof (tree.children) !== 'undefined') && (tree.children !== null)) {
      for (var i = 0; i < tree.children.length; i++) {
        innerAddCompactAttr(tree.children[i], absoluteCompactChildren)
      }
    }
  }

  innerAddCompactAttr(tree, absoluteCompactChildren)
}
/**
 * 向子树的每个节点中增加是否被压缩的属性
 * @param isCompact: 是否被压缩, 布尔型
 * @param nodes: 节点对象
 */
function addIsCompactToNodes(isCompact, nodes) {
  nodes.isCompact = isCompact
  if ((typeof (nodes.children) !== 'undefined') && (nodes.children != null)) {
    for (var i = 0; i < nodes.children.length; i++) {
      addIsCompactToNodes(isCompact, nodes.children[i])
    }
  }
}
/**
 * @param rootA
 * @param rootB
 * @param tolerance
 * @returns {boolean}
 */
function treeDistance(rootA, rootB, selectedLevels) {
  var insert
  var remove
  var update
  insert = remove = function (node) {
    var depth = node.depth
    //  如果这个层级的节点不包括在整个节点数组内, 则操作消耗为0
    if (selectedLevels.indexOf(depth) === -1) {
      return 0
    }
    return 1
  }
  update = function (nodeA, nodeB) {
    return 0
  }

  var children = function (node) {
    return node.children
  }
  // Compute edit distance, mapping, and alignment.
  var ted = ed.ted(rootA, rootB, children, insert, remove, update)
  return ted.distance
}
/**
 * 对于对象形式的树的孩子节点label大小进行排序
 * @param tree: 对象形式的树
 */
function sortChildren(tree) {
  innerSortChildren(tree)
  function innerSortChildren(tree) {
    if (tree != null) {
      if (typeof (tree.children) !== 'undefined') {
        tree.children.sort(function (a, b) {
          var aName = a.name
          var bName = b.name
          return a_minus_b(aName, bName)
        })
        for (var i = 0; i < tree.children.length; i++) {
          innerSortChildren(tree.children[i])
        }
      }
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
}
/**
 * 向树中增加节点的深度信息, 增加depth属性, 表示的是树中节点的深度
 */
function addSubtreeDepth(treeObj, initDepth) {
  innerAddSubtreeDepth(treeObj, initDepth)
  function innerAddSubtreeDepth(treeObj, initDepth) {
    treeObj.depth = initDepth
    var treeChildren = treeObj.children
    if (typeof (treeChildren) !== 'undefined') {
      for (var cI = 0; cI < treeChildren.length; cI++) {
        var childrenObj = treeChildren[cI]
        innerAddSubtreeDepth(childrenObj, initDepth + 1)
      }
    }
  }
}
exports.interactTwoTreeObj = interactTwoTreeObj
exports.complementTwoTreeObj = complementTwoTreeObj
exports.mergeTwoTreeObj = mergeTwoTreeObj

exports.loadCompactSingleData = loadCompactSingleData
exports.getSuperTreeNodes = getSuperTreeNodes
exports.getSuperTreeNodeFromTreeObjArray = getSuperTreeNodeFromTreeObjArray
exports.getTreeObjectIdArray = getTreeObjectIdArray
exports.buildUnionTree = buildUnionTree
exports.buildMaxTree = buildMaxTree

exports.add_node_num = _add_node_num
exports.addSubtreeDepth = addSubtreeDepth
exports.sortChildren = sortChildren
exports.treeLinearization = treeLinearization
exports.computeOriginalNodeLocation = computeOriginalNodeLocation
exports.compute_max_subtree_width = compute_max_subtree_width

exports.transform_original_obj_compact_obj = transform_original_obj_compact_obj
exports.compact_tree_linearization = compactTreeLinearization
exports.compute_compact_node_location = computeCompactNodeLocation