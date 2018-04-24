var dataCenter = require('../dataCenter/dataCenter')
var clone = require('clone')
var fs = require('fs')
var process = require('process')
var hierarchicalDataProcessor = require('../processor/signaltree_processor')

var fileNameHandler = function (request, response) {
  var dataSetName = request.body.DataSetName
  initilize_original_dataset(dataSetName, sendFileInfoObj)
  //  发送读取的数据
  function sendFileInfoObj(fileInfoObj) {
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.send(JSON.stringify(fileInfoObj, null, 3))
  }
}

function initilize_original_dataset(dataSetName, sendFileInfoObj) {
  var directoryName = './server/data/' + dataSetName + '/originalData/'//'../data/' + sampleDataName + '/originalData/'
  var readFileDirectory = '../data/' + dataSetName + '/originalData/'
  if (!dataCenter.is_dataset_existed(dataSetName)) {
    //  read_directory_file函数传入的有两个函数, 一个是处理结束的函数, 一个是继续的数据处理函数
    read_directory_file(dataSetName, directoryName, readFileDirectory, function (fileInfoObj, dataSetObj, linearObj) {
      dataCenter.set_file_info_obj(dataSetName, fileInfoObj)
      dataCenter.add_original_data_set(dataSetName, dataSetObj)
      dataCenter.add_linear_data_set(dataSetName, linearObj)
      //  发送fileObject
      if (typeof (sendFileInfoObj) !== 'undefined') {
        sendFileInfoObj(fileInfoObj)
      }
    }, function (idIndexObj, selectedLevels) {
      dataCenter.add_id_index_data_set(dataSetName, idIndexObj)
      // dataCenter.add_compact_original_data_set(dataSetName, compactDataSetObj)
      // dataCenter.add_compact_linear_data(dataSetName, compactLinearObj)
      dataCenter.update_select_levels(dataSetName, selectedLevels)
    }, function (err) {
      throw err;
    })
  } else {
    //  发送fileObject
    if (typeof (sendFileInfoObj) !== 'undefined') {
      var fileInfoObj = dataCenter.get_file_info_obj(dataSetName)
      sendFileInfoObj(fileInfoObj)
    }
  }
}

function read_directory_file(dataSetName, dirname, readFileDirectory, fileReadEnd, dataProcess, onError) {
  fs.readdir(dirname, function (err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    var dataSetObj = {}
    var compactDataSetObj = {}
    var idIndexObj = {}
    var linearObj = {}
    var compactLinearObj = {}
    var fileInfoObj = {}
    var fileInfoArray = []
    var selectedLevels = []
    var initDepth = 0
    var maxDepthObj = {maxDepth: 0}
    var fileNameObject = {}
    //  上面是对于文件的处理, 处理结束之后会调用fileReadEnd函数
    filenames.forEach(function (filename) {
      if (filename !== '.DS_Store') {
        //  对于fileObject的处理, 结果是得到一个增加了depth, 增加了节点的num值,
        //  对于节点中的children进行排序的fileObject
        var fileObject = clone(require(readFileDirectory + filename))
        var fileNameRemovedJson = filename.replace('.json', '')
        dataSetObj[fileNameRemovedJson] = fileObject
        //  在tree的每个节点上增加深度并且获取整个数据集的最大的树的深度
        _add_depth_find_max_depth(initDepth, fileObject, maxDepthObj)
        //  在tree中的每个节点上增加节点数量的属性值
        hierarchicalDataProcessor.add_node_num(fileObject)
        //  对于树对象中的孩子节点进行排序
        sort_children(fileObject)
        fs.writeFile(('./server/data/' + dataSetName + '/linearData/' + filename), JSON.stringify(fileObject), 'utf8', function (err) {
          console.log('err', err)
        })
        //  将树的对象线性化并且comapct返回compact并且线性化的节点数组
        //  初始化selected Levels
        for (var mI = 0; mI <= maxDepthObj.maxDepth; mI++) {
          if (selectedLevels.indexOf(mI) === -1) {
            selectedLevels.push(mI)
          }
        }
        //  将树的对象变成以节点id为索引的树的对象
        var originalTreeNodeObj = _init_original_tree_obj(fileObject)
        idIndexObj[fileNameRemovedJson] = originalTreeNodeObj
        //  将树的对象进行线性化得到线性化的节点数组
        // var treeNodeArray = hierarchicalDataProcessor.treeLinearization(fileObject, initDepth)
        var treeNodeArray = get_linear_file_obj(dataSetName, filename, fileObject, initDepth)
        linearObj[fileNameRemovedJson] = treeNodeArray
        fileNameObject[filename] = fileObject
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
      }
    })
    //  按照时间先后对于fileInfoArray数组进行排序
    fileInfoArray = fileInfoArray.sort(function (f1, f2) {
      return f1.name > f2.name
    })
    fileInfoObj.fileInfo = fileInfoArray
    fileInfoObj.maxDepth = maxDepthObj.maxDepth
    // //  下面是对于数据继续的处理过程, 处理结束之后的结果会调用dataProcess函数进行存储
    // for (var filename in fileNameObject) {
    //   var fileObject = fileNameObject[filename]
    //   var fileNameRemovedJson = filename.replace('.json', '')
    //   //  将树的对象进行compact得到compact之后的节点数组
    //   var compactTreeObjectObj = get_compact_obj(dataSetName, filename, fileObject, selectedLevels)
    //   compactDataSetObj[fileNameRemovedJson] = compactTreeObjectObj
    //   var compactTreeNodeArrayObj = get_linear_compact_obj(dataSetName, filename, compactTreeObjectObj)
    //   compactLinearObj[fileNameRemovedJson] = compactTreeNodeArrayObj
    // }
    dataProcess(idIndexObj, selectedLevels) // compactDataSetObj, compactLinearObj
    fileReadEnd(fileInfoObj, dataSetObj, linearObj)
  });
}
/**
 * 将original的treeObject转换为originalTreeNodeObj, 以节点的id为索引的对象
 */
