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
  'views/node.config.view',
  'text!templates/layoutDiv.tpl',
], function (require, Mn, _, $, Backbone, Datacenter, Variables, Config, Tooltip, Huebee, RangeSlider, HistogramView, BarcodeView, ToolBarView, NodeConfig, Tpl) {
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
      'colorButton': '#color-picker',
      'barcodeNodeConfig': '#barcode-node-config'
    },
    events: {
      'click #clear-all': 'clear_all_items'
    },
    //  app view视图的初始化函数
    initialize: function () {
      var self = this
      //  DataCenter的初始化, 开始从server端请求数据
      window.Datacenter.start()
      //  初始化监听函数, 因为需要监听histogram中的变量, 所以需要先初始化DataCenter
      self.init_event()
      self.init_common_func()
      self.init_tip()
    },
    //  加载完成DOM元素之后的函数
    onShow: function () {
      init_em_px_transform()
      //  初始化缺失节点的stroke的宽度
      init_missed_stroke_width()
      //  初始化视图中的字体大小
      init_font_size()
      /**
       * 设置loading视图为visible,
       * loading的标志必须在设置完成了text的font size之后才能更新为visible,
       * 否则loading图标的大小会发生改变
       **/
      init_loading_visible()
      //  初始化选择颜色的工具
      var elem = document.querySelector('#color-picker')
      var hueb = new Huebee(elem, {})
      hueb.on('change', function (color, hue, sat, lum) {
        setColorButton(color)
        Variables.set('selectionColor', color)
      })
      //  双击color picker的button的时候会还原颜色设置
      $('#color-picker').dblclick(function () {
        Variables.set('selectionColor', null)
        $('#color-picker').css('background-color', 'white')
        $('#color-picker-text').css('-webkit-text-fill-color', 'black')
      })
      //  初始化loading视图为visible
      function init_loading_visible() {
        $('#loading').css('visibility', 'visible')
      }

      //  初始化em和px之间的变换
      function init_em_px_transform() {
        var viewWidth = $(document).width()
        window.rem_px = viewWidth / 160
      }

      //  初始化视图中的font-size
      function init_font_size() {
        document.getElementsByTagName('html')[0].style.fontSize = window.rem_px + 'px';
      }

      //  根据缺失的节点的stroke width, 决定缺失节点的class
      function init_missed_stroke_width() {
        var strokeWidthRatio = 0.05
        var rem_px = window.rem_px
        var strokeWidth = strokeWidthRatio * rem_px
        Variables.set('missed_node_class', Config.get('MISSED_NODE_CLASS')['MISS_NODE_HIGHLIGHT'])
        Variables.set('general_missed_node_class', Config.get('GENERAL_MISSED_NODE_CLASS')['MISS_NODE_HIGHLIGHT'])
      }

      //  设置选择颜色按钮的button的颜色
      function setColorButton(color) {
        $('#color-picker').css("background-color", color)
      }
    },
    //  在histogram视图中, 点击之后所有选中的barcodeTree都会消失
    clear_all_items: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['CLEAR_ALL'])
    },
    //  设置点击选中或者刷选的barcodeTree的着色
    set_preclick_color: function (color) {
      Backbone.Events.trigger(Config.get('EVENTS')['SET_PRECLICK_COLOR'], {
        color: color
      })
    },
    //  初始化视图中的事件
    init_event: function () {
      var self = this
      //  此时读取了histogram视图中的数据之后会更新histogramModel变量, 表示预处理工作也已经完成, 那么就加载所有的视图
      self.listenTo(window.Datacenter.histogramModel, 'change:histogramDataObject', self.render_view)
      //  监听选择颜色的函数
      Backbone.Events.on(Config.get('EVENTS')['RESET_SELECTION_COLOR'], function (event) {
        self.reset_color_button()
      })
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
      String.prototype.getDepthFromId = function (find, replace) {
        var str = this
        return (+str.split('-')[1])
      }
      Array.prototype.max = function () {
        return Math.max.apply(null, this);
      }
      Array.prototype.min = function () {
        return Math.min.apply(null, this);
      }
      Array.prototype.samewith = function (array2) {
        if (this.length !== array2.length) {
          return false
        }
        if (((typeof (array2)) === 'undefined') || (array2 == null)) {
          return false
        }
        for (var tI = 0; tI < this.length; tI++) {
          if (this[tI] !== array2[tI]) {
            return false
          }
        }
        return true
      }
      Date.prototype.getDifference = function (date2) {
        var date1 = this
        var dateDifference = date1.getTime() - date2.getTime()
        return dateDifference
      }
      window.split_character = ""
    },
    //  重置color button的颜色
    reset_color_button: function () {
      $('#color-picker').css('background-color', 'white')
    },
    //  开始渲染视图的函数
    render_view: function () {
      var self = this
      $('#loading').css({visibility: 'hidden'})
      self.render_toolbar_view()
      self.render_histogram_view()
      self.render_barcode_node_config_view()
      self.render_barcodetree_view()
    },
    //  初始化控制显示barcode进行比较的视图
    render_barcodetree_view: function () {
      var self = this
      //  初始化barcodeView
      self.showChildView('barcodeView', new BarcodeView({
        barcodeCollection: Datacenter.barcodeCollection
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
    },
    //  渲染barcode的控制视图
    render_barcode_node_config_view: function () {
      var self = this
      //  初始化barcode node config的视图
      self.showChildView('barcodeNodeConfig', new NodeConfig())
    }
  })
})
