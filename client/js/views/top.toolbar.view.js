define([
  'require',
  'marionette',
  'underscore',
  'jquery',
  'backbone',
  'd3',
  'datacenter',
  'config',
  'variables',
  'bootstrap',
  'text!templates/top.toolbar.tpl'
], function (require, Mn, _, $, Backbone, d3, Datacenter, Config, Variables, Bootstrap, Tpl) {
  'use strict'
  //  barcode.view中包含三个视图, 分别是比较barcodeTree的主视图, barcode的superTree视图, barcode的参数控制视图
  return Mn.LayoutView.extend({
    tagName: 'div',
    template: _.template(Tpl),
    default: {
      duration: 500
    },
    attributes: {
      'style': 'height: 100%; width: 100%',
    },
    events: {
      // 节点选择
      'click #single-node-selection': 'single_node_selection',
      'click #subtree-node-selection': 'subtree_node_selection',
      'click #selection-refresh': 'selection_refresh',
      // 子树操作
      'click #subtree-collapse': 'subtree_collapse',
      'click #subtree-uncollapse': 'subtree_uncollapse',
      'click #subtree-node-focus': 'subtree_node_focus',
      'click #subtree-operation-refresh': 'subtree_operation_refresh',
      // 子树比较
      'click #summary-comparison': 'summary_comparison',
      'click #node-number-comparison': 'node_number_comparison',
      'click #structure-comparison': 'structure_comparison',
      'click #refresh-comparison': 'refresh_comparison',
      // 排序
      'click #sort-desc': 'sort_desc',
      'click #sort-asc': 'sort_asc',
      'click #sort-refresh': 'sort_refresh',
      // 相似性排序
      'click #similarity-resorting': 'similarity_resorting',
      'click #similarity-refresh': 'similarity_refresh',
      'click #similarity-range': 'similarity_range',
      // 配置视图
      'click #node-config-panel-toggle': 'node_config_panel_toggle_handler',
      'click #tree-config-panel-toggle': 'tree_config_panel_toggle_handler'
    },
    initialize: function () {
      var self = this
      self.d3el = d3.select(self.el)
    },
    trigger_mouseout_event: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['NODE_MOUSEOUT'])
    },
    //  更新supertree的视图
    trigger_super_view_update: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['RENDER_SUPERTREE'])
    },
    //  触发显示summary的状态的信号
    trigger_show_summary_state: function (nodeObjId) {
      Backbone.Events.trigger(Config.get('EVENTS')['SHOW_SUMMARY_STATE'], {
        'nodeObjId': nodeObjId
      })
    },
    //  删除summary的柱状图
    trigger_remove_summary_state: function (nodeObjId) {
      Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_SUMMARY_STATE'], {
        'nodeObjId': nodeObjId
      })
    },
    //  更新tree config的视图
    trigger_update_tree_config_view: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_TREE_CONFIG_VIEW'])
    },
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      self.init_slider()
      self.init_hovering_event()
    },
    //  取消button上的事件
    disable_buttons: function (buttons) {
      var self = this
      buttons.prop('disabled', true)
    },
    //  增加button上的事件
    enable_buttons: function (buttons) {
      var self = this
      buttons.prop('disabled', false)
    },
    //  初始化鼠标hovering的事件
    init_hovering_event: function () {
      var self = this
      //  鼠标hovering在该视图上, 会删除在barcode上hovering的效果
      $('#top-toolbar-container').on('mouseover', function () {
        self.trigger_mouseout_event()
      })
    },
    //  初始化sliderbar
    init_slider: function () {
      var self = this
      var maxDepth = Variables.get('maxDepth')
      var alignedBarcodeLevel = Variables.get('alignedBarcodeLevel')
      var structureCustomHandle = $('#structure-custom-handle')
      var alignedLevelText = $('#aligned-level-text')
      $('#structure-comparison-slider').slider({
        range: "min",
        value: alignedBarcodeLevel,
        min: 0,
        max: maxDepth,
        create: function () {
          structureCustomHandle.text("L" + $(this).slider("value"));
          alignedLevelText.text("L" + $(this).slider("value"));
        },
        slide: function (event, ui) {
          structureCustomHandle.text("L" + ui.value);
          alignedLevelText.text("L" + ui.value);
        }
      })
      var similarityHandler = $("#similarity-custom-handle")
      var similaritySliderText = $("#similarity-slider-text")
      var selectedSimilarityRange = Variables.get('similarityRange')
      $("#similarity-slider").slider({
        min: 0,
        max: 100,
        value: selectedSimilarityRange,
        create: function () {
          var value = +$(this).slider("value")
          if (value < 100) {
            similarityHandler.text(value + "%")
          } else {
            similarityHandler.text(value)
          }
          similaritySliderText.text(value + "%")
        },
        slide: function (event, ui) {
          var value = ui.value
          if (value < 100) {
            similarityHandler.text(value + "%")
          } else {
            similarityHandler.text(value)
          }
          similaritySliderText.text(value + "%")
        }
      });
    },
    // 节点选择
    single_node_selection: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var operationItemList = barcodeCollection.get_operation_item()
      for (var oI = 0; oI < operationItemList.length; oI++) {
        var nodeData = operationItemList[oI].nodeData
        var operatedTreeId = operationItemList[oI].barcodeTreeId
        if ((typeof (nodeData) !== 'undefined') && (typeof (operatedTreeId) !== 'undefined')) {
          barcodeCollection.node_selection_click(nodeData, operatedTreeId)
        }
      }
      self.trigger_mouseout_event()
    },
    subtree_node_selection: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var operationItemList = barcodeCollection.get_operation_item()
      for (var oI = 0; oI < operationItemList.length; oI++) {
        var nodeData = operationItemList[oI].nodeData
        var operatedTreeId = operationItemList[oI].barcodeTreeId
        if ((typeof (nodeData) !== 'undefined') && (typeof (operatedTreeId) !== 'undefined')) {
          barcodeCollection.subtree_selection_click(nodeData, operatedTreeId)
        }
      }
      self.trigger_mouseout_event()
    },
    selection_refresh: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = JSON.parse(JSON.stringify(window.operated_node))
      if (typeof (nodeData) !== 'undefined') {
        barcodeCollection.unselection_click_handler(nodeData)
        var selectedObj = barcodeCollection.remove_operation_item(nodeData)
        self.add_current_selected_icon()
        if (typeof (selectedObj) !== 'undefined') {
          var updatedSrcElement = selectedObj.srcElement
          var updateBarcodeTreeId = selectedObj.barcodeTreeId
          self.add_current_edit_icon(updatedSrcElement, updateBarcodeTreeId)
          window.operated_node = selectedObj.nodeData
          window.operated_tree_id = selectedObj.barcodeTreeId
        } else {
          self.remove_current_edit_icon()
          delete window.operated_node
          delete window.operated_tree_id
        }
      }
      self.trigger_mouseout_event()
    },
    //  删除barcode的节点上方增加icon
    remove_current_edit_icon: function (src_element) {
      d3.selectAll('.edit-icon').remove()
    },
    // 增加当前选择的节点的icon
    add_current_selected_icon: function () {
      var self = this
      var barcodeCollection = window.Datacenter.barcodeCollection
      var operationItemList = barcodeCollection.get_operation_item()
      d3.selectAll('.select-icon').remove()
      for (var oI = 0; oI < operationItemList.length; oI++) {
        var nodeData = operationItemList[oI].nodeData
        var barcodeTreeId = operationItemList[oI].barcodeTreeId
        var srcElement = operationItemList[oI].srcElement
        var nodeObjId = nodeData.id
        self._add_single_selection_icon(srcElement, barcodeTreeId, nodeObjId)
      }
    },
    // 增加单个当前选择的节点
    _add_single_selection_icon: function (src_element, barcodeTreeId, nodeObjId) {
      var nodeX = +d3.select(src_element).attr('x')
      var nodeWidth = +d3.select(src_element).attr('width')
      var nodeY = +d3.select(src_element).attr('y')
      var nodeHeight = +d3.select(src_element).attr('height')
      var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
      var iconX = nodeX + nodeWidth / 2
      var iconY = nodeY + nodeHeight / 2
      var selectIconColor = Variables.get('select_icon_color')
      d3.select('g#' + barcodeTreeId)
        .select('#barcode-container')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('class', 'select-icon')
        .attr('id', nodeObjId)
        .attr('font-family', 'FontAwesome')
        .attr('x', iconX)
        .attr('y', iconY)
        .text('\uf08d')
        .style('fill', selectIconColor)
        .style('font-size', (iconSize + 2) + 'px')
    },
    //  在点击操作的barcode的节点上方增加icon
    add_current_edit_icon: function (src_element, barcodeTreeId) {
      var nodeX = +d3.select(src_element).attr('x')
      var nodeWidth = +d3.select(src_element).attr('width')
      var nodeY = +d3.select(src_element).attr('y')
      var nodeHeight = +d3.select(src_element).attr('height')
      var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
      var iconX = nodeX + nodeWidth / 2
      var iconY = nodeY + nodeHeight / 2
      var editIconColor = Variables.get('edit_icon_color')
      d3.selectAll('.edit-icon').remove()
      d3.select('g#' + barcodeTreeId)
        .select('#barcode-container')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('class', 'edit-icon')
        .attr('font-family', 'FontAwesome')
        .attr('x', iconX)
        .attr('y', iconY)
        .text('\uf08d')
        .style('fill', editIconColor)
        .style('font-size', (nodeWidth + 2) + 'px')
    },
    // 子树操作
    subtree_collapse: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = window.operated_node
      if (typeof (nodeData) !== 'undefined') {
        var operationItemList = barcodeCollection.get_operation_item()
        for (var oI = (operationItemList.length - 1); oI >= 0; oI--) {
          var nodeData = operationItemList[oI].nodeData
          barcodeCollection.collapse_subtree(nodeData.id, nodeData.depth)
        }
        barcodeCollection.update_data_all_view()
      }
    },
    subtree_uncollapse: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var operationItemList = barcodeCollection.get_operation_item()
      for (var oI = 0; oI < operationItemList.length; oI++) {
        var nodeData = operationItemList[oI].nodeData
        barcodeCollection.uncollapse_subtree(nodeData.id, nodeData.depth)
      }
      barcodeCollection.update_data_all_view()
    },
    subtree_node_focus: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      //  在对齐选中的子树之前, 首先要取消选中的子树的状态, 保证所有的对齐的节点都是选中的
      // barcodeCollection.clear_selected_subtree_id()
      var operationItemList = barcodeCollection.get_operation_item()
      if (operationItemList.length !== 0) {
        //  选择focus的节点进行对齐之后, barcode的config视图中会取消对于节点选择selection, 以及subtree的折叠的事件
        self.disable_buttons($('#selection-operation-div .config-button'))
        self.disable_buttons($('#subtree-collapse-operation .config-button'))
        self.enable_buttons($('#compare-operation-div .config-button'))
        var deferObj = $.Deferred()
        $.when(deferObj)
          .done(function () {
            barcodeCollection.update_all_barcode_view()
            self.trigger_super_view_update()
            barcodeCollection.update_data_all_view()
          })
          .fail(function () {
            console.log('defer fail')
          })
        var beginIndex = 0
        self._align_single_operation_item(operationItemList, beginIndex, deferObj)
      }
    },
    _align_single_operation_item: function (operation_item_list, operation_index, finish_align_defer) {
      var self = this
      if (operation_index === operation_item_list.length) {
        finish_align_defer.resolve()
        return
      }
      var nodeData = operation_item_list[operation_index].nodeData
      var barcodeTreeId = operation_item_list[operation_index].barcodeTreeId
      var barcodeCollection = self.options.barcodeCollection
      barcodeCollection.uncollapse_subtree(nodeData.id, nodeData.depth)
      var alignedUpperParent = barcodeCollection.get_aligned_uppest_parent(nodeData, barcodeTreeId)
      //  如果对齐状态的最上层父亲节点为空, 那么直接对齐当前的子树
      if (alignedUpperParent == null) {
        var finishAlignDeferObj = $.Deferred()
        $.when(finishAlignDeferObj)
          .done(function () {
            self._align_single_operation_item(operation_item_list, (operation_index + 1), finish_align_defer)
          })
        self._subtree_align_handler(nodeData, finishAlignDeferObj)
      } else {
        //  如果对齐状态的最上层父亲节点不为空, 那么要首先删除该节点的对齐状态, 保证程序的顺序执行, 使用defer进行控制
        var finishRemoveAlignDeferObj = $.Deferred()
        $.when(finishRemoveAlignDeferObj)
          .done(function () {
            // 已经删除了上层的对齐部分的节点, 下面就是对齐当前的节点
            var finishAlignDeferObj = $.Deferred()
            $.when(finishAlignDeferObj)
              .done(function () {
                var finishAlignDeferObj = $.Deferred()
                $.when(finishAlignDeferObj)
                  .done(function () {
                    self._align_single_operation_item(operation_item_list, (operation_index + 1), finish_align_defer)
                  })
                self._subtree_align_handler(nodeData, finishAlignDeferObj)
              })
          })
        self._subtree_unalign_handler(alignedUpperParent, finishRemoveAlignDeferObj)
      }
    },
    //  对齐barcode中的某个子树
    _subtree_align_handler: function (nodeData, finishAlignDeferObj) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var alignedLevel = Variables.get('alignedLevel')
      barcodeCollection.add_super_subtree(nodeData.id, nodeData.depth, nodeData.category, alignedLevel, finishAlignDeferObj)
    },
    //  取消barcode中的某个子树对齐
    _subtree_unalign_handler: function (nodeData, finishRemoveAlignDeferObj) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var alignedLevel = Variables.get('alignedLevel')
      barcodeCollection.remove_super_subtree(nodeData.id, nodeData.depth, nodeData.category, alignedLevel, finishRemoveAlignDeferObj)
    },
    //  删除当前操作节点的align状态, 并且将当前操作节点进行更新
    subtree_operation_refresh: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = JSON.parse(JSON.stringify(window.operated_node))
      var finishRemoveAlignDeferObj = $.Deferred()
      $.when(finishRemoveAlignDeferObj)
        .done(function () {
          barcodeCollection.update_all_barcode_view()
          self.trigger_super_view_update()
          var operationItemList = barcodeCollection.get_operation_item()
          if (operationItemList.length === 0) {
            self.enable_buttons($('#selection-operation-div .config-button'))
            self.enable_buttons($('#subtree-collapse-operation .config-button'))
          }
        })
      self.selection_refresh()
      self._subtree_unalign_handler(nodeData, finishRemoveAlignDeferObj)
    },
    // 子树比较
    summary_comparison: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = null
      var operationItemList = barcodeCollection.get_operation_item()
      for (var oI = 0; oI < operationItemList.length; oI++) {
        nodeData = operationItemList[oI].nodeData
        if (typeof (nodeData) !== 'undefined') {
          var nodeObjId = nodeData.id
          self.trigger_show_summary_state(nodeObjId)
          var changeSummaryState = true
          barcodeCollection.set_summary_state(nodeObjId, changeSummaryState)
        }
      }
    },
    //  删除子树比较的summary
    _remove_summary_comparison: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = window.operated_node
      var operationItemList = barcodeCollection.get_operation_item()
      for (var oI = 0; oI < operationItemList.length; oI++) {
        var nodeData = operationItemList[oI].nodeData
        if (typeof (nodeData) !== 'undefined') {
          var nodeObjId = nodeData.id
          self.trigger_remove_summary_state(nodeObjId)
          var changeSummaryState = false
          barcodeCollection.set_summary_state(nodeObjId, changeSummaryState)
        }
      }
    },
    //  对于子树进行节点数目的比较
    node_number_comparison: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = null
      var operationItemList = barcodeCollection.get_operation_item()
      for (var oI = 0; oI < operationItemList.length; oI++) {
        nodeData = operationItemList[oI].nodeData
        if (typeof (nodeData) !== 'undefined') {
          var nodeObjId = nodeData.id
          //  当前处于节点没有比较的状态, 需要切换成当前比较的状态
          var changeNumComparisonState = true
          barcodeCollection.set_node_num_comparison_state(nodeObjId, changeNumComparisonState)
          //  重新更新barcode的节点数据, 并且更新视图
          barcodeCollection.compute_aligned_subtree_range()
        }
      }
      barcodeCollection.update_all_barcode_view()
      self.trigger_super_view_update()
    },
    //  删除节点数目的比较的功能
    _node_number_comparison: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = null
      var operationItemList = barcodeCollection.get_operation_item()
      for (var oI = 0; oI < operationItemList.length; oI++) {
        nodeData = operationItemList[oI].nodeData
        if (typeof (nodeData) !== 'undefined') {
          var nodeObjId = nodeData.id
          //  当前处于节点没有比较的状态, 需要切换成当前比较的状态
          var changeNumComparisonState = false
          barcodeCollection.set_node_num_comparison_state(nodeObjId, changeNumComparisonState)
          //  重新更新barcode的节点数据, 并且更新视图
          barcodeCollection.compute_aligned_subtree_range()
        }
      }
      barcodeCollection.update_all_barcode_view()
      self.trigger_super_view_update()
    },
    structure_comparison: function () {

    },
    refresh_comparison: function () {
      var self = this
      self._remove_summary_comparison()
      self._node_number_comparison()
    },
    // 排序
    //  降序排列
    sort_desc: function () {
      var self = this
      var parameter = 'desc'
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = window.aligned_operated_node
      barcodeCollection.sort_barcode_model(nodeData.id, parameter)
    },
    //  升序排列
    sort_asc: function () {
      var self = this
      var parameter = 'asc'
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = window.aligned_operated_node
      barcodeCollection.sort_barcode_model(nodeData.id, parameter)
    },
    //  恢复原始序列
    sort_refresh: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      barcodeCollection.recover_barcode_model_sequence()
    },
    // 相似性排序
    similarity_resorting: function () {

    },
    similarity_refresh: function () {

    },
    similarity_range: function () {

    },
    // 打开barcode节点的配置视图
    node_config_panel_toggle_handler: function () {
      $('#barcode-node-config').css({visibility: 'visible'})
    },
    //  打开barcode tree的配置视图
    tree_config_panel_toggle_handler: function () {
      var self = this
      // Variables.set('current_config_barcodeTreeId', barcodeTreeId)
      self.trigger_update_tree_config_view()
      $('#tree-config-div').css({visibility: 'visible'})
    }
  })
})
