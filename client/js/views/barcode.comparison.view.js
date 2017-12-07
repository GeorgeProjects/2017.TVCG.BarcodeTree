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
    //  触发删除barcode视图中option按钮的事件
    trigger_remove_option_buttion: function () {
      //  当点击视图的其他空白地方的时候, 需要将option的按钮进行隐藏
      Backbone.Events.trigger(Config.get('EVENTS')[ 'REMOVE_OPTIONS_BUTTTON' ])
    },
    //  触发删除barcode视图中mouseout的事件
    trigger_mouse_out: function () {
      //  当点击视图的其他空白地方的时候, 需要将option的按钮进行隐藏
      Backbone.Events.trigger(Config.get('EVENTS')[ 'NODE_MOUSEOUT' ])
    },
    //  触发barcode视图的清除背景高亮的事件
    trigger_unhovering_barcode: function () {
      //  当点击视图的其他空白地方的时候, 需要将当前选中的barcode的背景清除
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UN_HOVERING_BARCODE_EVENT' ])
    },
    initialize: function () {
      var self = this
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
      //  在barcode比较视图中的背景矩形中增加click的事件
      self.d3el.select('.barcode-tree-single-g')
        .insert('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'comparison-bg')
        .on('click', function (d, i) {
          self.trigger_remove_option_buttion()
          self.trigger_mouse_out()
        })
        .on('mouseover', function () {
          self.trigger_mouse_out()
          self.trigger_unhovering_barcode()
        })
        .on('mouseout', function () {
          self.trigger_mouse_out()
          self.trigger_unhovering_barcode()
        })
        .attr('opacity', 0)
    }
  }, SVGBase))
})
