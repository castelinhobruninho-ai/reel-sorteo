import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, SMAA, Vignette } from "@react-three/postprocessing";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import type { DepthOfFieldEffect } from "postprocessing";
import * as THREE from "three";
import { BEATS, COLORS, SCENES, sceneAt } from "../timeline";
import { Buildings } from "./Buildings";
import { ChatIcon } from "./ChatIcon";
import { Counter } from "./Counter";
import { Gift } from "./Gift";
import { Particles } from "./Particles";
import { Phone } from "./Phone";

// Each scene lives at its own spot of the miniature set; the camera travels between them.
const STATION_X = { hook: 0, deleted: 0, newChannel: 7, giveaway: 14, cta: 21 } as const;
const BG = "#eef0f2";

const ease = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Per-scene framing: [x offset at scene start, x offset at end, distance start, distance end, height, look-at height]
const FRAMING = {
  hook: [-0.9, -0.2, 11.5, 10.3, 3.6, 1.15],
  deleted: [-0.3, 0.6, 10.0, 9.0, 3.3, 1.35],
  newChannel: [-0.8, 0.5, 11.4, 10.4, 3.6, 1.3],
  giveaway: [-0.9, 0.9, 12.6, 11.6, 3.8, 1.45],
  cta: [0.6, -0.5, 11.0, 12.0, 3.8, 1.85],
} as const;

type Pose = { x: number; d: number; h: number; lookX: number; lookY: number };
const SCENE_IDS = Object.keys(SCENES) as (keyof typeof SCENES)[];

const scenePose = (id: keyof typeof SCENES, t: number): Pose => {
  const { start, end } = SCENES[id];
  const p = interpolate(t, [start, end], [0, 1], clamp);
  const [x0, x1, d0, d1, h, lookY] = FRAMING[id];
  const off = x0 + (x1 - x0) * p;
  return { x: STATION_X[id] + off, d: d0 + (d1 - d0) * p, h, lookX: STATION_X[id] + off * 0.35, lookY };
};

const mix = (a: Pose, b: Pose, k: number): Pose => ({
  x: a.x + (b.x - a.x) * k,
  d: a.d + (b.d - a.d) * k,
  h: a.h + (b.h - a.h) * k,
  lookX: a.lookX + (b.lookX - a.lookX) * k,
  lookY: a.lookY + (b.lookY - a.lookY) * k,
});

// Continuous camera: slow dolly/pan inside a scene, eased travel across each boundary.
const TRANS = 0.7;
export const cameraPose = (t: number): Pose => {
  const cur = sceneAt(t);
  const idx = SCENE_IDS.indexOf(cur);
  const next = SCENE_IDS[idx + 1];
  const prev = SCENE_IDS[idx - 1];
  const { start, end } = SCENES[cur];
  if (next && t > end - TRANS / 2) {
    return mix(scenePose(cur, t), scenePose(next, t), ease(interpolate(t, [end - TRANS / 2, end + TRANS / 2], [0, 1], clamp)));
  }
  if (prev && t < start + TRANS / 2) {
    return mix(scenePose(prev, t), scenePose(cur, t), ease(interpolate(t, [start - TRANS / 2, start + TRANS / 2], [0, 1], clamp)));
  }
  return scenePose(cur, t);
};

const FocusUpdater: React.FC<{ dofRef: React.RefObject<DepthOfFieldEffect>; x: number; y: number }> = ({ dofRef, x, y }) => {
  useLayoutEffect(() => {
    dofRef.current?.target?.set(x, y, 0);
  });
  return null;
};

// frameloop="never": render exactly once per video frame, after all scene updates are committed.
const Renderer: React.FC = () => {
  const frame = useCurrentFrame();
  const advance = useThree((s) => s.advance);
  useLayoutEffect(() => {
    advance(frame * 1000);
  }, [frame, advance]);
  return null;
};

const CameraRig: React.FC = () => {
  const t = useT();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const p = cameraPose(t);
  useLayoutEffect(() => {
    camera.fov = 34;
    camera.position.set(p.x, p.h + 0.15 * Math.sin(t * 0.6), p.d);
    camera.lookAt(p.lookX, p.lookY, 0);
    camera.updateProjectionMatrix();
  });
  return null;
};

