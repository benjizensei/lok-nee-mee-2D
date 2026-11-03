// Set — the Dragon King's palace under the Eastern Sea (blue fog, caustic light, coral). Shot: dragon.
// A huge glowing pillar holds up the sea; the monkey grabs it and it shrinks into his staff.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, rock, glow, mulberry } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles, beamCard } from './fx.js';
import { makeChar } from './chars.js';
import { T } from './story.js';
import { seg, ss, eio, eo, ei, lerp, track } from '/core/lib.js';

function sand(w, h, seed) { const P = new PX(w, h), R = ramp(['#1a3a4a', '#245062', '#30687a', '#408092']); P.fill((x, y) => R(.45 + (fbm(x * .07, y * .07, seed) - .5) * .5 + (Math.sin(x * .3 + fbm(x * .03, y * .03, seed) * 8) > .9 ? .15 : 0), x, y)); return P.done(); }
export function buildSea() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#1a5a72', .035); scene.background = new THREE.Color('#06202e');
  scene.add(mesh(new THREE.BoxGeometry(30, .4, 24).translate(0, -.2, -2), mat(sand(96, 96, 3))));
  const rockM = mat(rock(96, 96, { seed: 14, cols: ['#0a1a22', '#122a36', '#1c3a48', '#284a5a', '#365c6c'] }));
  const R = mulberry(6);
  // coral and rocks
  const coral = ['#e05a6a', '#f08a4a', '#c04a9a', '#ffb060'];
  for (let i = 0; i < 26; i++) { const x = (R() - .5) * 18, z = -8 + R() * 10; if (Math.abs(x) < 2.5 && z > -4) continue; const c = new THREE.Mesh(new THREE.ConeGeometry(.15 + R() * .3, .6 + R() * 1.6, 5).translate(0, .5, 0), new THREE.MeshStandardMaterial({ color: coral[i % 4], emissive: coral[i % 4], emissiveIntensity: .25 })); c.position.set(x, 0, z); c.rotation.z = (R() - .5) * .5; scene.add(c); }
  for (let i = 0; i < 10; i++) { const s = .5 + R() * 1.4, b = mesh(new THREE.DodecahedronGeometry(s, 0), rockM); b.position.set((R() - .5) * 20, s * .3, -9 + R() * 6); scene.add(b); }
  // palace hint: jade columns + gate
  const jade = new THREE.MeshStandardMaterial({ color: '#2a8a6a', roughness: .5, emissive: '#0a3a2a', emissiveIntensity: .4 });
  for (const s of [-1, 1]) for (const k of [0, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.45, .5, 7, 12).translate(0, 3.5, 0), jade); c.position.set(s * (4.5 + k * 3), 0, -8 + k); c.castShadow = true; scene.add(c); }
  // the sea-holding pillar: tall glowing gold column, which shrinks into the staff
  const goldM = new THREE.MeshStandardMaterial({ color: '#e0a838', metalness: .7, roughness: .3, emissive: '#ffb040', emissiveIntensity: .5 });
  const pillar = new THREE.Group(); scene.add(pillar);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 12, 16).translate(0, 6, 0), new THREE.MeshStandardMaterial({ color: '#2a1a14', metalness: .6, roughness: .4 })); shaft.castShadow = true; pillar.add(shaft);
  for (const y of [0, 12]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .8, 16).translate(0, y, 0), goldM); pillar.add(cap); }
  pillar.position.set(.8, 0, -3.2);
  const pL = new THREE.PointLight('#ffc060', 4, 12, 1.6); scene.add(pL); const pH = glow('#ffd080', 3, .7); scene.add(pH);
  const shafts = [0, 1, 2].map(i => { const b = beamCard(16, .6, 2.4, '#7ad8ff', { k: .14, fall: 1.2 }); scene.add(b); return b; });
  const bubbles = particles(140, (i, t, o) => { const u = (t * .25 + h2(i, 1, 3)) % 1; o.x = (h2(i, 2, 3) - .5) * 14 + Math.sin(t * 2 + i) * .2; o.y = u * 9; o.z = -8 + h2(i, 3, 3) * 10; o.a = .6 * Math.sin(u * Math.PI); o.s = .06 + h2(i, 4, 3) * .06; o.r = .8; o.g = .95; o.b = 1; }, { soft: 0, blend: THREE.NormalBlending });
  scene.add(bubbles);
  const fish = particles(30, (i, t, o) => { const a = t * (.3 + h2(i, 1, 5) * .3) + i; o.x = Math.cos(a) * (5 + i % 4); o.z = -4 + Math.sin(a) * 3; o.y = 2 + (i % 5) * .7; o.a = .9; o.s = .14; o.r = 1; o.g = .6 + (i % 3) * .1; o.b = .3; }, { soft: 0, blend: THREE.NormalBlending });
  scene.add(fish);
  scene.add(new THREE.HemisphereLight('#8ad8f0', '#1a3a48', 2.6));
  const key = new THREE.DirectionalLight('#9ae0ff', 1.2); key.position.set(-4, 14, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); scene.add(key);
  const fill = new THREE.PointLight('#e0f4ff', 2.2, 8, 2); scene.add(fill);
  const wk = makeChar('wukongN', { track: 1 }), wkA = makeChar('wukong', { track: 1 }), dk = makeChar('dragonk', { scale: 1.1 }); scene.add(wk.root, wkA.root, dk.root);
  const self = { scene, update, focusPoint: null, hud: null, popups: [], tags: [] };
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a;
    const k = track([[0, [-2, 7, 12]], [3, [-1, 3.8, 7.6]], [5.6, [.2, 3.6, 6.8]], [7.6, [.4, 5.2, 8.6]], [11.6, [.6, 3.6, 6.4]]]), l = track([[0, [0, 1, -4]], [3, [.2, 1.6, -2.4]], [5.6, [.6, 3.0, -3.0]], [7.6, [.6, 2.4, -2.6]], [11.6, [.2, 1.3, -1.6]]]);
    cam.position.set(...k(lt)); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(...l(lt));
    // the pillar shrinks into a staff in the monkey's hand
    const sh = eio(seg(t, T.shrink, T.shrink + .9)), got = t > T.shrink + .9;
    pillar.visible = !got; pillar.scale.set(lerp(1, .12, sh), lerp(1, .17, sh), lerp(1, .12, sh)); pillar.position.set(lerp(.8, -.2, sh), lerp(0, .3, sh), lerp(-3.2, -1.0, sh));
    pL.position.set(pillar.position.x, 2 + 4 * (1 - sh), -2.2); pL.intensity = 4 + (t > T.grabPillar && t < T.shrink + 1 ? 6 : 0); pH.position.set(pillar.position.x, 1 + 5 * (1 - sh), pillar.position.z + .2);
    const walk = seg(t, 31.1, 33.6);
    wk.root.visible = !got; wkA.root.visible = got; const W = got ? wkA : wk;
    W.root.position.set(lerp(-3.5, -.6, eo(walk)), 0, -.8); W.frame(walk > 0 && walk < 1 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4] : got ? (t > T.staffLoot ? 'victory' : 'slash2') : t > T.grabPillar ? 'grab' : 'idle0');
    dk.root.position.set(2.0, 0, -1.8); dk.frame(t > T.grabPillar ? 'scared' : Math.floor(t * 1.5) % 2 ? 'idle1' : 'idle0');
    for (const c of [wk, wkA, dk]) if (c.root.visible) c.face(cam, c === dk);
    shafts.forEach((b, i) => b.userData.aim(new THREE.Vector3(-4 + i * 4, 14, -4 + i), new THREE.Vector3(.1 * (i - 1), -1, .15).normalize(), cam));
    fill.position.copy(W.root.position).add(new THREE.Vector3(.8, 2, 2.6));
    bubbles.userData.update(t); fish.userData.update(t);
    self.focusPoint = W.root.position.clone().setY(1.3).lerp(new THREE.Vector3(.8, 2, -3), t < T.shrink + 1 ? .4 : 0);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = 220; post.dof.maxCoc = 16;
    renderer.toneMappingExposure = 1.6; post.vig.uniforms.warm.value = 0; post.bloom.strength = .7;
  }
  return self;
}
