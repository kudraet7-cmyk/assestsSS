// ============================================================
// ISKANDER — sprite data: every sprite and tile is a hardcoded
// 2D array of hex color codes, rendered cell-by-cell with
// fillRect as scaled pixel blocks. No images. No base64.
// ============================================================
// Palette legend (each constant IS a hex color code; rows below
// read like the picture they draw):
const _ = null;            // transparent
const K  = '#16121d';      // ink / eye
const G1 = '#8a5a18', G2 = '#c9912f', G3 = '#f3cf6b'; // gold ramp
const HG = '#f0c468';      // ram horns (own hex so they can be hidden pre-Siwa)
const B1 = '#5b3a1e', B2 = '#9c6b30', B3 = '#d9a85a'; // bronze ramp
const SKN = '#e0a878', S2 = '#a8704c', HR = '#4a2f1b'; // skin / shade / hair
const CL = '#d8b56f', C2 = '#a5854a', TU = '#f4ead2';  // cloak / shade / tunic
const WD = '#6b4a2a', TP = '#e8e3d0', BL = '#dfe3e8';  // wood / spear tip / blade
const VD = '#2a2433', V2 = '#1c222c', TE = '#3a4a3d';  // void-flesh / dark / sick green
const GR = '#39ff6a', MG = '#b03cff', RD = '#ff3963';  // corruption indices
const IR = '#3a3f46', I2 = '#6a7079', I3 = '#8a93a0';  // iron ramp
const MB = '#e8e0cc', M2 = '#c8c0ac', M3 = '#b8b09c';  // marble ramp
const GA = '#c8a34e', GB = '#a8853f';                  // grass
const EA = '#8a5a33', EB = '#6b4426', SP = '#9c7b45';  // earth / deep / speckle
const F1 = '#f3a33c', F2 = '#f6e3a8';                  // flame

