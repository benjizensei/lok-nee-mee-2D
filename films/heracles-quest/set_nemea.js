// Set — Nemea canyon at dusk (warm low sun, red rock). Shots: lion (33.4–49.6), loot (49.6–54.4).
// Slashes spark off the hide (0 / MISS); the sword is thrown away; bare-hand choke combo; slow finisher; pelt equips.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, rock, glow, mulberry } from './px.js';
import { mat, mesh, box } from './kit.js';
import { sky, particles } from './fx.js';
import { makeChar } from './chars.js';
import { makeLion } from './monsters.js';
import { makeFight, makeFX } from './fight.js';
import { FIGHTS, T } from './story.js';
import { seg, ss, eio, eo, ei, lerp, track } from '/core/lib.js';

function dirt(w, h, seed) { const P = new PX(w, h), R = ramp(['#4a2a1a', '#6a3e24', '#8a5630', '#a8703e', '#c48c52']); P.fill((x, y) => R(.4 + (fbm(x * .06, y * .06, seed) - .5) * .6 + (h2(x, y, seed) > .97 ? .2 : 0), x, y)); return P.done(); }
function grass() { const P = new PX(16, 14), G = ramp(['#4a3a1a', '#7a6428', '#a88c3a', '#d0b05a']), R = mulberry(5); for (let b = 0; b < 9; b++) { let x = 2 + R() * 12; const hh = 6 + R() * 8, lean = (R() - .4) * .5; for (let y = 0; y < hh; y++) { P.set(Math.round(x), 13 - y, G(.3 + y / hh * .6, b, y)); x += lean; } } return P.done(); }

