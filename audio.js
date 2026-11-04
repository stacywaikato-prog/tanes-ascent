/* Tāne's Ascent — audio engine
   Bus layout:  voices → category bus → (sfx | amb) bus ─┐
                mood bus (crossfaded) → music bus → duck → pause LP ─┼→ master → limiter → out
                reverb (music send + room send) ─────────────────────┘
   The procedural score (MOODS + voice functions) is preserved note-for-note from the original build. */
(() => {
const G = window.G;
const A = G.audio = { ctx: null, muted: false, mood: 'none', amb: {}, cur: null, tracks: { area: null, boss: null }, playing: null, room: .1, voices: 0, last: {}, paused: false };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* ---------- user volume preferences (persisted) ---------- */
A.vol = { music: .5, sfx: .8, amb: .55 };
try { const v = JSON.parse(localStorage.getItem('tanes-ascent-audio') || 'null'); if (v) { Object.assign(A.vol, v.vol || {}); A.muted = v.v2 ? !!v.muted : false; } } catch (e) { }
A.savePrefs = () => { try { localStorage.setItem('tanes-ascent-audio', JSON.stringify({ vol: A.vol, muted: A.muted, v2: 1 })); } catch (e) { } };
A.setVol = (k, v) => { A.vol[k] = clamp(Math.round(v * 20) / 20, 0, 1); const n = { music: A.musicBus, sfx: A.sfxBus, amb: A.ambBus }[k]; if (n && A.ctx) n.gain.setTargetAtTime(A.vol[k], A.ctx.currentTime, .05); A.savePrefs(); };

/* Category trims under the user's sfx/amb volume. Targets from the mix brief:
   UI 60-75 · character 70-85 · boss 80-90 · environment 40-65 · important cues highest. */
/* Master gain: +4 dB over unity-ish, chosen from the worst-case render (boss score + ambience + 90 stacked hits peaked at −10.5 dBFS unlimited). */
const MASTER = 1.4;
const CAT = { ui: .68, player: .78, combat: .82, creature: .72, boss: .88, env: .55, cue: 1 };

/* Per-mood loudness trims, measured offline (16 s renders, RMS matched to the 'mid' mood). See audit. */
const TRIM = {story: 2.37, early: 2.34, mid: 1.0, late: 0.71, dark: 1.0, boss: 0.68, final: 0.72, victory: 0.79};
TRIM.none = 0;
Object.assign(TRIM, {h1: 2.1, h2: 2.02, h3: 0.96, h4: 0.9, h5: 0.75, h6: 0.81, h7: 2.44, h8: 0.65, h9: 1.0, h10: 0.93, h11: 0.5, h12: 0.62, h13: 0.73, boss2: 0.93, boss3: 0.73, boss4: 0.7}); // heaven and guardian themes, measured from 24 s renders
/* Per-heaven ambience trims, measured the same way (12 s renders, target ≈ −38 dBFS RMS so beds sit under the score). */
const AMB_TRIM = {0: 2.29, 1: 0.56, 2: 0.22, 3: 0.82, 4: 0.23, 5: 0.5, 6: 1.08, 7: 2.16, 8: 1.35, 9: 0.72, 10: 1.07, 11: 1.32, 12: 1.5, 13: 1.7};

/* ---------- graph ---------- */
A.build = (C, opts = {}) => {
  A.ctx = C; A.cur = null; A.mood = 'none';
  const G_ = v => { const g = C.createGain(); g.gain.value = v; return g; };
  A.limiter = C.createDynamicsCompressor();
  Object.assign(A.limiter, {}); A.limiter.threshold.value = -3; A.limiter.knee.value = 0; A.limiter.ratio.value = 20; A.limiter.attack.value = .002; A.limiter.release.value = .15;
  A.master = G_(A.muted ? 0 : MASTER);
  if (opts.noLimiter) A.master.connect(C.destination); else { A.master.connect(A.limiter); A.limiter.connect(C.destination); }
  // music path: bus → duck → pause low-pass → master
  A.musicBus = G_(A.vol.music); A.duckG = G_(1); A.pauseLP = C.createBiquadFilter(); A.pauseLP.type = 'lowpass'; A.pauseLP.frequency.value = 20000; A.pauseLP.Q.value = .5;
  A.musicBus.connect(A.duckG).connect(A.pauseLP).connect(A.master);
  A.sfxBus = G_(A.vol.sfx); A.sfxBus.connect(A.master);
  A.ambBus = G_(A.vol.amb); A.ambLP = C.createBiquadFilter(); A.ambLP.type = 'lowpass'; A.ambLP.frequency.value = 20000; A.ambBus.connect(A.ambLP).connect(A.master);
  // reverb
  const len = Math.floor(C.sampleRate * 2.4), ir = C.createBuffer(2, len, C.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  A.verb = C.createConvolver(); A.verb.buffer = ir; const vOut = G_(.45); A.verb.connect(vOut).connect(A.master);
  A.roomSend = G_(A.room); A.roomSend.connect(A.verb);
  A.cat = {};
  for (const k in CAT) { const g = G_(CAT[k]); g.connect(k === 'env' ? A.ambBus : A.sfxBus); if (k !== 'ui' && k !== 'env') g.connect(A.roomSend); A.cat[k] = g; }
  A.noise = C.createBuffer(1, C.sampleRate * 2, C.sampleRate); const nd = A.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  // continuous beds (one source each, gain-gated — never duplicated)
  const bed = (type, f, q, dest) => { const s = C.createBufferSource(); s.buffer = A.noise; s.loop = true; const fl = C.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const mod = G_(1), g = G_(0); s.connect(fl).connect(mod).connect(g).connect(dest); s.start(); return { g, fl, s, mod }; };
  const lfo = (rate, depth, param) => { const o = C.createOscillator(), g = G_(depth); o.frequency.value = rate; o.connect(g).connect(param); o.start(); return o; };
  A.beds = {
    wind: bed('bandpass', 420, .6, A.cat.env), rain: bed('highpass', 2500, .3, A.cat.env), water: bed('lowpass', 900, .5, A.cat.env), hum: bed('lowpass', 160, 1, A.cat.env),
    leaves: bed('highpass', 3200, .4, A.cat.env), purerehua: bed('bandpass', 260, 7, A.cat.env)
  };
  lfo(.13, 180, A.beds.wind.fl.frequency); lfo(.31, .45, A.beds.leaves.mod.gain);  // LFOs modulate a unity stage *before* the level gain, so a silent bed stays silent
  lfo(.55, 140, A.beds.purerehua.fl.frequency); lfo(.27, .6, A.beds.purerehua.mod.gain);
  // drone: two detuned low sines (corruption)
  { const g = G_(0), f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; [55, 55.6, 82.4].forEach(fr => { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); }); f.connect(g).connect(A.cat.env); A.beds.drone = { g }; }
  // player air-rush and mosquito whine are driven per frame by gameplay
  A.rush = bed('bandpass', 900, .7, A.cat.player);
  { const g = G_(0), o = C.createOscillator(), f = C.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = 560; lfo(23, 30, o.frequency); lfo(.7, 40, o.frequency); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 2; o.connect(f).connect(g).connect(A.cat.creature); o.start(); A.whine = { g }; }
  A.next = C.currentTime + .1; A.step = 0;
};
/* Phones only let sound start from a finished tap (touchend / pointerup / click), and iPhones mute
   Web Audio while the ring/silent switch is on. So: ask for a "playback" audio session where the browser
   supports it, keep a silent looping <audio> element playing (which also lifts the silent-switch mute on
   iOS), and play a one-sample buffer on each unlock attempt. */
const SILENT_WAV = 'data:audio/wav;base64,UklGRvQHAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdAHAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
A.unlock = () => {
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { }
  if (A.ctx) { try { const b = A.ctx.createBuffer(1, 1, 22050), s = A.ctx.createBufferSource(); s.buffer = b; s.connect(A.ctx.destination); s.start(0); } catch (e) { } }
  if (A.muted) return;
  try { if (!A.silentEl) { const el = A.silentEl = document.createElement('audio'); el.src = SILENT_WAV; el.loop = true; el.setAttribute('playsinline', ''); el.preload = 'auto'; }
    if (A.silentEl.paused) { const p = A.silentEl.play(); p && p.catch && p.catch(() => { }); } } catch (e) { }
};
A.init = () => {
  if (A.ctx) { if (A.ctx.state !== 'running' && !document.hidden) { try { A.ctx.resume(); } catch (e) { } A.unlock(); } return; }
  try {
    A.build(new (window.AudioContext || window.webkitAudioContext)()); A.unlock();
    A.timer = setInterval(() => { if (A.ctx && A.ctx.state === 'running') A.schedule(A.ctx.currentTime + .15); }, 25);
    if (A.pendingMood) A.setMood(A.pendingMood);
    if (A.pendingAmb) A.setAmb(A.pendingAmb);
    if (A.pendingTrim != null) A.cat.env.gain.value = CAT.env * (AMB_TRIM[A.pendingTrim] || 1);
  } catch (e) { A.ctx = null; }
};
A.toggleMute = () => { A.muted = !A.muted; if (A.master) A.master.gain.setTargetAtTime(A.muted ? 0 : MASTER, A.ctx.currentTime, .03); A.savePrefs(); try { if (A.muted && A.silentEl) A.silentEl.pause(); else A.unlock(); } catch (e) { } G.toast && G.toast(A.muted ? 'Sound off' : 'Sound on'); };
A.suspend = on => { if (!A.ctx) return; try { on ? A.ctx.suspend() : A.ctx.resume(); } catch (e) { } };

/* ---------- mix helpers ---------- */
const now = () => A.ctx.currentTime;
A.duck = (amount = .5, hold = .6, rel = .8) => { if (!A.ctx) return; const g = A.duckG.gain, t = now(); g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(amount, t + .06); g.setValueAtTime(amount, t + .06 + hold); g.linearRampToValueAtTime(1, t + .06 + hold + rel); };
A.setPaused = on => { if (!A.ctx || A.paused === on) return; A.paused = on; const t = now(); A.pauseLP.frequency.setTargetAtTime(on ? 700 : 20000, t, .12); A.ambLP.frequency.setTargetAtTime(on ? 600 : 20000, t, .12); A.rush.g.gain.setTargetAtTime(0, t, .05); A.whine.g.gain.setTargetAtTime(0, t, .05); };
A.setRoom = v => { if (!A.ctx || Math.abs(v - A.room) < .02) return; A.room = v; A.roomSend.gain.setTargetAtTime(v, now(), .4); };
A.setRush = v => { if (A.ctx && !A.paused) A.rush.g.gain.setTargetAtTime(clamp(v, 0, 1) * .16, now(), .08); };
A.setWhine = v => { if (A.ctx && !A.paused) A.whine.g.gain.setTargetAtTime(clamp(v, 0, 1) * .035, now(), .15); };

/* ---------- primitives ---------- */
function env(g, t, a, peak, d) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, .0002), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
function osc(type, f, t, dur, dest, peak = .1, a = .005, detune = 0) { const C = A.ctx, o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune; env(g, t, a, peak, dur); o.connect(g).connect(dest); o.start(t); o.stop(t + a + dur + .05); return o; }
function noiseHit(t, dur, type, f, peak, dest, q = 1) { const C = A.ctx, s = C.createBufferSource(); s.buffer = A.noise; const fl = C.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = C.createGain(); env(g, t, .002, peak, dur); s.connect(fl).connect(g).connect(dest); s.start(t, Math.random()); s.stop(t + dur + .05); return fl; }
const sweep = (D, t, f0, f1, dur, type = 'square', pk = .08, a = .005) => { const o = osc(type, f0, t, dur, D, pk, a); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + a + dur); return o; };
/* taonga pūoro-inspired voices (synthesised approximations, used as texture — never as "tribal" percussion) */
const breath = (D, t, f, dur, pk, bend = 1.02) => { const o = osc('sine', f, t, dur, D, pk, .09); o.frequency.exponentialRampToValueAtTime(f * bend, t + .12); o.frequency.setValueAtTime(f * bend, t + .12); noiseHit(t, dur * .9, 'bandpass', f * 1.5, pk * .45, D, 2.5); return o; };
const koauau = (D, t, base, pk = .05) => { const ratios = [1, 1.125, 1.26, .89]; let tt = t; for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) { const d = .35 + Math.random() * .5; breath(D, tt, base * ratios[Math.floor(Math.random() * ratios.length)], d, pk); tt += d * .85; } };
const pahu = (D, t, f = 170, pk = .25) => { osc('sine', f, t, .7, D, pk, .002); osc('sine', f * 2.31, t, .25, D, pk * .3, .002); noiseHit(t, .05, 'bandpass', 900, pk * .6, D, 3); };
const pukaea = (D, t, f = 98, dur = 1.6, pk = .07) => { const C = A.ctx, fl = C.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(400, t); fl.frequency.linearRampToValueAtTime(1300, t + dur * .5); fl.frequency.linearRampToValueAtTime(500, t + dur); fl.connect(D); const o = osc('sawtooth', f, t, dur, fl, pk, .25); o.frequency.linearRampToValueAtTime(f * 1.06, t + dur * .6); noiseHit(t, dur, 'bandpass', 600, pk * .3, D, 1.5); };
const woodTap = (D, t, f = 900, pk = .1) => { osc('sine', f, t, .05, D, pk, .001); noiseHit(t, .02, 'bandpass', f * 2, pk * .6, D, 6); };
const bell = (D, t, f, pk = .05, dur = 1.4) => { osc('sine', f, t, dur, D, pk, .003); osc('sine', f * 2.76, t, dur * .4, D, pk * .3, .003); };

