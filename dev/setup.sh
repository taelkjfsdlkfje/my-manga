#!/usr/bin/env bash
# One-time setup for a fresh container. Usage: bash dev/setup.sh [--voices]
#   (no flag)  installs the headless test harness dependency (three@0.147)
#   --voices   also installs Kokoro TTS + ffmpeg check and downloads the model files (~350 MB) into dev/tts
set -e
cd "$(dirname "$0")"
npm install --silent --no-audit --no-fund
echo "harness ready: three $(node -e "console.log(require('./node_modules/three/package.json').version)")"
if [ "$1" = "--voices" ]; then
  pip install -q kokoro-onnx==0.6.1 soundfile
  command -v ffmpeg >/dev/null || echo "WARNING: ffmpeg not found on PATH (needed for voice rendering)"
  mkdir -p tts
  base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
  [ -f tts/kokoro-v1.0.onnx ] || curl -L --fail -o tts/kokoro-v1.0.onnx "$base/kokoro-v1.0.onnx"
  [ -f tts/voices-v1.0.bin ]  || curl -L --fail -o tts/voices-v1.0.bin  "$base/voices-v1.0.bin"
  echo "voices ready: $(ls -la tts | tail -n +2 | wc -l) files in dev/tts"
fi
# make sure the original game commit is available for build.py (shallow clones may lack it)
git -C .. cat-file -e 6c09a248470d7b1071605affab1f55be9079aa80 2>/dev/null || git -C .. fetch -q --depth=1 origin 6c09a248470d7b1071605affab1f55be9079aa80 || true
python3 build.py >/dev/null && node --check ext.js && echo "build OK"