// ---------- ALEXANDER (16 wide) ----------
// Head & horned helmet (rows 0-6), cuirass & cloak (7-12), pteruges (13-15)
const HERO_BODY = [
  [_,  _,  _,  _,  _,  _,  _,  G2, G3, G3, G2, _,  _,  _,  _,  _ ],
  [_,  _,  _,  _,  HG, _,  G2, G3, G2, G2, G3, G2, _,  HG, _,  _ ],
  [_,  _,  _,  HG, HG, G2, G2, G2, G2, G2, G2, G2, HG, HG, _,  _ ],
  [_,  _,  _,  HG, _,  G1, G2, SKN,SKN,SKN,SKN,G2, _,  HG, _,  _ ],
  [_,  _,  _,  _,  _,  HR, SKN,SKN,SKN,K,  SKN,G1, _,  _,  _,  _ ],
  [_,  _,  _,  _,  _,  HR, S2, SKN,SKN,SKN,S2, _,  _,  _,  _,  _ ],
  [_,  _,  _,  _,  _,  _,  S2, SKN,SKN,S2, _,  _,  _,  _,  _,  _ ],
  [_,  CL, CL, _,  G1, G2, G2, G2, G2, G2, G2, G1, SKN,_,  _,  _ ],
  [_,  CL, C2, _,  G1, G2, G3, G3, G3, G2, G1, SKN,SKN,_,  _,  _ ],
  [_,  CL, C2, _,  G1, G2, G3, G3, G3, G2, G1, _,  SKN,_,  _,  _ ],
  [_,  CL, C2, _,  G1, G2, G2, G3, G2, G2, G1, _,  _,  _,  _,  _ ],
  [_,  CL, C2, _,  _,  G1, G2, G2, G2, G1, _,  _,  _,  _,  _,  _ ],
  [_,  CL, C2, _,  _,  B1, B1, B1, B1, B1, _,  _,  _,  _,  _,  _ ],
  [_,  CL, C2, _,  TU, C2, TU, C2, TU, C2, _,  _,  _,  _,  _,  _ ],
  [_,  CL, C2, _,  TU, C2, TU, C2, TU, C2, _,  _,  _,  _,  _,  _ ],
  [_,  CL, _,  _,  TU, C2, TU, C2, TU, C2, _,  _,  _,  _,  _,  _ ],
];
// Two leg frames: standing / striding (greaves, then skin, then sandals)
const LEGS_A = [
  [_,  CL, _,  _,  _,  G2, G2, _,  _,  G2, G2, _,  _,  _,  _,  _ ],
  [_,  _,  _,  _,  _,  G2, G2, _,  _,  G2, G2, _,  _,  _,  _,  _ ],
  [_,  _,  _,  _,  _,  S2, SKN,_,  _,  S2, SKN,_,  _,  _,  _,  _ ],
  [_,  _,  _,  _,  _,  S2, SKN,_,  _,  S2, SKN,_,  _,  _,  _,  _ ],
  [_,  _,  _,  _,  _,  S2, SKN,_,  _,  S2, SKN,_,  _,  _,  _,  _ ],
  [_,  _,  _,  _,  B1, B1, B1, _,  _,  B1, B1, B1, _,  _,  _,  _ ],
];
const LEGS_B = [
  [_,  CL, _,  _,  _,  G2, G2, _,  _,  G2, G2, _,  _,  _,  _,  _ ],
  [_,  _,  _,  _,  G2, G2, _,  _,  _,  _,  G2, G2, _,  _,  _,  _ ],
  [_,  _,  _,  _,  S2, SKN,_,  _,  _,  _,  _,  S2, SKN,_,  _,  _ ],
  [_,  _,  _,  S2, SKN,_,  _,  _,  _,  _,  _,  _,  S2, SKN,_,  _ ],
  [_,  _,  _,  S2, _,  _,  _,  _,  _,  _,  _,  _,  _,  SKN,_,  _ ],
  [_,  _,  B1, B1, _,  _,  _,  _,  _,  _,  _,  _,  B1, B1, B1, _ ],
];
// The lion-embossed shield, full face (blocking) and slung profile
const SHIELD_FRONT = [
  [_,  B1, B1, B1, B1, B1, _ ],
  [B1, B2, B2, B2, B2, B2, B1],
  [B1, B2, B3, B3, B3, B2, B1],
  [B1, B2, G3, G2, G3, B2, B1],
  [B1, B2, G3, G3, G3, B2, B1],
  [B1, B2, G2, G3, G2, B2, B1],
  [B1, B2, B3, G2, B3, B2, B1],
  [B1, B2, B2, B2, B2, B2, B1],
  [_,  B1, B2, B2, B2, B1, _ ],
  [_,  _,  B1, B1, B1, _,  _ ],
];
const SHIELD_BACK = [
  [_,  B1, B1, B1, _ ],
  [B1, B2, B2, B2, B1],
  [B1, B2, G3, B2, B1],
  [B1, B2, G3, B2, B1],
  [B1, B2, B2, B2, B1],
  [_,  B1, B1, B1, _ ],
];
// Weapons (stamped as overlays on the hero)
const SPEAR_V = [[TP], [TP], [TP]].concat(new Array(23).fill([WD]));
const SPEAR_H = [
  new Array(23).fill(WD).concat([TP, TP, TP]),
  new Array(23).fill(_).concat([TP, _, _]),
];
const SWORD_UP = [
  [_, BL, BL], [_, BL, BL], [_, BL, BL], [_, BL, BL],
  [_, BL, BL], [_, BL, BL], [_, BL, BL],
  [G2, G2, G2], [_, G1, _], [_, G1, _],
];
const SWORD_MID = [
  [_,  _,  G2, BL, BL, BL, BL, BL, BL, BL, BL, TP],
  [G1, G2, G2, BL, BL, BL, BL, BL, BL, BL, BL, BL],
  [_,  _,  G2, _,  _,  _,  _,  _,  _,  _,  _,  _ ],
];
const SWORD_DOWN = [
  [G2, BL, _,  _,  _,  _,  _,  _,  _,  _,  _ ],
  [G2, BL, BL, BL, _,  _,  _,  _,  _,  _,  _ ],
  [_,  _,  _,  BL, BL, BL, BL, _,  _,  _,  _ ],
  [_,  _,  _,  _,  _,  _,  BL, BL, BL, TP, _ ],
];

