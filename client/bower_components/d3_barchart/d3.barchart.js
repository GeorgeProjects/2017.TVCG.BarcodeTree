//version 2017.3.29 14:00
//dependency:
//d3.js version 4.7.4
(function() {
    d3.chart = function() {
        let width = 400,
          height = 100,
          margin = {},
          duration = 500,
          bar_class = 'bar_class',
          draw_xAxis = true,
          draw_yAxis = true,
          yTickNum = null,
          xTickNum = null,
          xLabel = '',
          yLabel = '',
          enable_brush = true,
          bar_interval = 0,
          x_ticks_value = null,
          x_ticks_format = null,
          y_ticks_value = null,
          y_ticks_format = null,
          local_brush_start = 0,
          local_brush_end = 0,
          bar_click_handler = null,
          bar_unclick_handler = null,
          x_interval = 0,
          distribution_level = null

        let brush_trigger = function(d3_event, brushed_bar_sel) {}
        let brushmove_trigger = function(){}
        let hovering_trigger = function(){}
        let unhovering_trigger = function(){}
        let pre_highlight_bar = function(){}
        let highlight_bar = function(){}
        let un_highlight_bar = function(){}
        let _font_style = '10px sans-serif'

      /**
       * 渲染柱状图的函数
       * @param selection - selection是绘制barchart的svg
       */
        function chart(selection) {
              selection.each(function(dataset) {
                let innerWidth = width
                let innerHeight = height
                console.log('innerWidth:' + innerWidth +',innerHeight' + innerHeight)
                let x = d3.scale.linear()
                  .domain([0, d3.max(dataset, d => d.x2)])
                .range([0, innerWidth])

                let y = d3.scale.linear()
                  .domain([0, d3.max(dataset, d => d.y)])
                .range([innerHeight, 0])

                let svg = d3.select(this)
                  .attr('width', width + margin.left + margin.right)
                  .attr('height', height + margin.top + margin.bottom)

                let g = svg.selectAll('.container')
                  .data([null])
                  .enter().append('g')
                  .attr('class', 'container')
                g = svg.selectAll('.container')
                  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
              /**
               * 绘制x坐标轴
               */
                if (draw_xAxis) {
                    var xAxis = d3.svg.axis().scale(x).orient("bottom")

                    if (xTickNum !== null){
                        xAxis.ticks(xTickNum)
                    }
                    if(x_ticks_value != null){
                        xAxis.tickValues(x_ticks_value)
                          .tickFormat(function(d,i){
                              return x_ticks_format[i]
                          })
                    }
                    let xAxis_g_update = g.selectAll('.x.axis')
                      .data([null])
                    let xAxis_g_enter = xAxis_g_update.enter()
                      .append('g')
                      .attr('class', 'x axis')

                    g.selectAll('.x.axis')
                      .attr('transform', 'translate(0,' + innerHeight + ')')
                      .call(xAxis)

                    xAxis_g_enter.selectAll('.x.label')
                      .data([null])
                      .enter()
                      .append('text')
                      .attr('text-anchor', 'middle')
                      .attr('alignment-baseline', 'hanging')
                      .attr('class', 'x label')
                      .attr('x', innerWidth)
                      .attr('dy', '0.4em')
                      .attr('fill', 'black')
                      .text(xLabel)

                    xAxis_g_enter.selectAll('text')
                      .style('font', _font_style)
                }
              /**
               * 支持用户brush选择操作
               */
              if(enable_brush){
                let brush = d3.svg.brush()
                  .x(x)
                  .on('brushstart', brushstart)
                  .on('brush', brushmove)
                  .on('brushend', brushend)

                let brushG = g.append('g')
                  .attr('class', 'brush')
                  .call(brush)

                brushG.selectAll('rect')
                  .attr('height', innerHeight)

                function brushstart(){
                  //  下一次brush开始时作为选择的barchart的确定
                }

                function brushmove(){
                  svg.selectAll('.library-bar:not(.click-highlight)').classed('click-unhighlight', true)
                  var extent = brush.extent()
                  var localBrushStart = (brush.empty()) ? 0 : Math.ceil(extent[0])
                  var localBrushEnd = (brush.empty()) ? -1 : Math.ceil(extent[1])
                  svg.select('g.brush').call((brush.empty()) ? brush.clear() : brush.extent([ localBrushStart, localBrushEnd ]))
                  svg.selectAll('.library-bar').classed('unchanged-pre-click-highlight', false)
                  svg.selectAll('.library-bar').classed('pre-click-highlight', false)

                  for(var lI = localBrushStart;lI < localBrushEnd;lI++){
                    var barId = dataset[lI].id
                    pre_highlight_bar(barId, svg)
                  }
                  brushmove_trigger()
                  if((svg.selectAll('.click-highlight').empty()) && (svg.selectAll('.pre-click-highlight').empty())){
                    svg.selectAll('.library-bar').classed('click-unhighlight', false)
                  }
                }

                function brushend(){
                  var extent = brush.extent()
                  var localBrushStart = (brush.empty()) ? 0 : Math.ceil(extent[0])
                  var localBrushEnd = (brush.empty()) ? -1 : Math.ceil(extent[1])
                  local_brush_start = localBrushStart
                  local_brush_end = localBrushEnd
                  var real_brush_start = local_brush_start * x_interval
                  var real_brush_end = local_brush_end * x_interval
                  brush_trigger(real_brush_start, real_brush_end, distribution_level)
                }
              }
              /**
               * 绘制y坐标轴
               */
              if (draw_yAxis) {
                    let yAxis = d3.svg.axis().scale(y).orient("left")
                    if (yTickNum !== null)
                        yAxis.ticks(yTickNum)

                    if(y_ticks_value != null){
                        yAxis.tickValues(y_ticks_value)
                          .tickFormat(function(d,i){
                              return y_ticks_format[i]
                          })
                    }

                    let yAxis_g_update = g.selectAll('.y.axis')
                      .data([null])
                    let yAxis_g_enter = yAxis_g_update.enter()
                      .append('g')
                      .attr('class', 'y axis')

                    g.selectAll('.y.axis')
                      .call(yAxis)

                    yAxis_g_enter.selectAll('.y.label')
                      .data([null])
                      .enter()
                      .append('text')
                      .attr('class', 'y label')
                      // .attr('transform', 'rotate(-90)')
                      .attr('text-anchor', 'start')
                      .attr('alignment-baseline', 'hanging')
                      .attr('dy', '-0.5em')
                      .attr('dx', '0.5em')
                      .attr('fill', 'black')
                      .text(yLabel)

                    yAxis_g_enter.selectAll('text')
                      .style('font', _font_style)
                }
                //  首先绘制鼠标悬浮的bar chart
                g.append('rect')
                  .attr('class', 'hovering-rect')
                  .attr('x', 0)
                  .attr('y', 0)
                  .attr('height', height + margin.bottom)
                  .attr('width', 0)
                  .attr('fill', '#ddd')
                g.append('rect')
                  .attr('class', 'compare-based-rect')
                  .attr('x', 0)
                  .attr('y', 0)
                  .attr('height', height + margin.bottom)
                  .attr('width', 0)
                  .attr('fill', '#ddd')
              /**
               * 绘制柱状图, enter, exit, update
               */
              let bars = g.selectAll('.library-bar')
                  .data(dataset)
                bars.enter().append('rect')
                  .attr('class', 'library-bar ' + bar_class)
                  .attr('id', function(d, i){
                    return d.id
                  })
                  .attr('x', d => x(d.x1))
                  .attr('width', d => x(d.x2 - d.x1) - bar_interval)
                  .attr('y', d => y(d.y))
                  .attr('height', d => innerHeight - y(d.y))
                  .on('mouseover', function(d,i){
                    d3.selectAll('.library-bar').classed('hovering-highlight', false)
                    d3.select(this).classed('hovering-highlight', true)
                    var rectX = (+d3.select(this).attr('x')) - bar_interval
                  var rectWidth = (+d3.select(this).attr('width')) + bar_interval
                    g.select('.hovering-rect')
                      .attr('width', rectWidth)
                      .attr('x', rectX)
                    var dataObj = dataset[i]
                    hovering_trigger(dataObj)
                  })
                  .on('mouseout', function(d,i){
                    d3.select(this).classed('hovering-highlight', false)
                    var dataObj = dataset[i]
                    unhovering_trigger(dataObj)
                    g.select('.hovering-rect')
                      .attr('width', 0)
                      .attr('x', 0)
                  })
                  .on('click', function(d,i){
                    d3.selectAll('.library-bar:not(.click-highlight)').classed('click-unhighlight', true)
                    var barId = d3.select(this).attr('id')
                    if(d3.select(this).classed('click-highlight')){
                      un_highlight_bar(barId, svg)
                      bar_unclick_handler(barId)
                    }else{
                      highlight_bar(barId)
                      //  是否更新barcode的位置
                      var isUpdate = true
                      bar_click_handler(barId, isUpdate)
                    }
                    if((svg.selectAll('.click-highlight').empty()) && (svg.selectAll('.pre-click-highlight').empty())){
                      svg.selectAll('.library-bar').classed('click-unhighlight', false)
                    }
                  })
              bars.exit().remove()
              bars.transition()
                  .duration(duration)
                  .attr('x', d => x(d.x1))
                  .attr('width', d => x(d.x2 - d.x1) - bar_interval)
                  .attr('y', d => y(d.y))
                  .attr('height', d => innerHeight - y(d.y))
            })
        }

        /**
         * 在brush extent的选框没有消失之前, 这些选择都是可以随着brush选框的调节进行变换的
         */
        chart.pre_highlight_bar = function(value){
          if (!arguments.length) return pre_highlight_bar
          if (typeof(value) != "function") {
            console.warn("invalid value for brush_trigger", value)
            return
          }
          pre_highlight_bar = value
          return chart
        }
        // function prehighlightBar(barId, svg) {
        //   svg.select('#' + barId).classed('pre-click-highlight', true)
        //   svg.select('#' + barId).classed('unchanged-pre-click-highlight', true)
        //   if(!svg.select('#' + barId).classed('click-highlight')){
        //     svg.select('#' + barId).classed('click-unhighlight', true)
        //   }
        // }
        /**
         * 点击click或者brush选择bar
         * @param barId - bar的id
         */
        chart.highlight_bar = function(value){
          if (!arguments.length) return highlight_bar
          if (typeof(value) != "function") {
            console.warn("invalid value for brush_trigger", value)
            return
          }
          highlight_bar = value
          return chart
        }
        // function highlightBar(barId, svg){
        //   svg.select('#' + barId).classed('click-unhighlight', false)
        //   svg.select('#' + barId).classed('click-highlight', true)
        // }
        /**
         * 点击click取消选择bar
         */
        chart.un_highlight_bar = function(value){
          if (!arguments.length) return un_highlight_bar
          if (typeof(value) != "function") {
            console.warn("invalid value for brush_trigger", value)
            return
          }
          un_highlight_bar = value
          return chart
        }
        // function unhighlightBar(barId, svg){
        //   svg.select('#' + barId).classed('click-highlight', false)
        //   svg.select('#' + barId).classed('pre-click-highlight', false)
        //   svg.select('#' + barId).classed('unchanged-pre-click-highlight', true)
        //   svg.select('#' + barId).classed('click-unhighlight', true)
        //   svg.select('#' + barId).style('fill', null)
        // }

        function clearAllBar(svg){
          svg.select('.extent').attr('x', 0).attr('y', 0).attr('width', 0)
          d3.select(svg).selectAll('.library-bar').each(function(d,i){
            var barId = d3.select(this).attr('id')
            unhighlightBar(barId, svg)
          })
        }

        function selectAllItems(svg){
          d3.select(svg).selectAll('.library-bar.pre-click-highlight')
            .each(function (d, i) {
              d3.select(this)
                .classed('.pre-click-highlight', false)
                .classed('click-highlight', true)
            })
        }

        chart.width = function(value) {
            if (!arguments.length) return width
            if (typeof(value) != 'number') {
                console.warn('invalid value for width', value)
                return
            }
            console.log('width settting', value)
            width = value
            return chart
        }

        chart.height = function(value) {
            if (!arguments.length) return height
            if (typeof(value) != 'number') {
                console.warn('invalid value for height', value)
                return
            }
            console.log('height settting', value)
            height = value
            return chart
        }

        chart.margin = function(value) {
            if (!arguments.length) return margin
            if (typeof(value) != 'object') {
                console.warn('invalid value for margin', value)
                return
            }
            if (typeof(value.top) == 'number')
                margin.top = value.top
            if (typeof(value.right) == 'number')
                margin.right = value.right
            if (typeof(value.bottom) == 'number')
                margin.bottom = value.bottom
            if (typeof(value.left) == 'number')
                margin.left = value.left
            return chart
        }

        chart.duration = function(value) {
            if (!arguments.length) return duration
            if (typeof(value) != 'number') {
                console.warn('invalid value for duration', value)
                return
            }
            duration = value
            return chart
        }

        chart.draw_xAxis = function(value) {
            if (!arguments.length) return draw_xAxis
            if (typeof(value) != 'boolean') {
                console.warn('invalid value for draw_xAxis', value)
                return
            }
            draw_xAxis = value
            return chart
        }

        chart.draw_yAxis = function(value) {
            if (!arguments.length) return draw_yAxis
            if (typeof(value) != 'boolean') {
                console.warn('invalid value for draw_yAxis', value)
                return
            }
            draw_yAxis = value
            return chart
        }

        chart.yTickNum = function(value) {
            if (!arguments.length) return yTickNum
            if (typeof(value) != 'number') {
                console.warn('invalid value for yTickNum', value)
                return
            }
            yTickNum = value
            return chart
        }

        chart.xTickNum = function(value) {
            if (!arguments.length) return xTickNum
            if (typeof(value) != 'number') {
                console.warn('invalid value for xTickNum', value)
                return
            }
            xTickNum = value
            return chart
        }

        chart.xLabel = function(value) {
            if (!arguments.length) return xLabel
            if (typeof(value) != 'string') {
                console.warn('invalid value for xLabel', value)
                return
            }
            xLabel = value
            return chart
        }

        chart.yLabel = function(value) {
            if (!arguments.length) return yLabel
            if (typeof(value) != 'string') {
                console.warn('invalid value for yLabel', value)
                return
            }
            yLabel = value
            return chart
        }

        chart.brush_trigger = function(value) {
            if (!arguments.length) return brush_trigger
            if (typeof(value) != "function") {
                console.warn("invalid value for brush_trigger", value)
                return
            }
            brush_trigger = value
            return chart
        }

        chart.brushmove_trigger = function(value) {
          if (!arguments.length) return brushmove_trigger
          if (typeof(value) != "function") {
            console.warn("invalid value for brush_trigger", value)
            return
          }
          brushmove_trigger = value
          return chart
        }

        chart.hovering_trigger = function(value){
          if (!arguments.length) return brushmove_trigger
          if (typeof(value) != "function") {
            console.warn("invalid value for brush_trigger", value)
            return
          }
          hovering_trigger = value
          return chart
        }

        chart.unhovering_trigger = function(value){
          if (!arguments.length) return brushmove_trigger
          if (typeof(value) != "function") {
            console.warn("invalid value for brush_trigger", value)
            return
          }
          unhovering_trigger = value
          return chart
        }

        chart.enable_brush = function(value) {
            if (!arguments.length) return enable_brush
            if (typeof(value) != 'boolean') {
                console.warn('invalid value for enable_brush', value)
                return
            }
            enable_brush = value
            return chart
        }

        chart.color = function(value) {
            if (!arguments.length) return color
            if (typeof(value) != 'string') {
                console.warn('invalid value for color', value)
                return
            }
            color = value
            return chart
        }

        chart.bar_interval = function(value) {
            if (!arguments.length) return bar_interval
            if (typeof(value) != 'number') {
                console.warn('invalid value for bar_interval', value)
                return
            }
            bar_interval = value
            return chart
        }

        chart.x_ticks_value = function(value){
            if (!arguments.length) return x_ticks_value
            if(typeof(value) !== 'object'){
                console.log('invalid value for ticks_value', value)
                return
            }
            x_ticks_value = value
            return chart
        }

        chart.x_ticks_format = function(value){
            if(!arguments.length){return x_ticks_format}
            if(typeof(value) !== 'object'){
                console.log('invalid value for ticks_format', value)
                return
            }
            x_ticks_format = value
            return chart
        }

        chart.y_ticks_value = function(value){
            if (!arguments.length) return y_ticks_value
            if(typeof(value) !== 'object'){
                console.log('invalid value for ticks_value', value)
                return
            }
            y_ticks_value = value
            return chart
        }

        chart.x_interval = function(value){
          if(!arguments.length){return x_interval}
          if(typeof(value) !== 'number'){
            console.log('invalid value for ticks_format', value)
            return
          }
          x_interval = value
          return chart
        }

      chart.distributionLevel = function(value){
        if(!arguments.length){return distribution_level}
        if(typeof(value) !== 'string'){
          console.log('invalid value for ticks_format', value)
          return
        }
        distribution_level = value
        return chart
      }

        chart.y_ticks_format = function(value){
            if(!arguments.length){return y_ticks_format}
            if(typeof(value) !== 'object'){
                console.log('invalid value for ticks_format', value)
                return
            }
            y_ticks_format = value
            return chart
        }

        chart.bar_class = function(value){
          if(!arguments.length){
            return bar_class
          }
          if(typeof(value) !== 'string'){
            console.log('invalid value for ticks_format', value)
            return
          }
          bar_class = value
          return chart
        }

        //  点击事件
        chart.bar_click_handler = function(value){
          if(!arguments.length){
            return bar_click_handler
          }
          if(typeof(value) !== 'function'){
            console.log('invalid value for ticks_format', value)
            return
          }
          bar_click_handler = value
          return chart
        }

        //  取消选中的点击事件
        chart.bar_unclick_handler = function(value){
          if(!arguments.length){
            return bar_unclick_handler
          }
          if(typeof(value) !== 'function'){
            console.log('invalid value for ticks_format', value)
            return
          }
          bar_unclick_handler = value
          return chart
        }

        chart.clear_all = function(svg){
          clearAllBar(svg)
        }

        chart.select_all_items = function(histogramDataArray){
          selectAllItems(histogramDataArray)
        }
        return chart
    }
})()
