/* Tāne's Ascent — Act 1, hand-built: Rangi 1–4
   Each heaven has one idea of its own:
   Rangi 1  light makes life grow (seeds grow vines and fern bridges); the grey forest wakes as Tāne passes
   Rangi 2  a climb up one giant tree; freeing a trapped kererū, which returns at the top as the double jump
   Rangi 3  Ngārara stalks Tāne through the clouds before the guardian fight
   Rangi 4  Tāwhirimātea's storm: brace against gusts, and let lightning break cracked stone
   Chunk codes added here: S seed (grows a vine) · P seed (grows a fern bridge to the right) · K trapped kererū
   X cracked stone (lightning breaks it) · Y canopy line · J V Z carved signs 11–13 */
(() => {
const G = window.G, W = G.World, T = 16;
const R = rows => rows; // readability

W.SIGNS[11] = 'Throw {light} at a seed, or strike it. Life answers Tāne.';
W.SIGNS[12] = 'Hold {down} to brace against the wind, or shelter behind rock.';
W.SIGNS[13] = 'Lightning breaks cracked stone. Wait by the wall, then step away.';

/* ---------------- Rangi 1: The Primal Forest ---------------- */
const r1Fern = { id: 'r1-fern', r: R([
  '....................', '....................', '....................', '....................', '....................', '....................', '....................',
  '..........##########', '..........##########', '..........##########',
  '..........##########',
  '.....J...S##########',
  '####################', '####################']) };
const r1Climb = { id: 'r1-climb', r: R([
  '....................', '....................',
  '..............######', '..............######', '..............######', '..............######',
  '.............S######',
  '.........###########', '.........###########', '.........###########', '.........###########',
  '........S###########',
  '####################', '####################']) };
const r1Bridge = { id: 'r1-bridge', r: R([
  '....................', '....................', '....................', '....................', '....................', '....................',
  '....................', '....................', '.........m.m.m......', '....................', '....................',
  '..P............e....',
  '###^^^^^^^^#########', '####################']) };
const r1Grove = { id: 'r1-grove', r: R([
  '....................', '....................', '....................', '....................', '....................',
  '..c.................',
  '.####...............', '....................', '....................', '....................', '....................',
  '.....S.......e......',
  '####################', '####################']) };

/* ---------------- Rangi 2: The Living Canopy ---------------- */
const r2Base = { id: 'r2-base', r: R([
  '....................', '....................',
  '...............#####', '...............#####',
  '...........====#####', '...............#####', '............b..#####',
  '......====.....#####', '...............#####', '..........m....#####',
  '..====.........#####', '...............#####',
  '####################', '####################']) };
const r2Hollow = { id: 'r2-hollow', r: R([
  '....................',
  '.............H......',
  '..........g..H######',
  '.........###.H######',
  '.............H######', '.............H######', '.............H######', '.............H######',
  '.....e.......H######',
  '...#####.....H######',
  '.............H######', '.............H######',
  '####################', '####################']) };
const r2Cage = { id: 'r2-cage', r: R([
  '....................', '....................', '....................', '....................', '....................',
  '....................', '.....===......b.....', '....................', '....................', '....................', '....................',
  '..........K...D.....',
  '####################', '####################']) };
const r2Branches = { id: 'r2-branches', r: R([
  '....................', '....................', '....................', '........b...........', '....................',
  '..............######', '..............######',
  '.........====.######', '..............######',
  '....====......######', '..............######', '..............######',
  '####################', '####################']) };
const r2Top = { id: 'r2-top', r: R([
  '....................', '....................', '....................', '....................', '....................',
  '....................',
  '.....c..............',
  '....===.............', '....................',
  '.........===........', '...............m....', 'Y...................',
  '####################', '####################']) };

/* ---------------- Rangi 4: The Realm of Storms ---------------- */
const r4Open = { id: 'r4-open', r: R([
  '....................', '....................', '....................', '....................', '....................', '....................',
  '....................', '....................', '....................', '....................',
  '.........#.......#..',
  '.V......##......##..',
  '####################', '####################']) };
const r4Wall = { id: 'r4-wall', r: R([
  '....................',
  '............XX......', '............XX......', '............XX......', '............XX......', '............XX......',
  '............XX......', '............XX......', '............XX......', '............XX......', '.......m....XX......',
  '.....Z......XX......',
  '####################', '####################']) };
const r4Ridge = { id: 'r4-ridge', r: R([
  '....................', '....................', '....................', '....................',
  '...............#####', '...............#####',
  '..........###..#####', '...............#####', '.....h.........#####',
  '....####.......#####', '..........m....#####',
  '...e...........#####',
  '####################', '####################']) };
const r4Column = { id: 'r4-column', r: R([
  '....................', '..............######', '..............######',
  '...........==.######', '..............######',
  '.......==.....######', '..............######',
  '...==.........######', '..............######',
  '.......==.....######', '.........m....######',
  '...==.........######',
  '####################', '####################']) };

W.AUTHORED = {
  1: ['tut-move', 'tut-ledge', 'tut-strike', 'tut-light', r1Fern, 'tut-vine', r1Climb, r1Bridge, 'tut-slide', 'set1', r1Grove],
  2: [r2Base, r2Hollow, r2Cage, 'set2', r2Branches, r2Top],
  3: ['updraft', 'ledges', 'wings', 'set3', 'gap', 'updraft', 'steps', 'alcove'],
  4: [r4Open, r4Wall, 'set4', r4Ridge, r4Column]
};

/* ---------------- chunk codes ---------------- */
W.genChar = (ch, c) => {
  const { L, g, X, Y, wx, wy, si } = c;
  switch (ch) {
    case 'S': case 'P': (L.seeds = L.seeds || []).push({ x: wx + 2, y: wy + 2, w: 12, h: 12, X, Y, kind: ch === 'S' ? 'vine' : 'bridge', grown: false, t: 0 }); break;
    case 'K': L.switches.push({ x: wx + 2, y: wy + 2, w: 12, h: 12, g: si, on: false, t: 0, bird: true }); break;
    case 'X': g[Y][X] = 8; if (c.ry <= 1) for (let y = Y - 1; y >= Math.max(0, Y - 10); y--) g[y][X] = 8; break;
    case 'Y': L.canopyY = wy + 2 * T; break;
    case 'J': L.signs.push({ x: wx + 1, y: wy, i: 11 }); break;
    case 'V': L.signs.push({ x: wx + 1, y: wy, i: 12 }); break;
    case 'Z': L.signs.push({ x: wx + 1, y: wy, i: 13 }); break;
  }
};
const solidAt = (L, X, Y) => { const v = L.g[Y] && L.g[Y][X]; return v === 1 || v === 5 || v === 6 || v === 7 || v === 8; };

/* ---------------- hits: light grows seeds ---------------- */
W.hitHeaven = (box, o) => {
  const L = W.L; if (!L.seeds || !o || !(o.proj || o.melee)) return;
  for (const s of L.seeds) {
    if (s.grown || !G.hit(box, s)) continue;
    s.grown = true; s.queue = [];
    if (s.kind === 'vine') { for (let k = 0; k < 6; k++) { const yy = s.Y - k; if (yy < 0 || solidAt(L, s.X, yy)) break; s.queue.push([s.X, yy, 4]); } }
    else { for (let k = 1; k <= 8; k++) { const xx = s.X + k; if (solidAt(L, xx, s.Y)) break; s.queue.push([xx, s.Y, 2]); } }
    G.audio.sfx('lightmote', 1, { x: s.x, p: .8 }); G.audio.sfx('feather', .6, { x: s.x });
    G.fx.burst(s.x + 6, s.y + 6, '#9ae86a', 18, 2.2, { k: 'glow', g: 0 });
    if (!G.S.grewOnce) { G.S.grewOnce = true; G.toast('The seed answers the light', 'Tāne makes life grow.'); }
  }
};

/* ---------------- Rangi 2: the trapped kererū ---------------- */
W.onBirdFreed = sw => {
  G.audio.sfx('feather'); G.audio.sfx('treasure', .5); G.fx.burst(sw.x + 6, sw.y + 6, '#9ae86a', 20, 2.4);
  G.toast('The kererū is free', 'It flies up through the canopy.');
};
W.drawCage = (ctx, sw, x, y, t) => {
  const kb = G.kereruSprite(Math.floor(t / (sw.on ? 3 : 14)) % 2);
  if (!sw.on) {
    ctx.drawImage(kb.r, x, y + 2 + Math.sin(t * .2) * .5);
    ctx.strokeStyle = '#2a1a10'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 2 + i * 5, y + 14); ctx.lineTo(x + 1 + i * 4, y - 4); ctx.stroke(); }
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 3, y - 5, 18, 2); ctx.fillRect(x - 3, y + 13, 18, 2);
    G.glow(ctx, x + 6, y + 6, 10, '#9ae86a', .18 + .1 * Math.sin(t * .1));
  } else if (sw.t < 120) { sw.t++; const k = sw.t / 120; ctx.globalAlpha = 1 - k * .6; ctx.drawImage(kb.r, x + k * 90, y - k * k * 160); ctx.globalAlpha = 1; }
};

