// Timeline: single source of truth (film seconds). Shot lengths come from the recorded narration (voices/dur.json).
export const DUR = 189.26;
export const SHOTS = [
  { id: 'hook', set: 'heaven', a: 0.0, b: 9.83 },
  { id: 'rewind', set: 'heaven', a: 9.83, b: 11.03 },
  { id: 'birth', set: 'mountain', a: 11.03, b: 21.11 },
  { id: 'train', set: 'mountain', a: 21.11, b: 30.84 },
  { id: 'dragon', set: 'sea', a: 30.84, b: 42.42 },
  { id: 'nether', set: 'nether', a: 42.42, b: 52.0 },
  { id: 'horses', set: 'heaven', a: 52.0, b: 58.43 },
  { id: 'rename', set: 'mountain', a: 58.43, b: 64.86 },
  { id: 'peaches', set: 'heaven', a: 64.86, b: 74.39 },
  { id: 'army', set: 'heaven', a: 74.39, b: 95.02 },
  { id: 'erlang', set: 'sky', a: 95.02, b: 119.08 },
  { id: 'capture', set: 'sky', a: 119.08, b: 126.91 },
  { id: 'furnace', set: 'heaven', a: 126.91, b: 139.89 },
  { id: 'buddha', set: 'palm', a: 139.89, b: 150.47 },
  { id: 'flight', set: 'palm', a: 150.47, b: 164.6 },
  { id: 'reveal', set: 'palm', a: 164.6, b: 174.88 },
  { id: 'final', set: 'palm', a: 174.88, b: 189.26 },
];
const rowHits = (t0, t1, step, who, tgs, o = {}) => { const out = []; let i = 0; for (let t = t0; t < t1; t += step, i++) { const tg = tgs[i % tgs.length], crit = o.critEvery && i % o.critEvery === o.critEvery - 1; out.push({ t: +t.toFixed(2), k: ['slash1', 'slash2', 'slash3'][i % 3], tg, d: String(crit ? 1800 + (i * 137) % 900 : 300 + (i * 97) % 400).replace(/(\d)(\d{3})$/, '$1,$2'), crit: crit ? 1 : 0, who: o.ally && i % 2 ? 'ally' : 'hero', ko: o.ko ? tg : null }); } return out; };
export const FIGHTS = {
  hook: rowHits(0.9, 9.4, .32, 'hero', ['s1', 's2', 's3', 's4', 's5', 's6'], { critEvery: 4, ally: 1, ko: 1 }),
  army: [
    { t: 85.4, k: 'slash1', tg: 'row', d: '999 ×12', crit: 1, skill: 'กระบองยืด!' },
    ...rowHits(86.8, 93.6, .26, 'hero', ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'], { critEvery: 5, ally: 1, ko: 1 }),
    { t: 94.0, k: 'slash3', tg: 'row', d: '9,999 ×50', crit: 1, fin: 1, stop: .3, skill: 'ร่างแยกร้อยร่าง!' },
  ],
  erlang: [
    { t: 110.9, k: 'slash1', tg: 'er', d: '2,140' }, { t: 111.25, k: 'slash2', tg: 'wk', d: '1,980', who: 'enemy' }, { t: 111.6, k: 'slash3', tg: 'er', d: '2,310' },
    { t: 112.4, k: 'slash2', tg: 'wk', d: '2,050', who: 'enemy' }, { t: 112.75, k: 'slash1', tg: 'er', d: '2,470', crit: 1 },
    { t: 113.8, k: 'slash3', tg: 'er', d: '2,200' }, { t: 114.15, k: 'slash1', tg: 'wk', d: '2,330', who: 'enemy' }, { t: 114.5, k: 'slash2', tg: 'er', d: '2,610' },
    { t: 115.3, k: 'slash1', tg: 'wk', d: '2,280', who: 'enemy' }, { t: 115.6, k: 'slash3', tg: 'er', d: '2,750', crit: 1 }, { t: 116.0, k: 'slash2', tg: 'wk', d: '2,400', who: 'enemy' },
    { t: 116.9, k: 'slash1', tg: 'er', d: '2,880' }, { t: 117.2, k: 'slash2', tg: 'wk', d: '2,500', who: 'enemy' },
    { t: 118.0, k: 'slash3', tg: 'both', d: 'CLASH!', crit: 1, fin: 1, stop: .35 },
  ],
};
export const T = {
  eggCrack: 12.6, eggBurst: 14.0, status: 17.6,
  skill72: 24.6, skillCloud: 27.4,
  grabPillar: 36.4, shrink: 38.0, staffLoot: 39.6,
  strike: 46.8, immortal: 48.8,
  jobCard: 56.2, banner: 61.6, rename: 62.6,
  buffs: [67.0, 68.0, 69.0], gourd: 70.4, buffFull: 72.4,
  emperorAngry: 75.4, march: 77.0, clones: 82.0, sweep: 85.4,
  erlangIn: 96.4, forms: [102.1, 103.6, 105.0, 106.6],
  dog: 122.6, ring: 125.3,
  furnaceLock: 128.0, days: [128.8, 132.4], burst: 134.6, fireEyes: 136.2,
  buddhaIn: 140.6, palm: 145.0,
  launch: 153.4, pillars: 156.4, write: 159.0, back: 162.2,
  pull: 165.5, flip: 171.2, slam: 172.6,
  title: 184.4,
};
export const CHAPTERS = [
  { t: 11.03, n: 'บทที่ ๑', name: 'สร้างตัวละคร' },
  { t: 74.39, n: 'บทที่ ๒', name: 'ทัพสวรรค์แสนนาย' },
  { t: 95.02, n: 'บอส', name: 'เอ้อหลางเสิน เทพสามตา' },
  { t: 139.89, n: 'บทสุดท้าย', name: 'ฝ่ามือพระยูไล' },
];
export const VO = [
  { id: 'v01', t: 0.3, sub: 'ทหารสวรรค์หนึ่งแสนนาย… สู้กับลิงตัวเดียว! และลิงตัวนั้น… กำลังชนะ' },
  { id: 'v02', t: 11.58, sub: 'ย้อนไปตอนสร้างตัวละคร… ซุนหงอคง ลิงที่เกิดจากไข่หินบนยอดเขาฮวยก้วยซัว สเตตัสเริ่มต้น… ซนเกินร้อย' },
  { id: 'v03', t: 21.66, sub: 'เขาไปฝากตัวเป็นศิษย์อาจารย์เซียน ปลดล็อกสกิลแปลงกายเจ็ดสิบสองร่าง กับตีลังกาเมฆทีเดียว ไกลหนึ่งแสนแปดพันลี้' },
  { id: 'v04', t: 31.39, sub: 'ขาดแค่อาวุธ เลยบุกวังมังกรทะเลตะวันออก ไปเจอเสาค้ำทะเลหนักหลายหมื่นชั่ง ยืดหดได้ตามใจ… กลายเป็นกระบองประจำตัวไปตลอดเกม' },
  { id: 'v05', t: 42.97, sub: 'ตายแล้วก็ไม่ยอมตาย บุกยมโลก แล้วขีดฆ่าชื่อตัวเองออกจากบัญชีความตาย เท่ากับแฮ็กเซฟ ให้ตัวเองเป็นอมตะ' },
  { id: 'v06', t: 52.55, sub: 'สวรรค์เห็นท่าไม่ดี เลยให้ตำแหน่งบนสวรรค์ แต่เป็นตำแหน่ง… คนเลี้ยงม้า' },
  { id: 'v07', t: 58.98, sub: 'ซุนหงอคงรู้ว่าโดนหลอก เลยกลับบ้านไปตั้งฉายาให้ตัวเอง มหาเทพเทียมฟ้า' },
  { id: 'v08', t: 65.41, sub: 'แถมยังแอบกินลูกท้อเซียนในสวนสวรรค์ กินยาอายุวัฒนะของเทพเล่าจื๊อจนหมดน้ำเต้า บัฟเต็มหลอด' },
  { id: 'v09', t: 74.94, sub: 'เง็กเซียนฮ่องเต้โกรธจัด ส่งทัพสวรรค์แสนนายลงมาจับ! ลิงตัวเดียว ถอนขนเป่าเป็นร่างแยกนับร้อย ยืดกระบอง… ฟาดทีเดียวทั้งแถว!' },
  { id: 'v10', t: 95.57, sub: 'สวรรค์ต้องส่งบอสพิเศษ เอ้อหลางเสิน เทพสามตา สู้กันจนลิงแปลงเป็นนก เทพก็แปลงเป็นเหยี่ยว ลิงแปลงเป็นปลา เทพก็แปลงเป็นนกกระสา' },
  { id: 'v11', t: 107.85, sub: 'แปลงร่างไล่กันทั้งฟ้า! เอาเลย!' },
  { id: 'v12', t: 119.63, sub: 'สุดท้ายถูกจับได้เพราะหมาของเทพกัดขา แล้วโดนห่วงเพชรของเล่าจื๊อกระแทกหัว' },
  { id: 'v13', t: 127.46, sub: 'ถูกจับเข้าเตาหลอมแปดทิศ เผาสี่สิบเก้าวัน… แต่แทนที่จะตาย กลับเป็นการอัปเกรด ออกมาได้ดวงตาไฟ แล้วอาละวาดสวรรค์รอบสอง' },
  { id: 'v14', t: 140.44, sub: 'จนต้องเชิญพระยูไลมาเอง พระยูไลยื่นฝ่ามือออกมา แล้วบอกว่า ถ้ากระโดดออกจากฝ่ามือนี้ได้ สวรรค์ยกให้' },
  { id: 'v15', t: 151.02, sub: 'ซุนหงอคงหัวเราะ ตีลังกาเมฆทีเดียวไปสุดขอบฟ้า เจอเสาห้าต้น เลยเขียนชื่อไว้ว่า ฉีเทียนไต้เซียมาถึงที่นี่ แล้วตีลังกากลับมา' },
  { id: 'v16', t: 165.15, sub: 'แต่เสาห้าต้นนั้น… คือนิ้วมือของพระยูไล ฝ่ามือคว่ำลงกลายเป็นภูเขาห้านิ้ว ทับเขาไว้ห้าร้อยปี' },
  { id: 'v17', t: 175.43, sub: 'ลิงที่เก่งที่สุดในสามโลก ตีลังกาเดียวไปได้สุดขอบฟ้า… แต่ทั้งหมดนั้น ยังไม่เคยออกไปพ้นฝ่ามือเลย' },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
export const SET_OF = Object.fromEntries(SHOTS.map(s => [s.id, s.set]));
export const DUR_FILM = DUR; export const toOrig = t => t; export const toFilm = t => t;
