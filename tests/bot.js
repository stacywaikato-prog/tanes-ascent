const puppeteer = require('puppeteer-core'); const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../index.html')); await page.waitForFunction(() => G.S.mode === 'title');
  for (const mode of ['bot-solves', 'gates-open']) {
    const res = await page.evaluate(mode => {
      const W = G.World, out = {};
      for (let n = 1; n <= 13; n++) {
        G.S.ab = n <= 2 ? [] : n === 3 ? ['wings'] : ['wings', 'dash', 'shield', 'burst', 'spear']; G.S.bosses = ['ngarara', 'moonkeeper', 'champion', 'gatekeeper', 'whiro']; G.S.lives = 9; G.loadLevel(n, false);
        const L = W.L, P = W.P, x0 = P.x, goal = L.gate.x; let best = 0, steps, done = false, dir = 1, jt = 0, lastX = P.x, stuck = 0;
        if (mode === 'gates-open') for (const sw of L.switches) W.hitSwitches({ x: sw.x, y: sw.y, w: 4, h: 4 }); if (mode === 'gates-open') { // pre-solve the Act 2-3 heaven mechanics so traversal can be checked
            for (let x = 0; x < L.W; x++) { let run = 0; for (let y = 0; y <= L.H; y++) { if (y < L.H && L.g[y][x] === 11) run++; else { if (run) for (let k = y - run; k < y; k++) L.g[k][x] = run >= 4 ? 0 : 1; run = 0; } } for (let y = 0; y < L.H; y++) if (L.g[y][x] === 12) L.g[y][x] = 1; }
            if (L.n === 7 || L.n === 8) for (let x = 1; x < L.W; x++) { let any = false; for (let y = 0; y < L.H; y++) if (L.g[y][x] === 1) any = true; if (!any) { let gy = 0; for (let xx = x - 1; xx >= 0; xx--) { let y = 0; while (y < L.H && L.g[y][xx] !== 1 && L.g[y][xx] !== 14) y++; if (y < L.H) { gy = y; break; } } L.g[gy][x] = 14; } }
            if (L.n === 12) L.riseT = -1e9; }
          if (mode === 'gates-open') for (const sd of (L.seeds || [])) { W.hitHeaven(sd, { proj: true }); for (const q of sd.queue) L.g[q[1]][q[0]] = q[2]; sd.queue = []; }
        const H = G.input.held, Pr = G.input.pressed;
        for (steps = 0; steps < 12000 && !done; steps++) {
          P.hp = 999; P.inv = 5; Object.keys(H).forEach(k => H[k] = 0); Object.keys(Pr).forEach(k => Pr[k] = 0);
          H[dir > 0 ? 'right' : 'left'] = 1;
          const tx = Math.floor((P.x + 5) / 16), ty = Math.floor((P.y + 11) / 16);
          if (W.tile(tx, ty) === 4 || P.st === 'climb') H.up = 1;
          if (P.st === 'hang') Pr.up = 1;
          // low passage ahead: crouch-walk
          if (P.on && W.solid(P.x + (dir > 0 ? 14 : -4), P.y + 2) && !W.solid(P.x + (dir > 0 ? 14 : -4), P.y + P.h - 4)) H.down = 1;
          if (P.st === 'crouch' || P.st === 'slide') { if (W.solid(P.x + 5, P.y - 6)) H.down = 1; }
          const near = L.switches.some(sw => !sw.on && Math.abs(sw.x - P.x) < 28 && Math.abs(sw.y - P.y) < 40); if (near && steps % 16 === 0) Pr.attack = 1;
          if (jt > 0) { H.jump = 1; jt--; }
          if (!H.down && ((P.on && (P.hitW || W.solid(P.x + (dir > 0 ? 14 : -4), P.y + 4) || !W.solid(P.x + (dir > 0 ? 24 : -14), P.y + P.h + 4))) || P.wallDir)) { Pr.jump = 1; H.jump = 1; jt = 14; }
          if (!P.on && P.vy > -0.6 && P.vy < 2 && !P.dj && !P.wallDir && G.S.ab.includes('wings')) { Pr.jump = 1; H.jump = 1; jt = 10; } else if (!P.on && P.vy > 1 && !P.dj && steps % 3 === 0) { Pr.jump = 1; H.jump = 1; jt = 10; }
          if (!P.on && P.vy > 2 && P.dj && !P.dashed && steps % 5 === 0) Pr.roll = 1;
          // stand under a waiting glyph stone? swing upward
          for (const sw of L.switches) if (!sw.on && Math.abs(sw.x - P.x) < 30 && sw.y < P.y && sw.y > P.y - 70) { if (P.on) { Pr.jump = 1; H.jump = 1; jt = 14; } else Pr.attack = 1; }
          W.updatePlayer(); W.updateEnemies(); W.updateItems(); G.tickTimers();
          if (G.S.mode !== 'play') { if (G.S.mode === 'cine-wait' || G.S.mode === 'summary') { done = true; break; } if (G.S.mode === 'popup') G.S.mode = 'play'; else break; }
          best = Math.max(best, (P.x - x0) / (goal - x0));
          if (steps % 240 === 0) { if (Math.abs(P.x - lastX) < 8) { stuck++; dir = -dir; } else dir = 1; lastX = P.x; }
        }
        const doorX = Object.values(L.doors)[0], blocked = doorX && L.g[doorX[0][1]][doorX[0][0]] === 6 && Math.abs(P.x - doorX[0][0] * 16) < 120;
        out[n] = (done ? 'GATE' : 'stuck') + ' ' + Math.round(best * 100) + '% ' + Math.round(steps / 60) + 's' + (blocked ? ' (at closed glyph gate)' : '') + ' stones ' + L.switches.filter(s => s.on).length + '/' + L.switches.length;
        G.clearTimers(); G.S.mode = 'title';
      }
      return out;
    }, mode);
    console.log(mode); for (const k in res) console.log('  R' + k, res[k]);
  }
  console.log('errors', errs);
  await browser.close();
})();
