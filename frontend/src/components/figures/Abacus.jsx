import { HL } from "../../lib/hairline/kernel.js";
import { makeFigure } from "./HairlineWrapper";

const {
  Cam,
  proj,
  tween,
  tdone,
  tset,
  tval,
  disposer,
  mk,
  place,
  pointer,
  register,
  seg,
  circ,
} = HL;

function mountAbacus({ stage, svg, read }, intensity) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.8);
  const P = proj(C);

  const g = mk("g", {}, svg);

  const N = 3;
  const BEADS = 5;
  const beads = [];

  for (let i = 0; i < N; i++) {
    const row = [];
    const y = (i - 1) * 30;
    mk("path", { class: "lo", d: seg(P(-40, y, 0), P(40, y, 0)) }, g);
    for (let j = 0; j < BEADS; j++) {
      const dot = mk("circle", { r: 4, class: "dot" }, g);
      const tw = tween(0);
      row.push({ dot, tw, y, j });
    }
    beads.push(row);
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < BEADS; j++) {
        const b = beads[i][j];
        const state = tval(b.tw, now);
        if (!tdone(b.tw, now)) moving = true;

        const leftX = -30 + j * 8;
        const rightX = 30 - (BEADS - 1 - j) * 8;
        const x = leftX + (rightX - leftX) * state;
        place(b.dot, P(x, b.y, 0));
      }
    }
    return moving;
  });
  bag.add(B.unregister);

  let activeRow = -1;
  let activeCol = -1;

  function setActive(r, c) {
    if (activeRow === r && activeCol === c) return;
    activeRow = r;
    activeCol = c;
    const now = performance.now();
    let count = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < BEADS; j++) {
        const target = i === r && j <= c ? 1 : 0;
        if (target === 1) count++;
        tset(beads[i][j].tw, target, now, Math.abs(j - c) * 20);
      }
    }
    read.textContent = count + " items";
    B.wake();
  }

  bag.add(
    pointer(stage, {
      move: ([sx, sy]) => {
        let r = -1;
        if (sy < 140) r = 0;
        else if (sy < 180) r = 1;
        else r = 2;
        let c = Math.floor(Math.max(0, Math.min(BEADS - 1, (sx - 120) / 30)));
        setActive(r, c);
      },
      leave: () => setActive(-1, -1),
    }),
  );

  bag.add(() => svg.replaceChildren());

  return {
    destroy: bag.dispose,
  };
}

export const Abacus = makeFigure("abacus", mountAbacus);
