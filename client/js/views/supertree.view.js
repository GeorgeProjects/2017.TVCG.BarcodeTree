define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'd3',
  'config',
  'variables',
  'views/svg-base.addon'
], function (require, Mn, _, Backbone, d3, Config, Variables, SVGBase) {
  'use strict'
  return Mn.ItemView.extend(_.extend({
    tagName: 'svg',
    template: false, //  for the itemview, we must define the template value false
    attributes: {
      style: 'width: 100%; height: 100%;',
      id: 'supertree-svg'
    },
    default: {
      barcodePaddingLeft: null,
      barcodeHeight: null,
      clickedObject: null,
      sortObject: null,
      sortType: null,
      clickedRectIndex: null,
      barcodeOriginalNodeHeight: Variables.get('barcodeHeight'),
      barcodeCompactNodeHeight: Variables.get('barcodeHeight') / (window.compactNum + (window.compactNum - 1) / 4)
    },
    events: {},
    initialize: function () {
      var self = this
      self.initEventFunc()
      self.initParaFunc()
      self.initSuperTreeToggleLoc()
    },
    initEventFunc: function () {
      var self = this
      Backbone.Events.on(Config.get('EVENTS')['OPEN_SUPER_TREE'], function (event) {
        self.open_supertree_view()
      })
      Backbone.Events.on(Config.get('EVENTS')['CLOSE_SUPER_TREE'], function (event) {
        self.close_supertree_view()
      })
      Backbone.Events.on(Config.get('EVENTS')['RENDER_SUPERTREE'], function (event) {
        self.draw_super_tree()
      })
    },
    trigger_mouseout_event: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['NODE_MOUSEOUT'])
    },
    trigger_hovering_sort_barcode_node: function (nodeId) {
      Backbone.Events.trigger(Config.get('EVENTS')['HOVERING_SORT_BARCODE_NODE'], {
        'barcodeNodeId': nodeId
      })
    },
    trigger_unhovering_sort_barcode_node: function () {
      Backbone.Events.trigger(Config.get('EVENTS')['UNHOVERING_SORT_BARCODE_NODE'])
    },
    trigger_higlight_all_related_nodes: function (rootObj) {
      var self = this
      console.log('trigger_higlight_all_related_nodes')
      Backbone.Events.trigger(Config.get('EVENTS')['HIGHLIGHT_ALL_RELATED_NODE'], {
        'nodeObj': rootObj
      })
    },
    trigger_higlight_all_selected_nodes: function (rootObj) {
      var self = this
      Backbone.Events.trigger(Config.get('EVENTS')['HIGHLIGHT_ALL_SELECTED_NODE_SUPERTREEVIEW'])
    },
    initParaFunc: function () {
      var self = this
      var barcodeTextPaddingLeft = Variables.get('barcodeTextPaddingLeft')
      var barcodePaddingLeft = Variables.get('barcodePaddingLeft')
      self.barcodePaddingLeft = barcodeTextPaddingLeft + barcodePaddingLeft
    },
    initSuperTreeToggleLoc: function () {
      var self = this
      var toolbarHistogramHeight = +$('#barcode-view').css('top').replace('px', '')
      var barcodeTreeConfigHeight = Variables.get('barcodeTreeConfigHeight')
      $('#supertree-view-toggle').css('top', (barcodeTreeConfigHeight + toolbarHistogramHeight) + 'px')
    },
    onShow: function () {
      var self = this
      var barcodeHeight = Variables.get('superTreeHeight')
      self.barcodeHeight = barcodeHeight
      var barcodePaddingGap = 8
      self.barcodePaddingGap = barcodePaddingGap
      var barcodePaddingTop = barcodeHeight * 0.4
      self.barcodePaddingTop = barcodePaddingTop
      var barcodeNodeHeight = barcodeHeight * 0.6 - barcodePaddingGap
      self.barcodeNodeHeight = barcodeNodeHeight
      var sortCount = 0
      var sortTypeArray = ['asc', 'desc', 'unsort']
      var sortTypeObject = {
        'asc': '\uf0de',
        'desc': '\uf0dd',
        'unsort': '\uf0dc'
      }
      var barcodePaddingLeft = self.barcodePaddingLeft
      var superTreeWidth = $('#supertree-scroll-panel').width()
      self.d3el.append('rect')
        .attr('class', 'container-bg')
        .attr('id', 'container-bg')
        .attr('width', superTreeWidth)
        .attr('height', self.barcodeHeight)
        .on('mouseover', function (d, i) {
          self.trigger_mouseout_event()
        })
        .on('click', function (d, i) {
          self.remove_options_button()
        })
      var tip = window.tip
      self.d3el.call(tip)
      // var COMPARISON_RESULT_PADDING = Config.get('COMPARISON_RESULT_PADDING')
      // if (Variables.get('displayMode') === Config.get('CONSTANT')['GLOBAL']) {
      //   barcodePaddingLeft = barcodePaddingLeft + COMPARISON_RESULT_PADDING
      // }
      self.barcodeContainer = self.d3el.append('g')
        .attr('transform', 'translate(' + barcodePaddingLeft + ',' + (barcodePaddingTop + barcodePaddingGap / 2) + ')')
        .attr('id', 'barcode-container')
      self.d3el
      // .select('#barcode-sorting-container')
        .append("text")
        .attr('class', 'sort-button')
        .attr("x", (self.barcodePaddingLeft / 2))
        .attr("y", barcodeHeight / 2)
        .attr("font-family", "FontAwesome")
        .attr('font-size', function (d) {
          return '30px';
        })
        .text(function (d) {
          return '\uf0dc';
        })
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .style("cursor", "pointer")
        .style('fill', '#ddd')
        .on('click', function (d, i) {
          self.d3el.selectAll('.sort-indicator').remove()
          var sortType = sortCount % sortTypeArray.length
          d3.select(this).text(function (d) {
            return sortTypeObject[sortTypeArray[sortType]]
          })
          if (sortType == 0) {
            //  升序排列
            d3.select(this).style('fill', 'black')
            window.Datacenter.barcodeCollection.sort_whole_barcode_model(sortTypeArray[sortType])
          } else if (sortType == 1) {
            //  降序排列
            d3.select(this).style('fill', 'black')
            window.Datacenter.barcodeCollection.sort_whole_barcode_model(sortTypeArray[sortType])
          } else if (sortType == 2) {
            //  原始顺序排列
            d3.select(this).style('fill', '#ddd')
            window.Datacenter.barcodeCollection.recover_barcode_model_sequence()
          }
          sortCount = sortCount + 1
        })
    },
    add_single_category_text: function (rootId) {
      var self = this
      var barcodeHeight = self.barcodeHeight
      var barcodeCollection = self.options.barcodeCollection
      var barcodePaddingTop = self.barcodePaddingTop
      var barcodePaddingLeft = self.barcodePaddingLeft
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var addedCategoryArray = self.get_category_text_obj(rootId)
      var filteredAlignedElement = self.filtered_aligned_element()
      var barcodeCategoryHeight = 0
      if ((filteredAlignedElement.length === 0) || (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL)) {
        barcodeCategoryHeight = barcodeHeight
      } else {
        barcodeCategoryHeight = barcodePaddingTop
      }
      var tip = window.tip
      // if (addedCategoryArray.length > 0) {
      //   for (var aI = 0; aI < (addedCategoryArray.length - 1); aI++) {
      //     addedCategoryArray[aI].textWidth = addedCategoryArray[aI + 1].x - addedCategoryArray[aI].x
      //   }
      //   addedCategoryArray[addedCategoryArray.length - 1].textWidth = barcodeNodeAttrArray[barcodeNodeAttrArray.length - 1].x - addedCategoryArray[addedCategoryArray.length - 1].x
      // }
      d3.selectAll('.category-g').remove()
      var categoryG = self.d3el.selectAll('.category-text')
        .data(addedCategoryArray)
        .enter()
        .append('g')
        .attr('class', 'category-g')
        .attr("transform", function (d, i) {
          return "translate(" + (barcodePaddingLeft + d.x) + ',' + 0 + ')'
        })
      categoryG.each(function (d, i) {
        var rootObj = d
        d3.select(this)
          .append('rect')
          .attr('class', function (d, i) {
            var inTablelens = barcodeCollection.in_selected_array(rootObj.id)
            if (inTablelens) {
              return 'category-bg select-highlight'
            } else {
              return 'category-bg'
            }
          })
          .attr('id', rootObj.id)
          .attr("x", 0)
          .attr("width", rootObj.textWidth)
          .attr('y', 0)
          .attr('height', barcodeCategoryHeight)//barcodePaddingTop
          .on('mouseover', function (d, i) {
            d3.select(this).classed('mouseover-highlight', true)
            self.trigger_higlight_all_related_nodes(rootObj)
            var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + rootObj.categoryName + "</span></span>"
          })
          .on('mouseout', function (d, i) {
            d3.select(this).classed('mouseover-highlight', false)
            self.trigger_mouseout_event()
          })
          .on('click', function (d, i) {
            if (d3.select(this).classed('select-highlight')) {
              d3.select(this).classed('select-highlight', false)
              self.remove_supertree_selected_subtree_id(rootObj.id, rootObj.depth)
            } else {
              d3.select(this).classed('select-highlight', true)
              self.add_supertree_selected_subtree_id(rootObj.id, rootObj.depth)
            }
            self.trigger_higlight_all_selected_nodes()
          })
        d3.select(this)
          .append("text")
          .attr('class', 'category-text')
          .attr('id', rootObj.id)
          .attr("x", rootObj.textWidth / 2)
          .attr("y", barcodeCategoryHeight / 2)
          .attr("font-family", "FontAwesome")
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .text(textAbbr(d))
          .on('mouseover', function (d, i) {
            var thisObjId = d3.select(this).attr('id')
            d3.select('rect#' + thisObjId).classed('mouseover-highlight', true)
            self.trigger_higlight_all_related_nodes(rootObj)
            var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + rootObj.categoryName + "</span></span>"
            if (rootObj.categoryName !== textAbbr(d)) {
              tip.show(tipValue)
            }
          })
          .on('mouseout', function (d, i) {
            var thisObjId = d3.select(this).attr('id')
            d3.select('rect#' + thisObjId).classed('mouseover-highlight', false)
            self.trigger_mouseout_event()
            tip.hide()
          })
          .on('click', function (d, i) {
            var thisObjId = d3.select(this).attr('id')
            if (d3.select('rect#' + thisObjId).classed('select-highlight')) {
              d3.select('rect#' + thisObjId).classed('select-highlight', false)
              barcodeCollection.remove_supertree_selected_subtree_id(rootObj.id, rootObj.depth)
              self.remove_supertree_selected_subtree_id(rootObj.id, rootObj.depth)
            } else {
              d3.select('rect#' + thisObjId).classed('select-highlight', true)
              self.add_supertree_selected_subtree_id(rootObj.id, rootObj.depth)
            }
            self.trigger_higlight_all_selected_nodes()
          })
      })

      // categoryText.attr("x", function (d, i) {
      //   return barcodePaddingLeft + d.x + d.textWidth / 2
      // })
      //   .attr("y", barcodeHeight / 2)
      //   .attr("font-family", "FontAwesome")
      //   .attr('text-anchor', 'middle')
      //   .attr('dominant-baseline', 'middle')
      //   .text(function (d, i) {
      //     return textAbbr(d.categoryName)
      //   })

      function textAbbr(nodeObj) {
        var category_name = nodeObj.categoryName
        var textWidth = nodeObj.textWidth
        var textNum = Math.round(textWidth / 15)
        if (category_name.length > textNum) {
          var categoryName = category_name.substring(0, textNum)
          categoryName = categoryName + '...'
          return categoryName
        } else {
          return category_name
        }
      }
    },
    /**
     * 在superTree视图中选择, 增加选择的子树id
     */
    add_supertree_selected_subtree_id: function (rootObjId, rootObjDepth) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      // barcodeCollection.add_supertree_selected_subtree_id(rootObjId, rootObjDepth)
      barcodeCollection.add_selected_subtree_id(rootObjId, rootObjDepth)
    },
    /**
     * 在superTree视图中选择, 删除选择的子树id
     */
    remove_supertree_selected_subtree_id: function (rootObjId, rootObjDepth) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      // barcodeCollection.remove_supertree_selected_subtree_id(rootObjId, rootObjDepth)
      barcodeCollection.remove_selection(rootObjId)
    },
    /**
     *  在背景矩形中增加双击的监听函数
     */
    category_rect_dbclick_handler: function (nodeData) {
      var self = this
      var nodeId = nodeData.id
      var barcodeCollection = self.options.barcodeCollection
      var isAdded = barcodeCollection.tablelens_interested_subtree(nodeId)
      return isAdded
    },
    /**
     * 在category的背景矩形中增加监听函数
     */
    add_category_rect_dbclick_click_handler: function () {
      var self = this
      var treeDataModel = self.model
      var barcodeTreeId = treeDataModel.get('barcodeTreeId')
      var barcodeCollection = self.options.barcodeCollection
      var cc = clickcancel()
      self.d3el.selectAll('.category-bg').call(cc)
      cc.on('dblclick', function (el) {
        var nodeObj = d3.select(el.srcElement)
        var nodeData = nodeObj.data()[0]
        var isAdded = self.category_rect_dbclick_handler(nodeData)
        if (isAdded) {
          barcodeCollection.add_supertree_selected_subtree_id(nodeData.id, nodeData.depth)
          d3.select(el.srcElement).classed('select-highlight', true)
        } else {
          d3.select(el.srcElement).classed('select-highlight', false)
          barcodeCollection.remove_supertree_selected_subtree_id(nodeData.id, nodeData.depth)
        }
        barcodeCollection.update_barcode_selection_state()
      })
      cc.on('click', function (el) {

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
    },
    /**
     * 在superTree视图中增加文本, 是focus的最上层的类别的名称
     * @param rootId
     */
    get_category_text_obj: function (rootId) {
      var self = this
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var textAddedLevel = null
      var rootLevel = null
      var textAddedObjArray = []
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if (barcodeNodeAttrArray[bI].depth === rootLevel) {
          var textStartX = textAddedObjArray[textAddedObjArray.length - 1].x
          var textEndX = barcodeNodeAttrArray[bI - 1].x
          for (var reI = (bI - 1); ; reI--) {
            if (barcodeNodeAttrArray[reI].width !== 0) {
              break;
            }
          }
          textEndX = barcodeNodeAttrArray[reI].x
          textAddedObjArray[textAddedObjArray.length - 1].textWidth = textEndX - textStartX
          break
        }
        if (barcodeNodeAttrArray[bI].depth === textAddedLevel) {
          if (textAddedObjArray.length !== 0) {
            var textStartX = textAddedObjArray[textAddedObjArray.length - 1].x
            var textEndX = barcodeNodeAttrArray[bI - 1].x
            textAddedObjArray[textAddedObjArray.length - 1].textWidth = textEndX - textStartX
          }
          textAddedObjArray.push(barcodeNodeAttrArray[bI])
        }
        if (barcodeNodeAttrArray[bI].id === rootId) {
          rootLevel = +barcodeNodeAttrArray[bI].depth
          textAddedLevel = +barcodeNodeAttrArray[bI].depth + 1
        }
        if (bI === (barcodeNodeAttrArray.length - 1)) {
          if (textAddedObjArray.length !== 0) {
            var textStartX = textAddedObjArray[textAddedObjArray.length - 1].x
            var textEndX = barcodeNodeAttrArray[bI].x
            textAddedObjArray[textAddedObjArray.length - 1].textWidth = textEndX - textStartX
          }
        }
      }
      return textAddedObjArray
    },
    open_supertree_view: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      Variables.set('superTreeViewState', true)
      var superTreeHeight = Variables.get('superTreeHeight')
      var barcodeTreeConfigHeight = Variables.get('barcodeTreeConfigHeight')
      var toolbarHistogramHeight = +$('#barcode-view').css('top').replace('px', '')
      $('#supertree-view-toggle').css('top', (toolbarHistogramHeight + barcodeTreeConfigHeight + superTreeHeight) + 'px')
      $('#supertree-scroll-panel').css('top', barcodeTreeConfigHeight + 'px')
      $('#supertree-scroll-panel').css('height', superTreeHeight + 'px')
      $('#barcodetree-scrollpanel').css('top', (barcodeTreeConfigHeight + superTreeHeight) + 'px')
      barcodeCollection.update_barcode_location()
    },
    close_supertree_view: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      Variables.set('superTreeViewState', false)
      var barcodeTreeConfigHeight = Variables.get('barcodeTreeConfigHeight')
      var toolbarHistogramHeight = +$('#barcode-view').css('top').replace('px', '')
      $('#supertree-view-toggle').css('top', (toolbarHistogramHeight + barcodeTreeConfigHeight) + 'px')
      $('#barcodetree-scrollpanel').css('top', barcodeTreeConfigHeight + 'px')
      $('#supertree-scroll-panel').css('height', '0px')
      barcodeCollection.update_barcode_location()
    },
    draw_super_tree: function () {
      var self = this
      self.update_aligned_barcode_node(self.update_sort_icon.bind(self))
      self.render_padding_cover_rect()
      self.add_category_text()
      self.add_category_rect_dbclick_click_handler()
    },
    add_category_text: function () {
      var self = this
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var alignedRangeObjArray = self.get_super_tree_aligned_range_obj()
      if (alignedRangeObjArray.length === 0) {
        var rootId = 'node-0-root'
        self.add_single_category_text(rootId)
      }
      for (var aI = 0; aI < alignedRangeObjArray.length; aI++) {
        console.log('alignedRangeObjArray[aI]', alignedRangeObjArray[aI])
        var rangeStartNodeIndex = alignedRangeObjArray[aI].rangeStartNodeIndex
        var nodeId = barcodeNodeAttrArray[rangeStartNodeIndex].id
        self.add_single_category_text(nodeId)
      }
    },
    //  过滤得到所有在superTree视图中绘制出来的对象
    filtered_aligned_element: function () {
      var self = this
      var filteredArray = []
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var alignedRangeObjArray = self.get_super_tree_aligned_range_obj()
      for (var bI = 0; bI < barcodeNodeAttrArray.length; bI++) {
        if ((barcodeNodeAttrArray[bI].depth < 4) && (self.isBelongAligned(bI, alignedRangeObjArray)) && (barcodeNodeAttrArray[bI].id !== 'node-0-root')) {
          filteredArray.push(barcodeNodeAttrArray[bI])
        }
      }
      return filteredArray
    },
    update_aligned_barcode_node: function (next_step_func) {
      var self = this
      var tip = window.tip
      var barcodeNodeHeight = self.barcodeNodeHeight
      var barcodeNodeAttrArray = self.get_super_tree_barcode_node_array()
      var DURATION = 1000
      var alignedLevel = Variables.get('alignedLevel')
      var currentNodeHeight = 0
      if (barcodeNodeAttrArray.length > 0) {
        currentNodeHeight = barcodeNodeAttrArray[0].height
      }
      var yRatio = barcodeNodeHeight / currentNodeHeight
      var ABSOLUTE_COMPACT_FATHER = Config.get('CONSTANT')['ABSOLUTE_COMPACT_FATHER']
      var alignedRangeObjArray = self.get_super_tree_aligned_range_obj()
      //
      var alignedBarcodeNodes = self.d3el.select('#barcode-container')
        .selectAll('.aligned-barcode-node')
        .data(barcodeNodeAttrArray.filter(function (d, i) {
          return ((d.depth < 4) && (self.isBelongAligned(i, alignedRangeObjArray)))
        }), function (d, i) {
          return d.id
        })

      //  enter 添加节点
      alignedBarcodeNodes.enter()
        .append('rect')
        .attr('class', function (d, i) {
          var classArray = []
          classArray.push('barcode-node')
          classArray.push('aligned-barcode-node')
          if (d.depth > alignedLevel) {
            classArray.push('node-none')
          }
          return self.get_class_name(classArray)
        })
        .attr('id', function (d, i) {
          return d.id
        })
        .attr('x', function (d) {
          return +d.x
        })
        .attr('y', function (d) {
          return +d.height * yRatio
        })
        .attr('width', function (d) {
          return +d.width
        })
        .attr('height', function (d) {
          return 0
        })
        .style("cursor", "pointer")
        .on('mouseover', mouseover_handler)
        .on('mouseout', mouseout_handler)
        .on('click', click_handler)
      // update 更新节点
      alignedBarcodeNodes.attr('class', function (d, i) {
        var classArray = []
        classArray.push('barcode-node')
        classArray.push('aligned-barcode-node')
        if (d.depth > alignedLevel) {
          classArray.push('node-none')
        }
        return self.get_class_name(classArray)
      })
        .attr('width', function (d) {
          return +d.width
        })
        .transition()
        .duration(DURATION)
        .attr('x', function (d) {
          return +d.x
        })
        .attr('y', function (d) {
          return +d.y * yRatio
        })
        .attr('height', function (d) {
          return +d.height * yRatio
        })
        .call(self.endall, function (d, i) {
          if ((next_step_func != null) && (typeof (next_step_func) !== 'undefined')) {
            next_step_func()
          } else {
            console.log('not next step')
          }
        })
      alignedBarcodeNodes.exit().remove()
      function mouseover_handler(d, i) {
        if (typeof(d.categoryName) !== 'undefined') {
          var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + d.category + ' ' + d.categoryName + "</span></span>"
          tip.show(tipValue)
        } else {
          var tipValue = "<span id='tip-content' style='position:relative;'><span id='vertical-center'>" + d.category + "</span></span>"
          tip.show(tipValue)
        }
        d3.select(this).classed('sort-hovering-highlight', true)
        self.trigger_hovering_sort_barcode_node(d.id)
      }

      function mouseout_handler(d, i) {
        tip.hide()
        d3.select(this).classed('sort-hovering-highlight', false)
        self.trigger_unhovering_sort_barcode_node()
      }

      function click_handler(d, i) {
        self.clickedObject = this
        self.clickedRectIndex = null
        self.add_supertree_node_options_button(this, d)
      }
    },
    add_supertree_node_options_button: function (thisNodeObj, thisNodeData) {
      var self = this
      var barcodePaddingLeft = self.barcodePaddingLeft
      var barcodePaddingTop = self.barcodePaddingTop + self.barcodePaddingGap / 2
      var DURATION = 500
      var thisX = +d3.select(thisNodeObj).attr('x') + 1
      var thisY = +d3.select(thisNodeObj).attr('y') - 1
      var thisWidth = +d3.select(thisNodeObj).attr('width')
      var iconSide = Variables.get('superTreeHeight') * 0.3
      var thisNodeId = d3.select(thisNodeObj).attr('id')
      var iconPadding = 2
      var barcodeConfigFontSize = 12
      var iconArray = [
        {'iconName': 'refresh', 'iconCode': '\uf021'},
        {'iconName': 'sort-amount-asc', 'iconCode': '\uf160'},
        {'iconName': 'sort-amount-desc', 'iconCode': '\uf161'},
        {'iconName': 'remove', 'iconCode': '\uf00d'}]
      var iconLeftX = thisX + barcodePaddingLeft + thisWidth / 2 - iconSide * iconArray.length / 2
      self.d3el.selectAll('.barcode-icon-bg').remove()
      self.d3el.selectAll('.barcode-g-icon').remove()
      //  更新barcode的背景矩形的位置
      var barcodeIconBg = self.d3el.selectAll('.barcode-icon-bg')
        .data(iconArray)
      barcodeIconBg.enter()
        .append('rect')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-icon-bg')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2 - iconSide / 2
        })
        .attr('y', barcodePaddingTop + iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .attr('fill', '#808080')
        .on('mouseover', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', false)
        })
        .style('opacity', 0)
      barcodeIconBg.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i
        })
        .attr('y', barcodePaddingTop - iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIconBg.exit().remove()
      //  更新barcode的图标的位置
      var barcodeIcon = self.d3el.selectAll('.barcode-g-icon')
        .data(iconArray)
      barcodeIcon.enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-g-icon')
        .attr('font-family', 'FontAwesome')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2
        })
        .attr('y', barcodePaddingTop + iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('fill', function (d, i) {
          if (d.iconName === 'remove') {
            return 'red'
          }
        })
        .text(function (d, i) {
          return d.iconCode
        })
        .on('mouseover', function (d, i) {
          d3.select(this).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select(this).classed('mouseover-highlight', false)
        })
        .on('click', function (d, i) {
          self.super_tree_node_controller(d, i, thisNodeId, self, thisNodeData)
        })
        .style('opacity', 0)
      barcodeIcon.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i + iconSide / 2
        })
        .attr('y', barcodePaddingTop - iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIcon.exit().remove()
    },
    super_tree_node_controller: function (d, i, thisNodeId, self, thisNodeData) {
      var barcodeCollection = self.options.barcodeCollection
      var parameter = null
      if (d.iconName === 'refresh') {
        barcodeCollection.recover_barcode_model_sequence()
        self.sortObject = null
        self.d3el.selectAll('.sort-indicator').remove()
      } else if (d.iconName === 'sort-amount-asc') {
        parameter = 'asc'
        barcodeCollection.sort_barcode_model(thisNodeId, parameter)
        self.sortObject = self.clickedObject
        self.sortType = parameter
        self.update_sort_icon()
      } else if (d.iconName === 'sort-amount-desc') {
        parameter = 'desc'
        barcodeCollection.sort_barcode_model(thisNodeId, parameter)
        self.sortObject = self.clickedObject
        self.sortType = parameter
        self.update_sort_icon()
      } else if (d.iconName === 'remove') {
        //  当前处在align的状态, 那么用户再次点击就删除当前subtree的align状态
        var finishRemoveAlignDeferObj = $.Deferred()
        $.when(finishRemoveAlignDeferObj)
          .done(function () {
            window.Datacenter.barcodeCollection.update_all_barcode_view()
            self.draw_super_tree()
          })
        self.subtree_unalign_handler(thisNodeData, finishRemoveAlignDeferObj)
        self.remove_options_button()
      }
    },
    /**
     * 再次click节点, 取消对于当前的subtree的对齐
     */
    subtree_unalign_handler: function (nodeData, finishRemoveAlignDeferObj) {
      var self = this
      var nodeLevel = nodeData.depth
      self.node_unclick_handler(nodeData, nodeLevel, finishRemoveAlignDeferObj)
    },
    /**
     * 再次点击focus选项的按钮, 取消focus
     * @param d
     * @param nodeIndex
     * @param globalObj
     */
    node_unclick_handler: function (d, alignedLevel, finishRemoveAlignDeferObj) {
      var self = this
      var treeDataModel = self.get_super_tree_data_model
      //  model中的节点需要使用其他的model中的节点进行填充
      window.Datacenter.barcodeCollection.remove_super_subtree(d.id, d.depth, d.category, alignedLevel, finishRemoveAlignDeferObj)
    },
    update_sort_icon: function () {
      var self = this
      self.d3el.selectAll('.sort-indicator').remove()
      if (self.sortObject == null) {
        return
      }
      var x = +d3.select(self.sortObject).attr('x')
      var width = +d3.select(self.sortObject).attr('width')
      var sortType = self.sortType
      var sortTypeObject = {
        'asc': '\uf0de',
        'desc': '\uf0dd'
      }
      if (sortType === 'asc') {
        self.d3el.select('#barcode-container')
          .append("text")
          .attr('class', 'sort-indicator')
          .attr("x", x + width / 2)
          .attr("y", -2)
          .attr("font-family", "FontAwesome")
          .attr('font-size', function (d) {
            return window.height / 2 + 'px';
          })
          .text(function (d) {
            return sortTypeObject[sortType];
          })
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .style("cursor", "pointer")
      } else if (sortType === 'desc') {
        self.d3el.select('#barcode-container')
          .append("text")
          .attr('class', 'sort-indicator')
          .attr("x", x + width / 2)
          .attr("y", -7)
          .attr("font-family", "FontAwesome")
          .attr('font-size', function (d) {
            return window.height / 2 + 'px';
          })
          .text(function (d) {
            return sortTypeObject[sortType];
          })
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .style("cursor", "pointer")
      }
      self.d3el.select('#barcode-container')
        .select('.sort-button')
        .style('fill', '#ddd')
        .text('\uf0dc')
    },
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
    },
    /**
     * 判断节点是否是aligned范围, 如果属于aligned范围, 那么绘制节点; 否则这些节点不会被绘制
     * @param nodeIndex
     * @returns {boolean}
     */
    isBelongAligned: function (nodeIndex, alignedRangeObjArray) {
      if (alignedRangeObjArray.length === 0) {
        return false
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
    },
    // 获取supertree视图中的barcodeNodeArray的节点
    get_super_tree_barcode_node_array: function () {
      var self = this
      var barcodeNodeAttrArray = []
      var treeDataModel = self.get_super_tree_data_model()
      if (typeof (treeDataModel) === 'undefined') {
        return barcodeNodeAttrArray
      }
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
        barcodeNodeAttrArray = treeDataModel.get('categoryNodeObjArray')
      }
      return barcodeNodeAttrArray
    },
    //  获取supertree视图中的align的节点
    get_super_tree_aligned_range_obj: function () {
      var self = this
      var alignedRangeObjArray = []
      var treeDataModel = self.get_super_tree_data_model()
      if (typeof (treeDataModel) === 'undefined') {
        return alignedRangeObjArray
      }
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        alignedRangeObjArray = treeDataModel.get('alignedRangeObjArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        alignedRangeObjArray = treeDataModel.get('compactAlignedRangeObjArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
        var categoryArray = treeDataModel.get('categoryNodeObjArray')
        alignedRangeObjArray = [{
          rangeStartNodeIndex: 0,
          rangeEndNodeIndex: categoryArray.length - 1
        }]
      }
      return alignedRangeObjArray
    },
    //  获取supertree视图中的padding的节点
    get_super_tree_padding_range_obj: function () {
      var self = this
      var paddingNodeObjArray = []
      var treeDataModel = self.get_super_tree_data_model()
      if (typeof (treeDataModel) === 'undefined') {
        return paddingNodeObjArray
      }
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        paddingNodeObjArray = treeDataModel.get('paddingNodeObjArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        paddingNodeObjArray = treeDataModel.get('compactPaddingNodeObjArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').GLOBAL) {
        return paddingNodeObjArray
      }
      return paddingNodeObjArray
    },
    //  获取supertree视图中的data model
    get_super_tree_data_model: function () {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var selectItemNameArray = Variables.get('selectItemNameArray')
      // var treeDataModel = barcodeCollection.where({barcodeTreeId: selectItemNameArray[0]})[0]
      var treeDataModel = barcodeCollection.where({barcodeIndex: 0})[0]
      return treeDataModel
    },
    // 渲染覆盖在padding barcode上面带有纹理的矩形
    render_padding_cover_rect: function () {
      var self = this
      var barcodeNodeHeight = self.barcodeNodeHeight
      var paddingNodeObjArray = self.get_super_tree_padding_range_obj()
      var barcodeNodePadding = Config.get('BARCODE_NODE_PADDING')
      var DURATION = 1000
      // self.d3el.select('#barcode-container')
      //   .selectAll('.padding-covered-rect')
      //   .remove()
      var paddingCoverRectObj = self.d3el.select('#barcode-container')
        .selectAll('.padding-covered-rect')
        .data(paddingNodeObjArray.filter(function (d, i) {
          return d.paddingNodeStartIndex <= d.paddingNodeEndIndex
        }), function (d, i) {
          return 'covered-rect-' + i
        })
      //  与barcode的padding width的计算不同的是无论superTree的paddingNode的范围内是否存在节点一定要增加paddingnode的coverRect
      paddingCoverRectObj.enter()
        .append('rect')
        .attr('id', function (d, i) {
          return 'covered-rect-' + i
        })
        .attr('class', function (d, i) {
          return 'padding-covered-rect covered-rect-' + i
        })
        .attr('x', function (d, i) {
          return d.paddingNodeX
        })
        .attr('y', barcodeNodeHeight)
        .attr('width', barcodeNodePadding)
        .attr('height', 0)
        .style("fill", self.fill_style_handler.bind(self))
        .on('mouseover', function (d, i) {
          d3.select(this).classed('sort-hovering-highlight', true)
          // d3.select(this).attr('color', 'red')
        })
        .on('mouseout', function (d, i) {
          d3.select(this).classed('sort-hovering-highlight', false)
        })
        .on('click', padding_super_cover_click_handler)
      paddingCoverRectObj.attr('x', function (d, i) {
        return d.paddingNodeX
      })
        .transition()
        .duration(DURATION)
        .attr('y', 0)
        .attr('width', barcodeNodePadding)
        .attr('height', barcodeNodeHeight)
      paddingCoverRectObj.exit().remove()
      function padding_super_cover_click_handler(d, covered_rect_index) {
        self.clickedObject = this
        self.clickedRectIndex = covered_rect_index
        self.add_options_button(this)
        // if (d3.select(this).classed('sort-selection-highlight')) {
        //   d3.selectAll('.sort-selection-highlight').classed('sort-selection-highlight', false)
        //   d3.select(this).classed('sort-selection-highlight', false)
        //   barcodeCollection.recover_barcode_model_sequence()
        // } else {
        //   d3.selectAll('.sort-selection-highlight').classed('sort-selection-highlight', false)
        //   d3.select(this).classed('sort-selection-highlight', true)
        //   barcodeCollection.sort_cover_rect_barcode_model(covered_rect_index)
        // }
      }

      function rgb2hex(rgb) {
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
      }
    },
    add_options_button: function (thisNodeObj) {
      var self = this
      var barcodePaddingLeft = self.barcodePaddingLeft
      var barcodePaddingTop = self.barcodePaddingTop + self.barcodePaddingGap / 2
      var DURATION = 500
      var thisX = +d3.select(thisNodeObj).attr('x') + 1
      var thisY = +d3.select(thisNodeObj).attr('y') - 1
      var thisWidth = +d3.select(thisNodeObj).attr('width')
      var iconSide = Variables.get('superTreeHeight') * 0.3
      var iconPadding = 2
      var barcodeConfigFontSize = 12
      var iconArray = [
        {'iconName': 'compress', 'iconCode': '\uf066'},
        {'iconName': 'expand', 'iconCode': '\uf065'},
        {'iconName': 'sort-amount-asc', 'iconCode': '\uf160'},
        {'iconName': 'sort-amount-desc', 'iconCode': '\uf161'}]
      var iconLeftX = thisX + barcodePaddingLeft + thisWidth / 2 - iconSide * 2
      self.d3el.selectAll('.barcode-icon-bg').remove()
      self.d3el.selectAll('.barcode-g-icon').remove()
      //  更新barcode的背景矩形的位置
      var barcodeIconBg = self.d3el.selectAll('.barcode-icon-bg')
        .data(iconArray)
      barcodeIconBg.enter()
        .append('rect')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-icon-bg')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2 - iconSide / 2
        })
        .attr('y', barcodePaddingTop + iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .attr('fill', '#808080')
        .on('mouseover', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select('text#' + d.iconName).classed('mouseover-highlight', false)
        })
        .style('opacity', 0)
      barcodeIconBg.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i
        })
        .attr('y', barcodePaddingTop - iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIconBg.exit().remove()
      //  更新barcode的图标的位置
      var barcodeIcon = self.d3el.selectAll('.barcode-g-icon')
        .data(iconArray)
      barcodeIcon.enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('cursor', 'pointer')
        .attr('id', function (d, i) {
          return d.iconName
        })
        .attr('class', 'barcode-g-icon')
        .attr('font-family', 'FontAwesome')
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2
        })
        .attr('y', barcodePaddingTop + iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .text(function (d, i) {
          return d.iconCode
        })
        .on('mouseover', function (d, i) {
          d3.select(this).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          d3.select(this).classed('mouseover-highlight', false)
        })
        .on('click', function (d, i) {
          self.super_tree_controller(d, i)
        })
        .style('opacity', 0)
      barcodeIcon.transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return iconLeftX + (iconSide + 1) * i + iconSide / 2
        })
        .attr('y', barcodePaddingTop - iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 1)
      barcodeIcon.exit().remove()
    },
    remove_options_button: function () {
      var self = this
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
      var iconArray = [
        {'iconName': 'compress', 'iconCode': '\uf066'}, {'iconName': 'expand', 'iconCode': '\uf065'},
        {'iconName': 'sort-amount-asc', 'iconCode': '\uf160'}, {
          'iconName': 'sort-amount-desc',
          'iconCode': '\uf161'
        }]
      //  更新barcode的背景矩形的位置
      var barcodeIconBg = self.d3el.selectAll('.barcode-icon-bg')
        .transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2 - iconSide / 2
        })
        .attr('y', iconSide)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 0)
        .call(self.endall, function (d, i) {
          self.d3el.selectAll('.barcode-icon-bg').remove()
        })
      //  更新barcode的图标的位置
      var barcodeIcon = self.d3el.selectAll('.barcode-g-icon')
        .transition()
        .duration(DURATION)
        .attr('x', function (d, i) {
          return barcodePaddingLeft + thisX + thisWidth / 2
        })
        .attr('y', iconSide + iconSide / 2)
        .attr('height', iconSide - 1)
        .attr('width', iconSide)
        .style('opacity', 0)
        .call(self.endall, function (d, i) {
          self.d3el.selectAll('.barcode-g-icon').remove()
        })
    },
    super_tree_controller: function (d, i) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var clickedRectIndex = self.clickedRectIndex
      var parameter = null
      if (clickedRectIndex != null) {
        if (d.iconName === 'compress') {
          barcodeCollection.changExpandMode(clickedRectIndex)
          barcodeCollection.update_click_covered_rect_attr_array()
        } else if (d.iconName === 'expand') {
          barcodeCollection.changCompactMode(clickedRectIndex)
          barcodeCollection.update_click_covered_rect_attr_array()
        } else if (d.iconName === 'sort-amount-asc') {
          parameter = 'asc'
          self.sortObject = self.clickedObject
          barcodeCollection.sort_cover_rect_barcode_model(clickedRectIndex, parameter)
          self.sortType = parameter
          self.update_sort_icon()
        } else if (d.iconName === 'sort-amount-desc') {
          parameter = 'desc'
          self.sortObject = self.clickedObject
          barcodeCollection.sort_cover_rect_barcode_model(clickedRectIndex, parameter)
          self.sortType = parameter
          self.update_sort_icon()
        }
      }
    },
    fill_style_handler: function (d, i) {
      var self = this
      var nodeNum = self.get_node_number(d.paddingNodeStartIndex, d.paddingNodeEndIndex)
      var maxLeveledNumArray = Variables.get('maxLeveledNumArray')
      var partition = maxLeveledNumArray[4] / 6
      var styleIndex = Math.ceil(nodeNum / partition + 1)
      return "url(#diagonal-stripe-" + styleIndex + ")"
    },
    // 计算某个范围内, 在某些层级上的节点数量
    get_node_number: function (rangeStart, rangeEnd) {
      var self = this
      var barcodeCollection = self.options.barcodeCollection
      var selectItemNameArray = Variables.get('selectItemNameArray')
      var treeDataModel = barcodeCollection.where({barcodeTreeId: selectItemNameArray[0]})[0]
      var nodeNumber = 0
      var barcodeNodeAttrArray = null
      if (Variables.get('displayMode') === Config.get('CONSTANT').ORIGINAL) {
        barcodeNodeAttrArray = treeDataModel.get('barcodeNodeAttrArray')
      } else if (Variables.get('displayMode') === Config.get('CONSTANT').COMPACT) {
        barcodeNodeAttrArray = treeDataModel.get('compactBarcodeNodeAttrArray')
      }
      for (var bI = rangeStart; bI <= rangeEnd; bI++) {
        if ((barcodeNodeAttrArray[bI].existed) && (barcodeNodeAttrArray[bI].depth < 4)) {
          nodeNumber = nodeNumber + 1
        }
      }
      return nodeNumber
    },
    get_class_name: function (classNameArray) {
      var className = ''
      for (var cI = 0; cI < classNameArray.length; cI++) {
        className = className + ' ' + classNameArray[cI]
      }
      return className
    }
  }, SVGBase))
})
