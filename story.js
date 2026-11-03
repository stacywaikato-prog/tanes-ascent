/* Tāne's Ascent — cutscenes, chapter cards, lore and ending */
(() => {
const G = window.G, PI = Math.PI;
const VW = 384, PH = 200;

/* ================= LORE (one carving per heaven, one in Toi-o-ngā-Rangi) ================= */
G.LORE = {
  1: { t: 'Te Kore and Te Pō', b: 'Before anything stood, there was Te Kore, the nothingness, and then Te Pō, the long night. Many whakapapa recite these ages of darkness before the world of light. Tāne descends from them.' },
  2: { t: 'Ranginui and Papatūānuku', b: 'The sky father and the earth mother lay clasped together. Their children were born and grew in the cramped dark between their bodies, with no room to stand.' },
  3: { t: 'The children of Rangi and Papa', b: 'Among the children were Tāne of the forests and birds, Tangaroa of the sea, Tūmatauenga of people and war, Rongo of cultivated food, Haumia-tiketike of wild food, Tāwhirimātea of the winds, and Whiro.' },
  4: { t: 'Tāwhirimātea', b: 'Not every child wanted the parents parted. Tāwhirimātea went with his father into the sky, and his storms still answer the separation. This heaven carries his anger.' },
  5: { t: 'The separation', b: 'Tāne lay on his back, set his feet against his father and his shoulders against his mother, and pushed until they parted. Light entered between them: Te Ao Mārama, the world of light.' },
  6: { t: 'Tāne-nui-a-Rangi', b: 'Tāne carries many names, each tied to a deed. As Tāne-mahuta he clothed his mother in forest. As Tāne-nui-a-Rangi he climbed to the heavens for knowledge.' },
  7: { t: 'The many heavens', b: 'The number of heavens and their names differ from iwi to iwi. Many tellings count twelve, with Toi-o-ngā-Rangi as the highest, and Matangireia as the house within it.' },
  8: { t: 'Io-Matua-Kore', b: 'Some traditions speak of Io-Matua-Kore, the parentless one, who dwells in the uppermost heaven and keeps the baskets. Other traditions do not include Io. Both are part of the wider story.' },
  9: { t: 'Whiro', b: 'Whiro was the elder brother. He claimed the baskets by right of birth and resented Tāne for parting their parents. In many tellings he withdraws to the underworld and sends sickness and misfortune from there.' },
  10: { t: 'Ngā Kete o te Wānanga', b: 'Te Kete Tuauri holds peace, love and all things good. Te Kete Tuatea holds warfare and mākutu, and the crafts of food, wood, stone and earth. Te Kete Aronui holds karakia, literature, philosophy and ritual. Tellings differ; this follows Timoti Kāretu.' },
  11: { t: 'Ngā Whatu-kura', b: 'With the baskets came two sacred stones, Te Whatu-kura Huka-a-tai and Te Whatu-kura Rehu-tai. They added mana to the knowledge and were kept with it.' },
  12: { t: 'The whare wānanga', b: 'The knowledge was taught in houses of learning. It was treated as tapu: learned carefully, held by those trained to carry it, and passed on with intent.' },
  13: { t: 'Walking into the future', b: 'Kia whakatōmuri te haere whakamua. I walk backwards into the future, with my eyes fixed on my past. Knowledge from those who came before lights the way ahead.' }
};

/* ================= CHAPTER CARDS ================= */
G.CHAPTER = {
  1: 'Light has entered the world, but the people do not yet know how to thrive. From Papatūānuku, Tāne begins the climb to the twelfth heaven, where the kete of knowledge wait.',
  2: 'Above the first forest grows a second, older one. The roots of the world reach up to meet him.',
  3: 'Tāne climbs into the clouds. Something ancient waits on the islands of mist: a guardian bound to Whiro.',
  4: 'The air turns. Tāwhirimātea never forgave the separation, and this heaven is his.',
  5: 'Gold light, still water, old carvings. The carvings already know Tāne’s name.',
  6: 'The moon rules this heaven, and the tide follows the moon. Its keeper tests all who climb.',
  7: 'Paths of stars hang over nothing. One wrong step falls forever.',
  8: 'The sky moves like a living cloak. Mana gathers in storms of colour.',
  9: 'Black vines, cold mist, creatures twisted out of shape. Whiro has taken hold here.',
  10: 'This heaven is breaking apart. Carved houses drift in pieces, and any handhold may give way.',
  11: 'Light and darkness are at war. Here, the generations of Te Pō that Tāne descends from wait to stand with him.',
  12: 'Gold light and open gates. Behind Tāne, Whiro’s darkness begins to rise.',
  13: 'Toi-o-ngā-Rangi, the twelfth heaven. The kete are close. So is Whiro.'
};

G.TIPS = [
  'Some walls can be climbed: slide down them, then jump off.',
  'Strike from behind for a critical hit.',
  'Swing your taiaha at an incoming bolt to knock it away.',
  'Hold light to charge a stronger bolt. It costs more mana.',
  'Run, then crouch to slide under low gaps. Tunnels hide relics.',
  'Roll through attacks. You cannot be hurt mid-roll.',
  'A heavy strike breaks a guard.',
  'Carved pou save your journey and restore your health.',
  'Pounamu raises your health. Feathers raise your mana.',
  'Every heaven hides one carving. Look high and look behind walls.',
  'Watch for the glow before a guardian strikes.',
  'Mana is your light and your strength. It returns slowly, and faster as you land blows.'
];

/* ================= CINEMATIC ENGINE ================= */
{ let down = 0; addEventListener('pointerdown', () => { down++; }, true); addEventListener('pointerup', () => { down = Math.max(0, down - 1); }, true); addEventListener('pointercancel', () => { down = 0; }, true); G.input.touchHeld = () => down > 0 && G.input.last === 'touch'; }
const C = G.Cine = { shots: [], i: 0, t: 0, done: null };
C.play = (shots, done) => { C.shots = shots; C.i = 0; C.t = 0; C.done = done; G.S.mode = 'cine'; };
C.update = () => {
  const s = C.shots[C.i]; if (!s) return; C.t++;
  if (s.sfx && C.t === 1) G.audio.sfx(s.sfx);
  if (s.text && C.t % 4 === 0 && C.t / 1.2 < s.text.length) G.audio.sfx('tick', .6);
  if (G.tap('pause') || G.tap('back')) { C.finish(); return; }
  if (s.hold) { // the separation, played: hold to push, in pulses; let go and the dark closes again
    const holding = G.btn('jump') || G.btn('attack') || G.btn('light') || G.btn('up') || (G.input.touchHeld && G.input.touchHeld());
    C.held = holding ? (C.held || 0) + 1 : 0;
    const pulse = .5 + .5 * Math.sin(C.t * .12);
    C.push = G.clamp((C.push || 0) + (holding ? .0014 + .0022 * pulse : -.003), 0, 1);
    if (holding && Math.floor(C.t) % 14 === 0) { G.shake && G.shake(1 + C.push * 3); if (navigator.getGamepads) { const gp = [...navigator.getGamepads()].find(Boolean); gp && gp.vibrationActuator && gp.vibrationActuator.playEffect && gp.vibrationActuator.playEffect('dual-rumble', { duration: 90, strongMagnitude: .3 + C.push * .6, weakMagnitude: .2 }).catch(() => {}); } }
    if (holding && C.t % 30 === 0) G.audio.sfx('heavy', .4 + C.push * .6);
    if (C.push >= 1) { C.push = 0; C.held = 0; G.audio.sfx('roar'); C.next(); }
    return;
  }
  if ((G.tap('ok') || G.tap('jump') || G.tap('attack')) && C.t > 25) { if (C.t < s.text.length * 1.2 + 10 && s.text) C.t = Math.max(C.t, s.text.length * 1.2 + 12); else C.next(); return; }
  if (C.t > s.dur) C.next();
};
C.next = () => { G.audio.sfx('select', .7); C.i++; C.t = 0; if (C.i >= C.shots.length) C.finish(); };
C.finish = () => { const d = C.done; C.shots = []; C.done = null; if (d) d(); };
C.draw = (ctx) => {
  const s = C.shots[C.i]; if (!s) return; const k = Math.min(1, C.t / s.dur);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, G.VH);
  s.draw(ctx, C.t, k);
  // letterbox
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, 18); ctx.fillRect(0, G.VH - 52, VW, 52);
  // fade in/out
  const fi = Math.min(1, C.t / 18), fo = Math.min(1, (s.dur - C.t) / 18), a = 1 - Math.min(fi, Math.max(0, fo));
  if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 18, VW, G.VH - 70); }
  if (s.title) G.txt(s.title, VW / 2, 34, { size: s.titleSize || 14, font: 'display', color: '#f2c14e', align: 'center', alpha: fi });
  if (s.text) { const n = Math.floor(C.t / 1.2); G.txt(s.text.slice(0, n), VW / 2, G.VH - 42, { size: 6.2, font: 'body', color: '#efe6d2', align: 'center', maxW: 330, lh: 9 }); }
  if (s.hold) { const pul = .55 + .45 * Math.sin(C.t * .15); G.txt(G.input.last === 'touch' ? 'Press and hold to push' : 'Hold ' + G.prompt('jump') + ' to push', VW / 2, G.VH - 18, { size: 6, font: 'display', color: '#f2c14e', align: 'center', alpha: C.t > 60 ? pul : 0 }); ctx.fillStyle = '#2a1a14'; ctx.fillRect(VW / 2 - 50, G.VH - 12, 100, 3); ctx.fillStyle = '#f2c14e'; ctx.fillRect(VW / 2 - 50, G.VH - 12, 100 * (C.push || 0), 3); return; }
  G.txt(G.input.last === 'touch' ? 'Tap to continue' : G.prompt('ok') + ': continue · ' + G.prompt('back') + ': skip', VW - 6, G.VH - 6, { size: 4, font: 'mono', color: '#8f7f70', align: 'right' });
  if (s.tip) G.txt('TIP  ' + s.tip, 8, G.VH - 6, { size: 4, font: 'mono', color: '#c2452a', maxW: 230 });
};

