define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'config',
  'd3',
  'variables',
  'views/barcode.collection.view',
  'views/svg-base.addon',
  'text!templates/barcode.collection.tpl'
], function (require, Mn, _, Backbone, Config, d3, Variables, BarcodeCollectionView, SVGBase, Tpl) {
  'use strict'

  return Mn.LayoutView.extend(_.extend({
    tagName: 'div',
    template: _.template(Tpl),
    regions: {
      'barcodeTreeContainer': '#barcodetree-collection-container'
    },
    attributes: {
      'id': 'barcodetree-svg',
      'style': 'height: 100%; width: 100%'
    },
    initialize: function () {
      var self = this
      self.init_events()
    },
    init_events: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
    },
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var barcodeCollectionView = new BarcodeCollectionView({
        collection: barcodeCollection
      })
      self.showChildView('barcodeTreeContainer', barcodeCollectionView)
      var width = $('#barcodetree-view').width()
      var height = $('#barcodetree-view').height()
      var barcodeTreeSortingPanelHeight = Variables.get('barcodeTreeSortingPanelHeight')
      self.d3el.select('#barcodetree-bg-g')
        .attr('transform', 'translate(' + 0 + ',' + barcodeTreeSortingPanelHeight + ')')
      self.d3el.select('.barcode-tree-single-g')
        .attr('transform', 'translate(' + 0 + ',' + barcodeTreeSortingPanelHeight + ')')
      //  在barcode比较视图中的背景矩形中增加click的事件
      self.d3el.select('.barcode-tree-single-g')
        .insert('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'comparison-bg')
        .on('click', function (d, i) {
          self.trigger_mouse_out()
        })
        .on('mouseover', function () {
          self.trigger_unhovering_barcode()
        })
        .on('mouseout', function () {
          self.trigger_unhovering_barcode()
        })
        .attr('opacity', 0)
    }
  }, SVGBase))
})