/* ---------- SFX library: name → [category, min gap (s), duration (s), player fn(D, t, v, o)] ---------- */
const SURF = { grass: [1100, 'lowpass', .07, 3200], soft: [500, 'lowpass', .04, 0], stone: [1800, 'bandpass', .06, 0], wood: [700, 'bandpass', .07, 0], crystal: [2600, 'bandpass', .04, 4200], thorn: [1400, 'highpass', .06, 2600] };
const LIB = {
  /* movement */
  step: ['player', .06, .1, (D, t, v, o) => { const s = SURF[o.surf] || SURF.grass; noiseHit(t, .045, s[1], s[0] * (.9 + Math.random() * .2), s[2] * v, D, 1.2); if (s[3]) noiseHit(t + .01, .03, 'highpass', s[3], s[2] * .5 * v, D); if (o.surf === 'stone' || o.surf === 'wood') osc('sine', o.surf === 'wood' ? 180 : 240, t, .04, D, .03 * v, .001); if (o.surf === 'crystal') osc('sine', 3200 + Math.random() * 800, t, .12, D, .015 * v); }],
  jump: ['player', .05, .15, (D, t, v) => { sweep(D, t, 260, 520, .1, 'triangle', .07 * v); noiseHit(t, .08, 'bandpass', 1400, .05 * v, D, 1); }],
  walljump: ['player', .05, .2, (D, t, v) => { sweep(D, t, 300, 640, .1, 'triangle', .07 * v); noiseHit(t, .06, 'bandpass', 1800, .09 * v, D, 2); }],
  djump: ['player', .05, .3, (D, t, v) => { sweep(D, t, 420, 900, .16, 'triangle', .08 * v); noiseHit(t, .2, 'highpass', 3000, .04 * v, D); bell(D, t + .02, 1568, .02 * v, .4); }],
  land: ['player', .06, .15, (D, t, v, o) => { const s = SURF[o.surf] || SURF.grass; noiseHit(t, .07 + v * .06, 'lowpass', 300 + s[0] * .3, .1 + v * .14, D); osc('sine', 90, t, .08, D, .08 * v, .002); }],
  roll: ['player', .1, .3, (D, t, v) => { noiseHit(t, .22, 'bandpass', 800, .09 * v, D, 1); noiseHit(t + .12, .08, 'lowpass', 500, .07 * v, D); }],
  slide: ['player', .15, .45, (D, t, v) => { const f = noiseHit(t, .4, 'bandpass', 1600, .07 * v, D, 1.5); f.frequency.exponentialRampToValueAtTime(600, t + .4); }],
  dash: ['player', .1, .25, (D, t, v) => { noiseHit(t, .2, 'bandpass', 2600, .12 * v, D, 1); sweep(D, t, 300, 1200, .15, 'sine', .05 * v); }],
  wallhit: ['player', .12, .1, (D, t, v) => { noiseHit(t, .05, 'lowpass', 900, .1 * v, D); osc('sine', 150, t, .05, D, .05 * v, .001); }],
  scrape: ['player', .1, .12, (D, t, v) => { noiseHit(t, .1, 'bandpass', 2200 + Math.random() * 600, .025 * v, D, 2); }],
  grab: ['player', .1, .1, (D, t, v) => { noiseHit(t, .04, 'bandpass', 1200, .1 * v, D, 2); osc('sine', 260, t, .04, D, .04 * v, .001); }],
  climb: ['player', .12, .15, (D, t, v) => { noiseHit(t, .1, 'highpass', 2600 + Math.random() * 1200, .035 * v, D, .8); }],
  climbup: ['player', .2, .25, (D, t, v) => { noiseHit(t, .06, 'bandpass', 900, .08 * v, D); noiseHit(t + .12, .06, 'lowpass', 700, .1 * v, D); }],
  drop: ['player', .2, .12, (D, t, v) => { noiseHit(t, .08, 'bandpass', 700, .06 * v, D, 2); }],
  spawn: ['cue', .5, 1.2, (D, t, v) => { for (let i = 0; i < 6; i++) bell(D, t + i * .07, 523 * Math.pow(1.122, i), .025 * v, .8); breath(D, t, 392, .9, .03 * v, 1.05); }],
  pdeath: ['cue', .8, 2, (D, t, v) => { sweep(D, t, 330, 55, 1.4, 'sawtooth', .08 * v, .01); noiseHit(t, 1.2, 'lowpass', 500, .18 * v, D); breath(D, t + .2, 196, 1.4, .05 * v, .9); }],
  hurt: ['player', .12, .3, (D, t, v) => { sweep(D, t, 220, 70, .25, 'sawtooth', .09 * v); noiseHit(t, .1, 'lowpass', 1600, .14 * v, D); }],
  heal: ['cue', .2, .5, (D, t, v) => [0, 5, 9, 12].forEach((s, i) => osc('sine', mtof(72 + s), t + i * .06, .3, D, .05 * v)) ],
  heart: ['cue', .4, .4, (D, t, v) => { osc('sine', 62, t, .12, D, .22 * v, .004); osc('sine', 58, t + .2, .14, D, .16 * v, .004); }],
  shield: ['combat', .2, .5, (D, t, v) => { noiseHit(t, .3, 'highpass', 4000, .06 * v, D, .5); bell(D, t, 880, .05 * v, .5); osc('sine', 220, t, .15, D, .08 * v, .002); }],
  /* combat */
  swing: ['combat', .04, .14, (D, t, v, o) => { const p = o.p || 1; const f = noiseHit(t, .12, 'bandpass', 1500 * p, .13 * v, D, 2); f.frequency.exponentialRampToValueAtTime(3200 * p, t + .1); }],
  airswing: ['combat', .05, .2, (D, t, v) => { const f = noiseHit(t, .18, 'bandpass', 1200, .13 * v, D, 1.6); f.frequency.exponentialRampToValueAtTime(2600, t + .16); }],
  heavywind: ['combat', .2, .3, (D, t, v) => { const f = noiseHit(t, .28, 'bandpass', 500, .07 * v, D, 2); f.frequency.exponentialRampToValueAtTime(1400, t + .28); }],
  heavy: ['combat', .1, .35, (D, t, v) => { noiseHit(t, .22, 'bandpass', 700, .16 * v, D, 1.5); sweep(D, t, 160, 60, .2, 'sawtooth', .06 * v); }],
  hit: ['combat', .03, .15, (D, t, v) => { sweep(D, t, 320, 90, .1, 'square', .07 * v); noiseHit(t, .07, 'lowpass', 2500, .14 * v, D); }],
  stonehit: ['combat', .03, .15, (D, t, v) => { noiseHit(t, .06, 'bandpass', 2200, .12 * v, D, 3); osc('sine', 400, t, .06, D, .06 * v, .001); }],
  crit: ['combat', .05, .5, (D, t, v) => { sweep(D, t, 500, 120, .12, 'square', .08 * v); noiseHit(t, .1, 'lowpass', 3500, .16 * v, D); bell(D, t + .01, 1760, .05 * v, .45); osc('sine', 70, t, .2, D, .14 * v, .002); }],
  kill: ['combat', .05, .35, (D, t, v) => { sweep(D, t, 500, 60, .3, 'square', .06 * v); noiseHit(t, .25, 'lowpass', 900, .13 * v, D); }],
  finisher: ['combat', .1, .6, (D, t, v) => { osc('sine', 55, t, .35, D, .2 * v, .002); noiseHit(t, .35, 'lowpass', 1400, .16 * v, D); bell(D, t + .04, 1318, .04 * v, .6); }],
  blocked: ['combat', .05, .15, (D, t, v) => { osc('square', 1400, t, .1, D, .04 * v); noiseHit(t, .05, 'highpass', 5000, .06 * v, D); osc('sine', 300, t, .06, D, .05 * v, .001); }],
  parry: ['combat', .08, .6, (D, t, v) => { bell(D, t, 2093, .07 * v, .5); bell(D, t + .015, 3136, .04 * v, .35); noiseHit(t, .06, 'highpass', 6000, .1 * v, D); }],
  guardbreak: ['combat', .1, .5, (D, t, v) => { noiseHit(t, .3, 'lowpass', 1200, .2 * v, D); osc('sine', 80, t, .3, D, .14 * v, .002); noiseHit(t, .12, 'highpass', 4000, .08 * v, D); }],
  shot: ['combat', .04, .2, (D, t, v) => { sweep(D, t, 1200, 500, .14, 'sine', .09 * v); osc('triangle', 1800, t, .1, A.roomSend, .03 * v); }],
  charge: ['combat', .3, .5, (D, t, v) => { sweep(D, t, 200, 800, .5, 'sine', .045 * v); }],
  charged: ['cue', .3, .4, (D, t, v) => { bell(D, t, 1046, .05 * v, .35); bell(D, t + .06, 1568, .04 * v, .35); }],
  cshot: ['combat', .1, .5, (D, t, v) => { sweep(D, t, 600, 150, .4, 'sawtooth', .06 * v); osc('sine', 1600, t, .4, A.roomSend, .05 * v); osc('sine', 60, t, .2, D, .1 * v, .002); }],
  spear: ['combat', .1, .7, (D, t, v) => { sweep(D, t, 900, 200, .5, 'sawtooth', .06 * v); bell(D, t, 1318, .05 * v, .6); bell(D, t + .05, 1976, .04 * v, .5); osc('sine', 60, t, .25, D, .12 * v, .002); }],
  burst: ['combat', .3, .8, (D, t, v) => { noiseHit(t, .6, 'lowpass', 1200, .22 * v, D); sweep(D, t, 800, 60, .6, 'sine', .12 * v); breath(D, t, 330, .7, .04 * v, 1.1); }],
  fizzle: ['combat', .08, .1, (D, t, v) => noiseHit(t, .06, 'highpass', 3000, .03 * v, D)],
  /* creatures */
  hiss: ['creature', .2, .35, (D, t, v) => { const f = noiseHit(t, .3, 'highpass', 3500, .07 * v, D, .8); f.frequency.linearRampToValueAtTime(5000, t + .3); }],
  chirp: ['creature', .15, .2, (D, t, v) => { for (let i = 0; i < 5; i++) noiseHit(t + i * .025, .012, 'bandpass', 4200, .06 * v, D, 8); }],
  screech: ['creature', .25, .45, (D, t, v) => { const o = sweep(D, t, 1900, 1100, .35, 'sawtooth', .03 * v); noiseHit(t, .3, 'bandpass', 2600, .05 * v, D, 4); }],
  growl: ['creature', .25, .5, (D, t, v) => { const o = osc('sawtooth', 70, t, .45, D, .06 * v, .04); o.frequency.linearRampToValueAtTime(52, t + .45); noiseHit(t, .4, 'lowpass', 400, .1 * v, D); }],
  skitter: ['creature', .2, .35, (D, t, v) => { for (let i = 0; i < 8; i++) noiseHit(t + i * .035, .012, 'highpass', 5000, .045 * v, D); }],
  whisper: ['creature', .25, 1.2, (D, t, v) => { noiseHit(t, 1.0, 'bandpass', 1400, .06 * v, A.roomSend, 6); noiseHit(t, .8, 'bandpass', 1900, .03 * v, D, 8); }],
  shadowslash: ['creature', .08, .25, (D, t, v) => { const f = noiseHit(t, .2, 'bandpass', 900, .11 * v, D, 2); f.frequency.exponentialRampToValueAtTime(2200, t + .18); osc('sine', 110, t, .15, D, .04 * v); }],
  guardswing: ['creature', .15, .4, (D, t, v) => { noiseHit(t, .3, 'bandpass', 500, .12 * v, D, 1.2); osc('sine', 90, t + .1, .2, D, .08 * v, .002); }],
  edie: ['creature', .05, .5, (D, t, v, o) => { const f = o.p || 1; sweep(D, t, 700 * f, 200 * f, .3, 'triangle', .04 * v); noiseHit(t, .2, 'bandpass', 1800 * f, .04 * v, D, 3); }],
  spit: ['creature', .1, .25, (D, t, v) => { noiseHit(t, .15, 'bandpass', 1200, .1 * v, D, 2); osc('sine', 300, t, .08, D, .04 * v); }],
  portal: ['creature', .3, .4, (D, t, v) => { sweep(D, t, 120, 400, .3, 'sine', .04 * v); noiseHit(t, .3, 'bandpass', 700, .04 * v, D, 5); }],
  /* boss */
  roar: ['boss', .4, 1.3, (D, t, v) => { sweep(D, t, 90, 40, 1.2, 'sawtooth', .14 * v); noiseHit(t, 1.2, 'lowpass', 500, .18 * v, D); }],
  bosshit: ['boss', .04, .2, (D, t, v) => { sweep(D, t, 220, 60, .14, 'square', .07 * v); noiseHit(t, .1, 'lowpass', 1800, .16 * v, D); osc('sine', 55, t, .12, D, .12 * v, .002); }],
  slam: ['boss', .2, .7, (D, t, v) => { sweep(D, t, 80, 30, .6, 'sine', .3 * v); noiseHit(t, .5, 'lowpass', 300, .3 * v, D); }],
  tail: ['boss', .2, .4, (D, t, v) => { noiseHit(t, .3, 'bandpass', 400, .16 * v, D, 1); osc('sine', 70, t + .15, .2, D, .14 * v, .002); }],
  sweep: ['boss', .3, .6, (D, t, v) => { const f = noiseHit(t, .5, 'bandpass', 300, .2 * v, D, 1); f.frequency.exponentialRampToValueAtTime(900, t + .5); }],
  beam: ['boss', .3, 1, (D, t, v) => { sweep(D, t, 400, 420, .9, 'sawtooth', .045 * v); osc('sine', 1600, t, .9, A.roomSend, .03 * v); }],
  pillar: ['boss', .15, .5, (D, t, v) => { noiseHit(t, .4, 'lowpass', 600, .18 * v, D); sweep(D, t, 60, 140, .3, 'sawtooth', .05 * v); }],
  moonvolley: ['boss', .2, .5, (D, t, v) => { for (let i = 0; i < 4; i++) bell(D, t + i * .03, 1760 + i * 220, .02 * v, .3); }],
  warn: ['cue', .15, .3, (D, t, v) => { osc('square', 880, t, .07, D, .035 * v); osc('square', 880, t + .14, .07, D, .035 * v); }],
  phase: ['boss', 1, 2, (D, t, v) => { pukaea(D, t, 98, 1.7, .09 * v); pahu(D, t, 140, .2 * v); }],
  stun: ['boss', .5, .9, (D, t, v) => { for (let i = 0; i < 5; i++) bell(D, t + i * .1, [1568, 1760, 1976, 1760, 1568][i], .03 * v, .25); osc('sine', 60, t, .3, D, .15 * v, .002); }],
  shatter: ['boss', .1, .6, (D, t, v) => { for (let i = 0; i < 6; i++) bell(D, t + i * .02, 2400 + Math.random() * 2000, .025 * v, .3); noiseHit(t, .2, 'highpass', 5000, .1 * v, D); }],
  coreopen: ['boss', .5, 1, (D, t, v) => { sweep(D, t, 200, 600, .8, 'sine', .07 * v); bell(D, t + .3, 1046, .04 * v, .7); }],
  bossdie: ['boss', 2, 3, (D, t, v) => { sweep(D, t, 120, 30, 2.5, 'sawtooth', .14 * v, .02); noiseHit(t, 2.6, 'lowpass', 700, .25 * v, D); pukaea(D, t + .6, 73, 2, .07 * v); }],
  barrier: ['boss', .5, .8, (D, t, v) => { sweep(D, t, 110, 330, .6, 'sawtooth', .05 * v); bell(D, t + .2, 659, .05 * v, .6); }],
  lightmote: ['cue', .1, .7, (D, t, v, o) => { const k = o.p || 1; bell(D, t, 659 * k, .06 * v, .6); bell(D, t + .05, 988 * k, .04 * v, .6); }],
  power: ['cue', 1, 1.5, (D, t, v) => { for (let i = 0; i < 10; i++) osc('sine', mtof(60 + i * 3), t + i * .05, .6, A.roomSend, .05 * v); noiseHit(t, 1, 'highpass', 4000, .05 * v, D); breath(D, t, 294, 1.2, .05 * v, 1.06); }],
  /* pickups & world */
  mana: ['cue', .04, .3, (D, t, v) => { osc('sine', mtof(88), t, .2, D, .045 * v); osc('sine', mtof(93), t + .06, .25, D, .04 * v); }],
  feather: ['cue', .3, 1.2, (D, t, v) => { koauau(D, t, 784, .05 * v); }],
  relic: ['cue', .3, 1, (D, t, v) => [0, 7, 12, 19].forEach((s, i) => osc('triangle', mtof(67 + s), t + i * .09, .5, D, .06 * v)) ],
  carving: ['cue', .5, 1.6, (D, t, v) => { pahu(D, t, 180, .2 * v); woodTap(D, t + .18, 700, .07 * v); koauau(D, t + .35, 523, .045 * v); }],
  check: ['cue', .5, 1.4, (D, t, v) => { pahu(D, t, 150, .22 * v); [0, 7, 12].forEach((s, i) => osc('sine', mtof(74 + s), t + .1 + i * .12, .8, A.roomSend, .06 * v)); }],
  gate: ['cue', .5, 1.6, (D, t, v) => { [0, 5, 7, 12].forEach((s, i) => osc('triangle', mtof(62 + s), t + i * .15, 1, A.roomSend, .07 * v)); pukaea(D, t, 147, 1.2, .04 * v); }],
  gateopen: ['cue', .5, 1.2, (D, t, v) => { noiseHit(t, .8, 'lowpass', 400, .14 * v, D); [0, 7, 12].forEach((s, i) => bell(D, t + .2 + i * .1, mtof(67 + s), .05 * v, .8)); }],
  thorn: ['player', .2, .2, (D, t, v) => { noiseHit(t, .12, 'highpass', 3000, .1 * v, D); osc('sine', 200, t, .08, D, .05 * v, .001); }],
  fall: ['player', .5, .7, (D, t, v) => { const f = noiseHit(t, .6, 'bandpass', 1400, .1 * v, D, 1); f.frequency.exponentialRampToValueAtTime(300, t + .6); }],
  treasure: ['cue', 1, 1.6, (D, t, v) => [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => { osc('triangle', mtof(64 + s), t + i * .08, .9, A.roomSend, .07 * v); osc('sine', mtof(52 + s), t + i * .08, 1.2, D, .04 * v); })],
  thunder: ['env', .5, 2.5, (D, t, v) => { noiseHit(t, 2.4, 'lowpass', 260, .5 * v, D); noiseHit(t, .4, 'lowpass', 1800, .25 * v, D); }],
  /* UI */
  select: ['ui', .03, .08, (D, t, v) => woodTap(D, t, 1200, .07 * v)],
  confirm: ['ui', .05, .2, (D, t, v) => { woodTap(D, t, 900, .08 * v); osc('triangle', 1320, t + .05, .12, D, .05 * v); }],
  back: ['ui', .05, .12, (D, t, v) => { woodTap(D, t, 700, .07 * v); osc('triangle', 660, t + .04, .08, D, .035 * v); }],
  error: ['ui', .15, .25, (D, t, v) => { osc('square', 196, t, .08, D, .04 * v); osc('square', 165, t + .1, .1, D, .04 * v); }],
  open: ['ui', .1, .3, (D, t, v) => { const f = noiseHit(t, .18, 'bandpass', 900, .05 * v, D, 1.5); f.frequency.exponentialRampToValueAtTime(2000, t + .18); woodTap(D, t + .12, 1100, .05 * v); }],
  close: ['ui', .1, .3, (D, t, v) => { const f = noiseHit(t, .16, 'bandpass', 2000, .05 * v, D, 1.5); f.frequency.exponentialRampToValueAtTime(800, t + .16); woodTap(D, t + .1, 800, .05 * v); }],
  popup: ['ui', .3, .6, (D, t, v) => { bell(D, t, 784, .04 * v, .5); bell(D, t + .08, 1175, .03 * v, .5); }],
  tick: ['ui', .03, .03, (D, t, v) => osc('sine', 2400, t, .012, D, .012 * v, .001)],
  slider: ['ui', .03, .08, (D, t, v, o) => osc('triangle', 500 + (o.p || 0) * 800, t, .05, D, .05 * v)]
};
A.LIB = LIB;
/* Per-sound corrections after measuring every effect offline: lift telegraphs and creature alerts that were buried (−40 dB and below), so danger is always heard. */
const FIX = { drop: 2.5, heavywind: 2, chirp: 3, whisper: 2, screech: 1.8, warn: 2.5, gate: 1.6, error: 1.6, beam: 1.6, moonvolley: 1.6, sweep: 1.5, portal: 1.4, scrape: 1.4 };
A.FIX = FIX;
const TYPE_DIE = { horror: [.45, 'growl'], beast: [.55, 'growl'], liz: [.9, 'hiss'], weta: [1.4, 'chirp'], bird: [1.3, 'screech'], mos: [2, null], spirit: [.7, 'whisper'], spider: [1.5, 'skitter'], stalk: [.6, 'growl'], guard: [.5, null], warrior: [.6, null] };
A.creatureDeath = (type, x) => { const d = TYPE_DIE[type] || [1, null]; A.sfx('edie', 1, { x, p: d[0] }); };

