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
  'bootstrap',
  'views/supertree.view',
  'views/barcode.comparison.view',
  'views/tree.config.view',
  'views/barcode.distribution.view',
  'views/top.toolbar.view',
  'text!templates/barcodeView.tpl'
], function (require, Mn, _, $, Backbone, d3, Datacenter, Config, Variables, Bootstrap, SuperTreeView, BarcodeComparisonView, TreeConfigView, BarcodeDistributionView, TopToolBarView, Tpl) {
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
      self.d3el = d3.select(self.el)
      self.initEventFunc()
    },
    initEventFunc: function () {
      var self = this
      // Backbone.Events.on(Config.get('EVENTS')['UPDATE_BARCODE_VIEW_WIDTH'], function (event) {
      //   var barcodeCollection = self.options.barcodeCollection
      //   var barcodeMaxX = barcodeCollection.get_barcode_nodex_max()
      //   self.update_barcode_width(barcodeMaxX)
      // })
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
    trigger_update_barcode_view: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
    },
    trigger_open_supertree: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['OPEN_SUPER_TREE'])
    },
    trigger_close_supertree: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['CLOSE_SUPER_TREE'])
    },
    //  更新tree config的视图
    trigger_update_tree_config_view: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_TREE_CONFIG_VIEW'])
    },
    init_tooltip: function () {
      var self = this
      $(function () {
        $('[data-toggle = "tooltip"]').tooltip()
      })
    },
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var categoryModel = self.options.categoryModel
      var supertreeModel = self.options.supertreeModel
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
        model: supertreeModel,
        barcodeCollection: barcodeCollection
      })
      self.showChildView('supertreeView', superTreeView)
      // 绘制barcode进行比较的主视图
      console.log(' new BarcodeComparisonView')
      var barcodeComparisonView = new BarcodeComparisonView({
        barcodeCollection: barcodeCollection,
        categoryModel: categoryModel
      })
      self.showChildView('barcodetreeView', barcodeComparisonView)
      //  绘制barcode右侧的config panel的视图, 在config panel上面存在对于barcode视图中通用的控制
      var distributionView = new BarcodeDistributionView({
        barcodeCollection: barcodeCollection,
        categoryModel: categoryModel
      })
      self.showChildView('distributionView', distributionView)
      //  绘制barcode的config panel的视图, 在config panel上包括显示层级, 对齐层级, 布局模式, 展示模式, 比较模式的控制
      var treeConfigView = new TreeConfigView({
        barcodeCollection: barcodeCollection,
        categoryModel: categoryModel
      })
      self.showChildView('treeConfigView', treeConfigView)
      //  右侧的控制视图打开按钮的控制函数
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
      //  在supertree-view-toggle按钮上增加监听函数, 将superTree视图打开
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
      // //  将打开按钮锁定按钮
      // $('#btn-pin').click(function () {
      //   if ($('#btn-pin').hasClass('active')) {
      //     //  对于barcode解除锁定
      //     $('#btn-pin').removeClass('active')
      //     $('#lock-container').html('<i class="fa fa-unlock" aria-hidden="true"></i>')
      //     Variables.set('barcodeTreeIsLocked', false)
      //     self.trigger_update_barcode_view()
      //     self.trigger_update_tree_config_view()
      //   } else {
      //     //  对于barcode的锁定状态
      //     $('#btn-pin').addClass('active')
      //     $('#lock-container').html('<i class="fa fa-lock" aria-hidden="true"></i>')
      //     Variables.set('barcodeTreeIsLocked', true)
      //     self.trigger_update_barcode_view()
      //     self.trigger_update_tree_config_view()
      //   }
      // })
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
      var barcodeCollection = self.options.barcodeCollection
      var histogramHeightRem = Variables.get('histogramHeightRem')
      var toolbarHistogramHeight = histogramHeightRem * window.rem_px
      var barcodePaddingLeft = Variables.get('barcodePaddingLeft') + Variables.get('barcodeTextPaddingLeft')
      var barcodeTreeConfigHeight = $('#top-toolbar-container').height()
      var toolbarViewDivHeight = +$('#toolbar-view-div').height()
      var histogramViewHeight = +$('#histogram-view').height()
      var topToolbarViewHeight = +$('#top-toolbar-container').height()
      // $('#top-toolbar-container').css('height', barcodeTreeConfigHeight + 'px')
      $('#supertree-view-toggle').css('top', (toolbarViewDivHeight + histogramViewHeight + topToolbarViewHeight) + 'px')
    }
    // ,
    // update_barcode_width: function (barcodeMaxX) {
    //   $('#barcodetree-view').width(barcodeMaxX)
    //   $('#supertree-view').width(barcodeMaxX)
    //   //  修改barcode背景的宽度
    //   d3.select('#barcode-view').selectAll('.bg').attr('width', barcodeMaxX)
    // }
  })
})
