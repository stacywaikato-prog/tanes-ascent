/* Tāne's Ascent — levels, movement, combat, creatures, collectibles */
(() => {
const G = window.G, T = 16, PI = Math.PI;
const W = G.World = {};

/* ================= LEVEL TEMPLATES (20×14, floor at row 12 on the left) ================= */
const TPL = [
  { id: 'meadow', r: [
    '....................', '....................', '....................', '....................', '....................', '....................',
    '.........mmm........', '........=====.......', '....................', '....................', '.....b..............', '..e.........e.......',
    '####################', '####################'] },
  { id: 'gap', r: [
    '....................', '....................', '....................', '....................', '....................', '....................',
    '.........mm.........', '....................', '....................', '........====........', '....................', '..e..............e..',
    '######........######', '######........######'] },
  { id: 'steps', r: [
    '....................', '....................', '....................', '...............f....', '....................', '..............e.....',
    '............########', '............########', '.......m....########', '......##############', '..m...##############', '......##############',
    '####################', '####################'] },
  { id: 'chimney', r: [
    '....................', '....................', '......#.............', '......#........m....', '......#....#########', '......#....#########',
    '......#..m.#########', '......#....#########', '......#....#########', '......#....#########', '...........#########', '..m........#########',
    '####################', '####################'] },
  { id: 'vine', r: [
    '....................', '....................', '....................', '...............f....', '..........H.........', '..........H#########',
    '..........H#########', '......m...H#########', '..........H#########', '....=====.H#########', '..........H#########', '....e.....H#########',
    '####################', '####################'] },
  { id: 'thorns', r: [
    '....................', '....................', '....................', '....................', '....................', '.........b..........',
    '........mmm.........', '....................', '....................', '.......=====........', '....................', '....................',
    '#####^^^^^^^^^^#####', '####################'] },
  { id: 'tunnel', r: [
    '....................', '....................', '....................', '....................', '....................', '....................',
    '....................', '.......m.m.m........', '....................', '...############.....', '...############.....', '.........g..........',
    '####################', '####################'] },
  { id: 'wings', dj: 1, r: [
    '....................', '....................', '....................', '....................', '....................', '...........m........',
    '....................', '..........##########', '....b.....##########', '..........##########', '..........##########', '.......Q..##########',
    '####################', '####################'] },
  { id: 'hall', r: [
    '....................', '....................', '..################..', '..################..', '......s......s......', '....................',
    '....................', '....................', '.........mm.........', '....................', '....................', '..e.......a.........',
    '####################', '####################'] },
  { id: 'alcove', r: [
    '....................', '....................', '....................', '....................', '....................', '......c.............',
    '.....#####..........', '.....#..............', '.....#.......m......', '.....#.....====.....', '....................', '..m........e........',
    '####################', '####################'] },
  { id: 'updraft', up: 1, r: [
    '....................', '....................', '....................', '....................', '....................', '....................',
    '........mmmm........', '....................', '....................', '....................', '.........b..........', '....................',
    '####uuuuuuuuuuuu####', '####............####'] },
  { id: 'ledges', r: [
    '....................', '....................', '....................', '....................', '...............m....', '....................',
    '.............#######', '.............#######', '.........====#######', '.............#######', '.....====....#######', '...........e.#######',
    '####################', '####################'] },
  { id: 'ambush', r: [
    '....................', '....................', '....................', '....................', '....................', '....................',
    '....................', '....................', '....................', '......mmm.......f...', '....................', '...a........a.......',
    '####################', '####################'] },
  { id: 'duel', r: [
    '....................', '....................', '....................', '....................', '....................', '....................',
    '.....=====..........', '....................', '.......m.......m.....'.slice(0, 20), '....................', '....................', '..........w.........',
    '####################', '####################'] },
  { id: 'ladderwell', r: [
    '....................', '....................', '....................', '....................', '..............m.....', '.............H......',
    '.......######H......', '.......#.....H......', '.......#..e..H......', '.......#######......', '....................', '..m..............e..',
    '####################', '####################'] }
];
const START = { id: 'start', r: Array(11).fill('....................').concat(['..C.................', '####################', '####################']) };
const ENDT = { id: 'end', r: Array(12).fill('....................').concat(['####################', '####################']) };
function prep(t) { t.exitRow = 12; for (let r = 0; r < 14; r++) if (t.r[r][19] === '#' || t.r[r][19] === '^') { t.exitRow = r; break; } t.rise = 12 - t.exitRow; t.w = 20; return t; }
/* Rangi 1 teaches one move per section; every heaven gets one authored glyph-gate set piece.
   Codes: D sealed gate (opens when every glyph stone k in the section is struck) · k glyph stone · G ancient glyph
   o shallow reflecting water · 1-9 carved sign with a prompt */
const TUT = [
  { id: 'tut-move', tut: 1, r: ['....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................', '.1.....2......m.....', '#########...########', '####################'] },
  { id: 'tut-ledge', tut: 1, r: ['....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................', '..............######', '..............######', '..............######', '...3..........######', '####################', '####################'] },
  { id: 'tut-vine', tut: 1, r: ['....................', '....................', '....................', '....................', '..........H.........', '..........H#########', '..........H#########', '..........H#########', '..........H#########', '..........H#########', '..........H#########', '....4.....H#########', '####################', '####################'] },
  { id: 'tut-strike', tut: 1, r: ['....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................', '..5.........e....6..', '####################', '####################'] },
  { id: 'tut-slide', tut: 1, r: ['....................', '....................', '....................', '....................', '......##########....', '......##########....', '......##########....', '......##########....', '......##########....', '......##########....', '......##########....', '..7.........m.......', '####################', '####################'] },
  { id: 'tut-light', tut: 1, r: ['....................', '....................', '....................', '....................', '....................', '....................', '...........b........', '....................', '....................', '....................', '....................', '..8.................', '####################', '####################'] }
];
const SETS = {
  1: { id: 'set1', set: 1, r: ['..............D.....', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '..9.....k.....D.G...', '###oooo#############', '####################'] },
  2: { id: 'set2', set: 1, r: ['....................', '...g................', '..===.........D.....', '..............D.....', '..............D.....', '..............D.....', '..H...k.......D.....', '..H.=====.....D.....', '..H...........D.....', '..H...........D.....', '..H...........D.....', '..H....e......D.G...', '####################', '####################'] },
  3: { id: 'set3', set: 1, r: ['....................', '....................', '..............D.....', '...g..........D.....', '..===.........D.....', '..............D.....', '..............D.....', '..............D.....', '.k............D.....', '===...........D.....', '..............D.....', '..........k...D.G...', '#####...############', '#####...############'] },
  4: { id: 'set4', set: 1, r: ['....................', '....................', '..............D.....', '.g............D.....', '===...........D.....', '.........####.D.....', '..........h...D.....', '..............D.....', '..==..........D.....', '..............D.....', '..............D.....', '........k.....D.G...', '#####^^^^^##########', '####################'] },
  5: { id: 'set5', set: 1, r: ['....................', '....................', '..............D.....', '..............D.....', '..............D.....', '...g..........D.....', '..===.........D.....', '..............D.....', '..............D.....', '......######..D.....', '......######..D.....', '.............kD.G...', '##oooo##############', '####################'] },
  6: { id: 'set6', set: 1, r: ['....................', '....................', '..............D.....', '..............D.....', '.....#####....D.....', '.......h......D.....', '..............D.....', '..............D.....', '....k.....k...D.....', '..............D.....', '..............D.....', '..............D.G...', '##oooooooooo########', '####################'] },
  7: { id: 'set7', set: 1, r: ['....................', '....................', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '.........k....D.....', '........==....D.....', '..............D.....', '.....==.......D.....', '..............D.....', '..............D.G...', '###.........########', '###.........########'] },
  8: { id: 'set8', set: 1, r: ['..............D.....', '...k..........D.....', '..===.........D.....', '..............D.....', '..............D.....', '......H.......D.....', '......H.......D.....', '......H.......D.....', '......H.......D.....', '......H.......D.....', '......H.......D.....', '......H...k...D.G...', '####################', '####################'] },
  9: { id: 'set9', set: 1, r: ['....................', '....................', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '.....g........D.....', '...=====......D.....', '..............D.....', '..............D.....', '..............D.....', '..a.....k..w..D.G...', '####^^##############', '####################'] },
  10: { id: 'set10', set: 1, r: ['....................', '....................', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '.k............D.....', '===...........D.....', '..............D.....', '..............D.....', '.......==.....D.....', '..............D.G...', '#####......#########', '#####......#########'] },
  11: { id: 'set11', set: 1, r: ['....................', '....................', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '..............D.....', '.....k........D.....', '....===.......D.....', '..............D.....', '..............D.....', '..e.......k...D.G...', '####################', '####################'] },
  12: { id: 'set12', set: 1, r: ['....................', '....................', '..............D.....', '..k...........D.....', '.===..........D.....', '..............D.....', '..............D.....', '........k.....D.....', '......=====...D.....', '..............D.....', '..............D.....', '...........k..D.G...', '####################', '####################'] }
};
TPL.forEach(prep); prep(START); prep(ENDT); TUT.forEach(prep); Object.values(SETS).forEach(prep);
W.SIGNS = {
  1: '{move} to walk. Hold it to run.',
  2: '{jump} to jump. Hold it longer to jump higher.',
  3: 'Jump into a ledge to grab it. Press {up} to climb.',
  4: 'Press {up} on a vine to climb it.',
  5: '{attack} strikes with the taiaha. Press it three times for a combo.',
  6: '{roll} rolls. You cannot be hurt mid-roll.',
  7: 'Hold {down} to crouch. Run, then {down} to slide under.',
  8: '{light} throws light. It uses mana, your light and strength. Hold to charge.',
  9: 'Strike the carved stone to open the gate.',
  10: 'Too high for one jump. {jump}, then {jump} again before you start to fall.'
};
W.TPL = TPL;
W.chunkById = id => TPL.find(t => t.id === id) || TUT.find(t => t.id === id) || Object.values(SETS).find(t => t.id === id);

const CAT = { ground: ['liz', 'lizC', 'weta', 'guard', 'guardC', 'warrior', 'beast'], fly: ['bird', 'mos', 'spirit'], hang: ['spider', 'spiderC', 'horror'], amb: ['stalk'], heavy: ['warrior', 'guard', 'guardC'] };
const ABIL_AT = { 2: 'wings', 3: 'dash', 5: 'shield', 6: 'burst', 9: 'spear' };
W.ABIL_AT = ABIL_AT;
G.ABIL = {
  wings: { name: 'Kerer\u016b Lift', text: 'The kerer\u016b you freed lifts you. Press {jump} again in mid-air.' },
  dash: { name: 'Celestial Dash', text: 'The wind lifts you off the guardian. Press {roll} in mid-air to dash.' },
  shield: { name: 'Forest Shield', text: 'Papatūānuku wraps you in the forest you gave her. It absorbs one blow, then regrows.' },
  burst: { name: 'Mana Burst', text: 'Your mana rises like the tide. Press {burst} (or hold {down} and press {light}) to release it.' },
  spear: { name: 'Star Spear', text: 'The light the birds carried back, made sharp. Hold {light} to charge a spear that pierces every foe.' }
};

/* ================= LEVEL GENERATION ================= */
W.gen = (n, S) => {
  const b = G.buildBiome(n), r = G.rng(n * 7717 + 3), has = a => S.ab.includes(a);
  const pool = TPL.filter(t => (!t.dj || has('wings')) && (!t.up || b.updraft));
  const count = n === 13 ? 3 : 5 + Math.floor(n * .55);
  const seq = [START];
  const must = [TPL.find(t => t.id === 'alcove'), TPL.find(t => t.id === 'tunnel')];
  if (b.updraft) must.push(TPL.find(t => t.id === 'updraft'));
  const body = [];
  for (let i = 0; i < (n === 1 ? 3 : count); i++) body.push(pool[Math.floor(r() * pool.length)]);
  const slots = body.map((_, i) => i).sort(() => r() - .5); must.forEach((m, i) => body[slots[i % slots.length]] = m);
  if (SETS[n]) body.splice(n === 1 ? 0 : Math.floor(body.length / 2), 0, SETS[n]);
  const auth = W.AUTHORED && W.AUTHORED[n];
  if (auth) seq.push(...auth.map(c => typeof c === 'string' ? W.chunkById(c) : prep(c)));   // hand-built heaven
  else { if (n === 1) seq.push(...TUT); seq.push(...body); }
  const arena = b.boss || n === 13;
  if (arena) seq.push(null); else seq.push(ENDT);
  const AW = n === 13 ? 36 : 30;
  const rises = seq.map(t => t ? t.rise : 0), total = rises.reduce((a, c) => a + c, 0);
  const H = total + 14 + 10, Wc = seq.reduce((a, t) => a + (t ? 20 : AW), 0) + 2;
  const g = []; for (let y = 0; y < H; y++) g.push(new Uint8Array(Wc));
  const L = { n, b, W: Wc, H, g, items: [], enemies: [], decor: [], pous: [], updrafts: [], shrine: null, gate: null, arena: null, bolts: [], shots: [], signs: [], switches: [], doors: {}, secrets: [] };
  let base = H - 2, cx = 0, idx = 0;
  const putItem = (k, x, y, pid) => L.items.push({ k, x, y, w: 12, h: 12, id: pid, ph: r() * 6 });
  L.seq = seq.map(t => t ? t.id : 'arena');
  seq.forEach((t, si) => {
    if (!t) { // boss arena
      const top = base - 12;
      for (let x = 0; x < AW; x++) for (let y = base; y < H; y++) g[y][cx + x] = 1;
      for (let y = top - 6; y < base; y++) { g[y][cx + AW - 1] = 5; }
      L.arena = { x0: cx * T, x1: (cx + AW) * T, floor: base * T, top: (top - 6) * T, col0: cx, col1: cx + AW - 1, rows: [top - 6, base] };
      L.gate = { x: (cx + AW - 4) * T, y: base * T, open: false };
      cx += AW; return;
    }
    const top = base - 12;
    for (let ry = 0; ry < 14; ry++) for (let rx = 0; rx < 20; rx++) {
      const ch = t.r[ry][rx], X = cx + rx, Y = top + ry; if (Y < 0 || Y >= H) continue;
      const wx = X * T, wy = Y * T, pid = n + ':' + X + ':' + Y;
      switch (ch) {
        case '#': g[Y][X] = 1; break; case '=': g[Y][X] = 2; break; case '^': g[Y][X] = 3; break; case 'H': g[Y][X] = 4; break;
        case 'D': g[Y][X] = 6; (L.doors[si] = L.doors[si] || []).push([X, Y]); break;
        case 'o': g[Y][X] = 7; break;
        case 'k': L.switches.push({ x: wx + 2, y: wy + 2, w: 12, h: 12, g: si, on: false, t: 0 }); break;
        case 'G': putItem('glyph', wx + 2, wy + 2, 'y' + pid); break;
        case 'h': { let yy = Y - 1; while (yy > 0 && yy > Y - 9 && !g[yy][X]) yy--; L.enemies.push(W.mkEnemy('horror', wx, wy, n, g[yy] && g[yy][X] ? (yy + 1) * T : wy - 40)); break; }
        case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': L.signs.push({ x: wx + 1, y: wy, i: +ch }); break;
        case 'Q': L.signs.push({ x: wx + 1, y: wy, i: 10 }); break;
        case 'u': L.updrafts.push({ x: wx, y: (Y - 9) * T, w: T, h: 11 * T }); break;
        case 'm': putItem('mana', wx + 2, wy + 2); break;
        case 'f': if (r() < .7) putItem('feather', wx + 2, wy + 2, 'f' + pid); else putItem('mana', wx + 2, wy + 2); break;
        case 'g': putItem('relic', wx + 2, wy + 4, 'g' + pid); break;
        case 'c': putItem('carving', wx + 2, wy + 2, 'c' + n); break;
        case 'C': L.pous.push({ x: wx, y: wy + T - 36 + T, id: 'p' + pid, lit: false }); break;
        default: if (ch !== '.' && W.genChar) W.genChar(ch, { L, g, X, Y, wx, wy, n, si, putItem, T, ry }); break;
        case 'e': case 'b': case 's': case 'a': case 'w': {
          if (si === 0) break;
          const cat = { e: 'ground', b: 'fly', s: 'hang', a: 'amb', w: 'heavy' }[ch];
          let opts = b.enemies.filter(e => CAT[cat].includes(e));
          if (!opts.length) opts = b.enemies.filter(e => CAT[cat === 'fly' || cat === 'hang' ? 'fly' : 'ground'].includes(e));
          if (!opts.length) opts = [b.enemies[0]];
          const type = opts[Math.floor(r() * opts.length)];
          if (type === 'mos') for (let k = 0; k < 3; k++) L.enemies.push(W.mkEnemy('mos', wx + k * 10, wy - k * 8, n));
          else { let anc = null; if (cat === 'hang') { let yy = Y - 1; while (yy > 0 && yy > Y - 9 && !g[yy][X]) yy--; anc = g[yy] && g[yy][X] ? (yy + 1) * T : wy - 60; } L.enemies.push(W.mkEnemy(type, wx, wy, n, anc)); }
        }
      }
      if (ry === 13 && (ch === '#' || ch === 'o')) for (let y = Y + 1; y < H; y++) g[y][X] = 1;
    }
    // sealed gates rise above the section so even Light Wings cannot clear them
    if (L.doors[si]) { const cols = [...new Set(L.doors[si].map(d => d[0]))]; for (const X of cols) { const topY = Math.min(...L.doors[si].filter(d => d[0] === X).map(d => d[1])); for (let y = topY - 1; y >= Math.max(0, top - 9); y--) { g[y][X] = 6; L.doors[si].push([X, y]); } } }
    // mid-level checkpoint
    if (si > 0 && si % 4 === 0 && t.r[12][1] === '#' && t.r[11][1] === '.') L.pous.push({ x: (cx + 1) * T, y: (top + 12) * T - 36, id: 'p' + n + ':' + si, lit: false });
    // decor
    for (let rx = 0; rx < 20; rx++) for (let ry = 1; ry < 14; ry++) if (t.r[ry][rx] === '#' && t.r[ry - 1][rx] === '.' && r() < .22) L.decor.push({ x: (cx + rx) * T, y: (top + ry) * T, v: Math.floor(r() * 3) });
    base = top + t.exitRow; cx += 20;
  });
  // pou fix: put pou on floor
  L.pous.forEach(p => { p.y = Math.round(p.y / T) * T; });
  for (const p of L.pous) { let ty = Math.floor((p.y + 20) / T); while (ty < H && !g[ty][Math.floor((p.x + 8) / T)]) ty++; p.y = ty * T - 36; }
  L.start = { x: 2 * T + 30, y: (H - 2) * T - 22 };
  if (!L.gate) { const gx = cx - 8; let ty = 0; while (ty < H && !g[ty][gx]) ty++; L.gate = { x: gx * T, y: ty * T, open: true }; }
  // ability shrine (non-boss heavens)
  const ab = ABIL_AT[n]; if (ab && !b.boss) { const sx = L.gate.x - 4 * T; let ty = 0; const col = Math.floor(sx / T); while (ty < H && !g[ty][col]) ty++; L.shrine = { x: sx, y: ty * T - 16, w: 16, h: 16, ab, taken: S.ab.includes(ab) }; }
  // updraft labelling only in updraft biomes
  if (!b.updraft) L.updrafts = [];
  L.secrets = L.items.filter(it => it.id).map(it => it.id);
  L.items = L.items.filter(it => !it.id || !S.got.includes(it.id));
  return L;
};

/* ================= ENEMIES ================= */
const STATS = {
  liz: { w: 22, h: 10, hp: 3, dmg: 12, sp: .5, pts: 100, cat: 'ground' },
  weta: { w: 16, h: 12, hp: 3, dmg: 12, sp: .4, pts: 120, cat: 'ground' },
  bird: { w: 16, h: 10, hp: 2, dmg: 12, sp: 1.1, pts: 150, cat: 'fly' },
  mos: { w: 9, h: 7, hp: 1, dmg: 8, sp: .9, pts: 60, cat: 'fly' },
  spirit: { w: 14, h: 18, hp: 4, dmg: 14, sp: .5, pts: 200, cat: 'fly' },
  spider: { w: 16, h: 12, hp: 3, dmg: 14, sp: .6, pts: 160, cat: 'hang' },
  stalk: { w: 18, h: 12, hp: 4, dmg: 16, sp: 1, pts: 220, cat: 'amb' },
  guard: { w: 18, h: 28, hp: 7, dmg: 18, sp: .3, pts: 300, cat: 'ground' },
  warrior: { w: 12, h: 26, hp: 7, dmg: 18, sp: .7, pts: 320, cat: 'ground' },
  horror: { w: 22, h: 14, hp: 5, dmg: 16, sp: .9, pts: 260, cat: 'hang' },
  beast: { w: 28, h: 16, hp: 8, dmg: 20, sp: .6, pts: 380, cat: 'ground' }
};
W.mkEnemy = (type, x, y, n, anchor) => {
  let v = ''; if (type.endsWith('C')) { type = type.slice(0, -1); v = 'c'; }
  const s = STATS[type], sc = 1 + (n - 1) * .06;
  const e = { type, v, x, y: y + T - s.h, w: s.w, h: s.h, vx: 0, vy: 0, hp: Math.max(1, Math.round(s.hp * (1 + (n - 1) * .08) * G.diff().enemyHp)), dmg: Math.round(s.dmg * sc), sp: s.sp * Math.min(1.6, sc), pts: s.pts, face: -1, t: Math.random() * 100, st: 'idle', stT: 0, flash: 0, kb: 0, on: false, hx: x, hy: y, n };
  if (type === 'spider') { e.anchor = anchor || y - 60; e.y = e.anchor + 20; e.st = 'hang'; }
  if (type === 'stalk') { e.st = 'hidden'; }
  if (type === 'horror') { e.anchor = anchor || y - 60; e.y = e.anchor; e.st = 'lurk'; }
  return e;
};

/* ================= PHYSICS ================= */
W.tile = (tx, ty) => { const L = W.L; if (tx < 0 || tx >= L.W) return 1; if (ty < 0 || ty >= L.H) return 0; return L.g[ty][tx]; };
const solidT = v => v === 1 || v === 5 || v === 6 || v === 7 || v === 8 || (v >= 9 && !!W.solidX && W.solidX(v));
W.solid = (px, py) => solidT(W.tile(Math.floor(px / T), Math.floor(py / T)));
function moveX(e) {
  e.hitW = 0; e.x += e.vx;
  const ys = [e.y + 1, e.y + e.h / 2, e.y + e.h - 1];
  if (e.vx > 0) { const R = e.x + e.w - .01; if (ys.some(y => W.solid(R, y))) { e.x = Math.floor(R / T) * T - e.w; e.vx = 0; e.hitW = 1; } }
  else if (e.vx < 0) { if (ys.some(y => W.solid(e.x, y))) { e.x = (Math.floor(e.x / T) + 1) * T; e.vx = 0; e.hitW = -1; } }
}
function moveY(e, drop) {
  const prevB = e.y + e.h; e.y += e.vy; e.on = false; e.onPlat = false;
  if (e.vy > 0) {
    const B = e.y + e.h - .01, xs = [e.x + 1, e.x + e.w - 1];
    if (xs.some(x => W.solid(x, B))) { e.y = Math.floor(B / T) * T - e.h; e.vy = 0; e.on = true; return; }
    if (!drop) for (const x of xs) { const ty = Math.floor(B / T); if (W.tile(Math.floor(x / T), ty) === 2 && prevB <= ty * T + .5) { e.y = ty * T - e.h; e.vy = 0; e.on = true; e.onPlat = true; return; } }
  } else if (e.vy < 0) {
    if (W.solid(e.x + 1, e.y) || W.solid(e.x + e.w - 1, e.y)) {
      // corner correction
      if (!W.solid(e.x + e.w - 1, e.y) || !W.solid(e.x + 1, e.y)) { const dir = W.solid(e.x + 1, e.y) ? 1 : -1; for (let k = 1; k <= 4; k++) if (!W.solid(e.x + 1 + dir * k, e.y) && !W.solid(e.x + e.w - 1 + dir * k, e.y)) { e.x += dir * k; return; } }
      e.y = (Math.floor(e.y / T) + 1) * T; e.vy = 0;
    }
  }
}
W.moveX = moveX; W.moveY = moveY;

/* ================= PLAYER ================= */
W.newPlayer = (x, y, S) => ({ x, y, w: 10, h: 22, vx: 0, vy: 0, face: 1, on: false, st: 'normal', stT: 0, coy: 0, jb: 0, inv: 0, cd: 0,
  combo: 0, comboT: 0, atk: null, atkT: 0, charge: 0, roll: 0, rollCd: 0, dashCd: 0, dj: false, dashed: false, wallDir: 0, wallLock: 0,
  hp: S.maxHp, mana: S.maxMana, shieldT: 0, anim: 0, frame: 0, pose: 'idle', landT: 0, safe: { x, y }, hurtT: 0, stepT: 0, collectT: 0, power: false, hangCool: 0 });
function setH(P, h) { if (P.h === h) return true; if (h > P.h) { const dy = h - P.h; if (W.solid(P.x + 1, P.y - dy) || W.solid(P.x + P.w - 1, P.y - dy) || W.solid(P.x + P.w / 2, P.y - dy)) return false; } P.y += P.h - h; P.h = h; return true; }
const near = (a, b) => Math.hypot(a.x + a.w / 2 - b.x - b.w / 2, a.y + a.h / 2 - b.y - b.h / 2);
W.hurtPlayer = (dmg, fromX, opts = {}) => {
  const P = W.P, S = G.S; if (P.inv > 0 || S.mode !== 'play') return false;
  if (P.st === 'roll' && P.roll > 3 && P.roll < 17) return false;
  if (S.ab.includes('shield') && P.shieldT <= 0 && !opts.unblockable) { P.shieldT = 600; P.inv = 40; G.audio.sfx('shield'); G.fx.burst(P.x + 5, P.y + 10, '#7fd36a', 16, 2.4); G.fx.ring(P.x + 5, P.y + 11, '#7fd36a', 26); return false; }
  if (P.power) dmg = Math.ceil(dmg / 3);
  dmg = Math.max(1, Math.round(dmg * G.diff().dmg)); W.lastCause = opts.src || W.curSrc || 'unknown';
  P.hp -= dmg; P.inv = 70; P.hurtT = 18; P.hurtSide = P.x + 5 < fromX ? 1 : -1; G.buzz && G.buzz(35); P.st = 'normal'; P.atk = null; P.charge = 0;
  P.vx = (P.x + 5 < fromX ? -2.4 : 2.4); P.vy = -3; G.audio.sfx('hurt'); G.audio.duck(.7, .15, .4); G.shake(3); G.hitstop(4);
  G.fx.burst(P.x + 5, P.y + 10, '#b8361f', 10, 2);
  if (P.hp <= 0) { P.hp = 0; G.onPlayerDeath(); }
  return true;
};
function respawnSafe(dmg) { const P = W.P; dmg = Math.max(1, Math.round(dmg * G.diff().dmg)); W.lastCause = dmg >= 20 ? 'fall' : 'thorns'; P.x = P.safe.x; P.y = P.safe.y; P.vx = P.vy = 0; P.st = 'normal'; P.inv = 60; P.hp -= dmg; G.audio.sfx(dmg >= 25 ? 'fall' : 'thorn'); G.audio.sfx('hurt'); G.fade = 1; if (P.hp <= 0) { P.hp = 0; G.onPlayerDeath(); } }

function tryLedge(P) {
  if (P.vy < 0 || P.on) return false;
  const dir = G.btn('right') ? 1 : G.btn('left') ? -1 : 0; if (!dir) return false;
  const hx = dir > 0 ? P.x + P.w + 1 : P.x - 1, hy = P.y + 2;
  const tx = Math.floor(hx / T), ty = Math.floor(hy / T);
  if (solidT(W.tile(tx, ty)) && !solidT(W.tile(tx, ty - 1)) && !solidT(W.tile(tx, ty - 2)) && hy - ty * T < 7) {
    P.st = 'hang'; P.vx = P.vy = 0; P.face = dir; P.y = ty * T - 1; P.x = dir > 0 ? tx * T - P.w : (tx + 1) * T; P.hangT = { tx, ty }; G.audio.sfx('grab'); return true;
  }
  return false;
}
const vineAt = P => W.tile(Math.floor((P.x + P.w / 2) / T), Math.floor((P.y + P.h / 2) / T)) === 4 || W.tile(Math.floor((P.x + P.w / 2) / T), Math.floor((P.y + P.h - 2) / T)) === 4;

W.updatePlayer = () => {
  const P = W.P, S = G.S, L = W.L, ab = a => S.ab.includes(a), b = G.btn, tp = G.tap;
  const ax = (b('left') ? -1 : 0) + (b('right') ? 1 : 0);
  if (P.inv > 0) P.inv--; if (P.cd > 0) P.cd--; if (P.rollCd > 0) P.rollCd--; if (P.hurtT > 0) P.hurtT--; if (P.comboT > 0) P.comboT--; else P.combo = 0; if (P.shieldT > 0) P.shieldT--; if (P.wallLock > 0) P.wallLock--;
  if (P.collectT > 0) { P.collectT--; P.vx *= .8; P.vy = Math.min(P.vy + .28, 6); moveX(P); moveY(P); return; }
  P.mana = Math.min(S.maxMana, P.mana + (P.power ? 1 : .04));
  const wasOn = P.on;

  /* ---- climbing ---- */
  if (P.st === 'climb') {
    P.vx = 0; P.vy = (b('down') ? 1.3 : 0) - (b('up') ? 1.3 : 0); setH(P, 22);
    P.y += P.vy; if (W.solid(P.x + 5, P.y) && P.vy < 0) P.y -= P.vy;
    if (!vineAt(P)) { if (P.vy < 0) { P.vy = -3.8; if (ax) P.vx = ax * 1.6; } P.st = 'normal'; }
    if (tp('jump')) { P.st = 'normal'; P.vy = -4.6; P.vx = ax * 2; P.dj = false; G.audio.sfx('jump', .8); }
    if (P.vy) { P.anim += .12; if ((P.climbT = (P.climbT || 0) + 1) % 14 === 0) G.audio.sfx('climb'); }
    const B = P.y + P.h; if (P.vy > 0 && W.solid(P.x + 5, B)) { P.y = Math.floor(B / T) * T - P.h; P.st = 'normal'; }
    return;
  }
  /* ---- ledge hang ---- */
  if (P.st === 'hang') {
    P.vx = P.vy = 0; P.dj = false; P.dashed = false;
    if (tp('jump') || tp('up') || b('up')) { P.st = 'climbup'; P.stT = 14; G.audio.sfx('climbup'); }
    else if (tp('down') || (P.face > 0 && b('left')) || (P.face < 0 && b('right'))) { P.st = 'normal'; P.y += 4; P.vy = 1; P.hangCool = 12; }
    return;
  }
  if (P.st === 'climbup') { if (--P.stT <= 0) { P.y = P.hangT.ty * T - P.h; P.x += P.face * (P.w + 2); P.st = 'normal'; P.on = true; } return; }
  if (P.hangCool > 0) P.hangCool--;

  /* ---- roll / slide / dash ---- */
  if (P.st === 'roll' || P.st === 'slide') {
    P.roll--; const spd = P.st === 'roll' ? (ab('dash') ? 3.2 : 2.7) : P.vx * .965;
    if (P.st === 'roll') P.vx = P.face * spd * (P.roll < 5 ? .5 : 1); else P.vx = spd;
    P.vy = Math.min(P.vy + .28, 6); moveX(P); moveY(P);
    if (P.st === 'roll' && P.roll % 5 === 0) G.fx.add({ x: P.x + 5, y: P.y + P.h, vx: -P.face * .3, vy: -.2, c: '#9a8a7a', life: 14 });
    if (P.roll <= 0 || (P.st === 'slide' && Math.abs(P.vx) < .4)) { if (setH(P, 22)) { P.st = 'normal'; } else { P.st = 'crouch'; } P.rollCd = 8; }
    if (tp('jump') && P.on && setH(P, 22)) { P.st = 'normal'; P.vy = -5.6; G.audio.sfx('jump'); }
    return;
  }
  if (P.st === 'dash') {
    P.stT--; P.vx = P.face * 4.6; P.vy = 0; moveX(P); G.audio.setRush(1);
    if (P.stT % 2 === 0) G.fx.add({ x: P.x + 5, y: P.y + 4 + Math.random() * 14, vx: -P.face, c: '#7fd3ff', k: 'glow', s: 1, life: 14 });
    if (P.stT <= 0 || P.hitW) { P.st = 'normal'; P.vx = P.face * 1.6; }
    return;
  }

  /* ---- crouch ---- */
  const wantCrouch = b('down') && P.on && !P.atk;
  if (wantCrouch && P.st === 'normal') { if (Math.abs(P.vx) > 1.6) { P.st = 'slide'; P.roll = 26; setH(P, 12); G.audio.sfx('slide'); P.vx = P.face * 3.2; return; } P.st = 'crouch'; setH(P, 12); }
  if (P.st === 'crouch' && (!b('down') || !P.on)) { if (setH(P, 22)) P.st = 'normal'; }

  /* ---- horizontal ---- */
  const crouch = P.st === 'crouch', busy = P.atk && P.on && P.atk.kind !== 'air';
  const maxV = crouch ? .7 : P.charge > 0 ? .8 : 2.1, acc = P.on ? .32 : .22;
  if (P.wallLock <= 0 && !busy) { if (ax) { P.vx += ax * acc; P.vx = G.clamp(P.vx, -maxV, maxV); if (!P.atk) P.face = ax; } else P.vx *= P.on ? .7 : .86; }
  else if (busy) P.vx *= .8;
  if (Math.abs(P.vx) < .05) P.vx = 0;

  /* ---- updrafts ---- */
  let lifted = false; for (const u of L.updrafts) if (G.hit(P, u)) { lifted = true; P.vy = Math.max(P.vy - .5, -3.4); if (Math.random() < .3) G.fx.add({ x: u.x + Math.random() * 16, y: P.y + 30, vy: -2, c: '#ffffff', life: 20 }); }
  /* ---- gravity & wall ---- */
  P.wallDir = 0;
  if (!P.on && P.vy > 0 && ax) { const side = ax > 0 ? P.x + P.w + 1 : P.x - 1; const tl = y => W.tile(Math.floor(side / T), Math.floor(y / T)); if (W.solid(side, P.y + 3) && W.solid(side, P.y + P.h - 3) && ![6, 8, 9, 10, 11].includes(tl(P.y + 3)) && ![6, 8, 9, 10, 11].includes(tl(P.y + P.h - 3))) P.wallDir = ax; } // sealed gate stone is too smooth to cling to
  if (!lifted) { const apex = Math.abs(P.vy) < 1 && b('jump') && !P.wallDir; P.vy = Math.min(P.vy + (P.vy < 0 && !b('jump') ? .5 : apex ? .16 : P.vy > 0 ? .42 : .28), P.wallDir ? 1.2 : 6.2); }
  if (P.wallDir && !P.wasWall) G.audio.sfx('wallhit'); if (P.wallDir && (P.scT = (P.scT || 0) + 1) % 9 === 0) G.audio.sfx('scrape'); P.wasWall = P.wallDir;
  if (P.wallDir && Math.random() < .2) G.fx.add({ x: P.wallDir > 0 ? P.x + P.w : P.x, y: P.y + 4, vy: -.3, c: '#c8b8a0', life: 10 });

  /* ---- jumping ---- */
  P.coy = P.on ? 7 : P.coy - 1; P.jb = tp('jump') ? 8 : P.jb - 1;
  if (P.jb > 0 && crouch && P.onPlat) { P.dropT = 10; P.jb = 0; G.audio.sfx('drop'); P.st = 'normal'; setH(P, 22); }
  else if (P.jb > 0 && (P.coy > 0) && !crouch) { P.vy = -5.6; P.jb = 0; P.coy = 0; G.audio.sfx('jump'); G.fx.burst(P.x + 5, P.y + P.h, '#c8b8a0', 5, 1, { g: 0 }); }
  else if (P.jb > 0 && P.wallDir) { P.vy = -5.3; P.vx = -P.wallDir * 2.7; P.face = -P.wallDir; P.wallLock = 6; P.jb = 0; P.dj = false; P.dashed = false; G.audio.sfx('walljump'); G.fx.burst(P.x + (P.wallDir > 0 ? P.w : 0), P.y + 10, '#efe6d2', 6, 1.5); }
  else if (P.jb > 0 && !P.on && ab('wings') && !P.dj && !P.wallDir) { P.vy = -5; P.dj = true; P.jb = 0; P.djT = 7; G.audio.sfx('djump'); G.fx.ring(P.x + 5, P.y + 20, '#fff1c0', 18); for (let i = 0; i < 8; i++) G.fx.add({ x: P.x + 5 + (i - 4) * 2, y: P.y + 16, vx: (i - 4) * .3, vy: 1, c: '#fff1c0', k: 'glow', s: 1, life: 20 }); }
  if (P.dropT > 0) P.dropT--;

  /* ---- roll / dash input ---- */
  if (tp('roll') && (!P.atk || P.atkT > (P.atk.kind === 'heavy' ? 18 : 9))) { P.atk = null;
    if (P.on && P.rollCd <= 0) { P.st = 'roll'; P.roll = 22; setH(P, 12); G.audio.sfx('roll'); if (ax) P.face = ax; return; }
    if (!P.on && ab('dash') && !P.dashed) { P.st = 'dash'; P.stT = 12; P.dashed = true; if (ax) P.face = ax; G.audio.sfx('dash'); G.fx.ring(P.x + 5, P.y + 11, '#7fd3ff', 20); return; }
  }
  /* ---- vines ---- */
  if ((b('up') || (b('down') && !P.on)) && vineAt(P) && !P.atk) { G.audio.sfx('grab', .6); P.st = 'climb'; P.x = Math.floor((P.x + P.w / 2) / T) * T + 3; P.dj = false; P.dashed = false; return; }

  P.fallV = P.vy; moveX(P); moveY(P, P.dropT > 0);
  if (!P.on && P.hangCool <= 0 && tryLedge(P)) return;
  if (P.on) { P.dj = false; P.dashed = false; if (!wasOn) { P.landT = P.fallV > 5 ? 9 : 6; if (P.fallV > 5.5) G.shake(2); G.audio.sfx('land', G.clamp(P.fallV / 6, .25, 1), { surf: W.surface() }); G.fx.burst(P.x + 5, P.y + P.h, '#c8b8a0', 6, 1.2, { g: 0, vy: -.3 }); } }
  if (P.on && !P.onPlat && W.tile(Math.floor((P.x + 5) / T), Math.floor((P.y + P.h + 2) / T)) === 1) {
    const ok = [P.x - 6, P.x + P.w + 6].every(x => W.tile(Math.floor(x / T), Math.floor((P.y + P.h + 2) / T)) === 1);
    if (ok) P.safe = { x: P.x, y: P.y };
  }
  if (P.landT > 0) P.landT--;
  if (P.on && Math.abs(P.vx) > .15) { P.stepT = (P.stepT || 0) + Math.abs(P.vx); const run = Math.abs(P.vx) > 1.3; if (P.stepT > (run ? 28 : 19)) { P.stepT = 0; G.audio.sfx('step', run ? 1 : .6, { surf: W.surface() }); } }

  /* ---- hazards ---- */
  const feetT = W.tile(Math.floor((P.x + 5) / T), Math.floor((P.y + P.h - 2) / T));
  if (feetT === 3) { G.fx.burst(P.x + 5, P.y + P.h, '#b8361f', 10, 2); if (P.inv <= 0) respawnSafe(20); else if (P.on) { P.vy = -4; } }
  if (P.y > L.H * T + 30) respawnSafe(25);
  /* continuous audio state */
  G.audio.setRush(!P.on && P.st === 'normal' ? Math.max(0, (Math.abs(P.vy) - 2.5) / 4) + (lifted ? .5 : 0) : 0);
  if (G.S.time % 15 === 0) { const tx = Math.floor((P.x + 5) / T), ty = Math.floor(P.y / T); let roof = 0; for (const dx of [-1, 0, 1]) for (let k = 1; k <= 5; k++) if (solidT(W.tile(tx + dx, ty - k))) { roof++; break; } G.audio.setRoom(roof >= 2 ? .55 : (G.audio.baseRoom || .1)); }
  if (P.hp > 0 && P.hp / G.S.maxHp < .25 && G.S.time % 55 === 0) G.audio.sfx('heart');

  /* ---- combat ---- */
  W.playerCombat(P, S, ab);
  P.anim += P.on ? Math.abs(P.vx) * .09 : .1;
};

W.playerCombat = (P, S, ab) => {
  const b = G.btn, tp = G.tap, L = W.L;
  // melee
  if (P.atk) {
    P.atkT++;
    const a = P.atk, dur = a.kind === 'heavy' ? 26 : a.kind === 'air' ? 16 : 14, act = a.kind === 'heavy' ? [12, 18] : [4, 9];
    if (P.atkT === act[0]) { G.audio.sfx(a.kind === 'heavy' ? 'heavy' : a.kind === 'air' ? 'airswing' : 'swing', 1, { p: a.kind === 'k1' ? 1.2 : a.kind === 'k2' ? .8 : 1 }); G.fx.slash(P.x + 5 + P.face * 10, P.y + (a.kind === 'air' ? 14 : 9), a.kind === 'k1' ? -.6 : a.kind === 'air' ? 1 : 0, P.face, a.kind === 'heavy' ? '#ffd36a' : P.power ? '#ffe08a' : '#fff6d8'); if (a.kind === 'k2') P.vx = P.face * 2.4; if (a.kind === 'heavy' && P.on) { G.shake(4); G.fx.burst(P.x + 5 + P.face * 18, P.y + P.h, '#c8b8a0', 12, 2.5); } }
    if (P.atkT >= act[0] && P.atkT <= act[1]) {
      const reach = a.kind === 'heavy' ? 28 : a.kind === 'k2' ? 30 : 24;
      const box = a.kind === 'air' ? { x: P.x - 12, y: P.y - 4, w: P.w + 24, h: P.h + 14 } : { x: P.face > 0 ? P.x + P.w - 2 : P.x - reach + 2, y: P.y - 4, w: reach, h: P.h + 4 };
      const dmg = (a.kind === 'heavy' ? 3 : a.kind === 'k2' ? 2 : 1) * (P.power ? 3 : 1);
      W.hitEnemies(box, dmg, a, { heavy: a.kind === 'heavy', dir: P.face, melee: true }); W.parry(box); W.hitSwitches({ x: P.x - 8, y: P.y - 6, w: P.w + 16, h: P.h + 8 });
    }
    if (P.atkT >= dur || (a.kind === 'air' && P.on)) { P.atk = null; if (a.kind !== 'heavy') P.comboT = 14; }
    return;
  }
  const hv = tp('heavy') && P.on;
  if ((tp('attack') || hv) && P.st === 'crouch' && P.on && setH(P, 22)) P.st = 'normal';   // down + strike: stand into a heavy strike
  if ((tp('attack') || hv) && P.st !== 'crouch') {
    if (!P.on) { P.atk = { kind: 'air', hit: new Set() }; P.atkT = 0; P.vy = Math.min(P.vy, 1); return; }
    if (hv || b('up') || b('down')) { P.atk = { kind: 'heavy', hit: new Set() }; P.atkT = 0; G.audio.sfx('heavywind'); return; }
    const k = P.comboT > 0 ? (P.combo + 1) % 3 : 0; P.combo = k; P.atk = { kind: 'k' + k, hit: new Set() }; P.atkT = 0; return;
  }
  // light powers
  if ((b('light') || tp('burst')) && !W.noLight) {
    if (tp('burst') && !ab('burst')) return;
    if (((b('down') && tp('light')) || tp('burst')) && ab('burst') && !P.charge) {
      if (P.mana >= 40 || P.power) { if (!P.power) P.mana -= 40; G.audio.sfx('burst'); G.shake(6); G.fx.ring(P.x + 5, P.y + 11, '#7fe6f0', 70, 24); G.fx.ring(P.x + 5, P.y + 11, '#ffffff', 50, 18); G.fx.burst(P.x + 5, P.y + 11, '#7fe6f0', 40, 4, { k: 'glow', g: 0 }); W.hitEnemies({ x: P.x - 60, y: P.y - 50, w: 130, h: 120 }, 4 * (P.power ? 2 : 1), { hit: new Set() }, { heavy: true, burst: true }); P.burstT = 16; }
      else { G.toast('Not enough mana'); G.audio.sfx('error'); }
      return;
    }
    P.charge++; if (P.charge === 18) G.audio.sfx('charge'); if (P.charge === 45) { G.audio.sfx('charged'); G.fx.ring(P.x + 5 + P.face * 12, P.y + 9, '#fff1c0', 14); }
    if (P.charge > 18 && P.charge % 3 === 0) G.fx.add({ x: P.x + 5 + P.face * 12 + (Math.random() - .5) * 24, y: P.y + 8 + (Math.random() - .5) * 24, vx: 0, vy: 0, c: ab('spear') ? '#fff1c0' : '#7fe6f0', k: 'glow', s: 1, life: 12, tx: 1 });
  } else if (P.charge > 0) {
    const charged = P.charge >= 45; P.charge = 0;
    const cost = charged ? 25 : 8;
    if (P.mana < cost && !P.power) { G.toast('Not enough mana'); G.audio.sfx('error'); return; }
    if (!P.power) P.mana -= cost;
    const spear = charged && ab('spear');
    L.bolts.push({ x: P.x + 5 + P.face * 8, y: P.y + 8, w: charged ? (spear ? 22 : 12) : 6, h: charged ? 6 : 3, vx: P.face * (charged ? 5.5 : 5), life: charged ? 70 : 55, dmg: (charged ? (spear ? 5 : 3) : 1) * (P.power ? 3 : 1), pierce: spear, charged, hit: new Set() });
    P.shootT = 10; G.audio.sfx(spear ? 'spear' : charged ? 'cshot' : 'shot');
    if (charged) G.shake(3);
  }
};

W.parry = box => {
  for (const s of W.L.shots) { if (s.k || s.life <= 0 || !G.hit(box, s)) continue; s.life = 0; G.audio.sfx('parry', 1, { x: s.x }); G.fx.burst(s.x + 3, s.y + 3, '#fff1c0', 10, 2.5, { k: 'glow', g: 0 }); G.fx.ring(s.x + 3, s.y + 3, '#ffffff', 16, 12); G.hitstop(3); W.P.mana = Math.min(G.S.maxMana, W.P.mana + 4); }
};
const SURF_OF = { moss: 'grass', leaf: 'grass', gold: 'grass', cloud: 'soft', storm: 'stone', moon: 'stone', ruin: 'stone', summit: 'stone', city: 'stone', war: 'stone', star: 'crystal', ice: 'crystal', black: 'thorn' };
W.surface = () => { const P = W.P, v = W.tile(Math.floor((P.x + 5) / T), Math.floor((P.y + P.h + 2) / T)); if (v === 2) return W.L.n === 3 ? 'soft' : W.L.n >= 5 ? 'stone' : 'wood'; return SURF_OF[W.L.b.tile.deco] || 'grass'; };
W.hitSwitches = box => {
  const L = W.L; for (const sw of L.switches) {
    if (sw.on || !G.hit(box, sw)) continue;
    sw.on = true; sw.t = 0; G.audio.sfx('stonehit', 1, { x: sw.x }); G.audio.sfx('lightmote', .8, { x: sw.x, p: 1 + L.switches.filter(q => q.g === sw.g && q.on).length * .12 });
    G.fx.burst(sw.x + 6, sw.y + 6, '#f2c14e', 14, 2.2, { k: 'glow', g: 0 }); G.fx.ring(sw.x + 6, sw.y + 6, '#fff1c0', 18);
    if (sw.bird && W.onBirdFreed) W.onBirdFreed(sw);
    const group = L.switches.filter(q => q.g === sw.g), left = group.filter(q => !q.on).length;
    if (left) { G.toast('Gate stones', left + ' more to wake'); continue; }
    for (const [X, Y] of (L.doors[sw.g] || [])) { L.g[Y][X] = 0; G.fx.burst(X * T + 8, Y * T + 8, '#c8b8a0', 4, 1.4); }
    G.audio.sfx('gateopen'); G.shake(5); G.toast('The gate opens');
  }
};
W.hitEnemies = (box, dmg, atk, o = {}) => {
  let any = false; W.hitSwitches(box); W.hitHeaven && W.hitHeaven(box, o);
  for (const e of W.L.enemies) {
    if (e.dead || atk.hit.has(e) || !G.hit(box, e)) continue;
    if (e.type === 'stalk' && e.st === 'hidden') continue;
    atk.hit.add(e); any = true;
    W.damageEnemy(e, dmg, o);
  }
  if (G.Boss && G.Boss.active) G.Boss.hitTest(box, dmg, atk, o) && (any = true);
  if (any && o.melee) { G.hitstop(o.heavy ? 6 : 3); W.P.mana = Math.min(G.S.maxMana, W.P.mana + 3); }
  return any;
};
W.damageEnemy = (e, dmg, o) => {
  const P = W.P;
  // defensive enemies
  const front = Math.sign((P.x + 5) - (e.x + e.w / 2)) === e.face;
  if ((e.type === 'guard' && front && !o.heavy && !(o.proj && o.charged)) || (e.type === 'warrior' && e.st === 'block' && front && !o.heavy && !o.burst)) {
    G.audio.sfx('blocked', 1, { x: e.x }); G.fx.burst(e.x + (e.face > 0 ? e.w : 0), e.y + 10, '#ffffff', 6, 2); if (o.melee) { P.vx = -P.face * 2; } return;
  }
  const crit = (o.melee && !front && e.type !== 'mos') || (e.st === 'stagger' && o.heavy) || e.st === 'dazed'; if (crit) dmg = Math.ceil(dmg * 1.5);
  e.hp -= dmg; e.flash = 8; e.kb = (o.dir || Math.sign(e.x - P.x) || 1) * (o.heavy ? 3 : 1.6);
  G.audio.sfx(crit ? 'crit' : e.type === 'guard' ? 'stonehit' : 'hit', 1, { x: e.x }); G.fx.burst(e.x + e.w / 2, e.y + e.h / 2, '#fff1c0', 7, 2.2); if (crit) { G.fx.text(e.x + e.w / 2, e.y - 4, 'CRIT', '#f2c14e'); G.fx.burst(e.x + e.w / 2, e.y + e.h / 2, '#f2c14e', 10, 3); }
  if (e.type === 'warrior' || e.type === 'guard') { e.st = 'stagger'; e.stT = o.heavy ? 40 : 16; if (o.heavy) G.audio.sfx('guardbreak', 1, { x: e.x }); }
  if (e.hp <= 0) {
    e.dead = true; G.S.score += e.pts; if (G.S.lv) G.S.lv.kills++; G.audio.sfx(o.heavy || (o.melee && W.P.atk && W.P.atk.kind === 'k2') ? 'finisher' : 'kill', 1, { x: e.x }); G.audio.creatureDeath(e.type, e.x);
    G.fx.burst(e.x + e.w / 2, e.y + e.h / 2, e.v === 'c' || e.type === 'stalk' || e.type === 'spirit' || e.type === 'warrior' ? '#5a2a7a' : '#7fd36a', 18, 2.8);
    G.fx.burst(e.x + e.w / 2, e.y + e.h / 2, '#fff1c0', 6, 1.5, { k: 'glow', g: -.02 });
    if (Math.random() < .35) W.L.items.push({ k: 'mana', x: e.x + e.w / 2 - 6, y: e.y, w: 12, h: 12, vy: -2, drop: true, ph: 0 });
    if (Math.random() < .08) W.L.items.push({ k: 'kumara', x: e.x + e.w / 2 - 6, y: e.y, w: 12, h: 12, vy: -2, drop: true, ph: 0 });
  }
};

/* ================= ENEMY AI ================= */
W.updateEnemies = () => {
  const L = W.L, P = W.P, px = P.x + 5, py = P.y + P.h / 2;
  W.mosD = 999;
  for (const e of L.enemies) {
    if (e.dead) continue; W.curSrc = e.type;
    e.t++; if (e.flash > 0) e.flash--; if (e.stT > 0) e.stT--;
    const dx = px - (e.x + e.w / 2), dy = py - (e.y + e.h / 2), dist = Math.hypot(dx, dy), onScreen = Math.abs(dx) < 260 && Math.abs(dy) < 180;
    if (!onScreen && e.type !== 'spider' && e.type !== 'horror') continue;
    if (e.kb) { e.vx = e.kb; e.kb *= .7; if (Math.abs(e.kb) < .2) e.kb = 0; }
    const grav = () => { e.vy = Math.min(e.vy + .28, 6); moveX(e); moveY(e); if (e.y > L.H * T) e.dead = true; };
    const edgeAhead = () => !W.solid(e.face > 0 ? e.x + e.w + 2 : e.x - 2, e.y + e.h + 3);
    switch (e.type) {
      case 'liz': {
        if (e.st === 'lunge') { if (e.stT <= 0) { e.st = 'idle'; e.stT = 50; } }
        else { if (!e.kb) e.vx = e.face * e.sp; if (e.hitW || edgeAhead()) e.face *= -1; if (Math.abs(dx) < 60 && Math.abs(dy) < 20 && Math.sign(dx) === e.face && e.stT <= 0) { e.st = 'lunge'; e.stT = 22; e.vx = e.face * 3.4; e.vy = -1.5; G.audio.sfx('hiss', 1, { x: e.x }); } }
        grav(); break;
      }
      case 'weta': {
        if (e.on && !e.kb) { e.vx *= .7; if (e.stT <= 0 && dist < 150) { e.face = Math.sign(dx) || 1; e.st = 'crouch'; e.stT = 26; } if (e.st === 'crouch' && e.stT === 1) { e.vy = -4.2; e.vx = e.face * 2.2; e.st = 'jump'; e.stT = 60; G.audio.sfx('chirp', 1, { x: e.x }); } }
        grav(); break;
      }
      case 'bird': {
        if (e.st === 'dive') { e.x += e.vx; e.y += e.vy; e.vy += .05; if (e.stT <= 0 || W.solid(e.x + e.w / 2, e.y + e.h)) { e.st = 'rise'; e.stT = 60; } }
        else if (e.st === 'rise') { e.y -= 1; e.x += e.face * .6; if (e.stT <= 0) e.st = 'idle'; }
        else { e.x = e.hx + Math.sin(e.t * .02) * 40; e.y = e.hy - 20 + Math.sin(e.t * .05) * 8; e.face = Math.cos(e.t * .02) > 0 ? 1 : -1; if (dist < 140 && dy > 0 && e.stT <= 0) { e.st = 'dive'; e.stT = 50; const a = Math.atan2(dy, dx); e.vx = Math.cos(a) * 3.2; e.vy = Math.sin(a) * 3.2; e.face = Math.sign(dx) || 1; G.audio.sfx('screech', 1, { x: e.x }); } }
        if (e.kb) { e.x += e.kb; } break;
      }
      case 'mos': { W.mosD = Math.min(W.mosD, dist);
        if (dist < 170) { e.x += dx / dist * e.sp + Math.sin(e.t * .3) * .8; e.y += dy / dist * e.sp + Math.cos(e.t * .27) * .8; e.face = Math.sign(dx) || 1; }
        else { e.x = e.hx + Math.sin(e.t * .04) * 10; e.y = e.hy + Math.sin(e.t * .09) * 6; }
        if (e.kb) e.x += e.kb * 2; break;
      }
      case 'spirit': {
        const want = dist < 90 ? -1 : dist > 150 ? 1 : 0;
        if (dist < 220) { e.x += dx / dist * e.sp * want; e.y += (dy / dist * e.sp * want) + Math.sin(e.t * .05) * .3; e.face = Math.sign(dx) || 1; if (e.t % 110 === 0) { const a = Math.atan2(dy, dx); L.shots.push({ x: e.x + e.w / 2, y: e.y + 6, w: 6, h: 6, vx: Math.cos(a) * 1.8, vy: Math.sin(a) * 1.8, life: 160, dmg: e.dmg, c: '#9a4aff' }); G.audio.sfx('whisper', 1, { x: e.x }); } }
        if (e.kb) e.x += e.kb; break;
      }
      case 'spider': {
        if (e.st === 'hang') { e.y = e.anchor + 20 + Math.sin(e.t * .03) * 10; if (Math.abs(dx) < 40 && dy > 0 && dist < 160) { e.st = 'drop'; G.audio.sfx('skitter', 1, { x: e.x }); } }
        else if (e.st === 'drop') { e.vy = Math.min(e.vy + .35, 6); moveY(e); if (e.on) { e.st = 'crawl'; e.face = Math.sign(dx) || 1; } if (e.y > L.H * T) e.dead = true; }
        else { if (!e.kb) e.vx = e.face * e.sp * 1.6; if (e.hitW || edgeAhead()) e.face *= -1; if (e.t % 60 === 0) e.face = Math.sign(dx) || e.face; grav(); }
        break;
      }
      case 'stalk': {
        if (e.st === 'hidden') { e.vx = 0; grav(); if (dist < 80 && Math.abs(dy) < 30) { e.st = 'lunge'; e.stT = 28; e.face = Math.sign(dx) || 1; e.vx = e.face * 3.6; e.vy = -2; G.audio.sfx('growl', 1, { x: e.x }); } }
        else if (e.st === 'lunge') { grav(); if (e.stT <= 0) { e.st = 'stalk'; e.stT = 70; } }
        else { e.face = Math.sign(dx) || 1; if (!e.kb) e.vx = e.face * e.sp * (dist > 40 ? 1 : -.6); grav(); if (e.stT <= 0 && dist < 90) { e.st = 'lunge'; e.stT = 28; e.vx = e.face * 3.6; e.vy = -2; } }
        break;
      }
      case 'guard': {
        if (e.st === 'stagger') { if (e.stT <= 0) e.st = 'idle'; e.vx *= .8; }
        else if (e.st === 'swing') { e.vx = 0; if (e.stT === 14) { G.audio.sfx('guardswing', 1, { x: e.x }); const box = { x: e.face > 0 ? e.x + e.w : e.x - 22, y: e.y, w: 22, h: e.h }; if (G.hit(P, box)) W.hurtPlayer(e.dmg, e.x + e.w / 2); } if (e.stT <= 0) { e.st = 'idle'; e.stT = 50; } }
        else { e.face = Math.abs(dx) > 6 ? Math.sign(dx) : e.face; if (!e.kb) e.vx = Math.abs(dx) > 24 && dist < 200 ? e.face * e.sp : 0; if (edgeAhead()) e.vx = 0; if (Math.abs(dx) < 30 && Math.abs(dy) < 30 && e.stT <= 0) { e.st = 'swing'; e.stT = 30; } }
        grav(); break;
      }
      case 'horror': { // cave horror: waits in the ceiling as two eyes, drops, then hunts in bursts
        if (e.st === 'lurk') { e.y = e.anchor + Math.sin(e.t * .02) * 2; if (Math.abs(dx) < 46 && dy > 0 && dist < 150) { e.st = 'drop'; e.vy = 1; G.audio.sfx('growl', 1, { x: e.x }); G.audio.sfx('skitter', 1, { x: e.x }); } }
        else if (e.st === 'drop') { e.vy = Math.min(e.vy + .4, 7); moveY(e); if (e.on) { e.st = 'hunt'; e.stT = 30; G.shake(2); G.fx.burst(e.x + e.w / 2, e.y + e.h, '#3a2a44', 10, 1.6); } if (e.y > L.H * T) e.dead = true; }
        else { e.face = Math.sign(dx) || e.face; if (!e.kb) e.vx = e.face * e.sp * (e.stT > 0 ? .4 : 1.8); if (e.stT <= 0 && e.on && Math.abs(dx) < 70 && Math.abs(dy) < 30) { e.vy = -3.6; e.vx = e.face * 2.6; e.stT = 70; G.audio.sfx('hiss', 1, { x: e.x }); } grav(); }
        break;
      }
      case 'beast': { // heavenly beast: patrols, lowers its head and glows, then charges until it hits a wall or the edge
        if (e.st === 'tell') { e.vx = 0; if (e.stT <= 0) { e.st = 'charge'; e.stT = 55; G.audio.sfx('growl', 1, { x: e.x }); G.audio.sfx('dash', .7, { x: e.x }); } }
        else if (e.st === 'charge') { e.vx = e.face * 4; if (e.t % 3 === 0) G.fx.add({ x: e.x + e.w / 2 - e.face * 12, y: e.y + e.h, vx: -e.face, vy: -.6, c: '#c8b8ff', life: 14 }); if (e.hitW || edgeAhead() || e.stT <= 0) { e.st = 'dazed'; e.stT = 60; e.vx = 0; if (e.hitW) { G.shake(4); G.audio.sfx('slam', .5, { x: e.x }); } } }
        else if (e.st === 'dazed') { e.vx *= .8; if (e.stT <= 0) { e.st = 'idle'; e.stT = 40; } }
        else { if (!e.kb) e.vx = e.face * e.sp; if (e.hitW || edgeAhead()) e.face *= -1; if (e.stT <= 0 && Math.abs(dx) < 170 && Math.abs(dy) < 24 && e.on) { e.face = Math.sign(dx) || e.face; e.st = 'tell'; e.stT = 34; G.audio.sfx('warn', .6, { x: e.x }); } }
        grav(); break;
      }
      case 'warrior': {
        if (e.st === 'stagger') { if (e.stT <= 0) { e.st = 'idle'; e.stT = 20; } e.vx *= .8; }
        else if (e.st === 'attack') { if (e.stT === 18) { e.vx = e.face * 3; G.audio.sfx('shadowslash', 1, { x: e.x }); } if (e.stT < 18 && e.stT > 8) { const box = { x: e.face > 0 ? e.x + e.w : e.x - 22, y: e.y + 4, w: 22, h: 14 }; if (G.hit(P, box)) W.hurtPlayer(e.dmg, e.x + e.w / 2); } e.vx *= .9; if (e.stT <= 0) { e.st = Math.random() < .5 ? 'block' : 'idle'; e.stT = 40; } }
        else if (e.st === 'block') { e.vx = 0; e.face = Math.sign(dx) || e.face; if (e.stT <= 0) { e.st = 'idle'; e.stT = 10; } }
        else { e.face = Math.sign(dx) || e.face; if (!e.kb) e.vx = dist < 220 && Math.abs(dx) > 26 ? e.face * e.sp : 0; if (edgeAhead() && e.on) { if (e.n > 6 && dist < 120) { e.vy = -4.5; e.vx = e.face * 2; } else e.vx = 0; }
          if (Math.abs(dx) < 34 && Math.abs(dy) < 24 && e.stT <= 0) { e.st = 'attack'; e.stT = 30; } else if (dist < 80 && P.atk && e.stT <= 0 && Math.random() < .05) { e.st = 'block'; e.stT = 30; } }
        grav(); break;
      }
    }
    // contact damage
    if (!e.dead && G.hit(P, e) && !(e.type === 'stalk' && e.st === 'hidden') && e.st !== 'stagger' && e.st !== 'lurk' && e.st !== 'dazed') W.hurtPlayer(e.type === 'beast' && e.st === 'charge' ? Math.round(e.dmg * 1.3) : e.dmg, e.x + e.w / 2);
  }
  L.enemies = L.enemies.filter(e => !e.dead);
  G.audio.setWhine(W.mosD < 160 ? 1 - W.mosD / 160 : 0);
  // enemy shots
  W.curSrc = 'projectile';
  for (const s of L.shots) { s.x += s.vx; s.y += s.vy; s.life--; if (s.ay) s.vy += s.ay; if (G.hit(P, s)) { s.life = 0; W.hurtPlayer(s.dmg, s.x, s); } if (!s.ghost && W.solid(s.x + s.w / 2, s.y + s.h / 2)) { s.life = 0; G.fx.burst(s.x, s.y, s.c || '#9a4aff', 5, 1.2); G.audio.sfx('fizzle', 1, { x: s.x }); } }
  L.shots = L.shots.filter(s => s.life > 0);
  // player bolts
  for (const bl of L.bolts) {
    bl.x += bl.vx; bl.life--; W.onBolt && W.onBolt(bl);
    if (bl.life % 2 === 0) G.fx.add({ x: bl.x + bl.w / 2, y: bl.y + bl.h / 2, c: bl.charged ? '#fff1c0' : '#7fe6f0', k: 'glow', s: bl.charged ? 2 : 1, life: 10, g: 0 });
    if (W.solid(bl.x + (bl.vx > 0 ? bl.w : 0), bl.y + bl.h / 2)) { bl.life = 0; G.fx.burst(bl.x, bl.y, '#7fe6f0', 6, 1.5); }
    const hit = W.hitEnemies(bl, bl.dmg, bl, { proj: true, charged: bl.charged, dir: Math.sign(bl.vx) });
    if (hit && !bl.pierce) bl.life = 0;
  }
  L.bolts = L.bolts.filter(b => b.life > 0);
};

/* ================= ITEMS, CHECKPOINTS, SHRINE ================= */
W.updateItems = () => {
  const L = W.L, P = W.P, S = G.S;
  for (const it of L.items) {
    if (it.drop) { it.vy = Math.min((it.vy || 0) + .2, 4); it.y += it.vy; if (W.solid(it.x + 6, it.y + 12)) { it.y = Math.floor((it.y + 12) / T) * T - 12; it.vy = 0; it.drop = false; } }
    if (it.gone || !G.hit(P, it)) continue;
    it.gone = true; const cx = it.x + 6, cy = it.y + 6;
    switch (it.k) {
      case 'mana': P.mana = Math.min(S.maxMana, P.mana + 12); S.score += 25; S.manaStones++; G.audio.sfx('mana'); G.fx.burst(cx, cy, '#7fe6f0', 8, 1.6, { k: 'glow', g: 0 }); break;
      case 'kumara': P.hp = Math.min(S.maxHp, P.hp + 30); S.score += 50; G.audio.sfx('heal'); G.fx.text(cx, cy - 6, '+30', '#7fd36a'); break;
      case 'feather': S.feathers++; S.maxMana += 5; P.mana = S.maxMana; S.score += 500; S.got.push(it.id); G.audio.sfx('feather'); G.toast('Sacred feather', 'Your mana grows. Maximum mana +5.'); G.fx.burst(cx, cy, '#efe6d2', 16, 2); break;
      case 'relic': S.relics++; S.maxHp += 10; P.hp = S.maxHp; S.score += 800; S.got.push(it.id); G.audio.sfx('relic'); G.toast('Pounamu', 'Your body strengthens. Maximum health +10.'); G.fx.burst(cx, cy, '#58d39a', 18, 2); break;
      case 'glyph': { S.glyphs = (S.glyphs || 0) + 1; S.got.push(it.id); S.score += 400; G.audio.sfx('relic'); G.fx.burst(cx, cy, '#f2c14e', 16, 2, { k: 'glow', g: 0 });
        P.hp = S.maxHp; G.audio.sfx('heal'); G.toast('Carved stone', 'The old words restore you. Health full.'); break; }
      case 'carving': if (!S.lore.includes(L.n)) S.lore.push(L.n); S.got.push(it.id); S.score += 1000; G.audio.sfx('carving'); G.audio.duck(.5, 1.2, 1); P.collectT = 40; G.openLore(L.n, true); break;
    }
  }
  L.items = L.items.filter(i => !i.gone);
  // checkpoints
  for (const p of L.pous) {
    if (!p.lit && Math.abs(P.x + 5 - (p.x + 8)) < 14 && Math.abs(P.y + P.h - (p.y + 36)) < 20) {
      L.pous.forEach(q => q.lit = false); p.lit = true; S.check = { n: L.n, x: p.x + 3, y: p.y + 36 - 22 }; P.hp = S.maxHp; P.mana = S.maxMana;
      G.audio.sfx('check'); G.audio.duck(.6, .8, 1); G.fx.burst(p.x + 8, p.y + 6, '#f2c14e', 20, 2, { k: 'glow', g: 0 }); G.save('auto'); G.toast('Checkpoint', 'Progress saved. Health restored.');
    }
  }
  // shrine
  const sh = L.shrine; if (sh && !sh.taken && G.hit(P, sh)) { sh.taken = true; G.grantAbility(sh.ab); }
  // gate
  if (L.gate && L.gate.open && Math.abs(P.x + 5 - (L.gate.x + 24)) < 10 && P.on) G.levelComplete();
};

/* ================= DRAW ================= */
const doorSprite = () => G.sprite('door', 16, 16, px => { px.r(0, 0, 16, 16, '#5e5648'); px.r(0, 0, 16, 1, '#8a8070'); px.r(0, 15, 16, 1, '#2e2a24'); px.r(1, 2, 14, 12, '#6e6656');
  [[8, 5], [9, 5], [10, 6], [10, 7], [10, 8], [9, 9], [8, 9], [7, 9], [6, 8], [6, 7], [7, 6], [8, 7]].forEach(p => px.p(p[0], p[1], '#c2452a')); px.r(2, 12, 12, 1, '#c2452a'); }, null);
const stoneSprite = on => G.sprite('kstone:' + (on ? 1 : 0), 14, 16, px => { px.ell(7, 9, 6, 6, on ? '#8a7a4a' : '#5a5a66'); px.ell(6, 8, 4, 4, on ? '#b8a060' : '#7a7a88');
  const c = on ? '#fff1c0' : '#2a2a34'; [[7, 6], [8, 6], [9, 7], [9, 8], [9, 9], [8, 10], [7, 10], [6, 10], [5, 9], [5, 8], [6, 7], [7, 8]].forEach(p => px.p(p[0], p[1], c)); px.r(3, 14, 8, 2, '#3a3020'); });
const signSprite = () => G.sprite('sign', 14, 16, px => { px.r(6, 6, 2, 10, '#4a2a18'); px.r(1, 1, 12, 7, '#7a4a2a'); px.r(1, 1, 12, 1, '#a8703f'); px.r(3, 3, 8, 1, '#e2b878'); px.r(3, 5, 6, 1, '#e2b878'); });
const WATER = { 1: '#0e3a3a', 5: '#7a5a1e', 6: '#2a3a6a' };
const fgSprite = (n, v) => G.sprite('fg:' + n + ':' + v, 64, 48, px => {
  const c = '#05040a';
  if (n <= 2 || n === 5) { for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .3 + v * .1; let x0 = 32, y0 = 48; for (let k = 0; k < 14; k++) { const x1 = x0 + Math.cos(a) * 3, y1 = y0 + Math.sin(a) * 3 + k * .18; px.l(x0, y0, x1, y1, c, 2); if (k % 2) { px.p(x1 + 2, y1 + 1, c); px.p(x1 - 2, y1 + 1, c); } x0 = x1; y0 = y1; } } }
  else if (n === 3 || n === 13) { for (let i = 0; i < 4; i++) px.circ(10 + i * 14, 44 - (i % 2) * 4, 10, c); }
  else if (n === 9) { for (let i = 0; i < 5; i++) { let x = 12 + i * 9, y = 48; for (let k = 0; k < 10; k++) { const nx = x + Math.sin(k * .8 + i + v) * 2.5, ny = y - 4; px.l(x, y, nx, ny, c, 2); if (k % 3 === 1) px.l(nx, ny, nx + 4, ny - 2, c); x = nx; y = ny; } } }
  else { px.poly([[0, 48], [10, 30], [22, 36], [30, 24], [44, 34], [56, 28], [64, 48]], c); }
});
function decorSprite(n, v) {
  return G.sprite('dec:' + n + ':' + v, 24, 24, px => {
    const b = G.BIOMES[n], t = b.tile;
    if (n <= 2 || n === 5) { const c = n === 5 ? '#d8a83a' : '#2e6a2e', c2 = n === 5 ? '#ffe08a' : '#6aaa4a';
      if (v === 0) { for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * .35; px.l(12, 24, 12 + Math.cos(a) * 11, 24 + Math.sin(a) * 11 + 3, i % 2 ? c : c2); } }
      else if (v === 1) { px.l(12, 24, 12, 14, c); px.circ(12, 12, 2, n === 5 ? '#fff1c0' : '#e8708a'); px.p(12, 12, '#ffffff'); px.l(12, 20, 15, 17, c2); }
      else { for (let i = 0; i < 5; i++) px.l(6 + i * 3, 24, 5 + i * 3 + (i % 2), 16 + (i % 3) * 2, c2); } }
    else if (n === 3) { px.ell(12, 21, 9, 3, '#ffffff'); px.ell(8, 19, 4, 3, '#ffffff'); }
    else if (n === 4) { px.poly([[6, 24], [9, 14], [12, 24]], '#3a3a48'); px.poly([[12, 24], [16, 17], [19, 24]], '#2e2e3a'); }
    else if (n === 6 || n === 7 || n === 8) { const c = n === 6 ? '#a8b8d8' : n === 7 ? '#8a7ad8' : '#7ad8f0'; px.poly([[9, 24], [12, 10 + v * 3], [15, 24]], c); px.l(12, 12 + v * 3, 11, 23, '#ffffff'); if (v === 2) px.poly([[14, 24], [17, 16], [19, 24]], c); }
    else if (n === 9) { for (let i = 0; i < 3; i++) { let x = 8 + i * 4, y = 24; for (let k = 0; k < 6; k++) { const nx = x + Math.sin(k + i) * 2, ny = y - 3; px.l(x, y, nx, ny, '#0a040a'); if (k % 2) px.p(nx + 1, ny, '#7a2a5a'); x = nx; y = ny; } } }
    else if (n === 10) { px.r(6, 18, 6, 6, '#8a8078'); px.r(13, 20, 5, 4, '#a89e94'); px.p(8, 19, '#c8beb0'); }
    else if (n === 11) { px.l(10, 24, 13, 12, '#3a2414', 2); px.l(15, 24, 12, 14, '#3a2414', 2); if (v === 1) { px.p(12, 22, '#ff8a3a'); px.p(14, 21, '#f2c14e'); } }
    else { px.r(10, 10, 4, 14, '#c8a060'); px.poly([[9, 10], [12, 6], [15, 10]], '#f2c14e'); px.p(12, 14, '#fff1c0'); }
  });
}
W.draw = (ctx, cam, t) => {
  const L = W.L, P = W.P, b = L.b, cx = Math.round(cam.x), cy = Math.round(cam.y), tiles = b.tiles;
  G.drawBackground(ctx, b, cx, cy, t, L.H * T);
  W.heavenBack && W.heavenBack(ctx, cx, cy, t); W.whiroPresence(ctx, cx, cy, t); // Whiro watches from behind the heaven (Rangi 3) and speaks (Rangi 6)
  // decor
  for (const d of L.decor) { const x = d.x - cx - 4, y = d.y - cy - 24; if (x < -24 || x > G.VW || y < -24 || y > G.PH) continue; ctx.drawImage(decorSprite(b.idx, d.v).r, x, y); }
  // tiles
  const x0 = Math.max(0, Math.floor(cx / T)), x1 = Math.min(L.W - 1, Math.floor((cx + G.VW) / T) + 1), y0 = Math.max(0, Math.floor(cy / T)), y1 = Math.min(L.H - 1, Math.floor((cy + G.PH) / T) + 1);
  const edge = G.mixHex(b.tile.body, '#000000', .55);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const v = L.g[ty][tx]; if (!v) continue; const x = tx * T - cx, y = ty * T - cy, h = (tx * 73856093 ^ ty * 19349663) >>> 0;
    if (v === 1) {
      const top = !solidT(W.tile(tx, ty - 1)); ctx.drawImage(top ? tiles.top[h % 3] : tiles.in[h % 3], x, y);
      ctx.fillStyle = edge; if (!solidT(W.tile(tx - 1, ty))) ctx.fillRect(x, y, 1, T); if (!solidT(W.tile(tx + 1, ty))) ctx.fillRect(x + T - 1, y, 1, T); if (!solidT(W.tile(tx, ty + 1))) ctx.fillRect(x, y + T - 2, T, 2);
    } else if (v === 2) ctx.drawImage(tiles.plat, x, y);
    else if (v === 3) ctx.drawImage(tiles.spike, x, y);
    else if (v === 4) ctx.drawImage(tiles.vine, x, y);
    else if (v === 5) { ctx.fillStyle = G.alpha('#f2c14e', .25 + .15 * Math.sin(t * .1 + ty)); ctx.fillRect(x + 4, y, 8, T); ctx.fillStyle = G.alpha('#fff1c0', .6); ctx.fillRect(x + 7, y, 2, T); }
    else if (v === 6) ctx.drawImage(doorSprite().r, x, y);
    else if (v >= 8 && W.drawTileX) W.drawTileX(ctx, x, y, tx, ty, t, v);
  }
  // updraft shimmer
  for (const u of L.updrafts) { const x = u.x - cx, y = u.y - cy; if (x < -20 || x > G.VW) continue; for (let i = 0; i < 4; i++) { const yy = (t * 2 + i * 44) % u.h; ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x + 3 + i * 3, y + u.h - yy, 1, 10); } }
  // glyph stones and carved signs
  for (const sw of L.switches) { const x = sw.x - cx - 1, y = sw.y - cy - 2 + (sw.on ? 0 : Math.sin(t * .05 + sw.x) * 1); if (x < -40 || x > G.VW + 40) continue; if (sw.bird) { W.drawCage && W.drawCage(ctx, sw, sw.x - cx, sw.y - cy, t); continue; } ctx.drawImage(stoneSprite(sw.on).r, x, y); if (!sw.on) G.glow(ctx, x + 7, y + 8, 9, '#f2c14e', .18 + .12 * Math.sin(t * .1)); }
  for (const sg of L.signs) { const x = sg.x - cx, y = sg.y - cy; if (x < -20 || x > G.VW + 20) continue; ctx.drawImage(signSprite().r, x, y); }
  // pou + gate + shrine
  for (const p of L.pous) { const x = p.x - cx, y = p.y - cy; if (x < -20 || x > G.VW + 20) continue; ctx.drawImage(G.pouSprite(p.lit).r, x, y); }
  if (L.gate) { const g = L.gate, x = g.x - cx, y = g.y - cy - 64; ctx.drawImage(G.gateSprite(g.open).r, x, y); if (g.open) { ctx.fillStyle = G.alpha('#fff1c0', .25 + .1 * Math.sin(t * .08)); ctx.fillRect(x + 12, y + 16, 24, 48); } }
  if (L.shrine && !L.shrine.taken) { const s = L.shrine, x = s.x - cx, y = s.y - cy + Math.sin(t * .05) * 2; ctx.drawImage(G.itemSprite('shrine').r, x, y); if (s.ab === 'wings') { const kb = G.kereruSprite(Math.floor(t / 6) % 2); ctx.drawImage(kb.l, x + 2, y - 12); } else ctx.drawImage(G.icon(s.ab).r, x + 2, y - 14); }
  // items
  for (const it of L.items) { const x = it.x - cx - 2, y = it.y - cy - 2 + Math.sin(t * .07 + it.ph) * 1.5; if (x < -20 || x > G.VW + 20 || y < -20 || y > G.PH + 20) continue; ctx.drawImage(G.itemSprite(it.k).r, x, y); }
  // enemies
  for (const e of L.enemies) {
    const sx = e.x - cx, sy = e.y - cy; if (sx < -40 || sx > G.VW + 40 || sy < -60 || sy > G.PH + 40) continue;
    let f = Math.floor(e.t / 8) % 4, v = e.v;
    if (e.type === 'liz' && e.st === 'lunge') { const sp = G.enemySprite('lizL', 0, v); ctx.drawImage(e.face > 0 ? sp.r : sp.l, Math.round(sx + e.w / 2 - sp.w / 2), Math.round(sy + e.h - sp.h + 2)); continue; }
    if (e.type === 'weta') f = e.st === 'crouch' ? 2 : e.on ? 0 : 1;
    if (e.type === 'bird') v = e.st === 'dive' ? 'd' : '';
    if (e.type === 'mos') f = Math.floor(e.t / 2) % 2;
    if (e.type === 'spirit') f = Math.floor(e.t / 6) % 3;
    if (e.type === 'stalk') { v = e.st === 'hidden' ? 'h' : ''; f = e.st === 'lunge' ? 2 : Math.floor(e.t / 8) % 2; }
    if (e.type === 'spider') { if (e.st === 'hang' || e.st === 'drop') { ctx.strokeStyle = 'rgba(230,230,230,.35)'; ctx.beginPath(); ctx.moveTo(sx + e.w / 2, e.anchor - cy); ctx.lineTo(sx + e.w / 2, sy); ctx.stroke(); } f = Math.floor(e.t / 6) % 2; }
    if (e.type === 'guard') { f = Math.abs(e.vx) > .05 ? Math.floor(e.t / 12) % 2 : 0; }
    if (e.type === 'warrior') { v = e.st === 'attack' ? 'a' : e.st === 'block' ? 'b' : ''; f = Math.abs(e.vx) > .1 ? Math.floor(e.t / 8) % 2 : 0; }
    if (e.type === 'horror') { v = e.st === 'lurk' ? 'h' : ''; f = Math.floor(e.t / 6) % 2; if (e.st === 'lurk') { G.glow(ctx, sx + 7, sy + 6, 6, '#e8ffd0', .35); G.glow(ctx, sx + 15, sy + 6, 6, '#e8ffd0', .35); } }
    if (e.type === 'beast') { v = e.st === 'charge' ? 'c' : e.st === 'tell' ? 't' : e.st === 'dazed' ? 'd' : ''; f = Math.floor(e.t / (e.st === 'charge' ? 3 : 8)) % 4; if (e.st === 'tell') G.glow(ctx, sx + e.w / 2 + e.face * 10, sy + 4, 14, '#c8b8ff', .5); }
    const sp = G.enemySprite(e.type, f, v); if (!sp) continue;
    const img = e.face > 0 ? sp.r : sp.l, dx = Math.round(sx + e.w / 2 - sp.w / 2), dy = Math.round(sy + e.h - sp.h + (e.type === 'liz' ? 3 : e.type === 'guard' ? 2 : e.type === 'warrior' ? 3 : 2));
    ctx.drawImage(e.flash > 0 && e.flash % 2 ? G.tint(img, '#ffffff') : img, dx, dy);
    if (e.type === 'stalk' && e.st === 'hidden') G.glow(ctx, sx + 16, sy + 3, 6, '#ff4a3a', .4);
  }
  if (G.Boss && G.Boss.active) G.Boss.draw(ctx, cx, cy, t);
  // player
  W.drawPlayer(ctx, cx, cy, t);
  W.drawKereru(ctx, cx, cy, t);
  W.heavenFront && W.heavenFront(ctx, cx, cy, t);
  // shallow water reflects whatever stands above it
  { const src = ctx.canvas, col = WATER[L.n] || '#2a5a7a';
    for (let ty = y0; ty <= y1; ty++) { let tx = x0; while (tx <= x1) { if (L.g[ty][tx] !== 7) { tx++; continue; } let ex = tx; while (ex + 1 <= x1 && L.g[ty][ex + 1] === 7) ex++;
      const X = Math.max(0, tx * T - cx), X2 = Math.min(G.VW, (ex + 1) * T - cx), Y = ty * T - cy, Wd = X2 - X; tx = ex + 1; if (Wd <= 0 || Y < 2 || Y > G.PH) continue;
      ctx.fillStyle = col; ctx.fillRect(X, Y, Wd, T);
      for (let k = 0; k < T; k += 2) { const off = Math.round(Math.sin(t * .07 + k * .8) * 1.5), sy = Y - 2 - k; if (sy < 0) break; ctx.globalAlpha = .6 * (1 - k / T); ctx.drawImage(src, X, sy, Wd, 2, X + off, Y + k, Wd, 2); }
      ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(X, Y, Wd, 1);
      for (let i = 0; i < Wd; i += 9) if (Math.sin(t * .05 + i + ty) > .7) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(X + i + (t >> 3) % 5, Y + 3 + (i % 4) * 3, 3, 1); } } } }
  // bolts & shots
  for (const bl of L.bolts) { const x = bl.x - cx, y = bl.y - cy; ctx.fillStyle = bl.charged ? '#fff1c0' : '#c8fbff'; ctx.fillRect(x, y, bl.w, bl.h); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + (bl.vx > 0 ? bl.w - 3 : 0), y, 3, bl.h); }
  for (const s of L.shots) { const x = s.x - cx, y = s.y - cy;
    if (s.k === 'wave') { ctx.fillStyle = s.c; for (let i = 0; i < s.w; i += 3) { const hh = s.h * (.5 + .5 * Math.abs(Math.sin((t + i) * .4))); ctx.fillRect(x + i, y + s.h - hh, 3, hh); } ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y + s.h - 1, s.w, 1); continue; }
    if (s.k === 'fist') { ctx.fillStyle = '#4a3e2e'; ctx.fillRect(x, y, s.w, s.h); ctx.fillStyle = s.c; ctx.fillRect(x + 2, y + 2, s.w - 4, s.h - 4); ctx.fillStyle = '#f2c14e'; ctx.fillRect(x, y, s.w, 2); continue; }
    ctx.fillStyle = s.c || '#9a4aff'; ctx.beginPath(); ctx.arc(x + s.w / 2, y + s.h / 2, s.w / 2 + 1, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + s.w / 2 - 1, y + s.h / 2 - 1, 2, 2); }
  G.fx.draw(ctx, cx, cy);
  G.weather.draw(ctx, t, cx, cy);
  // foreground layer: soft silhouettes that pass in front of the action at the screen's foot
  ctx.save(); ctx.globalAlpha = .82;
  for (let i = 0; i < 3; i++) { const fx = ((i * 307 - cx * 1.35) % 1000 + 1000) % 1000 - 120; ctx.drawImage(fgSprite(b.idx, i % 2).r, fx, G.PH - 34 + (i % 2) * 6, 96, 72); }
  ctx.restore();
  // lighting
  const dark = Math.min(.95, b.dark + (G.Boss && G.Boss.darkness || 0) + (W.extraDark || 0));
  G.light.begin(b.amb, dark);
  if (dark > 0) {
    G.light.add(P.x + 5 - cx, P.y + 10 - cy, (P.power ? 120 : 80) * (G.Boss && G.Boss.lightScale || 1) * (W.lightMul || 1), 1); W.extraLights && W.extraLights(cx, cy);
    for (const it of L.items) if (it.k !== 'kumara') G.light.add(it.x + 6 - cx, it.y + 6 - cy, 30, .8);
    for (const p of L.pous) G.light.add(p.x + 8 - cx, p.y + 8 - cy, p.lit ? 70 : 26, .9);
    for (const sw of L.switches) G.light.add(sw.x + 6 - cx, sw.y + 6 - cy, sw.on ? 40 : 22, .8);
    for (const bl of L.bolts) G.light.add(bl.x - cx, bl.y - cy, 46, 1);
    for (const s of L.shots) G.light.add(s.x - cx, s.y - cy, 20, .6);
    if (L.gate) G.light.add(L.gate.x + 24 - cx, L.gate.y - 30 - cy, 80, .9);
    if (G.Boss && G.Boss.lights) G.Boss.lights(cx, cy);
  }
  G.light.end(ctx);
  // additive glows after light
  for (const bl of L.bolts) G.glow(ctx, bl.x + bl.w / 2 - cx, bl.y - cy, bl.charged ? 20 : 12, bl.charged ? '#fff1c0' : '#7fe6f0', .7);
  for (const s of L.shots) G.glow(ctx, s.x + 3 - cx, s.y + 3 - cy, 10, s.c || '#9a4aff', .5);
  for (const it of L.items) if (it.k !== 'kumara') G.glow(ctx, it.x + 6 - cx, it.y + 6 - cy, 10, it.k === 'mana' ? '#7fe6f0' : it.k === 'relic' ? '#58d39a' : '#f2c14e', .35 + .15 * Math.sin(t * .08 + it.ph));
  if (P.charge > 18) G.glow(ctx, P.x + 5 + P.face * 12 - cx, P.y + 9 - cy, P.charge >= 45 ? 18 : 10, G.S.ab.includes('spear') ? '#fff1c0' : '#7fe6f0', .8);
  if (P.power) G.glow(ctx, P.x + 5 - cx, P.y + 10 - cy, 30, '#f2c14e', .35);
};
/* ---- the kererū: freed in Rangi 2's story, it follows Tāne once he has its gift (the double jump) ---- */
const K = W.kereru = { x: 0, y: 0, vx: 0, vy: 0, idle: 0, init: false, face: 1 };
W.drawKereru = (ctx, cx, cy, t) => {
  const P = W.P; if (!P || !G.S.ab.includes('wings')) return;
  if (!K.init || Math.abs(K.x - P.x) > 300 || Math.abs(K.y - P.y) > 300) { K.x = P.x - 14 * P.face; K.y = P.y - 14; K.init = true; }
  const still = P.on && Math.abs(P.vx) < .1 && !P.atk; K.idle = still ? K.idle + 1 : 0;
  let tx, ty; const perch = K.idle > 70;
  if (P.djT > 0) { tx = P.x + 5; ty = P.y + P.h + 4; }                          // under his feet: the lift
  else if (perch) { tx = P.x + 5 + P.face * 9; ty = P.y - 9; }                    // perched on the taiaha
  else { tx = P.x + 5 - P.face * 16; ty = P.y - 12 + Math.sin(t * .08) * 3; }      // flying behind
  const k = perch ? .2 : .09; K.vx = (tx - K.x) * k; K.vy = (ty - K.y) * k; K.x += K.vx; K.y += K.vy;
  if (Math.abs(K.vx) > .3) K.face = Math.sign(K.vx); else if (perch) K.face = P.face;
  const flap = perch ? 0 : Math.floor(t / 4) % 2; const sp = G.kereruSprite(flap);
  ctx.drawImage(K.face > 0 ? sp.r : sp.l, Math.round(K.x - 6 - cx), Math.round(K.y - 5 - cy));
};
/* ---- Whiro's presence before the final heaven ---- */
W.whiroPresence = (ctx, cx, cy, t) => {
  const L = W.L, P = W.P; if (!L || !P) return; const x1 = L.arena ? L.arena.x0 : L.gate.x, prog = (P.x - L.start.x) / Math.max(1, x1 - L.start.x);
  if (L.n === 3 && !L.whiroGone) {                     // a dark shape watching from below the clouds
    if (L.whiroX === undefined) { L.whiroX = L.start.x + (x1 - L.start.x) * .42; L.whiroA = 0; }
    const d = Math.abs(P.x - L.whiroX); L.whiroA = G.clamp(L.whiroA + (d < 260 && d > 90 ? .02 : -.03), 0, .55);
    if (d < 90 && L.whiroA <= 0) L.whiroGone = true;
    if (L.whiroA > 0) { const w = G.bossSprite('whiro', Math.floor(t / 10) % 4); ctx.save(); ctx.globalAlpha = L.whiroA; const wy = 112 + Math.sin(t * .02) * 4; ctx.drawImage(G.tint(w.l, '#1a0c22'), Math.round(L.whiroX - cx - 24), Math.round(wy)); ctx.restore(); G.glow(ctx, L.whiroX - cx - 5, wy + 10, 5, '#ff3a2a', L.whiroA * .9); G.glow(ctx, L.whiroX - cx + 2, wy + 10, 5, '#ff3a2a', L.whiroA * .9); }
  }
  if (L.n === 6 && !L.whiroSpoke && prog > .45 && G.S.mode === 'play') {
    L.whiroSpoke = true; G.audio.sfx('roar', .35); G.audio.duck(.4, 1.5, 2); G.shake(2);
    G.toast('\u201cYou tore our parents apart. The kete are mine by birth.\u201d', 'Whiro, the elder brother, somewhere in the dark');
  }
};
W.drawPlayer = (ctx, cx, cy, t) => {
  const P = W.P; if (P.inv > 0 && P.hurtT <= 0 && Math.floor(P.inv / 3) % 2 && G.S.mode === 'play') return;
  let pose = 'idle', f = Math.floor(t / 10) % 4;
  const runF = Math.floor(P.anim) % 8;
  if (P.collectT > 0) pose = 'collect';
  else if (P.hurtT > 0) pose = 'hurt';
  else if (P.st === 'climb') { pose = 'climb'; f = Math.floor(P.anim) % 4; }
  else if (P.st === 'hang') pose = 'hang';
  else if (P.st === 'climbup') pose = P.stT > 7 ? 'hang' : 'crouch';
  else if (P.st === 'roll') { pose = 'roll'; f = Math.floor((22 - P.roll) / 22 * 6) % 6; }
  else if (P.st === 'slide') pose = 'slide';
  else if (P.st === 'dash') pose = 'run', f = 2;
  else if (P.st === 'crouch') pose = 'crouch';
  else if (P.atk) { const a = P.atk; if (a.kind === 'heavy') { pose = 'heavy'; f = Math.min(4, Math.floor(P.atkT / 26 * 5)); } else if (a.kind === 'air') { pose = 'air'; f = Math.min(3, Math.floor(P.atkT / 16 * 4)); } else { pose = 'atk' + a.kind[1]; f = Math.min(3, Math.floor(P.atkT / 10 * 4)); } }
  else if (P.burstT > 0) { pose = 'burst'; P.burstT--; }
  else if (P.charge > 6) { pose = 'charge'; f = Math.min(2, Math.floor(P.charge / 20)); }
  else if (P.shootT > 0) { pose = 'shoot'; P.shootT--; }
  else if (P.wallDir) pose = 'wall';
  else if (!P.on) { if (P.djT > 0) { pose = 'djump'; f = 7 - P.djT; P.djT--; } else pose = P.vy < 0 ? 'jump' : 'fall'; }
  else if (P.landT > 3) pose = 'land';
  else if (Math.abs(P.vx) > 1.3) { pose = 'run'; f = runF; }
  else if (Math.abs(P.vx) > .15) { pose = 'walk'; f = runF; }
  if (G.forcePose) { pose = G.forcePose; f = G.forceF || 0; }
  const sp = G.tane(pose, f, P.power), face = P.wallDir ? P.wallDir : P.face;
  const x = Math.round(P.x + 5 - 24 - cx), y = Math.round(P.y + P.h - 44 - cy + (P.h === 12 ? 0 : 0));
  if (P.power) G.glow(ctx, P.x + 5 - cx, P.y + 10 - cy, 22, '#ffe08a', .4);
  ctx.drawImage(face > 0 ? sp.r : sp.l, x, y);
  if (G.S.ab.includes('shield') && P.shieldT <= 0) { ctx.strokeStyle = G.alpha('#7fd36a', .25 + .1 * Math.sin(t * .1)); ctx.beginPath(); ctx.ellipse(P.x + 5 - cx, P.y + P.h / 2 - cy, 12, P.h / 2 + 4, 0, 0, 7); ctx.stroke(); }
  if (P.hurtT > 12) { ctx.save(); ctx.globalAlpha = .6; ctx.drawImage(G.tint(face > 0 ? sp.r : sp.l, '#ffffff'), x, y); ctx.restore(); }
};
})();
