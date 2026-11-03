/* Tāne's Ascent — the twelve heavens and Toi-o-ngā-Rangi: parallax, tiles, weather, light, particles */
(() => {
const G = window.G, PI = Math.PI, S = Math.sin, Co = Math.cos;
const LW = 512, LH = 200;

/* ---------- painter helpers (loop-safe at LW) ---------- */
const wrapX = (x, w, fn) => { fn(x); if (x - w < 0) fn(x + LW); if (x + w > LW) fn(x - LW); };
function ridge(px, base, amp, hs, col, seed = 0) {
  px.x.fillStyle = col;
  for (let x = 0; x < LW; x++) { let h = 0; hs.forEach(([k, a], i) => h += S(x / LW * PI * 2 * k + seed * (i + 1)) * a); const y = Math.round(base - amp - h); px.x.fillRect(x, y, 1, LH - y); }
}
function ponga(px, x, base, h, col, lite) {
  wrapX(x, 40, X => {
    px.l(X, base, X + 1, base - h, col, 3); for (let y = base - h; y < base; y += 4) px.p(X - 1, y, lite);
    for (let i = 0; i < 9; i++) {
      const a = -PI / 2 + (i - 4) * .38, L = 26 + (i % 3) * 5;
      let lx = X + 1, ly = base - h;
      for (let t = 1; t <= L; t += 2) { const nx = X + 1 + Co(a) * t, ny = base - h + S(a) * t + t * t * .018; px.l(lx, ly, nx, ny, col, 1); if (t % 4 === 1) { px.p(nx + (a > -PI / 2 ? 1 : -1), ny + 2, col); px.p(nx, ny + 2, col); } lx = nx; ly = ny; }
    }
  });
}
function blobTree(px, x, base, h, r, col) { wrapX(x, r + 4, X => { px.l(X, base, X, base - h, col, 4); for (let i = 0; i < 6; i++) px.circ(X + Co(i) * r * .6, base - h + S(i * 1.7) * r * .4, r * (.5 + (i % 3) * .15), col); }); }
function island(px, x, y, w, col, lite, r) {
  wrapX(x, w, X => {
    px.ell(X, y, w, 4, col); px.poly([[X - w, y], [X + w, y], [X + w * .3, y + w * .9], [X - w * .2, y + w * .7]], col);
    for (let i = 0; i < 4; i++) px.l(X - w * .5 + i * w * .3, y + 2, X - w * .5 + i * w * .3 + 1, y + 6 + r() * w * .5, col, 1);
    if (lite) px.r(X - w + 2, y - 2, w * 2 - 4, 1, lite);
  });
}
function pillar(px, x, base, h, w, col, cap) { wrapX(x, w + 6, X => { px.r(X - w / 2, base - h, w, h, col); px.r(X - w / 2 - 3, base - h - 4, w + 6, 4, cap || col); px.r(X - w / 2 - 2, base - 3, w + 4, 3, cap || col); }); }
function waharoa(px, x, base, h, col) { wrapX(x, 30, X => { px.r(X - 20, base - h, 6, h, col); px.r(X + 14, base - h, 6, h, col); px.r(X - 26, base - h - 8, 52, 8, col); px.circ(X, base - h - 10, 6, col); }); }
function crystal(px, x, base, h, col, lite) { wrapX(x, 12, X => { px.poly([[X - 5, base], [X, base - h], [X + 5, base]], col); px.l(X, base - h + 2, X - 2, base - 2, lite); }); }
function deadTree(px, x, base, h, col, r) {
  wrapX(x, 40, X => { px.l(X, base, X, base - h, col, 3); const br = (bx, by, a, l, d) => { if (d > 4 || l < 3) return; const ex = bx + Co(a) * l, ey = by + S(a) * l; px.l(bx, by, ex, ey, col, d < 2 ? 2 : 1); br(ex, ey, a - .5 - r() * .3, l * .7, d + 1); br(ex, ey, a + .4 + r() * .3, l * .65, d + 1); }; br(X, base - h, -PI / 2, h * .4, 0); });
}
function hangVine(px, x, top, len, col, leaf) { wrapX(x, 6, X => { for (let y = 0; y < len; y++) { px.p(X + Math.round(S(y * .2) * 1.5), top + y, col); if (leaf && y % 5 === 0) px.p(X + 2, top + y, leaf); } }); }
function stars(px, n, r, maxY, col = '#efe6d2') { for (let i = 0; i < n; i++) { const x = r() * px.w, y = r() * maxY; px.p(x, y, r() < .2 ? col : G.alpha('#efe6d2', .5)); if (r() < .05) { px.p(x + 1, y, G.alpha(col, .4)); px.p(x - 1, y, G.alpha(col, .4)); px.p(x, y + 1, G.alpha(col, .4)); px.p(x, y - 1, G.alpha(col, .4)); } } }
function nebula(px, r, cols) { const x = px.x; for (let i = 0; i < 26; i++) { const cx = r() * px.w, cy = r() * px.h * .8, rad = 30 + r() * 70, g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, G.alpha(cols[i % cols.length], .16)); g.addColorStop(1, G.alpha(cols[i % cols.length], 0)); x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); } }

/* ---------- biome table ---------- */
const B = G.BIOMES = [];
B[1] = { name: 'Papatūānuku', sub: 'The First Forest', sky: ['#04120f', '#0b2a24', '#1d4a3a'], dark: .5, amb: '#020806', tile: { body: '#2a2018', body2: '#3a2c20', top: '#3e7a3a', top2: '#6aaa4a', deco: 'moss' }, enemies: ['weta', 'liz'], weather: ['mist', 'glow', 'fireflies'], mood: 'early', ambS: { water: .6, crickets: 1, wind: .1 },
  far(px, r) { ridge(px, 150, 30, [[1, 14], [3, 8], [7, 3]], '#0c2620', 1); for (let i = 0; i < 9; i++) blobTree(px, r() * LW, 170, 60 + r() * 40, 18, '#0e2c24'); },
  mid(px, r) { for (let i = 0; i < 7; i++) ponga(px, i * 74 + r() * 30, 200, 70 + r() * 50, '#081a14', '#12302a'); this.falls = [[r() * LW, 30, 6]]; } };
