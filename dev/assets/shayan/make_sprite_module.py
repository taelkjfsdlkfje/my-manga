#!/usr/bin/env python3
"""Regenerate ext/02_shsprite.js from sh_sprite_tpl.js + sh_atlas.png/json + sh_ports.png (all in this folder)."""
import base64, os
H = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(os.path.dirname(H))
t = open(os.path.join(H, 'sh_sprite_tpl.js')).read()
t = t.replace('__META__', open(os.path.join(H, 'sh_atlas.json')).read())
t = t.replace('__ATLAS__', base64.b64encode(open(os.path.join(H, 'sh_atlas.png'), 'rb').read()).decode())
t = t.replace('__PORTS__', base64.b64encode(open(os.path.join(H, 'sh_ports.png'), 'rb').read()).decode())
open(os.path.join(D, 'ext', '02_shsprite.js'), 'w').write(t); print('wrote ext/02_shsprite.js', len(t))
