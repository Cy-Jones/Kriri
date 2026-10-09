import { HL } from '../../lib/hairline/kernel.js';
import { makeFigure } from './HairlineWrapper';

function mountAbacus({ stage, svg, read }, intensity) {
    var S = HL.State();
    var cam = HL.Cam({ x: 200, y: 160, z: 80 }, { x: -0.8, y: -0.4, z: 0.1 });
    var g = HL.Group(svg);

    // Beads structure
    var r1 = { y: -30, pos: [{x: -40, v: 0}, {x: -20, v: 0}, {x: 0, v: 0}, {x: 20, v: 1}, {x: 40, v: 1}] };
    var r2 = { y: 0, pos: [{x: -40, v: 0}, {x: -20, v: 1}, {x: 0, v: 1}, {x: 20, v: 1}, {x: 40, v: 1}] };
    var r3 = { y: 30, pos: [{x: -40, v: 1}, {x: -20, v: 1}, {x: 0, v: 1}, {x: 20, v: 1}, {x: 40, v: 1}] };
    var rows = [r1, r2, r3];

    // Frame
    var frame = HL.path(g);

    var beads = [];
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        for (var j = 0; j < row.pos.length; j++) {
            var b = row.pos[j];
            var bp = HL.path(g);
            beads.push({ r: row.y, x: b.x, v: b.v, p: bp });
        }
    }

    function draw() {
        frame.setAttribute('d',
            HL.rrect(cam.proj({ x: -60, y: -60, z: 0 }), cam.proj({ x: 60, y: 60, z: 0 }), 5) + ' ' +
            HL.line(cam.proj({ x: -50, y: -30, z: 0 }), cam.proj({ x: 50, y: -30, z: 0 })) + ' ' +
            HL.line(cam.proj({ x: -50, y: 0, z: 0 }), cam.proj({ x: 50, y: 0, z: 0 })) + ' ' +
            HL.line(cam.proj({ x: -50, y: 30, z: 0 }), cam.proj({ x: 50, y: 30, z: 0 }))
        );

        for (var i = 0; i < beads.length; i++) {
            var b = beads[i];
            var z = b.v * 20 - 10; 
            var p1 = cam.proj({ x: b.x - 5, y: b.r - 10, z: z });
            var p2 = cam.proj({ x: b.x + 5, y: b.r + 10, z: z });
            b.p.setAttribute('d', HL.rrect(p1, p2, 4));
        }
    }
    
    function hit(x, y) {
        var pt = { x: x, y: y };
        var minDist = 40;
        var hitBead = null;
        for (var i = 0; i < beads.length; i++) {
            var b = beads[i];
            var z = b.v * 20 - 10;
            var cp = cam.proj({ x: b.x, y: b.r, z: z });
            var d = Math.sqrt((pt.x - cp.x)*(pt.x - cp.x) + (pt.y - cp.y)*(pt.y - cp.y));
            if (d < minDist) {
                minDist = d;
                hitBead = b;
            }
        }
        return hitBead;
    }
    
    function answer() {
        var total = 0;
        for (var i = 0; i < beads.length; i++) {
            if (beads[i].v > 0.5) total++;
        }
        read.textContent = total + " items counted";
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

export const Abacus = makeFigure('abacus', mountAbacus);
