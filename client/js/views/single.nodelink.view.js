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
    template: false, //  for the itemview, we must define the template value false
    renderWidth: 0,
    renderHeight: 0,
    defaultLevelHeight: 100,
    levelHeight: 0,
    attributes: {
      style: 'width: 100%; height: 100%;',
      id: 'single-nodelink-svg'
    },
    events: {},
    initialize: function (options) {
      //  初始化的时候请求一个默认的数据
      var self = this
      var divWidth = $('#single-nodelink-tree-view').width()
      var divHeight = $('#single-nodelink-tree-view').height()
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
        .attr('id', 'nodelinktree-g')
      Backbone.Events.on(Config.get('EVENTS')[ 'RENDER_UPLOAD_NODELINK_TREE' ], function () {
        self.draw_nodelink_tree()
      })
      Backbone.Events.on(Config.get('EVENTS')[ 'HIGHLIGHT_NODELINK_NODE' ], function (event) {
        var treeIndex = event.treeIndex
        var nodeId = event.nodeId
        self.highlight_nodelink_node(treeIndex, nodeId)
      })
      Backbone.Events.on(Config.get('EVENTS')[ 'UNHIGHLIGHT_NODELINK_NODE' ], function (event) {
        var treeIndex = event.treeIndex
        var nodeId = event.nodeId
        self.unhighlight_nodelink_node(treeIndex, nodeId)
      })
    },
    init_events: function () {
      var self = this
    },
    /**
     * 初始化视图中的svg,包括大小,位置
     */
    init_view: function () {
      var self = this
    },
    /**
     *  绘制nodelinkTree
     */
    draw_nodelink_tree: function () {
      var self = this
      var singleBarcodeModel = self.model
      var uploadTreeObjArray = singleBarcodeModel.get('uploadTreeObjArray')
      var maxDepth = singleBarcodeModel.get('maxDepth')
      var maxRadius = singleBarcodeModel.get('maxRadius')
      self.update_nodelink_level_heigth(uploadTreeObjArray)
      self.update_single_nodelink_tree_g_location(uploadTreeObjArray)
      for (var uI = 0; uI < uploadTreeObjArray.length; uI++) {
        var treeObj = uploadTreeObjArray[ uI ].superTreeObj
        self.draw_single_nodelink_tree(treeObj, maxDepth, maxRadius, uI)
      }
    },
    update_nodelink_level_heigth: function (uploadTreeObjArray) {
      var self = this
      var renderHeight = self.renderHeight
      var levelNum = 0
      for (var uI = 0; uI < uploadTreeObjArray.length; uI++) {
        levelNum = levelNum + uploadTreeObjArray[ uI ].maxDepth
      }
      var levelHeight = renderHeight / levelNum
      var defaultLevelHeight = self.defaultLevelHeight
      self.levelHeight = levelHeight < defaultLevelHeight ? levelHeight : defaultLevelHeight
    },
    update_single_nodelink_tree_g_location: function (uploadTreeObjArray) {
      var self = this
      var levelHeight = self.levelHeight
      var nodelinkSingleG = d3.select('#nodelinktree-g')
        .selectAll('.single-nodelink-tree-g')
        .data(uploadTreeObjArray)
      nodelinkSingleG.enter()
        .append('g')
        .attr('class', 'single-nodelink-tree-g')
        .attr('id', function (d, i) {
          return 'single-nodelink-tree-g-' + i
        })
        .attr('transform', function (d, i) {
          return 'translate(' + 0 + ',' + levelHeight * d.locationLevel + ')'
        })
      nodelinkSingleG.attr('y', function (d, i) {
        return levelHeight * d.locationLevel
      })
      nodelinkSingleG.exit().remove()
    },
    draw_single_nodelink_tree: function (treeObj, maxDepth, maxRadius, treeIndex) {
      var self = this
      var i = 0,
        duration = 750,
        root
      var height = self.renderHeight
      var width = self.renderWidth
      var levelHeight = self.levelHeight
      var tree = d3.layout.tree()
        .size([ width, height ]);
      var diagonal = d3.svg.diagonal()
        .projection(function (d) { return [ d.x, d.y ]; });
      root = treeObj;
      root.x0 = height / 2;
      root.y0 = 0;
      update(root);
      function update (source) {
        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) { d.y = d.depth * levelHeight; });

        // Update the nodes…
        var node = d3.select('#nodelinktree-g').select('#single-nodelink-tree-g-' + treeIndex)
          .selectAll("g.node")
          .data(nodes, function (d) { return d.index })

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
          .attr("class", function (d, i) {
            var classNameArray = [ "node" ]
            if (d.exist) {
              classNameArray.push('exist')
            } else {
              classNameArray.push('miss')
            }
            return self.get_class_name(classNameArray)
          })
          .attr('id', function (d, i) {
            return d.index
          })
          .attr("transform", function (d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
          .on("click", click)
          .on("mouseover", function (d) {
            d3.select(this).select('circle').classed('mouseover-highlight', true)
            self.trigger_node_highlight(treeIndex, d3.select(this).attr('id'))
          })
          .on('mouseout', function (d) {
            d3.select(this).select('circle').classed('mouseover-highlight', false)
            self.trigger_node_unhighlight(treeIndex, d3.select(this).attr('id'))
          })

        nodeEnter.append("circle")
          .attr("r", 1e-6)
          .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; })

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

        nodeUpdate.select("circle")
          .attr("r", function (d, i) {
            return (maxDepth - d.depth) / maxDepth * maxRadius
          })
          .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; })

        nodeUpdate.select("text")
          .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function (d) { return "translate(" + source.x + "," + source.y + ")"; })
          .remove();

        nodeExit.select("circle")
          .attr("r", 1e-6);

        nodeExit.select("text")
          .style("fill-opacity", 1e-6);

        // Update the links…
        var link = d3.select('#nodelinktree-g').select('#single-nodelink-tree-g-' + treeIndex).selectAll("path.link")
          .data(links, function (d) { return d.target.index; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
          .attr("class", function (d, i) {
            var classNameArray = [ "link" ]
            if (d.target.exist) {
              classNameArray.push('exist')
            } else {
              classNameArray.push('miss')
            }
            return self.get_class_name(classNameArray)
          })
          .attr("d", function (d) {
            var o = { x: source.x0, y: source.y0 };
            return diagonal({ source: o, target: o });
          });

        // Transition links to their new position.
        link.transition()
          .duration(duration)
          .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
          .duration(duration)
          .attr("d", function (d) {
            var o = { x: source.x, y: source.y };
            return diagonal({ source: o, target: o });
          })
          .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
          d.x0 = d.x;
          d.y0 = d.y;
        });
      }

      // Toggle children on click.
      function click (d) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d);
      }
    },
    transfrom_name_id: function (depth, name) {
      var id = name.replace('/', '')
        .replaceAll('&', '')
        .replaceAll(':', '')
        .replaceAll(',', '')
        .replaceAll('.', '')
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replaceAll(';', '')
        .replaceAll('\'', '')
        .replaceAll('?', '')
        .replaceAll('=', '')
        .replaceAll(' ', '-')
        .replaceAll('>', '')
        .replaceAll('[', '')
        .replaceAll(']', '')
        .replaceAll('!', '')
        .replaceAll('"', '')
        .replaceAll('+', '')
        .replaceAll('/', '')
        .replaceAll('@', '')
      if (is_numeric(id)) {
        id = zFill(id)
      }
      return 'node-' + depth + '-' + id
      function is_numeric (str) {
        return /^\d+$/.test(str);
      }

      function zFill (str) {
        var pad = "000"
        var ans = str + pad.substring(0, pad.length - str.length)
        return ans
      }
    },
    get_class_name: function (classNameArray) {
      var className = ''
      for (var cI = 0; cI < classNameArray.length; cI++) {
        className = className + ' ' + classNameArray[ cI ]
      }
      return className
    },
    highlight_nodelink_node: function (treeIndex, nodeId) {
      d3.select('#single-nodelink-tree-g-' + treeIndex).select('#' + nodeId).select('circle')
        .classed('mouseover-highlight', true)
    },
    unhighlight_nodelink_node: function (treeIndex, nodeId) {
      d3.select('#single-nodelink-tree-g-' + treeIndex)
        .select('#' + nodeId)
        .select('circle')
        .classed('mouseover-highlight', false)
    },
    trigger_node_highlight: function (treeIndex, nodeId) {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'HIGHLIGHT_BARCODE_NODE' ], {
        'treeIndex': treeIndex,
        'nodeId': nodeId
      })
    },
    trigger_node_unhighlight: function (treeIndex, nodeId) {
      Backbone.Events.trigger(Config.get('EVENTS')[ 'UNHIGHLIGHT_BARCODE_NODE' ], {
        'treeIndex': treeIndex,
        'nodeId': nodeId
      })
    }
  }, SVGBase))
})