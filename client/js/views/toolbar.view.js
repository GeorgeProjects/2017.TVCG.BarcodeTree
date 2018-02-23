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
    comparisonMode: 'Comparison',
    singleMode: 'Barcode|NodeLink',
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
      'click #nba-team-tree': 'request_nba_team_tree',
      'click #signal-tree': 'request_signal_tree',
      'click #original-mode': 'change_to_original_mode',
      'click #compact-mode': 'change_to_compact_mode',
      'click #single-tree': 'change_mode_to_singletree',
      'click #super-tree': 'change_mode_to_supertree',
      'click #mode-controller': 'change_display_mode',
      'click #upload-controller': 'upload_file'
    },
    initialize: function () {
      var self = this
      Backbone.Events.on(Config.get('EVENTS')['CHANGE_BARCODE_WIDTH'], function (event) {
        // self.set_barcode_widtharray()
        self.update_dataset_check_icon()
        self.update_barcode_mode()
        self.update_barcode_type()
      })
    },
    onShow: function () {
      var self = this
      // self.initComparisonSingleMode()
    },
    trigger_transition_original_to_compact: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['TRANSITON_ORIGINAL_TO_COMPACT'])
    },
    trigger_transition_compact_to_original: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['TRANSITON_COMPACT_TO_ORIGINAL'])
    },
    //  获取图书馆数据的函数
    request_library_record_tree: function () {
      var self = this
      $('.dataset-check-icon').css('visibility', 'hidden')
      $('#library-record-tree .dataset-check-icon').css('visibility', 'visible')
      Variables.set('currentDataSetName', Config.get('DataSetCollection')['LibraryTree_DailyName'])
      window.dataSetName = Config.get('DataSetCollection')['LibraryTree_DailyName']
      // Datacenter.start(viewWidth, viewHeight)
      Datacenter.request_histogram_dataset()
    },
    //  获取nba数据的函数
    request_nba_team_tree: function () {
      var self = this
      $('.dataset-check-icon').css('visibility', 'hidden')
      $('#nba-team-tree .dataset-check-icon').css('visibility', 'visible')
      Variables.set('currentDataSetName', Config.get('DataSetCollection')['NBATeamTreeName'])
      window.dataSetName = Config.get('DataSetCollection')['NBATeamTreeName']
      Datacenter.request_histogram_dataset()
    },
    initComparisonSingleMode: function () {
      var self = this
      var comparisonMode = self.comparisonMode
      var singleMode = self.singleMode
      var currentMode = $('#mode-controller').text()
      if (currentMode === comparisonMode) {
        $('#single-sample-file-open').css('display', 'none')
        $('#single-sample-file-upload').css('display', 'none')
      } else if (currentMode === singleMode) {
        $('#comparison-dataset-open').css('display', 'none')
        $('#comparison-display-mode-control').css('display', 'none')
      }
    },
    //  获取每天的借书数据
    request_daily_record_tree: function () {
      var self = this
      var DataSetCollection = Config.get('DataSetCollection')
      var dataSetName = DataSetCollection.LibraryTree_DailyName
      self.set_current_dataset(dataSetName)
    },
    // 获取每周的借书数据
    request_weekly_record_tree: function () {
      var self = this
      var DataSetCollection = Config.get('DataSetCollection')
      var dataSetName = DataSetCollection.LibraryTree_Name
      self.set_current_dataset(dataSetName)
    },
    //  barcode的控制 => 向server传递数据
    //  barcode背后的数据 => 向server请求数据
    request_signal_tree: function () {
      var self = this
      var DataSetCollection = Config.get('DataSetCollection')
      var dataSetName = DataSetCollection.SignalTree_Name
      self.set_current_dataset(dataSetName)
    },
    change_mode_to_singletree: function () {
      var barcodeType = 'single'
      Variables.set('barcodeCategory', barcodeType)
      $('.barcodetype-check-icon').css('visibility', 'hidden')
      $('#single').css('visibility', 'visible')
    },
    change_display_mode: function () {
      var self = this
      var comparisonMode = self.comparisonMode
      var singleMode = self.singleMode
      var currentMode = $('#mode-controller').text()
      if (currentMode === comparisonMode) {
        $('#mode-controller').text(singleMode)
        //  将comparison 模式下的视图设置为hidden
        $('#histogram-view').css('visibility', 'hidden')
        $('#barcode-view').css('visibility', 'hidden')
        //  将singleTree模式下的视图设置为visible
        $('#barcode-single-view').css('visibility', 'visible')
        document.getElementById("comparison-dataset-open").style.display = "none"
        document.getElementById("comparison-display-mode-control").style.display = "none"
        document.getElementById("single-sample-file-open").style.display = "block"
        document.getElementById("single-sample-file-upload").style.display = "block"
      } else if (currentMode === singleMode) {
        $('#mode-controller').text(comparisonMode)
        //  将comparison 模式下的视图设置为visible
        $('#histogram-view').css('visibility', 'visible')
        $('#barcode-view').css('visibility', 'visible')
        //  将singleTree模式下的视图设置为hidden
        document.getElementById("comparison-dataset-open").style.display = "block"
        document.getElementById("comparison-display-mode-control").style.display = "block"
        document.getElementById("single-sample-file-open").style.display = "none"
        document.getElementById("single-sample-file-upload").style.display = "none"
        $('#barcode-single-view').css('visibility', 'hidden')
      }
    },
    /**
     * 上传文件
     */
    upload_file: function () {
      var self = this
      $("#single-view-dialog").dialog({
        resizable: true,
        height: 200,
        width: 400,
        modal: true,
        buttons: {
          Cancel: function () {
            $(this).dialog("close");
          }
        }
      });
      document.getElementById('fileinput').addEventListener('change', function () {
        var treeObjArray = []
        var deferedArray = []
        for (var dI = 0; dI < this.files.length; dI++) {
          deferedArray[dI] = $.Deferred()
        }
        var superTreeRequestDefer = $.Deferred()
        //  在superTree获取之后获取每一个树的节点id的数组
        $.when(superTreeRequestDefer)
          .done(function () {
            var treeNodeIdArrayUrl = 'treeNodeIdArray'
            window.Datacenter.requestBarcodeNodeIdArray(treeNodeIdArrayUrl, treeObjArray)
          })
          .fail(function () {
            console.log("get the node id array")
          })
        //  在读取每一个文件的内容之后开始计算其superTree的对象
        $.when.apply($, deferedArray)
          .done(function () {
            var url = 'treeobject_to_nodelist'
            window.Datacenter.requestSuperTreeAndSuperBarcodeNodeArray(url, treeObjArray, superTreeRequestDefer)
            self.options.singleBarcodeModel.add_treeobj_array(treeObjArray)
          })
        for (var fI = 0; fI < this.files.length; fI++) {
          var file = this.files[fI]
          readFile(file, deferedArray, treeObjArray, fI)
        }
      }, false)
      function readFile(file, deferedArray, treeObjArray, fI) {
        if (file) {
          var reader = new FileReader()
          reader.readAsText(file, "UTF-8")
          reader.onload = function (evt) {
            var treeObjJsonText = evt.target.result
            var treeObj = JSON.parse(treeObjJsonText)
            treeObjArray.push(treeObj)
            deferedArray[fI].resolve()
            $("#single-view-dialog").dialog("close")
          }
          reader.onerror = function (evt) {
            document.getElementById("fileContents").innerHTML = "error reading file"
          }
        }
      }
    },
    change_mode_to_supertree: function () {
      var barcodeType = 'super'
      Variables.set('barcodeCategory', barcodeType)
      $('.barcodetype-check-icon').css('visibility', 'hidden')
      $('#super').css('visibility', 'visible')
    },
    //  设置当前的数据集,包括variable中的变量以及全局变量的数值
    set_current_dataset: function (dataSetName) {
      Variables.set('currentDataSetName', dataSetName)
      window.dataSetName = dataSetName
      $('.mode-check-icon').css('visibility', 'hidden')
      $('#' + barcodeMode).css('visibility', 'visible')
    },
    //  将barcode切换成原始模式
    change_to_original_mode: function () {
      var self = this
      var barcodeMode = 'original'
      self.set_current_mode(barcodeMode)
      self.trigger_transition_compact_to_original()
    },
    //  将barcode切换成压缩模式
    change_to_compact_mode: function () {
      var self = this
      var barcodeMode = 'compact'
      self.set_current_mode(barcodeMode)
      self.trigger_transition_original_to_compact()
    },
    /**
     * 设置当前barcode的mode
     * barcode的mode有两类, originalMode和compactMode
     */
    set_current_mode: function (barcodeMode) {
      Variables.set('barcodeMode', barcodeMode)
      window.barcodeMode = barcodeMode
      $('.mode-check-icon').css('visibility', 'hidden')
      $('#' + barcodeMode).css('visibility', 'visible')
    },
    /**
     * 初始化barcode的的宽度数组, 如何保证不同的层级之间的区分度,使用颜色会怎样,但是如果是10000层也会有问题, 无法分配
     */
    set_barcode_widtharray: function () {
      var self = this
      var maxBarcodeWidth = Variables.get('maxBarcodeWidth')
      var minBarcodeWidth = Variables.get('minBarcodeWidth')
      var histogramModel = self.model
      var histogramDataObject = histogramModel.get('histogramDataObject')
      var maxDepth = +histogramDataObject.maxDepth
      var interval = (maxBarcodeWidth - minBarcodeWidth) / (maxDepth - 1)
      var barcodeWidthArray = []
      for (var i0 = 0; i0 < maxDepth; i0++) {
        var barcodeWidth = maxBarcodeWidth - interval * i0
        barcodeWidthArray.push(barcodeWidth)
      }
      Variables.set('barcodeWidthArray', barcodeWidthArray)
    },
    /*
     * 在视图更新的时候会对于初始选择以及视图进行初始化
     * 当前barcode模式初始化
     */
    update_barcode_mode: function () {
      var barcodeMode = window.barcodeMode
      $('.mode-check-icon').css('visibility', 'hidden')
      $('#' + barcodeMode).css('visibility', 'visible')
    },
    /*
     * 在视图更新的时候会对于初始选择以及视图进行初始化
     * barcode的数据集初始化
     */
    update_dataset_check_icon: function () {
      var dataSetName = window.dataSetName
      $('.dataset-check-icon').css('visibility', 'hidden')
      $('#' + dataSetName).css('visibility', 'visible')
    },
    /*
     * 在视图更新的时候会对于初始选择以及视图进行初始化
     * barcod的类型初始化
     */
    update_barcode_type: function () {
      var barcodeCategory = Variables.get('barcodeCategory')
      $('.barcodetype-check-icon').css('visibility', 'hidden')
      $('#' + barcodeCategory).css('visibility', 'visible')
    }
  })
})
