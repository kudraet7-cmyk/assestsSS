// ============================================================
// ISKANDER: GATES OF THE TWO-HORNED — core: state, input, audio
// ============================================================
window.G = {
  W: 480, H: 270,
  state: 'title',          // title | play | menu | choice | ending | gameover
  keys: {}, pressed: {},
  time: 0, slowT: 0, shake: 0, flash: 0, flashCol: '#fff',
  cam: { x: 0, y: 0 },
  doxa: 0, mythos: 0, iron: 6, brass: 0, engineers: 0, age: 0,
  skills: {},
  flags: { shrine: false, reachedWall: false, bossDone: false, pourHint: false },
  msgs: [],
  enemies: [], projectiles: [], particles: [], orbs: [],
  echoes: [], ramparts: [], brassPlats: [],
  boss: null, seal: null, ending: null, choiceSel: 0,
  stats: { kills: 0, waves: 0, relics: 0 },
  gameoverReason: '',
};

// ---------- helpers ----------
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function qz(v, s) { return Math.round(v / s) * s; }
function dist(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

// deterministic hash noise (for dithering / glitch / decor placement)
function hash2(a, b) {
  let h = (a | 0) * 374761393 + (b | 0) * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

// seeded rng for world generation
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
G.srand = mulberry32(8472);

// color mix with memoization (hot path: terrain palette lerping)
const _mixCache = {};
function mixc(a, b, t) {
  t = clamp(t, 0, 1);
  const tq = Math.round(t * 24);
  const key = a + b + tq;
  if (_mixCache[key]) return _mixCache[key];
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const tt = tq / 24;
  const r = Math.round(lerp(pa >> 16, pb >> 16, tt));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, tt));
  const bl = Math.round(lerp(pa & 255, pb & 255, tt));
  return (_mixCache[key] = 'rgb(' + r + ',' + g + ',' + bl + ')');
}

function msg(text, dur) { G.msgs.push({ text: text, t: dur || 3.2 }); if (G.msgs.length > 3) G.msgs.shift(); }

// ---------- canvas ----------
function bootCanvas() {
  const c = document.getElementById('game');
  c.width = G.W; c.height = G.H;
  G.canvas = c;
  G.ctx = c.getContext('2d');
  G.ctx.imageSmoothingEnabled = false;
  const fit = function () {
    const s = Math.max(1, Math.floor(Math.min(window.innerWidth / G.W, window.innerHeight / G.H)));
    c.style.width = (G.W * s) + 'px';
    c.style.height = (G.H * s) + 'px';
  };
  window.addEventListener('resize', fit);
  fit();
}

// ---------- input ----------
const KEYMAP = {
  'arrowleft': 'left', 'a': 'left',
  'arrowright': 'right', 'd': 'right',
  'arrowup': 'jump', 'w': 'jump', ' ': 'jump',
  'arrowdown': 'down', 's': 'down',
  'j': 'sword', 'x': 'sword',
  'k': 'spear', 'c': 'spear',
  'l': 'shield', 'v': 'shield',
  'shift': 'dash',
  'e': 'use', 'g': 'garrison', 'q': 'menu',
  '1': 's1', '2': 's2', '3': 's3', '4': 's4', '5': 's5',
  'enter': 'enter', 'escape': 'esc', 'p': 'esc', 'r': 'restart',
};
function initInput() {
  window.addEventListener('keydown', function (e) {
    const k = KEYMAP[e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase()];
    if (!k) return;
    e.preventDefault();
    if (!G.keys[k]) G.pressed[k] = true;
    G.keys[k] = true;
    initAudio();
  });
  window.addEventListener('keyup', function (e) {
    const k = KEYMAP[e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase()];
    if (!k) return;
    G.keys[k] = false;
  });
  window.addEventListener('blur', function () { G.keys = {}; });
}

// ---------- audio: tiny procedural synth ----------
let AC = null;
function initAudio() {
  if (AC) return;
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
}
function tone(freq, dur, type, vol, slide) {
  if (!AC) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, AC.currentTime);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), AC.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.06, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + dur);
  } catch (e) { /* audio is never fatal */ }
}
function noiseBurst(dur, vol, lowpass) {
  if (!AC) return;
  try {
    const n = Math.floor(AC.sampleRate * dur);
    const buf = AC.createBuffer(1, n, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = AC.createBufferSource(); src.buffer = buf;
    const g = AC.createGain(); g.gain.value = vol || 0.1;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass || 900;
    src.connect(f); f.connect(g); g.connect(AC.destination);
    src.start();
  } catch (e) { /* ignore */ }
}
G.sfx = {
  swing: function () { tone(300, 0.07, 'sawtooth', 0.04, -140); },
  hit: function () { tone(170, 0.08, 'square', 0.07, -70); noiseBurst(0.05, 0.05, 1400); },
  hurt: function () { tone(120, 0.18, 'sawtooth', 0.09, -60); },
  parry: function () { tone(720, 0.05, 'square', 0.07, 300); noiseBurst(0.22, 0.14, 700); tone(90, 0.3, 'sawtooth', 0.1, -40); },
  jump: function () { tone(220, 0.08, 'square', 0.035, 120); },
  dash: function () { noiseBurst(0.08, 0.05, 2200); },
  pickup: function () { tone(660, 0.07, 'square', 0.05, 220); },
  relic: function () { tone(520, 0.1, 'triangle', 0.08, 0); tone(780, 0.22, 'triangle', 0.07, 60); },
  build: function () { tone(140, 0.1, 'square', 0.08, -30); tone(420, 0.06, 'square', 0.05, -80); },
  pour: function () { noiseBurst(0.3, 0.07, 500); tone(95, 0.3, 'sawtooth', 0.05, -20); },
  breakRock: function () { noiseBurst(0.25, 0.13, 600); tone(80, 0.2, 'square', 0.09, -30); },
  mine: function () { tone(500, 0.04, 'square', 0.04, -100); },
  roar: function () { tone(70, 0.7, 'sawtooth', 0.14, -25); noiseBurst(0.6, 0.16, 500); },
  bossRoar: function () { tone(55, 0.9, 'sawtooth', 0.15, -15); noiseBurst(0.8, 0.15, 380); },
  ui: function () { tone(440, 0.05, 'square', 0.04, 0); },
  buy: function () { tone(523, 0.08, 'square', 0.05, 0); tone(784, 0.14, 'square', 0.05, 0); },
  deny: function () { tone(140, 0.12, 'square', 0.05, -40); },
  petrify: function () { tone(900, 0.5, 'sawtooth', 0.07, -700); noiseBurst(0.4, 0.1, 1100); },
  wave: function () { tone(98, 0.5, 'sawtooth', 0.1, 20); tone(110, 0.6, 'sawtooth', 0.08, -20); },
};
