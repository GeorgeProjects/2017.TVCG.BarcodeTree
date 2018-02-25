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
        self.listenTo(treeDataModel, 'change:viewHeightUpdateValue', self.render_barcode_tree)
        self.listenTo(treeDataModel, 'change:viewUpdateSelectionState', self.node_mouseout_handler)
        self.listenTo(treeDataModel, 'change:selectionUpdateValue', self.selection_update_handler)
        // self.listenTo(self.model, 'change:barcodeNodeAttrArray change:barcodeNodeHeight change:barcodeTreeYLocation', self.update_view)//
        self.listenTo(treeDataModel, 'change:filterState', self.change_filtered_state)
        // self.listenTo(treeDataModel, 'change:viewUpdateValue', self.shrink_barcode_tree)
        self.listenTo(treeDataModel, 'change:viewUpdateConcurrentValue', self.render_barcode_tree)
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
        Backbone.Events.on(Config.get('EVENTS')['UPDATE_ANIATION_BARCODE_VIEW'], function () {
          self.render_animation_compact_barcode_tree()
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
          var barcodeTreeId = event.barcodeTreeId
          // var thisTreeFindingNodesObj = treeDataModel.find_related_nodes(thisNodeObj)
          // var comparedResultsObj = self.compareNodes(findingNodesObj, thisTreeFindingNodesObj)
          self.highlight_finding_node(thisNodeObj, findingNodesObj, barcodeTreeId)
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
          self.highlight_selection_supertree_selection_nodes()
        })
        //  点击某个group之后,选择group中的BArcodeTree
        Backbone.Events.on(Config.get('EVENTS')['SELECT_GROUP_BARCODETREE'], function (event) {
          var selectionArray = event.selectionArray
          self.select_group_barcodetree(selectionArray)
        })
        //  点击某个选择的group之后, 取消选择group中的BarcodeTree
        Backbone.Events.on(Config.get('EVENTS')['UNSELECT_GROUP_BARCODETREE'], function () {
          self.unselect_group_barcodetree()
        })
        //  向barcode的align的部分增加locked-align的class
        Backbone.Events.on(Config.get('EVENTS')['ADD_LOCKED_ALIGN_CLASS'], function () {
          self.add_locked_align_class()
        })
        //  删除locked-align的class
        Backbone.Events.on(Config.get('EVENTS')['REMOVE_LOCKED_ALIGN_CLASS'], function () {
          self.remove_locked_align_class()
        })
      },
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
      trigger_remove_tree_selection: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')['REMOVE_SELECTION'], {
          'barcodeTreeId': barcodeTreeId
        })
      },
      //  点击选择barcode进行集合操作的事件
      trigger_click_selection_event: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')['SET_SELECT_BARCODE_EVENT'], {
          'barcodeTreeId': barcodeTreeId
        })
      },
      //  点击取消选择barcode进行集合操作的事件
      trigger_unclick_selection_event: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')['SET_UNSELECT_BARCODE_EVENT'], {
          'barcodeTreeId': barcodeTreeId
        })
      },
      //  将鼠标hovering的barcode的节点的相关信息进行广播
      trigger_hovering_node_event: function (thisNodeObj, findingNodesObj) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        Backbone.Events.trigger(Config.get('EVENTS')['HIGH_RELATED_NODES'], {
          'thisNodeObj': thisNodeObj,
          'findingNodesObj': findingNodesObj,
          'barcodeTreeId': barcodeTreeId
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
        if (Variables.get('mouseover_state')) {
          Backbone.Events.trigger(Config.get('EVENTS')['NODE_MOUSEOUT'])
          //  刚刚trigger了mouseout的信号, 不需要再次被trigger
          Variables.set('mouseover_state', false)
        }
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
      //  更新对齐的子树部分
      trigger_update_focus_subtree: function (nodeObjId) {
        Backbone.Events.trigger(Config.get('EVENTS')['UPDATE_FOCUS_SUBTREE'])
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
                var previousSiblingIndex = findPreviousSibling(barcodeNodeAttrArray, currentHoveringNodeIndex)
                findingIndex = previousSiblingIndex
              } else if (key === TOP_KEY) {
                var fatherObjIndex = findFather(barcodeNodeAttrArray, currentHoveringNodeIndex)
                findingIndex = fatherObjIndex
              } else if (key === RIGHT_KEY) {
                var nextSiblingObjIndex = findNextSibling(barcodeNodeAttrArray, currentHoveringNodeIndex)
                findingIndex = nextSiblingObjIndex
              } else if (key === BOTTOM_KEY) {
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
          self.node_mouseover_handler(nodeObj, self)
        }
      },
      //  ============================================================================
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
        var operationType = treeDataModel.get('operationType')
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
            if ((typeof (treeDataModel.get('barcodeModelType'))) !== 'undefined') {
              colorClass = colorClass + ' set-operation'
            }
            return colorClass
          })
          .attr('width', containerWidth)
          .attr('height', barcodeHeight)
          .attr('cursor', function () {
            var selectionState = Variables.get('selectionState')
            if (selectionState) {
              return 'cell'
            } else {
              return 'default'
            }
          })
          .on('mouseover', function () {
            self.unhighlight_barcode_bg()
            d3.select(this).classed('hovering-highlight', true)
            d3.select('#barcodetree-svg').selectAll('.barcode-node').classed('.mouseover-unhighlight', false)
            self.trigger_hovering_event()
            var dayArray = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            if (barcodeTreeId.indexOf('-') !== -1) {
              var dateInTip = barcodeTreeId.split('-')[1].replaceAll('_', '/')
              var date = barcodeTreeId.split('-')[1].replaceAll('_', '-')
              var curDay = new Date(date).getDay()
              var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>date: " + dateInTip //+ ",value:<span style='color:red'>" + barValue + "</span>"
                + ", Day: " + dayArray[curDay] + "</span></span>"
            } else {
              var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + "Day: " + barcodeTreeId + "</span></span>"
            }
            if (Config.get('BARCODETREE_TOOLTIP_ENABLE')) {
              tip.show(tipValue)
            }
            self.trigger_mouseout_event()
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
        // //  需要将dblclick与click进行区分
        // .on('dblclick', function () {
        //   $('#tree-config-div').css({visibility: 'visible'})
        // })
        // .style('fill', barcodeRectBgColor)
        var currentDataSetName = Variables.get('currentDataSetName')
        if (currentDataSetName === Config.get('DataSetCollection')['LibraryTree_DailyName']) {
          if (barcodeTreeId.indexOf('-') !== -1) {
            var barcodeTreeLabelYearMonthDday = barcodeTreeId.split('-')[1]
            var barcodeTreeLabelMonthDday = barcodeTreeLabelYearMonthDday.substring(5, barcodeTreeLabelYearMonthDday.length).replaceAll('_', '/')
          } else {
            barcodeTreeLabelMonthDday = barcodeTreeId.split('_')[0]
            barcodeTreeLabelMonthDday = barcodeTreeLabelMonthDday.toUpperCase()
            if (typeof (operationType) !== 'undefined') {
              var operationTypeLabel = operationType.substring(0, 1).toUpperCase()
              barcodeTreeLabelMonthDday = barcodeTreeLabelMonthDday + "(" + operationTypeLabel + ")"
            }
          }
        } else if (currentDataSetName === Config.get('DataSetCollection')['NBATeamTreeName']) {
          var barcodeTreeLabelMonthDday = barcodeTreeId.replace('tree', '')
        }
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
        self.barcodeContainer = self.d3el.append('g')
          .attr('transform', 'translate(' + barcodePaddingLeft + ',' + barcodePaddingTop + ')')
          .attr('id', 'barcode-container')
        // var maxWidth = barcodeNodeAttrArray[ barcodeNodeAttrArray.length - 1 ].x + barcodeNodeAttrArray[ barcodeNodeAttrArray.length - 1 ].width
        // var extentLength = barcodePaddingTop
        // self.render_barcode_tree()
        // 更新barcode的标签的字体大小
        // if (barcodeHeight < 16) {
        var labelFontSize = self.get_font_size()
        self.d3el.select('#barcode-label')
          .style('font-size', function (d) {
            return labelFontSize + 'em'
          })
          .attr('y', barcodeHeight / 2)
        self.add_label_dbclick_click_handler()
        // }
      },
      /**
       *  barcodeTree上label的点击事件
       */
      barcode_tree_label_click_handler: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeCollection = window.Datacenter.barcodeCollection
        var selectionState = Variables.get('selectionState')
        if (selectionState) {
          //  当前处于选择状态
          if (self.d3el.select('.bg').classed('set-operation-selection')) {
            self.trigger_unclick_selection_event()
            self.remove_set_operation_selection_anchor()
          } else {
            //  点击barcode的背景矩形的响应函数
            self.trigger_click_selection_event()
            self.add_set_operation_selection_anchor()
          }
        } else {
          //  当前处于非选择状态
          if (self.d3el.select('.bg').classed('compare-based-selection')) {
            self.cancel_tree_selection_handler()
          } else {
            self.tree_selection_handler()
          }
        }
        //  在改变based barcodemodel之后需要触发更新视图的信号
        barcodeCollection.update_all_barcode_view()
        barcodeCollection.clear_filter_barcode()
      },
      /**
       * 确认当前barcodeTree选择的函数
       */
      tree_selection_handler: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeCollection = window.Datacenter.barcodeCollection
        //  点击barcode的背景矩形的响应函数
        self.trigger_click_event()
        self.add_compare_based_anchor()
        //  在当前状态下相当于增加compare-based的子树
        self.set_compare_based_subtree()
        barcodeCollection.set_based_model(barcodeTreeId)
      },
      /**
       * 取消barcodeTree选择的函数
       */
      cancel_tree_selection_handler: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeCollection = window.Datacenter.barcodeCollection
        self.trigger_unclick_event()
        //  在当前状态下相当于删除compare-based的子树
        self.set_compare_based_subtree()
        self.remove_compare_based_anchor()
        barcodeCollection.unset_based_model(barcodeTreeId)
        //  删除选择比较的barcodeTree之后, 按照barcode原始的选择序列重新排序
        barcodeCollection.recover_barcode_model_sequence()
      },
      /**
       * 设定barcodeTree之间比较的subtree
       */
      set_compare_based_subtree: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeCollection = window.Datacenter.barcodeCollection
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var alignedNodeIdArray = barcodeCollection.get_aligned_node_id_array()
        if (alignedNodeIdArray.length !== 0) {
          for (var aI = 0; aI < alignedNodeIdArray.length; aI++) {
            var nodeData = treeDataModel.get_node_obj_from_id(alignedNodeIdArray[aI])
            var nodeExisted = self.single_click_select_handler(nodeData)
            if (nodeExisted) {
              aI = aI - 1
            }
          }
        } else {
          var nodeData = barcodeNodeAttrArray[0]
          var nodeExisted = self.single_click_select_handler(nodeData)
        }
      },
      add_label_dbclick_click_handler: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeCollection = window.Datacenter.barcodeCollection
        //  捕捉所有的在barcode节点上的事件
        var cc = clickcancel()
        self.d3el.selectAll('#barcode-label').call(cc)
        //  捕捉单击的事件
        cc.on('click', function (el) {
          //  设置mouseover的状态为true, 表示需要trigger mouseout的信号
          Variables.set('mouseover_state', true)
          self.barcode_tree_label_click_handler()
        });
        cc.on('dblclick', function (el) {
          //  设置mouseover的状态为true, 表示需要trigger mouseout的信号
          Variables.set('mouseover_state', true)
          // self.cancel_tree_selection_handler()
          self.trigger_remove_tree_selection()
          barcodeCollection.remove_item_and_model(barcodeTreeId)
          window.Variables.update_barcode_attr()
          barcodeCollection.update_after_remove_models()
          //  传递信号, 在服务器端更新dataCenter删除选中的item数组, 进而更新superTree
          window.Datacenter.request_remove_item([barcodeTreeId])
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
              if ((typeof (a) !== 'undefined') && (typeof (b) !== 'undefined')) {
                return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
              }
              return 0;
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
      },
      /**
       * 在barcode的节点上增加点击与双击的事件
       */
      add_node_dbclick_click_handler: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeCollection = window.Datacenter.barcodeCollection
        //  捕捉所有的在barcode节点上的事件
        var cc = clickcancel()
        self.d3el.selectAll('.barcode-node').call(cc)
        //  捕捉单击的事件
        cc.on('click', function (el) {
          //  设置mouseover的状态为true, 表示需要trigger mouseout的信号
          Variables.set('mouseover_state', true)
          var srcElement = el.srcElement
          var nodeObj = d3.select(srcElement)
          var nodeData = nodeObj.data()[0]
          if (nodeData.existed) {
            //  如果处于compact模式下, template的节点是不能被点击的
            if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
              //  切换到原始的barcodeTree的compact的显示模式
              if (nodeData.compactAttr === Config.get('CONSTANT').TEMPLATE) {
                return
              }
            }
            self.single_click_select_handler(nodeData)
            self.trigger_mouseout_event()
          }
        });
        //  捕捉click事件,将他分发到不同的方法中进行处理
        function clickcancel(d, i) {
          var event = d3.dispatch('click', 'dblclick')

          function cc(selection) {
            var down,
              tolerance = 5,
              last,
              wait = null;
            // euclidean distance
            function dist(a, b) {
              if ((typeof (a) !== 'undefined') && (typeof (b) !== 'undefined')) {
                return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
              }
              return 0;
            }

            selection.on('mousedown', function () {
              down = d3.mouse(document.body);
              last = +new Date();
            })
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
      },
      /**
       * 单击barcode中的节点的响应事件
       */
      single_click_select_handler: function (nodeData) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeCollection = window.Datacenter.barcodeCollection
        var nodeObjId = nodeData.id
        var nodeObjDepth = nodeData.depth
        var nodeObjCategory = nodeData.category
        var nodeObjCategoryName = nodeData.categoryName
        var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
        var elementExisted = true
        //  判断当前点击的过程中是否处于对齐的状态
        if (!BarcodeGlobalSetting['Align_Lock']) {
          //  当前点击的节点不属于aligned的范围
          if (!barcodeCollection.in_selected_array(barcodeTreeId, nodeObjId)) {
            // 判断该节点是否已经被选择
            var siblingNodesArray = treeDataModel.find_sibling_nodes(nodeData)
            var childrenNodesArray = treeDataModel.find_children_nodes(nodeData)
            //  在增加新的数据之前首先需要删除与当前点击的节点出现重叠的节点
            barcodeCollection.remove_crossed_node_alignment(nodeObjId)
            barcodeCollection.add_selected_node(barcodeTreeId, nodeObjId, nodeObjDepth, nodeObjCategory, nodeObjCategoryName, siblingNodesArray, childrenNodesArray)
            elementExisted = false
          } else {
            barcodeCollection.remove_selected_node(nodeObjId, nodeObjDepth, barcodeTreeId)
            elementExisted = true
          }
        } else {
          //  在locked的情况下点击的节点必须要是aligned范围的节点
          if (treeDataModel.is_aligned_start(nodeObjId) || treeDataModel.is_aligned_range(nodeObjId)) {
            var siblingNodesArray = treeDataModel.find_sibling_nodes(nodeData)
            var childrenNodesArray = treeDataModel.find_children_nodes(nodeData)
            //  在alignedlock状态下的点击响应事件
            var nodeObj = {
              nodeObjId: nodeObjId,
              barcodeTreeId: barcodeTreeId,
              nodeDepth: nodeObjDepth
            }
            d3.selectAll('.select-icon').remove()
            //  这个操作的目的是对于barcode的取消之前选择的高亮状态, 将节点放到这个数组中就会取消高亮
            barcodeCollection.update_node_obj_into_highlight_all_children_nodes_array(nodeObj)
            //  在aligned lock状态下的高亮的操作
            if (!barcodeCollection.in_aligned_selected_array(barcodeTreeId, nodeObjId)) {
              // 判断该节点是否已经被选择
              barcodeCollection.add_aligned_selected_node(barcodeTreeId, nodeObjId, nodeObjDepth, nodeObjCategory, siblingNodesArray, childrenNodesArray)
              elementExisted = false
            } else {
              barcodeCollection.remove_aligned_selected_node(nodeObjId)
              elementExisted = true
            }
          }
        }
        self.update_current_selected_icon()
        return elementExisted
      }
      ,
      /**
       * 更新none-node的class, 判断是否其已经变成了node-missed
       */
      update_class_nodes_none: function () {
        var self = this
        var treeDataModel = self.model
        var missed_node_class = Variables.get('missed_node_class')
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var DURATION = Config.get('TRANSITON_DURATION')
        var selectedLevels = Variables.get('selectedLevels')
        //  取消barcodeTree中的节点上的template属性
        self.d3el.select('#barcode-container')
          .selectAll('.barcode-node')
          .each(function (d, i) {
            if (d.compactAttr === Config.get('CONSTANT').TEMPLATE) {
              d3.select(this).classed('template', true)
            } else {
              d3.select(this).classed('template', false)
            }
          })
        var barcodeNode = self.d3el.select('#barcode-container')
          .selectAll('.barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            //  只有当subtree处于收缩状态时才会绘制paddingNode的节点
            return !(d.existed)
          }), function (d, i) {
            return d.id
          })
        barcodeNode.each(function (d, i) {
          var removedClassArray = []
          if (d3.select(this).classed(missed_node_class)) {
            removedClassArray.push(missed_node_class)
          }
          if (d3.select(this).classed('selection-unhighlight')) {
            removedClassArray.push('selection-unhighlight')
          }
          d3.select(this).attr('class', self.node_class_name_handler(d))
          for (var rI = 0; rI < removedClassArray.length; rI++) {
            d3.select(this).classed(removedClassArray[rI], true)
          }
        })
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
        var BARCODETREE_VIEW_SETTING = Config.get('BARCODETREE_VIEW_SETTING')
        var barcodeNodePaddingLength = BARCODETREE_VIEW_SETTING['BARCODE_NODE_PADDING_LENGTH']
        var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
        var Subtree_Compact = BARCODETREE_GLOBAL_PARAS['Subtree_Compact']
        self.d3el.select('#barcode-container')
          .selectAll('.padding-covered-rect')
          .remove()
        var paddingCoverRectObj = self.d3el.select('#barcode-container')
          .selectAll('.padding-covered-rect')
          .data(paddingNodeObjArray.filter(function (d, i) {
            //  只有当subtree处于收缩状态时才会绘制paddingNode的节点
            return ((d.paddingNodeStartIndex <= d.paddingNodeEndIndex) && (Subtree_Compact))
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
            if (d.isCompact) {
              return barcodeNodePaddingLength
            } else {
              return 0
            }
          })
          .attr('height', barcodeNodeHeight)
          .style("fill", self.fill_style_handler.bind(self))
          .on('mouseover', function (d, i) {
            var startIndex = d.paddingNodeStartIndex
            var endIndex = d.paddingNodeEndIndex
            var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>range: " + startIndex + "-" + endIndex + "</span></span>"
            if (Config.get('BARCODETREE_TOOLTIP_ENABLE')) {
              tip.show(tipValue)
            }
          })
          .on('mouseout', function (d, i) {
            var nodeStyle = self.fill_style_handler(d, i)
          })
          .on('click', self.padding_cover_click_handler.bind(self))
        paddingCoverRectObj.attr('x', function (d, i) {
          if (isNaN(+d.paddingNodeX)) {
            return 0
          }
          return d.paddingNodeX
        })
          .attr('y', 0)
          .attr('width', function (d, i) {
            if (d.isCompact) {
              return barcodeNodePaddingLength
            } else {
              return 0
            }
          })
          .attr('height', barcodeNodeHeight)
        paddingCoverRectObj.exit().remove()
      }
      ,
      /**
       * 绘制barcodeTree
       */
      render_barcode_tree: function () {
        var self = this
        self.update_barcode_font()
        self.update_barcode_bg()
        self.update_barcode_loc()
        //  删除对齐的范围内的不存在的节点, 对齐范围内的节点哪些是需要删除的
        // self.update_exist_unexist_aligned_barcode_node()
        //  更新对齐范围内存在的barcode节点
        //
        update_before_render()
        // if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        // } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        //   self.render_animation_compact_barcode_tree()
        // }
        self.render_barcode_tree_node(update_after_render)
        // self.add_summary()
        // self.update_existed_aligned_barcode_node()
        //  更新对齐范围内不存在barcode节点
        // self.update_unexisted_aligned_barcode_node()
        // self.update_padding_barcode_node()
        //  虽然在update_padding_barcode_node方法之后会更新padding_cover_rect, 但是为了在更新过程中不会出现背后的barcode节点的视觉干扰, 所以在后面紧接着调用render_padding_cover_rect
        self.render_padding_cover_rect()
        self.add_node_dbclick_click_handler()
        // self.highlight_original_selection_nodes()
        self.highlight_selection_supertree_selection_nodes()

        //  在更新barcodeTree的节点之后的显示
        function update_after_render() {
          self.add_summary()
          self.render_padding_cover_rect()
          self.update_class_nodes_none()
          self.add_aligned_lock_class()
          self.node_mouseout_handler()
          self.add_barcode_tree_set_selection()
          self.update_interaction_icon()
        }

        //  在绘制barcode之前要先更新的视图部分
        function update_before_render() {
          self.remove_summary_histogram()
        }
      },
      /**
       * 更新选择的树
       */
      add_barcode_tree_set_selection: function () {
        var self = this
        var groupId = window.current_select_group_id
        var selectionBarcodeObject = Variables.get('selectionBarcodeObject')
        var barcodetreeSelectionArray = selectionBarcodeObject[groupId]
        if (typeof (barcodetreeSelectionArray) !== 'undefined') {
          self.select_group_barcodetree(barcodetreeSelectionArray)
        }
      },
      /**
       * 动态更新barcodeTree的内部节点
       */
      render_animation_compact_barcode_tree: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeIndex = treeDataModel.get('barcodeIndex')
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var compactBarcodeNodeAttrArrayObj = self.get_comact_barcode_node_array_obj()
        var maxCompactLevel = 0
        var minCompactLevel = 100000000
        var compactPrefix = 'compact-'
        for (var compactItem in compactBarcodeNodeAttrArrayObj) {
          var compactLevel = +compactItem.replace(compactPrefix, '')
          if (compactLevel > maxCompactLevel) {
            maxCompactLevel = compactLevel
          }
          if (compactLevel < minCompactLevel) {
            minCompactLevel = compactLevel
          }
        }
        //  删除所有先前存在的barcode节点
        self.d3el.select('#barcode-container')
          .selectAll('.barcode-node').remove()
        if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          //  表示从original模式变换到compact模式
          var initCompactLevel = maxCompactLevel
          var stopCompactLevel = minCompactLevel
        } else if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
          //  表示从compact模式变换到original模式
          var initCompactLevel = minCompactLevel
          var stopCompactLevel = maxCompactLevel
        }
        render_compact_barcode_tree(initCompactLevel, stopCompactLevel)
        function render_compact_barcode_tree(compactLevel, stopCompactLevel) {
          var barcodeNodeAttrArray = compactBarcodeNodeAttrArrayObj[compactPrefix + compactLevel]
          var displayMode = Variables.get('displayMode')
          var isDisplayModeGlobal = (displayMode === Config.get('CONSTANT').GLOBAL)
          var DURATION = Config.get('TRANSITON_DURATION')
          var barcodeNode = self.d3el.select('#barcode-container')
            .selectAll('.barcode-node')
            .data(barcodeNodeAttrArray.filter(function (d, i) {
              return !((isDisplayModeGlobal) && (!d.existed))
            }), function (d, i) {
              return d.id
            })
          barcodeNode.enter()
            .append('rect')
            .attr('class', function (d, i) {
              return self.node_class_name_handler(d, i)
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
              return +self.y_handler(d)
            })
            .attr('width', function (d) {
              return +d.width
            })
            .attr('height', function (d) {
              return self.height_handler(d)
            })
            .style("cursor", "pointer")
            .on('mouseover', function (d, i) {
              self.node_mouseover_handler(d, self)
            })
            .style("fill", function (d, i) {
              return self.fill_handler(d, i, self)
            })
          barcodeNode.attr('width', function (d) {
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
              return self.height_handler(d)
            })
            .attr('y', function (d) {
              return +self.y_handler(d)
            })
            .style("fill", function (d, i) {
              return self.fill_handler(d, i, self)
            })
            .call(self.endall, function (d, i) {
              if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
                compactLevel = compactLevel - 1
                if (compactLevel < stopCompactLevel) {
                  // next_step_func()
                  //  不需要每一个barcodeTree执行完成animation都需要trigger信号
                  if (barcodeIndex === 0) {
                    self.trigger_update_barcode_view()
                  }
                } else {
                  render_compact_barcode_tree(compactLevel, stopCompactLevel)
                }
              } else if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
                compactLevel = compactLevel + 1
                if (compactLevel > stopCompactLevel) {
                  // next_step_func()
                  //  不需要每一个barcodeTree执行完成animation都需要trigger信号
                  if (barcodeIndex === 0) {
                    self.trigger_update_barcode_view()
                  }
                } else {
                  render_compact_barcode_tree(compactLevel, stopCompactLevel)
                }
              }
            })
          barcodeNode.exit().remove()
        }
      },
      /**
       * 更新barcodeTree的内部节点
       */
      render_barcode_tree_node: function (next_step_func) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        var displayMode = Variables.get('displayMode')
        var isDisplayModeGlobal = (displayMode === Config.get('CONSTANT').GLOBAL)
        //  TODO
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var DURATION = Config.get('TRANSITON_DURATION')
        var selectedLevels = Variables.get('selectedLevels')
        var barcodeNode = self.d3el.select('#barcode-container')
          .selectAll('.barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            return !((isDisplayModeGlobal) && (!d.existed))
          }), function (d, i) {
            return d.id
          })
        barcodeNode.enter()
          .append('rect')
          .attr('class', function (d, i) {
            return self.node_class_name_handler(d, i)
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
            return +self.y_handler(d)
          })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('height', function (d) {
            return self.height_handler(d)
          })
          .style("cursor", "pointer")
          .on('mouseover', function (d, i) {
            self.node_mouseover_handler(d, self)
          })
          .style("fill", function (d, i) {
            return self.fill_handler(d, i, self)
          })
        barcodeNode.attr('width', function (d) {
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
            return self.height_handler(d)
          })
          .attr('y', function (d) {
            return +self.y_handler(d)
          })
          .style("fill", function (d, i) {
            return self.fill_handler(d, i, self)
          })
          .call(self.endall, function (d, i) {
            next_step_func()
          })
        barcodeNode.exit().remove()
      },
      //  y的handler
      y_handler: function (d) {
        if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
          var barcodeTreeComparisonMode = Config.get('BARCODETREE_COMPARISON_MODE')
          var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
          //  barcodeTree的原始显示模式
          if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['ATTRIBUTE']) {
            if (typeof (d.height_value) === 'undefined') {
              return +d.height
            }
            return (+d.height) - (+d.height_value)
          } else if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['TOPOLOGY']) {
            return 0
          }
        } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          //  barcodeTree的compact的显示模式
          return d.y
        }
      },
      //  高度的handler
      height_handler: function (d) {
        var barcodeTreeComparisonMode = Config.get('BARCODETREE_COMPARISON_MODE')
        var barcodeTreeGlobalParas = Variables.get('BARCODETREE_GLOBAL_PARAS')
        if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['ATTRIBUTE']) {
          if (typeof (d.height_value) === 'undefined') {
            return 0
          }
          return d.height_value
        } else if (barcodeTreeGlobalParas['Comparison_Mode'] === barcodeTreeComparisonMode['TOPOLOGY']) {
          // return +d.height
          return +d.height
        }
      }

      ,
      /**
       *  节点的class计算函数fill
       */
      node_class_name_handler: function (d, i) {
        var self = this
        var treeDataModel = self.model
        var classArray = []
        var generalMissedNodeClass = Variables.get('general_missed_node_class')
        classArray.push('barcode-node')
        classArray.push('barcode-node-level-' + d.depth)
        if (d.existed) {
          classArray.push('node-existed')
        } else {
          if (typeof(d.beyondAlign) !== 'undefined') {
            if (d.beyondAlign) {
              classArray.push('node-none')
            } else {
              classArray.push(generalMissedNodeClass)
            }
          } else {
            classArray.push(generalMissedNodeClass)
          }
        }
        if (d.compactAttr === Config.get('CONSTANT').TEMPLATE) {
          classArray.push('template')
        }
        return self.get_class_name(classArray)
      }
      ,
      add_aligned_lock_class: function () {
        var self = this
        var treeDataModel = self.model
        var alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
        var paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
        var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
        self.d3el.selectAll('.barcode-node')
          .each(function (d, i) {
            var nodeId = d.id
            if ((treeDataModel.is_aligned_start(nodeId) || treeDataModel.is_aligned_range(nodeId)) && (BarcodeGlobalSetting['Align_Lock'])) {
              d3.select(this).classed('locked-align', true)
            } else {
              d3.select(this).classed('locked-align', false)
            }
          })

      }
      ,
      remove_summary_histogram: function () {
        var self = this
        var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
        if (!BarcodeGlobalSetting['Comparison_Result_Display']) {
          self.d3el.selectAll('.stat-summary').style('visibility', 'hidden')
        }
      }
      ,
      /**
       * 更新barcode中的字体大小
       */
      update_barcode_font: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        if (barcodeHeight < 16) {
          self.d3el.select('#barcode-label')
            .style('font-size', function (d) {
              return barcodeHeight / 19 + 'rem'
            })
        } else {
          self.d3el.select('#barcode-label')
            .style('font-size', function (d) {
              return '1rem'
            })
        }
        self.d3el.select('#barcode-label')
          .attr('y', barcodeHeight / 2)
      }
      ,
      /**
       * 更新barcode中的背景
       */
      update_barcode_bg: function () {
        var self = this
        var treeDataModel = self.model
        var containerWidth = $('#barcodetree-view').width()
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        self.d3el.selectAll('rect.bg')
          .attr('width', containerWidth)
          .attr('height', barcodeHeight)
      }
      ,
      /**
       * 依据在barcodeModel中计算得到的barcodePaddingTop, 在更改不同模式的情况下更改barcode的container的位置
       */
      update_barcode_loc: function () {
        var self = this
        var treeDataModel = self.model
        var barcodePaddingLeft = self.barcodePaddingLeft
        var barcodePaddingTop = treeDataModel.get('barcodePaddingTop')
        var barcodeTreeYLocation = +treeDataModel.get('barcodeTreeYLocation')
        var COMPARISON_RESULT_PADDING = Config.get('COMPARISON_RESULT_PADDING')
        self.d3el.transition()
          .duration(Config.get('TRANSITON_DURATION'))
          .attr('transform', 'translate(' + 0 + ',' + barcodeTreeYLocation + ')')
        self.d3el.select('#barcode-container')
          .attr('transform', 'translate(' + barcodePaddingLeft + ',' + barcodePaddingTop + ')')
      }
      ,
      /**
       * 删除对齐的范围内的不存在的节点, 对齐范围内的节点哪些是需要删除的
       */
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
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongAligned(i, alignedRangeObjArray)))//(d.depth < 4)
          }), function (d, i) {
            return d.id
          })
        alignedBarcodeNodes.exit().remove()
      }
      ,
      /**
       * 更新对齐范围内存在的barcode节点, 在更新完成存在的对齐节点, 执行完成动画之后执行的方法
       */
      update_existed_aligned_barcode_node: function (next_step_func) {
        var self = this
        var treeDataModel = self.model
        var alignedRangeObjArray = self.get_aligned_range_array()
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
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongAligned(i, alignedRangeObjArray)) && (self.isExisted(i)))//(d.depth < 4)
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
          .attr('y', function (d, i) {
            return self.y_handler(d, i, self)
          })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('height', function (d, i) {
            return self.height_handler(d, i, self)
          })
          .style("cursor", "pointer")
          .style("fill", function (d, i) {
            return self.fill_handler(d, i, self)
          })
          .on('mouseover', function (d, i) {
            self.node_mouseover_handler(d, self)
          })
        // update 更新节点
        alignedBarcodeNodes.attr('width', function (d) {
          return +d.width
        })
          .transition()
          .duration(DURATION)
          .attr('x', function (d) {
            if (isNaN(d.x)) {
              return 0
            }
            return +d.x
          })
          .attr('y', function (d, i) {
            return self.y_handler(d, i, self)
          })
          .attr('height', function (d, i) {
            return self.height_handler(d, i, self)
          })
          .call(self.endall, function (d, i) {
            if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
              next_step_func()
            }
          })
      }
      ,
      /**
       * 更新不存在的对齐barcode节点, 在更新完成不存在的对齐节点, 执行完成动画之后执行的方法
       * 在更新了对齐过程中的不存在的节点, 自动添加summary的柱状图
       */
      update_unexisted_aligned_barcode_node: function (next_step_func) {
        var self = this
        var treeDataModel = self.model
        var generalMissedNodeClass = Variables.get('general_missed_node_class')
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        var alignedRangeObjArray = self.get_aligned_range_array()
        var paddingNodeObjArray = self.get_padding_node_array()
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
        var currentDisplayMode = Variables.get('displayMode')
        if (currentDisplayMode === Config.get('CONSTANT').GLOBAL) {
          self.d3el.select('#barcode-container')
            .selectAll('.' + generalMissedNodeClass)
            .remove()
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
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongAligned(i, alignedRangeObjArray)) && (!self.isExisted(i)))
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
          .attr('y', function (d, i) {
            return +d.y
          })
          .attr('width', function (d) {
            return +d.width
          })
          .attr('height', function (d, i) {
            return +d.height
          })
          .style("cursor", "pointer")
          .on('mouseover', function (d, i) {
            self.node_mouseover_handler(d, self)
          })
        // update 更新节点
        alignedBarcodeNodes.attr('width', function (d) {
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
          .attr('y', function (d, i) {
            return +d.y
          })
          .attr('height', function (d, i) {
            return +d.height
          })
          .call(self.endall, function (d, i) {
            if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
              next_step_func()
            }
            if (alignedComparisonResultArray == null) {
              self.add_comparison_summary()
            } else {
              self.add_missed_added_summary()
            }
          })
      }
      ,
      /**
       * 更新padding节点, 非对齐的收缩节点
       */
      update_padding_barcode_node: function (next_step_func) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        //  TODO
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var paddingNodeObjArray = self.get_padding_node_array()
        var DURATION = Config.get('TRANSITON_DURATION')
        var selectedLevels = Variables.get('selectedLevels')
        var paddingBarcodeNode = self.d3el.select('#barcode-container')
          .selectAll('.barcode-node')
          .data(barcodeNodeAttrArray.filter(function (d, i) {
            return ((selectedLevels.indexOf(d.depth) !== -1) && (self.isBelongPadding(i, paddingNodeObjArray)))//(d.depth < 4)
          }), function (d, i) {
            return d.id
          })
        paddingBarcodeNode.enter()
          .append('rect')
          .attr('class', function (d) {
            return self.padding_node_class_name_handler(d)
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
            self.node_mouseover_handler(d, self)
          })
        paddingBarcodeNode.attr('y', function (d) {
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
            }
          })
      }
      ,
      /**
       * 增加总结的柱状图
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
        // self.render_padding_cover_rect()
      }
      ,
      /**
       *  更新高亮在tree以及superTree中选择的节点
       */
      highlight_selection_supertree_selection_nodes: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeCollection = window.Datacenter.barcodeCollection
        var thisBarcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
        var supertreeSelectedNodesIdObj = barcodeCollection.get_supertree_selected_nodes_id()
        //  首先将所有的节点取消selection的高亮
        self.cancel_selection_highlight()
        //  首先对所有的节点的透明度统一进行改变
        self.selection_unhighlightNodes()
        var selectedSuperNodesIdLength = 0
        //  如果存在从superTree中选择的节点, 高亮从superTree中选择的节点
        for (var item in supertreeSelectedNodesIdObj) {
          var nodeId = item
          var nodeDepth = supertreeSelectedNodesIdObj[item]
          highlight_all_nodes(nodeId, nodeDepth)
          selectedSuperNodesIdLength = selectedSuperNodesIdLength + 1
        }
        //  高亮从实际的barcodeTree中选择的节点
        var selectedNodesIdObj = barcodeCollection.get_selected_nodes_id()
        var selectedNodesIdLength = 0
        // 然后按照选择的状态对于节点进行高亮
        for (var item in selectedNodesIdObj) {
          var nodeId = item
          var nodeDepth = selectedNodesIdObj[item].nodeObjDepth
          var nodeObjCategoryName = selectedNodesIdObj[item].categoryName
          var barcodeTreeId = selectedNodesIdObj[item].barcodeTreeId
          var nodeObj = {
            nodeObjId: nodeId,
            barcodeTreeId: selectedNodesIdObj[item].barcodeTreeId
          }
          if (barcodeCollection.get_node_obj_index_in_highlight_all_children_nodes_array(nodeObj) === -1) {
            //  之前选择的节点不存在与highlight all children nodes的情况下被高亮
            highlight_selected_nodes(nodeId, nodeDepth, nodeObjCategoryName, selectedNodesIdObj, barcodeTreeId, thisBarcodeTreeId)
            selectedNodesIdLength = selectedNodesIdLength + 1
          }
        }
        //  在locked状态下选择的节点进行高亮
        var alignedTreeSelectedNodesIdObj = barcodeCollection.get_aligned_tree_selected_node()
        var alignedSelectedNodesIdLength = 0
        // 然后按照选择的状态对于节点进行高亮
        for (var item in alignedTreeSelectedNodesIdObj) {
          var nodeId = item
          var nodeDepth = alignedTreeSelectedNodesIdObj[item].nodeObjDepth
          var nodeObjCategoryName = selectedNodesIdObj[item].categoryName
          var barcodeTreeId = alignedTreeSelectedNodesIdObj[item].barcodeTreeId
          var nodeObj = {
            nodeObjId: nodeId,
            barcodeTreeId: alignedTreeSelectedNodesIdObj[item].barcodeTreeId
          }
          highlight_selected_nodes(nodeId, nodeDepth, nodeObjCategoryName, alignedTreeSelectedNodesIdObj, barcodeTreeId, thisBarcodeTreeId)
          //
          alignedSelectedNodesIdLength = alignedSelectedNodesIdLength + 1
        }
        if ((alignedSelectedNodesIdLength === 0) && (selectedSuperNodesIdLength === 0)) {
          cancel_aligned_lock_unhighlightNodes()
        }
        if ((selectedSuperNodesIdLength === 0) && (selectedNodesIdLength === 0)) {
          if (BarcodeGlobalSetting['Align_Lock']) {
            if (alignedSelectedNodesIdLength === 0) {
              cancel_aligned_lock_unhighlightNodes()
            }
          } else {
            self.cancel_selection_unhighlightNodes()
          }
        }

        function cancel_aligned_lock_unhighlightNodes() {
          self.d3el.selectAll('.locked-align').each(function (d, i) {
            d3.select(this).classed('selection-unhighlight', false)
          })
        }

        //  选择在该子树中的所有部分的节点
        function highlight_all_nodes(nodeId, nodeDepth) {
          var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
          var relatedNodesObj = treeDataModel.find_related_nodes({id: nodeId, depth: nodeDepth})
          self.highlight_single_selection_node(nodeId, nodeDepth)
          if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
            var selectedSiblingNodeObjArray = relatedNodesObj.siblingNodes
            if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
              highlight_sibling_node(selectedSiblingNodeObjArray)
            }
            var selectedChildrenNodeIdArray = relatedNodesObj.childrenNodes
            if (typeof (selectedChildrenNodeIdArray) !== 'undefined') {
              highlight_selection_node(selectedChildrenNodeIdArray)
            }
          }
        }

        //  只是选择在该子树中的选择部分的节点
        function highlight_selected_nodes(nodeId, nodeDepth, nodeObjCategoryName, selectedNodesIdObj, barcodeTreeId, thisBarcodeTreeId) {
          var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
          if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['NODE_SELECTION']) {
            var nodeExisted = node_existed(barcodeNodeAttrArray, nodeId)
            if (nodeExisted) {
              self.highlight_single_selection_node(nodeId, nodeDepth)
            } else {
              self.highlight_miss_selection_node(nodeId)
            }
            //  找到与该节点以及该节点的孩子节点具有相同name的节点并且进行高亮
            if (barcodeTreeId !== thisBarcodeTreeId) {
              var thisNodeObj = {
                categoryName: nodeObjCategoryName,
                depth: nodeDepth
              }
              var sameCategoryNodeObjArray = self.find_single_same_category_node(thisNodeObj)
              if (typeof (sameCategoryNodeObjArray) !== 'undefined') {
                for (var sI = 0; sI < sameCategoryNodeObjArray.length; sI++) {
                  var sameNodeId = sameCategoryNodeObjArray[sI].id
                  var sameNodeDepth = sameCategoryNodeObjArray[sI].depth
                  self.highlight_single_selection_node(sameNodeId, sameNodeDepth)
                }
              }
            }
          } else if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
            //  在当前的treeDataModel中找到的相关节点
            var comparedResultsObj = treeDataModel.get_selected_comparison_result(nodeId)
            if (comparedResultsObj == null) {
              var thisTreeFindingNodesObj = treeDataModel.find_related_nodes({id: nodeId, depth: nodeDepth})
              var findingNodesObj = {
                siblingNodes: selectedNodesIdObj[nodeId].selectedSiblingNodeObjArray,
                childrenNodes: selectedNodesIdObj[nodeId].selectedChildrenNodeIdArray
              }
              comparedResultsObj = treeDataModel.compareNodes(findingNodesObj, thisTreeFindingNodesObj)
            }
            //  找到与该节点以及该节点的孩子节点具有相同name的节点并且进行高亮
            if (barcodeTreeId !== thisBarcodeTreeId) {
              var sameCategoryNodeObjArray = self.find_same_category_node_array(selectedNodesIdObj[nodeId].selectedChildrenNodeIdArray)
              if (typeof (sameCategoryNodeObjArray) !== 'undefined') {
                highlight_selection_node(sameCategoryNodeObjArray)
              }
            }
            var nodeExisted = treeDataModel.is_node_existed(nodeId)
            // var nodeExisted = node_existed(thisTreeFindingFatherCurrentNodes, nodeId)
            if (nodeExisted) {
              self.highlight_single_selection_node(nodeId, nodeDepth)
            } else {
              self.highlight_miss_selection_node(nodeId)
            }
            var selectedSiblingNodeObjArray = selectedNodesIdObj[nodeId].selectedSiblingNodeObjArray
            if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
              highlight_sibling_node(selectedSiblingNodeObjArray)
            }
            // var selectedChildrenNodeIdArray = selectedNodesIdObj[nodeId].selectedChildrenNodeIdArray
            var sameChildrenNodeIdArray = comparedResultsObj.childrenNodes.same
            if (typeof (sameChildrenNodeIdArray) !== 'undefined') {
              highlight_selection_node(sameChildrenNodeIdArray)
            }
            var addChildrenNodeIdArray = comparedResultsObj.childrenNodes.add
            if (typeof (addChildrenNodeIdArray) !== 'undefined') {
              highlight_add_selection_node(addChildrenNodeIdArray)
            }
            var missChildrenNodeIdArray = comparedResultsObj.childrenNodes.miss
            if (typeof (missChildrenNodeIdArray) !== 'undefined') {
              highlight_miss_selection_node(missChildrenNodeIdArray)
            }
          }
        }

        //  判断节点是否存在
        function node_existed(nodeArray, nodeId) {
          var nodeExisted = false
          for (var tI = 0; tI < nodeArray.length; tI++) {
            if (nodeArray[tI].existed) {
              if (nodeArray[tI].id === nodeId) {
                nodeExisted = true
                break
              }
            }
          }
          return nodeExisted
        }

        //  高亮兄弟节点
        function highlight_sibling_node(selectedSiblingNodeObjArray) {
          if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
            for (var sI = 0; sI < selectedSiblingNodeObjArray.length; sI++) {
              var selectedSiblingNode = selectedSiblingNodeObjArray[sI]
              var nodeId = selectedSiblingNode.id
              var nodeDepth = selectedSiblingNode.depth
              self.highlight_single_sibling_node(nodeId, nodeDepth)
            }
          }
        }

        //  高亮增加部分的孩子节点
        function highlight_add_selection_node(addChildrenNodeIdArray) {
          if (typeof (addChildrenNodeIdArray) !== 'undefined') {
            for (var sI = 0; sI < addChildrenNodeIdArray.length; sI++) {
              var addChildrenNode = addChildrenNodeIdArray[sI]
              var nodeId = addChildrenNode.id
              self.highlight_add_selection_node(nodeId)
            }
          }
        }

        //  高亮缺失部分的孩子节点
        function highlight_miss_selection_node(missChildrenNodeIdArray) {
          if (typeof (missChildrenNodeIdArray) !== 'undefined') {
            for (var sI = 0; sI < missChildrenNodeIdArray.length; sI++) {
              var missChildrenNode = missChildrenNodeIdArray[sI]
              var nodeId = missChildrenNode.id
              self.highlight_miss_selection_node(nodeId)
            }
          }
        }

        //  高亮相同部分的孩子节点
        function highlight_selection_node(selectedChildrenNodeIdArray) {
          for (var sI = 0; sI < selectedChildrenNodeIdArray.length; sI++) {
            var selectedChildrenNode = selectedChildrenNodeIdArray[sI]
            var nodeId = selectedChildrenNode.id
            var nodeDepth = selectedChildrenNode.depth
            self.highlight_single_selection_node(nodeId, nodeDepth)
          }
        }

        //  取消节点的unhighlight的状态
        function cancel_node_unhighlight(selectedChildrenNodeIdArray) {
          for (var sI = 0; sI < selectedChildrenNodeIdArray.length; sI++) {
            var selectedChildrenNode = selectedChildrenNodeIdArray[sI]
            var nodeId = selectedChildrenNode.id
            var nodeDepth = selectedChildrenNode.depth
            self.remove_node_unhighlight(nodeId, nodeDepth)
          }
        }

        //  判断是否存在选中的节点, 如果不存在那么需要将透明度恢复原始状态
        // if ((self.d3el.selectAll('.selection-highlight').empty()) && (self.d3el.selectAll('.selection-sibling-highlight').empty())) {
        // }
      }
      ,
      /**
       * 在该节点的孩子节点部分增加locked-aligned的class
       */
      add_locked_align_class: function (nodeId, nodeDepth) {
        var self = this
        var treeDataModel = self.model
        var barcodeCollection = window.Datacenter.barcodeCollection
        var selectedNodesIdObj = barcodeCollection.get_selected_nodes_id()
        // 然后按照选择的状态对于节点进行高亮
        for (var item in selectedNodesIdObj) {
          var nodeId = item
          var nodeDepth = selectedNodesIdObj[item].nodeObjDepth
          var relatedNodesObj = treeDataModel.find_related_nodes({id: nodeId, depth: nodeDepth})
          // self.remove_node_unhighlight(nodeId, nodeDepth)
          self.add_single_locked_align_class(nodeId, nodeDepth)
          var selectedChildrenNodeIdArray = relatedNodesObj.childrenNodes
          if (typeof (selectedChildrenNodeIdArray) !== 'undefined') {
            // cancel_node_unhighlight(selectedChildrenNodeIdArray)
            add_node_locked_align(selectedChildrenNodeIdArray)
          }
        }

        //  在节点上增加locked-aligned的class
        function add_node_locked_align(selectedChildrenNodeIdArray) {
          for (var sI = 0; sI < selectedChildrenNodeIdArray.length; sI++) {
            var selectedChildrenNode = selectedChildrenNodeIdArray[sI]
            var nodeId = selectedChildrenNode.id
            var nodeDepth = selectedChildrenNode.depth
            self.add_single_locked_align_class(nodeId, nodeDepth)
          }
        }
      }
      ,
      /**
       *  删除节点中所有的locked-aligned的类别
       */
      remove_locked_align_class: function () {
        var self = this
        self.d3el.selectAll('.locked-align').classed('locked-align', false)
      }
      ,
      /**
       * 在节点上增加locked-aligned的class
       */
      add_single_locked_align_class: function (nodeId, nodeDepth) {
        var self = this
        self.d3el.select('#' + nodeId)
          .classed('locked-align', true)
      }
      ,
      //  取消节点的unhighlight的状态
      remove_node_unhighlight: function (nodeId, nodeDepth) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        self.d3el.select('#' + nodeId)
          .classed('selection-unhighlight', false)
      }
      ,
      //  高亮缺失的选择的后代的节点
      highlight_miss_selection_node: function (nodeId) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
        var missed_node_class = Variables.get('missed_node_class')
        self.d3el.select('#' + nodeId)
          .classed(missed_node_class, true)
          .classed('selection-unhighlight', false)
          .classed('unhighlight', false)
      }
      ,
      //  高亮增加的选择的后代的节点
      highlight_add_selection_node: function (nodeId) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
        self.d3el.select('#' + nodeId)
          .classed('added-node-highlight', true)
          .classed('selection-unhighlight', false)
          .classed('unhighlight', false)
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
       *  更新点击高亮的节点
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
          var selectionNodeDepth = selectedNodesIdObj[item].nodeObjDepth
          var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
          if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['NODE_SELECTION']) {
            self.highlight_single_selection_node(selectionNodeId, selectionNodeDepth)
          } else if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
            var selectedSiblingNodeObjArray = selectedNodesIdObj[item].selectedSiblingNodeObjArray
            if (typeof (selectedSiblingNodeObjArray) !== 'undefined') {
              for (var sI = 0; sI < selectedSiblingNodeObjArray.length; sI++) {
                var selectedSiblingNode = selectedSiblingNodeObjArray[sI]
                var nodeId = selectedSiblingNode.id
                var nodeDepth = selectedSiblingNode.depth
                self.highlight_single_sibling_node(nodeId, nodeDepth)
              }
            }
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
        }
        //  判断是否存在选中的节点, 如果不存在那么需要将透明度恢复原始状态
        if ((self.d3el.selectAll('.selection-highlight').empty()) && (self.d3el.selectAll('.selection-sibling-highlight').empty())) {
          self.cancel_selection_unhighlightNodes()
        }
      }
      ,
      /**
       *  刷新标记当前操作节点的icon的方法
       */
      update_interaction_icon: function () {
        var self = this
        _remove_interaction_icon()
        _inner_update_interaction_icon()
        var ICON_WAIT_DURATION = Config.get('BARCODETREE_VIEW_SETTING')['ICON_WAIT_DURATION']
        setTimeout(function () {
          _inner_update_interaction_icon()
        }, ICON_WAIT_DURATION)
        //  更新当前操作的节点
        function _inner_update_interaction_icon() {
          //  增加标记barcodetree的子树节点折叠的icon
          self.add_collapsed_triangle()
          //  更新标记当前选择子树节点的icon
          self.update_current_selected_icon()
          //  更新标记当前编辑子树节点的icon
          self.update_current_edit_icon()
          //  更新编辑当前align节点的icon
          // self.update_aligned_sort_icon()
          //  更新barcodetree当前标记的icon
          self.update_compare_based_anchor()
        }

        //  删除在该barcode上所有的interactive icon
        function _remove_interaction_icon() {
          self.d3el.selectAll('.align-sort-icon').remove()
        }
      }
      ,
      /**
       *  节点的颜色填充函数fill
       */
      fill_handler: function (d, i, self) {
        // var num = d.num
        // var maxnum = d.maxnum
        // var treeDataModel = self.model
        // var barcodeRectBgColor = treeDataModel.get('barcodeRectBgColor')
        // if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
        //   return barcodeRectBgColor
        // } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
        //   if (typeof (maxnum) !== 'undefined') {
        //     return self.colorCompute(num / maxnum)
        //   } else {
        //     return null
        //   }
        // }
        var treeDataModel = self.model
        var barcodeRectBgColor = treeDataModel.get('barcodeRectBgColor')
        return barcodeRectBgColor
      }
      ,
      /**
       *  其他节点的class计算函数fill
       */
      class_name_handler: function (d) {
        var self = this
        var classArray = []
        var generalMissedNodeClass = Variables.get('general_missed_node_class')
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
              classArray.push(generalMissedNodeClass)
            }
          } else {
            classArray.push(generalMissedNodeClass)
          }
        }
        return self.get_class_name(classArray)
      }
      ,
      /**
       *  padding节点的class计算函数fill
       */
      padding_node_class_name_handler: function (d) {
        var self = this
        var classArray = []
        var generalMissedNodeClass = Variables.get('general_missed_node_class')
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
              classArray.push(generalMissedNodeClass)
            }
          } else {
            classArray.push(generalMissedNodeClass)
          }
        }
        return self.get_class_name(classArray)
      }
      ,
      //  判断节点是否是aligned范围, 如果属于aligned范围, 那么绘制节点; 否则这些节点不会被绘制
      isBelongAligned: function (nodeIndex, alignedRangeObjArray) {
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
        }
        return false
      }
      ,
      //  判断节点是否属于padding节点的范围
      isBelongPadding: function (nodeIndex, paddingNodeObjArray) {
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
      //  高亮鼠标悬停的节点
      highlight_current_node: function (nodeObj) {
        var self = this
        self.d3el.selectAll('rect#' + nodeObj.id)
          .classed('father-highlight', true)
          .style('fill', 'black')
        self.d3el.selectAll('path#' + nodeObj.id)
          .classed('current-highlight', true)
        self.d3el.selectAll('#' + nodeObj.id)// 需要对于当前鼠标hover的节点取消高亮
          .classed('unhighlight', false)
        self.d3el.selectAll('#' + nodeObj.id)// 取消对于非选择部分的unhighlight
          .classed('selection-unhighlight', false)
      }
      ,
      //  高亮节点的总函数, 在这个对象中调用高亮孩子节点, 父亲等路径节点, 兄弟节点等节点
      highlight_finding_node: function (thisNodeObj, findingNodesObj, barcodeTreeId) {
        var self = this
        var treeDataModel = self.model
        var thisBarcodeTreeId = treeDataModel.get('barcodeTreeId')
        //  高亮当前的节点
        // var findingNodesObj = treeDataModel.find_related_nodes(thisNodeObj)
        var BARCODETREE_GLOBAL_PARAS = Variables.get('BARCODETREE_GLOBAL_PARAS')
        if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['NODE_SELECTION']) {
          self.unhighlightNodes()
          self.cancel_selection_unhighlightNodes()
          self.highlight_current_node(thisNodeObj)
          //  找到与该节点具有相同name的节点进行高亮
          if (barcodeTreeId !== thisBarcodeTreeId) {
            var sameCategoryNodeObjArray = self.find_single_same_category_node(thisNodeObj)
            if (typeof (sameCategoryNodeObjArray) !== 'undefined') {
              for (var sI = 0; sI < sameCategoryNodeObjArray.length; sI++) {
                self.highlight_current_node(sameCategoryNodeObjArray[sI])
              }
            }
          }
        } else if (BARCODETREE_GLOBAL_PARAS['Selection_State'] === Config.get('CONSTANT')['SUBTREE_SELECTION']) {
          self.unhighlightNodes()
          self.cancel_selection_unhighlightNodes()
          var childrenNodes = findingNodesObj.childrenNodes
          var fatherCurrentNodes = findingNodesObj.fatherCurrentNodes
          var siblingNodes = findingNodesObj.siblingNodes
          var thisTreeFindingNodesObj = treeDataModel.find_related_nodes(thisNodeObj)
          var comparedResultsObj = treeDataModel.compareNodes(findingNodesObj, thisTreeFindingNodesObj)
          var sameChildrenNodes = comparedResultsObj.childrenNodes.same
          self.highlightChildrenNodes(sameChildrenNodes)
          var missChildrenNodes = comparedResultsObj.childrenNodes.miss
          self.highlightMissedChildrenNodes(missChildrenNodes)
          var addChildrenNodes = comparedResultsObj.childrenNodes.add
          self.highlightAddChildrenNodes(addChildrenNodes)
          self.highlightFatherAndCurrentNodes(fatherCurrentNodes)
          self.highlightSiblingNodes(siblingNodes)
          //  找到与该节点以及该节点的孩子节点具有相同name的节点并且进行高亮
          if (barcodeTreeId !== thisBarcodeTreeId) {
            var sameCategoryNodeObjArray = self.find_single_same_category_node(thisNodeObj)
            if (typeof (sameCategoryNodeObjArray) !== 'undefined') {
              for (var sI = 0; sI < sameCategoryNodeObjArray.length; sI++) {
                self.highlight_current_node(sameCategoryNodeObjArray[sI])
              }
            }
            var sameCategoryNodeObjArray = self.find_same_category_node_array(childrenNodes)
            if (typeof (sameCategoryNodeObjArray) !== 'undefined') {
              self.highlightChildrenNodes(sameCategoryNodeObjArray)
            }
          }
        }
      },
      /**
       * 找到具有相同的category的节点
       */
      find_single_same_category_node: function (nodeObj) {
        var self = this
        var treeDataModel = self.model
        var categoryName = nodeObj.categoryName
        var barcodeNodeAttrArrayCategoryIndexObj = treeDataModel.get('barcodeNodeAttrArrayCategoryIndexObj')
        var sameCategoryNodeArray = barcodeNodeAttrArrayCategoryIndexObj[categoryName]
        if (typeof (sameCategoryNodeArray) !== 'undefined') {
          for (var sI = 0; sI < sameCategoryNodeArray.length; sI++) {
            if (sameCategoryNodeArray[sI].depth !== nodeObj.depth) {
              sameCategoryNodeArray.splice(sI, 1)
            }
          }
        }
        return sameCategoryNodeArray
      },
      /**
       * 找到具有相同的category的节点数组
       */
      find_same_category_node_array: function (nodeObjArray) {
        var self = this
        var sameCategoryNodeArray = []
        for (var nI = 0; nI < nodeObjArray.length; nI++) {
          var singleSameCategoryNodeArray = self.find_single_same_category_node(nodeObjArray[nI])
          if (typeof(singleSameCategoryNodeArray) !== 'undefined') {
            for (var sI = 0; sI < singleSameCategoryNodeArray.length; sI++) {
              sameCategoryNodeArray.push(singleSameCategoryNodeArray[sI])
            }
          }
        }
        return sameCategoryNodeArray
      },
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
       *  高亮缺失部分的孩子节点
       */
      highlightMissedChildrenNodes: function (missedChildrenNodesArray) {
        var self = this
        for (var mI = 0; mI < missedChildrenNodesArray.length; mI++) {
          var missedChildrenNodeObjId = missedChildrenNodesArray[mI].id
          self.highlight_miss_selection_node(missedChildrenNodeObjId)
        }
      }
      ,
      /**
       * 高亮增加部分的孩子节点
       */
      highlightAddChildrenNodes: function (addChildrenNodesArray) {
        var self = this
        for (var aI = 0; aI < addChildrenNodesArray.length; aI++) {
          var addChildrenNodeObjId = addChildrenNodesArray[aI].id
          self.highlight_add_selection_node(addChildrenNodeObjId)
        }
      }
      ,
      /**
       * 鼠标离开节点
       */
      node_mouseout_handler: function (eventView) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var missed_node_class = Variables.get('missed_node_class')
        if (typeof (eventView) === "undefined") {
          tip.hide()
        }
        self.d3el.selectAll('.link-circle').remove()
        self.d3el.selectAll('.node-link').remove()
        self.d3el.selectAll('.children-highlight').style('fill', function (d, i) {
          if (typeof (d) !== 'undefined') {
            return self.fill_handler(d, i, self)
          } else {
            return null
          }
        })
        self.d3el.selectAll('.father-highlight').style('fill', function (d, i) {
          if (typeof (d) !== 'undefined') {
            return self.fill_handler(d, i, self)
          } else {
            return null
          }
        })
        self.d3el.selectAll('.sibling-highlight').classed('sibling-highlight', false)
        self.d3el.selectAll('.barcode-node').classed('unhighlight', false)
        self.d3el.selectAll('.stat-summary').classed('unhighlight', false)
        self.d3el.selectAll('.added-node-highlight').classed('added-node-highlight', false)
        self.d3el.selectAll('.' + missed_node_class).classed(missed_node_class, false)
        d3.select('#barcodetree-svg').selectAll('.collapse-triangle.' + barcodeTreeId)
          .classed('sibling-highlight', false).classed('unhighlight', false)
        //  更新原始的barcodeTree以及superTree中选择的节点
        self.highlight_selection_supertree_selection_nodes()
      }
      ,
      /**
       * 增加当前选择的节点的icon
       */
      update_current_selected_icon: function () {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
        self.d3el.selectAll('.select-icon').remove()
        var selectedNodesIdObj = barcodeCollection.get_selected_nodes_id()
        var alignedTreeSelectedNodesIdObj = barcodeCollection.get_aligned_tree_selected_node()
        if (!BarcodeGlobalSetting['Align_Lock']) {
          for (var item in selectedNodesIdObj) {
            var barcodeTreeId = selectedNodesIdObj[item].barcodeTreeId
            var nodeObjId = item
            var nodeObj = {
              nodeObjId: nodeObjId,
              barcodeTreeId: barcodeTreeId
            }
            if (BarcodeGlobalSetting['Align_Lock']) {
              if (barcodeCollection.get_node_obj_index_in_highlight_all_children_nodes_array(nodeObj) === -1) {
                //  在aligned locked情况下, 之前选择的节点不存在highlight all children nodes的情况下才会增加selectedIcon
                self._add_single_selection_icon(barcodeTreeId, nodeObjId)
              }
            } else {
              //  之前选择的节点不存在highlight all children nodes的情况下才会增加selectedIcon
              self._add_single_selection_icon(barcodeTreeId, nodeObjId)
            }
          }
        }
        //  还需要增加在对齐的状态下增加的节点的edit icon
        if (BarcodeGlobalSetting['Align_Lock']) {
          for (var item in alignedTreeSelectedNodesIdObj) {
            var barcodeTreeId = alignedTreeSelectedNodesIdObj[item].barcodeTreeId
            var nodeObjId = item
            var nodeObj = {
              nodeObjId: nodeObjId,
              barcodeTreeId: barcodeTreeId
            }
            if (BarcodeGlobalSetting['Align_Lock']) {
              //  之前选择的节点不存在highlight all children nodes的情况下才会增加selectedIcon
              self._add_single_selection_icon(barcodeTreeId, nodeObjId)
            }
          }
        }
      }
      ,
      /**
       * 增加单个当前选择的节点
       */
      _add_single_selection_icon: function (barcodeTreeId, nodeObjId) {
        var self = this
        var treeDataModel = self.model
        var barcodeNodeAttrArrayObj = treeDataModel.get('barcodeNodeAttrArrayObj')
        var barcodeCollection = window.Datacenter.barcodeCollection
        var thisBarcodeTreeId = treeDataModel.get('barcodeTreeId')
        self.d3el.select('#barcode-container').select('.select-icon#' + nodeObjId).remove()
        if (barcodeTreeId === thisBarcodeTreeId) {
          var nodeData = barcodeNodeAttrArrayObj[nodeObjId]
          var nodeX = +self.d3el.select('#' + nodeObjId).attr('x')
          var nodeWidth = +self.d3el.select('#' + nodeObjId).attr('width')
          var nodeY = +self.d3el.select('#' + nodeObjId).attr('y')
          var nodeHeight = +self.d3el.select('#' + nodeObjId).attr('height')
          var iconSize = nodeWidth > nodeHeight ? nodeHeight : nodeWidth
          var iconX = nodeX + nodeWidth / 2
          var iconY = nodeY + nodeHeight / 2
          var selectIconColor = Variables.get('select_icon_color')
          if (nodeWidth !== 0) {
            self.d3el.select('#barcode-container')
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
              .style('font-size', iconSize + 'px')
              .on('click', function (d, i) {
                self.single_click_select_handler(nodeData)
              })
          }
        }
      }
      ,
      /**
       * 获取当前视图中使用的alignRangeArray
       */
      get_aligned_range_array: function () {
        var self = this
        var treeDataModel = self.model
        var alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
        return alignedRangeObjArray
      }
      ,
      /**
       * 获取当前视图中使用的paddingNodeArray
       */
      get_padding_node_array: function () {
        var self = this
        var treeDataModel = self.model
        var paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
        return paddingNodeObjArray
      }
      ,
      /**
       * 获取当前的视图中使用的compactBarcodeNodeArrayObject
       */
      get_comact_barcode_node_array_obj: function () {
        var self = this
        var treeDataModel = self.model
        var compactBarcodeNodeAttrArrayObj = treeDataModel.get('compactBarcodeNodeAttrArrayObj')
        return compactBarcodeNodeAttrArrayObj
      }
      ,
      /**
       * 获取当前的视图中使用的barcodeNodeArray
       */
      get_barcode_node_array: function () {
        var self = this
        var treeDataModel = self.model
        if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          //  切换到原始的barcodeTree的compact的显示模式
          var compactBarcodeNodeAttrArrayObj = treeDataModel.get('compactBarcodeNodeAttrArrayObj')
          barcodeNodeAttrArray = compactBarcodeNodeAttrArrayObj['compact-0']
        } else if ((Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) || ((Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL))) {
          //  切换到原始的barcodeTree的显示模式
          var barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
        }
        return barcodeNodeAttrArray
      }
      ,
      //  在对齐节点之前增加比较的统计结果
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
        if (alignedComparisonResultArray != null)
          return
        self.d3el.select('#barcode-container').selectAll('.add-miss-summary').remove()
        self.d3el.select('#barcode-container').selectAll('.stat-summary').remove()
        // self.d3el.selectAll('.same-node-highlight').classed('same-node-highlight', false)
        // self.d3el.selectAll('.added-node-highlight').classed('added-node-highlight', false)
        // self.d3el.selectAll('.missed-node-highlight').classed('missed-node-highlight', false)
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
          var subtreeDepth = maxDepth - alignObjDepth + 1
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
              return aligned_summary_visible_state()
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
              return aligned_summary_visible_state()
            })
          nodeDistributionSummary.exit().remove()
          //  判断统计barcodeTree的每层数量的柱状图是否显示的函数
          function aligned_summary_visible_state() {
            var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
            if (BarcodeGlobalSetting['Comparison_Result_Display']) {
              return 'visible'
            } else {
              return 'hidden'
            }
          }
        }
      }
      ,
      //  计算增加,减少的柱状图的高度
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
      //  计算comparison summary的柱状图的高度
      get_comparison_summary_height: function (subtree_depth) {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeComparisonHeight = barcodeHeight * 0.8
        var maxDepth = Variables.get('maxDepth')
        var singleComparisonHeightWithPadding = barcodeComparisonHeight / subtree_depth
        if (subtree_depth === 0) {
          singleComparisonHeightWithPadding = 0
        }
        return singleComparisonHeightWithPadding
      }
      ,
      //  ============================================================================
      //  选择点击的的barcodeTree的数组
      select_group_barcodetree: function (selectionArray) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        //  首先取消当前树的选择状态
        self.remove_set_operation_selection_anchor()
        if (selectionArray.indexOf(barcodeTreeId) !== -1) {
          // 如果当前的树的id包括在选择的数组中, 那么久增加当前树的选择状态
          self.add_set_operation_selection_anchor()
        }
      }
      ,
      //  取消选择点击的的barcodeTree的数组
      unselect_group_barcodetree: function () {
        //  取消当前树的选择状态
        var self = this
        self.remove_set_operation_selection_anchor()
      }
      ,
      init_common_util: function () {
        var self = this
        //  初始化颜色计算的工具
        var white = d3.rgb(255, 255, 255)
        var black = d3.rgb(0, 0, 0)
        var colorCompute = d3.interpolate(white, black)
        self.colorCompute = colorCompute
      }
      ,
      //  barcodeTree视图的字体大小
      get_font_size: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var labelFontSize = barcodeHeight / 19
        return labelFontSize
      }
      ,
      update_filtering_nodes: function (highlightObjArray, distributionLevel) {
        var self = this
        var barcodeTreeId = self.model.get('barcodeTreeId')
        if (distributionLevel === 'ratio') {
          if (highlightObjArray.length > 0) {
            self.d3el.selectAll('.barcode-node')
              .classed('distribution-unhighlight', true)
          } else {
            self.d3el.selectAll('.barcode-node')
              .classed('distribution-unhighlight', false)
          }
        } else {
          // if (highlightObjArray.length > 0) {
          //   self.d3el.selectAll('.barcode-node-level-' + distributionLevel)
          //     .style('opacity', 0.1)
          // } else {
          //   self.d3el.selectAll('.barcode-node-level-' + distributionLevel)
          //     .style('opacity', 1)
          // }
          if (highlightObjArray.length > 0) {
            self.d3el.selectAll('.barcode-node')
              .classed('distribution-unhighlight', true)
          } else {
            self.d3el.selectAll('.barcode-node')
              .classed('distribution-unhighlight', false)
          }
        }
        // .classed('filtering-unhighlight', true)
        for (var hI = 0; hI < highlightObjArray.length; hI++) {
          if (barcodeTreeId === highlightObjArray[hI].treeId) {
            self.d3el.selectAll('#' + highlightObjArray[hI].nodeId)
              .classed('distribution-unhighlight', false)
          }
        }
      }
      // ,
      // y_handler: function (d, i, self) {
      //   var num = d.num
      //   var maxnum = d.maxnum
      //   if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
      //     return 0
      //   } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
      //     if (typeof (maxnum) !== 'undefined') {
      //       return d.height - num / maxnum * d.height
      //     } else {
      //       return 0
      //     }
      //   }
      // }
      // ,
      // height_handler: function (d, i, self) {
      //   var num = d.num
      //   var maxnum = d.maxnum
      //   if (Variables.get('comparisonMode') === Variables.get('TOPOLOGICAL')) {
      //     return d.height
      //   } else if (Variables.get('comparisonMode') === Variables.get('ATTRIBUTE')) {
      //     if (typeof (maxnum) !== 'undefined') {
      //       return num / maxnum * d.height
      //     } else {
      //       return d.height
      //     }
      //   }
      // }
      ,
      //  同时移动对齐的barcode节点
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
      }
      ,
      //  点击barcode节点, 首先padding node先收缩, 然后aligned node的位置移动,然后出现non existed的节点
      shrink_barcode_tree: function () {
        var self = this
        self.update_padding_barcode_node(self.update_aligned_barcode_node.bind(self))
      }
      ,
      //  改变当前filter的model的状态
      change_filtered_state: function () {
        var self = this
        var treeDataModel = self.model
        var filterState = treeDataModel.get('filterState')
        if (filterState) {
          self.singleTree.select('.bg').classed('barcode-tree-filter', true)
        } else {
          self.singleTree.select('.bg').classed('barcode-tree-filter', false)
        }
      }
      ,
      //  点击covered rect节点, 先移动aligned节点, 然后将padding节点移动
      move_aligned_first_stretch_padding_next_update: function () {
        var self = this
        self.update_aligned_barcode_node_concurrent()
      }
      ,
      //  点击barcode收缩时先判断动画是否结束
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
      //  根据当前barcode collection中的记录, 绘制折叠的barcode子树的三角形
      add_collapsed_triangle: function () {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var collapsedNodeIdArray = barcodeCollection.get_collapsed_nodes_id()
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var maxWidthHeight = self.get_tree_max_width_height(collapsedNodeIdArray, barcodeNodeAttrArray)
        d3.select('#barcodetree-svg').selectAll('.collapse-triangle.' + barcodeTreeId).remove()
        for (var cI = 0; cI < collapsedNodeIdArray.length; cI++) {
          self.add_single_collapsed_triangle(collapsedNodeIdArray[cI], maxWidthHeight)
        }
      }
      ,
      //  计算层次结构数据的最大的宽度以及高度
      get_tree_max_width_height: function (collapsedNodeIdArray) {
        var self = this
        var maxWidth = 0
        var maxHeight = 0
        for (var cI = 0; cI < collapsedNodeIdArray.length; cI++) {
          var treeAttr = self.get_subtree_width_height(collapsedNodeIdArray[cI])
          if (maxWidth < treeAttr.width) {
            maxWidth = treeAttr.width
          }
          if (maxHeight < treeAttr.height) {
            maxHeight = treeAttr.height
          }
          return {maxWidth: maxWidth, maxHeight: maxHeight}
        }
      }
      ,
      //  获取节点为根的子树的宽度
      get_subtree_width_height: function (nodeId) {
        var self = this
        var leveledNodeObj = self.get_leveled_node_obj(nodeId)
        var wholeWidth = 0
        var height = 0
        for (var item in leveledNodeObj) {
          var barcodeLevelWidth = leveledNodeObj[item]
          wholeWidth = wholeWidth + barcodeLevelWidth
          height = height + 1
        }
        var treeAttr = {
          width: wholeWidth / height,
          height: height
        }
        return treeAttr
      }
      ,
      //  根据节点id在节点的底部增加代表节点所代表子树的三角形
      add_single_collapsed_triangle: function (nodeId, maxWidthHeight) {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var triangleYPadding = 1
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var maxWidth = maxWidthHeight.maxWidth
        var maxHeight = maxWidthHeight.maxHeight
        var rootWidth = window.barcodeWidthArray[0]
        var minNodeWidth = window.barcodeWidthArray[window.barcodeWidthArray.length - 1]
        var barcodeNodeInterval = Variables.get('barcodeNodeInterval')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeGapHeight = barcodeHeight * (1 - 0.8) * 0.5
        var heightScale = d3.scale.linear().domain([0, maxHeight]).range([0, barcodeGapHeight])
        var widthScale = d3.scale.linear().domain([0, maxWidth]).range([minNodeWidth, (rootWidth + barcodeNodeInterval)])
        var treeAttr = self.get_subtree_width_height(nodeId, barcodeNodeAttrArray)
        var subtreeWidth = widthScale(treeAttr.width)
        var subtreeHeight = heightScale(treeAttr.height)
        append_triangle(nodeId, subtreeHeight, subtreeWidth)
        //  在barcodeTree中增加triangle
        function append_triangle(node_id, subtree_height, subtree_width) {
          var selectedNode = self.d3el.select('#barcode-container')
            .select('.barcode-node#' + node_id)
          if (self.d3el.select('#barcode-container').select('.barcode-node#' + node_id).empty()) {
            return
          }
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
            .attr('class', 'collapse-triangle ' + barcodeTreeId)
            .attr('id', node_id)
            .attr("d", lineFunction(lineData))
            .attr('transform', 'translate(' + triangleSvgX + ',' + triangleSvgY + ')')
        }
      }
      ,
      //  将以节点为根节点的子树中的所有节点进行分层
      get_leveled_node_obj: function (nodeId) {
        var self = this
        var nodeDepth = 0
        var nodeStartIndex = 0
        var nodeEndIndex = 0
        var depthAttrPrefix = 'depth-'
        var barcodeNodeAttrArray = self.get_barcode_node_array()
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
      ,
      //  在barcode的背景上的节点上增加点击与双击的事件
      add_barcode_dbclick_click_handler: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var barcodeCollection = window.Datacenter.barcodeCollection
        var cc = clickcancel()
        self.d3el.selectAll('.bg').call(cc)
        cc.on('click', function (el) {
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
              if ((typeof (a) !== 'undefined') && (typeof (b) !== 'undefined')) {
                return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
              }
              return 0
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
      //  单击barcode节点的事件
      single_click_handler: function (nodeData, nodeObj) {
        var self = this
        //  在barcode节点上增加option的按钮
        self.add_singletree_node_options_button(nodeData, nodeObj)
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
      //  barcode的子树的triangle点击的handler
      subtree_triangle_click_handler: function (subtree_root_id) {
        var self = this
        var treeDataModel = self.model
        var barcodeCollection = window.Datacenter.barcodeCollection
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var srcElement = d3.select('#barcodetree-svg').select('#' + barcodeTreeId).select('#' + subtree_root_id).node()
        var nodeData = treeDataModel.get_barcode_node(subtree_root_id)
        barcodeCollection.node_selection_click(nodeData, barcodeTreeId)
        barcodeCollection.add_operation_item(nodeData, barcodeTreeId, srcElement)
        window.operated_node = nodeData
        window.operated_tree_id = barcodeTreeId
      }
      ,
      //  删除标记当前选择的icon节点
      _remove_single_selection_icon: function (barcodeTreeId) {
        var self = this
        d3.select('g#' + barcodeTreeId)
          .select('#barcode-container')
          .selectAll('.select-icon')
          .remove()
      }
      ,
      //  更新当前选择的icon节点
      _update_single_selection_icon: function (src_element, barcodeTreeId, nodeObjId) {
        var self = this
        var nodeX = +d3.select('g#' + barcodeTreeId).select('#' + nodeObjId).attr('x')
        var nodeWidth = +d3.select('g#' + barcodeTreeId).select('#' + nodeObjId).attr('width')
        var nodeY = +d3.select('g#' + barcodeTreeId).select('#' + nodeObjId).attr('y')
        var nodeHeight = +d3.select('g#' + barcodeTreeId).select('#' + nodeObjId).attr('height')
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
      //  更新当前的正在编辑的节点的icon
      update_current_edit_icon: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var waitTime = Config.get('TRANSITON_DURATION')
        var barcodeCollection = window.Datacenter.barcodeCollection
        var align_state = barcodeCollection.get_current_aligned_state()
        if (align_state) {
          d3.select('g#' + barcodeTreeId)
            .select('#barcode-container')
            .selectAll('.edit-icon')
            .remove()
        } else {
          if (barcodeTreeId === window.operated_tree_id) {
            var nodeData = window.operated_node
            var nodeDataId = nodeData.id
            if (!d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).empty()) {
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
        }
      }
      ,
      //  删除当前选择的节点的icon
      remove_aligned_sort_icon: function () {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        d3.select('#barcodetree-svg').selectAll('.align-sort-icon').remove()
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
        d3.select('#barcodetree-svg').selectAll('.align-sort-icon').remove()
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
          .style('font-size', iconSize + 'px')
      }
      ,
      // 更新当前选择的节点的icon
      update_aligned_sort_icon: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeCollection = window.Datacenter.barcodeCollection
        var barcodeTreeId = treeDataModel.get('barcodeTreeId')
        var unalignItemList = barcodeCollection.get_unaligned_item()
        d3.select('g#' + barcodeTreeId).selectAll('.align-sort-icon').remove()
        for (var uI = 0; uI < unalignItemList.length; uI++) {
          var nodeData = unalignItemList[uI].nodeData
          var barcodeTreeId = unalignItemList[uI].barcodeTreeId
          var srcElement = unalignItemList[uI].srcElement
          if (typeof (srcElement) !== 'undefined') {
            var nodeDataId = nodeData.id
            if (!d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).empty()) {
              var nodeX = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('x')
              var nodeWidth = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('width')
              var nodeY = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('y')
              var nodeHeight = +d3.select('g#' + barcodeTreeId).select('#' + nodeDataId).attr('height')
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
                .attr('class', 'align-sort-icon')
                .attr('id', nodeDataId)
                .attr('font-family', 'FontAwesome')
                .attr('x', iconX)
                .attr('y', iconY)
                .text('\uf0dc')
                .style('fill', selectIconColor)
                .style('font-size', iconSize + 'px')
            }
          }
        }
      }
      ,
      //  更新标记当前选择的基准barcode的icon
      update_compare_based_anchor: function () {
        var self = this
        var treeDataModel = self.model
        var compareBased = treeDataModel.get('compareBased')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
        var textPadding = barcodeTextPaddingLeft / 2
        var fontSizeHeight = barcodeTextPaddingLeft < barcodeHeight ? barcodeTextPaddingLeft : barcodeHeight
        if (compareBased) {
          d3.select('#barcodetree-svg').selectAll('.compare-based-text').remove()
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
          d3.select('#barcodetree-svg').selectAll('.bg').classed('compare-based-selection', false)
          self.singleTree.select('.bg').classed('compare-based-selection', true)
        }
      }
      ,
      //  判断options按钮是否打开的判断函数
      is_open_options_button: function () {
        return !d3.select('.barcode-icon-bg').empty()
      }
      ,
      //  删除options按钮的节点
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
      //  hover padding节点
      padding_nodes_mouseover_handler: function (d, i) {
      }
      ,
      //  click节点, 对齐当前的子树
      subtree_align_handler: function (nodeData, finishAlignDeferObj) {
        var self = this
        var alignedLevel = Variables.get('alignedLevel')
        self.node_click_handler(nodeData, alignedLevel, finishAlignDeferObj)
      }
      ,
      //  再次click节点, 取消对于当前的subtree的对齐
      subtree_unalign_handler: function (nodeData, finishRemoveAlignDeferObj) {
        var self = this
        var nodeLevel = nodeData.depth
        self.node_unclick_handler(nodeData, nodeLevel, finishRemoveAlignDeferObj)
      }
      ,
      //  点击focus选项的按钮
      node_click_handler: function (d, alignedLevel, finishAlignDeferObj) {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        var generalMissedNodeClass = Variables.get('general_missed_node_class')
        var rootLevel = 0
        self.node_mouseout_handler()
        //  打开上方的supertree视图
        self.open_supertree_view()
        //  点击的是root节点之外的其他的节点, 那么进入上面的判断条件
        // if ((Variables.get('alignedLevel') === rootLevel)) {//!((d.category === 'root') &&
        if (!d3.select(this.el).classed(generalMissedNodeClass)) {
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
      //  再次点击focus选项的按钮, 取消focus
      node_unclick_handler: function (d, alignedLevel, finishRemoveAlignDeferObj) {
        var self = this
        var barcodeCollection = window.Datacenter.barcodeCollection
        var generalMissedNodeClass = Variables.get('general_missed_node_class')
        var rootLevel = 0
        self.node_mouseout_handler()
        //  点击的是root节点之外的其他的节点, 那么进入上面的判断条件
        // if ((Variables.get('alignedLevel') === rootLevel)) {//!((d.category === 'root') &&
        if (!d3.select(this.el).classed(generalMissedNodeClass)) {
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
      //  高亮所有的相关节点
      higlight_all_related_nodes: function (nodeObj) {
        var self = this
        var treeDataModel = self.model
        var findingNodesObj = treeDataModel.find_related_nodes(nodeObj)
        self.highlight_finding_node(nodeObj, findingNodesObj)
      }
      ,
      //  鼠标离开节点的handler
      node_mouseover_handler: function (d, globalObj) {
        var self = this
        var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
        //  设置mouseover的状态为true, 表示需要trigger mouseout的信号
        var tipValue = null
        var treeDataModel = self.model
        //  取消在选择状态的所有的高亮
        globalObj.trigger_mouseout_event()
        globalObj.node_mouseout_handler()
        if (treeDataModel.is_aligned_state() && (BarcodeGlobalSetting['Align_Lock'])) {
          if (!(treeDataModel.is_aligned_start(d.id) || (treeDataModel.is_aligned_range(d.id)))) {
            return
          }
        }
        if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
          //  切换到原始的barcodeTree的compact的显示模式
          if (d.compactAttr === Config.get('CONSTANT').TEMPLATE) {
            return
          }
        }
        if (d3.event.isTrusted) {
          var barcodeTreeId = treeDataModel.get('barcodeTreeId')
          Variables.set('currentHoveringBarcodeId', barcodeTreeId)
        }
        if (d != null) {
          self.hoveringNodeId = d.id
        }
        var tip = window.tip
        if (d.existed) {
          //  在将d3-tip的类变成d3-tip-flip的情况下, 需要将d3-tip-flip再次变成d3-tip
          $('.d3-tip-flip').removeClass('d3-tip-flip').addClass('d3-tip')
          if (typeof(d.categoryName) !== 'undefined') {
            tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + d.category + '-' + d.categoryName + ", num: " + d.num + "</span></span>"
          } else {
            tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + d.category + "</span></span>"
          }
          //  如果tooptip的显示状态是true
          if (Config.get('BARCODETREE_TOOLTIP_ENABLE')) {
            tip.show(tipValue)
          }
          flipTooltipLeft()
          flipTooltipRight()
          globalObj.trigger_hovering_event()
          self.unhighlight_barcode_bg()
          self.d3el.select('.bg').classed('hovering-highlight', true)
          var findingNodesObj = treeDataModel.find_related_nodes(d)
          var thisNodeObj = d
          globalObj.trigger_hovering_node_event(thisNodeObj, findingNodesObj)
          Variables.set('mouseover_state', true)
        }
        //  将tooltip向左进行移动, 保证tooltip出现在屏幕的范围内
        function flipTooltipLeft() {
          var d3TipLeft = $(".d3-tip").position().left
          if (d3TipLeft < 0) {
            var tipLeft = d3TipLeft - 10
            $('#tip-content').css({left: -tipLeft});
          }
        }

        //  将tooltip向右进行移动, 保证tooltip出现在屏幕范围内
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
      //  判断节点是否存在
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
      padding_obj_mouseover_handler: function () {
        var self = this
      }
      ,
      fill_style_handler: function (d, i) {
        var self = this
        var nodeNum = self.get_node_number(d.paddingNodeStartIndex, d.paddingNodeEndIndex)
        var maxLeveledNumArray = Variables.get('maxLeveledNumArray')
        var sumNodeNum = maxLeveledNumArray[maxLeveledNumArray.length - 1]
        var partitionNum = 6
        var partition = sumNodeNum / partitionNum
        var styleIndex = Math.ceil(nodeNum / partition + 1)
        return "url(#diagonal-stripe-" + styleIndex + ")"
      }
      ,
      padding_cover_click_handler: function (d, i) {
        var self = this
        // window.Datacenter.barcodeCollection.changCompactMode(i)
        // window.Datacenter.barcodeCollection.update_click_covered_rect_attr_array()
      }
      ,
      //  计算某个范围内, 在某些层级上的节点数量
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
      }
      ,
      //  因为对于当前barcode的绘制是基于level的筛选的, 所以需要通过nodeId获取在实际的barcodeNodeAttrArray中的具体index值
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
      //  将该树中所有的节点的颜色变暗
      unhighlightNodes: function () {
        var self = this
        self.d3el.selectAll('.barcode-node').classed('unhighlight', true)
        self.d3el.selectAll('.tooth').classed('unhighlight', true)
        self.d3el.selectAll('.stat-summary').classed('unhighlight', true)
        d3.select('#barcodetree-svg').selectAll('.collapse-triangle').classed('unhighlight', true)
      }
      ,
      //  高亮兄弟节点
      highlightSiblingNodes: function (siblingNodesArray) {
        var self = this
        for (var sI = 0; sI < siblingNodesArray.length; sI++) {
          if (!d3.select('.collapse-triangle#' + siblingNodesArray[sI].id).empty()) {
            d3.selectAll('.collapse-triangle#' + siblingNodesArray[sI].id)
              .classed('sibling-highlight', true)
              .classed('unhighlight', true)
          }
          self.d3el.selectAll('#' + siblingNodesArray[sI].id)
            .classed('sibling-highlight', true)
          self.d3el.selectAll('#' + siblingNodesArray[sI].id)
            .classed('unhighlight', true)
        }
      }
      ,
      //  高亮从根节点到当前节点路径上的节点
      highlightFatherAndCurrentNodes: function (fatherNodesArray) {
        var self = this
        var treeDataModel = self.model
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var barcodeNodeHeight = barcodeHeight * 0.8
        var barcodeNodeColorArray = Variables.get('barcodeNodeColorArray')
        var beginX = 0
        var endX = 0
        //  在非对齐的情况下也要将节点进行高亮
        var currentFatherNodesArray = []
        for (var fI = 0; fI < fatherNodesArray.length; fI++) {
          var currentFatherNode = self.findSiblingCurrentNodeObj(fatherNodesArray[fI])
          if (currentFatherNode != null) {
            currentFatherNodesArray.push(currentFatherNode)
          }
        }
        for (var fI = 0; fI < currentFatherNodesArray.length; fI++) {
          if (currentFatherNodesArray[fI].width !== 0) {
            var fatherNodeDepth = currentFatherNodesArray[fI].depth
            self.d3el.selectAll('rect#' + currentFatherNodesArray[fI].id)
              .classed('father-highlight', true)
              .style('fill', barcodeNodeColorArray[fatherNodeDepth])
            self.d3el.selectAll('#' + currentFatherNodesArray[fI].id)// 需要对于当前鼠标hover的节点取消高亮
              .classed('unhighlight', false)
          }
        }
        //  只有在对齐的情况下才会绘制从根节点到当前节点的连接线
        currentFatherNodesArray = []
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
            var circleX = currentFatherNodesArray[fI].x + currentFatherNodesArray[fI].width / 2
            var circleY = barcodeNodeHeight / 2
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
      //  根据其他视图传动的节点对象,找到在该视图中的节点
      findCurrentNodeObj: function (nodeObj) {
        var self = this
        var treeDataModel = self.model
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var alignedRangeObjArray = self.get_aligned_range_array()
        var paddingNodeObjArray = self.get_padding_node_array()
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if ((barcodeNodeAttrArray[bI].depth === nodeObj.depth) && (barcodeNodeAttrArray[bI].id === nodeObj.id) && (barcodeNodeAttrArray[bI].existed)) {
            return barcodeNodeAttrArray[bI]
          }
        }
        return null
      }
      ,
      findSiblingCurrentNodeObj: function (nodeObj) {
        var self = this
        var treeDataModel = self.model
        var barcodeNodeAttrArray = self.get_barcode_node_array()
        var alignedRangeObjArray = self.get_aligned_range_array()
        var paddingNodeObjArray = self.get_padding_node_array()
        for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
          if ((barcodeNodeAttrArray[bI].depth === nodeObj.depth) && (barcodeNodeAttrArray[bI].id === nodeObj.id) && (barcodeNodeAttrArray[bI].existed)) {//&& (self.isBelongAligned(bI, alignedRangeObjArray, paddingNodeObjArray))
            return barcodeNodeAttrArray[bI]
          }
        }
        return null
      }
      ,
      selection_update_handler: function () {
        var self = this
        //  点击之后想要马上看到点击的效果, 而不是将鼠标移开之后, 因此需要点击的时候将鼠标悬浮的效果去除掉
        self.node_mouseout_handler()
        self.highlight_selection_supertree_selection_nodes()
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

      //  高亮排序所依据的节点
      highlight_sort_node: function (barcodeNodeId) {
        var self = this
        self.d3el.select('#' + barcodeNodeId).classed('sort-hovering-highlight', true)
      }
      ,
      //  取消高亮排序所依据的节点
      unhighlight_sort_node: function (barcodeNodeId) {
        var self = this
        self.d3el.select('.sort-hovering-highlight').classed('sort-hovering-highlight', false)
      }
      ,
      //  在barcode视图中增加描述缺失或者增加节点数目的总结
      add_missed_added_summary: function () {
        var self = this
        var treeDataModel = self.model
        var missed_node_class = Variables.get('missed_node_class')
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
        self.d3el.selectAll('.' + missed_node_class).classed(missed_node_class, false)
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
          var missed_node_class = Variables.get('missed_node_class')
          for (var mI = 0; mI < missedNodeIdArray.length; mI++) {
            self.d3el.select('#' + missedNodeIdArray[mI]).classed(missed_node_class, true)
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

        //  判断统计增加与减少的柱状图是否显示的函数
        function aligned_summary_visible_state() {
          var BarcodeGlobalSetting = Variables.get('BARCODETREE_GLOBAL_PARAS')
          if (BarcodeGlobalSetting['Comparison_Result_Display']) {
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
      //  增加集合操作的标注
      add_set_operation_selection_anchor: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var textPadding = barcodeTextPaddingLeft / 2
        var fontSizeHeight = barcodeTextPaddingLeft < barcodeHeight ? barcodeTextPaddingLeft : barcodeHeight
        //  增加compare based的barcodeTree的pin的标签
        self.singleTree.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('cursor', 'pointer')
          .attr('class', 'set-operation-selection-text')
          .attr('font-family', 'FontAwesome')
          .attr('x', textPadding)
          .attr('y', barcodeHeight / 2)
          .text('\uf067')
          .style('font-size', fontSizeHeight + 'px')
        self.singleTree.select('.bg').classed('set-operation-selection-selection', true)
      }
      ,
      //  删除集合操作的标注
      remove_set_operation_selection_anchor: function () {
        var self = this
        var treeDataModel = self.model
        self.singleTree
          .selectAll('.set-operation-selection-text')
          .remove()
        self.singleTree.select('.bg').classed('set-operation-selection-selection', false)
      }
      ,
      add_compare_based_anchor: function () {
        var self = this
        var treeDataModel = self.model
        var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
        var barcodeHeight = treeDataModel.get('barcodeNodeHeight')
        var textPadding = barcodeTextPaddingLeft / 2
        var fontSizeHeight = barcodeTextPaddingLeft < barcodeHeight ? barcodeTextPaddingLeft : barcodeHeight
        //  增加compare based的barcodeTree的pin的标签
        d3.select('#barcodetree-svg').selectAll('.compare-based-text').remove()
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
        d3.select('#barcodetree-svg').selectAll('.bg').classed('compare-based-selection', false)
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
      //  取消barcode背景的高亮
      unhighlight_barcode_bg: function () {
        var self = this
        d3.select('#barcodetree-svg').selectAll('.bg').classed('hovering-highlight', false)
      }
      ,
      //  鼠标点击节点的时候, 将superTree的视图打开
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
