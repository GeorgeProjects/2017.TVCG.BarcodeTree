define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'config',
  'jquery',
  'd3',
  'variables',
  'views/svg-base.addon'
], function (require, Mn, _, Backbone, Config, $, d3, Variables, SVGBase) {
  'use strict'

  return Mn.ItemView.extend(_.extend({
      tagName: 'g',
      template: false,
      default: {
        barcodePaddingLeft: null,
        barcodeTextPaddingLeft: null,
        barcodePaddingTop: null,
        hoveringNodeId: null,
        clickedObject: null
      },
      initialize: function () {
        var self = this
        self.init_common_util()
        self.initEventFunc()
        self.initPara()
        self.initMouseoverEvent()
        self.initKeyBoardEvent()
      },
      //  初始化视图中的默认参数
      initPara: function () {
        var self = this
        self.barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
        //  在视图的js文件中的barcodePaddingLeft是barcode的实际的node距离左边界的距离
        self.barcodePaddingLeft = Variables.get('barcodePaddingLeft') + self.barcodeTextPaddingLeft
      },
      //  初始化事件监听函数
      initEventFunc: function () {
        var self = this
        var treeDataModel = self.model
        self.listenTo(treeDataModel, 'change:viewHeightUpdateValue', self.update_view)
        self.listenTo(treeDataModel, 'change:viewUpdateSelectionState', self.node_mouseout_handler)
        self.listenTo(treeDataModel, 'change:selectionUpdateValue', self.selection_update_handler)
        // self.listenTo(self.model, 'change:barcodeNodeAttrArray change:barcodeNodeHeight change:barcodeTreeYLocation', self.update_view)//
        self.listenTo(treeDataModel, 'change:viewUpdateValue', self.shrink_barcode_tree)
        self.listenTo(treeDataModel, 'change:viewUpdateConcurrentValue', self.render_barcode_tree)
        self.listenTo(treeDataModel, 'change:moveFirstPaddingNextUpdateValue', self.update_aligned_barcode_node_concurrent)
        Backbone.Events.on(Config.get('EVENTS')['HOVERING_SORT_BARCODE_NODE'], function (event) {
          var barcodeNodeId = event.barcodeNodeId
          self.highlight_sort_node(barcodeNodeId)
        })
        Backbone.Events.on(Config.get('EVENTS')['UNHOVERING_SORT_BARCODE_NODE'], function () {
          self.unhighlight_sort_node()
        })
        //  直接更新视图, 一起更新
        Backbone.Events.on(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'], function () {
          self.render_barcode_tree()
        })
        Backbone.Events.on(Config.get('EVENTS')['UPDATE_BARCODE_LOC'], function () {
          self.update_view_location()
        })
        Backbone.Events.on(Config.get('EVENTS')['UPDATE_SUMMARY'], function () {
          self.add_summary()
        })
        Backbone.Events.on(Config.get('EVENTS')['REMOVE_SUMMARY_STATE'], function (event) {
          var nodeObjId = event.nodeObjId
          self.remove_summary_state(nodeObjId)

        })
        Backbone.Events.on(Config.get('EVENTS')['SHOW_SUMMARY_STATE'], function (event) {
          var nodeObjId = event.nodeObjId
          self.show_summary_state(nodeObjId)
        })
        Backbone.Events.on(Config.get('EVENTS')['UPDATE_FILTERING_HIGHLIGHT_NODES'], function (event) {
          var highlightObjArray = event.highlightObjArray
          var distributionLevel = event.distributionLevel
          self.update_filtering_nodes(highlightObjArray, distributionLevel)
        })
        Backbone.Events.on(Config.get('EVENTS')['HIGH_RELATED_NODES'], function (event) {
          var thisNodeObj = event.thisNodeObj
          var findingNodesObj = event.findingNodesObj
          var thisTreeFindingNodesObj = treeDataModel.find_related_nodes(thisNodeObj)
          var comparedResultsObj = self.compareNodes(findingNodesObj, thisTreeFindingNodesObj)
          self.highlight_finding_node(findingNodesObj)
        })
        //  取消mouseover的高亮效果
        Backbone.Events.on(Config.get('EVENTS')['NODE_MOUSEOUT'], function (event) {
          if (typeof (event) !== 'undefined') {
            var eventView = event.eventView
            self.node_mouseout_handler(eventView)
          } else {
            self.node_mouseout_handler()
          }
        })
        //  删除barcode视图中的options按钮
        Backbone.Events.on(Config.get('EVENTS')['REMOVE_OPTIONS_BUTTTON'], function (event) {
          self.remove_options_button()
        })
        //  去除barcode的背景的高亮
        Backbone.Events.on(Config.get('EVENTS')['UN_HOVERING_BARCODE_EVENT'], function (event) {
          self.unhighlight_barcode_bg()
        })
        //  高亮所有的相关节点
        Backbone.Events.on(Config.get('EVENTS')['HIGHLIGHT_ALL_RELATED_NODE'], function (event) {
          var nodeObj = event.nodeObj
          self.higlight_all_related_nodes(nodeObj)
        })
        //  高亮所有的相关节点
        Backbone.Events.on(Config.get('EVENTS')['HIGHLIGHT_ALL_SELECTED_NODE_SUPERTREEVIEW'], function () {
          console.log('listen HIGHLIGHT_ALL_SELECTED_NODE_SUPERTREEVIEW')
          self.highlight_selection_supertree_selection_nodes()
        })
      },
      //  ************************************
      //  将鼠标hovering的barcode的id进行广播
      trigger_hovering_event: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')['HOVERING_BARCODE_EVENT'], {
          'barcodeTreeId': barcodeTreeId
        })
      },
      //  将鼠标unhovering的barcode的id进行广播
      trigger_unhovering_event: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')['UN_HOVERING_BARCODE_EVENT'], {
          'barcodeTreeId': barcodeTreeId
        })
      },
      //  点击选中barcdoe触发的事件
      trigger_click_event: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')['SELECT_BARCODE_EVENT'], {
          'barcodeTreeId': barcodeTreeId
        })
      },
      //  点击取消选中barcode触发的事件
      trigger_unclick_event: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')['UNSELECT_BARCODE_EVENT'], {
          'barcodeTreeId': barcodeTreeId
        })
      },
      //  将鼠标hovering的barcode的节点的相关信息进行广播
      trigger_hovering_node_event: function (thisNodeObj, findingNodesObj) {
        var self = this
        Backbone.Events.trigger(Config.get('EVENTS')['HIGH_RELATED_NODES'], {
          'thisNodeObj': thisNodeObj,
          'findingNodesObj': findingNodesObj
        })
      },
      // 鼠标hover到barcode的背景的矩形上的事件
      trigger_render_cover_rect: function () {
        Backbone.Events.trigger(Config.get('EVENTS')['RENDER_HOVER_RECT'])
      },
      //  在锁定的状态下切换barcode的显示模式, 那么需要所有的barcode同时变化, 进行渲染
      trigger_update_barcode_view: function () {
        Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_BARCODE_VIEW'])
      },
      //  发出mouseout的信号
      trigger_mouseout_event: function () {
        Backbone.Events.trigger(Config.get('EVENTS')['NODE_MOUSEOUT'])
      },
      //  发出关闭视图中option group的信号
      trigger_remove_option_button: function () {
        Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_OPTIONS_BUTTTON'])
      },
      //  更新tree config的视图
      trigger_update_tree_config_view: function () {
        Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_TREE_CONFIG_VIEW'])
      },
      //  更新supertree的视图
      trigger_super_view_update: function () {
        Backbone.Events.trigger(Config.get('EVENTS')['RENDER_SUPERTREE'])
      },
      //  删除summary的柱状图
      trigger_remove_summary_state: function (nodeObjId) {
        Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_SUMMARY_STATE'], {
          'nodeObjId': nodeObjId
        })
      },
      //  显示summary的柱状图
      trigger_show_summary_state: function (nodeObjId) {
        Backbone.Events.trigger(Config.get('EVENTS')['SHOW_SUMMARY_STATE'], {
          'nodeObjId': nodeObjId
        })
      },
      //  初始化鼠标事件
      initMouseoverEvent: function () {
        var self = this
        jQuery.fn.d3Mouseover = function () {
          this.each(function (i, e) {
            var evt = new MouseEvent("mouseover");
            e.dispatchEvent(evt);
          });
        };
        jQuery.fn.d3Mouseout = function () {
          this.each(function (i, e) {
            var evt = new MouseEvent("mouseout");
            e.dispatchEvent(evt);
          });
        };
      },
      //  初始化键盘事件
      initKeyBoardEvent: function () {
        var self = this
        var thisBarcodeId = self.model.get('barcodeTreeId')
        window.onkeydown = function (e) {
          var key = e.keyCode ? e.keyCode : e.which;
          var CMD_KEY = 91
          if (key === CMD_KEY) {
            window.press_cmd = true
          }
        }
        window.onkeyup = function (e) {
          var currentHoveringBarcodeId = Variables.get('currentHoveringBarcodeId')
          var key = e.keyCode ? e.keyCode : e.which;
          var CMD_KEY = 91
          if (key === CMD_KEY) {
            window.press_cmd = false
          }
          if (currentHoveringBarcodeId === thisBarcodeId) {
            var LEFT_KEY = 37
            var TOP_KEY = 38
            var RIGHT_KEY = 39
            var BOTTOM_KEY = 40
            var ESC_KEY = 27
            var barcodeNodeAttrArray = self.get_barcode_node_array()
            var currentHoveringNodeIndex = getNodeIndex(barcodeNodeAttrArray, self.hoveringNodeId)
            var findingIndex = null
            if (currentHoveringNodeIndex != null) {
              if (key === LEFT_KEY) {
                console.log('LEFT_KEY')
                var previousSiblingIndex = findPreviousSibling(barcodeNodeAttrArray, currentHoveringNodeIndex)
                findingIndex = previousSiblingIndex
              } else if (key === TOP_KEY) {
                console.log('TOP_KEY')
                var fatherObjIndex = findFather(barcodeNodeAttrArray, currentHoveringNodeIndex)
                findingIndex = fatherObjIndex
              } else if (key === RIGHT_KEY) {
                console.log('RIGHT_KEY')
                var nextSiblingObjIndex = findNextSibling(barcodeNodeAttrArray, currentHoveringNodeIndex)
                findingIndex = nextSiblingObjIndex
              } else if (key === BOTTOM_KEY) {
                console.log('BOTTOM_KEY')
                var childrenObjIndex = findChildren(barcodeNodeAttrArray, currentHoveringNodeIndex)
                findingIndex = childrenObjIndex
              } else if (key === ESC_KEY) {
                self.trigger_mouseout_event()
                tip.hide()
              }
              if ((findingIndex != null) && (currentHoveringBarcodeId != null)) {
                var nodeId = barcodeNodeAttrArray[findingIndex].id
                $('#' + currentHoveringBarcodeId + ' #' + nodeId).d3Mouseover()
              }
            }
          }
        }
        //  根据barcode节点的id获取barcode节点的索引值
        function getNodeIndex(barcodeNodeAttrArray, barcodeNodeId) {
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            if (barcodeNodeAttrArray[bI].id === barcodeNodeId) {
              return bI
            }
          }
          return null
        }

        //  寻找下一个兄弟节点
        function findNextSibling(barcodeNodeAttrArray, hovering_node_index) {
          var nodeIndex = hovering_node_index
          var nextSiblingNodeIndex = null
          var nodeDepth = barcodeNodeAttrArray[nodeIndex].depth
          for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
            if ((barcodeNodeAttrArray[nI].depth === nodeDepth) && (barcodeNodeAttrArray[nI].width !== 0)) {
              if (barcodeNodeAttrArray[nI].existed) {
                nextSiblingNodeIndex = nI
                break
              }
            }
            if (barcodeNodeAttrArray[nI].depth < nodeDepth) {
              break
            }
          }
          return nextSiblingNodeIndex
        }

        function findPreviousSibling(barcodeNodeAttrArray, hovering_node_index) {
          var nodeIndex = hovering_node_index
          var previousSiblingNodeIndex = null
          var nodeDepth = barcodeNodeAttrArray[nodeIndex].depth
          for (var nI = (nodeIndex - 1); nI >= 0; nI--) {
            if ((barcodeNodeAttrArray[nI].depth === nodeDepth) && (barcodeNodeAttrArray[nI].width !== 0)) {
              if (barcodeNodeAttrArray[nI].existed) {
                previousSiblingNodeIndex = nI
                break
              }
            }
            if (barcodeNodeAttrArray[nI].depth < nodeDepth) {
              break
            }
          }
          return previousSiblingNodeIndex
        }

        function findFather(barcodeNodeAttrArray, hovering_node_index) {
          var nodeIndex = hovering_node_index
          var fatherNodeIndex = null
          var nodeDepth = barcodeNodeAttrArray[nodeIndex].depth
          for (var nI = (nodeIndex - 1); nI >= 0; nI--) {
            if (barcodeNodeAttrArray[nI].depth < nodeDepth) {
              if ((barcodeNodeAttrArray[nI].existed) && (barcodeNodeAttrArray[nI].width !== 0)) {
                fatherNodeIndex = nI
                break
              }
            }
          }
          return fatherNodeIndex
        }

        function findChildren(barcodeNodeAttrArray, hovering_node_index) {
          var nodeIndex = hovering_node_index
          var childrenNodeIndex = null
          var nodeDepth = barcodeNodeAttrArray[nodeIndex].depth
          for (var nI = (nodeIndex + 1); nI < barcodeNodeAttrArray.length; nI++) {
            if (barcodeNodeAttrArray[nI].depth > nodeDepth) {
              if (barcodeNodeAttrArray[nI].existed) {
                childrenNodeIndex = nI
                break
              }
            }
          }
          return childrenNodeIndex
        }

        function showTooltip(nodeObj, nodeIndex) {
          self.node_mouseover_handler(nodeObj, nodeIndex, self)
        }
      },
      //  获取当前的barcodeTree的展示状态
      get_barcode_tree_display_mode: function () {
        var self = this
        var barcodeTreeIsLocked = Variables.get('barcodeTreeIsLocked')
        var currentDisplayMode = null
        var treeDataModel = self.model
        if (barcodeTreeIsLocked) {
          //  如果displaymode是全局控制
          currentDisplayMode = Variables.get('displayMode')
        } else {
          //  如果displaymode是不是全局控制
          currentDisplayMode = treeDataModel.get('displayMode')
        }
        return currentDisplayMode
      },
      //  获取当前的视图中使用的barcodeNodeArray
      get_barcode_node_array: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeNodeAttrArray = null
        var currentDisplayMode = self.get_barcode_tree_display_mode()
        if (currentDisplayMode === Config.get('CONSTANT').ORIGINAL) {
          barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        } else if (currentDisplayMode === Config.get('CONSTANT').COMPACT) {
          barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
        } else if (currentDisplayMode === Config.get('CONSTANT').GLOBAL) {
          barcodeNodeAttrArray = treeDataModel.get('categoryNodeObjArray')
        }
        return barcodeNodeAttrArray
      },
      //  获取当前视图中使用的alignRangeArray
      get_aligned_range_array: function () {
        var self = this
        var treeDataModel = self.model
        var currentDisplayMode = self.get_barcode_tree_display_mode()
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var alignedRangeObjArray = null
        if (currentDisplayMode === Config.get('CONSTANT').ORIGINAL) {
          alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
        } else if (currentDisplayMode === Config.get('CONSTANT').COMPACT) {
          alignedRangeObjArray = treeDataModel.get('compactAlignedRangeObjArray')
        } else if (currentDisplayMode === Config.get('CONSTANT').GLOBAL) {
          alignedRangeObjArray = [
            {
              alignedObjIndex: 0,
              rangeStartNodeIndex: 0,
              rangeEndNodeIndex: barcodeNodeAttrArray.length - 1
            }
          ]
        }
        return alignedRangeObjArray
      },
      //  获取当前视图中使用的paddingNodeArray
      get_padding_node_array: function () {
        var self = this
        var treeDataModel = self.model
        var paddingNodeObjArray = []
        var currentDisplayMode = self.get_barcode_tree_display_mode()
        if (currentDisplayMode === Config.get('CONSTANT').ORIGINAL) {
          paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
        } else if (currentDisplayMode === Config.get('CONSTANT').COMPACT) {
          paddingNodeObjArray = treeDataModel.get('compactPaddingNodeObjArray')
        } else if (currentDisplayMode === Config.get('CONSTANT').GLOBAL) {
          //  在global的模式下, 不存在padding范围的节点
          paddingNodeObjArray = []
        }
        return paddingNodeObjArray
      },
      //***********************************
      init_common_util: function () {
        var self = this
        //  初始化颜色计算的工具
        var white = d3.rgb(255, 255, 255)
        var black = d3.rgb(0, 0, 0)
        var colorCompute = d3.interpolate(white, black)
        self.colorCompute = colorCompute
      },
      compareNodes: function (basedFindingNodesObj, thisTreeFindingNodesObj) {
        var self = this
        var globalCompareResult = {}
        globalCompareResult.childrenNodes = innerCompare(basedFindingNodesObj.childrenNodes, thisTreeFindingNodesObj.childrenNodes)
        globalCompareResult.fatherCurrentNodes = innerCompare(basedFindingNodesObj.fatherCurrentNodes, thisTreeFindingNodesObj.fatherCurrentNodes)
        globalCompareResult.siblingNodes = innerCompare(basedFindingNodesObj.siblingNodes, thisTreeFindingNodesObj.siblingNodes)
        return globalCompareResult
        function innerCompare(array1, array2) {
          for (var a1I = 0; a1I < array1.length; a1I++) {
            for (var a2I = 0; a2I < array2.length; a2I++) {
              if (array1[a1I].id === array2[a2I].id) {
                array1[a1I].compare_result = 'same'
                array2[a2I].compare_result = 'same'
              }
            }
          }
          for (var a1I = 0; a1I < array1.length; a1I++) {
            if (array1[a1I].compare_result !== 'same') {
              array1[a1I].compare_result = 'miss'
            }
          }
          for (var a2I = 0; a2I < array2.length; a2I++) {
            if (array2[a2I].compare_result !== 'same') {
              array2[a2I].compare_result = 'add'
            }
          }
          var compareResultObj = {}
          compareResultObj.same = []
          compareResultObj.add = []
          compareResultObj.miss = []
          for (var a1I = 0; a1I < array1.length; a1I++) {
            if (array1[a1I].compare_result === 'same') {
              compareResultObj.same.push(array1[a1I])
            } else if (array1[a1I].compare_result === 'miss') {
              compareResultObj.miss.push(array1[a1I])
            }
          }
          for (var a2I = 0; a2I < array2.length; a2I++) {
            if (array2[a2I].compare_result === 'add') {
              compareResultObj.add.push(array2[a2I])
            }
          }
          return compareResultObj
        }
      },
      //  barcodeTree视图的字体大小
      get_font_size: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var labelFontSize = barcodeHeight / 19
        return labelFontSize
      },
      onShow: function () {
        var self = this
        var treeDataModel = self.model
        var compareBased = treeDataModel.get('compareBased')
        var barcodeIndex = treeDataModel.get('barcodeIndex')
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeRectBgColor = treeDataModel.get('barcodeRectBgColor')
        var barcodeNodeHeight = window.barcodeHeight
        var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')
        // var barcodeTreeYLocation = barcodeIndex * barcodeNodeHeight + barcodeIndex
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodePaddingTop = treeDataModel.get('barcodePaddingTop')
        var containerWidth = $('#barcodetree-scrollpanel').width()
        var barcodePaddingLeft = self.barcodePaddingLeft
        var tip = window.tip
        self.d3el.call(tip)
        self.singleTree = self.d3el.attr('id', barcodeTreeId)
          .attr('class', 'single-tree')
        self.singleTree
          .attr('transform', 'translate(' + 0 + ',' + barcodeTreeYLocation + ')')
        self.singleTree.append('rect')
          .attr('class', function () {
            var colorClass = barcodeIndex % 2 ? 'bg-odd' : 'bg-even'
            colorClass = colorClass + ' bg'
            if (compareBased) {
              colorClass = colorClass + ' compare-based-selection'
            }
            return colorClass
          })
          .attr('width', containerWidth)
          .attr('height', barcodeHeight)
          .on('mouseover', function () {
            self.unhighlight_barcode_bg()
            d3.select(this).classed('hovering-highlight', true)
            d3.selectAll('.barcode-node').classed('.mouseover-unhighlight', false)
            self.trigger_hovering_event()
            var dayArray = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            var dateInTip = barcodeTreeId.split('-')[1].replaceAll('_', '/')
            var date = barcodeTreeId.split('-')[1].replaceAll('_', '-')
            var curDay = new Date(date).getDay()
            var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>date: " + dateInTip //+ ",value:<span style='color:red'>" + barValue + "</span>"
              + ", Day: " + dayArray[curDay] + "</span></span>"
            tip.show(tipValue)
          })
          .on('mouseout', function () {
            self.unhighlight_barcode_bg()
            self.d3el.select('#barcode-container').selectAll('.barcode-node').classed('mouseover-unhighlight', false)
            self.trigger_unhovering_event()
            self.trigger_mouseout_event()
            self.trigger_render_cover_rect()
            tip.hide()
          })
        self.add_barcode_dbclick_click_handler()
        // .on('click', function () {
        //
        // })
        // //  需要将dblclick与click进行区分
        // .on('dblclick', function () {
        //   $('#tree-config-div').css({visibility: 'visible'})
        // })
        // .style('fill', barcodeRectBgColor)

        var barcodeTreeLabelYearMonthDday = barcodeTreeId.split('-')[1]
        var barcodeTreeLabelMonthDday = barcodeTreeLabelYearMonthDday.substring(5, barcodeTreeLabelYearMonthDday.length).replaceAll('_', '/')
        //  barcode的label的位置的左边界是紧邻着barcode的右侧的label
        var barcodeLabelX = self.barcodeTextPaddingLeft
        self.singleTree.append('text')
          .attr('id', 'barcode-label')
          .attr('x', barcodeLabelX)
          .attr('y', barcodeHeight / 2)
          .attr('text-anchor', 'start')
          .attr('alignment-baseline', 'middle')
          .style("cursor", "pointer")
          .text(barcodeTreeLabelMonthDday)
          .on('mouseover', function (d, i) {
            self.d3el.select('.bg').classed('hovering-highlight', true)
            self.trigger_hovering_event()
          })
          .on('mouseout', function (d, i) {
            self.d3el.select('.bg').classed('hovering-highlight', false)
          })
        // .on('click', function (d, i) {
        //   self._label_click_handler()
        // })
        self.barcodeContainer = self.d3el.append('g')
          .attr('transform', 'translate(' + barcodePaddingLeft + ',' + barcodePaddingTop + ')')
          .attr('id', 'barcode-container')
        // var maxWidth = barcodeNodeAttrArray[ barcodeNodeAttrArray.length - 1 ].x + barcodeNodeAttrArray[ barcodeNodeAttrArray.length - 1 ].width
        // var extentLength = barcodePaddingTop
        self.render_barcode_tree()
        // 更新barcode的标签的字体大小
        // if (barcodeHeight < 16) {
        var labelFontSize = self.get_font_size()
        self.d3el.select('#barcode-label')
          .style('font-size', function (d) {
            return labelFontSize + 'em'
          })
          .attr('y', barcodeHeight / 2)
        // }
      },
      _label_click_handler: function () {
        var self = this
        var treeDataModel = self.model
        if (Variables.get('barcodeTreeIsLocked')) {
          //  如果所有选中的barcode被锁定同时变化
          if (Variables.get('displayMode') === Config.get('CONSTANT')['ORIGINAL']) {
            Variables.set('displayMode', Config.get('CONSTANT')['GLOBAL'])
          } else if (Variables.get('displayMode') === Config.get('CONSTANT')['GLOBAL']) {
            Variables.set('displayMode', Config.get('CONSTANT')['ORIGINAL'])
          }
          self.trigger_update_barcode_view()
        } else if (!Variables.get('barcodeTreeIsLocked')) {
          //  如果所有选中的barcode没有被锁定只能单个进行变化
          if (treeDataModel.get('displayMode') === Config.get('CONSTANT')['ORIGINAL']) {
            treeDataModel.set('displayMode', Config.get('CONSTANT')['GLOBAL'])
          } else if (treeDataModel.get('displayMode') === Config.get('CONSTANT')['GLOBAL']) {
            treeDataModel.set('displayMode', Config.get('CONSTANT')['ORIGINAL'])
          }
          self.render_barcode_tree()
        }
      },
      update_filtering_nodes: function (highlightObjArray, distributionLevel) {
        var self = this
        var barcodeTreeId = self.model.get('barcodeTreeId')
        if (distributionLevel === 'ratio') {
          if (highlightObjArray.length > 0) {
            self.d3el.selectAll('.barcode-node')
              .style('opacity', 0.1)
          } else {
            self.d3el.selectAll('.barcode-node')
              .style('opacity', 1)
          }
        } else {
          if (highlightObjArray.length > 0) {
            self.d3el.selectAll('.barcode-node-level-' + distributionLevel)
              .style('opacity', 0.1)
          } else {
            self.d3el.selectAll('.barcode-node-level-' + distributionLevel)
              .style('opacity', 1)
          }
        }
        // .classed('filtering-unhighlight', true)
        for (var hI = 0; hI < highlightObjArray.length; hI++) {
          if (barcodeTreeId === highlightObjArray[hI].treeId) {
            self.d3el.selectAll('#' + highlightObjArray[hI].nodeId)
              .style('opacity', 1)
          }
        }
      },
      /**
       * 更新padding节点, 非对齐的收缩节点
       * @param next_step_func
       */
      update_padding_barcode_node: function (next_step_func) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        //  TODO
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var DURATION = Config.get('TRANSITON_DURATION')
        var selectedLevels = Variables.get('selectedLevels')
        // var paddingBarcodeNode = self.d3el.select('#barcode-container')
        //   .selectAll('.barcode-node')
        //   .data(barcodeNodeAttrArray.filter(function (d, i) {
        //     return ((selectedLevels.indexOf(d.depth) === -1))//(d.depth < 4)
        //   }), function (d, i) {
        //     return d.id
        //   })
        //   .remove()
        var paddingBarcodeNode = self.d3el.select('#barcode-container')
          .selectAll('.barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongPadding(i)))//(d.depth < 4)
          }), function (d, i) {
            return d.id
          })
        paddingBarcodeNode.enter()
          .append('rect')
          .attr('class', function (d, i) {
            return self.class_name_handler(d)
          })
          .attr('id', function (d, i) {
            return d.id
          })
          .attr('x', function (d) {
            if (isNaN(+d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('y', function (d) {
            return +d.y
          })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('height', function (d) {
            return +d.height
          })
          .style("cursor", "pointer")
          .on('mouseover', function (d, i) {
            self.node_mouseover_handler(d, i, self)
          })
          .on('mouseout', function (d, i) {
          })
          .on('click', function (d, i) {
            // self.node_click_handler(d)
          })
        paddingBarcodeNode.attr('class', function (d, i) {
          return self.class_name_handler(d)
        })
          .attr('y', function (d) {
            return +d.y
          })
          .attr('width', function (d) {
            return +d.width
          })
          .transition()
          .duration(DURATION)
          .attr('x', function (d) {
            if (isNaN(+d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('height', function (d) {
            return +d.height
          })
          .call(self.endall, function (d, i) {
            self.render_padding_cover_rect()
            if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
              next_step_func()
            } else {
            }
          })
      },
      /**
       *  在更改不同模式的情况下更改barcode的container的位置
       */
      update_barcode_loc: function () {
        var self = this
        var treeDataModel = self.model
        var barcodePaddingLeft = self.barcodePaddingLeft
        var barcodePaddingTop = treeDataModel.get('barcodePaddingTop')
        var COMPARISON_RESULT_PADDING = Config.get('COMPARISON_RESULT_PADDING')
        self.d3el.select('#barcode-container')
          .attr('transform', 'translate(' + barcodePaddingLeft + ',' + barcodePaddingTop + ')')
      },
      /**
       * 更新不存在的对齐barcode节点
       * @param next_step_func: 在更新完成不存在的对齐节点, 执行完成动画之后执行的方法
       */
      update_unexisted_aligned_barcode_node: function (next_step_func) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        var alignedRangeObjArray = self.get_aligned_range_array()
        var paddingNodeObjArray = self.get_padding_node_array()
        //  TODO
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var mostDepthWidth = 0
        var barcodeNodeWidthArray = window.barcodeWidthArray
        for (var bI = (barcodeNodeWidthArray.length - 1); bI >= 0; bI--) {
          if (barcodeNodeWidthArray[bI] !== 0) {
            mostDepthWidth = barcodeNodeWidthArray[bI]
            break
          }
        }
        var renderBarcodeNodeWidthThredhold = Variables.get('SingleView_renderBarcodeNodeWidthThredhold')
        var currentDisplayMode = self.get_barcode_tree_display_mode()
        if (currentDisplayMode === Config.get('CONSTANT').GLOBAL) {
          return
        }
        //  获取渲染的barcode节点的宽度阈值, 如果宽度大于这个阈值, 那么绘制barcode的节点, 否则就不绘制这个节点
        if (mostDepthWidth < renderBarcodeNodeWidthThredhold)
          return
        //  var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        var alignedComparisonResultArray = treeDataModel.get('alignedComparisonResultArray')
        var DURATION = Config.get('TRANSITON_DURATION')
        var selectedLevels = Variables.get('selectedLevels')
        var filterBarcodeArray = barcodeNodeAttrArray.filter(function (d, i) {
          return ((selectedLevels.indexOf(d.depth) !== -1) && (!self.isExisted(i)))
        })
        //
        var alignedBarcodeNodes = self.d3el.select('#barcode-container')
          .selectAll('.aligned-barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongAligned(i, alignedRangeObjArray, paddingNodeObjArray)) && (!self.isExisted(i)))
          }), function (d, i) {
            return d.id
          })
        //  enter 添加节点
        alignedBarcodeNodes.enter()
          .append('rect')
          .attr('class', function (d, i) {
            return self.class_name_handler(d)
          })
          .attr('id', function (d, i) {
            return d.id
          })
          .attr('x', function (d) {
            if (isNaN(+d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('y', function (d) {
            return +d.y
          })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('height', function (d) {
            return +d.height
          })
          .style("cursor", "pointer")
          .on('mouseover', function (d, i) {
            self.node_mouseover_handler(d, i, self)
          })
          .on('click', function (d, i) {
            // self.node_click_handler(d)
          })
        // update 更新节点
        alignedBarcodeNodes.attr('class', function (d, i) {
          return self.class_name_handler(d)
        })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('y', function (d) {
            return +d.y
          })
          .transition()
          .duration(DURATION)
          .attr('x', function (d) {
            if (isNaN(+d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('height', function (d) {
            return +d.height
          })
          .call(self.endall, function (d, i) {
            if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
              next_step_func()
            } else {
            }
            if (alignedComparisonResultArray == null) {
              self.add_comparison_summary()
            } else {
              self.add_missed_added_summary()
            }
          })
      },
      update_exist_unexist_aligned_barcode_node: function () {
        var self = this
        var treeDataModel = self.model
        var alignedRangeObjArray = self.get_aligned_range_array()
        var paddingNodeObjArray = self.get_padding_node_array()
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var selectedLevels = Variables.get('selectedLevels')
        var alignedBarcodeNodes = self.d3el.select('#barcode-container')
          .selectAll('.aligned-barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongAligned(i, alignedRangeObjArray, paddingNodeObjArray)))//(d.depth < 4)
          }), function (d, i) {
            return d.id
          })
        alignedBarcodeNodes.exit().remove()
      },
      /**
       * 更新存在的对齐barcode节点
       * @param next_step_func: 在更新完成存在的对齐节点, 执行完成动画之后执行的方法
       */
      update_existed_aligned_barcode_node: function (next_step_func) {
        var self = this
        var treeDataModel = self.model
        var alignedRangeObjArray = self.get_aligned_range_array()
        var paddingNodeObjArray = self.get_padding_node_array()
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var DURATION = Config.get('TRANSITON_DURATION')
        var selectedLevels = Variables.get('selectedLevels')
        //
        var alignedBarcodeNodes = self.d3el.select('#barcode-container')
          .selectAll('.aligned-barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongAligned(i, alignedRangeObjArray, paddingNodeObjArray)) && (self.isExisted(i)))//(d.depth < 4)
          }), function (d, i) {
            return d.id
          })
        //  enter 添加节点
        alignedBarcodeNodes.enter()
          .append('rect')
          .attr('class', function (d, i) {
            return self.class_name_handler(d)
          })
          .attr('id', function (d, i) {
            return d.id
          })
          .attr('x', function (d) {
            if (isNaN(d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('y', function (d) {
            return +d.y
          })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('height', function (d) {
            return +d.height
          })
          .style("cursor", "pointer")
          .style("fill", function (d, i) {
            return self.fill_handler(d, i, self)
          })
          .on('mouseover', function (d, i) {
            self.node_mouseover_handler(d, i, self)
          })
          .on('click', function (d, i) {
            // self.node_click_handler(d, i, self)
          })
        // .on('dblclick', function (d, i) {
        //   console.log('dblclick')
        // })
        // update 更新节点
        alignedBarcodeNodes.attr('class', function (d, i) {
          return self.class_name_handler(d)
        })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('y', function (d) {
            return +d.y
          })
          .transition()
          .duration(DURATION)
          .attr('x', function (d) {
            if (isNaN(d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('height', function (d) {
            return +d.height
          })
          .style("fill", function (d, i) {
            return self.fill_handler(d, i, self)
          })
          .call(self.endall, function (d, i) {
            if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
              next_step_func()
            } else {
              // console.log('not next step')
            }
          })
        // alignedBarcodeNodes.exit().remove()
      },
      fill_handler: function (d, i, self) {
        var num = d.num
        var maxnum = d.maxnum
        var treeDataModel = self.model
        var barcodeRectBgColor = treeDataModel.get('barcodeRectBgColor')
        if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
          return barcodeRectBgColor
        } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
          if (typeof (maxnum) !== 'undefined') {
            return self.colorCompute(num / maxnum)
          } else {
            return null
          }
        }
      },
      class_name_handler: function (d) {
        var self = this
        var classArray = []
        classArray.push('barcode-node')
        classArray.push('aligned-barcode-node')
        classArray.push('barcode-node-level-' + d.depth)
        if (d.existed) {
          classArray.push('node-existed')
        } else {
          if (typeof(d.beyondAlign) !== 'undefined') {
            if (d.beyondAlign) {
              classArray.push('node-none')
            } else {
              classArray.push('node-missed')
            }
          } else {
            classArray.push('node-missed')
          }
        }
        return self.get_class_name(classArray)
      },
      /**
       * 更新对齐barcode节点
       */
      update_aligned_barcode_node: function () {
        var self = this
        self.update_exist_unexist_aligned_barcode_node()
        self.update_existed_aligned_barcode_node(self.update_unexisted_aligned_barcode_node.bind(self))
        self.add_node_dbclick_click_handler()
      },
      /**
       * 同时移动对齐的barcode节点
       */
      update_aligned_barcode_node_concurrent: function () {
        var self = this
        self.update_exist_unexist_aligned_barcode_node()
        self.update_existed_aligned_barcode_node()
        self.update_unexisted_aligned_barcode_node()
        self.update_padding_barcode_node()
        //  虽然在update_padding_barcode_node方法之后会更新padding_cover_rect
        //  但是为了在更新过程中不会出现背后的barcode节点的视觉干扰, 所以在后面紧接着调用render_padding_cover_rect
        self.render_padding_cover_rect()
        // self.add_node_dbclick_click_handler()
        // self.add_comparison_summary()
        // self.add_missed_added_summary()
        self.add_node_dbclick_click_handler()
        // self.highlight_original_selection_nodes()
        // self.add_collapsed_triangle()
      },
      /**
       * 绘制barcodeTree
       */
      render_barcode_tree: function () {
        var self = this
        self.update_barcode_loc()
        self.update_exist_unexist_aligned_barcode_node()
        self.update_existed_aligned_barcode_node()
        self.update_unexisted_aligned_barcode_node()
        // self.update_aligned_barcode_node()
        self.update_padding_barcode_node()
        //  虽然在update_padding_barcode_node方法之后会更新padding_cover_rect
        //  但是为了在更新过程中不会出现背后的barcode节点的视觉干扰, 所以在后面紧接着调用render_padding_cover_rect
        self.render_padding_cover_rect()
        self.add_node_dbclick_click_handler()
        // self.add_comparison_summary()
        self.highlight_original_selection_nodes()
        self.highlight_selection_supertree_selection_nodes()
        self.update_interaction_icon()
      },
      /**
       * 刷新标记当前操作节点的icon的方法
       */
      update_interaction_icon: function () {
        var self = this
        var waitTime = Config.get('WAIT_DURATION')
        setTimeout(function () {
          //  增加标记barcodetree的子树节点折叠的icon
          self.add_collapsed_triangle()
          //  更新标记当前选择子树节点的icon
          self.update_current_selected_icon()
          //  更新标记当前编辑子树节点的icon
          self.update_current_edit_icon()
          //  更新编辑当前align节点的icon
          self.update_aligned_sort_icon()
        }, waitTime);
      },
      /**
       *  在对齐节点之前增加比较的统计结果
       */
      add_comparison_summary: function () {
        var self = this
        var treeDataModel = self.model
        //  TODO
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var alignedRangeObjArray = self.get_aligned_range_array()
        var alignedComparisonResultArray = treeDataModel.get('alignedComparisonResultArray')
        var selectedLevels = Variables.get('selectedLevels')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        //  将add-miss-summary比较中高亮的节点取消高亮
        self.d3el.selectAll('.same-node-highlight').classed('same-node-highlight', false)
        self.d3el.selectAll('.added-node-highlight').classed('added-node-highlight', false)
        self.d3el.selectAll('.missed-node-highlight').classed('missed-node-highlight', false)
        if (alignedComparisonResultArray != null)
          return
        self.d3el.select('#barcode-container').selectAll('.add-miss-summary').remove()
        self.d3el.select('#barcode-container').selectAll('.stat-summary').remove()
        for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
          var alignObjIndex = alignedRangeObjArray[aI].alignedObjIndex
          var alignedObj = alignedRangeObjArray[aI]
          var rangeStartNodeIndex = alignedObj.rangeStartNodeIndex
          var alignObjId = barcodeNodeAttrArray[rangeStartNodeIndex].id
          var alignObjDepth = barcodeNodeAttrArray[rangeStartNodeIndex].depth
          var rangeEndNodeIndex = alignedObj.rangeEndNodeIndex
          var nodeDistribution = get_node_distribution(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray)
          draw_comparison_summary(alignObjIndex, alignObjId, alignObjDepth, nodeDistribution, rangeStartNodeIndex, barcodeNodeAttrArray)
        }
        //  计算得到在某一个子树下
        function get_node_distribution(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray) {
          var distributionObj = {}
          distributionObj.wholeNodeNum = 0
          for (var sI = rangeStartNodeIndex; sI <= rangeEndNodeIndex; sI++) {
            if (typeof (barcodeNodeAttrArray[sI]) !== 'undefined') {
              var nodeLevel = barcodeNodeAttrArray[sI].depth
              if (selectedLevels.indexOf(nodeLevel) !== -1) {
                if (barcodeNodeAttrArray[sI].existed) {
                  if (typeof(distributionObj[nodeLevel]) === 'undefined') {
                    distributionObj[nodeLevel] = 0
                  }
                  distributionObj[nodeLevel] = distributionObj[nodeLevel] + 1
                }
                distributionObj.wholeNodeNum = distributionObj.wholeNodeNum + 1
              }
            } else {
              console.log('sI', sI)
            }
          }
          return distributionObj
        }

        function draw_comparison_summary(alignObjIndex, alignObjId, alignObjDepth, nodeDistribution, rangeStartNodeIndex, barcodeNodeAttrArray) {
          var initRangeStartNodeX = barcodeNodeAttrArray[rangeStartNodeIndex].x
          var comparisonResultsPadding = Config.get('COMPARISON_RESULT_PADDING')
          var barcodeNodeGap = Config.get('BARCODE_NODE_GAP')
          var maxDepth = Variables.get('maxDepth')
          var subtreeDepth = maxDepth - alignObjDepth
          var wholeNodeNum = nodeDistribution.wholeNodeNum
          var nodeDistributionArray = []
          for (var item in nodeDistribution) {
            if (item !== 'wholeNodeNum') {
              nodeDistributionArray.push(nodeDistribution[item])
            }
          }
          var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
          var DURATION = Config.get('TRANSITON_DURATION')
          //  因为默认存在 barcodeHeight / 8的向下的偏移
          var summaryRectY = 0
          var singleComparisonHeightWithPadding = self.get_comparison_summary_height(subtreeDepth)
          var singleComparisonHeight = singleComparisonHeightWithPadding * 0.9
          var summaryYLocIndex = 0
          var nodeDistributionSummary = self.d3el.select('#barcode-container')
            .selectAll('.' + alignObjId)
            .data(nodeDistributionArray)
          nodeDistributionSummary.enter()
            .append('rect')
            .attr('class', 'stat-summary ' + alignObjId)
            .attr('id', function (d, i) {
              return 'stat-summary-' + alignObjIndex + '-' + i
            })
            .attr('width', function (d, i) {
              var nodeDistriutionNum = +d
              return nodeDistriutionNum / wholeNodeNum * comparisonResultsPadding
            })
            .attr('height', singleComparisonHeight)
            .attr('x', function (d, i) {
              var summaryRectWidth = +d / wholeNodeNum * comparisonResultsPadding
              var rangeStartNodeX = initRangeStartNodeX - barcodeNodeGap - summaryRectWidth
              return rangeStartNodeX
            })
            .attr('y', function (d, i) {
              return summaryRectY + singleComparisonHeightWithPadding * i
            })
            .style('fill', function (d, i) {
              var depth = alignObjDepth + i
              return barcodeNodeColorArray[depth]
            })
            .style('visibility', function () {
              return aligned_summary_visible_state(alignObjId)
            })
          nodeDistributionSummary.transition()
            .duration(DURATION)
            .attr('width', function (d, i) {
              var nodeDistriutionNum = +d
              return nodeDistriutionNum / wholeNodeNum * comparisonResultsPadding
            })
            .attr('height', singleComparisonHeight)
            .attr('x', function (d, i) {
              var summaryRectWidth = +d / wholeNodeNum * comparisonResultsPadding
              var rangeStartNodeX = initRangeStartNodeX - barcodeNodeGap - summaryRectWidth
              return rangeStartNodeX
            })
            .attr('y', function (d, i) {
              return summaryRectY + singleComparisonHeightWithPadding * i
            })
            .style('fill', function (d, i) {
              var depth = alignObjDepth + i
              return barcodeNodeColorArray[depth]
            })
            .style('visibility', function () {
              return aligned_summary_visible_state(alignObjId)
            })
          nodeDistributionSummary.exit().remove()
          // for (var depth = 0; depth < maxDepth; depth++) {
          //   if (typeof(nodeDistribution[depth]) !== 'undefined') {
          //     var summaryRectWidth = nodeDistribution[depth] / wholeNodeNum * comparisonResultsPadding
          //     // rangeStartNodeX = rangeStartNodeX - summaryRectWidth - barcodeNodeGap
          //     var rangeStartNodeX = initRangeStartNodeX - barcodeNodeGap - summaryRectWidth
          //     if (!isNaN(rangeStartNodeX)) {
          //       var itemIndex = depth
          //       if (self.d3el.select('#stat-summary-' + alignObjIndex + '-' + itemIndex).empty()) {
          //         self.d3el.select('#barcode-container')
          //           .append('rect')
          //           .attr('class', 'stat-summary ' + alignObjId)
          //           .attr('id', 'stat-summary-' + alignObjIndex + '-' + itemIndex)
          //           .attr('width', summaryRectWidth)
          //           .attr('height', singleComparisonHeight)
          //           .attr('x', rangeStartNodeX)
          //           .attr('y', summaryRectY + singleComparisonHeightWithPadding * summaryYLocIndex)
          //           .style('fill', barcodeNodeColorArray[depth])
          //           .style('visibility', function () {
          //             return aligned_summary_visible_state(alignObjId)
          //           })
          //         self.d3el.select('#barcode-container')
          //           .select('#stat-summary-' + alignObjIndex + '-' + itemIndex)
          //           .transition()
          //           .duration(DURATION)
          //           .attr('width', summaryRectWidth)
          //           .attr('height', singleComparisonHeight)
          //           .attr('x', rangeStartNodeX)
          //           .attr('y', summaryRectY + singleComparisonHeightWithPadding * summaryYLocIndex)
          //           .style('visibility', function () {
          //             return aligned_summary_visible_state(alignObjId)
          //           })
          //       } else {
          //         self.d3el.select('#barcode-container')
          //           .select('#stat-summary-' + alignObjIndex + '-' + itemIndex)
          //           .transition()
          //           .duration(DURATION)
          //           .attr('width', summaryRectWidth)
          //           .attr('height', singleComparisonHeight)
          //           .attr('x', rangeStartNodeX)
          //           .attr('y', summaryRectY + singleComparisonHeightWithPadding * summaryYLocIndex)
          //           .style('fill', barcodeNodeColorArray[depth])
          //           .style('visibility', function () {
          //             return aligned_summary_visible_state(alignObjId)
          //           })
          //       }
          //     }
          //     summaryYLocIndex = summaryYLocIndex + 1
          //   }
          // }
        }

        function aligned_summary_visible_state(alignObjId) {
          var barcodeCollection = window.Datacenter.barcodeCollection
          if (barcodeCollection.get_summary_state(alignObjId)) {
            return 'visible'
          } else {
            return 'hidden'
          }
        }
      }
      ,
      /**
       *  计算增加,减少的柱状图的高度
       */
      get_add_miss_summary_height: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeComparisonHeight = barcodeHeight * 0.8
        var addMissCategoryNum = 3
        var singleComparisonHeightWithPadding = barcodeComparisonHeight / addMissCategoryNum
        return singleComparisonHeightWithPadding
      }
      ,
      /**
       * 计算comparison summary的柱状图的高度
       */
      get_comparison_summary_height: function (subtree_depth) {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeComparisonHeight = barcodeHeight * 0.8
        var maxDepth = Variables.get('maxDepth')
        var singleComparisonHeightWithPadding = barcodeComparisonHeight / subtree_depth
        return singleComparisonHeightWithPadding
      }
      ,
      /**
       * 点击barcode节点, 首先padding node先收缩, 然后aligned node的位置移动,然后出现non existed的节点
       */
      shrink_barcode_tree: function () {
        var self = this
        self.update_padding_barcode_node(self.update_aligned_barcode_node.bind(self))
      }
      ,
      /**
       * 点击covered rect节点, 先移动aligned节点, 然后将padding节点移动
       */
      move_aligned_first_stretch_padding_next_update: function () {
        var self = this
        self.update_aligned_barcode_node_concurrent()
      }
      ,
      /**
       * 点击barcode收缩时先判断动画是否结束
       * @param transition
       * @param callback
       */
      endall: function (transition, callback) {
        if (transition.size() === 0) {
          callback()
        }
        var n = 0;
        transition
          .each(function () {
            ++n;
          })
          .each("end", function () {
            if (!--n) callback.apply(this, arguments);
          });
      }
      ,
      /**
       *  根据当前barcode collection中的记录, 绘制折叠的barcode子树的三角形
       */
      add_collapsed_triangle: function () {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var collapsedNodeIdArray = barcodeCollection.get_collapsed_nodes_id()
        d3.select('#barcodetree-svg').selectAll('.collapse-triangle#' + barcodeTreeId).remove()
        for (var cI = 0; cI < collapsedNodeIdArray.length; cI++) {
          self.add_single_collapsed_triangle(collapsedNodeIdArray[cI])
        }
      }
      ,
      /**
       *  根据节点id在节点的底部增加代表节点所代表子树的三角形
       */
      add_single_collapsed_triangle: function (nodeId) {
        var self = this
        var depthAttrPrefix = 'depth-'
        var triangleYPadding = 1
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var subtreeHeight = get_subtree_height(nodeId, barcodeNodeAttrArray)
        var subtreeWidth = get_subtree_width(nodeId, barcodeNodeAttrArray)
        append_triangle(nodeId, subtreeHeight, subtreeWidth)
        //  在barcodeTree中增加triangle
        function append_triangle(node_id, subtree_height, subtree_width) {
          var selectedNode = self.d3el.select('#barcode-container')
            .select('#' + node_id)
          if (self.d3el.select('#barcode-container').select('#' + node_id).empty()) {
            return
          }
          var treeDataModel = self.model
          var barcodeTreeId = treeDataModel.get('barcodeTreeId')
          var barcodePaddingTop = treeDataModel.get('barcodePaddingTop')
          var barcodePaddingLeft = self.barcodePaddingLeft
          var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')

          var nodeX = +selectedNode.attr('x')
          var nodeY = +selectedNode.attr('y')
          var nodeWidth = +selectedNode.attr('width')
          var nodeHeight = +selectedNode.attr('height')
          var triangleY = nodeY + nodeHeight + triangleYPadding
          var triangleX = nodeX + nodeWidth / 2

          var triangleSvgY = barcodeTreeYLocation + barcodePaddingTop + triangleY
          var triangleSvgX = barcodePaddingLeft + triangleX

          subtree_height = subtree_height * 2
          //  三角形的直线的点的数据
          var lineData = [{"x": 0, "y": 0}, {"x": -subtree_width / 2, "y": subtree_height},
            {"x": subtree_width / 2, "y": subtree_height}, {"x": 0, "y": 0}]
          //  将三角形上的点连接成直线
          var lineFunction = d3.svg.line()
            .x(function (d) {
              return d.x;
            })
            .y(function (d) {
              return d.y;
            })
            .interpolate("linear");
          //  在svg上面绘制path
          var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
          var lineGraph = d3.select('#barcodetree-svg')
            .append("path")
            .attr('class', 'collapse-triangle')
            .attr('id', barcodeTreeId)
            .attr("d", lineFunction(lineData))
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr('transform', 'translate(' + triangleSvgX + ',' + triangleSvgY + ')')
        }

        //  获取节点为根的子树的高度
        function get_subtree_height(nodeId, barcodeNodeAttrArray) {
          var leveledNodeObj = get_leveled_node_obj(nodeId, barcodeNodeAttrArray)
          var itemNum = 0
          for (var item in leveledNodeObj) {
            itemNum = itemNum + 1
          }
          return itemNum
        }

        //  获取节点为根的子树的宽度
        function get_subtree_width(nodeId, barcodeNodeAttrArray) {
          var leveledNodeObj = get_leveled_node_obj(nodeId, barcodeNodeAttrArray)
          var treeWidth = 0
          for (var item in leveledNodeObj) {
            var barcodeLevelWidth = leveledNodeObj[item]
            if (barcodeLevelWidth > treeWidth) {
              treeWidth = barcodeLevelWidth
            }
          }
          return treeWidth
        }

        //  将以节点为根节点的子树中的所有节点进行分层
        function get_leveled_node_obj(nodeId, barcodeNodeAttrArray) {
          var nodeDepth = 0
          var nodeStartIndex = 0
          var nodeEndIndex = 0
          for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
            if (barcodeNodeAttrArray[bI].id === nodeId) {
              nodeStartIndex = bI
              nodeDepth = barcodeNodeAttrArray[bI].depth
              break
            }
          }
          for (var bI = (nodeStartIndex + 1); bI < barcodeNodeAttrArray.length; bI++) {
            if (barcodeNodeAttrArray[bI].depth === nodeDepth) {
              nodeEndIndex = bI
              break
            }
          }
          var leveledNodeObj = {}
          var barcodeWidthArray = Variables.get('barcodeWidthArray')
          for (var bI = nodeStartIndex; bI < nodeEndIndex; bI++) {
            var nodeDepth = barcodeNodeAttrArray[bI].depth
            if (barcodeWidthArray[nodeDepth] !== 0) {
              var nodeDepthAttrName = depthAttrPrefix + nodeDepth
              if (typeof (leveledNodeObj[nodeDepthAttrName]) !== 'undefined') {
                //  已经被初始化了
                leveledNodeObj[nodeDepthAttrName] = +leveledNodeObj[nodeDepthAttrName] + 1
              } else {
                //  还没有被初始化, 则设置初始值为1
                leveledNodeObj[nodeDepthAttrName] = 1
              }
            }
          }
          return leveledNodeObj
        }
      }
      ,
      /**
       * 在barcode的背景上的节点上增加点击与双击的事件
       */
      add_barcode_dbclick_click_handler: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeCollection = window.Datacenter.barcodeCollection
        var cc = clickcancel()
        self.d3el.selectAll('.bg').call(cc)
        cc.on('click', function (el) {
          if (self.is_open_options_button()) {
            self.trigger_remove_option_button()
          } else {
            if (d3.select(el.srcElement).classed('compare-based-selection')) {
              // self.trigger_unclick_event()
              self.remove_compare_based_anchor()
              barcodeCollection.unset_based_model(barcodeTreeId)
            } else {
              //  点击barcode的背景矩形的响应函数
              // self.trigger_click_event()
              self.add_compare_based_anchor()
              barcodeCollection.set_based_model(barcodeTreeId)
            }
          }
        })
        cc.on('dblclick', function (el) {

        })
        function clickcancel(d, i) {
          var event = d3.dispatch('click', 'dblclick');

          function cc(selection) {
            var down,
              tolerance = 5,
              last,
              wait = null;
            // euclidean distance
            function dist(a, b) {
              return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
            }

            selection.on('mousedown', function () {
              down = d3.mouse(document.body);
              last = +new Date();
            });
            selection.on('mouseup', function () {
              if (dist(down, d3.mouse(document.body)) > tolerance) {
                return;
              } else {
                if (wait) {
                  window.clearTimeout(wait);
                  wait = null;
                  event.dblclick(d3.event);
                } else {
                  wait = window.setTimeout((function (e) {
                    return function () {
                      event.click(e);
                      wait = null;
                    };
                  })(d3.event), 300);
                }
              }
            });
          };
          return d3.rebind(cc, event, 'on');
        }
      }
      ,
      /**
       * 单击barcode节点的事件
       */
      single_click_handler: function (nodeData, nodeObj) {
        var self = this
        //  在barcode节点上增加option的按钮
        self.add_singletree_node_options_button(nodeData, nodeObj)
      }
      ,
      node_selection_click_handler: function (nodeData) {
        var self = this
        var barcodeModel = self.model
        var barcodeCollection = window.Datacenter.barcodeCollection
        var siblingNodes = barcodeModel.find_sibling_nodes(nodeData)
        barcodeCollection.add_selected_node_id(nodeData.id, nodeData.depth, siblingNodes)
      }
      ,
      subtree_selection_click_handler: function (nodeData) {
        var self = this
        var barcodeModel = self.model
        var barcodeCollection = window.Datacenter.barcodeCollection
        var childrenNodes = barcodeModel.find_children_nodes(nodeData)
        var siblingNodes = barcodeModel.find_sibling_nodes(nodeData)
        barcodeCollection.add_selected_subtree_id(nodeData.id, nodeData.depth, childrenNodes, siblingNodes)
      }
      ,
      unselection_click_handler: function (nodeData) {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        barcodeCollection.remove_selection(nodeData.id)
        self.trigger_mouseout_event()
      }
      ,
      subtree_uncollapse_handler: function (nodeData) {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        barcodeCollection.uncollapse_subtree(nodeData.id, nodeData.depth)
      }
      ,
      subtree_collapse_handler: function (nodeData) {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        barcodeCollection.collapse_subtree(nodeData.id, nodeData.depth)
      }
      ,
      /**
       * 在barcode的节点上增加点击与双击的事件
       */
      add_node_dbclick_click_handler: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeCollection = window.Datacenter.barcodeCollection
        var cc = clickcancel()
        self.d3el.selectAll('.barcode-node').call(cc)
        cc.on('dblclick', function (el) {
          var nodeObj = d3.select(el.srcElement)
          var nodeData = nodeObj.data()[0]
          // self.single_click_handler(nodeData, el.srcElement)
          var nodeObjId = nodeData.id
          var nodeObjDepth = nodeData.depth
          //  获取当前点击的barcode节点的状态, 绘制的时候绘制相应的状态
          //  子树或者节点的选择状态
          // 返回的子树或者节点的选择状态主要包括 NOT_SELECTED NODE SUBTREE
          var selection_state = barcodeCollection.get_selection_state(nodeObjId, nodeObjDepth)
          if (selection_state === Config.get('CONSTANT')['NODE']) {
            //  当前处在node selection的状态
            // self.unselection_click_handler(nodeData)
            if (window.press_cmd) { //  当前cmd按键正在按下
              removeCurrentEditIcon() // 删除标识正在编辑的icon
              barcodeCollection.unselection_click_handler(nodeData) // 取消选择barcode中的节点
              var selectedObj = barcodeCollection.remove_operation_item(nodeData) // 删除正在编辑序列中的节点
              self.add_current_selected_icon()//  增加正在编辑的节点的icon
              if (typeof (selectedObj) !== 'undefined') {
                var updatedSrcElement = selectedObj.srcElement
                var updateBarcodeTreeId = selectedObj.barcodeTreeId
                self.add_current_edit_icon(updatedSrcElement, updateBarcodeTreeId)
                window.operated_node = selectedObj.nodeData
                window.operated_tree_id = selectedObj.barcodeTreeId
              } else {
                removeCurrentEditIcon()
                delete window.operated_node
                delete window.operated_tree_id
              }
            }
          } else if ((selection_state === Config.get('CONSTANT')['NOT_SELECTED']) || (selection_state === Config.get('CONSTANT')['SUBTREE'])) {
            //  当前处在node unselection的状态
            // self.node_selection_click_handler(nodeData)
            var srcElement = el.srcElement
            self.add_current_edit_icon(srcElement, barcodeTreeId)
            if (!window.press_cmd) {
              barcodeCollection.clear_selected_subtree_id()
              barcodeCollection.clear_operation_item()
            }
            self.add_current_selected_icon()
            barcodeCollection.node_selection_click(nodeData, barcodeTreeId)
            barcodeCollection.add_operation_item(nodeData, barcodeTreeId, srcElement)
            window.operated_node = nodeData
            window.operated_tree_id = barcodeTreeId
          }
          self.trigger_mouseout_event()
        });
        cc.on('click', function (el) {
          var nodeObj = d3.select(el.srcElement)
          var nodeData = nodeObj.data()[0]
          var nodeObjId = nodeData.id
          var nodeObjDepth = nodeData.depth
          var align_state = barcodeCollection.get_current_aligned_state()
          var srcElement = el.srcElement
          if (!align_state) {
            //  在非align状态下点击的响应函数
            var selection_state = barcodeCollection.get_selection_state(nodeObjId, nodeObjDepth)
            if (selection_state === Config.get('CONSTANT')['SUBTREE']) {
              //  当前处在subtree selection的状态
              // self.unselection_click_handler(nodeData)
              if (window.press_cmd) {
                removeCurrentEditIcon()
                barcodeCollection.unselection_click_handler(nodeData)
                var selectedObj = barcodeCollection.remove_operation_item(nodeData)
                self.add_current_selected_icon()
                if (typeof (selectedObj) !== 'undefined') {
                  var updatedSrcElement = selectedObj.srcElement
                  var updateBarcodeTreeId = selectedObj.barcodeTreeId
                  self.add_current_edit_icon(updatedSrcElement, updateBarcodeTreeId, nodeObjId)
                  window.operated_node = selectedObj.nodeData
                  window.operated_tree_id = selectedObj.barcodeTreeId
                } else {
                  removeCurrentEditIcon()
                  delete window.operated_node
                  delete window.operated_tree_id
                }
              }
            } else if ((selection_state === Config.get('CONSTANT')['NOT_SELECTED']) || (selection_state === Config.get('CONSTANT')['NODE'])) {
              //  当前处在subtree unselection的状态
              // self.subtree_selection_click_handler(nodeData)
              self.add_current_edit_icon(srcElement, barcodeTreeId, nodeObjId)
              //  如果没有按下cmd按键, 则清空所有选择的子树节点, 清空所有的选择节点序列
              if (!window.press_cmd) {
                barcodeCollection.clear_selected_subtree_id()
                barcodeCollection.clear_operation_item()
              }
              self.add_current_selected_icon()
              //  subtree_selection_click是在selectedNodesIdObj中增加选择的节点
              barcodeCollection.subtree_selection_click(nodeData, barcodeTreeId)
              barcodeCollection.add_operation_item(nodeData, barcodeTreeId, srcElement)
              window.operated_node = nodeData
              window.operated_tree_id = barcodeTreeId
            }
          } else {
            //  在align状态下点击的响应函数
            window.aligned_operated_node = nodeData
            window.aligned_operated_tree_id = barcodeTreeId
            self.add_aligned_sort_icon(srcElement, barcodeTreeId, nodeObjId)
          }
          self.trigger_mouseout_event()
        });
        //  捕捉click事件,将他分发到不同的方法中进行处理
        function clickcancel(d, i) {
          var event = d3.dispatch('click', 'dblclick');

          function cc(selection) {
            var down,
              tolerance = 5,
              last,
              wait = null;
            // euclidean distance
            function dist(a, b) {
              return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
            }

            selection.on('mousedown', function () {
              down = d3.mouse(document.body);
              last = +new Date();
            });
            selection.on('mouseup', function () {
              if (dist(down, d3.mouse(document.body)) > tolerance) {
                return;
              } else {
                if (wait) {
                  window.clearTimeout(wait);
                  wait = null;
                  event.dblclick(d3.event);
                } else {
                  wait = window.setTimeout((function (e) {
                    return function () {
                      event.click(e);
                      wait = null;
                    };
                  })(d3.event), 300);
                }
              }
            });
          };
          return d3.rebind(cc, event, 'on');
        }

        //  删除barcode的节点上方增加icon
        function removeCurrentEditIcon(src_element) {
          d3.selectAll('.edit-icon').remove()
        }
      }
      ,
      // 更新当前选择的节点的icon
      update_current_selected_icon: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeCollection = window.Datacenter.barcodeCollection
        var operationItemList = barcodeCollection.get_operation_item()
        for (var oI = 0; oI < operationItemList.length; oI++) {
          var nodeData = operationItemList[oI].nodeData
          var operationBarcodeTreeId = operationItemList[oI].barcodeTreeId
          var operationSrcElement = operationItemList[oI].srcElement
          var operationNodeObjId = nodeData.id
          if (operationBarcodeTreeId === barcodeTreeId) {
            self._update_single_selection_icon(operationSrcElement, operationBarcodeTreeId, operationNodeObjId)
          }
        }
      }
      ,
      _update_single_selection_icon: function (src_element, barcodeTreeId, nodeObjId) {
        var self = this
        var nodeX = +d3.select(src_element).attr('x')
        var nodeWidth = +d3.select(src_element).attr('width')
        var nodeY = +d3.select(src_element).attr('y')
        var nodeHeight = +d3.select(src_element).attr('height')
        var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
        var iconX = nodeX + nodeWidth / 2
        var iconY = nodeY + nodeHeight / 2
        d3.select('g#' + barcodeTreeId)
          .select('#barcode-container')
          .select('.select-icon')
          .attr('x', iconX)
          .attr('y', iconY)
          .style('font-size', (iconSize + 2) + 'px')
      }
      ,
      // 增加当前选择的节点的icon
      add_current_selected_icon: function () {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        var operationItemList = barcodeCollection.get_operation_item()
        d3.selectAll('.select-icon').remove()
        console.log('operationItemList', operationItemList)
        for (var oI = 0; oI < operationItemList.length; oI++) {
          var nodeData = operationItemList[oI].nodeData
          var barcodeTreeId = operationItemList[oI].barcodeTreeId
          var srcElement = operationItemList[oI].srcElement
          var nodeObjId = nodeData.id
          self._add_single_selection_icon(srcElement, barcodeTreeId, nodeObjId)
        }
      }
      ,
      // 增加单个当前选择的节点
      _add_single_selection_icon: function (src_element, barcodeTreeId, nodeObjId) {
        var nodeX = +d3.select(src_element).attr('x')
        var nodeWidth = +d3.select(src_element).attr('width')
        var nodeY = +d3.select(src_element).attr('y')
        var nodeHeight = +d3.select(src_element).attr('height')
        var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
        var iconX = nodeX + nodeWidth / 2
        var iconY = nodeY + nodeHeight / 2
        var selectIconColor = Variables.get('select_icon_color')
        d3.select('g#' + barcodeTreeId)
          .select('#barcode-container')
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('cursor', 'pointer')
          .attr('class', 'select-icon')
          .attr('id', nodeObjId)
          .attr('font-family', 'FontAwesome')
          .attr('x', iconX)
          .attr('y', iconY)
          .text('\uf08d')
          .style('fill', selectIconColor)
          .style('font-size', (iconSize + 2) + 'px')
      }
      ,
      //  在点击操作的barcode的节点上方增加icon
      add_current_edit_icon: function (src_element, barcodeTreeId, nodeObjId) {
        var nodeX = +d3.select(src_element).attr('x')
        var nodeWidth = +d3.select(src_element).attr('width')
        var nodeY = +d3.select(src_element).attr('y')
        var nodeHeight = +d3.select(src_element).attr('height')
        var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
        var iconX = nodeX + nodeWidth / 2
        var iconY = nodeY + nodeHeight / 2
        d3.selectAll('.edit-icon').remove()
        var editIconColor = Variables.get('edit_icon_color')
        d3.select('g#' + barcodeTreeId)
          .select('#barcode-container')
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('cursor', 'pointer')
          .attr('class', 'edit-icon')
          .attr('id', nodeObjId)
          .attr('font-family', 'FontAwesome')
          .attr('x', iconX)
          .attr('y', iconY)
          .text('\uf08d')
          .style('fill', editIconColor)
          .style('font-size', (iconSize + 2) + 'px')
      }
      ,
      update_current_edit_icon: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var waitTime = Config.get('TRANSITON_DURATION')
        if (barcodeTreeId === window.operated_tree_id) {
          var nodeData = window.operated_node
          var nodeDataId = nodeData.id
          var nodeX = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('x')
          var nodeWidth = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('width')
          var nodeY = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('y')
          var nodeHeight = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('height')
          var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
          var iconX = nodeX + nodeWidth / 2
          var iconY = nodeY + nodeHeight / 2
          d3.select('g#' + barcodeTreeId)
            .select('#barcode-container')
            .select('.edit-icon')
            .attr('x', iconX)
            .attr('y', iconY)
            .style('font-size', (iconSize + 2) + 'px')
        }
      }
      ,
      // 增加当前选择的节点的icon
      add_aligned_sort_icon: function (src_element, barcodeTreeId, nodeObjId) {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        var align_state = barcodeCollection.get_current_aligned_state()
        //  只有在align的状态下才会增加align的icon
        if (!align_state)
          return
        var nodeX = +d3.select(src_element).attr('x')
        var nodeWidth = +d3.select(src_element).attr('width')
        var nodeY = +d3.select(src_element).attr('y')
        var nodeHeight = +d3.select(src_element).attr('height')
        var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
        var iconX = nodeX + nodeWidth / 2
        var iconY = nodeY + nodeHeight / 2
        d3.select('g#' + barcodeTreeId).select('.align-sort-icon').remove()
        var selectIconColor = Variables.get('select_icon_color')
        d3.select('g#' + barcodeTreeId)
          .select('#barcode-container')
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('cursor', 'pointer')
          .attr('class', 'align-sort-icon')
          .attr('id', nodeObjId)
          .attr('font-family', 'FontAwesome')
          .attr('x', iconX)
          .attr('y', iconY)
          .text('\uf0dc')
          .style('fill', selectIconColor)
          .style('font-size', (iconSize + 2) + 'px')
      }
      ,
      // 更新当前选择的节点的icon
      update_aligned_sort_icon: function (src_element, barcodeTreeId, nodeObjId) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        if (barcodeTreeId === window.aligned_operated_tree_id) {
          var nodeData = window.aligned_operated_node
          var nodeDataId = nodeData.id
          var nodeX = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('x')
          var nodeWidth = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('width')
          var nodeY = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('y')
          var nodeHeight = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('height')
          var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
          var iconX = nodeX + nodeWidth / 2
          var iconY = nodeY + nodeHeight / 2
          d3.select('g#' + barcodeTreeId)
            .select('#barcode-container')
            .select('.align-sort-icon')
            .attr('x', iconX)
            .attr('y', iconY)
            .style('font-size', (iconSize + 2) + 'px')
        }
      }
      ,
      /**
       *  判断options按钮是否打开的判断函数
       */
      is_open_options_button: function () {
        return !d3.select('.barcode-icon-bg').empty()
      }
      ,
      /**
       *  删除options按钮的节点
       */
      remove_options_button: function () {
        var self = this
        var treeDataModel = self.model
        var thisNodeObj = self.clickedObject
        var barcodePaddingLeft = self.barcodePaddingLeft
        var DURATION = 500
        if (thisNodeObj == null) {
          return
        }
        var thisX = +d3.select(thisNodeObj).attr('x') + 1
        var thisY = +d3.select(thisNodeObj).attr('y') - 1
        var thisWidth = +d3.select(thisNodeObj).attr('width')
        var iconSide = Variables.get('superTreeHeight') * 0.3
        var iconPadding = 2
        var barcodeConfigFontSize = 12
        var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')
        var barcodePaddingTop = treeDataModel.get('barcodePaddingTop')
        var barcodePaddingLeft = self.barcodePaddingLeft
        var basedY = barcodePaddingTop + barcodeTreeYLocation
        var basedX = barcodePaddingLeft
        var iconArray = [
          {'iconName': 'compress', 'iconCode': '\uf066'}, {'iconName': 'expand', 'iconCode': '\uf065'},
          {'iconName': 'sort-amount-asc', 'iconCode': '\uf160'}, {
            'iconName': 'sort-amount-desc',
            'iconCode': '\uf161'
          }]
        //  更新barcode的背景矩形的位置
        var barcodeIconBg = d3.select('.barcode-tree-single-g')
          .selectAll('.barcode-icon-bg')
          .transition()
          .duration(DURATION)
          .attr('x', function (d, i) {
            return basedX + thisX + thisWidth / 2 - iconSide / 2
          })
          .attr('y', basedY + iconSide)
          .attr('height', iconSide - 1)
          .attr('width', iconSide)
          .style('opacity', 0)
          .call(self.endall, function (d, i) {
            d3.select('.barcode-tree-single-g').selectAll('.barcode-icon-bg').remove()
          })
        //  更新barcode的图标的位置
        var barcodeIcon = d3.select('.barcode-tree-single-g')
          .selectAll('.barcode-g-icon')
          .transition()
          .duration(DURATION)
          .attr('x', function (d, i) {
            return basedX + thisX + thisWidth / 2
          })
          .attr('y', basedY + iconSide + iconSide / 2)
          .attr('height', iconSide - 1)
          .attr('width', iconSide)
          .style('opacity', 0)
          .call(self.endall, function (d, i) {
            d3.select('.barcode-tree-single-g').selectAll('.barcode-g-icon').remove()
          })
      }
      ,
      //  删除该align对象所对应的summary state的柱状图
      remove_summary_state: function (nodeObjId) {
        var self = this
        self.d3el.selectAll('.stat-summary.' + nodeObjId).style('visibility', 'hidden')
        self.d3el.selectAll('.add-miss-summary.' + nodeObjId).style('visibility', 'hidden')
      }
      ,
      //  展示该align对象所对应的summary state的柱状图
      show_summary_state: function (nodeObjId) {
        var self = this
        self.d3el.selectAll('.stat-summary.' + nodeObjId).style('visibility', 'visible')
        self.d3el.selectAll('.add-miss-summary.' + nodeObjId).style('visibility', 'visible')
      }
      ,
      /**
       * hover padding节点
       * @param d
       * @param i
       */
      padding_nodes_mouseover_handler: function (d, i) {
      }
      ,
      /**
       * click节点, 对齐当前的子树
       */
      subtree_align_handler: function (nodeData, finishAlignDeferObj) {
        var self = this
        var alignedLevel = Variables.get('alignedLevel')
        self.node_click_handler(nodeData, alignedLevel, finishAlignDeferObj)
      }
      ,
      /**
       * 再次click节点, 取消对于当前的subtree的对齐
       */
      subtree_unalign_handler: function (nodeData, finishRemoveAlignDeferObj) {
        var self = this
        var nodeLevel = nodeData.depth
        self.node_unclick_handler(nodeData, nodeLevel, finishRemoveAlignDeferObj)
      }
      ,
      /**
       * 点击focus选项的按钮
       * @param d
       * @param nodeIndex
       * @param globalObj
       */
      node_click_handler: function (d, alignedLevel, finishAlignDeferObj) {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        var rootLevel = 0
        self.node_mouseout_handler()
        //  打开上方的supertree视图
        self.open_supertree_view()
        //  点击的是root节点之外的其他的节点, 那么进入上面的判断条件
        // if ((Variables.get('alignedLevel') === rootLevel)) {//!((d.category === 'root') &&
        if (!d3.select(this.el).classed('node-missed')) {
          //  model中的节点需要使用其他的model中的节点进行填充
          barcodeCollection.add_super_subtree(d.id, d.depth, d.category, alignedLevel, finishAlignDeferObj)
        }
        // }
        // if (!d3.select(this.el).classed('node-missed')) {
        //   //  model中的节点需要使用其他的model中的节点进行填充
        //   treeDataModel.align_node(d.id, d.depth, d.category)
        // }
      }
      ,
      /**
       * 再次点击focus选项的按钮, 取消focus
       * @param d
       * @param nodeIndex
       * @param globalObj
       */
      node_unclick_handler: function (d, alignedLevel, finishRemoveAlignDeferObj) {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        var rootLevel = 0
        self.node_mouseout_handler()
        //  点击的是root节点之外的其他的节点, 那么进入上面的判断条件
        // if ((Variables.get('alignedLevel') === rootLevel)) {//!((d.category === 'root') &&
        if (!d3.select(this.el).classed('node-missed')) {
          //  model中的节点需要使用其他的model中的节点进行填充
          barcodeCollection.remove_super_subtree(d.id, d.depth, d.category, alignedLevel, finishRemoveAlignDeferObj)
        }
        // }
        // if (!d3.select(this.el).classed('node-missed')) {
        //   //  model中的节点需要使用其他的model中的节点进行填充
        //   treeDataModel.align_node(d.id, d.depth, d.category)
        // }
      }
      ,
      /**
       * 高亮所有的相关节点
       */
      higlight_all_related_nodes: function (nodeObj) {
        var self = this
        var treeDataModel = self.model
        var findingNodesObj = treeDataModel.find_related_nodes(nodeObj)
        self.highlight_finding_node(findingNodesObj)
      }
      ,
      /**
       * 鼠标离开节点的handler
       * @param d i globalObj
       * @returns {boolean}
       */
      node_mouseover_handler: function (d, i, globalObj) {
        var self = this
        var tipValue = null
        var treeDataModel = self.model
        // //  取消在选择状态的所有的高亮
        // globalObj.cancel_selection_highlight()
        // globalObj.cancel_selection_unhighlightNodes()
        globalObj.trigger_mouseout_event()
        globalObj.node_mouseout_handler()
        if (d3.event.isTrusted) {
          var barcodeTreeId = treeDataModel.get('barcodeTreeId')
          Variables.set('currentHoveringBarcodeId', barcodeTreeId)
        }
        self.hoveringNodeId = d.id
        var tip = window.tip
        if (d.existed) {
          //  在将d3-tip的类变成d3-tip-flip的情况下, 需要将d3-tip-flip再次变成d3-tip
          $('.d3-tip-flip').removeClass('d3-tip-flip').addClass('d3-tip')
          if (typeof(d.categoryName) !== 'undefined') {
            tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + d.category + '-' + d.categoryName + ", num: " + d.num + "</span></span>"
          } else {
            tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + d.category + "</span></span>"
          }
          tip.show(tipValue)
          flipTooltipLeft()
          flipTooltipRight()
          globalObj.trigger_hovering_event()
          self.unhighlight_barcode_bg()
          self.d3el.select('.bg').classed('hovering-highlight', true)
          var findingNodesObj = treeDataModel.find_related_nodes(d)
          var thisNodeObj = d
          globalObj.trigger_hovering_node_event(thisNodeObj, findingNodesObj)
        }
        function flipTooltipLeft() {
          var d3TipLeft = $(".d3-tip").position().left
          if (d3TipLeft < 0) {
            var tipLeft = d3TipLeft - 10
            $('#tip-content').css({left: -tipLeft});
          }
        }

        function flipTooltipRight() {
          var d3TipLeft = $(".d3-tip").position().left
          var d3TipWidth = $('#tip-content').width()
          //  柱状图视图的宽度
          var divWidth = $('#histogram-main-panel').width()
          if ((d3TipLeft + d3TipWidth) > divWidth) {
            var tipDivLeft = (d3TipLeft + d3TipWidth) - divWidth
            $('#tip-content').css({left: -tipDivLeft});
          }
        }
      }
      ,
      /**
       * 点击padding节点
       * @param d compactNodeIndex
       * @returns {boolean}
       */
      padding_nodes_click_handler: function (d, compactNodeIndex) {
        var self = this
        var paddingNodeId = 'padding-node-' + d.paddingNodeStartIndex + '-' + d.paddingNodeEndIndex
        for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
          var thisPaddingNodeId = 'padding-node-' + paddingNodeObjArray[pI].paddingNodeStartIndex + '-' + paddingNodeObjArray[pI].paddingNodeEndIndex
          if (paddingNodeId === thisPaddingNodeId) {
            if (paddingNodeObjArray[pI].isCompact) {
              window.Datacenter.barcodeCollection.update_global_compact(pI)
            }
          }
        }
      }
      ,
      /**
       * 判断节点是否是aligned范围, 如果属于aligned范围, 那么绘制节点; 否则这些节点不会被绘制
       * @param nodeIndex
       * @returns {boolean}
       */
      isBelongAligned: function (nodeIndex, alignedRangeObjArray, paddingNodeObjArray) {
        var self = this
        if (alignedRangeObjArray.length === 0) {
          return true
        } else {
          for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
            var rangeStartNodeIndex = alignedRangeObjArray[aI].rangeStartNodeIndex
            var rangeEndNodeIndex = alignedRangeObjArray[aI].rangeEndNodeIndex
            if ((nodeIndex >= rangeStartNodeIndex) && (nodeIndex <= rangeEndNodeIndex)) {
              return true
            }
          }
          for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
            if (!paddingNodeObjArray[pI].isCompact) {
              var paddingNodeStartIndex = paddingNodeObjArray[pI].paddingNodeStartIndex
              var paddingNodeEndIndex = paddingNodeObjArray[pI].paddingNodeEndIndex
              if ((nodeIndex >= paddingNodeStartIndex) && (nodeIndex <= paddingNodeEndIndex)) {
                return true
              }
            }
          }
        }
        return false
      }
      ,
      /**
       * 判断节点是否属于padding节点的范围
       * @param nodeIndex
       * @returns {boolean}
       */
      isBelongPadding: function (nodeIndex) {
        var self = this
        var treeDataModel = self.model
        var paddingNodeObjArray = self.get_padding_node_array()
        for (var pI = 0; pI < paddingNodeObjArray.length; pI++) {
          var paddingNodeStartIndex = paddingNodeObjArray[pI].paddingNodeStartIndex
          var paddingNodeEndIndex = paddingNodeObjArray[pI].paddingNodeEndIndex
          if (paddingNodeObjArray[pI].isCompact) {
            if ((nodeIndex >= paddingNodeStartIndex) && (nodeIndex <= paddingNodeEndIndex)) {
              return true
            }
          }
        }
        return false
      }
      ,
      /**
       * 判断节点是否存在
       * @param nodeIndex
       * @returns {boolean}
       */
      isExisted: function (nodeIndex) {
        var self = this
        var treeDataModel = self.model
        // TODO
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        if (barcodeNodeAttrArray[nodeIndex].existed) {
          return true
        } else {
          return false
        }
        return false
      }
      ,
      /**
       * 渲染覆盖在padding barcode上面带有纹理的矩形
       */
      render_padding_cover_rect: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeNodeHeight = treeDataModel.get('barcodeNodeHeight') * 0.8
        var paddingNodeObjArray = self.get_padding_node_array()
        var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
        self.d3el.select('#barcode-container')
          .selectAll('.padding-covered-rect')
          .remove()
        var paddingCoverRectObj = self.d3el.select('#barcode-container')
          .selectAll('.padding-covered-rect')
          .data(paddingNodeObjArray.filter(function (d, i) {
            return d.paddingNodeStartIndex <= d.paddingNodeEndIndex
          }), function (d, i) {
            return 'covered-rect-' + i
          })
        paddingCoverRectObj.enter()
          .append('rect')
          .attr('id', function (d, i) {
            return 'covered-rect-' + i
          })
          .attr('class', function (d, i) {
            return 'padding-covered-rect covered-rect-' + i
          })
          .attr('x', function (d, i) {
            if (isNaN(+d.paddingNodeX)) {
              return 0
            }
            return d.paddingNodeX
          })
          .attr('y', 0)
          .attr('width', function (d, i) {
            var startIndex = d.paddingNodeStartIndex
            var endIndex = d.paddingNodeEndIndex
            // if (startIndex > endIndex) {
            //   return 0
            // }
            if (d.isCompact) {
              return barcodeNodePadding
            } else {
              return 0
            }
          })
          .attr('height', barcodeNodeHeight)
          .style("fill", self.fill_style_handler.bind(self))
          .on('mouseover', function (d, i) {
            d3.select(this).style('fill', '#1F77B4')
            var startIndex = d.paddingNodeStartIndex
            var endIndex = d.paddingNodeEndIndex
            var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>range: " + startIndex + ' - ' + endIndex + "</span></span>"
            tip.show(tipValue)
          })
          .on('mouseout', function (d, i) {
            var nodeStyle = self.fill_style_handler(d, i)
            d3.select(this).style('fill', nodeStyle)
          })
          .on('click', self.padding_cover_click_handler.bind(self))
        paddingCoverRectObj.transition()
          .duration(Config.get('TRANSITON_DURATION'))
          .attr('x', function (d, i) {
            if (isNaN(+d.paddingNodeX)) {
              return 0
            }
            return d.paddingNodeX
          })
          .attr('y', 0)
          .attr('width', function (d, i) {
            var startIndex = d.paddingNodeStartIndex
            var endIndex = d.paddingNodeEndIndex
            // if (startIndex > endIndex) {
            //   return 0
            // }
            if (d.isCompact) {
              return barcodeNodePadding
            } else {
              return 0
            }
          })
          .attr('height', barcodeNodeHeight)
        paddingCoverRectObj.exit().remove()
      },
      padding_obj_mouseover_handler: function () {
        var self = this
      },
      fill_style_handler: function (d, i) {
        var self = this
        var nodeNum = self.get_node_number(d.paddingNodeStartIndex, d.paddingNodeEndIndex)
        var maxLeveledNumArray = Variables.get('maxLeveledNumArray')
        var partition = maxLeveledNumArray[4] / 6
        var styleIndex = Math.ceil(nodeNum / partition + 1)
        return "url(#diagonal-stripe-" + styleIndex + ")"
      },
      padding_cover_click_handler: function (d, i) {
        var self = this
        // window.Datacenter.barcodeCollection.changCompactMode(i)
        // window.Datacenter.barcodeCollection.update_click_covered_rect_attr_array()
      },
      /**
       * 计算某个范围内, 在某些层级上的节点数量
       */
      get_node_number: function (rangeStart, rangeEnd) {
        var self = this
        var treeDataModel = self.model
        var nodeNumber = 0
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var selectedLevels = Variables.get('selectedLevels')
        for (var bI = rangeStart; bI <= rangeEnd; bI++) {
          if (typeof (barcodeNodeAttrArray[bI]) !== 'undefined') {
            if ((barcodeNodeAttrArray[bI].existed) && (selectedLevels.indexOf(barcodeNodeAttrArray[bI].depth) !== -1)) {//barcodeNodeAttrArray[ bI ].depth < 4
              nodeNumber = nodeNumber + 1
            }
          } else {
            // console.log('bI', bI)
          }
        }
        return nodeNumber
      },
      /**
       * 鼠标离开节点
       */
      node_mouseout_handler: function (eventView) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        if (typeof (eventView) === "undefined") {
          tip.hide()
        }
        self.d3el.selectAll('.link-circle').remove()
        self.d3el.selectAll('.node-link').remove()
        self.d3el.selectAll('.children-highlight').style('fill', function (d, i) {
          return self.fill_handler(d, i, self)
        })
        self.d3el.selectAll('.father-highlight').style('fill', function (d, i) {
          return self.fill_handler(d, i, self)
        })
        self.d3el.selectAll('.sibling-highlight').classed('sibling-highlight', false)
        self.d3el.selectAll('.barcode-node').classed('unhighlight', false)
        //  更新原始的barcodeTree以及superTree中选择的节点
        self.highlight_selection_supertree_selection_nodes()
      }
      ,
      /**
       * 因为对于当前barcode的绘制是基于level的筛选的, 所以需要通过nodeId获取在实际的barcodeNodeAttrArray中的具体index值
       */
      get_node_index: function (nodeId) {
        var self = this
        var treeDataModel = self.model
        // TODO
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if (barcodeNodeAttrArray[bI].id === nodeId) {
            return bI
          }
        }
      }
      ,
      /**
       * 将该树中所有的节点的颜色变暗
       */
      unhighlightNodes: function () {
        var self = this
        self.d3el.selectAll('.barcode-node').classed('unhighlight', true)
      }
      ,
      /*
       *  高亮兄弟节点
       */
      highlightSiblingNodes: function (siblingNodesArray) {
        var self = this
        var currentSiblingNodesArray = []
        for (var sI = 0; sI < siblingNodesArray.length; sI++) {
          var currentSiblingNode = self.findCurrentNodeObj(siblingNodesArray[sI])
          if (currentSiblingNode != null) {
            currentSiblingNodesArray.push(currentSiblingNode)
          }
        }
        for (var sI = 0; sI < currentSiblingNodesArray.length; sI++) {
          self.d3el.select('#' + currentSiblingNodesArray[sI].id)
            .classed('sibling-highlight', true)
          self.d3el.select('#' + currentSiblingNodesArray[sI].id)
            .classed('unhighlight', true)
        }
      }
      ,
      /**
       * 高亮从根节点到当前节点路径上的节点
       */
      highlightFatherAndCurrentNodes: function (fatherNodesArray) {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
        var beginX = 0
        var endX = 0
        var currentFatherNodesArray = []
        for (var fI = 0; fI < fatherNodesArray.length; fI++) {
          var currentFatherNode = self.findCurrentNodeObj(fatherNodesArray[fI])
          if (currentFatherNode != null) {
            currentFatherNodesArray.push(currentFatherNode)
          }
        }
        for (var fI = 0; fI < currentFatherNodesArray.length; fI++) {
          if (currentFatherNodesArray[fI].width !== 0) {
            beginX = currentFatherNodesArray[fI].x + currentFatherNodesArray[fI].width / 2
            break
          }
        }
        for (var fI = (currentFatherNodesArray.length - 1); fI >= 0; fI--) {
          if (currentFatherNodesArray[fI].width !== 0) {
            endX = currentFatherNodesArray[fI].x + currentFatherNodesArray[fI].width / 2
            break
          }
        }
        var lineY = barcodeNodeHeight / 2
        var strokeWidth = barcodeNodeHeight / 10
        var radius = barcodeNodeHeight / 16
        self.d3el.select('#barcode-container')
          .append('line')
          .attr('class', 'node-link')
          .style('stroke-width', strokeWidth)
          .attr('x1', beginX)
          .attr('y1', lineY)
          .attr('x2', endX)
          .attr('y2', lineY)
        for (var fI = 0; fI < currentFatherNodesArray.length; fI++) {
          if (currentFatherNodesArray[fI].width !== 0) {
            var fatherNodeDepth = currentFatherNodesArray[fI].depth
            var circleX = currentFatherNodesArray[fI].x + currentFatherNodesArray[fI].width / 2
            var circleY = barcodeNodeHeight / 2
            self.d3el.select('#' + currentFatherNodesArray[fI].id)
              .classed('father-highlight', true)
              .style('fill', barcodeNodeColorArray[fatherNodeDepth])
            self.d3el.select('#' + currentFatherNodesArray[fI].id)
              .classed('unhighlight', false)
            self.d3el.select('#barcode-container')
              .append('circle')
              .attr('class', 'link-circle')
              .attr('cx', circleX)
              .attr('cy', circleY)
              .style('r', radius)
              .style('stroke', 'steelblue')
          }
        }
      }
      ,
      /**
       * 高亮孩子节点
       */
      highlightChildrenNodes: function (childrenNodesArray) {
        var self = this
        var currentChildrenNodesArray = []
        for (var sI = 0; sI < childrenNodesArray.length; sI++) {
          var currentChildrenNode = self.findCurrentNodeObj(childrenNodesArray[sI])
          if (currentChildrenNode != null) {
            currentChildrenNodesArray.push(currentChildrenNode)
          }
        }
        var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
        for (var cI = 0; cI < currentChildrenNodesArray.length; cI++) {
          var childrenNodeDepth = currentChildrenNodesArray[cI].depth
          self.d3el.select('#' + currentChildrenNodesArray[cI].id)
            .classed('children-highlight', true)
            .style('fill', barcodeNodeColorArray[childrenNodeDepth])
          self.d3el.select('#' + currentChildrenNodesArray[cI].id)
            .classed('unhighlight', false)
        }
      }
      ,
      /**
       * 根据其他视图传动的节点对象,找到在该视图中的节点
       * @param 其他视图传递的节点对象
       * @returns 在该视图中找到的节点对象, 如果没有找到则返回null
       */
      findCurrentNodeObj: function (nodeObj) {
        var self = this
        var treeDataModel = self.model
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var alignedRangeObjArray = self.get_aligned_range_array()
        var paddingNodeObjArray = self.get_padding_node_array()
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if ((barcodeNodeAttrArray[bI].depth === nodeObj.depth) && (barcodeNodeAttrArray[bI].id === nodeObj.id) && (barcodeNodeAttrArray[bI].existed) && (self.isBelongAligned(bI, alignedRangeObjArray, paddingNodeObjArray))) {
            return barcodeNodeAttrArray[bI]
          }
        }
        return null
      }
      ,
      /**
       * 高亮节点的总函数, 在这个对象中调用高亮孩子节点, 父亲等路径节点, 兄弟节点等节点
       * @param findingNodesObj: 传入的是找到的节点对象
       */
      highlight_finding_node: function (findingNodesObj) {
        var self = this
        self.unhighlightNodes()
        self.cancel_selection_unhighlightNodes()
        var childrenNodes = findingNodesObj.childrenNodes
        var fatherCurrentNodes = findingNodesObj.fatherCurrentNodes
        var siblingNodes = findingNodesObj.siblingNodes
        self.highlightChildrenNodes(childrenNodes)
        self.highlightFatherAndCurrentNodes(fatherCurrentNodes)
        self.highlightSiblingNodes(siblingNodes)
      }
      ,
      selection_update_handler: function () {
        var self = this
        //  点击之后想要马上看到点击的效果, 而不是将鼠标移开之后, 因此需要点击的时候将鼠标悬浮的效果去除掉
        self.node_mouseout_handler()
        self.highlight_selection_supertree_selection_nodes()
      }
      ,
      /**
       * 更新高亮在tree以及superTree中选择的节点
       */
      highlight_selection_supertree_selection_nodes: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var supertreeSelectedNodesIdObj = window.Datacenter.barcodeCollection.get_supertree_selected_nodes_id()
        //  首先将所有的节点取消selection的高亮
        self.cancel_selection_highlight()
        //  首先对所有的节点的透明度统一进行改变
        self.selection_unhighlightNodes()
        //  高亮从superTree中选择的节点
        for (var item in supertreeSelectedNodesIdObj) {
          var nodeId = item
          var nodeDepth = supertreeSelectedNodesIdObj[item]
          var relatedNodesObj = treeDataModel.find_related_nodes({id: nodeId, depth: nodeDepth})
          var selectedSiblingNodeObjArray = relatedNodesObj.siblingNodes
          self.highlight_single_selection_node(nodeId, nodeDepth)
          if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
            for (var sI = 0; sI < selectedSiblingNodeObjArray.length; sI++) {
              var selectedSiblingNode = selectedSiblingNodeObjArray[sI]
              var nodeId = selectedSiblingNode.id
              var nodeDepth = selectedSiblingNode.depth
              self.highlight_single_sibling_node(nodeId, nodeDepth)
            }
          }
          var selectedChildrenNodeIdArray = relatedNodesObj.childrenNodes
          if (typeof (selectedChildrenNodeIdArray) !== 'undefined') {
            for (var sI = 0; sI < selectedChildrenNodeIdArray.length; sI++) {
              var selectedChildrenNode = selectedChildrenNodeIdArray[sI]
              var nodeId = selectedChildrenNode.id
              var nodeDepth = selectedChildrenNode.depth
              self.highlight_single_selection_node(nodeId, nodeDepth)
            }
          }
        }
        //  如果当前所处的状态是对齐的状态, 那么节点不会高亮
        if (!window.Datacenter.barcodeCollection.get_current_aligned_state()) {
          //  高亮从实际的barcodeTree中选择的节点
          var selectedNodesIdObj = window.Datacenter.barcodeCollection.get_selected_nodes_id()
          // 然后按照选择的状态对于节点进行高亮
          for (var item in selectedNodesIdObj) {
            var nodeId = item
            var nodeDepth = selectedNodesIdObj[item].depth
            self.highlight_single_selection_node(nodeId, nodeDepth)
            var selectedSiblingNodeObjArray = selectedNodesIdObj[item].selectedSiblingNodeObjArray
            var relatedNodesObj = treeDataModel.find_related_nodes({id: nodeId, depth: nodeDepth})
            if (typeof (selectedSiblingNodeObjArray) === 'undefined') {
              selectedSiblingNodeObjArray = relatedNodesObj.siblingNodes
            }
            if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
              for (var sI = 0; sI < selectedSiblingNodeObjArray.length; sI++) {
                var selectedSiblingNode = selectedSiblingNodeObjArray[sI]
                var nodeId = selectedSiblingNode.id
                var nodeDepth = selectedSiblingNode.depth
                self.highlight_single_sibling_node(nodeId, nodeDepth)
              }
            }
            var selectedChildrenNodeIdArray = selectedNodesIdObj[item].selectedChildrenNodeIdArray
            if (typeof (selectedChildrenNodeIdArray) === 'undefined') {
              selectedChildrenNodeIdArray = relatedNodesObj.childrenNodes
            }
            if (typeof (selectedChildrenNodeIdArray) !== 'undefined') {
              for (var sI = 0; sI < selectedChildrenNodeIdArray.length; sI++) {
                var selectedChildrenNode = selectedChildrenNodeIdArray[sI]
                var nodeId = selectedChildrenNode.id
                var nodeDepth = selectedChildrenNode.depth
                self.highlight_single_selection_node(nodeId, nodeDepth)
              }
            }
          }
        }
        //  判断是否存在选中的节点, 如果不存在那么需要将透明度恢复原始状态
        if ((self.d3el.selectAll('.selection-highlight').empty()) && (self.d3el.selectAll('.selection-sibling-highlight').empty())) {
          self.cancel_selection_unhighlightNodes()
        }
      }
      ,
      /**
       * 更新点击高亮的节点
       */
      highlight_original_selection_nodes: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var selectedNodesIdObj = window.Datacenter.barcodeCollection.get_selected_nodes_id()
        //  首先将所有的节点取消selection的高亮
        self.cancel_selection_highlight()
        //  首先对所有的节点的透明度统一进行改变
        self.selection_unhighlightNodes()
        // 然后按照选择的状态对于节点进行高亮
        for (var item in selectedNodesIdObj) {
          var selectionNodeId = item
          var selectionNodeDepth = selectedNodesIdObj[item].depth
          var selectedSiblingNodeObjArray = selectedNodesIdObj[item].selectedSiblingNodeObjArray
          if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
            for (var sI = 0; sI < selectedSiblingNodeObjArray.length; sI++) {
              var selectedSiblingNode = selectedSiblingNodeObjArray[sI]
              var nodeId = selectedSiblingNode.id
              var nodeDepth = selectedSiblingNode.depth
              self.highlight_single_sibling_node(nodeId, nodeDepth)
            }
          }
          self.highlight_single_selection_node(selectionNodeId, selectionNodeDepth)
          var selectedChildrenNodeIdArray = selectedNodesIdObj[item].selectedChildrenNodeIdArray
          if (typeof (selectedChildrenNodeIdArray) !== 'undefined') {
            for (var sI = 0; sI < selectedChildrenNodeIdArray.length; sI++) {
              var selectedChildrenNode = selectedChildrenNodeIdArray[sI]
              var nodeId = selectedChildrenNode.id
              var nodeDepth = selectedChildrenNode.depth
              self.highlight_single_selection_node(nodeId, nodeDepth)
            }
          }
        }
        //  判断是否存在选中的节点, 如果不存在那么需要将透明度恢复原始状态
        if ((self.d3el.selectAll('.selection-highlight').empty()) && (self.d3el.selectAll('.selection-sibling-highlight').empty())) {
          self.cancel_selection_unhighlightNodes()
        }
      }
      ,
      selection_unhighlightNodes: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        self.d3el.selectAll('.barcode-node').classed('selection-unhighlight', true)
      }
      ,
      cancel_selection_unhighlightNodes: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        self.d3el.selectAll('.barcode-node').classed('selection-unhighlight', false)
        self.d3el.selectAll('.selection-highlight').style('fill', null)
      }
      ,
      //  取消所有节点的高亮, 恢复到最原始的状态
      cancel_selection_highlight: function () {
        var self = this
        self.d3el.selectAll('.selection-unhighlight')
          .classed('selection-unhighlight', false)
        self.d3el.selectAll('.selection-highlight')
          .classed('selection-highlight', false)
          .style('fill', null)
        self.d3el.selectAll('.selection-sibling-highlight')
          .classed('selection-sibling-highlight', false)
      }
      ,
      //  高亮选择的后代的节点
      highlight_single_selection_node: function (nodeId, nodeDepth) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
        self.d3el.select('#' + nodeId)
          .classed('selection-highlight', true)
          .style('fill', barcodeNodeColorArray[nodeDepth])
        self.d3el.select('#' + nodeId)
          .classed('selection-sibling-highlight', false)
        self.d3el.select('#' + nodeId)
          .classed('selection-unhighlight', false)
      }
      ,
      //  高亮选择的兄弟节点
      highlight_single_sibling_node: function (nodeId, nodeDepth) {
        var self = this
        if (!self.d3el.select('#' + nodeId).empty()) {
          if (!self.d3el.select('#' + nodeId).classed('selection-highlight')) {
            self.d3el.select('#' + nodeId)
              .classed('selection-sibling-highlight', true)
          }
        }
        // self.d3el.select('#' + nodeId)
        //   .classed('selection-unhighlight', false)
      }
      ,
      /**
       * 高亮排序所依据的节点
       * @param barcodeNodeId: 排序基准节点的id
       */
      highlight_sort_node: function (barcodeNodeId) {
        var self = this
        self.d3el.select('#' + barcodeNodeId).classed('sort-hovering-highlight', true)
      }
      ,
      /**
       * 取消高亮排序所依据的节点
       * @param barcodeNodeId: 排序基准节点的id
       */
      unhighlight_sort_node: function (barcodeNodeId) {
        var self = this
        self.d3el.select('.sort-hovering-highlight').classed('sort-hovering-highlight', false)
      }
      ,
      /**
       * model中的barcodeNodeHeight发生变化的时候的响应函数, 更新background的高度, label的位置以及barcodeNode的高度
       */
      update_view: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeIndex = treeDataModel.get('barcodeIndex')
        var barcodeNodeHeight = +treeDataModel.get('barcodeNodeHeight')
        var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')
        var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
        // var barcodeTreeYLocation = barcodeIndex * barcodeNodeHeight + barcodeIndex
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeOriginalNodeHeight = treeDataModel.get('barcodeOriginalNodeHeight')
        var barcodeCompactNodeHeight = treeDataModel.get('barcodeCompactNodeHeight')
        var barcodeOriginalSummaryHeight = treeDataModel.get('barcodeOriginalSummaryHeight')
        var barcodePaddingTop = treeDataModel.get('barcodePaddingTop')
        var barcodePaddingLeft = self.barcodePaddingLeft
        self.d3el.transition()
          .duration(Config.get('TRANSITON_DURATION'))
          .attr('transform', 'translate(' + 0 + ',' + barcodeTreeYLocation + ')')
        var containerWidth = $('#barcodetree-scrollpanel').width()
        //  更新barcode的背景矩形的高度
        self.d3el.selectAll('rect.bg')
          .attr('width', containerWidth)
          .attr('height', barcodeHeight)
        //  更新所有的barcode节点的矩形的高度
        self.d3el.selectAll('.barcode-node')
          .transition()
          .duration(1000)
          .attr('height', function (d) {
            if (typeof (d.compactAttr) !== 'undefined') {
              if (d.compactAttr === ABSOLUTE_COMPACT_FATHER) {
                return barcodeCompactNodeHeight
              }
            }
            return barcodeOriginalNodeHeight
          })
        var comparisonSummaryHeight = self.get_comparison_summary_height()
        // self.d3el.selectAll('.stat-summary')
        //   .transition()
        //   .duration(1000)
        //   .attr('y', function (d) {
        //     return barcodePaddingTop
        //   })
        //   .attr('height', function (d) {
        //     return comparisonSummaryHeight
        //   })
        // //
        // self.d3el.selectAll('.add-miss-summary')
        //   .transition()
        //   .duration(1000)
        //   .attr('y', function (d) {
        //     return barcodePaddingTop
        //   })
        //   .attr('height', function (d) {
        //     return comparisonSummaryHeight
        //   })
        //  更新barcode代表压缩节点的glyph的高度
        self.d3el.selectAll('.padding-covered-rect')
          .attr('height', function (d) {
            return barcodeOriginalNodeHeight
          })
        if (barcodeHeight < 16) {
          self.d3el.select('#barcode-label')
            .style('font-size', function (d) {
              return barcodeHeight / 19 + 'em'
            })
        } else {
          self.d3el.select('#barcode-label')
            .style('font-size', function (d) {
              return '1em'
            })
        }
        self.d3el.select('#barcode-label')
          .attr('y', barcodeHeight / 2)
        self.d3el.select('#barcode-container')
          .attr('transform', 'translate(' + barcodePaddingLeft + ',' + barcodePaddingTop + ')')
        self.update_interaction_icon()
      }
      ,
      /**
       *  在barcode视图中增加描述缺失或者增加节点数目的总结
       */
      add_missed_added_summary: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeNodeHeight = +treeDataModel.get('barcodeNodeHeight')
        var barcodeComparisonHeight = barcodeNodeHeight * 0.6
        var summaryRectY = barcodeNodeHeight * 0.1
        var ADD_NODE_COLOR = Config.get('BARCODE_COLOR').ADD_NODE_COLOR
        var MISS_NODE_COLOR = Config.get('BARCODE_COLOR').MISS_NODE_COLOR
        var SAME_NODE_COLOR = Config.get('BARCODE_COLOR').SAME_NODE_COLOR
        var alignedComparisonResultArray = treeDataModel.get('alignedComparisonResultArray')
        if (alignedComparisonResultArray == null)
          return
        var alignedRangeObjArray = self.get_aligned_range_array()
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        self.d3el.selectAll('.same-node-highlight').classed('same-node-highlight', false)
        self.d3el.selectAll('.added-node-highlight').classed('added-node-highlight', false)
        self.d3el.selectAll('.missed-node-highlight').classed('missed-node-highlight', false)
        self.d3el.select('#barcode-container').selectAll('.stat-summary').remove()
        self.d3el.select('#barcode-container').selectAll('.add-miss-summary').remove()
        for (var aI = 0; aI < alignedComparisonResultArray.length; aI++) {
          var alignedComparisonResult = alignedComparisonResultArray[aI]
          var alignedObjIndex = alignedComparisonResult.alignedObjIndex
          // var alignedObjId =
          var sameNodeIdArray = alignedComparisonResult.sameNodeIdArray
          // highlightSameNodes(sameNodeIdArray)
          var addedNodeIdArray = alignedComparisonResult.addedNodeIdArray
          highlightAddedNodes(addedNodeIdArray)
          var missedNodeIdArray = alignedComparisonResult.missedNodeIdArray
          highlightMissedNodes(missedNodeIdArray)
          var rangeStartNodeIndex = alignedRangeObjArray[aI].rangeStartNodeIndex
          var alignedObjId = barcodeNodeAttrArray[rangeStartNodeIndex].id
          var rangeEndNodeIndex = alignedRangeObjArray[aI].rangeEndNodeIndex
          var nodeDistribution = {}
          nodeDistribution.wholeNodeNum = get_whole_num(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray)
          nodeDistribution.sameNode = sameNodeIdArray.length
          nodeDistribution.addNode = addedNodeIdArray.length
          nodeDistribution.missNode = missedNodeIdArray.length
          var itemArray = ['addNode', 'missNode', 'sameNode']
          var colorArray = {addNode: ADD_NODE_COLOR, missNode: MISS_NODE_COLOR, sameNode: SAME_NODE_COLOR}
          draw_comparison_summary(nodeDistribution, alignedObjId, alignedObjIndex, itemArray, colorArray, rangeStartNodeIndex, barcodeNodeAttrArray)
        }

        function highlightSameNodes(sameNodeIdArray) {
          for (var sI = 0; sI < sameNodeIdArray.length; sI++) {
            self.d3el.select('#' + sameNodeIdArray[sI]).classed('same-node-highlight', true)
          }
        }

        function highlightAddedNodes(addedNodeIdArray) {
          for (var aI = 0; aI < addedNodeIdArray.length; aI++) {
            self.d3el.select('#' + addedNodeIdArray[aI]).classed('added-node-highlight', true)
          }
        }

        function highlightMissedNodes(missedNodeIdArray) {
          for (var mI = 0; mI < missedNodeIdArray.length; mI++) {
            self.d3el.select('#' + missedNodeIdArray[mI]).classed('missed-node-highlight', true)
          }
        }

        //  获取在对齐比较部分内的barcode,选中层级的节点数量
        function get_whole_num(rangeStartNodeIndex, rangeEndNodeIndex, barcodeNodeAttrArray) {
          var selectedLevels = Variables.get('selectedLevels')
          var wholeNum = 0
          for (var bI = rangeStartNodeIndex; bI <= rangeEndNodeIndex; bI++) {
            var nodeLevel = barcodeNodeAttrArray[bI].depth
            if (selectedLevels.indexOf(nodeLevel) !== -1) {
              wholeNum = wholeNum + 1
            }
          }
          return wholeNum
        }

        function draw_comparison_summary(nodeDistribution, alignedObjId, alignedObjIndex, itemArray, colorArray, rangeStartNodeIndex, barcodeNodeAttrArray) {
          var initStartNodeX = barcodeNodeAttrArray[rangeStartNodeIndex].x
          var comparisonResultsPadding = Config.get('COMPARISON_RESULT_PADDING')
          var barcodeNodeGap = Config.get('BARCODE_NODE_GAP')
          var maxDepth = Variables.get('maxDepth')
          var wholeNodeNum = nodeDistribution.wholeNodeNum
          var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
          var DURATION = Config.get('TRANSITON_DURATION')
          //  因为默认存在 barcodeHeight / 8的向下的偏移
          var summaryRectY = 0
          var singleComparisonHeightWithPadding = self.get_add_miss_summary_height()
          var singleComparisonHeight = singleComparisonHeightWithPadding * 0.9
          for (var itemIndex = 0; itemIndex < itemArray.length; itemIndex++) {
            var rangeStartNodeX = 0
            var summaryRectWidth = nodeDistribution[itemArray[itemIndex]] / wholeNodeNum * comparisonResultsPadding
            if (summaryRectWidth !== 0) {
              rangeStartNodeX = initStartNodeX - summaryRectWidth - barcodeNodeGap
            }
            if (self.d3el.select('#barcode-container').select('#add-miss-summary-' + alignedObjIndex + '-' + itemIndex).empty()) {
              self.d3el.select('#barcode-container')
                .append('rect')
                .attr('class', 'add-miss-summary ' + alignedObjId)
                .attr('id', 'add-miss-summary-' + alignedObjIndex + '-' + itemIndex)
                .attr('width', summaryRectWidth)
                .attr('height', singleComparisonHeight)
                .attr('x', rangeStartNodeX)
                .attr('y', summaryRectY + singleComparisonHeightWithPadding * itemIndex)
                .style('fill', function () {
                  return colorArray[itemArray[itemIndex]]
                })
                .style('visibility', function () {
                  return aligned_summary_visible_state(alignedObjId)
                })
            } else {
              self.d3el.select('#barcode-container')
                .select('#add-miss-summary-' + alignedObjIndex + '-' + itemIndex)
                .transition()
                .duration(DURATION)
                .attr('width', summaryRectWidth)
                .attr('height', singleComparisonHeight)
                .attr('x', rangeStartNodeX)
                .attr('y', summaryRectY + singleComparisonHeightWithPadding * itemIndex)
                .style('visibility', function () {
                  return aligned_summary_visible_state(alignedObjId)
                })
            }
          }
        }

        function aligned_summary_visible_state(alignObjId) {
          var barcodeCollection = window.Datacenter.barcodeCollection
          if (barcodeCollection.get_summary_state(alignObjId)) {
            return 'visible'
          } else {
            return 'hidden'
          }
        }
      }
      ,
      update_view_location: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeIndex = treeDataModel.get('barcodeIndex')
        var barcodeTreeYLocation = treeDataModel.get('barcodeTreeYLocation')
        var basedModel = treeDataModel.get('basedModel')
        self.d3el.transition()
          .duration(Config.get('TRANSITON_DURATION'))
          .attr('transform', 'translate(' + 0 + ',' + barcodeTreeYLocation + ')')
        if (treeDataModel.get('compareBased')) {
          self.singleTree.select('.bg').classed('compare-based-selection', true)
        } else {
          self.singleTree.select('.bg').classed('compare-based-selection', false)
          self.remove_compare_based_anchor()
        }
        // if (basedModel == null) {
        //   self.add_comparison_summary()
        // } else {
        //   self.add_missed_added_summary()
        // }
        // var barcodeRectBgColor = treeDataModel.get('barcodeRectBgColor')
        // self.singleTree.select('.bg').style('fill', barcodeRectBgColor)
      }
      ,
      add_compare_based_anchor: function () {
        var self = this
        var treeDataModel = self.model
        var barcodePaddingLeft = self.barcodePaddingLeft
        var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var compareBased = treeDataModel.get('compareBased')
        var textPadding = barcodeTextPaddingLeft / 2
        var fontSizeHeight = barcodeTextPaddingLeft < barcodeHeight ? barcodeTextPaddingLeft : barcodeHeight
        //  增加compare based的barcodeTree的pin的标签
        d3.selectAll('.compare-based-text').remove()
        self.singleTree.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('cursor', 'pointer')
          .attr('class', 'compare-based-text')
          .attr('font-family', 'FontAwesome')
          .attr('x', textPadding)
          .attr('y', barcodeHeight / 2)
          .text('\uf08d')
          .style('font-size', fontSizeHeight + 'px')
        //  改变compared barcodeTree的背景颜色
        d3.selectAll('.bg').classed('compare-based-selection', false)
        self.singleTree.select('.bg').classed('compare-based-selection', true)
      }
      ,
    //  删除当前的compare_based的标记
      remove_compare_based_anchor: function () {
        var self = this
        var treeDataModel = self.model
        var compareBased = treeDataModel.get('compareBased')
        self.singleTree
          .selectAll('.compare-based-text')
          .remove()
        self.singleTree.select('.bg').classed('compare-based-selection', false)
      }
      ,
      /**
       *  取消barcode背景的高亮
       */
      unhighlight_barcode_bg: function () {
        var self = this
        d3.selectAll('.bg').classed('hovering-highlight', false)
      }
      ,
      /**
       *  增加总结的柱状图
       */
      add_summary: function () {
        var self = this
        var treeDataModel = self.model
        var basedModel = treeDataModel.get('basedModel')
        if (basedModel == null) {
          self.add_comparison_summary()
        } else {
          self.add_missed_added_summary()
        }
        self.render_padding_cover_rect()
      }
      ,
      /**
       *  鼠标点击节点的时候, 将superTree的视图打开
       */
      open_supertree_view: function () {
        var self = this
        Backbone.Events.trigger(Config.get('EVENTS')['OPEN_SUPER_TREE'])
        window.Variables.update_barcode_attr()
        // self.model.update_height()
      }
      ,
      get_class_name: function (classNameArray) {
        var className = ''
        for (var cI = 0; cI < classNameArray.length; cI++) {
          className = className + ' ' + classNameArray[cI]
        }
        return className
      }
    },
    SVGBase
    )
  )
})
