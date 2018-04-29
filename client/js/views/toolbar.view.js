define([
  'require',
  'marionette',
  'underscore',
  'jquery',
  'jquery-ui',
  'backbone',
  'datacenter',
  'config',
  'variables',
  'bootstrap-slider',
  'views/svg-base.addon',
  'text!templates/toolbar.tpl'
], function (require, Mn, _, $, jqueryUI, Backbone, Datacenter, Config, Variables, bootstrapSlider, SVGBase, Tpl) {
  'user strict'

  return Mn.LayoutView.extend({
    tagName: 'div',
    attributes: {
      'style': 'width:100%; height: 100%',
      'id': 'toolbar-view-div'
    },
    template: function () {
      return _.template(Tpl)
    },
    events: {
      //  在toolbar中更换数据集的函数
      'click #library-record-tree': 'request_library_record_tree',
      'click #nba-team-tree': 'request_nba_team_tree'
    },
    initialize: function () {
      var self = this
    },
    onShow: function () {
      var self = this
      var currentDataSetName = window.dataSetName
      $('.dataset-selection-icon').css('visibility', 'hidden')
      if (currentDataSetName === Config.get('DataSetCollection')['LibraryTree_DailyName']) {
        $('#library-record-tree-check-icon').css('visibility', 'visible')
      } else if (currentDataSetName === Config.get('DataSetCollection')['NBATeamTreeName']) {
        $('#nba-team-tree-check-icon').css('visibility', 'visible')
      }
    },
    //  获取图书馆数据的函数
    request_library_record_tree: function () {
      var self = this
      $('.dataset-selection-icon').css('visibility', 'hidden')
      $('#library-record-tree-check-icon').css('visibility', 'visible')
      Variables.set('currentDataSetName', Config.get('DataSetCollection')['LibraryTree_DailyName'])
      window.dataSetName = Config.get('DataSetCollection')['LibraryTree_DailyName']
      // Datacenter.start(viewWidth, viewHeight)
      Datacenter.request_histogram_dataset()
    },
    //  获取nba数据的函数
    request_nba_team_tree: function () {
      var self = this
      $('.dataset-selection-icon').css('visibility', 'hidden')
      $('#nba-team-tree-check-icon').css('visibility', 'visible')
      Variables.set('currentDataSetName', Config.get('DataSetCollection')['NBATeamTreeName'])
      window.dataSetName = Config.get('DataSetCollection')['NBATeamTreeName']
      Datacenter.request_histogram_dataset()
    },
  })
})
