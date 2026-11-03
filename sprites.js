/* Tāne's Ascent — character, creature, item and UI pixel art (all drawn by code, cached) */
(() => {
const G = window.G, PI = Math.PI;
const S = Math.sin, Co = Math.cos;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const lerp = G.lerp;

/* ================= TĀNE ================= */
const PAL = {
  normal: { skin: '#8a5a3e', skinS: '#5c3826', skinH: '#b87c52', hair: '#17100d', hairH: '#3b2a22', cloak: '#9a2e1a', cloakS: '#5e1a10', cloakH: '#d4502e', band1: '#efe6d2', band2: '#17100d', flax: '#c9a24a', flaxS: '#3a2414', wood: '#4a2a18', woodH: '#86552e', jade: '#58d39a', jadeS: '#2a8a5e' },
  gold: { skin: '#a8703f', skinS: '#7a4e2c', skinH: '#f0c070', hair: '#3a2410', hairH: '#f2c14e', cloak: '#e0b24a', cloakS: '#a87a2a', cloakH: '#fff1c0', band1: '#ffffff', band2: '#ffd36a', flax: '#fff0b0', flaxS: '#b08020', wood: '#8a5a20', woodH: '#ffe08a', jade: '#9fffd0', jadeS: '#4fdca0' }
};
function poseOf(name, f) {
  const p = { bx: 0, by: 0, lean: .04, hf: .1, kf: .1, hb: -.1, kb: .05, fa: .5, fe: .9, ba: -.2, be: .3, ta: -1.35, th: 'f', cl: .15, hr: .3, sk: 0, rot: 0 };
  const t3 = f / 3;
  switch (name) {
    case 'idle': { const s = S(f / 4 * PI * 2); return { ...p, by: s * .5, cl: .15 + s * .06, hr: .3 + s * .3 }; }
    case 'run': case 'walk': {
      const ph = f / 8 * PI * 2, c = S(ph), amp = name === 'walk' ? .55 : .9;
      return { ...p, lean: name === 'walk' ? .08 : .24, by: -Math.abs(Co(ph)) * (name === 'walk' ? .6 : 1.3) + 1, hf: c * amp, kf: Math.max(0, S(ph + 1.6)) * 1.3 + .15, hb: -c * amp, kb: Math.max(0, S(ph + 1.6 + PI)) * 1.3 + .15,
        fa: -c * .7 + .2, fe: .7, ba: c * .7, be: .5, th: 'b', ta: 2.85 - c * .1, cl: (name === 'walk' ? .35 : .75) + c * .1, hr: name === 'walk' ? .7 : 1.4, sk: c * .8 };
    }
    case 'jump': return { ...p, lean: .1, by: -1, hf: 1, kf: 1.6, hb: -.25, kb: 1, fa: 2.3, fe: .3, ba: -1.1, be: .4, th: 'b', ta: -2.4, cl: .9, hr: 1.6, sk: .6 };
    case 'djump': return { ...p, lean: .15, by: -2, hf: 1.4, kf: 2.3, hb: .9, kb: 2.2, fa: 1.5, fe: .9, ba: 1.2, be: .9, th: 'b', ta: -2.0, cl: 1.2, hr: 1.8, sk: .8, rot: f * .9 };
    case 'fall': return { ...p, lean: -.05, hf: .4, kf: .4, hb: -.5, kb: .6, fa: 1.9, fe: .2, ba: -1.9, be: .2, th: 'b', ta: 3.4, cl: 1.1, hr: 2.2, sk: -.6 };
    case 'land': return { ...p, by: 4, lean: .3, hf: .9, kf: 1.7, hb: -.2, kb: 1.6, fa: .9, fe: .6, ba: -.4, be: .6, ta: -.4, cl: .3, hr: .5 };
    case 'crouch': return { ...p, by: 8, lean: .38, hf: 1.25, kf: 2.3, hb: .15, kb: 2.4, fa: 1, fe: .6, ba: -.2, be: .5, ta: -.15, cl: .25, hr: .4 };
    case 'roll': return { ...p, by: 8, lean: .9, hf: 1.6, kf: 2.6, hb: 1.3, kb: 2.5, fa: 1.6, fe: 1.2, ba: 1.4, be: 1.2, th: 's', cl: .5, hr: .8, rot: f / 6 * PI * 2 };
    case 'slide': return { ...p, by: 9, lean: -.95, hf: 1.45, kf: 0, hb: .5, kb: 1.6, fa: -.6, fe: .3, ba: -1.4, be: .2, th: 'b', ta: 3.1, cl: 1, hr: 1.6, sk: .9 };
    case 'wall': return { ...p, lean: -.1, hf: .5, kf: .9, hb: .1, kb: .3, fa: 2.75, fe: .2, ba: .4, be: .5, th: 'b', ta: -1.8, cl: .2, hr: -.4, sk: -.2 };
    case 'hang': return { ...p, by: -1, lean: 0, hf: .15, kf: .25, hb: -.1, kb: .35, fa: 3.05, fe: 0, ba: 2.95, be: 0, th: 's', cl: .05, hr: -.6 };
    case 'climb': { const s = S(f / 4 * PI * 2); return { ...p, lean: .05, fa: 2.6 + s * .4, fe: .3, ba: 2.6 - s * .4, be: .3, hf: .6 + s * .5, kf: 1 + s * .5, hb: .6 - s * .5, kb: 1 - s * .5, th: 's', cl: .1, hr: .1 }; }
    case 'atk0': { const ta = lerp(-2.1, .45, ease(t3)); return { ...p, lean: .25, hf: .55, kf: .3, hb: -.45, kb: .2, ta, fa: PI / 2 - ta, fe: 0, ba: -.6, be: .4, cl: .55, hr: 1, sk: .4 }; }
    case 'atk1': { const ta = lerp(.7, -1.9, ease(t3)); return { ...p, lean: .18, hf: .35, kf: .2, hb: -.55, kb: .3, ta, fa: PI / 2 - ta, fe: 0, ba: -.4, be: .5, cl: .6, hr: 1, sk: -.4 }; }
    case 'atk2': { const ta = lerp(-.25, 0, t3); return { ...p, bx: lerp(-2, 4, ease(t3)), lean: .45, hf: .95, kf: .4, hb: -.75, kb: .1, ta, fa: PI / 2 - ta - .05, fe: 0, ba: -1, be: .2, cl: .8, hr: 1.3, sk: .6 }; }
    case 'heavy': { const t = f / 4; const ta = t < .5 ? lerp(-1.6, -2.7, t * 2) : lerp(-2.7, 1.05, ease((t - .5) * 2)); return { ...p, by: t > .5 ? 3 : 0, lean: t > .5 ? .45 : -.15, hf: .8, kf: .9, hb: -.5, kb: .5, ta, fa: PI / 2 - ta, fe: 0, ba: PI / 2 - ta - .3, be: .2, cl: .7, hr: 1.2 }; }
    case 'air': { const ta = lerp(-1.3, 1.7, ease(t3)); return { ...p, lean: .2, by: -1, hf: 1, kf: 1.6, hb: -.2, kb: 1.1, ta, fa: PI / 2 - ta, fe: 0, ba: -1.4, be: .4, cl: 1, hr: 1.6, sk: .5 }; }
    case 'shoot': return { ...p, lean: .12, hf: .45, kf: .2, hb: -.4, kb: .2, fa: PI / 2 + .05, fe: 0, ba: -.5, be: .5, th: 'b', ta: 2.75, cl: .45, hr: .8 };
    case 'charge': return { ...p, by: 1, lean: .05, hf: .5, kf: .5, hb: -.5, kb: .5, fa: 1.25, fe: .3, ba: 1.05, be: .5, th: 's', cl: .5 + f * .2, hr: 1 + f * .4 };
    case 'burst': return { ...p, by: 2, lean: 0, hf: .6, kf: .7, hb: -.6, kb: .7, fa: 2.5, fe: 0, ba: 2.4, be: 0, th: 's', cl: 1.3, hr: 2 };
    case 'hurt': return { ...p, lean: -.45, hf: -.2, kf: .2, hb: .4, kb: .6, fa: 1.5, fe: .5, ba: -1, be: .5, th: 'b', ta: 2.5, cl: .7, hr: 1.2 };
    case 'victory': return { ...p, lean: -.05, hf: .2, kf: 0, hb: -.25, kb: 0, ta: -1.57, fa: PI, fe: 0, ba: -.3, be: .3, cl: .5 + S(f) * .1, hr: .9 };
    case 'collect': return { ...p, lean: -.08, hf: .1, kf: 0, hb: -.15, kb: 0, fa: 2.75, fe: .25, ba: 2.55, be: .25, th: 's', cl: .4, hr: .6 };
    case 'dead': return { ...p, lean: -.45, hf: .3, kf: .5, hb: .5, kb: .2, fa: 2, fe: .4, ba: 1.6, be: .4, th: 'b', ta: 3, cl: .2, hr: .2, rot: -PI / 2, by: 2 };
    case 'push': return { ...p, lean: -.9, by: 0, hf: -.6, kf: .2, hb: -1, kb: .4, fa: PI, fe: 0, ba: PI - .2, be: 0, th: 's', cl: .2, hr: .4 }; /* used in the opening, lying on back pushing upward */
  }
  return p;
}
/* rim light: 1px light on top edges (key light from above) and a back-edge rim; drawn before the outline */
function rim(px, top, back, kt = .66, kb = .66) {
  const W = px.w, H = px.h, d = px.x.getImageData(0, 0, W, H), a = d.data, src = new Uint8ClampedArray(a), T = G.rgb(top), Bk = back && G.rgb(back);
  const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && src[(y * W + x) * 4 + 3] >= 40;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!on(x, y)) continue; const i = (y * W + x) * 4; let c = null;
    if (!on(x, y - 1)) c = T; else if (Bk && !on(x - 1, y) && on(x + 1, y)) c = Bk;
    if (c) { const k = c === T ? kt : kb; a[i] += (c[0] - a[i]) * k; a[i + 1] += (c[1] - a[i + 1]) * k; a[i + 2] += (c[2] - a[i + 2]) * k; }
  }
  px.x.putImageData(d, 0, 0);
}
G.rim = rim;
function limb(x, y, a1, l1, a2, l2) { const j = [x + S(a1) * l1, y + Co(a1) * l1]; return [j, [j[0] + S(a2) * l2, j[1] + Co(a2) * l2]]; }
function paintTane(px, P, C) {
  const cx = 24 + P.bx, hipY = 32 + P.by, ln = P.lean;
  const up = d => [cx + S(ln) * d, hipY - Co(ln) * d];
  const sh = up(8), neck = up(10), head = [neck[0] + S(ln) * 3.2, neck[1] - Co(ln) * 3.2];
  /* hair, flowing back */
  const hr = P.hr;
  for (let i = 0; i < 4; i++) {
    const sx = head[0] - 2, sy = head[1] - 2 + i;
    px.l(sx, sy, sx - 5 - hr * 1.5 - i, sy + 3 - hr * 1.6 + i * 1.2, i % 2 ? C.hairH : C.hair, 2);
    px.l(sx - 5 - hr * 1.5 - i, sy + 3 - hr * 1.6 + i * 1.2, sx - 8 - hr * 2.4 - i, sy + 6 - hr * 2.4 + i * 1.6 + S(i + hr) , C.hair, 1);
  }
  /* cloak — kahu huruhuru */
  const cl = P.cl, sb = [sh[0] - 3, sh[1] - 1], sf = [sh[0] + 1.5, sh[1]];
  const hemB = [cx - 8 - cl * 6, hipY + 8 - cl * 5], hemF = [cx + 1, hipY + 7], mid = [cx - 7 - cl * 3, hipY - 2];
  const x = px.x; x.save(); x.beginPath(); x.moveTo(sf[0], sf[1]); x.lineTo(sb[0], sb[1]); x.lineTo(mid[0], mid[1]); x.lineTo(hemB[0], hemB[1]); x.lineTo((hemB[0] + hemF[0]) / 2, Math.max(hemB[1], hemF[1]) + 1); x.lineTo(hemF[0], hemF[1]); x.closePath();
  x.fillStyle = C.cloak; x.fill(); x.clip();
  const hemY = (hemB[1] + hemF[1]) / 2;
  for (let yy = 0; yy < 48; yy++) {
    if (yy > hemY - 3) { for (let xx = 0; xx < 48; xx += 2) { x.fillStyle = ((xx >> 1) + (yy & 1)) % 2 ? C.band1 : C.band2; x.fillRect(xx, yy, 2, 1); } continue; }
    const k = yy % 4; if (k === 0) { x.fillStyle = C.cloakH; for (let xx = (yy >> 2) % 2; xx < 48; xx += 3) x.fillRect(xx, yy, 2, 1); }
    else if (k === 3) { x.fillStyle = C.cloakS; x.fillRect(0, yy, 48, 1); }
  }
  x.restore();
  /* back arm, back leg */
  const [bj, bh] = limb(sh[0] - 1, sh[1] + 1, P.ba, 5, P.ba + P.be, 5);
  px.l(sh[0] - 1, sh[1] + 1, bj[0], bj[1], C.skinS, 2); px.l(bj[0], bj[1], bh[0], bh[1], C.skinS, 2);
  const [bk, bf] = limb(cx - 1, hipY, P.hb, 6, P.hb - P.kb, 6);
  px.l(cx - 1, hipY, bk[0], bk[1], C.skinS, 3); px.l(bk[0], bk[1], bf[0], bf[1], C.skinS, 2); px.r(bf[0] - 1, bf[1], 3, 1, C.skinS);
  /* torso */
  px.l(cx, hipY - 1, sh[0], sh[1] + 1, C.skin, 5);
  px.l(cx - 2 * Co(ln), hipY - 1, sh[0] - 2 * Co(ln), sh[1] + 1, C.skinS, 1);
  px.l(cx + 1.5 * Co(ln), hipY - 2, sh[0] + 1.5 * Co(ln), sh[1] + 2, C.skinH, 1);
  /* pounamu */
  const pp = [sh[0] + 1.5 + S(ln) * -2, sh[1] + 3]; px.r(pp[0], pp[1], 2, 2, C.jade); px.p(pp[0], pp[1] + 2, C.jadeS); px.p(pp[0], pp[1], '#ffffff');
  /* piupiu */
  for (let i = -3; i <= 3; i++) { const tx = cx + i, by = hipY + 6; px.l(tx, hipY - 1, tx - P.sk * 1.5 - S(ln) * 3, by, i % 2 ? C.flax : C.flaxS, 1); }
  px.r(cx - 4, hipY - 2, 9, 2, C.flaxS);
  /* front leg */
  const [fk, ff] = limb(cx + 1, hipY, P.hf, 6, P.hf - P.kf, 6);
  px.l(cx + 1, hipY, fk[0], fk[1], C.skin, 3); px.l(fk[0], fk[1], ff[0], ff[1], C.skin, 2); px.r(ff[0] - 1, ff[1], 3, 1, C.skin);
  px.p(fk[0] + 1, fk[1], C.skinH);
  /* head */
  px.circ(head[0] - .6, head[1] - .6, 3, C.hair);
  px.circ(head[0] + .7, head[1] + .4, 2, C.skin);
  px.p(head[0] + 2, head[1], '#0b0708'); px.p(head[0] + 1.5, head[1] - 1, C.hair);
  px.p(head[0] + 2.6, head[1] + 1.5, C.skinS);
  /* front arm */
  const [fj, fh] = limb(sh[0] + 1, sh[1] + 1, P.fa, 5, P.fa + P.fe, 5);
  px.l(sh[0] + 1, sh[1] + 1, fj[0], fj[1], C.skin, 2); px.l(fj[0], fj[1], fh[0], fh[1], C.skin, 2); px.p(fj[0], fj[1] - 1, C.skinH);
  /* taiaha */
  let hand = P.th === 'b' ? bh : fh, ta = P.ta;
  if (P.th === 's') { hand = [sh[0] - 2, sh[1] + 4]; ta = -1.0; }
  const d = [Co(ta), S(ta)], A1 = [hand[0] + d[0] * 15, hand[1] + d[1] * 15], B1 = [hand[0] - d[0] * 11, hand[1] - d[1] * 11];
  px.l(B1[0], B1[1], A1[0], A1[1], C.wood, 2);
  px.l(hand[0] + d[0] * 9, hand[1] + d[1] * 9, A1[0], A1[1], C.wood, 3);
  px.l(hand[0] + d[0] * 2, hand[1] + d[1] * 2, hand[0] + d[0] * 13, hand[1] + d[1] * 13, C.woodH, 1);
  px.p(B1[0], B1[1], C.woodH); px.p(B1[0] + d[0] * 2, B1[1] + d[1] * 2, C.jade);
  const n = [-d[1], d[0]];
  px.p(B1[0] + d[0] * 3 + n[0] * 2, B1[1] + d[1] * 3 + n[1] * 2, C.band1); px.p(B1[0] + d[0] * 3 - n[0] * 2, B1[1] + d[1] * 3 - n[1] * 2, C.band2);
  px.p(B1[0] + d[0] * 4 + n[0] * 2, B1[1] + d[1] * 4 + n[1] * 2, C.band2); px.p(B1[0] + d[0] * 4 - n[0] * 2, B1[1] + d[1] * 4 - n[1] * 2, C.band1);
  if (P.th !== 's') { px.p(hand[0], hand[1], C.skin); }
}
G.tane = (pose, f = 0, gold = false) => {
  const key = 'tane:' + pose + ':' + f + ':' + (gold ? 1 : 0);
  return G.sprite(key, 48, 48, px => {
    const P = poseOf(pose, f), C = gold ? PAL.gold : PAL.normal;
    if (!P.rot) paintTane(px, P, C);
    else { const tmp = new G.PX(48, 48); paintTane(tmp, P, C); px.x.save(); px.x.translate(24, 32); px.x.rotate(P.rot); px.x.drawImage(tmp.c, -24, -32); px.x.restore(); }
    rim(px, gold ? '#ffffff' : '#ffd9a0', gold ? '#fff1c0' : '#3ab8b0', .6, .38);
  });
};
G.TANE_FRAMES = { idle: 4, run: 8, walk: 8, climb: 4, roll: 6, atk0: 4, atk1: 4, atk2: 4, heavy: 5, air: 4, djump: 7, charge: 3 };