/* ================= DRAW HELPERS ================= */
const grad = (ctx, a, b, y0 = 18, y1 = 188) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, y0, VW, y1 - y0); };
const starsCache = Array.from({ length: 120 }, (_, i) => { const r = G.rng(i * 7 + 1); return [r() * VW, 18 + r() * 160, r()]; });
const drawStars = (ctx, a, t) => { for (const [x, y, s] of starsCache) { ctx.fillStyle = `rgba(239,230,210,${a * (.3 + .7 * Math.abs(Math.sin(t * .02 + s * 9)))})`; ctx.fillRect(x, y, s > .9 ? 2 : 1, 1); } };
function vignette(ctx, n, t, pan = 0) {
  const b = G.buildBiome(n); ctx.drawImage(b.skyC, 0, 18, VW, 170);
  const lay = (img, par, y) => { let ox = -((t * par + pan) % 512 + 512) % 512; for (let x = ox; x < VW; x += 512) ctx.drawImage(img, x, y); };
  lay(b.farC, .15, -2); lay(b.midC, .4, -10);
  ctx.fillStyle = '#060406'; ctx.fillRect(0, 168, VW, 22);
  ctx.beginPath(); ctx.moveTo(220, 190); ctx.lineTo(230, 166); ctx.lineTo(300, 160); ctx.lineTo(330, 190); ctx.fill();
  const sp = G.tane('idle', Math.floor(t / 10) % 4); ctx.drawImage(G.tint(sp.r, '#060406'), 252, 116);
}
function heavens(ctx, t, glow) {
  for (let i = 0; i < 12; i++) { const b = G.BIOMES[12 - i]; ctx.fillStyle = G.alpha(b.sky[1], .85); const y = 22 + i * 11; ctx.beginPath(); ctx.ellipse(VW / 2, y + 60, 190 - i * 4, 8, 0, 0, 7); ctx.fill(); }
  if (glow) G.glow(ctx, VW / 2, 30, 80, '#fff1c0', .6);
}
function whare(ctx, x, y, s, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 14 * s, y); ctx.lineTo(x - 14 * s, y - 10 * s); ctx.lineTo(x, y - 20 * s); ctx.lineTo(x + 14 * s, y - 10 * s); ctx.lineTo(x + 14 * s, y); ctx.fill(); ctx.fillStyle = '#b8361f'; ctx.fillRect(x - 15 * s, y - 11 * s, 2 * s, 2 * s); ctx.beginPath(); ctx.moveTo(x - 16 * s, y - 9 * s); ctx.lineTo(x, y - 21 * s); ctx.lineTo(x + 16 * s, y - 9 * s); ctx.lineWidth = 2; ctx.strokeStyle = '#b8361f'; ctx.stroke(); ctx.lineWidth = 1; }
function waka(ctx, x, y, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.quadraticCurveTo(x, y + 8, x + 26, y); ctx.lineTo(x + 30, y - 8); ctx.lineTo(x + 24, y - 1); ctx.lineTo(x - 24, y - 1); ctx.lineTo(x - 30, y - 10); ctx.fill(); for (let i = -3; i <= 3; i++) ctx.fillRect(x + i * 6, y - 7, 2, 6); }
const person = (ctx, x, y, c, k = 1) => { const sp = G.figure('person'); ctx.drawImage(G.tint(sp.r, c), x - 32 * k, y - 48 * k, 64 * k, 48 * k); };