/* ---------------- Rangi 4: cracked stone ---------------- */
const crackSprite = () => G.sprite('crack8', 16, 16, px => {
  px.r(0, 0, 16, 16, '#3a3a44'); px.r(0, 0, 16, 2, '#5a5a6a'); px.r(1, 14, 15, 2, '#22222a');
  px.l(3, 2, 7, 8, '#16161c'); px.l(7, 8, 5, 14, '#16161c'); px.l(7, 8, 12, 10, '#16161c'); px.l(12, 10, 14, 4, '#16161c');
  px.p(8, 7, '#8a8aa0'); px.p(12, 9, '#8a8aa0');
}, null);
W.drawTile8 = (ctx, x, y) => ctx.drawImage(crackSprite().r, x, y);
W.drawTileX = (ctx, x, y, tx, ty, t, v) => { if (v === 8) W.drawTile8(ctx, x, y); else if (W.drawTileMore) W.drawTileMore(ctx, x, y, tx, ty, t, v); };

/* ---------------- per-frame heaven logic ---------------- */
const groundBelow = (L, x, y) => { const X = Math.floor(x / T); let Y = Math.floor(y / T); while (Y < L.H && !solidAt(L, X, Y) && L.g[Y][X] !== 2) Y++; return Y * T; };
W.heavenUpdate = () => {
  const L = W.L, P = W.P; if (!L || !P) return; L.ht = (L.ht || 0) + 1;
  // seeds grow one tile every few frames
  if (L.seeds) for (const s of L.seeds) if (s.queue && s.queue.length && L.ht % 4 === 0) { const [X, Y, v] = s.queue.shift(); L.g[Y][X] = v; G.fx.burst(X * T + 8, Y * T + 8, '#6aaa4a', 5, 1.2); if (s.queue.length % 2 === 0) G.audio.sfx('climb', .5); }
  // Rangi 1: the forest wakes behind Tāne
  if (L.n === 1) L.wake = Math.max(L.wake || 0, P.x + 110);
  // Rangi 2: bursting through the canopy
  if (L.n === 2 && L.canopyY !== undefined && !L.burst && P.y < L.canopyY - 8) { L.burst = true; G.audio.sfx('treasure'); G.audio.duck(.5, 1.2, 1.5); G.toast('Above the canopy', 'Open sky, for the first time.'); }
  // Rangi 3: Ngārara stalks through the clouds
  if (L.n === 3 && !G.Boss.active) {
    const x1 = L.arena ? L.arena.x0 : L.gate.x, prog = (P.x - L.start.x) / Math.max(1, x1 - L.start.x);
    if (!L.pass && L.ht % 540 === 200) { L.pass = { t: 0 }; G.audio.sfx('rumble', .5); }
    if (L.pass && ++L.pass.t > 420) L.pass = null;
    L.surfaced = L.surfaced || [];
    for (const m of [.3, .6, .85]) if (prog > m && !L.surfaced.includes(m)) { L.surfaced.push(m); L.surf = { t: 0, x: P.x + 70 * P.face }; G.shake(3); G.audio.sfx('roar', .5); G.audio.sfx('rumble', .7); if (m === .3) G.toast('Something huge moves in the clouds', 'It is following you.'); }
    if (L.surf && ++L.surf.t > 110) L.surf = null;
  }
  // Rangi 4: Tāwhirimātea's storm
  if (L.n === 4) storm(L, P);
};
function storm(L, P) {
  const c = L.ht % 420; L.gust = c >= 70 && c < 170 ? 2 : c < 70 ? 1 : 0;
  if (c === 0) G.audio.sfx('wind', .5); if (c === 70) { G.audio.sfx('wind', 1); G.shake(1); }
  P.braced = false;
  if (L.gust === 2 && G.S.mode === 'play') {
    const row = P.y + 10, shelter = [1, 2, 3].some(k => solidAt(L, Math.floor((P.x + P.w) / T) + k, Math.floor(row / T)));
    P.braced = P.on && G.btn('down');
    if (!shelter && !P.braced && P.st !== 'climb' && P.st !== 'hang') P.vx = Math.max(-2.6, P.vx - (P.on ? .3 : .24));
  }
  // lightning: marks a spot near Tāne, then strikes it
  const lc = (L.ht + 130) % 300;
  if (lc === 0 && !L.strike && L.gust !== 2) { const x = P.x + 5 + G.clamp(P.vx * 16, -24, 24); L.strike = { x, y: groundBelow(L, P.x + 5, P.y), t: 0 }; G.audio.sfx('lightmote', .5, { p: .6 }); }
  if (L.strike) {
    const s = L.strike; s.t++;
    if (s.t === 56) {
      G.weather.flash = .9; G.weather.bolt = { x: s.x - (W.camX || 0), t: 12, seed: Math.random() * 1000 }; G.audio.sfx('thunder'); G.shake(5);
      if (Math.abs(P.x + 5 - s.x) < 14 && Math.abs(P.y + P.h - s.y) < 40) W.hurtPlayer(20, s.x, { src: 'lightning' });
      const X0 = Math.floor(s.x / T), Y0 = Math.floor(s.y / T); let broke = 0;
      for (let X = X0 - 2; X <= X0 + 2; X++) for (let Y = Y0 - 5; Y <= Y0 + 1; Y++) if (L.g[Y] && L.g[Y][X] === 8) { L.g[Y][X] = 0; broke++; G.fx.burst(X * T + 8, Y * T + 8, '#8a8aa0', 8, 2); }
      if (broke) { G.audio.sfx('slam'); if (!G.S.brokeOnce) { G.S.brokeOnce = true; G.toast('The lightning breaks the stone', 'Tāwhirimātea’s anger opens the way.'); } }
    }
    if (s.t > 70) L.strike = null;
  }
}