/* ================= CREATURES ================= */
const CR = {
  liz: { a: '#3f7a46', b: '#2a5232', c: '#7fbf6a', e: '#f2c14e' },
  lizC: { a: '#4a2a5a', b: '#2a1634', c: '#8a4aa8', e: '#ff4a3a' },
  weta: { a: '#7a4a24', b: '#4a2a14', c: '#b07a40', e: '#f0d0a0' },
  bird: { a: '#2a2230', b: '#16121c', c: '#5a4a6a', e: '#ff4a3a' },
  mos: { a: '#2a2228', b: '#140f14', c: '#6a5a62', e: '#c2452a' }
};
function lizard(px, f, C, w = 30) {
  const leg = f % 4, by = 8;
  px.ell(15, by, 9, 3, C.a); px.ell(15, by - 1, 8, 1, C.c);
  px.l(6, by, 0, by + 1 + S(f) * 1, C.a, 2); px.l(0, by + 1, -2, by + 2, C.b, 1); // tail
  px.ell(25, by - 1, 4, 2, C.a); px.p(27, by - 2, C.e); px.l(27, by + 1, 29, by + 1, C.b);
  for (let i = 8; i < 22; i += 3) px.p(i, by - 4 + (i % 2), C.b);
  const lp = [[10, leg === 0 || leg === 1 ? -2 : 2], [20, leg === 1 || leg === 2 ? 2 : -2]];
  for (const [lx, o] of lp) { px.l(lx, by + 2, lx + o, by + 6, C.b, 2); px.l(lx - 2, by + 2, lx - 2 - o, by + 6, C.b, 2); }
  for (let i = 9; i < 22; i += 4) px.p(i, by + 1, C.c);
}
G.enemySprite = (type, f = 0, v = '') => {
  const key = 'en:' + type + ':' + f + ':' + v;
  const def = {
    liz: [32, 16, px => lizard(px, f, v === 'c' ? CR.lizC : CR.liz)],
    lizL: [32, 16, px => { lizard(px, 1, v === 'c' ? CR.lizC : CR.liz); px.r(28, 6, 4, 1, '#ff8a6a'); }],
    weta: [24, 20, px => {
      const C = CR.weta, crouch = f === 2 ? 2 : 0;
      for (let i = 0; i < 3; i++) px.ell(8 + i * 4, 10 + crouch, 3, 3 - (i === 2 ? 1 : 0), i % 2 ? C.a : C.b);
      px.ell(18, 9 + crouch, 3, 3, C.a); px.p(20, 8 + crouch, C.e);
      px.l(20, 7 + crouch, 23, f === 1 ? 0 : 2, C.c); px.l(19, 7 + crouch, 22, f === 1 ? 1 : 3, C.c);
      const kick = f === 1 ? 4 : 0;
      px.l(6, 11 + crouch, 1, 4 + crouch - kick / 2, C.b, 2); px.l(1, 4 + crouch - kick / 2, 0 - kick, 16, C.b, 1);
      for (let i = 2; i < 13; i += 3) px.p(1 + i * .05 - kick * i / 13, 4 + i, C.c);
      px.l(12, 13 + crouch, 11, 17, C.b); px.l(16, 13 + crouch, 18, 17, C.b);
      for (let i = 6; i < 15; i += 2) px.p(i, 8 + crouch, C.c);
    }],
    bird: [24, 18, px => {
      const C = CR.bird, wf = [-6, -2, 3, 0][f % 4], dive = v === 'd';
      px.ell(12, 9, 6, 3, C.a); px.ell(17, 7, 3, 3, C.a); px.p(18, 6, C.e);
      px.poly([[20, 7], [23, 8], [20, 9]], '#c2a04a');
      px.l(6, 9, 1, 8, C.b, 2); px.l(6, 10, 1, 12, C.b, 1);
      if (dive) { px.poly([[9, 8], [3, 3], [14, 7]], C.c); }
      else { px.poly([[9, 8], [6, 8 + wf], [15, 8 + wf * .8], [15, 8]], C.c); px.l(7, 8 + wf, 14, 8 + wf * .8, C.b); }
      px.p(10, 12, C.b); px.p(14, 12, C.b);
    }],
    mos: [14, 12, px => {
      const C = CR.mos; px.l(3, 6, 9, 6, C.a, 2); px.ell(5, 6, 2, 2, C.b); px.l(10, 6, 13, 8, '#3a2a32'); px.p(9, 5, C.e);
      const up = f % 2; px.poly([[5, 5], [3 + up * 2, up ? 0 : 2], [8, 5]], 'rgba(220,210,230,.85)'); px.l(4, 8, 2, 11, C.b); px.l(7, 8, 8, 11, C.b);
    }],
    stalk: [26, 24, px => {
      const hid = v === 'h';
      if (hid) { px.p(15, 14, '#ff4a3a'); px.p(18, 14, '#ff4a3a'); return; }
      const lunge = f === 2;
      px.ell(13, 15, lunge ? 9 : 7, 5, '#0f0a14'); px.ell(19, 12, 4, 4, '#0f0a14');
      for (let i = 0; i < 5; i++) px.l(6 + i * 3, 17, 4 + i * 3 + (f % 2 ? 1 : -1), 23, '#1a1222', 1);
      px.l(5, 14, 0, 10 + (f % 2) * 2, '#1a1222', 2);
      px.p(20, 11, '#ff4a3a'); px.p(22, 11, '#ff4a3a'); px.p(21, 14, '#3a2a44');
      for (let i = 0; i < 6; i++) px.p(8 + i * 2, 10 + (i % 2), '#2a1a3a');
    }],
    spirit: [20, 24, px => {
      const sw = S(f / 3 * PI * 2) * 2;
      px.poly([[4, 8], [16, 8], [14 + sw, 18], [10 - sw, 23], [6, 16]], 'rgba(40,24,60,.95)');
      px.circ(10, 8, 6, '#1e1230'); px.circ(10, 7, 4, '#2c1a44');
      px.p(8, 7, '#ff6a4a'); px.p(12, 7, '#ff6a4a'); px.r(8, 10, 4, 1, '#0b0708');
      px.p(5 + sw, 14, '#5a3a8a'); px.p(14, 12 - sw, '#5a3a8a');
    }],
    spider: [22, 16, px => {
      const C = v === 'c' ? ['#140c18', '#3a1a44', '#ff4a3a'] : ['#1a1410', '#4a3a2a', '#f2c14e'];
      px.ell(11, 7, 5, 4, C[0]); px.ell(11, 11, 3, 2, C[0]); px.p(9, 11, C[2]); px.p(13, 11, C[2]);
      for (let i = 0; i < 4; i++) { const o = (f + i) % 2 ? 1 : -1; px.l(7, 7 + i, 1, 3 + i * 3 + o, C[0]); px.l(15, 7 + i, 21, 3 + i * 3 - o, C[0]); }
      px.p(10, 5, C[1]); px.p(12, 6, C[1]); px.r(10, 8, 2, 1, C[1]);
    }],
    guard: [28, 32, px => {
      const st = '#5e5a66', stD = '#3a3640', stH = '#8a8698', gl = v === 'c' ? '#ff4a3a' : '#7fd3ff';
      const step = f % 2;
      px.r(9, 24, 4, 7 - step, stD); px.r(15, 24, 4, 6 + step, stD);
      px.r(7, 10, 14, 15, st); px.r(7, 10, 2, 15, stD); px.r(19, 10, 1, 15, stH);
      px.circ(14, 6, 5, st); px.p(12, 6, gl); px.p(16, 6, gl); px.r(12, 9, 5, 1, stD);
      // spiral carving on chest
      px.p(13, 15, stH); px.p(14, 15, stH); px.p(15, 16, stH); px.p(15, 17, stH); px.p(14, 18, stH); px.p(13, 18, stH); px.p(12, 17, stH); px.p(14, 17, gl);
      // stone slab (defence) in front
      px.r(21, 8, 5, 20, stD); px.r(22, 9, 3, 18, st); for (let i = 10; i < 26; i += 4) px.r(22, i, 3, 1, stH);
      px.r(4, 12, 3, 9, stD);
    }],
    horror: [28, 22, px => {
      if (v === 'h') { px.r(7, 5, 3, 2, '#e8ffd0'); px.r(15, 5, 3, 2, '#e8ffd0'); return; }
      const sw = f ? 1 : -1, body = '#120c14', fold = '#2a1a30', pale = '#c8d8b0';
      for (let i = 0; i < 6; i++) { const x = 4 + i * 4; px.l(x, 14, x - 3 + (i % 2 ? sw : -sw) * 2, 21, body, 2); }
      px.ell(14, 11, 11, 6, body); px.ell(14, 9, 8, 3, fold);
      for (let i = 0; i < 5; i++) px.p(7 + i * 3, 7 + (i % 2), '#4a3a5a');
      px.ell(22, 12, 4, 4, body); px.r(20, 14, 6, 2, '#3a0a10'); px.p(21, 14, pale); px.p(23, 14, pale); px.p(25, 14, pale);
      px.r(20, 9, 2, 2, '#e8ffd0'); px.r(24, 9, 2, 2, '#e8ffd0');
      px.l(25, 11, 28, 6 + sw, body); px.l(25, 13, 28, 16 - sw, body);
    }],
    beast: [36, 26, px => {
      const C = { a: '#2a2a5a', b: '#16163a', c: '#6a6ab8', m: '#c8b8ff', e: v === 't' || v === 'c' ? '#ff4a6a' : '#fff1c0', s: '#7a2a8a' };
      const run = v === 'c', lp = run ? [3, -3, 3, -3][f] : [1, 0, -1, 0][f], low = v === 't' ? 2 : 0, daze = v === 'd';
      px.ell(17, 13 + low, 11, 5, C.a); px.ell(17, 11 + low, 9, 2, C.c);
      for (let i = 0; i < 6; i++) px.l(8 + i * 3, 10 + low, 6 + i * 3 - (run ? 3 : 1), 4 + low - (i % 2) * 2, i % 2 ? C.m : C.s, 1);
      px.l(7, 12 + low, 1, 8 + low - (run ? 2 : 0), C.a, 2); px.p(0, 7 + low, C.m);
      px.ell(29, 10 + low * 2, 5, 4, C.a); px.poly([[31, 7 + low * 2], [34, 3 + low * 2], [33, 8 + low * 2]], C.c); px.poly([[27, 7 + low * 2], [28, 2 + low * 2], [30, 7 + low * 2]], C.c);
      px.r(32, 12 + low * 2, 4, 2, C.b); px.r(30, 9 + low * 2, 2, 2, C.e); if (daze) { px.r(30, 9, 2, 1, C.b); }
      const leg = (x, o) => { px.l(x, 17 + low, x + o, 25, C.b, 2); px.r(x + o - 1, 24, 3, 2, C.b); };
      leg(10, -lp); leg(13, lp); leg(22, lp); leg(25, -lp);
      for (let i = 0; i < 4; i++) px.p(12 + i * 4, 14 + low, C.m);
    }],
    warrior: [32, 30, px => {
      const sh = '#120c18', sh2 = '#2a1a36', eye = '#ff4a3a', s = v; // s: '' idle, 'a' attack, 'b' block
      const leg = f % 2;
      px.l(14, 20, 11 - leg, 29, sh, 3); px.l(17, 20, 20 + leg, 29, sh, 3);
      px.l(15, 20, 16, 9, sh, 6); px.circ(17, 6, 4, sh); px.p(19, 6, eye);
      px.poly([[12, 8], [6, 22 + leg], [12, 20]], sh2);
      if (s === 'a') { px.l(17, 11, 24, 12, sh, 2); px.l(18, 12, 31, 12, '#3a2a44', 2); px.p(31, 12, eye); }
      else if (s === 'b') { px.l(17, 11, 21, 8, sh, 2); px.l(22, 1, 22, 24, '#3a2a44', 2); }
      else { px.l(17, 11, 21, 16, sh, 2); px.l(25, 4, 17, 28, '#3a2a44', 2); px.p(25, 4, eye); }
    }]
  }[type];
  if (!def) return null;
  const DARK = { stalk: 1, spirit: 1, spider: 1, warrior: 1, horror: 1 };
  if (DARK[type] || v === 'c') { const fn = def[2]; return G.sprite(key, def[0], def[1], px => { fn(px); rim(px, '#b46ae8', '#6a3aa0'); }); }
  return G.sprite(key, def[0], def[1], def[2]);
};

