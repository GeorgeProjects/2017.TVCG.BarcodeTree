define([
  'require',
  'marionette',
  'underscore',
  'jquery',
  'backbone',
  'd3',
  'variables',
  'views/barcode.single.view',
  'views/svg-base.addon'
], function (require, Mn, _, $, Backbone, d3, Variables, BarcodeSingleView, SVGBase) {
  'use strict';

  return Mn.CollectionView.extend(_.extend({
    tagName: 'g',
    childView: BarcodeSingleView,
    attributes: {
      'class': 'barcode-tree-single-g',
    },
    initialize: function () {
      var self = this
      self.listenTo(this.collection, 'add', self.add)
      self.listenTo(this.collection, 'remove', self.remove)
      self.listenTo(Variables, 'change:barcodeNodexMaxX', self.update_barcode_view_width)
      self.listenTo(Variables, 'change:barcodeNodeyMaxY', self.update_barcode_view_height)
      Backbone.Events.on(Config.get('EVENTS')['UPDATE_BARCODE_ATTR'], function (event) {
        // self.update_barcode_attr()
      })
      Backbone.Events.on(Config.get('EVENTS')['RESET_BARCODE_ATTR'], function (event) {
        self.reset_barcode_attr()
      })
      Backbone.Events.on(Config.get('EVENTS')['SHOW_LOADING_ICON'], function (event) {
        self.show_loading_icon()
      })
      Backbone.Events.on(Config.get('EVENTS')['HIDE_LOADING_ICON'], function (event) {
        self.hide_loading_icon()
      })
      //  鼠标悬浮在barcode上面广播的事件
      Backbone.Events.on(Config.get('EVENTS')['HOVERING_BARCODE_EVENT'], function (event) {
        var barcodeTreeId = event.barcodeTreeId
        self.hovering_barcode(barcodeTreeId)
      })
      //  鼠标从barcode上面移开广播的事件
      Backbone.Events.on(Config.get('EVENTS')['UN_HOVERING_BARCODE_EVENT'], function (event) {
        self.unhovering_barcode()
      })
    },
    //  更新barcode视图的高度
    update_barcode_view_height: function () {
      var self = this
      var barcodeNodeYMaxY = Variables.get('barcodeNodeyMaxY')
      $('#barcodetree-view').height(barcodeNodeYMaxY)
    },
    //  更新barcode视图的宽度
    update_barcode_view_width: function () {
      var self = this
      var barcodeTreeContainerWidth = +$('#barcodetree-scrollpanel').width()
      var barcodeNodexMaxX = Variables.get('barcodeNodexMaxX')
      var comparisonViewMargin = Variables.get('comparisonViewMargin')
      var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
      var barcodePaddingLeft = Variables.get('barcodePaddingLeft')
      var barcodePaddingLeftAll = barcodeTextPaddingLeft + barcodePaddingLeft
      //  增加barcode左侧padding的距离
      barcodeNodexMaxX = barcodeNodexMaxX + barcodePaddingLeftAll
      //  增加barcode右侧padding的距离
      barcodeNodexMaxX = barcodeNodexMaxX + comparisonViewMargin.right
      var barcodetreeViewWidth = barcodeTreeContainerWidth
      if ((!isNaN(barcodeNodexMaxX)) && (typeof(barcodeNodexMaxX) !== 'undefined')) {
        barcodetreeViewWidth = barcodeTreeContainerWidth > barcodeNodexMaxX ? barcodeTreeContainerWidth : barcodeNodexMaxX
      }
      $('#barcodetree-view').width(barcodetreeViewWidth)
      if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
        $('#barcodetree-scrollpanel').css({'overflow-x': 'hidden'})
      }
      $('#supertree-view').width(barcodetreeViewWidth)
      d3.selectAll('.bg').attr('width', barcodetreeViewWidth)
      d3.select('.container-bg').attr('width', barcodetreeViewWidth)
    },
    show_loading_icon: function () {
      var self = this
      d3.select('#barcode-view-loading').style('visibility', 'visible')
    },
    //  停止视图的更新
    hide_loading_icon: function () {
      var self = this
      d3.select('#barcode-view-loading').style('visibility', 'hidden')
    },
    add: function () {
      var self = this
    },
    remove: function () {
      var self = this
    },
    update_barcode_attr: function () {
      var self = this
    },
    reset_barcode_attr: function () {
      var self = this
      var defaultSettings = Config.get('DEFAULT_SETTINGS')
      var defaultHeight = defaultSettings.default_barcode_height
      Variables.set('barcodeHeight', defaultHeight)
    },
    hovering_barcode: function (barcodeTreeId) {
      var self = this
      d3.select(self.el).select('#' + barcodeTreeId)
        .select('.bg')
        .classed('hovering-highlight', true)
    },
    unhovering_barcode: function () {
      var self = this
      d3.select(self.el)
        .selectAll('.bg')
        .classed('hovering-highlight', false)
    }
  }, SVGBase))
})