// ---------- THE HORDE (wrong pixels wearing almost-bodies) ----------
const NUMBERLESS = [
  [_,  _,  V2, V2, V2, _,  _,  _ ],
  [_,  V2, VD, VD, VD, V2, _,  _ ],
  [V2, VD, GR, VD, VD, VD, V2, _ ],
  [V2, VD, VD, VD, RD, VD, V2, _ ],
  [V2, VD, VD, MG, VD, VD, V2, _ ],
  [_,  V2, VD, VD, VD, V2, _,  _ ],
  [_,  V2, _,  V2, _,  V2, _,  _ ],
  [V2, _,  _,  V2, _,  _,  V2, _ ],
];
// Licker of the River: segmented humps, head & tongue at the right
const LICKER = [
  [_,  _,  _,  _,  _,  _,  _,  _,  _,  _,  _,  _,  _,  _,  _,  _,  V2, V2, _,  _ ],
  [_,  _,  _,  V2, V2, _,  _,  _,  V2, V2, _,  _,  _,  _,  _,  V2, TE, TE, V2, _ ],
  [_,  _,  V2, TE, TE, V2, _,  V2, TE, TE, V2, _,  _,  _,  V2, TE, VD, VD, TE, V2],
  [_,  V2, TE, VD, VD, TE, V2, TE, VD, VD, TE, V2, _,  V2, TE, VD, GR, VD, VD, V2],
  [V2, TE, VD, MG, VD, VD, TE, VD, VD, MG, VD, TE, V2, TE, VD, VD, VD, VD, RD, RD],
  [V2, VD, VD, VD, VD, VD, VD, VD, VD, VD, VD, VD, TE, VD, VD, VD, TP, RD, _,  _ ],
  [_,  V2, V2, VD, V2, V2, VD, V2, V2, VD, V2, V2, V2, VD, VD, V2, _,  _,  _,  _ ],
  [_,  _,  _,  V2, _,  _,  V2, _,  _,  V2, _,  _,  _,  V2, V2, _,  _,  _,  _,  _ ],
];
// Wall-Biter: riveted iron dome, void belly, shearing mandibles
const BITER = [
  [_,  _,  _,  _,  _,  _,  I2, I2, I2, I2, I2, I2, I2, _,  _,  _,  _,  _,  _,  _ ],
  [_,  _,  _,  _,  I2, IR, IR, IR, IR, IR, IR, IR, IR, I2, _,  _,  _,  _,  _,  _ ],
  [_,  _,  _,  I2, IR, I3, IR, IR, I3, IR, IR, IR, I3, IR, I2, _,  _,  _,  _,  _ ],
  [_,  _,  I2, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, I2, _,  _,  _,  _ ],
  [_,  I2, IR, IR, I3, IR, IR, I3, IR, IR, I3, IR, IR, IR, IR, IR, I2, _,  _,  _ ],
  [_,  I2, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, RD, _,  TP, _ ],
  [I2, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, VD, TP, TP, TP],
  [I2, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, IR, VD, VD, _,  TP, _ ],
  [_,  VD, VD, VD, VD, VD, VD, VD, VD, VD, VD, VD, VD, VD, VD, VD, _,  TP, TP, _ ],
  [_,  VD, V2, VD, VD, V2, VD, VD, V2, VD, VD, V2, VD, VD, V2, VD, _,  _,  _,  _ ],
  [_,  V2, _,  V2, _,  _,  V2, _,  _,  V2, _,  _,  V2, _,  _,  V2, _,  _,  _,  _ ],
  [V2, V2, _,  V2, V2, _,  V2, V2, _,  V2, V2, _,  V2, V2, _,  V2, V2, _,  _,  _ ],
];
// Echo-Born and the False Iskander reuse the hero matrices through this remap:
const CORRUPT_MAP = {};
CORRUPT_MAP[G1] = '#16121d'; CORRUPT_MAP[G2] = '#1c222c'; CORRUPT_MAP[G3] = GR;
CORRUPT_MAP[HG] = GR;        CORRUPT_MAP[SKN] = '#7a8a7d'; CORRUPT_MAP[S2] = '#566057';
CORRUPT_MAP[HR] = '#1c222c'; CORRUPT_MAP[CL] = '#3a2f4a';  CORRUPT_MAP[C2] = '#241d30';
CORRUPT_MAP[TU] = '#566057'; CORRUPT_MAP[B1] = '#1c222c';  CORRUPT_MAP[B2] = '#2a2433';
CORRUPT_MAP[B3] = '#16121d'; CORRUPT_MAP[WD] = '#2a2433';  CORRUPT_MAP[TP] = GR;
CORRUPT_MAP[BL] = MG;        CORRUPT_MAP[K] = RD;

