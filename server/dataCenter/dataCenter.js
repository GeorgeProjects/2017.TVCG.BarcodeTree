//  构建全局的数据对象, 防止用户对于本地数据的重复读取
var globalOriginalObjDataCenter = {}
var globalLinearTreeNodeArrayCenter = {}
var globalSuperTreeObjCenter = {}
var clone = require('clone')

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

//  将读取的本地数据并且线性化之后的结果增加到全局的数据对象中
function add_linear_data_set(data_set_name, data_set_obj) {
  globalLinearTreeNodeArrayCenter[data_set_name] = data_set_obj
}

//  从全局的数据对象中获取线性化之后的结果数据
function get_linear_data(data_set_name, data_item_name_array) {
  var linearTreeObjObject = {}
  if (typeof (data_item_name_array) !== 'undefined') {
    for (var dI = 0; dI < data_item_name_array.length; dI++) {
      var dataItemName = data_item_name_array[dI]
      var dataItem = globalLinearTreeNodeArrayCenter[data_set_name][dataItemName]
      var originalTreeObj = clone(dataItem)
      linearTreeObjObject[dataItemName] = originalTreeObj
    }
  }
  return linearTreeObjObject
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

exports.add_original_data_set = add_original_data_set
exports.get_original_data = get_original_data
exports.get_single_original_data = get_single_original_data

exports.add_linear_data_set = add_linear_data_set
exports.get_linear_data = get_linear_data
exports.get_single_linear_data = get_single_linear_data

exports.get_super_tree_obj = get_super_tree_obj
exports.update_super_tree_obj_item_array = update_super_tree_obj_item_array
exports.update_super_tree_obj_super_tree = update_super_tree_obj_super_tree
