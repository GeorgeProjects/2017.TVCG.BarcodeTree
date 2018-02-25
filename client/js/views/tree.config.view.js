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
      self.initEvent()
      // Backbone.Events.on(Config.get('EVENTS')['UPDATE_DISTRIBUTION_VIEW'], function () {
      //   self.render_distribution_histogram()
      // })
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
    trigger_update_distribution_view: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_DISTRIBUTION_VIEW'])
    },
    // send to barcode.view.js
    trigger_open_distribution_view: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['OPEN_DISTRIBUTION_VIEW'])
    },
    // send to barcode.view.js
    trigger_close_distribution_view: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['CLOSE_DISTRIBUTION_VIEW'])
    },
    trigger_update_barcode_view: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
      Backbone.Events.trigger(Config.get('EVENTS')['RENDER_SUPERTREE'])
    },
    trigger_update_animated_barcode_view: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_ANIATION_BARCODE_VIEW'])
    },
    initEvent: function () {
      var self = this
      Backbone.Events.on(Config.get('EVENTS')['UPDATE_TREE_CONFIG_VIEW'], function (event) {
        self.update_tree_config_view()
      })
    },
    onShow: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var originalWidthArray = Config.get('DEFAULT_SETTINGS').original_width_array
      $('#display-level-control>.level-btn').removeClass('active')
      var selectedLevels = Variables.get('selectedLevels')
      for (var sI = 0; sI < selectedLevels.length; sI++) {
        var disaplyedLevel = selectedLevels[sI] + 1
        $('#display-level-control>#btn-' + disaplyedLevel).addClass('active')
      }
      $('#refresh-display-level').click(function () {
      })
      $('#display-level-control>.level-btn').click(function () {
        var labelLevel = $(this).text()
        var realLevel = $(this).text() - 1
        var selectedLevels = Variables.get('selectedLevels')
        var levelIndex = selectedLevels.indexOf(realLevel)
        if ($('#display-level-control>#btn-' + labelLevel).hasClass('active')) {
          if (levelIndex !== -1) {
            selectedLevels.splice(levelIndex, 1)
            window.barcodeWidthArray[realLevel] = 0
          }
          $('#display-level-control>#btn-' + labelLevel).removeClass('active')
        } else {
          if (levelIndex === -1) {
            selectedLevels.push(realLevel)
            window.barcodeWidthArray[realLevel] = originalWidthArray[realLevel]
          }
          $('#display-level-control>#btn-' + labelLevel).addClass('active')
        }
        self.changeBarcodeWidthBySelectLevels()
        //  用户选择节点之后, 对于当前展示的节点进行更新
        // barcodeCollection.update_displayed_level()
        window.Datacenter.updateDateCenter()
      })
      $('#refresh-aligned-level').click(function () {
        window.Datacenter.barcodeCollection.reset_attribute()
        var selectItemNameArray = Variables.get('selectItemNameArray')
        var displayMode = Variables.get('displayMode')
        var url = 'barcode_original_data'
        $('#align-level-control>.level-btn').removeClass('active')
        var finishRequestDataDefer = $.Deferred()
        window.Datacenter.requestDataCenter(url, selectItemNameArray)
      })
      // $('#align-level-control>.level-btn').click(function () {
      //   if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
      //     var level = +$(this).text()
      //     var realLevel = level - 1
      //     self.activeAlignedLevel(level)
      //     Variables.set('alignedLevel', realLevel)
      //     barcodeCollection.aligned_current_tree()
      //   } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
      //     var selectedLevels = Variables.get('selectedLevels')
      //     if (selectedLevels.length !== 0) {
      //       var level = +selectedLevels.max() + 1
      //       var realLevel = level - 1
      //       self.activeAlignedLevel(level)
      //       Variables.set('alignedLevel', realLevel)
      //       barcodeCollection.aligned_current_tree()
      //     }
      //   }
      // })
      //  如果defaultBarcodeMode是compact类型, 则需要根据selectedLevels计算alignedLevel
      //  将计算的结果更新到barcode.conifg.view中进行显示
      // if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
      //   if (selectedLevels.length !== 0) {
      //     var alignedLevel = +selectedLevels.max() + 1
      //     var realLevel = alignedLevel - 1
      //     Variables.set('alignedLevel', realLevel)
      //     self.activeAlignedLevel(alignedLevel)
      //   }
      // }
      // Backbone.Events.on(Config.get('EVENTS')['UPDATE_ALIGN_LEVEL'], function (event) {
      //   var alignedLevel = event.thisNodeObj
      //   self.activeAlignedLevel(alignedLevel)
      // })
      $('#original-layout-button').click(function () {
        $('#barcode-layout-mode .mode-button').removeClass('active')
        $('#original-layout-button').addClass('active')
        Variables.set('layoutMode', 'ORIGINAL')
        window.Variables.update_barcode_attr()
        barcodeCollection.change_layout_mode()
        //  更新在具有attribute的情况下的barcode节点高度
        barcodeCollection.update_attribute_height()
      })
      $('#union-layout-button').click(function () {
        $('#barcode-layout-mode .mode-button').removeClass('active')
        $('#union-layout-button').addClass('active')
        Variables.set('layoutMode', 'UNION')
        window.Variables.update_barcode_attr()
        barcodeCollection.change_layout_mode()
        //  更新在具有attribute的情况下的barcode节点高度
        barcodeCollection.update_attribute_height()
      })
      $('#original-display-button').click(function () {
        self.changeDisplayMode2Original()
      })
      $('#compact-display-button').click(function () {
        self.changeDisplayMode2Compact()
      })
      $('#topological-comparison-button').click(function () {
        var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
        var barcodeTreeComparisonMode = Config.get('BARCODETREE_COMPARISON_MODE')
        barcodeTreeGlobalParas['Comparison_Mode'] = barcodeTreeComparisonMode['TOPOLOGY']
        $('#topological-comparison-button').addClass('active')
        $('#attribute-comparison-button').removeClass('active')
        Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
        self.hide_distribution_view_toggle()
        self.trigger_close_distribution_view()
      })
      $('#attribute-comparison-button').click(function () {
        var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
        var barcodeTreeComparisonMode = Config.get('BARCODETREE_COMPARISON_MODE')
        barcodeTreeGlobalParas['Comparison_Mode'] = barcodeTreeComparisonMode['ATTRIBUTE']
        $('#topological-comparison-button').removeClass('active')
        $('#attribute-comparison-button').addClass('active')
        Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
        // self.render_distribution_histogram()
        // self.trigger_update_distribution_view()
        window.Datacenter.barcodeCollection.update_barcode_node_collection_obj()
        self.trigger_open_distribution_view()
        self.show_distribution_view_toggle()
      })
      self.render_barcode_tree_config_view()
      self.init_locked_state()
      self.update_tree_config_view()
      self.add_lock_controller_event()
      $('#tree-config-div').mouseover(function () {
        self.trigger_mouse_out()
        self.trigger_unhovering_barcode()
      })
    },
    //  隐藏distribution视图的控制按钮
    hide_distribution_view_toggle: function () {
      var self = this
      $('#distribution-view-toggle').css({visibility: 'hidden'})
      $('#distribution-histogram-view').css({visibility: 'hidden'});
    },
    //  显示distribution视图的控制按钮
    show_distribution_view_toggle: function () {
      var self = this
      $('#distribution-view-toggle').css({visibility: 'visible'})
      $('#distribution-histogram-view').css({visibility: 'visible'});
    },
    //  初始化在tree config视图中的lock按钮的状态
    init_locked_state: function () {
      var self = this
      var barcodeTreeIsLocked = Variables.get('barcodeTreeIsLocked')
      if (barcodeTreeIsLocked) {
        $('#lock-controller').addClass('active')
        $('#lock-controller').html('<i class="fa fa-lock" aria-hidden="true"></i>')
      } else {
        $('#lock-controller').removeClass('active')
        $('#lock-controller').html('<i class="fa fa-unlock" aria-hidden="true"></i>')
      }
    },
    //  在tree config视图中的lock按钮增加响应函数
    add_lock_controller_event: function () {
      var self = this
      $('#lock-controller').click(function () {
        if ($('#lock-controller').hasClass('active')) {
          //  对于barcode解除锁定
          $('#lock-controller').removeClass('active')
          $('#lock-controller').html('<i class="fa fa-unlock" aria-hidden="true"></i>')
          Variables.set('barcodeTreeIsLocked', false)
        } else {
          //  对于barcode的锁定状态
          $('#lock-controller').addClass('active')
          $('#lock-controller').html('<i class="fa fa-lock" aria-hidden="true"></i>')
          Variables.set('barcodeTreeIsLocked', true)
        }
      })
    },
    //  将barcode的模式转变成compact模式
    changeDisplayMode2Compact: function () {
      var self = this
      $('#compact-display-button').addClass('active')
      $('#original-display-button').removeClass('active')
      $('#global-display-button').removeClass('active')
      Variables.set('displayMode', Config.get('CONSTANT').COMPACT)
      self.trigger_update_animated_barcode_view()
    },
    //  将barcode的模式转变成original模式
    changeDisplayMode2Original: function () {
      var self = this
      $('#original-display-button').addClass('active')
      $('#compact-display-button').removeClass('active')
      $('#global-display-button').removeClass('active')
      Variables.set('displayMode', Config.get('CONSTANT').ORIGINAL)
      self.trigger_update_animated_barcode_view()
    },
    //  更新barcode config视图中的按钮的状态
    update_tree_config_view: function () {
      var self = this
      var barcodeTreeIsLocked = Variables.get('barcodeTreeIsLocked')
      if (barcodeTreeIsLocked) {
        //  如果barcode变化被锁定
        var globalDisplayMode = Variables.get('displayMode')
        init_current_mode(globalDisplayMode)
      } else {
        //  如果barcode变化没有被锁定
        var singleBarcodeMode = window.Datacenter.barcodeCollection.get_current_single_barcode_mode()
        init_current_mode(singleBarcodeMode)
      }
      function init_current_mode(display_mode) {
        if (display_mode === Config.get('CONSTANT').ORIGINAL) {
          self.changeDisplayMode2Original()
        } else if (display_mode === Config.get('CONSTANT').COMPACT) {
          self.changeDisplayMode2Compact()
        }
        // else if (display_mode === Config.get('CONSTANT').GLOBAL) {
        //   self.changeDisplayMode2Global()
        // }
      }
    },
    render_barcode_tree_config_view: function () {
      var self = this
      $('#tree-config-div #config-minimize').on('mouseover', function () {
        $('#tree-config-div #config-minimize').css({'-webkit-text-fill-color': 'black'})
      })
      $('#tree-config-div #config-minimize').on('mouseout', function () {
        $('#tree-config-div #config-minimize').css({'-webkit-text-fill-color': '#aaa'})
      })
      $('#tree-config-div #config-close').on('mouseover', function () {
        $('#tree-config-div #config-close').css({'-webkit-text-fill-color': 'red'})
      })
      $('#tree-config-div #config-close').on('mouseout', function () {
        $('#tree-config-div #config-close').css({'-webkit-text-fill-color': '#aaa'})
      })
      $('#tree-config-div #config-close').on('click', function () {
        $('#tree-config-div').css({visibility: 'hidden'})
        $('#config-operation #tree-config-panel-toggle').removeClass('active')
      })
      $('#tree-config-div').draggable()
      $('#tree-config-div .panel-header').css('cursor', 'pointer')
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
        var dataValueArray = barcodeNodeCollectionObj[item]
        if ((typeof(dataValueArray) !== 'undefined') && (dataValueArray.length !== 0)) {
          self.add_distribution_histogram(distribution_level, dataValueArray)
        }
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