// Companions reuse the hero matrices through their own palette remaps:
const NPC_REMAPS = {
  oracle: {},
  hephaestion: {},
  roxana: {},
};
NPC_REMAPS.oracle[G1] = '#6b5a7d'; NPC_REMAPS.oracle[G2] = '#8f7bb0'; NPC_REMAPS.oracle[G3] = '#b08fdd';
NPC_REMAPS.oracle[CL] = '#b08fdd'; NPC_REMAPS.oracle[C2] = '#8f7bb0'; NPC_REMAPS.oracle[HR] = '#e8e0cc';
NPC_REMAPS.hephaestion[G1] = B1; NPC_REMAPS.hephaestion[G2] = B2; NPC_REMAPS.hephaestion[G3] = B3;
NPC_REMAPS.hephaestion[CL] = '#8f3b2f'; NPC_REMAPS.hephaestion[C2] = '#6e2c24';
NPC_REMAPS.roxana[G1] = '#3a4a63'; NPC_REMAPS.roxana[G2] = '#5a6e8c'; NPC_REMAPS.roxana[G3] = '#8ca3c4';
NPC_REMAPS.roxana[CL] = '#3f6655'; NPC_REMAPS.roxana[C2] = '#2e4c3f'; NPC_REMAPS.roxana[HR] = '#2a1d12';

// ---------- ENVIRONMENT TILES ----------
// Surface terrain (16x16): grass over earth over deep earth
const TILE_GRASS = [
  [GA, GA, GB, GA, GA, GA, GB, GA, GA, GB, GA, GA, GA, GB, GA, GA],
  [GB, GA, GA, GB, GA, GB, GA, GA, GB, GA, GA, GB, GA, GA, GB, GA],
  [EA, GB, EA, EA, GB, EA, EA, GB, EA, EA, GB, EA, EA, GB, EA, EA],
  [EA, EA, EA, SP, EA, EA, EA, EA, SP, EA, EA, EA, EA, EA, SP, EA],
  [EA, SP, EA, EA, EA, EA, SP, EA, EA, EA, EA, SP, EA, EA, EA, EA],
  [EA, EA, EA, EA, SP, EA, EA, EA, EA, SP, EA, EA, EA, SP, EA, EA],
  [EA, EA, SP, EA, EA, EA, EA, EA, SP, EA, EA, EA, EA, EA, EA, SP],
  [EA, EA, EA, EA, EA, SP, EA, EA, EA, EA, EA, SP, EA, EA, EA, EA],
  [EB, EA, EA, EB, EA, EA, EA, EB, EA, EA, EB, EA, EA, EA, EB, EA],
  [EB, EB, EA, EB, EB, EB, EA, EB, EB, EB, EB, EA, EB, EB, EB, EB],
  [EB, EB, EB, EB, EA, EB, EB, EB, EB, EA, EB, EB, EB, EB, EA, EB],
  [EB, EA, EB, EB, EB, EB, EB, EA, EB, EB, EB, EB, EB, EB, EB, EB],
  [EB, EB, EB, EA, EB, EB, EB, EB, EB, EB, EA, EB, EB, EB, EB, EB],
  [EB, EB, EB, EB, EB, EA, EB, EB, EB, EB, EB, EB, EA, EB, EB, EB],
  [EB, EB, EA, EB, EB, EB, EB, EB, EA, EB, EB, EB, EB, EB, EB, EA],
  [EB, EB, EB, EB, EB, EB, EB, EB, EB, EB, EB, EB, EB, EB, EB, EB],
];
// Per-act recolor ramps for terrain: [Act I, Act II, Act III]
const ACT_RAMPS = {};
ACT_RAMPS[GA] = [GA, '#9c8648', '#dfe8ef'];
ACT_RAMPS[GB] = [GB, '#857338', '#c4d2dd'];
ACT_RAMPS[EA] = [EA, '#74543a', '#5d6573'];
ACT_RAMPS[EB] = [EB, '#594031', '#454c59'];
ACT_RAMPS[SP] = [SP, '#86703f', '#77818f'];

