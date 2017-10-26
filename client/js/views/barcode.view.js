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
  'views/barcode.config.view',
  'text!templates/barcodeView.tpl'
], function (require, Mn, _, $, Backbone, d3, Datacenter, Config, Variables, SuperTreeView, BarcodeComparisonView, BarcodeConfigView, Tpl) {
  'use strict'

  return Mn.LayoutView.extend({
    tagName: 'div',
    template: _.template(Tpl),
    regions: {
      'supertreeView': '#supertree-view',
      'barcodetreeView': '#barcodetree-view',
      'configView': '#barcode-config-view'
    },
    attributes: {
      'style': 'height: 100%; width: 100%',
    },
    events: {},
    initialize: function () {
      var self = this
      self.d3el = d3.select(self.el)
      Backbone.Events.on(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW_WIDTH' ], function (event) {
        var barcodeCollection = self.options.barcodeCollection
        var barcodeMaxX = barcodeCollection.get_barcode_nodex_max()
        self.update_barcode_width(barcodeMaxX)
      })
    },
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var categoryModel = self.options.categoryModel
      var supertreeModel = self.options.supertreeModel
      var barcodetreeViewWidth = $('#barcodetree-view').width()
      var barcodetreeViewHeight = $('#barcodetree-view').height()
      Variables.set('barcodetreeViewWidth', barcodetreeViewWidth)
      Variables.set('barcodetreeViewHeight', barcodetreeViewHeight)
      //  绘制superTree的视图, 主要是对于barcodeView进行一定的控制
      var superTreeView = new SuperTreeView({
        model: supertreeModel,
        barcodeCollection: barcodeCollection
      })
      self.showChildView('supertreeView', superTreeView)
      // 绘制barcode进行比较的主视图
      var barcodeComparisonView = new BarcodeComparisonView({
        barcodeCollection: barcodeCollection,
        categoryModel: categoryModel
      })
      self.showChildView('barcodetreeView', barcodeComparisonView)
      //  绘制barcode右侧的config panel的视图, 在config panel上面存在对于barcode视图中通用的控制
      var configView = new BarcodeConfigView({
        barcodeCollection: barcodeCollection,
        categoryModel: categoryModel
      })
      self.showChildView('configView', configView)
      //  在按钮上面添加点击的响应事件
      $('#btn-toggle').click(function () {
        var configPanelState = Variables.get('configPanelState')
        var duration = 500
        //  当前的状态是关闭, 点击按钮将config panel打开
        if (configPanelState === 'close') {
          $('#barcode-config').animate({
            right: '+=260',
          }, duration, function () {
            $('#btn-state-controller').attr('class', 'glyphicon glyphicon-chevron-right')
          })
          Variables.set('configPanelState', 'open')
        } else if (configPanelState === 'open') {
          //  当前的状态是打开, 点击按钮将config panel关闭
          $('#barcode-config').animate({
            right: '-=260',
          }, duration, function () {
            $('#btn-state-controller').attr('class', 'glyphicon glyphicon-chevron-left')
          })
          Variables.set('configPanelState', 'close')
        }
      })
      //  在supertree-view-toggle按钮上增加监听函数, 将superTree视图打开
      $('#supertree-view-toggle').click(function () {
        var superTreeViewState = Variables.get('superTreeViewState')
        if (superTreeViewState) {
          //  当前的状态是打开的状态, 转变成关闭的状态
          self.close_supertree_view()
          $('#supertree-state-controller').attr('class', 'glyphicon glyphicon-chevron-down')
        } else {
          //  当前的状态是关闭的状态, 转变成打开的状态
          self.open_supertree_view()
          $('#supertree-state-controller').attr('class', 'glyphicon glyphicon-chevron-top')
        }
      })
      //  锁定按钮
      $('#btn-pin').click(function () {
        if ($('#btn-toggle').prop('disabled')) {
          $('#btn-toggle').prop('disabled', false)
          $('#supertree-view-toggle').prop('disabled', false)
          $('#btn-pin').removeClass('active')
        } else {
          $('#btn-toggle').prop('disabled', true)
          $('#supertree-view-toggle').prop('disabled', true)
          $('#btn-pin').addClass('active')
        }
      })
    },
    open_supertree_view: function () {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')[ 'OPEN_SUPER_TREE' ])
      window.Variables.update_barcode_attr()
    },
    close_supertree_view: function () {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')[ 'CLOSE_SUPER_TREE' ])
      window.Variables.update_barcode_attr()
    },
    update_barcode_width: function (barcodeMaxX) {
      $('#barcodetree-view').width(barcodeMaxX)
      $('#supertree-view').width(barcodeMaxX)
      //  修改barcode背景的宽度
      d3.select('#barcode-view').selectAll('.bg').attr('width', barcodeMaxX)
      $('#supertree-scroll-panel').scroll(function () {
        $('#barcodetree-scrollpanel').scrollLeft($(this).scrollLeft())
      })
      $('#barcodetree-scrollpanel').scroll(function () {
        $('#supertree-scroll-panel').scrollLeft($(this).scrollLeft())
      })
    }
  })
})
