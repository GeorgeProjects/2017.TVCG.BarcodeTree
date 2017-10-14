define([
  'require',
  'marionette',
  'underscore',
  'jquery',
  'backbone',
  'd3',
  'd4',
  'd3Tip',
  'datacenter',
  'config',
  'variables',
  'views/svg-base.addon',
  'text!templates/barcodeMainView.tpl'
], function (require, Mn, _, $, Backbone, d3, d4, d3Tip, Datacenter, Config, Variables, SVGBase, Tpl) {
  'use strict'
  /**
   * 需要barcode-main的Layoutview转换成ItemView，将所有的barcode的元素都绘制在这个view上面
   * 但是需要对于这个view的更新进行更好的管理，保证更新的效率，比如说将所有的barcode组装到一个g上面，在更新位置的时候对于g进行统一的更新
   * 选择的时候先选择对应的g然后继续选择g上面的元素，防止对于svg上面其他的元素进不必要的更新
   */
  return Mn.ItemView.extend(_.extend({
    tagName: 'svg',
    index: 0,
    template: false,
    attributes: {
      style: 'width: 100%; height: 100%;',
      id: 'barcode-main-svg'
    },
    width: 0,
    height: 0,
    events: {},
    //  self.el获取的是当前的itemview所指代的元素svg
    initialize: function (options) {
      var self = this
      self.d3el = d3.select(self.el)
      var width = $('#barcode-panel-scroll').width()
      var height = $('#barcode-panel-scroll').height()
      Variables.set('barcodeViewHeight', height)
      Variables.set('barcodeViewWidth', width)
      self.height = height
      self.width = width
      self.d3el.attr('width', width)
        .attr('height', height)
      Backbone.Events.on('resize', function () {
        self.draw_barcode()
      })
      self.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([ -10, 0 ])
        .html(function (d) {
          return d
        })
      Backbone.Events.on(Config.get('EVENTS')[ 'RENDER_BARCODE' ], function () {
        self.draw_barcode()
      })
      Backbone.Events.on(Config.get('EVENTS')[ 'TRANSITON_ORIGINAL_TO_COMPACT' ], function () {
        self.transition_original_to_compact()
      })
      Backbone.Events.on(Config.get('EVENTS')[ 'TRANSITON_COMPACT_TO_ORIGINAL' ], function () {
        self.transition_compact_to_original()
      })
      Backbone.Events.on(Config.get('EVENTS')[ 'RENDER_SUPERTREE_BARCODE' ], function () {
        self.draw_supertree_barcode()
      })
      // Backbone.Events.on('transition-dataitem-original-to-compact', function () {
      //   self.transition_item_original_to_compact()
      // })
      Backbone.Events.on(Config.get('EVENTS')[ 'NODE_MOUSE_OUT' ], function () {
        self.mouseout_handler()
        self.tip.hide()
      })
      Backbone.Events.on(Config.get('EVENTS')[ 'RENDER_SUPERTREELINE_BARCODE' ], function () {
        self.draw_supertreeline_barcode()
      })
      Backbone.Events.on(Config.get('EVENTS')[ 'RENDER_WHOLE_TO_SUPERTREE' ], function () {
        self.draw_supertreeline_barcode()
      })
    },
    trigger_render_datelinechart: function () {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'RENDER_DATELINE_CHART' ])
    },
    trigger_highlight_tree: function (selectedTreeId) {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'HIGHLIGHT_SELECTED_TREE' ], {
        'selectedTreeId': selectedTreeId
      })
    },
    trigger_unhighlight_tree: function () {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UNHIGHLIGHT_SELECTED_TREE' ])
    },
    transition_compact_to_original: function () {
      var self = this
      var dataSetName = Variables.get('currentDataSetName')
      var barcodeCollectionModel = self.options.barcodeCollection
      var compactDataSet = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ]
      var originalDataSet = barcodeCollectionModel.originalBarcodeDataCollectionObject[ dataSetName ]
      var superDataSet = barcodeCollectionModel.superBarcodeDataCollectionObject[ dataSetName ]
      var barcodeCategory = Variables.get('barcodeCategory')
      var selectBarNameArray = Variables.get('selectBarNameArray')
      if (barcodeCategory === 'single') {
        for (var item in compactDataSet) {
          var barcodeNodeLocArrayArray = []
          var compactArrayArray = compactDataSet[ item ].treeNodeArray
          for (var i = (compactArrayArray.length - 1); i >= 0; i--) {
            barcodeNodeLocArrayArray.push(compactArrayArray[ i ])
          }
          self.draw_transition(barcodeNodeLocArrayArray, 0, item, dataSetName)
        }
      } else if ((barcodeCategory === 'super') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
        var superBarcodeNodeLocArrayArray = []
        var superArrayArray = superDataSet.treeNodeArray
        for (var sI = (superArrayArray.length - 1); sI >= 0; sI--) {
          superBarcodeNodeLocArrayArray.push(compactArrayArray[ sI ])
        }
        for (var sbI = 0; sbI < selectBarNameArray.length; sbI++) {
          var itemWithJson = selectBarNameArray[ sbI ]
          self.draw_transition(superBarcodeNodeLocArrayArray, 0, itemWithJson, dataSetName)
        }
      }
    },
    transition_item_compact_to_original: function (dataItem) {
      var self = this
      var barcodeCollectionModel = self.options.barcodeCollection
      var dataSetName = Variables.get('currentDataSetName')
      var compactDataSet = null
      var compactArrayArray = []
      var barcodeCategory = Variables.get('barcodeCategory')
      var selectBarNameArray = Variables.get('selectBarNameArray')
      if (barcodeCategory === 'single') {
        compactDataSet = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ]
        compactArrayArray = compactDataSet[ dataItem ].treeNodeArray
      } else if ((barcodeCategory === 'super') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
        compactDataSet = barcodeCollectionModel.superBarcodeDataCollectionObject[ dataSetName ]
        compactArrayArray = compactDataSet.treeNodeArray
      }
      var barcodeNodeLocArrayArray = []
      for (var i = (compactArrayArray.length - 1); i >= 0; i--) {
        barcodeNodeLocArrayArray.push(compactArrayArray[ i ])
      }
      var transitionDefer = $.Deferred()
      self.draw_transition(barcodeNodeLocArrayArray, 0, dataItem, dataSetName, transitionDefer)
      var barcodeMode = Config.get('BARCODE_MODE').OriginalMode
      Variables.set('barcodeMode', barcodeMode)
      $.when(transitionDefer)
        .done(function () {
          drawOriginalBarcode(dataSetName, dataItem)
        })
        .fail(function () {
          console.log('transition fail')
        })
      function drawOriginalBarcode (dataSetName, dataItem) {
        var barcodeMode = Config.get('BARCODE_MODE').OriginalMode
        var configGId = null
        var barcodeCategory = Variables.get('barcodeCategory')
        if (barcodeCategory === 'single') {
          self.update_barcode_width(compactDataSet)
          for (var item in compactDataSet) {
            // if (item !== dataItem) {
            self.draw_single_barcode(item, dataSetName, barcodeMode)
            configGId = 'barcode-config-g-' + item.replace('.json', '')
            d3.select('#' + configGId).select('#barcode-mode-icon').classed('compact-mode', false).classed('original-mode', true)
            d3.select('#' + configGId).select('#barcode-mode-icon').text(function (d) { return Config.get('BARCODE_ICON_NAME')[ 'OriginalMode' ] })
            // }
          }
        } else if ((barcodeCategory === 'super') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
          self.update_superbarcode_width(compactArrayArray[ 0 ])
          for (var sI = 0; sI < selectBarNameArray.length; sI++) {
            var dataItemWithJson = selectBarNameArray[ sI ]
            self.draw_single_barcode(dataItemWithJson, dataSetName, barcodeMode)
            configGId = 'barcode-config-g-' + dataItemWithJson.replace('.json', '')
            d3.select('#' + configGId).select('#barcode-mode-icon').classed('compact-mode', false).classed('original-mode', true)
            d3.select('#' + configGId).select('#barcode-mode-icon').text(function (d) { return Config.get('BARCODE_ICON_NAME')[ 'OriginalMode' ] })
          }
        }
      }
    },
    transition_original_to_compact: function () {
      var self = this
      var dataSetName = Variables.get('currentDataSetName')
      var barcodeCollectionModel = self.options.barcodeCollection
      var compactDataSet = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ]
      var originalDataSet = barcodeCollectionModel.originalBarcodeDataCollectionObject[ dataSetName ]
      var superDataSet = barcodeCollectionModel.superBarcodeDataCollectionObject[ dataSetName ]
      var barcodeCategory = Variables.get('barcodeCategory')
      var selectBarNameArray = Variables.get('selectBarNameArray')
      if (barcodeCategory === 'single') {
        for (var item in compactDataSet) {
          var barcodeNodeLocArrayArray = []
          // barcodeNodeLocArrayArray.push(originalDataSet[ item ].treeNodeArray)
          var compactArrayArray = compactDataSet[ item ].treeNodeArray
          for (var i = 0; i < compactArrayArray.length; i++) {
            barcodeNodeLocArrayArray.push(compactArrayArray[ i ])
          }
          self.draw_transition(barcodeNodeLocArrayArray, 0, item, dataSetName)
        }
      } else if ((barcodeCategory === 'super') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
        var superBarcodeNodeLocArrayArray = []
        var superArrayArray = superDataSet.treeNodeArray
        for (var sI = 0; sI <= (superArrayArray.length - 1); sI++) {
          superBarcodeNodeLocArrayArray.push(compactArrayArray[ sI ])
        }
        for (var sbI = 0; sbI < selectBarNameArray.length; sbI++) {
          var itemWithJson = selectBarNameArray[ sbI ]
          self.draw_transition(superBarcodeNodeLocArrayArray, 0, itemWithJson, dataSetName)
        }
      }
    },
    transition_item_original_to_compact: function (dataItem) {
      var self = this
      var dataSetName = Variables.get('currentDataSetName')
      var barcodeCollectionModel = self.options.barcodeCollection
      var compactDataSet = null
      var compactArrayArray = []
      var barcodeCategory = Variables.get('barcodeCategory')
      var selectBarNameArray = Variables.get('selectBarNameArray')
      if (barcodeCategory === 'single') {
        compactDataSet = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ]
        compactArrayArray = compactDataSet[ dataItem ].treeNodeArray
      } else if ((barcodeCategory === 'super') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
        compactDataSet = barcodeCollectionModel.superBarcodeDataCollectionObject[ dataSetName ]
        compactArrayArray = compactDataSet.treeNodeArray
      }
      var barcodeNodeLocArrayArray = []
      for (var i = 0; i < compactArrayArray.length; i++) {
        barcodeNodeLocArrayArray.push(compactArrayArray[ i ])
      }
      var transitionDefer = $.Deferred()
      self.draw_transition(barcodeNodeLocArrayArray, 0, dataItem, dataSetName, transitionDefer)
      var barcodeMode = Config.get('BARCODE_MODE').CompactMode
      Variables.set('barcodeMode', barcodeMode)
      $.when(transitionDefer)
        .done(function () {
          drawCompactBarcode(dataSetName, dataItem)
        })
        .fail(function () {
          console.log('transition fail')
        })
      function drawCompactBarcode (dataSetName, dataItem) {
        var barcodeMode = Config.get('BARCODE_MODE').CompactMode
        var barcodeCategory = Variables.get('barcodeCategory')
        if (barcodeCategory === 'single') {
          self.update_barcode_width(compactDataSet)
          for (var item in compactDataSet) {
            // if (item !== dataItem) {
            self.draw_single_barcode(item, dataSetName, barcodeMode)
            var configGId = 'barcode-config-g-' + item.replace('.json', '')
            d3.select('#' + configGId).select('#barcode-mode-icon').classed('original-mode', false).classed('compact-mode', true)
            d3.select('#' + configGId).select('#barcode-mode-icon').text(function (d) { return Config.get('BARCODE_ICON_NAME')[ 'CompactMode' ] })
            // }
          }
        } else if ((barcodeCategory === 'super') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
          self.update_superbarcode_width(compactArrayArray[ compactArrayArray.length - 1 ])
          for (var sI = 0; sI < selectBarNameArray.length; sI++) {
            var dataItemWithJson = selectBarNameArray[ sI ]
            self.draw_single_barcode(dataItemWithJson, dataSetName, barcodeMode)
            configGId = 'barcode-config-g-' + dataItemWithJson.replace('.json', '')
            d3.select('#' + configGId).select('#barcode-mode-icon').classed('original-mode', false).classed('compact-mode', true)
            d3.select('#' + configGId).select('#barcode-mode-icon').text(function (d) { return Config.get('BARCODE_ICON_NAME')[ 'OriginalMode' ] })
          }
        }
      }
    },
    update_superbarcode_width: function (superDataArray) {
      var maxWidth = 0
      var width = $('#barcode-panel-scroll').width()
      var margin = Variables.get('barcodeMargin')
      var dragRightMargin = 100
      maxWidth = superDataArray[ superDataArray.length - 1 ].x + superDataArray[ superDataArray.length - 1 ].width
      maxWidth = maxWidth + (margin.right + dragRightMargin) + margin.left
      if (maxWidth > width) {
        $('#barcode-panel-container').width(maxWidth)
      }
    },
    update_barcode_width: function (compactDataSet) {
      var maxWidth = 0
      var width = +$('#barcode-panel-scroll').width()
      for (var item in compactDataSet) {
        var compactArrayArray = compactDataSet[ item ].treeNodeArray
        var finalCompactArray = compactArrayArray[ compactArrayArray.length - 1 ]
        var innerMaxWidth = finalCompactArray[ finalCompactArray.length - 1 ].x + finalCompactArray[ finalCompactArray.length - 1 ].width
        if (innerMaxWidth > maxWidth) {
          maxWidth = innerMaxWidth
        }
      }
      var margin = Variables.get('barcodeMargin')
      var dragRightMargin = 100
      maxWidth = maxWidth + (margin.right + dragRightMargin) + margin.left
      if (maxWidth > width) {
        $('#barcode-panel-container').width(maxWidth)
      }
    },
    draw_transition: function (barcodeNodeLocArrayArray, index, itemName, dataSetName, transitionDefer) {
      var self = this
      var svg = self.d3el
      var DURATION = Config.get('TRANSITON_DURATION')
      var selectBarNameArray = Variables.get('selectBarNameArray')
      itemName = itemName.replace('.json', '')
      var itemNameWithJson = itemName + '.json'
      var itemNameIndex = selectBarNameArray.indexOf(itemNameWithJson)
      var barcodeNodeLocArrayLen = +barcodeNodeLocArrayArray.length
      d3.select('#barcode-g-' + itemName).selectAll('.tree-line').attr('visibility', 'hidden')
      if (index >= barcodeNodeLocArrayLen) {
        //  TODO 为了测试superTree
        // self.drawTreeLine(barcodeNodeLocArrayArray[ barcodeNodeLocArrayLen - 1 ], itemName)
        if (typeof (transitionDefer) !== 'undefined') {
          transitionDefer.resolve()
        }
        return
      }
      var barcodeGElements = svg.select('#barcode-g-' + itemName)
        .selectAll('.barcode-rect')
        .data(barcodeNodeLocArrayArray[ index ], function (d, i) {
          return d.nodeLabel
        })
      barcodeGElements.attr('class', function (d, i) {
        var itemClassArray = []
        var barcodeRectClass = 'barcode-rect'
        var barcodeItemName = 'barcode-' + itemName
        var itemClass = 'barcode-' + d.fatherClass + '-' + d.depth
        var missingClass = 'barcode-missing'
        var existClass = 'barcode-exist'
        if (typeof (d.existArray[ itemNameIndex ]) !== 'undefined') {
          itemClassArray.push(existClass)
          itemClassArray.push(barcodeRectClass)
          itemClassArray.push(barcodeItemName)
          itemClassArray.push(itemClass)
        } else {
          itemClassArray.push(missingClass)
          itemClassArray.push(barcodeRectClass)
          itemClassArray.push(barcodeItemName)
          itemClassArray.push(itemClass)
        }
        return self._group_class(itemClassArray)
      })
        .attr('id', function (d, i) {
          return 'barcode-' + itemName + '-' + i
        })
        .transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return +d.x
        })
        .attr('y', function (d, i) {
          return +d.y
        })
        .attr('height', function (d, i) {
          return +d.height
        })
        .attr('width', function (d, i) {
          return +d.width
        })
        .call(endall, function (d, i) {
          var newIndex = index + 1
          self.draw_transition(barcodeNodeLocArrayArray, newIndex, itemName, dataSetName, transitionDefer)
        })
      barcodeGElements.enter()
        .append('rect')
        .attr('class', function (d, i) {
          var itemClassArray = []
          var barcodeRectClass = 'barcode-rect'
          var barcodeItemName = 'barcode-' + itemName
          var itemClass = 'barcode-' + d.fatherClass + '-' + d.depth
          var missingClass = 'barcode-missing'
          var existClass = 'barcode-exist'
          if (typeof (d.existArray[ itemNameIndex ]) !== 'undefined') {
            itemClassArray.push(existClass)
            itemClassArray.push(barcodeRectClass)
            itemClassArray.push(barcodeItemName)
            itemClassArray.push(itemClass)
          } else {
            itemClassArray.push(missingClass)
            itemClassArray.push(barcodeRectClass)
            itemClassArray.push(barcodeItemName)
            itemClassArray.push(itemClass)
          }
          return self._group_class(itemClassArray)
        })
        .attr('id', function (d, i) {
          return 'barcode-' + itemName + '-' + i
        })
        .attr('x', function (d, i) {
          return +d.x
        })
        .attr('y', function (d, i) {
          return +d.y
        })
        .attr('height', function (d, i) {
          return +d.height
        })
        .attr('width', function (d, i) {
          return +d.width
        })
        .on('mouseover', function (d, i) {
          if ((typeof (d.existArray) === 'undefined') ||
            ((typeof (d.existArray) !== 'undefined') && (d.existArray[ itemNameIndex ]))) {
            var parentNodeId = $(this).parent().attr('id')
            self.mouseout_handler(parentNodeId)
            var id = $(this).attr('id')
            var idSplitArray = id.split('-')
            var nodeIndex = +idSplitArray[ idSplitArray.length - 1 ]
            var nodeDepth = d.depth
            var selectedTreeId = parentNodeId.replace('barcode-g-', 'tree-')
            self.trigger_highlight_tree(selectedTreeId)
            if (d.fatherNameLabel != null) {
              self.tip.show(d.fatherNameLabel)
            }
            self.mouseover_handler(nodeIndex, parentNodeId, dataSetName, itemName)
          } else {
            self.mouseout_handler(parentNodeId)
          }
        })
        .on('mouseout', function (d, i) {
          self.trigger_unhighlight_tree()
        })
        .on('click', function (d, i) {
          console.log('d', d)
        })
      barcodeGElements.exit().remove()
      function endall (transition, callback) {
        if (transition.size() === 0) { callback() }
        var n = 0
        transition
          .each(function () { ++n })
          .each('end', function () { if (!--n) callback.apply(this, arguments) })
      }
    },
    drawTreeLine: function (nodeLocationArray, itemName, dataSetName) {
      var self = this
      var depth = +Variables.get('maxDepth')
      var barHeight = +Variables.get('barcodeHeight')
      var fullHeight = barHeight / (depth + 1)
      var maxTreeNodeWidth = Variables.get('maxTreeNodeWidth')
      var DURATION = Config.get('MOVE_DURATION')
      var itemWithJson = itemName + '.json'
      var selectBarNameArray = Variables.get('selectBarNameArray')
      var itemNameIndex = selectBarNameArray.indexOf(itemWithJson)
      d3.select('#barcode-g-' + itemName).selectAll('.tree-line').remove()
      d3.select('#barcode-g-' + itemName).selectAll('.tree-line').attr('visibility', 'visible')
      var domainArray = []
      var barcodeSingleWidthArrayObj = Variables.get('barcodeSingleWidthArrayObj')
      var itemNameRemoveJson = itemName.replace('.json', '')
      var singleWidthArray = barcodeSingleWidthArrayObj[ itemNameRemoveJson ]
      var depth = +Variables.get('maxDepth')
      var barcodeCategory = Variables.get('barcodeCategory')
      for (var i = 0; i <= depth; i++) {
        if (typeof (singleWidthArray) !== 'undefined') {
          if ((singleWidthArray[ i ] !== 0)) { //  && (typeof (singleWidthArray[ i ]) !== 'undefined')
            domainArray.push(i)
          }
        } else {
          domainArray.push(i)
        }
      }
      var domainBegin = domainArray[ 0 ] - 1
      var domainEnd = domainArray[ domainArray.length - 2 ] + 1
      var yScale = d3.scale.linear()
        .range([ 0, barHeight ])
        .domain([ domainBegin, domainEnd ])
      console.log('maxTreeNodeWidth', maxTreeNodeWidth)
      var heightScale = d3.scale.pow().exponent(1 / 3)
        .range([ 0, fullHeight ])
        .domain([ 0, maxTreeNodeWidth ])

      var treeLineElement = d3.select('#barcode-g-' + itemName)
        .selectAll('.tree-line')
        .data(nodeLocationArray, function (d, i) {
          return d.nodeLabel
        })

      treeLineElement.attr('class', function (d, i) {
        var itemClass = 'treeline-' + d.fatherClass + '-' + d.depth
        return 'tree-line ' + 'treeline-' + itemName + ' ' + itemClass
      })
        .attr('id', function (d, i) {
          return 'treeline-' + itemName + '-' + i
        })
        .transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          if (d.existArray[ itemNameIndex ]) {
            var toIndex = d.toIndex
            if (i === toIndex) {
              return +d.x
            }
            return +d.x + d.width / 2
          } else {
            return 0
          }
        })
        .attr('y', function (d, i) {
          if (d.existArray[ itemNameIndex ]) {
            var depth = +d.depth
            var height = 0
            if (barcodeCategory === 'single') {
              height = +heightScale(d.treeWidth)
            } else if (barcodeCategory === 'super') {
              height = +heightScale(d.treeWidthObj[ itemNameIndex ])
            }
            return +yScale(depth) - height / 2
          } else {
            return 0
          }
        })
        .attr('height', function (d, i) {
          if (d.existArray[ itemNameIndex ]) {
            var height = 0
            if (barcodeCategory === 'single') {
              height = +heightScale(d.treeWidth)
            } else if (barcodeCategory === 'super') {
              height = +heightScale(d.treeWidthObj[ itemNameIndex ])
            }
            return height
          } else {
            return 0
          }
        })
        .attr('width', function (d, i) {
          if (d.existArray[ itemNameIndex ]) {
            if ((typeof (d.toIndex) !== 'undefined') && (d.width !== 0)) {
              var toIndex = d.toIndex
              if (d.isCompact) {
                return 0
              }
              if (i === toIndex) {
                return +d.width
              }
              var toElementX = +nodeLocationArray[ toIndex ].x + nodeLocationArray[ toIndex ].width / 2
              var width = toElementX - (d.x + d.width / 2)
              return width
            } else {
              return 0
            }
          } else {
            return 0
          }
        })
      treeLineElement.enter()
        .append('rect')
        .attr('class', function (d, i) {
          var itemClass = 'treeline-' + d.fatherClass + '-' + d.depth
          return 'tree-line ' + 'treeline-' + itemName + ' ' + itemClass
        })
        .attr('id', function (d, i) {
          return 'treeline-' + itemName + '-' + i
        })
        .attr('x', function (d, i) {
          if (d.existArray[ itemNameIndex ]) {
            var toIndex = d.toIndex
            if (i === toIndex) {
              return +d.x
            }
            return +d.x + d.width / 2
          } else {
            return 0
          }
        })
        .attr('y', function (d, i) {
          if (d.existArray[ itemNameIndex ]) {
            var depth = +d.depth
            var height = 0
            if (barcodeCategory === 'single') {
              height = +heightScale(d.treeWidth)
            } else if (barcodeCategory === 'super') {
              var height = +heightScale(d.treeWidthObj[ itemNameIndex ])
            }
            return +yScale(depth) - height / 2
          } else {
            return 0
          }
        })
        .attr('height', function (d, i) {
          if (d.existArray[ itemNameIndex ]) {
            var height = 0
            if (barcodeCategory === 'single') {
              height = +heightScale(d.treeWidth)
            } else if (barcodeCategory === 'super') {
              height = +heightScale(d.treeWidthObj[ itemNameIndex ])
            }
            return height
          } else {
            return 0
          }
        })
        .attr('width', function (d, i) {
          if (d.existArray[ itemNameIndex ]) {
            if ((typeof (d.toIndex) !== 'undefined') && (d.width !== 0)) {
              var toIndex = d.toIndex
              if (d.isCompact) {
                return 0
              }
              if (i === toIndex) {
                return +d.width
              }
              var toElementX = +nodeLocationArray[ toIndex ].x + nodeLocationArray[ toIndex ].width / 2
              var width = toElementX - (d.x + d.width / 2)
              return width
            } else {
              return 0
            }
          } else {
            return 0
          }
        })
        .on('mouseover', function (d, i) {
          self.tip.hide()
          if ((typeof (d.existArray) === 'undefined') ||
            ((typeof (d.existArray) !== 'undefined') && (d.existArray[ itemNameIndex ]))) {
            var parentNodeId = $(this).parent().attr('id')
            self.mouseout_handler(parentNodeId)
            var id = $(this).attr('id')
            var idSplitArray = id.split('-')
            var nodeIndex = +idSplitArray[ idSplitArray.length - 1 ]
            var selectedTreeId = parentNodeId.replace('barcode-g-', 'tree-')
            self.trigger_highlight_tree(selectedTreeId)
            self.mouseover_handler(nodeIndex, parentNodeId, dataSetName, itemName)
          } else {
            self.mouseout_handler(parentNodeId)
          }
        })
        .on('mouseout', function (d, i) {
          self.tip.hide()
          self.trigger_unhighlight_tree()
        })
        .on('click', function (d, i) {})
      treeLineElement.exit().remove()
    },
    draw_supertree_barcode: function () {
      var self = this
      var width = +$('#barcode-panel-scroll').width()
      var height = +$('#barcode-panel-scroll').height()
      var dataSetName = Variables.get('currentDataSetName')
      var barcodeMode = Variables.get('barcodeMode')
      var barcodeCollectionModel = self.options.barcodeCollection
      var superTreeBarcodeNodeLocArray = barcodeCollectionModel.superBarcodeDataCollectionObject[ dataSetName ]
      var dataItemNameArray = Variables.get('selectBarNameArrayAfterSort')
      // 绘制原始的barcode superTree
      var superOriginalTreeBarcodeLocaArray = superTreeBarcodeNodeLocArray.treeNodeArray[ 0 ]
      var barcodeItemLocationObj = {}
      for (var iItem = 0; iItem < dataItemNameArray.length; iItem++) {
        var item = dataItemNameArray[ iItem ]
        barcodeItemLocationObj[ item ] = iItem
      }
      Variables.set('barcodeItemLocationObj', barcodeItemLocationObj)
      var maxTreeWidthObj = superOriginalTreeBarcodeLocaArray[ 0 ][ 'treeWidthObj' ]
      var maxTreeNodeWidth = 0
      for (var mItem in maxTreeWidthObj) {
        if (maxTreeNodeWidth < maxTreeWidthObj[ mItem ]) {
          maxTreeNodeWidth = +maxTreeWidthObj[ mItem ]
        }
      }
      Variables.set('maxTreeNodeWidth', maxTreeNodeWidth)
      for (var i = 0; i < dataItemNameArray.length; i++) {
        var itemName = dataItemNameArray[ i ]
        if (typeof (itemName) !== 'undefined') {
          self.draw_single_barcode(itemName, dataSetName, barcodeMode)
        }
      }
      var mostRightBarcodeNode = superOriginalTreeBarcodeLocaArray[ superOriginalTreeBarcodeLocaArray.length - 1 ]
      var maxTreeAxisWidth = mostRightBarcodeNode.x + mostRightBarcodeNode.width
      var margin = Variables.get('barcodeMargin')
      var barHeight = +Variables.get('barcodeHeight')
      var barcodeGap = barHeight / 4
      var barWholeHeight = barHeight + barcodeGap
      var dragRightMargin = 150
      maxTreeAxisWidth = maxTreeAxisWidth + (margin.right + dragRightMargin) + margin.left
      var barcodeMaxWidthObj = {}
      for (var dI = 0; dI < dataItemNameArray.length; dI++) {
        barcodeMaxWidthObj[ dataItemNameArray[ dI ] ] = maxTreeAxisWidth
      }
      Variables.set('barcodeMaxWidthObj', barcodeMaxWidthObj)
      var maxHeight = barWholeHeight * dataItemNameArray.length + margin.top + margin.bottom
      if (maxHeight > height) {
        $('#barcode-panel-container').height(maxHeight)
      } else {
        $('#barcode-panel-container').height(height)
      }
      if (maxTreeAxisWidth > width) {
        $('#barcode-panel-container').width(maxTreeAxisWidth)
      } else {
        $('#barcode-panel-container').width(width)
      }
    },
    draw_supertreeline_barcode: function () {
      var self = this
      var width = +$('#barcode-panel-scroll').width()
      var height = +$('#barcode-panel-scroll').height()
      var barcodeCollectionModel = self.options.barcodeCollection
      var superTreeBarcodeNodeLocArray = barcodeCollectionModel.superBarcodeTreeLineCollectionObj[ dataSetName ]
      var dataSetName = Variables.get('currentDataSetName')
      var barcodeMode = Variables.get('barcodeMode')
      var dataItemNameArray = Variables.get('selectBarNameArrayAfterSort')
      var barcodeItemLocationObj = {}
      for (var iItem = 0; iItem < dataItemNameArray.length; iItem++) {
        var item = dataItemNameArray[ iItem ]
        barcodeItemLocationObj[ item ] = iItem
      }
      console.log('barcodeItemLocationObj', barcodeItemLocationObj)
      Variables.set('barcodeItemLocationObj', barcodeItemLocationObj)
      for (var i = 0; i < dataItemNameArray.length; i++) {
        var itemName = dataItemNameArray[ i ]
        if (typeof (itemName) !== 'undefined') {
          self.draw_single_barcode(itemName, dataSetName, barcodeMode)
        }
      }
    },
    //  注意：函数的名字不能随便起成render，这边如果把draw_barcode名字换成render，那么region中的#selected-barcode-1就不会渲染上来了
    //  利用collection中的信息画出barcode
    draw_barcode: function () {
      var self = this
      var svg = self.d3el //  此处不能直接用id选svg，因为此时这个svg实际上还没有画出来，只能用self来找
      var width = +self.width
      var height = +self.height
      svg.attr('width', width)
        .attr('height', height)
      var barcodeCollectionModel = self.options.barcodeCollection
      var dataSet = {}
      var dataSetName = Variables.get('currentDataSetName')
      var barcodeMode = Variables.get('barcodeMode')
      if (barcodeMode === 'original') {
        dataSet = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ]
      } else if (barcodeMode === 'compact') {
        dataSet = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ]
      }
      var originalBarcodeDataCollection = self.options.barcodeCollection.originalBarcodeDataCollectionObject
      var itemCount = 0
      var maxWidth = 0
      var maxTreeNodeWidth = 0
      var margin = Variables.get('barcodeMargin')
      //  TODO 删除barcode
      // if (operationType === 'remove') {
      //   self.remove_single_barcode(dataItemName)
      // }
      var barcodeItemLocationObj = {}
      // 首先要计算所有数据的最大值,之后进行进一步的计算
      for (var item0 in dataSet) {
        var compactArrayArray0 = dataSet[ item0 ].treeNodeArray
        if (barcodeMode === 'original') {
          nodeLocationArray = compactArrayArray0[ 0 ]
          // nodeLocationArray = dataSet[ item ].treeNodeArray
        } else if (barcodeMode === 'compact') {
          nodeLocationArray = compactArrayArray0[ compactArrayArray0.length - 1 ] //  compactArrayArray0.length - 1 compactArrayArray0.length - 2
        }
        var innerMaxWidth = nodeLocationArray[ nodeLocationArray.length - 1 ].x + nodeLocationArray[ nodeLocationArray.length - 1 ].width
        if (innerMaxWidth > maxWidth) {
          maxWidth = innerMaxWidth
        }
        var innerMaxTreeNodeWidth = nodeLocationArray[ 0 ].treeWidth
        if (innerMaxTreeNodeWidth > maxTreeNodeWidth) {
          maxTreeNodeWidth = innerMaxTreeNodeWidth
        }
        barcodeItemLocationObj[ item0 ] = itemCount
        itemCount = itemCount + 1
      }
      Variables.set('barcodeItemLocationObj', barcodeItemLocationObj)
      Variables.set('maxTreeNodeWidth', maxTreeNodeWidth)
      //  根据上述计算的barcode的属性进行绘制
      var barcodeMaxWidthObj = {}
      for (var dI = 0; dI < dataItemNameArray.length; dI++) {
        var item = dataItemNameArray[ dI ]
        if (typeof (item) !== 'undefined') {
          var compactArrayArray = dataSet[ item ].treeNodeArray
          var nodeLocationArray = null
          if (barcodeMode === 'original') {
            nodeLocationArray = compactArrayArray[ 0 ]
            // nodeLocationArray = dataSet[ item ].treeNodeArray
          } else if (barcodeMode === 'compact') {
            nodeLocationArray = compactArrayArray[ compactArrayArray.length - 1 ] //  compactArrayArray.length - 1 compactArrayArray.length - 2
          }
          innerMaxWidth = nodeLocationArray[ nodeLocationArray.length - 1 ].x + nodeLocationArray[ nodeLocationArray.length - 1 ].width
          barcodeMaxWidthObj[ item ] = innerMaxWidth
          self.draw_single_barcode(item, dataSetName, barcodeMode)
        }
      }
      Variables.set('barcodeMaxWidthObj', barcodeMaxWidthObj)
      var barHeight = +Variables.get('barcodeHeight')
      var barcodeGap = barHeight / 4
      var barWholeHeight = barHeight + barcodeGap
      var dragRightMargin = +Variables.get('dragRightMargin')
      maxWidth = maxWidth + (margin.right + dragRightMargin) + margin.left
      var maxHeight = barWholeHeight * itemCount + margin.top + margin.bottom
      if (maxHeight > height) {
        $('#barcode-panel-container').height(maxHeight)
      }
      if (maxWidth > width) {
        $('#barcode-panel-container').width(maxWidth)
      }
    },
    draw_single_barcode: function (itemName, dataSetName, barcodeMode) {
      var self = this
      var svg = self.d3el
      var barcodeCollectionModel = self.options.barcodeCollection
      var width = +$('#barcode-panel-scroll').width()
      var height = +$('#barcode-panel-scroll').height()
      var nodeLocationArray = null
      var barcodeCategory = Variables.get('barcodeCategory')
      var brushDetailedBarArray = Variables.get('brushDetailedBarArray')
      var innerMaxWidth = 0
      var barcodePanelContainerWidth = 0
      var superNodeArrayArray = barcodeCollectionModel.superBarcodeDataCollectionObject[ dataSetName ].treeNodeArray
      var wholeNodeArrayArray = barcodeCollectionModel.wholeItemCompactTreeNodeArrayArrayCollectionObj[ dataSetName ].treeNodeArray
      if (barcodeCategory === 'single') {
        var compactArrayArray = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ][ itemName ].treeNodeArray
        if (barcodeMode === Config.get('BARCODE_MODE').CompactMode) {
          nodeLocationArray = compactArrayArray[ compactArrayArray.length - 1 ]
        } else if (barcodeMode === Config.get('BARCODE_MODE').OriginalMode) {
          nodeLocationArray = compactArrayArray[ 0 ]
        }
      } else if ((barcodeCategory === 'super')) { //|| ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))
        var wholeItemTreeNodeArrayArray = barcodeCollectionModel.wholeItemTreeNodeArrayArrayCollectionObj[ dataSetName ].treeNodeArray
        var superTreeMode = Variables.get('superTreeMode')
        if (superTreeMode === Config.get('SUPERTREE_MODE')[ 'WholeTreeMode' ]) {
          nodeLocationArray = wholeItemTreeNodeArrayArray[ 0 ]
          var wholeTreeNodeLocationArray = barcodeCollectionModel.wholeTreeNodeArrayCollectionObj[ dataSetName ].treeNodeArray
          var wholeTreeNodeLocationWidth = wholeTreeNodeLocationArray[ wholeTreeNodeLocationArray.length - 1 ].x + wholeTreeNodeLocationArray[ wholeTreeNodeLocationArray.length - 1 ].width
          $('#barcode-panel-container').width(wholeTreeNodeLocationWidth)
        } else if (superTreeMode === Config.get('SUPERTREE_MODE')[ 'SuperTreeMode' ]) {
          if (barcodeMode === Config.get('BARCODE_MODE').CompactMode) {
            nodeLocationArray = superNodeArrayArray[ superNodeArrayArray.length - 1 ]
          } else if (barcodeMode === Config.get('BARCODE_MODE').OriginalMode) {
            nodeLocationArray = superNodeArrayArray[ 0 ]
          }
        }
        $('#barcode-panel-container').width(+$('#barcode-panel-scroll').width())
        barcodePanelContainerWidth = +$('#barcode-panel-container').width()
        innerMaxWidth = nodeLocationArray[ nodeLocationArray.length - 1 ].x + nodeLocationArray[ nodeLocationArray.length - 1 ].width
        if (innerMaxWidth > barcodePanelContainerWidth) {
          $('#barcode-panel-container').width(innerMaxWidth)
          $('#super-tree-div').width(innerMaxWidth)
        }
      } else if ((barcodeCategory === 'supertreeline')) { // && (Variables.get('treeLineHeight') !== Variables.get('barcodeHeight'))
        // if (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')) {
        //   nodeLocationArray = superNodeArrayArray[ 0 ]
        //   innerMaxWidth = nodeLocationArray[ nodeLocationArray.length - 1 ].x + nodeLocationArray[ nodeLocationArray.length - 1 ].width + Variables.get('dragRightMargin')
        //   barcodePanelContainerWidth = (+$('#barcode-panel-scroll').width()) > innerMaxWidth ? (+$('#barcode-panel-scroll').width()) : innerMaxWidth
        //   $('#barcode-panel-container').width(barcodePanelContainerWidth)
        // } else {
        var superTreeMode = Variables.get('superTreeMode')
        var selectBarNameArray = null
        var nodeLocationIndex = null
        if (superTreeMode === Config.get('SUPERTREE_MODE')[ 'WholeTreeMode' ]) {
          if (brushDetailedBarArray.indexOf(itemName) === -1) {
            var superTreelineArrayArray = barcodeCollectionModel.wholeBarcodeTreeLineCollectionObj[ dataSetName ].treeNodeArray
            selectBarNameArray = Variables.get('selectBarNameArray')
            nodeLocationIndex = selectBarNameArray.indexOf(itemName)
            nodeLocationArray = superTreelineArrayArray[ nodeLocationIndex ]
            for (var nI = 0; nI < nodeLocationArray.length; nI++) {
              nodeLocationArray[ nI ].height = +Variables.get('treeLineHeight')
            }
            // console.log(treeLineHeight, Variables.get('treeLineHeight'))
          } else {
            nodeLocationArray = wholeNodeArrayArray[ 0 ]
          }
        } else if (superTreeMode === Config.get('SUPERTREE_MODE')[ 'SuperTreeMode' ]) {
          if (brushDetailedBarArray.indexOf(itemName) === -1) {
            var wholeTreelineArrayArray = barcodeCollectionModel.superBarcodeTreeLineCollectionObj[ dataSetName ].treeNodeArray
            selectBarNameArray = Variables.get('selectBarNameArray')
            nodeLocationIndex = selectBarNameArray.indexOf(itemName)
            nodeLocationArray = wholeTreelineArrayArray[ nodeLocationIndex ]
            for (var nlI = 0; nlI < nodeLocationArray.length; nlI++) {
              nodeLocationArray[ nlI ].height = +Variables.get('treeLineHeight')
            }
          } else {
            nodeLocationArray = superNodeArrayArray[ 0 ]
          }
        }

        //  在barcode-panel-container中保证完全充满
        $('#barcode-panel-container').width(+$('#barcode-panel-scroll').width())
        // }
      }
      var innerMaxWidth = nodeLocationArray[ nodeLocationArray.length - 1 ].x + nodeLocationArray[ nodeLocationArray.length - 1 ].width
      //  对于nodeLocationArray中的每个节点计算category
      // self.add_category_name(nodeLocationArray)
      var barHeight = 0
      if (barcodeCategory === 'supertreeline') {
        barHeight = +Variables.get('treeLineHeight')
      } else {
        barHeight = +Variables.get('barcodeHeight')
      }
      var barcodeMargin = Variables.get('barcodeMargin')
      var barcodeItemLocationObj = Variables.get('barcodeItemLocationObj')
      var barcodeGap = barHeight / 4
      var barWholeHeight = barHeight + barcodeGap
      var detailedWholeHeight = +Variables.get('barcodeHeight') + (Variables.get('barcodeHeight') / 4)
      var treeLineWholeHeight = Variables.get('treeLineWholeHeight')
      var yAggregateLoc = 0
      for (var barcodeItem in barcodeItemLocationObj) {
        if (barcodeCategory === 'supertreeline') {
          if (barcodeItem === itemName) {
            break
          }
          if (brushDetailedBarArray.indexOf(barcodeItem) !== -1) {
            yAggregateLoc = yAggregateLoc + detailedWholeHeight
          } else {
            yAggregateLoc = yAggregateLoc + treeLineWholeHeight
          }
        } else {
          var locationIndex = barcodeItemLocationObj[ itemName ]
          yAggregateLoc = barWholeHeight * locationIndex
        }
      }
      if (yAggregateLoc > (+$('#barcode-panel-scroll').height())) {
        $('#barcode-panel-container').height(yAggregateLoc)
      }
      var barcodeSingleWidthArrayObj = Variables.get('barcodeSingleWidthArrayObj')
      var itemNameRemoveJson = itemName.replace('.json', '')
      var dataItemNameArray = Variables.get('selectBarNameArray')
      var itemNameIndex = dataItemNameArray.indexOf(itemName)
      var singleWidthArray = barcodeSingleWidthArrayObj[ itemNameRemoveJson ]
      var margin = {}
      margin.top = Variables.get('tooltipGapHeight')
      margin.bottom = barcodeMargin.bottom * height
      margin.left = barcodeMargin.left * width
      margin.right = barcodeMargin.right * width
      var barcodeViewHeight = +$('#barcode-panel-scroll').height()
      // Variables.set('maxTreeNodeWidth', maxTreeNodeWidth)
      var DURATION = Config.get('MOVE_DURATION')
      // 去掉文件名中的.json, 将itemName用于g的id
      itemName = itemName.replace('.json', '')

      var isXChecked = true
      var isYChecked = true

      var width = innerMaxWidth
      var height = barHeight

      var dragbarw = 10
      var w = innerMaxWidth + 100
      var h = barcodeViewHeight
      //  改变背景rect的大小
      var drag = d3.behavior.drag()
        .origin(Object)
      // .on('drag', dragmove)

      // var dragright = d3.behavior.drag()
      // // .origin(Object)
      //   .on('drag', rdragresize)
      //   .on('dragend', changeBarcodeWidth)

      // var dragleft = d3.behavior.drag()
      // // .origin(Object)
      //   .on('drag', ldragresize)
      //   .on('dragend', changeBarcodeWidth)

      var dragtop = d3.behavior.drag()
      // .origin(Object)
        .on('drag', tdragresize)
        .on('dragend', changeBarcodeHeight)

      var dragbottom = d3.behavior.drag()
      // .origin(Object)
        .on('drag', bdragresize)
        .on('dragend', changeBarcodeHeight)

      svg.call(self.tip)

      var bindGDataArray = [ { 'itemName': itemName, 'yAggregateLoc': yAggregateLoc, 'x': 0, 'y': 0 } ]

      var barcodeG = svg.selectAll('#barcode-g-' + itemName)
        .data(bindGDataArray, function (d, i) {
          return d.itemName
        })

      barcodeG.enter()
        .append('g')
        .attr('id', function (d, i) {
          var dItemName = d.itemName.replace('.json', '')
          return 'barcode-g-' + dItemName
        })
        .attr('class', 'barcode-g')
        .attr('transform', 'translate(' + margin.left + ',' + (margin.top + yAggregateLoc) + ')')

      barcodeG.attr('id', function (d, i) {
        var dItemName = d.itemName.replace('.json', '')
        return 'barcode-g-' + dItemName
      })
        .attr('class', 'barcode-g')
        // .transition()
        // .duration(DURATION)
        .attr('transform', 'translate(' + margin.left + ',' + (margin.top + yAggregateLoc) + ')')

      barcodeG.exit().remove()

      var dragrect = null
      var dragbarleft = null
      var dragbarright = null
      var dragbartop = null
      var dragbarbottom = null
      var dragLeftReStore = 0

      if (barcodeG.selectAll('.barcode-bg-rect')[ 0 ].length === 0) {
        barcodeG.append('rect')
          .attr('class', 'barcode-bg-rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', barHeight)
          .attr('width', $('#barcode-panel-scroll').width())
          .on('mouseover', function (d, i) {
            var parentNodeId = $(this).parent().attr('id')
            self.mouseout_treeline_handler()
            self.mouseover_treeline_handler(parentNodeId)
          })
      } else {
        barcodeG.selectAll('.barcode-bg-rect')
          .attr('class', 'barcode-bg-rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', barHeight)
          .attr('width', $('#barcode-panel-scroll').width())
          .on('mouseover', function (d, i) {
            var parentNodeId = $(this).parent().attr('id')
            self.mouseout_treeline_handler()
            self.mouseover_treeline_handler(parentNodeId)
          })
      }
      if (barcodeG.selectAll('.bg-rect')[ 0 ].length === 0) { //  判断是否之前已经存在过dragbar
        //  之前不存在的情况下需要append节点
        if ((barcodeCategory !== 'supertreeline') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
          dragrect = barcodeG.append('rect')
            .attr('id', 'bg-rect-' + itemName)
            .attr('class', 'bg-rect')
            .attr('x', function (d) { return d.x })
            .attr('y', function (d) { return d.y })
            .attr('height', height)
            .attr('width', width)
            .attr('cursor', 'pointer')
            .call(drag)
            .on('mouseover', function (d, i) {
              dragBarMouseoverHandler(d)
            })
            .on('mouseout', function (d, i) {
              dragBarMouseoutHandler(d)
              self.tip.hide()
            })

          // dragbarleft = barcodeG.append('rect')
          //   .attr('x', function (d) { return d.x - (dragbarw / 2) })
          //   .attr('y', function (d) { return d.y - (dragbarw / 2) })
          //   .attr('height', height + dragbarw)
          //   .attr('id', 'dragleft-' + itemName)
          //   .attr('class', 'dragrect dragleft')
          //   .attr('width', dragbarw)
          //   .attr('fill', 'lightblue')
          //   .attr('fill-opacity', 1)
          //   .attr('cursor', 'ew-resize')
          //   .call(dragleft)
          //   .on('mouseover', function (d, i) {
          //     dragBarMouseoverHandler(d)
          //     var parentNodeId = $(this).parent().attr('id')
          //     self.mouseout_handler(parentNodeId)
          //   })
          //   .on('mouseout', function (d, i) {
          //     dragBarMouseoutHandler(d)
          //     var parentNodeId = $(this).parent().attr('id')
          //     self.mouseout_handler(parentNodeId)
          //     self.tip.hide()
          //   })
          //
          // dragbarright = barcodeG.append('rect')
          //   .attr('x', function (d) { return d.x + innerMaxWidth - (dragbarw / 2) })
          //   .attr('y', function (d) { return d.y - (dragbarw / 2) })
          //   .attr('id', 'dragright-' + itemName)
          //   .attr('class', 'dragrect dragright')
          //   .attr('height', height + dragbarw)
          //   .attr('width', dragbarw)
          //   .attr('fill', 'lightblue')
          //   .attr('fill-opacity', 1)
          //   .attr('cursor', 'ew-resize')
          //   .call(dragright)
          //   .on('mouseover', function (d, i) {
          //     dragBarMouseoverHandler(d)
          //     var parentNodeId = $(this).parent().attr('id')
          //     self.mouseout_handler(parentNodeId)
          //   })
          //   .on('mouseout', function (d, i) {
          //     dragBarMouseoutHandler(d)
          //     var parentNodeId = $(this).parent().attr('id')
          //     self.mouseout_handler(parentNodeId)
          //     self.tip.hide()
          //   })

          dragbartop = barcodeG.append('rect')
            .attr('x', function (d) { return d.x + (dragbarw / 2) })
            .attr('y', function (d) { return d.y - (dragbarw / 2) })
            .attr('height', dragbarw)
            .attr('id', 'dragtop-' + itemName)
            .attr('class', 'dragrect dragtop')
            .attr('width', width - dragbarw)
            .attr('fill', 'lightgreen')
            .attr('fill-opacity', 1)
            .attr('cursor', 'ns-resize')
            .call(dragtop)
            .on('mouseover', function (d, i) {
              dragBarMouseoverHandler(d)
              var parentNodeId = $(this).parent().attr('id')
              self.mouseout_handler(parentNodeId)
            })
            .on('mouseout', function (d, i) {
              dragBarMouseoutHandler(d)
              var parentNodeId = $(this).parent().attr('id')
              self.mouseout_handler(parentNodeId)
              self.tip.hide()
            })

          dragbarbottom = barcodeG.append('rect')
            .attr('x', function (d) { return d.x + (dragbarw / 2) })
            .attr('y', function (d) { return d.y + barHeight - (dragbarw / 2) })
            .attr('id', 'dragbottom-' + itemName)
            .attr('class', 'dragrect dragbottom')
            .attr('height', dragbarw)
            .attr('width', width - dragbarw)
            .attr('fill', 'lightgreen')
            .attr('fill-opacity', 1)
            .attr('cursor', 'ns-resize')
            .call(dragbottom)
            .on('mouseover', function (d, i) {
              dragBarMouseoverHandler(d)
              var parentNodeId = $(this).parent().attr('id')
              self.mouseout_handler(parentNodeId)
              self.tip.hide()
            })
            .on('mouseout', function (d, i) {
              dragBarMouseoutHandler(d)
              var parentNodeId = $(this).parent().attr('id')
              self.mouseout_handler(parentNodeId)
              self.tip.hide()
            })
        }
      } else {
        //  如果之前存在节点, 那么只需要更新, 从而不遮挡barcode
        barcodeG.select('.bg-rect')
          .attr('x', function (d) { return d.x })
          .attr('y', function (d) { return d.y })
          .attr('height', height)
          .attr('width', width)
        barcodeG.select('.dragleft')
          .attr('x', function (d) { return d.x - (dragbarw / 2) })
          .attr('y', function (d) { return d.y })
          .attr('height', height)
          .attr('width', dragbarw)
        barcodeG.select('.dragright')
          .attr('x', function (d) { return d.x + innerMaxWidth - (dragbarw / 2) })
          .attr('y', function (d) { return d.y })
          .attr('height', height)
          .attr('width', dragbarw)
        barcodeG.select('.dragtop')
          .attr('x', function (d) { return d.x })
          .attr('y', function (d) { return d.y - (dragbarw / 2) })
          .attr('height', dragbarw)
          .attr('width', width)
        barcodeG.select('.dragbottom')
          .attr('x', function (d) { return d.x })
          .attr('y', function (d) { return d.y + barHeight - (dragbarw / 2) })
          .attr('height', dragbarw)
          .attr('width', width)
      }
      var depth = +Variables.get('maxDepth')

      svg.select('#barcode-g-' + itemName)
        .selectAll('.y.axis')
        .remove()

      svg.select('#barcode-g-' + itemName)
        .selectAll('.barcode-y-axis')
        .remove()

      function brushmove () {
        var y = d3.scale.linear().range([ brushRangeStart, brushRangeEnd ]).domain([ 0, brushBarHeight ])
        var b = brush.extent()

        var localBrushYearStart = (brush.empty()) ? brushRangeStart : Math.floor(y(b[ 0 ]))
        var localBrushYearEnd = (brush.empty()) ? brushRangeEnd : Math.ceil(y(b[ 1 ]))

        d3.select('#barcode-g-' + itemName).select('g.brush').call((brush.empty()) ? brush.clear() : brush.extent([ y.invert(localBrushYearStart), y.invert(localBrushYearEnd) ]))

        d3.select('#barcode-g-' + itemName).selectAll('rect.bar').style('opacity', function (d, i) {
          return d.y >= localBrushYearStart && d.y < localBrushYearEnd || brush.empty() ? '1' : '.4'
        })
      }

      function brushend () {
        var b = brush.extent()
        var y = d3.scale.linear().range([ brushRangeStart, brushRangeEnd ]).domain([ 0, brushBarHeight ])
        var localBrushYearStart = (brush.empty()) ? brushRangeStart : Math.floor(y(b[ 0 ]))
        var localBrushYearEnd = (brush.empty()) ? brushRangeEnd : Math.ceil(y(b[ 1 ]))
        d3.select('#barcode-g-' + itemName).selectAll('rect.bar').style('opacity', function (d, i) {
          return d.y >= localBrushYearStart && d.y <= localBrushYearEnd || brush.empty() ? '1' : '.4'
        })
        // 在装换到真实的层级是需要将1 - depth转换到0 - (depth-1)
        var brushLevelStart = localBrushYearStart
        var brushLevelEnd = localBrushYearEnd - 1
        var maxDepth = Variables.get('maxDepth')
        var barcodeWidthArray = Variables.get('barcodeWidthArray')
        var singleWidthArray = []
        for (var i = 0; i < maxDepth; i++) {
          if ((i >= brushLevelStart) && (i <= brushLevelEnd)) {
            singleWidthArray[ i ] = barcodeWidthArray[ i ]
          } else {
            singleWidthArray[ i ] = 0
          }
        }
        var barcodeSingleWidthArrayObj = Variables.get('barcodeSingleWidthArrayObj')
        barcodeSingleWidthArrayObj[ itemName ] = singleWidthArray
        Variables.set('barcodeSingleWidthArrayObj', barcodeSingleWidthArrayObj)
        Variables.set('barcodeSuperWidthArray', singleWidthArray)
        var mode = Variables.get('barcodeMode')
        var dataItemName = itemName + '.json'
        var barcodeCategory = Variables.get('barcodeCategory')
        var selectBarNameArrayWithUndefined = Variables.get('selectBarNameArrayWithUndefined')

        if (barcodeCategory === 'single') {
          barcodeCollectionModel.request_compact_barcode_dataset(dataSetName, dataItemName, mode)
        } else if (barcodeCategory === 'super') {
          barcodeCollectionModel.request_supertree_barcode_dataset(dataSetName, selectBarNameArrayWithUndefined, mode)
        }
      }

      svg.select('#barcode-g-' + itemName).select('.barcode-config-g').remove()

      var barcodeConfigFontSize = margin.left * 3 / 8 > barHeight / 3 ? barHeight / 3 : margin.left * 3 / 8

      svg.select('#barcode-g-' + itemName)
        .append('g')
        .attr('class', 'barcode-config-g')
        .attr('transform', 'translate(' + (-margin.left * 3 / 8 - barcodeConfigFontSize) + ',' + 0 + ')')
        .attr('id', 'barcode-config-g-' + itemName)

      var barcodeConfigG = svg.select('#barcode-config-g-' + itemName)
      var selectBarNameArray = Variables.get('selectBarNameArray')
      self.trigger_render_datelinechart()
      // TODO about treeline
      if ((barcodeCategory !== 'supertreeline') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
        var domainArray = []
        for (var i = 0; i <= depth; i++) {
          if (typeof (singleWidthArray) !== 'undefined') {
            if ((singleWidthArray[ i ] !== 0)) { //  && (typeof (singleWidthArray[ i ]) !== 'undefined')
              domainArray.push(i)
            }
          } else {
            domainArray.push(i)
          }
        }
        var brushRangeStart = 0 // domainArray[ 0 ]
        var brushRangeEnd = domainArray.length - 1 // depth
        var ticksNum = domainArray.length
        var brushBarHeight = barHeight / (brushRangeEnd + 1) * brushRangeEnd // ticksNum * (ticksNum - 1)  (depth + 1) * depth
        var brushPerBarHeight = barHeight / (brushRangeEnd + 1) // ticksNum  (depth + 1)

        var yScale = d3.scale.ordinal()
          .rangeBands([ 0, brushBarHeight ], 1, 0)
          .domain(domainArray)

        var yAxis = d3.svg.axis()
          .scale(yScale)
          .ticks(ticksNum)
          .orient('left')
          .tickValues(domainArray)

        var brushAxisG = svg.select('#barcode-g-' + itemName)
          .append('g')
          .attr('class', 'barcode-y-axis')

        brushAxisG.append('g').attr('class', 'y axis')
          .attr('transform', 'translate(' + (-margin.left / 8) + ',' + brushPerBarHeight / 2 + ')')
          .call(yAxis)

        var brush = d3.svg.brush()
          .y(yScale)
          .on('brush', brushmove)
          .on('brushend', brushend)

        var brushg = brushAxisG.append('g')
          .attr('class', 'brush')
          .attr('transform', 'translate(' + (-margin.left * 2 / 8) + ',' + brushPerBarHeight / 2 + ')')
          .call(brush)

        brushg.selectAll('rect')
          .attr('width', margin.left / 8)

        barcodeConfigG.append('text')
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'hanging')
          .attr('cursor', 'pointer')
          .attr('id', 'barcode-label-icon')
          .attr('class', 'barcode-g-icon')
          .attr('x', 0)
          .attr('y', 0)
          .attr('font-family', 'FontAwesome')
          .attr('font-size', function (d) { return barcodeConfigFontSize / 16 + 'em' })
          .text(function (d) {
            var thisItem = itemName + '.json'
            var itemNum = selectBarNameArray.indexOf(thisItem)
            var baseNum = 65
            var num = baseNum + itemNum
            return String.fromCharCode(num)
          })
          .on('mouseover', function (d, i) {
            labelIconMouseoverHandler(d, i, this, barcodeConfigFontSize)
          })
          .on('mouseout', function (d, i) {
            labelIconMouseoutHandler(d, i, this, barcodeConfigFontSize)
          })
          .on('click', function (d, i) {
            labelIconClickHandler(d, i, this, barcodeConfigFontSize)
          })

        barcodeConfigG.append('text')
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'middle')
          .attr('cursor', 'pointer')
          .attr('id', 'barcode-reset-icon')
          .attr('class', 'barcode-g-icon')
          .attr('x', 0)
          .attr('y', barHeight / 2)
          .attr('font-family', 'FontAwesome')
          .attr('font-size', function (d) { return barcodeConfigFontSize / 16 + 'em' })
          .text(function (d) { return '\uf021' })// \uf021所表示的是还原原始的brush状态
          .on('mouseover', function (d, i) {
            resetIconMouseoverHandler(d, i, this, barcodeConfigFontSize)
          })
          .on('mouseout', function (d, i) {
            resetIconMouseoutHandler(d, i, this, barcodeConfigFontSize)
          })
          .on('click', function (d, i) {
            resetIconClickHandler(d, i, this, barcodeConfigFontSize)
          })
        var BARCODE_ICON_NAME = Config.get('BARCODE_ICON_NAME')
        barcodeConfigG.append('text')
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'ideographic')
          .attr('cursor', 'pointer')
          .attr('id', 'barcode-mode-icon')
          .attr('class', function (d, i) {
            if (barcodeMode === Config.get('BARCODE_MODE')[ 'CompactMode' ]) {
              return 'barcode-g-icon compact-mode'
            } else if (barcodeMode === Config.get('BARCODE_MODE')[ 'OriginalMode' ]) {
              return 'barcode-g-icon original-mode'
            }
          })
          .attr('x', 0)
          .attr('y', barHeight) // brushBarHeight + brushPerBarHeight / 2
          .attr('font-family', 'FontAwesome')
          .attr('font-size', function (d) { return barcodeConfigFontSize / 16 + 'em' })
          .text(function (d) {
            if (barcodeMode === Config.get('BARCODE_MODE')[ 'CompactMode' ]) {
              return BARCODE_ICON_NAME[ 'CompactMode' ]
            } else if (barcodeMode === Config.get('BARCODE_MODE')[ 'OriginalMode' ]) {
              return BARCODE_ICON_NAME[ 'OriginalMode' ]
            }
          })// \uf009 所表示的是barcode的compact模式 \uf04c所表示的是barcode的原始模式
          .on('mouseover', function (d, i) {
            barcodeModeIconMouseoverHandler(d, i, this, barcodeConfigFontSize)
          })
          .on('mouseout', function (d, i) {
            barcodeModeIconMouseoutHandler(d, i, this, barcodeConfigFontSize)
          })
          .on('click', function (d, i) {
            barcodeModeIconClickHandler(d, i, this, barcodeConfigFontSize)
          })
        svg.select('#barcode-g-' + itemName)
          .select('.y.axis')
          .selectAll('text')
          .remove()

        var ticksValues = []
        for (var iTicksValues = 1; iTicksValues <= depth; iTicksValues++) {
          if (typeof (singleWidthArray) !== 'undefined') {
            if ((singleWidthArray[ iTicksValues - 1 ] !== 0)) { //  && (typeof (singleWidthArray[ iTicksValues ]) !== 'undefined')
              ticksValues.push(iTicksValues)
            }
          } else {
            ticksValues.push(iTicksValues)
          }
        }
        var ticksValueMoveX = svg.select('#barcode-g-' + itemName)
          .select('.y.axis')
          .selectAll('.tick')
          .select('line')
          .attr('x2')
        svg.select('#barcode-g-' + itemName)
          .select('.y.axis')
          .selectAll('.tick')
          .data(ticksValues)
          .append('text')
          .attr('id', function (d, i) {
            return 'level-text-' + d
          })
          .attr('class', 'level-text')
          .attr('text-anchor', 'start')
          .attr('cursor', 'pointer')
          .attr('font-size', (brushPerBarHeight * 0.7) / 16 + 'em')
          .attr('alignment-baseline', 'middle')
          .attr('transform', 'translate(' + (-margin.left * 2 / 8) + ',' + brushPerBarHeight / 2 + ')')
          .text(function (d, i) {
            return d
          })
          .on('mouseover', function (d, i) {
            ticksValuesMouseoverHandler(d, i, this, itemName)
          })
          .on('mouseout', function (d, i) {
            ticksValuesMouseoutHandler(d, i, this, itemName)
          })
          .on('click', function (d, i) {
            ticksValueClickHandler(d, i, this, itemName)
          })
      } else {
        svg.selectAll('.file-y-axis').remove()
        var fileDomainArray = []
        for (var sI = 0; sI <= selectBarNameArray.length; sI++) {
          if (typeof (selectBarNameArray) !== 'undefined') {
            if (typeof (selectBarNameArray[ sI ]) !== 'undefined') { //  && (typeof (singleWidthArray[ i ]) !== 'undefined')
              fileDomainArray.push(sI)
            } else {
              fileDomainArray.push(sI)
            }
          } else {
            fileDomainArray.push(sI)
          }
        }
        // fileDomainArray.push((selectBarNameArray.length))
        var barcodeBrushViewHeight = barWholeHeight * selectBarNameArray.length// barcodeViewHeight - barcodeViewHeight * barcodeMargin.top - barcodeViewHeight * barcodeMargin.bottom
        var fileBrushRangeStart = 0 // domainArray[ 0 ]
        var fileBrushRangeEnd = fileDomainArray.length + 1 // depth
        var fileBrushTicksNum = fileDomainArray.length + 1
        // var fileBrushBarHeight = barcodeBrushViewHeight / (fileBrushRangeEnd + 1) * fileBrushRangeEnd // ticksNum * (ticksNum - 1)  (depth + 1) * depth
        var fileBrushPerBarHeight = barcodeBrushViewHeight / fileBrushRangeEnd // ticksNum  (depth + 1)
        var fileRangeArray = []
        var aggregateYAxis = 0
        var treeLineHeight = Variables.get('treeLineHeight')
        var treeLineGap = treeLineHeight / 4
        //  累计叠加的TreelineWholeHeight是treelineWholeHeight去除掉treelineGap / 2
        var aggreTreeLineWholeHeight = Variables.get('treeLineWholeHeight')
        var detailedBarHeight = Variables.get('barcodeHeight')
        var detailedBarWholeHeight = detailedBarHeight + detailedBarHeight / 4
        var selectBarNameArrayAfterSort = Variables.get('selectBarNameArrayAfterSort')
        for (var rI = 0; rI < fileDomainArray.length; rI++) {
          if ((rI === 0) || (rI === (+fileDomainArray.length - 2))) {
            aggreTreeLineWholeHeight = Variables.get('treeLineWholeHeight') - treeLineGap / 2
          } else {
            aggreTreeLineWholeHeight = Variables.get('treeLineWholeHeight')
          }
          if (rI >= selectBarNameArrayAfterSort.length) {
            fileRangeArray.push(aggregateYAxis)
            aggregateYAxis = aggregateYAxis + aggreTreeLineWholeHeight
          } else {
            var selectBarName = selectBarNameArrayAfterSort[ rI ]
            var brushDetailedBarArray = Variables.get('brushDetailedBarArray')
            if (brushDetailedBarArray.indexOf(selectBarName) !== -1) {
              fileRangeArray.push(aggregateYAxis)
              aggregateYAxis = aggregateYAxis + detailedBarWholeHeight
            } else {
              fileRangeArray.push(aggregateYAxis)
              aggregateYAxis = aggregateYAxis + aggreTreeLineWholeHeight
            }
          }
        }
        var yFileScale = d3.scale.ordinal()
        // .rangeBands([ 0, barcodeBrushViewHeight ], 1, 0)
          .range(fileRangeArray)
          .domain(fileDomainArray)

        var yFileAxis = d3.svg.axis()
          .scale(yFileScale)
          .ticks(fileBrushTicksNum)
          .orient('left')
          .tickValues(fileDomainArray)

        var fileBrushAxisG = svg.append('g')
          .attr('class', 'file-y-axis')

        fileBrushAxisG.append('g').attr('class', 'y axis')
          .attr('transform', 'translate(' + (margin.left * 7 / 8) + ',' + (margin.top) + ')')
          .call(yFileAxis)

        var fileBrush = d3.svg.brush()
          .y(yFileScale)
          .on('brush', fileBrushMove)
          .on('brushend', fileBrushEnd)

        var fileBrushg = fileBrushAxisG.append('g')
          .attr('class', 'brush')
          .attr('transform', 'translate(' + (margin.left * 5 / 8) + ',' + (margin.top) + ')')
          .call(fileBrush)

        fileBrushg.selectAll('rect')
          .attr('width', margin.left / 4)

        svg.select('.file-y-axis').selectAll('.tick text').remove()
      }

      function fileBrushMove () {
        // var y = d3.scale.linear().range([ fileBrushRangeStart, (fileBrushRangeEnd - 2 ) ]).domain([ 0, barcodeBrushViewHeight ])
        var y = d3.scale.ordinal().range(fileDomainArray).domain(fileRangeArray)
        var yInvert = d3.scale.ordinal().range(fileRangeArray).domain(fileDomainArray)
        var b = fileBrush.extent()
        for (var bI = 0; bI < b.length; bI++) {
          for (var fI = 0; fI < (fileRangeArray.length - 1); fI++) {
            if ((b[ bI ] > fileRangeArray[ fI ]) && (b[ bI ] < fileRangeArray[ fI + 1 ])) {
              if ((b[ bI ] - fileRangeArray[ fI ]) > (fileRangeArray[ fI + 1 ] - b[ bI ])) {
                b[ bI ] = fileRangeArray[ fI + 1 ]
              } else {
                b[ bI ] = fileRangeArray[ fI ]
              }
            }
          }
        }
        var localFileBrushYearStart = (fileBrush.empty()) ? fileBrushRangeStart : Math.floor(y(b[ 0 ]))
        var localFileBrushYearEnd = (fileBrush.empty()) ? (fileBrushRangeStart - 1) : Math.ceil(y(b[ 1 ]))

        d3.select('#barcode-main-svg').select('g.brush').call((fileBrush.empty()) ? fileBrush.clear() : fileBrush.extent([ yInvert(localFileBrushYearStart), yInvert(localFileBrushYearEnd) ]))

        d3.select('#barcode-main-svg').selectAll('rect.bar').style('opacity', function (d, i) {
          return d.y >= localFileBrushYearStart && d.y < localFileBrushYearEnd || fileBrush.empty() ? '1' : '.4'
        })
      }

      function fileBrushEnd () {
        // var y = d3.scale.linear().range([ fileBrushRangeStart, (fileBrushRangeEnd - 2 ) ]).domain([ 0, barcodeBrushViewHeight ])
        var y = d3.scale.ordinal().range(fileDomainArray).domain(fileRangeArray)

        var b = fileBrush.extent()
        for (var bI = 0; bI < b.length; bI++) {
          for (var fI = 0; fI < (fileDomainArray.length - 1); fI++) {
            if ((b[ bI ] > fileDomainArray[ fI ]) && (b[ bI ] < fileDomainArray[ fI + 1 ])) {
              if ((b[ bI ] - fileDomainArray[ fI ]) > (fileDomainArray[ fI + 1 ] - b[ bI ])) {
                b[ bI ] = fileDomainArray[ fI + 1 ]
              } else {
                b[ bI ] = fileDomainArray[ fI ]
              }
            }
          }
        }
        var localFileBrushYearStart = (fileBrush.empty()) ? fileBrushRangeStart : Math.floor(y(b[ 0 ]))
        var localFileBrushYearEnd = (fileBrush.empty()) ? (fileBrushRangeStart - 1) : Math.ceil(y(b[ 1 ]))
        d3.select('#barcode-main-svg').selectAll('rect.bar').style('opacity', function (d, i) {
          return d.y >= localFileBrushYearStart && d.y < localFileBrushYearEnd || fileBrush.empty() ? '1' : '.4'
        })
        var brushDetailedBarArray = Variables.get('brushDetailedBarArray')
        var selectBarNameArrayAfterSort = Variables.get('selectBarNameArrayAfterSort')
        for (var lI = localFileBrushYearStart; lI < localFileBrushYearEnd; lI++) {
          var selectBarInArrayIndex = brushDetailedBarArray.indexOf(selectBarNameArrayAfterSort[ lI ])
          if (selectBarInArrayIndex === -1) {
            brushDetailedBarArray.push(selectBarNameArrayAfterSort[ lI ])
          } else {
            brushDetailedBarArray.splice(selectBarInArrayIndex, 1)
          }
        }
        Variables.set('brushDetailedBarArray', brushDetailedBarArray)
        var dataItemNameArray = Variables.get('selectBarNameArray')
        updateTreeLineHeight()
        self.draw_supertreeline_barcode(dataSetName, barcodeMode, dataItemNameArray)
      }

      function updateTreeLineHeight () {
        var brushDetailedBarArray = Variables.get('brushDetailedBarArray')
        var selectBarNameArray = Variables.get('selectBarNameArray')
        var barcodeNum = +selectBarNameArray.length
        var detailedBarcodeHeight = +Variables.get('barcodeHeight')
        var detailedBarcodeWholeHeight = detailedBarcodeHeight + detailedBarcodeHeight / 4
        var barcodeRemainNum = barcodeNum - brushDetailedBarArray.length
        var barcodeViewHeight = +$('#barcode-panel-scroll').height()
        var barcodeMargin = Variables.get('barcodeMargin')
        var tooltipGapHeight = Variables.get('tooltipGapHeight')
        var barcodeViewHeightWithoutMargin = barcodeViewHeight - barcodeMargin.top * barcodeViewHeight - barcodeMargin.bottom * barcodeViewHeight - tooltipGapHeight
        var treeLineHeight = (+barcodeViewHeightWithoutMargin - brushDetailedBarArray.length * detailedBarcodeWholeHeight) / (barcodeRemainNum + barcodeRemainNum / 4)
        var barcodeHeight = Variables.get('barcodeHeight')
        if (treeLineHeight > barcodeHeight) {
          treeLineHeight = barcodeHeight
        }
        var treeLineWholeHeight = treeLineHeight + treeLineHeight / 4
        Variables.set('treeLineHeight', treeLineHeight)
        Variables.set('treeLineWholeHeight', treeLineWholeHeight)
      }

      var barcodeGElements = svg.select('#barcode-g-' + itemName)
        .selectAll('.barcode-rect')
        .data(nodeLocationArray, function (d, i) {
          return d.nodeLabel
        })
      barcodeGElements.attr('class', function (d, i) {
        var itemClassArray = []
        var barcodeRectClass = 'barcode-rect'
        var barcodeItemName = 'barcode-' + itemName
        var itemClass = 'barcode-' + d.fatherClass + '-' + d.depth
        var missingClass = 'barcode-missing'
        var existClass = 'barcode-exist'
        if (typeof (d.existArray) !== 'undefined') {
          if (typeof (d.existArray[ itemNameIndex ]) !== 'undefined') {
            itemClassArray.push(existClass)
            itemClassArray.push(barcodeRectClass)
            itemClassArray.push(barcodeItemName)
            itemClassArray.push(itemClass)
          } else {
            itemClassArray.push(missingClass)
            itemClassArray.push(barcodeRectClass)
            itemClassArray.push(barcodeItemName)
            itemClassArray.push(itemClass)
          }
        } else if (typeof (d.lineTreeExist) !== 'undefined') {
          if (d.lineTreeExist) {
            itemClassArray.push(existClass)
            itemClassArray.push(barcodeRectClass)
            itemClassArray.push(barcodeItemName)
            itemClassArray.push(itemClass)
          } else {
            itemClassArray.push(missingClass)
            itemClassArray.push(barcodeRectClass)
            itemClassArray.push(barcodeItemName)
            itemClassArray.push(itemClass)
          }
        } else {
          itemClassArray.push(existClass)
          itemClassArray.push(barcodeRectClass)
          itemClassArray.push(barcodeItemName)
          itemClassArray.push(itemClass)
        }
        return self._group_class(itemClassArray)
      })
        .attr('id', function (d, i) {
          return 'barcode-' + itemName + '-' + i
        })
        .on('mouseover', function (d, i) {
          console.log('mouseover')
          if ((typeof (d.existArray) === 'undefined') ||
            ((typeof (d.existArray) !== 'undefined') && (d.existArray[ itemNameIndex ]))) {
            var parentNodeId = $(this).parent().attr('id')
            self.mouseout_handler(parentNodeId)
            self.tip.hide()
            var id = $(this).attr('id')
            var idSplitArray = id.split('-')
            var nodeIndex = +idSplitArray[ idSplitArray.length - 1 ]
            var selectedTreeId = parentNodeId.replace('barcode-g-', 'tree-')
            self.trigger_highlight_tree(selectedTreeId)
            if ((barcodeCategory !== 'supertreeline') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
              self.mouseover_handler(nodeIndex, parentNodeId, dataSetName, itemName, d)
              if (d.fatherNameLabel != null) {
                self.tip.show(d.fatherNameLabel)
              }
            }
          } else {
            self.mouseout_treeline_handler()
            self.mouseout_handler(parentNodeId)
            self.mouseover_treeline_handler(nodeIndex, parentNodeId, dataSetName, itemName, d)
          }
        })
        .on('mouseout', function (d, i) {
          self.trigger_unhighlight_tree()
        })
        .on('click', function (d, i) {
          //  TODO collapsed the children of ndes
          console.log('d', d)
        })
        .transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return +d.x
        })
        .attr('y', function (d, i) {
          if (typeof (d.y) === 'undefined') {
            return 0
          }
          return +d.y
        })
        .attr('height', function (d, i) {
          return +d.height
        })
        .attr('width', function (d, i) {
          return +d.width
        })
      barcodeGElements.enter()
        .append('rect')
        .attr('class', function (d, i) {
          var itemClassArray = []
          var barcodeRectClass = 'barcode-rect'
          var barcodeItemName = 'barcode-' + itemName
          var itemClass = 'barcode-' + d.fatherClass + '-' + d.depth
          var missingClass = 'barcode-missing'
          var existClass = 'barcode-exist'
          if (typeof (d.existArray) !== 'undefined') {
            if (typeof (d.existArray[ itemNameIndex ]) !== 'undefined') {
              itemClassArray.push(existClass)
              itemClassArray.push(barcodeRectClass)
              itemClassArray.push(barcodeItemName)
              itemClassArray.push(itemClass)
            } else {
              itemClassArray.push(missingClass)
              itemClassArray.push(barcodeRectClass)
              itemClassArray.push(barcodeItemName)
              itemClassArray.push(itemClass)
            }
          } else if (typeof (d.lineTreeExist) !== 'undefined') {
            if (d.lineTreeExist) {
              itemClassArray.push(existClass)
              itemClassArray.push(barcodeRectClass)
              itemClassArray.push(barcodeItemName)
              itemClassArray.push(itemClass)
            } else {
              itemClassArray.push(missingClass)
              itemClassArray.push(barcodeRectClass)
              itemClassArray.push(barcodeItemName)
              itemClassArray.push(itemClass)
            }
          } else {
            itemClassArray.push(existClass)
            itemClassArray.push(barcodeRectClass)
            itemClassArray.push(barcodeItemName)
            itemClassArray.push(itemClass)
          }
          return self._group_class(itemClassArray)
        })
        .attr('id', function (d, i) {
          return 'barcode-' + itemName + '-' + i
        })
        .attr('cursor', 'pointer')
        .attr('x', function (d, i) {
          return +d.x
        })
        .attr('y', function (d, i) {
          if (typeof (d.y) === 'undefined') {
            return 0
          }
          return +d.y
        })
        .attr('height', function (d, i) {
          return +d.height
        })
        .attr('width', function (d, i) {
          return +d.width
        })
        .on('mouseover', function (d, i) {
          var barcodeCategory = Variables.get('barcodeCategory')
          if ((typeof (d.existArray) === 'undefined') ||
            ((typeof (d.existArray) !== 'undefined') && (d.existArray[ itemNameIndex ]))) {
            var parentNodeId = $(this).parent().attr('id')
            self.mouseout_handler(parentNodeId)
            var id = $(this).attr('id')
            var idSplitArray = id.split('-')
            var nodeIndex = +idSplitArray[ idSplitArray.length - 1 ]
            var selectedTreeId = parentNodeId.replace('barcode-g-', 'tree-')
            self.trigger_highlight_tree(selectedTreeId)
            if ((barcodeCategory !== 'supertreeline') || ((barcodeCategory === 'supertreeline') && (d.height == Variables.get('barcodeHeight')))) {
              self.mouseover_handler(nodeIndex, parentNodeId, dataSetName, itemName, d)
              if (d.fatherNameLabel != null) {
                self.tip.show(d.fatherNameLabel)
              }
            } else {
              self.mouseout_treeline_handler()
              self.mouseout_handler(parentNodeId)
              self.mouseover_treeline_handler(parentNodeId, d)
            }
          }
        })
        .on('mouseout', function (d, i) {
          // self.tip.hide()
          self.trigger_unhighlight_tree()
        })
        .on('click', function (d, i) {
          //  TODO collapsed the children of ndes
          console.log('d', d)
        })
      barcodeGElements.exit().remove()

      // TODO
      // 为了测试superTree的效果,注释drawTreeLine
      // self.drawTreeLine(nodeLocationArray, itemName, dataSetName)

      function barcodeModeIconMouseoverHandler (d, i, iconThis, barcodeConfigFontSize) {
        d3.select(iconThis).attr('font-size', barcodeConfigFontSize * 1.2 / 16 + 'em')
      }

      function barcodeModeIconMouseoutHandler (d, i, iconThis, barcodeConfigFontSize) {
        d3.select(iconThis).attr('font-size', barcodeConfigFontSize / 16 + 'em')
      }

      function barcodeModeIconClickHandler (d, i, iconThis, barcodeConfigFontSize) {
        var dataItemName = itemName + '.json'
        var mode = null
        if (d3.select(iconThis).classed('compact-mode')) {
          //  当前的barcodeMode是compact模式
          d3.select(iconThis).text(function (d) { return Config.get('BARCODE_ICON_NAME')[ 'OriginalMode' ] })
          d3.select(iconThis).classed('compact-mode', false)
          d3.select(iconThis).classed('original-mode', true)
          mode = Config.get('BARCODE_MODE').OriginalMode
          self.transition_item_compact_to_original(dataItemName)
        } else if (d3.select(iconThis).classed('original-mode')) {
          d3.select(iconThis).text(function (d) { return Config.get('BARCODE_ICON_NAME')[ 'CompactMode' ] })
          d3.select(iconThis).classed('original-mode', false)
          d3.select(iconThis).classed('compact-mode', true)
          mode = Config.get('BARCODE_MODE').CompactMode
          self.transition_item_original_to_compact(dataItemName)
        }
      }

      function resetIconMouseoverHandler (d, i, iconThis, barcodeConfigFontSize) {
        d3.select(iconThis).attr('font-size', barcodeConfigFontSize * 1.2 / 16 + 'em')
      }

      function resetIconMouseoutHandler (d, i, iconThis, barcodeConfigFontSize) {
        d3.select(iconThis).attr('font-size', barcodeConfigFontSize / 16 + 'em')
      }

      function resetIconClickHandler (d, i, iconThis, barcodeConfigFontSize) {
        var mode = Variables.get('barcodeMode')
        var barcodeSingleWidthArrayObj = Variables.get('barcodeSingleWidthArrayObj')
        delete barcodeSingleWidthArrayObj[ itemName ]
        var dataItemName = itemName + '.json'
        var barcodeCategory = Variables.get('barcodeCategory')
        Variables.set('barcodeSuperWidthArray', undefined)
        var selectBarNameArrayWithUndefined = Variables.get('selectBarNameArrayWithUndefined')
        if (barcodeCategory === 'super') {
          barcodeCollectionModel.request_supertree_barcode_dataset(dataSetName, selectBarNameArrayWithUndefined, mode)
        } else if (barcodeCategory === 'single') {
          barcodeCollectionModel.request_compact_barcode_dataset(dataSetName, dataItemName, mode)
        }
      }

      function labelIconMouseoverHandler (d, i, iconThis, barcodeConfigFontSize) {
        d3.select(iconThis).attr('font-size', barcodeConfigFontSize * 1.2 / 16 + 'em')
      }

      function labelIconMouseoutHandler (d, i, iconThis, barcodeConfigFontSize) {
        d3.select(iconThis).attr('font-size', barcodeConfigFontSize / 16 + 'em')
      }

      function labelIconClickHandler (d, i, iconThis, barcodeConfigFontSize) {}

      function ticksValuesMouseoverHandler (d, i, thisNode, itemName) {
        d3.select(thisNode).classed('mouseover-level-text', true)
        d3.select(thisNode).attr('font-size', (brushPerBarHeight * 1.2) / 16 + 'em')
        d3.select('#barcode-g-' + itemName)
          .append('line')
          .attr('class', 'level-horizontal-line')
          .attr('x1', 0)
          .attr('x2', innerMaxWidth)
          .attr('y1', brushPerBarHeight * d)
          .attr('y2', brushPerBarHeight * d)
        var barcodeNodeClass = 'barcode-' + itemName
        var treeLineNodeClass = 'treeline-' + itemName
        var fileName = itemName + '.json'
        d3.select('#barcode-g-' + itemName)
          .selectAll('.' + barcodeNodeClass)
          .classed('barcode-unhighlight', true)
        d3.select('#barcode-g-' + itemName)
          .selectAll('.' + treeLineNodeClass)
          .classed('treeline-unhighlight', true)
        var barcodeMode = Variables.get('barcodeMode')
        var barcodeCollectionModel = self.options.barcodeCollection
        var nodeLocationArray = []
        var barcodeCategory = Variables.get('barcodeCategory')
        if (barcodeCategory === 'single') {
          var compactArrayArray = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ][ fileName ].treeNodeArray
          if (barcodeMode === 'original') {
            nodeLocationArray = compactArrayArray[ 0 ]
          } else if (barcodeMode === 'compact') {
            nodeLocationArray = compactArrayArray[ compactArrayArray.length - 1 ] //  compactArrayArray.length - 1
          }
        } else if ((barcodeCategory === 'super') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
          var superArrayArray = barcodeCollectionModel.superBarcodeDataCollectionObject[ dataSetName ].treeNodeArray
          if (barcodeMode === 'original') {
            nodeLocationArray = superArrayArray[ 0 ]
          } else if (barcodeMode === 'compact') {
            nodeLocationArray = superArrayArray[ superArrayArray.length - 1 ] //  compactArrayArray.length - 1
          }
        }
        var sameLevelNodeArray = findSameLevelNodes((d - 1), nodeLocationArray)
        for (var l = 0; l < sameLevelNodeArray.length; l++) {
          d3.select('#' + barcodeNodeClass + '-' + sameLevelNodeArray[ l ]).classed('barcode-unhighlight', false)
          // d3.select('#' + barcodeNodeClass + '-' + sameLevelNodeArray[ l ]).classed('barcode-mouseover-highlight', true)
          d3.select('#' + barcodeNodeClass + '-' + sameLevelNodeArray[ l ]).classed('barcode-root-path-highlight', true)
          d3.select('#' + treeLineNodeClass + '-' + sameLevelNodeArray[ l ]).classed('treeline-unhighlight', false)
          d3.select('#' + treeLineNodeClass + '-' + sameLevelNodeArray[ l ]).classed('treeline-root-path-highlight', true)
        }
      }

      function findSameLevelNodes (level, nodeLocationArray) {
        var findNodeArray = []
        for (var i = 0; i < nodeLocationArray.length; i++) {
          if (nodeLocationArray[ i ].depth === level) {
            findNodeArray.push(i)
          }
        }
        return findNodeArray
      }

      function ticksValuesMouseoutHandler (d, i, thisNode, itemName) {
        d3.select(thisNode).classed('mouseover-level-text', false)
        if (!d3.select(thisNode).classed('click-level-text')) {
          d3.select(thisNode).attr('font-size', (brushPerBarHeight * 0.7) / 16 + 'em')
        }
        d3.select('#barcode-g-' + itemName)
          .selectAll('.level-horizontal-line')
          .remove()
        d3.select('#barcode-g-' + itemName).selectAll('.barcode-unhighlight').classed('barcode-unhighlight', false)
        d3.select('#barcode-g-' + itemName).selectAll('.treeline-unhighlight').classed('treeline-unhighlight', false)
        d3.select('#barcode-g-' + itemName).selectAll('.barcode-root-path-highlight').classed('barcode-root-path-highlight', false)
        d3.select('#barcode-g-' + itemName).selectAll('.treeline-root-path-highlight').classed('treeline-root-path-highlight', false)
        // d3.select('#barcode-g-' + itemName).selectAll('.barcode-mouseover-highlight').classed('barcode-mouseover-highlight', false)
      }

      function ticksValueClickHandler (d, i, thisNode, itemName) {
        var isClick = d3.select(thisNode).classed('click-level-text')
        if (!isClick) {
          d3.select(thisNode).classed('click-level-text', true)
          d3.select(thisNode).attr('font-size', (brushPerBarHeight * 1.2) / 16 + 'em')
        } else {
          d3.select(thisNode).classed('click-level-text', false)
          d3.select(thisNode).attr('font-size', (brushPerBarHeight * 0.7) / 16 + 'em')
        }
        var barcodeNodeClass = 'barcode-' + itemName
        var treeLineNodeClass = 'treeline-' + itemName
        var fileName = itemName + '.json'
        d3.select('#barcode-g-' + itemName).selectAll('.' + barcodeNodeClass).classed('click-barcode-unhighlight', true)
        d3.select('#barcode-g-' + itemName).selectAll('.click-barcode-root-path-highlight').classed('click-barcode-unhighlight', false)
        d3.select('#barcode-g-' + itemName).selectAll('.' + treeLineNodeClass).classed('click-treeline-unhighlight', true)
        d3.select('#barcode-g-' + itemName).selectAll('.click-treeline-root-path-highlight').classed('click-treeline-unhighlight', false)
        var barcodeMode = Variables.get('barcodeMode')
        var barcodeCollectionModel = self.options.barcodeCollection
        var nodeLocationArray = []
        var barcodeCategory = Variables.get('barcodeCategory')
        if (barcodeCategory === 'single') {
          var compactArrayArray = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ][ fileName ].treeNodeArray
          if (barcodeMode === 'original') {
            nodeLocationArray = compactArrayArray[ 0 ]
          } else if (barcodeMode === 'compact') {
            nodeLocationArray = compactArrayArray[ compactArrayArray.length - 1 ] //  compactArrayArray.length - 1
          }
        } else if ((barcodeCategory === 'super') || ((barcodeCategory === 'supertreeline') && (Variables.get('treeLineHeight') === Variables.get('barcodeHeight')))) {
          var superArrayArray = barcodeCollectionModel.superBarcodeDataCollectionObject[ dataSetName ].treeNodeArray
          if (barcodeMode === 'original') {
            nodeLocationArray = superArrayArray[ 0 ]
          } else if (barcodeMode === 'compact') {
            nodeLocationArray = superArrayArray[ superArrayArray.length - 1 ] //  compactArrayArray.length - 1
          }
        }
        var sameLevelNodeArray = findSameLevelNodes((d - 1), nodeLocationArray)
        for (var l = 0; l < sameLevelNodeArray.length; l++) {
          if (!isClick) {
            d3.select('#' + barcodeNodeClass + '-' + sameLevelNodeArray[ l ]).classed('click-barcode-unhighlight', false)
            d3.select('#' + barcodeNodeClass + '-' + sameLevelNodeArray[ l ]).classed('click-barcode-root-path-highlight', true)
            d3.select('#' + treeLineNodeClass + '-' + sameLevelNodeArray[ l ]).classed('click-treeline-unhighlight', false)
            d3.select('#' + treeLineNodeClass + '-' + sameLevelNodeArray[ l ]).classed('click-treeline-root-path-highlight', true)
          } else {
            d3.select('#' + barcodeNodeClass + '-' + sameLevelNodeArray[ l ]).classed('click-barcode-unhighlight', true)
            d3.select('#' + barcodeNodeClass + '-' + sameLevelNodeArray[ l ]).classed('click-barcode-root-path-highlight', false)
            d3.select('#' + treeLineNodeClass + '-' + sameLevelNodeArray[ l ]).classed('click-treeline-unhighlight', true)
            d3.select('#' + treeLineNodeClass + '-' + sameLevelNodeArray[ l ]).classed('click-treeline-root-path-highlight', false)
          }
        }
        if (d3.select('#barcode-g-' + itemName).selectAll('.click-level-text')[ 0 ].length === 0) {
          d3.select('#barcode-g-' + itemName).selectAll('.click-barcode-unhighlight').classed('click-barcode-unhighlight', false)
          d3.select('#barcode-g-' + itemName).selectAll('.click-treeline-unhighlight').classed('click-treeline-unhighlight', false)
        }
      }

      function dragmove (d) {
        if (false) {
          dragrect
            .attr('x', d.x = Math.max(0, Math.min(w - width, d3.event.x)))
          dragbarleft
            .attr('x', function (d) { return d.x - (dragbarw / 2) })
          dragbarright
            .attr('x', function (d) { return d.x + width - (dragbarw / 2) })
          dragbartop
            .attr('x', function (d) { return d.x + (dragbarw / 2) })
          dragbarbottom
            .attr('x', function (d) { return d.x + (dragbarw / 2) })
        }
        if (false) {
          dragrect
            .attr('y', d.y = Math.max(0, Math.min(h - height, d3.event.y)))
          dragbarleft
            .attr('y', function (d) { return d.y + (dragbarw / 2) })
          dragbarright
            .attr('y', function (d) { return d.y + (dragbarw / 2) })
          dragbartop
            .attr('y', function (d) { return d.y - (dragbarw / 2) })
          dragbarbottom
            .attr('y', function (d) { return d.y + height - (dragbarw / 2) })
        }
      }

      function ldragresize (d) {
        if (isXChecked) {
          var itemName = d.itemName
          var oldx = d.x
          //  Max x on the right is x + width - dragbarw
          //  Max x on the left is 0 - (dragbarw/2)
          var eventX = d3.event.x - dragLeftReStore
          d.x = Math.max(0, Math.min(d.x + width - (dragbarw / 2), eventX))
          var dragLeftX = d.x
          width = width + (oldx - d.x)
          d3.select('#barcode-g-' + itemName).selectAll('.dragleft').attr('x', function (d) { return dragLeftX })
          d3.select('#barcode-g-' + itemName).selectAll('.bg-rect').attr('x', function (d) { return dragLeftX }).attr('width', width)
          d3.select('#barcode-g-' + itemName).selectAll('.dragtop').attr('x', function (d) { return dragLeftX }).attr('width', width)
          d3.select('#barcode-g-' + itemName).selectAll('.dragbottom').attr('x', function (d) { return dragLeftX }).attr('width', width)
        }
      }

      function rdragresize (d) {
        if (isXChecked) {
          var itemName = d.itemName
          //  Max x on the left is x - width
          //  Max x on the right is width of screen + (dragbarw/2)
          var bgRectWidth = d3.selectAll('.bg-rect').attr('width')
          var dragx = Math.max(d.x + (dragbarw / 2), Math.min(w, d.x + width + d3.event.dx))
          //  recalculate width
          width = dragx - d.x

          d3.select('#barcode-g-' + itemName).selectAll('.dragright').attr('x', function (d) { return width - dragbarw / 2 })
          d3.select('#barcode-g-' + itemName).selectAll('.bg-rect').attr('width', width)
          d3.select('#barcode-g-' + itemName).selectAll('.dragtop').attr('width', width)
          d3.select('#barcode-g-' + itemName).selectAll('.dragbottom').attr('width', width)
        }
      }

      function tdragresize (d) {
        if (isYChecked) {
          var oldy = d.y
          //  Max x on the right is x + width - dragbarw
          //  Max x on the left is 0 - (dragbarw/2)
          d.y = Math.max(0, Math.min(d.y + height - (dragbarw / 2), d3.event.y))
          height = height + (oldy - d.y)

          d3.selectAll('.dragright').attr('y', function (d) { return d.y + (dragbarw / 2) }).attr('height', height)
          d3.selectAll('.dragleft').attr('y', function (d) { return d.y + (dragbarw / 2) }).attr('height', height)
          d3.selectAll('.bg-rect').attr('y', function (d) { return d.y }).attr('height', height)
          d3.selectAll('.dragtop').attr('y', function (d) { return d.y })
        }
      }

      function bdragresize (d) {
        if (isYChecked) {
          //  Max x on the left is x - width
          //  Max x on the right is width of screen + (dragbarw/2)
          var dragy = Math.max(d.y + (dragbarw / 2), Math.min(h, d.y + height + d3.event.dy))

          //  recalculate width
          height = dragy - d.y

          d3.selectAll('.dragright').attr('height', height)
          d3.selectAll('.dragleft').attr('height', height)
          d3.selectAll('.bg-rect').attr('height', height)
          d3.selectAll('.dragbottom').attr('y', function (d) { return dragy })
        }
      }

      function changeBarcodeHeight (d) {
        d3.selectAll('.bg-rect').attr('height')
        var formerBarcodeHeight = Variables.get('barcodeHeight')
        var formerCurrentRatio = height / formerBarcodeHeight
        var formerAggreCurrentHeightRatio = Variables.get('formerAggreCurrentHeightRatio')
        formerAggreCurrentHeightRatio = formerAggreCurrentHeightRatio * formerCurrentRatio
        Variables.set('formerAggreCurrentHeightRatio', formerAggreCurrentHeightRatio)
        Variables.set('formerCurrentHeightRatio', formerCurrentRatio)
        var barcodeCollection = self.options.barcodeCollection
        barcodeCollection.update_existed_barcode_dataset_height(dataSetName)
        height = Variables.get('barcodeHeight')
      }

      function changeBarcodeWidth (d) {
        var itemName = d.itemName
        var bgRectX = d3.select('#bg-rect-' + itemName).attr('x')
        var bgRectWidth = +d3.select('#bg-rect-' + itemName).attr('width')
        var newDragLeftX = -(dragbarw / 2)
        var newDragRightX = newDragLeftX + bgRectWidth
        d3.selectAll('.dragleft').attr('x', newDragLeftX).attr('y', -(dragbarw / 2))
        d3.selectAll('.dragright').attr('x', newDragRightX).attr('y', -(dragbarw / 2))
        d3.selectAll('.dragtop').attr('x', newDragLeftX)
        d3.selectAll('.dragbottom').attr('x', newDragLeftX)
        d3.selectAll('.bg-rect').attr('x', bgRectX)
        var formerBarcodeWidthObj = Variables.get('barcodeMaxWidthObj')
        var barcodeWidthItemName = itemName + '.json'
        var formerBarcodeWidth = formerBarcodeWidthObj[ barcodeWidthItemName ]
        formerBarcodeWidthObj[ barcodeWidthItemName ] = bgRectWidth
        Variables.set('barcodeMaxWidthObj', formerBarcodeWidthObj)
        var formerCurrentWidthRatio = bgRectWidth / formerBarcodeWidth
        Variables.set('formerCurrentWidthRatio', formerCurrentWidthRatio)
        var formerAggreCurrentWidthRatio = Variables.get('formerAggreCurrentWidthRatio')
        formerAggreCurrentWidthRatio = formerAggreCurrentWidthRatio * formerCurrentWidthRatio
        Variables.set('formerAggreCurrentWidthRatio', formerAggreCurrentWidthRatio)
        self.options.barcodeCollection.update_existed_barcode_dataset_width(dataSetName)
      }

      //  鼠标悬浮在变换barcode高度与宽度时,出现边框
      function dragBarMouseoverHandler (d) {
        var itemName = d.itemName
        d3.select('#bg-rect-' + itemName).classed('mouseover-highlight', true)
      }

      function dragBarMouseoutHandler (d) {
        var itemName = d.itemName
        d3.select('#bg-rect-' + itemName).classed('mouseover-highlight', false)
      }
    },
    mouseout_treeline_handler: function(){
      var self = this
      var svg = d3.select('#barcode-main-svg')
      // svg.selectAll('.barcode-rect').classed('barcode-unhighlight', true)
      svg.selectAll('.barcode-matrix-highlight').classed('barcode-matrix-highlight', false)
    },
    mouseover_treeline_handler: function (parentNodeId, d) {
      var self = this
      var svg = d3.select('#barcode-main-svg')
      // svg.selectAll('.barcode-rect').classed('barcode-unhighlight', true)
      svg.select('#' + parentNodeId).selectAll('rect').classed('barcode-matrix-highlight', true)
      svg.select('#' + parentNodeId).selectAll('.barcode-bg-rect').classed('barcode-matrix-highlight', false)
      if (typeof (d) !== 'undefined') {
        var itemClass = 'barcode-' + d.fatherClass + '-' + d.depth
        svg.selectAll('.' + itemClass).classed('barcode-matrix-highlight', true)
      }
    },
    //  传入的itemName是没有.json后缀的名字
    mouseover_handler: function (nodeIndex, parentNodeId, dataSetName, itemName, thisNode) {
      var self = this
      var nodeIdPrefix = parentNodeId.replace('barcode-g-', 'barcode-')
      var treeLineNodeIdPrefix = parentNodeId.replace('barcode-g-', 'treeline-')
      var fileName = nodeIdPrefix.replace('barcode-', '') + '.json'
      var barcodeMode = Variables.get('barcodeMode')
      var barcodeCollectionModel = self.options.barcodeCollection
      var itemNameWithJson = itemName + '.json'
      var selectBarNameArray = Variables.get('selectBarNameArray')
      var mouseoverItemIndex = selectBarNameArray.indexOf(itemNameWithJson)
      var nodeLocationArray = []
      var nodeDepth = null
      var thisNodeClass = null
      var barcodeCategory = Variables.get('barcodeCategory')
      var compactArrayArray = null
      if (barcodeCategory === 'single') {
        compactArrayArray = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ][ fileName ].treeNodeArray
      } else if ((barcodeCategory === 'super') || ((barcodeCategory === 'supertreeline') && (thisNode.height == Variables.get('barcodeHeight')))) {
        compactArrayArray = barcodeCollectionModel.superBarcodeDataCollectionObject[ dataSetName ].treeNodeArray
      }
      if (barcodeMode === 'original') {
        nodeLocationArray = compactArrayArray[ 0 ]
      } else if (barcodeMode === 'compact') {
        // var compactArrayArray = barcodeCollectionModel.compactBarcodeTransitionDataCollectionObject[ dataSetName ][ fileName ].treeNodeArray
        nodeLocationArray = compactArrayArray[ compactArrayArray.length - 1 ] //  compactArrayArray.length - 1
      }
      nodeDepth = nodeLocationArray[ nodeIndex ].depth
      thisNodeClass = 'barcode-' + nodeLocationArray[ nodeIndex ].fatherClass + '-' + nodeDepth
      var svg = d3.select('#barcode-main-svg')
      svg.selectAll('.barcode-rect').classed('barcode-unhighlight', true)
      svg.selectAll('.tree-line').classed('treeline-unhighlight', true)
      // 增加fatherClass, 是为了帮助找到father, children, 以及sibling的classname
      // self.add_category_name(nodeLocationArray)
      var fathersRoot = findFathers(nodeIndex, nodeLocationArray, nodeDepth, mouseoverItemIndex)
      var childrens = findChildren(nodeIndex, nodeLocationArray, nodeDepth, mouseoverItemIndex)
      var siblings = findSiblings(nodeIndex, nodeLocationArray, nodeDepth, mouseoverItemIndex)
      for (var j = 0; j < childrens.length; j++) {
        svg.selectAll('.barcode-' + childrens[ j ]).classed('barcode-unhighlight', false)
        svg.selectAll('.barcode-' + childrens[ j ]).classed('barcode-children-highlight', true)
        svg.selectAll('.barcode-' + childrens[ j ]).classed('treeline-unhighlight', false)
        svg.selectAll('.barcode-' + childrens[ j ]).classed('barcode-children-highlight', true)
      }
      for (var k = 0; k < siblings.length; k++) {
        svg.selectAll('.barcode-' + siblings[ k ]).classed('barcode-unhighlight', false)
        svg.selectAll('.barcode-' + siblings[ k ]).classed('barcode-sibling-highlight', true)
        svg.selectAll('.barcode-' + siblings[ k ]).classed('treeline-unhighlight', false)
        svg.selectAll('.barcode-' + siblings[ k ]).classed('barcode-sibling-highlight', true)
      }
      drawPathFromRoot(fathersRoot, nodeIdPrefix, itemName)
      // drawPathFromRoot(fathersRoot, dataSetName)
      svg.selectAll('.' + thisNodeClass).classed('barcode-unhighlight', false)
      svg.selectAll('.' + thisNodeClass).classed('barcode-root-path-highlight', true)

      function drawPathFromRoot (fathersRoot, nodeIdPrefix, itemName) {
        var beginX = 0
        var beginY = 0
        var endX = 0
        var endY = 0
        for (var i = 0; i < fathersRoot.length; i++) {
          svg.select('#' + nodeIdPrefix + '-' + fathersRoot[ i ]).classed('barcode-unhighlight', false)
          svg.select('#' + nodeIdPrefix + '-' + fathersRoot[ i ]).classed('barcode-root-path-highlight', true)
          var nodeX = +d3.select('#' + nodeIdPrefix + '-' + fathersRoot[ i ]).attr('x')
          var nodeY = +d3.select('#' + nodeIdPrefix + '-' + fathersRoot[ i ]).attr('y')
          var nodeWidth = +d3.select('#' + nodeIdPrefix + '-' + fathersRoot[ i ]).attr('width')
          var nodeHeight = +d3.select('#' + nodeIdPrefix + '-' + fathersRoot[ i ]).attr('height')
          var centerX = nodeX + nodeWidth / 2
          var centerY = nodeY + nodeHeight / 2
          if (i === 0) {
            beginX = centerX
            beginY = centerY
          }
          if (i === (fathersRoot.length - 1)) {
            endX = centerX
            endY = centerY
          }
          d3.select('#' + 'barcode-g-' + itemName)
            .append('circle')
            .attr('class', 'barcode-circle barcode-root-path')
            .attr('cx', centerX)
            .attr('cy', centerY)
        }
        d3.select('#' + 'barcode-g-' + itemName)
          .append('line')
          .attr('class', 'barcode-line barcode-root-path')
          .attr('x1', beginX)
          .attr('y1', beginY)
          .attr('x2', endX)
          .attr('y2', endY)
      }

      function findFathersName (nodeIndex, nodeLocationArray, nodeDepth) {
        var fatherNodesNameArray = []
        var category = null
        if (!((nodeDepth > 3) || (nodeDepth === 0))) {
          var fatherDepth = nodeDepth
          for (var i = nodeIndex; i >= 0; i--) {
            if (fatherDepth > 0) {
              if (nodeLocationArray[ i ].depth === fatherDepth) {
                fatherDepth = fatherDepth - 1
                fatherNodesNameArray.push(nodeLocationArray[ i ].name)
              }
            }
          }
          category = self.get_treeNode_name(fatherNodesNameArray)
        } else {
          category = nodeLocationArray[ nodeIndex ].name
        }
        return category
      }

      function findFathers (nodeIndex, nodeLocationArray, nodeDepth, mouseoverItemIndex) {
        var fatherNodesArray = []
        var fatherDepth = nodeDepth
        var className = null
        for (var i = nodeIndex; i >= 0; i--) {
          if ((typeof (mouseoverItemIndex) === 'undefined') ||
            ((typeof (mouseoverItemIndex) !== 'undefined') && (nodeLocationArray[ i ].existArray[ mouseoverItemIndex ]))) {
            if (fatherDepth >= 0) {
              if ((nodeLocationArray[ i ].depth === fatherDepth) && (!nodeLocationArray[ i ].isCompact)) {
                fatherDepth = fatherDepth - 1
                fatherNodesArray.push(i)
                // className = nodeLocationArray[ i ].fatherClass + '-' + nodeLocationArray[ i ].depth
                // fatherNodesArray.push(className)
              }
            }
          }
        }
        return fatherNodesArray
      }

      function findSiblings (nodeIndex, nodeLocationArray, nodeDepth, mouseoverItemIndex) {
        var siblingsNodesArray = []
        var siblingDepth = nodeDepth
        var className = null
        for (var i = (nodeIndex); i < nodeLocationArray.length; i++) {
          if ((typeof (mouseoverItemIndex) === 'undefined') ||
            ((typeof (mouseoverItemIndex) !== 'undefined') && (nodeLocationArray[ i ].existArray[ mouseoverItemIndex ]))) {
            if (nodeLocationArray[ i ].depth === (siblingDepth)) {
              // siblingsNodesArray.push(i)
              className = nodeLocationArray[ i ].fatherClass + '-' + nodeLocationArray[ i ].depth
              siblingsNodesArray.push(className)
            }
            if (nodeLocationArray[ i ].depth === (nodeDepth - 1)) {
              break
            }
          }
        }
        for (var j = (nodeIndex - 1); j >= 0; j--) {
          if ((typeof (mouseoverItemIndex) === 'undefined') ||
            ((typeof (mouseoverItemIndex) !== 'undefined') && (nodeLocationArray[ j ].existArray[ mouseoverItemIndex ]))) {
            if (nodeLocationArray[ j ].depth === (siblingDepth)) {
              className = nodeLocationArray[ j ].fatherClass + '-' + nodeLocationArray[ j ].depth
              siblingsNodesArray.push(className)
            }
            if (nodeLocationArray[ j ].depth === (nodeDepth - 1)) {
              break
            }
          }
        }
        return siblingsNodesArray
      }

      function findChildren (nodeIndex, nodeLocationArray, nodeDepth, mouseoverItemIndex) {
        var childrenNodesArray = []
        var childrenDepth = nodeDepth + 1
        for (var i = (nodeIndex + 1); i < nodeLocationArray.length; i++) {
          if ((typeof (mouseoverItemIndex) === 'undefined') ||
            ((typeof (mouseoverItemIndex) !== 'undefined') && (nodeLocationArray[ i ].existArray[ mouseoverItemIndex ]))) {
            if (nodeLocationArray[ i ].depth === childrenDepth) {
              var className = nodeLocationArray[ i ].fatherClass + '-' + nodeLocationArray[ i ].depth
              childrenNodesArray.push(className)
            }
            if (nodeLocationArray[ i ].depth === nodeDepth) {
              break
            }
          }
        }
        return childrenNodesArray
      }
    },
    add_category_name: function (nodeLocationArray) {
      var self = this
      for (var i = 0; i < nodeLocationArray.length; i++) {
        var nodeIndex = i
        var nodeDepth = nodeLocationArray[ i ].depth
        var fatherNameLabel = findFathersName(nodeIndex, nodeLocationArray, nodeDepth) + ''
        var fatherClass = fatherNameLabel.replace('/', '')
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
        console.log('fatherNameLabel', fatherNameLabel)
        nodeLocationArray[ i ].fatherNameLabel = fatherNameLabel
        nodeLocationArray[ i ].fatherClass = fatherClass
      }
      function findFathersName (nodeIndex, nodeLocationArray, nodeDepth) {
        var fatherNodesNameArray = []
        var category = null
        if (!((nodeDepth > 3) || (nodeDepth === 0))) {
          var fatherDepth = nodeDepth
          for (var i = nodeIndex; i >= 0; i--) {
            if (fatherDepth > 0) {
              if (nodeLocationArray[ i ].depth === fatherDepth) {
                fatherDepth = fatherDepth - 1
                fatherNodesNameArray.push(nodeLocationArray[ i ].name)
              }
            }
          }
          category = self.get_treeNode_name(fatherNodesNameArray)
          // var fatherNodesNum = ''
          // if (fatherNodesNameArray.length === 3) {
          //   fatherNodesNum = ''
          //   for (var j1 = (fatherNodesNameArray.length - 1); j1 >= 0; j1--) {
          //     fatherNodesNum = fatherNodesNum + fatherNodesNameArray[ j1 ]
          //   }
          //   fatherNodesNum = +fatherNodesNum
          // } else if (fatherNodesNameArray.length === 2) {
          //   fatherNodesNum = ''
          //   for (var j2 = (fatherNodesNameArray.length - 1); j2 >= 0; j2--) {
          //     fatherNodesNum = fatherNodesNum + fatherNodesNameArray[ j2 ]
          //   }
          //   fatherNodesNum = +fatherNodesNum
          //   fatherNodesNum = fatherNodesNum * 10
          // } else if (fatherNodesNameArray.length === 1) {
          //   fatherNodesNum = +fatherNodesNameArray[ 0 ]
          //   fatherNodesNum = fatherNodesNum * 100
          // }
        } else {
          category = nodeLocationArray[ nodeIndex ].name
        }
        return category
      }
    },
    mouseout_handler: function (parentNodeId) {
      var self = this
      self.trigger_unhighlight_tree()
      var svg = d3.select('#barcode-main-svg')
      svg.selectAll('.barcode-unhighlight').classed('barcode-unhighlight', false)//select('#' + parentNodeId).
      svg.selectAll('.treeline-unhighlight').classed('treeline-unhighlight', false)//select('#' + parentNodeId).
      svg.selectAll('.barcode-children-highlight').classed('barcode-children-highlight', false)//select('#' + parentNodeId).
      svg.selectAll('.barcode-sibling-highlight').classed('barcode-sibling-highlight', false)//select('#' + parentNodeId).
      svg.selectAll('.barcode-root-path-highlight').classed('barcode-root-path-highlight', false)//select('#' + parentNodeId).
      svg.selectAll('.barcode-root-path').remove()// select('#' + parentNodeId).
    },
    get_treeNode_name: function (fatherNodesNameArray) {
      var self = this
      var categoryModel = self.options.categoryModel
      var categoryObj = categoryModel.get('categoryNameObj')[ 'DailyRecordTree' ]
      for (var i = fatherNodesNameArray.length - 1; i >= 0; i--) {
        var nodeIndex = fatherNodesNameArray[ i ]
        if (typeof (categoryObj) !== 'undefined') {
          categoryObj = categoryObj.children[ nodeIndex ]
        } else {
          return ''
        }
      }
      if (typeof (categoryObj) === 'undefined') {
        return ''
      }
      return categoryObj.category
    },
    click_handler: function (nodeLocationArray) {
      for (var i = 0; i < nodeLocationArray.length; i++) {
      }
    },
    remove_single_barcode: function (dataItemName) {
      var self = this
      var svg = self.d3el
      dataItemName = dataItemName.replace('.json', '')
      svg.select('#barcode-g-' + dataItemName).remove()
    },
    _group_class: function (classNameArray) { //  将所有的类名组织起来
      var className = classNameArray[ 0 ]
      for (var i = 1; i < classNameArray.length; i++) {
        className = className + ' ' + classNameArray[ i ]
      }
      return className
    }
  }, SVGBase))
})
