"""Score, foley, ambience and voice for "Heracles" → out/mix.wav (48 kHz stereo).
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
FIGHTS = S['FIGHTS']; MONT = T['montage']
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

# ================= SCORE =================
Dm, Bb, F, C, Gm, A, Dmaj = [50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55], [55, 58, 62], [45, 49, 52], [50, 54, 57]
FB = 60 / 96   # fight beat (96 bpm)
def fight_music(a, b, heavy=1.0, key=38):
    # frame drums on 8ths, timpani on downbeats, low brass ostinato (D phrygian-ish), strings stabs
    n = int((b - a) / (FB / 2))
    for k in range(n):
        tm = a + k * FB / 2
        add(mus, frame_drum(.5 if k % 2 == 0 else .28, k % 4 == 0), tm, heavy, .15 if k % 2 else -.15)
        if k % 8 == 0: add(mus, timp(key, .7 * heavy), tm, 1)
        if k % 16 == 0: [add(mus, (lambda y: y * adsr(len(y) / SR, .01, .2))(strings(m + 12, FB * 1.5, .12, 2600)), tm, heavy, (j - 1) * .3) for j, m in enumerate([key + 12, key + 15, key + 19])]
    riff = [0, 0, 1, 0, 3, 1, 0, -2]
    for k in range(int((b - a) / (FB * 1))):
        add(mus, horn(key + riff[k % 8] + (12 if (k // 8) % 2 else 0), FB * .9, .3 * heavy), a + k * FB, 1, -.1)
def stop(t, fade=.08, gap=.6):   # hard stop: silence the score for a beat
    s = int(t * SR); f = int(fade * SR); mus[s:s + f] *= np.linspace(1, 0, f)[:, None]; mus[s + f:s + int(gap * SR)] = 0
# hook (0–9.6)
fight_music(0.2, 9.6, .9)
t = tt(1.4); add(fol, np.sin(2 * np.pi * np.cumsum(300 * np.exp(-t * 1.6)) / SR) * .25 * (1 - t / 1.4) + bp(rng.standard_normal(len(t)), 400, 2400) * .15 * (1 - t / 1.4), 9.6, 1)
# olympus (10.8–22.8): choir + harp, bright
for m, p in ((65, -.3), (69, 0), (72, .3)): add(mus, choir(m, 12, .14, 'a'), 10.9, 1, p)
for k in range(22): add(mus, harp([65, 69, 72, 77, 76, 72, 69, 67][k % 8] + (12 if k > 15 else 0), 2.4, .35), 11.2 + k * .5, .7, -.4 + (k % 8) * .1)
add(mus, bell(77, .6, 3), 12.0, 1)
# palace (22.8–33.4): dark drone; curse cluster; horn on the quest
for m in (38, 45): add(mus, strings(m, 10.8, .3, 600), 22.8, 1)
for m in (62, 63, 68): add(mus, choir(m, 4.0, .16, 'm'), T['curse'], 1, (m - 64) * .1)
for i, m in enumerate([50, 53, 57, 62]): add(mus, horn(m, 1.1, .3), T['questIn'] + i * .45, 1)
# lion (33.4–49.6)
add(mus, strings(38, 2.0, .3, 500), 33.4, 1); fight_music(35.0, 38.7, .9, 41)
fight_music(41.2, 47.3, 1.15, 41); stop(47.3, .05, .7)
for i, m in enumerate([62, 66, 69, 74]): add(mus, horn(m - 12, 1.4 - i * .1, .35), 48.0 + i * .22, 1)
# loot (49.6–54.4): harp sparkle + equip chime
for k in range(10): add(mus, harp([74, 78, 81, 86][k % 4], 2, .35), 50.0 + k * .25, .7)
add(mus, celesta(86, 2.5, .8), T['peltEquip'], 1); add(mus, celesta(90, 2.5, .6), T['peltEquip'] + .07, 1)
# comic pizzicato (jar / not counted / jar 2)
def comic(a, n=8):
    for i, (m, st) in enumerate([(50, 0), (57, .5), (50, 1), (57, 1.5), (53, 2.5), (52, 3), (50, 3.5), (45, 4.5)][:n]): add(mus, pizz(m - 12 if i % 2 == 0 else m, .7), a + st * .6, 1, -.2 + i * .05)
comic(54.6); comic(84.6); comic(132.6)
# hydra (60–84.4)
add(mus, strings(38, 2.6, .3, 500), 60.0, 1); fight_music(62.6, 68.2, .9, 38); fight_music(68.2, 78.1, 1.2, 40)
for m in (52, 56, 59): add(mus, horn(m, 1.6, .3), 68.25, 1)
stop(78.1, .05, .8); add(mus, boom(1.0), 78.2, 1)
for i, m in enumerate([62, 66, 69]): add(mus, horn(m - 12, 1.2, .3), 79.0 + i * .25, 1)
# stables (89.6–100.4): light folk plucks, flood swell
for k in range(16): add(mus, harp([62, 64, 66, 69][k % 4], 1.6, .3), 89.8 + k * .3, .7)
for k in range(12): add(mus, pizz([50, 57][k % 2], .5), 95.6 + k * .3, .6)
# montage (100.4–113.4): driving ostinato that builds, a ping per marker
for k in range(int(12.8 / (FB / 2))):
    tm = 100.6 + k * FB / 2; add(mus, frame_drum(.25 + .25 * k / 40, k % 4 == 0), tm, 1, .1); 
    if k % 4 == 0: add(mus, horn([50, 53, 55, 57][(k // 4) % 4], FB * 1.8, .22), tm, 1)
for i, m0 in enumerate(MONT): add(fol, celesta(81 + [0, 2, 4, 7, 9, 12, 14, 16][i], 1.4, .55), m0, 1, -.5 + i * .14)
# cerberus (113.4–132.4)
for m in (33, 40): add(mus, strings(m, 8.4, .32, 400), 113.4, 1)
for m in (57, 58, 62): add(mus, choir(m, 8.0, .12, 'o'), 114.0, 1)
fight_music(122.0, 130.6, 1.25, 36); stop(130.6, .05, .9); add(mus, boom(1.1), 130.7, 1)
for i, m in enumerate([60, 64, 67, 72]): add(mus, horn(m - 12, 1.5, .34), 131.6 + i * .2, 1)
# wedding / final (137.2–157.8)
add(mus, celesta(84, 3, .8), 137.4, 1); add(mus, celesta(88, 3, .6), 137.47, 1); add(mus, celesta(91, 3, .5), 137.54, 1)
for m, p in ((62, -.3), (66, 0), (69, .3), (74, 0)): add(mus, choir(m, 9.0, .16, 'a'), 137.6, 1, p)
for k in range(24): add(mus, harp([62, 66, 69, 74, 73, 69, 66, 64][k % 8], 2.4, .3), 138.0 + k * .38, .6)
for i, m in enumerate([52, 51, 50, 49]): add(mus, horn(m - 12, .55 if i < 3 else 1.2, .32), T['hera'] + .4 + i * .42, 1)   # "wah-wah" sting for the mother-in-law
for m, p in ((62, -.3), (66, 0), (69, .3)): add(mus, choir(m, 6.5, .14, 'a'), 150.0, 1, p)
add(mus, bell(50, .6, 6), T['title'], 1)

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
for kind, a, b, g in [('swamp', 0, 10.8, 1), ('air', 10.8, 22.8, 1), ('hall', 22.8, 33.4, 1), ('wind', 33.4, 54.4, 1), ('hall', 54.4, 60, 1), ('swamp', 60, 84.4, 1), ('hall', 84.4, 89.6, 1), ('farm', 89.6, 100.4, 1), ('room', 100.4, 113.4, 1), ('under', 113.4, 132.4, 1), ('hall', 132.4, 137.2, 1), ('air', 137.2, 157.8, 1)]:
    bed(kind, a, b, g)

# ================= FOLEY: hits from the fight lists =================
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
for name, hits in FIGHTS.items():
    for h in hits:
        k, at = h['k'], h['t']
        if k.startswith('slash'): add(fol, X.whoosh(.18, .8), at - .1, .6, .2); add(fol, clang(.9) if h.get('miss') else chop(.9), at, .8, .1)
        elif k in ('punch', 'punch2', 'kick'): add(fol, X.whoosh(.12, .5), at - .08, .4); add(fol, punch(1), at, .9)
        elif k in ('grab', 'squeeze'): add(fol, punch(.7), at, .7); add(fol, X.creak(.4), at + .02, .4)
        elif k == 'fire': add(fol, flame(.6, .9), at - .05, .8, -.2); add(fol, hiss(.5, .8), at + .05, .6)
        if h.get('crit'): add(fol, X.thump(.8, 60), at, .8)
        if h.get('fin'): add(fol, boom(1.1), at, 1)
# monsters
for at in (34.6, 38.3): add(fol, roar(1.2, 1, 85), at, .9, .2)
for at in (40.0, 44.0, 46.0): add(fol, roar(.8, .5, 110), at, .6, .2)
add(fol, roar(1.6, .7, 60), 47.5, .7)
add(fol, hiss(1.4), 60.8, 1); add(fol, X.rumble(2.0, 1), 60.4, .7)
for at in (2.3, 5.3, 65.6, 67.1): t = tt(.5); add(fol, lp(rng.standard_normal(len(t)), 600) * np.exp(-t / .12) * .6 * (1 + np.sin(2 * np.pi * 14 * t)), at, .8)   # regrow squelch
add(fol, X.whoosh(.8, 1), T['boulder'] - .8, .7); add(fol, boom(1.0), T['boulder'], 1)
add(fol, X.rumble(2.5, 1), T['cerberusRise'] - 1.5, .9); add(fol, roar(1.8, 1, 55), T['cerberusRise'], 1)
for at in T['breath']: add(fol, roar(.5, .6, 70), at - .25, .7); add(fol, flame(1.0, 1.2), at, 1, .2)
# palace / jar / stamps / flood
add(fol, X.thump(.5, 140), T['jarDive1'] + .45, .7); add(fol, X.clack(1.4, .7), T['jarDive1'] + .5, .7)
add(fol, X.thump(.5, 140), T['jarDive2'] + .45, .7); add(fol, X.clack(1.4, .7), T['jarDive2'] + .5, .7)
for at in (T['stamp1'], T['stamp2']): add(fol, X.thump(1.0, 90), at, 1); add(fol, X.clack(.8, .8), at + .01, .7)
t = tt(3.0); add(fol, lp(rng.standard_normal(len(t)), 900) * np.sin(np.pi * np.clip(t / 3, 0, 1)) ** .5 * .7, T['flood'], 1)
for k in range(5): add(fol, punch(.6), 92.7 + k * .33, .6)   # pick strikes on the dam
add(fol, X.crash(.6), T['flood'] - .05, .7)
t = tt(1.2); add(fol, (bp(rng.standard_normal(len(t)), 400, 4000) * np.exp(-t / .4)) * .4, T['curse'], .8)   # curse swirl
# UI
def chime_up(v=.4): return chime_ui(v)
for at in (T['statusHera'], T['questIn'], T['peltDrop'] + .3, T['iolaus'] + .4, 137.4): add(fol, chime_up(.45), at, 1)
for c in S['CHAPTERS']: add(fol, bell(74, .25, 2.5), c['t'] + .2, 1)
add(fol, chime_ui(.4), T['hera'] + .3, 1)
# footsteps
def steps(a, b, rate=4, v=.35):
    k = 0
    while a + k / rate < b: add(fol, X.step(v), a + k / rate, .7, rng.uniform(-.2, .2)); k += 1
steps(23.2, 26.8); steps(33.4, 35.2); steps(40.2, 41.0, 5); steps(54.4, 56.8, 3.5, .45); steps(61.6, 63.4); steps(68.2, 69.4, 5, .3); steps(89.8, 92.4); steps(114.2, 117.0); steps(132.4, 134.8)

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
