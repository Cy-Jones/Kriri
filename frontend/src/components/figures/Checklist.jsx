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
} = HL;

function mountChecklist({ stage, svg, read }, intensity) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.8);
  const P = proj(C);

  const g = mk("g", {}, svg);

  const items = [];
  const N = 3;
  for (let i = 0; i < N; i++) {
    const y = (i - 1) * 30;
    const line = mk("path", { class: "lo" }, g);
    const check = mk("path", { class: "hi" }, g);
    const tw = tween(0);
    items.push({ y, line, check, tw });
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (let i = 0; i < N; i++) {
      const item = items[i];
      const state = tval(item.tw, now);
      if (!tdone(item.tw, now)) moving = true;

      item.line.setAttribute("d", seg(P(-20, item.y, 0), P(40, item.y, 0)));

      if (state > 0.1) {
        // simple checkmark
        item.check.setAttribute(
          "d",
          seg(P(-30, item.y, 0), P(-25, item.y + 5, 0)) +
            " " +
            seg(
              P(-25, item.y + 5, 0),
              P(-15, item.y - 10, Math.max(0, state * 10)),
            ),
        );
      } else {
        item.check.setAttribute("d", "");
      }
    }
    return moving;
  });
  bag.add(B.unregister);

  let active = -1;
  function setActive(idx) {
    if (active === idx) return;
    active = idx;
    const now = performance.now();
    let done = 0;
    for (let i = 0; i < N; i++) {
      const target = i <= active ? 1 : 0;
      if (target === 1) done++;
      tset(items[i].tw, target, now, Math.abs(i - active) * 50);
    }
    read.textContent = done + " tasks done";
    B.wake();
  }

  bag.add(
    pointer(stage, {
      move: ([sx, sy]) => {
        // mock hit
        let idx = -1;
        if (sy < 140) idx = 0;
        else if (sy < 180) idx = 1;
        else idx = 2;
        setActive(idx);
      },
      leave: () => setActive(-1),
    }),
  );

  bag.add(() => svg.replaceChildren());

  return {
    destroy: bag.dispose,
  };
}

export const Checklist = makeFigure("checklist", mountChecklist);
