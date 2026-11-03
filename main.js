/* Tāne's Ascent — game flow, menus, HUD, saving, main loop */
(() => {
const G = window.G, W = G.World, T = 16, VW = G.VW, VH = G.VH, PH = G.PH;
const game = document.getElementById('game'), over = document.getElementById('text');
const ctx = game.getContext('2d'); ctx.imageSmoothingEnabled = false;
const OS = 3, octx = over.getContext('2d');
G.light.init();

/* ---------- text on the crisp overlay ---------- */
const FONT = { display: "700 {s}px 'Oswald', Impact, 'Arial Narrow', sans-serif", body: "500 {s}px 'IBM Plex Sans', system-ui, sans-serif", mono: "700 {s}px 'IBM Plex Mono', ui-monospace, Menlo, monospace" };
G.txt = (str, x, y, o = {}) => {
  const sz0 = o.size || 6, sz = sz0 <= 7 && !o.fixed ? sz0 * (G.prefs ? G.prefs.text || 1 : 1) : sz0, s = sz * OS; octx.font = FONT[o.font || 'body'].replace('{s}', s); octx.textAlign = o.align || 'left'; octx.textBaseline = 'alphabetic';
  octx.globalAlpha = o.alpha == null ? 1 : o.alpha;
  const lines = []; if (o.maxW) { let line = ''; for (const w of String(str).split(' ')) { const tt = line ? line + ' ' + w : w; if (octx.measureText(tt).width > o.maxW * OS && line) { lines.push(line); line = w; } else line = tt; } lines.push(line); } else lines.push(String(str));
  lines.forEach((ln, i) => { const yy = (y + i * (o.lh ? o.lh * sz / sz0 : sz * 1.4)) * OS; if (o.shadow !== false) { octx.fillStyle = 'rgba(0,0,0,.75)'; octx.fillText(ln, x * OS + 2, yy + 2); } octx.fillStyle = o.color || '#efe6d2'; octx.fillText(ln, x * OS, yy); });
  octx.globalAlpha = 1; return y + lines.length * (o.lh ? o.lh * sz / sz0 : sz * 1.4);
};
G.textQueue = [];

/* ---------- preferences, haptics, device-aware prompts ---------- */
G.prefs = { shake: true, vibrate: true, hints: true, diff: 'normal', text: 1, calm: false };
try { Object.assign(G.prefs, JSON.parse(localStorage.getItem('tanes-ascent-prefs') || '{}')); } catch (e) { }
const savePrefs = () => { try { localStorage.setItem('tanes-ascent-prefs', JSON.stringify(G.prefs)); } catch (e) { } };
G.buzz = ms => { if (G.prefs.vibrate && G.input.last === 'touch' && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } };
const PROMPT = {
  key: { ok: 'Enter', back: 'Esc', adjust: '◀ ▶', nav: '↑ ↓', move: '← →' },
  pad: { jump: 'A', attack: 'X', light: 'Y', roll: 'B', heavy: 'RT', burst: 'LT', ok: 'A', back: 'B', pause: 'Start', lore: 'Select', adjust: '◀ ▶', nav: 'D-pad', move: 'The left stick', up: 'Up', down: 'Down' },
  touch: { jump: 'JUMP', attack: 'STRIKE', light: 'LIGHT', roll: 'ROLL', heavy: 'HEAVY', burst: 'BURST', ok: 'Tap', back: 'Back', pause: 'MENU', lore: 'LORE', adjust: 'Tap ◀ ▶', nav: 'Tap', move: 'Drag on the left', up: 'the stick up', down: 'the stick down' }
};
G.prompt = a => { const dev = G.input.last || 'key', tbl = PROMPT[dev] || PROMPT.key; if (tbl[a]) return tbl[a]; if (dev === 'key' && G.keys.REBINDABLE.includes(a)) return G.keys.label(a); return a; };
G.fmt = str => str.replace(/\{(\w+)\}/g, (_, k) => G.prompt(k));
const calm = () => !!G.prefs.calm;

/* ---------- playtest log: kept in this browser so testers can send a report ---------- */
const PLOG = 'tanes-ascent-playtest';
G.plog = {
  ev: (() => { try { return JSON.parse(localStorage.getItem(PLOG) || '[]'); } catch (e) { return []; } })(),
  add(e, o = {}) { this.ev.push(Object.assign({ e, at: Date.now() }, o)); if (this.ev.length > 600) this.ev.splice(0, this.ev.length - 600); try { localStorage.setItem(PLOG, JSON.stringify(this.ev)); } catch (er) { } },
  clear() { this.ev = []; try { localStorage.removeItem(PLOG); } catch (e) { } },
  report() {
    const by = {}, lines = [], ev = this.ev;
    for (const x of ev) { if (x.n == null) continue; const r = by[x.n] = by[x.n] || { deaths: 0, where: [], causes: {}, clears: 0, secs: [], stars: [] };
      if (x.e === 'death') { r.deaths++; r.where.push(x.pct); r.causes[x.cause] = (r.causes[x.cause] || 0) + 1; }
      if (x.e === 'clear') { r.clears++; r.secs.push(x.secs); r.stars.push(x.stars); } }
    lines.push("Tāne's Ascent playtest report · " + new Date().toLocaleString(), 'Difficulty: ' + G.prefs.diff + ' · events logged: ' + ev.length, '');
    for (const n of Object.keys(by).sort((a, b) => a - b)) { const r = by[n], top = Object.entries(r.causes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k + ' ×' + v).join(', ');
      const buckets = [0, 0, 0, 0]; r.where.forEach(p => buckets[Math.min(3, Math.floor((p || 0) / 25))]++);
      lines.push(`${n == 13 ? 'Toi' : 'Rangi ' + n}: cleared ${r.clears}× · deaths ${r.deaths}` + (r.secs.length ? ` · best time ${fmtTime(Math.min(...r.secs))}` : '') + (r.stars.length ? ` · best ${Math.max(...r.stars)}★` : ''));
      if (r.deaths) lines.push(`   deaths by progress 0-25% ${buckets[0]} · 25-50% ${buckets[1]} · 50-75% ${buckets[2]} · 75-100% ${buckets[3]} · causes: ${top}`); }
    const errs = ev.filter(x => x.e === 'error'); if (errs.length) { lines.push('', 'Errors:'); errs.slice(-5).forEach(x => lines.push('   ' + new Date(x.at).toLocaleString() + ' · ' + x.msg)); }
    const quits = ev.filter(x => x.e === 'quit'); if (quits.length) lines.push('', 'Quit to title ' + quits.length + '× (last in ' + (quits.at(-1).n == 13 ? 'Toi' : 'Rangi ' + quits.at(-1).n) + ')');
    return lines.join('\n');
  }
};
const fmtTime = secs => Math.floor(secs / 60) + ':' + String(Math.floor(secs % 60)).padStart(2, '0');
const download = (name, text, type) => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); return true; } catch (e) { return false; } };

/* ---------- crash guard: a failure shows a recovery screen instead of a frozen game ---------- */
let crash = null, errCount = 0, errWindow = 0;
G.reportError = e => {
  const msg = String(e && (e.stack || e.message) || e).split('\n').slice(0, 2).join(' ').slice(0, 220);
  console.error(e); G.plog.add('error', { msg, n: G.S && G.S.n });
  const now = performance.now(); if (now - errWindow > 2000) { errWindow = now; errCount = 0; } errCount++;
  if (G.S && G.S.mode !== 'crashed' && errCount >= 3) { crash = { msg, from: G.S.mode }; G.S.mode = 'crashed'; menuSel = 0; try { G.audio.setPaused(true); } catch (er) { } }
};
addEventListener('error', ev => { if (ev.error) G.reportError(ev.error); });

/* ---------- pointer support: every menu item is clickable and tappable ---------- */
let hits = [], click = null, hover = null;
const addHit = (x, y, w, h, fn, i) => hits.push({ x, y, w, h, fn, i });
const inside = (h, p) => p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h;
const cabEl = document.getElementById('cab');
const toGame = e => { const r = game.getBoundingClientRect(), sc = Math.min(r.width / VW, r.height / VH), ox = r.left + (r.width - VW * sc) / 2, oy = r.top + (r.height - VH * sc) / 2; return { x: (e.clientX - ox) / sc, y: (e.clientY - oy) / sc }; };
cabEl.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { hover = toGame(e); if (G.input.last === 'touch') G.input.last = 'key'; } });
cabEl.addEventListener('pointerup', e => { if (e.target.closest && e.target.closest('#touch')) return; click = toGame(e); if (e.pointerType !== 'mouse') G.input.last = 'touch'; });

/* ---------- screen transitions ---------- */
const wipe = { a: 0, d: 0, fn: null };
G.go = fn => { if (wipe.d) return false; wipe.d = 1; wipe.fn = fn; return true; };
function wipeStep() { if (!wipe.d) return; wipe.a += wipe.d * .085; if (wipe.d > 0 && wipe.a >= 1) { wipe.a = 1; const f = wipe.fn; wipe.fn = null; wipe.d = -1; try { f && f(); } catch (e) { G.reportError(e); } } else if (wipe.d < 0 && wipe.a <= 0) { wipe.a = 0; wipe.d = 0; } }
function drawWipe() { if (wipe.a <= 0) return; const a = wipe.a * wipe.a * (3 - 2 * wipe.a); ctx.fillStyle = `rgba(4,2,4,${a})`; ctx.fillRect(0, 0, VW, VH); }

