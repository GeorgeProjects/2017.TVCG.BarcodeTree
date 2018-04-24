var dataCenter = require('../dataCenter/dataCenter')
var clone = require('clone')

var updateBarcodeTreeVerticalSequence = function (request, response) {
  var barcodeTreeVerticalSequence = dataCenter.get_row_sorting_sequence()
  sendTreeNodeArray(barcodeTreeVerticalSequence)
  function sendTreeNodeArray(barcodeTreeVerticalSequence) {
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Access-Control-Allow-Origin', '*')
    var treeNodeObject = {
      'barcodeTreeVerticalSequence': barcodeTreeVerticalSequence
    }
    response.send(JSON.stringify(treeNodeObject, null, 3))
  }
}
exports.updateBarcodeTreeVerticalSequence = updateBarcodeTreeVerticalSequence
