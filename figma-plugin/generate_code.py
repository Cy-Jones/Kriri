import os

code_content = '''// Kriri Design System Specification Boards Generator (Boards 28–42)
// Complete end-to-end journey from Landing Page to the last page in the application

const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 520;

const C = {
  pitch: { r: 0, g: 0, b: 0 },
  deep: { r: 10/255, g: 10/255, b: 10/255 },
  surface: { r: 19/255, g: 20/255, b: 22/255 },
  surfaceElevated: { r: 30/255, g: 31/255, b: 33/255 },
  border: { r: 38/255, g: 39/255, b: 44/255 },
  borderSubtle: { r: 51/255, g: 53/255, b: 56/255 },
  borderLight: { r: 229/255, g: 231/255, b: 235/255 },
  textPrimary: { r: 1, g: 1, b: 1 },
  textBody: { r: 242/255, g: 242/255, b: 242/255 },
  textSecondary: { r: 209/255, g: 210/255, b: 213/255 },
  textMuted: { r: 138/255, g: 143/255, b: 152/255 },
  textFaint: { r: 95/255, g: 96/255, b: 102/255 },
  online: { r: 63/255, g: 185/255, b: 80/255 },
  warning: { r: 245/255, g: 166/255, b: 35/255 },
  info: { r: 0, g: 145/255, b: 1 },
  danger: { r: 229/255, g: 72/255, b: 77/255 },
  blue: { r: 5/255, g: 98/255, b: 239/255 },
  accent: { r: 119/255, g: 71/255, b: 255/255 }
};

function solidPaint(color: RGB, opacity = 1): SolidPaint {
  return { type: "SOLID", color, opacity };
}

async function ensureFonts() {
  for (const style of ["Regular", "Medium", "Semi Bold", "Bold"]) {
    try { await figma.loadFontAsync({ family: "Inter", style }); } catch {}
  }
}

function createText(
  chars: string,
  size = 13,
  weight: "Regular" | "Medium" | "Semi Bold" | "Bold" = "Regular",
  color: RGB = C.textBody
): TextNode {
  const t = figma.createText();
  t.fontName = { family: "Inter", style: weight };
  t.characters = chars;
  t.fontSize = size;
  t.fills = [solidPaint(color)];
  return t;
}

// Bulletproof layout helpers that never crash
function fillHorizontal(parent: FrameNode, child: SceneNode): void {
  parent.appendChild(child);
  try {
    (child as any).layoutSizingHorizontal = "FILL";
  } catch (e) {
    try {
      (child as any).layoutGrow = 1;
      (child as any).layoutAlign = "STRETCH";
    } catch (e2) {}
  }
}

function createSpacer(parent: FrameNode): FrameNode {
  const sp = figma.createFrame();
  sp.name = "Spacer";
  sp.fills = [];
  parent.appendChild(sp);
  try {
    (sp as any).layoutSizingHorizontal = "FILL";
  } catch (e) {
    (sp as any).layoutGrow = 1;
  }
  return sp;
}

function createBadge(label: string, tone: "neutral" | "success" | "warning" | "danger" | "info" = "neutral"): FrameNode {
  const b = figma.createFrame();
  b.layoutMode = "HORIZONTAL";
  b.counterAxisAlignItems = "CENTER";
  b.paddingLeft = 8; b.paddingRight = 8;
  b.paddingTop = 3; b.paddingBottom = 3;
  b.itemSpacing = 5;
  b.cornerRadius = 9999;

  let bg = { r: 38/255, g: 39/255, b: 44/255 };
  let tc = C.textSecondary;
  let dotC = C.textMuted;
  if (tone === "success") { bg = { r: 16/255, g: 40/255, b: 24/255 }; tc = { r: 63/255, g: 185/255, b: 80/255 }; dotC = tc; }
  else if (tone === "warning") { bg = { r: 48/255, g: 34/255, b: 12/255 }; tc = { r: 245/255, g: 166/255, b: 35/255 }; dotC = tc; }
  else if (tone === "danger") { bg = { r: 48/255, g: 16/255, b: 18/255 }; tc = { r: 229/255, g: 72/255, b: 77/255 }; dotC = tc; }
  else if (tone === "info") { bg = { r: 12/255, g: 32/255, b: 54/255 }; tc = { r: 0, g: 145/255, b: 1 }; dotC = tc; }

  b.fills = [solidPaint(bg)];
  const dot = figma.createEllipse();
  dot.resize(5, 5);
  dot.fills = [solidPaint(dotC)];
  b.appendChild(dot);

  const t = createText(label, 11, "Medium", tc);
  b.appendChild(t);
  return b;
}

function createBtn(label: string, primary = false, size: "SM" | "MD" = "SM"): FrameNode {
  const btn = figma.createFrame();
  btn.layoutMode = "HORIZONTAL";
  btn.primaryAxisAlignItems = "CENTER";
  btn.counterAxisAlignItems = "CENTER";
  btn.cornerRadius = 8;
  btn.paddingLeft = size === "MD" ? 16 : 12;
  btn.paddingRight = size === "MD" ? 16 : 12;
  btn.paddingTop = size === "MD" ? 10 : 7;
  btn.paddingBottom = size === "MD" ? 10 : 7;

  if (primary) {
    btn.fills = [solidPaint(C.textPrimary)];
    const t = createText(label, size === "MD" ? 13 : 12, "Semi Bold", { r: 0, g: 0, b: 0 });
    btn.appendChild(t);
  } else {
    btn.fills = [solidPaint(C.surfaceElevated)];
    btn.strokes = [solidPaint(C.border)];
    btn.strokeWeight = 1;
    const t = createText(label, size === "MD" ? 13 : 12, "Medium", C.textBody);
    btn.appendChild(t);
  }
  return btn;
}

function createAvatar(name: string, size = 26, online = true): FrameNode {
  const f = figma.createFrame();
  f.resize(size, size);
  f.cornerRadius = 9999;
  f.fills = [solidPaint({ r: 40/255, g: 42/255, b: 48/255 })];
  f.strokes = [solidPaint(C.deep)];
  f.strokeWeight = 1.5;

  const t = createText(name.slice(0, 2).toUpperCase(), size * 0.42, "Semi Bold", C.textPrimary);
  t.x = size * 0.22;
  t.y = size * 0.26;
  f.appendChild(t);

  if (online) {
    const dot = figma.createEllipse();
    dot.resize(size * 0.3, size * 0.3);
    dot.fills = [solidPaint(C.online)];
    dot.strokes = [solidPaint(C.deep)];
    dot.strokeWeight = 1;
    dot.x = size * 0.7;
    dot.y = size * 0.7;
    f.appendChild(dot);
  }
  return f;
}

function createCard(w: number, h: number, pad = 16, bg = C.surface): FrameNode {
  const c = figma.createFrame();
  c.resize(w, h);
  c.fills = [solidPaint(bg)];
  c.cornerRadius = 12;
  c.strokes = [solidPaint(C.border)];
  c.strokeWeight = 1;
  c.paddingLeft = pad; c.paddingRight = pad;
  c.paddingTop = pad; c.paddingBottom = pad;
  c.clipsContent = true;
  return c;
}

function createMiniSidebar(active: string): FrameNode {
  const sb = figma.createFrame();
  sb.name = "App Sidebar";
  sb.resize(220, 712);
  sb.fills = [solidPaint(C.pitch)];
  sb.strokes = [solidPaint(C.border)];
  sb.strokeWeight = 1;
  sb.layoutMode = "VERTICAL";
  sb.paddingLeft = 14; sb.paddingRight = 14;
  sb.paddingTop = 20; sb.paddingBottom = 20;
  sb.itemSpacing = 4;

  const logoRow = figma.createFrame();
  logoRow.layoutMode = "HORIZONTAL";
  logoRow.counterAxisAlignItems = "CENTER";
  logoRow.itemSpacing = 8;
  logoRow.fills = [];
  const mark = figma.createRectangle();
  mark.resize(16, 16);
  mark.cornerRadius = 4;
  mark.fills = [solidPaint(C.textPrimary)];
  logoRow.appendChild(mark);
  const logoT = createText("Kriri Systems", 13, "Semi Bold", C.textPrimary);
  logoRow.appendChild(logoT);
  sb.appendChild(logoRow);

  const sp = figma.createFrame();
  sp.resize(192, 16);
  sp.fills = [];
  sb.appendChild(sp);

  const navs = [
    { label: "Dashboard", key: "Dashboard" },
    { label: "Tasks", key: "Tasks" },
    { label: "Kanban", key: "Kanban" },
    { label: "Projects", key: "Projects" },
    { label: "Analytics", key: "Analytics" },
    { label: "Team", key: "Team" },
    { label: "Agent", key: "Agent" },
    { label: "Inbox", key: "Inbox" },
    { label: "Settings", key: "Settings" }
  ];

  for (const n of navs) {
    const row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.counterAxisAlignItems = "CENTER";
    row.paddingLeft = 10; row.paddingRight = 10;
    row.paddingTop = 7; row.paddingBottom = 7;
    row.cornerRadius = 6;
    row.itemSpacing = 10;
    row.resize(192, 32);

    const isActive = n.key.toLowerCase() === active.toLowerCase();
    if (isActive) {
      row.fills = [solidPaint(C.surfaceElevated)];
      const dot = figma.createEllipse();
      dot.resize(5, 5);
      dot.fills = [solidPaint(C.info)];
      row.appendChild(dot);
      const t = createText(n.label, 12, "Medium", C.textPrimary);
      row.appendChild(t);
    } else {
      row.fills = [];
      const dot = figma.createEllipse();
      dot.resize(5, 5);
      dot.fills = [solidPaint(C.borderSubtle)];
      row.appendChild(dot);
      const t = createText(n.label, 12, "Regular", C.textMuted);
      row.appendChild(t);
    }
    sb.appendChild(row);
  }

  const foot = figma.createFrame();
  foot.layoutMode = "HORIZONTAL";
  foot.counterAxisAlignItems = "CENTER";
  foot.itemSpacing = 8;
  foot.fills = [];
  foot.paddingTop = 18;
  foot.resize(192, 40);
  const av = createAvatar("SC", 22, true);
  foot.appendChild(av);
  const us = createText("sarah@kriri.io", 11, "Regular", C.textSecondary);
  foot.appendChild(us);
  sb.appendChild(foot);

  return sb;
}

function createSpecificationBoard(
  boardNumber: number,
  title: string,
  intro: string,
  x: number,
  y: number,
  populate: (field: FrameNode) => void
): FrameNode {
  const numStr = boardNumber < 10 ? `0${boardNumber}` : `${boardNumber}`;
  const b = figma.createFrame();
  b.name = `${numStr} / Application / ${title}`;
  b.resize(1920, 1080);
  b.x = x; b.y = y;
  b.fills = [solidPaint({ r: 1, g: 1, b: 1 })];
  b.clipsContent = true;

  // Header wordmark
  const wm = createText("Kriri", 25.2, "Bold", { r: 0, g: 0, b: 0 });
  wm.letterSpacing = { value: -1.26, unit: "PIXELS" };
  wm.x = 72; wm.y = 35; b.appendChild(wm);

  // Chapter & Folio
  const ch = createText(`Chapter ${numStr} / Application / ${title}`, 13, "Medium", C.textMuted);
  ch.x = 740; ch.y = 42; b.appendChild(ch);
  const fo = createText(numStr, 13, "Medium", C.textMuted);
  fo.x = 1780; fo.y = 42; b.appendChild(fo);

  // Title & Intro
  const pt = createText(title, 28, "Medium", { r: 0, g: 0, b: 0 });
  pt.x = 72; pt.y = 116; b.appendChild(pt);
  const it = createText(intro, 14, "Regular", { r: 95/255, g: 96/255, b: 102/255 });
  it.x = 72; it.y = 194; it.resize(1776, 30); b.appendChild(it);

  // Specimen
  const pc = figma.createFrame();
  pc.name = "Page content";
  pc.x = 72; pc.y = 260; pc.resize(1776, 712);
  pc.fills = []; pc.clipsContent = true;

  const df = figma.createFrame();
  df.name = "Dark specimen field";
  df.resize(1776, 712);
  df.fills = [solidPaint(C.deep)];
  df.cornerRadius = 16;
  df.strokes = [solidPaint(C.borderSubtle)];
  df.strokeWeight = 1;
  df.clipsContent = true;
  populate(df);
  pc.appendChild(df);
  b.appendChild(pc);

  // Footer rule & text
  const fr = figma.createRectangle();
  fr.name = "Footer rule";
  fr.x = 72; fr.y = 1006; fr.resize(1776, 1);
  fr.fills = [solidPaint(C.borderLight)];
  b.appendChild(fr);

  const bt = createText("Kriri Design System — Specification v1", 13, "Regular", C.textMuted);
  bt.x = 72; bt.y = 1027; b.appendChild(bt);
  const ed = createText("2026", 13, "Regular", C.textMuted);
  ed.x = 1800; ed.y = 1027; b.appendChild(ed);

  return b;
}
'''