A.sfx = (name, v = 1, o = {}) => {
  if (!A.ctx || A.muted || A.ctx.state !== 'running') return;
  const def = LIB[name]; if (!def) return;
  const [cat, gap, dur, fn] = def, t = now();
  if (A.last[name] && t - A.last[name] < gap) return;            // de-duplicate rapid repeats
  if (A.voices > 28 && cat !== 'cue' && cat !== 'boss') return;  // voice cap keeps the mix clean
  A.last[name] = t;
  let D = A.cat[cat], vol = v * (FIX[name] || 1);
  if (o.x != null && G.cam) {                                     // stereo position + distance for world sounds
    const dx = o.x - (G.cam.x + G.VW / 2); vol *= clamp(1 - (Math.abs(dx) - 200) / 260, .12, 1);
    if (A.ctx.createStereoPanner) { const p = A.ctx.createStereoPanner(); p.pan.value = clamp(dx / 240, -.75, .75); p.connect(D); D = p; setTimeout(() => p.disconnect(), (dur + .6) * 1000); }
  }
  A.voices++; setTimeout(() => A.voices--, (dur + .1) * 1000);
  try { fn(D, t + .005, vol, o); } catch (e) { }
};

/* ---------- ambience: per-heaven soundscapes ---------- */
const BIOME_AMB = {
  0: { wind: .2 },
  1: { water: .5, crickets: 1, ruru: .5, wind: .15, leaves: .25, drips: .25, koauau: .12 },
  2: { birds: 1, leaves: .8, wind: .3, koauau: .1 },
  3: { wind: .9, kahu: .35 },
  4: { rain: 1, wind: .8 },
  5: { birds: .45, water: .35, purerehua: .35, koauau: .4, leaves: .3, hum: .15 },
  6: { water: .5, drips: .45, hum: .35, koauau: .3, wind: .1 },
  7: { hum: .55, chimes: .55, wind: .1 },
  8: { wind: .5, chimes: .35, hum: .3, crackle: .2 },
  9: { drone: .6, whispers: .6, wind: .3 },
  10: { wind: .7, debris: .5, hum: .1 },
  11: { wind: .5, crackle: .8, rumble: .45 },
  12: { wind: .35, purerehua: .45, kahu: .3, hum: .2, koauau: .25 },
  13: { hum: .4, purerehua: .55, chimes: .25, koauau: .3, wind: .15 }
};
A.ROOM = { 6: .3, 7: .25, 12: .2, 13: .3 };
A.setBiome = n => { A.biome = n; if (A.ctx) A.cat.env.gain.setTargetAtTime(CAT.env * (AMB_TRIM[n] || 1), now(), .8); else A.pendingTrim = n; A.setAmb(BIOME_AMB[n] || BIOME_AMB[0]); A.baseRoom = A.ROOM[n] || .1; A.setRoom(A.baseRoom); };
A.setAmb = o => { A.amb = o; if (!A.ctx) { A.pendingAmb = o; return; } const t = now(); for (const k in A.beds) A.beds[k].g.gain.setTargetAtTime((o[k] || 0) * (k === 'drone' ? .12 : k === 'purerehua' ? .9 : .5), t, 1.2); };
function ambientEvents(t, s) {
  const am = A.amb, E = A.cat.env, r = Math.random;
  if (am.birds && r() < .02 * am.birds) { if (r() < .5) { const f = 2400 + r() * 1600; for (let i = 0; i < 3; i++) { const o = osc('sine', f, t + i * .09, .06, E, .03); o.frequency.exponentialRampToValueAtTime(f * 1.3, t + i * .09 + .05); } } else { bell(E, t, 1900 + r() * 900, .02, .6); for (let i = 0; i < 3; i++) noiseHit(t + .25 + i * .03, .01, 'bandpass', 3800, .03, E, 10); } }
  if (am.crickets && s % 8 === 0 && r() < .5) for (let i = 0; i < 4; i++) osc('sine', 4300, t + i * .04, .02, E, .012);
  if (am.ruru && r() < .004 * am.ruru) { breath(E, t, 520, .28, .04, .97); breath(E, t + .38, 440, .4, .04, .95); }
  if (am.koauau && r() < .0035 * am.koauau) koauau(A.roomSend, t, [440, 523, 392][Math.floor(r() * 3)], .05);
  if (am.kahu && r() < .004 * am.kahu) { const o = osc('sine', 2600, t, .9, E, .025, .05); o.frequency.exponentialRampToValueAtTime(1500, t + .9); }
  if (am.chimes && r() < .02 * am.chimes) bell(A.roomSend, t, 1046 * Math.pow(1.122, Math.floor(r() * 8)), .02, 1.8);
  if (am.drips && r() < .01 * am.drips) { const o = osc('sine', 1800 + r() * 900, t, .08, A.roomSend, .03, .001); o.frequency.exponentialRampToValueAtTime(700, t + .08); }
  if (am.crackle && r() < .12 * am.crackle) noiseHit(t + r() * .1, .008, 'highpass', 3000, .03 + r() * .03, E);
  if (am.debris && r() < .008 * am.debris) for (let i = 0; i < 4; i++) noiseHit(t + i * .08 + r() * .05, .05, 'bandpass', 700 + r() * 600, .05, E, 3);
  if (am.whispers && r() < .006 * am.whispers) noiseHit(t, 1.6, 'bandpass', 1100 + r() * 800, .05, A.roomSend, 9);
  if (am.rumble && r() < .006 * am.rumble) noiseHit(t, 2, 'lowpass', 140, .25, E);
}

