// ============================================================
// ISKANDER — actors: the hero, the three-tier skill tree,
// the horde, Yajuj-Khagan, particles & pickups
// ============================================================
const GRAV = 640, JUMPV = -252, RUNSPD = 92, DASHV = 255;

// ---------- skill tree ----------
const SKILLS = [
  { id: 'sarissa', tier: 1, name: 'Sarissa Lunge', cost: { doxa: 8 }, desc: 'Spear during a dash: pierce for 5, pin light foes.' },
  { id: 'phalanx', tier: 1, name: 'Phalanx Echo', cost: { doxa: 12 }, desc: '[1] Summon 3 spectral hoplites — a mobile wall (6s).' },
  { id: 'rebuke', tier: 1, name: "Lion's Rebuke", cost: { doxa: 10 }, desc: 'Perfect parry wounds nearby foes and reflects projectiles.' },
  { id: 'besieger', tier: 1, name: 'Besieger', cost: { doxa: 10 }, desc: 'Sword while blocking: shield-bash breaks guards & cracked rock.' },
  { id: 'horns', tier: 2, name: 'Horns of Ammon', cost: { mythos: 2 }, desc: '[2] Helmet-first charge: 6 dmg, smashes stone.' },
  { id: 'disc', tier: 2, name: 'Solar Disc', cost: { mythos: 2 }, desc: 'The lion shield orbits you, auto-parrying one hit per 6s.' },
  { id: 'whisper', tier: 2, name: 'Whisper of the Oracle', cost: { mythos: 2 }, desc: 'Time slows for a breath after every perfect parry.' },
  { id: 'stride', tier: 2, name: 'Anointed Stride', cost: { mythos: 3 }, desc: 'Walk upon water as upon marble.' },
  { id: 'ironverse', tier: 3, name: 'Iron Verse', cost: { doxa: 20, mythos: 2 }, desc: '[3] Slam: raise an iron rampart from the earth (12s). AGES YOU.' },
  { id: 'brasstide', tier: 3, name: 'Brass Tide', cost: { doxa: 15, mythos: 2 }, desc: '[4] Hurl molten brass that hardens into stairs (20s). AGES YOU.' },
  { id: 'roar', tier: 3, name: 'The Sealing Roar', cost: { doxa: 30, mythos: 4 }, desc: '[5] Petrify every foe on screen (4s). Statues yield iron. AGES YOU.' },
];
function tierOpen(t) {
  if (t === 1) return true;
  if (t === 2) return G.flags.shrine;
  return G.flags.reachedWall;
}
function tierReqText(t) {
  if (t === 2) return 'Seek the Oracle at Siwa';
  return 'Reach the Wall at the Roof of the World';
}
function canAfford(s) {
  return G.doxa >= (s.cost.doxa || 0) && G.mythos >= (s.cost.mythos || 0);
}
function buySkill(s) {
  if (G.skills[s.id] || !tierOpen(s.tier) || !canAfford(s)) { G.sfx.deny(); return false; }
  G.doxa -= s.cost.doxa || 0;
  G.mythos -= s.cost.mythos || 0;
  G.skills[s.id] = true;
  G.sfx.buy();
  msg(s.name + ' learned.', 2.5);
  return true;
}

// ---------- player ----------
function resetPlayer(full) {
  const spawnX = G.flags.reachedWall ? G.world.camp.x : 70;
  const p = G.player || {};
  p.x = spawnX; p.y = 60; p.vx = 0; p.vy = 0;
  p.w = 10; p.h = 22; p.face = 1;
  p.onGround = false; p.dropT = 0;
  p.hp = p.maxhp || 10;
  p.inv = 0; p.hurtT = 0; p.corrT = 0;
  p.dashT = 0; p.dashCd = 0;
  p.atk = null; p.combo = 0; p.comboT = 0;
  p.block = false; p.blockT = 0;
  p.cds = { phalanx: 0, horns: 0, ironverse: 0, brasstide: 0, roar: 0 };
  p.discCd = 0; p.charge = 0;
  p.pour = null; p.runPhase = 0;
  p.lastSafe = { x: spawnX, y: 60 };
  if (full) {
    p.maxhp = 10; p.hp = 10;
  }
  G.player = p;
}

function ageUp() {
  G.age++;
  G.player.maxhp = Math.max(7, 10 - G.age * 0.5);
  G.player.hp = Math.min(G.player.hp, G.player.maxhp);
  if (G.age === 1) msg('Power costs legacy. The king is older now.', 3.5);
}

function meleeHit(rect, dmg, opts) {
  opts = opts || {};
  let landed = false;
  for (const e of G.enemies) {
    if (aabb(rect, e)) {
      hurtEnemy(e, dmg, opts);
      landed = true;
    }
  }
  const b = G.boss;
  if (b && b.phase < 5 && aabb(rect, b)) {
    landed = hitBoss(dmg, opts) || landed;
  }
  if (opts.breakRock) {
    for (const r of G.world.rocks) {
      if (!r.broken && aabb(rect, r)) {
        r.hp -= 1;
        G.sfx.mine(); G.shake = Math.max(G.shake, 2);
        if (r.hp <= 0) {
          r.broken = true; G.sfx.breakRock(); G.shake = 4;
          for (let i = 0; i < 10; i++) addPart(r.x + 9, r.y + 18, (Math.random() - 0.5) * 120, -Math.random() * 90, '#7d6a55', 0.7);
          msg('The stone yields to the Besieger.', 2.5);
        }
        landed = true;
      }
    }
  }
  for (const cg of G.world.cages) {
    if (!cg.freed && aabb(rect, cg)) {
      cg.hp -= dmg;
      G.sfx.mine();
      if (cg.hp <= 0) {
        cg.freed = true; G.engineers++;
        G.sfx.relic();
        msg('ENGINEER CLAN FREED — builds are cheaper, pours are faster. (' + G.engineers + ')', 4);
      }
      landed = true;
    }
  }
  if (landed) G.sfx.hit();
  return landed;
}