B[2] = { name: 'Rangi Tuatahi', sub: 'The Living Canopy', sky: ['#0e2a1c', '#2a5a30', '#6a9a50'], dark: .18, amb: '#06140a', tile: { body: '#3a2a1a', body2: '#4a3622', top: '#3f8a3a', top2: '#8acd5a', deco: 'leaf' }, enemies: ['weta', 'liz', 'bird'], weather: ['leaves', 'rays'], mood: 'early', ambS: { birds: 1, wind: .3 },
  far(px, r) { for (let i = 0; i < 14; i++) blobTree(px, r() * LW, 200, 80 + r() * 60, 26, '#1c4a26'); ridge(px, 190, 10, [[2, 6], [5, 3]], '#173e20', 2); },
  mid(px, r) { for (let i = 0; i < 4; i++) { const x = i * 128 + r() * 40; wrapX(x, 50, X => { px.l(X, 200, X - 30, 120, '#0f2a14', 6); px.l(X, 200, X + 34, 130, '#0f2a14', 5); px.l(X - 2, 200, X, 40, '#0f2a14', 9); }); }
    for (let i = 0; i < 16; i++) hangVine(px, r() * LW, 0, 40 + r() * 100, '#123a18', '#2a6a2a');
    const by = 70; for (let x = 0; x < LW; x += 3) px.p(x, by + S(x / LW * PI * 2) * 8 + 8, '#0f2a14'); for (let x = 0; x < LW; x += 9) px.l(x, by + S(x / LW * PI * 2) * 8 + 8, x, by - 6, '#0f2a14'); } };
B[3] = { name: 'Rangi Tuarua', sub: 'The Islands of Mist', sky: ['#3a6aa8', '#7aaee0', '#d8ecff'], dark: 0, amb: '#000000', tile: { body: '#cfdcf0', body2: '#b8c8e2', top: '#ffffff', top2: '#e8f2ff', deco: 'cloud' }, enemies: ['bird', 'weta', 'liz'], weather: ['wind', 'clouds'], mood: 'mid', ambS: { wind: .8 }, boss: 'ngarara', updraft: true,
  far(px, r) { for (let i = 0; i < 6; i++) island(px, r() * LW, 60 + r() * 70, 18 + r() * 22, '#8aa8cc', '#b8d0ee', r); for (let i = 0; i < 10; i++) px.ell(r() * LW, 190, 40, 14, '#e8f2ff'); },
  mid(px, r) { for (let i = 0; i < 4; i++) island(px, i * 128 + r() * 40, 120 + r() * 40, 30, '#5a7aa2', '#9ec0e8', r); for (let i = 0; i < 12; i++) px.ell(r() * LW, 196, 50, 16, '#ffffff'); } };
B[4] = { name: 'Rangi Tuatoru', sub: 'The Realm of Storms', sky: ['#0c0c18', '#22223a', '#3a3a52'], dark: .35, amb: '#05050c', tile: { body: '#2a2a32', body2: '#3a3a44', top: '#4a4a5a', top2: '#7a7a92', deco: 'storm' }, enemies: ['bird', 'liz', 'horror'], weather: ['rain', 'lightning'], mood: 'mid', ambS: { rain: 1, wind: .7 },
  far(px, r) { for (let i = 0; i < 18; i++) px.ell(r() * LW, 40 + r() * 60, 40 + r() * 30, 14, '#16162a'); ridge(px, 170, 26, [[2, 12], [5, 6], [11, 3]], '#141422', 3); },
  mid(px, r) { for (let i = 0; i < 9; i++) { const x = r() * LW, h = 40 + r() * 70; wrapX(x, 20, X => px.poly([[X - 14, 200], [X - 3, 200 - h], [X + 2, 200 - h + 8], [X + 16, 200]], '#0c0c16')); } } };
B[5] = { name: 'Rangi Tuawhā', sub: 'The Still Pool', sky: ['#4a3a14', '#a87a2a', '#f2d080'], dark: 0, amb: '#000000', tile: { body: '#4a3418', body2: '#5a4220', top: '#d8a83a', top2: '#ffe08a', deco: 'gold' }, enemies: ['liz', 'bird'], weather: ['motes', 'rays'], mood: 'mid', ambS: { birds: .5, water: .3 },
  far(px, r) { for (let i = 0; i < 12; i++) blobTree(px, r() * LW, 200, 70 + r() * 60, 26, '#b8862a'); ridge(px, 195, 6, [[3, 4]], '#9a6a20', 4); },
  mid(px, r) { for (let i = 0; i < 6; i++) blobTree(px, i * 85 + r() * 30, 200, 90 + r() * 40, 20, '#6a4614'); for (let i = 0; i < 3; i++) { const x = r() * LW; wrapX(x, 10, X => { px.r(X - 4, 120, 8, 80, '#4a2c10'); for (let y = 126; y < 196; y += 8) px.poly([[X - 4, y], [X, y + 4], [X + 4, y]], '#8a5a1e'); }); } } };
B[6] = { name: 'Rangi Tuarima', sub: 'The Moon Heaven', sky: ['#04081a', '#0e1a3a', '#2a3a6a'], dark: .45, amb: '#02040e', tile: { body: '#3a4258', body2: '#4a5470', top: '#a8b8d8', top2: '#e8f0ff', deco: 'moon' }, enemies: ['weta', 'bird', 'horror'], weather: ['silver', 'mist'], mood: 'late', ambS: { water: .5, hum: .3 }, boss: 'moonkeeper', moon: true,
  far(px, r) { for (let i = 0; i < 4; i++) { const x = i * 128 + r() * 30; wrapX(x, 50, X => { px.r(X - 34, 110, 68, 90, '#141c34'); px.poly([[X - 40, 110], [X, 80], [X + 40, 110]], '#141c34'); for (let c = -24; c <= 24; c += 12) px.r(X + c - 2, 120, 4, 80, '#1e2848'); }); } },
  mid(px, r) { for (let i = 0; i < 8; i++) pillar(px, i * 64 + r() * 20, 200, 60 + r() * 50, 10, '#0c1226', '#16203a'); this.falls = [[r() * LW, 50, 10], [r() * LW, 70, 6]]; } };
