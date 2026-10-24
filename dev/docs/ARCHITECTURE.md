# Architecture reference

Read only the section you need. Line numbers drift, so `grep -n` for names.

## 1. How the page is built

```
git show 6c09a24:index.html   (original game: <script> with the base game + const VOICES={...})
   → build.py patch() edits    (small text replacements in the base script; each anchor must match once)
   → + <script>"use strict"; dev/ext/*.js concatenated in filename order</script>
   → VOICES line copied from the current ../index.html (so clips are never lost)
   → ../index.html (--write), plus dev/game.js (patched base script, voices stripped) and dev/ext.js for the harness
```
- `build.py` patches cover:
  - the Grimmaw victory split for the twin betrayal;
  - pact-route hooks;
  - `twPlayerHitHook` in `playerHit`;
  - Shayan's block becoming a fireball;
  - Full Counter numbers and `melee:true` tags on base melee attacks;
  - HP constants, hint text and the parry no-blink;
  - the mech phase III cut and the 2× chant timing.
- Base-game globals are plain functions or `const` objects; the extension reassigns functions to wrap them.

## 2. Base game (dev/game.js), the names you will need

- **State:**
  - `Game` holds the current state: `state` ('title','play','cut','paused','dead','end'), `flags`, `script`, `dlg`, `wait`, `banner`, `subtitle`, `letterTo`, `timeScale`, `slowT`, `fxUpd[]`, `dmgNums[]`, `arena`, `boss`, `mech`, `mira`, `hamza`.
  - `Player` is the player object (x, y, z, vx, vz, f, ang, anim, hp, maxHp, inv, hurt, dash, atk, sp, counter, …).
  - `ALI()` means the player is Ali (`Game.flags.ali`).
- **Levels:** `LEVELDEF[key]()` builds a level and `L` is the current one. Use `loadLevel(key,opts)`, `resetPlayer({x,z},keepHP)`, `newGame()`, `toTitle()`, `respawn()`, `unstuck()`.
- **Story:** `SCR` (Shayan) and `SCRA` (Ali) hold named generator scenes; `SCR_BASE` is the original. Cutscene helpers:
  - `run(gen)`, `step()`, `say(who,text,ex)`, `choose([{t}])`, `wait(s)`;
  - `tween(obj,props,dur,ease)`, `cineSet(px,py,pz,lx,ly,lz)`, `cineTo([p],[l],dur)`;
  - `fadeOut()`, `fadeIn()`, `evaCard(lines,dur,style)`, `card(title,sub)`.
- **Combat:**
  - `playerHit(dmg,sx,sz,opt)` returns 'none', 'parry', 'block' or 'hit'. `opt` takes `melee`, `heavy`, `pierce`, `unblockable` and `onParry`.
  - Also `hurtPlayer`, `startAtk(n)`, `meleeHits(...)`, `fireBeam(big,quiet,o)`, and `spawnProj(o)` (projectiles go in `BOLTS`).
  - Ali has `aliGetsuga`, `aliUltimate` (Q, a time-stop cutscene) and `aliTeleport`. Shayan's Q is `specialAttack` (Heavenly Drill chant).
- **Bosses:**
  - **Grimmaw:** a state machine; see `updateBoss`, `damageBoss`, `stagger(b,t)` and `Game.boss`.
  - **Nathan:** `NB`, `nbPattern(k)`, `NB_POOL`, `nbDamage`, `nbBoost`, `nbLaser`, `NB_PHASES`, `NB_CINE`, `nbFinale`.
  - **Hamza mech fight:** `Game.mech`, `NAT`, `startMechPhase`, `mechDamage`, `mechPhaseEnd`, `soulburn`, `cosmicBlade`, `blackHoleFinale`, `HZ_HP`.
- **Rendering:**
  - `Sprite3D(w,h)` holds a canvas texture redrawn every frame with `draw(fn)`; all instances are in `SPRITES`.
  - Character draw functions: `drawShayanHD`, `drawAliHD`, `drawMiraHD`, `drawHamzaFairy`, `drawGrimmawHD`, `drawCaotanHD`, `drawOmarHD`, `drawNathanPilot`, `drawVillagerHD`, called as `fn(c,cx,by,f,state)`.
  - Portraits come from `portrait(who,ex)`, a 56×56 canvas.
  - Other: `drawSprites`, `drawUI`, `drawHUD`, `updateCamera`, `Cam` (`cine`, `focus`, `look`, `zoom`), and `grade.uniforms` (`flash`, `flashCol`, `tint`, `imp`, `ab`).
- **Effects:** `FX` (`spawn`, `burst`, `spark`, `ring`, `arc`, `cut`, `marker`, `line`, `ash`, `flash`, `hitstop`), `shake(n)`, `impactFrame(seq)`, `Sound.sfx(name)`, `Sound.play(music)`, `Voice.play(who,text)`, `Voice.bark(key)`.
- **Input:** `KEYMAP` maps key codes to actions; `press(a)` / `release(a)` update `held[a]`, `hit[a]` is a per-frame edge, and `consume(a)` reads it. Left click is attack, right click is block.

