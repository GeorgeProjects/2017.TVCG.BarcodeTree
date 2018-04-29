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
    /**
     * 根据从服务器端读取的histogram的数据更新histogram model
     */
    handle_histogram_data: function (histogram_result) {
      var self = this
      var histogramResult = histogram_result
      //  对于result中的fileInfo进行排序
      histogramResult.fileInfo = self.sort_higtogram_array_accord_time(histogramResult.fileInfo)
      //  获得数据集中的最小值
      histogramResult.minValue = self.get_min_value(histogramResult.fileInfo)
      //  获取数据集中的最大值
      histogramResult.maxValue = self.get_max_value(histogramResult.fileInfo)
      histogramResult.scaleType = 'linear'
      histogramResult.yTicksValueArray = self.get_y_ticks_value(histogramResult.maxValue, histogramResult.scaleType) //[ 100, 1000, result.maxValue ]
      histogramResult.yTicksFormatArray = JSON.parse(JSON.stringify(histogramResult.yTicksValueArray))//[ '0.1k', '1k', '6k' ]
      //  x轴上的标注
      histogramResult.xTicksValueArray = self.get_x_ticks_object().xTicksValueArray
      histogramResult.xTicksFormatArray = self.get_x_ticks_object().xTicksFormatArray
      histogramResult.className = 'barcodetree-class'
      //  更新barcode选定的层级以及层级的宽度
      Variables.set('fileMaxDepth', histogramResult.maxDepth)  //默认的情况下显示4层的barcodeTree
      //  更新histogramModel中的对应数据, histogramResult目的是绘制histogram视图
      self.set('histogramDataObject', histogramResult)
    },
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
        for (var hI = 1; hI <= ticksNum; hI++) {
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
          xTicksValueArray: [0, 28, 57, 88, 118, 149, 179, 210, 241, 271, 302, 332, 352, 381, 409, 440, 469, 499, 529, 559, 590, 620, 651, 681, 703, 733],
          xTicksFormatArray: ['2016 Jan', 'Febr', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', '2017 Jan', 'Febr', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', '2018 Jan', 'Febr']
        }
        return xTicksObject
      } else if (currentDataSetName === Config.get('DataSetCollection')['NBATeamTreeName']) {
        var xTicksObject = {
          xTicksValueArray: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
          xTicksFormatArray: ['1950', '1955', '1960', '1965', '1970', '1975', '1980', '1985', '1990', '1995', '2000', '2005', '2010', '2015']
        }
        return xTicksObject
      }
      // else if (currentDataSetName === Config.get('DataSetCollection')['LibraryRecordTree']) {
      //   var xTicksObject = {
      //     xTicksValueArray: [6, 37, 67, 98, 128, 157, 185, 215, 246, 273],
      //     xTicksFormatArray: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
      //   }
      //   return xTicksObject
      // }
    }
  })
})
