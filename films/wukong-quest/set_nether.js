// Set — the underworld registry (dark violet hall, candles, a giant ledger). Shot: nether.
// The monkey strikes his own name from the Book of Life and Death.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, glow, mulberry, texOf } from './px.js';
import { mat, mesh, box, fire } from './kit.js';
import { particles, flick } from './fx.js';
import { makeChar } from './chars.js';
import { T } from './story.js';
import { seg, ss, eio, eo, lerp, track } from '/core/lib.js';

function pageTex(struck) {   // parchment with rows of glyph-like marks; one row struck out in red
  const P = new PX(96, 64), R = ramp(['#8a7458', '#b09a78', '#d0bc98', '#e8d8b8']), INK = [30, 22, 26];
  P.fill((x, y) => R(.6 + (fbm(x * .1, y * .1, 3) - .5) * .3, x, y));
  for (let row = 0; row < 7; row++) for (let col = 0; col < 2; col++) { const y0 = 6 + row * 8, x0 = 6 + col * 46; for (let k = 0; k < 9; k++) if (h2(row * 9 + k, col, 7) > .25) { const gx = x0 + k * 4; P.rect(gx, y0, 3, 1, INK); P.rect(gx + 1, y0, 1, 4, INK); if (h2(k, row, col) > .5) P.rect(gx, y0 + 3, 3, 1, INK); } }
  if (struck) { P.rect(50, 31, 40, 2, [200, 30, 30]); P.rect(50, 29, 2, 6, [200, 30, 30]); }
  return P.done();
}
export function buildNether() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#1a1028', .05); scene.background = new THREE.Color('#06040a');
  scene.add(mesh(new THREE.BoxGeometry(20, .4, 16).translate(0, -.2, -2), new THREE.MeshStandardMaterial({ color: '#1c1424', roughness: .9 })));
  const wallM = new THREE.MeshStandardMaterial({ color: '#2a1c34', roughness: .9 });
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(20, 9, .5).translate(0, 4.5, -7), wallM));
  for (const x of [-6, -2, 2, 6]) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.4, 6, 1).translate(0, 3, 0), new THREE.MeshStandardMaterial({ color: '#3a2a1c' })); s.position.set(x, 0, -6.2); scene.add(s); for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, .25, .7), new THREE.MeshStandardMaterial({ color: ['#6a2a1a', '#2a4a6a', '#5a5a2a'][k % 3] })); b.position.set(x, .8 + k * 1.1, -5.9); scene.add(b); } }
  // desk + giant open ledger
  const desk = new THREE.Mesh(new THREE.BoxGeometry(4, 1.1, 2).translate(0, .55, 0), new THREE.MeshStandardMaterial({ color: '#3a1c14', roughness: .8 })); desk.position.set(.6, 0, -2.6); desk.castShadow = true; scene.add(desk);
  const bookM = [pageTex(false), pageTex(true)].map(c => new THREE.MeshStandardMaterial({ map: texOf(c), roughness: .9 }));
  const book = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.1), bookM[0]); book.rotation.x = -Math.PI / 2 + .25; book.position.set(.6, 1.2, -2.5); scene.add(book);
  const cands = [[-1.3, -2.0], [2.5, -2.2]].map(([x, z], i) => { const f = fire(.35, { seed: i, i: 3 }); f.position.set(x, 1.4, z); const c = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .3, 8).translate(0, 1.25, 0), new THREE.MeshStandardMaterial({ color: '#efe4c8' })); c.position.set(x, 0, z); const L = new THREE.PointLight('#ffb060', 2.4, 7, 2); L.position.set(x, 1.7, z + .3); scene.add(f, c, L); return { f, L, s: i }; });
  const judge = makeChar('laozi', { scale: 1.0 }); judge.root.position.set(3.2, 0, -3.6); scene.add(judge.root);
  judge.mesh.material.color.set('#a090c0');
  const wk = makeChar('wukong', { track: 1 }); scene.add(wk.root);
  const brush = particles(40, (i, t, o) => { const u = t - T.strike; o.a = 0; if (u < 0 || u > .9) return; o.x = .9 + (i / 40) * 1.5 * Math.min(1, u * 4); o.y = 1.32; o.z = -2.35; o.a = 1 - u / .9; o.s = .06; o.r = 1; o.g = .2; o.b = .2; });
  scene.add(brush);
  const wisps = particles(50, (i, t, o) => { const u = (t * .1 + h2(i, 1, 4)) % 1; o.x = (h2(i, 2, 4) - .5) * 12; o.y = u * 5; o.z = -6 + h2(i, 3, 4) * 6; o.a = .5 * Math.sin(u * Math.PI); o.s = .1; o.r = .6; o.g = .9; o.b = 1; }, { soft: 1 });
  scene.add(wisps);
  scene.add(new THREE.HemisphereLight('#8a6ab0', '#140a14', 1.4));
  const fill = new THREE.PointLight('#e0d0ff', 2.6, 8, 2); scene.add(fill);
  const strikeL = new THREE.PointLight('#ff4030', 0, 6, 2); scene.add(strikeL);
  const self = { scene, update, focusPoint: null, hud: null, popups: [], tags: [] };
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a;
    const k = track([[0, [-1.5, 4.6, 7]], [3.6, [-.4, 3.8, 4.8]], [4.6, [.4, 3.6, 1.6]], [7, [.5, 3.8, 1.2]], [9.6, [.2, 4.2, 5.4]]]), l = track([[0, [0, 1.2, -2.4]], [3.6, [.4, 1.3, -2.4]], [4.6, [.6, 1.0, -2.5]], [7, [.6, 1.0, -2.5]], [9.6, [.4, 1.3, -2.4]]]);
    cam.position.set(...k(lt)); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(...l(lt));
    book.material = t > T.strike + .3 ? bookM[1] : bookM[0];
    const w = seg(t, 42.6, 44.6); wk.root.position.set(lerp(-4, -1.0, eo(w)), 0, -1.4); wk.frame(w < 1 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4] : t > T.strike - .3 && t < T.strike + .5 ? 'slash1' : t > T.immortal ? 'laugh' : 'idle0');
    judge.frame(t > T.strike ? 'up' : Math.floor(t * 1.5) % 2 ? 'idle1' : 'idle0');
    wk.face(cam); judge.face(cam, true);
    for (const c of cands) { const kk = flick(t, c.s); c.L.intensity = 2.2 * kk; c.f.userData.update(t, cam, .9 + .1 * kk); }
    strikeL.position.set(1.4, 2, -1.6); strikeL.intensity = 8 * Math.max(0, 1 - Math.abs(t - T.strike - .2) / .5);
    fill.position.copy(wk.root.position).add(new THREE.Vector3(.8, 2, 2.4));
    brush.userData.update(t); wisps.userData.update(t);
    self.focusPoint = lt > 3.6 && lt < 7 ? new THREE.Vector3(.6, 1.2, -2.5) : wk.root.position.clone().setY(1.2);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = 220; post.dof.maxCoc = 16;
    renderer.toneMappingExposure = 1.4; post.vig.uniforms.warm.value = .05;
  }
  return self;
}