/* ================= BOSSES ================= */
G.bossSprite = (kind, f = 0, v = '') => {
  const key = 'boss:' + kind + ':' + f + ':' + v;
  const defs = {
    ngarara: [84, 40, px => {
      const C = { a: '#2f6a4a', b: '#1b3e2c', c: '#8ad06a', d: '#f2c14e', g: '#c2452a' };
      const stun = v === 's', open = v === 'o', leg = f % 4;
      if (stun) { // flipped, belly glowing (weak point)
        px.ell(42, 22, 26, 8, C.a); px.ell(42, 20, 22, 5, '#e8d090'); for (let i = 24; i < 62; i += 5) px.r(i, 18, 2, 4, '#f2e2a0');
        for (let i = 0; i < 4; i++) px.l(26 + i * 10, 15, 24 + i * 10 + S(f + i) * 3, 6, C.b, 3);
        px.l(16, 22, 2, 26, C.a, 4); px.ell(70, 22, 8, 5, C.a); px.p(74, 23, '#ffffff'); return;
      }
      px.l(18, 24, 2, 22 + S(f / 2) * 3, C.a, 5); px.l(2, 22 + S(f / 2) * 3, 0, 18, C.b, 3);
      px.ell(42, 24, 26, 9, C.a); px.ell(42, 21, 22, 4, C.c);
      for (let i = 20; i < 64; i += 4) { px.poly([[i, 16], [i + 2, 9 - (i % 8 ? 0 : 3)], [i + 4, 16]], C.g); }
      for (let i = 22; i < 62; i += 5) px.p(i, 26, C.c), px.p(i + 2, 28, C.b);
      px.ell(70, 22, 10, 6, C.a); px.ell(72, 20, 7, 3, C.c);
      px.r(75, 19, 3, 2, C.d); px.p(76, 19, '#0b0708');
      if (open) { px.poly([[72, 25], [84, 22], [84, 32], [72, 28]], '#3a0a10'); for (let i = 74; i < 84; i += 3) { px.p(i, 23, '#efe6d2'); px.p(i, 30, '#efe6d2'); } }
      else px.l(70, 26, 82, 25, C.b, 1);
      const lp = [[30, leg === 0 || leg === 1 ? -4 : 4], [56, leg === 1 || leg === 2 ? 4 : -4]];
      for (const [lx, o] of lp) { px.l(lx, 30, lx + o, 39, C.b, 4); px.l(lx - 5, 30, lx - 5 - o, 39, C.a, 4); px.r(lx + o - 2, 38, 5, 2, C.b); }
    }],
    moonkeeper: [56, 56, px => {
      const g = v === 'o' ? '#ffffff' : '#bcd7ff', open = v === 'o';
      px.circ(28, 28, 22, '#26324a'); px.circ(28, 28, 20, '#cfe0f5'); px.circ(30, 26, 18, '#e8f1ff');
      for (let i = 0; i < 6; i++) px.circ(16 + (i * 7) % 24, 18 + (i * 11) % 22, 2, '#b2c6e2');
      // carved face: eyes as spirals, mouth
      for (const ex of [19, 37]) { px.circ(ex, 24, 5, '#26324a'); px.circ(ex, 24, 3, open ? '#7fd3ff' : '#4a6a9a'); px.p(ex, 24, '#0b1020'); }
      px.r(20, 37, 16, 2, '#26324a'); for (let i = 21; i < 36; i += 4) px.poly([[i, 39], [i + 2, 39], [i + 1, 41]], '#26324a');
      for (let i = 0; i < 5; i++) px.p(22 + i * 3, 12 + (i % 2), '#9ab0d0');
      if (open) px.circ(28, 28, 4, '#ffffff');
    }],
    moonorb: [14, 14, px => { px.circ(7, 7, 5, '#26324a'); px.circ(7, 7, 4, '#bcd7ff'); px.circ(6, 6, 2, '#ffffff'); }],
    champion: [40, 44, px => {
      const sh = '#0e0a14', sh2 = '#2a1636', red = '#ff4a3a', st = v; const leg = f % 2;
      px.poly([[16, 12], [4 - leg * 2, 38], [14, 34], [18, 20]], sh2);
      px.l(18, 28, 14 - leg * 2, 42, sh, 4); px.l(22, 28, 26 + leg * 2, 42, sh, 4);
      px.l(20, 28, 21, 13, sh, 8); px.circ(22, 8, 5, sh); px.r(22, 7, 4, 1, red);
      for (let i = 0; i < 4; i++) px.p(15 + i * 2, 14 + i * 3, '#4a2a5a');
      if (st === 'a') { px.l(22, 16, 30, 17, sh, 3); px.l(10, 17, 40, 17, '#3a2a44', 2); px.poly([[36, 15], [40, 17], [36, 19]], red); }
      else if (st === 'b') { px.l(22, 16, 27, 12, sh, 3); px.l(28, 2, 28, 34, '#3a2a44', 3); px.p(28, 2, red); for (let i = 6; i < 32; i += 6) px.p(28, i, '#5a3a6a'); }
      else if (st === 'w') { px.l(22, 15, 26, 6, sh, 3); px.l(14, 14, 34, -2 + 6, '#3a2a44', 2); px.p(34, 4, red); }
      else { px.l(22, 16, 27, 22, sh, 3); px.l(32, 4, 22, 40, '#3a2a44', 2); px.poly([[31, 1], [33, 6], [30, 6]], red); }
    }],
    gatekeeper: [88, 104, px => {
      const st = '#7a6a52', stD = '#4a3e2e', stH = '#b8a27a', gold = '#f2c14e', core = v === 'o' ? '#ffffff' : '#c2452a';
      const raise = v === 'r', slam = v === 's';
      px.r(26, 74, 14, 28, stD); px.r(48, 74, 14, 28, stD); px.r(22, 98, 20, 6, st); px.r(46, 98, 20, 6, st);
      px.r(18, 30, 52, 48, st); px.r(18, 30, 4, 48, stD); px.r(66, 30, 4, 48, stH);
      for (let y = 34; y < 76; y += 6) for (let x = 24; x < 64; x += 8) { px.poly([[x, y], [x + 4, y + 4], [x + 8, y]], stD); }
      px.circ(44, 52, 9, stD); px.circ(44, 52, 6, core); px.circ(44, 52, 3, v === 'o' ? '#fff6c0' : '#7a1d33');
      px.r(28, 6, 32, 26, st); px.r(28, 6, 32, 3, gold);
      for (const ex of [36, 52]) { px.circ(ex, 18, 4, stD); px.circ(ex, 18, 2, gold); }
      px.r(36, 26, 16, 3, stD); for (let i = 37; i < 52; i += 3) px.p(i, 27, stH);
      px.poly([[28, 6], [20, 0], [30, 2]], gold); px.poly([[60, 6], [68, 0], [58, 2]], gold);
      const armY = raise ? 4 : slam ? 72 : 40;
      px.l(18, 36, 8, armY, st, 9); px.circ(8, armY + 4, 7, stD);
      px.l(70, 36, 80, armY, st, 9); px.circ(80, armY + 4, 7, stD);
    }],
    whiro: [48, 60, px => {
      const sh = '#07040a', sh2 = '#1c0e24', red = '#ff3a2a', pur = '#4a1a5a', st = v; const w = S(f / 4 * PI * 2) * 2;
      for (let i = 0; i < 7; i++) px.l(16 + i * 3, 40, 12 + i * 4 + w * (i % 2 ? 1 : -1), 58 - (i % 3) * 2, i % 2 ? sh : sh2, 3);
      px.poly([[14, 16], [34, 16], [38, 44], [10, 44]], sh2);
      px.poly([[17, 16], [31, 16], [32, 40], [16, 40]], sh);
      px.circ(24, 10, 7, sh); px.circ(24, 10, 5, '#1a0a1e');
      px.r(19, 9, 4, 2, red); px.r(26, 9, 4, 2, red); px.r(21, 14, 6, 1, pur);
      px.poly([[17, 4], [12, -2], [20, 3]], sh2); px.poly([[31, 4], [36, -2], [28, 3]], sh2);
      for (let i = 0; i < 5; i++) px.p(19 + i * 2, 22 + (i % 2) * 2, pur);
      if (st === 'a') { px.l(30, 22, 40, 22, sh, 3); px.l(8, 22, 48, 21, '#2a1236', 2); px.poly([[44, 19], [48, 21], [44, 23]], red); }
      else if (st === 'c') { px.l(16, 22, 6, 10, sh, 3); px.l(32, 22, 42, 10, sh, 3); px.circ(6, 9, 3, red); px.circ(42, 9, 3, red); }
      else { px.l(31, 22, 36, 32, sh, 3); px.l(40, 6, 30, 56, '#2a1236', 2); px.poly([[39, 3], [42, 8], [38, 8]], red); }
    }]
  };
  const d = defs[kind]; if (!d) return null;
  if (kind === 'champion' || kind === 'whiro') { const fn = d[2]; return G.sprite(key, d[0], d[1], px => { fn(px); rim(px, '#c87af0', '#7a2a5a'); }); }
  return G.sprite(key, d[0], d[1], d[2]);
};

