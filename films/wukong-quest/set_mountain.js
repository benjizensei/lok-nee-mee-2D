// Set — Flower-Fruit Mountain (green peaks, waterfall). Zones: summit (x=0: stone egg, banner), master's pavilion (x=40).
// Shots: birth, train, rename.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, rock, glow, mulberry, texOf } from './px.js';
import { mat, mesh, box } from './kit.js';
import { sky, particles, flick } from './fx.js';
import { makeChar } from './chars.js';
import { makeEgg, makeForm, makeCloudRide } from './creatures.js';
import { T } from './story.js';
import { seg, ss, eio, eo, ei, lerp, track } from '/core/lib.js';

function grass(w, h, seed) { const P = new PX(w, h), R = ramp(['#2a4a20', '#3a6a2a', '#4e8a36', '#68a844']); P.fill((x, y) => R(.45 + (fbm(x * .07, y * .07, seed) - .5) * .6 + (h2(x, y, seed) > .97 ? .25 : 0), x, y)); return P.done(); }
function bannerTex() { const P = new PX(24, 56), R = ramp(['#6a1010', '#a81c1c', '#d83a2a']), G = ramp(['#a8701c', '#e0a838', '#ffd870']);
  P.fill((x, y) => { if (y > 50 && (x % 6) > 2 && y > 50 + (x % 6 === 3 ? 0 : 2)) return null; if (x < 2 || x > 21 || y < 2) return G(.7, x, y); return R(.55 + (x / 24 - .5) * .3, x, y); });
  for (let k = 0; k < 4; k++) { const y0 = 8 + k * 11; P.rect(7, y0, 10, 2, G(.9, 0, 0)); P.rect(11, y0 - 2, 2, 8, G(.9, 0, 0)); if (k % 2) P.rect(8, y0 + 4, 8, 1, G(.8, 0, 0)); else P.rect(7, y0 + 5, 3, 2, G(.8, 0, 0)); }
  return P.done(); }

