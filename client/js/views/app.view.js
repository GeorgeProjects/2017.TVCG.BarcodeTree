define([
  'require',
  'marionette',
  'underscore',
  'jquery',
  'backbone',
  'datacenter',
  'variables',
  'config',
  'tooltips',
  'views/histogram.view',
  'views/barcode.view',
  'views/toolbar.view',
  'text!templates/layoutDiv.tpl',
], function (require, Mn, _, $, Backbone, Datacenter, Variables, Config, Tooltip, HistogramView, BarcodeView,
             ToolBarView, Tpl) {
  'use strict'
  return Mn.LayoutView.extend({
    tagName: 'div',
    template: _.template(Tpl),
    attributes: {
      'style': 'width: 100%; height:100%;'
    },
    regions: {
      'toolbarView': '#toolbar-view',
      'histogramView': '#histogram-view',
      'barcodeView': '#barcode-view',
    },
    //  app view视图的初始化函数
    initialize: function () {
      var self = this
      //  DataCenter的初始化, 开始从server端请求数据
      Datacenter.start()
      //  初始化监听函数, 因为需要监听histogram中的变量, 所以需要先初始化DataCenter
      self.init_event()
      self.init_common_func()
      self.init_tip()
    },
    //  加载完成DOM元素之后的函数
    onShow: function () {
      //  初始化em和px之间的变换
      var viewWidth = $(document).width()
      window.rem_px = viewWidth / 160
      //  初始化视图中的字体大小
      document.getElementsByTagName('html')[0].style.fontSize = window.rem_px + 'px';
      /**
       * 设置loading视图为visible,
       * loading的标志必须在设置完成了text的font size之后才能更新为visible,
       * 否则loading图标的大小会发生改变
       **/
      $('#loading').css('visibility', 'visible')
    },
    //  初始化视图中的事件
    init_event: function () {
      var self = this
      //  此时读取了histogram视图中的数据之后会更新histogramModel变量, 表示预处理工作也已经完成, 那么就加载所有的视图
      // self.listenTo(window.Datacenter.histogramModel, 'change:histogramDataObject', self.render_view)
      self.listenTo(window.Datacenter.rawDataModel, 'change:originalData', self.render_view)
    },
    //  初始化在barcodeTree系统中的tip
    init_tip: function () {
      window.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
          return d
        })
      window.histogramTip = d3.tip()
        .attr('class', 'd3-histogram-tip')
        .offset([-10, 0])
        .html(function (d) {
          return d
        })
    },
    //  初始化视图中公共的函数
    init_common_func: function () {
      String.prototype.replaceAll = function (find, replace) {
        var str = this
        return str.replace(new RegExp(find.replace(/[-\/\\^$*+?!.()><|[\]{}]/g, '\\$&'), 'g'), replace)
      }
      Array.prototype.max = function () {
        return Math.max.apply(null, this);
      }
      Array.prototype.min = function () {
        return Math.min.apply(null, this);
      }
      Date.prototype.getDifference = function (date2) {
        var date1 = this
        var dateDifference = date1.getTime() - date2.getTime()
        return dateDifference
      }
      window.split_character = ""
    },
    //  开始渲染视图的函数
    render_view: function () {
      var self = this
      $('#loading').css({visibility: 'hidden'})
      self.render_toolbar_view()
      self.render_histogram_view()
      self.render_barcodetree_view()
    },
    //  初始化控制显示barcode进行比较的视图
    render_barcodetree_view: function () {
      var self = this
      //  初始化barcodeView
      self.showChildView('barcodeView', new BarcodeView({
        barcodeCollection: Datacenter.barcodeCollection
      }))
    },
    //  初始化barcode上方的控制的视图
    render_toolbar_view: function () {
      var self = this
      //  初始化toolbar视图
      self.showChildView('toolbarView', new ToolBarView())
    },
    // 初始化视图上方的柱状图视图
    render_histogram_view: function () {
      var self = this
      //  初始化histogramView
      self.showChildView('histogramView', new HistogramView({
        model: Datacenter.histogramModel,
        barcodeCollection: Datacenter.barcodeCollection
      }))
    }
  })
})