/* ---------------- drawing ---------------- */
W.heavenBack = (ctx, cx, cy, t) => {
  const L = W.L; if (!L) return; W.camX = cx;
  const P = W.P;
  if (L.n === 2 && L.canopyY !== undefined && P) { const k = G.clamp((L.canopyY + 40 - P.y) / 160, 0, 1); if (k > 0) { const gr = ctx.createLinearGradient(0, 0, 0, G.PH); gr.addColorStop(0, `rgba(122,174,224,${.9 * k})`); gr.addColorStop(1, `rgba(216,236,255,${.85 * k})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, G.VW, G.PH); G.glow(ctx, G.VW * .7, 30, 90, '#fff6dc', .5 * k); } }
  if (L.n === 3 && L.surf && P) { // Ngārara rises behind the path, then sinks back
    const s = L.surf, k = Math.sin(Math.PI * Math.min(1, s.t / 110)), sp = G.bossSprite('ngarara', 0);
    ctx.save(); ctx.globalAlpha = .85; ctx.drawImage(G.tint(s.x > P.x ? sp.l : sp.r, '#3a4660'), s.x - cx - sp.w * 1.1, G.PH + 10 - k * 150, sp.w * 2.2, sp.h * 2.2); ctx.restore();
  }
  if (L.n === 3 && L.pass) { // a vast shape swimming behind the clouds
    const sp = G.bossSprite('ngarara', Math.floor(t / 10) % 4), k = L.pass.t / 420, x = G.VW + 60 - k * (G.VW + 300), y = 70 + Math.sin(t * .02) * 10;
    ctx.save(); ctx.globalAlpha = .28 * Math.sin(Math.PI * k); ctx.drawImage(G.tint(sp.l, '#6a7a98'), x, y, sp.w * 2.4, sp.h * 2.4); ctx.restore();
  }
};
W.heavenFront = (ctx, cx, cy, t) => {
  const L = W.L, P = W.P; if (!L) return;
  // seeds and grown ferns
  if (L.seeds) for (const s of L.seeds) { const x = s.x - cx, y = s.y - cy; if (x < -20 || x > G.VW + 20) continue;
    if (!s.grown) { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x + 3, y + 9, 6, 3); ctx.fillStyle = '#7fd36a'; ctx.fillRect(x + 5, y + 4 + Math.sin(t * .1) * .5, 2, 6); ctx.fillRect(x + 3, y + 5, 2, 2); ctx.fillRect(x + 7, y + 4, 2, 2); G.glow(ctx, x + 6, y + 7, 10, '#9ae86a', .25 + .15 * Math.sin(t * .08)); }
    else { ctx.fillStyle = '#3f8a3a'; ctx.fillRect(x + 1, y + 6, 10, 6); ctx.fillStyle = '#6aaa4a'; ctx.fillRect(x + 2, y + 4, 3, 3); ctx.fillRect(x + 7, y + 3, 3, 3); } }
  if (L.n === 1) { // grey, sleeping forest ahead; light rain (Ranginui's grief)
    const ex = Math.round((L.wake || 0) - cx);
    if (ex < G.VW) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; for (let i = 0; i < 4; i++) { ctx.globalAlpha = .25 + i * .2; ctx.fillStyle = '#808080'; ctx.fillRect(Math.max(0, ex + i * 14), 0, G.VW, G.PH); } ctx.restore(); }
    ctx.fillStyle = 'rgba(190,210,240,.28)'; for (let i = 0; i < 70; i++) { const rr = G.rng(i * 11 + 3); const x = (rr() * G.VW - t * .8 + 4000) % G.VW, y = (rr() * G.PH + t * (3 + rr() * 2)) % G.PH; ctx.fillRect(x, y, 1, 4); }
  }
  if (L.n === 2 && L.canopyY !== undefined && P) { // dark under the canopy, open sky above it
    const d = G.clamp((P.y - L.canopyY) / 120, 0, 1); if (d > 0) { ctx.fillStyle = `rgba(4,18,10,${.42 * d})`; ctx.fillRect(0, 0, G.VW, G.PH); }
  }
  if (L.n === 4) { // gust streaks, lightning telegraph, brace pose cue
    const n = L.gust === 2 ? 46 : L.gust === 1 ? 10 : 0; ctx.fillStyle = 'rgba(220,230,255,.35)';
    for (let i = 0; i < n; i++) { const rr = G.rng(i * 17 + 1); const x = (G.VW - ((t * (9 + rr() * 6) + rr() * 900) % (G.VW + 60))), y = rr() * G.PH; ctx.fillRect(x, y, 14 + rr() * 16, 1); }
    if (L.strike && L.strike.t < 56) { const s = L.strike, x = s.x - cx, a = .25 + .5 * (s.t / 56) * (.6 + .4 * Math.sin(s.t * .6)); ctx.fillStyle = `rgba(232,232,255,${a * .35})`; ctx.fillRect(x - 8, 0, 16, s.y - cy); G.glow(ctx, x, s.y - cy - 2, 16, '#e8e8ff', a); }
    if (P && P.braced) G.glow(ctx, P.x + 5 - cx, P.y + P.h - cy, 12, '#c8b8a0', .35);
  }
};
})();
