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
      self.init_events()
      self.init_view()
    },
    init_events: function () {
      var self = this
      //  改变histogram中选中的bar的颜色
      Backbone.Events.on(Config.get('EVENTS')[ 'SET_PRECLICK_COLOR' ], function (event) {
        var color = event.color
        self.set_preclick_color(color)
      })
      //  在改变数据集的时候渲染histogram
      Backbone.Events.on(Config.get('EVENTS')[ 'RENDER_HISTOGRAM' ], function (event) {
        var dataSetName = event.dataSetName
        self.draw_histogram(dataSetName)
      })
      //  鼠标悬浮在barcode上面广播的事件
      Backbone.Events.on(Config.get('EVENTS')[ 'HOVERING_BARCODE_EVENT' ], function (event) {
        var barcodeTreeId = event.barcodeTreeId
        self.hovering_barcode(barcodeTreeId)
      })
      //  鼠标从barcode上面移开广播的事件
      Backbone.Events.on(Config.get('EVENTS')[ 'UN_HOVERING_BARCODE_EVENT' ], function (event) {
        var barcodeTreeId = event.barcodeTreeId
        self.unhovering_barcode(barcodeTreeId)
      })
      //  鼠标在comparisonview中点击选中barcode广播的事件
      Backbone.Events.on(Config.get('EVENTS')[ 'SELECT_BARCODE_EVENT' ], function (event) {
        var barcodeTreeId = event.barcodeTreeId
        self.select_histogram(barcodeTreeId)
      })
      //  鼠标在comparisonview中点击取消选中barcode广播的事件
      Backbone.Events.on(Config.get('EVENTS')[ 'UNSELECT_BARCODE_EVENT' ], function (event) {
        var barcodeTreeId = event.barcodeTreeId
        self.unselect_histogram(barcodeTreeId)
      })
      //
      Backbone.Events.on(Config.get('EVENTS')[ 'UPDATE_HISTOGRAM_ENCODE' ], function (event) {
        var colorEncodingObj = event.colorEncodingObj
        self.update_histogram_color_encode(colorEncodingObj)
      })
      //  用户点击clear all的按钮, 清空选中所有的element
      Backbone.Events.on(Config.get('EVENTS')[ 'CLEAR_ALL' ], function (event) {
        self.clear_all_items()
      })
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
      var margin = { top: 10, right: 10, bottom: 20, left: 30 }
      var histogramWidth = divWidth - margin.left - margin.right
      var histogramHeight = divHeight - margin.top - margin.bottom
      d3.select(self.el)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('id', 'histogram-g')
      d3.select(self.el)
        .append('g')
        .attr('transform', 'translate(' + (divWidth - margin.right) + ',' + margin.top + ')')
        .attr('id', 'control-g')
      self.draw_histogram(histogramWidth, histogramHeight, margin)
      var tip = window.tip
      self.d3el.call(tip)
    },
    set_preclick_color: function (color) {
      var self = this
      var selectElements = self.d3el.selectAll('.pre-click-highlight')[ 0 ]
      for (var sI = 0; sI < selectElements.length; sI++) {
        d3.select(selectElements[ sI ]).style('fill', color)
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
      var barcodeCollection = self.options.barcodeCollection
      var histogramDataObject = histogramModel.get('histogramDataObject')
      var barClass = histogramDataObject.className
      var fileInfoData = histogramDataObject.fileInfo
      var histogramDataArray = []
      for (var hI = 0; hI < fileInfoData.length; hI++) {
        histogramDataArray[ hI ] = {}
        histogramDataArray[ hI ].x1 = hI
        histogramDataArray[ hI ].x2 = hI + 1
        if (histogramDataObject.scaleType === 'log') {
          histogramDataArray[ hI ].y = Math.log(fileInfoData[ hI ][ 'num' ])
        } else {
          histogramDataArray[ hI ].y = fileInfoData[ hI ][ 'num' ]
        }
        histogramDataArray[ hI ].id = fileInfoData[ hI ][ 'name' ]
        if (typeof (histogramDataArray[ hI ].id) === 'undefined') {
          console.log('name', fileInfoData[ hI ][ 'name' ])
        }
      }
      var yTicksValueArray = histogramDataObject.yTicksValueArray
      if (histogramDataObject.scaleType === 'log') {
        for (var yI = 0; yI < yTicksValueArray.length; yI++) {
          yTicksValueArray[ yI ] = Math.log(yTicksValueArray[ yI ])
        }
      }
      var yTicksFormatArray = histogramDataObject.yTicksFormatArray
      var xTicksValueArray = histogramDataObject.xTicksValueArray
      var xTicksFormatArray = histogramDataObject.xTicksFormatArray
      /**
       * brushend 方法在brush结束之后显示icon list
       */
      var brushend = function () {
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
        for (var i = 0; i < 7; ++i) {
          var day = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ]
          icons.push({
            title: day[ i ],
            text: day[ i ][ 0 ],
            id: day[ i ],
            activeClass: 'active',
            day: i,
            click: function () {
              var btn_day = this.day
              var selectionArray = []
              if (d3.select('#' + day[ this.day ]).classed('active')) {
                d3.select(self.el).selectAll('.library-bar.unchanged-pre-click-highlight')
                  .each(function (d, i) {
                    var id = d3.select(this).attr('id')
                    if (typeof(id) !== 'undefined') {
                      var date = id.split('-')[ 1 ].replaceAll('_', '-')
                      var cur_day = new Date(date).getDay()
                      if (cur_day == btn_day) {
                        d3.select(this)
                          .classed('pre-click-highlight', false)
                        d3.select(this).style('fill', null)
                      }
                    }
                  })
                d3.select('#' + day[ this.day ]).classed('active', false)
              } else if (!d3.select('#' + day[ this.day ]).classed('active')) {
                d3.select(self.el).selectAll('.library-bar.unchanged-pre-click-highlight')
                  .each(function (d, i) {
                    var id = d3.select(this).attr('id')
                    if (typeof(id) !== 'undefined') {
                      var date = id.split('-')[ 1 ].replaceAll('_', '-')
                      var cur_day = new Date(date).getDay()
                      if (cur_day == btn_day) {
                        d3.select(this)
                          .classed('pre-click-highlight', true)
                      }
                    }
                  })
                d3.select('#' + day[ this.day ]).classed('active', true)
              }
            }
          })
        }
        icons.push({
          icon: 'fa-eyedropper',
          title: 'color',
          activeClass: 'active',
          click: function () {
            console.log('show color palette')
          }
        })
        var d3_extent = d3.select(self.el).select('.extent')
        var jquery_extent = $('.extent')
        if (jquery_extent.data('d3_menu') === undefined) {
          jquery_extent.d3_menu().icons(icons).target(d3_extent)
          d3_extent.call(jquery_extent.d3_menu())
        }
      }
      //  brush的范围发生移动或者大小改变,需要将所有的button设置为active的状态
      var brushmove = function () {
        var day = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ]
        for (var dI = 0; dI < day.length; dI++) {
          d3.select('#' + day[ dI ]).classed('active', true)
        }
        d3.select('#confirmation').classed('active', false)
      }

      //  click的时候发生的事件
      var selectBarItem = function (barId, isUpdate) {
        var selectedItemArray = [ barId ]
        self.requestData(selectedItemArray)
      }

      //  unclick的时候发生的事件
      var unSelectBarItem = function (barId) {
        var selectItemNameArray = Variables.get('selectItemNameArray')
        var itemIndex = selectItemNameArray.indexOf(barId)
        selectItemNameArray.splice(itemIndex, 1)
        barcodeCollection.remove_barcode_dataset(barId)
        // window.Variables.update_barcode_attr()
        // barcodeCollection.update_barcode_height()
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
        .yLabel('#log(num)')
        .bar_interval(0.5)
        .brush_trigger(function (d3_event, brushed_bar_selection) {
          brushend()
          console.log('histogram brushend')
        })
        .brushmove_trigger(function () {
          brushmove()
          console.log('histogram brushmove')
        })
        .hovering_trigger(function (d) {
          var barId = d.id
          var date = barId.split('-')[ 1 ].replaceAll('_', '/')
          var dayArray = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ]
          var barValue = d.y
          Backbone.Events.trigger(Config.get('EVENTS')[ 'HOVERING_BARCODE_EVENT' ], {
            'barcodeTreeId': barId
          })
          var date = barId.split('-')[ 1 ].replaceAll('_', '-')
          var curDay = new Date(date).getDay()
          var tipValue = "date:<span style='color:red'>" + date + "</span>" + ",value:<span style='color:red'>" + barValue + "</span>"
            + ",Day:<span style='color:red'>" + dayArray[ curDay ] + "</span>"
          tip.show(tipValue)
        })
        .unhovering_trigger(function (d) {
          var barcodeId = d.id
          Backbone.Events.trigger(Config.get('EVENTS')[ 'UN_HOVERING_BARCODE_EVENT' ], {
            'barcodeTreeId': barcodeId
          })
          tip.hide()
        })
      self.barchart = barchart
      console.log('histogram-view', histogramDataArray)
      d3.select(self.el)
        .data([ histogramDataArray ])
        .call(barchart)

      function getFileNameIndex (fileName, fileInfoData) {
        var index = null
        for (var fI = 0; fI < fileInfoData.length; fI++) {
          if (fileName === fileInfoData[ fI ].name) {
            index = fI
            break
          }
        }
        return index
      }
    },
    requestData: function (selectedItemsArray) {
      var selectItemNameArray = Variables.get('selectItemNameArray')
      for (var sI = 0; sI < selectedItemsArray.length; sI++) {
        if (selectItemNameArray.indexOf(selectedItemsArray[ sI ]) === -1) {
          selectItemNameArray.push(selectedItemsArray[ sI ])
        }
      }
      // window.Variables.update_barcode_attr()
      var url = 'barcode_original_data'
      var displayMode = Variables.get('displayMode')
      if (displayMode === Config.get('CONSTANT')[ 'ORIGINAL' ]) {
        url = 'barcode_original_data'
        window.Datacenter.requestDataCenter(url, selectedItemsArray)
      } else if (displayMode === Config.get('CONSTANT')[ 'COMPACT' ]) {
        url = 'barcode_compact_data'
        window.Datacenter.requestCompactData(url, selectedItemsArray)
      }
    },
    //  点击brush上面的确认按钮, 表示选中brush的部分
    brushSelectionItems: function () {
      var self = this
      var highlightNum = d3.select(self.el).selectAll('.library-bar.pre-click-highlight')[ 0 ].length - 1
      Backbone.Events.trigger(Config.get('EVENTS')[ 'SHOW_LOADING_ICON' ])
      var selectedItemsArray = []
      var selectedItemColorObj = {}
      d3.select(self.el).selectAll('.library-bar.pre-click-highlight')
        .each(function (d, i) {
          var itemId = d3.select(this).attr('id')
          selectedItemsArray.push(itemId)
          d3.select(this).classed('click-unhighlight', false)
          d3.select(this).classed('click-highlight', true)
          var color = d3.select(this).style('fill')
          //  808080是原始的barcode的背景颜色
          if (color !== 'rgb(128, 128, 128)') {
            selectedItemColorObj[ itemId ] = color
          }
        })
      Variables.set('selectedItemColorObj', selectedItemColorObj)
      self.requestData(selectedItemsArray)
      d3.select(self.el).selectAll('.library-bar.pre-click-highlight')
        .classed('pre-click-highlight', false)
      // var selectItemNameArray = Variables.get('selectItemNameArray')
    },
    /**
     * 按照相似度更新histogram视图中的颜色映射
     */
    update_histogram_color_encode: function (colorEncodingObj) {
      var self = this
      d3.selectAll('.library-bar').style('fill', null)
      for (var selectItem in colorEncodingObj) {
        self.d3el.select('#' + selectItem).style('fill', colorEncodingObj[ selectItem ])
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
    },
    /**
     * 响应来自于barcode-view中的点击选中事件
     */
    unselect_histogram: function (barcodeTreeId) {
      var self = this
      self.d3el.select('#' + barcodeTreeId).classed('compare-based-selection', false)
    },
    /**
     * 响应来自于barcode-view中的点击取消选中事件
     */
    select_histogram: function (barcodeTreeId) {
      var self = this
      self.d3el.selectAll('.compare-based-selection').classed('compare-based-selection', false)
      self.d3el.select('#' + barcodeTreeId).classed('compare-based-selection', true)
    },
    /**
     *  响应来自于barcode-view的unhovering事件
     */
    unhovering_barcode: function (barcodeTreeId) {
      var self = this
      self.d3el.select('#' + barcodeTreeId).classed('hovering-highlight', false)
    },
    /**
     *  barchart提供用户接口,允许用户清空所有选择的barchart
     */
    clear_all_items: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      self.barchart.clear_all(self.el)
      Variables.set('selectItemNameArray', [])
      barcodeCollection.clear_barcode_dataset()
    }
  }, SVGBase))
})