B[7] = { name: 'Rangi Tuaono', sub: 'The Star Pathways', sky: ['#020108', '#0a0820', '#1a1040'], dark: .25, amb: '#020108', tile: { body: '#1a1630', body2: '#241e40', top: '#6a5ab8', top2: '#c8b8ff', deco: 'star' }, enemies: ['bird', 'liz', 'weta'], weather: ['shoot', 'motes2'], mood: 'late', ambS: { hum: .5 }, nebula: ['#7a3aa8', '#2a6ab8', '#c2452a'],
  far(px, r) { for (let i = 0; i < 5; i++) { const pts = Array.from({ length: 5 }, () => [r() * LW, 20 + r() * 120]); for (let j = 0; j < 4; j++) px.l(pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1], 'rgba(200,190,255,.25)'); pts.forEach(p => { px.circ(p[0], p[1], 1, '#e8e0ff'); }); } },
  mid(px, r) { for (let i = 0; i < 6; i++) island(px, r() * LW, 100 + r() * 70, 14 + r() * 14, '#120e24', '#3a3070', r); } };
B[8] = { name: 'Rangi Tuawhitu', sub: 'The Aurora Realm', sky: ['#020a14', '#081c2a', '#123040'], dark: .2, amb: '#02060a', tile: { body: '#1a2a3a', body2: '#22384a', top: '#9ae8ff', top2: '#e8ffff', deco: 'ice' }, enemies: ['beast', 'bird', 'liz'], weather: ['aurora', 'mana'], mood: 'late', ambS: { wind: .5, hum: .3 },
  far(px, r) { ridge(px, 160, 40, [[2, 20], [4, 10], [9, 4]], '#0e2030', 5); ridge(px, 175, 14, [[3, 8], [7, 4]], '#16304a', 6); },
  mid(px, r) { for (let i = 0; i < 10; i++) { const x = r() * LW, y = 60 + r() * 100; crystal(px, x, y, 14 + r() * 18, '#2a6a8a', '#9ae8ff'); } } };
B[9] = { name: 'Rangi Tuawaru', sub: 'Where Whiro Takes Hold', sky: ['#08020c', '#1c0820', '#3a1030'], dark: .55, amb: '#040006', tile: { body: '#1c1420', body2: '#281c2c', top: '#3a1a3a', top2: '#7a2a5a', deco: 'black' }, enemies: ['lizC', 'horror', 'warrior'], weather: ['dark', 'mist'], mood: 'dark', ambS: { wind: .4, hum: .7 }, boss: 'champion', corrupt: true,
  far(px, r) { for (let i = 0; i < 10; i++) deadTree(px, r() * LW, 200, 60 + r() * 60, '#160a1a', r); },
  mid(px, r) { for (let i = 0; i < 14; i++) { const x = r() * LW; wrapX(x, 20, X => { let y = 200, xx = X; for (let k = 0; k < 30; k++) { const nx = xx + S(k * .7 + i) * 3, ny = y - 4; px.l(xx, y, nx, ny, '#0a040c', 2); if (k % 3 === 0) px.p(nx + 2, ny, '#0a040c'); xx = nx; y = ny; } }); } } };
B[10] = { name: 'Rangi Tuaiwa', sub: 'The Broken Heavens', sky: ['#1a1420', '#5a3a3a', '#c27a4a'], dark: .1, amb: '#0a0608', tile: { body: '#6a6058', body2: '#7a7066', top: '#c8beb0', top2: '#efe6d8', deco: 'ruin' }, enemies: ['warrior', 'beast', 'bird'], weather: ['debris', 'rays'], mood: 'late', ambS: { wind: .6 },
  far(px, r) { for (let i = 0; i < 7; i++) { const x = r() * LW, y = 50 + r() * 90; island(px, x, y, 16 + r() * 14, '#3a2a2a', null, r); wrapX(x, 10, X => { px.r(X - 6, y - 26, 4, 24, '#3a2a2a'); px.r(X + 3, y - 18, 4, 16, '#3a2a2a'); }); } },
  mid(px, r) { for (let i = 0; i < 6; i++) { const x = i * 85 + r() * 20, h = 50 + r() * 80; pillar(px, x, 200, h, 12, '#2a1e1e', '#3a2a28'); wrapX(x, 10, X => px.poly([[X - 9, 200 - h - 4], [X + 9, 200 - h - 4], [X + 4, 200 - h - 12]], '#3a2a28')); } } };
B[11] = { name: 'Rangi Tuangahuru', sub: 'The War of Light and Darkness', sky: ['#1a0604', '#5a1a0a', '#c2452a'], dark: .2, amb: '#0a0202', tile: { body: '#2a1a14', body2: '#3a241a', top: '#5a3a24', top2: '#ff8a3a', deco: 'war' }, enemies: ['warrior', 'beast', 'lizC'], weather: ['embers', 'smoke'], mood: 'boss', ambS: { wind: .6, hum: .4 },
  far(px, r) { ridge(px, 165, 20, [[2, 10], [6, 4]], '#2a0a06', 7); for (let i = 0; i < 3; i++) { const x = r() * LW; wrapX(x, 60, X => { for (let k = -50; k < 50; k += 5) px.r(X + k, 130 + Math.abs(k) * .2, 4, 40, '#1e0604'); px.poly([[X - 20, 130], [X, 100], [X + 20, 130]], '#1e0604'); }); } },
  mid(px, r) { for (let x = 0; x < LW; x += 7) { const h = 30 + (Math.floor(x / 7) % 5) * 4 + r() * 6; if (r() < .8) { px.r(x, 200 - h, 5, h, '#120402'); px.poly([[x, 200 - h], [x + 2.5, 200 - h - 5], [x + 5, 200 - h]], '#120402'); } } } };
