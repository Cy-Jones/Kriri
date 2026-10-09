import { HL } from '../../lib/hairline/kernel.js';
import { makeFigure } from './HairlineWrapper';

function mountChecklist({ stage, svg, read }, intensity) {
    var S = HL.State();
    var cam = HL.Cam({ x: 200, y: 160, z: 80 }, { x: -0.6, y: -0.5, z: 0.1 });
    var g = HL.Group(svg);

    // List items
    var items = [
        { y: -30, v: 0, p1: HL.path(g), p2: HL.path(g) },
        { y: 0, v: 1, p1: HL.path(g), p2: HL.path(g) },
        { y: 30, v: 0, p1: HL.path(g), p2: HL.path(g) }
    ];

    function draw() {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            
            // Checkbox box
            var boxP1 = cam.proj({ x: -40, y: item.y - 10, z: 0 });
            var boxP2 = cam.proj({ x: -20, y: item.y + 10, z: 0 });
            item.p1.setAttribute('d', HL.rrect(boxP1, boxP2, 3));
            
            // Checkmark (if checked)
            if (item.v > 0.5) {
                var checkPt1 = cam.proj({ x: -35, y: item.y, z: 2 });
                var checkPt2 = cam.proj({ x: -30, y: item.y + 5, z: 2 });
                var checkPt3 = cam.proj({ x: -20, y: item.y - 10, z: 2 });
                item.p2.setAttribute('d', HL.line(checkPt1, checkPt2) + ' ' + HL.line(checkPt2, checkPt3));
                item.p2.setAttribute('stroke-width', '2');
            } else {
                item.p2.setAttribute('d', '');
            }
        }
    }

    function hit(x, y) {
        var pt = { x: x, y: y };
        var minDist = 40;
        var hitItem = null;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var cp = cam.proj({ x: -30, y: item.y, z: 0 });
            var d = Math.sqrt((pt.x - cp.x)*(pt.x - cp.x) + (pt.y - cp.y)*(pt.y - cp.y));
            if (d < minDist) {
                minDist = d;
                hitItem = item;
            }
        }
        return hitItem;
    }
    
    function answer() {
        var total = 0;
        for (var i = 0; i < items.length; i++) {
            if (items[i].v > 0.5) total++;
        }
        read.textContent = total + "/" + items.length + " done";
    }

    var ptr = HL.pointer(svg, S, function (p) {
        if (!p) return;
        var h = hit(p.x, p.y);
        if (h) {
            HL.tween(S, h, { v: h.v < 0.5 ? 1 : 0 }, 150, draw, answer);
        }
    });

    draw();
    answer();
    
    var unreg = HL.register(S, draw);

    return {
        destroy: function() {
            ptr();
            unreg();
            g.remove();
        }
    };
}

export const Checklist = makeFigure('checklist', mountChecklist);
