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
  'text!templates/barcodeDistribution.tpl'
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
      Backbone.Events.on(Config.get('EVENTS')['UPDATE_DISTRIBUTION_VIEW'], function () {
        self.render_distribution_histogram()
      })
    },
    onShow: function () {
      var self = this
    },
    render_distribution_histogram: function () {
      var self = this
      var barcodeConfigDivHeight = $('#barcode-distribution-view').height()
      var panelHeaderHeight = $('.panel-header').height()
      var panelContentHeight = $('.panel-content').height()
      var distributionHistogramHeight = (barcodeConfigDivHeight - panelHeaderHeight - panelContentHeight) / 5
      console.log('distributionHistogramHeight', distributionHistogramHeight)
      self.distributionHistogramHeight = distributionHistogramHeight
      var barcodeNodeCollectionObj = Variables.get('barcodeNodeCollectionObj')
      for (var item in barcodeNodeCollectionObj) {
        var distribution_level = item
        var dataValueArray = barcodeNodeCollectionObj[item]
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
          window.barcodeWidthArray[bI] = 0
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
      var margin = {top: 20, right: 10, bottom: 20, left: 20}
      var barClass = 'distribution-bar'
      var histogramWidth = distributionHistogramWidth - margin.left - margin.right
      var histogramHeight = distributionHistogramHeight - margin.top - margin.bottom
      console.log('histogramWidth', histogramWidth)
      console.log('histogramHeight', histogramHeight)
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
          .data([histogramDataArray])
          .call(barchart)
      } else {
        d3.select(self.el)
          .select('#' + divId)
          .select('#histogram-svg')
          .data([histogramDataArray])
          .call(barchart)
      }
    },
    brush_trigger: function (real_brush_start, real_brush_end, distribution_level) {
      var self = this
      var barcodeNodeCollectionObjWithId = Variables.get('barcodeNodeCollectionObjWithId')
      var barcodeNodeArray = barcodeNodeCollectionObjWithId[distribution_level]
      var highlightObjArray = new Array()
      for (var bI = 0; bI < barcodeNodeArray.length; bI++) {
        if ((barcodeNodeArray[bI].value >= real_brush_start) && (barcodeNodeArray[bI].value <= real_brush_end)) {
          highlightObjArray.push(barcodeNodeArray[bI])
        }
      }
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_FILTERING_HIGHLIGHT_NODES'], {
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
        histogramDataArray[hI] = {}
        histogramDataArray[hI].x1 = hI
        histogramDataArray[hI].x2 = (hI + 1)
        histogramDataArray[hI].y = getRangeValueNum(histogramDataArray[hI].x1 * eachIntervalRange, histogramDataArray[hI].x2 * eachIntervalRange, raw_data_array)
        histogramDataArray[hI].id = 'range-' + hI
      }
      return histogramDataArray
      function getRangeValueNum(rangeStart, rangeEnd, raw_data_array) {
        var nodeNum = 0
        for (var rI = 0; rI < raw_data_array.length; rI++) {
          if ((raw_data_array[rI] >= rangeStart) && (raw_data_array[rI] < rangeEnd)) {
            nodeNum = nodeNum + 1
          }
        }
        return nodeNum
      }
    }
  })
})