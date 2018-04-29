//  导入预处理数据的处理器
var barcodeTreeProcessor = require('./server/preprocesser/data_preprocessor')

//  调用处理NBA数据的函数
// barcodeTreeProcessor.pre_process_nba_tree()

//  调用处理图书馆记录数据的函数
barcodeTreeProcessor.pre_process_record_tree()