const puppeteer = require('puppeteer-core'); const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage(); await page.goto('file://' + path.resolve(__dirname, '../index.html')); await page.waitForFunction(() => G.S.mode === 'title');
  const out = await page.evaluate(() => {
    const W = G.World, H = G.input.held, Pr = G.input.pressed, res = {};
    const run = (frames, fn) => { for (let i = 0; i < frames; i++) { const P = W.P; P.hp = 999; P.inv = 5; Object.keys(H).forEach(k => H[k] = 0); Object.keys(Pr).forEach(k => Pr[k] = 0); fn(i, P); W.updatePlayer(); W.updateEnemies(); W.updateItems(); if (G.S.mode === 'popup') G.S.mode = 'play'; } };
    const setup = (n, ab) => { G.S.ab = ab; G.loadLevel(n, false); const L = W.L, d = Object.values(L.doors)[0]; const cx = (d[0][0] - 14) * 16; L.enemies = []; return { L, cx, floorY: Math.max(...d.map(q => q[1])) * 16 + 16 }; };
    // R2: climb the vine, hop right onto the platform, strike the stone
    { const { L, cx, floorY } = setup(2, ['wings']); const P = W.P; P.x = cx + 2 * 16 + 3; P.y = floorY - 22; P.vy = 0;
      run(120, (i) => { H.up = 1; }); run(40, (i) => { H.right = 1; if (i < 12) H.jump = 1; if (i === 0) Pr.jump = 1; }); const log = []; run(30, (i) => { if (i === 0) H.left = 1; if (i === 5) Pr.attack = 1; log.push(i + ':' + (P.atk ? P.atk.kind + P.atkT : '-') + ' on' + P.on + ' st' + P.st); });
      const sw = L.switches[0]; res.R2 = L.switches.map(s => s.on).join(',') + ' P ' + [P.x - cx, P.y, P.w, P.h].map(Math.round) + ' SW ' + [sw.x - cx, sw.y, sw.w, sw.h] + ' ' + log.slice(3, 16).join(' '); }
    // R4: stand left of the spikes, fire a light bolt at the stone
    { const { L, cx, floorY } = setup(4, ['wings', 'dash']); const P = W.P; P.x = cx + 3 * 16; P.y = floorY - 22; P.face = 1;
      run(10, () => { H.right = 1; }); run(30, (i) => { H.light = i < 6 ? 1 : 0; }); run(60, () => { });
      res.R4 = L.switches.map(s => s.on).join(','); }
    // R10: from the left floor, jump + double jump onto the high ledge and strike
    { const { L, cx, floorY } = setup(10, ['wings', 'dash']); const P = W.P; P.x = cx + 3 * 16 + 4; P.y = floorY - 22; P.face = -1;
      run(15, () => {}); const tr = []; run(70, (i) => { tr.push(Math.round((P.x - cx) / 16 * 10) / 10 + '/' + Math.round((floorY - P.y - P.h) / 16 * 10) / 10 + (P.dj ? 'd' : '')); H.left = i < 10 ? 1 : 0; if (i === 0) Pr.jump = 1; if (i < 20) H.jump = 1; if (i === 19) Pr.jump = 1; if (i >= 19 && i < 36) H.jump = 1; }); run(20, (i) => { if (i === 2) Pr.attack = 1; });
      res.R10 = L.switches.map(s => s.on).join(',') + ' trace ' + tr.filter((_, i) => i % 3 === 0).join(' '); }
    // R4 & R10 with the stones lit: does the gate open?
    res.doorsOpenR10 = Object.values(W.L.doors)[0].every(([x, y]) => W.L.g[y][x] === 0);
    return res;
  });
  console.log(out); await browser.close();
})();
