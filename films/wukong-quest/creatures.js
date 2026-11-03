// Creatures and props for the Monkey King episode (pixel atlases → billboards)
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, billboard, glow } from './px.js';
import { atlasOf, sprite } from './monsters.js';
const R = c => ramp(c, .22), INK = hex('#1a1016');
const WHITE = R(['#8a90a8', '#c4c8d8', '#eef0f8', '#ffffff']), BLACK = R(['#0c0a10', '#1c1820', '#2e2834', '#443c4a']), GOLD = R(['#6a4410', '#a8701c', '#e0a838', '#ffd870', '#fff4c0']);
const BROWN = R(['#3a2410', '#6a4420', '#9a6a34', '#c89450']), BLUE = R(['#14305a', '#1e4a84', '#3a6ab0', '#6a9ad8']), ORANGE = R(['#6a2a08', '#b04a10', '#e07820', '#ffb050']);

export function makeHorse() {   // celestial horse, side view facing left
  return sprite(atlasOf(52, 40, [{ name: 'a' }, { name: 'b', b: 1 }], (P, E, f) => {
    P.ellipse(28, 20, 14, 7, (x, y, dx, dy) => WHITE(.72 - dy * .3, x, y));
    P.poly([[16, 18], [10, 6], [5, 5], [3, 9], [9, 12], [14, 24]], (x, y) => WHITE(.8 - (y - 5) * .015, x, y)); P.set(6, 7, INK);
    for (let i = 0; i < 6; i++) P.set(12 + i, 5 + i * 2, GOLD(.8, 0, 0));
    const lg = f.b ? [[18, 2], [22, -2], [34, -2], [38, 2]] : [[18, 0], [22, 0], [34, 0], [38, 0]];
    for (const [lx, d] of lg) { P.line(lx, 26, lx + d, 37, WHITE(.6, 0, 0)); P.line(lx + 1, 26, lx + d + 1, 37, WHITE(.45, 0, 0)); }
    for (let i = 0; i < 8; i++) P.set(42 + i, 17 + Math.round(Math.sin(i * .6) * 2), GOLD(.75, 0, 0));
  }), 1.3);
}
export function makeDog() {
  return sprite(atlasOf(34, 24, [{ name: 'run0' }, { name: 'run1', b: 1 }, { name: 'bite', bite: 1 }], (P, E, f) => {
    P.ellipse(18, 12, 10, 5, (x, y, dx, dy) => BLACK(.65 - dy * .3, x, y)); P.ellipse(7, 9, 5, 4, (x, y, dx, dy) => BLACK(.75 - dy * .3, x, y)); P.set(5, 8, hex('#ffd040')); if (E) E.set(5, 8, hex('#ffd040'));
    P.set(8, 4, BLACK(.6, 0, 0)); P.set(9, 3, BLACK(.6, 0, 0)); if (f.bite) { P.rect(1, 11, 5, 2, hex('#7a1414')); P.set(2, 11, hex('#f0f0f0')); P.set(4, 12, hex('#f0f0f0')); }
    const lg = f.b ? [[11, -2], [14, 2], [23, -2], [26, 2]] : [[11, 2], [14, -2], [23, 2], [26, -2]]; for (const [lx, d] of lg) P.line(lx, 15, lx + d, 22, BLACK(.5, 0, 0)); P.line(28, 10, 33, 6, BLACK(.6, 0, 0));
  }), 1.4);
}
// transformation forms (small, flying)
export function makeForm(kind) {
  const D = {
    sparrow: (P) => { P.ellipse(12, 10, 6, 4, (x, y, dx, dy) => BROWN(.7 - dy * .3, x, y)); P.ellipse(6, 8, 3.2, 3, (x, y) => BROWN(.8, x, y)); P.set(3, 8, GOLD(.9, 0, 0)); P.set(5, 7, INK); for (let i = 0; i < 6; i++) P.set(10 + i, 4 - (i >> 1), BROWN(.5, 0, 0)); P.line(17, 10, 22, 12, BROWN(.4, 0, 0)); },
    hawk: (P) => { P.ellipse(14, 12, 9, 5, (x, y, dx, dy) => BROWN(.5 - dy * .3, x, y)); P.ellipse(5, 10, 4, 3.5, (x, y) => WHITE(.8, x, y)); P.set(1, 11, GOLD(.95, 0, 0)); P.set(4, 9, INK); for (let i = 0; i < 12; i++) { P.set(8 + i, 6 - Math.round(i * .4), BROWN(.35, 0, 0)); P.set(8 + i, 7 - Math.round(i * .4), BROWN(.55, 0, 0)); } },
    fish: (P) => { P.ellipse(12, 9, 9, 4, (x, y, dx, dy) => GOLD(.75 - dy * .3, x, y)); P.poly([[20, 9], [26, 4], [26, 14]], (x, y) => ORANGE(.7, x, y)); P.set(6, 8, INK); },
    crane: (P) => { P.ellipse(14, 12, 7, 4, (x, y, dx, dy) => WHITE(.85 - dy * .3, x, y)); P.line(9, 11, 4, 3, WHITE(.7, 0, 0)); P.rect(2, 2, 3, 2, hex('#e02020')); P.line(1, 3, -2, 4, GOLD(.8, 0, 0)); for (let i = 0; i < 10; i++) P.set(12 + i, 8 - (i >> 1), WHITE(.6, 0, 0)); P.line(16, 16, 20, 22, INK); },
  };
  return sprite(atlasOf(28, 24, [{ name: 'a' }], (P) => D[kind](P)), 1.5, { shadow: false });
}
export function makeEgg() {
  return sprite(atlasOf(28, 32, [{ name: 'whole' }, { name: 'crack', c: 1 }, { name: 'open', o: 1 }], (P, E, f) => {
    const S = R(['#4a4650', '#6a6670', '#8a8690', '#aaa6ae']);
    if (f.o) { P.poly([[3, 31], [3, 18], [8, 22], [12, 16], [16, 22], [20, 17], [25, 21], [25, 31]], (x, y) => S(.55 - (y - 20) * .02, x, y)); return; }
    P.ellipse(14, 17, 11, 14, (x, y, dx, dy) => S(.7 - dy * .3 - dx * .15, x, y));
    if (f.c) { P.line(8, 10, 12, 16, INK); P.line(12, 16, 9, 21, INK); P.line(12, 16, 17, 14, INK); for (const [x, y] of [[12, 16], [10, 12], [15, 15]]) { P.set(x, y, GOLD(.95, 0, 0)); E.set(x, y, GOLD(.95, 0, 0)); } }
  }), 1.6);
}
// riding cloud (golden-white puff)
export function makeCloudRide() {
  const A = atlasOf(44, 18, [{ name: 'a' }], (P, E) => { for (const [cx, cy, r] of [[10, 11, 7], [20, 8, 8], [30, 10, 7], [37, 12, 5]]) P.ellipse(cx, cy, r, r * .75, (x, y, dx, dy) => { const c = WHITE(.95 - dy * .35, x, y); E.set(x, y, c.map((v, i) => i < 3 ? Math.round(v * .5) : v)); return c; }); });
  return sprite(A, 1.5, { shadow: false, emI: .9 });
}
// the Buddha: a huge seated golden figure with a halo (billboard)
export function makeBuddha() {
  const A = atlasOf(96, 112, [{ name: 'a' }], (P, E) => {
    const G = GOLD, robe = R(['#6a1c10', '#9a2a14', '#c84a1c', '#e8743a']);
    P.ellipse(48, 92, 40, 18, (x, y, dx, dy) => robe(.6 - dy * .3, x, y));     // crossed legs
    P.poly([[26, 46], [70, 46], [80, 92], [16, 92]], (x, y) => robe(.62 - (x - 48) / 80, x, y));   // body + robe
    P.poly([[48, 46], [70, 46], [74, 80], [52, 70]], (x, y) => G(.7 - (y - 46) * .006, x, y));    // bare shoulder
    P.ellipse(48, 30, 15, 17, (x, y, dx, dy) => G(.78 - dy * .25 - dx * .1, x, y));    // head
    P.ellipse(48, 14, 10, 7, (x, y, dx, dy) => R(['#1a1430', '#2a2448', '#3a3460'])(.6 - dy * .3, x, y));   // hair knot
    P.rect(40, 29, 5, 1, G(.3, 0, 0)); P.rect(51, 29, 5, 1, G(.3, 0, 0)); P.set(48, 22, hex('#ff6040')); P.rect(45, 38, 6, 1, G(.35, 0, 0));
    for (const [x, y] of [[33, 30], [63, 30]]) P.rect(x, y, 2, 8, G(.6, 0, 0));
    for (let y = 0; y < 112; y++) for (let x = 0; x < 96; x++) { const c = P.get(x, y); if (c) E.set(x, y, c.map((v, i) => i < 3 ? Math.round(v * .45) : v)); }
  });
  return sprite(A, 1, { shadow: false, emI: 1.2 });
}
