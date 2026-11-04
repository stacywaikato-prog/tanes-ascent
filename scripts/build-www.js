// Copies the game into www/ for the Android app. The game itself stays in the repo root,
// so GitHub Pages and the Android app always run the same files.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
for (const f of fs.readdirSync(root)) if (f.endsWith('.js') || f === 'index.html' || f === 'manifest.webmanifest') fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of ['fonts', 'music', 'icons']) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
console.log('www ready:', fs.readdirSync(out).length, 'files');
