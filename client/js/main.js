require.config({
  shim: {
    'bootstrap': ['jquery'],
    'backbone': {
      deps: ['jquery','underscore']
    },
    "jqueryUI": {
      export:"$",
      deps: ['jquery']
    },
    'd3Barchart': {
      deps:['d3']
    }
  },
  paths: {
    // libs loader
    'text': '../bower_components/requirejs-text/text',
    'jquery': '../bower_components/jquery/dist/jquery.min',
    'jquery-ui': '../bower_components/jquery-ui/jquery-ui',
    'underscore': '../bower_components/underscore/underscore-min',
    'bootstrap': '../bower_components/bootstrap/dist/js/bootstrap.min',
    'backbone': '../bower_components/backbone/backbone-min',
    'nprogress': '../bower_components/nprogress/nprogress',
    'marionette': '../bower_components/marionette/lib/backbone.marionette.min',
    'backbone.relational': '../bower_components/backbone-relational/backbone-relational',
    'd3': '../bower_components/d3/d3.v3',
    'backbone.routefilter': '../bower_components/backbone.routefilter/dist/backbone.routefilter.min',
    'reconnectingWebSocket': '../bower_components/reconnecting-websocket/reconnecting-websocket',
    'bootstrap-slider': '../bower_components/bootstrap-slider/dist/bootstrap-slider.min',
    'd3Menu': '../bower_components/d3_menu/d3.menu',
    'd3Barchart': '../bower_components/d3_barchart/d3.barchart',
    'jsColor': '../bower_components/jscolor/jscolor',
    'pagination': '../bower_components/JqueryPagination/jquery.simplePagination',
    'tooltips': '../bower_components/d3-tip/d3-tip',
    'iconfont': '../icon_library/iconfont',
    'rangeslider': '../bower_components/rangeslider/dist/rangeslider',
    'huebee': '../bower_components/huebee/dist/huebee.pkgd',
    'sweetalert': '../bower_components/sweetalert/dist/sweetalert.min',
    // templates path
    'templates': '../templates',
    'communicator': 'controller/communicator',
    'datacenter': 'models/datacenter.model',
    'config': 'models/config.model',
    'variables': 'models/variables.model',
    'barcodeCollection': 'collections/barcode.collection'
  }
})
//  在外面的require的内容加在完以后，才会加载内部的require中的内容
require([ 'underscore', 'd3' ], function (_, d3) {
  'use strict'
  require([ 'backbone', 'bootstrap', 'd3Barchart', 'jquery-ui' ], function (Backbone, Bootstrap, d3Barchart, jqueryUI) {
    require(['d3Menu'], function(d3Menu) {
      //d3Menu binding
      $.fn.d3_menu = function() {
        if ($(this).data('d3_menu') == undefined) {
          var target = d3.select(this[0])
          var renderer = d3.menu().target(target)
          $(this).data('d3_menu', renderer)
        }
        return $(this).data('d3_menu')
      }
      require(['app'], function(App) { // require.js shim不能与cdn同用,因此3层require,非amd module需要如此
        $(document).ready(function() {
          var app = new App()
          app.start()
        })
      })
    })
  })
})