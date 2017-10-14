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
      categoryNameObj: {}
    },
    initialize: function () {
    },
    request_category_dataset: function () {
      var self = this
      var dataSetName = Variables.get('currentDataSetName')
      if (dataSetName === Config.get('DataSetCollection').LibraryTree_DailyName) {
        var categoryNameObj = self.get('categoryNameObj')
        //  have not request this dataset before, then request data from server
        var formData = { 'DataSetName': Variables.get('currentDataSetName') }
        var successFunc = function (response) {
          console.log('connect to server...')
        }
        // requestDataFromServer('POST', 'http://' + serverAddress + ':' + serverPort + '/file_name', formData, successFunc, histogramDataObject)
        requestDataFromServer('POST', 'category_name', formData, successFunc, categoryNameObj)
        //  构建histogram.model
      }
      function requestDataFromServer (PostType, Url, formData, successPaperState, histogramDataObject) {
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
              categoryNameObj[ dataSetName ] = result
            },
            error: function (result) {
              console.log('error', result) // Optional
            }
          })
        }
      }
    }
  })
})
