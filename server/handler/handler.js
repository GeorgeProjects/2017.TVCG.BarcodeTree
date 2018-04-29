//Worker: 各种处理程序，负责直接包装响应
//注意文件路径以最顶级的index.js为准
var fileType = {
  'json': 'application/json',
  'js': 'text/plain',
  'tpl': 'text/plain',
  'css': 'text/css',
  'less': 'text/plain',
  'png': 'image/png',
  'ico': 'image/ico',
  'html': 'text/html',
  'csv': 'text/comma-separated-values',
  'woff': 'application/x-font-woff',
  'woff2': 'application/x-font-woff',
  'ttf': 'application/octet-stream',
  'bmp': 'application/x-MS-bmp',
  'svg': 'image/svg-xml',
  'map': 'text/plain',
  'ico': 'image/vnd.microsoft.icon',
  'pdf': 'application/pdf'
}

var clone = require('clone')
var fs = require('fs')

/**
 * 下面是处理响应的函数
 */
//  原始BarcodeTree数据的处理函数
var originalDataHandler = require('./original_data_handler')
//  更新BarcodeTree顺序的请求函数
var updateBarcodeTreeSequence = require('./update_barcode_tree_sequence')
//  更新BarcodeTree纵向顺序的请求函数
var updateBarcodeTreeVerticalSequence = require('./update_barcode_tree_vertical_sequence')
//  将对应的BarcodeTree数据集对应的函数
var alignedCompareHandler = require('./aligned_compare_handler')
//  集合操作的请求函数
var setOperationHandler = require('./set_operation_handler')
//  请求数据集的统计数据的请求函数
var fileNameHandler = require('./file_name_handler')
//  当取消选择某个BarcodeTree时, 从superTree去掉某个BarcodeTree的函数
var removeFromSuperTreeHandler = require('./remove_from_super_tree_handler')

function initialize(root, v_logger) {
  var resOpt = {
    root: root
  }
  var logger = v_logger

  function handleStart(path, response, next) {
    // logger.log("    Handler: Start!");
    response.status(200).type('html').sendFile('/client' + path + '/index.html', resOpt,
      function (err) {
        if (err) {
          logger.log(err)
          response.status(err.status).end()
        }
        next()
      })
  }

  function handleFile(path, response, next) {
    if (typeof handle[path] === 'function') {
      next()
      return
    }
    // logger.log("    Handler: File!");
    var t_index = path.lastIndexOf('.') + 1
    var t_path = path.slice(t_index)
    var tt_path = '/client' + path
    // logger.log("                                                 " + tt_path)
    response.status(200).type(fileType[t_path]).sendFile(tt_path.slice(1), resOpt,
      function (err) {
        if (err) {
          logger.log(err)
          response.status(err.status).end()
        }
        next()
      })
  }

  function handleQuery(request, response) {
    logger.log("    Handler: Query!");
    var t_record = request.url.replace("/query?name=", "");
    var responseFunc = function (v_result) {
      if (!v_result) {
        logger.log("    Handler: Query Failed!");
        response.sendStatus(404);
      } else {
        logger.log("    Handler: Query Success! The result is " + v_result)
        response.status(200).jsonp(v_result);
      }
    };
    db.query(t_record, responseFunc);
  }

  function handle404(path, response, next) {
    logger.log('    Handler: File not found for ' + path)
    response.sendStatus(404)
    next()
  }

  //  初始化对应的请求函数以及请求的url名称构建处理函数的对象
  var handlerObj =
  {
    '/file_name': fileNameHandler.fileNameHandler,
    '/barcode_original_data': originalDataHandler.handleOriginalData,
    '/barcode_compact_data': originalDataHandler.handleCompactData,
    '/build_super_tree': alignedCompareHandler.handlerBuildSuperTree,
    '/and_operation_result': setOperationHandler.handlerAndOperation,
    '/or_operation_result': setOperationHandler.handlerOrOperation,
    '/complement_operation_result': setOperationHandler.handlerComplementOperation,
    '/remove_from_super_tree': removeFromSuperTreeHandler.removeUpdateCurrentSuperTree,
    '/update_barcode_tree_sequence': updateBarcodeTreeSequence.updateBarcodeTreeSequence,
    '/update_barcode_tree_vertical_sequence': updateBarcodeTreeVerticalSequence.updateBarcodeTreeVerticalSequence
  }

  var handle = {}
  handle['/'] = handleStart
  handle['/start'] = handleStart
  handle['404'] = handle404
  handle['file'] = handleFile
  handle['query'] = handleQuery
  //  获取文件统计信息的handler
  handle['/file_name'] = handlerObj['/file_name']
  //  获取barcodeTree的原始形式以及compact形式的handler
  handle['/barcode_original_data'] = handlerObj['/barcode_original_data']
  handle['/barcode_compact_data'] = handlerObj['/barcode_compact_data']
  //  集合操作的handler, and, or, complement
  handle['/and_operation_result'] = handlerObj['/and_operation_result']
  handle['/or_operation_result'] = handlerObj['/or_operation_result']
  handle['/complement_operation_result'] = handlerObj['/complement_operation_result']
  //  构建superTree的handler
  handle['/build_super_tree'] = handlerObj['/build_super_tree']
  handle['/remove_from_super_tree'] = handlerObj['/remove_from_super_tree']
  handle['/update_barcode_tree_sequence'] = handlerObj['/update_barcode_tree_sequence']
  handle['/update_barcode_tree_vertical_sequence'] = handlerObj['/update_barcode_tree_vertical_sequence']
  return handle
}

exports.initialize = initialize