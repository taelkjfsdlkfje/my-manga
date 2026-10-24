#!/usr/bin/env python3
"""Build: patch the original index.html (from git HEAD) and inject the twins extension.
Also writes game.js (patched main script, voices stripped) + ext.js for the Node harness."""
import subprocess, os, sys, glob
S = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(S)
BASE = '6c09a24'  # the original game, before any extension; every patch below applies to it
def base_html():
    try: return subprocess.check_output(['git', '-C', REPO, 'show', BASE + ':index.html'], stderr=subprocess.DEVNULL).decode('utf8')
    except subprocess.CalledProcessError:
        subprocess.run(['git', '-C', REPO, 'fetch', '-q', '--depth=1', 'origin', BASE])  # shallow clones may not have it yet
        return subprocess.check_output(['git', '-C', REPO, 'show', BASE + ':index.html']).decode('utf8')
src = base_html()

def patch(s, old, new, count=1):
    n = s.count(old)
    if n != count:
        sys.exit(f'patch anchor found {n}x (want {count}): {old[:90]!r}')
    return s.replace(old, new)

# 1) Shayan route: Grimmaw's death -> (betrayal fight) -> the rest of the victory scene
s = src
s = patch(s, """the red light drained from every window.");
    const cage=Game.actors.find(a=>a.kind==='cage'); cage.open=1; Sound.sfx('secret');""",
"""the red light drained from every window.");
    twMarkGrimmaw(); if(twBetrayalPending()){ yield* twBetrayal(); return; }
    yield* SCR.victory2(); },
  *victory2(){ const P=Player;
    const cage=Game.actors.find(a=>a.kind==='cage'); cage.open=1; Sound.sfx('secret');""")
s = patch(s, """    yield* pigEpilogue();
    yield* nathanIntro(); }""", """    if(Game.flags.twinPact){ yield* twPactHamza(); return; }
    yield* pigEpilogue();
    yield* nathanIntro(); }""")
# 2) Ali route
s = patch(s, """as if too embarrassed to look at the others.");
    const cage=""", """as if too embarrassed to look at the others.");
    twMarkGrimmaw(); if(twBetrayalPending()){ yield* twBetrayal(); return; }
    yield* SCR.victory2(); },
  *victory2(){ const P=Player;
    const cage=""")
# 3) the twins react when Ali bisects Hamza
s = patch(s, """yield say('ali',"...GG.");""", """yield say('ali',"...GG."); if(TW.allies.length) yield* twAllyReactHamza();""")
# 4) allies bow out before Nathan's finale
s = patch(s, "function* nbFinale(){ const P=Player, mi=Game.mira;", "function* nbFinale(){ const P=Player, mi=Game.mira; twAllyLeave();")

# ---- combat rework hooks (round 2) ----
import re as _re
s = patch(s, "function playerHit(dmg,sx,sz,opt){ opt=opt||{}; const P=Player; if(Game.state!=='play'||P.inv>0||P.dash>0) return 'none';",
  "function playerHit(dmg,sx,sz,opt){ opt=opt||{}; const P=Player; if(Game.state!=='play'||P.inv>0||P.dash>0) return 'none'; if(typeof twPlayerHitHook==='function'){ const hk=twPlayerHitHook(dmg,sx,sz,opt); if(hk) return hk; }")
s = patch(s, "if(ctl&&consume('block')) P.blockT=0; P.block=ctl&&held.block&&P.dash<=0&&!P.atk;",
  "if(ALI()){ if(ctl&&consume('block')) P.blockT=0; P.block=ctl&&held.block&&P.dash<=0&&!P.atk; } else { P.block=false; if(typeof shFire==='function') shFire(dt,ctl); }")
s = patch(s, "if(a.t>.05&&a.t<.16) meleeHits(P.x,P.z,P.y,1.9,P.ang,1.35,a.n===2?2:1,a.hit);",
  "if(a.t>.05&&a.t<.16) meleeHits(P.x,P.z,P.y,a.big?5.7:1.9,P.ang,a.big?1.6:1.35,a.big?18:(a.n===2?2:1),a.hit);")
s = patch(s, "Math.abs(m.y-y)>1.6||!inArc(m.x,m.z,.3)", "Math.abs(m.y-y)>(rad>4?3.2:1.6)||!inArc(m.x,m.z,.3)")
for a,b in [("const r=playerHit(2,b.x,b.z,{heavy:true,onParry:()=>stagger(b,1.4)});","const r=playerHit(2,b.x,b.z,{heavy:true,melee:true,onParry:()=>stagger(b,1.4)});"),
  ("const r=playerHit(3,b.x,b.z,{heavy:true,onParry:()=>{ stagger(b,1.6); }});","const r=playerHit(3,b.x,b.z,{heavy:true,melee:true,onParry:()=>{ stagger(b,1.6); }});"),
  ("const r=playerHit(2,c.x,c.z,{heavy:true,onParry:()=>{ c.d0=99;","const r=playerHit(2,c.x,c.z,{heavy:true,melee:true,onParry:()=>{ c.d0=99;"),
  ("if(playerHit(2,b.x,b.z,{heavy:true})!=='none') D.hit=true;","if(playerHit(2,b.x,b.z,{heavy:true,melee:true})!=='none') D.hit=true;"),
  ("const r=playerHit(2,m.x,m.z,{onParry:","const r=playerHit(2,m.x,m.z,{melee:true,onParry:"),
  ("playerHit(2,m.x,m.z,{heavy:true,onParry:()=>{ m.state='stun'; m.st=-1;","playerHit(2,m.x,m.z,{heavy:true,melee:true,onParry:()=>{ m.state='stun'; m.st=-1;"),
  ("playerHit(3,NB.x,NB.z,{pierce:true})","playerHit(3,NB.x,NB.z,{pierce:true,melee:true})")]:
    s = patch(s, a, b)