/* ================= KERERŪ (companion) ================= */
G.kereruSprite = f => G.sprite('kereru:' + f, 12, 10, px => {
  px.ell(6, 6, 4, 3, '#3f8a5a'); px.ell(6, 7, 3, 2, '#efe6d2'); px.circ(9, 4, 2, '#4a9a6a'); px.p(10, 3, '#0b0708'); px.p(11, 5, '#c2452a');
  px.p(8, 5, '#7a4a8a'); px.l(1, 6, 3, 6, '#2a6a4a');
  if (f) px.poly([[4, 5], [8, 5], [5, 0]], '#2f7a4a'); else px.poly([[3, 6], [8, 6], [5, 9]], '#2f7a4a');
});

/* ================= ITEMS ================= */
G.itemSprite = (kind, f = 0) => G.sprite('it:' + kind + ':' + f, 16, 16, px => {
  switch (kind) {
    case 'kumara': px.ell(8, 10, 6, 3.5, '#8a3a5a'); px.ell(7, 9, 4, 2, '#a85278'); px.p(4, 10, '#5a2038'); px.p(11, 11, '#5a2038'); px.l(13, 9, 15, 5, '#4f8a3a', 2); px.l(13, 9, 11, 4, '#6aaa4a'); break;
    case 'mana': px.poly([[8, 1], [13, 7], [8, 15], [3, 7]], '#3ab8c8'); px.poly([[8, 1], [8, 15], [3, 7]], '#7fe6f0'); px.p(6, 5, '#ffffff'); px.p(7, 4, '#ffffff'); break;
    case 'feather': px.l(4, 14, 12, 2, '#2a2a2a', 3); px.l(3, 15, 11, 3, '#111111', 1); px.l(10, 5, 13, 1, '#efe6d2', 3); px.l(5, 13, 12, 3, '#6a6a6a', 1); break;
    case 'relic': px.poly([[5, 2], [11, 2], [12, 13], [8, 15], [4, 13]], '#2e9a68'); px.poly([[5, 2], [8, 2], [8, 15], [4, 13]], '#5fd3a0'); px.circ(8, 6, 1, '#1a5a3a'); px.p(6, 4, '#c8ffe8'); break;
    case 'carving': px.r(2, 1, 12, 14, '#5a341e'); px.r(3, 2, 10, 12, '#7a4a2a');
      [[8, 5], [9, 5], [10, 6], [10, 7], [10, 8], [9, 9], [8, 9], [7, 9], [6, 8], [6, 7], [7, 6], [8, 7]].forEach(p => px.p(p[0], p[1], '#e2b878'));
      px.r(3, 11, 10, 1, '#c2452a'); for (let i = 3; i < 13; i += 2) px.p(i, 12, '#efe6d2'); break;
    case 'kete': px.poly([[2, 6], [14, 6], [12, 15], [4, 15]], '#c99a3e'); for (let i = 3; i < 14; i += 2) px.l(i, 6, i + 1, 15, '#8a6420'); for (let y = 8; y < 15; y += 3) px.l(3, y, 13, y, '#e8c060');
      px.l(4, 6, 6, 1, '#8a6420'); px.l(6, 1, 10, 1, '#8a6420'); px.l(10, 1, 12, 6, '#8a6420'); break;
    case 'whatu1': px.ell(8, 9, 6, 5, '#e8eef2'); px.ell(7, 8, 4, 3, '#ffffff'); px.p(10, 11, '#a8b8c8'); break;
    case 'whatu2': px.ell(8, 9, 6, 5, '#7aa8a0'); px.ell(7, 8, 4, 3, '#a8d8d0'); px.p(10, 11, '#4a7a72'); break;
    case 'glyph': px.ell(8, 9, 6, 6, '#4a4a5a'); px.ell(7, 8, 5, 5, '#6a6a7e'); px.p(4, 6, '#9a9ab0'); px.p(5, 5, '#9a9ab0');
      [[8, 9], [9, 9], [9, 8], [8, 7], [7, 7], [6, 8], [6, 9], [6, 10], [7, 11], [8, 11], [9, 11], [10, 10], [11, 9], [11, 8], [11, 7], [10, 6], [10, 5], [9, 4]].forEach(p => px.p(p[0], p[1], '#f2c14e')); px.p(8, 9, '#fff1c0'); break;
    case 'shrine': px.r(5, 4, 6, 12, '#5a341e'); px.circ(8, 4, 4, '#7a4a2a'); px.circ(8, 4, 2, '#f2c14e'); px.r(4, 14, 8, 2, '#3a2010'); break;
  }
});
G.pouSprite = (lit) => G.sprite('pou:' + (lit ? 1 : 0), 16, 36, px => {
  const w = '#5a341e', d = '#3a2010', h = '#86552e';
  px.r(4, 8, 8, 28, w); px.r(4, 8, 2, 28, d); px.r(11, 8, 1, 28, h);
  px.circ(8, 7, 5, w); px.circ(6, 6, 1, lit ? '#f2c14e' : '#efe6d2'); px.circ(10, 6, 1, lit ? '#f2c14e' : '#efe6d2'); px.r(6, 10, 4, 1, d);
  for (let y = 14; y < 34; y += 5) { px.poly([[4, y], [8, y + 3], [12, y]], d); px.p(8, y + 1, lit ? '#f2c14e' : h); }
  px.r(3, 34, 10, 2, d);
});
G.gateSprite = (open) => G.sprite('gate:' + (open ? 1 : 0), 48, 64, px => {
  const w = '#5a341e', d = '#2a1810', o = '#b8361f', b = '#efe6d2';
  px.r(4, 14, 8, 50, w); px.r(36, 14, 8, 50, w); px.r(4, 14, 2, 50, d); px.r(36, 14, 2, 50, d);
  for (const x0 of [4, 36]) for (let y = 18; y < 62; y += 7) { px.poly([[x0, y], [x0 + 4, y + 4], [x0 + 8, y]], o); px.p(x0 + 4, y + 1, b); }
  px.r(0, 6, 48, 10, w); px.r(0, 6, 48, 2, o); for (let x = 2; x < 46; x += 4) px.p(x, 11, b), px.p(x + 2, 13, o);
  px.circ(24, 6, 6, w); px.circ(22, 5, 1, '#f2c14e'); px.circ(26, 5, 1, '#f2c14e'); px.r(22, 8, 5, 1, d);
});

