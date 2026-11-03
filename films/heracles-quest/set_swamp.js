// Set — the swamp of Lerna (dusk, olive fog). Shots: hook (cold open, 0–9.6), rewind, hydra (60–84.4).
// Hydra necks are bead chains; a cut head falls, the neck drops to a stump, two new necks grow (unless burnt).
import * as THREE from 'three';
import { PX, ramp, h2, fbm, rock, glow, mulberry } from './px.js';
import { mat, mesh, box, fire } from './kit.js';
import { sky, sea, particles, flick } from './fx.js';
import { makeChar } from './chars.js';
import { makeHydraBody, makeHydraHead, neckSeg } from './monsters.js';
import { makeFight, makeFX } from './fight.js';
import { FIGHTS, T } from './story.js';
import { clamp, seg, ss, eio, eo, ei, lerp, track } from '/core/lib.js';

function mud(w, h, seed) { const P = new PX(w, h), R = ramp(['#1a1c10', '#2a2c18', '#3c3e22', '#50522c', '#666a3a']); P.fill((x, y) => R(.35 + (fbm(x * .07, y * .07, seed) - .5) * .7 + (h2(x, y, seed) > .97 ? .25 : 0), x, y)); return P.done(); }
function reedTex() { const P = new PX(20, 28), G = ramp(['#1a2a10', '#2e4418', '#4a6424', '#6a8434']), R = mulberry(3); for (let b = 0; b < 8; b++) { let x = 2 + R() * 16; const hh = 12 + R() * 15, lean = (R() - .5) * .4; for (let y = 0; y < hh; y++) { P.set(Math.round(x), 27 - y, G(.3 + y / hh * .6, b, y)); x += lean; } if (R() < .5) { P.rect(Math.round(x) - 1, 27 - Math.round(hh), 2, 4, ramp(['#3a2414', '#5a3a1e'])(.6, 0, 0)); } } return P.done(); }

// head roster per shot: id, base x offset on the body, head target (x,y,z rel. to body), born, cut, burn, parent
function roster(kind) {
  const L = [];
  const add = (id, bx, hx, hy, hz, o = {}) => L.push({ id, bx, hx: hx * 1.35 - .1, hy: hy * 1.12 + .35, hz, born: o.born ?? -1, cut: null, burn: null, gold: !!o.gold, from: o.from });
  if (kind === 'hook') {
    add('h1', -.5, -1.3, 2.4, .2); add('h2', -.1, -.9, 1.6, .5); add('h3', .4, -.2, 3.0, .1);
    add('h4', -.1, -1.2, 2.0, .7, { born: T.hydraHook.regrow[0], from: 'h2' }); add('h5', -.1, -.5, 2.6, .6, { born: T.hydraHook.regrow[0] + .05, from: 'h2' });
    add('h6', -.1, -1.4, 1.5, .9, { born: T.hydraHook.regrow[1], from: 'h4' }); add('h7', -.1, -.7, 1.3, 1.0, { born: T.hydraHook.regrow[1] + .05, from: 'h4' });
  } else {
    add('gold', .1, .2, 3.6, -.2, { gold: 1 });
    [['h1', -.6, -1.4, 2.0, .5], ['h3', -.3, -1.0, 2.7, .3], ['h5', -.4, -1.3, 1.5, .8], ['h6', .3, -.6, 3.1, .0], ['h7', -.2, -.8, 1.9, .9], ['h8', .5, .0, 2.6, .4], ['h9', .7, .4, 3.0, .3], ['h10', .2, -.3, 1.4, 1.0]]
      .forEach(([id, bx, hx, hy, hz]) => add(id, bx, hx, hy, hz));
    add('h1a', -.6, -1.5, 2.6, .6, { born: 65.6, from: 'h1' }); add('h1b', -.6, -.9, 1.7, .9, { born: 65.65, from: 'h1' });
    add('h3a', -.3, -1.2, 3.2, .2, { born: 67.1, from: 'h3' }); add('h3b', -.3, -.5, 2.2, .7, { born: 67.15, from: 'h3' });
  }
  const F = FIGHTS[kind];
  for (const h of F) { const r = L.find(x => x.id === h.cut); if (r) r.cut = h.t; const b = L.find(x => x.id === h.burn); if (b) b.burn = h.t; }
  return L;
}

