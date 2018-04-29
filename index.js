var root = __dirname
var logger = require('./server/logger.js').initialize()

//  server打开的时候初始化读取数据的函数
var fileNameHandler = require('./server/handler/file_name_handler')
var DEFAULT_DATASET_NAME = "DailyRecordTree"

//  初始化默认的数据集, 将数据集中需要的文件预先读入到缓存中
fileNameHandler.initilizeOriginalDataset(DEFAULT_DATASET_NAME)

//  初始化用于处理客户端数据请求的handler
var handle = require('./server/handler/handler').initialize(root, logger)
//  初始化引导请求的router, 即将请求对应到具体的handler函数上
var router = require('./server/router/router').initialize(handle, logger)
//  将router传入server, 并且对于server进行初始化
var server = require('./server/server').initialize(router)
