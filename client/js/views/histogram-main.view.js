define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'd3',
  'd3Barchart',
  'jsColor',
  'config',
  'variables',
  'views/svg-base.addon'
], function (require, Mn, _, Backbone, d3, d3BarChart, jsColor, Config, Variables, SVGBase) {
  'use strict'

  return Mn.ItemView.extend(_.extend({
    tagName: 'svg',
    template: false, //  for the itemview, we must define the template value false
    attributes: {
      style: 'width: 100%; height: 100%;',
      id: 'histogram-main-svg'
    },
    events: {},
    initialize: function (options) {
      //  初始化的时候请求一个默认的数据
      var self = this
      //  清空所有选择的barcodeTree
      self.clear_all_items()
      self.init_events()
      self.init_view()
    },
    init_events: function () {
      var self = this
      //  改变histogram中选中的bar的颜色
      Backbone.Events.on(Config.get('EVENTS')['SET_PRECLICK_COLOR'], function (event) {
        var color = event.color
        self.set_preclick_color(color)
      })
      //  在改变数据集的时候渲染histogram
      Backbone.Events.on(Config.get('EVENTS')['RENDER_HISTOGRAM'], function (event) {
        var dataSetName = event.dataSetName
        self.draw_histogram(dataSetName)
      })
      //  鼠标悬浮在barcode上面广播的事件
      Backbone.Events.on(Config.get('EVENTS')['HOVERING_BARCODE_EVENT'], function (event) {
        var barcodeTreeId = event.barcodeTreeId
        self.hovering_barcode(barcodeTreeId)
      })
      //  鼠标从barcode上面移开广播的事件
      Backbone.Events.on(Config.get('EVENTS')['UN_HOVERING_BARCODE_EVENT'], function (event) {
        self.unhovering_barcode()
      })
      //  鼠标在comparisonview中点击选中barcode广播的事件
      Backbone.Events.on(Config.get('EVENTS')['SELECT_BARCODE_EVENT'], function (event) {
        var barcodeTreeId = event.barcodeTreeId
        self.select_histogram(barcodeTreeId)
      })
      //  鼠标在comparisonview中点击取消选中barcode广播的事件
      Backbone.Events.on(Config.get('EVENTS')['UNSELECT_BARCODE_EVENT'], function (event) {
        var barcodeTreeId = event.barcodeTreeId
        self.unselect_histogram(barcodeTreeId)
      })
      //  鼠标在comparisonview中点击选中barcode广播的事件
      Backbone.Events.on(Config.get('EVENTS')['SET_SELECT_BARCODE_EVENT'], function (event) {
        var barcodeTreeId = event.barcodeTreeId
        self.set_select_histogram(barcodeTreeId)
      })
      //  鼠标在comparisonview中点击取消选中barcode广播的事件
      Backbone.Events.on(Config.get('EVENTS')['SET_UNSELECT_BARCODE_EVENT'], function (event) {
        var barcodeTreeId = event.barcodeTreeId
        self.set_unselect_histogram(barcodeTreeId)
      })
      //
      Backbone.Events.on(Config.get('EVENTS')['UPDATE_HISTOGRAM_ENCODE'], function (event) {
        var colorEncodingObj = event.colorEncodingObj
        self.update_histogram_color_encode(colorEncodingObj)
      })
      //  在histogram视图中更新histogram的位置
      // Backbone.Events.on(Config.get('EVENTS')['UPDATE_HISTOGRAM_COMPARISON_LOC'], function (event) {
      //   console.log('listen UPDATE_HISTOGRAM_COMPARISON_LOC')
      //   var sameNodeNumObj = event.sameNodeNumObj
      //   var differentNodeNumObj = event.differentNodeNumObj
      //   self.update_histogram_comparison_loc_encode(sameNodeNumObj, differentNodeNumObj)
      // })
      //  用户点击clear all的按钮, 清空选中所有的element
      Backbone.Events.on(Config.get('EVENTS')['CLEAR_ALL'], function (event) {
        self.clear_all_items()
      })
      //  点击某个group之后,选择group中的BArcodeTree
      Backbone.Events.on(Config.get('EVENTS')['SELECT_GROUP_BARCODETREE'], function (event) {
        var selectionArray = event.selectionArray
        self.set_unselect_all_histogram()
        for (var sI = 0; sI < selectionArray.length; sI++) {
          self.set_select_histogram(selectionArray[sI])
        }
      })
      //  点击某个选择的group之后, 取消选择group中的BarcodeTree
      Backbone.Events.on(Config.get('EVENTS')['UNSELECT_GROUP_BARCODETREE'], function () {
        self.set_unselect_all_histogram()
      })
      //  点击某个选择的group之后, 取消选择group中的BarcodeTree
      Backbone.Events.on(Config.get('EVENTS')['REMOVE_SELECTION'], function (event) {
        var barId = event.barcodeTreeId
        console.log('barId', barId)
        self.cancel_selection_highlight(barId)
      })
      Backbone.Events.on(Config.get('EVENTS')['HIGHLIGHT_LASSO_SELECTED'], function (event) {
        var filteredTreeArray = event.filteredTreeArray
        self.highlight_lasso_selected(filteredTreeArray)
      })
      Backbone.Events.on(Config.get('EVENTS')['UNHIGHLIGHT_LASSO_SELECTED'], function (event) {
        self.unhighlight_all_lasso_selected()
      })
    },
    //  选择数据之后,数据无法马上显示,可以展示loading的icon
    trigger_show_loading_icon: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['SHOW_LOADING_ICON'])
    },
    //  鼠标悬浮在histogram的每一个bar上, 需要与下方的barcode进行联动, 传递出这个barcodeTree的id信号
    trigger_hovering_barcode_event: function (barId) {
      Backbone.Events.trigger(Config.get('EVENTS')['HOVERING_BARCODE_EVENT'], {
        'barcodeTreeId': barId
      })
    },
    //  鼠标离开histogram的bar上, 可以取消对于barcode的高亮
    trigger_un_hovering_barcode_event: function (barcodeId) {
      Backbone.Events.trigger(Config.get('EVENTS')['UN_HOVERING_BARCODE_EVENT'], {
        'barcodeTreeId': barcodeId
      })
    },
    //  发出mouseout的信号
    trigger_mouseout_event: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['NODE_MOUSEOUT'], {
        'eventView': 'HISTOGRAM'
      })
    },
    //  发出mouseout的信号
    trigger_option_button: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_OPTIONS_BUTTTON'])
    },
    //  更新supertree视图的信号
    trigger_super_view_update: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['RENDER_SUPERTREE'])
    },
    //  关闭supertree视图
    trigger_close_supertree: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['CLOSE_SUPER_TREE'])
    },
    trigger_update_distribution: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_DISTRIBUTION_VIEW'])
    },
    //  更新选择的list
    trigger_update_selection_list: function () {
      var self = this
      var selectionList = self.get_selection_list()
      Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_SELECTION_LIST'], {
        selectionList: selectionList
      })
    },
    //  高亮所有选择的barcodeTree的高亮
    highlight_lasso_selected: function (filteredTreeArray) {
      var self = this
      for (var fI = 0; fI < filteredTreeArray.length; fI++) {
        self.d3el.select('rect#' + filteredTreeArray[fI]).classed('lasso-selected', true)
      }
    },
    //  删除所有的lasso选择的barcodeTree的高亮
    unhighlight_all_lasso_selected: function () {
      var self = this
      self.d3el.selectAll('.lasso-selected').classed('lasso-selected', false)
    },
    get_selection_list: function () {
      var self = this
      var selectionList = []
      var currentDataSetName = Variables.get('currentDataSetName')
      if (currentDataSetName === Config.get('DataSetCollection')['LibraryTree_DailyName']) {
        //  记录不同日期的个数的对象
        var dayRecordObj = {}
        var selectionBarcodeObject = {}
        var selectItemNameArray = Variables.get('selectItemNameArray')
        var dayIdArray = ['mon', 'tues', 'wedn', 'thurs', 'fri', 'satur', 'sun']
        var dayNameArray = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        for (var sI = 0; sI < selectItemNameArray.length; sI++) {
          if (selectItemNameArray[sI].indexOf('-') !== -1) {
            var date = selectItemNameArray[sI].split('-')[1].replaceAll('_', '-')
          } else {
            var date = selectItemNameArray[sI]
          }
          var curDay = new Date(date).getDay()
          var dayItemId = dayIdArray[curDay]
          var dayItemName = dayNameArray[curDay]
          //  初始化selectionBarcodeObject
          if (typeof (selectionBarcodeObject[dayItemId]) === 'undefined') {
            selectionBarcodeObject[dayItemId] = [selectItemNameArray[sI]]
          } else {
            selectionBarcodeObject[dayItemId].push(selectItemNameArray[sI])
          }
          //  初始化dayObj
          if (typeof (dayRecordObj[dayItemId]) === 'undefined') {
            dayRecordObj[dayItemId] = {'dayId': dayItemId, 'dayNum': 1, 'dayName': dayItemName}
          } else {
            dayRecordObj[dayItemId].dayNum = dayRecordObj[dayItemId].dayNum + 1
          }
        }
        //  将dayRecordObj转换为selectionList
        for (var item in dayRecordObj) {
          selectionList.push(dayRecordObj[item])
        }
        Variables.set('selectionBarcodeObject', selectionBarcodeObject)
        console.log('selectionBarcodeObject', selectionBarcodeObject)
      }
      return selectionList
    },
    /**
     * 初始化视图中的svg,包括大小,位置
     */
    init_view: function () {
      var self = this
      var divWidth = $('#histogram-main-panel').width()
      var divHeight = $('#histogram-main-panel').height()
      d3.select(self.el)
        .attr('width', divWidth)
        .attr('height', divHeight)
        .on('click', function () {
          self.trigger_option_button()
        })
      var marginTop = window.rem_px * 1.5
      var marginRight = window.rem_px
      var marginBottom = window.rem_px * 2
      var marginLeft = window.rem_px * 3
      var margin = {top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft}
      var histogramWidth = divWidth - margin.left - margin.right
      var histogramHeight = divHeight - margin.top - margin.bottom
      //  增加histogram的高度, 用于计算整个histogram的纵向的scale
      self.histogramHeight = histogramHeight
      d3.select(self.el)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('id', 'histogram-g')
      d3.select(self.el)
        .append('g')
        .attr('transform', 'translate(' + (divWidth - margin.right) + ',' + margin.top + ')')
        .attr('id', 'control-g')
      self.draw_histogram(histogramWidth, histogramHeight, margin)
      d3.select('#histogram-main-panel')
        .on('mouseover', function (d, i) {
          // self.trigger_mouseout_event()
        })
        .on('click', function (d, i) {
          self.trigger_mouseout_event()
        })
      var tip = window.histogramTip
      self.d3el.call(tip)
    },
    set_preclick_color: function (color) {
      var self = this
      var selectElements = self.d3el.selectAll('.pre-click-highlight')[0]
      for (var sI = 0; sI < selectElements.length; sI++) {
        d3.select(selectElements[sI]).style('fill', color)
        // console.log('selectElements[sI]', selectElements[ sI ])
      }
      self.brushSelectionItems()
    },
    /**
     * draw_histogram: 绘制柱状图视图
     * @param histogramWidth
     * @param histogramHeight
     * @param margin
     */
    draw_histogram: function (histogramWidth, histogramHeight, margin) {
      var self = this
      var histogramModel = self.model
      var histogramDataObject = histogramModel.get('histogramDataObject')
      var barClass = histogramDataObject.className
      var fileInfoData = histogramDataObject.fileInfo
      var histogramDataArray = []
      var histogramDataObj = {}
      for (var hI = 0; hI < fileInfoData.length; hI++) {
        histogramDataArray[hI] = {}
        histogramDataArray[hI].x1 = hI
        histogramDataArray[hI].x2 = hI + 1
        if (histogramDataObject.scaleType === 'log') {
          histogramDataArray[hI].y = Math.log(fileInfoData[hI]['num'])
        } else {
          histogramDataArray[hI].y = fileInfoData[hI]['num']
        }
        histogramDataArray[hI].id = fileInfoData[hI]['name']
        histogramDataObj[histogramDataArray[hI].id] = histogramDataArray[hI]
      }
      self.histogramDataArray = histogramDataArray
      self.histogramDataObj = histogramDataObj
      var yTicksValueArray = histogramDataObject.yTicksValueArray
      if (histogramDataObject.scaleType === 'log') {
        for (var yI = 0; yI < yTicksValueArray.length; yI++) {
          yTicksValueArray[yI] = Math.log(yTicksValueArray[yI])
        }
      }
      var yTicksFormatArray = histogramDataObject.yTicksFormatArray
      var xTicksValueArray = histogramDataObject.xTicksValueArray
      var xTicksFormatArray = histogramDataObject.xTicksFormatArray
      //  在brush开始的时候首先将之前选择的barcode的pre-click-highlight取消
      var brushstart = function () {
        d3.select(self.el).selectAll('.library-bar.pre-click-highlight')
          .classed('pre-click-highlight', false)
      }
      //  brushend 方法在brush结束之后显示icon list
      var brushend = function () {
        self.brushSelectionItems()
        var icons = []
        icons.push({
          icon: 'fa-check',
          title: 'all',
          activeClass: 'inactive',
          id: 'confirmation',
          click: function () {
            self.brushSelectionItems()
            barchart.select_all_items(self.el)
            if (!d3.select('#confirmation').classed('active')) {
              d3.select('#confirmation').classed('active', true)
            }
          }
        })
        icons.push({
          icon: 'fa-times',
          title: 'all',
          activeClass: 'inactive',
          id: 'confirmation',
          click: function () {
            self.brushUnSelectionItems()
            self.remove_all_click_unhighlight()
          }
        })
        //  在brush的选项按钮列表中增加星期的选择
        var currentDataSetName = Variables.get('currentDataSetName')
        if (currentDataSetName === Config.get('DataSetCollection')['LibraryTree_DailyName']) {
          for (var i = 0; i < 7; ++i) {
            var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            icons.push({
              title: day[i],
              text: day[i][0],
              id: day[i],
              activeClass: 'active',
              day: i,
              click: function () {
                var btn_day = this.day
                var selectionArray = []
                //  删除选中范围内的该天的barcodeTree
                if (d3.select('#' + day[this.day]).classed('active')) {
                  d3.select(self.el).selectAll('.library-bar.unchanged-pre-click-highlight')
                    .each(function (d, i) {
                      var id = d3.select(this).attr('id')
                      if (typeof(id) !== 'undefined') {
                        var date = id.split('-')[1].replaceAll('_', '-')
                        var cur_day = new Date(date).getDay()
                        if (cur_day == btn_day) {
                          d3.select(this).classed('click-unhighlight', true)
                          d3.select(this).classed('pre-click-highlight', false)
                          d3.select(this).classed('click-highlight', false)
                          d3.select(this).style('fill', null)
                          var unselectedItemsArray = []
                          var itemId = d3.select(this).attr('id')
                          unselectedItemsArray.push(itemId)
                          self.unSelectBarItem(unselectedItemsArray)
                        }
                      }
                    })
                  d3.select('#' + day[this.day]).classed('active', false)
                } else if (!d3.select('#' + day[this.day]).classed('active')) {
                  //  增加选中范围内的该天的barcodeTree
                  d3.select(self.el).selectAll('.library-bar.unchanged-pre-click-highlight')
                    .each(function (d, i) {
                      var id = d3.select(this).attr('id')
                      if (typeof(id) !== 'undefined') {
                        var date = id.split('-')[1].replaceAll('_', '-')
                        var cur_day = new Date(date).getDay()
                        if (cur_day == btn_day) {
                          d3.select(this).classed('pre-click-highlight', true)
                        }
                      }
                    })
                  self.brushSelectionItems()
                  d3.select('#' + day[this.day]).classed('active', true)
                }
              }
            })
          }
        }
        var d3_extent = d3.select(self.el).select('.extent')
        var jquery_extent = $('.extent')
        if (jquery_extent.data('d3_menu') === undefined) {
          jquery_extent.d3_menu().icons(icons).target(d3_extent)
          d3_extent.call(jquery_extent.d3_menu())
        }
      }
      //  brush的范围发生移动或者大小改变,需要将所有的button设置为active的状态
      var brushmove = function () {
        var day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        for (var dI = 0; dI < day.length; dI++) {
          d3.select('#' + day[dI]).classed('active', true)
        }
        d3.select('#confirmation').classed('active', false)
      }
      //  点击histogram上面的bar选中调用的函数
      var selectBarItem = function (barId) {
        self.selectBarItem(barId)
      }
      //  再次点击histogram上面的bar取消选中调用的函数
      var unSelectBarItem = function (barId) {
        self.unSelectBarItem([barId])
      }
      //  鼠标移开bar节点的时候所调用的函数
      var unhoveringBarItem = function (d) {
        var barcodeId = d.id
        self.trigger_un_hovering_barcode_event(barcodeId)
        histogramTip.hide()
      }
      //
      var prehighlightBar = function (barId) {
        self.prehighlightBar(barId)
      }
      //  取消对于histogram视图中选中的bar的高亮
      function unhighlightBar(barId) {
        self.unhighlightBar(barId)
      }

      //  对于histogram中的bar进行高亮
      var highlightBar = function (barId) {
        self.highlightBar(barId)
      }
      //  鼠标悬浮在bar节点的时候所调用的函数
      var hoveringBarItem = function (d) {
        self.trigger_hovering_barcode_event(d.id)
        self.show_tip(d)
        // var barId = d.id
        // var date = barId.split('-')[1].replaceAll('_', '/')
        // var dayArray = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        // var barValue = d.y
        // self.trigger_hovering_barcode_event(barId)
        // var date = barId.split('-')[1].replaceAll('_', '-')
        // var curDay = new Date(date).getDay()
        // var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + date + "/" + dayArray[curDay] + ", num: " + barValue + "</span></span>"
        // histogramTip.show(tipValue)
        // //  如果存在比较高的tooltip移动了位置, 将类别变成d3-histogram-tip-flip; 需要先将d3-histogram-tip-flip变成d3-histogram-tip
        // $('.d3-histogram-tip-flip').removeClass('d3-histogram-tip-flip').addClass('d3-histogram-tip')
        // flipTooltipLeft()
        // flipTooltipRight()
        // flipTooltipTop()
      }
      var barchart = d3.chart()
        .width(histogramWidth)
        .height(histogramHeight)
        .margin(margin)
        .bar_class(barClass)
        .xTickNum(10)
        .x_ticks_value(xTicksValueArray)
        .x_ticks_format(xTicksFormatArray)
        .y_ticks_value(yTicksValueArray)
        .y_ticks_format(yTicksFormatArray)
        .bar_click_handler(selectBarItem)
        .bar_unclick_handler(unSelectBarItem)
        .xLabel('#Date')
        .xLabel_location('.90em')
        .xLabel_text_anchor('end')
        .yLabel('#log(num)')
        .bar_interval(0.5)
        .brush_trigger(brushend)
        .brush_start_trigger(brushstart)
        .brushmove_trigger(brushmove)
        .hovering_trigger(hoveringBarItem)
        .unhovering_trigger(unhoveringBarItem)
        .pre_highlight_bar(prehighlightBar)
        .highlight_bar(highlightBar)
        .un_highlight_bar(unhighlightBar)
      self.barchart = barchart
      d3.select(self.el)
        .data([histogramDataArray])
        .call(barchart)
      function getFileNameIndex(fileName, fileInfoData) {
        var index = null
        for (var fI = 0; fI < fileInfoData.length; fI++) {
          if (fileName === fileInfoData[fI].name) {
            index = fI
            break
          }
        }
        return index
      }
    },
    //  展示histogram视图中的tip
    show_tip: function (d) {
      var self = this
      var currentDataSetName = Variables.get('currentDataSetName')
      if (currentDataSetName === Config.get('DataSetCollection')['LibraryTree_DailyName']) {
        //  当前为Library的数据集
        var barId = d.id
        if (barId.indexOf('-') !== -1) {
          var date = barId.split('-')[1].replaceAll('_', '/')
          var dayArray = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          var barValue = d.y
          var date = barId.split('-')[1].replaceAll('_', '-')
          var curDay = new Date(date).getDay()
          // var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + date + "/" + dayArray[curDay] + ", num: " + barValue + "</span></span>"
          var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + date + "/" + dayArray[curDay] + ", num: " + barValue + "</span></span>"
          histogramTip.show(tipValue, document.getElementById(barId))
        }
      } else if (currentDataSetName === Config.get('DataSetCollection')['NBATeamTreeName']) {
        //  当前是NBA的数据集
        var barId = d.id
        var barValue = d.y
        var yearRemoveTree = barId.replace('tree', '')
        var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + "year:" + yearRemoveTree + ", num: " + Math.round(barValue) + "</span></span>"
        histogramTip.show(tipValue, document.getElementById(barId))
      }
      //  如果存在比较高的tooltip移动了位置, 将类别变成d3-histogram-tip-flip; 需要先将d3-histogram-tip-flip变成d3-histogram-tip
      $('.d3-histogram-tip-flip').removeClass('d3-histogram-tip-flip').addClass('d3-histogram-tip')
      flipTooltipLeft()
      flipTooltipRight()
      flipTooltipTop()
      function flipTooltipLeft() {
        var d3TipLeft = $(".d3-histogram-tip").position().left
        //  柱状图视图的宽度
        var divWidth = $('#histogram-main-panel').width()
        if (d3TipLeft < 0) {
          var tipLeft = d3TipLeft - 10
          $('#tip-content').css({left: -tipLeft});
        }
      }

      function flipTooltipRight() {
        var d3TipLeft = $(".d3-histogram-tip").position().left
        var d3TipWidth = $('#tip-content').width()
        //  柱状图视图的宽度
        var divWidth = $('#histogram-main-panel').width()
        if ((d3TipLeft + d3TipWidth) > divWidth) {
          var tipDivLeft = (d3TipLeft + d3TipWidth) - divWidth
          $('#tip-content').css({left: -tipDivLeft});
        }
      }

      function flipTooltipTop() {
        var navbarHeight = Config.get('NAVBAR_HEIGHT')
        var tooltipTriangleHeight = Config.get('TOOLTIP_TRIANGLE_HEIGHT')
        var tooltipHeight = $(".d3-histogram-tip").height() //Config.get('TOOLTIP_HEIGHT')
        var d3TipTop = $(".d3-histogram-tip").position().top
        var d3TipBottom = d3TipTop + tooltipHeight
        if (d3TipTop < navbarHeight) {
          $('.d3-histogram-tip').css({top: d3TipBottom + tooltipTriangleHeight * 2})
          $('.d3-histogram-tip').removeClass('d3-histogram-tip').addClass('d3-histogram-tip-flip')
        }
      }
    },
    //  click的时候发生的事件
    selectBarItem: function (barId) {
      var self = this
      var selectedItemArray = [barId]
      self.requestData(selectedItemArray)
      self.trigger_update_selection_list()
    },
    //  brush之后对于brush范围内的节点进行高亮
    prehighlightBar: function (barId) {
      var self = this
      self.d3el.select('#' + barId).classed('pre-click-highlight', true)
      self.d3el.select('#' + barId).classed('unchanged-pre-click-highlight', true)
      if (!self.d3el.select('#' + barId).classed('click-highlight')) {
        self.d3el.select('#' + barId).classed('click-unhighlight', true)
      }
    },
    //  在clickhighlight的节点为空时, 清空所有的click unhighlight的节点
    remove_all_click_unhighlight: function () {
      var self = this
      if (self.d3el.selectAll('.click-highlight').empty()) {
        self.d3el.selectAll('.library-bar').classed('click-unhighlight', false)
      }
    },
    //  取消对于上方histogram中选中的bar的高亮
    unhighlightBar: function (barId) {
      var self = this
      self.d3el.select('#' + barId).classed('click-highlight', false)
      self.d3el.select('#' + barId).classed('pre-click-highlight', false)
      self.d3el.select('#' + barId).classed('unchanged-pre-click-highlight', true)
      self.d3el.select('#' + barId).classed('click-unhighlight', true)
      self.d3el.select('#' + barId).style('fill', null)
    },
    //  对于histogram中的节点高亮
    highlightBar: function (barId) {
      var self = this
      self.d3el.select('#' + barId).classed('click-unhighlight', false)
      self.d3el.select('#' + barId).classed('click-highlight', true)
    },
    //  unclick的时候发生的事件
    unSelectGroupBarItem: function (barId) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      barcodeCollection.remove_item_and_model(barId)
      barcodeCollection.update_after_remove_models()
      barcodeCollection.update_data_all_view()
    },
    //  unclick的时候发生的事件
    unSelectBarItem: function (barIdArray) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var selectItemNameArray = Variables.get('selectItemNameArray')
      for (var bI = 0; bI < barIdArray.length; bI++) {
        var barId = barIdArray[bI]
        barcodeCollection.remove_item_and_model(barId)
        selectItemNameArray.splice(selectItemNameArray.indexOf(barId), 1)
      }
      self.trigger_update_selection_list()
      window.Variables.update_barcode_attr()
      barcodeCollection.update_after_remove_models()
      //  传递信号, 在服务器端更新dataCenter删除选中的item数组, 进而更新superTree
      window.Datacenter.request_remove_item(barIdArray)
    },
    //  取消某一个histogram中的bar的高亮
    cancel_selection_highlight: function (barId) {
      var self = this
      self.d3el.select('#' + barId)
        .classed('click-highlight', false)
        .classed('pre-click-highlight', false)
        .classed('click-unhighlight', true)
    },
    //  从dataCenter中请求数据
    requestData: function (selectedItemsArray) {
      var self = this
      var selectItemNameArray = Variables.get('selectItemNameArray')
      for (var sI = 0; sI < selectedItemsArray.length; sI++) {
        if (selectItemNameArray.indexOf(selectedItemsArray[sI]) === -1) {
          selectItemNameArray.push(selectedItemsArray[sI])
        }
      }
      //  在获取新的barcodeTree时, 需要将当前的模式变成original
      if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        Variables.set('displayMode', Config.get('CONSTANT').ORIGINAL)
      }
      window.Variables.update_barcode_attr()
      var displayMode = Variables.get('displayMode')
      window.Datacenter.requestDataCenter(selectedItemsArray)
      window.request_barcode_time_histogram435 = new Date()
    },
    //  点击brush上面的确认按钮, 表示选中brush的部分
    brushSelectionItems: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var highlightNum = d3.select(self.el).selectAll('.library-bar.pre-click-highlight')[0].length - 1
      var selectedItemsArray = []
      var allSelectedItemsArray = []
      var existedSelectItemNameArray = Variables.get('selectItemNameArray')
      var selectedItemColorObj = {}
      d3.select(self.el).selectAll('.library-bar.pre-click-highlight')
        .each(function (d, i) {
          var itemId = d3.select(this).attr('id')
          if (existedSelectItemNameArray.indexOf(itemId) === -1) {
            selectedItemsArray.push(itemId)
          }
          allSelectedItemsArray.push(itemId)
          var selectionColor = Variables.get('selectionColor')
          console.log('selectionColor', selectionColor)
          if (selectionColor != null) {
            d3.select(this).style('fill', selectionColor)
            barcodeCollection.update_barcode_model_color(allSelectedItemsArray, selectionColor)
          }
          d3.select(this).classed('click-unhighlight', false)
          d3.select(this).classed('click-highlight', true)
          var color = d3.select(this).style('fill')
          //  808080是原始的barcode的背景颜色
          if (color !== 'rgb(128, 128, 128)') {
            selectedItemColorObj[itemId] = color
          }
        })
      Variables.set('selectedItemColorObj', selectedItemColorObj)
      self.requestData(selectedItemsArray)
      self.trigger_update_selection_list()
      //  在brush完成之后, 将Variable中的selectionColor设置为null
      // Variables.set('selectionColor', null)
      // $('#color-picker').css('background-color', 'white')

      // d3.select(self.el).selectAll('.library-bar.pre-click-highlight')
      //   .classed('pre-click-highlight', false)
      // self.clear_brush_range_rect()
      // var selectItemNameArray = Variables.get('selectItemNameArray')
    },
    //  点击brush上面的删除按钮, 表示删除选中brush的部分
    brushUnSelectionItems: function () {
      var self = this
      var unselectedItemsArray = []
      d3.select(self.el).selectAll('.library-bar.pre-click-highlight')
        .each(function (d, i) {
          var itemId = d3.select(this).attr('id')
          unselectedItemsArray.push(itemId)
          d3.select(this).classed('click-unhighlight', true)
          d3.select(this).classed('click-highlight', false)
          d3.select(this).style('fill', null)
        })
      self.unSelectBarItem(unselectedItemsArray)
      d3.select(self.el).selectAll('.library-bar.pre-click-highlight')
        .classed('pre-click-highlight', false)
      self.clear_brush_range_rect()
      self.trigger_update_selection_list()
      // var selectItemNameArray = Variables.get('selectItemNameArray')
    },
    /**
     * 按照histogram的位置更新在barchar中位置比较的衡量
     */
    update_histogram_comparison_loc_encode: function (sameNodeNumObj, differentNodeNumObj) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      self.d3el.selectAll('.comparison-loc').remove()
      var histogramHeight = self.histogramHeight
      var histogramDataArray = self.histogramDataArray
      var maxValue = d3.max(histogramDataArray, function (d) {
        return +d.y
      })
      var yScale = d3.scale.linear()
        .domain([0, maxValue])
        .range([histogramHeight, 0])
      var basedModel = barcodeCollection.get_based_model()
      var basedBarcodeTreeId = basedModel.get('barcodeTreeId')
      var basedModelNodeNum = sameNodeNumObj[basedBarcodeTreeId]
      var sameNodePercentageNodeNumObj = {}
      for (var sItem in sameNodeNumObj) {
        sameNodePercentageNodeNumObj[sItem] = differentNodeNumObj[sItem] / basedModelNodeNum
      }
      var basedBarcodeTreeHeight = +self.d3el.select('#' + basedBarcodeTreeId).attr('height')
      for (var selectItem in sameNodePercentageNodeNumObj) {
        var basedX = +self.d3el.select('#' + selectItem).attr('x')
        var basedWidth = +self.d3el.select('#' + selectItem).attr('width')
        var sameNodeNum = +sameNodePercentageNodeNumObj[selectItem]
        var comparisonLoc = basedBarcodeTreeHeight * sameNodeNum
        var basedCenter = basedX + basedWidth / 2
        self.d3el.select('.container')
          .append('rect')
          .attr('class', 'comparison-loc')
          .attr('x', basedX)
          .attr('width', basedWidth)
          .attr('y', histogramHeight - comparisonLoc)
          .attr('height', 2)
      }
      console.log('sameNodeNumObj', sameNodeNumObj)
    },
    /**
     * 按照相似度更新histogram视图中的颜色映射
     */
    update_histogram_color_encode: function (colorEncodingObj) {
      var self = this
      d3.selectAll('.library-bar').style('fill', null)
      for (var selectItem in colorEncodingObj) {
        self.d3el.select('#' + selectItem).style('fill', colorEncodingObj[selectItem])
      }
    },
    /**
     * 响应来自于barcode-view中的点击选中事件
     */
    unselect_histogram: function (barcodeTreeId) {
      var self = this
      self.d3el.select('#' + barcodeTreeId).classed('compare-based-selection', false)
      self.d3el.select('.container').selectAll('.compare-based-text').remove()
      self.d3el.select('.container')
        .select('.compare-based-rect')
        .attr('x', 0)
        .attr('width', 0)
    },
    /**
     * 取消选择当前所有的barcodeTree
     */
    set_unselect_all_histogram: function () {
      var self = this
      self.d3el.selectAll('.set-selection').each(function () {
        var barcodeTreeId = d3.select(this).attr('id')
        self.set_unselect_histogram(barcodeTreeId)
      })
      self.d3el.selectAll('.set-selection-text').remove()
    },
    /**
     * 响应来自于barcode-view的点击取消选中的事件
     * @param barcodeTreeId
     */
    set_unselect_histogram: function (barcodeTreeId) {
      var self = this
      self.d3el.select('#' + barcodeTreeId).classed('set-selection', false)
      self.d3el.select('.container').select('#' + barcodeTreeId + '-set-selection').remove()
    },
    /**
     * 响应来自于barcode-view中的点击选中事件作为几个操作元素的事件
     */
    set_select_histogram: function (barcodeTreeId) {
      var self = this
      self.d3el.select('#' + barcodeTreeId).classed('set-selection', true)
      var histogramHeight = self.histogramHeight
      if (self.d3el.select('#' + barcodeTreeId).empty()) {
        return
      }
      var barWidth = +self.d3el.select('#' + barcodeTreeId).attr('width')
      var barHeight = +self.d3el.select('#' + barcodeTreeId).attr('height')
      var barX = +self.d3el.select('#' + barcodeTreeId).attr('x')
      var centerX = barX + barWidth / 2
      var circleYPadding = 3
      var pinSize = barWidth * 2 / 3
      self.d3el.select('.container')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('class', 'set-selection-text')
        .attr('id', barcodeTreeId + '-set-selection')
        .attr('font-family', 'FontAwesome')
        .attr('x', centerX)
        .attr('y', histogramHeight - barHeight - circleYPadding - barWidth / 2)
        .attr('width', pinSize)
        .attr('height', pinSize)
        .text('\uf067')
    },
    /**
     * 响应来自于barcode-view中的点击取消选中事件
     */
    select_histogram: function (barcodeTreeId) {
      var self = this
      self.d3el.selectAll('.compare-based-selection').classed('compare-based-selection', false)
      self.d3el.select('.container').selectAll('.compare-based-text').remove()
      self.d3el.select('#' + barcodeTreeId).classed('compare-based-selection', true)
      var histogramHeight = self.histogramHeight
      if (!self.d3el.select('#' + barcodeTreeId).empty()) {
        var barWidth = +self.d3el.select('#' + barcodeTreeId).attr('width')
        var barHeight = +self.d3el.select('#' + barcodeTreeId).attr('height')
        var barX = +self.d3el.select('#' + barcodeTreeId).attr('x')
        var centerX = barX + barWidth / 2
        var circleYPadding = 3
        var pinSize = barWidth * 2 / 3
        self.d3el.select('.container')
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('cursor', 'pointer')
          .attr('class', 'compare-based-text')
          .attr('font-family', 'FontAwesome')
          .attr('x', centerX)
          .attr('y', histogramHeight - barHeight - circleYPadding - barWidth / 2)
          .attr('width', pinSize)
          .attr('height', pinSize)
          .text('\uf08d')
        self.d3el.select('.container')
          .select('.compare-based-rect')
          .attr('x', barX)
          .attr('width', barWidth)
      }
    },
    /**
     *  响应来自于barcode-view的hovering事件
     */
    hovering_barcode: function (barcodeTreeId) {
      var self = this
      var histogramModel = self.model
      var histogramDataObject = histogramModel.get('histogramDataObject')
      var barClass = histogramDataObject.className
      self.d3el.selectAll('.' + barClass).classed('hovering-highlight', false)
      self.d3el.select('#' + barcodeTreeId).classed('hovering-highlight', true)
      if (!self.d3el.select('#' + barcodeTreeId).empty()) {
        var barX = +self.d3el.select('#' + barcodeTreeId).attr('x')
        var barWidth = +self.d3el.select('#' + barcodeTreeId).attr('width')
        self.d3el.select('.container')
          .select('.hovering-rect')
          .attr('x', barX)
          .attr('width', barWidth)
        var histogramDataObj = self.histogramDataObj
        var nodeData = histogramDataObj[barcodeTreeId]
        if (typeof (nodeData.id) !== 'undefined') {
          // self.show_tip(nodeData)
          var tipValue = "<span id='tip-content-empty' style='position:relative;'><span id='vertical-center'></span></span>"
          histogramTip.show(tipValue, document.getElementById(barcodeTreeId))
          $('.d3-histogram-tip-flip').removeClass('d3-histogram-tip-flip').addClass('d3-histogram-tip')
        }
      }
    },
    /**
     *  响应来自于barcode-view的unhovering事件
     */
    unhovering_barcode: function () {
      var self = this
      self.d3el.selectAll('.hovering-highlight').classed('hovering-highlight', false)
      self.d3el.select('.container')
        .select('.hovering-rect')
        .attr('x', 0)
        .attr('width', 0)
      histogramTip.hide()
    },
    /*
     * 清空brush的范围的矩形
     */
    clear_brush_range_rect: function () {
      var self = this
      self.d3el.select('.extent').attr('x', 0).attr('y', 0).attr('width', 0)
    },
    //  在全部都取消选择时, 取消对于所有bar的高亮
    reset_bar_color: function () {
      var self = this
      self.d3el.selectAll('.library-bar').classed('click-unhighlight', false)
    },
    /**
     *  barchart提供用户接口,允许用户清空所有选择的barchart
     */
    clear_all_items: function () {
      var self = this
      //  删除barcode collection中所有的model
      var selectItemNameArray = Variables.get('selectItemNameArray')
      //  取消当前的高亮
      for (var sI = 0; sI < selectItemNameArray.length; sI++) {
        var barId = selectItemNameArray[sI]
        self.unhighlightBar(barId)
        self.unselect_histogram(barId)
      }
      self.reset_bar_color()
      //  重置barcode collection中的所有参数
      var barcodeCollection = self.options.barcodeCollection
      barcodeCollection.reset_all_barcode_collection_parameter()
      barcodeCollection.clear_all()
      //  上面的循环不能同时删除selectItemNameArray中的元素, 同时遍历;所以先按照selectItemNameArray中的元素删除, 然后进行遍历
      Variables.set('selectItemNameArray', [])
      //  清空brush的范围的矩形
      self.clear_brush_range_rect()
      //  关闭superTree视图
      self.trigger_close_supertree()
      //  更新distribution视图, 即直接清空distribution
      barcodeCollection.update_barcode_node_attr_array()
      self.trigger_update_distribution()
    }
  }, SVGBase))
})