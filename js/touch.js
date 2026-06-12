// ============================================================
// ISKANDER — touch controls (tablets / phones)
// Creates a DOM overlay; inert on desktop and in headless tests.
// ============================================================
(function () {
  if (typeof document === 'undefined' || !document.createElement) return;
  const touch = (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) || ('ontouchstart' in window);
  if (!touch) return;
  G.touchMode = true;

  const style = document.createElement('style');
  style.textContent =
    'body{touch-action:none;-webkit-user-select:none;user-select:none}' +
    '.tbtn{position:fixed;z-index:10;display:flex;align-items:center;justify-content:center;' +
    'border:2px solid rgba(243,207,107,.5);border-radius:14%;background:rgba(22,18,29,.45);' +
    'color:#f3cf6b;font:bold 3.2vmin monospace;opacity:.6;-webkit-tap-highlight-color:transparent}' +
    '.tbtn.held{background:rgba(201,145,47,.6);opacity:.9}';
  document.head.appendChild(style);

  // key, label, css position/size
  const B = 'width:11vmin;height:11vmin;';
  const S = 'width:8vmin;height:8vmin;';
  const defs = [
    ['left', '◀', B + 'left:3vmin;bottom:4vmin'],
    ['right', '▶', B + 'left:16vmin;bottom:4vmin'],
    ['down', '▼', B + 'left:9.5vmin;bottom:16vmin'],
    ['jump', 'JUMP', B + 'right:3vmin;bottom:17vmin'],
    ['sword', 'SWRD', B + 'right:3vmin;bottom:4vmin'],
    ['spear', 'SPER', B + 'right:16vmin;bottom:4vmin'],
    ['shield', 'SHLD', B + 'right:16vmin;bottom:17vmin'],
    ['dash', 'DASH', B + 'right:29vmin;bottom:4vmin'],
    ['use', 'E', B + 'right:29vmin;bottom:17vmin'],
    ['menu', 'Q', S + 'right:3vmin;top:3vmin'],
    ['enter', '⏎', S + 'right:13vmin;top:3vmin'],
    ['garrison', 'G', S + 'right:23vmin;top:3vmin'],
    ['map', 'MAP', S + 'right:33vmin;top:3vmin'],
    ['ngplus', 'NG+', S + 'right:43vmin;top:3vmin'],
    ['assist', 'AID', S + 'right:53vmin;top:3vmin'],
    ['s1', '1', S + 'left:3vmin;top:3vmin'],
    ['s2', '2', S + 'left:12vmin;top:3vmin'],
    ['s3', '3', S + 'left:21vmin;top:3vmin'],
    ['s4', '4', S + 'left:30vmin;top:3vmin'],
    ['s5', '5', S + 'left:39vmin;top:3vmin'],
  ];
  for (const d of defs) {
    const el = document.createElement('div');
    el.className = 'tbtn';
    el.textContent = d[1];
    el.style.cssText += d[2];
    const k = d[0];
    el.addEventListener('touchstart', function (e) {
      e.preventDefault();
      el.classList.add('held');
      if (!G.keys[k]) G.pressed[k] = true;
      G.keys[k] = true;
      initAudio();
    }, { passive: false });
    const release = function (e) {
      if (e) e.preventDefault();
      el.classList.remove('held');
      G.keys[k] = false;
    };
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });
    document.body.appendChild(el);
  }

  // tapping the screen itself confirms (title / choice / endings)
  G.canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    initAudio();
    if (G.state === 'title' || G.state === 'choice') G.pressed.enter = true;
    if (G.state === 'ending' || G.state === 'gameover') G.pressed.restart = true;
  }, { passive: false });

  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
})();
