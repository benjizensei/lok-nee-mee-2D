// Set A — the Gorgon's lair. Shots: lairOpen, rewind, lairBack, shield, strike.
// Light story: Medusa's green eye-light is the key of the whole cave; at the slash it dies, the cave goes dark,
// then Pegasus' white light rises from the same spot and every shadow swings the other way.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, rock, cobbles, glow, mulberry } from './px.js';
import { mat, mesh, box, fire } from './kit.js';
import { particles, flick, beamCard } from './fx.js';
import { makeChar, pegasus } from './chars.js';
import { T } from './story.js';
import { clamp, seg, ss, eio, eo, lerp, track } from '/core/lib.js';

function caveFloor(w, h, seed) {
  const P = new PX(w, h), R = ramp(['#0c1416', '#152226', '#1f3034', '#2c4044', '#3c5252']);
  P.fill((x, y) => { const n = fbm(x * .07, y * .07, seed, 4), c = fbm(x * .2, y * .2, seed + 3); let v = .2 + n * .6 + (c - .5) * .25; if (Math.abs(fbm(x * .03, y * .03, seed + 9) - .5) < .02) v = .05; if (h2(x, y, seed) > .985) v += .3; return R(v, x, y); });
  return P.done();
}

export function buildLair() {
  const scene = new THREE.Scene();
  const FOG = new THREE.Color('#1a3a3c'); scene.fog = new THREE.FogExp2(FOG, .022); scene.background = new THREE.Color('#060c0e');
  const rockM = mat(rock(128, 128, { seed: 21, cols: ['#0a1012', '#141e22', '#1e2c30', '#2a3a3e', '#384a4c', '#4a5c5c'] }));
  const floorM = mat(caveFloor(128, 128, 4));
  // floor
  scene.add(mesh(new THREE.BoxGeometry(30, .4, 24).translate(0, -.2, -2), floorM));
  // back wall: an arc of rough rock slabs
  for (let i = 0; i < 13; i++) {
    const a = -1.25 + i * .21, r = 9.5 + h2(i, 1, 3) * 1.5, hgt = 9 + h2(i, 2, 3) * 4;
    const g = new THREE.BoxGeometry(2.8, hgt, 1.6, 4, 8, 1); const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) p.setZ(k, p.getZ(k) + (fbm(p.getX(k) * .6 + i, p.getY(k) * .4, 5) - .5) * 1.4);
    g.translate(0, hgt / 2 - .2, 0); const m = mesh(g, rockM); m.position.set(Math.sin(a) * r, 0, -Math.cos(a) * r + 1); m.rotation.y = -a; scene.add(m);
  }
  // stalagmites (floor) and stalactites (foreground, top of the vertical frame)
  const R = mulberry(7);
  for (let i = 0; i < 14; i++) { const x = (R() - .5) * 16, z = -6 + R() * 6, hh = .6 + R() * 2.4; if (Math.abs(x) < 3.2 && z > -3.5) continue; const c = mesh(new THREE.ConeGeometry(.25 + R() * .45, hh, 6).translate(0, hh / 2, 0), rockM); c.position.set(x, 0, z); scene.add(c); }
  const tites = new THREE.Group(); scene.add(tites);
  for (let i = 0; i < 16; i++) { const hh = 1 + R() * 3.2, c = mesh(new THREE.ConeGeometry(.2 + R() * .5, hh, 6).rotateX(Math.PI).translate(0, -hh / 2, 0), rockM, { cast: false }); c.position.set((R() - .5) * 14, 7.2 + R() * 1.5, -5 + R() * 10); tites.add(c); }
  // boulders
  for (let i = 0; i < 10; i++) { const s = .3 + R() * .7, b = mesh(new THREE.DodecahedronGeometry(s, 0), rockM); b.position.set((R() - .5) * 14, s * .5, -5 + R() * 9); if (Math.abs(b.position.x) < 2.5 && b.position.z > -2 && b.position.z < 3) b.position.x += 4 * Math.sign(b.position.x || 1); scene.add(b); }
  // petrified heroes (former players): stone sprites, frozen mid-pose
  const statues = [[-3.4, -2.6, 'crowdA', 'cheer'], [3.6, -3.2, 'crowdC', 'sit'], [-1.9, -4.6, 'crowdB', 'sit'], [4.6, -.6, 'crowdA', 'sit']].map(([x, z, k, f], i) => {
    const s = makeChar(k); s.frame(f); s.petrify(true); s.root.position.set(x, 0, z); scene.add(s.root); s.flip = i % 2 === 1; return s; });
  // braziers (warm, small) — the cave's only fire
  const braz = [[-4.2, -1.2], [4.4, -2.0]].map(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.42, .22, .32, 10).translate(0, 1.1, 0), new THREE.MeshStandardMaterial({ color: '#6e4618', roughness: .5, metalness: .4 }));
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.06, .1, 1, 6).translate(0, .5, 0), bowl.material); bowl.castShadow = leg.castShadow = true;
    const f = fire(.85, { seed: i * 3, i: 3.4 }); f.position.y = 1.2; g.add(bowl, leg, f);
    const L = new THREE.PointLight('#ff9a40', 3, 9, 2); L.position.y = 1.6; g.add(L);
    const h = glow('#ff9a50', 1.6, .9); h.position.y = 1.5; g.add(h);
    scene.add(g); return { g, f, L, h, seed: i * 2.3 };
  });
  // lights
  const hemi = new THREE.HemisphereLight('#6a9a9e', '#1a2426', 1.1); scene.add(hemi);
  const key = new THREE.DirectionalLight('#9ac8d0', .35); key.position.set(-3, 12, 4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(key);
  const shaftB = beamCard(11, .8, 3.2, '#8fd0d8', { k: .12, fall: 1.4 }); scene.add(shaftB);
  // Medusa and her light
  const med = makeChar('medusa', { scale: 1.4, emI: 1.1 }); scene.add(med.root); med.root.position.set(1.2, 0, -1.4);
  const eyeL = new THREE.PointLight('#7dff9a', 7, 16, 1.6); eyeL.castShadow = true; eyeL.shadow.bias = -.004; eyeL.shadow.mapSize.set(512, 512); scene.add(eyeL);
  const mfill = new THREE.PointLight('#b0d8e0', 1.6, 7, 2); scene.add(mfill);
  const eyeH = glow('#9dffb0', .45, .5); scene.add(eyeH);
  // Perseus: level 1 (no gear) and geared
  const p1 = makeChar('perseus', { track: 1 }), p2 = makeChar('perseusG', { track: 1 }); scene.add(p1.root, p2.root);
  const fill = new THREE.PointLight('#a8c8e0', 1.4, 7, 2); scene.add(fill);
  // Pegasus
  const peg = pegasus({ scale: 1.15, emI: .12 }); peg.material.color.set('#b8bccc'); const pegG = new THREE.Group(); pegG.add(peg); scene.add(pegG);
  const pegL = new THREE.PointLight('#f4f6ff', 0, 18, 1.4); pegL.castShadow = true; pegL.shadow.bias = -.004; pegL.shadow.mapSize.set(512, 512); scene.add(pegL);
  const pegH = glow('#ffffff', 1.0, .6); scene.add(pegH);
  // dust motes in the shaft + Medusa's dissolve
  const dust = particles(90, (i, t, o) => { const s = h2(i, 3, 1); o.x = -2.5 + h2(i, 1, 1) * 5 + Math.sin(t * .3 + i) * .3; o.y = ((s * 7 + t * .12) % 7); o.z = -2 + h2(i, 2, 1) * 4; o.a = .35 * Math.sin(Math.PI * o.y / 7); o.s = .045; o.r = .6; o.g = .9; o.b = .9; }, { soft: 1 });
  scene.add(dust);
  let dissT = -1;
  const diss = particles(160, (i, t, o) => { const u = dissT < 0 ? -1 : t - dissT; if (u < 0 || u > 3) { o.a = 0; o.x = o.y = o.z = 0; return; }
    const bx = med.root.position.x + (h2(i, 1, 9) - .5) * 1.4, by = .2 + h2(i, 2, 9) * 2.8; o.x = bx + (h2(i, 3, 9) - .5) * u * 1.2; o.y = by + u * (.5 + h2(i, 4, 9)); o.z = med.root.position.z + (h2(i, 5, 9) - .5) * .6;
    o.a = Math.max(0, 1 - u / (1.2 + h2(i, 6, 9) * 1.6)) * 1.4; o.s = .07; o.r = .5; o.g = 1; o.b = .6; }, { soft: 0 });
  scene.add(diss);

  // camera tracks per shot (local time)
  const C = {
    open: { p: track([[0, [-.8, 4.8, 10.2]], [6.2, [-.3, 4.2, 8.6]]]), l: track([[0, [0, 1.6, -.6]], [6.2, [.1, 1.4, -.6]]]), fov: 40 },
    back: { p: track([[0, [-.8, 4.8, 10.2]], [6, [-.3, 4.4, 9.0]]]), l: track([[0, [0, 1.6, -.6]], [6, [.1, 1.5, -.6]]]), fov: 40 },
    shield: { p: track([[0, [-.4, 5.4, 10.6]], [2.2, [-1.8, 2.4, 4.4]], [6.4, [-2.0, 2.0, 3.6]]]), l: track([[0, [0, 1.4, -.6]], [2.2, [-.9, 1.1, .6]], [6.4, [-.8, 1.05, .7]]]), fov: 38 },
    strike: { p: track([[0, [-1.6, 2.6, 5.6]], [1.2, [-1.5, 2.7, 5.8]], [7.4, [-.6, 6.6, 13.5]]]), l: track([[0, [-.2, 1.2, -.2]], [1.2, [0, 1.3, -.4]], [7.4, [.5, 2.2, -1.2]]]), fov: 40 },
  };
  const camSet = (cam, c, lt) => { cam.position.set(...c.p(lt)); cam.fov = c.fov; cam.updateProjectionMatrix(); cam.lookAt(...c.l(lt)); };

  function update(t, shot, cam, post, renderer) {
    let lt = t - shot.a, id = shot.id, sat = 1.05;
    // the rewind shows the opening running backwards, fast, drained of colour
    if (id === 'rewind') { const u = lt / (shot.b - shot.a); t = 6.2 - eio(u) * 6.0; lt = t; id = 'lairOpen'; sat = .25; }
    const geared = id !== 'lairOpen';
    p1.root.visible = !geared; p2.root.visible = geared;
    const P = geared ? p2 : p1;
    if (id === 'lairOpen') camSet(cam, C.open, lt); else if (id === 'lairBack') camSet(cam, C.back, lt); else if (id === 'shield') camSet(cam, C.shield, lt); else camSet(cam, C.strike, lt);
    // —— Perseus ——
    let px = -1.1, pz = .9, frame = Math.floor(t * 1.6) % 2 ? 'idle1' : 'idle0', flip = false;
    if (id === 'lairOpen') { const w = ss(seg(lt, 0, 3.2)); px = lerp(-2.6, -1.1, w); if (lt < 3.2) frame = ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4]; else if (lt > 3.6 && lt < 3.75) frame = 'blink'; }
    if (id === 'lairBack') { const w = ss(seg(lt, .3, 3.2)); px = lerp(-2.6, -1.1, w); if (lt > .3 && lt < 3.2) frame = ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4]; }
    if (id === 'shield') {   // turns his back to her, raises the shield and walks backwards toward her, watching the reflection
      px = -1.1; flip = lt > .9;   // facing away (left)
      if (lt > 1.2) { frame = lt > 2.0 ? 'shieldUpR' : 'shieldUp'; px = lerp(-1.1, -.5, ss(seg(lt, 2.4, 5.2))); }
    }
    if (id === 'strike') { px = -.5; frame = lt < .9 ? 'strike' : (Math.floor(t * 1.6) % 2 ? 'idle1' : 'idle0'); flip = false; }
    P.root.position.set(px, 0, pz); P.frame(frame); P.face(cam, flip);
    fill.position.set(px + .6, 1.7, pz + 2.4); fill.intensity = 1.3;
    // —— Medusa + her eye-light ——
    const alive = !(id === 'strike');
    med.root.visible = alive || lt < .05;
    med.frame(id === 'shield' && lt > 3.4 ? 'hiss' : ['idle0', 'idle1', 'idle0', 'blink'][Math.floor(t * 3) % 4]); med.face(cam, true);
    if (id === 'shield') med.root.position.x = lerp(1.2, .9, ss(seg(lt, 2.4, 5.6))); else med.root.position.x = 1.2;
    const head = med.px(20, 15, true), toCam = cam.position.clone().sub(head).setY(0).normalize();
    let eye = 5 * (1 + .12 * Math.sin(t * 5.3));
    if (id === 'shield') eye *= 1 + .5 * ss(seg(lt, 3.2, 5.4));
    if (id === 'strike') { eye = lt < .05 ? 18 : 0; }
    mfill.position.set(med.root.position.x - .6, 2.4, med.root.position.z + 2.2); mfill.intensity = id === 'strike' ? 0 : 1.6;
    eyeL.position.copy(head).addScaledVector(toCam, 1.1).setY(head.y + .3); eyeL.intensity = eye; eyeH.position.copy(head); eyeH.material.opacity = Math.min(.7, eye / 10); eyeH.visible = eye > .01;
    // Medusa dissolves into green pixels at the slash
    dissT = id === 'strike' ? shot.a : -1; diss.userData.update(t);
    // —— braziers: they also dip when she dies (the cave holds its breath) ——
    const hush = id === 'strike' ? (lt < 1.1 ? .15 : .15 + .85 * ss(seg(lt, 1.1, 3.5))) : 1;
    for (const b of braz) { const k = flick(t, b.seed); b.L.intensity = 2.6 * k * hush; b.f.userData.update(t, cam, (.85 + .15 * k) * Math.max(.35, hush)); b.h.material.opacity = .8 * hush; }
    for (const s of statues) s.face(cam, s.flip);
    // —— Pegasus rises from her light ——
    const pu = id === 'strike' ? seg(lt, 1.1, 4.5) : 0, pon = id === 'strike' && lt > 1.1;
    pegG.visible = pon; pegL.intensity = pon ? 3.5 * (.4 + .6 * eo(seg(lt, 1.1, 1.5))) : 0; pegH.visible = pon;
    if (pon) { pegG.position.set(.5, .6 + eo(pu) * 1.6, -2.6); pegG.rotation.y = Math.atan2(cam.position.x - pegG.position.x, cam.position.z - pegG.position.z); peg.position.y = Math.sin(t * 3) * .06;
      pegL.position.set(.9, 1.6 + eo(pu) * 2.0, .4); pegH.position.set(1.1, 1.2 + eo(pu) * 2.0, -1.3); pegH.material.opacity = .22; }
    // key / hemi / shaft
    hemi.intensity = id === 'strike' && lt > .05 && lt < 1.1 ? .15 : 1.1; key.intensity = id === 'strike' && lt > .05 && lt < 1.1 ? .05 : .35;
    shaftB.userData.aim(new THREE.Vector3(-1.2, 9, -1.5), new THREE.Vector3(.15, -1, .1).normalize(), cam);
    dust.userData.update(t);
    // focus: the hero, then Pegasus as he rises
    const fp = id === 'strike' && lt > 1.6 ? pegG.position.clone().setY(pegG.position.y + 1.2) : P.root.position.clone().setY(1);
    post.dof.focus = cam.position.distanceTo(fp); post.dof.aper = id === 'shield' ? 260 : 300; post.dof.maxCoc = 20;
    renderer.toneMappingExposure = 1.35;
    post.vig.uniforms.sat.value = sat; post.vig.uniforms.warm.value = 0;
    post.bloom.strength = .6;
  }
  return { scene, update };
}
