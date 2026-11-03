const puppeteer = require('puppeteer-core'); const path = require('path');
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1])); await p.setViewport({ width: 1200, height: 800 });
  await p.goto('file://' + path.resolve(__dirname, '../index.html')); await p.waitForFunction(() => G.S.mode === 'title');
  const r = await p.evaluate(() => { const W = G.World, out = {}, H = G.input.held, Pr = G.input.pressed;
    const step = (n, f) => { for (let i = 0; i < n; i++) { Object.keys(H).forEach(k => H[k] = 0); Object.keys(Pr).forEach(k => Pr[k] = 0); f && f(i); W.heavenUpdate(); W.updatePlayer(); W.updateEnemies(); W.updateItems(); G.tickTimers(); if (G.S.mode !== 'play') G.S.mode = 'play'; } };
    const load = (n, ab) => { G.S.ab = ab || ['wings', 'dash', 'shield', 'burst', 'spear']; G.S.bosses = []; G.S.mode = 'play'; G.loadLevel(n, false); G.S.mode = 'play'; return W.L; };
    const findTile = (L, v) => { for (let x = 0; x < L.W; x++) for (let y = 0; y < L.H; y++) if (L.g[y][x] === v) return [x, y]; };
    const place = (x, y) => { const P = W.P; P.x = x; P.y = y; P.vx = 0; P.vy = 0; P.st = 'normal'; };
    // load all heavens
    out.loads = []; for (let n = 1; n <= 13; n++) { const L = load(n); out.loads.push(n + ':' + L.W + 'x' + L.H); }
    // R5 mirror
    let L = load(5), P = W.P; const pl = L.pools[0]; place(pl.x - 30, pl.y - 30); step(30); step(40, () => { H.right = 1; }); out.r5mirror = !!L.mirror;
    const [wx, wy] = findTile(L, 10); out.r5wallSolid = W.solid(wx * 16 + 8, wy * 16 + 8);
    place(L.vision.x - 30, L.vision.y - 10); step(30); step(10, () => { H.right = 1; }); out.r5vision = L.vision.seen + ' lock ' + P.lock;
    step(200); place(L.pools[1].x - 30, L.pools[1].y - 30); step(20); step(40, () => { H.right = 1; }); out.r5back = !L.mirror;
    // R6 moon
    L = load(6); P = W.P; const m = L.moons[0]; out.r6before = L.phase || 0; W.hitHeaven({ x: m.x, y: m.y, w: 4, h: 4 }, { melee: true }); out.r6after = L.phase; const [ux, uy] = findTile(L, 11); out.r6Usolid = W.solid(ux * 16 + 8, uy * 16 + 4);
    // R7 stars: stand at the void's edge, throw light, walk across
    L = load(7); P = W.P; let ex = 0, gy = 0; { const s = L.signs.find(s => s.i === 14); ex = Math.floor(s.x / 16); gy = Math.floor(s.y / 16); }
    place(ex * 16 + 24, gy * 16 + 16 - 22); P.face = 1; step(20); step(4, i => { if (i === 0) Pr.light = 1; if (i < 3) H.light = 1; }); step(30); out.r7stars = Object.keys(L.stars || {}).length;
    const x0 = P.x; step(130, () => { H.right = 1; }); out.r7crossed = Math.round((P.x - x0) / 16) + ' tiles, y ' + Math.round(P.y / 16) + ' (start ' + gy + ')';
    // R8 ribbon
    L = load(8); P = W.P; const rb = L.ribbons[0]; place(rb.x - 30, rb.y + 30); step(20); step(30, i => { H.right = 1; if (i < 12) { H.jump = 1; if (!i) Pr.jump = 1; } }); out.r8ride = !!L.ride; step(120, () => { H.right = 1; }); out.r8after = Math.round((P.x - rb.x) / 16) + ' tiles past start, on ' + P.on + ' y ' + Math.round(P.y / 16);
    // R9 darkness
    G.S.r9lit = false; L = load(9); P = W.P; place(L.start.x + 100, L.start.y); step(260); out.r9noLight = W.noLight; place(L.birdsX - 10, L.start.y); for (let y = 0; y < L.H; y++) if (L.g[y][Math.floor(L.birdsX / 16)]) { P.y = y * 16 - 22; break; } step(200); out.r9restored = !W.noLight && G.S.r9lit;
    // R10 crumble
    L = load(10); P = W.P; const [cx13, cy13] = findTile(L, 13); place(cx13 * 16 + 2, cy13 * 16 - 22); step(10); step(30, () => { H.right = 1; }); step(40); out.r10crumbled = L.g[cy13][cx13] === 0;
    out.r10fall = L.fallX !== undefined;
    // R11 ancestors
    L = load(11); P = W.P; const f = L.fallen[0]; place(f.x, f.y + 16 - 22); step(5); out.r11allies = (L.allies || []).length; const e0 = L.enemies.filter(e => !e.dead).length; step(600, () => { P.hp = 999; }); out.r11enemiesLeft = e0 + ' -> ' + L.enemies.filter(e => !e.dead).length;
    // R12 darkness kills a player who waits
    L = load(12); P = W.P; let died = false; const od = G.onPlayerDeath; G.onPlayerDeath = () => { died = true; }; step(1800, () => {}); G.onPlayerDeath = od; out.r12idleDies = died; out.r12boss = L.b.boss || 'none';
    return out; });
  console.log(JSON.stringify(r, null, 1));
  // ending: push and journey home
  await p.evaluate(() => { G.S.lore = [1, 5, 9]; G.startEnding(); }); await new Promise(r => setTimeout(r, 2500));
  console.log('ending shot', await p.evaluate(() => [G.S.mode, G.Cine.i, !!(G.Cine.shots[G.Cine.i] || {}).hold]));
  await p.keyboard.down('Space'); await new Promise(r => setTimeout(r, 9000)); await p.keyboard.up('Space');
  console.log('after push', await p.evaluate(() => [G.Cine.i, (G.Cine.shots[G.Cine.i] || {}).title, (G.Cine.shots[G.Cine.i] || {}).text]));
  await (await p.$('#cab')).screenshot({ path: require('path').resolve(__dirname, 'ending.png') });
  console.log('errors', errs.slice(0, 6)); await b.close(); })();
