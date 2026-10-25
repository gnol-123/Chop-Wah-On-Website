const DEPTH = 0.6; // how far the column runs below the water line
const RADIUS = 0.24;

/** Pale stone column rising from the water, its top at `top`. */
export function Pedestal({ position, top }: { position: [number, number, number]; top: number }) {
  const h = top + DEPTH;
  const [x, , z] = position;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, top - h / 2, 0]}>
        <cylinderGeometry args={[RADIUS, RADIUS * 1.12, h, 48]} />
        <meshStandardMaterial color="#eef3f3" roughness={0.55} />
      </mesh>
      <mesh position={[0, top - 0.02, 0]}>
        <cylinderGeometry args={[RADIUS * 1.08, RADIUS * 1.08, 0.04, 48]} />
        <meshStandardMaterial color="#f7fafa" roughness={0.4} />
      </mesh>
    </group>
  );
}