/* ================= HUD portrait + icons ================= */
G.portrait = (state, blink, look = 0) => G.sprite('pt:' + state + ':' + (blink ? 1 : 0) + ':' + look, 30, 30, px => {
  const gold = state === 'power', C = gold ? PAL.gold : PAL.normal;
  const bruise = state === 'heavy' || state === 'near';
  px.circ(15, 17, 11, C.hair);
  px.ell(15, 17, 8, 10, C.skin); px.ell(17, 15, 5, 6, C.skinH);
  px.r(5, 6, 20, 5, C.hair); px.ell(15, 5, 7, 3, C.hair);
  for (let i = 0; i < 4; i++) px.l(4 + i, 10 + i * 3, 2 + i, 26, C.hair, 2);
  // eyes
  const ey = 15, lk = look;
  if (state === 'hurt') { px.l(9, ey, 13, ey + 1, '#0b0708'); px.l(17, ey + 1, 21, ey, '#0b0708'); }
  else if (blink) { px.r(9, ey + 1, 4, 1, '#0b0708'); px.r(17, ey + 1, 4, 1, '#0b0708'); }
  else { px.r(9, ey, 4, 3, gold ? '#fff6c0' : '#efe6d2'); px.r(17, ey, 4, 3, gold ? '#fff6c0' : '#efe6d2'); px.r(10 + lk, ey + 1, 2, 2, gold ? '#f2c14e' : '#0b0708'); px.r(18 + lk, ey + 1, 2, 2, gold ? '#f2c14e' : '#0b0708'); }
  // brows
  const furrow = state === 'minor' ? 1 : bruise ? 2 : 0;
  px.l(8, ey - 2, 13, ey - 2 + furrow, C.hair, 1); px.l(17, ey - 2 + furrow, 22, ey - 2, C.hair, 1);
  px.r(14, ey + 3, 2, 3, C.skinS);
  // mouth
  if (state === 'full' || state === 'power') px.r(12, 23, 6, 1, C.skinS);
  else if (state === 'minor') px.r(12, 23, 6, 1, '#3a1a10');
  else if (state === 'heavy') { px.r(12, 22, 6, 2, '#3a1a10'); px.p(11, 23, '#3a1a10'); }
  else { px.r(12, 22, 6, 3, '#2a0a08'); px.r(13, 23, 4, 1, '#efe6d2'); }
  if (bruise) { px.r(7, 19, 3, 2, '#7a2a3a'); }
  if (state === 'near') { px.r(21, 9, 1, 3, '#9fd3e8'); px.r(18, 17, 2, 1, '#b8361f'); }
  px.p(15, 27, C.jade); px.p(15, 28, C.jadeS);
});
G.icon = name => G.sprite('ic:' + name, 12, 12, px => {
  switch (name) {
    case 'shield': px.circ(6, 6, 5, '#3a8a4a'); px.circ(6, 6, 3, '#7fd36a'); px.p(6, 6, '#e8ffd0'); break;
    case 'dash': px.l(1, 6, 10, 6, '#7fd3ff', 2); px.poly([[7, 2], [11, 6], [7, 10]], '#ffffff'); break;
    case 'wings': px.poly([[6, 7], [0, 1], [2, 9]], '#efe6d2'); px.poly([[6, 7], [12, 1], [10, 9]], '#efe6d2'); px.p(6, 7, '#f2c14e'); break;
    case 'burst': px.circ(6, 6, 2, '#f2c14e'); for (let i = 0; i < 8; i++) px.p(6 + Co(i * PI / 4) * 5, 6 + S(i * PI / 4) * 5, '#fff1c0'); break;
    case 'spear': px.l(1, 11, 10, 2, '#fff1c0', 2); px.poly([[8, 1], [11, 1], [11, 4]], '#f2c14e'); break;
    case 'feather': case 'relic': case 'mana': case 'carving': case 'kete': case 'kumara': case 'glyph': px.x.drawImage(G.itemSprite(name).r, 0, 0, 16, 16, 0, 0, 12, 12); break;
  }
}, null);

