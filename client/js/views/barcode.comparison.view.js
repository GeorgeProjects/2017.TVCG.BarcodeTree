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
    tagName: 'svg',
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
      //  在comparison视图中增加背景的矩形
    },
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var barcodeCollectionView = new BarcodeCollectionView({
        collection: barcodeCollection
      })
      self.showChildView('barcodeTreeContainer', barcodeCollectionView)
    }
  }, SVGBase))
})
