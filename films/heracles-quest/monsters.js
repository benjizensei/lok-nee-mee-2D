// Monster sprites (pixel atlases → lit billboards): Nemean lion, Hydra (body + necks + heads), Cerberus (body + 3 heads)
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, texOf, billboard, blob } from './px.js';
import { SPX } from './chars.js';
const R = c => ramp(c, .22), INK = hex('#1a1016');
const LION = R(['#3a2410', '#6e4a1c', '#a8782e', '#d4a448', '#f0cc78']), MANE = R(['#2a1608', '#5a3410', '#8a5418', '#b8782a']);
const HY = R(['#0c2418', '#164030', '#24604a', '#3a8a64', '#62b884']), HYB = R(['#4a5a20', '#7a8a34', '#a8b850']);
const CER = R(['#120c14', '#22182a', '#34263e', '#4a3a56', '#64527a']), FIRE = R(['#8a1a08', '#e0501a', '#ffa030', '#ffe080']);

function atlasOf(W, H, frames, draw, o = {}) {
  const n = frames.length, P = new PX(W * n, H), E = new PX(W * n, H);
  frames.forEach((f, i) => { const p = new PX(W, H), e = new PX(W, H); draw(p, e, f); p.outline(.3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = p.get(x, y); if (c) P.set(i * W + x, y, c); const ec = e.get(x, y); if (ec) E.set(i * W + x, y, ec); } });
  const tex = texOf(P.done()), em = texOf(E.done()); tex.repeat.set(1 / n, 1); em.repeat.set(1 / n, 1);
  return { tex, em, names: frames.map(f => f.name), n, W, H };
}
function sprite(A, sc, o = {}) {
  const mesh = billboard(A.tex, A.W * SPX * sc, A.H * SPX * sc, { em: A.em, emCol: '#ffffff', emI: o.emI ?? 1.2, ax: o.ax ?? .5 });
  const root = new THREE.Group(); root.add(mesh); const sh = blob(A.W * SPX * sc * .45, .5); sh.position.y = .015; if (o.shadow !== false) root.add(sh);
  return { root, mesh, A, frame(nm) { const i = A.names.indexOf(nm); if (i < 0) throw new Error('frame ' + nm); A.tex.offset.x = A.em.offset.x = i / A.n; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
    flash(k) { mesh.material.color.setScalar(1 + 2.5 * k); } };
}

// —— Nemean lion: side view facing left (toward the hero, who faces right) ——
function drawLion(P, E, f) {
  const by = f.crouch ? 4 : 0, lift = f.lift || 0, W = 72;
  if (f.ko) {   // lying on its side
    P.ellipse(36, 40, 26, 7, (x, y, dx, dy) => LION(.6 - dy * .3, x, y)); P.ellipse(12, 37, 8, 7, (x, y, dx, dy) => MANE(.6 - dy * .3, x, y)); P.ellipse(10, 38, 5, 4, (x, y, dx, dy) => LION(.75 - dy * .2, x, y));
    P.set(8, 37, INK); P.set(9, 37, INK); for (let i = 0; i < 4; i++) P.line(24 + i * 9, 45, 24 + i * 9 + 4, 47, LION(.4, 0, 0)); P.line(62, 38, 70, 34, LION(.5, 0, 0)); P.rect(69, 32, 3, 3, MANE(.4, 0, 0)); return;
  }
  // tail
  for (let i = 0; i < 12; i++) P.set(58 + i, 22 + by - Math.round(Math.sin(i / 11 * 2.4) * 6), LION(.5, 0, 0)); P.rect(68, 14 + by, 3, 3, MANE(.4, 0, 0));
  // legs
  const legs = f.pounce ? [[18, -4], [24, -3], [50, 2], [56, 2]] : [[18, 0], [25, 0], [48, 0], [55, 0]];
  legs.forEach(([lx, dy], i) => { for (let y = 32 + by + dy; y < 46; y++) for (let x = lx; x < lx + 5; x++) P.set(x, y, LION((i % 2 ? .45 : .62) - (x === lx ? .15 : 0), x, y)); P.rect(lx - 1, 45, 6, 2, LION(.3, 0, 0)); });
  // body
  P.ellipse(38, 26 + by - lift * .3, 23, 10, (x, y, dx, dy) => LION(.66 - dy * .32 - dx * .05 + ((x + y * 2) % 9 === 0 ? -.08 : 0), x, y));
  // mane + head (left)
  const hy = 18 + by - lift;
  P.ellipse(16, hy + 4, 12, 12, (x, y, dx, dy) => MANE(.6 - dy * .25 - dx * .1 + (h2(x, y, 3) > .8 ? -.15 : 0), x, y));
  P.ellipse(11, hy + 5, 7, 6.5, (x, y, dx, dy) => LION(.78 - dy * .3, x, y));
  P.ellipse(6, hy + 8, 3.5, 3, (x, y, dx, dy) => LION(.85 - dy * .2, x, y)); P.set(4, hy + 7, INK);   // muzzle, nose
  P.set(10, hy + 3, f.ko ? INK : hex('#ffe060')); P.set(9, hy + 3, INK); if (E && !f.ko) E.set(10, hy + 3, hex('#a08020'));
  P.set(13, hy - 1, LION(.9, 0, 0)); P.set(17, hy - 2, LION(.9, 0, 0));   // ears
  if (f.roar) { P.rect(3, hy + 10, 6, 3, hex('#5a1414')); P.set(4, hy + 10, hex('#f4f0e0')); P.set(7, hy + 10, hex('#f4f0e0')); P.set(4, hy + 12, hex('#f4f0e0')); }
  if (f.choke) { P.set(10, hy + 3, INK); P.set(11, hy + 2, INK); P.rect(4, hy + 10, 3, 1, hex('#5a1414')); }
}
const LION_F = [{ name: 'idle0' }, { name: 'idle1', crouch: 1 }, { name: 'roar', roar: 1 }, { name: 'pounce', pounce: 1, lift: 4 }, { name: 'choke0', choke: 1, lift: 5 }, { name: 'choke1', choke: 1, lift: 7, crouch: 1 }, { name: 'ko', ko: 1 }];
export function makeLion(sc = 1.5) { return sprite(atlasOf(72, 48, LION_F, drawLion), sc); }

// —— Hydra ——
export function makeHydraBody(sc = 1.6) {
  const A = atlasOf(64, 40, [{ name: 'body' }], (P) => {
    P.ellipse(32, 30, 30, 11, (x, y, dx, dy) => HY(.55 - dy * .3 + ((x * 2 + y) % 7 === 0 ? -.12 : 0), x, y));
    for (let i = 0; i < 9; i++) P.ellipse(10 + i * 5.5, 23 + Math.sin(i) * 2, 3, 2.4, (x, y, dx, dy) => HYB(.6 - dy * .3, x, y));
    for (let x = 6; x < 60; x += 3) P.set(x, 39, HY(.2, 0, 0));
  });
  return sprite(A, sc);
}
// one neck segment (round bead) and one head (closed / open / stump)
const _seg = {};
export function neckSeg(r = .2) {
  if (!_seg.tex) { const P = new PX(10, 10); P.ellipse(5, 5, 4.6, 4.6, (x, y, dx, dy) => HY(.66 - dy * .3 - dx * .15, x, y)); P.outline(.3); _seg.tex = texOf(P.done()); }
  const m = new THREE.MeshLambertMaterial({ map: _seg.tex, alphaTest: .5, side: THREE.DoubleSide });
  const me = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), m); me.castShadow = true; return me;
}
const HEAD_F = [{ name: 'closed' }, { name: 'open', open: 1 }, { name: 'stump', stump: 1 }, { name: 'burnt', stump: 1, burnt: 1 }];
export function makeHydraHead(gold = false) {
  const A = atlasOf(24, 18, HEAD_F, (P, E, f) => {
    const C = gold ? R(['#4a3008', '#8a6214', '#c89a28', '#f0cc58', '#fff0a8']) : HY;
    if (f.stump) { P.ellipse(12, 12, 5, 4, (x, y, dx, dy) => (f.burnt ? R(['#1a1010', '#3a2018', '#6a3a20'])(.5 - dy * .3, x, y) : hex(dy < -.2 ? '#c84050' : '#6a1a24'))); if (f.burnt && E) { E.set(11, 10, hex('#ff8030')); E.set(13, 11, hex('#ff6020')); P.set(11, 10, hex('#ff9040')); P.set(13, 11, hex('#ff7030')); } return; }
    P.ellipse(13, 9, 9, 6, (x, y, dx, dy) => C(.7 - dy * .3 - dx * .1, x, y)); P.ellipse(5, 10, 5, 3.5, (x, y, dx, dy) => C(.78 - dy * .25, x, y));
    for (let i = 0; i < 3; i++) P.set(14 + i * 3, 3, HYB(.8, 0, 0));
    P.set(9, 7, hex('#ffe040')); if (E) E.set(9, 7, hex('#c0a020')); P.set(9, 8, INK);
    if (f.open) { P.rect(1, 11, 9, 3, hex('#5a1018')); for (let i = 0; i < 4; i++) { P.set(2 + i * 2, 11, hex('#f4f0e0')); P.set(3 + i * 2, 13, hex('#f4f0e0')); } }
  });
  return sprite(A, 1.0, { shadow: false });
}