/* ================= OPENING ================= */
G.opening = done => C.play([
  { dur: 300, text: 'Before the world of light, there was Te Pō, the long night.', draw: (ctx, t) => { grad(ctx, '#020104', '#08040c'); drawStars(ctx, .25, t); for (let i = 0; i < 3; i++) G.glow(ctx, 100 + i * 90 + Math.sin(t * .01 + i) * 20, 100, 40, '#2a1a3a', .3); } },
  { dur: 360, text: 'Ranginui, the sky, and Papatūānuku, the earth, lay clasped together. Their children lived in the cramped dark between them.', draw: (ctx, t) => {
    grad(ctx, '#05040a', '#0c0810'); const br = Math.sin(t * .03) * 1.5;
    ctx.drawImage(G.figure('rangi').r, 32, 50 + br, 320, 240 * .5); ctx.drawImage(G.figure('papa').r, 32, 92 - br, 320, 240 * .5);
    for (let i = 0; i < 6; i++) { const sp = G.tane(i % 2 ? 'crouch' : 'hang', 0); ctx.drawImage(G.tint(sp.r, '#2a1a12'), 70 + i * 42, 100, 24, 24); } } },
  { dur: 99999, hold: true, text: 'Tāne lay on his back, set his feet against his father, and pushed.', draw: (ctx, t) => {
    const k = G.clamp(C.push || 0, 0, 1), sh = (C.held ? (Math.random() - .5) * (1 + k * 3) : 0); ctx.save(); ctx.translate(sh, sh * .5);
    grad(ctx, '#05040a', G.mix('#0c0810', '#3a2a5a', k)); const lift = Math.pow(k, 1.6) * 70;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 18, VW, 170); ctx.clip();
    if (k > .3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, 80 - lift, 0, 130); g.addColorStop(0, `rgba(255,241,192,0)`); g.addColorStop(.5, `rgba(255,241,192,${(k - .3) * .9})`); g.addColorStop(1, 'rgba(255,241,192,0)'); ctx.fillStyle = g; ctx.fillRect(0, 70 - lift, VW, 80 + lift); ctx.restore(); }
    ctx.drawImage(G.figure('rangi').r, 32, 46 - lift, 320, 120); ctx.drawImage(G.figure('papa').r, 32, 100, 320, 120);
    const sp = G.tane('push', 0); ctx.drawImage(sp.r, 168, 82 - lift * .4, 48, 48);
    ctx.restore(); ctx.restore(); } },
  { dur: 300, text: 'Light flooded in. Te Ao Mārama, the world of light, had begun.', sfx: 'treasure', draw: (ctx, t, k) => {
    grad(ctx, G.mix('#fff6dc', '#4a8acc', k), G.mix('#ffffff', '#a8d070', k)); const b = G.buildBiome(2); ctx.globalAlpha = k; ctx.drawImage(b.farC, -60, -10); ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(255,255,255,${1 - k})`; ctx.fillRect(0, 18, VW, 170); } },
  { dur: 300, text: 'Ranginui grieved for Papatūānuku. His tears fell as rain, and still do.', draw: (ctx, t) => {
    grad(ctx, '#2a3a5a', '#5a7a8a'); ctx.fillStyle = '#2a3a2a'; ctx.fillRect(0, 150, VW, 40); ctx.fillStyle = 'rgba(200,220,255,.55)';
    for (let i = 0; i < 160; i++) { const r = G.rng(i * 3 + 1), x = (r() * VW + t * .6) % VW, y = 18 + ((r() * 170 + t * (3 + r() * 2)) % 170); ctx.fillRect(x, y, 1, 4); }
    const sp = G.tane('idle', Math.floor(t / 10) % 4); ctx.drawImage(G.tint(sp.r, '#0a0c14'), 168, 112); } },
  { dur: 330, text: 'People lived in the new world, but they did not yet have the knowledge to thrive.', draw: (ctx, t) => {
    grad(ctx, '#0a0e1e', '#1a1a2a'); drawStars(ctx, .7, t); ctx.fillStyle = '#05060a'; ctx.fillRect(0, 160, VW, 30);
    G.glow(ctx, 190, 156, 40 + Math.sin(t * .3) * 3, '#ff8a3a', .5); ctx.fillStyle = '#ffb060'; ctx.fillRect(188, 154, 4, 4);
    [150, 170, 210, 230].forEach((x, i) => person(ctx, x, 166, '#120c10', .7)); } },
  { dur: 360, text: 'Tāne learned that the treasures of knowledge were kept in the highest heaven. His brother Whiro meant to stop him.', draw: (ctx, t) => {
    grad(ctx, '#0a0820', '#2a1a3a'); heavens(ctx, t, true);
    const w = G.bossSprite('whiro', Math.floor(t / 8) % 4); ctx.globalAlpha = .7 + .2 * Math.sin(t * .05); ctx.drawImage(w.r, 300, 60, 72, 90); ctx.globalAlpha = 1;
    const sp = G.tane('victory', 0); ctx.drawImage(G.tint(sp.r, '#0a0610'), 60, 120, 64, 64); } },
  { dur: 260, title: "TĀNE'S ASCENT", titleSize: 22, text: 'Ngā Kete o te Wānanga', sfx: 'gate', draw: (ctx, t) => { vignette(ctx, 1, t); } }
], done);

/* ================= CHAPTER ================= */
G.chapter = (n, done) => {
  const b = G.buildBiome(n);
  const shots = [{ dur: 300, title: b.name.toUpperCase() + ' · ' + b.sub, text: G.CHAPTER[n], draw: (ctx, t) => vignette(ctx, n, t, n * 60) }];
  C.play(shots, done);
};

/* ================= ENDING ================= */
G.ending = done => {
  const tr = [['Te Kete Tuauri', 'Peace, love, and all things good.'], ['Te Kete Tuatea', 'Warfare and mākutu, and the crafts of food, wood, stone and earth.'], ['Te Kete Aronui', 'Karakia, literature, philosophy and ritual.']];
  const chamber = (ctx, t) => {
    grad(ctx, '#2a1a08', '#5a3a14');
    for (let i = 0; i < 6; i++) { const x = 30 + i * 66; ctx.fillStyle = '#3a2410'; ctx.fillRect(x, 40, 14, 150); for (let y = 46; y < 186; y += 9) { ctx.fillStyle = '#b8361f'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y + 5); ctx.lineTo(x + 14, y); ctx.fill(); ctx.fillStyle = '#efe6d2'; ctx.fillRect(x + 6, y + 1, 2, 2); } }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(VW / 2, 18, VW / 2, 188); g.addColorStop(0, 'rgba(255,241,192,.6)'); g.addColorStop(1, 'rgba(255,241,192,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(VW / 2 - 20, 18); ctx.lineTo(VW / 2 + 20, 18); ctx.lineTo(VW / 2 + 70, 188); ctx.lineTo(VW / 2 - 70, 188); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#1a0e04'; ctx.fillRect(0, 168, VW, 22);
  };
  const shots = [
    ...(G.pushShots ? G.pushShots(grad) : []),
    { dur: 300, text: 'Whiro withdrew into the dark below, and looked back up once, alone. In Matangireia, the house at the top of the heavens, Io-matua-kore gave Tāne the kete.', draw: (ctx, t, k) => { chamber(ctx, t); const sp = G.tane('walk', Math.floor(t / 5) % 8); ctx.drawImage(sp.r, 20 + k * 150, 124); } },
    ...tr.map(([name, text], i) => ({ dur: 280, title: name, text, sfx: 'relic', draw: (ctx, t, k) => {
      chamber(ctx, t); const sp = G.tane('collect', 0); ctx.drawImage(sp.r, 170, 124);
      const y = 40 + Math.min(1, k * 2) * 60; G.glow(ctx, VW / 2, y + 8, 40, '#f2c14e', .7); ctx.drawImage(G.itemSprite('kete').r, VW / 2 - 16, y - 8, 32, 32);
      for (let j = 0; j < i; j++) ctx.drawImage(G.itemSprite('kete').r, 120 + j * 22, 172, 16, 16); } })),
    { dur: 300, title: 'Ngā Whatu-kura', text: 'Te Whatu-kura Huka-a-tai and Te Whatu-kura Rehu-tai. Two sacred stones to add mana to all that was given.', sfx: 'treasure', draw: (ctx, t, k) => {
      chamber(ctx, t); const sp = G.tane('collect', 0); ctx.drawImage(sp.r, 170, 124);
      [['whatu1', -30], ['whatu2', 30]].forEach(([s, o]) => { const y = 50 + Math.min(1, k * 2) * 50; G.glow(ctx, VW / 2 + o, y + 8, 30, '#dde8ff', .6); ctx.drawImage(G.itemSprite(s).r, VW / 2 + o - 12, y - 4, 24, 24); });
      for (let j = 0; j < 3; j++) ctx.drawImage(G.itemSprite('kete').r, 120 + j * 22, 172, 16, 16); } },
    ...(G.homeShots ? G.homeShots(vignette) : []),
    { dur: 330, text: 'Knowledge spread out from the summit, down through every heaven, into the world below.', sfx: 'power', draw: (ctx, t, k) => {
      grad(ctx, '#0a0820', '#1a1030'); heavens(ctx, t, true);
      for (let i = 0; i < 5; i++) { const r = ((t * 1.4 + i * 60) % 300); ctx.strokeStyle = G.alpha('#fff1c0', Math.max(0, 1 - r / 300) * .8); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(VW / 2, 30, r, r * .35, 0, 0, 7); ctx.stroke(); } ctx.lineWidth = 1;
      ctx.fillStyle = '#1a2a14'; ctx.beginPath(); ctx.ellipse(VW / 2, 200, 240, 30, 0, 0, 7); ctx.fill(); } },
    { dur: 360, text: 'It was taught in the whare wānanga and carried by the people. Gardens grew. Waka crossed the ocean. Carvers told the stories in wood.', draw: (ctx, t, k) => {
      grad(ctx, '#f2a65a', '#ffe0a0'); G.glow(ctx, 300, 120, 70, '#ffffff', .6);
      ctx.fillStyle = '#3a6aa8'; ctx.fillRect(0, 150, VW, 40); waka(ctx, 320 - k * 40, 160, '#3a2010');
      ctx.fillStyle = '#4a6a2a'; ctx.fillRect(0, 140, 230, 50);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) { ctx.fillStyle = '#2e4a1a'; ctx.fillRect(16 + c * 12, 150 + r * 8, 6, 3); ctx.fillStyle = '#6aaa4a'; ctx.fillRect(18 + c * 12, 148 + r * 8, 2, 2); }
      whare(ctx, 160, 148, 1.6, '#5a341e'); person(ctx, 120, 152, '#2a180c', .8); person(ctx, 200, 152, '#2a180c', .8); person(ctx, 60, 152, '#2a180c', .7); } },
    { dur: 330, title: 'Kia whakatōmuri te haere whakamua', text: 'I walk backwards into the future, with my eyes fixed on my past.', sfx: 'gate', draw: (ctx, t, k) => {
      grad(ctx, G.mix('#2a1a3a', '#f2c14e', k), G.mix('#f2a65a', '#fff1c0', k)); G.glow(ctx, VW / 2, 170 - k * 40, 90, '#ffffff', .7);
      ctx.fillStyle = '#1a1008'; ctx.beginPath(); ctx.moveTo(0, 190); ctx.lineTo(0, 160); ctx.quadraticCurveTo(VW / 2, 140, VW, 165); ctx.lineTo(VW, 190); ctx.fill();
      const sp = G.tane('victory', 0); ctx.drawImage(G.tint(sp.r, '#1a1008'), VW / 2 - 24, 104); } }
  ];
  C.play(shots, () => G.credits(done));
};
G.credits = done => {
  const lines = [
    ['display', 14, "TĀNE'S ASCENT"], ['body', 7, 'Ngā Kete o te Wānanga'], ['gap'],
    ['mono', 5, 'A GAME BY'], ['display', 10, 'Stacy'], ['gap'],
    ['mono', 5, 'STORY'], ['body', 6, 'The journey of Tāne-nui-a-Rangi to the uppermost heaven,'], ['body', 6, 'as it is told, in many forms, across Aotearoa.'], ['gap'],
    ['mono', 5, 'DESIGN, CODE, PIXEL ART AND SOUND'], ['body', 6, "Generated with Claude from Stacy's brief"], ['gap'],
    ['mono', 5, 'A NOTE ON THE STORY'], ['body', 6, 'Tellings, names, and the number of heavens differ between iwi.'], ['body', 6, 'This game follows a common outline and claims no single authority.'], ['body', 6, 'Tradition says each heaven held its own tests. The tests in this game are imagined.'], ['body', 6, 'Seek out the people who hold these stories.'], ['gap'],
    
    ['mono', 5, 'COLLECTED'], ['body', 6, `${G.S.feathers} feathers · ${G.S.relics} greenstone relics · ${G.S.lore.length} of 13 carvings`], ['gap'], ['gap'],
    ['display', 12, 'Ngā mihi']
  ];
  C.play([{ dur: 1500, draw: (ctx, t) => {
    grad(ctx, '#05030a', '#140a1a', 0, G.VH); drawStars(ctx, .8, t); G.glow(ctx, VW / 2, 0, 120, '#f2c14e', .15);
    let y = G.VH + 10 - t * .35;
    for (const [f, s, txt] of lines) { if (f === 'gap') { y += 12; continue; } if (y > -10 && y < G.VH + 10) G.txt(txt, VW / 2, y, { size: s, font: f, color: f === 'mono' ? '#c2452a' : f === 'display' ? '#f2c14e' : '#efe6d2', align: 'center' }); y += s * 1.6 + 4; }
  } }], done);
};

/* ================= LORE BOOK ================= */
G.drawLoreIllustration = (ctx, n, x, y, w, h, t) => {
  const b = G.buildBiome(Math.min(13, n)); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(b.skyC, x, y, w, h); ctx.drawImage(b.farC, x - (t * .2 % 200), y - 20, 512 * (h / 160), 200 * (h / 160)); ctx.drawImage(b.midC, x - (t * .4 % 200), y - 10, 512 * (h / 160), 200 * (h / 160));
  ctx.restore(); ctx.strokeStyle = '#c2452a'; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
};
})();
