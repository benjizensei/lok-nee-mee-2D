// 2D overlay (1080×1920): chapter cards, game UI windows, dialogue box, narration subtitles, title. One metal (gold) + paper white on dark plates.
import { VO, SHOTS, T, CHAPTERS } from './story.js';
import { ITEMS } from './set_temple.js';
import { iconCanvas } from './chars.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
const W = 1080, H = 1920;
let DURS = {};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const env = (t, a, b, fi = .3, fo = .3) => Math.min(ss(seg(t, a, a + fi)), 1 - ss(seg(t, b - fo, b)));
const GOLD = '#d8b86a', GOLD2 = '#f2d896', PAPER = '#f6f0e2';
const F = { th: '"Trirong"', thB: '"Taviraj"', lat: 'Cinzel' };
const seg8 = new Intl.Segmenter('th', { granularity: 'grapheme' });
const graphemes = s => [...seg8.segment(s)].map(x => x.segment);
const ICONS = {};
const TXT = [];   // texts visible this frame (for readcheck)

export async function overlayReady() {
  await Promise.all([`400 40px ${F.th}`, `600 40px ${F.th}`, `600 40px ${F.thB}`, `800 40px ${F.thB}`, `600 40px ${F.lat}`, `700 40px ${F.lat}`].map(f => document.fonts.load(f, 'กขเพอร์ซิอุส ABC')));
  DURS = await (await fetch('voices/dur.json')).json();
  for (const it of ITEMS) ICONS[it.id] = iconCanvas(it.id, 4);
}
const dur = id => DURS[id] || 3;

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
// —— boss HP (cave) ——
function bossUI(t, shot) {
  const inCave = ['lairOpen', 'lairBack', 'shield', 'strike'].includes(shot.id);
  if (!inCave) return;
  let a = shot.id === 'lairOpen' ? ss(seg(t, T.bossUI, T.bossUI + .5)) : shot.id === 'lairBack' ? ss(seg(t, shot.a + 2.6, shot.a + 3.1)) : 1;
  if (shot.id === 'strike') a = 1 - ss(seg(t, T.slash + 1.6, T.slash + 2.2));
  if (a <= 0) return;
  const x = 110, y = 170, w = 860;
  const drop = shot.id === 'strike' ? eo(seg(t, T.slash + .05, T.slash + .7)) : 0;
  const shake = shot.id === 'strike' && t < T.slash + .3 ? Math.round(Math.sin(t * 90) * 6) : 0;
  g.save(); g.translate(shake, 0);
  text('BOSS', x, y, `700 34px ${F.lat}`, '#ff7a6a', { a, noTrack: 1 });
  text('เมดูซ่า · กอร์กอน', x + 120, y, `600 44px ${F.thB}`, PAPER, { a, id: 'boss' });
  text('Lv. ???', x + w, y, `600 30px ${F.lat}`, GOLD2, { a, align: 'right', noTrack: 1 });
  bar(x, y + 22, w, 26, 1 - drop, ['#9cf0a0', '#2f8a52'], a);
  g.restore();
  if (shot.id === 'lairOpen' || shot.id === 'lairBack') {   // the level-1 hero's own bar, bottom-left above subtitles — only in the opening
    if (shot.id === 'lairOpen') { const b = ss(seg(t, T.bossUI + .4, T.bossUI + .9)); text('เพอร์ซิอุส  Lv.1', 110, 290, `600 34px ${F.thB}`, PAPER, { a: a * b, id: 'hero' }); bar(110, 304, 320, 14, .22, ['#ff8a6a', '#a8282c'], a * b); }
  }
}
function warn(t, shot) {
  const show = (shot.id === 'lairOpen' && t > T.warn) || (shot.id === 'lairBack' && t > 46.2) || shot.id === 'shield' && t < 50.2;
  if (!show) return;
  const a0 = shot.id === 'lairOpen' ? ss(seg(t, T.warn, T.warn + .25)) : shot.id === 'lairBack' ? ss(seg(t, 46.2, 46.5)) : 1 - ss(seg(t, 49.8, 50.2));
  const pulse = .75 + .25 * Math.sin(t * 9), y = 400, w = 640, x = (W - w) / 2;
  plate(x, y, w, 110, a0, { col: 'rgba(255,110,90,.95)' });
  text('⚠  ห้ามมองตา', W / 2, y + 74, `800 58px ${F.thB}`, '#ff9a84', { align: 'center', a: a0 * pulse, id: 'warn', glow: 'rgba(255,80,60,.5)' });
}
function rewindUI(t, shot) {
  if (shot.id !== 'rewind') return;
  const a = env(t, shot.a, shot.b, .15, .2);
  g.save(); g.globalAlpha = a * .35; g.fillStyle = '#000'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); g.restore();
  text('◀◀  ย้อนกลับ', W - 90, 200, `800 54px ${F.thB}`, PAPER, { a, align: 'right', id: 'rew' });
}
function statusWin(t) {
  const a = env(t, T.status, 18.7, .3, .3); if (a <= 0) return;
  const x = 150, y = 300 - (1 - eo(seg(t, T.status, T.status + .35))) * 20, w = 780, h = 250;
  plate(x, y, w, h, a);
  text('สถานะตัวละคร', x + 44, y + 66, `600 38px ${F.thB}`, GOLD2, { a });
  text('เพอร์ซิอุส', x + 44, y + 128, `800 50px ${F.thB}`, PAPER, { a });
  text('Lv.0 · ทารก', x + w - 44, y + 128, `600 34px ${F.th}`, '#cfc6b2', { a, align: 'right' });
  text('คำสาป:  คำทำนาย', x + 44, y + 198, `600 40px ${F.th}`, '#ff8a7a', { a, glow: 'rgba(255,80,60,.4)' });
}
function questWin(t) {
  const a = env(t, T.questIn, 30.6, .3, .35); if (a <= 0) return;
  const pop = eo(seg(t, T.questIn, T.questIn + .3)), w = 820, h = 400, x = (W - w) / 2, y = 330;
  g.save(); g.translate(W / 2, y + h / 2); g.scale(.92 + .08 * pop, .92 + .08 * pop); g.translate(-W / 2, -(y + h / 2));
  plate(x, y, w, h, a);
  text('!  เควสหลัก', x + 50, y + 74, `800 44px ${F.thB}`, '#ffd36a', { a, glow: 'rgba(255,200,80,.4)' });
  text('หัวของกอร์กอน', x + 50, y + 156, `800 64px ${F.thB}`, PAPER, { a });
  text('ความยาก:  ☠☠☠☠☠', x + 50, y + 222, `600 36px ${F.th}`, '#e8a0a0', { a });
  text('รางวัล:  ???', x + 50, y + 276, `600 36px ${F.th}`, '#cfc6b2', { a });
  // accept button + cursor click
  const pressed = t > T.questAccept && t < T.questAccept + .25, bx = x + w - 290, by = y + h - 104;
  g.save(); g.globalAlpha = a; g.fillStyle = pressed ? '#f2d896' : 'rgba(216,184,106,.18)'; g.fillRect(bx, by, 240, 70); g.strokeStyle = GOLD2; g.lineWidth = 3; g.strokeRect(bx, by, 240, 70); g.restore();
  text('รับเควส', bx + 120, by + 50, `800 40px ${F.thB}`, pressed ? '#1a1020' : PAPER, { a, align: 'center' });
  const cu = eo(seg(t, T.questIn + .8, T.questAccept - .2)), cx = bx + 260 - cu * 60 + (pressed ? 3 : 0), cy = by + 110 - cu * 50 + (pressed ? 3 : 0) + Math.round(Math.sin(t * 8)) * (cu < 1 ? 0 : 2);
  g.save(); g.globalAlpha = a; g.fillStyle = PAPER; g.strokeStyle = '#1a1020'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 34, cy + 14); g.lineTo(cx + 18, cy + 20); g.lineTo(cx + 12, cy + 36); g.closePath(); g.stroke(); g.fill(); g.restore();
  if (t > T.questAccept) { const k = seg(t, T.questAccept, T.questAccept + .5); g.save(); g.globalAlpha = a * (1 - k); g.strokeStyle = GOLD2; g.lineWidth = 4; g.strokeRect(bx - k * 30, by - k * 30, 240 + k * 60, 70 + k * 60); g.restore(); }
  g.restore();
}
function lootList(t) {
  const a = env(t, T.items[0] - .1, 42.2, .2, .4); if (a <= 0) return;
  const x = 90, y0 = 230;
  ITEMS.forEach((it, i) => {
    const t0 = T.items[i]; if (t < t0) return; const k = eo(seg(t, t0, t0 + .3)), y = y0 + i * 96;
    g.save(); g.globalAlpha = a * k; g.translate(-(1 - k) * 60, 0);
    g.fillStyle = 'rgba(8,10,22,.82)'; g.fillRect(x, y, 600, 82); g.strokeStyle = 'rgba(216,184,106,.8)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, 598, 80);
    g.imageSmoothingEnabled = false; g.drawImage(ICONS[it.id], x + 10, y + 9, 64, 64);
    const fl = 1 - seg(t, t0, t0 + .5); if (fl > 0) { g.fillStyle = `rgba(255,240,190,${fl * .5})`; g.fillRect(x, y, 600, 82); }
    g.restore();
    text('ได้รับ', x + 92, y + 54, `600 30px ${F.th}`, GOLD2, { a: a * k, noTrack: 1 });
    text(it.name, x + 180, y + 56, `800 42px ${F.thB}`, PAPER, { a: a * k });
  });
  const s = ss(seg(t, 39.4, 39.8)); if (s > 0) text('✦ ครบเซ็ต 5/5', x, y0 + 5 * 96 + 60, `800 50px ${F.thB}`, '#ffd36a', { a: a * s, glow: 'rgba(255,200,80,.6)', blur: 24 });
}
function toast(t, t0, t1, l1, l2, col = '#ffd36a', Y = 300) {
  const a = env(t, t0, t1, .3, .35); if (a <= 0) return;
  const w = 820, x = (W - w) / 2, y = Y - (1 - eo(seg(t, t0, t0 + .35))) * 30;
  plate(x, y, w, 170, a);
  text(l1, W / 2, y + 66, `600 36px ${F.th}`, col, { a, align: 'center' });
  text(l2, W / 2, y + 134, `800 52px ${F.thB}`, PAPER, { a, align: 'center' });
}
function complete(t) {
  const a = env(t, T.complete + .2, 91.4, .8, .5); if (a <= 0) return;
  const y = 620;
  g.save(); g.globalAlpha = a * .55; const gr = g.createLinearGradient(0, y - 200, 0, y + 140); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(0,0,0,.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, y - 200, W, 340); g.restore();
  text('QUEST COMPLETE', W / 2, y - 90, `700 40px ${F.lat}`, GOLD2, { a, align: 'center', glow: 'rgba(255,200,120,.5)', noTrack: 1 });
  text('เควสสำเร็จ', W / 2, y + 10, `800 92px ${F.thB}`, GOLD2, { a, align: 'center', glow: 'rgba(255,200,120,.5)', blur: 30 });
  text('คำทำนาย  ✓', W / 2, y + 90, `600 48px ${F.th}`, PAPER, { a: a * ss(seg(t, T.complete + 1.0, T.complete + 1.6)), align: 'center' });
}
function title(t) {
  const a = env(t, T.title, 101.5 + 1, 1.2, .1); if (a <= 0) return;
  const y = 760;
  text('เพอร์ซิอุส', W / 2, y, `800 150px ${F.thB}`, GOLD2, { a, align: 'center', glow: 'rgba(255,200,120,.55)', blur: 40 });
  g.save(); g.globalAlpha = a; g.strokeStyle = GOLD; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 230, y + 50); g.lineTo(W / 2 + 230, y + 50); g.stroke(); g.restore();
  const b = ss(seg(t, T.title + .8, T.title + 1.8));
  text('เควสที่กดยกเลิกไม่ได้', W / 2, y + 130, `600 60px ${F.th}`, PAPER, { a: a * b, align: 'center' });
}
// —— dialogue box (character lines) ——
function dialog(t, v) {
  const d = dur(v.id), a = env(t, v.t - .3, v.t + Math.max(1.8, d + .9), .3, .3); if (a <= 0) return;
  const bw = 940, bh = 220, x = (W - bw) / 2, y = 1460 + (1 - a) * 14;
  plate(x, y, bw, bh, a);
  g.save(); g.globalAlpha = a; g.font = `800 38px ${F.thB}`; const nw = g.measureText(v.who).width + 60;
  g.fillStyle = 'rgba(10,12,24,.96)'; g.fillRect(x + 40, y - 30, nw, 58); g.strokeStyle = GOLD; g.lineWidth = 2; g.strokeRect(x + 40.5, y - 29.5, nw - 1, 57); g.restore();
  text(v.who, x + 70, y + 12, `800 38px ${F.thB}`, GOLD2, { a, noTrack: 1 });
  const gs = graphemes(v.sub), shown = Math.floor(gs.length * clamp((t - v.t + .05) / (d * .9)));
  const font = `600 50px ${F.th}`, lines = wrap(v.sub, bw - 140, font); let k = shown;
  lines.forEach((L, i) => { const lg = graphemes(L), s = lg.slice(0, Math.max(0, k)).join(''); k -= lg.length + 1; text(s, x + 70, y + 108 + i * 70, font, PAPER, { a, noTrack: 1 }); });
  if (a > .5) TXT.push({ id: v.id, text: v.sub, x0: x, y0: y, x1: x + bw, y1: y + bh });
  if (shown >= gs.length && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = GOLD2; const tx = x + bw - 60, ty = y + bh - 44; g.beginPath(); g.moveTo(tx - 11, ty - 6); g.lineTo(tx + 11, ty - 6); g.lineTo(tx, ty + 7); g.fill(); }
}
// —— narration subtitles: lower third, above the phone UI safe zone ——
function subtitle(t, v) {
  const d = dur(v.id), nxt = VO.find(w => w.t > v.t), end = Math.min(v.t + Math.max(1.8, d + .6), nxt ? nxt.t - .4 : 1e9), a = ss(seg(t, v.t - .35, v.t)) * (1 - ss(seg(t, end, end + .3)));
  if (a <= 0) return;
  const font = `600 54px ${F.th}`, lines = wrap(v.sub, 900, font), lh = 76, yb = 1560;
  g.save(); g.globalAlpha = a; const top = yb - lines.length * lh - 40, gr = g.createLinearGradient(0, top, 0, yb + 50); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.4, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, top, W, yb + 50 - top); g.restore();
  lines.forEach((L, i) => text(L, W / 2, yb - (lines.length - 1 - i) * lh, font, PAPER, { a, align: 'center', noTrack: 1 }));
  if (a > .5) TXT.push({ id: v.id, text: v.sub, x0: 90, y0: yb - lines.length * lh, x1: W - 90, y1: yb + 12 });
}
// —— short dips to black at set changes ——
const CUTS = [[7.6, .25, .35], [19.0, .3, .4], [30.8, .3, .4], [42.6, .3, .4], [62.4, .3, .4], [72.8, .25, .35], [77.8, .3, .4]];
function blackout(t) {
  let a = 0;
  for (const [c, o, i] of CUTS) { if (t < c && t > c - o) a = Math.max(a, ss((t - (c - o)) / o)); if (t >= c && t < c + i) a = Math.max(a, 1 - ss((t - c) / i)); }
  a = Math.max(a, 1 - ss(seg(t, 0, .35)), ss(seg(t, 100.8, 101.5)));
  if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
}
export function drawOverlay(t, shot, tf = t) {
  g.clearRect(0, 0, W, H); TXT.length = 0;
  rewindUI(t, shot); bossUI(t, shot); warn(t, shot); statusWin(t); questWin(t); lootList(t);
  toast(t, T.drop, 60.6, 'ไอเทมดรอป ★', 'เพกาซัส  ม้าบิน', '#ffd36a', 880);
  toast(t, T.partyJoin, 72.6, 'ปาร์ตี้', 'แอนโดรเมด้า เข้าร่วมปาร์ตี้', '#9fd8ff');
  toast(t, T.kingStone + .3, 77.5, 'ส่งเควสแล้ว ✓', 'หัวของกอร์กอน');
  complete(t); chapter(t);
  for (const v of VO) { if (v.dlg) dialog(tf, v); else subtitle(tf, v); }
  title(t);
  blackout(t);
}
window.TEXTS = () => TXT.slice();
