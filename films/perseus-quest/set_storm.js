// Set E — storm at the sea rock. Andromeda chained, Cetus rising; Perseus flies in on winged sandals,
// raises the gorgon's head: the monster turns to stone. Lateral tracking shot; rain; lightning on a flash curve.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, rock, glow, mulberry } from './px.js';
import { mat, mesh, box, fire } from './kit.js';
import { sky, sea, particles, rain, flick } from './fx.js';
import { makeChar, cetusSprite } from './chars.js';
import { T } from './story.js';
import { clamp, seg, ss, eio, eo, lerp, track } from '/core/lib.js';

// lightning flash curve: strike, dip, re-strike, decay
const flashK = (t) => { let k = 0; for (const f of T.flashes) { const u = t - f; if (u < 0 || u > 1.2) continue; k = Math.max(k, u < .05 ? u / .05 : u < .12 ? 1 - (u - .05) / .07 * .7 : u < .17 ? .3 + (u - .12) / .05 * .6 : .9 * Math.exp(-(u - .17) * 4.5)); } return k; };
export function buildStorm() {
  const scene = new THREE.Scene();
  const FOG = new THREE.Color('#3a4252'); scene.fog = new THREE.FogExp2(FOG, .03);
  const SK = sky({ top: '#1a1e28', mid: '#343a48', hor: '#4c5462', moonI: 0 }); scene.add(SK.mesh);
  const SEA = sea(600, { ppm: 9, deep: '#141c26', shallow: '#26323e', crest: '#7a8ea0' }); SEA.mesh.position.y = 0; scene.add(SEA.mesh);
  const rockM = mat(rock(128, 128, { seed: 31, cols: ['#121216', '#1e1e24', '#2c2c34', '#3c3c46', '#505058', '#666670'] }));
  // the sea rock
  { const g = new THREE.CylinderGeometry(1.6, 2.6, 3.4, 10, 4); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + (fbm(p.getX(i) * .8, p.getZ(i) * .8 + p.getY(i), 3) - .5) * .5; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.translate(0, 1.7 - 1.6, 0); const m = mesh(g, rockM); m.position.set(0, 0, 0); scene.add(m); }
  const R = mulberry(5);
  for (let i = 0; i < 9; i++) { const s = .4 + R() * 1.4, b = mesh(new THREE.DodecahedronGeometry(s, 0), rockM); b.position.set((R() - .5) * 18, s * .2 - .2, -6 + R() * 6); scene.add(b); }
  // a lantern on the rock (the one warm practical)
  const lan = new THREE.Group(); lan.position.set(-.9, 1.7, .5); scene.add(lan);
  lan.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(.2, .3, .2).translate(0, .15, 0), new THREE.MeshStandardMaterial({ color: '#3a2a1a', emissive: '#ffb050', emissiveIntensity: 1.6 })), {}));
  const lanL = new THREE.PointLight('#ffb060', 2.4, 6, 2); lanL.position.set(0, .4, .5); lan.add(lanL); const lanH = glow('#ffb060', 1, .8); lanH.position.y = .2; lan.add(lanH);
  // chain posts
  const chainM = new THREE.MeshStandardMaterial({ color: '#606470', metalness: .7, roughness: .4 });
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.4, 6).translate(0, .7, 0), chainM); post.position.set(.4 + s * .7, 1.7, -.2); post.castShadow = true; scene.add(post); }
  const andro = makeChar('andromeda'); andro.root.position.set(.4, 1.7, -.1); scene.add(andro.root);
  const per = makeChar('perseusG', { track: 1 }); scene.add(per.root);
  // Cetus: living and stone versions
  const cetus = cetusSprite(false, { scale: 1.7, emI: 1.2 }), cetusS = cetusSprite(true, { scale: 1.7 }); const cg = new THREE.Group(); cg.add(cetus, cetusS); scene.add(cg); cetus.scale.x = cetusS.scale.x = -1;
  // lights
  const hemi = new THREE.HemisphereLight('#6a7888', '#14181e', 1.1); scene.add(hemi);
  const bolt = new THREE.DirectionalLight('#dce8ff', 0); bolt.position.set(6, 14, -10); bolt.castShadow = true; bolt.shadow.mapSize.set(1024, 1024); Object.assign(bolt.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(bolt);
  const fill = new THREE.PointLight('#b8c8e0', 1.4, 7, 2); scene.add(fill);
  const headL = new THREE.PointLight('#8dff9a', 0, 14, 1.4); scene.add(headL); const headH = glow('#b0ffb8', .9, .7); scene.add(headH);
  const RN = rain(1400, [-12, -1, -8, 12, 14, 8], { speed: 26, len: 1.1, opacity: .4 }); scene.add(RN);
  const spray = particles(120, (i, t, o) => { const u = (t * .8 + h2(i, 1, 2)) % 1; o.x = cg.position.x + (h2(i, 2, 2) - .5) * 3; o.y = u * 2.2; o.z = cg.position.z + (h2(i, 3, 2) - .5) * 1.5; o.a = (1 - u) * .6 * (cg.userData.rise || 0) * (1 - (cg.userData.stone || 0)); o.s = .08; o.r = .8; o.g = .88; o.b = .95; }, { soft: 0, blend: THREE.NormalBlending });
  scene.add(spray);
  const cp = track([[0, [-5.0, 4.6, 11.5]], [10.4, [.8, 5.0, 11.0]]]), cl = track([[0, [-2.0, 2.4, -.5]], [10.4, [.6, 3.0, -1.2]]]);
  const self = { scene, update, focusPoint: null };
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a;
    cam.position.set(...cp(lt)); cam.fov = 42; cam.updateProjectionMatrix(); cam.lookAt(...cl(lt));
    const fk = flashK(t);
    hemi.intensity = 1.1 + fk * 2.4; bolt.intensity = fk * 4; SK.u.k.value = 1 + fk * 2.5;
    // Cetus rises, then turns to stone
    const rise = eo(seg(t, shot.a + .2, shot.a + 3.4)), stone = t > T.petrifyCetus;
    cg.userData.rise = rise; cg.userData.stone = stone ? 1 : 0;
    cg.position.set(1.9, -3.2 + rise * 2.6 + (stone ? 0 : Math.sin(t * 1.6) * .15), -3.6);
    cg.rotation.y = Math.atan2(cam.position.x - cg.position.x, cam.position.z - cg.position.z);
    cetus.visible = !stone; cetusS.visible = stone;
    // Andromeda: chained, then freed and joins
    const freed = t > T.partyJoin - .4;
    andro.frame(freed ? (Math.floor(t * 1.5) % 2 ? 'idle1' : 'idle0') : (Math.floor(t * 2) % 2 ? 'chain1' : 'chain')); andro.face(cam, true);
    // Perseus flies in, hovers with the head raised, then lands on the rock
    const fly = eo(seg(t, shot.a + 1.0, shot.a + 4.4)), land = eio(seg(t, T.petrifyCetus + 1.2, T.petrifyCetus + 2.4));
    const hx = lerp(-7, -1.4, fly), hy = lerp(4.2, 2.6, fly) + Math.sin(t * 3) * .08 * (1 - land);
    per.root.position.set(lerp(hx, -.5, land), lerp(hy, 1.7, land), lerp(.6, .3, land));
    const holding = t > T.petrifyCetus - 1.0 && t < T.petrifyCetus + 1.2;
    per.frame(holding ? 'hold' : fly < 1 ? 'fwd' : Math.floor(t * 1.5) % 2 ? 'idle1' : 'idle0'); per.face(cam);
    per.shadowBlob.visible = land > .9;
    const head = per.px(28, 23); const hk = holding ? 1 + .5 * Math.sin(t * 20) * (t > T.petrifyCetus - .1 && t < T.petrifyCetus + .3 ? 1 : 0) : 0;
    headL.position.copy(head).add(new THREE.Vector3(.6, .3, .8)); headL.intensity = holding ? 6 * hk + (Math.abs(t - T.petrifyCetus) < .25 ? 30 : 0) : 0;
    headH.position.copy(head); headH.visible = holding;
    fill.position.copy(per.root.position).add(new THREE.Vector3(.6, 1.8, 2.4));
    lanL.intensity = 2.2 * flick(t, 4);
    SEA.u.t.value = t * 1.6; SEA.u.camPos.value.copy(cam.position); SEA.u.fogColor.value.copy(scene.fog.color); SEA.u.fogDensity.value = scene.fog.density; SEA.u.bright.value = 1 + fk * 2;
    SEA.setLights([{ p: lan.position.clone(), c: new THREE.Color('#ffb060'), i: .8 }]);
    RN.userData.update(t, [-5, 0]); spray.userData.update(t);
    self.focusPoint = per.root.position.clone().setY(per.root.position.y + 1);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = 240; post.dof.maxCoc = 16;
    renderer.toneMappingExposure = 1.3 + fk * .4; post.vig.uniforms.sat.value = .9; post.vig.uniforms.warm.value = 0;
  }
  return self;
}
