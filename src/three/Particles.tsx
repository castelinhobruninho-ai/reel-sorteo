import { random } from "remotion";
import { COLORS } from "../timeline";

// Soft warm particles drifting upward. `t` is seconds since emission started.
export const Particles: React.FC<{ t: number; count?: number; radius?: number; height?: number; seed: string }> = ({
  t,
  count = 40,
  radius = 1.2,
  height = 3.2,
  seed,
}) => (
  <group>
    {Array.from({ length: count }).map((_, i) => {
      const a = random(`${seed}a${i}`) * Math.PI * 2;
      const r = 0.2 + random(`${seed}r${i}`) * radius;
      const speed = 0.5 + random(`${seed}s${i}`) * 0.9;
      const delay = random(`${seed}d${i}`) * 1.5;
      const life = ((Math.max(0, t - delay) * speed) % height) / height;
      if (t < delay) return null;
      const y = life * height;
      const size = 0.025 + random(`${seed}z${i}`) * 0.035;
      const fade = Math.sin(life * Math.PI);
      return (
        <mesh key={i} position={[Math.cos(a + life) * r, y, Math.sin(a + life) * r * 0.6]} scale={size * (0.5 + fade)}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color={COLORS.yellow} transparent opacity={0.9 * fade} toneMapped={false} />
        </mesh>
      );
    })}
  </group>
);
