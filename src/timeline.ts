import rawWords from "./words.json";

export const FPS = 30;
export const DURATION_S = 26;
export const DURATION_FRAMES = DURATION_S * FPS;

export const COLORS = {
  white: "#ffffff",
  light: "#eceef0",
  charcoal: "#222222",
  yellow: "#F2C230",
  petrol: "#0f4c4f",
  red: "#e0352b",
  green: "#2fbf71",
};

// Scene boundaries in seconds (driven by the voiceover).
export const SCENES = {
  hook: { start: 0, end: 2.9 },
  deleted: { start: 2.9, end: 7.3 },
  newChannel: { start: 7.3, end: 10.0 },
  giveaway: { start: 10.0, end: 19.9 },
  cta: { start: 19.9, end: DURATION_S },
} as const;
export type SceneId = keyof typeof SCENES;

export const sceneAt = (t: number): SceneId => {
  const ids = Object.keys(SCENES) as SceneId[];
  return ids.find((id) => t < SCENES[id].end) ?? "cta";
};

// The voiceover is split at sentence pauses and re-placed on the timeline
// so each line lands in its scene. srcStart/srcEnd refer to voz.mp3.
export const VOICE_SEGMENTS = [
  { srcStart: 0, srcEnd: 2.32, at: 0.3 },
  { srcStart: 2.32, srcEnd: 4.86, at: 3.1 },
  { srcStart: 4.86, srcEnd: 5.86, at: 6.0 },
  { srcStart: 5.86, srcEnd: 7.24, at: 7.6 },
  { srcStart: 7.24, srcEnd: 12.28, at: 10.2 },
  { srcStart: 12.28, srcEnd: 16.08, at: 15.6 },
  { srcStart: 16.08, srcEnd: 17.84, at: 20.2 },
  { srcStart: 17.84, srcEnd: 19.32, at: 22.4 },
];

export type Word = { text: string; start: number; end: number; segment: number };

export const WORDS: Word[] = (rawWords as { text: string; start: number; end: number }[]).map((w) => {
  const segment = VOICE_SEGMENTS.findIndex((s) => w.start >= s.srcStart && w.start < s.srcEnd);
  const seg = VOICE_SEGMENTS[segment];
  const shift = seg.at - seg.srcStart;
  return { text: w.text, start: w.start + shift, end: w.end + shift, segment };
});

// Animation beats (seconds).
export const BEATS = {
  glitchStart: 4.3,
  glitchEnd: 5.5,
  iconRise: 7.6,
  ding: 8.2,
  counterStart: 10.6,
  counterEnd: 12.7,
  giftStart: 13.5,
  giftInterval: 0.28,
  giftFall: 0.38,
  fadeOutStart: 24.8,
};

export const WHOOSHES = [2.72, 7.12, 9.82, 19.72];
