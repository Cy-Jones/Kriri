import { HL } from "../../lib/hairline/kernel.js";
import { makeFigure } from "./HairlineWrapper";

function mountChart({ stage, svg, read }, intensity) {
  var S = HL.State();
  var cam = HL.Cam({ x: 200, y: 160, z: 80 }, { x: -0.8, y: -0.4, z: 0.1 });
  var g = HL.Group(svg);

  var bars = [
    { x: -30, h: 20, v: 20, p: HL.path(g) },
    { x: -10, h: 40, v: 40, p: HL.path(g) },
    { x: 10, h: 10, v: 10, p: HL.path(g) },
    { x: 30, h: 60, v: 60, p: HL.path(g) },
  ];

  var axis = HL.path(g);

  function draw() {
    axis.setAttribute(
      "d",
      HL.line(
        cam.proj({ x: -45, y: -20, z: 0 }),
        cam.proj({ x: 45, y: -20, z: 0 }),
      ) +
        " " +
        HL.line(
          cam.proj({ x: -45, y: -20, z: 0 }),
          cam.proj({ x: -45, y: 80, z: 0 }),
        ),
    );

    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      var p1 = cam.proj({ x: b.x - 5, y: -20, z: 0 });
      var p2 = cam.proj({ x: b.x + 5, y: -20 + b.v, z: 0 });
      b.p.setAttribute("d", HL.rrect(p1, p2, 0));
    }
  }

  function hit(x, y) {
    var pt = { x: x, y: y };
    var minDist = 30;
    var hitBar = null;
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      var cp = cam.proj({ x: b.x, y: -20 + b.v / 2, z: 0 });
      var d = Math.sqrt(
        (pt.x - cp.x) * (pt.x - cp.x) + (pt.y - cp.y) * (pt.y - cp.y),
      );
      if (d < minDist) {
        minDist = d;
        hitBar = b;
      }
    }
    return hitBar;
  }

  function answer() {
    read.textContent = "Data point selected";
  }

  var ptr = HL.pointer(svg, S, function (p) {
    if (!p) return;
    var h = hit(p.x, p.y);
    if (h) {
      HL.tween(S, h, { v: h.v === h.h ? 0 : h.h }, 200, draw, answer);
    }
  });

  draw();
  answer();

  var unreg = HL.register(S, draw);

  return {
    destroy: function () {
      ptr();
      unreg();
      g.remove();
    },
  };
}

export const Chart = makeFigure("chart", mountChart);
