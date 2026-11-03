// Set — the Buddha's palm above golden clouds. Shots: buddha, flight, reveal (signature pull-back), final.
// The "five pillars at the end of the sky" are the fingers of a hand; the reveal pulls back until the hand and the Buddha fill the frame.
import * as THREE from 'three';
import { h2, glow, rock } from './px.js';
import { mat, mesh } from './kit.js';
import { sky, particles } from './fx.js';
import { makeChar } from './chars.js';
import { makeBuddha, makeCloudRide } from './creatures.js';
import { T } from './story.js';
import { seg, ss, eio, eo, ei, lerp, track } from '/core/lib.js';

export function buildPalm() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#f4dca0', .02);
  const SK = sky({ top: '#c88a3a', mid: '#f0c070', hor: '#fff0c8', moonDir: new THREE.Vector3(0, .35, -1), moonCol: '#fffbe8', moonI: 1.6 }); scene.add(SK.mesh);
  const cloud = particles(320, (i, t, o) => { const a = h2(i, 1, 6) * 6.28, r = 10 + h2(i, 2, 6) * 60; o.x = Math.cos(a + t * .004) * r; o.z = Math.sin(a + t * .004) * r - 20; o.y = -3 - h2(i, 3, 6) * 4; o.a = .75; o.s = 6 + h2(i, 4, 6) * 6; o.r = 1; o.g = .9; o.b = .7; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(cloud);
  // the Buddha (huge billboard) and his halo
  const bud = makeBuddha(); bud.root.scale.setScalar(16); bud.mesh.material.fog = false; bud.root.position.set(0, -16, -66); scene.add(bud.root);
  const halo = glow('#fff4c0', 46, .22); halo.position.set(0, 30, -72); scene.add(halo);
  // the hand: palm platform + five vertical fingers at the far edge + thumb
  const skin = new THREE.MeshStandardMaterial({ color: '#f0c060', roughness: .55, metalness: .25, emissive: '#a06a10', emissiveIntensity: .25 });
  const hand = new THREE.Group(); scene.add(hand);
  const palm = new THREE.Mesh(new THREE.BoxGeometry(14, 2.4, 16, 6, 1, 6).translate(0, -1.2, 0), skin); palm.receiveShadow = palm.castShadow = true; hand.add(palm);
  { const p = palm.geometry.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > -.1) p.setY(i, -Math.pow(p.getX(i) / 7, 2) * .6 - Math.pow(p.getZ(i) / 8, 2) * .4); } palm.geometry.computeVertexNormals(); }
  const FING = [[-5.2, 15], [-2.6, 19], [0, 21], [2.6, 19], [5.2, 15]].map(([x, hgt]) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.2, hgt, 14).translate(0, hgt / 2, 0), skin); f.position.set(x, -.5, -7.2); f.castShadow = true; hand.add(f); const tip = new THREE.Mesh(new THREE.SphereGeometry(1.05, 14, 10), skin); tip.position.set(x, -.5 + hgt, -7.2); hand.add(tip); return f; });
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 9, 12).translate(0, 4.5, 0), skin); thumb.rotation.z = -.9; thumb.position.set(7, -.5, 2); hand.add(thumb);
  hand.position.set(0, 0, 0);
  // the writing on the middle finger (a gold calligraphy strip appears)
  const ink = new THREE.Mesh(new THREE.PlaneGeometry(.5, 3.4), new THREE.MeshBasicMaterial({ color: '#2a1408', transparent: true, opacity: 0 })); ink.position.set(0, 3.8, -6.1); hand.add(ink);
  // the Five Elements Mountain that replaces the hand at the slam
  const rockM = mat(rock(128, 128, { seed: 21, cols: ['#3a2a1a', '#5a4228', '#7a5a34', '#9a7640', '#b8945a', '#d0b070'] }));
  const mount = new THREE.Group(); scene.add(mount);
  [[-5.2, 15], [-2.6, 19], [0, 22], [2.6, 19], [5.2, 15]].forEach(([x, hgt]) => { const c = mesh(new THREE.ConeGeometry(4, hgt, 8).translate(0, hgt / 2, 0), rockM); c.position.set(x, -1, -4); mount.add(c); });
  mount.add(mesh(new THREE.CylinderGeometry(11, 14, 6, 12).translate(0, 1, -2), rockM));
  const pin = mesh(new THREE.DodecahedronGeometry(1.7, 0), rockM); pin.position.set(.1, -1.4, 14.2); mount.add(pin);   // the slab that pins him: only his head shows
  const dust = particles(200, (i, t, o) => { const u = t - T.slam; o.a = 0; if (u < 0 || u > 3) return; const a = h2(i, 1, 2) * 6.28, r = 2 + u * 9 * h2(i, 2, 2); o.x = Math.cos(a) * r; o.z = -2 + Math.sin(a) * r * .6; o.y = .5 + u * 2 * h2(i, 3, 2); o.a = (1 - u / 3) * .8; o.s = 2.2; o.r = .9; o.g = .8; o.b = .6; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(dust);
  const wk = makeChar('wukong', { track: 1 }); scene.add(wk.root); const ride = makeCloudRide(); scene.add(ride.root);
  const trail = particles(100, (i, t, o) => { o.a = 0; const k = i / 100, tt = t - k * .4; const p = flightPos(tt); if (!p || tt < T.launch) return; o.x = p.x; o.y = p.y + .3; o.z = p.z; o.a = (1 - k) * .8; o.s = .25; o.r = 1; o.g = .95; o.b = .7; }, { soft: 1 });
  scene.add(trail);
  scene.add(new THREE.HemisphereLight('#fff4d8', '#b08850', 1.5));
  const sun = new THREE.DirectionalLight('#fff0c8', 2.2); sun.position.set(-20, 40, 30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 25, bottom: -10, far: 120 }); scene.add(sun);
  const fill = new THREE.PointLight('#fff0e0', 3, 10, 2); scene.add(fill);
  // flight path: from the palm centre over the "endless" clouds to the finger bases and back (in fog, they read as distant pillars)
  function flightPos(t) {
    if (t < T.launch) return new THREE.Vector3(0, .1, 4);
    if (t < T.pillars) { const u = eio(seg(t, T.launch, T.pillars)); return new THREE.Vector3(Math.sin(u * 3) * 1.5, .1 + Math.sin(u * Math.PI) * 6, lerp(4, -4.6, u)); }
    if (t < T.back) return new THREE.Vector3(.6, .1, -4.6);
    const u = eio(seg(t, T.back, T.back + 1.6)); return new THREE.Vector3(lerp(.6, 0, u), .1 + Math.sin(u * Math.PI) * 5, lerp(-4.6, 4, u));
  }
  const self = { scene, update, focusPoint: null, hud: null, popups: [], tags: [] };
  function update(t, shot, cam, post, renderer) {
    const id = shot.id, lt = t - shot.a, idle = (o = 0) => Math.floor(t * 1.6 + o) % 2 ? 'idle1' : 'idle0';
    // fog thick during the flight (fingers read as far-off pillars), clearing for the reveal
    scene.fog.density = id === 'flight' ? .06 : id === 'reveal' ? lerp(.06, .008, ss(seg(t, T.pull, T.pull + 3.5))) : .004;
    // hand flip + slam → mountain
    const fl = id === 'reveal' || id === 'final' ? eio(seg(t, T.flip, T.slam)) : 0, slammed = t >= T.slam && (id === 'reveal' || id === 'final');
    hand.visible = !slammed; mount.visible = slammed;
    hand.rotation.set(0, 0, fl * Math.PI); hand.position.set(0, fl * 14 * Math.sin(fl * Math.PI) + (fl > .5 ? 8 * (1 - fl) * 2 : 0), 0);
    // monkey
    let p = flightPos(t), f = idle();
    if (id === 'buddha') { p = new THREE.Vector3(0, .1, 4); f = t > 147 ? 'laugh' : idle(); }
    if (id === 'flight') { f = t < T.launch ? 'laugh' : t >= T.pillars && t < T.back ? (t > T.write - .5 && t < T.write + 1.2 ? 'slash1' : 'laugh') : 'victory'; }
    if (id === 'reveal') { p = new THREE.Vector3(0, .1, 4); f = t > T.flip - .4 ? 'hurt' : 'laugh'; }
    if (id === 'final') { p = new THREE.Vector3(0, -1.25, 12.9); f = Math.floor(t * .8) % 3 === 0 ? 'hurt' : 'idle0'; }
    wk.root.visible = !(slammed && id === 'reveal'); wk.root.position.copy(p); wk.frame(f);
    const flying = id === 'flight' && ((t > T.launch && t < T.pillars) || t > T.back); ride.root.visible = flying; ride.root.position.copy(p).add(new THREE.Vector3(0, -.2, .05));
    ink.material.opacity = t > T.write ? ss(seg(t, T.write, T.write + 1.0)) : 0;
    // camera
    let cp, cl;
    if (id === 'buddha') { const k = track([[0, [0, 30, 60]], [4, [0, 14, 34]], [10.6, [2, 6, 16]]]), l = track([[0, [0, 8, -40]], [4, [0, 4, -16]], [10.6, [0, 1.2, 0]]]); cp = k(lt); cl = l(lt); }
    else if (id === 'flight') { const q = flightPos(t); cp = [q.x + 2.4, q.y + 2.2, q.z + 6.4]; cl = [q.x, q.y + 1.0, q.z - 3]; }
    else if (id === 'reveal') { const k = track([[0, [1.2, 2.6, 2.0]], [.9, [1.2, 2.6, 2.0]], [4.6, [0, 22, 48]], [10.28, [0, 26, 56]]]), l = track([[0, [.4, 3.4, -6]], [.9, [.4, 3.4, -6]], [4.6, [0, 4, -16]], [10.28, [0, 2, -10]]]); cp = k(lt); cl = l(lt); }
    else { const k = track([[0, [0, 20, 46]], [6, [0, 6, 24]], [14.4, [.4, .1, 18.0]]]), l = track([[0, [0, 6, -4]], [6, [0, 2, 8]], [14.4, [0, -2.4, 12.2]]]); cp = k(lt); cl = l(lt); }
    const sh = (t > T.slam && t < T.slam + 1.2 ? .5 * (1 - (t - T.slam) / 1.2) : 0);
    cam.position.set(cp[0] + Math.sin(t * 91) * sh, cp[1] + Math.cos(t * 77) * sh, cp[2]); cam.fov = 42; cam.updateProjectionMatrix(); cam.lookAt(...cl);
    wk.face(cam); ride.face(cam); bud.face(cam);
    bud.root.visible = !(id === 'flight' || (id === 'reveal' && lt < 1.6));
    fill.position.copy(wk.root.position).add(new THREE.Vector3(.8, 2, 2.6));
    cloud.userData.update(t); trail.userData.update(t); trail.visible = id === 'flight'; dust.userData.update(t);
    self.tags = id === 'flight' && t > T.write + .3 && t < T.back ? [{ p: new THREE.Vector3(0, 3.6, -6.0), l1: 'เขียนไว้ว่า', l2: 'ฉีเทียนไต้เซียมาถึงที่นี่', age: t - T.write - .3, small: 1 }] : [];
    self.focusPoint = id === 'reveal' && lt > 1.5 ? new THREE.Vector3(0, 4, -8) : id === 'buddha' && lt < 4 ? new THREE.Vector3(0, 4, -20) : wk.root.position.clone().setY(wk.root.position.y + 1.2);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = id === 'reveal' ? 120 : 220; post.dof.maxCoc = 14; self.tiltC = null;
    renderer.toneMappingExposure = 1.0; post.vig.uniforms.warm.value = .2; post.bloom.threshold = .9;
  }
  return self;
}
