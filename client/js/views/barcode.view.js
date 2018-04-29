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
  'views/supertree.view',
  'views/barcode.comparison.view',
  'views/tree.config.view',
  'views/barcode.distribution.view',
  'views/top.toolbar.view',
  'text!templates/barcodeView.tpl'
], function (require, Mn, _, $, Backbone, d3, Datacenter, Config, Variables, SuperTreeView, BarcodeComparisonView, TreeConfigView, BarcodeDistributionView, TopToolBarView, Tpl) {
  'use strict'
  //  barcode.view中包含三个视图, 分别是比较barcodeTree的主视图, barcode的superTree视图, barcode的参数控制视图
  return Mn.LayoutView.extend({
    tagName: 'div',
    template: _.template(Tpl),
    default: {
      duration: 500
    },
    regions: {
      'topToolbarView': '#top-toolbar-container',
      'supertreeView': '#supertree-view',
      'barcodetreeView': '#barcodetree-view',
      'distributionView': '#barcode-distribution-view',
      'treeConfigView': '#tree-config-view'
    },
    attributes: {
      'style': 'height: 100%; width: 100%',
    },
    events: {},
    initialize: function () {
      var self = this
      self.init_event()
    },
    init_event: function () {
      var self = this
      //  打开distribution视图
      Backbone.Events.on(Config.get('EVENTS')['OPEN_DISTRIBUTION_VIEW'], function (event) {
        self.open_config_view()
      })
      //  关闭distribution视图
      Backbone.Events.on(Config.get('EVENTS')['CLOSE_DISTRIBUTION_VIEW'], function (event) {
        self.close_config_view()
      })
      //  打开supertree视图
      Backbone.Events.on(Config.get('EVENTS')['OPEN_SUPER_TREE'], function (event) {
        self.open_supertree_view()
      })
      //  关闭supertree视图
      Backbone.Events.on(Config.get('EVENTS')['CLOSE_SUPER_TREE'], function (event) {
        self.close_supertree_view()
      })
    },
    trigger_open_supertree: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['OPEN_SUPER_TREE'])
    },
    trigger_close_supertree: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['CLOSE_SUPER_TREE'])
    },
    init_tooltip: function () {
      $(function () {
        $('[data-toggle = "tooltip"]').tooltip()
      })
    },
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      //  initBarcodeView的参数
      self.init_barcodeview_para()
      self.init_tooltip()
      self.init_sync()
      self.init_view_loc()
      //  barcode视图上方的toolbar视图
      var topToolBarView = new TopToolBarView({
        barcodeCollection: barcodeCollection
      })
      self.showChildView('topToolbarView', topToolBarView)
      //  绘制superTree的视图, 主要是对于barcodeView进行一定的控制
      var superTreeView = new SuperTreeView({
        barcodeCollection: barcodeCollection
      })
      self.showChildView('supertreeView', superTreeView)
      // 绘制barcode进行比较的主视图
      var barcodeComparisonView = new BarcodeComparisonView({
        barcodeCollection: barcodeCollection
      })
      self.showChildView('barcodetreeView', barcodeComparisonView)
      //  绘制barcode右侧的config panel的视图, 在config panel上面存在对于barcode视图中通用的控制
      var distributionView = new BarcodeDistributionView({
        barcodeCollection: barcodeCollection
      })
      self.showChildView('distributionView', distributionView)
      //  绘制barcode的config panel的视图, 在config panel上包括显示层级, 对齐层级, 布局模式, 展示模式, 比较模式的控制
      var treeConfigView = new TreeConfigView({
        barcodeCollection: barcodeCollection
      })
      self.showChildView('treeConfigView', treeConfigView)
      /**
       * 右侧的控制视图打开按钮的控制函数
       */
      $('#distribution-view-toggle').click(function () {
        var configPanelState = Variables.get('configPanelState')
        if (configPanelState === 'close') {
          //  当前的状态是关闭, 点击按钮将config panel打开
          self.open_config_view()
        } else if (configPanelState === 'open') {
          //  当前的状态是打开, 点击按钮将config panel关闭
          self.close_config_view()
        }
      })
      //  控制distribution的toggle在不同状态下的透明度
      $('#distribution-view-toggle').mousemove(function () {
        $('#distribution-view-toggle').css('opacity', 1)
      })
      $('#distribution-view-toggle').mouseout(function () {
        $('#distribution-view-toggle').css('opacity', 0.3)
      })
      /**
       * 在supertree-view-toggle按钮上增加监听函数, 将superTree视图打开
       */
      $('#supertree-view-toggle').click(function () {
        var superTreeViewState = Variables.get('superTreeViewState')
        if (superTreeViewState) {
          //  当前的状态是打开的状态, 转变成关闭的状态
          self.trigger_close_supertree()
        } else {
          //  当前的状态是关闭的状态, 转变成打开的状态
          self.open_supertree_view()
          self.trigger_open_supertree()
        }
      })
      //  控制superTree view的toggle在不同状态下的透明度
      $('#supertree-view-toggle').mousemove(function () {
        $('#supertree-view-toggle').css('opacity', 1)
      })
      $('#supertree-view-toggle').mouseout(function () {
        $('#supertree-view-toggle').css('opacity', 0.3)
      })
    },
    //  初始化barcode视图的宽度和高度的参数
    init_barcodeview_para: function () {
      var self = this
      var barcodetreeViewWidth = $('#barcodetree-view').width()
      var barcodetreeViewHeight = $('#barcodetree-view').height()
      Variables.set('barcodetreeViewWidth', barcodetreeViewWidth)
      Variables.set('barcodetreeViewHeight', barcodetreeViewHeight)
    },
    open_config_view: function () {
      var self = this
      var duration = self.duration
      var barcodeDistributionViewWidth = +$('#barcode-config').width()
      var configPanelState = Variables.get('configPanelState')
      if (configPanelState === 'close') {
        $('#barcode-config').animate({
          right: '+=' + barcodeDistributionViewWidth,
        }, duration, function () {
          $('#distribution-view-controller').attr('class', 'glyphicon glyphicon-chevron-right')
        })
        Variables.set('configPanelState', 'open')
      }
    },
    close_config_view: function () {
      var self = this
      var duration = self.duration
      var barcodeDistributionViewWidth = +$('#barcode-config').width()
      var configPanelState = Variables.get('configPanelState')
      if (configPanelState === 'open') {
        $('#barcode-config').animate({
          right: '-=' + barcodeDistributionViewWidth,
        }, duration, function () {
          $('#distribution-view-controller').attr('class', 'glyphicon glyphicon-chevron-left')
        })
        Variables.set('configPanelState', 'close')
      }
    },
    //  打开supertree视图
    open_supertree_view: function () {
      var self = this
      window.Variables.update_barcode_attr()
      $('#supertree-state-controller').attr('class', 'glyphicon glyphicon-chevron-up')
    },
    //  关闭supertree视图
    close_supertree_view: function () {
      var self = this
      window.Variables.update_barcode_attr()
      $('#supertree-state-controller').attr('class', 'glyphicon glyphicon-chevron-down')
    },
    /**
     * 控制superTree视图与barcodeTree视图能够同时左右滚动
     */
    init_sync: function () {
      var self = this
      $('#supertree-scroll-panel').scroll(function () {
        $('#barcodetree-scrollpanel').scrollLeft($(this).scrollLeft())
      })
      $('#barcodetree-scrollpanel').scroll(function () {
        $('#supertree-scroll-panel').scrollLeft($(this).scrollLeft())
      })
    },
    init_view_loc: function () {
      var self = this
      var toolbarViewDivHeight = +$('#toolbar-view-div').height()
      var histogramViewHeight = +$('#histogram-view').height()
      var topToolbarViewHeight = +$('#top-toolbar-container').height()
      $('#supertree-view-toggle').css('top', (toolbarViewDivHeight + histogramViewHeight + topToolbarViewHeight) + 'px')
    }
  })
})
