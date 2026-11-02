// Pixel characters for "Perseus": one parametric humanoid (3/4 view facing right) + a few special sprites.
// Every pose is a table entry; atlases are built once; billboards take scene light and cast cut-out shadows.
import * as THREE from 'three';
import { PX, ramp, hex, h2, texOf, billboard, blob } from './px.js';

export const SPX = 1 / 30;           // sprite pixel → metres
const FW = 40, FH = 60;
const INK = hex('#1a1016');
const R = (cols) => ramp(cols, .22);

// —— Palettes ——
const PAL = {
  skin: R(['#8a5440', '#b97a5c', '#dca07c', '#f2c6a0']),
  skinOld: R(['#7a5040', '#a87760', '#cf9f84', '#e8c2a8']),
  green: R(['#1c3a2c', '#2f6048', '#4f8a62', '#7dbb84', '#b4e8a8']),
  hairDk: R(['#140c0c', '#2a1814', '#45281c', '#5e3a26']),
  hairBr: R(['#2a1610', '#4f2c1a', '#74452a', '#9a6640']),
  white: R(['#7c7a86', '#a8a6b0', '#d4d2d8', '#f4f2f6']),
  crimson: R(['#3a0810', '#640e18', '#981a22', '#c42a2c', '#e8503c']),
  cream: R(['#6e5c42', '#a08a66', '#cbb68e', '#ebdcb6']),
  bronze: R(['#3a220c', '#6e4618', '#a8702a', '#d8a448', '#f4d47c']),
  purple: R(['#1c0c24', '#36163e', '#55245c', '#743a78', '#94589a']),
  gold: R(['#4a3008', '#8a6214', '#c89a28', '#f0cc58', '#fff0a8']),
  blueP: R(['#283246', '#3e4c68', '#5a6c8c', '#8094b2', '#aabcd4']),
  sky: R(['#2c4a6a', '#40688c', '#5c88ac', '#88b0cc', '#b4d4e6']),
  brown: R(['#24160e', '#3e2818', '#5c3e26', '#7c5838', '#9c7650']),
  steel: R(['#2a2c34', '#484c58', '#6c7280', '#9aa0ac', '#d0d4dc']),
  stone: R(['#3a3a40', '#55555c', '#727278', '#909096', '#b0b0b4']),
  boot: R(['#1a100c', '#2e1d15', '#4a3022']),
  wing: R(['#8a96a8', '#c4ccd8', '#eef2f8', '#ffffff']),
  pink: R(['#5a2a3a', '#8a4058', '#b8607a', '#e090a4']),
};

// Look definitions
const LOOKS = {
  perseus: { skin: 'skin', hair: 'hairDk', body: 'cream', cloak: 'crimson', belt: 'brown', short: true, hairStyle: 'short' },
  perseusG: { skin: 'skin', hair: 'hairDk', body: 'cream', cloak: 'crimson', belt: 'brown', short: true, hairStyle: 'short', helm: 'bronze', wings: true, shield: true, harpe: true },
  danae: { skin: 'skin', hair: 'hairBr', body: 'sky', cloak: 'white', belt: 'gold', long: true, hairStyle: 'long', veil: 'white' },
  polydectes: { skin: 'skin', hair: 'hairDk', body: 'purple', cloak: 'purple', belt: 'gold', long: true, hairStyle: 'short', beard: 'hairDk', crown: true, wide: 2 },
  hermes: { skin: 'skin', hair: 'hairBr', body: 'white', cloak: 'gold', belt: 'gold', short: true, hairStyle: 'short', wingCap: true, wings: true, staff: 'gold' },
  athena: { skin: 'skin', hair: 'hairBr', body: 'blueP', cloak: 'white', belt: 'gold', long: true, hairStyle: 'long', helm: 'steel', crest: true, spear: true },
  andromeda: { skin: 'skin', hair: 'hairBr', body: 'white', cloak: 'pink', belt: 'gold', long: true, hairStyle: 'long' },
  acrisius: { skin: 'skinOld', hair: 'white', body: 'brown', cloak: 'brown', belt: 'gold', long: true, hairStyle: 'short', beard: 'white', crown: true },
  medusa: { skin: 'green', hair: 'green', body: 'brown', cloak: 'green', belt: 'gold', long: true, hairStyle: 'snakes', glowEyes: true },
  crowdA: { skin: 'skin', hair: 'hairDk', body: 'cream', cloak: 'sky', belt: 'brown', long: true, hairStyle: 'short' },
  crowdB: { skin: 'skinOld', hair: 'hairBr', body: 'white', cloak: 'brown', belt: 'brown', long: true, hairStyle: 'long' },
  crowdC: { skin: 'skin', hair: 'hairBr', body: 'pink', cloak: 'cream', belt: 'brown', long: true, hairStyle: 'short' },
};

