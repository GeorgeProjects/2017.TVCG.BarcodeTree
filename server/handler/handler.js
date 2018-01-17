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
var categoryNodeArray = null
var categoryNodeObjArray = null
var categoryIndexObj = null
//  dataSetName是在所有的方法中通用的一个变量
var dataSetName = null
var PER_GAP_WIDTH = 4

function initialize(root, dataProcessor, handlerObj, v_logger, fs) {
  var resOpt = {
    root: root
  }
  var logger = v_logger

  function preprocess() {
    var filePath = './server/data/DailyRecordTree/originalData/'
    fs.readdir(filePath, function (err, files) {
      if (err) {
        console.log('err', err)
      }
      files.forEach(function (f) {
        if (f !== '.DS_Store') {
          var originalTreeObj = require('../data/DailyRecordTree/originalData/' + f)
          var originalTreeObj1 = addCategoryNameToObj(originalTreeObj)
          fs.writeFile(('./server/data/DailyRecordTree/originalData1/' + f), JSON.stringify(originalTreeObj1), 'utf8', function (err) {
            console.log('err', err)
          });
        }
      });
    })
  }

  function addCategoryNameToObj(originalTreeObj) {
    var categoryObj = initCategoryObj('DailyRecordTree')
    var depth = 0
    var originalTreeObj = JSON.parse(JSON.stringify(originalTreeObj))
    innerAddCategoryNameToObj(categoryObj, originalTreeObj, depth)
    return originalTreeObj
    function innerAddCategoryNameToObj(categoryObj, originalTreeObj, depth) {
      if (originalTreeObj.name === 'root') {
        originalTreeObj.categoryName = categoryObj['root-0']
      } else {
        var name = originalTreeObj.name
        if (name.length === 1) {
          name = name + '00'
        } else if (name.length === 2) {
          name = name + '0'
        }
        if (typeof (categoryObj[name + '-' + depth]) !== 'undefined') {
          originalTreeObj.name = name
          originalTreeObj.categoryName = categoryObj[name + '-' + depth]
        }
      }
      if (depth === 3) {
        delete originalTreeObj.children
      }
      if (typeof (originalTreeObj.children) !== 'undefined') {
        for (var oI = 0; oI < originalTreeObj.children.length; oI++) {
          innerAddCategoryNameToObj(categoryObj, originalTreeObj.children[oI], depth + 1)
        }
      }
    }
  }

  function initCategoryObj(dataSetName) {
    if (dataSetName != null) {
      categoryObj = require('../data/' + dataSetName + '/categoryName.json')
      categoryNodeArray = linearize(categoryObj)
      categoryIndexObj = {}
      for (var cI = 0; cI < categoryNodeArray.length; cI++) {
        categoryIndexObj[categoryNodeArray[cI][0]] = categoryNodeArray[cI][1]
      }
    }
    return categoryIndexObj

    function linearize(categoryObj) {
      var categoryNodeArray = []
      var depth = 0
      innerLinearize(categoryObj, categoryNodeArray, depth)
      return categoryNodeArray
      function innerLinearize(categoryObj, categoryNodeArray, depth) {
        var nodeCategory = null
        var nodeCategoryName = null
        if (categoryObj.category !== 'root') {
          nodeCategory = categoryObj.category.substring(0, 3) + '-' + depth
          nodeCategoryName = categoryObj.category.substring(4, categoryObj.category.length)
        } else {
          nodeCategory = 'root-' + depth
          nodeCategoryName = 'root'
        }
        var singleCategoryNode = [nodeCategory, nodeCategoryName]
        categoryNodeArray.push(singleCategoryNode)
        if (typeof(categoryObj.children) !== 'undefined') {
          depth = depth + 1
          for (var cI = 0; cI < categoryObj.children.length; cI++) {
            innerLinearize(categoryObj.children[cI], categoryNodeArray, depth)
          }
        }
      }
    }
  }

  function addCategoryName(treeNodeArrayObj, dataSetName) {
    if (categoryIndexObj == null) {
      categoryIndexObj = initCategoryObj(dataSetName)
    }
    for (var item in treeNodeArrayObj) {
      var treeNodeArray = treeNodeArrayObj[item]
      addCategoryToTreeNodeArray(treeNodeArray, categoryIndexObj)
    }
    return treeNodeArrayObj
  }

  //  向一个数组中的对象中增加categoryName的属性
  function addCategoryToTreeNodeArray(treeNodeArray, categoryIndexObj) {
    for (var tI = 0; tI < treeNodeArray.length; tI++) {
      var treeNodeIndex = treeNodeArray[tI].category + '-' + treeNodeArray[tI].depth
      var categoryName = categoryIndexObj[treeNodeIndex]
      treeNodeArray[tI].categoryName = categoryName
    }
  }

  function handleStart(path, response, next) {
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

  function handleFile(path, response, next) {
    if (typeof handle[path] === 'function') {
      next()
      return
    }
    // logger.log("    Handler: File!");
    var t_index = path.lastIndexOf('.') + 1
    var t_path = path.slice(t_index)
    var tt_path = '/client' + path
    // logger.log("                                                 " + tt_path)
    response.status(200).type(fileType[t_path]).sendFile(tt_path.slice(1), resOpt,
      function (err) {
        if (err) {
          logger.log(err)
          response.status(err.status).end()
        }
        next()
      })
  }

  function handleQuery(request, response) {
    logger.log("    Handler: Query!");
    var t_record = request.url.replace("/query?name=", "");
    var responseFunc = function (v_result) {
      if (!v_result) {
        logger.log("    Handler: Query Failed!");
        response.sendStatus(404);
      } else {
        logger.log("    Handler: Query Success! The result is " + v_result)
        response.status(200).jsonp(v_result);
      }
    };
    db.query(t_record, responseFunc);
  }

  function handle404(path, response, next) {
    logger.log('    Handler: File not found for ' + path)
    response.sendStatus(404)
    next()
  }

  function handleFileName(request, response) {
    var sampleDataName = request.body.DataSetName
    dataSetName = sampleDataName
    var fileNameJson = clone(require('../data/' + sampleDataName + '/filesName.json'))

    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.send(JSON.stringify(fileNameJson, null, 3))
  }

  /**
   * 传递要计算并集的树的id数组, 以及dataSetName, barcodeHeight, barcodeWidth等信息, 返回树的节点数组
   */
  function handleAndOperationData(request, response) {
    var reqBody = request.body
    var dataSetName = reqBody.dataSetName
    var dataItemNameArray = reqBody['dataItemNameArray']
    var dataItemType = typeof(dataItemNameArray)
    var selectedLevels = reqBody['selectedLevels']
    var barcodeWidthArray = reqBody['barcodeWidthArray']
    var barcodeHeight = reqBody['barcodeHeight']
    var compactNum = reqBody['compactNum']
    var maxDepth = reqBody['maxDepth']
    var groupId = reqBody['groupId']
    var barcodeNodeInterval = +reqBody['barcodeNodeInterval']
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
    var superTreeObj = get_super_tree_obj(dataItemNameArray, dataSetName)
    var superTreeNodeArray = innerHandleAndOperationTreeNodeObj(groupId, superTreeObj, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval)
    var compactTreeNodeArrayObj = innerHandleAndOperationCompactTreeNodeObj(groupId, superTreeObj, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval, dataSetName)
    var categoryNodeObjWithLocArray = linearize2NodeArray(categoryObj, barcodeWidthArray, barcodeHeight, barcodeNodeInterval)
    sendTreeNodeArray(superTreeNodeArray, compactTreeNodeArrayObj, categoryNodeObjWithLocArray)
    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray(treeNodeArray, compactTreeNodeArrayObj, categoryNodeObjWithLocArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = {
        'barcodeNodeAttrArray': treeNodeArray,
        'compactTreeNodeArrayObj': compactTreeNodeArrayObj,
        'categoryNodeObjArray': categoryNodeObjWithLocArray
      }
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  /**
   *  计算superTree
   */
  function get_super_tree_obj(dataItemNameArray, dataSetName) {
    var dataItemType = typeof(dataItemNameArray)
    if (dataItemType === 'string') {
      dataItemNameArray = [dataItemNameArray]
    }
    var superTreeObj = null
    var filePath = '../data/' + dataSetName + '/originalData/'
    for (var fI = 0; fI < dataItemNameArray.length; fI++) {
      var dataItemName = dataItemNameArray[fI]
      var fileName = dataItemName + '.json'
      var originalTreeObj = clone(require(filePath + fileName))
      var cloneOriginalTreeObj = JSON.parse(JSON.stringify(originalTreeObj))
      superTreeObj = dataProcessor.mergeTwoTreeObj(superTreeObj, cloneOriginalTreeObj)
    }
    return superTreeObj
  }

  /**
   * 传递树的id数组, 以及dataSetName, barcodeHeight, barcodeWidth等信息, 返回树的节点数组
   * 点击histogram上面的每一个柱状图时, 调用这个方法, 读取原始的数据进行显示
   */

  /**
   * 计算交集的compact树的节点集合
   */
  function innerHandleAndOperationCompactTreeNodeObj(groupId, superTreeObj, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval, dataSetName) {
    var treeNodeArrayObj = readAndCompactTreeNodeObj(superTreeObj, groupId, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval)
    addCompactCategoryName(treeNodeArrayObj, dataSetName)
    return treeNodeArrayObj
  }

  /**
   * 计算交集的树的节点集合
   */
  function innerHandleAndOperationTreeNodeObj(groupId, superTreeObj, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval) {
    if (categoryIndexObj == null) {
      categoryIndexObj = initCategoryObj(dataSetName)
    }
    var superTreeNodeArray = readAndTreeNodeObj(superTreeObj, groupId, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval)
    addCategoryToTreeNodeArray(superTreeNodeArray, categoryIndexObj)
    return superTreeNodeArray
  }


  /**
   *
   */
  function innerHandleCompactTreeNodeObj(dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval) {
    var treeNodeArrayObj = readCompactTreeNodeObj(dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval)
    addCompactCategoryName(treeNodeArrayObj, dataSetName)
    return treeNodeArrayObj
  }

  //  将category对象转换为category的节点数组
  function linearize2NodeArray(categoryObj, barcodeWidthArray, barcodeHeight, barcodeNodeInterval) {
    var categoryNodeAttrArray = []
    var categoryNodeWithLocArray = []
    var depth = 0
    innerLinearize2NodeArray(categoryObj, categoryNodeAttrArray, depth)
    var xLoc = 0
    for (var cI = 0; cI < categoryNodeAttrArray.length; cI++) {
      var nodeCategory = categoryNodeAttrArray[cI][0]
      var nodeCategoryName = categoryNodeAttrArray[cI][1]
      var depth = categoryNodeAttrArray[cI][2]
      var nodeWidth = barcodeWidthArray[depth]
      var nodeItemObj = {
        'id': nodeCategory,
        'category': nodeCategory,
        'categoryName': nodeCategoryName,
        'depth': depth,
        'x': xLoc,
        'y': 0,
        'width': nodeWidth,
        'height': barcodeHeight,
        'existed': false
      }
      categoryNodeWithLocArray.push(nodeItemObj)
      xLoc = xLoc + nodeWidth + barcodeNodeInterval
    }
    return categoryNodeWithLocArray
    function innerLinearize2NodeArray(categoryObj, categoryNodeAttrArray, depth) {
      var nodeCategory = null
      var nodeCategoryName = null
      if (categoryObj.category !== 'root') {
        nodeCategory = 'node-' + depth + '-' + categoryObj.category.substring(0, 3)
        nodeCategoryName = categoryObj.category.substring(4, categoryObj.category.length)
      } else {
        nodeCategory = 'node-' + depth + '-root'
        nodeCategoryName = 'root'
      }
      var singleCategoryNodeName = [nodeCategory, nodeCategoryName, depth]
      categoryNodeAttrArray.push(singleCategoryNodeName)
      if (typeof(categoryObj.children) !== 'undefined') {
        depth = depth + 1
        for (var cI = 0; cI < categoryObj.children.length; cI++) {
          innerLinearize2NodeArray(categoryObj.children[cI], categoryNodeAttrArray, depth)
        }
      }
    }
  }

  /**
   *  处理BarcodeTree压缩形式
   */
  function handleCompactData(request, response) {
    var reqBody = request.body
    var dataSetName = reqBody.dataSetName
    var dataItemNameArray = reqBody['dataItemNameArray']
    var dataItemType = typeof(dataItemNameArray)
    var selectedLevels = reqBody['selectedLevels']
    var barcodeWidthArray = reqBody['barcodeWidthArray']
    var barcodeHeight = reqBody['barcodeHeight']
    var compactNum = reqBody['compactNum']
    var maxDepth = reqBody['maxDepth']
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
    var compactTreeNodeArrayObj = innerHandleCompactTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth)
    innerHandleOriginalTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight)
    var categoryNodeObjArray = linearize2NodeArray(categoryObj, barcodeWidthArray)
    sendTreeNodeArray(compactTreeNodeArrayObj, categoryNodeObjArray)

    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray(treeNodeArray, categoryNodeObjArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = {'treeNodeObject': treeNodeArray, 'categoryNodeObjArray': categoryNodeObjArray}
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  /**
   *
   */
  function addCompactCategoryName(treeNodeArrayObj, dataSetName) {
    for (var item in treeNodeArrayObj) {
      if (item !== 'treeNodeObj') {
        addCategoryName(treeNodeArrayObj[item], dataSetName)
      }
    }
  }

  /**
   * 1. 从文件中读取tree object对象
   * 2. 将treeObject对象进行线性化转换成treeNodeArray数组
   * 3. 对于数组中的treeObject计算并集
   */
  function readAndTreeNodeObj(superTreeObj, groupId, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, barcodeNodeInterval) {
    var dataItemNameWithOptions = groupId + selectedLevelStr
    existedFileObj[dataItemNameWithOptions] = {}
    existedFileObj[dataItemNameWithOptions]['originalTreeObj'] = superTreeObj
    var superTreeNodeArray = dataProcessor.loadOriginalSingleData(superTreeObj, barcodeWidthArray, existedFileObj[dataItemNameWithOptions], selectedLevels, barcodeHeight, barcodeNodeInterval)
    return superTreeNodeArray
  }

  /**
   * 1. 从文件中读取tree object对象 2. 将treeObject对象进行线性化转换成treeNodeArray数组
   */
  function readCompactTreeNodeObj(originalTreeObjObject, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval) {
    var treeNodeArrayObj = {}
    // for (var item in originalTreeObjObject) {
    //   var originalTreeObj = clone(originalTreeObjObject[item])
    //
    // }
    for (var fI = 0; fI < fileNameArray.length; fI++) {
      var dataItemName = fileNameArray[fI]
      var dataItemNameWithOptions = dataItemName + compactSelectedLevelStr
      var fileName = dataItemName + '.json'
      // if (typeof (existedFileObj[dataItemNameWithOptions]) === 'undefined') {
      existedFileObj[dataItemNameWithOptions] = {}
      var originalTreeObj = clone(require(filePath + fileName))
      existedFileObj[dataItemNameWithOptions]['originalTreeObj'] = originalTreeObj
      dataProcessor.loadCompactSingleData(originalTreeObj, barcodeWidthArray, existedFileObj[dataItemNameWithOptions], selectedLevels, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval)
      treeNodeArrayObj[dataItemName] = getTreeNodeArrayObj(existedFileObj[dataItemNameWithOptions])
      // } else {
      //   treeNodeArrayObj[dataItemName] = getTreeNodeArrayObj(existedFileObj[dataItemNameWithOptions])
      // }
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
    function getTreeNodeArrayObj(existedFileObj) {
      var treeNodeArrayObj = {}
      for (var item in existedFileObj) {
        if ((item !== 'originalTreeObj') && (item !== 'treeNodeObj')) {
          treeNodeArrayObj[item] = existedFileObj[item].compactTreeNodeLocArray
        }
      }
      return treeNodeArrayObj
    }
  }

  function readAndCompactTreeNodeObj(supertreeObj, groupId, selectedLevelStr, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval) {
    var compactSelectedLevelStr = 'compact-' + selectedLevelStr
    var dataItemNameWithOptions = groupId + compactSelectedLevelStr
    existedFileObj[dataItemNameWithOptions] = {}
    existedFileObj[dataItemNameWithOptions]['originalTreeObj'] = supertreeObj
    dataProcessor.loadCompactSingleData(supertreeObj, barcodeWidthArray, existedFileObj[dataItemNameWithOptions], selectedLevels, barcodeHeight, compactNum, maxDepth, barcodeNodeInterval)
    var treeNodeArrayObj = getTreeNodeArrayObj(existedFileObj[dataItemNameWithOptions])
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
    function getTreeNodeArrayObj(existedFileObj) {
      var treeNodeArrayObj = {}
      for (var item in existedFileObj) {
        if ((item !== 'originalTreeObj') && (item !== 'treeNodeObj')) {
          treeNodeArrayObj[item] = existedFileObj[item].compactTreeNodeLocArray
        }
      }
      return treeNodeArrayObj
    }
  }

  /**
   * 根据传递的rootId得到现存的原始的树的子树的节点数组
   */
  function removeSuperTree(request, response) {
    var reqBody = request.body
    var dataItemNameArray = reqBody['dataItemNameArray']
    var dataItemType = typeof(dataItemNameArray)
    var dataSetName = reqBody.dataSetName
    var selectedLevels = reqBody['selectedLevels']
    var barcodeWidthArray = reqBody['barcodeWidthArray']
    var barcodeHeight = reqBody['barcodeHeight']
    var rootId = reqBody.rootId
    var rootLevel = reqBody.rootLevel
    var compactNum = reqBody.compactNum
    var maxDepth = reqBody['maxDepth']
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
    var treeNodeArrayObj = innerHandleOriginalTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight)
    var compactTreeNodeArrayObj = innerHandleCompactTreeNodeObj(dataItemType, dataItemNameArray, selectedLevelStr, dataSetName, selectedLevels, barcodeWidthArray, barcodeHeight, compactNum, maxDepth)
    var remainedSubtreeNodeArrayObj = getRemainedOriginalTreeNodeObj(treeNodeArrayObj, rootId, rootLevel)
    var remainedCompactTreeNodeArrayObj = getRemainedCompactTreeNodeObj(compactTreeNodeArrayObj, rootId, rootLevel)
    sendTreeNodeArray(remainedSubtreeNodeArrayObj, remainedCompactTreeNodeArrayObj)
    //  获得一个原始模式下的子树的节点数组
    function getRemainedOriginalTreeNodeObj(treeNodeArrayObj, rootId, rootLevel) {
      var remainedTreeNodeArrayObj = {}
      rootLevel = +rootLevel
      for (var item in treeNodeArrayObj) {
        var treeNodeArray = treeNodeArrayObj[item]
        //  计算subtree的begin值
        var remainedBegin = 0
        for (var tI = 0; tI < treeNodeArray.length; tI++) {
          if (treeNodeArray[tI].id === rootId) {
            remainedBegin = tI
            break
          }
        }
        //  计算subtree的end值
        var remainedEnd = 0
        for (var rI = (remainedBegin + 1); rI < treeNodeArray.length; rI++) {
          var nodeDepth = +treeNodeArray[rI].depth
          if (nodeDepth <= rootLevel) {
            remainedEnd = rI - 1
            break
          }
        }
        remainedTreeNodeArrayObj[item] = treeNodeArray.slice(remainedBegin, remainedEnd)
      }
      return remainedTreeNodeArrayObj
    }

    //  获得一个compact模式下的子树的节点数组
    function getRemainedCompactTreeNodeObj(treeNodeArrayObj, rootId, rootLevel) {
      var remainedTreeNodeArrayObj = {}
      rootLevel = +rootLevel
      for (var treeItem in treeNodeArrayObj) {
        var treeObj = treeNodeArrayObj[treeItem]
        remainedTreeNodeArrayObj[treeItem] = {}
        for (var levelItem in treeObj) {
          var treeNodeArray = treeObj[levelItem]
          //  计算subtree的begin值
          var remainedBegin = 0
          for (var tI = 0; tI < treeNodeArray.length; tI++) {
            if (treeNodeArray[tI].id === rootId) {
              remainedBegin = tI
              break
            }
          }
          //  计算subtree的end值
          var remainedEnd = 0
          for (var rI = (remainedBegin + 1); rI < treeNodeArray.length; rI++) {
            var nodeDepth = +treeNodeArray[rI].depth
            if (nodeDepth <= rootLevel) {
              remainedEnd = rI - 1
              break
            }
          }
          remainedTreeNodeArrayObj[treeItem][levelItem] = treeNodeArray.slice(remainedBegin, remainedEnd)
        }
      }
      return remainedTreeNodeArrayObj
    }

    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray(treeNodeArray, compactTreeNodeArrayObj) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = {
        'treeNodeObject': treeNodeArray,
        'compactTreeNodeArrayObj': compactTreeNodeArrayObj,
      }
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  /**
   * 根据传入的rootId构建unionTree
   * @param request
   * @param response
   */
  function handleBuildSuperTree(request, response) {
  }

  function handleTreeObjToNodeList(request, response) {
    var reqBody = request.body
    var treeObjArray = reqBody["treeObjArray"]
    var rootId = reqBody.rootId
    var rootLevel = reqBody.rootLevel
    var alignedLevel = reqBody.alignedLevel
    var dataSetName = reqBody.dataSetName
    var treeNodeArrayObj = {}
    var barcodeWidthArray = reqBody['barcodeWidthArray']
    var barcodeHeight = reqBody['barcodeHeight']
    //  将barcodeWidth的数组内部的元素转换为数字
    for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
      barcodeWidthArray[bI] = +barcodeWidthArray[bI]
    }
    var selectedLevels = reqBody['selectedLevels']
    for (var sI = 0; sI < selectedLevels.length; sI++) {
      selectedLevels[sI] = +selectedLevels[sI]
    }
    var superTreeNodeArray = dataProcessor.getSuperTreeNodeFromTreeObjArray(treeObjArray, barcodeWidthArray, barcodeHeight, selectedLevels, rootId, rootLevel, alignedLevel)
    addCategoryName(superTreeNodeArray, dataSetName)
    sendTreeNodeArray(superTreeNodeArray)

    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray(treeNodeArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = {'treeNodeObject': treeNodeArray}
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  function handleTreeNodeIdArray(request, response) {
    var reqBody = request.body
    var treeObjArray = reqBody['treeObjArray']
    var treeObjectIdArray = dataProcessor.getTreeObjectIdArray(treeObjArray)
    //  向客户端传递barcode的节点位置, 大小等信息
    function sendTreeNodeArray(treeObjectIdArray) {
      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      var treeNodeObject = {'treeObjectIdArray': treeObjectIdArray}
      response.send(JSON.stringify(treeNodeObject, null, 3))
    }
  }

  function handleCategoryName(request, response) {
    var reqBody = request.body
    var sampleDataName = reqBody.DataSetName
    var filePath = '../data/' + sampleDataName + '/categoryName.json'
    var categoryObj = clone(require(filePath))
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.send(JSON.stringify(categoryObj, null, 3))
  }

  var handle = {}
  handle['/'] = handleStart
  handle['/start'] = handleStart
  handle['404'] = handle404
  handle['file'] = handleFile
  handle['query'] = handleQuery
  handle['/file_name'] = handlerObj['/file_name']
  handle['/barcode_original_data'] = handlerObj['/barcode_original_data']
  handle['/and_operation_result'] = handlerObj['/and_operation_result']
  handle['/or_operation_result'] = handlerObj['/or_operation_result']
  handle['/complement_operation_result'] = handlerObj['/complement_operation_result']
  handle['/barcode_compact_data'] = handleCompactData
  handle['/build_super_tree'] = handlerObj['/build_super_tree']
  handle['/remove_from_super_tree'] = handlerObj['/remove_from_super_tree']
  handle['/update_barcode_tree_sequence'] = handlerObj['/update_barcode_tree_sequence']
  handle['/remove_super_tree'] = removeSuperTree
  handle['/treeobject_to_nodelist'] = handleTreeObjToNodeList
  handle['/category_name'] = handleCategoryName
  return handle
}

exports.initialize = initialize