# Now let's append all the 15 Board builder definitions
builders = '''
// ===========================================================================
// BOARD DEFINITIONS (28 through 42)
// Complete flow starting from the Landing Page till the last page in the app
// ===========================================================================

// 28: Landing Page & Public Surfaces
function buildBoard28(x: number, y: number) {
  return createSpecificationBoard(
    28,
    "Landing Page & Public Surfaces",
    "The primary conversion touchpoint for incoming teams. High-impact typography, live product preview specimen, feature pillars, and kinetic metrics.",
    x, y,
    (field) => {
      const hero = figma.createFrame();
      hero.resize(1776, 712); hero.fills = [];
      hero.layoutMode = "VERTICAL"; hero.itemSpacing = 28;
      hero.paddingLeft = 64; hero.paddingRight = 64; hero.paddingTop = 36; hero.paddingBottom = 36;

      // Nav
      const nav = figma.createFrame();
      nav.layoutMode = "HORIZONTAL"; nav.counterAxisAlignItems = "CENTER";
      nav.itemSpacing = 28; nav.fills = []; nav.resize(1648, 44);

      const mark = figma.createRectangle(); mark.resize(22, 22); mark.cornerRadius = 5; mark.fills = [solidPaint(C.textPrimary)];
      nav.appendChild(mark);
      const brand = createText("Kriri", 18, "Bold", C.textPrimary);
      nav.appendChild(brand);

      createSpacer(nav);

      for (const item of ["Features", "Pricing", "Changelog", "About", "Contact"]) {
        const lnk = createText(item, 13, "Medium", C.textSecondary);
        nav.appendChild(lnk);
      }
      const sIn = createBtn("Sign In", false, "SM"); nav.appendChild(sIn);
      const gSt = createBtn("Get Started →", true, "SM"); nav.appendChild(gSt);
      hero.appendChild(nav);

      // Hero Content Row
      const contentRow = figma.createFrame();
      contentRow.layoutMode = "HORIZONTAL"; contentRow.itemSpacing = 48;
      contentRow.counterAxisAlignItems = "CENTER"; contentRow.fills = [];
      contentRow.resize(1648, 380);

      const leftCol = figma.createFrame();
      leftCol.layoutMode = "VERTICAL"; leftCol.itemSpacing = 16; leftCol.fills = []; leftCol.resize(760, 360);

      const pill = createBadge("Sub-10ms Reactivity • Autonomous Layer", "info");
      leftCol.appendChild(pill);

      const h1 = createText("The autonomous execution layer for high-output engineering teams.", 36, "Bold", C.textPrimary);
      h1.resize(740, 96);
      leftCol.appendChild(h1);

      const sub = createText("Kriri unites issue tracking, real-time sync, and autonomous AI agents in one unified keyboard-first environment.", 15, "Regular", C.textMuted);
      sub.resize(740, 48);
      leftCol.appendChild(sub);

      const btnRow = figma.createFrame();
      btnRow.layoutMode = "HORIZONTAL"; btnRow.itemSpacing = 12; btnRow.fills = [];
      btnRow.appendChild(createBtn("Start Building Free", true, "MD"));
      btnRow.appendChild(createBtn("Explore Documentation", false, "MD"));
      leftCol.appendChild(btnRow);

      const stats = figma.createFrame();
      stats.layoutMode = "HORIZONTAL"; stats.itemSpacing = 24; stats.fills = []; stats.paddingTop = 12;
      stats.appendChild(createText("⚡ <10ms sync", 12, "Medium", C.online));
      stats.appendChild(createText("🔒 SOC-2 Type II", 12, "Medium", C.textSecondary));
      stats.appendChild(createText("🌐 99.99% Uptime", 12, "Medium", C.textSecondary));
      leftCol.appendChild(stats);

      contentRow.appendChild(leftCol);

      // Hero Glass Preview Card
      const preview = createCard(840, 360, 20, C.surfaceElevated);
      preview.layoutMode = "VERTICAL"; preview.itemSpacing = 16;

      const pHead = figma.createFrame(); pHead.layoutMode = "HORIZONTAL"; pHead.counterAxisAlignItems = "CENTER"; pHead.itemSpacing = 12; pHead.fills = [];
      pHead.appendChild(createBadge("LIVE WORKSPACE MOCKUP", "success"));
      pHead.appendChild(createText("Project: Kriri Core Engine", 12, "Medium", C.textSecondary));
      preview.appendChild(pHead);

      const laneRow = figma.createFrame(); laneRow.layoutMode = "HORIZONTAL"; laneRow.itemSpacing = 12; laneRow.fills = [];
      for (const col of ["In Progress (3)", "Review (2)", "Done (8)"]) {
        const lane = createCard(250, 250, 12, C.surface);
        lane.layoutMode = "VERTICAL"; lane.itemSpacing = 10;
        lane.appendChild(createText(col, 12, "Semi Bold", C.textMuted));

        const card1 = createCard(226, 75, 10, C.surfaceElevated);
        card1.layoutMode = "VERTICAL"; card1.itemSpacing = 6;
        card1.appendChild(createText("KRI-102 • CRDT Sync", 11, "Medium", C.textPrimary));
        card1.appendChild(createBadge("High Priority", "warning"));
        lane.appendChild(card1);

        const card2 = createCard(226, 75, 10, C.surfaceElevated);
        card2.layoutMode = "VERTICAL"; card2.itemSpacing = 6;
        card2.appendChild(createText("KRI-108 • Agent Plan Tree", 11, "Medium", C.textPrimary));
        card2.appendChild(createBadge("In Flight", "info"));
        lane.appendChild(card2);

        laneRow.appendChild(lane);
      }
      preview.appendChild(laneRow);
      contentRow.appendChild(preview);

      hero.appendChild(contentRow);

      // Feature Footer Bar
      const featBar = figma.createFrame();
      featBar.layoutMode = "HORIZONTAL"; featBar.counterAxisAlignItems = "CENTER";
      featBar.itemSpacing = 36; featBar.fills = []; featBar.resize(1648, 60);

      const feats = [
        "Kinetic Performance Engine",
        "Autonomous AI Pair Coding",
        "Multiplayer Avatar Presence",
        "Linear & GitHub Bi-directional Sync"
      ];
      for (const f of feats) {
        const fItem = figma.createFrame(); fItem.layoutMode = "HORIZONTAL"; fItem.counterAxisAlignItems = "CENTER"; fItem.itemSpacing = 8; fItem.fills = [];
        const fDot = figma.createRectangle(); fDot.resize(4, 4); fDot.fills = [solidPaint(C.info)];
        fItem.appendChild(fDot);
        fItem.appendChild(createText(f, 13, "Medium", C.textSecondary));
        featBar.appendChild(fItem);
      }
      hero.appendChild(featBar);

      field.appendChild(hero);
    }
  );
}

// 29: Authentication & Onboarding
function buildBoard29(x: number, y: number) {
  return createSpecificationBoard(
    29,
    "Authentication & Workspace Onboarding",
    "Dual-surface authentication (SSO & passkeys) coupled with an interactive multi-step workspace initialization and team invitation flow.",
    x, y,
    (field) => {
      const row = figma.createFrame();
      row.resize(1776, 712); row.fills = [];
      row.layoutMode = "HORIZONTAL"; row.itemSpacing = 48;
      row.paddingLeft = 72; row.paddingRight = 72; row.paddingTop = 60; row.paddingBottom = 60;

      // Left: Auth Box
      const authBox = createCard(520, 592, 40, C.surfaceElevated);
      authBox.layoutMode = "VERTICAL"; authBox.itemSpacing = 20;

      authBox.appendChild(createBadge("CLERK SSO INTEGRATED", "info"));
      const authT = createText("Sign in to your workspace", 22, "Semi Bold", C.textPrimary);
      authBox.appendChild(authT);
      const authSub = createText("Select your identity provider or sign in with your enterprise credentials.", 13, "Regular", C.textMuted);
      authBox.appendChild(authSub);

      const sso1 = createBtn("Continue with GitHub", false, "MD"); sso1.resize(440, 44); authBox.appendChild(sso1);
      const sso2 = createBtn("Continue with Google", false, "MD"); sso2.resize(440, 44); authBox.appendChild(sso2);

      const div = figma.createFrame(); div.resize(440, 1); div.fills = [solidPaint(C.border)]; authBox.appendChild(div);

      const emLabel = createText("Work Email", 12, "Medium", C.textSecondary); authBox.appendChild(emLabel);
      const emInput = createCard(440, 44, 12, C.deep); emInput.appendChild(createText("sarah@acmelabs.com", 13, "Regular", C.textPrimary)); authBox.appendChild(emInput);

      const pwLabel = createText("Password", 12, "Medium", C.textSecondary); authBox.appendChild(pwLabel);
      const pwInput = createCard(440, 44, 12, C.deep); pwInput.appendChild(createText("••••••••••••••••", 13, "Regular", C.textMuted)); authBox.appendChild(pwInput);

      const subBtn = createBtn("Continue to Kriri →", true, "MD"); subBtn.resize(440, 48); authBox.appendChild(subBtn);
      row.appendChild(authBox);

      // Right: Onboarding Flow Card
      const obBox = createCard(1064, 592, 40, C.surface);
      obBox.layoutMode = "VERTICAL"; obBox.itemSpacing = 24;

      const obTop = figma.createFrame(); obTop.layoutMode = "HORIZONTAL"; obTop.counterAxisAlignItems = "CENTER"; obTop.fills = []; obTop.resize(984, 30);
      obTop.appendChild(createBadge("WORKSPACE SETUP • STEP 2 OF 3", "warning"));
      createSpacer(obTop);
      obTop.appendChild(createText("Progress: 66%", 12, "Medium", C.textMuted));
      obBox.appendChild(obTop);

      // Progress bar
      const progTrack = figma.createFrame(); progTrack.resize(984, 6); progTrack.cornerRadius = 9999; progTrack.fills = [solidPaint(C.surfaceElevated)];
      const progFill = figma.createFrame(); progFill.resize(650, 6); progFill.cornerRadius = 9999; progFill.fills = [solidPaint(C.info)];
      progTrack.appendChild(progFill);
      obBox.appendChild(progTrack);

      const obTit = createText("What will your engineering team build?", 24, "Bold", C.textPrimary);
      obBox.appendChild(obTit);

      // 3 Intent Cards
      const intentRow = figma.createFrame(); intentRow.layoutMode = "HORIZONTAL"; intentRow.itemSpacing = 16; intentRow.fills = [];
      const intents = [
        { t: "Autonomous AI Agents", d: "Pair coding, background test runner, automated bug triaging." },
        { t: "Web & Distributed Cloud", d: "High-scale APIs, frontend micro-services, distributed architecture." },
        { t: "Product & UI Systems", d: "Component libraries, design tokens, multi-platform design sync." }
      ];
      for (let i = 0; i < intents.length; i++) {
        const c = createCard(317, 130, 16, i === 0 ? C.surfaceElevated : C.deep);
        if (i === 0) { c.strokes = [solidPaint(C.info)]; }
        c.layoutMode = "VERTICAL"; c.itemSpacing = 8;
        c.appendChild(createText(intents[i].t, 14, "Semi Bold", C.textPrimary));
        const cd = createText(intents[i].d, 12, "Regular", C.textMuted); cd.resize(285, 48);
        c.appendChild(cd);
        intentRow.appendChild(c);
      }
      obBox.appendChild(intentRow);

      // Team invitations row
      const invTit = createText("Invite engineering teammates", 13, "Semi Bold", C.textPrimary);
      obBox.appendChild(invTit);

      const invRow = figma.createFrame(); invRow.layoutMode = "HORIZONTAL"; invRow.itemSpacing = 12; invRow.fills = [];
      const inv1 = createCard(316, 44, 12, C.deep); inv1.appendChild(createText("marcus@acme.io", 13, "Regular", C.textPrimary)); invRow.appendChild(inv1);
      const inv2 = createCard(316, 44, 12, C.deep); inv2.appendChild(createText("elena@acme.io", 13, "Regular", C.textPrimary)); invRow.appendChild(inv2);
      const inv3 = createCard(316, 44, 12, C.deep); inv3.appendChild(createText("david@acme.io", 13, "Regular", C.textPrimary)); invRow.appendChild(inv3);
      obBox.appendChild(invRow);

      // Buttons
      const obBtnRow = figma.createFrame(); obBtnRow.layoutMode = "HORIZONTAL"; obBtnRow.counterAxisAlignItems = "CENTER"; obBtnRow.fills = []; obBtnRow.resize(984, 48);
      obBtnRow.appendChild(createBtn("← Previous Step", false, "MD"));
      createSpacer(obBtnRow);
      obBtnRow.appendChild(createBtn("Complete & Launch Workspace →", true, "MD"));
      obBox.appendChild(obBtnRow);

      row.appendChild(obBox);
      field.appendChild(row);
    }
  );
}

// 30: Executive Dashboard
function buildBoard30(x: number, y: number) {
  return createSpecificationBoard(
    30,
    "Executive Engineering Dashboard",
    "High-altitude overview aggregating sprint health, issue throughput velocity, active project milestones, and pending blocker triage.",
    x, y,
    (field) => {
      const wrap = figma.createFrame(); wrap.resize(1776, 712); wrap.fills = []; wrap.layoutMode = "HORIZONTAL";
      wrap.appendChild(createMiniSidebar("Dashboard"));

      const main = figma.createFrame(); main.resize(1556, 712); main.fills = [];
      main.layoutMode = "VERTICAL"; main.paddingLeft = 32; main.paddingRight = 32; main.paddingTop = 24; main.paddingBottom = 24; main.itemSpacing = 20;

      // Header Row
      const hr = figma.createFrame(); hr.layoutMode = "HORIZONTAL"; hr.counterAxisAlignItems = "CENTER"; hr.itemSpacing = 16; hr.fills = []; hr.resize(1492, 40);
      const tit = createText("Executive Engineering Overview", 20, "Semi Bold", C.textPrimary);
      hr.appendChild(tit);
      createSpacer(hr);
      hr.appendChild(createBadge("Sprint 24 Active", "success"));
      hr.appendChild(createBtn("+ Create Issue (C)", true, "SM"));
      main.appendChild(hr);

      // KPI Metric Cards
      const kpiRow = figma.createFrame(); kpiRow.layoutMode = "HORIZONTAL"; kpiRow.itemSpacing = 16; kpiRow.fills = [];
      const kpis = [
        { t: "Total Active Projects", v: "14", s: "+2 this cycle", tone: "info" as const },
        { t: "Sprint Completion", v: "87.4%", s: "48 of 55 issues done", tone: "success" as const },
        { t: "P0 Blockers", v: "0", s: "All clear (<1h SLA)", tone: "success" as const },
        { t: "Throughput Velocity", v: "38.2 pts", s: "Top 5% speed benchmark", tone: "warning" as const }
      ];
      for (const k of kpis) {
        const c = createCard(361, 100, 16, C.surface);
        c.layoutMode = "VERTICAL"; c.itemSpacing = 6;
        const top = figma.createFrame(); top.layoutMode = "HORIZONTAL"; top.fills = [];
        top.appendChild(createText(k.t, 12, "Medium", C.textMuted));
        createSpacer(top);
        top.appendChild(createBadge(k.s, k.tone));
        c.appendChild(top);
        c.appendChild(createText(k.v, 28, "Bold", C.textPrimary));
        kpiRow.appendChild(c);
      }
      main.appendChild(kpiRow);

      // Lower Split: Active Initiatives + Top Priority Task
      const lower = figma.createFrame(); lower.layoutMode = "HORIZONTAL"; lower.itemSpacing = 20; lower.fills = []; lower.resize(1492, 440);

      // Projects Card (980w)
      const pCard = createCard(980, 440, 20, C.surface);
      pCard.layoutMode = "VERTICAL"; pCard.itemSpacing = 14;
      pCard.appendChild(createText("Active Initiatives & Milestones", 15, "Semi Bold", C.textPrimary));

      const initiatives = [
        { n: "Real-time Collaborative Engine", p: 84, l: "Sarah C.", d: "Nov 20", st: "On Track" as const },
        { n: "Autonomous AI Agent Tool Calling", p: 92, l: "Marcus V.", d: "Nov 14", st: "On Track" as const },
        { n: "Design System Figma Variable Sync", p: 62, l: "Elena R.", d: "Nov 25", st: "At Risk" as const },
        { n: "Mobile Flutter Companion", p: 38, l: "David K.", d: "Dec 10", st: "Planning" as const }
      ];
      for (const ini of initiatives) {
        const ir = createCard(940, 78, 14, C.surfaceElevated);
        ir.layoutMode = "VERTICAL"; ir.itemSpacing = 8;
        const irHead = figma.createFrame(); irHead.layoutMode = "HORIZONTAL"; irHead.fills = [];
        irHead.appendChild(createText(ini.n, 13, "Semi Bold", C.textPrimary));
        createSpacer(irHead);
        irHead.appendChild(createBadge(ini.st, ini.st === "On Track" ? "success" : ini.st === "At Risk" ? "warning" : "info"));
        ir.appendChild(irHead);

        // Progress line
        const tr = figma.createFrame(); tr.resize(912, 4); tr.cornerRadius = 9999; tr.fills = [solidPaint(C.border)];
        const fl = figma.createFrame(); fl.resize(Math.round(912 * (ini.p / 100)), 4); fl.cornerRadius = 9999; fl.fills = [solidPaint(C.info)];
        tr.appendChild(fl); ir.appendChild(tr);

        const meta = figma.createFrame(); meta.layoutMode = "HORIZONTAL"; meta.fills = [];
        meta.appendChild(createText(`Lead: ${ini.l} • Due: ${ini.d}`, 11, "Regular", C.textMuted));
        createSpacer(meta);
        meta.appendChild(createText(`${ini.p}% complete`, 11, "Medium", C.textSecondary));
        ir.appendChild(meta);
        pCard.appendChild(ir);
      }
      lower.appendChild(pCard);

      // Top Task / Focus Card (492w)
      const tCard = createCard(492, 440, 20, C.surface);
      tCard.layoutMode = "VERTICAL"; tCard.itemSpacing = 16;
      tCard.appendChild(createText("Current Sprint Focus Task", 15, "Semi Bold", C.textPrimary));

      const taskBox = createCard(452, 180, 16, C.surfaceElevated);
      taskBox.layoutMode = "VERTICAL"; taskBox.itemSpacing = 10;
      taskBox.appendChild(createBadge("KRI-101 • URGENT", "danger"));
      const taskT = createText("Refactor WebSocket connection re-auth gate for token expiry", 14, "Semi Bold", C.textPrimary);
      taskT.resize(420, 42); taskBox.appendChild(taskT);
      taskBox.appendChild(createText("Assigned to you • Due today 18:00 UTC", 12, "Regular", C.textMuted));
      taskBox.appendChild(createBtn("Launch Interactive Focus Mode", true, "SM"));
      tCard.appendChild(taskBox);

      tCard.appendChild(createText("Recent Team Activity", 13, "Semi Bold", C.textPrimary));
      const acts = [
        "Marcus closed KRI-105: Benchmark SQLite indices",
        "Elena uploaded new Design Tokens artifact",
        "Sarah requested review on PR #182 (CRDT)"
      ];
      for (const a of acts) {
        const ar = figma.createFrame(); ar.layoutMode = "HORIZONTAL"; ar.counterAxisAlignItems = "CENTER"; ar.itemSpacing = 8; ar.fills = [];
        const ad = figma.createEllipse(); ad.resize(4, 4); ad.fills = [solidPaint(C.online)];
        ar.appendChild(ad);
        ar.appendChild(createText(a, 11, "Regular", C.textSecondary));
        tCard.appendChild(ar);
      }

      lower.appendChild(tCard);
      main.appendChild(lower);
      wrap.appendChild(main);
      field.appendChild(wrap);
    }
  );
}

// 31: Tasks & Issue Management
function buildBoard31(x: number, y: number) {
  return createSpecificationBoard(
    31,
    "Tasks & Issue Management",
    "Keyboard-first dense table layout with multi-dimensional filtering by status, priority, lead, and cycle for rapid triage.",
    x, y,
    (field) => {
      const wrap = figma.createFrame(); wrap.resize(1776, 712); wrap.fills = []; wrap.layoutMode = "HORIZONTAL";
      wrap.appendChild(createMiniSidebar("Tasks"));

      const main = figma.createFrame(); main.resize(1556, 712); main.fills = [];
      main.layoutMode = "VERTICAL"; main.paddingLeft = 32; main.paddingRight = 32; main.paddingTop = 24; main.paddingBottom = 24; main.itemSpacing = 16;

      const hr = figma.createFrame(); hr.layoutMode = "HORIZONTAL"; hr.counterAxisAlignItems = "CENTER"; hr.itemSpacing = 14; hr.fills = []; hr.resize(1492, 40);
      hr.appendChild(createText("All Issues (142)", 20, "Semi Bold", C.textPrimary));
      createSpacer(hr);
      hr.appendChild(createBadge("Filter: Open Issues", "info"));
      hr.appendChild(createBadge("Priority: High / Urgent", "warning"));
      hr.appendChild(createBtn("+ New Issue (C)", true, "SM"));
      main.appendChild(hr);

      // Search & Control Bar
      const ctrl = createCard(1492, 44, 12, C.surface);
      ctrl.layoutMode = "HORIZONTAL"; ctrl.counterAxisAlignItems = "CENTER"; ctrl.itemSpacing = 16;
      ctrl.appendChild(createText("🔍 Search issues, titles, or descriptions (Cmd+K)...", 12, "Regular", C.textMuted));
      createSpacer(ctrl);
      ctrl.appendChild(createText("Display: Dense Table", 11, "Medium", C.textSecondary));
      main.appendChild(ctrl);

      // Dense Table
      const table = createCard(1492, 530, 0, C.surface);
      table.layoutMode = "VERTICAL"; table.itemSpacing = 0;

      const th = figma.createFrame(); th.resize(1492, 36); th.fills = [solidPaint(C.surfaceElevated)];
      th.layoutMode = "HORIZONTAL"; th.counterAxisAlignItems = "CENTER"; th.paddingLeft = 16; th.paddingRight = 16; th.itemSpacing = 16;
      const th1 = createText("ID", 11, "Semi Bold", C.textMuted); th1.resize(70, 16); th.appendChild(th1);
      const th2 = createText("Title", 11, "Semi Bold", C.textMuted); th2.resize(550, 16); th.appendChild(th2);
      const th3 = createText("Status", 11, "Semi Bold", C.textMuted); th3.resize(120, 16); th.appendChild(th3);
      const th4 = createText("Priority", 11, "Semi Bold", C.textMuted); th4.resize(110, 16); th.appendChild(th4);
      const th5 = createText("Assignee", 11, "Semi Bold", C.textMuted); th5.resize(140, 16); th.appendChild(th5);
      const th6 = createText("Estimate", 11, "Semi Bold", C.textMuted); th6.resize(80, 16); th.appendChild(th6);
      const th7 = createText("Updated", 11, "Semi Bold", C.textMuted); th7.resize(100, 16); th.appendChild(th7);
      table.appendChild(th);

      const rows = [
        { id: "KRI-101", t: "Refactor authentication provider to support Clerk SSO and passkeys", st: "In Progress", pr: "Urgent", prTone: "danger" as const, as: "Sarah C.", pt: "5 pts", up: "12m ago" },
        { id: "KRI-102", t: "Implement sub-10ms websocket delta synchronisation engine", st: "In Review", pr: "High", prTone: "warning" as const, as: "Marcus V.", pt: "8 pts", up: "45m ago" },
        { id: "KRI-103", t: "Design system token synchronization with Figma Variables REST API", st: "In Progress", pr: "Medium", prTone: "info" as const, as: "Elena R.", pt: "3 pts", up: "2h ago" },
        { id: "KRI-104", t: "Autonomous agent execution tree visualizer and step approvals", st: "In Review", pr: "High", prTone: "warning" as const, as: "Sarah C.", pt: "5 pts", up: "3h ago" },
        { id: "KRI-105", t: "Optimize SQLite database indexing for rapid issue full-text search", st: "Done", pr: "Medium", prTone: "neutral" as const, as: "David K.", pt: "2 pts", up: "5h ago" },
        { id: "KRI-106", t: "Add keyboard shortcuts cheat sheet overlay modal with Cmd+/", st: "Done", pr: "Low", prTone: "neutral" as const, as: "Marcus V.", pt: "1 pt", up: "1d ago" },
        { id: "KRI-107", t: "Implement touch-capable gesture hooks for iPad Pro responsive layout", st: "Backlog", pr: "Low", prTone: "neutral" as const, as: "Elena R.", pt: "3 pts", up: "2d ago" },
        { id: "KRI-108", t: "Telemetry integration with PostHog client analytics and error captures", st: "Done", pr: "Medium", prTone: "neutral" as const, as: "Sarah C.", pt: "2 pts", up: "3d ago" }
      ];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const row = figma.createFrame();
        row.resize(1492, 48); row.fills = [solidPaint(i % 2 === 0 ? C.surface : C.deep)];
        row.layoutMode = "HORIZONTAL"; row.counterAxisAlignItems = "CENTER"; row.paddingLeft = 16; row.paddingRight = 16; row.itemSpacing = 16;

        const cId = createText(r.id, 12, "Semi Bold", C.info); cId.resize(70, 16); row.appendChild(cId);
        const cT = createText(r.t, 13, "Regular", C.textBody); cT.resize(550, 18); row.appendChild(cT);

        const stWrap = figma.createFrame(); stWrap.resize(120, 26); stWrap.fills = [];
        stWrap.appendChild(createBadge(r.st, r.st === "Done" ? "success" : r.st === "In Review" ? "warning" : "info"));
        row.appendChild(stWrap);

        const prWrap = figma.createFrame(); prWrap.resize(110, 26); prWrap.fills = [];
        prWrap.appendChild(createBadge(r.pr, r.prTone));
        row.appendChild(prWrap);

        const asWrap = figma.createFrame(); asWrap.resize(140, 26); asWrap.fills = []; asWrap.layoutMode = "HORIZONTAL"; asWrap.counterAxisAlignItems = "CENTER"; asWrap.itemSpacing = 6;
        asWrap.appendChild(createAvatar(r.as.slice(0, 2), 20, true));
        asWrap.appendChild(createText(r.as, 12, "Medium", C.textSecondary));
        row.appendChild(asWrap);

        const cPt = createText(r.pt, 12, "Regular", C.textMuted); cPt.resize(80, 16); row.appendChild(cPt);
        const cUp = createText(r.up, 11, "Regular", C.textFaint); cUp.resize(100, 16); row.appendChild(cUp);

        table.appendChild(row);
      }

      main.appendChild(table);
      wrap.appendChild(main);
      field.appendChild(wrap);
    }
  );
}

// 32: Sprint Board & Kanban
function buildBoard32(x: number, y: number) {
  return createSpecificationBoard(
    32,
    "Sprint Board & Kanban Lanes",
    "Multi-stage Kanban board mapping issues across lifecycle states with integrated priority indicators, progress bars, and avatar stacks.",
    x, y,
    (field) => {
      const wrap = figma.createFrame(); wrap.resize(1776, 712); wrap.fills = []; wrap.layoutMode = "HORIZONTAL";
      wrap.appendChild(createMiniSidebar("Kanban"));

      const main = figma.createFrame(); main.resize(1556, 712); main.fills = [];
      main.layoutMode = "VERTICAL"; main.paddingLeft = 32; main.paddingRight = 32; main.paddingTop = 24; main.paddingBottom = 24; main.itemSpacing = 16;

      const hr = figma.createFrame(); hr.layoutMode = "HORIZONTAL"; hr.counterAxisAlignItems = "CENTER"; hr.itemSpacing = 16; hr.fills = []; hr.resize(1492, 40);
      hr.appendChild(createText("Sprint 24: Core Architecture", 20, "Semi Bold", C.textPrimary));
      hr.appendChild(createBadge("Nov 1 – Nov 15", "neutral"));
      hr.appendChild(createBadge("34 of 42 Completed (81%)", "success"));
      createSpacer(hr);
      hr.appendChild(createBtn("Complete Sprint", false, "SM"));
      hr.appendChild(createBtn("+ Add Issue", true, "SM"));
      main.appendChild(hr);

      // 4 Kanban Columns
      const lanes = figma.createFrame(); lanes.layoutMode = "HORIZONTAL"; lanes.itemSpacing = 16; lanes.fills = []; lanes.resize(1492, 590);

      const colDefs = [
        {
          name: "Backlog (3)",
          cards: [
            { id: "KRI-110", t: "PostgreSQL read replica replication latency alerts", p: "Low", a: "DK" },
            { id: "KRI-112", t: "Automated database schema backup cron to S3 bucket", p: "Medium", a: "MV" }
          ]
        },
        {
          name: "In Progress (4)",
          cards: [
            { id: "KRI-101", t: "Refactor Clerk authentication provider with session refresh", p: "Urgent", a: "SC" },
            { id: "KRI-103", t: "Figma Variables REST sync pipeline with token exporter", p: "High", a: "ER" }
          ]
        },
        {
          name: "In Review (2)",
          cards: [
            { id: "KRI-102", t: "Sub-10ms websocket delta sync unit & fuzz tests", p: "High", a: "MV" },
            { id: "KRI-104", t: "Autonomous agent execution tree visualizer review", p: "Medium", a: "SC" }
          ]
        },
        {
          name: "Done (8)",
          cards: [
            { id: "KRI-105", t: "SQLite database index optimization for quick filters", p: "Medium", a: "DK" },
            { id: "KRI-106", t: "Global keyboard shortcuts cheat sheet overlay", p: "Low", a: "MV" }
          ]
        }
      ];

      for (const col of colDefs) {
        const lane = createCard(361, 590, 14, C.surface);
        lane.layoutMode = "VERTICAL"; lane.itemSpacing = 12;

        const lh = figma.createFrame(); lh.layoutMode = "HORIZONTAL"; lh.counterAxisAlignItems = "CENTER"; lh.fills = [];
        lh.appendChild(createText(col.name, 13, "Semi Bold", C.textPrimary));
        createSpacer(lh);
        lh.appendChild(createText("···", 14, "Bold", C.textMuted));
        lane.appendChild(lh);

        for (const card of col.cards) {
          const cd = createCard(333, 130, 14, C.surfaceElevated);
          cd.layoutMode = "VERTICAL"; cd.itemSpacing = 8;

          const cdTop = figma.createFrame(); cdTop.layoutMode = "HORIZONTAL"; cdTop.counterAxisAlignItems = "CENTER"; cdTop.fills = [];
          cdTop.appendChild(createText(card.id, 11, "Semi Bold", C.info));
          createSpacer(cdTop);
          cdTop.appendChild(createBadge(card.p, card.p === "Urgent" ? "danger" : card.p === "High" ? "warning" : "neutral"));
          cd.appendChild(cdTop);

          const ct = createText(card.t, 13, "Medium", C.textPrimary);
          ct.resize(305, 36); cd.appendChild(ct);

          const cdBot = figma.createFrame(); cdBot.layoutMode = "HORIZONTAL"; cdBot.counterAxisAlignItems = "CENTER"; cdBot.fills = [];
          cdBot.appendChild(createAvatar(card.a, 22, true));
          createSpacer(cdBot);
          cdBot.appendChild(createText("Sprint 24", 10, "Medium", C.textMuted));
          cd.appendChild(cdBot);

          lane.appendChild(cd);
        }

        lanes.appendChild(lane);
      }

      main.appendChild(lanes);
      wrap.appendChild(main);
      field.appendChild(wrap);
    }
  );
}

// 33: Projects & Portfolio Hub
function buildBoard33(x: number, y: number) {
  return createSpecificationBoard(
    33,
    "Projects & Portfolio Hub",
    "High-level project cards displaying status health indicators, lead ownership, target delivery milestones, and issue completion percentages.",
    x, y,
    (field) => {
      const wrap = figma.createFrame(); wrap.resize(1776, 712); wrap.fills = []; wrap.layoutMode = "HORIZONTAL";
      wrap.appendChild(createMiniSidebar("Projects"));

      const main = figma.createFrame(); main.resize(1556, 712); main.fills = [];
      main.layoutMode = "VERTICAL"; main.paddingLeft = 32; main.paddingRight = 32; main.paddingTop = 24; main.paddingBottom = 24; main.itemSpacing = 20;

      const hr = figma.createFrame(); hr.layoutMode = "HORIZONTAL"; hr.counterAxisAlignItems = "CENTER"; hr.itemSpacing = 16; hr.fills = []; hr.resize(1492, 40);
      hr.appendChild(createText("Active Engineering Initiatives (Q4 2026)", 20, "Semi Bold", C.textPrimary));
      createSpacer(hr);
      hr.appendChild(createBadge("4 Active Projects", "info"));
      hr.appendChild(createBtn("+ New Project", true, "SM"));
      main.appendChild(hr);

      // 4 Large Project Cards Grid
      const grid = figma.createFrame(); grid.layoutMode = "VERTICAL"; grid.itemSpacing = 18; grid.fills = [];

      const p1 = [
        { n: "Real-time Collaborative Engine", d: "Sub-10ms state synchronization across multi-tenant browser runtimes via CRDTs.", p: 84, l: "Sarah Chen", done: "24/28", st: "On Track" as const, due: "Nov 20" },
        { n: "Autonomous AI Agent Tool Calling", d: "Multi-turn LLM reasoning engine capable of executing bash commands and creating pull requests.", p: 92, l: "Marcus Vance", done: "38/42", st: "On Track" as const, due: "Nov 14" }
      ];
      const r1 = figma.createFrame(); r1.layoutMode = "HORIZONTAL"; r1.itemSpacing = 20; r1.fills = [];
      for (const pr of p1) {
        const c = createCard(736, 260, 24, C.surface);
        c.layoutMode = "VERTICAL"; c.itemSpacing = 14;

        const top = figma.createFrame(); top.layoutMode = "HORIZONTAL"; top.counterAxisAlignItems = "CENTER"; top.fills = [];
        top.appendChild(createText(pr.n, 16, "Semi Bold", C.textPrimary));
        createSpacer(top);
        top.appendChild(createBadge(pr.st, "success"));
        c.appendChild(top);

        const desc = createText(pr.d, 13, "Regular", C.textMuted); desc.resize(688, 36); c.appendChild(desc);

        // Progress bar
        const tr = figma.createFrame(); tr.resize(688, 6); tr.cornerRadius = 9999; tr.fills = [solidPaint(C.border)];
        const fl = figma.createFrame(); fl.resize(Math.round(688 * (pr.p / 100)), 6); fl.cornerRadius = 9999; fl.fills = [solidPaint(C.info)];
        tr.appendChild(fl); c.appendChild(tr);

        const foot = figma.createFrame(); foot.layoutMode = "HORIZONTAL"; foot.counterAxisAlignItems = "CENTER"; foot.fills = [];
        foot.appendChild(createAvatar(pr.l.slice(0, 2), 24, true));
        foot.appendChild(createText(`Lead: ${pr.l}`, 12, "Medium", C.textSecondary));
        createSpacer(foot);
        foot.appendChild(createText(`${pr.done} tasks • Due ${pr.due}`, 12, "Regular", C.textMuted));
        c.appendChild(foot);

        r1.appendChild(c);
      }
      grid.appendChild(r1);

      const p2 = [
        { n: "Design System Figma Variable Sync", d: "Bi-directional token mapping engine pulling semantic and arc tokens directly into code.", p: 62, l: "Elena Rostova", done: "18/29", st: "At Risk" as const, due: "Nov 25" },
        { n: "Mobile Application & Push Notifications", d: "Offline-first companion application with push notification triggers for urgent PR reviews.", p: 35, l: "David Kim", done: "9/26", st: "Planning" as const, due: "Dec 15" }
      ];
      const r2 = figma.createFrame(); r2.layoutMode = "HORIZONTAL"; r2.itemSpacing = 20; r2.fills = [];
      for (const pr of p2) {
        const c = createCard(736, 260, 24, C.surface);
        c.layoutMode = "VERTICAL"; c.itemSpacing = 14;

        const top = figma.createFrame(); top.layoutMode = "HORIZONTAL"; top.counterAxisAlignItems = "CENTER"; top.fills = [];
        top.appendChild(createText(pr.n, 16, "Semi Bold", C.textPrimary));
        createSpacer(top);
        top.appendChild(createBadge(pr.st, pr.st === "At Risk" ? "warning" : "info"));
        c.appendChild(top);

        const desc = createText(pr.d, 13, "Regular", C.textMuted); desc.resize(688, 36); c.appendChild(desc);

        const tr = figma.createFrame(); tr.resize(688, 6); tr.cornerRadius = 9999; tr.fills = [solidPaint(C.border)];
        const fl = figma.createFrame(); fl.resize(Math.round(688 * (pr.p / 100)), 6); fl.cornerRadius = 9999; fl.fills = [solidPaint(pr.st === "At Risk" ? C.warning : C.info)];
        tr.appendChild(fl); c.appendChild(tr);

        const foot = figma.createFrame(); foot.layoutMode = "HORIZONTAL"; foot.counterAxisAlignItems = "CENTER"; foot.fills = [];
        foot.appendChild(createAvatar(pr.l.slice(0, 2), 24, true));
        foot.appendChild(createText(`Lead: ${pr.l}`, 12, "Medium", C.textSecondary));
        createSpacer(foot);
        foot.appendChild(createText(`${pr.done} tasks • Due ${pr.due}`, 12, "Regular", C.textMuted));
        c.appendChild(foot);

        r2.appendChild(c);
      }
      grid.appendChild(r2);

      main.appendChild(grid);
      wrap.appendChild(main);
      field.appendChild(wrap);
    }
  );
}

// 34: Project Details & Milestones
function buildBoard34(x: number, y: number) {
  return createSpecificationBoard(
    34,
    "Project Details & Milestones",
    "Deep-dive project workspace showing milestone phases, linked GitHub pull requests, blocking dependencies, and deliverable burndown.",
    x, y,
    (field) => {
      const wrap = figma.createFrame(); wrap.resize(1776, 712); wrap.fills = []; wrap.layoutMode = "HORIZONTAL";
      wrap.appendChild(createMiniSidebar("Projects"));

      const main = figma.createFrame(); main.resize(1556, 712); main.fills = [];
      main.layoutMode = "VERTICAL"; main.paddingLeft = 32; main.paddingRight = 32; main.paddingTop = 24; main.paddingBottom = 24; main.itemSpacing = 20;

      // Breadcrumb & Header
      const bc = createText("Projects / Core Engineering / Initiative", 11, "Medium", C.info);
      main.appendChild(bc);

      const hr = figma.createFrame(); hr.layoutMode = "HORIZONTAL"; hr.counterAxisAlignItems = "CENTER"; hr.itemSpacing = 16; hr.fills = []; hr.resize(1492, 40);
      hr.appendChild(createText("Real-time Collaborative Engine", 22, "Bold", C.textPrimary));
      hr.appendChild(createBadge("84% Complete", "success"));
      createSpacer(hr);
      hr.appendChild(createBtn("Edit Initiative", false, "SM"));
      hr.appendChild(createBtn("+ Add Milestone", true, "SM"));
      main.appendChild(hr);

      // Meta row
      const meta = createCard(1492, 60, 16, C.surface);
      meta.layoutMode = "HORIZONTAL"; meta.counterAxisAlignItems = "CENTER"; meta.itemSpacing = 36;
      meta.appendChild(createText("Lead: Sarah Chen", 12, "Medium", C.textSecondary));
      meta.appendChild(createText("Target Delivery: Nov 20, 2026", 12, "Medium", C.textSecondary));
      meta.appendChild(createText("Repository: kriri/core-engine", 12, "Medium", C.textSecondary));
      createSpacer(meta);
      meta.appendChild(createBadge("GitHub Sync Active", "info"));
      main.appendChild(meta);

      // Split: Roadmap Milestones (950) + Linked PRs & Tasks (522)
      const split = figma.createFrame(); split.layoutMode = "HORIZONTAL"; split.itemSpacing = 20; split.fills = []; split.resize(1492, 480);

      const msBox = createCard(950, 480, 20, C.surface);
      msBox.layoutMode = "VERTICAL"; msBox.itemSpacing = 16;
      msBox.appendChild(createText("Initiative Roadmap & Delivery Phases", 15, "Semi Bold", C.textPrimary));

      const phases = [
        { n: "Phase 1: WebSocket Transport Layer", st: "Completed", t: "success" as const, d: "Zero-copy framing protocol with sub-5ms latency." },
        { n: "Phase 2: Conflict-Free Replicated Data Types (CRDT)", st: "In Progress (88%)", t: "info" as const, d: "State tree convergence engine handling concurrent text edits." },
        { n: "Phase 3: Client Cache Rehydration & Offline Persistence", st: "Upcoming", t: "neutral" as const, d: "IndexedDB synchronization with exponential fallback reconnection." }
      ];
      for (const p of phases) {
        const pc = createCard(910, 110, 16, C.surfaceElevated);
        pc.layoutMode = "VERTICAL"; pc.itemSpacing = 8;
        const ph = figma.createFrame(); ph.layoutMode = "HORIZONTAL"; ph.fills = [];
        ph.appendChild(createText(p.n, 14, "Semi Bold", C.textPrimary));
        createSpacer(ph);
        ph.appendChild(createBadge(p.st, p.t));
        pc.appendChild(ph);
        const pd = createText(p.d, 12, "Regular", C.textMuted); pd.resize(878, 36);
        pc.appendChild(pd);
        msBox.appendChild(pc);
      }
      split.appendChild(msBox);

      // Right Box: PRs
      const prBox = createCard(522, 480, 20, C.surface);
      prBox.layoutMode = "VERTICAL"; prBox.itemSpacing = 14;
      prBox.appendChild(createText("Linked Pull Requests & Issues", 15, "Semi Bold", C.textPrimary));

      const prs = [
        { id: "PR #182", t: "Add CRDT state rebase algorithm", st: "Review Pending", a: "SC" },
        { id: "PR #185", t: "Benchmark WebSocket framing throughput", st: "Approved", a: "MV" },
        { id: "KRI-101", t: "Token expiry refresh handler", st: "In Flight", a: "SC" }
      ];
      for (const item of prs) {
        const prc = createCard(482, 85, 12, C.surfaceElevated);
        prc.layoutMode = "VERTICAL"; prc.itemSpacing = 6;
        const pt = figma.createFrame(); pt.layoutMode = "HORIZONTAL"; pt.fills = [];
        pt.appendChild(createText(item.id, 12, "Semi Bold", C.info));
        createSpacer(pt);
        pt.appendChild(createBadge(item.st, item.st === "Approved" ? "success" : "warning"));
        prc.appendChild(pt);
        prc.appendChild(createText(item.t, 12, "Regular", C.textSecondary));
        prBox.appendChild(prc);
      }
      split.appendChild(prBox);

      main.appendChild(split);
      wrap.appendChild(main);
      field.appendChild(wrap);
    }
  );
}

// 35: Velocity & Performance Analytics
function buildBoard35(x: number, y: number) {
  return createSpecificationBoard(
    35,
    "Velocity & Performance Analytics",
    "Sprint burndown trajectories, cycle time distributions, and team throughput metrics designed for engineering leadership.",
    x, y,
    (field) => {
      const wrap = figma.createFrame(); wrap.resize(1776, 712); wrap.fills = []; wrap.layoutMode = "HORIZONTAL";
      wrap.appendChild(createMiniSidebar("Analytics"));

      const main = figma.createFrame(); main.resize(1556, 712); main.fills = [];
      main.layoutMode = "VERTICAL"; main.paddingLeft = 32; main.paddingRight = 32; main.paddingTop = 24; main.paddingBottom = 24; main.itemSpacing = 16;

      const hr = figma.createFrame(); hr.layoutMode = "HORIZONTAL"; hr.counterAxisAlignItems = "CENTER"; hr.itemSpacing = 16; hr.fills = []; hr.resize(1492, 40);
      hr.appendChild(createText("Velocity & Throughput Analytics", 20, "Semi Bold", C.textPrimary));
      createSpacer(hr);
      hr.appendChild(createBadge("Cycle: Sprint 24", "info"));
      hr.appendChild(createBtn("Export CSV Report", false, "SM"));
      main.appendChild(hr);

      // Summary KPIs
      const kpis = figma.createFrame(); kpis.layoutMode = "HORIZONTAL"; kpis.itemSpacing = 16; kpis.fills = [];
      const stats = [
        { t: "Average Cycle Time", v: "1.4 days", s: "18% faster than baseline", c: C.online },
        { t: "Sprint Completion Rate", v: "94.2%", s: "Ahead of schedule", c: C.online },
        { t: "PR Review Turnaround", v: "2.8 hours", s: "Top decile response", c: C.info },
        { t: "Net Code Velocity", v: "+1,420 loc", s: "Clean refactor ratio", c: C.textSecondary }
      ];
      for (const s of stats) {
        const c = createCard(361, 95, 14, C.surface);
        c.layoutMode = "VERTICAL"; c.itemSpacing = 6;
        c.appendChild(createText(s.t, 12, "Medium", C.textMuted));
        c.appendChild(createText(s.v, 24, "Bold", s.c));
        c.appendChild(createText(s.s, 11, "Regular", C.textMuted));
        kpis.appendChild(c);
      }
      main.appendChild(kpis);

      // Split Charts
      const charts = figma.createFrame(); charts.layoutMode = "HORIZONTAL"; charts.itemSpacing = 20; charts.fills = []; charts.resize(1492, 450);

      // Burndown
      const bd = createCard(950, 450, 20, C.surface);
      bd.layoutMode = "VERTICAL"; bd.itemSpacing = 14;
      bd.appendChild(createText("Sprint 24 Burndown Trajectory (Issues Remaining)", 14, "Semi Bold", C.textPrimary));

      const bdArea = figma.createFrame(); bdArea.resize(910, 360); bdArea.fills = [solidPaint(C.deep)]; bdArea.cornerRadius = 8;
      // Grid lines
      for (let i = 0; i < 5; i++) {
        const gl = figma.createRectangle(); gl.x = 20; gl.y = 40 + i * 65; gl.resize(870, 1); gl.fills = [solidPaint(C.borderSubtle)]; bdArea.appendChild(gl);
      }
      // Ideal line
      const idLine = figma.createRectangle(); idLine.x = 40; idLine.y = 50; idLine.resize(830, 2); idLine.rotation = -19; idLine.fills = [solidPaint(C.border)]; bdArea.appendChild(idLine);
      // Actual line
      const actLine = figma.createRectangle(); actLine.x = 40; actLine.y = 50; actLine.resize(680, 3); actLine.rotation = -22; actLine.fills = [solidPaint(C.info)]; bdArea.appendChild(actLine);
      bd.appendChild(bdArea);
      charts.appendChild(bd);

      // Throughput bar
      const tp = createCard(522, 450, 20, C.surface);
      tp.layoutMode = "VERTICAL"; tp.itemSpacing = 16;
      tp.appendChild(createText("Weekly Issue Throughput", 14, "Semi Bold", C.textPrimary));

      const tpBars = figma.createFrame(); tpBars.layoutMode = "HORIZONTAL"; tpBars.counterAxisAlignItems = "MAX"; tpBars.itemSpacing = 20; tpBars.fills = []; tpBars.resize(482, 340);
      tpBars.paddingLeft = 20; tpBars.paddingBottom = 20;

      const weeks = [
        { w: "W41", h: 140, n: "28" },
        { w: "W42", h: 210, n: "42" },
        { w: "W43", h: 180, n: "36" },
        { w: "W44", h: 260, n: "52" }
      ];
      for (const wk of weeks) {
        const col = figma.createFrame(); col.layoutMode = "VERTICAL"; col.counterAxisAlignItems = "CENTER"; col.itemSpacing = 8; col.fills = [];
        col.appendChild(createText(wk.n, 11, "Semi Bold", C.info));
        const bar = figma.createRectangle(); bar.resize(60, wk.h); bar.cornerRadius = 6; bar.fills = [solidPaint(C.surfaceElevated)];
        col.appendChild(bar);
        col.appendChild(createText(wk.w, 11, "Medium", C.textMuted));
        tpBars.appendChild(col);
      }
      tp.appendChild(tpBars);
      charts.appendChild(tp);

      main.appendChild(charts);
      wrap.appendChild(main);
      field.appendChild(wrap);
    }
  );
}

// 36: Team Directory & Member Presence
function buildBoard36(x: number, y: number) {
  return createSpecificationBoard(
    36,
    "Team Directory & Live Presence Gate",
    "Real-time member directory showing live presence states (Online, Away, In Focus), assigned responsibilities, local timezones, and direct interaction hooks.",
    x, y,
    (field) => {
      const wrap = figma.createFrame(); wrap.resize(1776, 712); wrap.fills = []; wrap.layoutMode = "HORIZONTAL";
      wrap.appendChild(createMiniSidebar("Team"));

      const main = figma.createFrame(); main.resize(1556, 712); main.fills = [];
      main.layoutMode = "VERTICAL"; main.paddingLeft = 32; main.paddingRight = 32; main.paddingTop = 24; main.paddingBottom = 24; main.itemSpacing = 20;

      const hr = figma.createFrame(); hr.layoutMode = "HORIZONTAL"; hr.counterAxisAlignItems = "CENTER"; hr.itemSpacing = 16; hr.fills = []; hr.resize(1492, 40);
      hr.appendChild(createText("Workspace Team Directory (18 Members)", 20, "Semi Bold", C.textPrimary));
      createSpacer(hr);
      hr.appendChild(createBadge("12 Active Online", "success"));
      hr.appendChild(createBtn("+ Invite Teammate", true, "SM"));
      main.appendChild(hr);

      // Members Cards Grid
      const grid = figma.createFrame(); grid.layoutMode = "VERTICAL"; grid.itemSpacing = 18; grid.fills = [];

      const members = [
        [
          { n: "Sarah Chen", r: "Staff Distributed Systems", st: "Online", t: "success" as const, tz: "Tokyo (15:42)", acts: "4 active tasks • Lead" },
          { n: "Marcus Vance", r: "Senior Systems Engineer", st: "In Focus", t: "warning" as const, tz: "San Francisco (22:42)", acts: "2 active tasks • CRDT" },
          { n: "Elena Rostova", r: "Lead Product Designer", st: "Online", t: "success" as const, tz: "Berlin (07:42)", acts: "5 active tasks • Tokens" }
        ],
        [
          { n: "David Kim", r: "Frontend Infrastructure", st: "Away", t: "neutral" as const, tz: "London (06:42)", acts: "3 active tasks • SQLite" },
          { n: "Aria Thorne", r: "Machine Learning Researcher", st: "Online", t: "success" as const, tz: "Zurich (08:42)", acts: "Agent plan tree tooling" },
          { n: "Lucas Morales", r: "Security & Compliance Lead", st: "Online", t: "success" as const, tz: "Austin (00:42)", acts: "SOC-2 Type II Audit" }
        ]
      ];

      for (const row of members) {
        const r = figma.createFrame(); r.layoutMode = "HORIZONTAL"; r.itemSpacing = 18; r.fills = [];
        for (const m of row) {
          const c = createCard(485, 240, 20, C.surface);
          c.layoutMode = "VERTICAL"; c.itemSpacing = 12;

          const top = figma.createFrame(); top.layoutMode = "HORIZONTAL"; top.counterAxisAlignItems = "CENTER"; top.itemSpacing = 12; top.fills = [];
          top.appendChild(createAvatar(m.n.slice(0, 2), 36, m.st === "Online"));

          const nameCol = figma.createFrame(); nameCol.layoutMode = "VERTICAL"; nameCol.itemSpacing = 2; nameCol.fills = [];
          nameCol.appendChild(createText(m.n, 14, "Semi Bold", C.textPrimary));
          nameCol.appendChild(createText(m.r, 11, "Regular", C.textMuted));
          top.appendChild(nameCol);

          createSpacer(top);
          top.appendChild(createBadge(m.st, m.t));
          c.appendChild(top);

          const div = figma.createFrame(); div.resize(445, 1); div.fills = [solidPaint(C.borderSubtle)]; c.appendChild(div);

          c.appendChild(createText(`Local Time: ${m.tz}`, 12, "Medium", C.textSecondary));
          c.appendChild(createText(`Assigned Work: ${m.acts}`, 12, "Regular", C.textMuted));

          const btnRow = figma.createFrame(); btnRow.layoutMode = "HORIZONTAL"; btnRow.itemSpacing = 8; btnRow.fills = [];
          btnRow.appendChild(createBtn("Direct Message", false, "SM"));
          btnRow.appendChild(createBtn("View Tasks", false, "SM"));
          c.appendChild(btnRow);

          r.appendChild(c);
        }
        grid.appendChild(r);
      }

      main.appendChild(grid);
      wrap.appendChild(main);
      field.appendChild(wrap);
    }
  );
}

// 37: Autonomous AI Agent Workspace
function buildBoard37(x: number, y: number) {
  return createSpecificationBoard(
    37,
    "Autonomous AI Agent Workspace",
    "Next-generation agentic pair programming workspace. Displays natural language intent input, execution plans, reasoning trace, and generated artifacts.",
    x, y,
    (field) => {
      const wrap = figma.createFrame(); wrap.resize(1776, 712); wrap.fills = []; wrap.layoutMode = "HORIZONTAL";
      wrap.appendChild(createMiniSidebar("Agent"));

      const main = figma.createFrame(); main.resize(1556, 712); main.fills = [];
      main.layoutMode = "VERTICAL"; main.paddingLeft = 32; main.paddingRight = 32; main.paddingTop = 24; main.paddingBottom = 24; main.itemSpacing = 16;

      const hr = figma.createFrame(); hr.layoutMode = "HORIZONTAL"; hr.counterAxisAlignItems = "CENTER"; hr.itemSpacing = 16; hr.fills = []; hr.resize(1492, 40);
      hr.appendChild(createText("Autonomous AI Agent Workspace", 20, "Semi Bold", C.textPrimary));
      hr.appendChild(createBadge("Model: Gemini 2.5 Pro", "info"));
      hr.appendChild(createBadge("Autonomy: Full Execution", "success"));
      createSpacer(hr);
      hr.appendChild(createBtn("History (14)", false, "SM"));
      hr.appendChild(createBtn("New Agent Task", true, "SM"));
      main.appendChild(hr);

      // Prompt Bar Card
      const pBar = createCard(1492, 60, 16, C.surfaceElevated);
      pBar.layoutMode = "HORIZONTAL"; pBar.counterAxisAlignItems = "CENTER"; pBar.itemSpacing = 14;
      pBar.appendChild(createText("✨ Investigate memory leak in WebSocket connection and generate verified patch PR...", 13, "Medium", C.textPrimary));
      createSpacer(pBar);
      pBar.appendChild(createBtn("Stop Execution", false, "SM"));
      main.appendChild(pBar);

      // Split: Reasoning Plan Tree (730) + Code Artifact (742)
      const split = figma.createFrame(); split.layoutMode = "HORIZONTAL"; split.itemSpacing = 20; split.fills = []; split.resize(1492, 530);

      const tree = createCard(730, 530, 20, C.surface);
      tree.layoutMode = "VERTICAL"; tree.itemSpacing = 14;
      tree.appendChild(createText("Autonomous Plan Execution Tree", 15, "Semi Bold", C.textPrimary));

      const steps = [
        { n: "Step 1: Inspect heap snapshot telemetry", d: "Identified 14 lingering WebSocket event listener bindings in SocketContext.jsx", st: "Done", t: "success" as const },
        { n: "Step 2: Isolate uncollected closures in useEffect", d: "Found missing cleanup closure in heartbeat listener ping loop", st: "Done", t: "success" as const },
        { n: "Step 3: Author patch in SocketContext.jsx", d: "Adding idempotent removeEventListener teardown block", st: "Running", t: "info" as const },
        { n: "Step 4: Execute regression test suite", d: "npm test -- tests/socket.test.js", st: "Pending", t: "neutral" as const }
      ];
      for (const s of steps) {
        const sc = createCard(690, 85, 12, C.surfaceElevated);
        sc.layoutMode = "VERTICAL"; sc.itemSpacing = 6;
        const sh = figma.createFrame(); sh.layoutMode = "HORIZONTAL"; sh.fills = [];
        sh.appendChild(createText(s.n, 13, "Semi Bold", C.textPrimary));
        createSpacer(sh);
        sh.appendChild(createBadge(s.st, s.t));
        sc.appendChild(sh);
        const sd = createText(s.d, 11, "Regular", C.textMuted); sd.resize(666, 32);
        sc.appendChild(sd);
        tree.appendChild(sc);
      }
      split.appendChild(tree);

      // Code Diff Preview
      const diff = createCard(742, 530, 20, C.pitch);
      diff.layoutMode = "VERTICAL"; diff.itemSpacing = 12;
      diff.appendChild(createText("Generated Diff • SocketContext.jsx", 13, "Semi Bold", C.textSecondary));

      const codeBox = createCard(702, 450, 16, C.deep);
      codeBox.layoutMode = "VERTICAL"; codeBox.itemSpacing = 6;
      codeBox.appendChild(createText("@@ -42,6 +42,12 @@ export function SocketProvider({ children }) {", 11, "Regular", C.textMuted));
      codeBox.appendChild(createText("     socket.on('message', handleIncomingDelta);", 11, "Regular", C.textBody));
      codeBox.appendChild(createText("+    return () => {", 11, "Medium", C.online));
      codeBox.appendChild(createText("+      socket.off('message', handleIncomingDelta);", 11, "Medium", C.online));
      codeBox.appendChild(createText("+      socket.close();", 11, "Medium", C.online));
      codeBox.appendChild(createText("+    };", 11, "Medium", C.online));
      codeBox.appendChild(createText("   }, [socket]);", 11, "Regular", C.textBody));

      const apprRow = figma.createFrame(); apprRow.layoutMode = "HORIZONTAL"; apprRow.counterAxisAlignItems = "CENTER"; apprRow.itemSpacing = 12; apprRow.fills = []; apprRow.paddingTop = 18;
      apprRow.appendChild(createBtn("Approve & Commit Patch", true, "SM"));
      apprRow.appendChild(createBtn("Reject", false, "SM"));
      codeBox.appendChild(apprRow);

      diff.appendChild(codeBox);
      split.appendChild(diff);

      main.appendChild(split);
      wrap.appendChild(main);
      field.appendChild(wrap);
    }
  );
}

// 38: Notification Center & Activity Inbox
function buildBoard38(x: number, y: number) {
  return createSpecificationBoard(
    38,
    "Notification Center & Activity Inbox",
    "Context-aware notification hub for mentions, review requests, blocker alerts, and team broadcasts with keyboard-driven triage.",
    x, y,
    (field) => {
      const wrap = figma.createFrame(); wrap.resize(1776, 712); wrap.fills = []; wrap.layoutMode = "HORIZONTAL";
      wrap.appendChild(createMiniSidebar("Inbox"));

      const main = figma.createFrame(); main.resize(1556, 712); main.fills = [];
      main.layoutMode = "VERTICAL"; main.paddingLeft = 32; main.paddingRight = 32; main.paddingTop = 24; main.paddingBottom = 24; main.itemSpacing = 16;

      const hr = figma.createFrame(); hr.layoutMode = "HORIZONTAL"; hr.counterAxisAlignItems = "CENTER"; hr.itemSpacing = 16; hr.fills = []; hr.resize(1492, 40);
      hr.appendChild(createText("Notification Center & Activity Inbox", 20, "Semi Bold", C.textPrimary));
      createSpacer(hr);
      hr.appendChild(createBadge("4 Unread", "warning"));
      hr.appendChild(createBtn("Mark All as Read", false, "SM"));
      main.appendChild(hr);

      // Tabs
      const tabs = figma.createFrame(); tabs.layoutMode = "HORIZONTAL"; tabs.itemSpacing = 16; tabs.fills = [];
      tabs.appendChild(createBadge("Inbox (4)", "info"));
      tabs.appendChild(createBadge("Mentions (2)", "neutral"));
      tabs.appendChild(createBadge("Review Requests (1)", "neutral"));
      tabs.appendChild(createBadge("Archived", "neutral"));
      main.appendChild(tabs);

      // Split: Inbox List (800) + Detail View (672)
      const split = figma.createFrame(); split.layoutMode = "HORIZONTAL"; split.itemSpacing = 20; split.fills = []; split.resize(1492, 540);

      const list = createCard(800, 540, 0, C.surface);
      list.layoutMode = "VERTICAL"; list.itemSpacing = 0;

      const notifs = [
        { u: "Marcus Vance", act: "requested your review on PR #182 (CRDT tree rebase)", t: "12m ago", unread: true },
        { u: "Sarah Chen", act: "mentioned you in KRI-101: 'Can you verify token mapping with Clerk?'", t: "45m ago", unread: true },
        { u: "Kriri Agent", act: "generated proposed patch for WebSocket heartbeat leak", t: "1h ago", unread: true },
        { u: "GitHub Action", act: "production build #842 completed successfully", t: "3h ago", unread: false },
        { u: "Elena Rostova", act: "assigned KRI-103 (Figma Variables) to you", t: "1d ago", unread: false }
      ];
      for (let i = 0; i < notifs.length; i++) {
        const item = notifs[i];
        const nr = figma.createFrame(); nr.resize(800, 85);
        nr.fills = [solidPaint(item.unread ? C.surfaceElevated : C.surface)];
        nr.layoutMode = "HORIZONTAL"; nr.counterAxisAlignItems = "CENTER"; nr.paddingLeft = 20; nr.paddingRight = 20; nr.itemSpacing = 14;

        if (item.unread) {
          const dot = figma.createEllipse(); dot.resize(6, 6); dot.fills = [solidPaint(C.info)]; nr.appendChild(dot);
        } else {
          const sp = figma.createFrame(); sp.resize(6, 6); sp.fills = []; nr.appendChild(sp);
        }

        nr.appendChild(createAvatar(item.u.slice(0, 2), 30, true));

        const tc = figma.createFrame(); tc.layoutMode = "VERTICAL"; tc.itemSpacing = 4; tc.fills = []; tc.resize(620, 48);
        const nh = figma.createFrame(); nh.layoutMode = "HORIZONTAL"; nh.fills = [];
        nh.appendChild(createText(item.u, 13, "Semi Bold", C.textPrimary));
        createSpacer(nh);
        nh.appendChild(createText(item.t, 11, "Regular", C.textMuted));
        tc.appendChild(nh);
        tc.appendChild(createText(item.act, 12, "Regular", C.textSecondary));
        nr.appendChild(tc);

        list.appendChild(nr);
      }
      split.appendChild(list);

      // Detail Pane
      const detail = createCard(672, 540, 24, C.surfaceElevated);
      detail.layoutMode = "VERTICAL"; detail.itemSpacing = 16;
      detail.appendChild(createBadge("PR REVIEW REQUEST", "warning"));
      detail.appendChild(createText("PR #182: Add CRDT state rebase algorithm", 16, "Bold", C.textPrimary));
      detail.appendChild(createText("Marcus Vance requested your approval on commit 7a8f9b.", 12, "Regular", C.textMuted));

      const commentBox = createCard(624, 180, 16, C.deep);
      commentBox.layoutMode = "VERTICAL"; commentBox.itemSpacing = 8;
      commentBox.appendChild(createText("Marcus Vance • 12m ago:", 11, "Semi Bold", C.info));
      const comText = createText("Hey Sarah, could you double-check the concurrency test for multi-client edits? The fuzz test passed with 50 concurrent virtual users under 12ms latency.", 12, "Regular", C.textBody);
      comText.resize(592, 60); commentBox.appendChild(comText);
      detail.appendChild(commentBox);

      const dActions = figma.createFrame(); dActions.layoutMode = "HORIZONTAL"; dActions.itemSpacing = 12; dActions.fills = [];
      dActions.appendChild(createBtn("Approve PR", true, "SM"));
      dActions.appendChild(createBtn("Request Changes", false, "SM"));
      dActions.appendChild(createBtn("Archive (E)", false, "SM"));
      detail.appendChild(dActions);

      split.appendChild(detail);

      main.appendChild(split);
      wrap.appendChild(main);
      field.appendChild(wrap);
    }
  );
}

// 39: Dedicated Workspace Settings
function buildBoard39(x: number, y: number) {
  return createSpecificationBoard(
    39,
    "Dedicated Workspace Settings",
    "Full-screen administrative environment for managing team permissions, security policies, API integrations, and billing tiers.",
    x, y,
    (field) => {
      const wrap = figma.createFrame(); wrap.resize(1776, 712); wrap.fills = []; wrap.layoutMode = "HORIZONTAL";
      wrap.appendChild(createMiniSidebar("Settings"));

      // Settings Sub-sidebar (240w)
      const subNav = figma.createFrame(); subNav.resize(240, 712); subNav.fills = [solidPaint(C.deep)];
      subNav.layoutMode = "VERTICAL"; subNav.paddingLeft = 20; subNav.paddingRight = 20; subNav.paddingTop = 24; subNav.itemSpacing = 6;
      subNav.appendChild(createText("WORKSPACE PREFERENCES", 11, "Semi Bold", C.textMuted));

      const sTabs = ["General", "Members & Roles", "Security & SSO", "Integrations", "Billing & Plans", "Developer API"];
      for (let i = 0; i < sTabs.length; i++) {
        const item = sTabs[i];
        const row = figma.createFrame(); row.resize(200, 32); row.cornerRadius = 6;
        row.layoutMode = "HORIZONTAL"; row.counterAxisAlignItems = "CENTER"; row.paddingLeft = 10; row.paddingRight = 10;
        row.fills = [solidPaint(i === 0 ? C.surfaceElevated : C.deep)];
        row.appendChild(createText(item, 12, i === 0 ? "Medium" : "Regular", i === 0 ? C.textPrimary : C.textSecondary));
        subNav.appendChild(row);
      }
      wrap.appendChild(subNav);

      // Settings Content Form (1316w)
      const form = figma.createFrame(); form.resize(1316, 712); form.fills = [];
      form.layoutMode = "VERTICAL"; form.paddingLeft = 40; form.paddingRight = 40; form.paddingTop = 28; form.itemSpacing = 24;

      form.appendChild(createText("General Workspace Profile", 20, "Bold", C.textPrimary));

      // Field 1: Name
      const f1 = figma.createFrame(); f1.layoutMode = "VERTICAL"; f1.itemSpacing = 6; f1.fills = [];
      f1.appendChild(createText("Workspace Name", 12, "Medium", C.textSecondary));
      const in1 = createCard(640, 42, 12, C.surface); in1.appendChild(createText("Kriri Systems Engineering", 13, "Regular", C.textPrimary)); f1.appendChild(in1);
      form.appendChild(f1);

      // Field 2: Slug
      const f2 = figma.createFrame(); f2.layoutMode = "VERTICAL"; f2.itemSpacing = 6; f2.fills = [];
      f2.appendChild(createText("Workspace URL Slug", 12, "Medium", C.textSecondary));
      const in2 = createCard(640, 42, 12, C.surface); in2.appendChild(createText("app.kriri.io/kriri-systems", 13, "Regular", C.textMuted)); f2.appendChild(in2);
      form.appendChild(f2);

      // Ergonomics Section
      form.appendChild(createText("Ergonomics & Kinetic Feedback", 16, "Semi Bold", C.textPrimary));

      const opt1 = createCard(640, 60, 16, C.surface); opt1.layoutMode = "HORIZONTAL"; opt1.counterAxisAlignItems = "CENTER";
      opt1.appendChild(createText("Sub-10ms Kinetic Motion Engine", 13, "Medium", C.textPrimary));
      createSpacer(opt1);
      opt1.appendChild(createBadge("Enabled", "success"));
      form.appendChild(opt1);

      const opt2 = createCard(640, 60, 16, C.surface); opt2.layoutMode = "HORIZONTAL"; opt2.counterAxisAlignItems = "CENTER";
      opt2.appendChild(createText("Audio Earcons on Issue Complete", 13, "Medium", C.textPrimary));
      createSpacer(opt2);
      opt2.appendChild(createBadge("Stereo Muted", "neutral"));
      form.appendChild(opt2);

      const saveRow = figma.createFrame(); saveRow.layoutMode = "HORIZONTAL"; saveRow.itemSpacing = 12; saveRow.fills = []; saveRow.paddingTop = 16;
      saveRow.appendChild(createBtn("Save Preferences", true, "MD"));
      saveRow.appendChild(createBtn("Cancel", false, "MD"));
      form.appendChild(saveRow);

      wrap.appendChild(form);
      field.appendChild(wrap);
    }
  );
}

// 40: Product Features & Integrations
function buildBoard40(x: number, y: number) {
  return createSpecificationBoard(
    40,
    "Product Features & Integrations",
    "Marketing and documentation surfaces detailing Kriri's architectural pillars and pre-built integrations with third-party developer tools.",
    x, y,
    (field) => {
      const hero = figma.createFrame(); hero.resize(1776, 712); hero.fills = [];
      hero.layoutMode = "VERTICAL"; hero.itemSpacing = 24;
      hero.paddingLeft = 64; hero.paddingRight = 64; hero.paddingTop = 32; hero.paddingBottom = 32;

      // Nav Bar
      const nav = figma.createFrame(); nav.layoutMode = "HORIZONTAL"; nav.counterAxisAlignItems = "CENTER"; nav.itemSpacing = 24; nav.fills = []; nav.resize(1648, 40);
      nav.appendChild(createText("Kriri Platform Architecture", 18, "Bold", C.textPrimary));
      createSpacer(nav);
      nav.appendChild(createText("Pillars: Kinetic Speed • Autonomy • Interoperability", 12, "Medium", C.info));
      hero.appendChild(nav);

      // 4 Pillars Grid
      const pGrid = figma.createFrame(); pGrid.layoutMode = "HORIZONTAL"; pGrid.itemSpacing = 20; pGrid.fills = [];
      const feats = [
        { t: "Sub-10ms Delta Reactivity", d: "Zero-latency UI updates powered by optimistic client mutations and conflict-free replicated data trees." },
        { t: "Autonomous AI Execution", d: "Deeply integrated pair programmer executing bash scripts, diagnosing memory leaks, and pushing PRs." },
        { t: "Multiplayer Presence Gate", d: "Real-time avatar stacking, live typing indicators, and timezone-aware local availability indicators." },
        { t: "Enterprise Cryptographic Audit", d: "SOC-2 Type II compliant immutable audit logs verifying every database transaction and permission change." }
      ];
      for (const ft of feats) {
        const c = createCard(397, 180, 20, C.surface);
        c.layoutMode = "VERTICAL"; c.itemSpacing = 10;
        c.appendChild(createBadge("CORE ENGINE", "info"));
        c.appendChild(createText(ft.t, 15, "Semi Bold", C.textPrimary));
        const cd = createText(ft.d, 12, "Regular", C.textMuted); cd.resize(357, 60);
        c.appendChild(cd);
        pGrid.appendChild(c);
      }
      hero.appendChild(pGrid);

      // Integrations Section
      hero.appendChild(createText("Native Third-Party Ecosystem Integrations", 16, "Semi Bold", C.textPrimary));

      const intRow = figma.createFrame(); intRow.layoutMode = "HORIZONTAL"; intRow.itemSpacing = 16; intRow.fills = [];
      const ints = [
        { n: "GitHub Enterprise", d: "Bi-directional PR & commit linking", st: "Connected", t: "success" as const },
        { n: "Linear Project Sync", d: "Dual-write issue synchronization", st: "Connected", t: "success" as const },
        { n: "Slack Broadcasts", d: "Urgent blocker thread webhooks", st: "Connected", t: "success" as const },
        { n: "Sentry Error Triage", d: "Automatic crash issue generation", st: "Available", t: "info" as const },
        { n: "Figma Variables API", d: "Design tokens to CSS export", st: "Connected", t: "success" as const }
      ];
      for (const it of ints) {
        const ic = createCard(316, 120, 16, C.surfaceElevated);
        ic.layoutMode = "VERTICAL"; ic.itemSpacing = 8;
        const ih = figma.createFrame(); ih.layoutMode = "HORIZONTAL"; ih.fills = [];
        ih.appendChild(createText(it.n, 13, "Semi Bold", C.textPrimary));
        createSpacer(ih);
        ih.appendChild(createBadge(it.st, it.t));
        ic.appendChild(ih);
        const id = createText(it.d, 11, "Regular", C.textMuted); id.resize(284, 32);
        ic.appendChild(id);
        intRow.appendChild(ic);
      }
      hero.appendChild(intRow);

      field.appendChild(hero);
    }
  );
}

// 41: Pricing & Subscription Plans
function buildBoard41(x: number, y: number) {
  return createSpecificationBoard(
    41,
    "Pricing & Subscription Plans",
    "Commercial packaging displaying free, professional, and enterprise tiers with annual discount toggles and detailed feature matrices.",
    x, y,
    (field) => {
      const hero = figma.createFrame(); hero.resize(1776, 712); hero.fills = [];
      hero.layoutMode = "VERTICAL"; hero.itemSpacing = 28;
      hero.paddingLeft = 72; hero.paddingRight = 72; hero.paddingTop = 40; hero.paddingBottom = 40;

      // Header
      const head = figma.createFrame(); head.layoutMode = "VERTICAL"; head.itemSpacing = 8; head.counterAxisAlignItems = "CENTER"; head.fills = []; head.resize(1632, 90);
      head.appendChild(createBadge("TRANSPARENT ENGINEERING PRICING", "info"));
      head.appendChild(createText("Predictable pricing designed for scale.", 28, "Bold", C.textPrimary));
      head.appendChild(createText("Start building with individual autonomy and scale effortlessly to enterprise organizations.", 14, "Regular", C.textMuted));
      hero.appendChild(head);

      // 3 Tier Cards
      const tiers = figma.createFrame(); tiers.layoutMode = "HORIZONTAL"; tiers.itemSpacing = 24; tiers.fills = [];

      const t1 = createCard(528, 480, 28, C.surface);
      t1.layoutMode = "VERTICAL"; t1.itemSpacing = 16;
      t1.appendChild(createText("Starter", 16, "Semi Bold", C.textSecondary));
      t1.appendChild(createText("$0 / mo", 32, "Bold", C.textPrimary));
      t1.appendChild(createText("Ideal for independent builders and small open-source teams.", 13, "Regular", C.textMuted));
      const fList1 = ["Unlimited tasks and issues", "1 Autonomous AI Agent worker", "Sub-10ms local responsive sync", "Community Discord support"];
      for (const item of fList1) {
        const ir = figma.createFrame(); ir.layoutMode = "HORIZONTAL"; ir.counterAxisAlignItems = "CENTER"; ir.itemSpacing = 8; ir.fills = [];
        const dot = figma.createEllipse(); dot.resize(5, 5); dot.fills = [solidPaint(C.online)]; ir.appendChild(dot);
        ir.appendChild(createText(item, 12, "Regular", C.textBody));
        t1.appendChild(ir);
      }
      createSpacer(t1);
      const btn1 = createBtn("Get Started Free", false, "MD"); btn1.resize(472, 44); t1.appendChild(btn1);
      tiers.appendChild(t1);

      // Pro (Featured)
      const t2 = createCard(528, 480, 28, C.surfaceElevated);
      t2.strokes = [solidPaint(C.info)]; t2.strokeWeight = 2;
      t2.layoutMode = "VERTICAL"; t2.itemSpacing = 16;
      const t2h = figma.createFrame(); t2h.layoutMode = "HORIZONTAL"; t2h.fills = [];
      t2h.appendChild(createText("Pro Tier", 16, "Semi Bold", C.textPrimary));
      createSpacer(t2h);
      t2h.appendChild(createBadge("MOST POPULAR", "info"));
      t2.appendChild(t2h);
      t2.appendChild(createText("$12 / user / mo", 32, "Bold", C.textPrimary));
      t2.appendChild(createText("Everything fast-moving engineering startups need for rapid velocity.", 13, "Regular", C.textMuted));
      const fList2 = ["Unlimited AI Agent workers", "Real-time multiplayer presence", "Bi-directional GitHub & Linear sync", "SOC-2 Type II audit report", "Priority 24/7 engineering SLA"];
      for (const item of fList2) {
        const ir = figma.createFrame(); ir.layoutMode = "HORIZONTAL"; ir.counterAxisAlignItems = "CENTER"; ir.itemSpacing = 8; ir.fills = [];
        const dot = figma.createEllipse(); dot.resize(5, 5); dot.fills = [solidPaint(C.online)]; ir.appendChild(dot);
        ir.appendChild(createText(item, 12, "Medium", C.textPrimary));
        t2.appendChild(ir);
      }
      createSpacer(t2);
      const btn2 = createBtn("Start 14-Day Pro Trial", true, "MD"); btn2.resize(472, 44); t2.appendChild(btn2);
      tiers.appendChild(t2);

      // Enterprise
      const t3 = createCard(528, 480, 28, C.surface);
      t3.layoutMode = "VERTICAL"; t3.itemSpacing = 16;
      t3.appendChild(createText("Enterprise", 16, "Semi Bold", C.textSecondary));
      t3.appendChild(createText("Custom Quote", 32, "Bold", C.textPrimary));
      t3.appendChild(createText("Custom compliance, dedicated VPC infrastructure, and 99.99% uptime guarantee.", 13, "Regular", C.textMuted));
      const fList3 = ["Custom SAML / Okta SSO", "Dedicated single-tenant infrastructure", "Custom LLM fine-tuning", "Dedicated solutions architect"];
      for (const item of fList3) {
        const ir = figma.createFrame(); ir.layoutMode = "HORIZONTAL"; ir.counterAxisAlignItems = "CENTER"; ir.itemSpacing = 8; ir.fills = [];
        const dot = figma.createEllipse(); dot.resize(5, 5); dot.fills = [solidPaint(C.online)]; ir.appendChild(dot);
        ir.appendChild(createText(item, 12, "Regular", C.textBody));
        t3.appendChild(ir);
      }
      createSpacer(t3);
      const btn3 = createBtn("Contact Enterprise Sales", false, "MD"); btn3.resize(472, 44); t3.appendChild(btn3);
      tiers.appendChild(t3);

      hero.appendChild(tiers);
      field.appendChild(hero);
    }
  );
}

// 42: Changelog, Company & Support
function buildBoard42(x: number, y: number) {
  return createSpecificationBoard(
    42,
    "Changelog, Company & Support",
    "Public release log documenting weekly version increments, engineering team background, and direct sales/support inquiry channels.",
    x, y,
    (field) => {
      const hero = figma.createFrame(); hero.resize(1776, 712); hero.fills = [];
      hero.layoutMode = "HORIZONTAL"; hero.itemSpacing = 36;
      hero.paddingLeft = 64; hero.paddingRight = 64; hero.paddingTop = 40; hero.paddingBottom = 40;

      // Left: Changelog (1040w)
      const clBox = createCard(1040, 632, 28, C.surface);
      clBox.layoutMode = "VERTICAL"; clBox.itemSpacing = 20;

      const clHead = figma.createFrame(); clHead.layoutMode = "HORIZONTAL"; clHead.counterAxisAlignItems = "CENTER"; clHead.fills = [];
      clHead.appendChild(createText("Kriri Product Releases & Changelog", 18, "Bold", C.textPrimary));
      createSpacer(clHead);
      clHead.appendChild(createBadge("Weekly Friday Releases", "info"));
      clBox.appendChild(clHead);

      const logs = [
        { v: "v1.4.0 • November 8, 2026", t: "Autonomous Agent Execution Tree & Step Approvals", d: "Introduces full natural language decomposition of engineering tasks with interactive approval gates and syntax-highlighted diffs." },
        { v: "v1.3.2 • November 1, 2026", t: "Sub-10ms Kinetic Motion Engine & Sound Tokens", d: "Shipped low-latency DOM animations and subtle stereo audio cues on issue completion and task focus mode." },
        { v: "v1.3.0 • October 24, 2026", t: "Clerk Enterprise SSO & Multi-Tenant Invitations", d: "Added seamless Google/GitHub authentication with automatic organization provisioning and team member invitation flows." }
      ];
      for (const log of logs) {
        const lc = createCard(984, 130, 16, C.surfaceElevated);
        lc.layoutMode = "VERTICAL"; lc.itemSpacing = 6;
        lc.appendChild(createText(log.v, 11, "Semi Bold", C.info));
        lc.appendChild(createText(log.t, 14, "Semi Bold", C.textPrimary));
        const ld = createText(log.d, 12, "Regular", C.textMuted); ld.resize(952, 40);
        lc.appendChild(ld);
        clBox.appendChild(lc);
      }
      hero.appendChild(clBox);

      // Right: Contact & Sales (572w)
      const ctBox = createCard(572, 632, 28, C.surfaceElevated);
      ctBox.layoutMode = "VERTICAL"; ctBox.itemSpacing = 16;
      ctBox.appendChild(createBadge("GET IN TOUCH", "success"));
      ctBox.appendChild(createText("Contact Engineering & Sales", 18, "Bold", C.textPrimary));
      ctBox.appendChild(createText("Have questions about our autonomous agent architecture or enterprise deployment?", 13, "Regular", C.textMuted));

      const emL = createText("Work Email", 11, "Medium", C.textSecondary); ctBox.appendChild(emL);
      const emI = createCard(516, 42, 12, C.deep); emI.appendChild(createText("alex@company.com", 12, "Regular", C.textPrimary)); ctBox.appendChild(emI);

      const orgL = createText("Team Size", 11, "Medium", C.textSecondary); ctBox.appendChild(orgL);
      const orgI = createCard(516, 42, 12, C.deep); orgI.appendChild(createText("20–50 Engineers", 12, "Regular", C.textPrimary)); ctBox.appendChild(orgI);

      const msgL = createText("Inquiry Message", 11, "Medium", C.textSecondary); ctBox.appendChild(msgL);
      const msgI = createCard(516, 100, 12, C.deep); msgI.appendChild(createText("Tell us about your engineering stack and security requirements...", 12, "Regular", C.textMuted)); ctBox.appendChild(msgI);

      const sendBtn = createBtn("Submit Inquiry →", true, "MD"); sendBtn.resize(516, 46); ctBox.appendChild(sendBtn);

      hero.appendChild(ctBox);
      field.appendChild(hero);
    }
  );
}

// ---------------------------------------------------------------------------
// MAIN EXECUTION
// ---------------------------------------------------------------------------
figma.showUI(__html__, { width: PANEL_WIDTH, height: PANEL_HEIGHT });

figma.ui.onmessage = async (msg: { type: string }) => {
  if (msg.type === "generate-boards") {
    try {
      figma.ui.postMessage({ type: "progress", text: "Loading typography..." });
      await ensureFonts();

      // Switch to specification page if available
      const specPage = figma.root.children.find((p) => p.id === "60:2" || p.name.includes("Specification v1"));
      if (specPage) {
        figma.currentPage = specPage;
      }

      figma.ui.postMessage({ type: "progress", text: "Cleaning old nodes..." });
      for (const child of figma.currentPage.children) {
        if (child.id === "126:3" || child.name === "Code") {
          child.remove();
        }
      }

      // 15 Boards starting from Landing Page to the last page in the app
      const boardPlan = [
        { num: 28, fn: buildBoard28, x: 12240, y: 7240, name: "28 / Application / Landing Page & Public Surfaces" },
        { num: 29, fn: buildBoard29, x: 6120, y: 8440, name: "29 / Application / Authentication & Workspace Onboarding" },
        { num: 30, fn: buildBoard30, x: 8160, y: 8440, name: "30 / Application / Executive Engineering Dashboard" },
        { num: 31, fn: buildBoard31, x: 10200, y: 8440, name: "31 / Application / Tasks & Issue Management" },
        { num: 32, fn: buildBoard32, x: 12240, y: 8440, name: "32 / Application / Sprint Board & Kanban Lanes" },
        { num: 33, fn: buildBoard33, x: 6120, y: 9640, name: "33 / Application / Projects & Portfolio Hub" },
        { num: 34, fn: buildBoard34, x: 8160, y: 9640, name: "34 / Application / Project Details & Milestones" },
        { num: 35, fn: buildBoard35, x: 10200, y: 9640, name: "35 / Application / Velocity & Performance Analytics" },
        { num: 36, fn: buildBoard36, x: 12240, y: 9640, name: "36 / Application / Team Directory & Live Presence Gate" },
        { num: 37, fn: buildBoard37, x: 6120, y: 10840, name: "37 / Application / Autonomous AI Agent Workspace" },
        { num: 38, fn: buildBoard38, x: 8160, y: 10840, name: "38 / Application / Notification Center & Activity Inbox" },
        { num: 39, fn: buildBoard39, x: 10200, y: 10840, name: "39 / Application / Dedicated Workspace Settings" },
        { num: 40, fn: buildBoard40, x: 12240, y: 10840, name: "40 / Application / Product Features & Integrations" },
        { num: 41, fn: buildBoard41, x: 6120, y: 12040, name: "41 / Application / Pricing & Subscription Plans" },
        { num: 42, fn: buildBoard42, x: 8160, y: 12040, name: "42 / Application / Changelog, Company & Support" },
      ];

      const created: SceneNode[] = [];
      for (const bp of boardPlan) {
        figma.ui.postMessage({ type: "progress", text: `Building Board ${bp.num} (${bp.name.split("/")[2]?.trim()})...` });
        const existing = figma.currentPage.findOne((n) => n.name.startsWith(`${bp.num} / Application`));
        if (existing) { existing.remove(); }
        const b = bp.fn(bp.x, bp.y);
        figma.currentPage.appendChild(b);
        created.push(b);
      }

      figma.currentPage.selection = created;
      figma.viewport.scrollAndZoomIntoView(created);

      figma.ui.postMessage({
        type: "complete",
        text: "All 15 application boards (28–42) placed in the canvas matrix!",
      });
    } catch (err: unknown) {
      figma.ui.postMessage({
        type: "error",
        text: err instanceof Error ? err.message : String(err),
      });
    }
  }
};
'''

full_code = code_content + builders
with open('/Users/jones/Downloads/kriri/figma-plugin/code.ts', 'w') as f:
    f.write(full_code)

print(f"Generated code.ts with {len(full_code)} bytes")
