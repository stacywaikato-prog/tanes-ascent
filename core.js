/* Tāne's Ascent — core: utilities, pixel sprites, input, audio */
window.G = window.G || {};
(() => {
const G = window.G;
G.VW = 384; G.VH = 240; G.PH = 200; G.T = 16;
G.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
G.lerp = (a, b, t) => a + (b - a) * t;
G.rand = (a, b) => a + Math.random() * (b - a);
G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
G.rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
G.rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
G.mix = (a, b, t) => { const A = G.rgb(a), B = G.rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
G.mixHex = (a, b, t) => { const A = G.rgb(a), B = G.rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
G.alpha = (h, a) => { const c = G.rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
G.hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
G.mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };

/* ---------- pixel drawing surface ---------- */
class PX {
  constructor(w, h) { [this.c, this.x] = G.mk(w, h); this.w = w; this.h = h; }
  p(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.x.fillStyle = c; this.x.fillRect(x, y, 1, 1); }
  r(x, y, w, h, c) { this.x.fillStyle = c; this.x.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }
  l(x0, y0, x1, y1, c, w = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, n = 0;
    this.x.fillStyle = c; const o = w >> 1;
    for (;;) { this.x.fillRect(x0 - o, y0 - o, w, w); if (x0 === x1 && y0 === y1 || n++ > 400) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  circ(cx, cy, r, c) { this.x.fillStyle = c; for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y) + r * .4)); this.x.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
  ell(cx, cy, rx, ry, c) { this.x.fillStyle = c; for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + .01)))); this.x.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
  poly(pts, c) { const x = this.x; x.fillStyle = c; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.closePath(); x.fill(); }
  outline(col = '#0b0708', alphaCut = 40) {
    const d = this.x.getImageData(0, 0, this.w, this.h), a = d.data, src = new Uint8ClampedArray(a), [r, g, b] = G.rgb(col), W = this.w, H = this.h;
    // snap semi-transparent edges from poly fills to crisp pixels
    for (let i = 3; i < a.length; i += 4) { if (src[i] < alphaCut) { src[i] = 0; a[i] = 0; } else if (src[i] < 255) { a[i] = 255; src[i] = 255; } }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; if (src[i + 3]) continue;
      const n = (x > 0 && src[i - 1]) || (x < W - 1 && src[i + 7]) || (y > 0 && src[i - W * 4 + 3]) || (y < H - 1 && src[i + W * 4 + 3]);
      if (n) { a[i] = r; a[i + 1] = g; a[i + 2] = b; a[i + 3] = 255; }
    }
    this.x.putImageData(d, 0, 0); return this;
  }
  flip() { const o = new PX(this.w, this.h); o.x.translate(this.w, 0); o.x.scale(-1, 1); o.x.drawImage(this.c, 0, 0); return o; }
}
G.PX = PX;
G.cache = new Map();
const tintMap = new Map();
G.tint = (img, col) => { let m = tintMap.get(img); if (!m) { m = {}; tintMap.set(img, m); } if (m[col]) return m[col]; const [c, x] = G.mk(img.width, img.height); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, img.width, img.height); m[col] = c; return c; };
G.sprite = (key, w, h, fn, outline = '#0b0708') => {
  let s = G.cache.get(key); if (s) return s;
  const p = new PX(w, h); fn(p); if (outline) p.outline(outline);
  s = { r: p.c, l: p.flip().c, w, h }; G.cache.set(key, s); return s;
};

