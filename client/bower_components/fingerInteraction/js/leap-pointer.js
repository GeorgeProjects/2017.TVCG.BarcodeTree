/* Leap Pointer - use Leap Motion controller to simulate mouse on a web page
 *
 * Copyright (C) 2013-2014 Good Code
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Requires jQuery and Leap.js (js.leapmotion.com).
 *
 * To use, add these two tags to the end of your page HEAD or BODY:
 *     <script src="//js.leapmotion.com/leap-0.4.1.js"></script>)
 *     <script src="leap-pointer.js"></script>
 *
 * and then just activate the plugin:
 *
 *     $(function() {
 *         $.leapPointer()
 *     });
 */
(function($) {
    $.leapPointer = function() {
        if (window.Leap === undefined) return;

        var $cursor = $('<div>').css({
            display: 'block',
            background: '#000',
            borderRadius: '5px',
            width: '10px',
            height: '10px',
            position: 'absolute',
            zIndex: 255,
        }).appendTo($('body'));

        function leapToScene(frame) {
            var tip = frame.pointables[0].tipPosition;
            var ibox = frame.interactionBox;
            var npos = ibox.normalizePoint(tip);
            var w = $(window).width();
            var h = $(window).height();

            var x = w * npos[0];
            var y = h * (1 - npos[1]);

            if ( (x < 0)||(x > w) || (y < 0)||(y > h) )
                return null;

            return [w * npos[0], h * (1 - npos[1])];
        }

        function triggerEvent(name) {
            var ev = $.Event(name);
            ev.pageX = (pos === null) ? 0 : pos[0];
            ev.pageY = (pos === null) ? 0 : pos[1];
            $cursor.hide();
            var el = document.elementFromPoint(ev.pageX, ev.pageY);
            $cursor.show();
            $(el).trigger(ev);
        }

        function now() {
            return +(new Date()) / 1000;
        }

        var pen_down = false;
        var pos = null;
        var pen_down_time = null;

        $(window).bind('keydown', function(ev) {
            pen_down = true;
            pen_down_time = now();
            triggerEvent('mousedown');
        });
        $(window).bind('keyup', function(ev) {
            pen_down = false;
            triggerEvent('mouseup');
            if ((now() - pen_down_time) < 0.5)
                triggerEvent('click');
        });

        var controller = new Leap.Controller({
            frameEventName: 'animationFrame'
        });
        controller.on('deviceDisconnected', function() {
            $cursor.hide();
        });

        controller.on('frame', function(frame) {
            if (frame.pointables.length != 1) return;

            var new_pos = leapToScene(frame);
            if (new_pos === null)
                return;
            pos = new_pos;

            triggerEvent('mousemove');
            $cursor.css({
                top: (pos[1] - 5) + 'px',
                left: (pos[0] - 5) + 'px',
                opacity: 0.5
            });
        });

        $('body').focus();
        controller.connect();
    };
})(jQuery);