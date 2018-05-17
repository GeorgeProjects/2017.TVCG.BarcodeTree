define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'config',
  'd3',
  'd3Lasso',
  'variables',
  'views/barcode.collection.view',
  'views/svg-base.addon',
  'text!templates/barcode.collection.tpl'
], function (require, Mn, _, Backbone, Config, d3, d3Lasso, Variables, BarcodeCollectionView, SVGBase, Tpl) {
  'use strict'

  return Mn.LayoutView.extend(_.extend({
    tagName: 'svg',
    template: _.template(Tpl),
    regions: {
      'barcodeTreeContainer': '#barcodetree-collection-container'
    },
    attributes: {
      'id': 'barcodetree-svg',
      'style': 'height: 100%; width: 100%'
    },
    //  触发删除barcode视图中mouseout的事件
    trigger_mouse_out: function () {
      //  当点击视图的其他空白地方的时候, 需要将option的按钮进行隐藏
      Backbone.Events.trigger(Config.get('EVENTS')['NODE_MOUSEOUT'])
    },
    //  触发barcode视图的清除背景高亮的事件
    trigger_unhovering_barcode: function () {
      //  当点击视图的其他空白地方的时候, 需要将当前选中的barcode的背景清除
      Backbone.Events.trigger(Config.get('EVENTS')['UN_HOVERING_BARCODE_EVENT'])
    },
    //  触发在histogram视图中高亮选中的bar的事件
    trigger_highlight_selected_bar: function (filteredTreeArray) {
      Backbone.Events.trigger(Config.get('EVENTS')['HIGHLIGHT_LASSO_SELECTED'], {
        filteredTreeArray: filteredTreeArray
      })
    },
    trigger_unhighlight_selected_bar: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UNHIGHLIGHT_LASSO_SELECTED'])
    },
    initialize: function () {
      var self = this
      self.init_events()
    },
    init_events: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      Backbone.Events.on(Config.get('EVENTS')['ENABLE_LASSO_FUNCTION'], function () {
        self.enable_lasso_function()
        self.enable_supertree_lasso_function()
      })
      Backbone.Events.on(Config.get('EVENTS')['DISABLE_LASSO_FUNCTION'], function () {
        self.disable_lasso_function()
      })
      //  在修改了barcode之后更新lasso的视图的范围
      self.listenTo(Variables, 'change:barcodeNodexMaxX', self.enable_lasso_function)
      self.listenTo(Variables, 'change:barcodeNodeyMaxY', self.enable_lasso_function)
      barcodeCollection.on('add', function () {
        self.enable_lasso_function()
        self.enable_supertree_lasso_function()
      })
      barcodeCollection.on('remove', function () {
        self.enable_lasso_function()
        self.enable_supertree_lasso_function()
      })
    },
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var barcodeCollectionView = new BarcodeCollectionView({
        collection: barcodeCollection
      })
      self.showChildView('barcodeTreeContainer', barcodeCollectionView)
      var width = $('#barcodetree-view').width()
      var height = $('#barcodetree-view').height()
      var barcodeTreeSortingPanelHeight = Variables.get('barcodeTreeSortingPanelHeight')
      self.d3el.select('#barcodetree-bg-g')
        .attr('transform', 'translate(' + 0 + ',' + barcodeTreeSortingPanelHeight + ')')
      self.d3el.select('.barcode-tree-single-g')
        .attr('transform', 'translate(' + 0 + ',' + barcodeTreeSortingPanelHeight + ')')
      //  在barcode比较视图中的背景矩形中增加click的事件
      self.d3el.select('.barcode-tree-single-g')
        .insert('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'comparison-bg')
        .on('click', function (d, i) {
          self.trigger_mouse_out()
        })
        .on('mouseover', function () {
          self.trigger_unhovering_barcode()
        })
        .on('mouseout', function () {
          self.trigger_unhovering_barcode()
        })
        .attr('opacity', 0)
    },
    //  在barcode的superTree视图中增加lasso函数
    enable_supertree_lasso_function: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var enableLasso = Variables.get('enable_lasso')
      if (!enableLasso) {
        return
      }
      //  lasso开始调用的函数
      var lasso_start = function () {
      }
      //  lasso绘制过程中调用的函数
      var lasso_draw = function () {
        // // Style the possible dots
        //  选择所有的possible为true的元素
        lasso.items().filter(function (d) {
          return d.possible === true
        }).each(function (d, i) {
          d3.select(this)
            .classed({"not_possible": false, "possible": true})
          highlight_children_id_by_father(d)
        })
        lasso.items().each(function (d) {
          if (d3.select(this).classed('possible')) {
            d.possible = true
          }
        })
        // Style the not possible dot
        lasso.items().filter(function (d) {
          return d.possible === false
        })
          .classed({"not_possible": true, "possible": false})
      }
      //  lasso结束时候调用的函数
      var lasso_end = function () {
        // Reset the style of the not selected dots
        var filterResultArray = lasso.items().filter(function (d) {
          return d.selected === true
        })
          .each(function (d, i) {
            //  向histogram中传递信号表示选中这些树
          })
        //  brush结束之后统计选中的节点的分布情况
        self.update_brush_node_distribution()
      }
      var supertreeViewWidth = $('#supertree-view').width()
      var supertreeViewheight = $('#supertree-view').height()
      if (d3.select('#supertree-svg').select('g.lasso').empty()) {
        var lasso_area = d3.select('#supertree-svg')
          .append("rect")
          .attr('id', 'lasso-area')
          .attr("width", supertreeViewWidth)
          .attr("height", supertreeViewheight)
          .style("opacity", 0)
      } else {
        d3.select('#supertree-svg').select('g.lasso').remove()
        d3.select('#supertree-svg').select('#lasso-area').remove()
        var lasso_area = d3.select('#supertree-svg')
          .append("rect")
          .attr('id', 'lasso-area')
          .attr("width", supertreeViewWidth)
          .attr("height", supertreeViewheight)
          .style("opacity", 0)
      }
      // Define the lasso
      var lasso = d3.lasso()
        .closePathDistance(75) // max distance for the lasso loop to be closed
        .closePathSelect(true) // can items be selected by closing the path?
        .hoverSelect(true) // can items by selected by hovering over them?
        .area(lasso_area) // area where the lasso can be started
        .on("start", lasso_start) // lasso start function
        .on("draw", lasso_draw) // lasso draw function
        .on("end", lasso_end) // lasso end function
      // Init the lasso on the svg:g that contains the dots
      d3.select('#supertree-svg').call(lasso)
      lasso.items(d3.selectAll(".supertree-icicle-node"))
      //  根据父亲节点的id, 找到所有的孩子节点的id
      function highlight_children_id_by_father(fatherObj) {
        barcodeCollection.each(function (model) {
          var barcodetreeId = model.get('barcodeTreeId')
          var fatherNodeId = fatherObj.id
          if (typeof (fatherNodeId) === 'undefined') {
            fatherNodeId = 'node-0-root'
            fatherObj.id = fatherNodeId
          }
          var fatherNodeArray = fatherNodeId.split('-')
          if ((typeof (fatherNodeArray) !== 'undefined') && (fatherNodeArray.length > 1)) {
            var fatherNodeDepth = fatherNodeArray[1]
            fatherObj.depth = +fatherNodeDepth
            var childrenNodeArray = model.find_children_nodes(fatherObj)
            for (var cI = 0; cI < childrenNodeArray.length; cI++) {
              var childNode = childrenNodeArray[cI]
              d3.select('#barcodetree-svg')
                .select('#' + barcodetreeId)
                .select('#' + childNode.id)
                .classed({"not_possible": false, "possible": true})
            }
            d3.select('#barcodetree-svg')
              .select('#' + barcodetreeId)
              .select('#' + fatherObj.id)
              .classed({"not_possible": false, "possible": true})
          }
        })
      }
    },
    //  在barcodeTree comparison视图中增加lasso函数
    enable_lasso_function: function () {
      var enableLasso = Variables.get('enable_lasso')
      if (!enableLasso) {
        return
      }
      var lasso_start = function () {
      }
      var lasso_draw = function () {
        //  Style the possible dots
        //  选择所有的possible为true的元素
        lasso.items().filter(function (d) {
          return d.possible === true
        }).each(function (d, i) {
          if (d3.select(this).classed('barcode-label')) {
            //  如果当前选中的是barcodeTree的label的元素, 那么需要即高亮label元素, 又高亮相应的barcodeTree中的所有元素
            d3.select(this)
              .classed({"not_possible": false, "possible": true})
            var labelId = d3.select(this).attr('id')
            var barcodeTreeId = labelId.replace('label-', '')
            //  将label对应的所有的barcodeNode进行高亮
            d3.select('#barcodetree-svg')
              .select('#' + barcodeTreeId)
              .selectAll('.barcode-node')
              .classed({
                "not_possible": false,
                "possible": true
              })
          } else if (d3.select(this).classed('barcode-node')) {
            //  如果当前选中的是barcodeTree中的节点元素, 那么需要即高亮barcodeTree中的对应的节点
            d3.select(this)
              .classed({"not_possible": false, "possible": true})
          }
        })
        lasso.items().each(function (d) {
          if (d3.select(this).classed('possible')) {
            d.possible = true
          }
        })
        // // Style the not possible dot
        lasso.items().filter(function (d) {
          return d.possible === false
        })
          .classed({"not_possible": true, "possible": false})
      }
      var lasso_end = function () {
        // Reset the style of the not selected dots
        var filterResultArray = lasso.items().filter(function (d) {
          return d.selected === true
        })
          .each(function (d, i) {
            //  向histogram中传递信号表示选中这些树
          })
        //  brush结束之后统计选中的节点的分布情况
        self.update_brush_node_distribution()
        var filterResult = filterResultArray[0]
        var filteredTreeArray = []
        for (var fI = 0; fI < filterResult.length; fI++) {
          var filteredItem = filterResult[fI]
          var barcodeTreeId = $(filteredItem).parent().attr('id')
          filteredTreeArray.push(barcodeTreeId)
        }
        self.trigger_highlight_selected_bar(filteredTreeArray)
      }
      var self = this
      var barcodeViewWidth = $('#barcodetree-view').width()
      var barcodeViewheight = $('#barcodetree-view').height()
      if (d3.select('#barcodetree-svg').select('g.lasso').empty()) {
        var lasso_area = d3.select('#barcodetree-svg')
          .append("rect")
          .attr('id', 'lasso-area')
          .attr("width", barcodeViewWidth)
          .attr("height", barcodeViewheight)
          .style("opacity", 0)
      } else {
        d3.select('#barcodetree-svg').select('g.lasso').remove()
        d3.select('#barcodetree-svg').select('#lasso-area').remove()
        var lasso_area = d3.select('#barcodetree-svg')
          .append("rect")
          .attr('id', 'lasso-area')
          .attr("width", barcodeViewWidth)
          .attr("height", barcodeViewheight)
          .style("opacity", 0)
      }
      // Define the lasso
      var lasso = d3.lasso()
        .closePathDistance(75) // max distance for the lasso loop to be closed
        .closePathSelect(true) // can items be selected by closing the path?
        .hoverSelect(true) // can items by selected by hovering over them?
        .area(lasso_area) // area where the lasso can be started
        .on("start", lasso_start) // lasso start function
        .on("draw", lasso_draw) // lasso draw function
        .on("end", lasso_end); // lasso end function
      // Init the lasso on the svg:g that contains the dots
      d3.select('#barcodetree-svg').call(lasso)
      lasso.items(d3.selectAll(".barcode-class"))
    },
    disable_lasso_function: function () {
      var self = this
      d3.selectAll(".barcode-class").classed('possible', false)
      d3.selectAll(".barcode-class").classed('not_possible', false)
      d3.selectAll(".supertree-icicle-node").classed('possible', false)
      d3.selectAll(".supertree-icicle-node").classed('not_possible', false)
      // 删除所有选择的高亮, 包括在histogram中的高亮
      self.trigger_unhighlight_selected_bar()
    },
    //  在lasso结束之后, 更新lasso范围内的节点的分布情况
    update_brush_node_distribution: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var brushedNodeAttrObj = {}
      var brushNodeNum = 0
      d3.select('#barcodetree-svg')
        .select('#barcodetree-collection-container')
        .selectAll('.single-tree')
        .each(function () {
          var barcodeTreeId = d3.select(this).attr('id')
          brushedNodeAttrObj[barcodeTreeId] = {}
          var rootNodeObj = d3.select('#barcodetree-svg')
            .select('#' + barcodeTreeId)
            .select('#node-0-root').data()[0]
          if (typeof (rootNodeObj) !== 'undefined') {
            if (typeof (rootNodeObj['num']) !== 'undefined') {
              var maxNum = rootNodeObj['num']
              brushedNodeAttrObj[barcodeTreeId]['maxNum'] = maxNum
              var brushedNodeAttrArray = []
              d3.select('#barcodetree-svg')
                .select('#' + barcodeTreeId)
                .selectAll('.barcode-node.possible')
                .each(function (d, i) {
                  var nodeObj = d3.select(this).data()[0]
                  brushedNodeAttrArray.push(nodeObj)
                  brushNodeNum = brushNodeNum + 1
                })
              brushedNodeAttrObj[barcodeTreeId]['nodeAttrArray'] = brushedNodeAttrArray
            }
          }
        })
      if (brushNodeNum !== 0) {
        barcodeCollection.update_brush_barcode_node_obj(brushedNodeAttrObj)
      }
    }
  }, SVGBase))
})
