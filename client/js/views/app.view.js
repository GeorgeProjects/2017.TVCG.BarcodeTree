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
  'bootstrap',
  'rangeslider',
  'views/histogram-main.view',
  'views/barcode.view',
  'views/toolbar.view',
  'views/sidebar.view',
  'views/single.view',
  'views/node.config.view',
  'text!templates/layoutDiv.tpl',
], function (require, Mn, _, $, Backbone, Datacenter, Variables, Config, Tooltip, Huebee, Bootstrap, RangeSlider, HistogramView, BarcodeView, ToolBarView, SideBarView, SingleView, NodeConfig, Tpl) {
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
        $('#loading').css({visibility: 'visible'})
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
        //  此时加载完成histogram视图, 表示预处理工作也已经完成
        Backbone.Events.on(Config.get('EVENTS')['BEGIN_RENDER_HISTOGRAM_VIEW'], function () {
          $('#loading').css({visibility: 'hidden'})
          self.render_toolbar_view()
          self.render_histogram_view()
          self.render_single_view()
          self.render_barcode_node_config_view()
          self.render_barcodetree_view()
        })
        // Backbone.Events.on(Config.get('EVENTS')['BEGIN_RENDER_BARCODE_VIEW'], function () {
        //   console.log('BEGIN_RENDER_BARCODE_VIEW')
        //   self.render_barcodetree_view()
        // })
        Backbone.Events.on(Config.get('EVENTS')['RESET_SELECTION_COLOR'], function (event) {
          self.reset_color_button()
        })
        // var defaultSettings = Config.get('DEFAULT_SETTINGS')
        // var windowHeight = $('body').width()
        // var barcodeHeight = windowHeight / 30
        // defaultSettings.barcodeHeight = barcodeHeight
        // Variables.set('barcodeHeight', barcodeHeight)
        //  初始化视图中的字体大小
        init_font_size()
        //  初始化缺失节点的stroke的宽度
        init_missed_stroke_width()
        Datacenter.start()
        // window.barcodeHeight = barcodeHeight
        //  初始化选择颜色的工具
        var elem = document.querySelector('#color-picker')
        var hueb = new Huebee(elem, {})
        hueb.on('change', function (color, hue, sat, lum) {
          setColorButton(color)
          Variables.set('selectionColor', color)
          // resetCurrentPreClick(color)
        })
        //  双击color picker的button的时候会还原颜色设置
        $('#color-picker').dblclick(function () {
          Variables.set('selectionColor', null)
          $('#color-picker').css('background-color', 'white')
          $('#color-picker-text').css('-webkit-text-fill-color', 'black')
        })
      })
      //  初始化视图中的font-size
      function init_font_size() {
        var viewWidth = $(document).width()
        window.rem_px = viewWidth / 160
        document.getElementsByTagName('html')[0].style.fontSize = window.rem_px + 'px';
      }

      //  根据缺失的节点的stroke width, 决定缺失节点的class
      function init_missed_stroke_width() {
        var strokeWidthRatio = 0.05
        var rem_px = window.rem_px
        var strokeWidth = strokeWidthRatio * rem_px
        Variables.set('missed_node_class', Config.get('MISSED_NODE_CLASS')['MISS_NODE_HIGHLIGHT'])
        Variables.set('general_missed_node_class', Config.get('GENERAL_MISSED_NODE_CLASS')['MISS_NODE_HIGHLIGHT'])
        //  之前是检验屏幕的长宽来设置miss的节点的stroke的宽度, 现在是根据不同的节点类型设置stroke的宽度
        // if (strokeWidth <= 0.5) {
        //   //  将节点的class设置为min-stroke
        //   Variables.set('missed_node_class', Config.get('MISSED_NODE_CLASS')['MISS_NODE_HIGHLIGHT_MIN_STROKE'])
        //   Variables.set('general_missed_node_class', Config.get('GENERAL_MISSED_NODE_CLASS')['MISS_NODE_HIGHLIGHT_MIN_STROKE'])
        // } else if (strokeWidth >= 0.5) {
        //   //  将节点的class设置为max-stroke
        //   Variables.set('missed_node_class', Config.get('MISSED_NODE_CLASS')['MISS_NODE_HIGHLIGHT_MAX_STROKE'])
        //   Variables.set('general_missed_node_class', Config.get('GENERAL_MISSED_NODE_CLASS')['MISS_NODE_HIGHLIGHT_MAX_STROKE'])
        // } else {
        //   //  将节点的class设置为scale-stroke
        //   Variables.set('missed_node_class', Config.get('MISSED_NODE_CLASS')['MISS_NODE_HIGHLIGHT'])
        //   Variables.set('general_missed_node_class', Config.get('GENERAL_MISSED_NODE_CLASS')['MISS_NODE_HIGHLIGHT'])
        // }
      }

      //  之前的设定是预先选择一定的barcode的histogram, 然后选择颜色就可以支持在预先选择的barcode上面增加颜色
      // function resetCurrentPreClick(color) {
      //   self.set_preclick_color(color)
      //   // var selectionColor =
      // }
      function setColorButton(color) {
        $('#color-picker').css("background-color", color)
      }
    },
    //  重置color button的颜色
    reset_color_button: function () {
      $('#color-picker').css('background-color', 'white')
    },
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
