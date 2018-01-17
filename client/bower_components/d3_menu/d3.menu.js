//version 2017.3.22 11:00
//Dependency:
//jquery-3.2.0
//bootstrap-3.3.7
//font-awesome-4.7.0
//d3.js 3.5.17

(function() {
    d3.menu = function() {
        //public
        let target = null, //用jquery选中的target
            icons = null,
            bind_event = 'mouseover',
            position = {
                horizontal: 'left_in', //'left_out','left_in','middle','right_in','right_out'
                vertical: 'top_in' //'top_out','top_in','middle','bottom_in','bottom_out'
            }

        //private
        let _key = Math.ceil(Math.random() * 1000000)

        let _width = function(ele) {
            let attr_width = +d3.select(ele).attr('width')
            let style_width = $(ele).width()
            return style_width == 0 ? attr_width : style_width
        }
        let _height = function(ele) {
            let attr_height = +d3.select(ele).attr('height')
            let style_height = $(ele).height()
            return style_height == 0 ? attr_height : style_height
        }

        //renderer
        function menu() {
            let mouseover = target.on(bind_event)
            target.on(bind_event, function(d, i) {
                let target_ele = this
                if (mouseover != undefined)
                    mouseover(d, i)
                let [left, top] = [$(target_ele).offset().left, $(target_ele).offset().top]

                d3.selectAll('.group' + _key)
                    .style('left', function() {
                        if (position.horizontal == 'left_out')
                            left -= _width(this)
                        else if (position.horizontal == 'left_in') {

                        } else if (position.horizontal == 'middle')
                            left += _width(target_ele) / 2 - _width(this) / 2
                        else if (position.horizontal == 'right_in')
                            left += _width(target_ele) - _width(this)
                        else if (position.horizontal == 'right_out')
                            left += _width(target_ele)
                        return left + 'px'
                    })
                    .style('top', function() {
                        if (position.vertical == 'top_out')
                            top -= _width(this)
                        else if (position.vertical == 'top_in') {

                        } else if (position.vertical == 'middle')
                            top += _width(target_ele) / 2 - _width(this) / 2
                        else if (position.vertical == 'bottom_in')
                            top += _width(target_ele) - _width(this)
                        else if (position.vertical == 'bottom_out')
                            top += _width(target_ele)
                        return top + 'px'
                    })
                d3.selectAll('.entry.group' + _key).style('display', 'inline')
            })

            let mouseout = target.on('mouseout')
            target.on('mouseout', function(d, i) {
                if (mouseover != undefined)
                    mouseout(d, i)
                d3.selectAll('.entry.group' + _key).style('display', 'none')
            })

            d3.select('body').append('div')
                .attr('class', 'd3_menu_bar entry ' + 'group' + _key)
                .on('mouseover', function() {
                    d3.select(this).style('display', 'none')
                    d3.selectAll('.list.group' + _key).style('display', 'inline')
                })
                .append('i')
                .attr('class', 'fa fa-fw fa-th-list')
                .attr('title', 'entry')

            d3.select('body').append('div')
                .attr('class', 'd3_menu_bar list ' + 'group' + _key)
                .on('mouseover', function() {
                    d3.select(this).style('display', 'inline')
                })
                .on('mouseout', function() {
                    d3.select(this).style('display', 'none')
                })
                .selectAll('.fa')
                .data(icons)
                .enter()
                .append('div')
                .attr('id', d => d.id)
                .attr('class', d => 'fa fa-fw menu-label ' + d.icon + ' ' + d.activeClass)
                .attr('title', d => d.title)
                .on('click', d => d.click())
                .text(d => d.text)
            return menu
        }

        //setter & getter
        menu.target = function(value) {
            if (!arguments.length) return target
            if (typeof(value) != 'object') {
                console.warn('invalid value for target', value)
                return
            }
            target = value
            return menu
        }
        menu.icons = function(value) {
            if (!arguments.length) return icons
            if (typeof(value) != 'object') {
                console.warn('invalid value for icons', value)
                return
            }
            icons = value
            return menu
        }
        menu.bind_event = function(value) {
            if (!arguments.length) return bind_event
            if (typeof(value) != 'string') {
                console.warn('invalid value for bind_event', value)
                return
            }
            bind_event = value
            return menu
        }
        menu.position = function(value) {
            if (!arguments.length) return position
            if (typeof(value) != 'object') {
                console.warn('invalid value for position', value)
                return;
            }
            if (typeof(value.horizontal) == 'string')
                position.horizontal = value.horizontal
            if (typeof(value.vertical) == 'string')
                position.vertical = value.vertical
            return menu;
        };
        return menu
    }
})()