export function buildNemea() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#d0a080', .011);
  const SK = sky({ top: '#3a3a6a', mid: '#c87a6a', hor: '#ffc48a', moonDir: new THREE.Vector3(.6, .1, -1), moonCol: '#fff0c0', moonI: 1.8 }); scene.add(SK.mesh);
  const dirtM = mat(dirt(96, 96, 3)), rockM = mat(rock(128, 128, { seed: 12, cols: ['#2a1410', '#4a2418', '#6a3422', '#8a4a2c', '#a8623a', '#c47e4a'] }));
  scene.add(mesh(new THREE.BoxGeometry(40, .4, 30).translate(0, -.2, -2), dirtM));
  // canyon walls
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const hh = 6 + h2(i, s, 3) * 6, g = new THREE.BoxGeometry(4, hh, 5, 4, 6, 4); const p = g.attributes.position; for (let k = 0; k < p.count; k++) p.setX(k, p.getX(k) + (fbm(p.getY(k) * .3, p.getZ(k) * .3 + i, 4) - .5) * 2.4); g.translate(0, hh / 2, 0); const m = mesh(g, rockM); m.position.set(s * (8 + h2(i, 2, s) * 2), 0, -12 + i * 4.5); scene.add(m); }
  // lion's cave at the back
  const back = mesh(new THREE.BoxGeometry(16, 10, 3).translate(0, 5, 0), rockM); back.position.set(0, 0, -9); scene.add(back);
  const cave = new THREE.Mesh(new THREE.CircleGeometry(1.8, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#0a0604' })); cave.position.set(1.5, 0, -7.45); scene.add(cave);
  const R = mulberry(4);
  for (let i = 0; i < 14; i++) { const s = .3 + R() * .9, b = mesh(new THREE.DodecahedronGeometry(s, 0), rockM); b.position.set((R() - .5) * 14, s * .3, -6 + R() * 9); if (Math.abs(b.position.x) < 3 && b.position.z > -3) b.position.x += 4 * Math.sign(b.position.x || 1); scene.add(b); }
  const gM = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(grass()), alphaTest: .5, side: THREE.DoubleSide }); gM.map.magFilter = THREE.NearestFilter; gM.map.colorSpace = THREE.SRGBColorSpace;
  const tufts = []; for (let i = 0; i < 50; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.7, .6).translate(0, .3, 0), gM); m.position.set((R() - .5) * 16, 0, -6 + R() * 11); if (Math.abs(m.position.x) < 2.8 && m.position.z > -2.5 && m.position.z < 2.5) continue; scene.add(m); tufts.push(m); }
  const bones = new THREE.MeshStandardMaterial({ color: '#e8dcc0', roughness: .8 });
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .7, 5), bones); b.rotation.set(Math.PI / 2, R() * 3, 0); b.position.set(-2 + R() * 6, .05, -5 + R() * 2); scene.add(b); }
  // light: low sun from the right-back + strong fill from the camera side
  const sun = new THREE.DirectionalLight('#ffc890', 2.2); sun.position.set(10, 6, 4); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(sun);
  scene.add(new THREE.HemisphereLight('#d0a0b0', '#4a2a1a', 1.4));
  const fill = new THREE.PointLight('#ffe8d8', 2.4, 8, 2); scene.add(fill);
  const her = makeChar('heracles', { track: 1 }), herN = makeChar('heraclesN', { track: 1 }), herL = makeChar('heraclesL', { track: 1 }); scene.add(her.root, herN.root, herL.root);
  const lion = makeLion(1.12); scene.add(lion.root);
  const sword = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .03), new THREE.MeshStandardMaterial({ color: '#c8d0dc', metalness: .8, roughness: .25 })); sword.castShadow = true; scene.add(sword);
  const pelt = glow('#ffd070', 1.6, 1); scene.add(pelt);
  const equipL = new THREE.PointLight('#fff0c0', 0, 7, 1.6); scene.add(equipL);
  const fx = makeFX(scene); const Fi = makeFight(FIGHTS.lion);
  const dust = particles(60, (i, t, o) => { const a = h2(i, 1, 2) * 6.28, u = (t * .2 + h2(i, 2, 2)) % 1; o.x = Math.cos(a) * 6 + u * 2; o.y = .2 + u * 2.5; o.z = Math.sin(a) * 3 - 1; o.a = .35 * Math.sin(u * Math.PI); o.s = .05; o.r = 1; o.g = .8; o.b = .5; }, { soft: 1 });
  scene.add(dust);
  const self = { scene, update, focusPoint: null, hud: null, popups: [] };
  function update(t, shot, cam, post, renderer) {
    const ft = Fi.freeze(t), fin = Fi.fin(t);
    // —— staging ——
    let lx = 1.2, lz = -.4, lf = Math.floor(ft * 2) % 2 ? 'idle1' : 'idle0', hx = -1.2, hz = .2, hf = Math.floor(ft * 2) % 2 ? 'idle1' : 'idle0';
    const come = eo(seg(t, 33.5, 35.0)); lx = lerp(1.6, 1.2, come); lz = lerp(-6.8, -.4, come); if (t < 35.0) lf = ['idle0', 'idle1'][Math.floor(t * 6) % 2]; if (t > 34.5 && t < 35.3) lf = 'roar';
    const walkIn = seg(t, 33.4, 35.2); hx = lerp(-4.2, -1.1, eo(walkIn)); if (walkIn > 0 && walkIn < 1) hf = ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 9) % 4];
    const p = Fi.pose(ft); if (p) { hf = p; hx += .2; }
    if (t > 38.2 && t < 39.2) { lf = t < 38.6 ? 'roar' : 'pounce'; lx = lerp(1.2, .3, eo(seg(t, 38.5, 38.8))); if (t > 38.75) { hf = 'hurt'; hx = -1.1 - eo(seg(t, 38.75, 39.1)) * .5; } }
    if (t >= 39.2 && t < 41.0) { lx = lerp(.3, .8, eo(seg(t, 39.2, 39.8))); hx = -1.6 + eo(seg(t, 40.2, 41.0)) * 1.3; lf = 'roar'; if (t > 40.2) hf = ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 10) % 4]; }
    if (t >= 41.0 && t < 48.0) { lx = .75; hx = -.2; lf = Math.floor(ft * 5) % 2 ? 'choke1' : 'choke0'; if (!p) hf = Math.floor(ft * 3) % 2 ? 'squeeze' : 'squeeze1'; }
    if (t >= T.lionKO) { lf = 'ko'; lx = 1.0; hx = -.7; hf = t < 49.0 ? 'victory' : (Math.floor(t * 2) % 2 ? 'idle1' : 'idle0'); }
    if (shot.id === 'loot') { lf = 'ko'; lx = 1.0; hx = -.7; hf = Math.floor(t * 2) % 2 ? 'idle1' : 'idle0'; if (t > T.peltEquip + .4 && t < 53.6) hf = 'victory'; }
    // which Heracles: sword → no sword (after the throw at 39.6) → lion pelt (after equip)
    const ver = t < 39.6 ? her : t < T.peltEquip ? herN : herL;
    for (const c of [her, herN, herL]) c.root.visible = c === ver;
    ver.root.position.set(hx, 0, hz); ver.frame(hf); ver.face(cam);
    lion.root.position.set(lx + Fi.knock('lion', t) * .5, 0, lz); lion.frame(lf); lion.face(cam); lion.flash(Fi.flash('lion', t));
    // thrown sword spins away and sticks in the ground
    const su = seg(t, 39.6, 40.5); sword.visible = t > 39.6 && shot.id === 'lion'; sword.position.set(lerp(-1.6, -4.4, su), .9 + Math.sin(su * Math.PI) * 1.8 - su * .7, lerp(.4, -1.2, su)); sword.rotation.set(0, .3, su < 1 ? t * 14 : 1.2);
    // pelt drops, then equips
    const dropK = seg(t, T.peltDrop, T.peltDrop + .5); pelt.visible = shot.id === 'loot' && t > T.peltDrop && t < T.peltEquip + .2; pelt.position.set(lerp(1.0, -.7, seg(t, T.peltDrop + .8, T.peltEquip)), .5 + Math.sin(t * 3) * .1 + dropK * .6, 0); pelt.material.opacity = .9;
    equipL.position.set(-.7, 1.6, 1.4); equipL.intensity = 18 * Math.max(0, 1 - Math.abs(t - T.peltEquip) / .35);
    // —— camera ——
    let cp, cl;
    if (shot.id === 'lion') {
      const ck = track([[0, [-2.0, 7.0, 12]], [1.8, [-1.6, 4.4, 8.4]], [7.0, [-1.0, 4.2, 7.8]], [10, [-.6, 4.0, 7.2]], [13.2, [-.4, 3.6, 6.4]], [13.9, [.0, 2.3, 4.2]], [15.0, [.1, 2.2, 4.0]], [16.2, [-.6, 4.2, 7.8]]]);
      const lk = track([[0, [.6, .8, -3]], [1.8, [.2, 1.3, -.4]], [13.2, [.3, 1.2, -.3]], [13.9, [.4, 1.3, -.2]], [16.2, [.2, 1.1, -.3]]]);
      cp = ck(t - shot.a); cl = lk(t - shot.a);
    } else { cp = [-.8 + (t - shot.a) * .1, 3.6, 6.8]; cl = [.0, 1.1, -.2]; }
    const sh = Fi.shake(t) + (t > 38.75 && t < 39.1 ? .12 : 0), sx = Math.sin(t * 91) * sh, sy = Math.cos(t * 77) * sh;
    cam.position.set(cp[0] + sx, cp[1] + sy, cp[2]); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(cl[0], cl[1], cl[2]);
    fill.position.set(ver.root.position.x + .8, 2.0, 2.6);
    // FX + HUD
    const posOf = tg => tg === 'lion' ? lion.root.position.clone().setY(1.4).add(new THREE.Vector3(-.6, 0, .2)) : null;
    fx.update(t, Fi.hits, posOf, ver.root.position, cam, 1);
    self.popups = Fi.popups(t, posOf);
    const dealt = Fi.hits.filter(h => h.t <= t && !h.miss).length, tot = Fi.hits.filter(h => !h.miss).length;
    self.hud = shot.id === 'lion' ? { boss: 'สิงโตแห่งนีเมีย', bossHp: t >= T.lionKO ? 0 : 1 - .92 * dealt / tot, combo: Fi.combo(t), skill: Fi.skill(t), skillPos: ver.root.position.clone().setY(2.6), fin, show: ss(seg(t, 35.0, 35.4)) * (1 - ss(seg(t, 48.6, 49.2))), immune: t > 35.5 && t < 39.0 } : null;
    dust.userData.update(t); for (const m of tufts) m.lookAt(cam.position.x, m.position.y, cam.position.z);
    self.focusPoint = ver.root.position.clone().setY(1.2).lerp(lion.root.position.clone().setY(1), .5);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = 220; post.dof.maxCoc = 16;
    renderer.toneMappingExposure = 1.2 + (fin != null && fin > .7 && fin < .9 ? .5 : 0); post.vig.uniforms.warm.value = .18; post.vig.uniforms.sat.value = 1.08;
    post.vig.uniforms.amt.value = fin != null && fin < 1.0 ? .8 : .55;
  }
  return self;
}
