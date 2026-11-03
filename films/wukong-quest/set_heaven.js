// Set — Heaven. Four zones along x: F battlefield before the Southern Gate (x=0), S stable (x=60), G peach garden (x=120), P furnace hall (x=180).
// Shots: hook, rewind, horses, peaches, army, furnace. Framing keeps subjects in the upper 3/4 (subtitles live low).
import * as THREE from 'three';
import { PX, ramp, h2, fbm, glow, mulberry, texOf } from './px.js';
import { mat, mesh, box, fire } from './kit.js';
import { sky, particles, flick, beamCard } from './fx.js';
import { makeChar } from './chars.js';
import { makeHorse, makeCloudRide } from './creatures.js';
import { makeFight, makeFX } from './fight.js';
import { FIGHTS, T } from './story.js';
import { clamp, seg, ss, eio, eo, ei, lerp, track } from '/core/lib.js';

function tiles(w, h, seed, cols) { const P = new PX(w, h), R = ramp(cols); P.fill((x, y) => { let v = .55 + (fbm(x * .06, y * .06, seed) - .5) * .35; if (x % 24 === 0 || y % 24 === 0) v = .25; return R(v, x, y); }); return P.done(); }

export function buildHeaven() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#f0e2c8', .016);
  const SK = sky({ top: '#4a78c0', mid: '#a8c8e8', hor: '#ffe6b8', moonDir: new THREE.Vector3(.3, .45, -1), moonCol: '#fff6d8', moonI: 1.5 }); scene.add(SK.mesh);
  const marble = mat(tiles(96, 96, 2, ['#a89c88', '#c8bca4', '#e0d6c0', '#f2ead8'])), red = new THREE.MeshStandardMaterial({ color: '#b8281c', roughness: .6 }), goldM = new THREE.MeshStandardMaterial({ color: '#e0b040', metalness: .6, roughness: .35 }), wood = new THREE.MeshStandardMaterial({ color: '#7a4a24', roughness: .9 });
  // —— zone F: plaza + Southern Gate ——
  scene.add(mesh(new THREE.CylinderGeometry(16, 16.5, .6, 48).translate(0, -.3, -2), marble));
  for (const s of [-1, 1]) for (const k of [0, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.55, .6, 7, 14).translate(0, 3.5, 0), red); c.position.set(s * (3 + k * 4.5), 0, -11); c.castShadow = true; scene.add(c); }
  const roofG = new THREE.Group(); roofG.position.set(0, 7, -11); scene.add(roofG);
  roofG.add(new THREE.Mesh(new THREE.BoxGeometry(17, .8, 3), goldM), Object.assign(new THREE.Mesh(new THREE.BoxGeometry(19, .3, 4.2).translate(0, 1.0, 0), red), {}), new THREE.Mesh(new THREE.BoxGeometry(14, .9, 3).translate(0, 1.6, 0), goldM));
  const balcony = new THREE.Mesh(new THREE.BoxGeometry(6, .3, 2.4), goldM); balcony.position.set(0, 4.6, -10); scene.add(balcony);
  const emperor = makeChar('emperor', { scale: 1.1 }); emperor.root.position.set(0, 4.75, -10); scene.add(emperor.root);
  // soldiers: a grid that marches in; each can be knocked flying
  const SOL = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) { const s = makeChar('soldier'); scene.add(s.root); SOL.push({ s, r, c, home: new THREE.Vector3(-4.6 + c * 1.3 + (r % 2) * .5, 0, -2.6 - r * 1.25), ko: null, dir: (c < 4 ? -1 : 1) }); }
  const her = makeChar('wukong', { track: 1 }), herE = makeChar('wukongE', { track: 1 }); scene.add(her.root, herE.root);
  const clones = [...Array(10)].map(() => { const c = makeChar('wukong'); scene.add(c.root); return c; });
  const staffLong = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1, 8), new THREE.MeshStandardMaterial({ color: '#c8281c', emissive: '#ff5020', emissiveIntensity: .6 })); staffLong.castShadow = true; scene.add(staffLong);
  const puffs = particles(160, (i, t, o) => { const u = t - T.clones; o.a = 0; if (u < 0 || u > 1.2) return; const k = i % 10, a = h2(i, 1, 2) * 6.28, r = u * 1.4 * h2(i, 2, 2); const p = CLONE_POS[k]; o.x = p[0] + Math.cos(a) * r; o.y = .8 + Math.sin(a) * r * .6 + u; o.z = p[1] + .2; o.a = (1 - u / 1.2) * .8; o.s = .35; o.r = 1; o.g = 1; o.b = .95; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(puffs);
  const CLONE_POS = [[-2.2, .6], [2.2, .6], [-3.4, -.6], [3.4, -.6], [-1.2, -1.2], [1.2, -1.2], [-4.4, .2], [4.4, .2], [-2.8, 1.8], [2.8, 1.8]];
  const clouds = particles(240, (i, t, o) => { const a = h2(i, 1, 4) * 6.28, r = 15 + h2(i, 2, 4) * 25; o.x = Math.cos(a + t * .005) * r + (h2(i, 5, 4) > .5 ? 60 : 0) * 0; o.z = Math.sin(a + t * .005) * r - 4; o.y = -1.2 - h2(i, 3, 4) * 2; o.a = .6; o.s = 3.5 + h2(i, 4, 4) * 3; o.r = 1; o.g = .97; o.b = .92; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(clouds);
  // —— zone S: stable ——
  const S0 = new THREE.Vector3(60, 0, 0);
  scene.add(mesh(new THREE.BoxGeometry(14, .5, 10).translate(60, -.25, -1), mat(tiles(64, 64, 6, ['#6a5030', '#86683e', '#a2844e', '#bca064']))));
  for (let i = 0; i < 12; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.1, .12).translate(0, .55, 0), wood); p.position.set(54 + i, 0, -4.5); p.castShadow = true; scene.add(p); }
  const hay = new THREE.Mesh(new THREE.BoxGeometry(1.4, .7, 1).translate(0, .35, 0), new THREE.MeshStandardMaterial({ color: '#d8b850', roughness: 1 })); hay.position.set(63.5, 0, -2.5); scene.add(hay);
  const horses = [[57.5, -3.2], [60.2, -3.6], [63, -3.0]].map(([x, z]) => { const h = makeHorse(); h.root.position.set(x, 0, z); scene.add(h.root); return h; });
  // —— zone G: peach garden ——
  scene.add(mesh(new THREE.BoxGeometry(16, .5, 12).translate(120, -.25, -1), mat(tiles(64, 64, 8, ['#4a6a30', '#5e8a3a', '#78a84a', '#92c060']))));
  const leaf = new THREE.MeshStandardMaterial({ color: '#5a9a48', roughness: .9 }), peachM = new THREE.MeshStandardMaterial({ color: '#ffb0a0', emissive: '#ff8070', emissiveIntensity: .25 });
  const R = mulberry(5); const peaches = [];
  for (const [x, z, s] of [[115.5, -3.5, 1.2], [119.5, -4.5, 1.4], [124, -3.2, 1.1], [113.5, -.5, .9], [126, -.2, 1.0]]) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.15 * s, .25 * s, 2 * s, 7).translate(0, s, 0), wood); tr.position.set(x, 0, z); tr.castShadow = true; scene.add(tr); const cn = new THREE.Mesh(new THREE.SphereGeometry(1.4 * s, 10, 8), leaf); cn.position.set(x, 2.4 * s, z); cn.castShadow = true; scene.add(cn); for (let k = 0; k < 7; k++) { const pc = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), peachM); const a = R() * 6.28, b = R() * 1.2; pc.position.set(x + Math.cos(a) * 1.3 * s, 2.4 * s - .4 + Math.sin(b) * .6, z + Math.sin(a) * 1.3 * s + .3); scene.add(pc); peaches.push(pc); } }
  const gourd = new THREE.Group(); gourd.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), goldM)), Object.assign(new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8).translate(0, .25, 0), goldM))); scene.add(gourd);
  const sparkle = particles(80, (i, t, o) => { o.a = 0; let b = -1; T.buffs.concat([T.gourd]).forEach((bt, k) => { if (t >= bt && t < bt + 1.2) b = k; }); if (b < 0) return; const u = t - [...T.buffs, T.gourd][b]; const a = i * .8 + u * 4; o.x = 120 + Math.cos(a) * (.6 + u * .3); o.z = -.2 + Math.sin(a) * .5; o.y = .3 + u * 2 + (i % 5) * .1; o.a = (1 - u / 1.2); o.s = .06; o.r = 1; o.g = .9; o.b = .4; });
  scene.add(sparkle);
  // —— zone P: furnace hall ——
  scene.add(mesh(new THREE.BoxGeometry(14, .5, 12).translate(180, -.25, -1), mat(tiles(64, 64, 9, ['#3a1a14', '#5a2a1c', '#7a3a24', '#9a4a2c']))));
  const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 9, .5).translate(180, 4.5, -6.5), new THREE.MeshStandardMaterial({ color: '#4a1c14', roughness: .9 })); scene.add(wall);
  const furnace = new THREE.Group(); furnace.position.set(180.5, 0, -2.6); scene.add(furnace);
  const bronze = new THREE.MeshStandardMaterial({ color: '#8a6a2a', metalness: .7, roughness: .35 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 2.4, 8).translate(0, 1.9, 0), bronze); body.castShadow = true; furnace.add(body);
  for (let i = 0; i < 3; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, .8, 6).translate(0, .4, 0), bronze); lg.position.set(Math.cos(i * 2.09) * 1.1, 0, Math.sin(i * 2.09) * 1.1); furnace.add(lg); }
  const lid = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.0, 8).translate(0, .5, 0), bronze); lid.castShadow = true; scene.add(lid);
  const ffire = fire(1.6, { seed: 4, i: 3.6 }); ffire.position.set(0, .2, .9); furnace.add(ffire);
  const fL = new THREE.PointLight('#ff7a30', 5, 12, 2); fL.position.set(0, 1.2, 1.8); furnace.add(fL);
  const laozi = makeChar('laozi', { scale: 1.05 }); laozi.root.position.set(177.6, 0, -1.6); scene.add(laozi.root);
  const burst = particles(200, (i, t, o) => { const u = t - T.burst; o.a = 0; if (u < 0 || u > 1.6) return; const a = h2(i, 1, 6) * 6.28, e = h2(i, 2, 6); o.x = 180.5 + Math.cos(a) * u * 4 * e; o.z = -2.6 + Math.sin(a) * u * 2 * e; o.y = 3 + u * 3 * (1 - e) - 3 * u * u; o.a = (1 - u / 1.6) * 1.4; o.s = .18; o.r = 1; o.g = .6; o.b = .15; });
  scene.add(burst);
  // lights
  const sun = new THREE.DirectionalLight('#fff4dc', 2.2); sun.position.set(-8, 16, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#dce8ff', '#c0a880', 1.3); scene.add(hemi);
  const fill = new THREE.PointLight('#fff0e0', 2.0, 9, 2); scene.add(fill);
  const fx = makeFX(scene, '#ffe0a0');
  const FI = { hook: makeFight(FIGHTS.hook), army: makeFight(FIGHTS.army) };
  const self = { scene, update, focusPoint: null, hud: null, popups: [], tags: [] };
  const _p = new THREE.Vector3();
  function update(t, shot, cam, post, renderer) {
    let id = shot.id, sat = 1.05;
    if (id === 'rewind') { const u = (t - shot.a) / (shot.b - shot.a); t = 9.8 - eio(u) * 9.5; id = 'hook'; sat = .25; }
    const lt = t - SHOTS_A[id];
    // which zone: move the sun's target with it
    const zx = id === 'horses' ? 60 : id === 'peaches' ? 120 : id === 'furnace' ? 180 : 0;
    sun.position.set(zx - 8, 16, 10); sun.target.position.set(zx, 0, -1);
    scene.fog.color.set(id === 'furnace' ? '#2a1410' : '#f0e2c8'); scene.fog.density = id === 'furnace' ? .03 : .016; hemi.intensity = id === 'furnace' ? .6 : 1.3; SK.u.k.value = id === 'furnace' ? .2 : 1;
    const fight = id === 'hook' || id === 'army', Fi = FI[id];
    const ft = Fi ? Fi.freeze(t) : t, idle = (o = 0) => Math.floor(ft * 1.6 + o) % 2 ? 'idle1' : 'idle0';
    // —— battlefield ——
    const fieldOn = fight; emperor.root.visible = fieldOn; staffLong.visible = false; puffs.visible = id === 'army';
    for (const S of SOL) S.s.root.visible = fieldOn;
    clones.forEach(c => c.root.visible = false);
    her.root.visible = id !== 'furnace' || t >= T.burst; herE.root.visible = false;
    const H = id === 'furnace' && t >= T.burst ? herE : her; if (H === herE) { her.root.visible = false; herE.root.visible = true; }
    let cp, cl;
    if (fieldOn) {
      const march = id === 'army' ? eo(seg(t, T.march, T.march + 3.5)) : 1;
      const posOf = tg => { if (tg === 'row') return new THREE.Vector3(0, 1.4, -3.0); const k = +tg.slice(1) - 1; const S = SOL[k * 3 % SOL.length]; return S.s.root.position.clone().setY(S.s.root.position.y + 1.2); };
      // knock-outs: each hit on sN throws a soldier; the sweep and finisher throw whole rows
      const koTime = S => { let k = null; for (const h of Fi.hits) { if (h.t > t) break; if (h.tg === 'row' && (h.fin || S.r === 0)) k = k ?? h.t; else if (h.ko && SOL[(+h.ko.slice(1) - 1) * 3 % SOL.length] === S) k = k ?? h.t; } return k; };
      for (const S of SOL) { const ko = koTime(S); const base = S.home.clone(); base.z += (1 - march) * -6;
        let f = id === 'army' && t > T.march && t < T.march + 3.5 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8 + S.c) % 4] : idle(S.c * .3);
        if (ko != null) { const u = t - ko; base.x += S.dir * u * 5; base.y += Math.max(0, 6 * u - 9 * u * u) + (u > .9 ? -10 : 0); base.z -= u * 2; S.s.mesh.rotation.z = S.dir * u * 8; f = 'hurt'; S.s.root.visible = u < .95; } else S.s.mesh.rotation.z = 0;
        S.s.root.position.copy(base); S.s.frame(f); S.s.face(cam); S.s.mesh.material.color.setScalar(1 + 2 * Fi.flash('s' + (SOL.indexOf(S) / 3 + 1), t)); }
      // hero + clones
      const hp = Fi.pose(ft) || (id === 'army' && t < T.clones ? idle() : idle());
      H.root.position.set(0, 0, 1.0); H.frame(id === 'army' && t > T.sweep - .25 && t < T.sweep + .35 ? (t < T.sweep ? 'windup' : 'slash1') : hp); H.face(cam);
      const cOn = id === 'hook' || t > T.clones; const ap = Fi.pose(ft, 'ally') || idle(.5);
      clones.forEach((c, i) => { c.root.visible = cOn; const p = CLONE_POS[i]; c.root.position.set(p[0] + Math.sin(ft * 2 + i) * .15, 0, p[1]); c.frame(i % 2 ? ap : hp); c.face(cam, p[0] < 0 && i % 3 === 0); });
      // staff extends across the front row
      if (id === 'army' && t > T.sweep - .1 && t < T.sweep + .6) { const u = seg(t, T.sweep - .1, T.sweep + .2); staffLong.visible = true; staffLong.scale.y = .1 + u * 12; staffLong.position.set(0, 1.3, -1.4); staffLong.rotation.set(0, 0, Math.PI / 2 + (1 - eo(u)) * .4); }
      emperor.frame(id === 'army' && t > T.emperorAngry && t < T.march + 1 ? (Math.floor(t * 5) % 2 ? 'point' : 'point1') : idle()); emperor.face(cam);
      fx.update(t, Fi.hits, posOf, H.root.position, cam, 1);
      self.popups = Fi.popups(t, posOf);
      const done = Fi.hits.filter(h => h.t <= t).length, tot = Fi.hits.length;
      self.hud = { boss: 'ทัพสวรรค์', sub: 'ทหารที่เหลือ', count: Math.max(0, Math.round(100000 * (1 - (id === 'hook' ? .55 + .2 * done / tot : done / tot)))), combo: (() => { const c = Fi.combo(t); return { n: c.n + (id === 'hook' ? 60 : 0), since: c.since }; })(), skill: Fi.skill(t), skillPos: H.root.position.clone().setY(2.6), fin: Fi.fin(t), show: id === 'hook' ? 1 : ss(seg(t, 86.6, 87.0)) * (1 - ss(seg(t, 94.6, 95.0))) };
      if (id === 'hook') { cp = [lerp(-1.2, 1.0, lt / 9.8), 5.0 - lt * .05, 9.4 - lt * .08]; cl = [0, .2, -1.4]; }
      else { const k = track([[0, [0, 6.4, -2.0]], [2.6, [.4, 6.0, -1.0]], [3.4, [-1.0, 6.8, 11]], [7.6, [0, 6.0, 10]], [11.0, [.6, 5.0, 8.4]], [12.4, [0, 5.4, 9.2]], [19.0, [-1.2, 4.6, 8.4]], [19.6, [-.4, 3.0, 5.4]], [20.6, [0, 6.4, 11]]]), l = track([[0, [0, 5.6, -10]], [2.6, [0, 5.4, -10]], [3.4, [0, .4, -3]], [11.0, [0, .4, -1.6]], [19.0, [0, .4, -1.6]], [19.6, [0, .8, -1.4]], [20.6, [0, .2, -2]]]); cp = k(lt); cl = l(lt); }
      self.focusPoint = id === 'army' && lt < 2.8 ? emperor.root.position.clone().setY(5.8) : H.root.position.clone().setY(1.2);
    } else { self.hud = null; self.popups = []; }
    // —— stable ——
    horses.forEach((h, i) => { h.root.visible = id === 'horses'; h.frame(Math.floor(t * 1.5 + i) % 2 ? 'a' : 'b'); h.face(cam); });
    if (id === 'horses') { H.root.position.set(59.5, 0, -.8); H.frame(t > T.jobCard + .2 ? 'point' : idle()); H.face(cam); cp = [59 + lt * .1, 3.4, 5.6]; cl = [60, .3, -2.2]; self.focusPoint = H.root.position.clone().setY(1.2); }
    // —— peach garden ——
    if (id === 'peaches') { const wk = seg(t, 64.9, 66.4); H.root.position.set(lerp(116, 120, eo(wk)), 0, -.2); H.frame(wk < 1 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4] : (T.buffs.some(b => t > b - .3 && t < b + .4) || (t > T.gourd - .2 && t < T.gourd + .8) ? 'eat' : idle())); H.face(cam);
      gourd.visible = t > T.gourd - .6 && t < T.gourd + 1.2; gourd.position.set(120.55, 1.55, 0); cp = [119 + lt * .08, 3.2, 5.2]; cl = [120, .7, -1.4]; self.focusPoint = H.root.position.clone().setY(1.2); } else gourd.visible = false;
    sparkle.userData.update(t); sparkle.visible = id === 'peaches';
    // —— furnace ——
    const fOn = id === 'furnace'; laozi.root.visible = fOn; furnace.visible = fOn;
    if (fOn) { const shake = t > T.burst - 1.2 && t < T.burst ? Math.sin(t * 60) * .05 * seg(t, T.burst - 1.2, T.burst) : 0; furnace.position.x = 180.5 + shake;
      const lu = seg(t, T.burst, T.burst + 1.0); lid.position.set(180.5 + lu * 3, 3.1 + Math.max(0, 7 * lu - 6 * lu * lu), -2.6 - lu * 2); lid.rotation.set(lu * 5, 0, lu * 3);
      laozi.frame(t > T.burst ? 'up' : t > T.furnaceLock && t < T.furnaceLock + 1 ? 'point' : idle()); laozi.face(cam); laozi.root.position.x = 177.6 - (t > T.burst ? eo(seg(t, T.burst, T.burst + .6)) * 1.2 : 0);
      if (t >= T.burst) { const up = eo(seg(t, T.burst, T.burst + .5)); H.root.position.set(180.5 + up * 1.0, 3.2 * (1 - up) + Math.max(0, Math.sin(up * Math.PI) * 1.5), -2.0 + up * 1.4); H.frame(t > T.fireEyes + .8 ? ['slash1', 'slash2', 'slash3'][Math.floor(t * 4) % 3] : t > T.burst + .5 ? 'victory' : 'idle0'); H.face(cam); }
      ffire.userData.update(t, cam, 1 + .3 * seg(t, T.burst - 2, T.burst)); fL.intensity = 4 * flick(t, 2) * (1 + 1.5 * Math.max(0, 1 - Math.abs(t - T.burst) / .5));
      const k = track([[0, [179, 4.4, 6.6]], [7, [180, 4.0, 5.8]], [7.8, [180.5, 4.6, 7.2]], [13, [181, 4.2, 6.4]]]), l = track([[0, [180.2, 1.6, -2.4]], [7, [180.4, 1.8, -2.4]], [13, [181, 1.2, -1.6]]]); cp = k(lt); cl = l(lt);
      self.focusPoint = t > T.burst ? H.root.position.clone().setY(1.2) : new THREE.Vector3(180.5, 2, -2.6); }
    burst.userData.update(t); burst.visible = fOn; lid.visible = fOn;
    const sh = Fi ? Fi.shake(t) : (fOn && Math.abs(t - T.burst) < .5 ? .15 * (1 - Math.abs(t - T.burst) / .5) : 0);
    cam.position.set(cp[0] + Math.sin(t * 91) * sh, cp[1] + Math.cos(t * 77) * sh, cp[2]); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(...cl);
    // billboards face the camera only after it has moved to this shot's zone
    for (const c of [her, herE, emperor, laozi, ...clones, ...horses, ...SOL.map(S => S.s)]) if (c.root.visible) { const fl = c.mesh.scale.x < 0; c.face(cam, fl); }
    fill.position.copy(H.root.position).add(new THREE.Vector3(.8, 2.0, 2.6)); fill.intensity = fOn ? 1.2 : 2.0;
    clouds.userData.update(t); clouds.visible = fieldOn || id === 'horses' || id === 'peaches'; if (clouds.visible) clouds.position.x = zx;
    post.dof.focus = cam.position.distanceTo(self.focusPoint || H.root.position); post.dof.aper = 240; post.dof.maxCoc = 16;
    renderer.toneMappingExposure = fOn ? 1.4 : 1.05; post.vig.uniforms.sat.value = sat; post.vig.uniforms.warm.value = .12; post.bloom.threshold = .88;
  }
  return self;
}
const SHOTS_A = { hook: 0, rewind: 9.83, horses: 52.0, peaches: 64.86, army: 74.39, furnace: 126.91 };
