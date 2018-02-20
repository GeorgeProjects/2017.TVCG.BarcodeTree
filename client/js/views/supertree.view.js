define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'd3',
  'config',
  'variables',
  'views/svg-base.addon'
], function (require, Mn, _, Backbone, d3, Config, Variables, SVGBase) {
  'use strict'
  /**
   * superTree视图的整体是一个冰柱图, 由不同层级的节点依次构成, 默认最上方时根节点, 根节点的长度是所有的BarcodeTree中的最宽的长度
   *
   * superTree视图的设计有两个目的, 第一个是在对于barcodeTree中的没有对齐的状态下, 只是提供BarcodeTree进行数值比较的功能, 与BarcodeTree的节点数值比较相对应
   * focus并不是对齐比较, 在不focus到任何子树的情况下, 相当于focus到根节点的子树, focus到整体的子树或者整个树, 此时仅仅比较下一层子树的节点数目, 或者属性值数目
   * 在对齐节点进行比较的情况下, 就要具体的移动superTree中子树的根节点的位置, 移动到对应的位置上
   */
  return Mn.ItemView.extend(_.extend({
    tagName: 'svg',
    template: false, //  for the itemview, we must define the template value false
    attributes: {
      style: 'width: 100%; height: 100%;',
      id: 'supertree-svg'
    },
    default: {
      barcodePaddingLeft: null,
      barcodeHeight: null,
      clickedObject: null,
      sortObject: null,
      sortType: null,
      clickedRectIndex: null,
      barcodeOriginalNodeHeight: Variables.get('barcodeHeight'),
      barcodeCompactNodeHeight: Variables.get('barcodeHeight') / (window.compactNum + (window.compactNum - 1) / 4)
    },
    events: {},
    initialize: function () {
      var self = this
      self.initEventFunc()
      self.initParaFunc()
      self.initSuperTreeToggleLoc()
    },
    initEventFunc: function () {
      var self = this
      Backbone.Events.on(Config.get('EVENTS')['OPEN_SUPER_TREE'], function (event) {
        self.open_supertree_view()
      })
      Backbone.Events.on(Config.get('EVENTS')['CLOSE_SUPER_TREE'], function (event) {
        self.close_supertree_view()
      })
      Backbone.Events.on(Config.get('EVENTS')['RENDER_SUPERTREE'], function (event) {
        self.draw_super_tree()
      })
      Backbone.Events.on(Config.get('EVENTS')['UPDATE_ALIGNED_ICON'], function (event) {
        self.update_aligned_sort_icon()
      })
      Backbone.Events.on(Config.get('EVENTS')['HIGHLIGHT_ALL_RELATED_NODE'], function (event) {
        var nodeObj = event.nodeObj
        self.higlight_all_related_nodes(nodeObj)
      })
      Backbone.Events.on(Config.get('EVENTS')['HIGH_RELATED_NODES'], function (event) {
        var thisNodeObj = event.thisNodeObj
        self.higlight_all_related_nodes(thisNodeObj)
      })
      //  取消mouseover的高亮效果
      Backbone.Events.on(Config.get('EVENTS')['NODE_MOUSEOUT'], function (event) {
        if (typeof (event) !== 'undefined') {
          var eventView = event.eventView
          self.node_mouseout_handler(eventView)
        } else {
          self.node_mouseout_handler()
        }
      })
    },
    trigger_mouseout_event: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['NODE_MOUSEOUT'])
    },
    trigger_hovering_sort_barcode_node: function (nodeId) {
      Backbone.Events.trigger(Config.get('EVENTS')['HOVERING_SORT_BARCODE_NODE'], {
        'barcodeNodeId': nodeId
      })
    },
    trigger_unhovering_sort_barcode_node: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UNHOVERING_SORT_BARCODE_NODE'])
    },
    trigger_higlight_all_related_nodes: function (rootObj) {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')['HIGHLIGHT_ALL_RELATED_NODE'], {
        'nodeObj': rootObj
      })
    },
    trigger_higlight_all_selected_nodes: function (rootObj) {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')['HIGHLIGHT_ALL_SELECTED_NODE_SUPERTREEVIEW'])
    },
    initParaFunc: function () {
      var self = this
      var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
      var barcodePaddingLeft = Variables.get('barcodePaddingLeft')
      self.barcodePaddingLeft = barcodeTextPaddingLeft + barcodePaddingLeft
    },
    initSuperTreeToggleLoc: function () {
      var self = this
      var barcodeTreeConfigHeight = $('#top-toolbar-container').height()
      var histogramHeightRem = Variables.get('histogramHeightRem')
      var toolbarHistogramHeight = histogramHeightRem * window.rem_px + $('#toolbar-view-div').height()
      var toolbarViewDivHeight = +$('#toolbar-view-div').height()
      var histogramViewHeight = +$('#histogram-view').height()
      var topToolbarViewHeight = +$('#top-toolbar-container').height()
      $('#supertree-view-toggle').css('top', (toolbarViewDivHeight + histogramViewHeight + topToolbarViewHeight) + 'px')
    },
    node_mouseout_handler: function (eventView) {
      var self = this
      self.d3el.selectAll('.unhighlight')
        .classed('unhighlight', false)
      self.d3el.selectAll('.children-highlight')
        .style('fill', null)
      self.d3el.selectAll('.children-highlight')
        .classed('children-highlight', false)
      self.d3el.selectAll('.father-highlight')
        .style('fill', null)
      self.d3el.selectAll('.father-highlight')
        .classed('father-highlight', false)
      self.d3el.selectAll('.selection-sibling-highlight')
        .classed('selection-sibling-highlight', false)
      //  更新原始的barcodeTree以及superTree中选择的节点
      self.highlight_selection_supertree_selection_nodes()
    },
    highlight_selection_supertree_selection_nodes: function () {
      var self = this
      var treeDataModel = self.get_super_tree_data_model()
      if (typeof (treeDataModel) === 'undefined') {
        return
      }
      var barcodeCollection = self.options.barcodeCollection
      var supertreeSelectedNodesIdObj = barcodeCollection.get_supertree_selected_nodes_id()
      var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
      //  首先将所有的节点取消selection的高亮
      self.cancel_selection_highlight()
      //  首先对所有的节点的透明度统一进行改变
      self.selection_unhighlightNodes()
      //  高亮从superTree中选择的节点
      for (var item in supertreeSelectedNodesIdObj) {
        var nodeId = item
        var nodeDepth = supertreeSelectedNodesIdObj[item]
        var relatedNodesObj = treeDataModel.find_super_tree_related_nodes({id: nodeId, depth: nodeDepth})
        self.highlight_single_selection_node(nodeId, nodeDepth)
        if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
          var selectedSiblingNodeObjArray = relatedNodesObj.siblingNodes
          if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
            for (var sI = 0; sI < selectedSiblingNodeObjArray.length; sI++) {
              var selectedSiblingNode = selectedSiblingNodeObjArray[sI]
              var nodeId = selectedSiblingNode.id
              var nodeDepth = selectedSiblingNode.depth
              self.highlight_single_sibling_node(nodeId, nodeDepth)
            }
          }
          var selectedChildrenNodeIdArray = relatedNodesObj.childrenNodes
          if (typeof (selectedChildrenNodeIdArray) !== 'undefined') {
            for (var sI = 0; sI < selectedChildrenNodeIdArray.length; sI++) {
              var selectedChildrenNode = selectedChildrenNodeIdArray[sI]
              var nodeId = selectedChildrenNode.id
              var nodeDepth = selectedChildrenNode.depth
              self.highlight_single_selection_node(nodeId, nodeDepth)
            }
          }
          var selectedFatherCurrentNodes = relatedNodesObj.fatherCurrentNodes
          if (typeof (selectedFatherCurrentNodes) !== 'undefined') {
            for (var sI = 0; sI < selectedFatherCurrentNodes.length; sI++) {
              var selectedFatherNode = selectedFatherCurrentNodes[sI]
              var nodeId = selectedFatherNode.id
              var nodeDepth = selectedFatherNode.depth
              self.highlight_single_selection_node(nodeId, nodeDepth)
            }
          }
        }
      }
      //  如果当前所处的状态是对齐的状态, 那么节点不会高亮
      //  高亮从实际的barcodeTree中选择的节点
      // var selectedNodesIdObj = barcodeCollection.get_selected_nodes_id()
      // // 然后按照选择的状态对于节点进行高亮
      // for (var item in selectedNodesIdObj) {
      //   var nodeId = item
      //   var nodeDepth = selectedNodesIdObj[item].nodeObjDepth
      //   var nodeObj = {
      //     nodeObjId: nodeId,
      //     barcodeTreeId: selectedNodesIdObj[item].barcodeTreeId
      //   }
      //   if (barcodeCollection.get_node_obj_index_in_highlight_all_children_nodes_array(nodeObj) === -1) {
      //     //  之前选择的节点不存在与highlight all children nodes的情况下被高亮
      //     self.highlight_single_selection_node(nodeId, nodeDepth)
      //     if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
      //       var relatedNodesObj = treeDataModel.find_super_tree_related_nodes({id: nodeId, depth: nodeDepth})
      //       var selectedSiblingNodeObjArray = selectedNodesIdObj[item].selectedSiblingNodeObjArray
      //       if (typeof (selectedSiblingNodeObjArray) === 'undefined') {
      //         selectedSiblingNodeObjArray = relatedNodesObj.siblingNodes
      //       }
      //       if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
      //         for (var sI = 0; sI < selectedSiblingNodeObjArray.length; sI++) {
      //           var selectedSiblingNode = selectedSiblingNodeObjArray[sI]
      //           var nodeId = selectedSiblingNode.id
      //           var nodeDepth = selectedSiblingNode.depth
      //           self.highlight_single_sibling_node(nodeId, nodeDepth)
      //         }
      //       }
      //       var selectedChildrenNodeIdArray = selectedNodesIdObj[item].selectedChildrenNodeIdArray
      //       if (typeof (selectedChildrenNodeIdArray) === 'undefined') {
      //         selectedChildrenNodeIdArray = relatedNodesObj.childrenNodes
      //       }
      //       if (typeof (selectedChildrenNodeIdArray) !== 'undefined') {
      //         for (var sI = 0; sI < selectedChildrenNodeIdArray.length; sI++) {
      //           var selectedChildrenNode = selectedChildrenNodeIdArray[sI]
      //           var nodeId = selectedChildrenNode.id
      //           var nodeDepth = selectedChildrenNode.depth
      //           self.highlight_single_selection_node(nodeId, nodeDepth)
      //         }
      //       }
      //       var selectedFatherNodeIdArray = relatedNodesObj.fatherCurrentNodes
      //       if (typeof (selectedFatherNodeIdArray) !== 'undefined') {
      //         for (var sI = 0; sI < selectedFatherNodeIdArray.length; sI++) {
      //           var selectedFatherNode = selectedFatherNodeIdArray[sI]
      //           var nodeId = selectedFatherNode.id
      //           var nodeDepth = selectedFatherNode.depth
      //           self.highlight_single_selection_node(nodeId, nodeDepth)
      //         }
      //       }
      //     }
      //   }
      // }
      //  判断是否存在选中的节点, 如果不存在那么需要将透明度恢复原始状态
      if ((self.d3el.selectAll('.selection-highlight').empty()) && (self.d3el.selectAll('.selection-sibling-highlight').empty())) {
        self.cancel_selection_unhighlightNodes()
      }
    },
    //  取消所有节点的高亮, 恢复到最原始的状态
    cancel_selection_highlight: function () {
      var self = this
      self.d3el.selectAll('.selection-unhighlight')
        .classed('selection-unhighlight', false)
      self.d3el.selectAll('.selection-highlight')
        .classed('selection-highlight', false)
        .style('fill', null)
      self.d3el.selectAll('.father-highlight')
        .classed('father-highlight', false)
        .style('fill', null)
      self.d3el.selectAll('.selection-sibling-highlight')
        .classed('selection-sibling-highlight', false)
    },
    selection_unhighlightNodes: function () {
      var self = this
      self.d3el.selectAll('.supertree-icicle-node').classed('selection-unhighlight', true)
    },
    //  高亮选择的后代的节点
    highlight_single_selection_node: function (nodeId, nodeDepth) {
      var self = this
      var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
      self.d3el.select('.supertree-icicle-node#' + nodeId)
        .classed('selection-highlight', true)
        .style('fill', barcodeNodeColorArray[nodeDepth])
      self.d3el.select('.supertree-icicle-node#' + nodeId)
        .classed('selection-sibling-highlight', false)
      self.d3el.select('.supertree-icicle-node#' + nodeId)
        .classed('selection-unhighlight', false)
      self.d3el.select('.supertree-icicle-node#' + nodeId)
        .classed('unhighlight', false)
    }
    ,
    //  高亮选择的兄弟节点
    highlight_single_sibling_node: function (nodeId, nodeDepth) {
      var self = this
      if (!self.d3el.select('.supertree-icicle-node#' + nodeId).empty()) {
        if (!self.d3el.select('.supertree-icicle-node#' + nodeId).classed('selection-highlight')) {
          self.d3el.select('.supertree-icicle-node#' + nodeId)
            .classed('selection-sibling-highlight', true)
          self.d3el.select('.supertree-icicle-node#' + nodeId)
            .classed('selection-unhighlight', false)
        }
      }
    },
    //  高亮所有找到的相关节点
    higlight_all_related_nodes: function (nodeObj) {
      var self = this
      var treeDataModel = self.get_super_tree_data_model()
      if (typeof (treeDataModel) !== 'undefined') {
        var findingNodesObj = treeDataModel.find_super_tree_related_nodes(nodeObj)
        self.highlight_finding_node(nodeObj, findingNodesObj)
      }
    },
    //  分类高亮找到的节点
    highlight_finding_node: function (nodeObj, findingNodesObj) {
      var self = this
      self.unhighlightNodes()
      self.cancel_selection_unhighlightNodes()
      var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
      if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['NODE_SELECTION']) {
        self.highlightSingleFindingNode(nodeObj)
      } else if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
        var childrenNodes = findingNodesObj.childrenNodes
        self.highlightChildrenNodes(childrenNodes)
        var fatherCurrentNodes = findingNodesObj.fatherCurrentNodes
        self.highlightFatherAndCurrentNodes(fatherCurrentNodes)
        var siblingNodes = findingNodesObj.siblingNodes
        self.highlightSiblingNodes(siblingNodes)
      }
    },
    unhighlightNodes: function () {
      var self = this
      self.d3el.selectAll('.supertree-icicle-node').classed('unhighlight', true)
    },
    cancel_selection_unhighlightNodes: function () {
      var self = this
      self.d3el.selectAll('.supertree-icicle-node').classed('selection-unhighlight', false)
      self.d3el.selectAll('.selection-highlight').style('fill', null)
    },
    /**
     * 高亮当前节点
     */
    highlightSingleFindingNode: function (nodeObj) {
      var self = this
      var nodeObjDepth = nodeObj.depth
      var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
      self.d3el.select('.supertree-icicle-node#' + nodeObj.id)
        .classed('father-highlight', true)
        .style('fill', barcodeNodeColorArray[nodeObjDepth])
      self.d3el.select('.supertree-icicle-node#' + nodeObj.id)// 需要对于当前鼠标hover的节点取消高亮
        .classed('unhighlight', false)
    },
    /**
     * 高亮孩子节点
     */
    highlightChildrenNodes: function (childrenNodesArray) {
      var self = this
      var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
      for (var cI = 0; cI < childrenNodesArray.length; cI++) {
        var childrenNodeDepth = childrenNodesArray[cI].depth
        self.d3el.select('.supertree-icicle-node#' + childrenNodesArray[cI].id)
          .classed('children-highlight', true)
          .style('fill', barcodeNodeColorArray[childrenNodeDepth])
        self.d3el.select('.supertree-icicle-node#' + childrenNodesArray[cI].id)
          .classed('unhighlight', false)
      }
    },
    /**
     * 高亮兄弟节点
     * @param siblingNodesArray
     */
    highlightSiblingNodes: function (siblingNodesArray) {
      var self = this
      for (var sI = 0; sI < siblingNodesArray.length; sI++) {
        self.d3el.selectAll('.supertree-icicle-node#' + siblingNodesArray[sI].id)
          .classed('selection-sibling-highlight', true)
        self.d3el.selectAll('.supertree-icicle-node#' + siblingNodesArray[sI].id)
          .classed('unhighlight', true)
      }
    },
    /**
     * 高亮从根节点到当前节点路径上的节点
     */
    highlightFatherAndCurrentNodes: function (fatherNodesArray) {
      var self = this
      var treeDataModel = self.get_super_tree_data_model()
      var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
      //  在非对齐的情况下也要将节点进行高亮
      for (var fI = 0; fI < fatherNodesArray.length; fI++) {
        if (fatherNodesArray[fI].width !== 0) {
          var fatherNodeDepth = fatherNodesArray[fI].depth
          self.d3el.select('.supertree-icicle-node#' + fatherNodesArray[fI].id)
            .classed('father-highlight', true)
            .style('fill', barcodeNodeColorArray[fatherNodeDepth])
          self.d3el.select('.supertree-icicle-node#' + fatherNodesArray[fI].id)// 需要对于当前鼠标hover的节点取消高亮
            .classed('unhighlight', false)
        }
      }
    },
    //  ========================================================
    /**
     * 根据其他视图传动的节点对象,找到在该视图中的节点
     * @param 其他视图传递的节点对象
     * @returns 在该视图中找到的节点对象, 如果没有找到则返回null
     */
    findCurrentNodeObj: function (nodeObj) {
      var self = this
      var treeDataModel = self.get_super_tree_data_model()
      var barcodeNodeAttrArray = self.get_barcode_node_array()
      var alignedRangeObjArray = self.get_aligned_range_array()
      var paddingNodeObjArray = self.get_padding_node_array()
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if ((barcodeNodeAttrArray[bI].depth === nodeObj.depth) && (barcodeNodeAttrArray[bI].id === nodeObj.id) && (barcodeNodeAttrArray[bI].existed) && (self.isBelongAligned(bI, alignedRangeObjArray, paddingNodeObjArray))) {
          return barcodeNodeAttrArray[bI]
        }
      }
      return null
    },
    onShow: function () {
      var self = this
      var barcodeHeight = Variables.get('superTreeHeight')
      self.barcodeHeight = barcodeHeight
      var barcodePaddingGap = 8
      self.barcodePaddingGap = barcodePaddingGap
      var barcodePaddingTop = barcodeHeight * 0.4
      self.barcodePaddingTop = barcodePaddingTop
      var barcodeNodeHeight = barcodeHeight * 0.6 - barcodePaddingGap
      self.barcodeNodeHeight = barcodeNodeHeight
      var sortCount = 0
      var sortTypeArray = ['asc', 'desc', 'unsort']
      var sortTypeObject = {
        'asc': '\uf0de',
        'desc': '\uf0dd',
        'unsort': '\uf0dc'
      }
      var barcodePaddingLeft = self.barcodePaddingLeft
      var superTreeWidth = $('#supertree-scroll-panel').width()
      self.d3el.append('rect')
        .attr('class', 'container-bg')
        .attr('id', 'container-bg')
        .attr('width', superTreeWidth)
        .attr('height', self.barcodeHeight)
        .on('mouseover', function (d, i) {
          self.trigger_mouseout_event()
        })
        .on('click', function (d, i) {
          self.remove_options_button()
        })
      var tip = window.tip
      self.d3el.call(tip)
      // var COMPARISON_RESULT_PADDING = Config.get('COMPARISON_RESULT_PADDING')
      // if (Variables.get('displayMode') === Config.get('CONSTANT')['GLOBAL']) {
      //   barcodePaddingLeft = barcodePaddingLeft + COMPARISON_RESULT_PADDING
      // }
      self.barcodeContainer = self.d3el.append('g')
        .attr('transform', 'translate(' + barcodePaddingLeft + ',' + 0 + ')') // transformY (barcodePaddingTop + barcodePaddingGap / 2)
        .attr('id', 'barcode-container')
      // self.d3el
      // // .select('#barcode-sorting-container')
      //   .append("text")
      //   .attr('class', 'sort-button')
      //   .attr("x", (self.barcodePaddingLeft / 2))
      //   .attr("y", barcodeHeight / 2)
      //   .attr("font-family", "FontAwesome")
      //   .attr('font-size', function (d) {
      //     return '30px';
      //   })
      //   .text(function (d) {
      //     return '\uf0dc';
      //   })
      //   .attr('text-anchor', 'middle')
      //   .attr('alignment-baseline', 'middle')
      //   .style("cursor", "pointer")
      //   .style('fill', '#ddd')
      //   .on('click', function (d, i) {
      //     self.d3el.selectAll('.sort-indicator').remove()
      //     var sortType = sortCount % sortTypeArray.length
      //     d3.select(this).text(function (d) {
      //       return sortTypeObject[sortTypeArray[sortType]]
      //     })
      //     if (sortType == 0) {
      //       //  升序排列
      //       d3.select(this).style('fill', 'black')
      //       window.Datacenter.barcodeCollection.sort_whole_barcode_model(sortTypeArray[sortType])
      //     } else if (sortType == 1) {
      //       //  降序排列
      //       d3.select(this).style('fill', 'black')
      //       window.Datacenter.barcodeCollection.sort_whole_barcode_model(sortTypeArray[sortType])
      //     } else if (sortType == 2) {
      //       //  原始顺序排列
      //       d3.select(this).style('fill', '#ddd')
      //       window.Datacenter.barcodeCollection.recover_barcode_model_sequence()
      //     }
      //     sortCount = sortCount + 1
      //   })
    },
    //  根据当前focus的子树决定子树的层级, 在superTree中增加的节点
    update_supertree_height: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var alignedNodeObjArray = barcodeCollection.get_aligned_subtree()
      var maxDepth = 0
      for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
        if (alignedNodeObjArray[aI].alignedNodeLevel > maxDepth) {
          maxDepth = alignedNodeObjArray[aI].alignedNodeLevel
        }
      }
      //  如果maxDepth是1, 说明focus到了第一层, 那么应该在上面存在一个根节点层, 在下面存在一个subtree层
      //  增加两个1是因为自然的maxDepth少一层, 再加一个1是因为maxDepth后面还需要扩展一层
      maxDepth = maxDepth + 1 + 1
      var selectedLevels = Variables.get('selectedLevels')
      var maxSelectedLevel = selectedLevels.max()
      maxDepth = maxDepth > maxSelectedLevel ? maxSelectedLevel : maxDepth
      self._change_supertreeview_height(maxDepth)
    },
    //  改变supertree视图的高度
    _change_supertreeview_height: function (maxDepth) {
      var self = this
      var superTreeVisibleHeight = Variables.get('superTreeHeight')
      var levelHeight = superTreeVisibleHeight / 2
      d3.select('#supertree-svg').attr('height', levelHeight * maxDepth)
      d3.select('#supertree-svg').select('#container-bg').attr('height', levelHeight * maxDepth)
      $('#supertree-view').height(levelHeight * maxDepth)
    },
    //  计算在不同层级上的aligned节点
    get_aligned_nodes_different_level: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var treeDataModel = self.get_super_tree_data_model()
      if (typeof (treeDataModel) === 'undefined') {
        return
      }
      var barcodeCollection = self.options.barcodeCollection
      var alignedNodeObjArray = barcodeCollection.get_aligned_subtree()
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var allAlignedNodesArray = []
      if (barcodeNodeAttrArray.length > 0) {
        var alignedNodeObj = JSON.parse(JSON.stringify(barcodeNodeAttrArray[0]))
        if (barcodeCollection.is_exist_align_part()) {
          alignedNodeObj.accurate_subtree = false // 如果存在align的部分, 根节点就按照不是精确节点的位置进行更新位置
          alignedNodeObj.accurate_subtree_id = barcodeNodeAttrArray[0].id
        } else {
          alignedNodeObj.accurate_subtree = true // 否则按照精确节点的位置进行更新
        }
        allAlignedNodesArray.push(alignedNodeObj)
      }
      if (Variables.get('displayMode') !== Config.get('CONSTANT').GLOBAL) {
        for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
          alignedNodeObjArray[aI].id = alignedNodeObjArray[aI].alignedNodeId
          alignedNodeObjArray[aI].depth = alignedNodeObjArray[aI].alignedNodeLevel
          var fatherNodeArray = treeDataModel.find_father_current_nodes(alignedNodeObjArray[aI])
          var fatherNodeArray = barcodeCollection.find_all_father_current_nodes(alignedNodeObjArray[aI])
          var subtreeRootNode = null
          var subtreeRootLevel = 1
          for (var fI = 0; fI < fatherNodeArray.length; fI++) {
            if (fatherNodeArray[fI].depth === subtreeRootLevel) {
              subtreeRootNode = fatherNodeArray[fI]
            }
          }
          for (var fI = 0; fI < fatherNodeArray.length; fI++) {
            var fatherNode = JSON.parse(JSON.stringify(fatherNodeArray[fI]))
            if ((fatherNode.id === alignedNodeObjArray[aI].id) && (fatherNode.depth === alignedNodeObjArray[aI].depth)) {
              fatherNode.accurate_subtree = true // 最下层的节点按照不是精确节点的位置进行更新位置, 否则按照精确节点的位置进行更新
            } else {
              fatherNode.accurate_subtree = false // 非最下层节点按照不是精确节点的位置进行更新位置
              fatherNode.accurate_subtree_id = subtreeRootNode.id
            }
            if (!is_exist(fatherNode, allAlignedNodesArray)) {
              allAlignedNodesArray.push(fatherNode)
            }
          }
        }
      }
      var allAlignedNodesObj = {}
      for (var aI = 0; aI < allAlignedNodesArray.length; aI++) {
        var nodeDepth = allAlignedNodesArray[aI].depth
        if (typeof (allAlignedNodesObj[nodeDepth]) === 'undefined') {
          allAlignedNodesObj[nodeDepth] = []
        }
        allAlignedNodesObj[nodeDepth].push(allAlignedNodesArray[aI])
      }
      return allAlignedNodesObj
      //  输入nodeObj对象以及alignNodesArray数组, 判断对象是否在数组中是否存在
      function is_exist(nodeObj, alignedNodesArray) {
        var existState = false
        for (var aI = 0; aI < alignedNodesArray.length; aI++) {
          if (nodeObj.id === alignedNodesArray[aI].id) {
            existState = true
            break
          }
        }
        return existState
      }
    },
    //  依次计算每一层的节点的位置并且进行渲染
    append_supernodes_different_level: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var treeDataModel = self.get_super_tree_data_model()
      var superTreeVisibleHeight = Variables.get('superTreeHeight')
      var levelNodeHeight = superTreeVisibleHeight / 2
      var allAlignedNodesObj = self.get_aligned_nodes_different_level()
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var maxLevel = 0
      var selectedLevels = Variables.get('selectedLevels')
      var maxSelectedLevel = selectedLevels.max()
      for (var item in allAlignedNodesObj) {
        var level = +item
        if (level > maxLevel) {
          maxLevel = level
        }
      }
      self.d3el.select('#barcode-container').selectAll('.level-g').remove()
      var alignedLevel = Variables.get('alignedLevel')
      if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
        alignedLevel = window.barcodeWidthArray.max()
      }
      d3.selectAll('.level-g').remove()
      for (var item in allAlignedNodesObj) {
        var alignedNodeArray = allAlignedNodesObj[item]
        item = +item
        for (var aI = 0; aI < alignedNodeArray.length; aI++) {
          var nodeId = alignedNodeArray[aI].id
          append_icicle(item, nodeId, levelNodeHeight, alignedNodeArray[aI])
          if (item === maxLevel) {
            var underLevel = maxLevel + 1
            if (underLevel < maxSelectedLevel) {
              //  判断aligned level是否align到当前的层级, 即underLevel
              console.log('alignedLevel', alignedLevel)
              console.log('underLevel', underLevel)
              if (alignedLevel < underLevel) {
                //  如果没有align到当前的层级, 那么就在underLevel层级下面增加表示比例的proportion icicle
                append_proportion_icicle(underLevel, nodeId, levelNodeHeight, alignedNodeArray[aI])
              } else {
                //  如果align到当前的层级, 那么就在underLevel层级下面增加表示范围的certain icicle
                append_certain_icicle(underLevel, nodeId, levelNodeHeight, alignedNodeArray[aI])
              }
            }
          }
        }
      }
      if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
        var maxLevel = 0
        var tablelensNodesIdArray = barcodeCollection.get_tablelens_nodes_id()
        for (var tI = 0; tI < tablelensNodesIdArray.length; tI++) {
          var nodeId = tablelensNodesIdArray[tI]
          var nodeObj = treeDataModel.get_node_obj_from_id(nodeId)
          var underLevel = nodeObj.depth + 1
          maxLevel = maxLevel > underLevel ? maxLevel : underLevel
        }
        if (tablelensNodesIdArray.length !== 0) {
          self._change_supertreeview_height(maxLevel + 1)
          //  对于global模式下的barcode, 需要确定下一层的barcode节点是tablelens的节点, 并且节点的大小和位置的确定方式是准确的
          for (var tI = 0; tI < tablelensNodesIdArray.length; tI++) {
            var nodeId = tablelensNodesIdArray[tI]
            var nodeObj = treeDataModel.get_node_obj_from_id(nodeId)
            var underLevel = nodeObj.depth + 1
            append_certain_icicle(underLevel, nodeId, levelNodeHeight, nodeObj)
          }
        }
      }
      //  在superTree视图中增加冰柱图的每一层
      function append_icicle(node_level, node_id, level_node_height, alignedNodeObj) {
        init_icicle_level_g(node_level, level_node_height)
        //  计算最大的BarcodeTree的width大小
        var icicleNodeObject = barcodeCollection.get_max_barcode_node_width(node_id, node_level, alignedNodeObj)
        var icicleNodeX = icicleNodeObject.x
        var icicleNodeWidth = icicleNodeObject.width
        if (self.d3el.select('#barcode-container').select('#level-' + node_level).select('#' + node_id).empty()) {
          self.d3el.select('#barcode-container')
            .select('#level-' + node_level)
            .append('rect')
            .attr('id', node_id)
            .attr('class', 'supertree-icicle-node')
            .attr('x', icicleNodeX)
            .attr('y', 0)
            .attr('height', level_node_height)
            .attr('width', icicleNodeWidth)
            .on('mouseover', function (d, i) {
              self.trigger_mouseout_event()
              var nodeId = d3.select(this).attr('id')
              var nodeObject = treeDataModel.get_node_obj_from_id(nodeId)
              self.trigger_higlight_all_related_nodes(nodeObject)
            })
            .on('mouseout', function (d, i) {
              self.trigger_mouseout_event()
            })
        } else {
          self.d3el.select('#barcode-container')
            .select('#level-' + node_level)
            .select('#' + node_id)
            .attr('x', icicleNodeX)
            .attr('y', 0)
            .attr('height', level_node_height)
            .attr('width', icicleNodeWidth)
        }
        return icicleNodeObject
      }

      //  在focus层级的barcodeTree下增加不确定的一层, 在这种模式下不能完全对应, 但是可以反映出不同类型的子树所占的比例
      function append_proportion_icicle(node_level, node_id, level_node_height, aligned_node_obj) {
        var nodeUpperLevel = node_level - 1
        var upperLevelIcicleNodeObject = barcodeCollection.get_max_barcode_node_width(node_id, nodeUpperLevel, aligned_node_obj)
        var upperLevelIcicleNodeX = upperLevelIcicleNodeObject.x
        var upperLevelIcicleNodeWidth = upperLevelIcicleNodeObject.width
        //  计算得到不同的subtree所占的比例, 如果是在attribute的状态下, 得到的是属性值的比例, 在topology的状态下, 得到的是节点数目的比例
        var barcodeSubtreeProportionArray = barcodeCollection.get_barcode_proportion(node_id)
        console.log('barcodeSubtreeProportionArray', barcodeSubtreeProportionArray)
        init_icicle_level_g(node_level, level_node_height)
        //  计算最大的BarcodeTree的width大小
        var proportionIcicleNodes = self.d3el.select('#barcode-container')
          .select('#level-' + node_level)
          .selectAll('.supertree-node-father-' + node_id)
          .data(barcodeSubtreeProportionArray, function (d, i) {
            return d.id
          })
        //  在非对齐情况下, 在icicle的视图中增加icicle的节点
        proportionIcicleNodes.enter()
          .append('rect')
          .attr('class', 'supertree-icicle-node ' + 'supertree-node-father-' + node_id)
          .attr('id', function (d, i) {
            return d.id
          })
          .attr('x', function (d, i) {
            return upperLevelIcicleNodeX + upperLevelIcicleNodeWidth * d.aggregatedProportion
          })
          .attr('y', 0)
          .attr('height', level_node_height)
          .attr('width', function (d, i) {
            return upperLevelIcicleNodeWidth * d.proportion
          })
          .on('mouseover', function (d, i) {
            self.trigger_mouseout_event()
            var nodeId = d3.select(this).attr('id')
            var nodeObject = treeDataModel.get_node_obj_from_id(nodeId)
            self.trigger_higlight_all_related_nodes(nodeObject)
          })
          .on('mouseout', function (d, i) {
            self.trigger_mouseout_event()
          })
        //  在非对齐情况下, 更新在icicle的视图中的icicle的节点
        proportionIcicleNodes
          .attr('x', function (d, i) {
            return upperLevelIcicleNodeX + upperLevelIcicleNodeWidth * d.aggregatedProportion
          })
          .attr('y', 0)
          .attr('height', level_node_height)
          .attr('width', function (d, i) {
            return upperLevelIcicleNodeWidth * d.proportion
          })
        //  在非对齐情况下, 删除在icicle的视图中的多余icicle的节点
        proportionIcicleNodes.exit().remove()
      }

      //  在focus层级的barcodeTree下增加确定的一层, 这种模式下的节点可以完全对应, 所有节点的最大的范围上增加superTree上的节点
      function append_certain_icicle(node_level, node_id, level_node_height, aligned_node_obj) {
        init_icicle_level_g(node_level, level_node_height)
        //  计算得到不同的subtree所占的比例, 如果是在attribute的状态下, 得到的是属性值的比例, 在topology的状态下, 得到的是节点数目的比例
        var barcodeDetailedSubtreeArray = barcodeCollection.get_barcode_detailed_subtree(node_id, node_level)
        var certainIcicleNodes = self.d3el.select('#barcode-container')
          .select('#level-' + node_level)
          .selectAll('.supertree-node-father-' + node_id)
          .data(barcodeDetailedSubtreeArray, function (d, i) {
            return d.id
          })
        //  在非对齐情况下, 在icicle的视图中增加icicle的节点
        certainIcicleNodes.enter()
          .append('rect')
          .attr('class', 'supertree-icicle-node ' + 'supertree-node-father-' + node_id)
          .attr('id', function (d, i) {
            return d.id
          })
          .attr('x', function (d, i) {
            return d.subtreeStartX
          })
          .attr('y', 0)
          .attr('height', level_node_height)
          .attr('width', function (d, i) {
            var certainIcicleNodeWidth = 0
            if ((d.subtreeEndX - d.subtreeStartX) >= 0) {
              certainIcicleNodeWidth = d.subtreeEndX - d.subtreeStartX
            }
            return certainIcicleNodeWidth
          })
          .on('mouseover', function (d, i) {
            self.trigger_mouseout_event()
            var nodeId = d3.select(this).attr('id')
            var nodeObject = treeDataModel.get_node_obj_from_id(nodeId)
            self.trigger_higlight_all_related_nodes(nodeObject)
          })
          .on('mouseout', function (d, i) {
            self.trigger_mouseout_event()
          })
        //  在非对齐情况下, 更新在icicle的视图中的icicle的节点
        certainIcicleNodes
          .attr('x', function (d, i) {
            return d.subtreeStartX
          })
          .attr('y', 0)
          .attr('height', level_node_height)
          .attr('width', function (d, i) {
            var certainIcicleNodeWidth = 0
            if ((d.subtreeEndX - d.subtreeStartX) >= 0) {
              certainIcicleNodeWidth = d.subtreeEndX - d.subtreeStartX
            }
            return certainIcicleNodeWidth
          })
        //  在非对齐情况下, 删除在icicle的视图中的多余icicle的节点
        certainIcicleNodes.exit().remove()
      }

      //  初始化绘制icicle plot每一层节点的g
      function init_icicle_level_g(node_level, level_node_height) {
        var translateX = 0
        if (self.d3el.select('#barcode-container').select('g#level-' + node_level).empty()) {
          self.d3el.select('#barcode-container')
            .append('g')
            .attr('id', 'level-' + node_level)
            .attr('class', 'level-g')
            .attr('transform', 'translate(' + translateX + ',' + level_node_height * node_level + ')')
        }
      }
    },
    //  增加操作的icon
    add_operation_icon: function (operated_node_id) {
      var self = this
      var levelId = operated_node_id.split('-')[1]
      var categoryTextPadding = 5
      var categoryRectX = +self.d3el.select('rect#' + operated_node_id).attr('x')
      var categoryRectY = +self.d3el.select('rect#' + operated_node_id).attr('y')
      var categoryRectHeight = +self.d3el.select('rect#' + operated_node_id).attr('height')
      var selectIconColor = Variables.get('select_icon_color')
      d3.select('.edit-icon#' + operated_node_id).remove()
      self.d3el.select('g#level-' + levelId)
        .append('text')
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('class', 'edit-icon')
        .attr('id', operated_node_id)
        .attr('font-family', 'FontAwesome')
        .attr('x', categoryRectX + categoryTextPadding)
        .attr('y', categoryRectY + categoryRectHeight / 2)
        .text('\uf08d')
        .style('fill', selectIconColor)
        .style('font-size', (categoryRectHeight / 2) + 'px')
    },
    //  增加标记排序的icon
    add_sort_icon: function (operated_node_id) {
      var self = this
      var levelId = operated_node_id.split('-')[1]
      var categoryTextPadding = 5
      var categoryRectX = +self.d3el.select('rect#' + operated_node_id).attr('x')
      var categoryRectY = +self.d3el.select('rect#' + operated_node_id).attr('y')
      var categoryRectHeight = +self.d3el.select('rect#' + operated_node_id).attr('height')
      var selectIconColor = Variables.get('select_icon_color')
      d3.select('.sort-icon#' + operated_node_id).remove()
      self.d3el.select('g#level-' + levelId)
        .append('text')
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('class', 'sort-icon')
        .attr('id', operated_node_id)
        .attr('font-family', 'FontAwesome')
        .attr('x', categoryRectX + categoryTextPadding)
        .attr('y', categoryRectY + categoryRectHeight / 2)
        .text('\uf0dc')
        .style('fill', selectIconColor)
        .style('font-size', (categoryRectHeight / 2) + 'px')
    },
    remove_operation_icon: function (operated_node_id) {
      var self = this
      self.d3el.select('.edit-icon#' + operated_node_id).remove()
    },
    add_single_category_text: function () {
      var self = this
      var barcodeHeight = self.barcodeHeight
      var barcodeCollection = self.options.barcodeCollection
      var treeDataModel = self.get_super_tree_data_model()
      if (typeof (treeDataModel) === 'undefined') {
        return
      }
      console.log('add_single_category_text')
      var barcodeTreeId = treeDataModel.get('barcodeTreeId')
      var barcodePaddingTop = self.barcodePaddingTop
      var barcodePaddingLeft = self.barcodePaddingLeft
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      // var addedCategoryArray = self.get_category_text_obj(rootId)
      var filteredAlignedElement = self.filtered_aligned_element()
      var barcodeCategoryHeight = 0
      if ((filteredAlignedElement.length === 0) || (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL)) {
        barcodeCategoryHeight = barcodeHeight
      } else {
        barcodeCategoryHeight = barcodePaddingTop
      }
      var tip = window.tip
      // if (addedCategoryArray.length > 0) {
      //   for (var aI = 0; aI < (addedCategoryArray.length - 1); aI++) {
      //     addedCategoryArray[aI].textWidth = addedCategoryArray[aI + 1].x - addedCategoryArray[aI].x
      //   }
      //   addedCategoryArray[addedCategoryArray.length - 1].textWidth = barcodeNodeAttrArray[barcodeNodeAttrArray.length - 1].x - addedCategoryArray[addedCategoryArray.length - 1].x
      // }
      self.d3el.selectAll('.category-text').remove()
      d3.selectAll('.supertree-icicle-node')
        .each(function (d, i) {
          var rectX = +d3.select(this).attr('x')
          var rectWidth = +d3.select(this).attr('width')
          var rectY = +d3.select(this).attr('y')
          var rectHeight = +d3.select(this).attr('height')
          var rectId = d3.select(this).attr('id')
          var parentNodeId = d3.select(this.parentNode).attr('id')
          var level = parentNodeId.replace('level-', '')
          // var nodeObject = treeDataModel.get_barcode_node_obj(rectId)
          var nodeObject = treeDataModel.get_node_obj_from_id(rectId)
          if (typeof (nodeObject) !== 'undefined') {
            nodeObject.textWidth = rectWidth
          }
          d3.select(this.parentNode).select('.category-text#' + rectId).remove()
          console.log('rectId', rectId)
          console.log('rectX', rectX)
          console.log('this.parentNode', d3.select(this.parentNode))
          d3.select(this.parentNode)
            .append("text")
            .attr('class', 'category-text')
            .attr('id', rectId)
            .attr("x", rectX + rectWidth / 2)//
            .attr("y", rectY + rectHeight / 2)
            .attr("font-family", "FontAwesome")
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text(function () {
              return textAbbr(nodeObject)
            })
            .style('font-size', (rectHeight / 2) + 'px')
            .on('mouseover', function (d, i) {
              var thisObjId = d3.select(this).attr('id')
              d3.select('rect#' + thisObjId).classed('mouseover-highlight', true)
              self.trigger_higlight_all_related_nodes(nodeObject)
              var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + nodeObject.categoryName + "</span></span>"
              if (nodeObject.categoryName !== textAbbr(nodeObject)) {
                tip.show(tipValue)
              }
            })
            .on('mouseout', function (d, i) {
              var thisObjId = d3.select(this).attr('id')
              d3.select('rect#' + thisObjId).classed('mouseover-highlight', false)
              self.trigger_mouseout_event()
              tip.hide()
            })
            .on('click', function (d, i) {
              var thisObjId = d3.select(this).attr('id')
              var selectMultiple = false
              self.supertree_node_click_handler(thisObjId, nodeObject, barcodeTreeId, selectMultiple)
              // if (d3.select('rect#' + thisObjId).classed('select-highlight')) {
              //   d3.select('rect#' + thisObjId).classed('select-highlight', false)
              //   barcodeCollection.remove_supertree_selected_subtree_id(nodeObject.id, nodeObject.depth)
              //   self.remove_supertree_selected_subtree_id(nodeObject.id, nodeObject.depth)
              // } else {
              //   d3.select('rect#' + thisObjId).classed('select-highlight', true)
              //   self.add_supertree_selected_subtree_id(nodeObject.id, nodeObject.depth)
              // }
              // if (self.d3el.select('.current-operated-icon#' + thisObjId).empty()) {
              //   self.add_operation_icon(thisObjId)
              // } else {
              //   self.remove_operation_icon(thisObjId)
              // }
              // self.trigger_higlight_all_selected_nodes()
            })
        })
      // d3.selectAll('.category-g').remove()
      // var categoryG = self.d3el.selectAll('.category-text')
      //   .data(addedCategoryArray)
      //   .enter()
      //   .append('g')
      //   .attr('class', 'category-g')
      //   .attr("transform", function (d, i) {
      //     return "translate(" + (barcodePaddingLeft + d.x) + ',' + 0 + ')'
      //   })
      // categoryG.each(function (d, i) {
      //   var rootObj = d
      //   d3.select(this)
      //     .append('rect')
      //     .attr('class', function (d, i) {
      //       var inTablelens = barcodeCollection.in_selected_array(rootObj.id)
      //       if (inTablelens) {
      //         return 'category-bg select-highlight'
      //       } else {
      //         return 'category-bg'
      //       }
      //     }) // .category-bg在barcode-supertree.less中的第21行
      //     .attr('id', rootObj.id)
      //     .attr("x", 0)
      //     .attr("width", rootObj.textWidth)
      //     .attr('y', 0)
      //     .attr('height', barcodeCategoryHeight)//barcodePaddingTop
      //     .on('mouseover', function (d, i) {
      //       d3.select(this).classed('mouseover-highlight', true)
      //       self.trigger_higlight_all_related_nodes(rootObj)
      //       var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + rootObj.categoryName + "</span></span>"
      //     })
      //     .on('mouseout', function (d, i) {
      //       d3.select(this).classed('mouseover-highlight', false)
      //       self.trigger_mouseout_event()
      //     })
      //     .on('click', function (d, i) {
      //       if (d3.select(this).classed('select-highlight')) {
      //         d3.select(this).classed('select-highlight', false)
      //         self.remove_supertree_selected_subtree_id(rootObj.id, rootObj.depth)
      //       } else {
      //         d3.select(this).classed('select-highlight', true)
      //         self.add_supertree_selected_subtree_id(rootObj.id, rootObj.depth)
      //       }
      //       self.trigger_higlight_all_selected_nodes()
      //     })
      //   d3.select(this)
      //     .append("text")
      //     .attr('class', 'category-text')
      //     .attr('id', rootObj.id)
      //     .attr("x", rootObj.textWidth / 2)
      //     .attr("y", barcodeCategoryHeight / 2)
      //     .attr("font-family", "FontAwesome")
      //     .attr('text-anchor', 'middle')
      //     .attr('dominant-baseline', 'middle')
      //     .text(textAbbr(d))
      //     .on('mouseover', function (d, i) {
      //       var thisObjId = d3.select(this).attr('id')
      //       d3.select('rect#' + thisObjId).classed('mouseover-highlight', true)
      //       self.trigger_higlight_all_related_nodes(rootObj)
      //       var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + rootObj.categoryName + "</span></span>"
      //       if (rootObj.categoryName !== textAbbr(d)) {
      //         tip.show(tipValue)
      //       }
      //     })
      //     .on('mouseout', function (d, i) {
      //       var thisObjId = d3.select(this).attr('id')
      //       d3.select('rect#' + thisObjId).classed('mouseover-highlight', false)
      //       self.trigger_mouseout_event()
      //       tip.hide()
      //     })
      //     .on('click', function (d, i) {
      //       var thisObjId = d3.select(this).attr('id')
      //       if (d3.select('rect#' + thisObjId).classed('select-highlight')) {
      //         d3.select('rect#' + thisObjId).classed('select-highlight', false)
      //         barcodeCollection.remove_supertree_selected_subtree_id(rootObj.id, rootObj.depth)
      //         self.remove_supertree_selected_subtree_id(rootObj.id, rootObj.depth)
      //       } else {
      //         d3.select('rect#' + thisObjId).classed('select-highlight', true)
      //         self.add_supertree_selected_subtree_id(rootObj.id, rootObj.depth)
      //       }
      //       self.trigger_higlight_all_selected_nodes()
      //     })
      // })

      // categoryText.attr("x", function (d, i) {
      //   return barcodePaddingLeft + d.x + d.textWidth / 2
      // })
      //   .attr("y", barcodeHeight / 2)
      //   .attr("font-family", "FontAwesome")
      //   .attr('text-anchor', 'middle')
      //   .attr('dominant-baseline', 'middle')
      //   .text(function (d, i) {
      //     return textAbbr(d.categoryName)
      //   })

      function textAbbr(nodeObj) {
        if (typeof (nodeObj) !== 'undefined') {
          var category_name = nodeObj.categoryName
          var textWidth = nodeObj.textWidth
          var singleTextWidth = window.rem_px
          var textNum = Math.round(textWidth / singleTextWidth)
          var remainedWidth = textWidth - textNum * singleTextWidth
          if (typeof (category_name) !== 'undefined') {
            if (category_name.length > textNum) {
              var categoryName = category_name.substring(0, textNum)
              if (remainedWidth > singleTextWidth) {
                categoryName = categoryName + '...'
              } else {
                categoryName = categoryName + '.'
              }
              return categoryName
            } else {
              return category_name
            }
          }
        } else {
          return ''
        }

      }
    },
    remove_all_edit_icon: function () {
      var self = this
      d3.selectAll('.edit-icon').remove()
    },
    /**
     *  在背景矩形中增加双击的监听函数
     */
    category_rect_dbclick_handler: function (nodeData) {
      var self = this
      var nodeId = nodeData.id
      var barcodeCollection = self.options.barcodeCollection
      var isAdded = barcodeCollection.tablelens_interested_subtree(nodeId)
      return isAdded
    },
    supertree_node_click_handler: function (thisObjId, nodeObject, barcodeTreeId, selectMultiple) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var align_state = barcodeCollection.get_current_aligned_state()
      if (self.d3el.select('rect#' + thisObjId).classed('select-highlight')) {
        self.d3el.select('rect#' + thisObjId).classed('select-highlight', false)
        barcodeCollection.remove_supertree_selected_subtree_id(nodeObject.id, nodeObject.depth)
      } else {
        self.d3el.select('rect#' + thisObjId).classed('select-highlight', true)
        barcodeCollection.add_supertree_selected_subtree_id(nodeObject.id, nodeObject.depth)
      }
      if (self.d3el.select('.edit-icon#' + thisObjId).empty()) {
        self.add_operation_icon(thisObjId)
      } else {
        self.remove_operation_icon(thisObjId)
      }
      self.trigger_higlight_all_selected_nodes()
    },
    /**
     * 在category的背景矩形中增加监听函数
     */
    add_category_rect_dbclick_click_handler: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var cc = clickcancel()
      self.d3el.selectAll('.supertree-icicle-node').call(cc)
      cc.on('dblclick', function (el) {
        var treeDataModel = self.get_super_tree_data_model()
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var thisObjId = d3.select(el.srcElement).attr('id')
        var nodeObject = treeDataModel.get_node_obj_from_id(thisObjId)
        var selectMultiple = true
        self.supertree_node_click_handler(thisObjId, nodeObject, barcodeTreeId, selectMultiple)
        var isAdded = self.category_rect_dbclick_handler(nodeObject)
        if (!isAdded) {
          barcodeCollection.remove_supertree_selected_subtree_id(nodeObject.id, nodeObject.depth)
          self.remove_operation_icon(thisObjId)
        }
        barcodeCollection.update_barcode_selection_state()
      })
      cc.on('click', function (el) {
        console.log('supertree_node_click_handler')
        var treeDataModel = self.get_super_tree_data_model()
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var thisObjId = d3.select(el.srcElement).attr('id')
        var nodeObject = treeDataModel.get_node_obj_from_id(thisObjId)
        var selectMultiple = false
        self.supertree_node_click_handler(thisObjId, nodeObject, barcodeTreeId, selectMultiple)
      })
      function clickcancel(d, i) {
        var event = d3.dispatch('click', 'dblclick');

        function cc(selection) {
          var down,
            tolerance = 5,
            last,
            wait = null;
          // euclidean distance
          function dist(a, b) {
            return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
          }

          selection.on('mousedown', function () {
            down = d3.mouse(document.body);
            last = +new Date();
          });
          selection.on('mouseup', function () {
            if (dist(down, d3.mouse(document.body)) > tolerance) {
              return;
            } else {
              if (wait) {
                window.clearTimeout(wait);
                wait = null;
                event.dblclick(d3.event);
              } else {
                wait = window.setTimeout((function (e) {
                  return function () {
                    event.click(e);
                    wait = null;
                  };
                })(d3.event), 300);
              }
            }
          });
        };
        return d3.rebind(cc, event, 'on');
      }
    },
    /**
     * 在superTree视图中增加文本, 是focus的最上层的类别的名称
     * @param rootId
     */
    get_category_text_obj: function (rootId) {
      var self = this
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var textAddedLevel = null
      var rootLevel = null
      var textAddedObjArray = []
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if (barcodeNodeAttrArray[bI].depth === rootLevel) {
          var textStartX = textAddedObjArray[textAddedObjArray.length - 1].x
          var textEndX = barcodeNodeAttrArray[bI - 1].x
          for (var reI = (bI - 1); ; reI--) {
            if (barcodeNodeAttrArray[reI].width !== 0) {
              break;
            }
          }
          textEndX = barcodeNodeAttrArray[reI].x
          textAddedObjArray[textAddedObjArray.length - 1].textWidth = textEndX - textStartX
          break
        }
        if (barcodeNodeAttrArray[bI].depth === textAddedLevel) {
          if (textAddedObjArray.length !== 0) {
            var textStartX = textAddedObjArray[textAddedObjArray.length - 1].x
            var textEndX = barcodeNodeAttrArray[bI - 1].x
            textAddedObjArray[textAddedObjArray.length - 1].textWidth = textEndX - textStartX
          }
          textAddedObjArray.push(barcodeNodeAttrArray[bI])
        }
        if (barcodeNodeAttrArray[bI].id === rootId) {
          rootLevel = +barcodeNodeAttrArray[bI].depth
          textAddedLevel = +barcodeNodeAttrArray[bI].depth + 1
        }
        if (bI === (barcodeNodeAttrArray.length - 1)) {
          if (textAddedObjArray.length !== 0) {
            var textStartX = textAddedObjArray[textAddedObjArray.length - 1].x
            var textEndX = barcodeNodeAttrArray[bI].x
            textAddedObjArray[textAddedObjArray.length - 1].textWidth = textEndX - textStartX
          }
        }
      }
      return textAddedObjArray
    },
    open_supertree_view: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      Variables.set('superTreeViewState', true)
      var superTreeHeight = Variables.get('superTreeHeight')
      var barcodeTreeConfigHeight = $('#top-toolbar-container').height()
      var histogramHeightRem = Variables.get('histogramHeightRem')
      $('#supertree-scroll-panel').css('top', barcodeTreeConfigHeight + 'px')
      $('#supertree-scroll-panel').css('height', superTreeHeight + 'px')
      var toolbarViewDivHeight = +$('#toolbar-view-div').height()
      var histogramViewHeight = +$('#histogram-view').height()
      $('#supertree-view-toggle').css('top', (toolbarViewDivHeight + histogramViewHeight + barcodeTreeConfigHeight + superTreeHeight) + 'px')
      $('#barcodetree-scrollpanel').css('top', (barcodeTreeConfigHeight + superTreeHeight) + 'px')
      barcodeCollection.update_barcode_location()
      self.update_supertree_height()
    },
    close_supertree_view: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      Variables.set('superTreeViewState', false)
      var barcodeTreeConfigHeight = $('#top-toolbar-container').height()
      var histogramHeightRem = Variables.get('histogramHeightRem')
      var toolbarViewDivHeight = +$('#toolbar-view-div').height()
      var histogramViewHeight = +$('#histogram-view').height()
      $('#supertree-view-toggle').css('top', (toolbarViewDivHeight + histogramViewHeight + barcodeTreeConfigHeight) + 'px')
      $('#barcodetree-scrollpanel').css('top', barcodeTreeConfigHeight + 'px')
      $('#supertree-scroll-panel').css('height', '0px')
      barcodeCollection.update_barcode_location()
    },
    draw_super_tree: function () {
      var self = this
      self.update_supertree_height()
      self.append_supernodes_different_level()
      // self.update_aligned_barcode_node(self.update_sort_icon.bind(self))
      // self.render_padding_cover_rect()
      self.update_interaction_icon()
      self.highlight_selection_supertree_selection_nodes()
      self.add_category_text()
      self.add_category_rect_dbclick_click_handler()
    },
    //  更新标记交互的icon
    update_interaction_icon: function () {
      var self = this
      if (window.sort_state) {
        self.update_aligned_sort_icon()
      } else {
        self.update_current_edit_icon()
      }
    },
    update_current_edit_icon: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var align_state = barcodeCollection.get_current_aligned_state()
      if ((align_state) && (Variables.get('displayMode') !== Config.get('CONSTANT').GLOBAL)) {
        self.d3el.selectAll('.edit-icon').remove()
      }
      if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
        var barcodeCollection = window.Datacenter.barcodeCollection
        var unalignItemList = barcodeCollection.get_unaligned_item()
        for (var uI = 0; uI < unalignItemList.length; uI++) {
          var nodeData = unalignItemList[uI].nodeData
          var nodeDataId = nodeData.id
          self.add_operation_icon(nodeDataId)
        }
      }
    },
    //  更新标记排序的icon
    update_aligned_sort_icon: function () {
      var self = this
      var barcodeCollection = window.Datacenter.barcodeCollection
      var unalignItemList = barcodeCollection.get_unaligned_item()
      self.d3el.selectAll('.sort-icon').remove()
      for (var uI = 0; uI < unalignItemList.length; uI++) {
        var nodeData = unalignItemList[uI].nodeData
        var nodeDataId = nodeData.id
        self.add_sort_icon(nodeDataId)
      }
    },
    add_category_text: function () {
      var self = this
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var alignedRangeObjArray = self.get_super_tree_aligned_range_obj()
      self.add_single_category_text()
      // if (alignedRangeObjArray.length === 0) {
      //   var rootId = 'node-0-root'
      //   self.add_single_category_text(rootId)
      // }
      // for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
      //   var rangeStartNodeIndex = alignedRangeObjArray[aI].rangeStartNodeIndex
      //   var nodeId = barcodeNodeAttrArray[rangeStartNodeIndex].id
      //   self.add_single_category_text(nodeId)
      // }
    },
    //  过滤得到所有在superTree视图中绘制出来的对象
    filtered_aligned_element: function () {
      var self = this
      var filteredArray = []
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var alignedRangeObjArray = self.get_super_tree_aligned_range_obj()
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if ((barcodeNodeAttrArray[bI].depth < 4) && (self.isBelongAligned(bI, alignedRangeObjArray)) && (barcodeNodeAttrArray[bI].id !== 'node-0-root')) {
          filteredArray.push(barcodeNodeAttrArray[bI])
        }
      }
      return filteredArray
    },
    update_aligned_barcode_node: function (next_step_func) {
      var self = this
      var tip = window.tip
      var barcodeNodeHeight = self.barcodeNodeHeight
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var DURATION = 1000
      var alignedLevel = Variables.get('alignedLevel')
      var currentNodeHeight = 0
      if (barcodeNodeAttrArray.length > 0) {
        currentNodeHeight = barcodeNodeAttrArray[0].height
      }
      var yRatio = barcodeNodeHeight / currentNodeHeight
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
      var alignedRangeObjArray = self.get_super_tree_aligned_range_obj()
      //
      var alignedBarcodeNodes = self.d3el.select('#barcode-container')
        .selectAll('.aligned-barcode-node')
        .data(barcodeNodeAttrArray.filter(function (d, i) {
          return ((d.depth < 4) && (self.isBelongAligned(i, alignedRangeObjArray)))
        }), function (d, i) {
          return d.id
        })

      //  enter 添加节点
      alignedBarcodeNodes.enter()
        .append('rect')
        .attr('class', function (d, i) {
          var classArray = []
          classArray.push('barcode-node')
          classArray.push('aligned-barcode-node')
          if (d.depth > alignedLevel) {
            classArray.push('node-none')
          }
          return self.get_class_name(classArray)
        })
        .attr('id', function (d, i) {
          return d.id
        })
        .attr('x', function (d) {
          return +d.x
        })
        .attr('y', function (d) {
          return +d.height * yRatio
        })
        .attr('width', function (d) {
          return +d.width
        })
        .attr('height', function (d) {
          return 0
        })
        .style("cursor", "pointer")
        .on('mouseover', mouseover_handler)
        .on('mouseout', mouseout_handler)
        .on('click', click_handler)
      // update 更新节点
      alignedBarcodeNodes.attr('class', function (d, i) {
        var classArray = []
        classArray.push('barcode-node')
        classArray.push('aligned-barcode-node')
        if (d.depth > alignedLevel) {
          classArray.push('node-none')
        }
        return self.get_class_name(classArray)
      })
        .attr('width', function (d) {
          return +d.width
        })
        .transition()
        .duration(DURATION)
        .attr('x', function (d) {
          return +d.x
        })
        .attr('y', function (d) {
          return +d.y * yRatio
        })
        .attr('height', function (d) {
          return +d.height * yRatio
        })
        .call(self.endall, function (d, i) {
          if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
            next_step_func()
          } else {
            console.log('not next step')
          }
        })
      alignedBarcodeNodes.exit().remove()
      function mouseover_handler(d, i) {
        if (typeof(d.categoryName) !== 'undefined') {
          var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + d.category + ' ' + d.categoryName + "</span></span>"
          tip.show(tipValue)
        } else {
          var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + d.category + "</span></span>"
          tip.show(tipValue)
        }
        d3.select(this).classed('sort-hovering-highlight', true)
        self.trigger_hovering_sort_barcode_node(d.id)
      }

      function mouseout_handler(d, i) {
        tip.hide()
        d3.select(this).classed('sort-hovering-highlight', false)
        self.trigger_unhovering_sort_barcode_node()
      }

      function click_handler(d, i) {
        self.clickedObject = this
        self.clickedRectIndex = null
        self.add_supertree_node_options_button(this, d)
      }
    },
    add_supertree_node_options_button: function (thisNodeObj, thisNodeData) {
      var self = this
      var barcodePaddingLeft = self.barcodePaddingLeft
      var barcodePaddingTop = self.barcodePaddingTop + self.barcodePaddingGap / 2
      var DURATION = 500
      var thisX = +d3.select(thisNodeObj).attr('x') + 1
      var thisY = +d3.select(thisNodeObj).attr('y') - 1
      var thisWidth = +d3.select(thisNodeObj).attr('width')
      var iconSide = Variables.get('superTreeHeight') * 0.3
      var thisNodeId = d3.select(thisNodeObj).attr('id')
      var iconPadding = 2
      var barcodeConfigFontSize = 12
      var iconArray = [
        {'iconName': 'refresh', 'iconCode': '\uf021'},
        {'iconName': 'sort-amount-asc', 'iconCode': '\uf160'},
        {'iconName': 'sort-amount-desc', 'iconCode': '\uf161'},
        {'iconName': 'remove', 'iconCode': '\uf00d'}]
      var iconLeftX = thisX + barcodePaddingLeft + thisWidth / 2 - iconSide * iconArray.length / 2
      self.d3el.selectAll('.barcode-icon-bg').remove()
      self.d3el.selectAll('.barcode-g-icon').remove()
      //  更新barcode的背景矩形的位置
      var barcodeIconBg = self.d3el.selectAll('.barcode-icon-bg')
        .data(iconArray)
      barcodeIconBg.enter()
        .append('rect')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-icon-bg')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2 - iconSide / 2
        })
        .attr('y', barcodePaddingTop + iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .attr('fill', '#808080')
        .on('mouseover', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', false)
        })
        .style('opacity', 0)
      barcodeIconBg.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i
        })
        .attr('y', barcodePaddingTop - iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIconBg.exit().remove()
      //  更新barcode的图标的位置
      var barcodeIcon = self.d3el.selectAll('.barcode-g-icon')
        .data(iconArray)
      barcodeIcon.enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-g-icon')
        .attr('font-family', 'FontAwesome')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2
        })
        .attr('y', barcodePaddingTop + iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('fill', function (d, i) {
          if (d.iconName === 'remove') {
            return 'red'
          }
        })
        .text(function (d, i) {
          return d.iconCode
        })
        .on('mouseover', function (d, i) {
          d3.select(this).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select(this).classed('mouseover-highlight', false)
        })
        .on('click', function (d, i) {
          self.super_tree_node_controller(d, i, thisNodeId, self, thisNodeData)
        })
        .style('opacity', 0)
      barcodeIcon.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i + iconSide / 2
        })
        .attr('y', barcodePaddingTop - iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIcon.exit().remove()
    },
    super_tree_node_controller: function (d, i, thisNodeId, self, thisNodeData) {
      var barcodeCollection = self.options.barcodeCollection
      var parameter = null
      if (d.iconName === 'refresh') {
        barcodeCollection.recover_barcode_model_sequence()
        self.sortObject = null
        self.d3el.selectAll('.sort-indicator').remove()
      } else if (d.iconName === 'sort-amount-asc') {
        parameter = 'asc'
        barcodeCollection.sort_barcode_model(thisNodeId, parameter)
        self.sortObject = self.clickedObject
        self.sortType = parameter
        self.update_sort_icon()
      } else if (d.iconName === 'sort-amount-desc') {
        parameter = 'desc'
        barcodeCollection.sort_barcode_model(thisNodeId, parameter)
        self.sortObject = self.clickedObject
        self.sortType = parameter
        self.update_sort_icon()
      } else if (d.iconName === 'remove') {
        //  当前处在align的状态, 那么用户再次点击就删除当前subtree的align状态
        var finishRemoveAlignDeferObj = $.Deferred()
        $.when(finishRemoveAlignDeferObj)
          .done(function () {
            window.Datacenter.barcodeCollection.update_all_barcode_view()
            self.draw_super_tree()
          })
        self.subtree_unalign_handler(thisNodeData, finishRemoveAlignDeferObj)
        self.remove_options_button()
      }
    },
    /**
     * 再次click节点, 取消对于当前的subtree的对齐
     */
    subtree_unalign_handler: function (nodeData, finishRemoveAlignDeferObj) {
      var self = this
      var nodeLevel = nodeData.depth
      self.node_unclick_handler(nodeData, nodeLevel, finishRemoveAlignDeferObj)
    },
    /**
     * 再次点击focus选项的按钮, 取消focus
     * @param d
     * @param nodeIndex
     * @param globalObj
     */
    node_unclick_handler: function (d, alignedLevel, finishRemoveAlignDeferObj) {
      var self = this
      //  model中的节点需要使用其他的model中的节点进行填充
      window.Datacenter.barcodeCollection.remove_super_subtree(d.id, d.depth, d.category, alignedLevel, finishRemoveAlignDeferObj)
    },
    update_sort_icon: function () {
      var self = this
      self.d3el.selectAll('.sort-indicator').remove()
      if (self.sortObject == null) {
        return
      }
      var x = +d3.select(self.sortObject).attr('x')
      var width = +d3.select(self.sortObject).attr('width')
      var sortType = self.sortType
      var sortTypeObject = {
        'asc': '\uf0de',
        'desc': '\uf0dd'
      }
      if (sortType === 'asc') {
        self.d3el.select('#barcode-container')
          .append("text")
          .attr('class', 'sort-indicator')
          .attr("x", x + width / 2)
          .attr("y", -2)
          .attr("font-family", "FontAwesome")
          .attr('font-size', function (d) {
            return window.height / 2 + 'px';
          })
          .text(function (d) {
            return sortTypeObject[sortType];
          })
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .style("cursor", "pointer")
      } else if (sortType === 'desc') {
        self.d3el.select('#barcode-container')
          .append("text")
          .attr('class', 'sort-indicator')
          .attr("x", x + width / 2)
          .attr("y", -7)
          .attr("font-family", "FontAwesome")
          .attr('font-size', function (d) {
            return window.height / 2 + 'px';
          })
          .text(function (d) {
            return sortTypeObject[sortType];
          })
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .style("cursor", "pointer")
      }
      self.d3el.select('#barcode-container')
        .select('.sort-button')
        .style('fill', '#ddd')
        .text('\uf0dc')
    },
    /**
     * 点击barcode收缩时先判断动画是否结束
     * @param transition
     * @param callback
     */
    endall: function (transition, callback) {
      if (transition.size() === 0) {
        callback()
      }
      var n = 0;
      transition
        .each(function () {
          ++n;
        })
        .each("end", function () {
          if (!--n) callback.apply(this, arguments);
        });
    },
    /**
     * 判断节点是否是aligned范围, 如果属于aligned范围, 那么绘制节点; 否则这些节点不会被绘制
     * @param nodeIndex
     * @returns {boolean}
     */
    isBelongAligned: function (nodeIndex, alignedRangeObjArray) {
      if (alignedRangeObjArray.length === 0) {
        return false
      } else {
        for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
          var rangeStartNodeIndex = alignedRangeObjArray[aI].rangeStartNodeIndex
          var rangeEndNodeIndex = alignedRangeObjArray[aI].rangeEndNodeIndex
          if ((nodeIndex >= rangeStartNodeIndex) && (nodeIndex <= rangeEndNodeIndex)) {
            return true
          }
        }
      }
      return false
    },
    // 获取supertree视图中的barcodeNodeArray的节点
    get_super_tree_barcode_node_array: function () {
      var self = this
      var barcodeNodeAttrArray = []
      var treeDataModel = self.get_super_tree_data_model()
      if (typeof (treeDataModel) === 'undefined') {
        return barcodeNodeAttrArray
      }
      if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        //  切换到原始的barcodeTree的compact的显示模式
        var compactBarcodeNodeAttrArrayObj = treeDataModel.get('compactBarcodeNodeAttrArrayObj')
        barcodeNodeAttrArray = compactBarcodeNodeAttrArrayObj['compact-0']
      } else if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
        //  切换到原始的barcodeTree的显示模式
        barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
      }
      return barcodeNodeAttrArray
    },
    //  获取supertree视图中的align的节点
    get_super_tree_aligned_range_obj: function () {
      var self = this
      var alignedRangeObjArray = []
      var treeDataModel = self.get_super_tree_data_model()
      if (typeof (treeDataModel) === 'undefined') {
        return alignedRangeObjArray
      }
      alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
      return alignedRangeObjArray
    },
    //  获取supertree视图中的padding的节点
    get_super_tree_padding_range_obj: function () {
      var self = this
      var paddingNodeObjArray = []
      var treeDataModel = self.get_super_tree_data_model()
      if (typeof (treeDataModel) === 'undefined') {
        return paddingNodeObjArray
      }
      paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
      return paddingNodeObjArray
    },
    //  获取supertree视图中的data model
    get_super_tree_data_model: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var selectItemNameArray = Variables.get('selectItemNameArray')
      // var treeDataModel = barcodeCollection.where({barcodeTreeId: selectItemNameArray[0]})[0]
      var treeDataModel = barcodeCollection.where({barcodeIndex: 0})[0]
      return treeDataModel
    },
    // 渲染覆盖在padding barcode上面带有纹理的矩形
    render_padding_cover_rect: function () {
      var self = this
      var barcodeNodeHeight = self.barcodeNodeHeight
      var paddingNodeObjArray = self.get_super_tree_padding_range_obj()
      var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
      var DURATION = 1000
      // self.d3el.select('#barcode-container')
      //   .selectAll('.padding-covered-rect')
      //   .remove()
      var paddingCoverRectObj = self.d3el.select('#barcode-container')
        .selectAll('.padding-covered-rect')
        .data(paddingNodeObjArray.filter(function (d, i) {
          return d.paddingNodeStartIndex <= d.paddingNodeEndIndex
        }), function (d, i) {
          return 'covered-rect-' + i
        })
      //  与barcode的padding width的计算不同的是无论superTree的paddingNode的范围内是否存在节点一定要增加paddingnode的coverRect
      paddingCoverRectObj.enter()
        .append('rect')
        .attr('id', function (d, i) {
          return 'covered-rect-' + i
        })
        .attr('class', function (d, i) {
          return 'padding-covered-rect covered-rect-' + i
        })
        .attr('x', function (d, i) {
          return d.paddingNodeX
        })
        .attr('y', barcodeNodeHeight)
        .attr('width', barcodeNodePadding)
        .attr('height', 0)
        .style("fill", self.fill_style_handler.bind(self))
        .on('mouseover', function (d, i) {
          d3.select(this).classed('sort-hovering-highlight', true)//
          // d3.select(this).attr('color', 'red')
        })
        .on('mouseout', function (d, i) {
          d3.select(this).classed('sort-hovering-highlight', false)
        })
        .on('click', padding_super_cover_click_handler)
      paddingCoverRectObj.attr('x', function (d, i) {
        return d.paddingNodeX
      })
        .transition()
        .duration(DURATION)
        .attr('y', 0)
        .attr('width', barcodeNodePadding)
        .attr('height', barcodeNodeHeight)
      paddingCoverRectObj.exit().remove()
      function padding_super_cover_click_handler(d, covered_rect_index) {
        self.clickedObject = this
        self.clickedRectIndex = covered_rect_index
        self.add_options_button(this)
        // if (d3.select(this).classed('sort-selection-highlight')) {
        //   d3.selectAll('.sort-selection-highlight').classed('sort-selection-highlight', false)
        //   d3.select(this).classed('sort-selection-highlight', false)
        //   barcodeCollection.recover_barcode_model_sequence()
        // } else {
        //   d3.selectAll('.sort-selection-highlight').classed('sort-selection-highlight', false)
        //   d3.select(this).classed('sort-selection-highlight', true)
        //   barcodeCollection.sort_cover_rect_barcode_model(covered_rect_index)
        // }
      }

      function rgb2hex(rgb) {
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
      }
    },
    add_options_button: function (thisNodeObj) {
      var self = this
      var barcodePaddingLeft = self.barcodePaddingLeft
      var barcodePaddingTop = self.barcodePaddingTop + self.barcodePaddingGap / 2
      var DURATION = 500
      var thisX = +d3.select(thisNodeObj).attr('x') + 1
      var thisY = +d3.select(thisNodeObj).attr('y') - 1
      var thisWidth = +d3.select(thisNodeObj).attr('width')
      var iconSide = Variables.get('superTreeHeight') * 0.3
      var iconPadding = 2
      var barcodeConfigFontSize = 12
      var iconArray = [
        {'iconName': 'compress', 'iconCode': '\uf066'},
        {'iconName': 'expand', 'iconCode': '\uf065'},
        {'iconName': 'sort-amount-asc', 'iconCode': '\uf160'},
        {'iconName': 'sort-amount-desc', 'iconCode': '\uf161'}]
      var iconLeftX = thisX + barcodePaddingLeft + thisWidth / 2 - iconSide * 2
      self.d3el.selectAll('.barcode-icon-bg').remove()
      self.d3el.selectAll('.barcode-g-icon').remove()
      //  更新barcode的背景矩形的位置
      var barcodeIconBg = self.d3el.selectAll('.barcode-icon-bg')
        .data(iconArray)
      barcodeIconBg.enter()
        .append('rect')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-icon-bg')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2 - iconSide / 2
        })
        .attr('y', barcodePaddingTop + iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .attr('fill', '#808080')
        .on('mouseover', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', false)
        })
        .style('opacity', 0)
      barcodeIconBg.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i
        })
        .attr('y', barcodePaddingTop - iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIconBg.exit().remove()
      //  更新barcode的图标的位置
      var barcodeIcon = self.d3el.selectAll('.barcode-g-icon')
        .data(iconArray)
      barcodeIcon.enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-g-icon')
        .attr('font-family', 'FontAwesome')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2
        })
        .attr('y', barcodePaddingTop + iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .text(function (d, i) {
          return d.iconCode
        })
        .on('mouseover', function (d, i) {
          d3.select(this).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select(this).classed('mouseover-highlight', false)
        })
        .on('click', function (d, i) {
          self.super_tree_controller(d, i)
        })
        .style('opacity', 0)
      barcodeIcon.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i + iconSide / 2
        })
        .attr('y', barcodePaddingTop - iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIcon.exit().remove()
    },
    remove_options_button: function () {
      var self = this
      var thisNodeObj = self.clickedObject
      var barcodePaddingLeft = self.barcodePaddingLeft
      var DURATION = 500
      if (thisNodeObj == null) {
        return
      }
      var thisX = +d3.select(thisNodeObj).attr('x') + 1
      var thisY = +d3.select(thisNodeObj).attr('y') - 1
      var thisWidth = +d3.select(thisNodeObj).attr('width')
      var iconSide = Variables.get('superTreeHeight') * 0.3
      var iconPadding = 2
      var barcodeConfigFontSize = 12
      var iconArray = [
        {'iconName': 'compress', 'iconCode': '\uf066'}, {'iconName': 'expand', 'iconCode': '\uf065'},
        {'iconName': 'sort-amount-asc', 'iconCode': '\uf160'}, {
          'iconName': 'sort-amount-desc',
          'iconCode': '\uf161'
        }]
      //  更新barcode的背景矩形的位置
      var barcodeIconBg = self.d3el.selectAll('.barcode-icon-bg')
        .transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2 - iconSide / 2
        })
        .attr('y', iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 0)
        .call(self.endall, function (d, i) {
          self.d3el.selectAll('.barcode-icon-bg').remove()
        })
      //  更新barcode的图标的位置
      var barcodeIcon = self.d3el.selectAll('.barcode-g-icon')
        .transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2
        })
        .attr('y', iconSide + iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 0)
        .call(self.endall, function (d, i) {
          self.d3el.selectAll('.barcode-g-icon').remove()
        })
    },
    super_tree_controller: function (d, i) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var clickedRectIndex = self.clickedRectIndex
      var parameter = null
      if (clickedRectIndex != null) {
        if (d.iconName === 'compress') {
          barcodeCollection.changExpandMode(clickedRectIndex)
          barcodeCollection.update_click_covered_rect_attr_array()
        } else if (d.iconName === 'expand') {
          barcodeCollection.changCompactMode(clickedRectIndex)
          barcodeCollection.update_click_covered_rect_attr_array()
        } else if (d.iconName === 'sort-amount-asc') {
          parameter = 'asc'
          self.sortObject = self.clickedObject
          barcodeCollection.sort_cover_rect_barcode_model(clickedRectIndex, parameter)
          self.sortType = parameter
          self.update_sort_icon()
        } else if (d.iconName === 'sort-amount-desc') {
          parameter = 'desc'
          self.sortObject = self.clickedObject
          barcodeCollection.sort_cover_rect_barcode_model(clickedRectIndex, parameter)
          self.sortType = parameter
          self.update_sort_icon()
        }
      }
    },
    fill_style_handler: function (d, i) {
      var self = this
      var nodeNum = self.get_node_number(d.paddingNodeStartIndex, d.paddingNodeEndIndex)
      var maxLeveledNumArray = Variables.get('maxLeveledNumArray')
      var partition = maxLeveledNumArray[4] / 6
      var styleIndex = Math.ceil(nodeNum / partition + 1)
      return "url(#diagonal-stripe-" + styleIndex + ")"
    },
    // 计算某个范围内, 在某些层级上的节点数量
    get_node_number: function (rangeStart, rangeEnd) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var treeDataModel = barcodeCollection.where({barcodeTreeId: selectItemNameArray[0]})[0]
      var nodeNumber = 0
      var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
      for (var bI = rangeStart; bI <= rangeEnd; bI++) {
        if ((barcodeNodeAttrArray[bI].existed) && (barcodeNodeAttrArray[bI].depth < 4)) {
          nodeNumber = nodeNumber + 1
        }
      }
      return nodeNumber
    },
    get_class_name: function (classNameArray) {
      var className = ''
      for (var cI = 0; cI < classNameArray.length; cI++) {
        className = className + ' ' + classNameArray[cI]
      }
      return className
    }
  }, SVGBase))
})
