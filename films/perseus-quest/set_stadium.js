// Set F/G — the games at Larissa, bright noon with no practicals (nowhere to hide).
// Shots: games (the discus), complete (band narrows on the fallen old man), stars (night falls; the constellation lights star by star).
import * as THREE from 'three';
import { PX, ramp, h2, fbm, glow, mulberry } from './px.js';
import { mat, mesh, box } from './kit.js';
import { sky, stars, particles } from './fx.js';
import { makeChar } from './chars.js';
import { T } from './story.js';
import { clamp, seg, ss, eio, eo, ei, lerp, track } from '/core/lib.js';

function dirt(w, h, seed) { const P = new PX(w, h), R = ramp(['#7a5a3a', '#987450', '#b48e64', '#ccaa7c']); P.fill((x, y) => R(.45 + (fbm(x * .08, y * .08, seed) - .5) * .5 + (h2(x, y, seed) > .97 ? .2 : 0), x, y)); return P.done(); }
function stoneStep(w, h, seed) { const P = new PX(w, h), R = ramp(['#6a6460', '#8a847c', '#a8a298', '#c8c2b4']); P.fill((x, y) => { let v = .5 + (fbm(x * .1, y * .1, seed) - .5) * .4; if (x % 20 === 0 || y % 12 === 0) v = .15; return R(v, x, y); }); return P.done(); }
// Perseus constellation (a simplified figure), in a plane facing the final camera
const CONST = [[0, 3.2], [-.5, 2.4], [.4, 2.3], [0, 1.4], [-1.3, 2.9], [-1.9, 3.6], [1.4, 1.9], [2, 1.1], [-.4, .4], [.6, .2], [-.8, -.6], [.9, -.8]];
const LINKS = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [4, 5], [2, 6], [6, 7], [3, 8], [3, 9], [8, 10], [9, 11]];

