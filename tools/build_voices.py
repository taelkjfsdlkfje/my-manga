#!/usr/bin/env python3
"""Voice builder for The Moonsinger's Bell (Kokoro TTS), per KOKORO_TTS_HANDOFF.md.
Scans index.html for voiced lines, renders the ones missing from VOICES with Kokoro,
and re-embeds VOICES (existing clips are kept; nothing already voiced is re-rendered).

  python3 build_voices.py index.html --dry-run      # list lines that would be rendered
  python3 build_voices.py index.html [--jobs N]     # render missing lines and embed
"""
import re, sys, os, json, base64, subprocess, tempfile, concurrent.futures as cf

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'voice_cache')
MODEL = os.environ.get('KOKORO_MODEL', os.path.join(HERE, 'tts', 'kokoro-v1.0.onnx'))
VOICESBIN = os.environ.get('KOKORO_VOICES', os.path.join(HERE, 'tts', 'voices-v1.0.bin'))
SR = 24000
CAST = {  # id: (voice, speed, pitch, extra filter)
  'shayan': ('am_michael', 1.0, 1.0, None), 'mira': ('af_heart', 1.02, 1.0, None), 'miraold': ('af_heart', .96, .94, None),
  'ali': ('am_onyx', .98, .94, 'aecho=0.8:0.3:30:0.12'), 'aliold': ('am_onyx', .9, .86, None), 'hamza': ('am_puck', 1.0, 1.32, None),
  'hamzadeep': ('am_onyx', .72, .58, 'aecho=0.8:0.75:140:0.45,aecho=0.6:0.5:400:0.3'),
  'nathan': ('am_adam', 1.0, .97, 'highpass=f=160,lowpass=f=5600,aecho=0.8:0.35:35:0.18'), 'nathanraw': ('am_adam', .9, .97, None),
  'grimmaw': ('am_onyx', .9, .78, 'aecho=0.8:0.55:70:0.28'), 'hound': ('am_fenrir', 1.05, .84, 'aecho=0.8:0.5:40:0.2'),
  'caotan': ('am_liam', 1.06, 1.0, None), 'omar': ('bm_lewis', .9, .86, 'aecho=0.8:0.4:60:0.25'),
  'caomar': ('bm_lewis', 1.0, .92, 'aecho=0.8:0.5:25:0.35,aecho=0.7:0.4:60:0.2'),
  'elder': ('bm_george', .9, .96, None), 'baker': ('bf_isabella', 1.0, 1.0, None), 'kid': ('am_puck', 1.05, 1.28, None),
  'kid14': ('am_puck', 1.05, 1.3, None), 'kids': ('am_puck', 1.08, 1.34, 'aecho=0.8:0.7:23:0.6,aecho=0.8:0.6:47:0.5'),
  'babies': ('am_puck', 1.1, 1.45, 'aecho=0.8:0.7:19:0.6,aecho=0.8:0.6:41:0.5,aecho=0.7:0.5:67:0.4'),
  'villagerm': ('am_eric', 1.0, 1.0, None), 'villagerf': ('af_sarah', 1.0, 1.0, None), 'paul': ('am_liam', .95, .9, 'lowpass=f=6000'),
  '': ('bf_emma', .95, 1.0, None)}
FIXES = [('Itadakimasu.', 'Ee-tah-dah-kee-mahss.'), ('GG fucking EZ.', 'G. G. Fucking. E. Z.'), ('Getsuga Tenshou', 'Get-sue-gah. Ten-show'),
  ('Getsuga... Jujishou', 'Get-sue-gah. Joo-jee-show'), ('Getsuga... TENSHOU', 'Get-sue-gah. TEN-SHOW'), ('GETSUGA', 'GET-SUE-GAH'), ('TENSHOU', 'TEN-SHOW'), ('Jujishou', 'Joo-jee-show'), ('...', ', '),
  ('Za Warudo', 'Zah Wah-roo-doh'), ('Judgement Cut', 'Judgement. Cut'), ('GG', 'G. G.'), ('Shayan Saqib', 'Shayaan Saakib'), ('Shayan', 'Shayaan'),
  ('Yoshi-P', 'Yoshi P'), ('HTML', 'H T M L'), ('AFK', 'A F K'), ('DPS', 'D P S'), ('Uwu', 'Oo-woo'), ('uwu', 'oo-woo'), ('Ara ara', 'Ah-rah ah-rah'),
  ('>///<', ''), ('♡', ''), ('✦', ''), ('☆', ''), ('♥', ''), ('*', ''), ('Kyaa', 'Kyah'), ('KYUN', 'kyoon'), ('Moe moe', 'Moh-eh moh-eh'), ('Senpai', 'Sen-pie'), ('senpai', 'sen-pie')]

def vhash(s):
    h = 5381
    for ch in s:
        h = ((h * 33) ^ ord(ch)) & 0xffffffff
    if h == 0: return '0'
    d = '0123456789abcdefghijklmnopqrstuvwxyz'; o = ''
    while h: h, r = divmod(h, 36); o = d[r] + o
    return o

STR = r'"((?:[^"\\]|\\.)*)"'
def unesc(s): return re.sub(r'\\(.)', lambda m: {'n': '\n', 't': '\t'}.get(m.group(1), m.group(1)), s)
def call_args(src, i):
    """src[i] == '(' ; return the text up to the matching ')'."""
    depth, j, q = 0, i, None
    while j < len(src):
        c = src[j]
        if q:
            if c == '\\': j += 2; continue
            if c == q: q = None
        elif c in '"\'`': q = c
        elif c in '([{': depth += 1
        elif c in ')]}':
            depth -= 1
            if depth == 0: return src[i + 1:j]
        j += 1
    return ''
