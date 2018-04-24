//  构建全局的数据对象, 防止用户对于本地数据的重复读取
var globalOriginalObjDataCenter = {}
var globalIdIndexObjDataCenter = {}
var globalFileNameObjDataCenter = {}
var globalLinearTreeNodeArrayCenter = {}
var globalCompactOriginalObjDataCenter = {}
var globalCompactLinearTreeNodeArrayCenter = {}
var globalSuperTreeObjCenter = {}
var globalSelectedObjData = {}
var globalColumnSequenceObj = {}
var globalRowSequenceArray = []
var globalSelectedLevels = []
var clone = require('clone')
var hierarchicalDataProcessor = require('../processor/signaltree_processor')

//  更新superTree对象中的itemNameArray以及构建superTree的基本元素
function update_super_tree_obj_item_array(item_name_array) {
  globalSuperTreeObjCenter.itemNameArray = item_name_array
}
//  更新superTree对象中的itemNameArray以及构建superTree的基本元素
function update_super_tree_obj_super_tree(super_tree_obj) {
  globalSuperTreeObjCenter.superTreeObj = super_tree_obj
}
//  根据当前选择的数组, 获取当前的superTree对象
function get_super_tree_obj() {
  return clone(globalSuperTreeObjCenter)
}

//  将读取的本地数据增加到全局的数据对象中
function add_original_data_set(data_set_name, data_set_obj) {
  globalOriginalObjDataCenter[data_set_name] = data_set_obj
}
//  将读取的本地数据转换得到的以节点的id为索引的数据增加到全局变量的数据对象中
function add_id_index_data_set(data_set_name, data_set_obj) {
  globalIdIndexObjDataCenter[data_set_name] = data_set_obj
}

//  将读取的本地数据并且线性化之后的结果增加到全局的数据对象中
function add_linear_data_set(data_set_name, data_set_obj) {
  globalLinearTreeNodeArrayCenter[data_set_name] = data_set_obj
}

//  将读取的本地数据线性化并且转换为compact模式存储到全局的数据对象中
function add_compact_linear_data(data_set_name, data_set_obj) {
  globalCompactLinearTreeNodeArrayCenter[data_set_name] = data_set_obj
}

//  将读取的本地数据并且compact之后的结果增加到全局的数据对象中
function add_compact_original_data_set(data_set_name, compact_data_set_obj) {
  globalCompactOriginalObjDataCenter[data_set_name] = compact_data_set_obj
}

//  更新selectedLevels数组
function update_select_levels(selected_levels) {
  globalSelectedLevels = clone(selected_levels)
}
//  根据dataSet的名称, dataItem的内容, subtreeid的内容, 获取subtreeObject的对象
function get_subtree_id_index_data(data_set_name, data_item, subtree_id) {
  var IdIndexObjDataSet = globalIdIndexObjDataCenter[data_set_name]
  var dataObject = IdIndexObjDataSet[data_item]
  var subtreeObject = dataObject[subtree_id]
  return subtreeObject
}

//  从全局的数据对象中获取数据
function get_original_data(data_set_name, data_item_name_array) {
  var originalTreeObjObject = {}
  if (typeof (data_item_name_array) !== 'undefined') {
    for (var dI = 0; dI < data_item_name_array.length; dI++) {
      var dataItemName = data_item_name_array[dI]
      var dataItem = globalOriginalObjDataCenter[data_set_name][dataItemName]
      var originalTreeObj = clone(dataItem)
      originalTreeObjObject[dataItemName] = originalTreeObj
    }
  }
  return originalTreeObjObject
}

//  从全局的数据对象中获取线性化之后的结果数据
function get_linear_data(data_set_name, data_item_name_array, selectedLevels) {
  var linearTreeObjObject = {}
  if (typeof (data_item_name_array) !== 'undefined') {
    for (var dI = 0; dI < data_item_name_array.length; dI++) {
      var dataItemName = data_item_name_array[dI]
      var dataItem = globalLinearTreeNodeArrayCenter[data_set_name][dataItemName]
      var originalTreeObj = clone(dataItem)
      originalTreeObj = filter_data_item(originalTreeObj, selectedLevels)
      linearTreeObjObject[dataItemName] = originalTreeObj
    }
  }
  return linearTreeObjObject
}

