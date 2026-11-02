// Export <name>.srt from the same timing the overlay uses (story.js + voices/dur.json)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { VO } = await import(path.join(HERE, 'story.js'));
const D = JSON.parse(fs.readFileSync(path.join(HERE, 'voices/dur.json')));
const ts = s => { const ms = Math.round(s * 1000), h = ms / 3600000 | 0, m = ms / 60000 % 60 | 0, se = ms / 1000 % 60 | 0; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(se).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const out = VO.map((v, i) => { const d = D[v.id] || 3, nxt = VO[i + 1], end = Math.min(v.t + Math.max(1.8, d + .6), nxt ? nxt.t - .4 : 1e9); return `${i + 1}\n${ts(v.t - .2)} --> ${ts(end)}\n${v.who ? v.who + ': ' : ''}${v.sub}\n`; }).join('\n');
fs.writeFileSync(path.join(HERE, 'perseus-quest.srt'), out); console.log('srt', VO.length, 'cues');
