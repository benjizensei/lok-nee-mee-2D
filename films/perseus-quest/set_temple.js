// Set D — the gods' temple on a mountaintop, moonlit. Hermes and Athena hand out five items;
// each item pops on as a small light around Perseus (lights popping on one by one), then the set equips.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, glow, mulberry } from './px.js';
import { mat, mesh, box, ridge } from './kit.js';
import { sky, stars, particles } from './fx.js';
import { makeChar, iconSprite } from './chars.js';
import { T } from './story.js';
import { seg, ss, eio, eo, lerp, track } from '/core/lib.js';

function slab(w, h, seed) {
  const P = new PX(w, h), R = ramp(['#3a3c4c', '#555868', '#717486', '#9094a4', '#b0b4c2']);
  P.fill((x, y) => { const tx = x % 16, ty = y % 16; let v = .5 + (h2(x >> 4, y >> 4, seed) - .5) * .3 + (fbm(x * .1, y * .1, seed) - .5) * .25; if (tx === 0 || ty === 0) v = .12; return R(v, x, y); });
  return P.done();
}
export const ITEMS = [
  { id: 'sandals', name: 'รองเท้ามีปีก', from: 'hermes' },
  { id: 'helm', name: 'หมวกล่องหน', from: 'athena' },
  { id: 'harpe', name: 'ดาบเคียวฮาร์พี', from: 'hermes' },
  { id: 'shield', name: 'โล่ขัดเงา', from: 'athena' },
  { id: 'bag', name: 'ย่ามวิเศษ', from: 'hermes' },
];
export function buildTemple() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#3a4466', .014);
  const SK = sky({ top: '#0a1030', mid: '#24305c', hor: '#5a6890', moonDir: new THREE.Vector3(-.4, .5, -1), moonCol: '#eef2ff', moonI: 1.3 }); scene.add(SK.mesh);
  const ST = stars(500, 5); scene.add(ST);
  const slabM = mat(slab(64, 64, 3));
  // round platform + steps
  for (let i = 0; i < 3; i++) { const r = 6.4 + i * .8, c = mesh(new THREE.CylinderGeometry(r, r, .35, 40).translate(0, -.175 - i * .35, 0), slabM); scene.add(c); }
  const colM = new THREE.MeshStandardMaterial({ color: '#d8d8e4', roughness: .6 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + .2; if (Math.sin(a) > -.2) continue; const c = new THREE.Mesh(new THREE.CylinderGeometry(.34, .4, 5.4, 12).translate(0, 2.7, 0), colM); c.position.set(Math.cos(a) * 5.4, 0, Math.sin(a) * 5.4); c.castShadow = c.receiveShadow = true; scene.add(c);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1, .3, 1).translate(0, 5.55, 0), colM); cap.position.copy(c.position); cap.castShadow = true; scene.add(cap); }
  // altar
  const altar = box(1.2, .9, .8, slabM); altar.position.set(0, 0, -2.6); scene.add(altar);
  // cloud sea below + far peaks
  const clouds = particles(220, (i, t, o) => { const a = h2(i, 1, 3) * 6.28, r = 9 + h2(i, 2, 3) * 30; o.x = Math.cos(a + t * .01) * r; o.z = Math.sin(a + t * .01) * r - 4; o.y = -3.5 - h2(i, 3, 3) * 2; o.a = .35; o.s = 2.6 + h2(i, 4, 3) * 2; o.r = .62; o.g = .66; o.b = .82; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(clouds);
  // light
  const moon = new THREE.DirectionalLight('#c8d4ff', 1.4); moon.position.set(-10, 16, -12); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); scene.add(moon);
  scene.add(new THREE.HemisphereLight('#7a88c8', '#2a2c3c', 1.2));
  // gods (glowing gold), Perseus
  const hermes = makeChar('hermes', { scale: 1.1, emI: 1.2 }), athena = makeChar('athena', { scale: 1.1, emI: 1.2 });
  hermes.root.position.set(-2.4, 0, -1.6); athena.root.position.set(2.4, 0, -1.6); scene.add(hermes.root, athena.root);
  const gL = [hermes, athena].map(g => { const L = new THREE.PointLight('#ffd890', 2.4, 6, 2); scene.add(L); const h = glow('#ffe0a0', 2.4, .35); scene.add(h); return { g, L, h }; });
  const per = makeChar('perseus', { track: 1 }), perG = makeChar('perseusG', { track: 1 }); scene.add(per.root, perG.root);
  per.root.position.set(0, 0, .4); perG.root.position.set(0, 0, .4);
  const fill = new THREE.PointLight('#d8e0ff', 1.4, 7, 2); scene.add(fill);
  // items: icon sprites with their own small light
  const items = ITEMS.map((it, i) => { const s = iconSprite(it.id, { scale: 1.3, emI: 1.1 }); const g = new THREE.Group(); g.add(s); scene.add(g); const L = new THREE.PointLight('#fff0c0', 0, 4, 2); scene.add(L); const h = glow('#fff0b0', 1.2, .8); scene.add(h); return { g, s, L, h }; });
  const equipFlash = new THREE.PointLight('#fff4d0', 0, 9, 1.6); scene.add(equipFlash);
  const motes = particles(80, (i, t, o) => { const a = h2(i, 1, 8) * 6.28 + t * .2, r = 1 + h2(i, 2, 8) * 4; o.x = Math.cos(a) * r; o.z = Math.sin(a) * r; o.y = (h2(i, 3, 8) * 4 + t * .3) % 4; o.a = .5 * Math.sin(Math.PI * o.y / 4); o.s = .04; o.r = 1; o.g = .9; o.b = .6; }, { soft: 1 });
  scene.add(motes);
  const self = { scene, update, focusPoint: null };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, D = shot.b - shot.a;
    // half orbit around the platform, high
    const a = lerp(-.95, .9, eio(seg(lt, 0, D))), r = lerp(10.5, 8.6, ss(seg(lt, 0, D))), h = lerp(6.6, 4.4, ss(seg(lt, 0, D)));
    cam.position.set(Math.sin(a) * r, h, .4 + Math.cos(a) * r); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(0, 1.7, -.4);
    const equipped = t > 39.4;
    per.root.visible = !equipped; perG.root.visible = equipped;
    const P = equipped ? perG : per;
    P.frame(Math.floor(t * 1.5) % 2 ? 'idle1' : 'idle0'); P.face(cam);
    for (const [g, at] of [[hermes, T.items.filter((_, i) => ITEMS[i].from === 'hermes')], [athena, T.items.filter((_, i) => ITEMS[i].from === 'athena')]]) {
      const giving = at.some(x => t > x - .4 && t < x + .5); g.frame(giving ? 'give' : Math.floor(t * 1.2) % 2 ? 'idle1' : 'idle0'); g.face(cam, g === athena);
    }
    gL.forEach(({ g, L, h }) => { L.position.copy(g.root.position).add(new THREE.Vector3(0, 2.2, 1.2)); h.position.copy(g.root.position).setY(1.4); });
    // items pop in, orbit Perseus, then fly into him at 39.2
    items.forEach((it, i) => {
      const t0 = T.items[i], on = t > t0, k = eo(seg(t, t0, t0 + .35)), into = eio(seg(t, 38.9, 39.4));
      it.g.visible = on && into < 1; it.h.visible = it.g.visible;
      const ang = i / 5 * Math.PI * 2 + t * .5, rad = 1.6 * (1 - into), y = 2.2 + Math.sin(t * 2 + i) * .12 - into * .9;
      const src = ITEMS[i].from === 'hermes' ? hermes.root.position : athena.root.position;
      const tgt = new THREE.Vector3(Math.cos(ang) * rad, y, .4 + Math.sin(ang) * rad);
      it.g.position.copy(src.clone().setY(2.4).lerp(tgt, k)); it.s.scale.setScalar(.5 + .5 * k);
      it.g.rotation.y = Math.atan2(cam.position.x - it.g.position.x, cam.position.z - it.g.position.z);
      it.L.position.copy(it.g.position).add(new THREE.Vector3(0, 0, .6)); it.L.intensity = on && into < 1 ? 2.2 * (1 + .8 * Math.max(0, 1 - (t - t0) / .4)) : 0;
      it.h.position.copy(it.g.position); it.h.material.opacity = .6 * k;
    });
    equipFlash.position.set(0, 1.6, 1.4); equipFlash.intensity = 22 * Math.max(0, 1 - Math.abs(t - 39.4) / .4);
    fill.position.set(.6, 1.8, 2.6);
    ST.material.uniforms.t.value = t; clouds.userData.update(t); motes.userData.update(t);
    self.focusPoint = P.root.position.clone().setY(1.2);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = 280; post.dof.maxCoc = 18;
    post.vig.uniforms.warm.value = 0; post.vig.uniforms.sat.value = 1.0;
  }
  return self;
}
