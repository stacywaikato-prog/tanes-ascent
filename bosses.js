/* Tāne's Ascent — guardians of the heavens and Whiro */
(() => {
const G = window.G, PI = Math.PI, T = 16;
const B = G.Boss = { active: false, b: null, darkness: 0, lightScale: 1 };
const INFO = {
  ngarara: { name: 'Guardian Ngārara', line: 'Bound by Whiro to guard this heaven. Its scales turn light aside. Make it charge the wall.', hp: 32, reward: 'dash' },
  moonkeeper: { name: 'Keeper of the Moon Gate', line: 'It tests all who climb and serves no one. Strike its four moons, then the keeper.', hp: 30, reward: 'burst' },
  champion: { name: "Whiro's Shadow Champion", line: 'It blocks from the front. Strike after it lunges, from behind, or with a heavy strike.', hp: 36, reward: 'spear' },
  gatekeeper: { name: 'Gatekeeper of Toi-o-ngā-Rangi', line: 'Only the worthy pass. Its heart opens after it strikes the ground.', hp: 40, reward: null },
  whiro: { name: 'Whiro', line: 'The elder brother. He never forgave the parting. He will not let the kete go.', hp: 120, reward: null }
};
B.INFO = INFO;
const P = () => G.World.P, L = () => G.World.L;
const shot = o => L().shots.push(Object.assign({ w: 7, h: 7, life: 180, dmg: 14, c: '#9a4aff' }, o));
const aim = (x, y, sp) => { const p = P(), a = Math.atan2(p.y + 11 - y, p.x + 5 - x); return [Math.cos(a) * sp, Math.sin(a) * sp]; };

B.start = kind => {
  const A = L().arena, inf = INFO[kind];
  for (let y = A.rows[0]; y < A.rows[1]; y++) L().g[y][A.col0] = 5;
  const b = B.b = { kind, name: inf.name, hp: Math.round(inf.hp * G.diff().boss), max: Math.round(inf.hp * G.diff().boss), t: 0, st: 'idle', stT: 90, face: -1, flash: 0, phase: 1, A, hz: [] };
  const fl = A.floor;
  if (kind === 'ngarara') Object.assign(b, { w: 64, h: 28, x: A.x1 - 120, y: fl - 28 });
  if (kind === 'moonkeeper') Object.assign(b, { w: 40, h: 40, cx: (A.x0 + A.x1) / 2, cy: fl - 92, x: 0, y: 0, orbs: [2, 2, 2, 2], orbA: 0, open: 0 });
  if (kind === 'champion') Object.assign(b, { w: 14, h: 34, x: A.x1 - 100, y: fl - 34, vx: 0, vy: 0 });
  if (kind === 'gatekeeper') Object.assign(b, { w: 60, h: 100, x: A.x1 - 110, y: fl - 100, open: 0 });
  if (kind === 'whiro') Object.assign(b, { w: 22, h: 50, x: A.x1 - 120, y: fl - 64, vx: 0, vy: 0, motes: [], got: 0 });
  B.active = true; B.darkness = 0; B.lightScale = 1;
  G.S.mode = 'bossintro'; B.intro = { t: 0, name: inf.name, line: inf.line };
  G.audio.setMood({ whiro: 'final', ngarara: 'boss', moonkeeper: 'boss2', champion: 'boss3', gatekeeper: 'boss4' }[kind], 1.6); G.audio.sfx('barrier'); G.audio.sfx(kind === 'moonkeeper' ? 'beam' : 'roar'); G.audio.duck(.45, 1.2, 1.5);
};
B.end = () => { B.active = false; B.b = null; B.darkness = 0; B.lightScale = 1; };

/* ---------- damage ---------- */
B.hitTest = (box, dmg, atk, o) => {
  const b = B.b; if (!b || G.S.mode !== 'play' || b.dying) return false;
  const key = 'boss'; if (atk.hit.has(key)) return false;
  let hb = { x: b.x, y: b.y, w: b.w, h: b.h }, mult = 1, blocked = false;
  if (b.kind === 'moonkeeper') {
    for (let i = 0; i < 4; i++) { if (b.orbs[i] <= 0) continue; const op = orbPos(b, i), ob = { x: op[0] - 6, y: op[1] - 6, w: 12, h: 12 };
      if (G.hit(box, ob)) { atk.hit.add(key); if (o.proj && !o.charged) { G.audio.sfx('blocked', 1, { x: op[0] }); G.fx.burst(op[0], op[1], '#bcd7ff', 6, 1.5); return true; } b.orbs[i] -= o.heavy || o.charged ? 2 : 1; G.audio.sfx('stonehit', 1, { x: op[0] }); G.fx.burst(op[0], op[1], '#dde8ff', 10, 2); if (b.orbs[i] <= 0) { G.fx.ring(op[0], op[1], '#ffffff', 20); G.audio.sfx('shatter', 1, { x: op[0] }); } if (b.orbs.every(v => v <= 0)) { b.open = 300; b.st = 'open'; G.audio.sfx('coreopen'); G.audio.sfx('stun'); } return true; } }
    hb = { x: b.cx - 18, y: b.cy - 18, w: 36, h: 36 }; if (!b.open) blocked = true;
  }
  if (b.kind === 'ngarara') { if (b.st === 'stun') mult = 3; else mult = .5; }
  if (b.kind === 'champion' && b.st === 'guard') { const front = Math.sign(P().x + 5 - (b.x + b.w / 2)) === b.face; if (front && !o.heavy && !o.charged && !o.burst) { blocked = true; b.counter = true; } else if (front) { b.st = 'stagger'; b.stT = 70; G.audio.sfx('guardbreak', 1, { x: b.x }); } }
  if (b.kind === 'champion' && b.st === 'recover') mult = 1.5;
  if (b.kind === 'gatekeeper') { hb = { x: b.x + 21, y: b.y + 38, w: 18, h: 18 }; if (!b.open) { if (G.hit(box, { x: b.x, y: b.y, w: b.w, h: b.h })) { atk.hit.add(key); G.audio.sfx('stonehit', .7, { x: b.x + 30 }); G.fx.burst(box.x + box.w / 2, box.y + box.h / 2, '#c8a060', 4, 1); return true; } return false; } }
  if (b.kind === 'whiro' && b.phase === 3 && !G.World.P.power) blocked = true;
  if (!G.hit(box, hb)) return false;
  atk.hit.add(key);
  if (blocked) { G.audio.sfx('blocked', 1, { x: hb.x }); G.fx.burst(box.x + box.w / 2, box.y + box.h / 2, '#ffffff', 6, 2); return true; }
  b.hp -= dmg * mult; b.flash = 6; G.audio.sfx(mult > 1 ? 'crit' : 'bosshit', 1, { x: hb.x + hb.w / 2 }); if (mult > 1) G.audio.sfx('bosshit', .8, { x: hb.x }); G.fx.burst(hb.x + hb.w / 2, hb.y + hb.h / 2, b.kind === 'whiro' || b.kind === 'champion' ? '#7a2a9a' : '#fff1c0', 10, 2.5);
  G.S.score += 10;
  if (b.hp <= 0) defeat(b);
  return true;
};
function defeat(b) {
  if (b.kind === 'whiro' && b.phase < 4) { b.hp = 1; return; }
  b.hp = 0; b.dying = 120; G.slowmo = 90; G.audio.sfx('bossdie'); G.audio.duck(.3, 2, 2); G.audio.setMood('none', 2.5); G.shake(10);
  L().shots = [];
}
function finish(b) {
  const A = b.A, inf = INFO[b.kind];
  for (let y = A.rows[0]; y < A.rows[1]; y++) L().g[y][A.col0] = 0;
  G.S.score += 5000; G.S.bosses.push(b.kind); L().bossDone = true; G.audio.sfx('barrier', .7); G.audio.sfx('gateopen');
  L().gate.open = true; L().enemies = [];
  B.end();
  if (b.kind === 'whiro') { G.startEnding(); return; }
  G.audio.setMood('h' + L().n, 3.5);
  G.toast(inf.name + ' falls', 'The way upward opens.');
  if (inf.reward) G.after(54, () => G.grantAbility(inf.reward));
  G.save('auto');
}

/* ---------- per-boss AI ---------- */
function orbPos(b, i) { const a = b.orbA + i * PI / 2; return [b.cx + Math.cos(a) * 34, b.cy + Math.sin(a) * 34]; }
B.update = () => {
  const b = B.b; if (!b) return; G.World.curSrc = b.kind; b.t++; if (b.flash > 0) b.flash--; if (b.stT > 0) b.stT--;
  const p = P(), px = p.x + 5, A = b.A, fl = A.floor;
  if (b.dying) { b.dying--; if (b.dying % 6 === 0) G.fx.burst(b.x + Math.random() * b.w, b.y + Math.random() * b.h, '#fff1c0', 10, 3, { k: 'glow', g: 0 }); if (b.dying <= 0) { G.fx.burst(b.x + b.w / 2, b.y + b.h / 2, '#ffffff', 60, 5, { k: 'glow' }); finish(b); } return; }
  const hp = b.hp / b.max;
  // hazards (beams, pillars)
  for (const h of b.hz) { h.t--; if (h.t === h.live && h.live > 0) G.audio.sfx(h.kind === 'pillar' ? 'pillar' : 'beam', 1, { x: h.x }); if (h.t < h.live && h.t > 0 && G.hit(p, h)) G.World.hurtPlayer(h.dmg, h.x + h.w / 2); }
  b.hz = b.hz.filter(h => h.t > 0);
  switch (b.kind) {
    case 'ngarara': {
      if (hp < .5 && b.phase === 1) { b.phase = 2; G.bossBanner('The guardian rages'); for (let i = 0; i < 2; i++) L().enemies.push(G.World.mkEnemy('liz', A.x0 + 40 + i * 200, fl - 16, 6)); }
      const sp = b.phase === 2 ? 1.35 : 1;
      if (b.st === 'idle') { b.face = Math.sign(px - (b.x + b.w / 2)) || b.face; b.x += b.face * .5 * sp; if (b.stT <= 0) { const r = Math.random(); if (r < .45) { b.st = 'wind'; b.stT = 40; G.audio.sfx('warn'); } else if (r < .8) { b.st = 'spit'; b.stT = 50; } else { b.st = 'tail'; b.stT = 40; } } }
      else if (b.st === 'wind') { b.x += Math.sin(b.t) * 1.2; if (b.stT <= 0) { b.st = 'charge'; b.face = Math.sign(px - (b.x + b.w / 2)) || b.face; G.audio.sfx('roar', .6, { x: b.x }); } }
      else if (b.st === 'charge') { b.x += b.face * 4.2 * sp; if (b.t % 3 === 0) G.fx.add({ x: b.x + b.w / 2 - b.face * 30, y: fl - 2, vx: -b.face, vy: -1, c: '#c8b8a0', life: 16 }); if (b.x < A.x0 + 18 || b.x + b.w > A.x1 - 18) { b.x = G.clamp(b.x, A.x0 + 18, A.x1 - 18 - b.w); b.st = 'stun'; b.stT = b.phase === 2 ? 110 : 150; G.shake(10); G.audio.sfx('slam'); G.audio.sfx('stun'); for (let i = 0; i < 6; i++) shot({ x: A.x0 + 30 + Math.random() * (A.x1 - A.x0 - 60), y: A.top + 20, vx: 0, vy: 1, ay: .15, w: 8, h: 8, c: '#8a7a6a', dmg: 10, life: 200 }); } }
      else if (b.st === 'spit') { if (b.stT === 30 || (b.phase === 2 && b.stT === 15)) { const n = b.phase === 2 ? 5 : 3; for (let i = 0; i < n; i++) { const mx = b.face > 0 ? b.x + b.w : b.x; shot({ x: mx, y: b.y + 4, vx: b.face * (1.4 + i * .7), vy: -3.5 - i * .3, ay: .14, c: '#9ad84a', dmg: 12 }); } G.audio.sfx('shot'); } if (b.stT <= 0) { b.st = 'idle'; b.stT = 50; } }
      else if (b.st === 'tail') { if (b.stT === 20) { G.audio.sfx('tail', 1, { x: b.x }); const tx = b.face > 0 ? b.x - 40 : b.x + b.w; shot({ x: tx, y: fl - 10, w: 40, h: 10, vx: 0, vy: 0, life: 10, ghost: true, c: '#3f7a46', dmg: 14, k: 'wave' }); [-1, 1].forEach(d => shot({ x: b.x + b.w / 2, y: fl - 8, w: 10, h: 8, vx: d * 2.6, vy: 0, life: 90, c: '#c8b8a0', dmg: 12, k: 'wave' })); } if (b.stT <= 0) { b.st = 'idle'; b.stT = 40; } }
      else if (b.st === 'stun') { if (b.stT <= 0) { b.st = 'idle'; b.stT = 50; } }
      break;
    }
    case 'moonkeeper': {
      if (hp < .5 && b.phase === 1) { b.phase = 2; G.bossBanner('The moons quicken'); }
      b.orbA += b.phase === 2 ? .035 : .02;
      const tgtY = b.open > 0 ? fl - 46 : fl - 92; b.cy += (tgtY - b.cy) * .05; b.cx = (A.x0 + A.x1) / 2 + Math.sin(b.t * .01) * 60;
      b.x = b.cx - 20; b.y = b.cy - 20;
      if (b.open > 0) { b.open--; if (b.open <= 0) { b.orbs = [2, 2, 2, 2]; b.st = 'idle'; b.stT = 60; G.audio.sfx('barrier', .6); } break; }
      if (b.stT <= 0) {
        const r = Math.random();
        if (r < .55) { const xs = b.phase === 2 ? [px - 6, px + (Math.random() < .5 ? -70 : 70)] : [px - 6]; xs.forEach(x => b.hz.push({ x, y: A.top, w: 14, h: fl - A.top, t: 80, live: 30, dmg: 18, kind: 'beam' })); G.audio.sfx('warn'); b.stT = 110; }
        else { const n = b.phase === 2 ? 12 : 8; for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + b.t * .01; shot({ x: b.cx, y: b.cy, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, c: '#bcd7ff', dmg: 12, ghost: true, life: 220 }); } G.audio.sfx('moonvolley'); b.stT = 90; }
      }
      break;
    }
    case 'champion': {
      if (hp < .5 && b.phase === 1) { b.phase = 2; G.bossBanner('The champion splits its shadow'); for (let i = 0; i < 2; i++) { const e = G.World.mkEnemy('warrior', A.x0 + 60 + i * 280, fl - 16, 4); e.hp = 3; e.v = 'c'; L().enemies.push(e); } }
      const dx = px - (b.x + b.w / 2), sp = b.phase === 2 ? 1.25 : 1;
      if (b.counter) { b.counter = false; if (b.st === 'guard' && Math.abs(dx) < 44) { b.st = 'slash'; b.stT = 16; } }
      if (b.st === 'idle') { b.face = Math.sign(dx) || b.face; const want = Math.abs(dx) > 70 ? 1 : Math.abs(dx) < 44 ? -1 : 0; b.x += b.face * want * 1.1 * sp;
        if (b.stT <= 0) { const r = Math.random(); if (r < .35) { b.st = 'wind'; b.stT = 26; G.audio.sfx('warn'); } else if (r < .6 && Math.abs(dx) < 70) { b.st = 'slash'; b.stT = 30; b.n = 3; } else if (r < .85) { b.st = 'guard'; b.stT = 90; } else if (b.phase === 2) { b.st = 'vanish'; b.stT = 40; G.audio.sfx('whisper'); } else { b.st = 'guard'; b.stT = 60; } } }
      else if (b.st === 'wind') { if (b.stT <= 0) { b.st = 'lunge'; b.stT = 34; b.vx = b.face * 5.2 * sp; G.audio.sfx('dash'); } }
      else if (b.st === 'lunge') { b.x += b.vx; b.vx *= .985; if (b.t % 2 === 0) G.fx.add({ x: b.x + b.w / 2, y: b.y + 10 + Math.random() * 20, c: '#4a1a5a', life: 16 }); if (G.hit(p, { x: b.x - 10, y: b.y, w: b.w + 20, h: b.h })) G.World.hurtPlayer(20, b.x + b.w / 2); if (b.stT <= 0 || b.x < A.x0 + 18 || b.x + b.w > A.x1 - 18) { b.st = 'recover'; b.stT = 60; } }
      else if (b.st === 'recover') { if (b.stT <= 0) { b.st = 'idle'; b.stT = 30; } }
      else if (b.st === 'slash') { if (b.stT % 10 === 5) { G.audio.sfx('shadowslash', 1, { x: b.x }); b.x += b.face * 6; const box = { x: b.face > 0 ? b.x + b.w : b.x - 28, y: b.y + 6, w: 28, h: 20 }; G.fx.slash(b.x + b.w / 2 + b.face * 12, b.y + 14, 0, b.face, '#c84aff'); if (G.hit(p, box)) G.World.hurtPlayer(16, b.x + b.w / 2); } if (b.stT <= 0) { b.st = 'idle'; b.stT = 40; } }
      else if (b.st === 'guard') { b.face = Math.sign(dx) || b.face; if (b.stT <= 0) { b.st = 'idle'; b.stT = 20; } }
      else if (b.st === 'stagger') { if (b.stT <= 0) { b.st = 'idle'; b.stT = 20; } }
      else if (b.st === 'vanish') { if (b.stT === 20) { b.x = G.clamp(px - p.face * 40, A.x0 + 20, A.x1 - 40); b.face = Math.sign(px - b.x) || 1; G.fx.burst(b.x + 7, b.y + 17, '#2a0a3a', 20, 2); } if (b.stT <= 0) { b.st = 'slash'; b.stT = 20; } }
      b.x = G.clamp(b.x, A.x0 + 18, A.x1 - 18 - b.w);
      break;
    }
    case 'gatekeeper': {
      if (hp < .5 && b.phase === 1) { b.phase = 2; G.bossBanner('Its eyes burn'); }
      if (b.open > 0) { b.open--; if (b.open <= 0) { b.st = 'idle'; b.stT = 60; } break; }
      if (b.st === 'idle' && b.stT <= 0) { const r = Math.random(); if (r < .45) { b.st = 'raise'; b.stT = 55; G.audio.sfx('warn'); } else if (r < .8) { b.st = 'sweep'; b.stT = 60; G.audio.sfx('warn'); } else if (b.phase === 2) { b.st = 'eyes'; b.stT = 90; } else { b.st = 'raise'; b.stT = 55; } }
      if (b.st === 'raise' && b.stT <= 0) { b.st = 'slam'; b.stT = 20; G.shake(14); G.audio.sfx('slam');
        [-1, 1].forEach(d => shot({ x: b.x + b.w / 2 - 5 + d * 30, y: fl - 12, w: 10, h: 12, vx: d * 2.8, vy: 0, life: 150, c: '#f2c14e', dmg: 16, k: 'wave' }));
        for (let i = 0; i < (b.phase === 2 ? 7 : 4); i++) { const x = A.x0 + 30 + Math.random() * (A.x1 - A.x0 - 160); b.hz.push({ x: x - 8, y: fl - 4, w: 16, h: 4, t: 50, live: 0, dmg: 0, kind: 'shadow' }); G.after(12, () => shot({ x, y: A.top, w: 10, h: 10, vx: 0, vy: 2, ay: .1, life: 120, c: '#a89070', dmg: 12 })); } }
      if (b.st === 'slam' && b.stT <= 0) { b.st = 'open'; b.open = 150; G.audio.sfx('coreopen'); }
      if (b.st === 'sweep') { if (b.stT === 30) { G.audio.sfx('sweep', 1, { x: b.x }); shot({ x: b.x - 10, y: fl - 44, w: 40, h: 16, vx: -4, vy: 0, life: 120, c: '#7a6a52', dmg: 18, ghost: true, k: 'fist' }); } if (b.stT <= 0) { b.st = 'idle'; b.stT = 70; } }
      if (b.st === 'eyes') { if (b.stT % 30 === 0) { b.hz.push({ x: px - 8, y: A.top, w: 16, h: fl - A.top, t: 60, live: 24, dmg: 16, kind: 'beam', gold: true }); G.audio.sfx('warn'); } if (b.stT <= 0) { b.st = 'idle'; b.stT = 40; } }
      if (b.st === 'idle' && Math.abs(px - (b.x + b.w / 2)) > 140) b.x += Math.sign(px - (b.x + b.w / 2)) * .25;
      b.x = G.clamp(b.x, A.x0 + 120, A.x1 - b.w - 30);
      break;
    }
    case 'whiro': whiroAI(b, p, px, A, fl); break;
  }
  // contact damage
  const body = b.kind === 'moonkeeper' ? { x: b.cx - 16, y: b.cy - 16, w: 32, h: 32 } : b;
  if (G.hit(p, body) && !(b.kind === 'ngarara' && b.st === 'stun')) G.World.hurtPlayer(b.kind === 'whiro' ? 20 : 16, b.x + b.w / 2);
  if (b.kind === 'moonkeeper') for (let i = 0; i < 4; i++) if (b.orbs[i] > 0) { const o = orbPos(b, i); if (G.hit(p, { x: o[0] - 5, y: o[1] - 5, w: 10, h: 10 })) G.World.hurtPlayer(10, o[0]); }
};

function whiroAI(b, p, px, A, fl) {
  const hp = b.hp / b.max, dx = px - (b.x + b.w / 2);
  if (b.phase === 1 && hp < .7) { b.phase = 2; b.st = 'idle'; b.stT = 60; G.bossBanner('Whiro opens the dark'); b.portals = [{ x: A.x0 + 30, y: fl - 90 }, { x: A.x1 - 50, y: fl - 90 }]; }
  if (b.phase === 2 && hp < .42) {
    b.phase = 3; b.st = 'shroud'; b.stT = 0; G.bossBanner('Darkness swallows the heavens'); G.audio.sfx('roar'); b.got = 0; b.motes = [];
    for (let i = 0; i < 5; i++) b.motes.push({ x: A.x0 + 50 + i * (A.x1 - A.x0 - 100) / 4, y: fl - 30 - (i % 2) * 50, got: false });
  }
  if (b.phase === 3) {
    B.darkness = Math.min(.93, B.darkness + .01); B.lightScale = Math.max(.55, B.lightScale - .006);
    for (const m of b.motes) if (!m.got && Math.hypot(px - m.x, p.y + 11 - m.y) < 16) { m.got = true; b.got++; G.audio.sfx('lightmote', 1, { p: Math.pow(1.122, b.got) }); G.fx.burst(m.x, m.y, '#fff1c0', 14, 2, { k: 'glow', g: 0 }); }
    if (b.got >= 5 && !p.power) { p.power = true; p.hp = G.S.maxHp; p.mana = G.S.maxMana; G.audio.sfx('power'); G.audio.duck(.4, 1.5, 1.5); G.shake(12); G.bossBanner('Tāne carries Te Ao Mārama'); G.flash = 1; B.darkness = .35; b.phase = 3.5; }
    b.x += Math.sin(b.t * .02) * 1.5; b.y = fl - 90 + Math.sin(b.t * .03) * 10;
    if (b.t % 70 === 0) { for (let i = -1; i <= 1; i++) { const [vx, vy] = aim(b.x + b.w / 2, b.y + 20, 2); shot({ x: b.x + b.w / 2, y: b.y + 20, vx: vx + i * .5, vy: vy + i * .3, c: '#2a0a3a', dmg: 14, ghost: true }); } G.audio.sfx('whisper'); }
    return;
  }
  if (b.phase === 3.5) { B.darkness = Math.max(.25, B.darkness - .005); B.lightScale = Math.min(1.3, B.lightScale + .01); if (hp < .2) { b.phase = 4; G.bossBanner('The final clash'); G.audio.sfx('roar'); b.big = 1; } }
  const sp = b.phase >= 3.5 ? 1.4 : b.phase === 2 ? 1.2 : 1;
  // gravity-free hover near floor
  const ty = b.phase === 4 ? fl - 90 : fl - 64; b.y += (ty - b.y) * .08;
  if (b.st === 'idle') {
    b.face = Math.sign(dx) || b.face; b.x += Math.sign(dx) * (Math.abs(dx) > 90 ? 1.4 : -.6) * sp;
    if (b.stT <= 0) {
      const r = Math.random(), ph = Math.floor(b.phase);
      if (r < .25) { b.st = 'blink'; b.stT = 30; G.audio.sfx('whisper'); }
      else if (r < .5) { b.st = 'wind'; b.stT = 24; G.audio.sfx('warn'); }
      else if (r < .7) { b.st = 'bolts'; b.stT = 40; }
      else if (ph >= 2 && r < .82) { b.st = 'summon'; b.stT = 50; }
      else if (ph >= 2 && r < .92) { b.st = 'pillars'; b.stT = 70; }
      else if (ph >= 2) { b.st = 'wave'; b.stT = 40; }
      else { b.st = 'bolts'; b.stT = 40; }
    }
  } else if (b.st === 'blink') { if (b.stT === 15) { G.fx.burst(b.x + 11, b.y + 25, '#2a0a3a', 24, 2.5); b.x = G.clamp(px + (Math.random() < .5 ? -80 : 80), A.x0 + 30, A.x1 - 50); G.fx.burst(b.x + 11, b.y + 25, '#2a0a3a', 24, 2.5); } if (b.stT <= 0) { b.st = 'wind'; b.stT = 18; } }
  else if (b.st === 'wind') { if (b.stT <= 0) { b.st = 'lunge'; b.stT = 30; b.vx = b.face * 5.5 * sp; G.audio.sfx('dash'); } }
  else if (b.st === 'lunge') { b.x += b.vx; b.vx *= .97; G.fx.add({ x: b.x + 11, y: b.y + 10 + Math.random() * 30, c: '#2a0a3a', life: 18 }); const box = { x: b.face > 0 ? b.x + b.w : b.x - 30, y: b.y + 14, w: 30, h: 14 }; if (G.hit(p, box)) G.World.hurtPlayer(20, b.x); if (b.stT <= 0) { b.st = 'idle'; b.stT = b.phase === 4 ? 20 : 45; } }
  else if (b.st === 'bolts') { if (b.stT % 12 === 0) { const n = b.phase === 4 ? 5 : 3; for (let i = 0; i < n; i++) { const [vx, vy] = aim(b.x + 11, b.y + 18, 2.4 * sp); const a = (i - (n - 1) / 2) * .22, c = Math.cos(a), s = Math.sin(a); shot({ x: b.x + 11, y: b.y + 18, vx: vx * c - vy * s, vy: vx * s + vy * c, c: '#3a0a4a', dmg: 14, ghost: true }); } G.audio.sfx('whisper'); } if (b.stT <= 0) { b.st = 'idle'; b.stT = 40; } }
  else if (b.st === 'summon') { if (b.stT === 30) { const ty = Math.random() < .5 ? 'stalk' : 'mos'; for (let i = 0; i < (ty === 'mos' ? 4 : 2); i++) { const e = G.World.mkEnemy(ty, A.x0 + 60 + Math.random() * (A.x1 - A.x0 - 120), fl - (ty === 'mos' ? 80 : 16), 10); if (ty === 'stalk') e.st = 'stalk'; L().enemies.push(e); } G.audio.sfx('roar', .5); } if (b.stT <= 0) { b.st = 'idle'; b.stT = 60; } }
  else if (b.st === 'pillars') { if (b.stT === 60) { for (let i = 0; i < 3; i++) { const x = G.clamp(px - 9 + (i - 1) * 50, A.x0 + 20, A.x1 - 40); b.hz.push({ x, y: fl - 70, w: 18, h: 70, t: 70, live: 26, dmg: 18, kind: 'pillar' }); } G.audio.sfx('warn'); } if (b.stT <= 0) { b.st = 'idle'; b.stT = 40; } }
  else if (b.st === 'wave') { if (b.stT === 20) { [-1, 1].forEach(d => shot({ x: b.x + 11, y: fl - 14, w: 14, h: 14, vx: d * 3, vy: 0, life: 140, c: '#1a0624', dmg: 16, k: 'wave' })); G.audio.sfx('slam'); G.shake(6); } if (b.stT <= 0) { b.st = 'idle'; b.stT = 40; } }
  // portals fire periodically in phase 2+
  if (b.portals && b.phase >= 2 && b.t % (b.phase === 4 ? 70 : 100) === 0) G.audio.sfx('portal'); if (b.portals && b.phase >= 2 && b.t % (b.phase === 4 ? 70 : 100) === 0) for (const pt of b.portals) { const [vx, vy] = aim(pt.x, pt.y, 2); shot({ x: pt.x, y: pt.y, vx, vy, c: '#5a1a7a', dmg: 12, ghost: true }); }
  b.x = G.clamp(b.x, A.x0 + 20, A.x1 - 20 - b.w);
  if (b.big) { b.w = 30; b.h = 70; }
}

/* ---------- drawing ---------- */
B.draw = (ctx, cx, cy, t) => {
  const b = B.b; if (!b) return; const A = b.A, fl = A.floor;
  for (const h of b.hz) {
    const x = h.x - cx, y = h.y - cy;
    if (h.kind === 'shadow') { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x + 8, y + 2, 10 - h.t / 10, 3, 0, 0, 7); ctx.fill(); continue; }
    const active = h.t < h.live;
    if (!active) { ctx.fillStyle = G.alpha(h.kind === 'pillar' ? '#7a1a9a' : h.gold ? '#f2c14e' : '#bcd7ff', .15 + .1 * Math.sin(t * .5)); ctx.fillRect(x, y, h.w, h.h); ctx.fillStyle = G.alpha('#ffffff', .4); ctx.fillRect(x + h.w / 2, y, 1, h.h); }
    else if (h.kind === 'pillar') { ctx.fillStyle = '#12041a'; ctx.fillRect(x + 2, y, h.w - 4, h.h); ctx.fillStyle = '#5a1a7a'; for (let i = 0; i < h.h; i += 6) ctx.fillRect(x + 2 + (i % 12 ? 0 : h.w - 6), y + i, 2, 3); }
    else { const c = h.gold ? '#fff1c0' : '#e8f1ff'; ctx.fillStyle = G.alpha(c, .9); ctx.fillRect(x + 3, y, h.w - 6, h.h); G.glow(ctx, x + h.w / 2, fl - 20 - cy, 30, c, .6); }
  }
  const fl2 = b.flash > 0 && b.flash % 2;
  const img = (sp, face) => { const i = face > 0 ? sp.r : sp.l; return fl2 ? G.tint(i, '#ffffff') : i; };
  if (b.kind === 'ngarara') {
    const v = b.st === 'stun' ? 's' : b.st === 'spit' && b.stT < 40 ? 'o' : ''; const f = b.st === 'charge' ? Math.floor(t / 3) % 4 : Math.floor(t / 10) % 4;
    const sp = G.bossSprite('ngarara', f, v); ctx.drawImage(img(sp, b.face), Math.round(b.x + b.w / 2 - sp.w / 2 - cx), Math.round(b.y + b.h - sp.h + 4 - cy));
    if (b.st === 'stun') { G.glow(ctx, b.x + b.w / 2 - cx, b.y + 10 - cy, 30, '#f2c14e', .4); for (let i = 0; i < 3; i++) { const a = t * .1 + i * 2.1; ctx.fillStyle = '#fff1c0'; ctx.fillRect(b.x + b.w / 2 - cx + Math.cos(a) * 14, b.y - 6 - cy + Math.sin(a) * 3, 2, 2); } }
    if (b.st === 'wind') G.glow(ctx, b.x + b.w / 2 - cx, b.y + b.h - cy, 40, '#c2452a', .3);
  }
  if (b.kind === 'moonkeeper') {
    G.glow(ctx, b.cx - cx, b.cy - cy, 70, '#bcd7ff', .25);
    const sp = G.bossSprite('moonkeeper', 0, b.open ? 'o' : ''); ctx.drawImage(fl2 ? G.tint(sp.r, '#ffffff') : sp.r, Math.round(b.cx - 28 - cx), Math.round(b.cy - 28 - cy));
    for (let i = 0; i < 4; i++) if (b.orbs[i] > 0) { const o = orbPos(b, i), os = G.bossSprite('moonorb'); ctx.drawImage(os.r, Math.round(o[0] - 7 - cx), Math.round(o[1] - 7 - cy)); G.glow(ctx, o[0] - cx, o[1] - cy, 12, '#dde8ff', .4); }
    if (b.open) { ctx.strokeStyle = G.alpha('#ffffff', .5 + .3 * Math.sin(t * .3)); ctx.beginPath(); ctx.arc(b.cx - cx, b.cy - cy, 24, 0, 7); ctx.stroke(); }
  }
  if (b.kind === 'champion') {
    const v = b.st === 'wind' ? 'w' : b.st === 'lunge' || b.st === 'slash' ? 'a' : b.st === 'guard' ? 'b' : ''; const sp = G.bossSprite('champion', Math.floor(t / 10) % 2, v);
    if (b.st === 'vanish' && b.stT > 20) ctx.globalAlpha = (b.stT - 20) / 20;
    if (b.st === 'vanish' && b.stT <= 20) ctx.globalAlpha = 1 - b.stT / 20;
    ctx.drawImage(img(sp, b.face), Math.round(b.x + b.w / 2 - 20 - cx), Math.round(b.y + b.h - 42 - cy)); ctx.globalAlpha = 1;
    if (b.st === 'wind') G.glow(ctx, b.x + b.w / 2 + b.face * 14 - cx, b.y + 16 - cy, 16, '#ff4a3a', .6);
    if (b.st === 'recover' || b.st === 'stagger') { for (let i = 0; i < 3; i++) { const a = t * .12 + i * 2.1; ctx.fillStyle = '#f2c14e'; ctx.fillRect(b.x + 7 - cx + Math.cos(a) * 9, b.y - 6 - cy + Math.sin(a) * 2, 2, 2); } }
  }
  if (b.kind === 'gatekeeper') {
    const v = b.open ? 'o' : b.st === 'raise' ? 'r' : b.st === 'slam' ? 's' : ''; const sp = G.bossSprite('gatekeeper', 0, v);
    ctx.drawImage(fl2 ? G.tint(sp.r, '#ffffff') : sp.r, Math.round(b.x + b.w / 2 - 44 - cx), Math.round(b.y + b.h - 104 + 4 - cy));
    if (b.open) G.glow(ctx, b.x + 30 - cx, b.y + 47 - cy, 26, '#fff1c0', .5 + .2 * Math.sin(t * .3));
    if (b.st === 'eyes' || b.phase === 2) { G.glow(ctx, b.x + 22 - cx, b.y + 14 - cy, 10, '#f2c14e', .7); G.glow(ctx, b.x + 38 - cx, b.y + 14 - cy, 10, '#f2c14e', .7); }
  }
  if (b.kind === 'whiro') {
    if (b.portals) for (const pt of b.portals) { const x = pt.x - cx, y = pt.y - cy; ctx.fillStyle = '#0a020e'; ctx.beginPath(); ctx.ellipse(x, y, 10 + Math.sin(t * .1) * 2, 18, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#7a1a9a'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1; }
    if (b.motes) for (const m of b.motes) if (!m.got) { G.glow(ctx, m.x - cx, m.y - cy, 12, '#fff1c0', .6); ctx.fillStyle = '#ffffff'; ctx.fillRect(m.x - cx - 1, m.y - cy - 1 + Math.sin(t * .1 + m.x) * 2, 3, 3); }
    const v = b.st === 'lunge' || b.st === 'wind' ? 'a' : b.st === 'bolts' || b.st === 'summon' || b.st === 'pillars' || b.st === 'shroud' ? 'c' : ''; const sp = G.bossSprite('whiro', Math.floor(t / 8) % 4, v), sc = b.big ? 1.6 : 1;
    if (b.st === 'blink' && b.stT > 10 && b.stT < 20) ctx.globalAlpha = .3;
    G.glow(ctx, b.x + b.w / 2 - cx, b.y + b.h / 2 - cy, 50 * sc, '#3a0a4a', .5);
    const im = img(sp, b.face); ctx.drawImage(im, Math.round(b.x + b.w / 2 - 24 * sc - cx), Math.round(b.y + b.h - 58 * sc - cy), 48 * sc, 60 * sc); ctx.globalAlpha = 1;
    if (b.phase === 3 && !G.World.P.power) { ctx.strokeStyle = G.alpha('#3a0a4a', .8); ctx.beginPath(); ctx.arc(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy, 34, 0, 7); ctx.stroke(); }
  }
};
B.lights = (cx, cy) => {
  const b = B.b; if (!b) return;
  if (b.motes) for (const m of b.motes) if (!m.got) G.light.add(m.x - cx, m.y - cy, 34, 1);
  for (const h of b.hz) if (h.t < h.live && h.kind === 'beam') G.light.add(h.x + h.w / 2 - cx, h.y + h.h - 30 - cy, 60, 1);
  if (b.kind === 'moonkeeper') G.light.add(b.cx - cx, b.cy - cy, 90, .8);
};
})();
