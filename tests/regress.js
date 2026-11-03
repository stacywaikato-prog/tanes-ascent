const puppeteer = require('puppeteer-core'); const path = require('path'); const fs = require('fs');
const URL = 'file://' + path.resolve(__dirname, '../index.html'), OUT = path.resolve(__dirname, 'output');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage(); await page.setViewport({ width: 1100, height: 900 });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const dl = path.resolve(__dirname, 'output', 'downloads'); fs.rmSync(dl, { recursive: true, force: true }); fs.mkdirSync(dl);
  const cdp = await page.target().createCDPSession(); await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dl });
  await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForFunction(() => G.S.mode === 'title');
  const cab = await page.$('#cab'); const shot = n => cab.screenshot({ path: OUT + '/' + n + '.png' });
  const key = async (k, ms = 60) => { await page.keyboard.down(k); await sleep(ms); await page.keyboard.up(k); await sleep(80); };
  // bosses: start, force defeat, confirm the gate opens and reward flow runs
  for (const n of [3, 6, 9]) { await page.evaluate(() => { G.S.mode = 'play'; });
    await page.evaluate(n => { G.S.ab = ['wings', 'dash', 'shield', 'burst', 'spear']; G.S.lives = 9; G.S.bosses = []; G.loadLevel(n, false); const A = G.World.L.arena; G.World.P.x = A.x0 + 90; G.World.P.y = A.floor - 22; }, n);
    await sleep(1200); for (let i = 0; i < 40 && await page.evaluate(() => G.S.mode !== 'play'); i++) { await key('Enter'); await sleep(400); }
    await page.evaluate(() => { G.World.P.hp = 999; const b = G.Boss.b; b.hp = .5; if (b.orbs) b.orbs = [0, 0, 0, 0]; b.open = 300; G.Boss.hitTest({ x: -1e5, y: -1e5, w: 2e5, h: 2e5 }, 5, { hit: new Set() }, { heavy: true }); });
    await sleep(4200);
    console.log('boss R' + n, JSON.stringify(await page.evaluate(() => ({ mode: G.S.mode, active: G.Boss.active, gate: G.World.L.gate.open, hp: G.Boss.b && G.Boss.b.max }))));
    if (await page.evaluate(() => G.S.mode === 'popup')) { await key('Enter'); await sleep(200); }
  }
  console.log('assist boss hp check', await page.evaluate(() => { G.prefs.diff = 'assist'; G.S.bosses = []; G.loadLevel(3, false); const A = G.World.L.arena; G.World.P.x = A.x0 + 90; G.World.P.y = A.floor - 22; return new Promise(r => setTimeout(() => { const v = G.Boss.b && G.Boss.b.max; G.prefs.diff = 'normal'; r(v); }, 600)); }));
  // Whiro → ending
  await page.evaluate(() => { G.S.bosses = []; G.loadLevel(13, false); const A = G.World.L.arena; G.World.P.x = A.x0 + 90; G.World.P.y = A.floor - 22; }); await sleep(700); await key('Enter');
  await page.evaluate(() => { const b = G.Boss.b; b.phase = 4; b.hp = .5; G.Boss.hitTest({ x: -1e5, y: -1e5, w: 2e5, h: 2e5 }, 5, { hit: new Set() }, { heavy: true }); });
  await sleep(5500); console.log('after whiro', await page.evaluate(() => G.S.mode));
  // key rebinding: jump → KeyN, then N should jump
  await page.evaluate(() => { G.loadLevel(1, false); }); await sleep(300);
  await page.evaluate(() => { G.S.mode = 'sound'; }); await sleep(200);
  await key('ArrowDown'); await key('ArrowDown'); await key('ArrowDown'); await key('Enter'); await sleep(200); // Keyboard keys page
  await shot('keys-page');
  await key('Enter'); await sleep(100); await key('KeyN'); await sleep(200);
  console.log('jump keys now', await page.evaluate(() => G.keys.list('jump')), '| prompt', await page.evaluate(() => G.fmt('{jump} to jump')));
  await key('Escape'); await sleep(100); await key('Escape'); await sleep(200); console.log('mode', await page.evaluate(() => G.S.mode));
  await page.evaluate(() => { G.S.mode = 'play'; G.World.P.vy = 0; }); await sleep(300);
  await page.keyboard.down('KeyN'); await sleep(80); const vy = await page.evaluate(() => G.World.P.vy); await page.keyboard.up('KeyN'); console.log('N jumps (vy<0):', vy < 0);
  await page.evaluate(() => G.keys.reset());
  // text size + reduced motion
  await page.evaluate(() => { G.prefs.text = 1.3; G.prefs.calm = true; G.S.mode = 'pause'; }); await sleep(400); await shot('large-text-pause');
  await page.evaluate(() => { G.prefs.text = 1; G.prefs.calm = false; G.S.mode = 'play'; });
  // export save
  await page.evaluate(() => { G.save('slot1'); G.S.mode = 'sound'; }); await sleep(100);
  await page.evaluate(() => { const items = (function () { return null; })(); });
  await page.evaluate(() => { const ev = new KeyboardEvent('keydown', { code: 'ArrowDown' }); }); 
  await key('ArrowDown'); await key('ArrowDown'); await key('ArrowDown'); await key('ArrowDown'); await key('Enter'); await sleep(200); // Saves page
  await shot('saves-page'); await key('Enter'); await sleep(1200);
  const files = fs.readdirSync(dl); console.log('downloaded', files);
  if (files[0]) { const j = JSON.parse(fs.readFileSync(path.join(dl, files[0]), 'utf8')); console.log('export ok', j.game, Object.keys(j.saves)); }
  // import: feed the exported file back through the file chooser
  await page.evaluate(() => localStorage.removeItem('tanes-ascent-save-v1'));
  const [chooser] = await Promise.all([page.waitForFileChooser({ timeout: 4000 }), key('ArrowDown').then(() => key('Enter'))]);
  await chooser.accept([path.join(dl, files[0])]); await sleep(600);
  console.log('import restored', await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('tanes-ascent-save-v1') || '{}'))));
  await key('ArrowDown'); await key('Enter'); await sleep(400); await shot('report');
  console.log('ERRS', errs.slice(0, 8));
  await browser.close();
})();
