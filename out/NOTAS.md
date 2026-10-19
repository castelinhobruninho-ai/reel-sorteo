# Reel "Canal nuevo + sorteo"

- `video_final.mp4`: 1080x1920, 30 fps, 26 s, H.264 + AAC. Voz al 100 % y efectos al ~40 %. **No tiene música** (ver abajo).
- `audio/`
  - `voz_original.mp3`: locución de ElevenLabs (voz "Chelo", modelo eleven_v4), 19,3 s.
  - `voz_editada_26s.wav`: la misma voz cortada en las pausas y ubicada en el tiempo exacto del video.
  - `sfx_*.mp3`: cada efecto suelto (whoosh, glitch, ding, ticks, pop).
  - `sfx_mezcla_26s.wav`: todos los efectos, en su tiempo y al 40 %, listos para superponer.
- `stills/`: un frame por escena.

## Música
El conector de ElevenLabs de esta sesión no genera música y la API directa estaba bloqueada
(no había `ELEVENLABS_API_KEY` en el entorno). Para agregarla, poné una pista instrumental de 26 s
a ~15 % del volumen de la voz, con ducking mientras habla (la voz suena entre 0,3–2,6 s,
3,1–5,6 s, 6,0–7,0 s, 7,6–9,0 s, 10,2–15,2 s, 15,6–19,4 s, 20,2–22,0 s y 22,4–23,9 s).

## Volver a renderizar
```
npm install
npx remotion render src/index.ts Reel out/video_final.mp4 --codec=h264 --audio-codec=aac --gl=angle --concurrency=3
```
El usuario del CTA está en `src/ui/TitleCard.tsx` (`USERNAME`, hoy `@_castelbru`) y los tiempos en `src/timeline.ts`.