def split_first(a):
    depth, q = 0, None
    for k, c in enumerate(a):
        if q:
            if c == '\\': continue
            if c == q: q = None
        elif c in '"\'`': q = c
        elif c in '([{': depth += 1
        elif c in ')]}': depth -= 1
        elif c == ',' and depth == 0: return a[:k].strip(), a[k + 1:]
    return a.strip(), ''
def who_list(expr):
    m = re.fullmatch(r"""['"](\w*)['"]""", expr)
    if m: return [m.group(1)]
    if expr in ('H', 'HERO()'): return ['shayan', 'ali']
    if expr in ('A.who',): return ['caotan', 'omar', 'ali']
    if expr.endswith('.who') or expr.startswith('lines['): return ['caotan', 'omar']
    return []

def scan(code):
    out = set()
    for m in re.finditer(r'(?<![\w.$])(say|twBark)\(', code):
        args = call_args(code, m.end() - 1); w, rest = split_first(args)
        for who in who_list(w):
            for s in re.findall(STR, rest): out.add((who, unesc(s)))
    for m in re.finditer(r'(?<![\w.$])choose\(', code):
        for s in re.findall(r't:' + STR, call_args(code, m.end() - 1)):
            out.add(('shayan', unesc(s))); out.add(('ali', unesc(s)))
    for m in re.finditer(r"""\[\s*['"](\w*)['"]\s*,\s*""" + STR + r'\s*\]', code):
        out.add((m.group(1), unesc(m.group(2))))
    m = re.search(r'const CAO_VN=\{(.*?)\]\]\]\};', code, re.S)
    if m:
        for s in re.findall(r'\[' + STR + r',\[', m.group(1)): out.add(('caotan', unesc(s)))
    for name in ('ALLY_BARK', 'ALLY_HURT'):
        m = re.search(r'const ' + name + r'=\{(.*?)\]\};', code, re.S)
        if m:
            for who, body in re.findall(r'(\w+):\[(.*?)\]', m.group(1) + ']', re.S):
                for s in re.findall(STR, body): out.add((who, unesc(s)))
    m = re.search(r'const lines=\[("When I was seven.*?)\];', code, re.S)
    if m:
        for s in re.findall(STR, m.group(1)): out.add(('omar', unesc(s)))
    m = re.search(r'const rant=\[(.*?)\];', code, re.S)
    if m:
        for s in re.findall(STR, m.group(1)): out.add(('paul', unesc(s)))
    return {(w, t) for (w, t) in out if w in CAST and re.search(r'[A-Za-z]', t)}

def speak_text(who, text):
    t = text
    for a, b in FIXES: t = t.replace(a, b)
    return re.sub(r'\s+', ' ', t).strip(' ,') or text

_K = None
def render(job):
    global _K
    who, text, key = job
    path = os.path.join(CACHE, key + '.mp3')
    if os.path.exists(path): return key
    if _K is None:
        from kokoro_onnx import Kokoro
        _K = Kokoro(MODEL, VOICESBIN)
    import soundfile as sf
    voice, speed, pitch, extra = CAST[who]
    if text.startswith('Above me no sky') or (who == 'hamza' and text.startswith('Heavenly drill')): speed = 1.5
    lang = 'en-gb' if voice.startswith('b') else 'en-us'
    samples, sr = _K.create(speak_text(who, text), voice=voice, speed=speed, lang=lang)
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, 'a.wav'); sf.write(wav, samples, sr)
        flt = []
        if pitch != 1: flt.append(f'asetrate={SR}*{pitch},aresample={SR},atempo={1 / pitch:.5f}')
        if extra: flt.append(extra)
        flt += ['silenceremove=start_periods=1:start_threshold=-50dB', 'loudnorm=I=-17:TP=-2']
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', ','.join(flt), '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '40k', path + '.tmp.mp3'], check=True)
        os.replace(path + '.tmp.mp3', path)
    return key

def main():
    html = sys.argv[1]; dry = '--dry-run' in sys.argv
    jobs = int(sys.argv[sys.argv.index('--jobs') + 1]) if '--jobs' in sys.argv else 1
    src = open(html, encoding='utf8').read()
    vm = re.search(r'^const VOICES=(\{.*?\});$', src, re.M)
    existing = json.loads(vm.group(1)) if vm else {}
    code = src[:vm.start()] + src[vm.end():] if vm else src
    lines = scan(code)
    want = {vhash(w + '|' + t): (w, t) for (w, t) in lines}
    missing = [(w, t, k) for k, (w, t) in want.items() if k not in existing]
    print(f'{len(lines)} voiced lines found, {len(existing)} already embedded, {len(missing)} to render')
    if dry:
        for w, t, k in sorted(missing): print(f'{w:10s} {k:8s} {t}')
        return
    os.makedirs(CACHE, exist_ok=True)
    done = 0
    with cf.ProcessPoolExecutor(max_workers=jobs) as ex:
        for k in ex.map(render, missing, chunksize=4):
            done += 1
            if done % 25 == 0: print(f'  rendered {done}/{len(missing)}', flush=True)
    merged = dict(existing)
    for w, t, k in missing:
        p = os.path.join(CACHE, k + '.mp3')
        if os.path.exists(p): merged[k] = base64.b64encode(open(p, 'rb').read()).decode()
    line = 'const VOICES=' + json.dumps(merged, separators=(',', ':')) + ';'
    src = src[:vm.start()] + line + src[vm.end():] if vm else src
    open(html, 'w', encoding='utf8').write(src)
    print(f'embedded {len(merged)} clips ({len(line) / 1e6:.1f} MB of voice data)')

if __name__ == '__main__': main()
