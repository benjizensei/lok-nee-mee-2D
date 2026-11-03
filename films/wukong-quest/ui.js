// 2D overlay (1080×1920): action-RPG HUD (boss bars, combo, floating damage, skill banners, K.O.), quest windows,
// stamps, quest log, name tags, chapter cards, subtitles, title. One metal (gold) + paper white on dark plates.
import * as THREE from 'three';
import { VO, T, CHAPTERS } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
const W = 1080, H = 1920;
let DURS = {};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const back = x => { x = clamp(x) - 1; return 1 + x * x * (2.8 * x + 1.8); };
const env = (t, a, b, fi = .3, fo = .3) => Math.min(ss(seg(t, a, a + fi)), 1 - ss(seg(t, b - fo, b)));
const GOLD = '#d8b86a', GOLD2 = '#f2d896', PAPER = '#f6f0e2';
const F = { th: '"Trirong"', thB: '"Taviraj"', lat: 'Cinzel' };
const TXT = [];
export async function overlayReady() {
  await Promise.all([`400 40px ${F.th}`, `600 40px ${F.th}`, `600 40px ${F.thB}`, `800 40px ${F.thB}`, `600 40px ${F.lat}`, `700 40px ${F.lat}`].map(f => document.fonts.load(f, 'กขซุนหงอคง ABC 0123')));
  DURS = await (await fetch('voices/dur.json')).json();
}
const dur = id => DURS[id] || 3;
const _v = new THREE.Vector3();
const toScreen = (p, cam) => { _v.copy(p).project(cam); return [(_v.x * .5 + .5) * W, (-_v.y * .5 + .5) * H, _v.z < 1]; };
// —— primitives ——
function plate(x, y, w, h, a = 1, o = {}) {
  g.save(); g.globalAlpha = a;
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(16,18,34,.9)'); gr.addColorStop(1, 'rgba(6,8,18,.92)');
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.strokeStyle = o.col || 'rgba(216,184,106,.95)'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  g.strokeStyle = 'rgba(216,184,106,.35)'; g.lineWidth = 1.5; g.strokeRect(x + 9.5, y + 9.5, w - 19, h - 19);
  g.fillStyle = GOLD2; for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { g.beginPath(); g.moveTo(cx, cy - 9); g.lineTo(cx + 9, cy); g.lineTo(cx, cy + 9); g.lineTo(cx - 9, cy); g.fill(); }
  g.restore();
}
function text(s, x, y, font, col, o = {}) {
  g.save(); g.font = font; g.fillStyle = col; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'alphabetic';
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur || 18; }
  else { g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 8; g.shadowOffsetY = 2; }
  g.globalAlpha = o.a ?? 1; g.fillText(s, x, y);
  const w = g.measureText(s).width; g.restore();
  if ((o.a ?? 1) > .5 && !o.noTrack) { const x0 = o.align === 'center' ? x - w / 2 : x; TXT.push({ id: o.id || s, text: s, x0, y0: y - 60, x1: x0 + w, y1: y + 10 }); }
  return w;
}
function wrap(s, maxW, font) {   // Thai: break at the spaces between phrases
  g.save(); g.font = font; const words = s.split(' '), lines = []; let cur = '';
  for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; }
  if (cur) lines.push(cur); g.restore(); return lines;
}
function bar(x, y, w, h, k, col, a = 1) {
  g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(x - 3, y - 3, w + 6, h + 6); g.fillStyle = '#2a0e10'; g.fillRect(x, y, w, h);
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]); g.fillStyle = gr; g.fillRect(x, y, w * k, h);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x, y, w * k, 3); g.strokeStyle = GOLD; g.lineWidth = 2; g.strokeRect(x - 1, y - 1, w + 2, h + 2); g.restore();
}

