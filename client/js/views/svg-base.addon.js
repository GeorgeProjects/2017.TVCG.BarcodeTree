/**
 *
 */
define(['underscore', 'backbone', 'd3' ], function (_, Backbone, d3) {
  'use strict'

  return {
    nameSpace: d3.ns.prefix.svg, // d3.v3
    // nameSpace: d3.namespaces, // d3.v4

    _createElement: function (tagName) {
      return document.createElementNS(_.result(this, 'nameSpace'), tagName)
    },

    _setElement: function (el) {
      Backbone.View.prototype._setElement.apply(this, arguments)
      this.d3el = d3.select(this.el)
    },

    d3: function (selector) {
      return this.d3el.select(selector)
    },

    d3All: function (selector) {
      return this.d3el.selectAll(selector)
    }
  };
});
