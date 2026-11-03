// Set — open sky above the cloud sea at dusk. Shots: erlang (transformation chase + duel), capture (dog bite, Laozi's ring).
import * as THREE from 'three';
import { h2, glow } from './px.js';
import { sky, particles } from './fx.js';
import { makeChar } from './chars.js';
import { makeForm, makeCloudRide, makeDog } from './creatures.js';
import { makeFight, makeFX } from './fight.js';
import { FIGHTS, T } from './story.js';
import { seg, ss, eio, eo, ei, lerp, track } from '/core/lib.js';

export function buildSky() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#e8b8a0', .01);
  const SK = sky({ top: '#3a3a7a', mid: '#c87aa0', hor: '#ffc890', moonDir: new THREE.Vector3(.5, .15, -1), moonCol: '#fff0c0', moonI: 1.6 }); scene.add(SK.mesh);
  const sea = particles(300, (i, t, o) => { const x = (h2(i, 1, 2) - .5) * 80, z = (h2(i, 2, 2) - .5) * 60 - 10; o.x = x + t * .4 % 6; o.z = z; o.y = -5 - h2(i, 3, 2) * 3; o.a = .7; o.s = 4 + h2(i, 4, 2) * 4; o.r = 1; o.g = .86 + h2(i, 5, 2) * .1; o.b = .8; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(sea);
  const streaks = particles(120, (i, t, o) => { const u = (t * 1.6 + h2(i, 1, 4)) % 1; o.x = 12 - u * 24; o.y = -2 + h2(i, 2, 4) * 8; o.z = -6 + h2(i, 3, 4) * 8; o.a = .35 * Math.sin(u * Math.PI); o.s = .1; o.r = 1; o.g = 1; o.b = 1; }, { soft: 1 });
  scene.add(streaks);
  scene.add(new THREE.HemisphereLight('#ffd8c8', '#8a6a9a', 1.6));
  const sun = new THREE.DirectionalLight('#ffd8a8', 1.8); sun.position.set(10, 6, 8); scene.add(sun);
  const fill = new THREE.PointLight('#fff0e0', 2.2, 10, 2); scene.add(fill);
  const wk = makeChar('wukong', { track: 1 }), er = makeChar('erlang', { scale: 1.08 }), lao = makeChar('laozi'); scene.add(wk.root, er.root, lao.root);
  const cW = makeCloudRide(), cE = makeCloudRide(), cL = makeCloudRide(); scene.add(cW.root, cE.root, cL.root);
  const forms = { sparrow: makeForm('sparrow'), hawk: makeForm('hawk'), fish: makeForm('fish'), crane: makeForm('crane') }; Object.values(forms).forEach(f => scene.add(f.root));
  const dog = makeDog(); scene.add(dog.root);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.45, .09, 8, 24), new THREE.MeshStandardMaterial({ color: '#f0d060', metalness: .8, roughness: .2, emissive: '#ffb030', emissiveIntensity: .7 })); scene.add(ring);
  const eyeL = new THREE.PointLight('#ffe060', 0, 6, 2); scene.add(eyeL); const eyeH = glow('#ffe080', .35, .7); scene.add(eyeH);
  const poof = particles(80, (i, t, o) => { o.a = 0; for (const p0 of [...T.forms, 107.4]) { const u = t - p0; if (u < 0 || u > .7) continue; const a = h2(i, 1, 3) * 6.28, who = i % 2; const c = who ? er.root.position : wk.root.position; o.x = c.x + Math.cos(a) * u * 1.6; o.y = c.y + 1 + Math.sin(a) * u; o.z = c.z + .2; o.a = 1 - u / .7; o.s = .35; o.r = 1; o.g = 1; o.b = 1; } }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(poof);
  const stars = particles(12, (i, t, o) => { const u = t - T.ring; o.a = 0; if (u < 0) return; const a = i / 12 * 6.28 + t * 4; o.x = wk.root.position.x + Math.cos(a) * .5; o.z = wk.root.position.z + Math.sin(a) * .3; o.y = wk.root.position.y + 2.3; o.a = 1; o.s = .12; o.r = 1; o.g = .9; o.b = .3; });
  scene.add(stars);
  const fx = makeFX(scene, '#fff0b0'); const Fi = makeFight(FIGHTS.erlang);
  const self = { scene, update, focusPoint: null, hud: null, popups: [], tags: [] };
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a, ft = Fi.freeze(t), idle = (o = 0) => Math.floor(ft * 1.6 + o) % 2 ? 'idle1' : 'idle0';
    let wp = new THREE.Vector3(-.8, 0, 0), ep = new THREE.Vector3(1.0, .6, -.6), wf = idle(), ef = idle(.5);
    let wForm = null, eForm = null;
    if (shot.id === 'erlang') {
      ep.y = lerp(9, .6, eo(seg(t, T.erlangIn - 1.0, T.erlangIn + 1.0)));
      const [f1, f2, f3, f4] = T.forms;
      if (t >= f1 && t < 107.4) { wForm = t < f3 ? 'sparrow' : 'fish'; }
      if (t >= f2 && t < 107.4) { eForm = t < f4 ? 'hawk' : 'crane'; }
      if (wForm) { const u = t - f1; wp.set(-.3 + Math.sin(u * 2.2) * 1.2, .2 + Math.sin(u * 3.1) * .6, Math.cos(u * 1.7) * .8); }
      if (eForm) { const u = t - f1 - .45; ep.set(-.3 + Math.sin(u * 2.2) * 1.2 + .9, .5 + Math.sin(u * 3.1) * .6 + .4, Math.cos(u * 1.7) * .8 - .3); }
      if (t > 110.6) { const p = Fi.pose(ft), pe = Fi.pose(ft, 'enemy'); wf = p || (pe ? 'hurt' : idle()); ef = pe || (p ? 'idle1' : idle(.4)); wp.set(-.6 - Fi.knock('wk', t), 0, .2); ep.set(.7 + Fi.knock('er', t), .2, -.2);
        const fin = Fi.fin(t); if (fin != null && fin > .7) { const u = fin - .7; wp.x -= Math.min(.6, u * 2); ep.x += Math.min(.6, u * 2); } }
    } else {   // capture
      wp.set(-.3, 0, .2); ep.set(1.6, .4, -.8);
      const dogRun = seg(t, T.dog - 1.4, T.dog); dog.root.visible = true; dog.root.position.set(lerp(5, .3, eo(dogRun)), .2 + Math.abs(Math.sin(t * 12)) * .15 * (1 - dogRun), .5); dog.frame(t > T.dog - .1 ? 'bite' : Math.floor(t * 10) % 2 ? 'run0' : 'run1');
      wf = t > T.ring ? 'kneel' : t > T.dog ? 'hurt' : idle(); if (t > T.ring) wp.y = -.1;
      lao.root.visible = true; lao.root.position.set(-1.2, 3.4 + Math.sin(t) * .1, -2.0); lao.frame(t > T.ring - 1.2 ? 'point' : 'idle0');
      const ru = seg(t, T.ring - .9, T.ring); ring.visible = t > T.ring - .9 && t < T.ring + .6; ring.position.set(lerp(-2.0, wp.x, ru), lerp(4.6, 2.1, ei(ru)), lerp(-1.6, .2, ru)); ring.rotation.set(t * 8, t * 5, 0);
    }
    if (shot.id === 'erlang') { dog.root.visible = false; lao.root.visible = false; ring.visible = false; }
    wk.root.visible = !wForm; er.root.visible = !eForm; Object.entries(forms).forEach(([k, f]) => { f.root.visible = k === wForm || k === eForm; });
    wk.root.position.copy(wp); er.root.position.copy(ep); if (wForm) forms[wForm].root.position.copy(wp).add(new THREE.Vector3(0, 1, 0)); if (eForm) forms[eForm].root.position.copy(ep).add(new THREE.Vector3(0, 1, 0));
    cW.root.position.copy(wp).add(new THREE.Vector3(0, -.2, .05)); cE.root.position.copy(ep).add(new THREE.Vector3(0, -.2, .05)); cW.root.visible = !wForm; cE.root.visible = !eForm; cL.root.visible = lao.root.visible; cL.root.position.copy(lao.root.position).add(new THREE.Vector3(0, -.2, .05));
    wk.frame(wf); er.frame(ef); wk.mesh.material.color.setScalar(1 + 2 * Fi.flash('wk', t) + 2 * Fi.flash('both', t)); er.mesh.material.color.setScalar(1 + 2 * Fi.flash('er', t) + 2 * Fi.flash('both', t));
    // camera
    let cp, cl;
    if (shot.id === 'erlang') { const k = track([[0, [0, 2, 9]], [2, [.2, 2.6, 8.4]], [7, [.2, 2.4, 9.4]], [15.6, [-.4, 2.2, 7.6]], [22.2, [0, 2.0, 7.0]], [22.9, [0, 1.8, 5.0]], [24.06, [0, 2.4, 8.4]]]), l = track([[0, [0, 3.2, -1]], [2, [.2, 1.3, -.4]], [24.06, [0, 1.0, -.2]]]); cp = k(lt); cl = l(lt); }
    else { cp = [.4 - lt * .05, 2.6, 7.4]; cl = [.4, 1.1, -.2]; }
    const sh = Fi.shake(t) + (Math.abs(t - T.ring) < .3 ? .12 : 0) + (Math.abs(t - T.dog) < .2 ? .06 : 0);
    cam.position.set(cp[0] + Math.sin(t * 91) * sh, cp[1] + Math.cos(t * 77) * sh, cp[2]); cam.fov = 42; cam.updateProjectionMatrix(); cam.lookAt(...cl);
    for (const c of [wk, er, lao, cW, cE, cL, dog, ...Object.values(forms)]) if (c.root.visible) c.face(cam, c === er || c === dog || c === forms.hawk || c === forms.crane);
    eyeL.position.copy(ep).add(new THREE.Vector3(-.2, 2.2, .8)); eyeL.intensity = er.root.visible ? 2.4 : 0; eyeH.position.copy(ep).add(new THREE.Vector3(-.05, 1.92, .1)); eyeH.visible = er.root.visible;
    fill.position.copy(wp).add(new THREE.Vector3(.8, 2, 2.6));
    const posOf = tg => tg === 'wk' ? wk.root.position.clone().setY(wp.y + 1.3) : tg === 'er' ? er.root.position.clone().setY(ep.y + 1.3) : tg === 'both' ? wp.clone().lerp(ep, .5).setY(1.4) : null;
    if (shot.id === 'erlang') { fx.update(t, Fi.hits, posOf, wk.root.position, cam, 1); self.popups = Fi.popups(t, posOf);
      const dmg = Fi.hits.filter(h => h.t <= t && h.tg === 'er').length, taken = Fi.hits.filter(h => h.t <= t && h.tg === 'wk').length;
      self.hud = { boss: 'เอ้อหลางเสิน', bossHp: 1 - .07 * dmg, selfHp: 1 - .08 * taken, combo: Fi.combo(t), skill: Fi.skill(t), skillPos: wk.root.position.clone().setY(2.6), fin: Fi.fin(t), show: ss(seg(t, 110.4, 110.8)) * (1 - ss(seg(t, 118.6, 119.0))) };
      self.tags = [wForm && { p: wp.clone().setY(wp.y + 2.2), l2: 'ลิง → ' + (wForm === 'sparrow' ? 'นก' : 'ปลา'), age: t - (wForm === 'sparrow' ? T.forms[0] : T.forms[2]), small: 1 }, eForm && { p: ep.clone().setY(ep.y + 2.4), l2: 'เทพ → ' + (eForm === 'hawk' ? 'เหยี่ยว' : 'นกกระสา'), age: t - (eForm === 'hawk' ? T.forms[1] : T.forms[3]), small: 1 }].filter(Boolean);
    } else { self.hud = null; self.popups = []; self.tags = []; fx.update(t, [], () => null, wk.root.position, cam, 1); }
    sea.userData.update(t); streaks.userData.update(t); poof.userData.update(t); stars.userData.update(t); stars.visible = shot.id === 'capture';
    self.focusPoint = wp.clone().lerp(ep, .5).setY(1.2);
    post.dof.focus = cam.position.distanceTo(self.focusPoint); post.dof.aper = 200; post.dof.maxCoc = 14;
    renderer.toneMappingExposure = 1.1; post.vig.uniforms.warm.value = .15;
  }
  return self;
}
