"""Score, foley, ambience and voice for "Monkey King" → out/mix.wav (48 kHz stereo).
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
S = json.load(open(os.path.join(HERE, 'out/story.json'))); T = S['T']; VO = S['VO']; DUR = S['DUR_FILM']
FIGHTS = S['FIGHTS']
def FW(t): return t   # no time warp in this film
SC = 1.0
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
    d = d * SC
    x = sum(saw(hz(m), d, det) for det in (-.004, 0, .0035, .007)) / 4
    x = lp(x, bright) * adsr(d, .6, .8); vib = 1 + .002 * np.sin(2 * np.pi * 5 * tt(d)); return x * v
def trem(m, d, v=.5):
    x = strings(m, d, v, 2600); am = .55 + .45 * np.abs(np.sin(np.pi * 12 * tt(d))); return x * am
def choir(m, d, v=.5, vowel='a'):
    d = d * SC
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
def add(buf, x, at, g=1.0, pan=0.0, raw=False):
    if not raw: at = FW(at)
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

def stop(t, fade=.08, gap=.6):   # hard stop: silence the score for a beat
    s = int(t * SR); f = int(fade * SR); mus[s:s + f] *= np.linspace(1, 0, f)[:, None]; mus[s + f:s + int(gap * SR)] = 0
def comic(a, n=8):
    for i, (m, st) in enumerate([(50, 0), (57, .5), (50, 1), (57, 1.5), (53, 2.5), (52, 3), (50, 3.5), (45, 4.5)][:n]): add(mus, pizz(m - 12 if i % 2 == 0 else m, .7), a + st * .6, 1, -.2 + i * .05)
def clang(v=1):   # sword on an invulnerable hide: metallic ring
    t = tt(.7); return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in ((1850, .25), (2730, .18), (4100, .1))) * .3 + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / .015) * .5) * v
def chop(v=1):   # blade into flesh
    t = tt(.4); return (lp(rng.standard_normal(len(t)), 1800) * np.exp(-t / .05) * .8 + np.sin(2 * np.pi * 110 * t) * np.exp(-t / .08) * .6) * v
def punch(v=1):
    t = tt(.35); return (np.sin(2 * np.pi * 80 * t * (1 + .5 * np.exp(-t * 40))) * np.exp(-t / .07) + bp(rng.standard_normal(len(t)), 600, 3000) * np.exp(-t / .02) * .5) * v
def roar(d=1.4, v=1, f0=90):
    t = tt(d); x = sum(np.sin(2 * np.pi * f0 * k * t * (1 + .05 * np.sin(2 * np.pi * 6 * t))) / k for k in range(1, 7)); x += bp(rng.standard_normal(len(t)), 200, 1800) * .6
    return lp(x, 1600) * np.minimum(1, t / .15) * np.exp(-np.maximum(0, t - d * .6) / .3) * v * .4
def hiss(d=1.0, v=1): t = tt(d); return hp(rng.standard_normal(len(t)), 3000) * np.minimum(1, t / .1) * np.exp(-t / (d * .5)) * .3 * v
def flame(d=1.0, v=1): t = tt(d); return (lp(rng.standard_normal(len(t)), 1200) * .5 + bp(rng.standard_normal(len(t)), 2000, 6000) * .2 * (rng.random(len(t)) > .97)) * np.sin(np.pi * np.clip(t / d, 0, 1)) * v
# ================= SCORE =================
PENTA = [50, 52, 54, 57, 59, 62, 64, 66, 69, 71, 74]   # D gong pentatonic
FB = 60 / 104
def pipa(m, v=.6, trem=0): return P.pluck('pipa', m, 1.4, vel=v, **({'trem': trem} if trem else {}))
def guqin(m, d=3.0, v=.6): return P.pluck('guqin', m, d, vel=v)
def gong(v=.8, f=110, d=5):
    t = tt(d); x = sum(a * np.sin(2 * np.pi * f * r * t * (1 + .004 * np.exp(-t * 2))) * np.exp(-t / dd) for r, a, dd in ((1, 1, 3.5), (1.48, .6, 2.2), (2.03, .5, 1.6), (2.6, .35, 1.0), (3.4, .2, .7)))
    return (x * np.minimum(1, t / .02) * .35 + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / .3) * .05) * v
def cymbal(v=.6): t = tt(1.6); return hp(rng.standard_normal(len(t)), 5000) * np.exp(-t / .5) * .35 * v
def war_drums(a, b, heavy=1.0):
    n = int((b - a) / (FB / 2))
    for k in range(n):
        tm = a + k * FB / 2
        add(mus, frame_drum(.55 if k % 2 == 0 else .3, k % 4 != 3), tm, heavy, .15 if k % 2 else -.15)
        if k % 8 == 0: add(mus, timp(38, .75 * heavy), tm, 1)
        if k % 16 == 0: add(mus, cymbal(.5 * heavy), tm, 1, .3)
    riff = [0, 3, 5, 3, 7, 5, 3, 0]
    for k in range(int((b - a) / FB)): add(mus, pipa(PENTA[riff[k % 8]] + 12, .55 * heavy, trem=12 if k % 4 == 3 else 0), a + k * FB, .9, -.25)
    for k in range(int((b - a) / (FB * 4))): add(mus, horn(PENTA[[0, 3, 4, 3][k % 4]] - 12, FB * 3.6, .28 * heavy), a + k * FB * 4, 1)
# hook
war_drums(0.2, 9.83, 1.0)
t = tt(1.2); add(fol, np.sin(2 * np.pi * np.cumsum(300 * np.exp(-t * 1.6)) / SR) * .25 * (1 - t / 1.2) + bp(rng.standard_normal(len(t)), 400, 2400) * .15 * (1 - t / 1.2), 9.83, 1)
# birth: guqin harmonics, thunder at the crack, gong at the burst
for k, m in enumerate([62, 69, 66, 74, 71, 69]): add(mus, guqin(m, 3, .5), 11.3 + k * 1.0, .8, -.3 + k * .1)
add(fol, X.rumble(2.0, 1), T['eggCrack'], .9); add(mus, gong(.9, 98), T['eggBurst'], 1); add(fol, boom(.7), T['eggBurst'], .7)
for k in range(6): add(mus, pipa(PENTA[5 + k % 5], .5), T['status'] - .4 + k * .18, .8, .2)
# training
for k, m in enumerate([62, 64, 66, 69, 66, 64, 62, 57, 59, 62, 66, 69]): add(mus, guqin(m, 2.4, .45), 21.4 + k * .75, .8)
for at in (T['skill72'] - .2, T['skill72'] + 1.3): add(fol, X.pop(.8), at, .8); t = tt(.6); add(fol, bp(rng.standard_normal(len(t)), 800, 5000) * np.exp(-t / .15) * .4, at, .7)
add(fol, X.whoosh(1.2, 1), T['skillCloud'] + .3, .9, .3)
# sea: low pad + bubbles; gong at the grab; shrink sweep
for m in (38, 45, 50): add(mus, strings(m, 11.4, .14, 700), 30.9, 1)
for k in range(30): t = tt(.25); add(amb, np.sin(2 * np.pi * (600 + 900 * rng.random()) * t * (1 + 3 * t)) * np.exp(-t / .06) * .06, 31 + rng.uniform(0, 11), 1, rng.uniform(-.7, .7))
add(mus, gong(.9, 82, 6), T['grabPillar'], 1); t = tt(1.0); add(fol, np.sin(2 * np.pi * np.cumsum(120 + 900 * t) / SR) * .3 * np.exp(-t / .5), T['shrink'], .8)
add(mus, celesta(86, 2.5, .8), T['staffLoot'], 1); add(mus, celesta(90, 2.5, .6), T['staffLoot'] + .07, 1)
# nether: drone + brush stroke + chime
for m in (36, 43): add(mus, strings(m, 9.6, .3, 450), 42.4, 1)
add(mus, choir(55, 8, .1, 'o'), 43, 1); t = tt(.5); add(fol, bp(rng.standard_normal(len(t)), 1500, 6000) * np.sin(np.pi * t / .5) * .35, T['strike'], .9); add(mus, bell(74, .6, 3), T['immortal'], 1)
# horses: comic pizz + a deflating horn on the job card
comic(52.2)
for i, m in enumerate([55, 54, 53, 50]): add(mus, horn(m - 12, .5 if i < 3 else 1.1, .3), T['jobCard'] + i * .38, 1)
# rename: drums + gong + fanfare
war_drums(58.6, 64.6, .7); add(mus, gong(1.0, 110), T['banner'], 1)
for i, m in enumerate([62, 66, 69, 74]): add(mus, horn(m - 12, 1.2, .3), T['rename'] + i * .2, 1)
# peaches: playful pipa, munches, buff chimes, a gulp
for k in range(20): add(mus, pipa(PENTA[[4, 5, 7, 5, 8, 7, 5, 4][k % 8]] + 12, .4), 65.2 + k * .42, .8, .2)
for b in T['buffs']: t = tt(.3); add(fol, lp(rng.standard_normal(len(t)), 900) * (np.sin(2 * np.pi * 9 * t) > 0) * np.exp(-t / .1) * .4, b, .8); add(fol, chime_ui(.4), b + .2, 1)
t = tt(.6); add(fol, np.sin(2 * np.pi * np.cumsum(200 - 120 * t) / SR) * np.exp(-t / .2) * .4, T['gourd'] + .1, .8); add(mus, celesta(88, 2, .7), T['buffFull'], 1)
# army: gong at the emperor, marching build, the sweep, full battle, hard stop
add(mus, gong(1.0, 90), T['emperorAngry'], 1)
for k in range(int((T['clones'] - T['march']) / (FB))): add(mus, frame_drum(.4 + .3 * k / 10, True), T['march'] + k * FB, 1)
for k in range(10): add(fol, X.pop(.7), T['clones'] + k * .06, .6, -.8 + k * .18)
add(fol, X.whoosh(.6, 1.2), T['sweep'] - .1, 1); add(fol, boom(.6), T['sweep'] + .1, .8)
war_drums(86.6, 94.0, 1.25); stop(94.0, .05, .7); add(mus, boom(1.1), 94.05, 1); add(mus, gong(1.1, 80), 94.6, 1)
# erlang: tense pad, poofs on each transformation, duel drums, clash
for m in (45, 52): add(mus, strings(m, 15, .18, 900), 95.1, 1)
for f0 in T['forms']: add(fol, X.pop(.8), f0, .8); add(fol, X.whoosh(.4, .6), f0 + .1, .5)
war_drums(110.6, 118.0, 1.15); stop(118.0, .05, .7); add(mus, boom(1.1), 118.05, 1)
# capture: growl + bite, ring clang, dizzy chirps
add(fol, roar(.7, .7, 140), T['dog'] - .7, .7); add(fol, punch(.9), T['dog'], .9)
add(fol, clang(1.0), T['ring'], 1); add(fol, X.thump(1.0, 70), T['ring'], .9)
for k in range(6): add(fol, celesta(96 + (k % 2) * 3, .4, .3), T['ring'] + .4 + k * .25, .5)
# furnace: fire roar, drum per "day", burst, rampage drums
t = tt(8.0); add(amb, lp(rng.standard_normal(len(t)), 500) * .35 * np.minimum(1, t / 1), 127.0, 1)
for k in range(10): add(mus, frame_drum(.35 + .03 * k, True), T['days'][0] + k * .36, 1)
add(mus, boom(1.2), T['burst'], 1); add(fol, X.crash(.8), T['burst'], .8); add(mus, gong(1.0, 100), T['fireEyes'], 1)
war_drums(137.4, 139.8, 1.1)
# buddha: choir + bells, serene
for m, p in ((62, -.3), (66, 0), (69, .3)): add(mus, choir(m, 10, .15, 'a'), 140.0, 1, p)
for k in range(8): add(mus, bell(74 + [0, 2, 4, 7][k % 4], .35, 3), 140.6 + k * 1.2, 1, -.4 + k * .1)
# flight: launch whoosh, light pipa, back whoosh
add(fol, X.whoosh(1.4, 1.2), T['launch'], 1); add(fol, X.whoosh(1.4, 1.2), T['back'], 1)
for k in range(24): add(mus, pipa(PENTA[[5, 7, 8, 10, 8, 7][k % 6]], .4, trem=10 if k % 6 == 5 else 0), 153.5 + k * .35, .7, .2)
add(fol, bp(rng.standard_normal(int(1.0 * SR)), 1200, 5000) * .25, T['write'], .7)
# reveal: choir swells, silence before the flip, the slam
for m, p in ((50, -.3), (57, 0), (62, .3), (69, 0)): add(mus, choir(m, 6.4, .16, 'o'), 164.8, 1, p)
mus[int(170.4 * SR):int(T['slam'] * SR)] *= .0
add(mus, boom(1.4), T['slam'], 1); add(fol, X.rumble(4.0, 1.2), T['slam'], 1); add(mus, gong(1.2, 70, 7), T['slam'] + .1, 1)
# final: slow guqin + gong at the title
for k, m in enumerate([62, 59, 57, 54, 57, 50, 52, 50]): add(mus, guqin(m, 3.4, .45), 175.6 + k * 1.1, .8)
add(mus, gong(.8, 98, 6), T['title'], 1)
for m, p in ((50, -.3), (54, 0), (57, .3)): add(mus, choir(m, 5.0, .12, 'a'), T['title'], 1, p)

# ================= AMBIENCE =================
def bed(kind, a, b, g):
    d = b - a + 1.0; n = int(d * SR); t = np.arange(n) / SR; r = np.random.default_rng(abs(hash(kind)) % 1000)
    if kind == 'swamp': x = lp(r.standard_normal(n), 300) * .2 + sum(np.sin(2 * np.pi * f * t) * (np.sin(2 * np.pi * (2.2 + k) * t + k) > .8) for k, f in enumerate((380, 520, 300))) * .03
    elif kind == 'air': x = bp(r.standard_normal(n), 400, 2000) * .08 * (1 + .4 * np.sin(2 * np.pi * .1 * t))
    elif kind == 'hall': x = lp(r.standard_normal(n), 250) * .12
    elif kind == 'wind': x = bp(r.standard_normal(n), 300, 1400) * .12 * (1 + .5 * np.sin(2 * np.pi * .13 * t))
    elif kind == 'farm': x = lp(r.standard_normal(n), 700) * .06 + sum(np.sin(2 * np.pi * (2400 + 300 * np.sin(2 * np.pi * 9 * t)) * t) * ((t * .5 + k * .3) % 1 < .06) for k in range(3)) * .02
    elif kind == 'room': x = lp(r.standard_normal(n), 200) * .08
    else: x = lp(r.standard_normal(n), 120) * .35 * (1 + .3 * np.sin(2 * np.pi * .07 * t))   # underworld rumble
    env = np.minimum(1, np.minimum(t / .8, (d - t) / .8)); x = x * env * g
    add(amb, x, a - .5, 1, 0); add(amb, np.roll(x, 2000), a - .5, .7, .5)
for kind, a, b, g in [('air', 0, 11.03, .8), ('air', 11.03, 30.84, 1), ('room', 30.84, 42.42, 1), ('hall', 42.42, 52.0, 1), ('farm', 52.0, 58.43, 1), ('air', 58.43, 74.39, 1), ('air', 74.39, 126.91, .8), ('under', 126.91, 139.89, .6), ('air', 139.89, 189.26, .9)]:
    bed(kind, a, b, g)

# ================= FOLEY: staff hits from the fight lists =================
def staff_hit(v=1): t = tt(.35); return (np.sin(2 * np.pi * 140 * t * (1 + .4 * np.exp(-t * 40))) * np.exp(-t / .06) * .8 + bp(rng.standard_normal(len(t)), 900, 4000) * np.exp(-t / .03) * .6) * v
for name, hits in FIGHTS.items():
    for h in hits:
        at = h['t']; add(fol, X.whoosh(.16, .7), at - .1, .5, .2); add(fol, staff_hit(1), at, .8, .1)
        if h['tg'] in ('er', 'wk', 'both'): add(fol, clang(.7), at + .01, .6)
        if h.get('crit'): add(fol, X.thump(.8, 60), at, .7)
        if h.get('fin'): add(fol, boom(1.0), at, 1)
def steps(a, b, rate=4, v=.35):
    k = 0
    while a + k / rate < b: add(fol, X.step(v), a + k / rate, .7, rng.uniform(-.2, .2)); k += 1
steps(31.1, 33.6); steps(42.6, 44.6); steps(64.9, 66.4); steps(T['march'], T['march'] + 3.5, 6, .5)
for at in (T['status'], T['skill72'], T['skillCloud'], T['immortal'], T['jobCard'], T['rename'], T['fireEyes']): add(fol, chime_ui(.4), at, 1)
for c in S['CHAPTERS']: add(fol, bell(74, .25, 2.5), c['t'] + .2, 1)

# ================= VOICE + MIX =================
def readwav(p):
    with wave.open(p) as w: sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    if sr != SR: import soxr; x = soxr.resample(x, sr, SR)
    return x
for v in VO:
    p = os.path.join(HERE, 'voices', v['id'] + '.wav')
    if not os.path.exists(p): continue
    x = readwav(p); x = X.compress(x / max(1e-6, np.abs(x).max()) * .8, .2, 3.5); x = x / np.sqrt((x ** 2).mean() + 1e-12) * .12
    add(vox, x, v['t'], 1, 0)
from scipy.ndimage import uniform_filter1d
env = uniform_filter1d(np.abs(vox[:, 0]), int(.25 * SR)); duck = 1 - .8 * np.clip(env / .05, 0, 1); duck = uniform_filter1d(duck, int(.15 * SR))
duck2 = 1 - .5 * np.clip(env / .05, 0, 1); duck2 = uniform_filter1d(duck2, int(.15 * SR))
mus = reverb(mus, 2.4, .32); fol = reverb(fol, 1.2, .16)
MG, AG, FG = .3, .25, .5
bedmix = mus * duck[:, None] * MG + (amb * AG + fol * FG) * duck2[:, None]
act = env > .02; db = lambda a: 20 * np.log10(np.sqrt((a ** 2).mean()) + 1e-12)
print(f'voice vs bed while speaking: {db(vox[act]) - db(bedmix[act]):.1f} dB')
mix = bedmix + vox
for c in range(2): mix[:, c] = X.limit(mix[:, c], .65)
mix = mix[:int(DUR * SR)]
with wave.open(os.path.join(HERE, 'out/mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('mix.wav', mix.shape, 'peak', np.abs(mix).max())