// p: { step 0..3 | null, bob, arm: 'low'|'fwd'|'up'|'hold'|'strike'|'shieldUp'|'point'|'hug'|'throw'|'back'|'chain'|'sit', look:0..2, blink, kneel, fall, wig, mouth }
function drawHuman(P, E, L, p) {
  const C = k => PAL[L[k]];
  const sk = C('skin'), hr = C('hair'), bd = C('body'), ck = C('cloak');
  const wd = L.wide || 0, by = (p.bob || 0) + (p.kneel ? 8 : 0) + (p.sit ? 6 : 0);
  const hx = 19, hy = 15 + by;
  const top = 22 + by, bot = L.long ? 52 : 44;
  // —— cloak back panel (behind body) ——
  if (L.cloak && !L.long) P.poly([[12 - wd, top], [22, top], [24 + (p.hem || 0), 47], [9 - wd - (p.hem || 0), 47]], (x, y) => C('cloak')(.5 - (x - 9) * .02 + ((x + (y >> 2)) % 5 === 0 ? -.15 : 0), x, y));
  // —— legs ——
  if (!p.kneel && !p.sit && !L.long) {
    const st = p.step ?? -1;
    const legs = st < 0 ? [[15, 0], [20, 0]] : [[[13, 0], [22, -1]], [[16, -1], [19, 0]], [[22, -1], [13, 0]], [[19, 0], [16, -1]]][st];
    legs.forEach(([lx, ly], i) => {
      for (let y = 44; y < 57 + ly; y++) for (let x = lx; x < lx + 4; x++) P.set(x, y, sk(.55 - (x === lx ? .2 : 0) - (i ? 0 : .12), x, y));
      if (L.wings) { P.rect(lx, 54 + ly, 5, 3, PAL.cream(.6, 0, 0)); P.set(lx - 1, 52 + ly, PAL.wing(.9, 0, 0)); P.set(lx - 2, 51 + ly, PAL.wing(.7, 0, 0)); P.set(lx - 1, 51 + ly, PAL.wing(.95, 0, 0));  }
      else P.rect(lx, 56 + ly, 5, 2, PAL.boot(.4, 0, 0));
    });
  }
  if (L.long && !p.kneel && !p.sit) { const st = p.step ?? -1; const f = st < 0 ? 0 : [1, 0, -1, 0][st]; P.rect(15 + f, 55, 4, 3, PAL.boot(.5, 0, 0)); P.rect(20 - f, 55, 4, 3, PAL.boot(.3, 0, 0)); }
  // —— body: tunic or long robe ——
  const shL = 13 - wd, shR = 25 + wd, hmL = (L.long ? 11 : 13) - wd - (p.hem || 0) * .5, hmR = (L.long ? 27 : 26) + wd + (p.hem || 0) * .5;
  const bb = p.kneel ? 54 : p.sit ? 50 : bot;
  P.poly([[shL, top], [shR, top], [hmR, bb], [hmL, bb]], (x, y) => {
    const u = (y - top) / (bb - top), l = hmL * u + shL * (1 - u), r = hmR * u + shR * (1 - u), s = (x - l) / Math.max(1, r - l);
    let v = .7 - s * .45 + (1 - u) * .1; if ((x * 3 + y) % 7 === 0 && u > .3) v -= .14; return bd(v, x, y);
  });
  // belt
  P.rect(shL + 1, top + 10, shR - shL - 1, 2, C('belt')(.7, 0, 0)); P.set(21, top + 10, PAL.gold(.95, 0, 0));
  // cloak over the shoulder (front, left side of sprite = back)
  if (L.cloak) P.poly([[shL - 1, top - 1], [shL + (L.long ? 5 : 6), top - 1], [shL + 3, L.long ? bb : 48], [shL - 4 - (p.hem || 0), L.long ? bb : 49]], (x, y) => ck(.55 - (y - top) * .006 + ((x + y) % 6 === 0 ? -.15 : 0), x, y));
  if (L.cloak && !L.long) { P.rect(shL - 1, top - 1, 9, 3, ck(.75, 0, 0)); P.set(shL + 7, top + 1, PAL.gold(.9, 0, 0)); }
  if (L.veil) P.poly([[hx - 7, hy - 6], [hx + 1, hy - 8], [hx - 1, top + 12], [hx - 9, top + 14]], (x, y) => C('veil')(.6 + (x - hx) * .03, x, y));
  // —— head ——
  const fx = hx + 1 + (p.look === 1 ? 0 : 0), fy = hy + (p.look === 2 ? 1 : 0);
  // hair back
  if (L.hairStyle === 'long') P.poly([[hx - 7, hy - 4], [hx + 1, hy - 7], [hx - 2, top + 9], [hx - 8, top + 8]], (x, y) => hr(.45 + (x - hx) * .04, x, y));
  if (L.hairStyle === 'snakes') {
    const w = p.wig || 0;
    for (let k = 0; k < 9; k++) { const a = -2.6 + k * .55, len = 7 + (k % 3) * 2; let x = fx + Math.cos(a) * 5, y = fy - 1 + Math.sin(a) * 5;
      for (let s = 0; s < len; s++) { const ph = Math.sin(s * .9 + k * 1.7 + w * Math.PI); x += Math.cos(a) * .9 + Math.cos(a + 1.57) * ph * .7; y += Math.sin(a) * .9 + Math.sin(a + 1.57) * ph * .7; P.set(Math.round(x), Math.round(y), PAL.green(.35 + (s / len) * .4, k, s)); P.set(Math.round(x) + 1, Math.round(y), PAL.green(.2, 0, 0)); }
      P.set(Math.round(x), Math.round(y), PAL.green(.95, 0, 0)); if (E) E.set(Math.round(x), Math.round(y), PAL.green(.6, 0, 0)); }
  }
  P.ellipse(fx, fy, 5.2, 5.6, (x, y, dx, dy) => sk(.62 - dx * .12 - dy * .25 + (dx > .6 ? -.18 : 0), x, y));
  // hair top / fringe
  if (L.hairStyle === 'short' || L.hairStyle === 'long') {
    P.ellipse(fx - 1, fy - 3, 5.6, 3.6, (x, y, dx, dy) => (dy < .3 ? hr(.5 - dx * .1 - dy * .2, x, y) : null));
    for (let y = Math.floor(fy - 3); y < fy + 3; y++) P.set(Math.floor(fx - 5), y, hr(.3, 0, y));
  }
  if (L.beard) { P.poly([[fx - 3, fy + 1], [fx + 5, fy + 1], [fx + 4, fy + 6], [fx + 1, fy + 9], [fx - 3, fy + 6]], (x, y) => C('beard')(.6 - (y - fy) * .03 + ((x + y) % 4 === 0 ? -.15 : 0), x, y)); }
  // eyes
  const ey = Math.round(fy);
  if (L.glowEyes) { const c = p.blink ? PAL.green(.3, 0, 0) : hex('#e8ffb0'); for (const ex of [fx + 2, fx - 1]) { P.set(Math.round(ex), ey, c); P.set(Math.round(ex), ey - 1, c); if (E && !p.blink) { E.set(Math.round(ex), ey, c); E.set(Math.round(ex), ey - 1, c); } } }
  else if (p.blink || p.closed) { P.set(Math.round(fx + 2), ey, sk(.2, 0, 0)); P.set(Math.round(fx - 1), ey, sk(.2, 0, 0)); }
  else { for (const ex of [fx + 2, fx - 1]) { P.set(Math.round(ex), ey, INK); P.set(Math.round(ex), ey - 1, INK); } }
  P.set(Math.round(fx + 5), ey + 1, sk(.4, 0, 0));
  if (p.mouth) P.rect(Math.round(fx + 2), ey + 3, 2, 1, hex('#5a1a1a'));
  // headgear
  if (L.helm) { const H = C('helm'); P.ellipse(fx - .5, fy - 3.5, 6, 3.8, (x, y, dx, dy) => (dy < .45 ? H(.7 - dx * .2 - dy * .3, x, y) : null)); P.rect(Math.round(fx - 6), Math.round(fy - 1), 4, 4, H(.4, 0, 0));
    if (L.crest) for (let i = 0; i < 9; i++) { P.set(Math.round(fx - 4 + i), Math.round(fy - 8 - Math.sin(i / 8 * Math.PI) * 3), PAL.crimson(.7, 0, 0)); P.set(Math.round(fx - 4 + i), Math.round(fy - 7 - Math.sin(i / 8 * Math.PI) * 3), PAL.crimson(.4, 0, 0)); }
    if (L.wings) { P.set(Math.round(fx - 5), Math.round(fy - 6), PAL.wing(.9, 0, 0)); P.set(Math.round(fx - 6), Math.round(fy - 7), PAL.wing(.8, 0, 0)); P.set(Math.round(fx - 7), Math.round(fy - 7), PAL.wing(.6, 0, 0)); } }
  if (L.wingCap) { P.ellipse(fx - .5, fy - 4, 6.5, 3, (x, y, dx, dy) => PAL.gold(.65 - dy * .3, x, y)); for (let i = 0; i < 4; i++) { P.set(Math.round(fx - 6 - i), Math.round(fy - 5 - i), PAL.wing(.9 - i * .1, 0, 0)); P.set(Math.round(fx - 6 - i), Math.round(fy - 4 - i), PAL.wing(.6, 0, 0)); } }
  if (L.crown) { for (let i = 0; i < 9; i++) { P.set(Math.round(fx - 4 + i), Math.round(fy - 6), PAL.gold(.8, 0, 0)); if (i % 2 === 0) P.set(Math.round(fx - 4 + i), Math.round(fy - 7), PAL.gold(.95, 0, 0)); if (E) E.set(Math.round(fx - 4 + i), Math.round(fy - 6), PAL.gold(.4, 0, 0)); } }
  // —— arms & held things ——
  const arm = p.arm || 'low', sleeve = (pts, k = .55) => pts.forEach(([x, y]) => { P.set(x, y, sk(k + .05, x, y)); P.set(x, y + 1, sk(k - .2, x, y)); });
  const hand = (x, y) => P.rect(x, y, 2, 2, sk(.7, 0, 0));
  if (arm === 'low') { sleeve([[24, top + 2], [25, top + 4], [25, top + 6], [25, top + 8], [25, top + 10]]); hand(25, top + 12); }
  if (arm === 'fwd' || arm === 'point') { sleeve([[24, top + 2], [26, top + 3], [28, top + 4], [30, top + 4]]); hand(32, top + 3); if (arm === 'point') P.set(34, top + 3, sk(.7, 0, 0)); }
  if (arm === 'up' || arm === 'hold') { sleeve([[24, top + 1], [25, top - 1], [26, top - 3], [27, top - 5], [27, top - 7]]); hand(27, top - 10);
    if (arm === 'hold') {   // the gorgon's head held high: snakes + glowing eyes
      const cx = 28, cy = top - 15; P.ellipse(cx, cy, 3.5, 3.6, (x, y, dx, dy) => PAL.green(.6 - dy * .2, x, y));
      for (let k = 0; k < 6; k++) { const a = -2.8 + k * .55; P.set(Math.round(cx + Math.cos(a) * 4.5), Math.round(cy + Math.sin(a) * 4.5), PAL.green(.85, 0, 0)); P.set(Math.round(cx + Math.cos(a) * 5.5), Math.round(cy + Math.sin(a) * 5.5 - 1), PAL.green(.95, 0, 0)); }
      for (const ex of [cx + 1, cx - 1]) { P.set(ex, cy, hex('#eaffb8')); if (E) E.set(ex, cy, hex('#eaffb8')); }
    } }
  if (arm === 'strike') {   // sword swung down-forward
    sleeve([[24, top + 2], [26, top + 2], [28, top + 1], [30, top]]); hand(32, top - 1);
    if (L.harpe) { P.line(33, top - 1, 37, top - 9, PAL.steel(.9, 0, 0)); P.line(34, top - 1, 38, top - 8, PAL.steel(.6, 0, 0)); P.line(37, top - 9, 34, top - 12, PAL.steel(.95, 0, 0)); if (E) { P.line(33, top - 1, 37, top - 9, hex('#ffffff')); E.line(33, top - 1, 37, top - 9, hex('#d0e8ff')); } }
  }
  if (arm === 'throw0') { sleeve([[22, top + 2], [20, top + 4], [18, top + 6], [16, top + 7]]); hand(13, top + 7); P.ellipse(12, top + 6, 2.6, 1.4, PAL.bronze(.8, 0, 0)); }
  if (arm === 'throw1') { sleeve([[24, top + 1], [26, top], [28, top - 1], [30, top - 2]]); hand(32, top - 3); }
  if (arm === 'hug') {   // holding a baby bundle in front of the chest
    P.ellipse(25, top + 7, 4.5, 3.4, (x, y, dx, dy) => PAL.white(.75 - dy * .2, x, y)); P.ellipse(27.5, top + 5.5, 1.8, 1.8, sk(.7, 0, 0));
    sleeve([[24, top + 3], [23, top + 6], [24, top + 9]]); hand(26, top + 9);
  }
  if (arm === 'chain') { P.set(12, top + 3, sk(.4, 0, 0)); P.set(26, top + 3, sk(.5, 0, 0)); for (let i = 0; i < 4; i++) { P.set(11 - i, top + 2 - i, PAL.steel(.7, 0, 0)); P.set(27 + i, top + 2 - i, PAL.steel(.7, 0, 0)); } }
  if (arm === 'sit') { sleeve([[24, top + 2], [25, top + 4], [26, top + 6]]); hand(27, top + 7); }
  if (arm === 'shieldUp') { // look down into the shield held low in front: lines the reflection
    sleeve([[24, top + 3], [26, top + 5], [27, top + 7]]);
  }
  // shield (on the near arm side), drawn last so it overlaps
  if (L.shield) {
    const sx = arm === 'shieldUp' ? 29 : 11, sy = arm === 'shieldUp' ? top + 9 : top + 9, rx = arm === 'shieldUp' ? 6 : 5, ry = arm === 'shieldUp' ? 4 : 7;
    P.ellipse(sx, sy, rx, ry, (x, y, dx, dy) => { const r = Math.hypot(dx, dy); if (r > .8) return PAL.bronze(.45 - dy * .15, x, y); const c = PAL.bronze(.75 + dx * .15 - dy * .2, x, y); return c; });
    if (E && p.reflect) E.ellipse(sx, sy, rx * .55, ry * .55, hex('#3a7044'));
    if (p.reflect) P.ellipse(sx, sy, rx * .55, ry * .55, hex(p.reflect));
    P.set(Math.round(sx - rx * .3), Math.round(sy - ry * .4), hex('#fff4c8')); if (E) E.set(Math.round(sx - rx * .3), Math.round(sy - ry * .4), hex('#a08040'));
  }
  if (L.harpe && arm !== 'strike') { P.line(9 + 18, top + 12, 27, top + 18, PAL.brown(.5, 0, 0)); P.line(27, top + 18, 29, top + 22, PAL.steel(.85, 0, 0)); P.line(29, top + 22, 27, top + 25, PAL.steel(.95, 0, 0)); }
  if (L.staff && arm === 'low') { P.line(27, top - 6, 27, 57, PAL.gold(.75, 0, 0)); P.set(26, top - 7, PAL.wing(.95, 0, 0)); P.set(28, top - 7, PAL.wing(.95, 0, 0)); if (E) E.set(27, top - 6, PAL.gold(.9, 0, 0)); }
  if (L.spear && arm === 'low') { P.line(29, 3, 29, 57, PAL.brown(.6, 0, 0)); P.line(29, 3, 29, 7, PAL.steel(.95, 0, 0)); P.set(28, 6, PAL.steel(.8, 0, 0)); P.set(30, 6, PAL.steel(.8, 0, 0)); }
}