// —— chapter card: band near the top third ——
function chapter(t) {
  for (const c of CHAPTERS) {
    const a = env(t, c.t + .15, c.t + 2.9, .35, .4); if (a <= 0) continue;
    g.save(); g.globalAlpha = a;
    const y = 470, gr = g.createLinearGradient(0, y - 120, 0, y + 90); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(4,6,14,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, y - 120, W, 210);
    g.restore();
    text(c.n, W / 2, y - 34, `600 40px ${F.thB}`, GOLD2, { align: 'center', a, glow: 'rgba(255,200,120,.4)' });
    g.save(); g.globalAlpha = a; g.strokeStyle = GOLD; g.lineWidth = 2; const lw = 150 * (.4 + .6 * ss(seg(t, c.t + .15, c.t + .9))); g.beginPath(); g.moveTo(W / 2 - lw, y - 8); g.lineTo(W / 2 + lw, y - 8); g.stroke(); g.restore();
    text(c.name, W / 2, y + 52, `800 66px ${F.thB}`, PAPER, { align: 'center', a, glow: 'rgba(255,190,110,.35)' });
  }
}
// —— narration subtitles: lower third, above the phone UI safe zone ——
function subtitle(t, v) {
  const d = dur(v.id), nxt = VO.find(w => w.t > v.t), end = Math.min(v.t + Math.max(1.8, d + .6), nxt ? nxt.t - .3 : 1e9), a = ss(seg(t, v.t - .3, v.t)) * (1 - ss(seg(t, end, end + .25)));
  if (a <= 0) return;
  const font = `600 42px ${F.th}`, lines = wrap(v.sub, 960, font), lh = 58, yb = 1700;
  g.save(); g.font = font; g.globalAlpha = a * .5; g.fillStyle = 'rgba(0,0,0,1)';
  lines.forEach((L, i) => { const w = g.measureText(L).width + 36, y = yb - (lines.length - 1 - i) * lh; g.fillRect(W / 2 - w / 2, y - 44, w, 56); });
  g.restore();
  lines.forEach((L, i) => text(L, W / 2, yb - (lines.length - 1 - i) * lh, font, PAPER, { a, align: 'center', noTrack: 1 }));
  if (a > .5) TXT.push({ id: v.id, text: v.sub, x0: 60, y0: yb - lines.length * lh, x1: W - 60, y1: yb + 12 });
}

