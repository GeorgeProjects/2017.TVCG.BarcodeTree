define([
  'require',
  'marionette',
  'underscore',
  'backbone',
  'd3',
  'd3Barchart',
  'jsColor',
  'config',
  'variables',
  'views/svg-base.addon'
], function (require, Mn, _, Backbone, d3, d3BarChart, jsColor, Config, Variables, SVGBase) {
  'use strict'

  return Mn.ItemView.extend(_.extend({
    tagName: 'svg',
    template: false, // for the itemview, we must define the template value false
    renderWidth: 0,
    renderHeight: 0,
    barcodeNodeHeight: 0,
    defaultBarcodeNodeHeight: 80,
    attributes: {
      style: 'width: 100%; height: 100%;',
      id: 'single-barcode-svg'
    },
    events: {},
    initialize: function (options) {
      //  初始化的时候请求一个默认的数据
      var self = this
      console.log('self', self.init_events)
      self.init_events()
      var divWidth = $('#single-barcode-tree-view').width()
      var divHeight = $('#single-barcode-tree-view').height()
      d3.select(self.el)
        .attr('width', divWidth)
        .attr('height', divHeight)
      var margin = { top: 50, right: 10, bottom: 20, left: 30 }
      var renderWidth = divWidth - margin.right - margin.left
      var renderHeight = divHeight - margin.top - margin.bottom
      self.renderWidth = renderWidth
      self.renderHeight = renderHeight
      d3.select(self.el)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('id', 'barcodetree-g')
    },
    init_events: function () {
      var self = this
      Backbone.Events.on(Config.get('EVENTS')[ 'RENDER_UPLOAD_BARCODE_TREE' ], function () {
        self.add_barcode_tree()
      })
      Backbone.Events.on(Config.get('EVENTS')[ 'HIGHLIGHT_BARCODE_NODE' ], function (event) {
        var treeIndex = event.treeIndex
        var nodeId = event.nodeId
        self.highlight_barcode_node(treeIndex, nodeId)
      })
      Backbone.Events.on(Config.get('EVENTS')[ 'UNHIGHLIGHT_BARCODE_NODE' ], function (event) {
        var treeIndex = event.treeIndex
        var nodeId = event.nodeId
        self.unhighlight_barcode_node(treeIndex, nodeId)
      })
    },
    /**
     *  绘制barcodeTree
     */
    add_barcode_tree: function () {
      var self = this
      var singleBarcodeModel = self.model
      var uploadBarcodeTreeObjArray = singleBarcodeModel.get('uploadBarcodeTreeObjArray')
      self.update_barcode_node_heigth(uploadBarcodeTreeObjArray)
      self.update_single_barcode_tree_g_location(uploadBarcodeTreeObjArray)
      for (var uI = 0; uI < uploadBarcodeTreeObjArray.length; uI++) {
        var barcodeNodeArray = uploadBarcodeTreeObjArray[ uI ].barcodeNodeArray
        self.add_single_barcode_tree(barcodeNodeArray, uI)
      }
    },
    update_barcode_node_heigth: function (uploadBarcodeTreeObjArray) {
      var self = this
      var renderHeight = self.renderHeight
      var barcodeTreeNum = uploadBarcodeTreeObjArray.length
      var barcodeNodeHeight = renderHeight / barcodeTreeNum
      var defaultBarcodeNodeHeight = self.defaultBarcodeNodeHeight
      self.barcodeNodeHeight = barcodeNodeHeight < defaultBarcodeNodeHeight ? barcodeNodeHeight : defaultBarcodeNodeHeight
    },
    update_single_barcode_tree_g_location: function (uploadBarcodeTreeObjArray) {
      var self = this
      var barcodeNodeHeight = self.barcodeNodeHeight
      var barcodeSingleG = d3.select('#barcodetree-g')
        .selectAll('.single-barcodetree-g')
        .data(uploadBarcodeTreeObjArray)
      barcodeSingleG.enter()
        .append('g')
        .attr('class', 'single-barcodetree-g')
        .attr('id', function (d, i) {
          return 'single-barcodetree-g-' + i
        })
        .attr('transform', function (d, i) {
          return 'translate(' + 0 + ',' + (barcodeNodeHeight + 20) * i + ')'
        })
      barcodeSingleG.attr('y', function (d, i) {
        return barcodeNodeHeight * i
      })
      barcodeSingleG.exit().remove()
    },
    add_single_barcode_tree: function (barcodeNodeArray, uI) {
      var self = this
      var selectedLevels = Variables.get('selectedLevels')
      var renderHeight = self.renderHeight
      var barcodeNodeHeight = self.barcodeNodeHeight
      var transformY = 0 //renderHeight / 2 - barcodeNodeHeight / 2
      d3.select('#barcodetree-g')
        .select('#single-barcodetree-g-' + uI)
        .selectAll('.barcode-node')
        .remove()
      var alignedBarcodeNodes = d3.select('#barcodetree-g')
        .select('#single-barcodetree-g-' + uI)
        .selectAll('.barcode-node')
        .data(barcodeNodeArray, function (d, i) {
          return d.id
        })
      //  enter 添加节点
      alignedBarcodeNodes.enter()
        .append('rect')
        .attr('class', function (d, i) {
          var classNameArray = [ 'barcode-node' ]
          if (d.exist) {
            classNameArray.push('node-existed')
          } else {
            if (d.width <= 2) {
              classNameArray.push('node-missed-narrow')
            } else {
              classNameArray.push('node-missed-wide')
            }
          }
          return self.get_class_name(classNameArray)
        })
        .attr('id', function (d, i) {
          return d.id
        })
        .attr('x', function (d) {
          return +d.x
        })
        .attr('y', transformY)
        .attr('width', function (d) {
          return +d.width
        })
        .attr('height', function (d) {
          return barcodeNodeHeight
        })
        .style("cursor", function (d, i) {
          if (d.exist) {
            return "pointer"
          } else {
            return "default"
          }
        })
        .on('mouseover', function (d, i) {
          self.trigger_node_highlight(uI, d.id)
          d3.select(this).classed('mouseover-highlight', true)
        })
        .on('mouseout', function (d, i) {
          self.trigger_node_unhighlight(uI, d.id)
          d3.select(this).classed('mouseover-highlight', false)
        })
      // update 更新节点
      alignedBarcodeNodes.attr('class', function (d, i) {
        var classNameArray = [ 'barcode-node' ]
        if (d.exist) {
          classNameArray.push('node-existed')
        } else {
          if (d.width <= 2) {
            classNameArray.push('node-missed-narrow')
          } else {
            classNameArray.push('node-missed-wide')
          }
        }
        return self.get_class_name(classNameArray)
      })
        .attr('width', function (d) {
          return +d.width
        })
        .attr('y', transformY)
        .attr('x', function (d) {
          return +d.x
        })
    },
    get_class_name: function (classNameArray) {
      var className = ''
      for (var cI = 0; cI < classNameArray.length; cI++) {
        className = className + ' ' + classNameArray[ cI ]
      }
      return className
    },
    highlight_barcode_node: function (treeIndex, nodeId) {
      d3.select('#barcodetree-g')
        .select('#single-barcodetree-g-' + treeIndex)
        .select('#' + nodeId)
        .classed('mouseover-highlight', true)
    },
    unhighlight_barcode_node: function (treeIndex, nodeId) {
      d3.select('#barcodetree-g')
        .select('#single-barcodetree-g-' + treeIndex)
        .select('#' + nodeId)
        .classed('mouseover-highlight', false)
    },
    trigger_node_highlight: function (treeIndex, nodeId) {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'HIGHLIGHT_NODELINK_NODE' ], {
        'treeIndex': treeIndex,
        'nodeId': nodeId
      })
    },
    trigger_node_unhighlight: function (treeIndex, nodeId) {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UNHIGHLIGHT_NODELINK_NODE' ], {
        'treeIndex': treeIndex,
        'nodeId': nodeId
      })
    }
  }, SVGBase))
})