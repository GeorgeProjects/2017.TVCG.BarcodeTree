define([
  'require',
  'marionette',
  'underscore',
  'backbone'
], function (require, Mn, _, Backbone) {
  'use strict'

  return Backbone.Model.extend({
    defaults: {
      //  对齐节点的对象, 对象中存储每个aligne的subtree的节点数组
      'alignedTreeObject': {}
    },
    initialize: function () {
      var self = this
    },
    update_supertree_view: function (alignedTreeId, alignedTreeNodeArray, alignedTreeNodeX) {
      var self = this
      var alignedTreeObject = self.get('alignedTreeObject')
      alignedTreeObject[ alignedTreeId ] = {}
      alignedTreeObject[ alignedTreeId ].alignedTreeNodeArray = alignedTreeNodeArray
      alignedTreeObject[ alignedTreeId ].alignedTreeNodeX = alignedTreeNodeX
    }
  })
})