# Grimmaw has more HP when Shayan has fireballs
s = patch(s, "const PHASE_HP=67;", "const PHASE_HP_F=()=>ALI()?67:100;")
s = _re.sub(r'\bPHASE_HP\b(?!_F)', 'PHASE_HP_F()', s)
# control hints: block is now the fireball
s = patch(s, "'Right click  guard, tap right as a hit lands to parry'", "'Right click  fireball, hold 2s for a big one'")
s = patch(s, "'Attack incoming projectiles to deflect them'", "'Attack just before a melee hit lands to parry it'")
s = patch(s, "'Shield: guard, tap as a hit lands to parry'", "'Shield: fireball, hold for a big one'")
s = patch(s, "<b>Right click</b> block, tap just before a hit to parry", "<b>Right click</b> fireball, hold for a big one (Ali: block) · attack just before a melee hit to parry")
s = patch(s, "['Guard / parry','Right click or L  (tap just before a hit)']", "['Fireball / guard','Right click or L  (Shayan: fireball, hold to charge. Ali: guard)']")

# Hamza mech fight: no phase III fight; the black hole finale follows the cosmic blade cutscene directly
s = patch(s, "v.o.look=.5; Game.banner={name:'Phase III',sub:'Oblivion',t:0}; startMechPhase(3); }", "v.o.look=.5; yield* blackHoleFinale(); }")
# Shayan's Heavenly Drill chant plays at double speed
s = patch(s, "const T=Math.max(6,(Voice.cur&&Voice.cur.buffer)?Voice.cur.buffer.duration-.15:8.4);", "const T=Math.max(3,(Voice.cur&&Voice.cur.buffer)?Voice.cur.buffer.duration-.15:4.2);")

# a parry's brief invulnerability no longer blinks the player (it looked like taking damage)
s = patch(s, "!(P.inv>0&&P.inv<5&&P.hurt<=0&&Math.floor(P.t*18)%2)", "!(P.inv>0&&P.inv<5&&P.hurt<=0&&!(P.noBlink>Game.time)&&Math.floor(P.t*18)%2)")
s = patch(s, "Game.slowT=.35; P.inv=.3; P.parryFlash=.3;", "Game.slowT=.35; P.inv=.3; P.noBlink=Game.time+.35; P.parryFlash=.3;")
s = patch(s, "Game.dmgNums.push({x:P.x,y:P.y+2.2,z:P.z,n:'TOO SLOW',t:0,col:'#ff8a9a'}); P.inv=.25;", "Game.dmgNums.push({x:P.x,y:P.y+2.2,z:P.z,n:'TOO SLOW',t:0,col:'#ff8a9a'}); P.inv=.25; P.noBlink=Game.time+.3;")

ext = ''
for f in sorted(glob.glob(os.path.join(S, 'ext', '*.js'))):
    ext += f'// ----- {os.path.basename(f)} -----\n' + open(f, encoding='utf8').read() + '\n'
open(os.path.join(S, 'ext.js'), 'w', encoding='utf8').write('"use strict";\n' + ext)

end = "toTitle(); ui.focus(); requestAnimationFrame(loop);\n</script>"
s = patch(s, end, end + "\n<script>\n\"use strict\";\n" + ext + "</script>")

# harness copy of the main script (voices stripped)
lines = s.split('\n')
start = lines.index('<script>', 120) + 1
stop = next(i for i in range(start, len(lines)) if lines[i] == '</script>')
main = [('const VOICES={};' if l.startswith('const VOICES=') else l) for l in lines[start:stop]]
open(os.path.join(S, 'game.js'), 'w', encoding='utf8').write('\n'.join(main) + '\n')
if '--write' in sys.argv:
    # keep every voice clip already embedded in the published page (build_voices.py only adds new lines)
    out = os.path.join(REPO, 'index.html')
    if os.path.exists(out):
        cur = open(out, encoding='utf8').read(); m = _re.search(r'^const VOICES=\{.*?\};$', cur, _re.M); n = _re.search(r'^const VOICES=\{.*?\};$', s, _re.M)
        if m and n: s = s[:n.start()] + m.group(0) + s[n.end():]
    open(out, 'w', encoding='utf8').write(s)
    print('wrote index.html', len(s))
print('ok', len(ext), 'bytes of extension')