function _init_original_tree_obj(treeObj) {
  var originalTreeNodeObj = {}
  var initDepth = 0
  inner_traverse_original_tree(originalTreeNodeObj, treeObj, initDepth)
  return originalTreeNodeObj
  function inner_traverse_original_tree(originalTreeNodeObj, treeObj, initDepth) {
    var nodeId = 'node-' + initDepth + '-' + treeObj.name
    originalTreeNodeObj[nodeId] = treeObj
    if (typeof (treeObj.children) !== 'undefined') {
      for (var tI = 0; tI < treeObj.children.length; tI++) {
        inner_traverse_original_tree(originalTreeNodeObj, treeObj.children[tI], (initDepth + 1))
      }
    }
  }
}
/**
 * 读linear的compact的treeObject
 */
function get_linear_compact_obj(dataSetName, filename, compactTreeObjectObj) {
  var linearCompactFile = '../data/' + dataSetName + '/linearCompactData/' + filename
  var compactTreeNodeArrayObj = null
  // try {
  //   console.log('find the file')
  //   compactTreeNodeArrayObj = clone(require(linearCompactFile))
  // } catch (e) {
  //   if (e.code === 'MODULE_NOT_FOUND') {
  //     compactTreeNodeArrayObj = compact_tree_obj_linearization(compactTreeObjectObj)
  //     fs.writeFile(('./server/data/' + dataSetName + '/linearCompactData/' + filename), JSON.stringify(compactTreeNodeArrayObj), 'utf8', function (err) {
  //       console.log('err', err)
  //     })
  //   }
  // }
  compactTreeNodeArrayObj = compact_tree_obj_linearization(compactTreeObjectObj)
  return compactTreeNodeArrayObj
}
/**
 * 读compact的treeObject
 */
function get_compact_obj(dataSetName, filename, fileObject, selectedLevels) {
  var compactFile = '../data/' + dataSetName + '/compactData/' + filename
  var compactTreeObjectObj = null
  var compactTreeObj = null
  // try {
  //   compactTreeObjectObj = clone(require(compactFile))
  // } catch (e) {
  //   if (e.code === 'MODULE_NOT_FOUND') {
  //     compactTreeObj = clone(fileObject)
  //     compactTreeObjectObj = hierarchicalDataProcessor.transform_original_obj_compact_obj(compactTreeObj, selectedLevels)
  //     fs.writeFile(('./server/data/' + dataSetName + '/compactData/' + filename), JSON.stringify(compactTreeObjectObj), 'utf8', function (err) {
  //       console.log('err', err)
  //     })
  //   }
  // }
  compactTreeObj = clone(fileObject)
  compactTreeObjectObj = hierarchicalDataProcessor.transform_original_obj_compact_obj(compactTreeObj, selectedLevels)
  return compactTreeObjectObj
}
/**
 * 读线性化的fileObject
 */
function get_linear_file_obj(dataSetName, filename, fileObject, initDepth) {
  var linearFile = '../data/' + dataSetName + '/linearData/' + filename
  var treeNodeArray = null
  // try {
  //   treeNodeArray = clone(require(linearFile))
  // } catch (e) {
  //   treeNodeArray = hierarchicalDataProcessor.treeLinearization(fileObject, initDepth)
  //   fs.writeFile(('./server/data/' + dataSetName + '/linearData/' + filename), JSON.stringify(treeNodeArray), 'utf8', function (err) {
  //     console.log('err', err)
  //   })
  // }
  treeNodeArray = hierarchicalDataProcessor.treeLinearization(fileObject, initDepth)
  return treeNodeArray
  // if (fs.existsSync(linearFile)) {
  //   // Do something
  //   console.log('linearData existed')
  //   var treeNodeArray = clone(require(linearFile))
  // } else {
  //   var treeNodeArray = hierarchicalDataProcessor.treeLinearization(fileObject, initDepth)
  //   fs.writeFile(('./server/data/' + dataSetName + '/linearData/' + filename), JSON.stringify(treeNodeArray), 'utf8', function (err) {
  //     console.log('err', err)
  //   })
  // }
  // return treeNodeArray
}
/**
 * compact模式的树的压缩
 */
function compact_tree_obj_linearization(compactTreeObjectObj) {
  var compactTreeNodeArrayObj = {}
  for (var item in compactTreeObjectObj) {
    var compactTreeObject = compactTreeObjectObj[item]
    compactTreeNodeArrayObj[item] = hierarchicalDataProcessor.compact_tree_linearization(compactTreeObject)
  }
  return compactTreeNodeArrayObj
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
          return a_minus_b(aName, bName)
        })
        for (var i = 0; i < tree.children.length; i++) {
          innerSortChildren(tree.children[i])
        }
      }
    }
  }

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

  function transform_num_array(name) {
    var nameArray = name.split('_')
    return nameArray
  }
}

exports.fileNameHandler = fileNameHandler
exports.initilizeOriginalDataset = initilize_original_dataset