import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { nunito } from "../fonts";
import { COLORS, WORDS, Word } from "../timeline";

type Group = { words: Word[]; start: number; end: number };

// Group words into short chunks (max 3), breaking at punctuation or segment changes.
const GROUPS: Group[] = (() => {
  const groups: Group[] = [];
  let cur: Word[] = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const next = WORDS[i + 1];
    const punct = /[.,:!?]$/.test(w.text);
    if (!next || punct || cur.length >= 3 || next.segment !== w.segment) {
      groups.push({ words: cur, start: cur[0].start, end: w.end });
      cur = [];
    }
  });
  return groups.map((g, i) => ({ ...g, end: Math.min(g.end + 0.35, groups[i + 1]?.start ?? Infinity) }));
})();

export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const group = GROUPS.find((g) => t >= g.start - 0.03 && t < g.end);
  if (!group) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        bottom: 300,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 26px",
      }}
    >
      {group.words.map((w) => {
        const f = Math.round((w.start - 0.03) * fps);
        if (frame < f) return null;
        const pop = spring({ frame: frame - f, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
        const scale = interpolate(pop, [0, 1], [0.55, 1]);
        const active = t < w.end + 0.05;
        return (
          <span
            key={w.start}
            style={{
              fontFamily: nunito,
              fontWeight: 900,
              fontSize: 104,
              lineHeight: 1.15,
              color: active ? COLORS.yellow : "#ffffff",
              WebkitTextStroke: "16px #111",
              paintOrder: "stroke fill",
              textShadow: "0 8px 18px rgba(0,0,0,0.35)",
              display: "inline-block",
              transform: `scale(${scale})`,
              textTransform: "uppercase",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