function hurtEnemy(e, dmg, opts) {
  opts = opts || {};
  if (e.petrified > 0) {
    e.hp -= dmg * 2;
    if (e.hp <= 0) { G.iron++; msg('+1 iron from the statue', 1.2); }
  } else {
    if (e.type === 'biter' && !e.guardBroken && !opts.guardbreak && !opts.pierce) dmg *= 0.4;
    if (e.type === 'echoborn' && e.parryCd <= 0 && !opts.unblockable) {
      e.parryCd = 2.0;
      e.riposte = 0.25;
      G.sfx.parry();
      addPart(e.x + e.w / 2, e.y + 6, e.facing * 40, -20, '#39ff6a', 0.3);
      return;
    }
    e.hp -= dmg;
    e.vx += (opts.kb || 60) * (G.player.face);
    if (opts.stun) e.stun = Math.max(e.stun, opts.stun);
    if (opts.guardbreak) e.guardBroken = true;
  }
  addPart(e.x + e.w / 2, e.y + e.h / 2, (Math.random() - 0.5) * 80, -40, '#b03cff', 0.4);
  if (e.hp <= 0) enemyDie(e);
}

function damagePlayer(d, from) {
  const p = G.player;
  if (G.state !== 'play') return;
  if (p.inv > 0 || p.dashT > 0.06) return;
  const fromFront = from == null || ((from.x > p.x) === (p.face === 1));

  if (p.block && fromFront) {
    if (p.blockT < (G.assist ? 0.26 : 0.14)) {
      // PERFECT PARRY — the lion roars
      p.inv = 0.45;
      G.sfx.parry();
      G.shake = 6; G.flash = 0.25; G.flashCol = '#f3cf6b';
      if (G.skills.whisper) G.slowT = 0.55;
      const r = G.skills.rebuke ? 70 : 50;
      for (const e of G.enemies) {
        if (dist(e.x, e.y, p.x, p.y) < r) {
          e.stun = Math.max(e.stun, 1.5);
          if (G.skills.rebuke) { e.hp -= 3; if (e.hp <= 0) enemyDie(e); }
        }
      }
      if (G.skills.rebuke) {
        for (const pr of G.projectiles) {
          if (!pr.friendly && dist(pr.x, pr.y, p.x, p.y) < 70) { pr.friendly = true; pr.vx *= -1.4; pr.vy *= -0.5; pr.dmg = 4; }
        }
      }
      if (G.boss && dist(G.boss.x + G.boss.w / 2, G.boss.y, p.x, p.y) < 80) {
        G.boss.stun = Math.max(G.boss.stun || 0, G.boss.phase === 3 ? 1.2 : 1.5);
      }
      return;
    }
    p.hp -= d * 0.25;
    p.inv = 0.3;
    G.sfx.hit();
    if (p.hp <= 0) playerDie();
    return;
  }
  if (G.skills.disc && p.discCd <= 0) {
    p.discCd = 6;
    G.sfx.parry();
    addPart(p.x, p.y, 0, -40, '#f3cf6b', 0.5);
    msg('The Solar Disc turns the blow.', 1.5);
    return;
  }
  p.hp -= d;
  p.inv = 0.8; p.hurtT = 0.3;
  p.pour = null;
  G.sfx.hurt(); G.shake = Math.max(G.shake, 3);
  if (from) p.vx = (p.x < from.x ? -1 : 1) * 120;
  if (p.hp <= 0) playerDie();
}

function playerDie() {
  const p = G.player;
  G.iron = Math.floor(G.iron / 2);
  if (G.boss) { G.boss = null; G.seal = null; G.waveSys.bossNext = true; G.waveSys.bossT = 20; }
  resetPlayer(false);
  p.hp = p.maxhp;
  G.flash = 0.8; G.flashCol = '#1a1015';
  msg('You fall... and wake at the camp. Half your iron is lost.', 4);
}