// —— boss HUD (top) ——
function bossHud(t, S) {
  const h = S.hud; if (!h || !h.show) return; const a = h.show, x = 90, y = 150, w = 900;
  text('BOSS', x, y, `700 32px ${F.lat}`, '#ff7a6a', { a, noTrack: 1 });
  text(h.boss, x + 112, y, `800 46px ${F.thB}`, PAPER, { a, id: 'boss' });
  if (h.count != null) { text(h.sub + '  ' + h.count.toLocaleString('en-US'), x + w, y, `800 40px ${F.thB}`, '#ffb070', { a, align: 'right', id: 'count' }); }
  else if (h.bars) { h.bars.forEach((k, i) => { const bw = (w - 40) / 3; bar(x + i * (bw + 20), y + 24, bw, 24, k, k > 0 ? ['#ff9a6a', '#a8282c'] : ['#555', '#333'], a); text(['หัวซ้าย', 'หัวกลาง', 'หัวขวา'][i], x + i * (bw + 20), y + 86, `600 28px ${F.th}`, k > 0 ? '#e8d8c8' : '#8a8078', { a, noTrack: 1 }); }); }
  else bar(x, y + 24, w, 26, h.bossHp, ['#9cf0a0', '#2f8a52'], a);
  if (h.selfHp != null) { text('ซุนหงอคง', x, y + 104, `600 30px ${F.th}`, PAPER, { a, noTrack: 1 }); bar(x + 150, y + 82, 300, 16, h.selfHp, ['#ffd36a', '#c08a20'], a); }
  if (h.heads != null) { const pulse = 1 + .15 * Math.max(0, 1 - ((t * 10) % 10) / 3); text('หัว × ' + h.heads, x + w, y + 104, `800 44px ${F.thB}`, h.heads > 9 ? '#ff8a7a' : GOLD2, { a, align: 'right', id: 'heads' }); }
  if (h.immune) text('ภูมิคุ้มกัน: อาวุธทุกชนิด', x, y + 96, `600 32px ${F.th}`, '#ffb070', { a, id: 'immune' });
  if (h.rule) { plate(x + 140, y + 120, 620, 84, a, { col: 'rgba(255,110,90,.95)' }); text('เงื่อนไข: ห้ามใช้อาวุธ', W / 2, y + 176, `800 42px ${F.thB}`, '#ff9a84', { a, align: 'center', id: 'rule' }); }
  // combo counter (right, mid)
  const c = h.combo; if (c && c.n >= 2 && c.since < 2.2) { const pop = back(seg(c.since, 0, .18)), ca = a * (1 - ss(seg(c.since, 1.6, 2.2)));
    g.save(); g.translate(W - 70, 560); g.scale(.8 + .2 * pop, .8 + .2 * pop); text(String(c.n), 0, 0, `800 120px ${F.thB}`, '#ffd36a', { a: ca, align: 'right', glow: 'rgba(255,170,60,.7)', blur: 26, noTrack: 1 }); text('HITS', 0, 50, `700 40px ${F.lat}`, PAPER, { a: ca, align: 'right', noTrack: 1 }); g.restore(); }
}
// floating damage numbers
function popups(t, S, cam) {
  for (const p of S.popups || []) { const [x, y, ok] = toScreen(p.p, cam); if (!ok) continue; const a = 1 - ss(seg(p.age, .6, 1.0)), sc = back(seg(p.age, 0, .15));
    const col = p.miss ? '#c8c8c8' : p.crit ? '#ffd040' : PAPER, size = p.fin ? 110 : p.crit ? 78 : 56;
    g.save(); g.translate(x, y); g.scale(sc, sc);
    if (p.crit && !p.miss && p.text !== 'CLASH!') text(p.fin ? 'K.O.!' : 'CRITICAL', 0, -size * .9, `700 ${p.fin ? 54 : 34}px ${F.lat}`, '#ff8a3a', { a, align: 'center', noTrack: 1, glow: 'rgba(255,120,40,.6)' });
    g.lineWidth = 8; g.strokeStyle = 'rgba(20,10,16,.9)'; g.font = `800 ${size}px ${F.thB}`; g.textAlign = 'center'; g.globalAlpha = a; g.strokeText(p.text, 0, 0);
    text(p.text, 0, 0, `800 ${size}px ${F.thB}`, col, { a, align: 'center', noTrack: 1, glow: p.crit ? 'rgba(255,200,60,.6)' : null });
    g.restore(); }
}
function skillBanner(t, S, cam) {
  const h = S.hud; if (!h || !h.skill) return; const [x, y, ok] = toScreen(h.skillPos, cam); if (!ok) return;
  const k = h.skill.age, a = env(k, 0, 1.7, .12, .3), sc = back(seg(k, 0, .2));
  g.save(); g.translate(clamp(x, 260, W - 260), Math.max(260, y - 40)); g.scale(sc, sc);
  g.globalAlpha = a; g.fillStyle = 'rgba(10,10,24,.85)'; g.font = `800 64px ${F.thB}`; const w = g.measureText(h.skill.text).width + 70; g.fillRect(-w / 2, -66, w, 90); g.strokeStyle = '#ffd36a'; g.lineWidth = 3; g.strokeRect(-w / 2, -66, w, 90);
  text(h.skill.text, 0, 0, `800 64px ${F.thB}`, '#ffd36a', { a, align: 'center', glow: 'rgba(255,190,60,.7)', blur: 24, id: 'skill' }); g.restore();
}
function finisher(t, S) {
  const f = S.hud && S.hud.fin; if (f == null) return;
  const bars = ss(seg(f, 0, .3)) * (1 - ss(seg(f, 1.4, 1.9))); g.fillStyle = `rgba(0,0,0,${.9 * bars})`; g.fillRect(0, 0, W, 130 * bars); g.fillRect(0, H - 130 * bars, W, 130 * bars);
  const fl = Math.max(0, 1 - Math.abs(f - .7) / .12); if (fl > 0) { g.fillStyle = `rgba(255,250,235,${.75 * fl})`; g.fillRect(0, 0, W, H); }
}
// world-anchored name tags (Hera, map markers)
function tags(t, S, cam) {
  for (const tg of S.tags || []) { const [x, y, ok] = toScreen(tg.p, cam); if (!ok) continue; const a = ss(seg(tg.age, 0, .3)), sc = back(seg(tg.age, 0, .25));
    g.save(); g.translate(x, y); g.scale(sc, sc);
    if (tg.small) { g.globalAlpha = a; g.fillStyle = 'rgba(10,10,24,.82)'; g.font = `600 30px ${F.th}`; const w = g.measureText(tg.l2).width + 70; g.fillRect(-w / 2, -44, w, 54); g.strokeStyle = GOLD; g.lineWidth = 2; g.strokeRect(-w / 2, -44, w, 54); text('✓ ' + tg.l2, 0, -8, `600 30px ${F.th}`, PAPER, { a, align: 'center', noTrack: 1 }); }
    else { plate(-190, -150, 380, 140, a); text(tg.l1, 0, -98, `600 34px ${F.th}`, GOLD2, { a, align: 'center', noTrack: 1 }); text(tg.l2, 0, -36, `800 60px ${F.thB}`, '#ff9ac0', { a, align: 'center', glow: 'rgba(255,120,180,.5)', id: 'tag' }); }
    g.restore(); }
}
function win(t, t0, t1, rows, o = {}) {
  const a = env(t, t0, t1, .3, .35); if (a <= 0) return; const w = o.w || 820, x = (W - w) / 2, y = (o.y || 300) - (1 - eo(seg(t, t0, t0 + .35))) * 24, h = 70 + rows.length * 64;
  plate(x, y, w, h, a); rows.forEach((r, i) => text(r[0], r.center ? W / 2 : x + 46, y + 72 + i * 64, r[1] || `600 38px ${F.th}`, r[2] || PAPER, { a, align: r.center ? 'center' : 'left' }));
}
function stamp(t, t0, t1, count) {
  const a = env(t, t0 - .9, t1, .3, .35); if (a <= 0) return; const w = 760, x = (W - w) / 2, y = 330;
  plate(x, y, w, 220, a); text('บันทึกเควส', x + 44, y + 70, `600 34px ${F.th}`, GOLD2, { a });
  text('ไถ่บาป ' + count + ' / ๑๐', x + 44, y + 158, `800 64px ${F.thB}`, PAPER, { a });
  const k = seg(t, t0, t0 + .18); if (t < t0) return;
  g.save(); g.translate(x + w - 190, y + 115); g.rotate(-.22); g.scale(2.2 - 1.2 * eo(k), 2.2 - 1.2 * eo(k)); g.globalAlpha = a * Math.min(1, k * 3);
  g.strokeStyle = '#e03a3a'; g.lineWidth = 8; g.strokeRect(-150, -62, 300, 112); text('ไม่นับ', 0, 28, `800 84px ${F.thB}`, '#ff4a4a', { a: a * Math.min(1, k * 3), align: 'center', id: 'stamp' }); g.restore();
}
function questLog(t) {
  const a = env(t, 100.6, 113.2, .3, .35); if (a <= 0) return;
  const x = 70, y = 190, w = 560, rows = MONTAGE.length;
  plate(x, y, w, 120 + rows * 58, a);
  const n12 = t > T.tenTo12; const flip = seg(t, T.tenTo12, T.tenTo12 + .3);
  text('เควสทั้งหมด', x + 36, y + 62, `600 32px ${F.th}`, GOLD2, { a });
  text(n12 ? '๑๒' : '๑๐', x + w - 40, y + 66, `800 ${48 + 20 * (1 - flip) * (n12 ? 1 : 0)}px ${F.thB}`, n12 ? '#ff8a7a' : PAPER, { a, align: 'right', id: 'count' });
  MONTAGE.forEach((m, i) => { const done = t >= T.montage[i], k = seg(t, T.montage[i], T.montage[i] + .25);
    text((done ? '✓ ' : '· ') + m, x + 36, y + 128 + i * 58, `600 34px ${F.th}`, done ? PAPER : '#8a8070', { a, id: 'm' + i });
    if (done) { g.save(); g.globalAlpha = a * (1 - k); g.fillStyle = 'rgba(255,230,160,.5)'; g.fillRect(x + 20, y + 92 + i * 58, w - 40, 50); g.restore(); } });
}
function rewindUI(t, shot) {
  if (shot.id !== 'rewind') return; const a = env(t, shot.a, shot.b, .15, .2);
  g.save(); g.globalAlpha = a * .35; g.fillStyle = '#000'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); g.restore();
  text('◀◀  ย้อนกลับ', W - 90, 200, `800 54px ${F.thB}`, PAPER, { a, align: 'right', id: 'rew' });
}
function title(t) {
  const a = env(t, T.title, 192, 1.2, .1); if (a <= 0) return; const y = 720;
  g.save(); g.globalAlpha = a * .45; g.fillStyle = '#000'; g.fillRect(0, y - 220, W, 380); g.restore();
  text('ซุนหงอคง', W / 2, y, `800 150px ${F.thB}`, GOLD2, { a, align: 'center', glow: 'rgba(255,200,120,.55)', blur: 40 });
  g.save(); g.globalAlpha = a; g.strokeStyle = GOLD; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 230, y + 50); g.lineTo(W / 2 + 230, y + 50); g.stroke(); g.restore();
  text('ฝ่ามือที่หนีไม่พ้น', W / 2, y + 130, `600 58px ${F.th}`, PAPER, { a: a * ss(seg(t, T.title + .8, T.title + 1.8)), align: 'center' });
}
const CUTS = [[11.03, .25, .35], [21.11, .25, .35], [30.84, .3, .4], [42.42, .3, .4], [52.0, .3, .4], [58.43, .25, .35], [64.86, .25, .35], [74.39, .3, .4], [95.02, .3, .4], [126.91, .3, .4], [139.89, .3, .4]];
function blackout(t) {
  let a = 0; for (const [c, o, i] of CUTS) { if (t < c && t > c - o) a = Math.max(a, ss((t - (c - o)) / o)); if (t >= c && t < c + i) a = Math.max(a, 1 - ss((t - c) / i)); }
  a = Math.max(a, 1 - ss(seg(t, 0, .3)), ss(seg(t, 188.6, 189.26))); if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
}
function buffs(t) {
  const a = env(t, T.buffs[0] - .1, 74.0, .25, .35); if (a <= 0) return; const x = 70, y = 230, w = 520;
  plate(x, y, w, 330, a); text('บัฟที่ได้รับ', x + 36, y + 62, `600 32px ${F.th}`, GOLD2, { a });
  [['ลูกท้อเซียน: พลัง +๙๙', T.buffs[0]], ['ลูกท้อเซียน: อายุ +๙,๙๙๙ ปี', T.buffs[1]], ['ลูกท้อเซียน: ความเร็ว +๙๙', T.buffs[2]], ['ยาอายุวัฒนะ: อมตะ ×๒', T.gourd]].forEach(([l, t0], i) => { if (t < t0) return; const k = eo(seg(t, t0, t0 + .25)); text('✦ ' + l, x + 36 - (1 - k) * 30, y + 122 + i * 46, `600 30px ${F.th}`, '#9cf0a0', { a: a * k }); });
  const f = seg(t, T.gourd, T.buffFull); bar(x + 36, y + 300, w - 72, 16, f, ['#ffd36a', '#e08a20'], a); if (t > T.buffFull) text('เต็มหลอด!', x + w - 36, y + 288, `800 34px ${F.thB}`, '#ffd36a', { a, align: 'right', glow: 'rgba(255,200,80,.6)' });
}
function nameChange(t) {
  const a = env(t, T.rename - .2, 64.6, .3, .35); if (a <= 0) return; const w = 820, x = (W - w) / 2, y = 300; plate(x, y, w, 220, a);
  text('เปลี่ยนชื่อตัวละคร', W / 2, y + 66, `600 32px ${F.th}`, GOLD2, { a, align: 'center' });
  const k = seg(t, T.rename + .5, T.rename + .9); text('ซุนหงอคง', W / 2, y + 150, `800 54px ${F.thB}`, '#a09888', { a: a * (1 - k), align: 'center' });
  g.save(); g.globalAlpha = a * (1 - k); g.strokeStyle = '#ff5a4a'; g.lineWidth = 5; g.beginPath(); g.moveTo(W / 2 - 150, y + 132); g.lineTo(W / 2 - 150 + 300 * seg(t, T.rename, T.rename + .4), y + 132); g.stroke(); g.restore();
  text('มหาเทพเทียมฟ้า', W / 2, y + 150, `800 64px ${F.thB}`, '#ffd36a', { a: a * k, align: 'center', glow: 'rgba(255,200,80,.6)', blur: 24 });
}
function daysCounter(t) {
  const a = env(t, T.days[0], T.burst - .2, .3, .2); if (a <= 0) return; const n = 1 + Math.floor(48 * ss(seg(t, T.days[0], T.days[1]))), y = 300;
  plate(300, y, 480, 150, a); text('ในเตาหลอม', W / 2, y + 58, `600 32px ${F.th}`, '#ffb070', { a, align: 'center' }); text('วันที่ ' + n + ' / 49', W / 2, y + 124, `800 54px ${F.thB}`, PAPER, { a, align: 'center', id: 'days' });
}
function years(t) {
  const a = env(t, 177.0, T.title - .2, .4, .3); if (a <= 0) return; const y = 300; plate(260, y, 560, 150, a);
  text('สถานะ: ถูกภูเขาทับ', W / 2, y + 58, `600 32px ${F.th}`, '#ff9a84', { a, align: 'center' }); text('เวลาที่เหลือ ๕๐๐ ปี', W / 2, y + 124, `800 54px ${F.thB}`, PAPER, { a, align: 'center', id: 'years' });
}
export function drawOverlay(t, shot, tf = t, S = null, cam = null) {
  g.clearRect(0, 0, W, H); TXT.length = 0;
  if (S && cam) { finisher(t, S); bossHud(t, S); popups(t, S, cam); skillBanner(t, S, cam); tags(t, S, cam); }
  rewindUI(t, shot);
  win(t, T.status, 20.8, [['สถานะตัวละคร', `600 32px ${F.th}`, GOLD2], ['ซุนหงอคง · ลิงหิน', `800 50px ${F.thB}`], ['ความซน: ๑๐๐+', `600 38px ${F.th}`, '#ff8a7a'], ['สกิล: ยังไม่มี', `600 34px ${F.th}`, '#cfc6b2']]);
  win(t, T.skill72, 27.1, [['ปลดล็อกสกิล ✦', `600 32px ${F.th}`, '#ffd36a', 1], ['แปลงกาย ๗๒ ร่าง', `800 54px ${F.thB}`, PAPER, 1]].map(r => Object.assign(r, { center: 1 })), { y: 300 });
  win(t, T.skillCloud, 30.6, [['ปลดล็อกสกิล ✦', `600 32px ${F.th}`, '#ffd36a', 1], ['ตีลังกาเมฆ', `800 54px ${F.thB}`, PAPER, 1], ['ระยะ: ๑๐๘,๐๐๐ ลี้', `600 34px ${F.th}`, '#9cf0a0', 1]].map(r => Object.assign(r, { center: 1 })), { y: 300 });
  win(t, T.staffLoot, 42.2, [['ได้รับอาวุธ ★', `600 32px ${F.th}`, '#ffd36a'], ['กระบองวิเศษ', `800 54px ${F.thB}`, PAPER], ['น้ำหนัก: หลายหมื่นชั่ง · ยืดหดได้', `600 32px ${F.th}`, '#9cf0a0']].map(r => Object.assign(r, { center: 1 })), { y: 300 });
  win(t, T.immortal, 51.8, [['บัญชีความตาย', `600 32px ${F.th}`, '#ff9a84'], ['ซุนหงอคง — ลบแล้ว', `800 50px ${F.thB}`, '#a09888'], ['สถานะ: อมตะ (แฮ็กเซฟ)', `600 36px ${F.th}`, '#9cf0a0']].map(r => Object.assign(r, { center: 1 })), { y: 300 });
  win(t, T.jobCard, 58.2, [['ตำแหน่งบนสวรรค์', `600 32px ${F.th}`, GOLD2], ['คนเลี้ยงม้า', `800 60px ${F.thB}`, PAPER], ['ระดับ: ต่ำสุด', `600 36px ${F.th}`, '#ff8a7a']].map(r => Object.assign(r, { center: 1 })), { y: 300 });
  nameChange(t); buffs(t);
  win(t, T.fireEyes, 139.4, [['อัปเกรด ✦', `600 32px ${F.th}`, '#ffd36a'], ['ดวงตาไฟ', `800 60px ${F.thB}`, '#ffb050']].map(r => Object.assign(r, { center: 1 })), { y: 300 });
  daysCounter(t); years(t);
  chapter(t);
  for (const v of VO) subtitle(tf, v);
  title(t);
  blackout(t);
}
window.TEXTS = () => TXT.slice();
