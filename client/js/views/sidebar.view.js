define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'd3',
  'datacenter',
  'config',
  'variables',
  'collections/barcode.collection',
  'views/svg-base.addon',
  'text!templates/sidebarView.tpl'
], function (require, Mn, _, Backbone, d3, DataCenter, Config, Variables, BarcodeCollection, SVGBase, Tpl) {
  'user strict'

  return Mn.LayoutView.extend({
    tagName: 'div',
    attributes: {
      'style': 'width:100%; height: 100%',
      'id': 'sidebar-view-div'
    },
    template: function () {
      return _.template(Tpl)
    },
    events: function () {
    },
    initialize: function () {
    }
  })
})