function castSkill(slot) {
  const p = G.player;
  if (slot === 'phalanx' && G.skills.phalanx && p.cds.phalanx <= 0) {
    p.cds.phalanx = 14;
    for (let i = 1; i <= 3; i++) {
      G.echoes.push({ x: p.x + p.face * (10 + i * 12), y: p.y, life: 6, hp: 10, segI: -1 });
    }
    G.sfx.build();
    msg('PHALANX ECHO — the line holds.', 1.5);
  }
  if (slot === 'horns' && G.skills.horns && p.cds.horns <= 0) {
    p.cds.horns = 9;
    p.charge = 0.45;
    p.atk = null;
    G.sfx.roar();
  }
  if (slot === 'ironverse' && G.skills.ironverse && p.cds.ironverse <= 0) {
    p.cds.ironverse = 16;
    const rx = p.x + p.face * 20;
    const gy = terrainY(rx + 4, false);
    if (gy < 900) {
      G.ramparts.push({ x: rx, y: gy - 40, w: 8, h: 40, hp: 50, life: 12 });
      G.shake = 4; G.sfx.build(); ageUp();
    }
  }
  if (slot === 'brasstide' && G.skills.brasstide && p.cds.brasstide <= 0) {
    p.cds.brasstide = 14;
    for (let i = 1; i <= 5; i++) {
      G.brassPlats.push({ x: p.x + p.face * (12 + i * 16), y: p.y + 10 - i * 11, w: 16, h: 4, life: 20 });
    }
    G.sfx.pour(); ageUp();
  }
  if (slot === 'roar' && G.skills.roar && p.cds.roar <= 0) {
    p.cds.roar = 45;
    G.sfx.petrify(); G.sfx.roar();
    G.shake = 8; G.flash = 0.6; G.flashCol = '#f3cf6b';
    for (const e of G.enemies) {
      if (Math.abs(e.x - p.x) < 300) { e.petrified = 4; e.vx = 0; }
    }
    ageUp();
    msg('THE SEALING ROAR — flesh becomes statuary.', 3);
  }
}

function updatePlayer(dt) {
  const p = G.player;
  p.inv = Math.max(0, p.inv - dt);
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.discCd = Math.max(0, p.discCd - dt);
  p.comboT = Math.max(0, p.comboT - dt);
  p.dropT = Math.max(0, p.dropT - dt);
  for (const k in p.cds) p.cds[k] = Math.max(0, p.cds[k] - dt);

  // blocking
  const wasBlock = p.block;
  p.block = G.keys.shield && !p.atk && p.charge <= 0;
  p.blockT = p.block ? (wasBlock ? p.blockT + dt : 0) : 0;

  // movement intent
  let mv = 0;
  if (G.keys.left) mv = -1;
  if (G.keys.right) mv = 1;
  if (mv !== 0 && !p.block) p.face = mv;

  if (G.pressed.dash && p.dashCd <= 0 && p.charge <= 0) {
    p.dashT = 0.18; p.dashCd = 1.1;
    G.sfx.dash();
  }
  p.dashT = Math.max(0, p.dashT - dt);
  p.charge = Math.max(0, p.charge - dt);

  let spd = RUNSPD;
  if (p.block) spd *= 0.4;
  if (p.dashT > 0) { p.vx = p.face * DASHV; }
  else if (p.charge > 0) { p.vx = p.face * 300; }
  else p.vx = mv * spd + (p.hurtT > 0 ? p.vx * 0.5 : 0);

  if (mv !== 0 && p.onGround) p.runPhase += dt * 11;

  // jump / drop
  if (G.pressed.jump) {
    if (G.keys.down && p.onGround) { p.dropT = 0.22; p.vy = 30; p.onGround = false; }
    else if (p.onGround) { p.vy = JUMPV; p.onGround = false; G.sfx.jump(); }
  }

  // attacks
  if (!p.atk && p.charge <= 0) {
    if (G.pressed.sword) {
      if (p.block && G.skills.besieger) {
        p.atk = { kind: 'bash', t: 0, dur: 0.25, did: false };
      } else if (!p.block) {
        if (p.comboT <= 0) p.combo = 0;
        p.atk = { kind: 'sword', t: 0, dur: 0.26, idx: p.combo, did: false };
        p.combo = (p.combo + 1) % 3;
        p.comboT = 0.55;
        G.sfx.swing();
      }
    } else if (G.pressed.spear && !p.block) {
      if (p.dashT > 0 && G.skills.sarissa) p.atk = { kind: 'lunge', t: 0, dur: 0.3, did: false };
      else p.atk = { kind: 'spear', t: 0, dur: 0.32, did: false };
      G.sfx.swing();
    }
  }
  if (p.atk) {
    p.atk.t += dt;
    const a = p.atk;
    if (!a.did && a.t > a.dur * 0.35) {
      a.did = true;
      const fx = p.face;
      if (a.kind === 'sword') {
        const dmg = [2, 2, 3][a.idx];
        meleeHit({ x: p.x + (fx === 1 ? p.w : -16), y: p.y + 2, w: 16, h: 18 }, dmg, { kb: a.idx === 2 ? 140 : 60 });
      } else if (a.kind === 'spear') {
        meleeHit({ x: p.x + (fx === 1 ? p.w : -26), y: p.y + 6, w: 26, h: 8 }, 3, { kb: 40, pierce: true });
      } else if (a.kind === 'lunge') {
        meleeHit({ x: p.x + (fx === 1 ? p.w : -30), y: p.y + 4, w: 30, h: 12 }, 5, { kb: 200, stun: 1.2, pierce: true, unblockable: true });
      } else if (a.kind === 'bash') {
        meleeHit({ x: p.x + (fx === 1 ? p.w : -14), y: p.y, w: 14, h: 20 }, 1, { kb: 120, guardbreak: true, stun: 1, breakRock: true });
        G.shake = Math.max(G.shake, 2);
      }
    }
    if (a.t >= a.dur) p.atk = null;
  }
  // Horns of Ammon charge collisions (continuous)
  if (p.charge > 0) {
    meleeHit({ x: p.x + (p.face === 1 ? p.w : -12), y: p.y, w: 12, h: 20 }, 6 * dt * 6, { kb: 180, stun: 0.8, guardbreak: true, breakRock: true, unblockable: true });
  }

  // actives
  if (G.pressed.s1) castSkill('phalanx');
  if (G.pressed.s2) castSkill('horns');
  if (G.pressed.s3) castSkill('ironverse');
  if (G.pressed.s4) castSkill('brasstide');
  if (G.pressed.s5) castSkill('roar');

  // garrison: turn an Echo into infrastructure
  if (G.pressed.garrison && G.skills.phalanx) {
    const seg = nearestSeg(p.x + p.w / 2);
    if (seg && seg.stage > 0 && !seg.garrison) {
      if (G.doxa >= 12) {
        G.doxa -= 12; seg.garrison = true;
        G.echoes.push({ x: seg.x + seg.w / 2, y: seg.top - 20, life: 1e9, hp: 25, segI: seg.i });
        G.sfx.build();
        msg('ECHO GARRISON — the soldier becomes the stone.', 3);
      } else { G.sfx.deny(); msg('Garrison costs 12 Doxa.', 2); }
    }
  }

  // ---- physics ----
  const walkWater = !!G.skills.stride;
  let nx = p.x + p.vx * dt;
  const probe = { x: nx, y: p.y, w: p.w, h: p.h };
  const gAhead = Math.min(terrainY(nx + 2, walkWater), terrainY(nx + p.w - 2, walkWater));
  const stepLimit = p.onGround ? 13 : 4;
  let blocked = gAhead < p.y + p.h - stepLimit;
  for (const r of solidRocks()) {
    if (aabb(probe, r) && !aabb(p, r)) blocked = true;
  }
  if (blocked) { nx = p.x; if (p.dashT <= 0 && p.charge <= 0) p.vx = 0; }
  if (nx < 4) nx = 4;
  if (nx > WORLD_W - 14) nx = WORLD_W - 14;
  p.x = nx;

  p.vy += GRAV * dt;
  if (p.vy > 320) p.vy = 320;
  const prevFeet = p.y + p.h;
  p.y += p.vy * dt;
  p.onGround = false;

  let gy = Math.min(terrainY(p.x + 2, walkWater), terrainY(p.x + p.w - 2, walkWater));
  if (p.dropT <= 0) {
    const all = G.world.plats.concat(G.brassPlats);
    for (const pl of all) {
      if (p.x + p.w > pl.x && p.x < pl.x + pl.w && prevFeet <= pl.y + 1 && p.y + p.h >= pl.y && p.vy >= 0) {
        if (pl.y < gy) gy = pl.y;
      }
    }
  }
  if (p.vy >= 0 && p.y + p.h >= gy) {
    p.y = gy - p.h; p.vy = 0; p.onGround = true;
    if (gy < 900 && !G.world.water[Math.floor((p.x + p.w / 2) / TS)]) {
      p.lastSafe.x = p.x; p.lastSafe.y = p.y - 4;
    }
  }
  // step-up snap when walking small rises
  const gNow = Math.min(terrainY(p.x + 2, walkWater), terrainY(p.x + p.w - 2, walkWater));
  if (p.onGround && p.y + p.h > gNow && p.y + p.h - gNow <= 13) { p.y = gNow - p.h; }

  // fell into water / pit
  if (p.y > G.H + 30) {
    damagePlayer(1, null);
    p.x = p.lastSafe.x; p.y = p.lastSafe.y; p.vx = 0; p.vy = 0;
    addPart(p.x, p.y + 20, 0, -60, '#7ec0d8', 0.6);
  }

  // first arrival at the Wall
  if (!G.flags.reachedWall && p.x > G.wall.x0 - 160) {
    G.flags.reachedWall = true;
    G.flash = 0.5; G.flashCol = '#dfe8ef';
    G.sfx.wave();
    msg('THE ROOF OF THE WORLD. Here the map ends and myth begins.', 5);
    msg('Build the Wall: E at a foundation (4 iron). The horde comes on a doom-clock.', 6);
    msg('TIER 3 skills unlocked in the menu (Q).', 4);
  }

  tryInteract(p, dt);
}

