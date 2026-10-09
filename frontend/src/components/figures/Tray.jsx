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

const N = 3,
  W = 70,
  H = 100,
  TK = 2;
const X0 = -10,
  X1 = W + 10,
  Y0 = -10,
  Y1 = H + 10,
  WH = 15,
  WR = 6,
  WT = 2.4;

function tray(P, front, outer, inner) {
  const far = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
    [poly(ringAt(P, inner, WH)), "nf"],
    [
      open(
        ringAt(
          P,
          run(inner, (q) => !front(q)),
          2.5,
        ),
      ),
      "nf lo",
    ],
  ];
  const iF = ringAt(P, run(inner, front), WH),
    oT = ringAt(P, run(outer, front), WH),
    oB = ringAt(P, run(outer, front), 0);
  const near = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
    [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
  ];
  return { far, near };
}

function paperShape() {
  return rrect(0, 0, W, H, 2, 4);
}

function pose(P, i, shape, lift) {
  const z = i * 3 + lift;
  const back = poly(shape.map((p) => P(p.u, p.v, z - 1)));
  const face = poly(shape.map((p) => P(p.u, p.v, z)));

  const lines = [10, 20, 30]
    .map((ly) => seg(P(10, ly, z), P(W - 10, ly, z)))
    .join("");
  return { back, face, lines };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.8);
  fit(
    C,
    [
      [X0, Y0, 0],
      [X1, Y1, 0],
      [X0, Y1, WH],
      [X1, Y0, WH + 20],
    ],
    200,
    166,
  );
  const P = proj(C),
    front = facing(C);

  const outer = rrect(X0, Y0, X1, Y1, WR, 6),
    inner = rrect(
      X0 + WT,
      Y0 + WT,
      X1 - WT,
      Y1 - WT,
      Math.max(0.3, WR - WT),
      6,
    );
  const paths = tray(P, front, outer, inner);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, outer, 0, 14);
  for (const [d, cls] of paths.far) mk("path", { d, class: cls }, g);

  const papers = [];
  const pShape = paperShape();
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g);
    const back = mk("path", { class: "lo" }, grp),
      face = mk("path", { class: "sil" }, grp);
    const lines = mk("path", { class: "nf lo" }, grp);
    papers.push({ back, face, lines, z: tween(0) });
  }

  for (const [d, cls] of paths.near) mk("path", { d, class: cls }, g);

  const cx = W / 2,
    cy = H / 2;
  const pC = P(cx, cy, 0);

  function hit([x, y]) {
    const dx = x - pC[0],
      dy = y - pC[1];
    if (dx * dx + dy * dy < 2000) return N - 1;
    return -1;
  }

  function draw(i, lift) {
    const p = papers[i],
      q = pose(P, i, pShape, lift);
    p.back.setAttribute("d", q.back);
    p.face.setAttribute("d", q.face);
    p.lines.setAttribute("d", q.lines);
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    papers.forEach((p, i) => {
      draw(i, tval(p.z, now));
      if (!tdone(p.z, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister);

  let act = -1;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now();
    act = a;
    papers.forEach((p, i) => {
      const lift = i === a ? 20 : 0;
      tset(p.z, lift, now, 0);
      p.face.classList.toggle("hi", i === a);
      p.lines.classList.toggle("hi", i === a);
    });
    if (read) read.textContent = a < 0 ? "rest" : "Message subject";
    B.wake();
  }

  bag.add(
    pointer(stage, {
      move: (p) => setActive(hit(p)),
      leave: () => setActive(-1),
    }),
  );
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => {
      stag = v;
    },
    destroy: bag.dispose,
  };
}

export const Tray = makeFigure("tray", mount);