export function buildMountain() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#b8d4c8', .014);
  const SK = sky({ top: '#3a6aa8', mid: '#8ab8d8', hor: '#f0e8c8', moonDir: new THREE.Vector3(-.4, .4, -1), moonCol: '#fff4d8', moonI: 1.2 }); scene.add(SK.mesh);
  const rockM = mat(rock(128, 128, { seed: 9, cols: ['#2a2a24', '#424238', '#5a5a4a', '#74725e', '#908e76', '#aaa88e'] })), gM = mat(grass(96, 96, 3));
  // summit plateau + surrounding peaks
  scene.add(mesh(new THREE.CylinderGeometry(6, 8, 2, 16).translate(0, -1, 0), gM));
  const R = mulberry(4);
  for (let i = 0; i < 14; i++) { const a = R() * 6.28, r = 12 + R() * 24, hh = 6 + R() * 16; const c = mesh(new THREE.ConeGeometry(2.5 + R() * 3, hh, 7).translate(0, hh / 2 - 8, 0), R() < .5 ? rockM : gM); c.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 6); scene.add(c); }
  // waterfall behind the summit
  const fallM = new THREE.MeshBasicMaterial({ color: '#d8f0ff', transparent: true, opacity: .75 }); const fall = new THREE.Mesh(new THREE.PlaneGeometry(3, 14), fallM); fall.position.set(4, -2, -9); scene.add(fall);
  const spray = particles(120, (i, t, o) => { const u = (t * .9 + h2(i, 1, 2)) % 1; o.x = 4 + (h2(i, 2, 2) - .5) * 3; o.y = 5 - u * 14; o.z = -8.8; o.a = .6; o.s = .12; o.r = .9; o.g = .97; o.b = 1; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(spray);
  const egg = makeEgg(); egg.root.position.set(0, 0, -1.2); scene.add(egg.root);
  const eggL = new THREE.PointLight('#ffe080', 0, 8, 1.6); scene.add(eggL); const eggH = glow('#ffe8a0', 2.4, 1); scene.add(eggH);
  const monkey = makeChar('wukongN', { track: 1 }), armed = makeChar('wukong', { track: 1 }); scene.add(monkey.root, armed.root);
  const troop = [...Array(7)].map((_, i) => { const m = makeChar('wukongN', { scale: .7 }); m.root.position.set(-3.6 + i * 1.2, 0, 1.6 + (i % 2) * .6); scene.add(m.root); return m; });
  // banner
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 5, 6).translate(0, 2.5, 0), new THREE.MeshStandardMaterial({ color: '#6a4a24' })); pole.position.set(1.6, 0, -1.6); pole.castShadow = true; scene.add(pole);
  const bt = texOf(bannerTex()); const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.6), new THREE.MeshStandardMaterial({ map: bt, alphaTest: .5, side: THREE.DoubleSide })); flag.castShadow = true; scene.add(flag);
  // master's pavilion (x=40)
  scene.add(mesh(new THREE.BoxGeometry(12, .5, 10).translate(40, -.25, -1), gM));
  const wood = new THREE.MeshStandardMaterial({ color: '#8a2a1c', roughness: .7 }), roofM = new THREE.MeshStandardMaterial({ color: '#2a5a4a', roughness: .8 });
  for (const [x, z] of [[37.5, -4], [42.5, -4], [37.5, -1], [42.5, -1]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.16, .18, 3, 8).translate(0, 1.5, 0), wood); c.position.set(x, 0, z); c.castShadow = true; scene.add(c); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.4, 4).translate(0, 3.7, 0), roofM); roof.rotation.y = Math.PI / 4; roof.position.set(40, 0, -2.5); roof.castShadow = true; scene.add(roof);
  const master = makeChar('master', { scale: 1.05 }); master.root.position.set(39.0, 0, -2.6); scene.add(master.root);
  const form = makeForm('sparrow'); scene.add(form.root); const ride = makeCloudRide(); scene.add(ride.root);
  const poof = particles(60, (i, t, o) => { o.a = 0; for (const p0 of [T.skill72 - .2, T.skill72 + 1.3]) { const u = t - p0; if (u < 0 || u > .8) continue; const a = h2(i, 1, 3) * 6.28; o.x = 40.8 + Math.cos(a) * u * 1.4; o.y = .9 + Math.sin(a) * u * .9; o.z = -1.4; o.a = (1 - u / .8); o.s = .3; o.r = 1; o.g = 1; o.b = 1; } }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(poof);
  const streak = particles(80, (i, t, o) => { const u = t - T.skillCloud - .3; o.a = 0; if (u < 0 || u > 1.6) return; const k = (i / 80); o.x = 41 + u * 14 - k * 3; o.y = 1 + u * 9 - k * 2; o.z = -1.4; o.a = (1 - k) * (1 - u / 1.6); o.s = .2; o.r = 1; o.g = .95; o.b = .7; }, { soft: 1 });
  scene.add(streak);
  const sun = new THREE.DirectionalLight('#fff4dc', 2.3); sun.position.set(-8, 14, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#d8ecff', '#4a5a30', 1.3));
  const fill = new THREE.PointLight('#fff0e0', 2.0, 8, 2); scene.add(fill);
  const self = { scene, update, focusPoint: null, hud: null, popups: [], tags: [] };
  function update(t, shot, cam, post, renderer) {
    const id = shot.id, lt = t - shot.a, idle = (o = 0) => Math.floor(t * 1.6 + o) % 2 ? 'idle1' : 'idle0';
    const zx = id === 'train' ? 40 : 0; sun.position.set(zx - 8, 14, 10); sun.target.position.set(zx, 0, -1);
    let cp, cl; monkey.root.visible = false; armed.root.visible = false; egg.root.visible = id === 'birth'; troop.forEach(m => m.root.visible = id === 'rename'); form.root.visible = false; ride.root.visible = false;
    pole.visible = flag.visible = id === 'rename'; master.root.visible = id === 'train';
    if (id === 'birth') {
      egg.frame(t < T.eggCrack ? 'whole' : t < T.eggBurst ? 'crack' : 'open');
      const glowK = t < T.eggCrack ? 0 : t < T.eggBurst ? .4 + .3 * Math.sin(t * 14) : Math.max(0, 1 - (t - T.eggBurst) / .8) * 3;
      eggL.position.set(0, 1.4, .2); eggL.intensity = 12 * glowK; eggH.position.set(0, 1.0, -1.0); eggH.visible = glowK > .02; eggH.material.opacity = Math.min(1, glowK);
      if (t > T.eggBurst) { const j = seg(t, T.eggBurst, T.eggBurst + .7); monkey.root.visible = true; monkey.root.position.set(lerp(0, .9, j), Math.sin(j * Math.PI) * 1.6, lerp(-1.2, .2, j)); monkey.frame(j < 1 ? 'laugh' : t > T.status - .3 ? (Math.floor(t * 4) % 2 ? 'laugh' : 'idle1') : idle()); }
      const k = track([[0, [0, 9, 18]], [3, [0, 4.5, 8.5]], [10.1, [.6, 3.4, 6.2]]]), l = track([[0, [0, 0, -2]], [3, [0, .4, -1.6]], [10.1, [.4, .5, -1.4]]]); cp = k(lt); cl = l(lt);
      self.focusPoint = new THREE.Vector3(t > T.eggBurst ? .9 : 0, 1, -.6);
    } else if (id === 'train') {
      monkey.root.visible = !(t > T.skill72 - .2 && t < T.skill72 + 1.3) && t < T.skillCloud + .3;
      monkey.root.position.set(40.8, 0, -1.4); monkey.frame(t < T.skill72 - .5 ? 'kneel' : t > T.skillCloud - .3 ? 'laugh' : idle());
      form.root.visible = t > T.skill72 - .2 && t < T.skill72 + 1.3; form.root.position.set(40.8 + Math.sin(t * 3) * .4, 1.2 + Math.sin(t * 9) * .15, -1.4);
      master.frame(t < T.skill72 ? 'point' : t > T.skillCloud - .5 ? 'up' : idle());
      const cu = seg(t, T.skillCloud + .3, T.skillCloud + 1.3); ride.root.visible = t > T.skillCloud - .3 && cu < 1; ride.root.position.set(40.8 + ei(cu) * 14, .1 + ei(cu) * 9, -1.4);
      if (t > T.skillCloud + .3 && cu < 1) { monkey.root.visible = true; monkey.root.position.set(40.8 + ei(cu) * 14, .5 + ei(cu) * 9, -1.4); monkey.frame('laugh'); }
      cp = [39.6 + lt * .08, 3.0, 5.6]; cl = [40.2, .9, -2.2]; self.focusPoint = new THREE.Vector3(40.4, 1.2, -1.8);
    } else {   // rename: the banner goes up, the troop cheers
      armed.root.visible = true; armed.root.position.set(-.4, 0, -.6); armed.frame(t > T.banner + .3 ? (Math.floor(t * 3) % 2 ? 'victory' : 'idle0') : 'point');
      const up = eo(seg(t, T.banner, T.banner + 1.0)); flag.position.set(1.6 + .6, 1.0 + up * 1.7, -1.6); flag.rotation.y = Math.sin(t * 2) * .15;
      troop.forEach((m, i) => m.frame(t > T.banner + .2 && Math.floor(t * 4 + i) % 2 ? 'laugh' : idle(i * .3)));
      cp = [-.6 + lt * .1, 3.8, 8.2]; cl = [.2, 1.6, -1.2]; self.focusPoint = new THREE.Vector3(.6, 1.6, -1.2);
    }
    cam.position.set(...cp); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(...cl);
    for (const c of [monkey, armed, master, egg, form, ride, ...troop]) if (c.root.visible) c.face(cam);
    const fp = monkey.root.visible ? monkey.root.position : armed.root.position; fill.position.copy(fp).add(new THREE.Vector3(.8, 2, 2.6));
    spray.userData.update(t); poof.userData.update(t); streak.userData.update(t);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = 240; post.dof.maxCoc = 16;
    renderer.toneMappingExposure = 1.05; post.vig.uniforms.warm.value = .1;
  }
  return self;
}
