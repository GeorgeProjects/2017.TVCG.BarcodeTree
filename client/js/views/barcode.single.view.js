define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'config',
  'jquery',
  'd3',
  'variables',
  'views/svg-base.addon'
], function (require, Mn, _, Backbone, Config, $, d3, Variables, SVGBase) {
  'use strict'

  return Mn.ItemView.extend(_.extend({
      tagName: 'g',
      template: false,
      attributes: {
        'barcodePaddingLeft': Variables.get('barcodePadding')
      },
      initialize: function () {
        var self = this
        self.init_common_util()
        self.listenTo(self.model, 'change:barcodeNodeHeight change:barcodeNodeAttrArray change:barcodeTreeYLocation', self.update_view)//
        self.listenTo(self.model, 'change:viewUpdateValue', self.shrink_barcode_tree)
        self.listenTo(self.model, 'change:viewUpdateConcurrentValue', self.render_barcode_tree())
        self.listenTo(self.model, 'change:moveFirstPaddingNextUpdateValue', self.update_aligned_barcode_node_concurrent)
        Backbone.Events.on(Config.get('EVENTS')[ 'HOVERING_SORT_BARCODE_NODE' ], function (event) {
          var barcodeNodeId = event.barcodeNodeId
          self.highlight_sort_node(barcodeNodeId)
        })
        Backbone.Events.on(Config.get('EVENTS')[ 'UNHOVERING_SORT_BARCODE_NODE' ], function () {
          self.unhighlight_sort_node()
        })
        //  直接更新视图, 一起更新
        Backbone.Events.on(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW' ], function () {
          self.render_barcode_tree()
        })
        Backbone.Events.on(Config.get('EVENTS')[ 'UPDATE_BARCODE_LOC' ], function () {
          self.update_view_location()
        })
        Backbone.Events.on(Config.get('EVENTS')[ 'UPDATE_SUMMARY' ], function () {
          self.add_summary()
        })
        Backbone.Events.on(Config.get('EVENTS')[ 'UPDATE_FILTERING_HIGHLIGHT_NODES' ], function (event) {
          var highlightObjArray = event.highlightObjArray
          var distributionLevel = event.distributionLevel
          self.update_filtering_nodes(highlightObjArray, distributionLevel)
        })
        Backbone.Events.on(Config.get('EVENTS')[ 'HIGH_RELATED_NODES' ], function (event) {
          var thisNodeObj = event.thisNodeObj
          var findingNodesObj = event.findingNodesObj
          var thisTreeFindingNodesObj = self.highlight_related_nodes(thisNodeObj)
          var comparedResultsObj = self.compareNodes(findingNodesObj, thisTreeFindingNodesObj)
          self.highlight_finding_node(findingNodesObj)
        })
        //  取消mouseover的高亮效果
        Backbone.Events.on(Config.get('EVENTS')[ 'NODE_MOUSEOUT' ], function (event) {
          self.node_mouseout_handler()
        })
      },
      init_common_util: function () {
        var self = this
        //  初始化颜色计算的工具
        var white = d3.rgb(255, 255, 255)
        var black = d3.rgb(0, 0, 0)
        var colorCompute = d3.interpolate(white, black)
        self.colorCompute = colorCompute
      },
      compareNodes: function (basedFindingNodesObj, thisTreeFindingNodesObj) {
        var self = this
        var globalCompareResult = {}
        globalCompareResult.childrenNodes = innerCompare(basedFindingNodesObj.childrenNodes, thisTreeFindingNodesObj.childrenNodes)
        globalCompareResult.fatherCurrentNodes = innerCompare(basedFindingNodesObj.fatherCurrentNodes, thisTreeFindingNodesObj.fatherCurrentNodes)
        globalCompareResult.siblingNodes = innerCompare(basedFindingNodesObj.siblingNodes, thisTreeFindingNodesObj.siblingNodes)
        return globalCompareResult
        function innerCompare (array1, array2) {
          for (var a1I = 0; a1I < array1.length; a1I++) {
            for (var a2I = 0; a2I < array2.length; a2I++) {
              if (array1[ a1I ].id === array2[ a2I ].id) {
                array1[ a1I ].compare_result = 'same'
                array2[ a2I ].compare_result = 'same'
              }
            }
          }
          for (var a1I = 0; a1I < array1.length; a1I++) {
            if (array1[ a1I ].compare_result !== 'same') {
              array1[ a1I ].compare_result = 'miss'
            }
          }
          for (var a2I = 0; a2I < array2.length; a2I++) {
            if (array2[ a2I ].compare_result !== 'same') {
              array2[ a2I ].compare_result = 'add'
            }
          }
          var compareResultObj = {}
          compareResultObj.same = []
          compareResultObj.add = []
          compareResultObj.miss = []
          for (var a1I = 0; a1I < array1.length; a1I++) {
            if (array1[ a1I ].compare_result === 'same') {
              compareResultObj.same.push(array1[ a1I ])
            } else if (array1[ a1I ].compare_result === 'miss') {
              compareResultObj.miss.push(array1[ a1I ])
            }
          }
          for (var a2I = 0; a2I < array2.length; a2I++) {
            if (array2[ a2I ].compare_result === 'add') {
              compareResultObj.add.push(array2[ a2I ])
            }
          }
          return compareResultObj
        }
      },
      onShow: function () {
        var self = this
        var treeDataModel = self.model
        var compareBased = treeDataModel.get('compareBased')
        var barcodeIndex = treeDataModel.get('barcodeIndex')
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeRectBgColor = treeDataModel.get('barcodeRectBgColor')
        var barcodeNodeHeight = window.barcodeHeight
        var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')
        // var barcodeTreeYLocation = barcodeIndex * barcodeNodeHeight + barcodeIndex
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodePaddingTop = barcodeHeight * 0.1
        var containerWidth = $('#barcodetree-scrollpanel').width()
        var barcodePaddingLeft = self.attributes.barcodePaddingLeft
        var tip = window.tip
        self.d3el.call(tip)
        self.singleTree = self.d3el.attr('id', barcodeTreeId)
          .attr('class', 'single-tree')
        self.singleTree
          .attr('transform', 'translate(' + 0 + ',' + barcodeTreeYLocation + ')')
        self.singleTree.append('rect')
          .attr('class', function () {
            var colorClass = barcodeIndex % 2 ? 'bg-odd' : 'bg-even'
            colorClass = colorClass + ' bg'
            if (compareBased) {
              colorClass = colorClass + ' compare-based-selection'
            }
            return colorClass
          })
          .attr('width', containerWidth)
          .attr('height', barcodeHeight)
          .on('mouseover', function () {
            d3.selectAll('.bg').classed('hovering-highlight', false)
            d3.select(this).classed('hovering-highlight', true)
            d3.selectAll('.barcode-node').classed('.mouseover-unhighlight', false)
            self.trigger_hovering_event()
            var dayArray = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ]
            var dateInTip = barcodeTreeId.split('-')[ 1 ].replaceAll('_', '/')
            var date = barcodeTreeId.split('-')[ 1 ].replaceAll('_', '-')
            var curDay = new Date(date).getDay()
            var tipValue = "date:<span style='color:#ff0000'>" + dateInTip + "</span>" //+ ",value:<span style='color:red'>" + barValue + "</span>"
              + ",Day:<span style='color:red'>" + dayArray[ curDay ] + "</span>"
            // var tipValue = "date:<span style='color:red'>" + date + "</span>" + ",value:<span style='color:red'>" + barValue + "</span>"
            //   + ",Day:<span style='color:red'>" + dayArray[ curDay ] + "</span>"
            tip.show(tipValue)
          })
          .on('mouseout', function () {
            d3.select(this).classed('hovering-highlight', false)
            self.d3el.select('#barcode-container').selectAll('.barcode-node').classed('mouseover-unhighlight', false)
            self.trigger_unhovering_event()
            self.node_mouseout_handler()
            self.trigger_render_cover_rect()
          })
          .on('click', function () {
            if (d3.select(this).classed('compare-based-selection')) {
              self.trigger_unclick_event()
            } else {
              self.trigger_click_event()
            }
          })
          .style('fill', barcodeRectBgColor)
        //  TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        //var barcodeNodeAttrArray = self.model.get('barcodeNodeAttrArray')
        var barcodeTreeLabelYearMonthDday = barcodeTreeId.split('-')[ 1 ]
        var barcodeTreeLabelMonthDday = barcodeTreeLabelYearMonthDday.substring(5, barcodeTreeLabelYearMonthDday.length).replaceAll('_', '/')
        self.singleTree.append('text')
          .text(barcodeTreeLabelMonthDday)
          .attr('id', 'barcode-label')
          .attr('x', 3)
          .attr('y', barcodeHeight / 2)
          .attr('text-anchor', 'start')
          .attr('alignment-baseline', 'middle')
          .style("cursor", "pointer")
          .on('mouseover', function (d, i) {
            self.d3el.select('.bg').classed('hovering-highlight', true)
            self.trigger_hovering_event()
          })
          .on('mouseout', function (d, i) {
            self.d3el.select('.bg').classed('hovering-highlight', false)
          })
        self.barcodeContainer = self.d3el.append('g')
          .attr('transform', 'translate(' + barcodePaddingLeft + ',' + barcodePaddingTop + ')')
          .attr('id', 'barcode-container')
        // var maxWidth = barcodeNodeAttrArray[ barcodeNodeAttrArray.length - 1 ].x + barcodeNodeAttrArray[ barcodeNodeAttrArray.length - 1 ].width
        // var extentLength = barcodePaddingTop
        self.render_barcode_tree()
        // 更新barcode的标签的字体大小
        if (barcodeHeight < 16) {
          self.d3el.select('#barcode-label')
            .style('font-size', function (d) {
              return barcodeHeight / 19 + 'em'
            })
            .attr('y', barcodeHeight / 2)
        }
      },
      update_filtering_nodes: function (highlightObjArray, distributionLevel) {
        var self = this
        var barcodeTreeId = self.model.get('barcodeTreeId')
        if (distributionLevel === 'ratio') {
          if (highlightObjArray.length > 0) {
            self.d3el.selectAll('.barcode-node')
              .style('opacity', 0.1)
          } else {
            self.d3el.selectAll('.barcode-node')
              .style('opacity', 1)
          }
        } else {
          if (highlightObjArray.length > 0) {
            self.d3el.selectAll('.barcode-node-level-' + distributionLevel)
              .style('opacity', 0.1)
          } else {
            self.d3el.selectAll('.barcode-node-level-' + distributionLevel)
              .style('opacity', 1)
          }
        }
        // .classed('filtering-unhighlight', true)
        for (var hI = 0; hI < highlightObjArray.length; hI++) {
          if (barcodeTreeId === highlightObjArray[ hI ].treeId) {
            self.d3el.selectAll('#' + highlightObjArray[ hI ].nodeId)
              .style('opacity', 1)
          }
          //.classed('filtering-unhighlight', false)
        }
      },
      /**
       * 更新padding节点, 非对齐的收缩节点
       * @param next_step_func
       */
      update_padding_barcode_node: function (next_step_func) {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        //  TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        //  var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        var DURATION = 1000
        var selectedLevels = Variables.get('selectedLevels')
        // var paddingBarcodeNode = self.d3el.select('#barcode-container')
        //   .selectAll('.barcode-node')
        //   .data(barcodeNodeAttrArray.filter(function (d, i) {
        //     return ((selectedLevels.indexOf(d.depth) === -1))//(d.depth < 4)
        //   }), function (d, i) {
        //     return d.id
        //   })
        //   .remove()
        var paddingBarcodeNode = self.d3el.select('#barcode-container')
          .selectAll('.barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongPadding(i)))//(d.depth < 4)
          }), function (d, i) {
            return d.id
          })
        paddingBarcodeNode.enter()
          .append('rect')
          .attr('class', function (d, i) {
            return self.class_name_handler(d)
          })
          .attr('id', function (d, i) {
            return d.id
          })
          .attr('x', function (d) {
            if (isNaN(+d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('y', function (d) {
            return +d.y
          })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('height', function (d) {
            return +d.height
          })
          .style("cursor", "pointer")
          .on('mouseover', function (d, i) {
            self.node_mouseover_handler(d, i, self)
          })
          .on('mouseout', function (d, i) {
          })
          .on('click', function (d, i) {
            self.node_click_handler(d, i, self)
          })
        paddingBarcodeNode.attr('class', function (d, i) {
          return self.class_name_handler(d)
        })
          .attr('y', function (d) {
            return +d.y
          })
          .attr('width', function (d) {
            return +d.width
          })
          .transition()
          .duration(DURATION)
          .attr('x', function (d) {
            if (isNaN(+d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('height', function (d) {
            return +d.height
          })
          .call(self.endall, function (d, i) {
            self.render_padding_cover_rect()
            if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
              next_step_func()
            } else {
            }
          })
      },
      /**
       * 更新不存在的对齐barcode节点
       * @param next_step_func: 在更新完成不存在的对齐节点, 执行完成动画之后执行的方法
       */
      update_unexisted_aligned_barcode_node: function (next_step_func) {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        //  TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        //  var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        var alignedComparisonResultArray = treeDataModel.get('alignedComparisonResultArray')
        var DURATION = 1000
        var selectedLevels = Variables.get('selectedLevels')

        var filterBarcodeArray = barcodeNodeAttrArray.filter(function (d, i) {
          return ((selectedLevels.indexOf(d.depth) !== -1) && (!self.isExisted(i)))
        })
        //
        var alignedBarcodeNodes = self.d3el.select('#barcode-container')
          .selectAll('.aligned-barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongAligned(i)) && (!self.isExisted(i)))
          }), function (d, i) {
            return d.id
          })
        //  enter 添加节点
        alignedBarcodeNodes.enter()
          .append('rect')
          .attr('class', function (d, i) {
            return self.class_name_handler(d)
          })
          .attr('id', function (d, i) {
            return d.id
          })
          .attr('x', function (d) {
            if (isNaN(+d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('y', function (d) {
            return +d.y
          })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('height', function (d) {
            return +d.height
          })
          .style("cursor", "pointer")
          .on('mouseover', function (d, i) {
            self.node_mouseover_handler(d, i, self)
          })
          .on('click', function (d, i) {
            self.node_click_handler(d, i, self)
          })
        // update 更新节点
        alignedBarcodeNodes.attr('class', function (d, i) {
          return self.class_name_handler(d)
        })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('y', function (d) {
            return +d.y
          })
          .transition()
          .duration(DURATION)
          .attr('x', function (d) {
            if (isNaN(+d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('height', function (d) {
            return +d.height
          })
          .call(self.endall, function (d, i) {
            if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
              next_step_func()
            } else {
            }
            if (alignedComparisonResultArray == null) {
              self.add_comparison_summary()
            } else {
              self.add_missed_added_summary()
            }
          })
      },
      update_exist_unexist_aligned_barcode_node: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeNodeAttrArray = null
        var selectedLevels = Variables.get('selectedLevels')
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        var alignedBarcodeNodes = self.d3el.select('#barcode-container')
          .selectAll('.aligned-barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongAligned(i)))//(d.depth < 4)
          }), function (d, i) {
            return d.id
          })
        alignedBarcodeNodes.exit().remove()
      },
      /**
       * 更新存在的对齐barcode节点
       * @param next_step_func: 在更新完成存在的对齐节点, 执行完成动画之后执行的方法
       */
      update_existed_aligned_barcode_node: function (next_step_func) {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        var DURATION = 1000
        var selectedLevels = Variables.get('selectedLevels')
        //
        var alignedBarcodeNodes = self.d3el.select('#barcode-container')
          .selectAll('.aligned-barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongAligned(i)) && (self.isExisted(i)))//(d.depth < 4)
          }), function (d, i) {
            return d.id
          })
        //  enter 添加节点
        alignedBarcodeNodes.enter()
          .append('rect')
          .attr('class', function (d, i) {
            return self.class_name_handler(d)
          })
          .attr('id', function (d, i) {
            return d.id
          })
          .attr('x', function (d) {
            if (isNaN(d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('y', function (d) {
            return +d.y
          })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('height', function (d) {
            return +d.height
          })
          .style("cursor", "pointer")
          .style("fill", function (d, i) {
            return self.fill_handler(d, i, self)
          })
          .on('mouseover', function (d, i) {
            self.node_mouseover_handler(d, i, self)
          })
          .on('click', function (d, i) {
            self.node_click_handler(d, i, self)
          })
        // update 更新节点
        alignedBarcodeNodes.attr('class', function (d, i) {
          return self.class_name_handler(d)
        })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('y', function (d) {
            return +d.y
          })
          .transition()
          .duration(DURATION)
          .attr('x', function (d) {
            if (isNaN(d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('height', function (d) {
            return +d.height
          })
          .style("fill", function (d, i) {
            return self.fill_handler(d, i, self)
          })
          .call(self.endall, function (d, i) {
            if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
              next_step_func()
            } else {
              // console.log('not next step')
            }
          })
        // alignedBarcodeNodes.exit().remove()
      },
      fill_handler: function (d, i, self) {
        var num = d.num
        var maxnum = d.maxnum
        if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
          return null
        } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
          if (typeof (maxnum) !== 'undefined') {
            return self.colorCompute(num / maxnum)
          } else {
            return null
          }
        }
      },
      class_name_handler: function (d) {
        var self = this
        var classArray = []
        classArray.push('barcode-node')
        classArray.push('aligned-barcode-node')
        classArray.push('barcode-node-level-' + d.depth)
        if (d.existed) {
          classArray.push('node-existed')
        } else {
          if (typeof(d.beyondAlign) !== 'undefined') {
            if (d.beyondAlign) {
              classArray.push('node-none')
            } else {
              classArray.push('node-missed')
            }
          } else {
            classArray.push('node-missed')
          }
        }
        return self.get_class_name(classArray)
      },
      /**
       * 更新对齐barcode节点
       */
      update_aligned_barcode_node: function () {
        var self = this
        self.update_exist_unexist_aligned_barcode_node()
        self.update_existed_aligned_barcode_node(self.update_unexisted_aligned_barcode_node.bind(self))
      },
      /**
       * 同时移动对齐的barcode节点
       */
      update_aligned_barcode_node_concurrent: function () {
        var self = this
        self.update_exist_unexist_aligned_barcode_node
        self.update_existed_aligned_barcode_node()
        self.update_unexisted_aligned_barcode_node()
        self.update_padding_barcode_node()
        self.render_padding_cover_rect()
        self.add_comparison_summary()
        self.add_missed_added_summary()
      },
      /**
       *  在对齐节点之前增加比较的统计结果
       */
      add_comparison_summary: function () {
        var self = this
        var treeDataModel = self.model
        //  TODO
        var barcodeNodeAttrArray = null
        var alignedRangeObjArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
          alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
          alignedRangeObjArray = treeDataModel.get('compactAlignedRangeObjArray')
        }
        // var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        var alignedComparisonResultArray = treeDataModel.get('alignedComparisonResultArray')
        var selectedLevels = Variables.get('selectedLevels')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeComparisonHeight = barcodeHeight * 0.6
        var summaryRectY = barcodeHeight * 0.1
        //  将add-miss-summary比较中高亮的节点取消高亮
        self.d3el.selectAll('.same-node-highlight').classed('same-node-highlight', false)
        self.d3el.selectAll('.added-node-highlight').classed('added-node-highlight', false)
        self.d3el.selectAll('.missed-node-highlight').classed('missed-node-highlight', false)
        if (alignedComparisonResultArray != null)
          return
        self.d3el.select('#barcode-container').selectAll('.add-miss-summary').remove()
        for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
          var alignObjIndex = alignedRangeObjArray[ aI ].alignedObjIndex
          var alignedObj = alignedRangeObjArray[ aI ]
          var rangeStartNodeIndex = alignedObj.rangeStartNodeIndex
          var rangeEndNodeIndex = alignedObj.rangeEndNodeIndex
          var nodeDistribution = get_node_distribution(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray)
          draw_comparison_summary(alignObjIndex, nodeDistribution, rangeStartNodeIndex, barcodeNodeAttrArray)
        }
        //  计算得到在某一个子树下
        function get_node_distribution (rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray) {
          var distributionObj = {}
          distributionObj.wholeNodeNum = 0
          for (var sI = rangeStartNodeIndex; sI <= rangeEndNodeIndex; sI++) {
            if (typeof (barcodeNodeAttrArray[ sI ]) !== 'undefined') {
              var nodeLevel = barcodeNodeAttrArray[ sI ].depth
              if (selectedLevels.indexOf(nodeLevel) !== -1) {
                if (barcodeNodeAttrArray[ sI ].existed) {
                  if (typeof(distributionObj[ nodeLevel ]) === 'undefined') {
                    distributionObj[ nodeLevel ] = 0
                  }
                  distributionObj[ nodeLevel ] = distributionObj[ nodeLevel ] + 1
                }
                distributionObj.wholeNodeNum = distributionObj.wholeNodeNum + 1
              }
            } else {
              console.log('sI', sI)
            }
          }
          return distributionObj
        }

        function draw_comparison_summary (alignObjIndex, nodeDistribution, rangeStartNodeIndex, barcodeNodeAttrArray) {
          var rangeStartNodeX = barcodeNodeAttrArray[ rangeStartNodeIndex ].x
          var comparisonResultsPadding = Config.get('COMPARISON_RESULT_PADDING')
          var barcodeNodeGap = Config.get('BARCODE_NODE_GAP')
          var maxDepth = Variables.get('maxDepth')
          var wholeNodeNum = nodeDistribution.wholeNodeNum
          var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
          var DURATION = 1000
          for (var depth = 0; depth < maxDepth; depth++) {
            if (typeof(nodeDistribution[ depth ]) !== 'undefined') {
              var summaryRectWidth = nodeDistribution[ depth ] / wholeNodeNum * comparisonResultsPadding
              rangeStartNodeX = rangeStartNodeX - summaryRectWidth - barcodeNodeGap
              if (!isNaN(rangeStartNodeX)) {
                var itemIndex = depth
                if (self.d3el.select('#barcode-container').select('#stat-summary-' + alignObjIndex + '-' + itemIndex).empty()) {
                  self.d3el.select('#barcode-container')
                    .append('rect')
                    .attr('class', 'stat-summary')
                    .attr('id', 'stat-summary-' + alignObjIndex + '-' + itemIndex)
                    .attr('width', summaryRectWidth)
                    .attr('height', barcodeComparisonHeight)
                    .attr('x', rangeStartNodeX)
                    .attr('y', summaryRectY)
                    .style('fill', barcodeNodeColorArray[ depth ])
                } else {
                  self.d3el.select('#barcode-container')
                    .select('#stat-summary-' + alignObjIndex + '-' + itemIndex)
                    .transition()
                    .duration(DURATION)
                    .attr('width', summaryRectWidth)
                    .attr('height', barcodeComparisonHeight)
                    .attr('x', rangeStartNodeX)
                    .attr('y', summaryRectY)
                    .style('fill', barcodeNodeColorArray[ depth ])
                }
              }
            }
          }
        }
      },
      /**
       * 绘制barcodeTree
       */
      render_barcode_tree: function () {
        var self = this
        var compactBarcodeNodeAttrArray = self.model.get('compactBarcodeNodeAttrArray')
        self.update_exist_unexist_aligned_barcode_node()
        self.update_existed_aligned_barcode_node()
        self.update_unexisted_aligned_barcode_node()
        // self.update_aligned_barcode_node()
        self.update_padding_barcode_node()
        self.render_padding_cover_rect()
        self.add_comparison_summary()
      },
      /**
       * 点击barcode节点, 首先padding node先收缩, 然后aligned node的位置移动,然后出现non existed的节点
       */
      shrink_barcode_tree: function () {
        var self = this
        self.update_padding_barcode_node(self.update_aligned_barcode_node.bind(self))
      },
      /**
       * 点击covered rect节点, 先移动aligned节点, 然后将padding节点移动
       */
      move_aligned_first_stretch_padding_next_update: function () {
        var self = this
        self.update_aligned_barcode_node_concurrent()
      },
      /**
       * 点击barcode收缩时先判断动画是否结束
       * @param transition
       * @param callback
       */
      endall: function (transition, callback) {
        if (transition.size() === 0) { callback() }
        var n = 0;
        transition
          .each(function () { ++n; })
          .each("end", function () { if (!--n) callback.apply(this, arguments); });
      },
      /**
       * hover padding节点
       * @param d
       * @param i
       */
      padding_nodes_mouseover_handler: function (d, i) {
      },
      /**
       * 点击click节点
       * @param d
       * @param nodeIndex
       * @param globalObj
       */
      node_click_handler: function (d, nodeIndex) {
        var self = this
        var treeDataModel = self.model
        var rootLevel = 0
        self.node_mouseout_handler()
        //  打开上方的supertree视图
        self.open_supertree_view()
        var nodeDepth = d.depth
        var currentAligneLevel = Variables.get('alignedLevel')
        // if (currentAligneLevel < nodeDepth) {
        //   Variables.set('alignedLevel', nodeDepth)
        // }
        if (!((d.category === 'root') && (Variables.get('alignedLevel') === rootLevel))) {
          if (!d3.select(this.el).classed('node-missed')) {
            //  model中的节点需要使用其他的model中的节点进行填充
            treeDataModel.align_node(d.id, d.depth, d.category)
          }
        } else {
          if (!d3.select(this.el).classed('node-missed')) {
            //  model中的节点需要使用其他的model中的节点进行填充
            var selectItemNameArray = Variables.get('selectItemNameArray')
            var displayMode = Variables.get('displayMode')
            var url = 'barcode_original_data'
            if (displayMode === Config.get('CONSTANT')[ 'ORIGINAL' ]) {
              url = 'barcode_original_data'
              window.Datacenter.requestDataCenter(url, selectItemNameArray)
            } else if (displayMode === Config.get('CONSTANT')[ 'COMPACT' ]) {
              url = 'barcode_compact_data'
              window.Datacenter.requestCompactData(url, selectItemNameArray)
            }
          }
        }
      },
      /**
       * 鼠标离开节点的handler
       * @param d i globalObj
       * @returns {boolean}
       */
      node_mouseover_handler: function (d, i, globalObj) {
        var self = this
        globalObj.node_mouseout_handler()
        if (d.existed) {
          if (typeof(d.categoryName) !== 'undefined') {
            tip.show(d.category + '-' + d.categoryName + ",<span style='color:red'>num:</span>" + d.num)
          } else {
            tip.show(d.category)
          }
          globalObj.trigger_hovering_event()
          d3.selectAll('.bg').classed('hovering-highlight', false)
          self.d3el.select('.bg').classed('hovering-highlight', true)
          var findingNodesObj = self.highlight_related_nodes(d)
          var thisNodeObj = d
          globalObj.trigger_hovering_node_event(thisNodeObj, findingNodesObj)
        }
      },
      /**
       * 点击padding节点
       * @param d compactNodeIndex
       * @returns {boolean}
       */
      padding_nodes_click_handler: function (d, compactNodeIndex) {
        var self = this
        var paddingNodeId = 'padding-node-' + d.paddingNodeStartIndex + '-' + d.paddingNodeEndIndex
        for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
          var thisPaddingNodeId = 'padding-node-' + paddingNodeObjArray[ pI ].paddingNodeStartIndex + '-' + paddingNodeObjArray[ pI ].paddingNodeEndIndex
          if (paddingNodeId === thisPaddingNodeId) {
            if (paddingNodeObjArray[ pI ].isCompact) {
              window.Datacenter.barcodeCollection.update_global_compact(pI)
            }
          }
        }
      },
      /**
       * 判断节点是否是aligned范围, 如果属于aligned范围, 那么绘制节点; 否则这些节点不会被绘制
       * @param nodeIndex
       * @returns {boolean}
       */
      isBelongAligned: function (nodeIndex) {
        var self = this
        var treeDataModel = self.model
        var alignedRangeObjArray = []
        var paddingNodeObjArray = []
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
          paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          alignedRangeObjArray = treeDataModel.get('compactAlignedRangeObjArray')
          paddingNodeObjArray = treeDataModel.get('compactPaddingNodeObjArray')
        }
        if (alignedRangeObjArray.length === 0) {
          return true
        } else {
          for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
            var rangeStartNodeIndex = alignedRangeObjArray[ aI ].rangeStartNodeIndex
            var rangeEndNodeIndex = alignedRangeObjArray[ aI ].rangeEndNodeIndex
            if ((nodeIndex >= rangeStartNodeIndex) && (nodeIndex <= rangeEndNodeIndex)) {
              return true
            }
          }
          for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
            if (!paddingNodeObjArray[ pI ].isCompact) {
              var paddingNodeStartIndex = paddingNodeObjArray[ pI ].paddingNodeStartIndex
              var paddingNodeEndIndex = paddingNodeObjArray[ pI ].paddingNodeEndIndex
              if ((nodeIndex >= paddingNodeStartIndex) && (nodeIndex <= paddingNodeEndIndex)) {
                return true
              }
            }
          }
        }
        return false
      },
      /**
       * 判断节点是否属于padding节点的范围
       * @param nodeIndex
       * @returns {boolean}
       */
      isBelongPadding: function (nodeIndex) {
        var self = this
        var treeDataModel = self.model
        var paddingNodeObjArray = []
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          paddingNodeObjArray = treeDataModel.get('compactPaddingNodeObjArray')
        }
        for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
          var paddingNodeStartIndex = paddingNodeObjArray[ pI ].paddingNodeStartIndex
          var paddingNodeEndIndex = paddingNodeObjArray[ pI ].paddingNodeEndIndex
          if (paddingNodeObjArray[ pI ].isCompact) {
            if ((nodeIndex >= paddingNodeStartIndex) && (nodeIndex <= paddingNodeEndIndex)) {
              return true
            }
          }
        }
        return false
      },
      /**
       * 判断节点是否存在
       * @param nodeIndex
       * @returns {boolean}
       */
      isExisted: function (nodeIndex) {
        var self = this
        var treeDataModel = self.model
        // TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        // var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        if (barcodeNodeAttrArray[ nodeIndex ].existed) {
          return true
        } else {
          return false
        }
        return false
      },
      /**
       * 渲染覆盖在padding barcode上面带有纹理的矩形
       */
      render_padding_cover_rect: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeNodeHeight = treeDataModel.get('barcodeNodeHeight') * 0.8
        var paddingNodeObjArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          paddingNodeObjArray = treeDataModel.get('compactPaddingNodeObjArray')
        }
        var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
        self.d3el.select('#barcode-container')
          .selectAll('.padding-covered-rect')
          .remove()
        var paddingCoverRectObj = self.d3el.select('#barcode-container')
          .selectAll('.padding-covered-rect')
          .data(paddingNodeObjArray.filter(function (d, i) {
            return d.paddingNodeStartIndex <= d.paddingNodeEndIndex
          }), function (d, i) {
            return 'covered-rect-' + i
          })
        paddingCoverRectObj.enter()
          .append('rect')
          .attr('id', function (d, i) {
            return 'covered-rect-' + i
          })
          .attr('class', function (d, i) {
            return 'padding-covered-rect covered-rect-' + i
          })
          .attr('x', function (d, i) {
            if (isNaN(+d.paddingNodeX)) {
              return 0
            }
            return d.paddingNodeX
          })
          .attr('y', 0)
          .attr('width', function (d, i) {
            var startIndex = d.paddingNodeStartIndex
            var endIndex = d.paddingNodeEndIndex
            // if (startIndex > endIndex) {
            //   return 0
            // }
            if (d.isCompact) {
              return barcodeNodePadding
            } else {
              return 0
            }
          })
          .attr('height', barcodeNodeHeight)
          .style("fill", self.fill_style_handler.bind(self))
          .on('mouseover', function (d, i) {
            d3.select(this).style('fill', '#1F77B4')
            var startIndex = d.paddingNodeStartIndex
            var endIndex = d.paddingNodeEndIndex
            tip.show('range: ' + startIndex + ' - ' + endIndex)
          })
          .on('mouseout', function (d, i) {
            var nodeStyle = self.fill_style_handler(d, i)
            d3.select(this).style('fill', nodeStyle)
          })
          .on('click', self.padding_cover_click_handler.bind(self))
        paddingCoverRectObj.attr('x', function (d, i) {
          if (isNaN(+d.paddingNodeX)) {
            return 0
          }
          return d.paddingNodeX
        })
          .attr('y', 0)
          .attr('width', function (d, i) {
            var startIndex = d.paddingNodeStartIndex
            var endIndex = d.paddingNodeEndIndex
            // if (startIndex > endIndex) {
            //   return 0
            // }
            if (d.isCompact) {
              return barcodeNodePadding
            } else {
              return 0
            }
          })
          .attr('height', barcodeNodeHeight)
        paddingCoverRectObj.exit().remove()
      },
      padding_obj_mouseover_handler: function () {
        var self = this
      },
      fill_style_handler: function (d, i) {
        var self = this
        var nodeNum = self.get_node_number(d.paddingNodeStartIndex, d.paddingNodeEndIndex)
        var maxLeveledNumArray = Variables.get('maxLeveledNumArray')
        var partition = maxLeveledNumArray[ 4 ] / 6
        var styleIndex = Math.ceil(nodeNum / partition + 1)
        return "url(#diagonal-stripe-" + styleIndex + ")"
      },
      padding_cover_click_handler: function (d, i) {
        var self = this
        // window.Datacenter.barcodeCollection.changCompactMode(i)
        // window.Datacenter.barcodeCollection.update_click_covered_rect_attr_array()
      },
      /**
       * 计算某个范围内, 在某些层级上的节点数量
       */
      get_node_number: function (rangeStart, rangeEnd) {
        var self = this
        var treeDataModel = self.model
        var nodeNumber = 0
        //  TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        //  var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        var selectedLevels = Variables.get('selectedLevels')
        for (var bI = rangeStart; bI <= rangeEnd; bI++) {
          if (typeof (barcodeNodeAttrArray[ bI ]) !== 'undefined') {
            if ((barcodeNodeAttrArray[ bI ].existed) && (selectedLevels.indexOf(barcodeNodeAttrArray[ bI ].depth) !== -1)) {//barcodeNodeAttrArray[ bI ].depth < 4
              nodeNumber = nodeNumber + 1
            }
          } else {
            console.log('bI', bI)
          }
        }
        return nodeNumber
      },
      /**
       * 鼠标离开节点
       */
      node_mouseout_handler: function () {
        var self = this
        tip.hide()
        d3.selectAll('.link-circle').remove()
        d3.selectAll('.node-link').remove()
        d3.selectAll('.children-highlight').style('fill', function (d, i) {
          return self.fill_handler(d, i, self)
        })
        d3.selectAll('.father-highlight').style('fill', function (d, i) {
          return self.fill_handler(d, i, self)
        })
        d3.selectAll('.sibling-highlight').classed('sibling-highlight', false)
        d3.selectAll('.barcode-node').classed('unhighlight', false)
      },
      /**
       * 高亮孩子, 父亲, 以及兄弟节点
       */
      highlight_related_nodes: function (nodeObj) {
        var self = this
        var findingNodesObj = {}
        var nodeIndex = self.get_node_index(nodeObj.id)
        findingNodesObj.childrenNodes = self.findHighlightChildrenNodes(nodeObj, nodeIndex)
        findingNodesObj.fatherCurrentNodes = self.findHighlightFatherAndCurrentNodes(nodeObj, nodeIndex)
        findingNodesObj.siblingNodes = self.findHighlightSiblingNodes(nodeObj, nodeIndex)
        return findingNodesObj
      },
      /**
       * 因为对于当前barcode的绘制是基于level的筛选的, 所以需要通过nodeId获取在实际的barcodeNodeAttrArray中的具体index值
       */
      get_node_index: function (nodeId) {
        var self = this
        var treeDataModel = self.model
        // TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        //  var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[ bI ].id === nodeId) {
            return bI
          }
        }
      },
      /**
       * 遍历得到hovering节点的孩子节点以及当前的节点
       */
      findHighlightChildrenNodes: function (nodeObj, nodeIndex) {
        var self = this
        var treeDataModel = self.model
        //  TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        //  var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        var childrenNodesArray = []
        var nodeDepth = nodeObj.depth
        for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
          if (barcodeNodeAttrArray[ nI ].depth > nodeDepth) {
            if (barcodeNodeAttrArray[ nI ].existed) {
              childrenNodesArray.push(barcodeNodeAttrArray[ nI ])
            }
          }
          if (barcodeNodeAttrArray[ nI ].depth === nodeDepth) {
            break
          }
        }
        // self.highlightChildrenNodes(childrenNodesArray)
        return childrenNodesArray
      },
      /**
       * 遍历得到hovering节点的一系列祖先节点
       */
      findHighlightFatherAndCurrentNodes: function (nodeObj, nodeIndex) {
        var self = this
        var treeDataModel = self.model
        // TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        //  var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        var fatherNodesArray = []
        var nodeDepth = nodeObj.depth
        for (var nI = nodeIndex; nI >= 0; nI--) {
          if (barcodeNodeAttrArray[ nI ].depth === nodeDepth) {
            if (barcodeNodeAttrArray[ nI ].existed) {
              fatherNodesArray.push(barcodeNodeAttrArray[ nI ])
            }
            nodeDepth = nodeDepth - 1
          }
        }
        // self.highlightFatherAndCurrentNodes(fatherNodesArray)
        return fatherNodesArray
      },
      /**
       * 遍历得到hovering节点的sibling节点
       */
      findHighlightSiblingNodes: function (nodeObj, nodeIndex) {
        var self = this
        var treeDataModel = self.model
        //  TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        //  var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        var siblingNodesArray = []
        var nodeDepth = nodeObj.depth
        //  向后遍历
        for (var nI = (nodeIndex - 1); nI > 0; nI--) {
          if (barcodeNodeAttrArray[ nI ].depth === nodeDepth) {
            if (barcodeNodeAttrArray[ nI ].existed) {
              siblingNodesArray.push(barcodeNodeAttrArray[ nI ])
            }
          }
          if (barcodeNodeAttrArray[ nI ].depth < nodeDepth) {
            break
          }
        }
        //  向前遍历
        for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
          if (barcodeNodeAttrArray[ nI ].depth === nodeDepth) {
            if (barcodeNodeAttrArray[ nI ].existed) {
              siblingNodesArray.push(barcodeNodeAttrArray[ nI ])
            }
          }
          if (barcodeNodeAttrArray[ nI ].depth < nodeDepth) {
            break
          }
        }
        // self.highlightSiblingNodes(siblingNodesArray)
        return siblingNodesArray
      },
      /**
       * 将该树中所有的节点的颜色变暗
       */
      unhighlightNodes: function () {
        var self = this
        self.d3el.selectAll('.barcode-node').classed('unhighlight', true)
      },
      /*
       *  高亮兄弟节点
       */
      highlightSiblingNodes: function (siblingNodesArray) {
        var self = this
        var currentSiblingNodesArray = []
        for (var sI = 0; sI < siblingNodesArray.length; sI++) {
          var currentSiblingNode = self.findCurrentNodeObj(siblingNodesArray[ sI ])
          if (currentSiblingNode != null) {
            currentSiblingNodesArray.push(currentSiblingNode)
          }
        }
        for (var sI = 0; sI < currentSiblingNodesArray.length; sI++) {
          self.d3el.select('#' + currentSiblingNodesArray[ sI ].id)
            .classed('sibling-highlight', true)
          self.d3el.select('#' + currentSiblingNodesArray[ sI ].id)
            .classed('unhighlight', true)
        }
      },
      /**
       * 高亮从根节点到当前节点路径上的节点
       */
      highlightFatherAndCurrentNodes: function (fatherNodesArray) {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
        var beginX = 0
        var endX = 0
        var currentFatherNodesArray = []
        for (var fI = 0; fI < fatherNodesArray.length; fI++) {
          var currentFatherNode = self.findCurrentNodeObj(fatherNodesArray[ fI ])
          if (currentFatherNode != null) {
            currentFatherNodesArray.push(currentFatherNode)
          }
        }
        for (var fI = 0; fI < currentFatherNodesArray.length; fI++) {
          if (currentFatherNodesArray[ fI ].width !== 0) {
            beginX = currentFatherNodesArray[ fI ].x + currentFatherNodesArray[ fI ].width / 2
            break
          }
        }
        for (var fI = (currentFatherNodesArray.length - 1); fI >= 0; fI--) {
          if (currentFatherNodesArray[ fI ].width !== 0) {
            endX = currentFatherNodesArray[ fI ].x + currentFatherNodesArray[ fI ].width / 2
            break
          }
        }
        var lineY = barcodeNodeHeight / 2
        var strokeWidth = barcodeNodeHeight / 10
        var radius = barcodeNodeHeight / 16
        self.d3el.select('#barcode-container')
          .append('line')
          .attr('class', 'node-link')
          .style('stroke-width', strokeWidth)
          .attr('x1', beginX)
          .attr('y1', lineY)
          .attr('x2', endX)
          .attr('y2', lineY)
        for (var fI = 0; fI < currentFatherNodesArray.length; fI++) {
          if (currentFatherNodesArray[ fI ].width !== 0) {
            var fatherNodeDepth = currentFatherNodesArray[ fI ].depth
            var circleX = currentFatherNodesArray[ fI ].x + currentFatherNodesArray[ fI ].width / 2
            var circleY = barcodeNodeHeight / 2
            self.d3el.select('#' + currentFatherNodesArray[ fI ].id)
              .classed('father-highlight', true)
              .style('fill', barcodeNodeColorArray[ fatherNodeDepth ])
            self.d3el.select('#' + currentFatherNodesArray[ fI ].id)
              .classed('unhighlight', false)
            self.d3el.select('#barcode-container')
              .append('circle')
              .attr('class', 'link-circle')
              .attr('cx', circleX)
              .attr('cy', circleY)
              .style('r', radius)
              .style('stroke', 'steelblue')
          }
        }
      },
      /**
       * 高亮孩子节点
       */
      highlightChildrenNodes: function (childrenNodesArray) {
        var self = this
        var currentChildrenNodesArray = []
        for (var sI = 0; sI < childrenNodesArray.length; sI++) {
          var currentChildrenNode = self.findCurrentNodeObj(childrenNodesArray[ sI ])
          if (currentChildrenNode != null) {
            currentChildrenNodesArray.push(currentChildrenNode)
          }
        }
        var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
        for (var cI = 0; cI < currentChildrenNodesArray.length; cI++) {
          var childrenNodeDepth = currentChildrenNodesArray[ cI ].depth
          self.d3el.select('#' + currentChildrenNodesArray[ cI ].id)
            .classed('children-highlight', true)
            .style('fill', barcodeNodeColorArray[ childrenNodeDepth ])
          self.d3el.select('#' + currentChildrenNodesArray[ cI ].id)
            .classed('unhighlight', false)
        }
      },
      /**
       * 根据其他视图传动的节点对象,找到在该视图中的节点
       * @param 其他视图传递的节点对象
       * @returns 在该视图中找到的节点对象, 如果没有找到则返回null
       */
      findCurrentNodeObj: function (nodeObj) {
        var self = this
        var treeDataModel = self.model
        //  TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        }
        //  var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if ((barcodeNodeAttrArray[ bI ].depth === nodeObj.depth) && (barcodeNodeAttrArray[ bI ].id === nodeObj.id) && (barcodeNodeAttrArray[ bI ].existed) && (self.isBelongAligned(bI))) {
            return barcodeNodeAttrArray[ bI ]
          }
        }
        return null
      }
      ,
      /**
       * 高亮节点的总函数, 在这个对象中调用高亮孩子节点, 父亲等路径节点, 兄弟节点等节点
       * @param findingNodesObj: 传入的是找到的节点对象
       */
      highlight_finding_node: function (findingNodesObj) {
        var self = this
        self.unhighlightNodes()
        var childrenNodes = findingNodesObj.childrenNodes
        var fatherCurrentNodes = findingNodesObj.fatherCurrentNodes
        var siblingNodes = findingNodesObj.siblingNodes
        self.highlightChildrenNodes(childrenNodes)
        self.highlightFatherAndCurrentNodes(fatherCurrentNodes)
        self.highlightSiblingNodes(siblingNodes)
      }
      ,
      /**
       * 高亮排序所依据的节点
       * @param barcodeNodeId: 排序基准节点的id
       */
      highlight_sort_node: function (barcodeNodeId) {
        var self = this
        self.d3el.select('#' + barcodeNodeId).classed('sort-hovering-highlight', true)
      }
      ,
      /**
       * 取消高亮排序所依据的节点
       * @param barcodeNodeId: 排序基准节点的id
       */
      unhighlight_sort_node: function (barcodeNodeId) {
        var self = this
        self.d3el.select('.sort-hovering-highlight').classed('sort-hovering-highlight', false)
      }
      ,
      /**
       * model中的barcodeNodeHeight发生变化的时候的响应函数, 更新background的高度, labeld的位置以及barcodeNode的高度
       */
      update_view: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeIndex = treeDataModel.get('barcodeIndex')
        var barcodeNodeHeight = +treeDataModel.get('barcodeNodeHeight')
        var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')
        var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')[ 'ABSOLUTE_COMPACT_FATHER' ]
        // var barcodeTreeYLocation = barcodeIndex * barcodeNodeHeight + barcodeIndex
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeOriginalNodeHeight = treeDataModel.get('barcodeOriginalNodeHeight')
        var barcodeCompactNodeHeight = treeDataModel.get('barcodeCompactNodeHeight')
        var barcodePaddingTop = barcodeHeight * 0.1
        var barcodePaddingLeft = self.attributes.barcodePaddingLeft
        self.d3el.transition()
          .duration(1000)
          .attr('transform', 'translate(' + 0 + ',' + barcodeTreeYLocation + ')')
        var containerWidth = $('#barcodetree-scrollpanel').width()
        self.d3el.selectAll('.bg')
          .attr('width', containerWidth)
          .attr('height', barcodeHeight)
        self.d3el.selectAll('.barcode-node')
          .attr('height', function (d) {
            if (typeof (d.compactAttr) !== 'undefined') {
              if (d.compactAttr === ABSOLUTE_COMPACT_FATHER) {
                return barcodeCompactNodeHeight
              }
            }
            return barcodeOriginalNodeHeight
          })
        if (barcodeHeight < 16) {
          self.d3el.select('#barcode-label')
            .style('font-size', function (d) {
              return barcodeHeight / 19 + 'em'
            })
        } else {
          self.d3el.select('#barcode-label')
            .style('font-size', function (d) {
              return '1em'
            })
        }
        self.d3el.select('#barcode-label')
          .attr('y', barcodeHeight / 2)
        self.d3el.select('#barcode-container')
          .attr('transform', 'translate(' + barcodePaddingLeft + ',' + barcodePaddingTop + ')')
      },
      /**
       *  在barcode视图中增加描述缺失或者增加节点数目的总结
       */
      add_missed_added_summary: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeNodeHeight = +treeDataModel.get('barcodeNodeHeight')
        var barcodeComparisonHeight = barcodeNodeHeight * 0.6
        var summaryRectY = barcodeNodeHeight * 0.1
        var alignedComparisonResultArray = treeDataModel.get('alignedComparisonResultArray')
        if (alignedComparisonResultArray == null)
          return
        var alignedRangeObjArray = null
        //  TODO
        var barcodeNodeAttrArray = null
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
          alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
          alignedRangeObjArray = treeDataModel.get('compactAlignedRangeObjArray')
        }
        //  var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        self.d3el.selectAll('.same-node-highlight').classed('same-node-highlight', false)
        self.d3el.selectAll('.added-node-highlight').classed('added-node-highlight', false)
        self.d3el.selectAll('.missed-node-highlight').classed('missed-node-highlight', false)
        self.d3el.select('#barcode-container').selectAll('.stat-summary').remove()
        for (var aI = 0; aI < alignedComparisonResultArray.length; aI++) {
          var alignedComparisonResult = alignedComparisonResultArray[ aI ]
          var alignedObjIndex = alignedComparisonResult.alignedObjIndex
          var sameNodeIdArray = alignedComparisonResult.sameNodeIdArray
          // highlightSameNodes(sameNodeIdArray)
          var addedNodeIdArray = alignedComparisonResult.addedNodeIdArray
          highlightAddedNodes(addedNodeIdArray)
          var missedNodeIdArray = alignedComparisonResult.missedNodeIdArray
          highlightMissedNodes(missedNodeIdArray)
          var rangeStartNodeIndex = alignedRangeObjArray[ aI ].rangeStartNodeIndex
          var rangeEndNodeIndex = alignedRangeObjArray[ aI ].rangeEndNodeIndex
          var nodeDistribution = {}
          nodeDistribution.wholeNodeNum = get_whole_num(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray)
          nodeDistribution.sameNode = sameNodeIdArray.length
          nodeDistribution.addNode = addedNodeIdArray.length
          nodeDistribution.missNode = missedNodeIdArray.length
          var itemArray = [ 'addNode', 'missNode', 'sameNode' ]
          var colorArray = { addNode: 'green', missNode: 'red', sameNode: 'black' }
          draw_comparison_summary(nodeDistribution, alignedObjIndex, itemArray, colorArray, rangeStartNodeIndex, barcodeNodeAttrArray)
        }

        function highlightSameNodes (sameNodeIdArray) {
          for (var sI = 0; sI < sameNodeIdArray.length; sI++) {
            self.d3el.select('#' + sameNodeIdArray[ sI ]).classed('same-node-highlight', true)
          }
        }

        function highlightAddedNodes (addedNodeIdArray) {
          for (var aI = 0; aI < addedNodeIdArray.length; aI++) {
            self.d3el.select('#' + addedNodeIdArray[ aI ]).classed('added-node-highlight', true)
          }
        }

        function highlightMissedNodes (missedNodeIdArray) {
          for (var mI = 0; mI < missedNodeIdArray.length; mI++) {
            self.d3el.select('#' + missedNodeIdArray[ mI ]).classed('missed-node-highlight', true)
          }
        }

        //  获取在对齐比较部分内的barcode,选中层级的节点数量
        function get_whole_num (rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray) {
          var selectedLevels = Variables.get('selectedLevels')
          var wholeNum = 0
          for (var bI = rangeStartNodeIndex; bI <= rangeEndNodeIndex; bI++) {
            var nodeLevel = barcodeNodeAttrArray[ bI ].depth
            if (selectedLevels.indexOf(nodeLevel) !== -1) {
              wholeNum = wholeNum + 1
            }
          }
          return wholeNum
        }

        function draw_comparison_summary (nodeDistribution, alignedObjIndex, itemArray, colorArray, rangeStartNodeIndex, barcodeNodeAttrArray) {
          var rangeStartNodeX = barcodeNodeAttrArray[ rangeStartNodeIndex ].x
          var comparisonResultsPadding = Config.get('COMPARISON_RESULT_PADDING')
          var barcodeNodeGap = Config.get('BARCODE_NODE_GAP')
          var maxDepth = Variables.get('maxDepth')
          var wholeNodeNum = nodeDistribution.wholeNodeNum
          var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
          var DURATION = 1000
          for (var itemIndex = 0; itemIndex < itemArray.length; itemIndex++) {
            var summaryRectWidth = nodeDistribution[ itemArray[ itemIndex ] ] / wholeNodeNum * comparisonResultsPadding
            if (summaryRectWidth !== 0) {
              rangeStartNodeX = rangeStartNodeX - summaryRectWidth - barcodeNodeGap
            }
            if (self.d3el.select('#barcode-container').select('#add-miss-summary-' + alignedObjIndex + '-' + itemIndex).empty()) {
              self.d3el.select('#barcode-container')
                .append('rect')
                .attr('class', 'add-miss-summary')
                .attr('id', 'add-miss-summary-' + alignedObjIndex + '-' + itemIndex)
                .attr('width', summaryRectWidth)
                .attr('height', barcodeComparisonHeight)
                .attr('x', rangeStartNodeX)
                .attr('y', summaryRectY)
                .style('fill', function () {
                  return colorArray[ itemArray[ itemIndex ] ]
                })
            } else {
              self.d3el.select('#barcode-container')
                .select('#add-miss-summary-' + alignedObjIndex + '-' + itemIndex)
                .transition()
                .duration(DURATION)
                .attr('width', summaryRectWidth)
                .attr('height', barcodeComparisonHeight)
                .attr('x', rangeStartNodeX)
                .attr('y', summaryRectY)
            }
          }
        }
      }
      ,
      update_view_location: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeIndex = treeDataModel.get('barcodeIndex')
        var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')
        var basedModel = treeDataModel.get('basedModel')
        self.d3el.transition()
          .duration(1000)
          .attr('transform', 'translate(' + 0 + ',' + barcodeTreeYLocation + ')')
        if (treeDataModel.get('compareBased')) {
          self.singleTree.select('.bg').classed('compare-based-selection', true)
        } else {
          self.singleTree.select('.bg').classed('compare-based-selection', false)
        }
        // if (basedModel == null) {
        //   self.add_comparison_summary()
        // } else {
        //   self.add_missed_added_summary()
        // }
        var barcodeRectBgColor = treeDataModel.get('barcodeRectBgColor')
        self.singleTree.select('.bg').style('fill', barcodeRectBgColor)
      },
      /**
       *  增加总结的柱状图
       */
      add_summary: function () {
        var self = this
        var treeDataModel = self.model
        var basedModel = treeDataModel.get('basedModel')
        if (basedModel == null) {
          self.add_comparison_summary()
        } else {
          self.add_missed_added_summary()
        }
        self.render_padding_cover_rect()
      },
      /**
       *  将鼠标hovering的barcode的id进行广播
       */
      trigger_hovering_event: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')[ 'HOVERING_BARCODE_EVENT' ], {
          'barcodeTreeId': barcodeTreeId
        })
      }
      ,
      /**
       *  将鼠标unhovering的barcode的id进行广播
       */
      trigger_unhovering_event: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')[ 'UN_HOVERING_BARCODE_EVENT' ], {
          'barcodeTreeId': barcodeTreeId
        })
      }
      ,
      /**
       * 点击选中barcdoe触发的事件
       */
      trigger_click_event: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')[ 'SELECT_BARCODE_EVENT' ], {
          'barcodeTreeId': barcodeTreeId
        })
        window.Datacenter.barcodeCollection.set_based_model(barcodeTreeId)
      },
      /**
       * 点击取消选中barcode触发的事件
       */
      trigger_unclick_event: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')[ 'UNSELECT_BARCODE_EVENT' ], {
          'barcodeTreeId': barcodeTreeId
        })
        window.Datacenter.barcodeCollection.unset_based_model(barcodeTreeId)
      },
      /**
       * 将鼠标hovering的barcode的节点的相关信息进行广播
       */
      trigger_hovering_node_event: function (thisNodeObj, findingNodesObj) {
        var self = this
        Backbone.Events.trigger(Config.get('EVENTS')[ 'HIGH_RELATED_NODES' ], {
          'thisNodeObj': thisNodeObj,
          'findingNodesObj': findingNodesObj
        })
      }
      ,
      trigger_render_cover_rect: function () {
        Backbone.Events.trigger(Config.get('EVENTS')[ 'RENDER_HOVER_RECT' ])
      }
      ,
      /**
       *  鼠标点击节点的时候, 将superTree的视图打开
       */
      open_supertree_view: function () {
        var self = this
        Backbone.Events.trigger(Config.get('EVENTS')[ 'OPEN_SUPER_TREE' ])
        window.Variables.update_barcode_attr()
        // self.model.update_height()
      }
      ,
      get_class_name: function (classNameArray) {
        var className = ''
        for (var cI = 0; cI < classNameArray.length; cI++) {
          className = className + ' ' + classNameArray[ cI ]
        }
        return className
      }
    }, SVGBase)
  )
})
