import { ThreeCanvas } from "@remotion/three";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { fontsLoaded } from "./fonts";
import { World } from "./three/World";
import { BEATS, DURATION_S, FPS, VOICE_SEGMENTS, WHOOSHES } from "./timeline";
import { CtaArrow } from "./ui/CtaArrow";
import { Subtitles } from "./ui/Subtitles";
import { TitleCard } from "./ui/TitleCard";

const SFX_VOL = 0.4;
const f = (s: number) => Math.round(s * FPS);

const Sfx: React.FC<{ at: number; src: string; volume?: number; endAt?: number }> = ({ at, src, volume = SFX_VOL, endAt }) => (
  <Sequence from={f(at)} layout="none">
    <Audio src={staticFile(`audio/${src}`)} volume={volume} endAt={endAt} />
  </Sequence>
);

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // Mount the 3D canvas only once fonts are ready (the counter draws text into a canvas texture).
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("fonts for 3D"));
  useEffect(() => {
    fontsLoaded().then(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  const fade = interpolate(frame / FPS, [BEATS.fadeOutStart, DURATION_S], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#eef0f2" }}>
      {ready && (
        <ThreeCanvas width={width} height={height} shadows frameloop="never" gl={{ antialias: false, preserveDrawingBuffer: true }} dpr={1}>
          <World />
        </ThreeCanvas>
      )}
      <TitleCard />
      <CtaArrow />
      <Subtitles />
      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: fade }} />

      {/* Voiceover, re-timed per sentence */}
      {VOICE_SEGMENTS.map((s) => (
        <Sequence key={s.at} from={f(s.at)} layout="none">
          <Audio src={staticFile("audio/voz.mp3")} startFrom={f(s.srcStart)} endAt={f(s.srcEnd)} volume={1} />
        </Sequence>
      ))}

      {/* SFX */}
      {WHOOSHES.map((w) => (
        <Sfx key={w} at={w} src="sfx_whoosh.mp3" />
      ))}
      <Sfx at={BEATS.glitchStart} src="sfx_glitch.mp3" volume={0.45} />
      <Sfx at={BEATS.ding} src="sfx_ding.mp3" />
      <Sfx at={BEATS.counterStart} src="sfx_ticks.mp3" volume={0.35} />
      <Sfx at={BEATS.counterStart + 1.04} src="sfx_ticks.mp3" volume={0.35} endAt={f(BEATS.counterEnd - BEATS.counterStart - 1.04)} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} at={BEATS.giftStart + i * BEATS.giftInterval + 0.33} src="sfx_pop.mp3" endAt={f(0.5)} />
      ))}
    </AbsoluteFill>
  );
};