B[12] = { name: 'Rangi Tekau-mā-tahi', sub: 'The Golden Summit', sky: ['#c27a2a', '#f2c14e', '#fff1c0'], dark: 0, amb: '#000000', tile: { body: '#e8dcc0', body2: '#d8c8a0', top: '#f2c14e', top2: '#fff1c0', deco: 'summit' }, enemies: ['warrior', 'beast', 'bird'], weather: ['rays', 'motes'], mood: 'late', ambS: { wind: .3, hum: .2 }, boss: 'gatekeeper',
  far(px, r) { for (let i = 0; i < 6; i++) { const x = r() * LW, h = 80 + r() * 80; wrapX(x, 40, X => { px.r(X - 20, 200 - h, 40, h, '#d8a858'); px.poly([[X - 26, 200 - h], [X, 200 - h - 30], [X + 26, 200 - h]], '#d8a858'); }); } },
  mid(px, r) { for (let i = 0; i < 4; i++) waharoa(px, i * 128 + r() * 40, 200, 70 + r() * 30, '#a8762a'); } };
B[13] = { name: 'Rangi Tekau-mā-rua', sub: 'Toi-o-ngā-Rangi', sky: ['#f6e6c0', '#fff6dc', '#ffffff'], dark: 0, amb: '#000000', tile: { body: '#f2ead8', body2: '#e2d6b8', top: '#f2c14e', top2: '#ffffff', deco: 'city' }, enemies: ['warrior'], weather: ['rays', 'motes', 'clouds'], mood: 'final', ambS: { hum: .4, wind: .2 },
  far(px, r) { const fc = '#e8cfa0';
    for (let i = 0; i < 6; i++) { const x = r() * LW, base = 150 + r() * 50, w = 36 + r() * 22, h = 34 + r() * 18; wrapX(x, w, X => {
      px.ell(X, base + 4, w * .9, 7, fc); px.r(X - w / 2, base - h * .45, w, h * .45, fc);
      px.poly([[X - w / 2 - 6, base - h * .45], [X, base - h], [X + w / 2 + 6, base - h * .45]], fc);
      px.l(X - w / 2 - 8, base - h * .45 + 3, X + 3, base - h - 3, fc, 2); px.l(X + w / 2 + 8, base - h * .45 + 3, X - 3, base - h - 3, fc, 2);
      px.r(X - 1, base - h - 12, 3, 12, fc); px.circ(X, base - h - 13, 3, fc); }); }
    for (let i = 0; i < 7; i++) { const x = r() * LW, h = 50 + r() * 70; wrapX(x, 8, X => { px.r(X - 2, 200 - h, 5, h, fc); px.circ(X, 200 - h - 2, 4, fc); }); } for (let i = 0; i < 5; i++) island(px, r() * LW, 40 + r() * 60, 20, '#e8cfa0', '#ffffff', r); },
  mid(px, r) { for (let i = 0; i < 5; i++) { const x = i * 102 + r() * 20, h = 80 + r() * 40; wrapX(x, 12, X => { px.r(X - 7, 200 - h, 14, h, '#c8a060'); px.circ(X, 200 - h - 4, 8, '#c8a060'); px.r(X - 4, 200 - h - 6, 3, 2, '#f2c14e'); px.r(X + 2, 200 - h - 6, 3, 2, '#f2c14e'); }); wrapX(x, 10, X => { for (let y = 200 - h + 6; y < 196; y += 10) px.poly([[X - 7, y], [X, y + 5], [X + 7, y]], '#a87a3a'); }); } } };