/* ---------- state ---------- */
const fresh = () => ({ mode: 'boot', n: 1, score: 0, lives: 3, maxHp: 100, maxMana: 60, ab: [], got: [], lore: [], bosses: [], feathers: 0, relics: 0, manaStones: 0, glyphs: 0, check: null, time: 0, lv: null, best: {} });
G.S = fresh();
const S = () => G.S;
let summary = null, setPage = 'root', capture = null, modeT = 0, lastMode = '', hpTrail = 100, trailHold = 0, dispScore = 0, lastHp = 100, cam = { x: 0, y: 0 }, shakeAmt = 0, hitstopN = 0, t = 0, toasts = [], banner = null, menuSel = 0, prevMode = 'title', slotMode = 'load', popup = null, deadT = 0, loreSel = 0;
G.cam = cam; let audioMode = 'boot';
G.shake = n => { if (G.prefs.shake && !calm()) shakeAmt = Math.max(shakeAmt, n); };
G.hitstop = n => { hitstopN = Math.max(hitstopN, n); };
G.toast = (a, b = '') => { const ex = toasts.find(q => q.a === a && q.b === b); if (ex) { ex.t = Math.max(ex.t, 120); return; } toasts.push({ a, b, t: 240 }); if (toasts.length > 2) toasts.shift(); };
G.bossBanner = txt => { banner = { txt, t: 150 }; G.audio.sfx('phase'); G.audio.duck(.55, .9, 1.2); };
G.slowmo = 0; G.flash = 0; G.fade = 0;

/* ---------- saving ---------- */
const KEY = 'tanes-ascent-save-v1';
const store = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return null; } };
const PERSIST = ['n', 'score', 'lives', 'maxHp', 'maxMana', 'ab', 'got', 'lore', 'bosses', 'feathers', 'relics', 'manaStones', 'glyphs', 'check', 'time', 'lv', 'best'];
G.save = slot => {
  const s = S(), d = { ts: Date.now() }; PERSIST.forEach(k => d[k] = JSON.parse(JSON.stringify(s[k])));
  try { const all = store() || {}; all[slot] = d; localStorage.setItem(KEY, JSON.stringify(all)); return true; } catch (e) { if (slot !== 'auto') G.toast('Could not save', 'This browser view blocks saving.'); return false; }
};
const slotInfo = slot => { const all = store(); return all && all[slot]; };
G.loadSlot = slot => { const d = slotInfo(slot); if (!d) return false; const s = fresh(); PERSIST.forEach(k => { if (d[k] !== undefined) s[k] = d[k]; }); G.S = s; dispScore = s.score; G.loadLevel(s.n, true); G.toast('Journey resumed', G.BIOMES[s.n].name + ' · ' + G.BIOMES[s.n].sub); return true; };

/* ---------- level flow ---------- */
G.loadLevel = (n, atCheck) => {
  const s = S(); s.n = n; G.Boss.end(); G.clearTimers(); toasts = []; banner = null; G.slowmo = 0; G.flash = 0;
  if (!s.lv || s.lv.n !== n || !atCheck) s.lv = { n, t0: s.time, kills: 0, deaths: 0, score0: s.score };
  const L = W.L = W.gen(n, s); G.weather.init(L.b); G.fx.reset();
  let sx = L.start.x, sy = L.start.y;
  if (atCheck && s.check && s.check.n === n) { sx = s.check.x; sy = s.check.y; L.pous.forEach(p => { if (Math.abs(p.x + 3 - sx) < 4) p.lit = true; }); }
  W.P = W.newPlayer(sx, sy, s); W.P.safe = { x: sx, y: sy }; hpTrail = lastHp = W.P.hp;
  const kind = L.b.boss || (n === 13 ? 'whiro' : null);
  if (kind && s.bosses.includes(kind)) { L.gate.open = true; L.bossDone = true; }
  G.audio.setMood('h' + n, 2.5); G.audio.setBiome(n); G.audio.setRush(0); G.audio.setWhine(0); G.after(15, () => G.audio.sfx('spawn'));
  s.mode = 'play'; snapCam(); G.fade = 1;
  if (!atCheck) G.save('auto');
};
G.levelComplete = () => {
  const s = S(); if (s.mode !== 'play') return;
  s.score += 1000 + Math.round(W.P.hp) * 5; G.audio.sfx('gate'); G.audio.duck(.5, 1, 2); G.audio.setRush(0); G.audio.setWhine(0);
  // end-of-heaven summary: what score is for
  const L = W.L, lv = s.lv || { t0: s.time, kills: 0, deaths: 0, score0: s.score }, total = L.secrets.length, found = L.secrets.filter(id => s.got.includes(id)).length;
  const secs = (s.time - lv.t0) / 60, stars = 1 + (found >= Math.ceil(total / 2) ? 1 : 0) + (lv.deaths === 0 ? 1 : 0), bonus = stars * 500;
  s.score += bonus; const prevBest = s.best[s.n] || 0; s.best[s.n] = Math.max(prevBest, stars);
  summary = { n: s.n, secs, kills: lv.kills, deaths: lv.deaths, found, total, gained: s.score - lv.score0, bonus, stars, newBest: stars > prevBest && prevBest > 0, t: 0 };
  G.plog.add('clear', { n: s.n, secs: Math.round(secs), deaths: lv.deaths, stars });
  const next = s.n + 1; s.check = null; s.n = next; s.lv = null;
  s.mode = 'cine-wait'; G.save('auto');
  G.after(30, () => { if (S().mode === 'cine-wait') { S().mode = 'summary'; menuSel = 0; G.audio.sfx('popup'); } });
};
const leaveSummary = () => { const next = S().n; summary = null; S().mode = 'cine-wait'; G.go(() => G.chapter(next, () => G.go(() => G.loadLevel(next, false)))); };
G.onPlayerDeath = () => { const s = S(); if (s.mode !== 'play') return; if (s.lv) { s.lv.deaths++; if (s.lv.deaths === 4 && G.prefs.diff !== 'assist') G.after(150, () => G.toast('This heaven is testing you', 'Assist mode is in Settings \u2192 Difficulty, any time.')); } { const L = W.L, x1 = L.arena ? L.arena.x1 : L.gate.x; G.plog.add('death', { n: s.n, pct: Math.round(G.clamp((W.P.x - L.start.x) / (x1 - L.start.x), 0, 1) * 100), cause: W.lastCause || 'unknown', boss: G.Boss.active ? G.Boss.b.kind : undefined }); } s.mode = 'dead'; deadT = 0; G.audio.sfx('pdeath'); G.audio.duck(.3, 1.6, 1.5); G.audio.setRush(0); G.audio.setWhine(0); G.Boss.end(); };
G.grantAbility = ab => { const s = S(); if (!s.ab.includes(ab)) s.ab.push(ab); popup = { kind: 'ability', ab, t: 0 }; s.mode = 'popup'; G.audio.sfx('power'); G.audio.duck(.4, 1.5, 1.5); G.save('auto'); };
G.openLore = (n, fromPickup) => { G.audio.sfx('popup'); popup = { kind: 'lore', n, t: 0 }; prevMode = S().mode; S().mode = 'popup'; };
G.startEnding = () => { const s = S(); s.mode = 'cine-wait'; G.audio.setMood('victory'); s.complete = true; G.save('auto'); G.after(78, () => G.go(() => G.ending(() => G.go(() => { s.mode = 'title'; menuSel = 0; G.audio.setMood('story'); G.audio.setBiome(0); })))); };

/* ---------- camera ---------- */
function camTarget() {
  const P = W.P, L = W.L; let tx = P.x + 5 - VW / 2 + P.face * 28, ty = P.y + 11 - PH * .58;
  if (G.Boss.active && G.Boss.b) { const A = G.Boss.b.A; tx = G.clamp(tx, A.x0, A.x1 - VW); ty = A.floor - PH + 36; }
  return [G.clamp(tx, 0, L.W * T - VW), G.clamp(ty, 0, L.H * T - PH)];
}
function snapCam() { const [x, y] = camTarget(); cam.x = x; cam.y = y; }

