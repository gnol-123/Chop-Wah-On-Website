const DEPTH = 0.6; // how far the column runs below the water line
const CAP = 0.03; // cap thickness

/** Slim mist-blue column rising from the water, under a pearl cap of `radius` at `top`. */
export function Pedestal({
  position,
  top,
  radius,
}: {
  position: [number, number, number];
  top: number;
  radius: number;
}) {
  const h = top + DEPTH - CAP;
  const [x, , z] = position;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, top - CAP - h / 2, 0]}>
        <cylinderGeometry args={[radius * 0.5, radius * 0.58, h, 48]} />
        <meshStandardMaterial color="#92aab1" roughness={0.5} />
      </mesh>
      <mesh position={[0, top - CAP / 2, 0]}>
        <cylinderGeometry args={[radius, radius, CAP, 48]} />
        <meshPhysicalMaterial color="#e3ecee" roughness={0.3} clearcoat={1} clearcoatRoughness={0.15} />
      </mesh>
    </group>
  );
}