/* ---------- MUSIC: procedural score (preserved) ---------- */
const MOODS = {
  story: { bpm: 58, root: 50, sc: [0, 3, 5, 7, 10], layers: ['pad', 'flute'] },
  early: { bpm: 72, root: 50, sc: [0, 3, 5, 7, 10], layers: ['pad', 'pluck', 'flute'] },
  mid: { bpm: 96, root: 52, sc: [0, 2, 3, 7, 10], layers: ['pad', 'pluck', 'flute', 'drum'] },
  late: { bpm: 84, root: 48, sc: [0, 3, 5, 7, 10], layers: ['choir', 'pluck', 'drum', 'bass'] },
  dark: { bpm: 76, root: 45, sc: [0, 1, 5, 7, 8], layers: ['pad', 'drum', 'bass', 'whisper'] },
  boss: { bpm: 132, root: 45, sc: [0, 3, 5, 6, 7, 10], layers: ['drum', 'bass', 'choir', 'hat', 'stab'] },
  final: { bpm: 120, root: 43, sc: [0, 3, 5, 7, 8, 10], layers: ['drum', 'bass', 'choir', 'hat', 'stab', 'flute'] },
  victory: { bpm: 70, root: 55, sc: [0, 2, 4, 7, 9], layers: ['choir', 'flute', 'pluck'] },
  none: { bpm: 60, root: 50, sc: [0], layers: [] },
  /* One theme per heaven. Each carries Tāne's leitmotif ('theme'), re-voiced into that heaven's own scale,
     so the melody evolves from night-forest stillness to the golden summit. */
  h1: { bpm: 66, root: 50, sc: [0, 3, 5, 7, 10], layers: ['pad', 'pluck', 'flute', 'theme'], ti: 'flute' },
  h2: { bpm: 80, root: 52, sc: [0, 2, 3, 7, 10], layers: ['pad', 'pluck', 'flute', 'theme'], ti: 'flute' },
  h3: { bpm: 92, root: 55, sc: [0, 2, 4, 7, 9], layers: ['pad', 'pluck', 'flute', 'drum', 'theme'], ti: 'flute' },
  h4: { bpm: 104, root: 45, sc: [0, 1, 5, 7, 8], layers: ['pad', 'drum', 'bass', 'theme'], ti: 'choir' },
  h5: { bpm: 84, root: 53, sc: [0, 2, 4, 7, 9], layers: ['choir', 'pluck', 'flute', 'theme'], ti: 'flute' },
  h6: { bpm: 70, root: 49, sc: [0, 3, 5, 7, 10], layers: ['pad', 'choir', 'flute', 'theme'], ti: 'flute' },
  h7: { bpm: 76, root: 54, sc: [0, 2, 5, 7, 9], layers: ['pad', 'pluck', 'theme'], ti: 'pluck' },
  h8: { bpm: 88, root: 51, sc: [0, 2, 3, 7, 8], layers: ['choir', 'pluck', 'drum', 'theme'], ti: 'flute' },
  h9: { bpm: 72, root: 45, sc: [0, 1, 5, 6, 8], layers: ['pad', 'drum', 'bass', 'whisper', 'theme'], ti: 'choir' },
  h10: { bpm: 96, root: 47, sc: [0, 3, 5, 7, 10], layers: ['pad', 'pluck', 'drum', 'bass', 'theme'], ti: 'flute' },
  h11: { bpm: 116, root: 45, sc: [0, 3, 5, 7, 10], layers: ['drum', 'bass', 'hat', 'choir', 'stab', 'theme'], ti: 'flute' },
  h12: { bpm: 90, root: 52, sc: [0, 2, 4, 7, 9], layers: ['choir', 'pluck', 'drum', 'flute', 'theme'], ti: 'flute' },
  h13: { bpm: 72, root: 55, sc: [0, 2, 4, 7, 9], layers: ['choir', 'pad', 'flute', 'theme'], ti: 'choir' },
  /* One theme per guardian ('boss' = Guardian Ngārara, 'final' = Whiro, both from the original score) */
  boss2: { bpm: 124, root: 49, sc: [0, 1, 5, 7, 8], layers: ['drum', 'bass', 'choir', 'hat', 'pluck'] },
  boss3: { bpm: 140, root: 44, sc: [0, 1, 3, 6, 7], layers: ['drum', 'bass', 'hat', 'stab', 'whisper'] },
  boss4: { bpm: 112, root: 47, sc: [0, 3, 5, 7, 10], layers: ['drum', 'bass', 'choir', 'stab', 'theme'], ti: 'choir' }
};
/* Tāne's leitmotif in scale degrees: [start step, degree, length in 16ths]. Two phrases, four bars. */
const THEME = []; { let st = 0; [[3, 4], [4, 2], [5, 2], [4, 4], [3, 4], [2, 4], [1, 4], [2, 8], [1, 4], [2, 2], [3, 2], [4, 4], [3, 4], [2, 4], [1, 4], [0, 8]].forEach(([d, l]) => { THEME.push([st, d, l]); st += l; }); }
A.MOODS = MOODS;
const isBossMood = m => m === 'final' || /^boss/.test(m);
A.setMood = (m, fade = 2.2) => {
  A.wantMood = m; if (A.songOn && m === 'story') m = 'none';      // the title song replaces the menu music
  if (!A.ctx) { A.pendingMood = m; return; }
  if (A.mood === m) return;
  const C = A.ctx, t = now(), old = A.cur;
  if (old) { old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(0, t + fade); old.r.gain.setTargetAtTime(0, t + fade * .5, .5); setTimeout(() => { try { old.g.disconnect(); old.r.disconnect(); } catch (e) { } }, (fade + 7) * 1000); }
  const g = C.createGain(), r = C.createGain(); g.gain.value = 0; r.gain.value = 1; g.connect(A.musicBus); r.connect(A.verb);
  A.cur = { g, r, m }; A.mood = m;
  const md = MOODS[m], rr = G.rng(m.length * 977 + md.root), deg = () => md.sc[Math.floor(rr() * md.sc.length)];
  A.motif = Array.from({ length: 16 }, (_, i) => (i % 2 === 0 || rr() < .3) && rr() < .8 ? deg() + (rr() < .3 ? 12 : 0) : null);
  A.prog = [0, md.sc[md.sc.length - 2] - 12, md.sc[2] - 12, md.sc[1]];
  A.step = 0; A.next = t + (old ? .3 : .05);
  A.applyTracks(fade);
};
/* ---------- the title song ---------- */
A.titleSong = on => {
  if (!A.ctx) return;
  if (on && !A.songEl) {
    try { const el = A.songEl = new Audio('music/title.mp3'); el.loop = true; el.preload = 'auto'; el.setAttribute('playsinline', '');
      A.songG = A.ctx.createGain(); A.songG.gain.value = 0; A.ctx.createMediaElementSource(el).connect(A.songG).connect(A.musicBus); } catch (e) { A.songEl = null; return; }
  }
  const el = A.songEl; if (!el) return;
  const t = now();
  if (on !== A.songOn) { A.songOn = on;
    A.songG.gain.cancelScheduledValues(t); A.songG.gain.setValueAtTime(A.songG.gain.value, t); A.songG.gain.linearRampToValueAtTime(on ? 1 : 0, t + (on ? 2 : 1.2));
    if (on) { if (A.mood === 'story') A.setMood('none', 1.2); } else { clearTimeout(A.songStop); A.songStop = setTimeout(() => { if (!A.songOn) el.pause(); }, 1400); if (A.wantMood && A.mood !== A.wantMood) A.setMood(A.wantMood); }
  }
  if (on && el.paused && A.ctx.state === 'running' && !A.muted && !document.hidden && !A.songTry) { A.songTry = true; const p = el.play(); const done = () => { A.songTry = false; }; p && p.then ? p.then(done, done) : done(); }
};
A.procLevel = () => TRIM[A.mood] == null ? 1 : TRIM[A.mood];
function choir(m, t, dur, pk) {
  const C = A.ctx, D = A.cur.g, R = A.cur.r, g = C.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + .5); g.gain.setValueAtTime(pk, t + dur - .4); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  const f1 = C.createBiquadFilter(), f2 = C.createBiquadFilter(); f1.type = f2.type = 'bandpass'; f1.frequency.value = 730; f2.frequency.value = 1100; f1.Q.value = f2.Q.value = 5;
  const mixg = C.createGain(); mixg.gain.value = 2.2; f1.connect(mixg); f2.connect(mixg); mixg.connect(g); g.connect(D); g.connect(R);
  [-9, 0, 8].forEach(d => { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = d; const v = C.createOscillator(), vg = C.createGain(); v.frequency.value = 5 + Math.random(); vg.gain.value = 6; v.connect(vg).connect(o.detune); o.connect(f1); o.connect(f2); o.start(t); o.stop(t + dur + .1); v.start(t); v.stop(t + dur + .1); });
}
function pad(m, t, dur, pk) {
  const C = A.ctx, g = C.createGain(), f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1100, t + dur / 2); f.frequency.linearRampToValueAtTime(500, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + dur * .35); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  f.connect(g); g.connect(A.cur.g); g.connect(A.cur.r);
  [-7, 7].forEach(d => { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = d; o.connect(f); o.start(t); o.stop(t + dur + .1); });
}
function flute(m, t, dur, pk) {
  const C = A.ctx, o = C.createOscillator(), g = C.createGain(), v = C.createOscillator(), vg = C.createGain();
  o.type = 'sine'; o.frequency.value = mtof(m); v.frequency.value = 5.2; vg.gain.value = mtof(m) * .012; v.connect(vg).connect(o.frequency);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + .08); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(A.cur.g); g.connect(A.cur.r); o.start(t); v.start(t); o.stop(t + dur + .05); v.stop(t + dur + .05);
  noiseHit(t, .08, 'bandpass', mtof(m) * 2, pk * .3, A.cur.g, 3);
}
function drum(t, f0, f1, dur, pk) { const o = osc('sine', f0, t, dur, A.cur.g, pk); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .7); noiseHit(t, .05, 'lowpass', 1200, pk * .4, A.cur.g); }
A.schedule = horizon => {
  if (!A.ctx || !A.cur) return; const md = MOODS[A.mood]; if (!md) return;
  const spb = 60 / md.bpm / 4;
  if (A.next < now() - .5) A.next = now() + .05;                  // resync after a suspend instead of bursting
  while (A.next < horizon) {
    const t = A.next, s = A.step % 64, bar = Math.floor(A.step / 16) % 4, L = md.layers, R = md.root, chord = A.prog ? A.prog[bar] : 0, M = A.cur.g;
    if (A.procOn !== false) {
      if (L.includes('pad') && s % 32 === 0) [0, 7, 12, 15].forEach((x, i) => pad(R + chord + x - 12 + (i === 3 ? md.sc[1] - 3 : 0), t, spb * 34, .022));
      if (L.includes('choir') && s % 16 === 0) [0, 7, 12].forEach(x => choir(R + chord + x, t, spb * 17, .035));
      if (L.includes('pluck') && s % 2 === 0 && Math.random() < (A.mood === 'early' ? .3 : .55)) { const n = A.motif[(s / 2) % 16]; if (n !== null) osc('triangle', mtof(R + 12 + n + chord), t, .5, M, .045); }
      if (L.includes('flute') && s % 4 === 0 && Math.random() < .35) { const n = A.motif[(s + 8) % 16]; if (n !== null) flute(R + 24 + n, t, spb * (4 + Math.floor(Math.random() * 6)), .045); }
      if (L.includes('drum')) { if (s % 16 === 0 || s % 16 === 10) drum(t, 110, 45, .5, .22); if (A.mood !== 'early' && (s % 16 === 6 || s % 16 === 14) && Math.random() < .7) drum(t, 180, 120, .2, .1); }
      if (L.includes('bass') && s % 4 === 0) osc('square', mtof(R - 12 + chord + (s % 8 === 4 && A.mood !== 'late' ? 7 : 0)), t, spb * 3, M, .05);
      if (L.includes('hat') && s % 2 === 0) noiseHit(t, .03, 'highpass', 7000, s % 4 === 2 ? .04 : .02, M);
      if (L.includes('stab') && (s % 16 === 0 || s % 16 === 3)) drum(t, 70, 35, .6, .3);
      if (L.includes('stab') && s % 32 === 30) [0, 7, 12].forEach(x => osc('sawtooth', mtof(R + 12 + chord + x), t, .25, M, .03));
      if (L.includes('whisper') && s === 0 && Math.random() < .5) noiseHit(t, 2, 'bandpass', 1100 + Math.random() * 600, .05, A.cur.r, 8);
      if (L.includes('theme') && A.step % 256 < 64) for (const [st, d, l] of THEME) if (st === A.step % 256) {
        const n = md.sc.length, semi = md.sc[d % n] + 12 * Math.floor(d / n);
        if (md.ti === 'choir') choir(R + 12 + semi, t, spb * l + .2, .03); else if (md.ti === 'pluck') osc('triangle', mtof(R + 24 + semi), t, spb * l, M, .05); else flute(R + 24 + semi, t, spb * l, .05);
      }
    }
    ambientEvents(t, s);
    A.next += spb; A.step++;
  }
};