export function buildSwamp() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#3a4228', .035); scene.background = new THREE.Color('#1a1e14');
  const SK = sky({ top: '#20261c', mid: '#4a5034', hor: '#9a8a5a', moonDir: new THREE.Vector3(.4, .12, -1), moonCol: '#ffd890', moonI: .9 }); scene.add(SK.mesh);
  const W = sea(400, { ppm: 9, deep: '#141a10', shallow: '#2a3420', crest: '#5a6440' }); W.mesh.position.y = -.12; scene.add(W.mesh);
  const mudM = mat(mud(96, 96, 4)), rockM = mat(rock(96, 96, { seed: 6, cols: ['#14140e', '#22221a', '#323226', '#444434', '#5a5a44'] }));
  // islands
  const isl = (x, z, r, hgt = .3) => { const g = new THREE.CylinderGeometry(r * .85, r, hgt, 14, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + (fbm(p.getX(i) * .5 + x, p.getZ(i) * .5, 2) - .5) * .4; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.translate(0, hgt / 2 - .15, 0); const m = mesh(g, mudM); m.position.set(x, 0, z); scene.add(m); };
  isl(-1.6, .2, 3.4); isl(1.6, -1.4, 3.0, .25); isl(-6, -4, 2.2); isl(6, -3, 2.5); isl(-3, 4.5, 1.6);
  // dead trees
  const bark = new THREE.MeshStandardMaterial({ color: '#2a241a', roughness: 1 });
  const R = mulberry(8);
  for (const [x, z, hh] of [[-5.2, -3.6, 5], [5.6, -2.6, 6], [-3.8, -6.5, 4], [3.2, -6.8, 5.5], [-6.5, 1.2, 4.2]]) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.08, .22, hh, 6).translate(0, hh / 2, 0), bark); tr.position.set(x, 0, z); tr.rotation.z = (R() - .5) * .2; tr.castShadow = true; scene.add(tr);
    for (let b = 0; b < 4; b++) { const L = .8 + R() * 1.2, br = new THREE.Mesh(new THREE.CylinderGeometry(.03, .06, L, 5).translate(0, L / 2, 0), bark); br.position.set(x, hh * (.5 + R() * .45), z); br.rotation.set((R() - .5), 0, (R() < .5 ? 1 : -1) * (.7 + R() * .6)); br.castShadow = true; scene.add(br); }
  }
  // reeds (billboards)
  const reedM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(reedTex()), alphaTest: .5, side: THREE.DoubleSide }); reedM.map.magFilter = THREE.NearestFilter; reedM.map.colorSpace = THREE.SRGBColorSpace;
  const reeds = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.25).translate(0, .6, 0), reedM); const a = R() * 6.28, r = 3 + R() * 7; m.position.set(Math.cos(a) * r, -.05, Math.sin(a) * r * .8 - 1); if (Math.abs(m.position.x) < 2.6 && m.position.z > -3 && m.position.z < 3.5) continue; scene.add(m); reeds.push(m); }
  // light
  const moon = new THREE.DirectionalLight('#e0d0a0', 1.1); moon.position.set(-6, 11, 9); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); scene.add(moon);
  const hemi = new THREE.HemisphereLight('#a8b88a', '#2a2a1c', 1.9); scene.add(hemi);
  const fill = new THREE.PointLight('#f0f0d8', 3.2, 8, 2); scene.add(fill);
  const hyL = new THREE.PointLight('#b0ff90', 1.6, 9, 2); scene.add(hyL);
  // cast
  const her = makeChar('heraclesL', { track: 1 }), iol = makeChar('iolaus'); scene.add(her.root, iol.root);
  const torchL = new THREE.PointLight('#ffa040', 0, 7, 2); torchL.castShadow = true; torchL.shadow.bias = -.004; torchL.shadow.mapSize.set(512, 512); scene.add(torchL); const torchH = glow('#ffb060', .8, .8); scene.add(torchH);
  const body = makeHydraBody(1.7); scene.add(body.root);
  const bodyG = new THREE.Group(); scene.add(bodyG);
  // pool of necks/heads (max 14)
  const POOL = [...Array(14)].map(() => { const g = new THREE.Group(); const beads = [...Array(9)].map((_, i) => { const b = neckSeg(.15 - i * .006); g.add(b); return b; }); const head = makeHydraHead(), gold = makeHydraHead(true); g.add(head.root, gold.root); scene.add(g); const fl = fire(.7, { seed: 3, i: 3.2 }); g.add(fl); return { g, beads, head, gold, fl, fallH: makeHydraHead() }; });
  POOL.forEach(p => { scene.add(p.fallH.root); });
  const boulder = mesh(new THREE.DodecahedronGeometry(1.1, 0), rockM); scene.add(boulder);
  const fx = makeFX(scene);
  const ROST = { hook: roster('hook'), hydra: roster('hydra') }, FI = { hook: makeFight(FIGHTS.hook), hydra: makeFight(FIGHTS.hydra) };
  const flies = particles(60, (i, t, o) => { const a = t * .3 + i; o.x = Math.sin(a * 1.3) * 6 + (h2(i, 1, 2) - .5) * 8; o.y = .6 + h2(i, 2, 2) * 2.5 + Math.sin(t * 2 + i) * .2; o.z = -4 + h2(i, 3, 2) * 8; o.a = .6 * (.5 + .5 * Math.sin(t * 3 + i * 2)); o.s = .05; o.r = .8; o.g = 1; o.b = .5; }, { soft: 1 });
  scene.add(flies);
  const dust = particles(80, (i, t, o) => { const u = t - T.boulder; o.a = 0; if (u < 0 || u > 2) return; const a = h2(i, 1, 4) * 6.28; o.x = 1.8 + Math.cos(a) * u * 2.4; o.z = -1.6 + Math.sin(a) * u * 1.2; o.y = .3 + u * .6 * h2(i, 2, 4); o.a = (1 - u / 2) * .7; o.s = .25; o.r = .5; o.g = .48; o.b = .38; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(dust);
  const self = { scene, update, focusPoint: null, hud: null, popups: [] };
  const BODY = new THREE.Vector3(1.7, 0, -1.4);
  const _v = new THREE.Vector3();

  function update(t, shot, cam, post, renderer) {
    let id = shot.id, sat = 1.05;
    if (id === 'rewind') { const u = (t - shot.a) / (shot.b - shot.a); t = 9.6 - eio(u) * 9.3; id = 'hook'; sat = .25; }
    const lt = t - (id === 'hook' ? 0 : 60), Fi = FI[id], ft = Fi.freeze(t), Ro = ROST[id];
    // —— camera ——
    let cp, cl, fov = 40;
    if (id === 'hook') { cp = [lerp(-2.6, -1.6, lt / 9.6), 4.0, 7.8 - lt * .08]; cl = [0, 1.7, -.5]; }
    else {
      const ck = track([[0, [0, 8.5, 14]], [3.0, [-1.0, 5.2, 9.5]], [8, [-1.8, 4.2, 7.6]], [12, [-2.6, 4.4, 8.4]], [17.6, [-2.0, 3.8, 7.0]], [18.1, [-1.2, 2.6, 4.6]], [19.4, [-1.0, 2.5, 4.4]], [20.6, [-.6, 6.0, 10.5]], [24.4, [-.4, 6.6, 11.6]]]);
      const lk = track([[0, [1.4, .4, -1.8]], [3.0, [.4, 1.8, -.8]], [12, [.0, 1.7, -.6]], [17.6, [.2, 1.8, -.8]], [18.1, [.6, 1.8, -1.0]], [20.6, [1.4, 1.4, -1.4]], [24.4, [1.6, 1.2, -1.6]]]);
      cp = ck(lt); cl = lk(lt); }
    const sh = Fi.shake(t), sx = Math.sin(t * 91) * sh, sy = Math.cos(t * 77) * sh;
    cam.position.set(cp[0] + sx, cp[1] + sy, cp[2]); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(cl[0] + sx * .5, cl[1] + sy * .5, cl[2]);
    // —— hydra body (rises at the start of the fight) ——
    const rise = id === 'hydra' ? eo(seg(t, 60.3, 62.6)) : 1, dead = id === 'hydra' && t > FIGHTS.hydra[FIGHTS.hydra.length - 1].t + .1;
    body.root.position.set(BODY.x + Fi.knock('body', t) * .6, -2.2 + 2.2 * rise - (dead ? eo(seg(t, 78.4, 79.6)) * .5 : 0), BODY.z); body.face(cam); body.flash(Fi.flash('body', t));
    // —— necks ——
    let alive = 0; const headPos = {};
    POOL.forEach((p, i) => { const r = Ro[i]; p.g.visible = !!r; p.fallH.root.visible = false; if (!r) return;
      const born = r.born < 0 ? -1 : r.born, grow = born < 0 ? 1 : eo(seg(t, born, born + .35)); if (grow <= 0) { p.g.visible = false; return; }
      const cut = r.cut != null && t >= r.cut, pin = r.gold && t >= T.boulder;
      // the parent's stump is where children grow from; once it has children, hide the stump
      const hasKids = Ro.some(k => k.from === r.id && t >= k.born);
      const sway = Math.sin(ft * 1.7 + i * 1.3) * .18, bob = Math.cos(ft * 2.1 + i) * .12, kb = Fi.knock(r.id, t), fl = Fi.flash(r.id, t);
      const base = new THREE.Vector3(BODY.x + r.bx, body.root.position.y + 1.15, BODY.z + .2);
      let head = new THREE.Vector3(BODY.x + r.hx + sway + kb * .7, body.root.position.y + r.hy + bob, BODY.z + r.hz);
      if (dead && !r.gold) head.y = lerp(head.y, .3, eo(seg(t, 78.3, 79.2)));
      if (pin) head.set(BODY.x + .3, .9, BODY.z + .4);
      const len = cut ? .3 : grow;
      const ctrl = base.clone().add(new THREE.Vector3(-.2, 1.1, .2));
      p.beads.forEach((b, k) => { const u = k / 8 * len, a = 1 - u; b.position.set(a * a * base.x + 2 * a * u * ctrl.x + u * u * head.x, a * a * base.y + 2 * a * u * ctrl.y + u * u * head.y, a * a * base.z + 2 * a * u * ctrl.z + u * u * head.z); b.lookAt(cam.position); b.material.color.setScalar(1 + 2 * fl); b.visible = !(cut && hasKids) && !(pin && k > 5); });
      const tip = p.beads[8].position;
      p.head.root.visible = !r.gold && (!cut || !hasKids); p.gold.root.visible = r.gold && !pin;
      const H = r.gold ? p.gold : p.head; H.root.position.copy(tip).add(new THREE.Vector3(-.15, -.35, .05)); H.face(cam); H.flash(fl);
      H.frame(cut ? (r.burn != null && t >= r.burn ? 'burnt' : 'stump') : (Math.floor(ft * 2.2 + i) % 3 === 0 ? 'open' : 'closed'));
      p.fl.visible = r.burn != null && t >= r.burn && t < r.burn + 1.4; if (p.fl.visible) { p.fl.position.copy(tip).sub(p.g.position).add(new THREE.Vector3(0, -.3, .1)); p.fl.userData.update(t, cam, .8 * (1 - seg(t, r.burn + .9, r.burn + 1.4))); }
      // the severed head falls
      if (cut && t < r.cut + 1.2) { const u = t - r.cut; p.fallH.root.visible = true; p.fallH.root.position.copy(head).add(new THREE.Vector3(-.5 * u, -4.9 * u * u + .8 * u - .3, .2)); p.fallH.frame('closed'); p.fallH.face(cam); p.fallH.mesh.rotation.z = u * 4; if (p.fallH.root.position.y < 0) p.fallH.root.visible = false; }
      headPos[r.id] = head;
      if (!cut && !pin && !(dead && !r.gold)) alive++;
    });
    headPos.body = body.root.position.clone().setY(body.root.position.y + 1.2);
    // —— boulder ——
    boulder.visible = id === 'hydra' && t > T.boulder - .9; const bu = seg(t, T.boulder - .9, T.boulder);
    boulder.position.set(BODY.x + .3, lerp(9, 1.0, ei(bu)), BODY.z + .4); boulder.rotation.set(t * .8 * (1 - bu), t * .5 * (1 - bu), 0);
    dust.userData.update(t);
    // —— Heracles ——
    const pose = Fi.pose(ft) || null; let hx = -1.3, f;
    if (id === 'hydra' && t < 63.6) { hx = lerp(-4.5, -1.3, eo(seg(t, 61.6, 63.4))); f = t > 61.6 && t < 63.4 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 9) % 4] : 'idle0'; }
    else f = pose || (dead ? 'victory' : Math.floor(t * 2) % 2 ? 'idle1' : 'idle0');
    if (pose) hx += .25;
    her.root.position.set(hx, 0, .3); her.frame(f); her.face(cam);
    fill.position.set(hx + .6, 1.9, 2.6);
    // —— Iolaus ——
    const iOn = id === 'hydra' && t > T.iolaus - .2; iol.root.visible = iOn;
    if (iOn) { const run = seg(t, T.iolaus, T.iolaus + 1.2); const ip = Fi.pose(ft, 'ally'); iol.root.position.set(lerp(-6.5, -2.6, eo(run)) + (ip ? .4 : 0), 0, 1.6); iol.frame(run < 1 ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 9) % 4] : ip || (Math.floor(t * 2) % 2 ? 'idle1' : 'idle0')); iol.face(cam);
      const tp = iol.px(34, 22); torchL.position.copy(tp).add(new THREE.Vector3(.3, .2, .5)); torchL.intensity = 3 * flick(t, 2); torchH.position.copy(tp); torchH.visible = true; } else { torchL.intensity = 0; torchH.visible = false; }
    hyL.position.set(BODY.x - .6, 2.6, BODY.z + 1.6); hyL.intensity = 1.4 * (1 + .3 * Math.sin(t * 3));
    // —— FX + HUD ——
    const posOf = tg => headPos[tg] ? headPos[tg].clone() : null;
    fx.update(t, Fi.hits, posOf, her.root.position, cam, 1);
    self.popups = Fi.popups(t, posOf);
    const lh = Fi.lastHit(t), nHits = Fi.hits.filter(h => h.t <= t && !h.miss).length, tot = Fi.hits.filter(h => !h.miss).length;
    self.hud = { boss: 'ไฮดรา', bossHp: id === 'hook' ? .78 - .08 * nHits / tot : Math.max(0, 1 - nHits / tot), heads: alive, combo: Fi.combo(t), skill: Fi.skill(t), skillPos: her.root.position.clone().setY(2.6), fin: Fi.fin(t), show: id === 'hook' ? 1 : ss(seg(t, 62.6, 63.2)) * (1 - ss(seg(t, 80.8, 81.4))) };
    // —— world ——
    W.u.t.value = t * .5; W.u.camPos.value.copy(cam.position); W.u.fogColor.value.copy(scene.fog.color); W.u.fogDensity.value = scene.fog.density; W.u.calm.value = .6;
    W.setLights([{ p: new THREE.Vector3(60, 8, -200), c: new THREE.Color('#ffd890'), i: .9 }, ...(iOn ? [{ p: torchL.position.clone(), c: new THREE.Color('#ffa040'), i: 1.2 }] : [])]);
    flies.userData.update(t); for (const m of reeds) m.lookAt(cam.position.x, m.position.y, cam.position.z);
    const fin = Fi.fin(t), slow = fin != null && fin < .9;
    self.focusPoint = slow ? headPos.body : her.root.position.clone().setY(1.4).lerp(headPos.body, .45);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = 240; post.dof.maxCoc = 16;
    renderer.toneMappingExposure = 1.45 + (Fi.inStop(t) && lh && lh.crit ? .25 : 0); post.vig.uniforms.sat.value = sat; post.vig.uniforms.warm.value = .12;
    post.bloom.strength = .6;
  }
  return self;
}