/* ---------- build layers & tiles ---------- */
function buildSky(b) {
  const px = new G.PX(G.VW, G.PH), x = px.x, g = x.createLinearGradient(0, 0, 0, G.PH);
  g.addColorStop(0, b.sky[0]); g.addColorStop(.6, b.sky[1]); g.addColorStop(1, b.sky[2]); x.fillStyle = g; x.fillRect(0, 0, G.VW, G.PH);
  const r = G.rng(b.idx * 31);
  if (b.nebula) nebula(px, r, b.nebula);
  if (b.dark > .15 || b.nebula) stars(px, b.nebula ? 220 : 110, r, G.PH * .75);
  if (b.moon) { px.circ(300, 50, 26, '#dde8ff'); px.circ(306, 46, 22, '#f2f7ff'); for (let i = 0; i < 7; i++) px.circ(290 + (i * 13) % 24, 40 + (i * 7) % 24, 2 + i % 3, '#cbd8f0'); const gg = x.createRadialGradient(300, 50, 20, 300, 50, 90); gg.addColorStop(0, 'rgba(200,220,255,.25)'); gg.addColorStop(1, 'rgba(200,220,255,0)'); x.fillStyle = gg; x.fillRect(200, 0, 200, 150); }
  if (b.idx === 12 || b.idx === 13) { const gg = x.createRadialGradient(192, 20, 10, 192, 20, 200); gg.addColorStop(0, 'rgba(255,255,255,.8)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gg; x.fillRect(0, 0, G.VW, G.PH); }
  return px.c;
}
function buildTiles(b) {
  const t = b.tile, r = G.rng(b.idx * 97), mk = () => new G.PX(16, 16);
  const body = () => { const p = mk(); p.r(0, 0, 16, 16, t.body); const dk = G.mixHex(t.body, '#000000', .3);
    for (const sy of [5, 11]) { const x0 = Math.floor(r() * 8), len = 5 + Math.floor(r() * 7); p.r(x0, sy, len, 1, t.body2); p.r(x0 + 1, sy + 1, len - 2, 1, dk); }
    for (let i = 0; i < 2; i++) { const bx = Math.floor(r() * 13), by = 2 + Math.floor(r() * 12); p.r(bx, by, 3, 2, dk); p.r(bx, by, 2, 1, t.body2); } if (b.idx >= 10) { p.l(r() * 16, 0, r() * 16, 16, G.mixHex(t.body, '#000000', .25)); } if (t.deco === 'summit' || t.deco === 'city') { p.r(0, 15, 16, 1, G.mixHex(t.body, '#000000', .15)); p.r(15, 0, 1, 16, G.mixHex(t.body, '#000000', .1)); } return p; };
  const top = () => {
    const p = body(), d = t.deco;
    if (d === 'moss' || d === 'leaf') { p.r(0, 0, 16, 4, t.top); for (let x = 0; x < 16; x++) { p.p(x, 4 + (r() < .4), t.top); if (r() < .4) p.p(x, -0 + (r() < .5), t.top2); } if (d === 'leaf') for (let i = 0; i < 3; i++) p.r(r() * 14, r() * 3, 3, 1, t.top2); }
    else if (d === 'cloud') { p.r(0, 0, 16, 16, t.body); for (let i = 0; i < 5; i++) p.circ(i * 4, 3, 3, t.top); p.r(0, 3, 16, 2, t.top2); }
    else if (d === 'storm') { p.r(0, 0, 16, 3, t.top); p.r(0, 0, 16, 1, t.top2); for (let i = 0; i < 4; i++) p.p(r() * 16, 3, t.top2); }
    else if (d === 'gold') { p.r(0, 0, 16, 3, t.top); for (let x = 0; x < 16; x += 2) p.l(x, 3, x + 1, -1 + r() * 2, t.top2); }
    else if (d === 'moon') { p.r(0, 0, 16, 3, t.top); p.r(0, 0, 16, 1, t.top2); for (let x = 1; x < 16; x += 4) p.p(x, 2, '#5a6a8a'); }
    else if (d === 'star') { p.r(0, 0, 16, 3, t.top); for (let i = 0; i < 3; i++) p.p(r() * 16, r() * 10 + 4, t.top2); p.p(r() * 16, 1, '#ffffff'); }
    else if (d === 'ice') { p.r(0, 0, 16, 3, t.top); p.r(0, 0, 16, 1, t.top2); for (let x = 2; x < 16; x += 5) p.l(x, 3, x, 5 + r() * 3, t.top); }
    else if (d === 'black') { p.r(0, 0, 16, 3, t.top); for (let i = 0; i < 6; i++) p.l(r() * 16, 0, r() * 16, 6, '#0a040a'); for (let i = 0; i < 3; i++) p.p(r() * 16, 0, t.top2); }
    else if (d === 'ruin') { p.r(0, 0, 16, 3, t.top); p.r(0, 0, 16, 1, t.top2); p.l(r() * 16, 3, r() * 16, 10, G.mixHex(t.body, '#000000', .4)); }
    else if (d === 'war') { p.r(0, 0, 16, 2, t.top); if (r() < .7) p.p(r() * 16, 1, t.top2); p.p(r() * 16, 3, '#1a0a06'); }
    else { p.r(0, 0, 16, 3, t.top); p.r(0, 3, 16, 1, '#a87a2a'); for (let x = 0; x < 16; x += 4) { p.p(x + 1, 1, t.top2); p.p(x + 2, 2, '#a87a2a'); } }
    return p;
  };
  const plat = new G.PX(16, 6);
  if (t.deco === 'cloud') { for (let i = 0; i < 5; i++) plat.circ(i * 4, 3, 2.5, '#ffffff'); }
  else if (b.idx >= 5) { plat.r(0, 0, 16, 5, t.top); plat.r(0, 0, 16, 1, t.top2); plat.r(0, 4, 16, 1, G.mixHex(t.top, '#000000', .4)); plat.p(4, 2, t.top2); plat.p(12, 2, t.top2); }
  else { plat.r(0, 0, 16, 4, '#6a4428'); plat.r(0, 0, 16, 1, '#8a5a34'); plat.r(0, 4, 16, 1, '#2a180c'); plat.p(3, 2, '#2a180c'); plat.p(13, 2, '#2a180c'); plat.l(0, 5, 0, 5, '#2a180c'); }
  const spike = new G.PX(16, 16), sc = b.corrupt ? '#5a1a4a' : b.idx >= 7 ? '#c8d8ff' : '#6a4a2a', sh = b.corrupt ? '#ff4a6a' : '#efe6d2';
  for (let i = 0; i < 4; i++) { spike.poly([[i * 4, 16], [i * 4 + 2, 6 + (i % 2) * 2], [i * 4 + 4, 16]], sc); spike.p(i * 4 + 2, 7 + (i % 2) * 2, sh); }
  spike.r(0, 14, 16, 2, G.mixHex(sc, '#000000', .4));
  const vine = new G.PX(16, 16), vc = b.idx <= 5 ? '#2a6a2a' : b.corrupt ? '#3a1a3a' : '#c8a060', vl = b.idx <= 5 ? '#6aaa4a' : b.corrupt ? '#7a2a5a' : '#f2c14e';
  if (b.idx <= 5 || b.corrupt) { vine.l(7, 0, 8, 16, vc, 2); vine.l(9, 0, 7, 16, G.mixHex(vc, '#000000', .3), 1); for (let y = 2; y < 16; y += 5) { vine.r(9, y, 3, 2, vl); vine.r(4, y + 2, 3, 2, vl); } }
  else { vine.l(4, 0, 4, 16, vc, 2); vine.l(12, 0, 12, 16, vc, 2); for (let y = 2; y < 16; y += 5) vine.r(4, y, 9, 2, vl); }
  return { top: [top(), top(), top()].map(p => p.c), in: [body(), body(), body()].map(p => p.c), plat: plat.c, spike: spike.c, vine: vine.c };
}
G.buildBiome = idx => {
  const b = B[idx]; if (b.built) return b; b.idx = idx;
  const r = G.rng(idx * 1337 + 7);
  const far = new G.PX(LW, LH), mid = new G.PX(LW, LH);
  b.far.call(b, far, r); b.mid.call(b, mid, r);
  if (b.dark > 0) { const x = mid.x; x.globalCompositeOperation = 'source-atop'; x.fillStyle = G.alpha(b.amb, .2); x.fillRect(0, 0, LW, LH); x.globalCompositeOperation = 'source-over'; }
  b.farC = far.c; b.midC = mid.c; b.skyC = buildSky(b); b.tiles = buildTiles(b); b.built = true;
  b.fogC = b.sky[2];
  return b;
};

/* ---------- background / foreground rendering ---------- */
G.drawBackground = (ctx, b, cx, cy, t, levelH) => {
  ctx.drawImage(b.skyC, 0, 0);
  const W = G.VW;
  // animated sky effects
  if (b.weather.includes('aurora')) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { const hue = (t * .3 + k * 60) % 360; for (let x = 0; x < W; x += 3) { const y = 30 + k * 18 + S(x * .015 + t * .01 + k) * 14 + S(x * .04 - t * .02) * 5, h = 30 + S(x * .03 + t * .015 + k * 2) * 18; ctx.fillStyle = `hsla(${hue},90%,60%,.05)`; ctx.fillRect(x, y, 3, h * .25); ctx.fillStyle = `hsla(${hue},90%,62%,.11)`; ctx.fillRect(x, y + h * .25, 3, h * .3); ctx.fillStyle = `hsla(${(hue + 50) % 360},90%,55%,.05)`; ctx.fillRect(x, y + h * .55, 3, h * .45); } }
    ctx.restore();
  }
  if (b.weather.includes('clouds')) { ctx.fillStyle = G.alpha('#ffffff', .35); for (let i = 0; i < 6; i++) { const x = ((i * 97 - t * (.1 + i * .03) - cx * .05) % (W + 120) + W + 120) % (W + 120) - 60; ctx.beginPath(); ctx.ellipse(x, 30 + i * 14, 40 + i * 6, 6 + i, 0, 0, 7); ctx.fill(); } }
  const ys = levelH ? (cy / Math.max(1, levelH - G.PH)) : 1;
  const farY = 20 - ys * 20, midY = 40 - ys * 40;
  const layer = (img, par, oy) => { let ox = -((cx * par) % LW + LW) % LW; for (let x = ox; x < W; x += LW) ctx.drawImage(img, Math.round(x), Math.round(oy)); };
  layer(b.farC, .15, farY);
  if (b.fogC) { const g = ctx.createLinearGradient(0, G.PH * .4, 0, G.PH); g.addColorStop(0, G.alpha(b.fogC, 0)); g.addColorStop(1, G.alpha(b.fogC, b.dark > .3 ? .25 : .4)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, G.PH); }
  layer(b.midC, .4, midY);
  if (b.falls) for (const [fx, top, w] of b.falls) {
    let sx = ((fx - cx * .4) % LW + LW) % LW; for (let x = sx - LW; x < W; x += LW) {
      ctx.fillStyle = G.alpha(b.moon ? '#cfe0ff' : '#9ad8e8', .35); ctx.fillRect(x, top + midY, w, G.PH);
      for (let i = 0; i < w; i += 2) for (let y = 0; y < G.PH; y += 9) { const yy = (y + t * 2.5 + i * 7) % G.PH; ctx.fillStyle = G.alpha('#ffffff', .4); ctx.fillRect(x + i, top + midY + yy, 1, 4); }
      ctx.fillStyle = G.alpha('#ffffff', .25); ctx.beginPath(); ctx.ellipse(x + w / 2, G.PH - 2, w * 2, 4, 0, 0, 7); ctx.fill();
    }
  }
};

/* ---------- weather ---------- */
const W = G.weather = { parts: [], flash: 0, bolt: null };
W.init = b => {
  W.b = b; W.parts = []; W.flash = 0; W.bolt = null; const r = G.rng(b.idx * 13), types = b.weather;
  const add = (kind, n, f) => { for (let i = 0; i < n; i++) W.parts.push(Object.assign({ kind, x: r() * G.VW, y: r() * G.PH, ph: r() * 6.28 }, f ? f(r) : {})); };
  if (types.includes('rain')) add('rain', 140, r => ({ s: 5 + r() * 3 }));
  if (types.includes('glow')) add('glow', 70, r => ({ y: r() * G.PH * .55, par: .3 + r() * .4 }));
  if (types.includes('fireflies')) add('fly', 18, r => ({ vx: 0, vy: 0 }));
  if (types.includes('leaves')) add('leaf', 26, r => ({ s: .3 + r() * .5, c: r() < .5 ? '#6aaa4a' : '#3e7a3a' }));
  if (types.includes('motes')) add('mote', 40, r => ({ s: .1 + r() * .3, c: '#ffe08a' }));
  if (types.includes('motes2')) add('mote', 40, r => ({ s: .05 + r() * .2, c: '#c8b8ff' }));
  if (types.includes('silver')) add('mote', 40, r => ({ s: .1 + r() * .2, c: '#dde8ff' }));
  if (types.includes('mana')) add('mana', 50, r => ({ c: r() < .5 ? '#7fe6f0' : '#e07ad8' }));
  if (types.includes('dark')) add('darkm', 50, r => ({ s: .2 + r() * .4 }));
  if (types.includes('embers')) add('ember', 60, r => ({ s: .3 + r() * .8 }));
  if (types.includes('debris')) add('debris', 16, r => ({ s: .6 + r() * 1 }));
  if (types.includes('wind')) add('wind', 18, r => ({ s: 3 + r() * 4, l: 10 + r() * 30 }));
};
W.update = (t, camX, camY) => {
  const b = W.b; if (!b) return;
  if (b.weather.includes('lightning') && Math.random() < .004) { W.flash = 1; W.bolt = { x: 40 + Math.random() * 300, t: 12, seed: Math.random() * 1000 }; G.after(18 + Math.random() * 36, () => { if (G.S.mode === 'play') G.audio.sfx('thunder'); }); }
  if (b.weather.includes('shoot') && Math.random() < .01) W.parts.push({ kind: 'shoot', x: Math.random() * G.VW, y: Math.random() * 60, life: 40 });
  if (b.idx === 11 && Math.random() < .006) W.flash = .35;
  W.flash *= .9; if (W.bolt && --W.bolt.t <= 0) W.bolt = null;
  for (const p of W.parts) {
    switch (p.kind) {
      case 'rain': p.y += p.s; p.x -= 1.2; if (p.y > G.PH) { p.y = -8; p.x = Math.random() * (G.VW + 40); } break;
      case 'fly': p.ph += .03; p.x += S(p.ph * 1.3) * .4; p.y += Co(p.ph) * .3; break;
      case 'leaf': p.y += p.s; p.x += S(t * .03 + p.ph) * .6; if (p.y > G.PH) { p.y = -4; p.x = Math.random() * G.VW; } break;
      case 'mote': p.y -= p.s; p.x += S(t * .02 + p.ph) * .2; if (p.y < -4) { p.y = G.PH + 4; p.x = Math.random() * G.VW; } break;
      case 'mana': p.ph += .02; p.x += Co(p.ph) * 1.2; p.y += S(p.ph * 1.7) * .6; break;
      case 'darkm': p.y -= p.s; p.x += S(t * .02 + p.ph) * .3; if (p.y < -4) { p.y = G.PH + 4; p.x = Math.random() * G.VW; } break;
      case 'ember': p.y -= p.s; p.x += S(t * .05 + p.ph) * .5 + .3; if (p.y < -4) { p.y = G.PH + 4; p.x = Math.random() * G.VW; } break;
      case 'debris': p.y += p.s; p.x -= .2; if (p.y > G.PH) { p.y = -4; p.x = Math.random() * G.VW; } break;
      case 'wind': p.x += p.s; if (p.x > G.VW + 40) { p.x = -40; p.y = Math.random() * G.PH; } break;
      case 'shoot': p.x += 5; p.y += 2; p.life--; break;
    }
  }
  W.parts = W.parts.filter(p => p.kind !== 'shoot' || p.life > 0);
};
W.draw = (ctx, t, camX, camY) => {
  const b = W.b; if (!b) return; const VW = G.VW, PH = G.PH;
  if (W.bolt) { const bl = W.bolt, r = G.rng(bl.seed | 0); ctx.strokeStyle = 'rgba(230,230,255,.9)'; ctx.lineWidth = 1; ctx.beginPath(); let x = bl.x, y = 0; ctx.moveTo(x, y); while (y < PH * .7) { x += (r() - .5) * 16; y += 6 + r() * 10; ctx.lineTo(x, y); } ctx.stroke(); }
  for (const p of W.parts) {
    const wx = ((p.x - (p.par ? camX * p.par : 0)) % (VW + 20) + VW + 20) % (VW + 20) - 10;
    switch (p.kind) {
      case 'rain': ctx.fillStyle = 'rgba(180,190,230,.45)'; ctx.fillRect(p.x, p.y, 1, 6); break;
      case 'glow': { const a = .4 + .4 * S(t * .05 + p.ph); ctx.fillStyle = G.alpha('#8ae8ff', a); ctx.fillRect(wx, p.y, 1, 1); if (a > .7) { ctx.fillStyle = G.alpha('#8ae8ff', .15); ctx.fillRect(wx - 1, p.y - 1, 3, 3); } break; }
      case 'fly': { const a = .5 + .5 * S(t * .08 + p.ph * 3); ctx.fillStyle = G.alpha('#e8ff8a', a); ctx.fillRect(p.x, p.y, 1, 1); ctx.fillStyle = G.alpha('#e8ff8a', a * .2); ctx.fillRect(p.x - 1, p.y - 1, 3, 3); break; }
      case 'leaf': ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 2, 1); ctx.fillRect(p.x + (S(t * .1 + p.ph) > 0 ? 1 : 0), p.y + 1, 1, 1); break;
      case 'mote': ctx.fillStyle = G.alpha(p.c, .5 + .5 * S(t * .1 + p.ph)); ctx.fillRect(p.x, p.y, 1, 1); break;
      case 'mana': ctx.fillStyle = G.alpha(p.c, .7); ctx.fillRect(((p.x % VW) + VW) % VW, ((p.y % PH) + PH) % PH, 1, 1); break;
      case 'darkm': ctx.fillStyle = 'rgba(10,0,14,.6)'; ctx.fillRect(p.x, p.y, 2, 2); break;
      case 'ember': ctx.fillStyle = G.alpha(S(p.ph + t * .1) > 0 ? '#ff8a3a' : '#f2c14e', .8); ctx.fillRect(p.x, p.y, 1, 1); break;
      case 'debris': ctx.fillStyle = '#4a3a34'; ctx.fillRect(p.x, p.y, 2, 2); break;
      case 'wind': ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(p.x, p.y, p.l, 1); break;
      case 'shoot': ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(p.x, p.y, 2, 1); ctx.fillStyle = 'rgba(200,190,255,.4)'; for (let i = 1; i < 8; i++) ctx.fillRect(p.x - i * 2.5, p.y - i, 2, 1); break;
    }
  }
  if (b.weather.includes('mist')) { ctx.save(); for (let k = 0; k < 3; k++) { const y = PH - 30 - k * 26 + S(t * .01 + k) * 6, off = ((t * (.2 + k * .1) + k * 100 - camX * .2 * (k + 1)) % VW + VW) % VW; const g = ctx.createLinearGradient(0, y - 14, 0, y + 14); g.addColorStop(0, G.alpha(b.corrupt ? '#2a0a2a' : '#c8e0d8', 0)); g.addColorStop(.5, G.alpha(b.corrupt ? '#2a0a2a' : '#c8e0d8', b.corrupt ? .3 : .12)); g.addColorStop(1, G.alpha('#c8e0d8', 0)); ctx.fillStyle = g; for (let x = -off; x < VW; x += VW) ctx.fillRect(x, y - 14, VW, 28); } ctx.restore(); }
  if (b.weather.includes('smoke')) { for (let k = 0; k < 4; k++) { const x = ((k * 120 - t * .3 - camX * .3) % (VW + 100) + VW + 100) % (VW + 100) - 50; const g = ctx.createRadialGradient(x, PH - 40, 0, x, PH - 40, 60); g.addColorStop(0, 'rgba(30,10,8,.35)'); g.addColorStop(1, 'rgba(30,10,8,0)'); ctx.fillStyle = g; ctx.fillRect(x - 60, PH - 100, 120, 120); } }
  if (b.weather.includes('rays')) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const x0 = ((k * 110 - camX * .1) % (VW + 200) + VW + 200) % (VW + 200) - 100, a = .05 + .03 * S(t * .01 + k); const g = ctx.createLinearGradient(x0, 0, x0 + 60, PH); g.addColorStop(0, G.alpha('#fff1c0', a)); g.addColorStop(1, G.alpha('#fff1c0', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 26, 0); ctx.lineTo(x0 + 110, PH); ctx.lineTo(x0 + 50, PH); ctx.fill(); } ctx.restore(); }
  if (W.flash > .02 && !(G.prefs && G.prefs.calm)) { ctx.fillStyle = G.alpha(b.idx === 11 ? '#ff8a3a' : '#e8e8ff', W.flash * .5); ctx.fillRect(0, 0, VW, PH); }
};

