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
  'iconfont',
  'views/supertree.view',
  'views/single.nodelink.view',
  'views/single.barcode.view',
  'text!templates/singleBarcodeView.tpl'
], function (require, Mn, _, $, Backbone, d3, Datacenter, Config, Variables, IconFront, SuperTreeView, SingleNodeLinkView, SingleBarcodeView, Tpl) {
  'use strict'

  return Mn.LayoutView.extend({
    tagName: 'div',
    template: _.template(Tpl),
    regions: {
      'nodelinktreeView': '#single-nodelink-tree-view',
      'barcodetreeView': '#single-barcode-tree-view',
    },
    attributes: {
      'style': 'height: 100%; width: 100%',
    },
    events: {},
    initialize: function () {
      var self = this
      self.d3el = d3.select(self.el)
    },
    onShow: function () {
      var self = this
      var singleBarcodeModel = self.model
      self.initBarcodeModeConfigView()
      //  绘制superTree的视图, 主要是对于barcodeView进行一定的控制
      var singleNodeLinkView = new SingleNodeLinkView({
        model: singleBarcodeModel
      })
      self.showChildView('nodelinktreeView', singleNodeLinkView)
      // 绘制barcode进行比较的主视图
      var singleBarcodeView = new SingleBarcodeView({
        model: singleBarcodeModel
      })
      self.showChildView('barcodetreeView', singleBarcodeView)
    },
    //  初始化barcode config视图
    initBarcodeModeConfigView: function () {
      var barcodeConfigWidth = $('#barcode-mode-config-view').width() * 2 / 3
      $('#barcode-mode-config-view > .icon-svg').css('height', barcodeConfigWidth + 'px')
      var barcodeModeConfigViewHeight = $('#barcode-mode-config-view').height()
      var barcodeSingleViewHeight = $('#barcode-single-view').height()
      var barcodeModeConfigViewTop = (barcodeSingleViewHeight - barcodeModeConfigViewHeight) / 2
      $('#barcode-mode-config-view').css('top', barcodeModeConfigViewTop)
      $('#level_width-value_null').addClass('select-highlight')
      $('#barcode-mode-config-view > .icon-svg').on('mouseover', function(){
        $(this).addClass('mouseover-highlight')
      })
      $('#barcode-mode-config-view > .icon-svg').on('mouseout', function(){
        $(this).removeClass('mouseover-highlight')
      })
      $('#barcode-mode-config-view > .icon-svg').on('mouseover', function(){
        $(this).addClass('mouseover-highlight')
      })
      $('#barcode-mode-config-view > .icon-svg').on('click', function(){
        $('#barcode-mode-config-view > .icon-svg').removeClass('select-highlight')
        $(this).addClass('select-highlight')
      })
    }
  })
})
