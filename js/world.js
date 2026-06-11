// ============================================================
// ISKANDER — world: terrain, biomes, the Wall, the Hunger Front,
// waves, ore nodes, relics, interactions
// ============================================================
const TS = 16, COLS = 320, WORLD_W = COLS * TS;   // 5120 px of scrolling world
const WATER_Y = 224;
const BREACH_X = 5020;

// Act palettes: [Hellenic dawn, Eastern marches, Roof of the World]
const ACTS = [
  { top: '#7ec0d8', bot: '#f6c87a', far: '#cfa863', mid: '#a8743f', ground: '#8a5a33', dirt: '#6b4426', grass: '#c8a34e', fg: '#503320' },
  { top: '#9f8fae', bot: '#d8a35e', far: '#b08a52', mid: '#7d5f43', ground: '#74543a', dirt: '#594031', grass: '#9c8648', fg: '#443528' },
  { top: '#252c44', bot: '#7787a0', far: '#9fb2c4', mid: '#56657d', ground: '#5d6573', dirt: '#454c59', grass: '#dfe8ef', fg: '#1d2434' },
];
// 0..2 act parameter with blend windows
function zoneT(x) {
  if (x < 1350) return 0;
  if (x < 1650) return (x - 1350) / 300;
  if (x < 3050) return 1;
  if (x < 3350) return 1 + (x - 3050) / 300;
  return 2;
}
function palAt(x) {
  const t = zoneT(x);
  const a = ACTS[Math.floor(clamp(t, 0, 1.999))], b = ACTS[Math.ceil(clamp(t, 0.001, 2))];
  const f = t - Math.floor(t);
  const out = {};
  for (const k in a) out[k] = mixc(a[k], b[k], f);
  return out;
}

G.world = null;
G.wall = null;
G.front = null;
G.waveSys = null;

