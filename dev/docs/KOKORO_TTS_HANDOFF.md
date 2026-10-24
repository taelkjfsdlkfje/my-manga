# The Moonsinger's Bell: Voice-Acting Pipeline (Kokoro TTS)

> **Current layout (newer than this doc):** the source now lives in `dev/` (see `/CLAUDE.md`). Run `bash dev/setup.sh --voices` to install Kokoro and download the models into `dev/tts/`, then `cd dev && python3 build_voices.py ../index.html --jobs 4`. `dev/build.py --write` keeps every clip already in `index.html`, so only new lines are rendered.


Give this file and `build_voices.py` to the AI working on the repo (`taelkjfsdlkfje/my-manga`).

## 1. How voices work in this game

- All voice lines are **pre-rendered offline** with Kokoro TTS. No TTS runs in the browser and nothing calls an API.
- Each line is a small mono MP3, stored base64-encoded inside `index.html` as one big JS object:
  ```js
  const VOICES={"w79dtn":"SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYw...", ...};
  ```
- The key is a hash of `speaker + "|" + exact line text`.
- The game hashes the same string when a line is shown, decodes the MP3 with the Web Audio API and plays it, ducking the music.
- If a key is missing, that line is silent. Nothing breaks.
- The repo only contains the built `index.html`. The game code, the story text and the voice data all live inside that one file, and the build script reads and writes it directly.

## 2. Tools and versions used

| Piece | Version / value |
|---|---|
| TTS engine | Kokoro v1.0 (82M) via `kokoro-onnx` **0.6.1** (Python) |
| Runtime | `onnxruntime` 1.29, `soundfile` 0.14 |
| Model files | `kokoro-v1.0.onnx` (~325 MB, fp32) and `voices-v1.0.bin` (~28 MB) |
| Model download | GitHub release `model-files-v1.0` of `thewh1teagle/kokoro-onnx`: `.../releases/download/model-files-v1.0/kokoro-v1.0.onnx` and `.../voices-v1.0.bin` |
| Audio tools | ffmpeg 6.1 with `libmp3lame` |
| Output format | MP3, mono, 24 kHz, 40 kbps |

`pip install kokoro-onnx==0.6.1 soundfile`. The pip package brings its own espeak-ng phonemizer, and ffmpeg must be on `PATH`.

## 3. The hash (must match exactly)

The game's JS:
```js
function vhash(s){ let h=5381; for(let i=0;i<s.length;i++) h=((h*33)^s.charCodeAt(i))>>>0; return h.toString(36); }
// key = vhash(who + '|' + text)
```
Python equivalent (in `build_voices.py`):
```python
def vhash(s):
    h = 5381
    for ch in s: h = ((h * 33) ^ ord(ch)) & 0xffffffff
    # then base-36, lowercase
```
- `who` is the speaker id (see the cast table). The narrator is the empty string `''`.
- `text` must be **exactly** the string the game passes at runtime, with the same punctuation, `...` and apostrophes. If you change a line's text in the game, its voice must be regenerated, or it goes silent.

## 4. Where voiced lines come from (what the script scans)

1. **Dialogue:** `say('who',"text")` inside the story generators. Played automatically when the dialogue box opens.
2. **Player choices:** `{t:"text",aff:N}` inside `choose([...])`. Spoken by the current hero, Shayan or Ali.
   - The script voices choices as `shayan`. Choices made while playing Ali look up `ali|text`, so they're silent unless you add `ali` versions.
3. **Barks and extra lines:** `['who',"text"]` pairs, for example `BARKS={aliWarn:['ali',"Hit me again..."]}`. They're used by `Voice.bark(id)` and by direct calls such as `Voice.play('hamzadeep',"Itadakimasu.")` or `Voice.overlay('hamza',"Oink oink!",.7)`.
   - Any line played through a direct `Voice.play` / `Voice.overlay` call must also appear somewhere as a `['who',"text"]` pair, or the scanner won't find it.
   - Lines only need to be in a form the scanner matches. A `say('ali', cond ? "A" : "B")` ternary is **not** matched, so write `if(x) yield say('ali',"A"); else yield say('ali',"B");` instead.

Lines whose speaker isn't in the cast table, or that have no letters (e.g. `"..."`), are skipped.

## 5. Cast table (speaker id → Kokoro voice, speed, pitch, extra ffmpeg filter)

