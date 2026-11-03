#!/bin/sh
# Build "Perseus — the quest you can't cancel" (vertical 1080×1920, 30 fps).
#   sh build.sh          picture + sound + mux
#   sh build.sh voice    after dropping your own recordings into voices/ (see VOICE_SCRIPT.md): re-measure, then full build
#   sh build.sh sound    re-mix and re-mux only (keeps out/video.mp4)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
if [ "$1" = voice ]; then "$LIB/.venv/bin/python" "$HERE/tools/voice_dur.py" "$HERE/voices"; fi
node -e "import('$HERE/story.js').then(m=>require('fs').writeFileSync('$HERE/out/story.json',JSON.stringify({DUR:m.DUR,DUR_FILM:m.DUR_FILM,SHOTS:m.SHOTS,T:m.T,VO:m.VO,CHAPTERS:m.CHAPTERS})))"
if [ "$1" != sound ]; then
  node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
fi
"$LIB/.venv/bin/python" "$HERE/mix.py"
node "$HERE/tools/make_srt.mjs"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/perseus-quest.mp4" 30 0
