// Set — the underworld gate (violet dark, glowing Styx, lava cracks). Shot: cerberus (113.4–132.4).
// Three heads, three HP bars, fire breath to dodge, bare-hand punches, a triple-choke finisher.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, rock, glow, mulberry } from './px.js';
import { mat, mesh, box, fire } from './kit.js';
import { sky, sea, particles, flick } from './fx.js';
import { makeChar } from './chars.js';
import { makeCerberusBody, makeCerberusHead } from './monsters.js';
import { makeFight, makeFX } from './fight.js';
import { FIGHTS, T } from './story.js';
import { seg, ss, eio, eo, ei, lerp, track } from '/core/lib.js';

function basalt(w, h, seed) { const P = new PX(w, h), R = ramp(['#0c0810', '#18121c', '#241a2a', '#32263a', '#40324a']), L = ramp(['#8a1a08', '#e0501a', '#ffa030']); P.fill((x, y) => { const c = Math.abs(fbm(x * .025, y * .025, seed + 4) - .5); if (c < .007) return L(.4 + (.007 - c) * 70, x, y); return R(.4 + (fbm(x * .1, y * .1, seed) - .5) * .6, x, y); }); return P.done(); }
function lavaEm(w, h, seed) { const P = new PX(w, h), L = ramp(['#8a1a08', '#e0501a', '#ffa030']); P.fill((x, y) => { const c = Math.abs(fbm(x * .025, y * .025, seed + 4) - .5); return c < .007 ? L(.4 + (.007 - c) * 70, x, y) : [0, 0, 0]; }); return P.done(); }