/* ---------- menus ---------- */
const MENU = {
  title: () => [slotInfo('auto') && ['Continue', () => G.go(() => G.loadSlot('auto'))], ['New journey', () => startNew(G.prefs.diff || 'normal')], ['Load journey', () => { slotMode = 'load'; prevMode = 'title'; S().mode = 'slots'; menuSel = 0; }], ['Lore book', () => { prevMode = 'title'; S().mode = 'lore'; loreSel = 0; }], ['Settings', () => { prevMode = 'title'; setPage = 'root'; S().mode = 'sound'; menuSel = 0; }], ['Controls', () => { prevMode = 'title'; S().mode = 'controls'; }]].filter(Boolean),
  pause: () => [['Resume', () => S().mode = 'play'], ['Restart from checkpoint', () => G.go(() => G.loadLevel(S().n, true))], ['Save journey', () => { slotMode = 'save'; prevMode = 'pause'; S().mode = 'slots'; menuSel = 0; }], ['Lore book', () => { prevMode = 'pause'; S().mode = 'lore'; loreSel = 0; }], ['Settings', () => { prevMode = 'pause'; setPage = 'root'; S().mode = 'sound'; menuSel = 0; }], ['Controls', () => { prevMode = 'pause'; S().mode = 'controls'; }], ['Quit to title', () => G.go(() => { G.plog.add('quit', { n: S().n }); G.Boss.end(); G.clearTimers(); S().mode = 'title'; menuSel = 0; G.audio.setMood('story'); G.audio.setBiome(0); })]],
  sound: () => {
    const pct = k => Math.round(G.audio.vol[k] * 100) + '%', adj = k => d => { G.audio.setVol(k, G.audio.vol[k] + d * .05); G.audio.sfx(k === 'amb' ? 'select' : k === 'music' ? 'slider' : 'hit', 1, { p: G.audio.vol[k] }); };
    const tog = k => () => { G.prefs[k] = !G.prefs[k]; savePrefs(); if (k === 'vibrate' && G.prefs.vibrate) G.buzz(30); }, on = k => G.prefs[k] ? 'on' : 'off';
    const page = p => () => { setPage = p; menuSel = 0; }, back = ['Back', () => { if (setPage === 'root') { S().mode = prevMode; } else setPage = 'root'; menuSel = 0; }];
    const DIFFS = ['assist', 'normal', 'hard'], dname = { assist: 'Assist', normal: 'Normal', hard: 'Hard' }, cycDiff = d => { G.prefs.diff = DIFFS[(DIFFS.indexOf(G.prefs.diff) + d + 3) % 3]; savePrefs(); G.audio.sfx('select'); };
    const SIZES = [1, 1.15, 1.3], sname = { 1: 'Standard', 1.15: 'Large', 1.3: 'Largest' }, cycText = d => { G.prefs.text = SIZES[(SIZES.indexOf(G.prefs.text) + d + 3) % 3]; savePrefs(); G.audio.sfx('select'); };
    if (setPage === 'audio') return [['Music volume  ◀ ' + pct('music') + ' ▶', adj('music'), adj('music')], ['Effects volume  ◀ ' + pct('sfx') + ' ▶', adj('sfx'), adj('sfx')], ['Ambience volume  ◀ ' + pct('amb') + ' ▶', adj('amb'), adj('amb')], ['Sound: ' + (G.audio.muted ? 'off' : 'on'), () => G.audio.toggleMute()], back];
    if (setPage === 'game') return [['Difficulty  ◀ ' + dname[G.prefs.diff] + ' ▶', cycDiff, cycDiff], ['Progress bar and hints: ' + on('hints'), tog('hints')], ['Vibration (touch): ' + on('vibrate'), tog('vibrate')], back];
    if (setPage === 'access') return [['Text size  ◀ ' + sname[G.prefs.text] + ' ▶', cycText, cycText], ['Reduced motion and flashing: ' + on('calm'), tog('calm')], ['Screen shake: ' + on('shake'), tog('shake')], back];
    if (setPage === 'keys') return G.keys.REBINDABLE.map(a => [(capture === a ? '▶ Press a key for ' + a + '…' : a[0].toUpperCase() + a.slice(1) + ':  ' + G.keys.list(a)), () => { capture = a; G.keys.capturing = code => { capture = null; if (code === 'Escape') { G.audio.sfx('back'); return; } if (G.keys.bind(a, code)) { G.audio.sfx('confirm'); G.toast('Key set', a + ' → ' + G.keys.label(a)); } else G.audio.sfx('error'); }; }]).concat([['Reset keys to defaults', () => { G.keys.reset(); G.toast('Keys reset'); }], back]);
    if (setPage === 'saves') return [['Export save file', () => { const ok = download('tanes-ascent-save.json', JSON.stringify({ game: 'tanes-ascent', v: 1, exported: new Date().toISOString(), saves: store() || {} }, null, 1), 'application/json'); G.toast(ok ? 'Save exported' : 'Could not export', ok ? 'Keep the file somewhere safe.' : ''); }], ['Import save file', () => importSave()], ['Playtest report', () => { S().mode = 'report'; menuSel = 0; }], back];
    return [['Audio', page('audio')], ['Gameplay and difficulty', page('game')], ['Display and accessibility', page('access')], ['Keyboard keys', page('keys')], ['Saves and playtest', page('saves')], back];
  },
  report: () => [['Copy report', () => { const txt = G.plog.report(); try { navigator.clipboard.writeText(txt).then(() => G.toast('Report copied'), () => { download('tanes-ascent-playtest.txt', txt, 'text/plain'); G.toast('Report downloaded'); }); } catch (e) { download('tanes-ascent-playtest.txt', txt, 'text/plain'); } }], ['Download report', () => { download('tanes-ascent-playtest.txt', G.plog.report(), 'text/plain'); G.toast('Report downloaded'); }], ['Clear the log', () => { G.plog.clear(); G.toast('Log cleared'); }], ['Back', () => { S().mode = 'sound'; setPage = 'saves'; menuSel = 2; }]],
  newgame: () => [['Assist', () => startNew('assist')], ['Normal', () => startNew('normal')], ['Hard', () => startNew('hard')], ['Back', () => { S().mode = 'title'; menuSel = 1; }]],
  summary: () => [['Continue the ascent', leaveSummary]],
  crashed: () => [['Reload from the last checkpoint', () => { const n = S().n; crash = null; errCount = 0; G.go(() => { try { G.loadLevel(n, true); G.audio.setPaused(false); } catch (e) { G.reportError(e); } }); }], ['Quit to title', () => { crash = null; errCount = 0; G.go(() => { G.Boss.end(); G.clearTimers(); S().mode = 'title'; menuSel = 0; G.audio.setPaused(false); G.audio.setMood('story'); G.audio.setBiome(0); }); }]],
  over: () => [['Rise again from the last checkpoint', () => G.go(() => { S().lives = 3; G.loadLevel(S().n, true); })], ['Quit to title', () => G.go(() => { S().mode = 'title'; menuSel = 0; G.audio.setMood('story'); G.audio.setBiome(0); })]],
  slots: () => { const arr = (slotMode === 'load' ? ['auto', 'slot1', 'slot2', 'slot3'] : ['slot1', 'slot2', 'slot3']).map(sl => { const d = slotInfo(sl); const label = (sl === 'auto' ? 'Autosave' : 'Slot ' + sl.slice(-1)) + ' — ' + (d ? `${G.BIOMES[d.n].name} · ${new Date(d.ts).toLocaleDateString()}` : 'empty'); return [label, () => { if (slotMode === 'load') { if (!d) { G.toast('That slot is empty'); G.audio.sfx('error'); } else G.go(() => G.loadSlot(sl)); } else { if (G.save(sl)) { G.toast('Journey saved', label.split(' — ')[0]); S().mode = 'pause'; menuSel = 1; } } }]; }); arr.push(['Back', () => { S().mode = prevMode; menuSel = 0; }]); return arr; }
};
const DIFF_TEXT = { assist: 'Half damage, gentler guardians and enemies. For the story first.', normal: 'The intended challenge.', hard: 'Harder hits, tougher foes and guardians.' };
function startNew(d) { G.prefs.diff = d; savePrefs(); G.go(() => { G.S = fresh(); dispScore = 0; G.audio.setMood('story'); G.opening(() => G.go(() => G.chapter(1, () => G.go(() => G.loadLevel(1, false))))); }); }
function importSave() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; f.text().then(txt => { let d; try { d = JSON.parse(txt); } catch (e) { d = null; }
    const ok = d && d.game === 'tanes-ascent' && d.saves && typeof d.saves === 'object' && Object.values(d.saves).every(v => v && Number.isInteger(v.n) && v.n >= 1 && v.n <= 13);
    if (!ok) { G.toast('Not a save file', 'Choose a file exported from this game.'); G.audio.sfx('error'); return; }
    try { localStorage.setItem(KEY, JSON.stringify(d.saves)); G.toast('Save imported', 'Load it from Load journey.'); G.audio.sfx('confirm'); } catch (e) { G.toast('Could not import', 'This browser view blocks saving.'); } }); };
  inp.click();
}
function runMenu(items) {
  if (G.tap('down')) { menuSel = (menuSel + 1) % items.length; G.audio.sfx('select'); }
  if (G.tap('up')) { menuSel = (menuSel - 1 + items.length) % items.length; G.audio.sfx('select'); }
  menuSel = Math.min(menuSel, items.length - 1);
  const it = items[menuSel]; if (it && it[2] && (G.tap('left') || G.tap('right'))) { it[2](G.tap('right') ? 1 : -1); return true; }
  if (G.tap('ok') || G.tap('jump') || G.tap('attack')) { if (items[menuSel][2]) return false; G.audio.sfx(items[menuSel][0] === 'Back' ? 'back' : 'confirm'); items[menuSel][1](); return true; }
  return false;
}
function activate(items, i, c, cx) {
  menuSel = i; const it = items[i]; if (!it) return;
  if (it[2]) { it[2](c && c.x < cx ? -1 : 1); return; }
  G.audio.sfx(it[0] === 'Back' ? 'back' : 'confirm'); it[1]();
}
const ease = k => 1 - Math.pow(1 - G.clamp(k, 0, 1), 3);
function drawMenu(items, x, y, w, align = 'center', gap = 14) {
  items.forEach((it, i) => {
    const ki = ease((modeT - i * 1.5) / 12), sel = i === menuSel, yy = y + i * gap, x0 = align === 'center' ? x - w / 2 : x - 6, dx = (1 - ki) * -10;
    if (sel) { ctx.fillStyle = `rgba(194,69,42,${.85 * ki})`; ctx.fillRect(x0 + dx, yy - 9, w, 12); ctx.fillStyle = '#f2c14e'; ctx.fillRect(x0 + dx, yy - 9, 2, 12); }
    G.txt(it[0], x + dx, yy, { size: 6, font: 'body', color: sel ? '#ffffff' : '#b9a998', align, alpha: ki });
    addHit(x0, yy - 10, w, 14, c => activate(items, i, c, align === 'center' ? x : x0 + w / 2), i);
  });
}

/* ---------- audio state transitions (menus open/close, pause filter) ---------- */
const OVERLAYS = ['pause', 'slots', 'controls', 'lore', 'sound', 'report'];
function audioTransitions(s) {
  if (s.mode === audioMode) return; const from = audioMode; audioMode = s.mode;
  const inGame = !!(W.L && (from === 'play' || prevMode === 'pause' || prevMode === 'play' || s.mode === 'pause'));
  if (OVERLAYS.includes(s.mode) && !OVERLAYS.includes(from)) G.audio.sfx('open');
  else if (!OVERLAYS.includes(s.mode) && OVERLAYS.includes(from)) G.audio.sfx('close');
  if (from === 'popup' && s.mode === 'play') G.audio.sfx('close');
  G.audio.setPaused((OVERLAYS.includes(s.mode) && inGame && prevMode !== 'title') || s.mode === 'over');
  if (s.mode !== 'play') { G.audio.setRush(0); G.audio.setWhine(0); }
}

