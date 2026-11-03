"""Measure every voices/<id>.wav (any sample rate, mono or stereo) and rewrite voices/dur.json."""
import json, os, sys, wave
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'voices')
out = {}
for f in sorted(os.listdir(D)):
    if f.endswith('.wav'):
        with wave.open(os.path.join(D, f)) as w: out[f[:-4]] = round(w.getnframes() / w.getframerate(), 3)
json.dump(out, open(os.path.join(D, 'dur.json'), 'w'), indent=1); print(out)
