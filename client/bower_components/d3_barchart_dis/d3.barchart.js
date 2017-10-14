//version 2017.3.29 14:00
//dependency:
//d3.js version 4.7.4

(function() {
    d3.barchart = function() {
        let width = 400,
            height = 100,
            margin = {
                top: 10,
                right: 10,
                bottom: 20,
                left: 30
            },
            duration = 500,
            draw_xAxis = true,
            draw_yAxis = true,
            yTickNum = null,
            xTickNum = null,
            xLabel = '',
            yLabel = '',
            enable_brush = true,
            color = '#808080',
            bar_interval = 0

        let brush_trigger = function(d3_event, brushed_bar_sel) {}

        let _font_style = '10px sans-serif'

        //判断区间[x1,x2]与[bound1,bound2]的交集长度是否超过[x1,x2]长度的一半
        let _overhalf = function(x1, x2, bound1, bound2) {
            let len_x = x2 - x1
            let len_bound = bound2 - bound1

            if (bound1 <= x1 && x2 <= bound2) 
                return true
            if (bound1 <= x1 && x1 <= bound2) {
                let ceil = Math.min(bound2, x2)
                let intersection = ceil - x1
                return intersection >= len_x / 2
            }
            if (bound1 <= x2 && x2 <= bound2) {
                let floor = Math.max(bound1, x1)
                let intersection = x2 - floor
                return intersection > len_x / 2
            }
            return false
        }

        function chart(selection) {
            selection.each(function(dataset) {
                let innerWidth = width - margin.left - margin.right
                let innerHeight = height - margin.top - margin.bottom

                let x = d3.scaleLinear()
                    .domain([0, d3.max(dataset, d => d.x2)])
                    .range([0, innerWidth])

                let y = d3.scaleLinear()
                    .domain([0, d3.max(dataset, d => d.y)])
                    .range([innerHeight, 0])

                let svg = d3.select(this)
                    .attr('width', width)
                    .attr('height', height)

                let g = svg.selectAll('.container')
                    .data([null])
                    .enter().append('g')
                    .attr('class', 'container')
                svg.selectAll('.container').transition()
                    .duration(duration)
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                g = svg.selectAll('.container')

                if (draw_xAxis) {
                    let xAxis = d3.axisBottom(x)
                    if (xTickNum !== null)
                        xAxis.ticks(xTickNum)

                    let xAxis_g_update = g.selectAll('.x.axis')
                        .data([null])
                    let xAxis_g_enter = xAxis_g_update.enter()
                        .append('g')
                        .attr('class', 'x axis')
                    g.selectAll('.x.axis').transition()
                        .duration(duration)
                        .attr('transform', 'translate(0,' + innerHeight + ')')
                        .call(xAxis)

                    xAxis_g_enter.selectAll('.x.label')
                        .data([null])
                        .enter()
                        .append('text')
                        .attr('class', 'x label')
                        .attr('dy', '1.5em')
                        .attr('dx', '2.5em')
                        .attr('x', innerWidth)
                        .attr('fill', 'black')
                        .text(xLabel)

                    xAxis_g_enter.selectAll('text')
                        .style('font', _font_style)
                }

                if (draw_yAxis) {
                    let yAxis = d3.axisLeft(y)
                    if (yTickNum !== null)
                        yAxis.ticks(yTickNum)

                    let yAxis_g_update = g.selectAll('.y.axis')
                        .data([null])
                    let yAxis_g_enter = yAxis_g_update.enter()
                        .append('g')
                        .attr('class', 'y axis')
                    g.selectAll('.y.axis').transition()
                        .duration(duration)
                        .call(yAxis)

                    yAxis_g_enter.selectAll('.y.label')
                        .data([null])
                        .enter()
                        .append('text')
                        .attr('class', 'y label')
                        .attr('transform', 'rotate(-90)')
                        .attr('dy', '-3.5em')
                        .attr('fill', 'black')
                        .text(yLabel)

                    yAxis_g_enter.selectAll('text')
                        .style('font', _font_style)
                }

                let bars = g.selectAll('.bar')
                    .data(dataset)
                bars.enter().append('rect')
                    .attr('class', 'bar')
                bars.exit().remove()
                g.selectAll('.bar').transition()
                    .duration(duration)
                    .attr('x', d => x(d.x1))
                    .attr('width', d => x(d.x2 - d.x1) - bar_interval)
                    .attr('y', d => y(d.y))
                    .attr('height', d => innerHeight - y(d.y))
                    .attr('fill', color)
                    .attr('opacity', 1)

                if (enable_brush) {
                    let brush = d3.brushX()
                        .extent([
                            [0, 0],
                            [innerWidth, innerHeight]
                        ])
                        .on('end', end)

                    let brush_g = g.append('g')
                        .attr('class', 'x brush')
                        .call(brush)

                    function end() {
                        if (d3.event.sourceEvent.type === 'end')
                            return

                        let extent = d3.event.selection
                        g.selectAll('.bar')
                            .classed('highlight', function(d) {
                                return extent == null ? false : _overhalf(x(d.x1), x(d.x2), extent[0], extent[1])
                            })

                        //根据被highlight的bar进行brush的位置校正
                        let brushed_bar_sel = g.selectAll('.bar.highlight')
                        if (brushed_bar_sel.size() != 0) {
                            let x_range = d3.extent(brushed_bar_sel.data().reduce(function(list, ele) {
                                list.push(ele.x1, ele.x2)
                                return list
                            }, []))
                            d3.select(this).call(d3.event.target.move, x_range.map(x))
                        }

                        brush_trigger(d3.event, brushed_bar_sel)
                    }
                }
            })
        }

        chart.width = function(value) {
            if (!arguments.length) return width
            if (typeof(value) != 'number') {
                console.warn('invalid value for width', value)
                return
            }
            width = value
            return chart
        }

        chart.height = function(value) {
            if (!arguments.length) return height
            if (typeof(value) != 'number') {
                console.warn('invalid value for height', value)
                return
            }
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

        return chart
    }
})()