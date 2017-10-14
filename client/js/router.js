/**
 * Created by llj on 15/11/7.
 */
define([
  'backbone.routefilter',
  'marionette'
], function (Routefilter, Mn) {
  'use strict'

  var router = Mn.AppRouter.extend({
    appRoutes: {
      // default route
      '*default': 'showApp'
    },
    before: function (route, params) {
      window.NProgress.start()
    },
    after: function (route, params) {
      window.NProgress.done()
    }
  })
  return router
})
