import { useGLTF } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";

import { type Product } from "~/products";
import { PEDESTAL_TOP, isTap, slotHeading, slotPosition } from "./ring";
import { type Tier } from "./tier";

type Props = {
  product: Product;
  tier: Tier;
  index: number;
  count: number;
  onTap?: (index: number) => void;
};

/** One product standing on its pedestal, turned to face the centre of the ring. */
export function ProductModel({ product, tier, index, count, onTap }: Props) {
  // No Draco (the models don't use it); meshopt on for the .low.glb files.
  const { scene } = useGLTF(tier === "high" ? product.model.high : product.model.low, false, true);
  const model = useMemo(() => scene.clone(true), [scene]);
  const [x, , z] = slotPosition(index, count);

  return (
    <group
      name={`product-${index}`}
      position={[x, PEDESTAL_TOP, z]}
      // Model fronts face +Z; turn by -heading so they face the origin.
      rotation={[0, -slotHeading(index, count), 0]}
      scale={product.displayScale}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!isTap(e.delta)) return;
        e.stopPropagation();
        onTap?.(index);
      }}
    >
      <primitive object={model} />
    </group>
  );
}
