const puppeteer = require('puppeteer-core'); const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '../index.html'), OUT = path.resolve(__dirname, 'output');
require('fs').mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage(); await page.setViewport({ width: 1100, height: 900 });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(URL); await page.waitForFunction(() => G.S.mode === 'title', { timeout: 8000 });
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).join(', '));
  console.log('fonts loaded:', fonts);
  const cab = await page.$('#cab'); const shot = n => cab.screenshot({ path: OUT + '/' + n + '.png' });
  await shot('title');
  for (const n of [1, 2, 5, 6, 8, 10]) {
    const info = await page.evaluate(n => { G.S.ab = ['wings', 'dash', 'shield', 'burst', 'spear']; G.S.lives = 9; G.loadLevel(n, false); const L = G.World.L; return { W: L.W, sw: L.switches.length, doors: Object.keys(L.doors).length, signs: L.signs.length, secrets: L.secrets.length, horror: L.enemies.filter(e => e.type === 'horror').length, beast: L.enemies.filter(e => e.type === 'beast').length }; }, n);
    console.log('L' + n, JSON.stringify(info));
  }
  // jump to the R1 water + door set piece and the first signs
  await page.evaluate(() => { G.loadLevel(1, false); const L = G.World.L; G.World.P.x = L.signs[0].x - 40; });
  await sleep(500); await shot('r1-sign');
  await page.evaluate(() => { const L = G.World.L, sw = L.switches[0]; G.World.P.x = sw.x - 60; G.World.P.y = sw.y - 30; });
  await sleep(700); await shot('r1-door');
  await page.evaluate(() => { const sw = G.World.L.switches[0]; G.World.hitSwitches({ x: sw.x, y: sw.y, w: 4, h: 4 }); });
  await sleep(500); await shot('r1-door-open');
  console.log('door open', await page.evaluate(() => { const L = G.World.L; const d = Object.values(L.doors)[0]; return d.every(([x, y]) => L.g[y][x] === 0); }));
  // new enemies on screen
  await page.evaluate(() => { G.loadLevel(10, false); const L = G.World.L, b = L.enemies.find(e => e.type === 'beast'); if (b) { G.World.P.x = b.x - 120; G.World.P.y = b.y - 10; G.World.P.inv = 9999; } });
  await sleep(1200); await shot('beast');
  await page.evaluate(() => { G.loadLevel(6, false); const L = G.World.L, h = L.enemies.find(e => e.type === 'horror'); if (h) { G.World.P.x = h.x - 20; G.World.P.y = h.anchor + 70; G.World.P.inv = 9999; } });
  await sleep(1500); await shot('horror');
  // summary screen
  await page.evaluate(() => { G.loadLevel(2, false); const P = G.World.P, L = G.World.L; P.x = L.gate.x + 19; P.y = L.gate.y - 22; P.vy = 1; });
  await sleep(1600); console.log('mode after gate', await page.evaluate(() => G.S.mode)); await shot('summary');
  await page.keyboard.press('Enter'); await sleep(1200); console.log('after summary', await page.evaluate(() => G.S.mode));
  // settings pages + new game difficulty
  await page.evaluate(() => { G.S.mode = 'title'; }); await sleep(300);
  await page.evaluate(() => { G.S.mode = 'newgame'; }); await sleep(400); await shot('newgame');
  await page.evaluate(() => { G.S.mode = 'title'; }); await sleep(200);
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
  console.log('title items', await page.evaluate(() => G.S.mode));
  await page.evaluate(() => { G.S.mode = 'sound'; }); await sleep(300); await shot('settings-root');
  // crash guard
  await page.evaluate(() => { G.loadLevel(3, false); const orig = G.World.updateEnemies; G.World.updateEnemies = () => { throw new Error('test crash'); }; window.__restore = () => G.World.updateEnemies = orig; });
  await sleep(400); console.log('crash mode', await page.evaluate(() => G.S.mode)); await shot('crash');
  await page.evaluate(() => window.__restore()); await page.keyboard.press('Enter'); await sleep(1500); console.log('after reload', await page.evaluate(() => G.S.mode));
  // pause holds game-clock timers
  console.log('timer pause test', await page.evaluate(async () => { let fired = false; G.after(10, () => fired = true); G.S.mode = 'pause'; await new Promise(r => setTimeout(r, 600)); const during = fired; G.S.mode = 'play'; await new Promise(r => setTimeout(r, 600)); return { firedWhilePaused: during, firedAfter: fired }; }));
  console.log('report:\n' + await page.evaluate(() => G.plog.report()));
  console.log('ERRS', errs.filter(e => !/test crash/.test(e)).slice(0, 10));
  await browser.close();
})();
