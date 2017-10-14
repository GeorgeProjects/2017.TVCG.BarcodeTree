define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'config',
  'd3',
  'variables'
], function (require, Mn, _, Backbone, Config, d3, Variables) {
  'use strict'

  return Backbone.Model.extend({
    defaults: {
      sortLinkData: {},
      arcLinkDataObject: {}
    },
    initialize: function () {
    },
    trigger_render_arclink: function (dataSetName) {
      Backbone.Events.trigger('render-arclink', { dataSetName: dataSetName })
    },
    request_distance_matrix: function (dataSetName) {
      var self = this
      var serverAddress = Config.get('SERVER_ADDRESS')
      var serverPort = Config.get('SERVER_PORT')
      var arcLinkDataObject = self.get('arcLinkDataObject')
      // if (!arcLinkDataObject.hasOwnProperty(dataSetName)) {
      //   //  have not request this dataset before, then request data from server
      //   var formData = { 'DataSetName': dataSetName }
      //   var successFunc = function (response) {
      //     console.log('connect to server...')
      //   }
      //   // requestDataFromServer('POST', 'http://' + serverAddress + ':' + serverPort + '/distance_matrix', formData, successFunc, arcLinkDataObject)
      //   requestDataFromServer('POST', 'distance_matrix', formData, successFunc, arcLinkDataObject)
      //   //  构建histogram.model
      // } else {
      //   // have request this dataset before, then just render using the former dataset
      // }
      function requestDataFromServer (PostType, Url, formData, successPaperState, arcLinkDataObject) {
        if (PostType === 'GET') {
          var xmlhttp = null
          if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new window.XMLHttpRequest()
          } else {
            // code for IE6, IE5
            xmlhttp = new ActiveXObject('Microsoft.XMLHTTP')
          }
          xmlhttp.onreadystatechange = function () {
            // self.successPaperState(self);
            successPaperState()
          }
          xmlhttp.open(PostType, Url, true)
          xmlhttp.send(null)
        } else if (PostType === 'POST') {
          $.ajax({
            url: Url,
            type: 'POST',
            datatype: 'json',
            data: formData,
            crossDomain: true,
            success: function (result) {
              var dataSetName = formData.DataSetName
              self.preprocess_arc_data(result, dataSetName)
              self.trigger_render_arclink(dataSetName)
            },
            error: function (result) {
              console.log('error', result) // Optional
            }
          })
        }
      }
    },
    preprocess_arc_data: function (result, dataSetName) {
      var self = this
      var sortArclinkDataObject = {}
      for (var i = 0; i < result.length; i++) {
        result[ i ].fileName = result[ i ].fileName.replace('XX.json', '')
      }
      for (var j = 0; j < result.length; j++) {
        sortArclinkDataObject[ result[ j ].fileName ] = []
        var itemCount = 0
        for (var item in result[ j ]) {
          var linkObject = { 'fileName': result[ itemCount ].fileName, 'diffNum': result[ j ][ item ] }
          sortArclinkDataObject[ result[ j ].fileName ][ itemCount ] = linkObject
          if (item !== 'fileName') {
            itemCount = itemCount + 1
          }
        }
      }
      for (item in sortArclinkDataObject) {
        sortArclinkDataObject[ item ].sort(function (a, b) {
          return a.diffNum - b.diffNum
        })
      }
      var arclinkDataObject = self.get('arcLinkDataObject')
      arclinkDataObject[ dataSetName ] = sortArclinkDataObject
    }
    // load_arc_data: function (loadArcDataDefer) {
    //   var self = this
    //   var sortLinkData = self.get('sortLinkData')
    //   var filePath = 'sample1'
    //   var fileName = 'distance_matrix.csv'
    //   d3.csv('data/' + filePath + '/' + fileName, function (d) {
    //     for (var k = 0; k < d.length; k++) {
    //       d[ k ].fileName = d[ k ].fileName.replace('XX.csv', '')
    //     }
    //     for (var i = 0; i < d.length; i++) {
    //       sortLinkData[ d[ i ].fileName ] = []
    //       var jCount = 0
    //       for (var items in d[ i ]) {
    //         sortLinkData[ d[ i ].fileName ][ jCount ] = {}
    //         sortLinkData[ d[ i ].fileName ][ jCount ].filename = d[ jCount ].fileName
    //         sortLinkData[ d[ i ].fileName ][ jCount ].diffNum = +d[ i ][ items ]
    //         if (items !== 'fileName') {
    //           jCount = jCount + 1
    //         }
    //       }
    //     }
    //     for (items in sortLinkData) {
    //       sortLinkData[ items ].sort(function (a, b) {
    //         return a.diffNum - b.diffNum
    //       })
    //     }
    //     loadArcDataDefer.resolve()
    //   })
    // },
    // handle_histogram_attr: function () {}
  })
})
