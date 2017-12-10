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
  'huebee',
  'rangeslider',
  'views/histogram-main.view',
  'views/barcode.view',
  'views/toolbar.view',
  'views/sidebar.view',
  'views/single.view',
  'views/node.config.view',
  'text!templates/layoutDiv.tpl',
], function (require, Mn, _, $, Backbone, Datacenter, Variables, Config, Tooltip, Huebee, RangeSlider, HistogramView, BarcodeView, ToolBarView, SideBarView, SingleView, NodeConfig, Tpl) {
  'use strict'
  return Mn.LayoutView.extend({
    tagName: 'div',
    template: _.template(Tpl),
    attributes: {
      'style': 'width: 100%; height:100%;'
    },
    regions: {
      'toolbarView': '#toolbar-view',
      'histogramView': '#histogram-main-panel',
      'barcodeView': '#barcode-view',
      'singleView': '#barcode-single-view',
      'colorButton': '#color-picker',
      'barcodeNodeConfig': '#barcode-node-config'
    },
    events: {
      'click #select-all': 'select_all_items',
      'click #clear-all': 'clear_all_items'
    },
    select_all_items: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['SELECT_ALL'])
    },
    clear_all_items: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['CLEAR_ALL'])
    },
    set_preclick_color: function (color) {
      Backbone.Events.trigger(Config.get('EVENTS')['SET_PRECLICK_COLOR'], {
        color: color
      })
    },
    initialize: function (options) {
      var self = this
      self.init_common_func()
      //  系统在初始化的时间点会预先绘制一部分barcode, 在绘制好这部分barcode之后会结束loading,直接显示。
      //  因此在视图的整个初始化过程中有两个阶段, 一个阶段是在从服务器端获取数据的统计信息, (即柱状图的相关数据)之后, 开始渲染视图
      //  另一个阶段是将部分barcode绘制好之后,停止视图的加载条
      $(document).ready(function () {
        // self.listenTo(Variables, 'change:loading', function (model, loading) {
        //   if (loading) {
        //     $('#loading').removeClass('hidden')
        //   } else {
        //     $('#loading').addClass('hidden')
        //     window.NProgress.done()
        //   }
        // })
        window.tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(function (d) {
            return d//"<span style='color:steelblue'>" + d + "</span>"
          })
        window.histogramTip = d3.tip()
          .attr('class', 'd3-histogram-tip')
          .offset([-10, 0])
          .html(function (d) {
            return d//"<span style='color:steelblue'>" + d + "</span>"
          })
        Backbone.Events.on(Config.get('EVENTS')['FINISH_RENDER_VIEW'], function () {
          $('#loading').addClass('hidden')
          window.NProgress.done()
        })
        Backbone.Events.on(Config.get('EVENTS')['BEGIN_RENDER_HISTOGRAM_VIEW'], function () {
          self.render_toolbar_view()
          self.render_histogram_view()
          self.render_single_view()
          self.render_barcode_node_config_view()
          self.render_barcodetree_view()
        })
        Backbone.Events.on(Config.get('EVENTS')['BEGIN_RENDER_BARCODE_VIEW'], function () {
          self.render_barcodetree_view()
        })
        // var defaultSettings = Config.get('DEFAULT_SETTINGS')
        // var windowHeight = $('body').width()
        // var barcodeHeight = windowHeight / 30
        // defaultSettings.barcodeHeight = barcodeHeight
        // Variables.set('barcodeHeight', barcodeHeight)
        //  获取整个视图的宽度与高度, 初始化控制barcode的表现的参数, 包括barcode的高度,宽度,interval,字体的大小
        var viewWidth = $(document).width()
        var viewHeight = $(document).height()
        Datacenter.start(viewWidth, viewHeight)
        // window.barcodeHeight = barcodeHeight
        //  初始化选择颜色的工具
        var elem = document.querySelector('#color-picker')
        var hueb = new Huebee(elem, {})
        hueb.on('change', function (color, hue, sat, lum) {
          resetColorButton()
          resetCurrentPreClick(color)
        })
      })
      function resetCurrentPreClick(color) {
        self.set_preclick_color(color)
      }
      function resetColorButton() {
        $('#color-picker').html('<span class="glyphicon glyphicon-pencil jscolor" aria-hidden="true"></span>')
        $('#color-picker').css("background-color", "")
      }
    },
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
    },
    //  初始化控制barcode的参数的视图
    render_single_view: function () {
      var self = this
      //  初始化barcodeView
      self.showChildView('singleView', new SingleView({
        model: Datacenter.singleBarcodeModel
      }))
    },
    //  初始化控制显示barcode进行比较的视图
    render_barcodetree_view: function () {
      var self = this
      //  初始化barcodeView
      self.showChildView('barcodeView', new BarcodeView({
        barcodeCollection: Datacenter.barcodeCollection,
        categoryModel: Datacenter.categoryModel,
        supertreeModel: Datacenter.supertreeModel
      }))
      $('#supertree-scroll-panel').scroll(function () {
        $('#barcodetree-scrollpanel').scrollLeft($(this).scrollLeft())
      })
      $('#barcodetree-scrollpanel').scroll(function () {
        $('#supertree-scroll-panel').scrollLeft($(this).scrollLeft())
      })
    },
    //  初始化barcode上方的控制的视图
    render_toolbar_view: function () {
      var self = this
      //  初始化toolbar视图
      self.showChildView('toolbarView', new ToolBarView({
        model: Datacenter.histogramModel,
        barcodeCollection: Datacenter.barcodeCollection,
        singleBarcodeModel: Datacenter.singleBarcodeModel
      }))
    },
    // 初始化视图上方的柱状图视图
    render_histogram_view: function () {
      var self = this
      //  初始化histogramView
      self.showChildView('histogramView', new HistogramView({
        model: Datacenter.histogramModel,
        barcodeCollection: Datacenter.barcodeCollection
      }))
    },
    //  渲染barcode的控制视图
    render_barcode_node_config_view: function () {
      var self = this
      //  初始化barcode node config的视图
      self.showChildView('barcodeNodeConfig', new NodeConfig())
    }
  })
})
