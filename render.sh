#!/usr/bin/env bash
# Renders out/video_final.mp4, falling back to safer settings if a pass fails.
cd "$(dirname "$0")"
LOG=out/render.log
: > "$LOG"
attempt() {
  echo "=== attempt: $*" >> "$LOG"
  npx remotion render src/index.ts Reel out/video_final.mp4 --codec=h264 --audio-codec=aac --gl=angle --timeout=180000 --crf=18 "$@" >> "$LOG" 2>&1
}
attempt --concurrency=3 && { echo "RESULT ok-1080p" >> "$LOG"; exit 0; }
attempt --concurrency=2 && { echo "RESULT ok-1080p-c2" >> "$LOG"; exit 0; }
attempt --concurrency=2 --scale=0.6667 && { echo "RESULT ok-720p" >> "$LOG"; exit 0; }
echo "RESULT failed" >> "$LOG"; exit 1