// The Wall (13x8, two tiles per segment): iron courses, then brass-sealed
const TILE_IRON = [
  [I2, I2, I2, I2, I2, I2, I2, I2, I2, I2, I2, I2, I2],
  [IR, IR, IR, IR, I2, IR, IR, IR, IR, IR, I2, IR, IR],
  [IR, I3, IR, IR, I2, IR, IR, I3, IR, IR, I2, IR, IR],
  [IR, IR, IR, IR, I2, IR, IR, IR, IR, IR, I2, IR, I3],
  [I2, I2, I2, I2, I2, I2, I2, I2, I2, I2, I2, I2, I2],
  [IR, IR, I2, IR, IR, IR, IR, I2, IR, IR, IR, I3, IR],
  [I3, IR, I2, IR, I3, IR, IR, I2, IR, IR, IR, IR, IR],
  [IR, IR, I2, IR, IR, IR, IR, I2, IR, I3, IR, IR, IR],
];
const TILE_BRASS = [
  [B3, I2, I2, I2, B3, I2, I2, I2, I2, B3, I2, I2, B3],
  [IR, IR, IR, IR, B3, IR, IR, IR, IR, B3, IR, IR, IR],
  [IR, I3, IR, IR, B3, IR, IR, G3, IR, B3, IR, IR, IR],
  [IR, IR, IR, IR, B2, IR, IR, IR, IR, B2, IR, I3, IR],
  [B3, B3, B3, B3, B3, B3, B3, B3, B3, B3, B3, B3, B3],
  [IR, IR, I2, IR, B3, IR, IR, I2, IR, B3, IR, IR, IR],
  [I3, IR, I2, IR, B2, IR, IR, I2, IR, B3, IR, G3, IR],
  [IR, IR, I2, IR, B3, IR, IR, I2, IR, B3, IR, IR, IR],
];
// Hellenic ruins: fluted column drum (stackable) and capital
const RUIN_SHAFT = [
  [M2, MB, MB, M2, MB, MB, M2, MB],
  [M2, MB, MB, M2, MB, MB, M2, MB],
  [M2, MB, MB, M2, M3, MB, M2, MB],
  [M2, MB, MB, M2, MB, MB, M2, MB],
  [M2, M3, MB, M2, MB, MB, M2, MB],
  [M2, MB, MB, M2, MB, M3, M2, MB],
  [M2, MB, MB, M2, MB, MB, M2, MB],
  [M3, M3, M3, M3, M3, M3, M3, M3],
];
const RUIN_CAP = [
  [MB, MB, MB, MB, MB, MB, MB, MB, MB, MB, MB, MB],
  [M2, MB, MB, MB, M2, MB, MB, M2, MB, MB, MB, M2],
  [_,  M3, M2, M2, M2, M2, M2, M2, M2, M2, M3, _ ],
  [_,  _,  M3, M3, M3, M3, M3, M3, M3, M3, _,  _ ],
];
const BRAZIER = [
  [I2, I3, I2, I2, I2, I2, I2, I3, I2],
  [_,  IR, IR, IR, IR, IR, IR, IR, _ ],
  [_,  _,  IR, IR, IR, IR, IR, _,  _ ],
  [_,  _,  _,  _,  IR, _,  _,  _,  _ ],
  [_,  _,  _,  _,  IR, _,  _,  _,  _ ],
  [_,  _,  _,  _,  IR, _,  _,  _,  _ ],
  [_,  _,  _,  _,  IR, _,  _,  _,  _ ],
  [_,  _,  _,  _,  IR, _,  _,  _,  _ ],
  [_,  _,  _,  _,  IR, _,  _,  _,  _ ],
  [_,  _,  _,  IR, IR, IR, _,  _,  _ ],
  [_,  _,  IR, IR, IR, IR, IR, _,  _ ],
  [_,  I2, I2, I2, I2, I2, I2, I2, _ ],
];
const FLAME_A = [
  [_,  _,  _,  F2, _,  _,  _ ],
  [_,  _,  F1, F2, F1, _,  _ ],
  [_,  F1, F1, F2, F1, F1, _ ],
  [_,  F1, F2, F2, F2, F1, _ ],
  [F1, F1, F2, F2, F2, F1, F1],
  [_,  F1, F1, F1, F1, F1, _ ],
];
const FLAME_B = [
  [_,  _,  _,  _,  F2, _,  _ ],
  [_,  _,  F1, F2, F1, _,  _ ],
  [_,  F1, F2, F1, F2, F1, _ ],
  [F1, F1, F2, F2, F1, F1, _ ],
  [_,  F1, F2, F2, F2, F1, F1],
  [_,  F1, F1, F1, F1, F1, _ ],
];