/* ---------- lighting ---------- */
const L = G.light = {};
L.init = () => { [L.c, L.x] = G.mk(G.VW, G.PH); };
L.begin = (col, a) => { const x = L.x; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, G.VW, G.PH); x.fillStyle = G.alpha(col, a); x.fillRect(0, 0, G.VW, G.PH); x.globalCompositeOperation = 'destination-out'; L.on = a > 0; };
L.add = (sx, sy, r, s = 1) => { if (!L.on || sx < -r || sy < -r || sx > G.VW + r || sy > G.PH + r) return; const x = L.x, g = x.createRadialGradient(sx, sy, 0, sx, sy, r); g.addColorStop(0, `rgba(0,0,0,${s})`); g.addColorStop(.6, `rgba(0,0,0,${s * .5})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(sx - r, sy - r, r * 2, r * 2); };
L.end = ctx => { if (L.on) ctx.drawImage(L.c, 0, 0); };
G.glow = (ctx, x, y, r, col, a = .5) => { if (x < -r || y < -r || x > G.VW + r || y > G.PH + r) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, G.alpha(col, a)); g.addColorStop(1, G.alpha(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };

/* ---------- particles (world space) ---------- */
const FX = G.fx = { list: [] };
FX.reset = () => { FX.list = []; };
FX.add = o => { if (FX.list.length > 600) FX.list.shift(); FX.list.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 30, max: o.life || 30, s: 1, c: '#fff', k: 'px', drag: .98 }, o)); };
FX.burst = (x, y, c, n = 10, sp = 2, o = {}) => { for (let i = 0; i < n; i++) { const a = Math.random() * PI * 2, s = Math.random() * sp; FX.add(Object.assign({ x, y, vx: Co(a) * s, vy: S(a) * s - .4, g: .06, life: 18 + Math.random() * 22, c }, o)); } };
FX.ring = (x, y, c, r = 24, life = 18) => FX.add({ k: 'ring', x, y, c, r, life, max: life });
FX.slash = (x, y, ang, dir, c = '#fff6d8') => FX.add({ k: 'arc', x, y, a: ang, dir, c, life: 8, max: 8 });
FX.text = (x, y, txt, c = '#f2c14e') => FX.add({ k: 'txt', x, y, txt, c, vy: -.5, life: 50, max: 50, drag: 1 });
FX.update = () => { for (const p of FX.list) { p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx; p.y += p.vy; p.life--; } FX.list = FX.list.filter(p => p.life > 0); };
FX.draw = (ctx, cx, cy) => {
  for (const p of FX.list) {
    const a = Math.min(1, p.life / (p.max * .5)), x = p.x - cx, y = p.y - cy;
    if (p.k === 'px') { ctx.fillStyle = G.alpha(p.c, a); ctx.fillRect(Math.round(x), Math.round(y), p.s, p.s); }
    else if (p.k === 'glow') { G.glow(ctx, x, y, p.s * 4, p.c, a * .6); ctx.fillStyle = G.alpha('#ffffff', a); ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    else if (p.k === 'ring') { const rr = p.r * (1 - p.life / p.max); ctx.strokeStyle = G.alpha(p.c, a); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, rr, 0, PI * 2); ctx.stroke(); }
    else if (p.k === 'arc') { const pr = 1 - p.life / p.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = G.alpha(p.c, a); ctx.lineWidth = 3 - pr * 2; ctx.beginPath(); const a0 = p.dir > 0 ? -1.3 + p.a : PI + 1.3 - p.a; ctx.arc(x, y, 14 + pr * 6, p.dir > 0 ? a0 : a0 - 2.4, p.dir > 0 ? a0 + 2.4 : a0); ctx.stroke(); ctx.restore(); }
    else if (p.k === 'txt') { G.textQueue && G.textQueue.push({ x, y, txt: p.txt, c: p.c, a }); }
  }
};
})();

/* short heaven label for tight spaces: level 1 is the earth, levels 2–13 are the twelve heavens */
G.heavenShort = n => n === 1 ? 'Papatūānuku' : 'Rangi ' + (n - 1);