// ---------- enemies ----------
const ETYPES = {
  numberless: { hp: 3, spd: 42, dmg: 0.5, w: 6, h: 6, doxa: 1 },
  licker: { hp: 8, spd: 72, dmg: 1, w: 16, h: 8, doxa: 3 },
  biter: { hp: 26, spd: 26, dmg: 1.5, w: 18, h: 12, doxa: 6 },
  echoborn: { hp: 30, spd: 60, dmg: 1.5, w: 10, h: 22, doxa: 12 },
};
function spawnEnemy(type, x, waveTag) {
  const t = ETYPES[type];
  const e = {
    type: type, x: x, y: terrainY(x, true) - t.h - 2, vx: 0, vy: 0,
    w: t.w, h: t.h, hp: t.hp + (G.waveSys ? G.waveSys.wave * (type === 'numberless' ? 0.5 : 1.5) : 0),
    spd: t.spd * (0.85 + Math.random() * 0.3), dmg: t.dmg,
    stun: 0, petrified: 0, touchCd: 0, facing: -1,
    waveTag: !!waveTag, guardBroken: false, parryCd: 0, riposte: 0,
    seed: Math.random() * 100, lungeT: 0, atkT: 0,
  };
  G.enemies.push(e);
  return e;
}
function enemyDie(e) {
  const i = G.enemies.indexOf(e);
  if (i >= 0) G.enemies.splice(i, 1);
  G.stats.kills++;
  const t = ETYPES[e.type];
  for (let k = 0; k < t.doxa; k++) addOrb(e.x + e.w / 2, e.y, 1);
  if (e.type === 'biter' && Math.random() < 0.35) { G.iron++; msg('+1 iron from the Wall-Biter shell', 1.5); }
  if (Math.random() < 0.08) addOrb(e.x, e.y, 0, true);
  for (let k = 0; k < 6; k++) addPart(e.x + e.w / 2, e.y + e.h / 2, (Math.random() - 0.5) * 100, -Math.random() * 80, Math.random() < 0.5 ? '#39ff6a' : '#b03cff', 0.6);
}