/* ================= cutscene figures ================= */
G.figure = (kind) => G.sprite('fig:' + kind, 64, 48, px => {
  if (kind === 'rangi') { // sky father lying face down — stylised as a starry body
    px.ell(32, 22, 30, 9, '#1a2a5a'); px.ell(32, 20, 26, 6, '#2a3a7a'); px.circ(58, 18, 6, '#2a3a7a');
    for (let i = 0; i < 18; i++) px.p(6 + (i * 37) % 52, 16 + (i * 13) % 10, '#efe6d2');
  } else if (kind === 'papa') {
    px.ell(32, 26, 30, 9, '#3a2a1a'); px.ell(32, 28, 26, 6, '#4a6a2a'); px.circ(58, 28, 6, '#3a2a1a');
    for (let i = 0; i < 14; i++) px.l(6 + i * 4, 22, 5 + i * 4, 18 - (i % 3), '#5a8a3a');
  } else if (kind === 'person') {
    px.circ(32, 30, 3, '#5c3826'); px.l(32, 33, 32, 41, '#5c3826', 3); px.l(32, 41, 30, 47, '#5c3826', 2); px.l(32, 41, 34, 47, '#5c3826', 2); px.l(32, 35, 29, 40, '#5c3826', 2); px.l(32, 35, 35, 40, '#5c3826', 2);
  }
}, '#0b0708');
})();
