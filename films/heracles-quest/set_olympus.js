// Set — Olympus above the clouds (bright gold-blue daylight). Shots: olympus (character creation, Zeus, Hera),
// wedding (ascension + Hebe), final (Hera steps beside them: mother-in-law; title).
import * as THREE from 'three';
import { PX, ramp, h2, fbm, glow, mulberry } from './px.js';
import { mat, mesh, box } from './kit.js';
import { sky, particles, beamCard } from './fx.js';
import { makeChar } from './chars.js';
import { T } from './story.js';
import { seg, ss, eio, eo, lerp, track } from '/core/lib.js';

function marble(w, h, seed) { const P = new PX(w, h), R = ramp(['#8a8698', '#a8a4b4', '#c4c0cc', '#dcd8e2', '#f0eef4']); P.fill((x, y) => { let v = .55 + (fbm(x * .06, y * .06, seed) - .5) * .4; if (Math.abs(Math.sin(x * .1 + fbm(x * .04, y * .04, seed + 2) * 8)) < .05) v -= .25; if (x % 24 === 0 || y % 24 === 0) v = .2; return R(v, x, y); }); return P.done(); }

export function buildOlympus() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#e8dcc8', .012);
  const SK = sky({ top: '#3a6ab0', mid: '#8ab4e0', hor: '#ffe8c0', moonDir: new THREE.Vector3(-.3, .5, -1), moonCol: '#fff4d0', moonI: 1.4 }); scene.add(SK.mesh);
  const mM = mat(marble(96, 96, 2));
  for (let i = 0; i < 3; i++) { const r = 7 - i * 1.4; scene.add(mesh(new THREE.CylinderGeometry(r, r + .2, .4, 40).translate(0, -.2 + i * .4, -1), mM)); }
  const gold = new THREE.MeshStandardMaterial({ color: '#e0b850', metalness: .6, roughness: .35 }), colM = new THREE.MeshStandardMaterial({ color: '#f0ece4', roughness: .5 });
  for (let i = 0; i < 9; i++) { const a = Math.PI + .25 + i / 8 * (Math.PI - .5); const c = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, 6, 14).translate(0, 3, 0), colM); c.position.set(Math.cos(a) * 6.2, .8, -1 + Math.sin(a) * 6.2); c.castShadow = true; scene.add(c); const cap = new THREE.Mesh(new THREE.BoxGeometry(.9, .3, .9).translate(0, 6.15, 0), gold); cap.position.copy(c.position); scene.add(cap); }
  // thrones
  const thrones = [[-1.3, -4.2], [1.3, -4.2]].map(([x, z]) => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, .55, .9).translate(0, .28, 0), gold), new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.4, .18).translate(0, 1.2, -.42), gold)); g.children.forEach(m => m.castShadow = true); g.position.set(x, 1.2, z); scene.add(g); return g; });
  // pedestal for character creation
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(.8, .9, .3, 24).translate(0, .15, 0), gold); ped.position.set(0, 1.2, -.2); ped.castShadow = true; scene.add(ped);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, .04, 8, 40), new THREE.MeshBasicMaterial({ color: '#fff0b0', transparent: true, blending: THREE.AdditiveBlending, fog: false })); ring.rotation.x = Math.PI / 2; scene.add(ring);
  // cloud sea
  const clouds = particles(260, (i, t, o) => { const a = h2(i, 1, 9) * 6.28 + t * .006, r = 7 + h2(i, 2, 9) * 30; o.x = Math.cos(a) * r; o.z = Math.sin(a) * r - 4; o.y = -.6 - h2(i, 3, 9) * 2.5; o.a = .55; o.s = 3 + h2(i, 4, 9) * 3; o.r = 1; o.g = .97; o.b = .93; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(clouds);
  const petals = particles(90, (i, t, o) => { const u = (t * .12 + h2(i, 1, 4)) % 1; o.x = -4 + h2(i, 2, 4) * 8 + Math.sin(t + i) * .4; o.y = 6 - u * 6 + 1.2; o.z = -3 + h2(i, 3, 4) * 6; o.a = .9; o.s = .06; o.r = 1; o.g = .7; o.b = .8; }, { soft: 0, blend: THREE.NormalBlending });
  scene.add(petals);
  const sun = new THREE.DirectionalLight('#fff4dc', 2.4); sun.position.set(-6, 14, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); scene.add(sun);
  scene.add(new THREE.HemisphereLight('#dce8ff', '#c0a880', 1.4));
  const zeus = makeChar('zeus', { scale: 1.15 }), hera = makeChar('hera', { scale: 1.08 }), hebe = makeChar('hebe'), herY = makeChar('heracles', { track: 1 }), herL = makeChar('heraclesL', { track: 1 });
  scene.add(zeus.root, hera.root, hebe.root, herY.root, herL.root);
  const heraL = new THREE.PointLight('#b060ff', 0, 6, 2); scene.add(heraL);
  const beam = beamCard(9, 1.4, 2.2, '#fff4c0', { k: .5, fall: 1 }); scene.add(beam);
  const create = new THREE.PointLight('#fff0c0', 0, 8, 1.6); scene.add(create);
  const self = { scene, update, focusPoint: null, hud: null, popups: [], tags: [] };
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, id = shot.id, idle = (c, o = 0) => Math.floor(t * 1.4 + o) % 2 ? 'idle1' : 'idle0';
    let cp, cl;
    if (id === 'olympus') { const k = track([[0, [0, 9, 13]], [5, [.4, 4.6, 6.6]], [12, [1.2, 4.0, 5.6]]]), l = track([[0, [0, 1.4, -1]], [5, [0, 2.0, -.6]], [12, [.4, 2.3, -2.0]]]); cp = k(lt); cl = l(lt); }
    else if (id === 'wedding') { const k = track([[0, [0, 3.0, 6.0]], [7.8, [-.4, 3.6, 5.6]]]), l = track([[0, [0, 1.6, -1]], [7.8, [0, 2.3, -1.2]]]); cp = k(lt); cl = l(lt); }
    else { const k = track([[0, [-.4, 3.6, 5.6]], [6, [.8, 3.4, 5.0]], [12.8, [.4, 9, 12]]]), l = track([[0, [0, 2.3, -1.2]], [6, [.6, 2.2, -1.2]], [12.8, [0, 3.0, -2]]]); cp = k(lt); cl = l(lt); }
    cam.position.set(...cp); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(...cl);
    // —— olympus: character creation on the pedestal; Zeus and Hera on their thrones ——
    herY.root.visible = id === 'olympus'; herL.root.visible = id !== 'olympus';
    ped.visible = id === 'olympus';
    ring.visible = id === 'olympus' && lt < 6; ring.position.set(0, 1.5 + (lt % 1.5) * 1.3, -.2); ring.material.opacity = 1 - (lt % 1.5) / 1.5;
    create.position.set(0, 2.6, 1.2); create.intensity = id === 'olympus' ? 6 * Math.max(0, 1 - Math.abs(lt - 1.2) / .6) : 0;
    if (id === 'olympus') { herY.root.position.set(0, 1.5, -.2); herY.frame(lt > 1.2 && lt < 2.2 ? 'victory' : idle()); herY.face(cam); herY.mesh.visible = lt > 1.0; }
    zeus.root.position.set(-1.3, 1.75, -4.1); zeus.frame(Math.floor(t * 1.2) % 2 ? 'idle1' : 'idle0'); zeus.face(cam);
    // Hera: glares on her throne (olympus), absent at the wedding start, steps in at the end
    if (id === 'olympus') { hera.root.visible = true; hera.root.position.set(1.3, 1.75, -4.1); hera.frame(lt > 5.8 ? 'point' : idle(0, .5)); hera.face(cam, true); }
    else if (id === 'wedding') hera.root.visible = false;
    else { hera.root.visible = t > T.hera - 1.5; const w = seg(t, T.hera - 1.5, T.hera); hera.root.position.set(lerp(3.4, 1.55, eo(w)), 1.2, lerp(-1.0, -.6, w)); hera.frame(w < 1 ? idle() : (t > T.hera + 1.2 ? 'idle0' : 'point')); hera.face(cam, true); }
    heraL.position.copy(hera.root.position).add(new THREE.Vector3(-.3, 2.2, 1.4)); heraL.intensity = hera.root.visible ? (id === 'olympus' ? 3 : 2) : 0;
    // wedding: Heracles rises in a beam of light, Hebe beside him
    hebe.root.visible = id !== 'olympus';
    if (id !== 'olympus') {
      const up = id === 'wedding' ? eo(seg(t, T.ascend, T.ascend + 2.0)) : 1;
      herL.root.position.set(-.55, lerp(-1.5, 1.2, up), -.4); herL.frame(id === 'wedding' && up < 1 ? 'victory' : idle()); herL.face(cam);
      hebe.root.position.set(.55, 1.2, -.4); hebe.frame(Math.floor(t * 1.4) % 5 === 4 ? 'blink' : idle(0, .3)); hebe.face(cam, true);
      const bk = id === 'wedding' ? 1 - seg(t, T.ascend + 2.2, T.ascend + 3.4) : 0; beam.visible = bk > 0; beam.userData.aim(new THREE.Vector3(-.55, 10, -.4), new THREE.Vector3(0, -1, 0), cam); beam.material.uniforms.k.value = .5 * bk;
    } else beam.visible = false;
    // name tag over Hera at the end (overlay draws it)
    self.tags = id === 'final' && t > T.hera + .3 && t < T.title - .2 ? [{ p: hera.root.position.clone().setY(hera.root.position.y + 2.5), l1: 'เฮร่า', l2: 'แม่ยาย', age: t - T.hera - .3 }] : [];
    clouds.userData.update(t); petals.userData.update(t); petals.visible = id !== 'olympus';
    self.focusPoint = id === 'olympus' ? (lt < 6 ? new THREE.Vector3(0, 2.2, -.2) : hera.root.position.clone().setY(2.8)) : new THREE.Vector3(0, 2.2, -.4);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = 260; post.dof.maxCoc = 16;
    renderer.toneMappingExposure = 1.05; post.bloom.threshold = .9; post.vig.uniforms.warm.value = .12; post.vig.uniforms.amt.value = .45;
  }
  return self;
}