function drawFallen(P, E, L, p) {   // lying on the ground, head to the right (rotated sprite)
  const tmp = new PX(FW, FH), te = new PX(FW, FH); drawHuman(tmp, te, L, { arm: 'low', closed: 1 });
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = tmp.get(x, y); if (!c) continue; const nx = FH - 1 - y - 14, ny = 52 + Math.round(x / 3); P.set(nx, ny, c); }
}

// —— Pose tables ——
const BASE = { idle0: { arm: 'low' }, idle1: { arm: 'low', bob: 1 }, blink: { arm: 'low', blink: 1 },
  w0: { step: 0, hem: 1 }, w1: { step: 1, bob: -1 }, w2: { step: 2, hem: -1 }, w3: { step: 3, bob: -1 } };
const POSES = {
  perseus: { ...BASE, fwd: { arm: 'fwd' }, kneel: { kneel: 1, arm: 'low' }, throw0: { arm: 'throw0', bob: 1 }, throw1: { arm: 'throw1', step: 0 }, look: { arm: 'low', look: 2 } },
  perseusG: { ...BASE, shieldUp: { arm: 'shieldUp', look: 2 }, shieldUpR: { arm: 'shieldUp', look: 2, reflect: '#9cf0a0' }, strike: { arm: 'strike', step: 0 }, hold: { arm: 'hold' }, hold1: { arm: 'hold', bob: 1 }, fwd: { arm: 'fwd' } },
  danae: { idle0: { arm: 'hug' }, idle1: { arm: 'hug', bob: 1 }, blink: { arm: 'hug', blink: 1 }, kneel: { kneel: 1, arm: 'hug' } },
  polydectes: { idle0: { arm: 'low' }, idle1: { arm: 'low', bob: 1 }, blink: { arm: 'low', blink: 1 }, point: { arm: 'point', mouth: 1 }, point1: { arm: 'point' } },
  hermes: { idle0: { arm: 'low' }, idle1: { arm: 'low', bob: 1 }, give: { arm: 'fwd' } },
  athena: { idle0: { arm: 'low' }, idle1: { arm: 'low', bob: 1 }, give: { arm: 'fwd' } },
  andromeda: { chain: { arm: 'chain' }, chain1: { arm: 'chain', bob: 1 }, idle0: { arm: 'low' }, idle1: { arm: 'low', bob: 1 }, blink: { arm: 'low', blink: 1 } },
  acrisius: { sit: { sit: 1, arm: 'sit' }, sit1: { sit: 1, arm: 'sit', bob: 1 }, fall: { fall: 1 } },
  medusa: { idle0: { arm: 'low', wig: 0 }, idle1: { arm: 'low', wig: 1, bob: 1 }, hiss: { arm: 'fwd', wig: .5, mouth: 1 }, blink: { arm: 'low', blink: 1, wig: 1 } },
  crowdA: { sit: { sit: 1, arm: 'sit' }, sit1: { sit: 1, arm: 'sit', bob: 1 }, cheer: { sit: 1, arm: 'up' } },
  crowdB: { sit: { sit: 1, arm: 'sit' }, sit1: { sit: 1, arm: 'sit', bob: 1 }, cheer: { sit: 1, arm: 'up' } },
  crowdC: { sit: { sit: 1, arm: 'sit' }, sit1: { sit: 1, arm: 'sit', bob: 1 }, cheer: { sit: 1, arm: 'up' } },
};

