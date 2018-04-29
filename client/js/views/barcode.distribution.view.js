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
], function (require, Mn, _, Backbone, Config, d3, d3Barchart, pagination, Variables, Tpl) {
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
        var barcodeNodeCollectionObj = Variables.get('barcodeNodeCollectionObj')
        var distributionType = 'overall-distribution'
        self.render_distribution_histogram(barcodeNodeCollectionObj, distributionType)
      })
      Backbone.Events.on(Config.get('EVENTS')['UPDATE_BRUSH_DISTRIBUTION_VIEW'], function () {
        var brushBarcodeNodeCollectionObj = Variables.get('brushBarcodeNodeCollectionObj')
        var distributionType = 'brush-distribution'
        self.render_distribution_histogram(brushBarcodeNodeCollectionObj, distributionType)
      })
      //  清空所有的节点分布视图
      Backbone.Events.on(Config.get('EVENTS')['CLEAR_ALL'], function (event) {
        self.clear_all_distribution_views()
      })
    },
    onShow: function () {
      var self = this
    },
    //  清空distribution视图中的所有分布视图
    clear_all_distribution_views: function () {
      var self = this
      d3.selectAll('.distribution-levels').remove()
    },
    //  绘制全部选择的barcode节点属性分布柱状图
    render_distribution_histogram: function (barcodeNodeCollectionObj, distributionType) {
      var self = this
      self.clear_all_distribution_views()
      var barcodeCollection = self.options.barcodeCollection
      var barcodeConfigDivHeight = $('#barcode-distribution-view').height()
      var panelHeaderHeight = $('#barcode-distribution-view .panel-header').height()
      var brushBarcodeNodeCollectionObj = Variables.get('brushBarcodeNodeCollectionObj')
      var histogramViewNum = 0
      for (var item in barcodeNodeCollectionObj) {
        histogramViewNum = histogramViewNum + 1
      }
      var distributionHistogramHeight = (barcodeConfigDivHeight - panelHeaderHeight - window.rem_px * 2) / histogramViewNum
      var distributionMarginBottom = 10
      distributionHistogramHeight = distributionHistogramHeight - distributionMarginBottom
      if (distributionHistogramHeight < 90) {
        distributionHistogramHeight = 90
      }
      self.distributionHistogramHeight = distributionHistogramHeight

      var distribution_histogram_prefix = 'distribution-level-'
      d3.selectAll('.distribution-levels')
        .each(function (d, i) {
          var distributionLevel = d3.select(this).attr('id').replace('distribution-level-', '')
          if (typeof (barcodeNodeCollectionObj[distributionLevel]) === 'undefined') {
            d3.select('#' + distribution_histogram_prefix + distributionLevel).remove()
          }
        })
      for (var item in barcodeNodeCollectionObj) {
        var distribution_level = item
        if (typeof (barcodeNodeCollectionObj[item]) === 'undefined') {
          self.remove_distribution_histogram(distribution_level)
        } else {
          var dataValueArray = barcodeNodeCollectionObj[item]
          if ((typeof(dataValueArray) !== 'undefined') && (dataValueArray.length !== 0)) {
            self.add_distribution_histogram(distribution_level, dataValueArray)
          }
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
    //  删除 distribution histogram
    remove_distribution_histogram: function (distribution_level) {
      var divId = 'distribution-level-' + distribution_level
      d3.select('#distribution-histogram-view').select('#' + divId).remove()
    },
    add_distribution_histogram: function (distribution_level, raw_data_array) {
      var self = this
      var intervals = 100
      intervals = raw_data_array.max() > intervals ? raw_data_array.max() : intervals
      var eachIntervalRange = self.get_each_interval_range(raw_data_array, intervals)
      var histogramDataArray = self.get_distribution_histogram(raw_data_array, intervals, eachIntervalRange)
      var distribution_histogram_prefix = 'distribution-level-'
      var divId = distribution_histogram_prefix + distribution_level
      var distributionHistogramWidth = +$('#distribution-content').width()
      var distributionHistogramHeight = +self.distributionHistogramHeight
      var remPx = window.rem_px
      var margin = {top: 20, right: 10, bottom: remPx * 2, left: remPx * 3}
      var barClass = 'distribution-bar'
      var histogramWidth = distributionHistogramWidth - margin.left - margin.right
      var histogramHeight = distributionHistogramHeight - margin.top - margin.bottom
      var histogramDataTicksRealMax = histogramDataArray.length * eachIntervalRange
      var rangeNum = 2
      var xDisplayTicksValueArray = self._get_display_ticks_value_array(histogramDataTicksRealMax, rangeNum)
      var xTicksValueArray = []
      for (var tI = 0; tI < xDisplayTicksValueArray.length; tI++) {
        xTicksValueArray.push(Math.round(xDisplayTicksValueArray[tI] / eachIntervalRange))
      }
      //  计算distribution柱状图的y轴的ticks
      var maxHistogramData = 0
      for (var hI = 0; hI < histogramDataArray.length; hI++) {
        var histogramValue = histogramDataArray[hI].y
        if (histogramValue > maxHistogramData) {
          maxHistogramData = histogramValue
        }
      }
      //  basedInterval是10的倍数, 但是tick的间隔可以是多个20, 30, rangeNum设置具体的ticks的数值
      var rangeNum = 4
      var yTicksValueArray = []
      //  这个地方的判断使用等号, 因为传入的distribution_level不是数值类型
      if (distribution_level == 1) {
        var basedPowerNumber = 0
        yTicksValueArray = self._get_display_ticks_value_array(maxHistogramData, rangeNum, basedPowerNumber)
      } else {
        yTicksValueArray = self._get_display_ticks_value_array(maxHistogramData, rangeNum)
      }
      var _yTicksValueArray = []
      for (var yI = 0; yI < yTicksValueArray.length; yI++) {
        var yTicksValue = Math.round(yTicksValueArray[yI])
        if (yTicksValue !== 0) {
          if (_yTicksValueArray.indexOf(yTicksValue) === -1) {
            _yTicksValueArray.push(yTicksValue)
          }
        }
      }
      yTicksValueArray = _yTicksValueArray
      var xLabel = null
      if (distribution_level === 'ratio') {
        xLabel = '#' + distribution_level
      } else {
        xLabel = '#l-' + distribution_level
      }
      var barchart = d3.chart()
        .width(histogramWidth)
        .height(histogramHeight)
        // .margin(margin)
        .bar_class(barClass)
        .xTickNum(10)
        .xLabel(xLabel)
        .yLabel('#count')
        .margin(margin)
        .x_ticks_value(xTicksValueArray)
        .x_ticks_format(xDisplayTicksValueArray)
        .y_ticks_value(yTicksValueArray)
        .y_ticks_format(yTicksValueArray)
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
    _get_same_attribute: function (data_array) {
      var self = this
      var standardValue = 0
      var sameJudgement = true
      for (var dI = 0; dI < data_array.length; dI++) {
        if (data_array[dI].y !== 0) {
          standardValue = data_array[dI].y
          break
        }
      }
      for (var dI = 0; dI < data_array.length; dI++) {
        var value = data_array[dI].y
        if (value !== 0) {
          if (value !== standardValue) {
            sameJudgement = false
          }
        }
      }
      return sameJudgement
    },
    _get_display_ticks_value_array: function (max_value, range_num, based_power_num) {
      var basedPowerNumber = 0
      if (typeof (based_power_num) !== 'undefined') {
        basedPowerNumber = based_power_num
      } else {
        for (var range_power = -2; range_power < 3; range_power++) {
          if ((max_value > (2 * Math.pow(10, range_power))) && (max_value <= (2 * Math.pow(10, range_power + 1)))) {
            basedPowerNumber = range_power
            break
          }
        }
      }
      var basedNumber = Math.pow(10, basedPowerNumber)
      var range_num = Math.round((max_value / basedNumber) / 5)
      range_num = range_num < 1 ? 1 : range_num
      var ticksInterval = basedNumber * range_num
      var histogramDataTicksNum = Math.floor(max_value / ticksInterval)
      //  计算distribution柱状图的x轴的ticks
      var xDisplayTicksValueArray = []
      for (var tI = 1; tI <= histogramDataTicksNum; tI++) {
        var ticksNum = Math.round(tI * ticksInterval * 100) / 100
        xDisplayTicksValueArray.push(ticksNum)
      }
      return xDisplayTicksValueArray
    },
    brush_trigger: function (real_brush_start, real_brush_end, distribution_level) {
      var self = this
      var barcodeNodeCollectionObjWithId = Variables.get('barcodeNodeCollectionObjWithId')
      if (!d3.selectAll('.barcode-node.possible').empty()) {
        barcodeNodeCollectionObjWithId = Variables.get('brushBarcodeNodeCollectionObjWithId')
      }
      var barcodeNodeArray = barcodeNodeCollectionObjWithId[distribution_level]
      var highlightObjArray = Variables.get('brushHighlightObjArray')
      console.log('real_brush_start', real_brush_start)
      console.log('real_brush_end', real_brush_end)
      if (typeof (barcodeNodeArray) !== 'undefined') {
        for (var bI = 0; bI < barcodeNodeArray.length; bI++) {
          if ((barcodeNodeArray[bI].value >= real_brush_start) && (barcodeNodeArray[bI].value <= real_brush_end)) {
            highlightObjArray.push(barcodeNodeArray[bI])
          }
        }
      }
      if (distribution_level === 'ratio') {
        for (var hI = 0; hI < highlightObjArray.length; hI++) {
          if (!(((highlightObjArray[hI].value) >= real_brush_start) && ((highlightObjArray[hI].value) <= real_brush_end))) {
            highlightObjArray.splice(hI, 1)
            hI = hI - 1
          }
        }
      }
      //  删除当前高亮数组中不满足条件的元素
      for (var hI = 0; hI < highlightObjArray.length; hI++) {
        var nodeDepth = highlightObjArray[hI].nodeId.getDepthFromId()
        if (nodeDepth == distribution_level) {
          if (!(((highlightObjArray[hI].value) >= real_brush_start) && ((highlightObjArray[hI].value) <= real_brush_end))) {
            highlightObjArray.splice(hI, 1)
            hI = hI - 1
          }
        }
      }
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_FILTERING_HIGHLIGHT_NODES'], {
        highlightObjArray: highlightObjArray,
        distributionLevel: distribution_level
      })
    },
    get_each_interval_range: function (raw_data_array, intervals) {
      var maxNum = raw_data_array.max()
      var minNum = 0
      var eachIntervalRange = (maxNum - minNum) / intervals
      return eachIntervalRange
    },
    get_distribution_histogram: function (raw_data_array, intervals, eachIntervalRange) {
      var histogramDataArray = []
      var distributionRangeMax = intervals + intervals * 0.1
      for (var hI = 0; hI <= distributionRangeMax; hI++) {
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