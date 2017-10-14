/**
 * created by Guozheng Li 2017/02/08/
 */
define([
  'require',
  'marionette',
  'backbone',
  'underscore',
  'controller',
  'router',
  'nprogress'
], function (require, Mn, Backbone, _, Controller, Router, NProgress) {
  'use strict'

  var RootView = Mn.LayoutView.extend({
    el: 'body',
    regions: {
      'app': '#app'
    }
  })
  var App = Mn.Application.extend({
    onStart: function () {
      this.appRoot = new RootView()
      window.router = this.router = new Router({
        controller: new Controller({ appRoot: this.appRoot })
      })
      if (Backbone.history) {
        Backbone.history.start({
          root: '/',
          pushState: true
        })
      }
    },
    onBeforeStart: function () { // 一些设置工作
      NProgress.configure({
        showSpinner: false
      })
      window.NProgress = NProgress
      window.NProgress.start()
    }
  })
  return App
})