function stoneify(c) { const l = (c[0] * .3 + c[1] * .55 + c[2] * .15) / 255; const v = Math.round(70 + l * 120); return [v, v, v + 4, c[3]]; }

const _atlas = {};
function atlas(kind, o = {}) {
  const key = kind + (o.stone ? ':stone' : '');
  if (_atlas[key]) return _atlas[key];
  const L = LOOKS[kind], T = POSES[kind], names = Object.keys(T), n = names.length;
  const P = new PX(FW * n, FH), E = new PX(FW * n, FH);
  names.forEach((k, i) => {
    const p1 = new PX(FW, FH), e1 = new PX(FW, FH);
    if (T[k].fall) drawFallen(p1, e1, L, T[k]); else drawHuman(p1, e1, L, T[k]);
    p1.outline(.3);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { let c = p1.get(x, y); if (c) P.set(i * FW + x, y, o.stone ? stoneify(c) : c); const e = e1.get(x, y); if (e && !o.stone) E.set(i * FW + x, y, e); }
  });
  const tex = texOf(P.done()), em = texOf(E.done());
  for (const t of [tex, em]) t.repeat.set(1 / n, 1);
  return (_atlas[key] = { tex, em, names, n });
}

export function makeChar(kind, o = {}) {
  const A = atlas(kind, o), sc = o.scale ?? 1;
  const mesh = billboard(A.tex, FW * SPX * sc, FH * SPX * sc, { em: A.em, emCol: '#ffffff', emI: o.emI ?? 1.6 });
  const root = new THREE.Group(); root.add(mesh); root.userData.char = o.track ? 'hero' : kind;
  const sh = blob(.42 * sc, .55); sh.position.y = .015; root.add(sh);
  let stone = null;
  return {
    root, mesh, shadowBlob: sh, A,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error(kind + ' frame ' + name); A.tex.offset.x = A.em.offset.x = i / A.n; if (stone) stone.tex.offset.x = i / stone.n; this._f = name; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
    // swap to the petrified atlas (same frames); k: 0..1 hard switch at .5 (palette swap, never alpha)
    petrify(on) { if (on && !stone) { stone = atlas(kind, { stone: 1 }); } const m = mesh.material; m.map = on ? stone.tex : A.tex; m.emissiveMap = on ? null : A.em; m.emissive.set(on ? '#000000' : '#ffffff'); m.needsUpdate = true; if (on) stone.tex.offset.x = A.tex.offset.x; },
    // world position of a sprite pixel
    px(x, y, flip = false) { const v = new THREE.Vector3((x - FW / 2) * SPX * sc * (flip ? -1 : 1), (FH - y) * SPX * sc, .06); v.applyAxisAngle(new THREE.Vector3(0, 1, 0), root.rotation.y); return v.add(root.position); },
  };
}

