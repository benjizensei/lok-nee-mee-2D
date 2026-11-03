// Timeline: single source of truth for shots, narration, UI and sound events (seconds)
export const DUR = 101.5;
export const SHOTS = [
  { id: 'lairOpen', set: 'lair', a: 0.0, b: 6.2, fl: 7.9 },
  { id: 'rewind', set: 'lair', a: 6.2, b: 7.6, fl: 1.4 },
  { id: 'beach', set: 'beach', a: 7.6, b: 19.0, fl: 12.4 },
  { id: 'palace', set: 'palace', a: 19.0, b: 30.8, fl: 12.0 },
  { id: 'temple', set: 'temple', a: 30.8, b: 42.6, fl: 16.8 },
  { id: 'lairBack', set: 'lair', a: 42.6, b: 48.6, fl: 6.0 },
  { id: 'shield', set: 'lair', a: 48.6, b: 55.0, fl: 6.4 },
  { id: 'strike', set: 'lair', a: 55.0, b: 62.4, fl: 7.4 },
  { id: 'storm', set: 'storm', a: 62.4, b: 72.8, fl: 13.0 },
  { id: 'stoneKing', set: 'palace', a: 72.8, b: 77.8, fl: 5.0 },
  { id: 'games', set: 'stadium', a: 77.8, b: 86.6, fl: 8.8 },
  { id: 'complete', set: 'stadium', a: 86.6, b: 91.2, fl: 4.6 },
  { id: 'stars', set: 'stadium', a: 91.2, b: 101.5, fl: 10.3 },
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
// Narration (n*) and character lines (dlg). t = start in FILM time (seconds of the finished video); durations from voices/dur.json
export const VO = [
  { id: 'n01', t: 0.3, sub: 'ผู้เล่นเลเวลหนึ่ง… กำลังจะเจอบอสที่โหดที่สุดในโลกกรีก แค่สบตา… ก็กลายเป็นหิน!' },
  { id: 'n02', t: 10.5, sub: 'ย้อนไปตอนกดสร้างตัวละคร… เพอร์ซิอุสเกิดมาพร้อมคำทำนายติดตัว ว่าวันหนึ่ง เขาจะฆ่าตาของตัวเอง' },
  { id: 'n03', t: 18.4, sub: 'ตาเลยจับแม่ลูกใส่หีบ… โยนลงทะเล' },
  { id: 'n04', t: 22.6, sub: 'พอโตขึ้น กษัตริย์โพลีเดกทีสอยากกำจัดเขาให้พ้นทาง… เลยมอบเควสที่ไม่มีใครเคยรอด' },
  { id: 'k01', t: 29.8, dlg: true, who: 'โพลีเดกทีส', sub: 'จงไปเอาหัวของเมดูซ่า… มาให้ข้า!' },
  { id: 'n05', t: 34.4, sub: 'โชคดีที่สายนี้มีเทพซัพพอร์ต เฮอร์มีสกับอะธีน่าแจกของให้ฟรีๆ… รองเท้ามีปีก หมวกล่องหน ดาบเคียว โล่ขัดเงา แล้วก็ย่ามวิเศษ' },
  { id: 'n06', t: 46.2, sub: 'ครบเซ็ตห้าชิ้น… พร้อมลุย!' },
  { id: 'n07', t: 51.0, sub: 'กลับมาที่บอสตัวเดิม… กฎมีข้อเดียว ห้ามมองตาเด็ดขาด' },
  { id: 'n08', t: 57.0, sub: 'เคล็ดลับคือ… หันหลังให้มัน แล้วมองผ่านเงาสะท้อนในโล่แทน' },
  { id: 'n09', t: 65.3, sub: 'ฟันครั้งเดียวจบ… แถมดรอปม้าบินเพกาซัสมาด้วย' },
  { id: 'n10', t: 71.0, sub: 'ขากลับเจออีเวนต์พิเศษ! เวิลด์บอสซีตัส กำลังจะกินเจ้าหญิงแอนโดรเมด้า' },
  { id: 'n11', t: 76.9, sub: 'ชูหัวเมดูซ่าทีเดียว… กลายเป็นหิน จบ' },
  { id: 'n12', t: 83.9, sub: 'ส่วนเจ้าของเควส ก็ได้หัวเมดูซ่าไป… แบบตรงตัว' },
  { id: 'n13', t: 89.0, sub: 'ทุกอย่างกำลังจะแฮปปี้เอนดิ้ง… จนเขาไปแข่งขว้างจักร' },
  { id: 'n14', t: 97.9, sub: 'ชายแก่คนนั้น… คือตาของเขาเอง' },
  { id: 'n15', t: 102.4, sub: 'บางเควส… ต่อให้หนีแค่ไหน ระบบก็นับว่าสำเร็จอยู่ดี ถ้าเป็นคุณ จะกดรับเควสนี้ไหม? บอกกันในคอมเมนต์นะ' },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
export const SET_OF = Object.fromEntries(SHOTS.map(s => [s.id, s.set]));

// —— Time warp: each shot keeps its animation timeline (a..b, "orig" time) but plays over fl seconds of film,
// so the picture breathes around the recorded voice. toOrig(film) drives sets and UI; toFilm(orig) places sounds.
let _f = 0; for (const s of SHOTS) { s.fa = _f; _f += s.fl; s.fb = _f; }
export const DUR_FILM = _f;
export const toOrig = tf => { const s = SHOTS.find(s => tf < s.fb) || SHOTS[SHOTS.length - 1]; return s.a + (Math.min(tf, s.fb) - s.fa) * (s.b - s.a) / s.fl; };
export const toFilm = to => { const s = SHOTS.find(s => to < s.b) || SHOTS[SHOTS.length - 1]; return s.fa + (Math.min(to, s.b) - s.a) * s.fl / (s.b - s.a); };