// —— Cerberus: body + three separate heads ——
export function makeCerberusBody(sc = 2.2) {
  const A = atlasOf(80, 52, [{ name: 'body' }], (P) => {
    for (const [lx, sh] of [[16, .5], [24, .35], [56, .5], [63, .35]]) { for (let y = 32; y < 50; y++) for (let x = lx; x < lx + 6; x++) P.set(x, y, CER(sh, x, y)); P.rect(lx - 1, 49, 8, 2, CER(.2, 0, 0)); }
    P.ellipse(42, 28, 28, 12, (x, y, dx, dy) => CER(.6 - dy * .3 + ((x + y) % 6 === 0 ? -.1 : 0), x, y));
    for (let i = 0; i < 10; i++) P.set(66 + i, 22 - Math.round(Math.sin(i / 9 * 3) * 5), hex('#3a7a3a'));   // serpent tail
    P.rect(18, 20, 22, 3, hex('#5a4a2a'));   // spiked collar
    for (let i = 0; i < 6; i++) P.set(19 + i * 4, 19, hex('#c8c0a8'));
  });
  return sprite(A, sc);
}
const CH_F = [{ name: 'idle' }, { name: 'open', open: 1 }, { name: 'ko', ko: 1 }];
export function makeCerberusHead() {
  const A = atlasOf(26, 22, CH_F, (P, E, f) => {
    P.ellipse(14, 10, 9, 8, (x, y, dx, dy) => CER(.72 - dy * .3 - dx * .1, x, y)); P.ellipse(5, 13, 6, 4, (x, y, dx, dy) => CER(.8 - dy * .3, x, y));
    P.set(13, 2, CER(.9, 0, 0)); P.set(18, 2, CER(.9, 0, 0)); P.set(12, 1, CER(.6, 0, 0)); P.set(19, 1, CER(.6, 0, 0));
    if (f.ko) { P.line(9, 7, 11, 9, INK); P.line(9, 9, 11, 7, INK); P.set(3, 17, hex('#e06070')); }
    else { P.set(10, 8, hex('#ff5020')); P.set(11, 8, hex('#ff5020')); if (E) { E.set(10, 8, hex('#ff5020')); E.set(11, 8, hex('#ff5020')); } }
    if (f.open) { P.rect(0, 15, 9, 4, hex('#7a1408')); for (let i = 0; i < 4; i++) P.set(1 + i * 2, 15, hex('#f4f0e0')); if (E) for (let x = 1; x < 8; x++) E.set(x, 17, FIRE(.7, x, 0)); for (let x = 1; x < 8; x++) P.set(x, 17, FIRE(.75, x, 0)); }
    P.set(1, 12, INK);
  });
  return sprite(A, 2.0, { shadow: false });
}
