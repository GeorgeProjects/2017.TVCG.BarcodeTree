define([
  'require',
  'marionette',
  'underscore',
  'config',
  'backbone',
  'variables',
  'd3'
], function (require, Mn, _, Config, Backbone, Variables, d3) {
  'use strict'

  return Backbone.Model.extend({
    defaults: {
      'maxDepth': 0,
      'maxRadius': 10,
      'uploadTreeObjArray': [],
      'uploadSuperTreeNodeArray': [],
      'uploadBarcodeTreeObjArray': []
    },
    initialize: function () {},
    add_treeobj_array: function (treeObjArray) {
      var self = this
      var uploadTreeObjArray = self.get('uploadTreeObjArray')
      for (var tI = 0; tI < treeObjArray.length; tI++) {
        uploadTreeObjArray.push({
          'singleTreeObj': treeObjArray[ tI ]
        })
      }
      //  在读取用于绘制nodelink-tree的originalTree对象之后, 遍历该对象得到treeNodeIdArray, 这个数组是绘制BarcodeTree的一部分
      var uploadBarcodeTreeObjArray = self.get('uploadBarcodeTreeObjArray')
      for (var tI = 0; tI < treeObjArray.length; tI++) {
        var treeNodeIdArray = self.getTreeNodeIdArray(treeObjArray[ tI ])
        uploadBarcodeTreeObjArray[ tI ] = {
          'treeNodeIdArray': treeNodeIdArray
        }
        uploadTreeObjArray[ tI ].treeNodeIdArray = treeNodeIdArray
      }
    },
    add_barcodetree_array: function (barcodeTreeArray) {
      var self = this
      self.set('uploadTreeObjArray', barcodeTreeArray)
      self.trigger_render_upload_barcode()
    },
    update_supertree_array: function (uploadSuperTreeNodeArray) {
      var self = this
      var superTreeNodeLocArray = uploadSuperTreeNodeArray[ 'superTreeNodeLocArray' ]
      var superTreeObj = uploadSuperTreeNodeArray[ 'superTreeObj' ]
      self.set('uploadSuperTreeNodeArray', superTreeNodeLocArray)
      //  对于NodelinkTreeNode数组判断其节点是否存在
      var uploadTreeObjArray = self.get('uploadTreeObjArray')
      for (var pI = 0; pI < uploadTreeObjArray.length; pI++) {
        var superTreeObj = JSON.parse(JSON.stringify(superTreeObj))
        var treeNodeIdArray = uploadTreeObjArray[ pI ].treeNodeIdArray
        self.judge_node_exist(superTreeObj, treeNodeIdArray)
        uploadTreeObjArray[ pI ].superTreeObj = superTreeObj
      }
      self.get_max_depth()
      //  对于BarcodeTreeNode数组判断其节点是否存在
      var uploadBarcodeTreeObjArray = self.get('uploadBarcodeTreeObjArray')
      for (var uI = 0; uI < uploadBarcodeTreeObjArray.length; uI++) {
        var thisBarcodeNodeObjArray = JSON.parse(JSON.stringify(superTreeNodeLocArray))
        var treeNodeIdArray = uploadBarcodeTreeObjArray[ uI ].treeNodeIdArray
        for (var bI = 0; bI < thisBarcodeNodeObjArray.length; bI++) {
          var nodeCategory = thisBarcodeNodeObjArray[ bI ].category
          if (treeNodeIdArray.indexOf(nodeCategory) === -1) {
            thisBarcodeNodeObjArray[ bI ].exist = false
          } else {
            thisBarcodeNodeObjArray[ bI ].exist = true
          }
        }
        uploadBarcodeTreeObjArray[ uI ].barcodeNodeArray = thisBarcodeNodeObjArray
      }
      self.trigger_render_upload_nodelink()
      self.trigger_render_upload_barcode()
    },
    judge_node_exist: function (superTreeObj, treeNodeIdArray) {
      var self = this
      var nodeId = superTreeObj.id
      if (treeNodeIdArray.indexOf(nodeId) === -1) {
        superTreeObj.exist = false
      } else {
        superTreeObj.exist = true
      }
      if (typeof (superTreeObj.children) !== 'undefined') {
        for (var cI = 0; cI < superTreeObj.children.length; cI++) {
          self.judge_node_exist(superTreeObj.children[ cI ], treeNodeIdArray)
        }
      }
    },
    transfrom_name_id: function (name) {
      var id = name.replace('/', '')
        .replaceAll('&', '')
        .replaceAll(':', '')
        .replaceAll(',', '')
        .replaceAll('.', '')
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replaceAll(';', '')
        .replaceAll('\'', '')
        .replaceAll('?', '')
        .replaceAll('=', '')
        .replaceAll(' ', '-')
        .replaceAll('>', '')
        .replaceAll('[', '')
        .replaceAll(']', '')
        .replaceAll('!', '')
        .replaceAll('"', '')
        .replaceAll('+', '')
        .replaceAll('/', '')
        .replaceAll('@', '')
      return id
    },
    getTreeNodeIdArray: function (treeObj) {
      var self = this
      var treeNodeIdArray = []

      function is_numeric (str) {
        return /^\d+$/.test(str);
      }

      function zFill (str) {
        var pad = "000"
        var ans = str + pad.substring(0, pad.length - str.length)
        return ans
      }

      function innerLinearizeTreeObj (treeObj, treeNodeIdArray) {
        var nodeName = treeObj.name
        if (is_numeric(nodeName)) {
          nodeName = zFill(nodeName)
        } else {
          nodeName = self.transfrom_name_id(nodeName)
        }
        treeNodeIdArray.push(nodeName)
        if (typeof (treeObj.children) !== 'undefined') {
          for (var cI = 0; cI < treeObj.children.length; cI++) {
            innerLinearizeTreeObj(treeObj.children[ cI ], treeNodeIdArray)
          }
        }
        return
      }

      innerLinearizeTreeObj(treeObj, treeNodeIdArray)
      return treeNodeIdArray
    },
    get_max_depth: function () {
      var self = this
      var uploadTreeObjArray = self.get('uploadTreeObjArray')
      var maxDepth = 0
      var accumulatedLevel = 0
      for (var uI = 0; uI < uploadTreeObjArray.length; uI++) {
        var treeDepth = getDepth(uploadTreeObjArray[ uI ].superTreeObj)
        uploadTreeObjArray[ uI ].locationLevel = accumulatedLevel
        uploadTreeObjArray[ uI ].maxDepth = treeDepth
        accumulatedLevel = accumulatedLevel + treeDepth
        maxDepth = maxDepth > treeDepth ? maxDepth : treeDepth
      }
      self.set('maxDepth', maxDepth)
      function getDepth (obj) {
        var depth = 0;
        if (obj.children) {
          obj.children.forEach(function (d) {
            var tmpDepth = getDepth(d)
            if (tmpDepth > depth) {
              depth = tmpDepth
            }
          })
        }
        return 1 + depth
      }
    },
    trigger_render_upload_nodelink: function () {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'RENDER_UPLOAD_NODELINK_TREE' ])
    },
    trigger_render_upload_barcode: function () {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'RENDER_UPLOAD_BARCODE_TREE' ])
    }
  })
})
