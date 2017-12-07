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
      'click #subtree-node-focus': 'subtree_node_focus',
      'click #subtree-operation-refresh': 'subtree_operation_refresh',
      // 子树比较
      'click #summary-comparison': 'summary_comparison',
      'click #node-number-comparison': 'node_number_comparison',
      'click #structure-comparison': 'structure_comparison',
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
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
    },
    // 节点选择
    single_node_selection: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = window.operated_node
      var operatedTreeId = window.operated_tree_id
      if ((typeof (nodeData) !== 'undefined') && (typeof (operatedTreeId) !== 'undefined')) {
        barcodeCollection.node_selection_click(nodeData, operatedTreeId)
      }
      self.trigger_mouseout_event()
    },
    subtree_node_selection: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = window.operated_node
      var operatedTreeId = window.operated_tree_id
      if ((typeof (nodeData) !== 'undefined') && (typeof (operatedTreeId) !== 'undefined')) {
        barcodeCollection.subtree_selection_click(nodeData, operatedTreeId)
      }
      self.trigger_mouseout_event()
    },
    selection_refresh: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var nodeData = window.operated_node
      if (typeof (nodeData) !== 'undefined') {
        barcodeCollection.unselection_click_handler(nodeData)
      }
      self.trigger_mouseout_event()
      //  删除标记当前操作的barcode节点的icon
      d3.selectAll('.edit-icon').remove()
    },
    // 子树操作
    subtree_collapse: function () {

    },
    subtree_node_focus: function () {

    },
    subtree_operation_refresh: function () {

    },
    // 子树比较
    summary_comparison: function () {

    },
    node_number_comparison: function () {

    },
    structure_comparison: function () {

    },
    // 排序
    sort_desc: function () {

    },
    sort_asc: function () {

    },
    sort_refresh: function () {

    },
    // 相似性排序
    similarity_resorting: function () {

    },
    similarity_refresh: function () {

    },
    similarity_range: function () {

    },
    // 配置视图
    node_config_panel_toggle_handler: function () {

    },
    tree_config_panel_toggle_handler: function () {

    }
  })
})
