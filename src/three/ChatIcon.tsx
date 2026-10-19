import { useMemo } from "react";
import * as THREE from "three";

// Generic speech-bubble channel icon (no official logos).
const bubbleShape = () => {
  const s = new THREE.Shape();
  const r = 0.5;
  s.absarc(0, 0, r, Math.PI * 1.32, Math.PI * 1.18 + Math.PI * 2, false);
  s.lineTo(-0.52, -0.56);
  s.closePath();
  return s;
};

type Props = {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  dotColor?: string;
  wireframe?: boolean;
};

export const ChatIcon: React.FC<Props> = ({
  color,
  emissive = "#000000",
  emissiveIntensity = 0,
  opacity = 1,
  dotColor = "#ffffff",
  wireframe = false,
}) => {
  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(bubbleShape(), {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
      curveSegments: 18,
    });
    g.translate(0, 0, -0.07);
    return g;
  }, []);
  const transparent = opacity < 1;
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.35}
          metalness={0.05}
          transparent={transparent}
          opacity={opacity}
          wireframe={wireframe}
          toneMapped={emissiveIntensity < 1}
        />
      </mesh>
      {[-0.2, 0, 0.2].map((x) => (
        <mesh key={x} position={[x, 0, 0.13]} castShadow>
          <sphereGeometry args={[0.065, 16, 12]} />
          <meshStandardMaterial color={dotColor} transparent={transparent} opacity={opacity} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};
