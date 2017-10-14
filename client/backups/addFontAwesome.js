draw_control_panel: function(histogramWidth, histogramHeight, margin){
  var self = this
  var controlPanelId = 'control-panel'
  var clearIconId = 'clearIcon'
  var clearIconCode = '\uf021'
  var selectAllIconId = 'selectAllIcon'
  var selectAllIconCode = '\uf07e'
  var iconClass = 'control-icon'
  console.log(d3.select(self.el))
  var controlPanel = d3.select(self.el)
    .append('g')
    .attr('id', 'control-panel')
    .attr('transform', 'translate(' + (histogramWidth + margin.left) + ',' + margin.top + ')')
  appendFontAwesome(controlPanelId, 'top', margin, histogramWidth, histogramHeight, clearIconId, iconClass, clearIconCode)
  appendFontAwesome(controlPanelId, 'middle', margin, histogramWidth, histogramHeight, selectAllIconId, iconClass, selectAllIconCode)
  function appendFontAwesome(panelId, fontType, margin, width, height, iconId, iconClass, iconCode){
    var svg = d3.select(self.el)
    var fontSizePixel = width * 2
    if(fontType === 'top'){
      console.log(svg.select('#' + panelId))
      svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'hanging')
        .attr('id', iconId)
        .attr('class', iconClass)
        .attr('x', margin.left + width + margin.right / 2)
        .attr('y', margin.top)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', function (d) { return fontSizePixel / 8 + 'em' })
        .text(iconCode)
    }else if(fontType === 'middle') {
      svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('id', iconId)
        .attr('class', iconClass)
        .attr('x', margin.left + width + margin.right / 2)
        .attr('y', margin.top + height / 2)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', function (d) { return fontSizePixel / 8 + 'em' })
        .text(iconCode)
    }else if(fontType === 'bottom'){
      d3.select('#' + panelId)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'ideographic')
        .attr('id', iconId)
        .attr('class', iconClass)
        .attr('x', margin.left + width + margin.right / 2)
        .attr('y', margin.top + height)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', function (d) { return fontSizePixel / 8 + 'em' })
        .text(iconCode)
    }
  }
}