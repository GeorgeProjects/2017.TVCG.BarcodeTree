define([
  'require',
  'marionette',
  'underscore',
  'jquery',
  'backbone',
  'config',
  'd3',
  'variables',
  'models/barcode.model'
], function (require, Mn, _, $, Backbone, Config, d3, Variables, BarcodeModel) {
  'use strict'

  return Backbone.Collection.extend({
    model: BarcodeModel,
    initialize: function () {
      var self = this
      self.subtreeNodeArrayObj = {}
      self.alignedNodeIdArray = []
      self.alignedNodeObjArray = []
      self.selectedNodesId = {}
      self.superTreeSelectedNodesId = {}
      self.basedModel = null
      self.sortExistedConfigObj = null
      self.sortSimilarityConfigState = false
      self.collapsedNodeIdArray = []
      self.tablelensSubtreeArray = []
      self.categoryNodeObjArray = null
      self.operationItemList = []
      self.selectedNodesIdObj = {}
      self.paddingSubtreeRangeObject = {}
      Variables.set('alignedNodeIdArray', self.alignedNodeIdArray)
      //  判断barcode当前的模式, 如果是global模式, 那么需要将barcode中的对齐部分进行改变
      var displayMode = Variables.get('displayMode')
      if (displayMode === Config.get("CONSTANT").GLOBAL) {
        init_global_align()
      }
      function init_global_align() {
        var rootId = 'root'
        var rootLevel = 0
        var rootCategory = 'root'
        self.alignedNodeIdArray.push(rootId)
        self.alignedNodeObjArray.push({
          alignedNodeId: rootId,
          alignedNodeLevel: rootLevel,
          alignedNodeCategory: rootCategory
        })
      }
    },
    //  判断是否存在align的节点
    is_exist_align_part: function () {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      if (alignedNodeObjArray.length > 0) {
        return true
      } else {
        return false
      }
    },
    //  根据传递节点的id计算下面的子树节点的对应位置
    get_barcode_detailed_subtree: function (node_id, node_level) {
      var self = this
      var barcodeModel = self.at(0)
      var subtreeRangeObjectArray = barcodeModel.get_next_subtree_range(node_id, node_level)
      return subtreeRangeObjectArray
    },
    //  根据传递的节点的id计算节点下面的子树节点所占比例
    get_barcode_proportion: function (node_id) {
      var self = this
      var barcodeSize = self.length
      var sumSubtreeLengthObj = {}
      var averageSubtreeLengthObj = {}
      var proportionSubtreeObj = {}
      var proportionSubtreeObjArray = []
      self.each(function (model) {
        var subtreeLengthObj = model.get_subree_size_obj_array(node_id)
        for (var item in subtreeLengthObj) {
          if (typeof (sumSubtreeLengthObj[item]) === 'undefined') {
            sumSubtreeLengthObj[item] = 0
          }
          sumSubtreeLengthObj[item] = sumSubtreeLengthObj[item] + subtreeLengthObj[item]
        }
      })
      //  计算subtree的节点数目的平均值
      var sumAverageSubtreeLength = 0
      for (var item in sumSubtreeLengthObj) {
        if (barcodeSize > 0) {
          averageSubtreeLengthObj[item] = sumSubtreeLengthObj[item] / barcodeSize
          sumAverageSubtreeLength = sumAverageSubtreeLength + averageSubtreeLengthObj[item]
        }
      }
      //  计算subtree的节点数目的比例值
      for (var item in averageSubtreeLengthObj) {
        proportionSubtreeObj[item] = averageSubtreeLengthObj[item] / sumAverageSubtreeLength
      }
      var aggregatedProportion = 0
      for (var item in proportionSubtreeObj) {
        proportionSubtreeObjArray.push({
          id: item,
          proportion: proportionSubtreeObj[item],
          aggregatedProportion: aggregatedProportion
        })
        aggregatedProportion = aggregatedProportion + proportionSubtreeObj[item]
      }
      console.log(proportionSubtreeObjArray)
      return proportionSubtreeObjArray
    },
    //  from supertreeview.js 在superTree视图中调用
    get_max_barcode_node_width: function (nodeId, nodeLevel, alignedNodeObj) {
      var self = this
      var barcodeMaxRightLoc = -Infinity
      var barcodeMinLeftLoc = Infinity
      console.log('alignedNodeObj', alignedNodeObj)
      //  根据节点的id计算节点最大的宽度值, 以及最右侧的位置
      self.each(function (model) {
        var barcodeRightLoc = 0, barcodeLeftLoc = 0
        if (alignedNodeObj.accurate_subtree) {
          barcodeRightLoc = model.get_right_loc(nodeId, nodeLevel)
          console.log('barcodeRightLoc', barcodeRightLoc)
          barcodeLeftLoc = model.get_left_loc(nodeId, nodeLevel)
          console.log('barcodeLeftLoc', barcodeLeftLoc)
        } else {
          barcodeRightLoc = model.get_padding_node_right_loc(alignedNodeObj.accurate_subtree_id, nodeLevel)
          barcodeLeftLoc = model.get_padding_node_left_loc(alignedNodeObj.accurate_subtree_id, nodeLevel)
        }
        if (barcodeRightLoc > barcodeMaxRightLoc) {
          barcodeMaxRightLoc = barcodeRightLoc
        }
        if (barcodeLeftLoc < barcodeMinLeftLoc) {
          barcodeMinLeftLoc = barcodeLeftLoc
        }
      })
      var barcodeMaxWidth = barcodeMaxRightLoc - barcodeMinLeftLoc
      var icicleNodeObject = {x: barcodeMinLeftLoc, width: barcodeMaxWidth}
      return icicleNodeObject
    },
    //  获取当前对齐的最深的子树部分
    get_aligned_subtree: function () {
      var self = this
      return self.alignedNodeObjArray
    },
    //  获取当前的状态, 是否存在节点正在对齐的状态
    get_current_aligned_state: function () {
      var self = this
      var alignedNodeIdArray = self.alignedNodeIdArray
      var alignedState = false
      if (alignedNodeIdArray.length > 0) {
        alignedState = true
      }
      return alignedState
    },
    //  在操作的节点数组中增加节点
    add_operation_item: function (nodeData, barcodeTreeId, srcElement) {
      var self = this
      var operationItemList = self.operationItemList
      var nodeObjId = nodeData.id
      var nodeObjDepth = nodeData.depth
      var elementExisted = false
      for (var oI = 0; oI < operationItemList.length; oI++) {
        var testNodeData = operationItemList[oI].nodeData
        if ((nodeObjId === testNodeData.id) && (nodeObjDepth === testNodeData.depth)) {
          elementExisted = true
          break
        }
      }
      if (!elementExisted) {
        operationItemList.push({'nodeData': nodeData, 'barcodeTreeId': barcodeTreeId, 'srcElement': srcElement})
      }
    },
    //  在操作的节点数组中删除节点
    remove_operation_item: function (nodeData) {
      var self = this
      var operationItemList = self.operationItemList
      var nodeObjId = nodeData.id
      var nodeObjDepth = nodeData.depth
      for (var oI = 0; oI < operationItemList.length; oI++) {
        var testNodeData = operationItemList[oI].nodeData
        if ((nodeObjId === testNodeData.id) && (nodeObjDepth === testNodeData.depth)) {
          operationItemList.splice(oI, 1)
          break
        }
      }
      var updateOperationItem = operationItemList[operationItemList.length - 1]
      return updateOperationItem
    },
    //  获取操作的节点数组
    get_operation_item: function () {
      var self = this
      return self.operationItemList
    },
    add_barcode_dataset: function (barcodeModelArray) {
      var self = this
      window.begin_add_barcodetree44 = new Date()
      for (var bI = 0; bI < barcodeModelArray.length; bI++) {
        var barcodeModel = barcodeModelArray[bI]
        self.adjust_barcode_model(barcodeModel)
        self.update_statistics_info(barcodeModel)
        barcodeModel.set('basedModel', self.basedModel)
        // 将barcodeModel加入到collection中之后则barcode就直接绘制出来了, 所以在add之前需要将barcode的height改变
        self.update_barcode_model_height(barcodeModel)
        self.collapse_all_subtree(barcodeModel)
        self.tablelens_single_subtree(barcodeModel)
        self.add(barcodeModel)
      }
      self.updateBarcodeNodexMaxX()
      self.align_multi_subtree()
      if (self.sortSimilarityConfigState) {
        self.sort_accord_similarity()
      }
      if (self.sortExistedConfigObj != null) {
        var sortExistedConfigObj = self.sortExistedConfigObj
        self.sort_barcode_model(sortExistedConfigObj.comparedNodeId, sortExistedConfigObj.parameter)
      }
      self.update_barcode_location()
      //  更新barcodeTree中的节点
      //  在barcode collection中增加新的barcode model, 需要对于barcode model中的节点的高度进行相应的调节
      // self.align_added_model()
    },
    /**
     * 设置完整的层次结构数据对象
     * @param categoryNodeObjArray
     */
    set_category_nodeobj_array: function (categoryNodeObjArray) {
      var self = this
      self.categoryNodeObjArray = categoryNodeObjArray
    },
    //  重置barcode collection中所有的参数
    reset_all_barcode_collection_parameter: function () {
      var self = this
      self.subtreeNodeArrayObj = {}
      self.alignedNodeIdArray = []
      self.alignedNodeObjArray = []
      self.selectedNodesId = {}
      self.basedModel = null
      self.collapsedNodeIdArray = []
    },
    //  在histogram.main.js中取消选择一个barcode文件, 顺序需要做的是update_barcode_location
    //  删除对应的barcode.model
    //  相应的改变barcode的位置
    remove_barcode_dataset: function (barcodeTreeId, alignExistTree) {
      var self = this
      var filteredModel = self.where({'barcodeTreeId': barcodeTreeId})
      if (filteredModel.length !== 0) {
        self.remove(self.where({'barcodeTreeId': barcodeTreeId}))
        self.updateBarcodeNodexMaxX()
        self.update_barcode_location()
        if ((typeof (alignExistTree) === 'undefined') || (alignExistTree)) {
          self.align_multi_subtree()
        }
      }
    },
    //  trigger信号UPDATE_BARCODE_ATTR, 更新barcode视图
    update_barcode_view: function () {
      var self = this
      self.update_barcode_location()
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_ATTR'])
    },
    //  trigger出的信号所表示的是已经完成了对于barcode数据的准备, 接下来app.view中开始调用render_barcodetree_view进行渲染
    request_barcode_dataset: function () {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')['BEGIN_RENDER_BARCODE_VIEW'])
    },
    reset_attribute: function () {
      var self = this
      self.subtreeNodeArrayObj = {}
      self.alignedNodeIdArray = []
      self.alignedNodeObjArray = []
      self.basedModel = null
      self.each(function (model) {
        model.reset_attribute()
      })
    },
    //  获取从superTree上选择的节点的数组
    get_supertree_selected_nodes_id: function () {
      var self = this
      return self.superTreeSelectedNodesId
    },
    //  获取选择的节点的数组
    get_selected_nodes_id: function () {
      var self = this
      return self.selectedNodesId
    },
    //  获取折叠的节点的数组
    get_collapsed_nodes_id: function () {
      var self = this
      return self.collapsedNodeIdArray
    },
    //  设置当前的对齐节点是否显示summary的状态
    set_summary_state: function (nodeObjId, summary_state) {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
        if (alignedNodeObjArray[aI].alignedNodeId === nodeObjId) {
          alignedNodeObjArray[aI].summary_state = summary_state
        }
      }
    },
    //  获取当前的对齐节点是否显示summary的状态
    get_summary_state: function (nodeObjId) {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
        if (alignedNodeObjArray[aI].alignedNodeId === nodeObjId) {
          if (typeof (alignedNodeObjArray[aI].summary_state) !== 'undefined') {
            return alignedNodeObjArray[aI].summary_state
          } else {
            return false
          }
        }
      }
      return false
    },
    //  设置当前的节点是否比较子树节点数目的状态
    set_node_num_comparison_state: function (nodeObjId, node_num_comparison_state) {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
        if (alignedNodeObjArray[aI].alignedNodeId === nodeObjId) {
          alignedNodeObjArray[aI].node_num_comparison_state = node_num_comparison_state
        }
      }
    },
    //  获取当前的节点是否比较子树节点数目的状态
    get_node_num_comparison_state: function (nodeObjId) {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
        if (alignedNodeObjArray[aI].alignedNodeId === nodeObjId) {
          if (typeof (alignedNodeObjArray[aI].node_num_comparison_state) !== 'undefined') {
            return alignedNodeObjArray[aI].node_num_comparison_state
          } else {
            return false
          }
        }
      }
      return false
    },
    //  获取当前节点的对齐状态, 该节点是否已经对齐
    get_aligned_state: function (nodeObjId) {
      var self = this
      var alignedNodeIdArray = self.alignedNodeIdArray
      //  判断该节点是否已经对齐
      if (alignedNodeIdArray.indexOf(nodeObjId) === -1) {
        //  alignedNodeIdArray中不存在该节点, 说明没有对齐
        return false
      } else {
        //  alignedNodeIdArray中存在该节点, 说明没有对齐
        return true
      }
    },
    //  获取节点的选择状态
    get_selection_state: function (nodeObjId, nodeObjDepth) {
      var self = this
      var selectedNodesIdObj = self.selectedNodesId
      var selectionState = Config.get('CONSTANT')['NOT_SELECTED']
      if (typeof (selectedNodesIdObj[nodeObjId]) === 'undefined') {
        selectionState = Config.get('CONSTANT')['NOT_SELECTED']
      } else {
        selectionState = selectedNodesIdObj[nodeObjId].selectedType
      }
      return selectionState
    },
    add_selected_node_id: function (nodeObjId, nodeObjDepth, siblingNodesArray) {
      var self = this
      var selectedNodesIdObj = self.selectedNodesId
      //  该节点之前没有被选择
      selectedNodesIdObj[nodeObjId] = {
        selectedType: Config.get('CONSTANT')['NODE'],
        depth: nodeObjDepth,
        selectedChildrenNodeIdArray: [],
        selectedSiblingNodeObjArray: siblingNodesArray
      }
    },
    //  在superTree视图中点击barcode节点选中
    add_supertree_selected_subtree_id: function (nodeObjId, nodeObjDepth) {
      var self = this
      var superTreeSelectedNodesId = self.superTreeSelectedNodesId
      superTreeSelectedNodesId[nodeObjId] = nodeObjDepth
    },
    //  在superTree视图中点击barcode节点取消选中
    remove_supertree_selected_subtree_id: function (nodeObjId) {
      var self = this
      var superTreeSelectedNodesId = self.superTreeSelectedNodesId
      delete superTreeSelectedNodesId[nodeObjId]
    },
    //  清空选择的barcode节点
    clear_selected_subtree_id: function () {
      var self = this
      self.selectedNodesId = {}
    },
    //  清空选择的节点序列
    clear_operation_item: function () {
      var self = this
      self.operationItemList = []
    },
    //  在singleview视图中点击barcode节点选中
    add_selected_subtree_id: function (nodeObjId, nodeObjDepth, subtreeNodeIdArray, siblingNodesArray) {
      var self = this
      var selectedNodesIdObj = self.selectedNodesId
      // 该节点之前作为node被选择, 那么需要转换为subtree的选择模式
      selectedNodesIdObj[nodeObjId] = {
        selectedType: Config.get('CONSTANT')['SUBTREE'],
        depth: nodeObjDepth,
        selectedChildrenNodeIdArray: subtreeNodeIdArray,
        selectedSiblingNodeObjArray: siblingNodesArray
      }
    },
    remove_selection: function (nodeObjId) {
      var self = this
      var selectedNodesIdObj = self.selectedNodesId
      removeNodes(selectedNodesIdObj, nodeObjId)
      //  删除该节点以及该节点的孩子节点
      function removeNodes(selectedNodesIdObj, nodeObjId) {
        //  先根据节点找到包含该节点的部分, 要删除的节点的id是nodeObjId, 以及其子孙的节点
        var removedChildrenNodeIdArray = selectedNodesIdObj[nodeObjId].selectedChildrenNodeIdArray
        if (typeof (removedChildrenNodeIdArray) !== 'undefined') {
          for (var item in selectedNodesIdObj) {
            if (item !== nodeObjId) {
              var selectedChildrenNodeIdArray = selectedNodesIdObj[item].selectedChildrenNodeIdArray
              var rootNodeObjIndex = getNodeIndex(selectedChildrenNodeIdArray, nodeObjId)
              if (rootNodeObjIndex !== -1) {
                selectedChildrenNodeIdArray.splice(rootNodeObjIndex, 1)
                for (var rI = 0; rI < removedChildrenNodeIdArray.length; rI++) {
                  var findNodeIndex = getNodeIndex(selectedChildrenNodeIdArray, removedChildrenNodeIdArray[rI].id)
                  selectedChildrenNodeIdArray.splice(findNodeIndex, 1)
                }
              }
            }
          }
        }
        //  删除其他选中节点中的子孙节点中所存在的节点之后, 进一步删除该节点
        delete selectedNodesIdObj[nodeObjId]
      }

      //  获取barcode的节点的index值
      function getNodeIndex(nodeObjArray, nodeObjId) {
        for (var nI = 0; nI < nodeObjArray.length; nI++) {
          if (nodeObjArray[nI].id === nodeObjId) {
            return nI
          }
        }
        return -1
      }
    },
    /**
     * 使用tablelens的方法对于BarcodeTree进行变形
     */
    tablelens_interested_subtree: function (nodeId) {
      var self = this
      var tablelensSubtreeArray = self.tablelensSubtreeArray
      var rootIdIndex = tablelensSubtreeArray.indexOf(nodeId)
      if (rootIdIndex !== -1) {
        tablelensSubtreeArray.splice(rootIdIndex, 1)
      } else {
        tablelensSubtreeArray.push(nodeId)
      }
      var ratioAndSubtreeObj = self.get_focus_ratio_obj(tablelensSubtreeArray)
      self.each(function (model) {
        model.tablelens_interested_subtree(tablelensSubtreeArray, ratioAndSubtreeObj)
      })
      self.update_all_barcode_view()
      self.trigger_render_supertree()
      return (rootIdIndex === -1)
    },
    /**
     * 按照现有的tablelens方法使用tablelens的方法对于传入的进行变形
     */
    tablelens_single_subtree: function (barcodeModel) {
      var self = this
      var tablelensSubtreeArray = self.tablelensSubtreeArray
      var ratioAndSubtreeObj = self.get_focus_ratio_obj(tablelensSubtreeArray)
      if (ratioAndSubtreeObj != null) {
        barcodeModel.tablelens_interested_subtree(tablelensSubtreeArray, ratioAndSubtreeObj)
      }
    },
    /**
     * 判断一个节点是否在选择的节点数组范围之内
     * @param nodeId
     */
    in_selected_array: function (nodeId) {
      var self = this
      var selectedNodesIdObj = self.selectedNodesId
      if (typeof (selectedNodesIdObj[nodeId]) === 'undefined') {
        return false
      } else {
        return true
      }
    },
    /**
     *  判断一个节点是否在tablelens的范围内
     */
    in_tablelens_array: function (nodeId) {
      var self = this
      var tablelensSubtreeArray = self.tablelensSubtreeArray
      var rootIdIndex = tablelensSubtreeArray.indexOf(nodeId)
      if (rootIdIndex === -1) {
        return false
      } else {
        return true
      }
    },
    /**
     *
     */
    get_focus_ratio_obj: function (tablelens_subtree_array) {
      var self = this
      var categoryNodeObjArray = self.categoryNodeObjArray
      if ((categoryNodeObjArray === null) || (categoryNodeObjArray.length === 0)) {
        return null
      }
      var barcodetreeViewHeight = Variables.get('barcodetreeViewHeight')
      var barcodetreeViewWidth = Variables.get('barcodetreeViewWidth')
      var focusTreeLength = 0
      var subtreeObjArray = []
      for (var tI = 0; tI < tablelens_subtree_array.length; tI++) {
        var subtreeRootId = tablelens_subtree_array[tI]
        var subtreeObj = get_subtree_length(subtreeRootId, categoryNodeObjArray)
        subtreeObjArray.push(subtreeObj)
        focusTreeLength = focusTreeLength + subtreeObj.subtreeLength
      }
      var barcodetreeViewWidth = Variables.get('barcodetreeViewWidth')
      var barcodePaddingLeft = Variables.get('barcodePaddingLeft')
      var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
      var categoryPaddingRight = Config.get('TABLE_LENS_PARA')['category_padding_right']
      barcodetreeViewWidth = barcodetreeViewWidth - barcodePaddingLeft - barcodeTextPaddingLeft - categoryPaddingRight
      var barcodeTreeOriginalWidth = get_subtree_length(categoryNodeObjArray[0].id, categoryNodeObjArray).subtreeLength
      var defaultRatio = barcodetreeViewWidth / barcodeTreeOriginalWidth
      var ratioObj = get_tablelens_ratio(barcodeTreeOriginalWidth, focusTreeLength, barcodetreeViewWidth, defaultRatio)
      var focusRatio = ratioObj.focusRatio
      var contextRatio = ratioObj.contextRatio
      var ratioAndSubtreeObj = {ratioObj: ratioObj, subtreeObjArray: subtreeObjArray}
      return ratioAndSubtreeObj
      //  计算得到tablelens的放大和压缩的比率
      function get_tablelens_ratio(wholeTreeLength, focusTreeLength, viewWidth, defaultRatio) {
        var tablelensMinimumRatio = Config.get('TABLE_LENS_PARA')['minimum_ratio']
        tablelensMinimumRatio = defaultRatio * 0.75
        var focusRatio = 1
        var contextRatio = (viewWidth - focusTreeLength * focusRatio) / (wholeTreeLength - focusTreeLength)// 按照原始的比率进行放大, 所以在视图中和原始的树的长度是相同的
        if (contextRatio > tablelensMinimumRatio) {
          // 改变之后的ratio大于tablelens最小的比率, 那么就按照change的ratio进行计算
          //  改变之后的focusRatio是1, 此时是默认的情况, focusRatio是1, contextRatio是根据focusRatio计算得到的结果
        } else {
          //  否则就重新计算change的ratio, 按照tablelens的最小的比率计算focus的ratio的大小
          var contextViewLength = (wholeTreeLength - focusTreeLength) * tablelensMinimumRatio
          var focusViewLength = viewWidth - contextViewLength
          var focusRatio = focusViewLength / focusTreeLength
          contextRatio = tablelensMinimumRatio
        }
        return {focusRatio: focusRatio, contextRatio: contextRatio}
      }

      //  计算得到子树的长度
      function get_subtree_length(subtreeRootId, categoryNodeObjArray) {
        var subtreeLength = 0
        var subtreeRootDepth = null
        var barcodeWidthArray = window.barcodeWidthArray
        var subtreeAttrArray = []
        var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
        var subtreeObj = {}
        for (var cI = 0; cI < categoryNodeObjArray.length; cI++) {
          if (categoryNodeObjArray[cI].depth === subtreeRootDepth) {
            subtreeObj.endIndex = cI - 1
            break
          }
          if (subtreeRootDepth != null) {
            if (barcodeWidthArray[categoryNodeObjArray[cI].depth] !== 0) {
              subtreeLength = subtreeLength + barcodeWidthArray[categoryNodeObjArray[cI].depth] + barcodeNodeInterval
            }
          }
          if (categoryNodeObjArray[cI].id === subtreeRootId) {
            subtreeRootDepth = categoryNodeObjArray[cI].depth
            subtreeObj.startIndex = cI
          }
          //  对于root节点, 可以一直读取到最终的节点位置上
          if (cI === categoryNodeObjArray.length) {
            subtreeObj.endIndex = cI
            break
          }
        }
        subtreeObj.subtreeLength = subtreeLength
        return subtreeObj
      }
    },
    /**
     *
     * @param nodeObjId
     * @param nodeObjDepth
     * @param subtreeNodeIdArray
     * @param siblingNodesArray
     */
    add_selected_nodes_id: function (nodeObjId, nodeObjDepth, subtreeNodeIdArray, siblingNodesArray) {
      var self = this
      var selectedNodesIdObj = self.selectedNodesId
      if ((typeof(selectedNodesIdObj[nodeObjId]) === 'undefined') && (!selectedAsChildrenNode(selectedNodesIdObj, nodeObjId))) {
        //  该节点之前没有被选择
        selectedNodesIdObj[nodeObjId] = {
          selectedType: Config.get('CONSTANT')['NODE'],
          depth: nodeObjDepth,
          selectedChildrenNodeIdArray: [],
          selectedSiblingNodeObjArray: siblingNodesArray
        }
      }
      else if (selectedAsNode(selectedNodesIdObj, nodeObjId)) {
        // 该节点之前作为node被选择, 那么需要转换为subtree的选择模式
        selectedNodesIdObj[nodeObjId] = {
          selectedType: Config.get('CONSTANT')['SUBTREE'],
          depth: nodeObjDepth,
          selectedChildrenNodeIdArray: subtreeNodeIdArray,
          selectedSiblingNodeObjArray: siblingNodesArray
        }
      } else if (selectedNodesIdObj[nodeObjId]['selectedType'] === Config.get('CONSTANT')['SUBTREE']) {
        //  该节点之前作为subtree被选择, 那么需要去除掉该节点以及该节点的孩子节点
        removeNodes(selectedNodesIdObj, nodeObjId)
      }
      //  trigger信号对于每一个视图更新barcode.single.view中的状态
      self.each(function (model) {
        console.log('model selection_change_update')
        model.selection_change_update()
      })
      //  删除该节点以及该节点的孩子节点
      function removeNodes(selectedNodesIdObj, nodeObjId) {
        console.log('remove nodes')
        //  先根据节点找到包含该节点的部分, 要删除的节点的id是nodeObjId, 以及其子孙的节点
        var removedChildrenNodeIdArray = selectedNodesIdObj[nodeObjId].selectedChildrenNodeIdArray
        for (var item in selectedNodesIdObj) {
          if (item !== nodeObjId) {
            var selectedChildrenNodeIdArray = selectedNodesIdObj[item].selectedChildrenNodeIdArray
            var rootNodeObjIndex = getNodeIndex(selectedChildrenNodeIdArray, nodeObjId)
            if (rootNodeObjIndex !== -1) {
              selectedChildrenNodeIdArray.splice(rootNodeObjIndex, 1)
              for (var rI = 0; rI < removedChildrenNodeIdArray.length; rI++) {
                var findNodeIndex = getNodeIndex(selectedChildrenNodeIdArray, removedChildrenNodeIdArray[rI].id)
                selectedChildrenNodeIdArray.splice(findNodeIndex, 1)
              }
            }
          }
        }
        //  删除其他选中节点中的子孙节点中所存在的节点之后, 进一步删除该节点
        delete selectedNodesIdObj[nodeObjId]
      }

      //  获取barcode的节点的index值
      function getNodeIndex(nodeObjArray, nodeObjId) {
        for (var nI = 0; nI < nodeObjArray.length; nI++) {
          if (nodeObjArray[nI].id === nodeObjId) {
            return nI
          }
        }
        return -1
      }

      //  判断该节点之前是否作为单独的节点被选中
      function selectedAsNode(selectedNodesIdObj, nodeObjId) {
        //  判断该节点是否作为根节点被选中
        if (typeof (selectedNodesIdObj[nodeObjId]) !== 'undefined') {
          if (selectedNodesIdObj[nodeObjId]['selectedType'] === Config.get('CONSTANT')['NODE']) {
            return true
          }
          //  如果已经被当做subtree的状态选中, 那么需要返回false
          if (selectedNodesIdObj[nodeObjId]['selectedType'] === Config.get('CONSTANT')['SUBTREE']) {
            return false
          }
        }
        return selectedAsChildrenNode(selectedNodesIdObj, nodeObjId)
      }

      //  判断该节点是否作为孩子节点被选中
      function selectedAsChildrenNode(selectedNodesIdObj, nodeObjId) {
        console.log('selectedNodesIdObj', selectedNodesIdObj)
        for (var item in selectedNodesIdObj) {
          var selectedChildrenNodeIdArray = selectedNodesIdObj[item].selectedChildrenNodeIdArray
          if (getNodeIndex(selectedChildrenNodeIdArray, nodeObjId) !== -1) {
            return true
          }
        }
        return false
      }
    },
    // update_barcode_height: function () {
    //   var self = this
    //   self.each(function (barcodeModel) {
    //     barcodeModel.update_height()
    //   })
    // },
    /**
     * 更新对于所增加的barcode的相关统计信息, 主要包括在不同的层级范围内的节点的数量信息
     */
    update_statistics_info: function (barcodeModel) {
      var maxDepth = Variables.get('maxDepth')
      var barcodeNodeAttrArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        barcodeNodeAttrArray = barcodeModel.get('barcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        barcodeNodeAttrArray = barcodeModel.get('compactBarcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
        barcodeNodeAttrArray = barcodeModel.get('categoryNodeObjArray')
      }
      var leveledNodeNumArray = []
      for (var mI = 0; mI <= maxDepth; mI++) {
        leveledNodeNumArray.push(0)
      }
      //  计算barcode节点数组中不同层级的节点的数量
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        var nodeDepth = barcodeNodeAttrArray[bI].depth
        for (var ibI = nodeDepth; ibI <= maxDepth; ibI++) {
          leveledNodeNumArray[ibI] = leveledNodeNumArray[ibI] + 1
        }
      }
      //  得到所有的层次结构数据中不同层次节点的数目的最大值, 从而用于计算对应的scale
      var maxLeveledNumArray = Variables.get('maxLeveledNumArray')
      if (maxLeveledNumArray.length === 0) {
        maxLeveledNumArray = leveledNodeNumArray
      } else {
        for (var lI = 0; lI < leveledNodeNumArray.length; lI++) {
          if (leveledNodeNumArray[lI] > maxLeveledNumArray[lI]) {
            maxLeveledNumArray[lI] = leveledNodeNumArray[lI]
          }
        }
      }
      Variables.set('maxLeveledNumArray', maxLeveledNumArray)
    },
    align_multi_subtree: function () {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      var alignedDeferArray = []
      // inner_align_single_subtree(alignedNodeObjArray, 0)
      // function inner_align_single_subtree(alignedNodeObjArray, aI){
      //   var deferObj = $.Deferred()
      //   if(typeof(alignedNodeObjArray[aI]) !== 'undefined'){
      //     var rootId = alignedNodeObjArray[ aI ].alignedNodeId
      //     var rootLevel = alignedNodeObjArray[ aI ].alignedNodeLevel
      //     var rootCategory = alignedNodeObjArray[ aI ].alignedNodeCategory
      //     window.Datacenter.buildSuperTree(rootId, rootLevel, rootCategory, deferObj)
      //     alignedDeferArray.push(deferObj)
      //     $.when(deferObj)
      //       .done(function () {
      //         //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
      //         self.compute_aligned_subtree_range()
      //         inner_align_single_subtree(alignedNodeObjArray, (aI + 1))
      //       })
      //       .fail(function () { console.log('defer fail') })
      //   }
      // }

      // for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
      //   var deferObj = $.Deferred()
      //   var rootId = alignedNodeObjArray[aI].alignedNodeId
      //   var rootLevel = alignedNodeObjArray[aI].alignedNodeLevel
      //   var rootCategory = alignedNodeObjArray[aI].alignedNodeCategory
      //   var alignedLevel = Variables.get('alignedLevel')
      //   window.Datacenter.buildSuperTree(rootId, rootLevel, rootCategory, deferObj, alignedLevel)
      //   alignedDeferArray.push(deferObj)
      //   $.when(deferObj)
      //     .done(function () {
      //       //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
      //       self.compute_aligned_subtree_range()
      //       // self.update_all_barcode_view()
      //     })
      //     .fail(function () {
      //       console.log('defer fail')
      //     })
      // }
      var finishAlignDeferObj = $.Deferred()
      $.when(finishAlignDeferObj)
        .done(function () {
          //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
          // self.compute_aligned_subtree_range()
          self.update_all_barcode_view()
          self.trigger_super_view_update()
          self.update_barcode_selection_state()
          window.finish_add_barcodetree404 = new Date()
          console.log('add tree and align time', window.finish_add_barcodetree404.getDifference(window.begin_add_barcodetree44))
        })
        .fail(function () {
          console.log('defer fail')
        })
      if (self.length > 0) {
        //  如果仍然存在选择的barcodeTree
        self.align_existed_barcode_subtree(finishAlignDeferObj)
      } else {
        //  所有选择已经被清空
        self.update_all_barcode_view()
        self.trigger_super_view_update()
        self.trigger_close_supertree_view()
        self.reset_all_barcode_collection_parameter()
      }
      // if (alignedDeferArray.length !== 0) {
      //   $.when.apply(null, alignedDeferArray)
      //     .done(function () {
      //       //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
      //       self.compute_aligned_subtree_range()
      //       self.update_all_barcode_view()
      //     })
      //     .fail(function () {
      //       console.log('defer fail')
      //     })
      // }
    },
    align_existed_barcode_subtree: function (finish_align_defer_obj) {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      var beginAlignNodeIndex = 0
      if (alignedNodeObjArray.length > 0) {
        inner_align_single_existed_barcode_subtree(alignedNodeObjArray, beginAlignNodeIndex, finish_align_defer_obj)
      } else {
        finish_align_defer_obj.resolve()
      }
      function inner_align_single_existed_barcode_subtree(aligned_node_obj_array, align_node_index, finish_align_defer_obj) {
        if (align_node_index === aligned_node_obj_array.length) {
          finish_align_defer_obj.resolve()
          return
        }
        var deferObj = $.Deferred()
        var rootId = aligned_node_obj_array[align_node_index].alignedNodeId
        var rootLevel = aligned_node_obj_array[align_node_index].alignedNodeLevel
        var rootCategory = aligned_node_obj_array[align_node_index].alignedNodeCategory
        var alignedLevel = Variables.get('alignedLevel')
        window.Datacenter.buildSuperTree(rootId, rootLevel, rootCategory, deferObj, alignedLevel)
        $.when(deferObj)
          .done(function () {
            //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
            self.compute_aligned_subtree_range()
            inner_align_single_existed_barcode_subtree(aligned_node_obj_array, align_node_index + 1, finish_align_defer_obj)
            // self.update_all_barcode_view()
          })
          .fail(function () {
            console.log('defer fail')
          })
      }
    },
    aligned_current_tree: function () {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      if (alignedNodeObjArray.length === 0) {
        var nodeId = 'node-0-root'
        var depth = 0
        var category = 'root'
        var alignedLevel = Variables.get('alignedLevel')
        var finishAlignDeferObj = $.Deferred()
        $.when(finishAlignDeferObj)
          .done(function () {
            self.update_all_barcode_view()
            self.trigger_render_supertree()
          })
        self.add_super_subtree(nodeId, depth, category, alignedLevel, finishAlignDeferObj)
      } else {
        for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
          var alignedNodeId = alignedNodeObjArray[aI].alignedNodeId
          var alignedNodeLevel = alignedNodeObjArray[aI].alignedNodeLevel
          var alignedNodeCategory = alignedNodeObjArray[aI].alignedNodeCategory
          var alignedLevel = Variables.get('alignedLevel')
          var finishAlignDeferObj = $.Deferred()
          $.when(finishAlignDeferObj)
            .done(function () {
              self.update_all_barcode_view()
              self.trigger_render_supertree()
            })
          self.add_super_subtree(alignedNodeId, alignedNodeLevel, alignedNodeCategory, alignedLevel, finishAlignDeferObj)
        }
      }
    },
    /**
     * 在singlebarcodetree视图中点击节点进行选中子树的对齐
     * @param rootId
     * @param rootLevel
     * @param rootCategory
     */
    add_super_subtree: function (rootId, rootLevel, rootCategory, alignedLevel, finishAlignDeferObj) {
      var self = this
      //  alignedNodeIdArray记录已经对齐的节点数组
      var alignedNodeIdArray = self.alignedNodeIdArray
      var alignedNodeObjArray = self.alignedNodeObjArray
      var addedSubtreeDeferObj = $.Deferred()
      //  当addedSubtreeDeferObj对象被resolved的时候, 标志着对齐的子树节点数组被插入到子树的节点数组中, 并且相应的状态已经被更新
      $.when(addedSubtreeDeferObj)
        .done(function () {
          //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
          self.compute_aligned_subtree_range()
          // window.Datacenter.barcodeCollection.update_all_barcode_view()
          finishAlignDeferObj.resolve()
          window.finish_build_supertree_collection511 = new Date()
          console.log('build supertree', window.finish_build_supertree_collection511.getDifference(window.start_build_supertree_collection529))
        })
        .fail(function () {
          console.log('defer fail')
        })
      if (alignedNodeIdArray.indexOf(rootId) === -1) {
        alignedNodeIdArray.push(rootId)
        alignedNodeObjArray.push({
          alignedNodeId: rootId,
          alignedNodeLevel: rootLevel,
          alignedNodeCategory: rootCategory
        })
      }
      window.start_build_supertree_collection529 = new Date()
      window.Datacenter.buildSuperTree(rootId, rootLevel, rootCategory, addedSubtreeDeferObj, alignedLevel)
    },
    /**
     * 在singleBarcodeTree视图中再次点击节点取消选中子树的对齐
     */
    remove_super_subtree: function (rootId, rootLevel, rootCategory, alignedLevel, finishRemoveAlignDeferObj) {
      var self = this
      //  alignedNodeIdArray记录已经对齐的节点数组
      var alignedNodeIdArray = self.alignedNodeIdArray
      var alignedNodeObjArray = self.alignedNodeObjArray
      var rootIdIndex = self.alignedNodeIdArray.indexOf(rootId)
      if (rootIdIndex !== -1) {
        self.alignedNodeIdArray.splice(rootIdIndex, 1)
        removeNodeObjFromObjArray(rootId, self.alignedNodeObjArray)
        // if (alignedNodeIdArray.length === 0) {
        //   self.alignedNodeIdArray = ['node-0-root']
        //   self.alignedNodeObjArray = [{
        //     alignedNodeId: 'node-0-root',
        //     alignedNodeLevel: 0,
        //     alignedNodeCategory: 'root'
        //   }]
        //   alignedLevel = 0
        //   Variables.set('alignedLevel', alignedLevel)
        // }
        //  当没有align对齐的节点的情况下, 将root节点添加到align节点的数组中
        console.log('alignedNodeIdArray', alignedNodeIdArray.length)
      } else {
        finishRemoveAlignDeferObj.resolve()
      }
      if (alignedNodeIdArray.length === 0) {
        refresh_existed_barcodtree()
        self.trigger_close_supertree_view()
      } else {
        //  如果仍然存在需要对齐的节点
        align_existed_subtree(rootId, rootLevel, rootCategory, alignedLevel, finishRemoveAlignDeferObj)
      }
      //  重新更新现在的barcodeTree
      function refresh_existed_barcodtree() {
        var url = 'barcode_original_data'
        var selectItemNameArray = Variables.get('selectItemNameArray')
        var alignExistTree = false
        //  在这里的更新是全部删除, 因此是不需要像逐个删除barcodeTree一样重新将所有的树对齐
        window.Datacenter.requestDataCenter(url, selectItemNameArray, alignExistTree)
      }

      //  对齐现在存在的需要对齐的节点
      function align_existed_subtree(rootId, rootLevel, rootCategory, alignedLevel, finishRemoveAlignDeferObj) {
        var addedSubtreeDeferObj = $.Deferred()
        //  当addedSubtreeDeferObj对象被resolved的时候, 标志着对齐的子树节点数组被插入到子树的节点数组中, 并且相应的状态已经被更新
        $.when(addedSubtreeDeferObj)
          .done(function () {
            //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
            self.compute_aligned_subtree_range()
            finishRemoveAlignDeferObj.resolve()
            // Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
          })
          .fail(function () {
            console.log('defer fail')
          })
        //  根据选择对齐的barcode的节点层级更新当前的对齐层级, 当前的对齐层级是最深的层级
        // var nodeDepth = rootLevel
        // var currentAligneLevel = Variables.get('alignedLevel')
        // if (currentAligneLevel < nodeDepth) {
        //   Variables.set('alignedLevel', nodeDepth)
        // }
        console.log('remove_super_subtree')
        // window.Datacenter.buildSuperTree(rootId, rootLevel, rootCategory, addedSubtreeDeferObj, alignedLevel)
        window.Datacenter.removeSuperTree(rootId, rootLevel, rootCategory, addedSubtreeDeferObj, alignedLevel)
      }

      //  从nodeObj数组中删除节点id为rootId的节点
      function removeNodeObjFromObjArray(rootId, alignedNodeObjArray) {
        for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
          if (alignedNodeObjArray[aI].alignedNodeId === rootId) {
            alignedNodeObjArray.splice(aI, 1)
            break
          }
        }
      }
    },
    /**
     *
     */
    add_all_super_subtree: function () {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      var alignDeferedObjArray = []
      for (var dI = 0; dI < alignedNodeObjArray.length; dI++) {
        alignDeferedObjArray.push($.Deferred())
      }
      // window.Datacenter.buildSuperTree(alignedNodeObjArray[ 0 ].alignedNodeId, alignedNodeObjArray[ 0 ].alignedNodeLevel, alignedNodeObjArray[ 0 ].alignedNodeCategory, alignDeferedObjArray[ 0 ])
      // for (var aI = 1; aI < alignedNodeObjArray.length; aI++) {
      //   var alignedNodeId = alignedNodeObjArray[ aI ].alignedNodeId
      //   var alignedNodeLevel = alignedNodeObjArray[ aI ].alignedNodeLevel
      //   var alignedNodeCategory = alignedNodeObjArray[ aI ].alignedNodeCategory
      //   var deferedObj = alignDeferedObjArray[ aI ]
      //   $.when(alignDeferedObjArray[ aI - 1 ])
      //     .done(function () {
      //       window.Datacenter.buildSuperTree(alignedNodeId, alignedNodeLevel, alignedNodeCategory, deferedObj)
      //     })
      //     .fail(function () { console.log('defer fail') })
      // }
      if (alignDeferedObjArray.length > 0) {
        $.when(alignDeferedObjArray[alignDeferedObjArray.length - 1])
          .done(function () {
            //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
            self.compute_aligned_subtree_range()
          })
          .fail(function () {
            console.log('defer fail')
          })
        var init_aligned_obj_index = 0
        inner_align_super_subtree(alignedNodeObjArray, alignDeferedObjArray, init_aligned_obj_index)
      } else {
        self.compute_aligned_subtree_range()
      }
      function inner_align_super_subtree(alignedNodeObjArray, alignDeferedObjArray, aligned_obj_index) {
        if (aligned_obj_index === 0) {
          //  第一个调用buildSuperTree方法不需要等待上一个alignedSuperTree结束
          window.Datacenter.buildSuperTree(alignedNodeObjArray[aligned_obj_index].alignedNodeId, alignedNodeObjArray[aligned_obj_index].alignedNodeLevel, alignedNodeObjArray[aligned_obj_index].alignedNodeCategory, alignDeferedObjArray[aligned_obj_index])
          inner_align_super_subtree(alignedNodeObjArray, alignDeferedObjArray, aligned_obj_index + 1)
        } else {
          //  其他的调用buildSuperTree方法需要等待上一个alignedSuperTree结束
          if (aligned_obj_index < alignDeferedObjArray.length) {
            $.when(alignDeferedObjArray[aligned_obj_index - 1])
              .done(function () {
                window.Datacenter.buildSuperTree(alignedNodeObjArray[aligned_obj_index].alignedNodeId, alignedNodeObjArray[aligned_obj_index].alignedNodeLevel, alignedNodeObjArray[aligned_obj_index].alignedNodeCategory, alignDeferedObjArray[aligned_obj_index])
                inner_align_super_subtree(alignedNodeObjArray, alignDeferedObjArray, aligned_obj_index + 1)
              })
              .fail(function () {
                console.log('defer fail')
              })
          }
        }
      }
    },
    /**
     *
     */
    compute_aligned_subtree_range: function () {
      var self = this
      var alignedNodeIdArray = self.alignedNodeIdArray
      if (self.length <= 0) {
        return
      }
      console.log('alignedNodeIdArray', alignedNodeIdArray)
      self.each(function (model) {
        //  计算每个barcode对齐的节点范围以及节点对齐的长度
        model.compute_single_aligned_subtree_range(alignedNodeIdArray)
        //  初始化padding node的节点位置
        model.init_padding_node_location()
      })
      //  因为打开了superTree view所以barcode的高度进行了压缩, 需要重新更新barcode的位置以及高度
      // self.update_barcode_location()
      //  需要先将padding node所占据的最大的长度计算出来, 然后更新barcode的节点位置, 因为对齐的需要, 对齐节点需要以padding node的最大节点
      //  在compact的模式下也需要计算padding node所占据的最大的长度, 因为compact模式下的padding node使用锯齿表示, 不同的锯齿的长度是不同的
      self.compute_padding_node_max_length()
      //  更新barcode节点的属性数组
      self.update_barcode_node_attr_array()
      //  更新barcode comparison视图的最大的宽度
      self.updateBarcodeNodexMaxX()
      //  更新barcode的padding节点内部的subtree的节点的范围
      self.update_barcode_padding_subtree_range()
      //  在选中另一个对齐的子树之后重新进行排序
      // var alignedRangeObjArray = null
      // if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
      //   alignedRangeObjArray = self.at(0).get('alignedRangeObjArray')
      // } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
      //   alignedRangeObjArray = self.at(0).get('compactAlignedRangeObjArray')
      // }
      // var basedModel = self.basedModel
      // if (basedModel != null) {
      //   if (alignedRangeObjArray.length !== 0) {
      //     self.sort_accord_similarity()
      //     self.trigger_color_encoding()
      //   } else {
      //     self.sort_based_as_first()
      //   }
      // }
      // self.updateBarcodeNodexMaxX()
      // self.trigger_barcode_loc()
    },
    /**
     * 更新barcode的subtree的范围
     */
    update_barcode_padding_subtree_range: function () {
      var self = this
      self.each(function (model) {
        model.update_single_barcode_padding_subtree_range()
      })
      var paddingSubtreeRangeObject = self.paddingSubtreeRangeObject
      self.each(function (model) {
        var singlePaddingSubtreeRangeObject = model.get('paddingSubtreeRangeObject')
        update_padding_subtree_range_object(singlePaddingSubtreeRangeObject, paddingSubtreeRangeObject)
      })
      //  遍历所有的paddingNodeSubtreeRange计算得到global的subtree range
      function update_padding_subtree_range_object(singlePaddingSubtreeRangeObject, paddingSubtreeRangeObject) {
        for (var item in singlePaddingSubtreeRangeObject) {
          if (typeof (paddingSubtreeRangeObject[item]) === 'undefined') {
            paddingSubtreeRangeObject[item] = JSON.parse(JSON.stringify(singlePaddingSubtreeRangeObject[item]))
          } else {
            update_min_max_range(singlePaddingSubtreeRangeObject[item], paddingSubtreeRangeObject[item])
          }
        }
      }

      //  更新所有global的paddingNode的subtree 的范围
      function update_min_max_range(single_subtree_range_obj, global_subtree_range_obj) {
        var singleCompressNodeStartX = single_subtree_range_obj.realCompressNodeStartX
        var singleCompressNodeEndX = single_subtree_range_obj.realCompressNodeEndX
        var globalCompressNodeStartX = global_subtree_range_obj.realCompressNodeStartX
        var globalCompressNodeEndX = global_subtree_range_obj.realCompressNodeEndX
        global_subtree_range_obj.realCompressNodeStartX = globalCompressNodeStartX > singleCompressNodeStartX ? singleCompressNodeStartX : globalCompressNodeStartX
        global_subtree_range_obj.realCompressNodeEndX = globalCompressNodeEndX < singleCompressNodeEndX ? singleCompressNodeEndX : globalCompressNodeEndX
      }
    },
    /**
     * 更新barcode显示节点的层级
     */
    update_displayed_level: function () {
      var self = this
      var alignedNodeIdArray = self.alignedNodeIdArray
      self.each(function (model) {
        model.update_displayed_level()
        model.update_covered_rect_obj(alignedNodeIdArray)
      })
    },
    /**
     *  更新barcode节点的属性数组
     *  更新fish eye的程度
     update_barcode_node_attr_array: function () {
      var self = this
      self.each(function (model) {
        model.update_barcode_node_array()
        // model.update_aligned_barcode_node()
        // model.update_unaligned_barcode_node()
        // model.update_align_followed_node()
        // //  再次更新padding node的位置
        // model.update_padding_node_location()
        model.get_single_comparison_result()
        model.existed_first_padding_next_view_update()
      })
      self.trigger_render_supertree()
    },
     update_click_covered_rect_attr_array: function () {
      var self = this
      self.each(function (model) {
        model.update_barcode_node_array()
        // model.update_aligned_barcode_node()
        // model.update_unaligned_barcode_node()
        // model.update_align_followed_node()
        // //  再次更新padding node的位置
        // model.update_padding_node_location()
        model.get_single_comparison_result()
        model.aligned_move_first_padding_next_view_update()
      })
      self.trigger_render_supertree()
    },
     */
    //  获取当前节点的折叠状态
    get_collapse_state: function (nodeObjId, nodeObjDepth) {
      var self = this
      var collapsedNodeIdArray = self.collapsedNodeIdArray
      if (collapsedNodeIdArray.indexOf(nodeObjId) === -1) {
        //  点击的节点作为根节点的子树没有被折叠
        return false
      } else {
        //  点击的节点作为根节点的子树已经被折叠
        return true
      }
    },
    uncollapse_subtree: function (nodeDataId, nodeDataDepth) {
      var self = this
      //  在collapsedNodeIdArray中已经存在点击的节点
      var collapsedNodeIdArray = self.collapsedNodeIdArray
      console.log('collapsedNodeIdArray', collapsedNodeIdArray)
      var nodeDataIdIndex = collapsedNodeIdArray.indexOf(nodeDataId)
      collapsedNodeIdArray.splice(nodeDataIdIndex, 1)
      self.each(function (model) {
        model.uncollapse_subtree(nodeDataId, nodeDataDepth)
      })
    },
    collapse_subtree: function (nodeDataId, nodeDataDepth) {
      var self = this
      //  在collapsedNodeIdArray中不存在点击的节点
      var collapsedNodeIdArray = self.collapsedNodeIdArray
      if (collapsedNodeIdArray.indexOf(nodeDataId) === -1) {
        collapsedNodeIdArray.push(nodeDataId)
      }
      self.each(function (model) {
        model.collapse_subtree(nodeDataId, nodeDataDepth)
      })
    },
    //  更新所有的数据和视图
    update_data_all_view: function () {
      var self = this
      self.update_barcode_node_attr_array()
      self.update_all_barcode_view()
      self.trigger_render_supertree()
    },
    //  对于新增加的barcodeModel需要折叠所有的记录的被折叠的子树
    collapse_all_subtree: function (barcodeModel) {
      var self = this
      var collapsedNodeIdArray = self.collapsedNodeIdArray
      var collapsedNodeObjArray = []
      for (var cI = 0; cI < collapsedNodeIdArray.length; cI++) {
        var collapseNodeDepth = +collapsedNodeIdArray[cI].split('-')[1]
        collapsedNodeObjArray.push({
          id: collapsedNodeIdArray[cI],
          depth: collapseNodeDepth
        })
      }
      for (var cI = 0; cI < collapsedNodeObjArray.length; cI++) {
        var collapsedNodeId = collapsedNodeObjArray[cI].id
        var collapseNodeDepth = collapsedNodeObjArray[cI].depth
        barcodeModel.collapse_subtree(collapsedNodeId, collapseNodeDepth)
      }
    },
    //  获取最上层对齐的父亲节点
    get_aligned_uppest_parent: function (node_data, operated_tree_id) {
      var self = this
      var filterModelArray = self.where({barcodeTreeId: operated_tree_id})
      if (filterModelArray.length > 0) {
        var treeDataModel = filterModelArray[0]
        var fatherCurrentNodes = treeDataModel.find_father_current_nodes(node_data)
        for (var fI = (fatherCurrentNodes.length - 1); fI >= 1; fI--) {
          if (self.get_aligned_state(fatherCurrentNodes[fI].id, fatherCurrentNodes[fI].depth)) {
            return fatherCurrentNodes[fI]
          }
        }
      }
      return null
    },
    /**
     *  更新barcode节点的属性数组
     **/
    update_barcode_node_attr_array: function () {
      var self = this
      self.each(function (model) {
        model.update_barcode_node_array() //
        model.update_aligned_barcode_node()
        //  TODO error part
        model.update_unaligned_barcode_node()
        model.update_align_followed_node()
        // // 再次更新padding node的位置
        model.update_padding_node_location()
        model.get_single_comparison_result()
        // Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
      })
      self.update_barcode_node_collection_obj()
    },
    update_click_covered_rect_attr_array: function () {
      var self = this
      self.each(function (model) {
        model.update_barcode_node_array()
        model.update_aligned_barcode_node()
        model.update_unaligned_barcode_node()
        model.update_align_followed_node()
        // //  再次更新padding node的位置
        model.update_padding_node_location()
        // model.get_single_comparison_result()
        model.aligned_move_first_padding_next_view_update()
      })
      self.trigger_render_supertree()
    },
    update_barcode_node_collection_obj: function () {
      var self = this
      var barcodeNodeCollectionObj = {}
      var barcodeNodeCollectionObjWithId = {}
      barcodeNodeCollectionObj['ratio'] = new Array()
      barcodeNodeCollectionObjWithId['ratio'] = new Array()
      self.each(function (model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var barcodeTreeId = model.get('barcodeTreeId')
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if ((barcodeNodeAttrArray[bI].existed) && (barcodeNodeAttrArray[bI].width !== 0)) {
            var nodeDepth = barcodeNodeAttrArray[bI].depth
            var nodeId = barcodeNodeAttrArray[bI].id
            if (typeof (barcodeNodeCollectionObj[nodeDepth]) !== 'undefined') {
              var maxnum = barcodeNodeAttrArray[bI].maxnum
              if (typeof (maxnum) !== 'undefined') {
                barcodeNodeCollectionObj[nodeDepth].push(barcodeNodeAttrArray[bI].num)
                barcodeNodeCollectionObjWithId[nodeDepth].push({
                  treeId: barcodeTreeId,
                  nodeId: nodeId,
                  value: barcodeNodeAttrArray[bI].num
                })
                barcodeNodeCollectionObj['ratio'].push(barcodeNodeAttrArray[bI].num / maxnum)
                barcodeNodeCollectionObjWithId['ratio'].push({
                  treeId: barcodeTreeId,
                  nodeId: nodeId,
                  value: barcodeNodeAttrArray[bI].num / maxnum
                })
              }
            } else {
              barcodeNodeCollectionObj[nodeDepth] = new Array()
              barcodeNodeCollectionObjWithId[nodeDepth] = new Array()
              if (typeof (maxnum) !== 'undefined') {
                barcodeNodeCollectionObj[nodeDepth].push(barcodeNodeAttrArray[bI].num)
                barcodeNodeCollectionObjWithId[nodeDepth].push({
                  treeId: barcodeTreeId,
                  nodeId: nodeId,
                  value: barcodeNodeAttrArray[bI].num
                })
              }
            }
          }
        }
      })
      Variables.set('barcodeNodeCollectionObj', barcodeNodeCollectionObj)
      Variables.set('barcodeNodeCollectionObjWithId', barcodeNodeCollectionObjWithId)
      if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
        Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_DISTRIBUTION_VIEW'])
      }
    },
    /**
     *  改变padding对象是否compact的属性, 将compact的节点展开
     */
    changCompactMode: function (paddingNodeIndex) {
      var self = this
      self.each(function (model) {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var paddingNodeObjArray = model.get('paddingNodeObjArray')
          var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
          _paddingNodeObjArray[paddingNodeIndex].isCompact = false
          paddingNodeObjArray[paddingNodeIndex].isCompact = false
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var compactPaddingNodeObjArray = model.get('compactPaddingNodeObjArray')
          var _compactPaddingNodeObjArray = model.get('_compactPaddingNodeObjArray')
          _compactPaddingNodeObjArray[paddingNodeIndex].isCompact = false
          compactPaddingNodeObjArray[paddingNodeIndex].isCompact = false
        }
      })
    },
    /**
     *  改变padding对象是否compact的属性, 将compact的节点压缩
     */
    changExpandMode: function (paddingNodeIndex) {
      var self = this
      self.each(function (model) {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var paddingNodeObjArray = model.get('paddingNodeObjArray')
          var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
          _paddingNodeObjArray[paddingNodeIndex].isCompact = true
          paddingNodeObjArray[paddingNodeIndex].isCompact = true
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var compactPaddingNodeObjArray = model.get('compactPaddingNodeObjArray')
          var _compactPaddingNodeObjArray = model.get('_compactPaddingNodeObjArray')
          _compactPaddingNodeObjArray[paddingNodeIndex].isCompact = true
          compactPaddingNodeObjArray[paddingNodeIndex].isCompact = true
        }
      })
    },
    /**
     * 计算padding node的最大长度
     */
    compute_padding_node_max_length: function () {
      var self = this
      var basedModel = self.at(0)
      var basedPaddingNodeObjArray = []
      var compactBasedPaddingNodeObjArray = []
      if (typeof(basedModel) !== 'undefined') {
        basedPaddingNodeObjArray = basedModel.get('paddingNodeObjArray')
        compactBasedPaddingNodeObjArray = basedModel.get('compactPaddingNodeObjArray')
      }
      //  初始化paddingNode在compact模式以及非compact模式下节点所占据的最大的长度
      var globalCompressPaddingNodeHeightMax = 0
      var globalCompressPaddingNodeWidth = 0
      self.each(function (model) {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var paddingNodeObjArray = model.get('paddingNodeObjArray')
          for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
            if (typeof(paddingNodeObjArray) !== 'undefined') {
              if (paddingNodeObjArray[pI].maxPaddingNodeLength > basedPaddingNodeObjArray[pI].maxPaddingNodeLength) {
                basedPaddingNodeObjArray[pI].maxPaddingNodeLength = paddingNodeObjArray[pI].maxPaddingNodeLength
              }
              if (paddingNodeObjArray[pI].compressPaddingNodeWidth > basedPaddingNodeObjArray[pI].compressPaddingNodeWidth) {
                basedPaddingNodeObjArray[pI].compressPaddingNodeWidth = paddingNodeObjArray[pI].compressPaddingNodeWidth
              }
              if (paddingNodeObjArray[pI].compressPaddingNodeMaxHeight > globalCompressPaddingNodeHeightMax) {
                globalCompressPaddingNodeHeightMax = paddingNodeObjArray[pI].compressPaddingNodeMaxHeight
              }
              if (paddingNodeObjArray[pI].compressPaddingNodeWidth > globalCompressPaddingNodeWidth) {
                globalCompressPaddingNodeWidth = paddingNodeObjArray[pI].compressPaddingNodeWidth
              }
            }
          }
        }
        if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var compactPaddingNodeObjArray = model.get('compactPaddingNodeObjArray')
          for (var pI = 0; pI < compactPaddingNodeObjArray.length; pI++) {
            if (typeof(compactPaddingNodeObjArray) !== 'undefined') {
              if (compactPaddingNodeObjArray[pI].maxPaddingNodeLength > compactBasedPaddingNodeObjArray[pI].maxPaddingNodeLength) {
                compactBasedPaddingNodeObjArray[pI].maxPaddingNodeLength = compactPaddingNodeObjArray[pI].maxPaddingNodeLength
              }
              if (compactPaddingNodeObjArray[pI].compressPaddingNodeWidth > compactBasedPaddingNodeObjArray[pI].compressPaddingNodeWidth) {
                compactBasedPaddingNodeObjArray[pI].compressPaddingNodeWidth = compactPaddingNodeObjArray[pI].compressPaddingNodeWidth
              }
              if (compactPaddingNodeObjArray[pI].compressPaddingNodeMaxHeight > globalCompressPaddingNodeHeightMax) {
                globalCompressPaddingNodeHeightMax = paddingNodeObjArray[pI].compressPaddingNodeMaxHeight
              }
              if (compactPaddingNodeObjArray[pI].compressPaddingNodeWidth > globalCompressPaddingNodeWidth) {
                globalCompressPaddingNodeWidth = compactPaddingNodeObjArray[pI].compressPaddingNodeWidth
              }
            }
          }
        }
      })
      console.log('globalCompressPaddingNodeWidth', globalCompressPaddingNodeWidth)
      console.log('globalCompressPaddingNodeHeightMax', globalCompressPaddingNodeHeightMax)
      var settedGlobalCompressPaddingNodeWidth = Variables.get('globalCompressPaddingNodeWidth')
      //  为了避免barcodeTree中的节点的移动, barcodeTree的比例尺按照最开始的大小计算
      if (settedGlobalCompressPaddingNodeWidth == null) {
        Variables.set('globalCompressPaddingNodeWidth', globalCompressPaddingNodeWidth)
      } else {
        globalCompressPaddingNodeWidth = settedGlobalCompressPaddingNodeWidth
      }
      var maxBarcodePaddingNodeWidth = Config.get('MAX_BARCODE_NODE_PADDING')
      console.log('globalCompressPaddingNodeWidth', globalCompressPaddingNodeWidth)
      var linearPaddingNodeWidth = d3.scale.linear().domain([0, globalCompressPaddingNodeWidth]).range([0, maxBarcodePaddingNodeWidth])
      self.each(function (model) {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var paddingNodeObjArray = model.get('paddingNodeObjArray')
          for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
            paddingNodeObjArray[pI].maxPaddingNodeLength = basedPaddingNodeObjArray[pI].maxPaddingNodeLength
            paddingNodeObjArray[pI].compressPaddingNodeWidth = basedPaddingNodeObjArray[pI].compressPaddingNodeWidth
            paddingNodeObjArray[pI].globalCompressPaddingNodeWidth = globalCompressPaddingNodeWidth
            paddingNodeObjArray[pI].globalCompressPaddingNodeMaxHeight = globalCompressPaddingNodeHeightMax
            //  计算每个model中的每一个paddingNode的宽度
            if (paddingNodeObjArray[pI].compressPaddingNodeWidth === 0) { //  说明这是root节点
              paddingNodeObjArray[pI].realCompressPaddingNodeWidth = window.barcodeWidthArray[0]// 将该padding赋予root节点的宽度
            } else {
              paddingNodeObjArray[pI].realCompressPaddingNodeWidth = linearPaddingNodeWidth(paddingNodeObjArray[pI].compressPaddingNodeWidth)
            }
            var subtreeObjectArray = paddingNodeObjArray[pI].subtreeObjectArray
            for (var sI = 0; sI < subtreeObjectArray.length; sI++) {
              subtreeObjectArray[sI].realCompressNodeWidth = linearPaddingNodeWidth(subtreeObjectArray[sI].subtree_depth)
            }
          }
          console.log('paddingNodeObjArray', paddingNodeObjArray)
          var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
          for (var pI = 0; pI < _paddingNodeObjArray.length; pI++) {
            _paddingNodeObjArray[pI].maxPaddingNodeLength = basedPaddingNodeObjArray[pI].maxPaddingNodeLength
            _paddingNodeObjArray[pI].compressPaddingNodeWidth = basedPaddingNodeObjArray[pI].compressPaddingNodeWidth
            _paddingNodeObjArray[pI].globalCompressPaddingNodeWidth = globalCompressPaddingNodeWidth
            _paddingNodeObjArray[pI].globalCompressPaddingNodeMaxHeight = globalCompressPaddingNodeHeightMax
            //  计算每个model中的每一个paddingNode的宽度
            if (_paddingNodeObjArray[pI].compressPaddingNodeWidth === 0) { //  说明这是root节点
              _paddingNodeObjArray[pI].realCompressPaddingNodeWidth = window.barcodeWidthArray[0]// 将该padding赋予root节点的宽度
            } else {
              _paddingNodeObjArray[pI].realCompressPaddingNodeWidth = linearPaddingNodeWidth(_paddingNodeObjArray[pI].compressPaddingNodeWidth)
            }
          }
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var compactPaddingNodeObjArray = model.get('compactPaddingNodeObjArray')
          for (var pI = 0; pI < compactPaddingNodeObjArray.length; pI++) {
            compactPaddingNodeObjArray[pI].maxPaddingNodeLength = compactBasedPaddingNodeObjArray[pI].maxPaddingNodeLength
            compactPaddingNodeObjArray[pI].compressPaddingNodeWidth = compactBasedPaddingNodeObjArray[pI].compressPaddingNodeWidth
            compactPaddingNodeObjArray[pI].globalCompressPaddingNodeWidth = globalCompressPaddingNodeWidth
            compactPaddingNodeObjArray[pI].globalCompressPaddingNodeMaxHeight = globalCompressPaddingNodeHeightMax
          }
          var _compactPaddingNodeObjArray = model.get('_compactPaddingNodeObjArray')
          for (var pI = 0; pI < _compactPaddingNodeObjArray.length; pI++) {
            _compactPaddingNodeObjArray[pI].maxPaddingNodeLength = compactBasedPaddingNodeObjArray[pI].maxPaddingNodeLength
            _compactPaddingNodeObjArray[pI].compressPaddingNodeWidth = compactBasedPaddingNodeObjArray[pI].compressPaddingNodeWidth
            _compactPaddingNodeObjArray[pI].globalCompressPaddingNodeWidth = globalCompressPaddingNodeWidth
            _compactPaddingNodeObjArray[pI].globalCompressPaddingNodeMaxHeight = maxCompressPaddingNodeDepth
          }
        }
      })
    },
    //  更新全局的compact变量
    update_global_compact: function (paddingNodeIndex) {
      var self = this
      self.each(function (model) {
        var paddingNodeObjArray = model.get('paddingNodeObjArray')
        var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
        for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
          if (paddingNodeIndex === pI) {
            if (paddingNodeObjArray[pI].isCompact) {
              paddingNodeObjArray[pI].isCompact = false
              _paddingNodeObjArray[pI].isCompact = false
              model.update_barcode_node_array()
            }
          }
        }
      })
    },
    //  对齐节点的最大的x值, 计算的方法是传入对齐节点的node id, 然后计算的方法是将该节点前面节点的x值进行记录
    //  比较barcode collection中的所有节点, 既可以得到最大的对齐节点的x值
    get_original_max_x: function (rangeStartNodeId) {
      var self = this
      var maxX = 0
      self.each(function (model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var paddingNodeEndX = get_padding_node_end_x(barcodeNodeAttrArray, rangeStartNodeId)
        if (maxX < paddingNodeEndX) {
          maxX = paddingNodeEndX
        }
      })
      return maxX
      function get_padding_node_end_x(barcodeNodeAttrArray, rangeStartNodeId) {
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[bI].id === rangeStartNodeId) {
            return +barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width
          }
        }
      }
    },
    /**
     * 按照fish eye 布局模式更新barcode的高度
     */
    fish_eye_layout_height_update: function (addedBarcodeModel) {
      var self = this
      var barcodeModelIndex = self.length
      var compactNum = window.compactNum
      var barcodeHeight = Variables.get('barcodeHeight')
      var minBarcodeHeight = Variables.get('minBarcodeHeight')
      var differentHeightNumber = Variables.get('differentHeightNumber')
      var heightScale = d3.scale.linear().domain([0, differentHeightNumber]).range([barcodeHeight, minBarcodeHeight]).clamp(true)
      var barcodeContainerHeight = +heightScale(barcodeModelIndex)
      var barcodeOriginalNodeHeight = barcodeContainerHeight * 0.8
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
      addedBarcodeModel.set('barcodeOriginalNodeHeight', barcodeOriginalNodeHeight)
      var barcodeCompactNodeHeight = barcodeOriginalNodeHeight / (compactNum + (compactNum - 1) / 4)
      var barcodeCompactNodeGap = barcodeCompactNodeHeight / 4
      addedBarcodeModel.set('barcodeCompactNodeHeight', barcodeCompactNodeHeight)
      var barcodeNodeAttrArray = addedBarcodeModel.get('barcodeNodeAttrArray')
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        barcodeNodeAttrArray[bI].height = barcodeOriginalNodeHeight
      }
      var compactBarcodeNodeAttrArray = addedBarcodeModel.get('compactBarcodeNodeAttrArray')
      for (var cI = 0; cI < compactBarcodeNodeAttrArray.length; cI++) {
        if (compactBarcodeNodeAttrArray[cI].compactAttr === ABSOLUTE_COMPACT_FATHER) {
          compactBarcodeNodeAttrArray[cI].height = barcodeCompactNodeHeight
          compactBarcodeNodeAttrArray[cI].y = compactBarcodeNodeAttrArray[cI].compactCount * (barcodeCompactNodeHeight + barcodeCompactNodeGap)
        } else {
          compactBarcodeNodeAttrArray[cI].height = barcodeOriginalNodeHeight
        }
      }
    },
    //  选择单个barcode中的节点
    node_selection_click: function (nodeData, operatedTreeId) {
      var self = this
      var filterModelArray = self.where({barcodeTreeId: operatedTreeId})
      if (filterModelArray.length > 0) {
        var operatedModel = filterModelArray[0]
        var siblingNodes = operatedModel.find_sibling_nodes(nodeData)
        self.add_selected_node_id(nodeData.id, nodeData.depth, siblingNodes)
      }
    },
    //  选择barcode中的某个子树
    subtree_selection_click: function (nodeData, operatedTreeId) {
      var self = this
      var filterModelArray = self.where({barcodeTreeId: operatedTreeId})
      if (filterModelArray.length > 0) {
        var operatedModel = filterModelArray[0]
        var siblingNodes = operatedModel.find_sibling_nodes(nodeData)
        var childrenNodes = operatedModel.find_children_nodes(nodeData)
        self.add_selected_subtree_id(nodeData.id, nodeData.depth, childrenNodes, siblingNodes)
      }
    },
    //  取消选择barcode中的节点
    unselection_click_handler: function (nodeData) {
      var self = this
      var nodeObjId = nodeData.id
      self.remove_selection(nodeObjId)
    },
    /**
     * fish eye 布局模式
     */
    fish_eye_layout: function () {
      var self = this
      var barcodeModelArray = []
      self.each(function (model) {
        barcodeModelArray.push(model)
      })
      barcodeModelArray = barcodeModelArray.sort(function (model_a, model_b) {
        return model_a.get('barcodeIndex') - model_b.get('barcodeIndex')
      })
      var barcodeYLocation = 0
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var barcodeHeight = Variables.get('barcodeHeight')
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
      //  总共的不同的height的数量
      var differentHeightNumber = Variables.get('differentHeightNumber')
      var minBarcodeHeight = Variables.get('minBarcodeHeight')
      var compactNum = window.compactNum
      var heightScale = d3.scale.linear().domain([0, differentHeightNumber]).range([barcodeHeight, minBarcodeHeight]).clamp(true)
      for (var barcodeIndex = 0; barcodeIndex < barcodeModelArray.length; barcodeIndex++) {
        var treeDataModel = barcodeModelArray[barcodeIndex]
        if (typeof(treeDataModel) !== 'undefined') {
          var barcodeContainerHeight = +heightScale(barcodeIndex)
          var barcodeOriginalNodeHeight = barcodeContainerHeight * 0.8
          var barcodeCompactNodeHeight = barcodeOriginalNodeHeight / (compactNum + (compactNum - 1) / 4)
          var barcodeCompactNodeGap = barcodeCompactNodeHeight / 4
          //  更新barcode.model的barcodeNodeHeight和barcodeTreeYLocation属性,控制barcode的container的位置以及高度
          treeDataModel.set('barcodeOriginalNodeHeight', barcodeOriginalNodeHeight)
          treeDataModel.set('barcodeCompactNodeHeight', barcodeCompactNodeHeight)
          var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            barcodeNodeAttrArray[bI].height = barcodeOriginalNodeHeight
          }
          var compactBarcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
          for (var cI = 0; cI < compactBarcodeNodeAttrArray.length; cI++) {
            if (compactBarcodeNodeAttrArray[cI].compactAttr === ABSOLUTE_COMPACT_FATHER) {
              compactBarcodeNodeAttrArray[cI].height = barcodeCompactNodeHeight
              compactBarcodeNodeAttrArray[cI].y = compactBarcodeNodeAttrArray[cI].compactCount * (barcodeCompactNodeHeight + barcodeCompactNodeGap)
            } else {
              compactBarcodeNodeAttrArray[cI].height = barcodeOriginalNodeHeight
            }
          }
          treeDataModel.set('barcodeNodeHeight', barcodeContainerHeight)
          treeDataModel.set('barcodeTreeYLocation', barcodeYLocation)
          treeDataModel.set('viewHeightUpdateValue', (treeDataModel.get('viewHeightUpdateValue') + 1) % 2)
          barcodeYLocation = barcodeYLocation + barcodeContainerHeight
        }
      }
    },
    /**
     * 按照uniform布局模式更新barcode的高度
     */
    uniform_layout_height_update: function (addedBarcodeModel) {
      var self = this
      var compactNum = window.compactNum
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var selectItemLength = selectItemNameArray.length
      var barcodeHeight = Variables.get('barcodeHeight')
      var superTreeHeight = $('#supertree-scroll-panel').height()
      var barcodeTreeConfigHeight = Variables.get('barcodeTreeConfigHeight')
      var barcodeViewHeight = $('#barcode-view').height() - superTreeHeight - barcodeTreeConfigHeight
      var updatedHeight = +new Number(barcodeViewHeight / selectItemLength).toFixed(1)
      var barcodeContainerHeight = +updatedHeight > +barcodeHeight ? +barcodeHeight : +updatedHeight
      var barcodeOriginalNodeHeight = barcodeContainerHeight * 0.8
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
      addedBarcodeModel.set('barcodeOriginalNodeHeight', barcodeOriginalNodeHeight)
      addedBarcodeModel.set_barcode_padding_top()
      var barcodeCompactNodeHeight = barcodeOriginalNodeHeight / (compactNum + (compactNum - 1) / 4)
      var barcodeCompactNodeGap = barcodeCompactNodeHeight / 4
      addedBarcodeModel.set('barcodeCompactNodeHeight', barcodeCompactNodeHeight)
      var barcodeNodeAttrArray = addedBarcodeModel.get('barcodeNodeAttrArray')
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        barcodeNodeAttrArray[bI].height = barcodeOriginalNodeHeight
      }
      var compactBarcodeNodeAttrArray = addedBarcodeModel.get('compactBarcodeNodeAttrArray')
      for (var cI = 0; cI < compactBarcodeNodeAttrArray.length; cI++) {
        if (compactBarcodeNodeAttrArray[cI].compactAttr === ABSOLUTE_COMPACT_FATHER) {
          compactBarcodeNodeAttrArray[cI].height = barcodeCompactNodeHeight
          compactBarcodeNodeAttrArray[cI].y = compactBarcodeNodeAttrArray[cI].compactCount * (barcodeCompactNodeHeight + barcodeCompactNodeGap)
        } else {
          compactBarcodeNodeAttrArray[cI].height = barcodeOriginalNodeHeight
        }
      }
    },
    /**
     * uniform 的布局模式
     */
    uniform_layout: function () {
      var self = this
      var barcodeModelArray = []
      self.each(function (model) {
        barcodeModelArray.push(model)
      })
      barcodeModelArray.sort(function (model_a, model_b) {
        return model_a.get('barcodeIndex') - model_b.get('barcodeIndex')
      })
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var barcodeHeight = Variables.get('barcodeHeight')
      var compactNum = window.compactNum
      var superTreeHeight = $('#supertree-scroll-panel').height()
      var barcodeTreeConfigHeight = Variables.get('barcodeTreeConfigHeight')
      var barcodeViewHeight = $('#barcode-view').height() - superTreeHeight - barcodeTreeConfigHeight
      var updatedHeight = +new Number(barcodeViewHeight / selectItemNameArray.length).toFixed(1)
      window.barcodeHeight = +updatedHeight > +barcodeHeight ? +barcodeHeight : +updatedHeight
      var barcodeContainerHeight = +window.barcodeHeight
      var barcodeOriginalNodeHeight = barcodeContainerHeight * 0.8
      var barcodeOriginalSummaryHeight = barcodeContainerHeight * 0.6
      var barcodeCompactNodeHeight = barcodeOriginalNodeHeight / (compactNum + (compactNum - 1) / 4)
      var barcodeCompactNodeGap = barcodeCompactNodeHeight / 4
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
      var barcodeYLocation = 0
      for (var barcodeIndex = 0; barcodeIndex < barcodeModelArray.length; barcodeIndex++) {
        var treeDataModel = barcodeModelArray[barcodeIndex]
        if (typeof(treeDataModel) !== 'undefined') {
          //  更新barcode.model的barcodeNodeHeight和barcodeTreeYLocation属性,控制barcode的container的位置以及高度
          treeDataModel.set('barcodeOriginalNodeHeight', barcodeOriginalNodeHeight)
          treeDataModel.set('barcodeCompactNodeHeight', barcodeCompactNodeHeight)
          treeDataModel.set_barcode_padding_top()
          //  改变barcode初始模式的节点数组的节点的高度
          var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            barcodeNodeAttrArray[bI].height = barcodeOriginalNodeHeight
          }
          //  改变global的节点数组的节点的高度
          var categoryNodeObjArray = treeDataModel.get('categoryNodeObjArray')
          for (var bI = 0; bI < categoryNodeObjArray.length; bI++) {
            categoryNodeObjArray[bI].height = barcodeOriginalNodeHeight
          }
          //  改变barcode的compact模式的节点数组的节点的高度
          var compactBarcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
          for (var cI = 0; cI < compactBarcodeNodeAttrArray.length; cI++) {
            if (compactBarcodeNodeAttrArray[cI].compactAttr === ABSOLUTE_COMPACT_FATHER) {
              compactBarcodeNodeAttrArray[cI].height = barcodeCompactNodeHeight
              compactBarcodeNodeAttrArray[cI].y = compactBarcodeNodeAttrArray[cI].compactCount * (barcodeCompactNodeHeight + barcodeCompactNodeGap)
            } else {
              compactBarcodeNodeAttrArray[cI].height = barcodeOriginalNodeHeight
            }
          }
          treeDataModel.set('barcodeNodeHeight', barcodeContainerHeight)
          treeDataModel.set('barcodeTreeYLocation', barcodeYLocation)
          treeDataModel.set('barcodeOriginalSummaryHeight', barcodeOriginalSummaryHeight)
          treeDataModel.set('viewHeightUpdateValue', (treeDataModel.get('viewHeightUpdateValue') + 1) % 2)
          barcodeYLocation = barcodeYLocation + barcodeContainerHeight
        }
      }
    },
    /**
     * 按照现在的barcode中的对齐节点, 对于增加的barcodeModel中的节点数组进行调整
     * @param barcodeModel
     */
    adjust_barcode_model: function (barcodeModel) {
      var self = this
      var barcodeNodeGap = Variables.get('barcodeNodeInterval')
      var alignedNodeIdArray = self.alignedNodeIdArray
      var alignedObj = {}
      var basedBarcodeModel = self.at(0)
      var basedBarcodeNodeAttrArray = null
      var basedCompactBarcodeNodeAttrArray = null
      if (typeof(basedBarcodeModel) !== 'undefined') {
        basedBarcodeNodeAttrArray = basedBarcodeModel.get('barcodeNodeAttrArray')
        basedCompactBarcodeNodeAttrArray = basedBarcodeModel.get('compactBarcodeNodeAttrArray')
      }
      var thisBarcodeNodeAttrArray = barcodeModel.get('barcodeNodeAttrArray')
      var thisCompactBarcodeNodeAttrArray = barcodeModel.get('compactBarcodeNodeAttrArray')
      var isAdjustBasedModel = (self.length !== 0)
      //  按照align的节点排列
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        _inner_adjust_barcode_model(isAdjustBasedModel, basedBarcodeNodeAttrArray, thisBarcodeNodeAttrArray)
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        _inner_adjust_compact_barcode_model(isAdjustBasedModel, basedCompactBarcodeNodeAttrArray, thisCompactBarcodeNodeAttrArray)
      }
      function _inner_adjust_barcode_model(isAdjustBasedModel, basedBarcodeNodeAttrArray, thisBarcodeNodeAttrArray) {
        //  取得当前对齐节点的x位置, 计算的方法是通过获取对齐节点的数组, 然后得到该数组中的相对应节点的位置
        if (isAdjustBasedModel) {
          for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
            for (var bI = 0; bI < basedBarcodeNodeAttrArray.length; bI++) {
              if (basedBarcodeNodeAttrArray[bI].id === alignedNodeIdArray[aI]) {
                alignedObj[alignedNodeIdArray[aI]] = +basedBarcodeNodeAttrArray[bI].x
              }
            }
          }
        }
        //  将增加的barcode model中的节点数组进行相应的变换, 即如果不是对齐的节点, 那么按照从左到右累计进行计算。
        for (var tI = 1; tI < thisBarcodeNodeAttrArray.length; tI++) {
          var barcodeNodeId = thisBarcodeNodeAttrArray[tI].id
          if (thisBarcodeNodeAttrArray[tI - 1].width !== 0) {
            thisBarcodeNodeAttrArray[tI].x = thisBarcodeNodeAttrArray[tI - 1].x + thisBarcodeNodeAttrArray[tI - 1].width + barcodeNodeGap
          } else {
            thisBarcodeNodeAttrArray[tI].x = thisBarcodeNodeAttrArray[tI - 1].x
          }
          if (alignedNodeIdArray.indexOf(barcodeNodeId) !== -1) {
            if (alignedObj[barcodeNodeId] > thisBarcodeNodeAttrArray[tI].x) {
              thisBarcodeNodeAttrArray[tI].x = alignedObj[barcodeNodeId]
            }
          }
        }
      }

      //  对齐compact model中节点的位置
      function _inner_adjust_compact_barcode_model(isAdjustBasedModel, basedBarcodeNodeAttrArray, thisBarcodeNodeAttrArray) {
        if (isAdjustBasedModel) {
          for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
            for (var bI = 0; bI < basedBarcodeNodeAttrArray.length; bI++) {
              if (basedBarcodeNodeAttrArray[bI].id === alignedNodeIdArray[aI]) {
                alignedObj[alignedNodeIdArray[aI]] = +basedBarcodeNodeAttrArray[bI].x
              }
            }
          }
        }
        //  将增加的barcode model中的节点数组进行相应的变换, 即如果不是对齐的节点, 那么按照从左到右累计进行计算,
        //  与普通的barcode计算不同的是, compact形式的barcode需要考虑将compact模式的节点的排布问题
        var compactCount = 0
        var selectedLevels = window.selectedLevels
        var compactNum = window.compactNum
        var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
        var ABSOLUTE_COMPACT_CHILDREN = Config.get('CONSTANT')['ABSOLUTE_COMPACT_CHILDREN']
        var barcodeNodeGap = Variables.get('barcodeNodeInterval')
        var previousDepth = 0
        var previousRectWidth = 0
        var previousCompact = false
        var xLoc = 0
        if (thisBarcodeNodeAttrArray.length !== 0) {
          xLoc = thisBarcodeNodeAttrArray[0].x + thisBarcodeNodeAttrArray[0].width + barcodeNodeGap
        }
        for (var tI = 1; tI < thisBarcodeNodeAttrArray.length; tI++) {
          var barcodeNodeId = thisBarcodeNodeAttrArray[tI].id
          var compactAttr = thisBarcodeNodeAttrArray[tI].compactAttr
          var rectWidth = thisBarcodeNodeAttrArray[tI].width
          var depth = thisBarcodeNodeAttrArray[tI].depth
          if (compactAttr === ABSOLUTE_COMPACT_FATHER) {
            //  在两个不同层级的compact类型的节点连接起来的情况下
            if (depth < previousDepth) {
              //  增加判断上一个节点是否是compact是为了避免上一个节点是uncompact模式, 已经在xLoc上增加了值, 此时不需要继续在xLoc上增加width和gap
              if ((previousCompact) && (compactCount !== 0)) {
                xLoc = xLoc + previousRectWidth + barcodeNodeGap
              }
              compactCount = 0
            }
            xLoc = +xLoc.toFixed(2)
            thisBarcodeNodeAttrArray[tI].x = xLoc
            //  如果该节点属于对齐的节点, 那么判断该节点是否是查过align节点的位置
            //  如果超过align节点的位置, 那么节点的位置保持不变; 如果没有超过align节点的位置, 那么需要将该节点放置到align节点的位置
            if (alignedNodeIdArray.indexOf(barcodeNodeId) !== -1) {
              if (alignedObj[barcodeNodeId] > thisBarcodeNodeAttrArray[tI].x) {
                thisBarcodeNodeAttrArray[tI].x = alignedObj[barcodeNodeId]
              }
            }
            if (selectedLevels.indexOf(depth) !== -1) {
              compactCount = compactCount + 1
              compactCount = compactCount % compactNum
              if (rectWidth !== 0) {
                if (compactCount === 0) {
                  xLoc = thisBarcodeNodeAttrArray[tI].x + rectWidth + barcodeNodeGap
                }
                //  修改previousRectWidth和previousDepth
                previousRectWidth = rectWidth
                previousDepth = depth
                previousCompact = true
              }
            }
          } else {
            //  如果compactCount为0, 那么就不需要增加previousRectWidth, 因为已经增加过rectWidth
            if (compactCount !== 0) {
              xLoc = xLoc + previousRectWidth + barcodeNodeGap
            }
            compactCount = 0
            xLoc = +xLoc.toFixed(2)
            thisBarcodeNodeAttrArray[tI].x = xLoc
            var rectWidth = thisBarcodeNodeAttrArray[tI].width
            if (selectedLevels.indexOf(depth) !== -1) {
              if (rectWidth !== 0) {
                xLoc = thisBarcodeNodeAttrArray[tI].x + rectWidth + barcodeNodeGap
                //  修改previousRectWidth和previousDepth
                previousRectWidth = rectWidth
                previousDepth = depth
                previousCompact = false
              }
            }
          }
        }
      }
    },
    /**
     * 更新单个的BarcodeTree视图显示
     */
    update_single_barcode_view: function () {
      var self = this
      var currentConfigBarcodeTreeId = Variables.get('current_config_barcodeTreeId')
      if (currentConfigBarcodeTreeId != null) {
        var filteredModel = self.where({barcodeTreeId: currentConfigBarcodeTreeId})
        if (filteredModel.length !== 0) {
          filteredModel[0].set('viewUpdateConcurrentValue', (filteredModel[0].get('viewUpdateConcurrentValue') + 1) % 2)
        }
      }
    },
    /**
     * 更新所有视图的选择状态
     */
    update_barcode_selection_state: function () {
      var self = this
      self.each(function (barcodeModel) {
        barcodeModel.set('viewUpdateSelectionState', (barcodeModel.get('viewUpdateSelectionState') + 1) % 2)
      })
    },
    /**
     * 更新所有的BarcodeTree视图显示
     */
    update_all_barcode_view: function () {
      var self = this
      self.each(function (barcodeModel) {
        barcodeModel.set('viewUpdateConcurrentValue', (barcodeModel.get('viewUpdateConcurrentValue') + 1) % 2)
      })
    },
    /**
     * 获取单个BarcodeTree的模式
     */
    get_current_single_barcode_mode: function () {
      var self = this
      var currentConfigBarcodeTreeId = Variables.get('current_config_barcodeTreeId')
      if (currentConfigBarcodeTreeId != null) {
        var filteredModel = self.where({barcodeTreeId: currentConfigBarcodeTreeId})
        if (filteredModel.length !== 0) {
          var barcodeMode = filteredModel[0].get('displayMode')
          return barcodeMode
        }
      }
    },
    /**
     * 更新所有BarcodeTree的模式
     * @param barcode_mode
     */
    update_all_barcode_mode: function (barcode_mode) {
      var self = this
      self.each(function (model) {
        model.set('displayMode', barcode_mode)
      })
    },
    /**
     * 更新单个BarcodeTree的模式
     */
    update_single_barcode_mode: function (barcode_mode) {
      var self = this
      var currentConfigBarcodeTreeId = Variables.get('current_config_barcodeTreeId')
      if (currentConfigBarcodeTreeId != null) {
        var filteredModel = self.where({barcodeTreeId: currentConfigBarcodeTreeId})
        if (filteredModel.length !== 0) {
          filteredModel[0].set('displayMode', barcode_mode)
        }
      }
    },
    remove_barcode_subtree: function (rootId, rootCategory, rootLevel, supertreeNodeObj, compactSuperTreeNodeLocObj) {
      var self = this
      //  在barcode collection中的model中增加子树的节点
      self.each(function (barcodeModel) {
        var barcodeTreeId = barcodeModel.get('barcodeTreeId')
        var supertreeNodeArray = supertreeNodeObj[barcodeTreeId]
        var compactSuperTreeNodeLocArray = compactSuperTreeNodeLocObj[barcodeTreeId]
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var cloneSubtreeNodeArray = JSON.parse(JSON.stringify(supertreeNodeArray))
          var cloneMaxNodeNumTreeNodeLocArray = JSON.parse(JSON.stringify(supertreeNodeArray))
          barcodeModel.update_single_barcode_subtree(rootId, rootCategory, rootLevel, cloneSubtreeNodeArray, cloneMaxNodeNumTreeNodeLocArray)
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var cloneCompactSuperTreeNodeLocArray = JSON.parse(JSON.stringify(compactSuperTreeNodeLocArray))
          var cloneCompactMaxNodeNumTreeNodeLocArray = JSON.parse(JSON.stringify(compactSuperTreeNodeLocArray))
          barcodeModel.update_single_compact_barcode_subtree(rootId, rootCategory, rootLevel, cloneCompactSuperTreeNodeLocArray, cloneCompactMaxNodeNumTreeNodeLocArray)
        }
      })
    },
    /**
     * 构建得到子树之后, 将子树的节点数组插入到model中的节点数组中
     */
    update_barcode_subtree: function (rootId, rootCategory, rootLevel, subtreeNodeArray, maxNodeNumTreeNodeLocArray, compactSuperTreeNodeLocArray, compactMaxNodeNumTreeNodeLocArray) {
      var self = this
      var subtreeNodeIdArray = []
      for (var sI = 0; sI < subtreeNodeArray.length; sI++) {
        subtreeNodeIdArray.push(subtreeNodeArray[sI].id)
      }
      //  alignedNodeIdArray是整个barcodeTree中对齐的节点
      var alignedNodeIdArray = self.alignedNodeIdArray
      var alignedNodeObjArray = self.alignedNodeObjArray
      //  如果子树中存在align的节点, 那么就删除掉该节点
      //  子树中存在align的节点, 即用户对齐的子树是已经对齐的子树的父亲, 所以可以将align的节点删除
      for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
        if ((subtreeNodeIdArray.indexOf(alignedNodeIdArray[aI]) !== -1) && (alignedNodeIdArray[aI] !== rootId)) {
          deleteAlignedNodeObj(alignedNodeIdArray[aI], alignedNodeObjArray)
          alignedNodeIdArray.splice(aI, 1)
        }
      }
      //  在barcode collection中的model中增加子树的节点
      self.each(function (barcodeModel) {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var cloneSubtreeNodeArray = JSON.parse(JSON.stringify(subtreeNodeArray))
          var cloneMaxNodeNumTreeNodeLocArray = JSON.parse(JSON.stringify(maxNodeNumTreeNodeLocArray))
          barcodeModel.update_single_barcode_subtree(rootId, rootCategory, rootLevel, cloneSubtreeNodeArray, cloneMaxNodeNumTreeNodeLocArray)
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var cloneCompactSuperTreeNodeLocArray = JSON.parse(JSON.stringify(compactSuperTreeNodeLocArray))
          var cloneCompactMaxNodeNumTreeNodeLocArray = JSON.parse(JSON.stringify(compactMaxNodeNumTreeNodeLocArray))
          barcodeModel.update_single_compact_barcode_subtree(rootId, rootCategory, rootLevel, cloneCompactSuperTreeNodeLocArray, cloneCompactMaxNodeNumTreeNodeLocArray)
        }
      })
      /**
       * @param alignedNodeId
       * @param alignedNodeObjArray
       */
      function deleteAlignedNodeObj(alignedNodeId, alignedNodeObjArray) {
        for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
          if (alignedNodeObjArray[aI].alignedNodeId === alignedNodeId) {
            alignedNodeObjArray.splice(aI, 1)
          }
        }
      }
    },
    updateBarcodeNodexMaxX: function () {
      var self = this
      var maxX = 0
      self.each(function (model) {
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = model.get('compactBarcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
          barcodeNodeAttrArray = model.get('categoryNodeObjArray')
        }
        var locationX = findMaxX(barcodeNodeAttrArray)
        maxX = maxX > locationX ? maxX : locationX
      })
      Variables.set('barcodeNodexMaxX', maxX)
      return maxX

      function findMaxX(barcodeNodeAttrArray) {
        var maxX = 0
        for (var bI = (barcodeNodeAttrArray.length - 1); bI > 0; bI--) {
          if (barcodeNodeAttrArray[bI].width !== 0) {
            maxX = +barcodeNodeAttrArray[bI].x + +barcodeNodeAttrArray[bI].width
            break
          }
        }
        return maxX
      }
    },
    /**
     * 获取最大的x值
     */
    getGlobalMaxX: function (d, barcodeAlignedNodeGap) {
      function getX(barcodeNodeAttrArray) {
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[bI].id === rootId) {
            return barcodeNodeAttrArray[bI].x + barcodeAlignedNodeGap
          }
        }
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          var thisCategory = +barcodeNodeAttrArray[bI].category
          if ((category != NaN) && (thisCategory != NaN)) {
            if (thisCategory > category) {
              return barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width + barcodeAlignedNodeGap
            }
          }
        }
      }

      var self = this
      var maxX = 0
      var rootId = d.id
      var category = +d.category
      self.each(function (d) {
        var barcodeNodeAttrArray = d.get('barcodeNodeAttrArray')
        var locationX = getX(barcodeNodeAttrArray, category)
        maxX = maxX > locationX ? maxX : locationX
      })
      return maxX
    },
    // recover_whole_barcode_model: function () {
    //   var self = this
    //   var modelArray = []
    //   self.each(function (model) {
    //     modelArray.push(model)
    //   })
    //   modelArray.sort(function (model_a, model_b) {
    //     var nodeIndexA = model_a.get('originalBarcodeIndex')
    //     var nodeIndexB = model_b.get('originalBarcodeIndex')
    //     return nodeIndexA - nodeIndexB
    //   })
    //
    //   for (var mI = 0; mI < modelArray.length; mI++) {
    //     modelArray[ mI ].set('barcodeIndex', mI)
    //   }
    //   self.update_barcode_location()
    //   self.trigger_barcode_loc()
    // },
    sort_whole_barcode_model: function (sort_para) {
      var self = this
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var nodeValueA = 0
        var nodeValueB = 0
        if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
          nodeValueA = getNodeNumber(model_a)
          nodeValueB = getNodeNumber(model_b)
        } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
          nodeValueA = getSumValue(model_a)
          nodeValueB = getSumValue(model_b)
        }
        if (sort_para === 'asc') {
          return nodeValueA - nodeValueB
        } else if (sort_para === 'desc') {
          return nodeValueB - nodeValueA
        }
      })
      function getNodeNumber(model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var nodeNumber = 0
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if ((barcodeNodeAttrArray[bI].width !== 0) && (barcodeNodeAttrArray[bI].existed)) {
            nodeNumber = nodeNumber + 1
          }
        }
        return nodeNumber
      }

      function getSumValue(model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        return barcodeNodeAttrArray[0].num
      }

      for (var mI = 0; mI < modelArray.length; mI++) {
        modelArray[mI].set('barcodeIndex', mI)
      }
      self.update_barcode_location()
      // self.trigger_barcode_loc()
    },
    //  对于barcode model进行排序
    sort_barcode_model: function (comparedNodeId, parameter) {
      var self = this
      self.sortExistedConfigObj = {}
      var currentSortExistedConfigObj = self.sortExistedConfigObj
      currentSortExistedConfigObj.comparedNodeId = comparedNodeId
      currentSortExistedConfigObj.parameter = parameter
      self.comparedNodeId = comparedNodeId
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var nodeValueA = 0
        var nodeValueB = 0
        if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
          nodeValueA = getSubtreeNodeNum(model_a)
          nodeValueB = getSubtreeNodeNum(model_b)
        } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
          nodeValueA = getSubtreeSumValue(model_a)
          nodeValueB = getSubtreeSumValue(model_b)
        }
        if (parameter === 'asc') {
          return nodeValueA - nodeValueB
        } else if (parameter === 'desc') {
          return nodeValueB - nodeValueA
        }
      })
      function getSubtreeSumValue(model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[bI].id === comparedNodeId) {
            if ((barcodeNodeAttrArray[bI].width !== 0) && (barcodeNodeAttrArray[bI].existed)) {
              return barcodeNodeAttrArray[bI].num
            } else {
              return -1
            }
          }
        }
      }

      function getSubtreeNodeNum(model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var nodeDepth = null
        var nodeCount = 0
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (nodeDepth != null) {
            if (barcodeNodeAttrArray[bI].depth > nodeDepth) {
              if ((barcodeNodeAttrArray[bI].width !== 0) && (barcodeNodeAttrArray[bI].existed)) {
                nodeCount = nodeCount + 1
              }
            }
            if (barcodeNodeAttrArray[bI].depth == nodeDepth) {
              break
            }
          }
          if ((barcodeNodeAttrArray[bI].id === comparedNodeId) && (barcodeNodeAttrArray[bI].width !== 0) && (barcodeNodeAttrArray[bI].existed)) {
            nodeDepth = barcodeNodeAttrArray[bI].depth
            nodeCount = nodeCount + 1
          }
        }
        return nodeCount
      }

      for (var mI = 0; mI < modelArray.length; mI++) {
        modelArray[mI].set('barcodeIndex', mI)
      }
      self.update_barcode_location()
      // self.trigger_barcode_loc()
    },
    /**
     *  取消barcode collection中的based model的设置
     */
    unset_based_model: function () {
      var self = this
      self.sortSimilarityConfigState = false
      self.basedModel = null
      self.each(function (model) {
        model.set('compareBased', false)
        model.set('basedModel', null)
        model.set('alignedComparisonResultArray', null)
      })
      // self.trigger_null_color_encoding()
      // self.trigger_barcode_loc()
      self.trigger_update_summary()
      self.trigger_render_supertree()
    },
    /**
     *  按照barcodetree选择的顺序重新进行排序, 并且更新位置
     */
    resort_default_barcodetree: function () {
      var self = this
      var self = this
      self.sortSimilarityConfigState = false
      self.reset_select_sequence()
      self.update_barcode_location()
    },
    /**
     * 将选中的barcode的model放到collection数组的第一个位置作为比较的based model
     */
    set_based_model: function (barcodeTreeId) {
      var self = this
      var basedModel = self.where({'barcodeTreeId': barcodeTreeId})[0]
      self.each(function (model) {
        model.set('compareBased', false)
        model.set('basedModel', basedModel)
      })
      basedModel.set('compareBased', true)
      self.basedModel = basedModel
      self.get_comparison_result(basedModel)
      // self.trigger_barcode_loc()
      self.trigger_update_summary()
      self.trigger_render_supertree()
    },
    /**
     * 按照选择的barcodeTree进行排序
     */
    sort_selected_barcodetree: function () {
      var self = this
      var basedModel = self.basedModel
      if (basedModel == null) {
        return
      }
      var alignedRangeObjArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        alignedRangeObjArray = basedModel.get('alignedRangeObjArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
        var barcodeNodeAttrArray = basedModel.get('barcodeNodeAttrArray')
        alignedRangeObjArray = [{
          rangeStartNodeIndex: 0,
          rangeEndNodeIndex: barcodeNodeAttrArray.length - 1
        }]
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        alignedRangeObjArray = basedModel.get('compactAlignedRangeObjArray')
      }
      if (alignedRangeObjArray.length !== 0) {
        self.sort_accord_similarity()
        //  对于histogram视图相对应的改变
        // self.trigger_color_encoding()
        // self.trigger_histogram_location_comparison()
      } else {
        self.sort_based_as_first()
      }
      self.update_barcode_location()
    },
    change_layout_mode: function () {
      var self = this
      self.update_barcode_location()
      // self.trigger_barcode_loc()
      self.trigger_update_summary()
    },
    update_barcode_model_height: function (addedBarcodeModel) {
      var self = this
      var layoutMode = Variables.get('layoutMode')
      if (layoutMode === 'UNION') {
        self.uniform_layout_height_update(addedBarcodeModel)
      } else if (layoutMode === 'FISHEYE') {
        self.fish_eye_layout_height_update(addedBarcodeModel)
      }
    },
    /**
     * 更新barcode的位置的方法, 在这个方法内对于uniform layout和fish eye layout进行统一控制
     */
    update_barcode_location: function () {
      var self = this
      var layoutMode = Variables.get('layoutMode')
      if (layoutMode === 'UNION') {
        self.uniform_layout()
      } else if (layoutMode === 'FISHEYE') {
        self.fish_eye_layout()
      }
    },
    sort_based_as_first: function () {
      var self = this
      var basedModel = self.basedModel
      if (basedModel == null) {
        return
      }
      basedModel.set('barcodeIndex', -1)
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var barcodeIndexA = getBarcodeIndexAttr(model_a)
        var barcodeIndexB = getBarcodeIndexAttr(model_b)
        return barcodeIndexA - barcodeIndexB
      })
      for (var mI = 0; mI < modelArray.length; mI++) {
        modelArray[mI].set('barcodeIndex', mI)
      }
      function getBarcodeIndexAttr(model) {
        var barcodeIndex = model.get('barcodeIndex')
        return barcodeIndex
      }
    },
    //  根据barcodeModel与basedBarcodeModel比较的结果进行排序
    sort_accord_similarity: function () {
      var self = this
      self.sortSimilarityConfigState = true
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var nodeDifferenceA = model_a.get_node_difference()
        var nodeDifferenceB = model_b.get_node_difference()
        return nodeDifferenceA - nodeDifferenceB
      })
      for (var mI = 0; mI < modelArray.length; mI++) {
        var barcodeTreeId = modelArray[mI].get('barcodeTreeId')
        // var encodedColor = self.get_color_accord_similarity(mI)
        modelArray[mI].set('barcodeIndex', mI)
      }
      //  有的情况下basedTree没有排在最上方, 所以需要增加一个sort_based_as_first排序
      self.sort_based_as_first()
    },
    /**
     * 在histogram视图中更新颜色按照相似度进行编码
     */
    trigger_color_encoding: function () {
      var self = this
      var colorEncodingObj = {}
      self.each(function (model) {
        var barcodeIndex = model.get('barcodeIndex')
        var barcodeTreeId = model.get('barcodeTreeId')
        var encodedColor = self.get_color_accord_similarity(barcodeIndex)
        if (!model.get('compareBased')) {
          colorEncodingObj[barcodeTreeId] = encodedColor
        }
      })
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_HISTOGRAM_ENCODE'], {
        colorEncodingObj: colorEncodingObj
      })
    },
    /**
     * 在histogram视图中更新比较barcode的相同节点的位置
     */
    trigger_histogram_location_comparison: function () {
      var self = this
      var sameNodeNumObj = {}
      var differentNodeNumObj = {}
      self.each(function (model) {
        var barcodeTreeId = model.get('barcodeTreeId')
        var alignedComparisonResultArray = model.get('alignedComparisonResultArray')
        var sameNodeIdSum = 0
        var differentNodeIdSum = 0
        for (var aI = 0; aI < alignedComparisonResultArray.length; aI++) {
          var singleAlignedResult = alignedComparisonResultArray[aI]
          var sameNodeIdArray = singleAlignedResult.sameNodeIdArray
          var addedNodeIdArray = singleAlignedResult.addedNodeIdArray
          var missedNodeIdArray = singleAlignedResult.missedNodeIdArray
          sameNodeIdSum = sameNodeIdSum + sameNodeIdArray.length
          differentNodeIdSum = differentNodeIdSum + addedNodeIdArray.length + missedNodeIdArray.length
        }
        sameNodeNumObj[barcodeTreeId] = sameNodeIdSum
        differentNodeNumObj[barcodeTreeId] = differentNodeIdSum
      })
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_HISTOGRAM_COMPARISON_LOC'], {
        sameNodeNumObj: sameNodeNumObj,
        differentNodeNumObj: differentNodeNumObj
      })
    },
    /**
     * 在histogram视图中更新颜色按照还原之前的编码方式
     */
    trigger_null_color_encoding: function () {
      var self = this
      var colorEncodingObj = {}
      self.each(function (model) {
        var barcodeIndex = model.get('barcodeIndex')
        var barcodeTreeId = model.get('barcodeTreeId')
        colorEncodingObj[barcodeTreeId] = null
      })
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_HISTOGRAM_ENCODE'], {
        colorEncodingObj: colorEncodingObj
      })
    },
    get_color_accord_similarity: function (barcodeIndex) {
      var mostSimilarity = d3.rgb(158, 202, 225)
      var lessSimilarity = d3.rgb(255, 255, 255)
      var colorCompute = d3.interpolate(mostSimilarity, lessSimilarity)
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var colorLinear = d3.scale.linear()
        .domain([0, selectItemNameArray.length - 1])
        .range([0, 1])
      return colorCompute(colorLinear(barcodeIndex))
    },
    /**
     * 获取basedModel对象
     */
    get_based_model: function () {
      var self = this
      return self.basedModel
    },
    /**
     * 恢复按照barcode选择顺序进行排序的状态
     */
    reset_select_sequence: function () {
      var self = this
      var selectItemNameArray = Variables.get('selectItemNameArray')
      self.each(function (model) {
        var barcodeTreeId = model.get('barcodeTreeId')
        var barcodeIndex = +selectItemNameArray.indexOf(barcodeTreeId)
        model.set('barcodeIndex', barcodeIndex)
      })
    },
    /**
     * 获得barcode比较的结果
     */
    get_comparison_result: function () {
      var self = this
      self.each(function (model) {
        model.get_single_comparison_result()
      })
    },
    /**
     *  筛选与当前barcode比较一定相似度范围的barcode
     */
    filter_barcode: function (percentage_value) {
      var self = this
      var percentageMinValue = percentage_value[0] / 100
      var percentageMaxValue = percentage_value[1] / 100
      self.each(function (model) {
        var nodeDifference = model.get_node_difference()
        if ((nodeDifference <= percentageMaxValue) && (nodeDifference >= percentageMinValue)) {
          model.set('filterState', true)
        } else {
          model.set('filterState', false)
        }
      })
    },
    /**
     *  清空所有筛选的barcode
     */
    clear_filter_barcode: function () {
      var self = this
      self.each(function (model) {
        model.set('filterState', false)
      })
    },
    /**
     * 按照paddingnode的长度进行barcode的排序
     * @param coverRectIndex
     */
    sort_cover_rect_barcode_model: function (coverRectIndex, parameter) {
      var self = this
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var nodeNumberA = getNodeNumber(model_a, coverRectIndex)
        var nodeNumberB = getNodeNumber(model_b, coverRectIndex)
        if (parameter === 'asc')
          return nodeNumberA - nodeNumberB
        return nodeNumberB - nodeNumberA
      })
      for (var mI = 0; mI < modelArray.length; mI++) {
        var barcodeTreeId = modelArray[mI].get('barcodeTreeId')
        modelArray[mI].set('barcodeIndex', mI)
      }
      self.update_barcode_location()
      // self.trigger_barcode_loc()
      function getNodeNumber(model, coverRectIndex) {
        var paddingNodeObjArray = model.get('paddingNodeObjArray')
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var paddingNodeStartIndex = paddingNodeObjArray[coverRectIndex].paddingNodeStartIndex
        var paddingNodeEndIndex = paddingNodeObjArray[coverRectIndex].paddingNodeEndIndex
        var nodeValue = 0
        if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
          nodeValue = self.get_node_number(paddingNodeStartIndex, paddingNodeEndIndex, barcodeNodeAttrArray)
        } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
          nodeValue = self.get_sum_attr_value(paddingNodeStartIndex, paddingNodeEndIndex, barcodeNodeAttrArray)
        }
        return nodeValue
      }
    },
    /**
     *  按照原始选择的顺序对于barcode进行排序
     */
    recover_barcode_model_sequence: function () {
      var self = this
      self.sortExistedConfigObj = null
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var nodeIndexA = model_a.get('originalBarcodeIndex')
        var nodeIndexB = model_b.get('originalBarcodeIndex')
        return nodeIndexA - nodeIndexB
      })

      for (var mI = 0; mI < modelArray.length; mI++) {
        modelArray[mI].set('barcodeIndex', mI)
      }
      self.update_barcode_location()
      // self.trigger_barcode_loc()
    },
    /**
     * 计算某个范围内, 在某些层级上的节点数量
     */
    get_node_number: function (rangeStart, rangeEnd, barcodeNodeAttrArray) {
      var self = this
      var nodeNumber = 0
      var currentLevel = Variables.get('currentLevel')
      for (var bI = rangeStart; bI <= rangeEnd; bI++) {
        if ((barcodeNodeAttrArray[bI].existed) && (barcodeNodeAttrArray[bI].depth < currentLevel)) {
          nodeNumber = nodeNumber + 1
        }
      }
      return nodeNumber
    },
    get_sum_attr_value: function (rangeStart, rangeEnd, barcodeNodeAttrArray) {
      var self = this
      var sumValue = 0
      var maxDepth = Variables.get('maxDepth')
      for (var bI = rangeStart; bI <= rangeEnd; bI++) {
        if (barcodeNodeAttrArray[bI].existed) {
          if (barcodeNodeAttrArray[bI].depth === maxDepth) {
            sumValue = sumValue + barcodeNodeAttrArray[bI].num
          }
        }
      }
      return sumValue
    },
    /**
     *  barcode节点之间的interval变化的响应函数
     */
    change_barcode_interval: function () {
      var self = this
      //  首先按照当前的状态改变节点的属性值
      self.change_barcode_attr_array()
      self.update_barcode_node_attr_array()
      self.update_all_barcode_view()
      self.trigger_render_supertree()
    },
    /**
     *  barcode的节点变化的响应函数
     */
    change_barcode_width: function () {
      var self = this
      //  首先按照当前的状态改变节点的属性值
      self.change_barcode_attr_array()
      self.update_barcode_node_attr_array()
      self.update_all_barcode_view()
      self.trigger_render_supertree()
    },
    /**
     *  首先根据变换得到的不同的属性值计算新的barcode attr array
     */
    change_barcode_attr_array: function () {
      var self = this
      self.each(function (model) {
        model.change_barcode_attr_array()
        self.collapse_all_subtree(model)
      })
      self.updateBarcodeNodexMaxX()
    },
    /**
     *  barcode节点的高度变化的响应函数
     */
    change_barcode_heigth: function () {
      var self = this
      self.update_barcode_location()
      self.update_all_barcode_view()
    },
    // get_barcode_nodex_max: function () {
    //   var self = this
    //   var maxNodeX = 0
    //   var barcodePaddingLeft = Variables.get('barcodePadding')
    //   var barcodePaddingRight = Variables.get('barcodePadding')
    //   var originalBarcodetreeViewWidth = +$('#barcodetree-scrollpanel').width()
    //   self.each(function (model) {
    //     var barcodeNodeAttrArray = null
    //     if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
    //       barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
    //     } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
    //       barcodeNodeAttrArray = model.get('compactBarcodeNodeAttrArray')
    //     }
    //     var nodeX = barcodePaddingLeft + barcodeNodeAttrArray[barcodeNodeAttrArray.length - 1].x + barcodeNodeAttrArray[barcodeNodeAttrArray.length - 1].width + barcodePaddingRight
    //     maxNodeX = maxNodeX > nodeX ? maxNodeX : nodeX
    //   })
    //   maxNodeX = maxNodeX > originalBarcodetreeViewWidth ? maxNodeX : originalBarcodetreeViewWidth
    //   return maxNodeX
    // },
    update_subtreenode_location: function () {
      var self = this
      var subtreeNodeArrayObj = self.subtreeNodeArrayObj
      for (var rootId in subtreeNodeArrayObj) {
        self.each(function (barcodeModel) {
          var rootX = barcodeModel.get_node_location(rootId)
          if (rootX != null) {
            subtreeNodeArrayObj[rootId].locationX = rootX
          }
          if (rootX != null) {
            self.trigger_render_supertree(subtreeNodeArrayObj)
            return
          }
        })
      }
    },
    align_added_model: function () {
      var self = this
      var alignedNodeIdArray = self.alignedNodeIdArray
      var deferredsArray = []
      for (var aI = (alignedNodeIdArray.length - 1); aI >= 0; aI--) {
        // for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
        var deferObj = $.Deferred()
        var alignedNodeId = alignedNodeIdArray[aI]
        var alignedObj = get_aligned_obj(alignedNodeId)
        var barcodeAlignedNodeGap = Config.get('BARCODE_ALIGNED_NODE_GAP')
        var alignedNodeLevel = alignedObj.depth
        var alignedNodeCategory = alignedObj.category
        var alignedNodeMaxX = self.getGlobalMaxX(alignedObj, barcodeAlignedNodeGap)
        // var rootAttrObj = get_root_attr(alignedNodeId)
        var selectedItemsArray = Variables.get('selectItemNameArray')
        var url = 'build_super_tree'
        window.Datacenter.buildSuperTree(url, selectedItemsArray, alignedNodeId, alignedNodeLevel, alignedNodeCategory, alignedNodeMaxX, deferObj)
        deferredsArray.push(deferObj)
      }
      // update view
      $.when.apply(null, deferredsArray).done(function () {
        Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW_WIDTH'])
        Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
      })

      function get_aligned_obj(alignedNodeId) {
        var barcodeModel = self.at(0)
        var barcodeNodeAttrArray = barcodeModel.get('barcodeNodeAttrArray')
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[bI].id === alignedNodeId) {
            return barcodeNodeAttrArray[bI]
          }
        }
      }

      function get_root_attr(alignedNodeId) {
        var alignedNodeLevel = null
        var alignedNodeCategory = null
        var alignedNodeMaxX = 0
        var alignedNodeArray = alignedNodeId.split('-')
        var r = /^[0-9]+$/
        var nodeCategory = alignedNodeArray[2]
        if (r.test(nodeCategory)) {
          nodeCategory = +nodeCategory
        } else {
          nodeCategory = NaN
        }
        self.each(function (barcodeModel) {
          var barcodeNodeAttrArray = barcodeModel.get('barcodeNodeAttrArray')
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            alignedNodeCategory = barcodeNodeAttrArray[bI].category
            var thisBarcodeNodeX = barcodeNodeAttrArray[bI].x
            if (barcodeNodeAttrArray[bI].id === alignedNodeId) {
              alignedNodeLevel = barcodeNodeAttrArray[bI].depth
              if (alignedNodeMaxX < thisBarcodeNodeX) {
                alignedNodeMaxX = thisBarcodeNodeX
              }
              break
            }
            // var thisCategory = +barcodeNodeAttrArray[ bI ].category
            // if ((nodeCategory != NaN) && (thisCategory != NaN)) {
            //   if (thisCategory > nodeCategory) {
            //     if (alignedNodeMaxX < thisBarcodeNodeX) {
            //       alignedNodeMaxX = barcodeNodeAttrArray[ bI ].x
            //     }
            //     break
            //   }
            // }
          }
        })
        var rootAttr = {}
        rootAttr.alignedNodeLevel = alignedNodeLevel
        rootAttr.alignedNodeCategory = alignedNodeCategory
        rootAttr.alignedNodeMaxX = alignedNodeMaxX
        return rootAttr
      }
    },
    /**
     * 触发关闭superTree视图的信号
     */
    trigger_close_supertree_view: function () {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')['CLOSE_SUPER_TREE'])
      window.Variables.update_barcode_attr()
    },
    /**
     * 在向barcode collection中增加了barcode model之后更新barcode view视图
     */
    // trigger_barcode_view_render_update: function () {
    //   var self = this
    //   self.trigger_barcode_loc()
    //   self.trigger_barcode_view_width()
    // },
    trigger_render_supertree: function (subtreeNodeArrayObj) {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')['RENDER_SUPERTREE'])
    },
    /**
     * trigger 更新barcode位置的信号, 在barcode single view中进行更新
     * @param comparedNodeId
     */
    trigger_barcode_loc: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_LOC'])
    },
    /**
     * trigger信号 更新barcodeview的宽度
     */
    trigger_barcode_view_width: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW_WIDTH'])
    },
    /**
     *  trigger 更新barcode的summary的信号, 在barcode single view中进行更新
     */
    trigger_update_summary: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_SUMMARY'])
    },
    //  trigger 更新supertree视图的信号
    trigger_super_view_update: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['RENDER_SUPERTREE'])
    },
    clear_barcode_dataset: function () {
      var self = this
      self.reset()
      Backbone.Events.trigger(Config.get('EVENTS')['RESET_BARCODE_ATTR'])
    },
    update_covered_rect_obj: function () {
      var self = this
      self.each(function (model) {
        model.update_covered_rect_obj(self.alignedNodeIdArray)
      })
    }
  })
})