export function buildUnderworld() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#1c1028', .035); scene.background = new THREE.Color('#06040a');
  const fl = mat(basalt(128, 128, 3), { em: lavaEm(128, 128, 3), emCol: '#ffffff', emI: .7 });
  scene.add(mesh(new THREE.BoxGeometry(30, .4, 24).translate(0, -.2, -2), fl));
  const rockM = mat(rock(128, 128, { seed: 33, cols: ['#08060a', '#120e16', '#1c1622', '#28202e', '#342a3c', '#40344a'] }));
  for (let i = 0; i < 12; i++) { const a = -1.3 + i * .22, r = 10, hh = 9 + h2(i, 2, 4) * 5, g = new THREE.BoxGeometry(3, hh, 2, 3, 6, 1); const p = g.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, p.getZ(k) + (fbm(p.getX(k) + i, p.getY(k) * .4, 6) - .5) * 1.6); g.translate(0, hh / 2, 0); const m = mesh(g, rockM); m.position.set(Math.sin(a) * r, 0, -Math.cos(a) * r - 1); m.rotation.y = -a; scene.add(m); }
  // the gate behind Cerberus: two pillars + a black arch
  const pil = new THREE.MeshStandardMaterial({ color: '#2a2030', roughness: .8 });
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(.9, 6, .9).translate(0, 3, 0), pil); c.position.set(2.0 + s * 2.4, 0, -6.5); c.castShadow = true; scene.add(c); }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(6, .9, 1).translate(0, 6.3, 0), pil); lintel.position.set(2.0, 0, -6.5); scene.add(lintel);
  // the Styx: a glowing teal channel on the left
  const styx = sea(60, { ppm: 9, deep: '#04201e', shallow: '#0a4a40', crest: '#3ac0a0' }); styx.mesh.scale.set(.12, 1, 1); styx.mesh.position.set(-6.5, .02, -2); scene.add(styx.mesh);
  // fire bowls
  const bowls = [[-3.4, -3.6], [5.6, -3.0]].map(([x, z], i) => { const g = new THREE.Group(); g.position.set(x, 0, z); const b = new THREE.Mesh(new THREE.CylinderGeometry(.5, .25, .4, 10).translate(0, 1.2, 0), pil); b.castShadow = true; const f = fire(1.0, { seed: i * 4, i: 3.6 }); f.position.y = 1.3; const L = new THREE.PointLight('#ff6a30', 4, 10, 2); L.position.y = 1.9; g.add(b, f, L); scene.add(g); return { f, L, s: i * 2 }; });
  scene.add(new THREE.HemisphereLight('#9a7ab8', '#2a1420', 2.0));
  const key = new THREE.DirectionalLight('#c0a0ff', .6); key.position.set(-4, 12, 8); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 }); scene.add(key);
  const fill = new THREE.PointLight('#f0d8ff', 4.0, 9, 2); scene.add(fill);
  const her = makeChar('heraclesLN', { track: 1 }); scene.add(her.root);
  const cer = makeCerberusBody(1.35); scene.add(cer.root);
  const heads = [0, 1, 2].map(() => makeCerberusHead()); heads.forEach(h => { h.mesh.scale.setScalar(.75); scene.add(h.root); });
  const eyeL = new THREE.PointLight('#ff4020', 2, 8, 2); scene.add(eyeL);
  const breathL = new THREE.PointLight('#ff7a20', 0, 9, 1.6); scene.add(breathL);
  const fx = makeFX(scene, '#ffd0a0'); const Fi = makeFight(FIGHTS.cerberus);
  const KO = {}; for (const h of FIGHTS.cerberus) if (h.ko) KO[h.ko] = h.t;
  const HEADO = [[-1.35, 1.55, .35], [-1.0, 1.9, .05], [-.65, 1.5, -.25]];
  const headPos = () => HEADO.map(([x, y, z], i) => { const ko = KO['c' + (i + 1)], down = ko != null ? ss(seg(nowT, ko, ko + .5)) : 0; return new THREE.Vector3(cer.root.position.x + x, cer.root.position.y + y - down * .9, cer.root.position.z + z + .3); });
  let nowT = 0;
  // breath: flame particles streaming from a head toward the hero's spot
  const breath = particles(220, (i, t, o) => { o.a = 0; let b = -1; T.breath.forEach((bt, k) => { if (t >= bt && t < bt + 1.0) b = k; }); if (b < 0) return; const u = ((t - T.breath[b]) * 2.2 + h2(i, 1, 3)) % 1, age = t - T.breath[b]; const src = headPos()[b]; const tx = her.root.position.x + .2, ty = .8;
    o.x = src.x + (tx - src.x) * u * 1.1 + (h2(i, 2, 3) - .5) * u * .8; o.y = src.y - .3 + (ty - src.y + .3) * u + (h2(i, 3, 3) - .5) * u * .6; o.z = src.z + .2 + (h2(i, 4, 3) - .5) * u * .6; o.a = (1 - u) * Math.min(1, age * 6) * Math.min(1, (1 - age) * 4); o.s = .2 + u * .45; o.a *= 1.6; o.r = 1; o.g = .55 - u * .3; o.b = .15; }, { soft: 1 });
  scene.add(breath);
  const embers = particles(80, (i, t, o) => { const u = (t * .15 + h2(i, 1, 5)) % 1; o.x = -6 + h2(i, 2, 5) * 12; o.y = u * 6; o.z = -5 + h2(i, 3, 5) * 8; o.a = .7 * Math.sin(u * Math.PI); o.s = .04; o.r = 1; o.g = .4; o.b = .1; });
  scene.add(embers);
  const self = { scene, update, focusPoint: null, hud: null, popups: [] };
  function update(t, shot, cam, post, renderer) {
    nowT = t; const lt = t - shot.a, ft = Fi.freeze(t), fin = Fi.fin(t);
    const ck = track([[0, [-3.0, 8.5, 13]], [4.0, [-1.6, 5.0, 9.0]], [8.4, [-1.2, 4.4, 8.0]], [16.4, [-1.0, 4.0, 7.2]], [16.8, [-.4, 2.6, 4.6]], [17.6, [-.4, 2.5, 4.4]], [19.0, [-1.0, 5.0, 9.0]]]);
    const lk = track([[0, [1.0, 1.5, -4]], [4.0, [.4, 1.8, -1.4]], [16.4, [.0, 1.8, -1.0]], [16.8, [.0, 1.9, -1.0]], [19.0, [.4, 1.5, -1.2]]]);
    const cp = ck(lt), cl = lk(lt), sh = Fi.shake(t) + (T.breath.some(b => t > b && t < b + .9) ? .03 : 0);
    cam.position.set(cp[0] + Math.sin(t * 91) * sh, cp[1] + Math.cos(t * 77) * sh, cp[2]); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(...cl);
    // Cerberus rises out of the gate's darkness
    const rise = eo(seg(t, T.cerberusRise - 1.5, T.cerberusRise + .8)), done = fin != null && fin > .7 || t > 131.0;
    cer.root.position.set(lerp(2.4, 1.3, rise) + Fi.knock('cer', t) * .5, 0, lerp(-6.0, -1.4, rise)); cer.face(cam); cer.flash(Fi.flash('cer', t));
    const HP = headPos();
    heads.forEach((h, i) => { const id = 'c' + (i + 1), ko = KO[id] != null && t >= KO[id]; const breathing = T.breath[i] != null && t >= T.breath[i] - .2 && t < T.breath[i] + 1.0;
      h.root.position.copy(HP[i]).add(new THREE.Vector3(-Fi.knock(id, t) * .8, Math.sin(ft * 3 + i * 2) * .05, 0)); h.frame(ko || (done && i === 2) ? 'ko' : breathing || Math.floor(ft * 2 + i) % 5 === 0 ? 'open' : 'idle'); h.face(cam); h.flash(Fi.flash(id, t) + (id === 'c3' ? Fi.flash('cer', t) : 0)); h.mesh.rotation.z = ko ? .5 : 0; });
    // Heracles: walks in, dodges the breath, punches; then chokes all three
    let hx = -1.4, hy = 0, hf = Math.floor(ft * 2) % 2 ? 'idle1' : 'idle0';
    const w = seg(t, 114.2, 117.0); if (w < 1) { hx = lerp(-5, -1.6, eo(w)); hf = ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 8) % 4]; }
    T.breath.forEach(b => { const u = (t - b) / 1.0; if (u >= 0 && u < 1) { hx -= Math.sin(u * Math.PI) * .55; hy = Math.sin(Math.min(1, u * 1.6) * Math.PI) * .5; hf = 'w1'; } });
    const p = Fi.pose(ft); if (p) { hf = p; hx = -.95; }
    if (t > 129.2 && t < 131.6) { hx = -.75; if (!p) hf = Math.floor(ft * 4) % 2 ? 'squeeze' : 'squeeze1'; }
    if (t >= 131.6) { hx = -1.2; hf = 'victory'; }
    her.root.position.set(hx, hy, .4); her.frame(hf); her.face(cam); her.shadowBlob.visible = hy < .1;
    fill.position.set(hx + .8, 2.0, 2.8);
    eyeL.position.set(cer.root.position.x - 1.0, 2.6, cer.root.position.z + 1.6); eyeL.intensity = 2.4 * rise;
    const bk = T.breath.reduce((a, b) => Math.max(a, t > b && t < b + 1 ? Math.sin((t - b) * Math.PI) : 0), 0); breathL.position.set(hx + .8, 1.6, 1.2); breathL.intensity = 9 * bk;
    breath.userData.update(t); embers.userData.update(t);
    for (const b of bowls) { const k = flick(t, b.s); b.L.intensity = 3.4 * k; b.f.userData.update(t, cam, .9 + .1 * k); }
    styx.u.t.value = t * .4; styx.u.camPos.value.copy(cam.position); styx.u.fogColor.value.copy(scene.fog.color); styx.u.fogDensity.value = scene.fog.density; styx.u.bright.value = 1.6;
    // FX + HUD (three HP bars)
    const posOf = tg => tg === 'cer' ? HP[1].clone() : tg && tg[0] === 'c' ? HP[+tg[1] - 1].clone() : null;
    fx.update(t, Fi.hits, posOf, her.root.position, cam, 1);
    self.popups = Fi.popups(t, posOf);
    const hp = [1, 1, 1]; for (const h of Fi.hits) if (h.t <= t && h.hp) hp[h.hp[0]] = Math.max(0, hp[h.hp[0]] - h.hp[1]);
    for (const k in KO) if (t >= KO[k]) hp[+k[1] - 1] = 0;
    self.hud = { boss: 'เซอร์เบอรัส', bars: hp, combo: Fi.combo(t), skill: Fi.skill(t), skillPos: her.root.position.clone().setY(2.6), fin, show: ss(seg(t, 121.8, 122.3)) * (1 - ss(seg(t, 131.8, 132.3))), rule: t > 119.5 && t < 132 };
    self.focusPoint = her.root.position.clone().setY(1.3).lerp(HP[1], .4);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = 220; post.dof.maxCoc = 16;
    renderer.toneMappingExposure = 1.45; post.vig.uniforms.warm.value = .05; post.vig.uniforms.amt.value = fin != null && fin < 1 ? .8 : .6; post.bloom.strength = .7;
  }
  return self;
}
