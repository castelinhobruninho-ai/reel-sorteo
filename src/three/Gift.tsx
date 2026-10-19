import { COLORS } from "../timeline";

export const Gift: React.FC<{ body: string; ribbon: string }> = ({ body, ribbon }) => {
  const s = 0.62;
  return (
    <group>
      <mesh position={[0, s / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[s, s, s]} />
        <meshStandardMaterial color={body} roughness={0.45} />
      </mesh>
      {/* lid */}
      <mesh position={[0, s + 0.04, 0]} castShadow>
        <boxGeometry args={[s + 0.06, 0.1, s + 0.06]} />
        <meshStandardMaterial color={body} roughness={0.4} />
      </mesh>
      {/* ribbons */}
      <mesh position={[0, s / 2 + 0.03, 0]}>
        <boxGeometry args={[0.12, s + 0.12, s + 0.08]} />
        <meshStandardMaterial color={ribbon} roughness={0.3} emissive={ribbon === COLORS.yellow ? ribbon : "#000"} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, s / 2 + 0.03, 0]}>
        <boxGeometry args={[s + 0.08, s + 0.12, 0.12]} />
        <meshStandardMaterial color={ribbon} roughness={0.3} emissive={ribbon === COLORS.yellow ? ribbon : "#000"} emissiveIntensity={0.15} />
      </mesh>
      {/* bow */}
      {[-1, 1].map((d) => (
        <mesh key={d} position={[d * 0.1, s + 0.16, 0]} rotation={[0, 0, d * 0.6]} castShadow>
          <torusGeometry args={[0.09, 0.035, 8, 16]} />
          <meshStandardMaterial color={ribbon} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};