const HookAndDeleted: React.FC<{ t: number }> = ({ t }) => {
  const g = interpolate(t, [BEATS.glitchStart, BEATS.glitchEnd], [0, 1], clamp);
  const glitching = g > 0 && g < 1;
  const jitter = glitching ? (random(`j${Math.floor(t * 30)}`) - 0.5) * 0.12 : 0;
  const flicker = glitching && random(`f${Math.floor(t * 30)}`) > 0.7;
  const red = interpolate(g, [0.15, 0.6], [0, 1], clamp);
  const color = new THREE.Color(COLORS.green).lerp(new THREE.Color(COLORS.red), red);
  const vanish = interpolate(t, [BEATS.glitchEnd, BEATS.glitchEnd + 0.45], [1, 0], clamp);
  const xMark = interpolate(t, [BEATS.glitchEnd + 0.25, BEATS.glitchEnd + 0.6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const screenTint = red > 0.5 && vanish < 1 ? "#fbe9e8" : "#f7f8f9";
  return (
    <group position={[STATION_X.hook, 0, 0]}>
      <Phone rotationY={-0.18} screenTint={screenTint}>
        {vanish > 0 && (
          <group position={[jitter, 0, 0]} scale={0.62 * (0.6 + 0.4 * vanish) * (flicker ? 1.08 : 1)}>
            <ChatIcon color={`#${color.getHexString()}`} opacity={vanish} />
            {glitching && (
              <>
                <group position={[0.07, 0.02, -0.02]}>
                  <ChatIcon color="#00e5ff" opacity={0.45} />
                </group>
                <group position={[-0.07, -0.02, -0.02]}>
                  <ChatIcon color="#ff2a5f" opacity={0.45} />
                </group>
              </>
            )}
          </group>
        )}
        {xMark > 0 && (
          <group scale={xMark * 0.85}>
            <mesh>
              <circleGeometry args={[0.36, 40]} />
              <meshStandardMaterial color={COLORS.red} emissive={COLORS.red} emissiveIntensity={0.4} />
            </mesh>
            {[1, -1].map((d) => (
              <mesh key={d} position={[0, 0, 0.01]} rotation={[0, 0, (d * Math.PI) / 4]}>
                <planeGeometry args={[0.42, 0.09]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
        )}
      </Phone>
      {/* red warning light on the floor while glitching */}
      <pointLight position={[0, 1.4, 1.2]} intensity={red * vanish * 6} color={COLORS.red} distance={5} />
    </group>
  );
};

const NewChannel: React.FC<{ t: number; x: number; riseAt: number; showParticles?: boolean }> = ({ t, x, riseAt, showParticles = true }) => {
  const rise = interpolate(t, [riseAt, riseAt + 0.8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const ring = interpolate(t, [riseAt - 0.2, riseAt + 0.3], [0, 1], clamp);
  const y = -0.9 + rise * 2.4;
  return (
    <group position={[x, 0, 0]}>
      {/* pedestal + glowing ring */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.0, 1.08, 0.12, 48]} />
        <meshStandardMaterial color="#f4f5f6" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.125, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={ring}>
        <ringGeometry args={[0.82, 0.92, 64]} />
        <meshBasicMaterial color={COLORS.yellow} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <group position={[0, Math.max(0.2, y) + 0.06 * Math.sin(t * 2.2), 0]} rotation={[0, Math.sin(t * 0.9) * 0.35, 0]} scale={0.95 * Math.min(1, rise * 1.2)}>
        <ChatIcon color={COLORS.yellow} emissive={COLORS.yellow} emissiveIntensity={0.55} dotColor={COLORS.petrol} />
      </group>
      <pointLight position={[0, 1.6, 0.9]} intensity={ring * 5} color={COLORS.yellow} distance={6} />
      {showParticles && <Particles t={Math.max(0, t - riseAt + 0.2)} seed={`p${x}`} />}
    </group>
  );
};

const GIFT_COLORS = [
  [COLORS.white, COLORS.yellow],
  [COLORS.petrol, COLORS.yellow],
  [COLORS.yellow, COLORS.petrol],
  [COLORS.petrol, COLORS.yellow],
  [COLORS.white, COLORS.yellow],
] as const;

const Giveaway: React.FC<{ t: number }> = ({ t }) => {
  const c = interpolate(t, [BEATS.counterStart, BEATS.counterEnd], [0, 100], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const value = Math.round(c);
  const hit = interpolate(t, [BEATS.counterEnd, BEATS.counterEnd + 0.15, BEATS.counterEnd + 0.5], [0, 1, 0], clamp);
  const appear = interpolate(t, [SCENES.giveaway.start - 0.2, SCENES.giveaway.start + 0.4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <group position={[STATION_X.giveaway, 0, 0]}>
      <group position={[0, 1.42, -0.6]} scale={appear * (1 + hit * 0.12)}>
        <Counter value={value} glow={hit * 1.5} />
      </group>
      {/* low charcoal base under the counter */}
      <mesh position={[0, 0.17, -0.6]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.34, 0.9]} />
        <meshStandardMaterial color={COLORS.charcoal} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, -0.149]}>
        <planeGeometry args={[3.2, 0.05]} />
        <meshBasicMaterial color={COLORS.yellow} toneMapped={false} />
      </mesh>
      {GIFT_COLORS.map(([body, ribbon], i) => {
        const start = BEATS.giftStart + i * BEATS.giftInterval;
        const p = interpolate(t, [start, start + 0.9], [0, 1], { ...clamp, easing: Easing.bounce });
        if (t < start) return null;
        return (
          <group key={i} position={[(i - 2) * 0.82, 4.6 * (1 - p), 1.15]} rotation={[0, (i - 2) * 0.12 + (1 - p) * 0.8, 0]}>
            <Gift body={body} ribbon={ribbon} />
          </group>
        );
      })}
    </group>
  );
};

const Cta: React.FC<{ t: number }> = ({ t }) => (
  <group position={[STATION_X.cta, 0, 0]}>
    <Phone rotationY={0.16}>
      <group scale={0.62} rotation={[0, 0, 0]}>
        <ChatIcon color={COLORS.yellow} emissive={COLORS.yellow} emissiveIntensity={0.5} dotColor={COLORS.petrol} />
      </group>
    </Phone>
    <pointLight position={[0, 1.8, 1.4]} intensity={5} color={COLORS.yellow} distance={5} />
    <Particles t={Math.max(0, t - SCENES.cta.start + 1)} seed="cta" radius={1.6} count={30} />
  </group>
);

export const World: React.FC<{ effects?: boolean }> = ({ effects = true }) => {
  const t = useT();
  const pose = cameraPose(t);
  const focusX = pose.lookX;
  // Built once: EffectComposer recreates its passes whenever its children change,
  // which would compile new shaders every frame and exhaust the WebGL context.
  const dofRef = useRef<DepthOfFieldEffect>(null);
  const post = useMemo(
    () => (
      <EffectComposer multisampling={0}>
        <DepthOfField ref={dofRef} target={[0, 1.2, 0]} focalLength={0.045} bokehScale={7} height={960} />
        <Bloom intensity={0.7} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.35} darkness={0.35} />
        <SMAA />
      </EffectComposer>
    ),
    [],
  );
  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 16, 34]} />
      <CameraRig />

      <hemisphereLight args={["#ffffff", "#c9cdd3", 0.55]} />
      <directionalLight
        position={[focusX + 4, 9, 6]}
        intensity={1.25}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={8}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-4}
        shadow-camera-near={1}
        shadow-camera-far={30}
      >
        <object3D attach="target" position={[focusX, 0, 0]} />
      </directionalLight>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.4} position={[0, 6, 4]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={0.7} position={[-6, 3, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.7} position={[6, 3, 2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" color={COLORS.yellow} intensity={1.5} position={[0, 2, -6]} scale={2} />
      </Environment>

      {/* glossy studio floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 40]} />
        <MeshReflectorMaterial
          blur={[400, 120]}
          resolution={1024}
          mixBlur={1}
          mixStrength={1.2}
          mirror={0.45}
          roughness={0.7}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#e6e8eb"
          metalness={0.05}
        />
      </mesh>

      <Buildings />
      <HookAndDeleted t={t} />
      <NewChannel t={t} x={STATION_X.newChannel} riseAt={BEATS.iconRise} />
      <Giveaway t={t} />
      <Cta t={t} />

      {effects && post}
      <FocusUpdater dofRef={dofRef} x={focusX} y={pose.lookY} />
      <Renderer />
    </>
  );
};