export function buildStadium() {
  const scene = new THREE.Scene();
  const fogDay = new THREE.Color('#e8dcc4'), fogNight = new THREE.Color('#0c1228');
  scene.fog = new THREE.FogExp2(fogDay.clone(), .012);
  const SK = sky({ top: '#3a78c8', mid: '#7cb0e0', hor: '#e8e0cc', moonDir: new THREE.Vector3(.3, .9, -.3), moonCol: '#fff8e0', moonI: .5 }); scene.add(SK.mesh);
  const night = { top: new THREE.Color('#03060f'), mid: new THREE.Color('#0a1430'), hor: new THREE.Color('#1c2a50') }, day = { top: SK.u.top.value.clone(), mid: SK.u.mid.value.clone(), hor: SK.u.hor.value.clone() };
  const ST = stars(700, 11); scene.add(ST);
  scene.add(mesh(new THREE.BoxGeometry(40, .4, 30).translate(0, -.2, 0), mat(dirt(96, 96, 3)), { cast: false }));
  // track lines
  const lineM = new THREE.MeshBasicMaterial({ color: '#efe6d0' });
  for (const z of [-1, 1.6]) { const l = new THREE.Mesh(new THREE.BoxGeometry(30, .02, .08).translate(0, .01, z), lineM); scene.add(l); }
  // stands: stepped stone on the far side, seated crowd
  const stepM = mat(stoneStep(80, 48, 5));
  for (let r = 0; r < 5; r++) { const b = box(26, .55 * (r + 1), 1.1, stepM); b.position.set(0, 0, -5.4 - r * 1.1); scene.add(b); }
  const crowd = [], R = mulberry(9), kinds = ['crowdA', 'crowdB', 'crowdC'];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) { if (r === 0 && i === 7) continue; if (R() < .25) continue; const c = makeChar(kinds[(i + r) % 3], { scale: .9 }); c.root.position.set(-9 + i * 1.6 + (R() - .5) * .5, .55 * (r + 1), -5.3 - r * 1.1); c.ph = R() * 6; scene.add(c.root); crowd.push(c); }
  // the old king, front row
  const old = makeChar('acrisius', { scale: .95 }); old.root.position.set(2.2, .55, -5.2); scene.add(old.root);
  // banners on poles
  for (const x of [-11, -4, 4, 11]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 6, 6).translate(0, 3, 0), new THREE.MeshStandardMaterial({ color: '#d8c8a0' })); p.position.set(x, 0, -11); p.castShadow = true; scene.add(p);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .8), new THREE.MeshStandardMaterial({ color: x % 2 ? '#c8a038' : '#3a5a9a', side: THREE.DoubleSide })); f.position.set(x + .7, 5.5, -11); scene.add(f); }
  const per = makeChar('perseus', { track: 1 }); per.root.position.set(-3.4, 0, .4); scene.add(per.root);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .05, 16), new THREE.MeshStandardMaterial({ color: '#b08440', metalness: .7, roughness: .3 })); disc.castShadow = true; scene.add(disc);
  // light: noon sun, then night
  const sun = new THREE.DirectionalLight('#fff4e0', 3.0); sun.position.set(6, 20, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 }); scene.add(sun);
  const hemi = new THREE.HemisphereLight('#c8dcf0', '#8a7050', 1.3); scene.add(hemi);
  const fill = new THREE.PointLight('#fff0e0', .8, 7, 2); scene.add(fill);
  // constellation
  const cg = new THREE.Group(); scene.add(cg);
  const cstars = CONST.map(() => { const g = glow('#e8f0ff', 1.4, 1.1); g.material.fog = false; cg.add(g); return g; });
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(LINKS.length * 6), 3));
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#9fb8ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); cg.add(lines);
  const dust = particles(60, (i, t, o) => { o.x = -8 + h2(i, 1, 4) * 16 + t * .2 % 3; o.y = .2 + h2(i, 2, 4) * 1.5; o.z = -3 + h2(i, 3, 4) * 6; o.a = .25; o.s = .04; o.r = 1; o.g = .95; o.b = .8; }, { soft: 1 });
  scene.add(dust);

  const C = {
    games: { p: track([[0, [-6.5, 5.2, 9.5]], [8.8, [0, 5.6, 9.8]]]), l: track([[0, [-3, 1.2, -1]], [3.6, [-2.4, 1.2, -1.5]], [6, [1, 1.2, -3.6]], [8.8, [2, 1, -4.6]]]) },
    complete: { p: track([[0, [2.6, 4.6, 1.0]], [4.6, [2.3, 6.4, .2]]]), l: track([[0, [2.4, .7, -4.8]], [4.6, [2.3, .7, -5]]]) },
    stars: { p: track([[0, [2.3, 6.4, .2]], [1.2, [2.3, 8, 2]], [10.3, [1.0, 3, 14]]]), l: track([[0, [2.2, .6, -5]], [2.4, [2, 4, -6]], [6, [0, 22, -30]], [10.3, [0, 26, -40]]]) },
  };
  const self = { scene, update, focusPoint: null, tiltC: null };
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, c = C[shot.id];
    cam.position.set(...c.p(lt)); cam.fov = shot.id === 'stars' ? 44 : 38; cam.updateProjectionMatrix(); cam.lookAt(...c.l(lt));
    // day → night during 'stars'
    const n = shot.id === 'stars' ? ss(seg(lt, .2, 2.6)) : 0;
    for (const k of ['top', 'mid', 'hor']) SK.u[k].value.copy(day[k]).lerp(night[k], n);
    scene.fog.color.copy(fogDay).lerp(fogNight, n); sun.intensity = 3 * (1 - n); hemi.intensity = lerp(1.3, .25, n); ST.material.uniforms.k.value = n; ST.material.uniforms.t.value = t;
    // Perseus: wind up, throw, then watch
    let f = Math.floor(t * 1.5) % 2 ? 'idle1' : 'idle0';
    if (t > T.throw - 1.2 && t < T.throw) f = 'throw0'; else if (t >= T.throw && t < T.throw + .8) f = 'throw1'; else if (t >= T.throw + .8) f = 'look';
    per.frame(f); per.face(cam);
    // discus arc: from his hand to the old man in the stands
    const u = seg(t, T.throw, T.hit), flying = t >= T.throw && t < T.hit;
    const a = per.root.position.clone().add(new THREE.Vector3(.5, 1.6, 0)), b = old.root.position.clone().add(new THREE.Vector3(0, 1.3, .2));
    disc.visible = flying || t < T.throw || t >= T.hit;
    if (t < T.throw) disc.position.copy(per.px(12, 28));
    else if (flying) { disc.position.lerpVectors(a, b, u); disc.position.y += Math.sin(u * Math.PI) * 4.2; disc.rotation.set(t * 20, 0, .3); }
    else { disc.position.copy(old.root.position).add(new THREE.Vector3(.7, .05, .6)); disc.rotation.set(0, 0, 0); }
    // the old man
    const hit = t >= T.hit;
    old.frame(hit ? 'fall' : Math.floor(t * 1.2) % 2 ? 'sit1' : 'sit'); old.face(cam);
    // crowd: cheering while the discus flies, frozen silent after the hit
    for (const cc of crowd) { cc.frame(flying && Math.floor(t * 4 + cc.ph) % 2 ? 'cheer' : (hit ? 'sit' : Math.floor(t * 1.2 + cc.ph) % 2 ? 'sit1' : 'sit')); cc.face(cam); }
    fill.position.copy(per.root.position).add(new THREE.Vector3(.6, 1.8, 2.4)); fill.intensity = .8 * (1 - n);
    // constellation: plane facing the end camera, stars pop on one by one, then the lines draw
    cg.position.set(0, 24, -36); cg.lookAt(1, 3, 14); cg.scale.setScalar(4.2);
    cstars.forEach((s, i) => { const t0 = T.starsStart + .9 + i * .38, k = shot.id === 'stars' ? eo(seg(t, t0, t0 + .25)) : 0; s.position.set(CONST[i][0], CONST[i][1], 0); s.visible = k > 0; s.scale.setScalar(.35 * k * (1 + .6 * Math.max(0, 1 - (t - t0) / .4))); });
    const pos = lg.attributes.position; LINKS.forEach(([i, j], k) => { pos.setXYZ(k * 2, CONST[i][0], CONST[i][1], 0); pos.setXYZ(k * 2 + 1, CONST[j][0], CONST[j][1], 0); }); pos.needsUpdate = true;
    lines.material.opacity = shot.id === 'stars' ? .55 * ss(seg(t, T.starsStart + 5.8, T.starsStart + 7.2)) : 0;
    dust.userData.update(t); dust.visible = n < .5;
    // focus / tilt band
    if (shot.id === 'games') { self.focusPoint = flying ? disc.position.clone() : (t < T.throw ? per.root.position.clone().setY(1) : old.root.position.clone().setY(1.4)); }
    else if (shot.id === 'complete') { self.focusPoint = old.root.position.clone().setY(.9); }
    else self.focusPoint = null;
    if (shot.id === 'stars') self.tiltC = lerp(.4, .65, ss(seg(lt, 0, 4)));
    else self.tiltC = null;
    post.dof.focus = self.focusPoint ? cam.position.distanceTo(self.focusPoint) : 60; post.dof.aper = shot.id === 'stars' && lt > 3 ? 40 : 280; post.dof.maxCoc = 18;
    // the band narrows onto the fallen man
    if (shot.id === 'complete') { post.dof.tiltW = lerp(.06, .015, ss(seg(lt, .4, 3.8))); post.dof.tiltF = lerp(.22, .08, ss(seg(lt, .4, 3.8))); post.dof.tiltAmt = 22; }
    if (shot.id === 'stars') post.dof.tiltAmt = 15 * (1 - ss(seg(lt, 2, 4.5)));
    renderer.toneMappingExposure = lerp(1.05, 1.3, n); post.vig.uniforms.warm.value = .12 * (1 - n); post.vig.uniforms.sat.value = shot.id === 'complete' ? lerp(1.05, .55, ss(seg(lt, .2, 2.4))) : 1.05;
    post.bloom.threshold = lerp(.92, .7, n);
  }
  return self;
}