function updateEnemies(dt) {
  const p = G.player;
  const blockers = enemyBlockers();
  for (let i = G.enemies.length - 1; i >= 0; i--) {
    const e = G.enemies[i];
    e.touchCd = Math.max(0, e.touchCd - dt);
    e.parryCd = Math.max(0, e.parryCd - dt);
    if (e.petrified > 0) { e.petrified -= dt; continue; }
    if (e.stun > 0) { e.stun -= dt; e.vx *= 0.85; continue; }

    // pick target: the player if near (or post-wall), else the Wall, else march west
    let tx = null, wallTarget = null;
    const pd = Math.abs(p.x - e.x);
    if (e.type === 'biter') {
      let best = null, bd = 1e9;
      for (const s of G.wall.segs) {
        if (s.stage > 0) { const d = Math.abs(s.x + s.w / 2 - e.x); if (d < bd) { bd = d; best = s; } }
      }
      if (best && pd > 60) { wallTarget = best; tx = best.x + best.w / 2; }
      else tx = p.x;
    } else {
      tx = (pd < 160 || e.x < G.wall.x0) ? p.x : (e.waveTag ? e.x - 50 : p.x);
    }
    const dir = tx < e.x ? -1 : 1;
    e.facing = dir;

    // blocked by walls / ramparts / hoplites → chew on them
    let chewing = null;
    const aheadX = dir === -1 ? e.x - 3 : e.x + e.w + 3;
    for (const b of blockers) {
      if (aheadX > b.x && aheadX < b.x + b.w && e.y + e.h > b.y && e.y < b.y + b.h) { chewing = b; break; }
    }
    if (chewing) {
      e.vx = 0;
      const dps = e.type === 'biter' ? 9 : e.type === 'numberless' ? 0.8 : 2.5;
      if (chewing.kind === 'seg') damageSeg(chewing.ref, dps * dt);
      else chewing.ref.hp -= dps * dt;
      if (Math.random() < dt * 6) addPart(aheadX, e.y + e.h / 2, -dir * 30, -20, '#8a93a0', 0.3);
    } else {
      // movement flavor per archetype
      if (e.type === 'licker') {
        e.lungeT -= dt;
        if (pd < 90 && e.lungeT <= 0 && Math.abs(p.y - e.y) < 30) { e.vx = dir * e.spd * 2.4; e.lungeT = 1.6; }
        else if (e.lungeT < 1.2) e.vx = dir * e.spd * 0.7;
      } else if (e.type === 'echoborn') {
        e.atkT -= dt;
        if (e.riposte > 0) {
          e.riposte -= dt;
          if (e.riposte <= 0 && pd < 30) damagePlayer(1.5, e);
        }
        if (pd < 26 && e.atkT <= 0) {
          e.atkT = 1.1;
          if (Math.abs(p.y + p.h - (e.y + e.h)) < 26) damagePlayer(e.dmg, e);
        } else if (pd < 110 && pd > 40 && e.atkT <= 0 && Math.random() < dt * 1.2) {
          e.vx = dir * 240; e.atkT = 0.9; // a corrupted Sarissa Lunge
        } else e.vx = lerp(e.vx, dir * e.spd, 0.1);
      } else {
        e.vx = lerp(e.vx, dir * e.spd, 0.15);
      }
    }

    // physics (enemies walk water columns — the horde drinks rivers dry)
    e.vy += GRAV * dt;
    if (e.vy > 300) e.vy = 300;
    e.x += e.vx * dt;
    e.x = clamp(e.x, 4, WORLD_W - 10);
    e.y += e.vy * dt;
    const gy = terrainY(e.x + e.w / 2, true);
    if (e.y + e.h >= gy) {
      e.y = gy - e.h; e.vy = 0;
      // the Numberless climb over obstacles as a rising tide
      if (chewing && e.type === 'numberless' && Math.random() < dt * 1.5) e.vy = -180;
    }

    // touch damage
    if (e.touchCd <= 0 && aabb(e, p)) {
      e.touchCd = 0.8;
      damagePlayer(e.dmg, e);
    }
    if (e.y > G.H + 60) G.enemies.splice(i, 1);
  }

  // hoplite echoes poke back
  for (let i = G.echoes.length - 1; i >= 0; i--) {
    const ec = G.echoes[i];
    ec.life -= dt;
    if (ec.life <= 0 || ec.hp <= 0) { G.echoes.splice(i, 1); continue; }
    for (const e of G.enemies) {
      if (Math.abs(e.x - ec.x) < 26 && Math.abs(e.y - ec.y) < 26 && Math.random() < dt * 2.5) {
        e.hp -= 2;
        addPart(e.x, e.y, 0, -30, '#dfe8ef', 0.3);
        if (e.hp <= 0) enemyDie(e);
      }
    }
  }
}

