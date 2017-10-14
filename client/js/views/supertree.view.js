define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'd3',
  'config',
  'variables',
  'views/svg-base.addon'
], function (require, Mn, _, Backbone, d3, Config, Variables, SVGBase) {
  'use strict'
  return Mn.ItemView.extend(_.extend({
    tagName: 'svg',
    template: false, //  for the itemview, we must define the template value false
    attributes: {
      style: 'width: 100%; height: 100%;',
      id: 'supertree-svg',
      barcodePaddingLeft: 40,
      clickedObject: null,
      sortObject: null,
      clickedRectIndex: null,
      barcodeOriginalNodeHeight: 0,
      barcodeCompactNodeHeight: 0
    },
    events: {},
    initialize: function (options) {
      var self = this
      var compactNum = window.compactNum
      Backbone.Events.on(Config.get('EVENTS')[ 'OPEN_SUPER_TREE' ], function (event) {
        self.open_supertree_view()
      })
      Backbone.Events.on(Config.get('EVENTS')[ 'RENDER_SUPERTREE' ], function (event) {
        self.draw_super_tree()
      })
      self.attributes.barcodeOriginalNodeHeight = Variables.get('barcodeHeight')
      self.attributes.barcodeCompactNodeHeight = Variables.get('barcodeHeight') / (compactNum + (compactNum - 1) / 4)
    },
    onShow: function () {
      var self = this
      self.barcodeHeight = Variables.get('superTreeHeight')
      var barcodePaddingTop = barcodeHeight * 0.4 + 1
      var sortCount = 0
      var sortTypeArray = [ 'asc', 'desc', 'unsort' ]
      var sortTypeObject = {
        'asc': '\uf0de',
        'desc': '\uf0dd',
        'unsort': '\uf0dc'
      }
      var barcodePaddingLeft = self.attributes.barcodePaddingLeft
      var superTreeWidth = $('#supertree-scroll-panel').width()
      self.d3el.append('rect')
        .attr('class', 'container-bg')
        .attr('id', 'container-bg')
        .attr('width', superTreeWidth)
        .attr('height', self.barcodeHeight)
        .on('mouseover', function (d, i) {
          self.trigger_mouseout_event()
        })
        .on('click', function (d, i) {
          self.remove_options_button()
        })
      var tip = window.tip
      self.d3el.call(tip)
      self.barcodeContainer = self.d3el.append('g')
        .attr('transform', 'translate(' + barcodePaddingLeft + ',' + barcodePaddingTop + ')')
        .attr('id', 'barcode-container')
      self.d3el.select('#barcode-container')
        .append("text")
        .attr('class', 'sort-button')
        .attr("x", -(barcodePaddingLeft / 2))
        .attr("y", self.barcodeHeight / 2)
        .attr("font-family", "FontAwesome")
        .attr('font-size', function (d) { return '30px';})
        .text(function (d) { return '\uf0dc'; })
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'ideographic')
        .style("cursor", "pointer")
        .style('fill', '#ddd')
        .on('click', function (d, i) {
          self.d3el.selectAll('.sort-indicator').remove()
          var sortType = sortCount % sortTypeArray.length
          d3.select(this).text(function (d) { return sortTypeObject[ sortTypeArray[ sortType ] ] })
          if (sortType == 0) {
            //  升序排列
            d3.select(this).style('fill', 'black')
            window.Datacenter.barcodeCollection.sort_whole_barcode_model(sortTypeArray[ sortType ])
          } else if (sortType == 1) {
            //  降序排列
            d3.select(this).style('fill', 'black')
            window.Datacenter.barcodeCollection.sort_whole_barcode_model(sortTypeArray[ sortType ])
          } else if (sortType == 2) {
            //  原始顺序排列
            d3.select(this).style('fill', '#ddd')
            window.Datacenter.barcodeCollection.recover_barcode_model_sequence()
          }
          sortCount = sortCount + 1
        })

      // .on('mouseover', function (d, i) {
      //   d3.select(this).style('fill', 'black')
      // })
      // .on('mouseout', function (d, i) {
      //   if (d3.select(this).classed('click-highlight')) {
      //     d3.select(this).style('fill', 'black')
      //   } else {
      //     d3.select(this).style('fill', '#ddd')
      //   }
      // })
    },
    open_supertree_view: function () {
      var superTreeHeight = Variables.get('superTreeHeight')
      $('#barcodetree-scrollpanel').css('top', superTreeHeight + 'px')
      $('#supertree-scroll-panel').css('height', superTreeHeight + 'px')
    },
    draw_super_tree: function () {
      var self = this
      self.update_aligned_barcode_node(self.update_sort_icon.bind(self))
      self.render_padding_cover_rect()
    },
    update_aligned_barcode_node: function (next_step_func) {
      var self = this
      var tip = window.tip
      var barcodeCollection = self.options.barcodeCollection
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var treeDataModel = barcodeCollection.where({ barcodeTreeId: selectItemNameArray[ 0 ] })[ 0 ]
      var barcodeNodeHeight = Variables.get('superTreeHeight') * 0.6
      var barcodeNodeAttrArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
      }
      var DURATION = 1000
      var alignedLevel = Variables.get('alignedLevel')
      var currentNodeHeight = barcodeNodeAttrArray[ 0 ].height
      var yRatio = barcodeNodeHeight / currentNodeHeight
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')[ 'ABSOLUTE_COMPACT_FATHER' ]
      //
      var alignedBarcodeNodes = self.d3el.select('#barcode-container')
        .selectAll('.aligned-barcode-node')
        .data(barcodeNodeAttrArray.filter(function (d, i) {
          return ((d.depth < 4) && (self.isBelongAligned(i)))
        }), function (d, i) {
          return d.id
        })
      //  enter 添加节点
      alignedBarcodeNodes.enter()
        .append('rect')
        .attr('class', function (d, i) {
          var classArray = []
          classArray.push('barcode-node')
          classArray.push('aligned-barcode-node')
          if (d.depth > alignedLevel) {
            classArray.push('node-none')
          }
          return self.get_class_name(classArray)
        })
        .attr('id', function (d, i) {
          return d.id
        })
        .attr('x', function (d) {
          return +d.x
        })
        .attr('y', function (d) {
          return +d.height * yRatio
        })
        .attr('width', function (d) {
          return +d.width
        })
        .attr('height', function (d) {
          return 0
        })
        .style("cursor", "pointer")
        .on('mouseover', mouseover_handler)
        .on('mouseout', mouseout_handler)
        .on('click', click_handler)
      // update 更新节点
      alignedBarcodeNodes.attr('class', function (d, i) {
        var classArray = []
        classArray.push('barcode-node')
        classArray.push('aligned-barcode-node')
        if (d.depth > alignedLevel) {
          classArray.push('node-none')
        }
        return self.get_class_name(classArray)
      })
        .attr('width', function (d) {
          return +d.width
        })
        .transition()
        .duration(DURATION)
        .attr('x', function (d) {
          return +d.x
        })
        .attr('y', function (d) {
          return +d.y * yRatio
        })
        .attr('height', function (d) {
          return +d.height * yRatio
        })
        .call(self.endall, function (d, i) {
          if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
            next_step_func()
          } else {
            console.log('not next step')
          }
        })
      alignedBarcodeNodes.exit().remove()
      function mouseover_handler (d, i) {
        if (typeof(d.categoryName) !== 'undefined') {
          tip.show(d.category + ' ' + d.categoryName)
        } else {
          tip.show(d.category)
        }
        d3.select(this).classed('sort-hovering-highlight', true)
        Backbone.Events.trigger(Config.get('EVENTS')[ 'HOVERING_SORT_BARCODE_NODE' ], {
          'barcodeNodeId': d.id
        })
      }

      function mouseout_handler (d, i) {
        tip.hide()
        d3.select(this).classed('sort-hovering-highlight', false)
        Backbone.Events.trigger(Config.get('EVENTS')[ 'UNHOVERING_SORT_BARCODE_NODE' ])
      }

      function click_handler (d, i) {
        self.attributes.clickedObject = this
        self.attributes.clickedRectIndex = null
        self.add_supertree_node_options_button(this)
      }
    },
    add_supertree_node_options_button: function (thisNodeObj) {
      var self = this
      var barcodePaddingLeft = self.attributes.barcodePaddingLeft
      var DURATION = 500
      var thisX = +d3.select(thisNodeObj).attr('x') + 1
      var thisY = +d3.select(thisNodeObj).attr('y') - 1
      var thisWidth = +d3.select(thisNodeObj).attr('width')
      var iconSide = Variables.get('superTreeHeight') * 0.3
      var thisNodeId = d3.select(thisNodeObj).attr('id')
      var iconPadding = 2
      var barcodeConfigFontSize = 12
      var iconArray = [
        { 'iconName': 'refresh', 'iconCode': '\uf021' },
        { 'iconName': 'sort-amount-asc', 'iconCode': '\uf160' },
        { 'iconName': 'sort-amount-desc', 'iconCode': '\uf161' } ]
      var iconLeftX = thisX + barcodePaddingLeft + thisWidth / 2 - iconSide * 1.5
      self.d3el.selectAll('.barcode-icon-bg').remove()
      self.d3el.selectAll('.barcode-g-icon').remove()
      //  更新barcode的背景矩形的位置
      var barcodeIconBg = self.d3el.selectAll('.barcode-icon-bg')
        .data(iconArray)
      barcodeIconBg.enter()
        .append('rect')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-icon-bg')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2 - iconSide / 2
        })
        .attr('y', iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .attr('fill', '#808080')
        .on('mouseover', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', false)
        })
        .style('opacity', 0)
      barcodeIconBg.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i
        })
        .attr('y', 0)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIconBg.exit().remove()
      //  更新barcode的图标的位置
      var barcodeIcon = self.d3el.selectAll('.barcode-g-icon')
        .data(iconArray)
      barcodeIcon.enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-g-icon')
        .attr('font-family', 'FontAwesome')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2
        })
        .attr('y', iconSide + iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .text(function (d, i) {
          return d.iconCode
        })
        .on('mouseover', function (d, i) {
          d3.select(this).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select(this).classed('mouseover-highlight', false)
        })
        .on('click', function (d, i) {
          self.super_tree_node_controller(d, i, thisNodeId, self)
        })
        .style('opacity', 0)
      barcodeIcon.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i + iconSide / 2
        })
        .attr('y', iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIcon.exit().remove()
    },
    super_tree_node_controller: function (d, i, thisNodeId, self) {
      var barcodeCollection = self.options.barcodeCollection
      var parameter = null
      if (d.iconName === 'refresh') {
        barcodeCollection.recover_barcode_model_sequence()
        self.attributes.sortObject = null
        self.d3el.selectAll('.sort-indicator').remove()
      } else if (d.iconName === 'sort-amount-asc') {
        parameter = 'asc'
        barcodeCollection.sort_barcode_model(thisNodeId, parameter)
        self.attributes.sortObject = self.attributes.clickedObject
        self.attributes.sort_type = parameter
        self.update_sort_icon()
      } else if (d.iconName === 'sort-amount-desc') {
        parameter = 'desc'
        barcodeCollection.sort_barcode_model(thisNodeId, parameter)
        self.attributes.sortObject = self.attributes.clickedObject
        self.attributes.sort_type = parameter
        self.update_sort_icon()
      }
    },
    update_sort_icon: function () {
      var self = this
      self.d3el.selectAll('.sort-indicator').remove()
      if (self.attributes.sortObject == null) {
        return
      }
      var x = +d3.select(self.attributes.sortObject).attr('x')
      var width = +d3.select(self.attributes.sortObject).attr('width')
      var sortType = self.attributes.sort_type
      var sortTypeObject = {
        'asc': '\uf0de',
        'desc': '\uf0dd'
      }
      if (sortType === 'asc') {
        self.d3el.select('#barcode-container')
          .append("text")
          .attr('class', 'sort-indicator')
          .attr("x", x + width / 2)
          .attr("y", -2)
          .attr("font-family", "FontAwesome")
          .attr('font-size', function (d) { return window.height / 2 + 'px';})
          .text(function (d) { return sortTypeObject[ sortType ]; })
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .style("cursor", "pointer")
      } else if (sortType === 'desc') {
        self.d3el.select('#barcode-container')
          .append("text")
          .attr('class', 'sort-indicator')
          .attr("x", x + width / 2)
          .attr("y", -7)
          .attr("font-family", "FontAwesome")
          .attr('font-size', function (d) { return window.height / 2 + 'px';})
          .text(function (d) { return sortTypeObject[ sortType ]; })
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .style("cursor", "pointer")
      }
      self.d3el.select('#barcode-container')
        .select('.sort-button')
        .style('fill', '#ddd')
        .text('\uf0dc')
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
     * 判断节点是否是aligned范围, 如果属于aligned范围, 那么绘制节点; 否则这些节点不会被绘制
     * @param nodeIndex
     * @returns {boolean}
     */
    isBelongAligned: function (nodeIndex) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var treeDataModel = barcodeCollection.where({ barcodeTreeId: selectItemNameArray[ 0 ] })[ 0 ]
      var alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
      var paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
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
      }
      return false
    },
    /**
     * 渲染覆盖在padding barcode上面带有纹理的矩形
     */
    render_padding_cover_rect: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var treeDataModel = barcodeCollection.where({ barcodeTreeId: selectItemNameArray[ 0 ] })[ 0 ]
      var barcodeNodeAttrArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
      }
      var barcodeNodeHeight = Variables.get('superTreeHeight') * 0.6
      var paddingNodeObjArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        paddingNodeObjArray = treeDataModel.get('compactPaddingNodeObjArray')
      }
      var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
      var DURATION = 1000
      // self.d3el.select('#barcode-container')
      //   .selectAll('.padding-covered-rect')
      //   .remove()
      var paddingCoverRectObj = self.d3el.select('#barcode-container')
        .selectAll('.padding-covered-rect')
        .data(paddingNodeObjArray, function (d, i) {
          return 'covered-rect-' + i
        })
      //  与barcode的padding width的计算不同的是无论superTree的paddingNode的范围内是否存在节点一定要增加paddingnode的coverRect
      paddingCoverRectObj.enter()
        .append('rect')
        .attr('id', function (d, i) {
          return 'covered-rect-' + i
        })
        .attr('class', function (d, i) {
          return 'padding-covered-rect covered-rect-' + i
        })
        .attr('x', function (d, i) {
          return d.paddingNodeX
        })
        .attr('y', barcodeNodeHeight)
        .attr('width', barcodeNodePadding)
        .attr('height', 0)
        .style("fill", self.fill_style_handler.bind(self))
        .on('mouseover', function (d, i) {
          d3.select(this).classed('sort-hovering-highlight', true)
          // d3.select(this).attr('color', 'red')
        })
        .on('mouseout', function (d, i) {
          d3.select(this).classed('sort-hovering-highlight', false)
        })
        .on('click', padding_super_cover_click_handler)
      paddingCoverRectObj.attr('x', function (d, i) {
        return d.paddingNodeX
      })
        .transition()
        .duration(DURATION)
        .attr('y', 0)
        .attr('width', barcodeNodePadding)
        .attr('height', barcodeNodeHeight)
      paddingCoverRectObj.exit().remove()
      function padding_super_cover_click_handler (d, covered_rect_index) {
        self.attributes.clickedObject = this
        self.attributes.clickedRectIndex = covered_rect_index
        self.add_options_button(this)
        // if (d3.select(this).classed('sort-selection-highlight')) {
        //   d3.selectAll('.sort-selection-highlight').classed('sort-selection-highlight', false)
        //   d3.select(this).classed('sort-selection-highlight', false)
        //   barcodeCollection.recover_barcode_model_sequence()
        // } else {
        //   d3.selectAll('.sort-selection-highlight').classed('sort-selection-highlight', false)
        //   d3.select(this).classed('sort-selection-highlight', true)
        //   barcodeCollection.sort_cover_rect_barcode_model(covered_rect_index)
        // }
      }

      function rgb2hex (rgb) {
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[ 1 ], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[ 2 ], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[ 3 ], 10).toString(16)).slice(-2) : '';
      }
    },
    add_options_button: function (thisNodeObj) {
      var self = this
      var barcodePaddingLeft = self.attributes.barcodePaddingLeft
      var DURATION = 500
      var thisX = +d3.select(thisNodeObj).attr('x') + 1
      var thisY = +d3.select(thisNodeObj).attr('y') - 1
      var thisWidth = +d3.select(thisNodeObj).attr('width')
      var iconSide = Variables.get('superTreeHeight') * 0.3
      var iconPadding = 2
      var barcodeConfigFontSize = 12
      var iconArray = [
        { 'iconName': 'compress', 'iconCode': '\uf066' }, { 'iconName': 'expand', 'iconCode': '\uf065' },
        { 'iconName': 'sort-amount-asc', 'iconCode': '\uf160' }, {
          'iconName': 'sort-amount-desc',
          'iconCode': '\uf161'
        } ]
      var iconLeftX = thisX + barcodePaddingLeft + thisWidth / 2 - iconSide * 2
      self.d3el.selectAll('.barcode-icon-bg').remove()
      self.d3el.selectAll('.barcode-g-icon').remove()
      //  更新barcode的背景矩形的位置
      var barcodeIconBg = self.d3el.selectAll('.barcode-icon-bg')
        .data(iconArray)
      barcodeIconBg.enter()
        .append('rect')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-icon-bg')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2 - iconSide / 2
        })
        .attr('y', iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .attr('fill', '#808080')
        .on('mouseover', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', false)
        })
        .style('opacity', 0)
      barcodeIconBg.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i
        })
        .attr('y', 0)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIconBg.exit().remove()
      //  更新barcode的图标的位置
      var barcodeIcon = self.d3el.selectAll('.barcode-g-icon')
        .data(iconArray)
      barcodeIcon.enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-g-icon')
        .attr('font-family', 'FontAwesome')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2
        })
        .attr('y', iconSide + iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .text(function (d, i) {
          return d.iconCode
        })
        .on('mouseover', function (d, i) {
          d3.select(this).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select(this).classed('mouseover-highlight', false)
        })
        .on('click', function (d, i) {
          self.super_tree_controller(d, i)
        })
        .style('opacity', 0)
      barcodeIcon.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i + iconSide / 2
        })
        .attr('y', iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIcon.exit().remove()
    },
    remove_options_button: function () {
      var self = this
      var self = this
      var thisNodeObj = self.attributes.clickedObject
      var barcodePaddingLeft = self.attributes.barcodePaddingLeft
      var DURATION = 500
      if (thisNodeObj == null) {
        return
      }
      var thisX = +d3.select(thisNodeObj).attr('x') + 1
      var thisY = +d3.select(thisNodeObj).attr('y') - 1
      var thisWidth = +d3.select(thisNodeObj).attr('width')
      var iconSide = Variables.get('superTreeHeight') * 0.3
      var iconPadding = 2
      var barcodeConfigFontSize = 12
      var iconArray = [
        { 'iconName': 'compress', 'iconCode': '\uf066' }, { 'iconName': 'expand', 'iconCode': '\uf065' },
        { 'iconName': 'sort-amount-asc', 'iconCode': '\uf160' }, {
          'iconName': 'sort-amount-desc',
          'iconCode': '\uf161'
        } ]
      //  更新barcode的背景矩形的位置
      var barcodeIconBg = self.d3el.selectAll('.barcode-icon-bg')
        .transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2 - iconSide / 2
        })
        .attr('y', iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 0)
        .call(self.endall, function (d, i) {
          self.d3el.selectAll('.barcode-icon-bg').remove()
        })
      //  更新barcode的图标的位置
      var barcodeIcon = self.d3el.selectAll('.barcode-g-icon')
        .transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2
        })
        .attr('y', iconSide + iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 0)
        .call(self.endall, function (d, i) {
          self.d3el.selectAll('.barcode-g-icon').remove()
        })
    },
    super_tree_controller: function (d, i) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var clickedRectIndex = self.attributes.clickedRectIndex
      var parameter = null
      if (clickedRectIndex != null) {
        if (d.iconName === 'compress') {
          barcodeCollection.changExpandMode(clickedRectIndex)
          barcodeCollection.update_click_covered_rect_attr_array()
        } else if (d.iconName === 'expand') {
          barcodeCollection.changCompactMode(clickedRectIndex)
          barcodeCollection.update_click_covered_rect_attr_array()
        } else if (d.iconName === 'sort-amount-asc') {
          parameter = 'asc'
          self.attributes.sortObject = self.attributes.clickedObject
          barcodeCollection.sort_cover_rect_barcode_model(clickedRectIndex, parameter)
          self.attributes.sort_type = parameter
          self.update_sort_icon()
        } else if (d.iconName === 'sort-amount-desc') {
          parameter = 'desc'
          self.attributes.sortObject = self.attributes.clickedObject
          barcodeCollection.sort_cover_rect_barcode_model(clickedRectIndex, parameter)
          self.attributes.sort_type = parameter
          self.update_sort_icon()
        }
      }
    },
    fill_style_handler: function (d, i) {
      var self = this
      var nodeNum = self.get_node_number(d.paddingNodeStartIndex, d.paddingNodeEndIndex)
      var maxLeveledNumArray = Variables.get('maxLeveledNumArray')
      var partition = maxLeveledNumArray[ 4 ] / 6
      var styleIndex = Math.ceil(nodeNum / partition + 1)
      return "url(#diagonal-stripe-" + styleIndex + ")"
    },
    /**
     * 计算某个范围内, 在某些层级上的节点数量
     */
    get_node_number: function (rangeStart, rangeEnd) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var treeDataModel = barcodeCollection.where({ barcodeTreeId: selectItemNameArray[ 0 ] })[ 0 ]
      var nodeNumber = 0
      var barcodeNodeAttrArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
      }
      for (var bI = rangeStart; bI <= rangeEnd; bI++) {
        if ((barcodeNodeAttrArray[ bI ].existed) && (barcodeNodeAttrArray[ bI ].depth < 4)) {
          nodeNumber = nodeNumber + 1
        }
      }
      return nodeNumber
    },
    trigger_mouseout_event: function () {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')[ 'NODE_MOUSEOUT' ])
    },
    get_class_name: function (classNameArray) {
      var className = ''
      for (var cI = 0; cI < classNameArray.length; cI++) {
        className = className + ' ' + classNameArray[ cI ]
      }
      return className
    }
  }, SVGBase))
})