// —— Special sprites ——
function spriteMesh(draw, w, h, o = {}) {
  const P = new PX(w, h), E = new PX(w, h); draw(P, E); P.outline(.3);
  return billboard(texOf(P.done()), w * SPX * (o.scale ?? 1), h * SPX * (o.scale ?? 1), { em: texOf(E.done()), emCol: '#ffffff', emI: o.emI ?? 1.5 });
}
// Pegasus: white winged horse, rearing, glowing
export function pegasus(o = {}) {
  return spriteMesh((P, E) => {
    const W = PAL.wing, w = (x, y, v) => { P.set(x, y, W(v, x, y)); E.set(x, y, W(v * .55, x, y)); };
    P.ellipse(30, 36, 14, 7, (x, y, dx, dy) => W(.75 - dy * .3 - dx * .1, x, y)); E.ellipse(30, 36, 14, 7, (x, y, dx, dy) => W(.4 - dy * .2, x, y));
    // neck + head (rearing up to the right)
    P.poly([[38, 32], [44, 18], [49, 16], [52, 20], [46, 24], [43, 36]], (x, y) => W(.8 - (y - 16) * .01, x, y));
    P.poly([[47, 14], [56, 17], [55, 21], [49, 20]], (x, y) => W(.85, x, y)); P.set(52, 17, INK); P.set(48, 13, W(.6, 0, 0));
    for (let i = 0; i < 6; i++) P.set(42 - i, 18 + i * 2, PAL.gold(.8, 0, 0));   // mane
    // legs (front raised)
    for (const [x0, y0, x1, y1] of [[22, 41, 20, 54], [26, 42, 26, 55], [40, 38, 47, 44], [42, 40, 49, 47]]) { P.line(x0, y0, x1, y1, W(.65, 0, 0)); P.line(x0 + 1, y0, x1 + 1, y1, W(.45, 0, 0)); }
    // wings up
    for (let k = 0; k < 7; k++) { const L = 16 + k * 2; for (let s = 0; s < L; s++) w(Math.round(26 + k * 2 - s * .45), Math.round(32 - s * 1.05 + k * .3), .95 - s / L * .35); }
    // tail
    for (let s = 0; s < 10; s++) P.set(16 - s, 34 + Math.round(Math.sin(s * .6) * 2), PAL.gold(.7, 0, 0));
  }, 60, 60, o);
}
// Cetus: sea serpent head + neck rising from the water
export function cetusSprite(stone = false, o = {}) {
  return spriteMesh((P, E) => {
    const G = stone ? PAL.stone : R(['#0e1c28', '#183246', '#244a62', '#386a80', '#5a8c9c']), B = stone ? PAL.stone : R(['#5a5038', '#8a7a52', '#b4a070']);
    P.poly([[10, 96], [20, 50], [30, 30], [44, 22], [58, 24], [60, 34], [44, 40], [36, 60], [34, 96]], (x, y) => { let v = .55 - (x - 10) * .004 + ((y >> 2) % 3 === 0 ? -.12 : 0); return G(v, x, y); });
    for (let y = 44; y < 96; y += 4) P.rect(30 - Math.round((y - 44) * .1), y, 4, 2, B(.6, 0, 0));
    // jaw
    P.poly([[44, 34], [70, 30], [72, 34], [50, 42]], (x, y) => G(.7, x, y)); for (let i = 0; i < 6; i++) P.set(50 + i * 3, 33, hex(stone ? '#c0c0c0' : '#f0f0e0'));
    // fins
    for (let i = 0; i < 8; i++) P.line(24 - i, 40 + i * 6, 16 - i * 2, 38 + i * 6, G(.85, 0, 0));
    // eye
    if (!stone) { P.set(52, 27, hex('#ffd060')); P.set(53, 27, hex('#ffd060')); E.set(52, 27, hex('#ffd060')); E.set(53, 27, hex('#ffd060')); } else P.set(52, 27, hex('#505056'));
  }, 80, 96, o);
}
// Loot icons (16×16): sandals, helmet, sickle, shield, bag; a discus; the chest
export const ICONS = {
  sandals: (P) => { const W = PAL.wing, B = PAL.brown; P.rect(3, 10, 7, 3, B(.6, 0, 0)); P.rect(3, 12, 8, 1, B(.3, 0, 0)); for (let i = 0; i < 4; i++) { P.set(2 - (i >> 1), 9 - i, W(.95, 0, 0)); P.set(3 - (i >> 1), 9 - i, W(.7, 0, 0)); } P.rect(8, 5, 6, 3, B(.7, 0, 0)); for (let i = 0; i < 3; i++) P.set(13 + (i >> 1), 4 - i, W(.95, 0, 0)); },
  helm: (P) => { P.ellipse(8, 8, 6, 5.5, (x, y, dx, dy) => (dy < .5 ? R(['#141018', '#28202e', '#40344a', '#5c4c68'])(.7 - dy * .4 - dx * .2, x, y) : null)); P.rect(3, 9, 3, 5, R(['#141018', '#28202e', '#40344a'])(.4, 0, 0)); P.set(6, 6, hex('#b098d0')); },
  harpe: (P) => { P.line(4, 14, 8, 8, PAL.brown(.6, 0, 0)); P.line(8, 8, 12, 2, PAL.steel(.9, 0, 0)); P.line(12, 2, 14, 5, PAL.steel(.95, 0, 0)); P.line(14, 5, 12, 7, PAL.steel(.7, 0, 0)); P.line(9, 8, 12, 4, PAL.steel(.6, 0, 0)); },
  shield: (P) => { P.ellipse(8, 8, 6.5, 6.5, (x, y, dx, dy) => { const r = Math.hypot(dx, dy); return r > .8 ? PAL.bronze(.4, x, y) : PAL.bronze(.8 - dy * .25 + dx * .1, x, y); }); P.set(6, 5, hex('#fff6d0')); P.set(5, 6, hex('#fff6d0')); },
  bag: (P) => { P.ellipse(8, 10, 5.5, 4.5, (x, y, dx, dy) => PAL.cream(.6 - dy * .3, x, y)); P.rect(6, 4, 4, 2, PAL.brown(.6, 0, 0)); P.line(5, 4, 3, 2, PAL.brown(.5, 0, 0)); P.set(8, 9, PAL.gold(.9, 0, 0)); },
};
export function iconSprite(name, o = {}) {
  return spriteMesh((P, E) => { ICONS[name](P); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = P.get(x, y); if (c) E.set(x, y, c.map((v, i) => i < 3 ? Math.round(v * .55) : v)); } }, 16, 16, { scale: o.scale ?? 2.2, emI: o.emI ?? 1.4 });
}
export function iconCanvas(name, s = 4) {   // UI version: 16×16 pixel art scaled ×s
  const P = new PX(16, 16); ICONS[name](P); P.outline(.3); const c = P.done(), o = document.createElement('canvas'); o.width = o.height = 16 * s; const g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, 16 * s, 16 * s); return o;
}
export { FW, FH, PAL };