// ---------- BOSS: YAJUJ-KHAGAN, THE MOUTH OF THE EAST ----------
function startBoss() {
  G.waveSys.bossNext = false;
  const gx = G.wall.gateX;
  G.boss = {
    phase: 1, hp: 130, maxhp: 130,
    x: gx + 150, y: 60, vx: 0, vy: 0, w: 52, h: 40,
    state: 'enter', stateT: 2.2, t: 0, stun: 0,
    aflame: 0, parryCd: 0, hinted: false, spawnT: 6,
    name: 'YAJUJ-KHAGAN, THE MOUTH OF THE EAST',
  };
  G.sfx.bossRoar();
  G.shake = 8;
  msg('YAJUJ-KHAGAN — THE MOUTH OF THE EAST', 5);
}

function hitBoss(dmg, opts) {
  const b = G.boss;
  if (!b) return false;
  if (b.phase === 3) {
    // the Devouring cannot be fought — only outrun
    addPart(b.x + Math.random() * b.w, b.y + Math.random() * b.h, -30, -20, '#39ff6a', 0.3);
    return false;
  }
  if (b.phase === 2 && b.aflame <= 0) {
    if (!b.hinted) { b.hinted = true; msg('The swarm reforms! Only FIRE makes it commit — lure him to the gate braziers!', 5); }
    addPart(b.x + b.w / 2, b.y + 10, (Math.random() - 0.5) * 60, -30, '#39ff6a', 0.3);
    return false;
  }
  if (b.phase === 4 && b.parryCd <= 0 && !(opts && opts.unblockable)) {
    b.parryCd = 1.8;
    b.counter = 0.3;
    G.sfx.parry();
    msg('He parries like you do. Feint — strike twice.', 2);
    return false;
  }
  b.hp -= dmg;
  addPart(b.x + b.w / 2, b.y + b.h / 2, (Math.random() - 0.5) * 100, -50, '#ff3963', 0.5);
  if (b.hp <= 0) bossPhaseEnd();
  return true;
}

function bossPhaseEnd() {
  const b = G.boss;
  G.shake = 8; G.flash = 0.4; G.flashCol = '#b03cff';
  G.sfx.bossRoar();
  if (b.phase === 1) {
    b.phase = 2; b.hp = 100; b.maxhp = 100;
    b.w = 26; b.h = 34; b.state = 'drift'; b.stateT = 1.5;
    for (let i = 0; i < 10; i++) spawnEnemy('numberless', b.x + (Math.random() - 0.5) * 60, false);
    msg('THE SWARM CROWN — he was never one thing.', 4);
  } else if (b.phase === 2) {
    // Stage 3 — THE DEVOURING: he eats the world; you run
    b.phase = 3; b.hp = 1; b.maxhp = 1;
    b.w = 22; b.h = 46; b.chaseT = 12;
    b.x = G.player.x + 130; b.vx = 0;
    msg('THE DEVOURING — RUN WEST! HE EATS THE GROUND BEHIND YOU!', 5);
  } else if (b.phase === 4) {
    b.phase = 5; b.hp = 1; b.maxhp = 1;
    G.seal = { t: 0, need: Math.max(5, 8 - G.engineers), spawnT: 0 };
    msg('THE SEALING — you do not fight a flood. You BUILD. Hold E at the gate!', 6);
  }
}

