define([
  'require',
  'marionette',
  'underscore',
  'jquery',
  'backbone',
  'config',
  'd3',
  'variables',
  'models/barcode.model'
], function (require, Mn, _, $, Backbone, Config, d3, Variables, BarcodeModel) {
  'use strict'

  return Backbone.Collection.extend({
    model: BarcodeModel,
    initialize: function () {
      var self = this
      self.subtreeNodeArrayObj = {}
      self.alignedNodeIdArray = []
      self.alignedNodeObjArray = []
      self.basedModel = null
      Variables.set('alignedNodeIdArray', self.alignedNodeIdArray)
    },
    add_barcode_dataset: function (barcodeModelArray) {
      var self = this
      for (var bI = 0; bI < barcodeModelArray.length; bI++) {
        var barcodeModel = barcodeModelArray[ bI ]
        self.adjust_barcode_model(barcodeModel)
        self.update_statistics_info(barcodeModel)
        barcodeModel.set('basedModel', self.basedModel)
        // 将barcodeModel加入到collection中之后则barcode就直接绘制出来了, 所以在add之前需要将barcode的height改变
        self.update_barcode_model_height(barcodeModel)
        self.add(barcodeModel)
      }
      self.updateBarcodeNodexMaxX()
      self.update_barcode_location()
      self.align_multi_subtree()
      // self.align_added_model()
    },
    //  在histogram.main.js中取消选择一个barcode文件, 顺序需要做的是update_barcode_location
    //  删除对应的barcode.model
    //  相应的改变barcode的位置
    remove_barcode_dataset: function (barcodeTreeId) {
      var self = this
      self.remove(self.where({ 'barcodeTreeId': barcodeTreeId }))
      self.update_barcode_location()
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_ATTR' ])
    },
    //  trigger出的信号所表示的是已经完成了对于barcode数据的准备, 接下来app.view中开始调用render_barcodetree_view进行渲染
    request_barcode_dataset: function () {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')[ 'BEGIN_RENDER_BARCODE_VIEW' ])
    },
    reset_attribute: function () {
      var self = this
      self.subtreeNodeArrayObj = {}
      self.alignedNodeIdArray = []
      self.alignedNodeObjArray = []
      self.basedModel = null
      self.each(function (model) {
        model.reset_attribute()
      })
    },
    // update_barcode_height: function () {
    //   var self = this
    //   self.each(function (barcodeModel) {
    //     barcodeModel.update_height()
    //   })
    // },
    /**
     * 更新对于所增加的barcode的相关统计信息, 主要包括在不同的层级范围内的节点的数量信息
     */
    update_statistics_info: function (barcodeModel) {
      var maxDepth = Variables.get('maxDepth')
      var barcodeNodeAttrArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        barcodeNodeAttrArray = barcodeModel.get('barcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        barcodeNodeAttrArray = barcodeModel.get('compactBarcodeNodeAttrArray')
      }
      var leveledNodeNumArray = []
      for (var mI = 0; mI <= maxDepth; mI++) {
        leveledNodeNumArray.push(0)
      }
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        var nodeDepth = barcodeNodeAttrArray[ bI ].depth
        for (var ibI = nodeDepth; ibI <= maxDepth; ibI++) {
          leveledNodeNumArray[ ibI ] = leveledNodeNumArray[ ibI ] + 1
        }
      }
      var maxLeveledNumArray = Variables.get('maxLeveledNumArray')
      if (maxLeveledNumArray.length === 0) {
        maxLeveledNumArray = leveledNodeNumArray
      } else {
        for (var lI = 0; lI < leveledNodeNumArray.length; lI++) {
          if (leveledNodeNumArray[ lI ] > maxLeveledNumArray[ lI ]) {
            maxLeveledNumArray[ lI ] = leveledNodeNumArray[ lI ]
          }
        }
      }
      Variables.set('maxLeveledNumArray', maxLeveledNumArray)
    },
    align_multi_subtree: function () {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      var alignedDeferArray = []
      // inner_align_single_subtree(alignedNodeObjArray, 0)
      // function inner_align_single_subtree(alignedNodeObjArray, aI){
      //   var deferObj = $.Deferred()
      //   if(typeof(alignedNodeObjArray[aI]) !== 'undefined'){
      //     var rootId = alignedNodeObjArray[ aI ].alignedNodeId
      //     var rootLevel = alignedNodeObjArray[ aI ].alignedNodeLevel
      //     var rootCategory = alignedNodeObjArray[ aI ].alignedNodeCategory
      //     window.Datacenter.buildSuperTree(rootId, rootLevel, rootCategory, deferObj)
      //     alignedDeferArray.push(deferObj)
      //     $.when(deferObj)
      //       .done(function () {
      //         //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
      //         self.compute_aligned_subtree_range()
      //         inner_align_single_subtree(alignedNodeObjArray, (aI + 1))
      //       })
      //       .fail(function () { console.log('defer fail') })
      //   }
      // }
      for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
        var deferObj = $.Deferred()
        var rootId = alignedNodeObjArray[ aI ].alignedNodeId
        var rootLevel = alignedNodeObjArray[ aI ].alignedNodeLevel
        var rootCategory = alignedNodeObjArray[ aI ].alignedNodeCategory
        window.Datacenter.buildSuperTree(rootId, rootLevel, rootCategory, deferObj)
        alignedDeferArray.push(deferObj)
        $.when(deferObj)
          .done(function () {
            //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
            self.compute_aligned_subtree_range()
          })
          .fail(function () { console.log('defer fail') })
      }
      if (alignedDeferArray.length !== 0) {
        $.when.apply(null, alignedDeferArray)
          .done(function () {
            //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
            self.compute_aligned_subtree_range()
          })
          .fail(function () { console.log('defer fail') })
      }
    },
    aligned_current_tree: function () {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      if (alignedNodeObjArray.length === 0) {
        var nodeId = 'node-0-root'
        var depth = 0
        var category = 'root'
        self.add_super_subtree(nodeId, depth, category)
      } else {
        for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
          var alignedNodeId = alignedNodeObjArray[ aI ].alignedNodeId
          var alignedNodeLevel = alignedNodeObjArray[ aI ].alignedNodeLevel
          var alignedNodeCategory = alignedNodeObjArray[ aI ].alignedNodeCategory
          self.add_super_subtree(alignedNodeId, alignedNodeLevel, alignedNodeCategory)
        }
      }
    },
    /**
     * 在singlebarcodetree视图中点击节点进行选中子树的对齐
     * @param rootId
     * @param rootLevel
     * @param rootCategory
     */
    add_super_subtree: function (rootId, rootLevel, rootCategory) {
      var self = this
      //  alignedNodeIdArray记录已经对齐的节点数组
      var alignedNodeIdArray = self.alignedNodeIdArray
      var alignedNodeObjArray = self.alignedNodeObjArray
      var addedSubtreeDeferObj = $.Deferred()
      //  当addedSubtreeDeferObj对象被resolved的时候, 标志着对齐的子树节点数组被插入到子树的节点数组中, 并且相应的状态已经被更新
      $.when(addedSubtreeDeferObj)
        .done(function () {
          //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
          self.compute_aligned_subtree_range()
        })
        .fail(function () { console.log('defer fail') })
      if (alignedNodeIdArray.indexOf(rootId) === -1) {
        alignedNodeIdArray.push(rootId)
        alignedNodeObjArray.push({
          alignedNodeId: rootId,
          alignedNodeLevel: rootLevel,
          alignedNodeCategory: rootCategory
        })
      }
      //  根据选择对齐的barcode的节点层级更新当前的对齐层级, 当前的对齐层级是最深的层级
      var nodeDepth = rootLevel
      var currentAligneLevel = Variables.get('alignedLevel')
      if (currentAligneLevel < nodeDepth) {
        Variables.set('alignedLevel', nodeDepth)
      }
      window.Datacenter.buildSuperTree(rootId, rootLevel, rootCategory, addedSubtreeDeferObj)
    },
    /**
     *
     */
    add_all_super_subtree: function () {
      var self = this
      var alignedNodeObjArray = self.alignedNodeObjArray
      var alignDeferedObjArray = []
      for (var dI = 0; dI < alignedNodeObjArray.length; dI++) {
        alignDeferedObjArray.push($.Deferred())
      }
      // window.Datacenter.buildSuperTree(alignedNodeObjArray[ 0 ].alignedNodeId, alignedNodeObjArray[ 0 ].alignedNodeLevel, alignedNodeObjArray[ 0 ].alignedNodeCategory, alignDeferedObjArray[ 0 ])
      // for (var aI = 1; aI < alignedNodeObjArray.length; aI++) {
      //   var alignedNodeId = alignedNodeObjArray[ aI ].alignedNodeId
      //   var alignedNodeLevel = alignedNodeObjArray[ aI ].alignedNodeLevel
      //   var alignedNodeCategory = alignedNodeObjArray[ aI ].alignedNodeCategory
      //   var deferedObj = alignDeferedObjArray[ aI ]
      //   $.when(alignDeferedObjArray[ aI - 1 ])
      //     .done(function () {
      //       window.Datacenter.buildSuperTree(alignedNodeId, alignedNodeLevel, alignedNodeCategory, deferedObj)
      //     })
      //     .fail(function () { console.log('defer fail') })
      // }
      if (alignDeferedObjArray.length > 0) {
        $.when(alignDeferedObjArray[ alignDeferedObjArray.length - 1 ])
          .done(function () {
            //  在barcode collection中的model里面增加了super subtree之后如何对齐节点的位置
            self.compute_aligned_subtree_range()
          })
          .fail(function () { console.log('defer fail') })
        var init_aligned_obj_index = 0
        inner_align_super_subtree(alignedNodeObjArray, alignDeferedObjArray, init_aligned_obj_index)
      } else {
        self.compute_aligned_subtree_range()
      }
      function inner_align_super_subtree (alignedNodeObjArray, alignDeferedObjArray, aligned_obj_index) {
        if (aligned_obj_index === 0) {
          //  第一个调用buildSuperTree方法不需要等待上一个alignedSuperTree结束
          window.Datacenter.buildSuperTree(alignedNodeObjArray[ aligned_obj_index ].alignedNodeId, alignedNodeObjArray[ aligned_obj_index ].alignedNodeLevel, alignedNodeObjArray[ aligned_obj_index ].alignedNodeCategory, alignDeferedObjArray[ aligned_obj_index ])
          inner_align_super_subtree(alignedNodeObjArray, alignDeferedObjArray, aligned_obj_index + 1)
        } else {
          //  其他的调用buildSuperTree方法需要等待上一个alignedSuperTree结束
          if (aligned_obj_index < alignDeferedObjArray.length) {
            $.when(alignDeferedObjArray[ aligned_obj_index - 1 ])
              .done(function () {
                window.Datacenter.buildSuperTree(alignedNodeObjArray[ aligned_obj_index ].alignedNodeId, alignedNodeObjArray[ aligned_obj_index ].alignedNodeLevel, alignedNodeObjArray[ aligned_obj_index ].alignedNodeCategory, alignDeferedObjArray[ aligned_obj_index ])
                inner_align_super_subtree(alignedNodeObjArray, alignDeferedObjArray, aligned_obj_index + 1)
              })
              .fail(function () { console.log('defer fail') })
          }
        }
      }
    },
    // compute_aligned_subtree_range: function () {
    //   var self = this
    //   var alignedNodeIdArray = self.alignedNodeIdArray
    //   self.each(function (model) {
    //     //  计算每个barcode对齐的节点范围以及节点对齐的长度
    //     model.compute_single_aligned_subtree_range(alignedNodeIdArray)
    //     //  初始化padding node的节点位置
    //     model.init_padding_node_location()
    //   })
    //   //  需要先将padding node所占据的最大的长度计算出来, 然后更新barcode的节点位置, 因为对齐的需要, 对齐节点需要以padding node的最大节点
    //   self.compute_padding_node_max_length()
    //   //  更新barcode节点的属性数组
    //   self.update_barcode_node_attr_array()
    //   //  在选中另一个对齐的子树之后重新进行排序
    //   var alignedRangeObjArray = self.at(0).get('alignedRangeObjArray')
    //   var basedModel = self.basedModel
    //   if (basedModel != null) {
    //     if (alignedRangeObjArray.length !== 0) {
    //       self.sort_accord_similarity()
    //       self.trigger_color_encoding()
    //     } else {
    //       self.sort_based_as_first()
    //     }
    //   }
    //   //  因为打开了superTree view所以barcode的高度进行了压缩, 需要重新更新barcode的位置以及高度
    //   self.update_barcode_location()
    //   self.trigger_barcode_loc()
    // },
    /**
     *
     */
    compute_aligned_subtree_range: function () {
      var self = this
      var alignedNodeIdArray = self.alignedNodeIdArray
      if (self.length <= 0) {
        return
      }
      self.each(function (model) {
        //  计算每个barcode对齐的节点范围以及节点对齐的长度
        model.compute_single_aligned_subtree_range(alignedNodeIdArray)
        //  初始化padding node的节点位置
        model.init_padding_node_location()
      })
      //  因为打开了superTree view所以barcode的高度进行了压缩, 需要重新更新barcode的位置以及高度
      self.update_barcode_location()
      //  需要先将padding node所占据的最大的长度计算出来, 然后更新barcode的节点位置, 因为对齐的需要, 对齐节点需要以padding node的最大节点
      self.compute_padding_node_max_length()
      //  更新barcode节点的属性数组
      self.update_barcode_node_attr_array()
      //  在选中另一个对齐的子树之后重新进行排序
      var alignedRangeObjArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        alignedRangeObjArray = self.at(0).get('alignedRangeObjArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        alignedRangeObjArray = self.at(0).get('compactAlignedRangeObjArray')
      }
      var basedModel = self.basedModel
      if (basedModel != null) {
        if (alignedRangeObjArray.length !== 0) {
          self.sort_accord_similarity()
          self.trigger_color_encoding()
        } else {
          self.sort_based_as_first()
        }
      }
      self.updateBarcodeNodexMaxX()
      self.trigger_barcode_loc()
    },
    /**
     * 更新barcode显示节点的层级
     */
    update_displayed_level: function () {
      var self = this
      var alignedNodeIdArray = self.alignedNodeIdArray
      self.each(function (model) {
        model.update_displayed_level()
        model.update_covered_rect_obj(alignedNodeIdArray)
      })
    },
    /**
     *  更新barcode节点的属性数组
     *  更新fish eye的程度
     update_barcode_node_attr_array: function () {
      var self = this
      self.each(function (model) {
        model.update_barcode_node_array()
        // model.update_aligned_barcode_node()
        // model.update_unaligned_barcode_node()
        // model.update_align_followed_node()
        // //  再次更新padding node的位置
        // model.update_padding_node_location()
        model.get_single_comparison_result()
        model.existed_first_padding_next_view_update()
      })
      self.trigger_render_supertree()
    },
     update_click_covered_rect_attr_array: function () {
      var self = this
      self.each(function (model) {
        model.update_barcode_node_array()
        // model.update_aligned_barcode_node()
        // model.update_unaligned_barcode_node()
        // model.update_align_followed_node()
        // //  再次更新padding node的位置
        // model.update_padding_node_location()
        model.get_single_comparison_result()
        model.aligned_move_first_padding_next_view_update()
      })
      self.trigger_render_supertree()
    },
     */
    /**
     *  更新barcode节点的属性数组
     **/
    update_barcode_node_attr_array: function () {
      var self = this
      self.each(function (model) {
        model.update_barcode_node_array()
        // console.log('*******update_barcode_node_array***********')
        // model.show_NaN_node()
        model.update_aligned_barcode_node()
        // console.log('*******update_aligned_barcode_node***********')
        // model.show_NaN_node()
        //  TODO error part
        model.update_unaligned_barcode_node()
        // console.log('*******update_unaligned_barcode_node***********')
        // model.show_NaN_node()
        model.update_align_followed_node()
        // console.log('*******update_align_followed_node***********')
        // model.show_NaN_node()
        // 再次更新padding node的位置
        model.update_padding_node_location()
        // console.log('*******update_padding_node_location***********')
        // model.show_NaN_node()
        // model.update_barcode_node_array()
        // model.update_unaligned_barcode_node()
        // model.update_align_followed_node()
        // model.update_padding_node_location()
        model.get_single_comparison_result()
        // model.existed_first_padding_next_view_update()
        // model.update_aligned_barcode_array()
      })
      self.update_barcode_node_collection_obj()
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW' ])
      if (this.length > 0) {
        self.trigger_render_supertree()
      }
    },
    update_click_covered_rect_attr_array: function () {
      var self = this
      self.each(function (model) {
        model.update_barcode_node_array()
        model.update_aligned_barcode_node()
        model.update_unaligned_barcode_node()
        model.update_align_followed_node()
        // //  再次更新padding node的位置
        model.update_padding_node_location()
        // model.get_single_comparison_result()
        model.aligned_move_first_padding_next_view_update()
      })
      self.trigger_render_supertree()
    },
    update_barcode_node_collection_obj: function () {
      var self = this
      var barcodeNodeCollectionObj = {}
      var barcodeNodeCollectionObjWithId = {}
      barcodeNodeCollectionObj[ 'ratio' ] = new Array()
      barcodeNodeCollectionObjWithId[ 'ratio' ] = new Array()
      self.each(function (model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var barcodeTreeId = model.get('barcodeTreeId')
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if ((barcodeNodeAttrArray[ bI ].existed) && (barcodeNodeAttrArray[ bI ].width !== 0)) {
            var nodeDepth = barcodeNodeAttrArray[ bI ].depth
            var nodeId = barcodeNodeAttrArray[ bI ].id
            if (typeof (barcodeNodeCollectionObj[ nodeDepth ]) !== 'undefined') {
              var maxnum = barcodeNodeAttrArray[ bI ].maxnum
              if (typeof (maxnum) !== 'undefined') {
                barcodeNodeCollectionObj[ nodeDepth ].push(barcodeNodeAttrArray[ bI ].num)
                barcodeNodeCollectionObjWithId[ nodeDepth ].push({
                  treeId: barcodeTreeId,
                  nodeId: nodeId,
                  value: barcodeNodeAttrArray[ bI ].num
                })
                barcodeNodeCollectionObj[ 'ratio' ].push(barcodeNodeAttrArray[ bI ].num / maxnum)
                barcodeNodeCollectionObjWithId[ 'ratio' ].push({
                  treeId: barcodeTreeId,
                  nodeId: nodeId,
                  value: barcodeNodeAttrArray[ bI ].num / maxnum
                })
              }
            } else {
              barcodeNodeCollectionObj[ nodeDepth ] = new Array()
              barcodeNodeCollectionObjWithId[ nodeDepth ] = new Array()
              if (typeof (maxnum) !== 'undefined') {
                barcodeNodeCollectionObj[ nodeDepth ].push(barcodeNodeAttrArray[ bI ].num)
                barcodeNodeCollectionObjWithId[ nodeDepth ].push({
                  treeId: barcodeTreeId,
                  nodeId: nodeId,
                  value: barcodeNodeAttrArray[ bI ].num
                })
              }
            }
          }
        }
      })
      Variables.set('barcodeNodeCollectionObj', barcodeNodeCollectionObj)
      Variables.set('barcodeNodeCollectionObjWithId', barcodeNodeCollectionObjWithId)
      if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
        Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_DISTRIBUTION_VIEW' ])
      }
    },
    /**
     *  改变padding对象是否compact的属性, 将compact的节点展开
     */
    changCompactMode: function (paddingNodeIndex) {
      var self = this
      self.each(function (model) {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var paddingNodeObjArray = model.get('paddingNodeObjArray')
          var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
          _paddingNodeObjArray[ paddingNodeIndex ].isCompact = false
          paddingNodeObjArray[ paddingNodeIndex ].isCompact = false
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var compactPaddingNodeObjArray = model.get('compactPaddingNodeObjArray')
          var _compactPaddingNodeObjArray = model.get('_compactPaddingNodeObjArray')
          _compactPaddingNodeObjArray[ paddingNodeIndex ].isCompact = false
          compactPaddingNodeObjArray[ paddingNodeIndex ].isCompact = false
        }
      })
    },
    /**
     *  改变padding对象是否compact的属性, 将compact的节点压缩
     */
    changExpandMode: function (paddingNodeIndex) {
      var self = this
      self.each(function (model) {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var paddingNodeObjArray = model.get('paddingNodeObjArray')
          var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
          _paddingNodeObjArray[ paddingNodeIndex ].isCompact = true
          paddingNodeObjArray[ paddingNodeIndex ].isCompact = true
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var compactPaddingNodeObjArray = model.get('compactPaddingNodeObjArray')
          var _compactPaddingNodeObjArray = model.get('_compactPaddingNodeObjArray')
          _compactPaddingNodeObjArray[ paddingNodeIndex ].isCompact = true
          compactPaddingNodeObjArray[ paddingNodeIndex ].isCompact = true
        }
      })
    },
    /**
     * 计算padding node的最大长度
     */
    compute_padding_node_max_length: function () {
      var self = this
      var basedModel = self.at(0)
      var basedPaddingNodeObjArray = []
      var compactBasedPaddingNodeObjArray = []
      if (typeof(basedModel) !== 'undefined') {
        basedPaddingNodeObjArray = basedModel.get('paddingNodeObjArray')
        compactBasedPaddingNodeObjArray = basedModel.get('compactPaddingNodeObjArray')
      }
      self.each(function (model) {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var paddingNodeObjArray = model.get('paddingNodeObjArray')
          for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
            if (typeof(paddingNodeObjArray) !== 'undefined') {
              if (paddingNodeObjArray[ pI ].maxPaddingNodeLength > basedPaddingNodeObjArray[ pI ].maxPaddingNodeLength) {
                basedPaddingNodeObjArray[ pI ].maxPaddingNodeLength = paddingNodeObjArray[ pI ].maxPaddingNodeLength
              }
            }
          }
        }
        if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var compactPaddingNodeObjArray = model.get('compactPaddingNodeObjArray')
          for (var pI = 0; pI < compactPaddingNodeObjArray.length; pI++) {
            if (typeof(compactPaddingNodeObjArray) !== 'undefined') {
              if (compactPaddingNodeObjArray[ pI ].maxPaddingNodeLength > compactBasedPaddingNodeObjArray[ pI ].maxPaddingNodeLength) {
                compactBasedPaddingNodeObjArray[ pI ].maxPaddingNodeLength = compactPaddingNodeObjArray[ pI ].maxPaddingNodeLength
              }
            }
          }
        }
      })
      self.each(function (model) {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var paddingNodeObjArray = model.get('paddingNodeObjArray')
          for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
            paddingNodeObjArray[ pI ].maxPaddingNodeLength = basedPaddingNodeObjArray[ pI ].maxPaddingNodeLength
          }
          var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
          for (var pI = 0; pI < _paddingNodeObjArray.length; pI++) {
            _paddingNodeObjArray[ pI ].maxPaddingNodeLength = basedPaddingNodeObjArray[ pI ].maxPaddingNodeLength
          }
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var compactPaddingNodeObjArray = model.get('compactPaddingNodeObjArray')
          for (var pI = 0; pI < compactPaddingNodeObjArray.length; pI++) {
            compactPaddingNodeObjArray[ pI ].maxPaddingNodeLength = compactBasedPaddingNodeObjArray[ pI ].maxPaddingNodeLength
          }
          var _compactPaddingNodeObjArray = model.get('_compactPaddingNodeObjArray')
          for (var pI = 0; pI < _compactPaddingNodeObjArray.length; pI++) {
            _compactPaddingNodeObjArray[ pI ].maxPaddingNodeLength = compactBasedPaddingNodeObjArray[ pI ].maxPaddingNodeLength
          }
        }
      })
    },
    //  更新全局的compact变量
    update_global_compact: function (paddingNodeIndex) {
      var self = this
      self.each(function (model) {
        var paddingNodeObjArray = model.get('paddingNodeObjArray')
        var _paddingNodeObjArray = model.get('_paddingNodeObjArray')
        for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
          if (paddingNodeIndex === pI) {
            if (paddingNodeObjArray[ pI ].isCompact) {
              paddingNodeObjArray[ pI ].isCompact = false
              _paddingNodeObjArray[ pI ].isCompact = false
              model.update_barcode_node_array()
            }
          }
        }
      })
    },
    //  对齐节点的最大的x值, 计算的方法是传入对齐节点的node id, 然后计算的方法是将该节点前面节点的x值进行记录
    //  比较barcode collection中的所有节点, 既可以得到最大的对齐节点的x值
    get_original_max_x: function (rangeStartNodeId) {
      var self = this
      var maxX = 0
      self.each(function (model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var paddingNodeEndX = get_padding_node_end_x(barcodeNodeAttrArray, rangeStartNodeId)
        if (maxX < paddingNodeEndX) {
          maxX = paddingNodeEndX
        }
      })
      return maxX
      function get_padding_node_end_x (barcodeNodeAttrArray, rangeStartNodeId) {
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[ bI ].id === rangeStartNodeId) {
            return +barcodeNodeAttrArray[ bI - 1 ].x + barcodeNodeAttrArray[ bI - 1 ].width
          }
        }
      }
    },
    /**
     * 按照fish eye 布局模式更新barcode的高度
     */
    fish_eye_layout_height_update: function (addedBarcodeModel) {
      var self = this
      var barcodeModelIndex = self.length
      var compactNum = window.compactNum
      var barcodeHeight = Variables.get('barcodeHeight')
      var minBarcodeHeight = Variables.get('minBarcodeHeight')
      var differentHeightNumber = Variables.get('differentHeightNumber')
      var heightScale = d3.scale.linear().domain([ 0, differentHeightNumber ]).range([ barcodeHeight, minBarcodeHeight ]).clamp(true)
      var barcodeContainerHeight = +heightScale(barcodeModelIndex)
      var barcodeOriginalNodeHeight = barcodeContainerHeight * 0.8
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')[ 'ABSOLUTE_COMPACT_FATHER' ]
      addedBarcodeModel.set('barcodeOriginalNodeHeight', barcodeOriginalNodeHeight)
      var barcodeCompactNodeHeight = barcodeOriginalNodeHeight / (compactNum + (compactNum - 1) / 4)
      var barcodeCompactNodeGap = barcodeCompactNodeHeight / 4
      addedBarcodeModel.set('barcodeCompactNodeHeight', barcodeCompactNodeHeight)
      var barcodeNodeAttrArray = addedBarcodeModel.get('barcodeNodeAttrArray')
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        barcodeNodeAttrArray[ bI ].height = barcodeOriginalNodeHeight
      }
      var compactBarcodeNodeAttrArray = addedBarcodeModel.get('compactBarcodeNodeAttrArray')
      for (var cI = 0; cI < compactBarcodeNodeAttrArray.length; cI++) {
        if (compactBarcodeNodeAttrArray[ cI ].compactAttr === ABSOLUTE_COMPACT_FATHER) {
          compactBarcodeNodeAttrArray[ cI ].height = barcodeCompactNodeHeight
          compactBarcodeNodeAttrArray[ cI ].y = compactBarcodeNodeAttrArray[ cI ].compactCount * (barcodeCompactNodeHeight + barcodeCompactNodeGap)
        } else {
          compactBarcodeNodeAttrArray[ cI ].height = barcodeOriginalNodeHeight
        }
      }
    },
    /**
     * fish eye 布局模式
     */
    fish_eye_layout: function () {
      var self = this
      var barcodeModelArray = []
      self.each(function (model) {
        barcodeModelArray.push(model)
      })
      barcodeModelArray = barcodeModelArray.sort(function (model_a, model_b) {
        return model_a.get('barcodeIndex') - model_b.get('barcodeIndex')
      })
      var barcodeYLocation = 0
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var barcodeHeight = Variables.get('barcodeHeight')
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')[ 'ABSOLUTE_COMPACT_FATHER' ]
      //  总共的不同的height的数量
      var differentHeightNumber = selectItemNameArray.length / 4 //  Variables.get('differentHeightNumber')
      var minBarcodeHeight = Variables.get('minBarcodeHeight')
      var compactNum = window.compactNum
      var heightScale = d3.scale.linear().domain([ 0, differentHeightNumber ]).range([ barcodeHeight, minBarcodeHeight ]).clamp(true)
      for (var barcodeIndex = 0; barcodeIndex < barcodeModelArray.length; barcodeIndex++) {
        var treeDataModel = barcodeModelArray[ barcodeIndex ]
        if (typeof(treeDataModel) !== 'undefined') {
          var barcodeContainerHeight = +heightScale(barcodeIndex)
          var barcodeOriginalNodeHeight = barcodeContainerHeight * 0.8
          var barcodeCompactNodeHeight = barcodeOriginalNodeHeight / (compactNum + (compactNum - 1) / 4)
          var barcodeCompactNodeGap = barcodeCompactNodeHeight / 4
          //  更新barcode.model的barcodeNodeHeight和barcodeTreeYLocation属性,控制barcode的container的位置以及高度
          treeDataModel.set('barcodeOriginalNodeHeight', barcodeOriginalNodeHeight)
          treeDataModel.set('barcodeCompactNodeHeight', barcodeCompactNodeHeight)
          var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            barcodeNodeAttrArray[ bI ].height = barcodeOriginalNodeHeight
          }
          var compactBarcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
          for (var cI = 0; cI < compactBarcodeNodeAttrArray.length; cI++) {
            if (compactBarcodeNodeAttrArray[ cI ].compactAttr === ABSOLUTE_COMPACT_FATHER) {
              compactBarcodeNodeAttrArray[ cI ].height = barcodeCompactNodeHeight
              compactBarcodeNodeAttrArray[ cI ].y = compactBarcodeNodeAttrArray[ cI ].compactCount * (barcodeCompactNodeHeight + barcodeCompactNodeGap)
            } else {
              compactBarcodeNodeAttrArray[ cI ].height = barcodeOriginalNodeHeight
            }
          }
          treeDataModel.set('barcodeNodeHeight', barcodeContainerHeight)
          treeDataModel.set('barcodeTreeYLocation', barcodeYLocation)
          barcodeYLocation = barcodeYLocation + barcodeContainerHeight + 1
        }
      }
    },
    /**
     * 按照uniform布局模式更新barcode的高度
     */
    uniform_layout_height_update: function (addedBarcodeModel) {
      var self = this
      var compactNum = window.compactNum
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var selectItemLength = selectItemNameArray.length
      var barcodeHeight = Variables.get('barcodeHeight')
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var superTreeHeight = $('#supertree-scroll-panel').height()
      var barcodeViewHeight = $('#barcode-view').height() - superTreeHeight - selectItemNameArray.length
      var updatedHeight = +new Number(barcodeViewHeight / selectItemLength).toFixed(1)
      var barcodeContainerHeight = +updatedHeight > +barcodeHeight ? +barcodeHeight : +updatedHeight
      var barcodeOriginalNodeHeight = barcodeContainerHeight * 0.8
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')[ 'ABSOLUTE_COMPACT_FATHER' ]
      addedBarcodeModel.set('barcodeOriginalNodeHeight', barcodeOriginalNodeHeight)
      var barcodeCompactNodeHeight = barcodeOriginalNodeHeight / (compactNum + (compactNum - 1) / 4)
      var barcodeCompactNodeGap = barcodeCompactNodeHeight / 4
      addedBarcodeModel.set('barcodeCompactNodeHeight', barcodeCompactNodeHeight)
      var barcodeNodeAttrArray = addedBarcodeModel.get('barcodeNodeAttrArray')
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        barcodeNodeAttrArray[ bI ].height = barcodeOriginalNodeHeight
      }
      var compactBarcodeNodeAttrArray = addedBarcodeModel.get('compactBarcodeNodeAttrArray')
      for (var cI = 0; cI < compactBarcodeNodeAttrArray.length; cI++) {
        if (compactBarcodeNodeAttrArray[ cI ].compactAttr === ABSOLUTE_COMPACT_FATHER) {
          compactBarcodeNodeAttrArray[ cI ].height = barcodeCompactNodeHeight
          compactBarcodeNodeAttrArray[ cI ].y = compactBarcodeNodeAttrArray[ cI ].compactCount * (barcodeCompactNodeHeight + barcodeCompactNodeGap)
        } else {
          compactBarcodeNodeAttrArray[ cI ].height = barcodeOriginalNodeHeight
        }
      }
    },
    /**
     * uniform 的布局模式
     */
    uniform_layout: function () {
      var self = this
      var barcodeModelArray = []
      self.each(function (model) {
        barcodeModelArray.push(model)
      })
      barcodeModelArray.sort(function (model_a, model_b) {
        return model_a.get('barcodeIndex') - model_b.get('barcodeIndex')
      })
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var barcodeHeight = Variables.get('barcodeHeight')
      var compactNum = window.compactNum
      var superTreeHeight = $('#supertree-scroll-panel').height()
      var barcodeViewHeight = $('#barcode-view').height() - superTreeHeight - selectItemNameArray.length
      var updatedHeight = +new Number(barcodeViewHeight / selectItemNameArray.length).toFixed(1)
      window.barcodeHeight = +updatedHeight > +barcodeHeight ? +barcodeHeight : +updatedHeight
      var barcodeContainerHeight = +window.barcodeHeight
      var barcodeOriginalNodeHeight = barcodeContainerHeight * 0.8
      var barcodeCompactNodeHeight = barcodeOriginalNodeHeight / (compactNum + (compactNum - 1) / 4)
      var barcodeCompactNodeGap = barcodeCompactNodeHeight / 4
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')[ 'ABSOLUTE_COMPACT_FATHER' ]
      var barcodeYLocation = 0
      for (var barcodeIndex = 0; barcodeIndex < barcodeModelArray.length; barcodeIndex++) {
        var treeDataModel = barcodeModelArray[ barcodeIndex ]
        if (typeof(treeDataModel) !== 'undefined') {
          //  更新barcode.model的barcodeNodeHeight和barcodeTreeYLocation属性,控制barcode的container的位置以及高度
          treeDataModel.set('barcodeOriginalNodeHeight', barcodeOriginalNodeHeight)
          treeDataModel.set('barcodeCompactNodeHeight', barcodeCompactNodeHeight)
          var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            barcodeNodeAttrArray[ bI ].height = barcodeOriginalNodeHeight
          }
          var compactBarcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
          for (var cI = 0; cI < compactBarcodeNodeAttrArray.length; cI++) {
            if (compactBarcodeNodeAttrArray[ cI ].compactAttr === ABSOLUTE_COMPACT_FATHER) {
              compactBarcodeNodeAttrArray[ cI ].height = barcodeCompactNodeHeight
              compactBarcodeNodeAttrArray[ cI ].y = compactBarcodeNodeAttrArray[ cI ].compactCount * (barcodeCompactNodeHeight + barcodeCompactNodeGap)
            } else {
              compactBarcodeNodeAttrArray[ cI ].height = barcodeOriginalNodeHeight
            }
          }
          treeDataModel.set('barcodeNodeHeight', barcodeContainerHeight)
          treeDataModel.set('barcodeTreeYLocation', barcodeYLocation)
          barcodeYLocation = barcodeYLocation + barcodeContainerHeight + 1
        }
      }
    },
    /**
     * 按照现在的barcode中的对齐节点, 对于增加的barcodeModel中的节点数组进行调整
     * @param barcodeModel
     */
    adjust_barcode_model: function (barcodeModel) {
      var self = this
      var barcodeNodeGap = Config.get('BARCODE_NODE_GAP')
      var alignedNodeIdArray = self.alignedNodeIdArray
      var alignedObj = {}
      var basedBarcodeModel = self.at(0)
      var basedBarcodeNodeAttrArray = null
      var basedCompactBarcodeNodeAttrArray = null
      if (typeof(basedBarcodeModel) !== 'undefined') {
        basedBarcodeNodeAttrArray = basedBarcodeModel.get('barcodeNodeAttrArray')
        basedCompactBarcodeNodeAttrArray = basedBarcodeModel.get('compactBarcodeNodeAttrArray')
      }
      var thisBarcodeNodeAttrArray = barcodeModel.get('barcodeNodeAttrArray')
      var thisCompactBarcodeNodeAttrArray = barcodeModel.get('compactBarcodeNodeAttrArray')
      var isAdjustBasedModel = (self.length !== 0)
      //  按照align的节点排列
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        _inner_adjust_barcode_model(isAdjustBasedModel, basedBarcodeNodeAttrArray, thisBarcodeNodeAttrArray)
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        _inner_adjust_compact_barcode_model(isAdjustBasedModel, basedCompactBarcodeNodeAttrArray, thisCompactBarcodeNodeAttrArray)
      }
      // if ((thisBarcodeNodeAttrArray.length !== 0) && (thisCompactBarcodeNodeAttrArray.length !== 0)) {
      // }
      function _inner_adjust_barcode_model (isAdjustBasedModel, basedBarcodeNodeAttrArray, thisBarcodeNodeAttrArray) {
        //  取得当前对齐节点的x位置, 计算的方法是通过获取对齐节点的数组, 然后得到该数组中的相对应节点的位置
        if (isAdjustBasedModel) {
          for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
            for (var bI = 0; bI < basedBarcodeNodeAttrArray.length; bI++) {
              if (basedBarcodeNodeAttrArray[ bI ].id === alignedNodeIdArray[ aI ]) {
                alignedObj[ alignedNodeIdArray[ aI ] ] = +basedBarcodeNodeAttrArray[ bI ].x
              }
            }
          }
        }
        //  将增加的barcode model中的节点数组进行相应的变换, 即如果不是对齐的节点, 那么按照从左到右累计进行计算。
        for (var tI = 1; tI < thisBarcodeNodeAttrArray.length; tI++) {
          var barcodeNodeId = thisBarcodeNodeAttrArray[ tI ].id
          if (thisBarcodeNodeAttrArray[ tI - 1 ].width !== 0) {
            thisBarcodeNodeAttrArray[ tI ].x = thisBarcodeNodeAttrArray[ tI - 1 ].x + thisBarcodeNodeAttrArray[ tI - 1 ].width + barcodeNodeGap
          } else {
            thisBarcodeNodeAttrArray[ tI ].x = thisBarcodeNodeAttrArray[ tI - 1 ].x
          }
          if (alignedNodeIdArray.indexOf(barcodeNodeId) !== -1) {
            if (alignedObj[ barcodeNodeId ] > thisBarcodeNodeAttrArray[ tI ].x) {
              thisBarcodeNodeAttrArray[ tI ].x = alignedObj[ barcodeNodeId ]
            }
          }
        }
      }

      //  对齐compact model中节点的位置
      function _inner_adjust_compact_barcode_model (isAdjustBasedModel, basedBarcodeNodeAttrArray, thisBarcodeNodeAttrArray) {
        if (isAdjustBasedModel) {
          for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
            for (var bI = 0; bI < basedBarcodeNodeAttrArray.length; bI++) {
              if (basedBarcodeNodeAttrArray[ bI ].id === alignedNodeIdArray[ aI ]) {
                alignedObj[ alignedNodeIdArray[ aI ] ] = +basedBarcodeNodeAttrArray[ bI ].x
              }
            }
          }
        }
        //  将增加的barcode model中的节点数组进行相应的变换, 即如果不是对齐的节点, 那么按照从左到右累计进行计算,
        //  与普通的barcode计算不同的是, compact形式的barcode需要考虑将compact模式的节点的排布问题
        var compactCount = 0
        var selectedLevels = window.selectedLevels
        var compactNum = window.compactNum
        var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')[ 'ABSOLUTE_COMPACT_FATHER' ]
        var ABSOLUTE_COMPACT_CHILDREN = Config.get('CONSTANT')[ 'ABSOLUTE_COMPACT_CHILDREN' ]
        var PER_GAP_WIDTH = Config.get('PER_GAP_WIDTH')
        var previousDepth = 0
        var previousRectWidth = 0
        var previousCompact = false
        var xLoc = 0
        if (thisBarcodeNodeAttrArray.length !== 0) {
          xLoc = thisBarcodeNodeAttrArray[ 0 ].x + thisBarcodeNodeAttrArray[ 0 ].width + barcodeNodeGap
        }
        for (var tI = 1; tI < thisBarcodeNodeAttrArray.length; tI++) {
          var barcodeNodeId = thisBarcodeNodeAttrArray[ tI ].id
          var compactAttr = thisBarcodeNodeAttrArray[ tI ].compactAttr
          var rectWidth = thisBarcodeNodeAttrArray[ tI ].width
          var depth = thisBarcodeNodeAttrArray[ tI ].depth
          if (compactAttr === ABSOLUTE_COMPACT_FATHER) {
            //  在两个不同层级的compact类型的节点连接起来的情况下
            if (depth < previousDepth) {
              //  增加判断上一个节点是否是compact是为了避免上一个节点是uncompact模式, 已经在xLoc上增加了值, 此时不需要继续在xLoc上增加width和gap
              if ((previousCompact) && (compactCount !== 0)) {
                xLoc = xLoc + previousRectWidth + PER_GAP_WIDTH
              }
              compactCount = 0
            }
            xLoc = +xLoc.toFixed(2)
            thisBarcodeNodeAttrArray[ tI ].x = xLoc
            //  如果该节点属于对齐的节点, 那么判断该节点是否是查过align节点的位置
            //  如果超过align节点的位置, 那么节点的位置保持不变; 如果没有超过align节点的位置, 那么需要将该节点放置到align节点的位置
            if (alignedNodeIdArray.indexOf(barcodeNodeId) !== -1) {
              if (alignedObj[ barcodeNodeId ] > thisBarcodeNodeAttrArray[ tI ].x) {
                thisBarcodeNodeAttrArray[ tI ].x = alignedObj[ barcodeNodeId ]
              }
            }
            if (selectedLevels.indexOf(depth) !== -1) {
              compactCount = compactCount + 1
              compactCount = compactCount % compactNum
              if (rectWidth !== 0) {
                if (compactCount === 0) {
                  xLoc = thisBarcodeNodeAttrArray[ tI ].x + rectWidth + PER_GAP_WIDTH
                }
                //  修改previousRectWidth和previousDepth
                previousRectWidth = rectWidth
                previousDepth = depth
                previousCompact = true
              }
            }
          } else {
            //  如果compactCount为0, 那么就不需要增加previousRectWidth, 因为已经增加过rectWidth
            if (compactCount !== 0) {
              xLoc = xLoc + previousRectWidth + PER_GAP_WIDTH
            }
            compactCount = 0
            xLoc = +xLoc.toFixed(2)
            thisBarcodeNodeAttrArray[ tI ].x = xLoc
            var rectWidth = thisBarcodeNodeAttrArray[ tI ].width
            if (selectedLevels.indexOf(depth) !== -1) {
              if (rectWidth !== 0) {
                xLoc = thisBarcodeNodeAttrArray[ tI ].x + rectWidth + PER_GAP_WIDTH
                //  修改previousRectWidth和previousDepth
                previousRectWidth = rectWidth
                previousDepth = depth
                previousCompact = false
              }
            }
          }
        }
      }
    },
    /**
     * 构建得到子树之后, 将子树的节点数组插入到model中的节点数组中
     */
    update_barcode_subtree: function (rootId, rootCategory, rootLevel, subtreeNodeArray, maxNodeNumTreeNodeLocArray, compactSuperTreeNodeLocArray, compactMaxNodeNumTreeNodeLocArray) {
      var self = this
      var subtreeNodeIdArray = []
      for (var sI = 0; sI < subtreeNodeArray.length; sI++) {
        subtreeNodeIdArray.push(subtreeNodeArray[ sI ].id)
      }
      //  alignedNodeIdArray是整个barcodeTree中对齐的节点
      var alignedNodeIdArray = self.alignedNodeIdArray
      var alignedNodeObjArray = self.alignedNodeObjArray
      //  如果子树中存在align的节点, 那么就删除掉该节点
      //  子树中存在align的节点, 即用户对齐的子树是已经对齐的子树的父亲, 所以可以将align的节点删除
      for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
        if ((subtreeNodeIdArray.indexOf(alignedNodeIdArray[ aI ]) !== -1) && (alignedNodeIdArray[ aI ] !== rootId)) {
          deleteAlignedNodeObj(alignedNodeIdArray[ aI ], alignedNodeObjArray)
          alignedNodeIdArray.splice(aI, 1)
        }
      }
      //  在barcode collection中的model中增加子树的节点
      self.each(function (barcodeModel) {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var cloneSubtreeNodeArray = JSON.parse(JSON.stringify(subtreeNodeArray))
          var cloneMaxNodeNumTreeNodeLocArray = JSON.parse(JSON.stringify(maxNodeNumTreeNodeLocArray))
          barcodeModel.update_single_barcode_subtree(rootId, rootCategory, rootLevel, cloneSubtreeNodeArray, cloneMaxNodeNumTreeNodeLocArray)
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var cloneCompactSuperTreeNodeLocArray = JSON.parse(JSON.stringify(compactSuperTreeNodeLocArray))
          var cloneCompactMaxNodeNumTreeNodeLocArray = JSON.parse(JSON.stringify(compactMaxNodeNumTreeNodeLocArray))
          barcodeModel.update_single_compact_barcode_subtree(rootId, rootCategory, rootLevel, cloneCompactSuperTreeNodeLocArray, cloneCompactMaxNodeNumTreeNodeLocArray)
        }
      })
      /**
       * @param alignedNodeId
       * @param alignedNodeObjArray
       */
      function deleteAlignedNodeObj (alignedNodeId, alignedNodeObjArray) {
        for (var aI = 0; aI < alignedNodeObjArray.length; aI++) {
          if (alignedNodeObjArray[ aI ].alignedNodeId === alignedNodeId) {
            alignedNodeObjArray.splice(aI, 1)
          }
        }
      }
    },
    updateBarcodeNodexMaxX: function () {
      var self = this
      var maxX = 0
      self.each(function (model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var locationX = findMaxX(barcodeNodeAttrArray)
        maxX = maxX > locationX ? maxX : locationX
      })
      Variables.set('barcodeNodexMaxX', maxX)
      return maxX

      function findMaxX (barcodeNodeAttrArray) {
        var maxX = 0
        for (var bI = (barcodeNodeAttrArray.length - 1); bI > 0; bI--) {
          if (barcodeNodeAttrArray[ bI ].width !== 0) {
            maxX = +barcodeNodeAttrArray[ bI ].x + +barcodeNodeAttrArray[ bI ].width
            break
          }
        }
        return maxX
      }
    },
    /**
     * 获取最大的x值
     */
    getGlobalMaxX: function (d, barcodeAlignedNodeGap) {
      function getX (barcodeNodeAttrArray) {
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[ bI ].id === rootId) {
            return barcodeNodeAttrArray[ bI ].x + barcodeAlignedNodeGap
          }
        }
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          var thisCategory = +barcodeNodeAttrArray[ bI ].category
          if ((category != NaN) && (thisCategory != NaN)) {
            if (thisCategory > category) {
              return barcodeNodeAttrArray[ bI - 1 ].x + barcodeNodeAttrArray[ bI - 1 ].width + barcodeAlignedNodeGap
            }
          }
        }
      }

      var self = this
      var maxX = 0
      var rootId = d.id
      var category = +d.category
      self.each(function (d) {
        var barcodeNodeAttrArray = d.get('barcodeNodeAttrArray')
        var locationX = getX(barcodeNodeAttrArray, category)
        maxX = maxX > locationX ? maxX : locationX
      })
      return maxX
    },
    // recover_whole_barcode_model: function () {
    //   var self = this
    //   var modelArray = []
    //   self.each(function (model) {
    //     modelArray.push(model)
    //   })
    //   modelArray.sort(function (model_a, model_b) {
    //     var nodeIndexA = model_a.get('originalBarcodeIndex')
    //     var nodeIndexB = model_b.get('originalBarcodeIndex')
    //     return nodeIndexA - nodeIndexB
    //   })
    //
    //   for (var mI = 0; mI < modelArray.length; mI++) {
    //     modelArray[ mI ].set('barcodeIndex', mI)
    //   }
    //   self.update_barcode_location()
    //   self.trigger_barcode_loc()
    // },
    sort_whole_barcode_model: function (sort_para) {
      var self = this
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var nodeValueA = 0
        var nodeValueB = 0
        if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
          nodeValueA = getNodeNumber(model_a)
          nodeValueB = getNodeNumber(model_b)
        } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
          nodeValueA = getSumValue(model_a)
          nodeValueB = getSumValue(model_b)
        }
        if (sort_para === 'asc') {
          return nodeValueA - nodeValueB
        } else if (sort_para === 'desc') {
          return nodeValueB - nodeValueA
        }
      })
      function getNodeNumber (model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var nodeNumber = 0
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if ((barcodeNodeAttrArray[ bI ].width !== 0) && (barcodeNodeAttrArray[ bI ].existed)) {
            nodeNumber = nodeNumber + 1
          }
        }
        return nodeNumber
      }

      function getSumValue (model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        return barcodeNodeAttrArray[ 0 ].num
      }

      for (var mI = 0; mI < modelArray.length; mI++) {
        modelArray[ mI ].set('barcodeIndex', mI)
      }
      self.update_barcode_location()
      self.trigger_barcode_loc()
    },
    //  对于barcode model进行排序
    sort_barcode_model: function (comparedNodeId, parameter) {
      var self = this
      self.comparedNodeId = comparedNodeId
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var nodeValueA = 0
        var nodeValueB = 0
        if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
          nodeValueA = getSubtreeNodeNum(model_a)
          nodeValueB = getSubtreeNodeNum(model_b)
        } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
          nodeValueA = getSubtreeSumValue(model_a)
          nodeValueB = getSubtreeSumValue(model_b)
        }
        if (parameter === 'asc') {
          return nodeValueA - nodeValueB
        } else if (parameter === 'desc') {
          return nodeValueB - nodeValueA
        }
      })
      function getSubtreeSumValue (model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[ bI ].id === comparedNodeId) {
            if ((barcodeNodeAttrArray[ bI ].width !== 0) && (barcodeNodeAttrArray[ bI ].existed)) {
              return barcodeNodeAttrArray[ bI ].num
            } else {
              return -1
            }
          }
        }
      }

      function getSubtreeNodeNum (model) {
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var nodeDepth = null
        var nodeCount = 0
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (nodeDepth != null) {
            if (barcodeNodeAttrArray[ bI ].depth > nodeDepth) {
              if ((barcodeNodeAttrArray[ bI ].width !== 0) && (barcodeNodeAttrArray[ bI ].existed)) {
                nodeCount = nodeCount + 1
              }
            }
            if (barcodeNodeAttrArray[ bI ].depth == nodeDepth) {
              break
            }
          }
          if (barcodeNodeAttrArray[ bI ].id === comparedNodeId) {
            nodeDepth = barcodeNodeAttrArray[ bI ].depth
            nodeCount = nodeCount + 1
          }
        }
        return nodeCount
      }

      for (var mI = 0; mI < modelArray.length; mI++) {
        modelArray[ mI ].set('barcodeIndex', mI)
      }
      self.update_barcode_location()
      self.trigger_barcode_loc()
    },
    /**
     * 将选中的barcode的model放到collection数组的第一个位置作为比较的based model
     */
    set_based_model: function (barcodeTreeId) {
      var self = this
      var basedModel = self.where({ 'barcodeTreeId': barcodeTreeId })[ 0 ]
      self.each(function (model) {
        model.set('compareBased', false)
        model.set('basedModel', basedModel)
      })
      basedModel.set('compareBased', true)
      self.basedModel = basedModel
      self.get_comparison_result(basedModel)
      var alignedRangeObjArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        alignedRangeObjArray = basedModel.get('alignedRangeObjArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        alignedRangeObjArray = basedModel.get('compactAlignedRangeObjArray')
      }
      basedModel.get('alignedRangeObjArray')
      if (alignedRangeObjArray.length !== 0) {
        self.sort_accord_similarity()
        self.trigger_color_encoding()
      } else {
        self.sort_based_as_first()
      }
      self.update_barcode_location()
      self.trigger_barcode_loc()
      self.trigger_update_summary()
    },
    change_layout_mode: function () {
      var self = this
      self.update_barcode_location()
      self.trigger_barcode_loc()
      self.trigger_update_summary()
    },
    update_barcode_model_height: function (addedBarcodeModel) {
      var self = this
      var layoutMode = Variables.get('layoutMode')
      if (layoutMode === 'UNION') {
        self.uniform_layout_height_update(addedBarcodeModel)
      } else if (layoutMode === 'FISHEYE') {
        self.fish_eye_layout_height_update(addedBarcodeModel)
      }
    },
    /**
     * 更新barcode的位置的方法, 在这个方法内对于uniform layout和fish eye layout进行统一控制
     */
    update_barcode_location: function () {
      var self = this
      var layoutMode = Variables.get('layoutMode')
      if (layoutMode === 'UNION') {
        self.uniform_layout()
      } else if (layoutMode === 'FISHEYE') {
        self.fish_eye_layout()
      }
    },
    sort_based_as_first: function () {
      var self = this
      var basedModel = self.basedModel
      basedModel.set('barcodeIndex', -1)
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var barcodeIndexA = getBarcodeIndexAttr(model_a)
        var barcodeIndexB = getBarcodeIndexAttr(model_b)
        return barcodeIndexA - barcodeIndexB
      })
      for (var mI = 0; mI < modelArray.length; mI++) {
        modelArray[ mI ].set('barcodeIndex', mI)
      }
      function getBarcodeIndexAttr (model) {
        var barcodeIndex = model.get('barcodeIndex')
        return barcodeIndex
      }
    },
    sort_accord_similarity: function () {
      var self = this
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var nodeDifferenceA = getNodeDifference(model_a)
        var nodeDifferenceB = getNodeDifference(model_b)
        return nodeDifferenceA - nodeDifferenceB
      })
      for (var mI = 0; mI < modelArray.length; mI++) {
        var barcodeTreeId = modelArray[ mI ].get('barcodeTreeId')
        var encodedColor = self.get_color_accord_similarity(mI)
        modelArray[ mI ].set('barcodeIndex', mI)
        modelArray[ mI ].set('barcodeRectBgColor', encodedColor)
      }
      //  有的情况下basedTree没有排在最上方, 所以需要增加一个sort_based_as_first排序
      self.sort_based_as_first()
      function getNodeDifference (model) {
        var alignedComparisonResultArray = model.get('alignedComparisonResultArray')
        var nodeDifference = 0
        if (alignedComparisonResultArray != null) {
          for (var aI = 0; aI < alignedComparisonResultArray.length; aI++) {
            var alignedComparisonResultObj = alignedComparisonResultArray[ aI ]
            var addedNodeIdArray = alignedComparisonResultObj.addedNodeIdArray
            var missedNodeIdArray = alignedComparisonResultObj.missedNodeIdArray
            nodeDifference = nodeDifference + addedNodeIdArray.length + missedNodeIdArray.length
          }
        }
        return nodeDifference
      }
    },
    /**
     * 在histogram视图中更新颜色按照相似度进行编码
     */
    trigger_color_encoding: function () {
      var self = this
      var colorEncodingObj = {}
      self.each(function (model) {
        var barcodeIndex = model.get('barcodeIndex')
        var barcodeTreeId = model.get('barcodeTreeId')
        var encodedColor = self.get_color_accord_similarity(barcodeIndex)
        if (!model.get('compareBased')) {
          colorEncodingObj[ barcodeTreeId ] = encodedColor
        }
      })
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_HISTOGRAM_ENCODE' ], {
        colorEncodingObj: colorEncodingObj
      })
    },
    /**
     * 在histogram视图中更新颜色按照还原之前的编码方式
     */
    trigger_null_color_encoding: function () {
      var self = this
      var colorEncodingObj = {}
      self.each(function (model) {
        var barcodeIndex = model.get('barcodeIndex')
        var barcodeTreeId = model.get('barcodeTreeId')
        colorEncodingObj[ barcodeTreeId ] = null
      })
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_HISTOGRAM_ENCODE' ], {
        colorEncodingObj: colorEncodingObj
      })
    },
    get_color_accord_similarity: function (barcodeIndex) {
      var mostSimilarity = d3.rgb(158, 202, 225)
      var lessSimilarity = d3.rgb(255, 255, 255)
      var colorCompute = d3.interpolate(mostSimilarity, lessSimilarity)
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var colorLinear = d3.scale.linear()
        .domain([ 0, selectItemNameArray.length - 1 ])
        .range([ 0, 1 ])
      return colorCompute(colorLinear(barcodeIndex))
    },
    /**
     *
     */
    unset_based_model: function () {
      var self = this
      self.each(function (model) {
        model.set('compareBased', false)
        model.set('basedModel', null)
        model.set('alignedComparisonResultArray', null)
        model.set('barcodeRectBgColor', null)
      })
      self.basedModel = null
      self.reset_select_sequence()
      self.update_barcode_location()
      self.trigger_null_color_encoding()
      self.trigger_barcode_loc()
      self.trigger_update_summary()
    },
    /**
     * 恢复按照barcode选择顺序进行排序的状态
     */
    reset_select_sequence: function () {
      var self = this
      var selectItemNameArray = Variables.get('selectItemNameArray')
      self.each(function (model) {
        var barcodeTreeId = model.get('barcodeTreeId')
        var barcodeIndex = +selectItemNameArray.indexOf(barcodeTreeId)
        model.set('barcodeIndex', barcodeIndex)
      })
    },
    /**
     * 获得barcode比较的结果
     */
    get_comparison_result: function () {
      var self = this
      self.each(function (model) {
        model.get_single_comparison_result()
      })
    },
    /**
     * 按照paddingnode的长度进行barcode的排序
     * @param coverRectIndex
     */
    sort_cover_rect_barcode_model: function (coverRectIndex, parameter) {
      var self = this
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var nodeNumberA = getNodeNumber(model_a, coverRectIndex)
        var nodeNumberB = getNodeNumber(model_b, coverRectIndex)
        if (parameter === 'asc')
          return nodeNumberA - nodeNumberB
        return nodeNumberB - nodeNumberA
      })
      for (var mI = 0; mI < modelArray.length; mI++) {
        var barcodeTreeId = modelArray[ mI ].get('barcodeTreeId')
        modelArray[ mI ].set('barcodeIndex', mI)
      }
      self.update_barcode_location()
      self.trigger_barcode_loc()
      function getNodeNumber (model, coverRectIndex) {
        var paddingNodeObjArray = model.get('paddingNodeObjArray')
        var barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        var paddingNodeStartIndex = paddingNodeObjArray[ coverRectIndex ].paddingNodeStartIndex
        var paddingNodeEndIndex = paddingNodeObjArray[ coverRectIndex ].paddingNodeEndIndex
        var nodeValue = 0
        if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
          nodeValue = self.get_node_number(paddingNodeStartIndex, paddingNodeEndIndex, barcodeNodeAttrArray)
        } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
          nodeValue = self.get_sum_attr_value(paddingNodeStartIndex, paddingNodeEndIndex, barcodeNodeAttrArray)
        }
        return nodeValue
      }
    },
    /**
     *  按照原始选择的顺序对于barcode进行排序
     */
    recover_barcode_model_sequence: function () {
      var self = this
      var modelArray = []
      self.each(function (model) {
        modelArray.push(model)
      })
      modelArray.sort(function (model_a, model_b) {
        var nodeIndexA = model_a.get('originalBarcodeIndex')
        var nodeIndexB = model_b.get('originalBarcodeIndex')
        return nodeIndexA - nodeIndexB
      })

      for (var mI = 0; mI < modelArray.length; mI++) {
        modelArray[ mI ].set('barcodeIndex', mI)
      }
      self.update_barcode_location()
      self.trigger_barcode_loc()
    },
    /**
     * 计算某个范围内, 在某些层级上的节点数量
     */
    get_node_number: function (rangeStart, rangeEnd, barcodeNodeAttrArray) {
      var self = this
      var nodeNumber = 0
      var currentLevel = Variables.get('currentLevel')
      for (var bI = rangeStart; bI <= rangeEnd; bI++) {
        if ((barcodeNodeAttrArray[ bI ].existed) && (barcodeNodeAttrArray[ bI ].depth < currentLevel)) {
          nodeNumber = nodeNumber + 1
        }
      }
      return nodeNumber
    },
    get_sum_attr_value: function (rangeStart, rangeEnd, barcodeNodeAttrArray) {
      var self = this
      var sumValue = 0
      var maxDepth = Variables.get('maxDepth')
      for (var bI = rangeStart; bI <= rangeEnd; bI++) {
        if (barcodeNodeAttrArray[ bI ].existed) {
          if (barcodeNodeAttrArray[ bI ].depth === maxDepth) {
            sumValue = sumValue + barcodeNodeAttrArray[ bI ].num
          }
        }
      }
      return sumValue
    },
    get_barcode_nodex_max: function () {
      var self = this
      var maxNodeX = 0
      var barcodePaddingLeft = Variables.get('barcodePadding')
      var barcodePaddingRight = Variables.get('barcodePadding')
      var originalBarcodetreeViewWidth = +$('#barcodetree-scrollpanel').width()
      self.each(function (model) {
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = model.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = model.get('compactBarcodeNodeAttrArray')
        }
        var nodeX = barcodePaddingLeft + barcodeNodeAttrArray[ barcodeNodeAttrArray.length - 1 ].x + barcodeNodeAttrArray[ barcodeNodeAttrArray.length - 1 ].width + barcodePaddingRight
        maxNodeX = maxNodeX > nodeX ? maxNodeX : nodeX
      })
      maxNodeX = maxNodeX > originalBarcodetreeViewWidth ? maxNodeX : originalBarcodetreeViewWidth
      return maxNodeX
    },
    update_subtreenode_location: function () {
      var self = this
      var subtreeNodeArrayObj = self.subtreeNodeArrayObj
      for (var rootId in subtreeNodeArrayObj) {
        self.each(function (barcodeModel) {
          var rootX = barcodeModel.get_node_location(rootId)
          if (rootX != null) {
            subtreeNodeArrayObj[ rootId ].locationX = rootX
          }
          if (rootX != null) {
            self.trigger_render_supertree(subtreeNodeArrayObj)
            return
          }
        })
      }
    },
    align_added_model: function () {
      var self = this
      var alignedNodeIdArray = self.alignedNodeIdArray
      var deferredsArray = []
      for (var aI = (alignedNodeIdArray.length - 1); aI >= 0; aI--) {
        // for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
        var deferObj = $.Deferred()
        var alignedNodeId = alignedNodeIdArray[ aI ]
        var alignedObj = get_aligned_obj(alignedNodeId)
        var barcodeAlignedNodeGap = Config.get('BARCODE_ALIGNED_NODE_GAP')
        var alignedNodeLevel = alignedObj.depth
        var alignedNodeCategory = alignedObj.category
        var alignedNodeMaxX = self.getGlobalMaxX(alignedObj, barcodeAlignedNodeGap)
        // var rootAttrObj = get_root_attr(alignedNodeId)
        var selectedItemsArray = Variables.get('selectItemNameArray')
        var url = 'build_super_tree'
        window.Datacenter.buildSuperTree(url, selectedItemsArray, alignedNodeId, alignedNodeLevel, alignedNodeCategory, alignedNodeMaxX, deferObj)
        deferredsArray.push(deferObj)
      }
      // update view
      $.when.apply(null, deferredsArray).done(function () {
        Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW_WIDTH' ])
        Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW' ])
      })

      function get_aligned_obj (alignedNodeId) {
        var barcodeModel = self.at(0)
        var barcodeNodeAttrArray = barcodeModel.get('barcodeNodeAttrArray')
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[ bI ].id === alignedNodeId) {
            return barcodeNodeAttrArray[ bI ]
          }
        }
      }

      function get_root_attr (alignedNodeId) {
        var alignedNodeLevel = null
        var alignedNodeCategory = null
        var alignedNodeMaxX = 0
        var alignedNodeArray = alignedNodeId.split('-')
        var r = /^[0-9]+$/
        var nodeCategory = alignedNodeArray[ 2 ]
        if (r.test(nodeCategory)) {
          nodeCategory = +nodeCategory
        } else {
          nodeCategory = NaN
        }
        self.each(function (barcodeModel) {
          var barcodeNodeAttrArray = barcodeModel.get('barcodeNodeAttrArray')
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            alignedNodeCategory = barcodeNodeAttrArray[ bI ].category
            var thisBarcodeNodeX = barcodeNodeAttrArray[ bI ].x
            if (barcodeNodeAttrArray[ bI ].id === alignedNodeId) {
              alignedNodeLevel = barcodeNodeAttrArray[ bI ].depth
              if (alignedNodeMaxX < thisBarcodeNodeX) {
                alignedNodeMaxX = thisBarcodeNodeX
              }
              break
            }
            // var thisCategory = +barcodeNodeAttrArray[ bI ].category
            // if ((nodeCategory != NaN) && (thisCategory != NaN)) {
            //   if (thisCategory > nodeCategory) {
            //     if (alignedNodeMaxX < thisBarcodeNodeX) {
            //       alignedNodeMaxX = barcodeNodeAttrArray[ bI ].x
            //     }
            //     break
            //   }
            // }
          }
        })
        var rootAttr = {}
        rootAttr.alignedNodeLevel = alignedNodeLevel
        rootAttr.alignedNodeCategory = alignedNodeCategory
        rootAttr.alignedNodeMaxX = alignedNodeMaxX
        return rootAttr
      }
    },
    /**
     * 在向barcode collection中增加了barcode model之后更新barcode view视图
     */
    trigger_barcode_view_render_update: function () {
      var self = this
      self.trigger_barcode_loc()
      self.trigger_barcode_view_width()
    },
    trigger_render_supertree: function (subtreeNodeArrayObj) {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')[ 'RENDER_SUPERTREE' ])
    },
    /**
     * trigger 更新barcode位置的信号, 在barcode single view中进行更新
     * @param comparedNodeId
     */
    trigger_barcode_loc: function () {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_LOC' ])
    },
    /**
     * trigger信号 更新barcodeview的宽度
     */
    trigger_barcode_view_width: function () {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW_WIDTH' ])
    },
    /**
     *  trigger 更新barcode的summary的信号, 在barcode single view中进行更新
     */
    trigger_update_summary: function () {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_SUMMARY' ])
    },
    clear_barcode_dataset: function () {
      var self = this
      self.reset()
      Backbone.Events.trigger(Config.get('EVENTS')[ 'RESET_BARCODE_ATTR' ])
    },
    update_covered_rect_obj: function () {
      var self = this
      self.each(function (model) {
        model.update_covered_rect_obj(self.alignedNodeIdArray)
      })
    }
  })
})
