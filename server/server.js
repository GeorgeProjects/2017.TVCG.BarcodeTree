// 服务器端负责拆解信息, 得到客户端的请求
var http = require('http')
var url = require('url')
var express = require('express')
var app = express()

var bodyParser = require('body-parser')
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit: 200000}));
var multer = require('multer')

app.use(bodyParser.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(multer({dest: '/tmp/'}).array('image'))

function initialize(router) {
  app.use('/', router)
  var address = '0.0.0.0'
  var port = 13350
  var server = http.createServer(app).listen(port, address)
  console.log('listen ' + address + ':' + port + '......')
  return server
}

exports.initialize = initialize
