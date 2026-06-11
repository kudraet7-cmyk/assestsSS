// ============================================================
// ISKANDER — main loop & state machine
// ============================================================
function newGame() {
  G.state = 'title';
  G.time = 0; G.slowT = 0; G.shake = 0; G.flash = 0;
  G.doxa = 0; G.mythos = 0; G.iron = 6; G.brass = 0;
  G.engineers = 0; G.age = 0;
  G.skills = {};
  G.flags = { shrine: false, reachedWall: false, bossDone: false, pourHint: false };
  G.msgs = []; G.enemies = []; G.projectiles = []; G.particles = [];
  G.orbs = []; G.echoes = []; G.ramparts = []; G.brassPlats = [];
  G.boss = null; G.seal = null; G.ending = null; G.choiceT = 0; G.choiceSel = 0;
  G.menuSel = 0;
  G.stats = { kills: 0, waves: 0, relics: 0 };
  G.gameoverReason = '';
  G.srand = mulberry32(8472);
  initWorld();
  G.player = null;
  resetPlayer(true);
  G.cam.x = 0;
}

function startPlay() {
  G.state = 'play';
  msg('The known world ends somewhere east. March.', 4);
  msg('A/D move — SPACE jump — J sword — K spear — hold L shield', 5);
}

function update(dt) {
  G.time += dt;
  G.shake = Math.max(0, G.shake - dt * 14);
  G.flash = Math.max(0, G.flash - dt * 1.6);
  for (let i = G.msgs.length - 1; i >= 0; i--) {
    G.msgs[i].t -= dt;
    if (G.msgs[i].t <= 0) G.msgs.splice(i, 1);
  }

  if (G.state === 'title') {
    if (G.pressed.enter) startPlay();
    return;
  }
  if (G.state === 'gameover' || G.state === 'ending') {
    if (G.pressed.restart) { newGame(); }
    return;
  }
  if (G.state === 'menu') {
    if (G.pressed.menu || G.pressed.esc) { G.state = 'play'; G.sfx.ui(); }
    if (G.pressed.down) { G.menuSel = (G.menuSel + 1) % SKILLS.length; G.sfx.ui(); }
    if (G.pressed.left) { G.menuSel = (G.menuSel + SKILLS.length - 1) % SKILLS.length; G.sfx.ui(); }
    if (G.pressed.right) { G.menuSel = (G.menuSel + 1) % SKILLS.length; G.sfx.ui(); }
    if (G.pressed.enter) buySkill(SKILLS[G.menuSel]);
    return;
  }
  if (G.state === 'choice') {
    if (G.pressed.left) { G.choiceSel = 0; G.sfx.ui(); }
    if (G.pressed.right) { G.choiceSel = 1; G.sfx.ui(); }
    if (G.pressed.enter) {
      G.ending = G.choiceSel === 0 ? 'west' : 'east';
      G.state = 'ending';
      G.sfx.relic();
    }
    return;
  }

  // ---- play ----
  if (G.pressed.menu) { G.state = 'menu'; G.sfx.ui(); return; }

  // Whisper of the Oracle: time dilation after a perfect parry
  let ts = 1;
  if (G.slowT > 0) { G.slowT -= dt; ts = 0.35; }
  const sdt = dt * ts;

  updatePlayer(sdt);
  updateEnemies(sdt);
  updateBoss(sdt);
  updateMisc(sdt);
  updateWorld(sdt);

  if (G.choiceT > 0) {
    G.choiceT -= dt;
    if (G.choiceT <= 0) G.state = 'choice';
  }

  // camera
  let target = clamp(G.player.x + G.player.w / 2 - G.W / 2, 0, WORLD_W - G.W);
  if (G.boss) {
    target = clamp(target, G.wall.gateX - 300, G.wall.gateX + 300 - G.W);
  }
  G.cam.x = lerp(G.cam.x, target, 0.12);
}

// menu navigation uses W/S too — handled via key names
window.addEventListener('keydown', function (e) {
  if (G.state !== 'menu') return;
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') { G.menuSel = (G.menuSel + SKILLS.length - 1) % SKILLS.length; G.sfx.ui(); }
  if (k === 's' || k === 'arrowdown') { /* covered by 'down' pressed too; avoid double-step */ }
});

let _last = 0, _acc = 0;
const STEP = 1 / 60;
function loop(t) {
  requestAnimationFrame(loop);
  if (!_last) _last = t;
  let dt = (t - _last) / 1000;
  _last = t;
  if (dt > 0.1) dt = 0.1;
  _acc += dt;
  while (_acc >= STEP) {
    update(STEP);
    G.pressed = {};
    _acc -= STEP;
  }
  drawAll();
}

// expose for headless smoke-testing
G._update = update;
G._draw = drawAll;
G._newGame = newGame;

if (typeof document !== 'undefined' && document.getElementById) {
  bootCanvas();
  initInput();
  newGame();
  requestAnimationFrame(loop);
}
