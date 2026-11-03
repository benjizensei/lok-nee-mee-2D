// Real-time combat grammar, driven by a scripted hit list (story.js FIGHTS):
// hit-stop (pose hold), screen shake, slash arcs, impact sparks, white flash + knockback on the target,
// floating damage numbers, combo counter, skill banners. Deterministic: everything is a function of t.
import * as THREE from 'three';
import { particles } from './fx.js';
import { h2 } from './px.js';

const stopOf = h => h.stop ?? (h.fin ? .35 : h.crit ? .12 : h.miss ? .05 : .075);
export function makeFight(hits) {
  const H = hits.slice().sort((a, b) => a.t - b.t);
  const F = {
    hits: H,
    // pose time: animation holds at the hit for its stop window (the picture "sticks" on impact)
    freeze(t) { for (const h of H) if (t >= h.t && t < h.t + stopOf(h)) return h.t; return t; },
    inStop(t) { return H.some(h => t >= h.t && t < h.t + stopOf(h)); },
    shake(t) { let a = 0; for (const h of H) { const u = t - h.t; if (u < 0 || u > .6) continue; a = Math.max(a, (h.fin ? .32 : h.crit ? .16 : h.miss ? .04 : .07) * Math.exp(-u / (h.fin ? .25 : .1))); } return a; },
    // hero / ally pose from the hit list: windup → strike → recover
    pose(t, who = 'hero') {
      for (const h of H) { if ((h.who || 'hero') !== who) continue; const u = t - h.t;
        const pre = h.k === 'grab' || h.k === 'squeeze' ? .1 : .13;
        if (u >= -pre && u < 0) return h.k.startsWith('slash') ? 'windup' : h.k === 'squeeze' ? 'squeeze1' : h.k === 'fire' ? 'thrust' : h.k === 'punch' || h.k === 'punch2' || h.k === 'kick' ? 'punch2' : h.k;
        if (u >= 0 && u < .2 + stopOf(h)) return h.k === 'fire' ? 'thrust' : h.k; }
      return null;
    },
    flash(tg, t) { let k = 0; for (const h of H) if (h.tg === tg || (h.tg2 === tg)) { const u = t - h.t; if (u >= 0 && u < .3) k = Math.max(k, Math.exp(-u / .07)); } return k; },
    knock(tg, t) { let d = 0; for (const h of H) if (h.tg === tg && !h.miss) { const u = t - h.t; if (u >= 0 && u < .6) d += (h.crit ? .5 : .18) * Math.sin(Math.min(1, u / .08) * Math.PI / 2) * Math.exp(-Math.max(0, u - .08) / .18); } return d; },
    // floating numbers (age 0..1)
    popups(t, posOf) { const out = []; for (const h of H) { const u = t - h.t; if (!h.d || u < 0 || u > 1.0) continue; const p = posOf(h.tg); if (!p) continue;
      out.push({ p: p.clone().add(new THREE.Vector3((h2(H.indexOf(h), 1, 7) - .5) * .6, .3 + u * .9, 0)), text: h.d, crit: !!h.crit, miss: !!h.miss, fin: !!h.fin, age: u }); } return out; },
    combo(t) { let n = 0, last = -9; for (const h of H) { if (h.t > t) break; if (h.miss) { n = 0; continue; } n = (h.t - last < 2.6) ? n + 1 : 1; last = h.t; } return { n, since: t - last }; },
    skill(t) { for (const h of H) if (h.skill && t >= h.t - .45 && t < h.t + 1.3) return { text: h.skill, age: t - (h.t - .45) }; return null; },
    lastHit(t) { let r = null; for (const h of H) if (h.t <= t) r = h; return r; },
    fin(t) { for (const h of H) if (h.fin && t >= h.t - .7 && t < h.t + 1.2) return (t - (h.t - .7)); return null; },
  };
  return F;
}

// crescent slash arc texture
let _arc = null;
function arcTex() {
  if (_arc) return _arc;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  for (let i = 0; i < 18; i++) { const a = i / 17; g.strokeStyle = `rgba(255,${230 - a * 60},${190 - a * 120},${(1 - a) * .9})`; g.lineWidth = 6 * (1 - a) + 1; g.beginPath(); g.arc(64, 64, 50 - i * .6, -Math.PI * .85 + a * .4, Math.PI * .15 - a * .1); g.stroke(); }
  _arc = new THREE.CanvasTexture(c); _arc.colorSpace = THREE.SRGBColorSpace; return _arc;
}
// slash arcs + sparks, attached to a scene
export function makeFX(scene, color = '#fff0c8') {
  const arcs = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: arcTex(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })); m.renderOrder = 5; m.visible = false; scene.add(m); return m; });
  let H = [], posOf = () => null, heroPos = new THREE.Vector3(), facing = 1;
  const sparks = particles(180, (i, t, o) => {
    const hi = i % 12, k = Math.floor(i / 12), h = H[H.length - 1 - hi]; o.a = 0; o.x = o.y = o.z = 0; if (!h) return;
    const u = t - h.t; if (u < 0 || u > .5) return; const p = posOf(h.tg); if (!p) return;
    const a = h2(i, 3, 5) * 6.283, sp = (h.crit ? 4.5 : 2.6) * (.4 + h2(i, 4, 5)), g = 6;
    o.x = p.x + Math.cos(a) * sp * u; o.y = p.y + Math.sin(a) * sp * u * .8 + 1.2 * u - g * u * u * .5; o.z = p.z + .3; o.a = (1 - u / .5) * (h.miss ? .8 : 1.4); o.s = h.crit ? .09 : .06;
    if (h.miss) { o.r = 1; o.g = .85; o.b = .4; } else if (h.k === 'fire') { o.r = 1; o.g = .5; o.b = .12; } else { o.r = 1; o.g = .95; o.b = .8; }
  }, { soft: 0 });
  scene.add(sparks);
  const ROT = { slash1: 0, slash2: .9, slash3: -1.0, windup: 0 };
  return {
    update(t, hits, getPos, hero, cam, face = 1) {
      H = hits.filter(h => h.t <= t + .01).slice(-12); posOf = getPos; heroPos.copy(hero); facing = face;
      const active = hits.filter(h => h.k.startsWith('slash') && t - h.t >= -.03 && t - h.t < .2).slice(-3);
      arcs.forEach((m, i) => { const h = active[i]; m.visible = !!h; if (!h) return; const u = Math.max(0, (t - h.t + .03) / .23);
        m.position.copy(heroPos).add(new THREE.Vector3(1.0 * facing, 1.15, .1)); m.lookAt(cam.position); m.rotateZ((ROT[h.k] || 0) + u * 1.4 * (h.k === 'slash3' ? -1 : 1)); if (facing < 0) m.rotateY(Math.PI);
        const s = (h.crit ? 1.8 : 1.35) * (.8 + .4 * u); m.scale.set(s, s, 1); m.material.opacity = (1 - u) * (h.crit ? .85 : .65); });
      sparks.userData.update(t);
    },
  };
}
