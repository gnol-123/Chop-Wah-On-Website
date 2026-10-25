import { useGLTF } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { Box3, Mesh, MeshPhysicalMaterial, Vector3 } from "three";

import { type Product } from "~/products";
import { Base } from "./Base";
import { BASE_TOP, isTap, slotHeading, slotPosition } from "./ring";
import { type Tier } from "./tier";

type Props = {
  product: Product;
  tier: Tier;
  index: number;
  count: number;
  onTap?: (index: number) => void;
};

/** Base radius over the product's footprint radius. */
const BASE_MARGIN = 1.12;

/** One product standing on its base, turned to face the centre of the ring. */
export function ProductModel({ product, tier, index, count, onTap }: Props) {
  // No Draco (the models don't use it); meshopt on for the .low.glb files.
  const { scene } = useGLTF(tier === "high" ? product.model.high : product.model.low, false, true);
  const s = product.displayScale;
  const { model, footprint } = useMemo(() => {
    const m = scene.clone(true);
    // three.js scales volume thickness with the model but not the attenuation distance, so at
    // displayScale the glass would tint as if s times thicker (the jar goes cyan). Scale both.
    m.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      if (!(o.material instanceof MeshPhysicalMaterial)) return;
      if (!o.material.transmission || !Number.isFinite(o.material.attenuationDistance)) return;
      o.material = o.material.clone();
      o.material.attenuationDistance *= s;
    });
    const size = new Box3().setFromObject(m).getSize(new Vector3());
    return { model: m, footprint: (Math.max(size.x, size.z) / 2) * s };
  }, [scene, s]);
  const [x, , z] = slotPosition(index, count);

  return (
    <>
      <Base position={[x, 0, z]} radius={footprint * BASE_MARGIN} />
      <group
        name={`product-${index}`}
        position={[x, BASE_TOP, z]}
        // Model fronts face +Z; turn by -heading so they face the origin.
        rotation={[0, -slotHeading(index, count), 0]}
        scale={s}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (!isTap(e.delta)) return;
          e.stopPropagation();
          onTap?.(index);
        }}
      >
        <primitive object={model} />
      </group>
    </>
  );
}