// ---------- renderer ----------
// Draws a color matrix with fillRect, one scaled block per cell.
// opts: scale, flip, remap {hex:hex|null}, mono, glitch, actT
function actShade(hex, t) {
  const r = ACT_RAMPS[hex];
  if (!r) return hex;
  const a = Math.floor(clamp(t, 0, 1.999)), b = Math.ceil(clamp(t, 0.001, 2));
  return mixc(r[a], r[b], t - a);
}
function drawSprite(mat, x, y, o) {
  o = o || {};
  const ctx = G.ctx;
  const s = o.scale || 1;
  const w = mat[0].length;
  x = Math.round(x); y = Math.round(y);
  for (let r = 0; r < mat.length; r++) {
    const row = mat[r];
    let jx = 0;
    if (o.glitch && Math.random() < 0.15) jx = ((Math.random() * 3) | 0) - 1;
    for (let c = 0; c < row.length; c++) {
      let col = row[c];
      if (col == null) continue;
      if (o.remap && o.remap.hasOwnProperty(col)) {
        col = o.remap[col];
        if (col == null) continue;
      }
      if (o.actT != null) col = actShade(col, o.actT);
      if (o.mono) col = o.mono;
      else if (o.glitch && Math.random() < 0.05) col = Math.random() < 0.5 ? GR : MG;
      const cx = o.flip ? (w - 1 - c) : c;
      ctx.fillStyle = col;
      ctx.fillRect(x + (cx + jx) * s, y + r * s, s, s);
    }
  }
}
// Offscreen tile cache (falls back to direct drawing headless)
const _tileCache = new Map();
function drawTile(mat, x, y, actT) {
  const canDoc = typeof document !== 'undefined' && typeof document.createElement === 'function';
  if (!canDoc) { drawSprite(mat, x, y, actT != null ? { actT: actT } : null); return; }
  const q = actT != null ? Math.round(actT * 8) : -1;
  let byQ = _tileCache.get(mat);
  if (!byQ) { byQ = {}; _tileCache.set(mat, byQ); }
  let cv = byQ[q];
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = mat[0].length; cv.height = mat.length;
    const main = G.ctx;
    G.ctx = cv.getContext('2d');
    drawSprite(mat, 0, 0, q >= 0 ? { actT: q / 8 } : null);
    G.ctx = main;
    byQ[q] = cv;
  }
  G.ctx.drawImage(cv, Math.round(x), Math.round(y));
}
