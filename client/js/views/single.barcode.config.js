define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'd3',
  'd3Barchart',
  'jsColor',
  'config',
  'variables',
  'views/svg-base.addon'
], function (require, Mn, _, Backbone, d3, d3BarChart, jsColor, Config, Variables, SVGBase) {
  'use strict'

  return Mn.ItemView.extend(_.extend({
    tagName: 'svg',
    template: false, //  for the itemview, we must define the template value false
    renderWidth: 0,
    renderHeight: 0,
    attributes: {
      style: 'width: 100%; height: 100%;',
      id: 'single-barcode-svg'
    },
    events: {},
    initialize: function (options) {
      //  初始化的时候请求一个默认的数据
      var self = this
      var self = this
      var divWidth = $('#single-barcode-tree-view').width()
      var divHeight = $('#single-barcode-tree-view').height()
      d3.select(self.el)
        .attr('width', divWidth)
        .attr('height', divHeight)
      var margin = { top: 10, right: 10, bottom: 20, left: 30 }
      var renderWidth = divWidth - margin.right - margin.left
      var renderHeight = divHeight - margin.top - margin.bottom
      self.renderWidth = renderWidth
      self.renderHeight = renderHeight
      d3.select(self.el)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('id', 'single-barcodetree-g')
      Backbone.Events.on(Config.get('EVENTS')[ 'RENDER_UPLOAD_BARCODE_TREE' ], function (event) {
        var treeNodeArray = event.treeNodeArray
        self.draw_barcode_tree(treeNodeArray)
      })
    },
    init_events: function () {
      var self = this
    },
    /**
     * 初始化视图中的svg,包括大小,位置
     */
    init_view: function () {
      var self = this
    },
    /**
     *  绘制barcodeTree
     */
    draw_barcode_tree: function (treeNodeArray) {
      var self = this
      var selectedLevels = Variables.get('selectedLevels')
      var renderHeight = self.renderHeight
      var barcodeNodeHeight = 80
      var transformY = renderHeight / 2 - barcodeNodeHeight / 2
      d3.select('#single-barcodetree-g')
        .selectAll('.barcode-node')
        .data(treeNodeArray, function (d, i) {
          return d.id
        })
        .remove()
      var alignedBarcodeNodes = d3.select('#single-barcodetree-g')
        .selectAll('.barcode-node')
        .data(treeNodeArray, function (d, i) {
          return d.id
        })
      //  enter 添加节点
      alignedBarcodeNodes.enter()
        .append('rect')
        .attr('class', 'barcode-node')
        .attr('id', function (d, i) {
          return d.id
        })
        .attr('x', function (d) {
          return +d.x
        })
        .attr('y',  transformY)
        .attr('width', function (d) {
          return +d.width
        })
        .attr('height', function (d) {
          return barcodeNodeHeight
        })
        .style("cursor", "pointer")
      // update 更新节点
      alignedBarcodeNodes.attr('class', 'barcode-node')
        .attr('width', function (d) {
          return +d.width
        })
        .attr('y', transformY)
        .attr('x', function (d) {
          return +d.x
        })
    }
  }, SVGBase))
})