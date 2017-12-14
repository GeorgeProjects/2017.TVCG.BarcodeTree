define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'variables',
  'config'
], function (require, Mn, _, Backbone, Variables, Config) {
  'use strict'

  return Backbone.Model.extend({
    defaults: {
      //****************************
      'sumAttributeValue': 0,
      //****************************
      'ALIGN_START': 'aligned-start',
      'ALIGN_RANGE': 'aligned-range',
      'PADDING_RANGE': 'padding-range',
      //  标志barcodeTree的id, 在barcodeTreeComparison视图与histogram视图中都会使用这个id
      'barcodeTreeId': 'barcode-tree-1',
      //  barcodeTree上面每个节点的信息: 节点的id, 节点的位置, 每个节点的书目名称, 每个节点上书的数量, ......
      'barcodeNodeAttrArray': [],
      //  对齐的barcode节点的数组信息
      'alignedBarcodeNodeAttrArray': [],
      //  compact的barcode节点数组
      'compactBarcodeNodeAttrArray': [],
      //  全部的barcode节点数组
      'categoryNodeObjArray': [],
      //  对齐的compact的barcode节点数组
      'compactAlignedBarcodeNodeAttrArray': [],
      //  对齐的节点的对象的信息
      'alignedBarcodeNodeAttrObj': {},
      //  compact模式下的对齐节点的对象的信息
      'compactAlignedBarcodeNodeAttrObj': {},
      //  标志barcodeTree的位置
      'barcodeTreeYLocation': 0,
      //  标志barcodeTree的index值,用于决定barcode背后的rect的颜色
      'barcodeIndex': 0,
      //  用于恢复原始顺序的originalBarcodeIndex
      'originalBarcodeIndex': 0,
      //  标志barcodeTree的节点高度值
      'barcodeNodeHeight': 0,
      //  对齐的节点数组
      'coveredRectObjArray': [],
      //  在barcodeNodeAttrArray中对齐的节点数组
      'alignedRangeObjArray': [],
      //  在alignedBarcodeNodeAttrArray中对齐的节点数组
      '_alignedRangeObjArray': [],
      //  在compactBarcodeNodeAttrArray中能够对齐的节点数组
      'compactAlignedRangeObjArray': [],
      //  在barcodeNodeAttrArray中节点填充的数组
      'paddingNodeObjArray': [],
      //  在alignedBarcodeNodeAttrArray中节点填充的数组
      '_paddingNodeObjArray': [],
      //  在compactBarcodeNoeAttrArray中padding部分的节点数组
      'compactPaddingNodeObjArray': [],
      //  在alignedBarcodeNodeAttrArray中节点填充的数组
      '_compactPaddingNodeObjArray': [],
      //  判断barcode视图中的高度与位置是否被更新的变量
      'viewHeightUpdateValue': 0,
      //  视图的选择状态是否更新的变量
      'viewUpdateSelectionState': 0,
      //  判断视图是否被更新的变量
      'viewUpdateValue': 0,
      //  判断选择的节点的是否更新的变量
      'selectionUpdateValue': 0,
      //  判断视图是否多种类型的节点同时更新的变量
      'viewUpdateConcurrentValue': 0,
      //  判断barcode先移动, 在增加padding节点的变量
      'moveFirstPaddingNextUpdateValue': 0,
      //  当前的barcode是否是compare-based
      'compareBased': false,
      //  当前的barcodeModel是否被筛选
      'filterState': false,
      //  被比较的model
      'basedModel': null,
      //  对齐部分的比较结果
      'alignedComparisonResultArray': null,
      //  barcode的背景
      'barcodeRectBgColor': null,
      //  单个barcode的显示模式
      'displayMode': Variables.get('displayMode')
    },
    initialize: function () {
      var self = this
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        barcodeNodeAttrArray[bI].existed = true
      }
      self.set('coveredRectObjArray', [])
    },
    reset_node_obj_array: function () {
      var self = this
      self.coveredRectObjArray = []
      self.alignedRangeObjArray = []
      self._alignedRangeObjArray = []
      self.compactAlignedRangeObjArray = []
      self.paddingNodeObjArray = []
      self._paddingNodeObjArray = []
      self.compactPaddingNodeObjArray = []
      self._compactPaddingNodeObjArray = []
    },
    update_height: function () {
      // var self = this
      // self.barcodeNodeHeight = window.barcodeHeight
      // var barcodeTreeId = self.get('barcodeTreeId')
      // var barcodeIndex = self.get('barcodeIndex')
      // self.set('barcodeNodeHeight', window.barcodeHeight)
      // var barcodeTreeYLocation = self.barcodeNodeHeight * barcodeIndex + barcodeIndex
      // self.set('barcodeTreeYLocation', barcodeTreeYLocation)
    },
    update_sort_after_loc: function () {
      var self = this
      self.barcodeNodeHeight = window.barcodeHeight
      // var barcodeIndex = self.get('barcodeIndex')
      // var barcodeTreeYLocation = self.barcodeNodeHeight * barcodeIndex + barcodeIndex
      // self.set('barcodeTreeYLocation', barcodeTreeYLocation)
    },
    reset_attribute: function () {
      var self = this
      self.set('alignedBarcodeNodeAttrObj', {})
      self.set('compactAlignedBarcodeNodeAttrObj', {})
      self.set('coveredRectObjArray', [])
      self.set('alignedRangeObjArray', [])
      self.set('_alignedRangeObjArray', [])
      self.set('compactAlignedRangeObjArray', [])
      self.set('paddingNodeObjArray', [])
      self.set('_paddingNodeObjArray', [])
      self.set('compactPaddingNodeObjArray', [])
      self.set('_compactPaddingNodeObjArray', [])
      d3.selectAll('.stat-summary').remove()
    },
    //  获取barcodeTree的显示模式
    get_barcode_tree_display_mode: function () {
      var self = this
      var barcodeTreeIsLocked = Variables.get('barcodeTreeIsLocked')
      var currentDisplayMode = null
      if (barcodeTreeIsLocked) {
        //  如果displaymode是全局控制
        currentDisplayMode = Variables.get('displayMode')
      } else {
        //  如果displaymode是不是全局控制
        currentDisplayMode = self.get('displayMode')
      }
      return currentDisplayMode
    },
    //  获取当前使用的barcode节点数组
    get_barcode_node_array: function () {
      var self = this
      var barcodeNodeAttrArray = null
      var currentDisplayMode = self.get_barcode_tree_display_mode()
      if (currentDisplayMode === Config.get('CONSTANT').ORIGINAL) {
        barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      } else if (currentDisplayMode === Config.get('CONSTANT').COMPACT) {
        barcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      } else if (currentDisplayMode === Config.get('CONSTANT').GLOBAL) {
        barcodeNodeAttrArray = self.get('categoryNodeObjArray')
      }
      return barcodeNodeAttrArray
    },
    //  根据node的id获取node的index
    get_node_index: function (nodeId) {
      var self = this
      var barcodeNodeAttrArray = self.get_barcode_node_array()
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if (barcodeNodeAttrArray[bI].id === nodeId) {
          return bI
        }
      }
    },
    //  获取节点的sibling节点
    find_sibling_nodes: function (nodeObj) {
      var self = this
      var treeDataModel = self.model
      var nodeIndex = self.get_node_index(nodeObj.id)
      var barcodeNodeAttrArray = self.get_barcode_node_array()
      var siblingNodesArray = []
      var nodeDepth = nodeObj.depth
      //  向后遍历
      for (var nI = (nodeIndex - 1); nI > 0; nI--) {
        if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
          if (barcodeNodeAttrArray[nI].existed) {
            siblingNodesArray.push(barcodeNodeAttrArray[nI])
          }
        }
        if (barcodeNodeAttrArray[nI].depth < nodeDepth) {
          break
        }
      }
      //  向前遍历
      for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
        if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
          if (barcodeNodeAttrArray[nI].existed) {
            siblingNodesArray.push(barcodeNodeAttrArray[nI])
          }
        }
        if (barcodeNodeAttrArray[nI].depth < nodeDepth) {
          break
        }
      }
      return siblingNodesArray
    },
    //  获取节点的children节点
    find_children_nodes: function (nodeObj) {
      var self = this
      var nodeIndex = self.get_node_index(nodeObj.id)
      var barcodeNodeAttrArray = self.get_barcode_node_array()
      var childrenNodesArray = []
      var nodeDepth = nodeObj.depth
      for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
        if (barcodeNodeAttrArray[nI].depth > nodeDepth) {
          if (barcodeNodeAttrArray[nI].existed) {
            childrenNodesArray.push(barcodeNodeAttrArray[nI])
          }
        }
        if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
          break
        }
      }
      // self.highlightChildrenNodes(childrenNodesArray)
      return childrenNodesArray
    },
    //  寻找父亲以及当前节点
    find_father_current_nodes: function (nodeObj) {
      var self = this
      var nodeIndex = self.get_node_index(nodeObj.id)
      var barcodeNodeAttrArray = self.get_barcode_node_array()
      var fatherNodesArray = []
      var nodeDepth = nodeObj.depth
      for (var nI = nodeIndex; nI >= 0; nI--) {
        if (barcodeNodeAttrArray[nI].depth === nodeDepth) {
          if (barcodeNodeAttrArray[nI].existed) {
            fatherNodesArray.push(barcodeNodeAttrArray[nI])
          }
          nodeDepth = nodeDepth - 1
        }
      }
      return fatherNodesArray
    },
    //  根据已知的节点的属性, 寻找所有与这个节点相关的节点的属性
    find_related_nodes: function (nodeObj) {
      var self = this
      var findingNodesObj = {}
      findingNodesObj.childrenNodes = self.find_children_nodes(nodeObj)
      findingNodesObj.fatherCurrentNodes = self.find_father_current_nodes(nodeObj)
      findingNodesObj.siblingNodes = self.find_sibling_nodes(nodeObj)
      return findingNodesObj
    },
    change_barcode_attr_array: function () {
      var self = this
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      change_single_attr_array(barcodeNodeAttrArray)
      var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
      change_single_attr_array(alignedBarcodeNodeAttrArray)
      var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      change_single_attr_array(compactBarcodeNodeAttrArray)

      function change_single_attr_array(nodeAttrArray) {
        var barcodeNodeInterval_previous = Variables.get('barcodeNodeInterval_previous')
        var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
        var barcodeWidthArray = Variables.get('barcodeWidthArray')
        var barcodeWidthArray_previous = Variables.get('barcodeWidthArray_previous')
        //  首先保存先前状态的x坐标
        for (var nI = 0; nI < nodeAttrArray.length; nI++) {
          nodeAttrArray[nI].previousX = nodeAttrArray[nI].x
        }
        for (var nI = 0; nI < nodeAttrArray.length; nI++) {
          var depth = nodeAttrArray[nI].depth
          var previousWidth = barcodeWidthArray_previous[depth]
          var currentWidth = barcodeWidthArray[depth]
          nodeAttrArray[nI].width = barcodeWidthArray[depth]
          if ((nI + 1) < nodeAttrArray.length) {
            var currentNodePreviousX = nodeAttrArray[nI].previousX
            var nextNodexPreviousX = nodeAttrArray[nI + 1].previousX
            if (currentNodePreviousX === nextNodexPreviousX) {
              //  当barcode节点之间的间距为0, 那么现在的间距仍然需要为0
              nodeAttrArray[nI + 1].x = nodeAttrArray[nI].x
            } else if (((barcodeNodeInterval_previous + currentNodePreviousX + previousWidth) === nextNodexPreviousX) ||
              ((barcodeNodeInterval + currentNodePreviousX + previousWidth) === nextNodexPreviousX) ||
              ((barcodeNodeInterval_previous + currentNodePreviousX + currentWidth) === nextNodexPreviousX) ||
              (((barcodeNodeInterval + currentNodePreviousX + currentWidth) === nextNodexPreviousX))) {
              //  不知道在调用改变barcode的attr之前改变的是barcode的什么属性, 所以在满足interval和width的条件的情况下都需要重新计算barcode节点的位置
              //  如果barcode之前的间距为interval, 那么需要根据现在的变化进行改变
              nodeAttrArray[nI + 1].x = nodeAttrArray[nI].x + nodeAttrArray[nI].width + barcodeNodeInterval
            } else {
              //  当barcode节点之间间距不是interval, 可能是增加的统计柱状图, 那么仍然要维持现在的间距
              //  其实可以和第一个判断条件相结合得到一个统一的判断
              nodeAttrArray[nI + 1].x = nodeAttrArray[nI].x + (nextNodexPreviousX - currentNodePreviousX)
            }
          }
        }
      }
    },
    //  点击节点使得节点所在的子树被uncollapse所调用的方法
    uncollapse_subtree: function (nodeDataId, nodeDataDepth) {
      var self = this
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      uncollapse_subtree_location(barcodeNodeAttrArray, nodeDataId, nodeDataDepth)
      var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
      uncollapse_subtree_location(alignedBarcodeNodeAttrArray, nodeDataId, nodeDataDepth)
      var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      uncollapse_subtree_location(compactBarcodeNodeAttrArray, nodeDataId, nodeDataDepth)

      function uncollapse_subtree_location(nodeAttrArray, nodeDataId, nodeDataDepth) {
        var collapsedRootNodeIndex = 0
        var collapsedNextRootNodeIndex = 0
        var barcodeWidthArray = Variables.get('barcodeWidthArray')
        var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
        var foundClickedNode = false
        if (nodeAttrArray.length === 0) {
          return
        }
        //  第一段寻找点击的node节点的index值
        for (var nI = 0; nI < nodeAttrArray.length; nI++) {
          if ((nodeAttrArray[nI].id === nodeDataId) && (nodeAttrArray[nI].depth === nodeDataDepth)) {
            collapsedRootNodeIndex = nI
            foundClickedNode = true
            break
          }
        }
        if (!foundClickedNode)
          return
        //  第二段依次伸展
        for (var nI = (collapsedRootNodeIndex + 1); nI < nodeAttrArray.length; nI++) {
          if (nodeAttrArray[nI].depth === nodeDataDepth) {
            collapsedNextRootNodeIndex = nI
            break
          }
          if (nodeAttrArray[nI - 1].width !== 0) {
            nodeAttrArray[nI].x = nodeAttrArray[nI - 1].x + nodeAttrArray[nI - 1].width + barcodeNodeInterval
          } else {
            nodeAttrArray[nI].x = nodeAttrArray[nI - 1].x
          }
          var depth = nodeAttrArray[nI].depth
          nodeAttrArray[nI].width = barcodeWidthArray[depth]
        }
        //  第三段开始
        //  首先从collapsedNextRootNodeIndex节点向前依次找到width不为0的节点
        var collapsedNextRootIndexBefore = 0
        for (var nI = collapsedNextRootNodeIndex - 1; nI >= 0; nI--) {
          if (nodeAttrArray[nI].width !== 0) {
            collapsedNextRootIndexBefore = nI
            break
          }
        }
        //  第三段依次进行变化
        var currentNodeX = nodeAttrArray[collapsedNextRootIndexBefore].x + nodeAttrArray[collapsedNextRootIndexBefore].width + barcodeNodeInterval
        var differenceX = currentNodeX - nodeAttrArray[collapsedNextRootNodeIndex].x
        if (collapsedNextRootNodeIndex === 0) {
          differenceX = 0
        }
        for (var nI = collapsedNextRootNodeIndex; nI < nodeAttrArray.length; nI++) {
          nodeAttrArray[nI].x = nodeAttrArray[nI].x + differenceX
        }
      }
    },
    //  点击节点使得其为根节点所在的子树被折叠
    collapse_subtree: function (nodeDataId, nodeDataDepth) {
      var self = this
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      collapse_change_location(barcodeNodeAttrArray, nodeDataId, nodeDataDepth)
      var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
      collapse_change_location(alignedBarcodeNodeAttrArray, nodeDataId, nodeDataDepth)
      var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      collapse_change_location(compactBarcodeNodeAttrArray, nodeDataId, nodeDataDepth)

      function collapse_change_location(nodeAttrArray, nodeDataId, nodeDataDepth) {
        var collapsedRootNodeIndex = 0
        var collapsedNextRootNodeIndex = 0
        var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
        var foundClickedNode = false
        if (nodeAttrArray.length === 0) {
          return
        }
        //  第一段寻找点击的node节点的index值
        for (var nI = 0; nI < nodeAttrArray.length; nI++) {
          if ((nodeAttrArray[nI].id === nodeDataId) && (nodeAttrArray[nI].depth === nodeDataDepth)) {
            collapsedRootNodeIndex = nI
            foundClickedNode = true
            break
          }
        }
        if (!foundClickedNode)
          return
        //  第二段依次缩进
        for (var nI = (collapsedRootNodeIndex + 1); nI < nodeAttrArray.length; nI++) {
          if (nodeAttrArray[nI].depth === nodeDataDepth) {
            collapsedNextRootNodeIndex = nI
            break
          }
          nodeAttrArray[nI].x = nodeAttrArray[collapsedRootNodeIndex].x
          nodeAttrArray[nI].width = 0
        }
        //  第三段依次进行变化
        var currentNodeX = nodeAttrArray[collapsedRootNodeIndex].x + nodeAttrArray[collapsedRootNodeIndex].width + barcodeNodeInterval
        var differenceX = currentNodeX - nodeAttrArray[collapsedNextRootNodeIndex].x
        if (collapsedRootNodeIndex === 0) {
          differenceX = 0
        }
        console.log('differenceX', differenceX)
        for (var nI = collapsedNextRootNodeIndex; nI < nodeAttrArray.length; nI++) {
          nodeAttrArray[nI].x = nodeAttrArray[nI].x + differenceX
        }
      }
    },
    /**
     * 更新对齐部分的后续节点
     */
    update_align_followed_node: function () {
      var self = this
      //  对于原始类型的节点进行改变
      var alignedRangeObjArray = self.get('alignedRangeObjArray')
      var paddingNodeObjArray = self.get('paddingNodeObjArray')
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      // console.log('before', JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
      // console.log('after', JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
      var _alignedRangeObjArray = self.get('_alignedRangeObjArray')
      var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
      //  对于compact类型的节点进行改变
      var compactAlignedRangeObjArray = self.get('compactAlignedRangeObjArray')
      var compactPaddingNodeObjArray = self.get('compactPaddingNodeObjArray')
      var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      // console.log('before', JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
      // console.log('after', JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
      var _compactAlignedRangeObjArray = self.get('_alignedRangeObjArray')
      var compactAlignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')

      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        inner_update_align_followed_node(alignedRangeObjArray, paddingNodeObjArray, barcodeNodeAttrArray)
        inner_update_align_followed_node(_alignedRangeObjArray, paddingNodeObjArray, alignedBarcodeNodeAttrArray)
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        // inner_update_align_followed_node(compactAlignedRangeObjArray, compactPaddingNodeObjArray, compactBarcodeNodeAttrArray)
        // inner_update_align_followed_node(_compactAlignedRangeObjArray, compactPaddingNodeObjArray, compactAlignedBarcodeNodeAttrArray)
      }
      /**
       * inner_update_align_followed_node - 移动在对齐节点之后节点
       * @param alignedRangeObjArray - 记录alignRange对象的数组
       * @param barcodeNodeAttrArray - 记录barcode节点属性对象的数组
       */
      function inner_update_align_followed_node(alignedRangeObjArray, paddingNodeObjArray, barcodeNodeAttrArray) {
        var barcodeNodeGap = Variables.get('barcodeNodeInterval')
        var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
        //  比较结果summary所占的宽度
        var comparisonResultPadding = Config.get('COMPARISON_RESULT_PADDING')
        // for (var aI = (alignedRangeObjArray.length - 1); aI >= 0; aI--) {
        for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
          var rangeStartIndex = alignedRangeObjArray[aI].rangeStartNodeIndex
          //  对于每一个align的节点, 对应的陆续移动其后续节点
          aligned_followed_node(barcodeNodeAttrArray, rangeStartIndex, alignedRangeObjArray, paddingNodeObjArray)
        }
        /**
         * aligned_followed_node - 对齐后续节点的方法是找到一个平移的距离值。
         * align之后存在一个之前的x值以及移动之后移动到的x值, 我们不能直接按照barcode的序列依次相加计算得到barcode中节点的位置, 因为在其中存在各种各样的情况, 将所有情况记录下来的方法过于复杂, 因此我们采用的是将
         * @param barcodeNodeAttrArray - 记录barcode节点属性对象的数组
         * @param rangeStartIndex - 对齐对象的startIndex属性
         * @param alignedRangeObjArray - 对齐对象的数组
         */
        function aligned_followed_node(barcodeNodeAttrArray, rangeStartIndex, alignedRangeObjArray, paddingNodeObjArray) {
          var barcodeNode = barcodeNodeAttrArray[rangeStartIndex]
          var rangeAlignedNodeId = barcodeNodeAttrArray[rangeStartIndex].id
          //  根据align节点的id判断当前focus的子树是否是在比较节点数目的状态
          var nodeNumComparisonState = window.Datacenter.barcodeCollection.get_node_num_comparison_state(rangeAlignedNodeId)
          var barcodeNodeSubtreeWidth = barcodeNode.subtreeWidth
          //  如果处在比较节点数目的状态, 那么就是用其subtree在比较节点数目状态时的长度
          if (nodeNumComparisonState) {
            var barcodeNodeSubtreeWidth = barcodeNode.alignedSubtreeWidth//barcodeNode.subtreeWidth
          }
          var nextAlignedIndex = null
          var movedX = 0
          //  nextAlignedIndex的含义是在这个index处, 所有的barcodeTree的相应节点的x值是相同的
          for (var bI = (rangeStartIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
            if (barcodeNodeAttrArray[bI].depth === barcodeNode.depth) {
              nextAlignedIndex = bI
              break
            }
          }
          //  如果当前的align节点是最开始的部分, 那么就不进行移动
          if (rangeStartIndex === 0) {
            nextAlignedIndex = 0
            movedX = 0
          } else {
            if (typeof (barcodeNodeAttrArray[nextAlignedIndex]) !== 'undefined') {
              var previousX = barcodeNodeAttrArray[nextAlignedIndex].x
              if (isAlignedNodeStartIndex(alignedRangeObjArray, nextAlignedIndex)) {//  判断下面的一个节点是否是对齐的aligned部分的第一个节点
                /**
                 * nextAlignedIndex指的是后面的一个所有的barcodeTree具有相同x位置的节点
                 * 对于每一个align的barcode片段计算其后面的barcode节点的位置:
                 * 对于某一个align节点而言, 如果其后面是另一个align节点, 那么表示遇到了padding节点所代表的节点数量为空的情况, 在该情况下,
                 * 从align的barcode节点到另外一个align的barcode节点, 相隔的有barcodeNode.subtreeWidth, barcodeNodeGap, comparisonResultPadding,并且根据paddingObj是否compact增加其宽度
                 */
                var paddingNodeObj = findBeforePaddingNode(nextAlignedIndex, paddingNodeObjArray) //  根据这个align节点的第一个节点的index找到其前面的padding节点
                // previousX = previousX - comparisonResultPadding - barcodeNodeGap - barcodeNodePadding
                if (paddingNodeObj == null) { // 如果没有返回信息,说明这种情况下是BarcodeTree的align部分后面空一部分, 然后紧接着align的部分
                  barcodeNodeAttrArray[nextAlignedIndex].x = barcodeNode.x + barcodeNodeSubtreeWidth + barcodeNodeGap + comparisonResultPadding //+ paddingNodeObj.realCompressPaddingNodeWidth// (modify) barcodeNodePadding //+ barcodeNodePadding//+
                } else {
                  if (paddingNodeObj.isCompact) {
                    barcodeNodeAttrArray[nextAlignedIndex].x = barcodeNode.x + barcodeNodeSubtreeWidth + barcodeNodeGap + comparisonResultPadding + paddingNodeObj.realCompressPaddingNodeWidth // (modify) barcodeNodePadding //+ barcodeNodePadding//+
                  } else {
                    barcodeNodeAttrArray[nextAlignedIndex].x = barcodeNode.x + barcodeNodeSubtreeWidth + barcodeNodeGap + comparisonResultPadding + paddingNodeObj.maxPaddingNodeLength
                  }
                }
                movedX = barcodeNodeAttrArray[nextAlignedIndex].x - previousX
              } else {
                barcodeNodeAttrArray[nextAlignedIndex].x = barcodeNode.x + barcodeNodeSubtreeWidth + barcodeNodeGap
                movedX = barcodeNodeAttrArray[nextAlignedIndex].x - previousX
              }
            } else {
              movedX = 0
            }
          }

          if ((nextAlignedIndex != null)) {//&& !(isAlignedNodeStartIndex(alignedRangeObjArray, nextAlignedIndex))
            for (var bI = (nextAlignedIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
              barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI].x + movedX
            }
          }
        }
      }

      /**
       * 已知某一个aling的节点的前面是一个padding节点, 并且在paddingNodeObjArray中存储着这个barcode的每一个padding片段的属性信息,
       * 该方法可以返回该align片段所对应的padding对象的信息
       * @param nextAlignedIndex - align片段的初始节点
       * @param paddingNodeObjArray - barcodeTree中padding片段的属性信息
       * @returns {*}
       */
      function findBeforePaddingNode(nextAlignedIndex, paddingNodeObjArray) {
        for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
          if (paddingNodeObjArray[pI].paddingNodeStartIndex === nextAlignedIndex) {
            return paddingNodeObjArray[pI]
          }
        }
        return null
      }

      function isAlignedNodeStartIndex(alignedRangeObjArray, nodeIndex) {
        for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
          if (nodeIndex === alignedRangeObjArray[aI].rangeStartNodeIndex) {
            return true
          }
        }
        return false
      }
    },
    //  显示四个不同的数组中的数值
    show_barcode_node: function () {
      var self = this
      console.log('alignedRangeObjArray', self.get('alignedRangeObjArray'))
      console.log('barcodeNodeAttrArray', self.get('barcodeNodeAttrArray'))
      console.log('_alignedRangeObjArray', self.get('_alignedRangeObjArray'))
      console.log('alignedBarcodeNodeAttrArray', self.get('alignedBarcodeNodeAttrArray'))
    },
    //  对齐节点
    align_node: function (nodeId, depth, category, alignedLevel, finishAlignDeferObj) {
      //  对于collection中的所有model进行align操作
      window.Datacenter.barcodeCollection.add_super_subtree(nodeId, depth, category, alignedLevel, finishAlignDeferObj)
    },
    //  删除对齐节点
    remove_align_node: function (nodeId, depth, category, alignedLevel, finishRemoveAlignDeferObj) {
      window.Datacenter.barcodeCollection.remove_super_subtree(nodeId, depth, category, alignedLevel, finishRemoveAlignDeferObj)
    },
    //  将子树的节点数组插入到model中
    update_single_barcode_subtree: function (rootId, rootCategory, rootLevel, cloneSubtreeNodeArray, cloneMaxNodeNumTreeNodeLocArray) {
      var self = this
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
      var replacedNodeObj = self.get_replaced_nodes_array(rootId, rootCategory, rootLevel, barcodeNodeAttrArray)
      //  为什么需要维持alignedBarcodeNodeAttrArray这个对象是因为在比较节点数目时, 需要首先按照MaxNodeNumTree确定一些节点的节点位置, 然后才能够依次排放其他的节点, 进而比较节点的数量
      var alignedReplaceNodeObj = self.get_replaced_nodes_array(rootId, rootCategory, rootLevel, alignedBarcodeNodeAttrArray)
      var replacedNodesArray = barcodeNodeAttrArray.splice(replacedNodeObj.subtreeRootIndex, replacedNodeObj.subtreeLength,...cloneSubtreeNodeArray
      )
      var alignedReplacedNodesArray = alignedBarcodeNodeAttrArray.splice(alignedReplaceNodeObj.subtreeRootIndex, alignedReplaceNodeObj.subtreeLength,...cloneMaxNodeNumTreeNodeLocArray
      )
      //  根据alignedbarcodeNodeAttrArray建立索引构建alignedBarcodeNodeAttrObj
      self.build_aligned_barcode_node_obj()
      //  根据replace得到的节点修改对齐之后的节点是否存在的属性
      self.change_exist_num_attr(replacedNodesArray, barcodeNodeAttrArray)
    },
    update_single_compact_barcode_subtree: function (rootId, rootCategory, rootLevel, cloneCompactSuperTreeNodeLocArray, cloneCompactMaxNodeNumTreeNodeLocArray) {
      var self = this
      var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      var compactAlignedBarcodeNodeAttrArray = self.get('compactAlignedBarcodeNodeAttrArray')
      var compactReplacedNodeObj = self.get_replaced_nodes_array(rootId, rootCategory, rootLevel, compactBarcodeNodeAttrArray)
      //  为什么需要维持alignedBarcodeNodeAttrArray这个对象是因为在比较节点数目时, 需要首先按照MaxNodeNumTree确定一些节点的节点位置, 然后才能够依次排放其他的节点, 进而比较节点的数量
      var compactAlignedReplaceNodeObj = self.get_replaced_nodes_array(rootId, rootCategory, rootLevel, compactAlignedBarcodeNodeAttrArray)
      var compactReplacedNodesArray = compactBarcodeNodeAttrArray.splice(compactReplacedNodeObj.subtreeRootIndex, compactReplacedNodeObj.subtreeLength,...cloneCompactSuperTreeNodeLocArray
      )
      var alignedReplacedNodesArray = compactAlignedBarcodeNodeAttrArray.splice(compactAlignedReplaceNodeObj.subtreeRootIndex, compactAlignedReplaceNodeObj.subtreeLength,...cloneCompactMaxNodeNumTreeNodeLocArray
      )
      self.update_compact_aligned_barcode_node_obj()
      self.chang_compact_exist_attr(compactReplacedNodesArray, compactBarcodeNodeAttrArray)
    },
    /**
     * 为alignedBarcode中的节点建立索引, 从而构成alignedBarcodeNodeAttrObj对象
     */
    build_aligned_barcode_node_obj: function () {
      var self = this
      var alignedBarcodeNodeAttrObj = {}
      var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
      for (var aI = 0; aI < alignedBarcodeNodeAttrArray.length; aI++) {
        var nodeId = alignedBarcodeNodeAttrArray[aI].id
        alignedBarcodeNodeAttrObj[nodeId] = alignedBarcodeNodeAttrArray[aI]
      }
      self.set('alignedBarcodeNodeAttrObj', alignedBarcodeNodeAttrObj)
    },
    update_compact_aligned_barcode_node_obj: function () {
      var self = this
      var compactAlignedBarcodeNodeAttrObj = {}
      var compactAlignedBarcodeNodeAttrArray = self.get('compactAlignedBarcodeNodeAttrArray')
      for (var cI = 0; cI < compactAlignedBarcodeNodeAttrArray.length; cI++) {
        var nodeId = compactAlignedBarcodeNodeAttrArray[cI].id
        compactAlignedBarcodeNodeAttrObj[nodeId] = compactAlignedBarcodeNodeAttrArray[cI]
      }
      self.set('compactAlignedBarcodeNodeAttrObj', compactAlignedBarcodeNodeAttrObj)
    },
    /**
     * 获取子树在原始节点数组中替换的范围
     * @param rootId
     * @param rootCategory
     * @param rootLevel
     * @param barcodeNodeAttrArray
     */
    get_replaced_nodes_array: function (rootId, rootCategory, rootLevel, barcodeNodeAttrArray) {
      var self = this
      var subtreeRootIndex = -1
      var subtreeLength = 1
      var replacedNodeObj = {}
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if (barcodeNodeAttrArray[bI].id === rootId) {
          subtreeRootIndex = bI
          break
        }
      }
      //  如果在该子树中存在想要替换的子树, 那么计算该子树的长度, 否则替换的子树长度为0
      if (subtreeRootIndex !== -1) {
        for (var bI = (subtreeRootIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[bI].depth > rootLevel) {
            subtreeLength = subtreeLength + 1
          } else if (barcodeNodeAttrArray[bI].depth <= rootLevel) {
            break
          }
        }
      } else {
        var rootCategoryNum = +rootCategory
        //  不能够找到该节点的情况下
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          var thisCategory = +barcodeNodeAttrArray[bI].category
          if ((thisCategory != NaN) && (rootCategoryNum != NaN)) {
            if (thisCategory > rootCategoryNum) {
              subtreeRootIndex = bI
              break
            }
          }
        }
        subtreeLength = 0
      }
      if (subtreeRootIndex === -1) {
        subtreeRootIndex = barcodeNodeAttrArray.length
      }
      replacedNodeObj.subtreeRootIndex = subtreeRootIndex
      replacedNodeObj.subtreeLength = subtreeLength
      return replacedNodeObj
    },
    /**
     * 将新增加的compact nodeArray中的属性existed赋值为true
     * @param replacedNodesArray
     * @param barcodeNodeAttrArray
     */
    chang_compact_exist_attr: function (replacedNodesArray, barcodeNodeAttrArray) {
      var replaceNodesObj = {}
      for (var rI = 0; rI < replacedNodesArray.length; rI++) {
        if (replacedNodesArray[rI].existed) {
          replaceNodesObj[replacedNodesArray[rI].id] = replacedNodesArray[rI]
        }
      }
      //  在使用supertree替换了之前子树的节点数组之后, 需要利用替换的结果, 对于替换之后的节点数组中的节点进行标记
      //  在替换之前存在的节点的existed属性均为true, 在替换之后将之前存在的节点属性设置为true
      for (var cI = 0; cI < barcodeNodeAttrArray.length; cI++) {
        var nodeId = barcodeNodeAttrArray[cI].id
        if (typeof(replaceNodesObj[nodeId]) !== 'undefined') {
          barcodeNodeAttrArray[cI].existed = true
        }
      }
      //  改变template节点的exist属性, 如果template节点后面的节点存在一个的absolute_father的exist属性为true, 那么template节点的exist属性为true, 否则为false
      var currentTemplateNodeArray = []
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
      var TEMPLATE = Config.get('CONSTANT')['TEMPLATE']
      for (var cI = 0; cI < barcodeNodeAttrArray.length; cI++) {
        if (barcodeNodeAttrArray[cI].compactAttr === TEMPLATE) {
          barcodeNodeAttrArray[cI].existed = false
        }
      }
      for (var cI = 0; cI < barcodeNodeAttrArray.length; cI++) {
        if (barcodeNodeAttrArray[cI].compactAttr === TEMPLATE) {
          currentTemplateNodeArray.push(barcodeNodeAttrArray[cI])
        } else if (barcodeNodeAttrArray[cI].compactAttr === ABSOLUTE_COMPACT_FATHER) {
          if (barcodeNodeAttrArray[cI].existed) {
            for (var tI = 0; tI < currentTemplateNodeArray.length; tI++) {
              currentTemplateNodeArray[tI].existed = true
            }
          }
        } else {
          currentTemplateNodeArray = []
        }
      }
    },
    /**
     * 将新增加的nodeArray中的属性existed赋值为true
     * @param replacedNodesArray
     * @param barcodeNodeAttrArray
     */
    change_exist_num_attr: function (replacedNodesArray, barcodeNodeAttrArray) {
      var replaceNodesObj = {}
      var replaceNotExistedNodesObj = {}
      // console.log('replacedNodesArray', replacedNodesArray)
      for (var rI = 0; rI < replacedNodesArray.length; rI++) {
        if (replacedNodesArray[rI].existed) { //&& ()
          replaceNodesObj[replacedNodesArray[rI].id] = replacedNodesArray[rI]
        } else {
          replaceNotExistedNodesObj[replacedNodesArray[rI].id] = replacedNodesArray[rI]
        }
      }
      // console.log('replaceNotExistedNodesObj', replaceNotExistedNodesObj)
      //  在使用supertree替换了之前子树的节点数组之后, 需要利用替换的结果, 对于替换之后的节点数组中的节点进行标记
      //  在替换之前存在的节点的existed属性均为true, 在替换之后将之前存在的节点属性设置为true
      for (var cI = 0; cI < barcodeNodeAttrArray.length; cI++) {
        var nodeId = barcodeNodeAttrArray[cI].id
        if (typeof(replaceNodesObj[nodeId]) !== 'undefined') {
          barcodeNodeAttrArray[cI].existed = true
          barcodeNodeAttrArray[cI].num = replaceNodesObj[nodeId].num
          // barcodeNodeAttrArray[ cI ].existed = false
        }
        else if (typeof (replaceNotExistedNodesObj[nodeId]) !== 'undefined') {
          barcodeNodeAttrArray[cI].existed = false
          // barcodeNodeAttrArray[cI].width = 0
        }
      }
    },
    //  计算每个barcode对齐的节点范围以及节点对齐的长度
    compute_single_aligned_subtree_range: function (alignedNodeIdArray) {
      var self = this
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
        var alignedRangeObjArray = inner_compute_single_aligned_subtree_range(barcodeNodeAttrArray, alignedNodeIdArray)
        self.set('alignedRangeObjArray', alignedRangeObjArray)
        var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
        var _alignedRangeObjArray = inner_compute_single_aligned_subtree_range(alignedBarcodeNodeAttrArray, alignedNodeIdArray)
        self.set('_alignedRangeObjArray', _alignedRangeObjArray)
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
        var compactAlignedRangeObjArray = inner_compute_single_aligned_subtree_range(compactBarcodeNodeAttrArray, alignedNodeIdArray)
        self.set('compactAlignedRangeObjArray', compactAlignedRangeObjArray)
        var compactAlignedBarcodeNodeAttrArray = self.get('compactAlignedBarcodeNodeAttrArray')
        var _compactAlignedRangeObjArray = inner_compute_single_aligned_subtree_range(compactAlignedBarcodeNodeAttrArray, alignedNodeIdArray)
        self.set('_compactAlignedRangeObjArray', _compactAlignedRangeObjArray)
      }
      //  传入节点数组和对齐的节点的id的数组, 从而计算每个对齐的子树节点的范围
      function inner_compute_single_aligned_subtree_range(barcodeNodeAttrArray, alignedNodeIdArray) {
        var alignedRangeObjArray = []
        var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
        for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
          //  根据aligned节点得到节点的index数值
          var rangeStartNodeIndex = self.get_node_index_from_id(alignedNodeIdArray[aI], barcodeNodeAttrArray)
          //  根据开始的节点的index数值, 计算align结束的index数值范围
          var rangeEndNodeIndex = getAlignedNodeRangeEnd(rangeStartNodeIndex, barcodeNodeAttrArray)
          if (typeof (barcodeNodeAttrArray[rangeStartNodeIndex]) === 'undefined') {
            console.log('barcodeNodeAttrArray length', barcodeNodeAttrArray.length)
            console.log('rangeStartNodeIndex', rangeStartNodeIndex)
          }
          var rangeStartX = barcodeNodeAttrArray[rangeStartNodeIndex].x
          var rangeEndX = barcodeNodeAttrArray[rangeEndNodeIndex].x + barcodeNodeAttrArray[rangeEndNodeIndex].width //+ barcodeNodeInterval
          var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
          //  对齐节点的长度
          var alignedLength = rangeEndX - rangeStartX //+ barcodeNodePadding
          alignedRangeObjArray.push({
            'alignedObjIndex': aI,
            'rangeStartNodeIndex': rangeStartNodeIndex,
            'rangeEndNodeIndex': rangeEndNodeIndex,
            'alignedLength': alignedLength
          })
        }
        alignedRangeObjArray.sort(function (a1, a2) {
          return a1.rangeStartNodeIndex - a2.rangeStartNodeIndex
        })
        return alignedRangeObjArray
        function getAlignedNodeRangeEnd(nodeIndex, barcodeNodeAttrArray) {
          if (typeof (barcodeNodeAttrArray[nodeIndex]) === 'undefined') {
            return nodeIndex
          }
          var nodeLevel = barcodeNodeAttrArray[nodeIndex].depth
          for (var bI = (nodeIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
            if (barcodeNodeAttrArray[bI].depth <= nodeLevel) {
              return bI - 1
            }
          }
          if ((bI === barcodeNodeAttrArray.length) || (nodeIndex === 0)) {
            return barcodeNodeAttrArray.length - 1
          }
        }
      }
    },
    /**
     *  根据padding的范围首先计算glyph所代表的部分的子树的映射属性,
     *  从属性映射到sawtooth的具体形状需要一个算法进行计算, 然而形状的计算与barcode的高度相关,
     *  所以计算path上的具体的点的位置应该实际在single.view上进行计算
     *  返回的是subtree的对象数组
     */
    sawtooth_parser: function (paddingNodeObj, barcodeNodeAttrArray) {
      var self = this
      var paddingNodeStartIndex = paddingNodeObj.paddingNodeStartIndex
      var paddingNodeEndIndex = paddingNodeObj.paddingNodeEndIndex
      if (!((paddingNodeStartIndex === 0) && (paddingNodeEndIndex === 0))) {
        if (paddingNodeStartIndex === 0) {
          paddingNodeStartIndex = 1
        }
        var subtreeRootDepth = get_subtree_root_depth(paddingNodeStartIndex, paddingNodeEndIndex, barcodeNodeAttrArray) // 每一个锯齿所代表的子树的深度
        var subtreeObjectArray = get_subtree_array(paddingNodeStartIndex, paddingNodeEndIndex, barcodeNodeAttrArray, subtreeRootDepth)//包含每个subtree对象的对象数组
        for (var sI = 0; sI < subtreeObjectArray.length; sI++) {
          var singleSubtreeStart = subtreeObjectArray[sI].startIndex
          var singleSubtreeEnd = subtreeObjectArray[sI].endIndex
          var singleSubtreeDepth = get_each_subtree_depth(singleSubtreeStart, singleSubtreeEnd, barcodeNodeAttrArray)
          subtreeObjectArray[sI].subtree_depth = singleSubtreeDepth
          var singleSubtreeWidth = get_each_subtree_width(singleSubtreeStart, singleSubtreeEnd, singleSubtreeDepth)
          subtreeObjectArray[sI].subtree_width = singleSubtreeWidth
          var singleSubtreeBalance = get_each_subtree_balance(singleSubtreeStart, singleSubtreeEnd, subtreeRootDepth, barcodeNodeAttrArray)
          subtreeObjectArray[sI].subtree_balance = singleSubtreeBalance
        }
        return subtreeObjectArray
      } else {
        var subtreeObjectArray = [{
          startIndex: 0,
          endIndex: 0,
          completed: true,
          subtree_balance: 1,
          subtree_depth: 0,
          subtree_width: 0,
          isRoot: true
        }]
        return subtreeObjectArray
      }
      //  计算每个锯齿所代表的子树的深度
      function get_subtree_root_depth(start_index, end_index, node_attr_array) {
        var rootDepth = Infinity
        var selectedLevels = Variables.get('selectedLevels')
        // subtree所代表的子树是节点数组中的深度最小
        for (var nI = start_index; nI < end_index; nI++) {
          var nodeDepth = node_attr_array[nI].depth
          if (selectedLevels.indexOf(nodeDepth) !== -1) {
            if (rootDepth > nodeDepth) {
              if (typeof (node_attr_array[nI]) !== 'undefined') {
                rootDepth = nodeDepth
              }
            }
          }
        }
        return rootDepth
      }

      //  计算锯齿的数目, 返回对象数组, subtree object array,
      //  每个对象存在align范围的begin初始值与end结束值, 是否是complete, 如果不是complete, 那么是否具有根节点
      function get_subtree_array(start_index, end_index, node_attr_array, subtree_root_depth) {
        var subtreeObjArray = []
        var subtreeObj = {startIndex: start_index}
        subtreeObjArray.push(subtreeObj)
        var selectedLevels = Variables.get('selectedLevels')
        //  已经将startIndex作为第一个subtree的开始index进行计算subtree的range
        for (var nI = (start_index + 1); nI <= end_index; nI++) {
          var nodeDepth = node_attr_array[nI].depth
          if (selectedLevels.indexOf(nodeDepth) !== -1) {
            if (nodeDepth === subtree_root_depth) {
              subtreeObjArray[subtreeObjArray.length - 1].endIndex = nI - 1
              subtreeObjArray[subtreeObjArray.length - 1].completed = true
              subtreeObjArray.push({startIndex: nI})
            }
          }
          if (nI === end_index) {
            subtreeObjArray[subtreeObjArray.length - 1].endIndex = nI
            //  如果是end_index, 那么complete属性也不一定是false
            if (nI === (node_attr_array.length - 1)) {  //因为有可能是数组的结束位置
              subtreeObjArray[subtreeObjArray.length - 1].completed = true
            } else if (node_attr_array[nI + 1].depth === subtree_root_depth) { //或者原本下一个节点就是另一个subtree的开始
              subtreeObjArray[subtreeObjArray.length - 1].completed = true
            } else {
              subtreeObjArray[subtreeObjArray.length - 1].completed = false
              subtreeObjArray[subtreeObjArray.length - 1].with_root = true
            }
          }
        }
        //  根据startIndex位置对象的depth值检查completed是否为true, 因为这样忽略了初始情况下的completed为true
        for (var sI = 0; sI < subtreeObjArray.length; sI++) {
          var startIndex = subtreeObjArray[sI].startIndex
          if (node_attr_array[startIndex].depth !== subtree_root_depth) {
            subtreeObjArray[sI].completed = false
          }
        }
        //  判断第一个subtreeObj的completed属性如果为false, 则计算当前的子树所占的比例
        if (!subtreeObjArray[0].completed) {
          var wholeSubtreeSize = 0
          var incompletedObjEndIndex = subtreeObjArray[0].endIndex
          for (var nI = incompletedObjEndIndex; nI > 0; nI--) {
            var nodeDepth = node_attr_array[nI].depth
            if (selectedLevels.indexOf(nodeDepth) !== -1) {
              wholeSubtreeSize = wholeSubtreeSize + 1
              if (nodeDepth === subtree_root_depth) {
                break;
              }
            }
          }
          //  计算该子树在选中的层级范围内的节点总数
          var incompleteSubtreeSize = 0
          for (var nI = subtreeObjArray[0].startIndex; nI < subtreeObjArray[0].endIndex; nI++) {
            var nodeDepth = node_attr_array[nI].depth
            if (selectedLevels.indexOf(nodeDepth) !== -1) {
              incompleteSubtreeSize = incompleteSubtreeSize + 1
            }
          }
          subtreeObjArray[0].percentage = incompleteSubtreeSize / wholeSubtreeSize
        }
        //  判断complete属性为false, 则计算当前的子树所占的比例
        if (!subtreeObjArray[subtreeObjArray.length - 1].completed) {
          var incompletedObjStartIndex = subtreeObjArray[subtreeObjArray.length - 1].startIndex + 1
          var wholeSubtreeSize = 0 + 1//  因为计算的时候跳过了根节点, 所以subtreeObjLastLength的计数从1开始
          for (var nI = incompletedObjStartIndex; nI < node_attr_array.length; nI++) {
            var nodeDepth = node_attr_array[nI].depth
            if (selectedLevels.indexOf(nodeDepth) !== -1) {
              wholeSubtreeSize = wholeSubtreeSize + 1
              if (node_attr_array[nI].depth === subtree_root_depth) {
                break;
              }
            }
          }
          //  计算该子树在选中的层级范围内的节点总数
          var incompleteSubtreeSize = 0
          for (var nI = subtreeObjArray[subtreeObjArray.length - 1].startIndex; nI < subtreeObjArray[subtreeObjArray.length - 1].endIndex; nI++) {
            var nodeDepth = node_attr_array[nI].depth
            if (selectedLevels.indexOf(nodeDepth) !== -1) {
              incompleteSubtreeSize = incompleteSubtreeSize + 1
            }
          }
          subtreeObjArray[subtreeObjArray.length - 1].percentage = incompleteSubtreeSize / wholeSubtreeSize
        }
        return subtreeObjArray
      }

      //  计算每个子树的深度
      function get_each_subtree_depth(start_index, end_index, node_attr_array) {
        var minNodeDepth = Infinity
        var maxNodeDepth = -Infinity
        var selectedLevels = Variables.get('selectedLevels')
        for (var nI = start_index; nI < end_index; nI++) {
          var nodeDepth = node_attr_array[nI].depth
          if (selectedLevels.indexOf(nodeDepth) !== -1) {
            if (nodeDepth < minNodeDepth) {
              minNodeDepth = nodeDepth
            }
            if (nodeDepth > maxNodeDepth) {
              maxNodeDepth = nodeDepth
            }
          }
        }
        var subtreeDepth = maxNodeDepth - minNodeDepth + 1
        return subtreeDepth
      }

      //  计算每个子树的平均宽度, 子树的平均宽度是由子树的子树的节点数目和子树的深度决定
      function get_each_subtree_width(start_index, end_index, subtree_depth) {
        var subtreeWidth = (end_index - start_index) / subtree_depth
        return subtreeWidth
      }

      //  计算子树的平衡性
      function get_each_subtree_balance(start_index, end_index, root_depth, node_attr_array) {
        var subtreeNextDepth = root_depth + 1
        var subtreeSizeArray = []
        var subtreeSize = 0
        var selectedLevels = Variables.get('selectedLevels')
        for (var nI = (start_index + 1); nI <= end_index; nI++) {
          var nodeDepth = node_attr_array[nI].depth
          if (selectedLevels.indexOf(nodeDepth) !== -1) {
            if (nodeDepth === subtreeNextDepth) {
              subtreeSizeArray.push(subtreeSize)
              subtreeSize = 0
            }
            subtreeSize = subtreeSize + 1
          }
          if (nI === end_index) { //  或者该子树的范围结束, 同样将subtreesizeObjpush进去
            subtreeSizeArray.push(subtreeSize)
            subtreeSize = 0
          }
        }
        var sortedSubtreeSizeArray = subtreeSizeArray.sort()
        var maxValue = sortedSubtreeSizeArray[sortedSubtreeSizeArray.length - 1]
        var minValue = null
        for (var sI = 0; sI < sortedSubtreeSizeArray.length; sI++) {
          if (sortedSubtreeSizeArray[sI] !== 0) {
            minValue = sortedSubtreeSizeArray[sI]
            break
          }
        }
        var balanceProperity = minValue / maxValue
        return balanceProperity
      }
    },
    /**
     * 计算padding node的节点位置, 并且计算padding node伸展情况下的长度
     */
    init_padding_node_location: function () {
      var self = this
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        var alignedRangeObjArray = self.get('alignedRangeObjArray')
        var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
        var paddingNodeObjArray = inner_init_padding_node_location(alignedRangeObjArray, barcodeNodeAttrArray)
        self.set('paddingNodeObjArray', paddingNodeObjArray)
        var _alignedRangeObjArray = self.get('_alignedRangeObjArray')
        var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
        var _paddingNodeObjArray = inner_init_padding_node_location(_alignedRangeObjArray, alignedBarcodeNodeAttrArray)
        self.set('_paddingNodeObjArray', _paddingNodeObjArray)
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        var compactAlignedRangeObjArray = self.get('compactAlignedRangeObjArray')
        var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
        var compactPaddingNodeObjArray = inner_init_padding_node_location(compactAlignedRangeObjArray, compactBarcodeNodeAttrArray)
        self.set('compactPaddingNodeObjArray', compactPaddingNodeObjArray)
        var _compactAlignedRangeObjArray = self.get('_compactAlignedRangeObjArray')
        var compactAlignedBarcodeNodeAttrArray = self.get('compactAlignedBarcodeNodeAttrArray')
        var _compactPaddingNodeObjArray = inner_init_padding_node_location(_compactAlignedRangeObjArray, compactAlignedBarcodeNodeAttrArray)
        self.set('_compactPaddingNodeObjArray', _compactPaddingNodeObjArray)
      }
      function inner_init_padding_node_location(alignedRangeObjArray, barcodeNodeAttrArray) {
        var paddingNodeObjArray = null
        var displayMode = Variables.get('displayMode')
        if (alignedRangeObjArray.length > 0) {
          paddingNodeObjArray = [{
            'paddingNodeStartIndex': 0,
            'isCompact': true
          }]
          for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
            paddingNodeObjArray[paddingNodeObjArray.length - 1].paddingNodeEndIndex = alignedRangeObjArray[aI].rangeStartNodeIndex - 1
            var subtreeObjectArray = self.sawtooth_parser(paddingNodeObjArray[paddingNodeObjArray.length - 1], barcodeNodeAttrArray)
            paddingNodeObjArray[paddingNodeObjArray.length - 1].subtreeObjectArray = subtreeObjectArray
            //  根据计算得到的subtreeObjectArray计算paddingnode的宽度
            paddingNodeObjArray[paddingNodeObjArray.length - 1].compressPaddingNodeWidth = computePaddingNodeWidth(subtreeObjectArray)
            //  根据计算得到的subtreeObjectArray计算paddingNode的深度
            paddingNodeObjArray[paddingNodeObjArray.length - 1].compressPaddingNodeMaxDepth = computePaddingNodeMaxDepth(subtreeObjectArray)
            paddingNodeObjArray.push({
              'paddingNodeStartIndex': alignedRangeObjArray[aI].rangeEndNodeIndex + 1,
              'isCompact': true
            })
          }
          paddingNodeObjArray[paddingNodeObjArray.length - 1].paddingNodeEndIndex = barcodeNodeAttrArray.length - 1
          var subtreeObjectArray = self.sawtooth_parser(paddingNodeObjArray[paddingNodeObjArray.length - 1], barcodeNodeAttrArray)
          paddingNodeObjArray[paddingNodeObjArray.length - 1].subtreeObjectArray = subtreeObjectArray
          //  根据计算得到的subtreeObjectArray计算paddingnode的宽度
          paddingNodeObjArray[paddingNodeObjArray.length - 1].compressPaddingNodeWidth = computePaddingNodeWidth(subtreeObjectArray)
          //  根据计算得到的subtreeObjectArray计算paddingNode的深度
          paddingNodeObjArray[paddingNodeObjArray.length - 1].compressPaddingNodeMaxDepth = computePaddingNodeMaxDepth(subtreeObjectArray)
        } else {
          paddingNodeObjArray = []
        }
        //  遍历paddingNodeObjArray, 去除所有的paddingNodeStartIndex和paddingNodeEndIndex相同的节点
        // for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
        //   if (paddingNodeObjArray[ pI ].paddingNodeStartIndex >= paddingNodeObjArray[ pI ].paddingNodeEndIndex) {
        //     paddingNodeObjArray.splice(pI, 1)
        //     pI = pI - 1
        //   }
        // }
        // for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
        //   if (paddingNodeObjArray[ pI ].paddingNodeStartIndex >= paddingNodeObjArray[ pI ].paddingNodeEndIndex) {
        //     paddingNodeObjArray[ pI ].paddingNodeStartIndex = paddingNodeObjArray[ pI ].paddingNodeEndIndex
        //   }
        // }
        paddingNodeObjArray.sort(function (p1, p2) {
          return p1.paddingNodeStartIndex - p2.paddingNodeStartIndex
        })
        for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
          if (displayMode === Config.get('CONSTANT').COMPACT) {
            paddingNodeObjArray[pI].maxPaddingNodeLength = computeCompactPaddingNodeRange(paddingNodeObjArray[pI], barcodeNodeAttrArray)
          } else if (displayMode === Config.get('CONSTANT').ORIGINAL) {
            paddingNodeObjArray[pI].maxPaddingNodeLength = computePaddingNodeRange(paddingNodeObjArray[pI], barcodeNodeAttrArray)
          }
        }
        return paddingNodeObjArray
      }

      //  计算padding节点的深度, 即内部的所有子树的最大的深度
      function computePaddingNodeMaxDepth(subtreeObjectArray) {
        var paddingNodeMaxDepth = -Infinity
        for (var sI = 0; sI < subtreeObjectArray.length; sI++) {
          var paddingNodeDepth = subtreeObjectArray[sI].subtree_depth
          if (paddingNodeDepth > paddingNodeMaxDepth) {
            paddingNodeMaxDepth = paddingNodeDepth
          }
        }
        return paddingNodeMaxDepth
      }

      //  计算padding节点的宽度, 即内部所有的子树的宽度之和
      function computePaddingNodeWidth(subtreeObjectArray) {
        var paddingNodeWidth = 0
        for (var sI = 0; sI < subtreeObjectArray.length; sI++) {
          paddingNodeWidth = paddingNodeWidth + subtreeObjectArray[sI].subtree_width
        }
        return paddingNodeWidth
      }

      //  计算paddingNode的节点的index的范围
      function computePaddingNodeRange(paddingNodeObj, barcodeNodeAttrArray) {
        var barcodeNodeGap = Variables.get('barcodeNodeInterval')
        var paddingNodeStartIndex = +paddingNodeObj.paddingNodeStartIndex
        var paddingNodeEndIndex = +paddingNodeObj.paddingNodeEndIndex
        var selectedLevels = Variables.get('selectedLevels')
        var paddingNodeLength = 0
        for (var pI = +paddingNodeStartIndex; pI <= paddingNodeEndIndex; pI++) {
          var depth = barcodeNodeAttrArray[pI].depth
          if (selectedLevels.indexOf(depth) !== -1) {
            paddingNodeLength = paddingNodeLength + barcodeNodeAttrArray[pI].width + barcodeNodeGap
          }
        }
        return paddingNodeLength
      }

      function computeCompactPaddingNodeRange(paddingNodeObj, barcodeNodeAttrArray) {
        var paddingNodeStartIndex = +paddingNodeObj.paddingNodeStartIndex
        var paddingNodeEndIndex = +paddingNodeObj.paddingNodeEndIndex
        var selectedLevels = window.selectedLevels
        var compactNum = window.compactNum
        var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
        var ABSOLUTE_COMPACT_CHILDREN = Config.get('CONSTANT')['ABSOLUTE_COMPACT_CHILDREN']
        var PER_GAP_WIDTH = Config.get('PER_GAP_WIDTH')
        var paddingNodeLength = 0
        var compactCount = 0
        var previousDepth = 0
        var previousRectWidth = 0
        var previousCompact = false
        for (var tI = paddingNodeStartIndex; tI < paddingNodeEndIndex; tI++) {
          var compactAttr = barcodeNodeAttrArray[tI].compactAttr
          var rectWidth = barcodeNodeAttrArray[tI].width
          var depth = barcodeNodeAttrArray[tI].depth
          if (compactAttr === ABSOLUTE_COMPACT_FATHER) {
            //  在两个不同层级的compact类型的节点连接起来的情况下
            if (depth < previousDepth) {
              //  增加判断上一个节点是否是compact是为了避免上一个节点是uncompact模式, 已经在xLoc上增加了值, 此时不需要继续在xLoc上增加width和gap
              if ((previousCompact) && (compactCount !== 0)) {
                paddingNodeLength = paddingNodeLength + previousRectWidth + PER_GAP_WIDTH
              }
              compactCount = 0
            }
            //  如果该节点属于对齐的节点, 那么判断该节点是否是查过align节点的位置
            //  如果超过align节点的位置, 那么节点的位置保持不变; 如果没有超过align节点的位置, 那么需要将该节点放置到align节点的位置
            if (selectedLevels.indexOf(depth) !== -1) {
              compactCount = compactCount + 1
              compactCount = compactCount % compactNum
              if (rectWidth !== 0) {
                if (compactCount === 0) {
                  paddingNodeLength = paddingNodeLength + rectWidth + PER_GAP_WIDTH
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
              paddingNodeLength = paddingNodeLength + previousRectWidth + PER_GAP_WIDTH
            }
            compactCount = 0
            var rectWidth = barcodeNodeAttrArray[tI].width
            if (selectedLevels.indexOf(depth) !== -1) {
              if (rectWidth !== 0) {
                paddingNodeLength = paddingNodeLength + rectWidth + PER_GAP_WIDTH
                //  修改previousRectWidth和previousDepth
                previousRectWidth = rectWidth
                previousDepth = depth
                previousCompact = false
              }
            }
          }
        }
        return paddingNodeLength
      }
    },
    /**
     *  设置barcode内部距离上边界的距离
     */
    set_barcode_padding_top: function () {
      var self = this
      var barcodeOriginalNodeHeight = self.get('barcodeOriginalNodeHeight')
      var barcodePaddingTop = barcodeOriginalNodeHeight / 8
      self.set('barcodePaddingTop', barcodePaddingTop)
    },
    /**
     *  计算得到比较的结果
     */
    get_single_comparison_result: function () {
      var self = this
      var basedModel = self.get('basedModel')
      if (basedModel != null) {
        var alignedComparisonResultArray = []
        var basedAlignedRangeObjArray = null
        var basedBarcodeNodeAttrArray = null
        var alignedRangeObjArray = null
        var barcodeNodeAttrArray = self.get_barcode_node_attr_array()
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          basedAlignedRangeObjArray = basedModel.get('alignedRangeObjArray')
          basedBarcodeNodeAttrArray = basedModel.get('barcodeNodeAttrArray')
          alignedRangeObjArray = self.get('alignedRangeObjArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          basedAlignedRangeObjArray = basedModel.get('compactAlignedRangeObjArray')
          basedBarcodeNodeAttrArray = basedModel.get('compactBarcodeNodeAttrArray')
          alignedRangeObjArray = self.get('compactAlignedRangeObjArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
          basedBarcodeNodeAttrArray = basedModel.get('categoryNodeObjArray')
          //  对于category的barcodeTree, alignedRange是全部的节点数组
          basedAlignedRangeObjArray = [{
            rangeStartNodeIndex: 0,
            rangeEndNodeIndex: basedBarcodeNodeAttrArray.length - 1
          }]
          alignedRangeObjArray = [{
            rangeStartNodeIndex: 0,
            rangeEndNodeIndex: barcodeNodeAttrArray.length - 1
          }]
        }
        for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
          var alignedObjIndex = alignedRangeObjArray[aI].alignedObjIndex
          var singleAlignedResult = getSingleAlignedObjComparisonResult(basedAlignedRangeObjArray[aI], basedBarcodeNodeAttrArray, alignedRangeObjArray[aI], barcodeNodeAttrArray)
          singleAlignedResult.alignedObjIndex = alignedObjIndex
          alignedComparisonResultArray.push(singleAlignedResult)
        }
        self.set('alignedComparisonResultArray', alignedComparisonResultArray)
      }
      //  对于每一个间隔的对齐对象获取比较结果
      function getSingleAlignedObjComparisonResult(basedAlignedRangeObj, basedBarcodeNodeAttrArray, alignedRangeObj, barcodeNodeAttrArray) {
        var singleAlignedResult = {}
        var basedStartNodeIndex = basedAlignedRangeObj.rangeStartNodeIndex
        var startNodeIndex = alignedRangeObj.rangeStartNodeIndex
        var alignedLength = basedAlignedRangeObj.rangeEndNodeIndex - basedStartNodeIndex
        var sameNodeIdArray = []
        var addedNodeIdArray = []
        var missedNodeIdArray = []
        for (var bI = 0; bI < alignedLength; bI++) {
          var baseNodeIndex = basedStartNodeIndex + bI
          var nodeIndex = startNodeIndex + bI
          var nodeDepth = basedBarcodeNodeAttrArray[baseNodeIndex].depth
          var selectedLevels = Variables.get('selectedLevels')
          if (selectedLevels.indexOf(nodeDepth) !== -1) {
            if ((typeof(barcodeNodeAttrArray[nodeIndex]) !== 'undefined') && (typeof (basedBarcodeNodeAttrArray[baseNodeIndex]) !== 'undefined')) {
              if ((basedBarcodeNodeAttrArray[baseNodeIndex].existed) && (barcodeNodeAttrArray[nodeIndex].existed)) {
                //   based barcode 和 当前的barcode都存在 -> same节点
                sameNodeIdArray.push(basedBarcodeNodeAttrArray[baseNodeIndex].id)
              } else if ((!basedBarcodeNodeAttrArray[baseNodeIndex].existed) && (barcodeNodeAttrArray[nodeIndex].existed)) {
                // based barcode 不存在, 当前的barcode存在 -> added节点
                addedNodeIdArray.push(basedBarcodeNodeAttrArray[baseNodeIndex].id)
              } else if ((basedBarcodeNodeAttrArray[baseNodeIndex].existed) && (!barcodeNodeAttrArray[nodeIndex].existed)) {
                // based barcode存在, 当前的barcode不存在 -> missed节点
                missedNodeIdArray.push(basedBarcodeNodeAttrArray[baseNodeIndex].id)
              }
            }
          }
        }
        singleAlignedResult.sameNodeIdArray = sameNodeIdArray
        singleAlignedResult.addedNodeIdArray = addedNodeIdArray
        singleAlignedResult.missedNodeIdArray = missedNodeIdArray
        return singleAlignedResult
      }
    },
    /**
     * 更新barcode显示节点的层级
     */
    update_displayed_level: function () {
      var self = this
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      var alignedRangeObjArray = self.get('alignedRangeObjArray')
      var paddingNodeObjArray = self.get('paddingNodeObjArray')
      self._update_barcode_node_width(barcodeNodeAttrArray)
      self._update_barcode_node_array(barcodeNodeAttrArray, alignedRangeObjArray, paddingNodeObjArray)
      var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
      var _alignedRangeObjArray = self.get('_alignedRangeObjArray')
      var _paddingNodeObjArray = self.get('_paddingNodeObjArray')
      self._update_barcode_node_width(alignedBarcodeNodeAttrArray)
      self._update_barcode_node_array(alignedBarcodeNodeAttrArray, _alignedRangeObjArray, _paddingNodeObjArray)
    },
    _update_barcode_node_width: function (barcodeNodeAttrArray) {
      var barcodeWidthArray = window.barcodeWidthArray
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        var depth = barcodeNodeAttrArray[bI].depth
        barcodeNodeAttrArray[bI].width = barcodeWidthArray[depth]
      }
    },
    _update_barcode_node_array: function (node_attr_array, aligned_obj_array, padding_obj_array) {
      var self = this
      var ALIGN_START = self.get('ALIGN_START')
      var ALIGN_RANGE = self.get('ALIGN_RANGE')
      var PADDING_RANGE = self.get('PADDING_RANGE')
      var BARCODE_NODE_GAP = Variables.get('barcodeNodeInterval')
      var BARCODE_NODE_PADDING = Config.get('BARCODE_NODE_PADDING')
      var COMPARISON_RESULT_PADDING = Config.get('COMPARISON_RESULT_PADDING')
      var nodeLocationX = 0
      for (var nI = 0; nI < node_attr_array.length; nI++) {
        if (self._node_category(nI, aligned_obj_array, padding_obj_array) === ALIGN_START) {
          //  该节点是align范围的开始节点
          nodeLocationX = nodeLocationX + BARCODE_NODE_PADDING + COMPARISON_RESULT_PADDING
          node_attr_array[nI].x = nodeLocationX
          if (node_attr_array[nI].width === 0) {
            nodeLocationX = nodeLocationX
          } else {
            nodeLocationX = nodeLocationX + node_attr_array[nI].width + BARCODE_NODE_GAP
          }
        } else if (self._node_category(nI, aligned_obj_array, padding_obj_array) === ALIGN_RANGE) {
          //  该节点是align范围内的节点
          node_attr_array[nI].x = nodeLocationX
          if (node_attr_array[nI].width === 0) {
            nodeLocationX = nodeLocationX
          } else {
            nodeLocationX = nodeLocationX + node_attr_array[nI].width + BARCODE_NODE_GAP
          }
        } else if (self._node_category(nI, aligned_obj_array, padding_obj_array) === PADDING_RANGE) {
          //  该节点是padding范围内的节点
          node_attr_array[nI].x = nodeLocationX
        }
      }
    },
    show_NaN_node: function () {
      var self = this
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if (isNaN(barcodeNodeAttrArray[bI].x)) {
          console.log('barcodeNodeAttrArray[ bI ]', barcodeNodeAttrArray[bI])
        }
      }
    },
    /*
     * 在计算得到padding node和aligned node之后, 更新barcodeNodeAttr的节点的属性
     * 在singleView中对于paddingNodeArray与alignedNodeArray进行更新之后, 调用这个方法可以更新barcodeNodeAttr的属性值
     * **********************
     * 具体算法: 对于节点的更新主要是按照节点的类型计算其节点的位置, 节点的类型主要包括:
     * 初始对齐节点 - 对于该类节点,需要从前向后一次增加, 在这个过程中将align部分考虑在内
     * 对齐节点中部的节点 - 该类节点是基于对齐部分的初始节点, 依次向后增加
     * padding节点 - padding节点的特点是在该范围内的节点的x不会依次向后增加
     */
    update_barcode_node_array: function () {
      var self = this
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      var alignedLevel = Variables.get('alignedLevel')
      var displayedLastLevel = Variables.get('displayedLastLevel')
      var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      var barcodeNodeGap = Variables.get('barcodeNodeInterval')
      var comparisonResultPadding = Config.get('COMPARISON_RESULT_PADDING')
      var alignedBegin = self.get('ALIGN_START')
      var alignedRange = self.get('ALIGN_RANGE')
      var paddingRange = self.get('PADDING_RANGE')
      var alignedRangeObjArray = self.get('alignedRangeObjArray')
      var paddingNodeObjArray = self.get('paddingNodeObjArray')
      var compactAlignedRangeObjArray = self.get('compactAlignedRangeObjArray')
      var compactPaddingNodeObjArray = self.get('compactPaddingNodeObjArray')
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        nodeLocUpdate(barcodeNodeAttrArray, alignedRangeObjArray, paddingNodeObjArray)
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        compactNodeLocUpdate(compactBarcodeNodeAttrArray, compactAlignedRangeObjArray, compactPaddingNodeObjArray)
      }
      self.update_padding_node_location()
      //  非compact形式的barcodeNodeArray更新节点属性
      function nodeLocUpdate(barcodeNodeAttrArray, alignedRangeObjArray, paddingNodeObjArray) {
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          var nodeType = self._node_category(bI, alignedRangeObjArray, paddingNodeObjArray)
          if (nodeType === alignedBegin) {
            // barcodeNodeAttrArray[ bI ].x = barcodeNodeAttrArray[ bI - 1 ].x + barcodeNodePadding + comparisonResultPadding
            barcodeNodeAttrArray[bI].x = getAlignedNodeLoc(bI, alignedRangeObjArray, paddingNodeObjArray) + barcodeNodeGap
          } else if (nodeType === alignedRange) {
            //  当节点的深度小于aligned的深度时, 此时不需要考虑节点是否存在, 对于每一个节点都要计算节点的位置进行排列
            // if (barcodeNodeAttrArray[ bI ].depth <= alignedDepth) {
            if ((bI - 1) >= 0) {
              if (barcodeNodeAttrArray[bI - 1].width !== 0) {
                barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width + barcodeNodeGap
                // barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x + 8 + barcodeNodeGap
              } else {
                barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x
              }
            } else {
              barcodeNodeAttrArray[bI].x = 0
            }
          } else if (nodeType === paddingRange) {
            if ((bI - 1) >= 0) {
              barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x
            } else {
              barcodeNodeAttrArray[bI].x = 0
            }
          }
        }
      }

      //  compact的形式下对于barcodeNodeArray更新节点属性
      function compactNodeLocUpdate(compactBarcodeNodeAttrArray, compactAlignedRangeObjArray, compactPaddingNodeObjArray) {
        var xLoc = 0
        var compactCount = 0
        var selectedLevels = window.selectedLevels
        var compactNum = window.compactNum
        var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
        var ABSOLUTE_COMPACT_CHILDREN = Config.get('CONSTANT')['ABSOLUTE_COMPACT_CHILDREN']
        var PER_GAP_WIDTH = Config.get('PER_GAP_WIDTH')
        var previousDepth = 0
        var previousRectWidth = 0
        var previousCompact = false
        for (var bI = 0; bI < compactBarcodeNodeAttrArray.length; bI++) {
          var compactAttr = compactBarcodeNodeAttrArray[bI].compactAttr
          var rectWidth = compactBarcodeNodeAttrArray[bI].width
          var depth = compactBarcodeNodeAttrArray[bI].depth
          var nodeType = self._node_category(bI, compactAlignedRangeObjArray, compactPaddingNodeObjArray)
          if (nodeType === alignedBegin) {
            compactBarcodeNodeAttrArray[bI].x = getAlignedNodeLoc(bI, compactAlignedRangeObjArray, compactPaddingNodeObjArray) + barcodeNodeGap
            xLoc = compactBarcodeNodeAttrArray[bI].x + rectWidth + PER_GAP_WIDTH
            compactCount = 0
          } else if (nodeType === alignedRange) {
            if (compactAttr === ABSOLUTE_COMPACT_FATHER) {
              //  在两个不同层级的compact类型的节点连接起来的情况下
              if (depth < previousDepth) {
                if ((previousCompact) && (compactCount !== 0)) {
                  xLoc = xLoc + previousRectWidth + PER_GAP_WIDTH
                }
                compactCount = 0
              }
              xLoc = +xLoc.toFixed(2)
              compactBarcodeNodeAttrArray[bI].x = xLoc
              if (selectedLevels.indexOf(depth) !== -1) {
                compactCount = compactCount + 1
                compactCount = compactCount % compactNum
                if (rectWidth !== 0) {
                  if ((compactCount === 0) || (is_align_end(bI, compactAlignedRangeObjArray))) {
                    xLoc = compactBarcodeNodeAttrArray[bI].x + rectWidth + PER_GAP_WIDTH
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
              compactBarcodeNodeAttrArray[bI].x = xLoc
              var rectWidth = compactBarcodeNodeAttrArray[bI].width
              if (selectedLevels.indexOf(depth) !== -1) {
                if (rectWidth !== 0) {
                  xLoc = compactBarcodeNodeAttrArray[bI].x + rectWidth + PER_GAP_WIDTH
                  //  修改previousRectWidth和previousDepth
                  previousRectWidth = rectWidth
                  previousDepth = depth
                  previousCompact = false
                }
              }
            }
          } else if (nodeType === paddingRange) {
            if ((bI - 1) >= 0) {
              compactBarcodeNodeAttrArray[bI].x = xLoc
            } else {
              compactBarcodeNodeAttrArray[bI].x = 0
            }
            compactCount = 0
          }
        }
      }

      /**
       * 判断节点是否是align的末尾节点
       * @param nodeIndex
       * @param alignedRangeObjArray
       * @returns {boolean}
       */
      function is_align_end(nodeIndex, alignedRangeObjArray) {
        for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
          var rangeEndNodeIndex = alignedRangeObjArray[aI].rangeEndNodeIndex
          if (nodeIndex == rangeEndNodeIndex) {
            return true
          }
        }
        return false
      }

      // var viewUpdateValue = (self.get('viewUpdateValue') + 1) % 2
      // self.set('viewUpdateValue', viewUpdateValue)
      /**
       * @param nodeIndex
       * @returns {number}
       */
      function getAlignedNodeLoc(nodeIndex, alignedRangeObjArray, paddingNodeObjArray) {
        var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
        var comparisonResultPadding = Config.get('COMPARISON_RESULT_PADDING')
        var alignedNodeLoc = 0
        for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
          //  因为在padding node所代表的节点为空时, paddingNodeEndIndex是小于paddingNodeStartIndex的
          if ((nodeIndex >= paddingNodeObjArray[pI].paddingNodeStartIndex) || (nodeIndex >= paddingNodeObjArray[pI].paddingNodeEndIndex)) {
            if (paddingNodeObjArray[pI].isCompact) {
              // alignedNodeLoc = alignedNodeLoc + barcodeNodePadding + comparisonResultPadding
              alignedNodeLoc = alignedNodeLoc + paddingNodeObjArray[pI].realCompressPaddingNodeWidth + comparisonResultPadding
            } else {
              alignedNodeLoc = alignedNodeLoc + paddingNodeObjArray[pI].maxPaddingNodeLength + comparisonResultPadding
            }
          }
        }
        for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
          if (nodeIndex > alignedRangeObjArray[aI].rangeStartNodeIndex) {
            alignedNodeLoc = alignedNodeLoc + alignedRangeObjArray[aI].alignedLength
          }
        }
        return alignedNodeLoc
      }
    },
    _node_category: function (nodeIndex, alignedRangeObjArray, paddingNodeObjArray) {
      // console.log('paddingNodeObjArray', paddingNodeObjArray)
      var self = this
      var alignedBegin = self.get('ALIGN_START')
      var alignedRange = self.get('ALIGN_RANGE')
      var paddingRange = self.get('PADDING_RANGE')
      for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
        if (nodeIndex === (alignedRangeObjArray[aI].rangeStartNodeIndex)) {
          return alignedBegin
        }
      }
      for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
        if ((nodeIndex > (alignedRangeObjArray[aI].rangeStartNodeIndex)) && (nodeIndex <= (alignedRangeObjArray[aI].rangeEndNodeIndex))) {
          return alignedRange
        }
      }
      for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
        if ((nodeIndex >= (paddingNodeObjArray[pI].paddingNodeStartIndex)) && (nodeIndex <= (paddingNodeObjArray[pI].paddingNodeEndIndex))) {
          if (paddingNodeObjArray[pI].isCompact) {
            return paddingRange
          } else {
            return alignedRange
          }
        }
      }
    },
    /**
     * 使用tablelens的方法对于BarcodeTree的子树进行变形
     */
    tablelens_interested_subtree: function (tablelensSubtreeArray, ratioAndSubtreeObj) {
      var self = this
      var categoryNodeObjArray = self.get('categoryNodeObjArray')
      var ratioObj = ratioAndSubtreeObj.ratioObj
      var subtreeObjArray = ratioAndSubtreeObj.subtreeObjArray
      var focusRatio = ratioObj.focusRatio
      var contextRatio = ratioObj.contextRatio
      var barcodeWidthArray = window.barcodeWidthArray
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      //  初始化barcode的root节点的宽度以及位置
      var rootIndex = 0
      var rootLevel = 0
      var barcodeNodeLoc = 0
      if (isInFocus(rootIndex, subtreeObjArray)) {
        categoryNodeObjArray[rootIndex].x = barcodeNodeLoc
        categoryNodeObjArray[rootIndex].width = barcodeWidthArray[rootLevel] * focusRatio
        barcodeNodeLoc = barcodeNodeLoc + categoryNodeObjArray[rootIndex].width + barcodeNodeInterval * focusRatio
      }
      //  依次计算barcode的后续节点的宽度以及位置
      for (var cI = 1; cI < categoryNodeObjArray.length; cI++) {
        var nodeDepth = categoryNodeObjArray[cI].depth
        var nodeWidth = barcodeWidthArray[nodeDepth]
        if (isInFocus(cI, subtreeObjArray)) {
          if (nodeWidth !== 0) {
            nodeWidth = nodeWidth * focusRatio
            categoryNodeObjArray[cI].x = barcodeNodeLoc
            categoryNodeObjArray[cI].width = nodeWidth
            barcodeNodeLoc = barcodeNodeLoc + nodeWidth + barcodeNodeInterval * focusRatio
          }
        } else {
          if (nodeWidth !== 0) {
            nodeWidth = nodeWidth * contextRatio
            categoryNodeObjArray[cI].x = barcodeNodeLoc
            categoryNodeObjArray[cI].width = nodeWidth
            barcodeNodeLoc = barcodeNodeLoc + nodeWidth + barcodeNodeInterval * contextRatio
          }
        }
      }
      //  判断节点是否在focus的范围之内
      function isInFocus(bI, subtreeObjArray) {
        for (var sI = 0; sI < subtreeObjArray.length; sI++) {
          var startIndex = subtreeObjArray[sI].startIndex
          var endIndex = subtreeObjArray[sI].endIndex
          if ((bI >= startIndex) && (bI <= endIndex)) {
            return true
          }
        }
        return false
      }
    },
    /**
     *  按照alignedBarcodeNodeAttrObj获得已经align的节点的位置从而进行更新
     */
    update_aligned_barcode_node: function () {
      var self = this
      //  非compact类型的节点的更新
      var alignedDepth = Variables.get('alignedLevel')
      var alignedRangeObjArray = self.get('alignedRangeObjArray')
      // var _alignedRangeObjArray = self.get('_alignedRangeObjArray')
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      var alignedBarcodeNodeAttrArray = self.get('alignedBarcodeNodeAttrArray')
      var alignedBarcodeNodeAttrObj = self.get('alignedBarcodeNodeAttrObj')
      // console.log('before', JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
      //  compact类型的节点的更新
      var compactAlignedRangeObjArray = self.get('compactAlignedRangeObjArray')
      // var _alignedRangeObjArray = self.get('_alignedRangeObjArray')
      var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      var compactAlignedBarcodeNodeAttrArray = self.get('compactAlignedBarcodeNodeAttrArray')
      var compactAlignedBarcodeNodeAttrObj = self.get('compactAlignedBarcodeNodeAttrObj')
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        inner_update_aligned_barcode_node(alignedRangeObjArray, barcodeNodeAttrArray, alignedBarcodeNodeAttrArray)
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        //  inner_update_aligned_barcode_node(compactAlignedRangeObjArray, compactBarcodeNodeAttrArray, compactAlignedBarcodeNodeAttrArray)
      }
      function inner_update_aligned_barcode_node(alignedRangeObjArray, barcodeNodeAttrArray, alignedBarcodeNodeAttrArray) {
        for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
          var alignedRangeObj = alignedRangeObjArray[aI]
          var rangeStartNodeIndex = +alignedRangeObj.rangeStartNodeIndex
          var rangeEndNodeIndex = +alignedRangeObj.rangeEndNodeIndex
          var alignedSubtreeRootX = getAlignedBarcodeNodeAttrX(alignedBarcodeNodeAttrArray, barcodeNodeAttrArray[rangeStartNodeIndex].id)
          var originalSubtreeRootX = barcodeNodeAttrArray[rangeStartNodeIndex].x
          var subtreeRootMovedX = originalSubtreeRootX - alignedSubtreeRootX
          for (var rI = (rangeStartNodeIndex + 1); rI <= rangeEndNodeIndex; rI++) {
            var depth = barcodeNodeAttrArray[rI].depth
            if (depth <= alignedDepth) {
              var nodeId = barcodeNodeAttrArray[rI].id
              // barcodeNodeAttrArray[ rI ].x = alignedBarcodeNodeAttrObj[ nodeId ].x
              barcodeNodeAttrArray[rI].x = getAlignedBarcodeNodeAttrX(alignedBarcodeNodeAttrArray, nodeId) + subtreeRootMovedX
            }
          }
        }
      }

      // console.log('after', JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
      function getAlignedBarcodeNodeAttrX(alignedBarcodeNodeAttrArray, nodeId) {
        for (var aI = 0; aI < alignedBarcodeNodeAttrArray.length; aI++) {
          if (alignedBarcodeNodeAttrArray[aI].id === nodeId) {
            return alignedBarcodeNodeAttrArray[aI].x
          }
        }
        return 0
      }
    },
    /**
     *  按照对齐的最大深度更新barcode节点的位置
     *  这个方法是按照已经aligned的节点的位置, 依次计算得到unaligned节点的位置
     */
    update_unaligned_barcode_node: function () {
      var self = this
      //  更新原始的非对齐的barcode节点
      var alignedRangeObjArray = self.get('alignedRangeObjArray')
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      //  更新compact形式的非对齐barcode节点
      var compactAlignedRangeObjArray = self.get('compactAlignedRangeObjArray')
      var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        // 增加了变量previousNode节点, 所代表的含义是当前节点的前一个存在的节点
        inner_update_unaligned_barcode_node(alignedRangeObjArray, barcodeNodeAttrArray)
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        // inner_update_compact_unaligned_barcode_node(compactAlignedRangeObjArray, compactBarcodeNodeAttrArray)
      }
      //  对于focus部分的非aligned的节点部分
      function inner_update_unaligned_barcode_node(alignedRangeObjArray, barcodeNodeAttrArray) {
        var previousNode = null
        var barcodeNodeGap = Variables.get('barcodeNodeInterval')
        var alignedDepth = Variables.get('alignedLevel')
        for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
          var alignedRangeObj = alignedRangeObjArray[aI]
          var barcodeWidthArray = Variables.get('barcodeWidthArray')
          var rangeStartNodeIndex = +alignedRangeObj.rangeStartNodeIndex
          var rangeEndNodeIndex = +alignedRangeObj.rangeEndNodeIndex
          var alignedLevel = +barcodeNodeAttrArray[rangeStartNodeIndex].depth
          var alignedNodeId = barcodeNodeAttrArray[rangeStartNodeIndex].id
          var nodeNumComparisonState = window.Datacenter.barcodeCollection.get_node_num_comparison_state(alignedNodeId)
          alignedLevel = alignedLevel > alignedDepth ? alignedLevel : alignedDepth
          //  计算aligned之后对齐节点的节点宽度值
          var alignedWidth = barcodeWidthArray[alignedLevel]
          if ((alignedLevel + 1) < barcodeWidthArray.length) {
            if (barcodeWidthArray[alignedLevel + 1] !== 0) {
              alignedWidth = barcodeWidthArray[alignedLevel + 1]
            }
          }
          for (var rI = rangeStartNodeIndex; rI < rangeEndNodeIndex; rI++) {
            if (previousNode != null) {
              var depth = barcodeNodeAttrArray[rI].depth
              //  由于存在这个判断, 所以计算的开始节点是rangeStartNodeIndex + 1
              if (depth > alignedDepth) {
                //  当节点的深度大于aligned的深度时, 此时需要考虑节点是否存在的问题, 不存在的节点的宽度为0, 同时也不需要增加gap
                if (barcodeNodeAttrArray[rI].existed) {
                  //  当节点属性中的existed为true
                  if ((rI - 1) >= 0) {
                    if (barcodeNodeAttrArray[rI - 1].width !== 0) {
                      //  防止出现之前的节点的宽度比align宽度更大的情况
                      if ((alignedWidth > previousNode.width) && nodeNumComparisonState) {
                        barcodeNodeAttrArray[rI].x = previousNode.x + alignedWidth + barcodeNodeGap
                      } else {
                        barcodeNodeAttrArray[rI].x = previousNode.x + previousNode.width + barcodeNodeGap
                      }
                    } else {
                      if (depth > previousNode.depth) {
                        //  防止出现之前的节点的宽度比align宽度更大的情况
                        if ((alignedWidth > previousNode.width) && nodeNumComparisonState) {
                          barcodeNodeAttrArray[rI].x = previousNode.x + alignedWidth + barcodeNodeGap
                        } else {
                          barcodeNodeAttrArray[rI].x = previousNode.x + previousNode.width + barcodeNodeGap
                        }
                      } else {
                        barcodeNodeAttrArray[rI].x = barcodeNodeAttrArray[rI - 1].x
                      }
                    }
                  } else {
                    barcodeNodeAttrArray[rI].x = 0
                  }
                } else {
                  //  当节点属性中的existed为false
                  if ((rI - 1) >= 0) {
                    barcodeNodeAttrArray[rI].x = barcodeNodeAttrArray[rI - 1].x
                  } else {
                    barcodeNodeAttrArray[rI].x = 0
                  }
                }
                barcodeNodeAttrArray[rI].beyondAlign = true
              } else {
                barcodeNodeAttrArray[rI].beyondAlign = false
              }
            }
            //  选择初始节点, 后续节点依次在初始节点上增加x, 从而组成barcode
            //  初始节点的选择需要保证节点存在, 并且节点的宽度不为0; 或者节点的层次是对齐的层级以上, 即该节点已经对齐
            if (((barcodeNodeAttrArray[rI].existed) && (barcodeNodeAttrArray[rI].width != 0)) || (barcodeNodeAttrArray[rI].depth <= alignedDepth)) {
              previousNode = barcodeNodeAttrArray[rI]
            }
          }
        }
      }

      function inner_update_compact_unaligned_barcode_node(compactAlignedRangeObjArray, compactBarcodeNodeAttrArray) {
        var previousDepth = 0
        var previousRectWidth = 0
        var previousCompact = false
        var compactCount = 0
        var barcodeNodeGap = Variables.get('barcodeNodeInterval')
        var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
        var ABSOLUTE_COMPACT_CHILDREN = Config.get('CONSTANT')['ABSOLUTE_COMPACT_CHILDREN']
        var PER_GAP_WIDTH = Config.get('PER_GAP_WIDTH')
        var alignedDepth = Variables.get('alignedLevel')
        var selectedLevels = window.selectedLevels
        var compactNum = window.compactNum
        for (var aI = 0; aI < compactAlignedRangeObjArray.length; aI++) {
          var compactAlignedRangeObj = compactAlignedRangeObjArray[aI]
          var rangeStartNodeIndex = +compactAlignedRangeObj.rangeStartNodeIndex
          var rangeEndNodeIndex = +compactAlignedRangeObj.rangeEndNodeIndex
          var xLoc = compactBarcodeNodeAttrArray[rangeStartNodeIndex].x + compactBarcodeNodeAttrArray[rangeStartNodeIndex].width + barcodeNodeGap
          for (var rI = (rangeStartNodeIndex + 1); rI < rangeEndNodeIndex; rI++) {
            var depth = compactBarcodeNodeAttrArray[rI].depth
            var barcodeNodeId = compactBarcodeNodeAttrArray[rI].id
            var compactAttr = compactBarcodeNodeAttrArray[rI].compactAttr
            var rectWidth = compactBarcodeNodeAttrArray[rI].width
            if (depth > alignedDepth) {
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
                compactBarcodeNodeAttrArray[rI].x = xLoc
                if (selectedLevels.indexOf(depth) !== -1) {
                  compactCount = compactCount + 1
                  compactCount = compactCount % compactNum
                  if (rectWidth !== 0) {
                    if (compactCount === 0) {
                      xLoc = compactBarcodeNodeAttrArray[rI].x + rectWidth + PER_GAP_WIDTH
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
                compactBarcodeNodeAttrArray[rI].x = xLoc
                var rectWidth = compactBarcodeNodeAttrArray[rI].width
                if (selectedLevels.indexOf(depth) !== -1) {
                  if (rectWidth !== 0) {
                    xLoc = compactBarcodeNodeAttrArray[rI].x + rectWidth + PER_GAP_WIDTH
                    //  修改previousRectWidth和previousDepth
                    previousRectWidth = rectWidth
                    previousDepth = depth
                    previousCompact = false
                  }
                }
              }
              compactBarcodeNodeAttrArray[rI].beyondAlign = true
            } else {
              compactBarcodeNodeAttrArray[rI].beyondAlign = false
            }
          }
        }
      }


      // var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      // for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
      //   var depth = barcodeNodeAttrArray[ bI ].depth
      //   if (depth > alignedDepth) {
      //     if (!barcodeNodeAttrArray[ bI ].existed) {
      //       barcodeNodeAttrArray[ bI ].x = barcodeNodeAttrArray[ bI - 1 ].x
      //     }
      //     barcodeNodeAttrArray[ bI ].beyondAlign = true
      //   } else {
      //     barcodeNodeAttrArray[ bI ].beyondAlign = false
      //   }
      // }
    },
    /**
     *  首先更新存在部分的节点, 然后移动padding的节点, 最后更新视图
     */
    existed_first_padding_next_view_update: function () {
      var self = this
      var viewUpdateValue = (self.get('viewUpdateValue') + 1) % 2
      self.set('viewUpdateValue', viewUpdateValue)
    },
    selection_change_update: function () {
      var self = this
      var selectionUpdateValue = (self.get('selectionUpdateValue') + 1) % 2
      self.set('selectionUpdateValue', selectionUpdateValue)
    },
    /**
     * 直接一起更新视图, 没有按照节点类型分卡的先后顺序
     */
    concurrent_view_update: function () {
      var self = this
      var viewUpdateConcurrentValue = (self.get('viewUpdateConcurrentValue') + 1) % 2
      self.set('viewUpdateConcurrentValue', viewUpdateConcurrentValue)
    },
    /**
     *
     */
    aligned_move_first_padding_next_view_update: function () {
      var self = this
      var moveFirstPaddingNextUpdateValue = (self.get('moveFirstPaddingNextUpdateValue') + 1) % 2
      self.set('moveFirstPaddingNextUpdateValue', moveFirstPaddingNextUpdateValue)
    },
    // update_barcode_node_array: function () {
    //   var self = this
    //   var alignedRangeObjArray = self.get('alignedRangeObjArray')
    //   var paddingNodeObjArray = self.get('paddingNodeObjArray')
    //   var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
    //   var barcodeNodeGap = Variables.get('barcodeNodeInterval')
    //   var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
    //   //  通过padding数组中的元素, 计算align数组的范围内的节点位置
    //   for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
    //     var rangeStartNodeIndex = alignedRangeObjArray[ aI ].rangeStartNodeIndex
    //     if (aI < paddingNodeObjArray.length) {
    //       if (paddingNodeObjArray[ aI ].isCompact) {
    //         var alignedPartLength = getAlignedPartLength(alignedRangeObjArray, aI)
    //         //  第一个节点的x位置
    //         var originalMaxX = (aI + 1) * barcodeNodePadding + alignedPartLength
    //         barcodeNodeAttrArray[ rangeStartNodeIndex ].x = originalMaxX
    //         for (var rI = rangeStartNodeIndex + 1; rI < barcodeNodeAttrArray.length; rI++) {
    //           if (barcodeNodeAttrArray[ rI - 1 ].width !== 0) {
    //             barcodeNodeAttrArray[ rI ].x = barcodeNodeAttrArray[ rI - 1 ].x + barcodeNodeAttrArray[ rI - 1 ].width + barcodeNodeGap
    //           } else {
    //             barcodeNodeAttrArray[ rI ].x = barcodeNodeAttrArray[ rI - 1 ].x
    //           }
    //         }
    //       } else {
    //         var rangeStartNodeIndex = alignedRangeObjArray[ aI ].rangeStartNodeIndex
    //         var rangeStartNodeId = barcodeNodeAttrArray[ rangeStartNodeIndex ].id
    //         //  通过barcode collection计算最大的x位置
    //         var originalMaxX = window.Datacenter.barcodeCollection.get_original_max_x(rangeStartNodeId)
    //         barcodeNodeAttrArray[ rangeStartNodeIndex ].x = originalMaxX
    //         for (var rI = rangeStartNodeIndex + 1; rI < barcodeNodeAttrArray.length; rI++) {
    //           if (barcodeNodeAttrArray[ rI - 1 ].width !== 0) {
    //             barcodeNodeAttrArray[ rI ].x = barcodeNodeAttrArray[ rI - 1 ].x + barcodeNodeAttrArray[ rI - 1 ].width + barcodeNodeGap
    //           } else {
    //             barcodeNodeAttrArray[ rI ].x = barcodeNodeAttrArray[ rI - 1 ].x
    //           }
    //         }
    //       }
    //     }
    //   }
    //   console.log('paddingNodeObjArray', paddingNodeObjArray)
    //   //  更新padding node的位置
    //   self.update_padding_node_location()
    //   var viewUpdateValue = (self.get('viewUpdateValue') + 1) % 2
    //   self.set('viewUpdateValue', viewUpdateValue)
    //   //  获取总共对齐部分节点的长度
    //   function getAlignedPartLength (alignedRangeObjArray, aILocation) {
    //     var maxX = 0
    //     for (var aI = 0; aI < aILocation; aI++) {
    //       maxX = maxX + alignedRangeObjArray[ aI ].alignedLength
    //     }
    //     return maxX
    //   }
    // },
    /**
     *  计算得到paddingNode的位置。计算paddingNode的方式是按照paddingnode的startIndex值计算barcodeTree的的位置
     */
    update_padding_node_location: function () {
      var self = this
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      var compactBarcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      var paddingNodeObjArray = self.get('paddingNodeObjArray')
      var compactPaddingNodeObjArray = self.get('compactPaddingNodeObjArray')
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        inner_update_padding_node_location(paddingNodeObjArray, barcodeNodeAttrArray)
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        inner_update_padding_node_location(compactPaddingNodeObjArray, compactBarcodeNodeAttrArray)
      }
      // console.log(JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
      // console.log(JSON.parse(JSON.stringify(barcodeNodeAttrArray)))
      function inner_update_padding_node_location(paddingNodeObjArray, barcodeNodeAttrArray) {
        var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
        var comparisonResultPadding = Config.get('COMPARISON_RESULT_PADDING')
        for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
          var paddingNodeStartIndex = paddingNodeObjArray[pI].paddingNodeStartIndex
          var paddingNodeEndIndex = paddingNodeObjArray[pI].paddingNodeEndIndex
          if (paddingNodeStartIndex <= paddingNodeEndIndex) {
            paddingNodeObjArray[pI].paddingNodeX = barcodeNodeAttrArray[paddingNodeStartIndex].x
          } else {
            if (paddingNodeEndIndex < 0) {
              paddingNodeObjArray[pI].paddingNodeX = 0
            } else {
              if (paddingNodeStartIndex >= barcodeNodeAttrArray.length) {
                paddingNodeStartIndex = barcodeNodeAttrArray.length - 1
              }
              paddingNodeObjArray[pI].paddingNodeX = barcodeNodeAttrArray[paddingNodeStartIndex].x - barcodeNodePadding - barcodeNodePadding - comparisonResultPadding// + barcodeNodeAttrArray[ paddingNodeEndIndex ].width
            }
          }
          // console.log('paddingNodeEndIndex', paddingNodeEndIndex)
          // console.log('barcodeNodeAttrArray[ paddingNodeEndIndex ].x', barcodeNodeAttrArray[ paddingNodeEndIndex ].x)
          // console.log('barcodeNodeAttrArray[ paddingNodeEndIndex ].width', barcodeNodeAttrArray[ paddingNodeEndIndex ].width)
          // console.log(paddingNodeObjArray[ pI ].paddingNodeX)
        }
      }
    },
    get_node_index_from_id: function (nodeId, barcodeNodeAttrArray) {
      var self = this
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if (barcodeNodeAttrArray[bI].id === nodeId) {
          return bI
        }
      }
    },
    update_barcode_subtree: function (rootId, rootCategory, rootLevel, maxX, subtreeNodeArray, alignedNodeIdArray) {
      var self = this
      var subtreeRootIndex = -1
      var subtreeEndIndex = -1
      var subtreeLength = 1
      var barcodeAlignNodeGap = Config.get('BARCODE_ALIGNED_NODE_GAP')
      //  保存最初始状态下的节点数组, 数组中保存着节点的位置信息
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      var replacedNodeAttrObj = {}
      var back_up_barcodeNodeAttrArray = _.clone(barcodeNodeAttrArray)
      self.set('back_up_barcodeNodeAttrArray', back_up_barcodeNodeAttrArray)
      //  获取点击的节点在该子树中的index值
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if (barcodeNodeAttrArray[bI].id === rootId) {
          subtreeRootIndex = bI
          break
        }
      }
      //  如果在该子树中存在想要替换的子树, 那么计算该子树的长度, 否则替换的子树长度为0
      if (subtreeRootIndex !== -1) {
        for (var bI = (subtreeRootIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[bI].depth > rootLevel) {
            subtreeEndIndex = bI
            subtreeLength = subtreeLength + 1
          } else if (barcodeNodeAttrArray[bI].depth <= rootLevel) {
            break
          }
        }
      } else {
        var rootCategoryNum = +rootCategory
        //  不能够找到该节点的情况下
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          var thisCategory = +barcodeNodeAttrArray[bI].category
          if ((thisCategory != NaN) && (rootCategoryNum != NaN)) {
            if (thisCategory > rootCategoryNum) {
              subtreeRootIndex = bI
              break
            }
          }
        }
        subtreeLength = 0
      }
      if (subtreeRootIndex === -1) {
        subtreeRootIndex = barcodeNodeAttrArray.length
      }
      // //  如果在遍历所有的barcode之后仍然找不到该子树应该所在的位置, 那么就将子树放到最后
      // if (subtreeRootIndex === -1) {
      //   subtreeRootIndex = barcodeNodeAttrArray.length - 1
      // }
      //  插入节点数组
      var replacedNodesArray = barcodeNodeAttrArray.splice(subtreeRootIndex, subtreeLength,...subtreeNodeArray
      )
      //  对齐的子树的长度, 用来对于子树进行对齐
      var subtreeNodeArrayLength = subtreeNodeArray.length
      //  对于barcodeNodeAttrArray建立索引, 方便判断该节点是否在之前存在
      // for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
      //   barcodeNodeAttrObj[ barcodeNodeAttrArray[ bI ].id ] = barcodeNodeAttrArray[ bI ]
      // }
      //  对于替换的节点数组建立索引
      for (var rI = 0; rI < replacedNodesArray.length; rI++) {
        replacedNodeAttrObj[replacedNodesArray[rI].id] = replacedNodesArray[rI]
      }
      //  遍历新增加的节点, 如果之前存在并且exist属性为true, 则existed属性设置为true
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        var nodeId = barcodeNodeAttrArray[bI].id
        if (typeof(replacedNodeAttrObj[nodeId]) !== 'undefined') {
          if (replacedNodeAttrObj[nodeId].existed) {
            barcodeNodeAttrArray[bI].existed = true
          }
        }
      }
      // 将插入的节点数组, 后面的节点继续向后进行移动, 一直到整个数组是连续的
      barcodeNodeAttrArray[subtreeRootIndex].x = maxX
      var nodeGap = Variables.get('barcodeNodeInterval') //barcodeNodeAttrArray[ 1 ].x - (barcodeNodeAttrArray[ 0 ].x + barcodeNodeAttrArray[ 0 ].width)
      var alignedObjArray = []
      for (var bI = (subtreeRootIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {//(subtreeRootIndex + 1)
        var thisNodeId = barcodeNodeAttrArray[bI].id
        var thisNodeX = barcodeNodeAttrArray[bI].x
        var formerNodeX = barcodeNodeAttrArray[bI - 1].x
        var formerNodeWidth = barcodeNodeAttrArray[bI - 1].width
        //  下一个节点是对齐的节点, 并且距离aligned节点之间存在一定的间隙, 则不对该节点进行移动, 否则按照计算的准则更改节点的位置
        if (alignedNodeIdArray.indexOf(thisNodeId) !== -1) { //&& (bI !== subtreeRootIndex))
          var computedNodeX = formerNodeX + formerNodeWidth + nodeGap
          //  如果计算得到的节点的位置x大于当前的节点, 即可能遇到下一个对齐的部分, 对于下一个对齐的部分应该怎样移动
          if (computedNodeX > thisNodeX) {
            alignedObjArray.push({'alignedNodeId': thisNodeId, 'alignedNodeX': computedNodeX})
            barcodeNodeAttrArray[bI].x = computedNodeX
          }
        } else {
          if (barcodeNodeAttrArray[bI - 1].width !== 0) {
            barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width + nodeGap
          } else {
            barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI - 1].x
          }
          if (bI === (subtreeRootIndex + subtreeNodeArrayLength)) {
            barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI].x + barcodeAlignNodeGap
          }
        }
      }
      return alignedObjArray
      // var alignedObj = { 'alignedNodeId': alignedNodeId, 'movedX': movedX }
      // for (var bI = (subtreeRootIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {//(subtreeRootIndex + 1)
      //   var thisNodeId = barcodeNodeAttrArray[ bI ].id
      //   var thisNodeX = barcodeNodeAttrArray[ bI ].x
      //   var formerNodeX = barcodeNodeAttrArray[ bI - 1 ].x
      //   var formerNodeWidth = barcodeNodeAttrArray[ bI - 1 ].width
      //   //  下一个节点是对齐的节点, 并且距离aligned节点之间存在一定的间隙, 则不对该节点进行移动, 否则按照计算的准则更改节点的位置
      //   if (alignedNodeIdArray.indexOf(thisNodeId) !== -1) { //&& (bI !== subtreeRootIndex))
      //     var computedNodeX = formerNodeX + formerNodeWidth + nodeGap
      //     //  如果计算得到的节点的位置x大于当前的节点, 即可能遇到下一个对齐的部分, 对于下一个对齐的部分应该怎样移动
      //     if (computedNodeX > thisNodeX) {
      //       alignedObj.movedX = computedNodeX - thisNodeX
      //     }
      //     alignedObj.alignedNodeId = thisNodeId
      //     break
      //   } else {
      //     if (barcodeNodeAttrArray[ bI - 1 ].width !== 0) {
      //       barcodeNodeAttrArray[ bI ].x = barcodeNodeAttrArray[ bI - 1 ].x + barcodeNodeAttrArray[ bI - 1 ].width + nodeGap
      //     } else {
      //       barcodeNodeAttrArray[ bI ].x = barcodeNodeAttrArray[ bI - 1 ].x
      //     }
      //     if (bI === (subtreeRootIndex + subtreeNodeArrayLength)) {
      //       barcodeNodeAttrArray[ bI ].x = barcodeNodeAttrArray[ bI ].x + barcodeAlignNodeGap
      //     }
      //   }
      // }
      // return alignedObj
    },
    update_covered_rect_obj: function () {
      var self = this
      var alignedNodeIdArray = Variables.get('alignedNodeIdArray')
      var barcodeNodeAttrArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        barcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      }
      var coveredRectObjArray = []
      if (alignedNodeIdArray.length !== 0) {
        coveredRectObjArray.push({
          'startX': 0
        })
        var alignedNodeLevel = -1
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          var barcodeNodeId = barcodeNodeAttrArray[bI].id
          var barcodeNodeDepth = barcodeNodeAttrArray[bI].depth
          if (barcodeNodeDepth <= alignedNodeLevel) {
            coveredRectObjArray.push({
              'startX': barcodeNodeAttrArray[bI].x
            })
            alignedNodeLevel = -1
          }
          if (alignedNodeIdArray.indexOf(barcodeNodeId) !== -1) {
            if (bI !== 0) {
              coveredRectObjArray[coveredRectObjArray.length - 1].endX = barcodeNodeAttrArray[bI - 1].x + barcodeNodeAttrArray[bI - 1].width
            } else {
              coveredRectObjArray[coveredRectObjArray.length - 1].endX = 0
            }
            alignedNodeLevel = barcodeNodeAttrArray[bI].depth
          }
        }
        if (typeof(coveredRectObjArray[coveredRectObjArray.length - 1].endX) === 'undefined') {
          coveredRectObjArray[coveredRectObjArray.length - 1].endX = barcodeNodeAttrArray[barcodeNodeAttrArray.length - 1].x + barcodeNodeAttrArray[barcodeNodeAttrArray.length - 1].width
        }
        var cloneCoveredRectObjArray = JSON.parse(JSON.stringify(coveredRectObjArray))
        self.set('coveredRectObjArray', cloneCoveredRectObjArray)
      }
    },
    //  根据当前所处的状态获取barcodeNodeAttrArray
    get_barcode_node_attr_array: function () {
      var self = this
      var barcodeNodeAttrArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        barcodeNodeAttrArray = self.get('compactBarcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
        barcodeNodeAttrArray = self.get('categoryNodeObjArray')
      }
      return barcodeNodeAttrArray
    },
    get_node_location: function (rootId) {
      var self = this
      var nodeLocation = null
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if (barcodeNodeAttrArray[bI].id === rootId) {
          nodeLocation = barcodeNodeAttrArray[bI].x
          break
        }
      }
      return nodeLocation
    },
    align_barcode_subtree: function (alignedObjArray, alignedNodeIdArray) {
      var self = this
      var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
      var moveX = null
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        for (var aI = 0; aI < alignedObjArray.length; aI++) {
          if (barcodeNodeAttrArray[bI].id === alignedObjArray[aI].alignedNodeId) {
            moveX = alignedObjArray[aI].alignedNodeX - barcodeNodeAttrArray[bI].x
          }
        }
        if ((moveX != null) && (moveX > 0)) {
          barcodeNodeAttrArray[bI].x = barcodeNodeAttrArray[bI].x + moveX
        }
      }
      // self.update_covered_rect_obj(alignedNodeIdArray)
    },
    /**
     * 计算得到barcode与当前的basedBarcodeModel比较的差别大小
     */
    get_node_difference: function () {
      var self = this
      var alignedComparisonResultArray = self.get('alignedComparisonResultArray')
      var nodeDifference = 0
      if (alignedComparisonResultArray != null) {
        //  因为存在不同的对齐区间
        var sumAdded = 0
        var sumMissed = 0
        var sumSame = 0
        for (var aI = 0; aI < alignedComparisonResultArray.length; aI++) {
          var alignedComparisonResultObj = alignedComparisonResultArray[aI]
          var addedNodeIdArray = alignedComparisonResultObj.addedNodeIdArray
          sumAdded = sumAdded + addedNodeIdArray.length
          var missedNodeIdArray = alignedComparisonResultObj.missedNodeIdArray
          sumMissed = sumMissed + missedNodeIdArray.length
          var sameNodeIdArray = alignedComparisonResultObj.sameNodeIdArray
          sumSame = sumSame + sameNodeIdArray.length
        }
        nodeDifference = sumSame / (sumMissed + sumAdded + sumSame)
      }
      return nodeDifference
    }
    // align_barcode_subtree: function (alignedNodeId, maxMoveX, alignedNodeIdArray) {
    //   var self = this
    //   var barcodeNodeAttrArray = self.get('barcodeNodeAttrArray')
    //   var moveBeginNodeIndex = null
    //   for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
    //     if (barcodeNodeAttrArray[ bI ].id === alignedNodeId) {
    //       moveBeginNodeIndex = bI
    //     }
    //   }
    //   if (moveBeginNodeIndex != null) {
    //     for (var mI = moveBeginNodeIndex; mI < barcodeNodeAttrArray.length; mI++) {
    //       barcodeNodeAttrArray[ mI ].x = barcodeNodeAttrArray[ mI ].x + maxMoveX
    //     }
    //   }
    //   // self.update_covered_rect_obj(alignedNodeIdArray)
    // }
  })
})