function initWorld() {
  const R = G.srand;
  const ground = new Array(COLS);
  const water = new Array(COLS).fill(false);

  // rivers (jump them with dash, or earn Anointed Stride and walk across)
  for (let c = 74; c <= 78; c++) water[c] = true;     // Nile branch, Act I
  for (let c = 162; c <= 166; c++) water[c] = true;   // steppe river, Act II

  for (let c = 0; c < COLS; c++) {
    const x = c * TS;
    let h;
    if (x < 1500) h = 206 - qz(Math.sin(c * 0.18) * 14, 4);
    else if (x < 3200) h = 214 - qz(Math.sin(c * 0.07) * 6, 4);
    else if (x < 3840) h = qz(lerp(214, 180, (x - 3200) / 640), 4);
    else if (x < 4160) h = 180;                        // the Wall's ledge
    else if (x < 4760) h = 180 - qz(Math.sin(c * 0.31) * 10, 4);
    else h = 172 + qz(Math.sin(c * 0.5) * 6, 4);       // breach plateau
    ground[c] = h;
  }
  // limit step size so the hero can always walk/jump the terrain
  for (let c = 1; c < COLS; c++) {
    if (water[c] || water[c - 1]) continue;
    const d = ground[c] - ground[c - 1];
    if (d > 12) ground[c] = ground[c - 1] + 12;
    if (d < -12) ground[c] = ground[c - 1] - 12;
  }

  // one-way platforms
  const plats = [];
  function plat(x, y, w) { plats.push({ x: x, y: y, w: w, h: 4 }); }
  plat(310, 168, 52); plat(540, 150, 44); plat(742, 158, 56);
  plat(1168, 196, 36);                                 // broken bridge over the Nile
  plat(1232, 196, 40);
  plat(1950, 176, 52); plat(2150, 160, 44); plat(2380, 176, 56);
  plat(2580, 196, 36); plat(2660, 196, 36);            // steppe river pontoons
  plat(3120, 176, 48); plat(3520, 150, 44);
  plat(4250, 140, 40); plat(4430, 128, 44); plat(4620, 120, 44);
  plat(4850, 132, 48);

  // cracked rocks: metroidvania gates for Besieger / Horns of Ammon
  const rocks = [
    { x: 1496, w: 18, h: 36, broken: false, hp: 3 },
    { x: 2848, w: 18, h: 36, broken: false, hp: 3 },
    { x: 4296, w: 18, h: 40, broken: false, hp: 3 },
  ];
  for (const r of rocks) r.y = ground[Math.floor(r.x / TS)] - r.h;

  // relics grant Mythos
  const relicXs = [330, 760, 1200, 1540, 1975, 2400, 2640, 2890, 3140, 4640, 4880];
  const relics = relicXs.map(function (x) {
    let y = ground[Math.floor(x / TS)] - 12;
    for (const p of plats) if (x >= p.x && x <= p.x + p.w) y = Math.min(y, p.y - 12);
    if (water[Math.floor(x / TS)]) y = WATER_Y - 12;   // the river relic needs Anointed Stride
    return { x: x, y: y, got: false };
  });

  // ore nodes east of the Wall (sortie loot)
  const nodes = [];
  function node(x, type) {
    nodes.push({ x: x, y: ground[Math.floor(x / TS)] - 8, type: type, amt: 3, prog: 0, respawn: 0 });
  }
  node(4210, 'iron'); node(4360, 'iron'); node(4470, 'iron'); node(4560, 'iron');
  node(4680, 'iron'); node(4790, 'iron');
  node(4730, 'brass'); node(4860, 'brass'); node(4950, 'brass'); node(5010, 'brass');

  // captive engineer cages (break them open)
  const cages = [
    { x: 4520, w: 18, h: 20, hp: 6, freed: false },
    { x: 4920, w: 18, h: 20, hp: 6, freed: false },
  ];
  for (const cg of cages) cg.y = ground[Math.floor(cg.x / TS)] - cg.h;

  // scenery decorations, placed deterministically
  const decos = [];
  for (let c = 2; c < COLS - 2; c++) {
    const x = c * TS;
    if (water[c]) continue;
    const r = R();
    const t = zoneT(x);
    if (t < 0.5) {
      if (r < 0.05) decos.push({ x: x, type: 'column', h: 34 + qz(R() * 20, 4) });
      else if (r < 0.08) decos.push({ x: x, type: 'brokencol', h: 14 + qz(R() * 10, 2) });
      else if (r < 0.13) decos.push({ x: x, type: 'laurel', h: 10 });
    } else if (t < 1.5) {
      if (r < 0.03) decos.push({ x: x, type: 'yurt', h: 18 });
      else if (r < 0.07) decos.push({ x: x, type: 'bones', h: 6 });
      else if (r < 0.2) decos.push({ x: x, type: 'tuft', h: 7 });
    } else {
      if (r < 0.06 && (x < 3800 || x > 4180)) decos.push({ x: x, type: 'pine', h: 26 + qz(R() * 14, 2) });
      else if (r < 0.1) decos.push({ x: x, type: 'shard', h: 10 });
    }
  }

  G.world = {
    ground: ground, water: water, plats: plats, rocks: rocks,
    relics: relics, nodes: nodes, cages: cages, decos: decos,
    shrine: { x: 1450, used: false },
    camp: { x: 3380 },
  };

  // ---- the Wall: 8 segments spanning the pass ----
  const segs = [];
  const x0 = 3840, segW = 26;
  for (let i = 0; i < 8; i++) {
    segs.push({
      i: i, x: x0 + i * segW, w: segW,
      top: 124, base: 180,
      stage: 0, hp: 0, maxhp: 0, weak: false, garrison: false,
    });
  }
  G.wall = { x0: x0, segW: segW, segs: segs, gateIndex: 4 };
  G.wall.gateX = segs[4].x + segW / 2;
  G.world.braziers = [G.wall.gateX - 46, G.wall.gateX + 46];

  G.front = { x: 5060, base: 5060 };
  G.waveSys = { t: 75, wave: 0, active: false, warned: false, bossNext: false, bossT: 0 };
}

