// Set — a tabletop map of Greece by candlelight. Shot: montage (100.4–113.4).
// Eight quest markers light up one by one across the map (lights popping on) while the quest log ticks.
import * as THREE from 'three';
import { PX, ramp, h2, fbm, texOf, glow, mulberry } from './px.js';
import { mat, mesh, box, fire } from './kit.js';
import { particles, flick } from './fx.js';
import { T, MONTAGE } from './story.js';
import { seg, ss, eio, eo, lerp, track } from '/core/lib.js';

// procedural "Greece-ish" coastline on parchment (stylised, not a real map)
function mapCanvas(w, h) {
  const P = new PX(w, h), paper = ramp(['#8a6a40', '#a8865a', '#c4a476', '#dcc092', '#ecd6aa']), sea = ramp(['#4a6070', '#5a7486', '#6e889a']);
  P.fill((x, y) => { const u = x / w, v = y / h; const land = fbm(u * 5, v * 5, 3, 5) + .55 * Math.exp(-((u - .45) ** 2 + (v - .45) ** 2) * 6) - (Math.abs(u - .5) > .42 || Math.abs(v - .5) > .42 ? .5 : 0);
    const age = (fbm(u * 12, v * 12, 9) - .5) * .25;
    if (land > .74) { let k = .55 + age + (land > .8 ? .1 : -.05); return paper(k, x, y); }
    if (land > .72) return paper(.08, x, y);
    return sea(.5 + age + ((x + y) % 9 === 0 ? .2 : 0), x, y); });
  for (let i = 0; i < w; i += 2) { P.set(i, 2, paper(.1, 0, 0)); P.set(i, h - 3, paper(.1, 0, 0)); } for (let j = 0; j < h; j += 2) { P.set(2, j, paper(.1, 0, 0)); P.set(w - 3, j, paper(.1, 0, 0)); }
  return P.done();
}
export function buildMap() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0a0806'); scene.fog = new THREE.FogExp2('#0a0806', .03);
  const table = new THREE.Mesh(new THREE.BoxGeometry(20, .5, 14).translate(0, -.25, 0), new THREE.MeshStandardMaterial({ color: '#3a2414', roughness: .8 })); table.receiveShadow = true; scene.add(table);
  const mt = texOf(mapCanvas(192, 144)); const mapM = new THREE.MeshStandardMaterial({ map: mt, roughness: .9 });
  const map = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 7.2), mapM); map.rotation.x = -Math.PI / 2; map.position.y = .01; map.receiveShadow = true; scene.add(map);
  const cand = [[-5.6, -3.2], [5.8, 2.6]].map(([x, z], i) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.18, .2, 1.2, 10).translate(0, .6, 0), new THREE.MeshStandardMaterial({ color: '#efe4c8' })); c.position.set(x, 0, z); c.castShadow = true; const f = fire(.45, { seed: i, i: 3.2 }); f.position.set(x, 1.2, z); const L = new THREE.PointLight('#ffb060', 3.2, 12, 2); L.position.set(x, 1.6, z); L.castShadow = i === 0; scene.add(c, f, L); return { f, L, s: i * 3 }; });
  scene.add(new THREE.HemisphereLight('#6a5a4a', '#120a06', .9));
  // eight markers (gold pins), positions on the land
  const R = mulberry(12), POS = [[-2.4, -1.6], [-.8, -2.2], [.6, -1.0], [2.4, -1.8], [1.6, .6], [-1.6, .4], [-2.8, 1.6], [.4, 2.0]];
  const pins = POS.map(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 0, z); const stick = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .6, 6).translate(0, .3, 0), new THREE.MeshStandardMaterial({ color: '#8a7a5a' })); const head = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), new THREE.MeshStandardMaterial({ color: '#c8a040', emissive: '#ffcc60', emissiveIntensity: 0, metalness: .5, roughness: .3 })); head.position.y = .62; stick.castShadow = head.castShadow = true; const L = new THREE.PointLight('#ffd070', 0, 3, 2); L.position.y = .9; const h = glow('#ffd070', .9, 1); h.position.y = .65; g.add(stick, head, L, h); scene.add(g); return { g, head, L, h }; });
  // dotted route connecting the markers, revealed as they light
  const routeG = new THREE.BufferGeometry(); const pts = []; for (let i = 0; i < POS.length - 1; i++) for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push(lerp(POS[i][0], POS[i + 1][0], u), .03, lerp(POS[i][1], POS[i + 1][1], u)); }
  routeG.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const route = new THREE.Points(routeG, new THREE.PointsMaterial({ color: '#7a2a1a', size: .07 })); scene.add(route);
  const motes = particles(50, (i, t, o) => { const u = (t * .08 + h2(i, 1, 2)) % 1; o.x = -5 + h2(i, 2, 2) * 10; o.y = u * 3; o.z = -4 + h2(i, 3, 2) * 8; o.a = .4 * Math.sin(u * Math.PI); o.s = .03; o.r = 1; o.g = .8; o.b = .5; }, { soft: 1 });
  scene.add(motes);
  const self = { scene, update, focusPoint: null, hud: null, popups: [], tags: [] };
  function update(t, shot, cam, post, renderer) {
    const lt = t - shot.a;
    // straight overhead → tilt down to the 3/4 view across the montage
    const tilt = ss(seg(lt, 0, 6)), a = lerp(.05, .85, tilt), d = lerp(9.5, 8.2, tilt);
    cam.position.set(Math.sin(lt * .02) * .5, Math.cos(a) * d + .2, Math.sin(a) * d); cam.fov = 44; cam.updateProjectionMatrix(); cam.lookAt(0, 0, .1);
    let lit = 0;
    pins.forEach((p, i) => { const t0 = T.montage[i], on = t >= t0, k = on ? eo(seg(t, t0, t0 + .25)) : 0; lit += on ? 1 : 0;
      p.head.material.emissiveIntensity = 1.6 * k; p.L.intensity = 1.1 * k * (1 + .8 * Math.max(0, 1 - (t - t0) / .4)); p.h.visible = on; p.h.material.opacity = .8 * k; p.g.position.y = on ? Math.max(0, .25 * (1 - seg(t, t0, t0 + .2))) : 0; });
    route.geometry.setDrawRange(0, Math.max(0, Math.floor(seg(t, T.montage[0], T.montage[7]) * pts.length / 3)));
    self.tags = []; void pins.map((p, i) => t >= T.montage[i] ? { p: p.g.position.clone().setY(1.0), l1: '✓', l2: MONTAGE[i], age: t - T.montage[i], small: 1 } : null).filter(Boolean);
    for (const c of cand) { const k = flick(t, c.s); c.L.intensity = 2.2 * k; c.f.userData.update(t, cam, .9 + .1 * k); }
    motes.userData.update(t);
    self.focusPoint = null; self.tiltC = lerp(.5, .45, tilt); post.dof.focus = d; post.dof.aper = 140; post.dof.maxCoc = 12;
    renderer.toneMappingExposure = .95; post.vig.uniforms.warm.value = .25; post.vig.uniforms.amt.value = .7;
  }
  return self;
}
