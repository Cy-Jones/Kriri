import { HL } from "../../lib/hairline/kernel.js";
import { makeFigure } from "./HairlineWrapper";

const {
  Cam,
  clamp,
  facing,
  fillet,
  fit,
  hull,
  open,
  poly,
  proj,
  rad,
  ringAt,
  rrect,
  run,
  seg,
  tdone,
  tset,
  tval,
  tween,
  disposer,
  mk,
  place,
  pointer,
  reflect,
  register,
} = HL;

function hexagon(r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return pts;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.8);
  fit(
    C,
    [
      [-50, -50, 0],
      [50, 50, 0],
      [-50, 50, 20],
      [50, -50, 20],
    ],
    200,
    160,
  );
  const P = proj(C),
    front = facing(C);

  const g = mk("g", {}, svg);

  const boltBase = hexagon(25);
  const hole = hexagon(15);

  const hBase = mk("path", { class: "lo" }, g);
  const hTop = mk("path", { class: "sil" }, g);
  const hHole = mk("path", { class: "nf lo" }, g);
  const lines = [
    mk("path", { class: "nf" }, g),
    mk("path", { class: "nf" }, g),
    mk("path", { class: "nf" }, g),
  ];

  const cx = 0,
    cy = 0;
  const pC = P(cx, cy, 0);

  let angle = tween(0);

  function draw(ang) {
    const rotBase = boltBase.map((p) => {
      const x = p[0] * Math.cos(ang) - p[1] * Math.sin(ang);
      const y = p[0] * Math.sin(ang) + p[1] * Math.cos(ang);
      return [x, y];
    });
    const rotHole = hole.map((p) => {
      const x = p[0] * Math.cos(ang) - p[1] * Math.sin(ang);
      const y = p[0] * Math.sin(ang) + p[1] * Math.cos(ang);
      return [x, y];
    });

    const bBase = poly(rotBase.map((p) => P(p[0], p[1], 0)));
    const bTop = poly(rotBase.map((p) => P(p[0], p[1], 15)));
    const bHole = poly(rotHole.map((p) => P(p[0], p[1], 15)));

    hBase.setAttribute("d", bBase);
    hTop.setAttribute("d", bTop);
    hHole.setAttribute("d", bHole);

    lines[0].setAttribute(
      "d",
      seg(
        P(rotBase[0][0], rotBase[0][1], 0),
        P(rotBase[0][0], rotBase[0][1], 15),
      ),
    );
    lines[1].setAttribute(
      "d",
      seg(
        P(rotBase[1][0], rotBase[1][1], 0),
        P(rotBase[1][0], rotBase[1][1], 15),
      ),
    );
    lines[2].setAttribute(
      "d",
      seg(
        P(rotBase[2][0], rotBase[2][1], 0),
        P(rotBase[2][0], rotBase[2][1], 15),
      ),
    );
  }

  const B = register(stage, (_dt, now) => {
    draw(tval(angle, now));
    return !tdone(angle, now);
  });
  bag.add(B.unregister);

  let lastA = 0;
  function handleMove([x, y]) {
    const dx = x - pC[0],
      dy = y - pC[1];
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 100) {
      let a = Math.atan2(dy, dx);
      while (a - lastA > Math.PI) a -= Math.PI * 2;
      while (a - lastA < -Math.PI) a += Math.PI * 2;
      const now = performance.now();
      tset(angle, a, now, 0);
      lastA = a;
      hTop.classList.add("hi");
      if (read) read.textContent = "Fix in progress";
    } else {
      hTop.classList.remove("hi");
      if (read) read.textContent = "rest";
    }
    B.wake();
  }

  bag.add(
    pointer(stage, {
      move: handleMove,
      leave: () => {
        hTop.classList.remove("hi");
        if (read) read.textContent = "rest";
      },
    }),
  );
  bag.add(() => svg.replaceChildren());

  draw(0);

  return {
    set: (v) => {
      stag = v;
    },
    destroy: bag.dispose,
  };
}

export const Wrench = makeFigure("wrench", mount);
