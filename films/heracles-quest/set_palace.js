// Set — King Eurystheus' hall (night, indigo + amber braziers) and his bronze jar.
// Shots: palace (Hera's curse, penance quest), jar1 (lion delivered, king dives into the jar), notCounted, jar2 (Cerberus).
import * as THREE from 'three';
import { PX, ramp, h2, fbm, cobbles, glow, mulberry, hex } from './px.js';
import { mat, mesh, box, fire } from './kit.js';
import { particles, flick } from './fx.js';
import { makeChar } from './chars.js';
import { makeCerberusBody, makeCerberusHead } from './monsters.js';
import { T } from './story.js';
import { seg, ss, eio, eo, lerp, track } from '/core/lib.js';

function marble(w, h, seed) {
  const P = new PX(w, h), R = ramp(['#2a2834', '#3e3a4a', '#575164', '#6e687c', '#8a8496']), cell = 24;
  P.fill((x, y) => { const tx = x % cell, ty = y % cell, chk = ((x / cell | 0) + (y / cell | 0)) % 2; let v = (chk ? .55 : .4) + (fbm(x * .05, y * .05, seed) - .5) * .3; const vein = Math.abs(Math.sin(x * .08 + fbm(x * .04, y * .04, seed + 3) * 9)); if (vein < .06) v += .2; if (tx === 0 || ty === 0) v = .08; return R(v, x, y); });
  return P.done();
}
function stoneWall(w, h, seed) {
  const P = new PX(w, h), R = ramp(['#16141e', '#22202c', '#302c3a', '#3e3a4a']);
  P.fill((x, y) => { const row = y / 8 | 0, off = row % 2 ? 8 : 0, xx = (x + off) % 16, yy = y % 8; let v = .45 + (h2((x + off) / 16 | 0, row, seed) - .5) * .4 + (fbm(x * .1, y * .1, seed) - .5) * .2; if (xx === 0 || yy === 0) v = .05; return R(v, x, y); });
  return P.done();
}
function banner(w, h) {
  const P = new PX(w, h), R = ramp(['#1c0c24', '#36163e', '#55245c', '#743a78']), G = ramp(['#8a6214', '#c89a28', '#f0cc58']);
  P.fill((x, y) => { if (y > h - 6 && (x % 6 > 2) && y > h - 6 + (x % 6 === 3 ? 0 : 2)) return null; if (x < 2 || x > w - 3 || y < 2) return G(.6, x, y); const cx = w / 2, cy = h * .45; if (Math.abs(Math.hypot(x - cx, (y - cy) * 1.1) - 5) < 1) return G(.8, x, y); return R(.5 + (x / w - .5) * .3 - y / h * .2, x, y); });
  return P.done();
}

