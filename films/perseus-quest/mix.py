"""Score, foley, ambience and voice for "Perseus" → out/mix.wav (48 kHz stereo).
Everything synthesized here (no sample library): harp = waveguide pluck, strings/choir/horn = filtered oscillators,
timpani/drums/bells = modal synthesis. Times come from story.json (exported from story.js) and voices/dur.json."""
import json, os, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB', os.path.abspath(os.path.join(HERE, '../..')))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
import sfx as X
import pluck as P
SR = X.SR
S = json.load(open(os.path.join(HERE, 'out/story.json'))); T = S['T']; VO = S['VO']; DUR = S['DUR']
VD = json.load(open(os.path.join(HERE, 'voices/dur.json')))
N = int(DUR * SR) + SR
rng = np.random.default_rng(5)
mus, amb, fol, vox = (np.zeros((N, 2)) for _ in range(4))
BPM = 84; BEAT = 60 / BPM
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def adsr(d, a=.01, r=.2):
    n = int(d * SR); e = np.ones(n); na, nr = max(1, min(n // 2, int(a * SR))), max(1, min(n // 2, int(r * SR)))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def saw(f, d, det=0.0): t = tt(d); return 2 * ((t * f * (1 + det)) % 1) - 1
def M(name): return P.midi(name)

# —— instruments ——
def strings(m, d, v=.5, bright=1800):
    x = sum(saw(hz(m), d, det) for det in (-.004, 0, .0035, .007)) / 4
    x = lp(x, bright) * adsr(d, .6, .8); vib = 1 + .002 * np.sin(2 * np.pi * 5 * tt(d)); return x * v
def trem(m, d, v=.5):
    x = strings(m, d, v, 2600); am = .55 + .45 * np.abs(np.sin(np.pi * 12 * tt(d))); return x * am
def choir(m, d, v=.5, vowel='a'):
    F = {'a': [(700, 1.0), (1150, .5), (2700, .25)], 'o': [(450, 1.0), (800, .5), (2830, .15)], 'm': [(300, 1.0), (1000, .2), (2500, .05)]}[vowel]
    src = sum(saw(hz(m) * (1 + .003 * np.sin(2 * np.pi * (4.6 + k * .7) * tt(d) + k)), d, k * .002) for k in range(3)) / 3
    x = sum(bp(src, f * .85, f * 1.15) * g for f, g in F); return x * adsr(d, .8, 1.0) * v * 2.2
def horn(m, d, v=.5):
    t = tt(d); f = hz(m) * (1 + .004 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t - .3, 0, 1))
    ph = np.cumsum(f) / SR; x = 2 * (ph % 1) - 1; env = adsr(d, .09, .25)
    x = lp(x, 500) * (1 - env) + lp(x, 1800) * env; return x * env * v
def harp(m, d=2.5, v=.6): return P.pluck('harp', m, d, vel=v) * .9
def pizz(m, v=.7): return P.pluck('upright_bass_pizz', m, .9, vel=v)
def celesta(m, d=2.2, v=.5):
    t = tt(d); f = hz(m); x = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / (dd)) for k, a, dd in ((1, 1, .9), (3.01, .3, .25), (4.2, .15, .12), (2, .2, .5)))
    return x * v * .5
def timp(m, v=.8, d=1.8):
    t = tt(d); f = hz(m) * (1 + .06 * np.exp(-t * 18)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .55) + .5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * np.exp(-t / .25)
    nz = lp(rng.standard_normal(len(t)), 900) * np.exp(-t / .04) * .4; return (x + nz) * v * .7
def frame_drum(v=.6, low=True):
    t = tt(.5); f = 90 if low else 180; x = np.sin(2 * np.pi * f * t * (1 + .3 * np.exp(-t * 30))) * np.exp(-t / (.18 if low else .08)); x += bp(rng.standard_normal(len(t)), 800, 4000) * np.exp(-t / .02) * .4
    return x * v
def bell(m, v=.6, d=4):
    t = tt(d); f = hz(m); ratios = [(.5, .5, 2.5), (1, 1, 2.0), (1.19, .4, 1.2), (1.56, .3, .9), (2.0, .35, .8), (2.74, .2, .5), (3.76, .1, .3)]
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / dd) for r, a, dd in ratios) * v * .4
def boom(v=1.0):
    t = tt(4); x = np.sin(2 * np.pi * 42 * t * (1 + .5 * np.exp(-t * 6))) * np.exp(-t / 1.2); x += lp(rng.standard_normal(len(t)), 300) * np.exp(-t / .6) * .5
    sh = hp(rng.standard_normal(len(t)), 5000) * np.exp(-((t - 1.2) ** 2) / .6) * .15; return (x + sh) * v