/* ---------- input ---------- */
const ACT = ['left', 'right', 'up', 'down', 'jump', 'attack', 'light', 'roll', 'ok', 'back', 'pause', 'lore', 'heavy', 'burst'];
const DEFAULT_KEYS = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyZ: 'jump', KeyK: 'jump', KeyX: 'attack', KeyJ: 'attack', KeyC: 'light', KeyL: 'light',
  ShiftLeft: 'roll', ShiftRight: 'roll', KeyV: 'roll', Enter: 'ok', Escape: 'pause', KeyP: 'pause', Backspace: 'back', KeyQ: 'lore', Tab: 'lore', KeyF: 'heavy', KeyR: 'burst'
};
/* Rebindable keys: arrows always work; a custom key replaces that action's letter keys. */
const KEYMAP = {}; let custom = {};
try { custom = JSON.parse(localStorage.getItem('tanes-ascent-keys') || '{}') || {}; } catch (e) { custom = {}; }
const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
function buildKeys() {
  for (const k in KEYMAP) delete KEYMAP[k];
  for (const k in DEFAULT_KEYS) if (!(custom[DEFAULT_KEYS[k]] && !ARROWS.includes(k) && !['Escape', 'Enter'].includes(k))) KEYMAP[k] = DEFAULT_KEYS[k];
  for (const a in custom) { for (const k in KEYMAP) if (k === custom[a]) delete KEYMAP[k]; KEYMAP[custom[a]] = a; }
}
buildKeys();
const PRETTY = { Space: 'Space', ShiftLeft: 'Shift', ShiftRight: 'R-Shift', ControlLeft: 'Ctrl', ControlRight: 'R-Ctrl', AltLeft: 'Alt', Enter: 'Enter', Escape: 'Esc', Backspace: 'Backspace', Tab: 'Tab', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' };
const pretty = c => PRETTY[c] || c.replace(/^Key|^Digit|^Numpad/, '');
G.keys = {
  REBINDABLE: ['jump', 'attack', 'light', 'roll', 'heavy', 'burst', 'left', 'right', 'up', 'down', 'lore', 'pause'],
  codes: a => Object.keys(KEYMAP).filter(k => KEYMAP[k] === a),
  label: a => { const c = G.keys.codes(a); const pick = custom[a] || c.find(k => !ARROWS.includes(k)) || c[0]; return pick ? pretty(pick) : '—'; },
  list: a => G.keys.codes(a).map(pretty).join(', '),
  bind: (a, code) => { for (const k in custom) if (custom[k] === code) delete custom[k]; custom[a] = code; buildKeys(); try { localStorage.setItem('tanes-ascent-keys', JSON.stringify(custom)); } catch (e) { } return true; },
  reset: () => { custom = {}; buildKeys(); try { localStorage.removeItem('tanes-ascent-keys'); } catch (e) { } },
  capturing: null
};
/* Difficulty: read from preferences, applied to damage taken, enemy health and guardian health. */
const DIFF = { assist: { dmg: .5, enemyHp: .75, boss: .7 }, normal: { dmg: 1, enemyHp: 1, boss: 1 }, hard: { dmg: 1.35, enemyHp: 1.2, boss: 1.25 } };
G.diff = () => DIFF[(G.prefs && G.prefs.diff) || 'normal'] || DIFF.normal;
const held = {}, pressed = {}, src = { key: {}, pad: {}, touch: {} };
ACT.forEach(a => { held[a] = 0; pressed[a] = 0; });
function recompute(a) { const was = held[a]; held[a] = src.key[a] || src.pad[a] || src.touch[a] ? 1 : 0; if (held[a] && !was) pressed[a] = 1; }
G.input = { held, pressed, last: 'key' };
G.btn = a => held[a]; G.tap = a => pressed[a];
G.anyTap = () => pressed.ok || pressed.jump || pressed.attack;
addEventListener('keydown', e => {
  if (G.keys.capturing) { e.preventDefault(); const f = G.keys.capturing; G.keys.capturing = null; f(e.code); return; }
  const a = KEYMAP[e.code]; if (!a) return;
  e.preventDefault(); G.audio.init(); G.input.last = 'key';
  if (e.code === 'Escape') { src.key.back = 1; recompute('back'); }
  src.key[a] = 1; recompute(a);
});
addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (!a) return; src.key[a] = 0; recompute(a); if (e.code === 'Escape') { src.key.back = 0; recompute('back'); } });
addEventListener('blur', () => { ACT.forEach(a => { src.key[a] = 0; src.touch[a] = 0; recompute(a); }); });
G.touchSet = (a, v) => { if ((src.touch[a] || 0) === (v ? 1 : 0)) return; src.touch[a] = v ? 1 : 0; recompute(a); };
G.bindTouch = root => {
  root.querySelectorAll('[data-a]').forEach(b => {
    const acts = b.dataset.a.split(' ');
    const on = e => { e.preventDefault(); G.audio.init(); G.input.last = 'touch'; G.buzz && G.buzz(8); try { b.setPointerCapture(e.pointerId); } catch (_) { } acts.forEach(a => { src.touch[a] = 1; recompute(a); }); b.classList.add('on'); };
    const off = e => { e.preventDefault(); acts.forEach(a => { src.touch[a] = 0; recompute(a); }); b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, off));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
};
const PADMAP = { 0: 'jump', 2: 'attack', 3: 'light', 1: 'roll', 5: 'roll', 4: 'light', 7: 'heavy', 6: 'burst', 9: 'pause', 8: 'lore', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
G.pollPad = () => {
  let pads = []; try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { return; }
  const gp = [...pads].find(p => p && p.connected); const next = {};
  if (gp) {
    for (const k in PADMAP) if (gp.buttons[k] && gp.buttons[k].pressed) next[PADMAP[k]] = 1;
    if (gp.buttons[0] && gp.buttons[0].pressed) next.ok = 1;
    if (gp.buttons[1] && gp.buttons[1].pressed) next.back = 1;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (ax < -.4) next.left = 1; if (ax > .4) next.right = 1; if (ay < -.5) next.up = 1; if (ay > .5) next.down = 1;
    if (Object.keys(next).length) { G.input.last = 'pad'; G.audio && G.audio.init(); }
  }
  ACT.forEach(a => { const v = next[a] || 0; if (v !== (src.pad[a] || 0)) { src.pad[a] = v; recompute(a); } });
};
/* Game-clock timers: count update ticks, so pausing or a hidden tab holds them. */
const timers = [];
G.after = (frames, fn) => timers.push({ n: Math.max(1, Math.round(frames)), fn });
G.tickTimers = () => { for (let i = timers.length - 1; i >= 0; i--) if (--timers[i].n <= 0) { const f = timers.splice(i, 1)[0].fn; try { f(); } catch (e) { G.reportError && G.reportError(e); } } };
G.clearTimers = () => { timers.length = 0; };
G.endInputFrame = () => { ACT.forEach(a => pressed[a] = 0); };

})();