export function buildPalace() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#141a34', .028); scene.background = new THREE.Color('#080a16');
  const floorM = mat(marble(96, 96, 2)), wallM = mat(stoneWall(64, 64, 3));
  const colM = new THREE.MeshStandardMaterial({ map: mat(marble(48, 96, 7)).map, roughness: .7, color: '#c8c0d8' });
  scene.add(mesh(new THREE.BoxGeometry(14, .4, 28).translate(0, -.2, -2), floorM));
  scene.add(mesh(new THREE.BoxGeometry(14, 10, .6).translate(0, 5, -12), wallM));
  for (const s of [-1, 1]) scene.add(mesh(new THREE.BoxGeometry(.6, 10, 28).translate(s * 7, 5, -2), wallM));
  // dais + throne
  const dais = box(5, .5, 3, floorM); dais.position.set(0, 0, -8.5); scene.add(dais);
  const dais2 = box(3.4, .4, 2, floorM); dais2.position.set(0, .5, -9); scene.add(dais2);
  const gold = new THREE.MeshStandardMaterial({ color: '#c89a38', metalness: .7, roughness: .35 });
  const thr = new THREE.Group(); thr.position.set(0, .9, -9.4); scene.add(thr);
  thr.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1.3, .6, 1).translate(0, .3, 0), gold), { castShadow: true }), Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, .2).translate(0, 1.1, -.45), gold), { castShadow: true }));
  // carpet
  const carpetC = new PX(16, 64), CR = ramp(['#3a0a20', '#5c1230', '#7c1c3c']); carpetC.fill((x, y) => (x < 2 || x > 13 ? ramp(['#8a6214', '#c89a28'])(.6, x, y) : CR(.5 + (fbm(x * .3, y * .3, 4) - .5) * .4, x, y)));
  const carpet = mesh(new THREE.BoxGeometry(2.2, .02, 15).translate(0, .01, -1), mat(carpetC.done()), { cast: false }); scene.add(carpet);
  // columns with banners, braziers between
  const braz = [];
  for (const z of [-6.5, -2.5, 1.5]) for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, 8, 12).translate(0, 4, 0), colM); c.castShadow = c.receiveShadow = true; c.position.set(s * 4.4, 0, z); scene.add(c);
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.6), new THREE.MeshStandardMaterial({ map: mat(banner(20, 52)).map, alphaTest: .5, side: THREE.DoubleSide })); ban.position.set(s * 6.65, 4.4, z); ban.rotation.y = -s * Math.PI / 2; scene.add(ban);
    if (z > -6) {
      const g = new THREE.Group(); g.position.set(s * 3.1, 0, z + .2);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.38, .2, .3, 10).translate(0, 1.15, 0), gold), leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .09, 1.05, 6).translate(0, .52, 0), gold); bowl.castShadow = leg.castShadow = true;
      const f = fire(.8, { seed: braz.length * 2, i: 3.3 }); f.position.y = 1.25;
      const L = new THREE.PointLight('#ffa850', 4, 10, 2); L.position.set(0, 1.7, .5); if (z > 0) { L.castShadow = true; L.shadow.bias = -.004; L.shadow.mapSize.set(512, 512); }
      const h = glow('#ffb060', 1.5, .8); h.position.y = 1.5; g.add(bowl, leg, f, L, h); scene.add(g); braz.push({ f, L, seed: braz.length * 1.7 });
    }
  }
  // throne light (the king's own glow)
  const thrL = new THREE.PointLight('#ffc070', 3, 8, 2); thrL.position.set(0, 3, -7); scene.add(thrL);
  scene.add(new THREE.HemisphereLight('#6a7ab8', '#281c30', 1.8));
  const moon = new THREE.DirectionalLight('#7088d8', .5); moon.position.set(-6, 14, 8); scene.add(moon);
  // the bronze jar (pithos) beside the throne
  const bronze = new THREE.MeshStandardMaterial({ color: '#a8743a', metalness: .75, roughness: .35 });
  const jarPts = [[.0, 0], [.42, .02], [.62, .4], [.7, .8], [.62, 1.2], [.42, 1.45], [.38, 1.6], [.46, 1.66], [.4, 1.7]].map(([r, y]) => new THREE.Vector2(r, y));
  const jar = new THREE.Mesh(new THREE.LatheGeometry(jarPts, 20), bronze); jar.castShadow = jar.receiveShadow = true; jar.position.set(2.0, .9, -8.0); scene.add(jar);
  const jarMouth = new THREE.Mesh(new THREE.CircleGeometry(.4, 20), new THREE.MeshBasicMaterial({ color: '#100a06' })); jarMouth.rotation.x = -Math.PI / 2; jarMouth.position.set(2.0, .9 + 1.69, -8.0); scene.add(jarMouth);
  const king = makeChar('eurystheus', { scale: .95 }); scene.add(king.root);
  const her = makeChar('heracles', { track: 1 }), herL = makeChar('heraclesL', { track: 1 }), iol = makeChar('iolaus'); scene.add(her.root, herL.root, iol.root);
  const cb = makeCerberusBody(.95), cheads = [0, 1, 2].map(() => makeCerberusHead()); scene.add(cb.root); cheads.forEach(h => { h.mesh.scale.setScalar(.45); scene.add(h.root); });
  const fill = new THREE.PointLight('#c8b8e8', 2.0, 7, 2); scene.add(fill);
  const kfill = new THREE.PointLight('#e8c8a8', 1.8, 6, 2); scene.add(kfill);
  const embers = particles(70, (i, t, o) => { const b = i % 4, x0 = (b % 2 ? 1 : -1) * 3.1, z0 = b < 2 ? -2.3 : 1.7, u = ((t * .35 + h2(i, 1, 6)) % 1); o.x = x0 + Math.sin(u * 9 + i) * .25; o.y = 1.4 + u * 3; o.z = z0 + Math.cos(u * 7 + i) * .2; o.a = (1 - u) * .9; o.s = .035; o.r = 1; o.g = .6; o.b = .2; });
  scene.add(embers);
  // Hera's curse: a violet light and a spiral of motes around the hero
  const curseL = new THREE.PointLight('#c060ff', 0, 10, 1.5); scene.add(curseL);
  const curse = particles(140, (i, t, o) => { const u = t - T.curse; o.a = 0; if (u < 0 || u > 4.5) return; const a = i * .7 + u * 3, r = 1.6 - Math.min(1.2, u * .5) + h2(i, 1, 3) * .4; o.x = -.2 + Math.cos(a) * r; o.z = -3.2 + Math.sin(a) * r * .6; o.y = .2 + ((h2(i, 2, 3) * 3 + u * 1.2) % 3); o.a = Math.min(1, u * 2) * (1 - Math.max(0, u - 3.5)) * .9; o.s = .06; o.r = .8; o.g = .4; o.b = 1; }, { soft: 1 });
  scene.add(curse);
  const C = {
    palace: { p: track([[0, [0, 11, 14]], [4, [.8, 6.0, 7.8]], [10.6, [1.4, 4.6, 5.0]]]), l: track([[0, [0, 1, -5]], [4, [0, 1.3, -4.4]], [10.6, [.4, 1.7, -6.0]]]) },
    jar1: { p: track([[0, [-1.4, 5.0, 6.0]], [5.6, [.2, 4.4, 4.2]]]), l: track([[0, [0, 1.4, -5.0]], [5.6, [1.0, 1.9, -6.8]]]) },
    notCounted: { p: track([[0, [1.0, 4.6, 4.0]], [5.2, [.6, 4.2, 3.4]]]), l: track([[0, [.2, 1.8, -6.6]], [5.2, [.2, 1.9, -6.8]]]) },
    jar2: { p: track([[0, [-1.4, 5.0, 6.0]], [4.8, [.2, 4.4, 4.2]]]), l: track([[0, [0, 1.4, -5.0]], [4.8, [1.0, 1.9, -6.8]]]) },
  };
  const self = { scene, update, focusPoint: null, hud: null, popups: [] };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, c = C[shot.id], id = shot.id;
    cam.position.set(...c.p(lt)); cam.fov = 38; cam.updateProjectionMatrix(); cam.lookAt(...c.l(lt));
    const walk = t => ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4], idle = t => Math.floor(t * 1.5) % 2 ? 'idle1' : 'idle0';
    // hero version + staging
    const H = id === 'palace' ? her : herL; her.root.visible = H === her; herL.root.visible = H === herL;
    let hz = -4.4, hf = idle(t);
    if (id === 'palace') { const w = seg(lt, .4, 4.0); hz = lerp(4.5, -4.2, eo(w)); if (w > 0 && w < 1) hf = walk(t); if (t > T.curse && t < T.curse + 3.6) hf = Math.floor(t * 7) % 3 ? 'hurt' : 'idle1'; }
    if (id === 'jar1' || id === 'jar2') { const w = seg(lt, 0, 2.4); hz = lerp(2.5, -4.6, eo(w)); hf = id === 'jar1' ? (w < 1 ? (Math.floor(t * 8) % 2 ? 'carry' : 'carry1') : 'carry') : (w < 1 ? walk(t) : idle(t)); }
    if (id === 'notCounted') { hz = -4.4; hf = 'idle0'; }
    H.root.position.set(-.3, 0, hz); H.frame(hf); H.face(cam);
    iol.root.visible = id === 'notCounted'; if (iol.root.visible) { iol.root.position.set(-1.4, 0, -4.0); iol.frame(idle(t + .3)); iol.face(cam); }
    // Cerberus on a leash (jar2)
    cb.root.visible = id === 'jar2'; cheads.forEach(h => h.root.visible = cb.root.visible);
    if (cb.root.visible) { cb.root.position.set(-1.6, 0, hz + 1.0); cb.face(cam, true); cheads.forEach((h, i) => { h.root.position.set(-1.6 + .1 + i * .28 - .2, .95 + (i === 1 ? .2 : 0) + Math.sin(t * 6 + i) * .04, hz + 1.25); h.frame(Math.floor(t * 3 + i) % 4 === 0 ? 'open' : 'idle'); h.face(cam, true); }); }
    // the king: throne → panics → dives into the jar (and peeks out)
    const dive = id === 'jar1' ? T.jarDive1 : id === 'jar2' ? T.jarDive2 : null;
    let kx = 0, ky = .9, kz = -8.2, kf = Math.floor(t * 1.2) % 4 === 3 ? 'blink' : idle(t);
    if (id === 'palace' && t > T.questIn - .4) kf = Math.floor(t * 5) % 2 ? 'point' : 'point1';
    if (id === 'notCounted') kf = Math.floor(t * 5) % 2 ? 'point' : 'point1';
    if (dive != null) {
      if (t > dive - 1.6) kf = 'scared';
      const run = seg(t, dive - 1.0, dive - .2), hop = seg(t, dive - .2, dive + .25), sink = seg(t, dive + .25, dive + .5);
      kx = lerp(0, 2.0, eo(run)); kz = lerp(-8.2, -8.0, run); ky = .9 + Math.sin(hop * Math.PI) * 1.4 + hop * 1.0 - sink * 1.9;
      if (t > dive + .5) { const peek = Math.max(0, Math.sin((t - dive - 1.6) * 1.3)); ky = .9 + .05 + peek * .55; kf = 'scared'; }
    }
    king.root.position.set(kx, ky, kz); king.frame(kf); king.face(cam); king.shadowBlob.visible = ky < 1.0 && kx < .5;
    // curse light
    const cu = t - T.curse; curseL.intensity = id === 'palace' && cu > 0 && cu < 4.5 ? 8 * Math.sin(Math.min(1, cu / 4.5) * Math.PI) : 0; curseL.position.set(-.2, 2.6, -3.0);
    curse.userData.update(t); curse.visible = id === 'palace';
    fill.position.set(.3, 1.8, hz + 2.4); kfill.position.set(.8, 2.8, -6.0);
    for (const b of braz) { const k = flick(t, b.seed); b.L.intensity = 3.6 * k; b.f.userData.update(t, cam, .85 + .15 * k); }
    thrL.intensity = 2.6 * flick(t, 9); embers.userData.update(t);
    const fp = id === 'palace' && lt < 6 ? H.root.position.clone().setY(1) : king.root.position.clone().setY(ky + 1);
    self.focusPoint = fp; post.dof.focus = cam.position.distanceTo(fp); post.dof.aper = 280; post.dof.maxCoc = 18;
    post.vig.uniforms.warm.value = .15;
  }
  return self;
}
