// Set — the Augean stables (grey noon). Shot: stables (89.6–100.4). Heracles breaks a dam; two rivers sweep the yard clean.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, glow, mulberry } from './px.js';
import { mat, mesh, box, house } from './kit.js';
import { sky, sea, particles } from './fx.js';
import { makeChar } from './chars.js';
import { T } from './story.js';
import { seg, ss, eio, eo, lerp, track } from '/core/lib.js';

function yard(w, h, seed) { const P = new PX(w, h), R = ramp(['#2a2010', '#3e3018', '#544022', '#6a522c', '#806a3a']); P.fill((x, y) => R(.4 + (fbm(x * .06, y * .06, seed) - .5) * .6, x, y)); return P.done(); }
function clean(w, h, seed) { const P = new PX(w, h), R = ramp(['#5a6a3a', '#74864a', '#90a45c', '#a8bc6c']); P.fill((x, y) => R(.45 + (fbm(x * .08, y * .08, seed) - .5) * .5, x, y)); return P.done(); }

export function buildStables() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#c8c4b0', .014);
  const SK = sky({ top: '#5a7aa8', mid: '#a8bcd0', hor: '#e8e0c8', moonDir: new THREE.Vector3(.3, .7, -.5), moonCol: '#fffaf0', moonI: .8 }); scene.add(SK.mesh);
  const dirty = mesh(new THREE.BoxGeometry(18, .3, 12).translate(0, -.15, -1), mat(yard(96, 96, 2)), { cast: false }); scene.add(dirty);
  const cleanG = mesh(new THREE.BoxGeometry(18, .3, 12).translate(0, -.14, -1), mat(clean(96, 96, 5)), { cast: false }); scene.add(cleanG);
  scene.add(mesh(new THREE.BoxGeometry(60, .3, 40).translate(0, -.2, -6), mat(clean(96, 96, 8)), { cast: false }));
  // barns + fence
  scene.add(house({ x: -2.5, z: -6.5, w: 7, d: 4, h: 3.2, wall: 'wall3', roof: 'roof3', door: 0, windows: [[-2, 1.8], [2, 1.8]], chimney: false }));
  scene.add(house({ x: 5.0, z: -5.5, w: 5, d: 4, h: 3, wall: 'wall3', roof: 'roof3', door: 0, windows: [[0, 1.8]], chimney: false, ry: -.3 }));
  const wood = new THREE.MeshStandardMaterial({ color: '#6a4a2a', roughness: .9 });
  for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.12, 1, .12).translate(0, .5, 0), wood); p.position.set(-8.5 + i, 0, 4.6); p.castShadow = true; scene.add(p); }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(18, .1, .08), wood); rail.position.set(0, .8, 4.6); scene.add(rail);
  // dung piles (shrink as the flood passes)
  const dungM = new THREE.MeshStandardMaterial({ color: '#4a3418', roughness: 1 }), R = mulberry(3);
  const piles = []; for (let i = 0; i < 26; i++) { const s = .25 + R() * .45, m = new THREE.Mesh(new THREE.SphereGeometry(s, 7, 5, 0, 6.3, 0, 1.6), dungM); m.position.set(-7 + R() * 14, 0, -4 + R() * 7.5); m.castShadow = true; scene.add(m); piles.push({ m, s }); }
  const flies = particles(90, (i, t, o) => { const p = piles[i % piles.length]; const k = p.m.scale.x; o.x = p.m.position.x + Math.sin(t * 7 + i) * .3; o.y = .4 + Math.cos(t * 9 + i * 2) * .2; o.z = p.m.position.z + Math.cos(t * 6 + i) * .3; o.a = k * .9; o.s = .03; o.r = .05; o.g = .05; o.b = .05; }, { soft: 0, blend: THREE.NormalBlending });
  scene.add(flies);
  // the flood: a water slab sweeping from the river (right) across the yard
  const W = sea(40, { ppm: 9, deep: '#24506a', shallow: '#4a8aa8', crest: '#d8f0ff' }); W.mesh.scale.set(.45, 1, .3); scene.add(W.mesh);
  const foam = particles(240, (i, t, o) => { const u = seg(t, T.flood, T.flood + 2.4); o.a = 0; if (u <= 0 || u >= 1.2) return; const fx = lerp(10, -10, u); o.x = fx + h2(i, 1, 3) * .8; o.z = -4.5 + h2(i, 2, 3) * 9; o.y = .15 + h2(i, 3, 3) * .6 * Math.abs(Math.sin(t * 8 + i)); o.a = .9; o.s = .12; o.r = 1; o.g = 1; o.b = 1; }, { soft: 0, blend: THREE.NormalBlending });
  scene.add(foam);
  // dam of rocks at the right edge, knocked open
  const rocks = [...Array(6)].map((_, i) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.45, 0), new THREE.MeshStandardMaterial({ color: '#6a6a70', roughness: 1 })); m.castShadow = true; scene.add(m); return m; });
  const sun = new THREE.DirectionalLight('#fff8e8', 2.4); sun.position.set(-6, 14, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(sun);
  scene.add(new THREE.HemisphereLight('#d8e4f0', '#6a5a3a', 1.3));
  const her = makeChar('heraclesL', { track: 1 }); scene.add(her.root);
  const self = { scene, update, focusPoint: null, hud: null, popups: [] };
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a;
    const ck = track([[0, [-4, 6.5, 11]], [3.5, [1.5, 5.2, 8.4]], [4.4, [2.0, 5.0, 8.0]], [6.5, [0, 9, 13]], [10.8, [0, 9.4, 13.5]]]), lk = track([[0, [-1, .4, -2]], [3.5, [4.5, 1.0, -.5]], [4.4, [4.6, 1.0, -.5]], [6.5, [0, 0, -1]], [10.8, [0, 0, -1]]]);
    cam.position.set(...ck(lt)); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(...lk(lt));
    const shake = t > T.flood - .3 && t < T.flood + .4 ? .06 : 0; cam.position.x += Math.sin(t * 90) * shake;
    // Heracles walks to the dam and smashes it open
    const w = seg(t, 89.8, 92.4); let hx = lerp(-3, 4.6, eo(w)), hf = w > 0 && w < 1 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 9) % 4] : 'idle0';
    if (t > 92.6 && t < T.flood) hf = ['windup', 'slash3'][Math.floor((t - 92.6) * 3) % 2];
    if (t >= T.flood) { hx = lerp(4.6, 6.0, eo(seg(t, T.flood, T.flood + .6))); hf = t > T.flood + 1.5 ? 'victory' : 'idle1'; }
    her.root.position.set(hx, 0, 1.0); her.frame(hf); her.face(cam, t >= T.flood && t < T.flood + 1.5);
    rocks.forEach((r, i) => { const u = seg(t, T.flood - .05, T.flood + .8); r.position.set(6.2 + (i % 2) * .5 + u * (i - 2.5) * 1.2, .3 + (i >> 1) * .45 + Math.sin(u * Math.PI) * 1.4 - u * .4, -1.5 + i * .5); r.rotation.set(u * 4 + i, u * 3, 0); });
    // flood front + clean ground behind it
    const u = seg(t, T.flood, T.flood + 2.4), front = lerp(10, -10, u);
    W.mesh.visible = t > T.flood && t < T.flood + 3.6; W.mesh.position.set(front + 9, .06 + (1 - seg(t, T.flood + 2.4, T.flood + 3.6)) * .1, -1); W.mesh.material.opacity = 1;
    cleanG.visible = t > T.flood; cleanG.scale.x = Math.max(.001, (10 - front) / 18); cleanG.position.x = 9 - (10 - front) / 2;
    for (const p of piles) { const gone = front < p.m.position.x; p.m.scale.setScalar(gone ? Math.max(0, 1 - (p.m.position.x - front) / 1.5) : 1); p.m.visible = p.m.scale.x > .01; }
    W.u.t.value = t * 2; W.u.camPos.value.copy(cam.position); W.u.fogColor.value.copy(scene.fog.color); W.u.fogDensity.value = scene.fog.density;
    foam.userData.update(t); flies.userData.update(t);
    self.focusPoint = t < T.flood + .5 ? her.root.position.clone().setY(1) : null;
    post.dof.focus = self.focusPoint ? cam.position.distanceTo(self.focusPoint) : 15; post.dof.aper = 260; post.dof.maxCoc = 16; self.tiltC = self.focusPoint ? null : .45;
    renderer.toneMappingExposure = 1.05; post.vig.uniforms.warm.value = .1;
  }
  return self;
}
