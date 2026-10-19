import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { anton, mono } from "../fonts";
import { COLORS, SCENES, SceneId, sceneAt } from "../timeline";

export const DATE_LINE = "19 DE OCTUBRE DE 2026";
export const USERNAME = "@_castelbru";

const HEADLINES: Record<SceneId, string[]> = {
  hook: ["¿QUÉ PASÓ?"],
  deleted: ["ME BAJARON", "EL CANAL"],
  newChannel: ["CANAL NUEVO"],
  giveaway: ["5 PRODUCTOS CADA", "100 SEGUIDORES"],
  cta: ["LINK EN MI BIO"],
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const scene = sceneAt(t);
  const since = t - SCENES[scene].start;

  const cardIn = interpolate(t, [0, 0.45], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const textIn = interpolate(since, [0, 0.35], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const lines = HEADLINES[scene];
  const big = lines.length === 1 && lines[0].length <= 12;
  const fontSize = big ? 150 : 118;

  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 70,
        right: 70,
        padding: "34px 40px 40px",
        background: COLORS.charcoal,
        borderRadius: 34,
        boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 6px 16px rgba(0,0,0,0.18)",
        textAlign: "center",
        transform: `translateY(${(1 - cardIn) * -60}px) scale(${0.9 + 0.1 * cardIn})`,
        opacity: cardIn,
      }}
    >
      <div style={{ fontFamily: mono, fontSize: 34, letterSpacing: "0.32em", color: "#bdbdbd", marginBottom: 14 }}>{DATE_LINE}</div>
      <div
        style={{
          fontFamily: anton,
          fontSize,
          lineHeight: 1.04,
          color: COLORS.yellow,
          textShadow: "0 0 26px rgba(242,194,48,0.35)",
          transform: `translateY(${(1 - textIn) * 40}px)`,
          opacity: textIn,
          clipPath: `inset(0 0 ${(1 - textIn) * 100}% 0)`,
        }}
      >
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      {scene === "cta" && (
        <div
          style={{
            fontFamily: mono,
            fontSize: 46,
            letterSpacing: "0.12em",
            color: "#e8e8e8",
            marginTop: 16,
            opacity: interpolate(since, [0.2, 0.6], [0, 1], clamp),
          }}
        >
          {USERNAME}
        </div>
      )}
    </div>
  );
};
