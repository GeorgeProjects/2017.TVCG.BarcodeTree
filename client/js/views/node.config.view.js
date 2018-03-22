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
  'text!templates/nodeConfig.tpl'
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
    },
    onShow: function () {
      var self = this
      self.render_barcode_node_config_view()
      //  初始化消息的视图
      self.init_event()
    },
    init_event: function () {
      var self = this
      Backbone.Events.on(Config.get('EVENTS')['UPDATE_BARCODE_PARAMETERS'], function (event) {
        self.update_barcode_parameters()
      })
      Backbone.Events.on(Config.get('EVENTS')['UPDATE_SELECTED_LEVELS'], function (event) {
        self.render_barcode_node_config_view()
      })
      self.listenTo(Variables, 'change:barcodeHeight', self.update_height_slider_value)
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
    update_barcode_parameters: function () {
      var self = this
      var barcodeWidthArray = window.barcodeWidthArray
      for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
        self.update_width_sldier_value(bI, barcodeWidthArray[bI])
      }
      var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
      self.update_interval_sldier_value(barcodeNodeInterval)
    },
    //  更新slider的value数值
    update_height_slider_value: function () {
      var height = window.barcodeHeight
      $("#height-handler").text(height)
      $('#height-control-slider').slider('value', height)
    },
    update_width_sldier_value: function (level, width) {
      $("#level" + level + "-handler").text(width)
      $("#level" + level + "-control-slider").slider('value', width)
    },
    update_interval_sldier_value: function (interval) {
      $("#interval-handler").text(interval)
      $("#interval-control-slider").slider('value', interval)
    },
    //  渲染barcode节点的配置视图
    render_barcode_node_config_view: function () {
      var self = this
      $('#barcode-node-config #config-minimize').on('mouseover', function () {
        $('#barcode-node-config #config-minimize').css({'-webkit-text-fill-color': 'black'})
      })
      $('#barcode-node-config #config-minimize').on('mouseout', function () {
        $('#barcode-node-config #config-minimize').css({'-webkit-text-fill-color': '#aaa'})
      })
      $('#barcode-node-config #config-close').on('mouseover', function () {
        $('#barcode-node-config #config-close').css({'-webkit-text-fill-color': 'red'})
      })
      $('#barcode-node-config #config-close').on('mouseout', function () {
        $('#barcode-node-config #config-close').css({'-webkit-text-fill-color': '#aaa'})
      })
      $('#barcode-node-config #config-close').on('click', function () {
        $('#barcode-node-config').css({visibility: 'hidden'})
        $('#config-operation #node-config-panel-toggle').removeClass('active')
      })
      $('#barcode-node-config').draggable()
      $('#barcode-node-config .panel-header').css('cursor', 'pointer')
      $('#barcode-node-config').mouseover(function () {
        self.trigger_mouse_out()
        self.trigger_unhovering_barcode()
      })
      //  初始化barcode节点控制视图中的控制元素
      update_content_view()
      var iconSize = getIconSize()
      var iconId = 'level-width-lock'
      var iconSpanId = 'level-width-lock-span'
      var containerId = 'barcode-node-config-content'
      // 计算lock图标的y位置
      // var lockYLocation = _compute_lock_y_location(iconSize)
      //  计算lock图标的x位置
      // var lockXLocation = _compute_lock_x_location()
      //  在config的视图中增加lock周围的连接线
      // appendLockLine()
      // //  在config的视图中增加lock图标
      // appendLockIcon(iconId, iconSpanId, containerId)
      //  改变lock图标的位置
      // changeIconLocation(iconSpanId, lockXLocation, lockYLocation)
      //  改变lock图标的大小
      // changeIconSize(iconId, iconSize)
      //  在lock图标上增加监听函数
      // addClickEvent2Icon(iconId)
      //  在slidebar的控制框中增加监听函数
      addSlideBarEvent()
      initSliderBarEvent()

      //  改变lock图标的大小
      function getIconSize() {
        var barcodeNodeConfigHeight = $('#barcode-node-config').height()
        //  这样计算是为了保证在这个屏幕上的iconSize是20px
        //  魔法数字
        var iconSize = barcodeNodeConfigHeight / 12
        return iconSize
      }

      function initSliderBarEvent() {
        //  初始化height的controller
        var heightControllerName = Config.get('HEIGHT_CONTROL_NAME')
        var barcodeHeightValue = +Variables.get('barcodeHeight')
        var barcodeNodeHeightMinValue = Variables.get('barcodeNodeHeightMinValue')
        var barcodeNodeHeightMaxValue = Variables.get('barcodeNodeHeightMaxValue')
        _init_controller_slider(heightControllerName, barcodeHeightValue, barcodeNodeHeightMinValue, barcodeNodeHeightMaxValue, heightChangeHandler)
        //  初始化width的controller
        var widthArrayControllerNamePrefix = Config.get('WIDTH_ARRAY_CONTROL_NAME_PREFIX')
        var barcodeWidthArray = get_width_controller()
        var barcodeNodeWidthMinValue = Variables.get('barcodeNodeWidthMinValue')
        var barcodeNodeWidthMaxValue = Variables.get('barcodeNodeWidthMaxValue')
        for (var wI = 0; wI < barcodeWidthArray.length; wI++) {
          var realLevel = wI + 1
          var widthControllerName = widthArrayControllerNamePrefix + realLevel
          var barcodeWidthValue = barcodeWidthArray[wI]
          _init_controller_slider(widthControllerName, barcodeWidthValue, barcodeNodeWidthMinValue, barcodeNodeWidthMaxValue, widthChangeHandler)
        }
        //  初始化interval的controller
        var intervalControllerName = Config.get('INTERVAL_CONTROL_NAME')
        var barcodeNodeIntervalValue = Variables.get('barcodeNodeInterval')
        var barcodeNodeIntervalMinValue = Variables.get('barcodeNodeIntervalMinValue')
        var barcodeNodeIntervalMaxValue = Variables.get('barcodeNodeIntervalMaxValue')
        _init_controller_slider(intervalControllerName, barcodeNodeIntervalValue, barcodeNodeIntervalMinValue, barcodeNodeIntervalMaxValue, intervalChangeHandler)
      }

      function _init_controller_slider(item_name, itemValue, minValue, maxValue, handler) {
        var controllerHanlder = $("#" + item_name + "-handler")
        $("#" + item_name + "-control-slider").slider({
          min: minValue,
          max: maxValue,
          value: itemValue,
          range: "min",
          create: function () {
            controllerHanlder.text($(this).slider("value"))
          },
          slide: function (event, ui) {
            var value = +ui.value
            controllerHanlder.text(value);
          },
          stop: function (event, ui) {
            var value = +ui.value
            controllerHanlder.text(value);
            var id = $(this).attr('id').replace('-control-slider', '')
            handler(value, id)
          }
        })
      }

      //  在slidebar的控制框中增加监听函数
      function addSlideBarEvent() {
        var heightControllerName = Config.get('HEIGHT_CONTROL_NAME')
        //  监听barcode的高度变化
        $("#range-input-" + heightControllerName).bind('input propertychange', function () {
          var value = $("#range-input-" + heightControllerName).val()
          heightChangeHandler(value)
        });
        //  监听barcode的宽度变化
        var widthArrayControllerNamePrefix = Config.get('WIDTH_ARRAY_CONTROL_NAME_PREFIX')
        var barcodeWidthArray = get_width_controller()
        for (var wI = 0; wI < barcodeWidthArray.length; wI++) {
          var realLevel = wI + 1
          $("#range-input-" + widthArrayControllerNamePrefix + realLevel).bind('input propertychange', function () {
            var value = +$(this).val()
            var id = $(this).attr('id')
            widthChangeHandler(value, id)
          });
        }
        //  监听barcode的间距的变化
        var intervalControllerName = Config.get('INTERVAL_CONTROL_NAME')
        $("#range-input-" + intervalControllerName).bind('input propertychange', function () {
          var value = +$(this).val()
          intervalChangeHandler(value)
        });
      }

      // 改变barcode高度的监听函数
      function heightChangeHandler(value, id) {
        var barcodeNodeHeightMinValue = Variables.get('barcodeNodeHeightMinValue')
        Variables.set('barcodeHeight', value)
        //  trigger change height
        window.barcodeHeight = value
        Datacenter.barcodeCollection.change_barcode_height()
      }

      //  改变barcode宽度的监听函数
      function widthChangeHandler(value, id) {
        var level = id.substring(id.length - 1, id.length)
        var levelofArray = level - 1
        var barcodeWidthArray = get_width_controller()
        var originalBarcodeWidthArray = Variables.get('barcodeWidthArray')
        Variables.set('barcodeWidthArray_previous', JSON.parse(JSON.stringify(originalBarcodeWidthArray)))
        var maxWidthValue = Config.get('MAX_WIDTH_VALUE')
        var overallMinWidth = 1
        var overallMaxWidth = 100
        // if (Variables.get('changeMeanTime')) {
        //   var oldValue = barcodeWidthArray[levelofArray]
        //   var changes = value - oldValue
        //   if (((barcodeWidthArray[barcodeWidthArray.length - 1] > overallMinWidth) && (changes < 0)) || ((barcodeWidthArray[0] < overallMaxWidth) && (changes > 0))) {
        //     for (var bI = 0; bI < barcodeWidthArray.length; bI++) {
        //       barcodeWidthArray[bI] = barcodeWidthArray[bI] + changes
        //       originalBarcodeWidthArray[bI] = originalBarcodeWidthArray[bI] + changes
        //       var widthArrayControllerNamePrefix = Config.get('WIDTH_ARRAY_CONTROL_NAME_PREFIX')
        //       var realLevel = bI + 1
        //       $("#" + widthArrayControllerNamePrefix + realLevel + '-control-slider').slider("value", barcodeWidthArray[bI]);
        //       $("#" + widthArrayControllerNamePrefix + realLevel + '-control-slider>' + "#" + widthArrayControllerNamePrefix + realLevel + '-handler').html(Math.round(barcodeWidthArray[bI]));
        //     }
        //     //  trigger change width
        //     Datacenter.barcodeCollection.change_barcode_width()
        //   } else {
        //     $('#' + id).val(oldValue)
        //   }
        // } else {
        if ((levelofArray - 1) >= 0) {
          if (value > originalBarcodeWidthArray[levelofArray - 1]) {
            value = originalBarcodeWidthArray[levelofArray - 1]
          }
        }
        if ((levelofArray + 1) < originalBarcodeWidthArray.length) {
          if (value < originalBarcodeWidthArray[levelofArray + 1]) {
            value = originalBarcodeWidthArray[levelofArray + 1]
          }
        }
        originalBarcodeWidthArray[levelofArray] = value
        $("#" + id + "-handler").text(value)
        // $('#' + id + '-control-slider').slider('value', value)
        Datacenter.barcodeCollection.change_barcode_width()
      }

      // 改变barcode interval大小的监听函数
      function intervalChangeHandler(value, id) {
        var oldValue = Variables.get('barcodeNodeInterval')
        var minInterval = 1
        if (value >= minInterval) {
          Variables.set('barcodeNodeInterval_previous', Variables.get('barcodeNodeInterval'))
          Variables.set('barcodeNodeInterval', value)
          //  trigger change interval
          Datacenter.barcodeCollection.change_barcode_interval()
        } else {
          var intervalControllerName = Config.get('INTERVAL_CONTROL_NAME')
          $("#range-input-" + intervalControllerName).val(oldValue)
        }
      }

      //  初始化barcode节点控制视图中的控制元素
      function update_content_view() {
        //  初始化height的控制
        var heightControllerName = Config.get('HEIGHT_CONTROL_NAME')
        var barcodeHeight = Variables.get('barcodeHeight')
        $('.slider-container').remove()
        _append_controller(heightControllerName, barcodeHeight)
        //  初始化width的控制
        var widthArrayControllerNamePrefix = Config.get('WIDTH_ARRAY_CONTROL_NAME_PREFIX')
        var barcodeWidthArray = get_width_controller()
        for (var wI = 0; wI < barcodeWidthArray.length; wI++) {
          var realLevel = wI + 1
          _append_controller(widthArrayControllerNamePrefix + realLevel, barcodeWidthArray[wI])
        }
        //  初始化interval的控制
        var intervalControllerName = Config.get('INTERVAL_CONTROL_NAME')
        var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
        _append_controller(intervalControllerName, barcodeNodeInterval)
      }

      function _append_controller(controller_name, controller_value) {
        var containerId = controller_name + '-slider-container'
        var sliderId = controller_name + '-control-slider'
        var handlerId = controller_name + '-handler'
        var height_slider_container = "<div id = \"" + containerId + "\" class = \"slider-container\"> <div id=\"" + sliderId + "\" class = \"slider-div col-md-10\"> <div id=\"" + handlerId + "\" class=\"ui-slider-handle\"> </div> </div> <div class=\"slider-label col-md-2\">" + controller_name + "</div></div>"
        $('#barcode-node-config-content').append(height_slider_container)
      }

      //  根据当前显示的barcode的层级决定barcode的宽度数据
      function get_width_controller() {
        //  初始化宽度的按钮
        var barcodeWidthArray = JSON.parse(JSON.stringify(Variables.get('barcodeWidthArray')))
        var selectedLevels = Variables.get('selectedLevels')
        for (var bI = (barcodeWidthArray.length - 1); bI >= 0; bI--) {
          if (selectedLevels.indexOf(bI) === -1) {
            barcodeWidthArray.splice(bI, 1)
          }
        }
        return barcodeWidthArray
      }

      // 计算lock图标的y位置
      function _compute_lock_y_location(icon_size) {
        var barcodeWidthArray = get_width_controller()
        var barcodeWidthLength = barcodeWidthArray.length
        // lock图标的y位置是所有层级的中心, 所以需要计算最上方的层级label和最下方的层级label, 进而计算他们的中心的y位置
        var middleIndex1 = 1
        var middleIndex2 = barcodeWidthLength
        var lockLocationYPadding = 10
        var rangeLabelLevel2Top = $('#level' + middleIndex1 + '-slider-container').position().top
        var rangeLabelLevel3Top = $('#level' + middleIndex2 + '-slider-container').position().top
        var rangeLabelLevel3Height = $('#level' + middleIndex2 + '-slider-container').height()
        var lockYLocation = (rangeLabelLevel2Top + rangeLabelLevel3Top + rangeLabelLevel3Height) / 2 - rangeLabelLevel3Height + lockLocationYPadding
        return lockYLocation
      }

      //  计算lock图标的x位置
      function _compute_lock_x_location() {
        //  lock的位置是在config视图的右侧, 根据测试是在0.9的位置处
        //  魔法数字
        var lockXLocation = $('#barcode-node-config').width() * 0.87
        return lockXLocation
      }

      //  在config的视图中增加lock周围的连接线
      function appendLockLine() {
        //  连接线的位置需要根据level的位置进行计算, 中间空余的部分是icon, 保证不被遮挡, 因此将连接线拆分为四段
        //  魔法数字 0.82 0.93
        var barcodeWidthArray = get_width_controller()
        var barcodeWidthLength = barcodeWidthArray.length
        var rangeLabelLevelStartTop = $('#range-label-level1').position().top
        var rangeLabelLevelStartHeight = $('#range-label-level1').height()
        var startLineY = rangeLabelLevelStartTop + rangeLabelLevelStartHeight / 2
        var rangeLabelLevelEndTop = $('#range-label-level' + barcodeWidthLength).position().top
        var rangeLabelLevelEndHeight = $('#range-label-level' + barcodeWidthLength).height()
        var endLineY = rangeLabelLevelEndTop + rangeLabelLevelEndHeight / 2
        var startXLoc = $('#barcode-node-config').width() * 0.8
        var endXLoc = $('#barcode-node-config').width() * 0.9
        var lineLengthHorizontal = endXLoc - startXLoc
        var lineLengthVertical = endLineY - startLineY
        var iconSize = getIconSize()
        var halfLineLength = (lineLengthVertical - iconSize) / 2
        var verticalLine2Top = endLineY - halfLineLength
        $('#barcode-node-config-content').append("<div id = \"startLine\" class=\"line-div\"" + " style=\"position:absolute; " + "left:" + startXLoc + "px; top:" + startLineY + "px; width:" + lineLengthHorizontal + "px\"></div>")
        $('#barcode-node-config-content').append("<div id = \"endLine\" class=\"line-div\"" + " style=\"position:absolute; " + "left:" + startXLoc + "px; top:" + endLineY + "px; width:" + lineLengthHorizontal + "px\"></div>")
        $('#barcode-node-config-content').append("<div id = \"verticalLine1\" class=\"line-div\"" + " style=\"position:absolute; " + "left:" + (endXLoc - 1) + "px; top:" + startLineY + "px; height:" + halfLineLength + "px\"></div>")
        $('#barcode-node-config-content').append("<div id = \"verticalLine2\" class=\"line-div\"" + " style=\"position:absolute; " + "left:" + (endXLoc - 1) + "px; top:" + verticalLine2Top + "px; height:" + halfLineLength + "px\"></div>")
      }

      //  在config的视图中增加lock图标
      function appendLockIcon(iconId, iconSpanId, containerId) {
        $('#' + containerId).append("<span id = " + iconSpanId + " style=\"position:absolute;\"><i id = " + iconId + " class=\"fa fa-lock\" class=\"fa fa-lock\" aria-hidden=\"true\"></i>" + "</span>")
      }

      //  改变icon的位置
      function changeIconLocation(icon_id, lock_x_loc, lock_y_loc) {
        $('#' + icon_id).css({left: lock_x_loc, top: lock_y_loc})
      }

      //  改变icon的大小
      function changeIconSize(icon_id, icon_size) {
        $('#' + icon_id).css({'font-size': icon_size + 'px'})
      }

      //  隐藏icon周围的链接线
      function hideLinkedLine() {
        $('.line-div').css({visibility: 'hidden'})
      }

      //  显示icon周围的链接线
      function showLinkedLine() {
        $('.line-div').css({visibility: 'visible'})
      }

      //  在icon上增加监听函数, 主要是控制连接线是否存在以及是否同时变化的状态
      function addClickEvent2Icon(icon_id) {
        $('#' + icon_id).on("click", function () {
          if ($('#' + icon_id).hasClass("fa-lock")) {
            $('#' + icon_id).removeClass("fa-lock").addClass("fa-unlock")
            hideLinkedLine()
            Variables.set('changeMeanTime', false)
          } else {
            $('#' + icon_id).removeClass("fa-unlock").addClass("fa-lock")
            showLinkedLine()
            Variables.set('changeMeanTime', true)
          }
        })
      }
    }
  })
})