## 3. Extension files (dev/ext)

| File | Contents |
|---|---|
| 00_core | `TW` state: `TW.fight` (current fight: `kind`, `lock`, `pre()`, `onHurt()`, `respawn()`, `pool()`), `TW.foes` (`twMake`), `TW.allies`, `TW.hz` (hazards via `twHz({upd(dt,play),kill})`). Hazards: `twBlast`, `twBeam` (a function `ang` makes it a jumpable spinning beam), `twWave`, `twZone`, `twPull`, `twThrow`, `twBolt`/`twAimBolt`. Also `twHitP(dmg,x,z,{ub,melee,heavy,pierce,onParry})`, `twHurt(T,d,src)`, `twBark`, `twGlint`, `twSp(T)` (speed multiplier), `twUpdateFoe` (AI loop), `drawCaotanBoss` (glasses push-up, `noGlasses`), `drawOmarBoss` |
| 01_hud | boss bars (`twBarFor`, `twDrawBars`), overlays (dark, spotlight, dating sim, sentence, hourglass), cut-ins, `twBig(text,opts)` |
| 02_shsprite | new Shayan sprite: 8-direction atlas and portrait. The old drawing is the fallback until images load; world sprites are scaled to 0.8. Regenerate with `assets/shayan/make_sprite_module.py` |
| 05_fixes | `twSweep`, which clears leftover cutscene meshes on retry, title or new game |
| 06_combat | god mode (`TW.god`, key 0) and one-hit kill (`TW.otk`, key -); the melee parry hook (window 0.26s from `twParryClock()`; Ali's guard always parries); Full Counter, mini Judgement Cut, fireballs |
| 07_allies | AI allies: Caotan, Omar, AI Ali (movement, hits, down and revive, bars) |
| 08_aim | mouse aim for swings, beams, Getsugas and fireballs |
| 09_parry | `twComboStart/Hit/End`, `twSlash`, `twBlinkTo`; glint counters only show when `T.showN` is set |
| 10/11_caotan | Caotan's kit: `TWK.caotan.*` (11 overrides glint1, glint2, tsun and letters), the dating-sim limit cut (wrong answer means death), Megane Supernova (×10) |
| 20/21_omar | Omar's kit: `TWK.omar.*`; `blinkcut` is the front and back combo |
| 30_solo | solo betrayal fights, phase HP `TW_HP`, phase cutscenes |
| 40_story | gate fight, the DECISION, party setup, ally lines during Grimmaw |
| 50_hamza | Giant Hamza fight (`HZG`, `HZG_POOL`) and `twTwinsTurn` (Ali arrives; the co-op choice is here) |
| 51_duo + 56_duo2 | duo fight (`twDuoStart`, `DUO`, `DUO_POOL`, limit cuts `waltz`/`fusion`), the Getsuga clash mash (phase 1→2) and Caotan's Domain Expansion QTE (2→3) |
| 55_combos | combos for Grimmaw (`grimRush`), Nathan (`nbSaberCombo`, `nbQuickdraw`), Giant Hamza (`HZG.combo`) and the duo (`DUO.tagTeam`); shared duo HP (`DUO_SHARED_HP`) |
| 60_coop | co-op lobby (two links), video mode (the host streams the canvas; the guest sends inputs), remote Ali, revives (10 hits), both-down Ready, guest boot |
| 62_coopsync | low-latency mode: `NS`. Covers the host snapshot every 50ms, mirroring of scene objects, forwarded FX/sfx/voice/screen events, guest hits sent to the host, and the guest's Q ultimate freezing the twins on the host |
| 70/71_mech | the 3D phase of the mech fight; half HP, no title card |
| 85_progress | timeline save `TWS` (localStorage `msTimeline`), `TL` nodes, `twMark(id)`, `twWarp(id)` |
| 86/87/88 | timeline UI, Esc opens the timeline, save keys (`twSaveKey`/`twReadKey`, top right of the timeline; asked on new game) |
| 90/91_paul | Paul fight. 90 is the base (arena, party `pfMember`, telegraphs `pfCircle`/`pfLine`, AI solver `pfSolve`, `pfPlayer`, UI). 91 is the current raid: phases `pfQ1..pfQ4`, mechanics (`pfInOut`, `pfStackWith`, `pfSpreadOnMe`, `pfPassage`, `pfFirewalls`, `pfGaze`, `pfTowers`, `pfBugs`, `pfDoomStart`, `pfForcePush`, `pfExaflares`, memes), raises ×3, white punch ring, `pfPar` to run mechanics in parallel |
| 95_finale | Paul intro and finale cutscenes |

## 4. Story routes and timeline node ids

- **Shayan:** `sh_twins` → `sh_dec` (THE DECISION), then one of three branches:
  - `sh_omar` → `sh_omar_g` (Grimmaw with Omar) → `sh_omar_f` (Omar betrays you, solo) → `sh_hamza` (mech fight);
  - `sh_cao` → `sh_cao_g` → `sh_cao_f` → `sh_hamza`;
  - `sh_both` → `sh_both_g` → `sh_both_f` (Giant Hamza) → `sh_duo` (duo fight).
- **Ali:** `al_twins` → `al_dec`, then:
  - `al_omar` or `al_cao` → its Grimmaw node → its betrayal node → `al_nathan`;
  - `al_both` → `al_both_g` → `al_nathan_both`.
- **Other:** `sh_nathan` (Oddities tab) and `paul` (Paul's raid; opens once everything is cleared or with key 9).
- Paul stands in the village and opens the timeline. Esc opens it from anywhere in gameplay.

## 5. Co-op in one paragraph

- **Lobby:** the host chooses "Yes" at Ali's arrival in the duo fight. The lobby creates a PeerJS id `msbell-coop-CODE` and shows two links: `?join=CODE` (low-latency) and `?join=CODE&mode=video`.
- **Messages:**
  - Guest to host: `hello{mode}`, `gs` (Ali state, 30 Hz), `p` (button presses for revive and mash), `hit{id,d}`, `ult{on}`, `ready`, `leave`.
  - Host to guest: `init`, `sn` (snapshot), `hurt`, `parry`, `tp`, `st` (revive/ready status), `end`.
- **Host:**
  - The host owns damage, HP, cutscenes and the twins. Remote Ali on the host is `TW.allies` with `remote:true`.
  - If the friend leaves, AI Ali takes over and the room stays open for a rejoin until the duo fight ends.
- **Tests:** two harness instances are joined by an in-memory pipe in `t_sync.js`.

## 6. Voices

- `build_voices.py` scans `say(...)`, `twBark(...)`, `choose` options, `[who,text]` pairs, `CAO_VN`, `ALLY_BARK`/`ALLY_HURT`, Omar's monologue `lines` and Paul's `rant`.
- The speaker must be a literal, or one of `H`/`HERO()`/`A.who`/`T.who`, which map to known casts.
- The voice table is the `CAST` dict; pronunciations are in `FIXES`; `FORCE` re-renders a line with a filter (Shayan's chant at `atempo=2`).
- Rendering speed is about 4 lines a minute with `--jobs 4`.
- Setup is in `KOKORO_TTS_HANDOFF.md`.

## 7. Testing (from dev/, after `python3 build.py`)

| Test | What it checks | Time |
|---|---|---|
| `REAL=1 ROUTE=shayan\|ali CH=0\|1\|2 node t_full2.js ext.js` | full story route with a bot (god mode); prints `ERRORS n` and the timeline marks | 5–9 min |
| `REAL=1 node t_warp.js ext.js` | every timeline node warps into gameplay | 3 min |
| `REAL=1 node t_paul10.js ext.js` (`IDLE=1`, `GOD=1`, `ROUTE=ali`) | Paul raid with a human-speed bot; deaths, raises, finish | 3–4 min |
| `PARRY=1 REAL=1 node t_atk.js ext.js` | every new boss attack and combo, and whether perfect parries stun | 3 min |
| `REAL=1 node t_coop.js ext.js` | video-mode host logic: remote Ali, revives, ready, leave | 1 min |
| `NOHOST=1 SECS=40 ULT=1 node t_sync.js ext.js` | low-latency co-op between two game instances | 2 min |
| `t_key`, `t_sha`, `t_esc`, `t_esc2`, `t_aim`, `t_ui` | save keys, sprite paths, Esc timeline, mouse aim, timeline UI | <1 min each |

- `REAL=1` uses real three.js objects; without it, a faster fake THREE is used.
- The harness drives the game with fake timers: `setTimeout` is a no-op, `Image` never loads, and DOM calls are mocks.

**Release check** (both page scripts must parse):
```bash
python3 - <<'EOF'
import re,subprocess; s=open('../index.html',encoding='utf8').read()
for i,c in enumerate(re.findall(r'<script>(.*?)</script>',s,re.S)):
    open(f'/tmp/chk{i}.js','w').write(c); print(i, subprocess.run(['node','--check',f'/tmp/chk{i}.js']).returncode)
EOF
```

## 8. Known limits and open ideas

- Co-op has only been tested in the two-instance harness, not over real networks. Peers use the public PeerJS broker plus STUN, with no TURN server.
- In low-latency co-op, short-lived `Sprite3D` effects (afterimages) are not mirrored; meshes, FX, sounds and screen state are.
- The new Shayan art is about 60px tall in a 64px cell and is drawn at 0.8 scale in the world. Unused animations in `assets/shayan/sheets`: walk, Basic2 and Basic3 kicks.
- The page is about 27 MB, mostly voice clips.