/* ---------- update ---------- */
function update() {
  t++; const s = S();
  wipeStep();
  if (s.mode !== lastMode) { lastMode = s.mode; modeT = 0; } else modeT++;
  audioTransitions(s);
  const dm = s.mode === 'play' ? 'play' : 'menu'; if (cabEl.dataset.mode !== dm) { cabEl.dataset.mode = dm; if (dm === 'menu') ['left', 'right', 'up', 'down'].forEach(a => G.touchSet(a, 0)); }
  if (hover) { const h = hits.find(h => h.i != null && inside(h, hover)); if (h && h.i !== menuSel) { menuSel = h.i; G.audio.sfx('select', .5); } hover = null; }
  if (click && !wipe.d) { const c = click; click = null; const h = [...hits].reverse().find(h => inside(h, c)); if (h) h.fn(c); else if (['cine', 'popup', 'bossintro', 'controls'].includes(s.mode)) G.input.pressed.ok = 1; } else click = null;
  if (wipe.d > 0) return;
  if (s.mode === 'play' || s.mode === 'cine-wait' || s.mode === 'dead' || s.mode === 'bossintro') G.tickTimers();
  if (G.tap('lore') && (s.mode === 'play' || s.mode === 'pause')) { prevMode = s.mode; s.mode = 'lore'; loreSel = Math.max(0, s.lore.length - 1); return; }
  switch (s.mode) {
    case 'title': runMenu(MENU.title()); break;
    case 'pause': if (G.tap('pause') || G.tap('back')) { s.mode = 'play'; break; } runMenu(MENU.pause()); break;
    case 'over': runMenu(MENU.over()); break;
    case 'slots': if (G.tap('back')) { s.mode = prevMode; break; } runMenu(MENU.slots()); break;
    case 'controls': if (G.tap('back') || G.tap('ok') || G.tap('pause')) { G.audio.sfx('back'); s.mode = prevMode; menuSel = 0; } break;
    case 'sound': if (capture) break; if (G.tap('back') || G.tap('pause')) { G.audio.sfx('back'); if (setPage === 'root') s.mode = prevMode; else setPage = 'root'; menuSel = 0; break; } runMenu(MENU.sound()); break;
    case 'report': if (G.tap('back') || G.tap('pause')) { G.audio.sfx('back'); s.mode = 'sound'; setPage = 'saves'; menuSel = 2; break; } runMenu(MENU.report()); break;
    case 'newgame': if (G.tap('back') || G.tap('pause')) { G.audio.sfx('back'); s.mode = 'title'; menuSel = 1; break; } runMenu(MENU.newgame()); break;
    case 'summary': summary && summary.t++; if (summary && summary.t > 90) runMenu(MENU.summary()); break;
    case 'crashed': runMenu(MENU.crashed()); break;
    case 'lore': {
      const n = s.lore.length ? Math.max(...s.lore) : 0; const list = [...Object.keys(G.LORE).map(Number), 'kupu'];
      if (G.tap('down') || G.tap('right')) { loreSel = (loreSel + 1) % list.length; G.audio.sfx('select'); }
      if (G.tap('up') || G.tap('left')) { loreSel = (loreSel - 1 + list.length) % list.length; G.audio.sfx('select'); }
      if (G.tap('back') || G.tap('pause') || G.tap('lore') || G.tap('ok')) { G.audio.sfx('back'); s.mode = prevMode === 'play' ? 'play' : prevMode; menuSel = 0; }
      break;
    }
    case 'cine': G.Cine.update(); break;
    case 'popup': popup.t++; if (popup.t > 30 && (G.tap('ok') || G.tap('jump') || G.tap('attack') || G.tap('back'))) { s.mode = 'play'; popup = null; } break;
    case 'bossintro': { const b = G.Boss.b; G.Boss.intro.t++; const bx = (b.kind === 'moonkeeper' ? b.cx : b.x + b.w / 2) - VW / 2; cam.x += (G.clamp(bx, b.A.x0, b.A.x1 - VW) - cam.x) * .06; cam.y += (G.clamp(b.A.floor - PH + 36, 0, W.L.H * T - PH) - cam.y) * .1; G.weather.update(t, cam.x, cam.y); if (G.Boss.intro.t > 260 || (G.Boss.intro.t > 40 && (G.tap('ok') || G.tap('jump')))) s.mode = 'play'; break; }
    case 'dead': deadT++; G.fx.update(); if (deadT === 110) G.go(() => G.loadLevel(s.n, true)); break;
    case 'play': play(); break;
  }
}
function play() {
  const s = S(); { const on = s.ab.includes('burst') ? '1' : '0'; if (cabEl.dataset.burst !== on) cabEl.dataset.burst = on; }
  if (G.tap('pause')) { s.mode = 'pause'; menuSel = 0; return; }
  if (hitstopN > 0) { hitstopN--; return; }
  if (G.slowmo > 0) { G.slowmo--; if (G.slowmo % 3) { G.Boss.update(); G.fx.update(); return; } }
  s.time++;
  W.heavenUpdate && W.heavenUpdate(t); W.updatePlayer(); W.updateEnemies(); G.Boss.update(); W.updateItems();
  if (s.mode !== 'play') return;
  G.weather.update(t, cam.x, cam.y); G.fx.update();
  // boss trigger
  const L = W.L; if (L.arena && !L.bossDone && !G.Boss.active && W.P.x > L.arena.x0 + 70) G.Boss.start(L.b.boss || 'whiro');
  if (G.Boss.active === false && L.arena && L.gate.open) L.bossDone = true;
  const [tx, ty] = camTarget(); cam.x += (tx - cam.x) * .1; cam.y += (ty - cam.y) * .12;
  toasts.forEach(q => q.t--); toasts = toasts.filter(q => q.t > 0);
  const P = W.P; if (P.hp < lastHp) trailHold = 28; if (P.hp > hpTrail) hpTrail = P.hp; else if (trailHold > 0) trailHold--; else hpTrail -= Math.max(.4, (hpTrail - P.hp) * .08); lastHp = P.hp;
  dispScore += (s.score - dispScore) * .18; if (Math.abs(s.score - dispScore) < 1) dispScore = s.score;
  if (banner && --banner.t <= 0) banner = null;
}

/* ---------- HUD ---------- */
function hud() {
  const s = S(), P = W.P;
  ctx.fillStyle = '#0d0809'; ctx.fillRect(0, PH, VW, VH - PH);
  ctx.fillStyle = '#3a2418'; ctx.fillRect(0, PH, VW, 3); ctx.fillStyle = '#c2452a'; ctx.fillRect(0, PH + 3, VW, 1);
  for (let x = 0; x < VW; x += 8) { ctx.fillStyle = '#efe6d2'; ctx.fillRect(x + 3, PH + 1, 2, 1); }
  const panel = (x, w) => { ctx.fillStyle = '#050304'; ctx.fillRect(x, PH + 7, w, 30); ctx.fillStyle = '#2a1a14'; ctx.fillRect(x, PH + 7, w, 1); ctx.fillRect(x, PH + 36, w, 1); };
  // left: score + collectibles
  panel(4, 160);
  { const bb = G.BIOMES[s.n]; G.txt(bb ? bb.name.toUpperCase() : '', 10, PH + 15, { size: 3.6, font: 'mono', color: '#8f7f70', shadow: false }); G.txt(bb ? bb.sub : '', 10, PH + 25, { size: 4.4, font: 'body', color: '#efe6d2', shadow: false, maxW: 58 }); }
  const col = [['feather', s.feathers], ['relic', s.relics], ['carving', s.lore.length + '/13'], ['glyph', s.glyphs || 0]];
  col.forEach(([k, v], i) => { const x = 72 + i * 23; ctx.drawImage(G.icon(k).r, x, PH + 11); G.txt(String(v), x + 6, PH + 33, { size: 4, font: 'mono', color: '#c8b8a0', align: 'center', shadow: false }); });
  // centre: portrait
  ctx.fillStyle = '#050304'; ctx.fillRect(173, PH + 4, 38, 35); ctx.fillStyle = '#c2452a'; ctx.fillRect(173, PH + 4, 38, 1); ctx.fillRect(173, PH + 38, 38, 1);
  const r = P ? P.hp / s.maxHp : 1;
  const state = P && P.power ? 'power' : P && P.hurtT > 0 ? 'hurt' : r > .75 ? 'full' : r > .5 ? 'minor' : r > .25 ? 'heavy' : 'near';
  const blink = (t % 200) < 7, look = P ? (P.vx > .5 ? 1 : P.vx < -.5 ? -1 : 0) : 0;
  ctx.drawImage(G.portrait(state, blink, look).r, 177, PH + 6);
  if (P && P.power) G.glow(ctx, 192, PH + 21, 22, '#f2c14e', .3 + .1 * Math.sin(t * .1));
  // right
  panel(216, 164);
  const bar = (x, y, w, v, c, c2, label) => { ctx.fillStyle = '#2a1a16'; ctx.fillRect(x, y, w, 5); ctx.fillStyle = c; ctx.fillRect(x, y, w * G.clamp(v, 0, 1), 5); ctx.fillStyle = c2; ctx.fillRect(x, y, w * G.clamp(v, 0, 1), 1); G.txt(label, x - 3, y + 4.6, { size: 3.6, font: 'mono', color: '#8f7f70', align: 'right', shadow: false }); };
  bar(238, PH + 11, 70, P ? P.hp / s.maxHp : 1, r > .3 ? '#3fae6a' : '#c2452a', '#8af0aa', 'ORA');
  if (P && hpTrail > P.hp) { ctx.fillStyle = 'rgba(239,230,210,.85)'; ctx.fillRect(238 + 70 * G.clamp(P.hp / s.maxHp, 0, 1), PH + 11, 70 * G.clamp((hpTrail - P.hp) / s.maxHp, 0, 1), 5); }
  if (P && P.hurtT > 0) { ctx.strokeStyle = '#ff5a3a'; ctx.strokeRect(237.5, PH + 10.5, 71, 6); }
  bar(238, PH + 20, 70, P ? P.mana / s.maxMana : 1, '#3ab8c8', '#a8f4ff', 'MANA');
  G.txt(`${Math.ceil(P ? P.hp : s.maxHp)}/${s.maxHp}`, 310, PH + 15.6, { size: 3.6, font: 'mono', color: '#c8b8a0', shadow: false });
  G.txt(`${Math.floor(P ? P.mana : s.maxMana)}/${s.maxMana}`, 310, PH + 24.6, { size: 3.6, font: 'mono', color: '#c8b8a0', shadow: false });
  G.txt(s.n === 1 ? 'PAPA' : 'RANGI', 345, PH + 13, { size: 3.6, font: 'mono', color: '#8f7f70', shadow: false }); G.txt(s.n === 1 ? '—' : String(s.n - 1).padStart(2, '0'), 345, PH + 22, { size: 6.5, font: 'mono', color: '#f2c14e', shadow: false });
  // abilities
  ['wings', 'dash', 'shield', 'burst', 'spear'].forEach((a, i) => { const x = 222 + i * 14, y = PH + 26; ctx.globalAlpha = s.ab.includes(a) ? 1 : .18; ctx.drawImage(a === 'wings' ? G.kereruSprite(0).r : G.icon(a).r, x, y); ctx.globalAlpha = 1; if (a === 'shield' && s.ab.includes(a) && P && P.shieldT > 0) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + 12 - P.shieldT / 600 * 12, 12, P.shieldT / 600 * 12); } });
  // kete + whatu-kura goals
  for (let i = 0; i < 5; i++) { const x = 296 + i * 9, y = PH + 28, got = s.complete; ctx.globalAlpha = got ? 1 : .22; ctx.drawImage(G.itemSprite(i < 3 ? 'kete' : i === 3 ? 'whatu1' : 'whatu2').r, x, y, 9, 9); ctx.globalAlpha = 1; }
}

