import { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { COLORS } from "../timeline";

type B = { x: number; z: number; w: number; d: number; h: number };

// Low-poly city block in the background with warm lit windows.
export const Buildings: React.FC = () => {
  const buildings = useMemo<B[]>(() => {
    const list: B[] = [];
    let x = -12;
    let i = 0;
    while (x < 34) {
      const w = 1 + random(`w${i}`) * 1.1;
      list.push({
        x: x + w / 2,
        z: -8.5 - random(`z${i}`) * 3.5,
        w,
        d: 1 + random(`d${i}`) * 0.8,
        h: 1.4 + random(`h${i}`) * 3.4,
      });
      x += w + 0.25 + random(`g${i}`) * 0.5;
      i++;
    }
    return list;
  }, []);

  const windows = useMemo(() => {
    const out: { pos: [number, number, number]; lit: boolean }[] = [];
    buildings.forEach((b, bi) => {
      const cols = Math.max(2, Math.floor(b.w / 0.32));
      const rows = Math.floor((b.h - 0.4) / 0.42);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = b.x - b.w / 2 + (b.w / cols) * (c + 0.5);
          const wy = 0.45 + r * 0.42;
          out.push({ pos: [wx, wy, b.z + b.d / 2 + 0.005], lit: random(`win${bi}-${r}-${c}`) > 0.55 });
        }
      }
    });
    return out;
  }, [buildings]);

  const litRef = useRef<THREE.InstancedMesh>(null);
  const darkRef = useRef<THREE.InstancedMesh>(null);
  const lit = windows.filter((w) => w.lit);
  const dark = windows.filter((w) => !w.lit);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    lit.forEach((w, i) => litRef.current?.setMatrixAt(i, m.makeTranslation(...w.pos)));
    dark.forEach((w, i) => darkRef.current?.setMatrixAt(i, m.makeTranslation(...w.pos)));
    if (litRef.current) litRef.current.instanceMatrix.needsUpdate = true;
    if (darkRef.current) darkRef.current.instanceMatrix.needsUpdate = true;
  }, [lit, dark]);

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#cfd3d8" : "#dde0e4"} roughness={0.85} flatShading />
        </mesh>
      ))}
      <instancedMesh ref={litRef} args={[undefined, undefined, lit.length]}>
        <planeGeometry args={[0.16, 0.22]} />
        <meshStandardMaterial color={COLORS.yellow} emissive={COLORS.yellow} emissiveIntensity={2.2} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={darkRef} args={[undefined, undefined, dark.length]}>
        <planeGeometry args={[0.16, 0.22]} />
        <meshStandardMaterial color="#b9bec4" roughness={0.4} />
      </instancedMesh>
    </group>
  );
};