//  按照selectedLevel的最大层级筛选fileObj
function filter_fileobj_max_level(originalTreeObj, max_level) {
  inner_filtering(originalTreeObj)
  function inner_filtering(originalTreeObj) {
    if (typeof (originalTreeObj) !== 'undefined') {
      var depth = originalTreeObj.depth
      if (depth >= max_level) {
        delete originalTreeObj.children
      }
      var children = originalTreeObj.children
      if (typeof (children) !== 'undefined') {
        for (var cI = 0; cI < children.length; cI++) {
          inner_filtering(children[cI])
        }
      }
    }
  }
}

//  对于线性化之后的数组进行筛选
function filter_data_item(originalTreeObj, selectedLevels) {
  var filteredOriginalTree = []
  for (var dI = 0; dI < originalTreeObj.length; dI++) {
    var depth = originalTreeObj[dI].depth
    var itemIndex = selectedLevels.indexOf(depth)
    if (itemIndex !== -1) {
      filteredOriginalTree.push(originalTreeObj[dI])
    }
  }
  return filteredOriginalTree
}

//  从全局的数据对象中获取线性化之后的compact的结果数据
function get_compact_linear_data(data_set_name, data_item_name_array, selectedLevels) {
  var compactLinearTreeObjObject = {}
  if (typeof (data_item_name_array) !== 'undefined') {
    for (var dI = 0; dI < data_item_name_array.length; dI++) {
      var dataItemName = data_item_name_array[dI]
      // var compactTreeNodeArrayObj = globalCompactLinearTreeNodeArrayCenter[data_set_name][dataItemName]
      //  首先从数据集中获取原始的数据
      //
      // var compactTreeObjectObj = get_compact_obj(dataSetName, filename, fileObject, selectedLevels)
      //   compactDataSetObj[fileNameRemovedJson] = compactTreeObjectObj
      //   var compactTreeNodeArrayObj = get_linear_compact_obj(dataSetName, filename, compactTreeObjectObj)
      //   compactLinearObj[fileNameRemovedJson] = compactTreeNodeArrayObj
      //
      var originalDataObj = get_original_data(data_set_name, [dataItemName])
      //  计算最大的level的值
      var maxLevel = 0
      for (var sI = 0; sI < selectedLevels.length; sI++) {
        var level = selectedLevels[sI]
        if (level > maxLevel) {
          maxLevel = level
        }
      }
      //  按照selectedLevels的属性对于数据集中的对象进行筛选
      var originalData = originalDataObj[dataItemName]
      filter_fileobj_max_level(originalData, maxLevel)
      var compactTreeNodeArrayObj = get_linear_compact_obj(originalData, selectedLevels)
      var compactLinearTreeNodeArray = clone(compactTreeNodeArrayObj)
      compactLinearTreeObjObject[dataItemName] = compactLinearTreeNodeArray
    }
  }
  return compactLinearTreeObjObject
}
/**
 * 读linear的compact的treeObject
 */
function get_linear_compact_obj(fileObject, selectedLevels) {
  //  获取compact之后treeObject的结果
  var compactTreeObjectObj = get_compact_obj(fileObject, selectedLevels)
  var compactTreeNodeArrayObj = {}
  for (var item in compactTreeObjectObj) {
    var compactTreeObject = compactTreeObjectObj[item]
    //  计算compact之后的barcodeTree的节点数组
    compactTreeNodeArrayObj[item] = hierarchicalDataProcessor.compact_tree_linearization(compactTreeObject)
  }
  return compactTreeNodeArrayObj
}
/**
 * 读compact的treeObject
 */
function get_compact_obj(fileObject, selectedLevels) {
  var compactTreeObj = clone(fileObject)
  var compactTreeObjectObj = hierarchicalDataProcessor.transform_original_obj_compact_obj(compactTreeObj, selectedLevels)
  return compactTreeObjectObj
}
//  从全局获取单个数据对象
function get_single_original_data(data_set_name, data_item_name) {
  var dataItem = globalOriginalObjDataCenter[data_set_name][data_item_name]
  var originalTreeObj = clone(dataItem)
  return originalTreeObj
}

//  从全局获取单个数据对象
function get_single_linear_data(data_set_name, data_item_name) {
  var dataItem = globalLinearTreeNodeArrayCenter[data_set_name][data_item_name]
  var linearTreeObj = clone(dataItem)
  return linearTreeObj
}

//  获得一个选择的对象
function get_single_selected_obj(data_item_name) {
  return globalSelectedObjData[data_item_name]
}

//  增加一个选择的对象
function add_single_selected_obj(data_item_name, original_obj, barcodetree_obj) {
  if (typeof (globalSelectedObjData[data_item_name]) === 'undefined') {
    globalSelectedObjData[data_item_name] = {}
  }
  globalSelectedObjData[data_item_name].original_obj = original_obj
  globalSelectedObjData[data_item_name].original_obj = original_obj
}

