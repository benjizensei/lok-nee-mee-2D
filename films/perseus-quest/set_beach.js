// Set B — Seriphos beach at dawn. A wooden chest drifts in and grounds; Danaë steps out holding the baby.
// No practical lights: one low pink-gold sun. Tilt-shift preciousness: a tiny chest in a wide world.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, rock, woodPlanks, glow, mulberry } from './px.js';
import { mat, mesh, box, ridge } from './kit.js';
import { sky, sea, particles } from './fx.js';
import { makeChar } from './chars.js';
import { T } from './story.js';
import { seg, ss, eio, eo, lerp, track } from '/core/lib.js';

function sand(w, h, seed) {
  const P = new PX(w, h), R = ramp(['#6a5446', '#8e7058', '#b08e6c', '#cdaa82', '#e4c49a']);
  P.fill((x, y) => { let v = .45 + (fbm(x * .05, y * .12, seed) - .5) * .5 + (Math.sin(x * .25 + fbm(x * .02, y * .05, seed + 2) * 8) > .85 ? -.12 : 0); if (h2(x, y, seed) > .97) v += .2; return R(v, x, y); });
  return P.done();
}

export function buildBeach() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#d9a89a', .012);
  const SK = sky({ top: '#3c4c7c', mid: '#b47e98', hor: '#f4c494', moonDir: new THREE.Vector3(.5, .06, -1), moonCol: '#fff0c0', moonI: 1.6 }); scene.add(SK.mesh);
  const SEA = sea(900, { ppm: 9, deep: '#3a4c74', shallow: '#6c84a4', crest: '#b8a8c0' }); SEA.mesh.position.y = -.08; scene.add(SEA.mesh);
  // sand: a wide shelf that slopes into the water
  const g = new THREE.PlaneGeometry(60, 24, 60, 24); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  g.translate(0, 0, 9);
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i), x = p.getX(i); p.setY(i, Math.max(-.7, Math.min(.7, (z + 1.2) * .16)) + (fbm(x * .1, z * .1, 3) - .5) * .2); } scene.add(mesh(g, mat(sand(128, 128, 5)), { cast: false }));
  const rockM = mat(rock(96, 96, { seed: 8, cols: ['#2a2230', '#40343e', '#5a4a50', '#76625e', '#94806e'] }));
  const R = mulberry(4);
  for (let i = 0; i < 12; i++) { const s = .4 + R() * 1.8, b = mesh(new THREE.DodecahedronGeometry(s, 0), rockM); b.position.set((R() < .5 ? -1 : 1) * (4 + R() * 12), s * .3, -1 + R() * 10); b.rotation.set(R(), R(), R()); scene.add(b); }
  // a cliff headland on the left
  { const cg = new THREE.BoxGeometry(14, 9, 12, 8, 8, 6); const cp = cg.attributes.position; for (let i = 0; i < cp.count; i++) { cp.setX(i, cp.getX(i) + (fbm(cp.getY(i) * .3, cp.getZ(i) * .3, 2) - .5) * 3); } cg.translate(-17, 3, -4); scene.add(mesh(cg, rockM)); }
  for (const [x, z, c, s] of [[-80, -260, '#8a6a88', 11], [60, -300, '#9a7a92', 7], [0, -340, '#a888a0', 3]]) { const r = ridge(220, 40, c, s, { ppm: 1.2 }); r.position.set(x, -6, z); scene.add(r); }
  // the chest
  const chest = new THREE.Group(); scene.add(chest);
  const wood = mat(woodPlanks(48, 48, { pw: 5, len: 24, seed: 3, cols: ['#2a180e', '#4a2c18', '#6a4426', '#8a5c34', '#a8784a'] }));
  const body = box(1.3, .7, .85, wood); chest.add(body);
  const lid = box(1.34, .18, .9, wood); lid.position.y = .7; const lidG = new THREE.Group(); lidG.position.set(0, 0, -.43); lid.position.z = .43; lidG.add(lid); chest.add(lidG);
  for (const x of [-.5, .5]) { const band = new THREE.Mesh(new THREE.BoxGeometry(.08, .74, .9), new THREE.MeshStandardMaterial({ color: '#8a6a2a', metalness: .6, roughness: .4 })); band.position.set(x, .36, 0); band.castShadow = true; chest.add(band); }
  // Danaë with the baby
  const dan = makeChar('danae', { track: 1 }); scene.add(dan.root);
  // light: low sun
  const sun = new THREE.DirectionalLight('#ffd8a8', 2.4); sun.position.set(20, 6, -30); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, far: 80 }); scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#c8a8c8', '#6a5040', 1.1));
  const fill = new THREE.PointLight('#ffe0d0', 1.2, 7, 2); scene.add(fill);
  // surf foam along the waterline + gulls
  const foam = particles(260, (i, t, o) => { const x = -14 + h2(i, 1, 2) * 28, ph = t * .5 + h2(i, 2, 2) * 6.28, w = Math.sin(ph); o.x = x; o.z = -1.25 + w * .45 + h2(i, 3, 2) * .3; o.y = .02; o.a = .5 + .5 * Math.max(0, w); o.s = .08; o.r = 1; o.g = .95; o.b = .9; }, { soft: 0, blend: THREE.NormalBlending });
  scene.add(foam);
  const gulls = particles(9, (i, t, o) => { const a = t * (.2 + h2(i, 1, 4) * .2) + i; o.x = Math.cos(a) * (6 + i) - 2; o.z = -10 + Math.sin(a) * 4; o.y = 6 + h2(i, 2, 4) * 3 + Math.sin(t * 6 + i) * .15; o.a = .9; o.s = .14; o.r = .2; o.g = .16; o.b = .22; }, { soft: 0, blend: THREE.NormalBlending });
  scene.add(gulls);
  const cp = track([[0, [5, 20, 30]], [5, [3, 13, 21]], [11.4, [1.6, 6.4, 11.5]]]), cl = track([[0, [0, 0, -6]], [5, [0, .3, -2]], [11.4, [-.2, .6, 0]]]);

  function update(t, shot, cam, post) {
    const lt = t - shot.a;
    cam.position.set(...cp(lt)); cam.fov = 34; cam.updateProjectionMatrix(); cam.lookAt(...cl(lt));
    // chest drifts in on the swell and grounds at T.chestLand
    const u = seg(t, shot.a, T.chestLand), x = lerp(4, .6, eo(u)), z = lerp(-16, -.6, eo(u));
    const bobA = (1 - ss(seg(t, T.chestLand - .6, T.chestLand))) * .12, settle = t > T.chestLand ? Math.exp(-(t - T.chestLand) * 5) * Math.sin((t - T.chestLand) * 18) * .03 : 0;
    chest.position.set(x, -.25 + bobA * Math.sin(t * 2.2) + (t > T.chestLand ? .1 + settle : (u > .85 ? (u - .85) / .15 * .1 : 0)), z);
    chest.rotation.z = bobA * Math.sin(t * 1.7 + 1) * .6; chest.rotation.y = .4 - u * .4;
    lidG.rotation.x = -1.2 * eio(seg(t, T.chestLand + .6, T.chestLand + 1.4));
    // Danaë rises from the chest and steps onto the sand
    const out = seg(t, T.chestLand + 1.2, T.chestLand + 2.8);
    dan.root.visible = t > T.chestLand + 1.0;
    dan.root.position.set(chest.position.x - .3 - eo(out) * 1.1, lerp(-.3, 0, eo(seg(t, T.chestLand + 1.0, T.chestLand + 1.6))), chest.position.z + .6);
    dan.frame(t > T.chestLand + 3.4 && Math.floor(t * 3) % 7 === 0 ? 'blink' : Math.floor(t * 1.4) % 2 ? 'idle1' : 'idle0'); dan.face(cam);
    fill.position.set(dan.root.position.x + .5, 1.8, dan.root.position.z + 2.2);
    SEA.u.t.value = t; SEA.u.camPos.value.copy(cam.position); SEA.u.fogColor.value.copy(scene.fog.color); SEA.u.fogDensity.value = scene.fog.density;
    SEA.setLights([{ p: new THREE.Vector3(60, 5, -200), c: new THREE.Color('#ffd0a0'), i: 1.4 }]);
    foam.userData.update(t); gulls.userData.update(t);
    self.focusPoint.copy(chest.position).setY(.6);
    post.dof.focus = cam.position.distanceTo(chest.position); post.dof.aper = 380; post.dof.maxCoc = 18;
    post.vig.uniforms.warm.value = .2; post.vig.uniforms.sat.value = 1.12; post.bloom.threshold = .9;
  }
  const self = { scene, update, focusPoint: new THREE.Vector3() };
  return self;
}
