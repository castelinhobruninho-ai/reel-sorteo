import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SCENES } from "../timeline";

// Arrow bouncing upward, pointing at the bio link in the title card.
export const CtaArrow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - SCENES.cta.start;
  if (t < 0.3) return null;
  const appear = interpolate(t, [0.3, 0.7], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const bob = Math.abs(Math.sin(t * Math.PI * 1.6)) * 34;
  return (
    <div style={{ position: "absolute", top: 585, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <svg
        width={130}
        height={176}
        viewBox="0 0 170 230"
        style={{ transform: `translateY(${-bob}px) scale(${appear})`, filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.25))" }}
      >
        <path d="M85 8 L160 98 L112 98 L112 222 L58 222 L58 98 L10 98 Z" fill={COLORS.yellow} stroke="#111" strokeWidth={10} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
