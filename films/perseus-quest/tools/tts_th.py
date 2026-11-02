"""Thai guide voice with espeak-ng (offline, via the espeakng-loader wheel).
usage: python tts_th.py lines.json outdir      lines = [{id, text, rate?, pitch?, voice?}]
Writes <id>.wav (22.05 kHz mono) and dur.json. A timing guide only: replace with a real recording (see VOICE_SCRIPT.md)."""
import ctypes, json, sys, os, wave, struct
import espeakng_loader as L
lib = ctypes.CDLL(L.get_library_path())
data = L.get_data_path()
SYNTH_CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
buf = []
@SYNTH_CB
def cb(wav, n, ev):
    if wav and n > 0: buf.extend(wav[:n])
    return 0
sr = lib.espeak_Initialize(1, 0, data.encode(), 0)
lib.espeak_SetSynthCallback(cb)
lines = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
durs = {}
for ln in lines:
    buf.clear()
    lib.espeak_SetVoiceByName((ln.get('voice') or 'th').encode())
    lib.espeak_SetParameter(1, int(ln.get('rate', 150)), 0)   # espeakRATE
    lib.espeak_SetParameter(3, int(ln.get('pitch', 45)), 0)   # espeakPITCH
    t = ln['text'].encode('utf-8')
    lib.espeak_Synth(t, len(t) + 1, 0, 0, 0, 0x01, None, None)   # espeakCHARS_UTF8
    lib.espeak_Synchronize()
    th = 300
    i0 = next((i for i, v in enumerate(buf) if abs(v) > th), 0); i1 = len(buf) - next((i for i, v in enumerate(reversed(buf)) if abs(v) > th), 0)
    i0 = max(0, i0 - int(sr * .02)); i1 = min(len(buf), i1 + int(sr * .08)); buf[:] = buf[i0:i1]
    with wave.open(os.path.join(out, ln['id'] + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(struct.pack('<%dh' % len(buf), *buf))
    durs[ln['id']] = round(len(buf) / sr, 3)
    print(ln['id'], durs[ln['id']])
json.dump(durs, open(os.path.join(out, 'dur.json'), 'w'), indent=1)
