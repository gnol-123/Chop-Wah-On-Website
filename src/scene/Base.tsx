import { useMemo } from "react";
import { LatheGeometry, Vector2 } from "three";

import { BASE_TOP } from "./ring";

const SINK = 0.04; // how far it runs below the water line
const BEVEL = 0.02;

/** Low pale ceramic disc of `radius`, top face at BASE_TOP, edge rounded off. */
export function Base({ position, radius }: { position: [number, number, number]; radius: number }) {
  const geometry = useMemo(() => {
    const r = radius;
    const pts = [
      [0, -SINK],
      [r * 0.96, -SINK],
      [r, -SINK + 0.02],
      [r, BASE_TOP - BEVEL],
      [r - BEVEL * 0.6, BASE_TOP - BEVEL * 0.2],
      [r - BEVEL, BASE_TOP],
      [0, BASE_TOP],
    ].map(([x, y]) => new Vector2(x, y));
    return new LatheGeometry(pts, 64);
  }, [radius]);
  return (
    <mesh position={position} geometry={geometry} receiveShadow>
      <meshPhysicalMaterial color="#eef2f1" roughness={0.35} clearcoat={0.4} clearcoatRoughness={0.25} />
    </mesh>
  );
}
