//Worker: 各种处理程序，负责直接包装响应
//注意文件路径以最顶级的index.js为准
var fileType = {
  'json': 'application/json',
  'js': 'text/plain',
  'tpl': 'text/plain',
  'css': 'text/css',
  'less': 'text/plain',
  'png': 'image/png',
  'ico': 'image/ico',
  'html': 'text/html',
  'csv': 'text/comma-separated-values',
  'woff': 'application/x-font-woff',
  'woff2': 'application/x-font-woff',
  'ttf': 'application/octet-stream',
  'bmp': 'application/x-MS-bmp',
  'svg': 'image/svg-xml',
  'map': 'text/plain',
  'ico': 'image/vnd.microsoft.icon',
  'pdf': 'application/pdf'
}

var superTreeObj = {}
var clone = require('clone')
var fs = require('fs')
var existedFileObj = {}
var categoryObj = null
var categoryIndexObj = null
//  dataSetName是在所有的方法中通用的一个变量
var dataSetName = null

function initialize (root, dataProcessor, v_logger, fs) {
  var resOpt = {
    root: root
  }
  var logger = v_logger

  function initCategoryObj () {
    if (dataSetName != null) {
      categoryObj = require('../data/' + dataSetName + '/categoryName.json')
      var categoryNodeArray = linearize(categoryObj)
      categoryIndexObj = {}
      for (var cI = 0; cI < categoryNodeArray.length; cI++) {
        categoryIndexObj[ categoryNodeArray[ cI ][ 0 ] ] = categoryNodeArray[ cI ][ 1 ]
      }
    }
    return categoryIndexObj
    function linearize (categoryObj) {
      var categoryNodeArray = []
      var depth = 0
      innerLinearize(categoryObj, categoryNodeArray, depth)
      return categoryNodeArray
      function innerLinearize (categoryObj, categoryNodeArray, depth) {
        var nodeCategory = null
        var nodeCategoryName = null
        if (categoryObj.category !== 'root') {
          nodeCategory = categoryObj.category.substring(0, 3) + '-' + depth
          nodeCategoryName = categoryObj.category.substring(4, categoryObj.category.length)
        } else {
          nodeCategory = 'root-' + depth
          nodeCategoryName = 'root'
        }
        var singleCategoryNode = [ nodeCategory, nodeCategoryName ]
        categoryNodeArray.push(singleCategoryNode)
        if (typeof(categoryObj.children) !== 'undefined') {
          depth = depth + 1
          for (var cI = 0; cI < categoryObj.children.length; cI++) {
            innerLinearize(categoryObj.children[ cI ], categoryNodeArray, depth)
          }
        }
      }
    }
  }

  function addCategoryName (treeNodeArrayObj) {
    if (categoryIndexObj == null) {
      categoryIndexObj = initCategoryObj()
    }
    for (var item in treeNodeArrayObj) {
      var treeNodeArray = treeNodeArrayObj[ item ]
      for (var tI = 0; tI < treeNodeArray.length; tI++) {
        var treeNodeIndex = treeNodeArray[ tI ].category + '-' + treeNodeArray[ tI ].depth
        var categoryName = categoryIndexObj[ treeNodeIndex ]
        treeNodeArray[ tI ].categoryName = categoryName
      }
    }
    return treeNodeArrayObj
  }

  function handleStart (path, response, next) {
    // logger.log("    Handler: Start!");
    response.status(200).type('html').sendFile('/client' + path + '/index.html', resOpt,
      function (err) {
        if (err) {
          logger.log(err)
          response.status(err.status).end()
        }
        next()
      })
  }

  function handleFile (path, response, next) {
    if (typeof handle[ path ] === 'function') {
      next()
      return
    }
    // logger.log("    Handler: File!");
    var t_index = path.lastIndexOf('.') + 1
    var t_path = path.slice(t_index)
    var tt_path = '/client' + path
    // logger.log("                                                 " + tt_path)
    response.status(200).type(fileType[ t_path ]).sendFile(tt_path.slice(1), resOpt,
      function (err) {
        if (err) {
          logger.log(err)
          response.status(err.status).end()
        }
        next()
      })
  }

  function handleQuery (request, response) {
    logger.log("    Handler: Query!");
    var t_record = request.url.replace("/query?name=", "");
    var responseFunc = function (v_result) {
      if (!v_result) {
        logger.log("    Handler: Query Failed!");
        response.sendStatus(404);
      } else {
        logger.log("    Handler: Query Success! The result is " + v_result);
        response.status(200).jsonp(v_result);
      }
    };
    db.query(t_record, responseFunc);
  }

  function handle404 (path, response, next) {
    logger.log('    Handler: File not found for ' + path)
    response.sendStatus(404)
    next()
  }

  function handleFileName (request, response) {
    var sampleDataName = request.body.DataSetName
    dataSetName = sampleDataName
    var fileNameJson = clone(require('../data/' + sampleDataName + '/filesName.json'))
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.send(JSON.stringify(fileNameJson, null, 3))
  }

  /**
   * 传递树的id数组, 以及dataSetName, barcodeHeight, barcodeWidth等信息, 返回树的节点数组
   * 点击histogram上面的每一个柱状图时, 调用这个方法, 读取原始的数据进行显示
   */
  function handleOriginalData (request, response) {
    //  读取传递的的数据
    var reqBody = request.body
    var dataSetName = reqBody.dataSetName
    var dataItemNameArray = reqBody[ 'dataItemNameArray' ]
    var dataItemType = typeof(dataItemNameArray)
    var selectedLevels = reqBody[ 'selectedLevels' ]
    var barcodeWidthArray = reqBody[ 'barcodeWidthArray' ]
    var barcodeHeight = reqBody[ 'barcodeHeight' ]
    var compactNum = reqBody[ 'compactNum' ]
    var maxDepth = reqBody[ 'maxDepth' ]
    //  将barcodeWidth的数组内部的元素转换为数字
    for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
      barcodeWidthArray[ bI ] = +barcodeWidthArray[ bI ]
    }
    var selectedLevelStr = ''
    //  将selectedLevels的数组内部的元素转换为数字
    if (typeof(selectedLevels) === 'undefined') {
      selectedLevels = []
    }
    for (var sI = 0; sI < selectedLevels.length; sI++) {
      selectedLevels[ sI ] = +selectedLevels[ sI ]
      selectedLevelStr = selectedLevelStr + selectedLevels[ sI ]
    }
    //  现在传递的barcodeWidthArray是将所有层级的节点的宽度都进行了赋值, 但是对于某一些层级的节点应该是0
    //  这样才能保证barcode的节点之间是紧密排布的, 所以需要将在barcodeWidthArray中不存在的层级的宽度赋值为0
    // for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
    //   if (selectedLevels.indexOf(bI) === -1) {
    //     barcodeWidthArray[ bI ] = 0
    //   }
    // }
    var treeNodeArrayObj = innerHandleOriginalTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight)
    innerHandleCompactTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth)
    sendTreeNodeArray(treeNodeArrayObj)

    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray (treeNodeArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = { 'treeNodeObject': treeNodeArray }
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  function innerHandleOriginalTreeNodeObj (dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight) {
    var treeNodeArrayObj = null
    if (dataItemType === 'string') {
      treeNodeArrayObj = readTreeNodeObj([ dataItemNameArray ], selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight)
    } else if (dataItemType === 'object') {
      treeNodeArrayObj = readTreeNodeObj(dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight)
    }
    addCategoryName(treeNodeArrayObj)
    return treeNodeArrayObj
  }

  /**
   *  处理BarcodeTree压缩形式
   */
  function handleCompactData (request, response) {
    var reqBody = request.body
    var dataSetName = reqBody.dataSetName
    var dataItemNameArray = reqBody[ 'dataItemNameArray' ]
    var dataItemType = typeof(dataItemNameArray)
    var selectedLevels = reqBody[ 'selectedLevels' ]
    var barcodeWidthArray = reqBody[ 'barcodeWidthArray' ]
    var barcodeHeight = reqBody[ 'barcodeHeight' ]
    var compactNum = reqBody[ 'compactNum' ]
    var maxDepth = reqBody[ 'maxDepth' ]
    //  将barcodeWidth的数组内部的元素转换为数字
    for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
      barcodeWidthArray[ bI ] = +barcodeWidthArray[ bI ]
    }
    var selectedLevelStr = ''
    //  将selectedLevels的数组内部的元素转换为数字
    if (typeof(selectedLevels) === 'undefined') {
      selectedLevels = []
    }
    for (var sI = 0; sI < selectedLevels.length; sI++) {
      selectedLevels[ sI ] = +selectedLevels[ sI ]
      selectedLevelStr = selectedLevelStr + selectedLevels[ sI ]
    }
    var compactTreeNodeArrayObj = innerHandleCompactTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth)
    innerHandleOriginalTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight)
    sendTreeNodeArray(compactTreeNodeArrayObj)

    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray (treeNodeArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = { 'treeNodeObject': treeNodeArray }
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  function innerHandleCompactTreeNodeObj (dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth) {
    var treeNodeArrayObj = null
    if (dataItemType === 'string') {
      treeNodeArrayObj = readCompactTreeNodeObj([ dataItemNameArray ], selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth)
    } else if (dataItemType === 'object') {
      treeNodeArrayObj = readCompactTreeNodeObj(dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth)
    }
    addCompactCategoryName(treeNodeArrayObj)
    return treeNodeArrayObj
  }

  /**
   *
   */
  function addCompactCategoryName (treeNodeArrayObj) {
    for (var item in treeNodeArrayObj) {
      if (item !== 'treeNodeObj') {
        addCategoryName(treeNodeArrayObj[ item ])
      }
    }
  }

  /**
   * 1. 从文件中读取tree object对象
   * 2. 将treeObject对象进行线性化转换成treeNodeArray数组
   */
  function readTreeNodeObj (fileNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight) {
    var treeNodeArrayObj = {}
    var fileName = null
    var filePath = '../data/' + dataSetName + '/originalData/'
    for (var fI = 0; fI < fileNameArray.length; fI++) {
      var dataItemName = fileNameArray[ fI ]
      var dataItemNameWithOptions = dataItemName + selectedLevelStr
      fileName = dataItemName + '.json'
      if (typeof (existedFileObj[ dataItemNameWithOptions ]) === 'undefined') {
        existedFileObj[ dataItemNameWithOptions ] = {}
        var originalTreeObj = clone(require(filePath + fileName))
        existedFileObj[ dataItemNameWithOptions ][ 'originalTreeObj' ] = originalTreeObj
        var treeNodeArray = dataProcessor.loadOriginalSingleData(originalTreeObj, barcodeWidthArray, existedFileObj[ dataItemNameWithOptions ], selectedLevels, barcodeHeight)
        treeNodeArrayObj[ dataItemName ] = treeNodeArray
      } else {
        var fileObjData = existedFileObj[ dataItemNameWithOptions ]
        var treeNodeArray = fileObjData[ 'treeNodeLocArray' ]
        treeNodeArrayObj[ dataItemName ] = treeNodeArray
      }
    }
    return treeNodeArrayObj
  }

  /**
   * 1. 从文件中读取tree object对象
   * 2. 将treeObject对象进行线性化转换成treeNodeArray数组
   */
  function readCompactTreeNodeObj (fileNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth) {
    var treeNodeArrayObj = {}
    var fileName = null
    var compactSelectedLevelStr = 'compact-' + selectedLevelStr
    var filePath = '../data/' + dataSetName + '/originalData/'
    for (var fI = 0; fI < fileNameArray.length; fI++) {
      var dataItemName = fileNameArray[ fI ]
      var dataItemNameWithOptions = dataItemName + compactSelectedLevelStr
      fileName = dataItemName + '.json'
      if (typeof (existedFileObj[ dataItemNameWithOptions ]) === 'undefined') {
        existedFileObj[ dataItemNameWithOptions ] = {}
        var originalTreeObj = clone(require(filePath + fileName))
        existedFileObj[ dataItemNameWithOptions ][ 'originalTreeObj' ] = originalTreeObj
        dataProcessor.loadCompactSingleData(originalTreeObj, barcodeWidthArray, existedFileObj[ dataItemNameWithOptions ], selectedLevels, barcodeHeight, compactNum, maxDepth)
        treeNodeArrayObj[ dataItemName ] = getTreeNodeArrayObj(existedFileObj[ dataItemNameWithOptions ])
      } else {
        treeNodeArrayObj[ dataItemName ] = getTreeNodeArrayObj(existedFileObj[ dataItemNameWithOptions ])
      }
    }
    return treeNodeArrayObj
    /**
     * 返回treeNodeArrayObj只是保留compactTreeNodeLocArray
     * @param existedFileObj
     * {
     *  originalTreeObj: { num: 106, name: 'root', children: [Object], depth: 0 },
     *  'compact-level-3': { compactTreeNodeArray: [Object],
     *   compactTreeNodeObj: [Object],
     *   compactTreeNodeLocArray: [Object] } }
     * }
     * @returns {{}}
     */
    function getTreeNodeArrayObj (existedFileObj) {
      var treeNodeArrayObj = {}
      for (var item in existedFileObj) {
        if ((item !== 'originalTreeObj') && (item !== 'treeNodeObj')) {
          treeNodeArrayObj[ item ] = existedFileObj[ item ].compactTreeNodeLocArray
        }
      }
      return treeNodeArrayObj
    }
  }

  /**
   * 根据传入的rootId构建unionTree
   * @param request
   * @param response
   */
  function handleBuildSuperTree (request, response) {
    var reqBody = request.body
    var dataItemNameArray = reqBody[ 'dataItemNameArray' ]
    var dataItemType = typeof(dataItemNameArray)
    var dataSetName = reqBody.dataSetName
    var selectedLevels = reqBody[ 'selectedLevels' ]
    var barcodeWidthArray = reqBody[ 'barcodeWidthArray' ]
    var barcodeHeight = reqBody[ 'barcodeHeight' ]
    var rootId = reqBody.rootId
    var rootLevel = reqBody.rootLevel
    var alignedLevel = reqBody.alignedLevel
    var displayMode = reqBody.displayMode
    var compactNum = reqBody.compactNum
    //  将barcodeWidth的数组内部的元素转换为数字
    for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
      barcodeWidthArray[ bI ] = +barcodeWidthArray[ bI ]
    }
    var selectedLevelStr = ''
    //  将selectedLevels的数组内部的元素转换为数字
    if (typeof(selectedLevels) === 'undefined') {
      selectedLevels = []
    }
    for (var sI = 0; sI < selectedLevels.length; sI++) {
      selectedLevels[ sI ] = +selectedLevels[ sI ]
      selectedLevelStr = selectedLevelStr + selectedLevels[ sI ]
    }
    var original_compact_superTreeNodeObj = null
    if (dataItemType === 'string') {
      original_compact_superTreeNodeObj = dataProcessor.getSuperTreeNodes([ dataItemNameArray ], existedFileObj, selectedLevelStr, barcodeWidthArray, barcodeHeight, selectedLevels, rootId, rootLevel, alignedLevel, compactNum)
    } else if (dataItemType === 'object') {
      original_compact_superTreeNodeObj = dataProcessor.getSuperTreeNodes(dataItemNameArray, existedFileObj, selectedLevelStr, barcodeWidthArray, barcodeHeight, selectedLevels, rootId, rootLevel, alignedLevel, compactNum)
    }
    if (original_compact_superTreeNodeObj != null) {
      var originalSuperTreeNodeObj = original_compact_superTreeNodeObj[ 'originalSuperTreeObj' ]
      var compactSuperTreeObj = original_compact_superTreeNodeObj[ 'compactSuperTreeObj' ]
      addCategoryName(compactSuperTreeObj)
      addCategoryName(originalSuperTreeNodeObj)
      sendTreeNodeArray(original_compact_superTreeNodeObj)
    } else {
      var nullObj = {}
      sendTreeNodeArray(nullObj)
    }
    /**
     * 1. 从文件中读取tree object对象
     * 2. 将treeObject对象进行线性化转换成treeNodeArray数组
     function getSuperTreeNodeObj (fileNameArray, selectedLevelStr, rootId) {
      var treeNodeArrayObj = {}
      var fileName = null
      var filePath = '../data/' + dataSetName + '/originalData/'
      var superTreeNodeArray = dataProcessor.getSuperTreeNodes(fileNameArray, existedFileObj, barcodeWidthArray, selectedLevels, rootId)

      for (var fI = 0; fI < fileNameArray.length; fI++) {
        var dataItemName = fileNameArray[ fI ]
        var dataItemNameWithOptions = dataItemName + selectedLevelStr
        fileName = dataItemName + '.json'
        treeNodeArrayObj[ dataItemName ] = treeNodeArray
        if (typeof (existedFileObj[ dataItemNameWithOptions ]) === 'undefined') {
          existedFileObj[ dataItemNameWithOptions ] = {}
          var originalTreeObj = clone(require(filePath + fileName))
          existedFileObj[ dataItemNameWithOptions ][ 'originalTreeObj' ] = originalTreeObj
          var treeNodeArray = dataProcessor.loadOriginalSingleData(originalTreeObj, barcodeWidthArray, existedFileObj[ dataItemNameWithOptions ], selectedLevels)
          treeNodeArrayObj[ dataItemName ] = treeNodeArray
        } else {
          var fileObjData = existedFileObj[ dataItemNameWithOptions ]
          var treeNodeArray = fileObjData[ 'treeNodeLocArray' ]
          treeNodeArrayObj[ dataItemName ] = treeNodeArray
        }
      }
      return treeNodeArrayObj
    }
     */
    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray (treeNodeArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = { 'treeNodeObject': treeNodeArray }
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  function handleTreeObjToNodeList (request, response) {
    var reqBody = request.body
    var treeObjArray = reqBody[ "treeObjArray" ]
    var rootId = reqBody.rootId
    var rootLevel = reqBody.rootLevel
    var alignedLevel = reqBody.alignedLevel
    var treeNodeArrayObj = {}
    var barcodeWidthArray = reqBody[ 'barcodeWidthArray' ]
    var barcodeHeight = reqBody[ 'barcodeHeight' ]
    //  将barcodeWidth的数组内部的元素转换为数字
    for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
      barcodeWidthArray[ bI ] = +barcodeWidthArray[ bI ]
    }
    var selectedLevels = reqBody[ 'selectedLevels' ]
    for (var sI = 0; sI < selectedLevels.length; sI++) {
      selectedLevels[ sI ] = +selectedLevels[ sI ]
    }
    var superTreeNodeArray = dataProcessor.getSuperTreeNodeFromTreeObjArray(treeObjArray, barcodeWidthArray, barcodeHeight, selectedLevels, rootId, rootLevel, alignedLevel)
    addCategoryName(superTreeNodeArray)
    sendTreeNodeArray(superTreeNodeArray)

    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray (treeNodeArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = { 'treeNodeObject': treeNodeArray }
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  function handleTreeNodeIdArray (request, response) {
    var reqBody = request.body
    var treeObjArray = reqBody[ 'treeObjArray' ]
    var treeObjectIdArray = dataProcessor.getTreeObjectIdArray(treeObjArray)
    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray (treeObjectIdArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = { 'treeObjectIdArray': treeObjectIdArray }
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  function handleCategoryName (request, response) {
    var reqBody = request.body
    var sampleDataName = reqBody.DataSetName
    var filePath = '../data/' + sampleDataName + '/categoryName.json'
    var categoryObj = clone(require(filePath))
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.send(JSON.stringify(categoryObj, null, 3))
  }

  var handle = {}
  handle[ '/' ] = handleStart
  handle[ '/start' ] = handleStart
  handle[ '404' ] = handle404
  handle[ 'file' ] = handleFile
  handle[ 'query' ] = handleQuery
  handle[ '/file_name' ] = handleFileName
  handle[ '/barcode_original_data' ] = handleOriginalData
  handle[ '/barcode_compact_data' ] = handleCompactData
  handle[ '/build_super_tree' ] = handleBuildSuperTree
  handle[ '/treeobject_to_nodelist' ] = handleTreeObjToNodeList
  // handle[ '/treeNodeIdArray' ] = handleTreeNodeIdArray
  // handle[ '/barcode_compact_data' ] = handleBarcodeCompactData
  // handle[ '/distance_matrix' ] = handleDistanceMatrix
  // handle[ '/load_data' ] = handleLoadData
  handle[ '/category_name' ] = handleCategoryName
  // handle[ '/brush_super_tree' ] = handleBrushSuperTree
  // handle[ '/brush_line_tree' ] = handleBrushLineTree
  return handle
}

exports.initialize = initialize