/* ---------- render ---------- */
function render() {
  const s = S();
  octx.clearRect(0, 0, over.width, over.height); G.textQueue = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
  const inWorld = ['play', 'cine-wait', 'pause', 'popup', 'bossintro', 'dead', 'over', 'slots', 'controls', 'lore', 'sound', 'report', 'summary', 'crashed'].includes(s.mode) && W.L && !(s.mode === 'slots' && prevMode === 'title') && !(['lore', 'controls', 'sound', 'report'].includes(s.mode) && prevMode === 'title');
  hits = [];
  if (s.mode === 'cine') { G.Cine.draw(ctx); drawWipe(); return; }
  if (inWorld) {
    let sx = 0, sy = 0; if (shakeAmt > .2) { sx = (Math.random() - .5) * shakeAmt; sy = (Math.random() - .5) * shakeAmt; shakeAmt *= .86; }
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, VW, PH); ctx.clip();
    W.draw(ctx, { x: cam.x + sx, y: cam.y + sy }, t);
    for (const q of G.textQueue) G.txt(q.txt, q.x, q.y, { size: 5, font: 'mono', color: q.c, align: 'center', alpha: q.a });
    if (G.flash > .02) { if (!calm()) { ctx.fillStyle = `rgba(255,246,220,${G.flash})`; ctx.fillRect(0, 0, VW, PH); } G.flash *= .93; }
    if (G.fade > .02) { ctx.fillStyle = `rgba(0,0,0,${G.fade})`; ctx.fillRect(0, 0, VW, PH); G.fade *= .9; }
    if (s.mode === 'dead') { ctx.fillStyle = `rgba(60,10,20,${Math.min(.7, deadT / 80)})`; ctx.fillRect(0, 0, VW, PH); }
    ctx.restore();
    // boss bar
    const b = G.Boss.b; if (G.Boss.active && b && s.mode === 'play') { ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(72, 8, 240, 10); ctx.fillStyle = b.kind === 'whiro' ? '#7a1d9a' : '#b8361f'; ctx.fillRect(74, 10, 236 * Math.max(0, b.hp / b.max), 6); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(74, 10, 236 * Math.max(0, b.hp / b.max), 1); G.txt(b.name.toUpperCase(), VW / 2, 26, { size: 5, font: 'display', color: '#efe6d2', align: 'center' }); }
    // toasts
    if (s.mode === 'play' || s.mode === 'bossintro') { worldPrompts(); edgeFx(); if (G.prefs.hints) progressBar(); }
    // notification feed (top right): slides in, fades out
    toasts.forEach((q, i) => { const age = 240 - q.t, a = Math.min(1, q.t / 30), off = age < 12 ? (1 - ease(age / 12)) * 120 : 0, w = 132, x = VW - w - 6 + off, y = 26 + i * 22 + (b && G.Boss.active ? 10 : 0);
      ctx.fillStyle = `rgba(8,5,6,${.82 * a})`; ctx.fillRect(x, y - 7, w, q.b ? 19 : 11); ctx.fillStyle = `rgba(242,193,78,${a})`; ctx.fillRect(x, y - 7, 2, q.b ? 19 : 11);
      G.txt(q.a, x + 6, y + 1, { size: 5, font: 'display', color: '#f2c14e', alpha: a }); if (q.b) G.txt(q.b, x + 6, y + 8.5, { size: 3.8, font: 'body', color: '#d9ccb8', alpha: a, maxW: w - 10, lh: 5 }); });
    if (banner && (s.mode === 'play' || s.mode === 'bossintro')) { const a = Math.min(1, banner.t / 20, (150 - banner.t) / 15); ctx.fillStyle = `rgba(0,0,0,${.5 * a})`; ctx.fillRect(0, 80, VW, 30); G.txt(banner.txt.toUpperCase(), VW / 2, 99, { size: 10, font: 'display', color: '#f2c14e', align: 'center', alpha: a }); }
    if (s.mode === 'bossintro') bossIntro();
    hud();
    if (s.mode === 'pause') { dim(); G.txt('PAUSED', VW / 2, 46, { size: 14, font: 'display', color: '#f2c14e', align: 'center' }); G.txt(G.BIOMES[s.n].name + ' · ' + G.BIOMES[s.n].sub, VW / 2, 58, { size: 5, font: 'body', color: '#b9a998', align: 'center' }); drawMenu(MENU.pause(), VW / 2, 78, 170); }
    if (s.mode === 'popup') drawPopup();
    if (s.mode === 'over') { dim(.8); G.txt('WHIRO HOLDS THE PATH', VW / 2, 78, { size: 15, font: 'display', color: '#c2452a', align: 'center' }); drawMenu(MENU.over(), VW / 2, 116, 200); }
    if (s.mode === 'dead' && deadT > 30) G.txt('TĀNE FALLS. HE RISES AGAIN.', VW / 2, 96, { size: 10, font: 'display', color: '#efe6d2', align: 'center', alpha: Math.min(1, (deadT - 30) / 30) });
  } else drawTitleBg();
  if (s.mode === 'title') { drawTitle(); }
  if (s.mode === 'slots') { dim(.8); G.txt(slotMode === 'load' ? 'LOAD JOURNEY' : 'SAVE JOURNEY', VW / 2, 50, { size: 12, font: 'display', color: '#f2c14e', align: 'center' }); drawMenu(MENU.slots(), VW / 2, 76, 280); backBtn(); }
  if (s.mode === 'controls') drawControls();
  if (s.mode === 'sound') { dim(.88); const ttl = { root: 'SETTINGS', audio: 'AUDIO', game: 'GAMEPLAY', access: 'DISPLAY AND ACCESSIBILITY', keys: 'KEYBOARD KEYS', saves: 'SAVES AND PLAYTEST' }[setPage]; const items = MENU.sound(); G.txt(ttl, VW / 2, setPage === 'keys' ? 24 : 36, { size: 12, font: 'display', color: '#f2c14e', align: 'center' }); drawMenu(items, VW / 2, setPage === 'keys' ? 40 : 60, 240, 'center', setPage === 'keys' ? 12.2 : 14); if (setPage === 'game') G.txt(DIFF_TEXT[G.prefs.diff], VW / 2, 124, { size: 4.6, font: 'body', color: '#c8b8a0', align: 'center', maxW: 240 }); if (setPage === 'keys') G.txt('Choose an action, then press the new key. Arrow keys always work. Esc cancels.', VW / 2, 222, { size: 4, font: 'body', color: '#c8b8a0', align: 'center' }); G.txt(G.prompt('adjust') + ' adjust · ' + G.prompt('back') + ' back', VW / 2, VH - 8, { size: 4, font: 'mono', color: '#8f7f70', align: 'center' }); backBtn(); }
  if (s.mode === 'lore') drawLore();
  if (s.mode === 'report') { dim(.92); G.txt('PLAYTEST REPORT', VW / 2, 24, { size: 11, font: 'display', color: '#f2c14e', align: 'center' }); const lines = G.plog.report().split('\n').slice(0, 14); lines.forEach((ln, i) => G.txt(ln, 24, 40 + i * 7.2, { size: 4.2, font: 'mono', color: i < 2 ? '#c8b8a0' : '#efe6d2', fixed: true })); drawMenu(MENU.report(), VW / 2, 158, 200); G.txt('Ask your playtesters to copy this and send it to you. Nothing leaves their browser otherwise.', VW / 2, 228, { size: 4, font: 'body', color: '#8f7f70', align: 'center' }); backBtn(() => { S().mode = 'sound'; setPage = 'saves'; menuSel = 2; }); }
  if (s.mode === 'newgame') { dim(.75); G.txt('CHOOSE YOUR PATH', VW / 2, 44, { size: 13, font: 'display', color: '#f2c14e', align: 'center' }); const items = MENU.newgame(); drawMenu(items, VW / 2, 74, 160); const d = ['assist', 'normal', 'hard'].at(Math.min(2, menuSel)); if (menuSel < 3) G.txt(DIFF_TEXT[d], VW / 2, 140, { size: 5, font: 'body', color: '#d9ccb8', align: 'center', maxW: 260 }); G.txt('You can change this any time in Settings.', VW / 2, 160, { size: 4.2, font: 'body', color: '#8f7f70', align: 'center' }); backBtn(() => { S().mode = 'title'; menuSel = 1; }); }
  if (s.mode === 'summary' && summary) drawSummary();
  if (s.mode === 'crashed') { dim(.9); G.txt('SOMETHING WENT WRONG', VW / 2, 64, { size: 13, font: 'display', color: '#c2452a', align: 'center' }); G.txt('The game hit an error. Your progress up to the last carved pou is safe.', VW / 2, 80, { size: 5, font: 'body', color: '#efe6d2', align: 'center', maxW: 280 }); drawMenu(MENU.crashed(), VW / 2, 110, 220); if (crash) G.txt(crash.msg, VW / 2, 160, { size: 3.6, font: 'mono', color: '#8f7f70', align: 'center', maxW: 320, fixed: true }); G.txt('The error is saved in the playtest report.', VW / 2, 200, { size: 4, font: 'body', color: '#8f7f70', align: 'center' }); }
  if (s.mode === 'boot') { G.txt('Loading the heavens…', VW / 2, VH / 2, { size: 6, font: 'body', color: '#b9a998', align: 'center' }); }
  drawWipe();
}
function drawSummary() {
  const z = summary, k = ease(z.t / 30); dim(.7 * k);
  ctx.fillStyle = `rgba(18,11,12,${.96 * k})`; ctx.fillRect(72, 26, 240, 160); ctx.fillStyle = '#c2452a'; ctx.fillRect(72, 26, 240, 2); ctx.fillRect(72, 184, 240, 2);
  G.txt(G.BIOMES[z.n].name.toUpperCase() + ' \u00b7 THE WORLD BELOW', VW / 2, 46, { size: 11, font: 'display', color: '#f2c14e', align: 'center', alpha: k });
  ctx.save(); ctx.globalAlpha = k; G.drawWorldBelow(ctx, 92, 56, 200, 80, z.n - 1 + G.clamp((z.t - 20) / 60, 0, 1) * (z.t > 20 ? 1 : 0) >= z.n - .5 ? z.n : z.n - 1, t); ctx.restore();
  G.txt(WORLD_LINE[z.n] || '', VW / 2, 148, { size: 5.4, font: 'body', color: '#efe6d2', align: 'center', alpha: ease((z.t - 70) / 20) });
  G.txt('Secrets found ' + z.found + ' of ' + z.total + '  ·  ' + fmtTime(z.secs), VW / 2, 162, { size: 4, font: 'mono', color: '#8f7f70', align: 'center', alpha: ease((z.t - 80) / 20) });
  if (z.t > 90) drawMenu(MENU.summary(), VW / 2, 178, 140);
}
/* the world below (Papatūānuku), shown after each heaven: it changes because of the climb */
const WORLD_LINE = { 1: 'Light reaches the world below. The first shoots break the earth.', 2: 'Birds fly down to the world below.', 3: 'Rain falls softly on the young forest.', 4: 'Rivers begin to run.', 5: 'Forest spreads across the land.', 6: 'The tides begin to move.', 7: 'Stars appear over the land.', 8: 'The seasons begin to turn.', 9: 'The long night lifts. Dawn returns below.', 10: 'Rūaumoko stirs. Mountains rise from the shaking land.', 11: 'The people gather and light their fires.', 12: 'Daylight spreads over the whole world.' };
G.WORLD_LINE = WORLD_LINE;
G.drawWorldBelow = (ctx, x, y, w, h, stage, tt) => {
  const st = G.clamp(stage, 0, 13), night = st === 8 || st === 9 ? .6 : 0;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, G.mixHex(st >= 7 && st < 10 ? '#0a1028' : '#3a5a8a', '#06070e', night)); g.addColorStop(1, G.mixHex('#a8c8e0', '#1a1a2a', night)); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  if (st >= 7) for (let i = 0; i < 24; i++) { const r = G.rng(i * 13 + 5); ctx.fillStyle = `rgba(239,230,210,${(.3 + .5 * Math.abs(Math.sin(tt * .03 + i))) * (st >= 10 ? .35 : 1)})`; ctx.fillRect(x + r() * w, y + r() * h * .45, 1, 1); }
  const hills = (base, amp, col, seed) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + h); for (let i = 0; i <= w; i += 4) ctx.lineTo(x + i, y + base - amp * (Math.sin((i + seed) * .045) * .6 + Math.sin((i + seed * 2) * .11) * .4)); ctx.lineTo(x + w, y + h); ctx.fill(); };
  const green = k => G.mixHex('#5a4632', '#2f6a3a', G.clamp(k, 0, 1));
  if (st >= 10) hills(h * .45, h * .28, G.mixHex('#4a5a6a', '#2a3a4a', night), 40);     // mountains
  hills(h * .62, h * .12, G.mixHex(green((st - 1) / 5), '#0a0c10', night), 10);
  // ocean and tides
  ctx.fillStyle = G.mixHex('#2a5a8a', '#0a1428', night); const tide = st >= 6 ? Math.sin(tt * .03) * 1.5 : 0; ctx.fillRect(x + w * .72, y + h * .78 + tide, w * .28, h);
  hills(h * .8, h * .06, G.mixHex(green((st - 1) / 4), '#08090c', night), 90);
  // first shoots, then forest
  if (st >= 1) for (let i = 0; i < (st >= 5 ? 26 : 8 + st * 3); i++) { const r = G.rng(i * 31 + 7), fx = x + r() * w * .68, fy = y + h * (.66 + r() * .2), hh = st >= 5 ? 4 + r() * 6 : 1 + st; ctx.fillStyle = G.mixHex('#3f8a3a', '#10180c', night); ctx.fillRect(Math.round(fx), Math.round(fy - hh), st >= 5 ? 3 : 1, Math.round(hh)); if (st >= 5) { ctx.fillStyle = G.mixHex('#58b04a', '#10180c', night); ctx.fillRect(Math.round(fx - 1), Math.round(fy - hh), 5, 2); } }
  // rivers
  if (st >= 4) { ctx.strokeStyle = G.mixHex('#7ac8e8', '#203048', night); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + w * .15, y + h * .62); ctx.bezierCurveTo(x + w * .35, y + h * .8, x + w * .5, y + h * .7, x + w * .72, y + h * .86); ctx.stroke(); ctx.lineWidth = 1; }
  // rain
  if (st === 3) { ctx.fillStyle = 'rgba(200,220,255,.5)'; for (let i = 0; i < 40; i++) { const r = G.rng(i * 7 + 2); ctx.fillRect(x + r() * w, y + ((r() * h + tt * 2) % h), 1, 3); } }
  // birds
  if (st >= 2) for (let i = 0; i < 4; i++) { const bx = x + ((tt * (.3 + i * .1) + i * 70) % w), by = y + h * .3 + Math.sin(tt * .05 + i) * 4 + i * 5; ctx.fillStyle = '#1a1a1a'; ctx.fillRect(bx, by, 2, 1); ctx.fillRect(bx + 2, by - 1, 1, 1); ctx.fillRect(bx - 1, by - 1, 1, 1); }
  // people and fires
  if (st >= 11) for (let i = 0; i < 4; i++) { const fx = x + w * (.2 + i * .13), fy = y + h * .84; G.glow(ctx, fx, fy, 8, '#ff8a3a', .5); ctx.fillStyle = '#ffb060'; ctx.fillRect(fx, fy - 1, 2, 2); }
  // dawn
  if (st === 9 || st >= 12) G.glow(ctx, x + w * .5, y + h * .55, h * .9, '#fff1c0', st >= 12 ? .35 : .25);
  ctx.restore(); ctx.strokeStyle = '#c2452a'; ctx.strokeRect(x - .5, y - .5, w + 1, h + 1);
};
function progressBar() {
  const L = W.L, P = W.P; if (!L || !P || G.Boss.active) return;
  const x0 = L.start.x, x1 = L.arena ? L.arena.x0 : L.gate.x, k = G.clamp((P.x - x0) / (x1 - x0), 0, 1), bx = VW / 2 - 80, w = 160, y = 9;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx - 4, y - 5, w + 8, 10);
  ctx.fillStyle = 'rgba(239,230,210,.25)'; ctx.fillRect(bx, y, w, 1); ctx.fillStyle = '#f2c14e'; ctx.fillRect(bx, y, w * k, 1);
  for (let i = 0; i <= 10; i++) { ctx.fillStyle = 'rgba(239,230,210,.35)'; ctx.fillRect(bx + i * w / 10, y - (i % 5 ? 1 : 2), 1, i % 5 ? 2 : 4); }
  for (const p of L.pous) { const px = bx + G.clamp((p.x - x0) / (x1 - x0), 0, 1) * w; ctx.fillStyle = p.lit ? '#f2c14e' : '#8f7f70'; ctx.fillRect(px - 1, y - 3, 3, 3); }
  if (L.arena) { ctx.fillStyle = '#c2452a'; ctx.beginPath(); ctx.moveTo(bx + w, y - 4); ctx.lineTo(bx + w + 4, y); ctx.lineTo(bx + w, y + 4); ctx.lineTo(bx + w - 4, y); ctx.fill(); }
  else { ctx.fillStyle = '#efe6d2'; ctx.fillRect(bx + w - 3, y - 4, 1, 5); ctx.fillRect(bx + w + 2, y - 4, 1, 5); ctx.fillRect(bx + w - 4, y - 5, 8, 1); }
  const px = bx + w * k; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(px - 3, y - 5); ctx.lineTo(px + 3, y - 5); ctx.lineTo(px, y - 1); ctx.fill();
  G.txt(G.heavenShort(S().n).toUpperCase(), bx - 8, y + 2, { size: 3.8, font: 'mono', color: '#c8b8a0', align: 'right' });
  G.txt(Math.round(k * 100) + '%', bx + w + 9, y + 2, { size: 3.8, font: 'mono', color: '#f2c14e' });
}
function worldPrompts() {
  const L = W.L, P = W.P, px = P.x + 5;
  const tag = (wx, wy, txt) => G.txt(txt, wx - cam.x, wy - cam.y, { size: 4.4, font: 'mono', color: '#fff1c0', align: 'center', alpha: calm() ? 1 : .75 + .25 * Math.sin(t * .1) });
  // carved signs teach one move each (always shown, hints setting or not)
  for (const sg of L.signs) { const d = Math.abs(px - (sg.x + 7)); if (d > 130) continue; const a = G.clamp((130 - d) / 30, 0, 1), x = G.clamp(sg.x + 7 - cam.x, 70, VW - 70), y = sg.y - cam.y - 10;
    ctx.fillStyle = `rgba(8,5,6,${.8 * a})`; ctx.fillRect(x - 66, y - 9, 132, 13); ctx.fillStyle = `rgba(242,193,78,${a})`; ctx.fillRect(x - 66, y - 9, 2, 13); G.txt(G.fmt(W.SIGNS[sg.i]), x, y, { size: 4.3, font: 'body', color: '#fff1c0', align: 'center', alpha: a, maxW: 126, lh: 5.5 }); }
  // a sealed glyph gate explains itself and points at the stones still asleep (always shown)
  for (const gi in L.doors) { const d = L.doors[gi], X = d[0][0] * T + 8; if (L.g[d[0][1]][d[0][0]] !== 6 || Math.abs(px - X) > 150) continue;
    const left = L.switches.filter(q => q.g == gi && !q.on), a = G.clamp((150 - Math.abs(px - X)) / 40, 0, 1);
    const gy = Math.max(...d.map(q => q[1])) * T - 30; tag(X, gy, 'SEALED GATE');
    G.txt(left.some(q => q.bird) ? 'Whiro\u2019s swarm caged a kerer\u016b: strike the cage' : 'Wake ' + (left.length === 1 ? 'the carved stone' : 'all ' + left.length + ' carved stones') + ' with a strike or a light bolt', X - cam.x, gy - cam.y + 7, { size: 3.8, font: 'body', color: '#efe6d2', align: 'center', alpha: a });
    for (const q of left) { const sx = q.x + 6 - cam.x, sy = q.y - 10 - cam.y + (calm() ? 0 : Math.sin(t * .15) * 2); ctx.fillStyle = `rgba(242,193,78,${a})`; ctx.beginPath(); ctx.moveTo(sx - 4, sy - 5); ctx.lineTo(sx + 4, sy - 5); ctx.lineTo(sx, sy); ctx.fill(); } }
  if (!G.prefs.hints) return;
  if (L.gate && L.gate.open && Math.abs(px - (L.gate.x + 24)) < 90) tag(L.gate.x + 24, L.gate.y - 72, '▲ ASCEND');
  if (L.shrine && !L.shrine.taken && Math.abs(px - L.shrine.x) < 70) tag(L.shrine.x + 8, L.shrine.y - 20, G.ABIL[L.shrine.ab].name.toUpperCase());
  for (const p of L.pous) if (!p.lit && Math.abs(px - (p.x + 8)) < 60) tag(p.x + 8, p.y - 6, 'CHECKPOINT');
}
function edgeFx() {
  const P = W.P, r = P.hp / S().maxHp;
  if (r < .3 && P.hp > 0) { const a = (.3 - r) / .3 * (calm() ? .4 : .35 + .15 * Math.sin(t * .15)); const g = ctx.createRadialGradient(VW / 2, PH / 2, PH * .35, VW / 2, PH / 2, VW * .65); g.addColorStop(0, 'rgba(120,10,20,0)'); g.addColorStop(1, `rgba(150,10,20,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, PH); }
  if (P.hurtT > 0 && P.hurtSide) { const a = P.hurtT / 18 * .5, right = P.hurtSide > 0, g = ctx.createLinearGradient(right ? VW : 0, 0, right ? VW - 60 : 60, 0); g.addColorStop(0, `rgba(220,40,30,${a})`); g.addColorStop(1, 'rgba(220,40,30,0)'); ctx.fillStyle = g; ctx.fillRect(right ? VW - 60 : 0, 0, 60, PH); }
}
function backBtn(fn) { const x = 8, y = 6; ctx.fillStyle = 'rgba(194,69,42,.85)'; ctx.fillRect(x, y, 30, 11); G.txt('◀ BACK', x + 15, y + 8, { size: 4.2, font: 'mono', color: '#fff', align: 'center' }); addHit(x - 4, y - 4, 38, 19, () => { G.audio.sfx('back'); if (fn) fn(); else { S().mode = prevMode; menuSel = 0; } }); }
const dim = (a = .65) => { ctx.fillStyle = `rgba(6,4,6,${a})`; ctx.fillRect(0, 0, VW, VH); };
function bossIntro() {
  const it = G.Boss.intro, k = Math.min(1, it.t / 30);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, 22 * k); ctx.fillRect(0, PH - 30 * k, VW, 30 * k);
  if (it.t > 40) { const a = Math.min(1, (it.t - 40) / 20); ctx.fillStyle = `rgba(0,0,0,${.55 * a})`; ctx.fillRect(0, 38, VW, 52); G.txt(it.name.toUpperCase(), VW / 2, 60, { size: 16, font: 'display', color: '#f2c14e', align: 'center', alpha: a }); G.txt(it.line, VW / 2, 74, { size: 5.2, font: 'body', color: '#efe6d2', align: 'center', alpha: a, maxW: 260, lh: 7.5 }); }
}
function drawPopup() {
  dim(.6); const p = popup; if (!p) return;
  ctx.fillStyle = '#120b0c'; ctx.fillRect(52, 34, 280, 132); ctx.fillStyle = '#c2452a'; ctx.fillRect(52, 34, 280, 2); ctx.fillRect(52, 164, 280, 2);
  for (let x = 56; x < 330; x += 8) { ctx.fillStyle = '#efe6d2'; ctx.fillRect(x, 37, 2, 1); }
  if (p.kind === 'ability') {
    const A = G.ABIL[p.ab]; G.glow(ctx, VW / 2, 74, 30 + Math.sin(t * .1) * 4, '#f2c14e', .5); ctx.drawImage(p.ab === 'wings' ? G.kereruSprite(Math.floor(t / 6) % 2).r : G.icon(p.ab).r, VW / 2 - 12, 62, 24, p.ab === 'wings' ? 20 : 24);
    G.txt('NEW DIVINE ABILITY', VW / 2, 54, { size: 4.5, font: 'mono', color: '#c2452a', align: 'center' });
    G.txt(A.name.toUpperCase(), VW / 2, 104, { size: 12, font: 'display', color: '#f2c14e', align: 'center' });
    G.txt(G.fmt(A.text), VW / 2, 118, { size: 5.5, font: 'body', color: '#efe6d2', align: 'center', maxW: 240 });
  } else {
    const e = G.LORE[p.n]; G.drawLoreIllustration(ctx, p.n, 62, 44, 90, 112, t);
    G.txt('CARVING ' + p.n + ' OF 13', 162, 54, { size: 4.2, font: 'mono', color: '#c2452a' });
    G.txt(e.t, 162, 68, { size: 8.5, font: 'display', color: '#f2c14e', maxW: 160 });
    G.txt(e.b, 162, 84, { size: 4.8, font: 'body', color: '#efe6d2', maxW: 160, lh: 7 });
  }
  if (p.t > 30) G.txt(G.input.last === 'touch' ? 'Tap to continue' : 'Press ' + G.prompt('ok') + ' to continue', VW / 2, 160, { size: 4, font: 'mono', color: '#8f7f70', align: 'center', alpha: .6 + .4 * Math.sin(t * .1) });
}
const KUPU = [['Ranginui, Rangi', 'the sky father'], ['Papatūānuku, Papa', 'the earth mother'], ['Te Kore', 'the nothingness, before all'], ['Te Pō', 'the long night'], ['Te Ao Mārama', 'the world of light'],
  ['Whiro', 'Tāne’s elder brother, of darkness'], ['rangi', 'sky; one of the twelve heavens'], ['Toi-o-ngā-Rangi', 'the twelfth, highest heaven'], ['Io-matua-kore', 'the parentless one, in some tellings'], ['kete', 'basket'],
  ['wānanga', 'knowledge, learning'], ['whare wānanga', 'house of learning'], ['whatu-kura', 'sacred stones of knowledge'], ['whakapapa', 'genealogy, line of descent'], ['tūpuna', 'ancestors'],
  ['mana', 'power and authority; here, Tāne’s light and strength'], ['tapu', 'sacred, set apart'], ['karakia', 'prayer, incantation'], ['mākutu', 'harmful magic'], ['taiaha', 'long wooden fighting staff'],
  ['pou', 'carved post'], ['pounamu', 'greenstone'], ['kererū', 'native wood pigeon'], ['ngārara', 'lizard, reptile'], ['pekapeka', 'native bat'], ['Tahu-nui-a-Rangi', 'the aurora, great glow of the sky']];
function drawKupu() {
  G.txt('KUPU · WORDS IN THIS STORY', 140, 20, { size: 5, font: 'mono', color: '#c2452a' });
  KUPU.forEach(([w, m], i) => { const col = i < 13 ? 0 : 1, row = i % 13, x = 140 + col * 116, y = 30 + row * 12.8;
    G.txt(w, x, y, { size: 4.4, font: 'body', color: '#f2c14e', maxW: 110 }); G.txt(m, x, y + 5.6, { size: 3.8, font: 'body', color: '#d9ccb8', maxW: 112 }); });
}
function drawLore() {
  dim(.9); const s = S(), list = [...Object.keys(G.LORE).map(Number), 'kupu'], n = list[loreSel], have = s.lore.includes(n);
  G.txt('LORE BOOK', 44, 15, { size: 10, font: 'display', color: '#f2c14e' }); G.txt(s.lore.length + ' of 13 carvings found', 20, 32, { size: 4.2, font: 'mono', color: '#8f7f70' });
  list.forEach((k, i) => { const y = 42 + i * 11.4, sel = i === loreSel, got = s.lore.includes(k); if (sel) { ctx.fillStyle = 'rgba(194,69,42,.8)'; ctx.fillRect(16, y - 7.5, 110, 10.5); } G.txt(k === 'kupu' ? 'Kupu · Words in this story' : G.heavenShort(k) + ' · ' + (got ? G.LORE[k].t : '???'), 20, y, { size: 4.3, font: 'body', color: sel ? '#fff' : got || k === 'kupu' ? '#d9ccb8' : '#5a4a44', maxW: 104 }); });
  if (n === 'kupu') drawKupu();
  else if (have) { G.drawLoreIllustration(ctx, n, 140, 20, 228, 80, t); G.txt(G.LORE[n].t, 140, 114, { size: 9, font: 'display', color: '#f2c14e', maxW: 228 }); G.txt(G.LORE[n].b, 140, 128, { size: 5.2, font: 'body', color: '#efe6d2', maxW: 228, lh: 7.6 }); }
  else { ctx.fillStyle = '#140c0e'; ctx.fillRect(140, 20, 228, 80); G.txt('This carving has not been found.', 254, 64, { size: 5, font: 'body', color: '#6a5a54', align: 'center' }); G.txt('Look for carved panels hidden in ' + G.BIOMES[n].name + (n === 13 ? ' (Toi-o-ngā-Rangi)' : '') + '.', 140, 118, { size: 5, font: 'body', color: '#8f7f70', maxW: 228 }); }
  list.forEach((k, i) => addHit(16, 42 + i * 11.4 - 8, 110, 11, () => { if (loreSel !== i) { loreSel = i; G.audio.sfx('select'); } }));
  G.txt(G.prompt('nav') + ' choose · ' + G.prompt('back') + ' close', VW - 10, VH - 8, { size: 4, font: 'mono', color: '#8f7f70', align: 'right' });
  backBtn(() => { S().mode = prevMode === 'play' ? 'play' : prevMode; menuSel = 0; });
}
function drawControls() {
  dim(.92); G.txt('CONTROLS', VW / 2, 28, { size: 12, font: 'display', color: '#f2c14e', align: 'center' });
  const dev = G.input.last;
  if (dev === 'touch' || dev === 'pad') { const T = dev === 'touch', rr = [
      ['Move · climb vines (up) · crouch (down)', T ? 'Drag on the left side' : 'Left stick or D-pad'],
      ['Jump · wall jump · Kerer\u016b Lift (in air)', T ? 'JUMP' : 'A'],
      ['Drop through a branch', T ? 'Stick down + JUMP' : 'Down + A'],
      ['Strike (3-hit combo) · air strike', T ? 'STRIKE' : 'X'],
      ['Heavy strike (breaks guards)', T ? 'HEAVY, or stick up/down + STRIKE' : 'RT, or up/down + X'],
      ['Light bolt · hold to charge (Star Spear)', T ? 'LIGHT' : 'Y or LB'],
      ['Mana Burst (once earned)', T ? 'BURST, or stick down + LIGHT' : 'LT, or down + Y'],
      ['Roll · Celestial Dash (in air)', T ? 'ROLL' : 'B or RB'],
      ['Slide · brace against wind', T ? 'Stick down (running · standing)' : 'Down (running · standing)'],
      ['Strike seeds, moon stones, cages', T ? 'STRIKE or LIGHT' : 'X or Y'],
      ['Push (opening and ending)', T ? 'Press and hold anywhere' : 'Hold A'],
      ['Lore book · menu', T ? 'LORE · \u275a\u275a' : 'Select · Start']];
    rr.forEach(([a, b], i) => { G.txt(a, 40, 46 + i * 11.4, { size: 4.6, font: 'body', color: '#d9ccb8' }); G.txt(b, 344, 46 + i * 11.4, { size: 4.6, font: 'mono', color: '#f2c14e', align: 'right' }); }); backBtn(); return; }
  const K = a => G.keys.list(a), L1 = a => G.keys.label(a);
  const rows = [['Move', K('left') + ' / ' + K('right')], ['Climb vines / look', K('up') + ' / ' + K('down')], ['Jump · wall jump · Kerer\u016b Lift', K('jump')], ['Taiaha strike (3-hit combo)', K('attack')], ['Heavy strike', L1('heavy') + ', or ' + L1('up') + '/' + L1('down') + ' + ' + L1('attack')], ['Air strike', L1('attack') + ' while jumping'], ['Light bolt · hold to charge (Star Spear)', K('light')], ['Mana Burst', L1('burst') + ', or ' + L1('down') + ' + ' + L1('light')], ['Roll · Celestial Dash in air', K('roll')], ['Crouch · slide when running · brace', L1('down')], ['Drop through a branch', L1('down') + ' + ' + L1('jump')], ['Grab ledge', 'Jump into a ledge, ' + L1('up') + ' to climb'], ['Strike seeds, moon stones, cages', L1('attack') + ' or ' + L1('light')], ['Push (opening and ending)', 'Hold ' + L1('jump')], ['Lore book', K('lore')], ['Pause', K('pause')], ['Change keys', 'Settings → Keyboard keys']];
  rows.forEach(([a, b], i) => { G.txt(a, 50, 42 + i * 8.6, { size: 4.2, font: 'body', color: '#d9ccb8' }); G.txt(b, 334, 42 + i * 8.6, { size: 4.2, font: 'mono', color: '#f2c14e', align: 'right' }); });
  G.txt(G.prompt('back') + ' to go back', VW / 2, VH - 8, { size: 4, font: 'mono', color: '#8f7f70', align: 'center' }); backBtn();
}
function drawTitleBg() {
  const n = 1 + Math.floor(t / 900) % 13, b = G.buildBiome(n);
  ctx.drawImage(b.skyC, 0, 0, VW, VH);
  const lay = (img, par, y) => { let ox = -((t * par) % 512 + 512) % 512; for (let x = ox; x < VW; x += 512) ctx.drawImage(img, x, y); };
  lay(b.farC, .2, 10); lay(b.midC, .5, 40);
  ctx.fillStyle = 'rgba(6,4,6,.45)'; ctx.fillRect(0, 0, VW, VH);
  const sp = G.tane('idle', Math.floor(t / 10) % 4); ctx.fillStyle = '#060406'; ctx.beginPath(); ctx.moveTo(250, VH); ctx.lineTo(262, 200); ctx.lineTo(330, 192); ctx.lineTo(360, VH); ctx.fill(); ctx.drawImage(G.tint(sp.r, '#060406'), 280, 149);
  const fade = (t % 900) < 30 ? 1 - (t % 900) / 30 : (t % 900) > 870 ? ((t % 900) - 870) / 30 : 0; if (fade) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, VW, VH); }
}
function drawTitle() {
  G.txt("TĀNE'S ASCENT", 28, 70, { size: 26, font: 'display', color: '#efe6d2' });
  ctx.fillStyle = '#c2452a'; ctx.fillRect(28, 78, 170, 2); for (let x = 28; x < 198; x += 8) { ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x + 3, 84); ctx.lineTo(x + 6, 80); ctx.fill(); }
  G.txt('NGĀ KETE O TE WĀNANGA', 28, 96, { size: 6.5, font: 'mono', color: '#f2c14e' });
  drawMenu(MENU.title(), 30, 122, 126, 'left');
  const d = slotInfo('auto'); if (d && menuSel === 0) G.txt(G.BIOMES[d.n].name + ' · ' + G.BIOMES[d.n].sub + '', 30, 214, { size: 4.2, font: 'mono', color: '#c8b8a0', alpha: ease(modeT / 20) });
  G.txt(G.input.last === 'touch' ? 'Tap to choose · turn your phone sideways for full screen' : G.input.last === 'pad' ? 'D-pad to choose · A to select' : 'Click, or use ↑ ↓ and Enter', 28, VH - 6, { size: 4, font: 'mono', color: '#8f7f70' });
  { const A = G.audio, msg = A.muted ? 'Sound is off · Settings \u2192 Audio' : (!A.ctx || A.ctx.state !== 'running') ? 'Sound starts at your first tap or key' : ''; if (msg) G.txt(msg, VW - 28, VH - 6, { size: 4, font: 'mono', color: '#c8b8a0', align: 'right' }); }
}

/* ---------- loop ---------- */
let acc = 0, last = performance.now();
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { G.pollPad(); try { update(); } catch (e) { G.reportError(e); } G.endInputFrame(); acc -= 1000 / 60; }
  try { render(); } catch (e) { G.reportError(e); }
  requestAnimationFrame(frame);
}
G.boot = () => {
  const go = () => { if (S().mode === 'boot') { S().mode = 'title'; G.audio.setMood('story'); G.audio.setBiome(0); } };
  try { Promise.race([Promise.all(["700 20px Oswald", "500 20px 'IBM Plex Sans'", "700 20px 'IBM Plex Mono'"].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2500))]).then(go, go); } catch (e) { go(); }
  for (let i = 1; i <= 13; i++) setTimeout(() => G.buildBiome(i), i * 60);
  requestAnimationFrame(frame);
};
document.addEventListener('visibilitychange', () => { if (document.hidden && S().mode === 'play') { S().mode = 'pause'; menuSel = 0; } G.audio.suspend(document.hidden); });
G.boot();
})();