// ---------- terrain queries ----------
function terrainY(x, walkWater) {
  const c = clamp(Math.floor(x / TS), 0, COLS - 1);
  if (G.world.water[c]) return walkWater ? WATER_Y : 999;
  return G.world.ground[c];
}
// ground level under an entity (min over its feet span), incl. one-way platforms
function groundLevel(ent, walkWater) {
  let g = Math.min(
    terrainY(ent.x + 2, walkWater),
    terrainY(ent.x + ent.w / 2, walkWater),
    terrainY(ent.x + ent.w - 2, walkWater)
  );
  const feet = ent.y + ent.h;
  const all = G.world.plats.concat(G.brassPlats);
  for (const p of all) {
    if (ent.x + ent.w > p.x && ent.x < p.x + p.w && feet <= p.y + 6 && p.y < g) g = p.y;
  }
  return g;
}
// rects that stop enemies (the whole endgame thesis: walls)
function enemyBlockers() {
  const out = [];
  for (const s of G.wall.segs) {
    if (s.stage > 0) out.push({ x: s.x, y: s.top, w: s.w, h: s.base - s.top, kind: 'seg', ref: s });
  }
  for (const r of G.ramparts) out.push({ x: r.x, y: r.y, w: r.w, h: r.h, kind: 'rampart', ref: r });
  for (const e of G.echoes) out.push({ x: e.x - 4, y: e.y, w: 8, h: 20, kind: 'echo', ref: e });
  return out;
}
function solidRocks() {
  const out = [];
  for (const r of G.world.rocks) if (!r.broken) out.push(r);
  return out;
}

function damageSeg(seg, d) {
  if (seg.stage === 0) return;
  seg.hp -= d;
  if (seg.hp <= 0) {
    seg.stage = 0; seg.hp = 0; seg.garrison = false;
    for (let i = G.echoes.length - 1; i >= 0; i--) if (G.echoes[i].segI === seg.i) G.echoes.splice(i, 1);
    G.shake = Math.max(G.shake, 5);
    G.sfx.breakRock();
    msg('A WALL SEGMENT HAS FALLEN!', 3.5);
  }
}

// ---------- the Hunger Front (creeping corruption) ----------
function updateFront(dt) {
  const f = G.front;
  const allBrass = G.wall.segs.every(function (s) { return s.stage >= 2; });
  if (G.flags.bossDone || allBrass) {
    f.x = Math.min(f.x + 7 * dt, BREACH_X);          // the Wall holds; the static recedes
    return;
  }
  let spd = G.flags.reachedWall ? 1.1 + G.waveSys.wave * 0.13 : 0.45;
  const anyBuilt = G.wall.segs.some(function (s) { return s.stage > 0; });
  const wallEast = G.wall.x0 + 8 * G.wall.segW;
  if (anyBuilt && f.x < wallEast + 60) spd *= 0.25;   // even a partial wall slows the Fraying
  f.x -= spd * dt;
  if (f.x < G.world.camp.x + 60) {
    G.state = 'gameover';
    G.gameoverReason = 'The Fraying reached the forge-camp. The world de-rezzed, screen by screen.';
  }
}

// ---------- wave system (the doom-clock) ----------
function updateWaves(dt) {
  const ws = G.waveSys;
  if (!G.flags.reachedWall || G.boss || G.flags.bossDone) return;

  if (ws.active) {
    let alive = 0;
    for (const e of G.enemies) if (e.waveTag) alive++;
    if (alive === 0) {
      ws.active = false;
      G.stats.waves++;
      const bonus = 5 + ws.wave * 2;
      G.doxa += bonus;
      msg('WAVE ' + ws.wave + ' BROKEN  (+' + bonus + ' Doxa)', 3.5);
      ws.t = 75;
      ws.warned = false;
      // respawn some ore so the forge cycle keeps turning
      for (const n of G.world.nodes) if (n.amt <= 0 && Math.random() < 0.6) n.amt = 3;
      if (ws.wave >= 5 && G.wall.segs.every(function (s) { return s.stage >= 1; })) {
        ws.bossNext = true; ws.bossT = 18;
        msg('THE AURORA SCREAMS. SOMETHING VAST APPROACHES THE GATE.', 5);
      }
    }
    return;
  }
  if (ws.bossNext) {
    ws.bossT -= dt;
    if (ws.bossT <= 0) startBoss();
    return;
  }
  ws.t -= dt;
  if (ws.t < 12 && !ws.warned) { ws.warned = true; msg('THE HORDE STIRS BEYOND THE WALL...', 3.5); G.sfx.wave(); }
  if (ws.t <= 0) spawnWave();
}

