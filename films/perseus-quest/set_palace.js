// Set C — Polydectes' hall at night. Indigo ambient, four amber braziers along the columns.
// Shots: palace (quest given), stoneKing (the same frame later: the king turned to stone).
import * as THREE from 'three';
import { PX, ramp, h2, fbm, cobbles, glow, mulberry, hex } from './px.js';
import { mat, mesh, box, fire } from './kit.js';
import { particles, flick } from './fx.js';
import { makeChar } from './chars.js';
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
  scene.add(new THREE.HemisphereLight('#5a6aa8', '#201628', 1.5));
  const moon = new THREE.DirectionalLight('#7088d8', .5); moon.position.set(-6, 14, 8); scene.add(moon);
  const king = makeChar('polydectes', { scale: 1.15 }); scene.add(king.root); king.root.position.set(0, .9, -8.2);
  const per = makeChar('perseus', { track: 1 }), perG = makeChar('perseusG', { track: 1 }); scene.add(per.root, perG.root);
  const fill = new THREE.PointLight('#c8b8e8', 1.4, 7, 2); scene.add(fill);
  const kfill = new THREE.PointLight('#e8c8a8', 1.6, 6, 2); scene.add(kfill);
  const embers = particles(70, (i, t, o) => { const b = i % 4, x0 = (b % 2 ? 1 : -1) * 3.1, z0 = b < 2 ? -2.3 : 1.7, u = ((t * .35 + h2(i, 1, 6)) % 1); o.x = x0 + Math.sin(u * 9 + i) * .25; o.y = 1.4 + u * 3; o.z = z0 + Math.cos(u * 7 + i) * .2; o.a = (1 - u) * .9; o.s = .035; o.r = 1; o.g = .6; o.b = .2; });
  scene.add(embers);
  // stone flash
  const flash = new THREE.PointLight('#a0ffb0', 0, 12, 1.5); scene.add(flash);
  const C = {
    palace: { p: track([[0, [0, 11, 14]], [5, [.6, 6.6, 8.5]], [11.8, [1.6, 4.4, 4.2]]]), l: track([[0, [0, 1, -5]], [5, [0, 1.4, -5]], [11.8, [.1, 1.7, -6.2]]]) },
    stoneKing: { p: track([[0, [1.4, 4.6, 4.4]], [5, [1.0, 4.2, 3.6]]]), l: track([[0, [.1, 1.7, -6.2]], [5, [0, 1.8, -6.6]]]) },
  };
  const self = { scene, update, focusPoint: null };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, c = C[shot.id];
    cam.position.set(...c.p(lt)); cam.fov = 38; cam.updateProjectionMatrix(); cam.lookAt(...c.l(lt));
    const stoneScene = shot.id === 'stoneKing';
    per.root.visible = !stoneScene; perG.root.visible = stoneScene;
    const P = stoneScene ? perG : per;
    let z, f = Math.floor(t * 1.5) % 2 ? 'idle1' : 'idle0';
    if (!stoneScene) { const w = seg(lt, .4, 6.2); z = lerp(5.5, -4.6, eo(w)); if (lt > .4 && lt < 6.2) f = ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4]; else if (lt > 7.6) f = 'look'; }
    else { z = -4.6; f = lt > .6 ? (Math.floor(t * 1.5) % 2 ? 'hold1' : 'hold') : 'idle0'; }
    P.root.position.set(.15, 0, z); P.frame(f); P.face(cam, true);   // faces the throne (away from camera side), flipped to look left/back
    P.mesh.scale.x = 1;
    // the king: points at Perseus while speaking; later stone
    const speaking = !stoneScene && t > 26.6 && t < 29.6;
    king.frame(speaking ? (Math.floor(t * 6) % 2 ? 'point' : 'point1') : (Math.floor(t * 1.2) % 4 === 3 ? 'blink' : Math.floor(t * 1.2) % 2 ? 'idle1' : 'idle0'));
    if (stoneScene && t > T.kingStone) king.frame(king._f === 'blink' ? 'idle0' : king._f);
    king.petrify(stoneScene && t > T.kingStone); king.face(cam);
    flash.intensity = stoneScene ? 30 * Math.max(0, 1 - Math.abs(t - T.kingStone) / .35) : 0; flash.position.set(.3, 2.6, -5.8);
    fill.position.set(P.root.position.x + .6, 1.8, P.root.position.z + 2.4); kfill.position.set(.4, 2.8, -6.2);
    for (const b of braz) { const k = flick(t, b.seed); b.L.intensity = 3.6 * k; b.f.userData.update(t, cam, .85 + .15 * k); }
    thrL.intensity = 2.6 * flick(t, 9);
    embers.userData.update(t);
    // focus: Perseus while he walks, then the king (rack focus at the end of each shot)
    const toKing = stoneScene ? ss(seg(lt, .2, 1.4)) : ss(seg(lt, 6.4, 7.4));
    const fp = P.root.position.clone().setY(1).lerp(king.root.position.clone().setY(2), toKing);
    self.focusPoint = fp;
    post.dof.focus = cam.position.distanceTo(fp); post.dof.aper = 300; post.dof.maxCoc = 18;
    post.vig.uniforms.warm.value = .15;
  }
  return self;
}