| id | Character | Kokoro voice | speed | pitch × | extra filter |
|---|---|---|---|---|---|
| `shayan` | Shayan (hero) | am_michael | 1.0 | 1.0 | none |
| `mira` | Mira | af_heart | 1.02 | 1.0 | none |
| `miraold` | Mira, 20 years later | af_heart | .96 | .94 | none |
| `ali` | Ali the Wanderer | am_onyx | .98 | .94 | `aecho=0.8:0.3:30:0.12` |
| `aliold` | Ali, 20 years later | am_onyx | .9 | .86 | none |
| `hamza` | Hamza (fairy pig) | am_puck | 1.0 | 1.32 | none |
| `hamzadeep` | Hamza, the Endless Hunger | am_onyx | .72 | .58 | `aecho=0.8:0.75:140:0.45,aecho=0.6:0.5:400:0.3` |
| `nathan` | Nathan the Nasty (in mech) | am_adam | 1.0 | .97 | `highpass=f=160,lowpass=f=5600,aecho=0.8:0.35:35:0.18` (cockpit radio) |
| `nathanraw` | Nathan (out of mech) | am_adam | .9 | .97 | none |
| `grimmaw` | Grimmaw, Dog Lord | am_onyx | .9 | .78 | `aecho=0.8:0.55:70:0.28` |
| `hound` | Hound mobs | am_fenrir | 1.05 | .84 | `aecho=0.8:0.5:40:0.2` |
| `caotan` | Caotan Cummaster (twin) | am_liam | 1.06 | 1.0 | none |
| `omar` | Omar the Edge (twin) | bm_lewis | .9 | .86 | `aecho=0.8:0.4:60:0.25` |
| `elder` | Elder Hamid | bm_george | .9 | .96 | none |
| `baker` | Noor the baker | bf_isabella | 1.0 | 1.0 | none |
| `kid` | Rafi (kid) | am_puck | 1.05 | 1.28 | none |
| `kid14` | Shayan the Fourteenth | am_puck | 1.05 | 1.3 | none |
| `kids` | The Twenty (chorus) | am_puck | 1.08 | 1.34 | `aecho=0.8:0.7:23:0.6,aecho=0.8:0.6:47:0.5` |
| `babies` | The Hundred (chorus) | am_puck | 1.1 | 1.45 | `aecho=0.8:0.7:19:0.6,aecho=0.8:0.6:41:0.5,aecho=0.7:0.5:67:0.4` |
| `villagerm` | Male villager | am_eric | 1.0 | 1.0 | none |
| `villagerf` | Female villager | af_sarah | 1.0 | 1.0 | none |
| `paul` | Paul (hooded NPC) | am_liam | .95 | .9 | `lowpass=f=6000` |
| `''` | Narrator | bf_emma | .95 | 1.0 | none |

**Rules**
- Kokoro language is `en-gb` for voices starting with `b` (British) and `en-us` for everything else.
- **Speed override:** any line starting with `Above me no sky`, and Hamza's line starting with `Heavenly drill`, use speed 1.5. These are the fast drill chants.
- **Adding a character:** add a row to `CAST` in the script. Its id must match the `who` used in the game, and the game's `NAMES` table should get a display name.

## 6. Pronunciation fixes (audio only; the hash still uses the original text)

The text sent to Kokoro gets these replacements, in this order:

| Written | Spoken as |
|---|---|
| `Itadakimasu.` | `Ee-tah-dah-kee-mahss.` |
| `GG fucking EZ.` | `G. G. Fucking. E. Z.` |
| `Getsuga Tenshou` | `Get-sue-gah. Ten-show` |
| `Getsuga... Jujishou` | `Get-sue-gah. Joo-jee-show` |
| `Jujishou` | `Joo-jee-show` |
| `...` | `, ` (short pause) |
| `Za Warudo` | `Zah Wah-roo-doh` |
| `Judgement Cut` | `Judgement. Cut` |
| `GG` | `G. G.` |
| `Shayan Saqib` | `Shayaan Saakib` |
| `Shayan` | `Shayaan` |

## 7. Post-processing chain (ffmpeg, per line)

```
[pitch]  asetrate=SR*pitch,aresample=SR,atempo=1/pitch   (only when pitch != 1; shifts pitch, keeps duration)
[extra]  the character's extra filter from the cast table
[clean]  silenceremove=start_periods=1:start_threshold=-50dB   (trim leading silence)
[level]  loudnorm=I=-17:TP=-2                                   (even loudness)
encode:  -ac 1 -ar 24000 -c:a libmp3lame -b:a 40k
```
SR is Kokoro's output sample rate (24000).

## 8. Running it

```bash
# one time
pip install kokoro-onnx==0.6.1 soundfile
mkdir tts   # put kokoro-v1.0.onnx and voices-v1.0.bin here (or set KOKORO_MODEL / KOKORO_VOICES env vars)

# see every line it would voice (speaker, hash, text). Changes nothing
python3 build_voices.py index.html --dry-run

# render missing lines and re-embed all voices into index.html
python3 build_voices.py index.html
```

- Rendered MP3s are cached in `voice_cache/<hash>.mp3`. Only new or changed lines get rendered, so a full rebuild from scratch takes a while but later runs are quick.
- The script **rebuilds the whole `VOICES` object** from the lines it finds. A line removed from the game also drops out of `VOICES`.
- Currently: **629 voiced lines**, about 12.8 MB of base64 voice data. The scanner run on the live `index.html` finds exactly the 629 keys the live game has.

## 9. In-game playback (already in index.html; just for reference)

- `Voice.play(who, text)`: stops the current line and plays this one. Used automatically for `say(...)` and choices.
- `Voice.bark(id)`: plays `BARKS[id]` with a subtitle, unless someone is already talking.
- `Voice.overlay(who, text, vol)`: plays on top of the current line (used for Hamza during Shayan's drill chant).
- `Voice.prewarm()`: decodes all clips in the background after the title screen, so the first line doesn't lag.
- Audio routing: `voiceBus → master`. The music is ducked to 40% while a line plays, and the volume slider and mute button control `master`.

## 10. Checklist for adding new voiced dialogue

1. Write the line as `yield say('who',"Text.");`. Use a literal string, not a ternary or template literal.
2. Make sure `who` is in `CAST`, or add it.
3. Add a pronunciation fix if Kokoro mangles a name.
4. Run `python3 build_voices.py index.html`.
5. Spot-check the new MP3s in `voice_cache/`, then commit `index.html`.
