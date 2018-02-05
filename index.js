var root = __dirname
var logger = require('./server/logger.js').initialize()
var fs = require('fs')

// 数据集的处理器
var signalTreeProcessor = require('./server/processor/signaltree_processor')
var originalDataHandler = require('./server/handler/original_data_handler')
var updateBarcodeTreeSequence = require('./server/handler/update_barcode_tree_sequence')
var updateBarcodeTreeVerticalSequence = require('./server/handler/update_barcode_tree_vertical_sequence')
var alignedCompareHandler = require('./server/handler/aligned_compare_handler')
var setOperationHandler = require('./server/handler/set_operation_handler')
var fileNameHandler = require('./server/handler/file_name_handler')
var removeFromSuperTreeHandler = require('./server/handler/remove_from_super_tree_handler')
var handlerObj =
{
  '/barcode_original_data': originalDataHandler.handleOriginalData,
  '/barcode_compact_data': originalDataHandler.handleCompactData,
  '/build_super_tree': alignedCompareHandler.handlerBuildSuperTree,
  '/and_operation_result': setOperationHandler.handlerAndOperation,
  '/or_operation_result': setOperationHandler.handlerOrOperation,
  '/complement_operation_result': setOperationHandler.handlerComplementOperation,
  '/remove_from_super_tree': removeFromSuperTreeHandler.removeUpdateCurrentSuperTree,
  '/file_name': fileNameHandler.fileNameHandler,
  '/update_barcode_tree_sequence': updateBarcodeTreeSequence.updateBarcodeTreeSequence,
  '/update_barcode_tree_vertical_sequence': updateBarcodeTreeVerticalSequence.updateBarcodeTreeVerticalSequence
}
var handle = require('./server/handler/handler').initialize(root, signalTreeProcessor, handlerObj, logger, fs)
var router = require('./server/router/router').initialize(handle, logger)
var server = require('./server/server').initialize(router)