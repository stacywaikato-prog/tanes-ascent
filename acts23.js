/* Tāne's Ascent — Acts 2 and 3 and the finale, hand-built
   Act 2 (the spirit)      Rangi 5 the still pool and its reflection · Rangi 6 turning the moon and the tide
                           Rangi 7 paths of stars made by light · Rangi 8 aurora ribbons, then the aurora torn
   Act 3 (the ancestors)   Rangi 9 Whiro takes the light; the birds bring it back · Rangi 10 the breaking heaven
                           Rangi 11 the ancestors rise at fallen pou · Rangi 12 escape from Whiro's rising darkness
   Finale                  Toi-o-ngā-Rangi's quiet approach · the final push · the journey home
   Codes: I real-only stone · i reflection-only stone · O still pool (dive) · A vision (Rangi 5) / fallen pou (Rangi 11)
   N the last fallen pou · M moon stone · L low-tide rock · U high-tide platform · R aurora ribbon · % crumbling stone
   F the heaven breaks · B the birds return · ! ? + * carved signs 14–17 */
(() => {
const G = window.G, W = G.World, T = 16;
const prev = { genChar: W.genChar, update: W.heavenUpdate, back: W.heavenBack, front: W.heavenFront, hit: W.hitHeaven };

W.SIGNS[14] = 'Throw {light} into the dark. It leaves a path of stars.';
W.SIGNS[15] = 'Step into the still pool to see this heaven as it once was.';
W.SIGNS[16] = 'Strike a moon stone to turn the moon. The tide follows it.';
W.SIGNS[17] = 'Leap into an aurora ribbon and it will carry you.';

G.BIOMES[5].enemies = ['liz'];              // the still heaven: no creatures are placed in it
G.BIOMES[12].boss = null;                   // the summit is an escape, not a guardian fight
G.BIOMES[13].enemies = ['warrior'];

const D = '....................';
/* ---------------- Rangi 5: The Celestial Forest ---------------- */
const r5Enter = { id: 'r5-enter', r: [D, '..............I.....', '..............I.....', '..............I.....', '..............I.....', '..............I.....', '..............I.....',
  '..............I.....', '..............I.....', '..............I.....', '..............I.....', '...?...O......I.....', '####################', '####################'] };
const r5Vision = { id: 'r5-vision', r: [D, D, D, D, D, D, D, D, D, D, D,
  '..A...ii..ii..ii....', '####............####', '####............####'] };
const r5Back = { id: 'r5-back', r: [D, '..............i.....', '..............i.....', '..............i.....', '..............i.....', '..............i.....', '..............i.....',
  '..............i.....', '..............i.....', '..............i.....', '..............i.....', '......O.......i.....', '####################', '####################'] };
const r5Rest = { id: 'r5-rest', r: [D, D, D, D, D, '..c.................', '.####...............', D, D, '.........m..........', D, D, '####################', '####################'] };

/* ---------------- Rangi 6: The Moon Heaven ---------------- */
const r6Low = { id: 'r6-low', r: [D, D, D, D, D, D, D, D, D, D, D,
  '..+...LL..LL..LL....', '####............####', '####............####'] };
const r6High = { id: 'r6-high', r: [D, D, D, '..............######', '..............######', '..............######',
  '........UUU...######', '..............######', '..............######', '....UUU.......######', '..............######', '.M............######', '####################', '####################'] };
const r6Gate = { id: 'r6-gate', r: [D, '.........U..........', '.........U..........', '.........U..........', '.........U..........', '.........U..........', '.........U..........',
  '.........U..........', '.........U..........', '.........U..........', '.........U..........', '..M......U...e......', '####################', '####################'] };

/* ---------------- Rangi 7: The Star Pathways ---------------- */
const r7Void1 = { id: 'r7-void1', r: [D, D, D, D, D, D, D, D, D, D, '..m.................',
  '.!..................', '####..............##', '####..............##'] };
const r7Void2 = { id: 'r7-void2', r: [D, D, D, D, D, D, D, D, '..m.................',
  '####................', '####................', '####................', '####............####', '####............####'] };
const r7Void3 = { id: 'r7-void3', r: [D, D, D, D, D, D, '..........b.........', D, D, '.m..................',
  D, D, '###.............####', '###.............####'] };

/* ---------------- Rangi 8: The Aurora Realm ---------------- */
const r8Rib1 = { id: 'r8-rib1', r: [D, D, D, D, D, D, D, D, D, '...R................',
  D, '.*..................', '###..............###', '###..............###'] };
const r8Rib2 = { id: 'r8-rib2', r: [D, D, D, D, D, D, '..........R.........', D, D, '..R.................',
  D, D, '##..................', '##..................'] };
const r8Land = { id: 'r8-land', r: [D, D, D, D, D, D, D, D, D, D, D,
  '.............e......', '.....###############', '.....###############'] };

/* ---------------- Rangi 9: Whiro's Grip ---------------- */
const r9Birds = { id: 'r9-birds', r: [D, D, D, D, D, D, D, D, D, D, D,
  '.........B..........', '####################', '####################'] };

/* ---------------- Rangi 10: The Broken Heavens ---------------- */
const r10Crumble = { id: 'r10-crumble', r: [D, D, D, D, D, D, D, D, D, D, D,
  '...%%..%%..%%..%%...', '###..............###', '###..............###'] };
const r10Bridge = { id: 'r10-bridge', r: [D, D, D, D, D, D, D, D, D, D, D,
  '..P............w....', '###.........########', '###.........########'] };
const r10Fall = { id: 'r10-fall', r: [D, D, D, '............F....H..', '......%%%%%%%%%%%H##', '....##...........H.#', '....##...........H.#',
  '.................H.#', '.................H.#', '.###.............H.#', '.................H.#', '.................H.#', '####################', '####################'] };
const r10Crumble2 = { id: 'r10-crumble2', r: [D, D, D, D, D, D, D, '.........e..........', '......%%%%%%........', D, D,
  '....................', '#####..........#####', '#####..........#####'] };

/* ---------------- Rangi 11: The War of Light and Darkness ---------------- */
const r11Field = { id: 'r11-field', r: [D, D, D, D, D, D, D, D, D, D, D,
  '..A.....e....w...e..', '####################', '####################'] };
const r11Field2 = { id: 'r11-field2', r: [D, D, D, D, D, D, D, '.......===..........', D, D, D,
  '...A...w.....e...w..', '####################', '####################'] };
const r11Rally = { id: 'r11-rally', r: [D, D, D, D, D, D, D, D, D, D, D,
  '...N....w...e...w...', '####################', '####################'] };

/* ---------------- Rangi 12: The Golden Summit (escape) ---------------- */
const r12Stairs = { id: 'r12-stairs', r: [D, D, '...............#####', '...............#####', '...........====#####', '...............#####', '...............#####',
  '......====.....#####', '...............#####', '...............#####', '..====.........#####', '...............#####', '####################', '####################'] };
const r12Vine = { id: 'r12-vine', r: [D, D, '..............######', '..............######', '..............######', '..............######', '.............S######',
  '.........###########', '.........###########', '.........###########', '.........###########', '........S###########', '####################', '####################'] };
const r12Column = { id: 'r12-column', r: [D, '..............######', '..............######', '...........==.######', '..............######', '.......==.....######', '..............######',
  '...==.........######', '..............######', '.......==.....######', '..............######', '...==.........######', '####################', '####################'] };
const r12Top = { id: 'r12-top', r: [D, D, D, D, D, D, D, D, D, D, D, D, '####################', '####################'] };

/* ---------------- Toi-o-ngā-Rangi: the quiet approach ---------------- */
const toiWalk = { id: 'toi-walk', r: [D, D, D, D, D, D, D, D, D, D, D, D, '####################', '####################'] };

Object.assign(W.AUTHORED, {
  5: [r5Enter, r5Vision, r5Back, 'set5', r5Rest],
  6: [r6Low, r6High, r6Gate, 'set6'],
  7: [r7Void1, r7Void2, 'set7', r7Void3],
  8: [r8Rib1, r8Rib2, r8Land, 'set8'],
  9: ['hall', 'ambush', 'tunnel', r9Birds, 'set9', 'duel'],
  10: [r10Crumble, r10Bridge, r10Fall, 'set10', r10Crumble2],
  11: [r11Field, r11Field2, 'set11', r11Rally],
  12: [r12Stairs, r12Vine, r12Column, r12Stairs, r12Top],
  13: [toiWalk, toiWalk]
});

/* ---------------- tiles ---------------- */
W.solidX = v => { const L = W.L; if (!L) return false;
  if (v === 9) return !!L.mirror; if (v === 10) return !L.mirror; if (v === 11) return L.phase === 1; if (v === 12) return !L.phase; return v === 13 || v === 14; };
const ghost = (ctx, x, y, col) => { ctx.strokeStyle = col; ctx.globalAlpha = .35; ctx.strokeRect(x + .5, y + .5, T - 1, T - 1); ctx.globalAlpha = 1; };
W.drawTileMore = (ctx, x, y, tx, ty, t, v) => {
  const L = W.L, on = W.solidX(v);
  if (v === 9 || v === 10) { if (on) { ctx.fillStyle = v === 9 ? '#8a7ad8' : '#d8a83a'; ctx.fillRect(x, y, T, T); ctx.fillStyle = v === 9 ? '#c8b8ff' : '#ffe08a'; ctx.fillRect(x, y, T, 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y + T - 3, T, 3); } else ghost(ctx, x, y, v === 9 ? '#c8b8ff' : '#ffe08a'); }
  else if (v === 11 || v === 12) { if (on) { ctx.fillStyle = v === 11 ? '#a8b8d8' : '#3a4258'; ctx.fillRect(x, y + (v === 11 ? 0 : 2), T, v === 11 ? 6 : 14); ctx.fillStyle = v === 11 ? '#e8f0ff' : '#5a6a8a'; ctx.fillRect(x, y + (v === 11 ? 0 : 2), T, 2); } else ghost(ctx, x, y + (v === 11 ? 0 : 4), '#a8b8d8'); }
  else if (v === 13) { ctx.fillStyle = '#7a7066'; ctx.fillRect(x, y, T, T); ctx.fillStyle = '#c8beb0'; ctx.fillRect(x, y, T, 2); ctx.strokeStyle = '#3a3430'; ctx.beginPath(); ctx.moveTo(x + 3, y + 2); ctx.lineTo(x + 8, y + 9); ctx.lineTo(x + 6, y + 15); ctx.moveTo(x + 8, y + 9); ctx.lineTo(x + 13, y + 11); ctx.stroke();
    const k = L.crumble && L.crumble[tx + ',' + ty]; if (k) { ctx.fillStyle = `rgba(255,255,255,${.15 + .2 * Math.sin(t)})`; ctx.fillRect(x, y, T, T); } }
  else if (v === 14) { const s = L.stars && L.stars[tx + ',' + ty], a = s ? Math.min(1, s / 40) : 1; ctx.globalAlpha = a; ctx.fillStyle = '#c8b8ff'; ctx.fillRect(x + 1, y, T - 2, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 6, y, 3, 2); ctx.globalAlpha = 1; G.glow(ctx, x + 8, y + 1, 10, '#c8b8ff', .45 * a); }
};

/* ---------------- chunk codes ---------------- */
W.genChar = (ch, c) => {
  prev.genChar && prev.genChar(ch, c);
  const { L, g, X, Y, wx, wy, n } = c;
  const tall = v => { g[Y][X] = v; if (c.ry <= 1) for (let y = Y - 1; y >= Math.max(0, Y - 10); y--) g[y][X] = v; };
  switch (ch) {
    case 'I': tall(10); break;
    case 'i': tall(9); break;
    case 'O': (L.pools = L.pools || []).push({ x: wx, y: wy + 8, w: T, h: 8 }); break;
    case 'A': if (n === 11) (L.fallen = L.fallen || []).push({ x: wx, y: wy, raised: false }); else L.vision = { x: wx, y: wy, seen: false }; break;
    case 'N': (L.fallen = L.fallen || []).push({ x: wx, y: wy, raised: false, last: true }); break;
    case 'M': (L.moons = L.moons || []).push({ x: wx + 2, y: wy + 2, w: 12, h: 12, cd: 0 }); break;
    case 'L': g[Y][X] = 12; break;
    case 'U': tall(11); break;
    case 'R': (L.ribbons = L.ribbons || []).push({ x: wx, y: wy - 4, w: 12 * T, h: 24 }); break;
    case '%': g[Y][X] = 13; break;
    case 'F': L.fallX = wx; break;
    case 'B': L.birdsX = wx; break;
    case '!': L.signs.push({ x: wx + 1, y: wy, i: 14 }); break;
    case '?': L.signs.push({ x: wx + 1, y: wy, i: 15 }); break;
    case '+': L.signs.push({ x: wx + 1, y: wy, i: 16 }); break;
    case '*': L.signs.push({ x: wx + 1, y: wy, i: 17 }); break;
  }
};

/* ---------------- hits: moon stones ---------------- */
W.hitHeaven = (box, o) => {
  prev.hit && prev.hit(box, o);
  const L = W.L; if (!L.moons || !o || !(o.melee || o.proj)) return;
  for (const m of L.moons) if (m.cd <= 0 && G.hit(box, m)) { m.cd = 30; turnMoon(L); }
};
function turnMoon(L) {
  L.phase = L.phase ? 0 : 1; G.audio.sfx('lightmote', 1, { p: L.phase ? 1.2 : .8 }); G.audio.sfx('beam', .5); G.shake(2);
  G.toast(L.phase ? 'The moon waxes full' : 'The moon wanes', L.phase ? 'The tide rises and lifts the floating stones.' : 'The tide falls and the rocks return.');
  unstick(); if (!G.S.moonOnce) G.S.moonOnce = true;
}
function unstick() { const P = W.P; for (let k = 0; k < 4 && (W.solid(P.x + 2, P.y + P.h - 2) || W.solid(P.x + P.w - 2, P.y + P.h - 2) || W.solid(P.x + 5, P.y + 4)); k++) P.y -= T; }

/* ---------------- Rangi 7: light leaves a path of stars ---------------- */
W.onBolt = bl => {
  const L = W.L; if (!L || L.n !== 7) return;
  const X = Math.floor((bl.x + bl.w / 2) / T), Y = Math.floor((bl.y + 14) / T);
  if (L.g[Y] && L.g[Y][X] === 0) { L.g[Y][X] = 14; (L.stars = L.stars || {})[X + ',' + Y] = 260; G.fx.add({ x: X * T + 8, y: Y * T, c: '#c8b8ff', k: 'glow', s: 1, life: 20, g: 0 }); }
};

/* ---------------- per frame ---------------- */
const prog = (L, P) => { const x1 = L.arena ? L.arena.x0 : L.gate.x; return (P.x - L.start.x) / Math.max(1, x1 - L.start.x); };
const H = () => G.input.held;
W.heavenUpdate = t => {
  prev.update && prev.update(t);
  const L = W.L, P = W.P; if (!L || !P) return;
  if (L.n !== 9) { W.noLight = false; W.lightMul = 1; W.extraDark = 0; }
  if (P.lock > 0) { P.lock--; Object.keys(H()).forEach(k => H()[k] = 0); P.vx *= .8; }
  // Rangi 5: the still pool and the reflection
  if (L.pools) { L.poolCd = Math.max(0, (L.poolCd || 0) - 1);
    for (const pl of L.pools) if (!L.poolCd && P.on && G.hit(P, pl)) { L.mirror = !L.mirror; L.poolCd = 70; unstick(); G.audio.sfx('water', .8); G.audio.sfx('lightmote', .7, { p: L.mirror ? .7 : 1.3 }); G.fx.ring(P.x + 5, P.y + P.h, '#c8b8ff', 26); if (!G.S.mirrorOnce) { G.S.mirrorOnce = true; G.toast('The reflection', 'This heaven, as it was. Step in the pool again to return.'); } } }
  if (L.vision && L.mirror && !L.vision.seen && Math.abs(P.x - L.vision.x) < 50) { L.vision.seen = true; L.vision.t = 0; P.lock = 170; G.audio.duck(.2, 3, 2); G.audio.sfx('treasure', .6); G.toast('Ranginui and Papatūānuku', 'In the reflection they are still together.'); }
  if (L.vision && L.vision.seen) L.vision.t++;
  // Rangi 6: moon stones cool down
  if (L.moons) for (const m of L.moons) if (m.cd > 0) m.cd--;
  if (L.n === 6) L.tide = (L.tide || 0) + ((L.phase ? 1 : 0) - (L.tide || 0)) * .04;
  // Rangi 7: stars fade
  if (L.stars) for (const k in L.stars) { if (--L.stars[k] <= 0) { const [X, Y] = k.split(',').map(Number); if (L.g[Y][X] === 14) L.g[Y][X] = 0; delete L.stars[k]; } }
  if (L.n === 7) L.dimX = Math.max(L.dimX || 0, P.x - 140);
  // Rangi 8: riding the aurora
  if (L.ribbons) {
    if (L.ride) { const rb = L.ride; P.st = 'dash'; P.stT = 3; P.face = 1; P.y += ((rb.y + 4) - P.y) * .2; P.dashed = false; P.dj = false;
      if (P.x > rb.x + rb.w) { L.ride = null; P.st = 'normal'; P.vx = 3; P.vy = -2; } }
    else if (!P.on) for (const rb of L.ribbons) if (G.hit(P, rb) && P.x < rb.x + rb.w - 20) { L.ride = rb; G.audio.sfx('dash'); G.audio.sfx('lightmote', .6, { p: 1.4 }); if (!G.S.ribbonOnce) { G.S.ribbonOnce = true; G.toast('The aurora carries you', ''); } break; }
  }
  if (L.n === 8 && !L.torn && prog(L, P) > .86) { L.torn = 1; G.weather.flash = .8; G.audio.sfx('roar', .6); G.shake(5); G.toast('Darkness tears through the aurora', 'Whiro has reached the heavens.'); }
  if (L.torn) L.torn = Math.min(120, L.torn + 1);
  // Rangi 9: Whiro takes the light; the birds bring it back
  if (L.n === 9 && !G.Boss.active) {
    if (!G.S.r9lit && L.birdsX !== undefined && P.x > L.birdsX + 30 && !L.birdsT) G.S.r9lit = true;
    if (G.S.r9lit) { W.noLight = false; W.lightMul = 1.2; W.extraDark = 0; }
    else {
      if (!L.whiroT && P.x > L.start.x + 90 && (L.birdsX === undefined || P.x < L.birdsX - 60)) { L.whiroT = 1; P.lock = 200; G.audio.sfx('roar', .8); G.audio.duck(.3, 3, 2); }
      if (L.whiroT) { L.whiroT++; if (L.whiroT === 140) { W.noLight = true; G.audio.sfx('pdeath', .5); G.shake(6); G.toast('Whiro takes the light', '“Stay in the dark, little brother.” He leaves Tāne alive.'); } }
      if (L.whiroT > 140) { W.noLight = true; W.lightMul = .3; W.extraDark = .32; }
      if (L.birdsX !== undefined && P.x > L.birdsX - 20 && !L.birdsT) { L.birdsT = 1; P.lock = 160; G.audio.sfx('feather'); }
      if (L.birdsT) { L.birdsT++; if (L.birdsT === 120) { G.S.r9lit = true; W.noLight = false; G.audio.sfx('power'); G.audio.sfx('treasure'); G.weather.flash = .5; G.toast('The birds bring back the light', 'The kererū Tāne freed returns with the forest birds.'); } }
    }
  }
  // Rangi 10: stone crumbles after Tāne leaves it; the heaven breaks
  if (L.n === 10) {
    L.crumble = L.crumble || {}; const fx = Math.floor((P.x + 5) / T), fy = Math.floor((P.y + P.h + 2) / T);
    if (P.on && L.g[fy] && L.g[fy][fx] === 13) { const k = fx + ',' + fy; if (!L.crumble[k]) L.crumble[k] = -1; }
    for (const k in L.crumble) { const [X, Y] = k.split(',').map(Number); const under = P.on && X === fx && Y === fy;
      if (L.crumble[k] === -1 && !under) L.crumble[k] = 22; else if (L.crumble[k] > 0 && --L.crumble[k] === 0) { if (L.g[Y][X] === 13) { L.g[Y][X] = 0; G.fx.burst(X * T + 8, Y * T + 8, '#a89a88', 8, 1.6); G.audio.sfx('stonehit', .4, { x: X * T }); } delete L.crumble[k]; } }
    if (L.fallX !== undefined && !L.broke && P.x > L.fallX) { L.broke = true; G.shake(8); G.audio.sfx('roar', .7); G.audio.sfx('slam'); G.toast('Whiro tears the heaven apart', 'Through the gaps, Tāne sees the heavens he has climbed.');
      for (let y = 0; y < L.H; y++) for (let x = Math.floor(L.fallX / T) - 8; x < Math.floor(L.fallX / T) + 8; x++) if (L.g[y] && L.g[y][x] === 13) { L.g[y][x] = 0; G.fx.burst(x * T + 8, y * T + 8, '#a89a88', 4, 2); } }
  }
  // Rangi 11: the ancestors rise
  if (L.fallen) {
    for (const f of L.fallen) if (!f.raised && Math.abs(P.x + 5 - (f.x + 8)) < 18 && Math.abs(P.y + P.h - (f.y + T)) < 24) {
      f.raised = true; const n = f.last ? 5 : 1; L.allies = L.allies || [];
      for (let i = 0; i < n; i++) L.allies.push({ x: f.x - i * 14, y: f.y + T - 22, vx: 0, vy: 0, face: 1, t: i * 7, hit: 0 });
      G.audio.sfx('power', f.last ? 1 : .6); G.fx.burst(f.x + 8, f.y + 8, '#fff1c0', f.last ? 40 : 18, 2.6, { k: 'glow', g: 0 });
      if (f.last) { G.weather.flash = .5; G.shake(4); G.toast('Tāne’s whakapapa rises', 'The generations of Te Pō hold back Whiro while Tāne climbs.'); }
      else G.toast('An ancestor rises', 'From Te Pō, one of Tāne’s whakapapa stands beside him.');
    }
    if (L.allies) for (const a of L.allies) allyAI(L, P, a);
  }
  // Rangi 12: Whiro's darkness rises from below
  if (L.n === 12 && G.S.mode === 'play') {
    if (L.riseY === undefined || L.riseY < P.y - 400) L.riseY = P.y + 200;
    const p = prog(L, P); L.riseT = (L.riseT || 0) + 1;
    if (p < .97 && L.riseT > 120) { L.riseY -= .18; L.riseY = Math.min(L.riseY, P.y + 125, (W.camY !== undefined ? W.camY + G.PH + 4 : 1e9)); }   // always just below the screen's foot, rising
    if (L.riseY < P.y + P.h - 6 && P.inv <= 0) { L.riseY = P.y + 200; W.hurtPlayer(999, P.x, { unblockable: true, src: 'darkness' }); }
    if (!L.escapeT) { L.escapeT = 1; G.toast('Whiro’s darkness rises', 'Climb. Do not stop.'); G.audio.sfx('roar', .5); }
  }
  // Toi-o-ngā-Rangi: the quiet approach
  if (L.n === 13 && !L.quiet) { L.quiet = true; G.audio.duck(.15, 6, 3); G.toast('Toi-o-ngā-Rangi', 'No wind. No sound. The house at the top of the heavens.'); }
};
function allyAI(L, P, a) {
  a.t++; let tgt = null, best = 170; for (const e of L.enemies) { if (e.dead) continue; const d = Math.abs(e.x - a.x); if (d < best && Math.abs(e.y - a.y) < 50) { best = d; tgt = e; } }
  const goal = tgt ? tgt.x : P.x + 24 + (a.t % 50); const dx = goal - a.x; a.face = Math.sign(dx) || a.face; a.vx = Math.abs(dx) > 12 ? a.face * 1.5 : 0;
  a.x += a.vx; a.vy = Math.min(a.vy + .3, 6); a.y += a.vy; const fy = Math.floor((a.y + 22) / T), fx = Math.floor((a.x + 5) / T);
  if (W.solid(a.x + 5, a.y + 22)) { a.y = fy * T - 22; a.vy = 0; if (W.solid(a.x + 5 + a.face * 10, a.y + 10)) a.vy = -5; }
  if (a.y > L.H * T) { a.x = P.x - 20; a.y = P.y; a.vy = 0; }
  if (tgt && best < 26 && a.t % 28 === 0) { a.hit = 8; W.hitEnemies({ x: a.face > 0 ? a.x + 6 : a.x - 20, y: a.y - 4, w: 24, h: 26 }, 2, { hit: new Set() }, { dir: a.face }); }
  if (a.hit > 0) a.hit--;
}
W.extraLights = (cx, cy) => { const L = W.L; if (!L) return; if (L.allies) for (const a of L.allies) G.light.add(a.x + 5 - cx, a.y + 10 - cy, 50, 1); if (L.n === 9 && W.noLight && W.kereru) G.light.add(W.kereru.x - cx, W.kereru.y - cy, 22, .9); };

/* ---------------- drawing ---------------- */
W.heavenBack = (ctx, cx, cy, t) => {
  prev.back && prev.back(ctx, cx, cy, t); W.camY = cy;
  const L = W.L, P = W.P; if (!L || !P) return;
  if (L.n === 5 && L.vision && L.vision.seen && L.mirror) { const a = Math.min(.8, L.vision.t / 80); ctx.save(); ctx.globalAlpha = a; const x = L.vision.x - cx - 140, y = 30;
    ctx.drawImage(G.tint(G.figure('rangi').r, '#e8dcff'), x, y, 280, 105); ctx.drawImage(G.tint(G.figure('papa').r, '#c8f0c8'), x, y + 38, 280, 105); ctx.restore(); G.glow(ctx, x + 140, y + 60, 80, '#fff1c0', .25 * a); }
  if (L.n === 10 && P.vy > 3.5 && !P.on) { const b = G.buildBiome(Math.max(1, 5 - Math.floor(P.vy))); ctx.save(); ctx.globalAlpha = Math.min(.35, (P.vy - 3.5) * .2); ctx.drawImage(b.skyC, 0, 0); ctx.restore(); }
};
W.heavenFront = (ctx, cx, cy, t) => {
  prev.front && prev.front(ctx, cx, cy, t);
  const L = W.L, P = W.P; if (!L || !P) return;
  // still pools shimmer
  if (L.pools) for (const pl of L.pools) { const x = pl.x - cx, y = pl.y - cy; ctx.fillStyle = 'rgba(200,184,255,.6)'; ctx.fillRect(x - 6, y + 6, T + 12, 2); G.glow(ctx, x + 8, y + 6, 14, '#c8b8ff', .35 + .15 * Math.sin(t * .08)); }
  if (L.mirror) { ctx.save(); ctx.globalCompositeOperation = 'hue'; ctx.fillStyle = 'rgba(120,96,220,.55)'; ctx.fillRect(0, 0, G.VW, G.PH); ctx.restore(); ctx.fillStyle = 'rgba(200,184,255,.07)'; ctx.fillRect(0, 0, G.VW, G.PH); }
  // moon stones and the tide
  if (L.moons) for (const m of L.moons) { const x = m.x - cx, y = m.y - cy; ctx.fillStyle = '#26324a'; ctx.beginPath(); ctx.arc(x + 6, y + 6, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#e8f0ff'; ctx.beginPath(); ctx.arc(x + 6, y + 6, 5, 0, 7); ctx.fill(); if (!L.phase) { ctx.fillStyle = '#26324a'; ctx.beginPath(); ctx.arc(x + 8, y + 5, 5, 0, 7); ctx.fill(); } G.glow(ctx, x + 6, y + 6, 12, '#bcd7ff', .3); }
  if (L.n === 6 && L.tide !== undefined) { const h = 14 + L.tide * 50; ctx.fillStyle = 'rgba(80,120,190,.28)'; ctx.fillRect(0, G.PH - h, G.VW, h); ctx.fillStyle = 'rgba(200,220,255,.35)'; ctx.fillRect(0, G.PH - h, G.VW, 1); }
  // stars dying behind (Rangi 7)
  if (L.n === 7 && L.dimX) { const x = L.dimX - cx; if (x > 0) { const g = ctx.createLinearGradient(0, 0, x, 0); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, x, G.PH); } }
  // aurora ribbons
  if (L.ribbons) for (const rb of L.ribbons) { const x = rb.x - cx, y = rb.y - cy; if (x > G.VW || x + rb.w < 0) continue; const cols = ['#7ae8c8', '#9ae8ff', '#c8b8ff', '#ff9ad8'];
    for (let i = 0; i < 4; i++) { ctx.fillStyle = G.alpha(cols[i], L.torn ? .2 : .45); for (let s = 0; s < rb.w; s += 4) ctx.fillRect(x + s, y + 6 + i * 3 + Math.sin(t * .08 + s * .05 + i) * 3, 4, 2); } }
  if (L.torn) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = Math.min(.8, L.torn / 120); ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, G.VW, G.PH); ctx.restore(); ctx.fillStyle = `rgba(40,10,50,${Math.min(.25, L.torn / 400)})`; ctx.fillRect(0, 0, G.VW, G.PH); }
  // Whiro in Rangi 9, and the birds
  if (L.n === 9 && L.whiroT && L.whiroT < 220 && !G.S.r9lit) { const k = Math.min(1, L.whiroT / 40) * (L.whiroT > 180 ? (220 - L.whiroT) / 40 : 1), w = G.bossSprite('whiro', Math.floor(t / 8) % 4, L.whiroT > 100 && L.whiroT < 150 ? 'c' : '');
    ctx.save(); ctx.globalAlpha = k; ctx.drawImage(w.l, P.x - cx + 40, P.y - cy - 60, 72, 90); ctx.restore(); if (L.whiroT > 110 && L.whiroT < 150) { G.glow(ctx, P.x + 5 - cx, P.y + 10 - cy, 30, '#ff3a2a', .6); } }
  if (L.n === 9 && W.noLight && W.kereru && !L.birdsT) { const k = W.kereru, a = .35 + .35 * Math.abs(Math.sin(t * .1)); G.glow(ctx, k.x - cx + 18, k.y - cy, 10, '#9ae86a', a); }
  if (L.n === 9 && L.birdsT && L.birdsT < 200) { const k = Math.min(1, L.birdsT / 110);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + t * .02, r = (1 - k) * 220 + 18, sp = G.kereruSprite(Math.floor(t / 4 + i) % 2);
      ctx.drawImage(Math.cos(a) > 0 ? sp.l : sp.r, P.x + 5 - cx + Math.cos(a) * r - 6, P.y + 8 - cy + Math.sin(a) * r * .6 - 5); }
    if (L.birdsT > 110) G.glow(ctx, P.x + 5 - cx, P.y + 10 - cy, 60, '#fff1c0', Math.max(0, 1 - (L.birdsT - 110) / 90)); }
  // Rangi 11: fallen pou and the ancestors
  if (L.fallen) for (const f of L.fallen) { const x = f.x - cx, y = f.y - cy; if (!f.raised) { ctx.save(); ctx.translate(x + 8, y + 14); ctx.rotate(-1.2); ctx.drawImage(G.pouSprite(0).r, -8, -30); ctx.restore(); G.glow(ctx, x + 8, y + 10, 14, '#fff1c0', .25 + .15 * Math.sin(t * .1)); } else ctx.drawImage(G.pouSprite(1).r, x, y + T - 36); }
  if (L.allies) for (const a of L.allies) { const sp = G.tane(a.hit > 0 ? 'atk1' : Math.abs(a.vx) > .2 ? 'run' : 'idle', a.hit > 0 ? 2 : Math.floor(a.t / 6) % (Math.abs(a.vx) > .2 ? 8 : 4)); ctx.save(); ctx.globalAlpha = .75; ctx.drawImage(G.tint(a.face > 0 ? sp.r : sp.l, '#fff1c0'), Math.round(a.x + 5 - 24 - cx), Math.round(a.y + 22 - 44 - cy)); ctx.restore(); }
  // Rangi 12: the rising darkness
  if (L.n === 12 && L.riseY !== undefined) { const y = L.riseY - cy; if (y < G.PH + 40) { const g = ctx.createLinearGradient(0, y - 30, 0, y + 20); g.addColorStop(0, 'rgba(20,4,28,0)'); g.addColorStop(1, 'rgba(12,2,18,.96)'); ctx.fillStyle = g; ctx.fillRect(0, y - 30, G.VW, 50); ctx.fillStyle = 'rgba(12,2,18,.96)'; ctx.fillRect(0, y + 20, G.VW, Math.max(0, G.PH - y)); for (let i = 0; i < 18; i++) { const x = (i * 23 + t * .7) % G.VW; G.glow(ctx, x, y + Math.sin(t * .05 + i) * 6, 8, '#7a1d9a', .4); } G.glow(ctx, G.VW * .6, y + 10, 8, '#ff3a2a', .5); G.glow(ctx, G.VW * .6 + 10, y + 10, 8, '#ff3a2a', .5); } }
};

