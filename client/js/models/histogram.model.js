/**
 * [created by guozheng Li 2017/2/10]
 * @param  {[type]} BasicDataModel       [description]
 * @return {[type]}                      [description]
 */
define([
  'require',
  'marionette',
  'underscore',
  'config',
  'backbone',
  'variables',
  'd3'
], function (require, Mn, _, Config, Backbone, Variables, d3) {
  'use strict'

  return Backbone.Model.extend({
    defaults: {
      'histogramDataObject': {},
    },
    initialize: function () {
    },
    trigger_render_signal: function () {
      // trigger出的信号所表示的含义是已经完成了对于histogram数据的准备, 接下来app.view中开始调用render_histogram_view进行渲染
      Backbone.Events.trigger(Config.get('EVENTS')['BEGIN_RENDER_HISTOGRAM_VIEW'])
    },
    // request_histogram_dataset: function () {
    //   var self = this
    //   var dataSetName = Variables.get('currentDataSetName')
    //   var formData = { 'DataSetName': dataSetName }
    //   var successFunc = function (response) {
    //     console.log('connect to server...')
    //   }
    //   requestDataFromServer('POST', 'file_name', formData, successFunc)
    //   function requestDataFromServer (PostType, Url, formData, successPaperState) {
    //     if (PostType === 'GET') {
    //       var xmlhttp = null
    //       if (window.XMLHttpRequest) {
    //         // code for IE7+, Firefox, Chrome, Opera, Safari
    //         xmlhttp = new window.XMLHttpRequest()
    //       } else {
    //         // code for IE6, IE5
    //         xmlhttp = new ActiveXObject('Microsoft.XMLHTTP')
    //       }
    //       xmlhttp.onreadystatechange = function () {
    //         successPaperState()
    //       }
    //       xmlhttp.open(PostType, Url, true)
    //       xmlhttp.send(null)
    //     } else if (PostType === 'POST') {
    //       $.ajax({
    //         url: Url,
    //         type: 'POST',
    //         datatype: 'json',
    //         data: formData,
    //         crossDomain: true,
    //         success: function (result) {
    //           result.fileInfo = self.sort_higtogram_array_accord_time(result.fileInfo)
    //           result.minValue = self.get_min_value(result.fileInfo)
    //           result.maxValue = self.get_max_value(result.fileInfo)
    //           //  TODO 这个地方会修改成按照文件里面的属性决定scale的类型
    //           result.scaleType = 'log'
    //           //  y轴上的标注
    //           result.yTicksValueArray = [100, 1000, result.maxValue]
    //           result.yTicksFormatArray = ['0.1k', '1k', '6k']
    //           //  x轴上的标注
    //           result.xTicksValueArray = [5, 36, 66, 98, 128, 159, 189, 220, 252, 283]
    //           result.xTicksFormatArray = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
    //           result.className = 'barcodetree-class'
    //           //  设置读取数据的相应属性, maxDepth - 树的最大深度, fileInfo - 树的基本信息
    //           self.set('histogramDataObject', result)
    //           Variables.set('maxDepth', result.maxDepth)
    //           //  trigger 渲染histogram的信号, histogram-main视图中会渲染得到相应的结果
    //           self.trigger_render_signal()
    //         },
    //         error: function (result) {
    //           console.log('error', result) // Optional
    //         }
    //       })
    //     }
    //   }
    // },
    /**
     * 对于内部元素是文件名的histogram array进行排序
     * @param selectionBarArray: [
     *  { name: "recordTree-2015_07_15-2015_07_15", num: 109 },
     *  ......
     * ]
     */
    sort_higtogram_array_accord_time: function (selectionBarArray) {
      selectionBarArray.sort(function (a, b) {
        var dateIntA = transformFileNameToDate(a.name)
        var dateIntB = transformFileNameToDate(b.name)
        return dateIntA - dateIntB
      })
      return selectionBarArray
      /**
       * 将文件名称转换为文件名的数字
       * @param fileName, 读取的文件名称, sample: recordTree-2015_07_06-2015_07_06
       */
      function transformFileNameToDate(fileName) {
        var currentDataSetName = Variables.get('currentDataSetName')
        if (currentDataSetName === Config.get('DataSetCollection')['LibraryTree_DailyName']) {
          return libraryTreeTransform(fileName)
        } else if (currentDataSetName === Config.get('DataSetCollection')['NBATeamTreeName']) {
          return NBATreeTransfrom(fileName)
        }
        //  对于图书馆的树的转换函数
        function libraryTreeTransform(fileName) {
          var date = fileName.split('-')[1]
          var dateInt = +(date.replace('_', '').replace('_', ''))
          return dateInt
        }

        //  对于NBA的树的转换函数
        function NBATreeTransfrom(fileName) {
          var yearStr = fileName.replace('tree', '')
          var yearInt = +yearStr
          return yearInt
        }
      }
    },
    /**
     * 获取fileInfo的minValue
     * @param selectionBarArray: [
     *  { name: "recordTree-2015_07_15-2015_07_15", num: 109 },
     *  ......
     * ]
     */
    get_min_value: function (selectionBarArray) {
      var minValue = d3.min(selectionBarArray, function (d) {
        return d.num
      })
      return minValue
    },
    /**
     *  获取fileInfo的maxValue
     *  @param selectionBarArray: [
     *  { name: "recordTree-2015_07_15-2015_07_15", num: 109 },
     *  ......
     * ]
     */
    get_max_value: function (selectionBarArray) {
      var maxValue = d3.max(selectionBarArray, function (d) {
        return d.num
      })
      return maxValue
    },
    /**
     * y轴上的标注
     */
    get_y_ticks_value: function (maxValue, scaleType) {
      //  确定了tick的数量为5, 下面就是确定tick的间隔, 而且我们需要保证tick为整数, 整十数, 或者整百数
      if (scaleType === 'linear') {
        var ticksNum = 5
        var averageNum = maxValue / ticksNum
        if (averageNum < 10) {
          //  ticks是整数, 将averageNum变到最近的整数上
          averageNum = Math.round(averageNum)
        } else if ((averageNum > 10) && (averageNum < 100)) {
          //  ticks是整十数, 将averageNum变到最近的整十数上
          averageNum = Math.round(averageNum / 10) * 10
        } else if (averageNum > 100) {
          //  ticks是整百数, 将averageNum变到最近的整百数上
          averageNum = Math.round(averageNum / 100) * 100
        }
        var yTicksValueArray = []
        for (var hI = 1; hI < ticksNum; hI++) {
          yTicksValueArray.push(hI * averageNum)
        }
        return yTicksValueArray
      } else if (scaleType === 'log') {
        var yTicksValueArray = [10, 100, 1000]
        return yTicksValueArray
      }
    },
    /**
     *  x轴上的标注的对象
     */
    get_x_ticks_object: function () {
      var currentDataSetName = Variables.get('currentDataSetName')
      if (currentDataSetName === Config.get('DataSetCollection')['LibraryTree_DailyName']) {
        var xTicksObject = {
          xTicksValueArray:  [6, 37, 67, 98, 128, 157, 185, 215, 246, 273],
          xTicksFormatArray: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
        }
        return xTicksObject
      } else if (currentDataSetName === Config.get('DataSetCollection')['NBATeamTreeName']) {
        var xTicksObject = {
          xTicksValueArray: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
          xTicksFormatArray: ['1950', '1955', '1960', '1965', '1970', '1975', '1980', '1985', '1990', '1995', '2000', '2005', '2010', '2015']
        }
        return xTicksObject
      }
    }
  })
})
