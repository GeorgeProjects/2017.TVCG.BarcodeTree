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
    //  触发删除barcode视图中option按钮的事件
    trigger_remove_option_buttion: function () {
      //  当点击视图的其他空白地方的时候, 需要将option的按钮进行隐藏
      Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_OPTIONS_BUTTTON'])
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
      var barcodeCollection = self.options.barcodeCollection
      self.listenTo(Variables, 'change:barcodeNodexMaxX', self.enable_lasso_function)
      self.listenTo(Variables, 'change:barcodeNodeyMaxY', self.enable_lasso_function)
      barcodeCollection.on('add', function () {
        self.enable_lasso_function()
      })
      barcodeCollection.on('remove', function () {
        self.enable_lasso_function()
      })
    },
    enable_listener: function () {
      var self = this
      Backbone.Events.on(Config.get('EVENTS')['ENABLE_LASSO_FUNCTION'], function () {
        self.enable_lasso_function()
      })
      Backbone.Events.on(Config.get('EVENTS')['DISABLE_LASSO_FUNCTION'], function () {
        self.disable_lasso_function()
      })
    },
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var barcodeCollectionView = new BarcodeCollectionView({
        collection: barcodeCollection
      })
      self.enable_listener()
      self.showChildView('barcodeTreeContainer', barcodeCollectionView)
      var width = $('#barcodetree-view').width()
      var height = $('#barcodetree-view').height()
      //  在barcode比较视图中的背景矩形中增加click的事件
      self.d3el.select('.barcode-tree-single-g')
        .insert('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'comparison-bg')
        .on('click', function (d, i) {
          self.trigger_remove_option_buttion()
          self.trigger_mouse_out()
        })
        .on('mouseover', function () {
          // self.trigger_mouse_out()
          self.trigger_unhovering_barcode()
        })
        .on('mouseout', function () {
          // self.trigger_mouse_out()
          self.trigger_unhovering_barcode()
        })
        .attr('opacity', 0)
    },
    enable_lasso_function: function () {
      var enableLasso = Variables.get('enable_lasso')
      if (!enableLasso) {
        return
      }
      var lasso_start = function () {
        // lasso.items()
        //   .attr("r", 3.5) // reset size
        //   .style("fill", null) // clear all of the fills
        //   .classed({"not_possible": true, "selected": false}); // style as not possible
      };
      var lasso_draw = function () {
        // // Style the possible dots
        lasso.items().filter(function (d) {
          return d.possible === true
        })
          .classed({"not_possible": false, "possible": true});
        lasso.items().each(function (d) {
          if (d3.select(this).classed('possible')) {
            d.possible = true
          }
        })
        // // Style the not possible dot
        lasso.items().filter(function (d) {
          return d.possible === false
        })
          .classed({"not_possible": true, "possible": false});
      };
      var lasso_end = function () {
        // Reset the style of the not selected dots
        var filterResultArray = lasso.items().filter(function (d) {
          return d.selected === true
        })
          .each(function (d, i) {
            //  向histogram中传递信号表示选中这些树
          })
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
      lasso.items(d3.selectAll(".barcode-label"))
    },
    disable_lasso_function: function () {
      var self = this
      d3.selectAll(".barcode-label").classed('possible', false)
      d3.selectAll(".barcode-label").classed('not_possible', false)
      // 删除所有选择的高亮, 包括在histogram中的高亮
      self.trigger_unhighlight_selected_bar()
    }
  }, SVGBase))
})
