import { RoundedBox } from "@react-three/drei";
import { COLORS } from "../timeline";

// Miniature phone standing on the floor. Children render on its screen.
export const Phone: React.FC<{ children?: React.ReactNode; screenTint?: string; rotationY?: number }> = ({
  children,
  screenTint = "#f7f8f9",
  rotationY = 0,
}) => (
  <group rotation={[0, rotationY, 0]}>
    <group position={[0, 1.25, 0]} rotation={[-0.05, 0, 0]}>
      <RoundedBox args={[1.25, 2.5, 0.13]} radius={0.1} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color="#1b1c1e" roughness={0.25} metalness={0.6} />
      </RoundedBox>
      {/* screen */}
      <mesh position={[0, 0, 0.068]}>
        <planeGeometry args={[1.12, 2.36]} />
        <meshStandardMaterial color={screenTint} emissive={screenTint} emissiveIntensity={0.35} roughness={0.2} />
      </mesh>
      {/* app header */}
      <mesh position={[0, 1.02, 0.07]}>
        <planeGeometry args={[1.12, 0.32]} />
        <meshStandardMaterial color={COLORS.petrol} roughness={0.4} />
      </mesh>
      {/* placeholder list rows */}
      {[-0.62, -0.82].map((y) => (
        <mesh key={y} position={[0, y, 0.07]}>
          <planeGeometry args={[0.85, 0.08]} />
          <meshStandardMaterial color="#dfe3e6" />
        </mesh>
      ))}
      {/* camera notch */}
      <mesh position={[0, 1.1, 0.072]}>
        <circleGeometry args={[0.035, 16]} />
        <meshStandardMaterial color="#0d0d0d" />
      </mesh>
      <group position={[0, 0.12, 0.13]}>{children}</group>
    </group>
  </group>
);
