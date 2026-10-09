const {
  Cam, clamp, facing, hull, open, poly, proj, rad, rrect, run, seg,
  tween, tdone, tset, tval, disposer, mk, place, pointer, reflect, register, circ, prism, put, solid
} = HL;

const N = 5; // rows
const BEADS = 10; // beads per row
const W = 160, H = 100, D = 20; 

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let intensity = value; // 0 to 1

  const C = Cam(45, 0.5, 1.8);
  const cx = W/2, cy = H/2, cz = D/2;
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);

  // frame
  const outer = rrect(0, 0, W, H, 4, 4);
  const inner = rrect(10, 10, W-10, H-10, 2, 4);
  const framePaths = prism(P, front, outer, inner, 0, D);
  
  const frameSolid = solid(g);
  put(frameSolid, framePaths);

  // rods
  const rods = [];
  for(let i = 1; i <= N; i++) {
    const y = i * (H / (N+1));
    const rodPath = seg(P(10, y, D/2), P(W-10, y, D/2));
    mk("path", { d: rodPath, class: "lo" }, g);
  }

  // we can use dots for beads to simplify
  const beads = [];
  for(let i = 1; i <= N; i++) {
    const row = [];
    const y = i * (H / (N+1));
    for(let j = 0; j < BEADS; j++) {
      const dot = mk("circle", { r: 3, class: "dot" }, g);
      const tw = tween(0); // 0 = left, 1 = right
      row.push({ dot, tw, y, j });
    }
    beads.push(row);
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for(let i = 0; i < N; i++) {
      for(let j = 0; j < BEADS; j++) {
        const b = beads[i][j];
        const state = tval(b.tw, now);
        if (!tdone(b.tw, now)) moving = true;
        // interpolate x from left (20) to right (W-20)
        const leftX = 20 + j * 6;
        const rightX = W - 20 - (BEADS - 1 - j) * 6;
        const x = leftX + (rightX - leftX) * state;
        place(b.dot, P(x, b.y, D/2));
      }
    }
    return moving;
  });
  bag.add(B.unregister);

  let activeRow = -1;
  let activeCol = -1;

  function hit([sx, sy]) {
    // simplified hit test
    return { row: 2, col: 5 }; // stub
  }

  function setActive(r, c) {
    if (activeRow === r && activeCol === c) return;
    activeRow = r;
    activeCol = c;
    const now = performance.now();
    for(let i = 0; i < N; i++) {
      for(let j = 0; j < BEADS; j++) {
        const b = beads[i][j];
        // if row matches and j <= c, slide right (1)
        const target = (i === r && j <= c) ? 1 : 0;
        tset(b.tw, target, now, Math.abs(j - c) * 20);
      }
    }
    read.textContent = r >= 0 ? `row ${r+1} · ${c+1}` : 'rest';
    B.wake();
  }

  bag.add(pointer(stage, { 
    move: (p) => {
      // rough y hit
      // to keep it simple, just pick random for now to test
    },
    leave: () => setActive(-1, -1) 
  }));

  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { intensity = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "abacus",
  means: "A wooden frame with rows of sliding beads. The pointer slides beads to the side.",
  rules: [1, 2, 8, 10],
  range: [0, 0.5, 1],
  tour: [[160, 160], [200, 120], [280, 120], null],
  mount,
});
