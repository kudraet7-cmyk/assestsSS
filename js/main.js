// ============================================================
// ISKANDER — main loop, state machine, cinematics, blueprint
// ============================================================

// ---------- scripted scenes ----------
const SIWA_SCENE = [
  { who: 'THE ORACLE OF SIWA', text: 'You walked the sand that eats armies, and the sand stood aside.' },
  { who: 'THE ORACLE OF SIWA', text: 'Son of Ammon. Two-Horned. The east has waited long for your name.' },
  { who: 'ISKANDER', text: 'I came to ask whose son I am.' },
  { who: 'THE ORACLE OF SIWA', text: 'No. You came to ask permission to become what you already are.' },
  { who: '', text: 'The ram horns ignite upon the golden helmet.' },
];
const BOSS_SCENE = [
  { who: 'HEPHAESTION', text: 'Iskander — the watch-fires past the third tower just went out.' },
  { who: 'ROXANA', text: 'That is no storm. The night itself is walking.' },
  { who: 'YAJUJ-KHAGAN', text: 'WE ARE TEN THOUSAND WHISPERS, LITTLE KING. OPEN YOUR GATE.' },
];
const NPC_LINES = {
  hephaestion: [
    'The men dream in languages they never learned. Keep building.',
    'Whatever you raise out there — build a gate in it. Men must be able to come home.',
    'I will hold the camp. I always hold the camp.',
  ],
  hephaestion_after: ['It holds. By every god we ever doubted, Iskander — it holds.'],
  roxana_first: [
    'My grandmothers called them the Drinkers of Rivers. They sang the names to frighten us.',
    'They are not coming for your empire, Two-Horned. They are coming for the world.',
    'Take this. The steppe remembers every wall that failed. Make yours different.',
  ],
  roxana: ['Ride east only with iron in both hands.'],
  oracle: [
    'What I crowned at Siwa frightens me now.',
    'The horns were never a gift, Iskander. They were a key.',
  ],
};
const RELIC_LORE = [
  'A laurel of Chaironeia. The first wall he broke was a line of men.',
  'A Tyrian coin, fire-blackened. Cities learn his name by burning.',
  'A reed from the Nile. Egypt did not resist; it recognized.',
  'An oracle bone from Siwa, split clean down the middle.',
  'A Persian seal, its king\'s face worn smooth by thumbs.',
  'A steppe arrowhead that has never once missed a river.',
  'A clay tablet: the same word for "wall" and for "promise".',
  'An iron tooth too large for any wolf. It is still growing.',
  'A child\'s drawing of a horde: scribbles devouring the page edge.',
  'A frost-cracked horn that screams when the aurora pulses.',
  'A single missing pixel of the world, kept in a reliquary.',
];

function startCutscene(lines, focusX, onDone) {
  G.cut = { lines: lines, i: 0, t: 0, focusX: focusX, onDone: onDone };
  G.state = 'cutscene';
}
function startBossCinematic() {
  startCutscene(BOSS_SCENE, G.wall.gateX, function () { startBoss(); });
}
function npcTalk(n) {
  let lines, after = null;
  if (n.id === 'hephaestion') {
    lines = G.flags.bossDone ? NPC_LINES.hephaestion_after : [NPC_LINES.hephaestion[n.talks % 3]];
  } else if (n.id === 'roxana') {
    if (n.talks === 0) {
      lines = NPC_LINES.roxana_first;
      after = function () { G.mythos++; msg('Roxana presses a steppe relic into your hand. (+1 Mythos)', 3.5); };
    } else lines = NPC_LINES.roxana;
  } else {
    if (!G.flags.shrine) { msg('The Oracle gazes past you, toward the shrine.', 2.5); return; }
    lines = NPC_LINES.oracle;
  }
  n.talks++;
  startCutscene(lines.map(function (t) { return { who: n.id.toUpperCase(), text: t }; }), n.x, after);
}

function tryFastTravel() {
  if (G.waveSys.active || G.boss) { G.sfx.deny(); msg('No travel while the horde moves.', 2.5); return; }
  const p = G.player;
  if (G.bpSel === 0) p.x = G.world.camp.x;
  else {
    const s = G.wall.segs[G.bpSel - 1];
    if (s.stage < 2) { G.sfx.deny(); msg('Only brass-sealed segments hold a travel beacon.', 2.5); return; }
    p.x = s.x - 8;
  }
  p.y = 60; p.vx = 0; p.vy = 0;
  G.cam.x = clamp(p.x - G.W / 2, 0, WORLD_W - G.W);
  G.state = 'play';
  G.sfx.relic();
  msg('You travel the king\'s road.', 2);
}

function newGamePlus() {
  const keep = { skills: G.skills, age: G.age, assist: G.assist, ng: (G.ng || 0) + 1 };
  newGame();
  G.skills = keep.skills; G.age = keep.age; G.assist = keep.assist; G.ng = keep.ng;
  G.player.maxhp = Math.max(7, 10 - G.age * 0.5);
  G.player.hp = G.player.maxhp;
  G.state = 'play';
  msg('NEW GAME+ ' + G.ng + ' — the aged king marches again, his myth intact.', 5);
}

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

  if (G.pressed.assist && (G.state === 'title' || G.state === 'play')) {
    G.assist = !G.assist;
    msg('PARRY ASSIST ' + (G.assist ? 'ON — wider parry window' : 'OFF'), 2.5);
    G.sfx.ui();
  }
  if (G.state === 'title') {
    if (G.pressed.enter) startPlay();
    return;
  }
  if (G.state === 'gameover' || G.state === 'ending') {
    if (G.pressed.restart) { newGame(); }
    if (G.pressed.ngplus && G.state === 'ending') newGamePlus();
    return;
  }
  if (G.state === 'cutscene') {
    const c2 = G.cut;
    c2.t += dt;
    if (G.pressed.enter || G.pressed.use || G.pressed.jump || c2.t > 4) { c2.i++; c2.t = 0; G.sfx.ui(); }
    if (c2.i >= c2.lines.length) {
      const fn = c2.onDone;
      G.cut = null;
      G.state = 'play';
      if (fn) fn();
    } else if (c2.focusX != null) {
      G.cam.x = lerp(G.cam.x, clamp(c2.focusX - G.W / 2, 0, WORLD_W - G.W), 0.08);
    }
    return;
  }
  if (G.state === 'blueprint') {
    if (G.pressed.map || G.pressed.esc || G.pressed.menu) { G.state = 'play'; G.sfx.ui(); }
    if (G.pressed.left) { G.bpSel = (G.bpSel + 8) % 9; G.sfx.ui(); }
    if (G.pressed.right) { G.bpSel = (G.bpSel + 1) % 9; G.sfx.ui(); }
    if (G.pressed.enter || G.pressed.use) tryFastTravel();
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
  if (G.pressed.map) { G.state = 'blueprint'; G.bpSel = 0; G.sfx.ui(); return; }

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