function updateBoss(dt) {
  const b = G.boss;
  if (!b) return;
  const p = G.player;
  const gx = G.wall.gateX;
  b.t += dt;
  b.stun = Math.max(0, (b.stun || 0) - dt);
  b.parryCd = Math.max(0, b.parryCd - dt);
  b.aflame = Math.max(0, b.aflame - dt);

  // gravity for phases that walk
  b.vy += GRAV * dt;
  if (b.vy > 320) b.vy = 320;
  b.y += b.vy * dt;
  const gy = terrainY(b.x + b.w / 2, true);
  let grounded = false;
  if (b.y + b.h >= gy) { b.y = gy - b.h; b.vy = 0; grounded = true; }
  b.x += b.vx * dt;
  b.x = clamp(b.x, gx - 290, gx + 290);

  if (b.stun > 0) { b.vx *= 0.8; return; }

  if (b.phase === 3) {
    // THE DEVOURING: a wave of static rolls west, erasing geometry
    b.chaseT -= dt;
    b.vx = 0;
    b.x -= 88 * dt;
    for (let i = G.ramparts.length - 1; i >= 0; i--) if (G.ramparts[i].x > b.x - 12) G.ramparts.splice(i, 1);
    for (let i = G.echoes.length - 1; i >= 0; i--) if (G.echoes[i].x > b.x - 12 && G.echoes[i].segI < 0) G.echoes.splice(i, 1);
    for (const s of G.wall.segs) if (Math.abs(s.x + s.w / 2 - (b.x + b.w / 2)) < 20) damageSeg(s, 6 * dt);
    if (p.x + p.w > b.x - 4 && p.x < b.x + b.w && p.y + p.h > b.y) damagePlayer(1.5, b);
    if (Math.random() < dt * 18) addPart(b.x + Math.random() * b.w, b.y + Math.random() * b.h, -40, -20, Math.random() < 0.5 ? '#39ff6a' : '#b03cff', 0.4);
    if ((b.chaseT < 10.5 && p.x < G.wall.x0 - 120) || b.chaseT <= 0) {
      b.phase = 4; b.hp = 110; b.maxhp = 110;
      b.w = 10; b.h = 22; b.x = p.x + 150; b.y = 60;
      b.state = 'duel'; b.stateT = 1; b.parryCd = 0;
      G.shake = 6; G.sfx.bossRoar();
      msg('IT COALESCES — A KING-SHAPE WEARING YOUR FACE.', 4);
    }
    return;
  }

  if (b.phase === 5) {
    // The Sealing: hold the gate while the tide pours in
    const s = G.seal;
    s.spawnT -= dt;
    let alive = 0;
    for (const e of G.enemies) if (e.type === 'numberless') alive++;
    if (s.spawnT <= 0 && alive < 14) {
      s.spawnT = 0.7;
      spawnEnemy('numberless', gx + 250 + Math.random() * 80, false);
    }
    if (G.keys.use && Math.abs(p.x + p.w / 2 - gx) < 22) {
      s.t += dt;
      if (Math.random() < 0.5) addPart(gx + (Math.random() - 0.5) * 16, 150 + Math.random() * 20, 0, -40, '#f3a33c', 0.4);
      if (s.t >= s.need) {
        // entombed forever, mid-lunge
        G.flags.bossDone = true;
        G.boss = null; G.seal = null;
        G.enemies.length = 0;
        G.flash = 1; G.flashCol = '#f3cf6b';
        G.sfx.pour(); G.sfx.bossRoar(); G.sfx.relic();
        G.shake = 10;
        msg('THE BRASS HARDENS. THE MOUTH OF THE EAST IS SEALED IN THE WALL.', 6);
        G.choiceT = 3;
      }
    }
    return;
  }

  b.stateT -= dt;
  const pd = p.x - (b.x + b.w / 2);

  if (b.phase === 1) {
    // The Rider: charge, spear-rain, ground-pound
    if (b.state === 'enter' && b.stateT <= 0) { b.state = 'idle'; b.stateT = 1; }
    else if (b.state === 'idle' && b.stateT <= 0) {
      const r = Math.random();
      if (Math.abs(pd) > 120 && r < 0.5) { b.state = 'telegraph'; b.stateT = 0.55; b.chargeDir = pd > 0 ? 1 : -1; }
      else if (r < 0.75) { b.state = 'rain'; b.stateT = 0.8; b.rained = false; }
      else { b.state = 'pound'; b.stateT = 0.6; b.vy = -180; b.pounded = false; }
      b.vx = 0;
    }
    else if (b.state === 'telegraph' && b.stateT <= 0) { b.state = 'charge'; b.stateT = 0.9; b.vx = b.chargeDir * 250; G.sfx.dash(); }
    else if (b.state === 'charge') {
      if (Math.abs(p.y + p.h - (b.y + b.h)) < 40 && Math.abs(pd) < b.w / 2 + 6 && p.inv <= 0) damagePlayer(2, b);
      if (b.stateT <= 0) { b.state = 'idle'; b.stateT = 1.2; b.vx = 0; }
    }
    else if (b.state === 'rain') {
      if (!b.rained && b.stateT < 0.4) {
        b.rained = true;
        for (let i = 0; i < 6; i++) {
          G.projectiles.push({ x: p.x - 60 + i * 22 + Math.random() * 8, y: 4, vx: 0, vy: 200 + Math.random() * 40, dmg: 1, friendly: false, kind: 'spear' });
        }
        G.sfx.swing();
      }
      if (b.stateT <= 0) { b.state = 'idle'; b.stateT = 1; }
    }
    else if (b.state === 'pound') {
      if (!b.pounded && grounded && b.stateT < 0.3) {
        b.pounded = true;
        G.shake = 6; G.sfx.bossRoar();
        G.projectiles.push({ x: b.x, y: gy - 8, vx: -160, vy: 0, dmg: 1, friendly: false, kind: 'shock', life: 1.6 });
        G.projectiles.push({ x: b.x + b.w, y: gy - 8, vx: 160, vy: 0, dmg: 1, friendly: false, kind: 'shock', life: 1.6 });
      }
      if (b.stateT <= 0) { b.state = 'idle'; b.stateT = 1.1; }
    }
  }

  if (b.phase === 2) {
    // Swarm Crown: invulnerable unless burning at a brazier
    for (const bx of G.world.braziers) {
      if (Math.abs(b.x + b.w / 2 - bx) < 40) { b.aflame = 1.4; }
    }
    if (b.aflame > 0 && Math.random() < dt * 8) addPart(b.x + Math.random() * b.w, b.y + Math.random() * b.h, 0, -60, '#f3a33c', 0.4);
    b.spawnT -= dt;
    if (b.spawnT <= 0) { b.spawnT = 7; for (let i = 0; i < 3; i++) spawnEnemy('numberless', b.x + (Math.random() - 0.5) * 40, false); }
    if (b.state === 'drift') {
      b.vx = lerp(b.vx, (pd > 0 ? 1 : -1) * 55, 0.06);
      if (b.stateT <= 0 && Math.abs(pd) < 130) { b.state = 'lunge'; b.stateT = 0.5; b.vx = (pd > 0 ? 1 : -1) * 260; }
    } else if (b.state === 'lunge') {
      if (Math.abs(pd) < b.w / 2 + 6 && Math.abs(p.y - b.y) < 30) damagePlayer(1.5, b);
      if (b.stateT <= 0) { b.state = 'drift'; b.stateT = 2 + Math.random(); }
    }
  }

  if (b.phase === 4) {
    // False Iskander: a 1v1 duel against your own kit
    if (b.counter && b.counter > 0) {
      b.counter -= dt;
      if (b.counter <= 0 && Math.abs(pd) < 30) damagePlayer(1.5, b);
    }
    if (b.state === 'duel') {
      b.vx = lerp(b.vx, (Math.abs(pd) > 24 ? (pd > 0 ? 1 : -1) * 75 : 0), 0.12);
      if (b.stateT <= 0) {
        const r = Math.random();
        if (Math.abs(pd) < 34 && r < 0.6) { b.state = 'combo'; b.stateT = 0.5; b.struck = false; }
        else if (Math.abs(pd) < 130 && r < 0.85) { b.state = 'dashthrust'; b.stateT = 0.4; b.vx = (pd > 0 ? 1 : -1) * 270; b.struck = false; }
        else b.stateT = 0.5;
      }
    } else if (b.state === 'combo') {
      if (!b.struck && b.stateT < 0.3) {
        b.struck = true;
        if (Math.abs(pd) < 34 && Math.abs(p.y + p.h - (b.y + b.h)) < 26) damagePlayer(1.5, b);
      }
      if (b.stateT <= 0) { b.state = 'duel'; b.stateT = 0.7 + Math.random() * 0.5; }
    } else if (b.state === 'dashthrust') {
      if (!b.struck && Math.abs(pd) < 24) { b.struck = true; damagePlayer(2, b); }
      if (b.stateT <= 0) { b.state = 'duel'; b.stateT = 0.8; b.vx = 0; }
    }
  }
}

