// Perseus — vertical HD-2D film. render(t): pick shot → set → update → post (DOF + tilt-shift + bloom + grade) → 2D overlay
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR_FILM, shotAt, SET_OF, toOrig } from './story.js';
import { drawOverlay, overlayReady } from './ui.js';

const W = 1080, H = 1920, Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? .5);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(40, W / H, .3, 2000);
const ONLY = Q.get('only');
const BUILD = {
  lair: () => import('./set_lair.js').then(m => m.buildLair()),
  beach: () => import('./set_beach.js').then(m => m.buildBeach()),
  palace: () => import('./set_palace.js').then(m => m.buildPalace()),
  temple: () => import('./set_temple.js').then(m => m.buildTemple()),
  storm: () => import('./set_storm.js').then(m => m.buildStorm()),
  stadium: () => import('./set_stadium.js').then(m => m.buildStadium()),
};
const sets = {};
for (const k of Object.keys(BUILD)) if (!ONLY || ONLY.split(',').includes(k)) sets[k] = await BUILD[k]();
const post = makePost(renderer, Object.values(sets)[0].scene, camera, W, H, { ssaa: SS });
const V = post.vig.uniforms;
if (Q.has('nobloom')) post.bloom.enabled = false;
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
await overlayReady();

const _v = new THREE.Vector3();
function tiltCenter(S, shot) {
  if (S.tiltC != null) return S.tiltC;
  if (S.focusPoint) { camera.updateMatrixWorld(); _v.copy(S.focusPoint).project(camera); return Math.min(.8, Math.max(.2, _v.y * .5 + .5)); }
  let w = null; S.scene.traverse(o => { if (o.userData.char === 'hero' && o.visible) w = o; });
  if (!w) return .45;
  camera.updateMatrixWorld(); S.scene.updateMatrixWorld(); w.getWorldPosition(_v); _v.y += .9; _v.project(camera);
  return Math.min(.8, Math.max(.2, _v.y * .5 + .5));
}
window.DUR = DUR_FILM;
window.render = tf => {
  const t = toOrig(tf), shot = shotAt(t), S = sets[SET_OF[shot.id]];
  if (S) {
    post.dof.scene = S.scene;
    post.vig.uniforms.fade.value = 1; post.bloom.strength = .55; post.bloom.radius = .75; post.bloom.threshold = .85; renderer.toneMappingExposure = 1.15;
    V.warm.value = .1; V.sat.value = 1.05; V.amt.value = .55; V.contrast.value = .22;
    post.dof.tiltAmt = 15; post.dof.tiltW = .06; post.dof.tiltF = .22;
    S.update(t, shot, camera, post, renderer);
    post.dof.tiltC = tiltCenter(S, shot); post.dof.maxCoc = Math.max(post.dof.maxCoc, 20);
    if (Q.has('nodof')) { post.dof.maxCoc = 0; post.dof.tiltAmt = 0; }
    post.composer.render();
  } else { renderer.setRenderTarget(null); renderer.setClearColor('#000'); renderer.clear(); }
  drawOverlay(t, shot, tf);
};
window.READY = true;
