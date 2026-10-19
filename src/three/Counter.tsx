import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../timeline";

const W = 1024;
const H = 512;

const useTextTexture = (text: string, color: string, sub: string | null) => {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return { canvas: c, texture: t };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `330px Anton`;
  ctx.fillText(text, W / 2, sub ? 360 : 400);
  if (sub) {
    ctx.font = `86px Anton`;
    ctx.letterSpacing = "10px";
    ctx.fillText(sub, W / 2, 480);
  }
  texture.needsUpdate = true;
  return texture;
};

// Big extruded-looking counter built from stacked text layers.
export const Counter: React.FC<{ value: number; glow: number }> = ({ value, glow }) => {
  const label = String(value);
  const front = useTextTexture(label, COLORS.yellow, "SEGUIDORES");
  const side = useTextTexture(label, "#8a6a10", "SEGUIDORES");
  const layers = 10;
  return (
    <group>
      {Array.from({ length: layers }).map((_, i) => (
        <mesh key={i} position={[0, 0, -i * 0.012]}>
          <planeGeometry args={[3.2, 1.6]} />
          <meshBasicMaterial map={i === 0 ? front : side} transparent alphaTest={0.4} toneMapped={i !== 0 || glow < 0.01} color={i === 0 ? new THREE.Color(1 + glow, 1 + glow, 1 + glow) : "#ffffff"} />
        </mesh>
      ))}
    </group>
  );
};