def chime_ui(v=.5, up=True):
    out = np.zeros(int(.9 * SR))
    for i, m in enumerate((79, 84, 88) if up else (88, 84)): c = celesta(m, .8, .7); s = int(i * .07 * SR); out[s:s + len(c)] += c[:len(out) - s]
    return out * v
def add(buf, x, at, g=1.0, pan=0.0):
    if x.ndim == 1: X.add(buf, x, at, g, pan)
    else:
        s = int(at * SR); e = min(len(buf), s + len(x)); buf[s:e] += x[:e - s] * g

# —— reverb (stereo noise IR) ——
def reverb(x, sec=2.2, wet=.3, damp=4000):
    n = int(sec * SR); t = np.arange(n) / SR; out = np.zeros_like(x)
    for c in range(2):
        ir = lp(np.random.default_rng(c + 3).standard_normal(n), damp) * np.exp(-t * 6.9 / sec); ir[:int(.01 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
        out[:, c] = fftconvolve(x[:, c], ir)[:len(x)]
    return x * (1 - wet) + out * wet * 1.4

# ================= SCORE =================
Dm, Bb, F, C, Gm, A = [50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55], [55, 58, 62], [45, 49, 52]
# A: cave (0–6.2) — drone, hum, timpani roll crescendo, hard stop into the rewind
for m in (38, 45): add(mus, strings(m, 6.4, .35, 600), 0, 1, -.2 if m == 38 else .2)
for m, p in ((62, -.3), (65, 0), (69, .3)): add(mus, choir(m, 6.2, .18, 'm'), .2, 1, p)
for i in range(40): tm = 2.4 + i * .09; add(mus, timp(38, .15 + .5 * i / 40, .5), tm, 1, .1)
add(mus, timp(38, .9), 5.9, 1)
# rewind: tape spin-down
t = tt(1.4); f = 300 * np.exp(-t * 1.6); add(fol, np.sin(2 * np.pi * np.cumsum(f) / SR) * .25 * (1 - t / 1.4) + bp(rng.standard_normal(len(t)), 400, 2400) * .15 * (1 - t / 1.4), 6.2, 1)
# B: beach (7.6–19) — harp arpeggios over i–VI–III–VII
prog = [Dm, Bb, F, C]
t0 = 7.6
for bar in range(4):
    ch = prog[bar % 4]; tb = t0 + bar * 4 * BEAT
    add(mus, strings(ch[0] - 12, 4 * BEAT + .4, .16, 900), tb, 1, -.2)
    for k in range(8): m = ch[k % 3] + 12 * (k // 3); add(mus, harp(m + 12, 2.5, .45 + .1 * (k == 0)), tb + k * BEAT / 2, .9, -.3 + k * .08)
# C: palace (19–30.8) — horn line + frame drum
t0 = 19.0
for b in range(int(11.8 / BEAT)):
    add(mus, frame_drum(.45 if b % 2 == 0 else .25, b % 2 == 0), t0 + b * BEAT, 1, .1)
for (m, st, d) in [(50, 0, 2), (53, 2, 1), (52, 3, 1), (50, 4, 3), (57, 8, 2), (55, 10, 1), (53, 11, 1), (52, 12, 2), (50, 14, 3)]:
    add(mus, horn(m, d * BEAT + .1, .42), t0 + 1.2 + st * BEAT, 1, -.15)
for b, ch in enumerate([Dm, Gm, Dm, A]): add(mus, strings(ch[0] - 12, 4 * BEAT * 1.0 + .3, .14, 700), t0 + b * 4 * BEAT * .98, 1, .2)
# D: temple (30.8–42.6) — harp + celesta, F major brightness, each item on its chime
t0 = 30.8
for bar, ch in enumerate([F, C, Dm, Bb]):
    tb = t0 + bar * 4 * BEAT
    add(mus, strings(ch[0], 4 * BEAT + .5, .12, 1600), tb, 1, .2)
    for k in range(4): add(mus, harp(ch[k % 3] + 12, 2.5, .4), tb + k * BEAT, .8, -.2)
for i, ti in enumerate(T['items']): add(mus, celesta(72 + [0, 2, 4, 7, 9][i] + 12, 2.0, .7), ti, 1, (i - 2) * .25); add(fol, chime_ui(.4), ti + .05, 1, 0)
add(mus, celesta(84, 3, .8), 39.4, 1); add(mus, celesta(88, 3, .6), 39.47, 1); add(mus, celesta(91, 3, .5), 39.54, 1)
# A': back in the cave (42.6–54.0) — drone, tremolo rising, then silence
for m in (38, 45): add(mus, strings(m, 11.6, .32, 650), 42.6, 1)
for i, m in enumerate([62, 63, 65, 67]): add(mus, trem(m, 11.4 - i * 2.4, .07 + .03 * i), 42.6 + i * 2.4, 1, -.3 + .2 * i)
for b in range(int(11 / (BEAT / 2))): tm = 43 + b * BEAT / 2
mus[int(54.0 * SR):int(55.0 * SR)] *= np.linspace(1, 0, int(1.0 * SR))[:, None] ** 3 * 0 + np.linspace(1, 0, int(1.0 * SR))[:, None] * 0
add(fol, X.heartbeat(.9), T['breathe'], .9)
# 55.0 slash → silence → 56.1 boom + shimmer + choir in D major
add(fol, X.whoosh(.25, 1), T['slash'] - .12, .9, .2)
t = tt(1.2); add(fol, (bp(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t / .3) * .5 + np.sin(2 * np.pi * 2200 * t) * np.exp(-t / .5) * .2), T['slash'], .8, .2)   # blade ring
t = tt(1.0); add(fol, lp(rng.standard_normal(len(t)), 800) * np.exp(-t / .25) * .6 * np.linspace(1, 0, len(t)), T['slash'] + .05, .7)   # light sucked out
add(mus, boom(.9), T['pegasus'], 1)
for m, p in ((62, -.3), (66, 0), (69, .3), (74, 0)): add(mus, choir(m, 6.0, .22, 'a'), T['pegasus'] + .05, 1, p)
for m in (50, 57): add(mus, strings(m, 6.0, .2, 2200), T['pegasus'] + .2, 1)
for k in range(6): add(fol, X.whoosh(.3, .4), T['pegasus'] + .5 + k * .55, .35, .3)   # wings
add(fol, chime_ui(.55), T['drop'], 1)
# E: storm (62.4–72.8) — timpani + string ostinato
t0 = 62.4
for b in range(int(10.4 / (BEAT / 2))):
    tm = t0 + b * BEAT / 2; ch = [Dm, Dm, Bb, A][(b // 8) % 4]
    add(mus, strings(ch[b % 3] + 12, BEAT / 2 + .05, .09, 3000) * adsr(BEAT / 2 + .05, .01, .08), tm, 1, .3 if b % 2 else -.3)
    if b % 4 == 0: add(mus, timp(38 if (b // 8) % 4 != 3 else 45, .55), tm, 1)
for b, ch in enumerate([Dm, Bb, Dm, A]): add(mus, horn(ch[0] - 12, 4 * BEAT * .6, .3), t0 + b * 4 * BEAT * .62 + .3, 1)
mus[int(68.4 * SR):int(68.9 * SR)] *= .3
add(mus, bell(50, .6), T['petrifyCetus'], 1)
add(fol, chime_ui(.5), T['partyJoin'], 1)
# C': stone king (72.8–77.8) — comic pizzicato
for i, (m, st) in enumerate([(50, 0), (57, .5), (50, 1), (57, 1.5), (53, 2.5), (52, 3), (50, 3.5), (45, 4.5)]):
    add(mus, pizz(m - 12 if i % 2 == 0 else m, .7), 73.0 + st * BEAT, 1, -.2 + i * .05)
add(fol, chime_ui(.45), T['kingStone'] + .3, 1)
# F: games (77.8–83.8) — bright pad, then hard stop at the hit
for ch, tb in ((F, 77.8), (C, 80.6)): [add(mus, strings(m, 2.9, .1, 2400), tb, 1, (k - 1) * .3) for k, m in enumerate(ch)]
for k in range(10): add(mus, harp(F[k % 3] + 24, 2, .3), 78 + k * BEAT / 2, .6)
mus[int(T['hit'] * SR):int((T['hit'] + .25) * SR)] *= np.linspace(1, 0, int(.25 * SR))[:, None]
mus[int((T['hit'] + .25) * SR):int(86.5 * SR)] = 0
# complete: low bell + slow minor "fanfare"
add(mus, bell(38, .9, 6), T['complete'], 1)
for i, m in enumerate([62, 65, 69, 74]): add(mus, horn(m - 12, 2.0 - i * .2, .26), T['complete'] + .6 + i * .55, 1)
add(mus, choir(50, 4.5, .14, 'o'), T['complete'] + 1.2, 1)
# G: stars (91.2–101.5) — pad, slow harp, a small bell per star, final chord
for ch, tb in ((Dm, 91.2), (Bb, 94.0), (F, 96.8)): [add(mus, strings(m, 3.2 if tb < 96 else 4.8, .1, 1500), tb, 1, (k - 1) * .3) for k, m in enumerate(ch)]
for k in range(14): add(mus, harp([62, 65, 69, 72, 74][k % 5] + (12 if k > 9 else 0), 3, .3), 92 + k * BEAT * .8, .6, -.4 + k * .06)
for i in range(12): add(fol, celesta(86 + [0, 2, 4, 7, 9, 12][i % 6], 1.6, .45), T['starsStart'] + .9 + i * .38, .7, -.5 + i * .09)
add(mus, choir(62, 5.5, .18, 'a'), 96.0, 1, -.2); add(mus, choir(69, 5.5, .14, 'a'), 96.0, 1, .2); add(mus, bell(50, .5, 5), T['title'], 1)

# ================= AMBIENCE (per set, crossfaded) =================
def bed(kind, a, b, g):
    d = b - a + 1.0; n = int(d * SR); x = np.zeros(n); t = np.arange(n) / SR; r = np.random.default_rng(hash(kind) % 1000)
    if kind == 'cave': x = lp(r.standard_normal(n), 300) * .25 * (1 + .3 * np.sin(2 * np.pi * .1 * t))
    if kind == 'sea': x = lp(r.standard_normal(n), 900) * (.25 + .2 * np.sin(2 * np.pi * t / 6.5) ** 2)
    if kind == 'hall': x = lp(r.standard_normal(n), 250) * .12 + bp(r.standard_normal(n), 1500, 5000) * .02 * (r.random(n) > .996)
    if kind == 'wind': x = bp(r.standard_normal(n), 300, 1400) * .12 * (1 + .5 * np.sin(2 * np.pi * .13 * t))
    if kind == 'rain': x = hp(r.standard_normal(n), 1200) * .18 + lp(r.standard_normal(n), 500) * .25 * (.6 + .4 * np.sin(2 * np.pi * t / 5) ** 2)
    if kind == 'crowd': x = bp(r.standard_normal(n), 300, 2500) * .08 * (1 + .4 * np.sin(2 * np.pi * .7 * t))
    if kind == 'night': x = sum(np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 28 * t) > .6) * ((t * .7 + k) % 1 < .3) for k in (0, .4)) * .015
    env = np.minimum(1, np.minimum(t / .8, (d - t) / .8)); x = x * env * g
    add(amb, x, a - .5, 1, 0); add(amb, np.roll(x, 2000), a - .5, .7, .5)
for kind, a, b, g in [('cave', 0, 7.6, 1), ('sea', 7.1, 19, .9), ('hall', 19, 30.8, 1), ('wind', 30.8, 42.6, .9), ('cave', 42.6, 62.4, 1), ('rain', 61.9, 72.8, 1.1), ('hall', 72.8, 77.8, 1), ('crowd', 77.8, 83.8, 1), ('wind', 83.8, 91.2, .5), ('night', 91.2, 101.5, 1)]:
    bed(kind, a, b, g)
# drips in the cave, gulls at the beach, fire crackle in the hall
for k in range(14): tm = rng.uniform(0, 6) if k < 6 else rng.uniform(42.6, 54); t = tt(.3); add(amb, np.sin(2 * np.pi * (1400 + 500 * rng.random()) * t * (1 + 2 * t)) * np.exp(-t / .05) * .12, tm, 1, rng.uniform(-.7, .7))
for k in range(5): tm = 9 + k * 2.1; t = tt(.5); add(amb, np.sin(2 * np.pi * (1800 - 900 * t) * t) * np.exp(-t / .2) * .05 * (np.sin(2 * np.pi * 9 * t) > 0), tm, 1, rng.uniform(-.8, .8))
for a, b in ((19, 30.8), (72.8, 77.8)):
    for k in range(int((b - a) * 9)): tm = a + rng.uniform(0, b - a); t = tt(.03); add(amb, hp(rng.standard_normal(len(t)), 2000) * np.exp(-t / .006) * .1, tm, 1, rng.uniform(-.6, .6))

# ================= FOLEY =================
def steps(a, b, rate=4, v=.35):
    k = 0
    while a + k / rate < b: add(fol, X.step(v), a + k / rate, .7, rng.uniform(-.2, .2)); k += 1
steps(0.05, 3.2); steps(42.7, 45.8); steps(19.4, 25.2, 4, .3); steps(51.0, 53.8, 2.2, .25)
add(fol, X.thump(.6, 80), T['chestLand'], .8); add(fol, X.creak(.5), T['chestLand'] + .6, .5)
t = tt(.6); add(fol, np.sin(2 * np.pi * 220 * t) * np.exp(-t / .2) * .4 + np.sin(2 * np.pi * 330 * t) * np.exp(-t / .15) * .2, T['warn'], .7)    # warn tone
add(fol, np.sin(2 * np.pi * 220 * t) * np.exp(-t / .2) * .3, T['warn'] + .35, .6)
add(fol, chime_ui(.35), T['bossUI'] + .2, 1); add(fol, chime_ui(.4), T['status'], 1); add(fol, chime_ui(.45), T['questIn'], 1)
add(fol, X.click(1.6, .6), T['questAccept'], .8); add(fol, chime_ui(.4, False), T['questAccept'] + .1, 1)
for c in S['CHAPTERS']: add(fol, bell(74, .25, 2.5), c['t'] + .2, 1)
for f in T['flashes']: add(fol, X.crash(.4) if hasattr(X, 'crash') else 0, f, .25); add(fol, X.rumble(2.5, 1), f + .25, .9)
for at in (T['petrifyCetus'], T['kingStone']): t = tt(1.2); add(fol, bp(rng.standard_normal(len(t)), 300, 3000) * (rng.random(len(t)) > .7) * np.exp(-t / .35) * .7 + lp(rng.standard_normal(len(t)), 200) * np.exp(-t / .3) * .4, at, .8)
add(fol, X.whoosh(1.6, .8), T['throw'], .6, .3); add(fol, X.thump(.9, 70), T['hit'], .9); add(fol, X.clack(.8, .6), T['hit'] + .25, .5)
t = tt(2.4); add(fol, bp(rng.standard_normal(len(t)), 400, 3000) * .25 * np.minimum(1, t / .3) * np.maximum(0, 1 - t / 2.4), T['throw'] + .2, .8)   # crowd swells as it flies

# ================= VOICE =================
def readwav(p):
    with wave.open(p) as w: sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    if sr != SR: import soxr; x = soxr.resample(x, sr, SR)
    return x
VDIR = os.environ.get('VOICE_DIR', os.path.join(HERE, 'voices'))
for v in VO:
    p = os.path.join(VDIR, v['id'] + '.wav')
    if not os.path.exists(p): continue
    x = readwav(p); x = X.compress(x / max(1e-6, np.abs(x).max()) * .8, .2, 3.5)
    x = x / np.sqrt((x ** 2).mean() + 1e-12) * .12
    if v.get('dlg'): x = lp(x, 7000)
    add(vox, x, v['t'], 1, 0)
# duck music by ~10 dB under the voice (down only)
from scipy.ndimage import uniform_filter1d
env = uniform_filter1d(np.abs(vox[:, 0]), int(.25 * SR)); duck = 1 - .68 * np.clip(env / .05, 0, 1)
duck = uniform_filter1d(duck, int(.15 * SR))

mus = reverb(mus, 2.6, .35); fol = reverb(fol, 1.4, .18)
mix = mus * duck[:, None] * .55 + amb * .5 + fol * .7 + vox * 1.0
for c in range(2): mix[:, c] = X.limit(mix[:, c], .8)
mix = mix[:int(DUR * SR)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
with wave.open(os.path.join(HERE, 'out/mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('mix.wav', mix.shape, 'peak', np.abs(mix).max())
