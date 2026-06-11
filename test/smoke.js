// Headless smoke test: loads the game in a stubbed DOM and simulates play.
// Run: node test/smoke.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeCtxStub() {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'measureText') return () => ({ width: 10 });
      if (prop === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (prop in target) return target[prop];
      return function () {};
    },
    set(target, prop, value) { target[prop] = value; return true; },
  });
}

const canvasStub = {
  width: 0, height: 0, style: {},
  getContext: () => makeCtxStub(),
};

const sandbox = {
  console,
  Math, JSON, Object, Array, Float32Array, parseInt, parseFloat,
  document: { getElementById: () => canvasStub },
  requestAnimationFrame: () => 0,
  innerWidth: 960, innerHeight: 540,
};
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};
sandbox.AudioContext = function () {
  this.currentTime = 0;
  this.sampleRate = 44100;
  this.destination = {};
  this.createOscillator = () => ({ type: '', frequency: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} });
  this.createGain = () => ({ gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} });
  this.createBuffer = (ch, n) => ({ getChannelData: () => new Float32Array(n) });
  this.createBufferSource = () => ({ buffer: null, connect() {}, start() {} });
  this.createBiquadFilter = () => ({ type: '', frequency: { value: 0 }, connect() {} });
};

vm.createContext(sandbox);
for (const f of ['core.js', 'world.js', 'actors.js', 'render.js', 'main.js']) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  vm.runInContext(src, sandbox, { filename: f });
}

const G = sandbox.G;
const SK = vm.runInContext("SKILLS", sandbox);
const STEP = 1 / 60;
let frames = 0;
function run(n, keys, pressedOnce) {
  if (pressedOnce) for (const k of pressedOnce) G.pressed[k] = true;
  for (let i = 0; i < n; i++) {
    G.keys = {};
    if (keys) for (const k of keys) G.keys[k] = true;
    G._update(STEP);
    G._draw();
    G.pressed = {};
    frames++;
  }
}
function assert(cond, label) {
  if (!cond) { console.error('FAIL: ' + label + ' (frame ' + frames + ', state=' + G.state + ')'); process.exit(1); }
  console.log('ok: ' + label);
}

// title -> play
run(5, null, ['enter']);
assert(G.state === 'play', 'game starts from title');

// walk east for a while, jumping periodically
for (let s = 0; s < 40; s++) {
  run(50, ['right']);
  run(10, ['right', 'jump'], ['jump']);
  run(5, ['right'], ['dash']);
}
assert(G.player.x > 800, 'hero marches east (x=' + Math.round(G.player.x) + ')');

// attack inputs do not crash
run(20, null, ['sword']);
run(20, null, ['spear']);
run(30, ['shield']);
run(10, null, ['sword']); // bash attempt without skill

// open & close skill menu, try buying everything
run(2, null, ['menu']);
assert(G.state === 'menu', 'skill menu opens');
G.doxa = 200; G.mythos = 20;
for (let i = 0; i < SK.length; i++) {
  run(1, null, ['enter']);
  run(1, null, ['down']);
}
run(2, null, ['menu']);
assert(G.state === 'play', 'skill menu closes');

// commune at Siwa
G.player.x = G.world.shrine.x; G.player.y = 100;
run(30, null, ['use']);
assert(G.flags.shrine, 'Siwa shrine grants the horns');

// teleport to the Wall, confirm arrival flag + tier 3
G.player.x = G.wall.x0 - 100; G.player.y = 100;
run(30, ['right']);
assert(G.flags.reachedWall, 'arrival at the Wall detected');

// buy remaining skills now that tiers are open
run(2, null, ['menu']);
for (let i = 0; i < SK.length; i++) {
  run(1, null, ['enter']);
  run(1, null, ['down']);
}
run(2, null, ['menu']);
let owned = 0;
for (const id in G.skills) if (G.skills[id]) owned++;
assert(owned === SK.length, 'all ' + SK.length + ' skills learnable (got ' + owned + ')');

// build every wall segment (iron + brass pours)
G.iron = 100; G.brass = 100;
for (const seg of G.wall.segs) {
  G.player.x = seg.x + seg.w / 2 - 5; G.player.y = seg.base - 40;
  run(5, null, ['use']);          // raise iron
  run(225, ['use'], ['use']);     // tap to start the pour, hold to channel it
  assert(seg.stage === 2, 'segment ' + (seg.i + 1) + ' fully built');
}

// cast every active skill
run(10, null, ['s1']);
run(40, null, ['s2']);
run(10, null, ['s3']);
run(10, null, ['s4']);
run(10, null, ['s5']);
assert(G.age >= 3, 'Tier-3 skills age the king (age=' + G.age + ')');

// survive waves: spawn one manually and butcher it
sandbox.spawnWave();
assert(G.enemies.length > 0, 'wave spawns enemies');
for (let s = 0; s < 60 && G.enemies.length > 0; s++) {
  if (G.enemies.length) {
    const e = G.enemies[0];
    G.player.x = e.x - 12; G.player.y = e.y - 4;
  }
  run(10, null, ['sword']);
  run(10, null, ['spear']);
}
run(120);
assert(G.stats.kills > 0, 'enemies can be slain (kills=' + G.stats.kills + ')');

// force the boss and march through all phases
G.enemies.length = 0;
G.waveSys.active = false; G.waveSys.wave = 6;
sandbox.startBoss();
assert(G.boss && G.boss.phase === 1, 'boss spawns');
G.player.maxhp = 1000; G.player.hp = 1000; // survive the test
for (let phase = 1; phase <= 3; phase++) {
  let guard = 0;
  while (G.boss && G.boss.phase === phase && guard++ < 4000) {
    G.boss.aflame = 2;          // pretend we are at the braziers
    G.boss.parryCd = 1;         // pretend we feinted
    G.player.x = G.boss.x - 13; G.player.y = G.boss.y - 2; G.player.face = 1;
    run(3, null, ['sword']);
    G.enemies.length = 0;       // ignore adds for the smoke test
  }
  assert(guard < 4000, 'boss phase ' + phase + ' completes');
}
assert(G.boss && G.boss.phase === 4 && G.seal, 'the Sealing begins');
G.player.x = G.wall.gateX - 4; G.player.y = 120;
let guard = 0;
while (G.boss && guard++ < 3000) { G.enemies.length = 0; run(5, ['use']); }
assert(G.flags.bossDone, 'the Khagan is entombed in the Wall');
run(200);
assert(G.state === 'choice', 'the Final Choice is offered');

// ending west
run(2, null, ['left']);
run(2, null, ['enter']);
assert(G.state === 'ending' && G.ending === 'west', 'Ending I renders');
run(10);

// restart, ending east via direct path
run(2, null, ['restart']);
assert(G.state === 'title', 'restart returns to title');
run(2, null, ['enter']);
G.state = 'choice';
run(2, null, ['right']);
run(2, null, ['enter']);
assert(G.state === 'ending' && G.ending === 'east', 'Ending II renders');
run(10);

// long idle soak on a fresh game: waves fire on the doom-clock
run(2, null, ['restart']);
run(2, null, ['enter']);
G.flags.reachedWall = true;
G.player.x = G.world.camp.x; G.player.y = 100;
G.waveSys.t = 1;
run(60 * 30, ['shield']); // block and let the world run for 30 sim-seconds
assert(G.waveSys.wave >= 1, 'doom-clock waves arrive on their own');

console.log('\nALL OK — ' + frames + ' frames simulated without errors.');