//  删除一个选择的对象
function remove_single_selected_obj(data_item_name) {
  delete globalSelectedObjData[data_item_name]
}

//  在改变selected_level时候需要更新现有的compact节点数组
function update_compact_original_data(selected_levels) {
  var globalOriginalObjDataCenter = self.globalOriginalObjDataCenter
  var globalCompactOriginalObjDataCenter = self.globalCompactOriginalObjDataCenter
  var globalCompactLinearTreeNodeArrayCenter = self.globalCompactLinearTreeNodeArrayCenter
  for (var fileItem in globalOriginalObjDataCenter) {
    var fileObject = globalOriginalObjDataCenter[fileItem]
    var compactTreeObj = hierarchicalDataProcessor.transform_original_obj_compact_obj(fileObject, selected_levels)
    globalCompactOriginalObjDataCenter[fileItem] = compactTreeObj
    var compactTreeNodeArray = hierarchicalDataProcessor.compact_tree_linearization(compactTreeObj)
    globalCompactLinearTreeNodeArrayCenter[fileItem] = compactTreeNodeArray
  }
}

//  判断某个barcode的数据集是否存在
function is_dataset_existed(data_set_name) {
  if (typeof (globalOriginalObjDataCenter[data_set_name]) === 'undefined') {
    return false
  } else {
    return true
  }
}

//  清空选择的对象
function clear_selected_obj() {
  globalSelectedObjData = {}
}

//  获取列排列的顺序
function get_column_sorting_sequence() {
  return globalColumnSequenceObj
}

//  设置列排列的顺序
function set_column_sorting_sequence(global_column_sequence_obj) {
  globalColumnSequenceObj = clone(global_column_sequence_obj)
}

//  设置行排列的顺序
function set_row_sorting_sequence(global_row_sequence_array) {
  globalRowSequenceArray = clone(global_row_sequence_array)
}

//  获取行排列的顺序
function get_row_sorting_sequence() {
  return globalRowSequenceArray
}

//  清空所有存储的对象
function clear_all() {
  globalOriginalObjDataCenter = {}
  globalLinearTreeNodeArrayCenter = {}
  globalFileNameObjDataCenter = {}
  globalSuperTreeObjCenter = {}
  globalSelectedObjData = {}
  globalColumnSequenceObj = {}
  globalRowSequenceArray = []
}

//  设置fileinfo object
function set_file_info_obj(data_set_name, file_info_obj) {
  globalFileNameObjDataCenter[data_set_name] = file_info_obj
}

//  获取file info object
function get_file_info_obj(data_set_name) {
  if (typeof (globalFileNameObjDataCenter[data_set_name]) !== 'undefined') {
    return globalFileNameObjDataCenter[data_set_name]
  }
}

exports.set_file_info_obj = set_file_info_obj
exports.get_file_info_obj = get_file_info_obj

exports.is_dataset_existed = is_dataset_existed
exports.add_id_index_data_set = add_id_index_data_set
exports.get_subtree_id_index_data = get_subtree_id_index_data

exports.add_original_data_set = add_original_data_set
exports.get_original_data = get_original_data
exports.get_single_original_data = get_single_original_data

exports.add_linear_data_set = add_linear_data_set
exports.add_compact_linear_data = add_compact_linear_data
exports.add_compact_original_data_set = add_compact_original_data_set
exports.get_linear_data = get_linear_data
exports.get_compact_linear_data = get_compact_linear_data
exports.get_single_linear_data = get_single_linear_data
exports.update_select_levels = update_select_levels

exports.get_super_tree_obj = get_super_tree_obj
exports.update_super_tree_obj_item_array = update_super_tree_obj_item_array
exports.update_super_tree_obj_super_tree = update_super_tree_obj_super_tree

exports.get_single_selected_obj = get_single_selected_obj
exports.add_single_selected_obj = add_single_selected_obj
exports.remove_single_selected_obj = remove_single_selected_obj
exports.clear_selected_obj = clear_selected_obj

exports.get_column_sorting_sequence = get_column_sorting_sequence
exports.set_column_sorting_sequence = set_column_sorting_sequence
exports.set_row_sorting_sequence = set_row_sorting_sequence
exports.get_row_sorting_sequence = get_row_sorting_sequence

exports.update_compact_original_data = update_compact_original_data

exports.clear_all = clear_all