/* ---------- player-supplied music (e.g. Suno tracks): decoded, trimmed for gapless loops, loudness-normalised ---------- */
A.loadTrack = (slot, file) => new Promise((res, rej) => {
  A.init(); if (!A.ctx) return rej(new Error('Audio is not available'));
  file.arrayBuffer().then(ab => A.ctx.decodeAudioData(ab)).then(buf => {
    // trim leading/trailing silence so the loop point is seamless
    const ch = buf.getChannelData(0), th = .0015; let a = 0, b = ch.length - 1;
    while (a < b && Math.abs(ch[a]) < th) a++; while (b > a && Math.abs(ch[b]) < th) b--;
    a = Math.max(0, a - 64); b = Math.min(ch.length - 1, b + 64);
    let sum = 0, n = 0, peak = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = a; i <= b; i += 4) { sum += d[i] * d[i]; n++; } for (let i = a; i <= b; i++) peak = Math.max(peak, Math.abs(d[i])); }
    const rms = Math.sqrt(sum / Math.max(1, n)) || .1;
    const gain = clamp(Math.min(.12 / rms, .89 / Math.max(peak, .01)), .2, 4);   // ≈ −18 dBFS RMS, peaks under −1 dBFS
    A.tracks[slot] = { buf, a: a / buf.sampleRate, b: b / buf.sampleRate, gain, name: file.name, pos: 0 };
    A.applyTracks(1.5, true); res({ name: file.name, gainDb: Math.round(20 * Math.log10(gain) * 10) / 10 });
  }).catch(rej);
});
A.clearTrack = slot => { const tr = A.tracks[slot]; A.tracks[slot] = null; A.applyTracks(1.5, true); return !!tr; };
function stopPlaying(fade) {
  const p = A.playing; if (!p) return; A.playing = null; const t = now();
  const tr = p.tr; tr.pos = ((t - p.started) + p.offset) % (tr.b - tr.a);       // remember where we were, to resume later
  p.g.gain.cancelScheduledValues(t); p.g.gain.setValueAtTime(p.g.gain.value, t); p.g.gain.linearRampToValueAtTime(0, t + fade);
  p.src.stop(t + fade + .05); setTimeout(() => { try { p.g.disconnect(); } catch (e) { } }, (fade + .5) * 1000);
}
A.applyTracks = (fade = 2, force) => {
  if (!A.ctx) return; const t = now();
  const want = isBossMood(A.mood) ? A.tracks.boss : (A.mood === 'none' ? null : A.tracks.area);
  if (A.playing && A.playing.tr === want && !force) return;
  if (!A.playing || A.playing.tr !== want) {
    stopPlaying(fade);
    if (want) {
      const src = A.ctx.createBufferSource(), g = A.ctx.createGain(); src.buffer = want.buf; src.loop = true; src.loopStart = want.a; src.loopEnd = want.b;
      g.gain.value = 0; g.gain.linearRampToValueAtTime(want.gain, t + fade); src.connect(g).connect(A.musicBus);
      const offset = want.pos || 0; src.start(t, want.a + offset); A.playing = { src, g, tr: want, started: t, offset };
    }
  }
  // the procedural score sits under a custom track only where no custom track covers this state
  A.procOn = !A.playing;
  if (A.cur) { const g = A.cur.g.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(A.procOn ? A.procLevel() : 0, t + fade); }
};
})();
