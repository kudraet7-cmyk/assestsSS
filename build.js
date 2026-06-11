// Assembles the standalone single-file index.html from the js/ sources.
// Run: node build.js
'use strict';
const fs = require('fs');
const path = require('path');

const ORDER = ['core.js', 'world.js', 'actors.js', 'render.js', 'main.js'];
const js = ORDER.map(function (f) {
  const src = fs.readFileSync(path.join(__dirname, 'js', f), 'utf8');
  return '// ' + '='.repeat(60) + '\n// SOURCE: js/' + f + '\n// ' + '='.repeat(60) + '\n' + src;
}).join('\n');

if (js.includes('</scr' + 'ipt>')) throw new Error('js sources may not contain a script-closing tag');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>ISKANDER: Gates of the Two-Horned</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html,body{margin:0;padding:0;background:#0b0908;height:100%;overflow:hidden}
  body{display:flex;align-items:center;justify-content:center}
  canvas{image-rendering:pixelated;image-rendering:crisp-edges;background:#000}
</style>
</head>
<body>
<canvas id="game"></canvas>
<script>
${js}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html written: ' + html.length + ' bytes, single file, zero dependencies.');