function spawnWave() {
  const ws = G.waveSys;
  ws.wave++; ws.active = true;
  G.sfx.wave();
  msg('WAVE ' + ws.wave + ' — THE NUMBERLESS COME', 3.5);
  const w = ws.wave;
  const wallEast = G.wall.x0 + 8 * G.wall.segW;
  function sx() { return clamp(wallEast + 200 + Math.random() * 320, wallEast + 160, 5040); }
  for (let i = 0; i < 4 + w * 2; i++) spawnEnemy('numberless', sx(), true);
  for (let i = 0; i < Math.max(0, w - 1); i++) spawnEnemy('licker', sx(), true);
  if (w >= 2) for (let i = 0; i < 1 + Math.floor(w / 2); i++) spawnEnemy('biter', sx(), true);
  if (w % 3 === 0) spawnEnemy('echoborn', sx(), true);
}

// ---------- player interactions (E) ----------
function nearestSeg(px) {
  let best = null, bd = 26;
  for (const s of G.wall.segs) {
    const d = Math.abs(px - (s.x + s.w / 2));
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

function tryInteract(p, dt) {
  const held = G.keys.use, tapped = G.pressed.use;
  const px = p.x + p.w / 2;

  // --- pouring brass (channel; interruptible) ---
  if (p.pour) {
    const seg = p.pour.seg;
    if (!held || p.hurtT > 0 || Math.abs(px - (seg.x + seg.w / 2)) > 30) {
      if (p.pour.t > 0.4) { seg.weak = true; msg('THE POUR FAILED — a weak seam remains.', 3); }
      p.pour = null;
    } else {
      p.pour.t += dt;
      if (Math.random() < 0.4) addPart(seg.x + Math.random() * seg.w, seg.top + 6, (Math.random() - 0.5) * 20, -30, '#f3a33c', 0.4);
      if (p.pour.t >= p.pour.need) {
        G.brass -= 2;
        seg.stage = 2; seg.maxhp = seg.weak ? 110 : 160; seg.hp = seg.maxhp;
        p.pour = null;
        G.sfx.pour(); G.shake = 3;
        msg('BRASS POURED. The segment will not crack.', 3);
      }
    }
    return;
  }

  // --- mining ore ---
  let nearNode = null;
  for (const n of G.world.nodes) {
    if (n.amt > 0 && Math.abs(px - n.x) < 16 && Math.abs(p.y + p.h - n.y - 8) < 24) { nearNode = n; break; }
  }
  if (nearNode && held) {
    nearNode.prog += dt;
    if (nearNode.prog >= 0.8) {
      nearNode.prog = 0; nearNode.amt--;
      if (nearNode.type === 'iron') { G.iron++; msg('+1 Altai iron (' + G.iron + ')', 1.2); }
      else { G.brass++; msg('+1 brass ore (' + G.brass + ')', 1.2); }
      G.sfx.mine();
      addPart(nearNode.x, nearNode.y, (Math.random() - 0.5) * 40, -50, nearNode.type === 'iron' ? '#8a93a0' : '#d9a85a', 0.5);
    }
    return;
  }

  if (!tapped) return;

  // --- the Wall: build / repair / pour ---
  const seg = nearestSeg(px);
  if (seg && p.y + p.h > seg.top) {
    const ironCost = G.engineers > 0 ? 3 : 4;
    if (seg.stage === 0) {
      if (G.iron >= ironCost) {
        G.iron -= ironCost;
        seg.stage = 1; seg.maxhp = 60; seg.hp = 60; seg.weak = false;
        G.sfx.build(); G.shake = 2;
        msg('IRON RAISED — segment ' + (seg.i + 1) + '/8 framed.', 2.5);
        if (!G.flags.pourHint) { G.flags.pourHint = true; msg('Bring 2 BRASS and hold E to pour the unbreakable seam.', 4); }
      } else { G.sfx.deny(); msg('Need ' + ironCost + ' iron. Sortie east, beyond the Wall.', 2.5); }
      return;
    }
    if (seg.stage === 1 && seg.hp < seg.maxhp * 0.6) {
      if (G.iron >= 1) { G.iron--; seg.hp = Math.min(seg.maxhp, seg.hp + 25); G.sfx.build(); msg('Segment repaired.', 1.5); }
      else { G.sfx.deny(); msg('Need iron to repair.', 1.5); }
      return;
    }
    if (seg.stage === 1) {
      if (G.brass >= 2) {
        p.pour = { seg: seg, t: 0, need: Math.max(1.4, 2.6 - G.engineers * 0.4) };
        msg('POURING... hold E. Do not get hit.', 2.5);
      } else { G.sfx.deny(); msg('The pour needs 2 brass ore.', 2); }
      return;
    }
    if (seg.stage === 2 && seg.hp < seg.maxhp && G.iron >= 1) {
      G.iron--; seg.hp = Math.min(seg.maxhp, seg.hp + 25); G.sfx.build(); msg('Segment repaired.', 1.5);
      return;
    }
  }

  // --- Siwa shrine: the ram horns are earned, not given ---
  const sh = G.world.shrine;
  if (!sh.used && Math.abs(px - sh.x) < 22) {
    sh.used = true; G.flags.shrine = true; G.mythos += 2;
    G.flash = 0.9; G.flashCol = '#f3cf6b';
    G.sfx.relic(); G.sfx.roar();
    msg('THE ORACLE OF AMMON SPEAKS: "Son of the god."', 4.5);
    msg('The ram horns ignite. TIER 2 skills unlocked in the menu (Q). +2 Mythos', 5);
    return;
  }

  // --- rest at the forge-camp ---
  if (Math.abs(px - G.world.camp.x) < 24 && p.hp < p.maxhp) {
    p.hp = p.maxhp;
    if (!G.waveSys.active) G.waveSys.t = Math.max(5, G.waveSys.t - 8);
    G.sfx.pickup();
    msg('You rest by the forge. Wounds close; the doom-clock ticks on.', 3);
    return;
  }
}

// per-frame world upkeep
function updateWorld(dt) {
  updateFront(dt);
  updateWaves(dt);
  for (const n of G.world.nodes) {
    if (n.amt <= 0) { n.respawn += dt; if (n.respawn > 50) { n.respawn = 0; n.amt = 3; } }
  }
  // relic pickup is touch-based
  const p = G.player;
  for (const r of G.world.relics) {
    if (!r.got && Math.abs(p.x + p.w / 2 - r.x) < 12 && Math.abs(p.y + p.h / 2 - r.y) < 16) {
      r.got = true; G.mythos++; G.stats.relics++;
      G.sfx.relic(); G.flash = 0.35; G.flashCol = '#b08fdd';
      msg('RELIC OF MYTH RECOVERED  (+1 Mythos)', 2.5);
    }
  }
  // corruption exposure drain (sandbox-survival pressure)
  if (p.x > G.front.x) {
    p.corrT += dt;
    if (p.corrT > 8 && p.corrT % 2.5 < dt) {
      damagePlayer(0.5, null);
      msg('THE FRAYING GNAWS AT YOU', 1.5);
    }
  } else p.corrT = 0;
}
