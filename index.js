var root = __dirname
var logger = require('./server/logger.js').initialize()
var fs = require('fs')

// 数据集的处理器
var signalTreeProcessor = require('./server/processor/signaltree_processor')

var handle = require('./server/handler/handler').initialize(root, signalTreeProcessor, logger, fs)
var router = require('./server/router/router').initialize(handle, logger)
var server = require('./server/server').initialize(router)