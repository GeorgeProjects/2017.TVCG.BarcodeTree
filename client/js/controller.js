/**
 * Created by aji on 15/7/30.
 */
define([
  'require',
  'underscore',
  'backbone'
], function (require, _, Backbone) {
  'use strict'

  var Controller = function (options) {
    this.appRoot = options.appRoot
  }

  _.extend(Controller.prototype, {
    // register views
    showApp: function () {
      require([ 'views/app.view' ], _.bind(function (AppView) {
        this.appRoot.getRegion('app').show(new AppView())
      }, this))
    }
  })
  return Controller
})
