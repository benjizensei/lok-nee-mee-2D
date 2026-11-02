// Timeline: single source of truth for shots, narration, UI and sound events (seconds)
export const DUR = 101.5;
export const SHOTS = [
  { id: 'lairOpen', set: 'lair', a: 0.0, b: 6.2 },
  { id: 'rewind', set: 'lair', a: 6.2, b: 7.6 },
  { id: 'beach', set: 'beach', a: 7.6, b: 19.0 },
  { id: 'palace', set: 'palace', a: 19.0, b: 30.8 },
  { id: 'temple', set: 'temple', a: 30.8, b: 42.6 },
  { id: 'lairBack', set: 'lair', a: 42.6, b: 48.6 },
  { id: 'shield', set: 'lair', a: 48.6, b: 55.0 },
  { id: 'strike', set: 'lair', a: 55.0, b: 62.4 },
  { id: 'storm', set: 'storm', a: 62.4, b: 72.8 },
  { id: 'stoneKing', set: 'palace', a: 72.8, b: 77.8 },
  { id: 'games', set: 'stadium', a: 77.8, b: 86.6 },
  { id: 'complete', set: 'stadium', a: 86.6, b: 91.2 },
  { id: 'stars', set: 'stadium', a: 91.2, b: 101.5 },
];
// Key events
export const T = {
  bossUI: 0.3, warn: 3.6, freeze: 6.2,
  chestLand: 12.0, status: 15.0,
  questIn: 26.6, questAccept: 29.6,
  items: [33.6, 34.8, 36.0, 37.2, 38.4],
  breathe: 54.0, slash: 55.0, pegasus: 56.1, drop: 56.8,
  flashes: [63.6, 66.4, 68.4, 71.4], petrifyCetus: 68.5, partyJoin: 71.0,
  kingStone: 74.0,
  throw: 81.4, hit: 83.8, complete: 86.6,
  starsStart: 92.0, title: 96.4,
};
// Chapter cards (shown over the start of a set)
export const CHAPTERS = [
  { t: 7.6, n: 'บทที่ ๑', name: 'สร้างตัวละคร' },
  { t: 19.0, n: 'บทที่ ๒', name: 'เควสหลัก' },
  { t: 30.8, n: 'บทที่ ๓', name: 'ไอเทมจากเทพ' },
  { t: 42.6, n: 'บทที่ ๔', name: 'บอสถ้ำกอร์กอน' },
  { t: 62.4, n: 'บทที่ ๕', name: 'เวิลด์บอส' },
  { t: 77.8, n: 'บทที่ ๖', name: 'คำทำนาย' },
];
// Narration (n*) and character lines (dlg). t = start; real durations come from voices/dur.json
export const VO = [
  { id: 'n01', t: 0.4, sub: 'ผู้เล่นเลเวลหนึ่ง กำลังจะเจอบอส ที่แค่สบตา ก็กลายเป็นหิน' },
  { id: 'n02', t: 8.8, sub: 'ย้อนไปตอนสร้างตัวละคร เพอร์ซิอุสเกิดมาพร้อมคำทำนาย ว่าเขาจะฆ่าตาของตัวเอง' },
  { id: 'n03', t: 16.2, sub: 'ตาเลยจับแม่ลูกใส่หีบ ลอยทะเล' },
  { id: 'n04', t: 20.0, sub: 'โตขึ้น กษัตริย์โพลีเดกทีสอยากกำจัดเขา เลยมอบเควสที่ไม่มีใครรอด' },
  { id: 'k01', t: 26.8, dlg: true, who: 'โพลีเดกทีส', sub: 'จงไปเอาหัวของเมดูซ่ามาให้ข้า' },
  { id: 'n05', t: 32.0, sub: 'โชคดีที่มีเทพสายซัพพอร์ต' },
  { id: 'n06', t: 39.6, sub: 'ครบเซ็ตห้าชิ้น' },
  { id: 'n07', t: 43.2, sub: 'กลับมาที่บอสตัวเดิม กฎมีข้อเดียว อย่ามองตรงๆ' },
  { id: 'n08', t: 49.2, sub: 'ให้มองผ่านเงาสะท้อนในโล่แทน' },
  { id: 'n09', t: 57.4, sub: 'ฟันครั้งเดียว ดรอปม้าบินมาด้วย' },
  { id: 'n10', t: 63.2, sub: 'ขากลับ เจอเวิลด์บอส ซีตัส กำลังจะกินเจ้าหญิงแอนโดรเมด้า' },
  { id: 'n11', t: 68.9, sub: 'ชูหัวเมดูซ่าทีเดียว จบ' },
  { id: 'n12', t: 73.4, sub: 'ส่วนเจ้าของเควส ก็ได้หัวเมดูซ่าไป แบบตรงตัว' },
  { id: 'n13', t: 78.6, sub: 'ทุกอย่างกำลังจะจบสวย จนเขาไปแข่งขว้างจักร' },
  { id: 'n14', t: 87.4, sub: 'ชายแก่คนนั้น คือตาของเขาเอง' },
  { id: 'n15', t: 92.0, sub: 'บางเควส ต่อให้หนีแค่ไหน ระบบก็นับว่าสำเร็จอยู่ดี' },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
export const SET_OF = Object.fromEntries(SHOTS.map(s => [s.id, s.set]));
