define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'config',
  'd3',
  'd3Barchart',
  'pagination',
  'variables',
  'text!templates/barcodeConfig.tpl'
], function (require, Mn, _, Backbone, Config, d3, d3BarChart, pagination, Variables, Tpl) {
  'use strict'

  return Mn.LayoutView.extend({
    tagName: 'div',
    template: _.template(Tpl),
    attributes: {
      'style': 'height: 100%; width: 100%',
    },
    initialize: function () {
      var self = this
      Backbone.Events.on(Config.get('EVENTS')[ 'UPDATE_DISTRIBUTION_VIEW' ], function () {
        self.render_distribution_histogram()
      })
    },
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var originalWidthArray = Config.get('DEFAULT_SETTINGS').original_width_array
      $('#display-level-control>.level-btn').removeClass('active')
      var selectedLevels = Variables.get('selectedLevels')
      for (var sI = 0; sI < selectedLevels.length; sI++) {
        var disaplyedLevel = selectedLevels[ sI ] + 1
        $('#display-level-control>#btn-' + disaplyedLevel).addClass('active')
      }
      $('#refresh-display-level').click(function () {})
      $('#display-level-control>.level-btn').click(function () {
        var labelLevel = $(this).text()
        var realLevel = $(this).text() - 1
        var selectedLevels = Variables.get('selectedLevels')
        var levelIndex = selectedLevels.indexOf(realLevel)
        if ($('#display-level-control>#btn-' + labelLevel).hasClass('active')) {
          if (levelIndex !== -1) {
            selectedLevels.splice(levelIndex, 1)
            window.barcodeWidthArray[ realLevel ] = 0
          }
          $('#display-level-control>#btn-' + labelLevel).removeClass('active')
        } else {
          if (levelIndex === -1) {
            selectedLevels.push(realLevel)
            window.barcodeWidthArray[ realLevel ] = originalWidthArray[ realLevel ]
          }
          $('#display-level-control>#btn-' + labelLevel).addClass('active')
        }
        var url = 'barcode_original_data'
        var selectedItemsArray = Variables.get('selectItemNameArray')
        self.changeBarcodeWidthBySelectLevels()
        //  用户选择节点之后, 对于当前展示的节点进行更新
        // barcodeCollection.update_displayed_level()
        window.Datacenter.updateDateCenter(url, selectedItemsArray)
      })
      $('#refresh-aligned-level').click(function () {
        window.Datacenter.barcodeCollection.reset_attribute()
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
      })
      $('#align-level-control>.level-btn').click(function () {
        if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
          var level = +$(this).text()
          var realLevel = level - 1
          self.activeAlignedLevel(level)
          Variables.set('alignedLevel', realLevel)
          barcodeCollection.aligned_current_tree()
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          var selectedLevels = Variables.get('selectedLevels')
          if (selectedLevels.length !== 0) {
            var level = +selectedLevels.max() + 1
            var realLevel = level - 1
            self.activeAlignedLevel(level)
            Variables.set('alignedLevel', realLevel)
            barcodeCollection.aligned_current_tree()
          }
        }
      })
      //  如果defaultBarcodeMode是compact类型, 则需要根据selectedLevels计算alignedLevel
      //  将计算的结果更新到barcode.conifg.view中进行显示
      if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        if (selectedLevels.length !== 0) {
          var alignedLevel = +selectedLevels.max() + 1
          var realLevel = alignedLevel - 1
          Variables.set('alignedLevel', realLevel)
          self.activeAlignedLevel(alignedLevel)
        }
      }
      Backbone.Events.on(Config.get('EVENTS')[ 'UPDATE_ALIGN_LEVEL' ], function (event) {
        var alignedLevel = event.thisNodeObj
        self.activeAlignedLevel(alignedLevel)
      })
      $('#fisheye-layout-button').click(function () {
        $('#fisheye-layout-button').addClass('active')
        $('#union-layout-button').removeClass('active')
        Variables.set('layoutMode', 'FISHEYE')
        barcodeCollection.change_layout_mode()
      })
      $('#union-layout-button').click(function () {
        $('#fisheye-layout-button').removeClass('active')
        $('#union-layout-button').addClass('active')
        Variables.set('layoutMode', 'UNION')
        barcodeCollection.change_layout_mode()
      })
      $('#original-display-button').click(function () {
        changeDisplayMode2Original()
      })

      $('#compact-display-button').click(function () {
        changeDisplayMode2Compact()
      })
      $('#topological-comparison-button').click(function () {
        Variables.set('comparisonMode', Variables.get('TOPOLOGICAL'))
        $('#topological-comparison-button').addClass('active')
        $('#attribute-comparison-button').removeClass('active')
        Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW' ])
        $('#distribution-histogram-view').css("visibility", "hidden");
      })
      $('#attribute-comparison-button').click(function () {
        Variables.set('comparisonMode', Variables.get('ATTRIBUTE'))
        $('#topological-comparison-button').removeClass('active')
        $('#attribute-comparison-button').addClass('active')
        Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_BARCODE_VIEW' ])
        $('#distribution-histogram-view').css("visibility", "visible");
        self.render_distribution_histogram()
      })
      if (Variables.get('displayMode') === 'ORIGINAL') {
        changeDisplayMode2Original()
      } else if (Variables.get('displayMode') === 'COMPACT') {
        changeDisplayMode2Compact()
      }
      function changeDisplayMode2Compact () {
        $('#compact-display-button').addClass('active')
        $('#original-display-button').removeClass('active')
        Variables.set('displayMode', 'COMPACT')
        if (selectedLevels.length !== 0) {
          var alignedLevel = +selectedLevels.max() + 1
          var realLevel = alignedLevel - 1
          Variables.set('alignedLevel', realLevel)
          self.activeAlignedLevel(alignedLevel)
        }
      }

      function changeDisplayMode2Original () {
        $('#original-display-button').addClass('active')
        $('#compact-display-button').removeClass('active')
        Variables.set('displayMode', 'ORIGINAL')
        var alignedLevel = 0
        Variables.set('alignedLevel', alignedLevel)
        var realLevel = alignedLevel + 1
        self.activeAlignedLevel(realLevel)
      }
    },
    render_distribution_histogram: function () {
      var self = this
      var barcodeConfigDivHeight = $('#barcode-config-div').height()
      var panelHeaderHeight = $('.panel-header').height()
      var panelContentHeight = $('.panel-content').height()
      var distributionHistogramHeight = (barcodeConfigDivHeight - panelHeaderHeight - panelContentHeight) / 5
      self.distributionHistogramHeight = distributionHistogramHeight
      var barcodeNodeCollectionObj = Variables.get('barcodeNodeCollectionObj')
      for (var item in barcodeNodeCollectionObj) {
        var distribution_level = item
        var dataValueArray = barcodeNodeCollectionObj[ item ]
        if ((typeof(dataValueArray) !== 'undefined') && (dataValueArray.length !== 0)) {
          self.add_distribution_histogram(distribution_level, dataValueArray)
        }
      }
    },
    /**
     * 根据对齐层级的数值更新对齐层级的具体显示
     * @param level
     */
    activeAlignedLevel: function (level) {
      $('#align-level-control>.btn').removeClass('active')
      for (var lI = level; lI >= 0; lI--) {
        $('#align-level-control>#btn-' + lI).addClass('active')
      }
    },
    /**
     * 根据选中的层级改变层级的节点的宽度
     */
    changeBarcodeWidthBySelectLevels: function () {
      var selectedLevels = Variables.get('selectedLevels')
      var barcodeWidthArray = window.barcodeWidthArray
      for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
        if (selectedLevels.indexOf(bI) === -1) {
          window.barcodeWidthArray[ bI ] = 0
        }
      }
    },
    add_distribution_histogram: function (distribution_level, raw_data_array) {
      var self = this
      var intervals = 100
      var eachIntervalRange = self.get_each_interval_range(raw_data_array, intervals)
      var histogramDataArray = self.get_distribution_histogram(raw_data_array, intervals, eachIntervalRange)
      var divId = 'distribution-level-' + distribution_level
      var distributionHistogramWidth = +$('#distribution-content').width()
      var distributionHistogramHeight = +self.distributionHistogramHeight
      var margin = { top: 20, right: 10, bottom: 20, left: 20 }
      var barClass = 'distribution-bar'
      var histogramWidth = distributionHistogramWidth - margin.left - margin.right
      var histogramHeight = distributionHistogramHeight - margin.top - margin.bottom
      var barchart = d3.chart()
        .width(histogramWidth)
        .height(histogramHeight)
        // .margin(margin)
        .bar_class(barClass)
        .xTickNum(10)
        .xLabel('#level-' + distribution_level)
        .yLabel('#count')
        .margin(margin)
        .x_ticks_value([])
        .x_ticks_format([])
        .y_ticks_value([])
        .y_ticks_format([])
        .bar_interval(0.5)
        .x_interval(eachIntervalRange)
        .distributionLevel(String(distribution_level))
        .brush_trigger(self.brush_trigger)
        .brushmove_trigger(function () {
          console.log('brush move')
        })
      if (d3.select('#distribution-histogram-view').select('#' + divId).empty()) {
        $("<div></div>")
          .attr('id', 'distribution-level-' + distribution_level)
          .attr('class', 'distribution-levels')
          .appendTo('#distribution-histogram-view');
        d3.select('#' + divId)
          .append('svg')
          .attr('id', 'histogram-svg')
        // $('#distribution-histogram-view').append(divItemStr)
        d3.select(self.el)
          .select('#' + divId)
          .select('#histogram-svg')
          .data([ histogramDataArray ])
          .call(barchart)
      } else {
        d3.select(self.el)
          .select('#' + divId)
          .select('#histogram-svg')
          .data([ histogramDataArray ])
          .call(barchart)
      }
    },
    brush_trigger: function (real_brush_start, real_brush_end, distribution_level) {
      var self = this
      var barcodeNodeCollectionObjWithId = Variables.get('barcodeNodeCollectionObjWithId')
      var barcodeNodeArray = barcodeNodeCollectionObjWithId[ distribution_level ]
      var highlightObjArray = new Array()
      for (var bI = 0; bI < barcodeNodeArray.length; bI++) {
        if ((barcodeNodeArray[ bI ].value >= real_brush_start) && (barcodeNodeArray[ bI ].value <= real_brush_end)) {
          highlightObjArray.push(barcodeNodeArray[ bI ])
        }
      }
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UPDATE_FILTERING_HIGHLIGHT_NODES' ], {
        highlightObjArray: highlightObjArray,
        distributionLevel: distribution_level
      })
    },
    get_each_interval_range: function (raw_data_array, intervals) {
      var maxNum = raw_data_array.max()
      var minNum = raw_data_array.min()
      var eachIntervalRange = (maxNum - minNum) / intervals
      return eachIntervalRange
    },
    get_distribution_histogram: function (raw_data_array, intervals, eachIntervalRange) {
      var histogramDataArray = []
      for (var hI = 0; hI < intervals; hI++) {
        histogramDataArray[ hI ] = {}
        histogramDataArray[ hI ].x1 = hI
        histogramDataArray[ hI ].x2 = (hI + 1)
        histogramDataArray[ hI ].y = getRangeValueNum(histogramDataArray[ hI ].x1 * eachIntervalRange, histogramDataArray[ hI ].x2 * eachIntervalRange, raw_data_array)
        histogramDataArray[ hI ].id = 'range-' + hI
      }
      return histogramDataArray
      function getRangeValueNum (rangeStart, rangeEnd, raw_data_array) {
        var nodeNum = 0
        for (var rI = 0; rI < raw_data_array.length; rI++) {
          if ((raw_data_array[ rI ] >= rangeStart) && (raw_data_array[ rI ] < rangeEnd)) {
            nodeNum = nodeNum + 1
          }
        }
        return nodeNum
      }
    }
  })
})