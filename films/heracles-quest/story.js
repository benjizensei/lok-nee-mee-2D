// Timeline: single source of truth (film seconds)
export const DUR = 157.8;
export const SHOTS = [
  { id: 'hook', set: 'swamp', a: 0.0, b: 9.6 },
  { id: 'rewind', set: 'swamp', a: 9.6, b: 10.8 },
  { id: 'olympus', set: 'olympus', a: 10.8, b: 22.8 },
  { id: 'palace', set: 'palace', a: 22.8, b: 33.4 },
  { id: 'lion', set: 'nemea', a: 33.4, b: 49.6 },
  { id: 'loot', set: 'nemea', a: 49.6, b: 54.4 },
  { id: 'jar1', set: 'palace', a: 54.4, b: 60.0 },
  { id: 'hydra', set: 'swamp', a: 60.0, b: 84.4 },
  { id: 'notCounted', set: 'palace', a: 84.4, b: 89.6 },
  { id: 'stables', set: 'stables', a: 89.6, b: 100.4 },
  { id: 'montage', set: 'map', a: 100.4, b: 113.4 },
  { id: 'cerberus', set: 'underworld', a: 113.4, b: 132.4 },
  { id: 'jar2', set: 'palace', a: 132.4, b: 137.2 },
  { id: 'wedding', set: 'olympus', a: 137.2, b: 145.0 },
  { id: 'final', set: 'olympus', a: 145.0, b: 157.8 },
];
// Fight choreography (hits): t, target, dmg text, kind; crit/miss flags. Hit-stop and shake come from these.
export const FIGHTS = {
  hook: [
    { t: 1.2, k: 'slash1', tg: 'h2', d: '412' }, { t: 1.55, k: 'slash2', tg: 'h2', d: '388' }, { t: 1.95, k: 'slash3', tg: 'h2', d: '1,204', crit: 1, cut: 'h2' },
    { t: 4.6, k: 'slash1', tg: 'h4', d: '397' }, { t: 4.95, k: 'slash3', tg: 'h4', d: '1,187', crit: 1, cut: 'h4' },
  ],
  lion: [
    { t: 35.6, k: 'slash1', tg: 'lion', d: '0', miss: 1 }, { t: 35.95, k: 'slash2', tg: 'lion', d: '0', miss: 1 }, { t: 36.35, k: 'slash3', tg: 'lion', d: '0', miss: 1 },
    { t: 37.3, k: 'slash1', tg: 'lion', d: 'MISS', miss: 1 }, { t: 37.65, k: 'slash3', tg: 'lion', d: '0', miss: 1 },
    { t: 41.2, k: 'grab', tg: 'lion', d: '850', skill: 'ล็อกคอ!' },
    { t: 44.3, k: 'squeeze', tg: 'lion', d: '920' }, { t: 44.7, k: 'squeeze', tg: 'lion', d: '1,040' }, { t: 45.1, k: 'squeeze', tg: 'lion', d: '1,310' },
    { t: 45.45, k: 'squeeze', tg: 'lion', d: '1,480' }, { t: 45.8, k: 'squeeze', tg: 'lion', d: '1,720' },
    { t: 47.3, k: 'squeeze', tg: 'lion', d: '9,999', crit: 1, fin: 1, stop: .35 },
  ],
  hydra: [
    { t: 64.9, k: 'slash1', tg: 'h1', d: '420' }, { t: 65.25, k: 'slash3', tg: 'h1', d: '1,150', crit: 1, cut: 'h1' },
    { t: 66.4, k: 'slash2', tg: 'h3', d: '402' }, { t: 66.75, k: 'slash3', tg: 'h3', d: '1,166', crit: 1, cut: 'h3' },
    { t: 70.2, k: 'slash1', tg: 'h5', d: '438', skill: 'ฟัน+จี้ไฟ!' }, { t: 70.5, k: 'fire', tg: 'h5', d: '777', burn: 'h5', who: 'ally', cut: 'h5' },
    { t: 71.6, k: 'slash2', tg: 'h6', d: '451' }, { t: 71.9, k: 'fire', tg: 'h6', d: '812', burn: 'h6', who: 'ally', cut: 'h6' },
    { t: 73.6, k: 'slash3', tg: 'h7', d: '470' }, { t: 73.85, k: 'fire', tg: 'h7', d: '790', burn: 'h7', who: 'ally', cut: 'h7' },
    { t: 74.6, k: 'slash1', tg: 'h8', d: '455' }, { t: 74.85, k: 'fire', tg: 'h8', d: '805', burn: 'h8', who: 'ally', cut: 'h8' },
    { t: 75.6, k: 'slash2', tg: 'h9', d: '466' }, { t: 75.85, k: 'fire', tg: 'h9', d: '830', burn: 'h9', who: 'ally', cut: 'h9' },
    { t: 76.6, k: 'slash3', tg: 'h10', d: '488' }, { t: 76.85, k: 'fire', tg: 'h10', d: '851', burn: 'h10', who: 'ally', cut: 'h10' },
    { t: 78.1, k: 'slash3', tg: 'body', d: '9,999', crit: 1, fin: 1, stop: .3 },
  ],
  cerberus: [
    { t: 122.6, k: 'punch', tg: 'c1', d: '1,020', hp: [0, .22] }, { t: 122.95, k: 'punch2', tg: 'c1', d: '1,110', hp: [0, .22] }, { t: 123.3, k: 'punch', tg: 'c1', d: '2,480', crit: 1, hp: [0, .56], ko: 'c1' },
    { t: 125.2, k: 'punch2', tg: 'c2', d: '1,090', hp: [1, .2] }, { t: 125.55, k: 'punch', tg: 'c2', d: '1,170', hp: [1, .2] }, { t: 125.9, k: 'kick', tg: 'c2', d: '2,610', crit: 1, hp: [1, .6], ko: 'c2' },
    { t: 127.6, k: 'punch', tg: 'c3', d: '1,130', hp: [2, .2] }, { t: 127.95, k: 'punch2', tg: 'c3', d: '1,240', hp: [2, .2] },
    { t: 129.4, k: 'grab', tg: 'cer', d: '', skill: 'รัดสามหัว!' },
    { t: 130.6, k: 'squeeze', tg: 'cer', d: '9,999', crit: 1, fin: 1, stop: .35, hp: [2, .6], ko: 'c3' },
  ],
};
export const T = {
  hydraHook: { regrow: [2.3, 5.3] },
  statusHera: 17.0, curse: 24.0, questIn: 28.2,
  lionKO: 47.9, peltDrop: 50.3, peltEquip: 52.2,
  jarDive1: 57.0, iolaus: 68.2, boulder: 80.3, stamp1: 86.6,
  flood: 94.0, stamp2: 97.4, tenTo12: 101.0,
  montage: [104.3, 105.2, 106.0, 106.8, 107.8, 108.8, 109.7, 110.8],
  cerberusRise: 116.0, breath: [124.1, 126.6, 128.6], jarDive2: 135.0,
  ascend: 138.2, hera: 147.0, title: 152.6,
};
export const CHAPTERS = [
  { t: 10.8, n: 'บทที่ ๑', name: 'สร้างตัวละคร' },
  { t: 33.4, n: 'เควส ๑/๑๐', name: 'สิงโตแห่งนีเมีย' },
  { t: 60.0, n: 'เควส ๒/๑๐', name: 'ไฮดราแห่งเลอร์นา' },
  { t: 113.4, n: 'เควส ๑๒/๑๒', name: 'เซอร์เบอรัส' },
];
export const MONTAGE = ['กวางเขาทอง', 'หมูป่าเอรีแมนทัส', 'ฝูงนกสติมฟาลัส', 'วัวกระทิงแห่งครีต', 'ม้ากินคน', 'เข็มขัดราชินีแอมะซอน', 'ฝูงวัวแดงของเกรีออน', 'แอปเปิ้ลทองคำ'];
export const VO = [
  { id: 'v01', t: 0.3, sub: 'หัวที่สาม… งอกกลับมาแล้ว! ฟันหนึ่งหัว ได้เพิ่มมาสองหัว บอสตัวนี้… ยิ่งตียิ่งเยอะ' },
  { id: 'v02', t: 11.2, sub: 'ย้อนไปตอนสร้างตัวละคร… เฮราคลีส ลูกชายของซุส เกิดมาพร้อมพลังเกินร้อย และศัตรูประจำตัวหนึ่งคน คือเฮร่า ราชินีแห่งเทพ' },
  { id: 'v03', t: 23.2, sub: 'คำสาปของเฮร่าทำให้เขาคลุ้มคลั่ง จนทำผิดครั้งใหญ่… ทางไถ่บาปมีทางเดียว คือทำเควสให้กษัตริย์ยูริสธีอุส สิบงาน' },
  { id: 'v04', t: 33.8, sub: 'เควสแรก… สิงโตแห่งนีเมีย หนังของมัน ฟันไม่เข้า' },
  { id: 'v05', t: 39.4, sub: 'งั้นไม่ต้องใช้ดาบ! ล็อกคอ… บีบด้วยมือเปล่า!' },
  { id: 'v06', t: 50.0, sub: 'ดรอปไอเทม หนังสิงโตกันทุกอาวุธ ใส่เป็นชุดประจำตัวไปตลอดเกม พอแบกกลับมา กษัตริย์กลัวจนมุดลงไปหลบในไหสำริด' },
  { id: 'v07', t: 60.4, sub: 'เควสที่สอง ไฮดรา งูเก้าหัวแห่งหนองน้ำเลอร์นา' },
  { id: 'v08', t: 68.2, sub: 'ไอโอเลาส์ หลานชาย เข้าร่วมปาร์ตี้! ฟันปุ๊บ จี้ไฟปั๊บ!' },
  { id: 'v09', t: 79.8, sub: 'หัวสุดท้ายเป็นอมตะ… เลยฝังไว้ใต้หินก้อนยักษ์ จบ แต่กษัตริย์บอกว่า… เควสนี้ไม่นับ เพราะใช้ตัวช่วย' },
  { id: 'v10', t: 90.0, sub: 'อีกเควส ล้างคอกวัวที่ไม่เคยล้างมาสามสิบปี เขาผันแม่น้ำสองสายมาล้างทีเดียวเกลี้ยง… แต่ก็ไม่นับอีก เพราะไปรับค่าจ้าง' },
  { id: 'v11', t: 100.8, sub: 'สิบงานเลยกลายเป็นสิบสอง กวางเขาทอง หมูป่า ฝูงนก วัวกระทิง ม้ากินคน เข็มขัดราชินี ฝูงวัวแดง แอปเปิ้ลทองคำ… เคลียร์ทีละเควส' },
  { id: 'v12', t: 113.8, sub: 'เควสสุดท้าย ลงยมโลกไปจับเซอร์เบอรัส หมาสามหัวเฝ้านรก เงื่อนไขพิเศษ… ห้ามใช้อาวุธ' },
  { id: 'v13', t: 121.8, sub: 'สามหัว สามหลอดเลือด! เอาเลย!' },
  { id: 'v14', t: 132.8, sub: 'พาหมานรกไปส่งถึงวัง… กษัตริย์มุดลงไหอีกรอบ' },
  { id: 'v15', t: 137.6, sub: 'ครบสิบสองเควส ในที่สุดเฮราคลีสได้ขึ้นไปเป็นเทพบนโอลิมปัส และได้แต่งงานกับเทพีเฮบี' },
  { id: 'v16', t: 145.0, sub: 'ซึ่งเป็นลูกสาวของเฮร่า… ศัตรูตัวจริงตลอดเกม กลายเป็นแม่ยาย บางเกม บอสสุดท้าย… ก็ไม่ได้อยู่ในดันเจี้ยน' },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
export const SET_OF = Object.fromEntries(SHOTS.map(s => [s.id, s.set]));
// no time warp in this film: film time = story time
export const DUR_FILM = DUR; export const toOrig = t => t; export const toFilm = t => t;
