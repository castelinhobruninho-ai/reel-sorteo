#!/usr/bin/env bash
# Renders one approval still per scene into out/stills/
set -e
cd "$(dirname "$0")"
declare -A F=([escena1_hook]=50 [escena2_canal_eliminado]=140 [escena3_canal_nuevo]=270 [escena4_sorteo]=470 [escena5_cta]=660)
for name in "${!F[@]}"; do
  npx remotion still src/index.ts Reel "out/stills/${name}.png" --frame="${F[$name]}" --gl=angle --log=error
done