/* ---------------- the finale: the final push, then the journey home ---------------- */
G.pushShots = grad => [{ dur: 99999, hold: true, text: 'Whiro’s darkness rises one last time. The light of every heaven Tāne climbed comes to him.', draw: (ctx, t) => {
  const C = G.Cine, k = G.clamp(C.push || 0, 0, 1); grad(ctx, '#05030a', G.mixHex('#140a1a', '#3a2a5a', k));
  for (let i = 1; i <= 12; i++) { const b = G.BIOMES[i], x0 = 12 + (i - 1) * 32, a = .25 + .55 * k; ctx.strokeStyle = G.alpha(b.sky[1] === '#0b2a24' ? '#3e7a3a' : b.sky[2], a); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, 20); ctx.lineTo(192, 112); ctx.stroke(); }
  ctx.lineWidth = 1; G.glow(ctx, 192, 112, 30 + k * 60, '#ffffff', .5 + .4 * k);
  const dy = 120 + k * 60; ctx.fillStyle = 'rgba(12,2,18,.95)'; ctx.fillRect(0, dy, 384, 200); for (let i = 0; i < 16; i++) G.glow(ctx, (i * 26 + t) % 384, dy + Math.sin(t * .05 + i) * 5, 10, '#7a1d9a', .5);
  const sp = G.tane('burst', 0); ctx.drawImage(sp.r, 168, 90); } }];
const HOME = { 12: 'Down through the golden summit, its gates open.', 11: 'Across the battlefield, now quiet. The ancestors raise their hands.', 10: 'Through the broken heaven, whole again.', 9: 'Through Whiro’s heaven, where the black vines have flowered.',
  8: 'The aurora, mended, ripples overhead.', 7: 'Every star along the paths is lit.', 6: 'The moon guardian lights the way down.', 5: 'The still pool. In it, Tāne sees only the world ahead.',
  4: 'The storm parts to let him pass. A truce, not forgiveness.', 3: 'Ngārara sleeps in the clouds.', 2: 'The great tree is full of birds.', 1: 'Rain falls softly on a green forest. Rangi’s grief has become growth.' };
G.homeShots = vignette => Object.keys(HOME).map(Number).sort((a, b) => b - a).map(n => ({ dur: 130, title: n === 13 ? '' : G.BIOMES[n].name.toUpperCase(), titleSize: 9,
  text: HOME[n] + (G.S.lore && G.S.lore.includes(n) ? ' The carving he found there glows as he passes.' : ''), draw: (ctx, t) => { vignette(ctx, n, t * 3, n * 60); } }));
})();
