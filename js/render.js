// ============================================================
// ISKANDER — render: parallax acts, the Fraying, sprites, UI
// ============================================================
function FR(x, y, w, h, c) {
  G.ctx.fillStyle = c;
  G.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

const HPAL = {
  helm1: '#8a5a18', helm2: '#c9912f', helm3: '#f3cf6b',
  skin: '#e0a878', skin2: '#a8704c', hair: '#4a2f1b',
  cuir: '#c9912f', cuirHi: '#f3cf6b', cuirSh: '#8a5a18',
  cloak: '#d8b56f', cloak2: '#a5854a', tunic: '#f4ead2',
  sh1: '#5b3a1e', sh2: '#9c6b30', lion: '#f3cf6b',
  spear: '#6b4a2a', tip: '#e8e3d0', blade: '#dfe3e8', greave: '#c9912f',
};
const GPAL = {
  helm1: '#101318', helm2: '#1c222c', helm3: '#39ff6a',
  skin: '#7a8a7d', skin2: '#566057', hair: '#1c222c',
  cuir: '#2a2433', cuirHi: '#b03cff', cuirSh: '#16121d',
  cloak: '#3a2f4a', cloak2: '#241d30', tunic: '#566057',
  sh1: '#1c222c', sh2: '#2a2433', lion: '#ff3963',
  spear: '#2a2433', tip: '#39ff6a', blade: '#b03cff', greave: '#2a2433',
};

// the hero (and everything that mimics him)
function drawHero(p, opts) {
  opts = opts || {};
  const ctx = G.ctx;
  const pal = Object.assign({}, opts.pal || HPAL);
  if (!opts.pal && G.age > 0) pal.hair = mixc('#4a2f1b', '#cfcfcf', clamp(G.age / 8, 0, 1));
  const glitch = opts.glitch;
  const horns = opts.horns != null ? opts.horns : G.flags.shrine;
  ctx.save();
  ctx.translate(Math.round(p.x + p.w / 2), Math.round(p.y));
  ctx.scale(p.face || 1, 1);
  if (opts.scale) ctx.scale(opts.scale, opts.scale);
  function R2(x, y, w, h, c) {
    if (glitch && Math.random() < 0.18) {
      x += Math.floor(Math.random() * 3) - 1;
      if (Math.random() < 0.3) c = Math.random() < 0.5 ? '#39ff6a' : '#b03cff';
    }
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  const atk = p.atk || null;
  const moving = Math.abs(p.vx || 0) > 5;
  const legA = moving ? Math.round(Math.sin(p.runPhase || 0) * 2) : 0;

  // cloak (ochre, flutters when moving)
  const fl = moving ? Math.round(Math.sin((G.time || 0) * 9) * 1.5) : 0;
  R2(-8, 4, 3, 14 + fl, pal.cloak);
  R2(-7, 4, 2, 12, pal.cloak2);

  // back arm shield (front when blocking)
  if (!p.block && atk == null) {
    R2(-7, 7, 6, 6, pal.sh2);
    R2(-6, 8, 4, 4, pal.sh1);
    R2(-5, 9, 2, 2, pal.lion);
  }

  // legs + greaves + sandals
  R2(-3 + legA, 16, 2, 5, pal.skin2);
  R2(2 - legA, 16, 2, 5, pal.skin);
  R2(-3 + legA, 16, 2, 2, pal.greave);
  R2(2 - legA, 16, 2, 2, pal.greave);
  R2(-3 + legA, 21, 3, 1, pal.sh1);
  R2(2 - legA, 21, 3, 1, pal.sh1);

  // pteruges skirt
  for (let i = 0; i < 4; i++) R2(-4 + i * 2, 12, 2, 4, i % 2 ? pal.tunic : pal.cloak2);

  // cuirass
  R2(-4, 6, 9, 6, pal.cuir);
  R2(-1, 6, 2, 6, pal.cuirHi);
  R2(-4, 6, 1, 6, pal.cuirSh);
  R2(-4, 11, 9, 1, pal.sh1);

  // head + helmet
  R2(-2, 1, 6, 5, pal.skin);
  R2(-2, 1, 2, 5, pal.hair);
  R2(-3, -1, 8, 3, pal.helm2);
  R2(-3, 2, 2, 3, pal.helm2);
  R2(3, 2, 2, 2, pal.helm1);
  R2(-3, -1, 8, 1, pal.helm3);
  if (horns) {
    R2(4, -2, 2, 2, pal.helm3); R2(5, -4, 2, 2, pal.helm2); R2(4, -5, 2, 1, pal.helm3);
    R2(-4, -2, 2, 2, pal.helm2); R2(-5, -4, 2, 2, pal.helm1);
  }

  // weapons
  if (atk && atk.kind === 'spear') {
    R2(2, 8, 24, 1, pal.spear); R2(26, 7, 3, 3, pal.tip);
  } else if (atk && atk.kind === 'lunge') {
    R2(2, 8, 28, 2, pal.spear); R2(30, 7, 4, 4, pal.tip);
  } else if (atk && atk.kind === 'sword') {
    if (atk.idx === 0) { R2(5, -4, 2, 10, pal.blade); R2(4, 5, 4, 2, pal.helm2); }
    else if (atk.idx === 1) { R2(6, 7, 12, 2, pal.blade); R2(5, 6, 2, 4, pal.helm2); }
    else { R2(6, 12, 11, 2, pal.blade); R2(5, 10, 2, 4, pal.helm2); }
  } else if (atk && atk.kind === 'bash') {
    // shield thrust
  } else if (p.charge > 0) {
    R2(-12, 6, 8, 1, pal.helm3); R2(-14, 9, 6, 1, pal.helm3);
  } else {
    R2(6, -6, 1, 24, pal.spear); R2(5, -9, 3, 3, pal.tip);
  }

  // shield front (block / bash)
  if (p.block || (atk && atk.kind === 'bash')) {
    const sx2 = atk && atk.kind === 'bash' ? 7 : 5;
    R2(sx2, 5, 7, 11, pal.sh2);
    R2(sx2 + 1, 6, 5, 9, pal.sh1);
    R2(sx2 + 2, 9, 3, 3, pal.lion);
    R2(sx2 + 3, 8, 1, 1, pal.sh1);
  }

  // Tier-2 divinity shimmer
  if (horns && !glitch && Math.random() < 0.12) {
    R2(-5 + Math.floor(Math.random() * 11), -3 + Math.floor(Math.random() * 22), 1, 1, '#f3cf6b');
  }
  ctx.restore();
}

function drawEnemy(e) {
  const t = G.time;
  const gl = e.petrified > 0 ? 0 : 1;
  function gc(c) {
    if (e.petrified > 0) return '#8a93a0';
    return (gl && Math.random() < 0.15) ? (Math.random() < 0.5 ? '#39ff6a' : '#b03cff') : c;
  }
  const jx = e.petrified > 0 ? 0 : (Math.random() < 0.3 ? Math.floor(Math.random() * 3) - 1 : 0);
  if (e.type === 'numberless') {
    FR(e.x + jx, e.y, 6, 6, gc('#2a2433'));
    FR(e.x + 1 + jx, e.y + 1, 2, 2, gc('#39ff6a'));
    FR(e.x + 4, e.y + 2, 1, 1, gc('#ff3963'));
  } else if (e.type === 'licker') {
    for (let i = 0; i < 4; i++) {
      const sy = Math.sin(t * 8 + i * 1.2 + e.seed) * 2;
      FR(e.x + i * 4 + jx, e.y + 3 + sy, 4, 4, gc(i === 0 ? '#3a4a3d' : '#2a2433'));
    }
    FR(e.x + (e.facing === -1 ? 0 : 12) + jx, e.y + 2, 2, 2, gc('#39ff6a'));
    FR(e.x + (e.facing === -1 ? -2 : 16), e.y + 5, 2, 1, gc('#b03cff'));
  } else if (e.type === 'biter') {
    FR(e.x + jx, e.y, 18, 9, gc('#3a3f46'));
    FR(e.x + 2, e.y + 2, 14, 5, gc('#2a2433'));
    for (let i = 0; i < 3; i++) FR(e.x + 3 + i * 5, e.y + 1, 2, 1, gc('#6a7079'));
    FR(e.x, e.y + 9, 4, 3, gc('#2a2433'));
    FR(e.x + 14, e.y + 9, 4, 3, gc('#2a2433'));
    const mo = Math.floor(t * 14) % 2;
    const mx = e.facing === -1 ? e.x - 3 : e.x + 18;
    FR(mx, e.y + 2 + mo, 3, 2, gc('#dfe3e8'));
    FR(mx, e.y + 6 - mo, 3, 2, gc('#dfe3e8'));
    FR(e.x + (e.facing === -1 ? 2 : 14), e.y + 3, 2, 2, gc('#ff3963'));
  } else if (e.type === 'echoborn') {
    drawHero({ x: e.x, y: e.y, w: e.w, h: e.h, face: e.facing, vx: e.vx, runPhase: t * 10, block: false, atk: null, charge: 0 },
      { pal: GPAL, glitch: e.petrified <= 0, horns: true });
    if (e.petrified > 0) { G.ctx.globalAlpha = 0.75; FR(e.x - 2, e.y - 4, 14, 28, '#8a93a0'); G.ctx.globalAlpha = 1; }
  }
}

function drawBoss() {
  const b = G.boss;
  if (!b) return;
  const t = G.time;
  function gc(c) { return Math.random() < 0.13 ? (Math.random() < 0.5 ? '#39ff6a' : '#b03cff') : c; }
  if (b.phase === 1) {
    // flayed mammoth-thing + rider
    const x = b.x, y = b.y;
    FR(x, y + 8, 52, 22, gc('#5a2f2a'));
    for (let i = 0; i < 5; i++) FR(x + 2 + i * 10, y + 10, 8, 2, gc('#7a4038'));
    FR(x + (b.chargeDir === 1 ? 40 : 0), y, 14, 14, gc('#5a2f2a'));
    const hx = b.chargeDir === 1 || (G.player.x > x) ? x + 44 : x - 2;
    FR(hx, y + 4, 10, 8, gc('#4a2522'));
    FR(hx + 2, y + 12, 8, 3, gc('#dfe3e8'));
    FR(hx + 4, y + 6, 2, 2, gc('#ff3963'));
    for (let i = 0; i < 4; i++) FR(x + 4 + i * 13, y + 30, 6, 10, gc('#4a2522'));
    // the rider
    FR(x + 20, y - 10, 8, 12, gc('#2a2433'));
    FR(x + 21, y - 14, 6, 4, gc('#1c222c'));
    FR(x + 22, y - 13, 1, 1, gc('#39ff6a'));
    FR(x + 25, y - 13, 1, 1, gc('#39ff6a'));
    if (b.state === 'telegraph') { G.ctx.globalAlpha = 0.5 + Math.sin(t * 30) * 0.3; FR(x - 4, y - 16, 60, 4, '#ff3963'); G.ctx.globalAlpha = 1; }
  } else if (b.phase === 2) {
    // the Swarm Crown
    for (let i = 0; i < 9; i++) {
      const ox = Math.sin(t * 6 + i * 2.2) * 4, oy = Math.cos(t * 7 + i * 1.7) * 3;
      FR(b.x + 4 + (i % 3) * 7 + ox, b.y + 4 + Math.floor(i / 3) * 10 + oy, 7, 8, gc('#2a2433'));
    }
    for (let i = 0; i < 4; i++) FR(b.x + 4 + i * 6, b.y - 4 + Math.sin(t * 9 + i) * 2, 3, 6, gc('#1c222c'));
    FR(b.x + 8, b.y + 6, 2, 2, gc('#ff3963'));
    FR(b.x + 16, b.y + 6, 2, 2, gc('#ff3963'));
    if (b.aflame > 0) {
      G.ctx.globalAlpha = 0.7;
      FR(b.x - 2, b.y - 6, b.w + 4, 4, '#f3a33c');
      FR(b.x - 2, b.y - 2, 3, b.h, '#f3a33c');
      FR(b.x + b.w - 1, b.y - 2, 3, b.h, '#f3a33c');
      G.ctx.globalAlpha = 1;
    }
  } else if (b.phase === 3) {
    drawHero({ x: b.x, y: b.y, w: 10, h: 22, face: G.player.x < b.x ? -1 : 1, vx: b.vx, runPhase: t * 10, block: b.parryCd <= 0, atk: null, charge: 0 },
      { pal: GPAL, glitch: true, horns: true });
  }
}

// ---------- the world ----------
function drawSky(camX) {
  const pal = palAt(camX + G.W / 2);
  const ctx = G.ctx;
  const bands = 9;
  for (let i = 0; i < bands; i++) {
    FR(0, i * (G.H / bands), G.W, G.H / bands + 1, mixc(pal.top, pal.bot, i / (bands - 1)));
  }
  // dither seams between bands
  ctx.globalAlpha = 0.5;
  for (let i = 1; i < bands; i++) {
    const y = Math.round(i * (G.H / bands));
    const c = mixc(pal.top, pal.bot, i / (bands - 1));
    for (let x = 0; x < G.W; x += 4) {
      if (hash2(x, i) < 0.5) FR(x + (i % 2) * 2, y - 2, 2, 2, c);
    }
  }
  ctx.globalAlpha = 1;
  const t = zoneT(camX + G.W / 2);
  // Act I/II sun
  if (t < 1.6) {
    const sa = 1 - clamp(t - 0.8, 0, 0.8) / 0.8;
    ctx.globalAlpha = 0.9;
    FR(330 - t * 60, 50 + t * 30, 26, 26, '#f6e3a8');
    FR(334 - t * 60, 46 + t * 30, 18, 34, '#f6e3a8');
    ctx.globalAlpha = 0.25 * sa;
    FR(320 - t * 60, 40 + t * 30, 46, 46, '#f6c87a');
    ctx.globalAlpha = 1;
  }
  // stars + aurora at the Roof of the World
  if (t > 1.4) {
    const a = clamp((t - 1.4) / 0.6, 0, 1);
    ctx.globalAlpha = a * 0.8;
    for (let i = 0; i < 40; i++) {
      FR(hash2(i, 1) * G.W, hash2(i, 2) * 120, 1, 1, '#dfe8ef');
    }
    const pulse = 0.5 + Math.sin(G.time * 1.3) * 0.25 + (G.front ? clamp(1 - (G.front.x - 4300) / 800, 0, 0.4) : 0);
    for (let band = 0; band < 3; band++) {
      ctx.globalAlpha = a * 0.13 * pulse * (3 - band);
      for (let x = 0; x < G.W; x += 6) {
        const y = 30 + band * 16 + Math.sin(x * 0.02 + G.time * 0.7 + band * 2) * 14;
        FR(x, y, 6, 22, band === 1 ? '#b03cff' : '#39ff6a');
      }
    }
    ctx.globalAlpha = 1;
  }
}

function drawFar(camX) {
  const ctx = G.ctx;
  const t = zoneT(camX + G.W / 2);
  const pal = palAt(camX + G.W / 2);
  const px = camX * 0.18;
  ctx.globalAlpha = 0.85;
  if (t < 1.3) {
    // Olympus & pyramids
    for (let i = -1; i < 5; i++) {
      const bx = i * 220 - (px % 220);
      const peak = 70 + hash2(i + Math.floor((camX * 0.18) / 220), 7) * 30;
      ctx.fillStyle = pal.far;
      ctx.beginPath();
      ctx.moveTo(bx, 210); ctx.lineTo(bx + 80, peak); ctx.lineTo(bx + 170, 210);
      ctx.fill();
    }
    if (camX > 600) {
      const a = clamp((camX - 600) / 500, 0, 1) * (t < 1 ? 1 : 1 - (t - 1));
      ctx.globalAlpha = 0.7 * clamp(a, 0, 1);
      const bx = 300 - ((camX * 0.25) % 700);
      ctx.fillStyle = mixc(pal.far, '#e8d9a0', 0.4);
      ctx.beginPath(); ctx.moveTo(bx, 205); ctx.lineTo(bx + 55, 130); ctx.lineTo(bx + 110, 205); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx + 130, 205); ctx.lineTo(bx + 170, 155); ctx.lineTo(bx + 210, 205); ctx.fill();
    }
  }
  if (t >= 1.3) {
    // jagged peaks, back-lit by the Breach: a false dawn rising in the east
    const a = clamp((t - 1.3) / 0.7, 0, 1);
    ctx.globalAlpha = a;
    const pulse = 0.5 + Math.sin(G.time * 2.1) * 0.2;
    const grd = ctx.createLinearGradient(G.W * 0.4, 0, G.W, 0);
    grd.addColorStop(0, 'rgba(120,20,30,0)');
    grd.addColorStop(1, 'rgba(220,40,50,' + (0.30 * pulse * a) + ')');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, G.W, 210);
    for (let i = -1; i < 6; i++) {
      const bx = i * 150 - ((camX * 0.22) % 150);
      const peak = 50 + hash2(i + Math.floor((camX * 0.22) / 150), 9) * 50;
      ctx.fillStyle = mixc(pal.far, '#1d2434', 0.5);
      ctx.beginPath();
      ctx.moveTo(bx, 215); ctx.lineTo(bx + 60, peak); ctx.lineTo(bx + 75, peak + 14); ctx.lineTo(bx + 95, peak - 8); ctx.lineTo(bx + 150, 215);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawMid(camX) {
  const ctx = G.ctx;
  const t = zoneT(camX + G.W / 2);
  const pal = palAt(camX + G.W / 2);
  const px = camX * 0.5;
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = pal.mid;
  FR(0, 196, G.W, 80, mixc(pal.mid, pal.ground, 0.4));
  for (let i = -1; i < 4; i++) {
    const seed = i + Math.floor(px / 260);
    const bx = i * 260 - (px % 260);
    const r = hash2(seed, 11);
    if (t < 1.2 && r < 0.6) {
      // temple silhouettes
      const ty = 158 + r * 20;
      for (let c2 = 0; c2 < 4; c2++) FR(bx + 40 + c2 * 9, ty, 4, 196 - ty, pal.mid);
      FR(bx + 34, ty - 6, 48, 6, pal.mid);
      ctx.beginPath(); ctx.fillStyle = pal.mid;
      ctx.moveTo(bx + 34, ty - 6); ctx.lineTo(bx + 58, ty - 18); ctx.lineTo(bx + 82, ty - 6); ctx.fill();
    } else if (t >= 1.2 && t < 1.8) {
      for (let g2 = 0; g2 < 6; g2++) FR(bx + g2 * 40 + r * 30, 188 + hash2(seed, g2) * 6, 26, 4, pal.mid);
    } else if (t >= 1.8) {
      ctx.beginPath(); ctx.fillStyle = pal.mid;
      ctx.moveTo(bx, 196); ctx.lineTo(bx + 70 + r * 60, 120 + r * 40); ctx.lineTo(bx + 180, 196); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawTerrain(camX) {
  const c0 = Math.max(0, Math.floor(camX / TS) - 1);
  const c1 = Math.min(COLS - 1, c0 + Math.ceil(G.W / TS) + 2);
  for (let c = c0; c <= c1; c++) {
    const x = c * TS;
    const pal = palAt(x);
    if (G.world.water[c]) {
      const wob = Math.sin(G.time * 3 + c) > 0.4 ? 1 : 0;
      FR(x, WATER_Y + wob, TS, G.H - WATER_Y, mixc('#3a7d96', pal.bot, 0.2));
      FR(x, WATER_Y + wob, TS, 2, '#7ec0d8');
      if (hash2(c, Math.floor(G.time * 4)) < 0.3) FR(x + 4, WATER_Y + 3 + wob, 4, 1, '#a8dcec');
      continue;
    }
    const gy = G.world.ground[c];
    const shade = 0.92 + hash2(c, 3) * 0.16;
    FR(x, gy, TS, 4, pal.grass);
    FR(x, gy + 4, TS, G.H - gy, mixc(pal.ground, '#000000', 1 - shade + 0.04));
    FR(x, gy + 26, TS, G.H - gy - 26, mixc(pal.dirt, '#000000', 1 - shade + 0.06));
    // dither speckles
    for (let s = 0; s < 3; s++) {
      const hx = hash2(c * 7 + s, 5);
      FR(x + Math.floor(hx * 14), gy + 6 + Math.floor(hash2(c, s + 9) * 30), 2, 2, mixc(pal.ground, pal.grass, 0.4));
    }
  }
  // one-way platforms
  for (const p of G.world.plats) {
    if (p.x + p.w < camX - 8 || p.x > camX + G.W + 8) continue;
    const pal = palAt(p.x);
    FR(p.x, p.y, p.w, 3, mixc(pal.ground, '#000', 0.25));
    FR(p.x, p.y, p.w, 1, pal.grass);
  }
  for (const bp of G.brassPlats) {
    const a = clamp(bp.life / 3, 0, 1);
    G.ctx.globalAlpha = a;
    FR(bp.x, bp.y, bp.w, 4, '#d9a85a');
    FR(bp.x, bp.y, bp.w, 1, '#f3cf6b');
    G.ctx.globalAlpha = 1;
  }
}

function drawDecos(camX) {
  for (const d of G.world.decos) {
    if (d.x < camX - 30 || d.x > camX + G.W + 30) continue;
    const gy = terrainY(d.x + 4, true);
    if (gy > 900) continue;
    const pal = palAt(d.x);
    if (d.type === 'column') {
      FR(d.x, gy - d.h, 8, d.h, '#e8e0cc');
      FR(d.x + 1, gy - d.h, 2, d.h, '#fff8e8');
      FR(d.x - 2, gy - d.h, 12, 3, '#e8e0cc');
      FR(d.x - 2, gy - 3, 12, 3, '#d8d0bc');
    } else if (d.type === 'brokencol') {
      FR(d.x, gy - d.h, 8, d.h, '#ddd5c0');
      FR(d.x - 1, gy - d.h, 10, 2, '#c8c0ac');
    } else if (d.type === 'laurel') {
      FR(d.x + 3, gy - 6, 2, 6, '#6b4a2a');
      FR(d.x, gy - 12, 8, 7, '#7d9c48');
      FR(d.x + 2, gy - 14, 4, 3, '#94b35a');
    } else if (d.type === 'tuft') {
      FR(d.x, gy - 4, 1, 4, pal.grass);
      FR(d.x + 3, gy - 6, 1, 6, mixc(pal.grass, '#fff', 0.15));
      FR(d.x + 6, gy - 3, 1, 3, pal.grass);
    } else if (d.type === 'yurt') {
      FR(d.x - 4, gy - 12, 24, 12, '#b09a78');
      FR(d.x - 1, gy - 17, 18, 6, '#94805f');
      FR(d.x + 6, gy - 8, 5, 8, '#594031');
    } else if (d.type === 'bones') {
      FR(d.x, gy - 3, 10, 2, '#e8e3d0');
      FR(d.x + 3, gy - 6, 2, 4, '#e8e3d0');
    } else if (d.type === 'pine') {
      FR(d.x + 3, gy - d.h, 3, d.h, '#3d3328');
      for (let i = 0; i < 4; i++) {
        const w = 16 - i * 3;
        FR(d.x + 4.5 - w / 2, gy - d.h + 2 + i * 5 - 14, w, 5, i % 2 ? '#2e4438' : '#3a5546');
        FR(d.x + 4.5 - w / 2, gy - d.h + 2 + i * 5 - 14, w, 1, '#dfe8ef');
      }
    } else if (d.type === 'shard') {
      FR(d.x, gy - d.h, 4, d.h, '#9fb2c4');
      FR(d.x + 1, gy - d.h, 1, d.h, '#dfe8ef');
    }
  }
}

function drawLandmarks(camX) {
  const w = G.world;
  // Siwa shrine
  if (w.shrine.x > camX - 60 && w.shrine.x < camX + G.W + 60) {
    const x = w.shrine.x, gy = terrainY(x, true);
    FR(x - 14, gy - 30, 6, 30, '#e8e0cc');
    FR(x + 8, gy - 30, 6, 30, '#e8e0cc');
    FR(x - 18, gy - 34, 36, 5, '#e8e0cc');
    FR(x - 4, gy - 24, 8, 8, w.shrine.used ? '#f3cf6b' : '#c9912f');
    FR(x - 6, gy - 26, 3, 3, '#c9912f'); FR(x + 3, gy - 26, 3, 3, '#c9912f');
    if (!w.shrine.used && Math.random() < 0.15) addPart(x + (Math.random() - 0.5) * 20, gy - 30, 0, -20, '#f3cf6b', 0.8);
    if (!w.shrine.used && Math.abs(G.player.x - x) < 30) drawPrompt(x, gy - 44, 'E: COMMUNE');
  }
  // forge-camp
  if (w.camp.x > camX - 60 && w.camp.x < camX + G.W + 60) {
    const x = w.camp.x, gy = terrainY(x, true);
    FR(x - 20, gy - 14, 16, 14, '#94805f');
    FR(x - 16, gy - 18, 8, 5, '#b09a78');
    FR(x + 8, gy - 3, 12, 3, '#3d3328');
    const f = Math.floor(G.time * 8) % 2;
    FR(x + 11, gy - 8 + f, 6, 6 - f, '#f3a33c');
    FR(x + 13, gy - 10 + f, 2, 3, '#f6e3a8');
    FR(x - 2, gy - 26, 2, 26, '#6b4a2a');
    FR(x, gy - 26, 8, 5, '#c9912f');
    if (Math.abs(G.player.x - x) < 30 && G.player.hp < G.player.maxhp) drawPrompt(x, gy - 34, 'E: REST');
  }
  // braziers at the gate
  for (const bx of w.braziers) {
    if (bx < camX - 30 || bx > camX + G.W + 30) continue;
    const gy = terrainY(bx, true);
    FR(bx - 1, gy - 12, 3, 12, '#3a3f46');
    FR(bx - 4, gy - 15, 9, 4, '#5b5f66');
    const f = Math.floor(G.time * 9 + bx) % 2;
    FR(bx - 3, gy - 21 + f, 7, 6 - f, '#f3a33c');
    FR(bx - 1, gy - 23 + f, 3, 3, '#f6e3a8');
  }
  // cracked rocks
  for (const r of w.rocks) {
    if (r.broken) continue;
    FR(r.x, r.y, r.w, r.h, '#7d6a55');
    FR(r.x + 2, r.y + 2, r.w - 4, r.h - 4, '#94805f');
    FR(r.x + 8, r.y + 4, 2, r.h - 10, '#54462f');
    FR(r.x + 4, r.y + r.h / 2, r.w - 8, 2, '#54462f');
  }
  // cages
  for (const cg of w.cages) {
    if (cg.freed) continue;
    FR(cg.x, cg.y, cg.w, cg.h, '#2a2433');
    FR(cg.x + 2, cg.y + 2, cg.w - 4, cg.h - 4, '#0b0908');
    for (let i = 0; i < 4; i++) FR(cg.x + 2 + i * 4, cg.y, 1, cg.h, '#3a3f46');
    FR(cg.x + 6, cg.y + 8, 6, 10, '#a8704c');
    FR(cg.x + 7, cg.y + 5, 4, 4, '#e0a878');
  }
  // ore nodes
  for (const n of w.nodes) {
    if (n.amt <= 0) continue;
    if (n.x < camX - 20 || n.x > camX + G.W + 20) continue;
    const c = n.type === 'iron' ? '#8a93a0' : '#d9a85a';
    FR(n.x - 5, n.y, 10, 8, '#54462f');
    FR(n.x - 3, n.y + 1, 3, 3, c);
    FR(n.x + 1, n.y + 3, 3, 3, c);
    FR(n.x - 1, n.y - 1, 2, 2, c);
    if (Math.abs(G.player.x - n.x) < 18) drawPrompt(n.x, n.y - 12, 'HOLD E: MINE');
  }
  // relics
  for (const r of w.relics) {
    if (r.got) continue;
    if (r.x < camX - 20 || r.x > camX + G.W + 20) continue;
    const bob = Math.sin(G.time * 3 + r.x) * 2;
    FR(r.x - 3, r.y + bob, 6, 6, '#b08fdd');
    FR(r.x - 1, r.y - 2 + bob, 2, 2, '#e0d0f8');
    if (Math.random() < 0.1) addPart(r.x, r.y + bob, (Math.random() - 0.5) * 20, -20, '#b08fdd', 0.5);
  }
}

function drawWall(camX) {
  const wl = G.wall;
  if (wl.x0 + 8 * wl.segW < camX - 40 || wl.x0 > camX + G.W + 40) return;
  for (const s of wl.segs) {
    const h = s.base - s.top;
    const isGate = s.i === wl.gateIndex;
    if (s.stage === 0) {
      // foundation stones + marker
      FR(s.x + 2, s.base - 4, s.w - 4, 4, '#6a7079');
      FR(s.x + s.w / 2 - 1, s.base - 18, 2, 14, '#6b4a2a');
      FR(s.x + s.w / 2 + 1, s.base - 18, 7, 5, G.iron >= 3 ? '#c9912f' : '#8a5a18');
      if (Math.abs(G.player.x - (s.x + s.w / 2)) < 22 && G.flags.reachedWall) drawPrompt(s.x + s.w / 2, s.base - 28, 'E: BUILD (IRON)');
    } else {
      const dmg = s.hp / s.maxhp;
      // iron block courses
      for (let row = 0; row < Math.ceil(h / 8); row++) {
        const off = (row % 2) * 6;
        FR(s.x, s.top + row * 8, s.w, 8, row % 2 ? '#3a3f46' : '#41464e');
        FR(s.x + off + 3, s.top + row * 8 + 3, 2, 2, '#6a7079');
        FR(s.x + off + 14, s.top + row * 8 + 5, 2, 2, '#565b63');
      }
      // battlement
      for (let m2 = 0; m2 < 3; m2++) FR(s.x + 2 + m2 * 9, s.top - 5, 6, 5, '#3a3f46');
      if (s.stage === 2) {
        // brass seams + meander engraving: the Iron Verse made real
        FR(s.x + 4, s.top, 2, h, '#d9a85a');
        FR(s.x + s.w - 6, s.top, 2, h, '#d9a85a');
        FR(s.x, s.top + 10, s.w, 2, '#d9a85a');
        for (let mx = 0; mx < 3; mx++) FR(s.x + 4 + mx * 8, s.top + 16, 4, 2, '#c9912f');
        if (Math.random() < 0.06) FR(s.x + Math.random() * s.w, s.top + Math.random() * h, 1, 1, '#f3cf6b');
      }
      if (s.weak) FR(s.x + s.w / 2 - 1, s.top + 8, 2, h - 16, '#1d2434');
      // damage cracks
      if (dmg < 0.7) {
        FR(s.x + 6, s.top + 12, 2, h * (1 - dmg) * 0.5, '#16121d');
        FR(s.x + 16, s.top + 20, 2, h * (1 - dmg) * 0.4, '#16121d');
      }
      // hp pip
      if (s.hp < s.maxhp) {
        FR(s.x + 2, s.top - 10, s.w - 4, 3, '#16121d');
        FR(s.x + 3, s.top - 9, (s.w - 6) * dmg, 1, dmg > 0.4 ? '#7d9c48' : '#ff3963');
      }
      if (isGate) {
        FR(s.x + s.w / 2 - 5, s.base - 16, 10, 16, G.flags.bossDone ? '#d9a85a' : '#16121d');
        FR(s.x + s.w / 2 - 4, s.base - 14, 8, 14, G.flags.bossDone ? '#c9912f' : '#0b0908');
        // the gate lion
        FR(s.x + s.w / 2 - 2, s.top + 24, 4, 4, '#f3cf6b');
        if (G.flags.bossDone) {
          // the Khagan, entombed mid-lunge, forever
          FR(s.x + s.w / 2 - 3, s.top + 30, 6, 10, '#8a6f3c');
          FR(s.x + s.w / 2 - 5, s.top + 33, 3, 3, '#8a6f3c');
          FR(s.x + s.w / 2 + 2, s.top + 31, 3, 2, '#8a6f3c');
        }
      }
      if (s.stage === 1 && Math.abs(G.player.x - (s.x + s.w / 2)) < 22) {
        drawPrompt(s.x + s.w / 2, s.top - 16, s.hp < s.maxhp * 0.6 ? 'E: REPAIR' : 'E: POUR BRASS (2)');
      }
    }
  }
  // ramparts (Iron Verse)
  for (const r of G.ramparts) {
    const a = clamp(r.life / 2, 0, 1);
    G.ctx.globalAlpha = Math.min(1, a + 0.4);
    FR(r.x, r.y, r.w, r.h, '#3a3f46');
    FR(r.x + 1, r.y, 2, r.h, '#6a7079');
    FR(r.x, r.y, r.w, 3, '#8a93a0');
    G.ctx.globalAlpha = 1;
  }
  // seal progress during the finale
  if (G.seal && G.boss && G.boss.phase === 4) {
    const gx = wl.gateX;
    FR(gx - 16, 120, 32, 5, '#16121d');
    FR(gx - 15, 121, 30 * clamp(G.seal.t / G.seal.need, 0, 1), 3, '#f3a33c');
    drawPrompt(gx, 112, 'HOLD E: SEAL THE GATE');
  }
}

function drawPrompt(x, y, text) {
  const ctx = G.ctx;
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#16121d';
  const w = ctx.measureText(text).width + 6;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - 7), Math.round(w), 10);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f3cf6b';
  ctx.fillText(text, Math.round(x), Math.round(y));
  ctx.textAlign = 'left';
}

// the Fraying: corruption eats the art style itself
function drawFraying(camX) {
  const f = G.front;
  if (!f || f.x > camX + G.W) return;
  const ctx = G.ctx;
  const startX = Math.max(camX, f.x);
  for (let x = Math.floor(startX / 8) * 8; x < camX + G.W; x += 8) {
    const depth = clamp((x - f.x) / 400 + 0.25, 0, 1);
    for (let y = 0; y < G.H; y += 8) {
      const n = hash2(x + Math.floor(G.time * 7) * 31, y);
      if (n < depth * 0.30) {
        ctx.globalAlpha = 0.12 + depth * 0.22;
        const c = n < depth * 0.08 ? '#39ff6a' : n < depth * 0.16 ? '#b03cff' : '#16121d';
        FR(x + (n * 64) % 6, y + (n * 256) % 6, 3 + n * 6, 2 + n * 4, c);
      }
    }
  }
  // the front line itself: a curtain of static
  ctx.globalAlpha = 0.5;
  for (let y = 0; y < G.H; y += 4) {
    const wob = Math.sin(y * 0.1 + G.time * 4) * 4 + (hash2(y, Math.floor(G.time * 10)) - 0.5) * 8;
    FR(f.x + wob, y, 3, 4, hash2(y, Math.floor(G.time * 12)) < 0.5 ? '#39ff6a' : '#b03cff');
  }
  ctx.globalAlpha = 1;
}

function drawWeather(camX, front) {
  const t = zoneT(camX + G.W / 2);
  const ctx = G.ctx;
  if (t > 1.55) {
    // blizzard, in front of AND behind the action
    const a = clamp((t - 1.55) / 0.45, 0, 1);
    ctx.globalAlpha = (front ? 0.55 : 0.3) * a;
    const n = front ? 36 : 26;
    for (let i = 0; i < n; i++) {
      const spd = front ? 60 + (i % 4) * 22 : 30 + (i % 3) * 12;
      const x = ((i * 137 + 53) - G.time * spd * 1.6 - camX * (front ? 0.3 : 0.1)) % G.W;
      const y = (i * 61 + G.time * spd) % G.H;
      FR(((x % G.W) + G.W) % G.W, y, front ? 2 : 1, front ? 2 : 1, '#dfe8ef');
    }
    ctx.globalAlpha = 1;
  } else if (t > 0.6 && t < 1.5 && front) {
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 16; i++) {
      const x = ((i * 167) - G.time * (40 + (i % 3) * 25) - camX * 0.2) % G.W;
      const y = (i * 47 + Math.sin(G.time + i) * 20) % G.H;
      FR(((x % G.W) + G.W) % G.W, ((y % G.H) + G.H) % G.H, 3, 1, '#d8b56f');
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- UI ----------
// the Greek key border — it mutates per act, and the Fraying bites it
function drawMeander() {
  const ctx = G.ctx;
  const t = zoneT(G.cam.x + G.W / 2);
  let col = mixc('#c9912f', '#9fb2c4', clamp(t - 1, 0, 1));
  const bg = '#16121d';
  FR(0, 0, G.W, 8, bg); FR(0, G.H - 8, G.W, 8, bg);
  FR(0, 0, 8, G.H, bg); FR(G.W - 8, 0, 8, G.H, bg);
  const corrupted = G.front && G.front.x < G.cam.x + G.W;
  for (let x = 0; x < G.W; x += 8) {
    let c = col;
    if (corrupted && hash2(x, Math.floor(G.time * 5)) < 0.1) c = '#39ff6a';
    const k = (x / 8) % 2;
    FR(x + 1, 2, 6, 1, c); FR(x + 1, 5, 6, 1, c);
    FR(x + (k ? 1 : 5), 3, 1, 2, c);
    FR(x + 1, G.H - 6, 6, 1, c); FR(x + 1, G.H - 3, 6, 1, c);
    FR(x + (k ? 5 : 1), G.H - 5, 1, 2, c);
    if (t > 0.5 && t < 1.6 && k) { FR(x + 3, 3, 1, 1, '#d8a35e'); FR(x + 3, G.H - 4, 1, 1, '#d8a35e'); }
  }
  for (let y = 8; y < G.H - 8; y += 8) {
    let c = col;
    if (corrupted && hash2(y * 3, Math.floor(G.time * 5)) < 0.1) c = '#b03cff';
    const k = (y / 8) % 2;
    FR(2, y + 1, 1, 6, c); FR(5, y + 1, 1, 6, c);
    FR(3, y + (k ? 1 : 5), 2, 1, c);
    FR(G.W - 3, y + 1, 1, 6, c); FR(G.W - 6, y + 1, 1, 6, c);
    FR(G.W - 5, y + (k ? 5 : 1), 2, 1, c);
  }
}

function drawHeart(x, y, fill) {
  FR(x, y, 2, 2, fill ? '#ff3963' : '#3a2430');
  FR(x + 3, y, 2, 2, fill ? '#ff3963' : '#3a2430');
  FR(x, y + 1, 5, 2, fill ? '#ff3963' : '#3a2430');
  FR(x + 1, y + 3, 3, 1, fill ? '#c92347' : '#2a1a24');
  FR(x + 2, y + 4, 1, 1, fill ? '#c92347' : '#2a1a24');
}

function fmtTime(s) {
  s = Math.max(0, Math.ceil(s));
  return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
}

function drawHUD() {
  const ctx = G.ctx;
  const p = G.player;
  ctx.font = '7px monospace';
  ctx.textAlign = 'left';
  // hearts
  for (let i = 0; i < Math.ceil(p.maxhp); i++) drawHeart(12 + i * 7, 12, p.hp > i);
  // currencies & materials
  FR(12, 22, 4, 4, '#f3cf6b');
  ctx.fillStyle = '#f3cf6b'; ctx.fillText('' + Math.floor(G.doxa), 19, 27);
  FR(44, 22, 4, 4, '#b08fdd');
  ctx.fillStyle = '#b08fdd'; ctx.fillText('' + G.mythos, 51, 27);
  FR(70, 22, 4, 4, '#8a93a0');
  ctx.fillStyle = '#8a93a0'; ctx.fillText('' + G.iron, 77, 27);
  FR(96, 22, 4, 4, '#d9a85a');
  ctx.fillStyle = '#d9a85a'; ctx.fillText('' + G.brass, 103, 27);
  if (G.engineers > 0) { ctx.fillStyle = '#7d9c48'; ctx.fillText('ENG x' + G.engineers, 122, 27); }

  // doom-clock
  if (G.flags.reachedWall && !G.flags.bossDone) {
    ctx.textAlign = 'center';
    const ws = G.waveSys;
    if (G.boss) {
      const b = G.boss;
      ctx.fillStyle = '#ff3963';
      const pn = ['', 'THE RIDER', 'THE SWARM CROWN', 'THE FALSE ISKANDER', 'THE SEALING'][b.phase];
      ctx.fillText('YAJUJ-KHAGAN — ' + pn, G.W / 2, 18);
      if (b.phase < 4) {
        FR(G.W / 2 - 60, 21, 120, 5, '#16121d');
        FR(G.W / 2 - 59, 22, 118 * clamp(b.hp / b.maxhp, 0, 1), 3, '#ff3963');
      }
    } else if (ws.bossNext) {
      ctx.fillStyle = '#ff3963';
      ctx.fillText('IT COMES  ' + fmtTime(ws.bossT), G.W / 2, 18);
    } else if (ws.active) {
      let alive = 0;
      for (const e of G.enemies) if (e.waveTag) alive++;
      ctx.fillStyle = '#39ff6a';
      ctx.fillText('WAVE ' + ws.wave + ' — ' + alive + ' REMAIN', G.W / 2, 18);
    } else {
      ctx.fillStyle = ws.t < 12 ? '#ff3963' : '#d8b56f';
      ctx.fillText('NEXT WAVE  ' + fmtTime(ws.t), G.W / 2, 18);
    }
    ctx.textAlign = 'left';
  }

  // strategic strip: the whole Wall as one tapestry
  const mx = G.W - 130, my = 14, mw = 116;
  FR(mx - 2, my - 2, mw + 4, 12, '#16121d');
  FR(mx, my + 4, mw, 2, '#54462f');
  const sc = mw / WORLD_W;
  for (const s of G.wall.segs) {
    const c = s.stage === 0 ? '#54462f' : s.stage === 1 ? '#8a93a0' : '#d9a85a';
    FR(mx + s.x * sc, my + 1, 1, 8, c);
  }
  const fx = mx + clamp(G.front.x, 0, WORLD_W) * sc;
  G.ctx.globalAlpha = 0.6;
  FR(fx, my, mx + mw - fx, 10, '#b03cff');
  G.ctx.globalAlpha = 1;
  FR(mx + G.world.camp.x * sc, my + 2, 1, 6, '#7d9c48');
  FR(mx + p.x * sc - 1, my + 2, 2, 6, '#f3cf6b');

  // skill slots
  const slots = [
    { id: 'phalanx', key: '1' }, { id: 'horns', key: '2' },
    { id: 'ironverse', key: '3' }, { id: 'brasstide', key: '4' }, { id: 'roar', key: '5' },
  ];
  let sx = 12;
  for (const sl of slots) {
    if (!G.skills[sl.id]) { continue; }
    FR(sx, G.H - 24, 12, 12, '#16121d');
    FR(sx + 1, G.H - 23, 10, 10, '#2a2433');
    ctx.fillStyle = '#f3cf6b';
    ctx.fillText(sl.key, sx + 4, G.H - 15);
    const cd = G.player.cds[sl.id];
    const max = { phalanx: 14, horns: 9, ironverse: 16, brasstide: 14, roar: 45 }[sl.id];
    if (cd > 0) {
      ctx.globalAlpha = 0.7;
      FR(sx + 1, G.H - 23, 10, 10 * (cd / max), '#0b0908');
      ctx.globalAlpha = 1;
    }
    sx += 14;
  }
  ctx.fillStyle = '#8a7d6a';
  ctx.fillText('Q: SKILLS', sx + 4, G.H - 15);

  // messages
  ctx.textAlign = 'center';
  let myy = G.H - 38;
  for (let i = G.msgs.length - 1; i >= 0; i--) {
    const m = G.msgs[i];
    ctx.globalAlpha = clamp(m.t / 0.5, 0, 1);
    ctx.fillStyle = '#16121d';
    const w = ctx.measureText(m.text).width + 8;
    ctx.fillRect(G.W / 2 - w / 2, myy - 8, w, 11);
    ctx.fillStyle = '#f4ead2';
    ctx.fillText(m.text, G.W / 2, myy);
    myy -= 13;
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawMenu() {
  const ctx = G.ctx;
  ctx.globalAlpha = 0.85;
  FR(0, 0, G.W, G.H, '#0b0908');
  ctx.globalAlpha = 1;
  const px = 60, py = 22, pw = G.W - 120;
  FR(px - 4, py - 4, pw + 8, 226, '#16121d');
  FR(px - 2, py - 2, pw + 4, 222, '#241d18');
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f3cf6b';
  ctx.fillText('— THE TWO HALVES OF ALEXANDER —', G.W / 2, py + 8);
  ctx.font = '7px monospace';
  ctx.fillStyle = '#d8b56f';
  ctx.fillText('Doxa: ' + Math.floor(G.doxa) + '   Mythos: ' + G.mythos, G.W / 2, py + 18);
  ctx.textAlign = 'left';
  const tierNames = ['', 'I. MORTAL CONQUEROR', 'II. PHARAOH\'S BLESSING', 'III. THE TWO-HORNED MYTH'];
  let y = py + 30, lastTier = 0;
  for (let i = 0; i < SKILLS.length; i++) {
    const s = SKILLS[i];
    if (s.tier !== lastTier) {
      lastTier = s.tier;
      ctx.fillStyle = tierOpen(s.tier) ? '#c9912f' : '#54462f';
      ctx.fillText(tierNames[s.tier] + (tierOpen(s.tier) ? '' : '  [' + tierReqText(s.tier) + ']'), px + 4, y);
      y += 10;
    }
    const sel = i === G.menuSel;
    if (sel) FR(px, y - 7, pw, 9, '#3a2f1a');
    const owned = G.skills[s.id];
    ctx.fillStyle = owned ? '#7d9c48' : tierOpen(s.tier) ? (canAfford(s) ? '#f4ead2' : '#8a7d6a') : '#54462f';
    let cost = '';
    if (!owned) {
      cost = (s.cost.doxa ? s.cost.doxa + 'D ' : '') + (s.cost.mythos ? s.cost.mythos + 'M' : '');
    }
    ctx.fillText((sel ? '> ' : '  ') + s.name, px + 4, y);
    ctx.fillText(owned ? 'LEARNED' : cost, px + pw - 56, y);
    y += 10;
  }
  const cur = SKILLS[G.menuSel];
  ctx.fillStyle = '#d8b56f';
  ctx.textAlign = 'center';
  ctx.fillText(cur.desc, G.W / 2, py + 204);
  ctx.fillStyle = '#8a7d6a';
  ctx.fillText('UP/DOWN select — ENTER learn — Q close', G.W / 2, py + 215);
  ctx.textAlign = 'left';
}

function drawTitle() {
  const ctx = G.ctx;
  FR(0, 0, G.W, G.H, '#1a1410');
  // warm gradient
  for (let i = 0; i < 9; i++) FR(0, i * 30, G.W, 31, mixc('#120d0a', '#6b4426', i / 8));
  // distant wall silhouette
  ctx.globalAlpha = 0.5;
  for (let x = 40; x < G.W - 40; x += 18) FR(x, 170, 14, 60, '#0b0908');
  FR(0, 226, G.W, 44, '#0b0908');
  ctx.globalAlpha = 1;
  // the hero, displayed like the character sheet
  const fake = { x: G.W / 2 / 3, y: 36, w: 10, h: 22, face: 1, vx: 0, runPhase: 0, block: false, atk: null, charge: 0 };
  ctx.save();
  ctx.scale(3, 3);
  drawHero(fake, { horns: true });
  ctx.restore();
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f3cf6b';
  ctx.fillText('I S K A N D E R', G.W / 2, 56);
  ctx.font = '8px monospace';
  ctx.fillStyle = '#c9912f';
  ctx.fillText('— GATES OF THE TWO-HORNED —', G.W / 2, 70);
  ctx.fillStyle = '#d8b56f';
  ctx.fillText('Conquer the world scrolling east. Save it by building a wall.', G.W / 2, 92);
  ctx.font = '7px monospace';
  ctx.fillStyle = '#b8a888';
  const lines = [
    'MOVE A/D    JUMP W or SPACE    DASH SHIFT    DROP S+JUMP',
    'SWORD J     SPEAR K     SHIELD hold L (parry = lion roar)',
    'E interact/build/mine    Q skill tree    1-5 learned skills',
    '',
    'March east. Earn the horns at Siwa. Reach the Roof of the World.',
    'Build the Wall before Yajuj & Majuj devour the art itself.',
  ];
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], G.W / 2, 126 + i * 11);
  ctx.fillStyle = Math.floor(G.time * 2) % 2 ? '#f3cf6b' : '#8a5a18';
  ctx.font = '9px monospace';
  ctx.fillText('PRESS ENTER', G.W / 2, 212);
  ctx.textAlign = 'left';
  drawMeander();
}

function drawChoice() {
  const ctx = G.ctx;
  ctx.globalAlpha = 0.88;
  FR(0, 0, G.W, G.H, '#0b0908');
  ctx.globalAlpha = 1;
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f3cf6b';
  ctx.fillText('THE WALL IS DONE — SAVE FOR ONE GAP,', G.W / 2, 70);
  ctx.fillText('EXACTLY ONE SPRITE WIDE.', G.W / 2, 84);
  ctx.font = '7px monospace';
  ctx.fillStyle = '#d8b56f';
  ctx.fillText('A man who spent his life breaking walls must now decide', G.W / 2, 104);
  ctx.fillText('what of himself gets sealed behind this one.', G.W / 2, 114);
  const opts = ['SEAL IT FROM THE WEST', 'STEP THROUGH FIRST'];
  for (let i = 0; i < 2; i++) {
    const sel = G.choiceSel === i;
    const x = G.W / 2 + (i === 0 ? -90 : 90);
    if (sel) FR(x - 70, 140, 140, 22, '#3a2f1a');
    ctx.fillStyle = sel ? '#f3cf6b' : '#8a7d6a';
    ctx.fillText(opts[i], x, 154);
  }
  ctx.fillStyle = '#8a7d6a';
  ctx.fillText('LEFT/RIGHT choose — ENTER decide', G.W / 2, 200);
  ctx.textAlign = 'left';
  drawMeander();
}

function drawEnding() {
  const ctx = G.ctx;
  const west = G.ending === 'west';
  for (let i = 0; i < 9; i++) {
    FR(0, i * 30, G.W, 31, west ? mixc('#f6c87a', '#6b4426', i / 8) : mixc('#1d2434', '#5a2f2a', i / 8));
  }
  // the Wall, complete, silhouetted
  FR(0, 190, G.W, 80, '#0b0908');
  for (let x = 30; x < G.W - 30; x += 16) {
    FR(x, 150, 13, 40, '#16121d');
    FR(x + 2, 144, 3, 6, '#16121d'); FR(x + 8, 144, 3, 6, '#16121d');
  }
  // the golden figure
  if (west) {
    FR(G.W / 2 - 2, 134, 4, 10, '#f3cf6b');
    FR(G.W / 2 - 1, 131, 3, 3, '#c9912f');
    FR(G.W / 2 + 2, 128, 1, 8, '#8a5a18');
  } else {
    FR(G.W - 70, 196, 4, 10, '#f3cf6b');
    FR(G.W - 69, 193, 3, 3, '#c9912f');
  }
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f3cf6b';
  ctx.fillText(west ? 'ENDING I — THE WALL AND THE KING' : 'ENDING II — THE MISSING PIXEL', G.W / 2, 40);
  ctx.font = '7px monospace';
  ctx.fillStyle = '#f4ead2';
  const lines = west ? [
    'Iskander seals the gate from the west, and stays.',
    'He grows old in sight of his own iron verse, the gold of him',
    'fading one palette index at a time.',
    '',
    'The Wall holds. Somewhere behind the brass,',
    'the horde still dreams of him.',
  ] : [
    'He steps through, and the gate seals behind him —',
    'the last missing pixel of the old world, filled by a king.',
    '',
    'The Wall holds. And travellers swear that beyond it,',
    'on nights when the aurora screams,',
    'a golden light still fights in the dark.',
  ];
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], G.W / 2, 60 + i * 11);
  ctx.fillStyle = '#d8b56f';
  ctx.fillText('Waves broken: ' + G.stats.waves + '   Foes slain: ' + G.stats.kills + '   Relics: ' + G.stats.relics + '   Years spent: ' + G.age, G.W / 2, 218);
  ctx.fillStyle = '#8a7d6a';
  ctx.fillText('PRESS R TO BEGIN AGAIN', G.W / 2, 240);
  ctx.textAlign = 'left';
  drawMeander();
}

function drawGameover() {
  const ctx = G.ctx;
  FR(0, 0, G.W, G.H, '#0b0908');
  for (let i = 0; i < 200; i++) {
    if (Math.random() < 0.3) FR(Math.random() * G.W, Math.random() * G.H, 2, 2, Math.random() < 0.5 ? '#39ff6a' : '#b03cff');
  }
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff3963';
  ctx.fillText('THE WORLD DE-REZZES', G.W / 2, 110);
  ctx.font = '7px monospace';
  ctx.fillStyle = '#f4ead2';
  ctx.fillText(G.gameoverReason, G.W / 2, 130);
  ctx.fillStyle = '#8a7d6a';
  ctx.fillText('PRESS R', G.W / 2, 160);
  ctx.textAlign = 'left';
}

// ---------- master draw ----------
function drawAll() {
  const ctx = G.ctx;
  if (G.state === 'title') { drawTitle(); return; }
  if (G.state === 'ending') { drawEnding(); return; }
  if (G.state === 'gameover') { drawGameover(); return; }

  const shx = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
  const shy = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
  const camX = G.cam.x;

  drawSky(camX);
  drawFar(camX);
  drawMid(camX);
  drawWeather(camX, false);

  ctx.save();
  ctx.translate(-Math.round(camX + shx), -Math.round(shy));
  drawTerrain(camX);
  drawDecos(camX);
  drawLandmarks(camX);
  drawWall(camX);
  for (const ec of G.echoes) {
    ctx.globalAlpha = 0.65;
    drawHero({ x: ec.x - 5, y: ec.y, w: 10, h: 20, face: 1, vx: 0, runPhase: 0, block: true, atk: null, charge: 0 }, { pal: HPAL, horns: false });
    ctx.globalAlpha = 1;
  }
  for (const o of G.orbs) {
    if (o.heart) drawHeart(o.x - 2, o.y - 2, true);
    else FR(o.x - 1, o.y - 1, 3, 3, '#f3cf6b');
  }
  for (const e of G.enemies) drawEnemy(e);
  drawBoss();
  for (const pr of G.projectiles) {
    if (pr.kind === 'shock') { FR(pr.x - 3, pr.y, 7, 8, '#b03cff'); FR(pr.x - 1, pr.y - 3, 3, 4, '#39ff6a'); }
    else { FR(pr.x, pr.y, 2, 8, pr.friendly ? '#f3cf6b' : '#2a2433'); FR(pr.x, pr.y + (pr.vy > 0 ? 8 : 0), 2, 2, pr.friendly ? '#f4ead2' : '#39ff6a'); }
  }
  // the hero — the brightest object on screen
  if (G.player.inv <= 0 || Math.floor(G.time * 16) % 2 === 0) drawHero(G.player, {});
  // Solar Disc orbit
  if (G.skills.disc) {
    const p = G.player;
    const ang = G.time * 3;
    const dx2 = p.x + p.w / 2 + Math.cos(ang) * 16, dy2 = p.y + 8 + Math.sin(ang) * 10;
    ctx.globalAlpha = p.discCd <= 0 ? 1 : 0.3;
    FR(dx2 - 3, dy2 - 3, 6, 6, '#9c6b30');
    FR(dx2 - 2, dy2 - 2, 4, 4, '#5b3a1e');
    FR(dx2 - 1, dy2 - 1, 2, 2, '#f3cf6b');
    ctx.globalAlpha = 1;
  }
  for (const pt of G.particles) {
    ctx.globalAlpha = clamp(1 - pt.t / pt.life, 0, 1);
    FR(pt.x, pt.y, 2, 2, pt.col);
  }
  ctx.globalAlpha = 1;
  drawFraying(camX);
  ctx.restore();

  drawWeather(camX, true);

  if (G.flash > 0) {
    ctx.globalAlpha = clamp(G.flash, 0, 0.85);
    FR(0, 0, G.W, G.H, G.flashCol);
    ctx.globalAlpha = 1;
  }
  drawHUD();
  drawMeander();
  if (G.state === 'menu') drawMenu();
  if (G.state === 'choice') drawChoice();
}