// ---------- particles / orbs / projectiles / structures ----------
function addPart(x, y, vx, vy, col, life) {
  if (G.particles.length > 220) G.particles.shift();
  G.particles.push({ x: x, y: y, vx: vx, vy: vy, col: col, life: life, t: 0 });
}
function addOrb(x, y, val, heart) {
  G.orbs.push({ x: x, y: y, vx: (Math.random() - 0.5) * 80, vy: -80 - Math.random() * 40, val: val, heart: !!heart, t: 0 });
}
function updateMisc(dt) {
  const p = G.player;
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const pt = G.particles[i];
    pt.t += dt;
    pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 300 * dt;
    if (pt.t > pt.life) G.particles.splice(i, 1);
  }
  for (let i = G.orbs.length - 1; i >= 0; i--) {
    const o = G.orbs[i];
    o.t += dt;
    const d = dist(o.x, o.y, p.x + p.w / 2, p.y + p.h / 2);
    if (d < 50) {
      o.vx = lerp(o.vx, (p.x + p.w / 2 - o.x) * 8, 0.3);
      o.vy = lerp(o.vy, (p.y + p.h / 2 - o.y) * 8, 0.3);
    } else { o.vy += 260 * dt; }
    o.x += o.vx * dt; o.y += o.vy * dt;
    const gy = terrainY(o.x, true);
    if (o.y > gy - 3) { o.y = gy - 3; o.vy *= -0.4; o.vx *= 0.9; }
    if (d < 10) {
      if (o.heart) { p.hp = Math.min(p.maxhp, p.hp + 1); }
      else G.doxa += o.val;
      G.sfx.pickup();
      G.orbs.splice(i, 1);
    } else if (o.t > 12) G.orbs.splice(i, 1);
  }
  for (let i = G.projectiles.length - 1; i >= 0; i--) {
    const pr = G.projectiles[i];
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    if (pr.life != null) { pr.life -= dt; if (pr.life <= 0) { G.projectiles.splice(i, 1); continue; } }
    if (pr.kind === 'shock') {
      pr.y = terrainY(pr.x, true) - 8;
    }
    if (!pr.friendly && aabb({ x: pr.x - 2, y: pr.y - 2, w: 5, h: 8 }, p)) {
      damagePlayer(pr.dmg, pr);
      G.projectiles.splice(i, 1);
      continue;
    }
    if (pr.friendly) {
      let used = false;
      for (const e of G.enemies) {
        if (aabb({ x: pr.x - 2, y: pr.y - 2, w: 5, h: 8 }, e)) { hurtEnemy(e, pr.dmg, {}); used = true; break; }
      }
      if (!used && G.boss && G.boss.phase < 5 && aabb({ x: pr.x - 2, y: pr.y - 2, w: 5, h: 8 }, G.boss)) { hitBoss(pr.dmg, {}); used = true; }
      if (used) { G.projectiles.splice(i, 1); continue; }
    }
    if (pr.kind === 'spear' && pr.y > terrainY(pr.x, true)) { G.projectiles.splice(i, 1); continue; }
    if (pr.x < 0 || pr.x > WORLD_W || pr.y > G.H + 40) G.projectiles.splice(i, 1);
  }
  for (let i = G.ramparts.length - 1; i >= 0; i--) {
    const r = G.ramparts[i];
    r.life -= dt;
    if (r.life <= 0 || r.hp <= 0) {
      for (let k = 0; k < 6; k++) addPart(r.x + 4, r.y + 20, (Math.random() - 0.5) * 80, -40, '#8a93a0', 0.5);
      G.ramparts.splice(i, 1);
    }
  }
  for (let i = G.brassPlats.length - 1; i >= 0; i--) {
    const bp = G.brassPlats[i];
    bp.life -= dt;
    if (bp.life <= 0) G.brassPlats.splice(i, 1);
  }
}
