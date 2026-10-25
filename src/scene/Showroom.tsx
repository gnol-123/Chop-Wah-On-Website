"use client";

import { Environment, PerformanceMonitor, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";

import { type Product } from "~/products";
import { Pedestal } from "./Pedestal";
import { ProductModel } from "./ProductModel";
import { EYE_HEIGHT, PEDESTAL_TOP, slotPosition } from "./ring";
import { type Tier } from "./tier";
import { Water } from "./Water";

export type ShowroomProps = {
  products: Product[];
  tier: Tier;
  onTap?: (index: number) => void;
  children?: React.ReactNode;
};

/** Sun direction, shared by the sky and the water. High and off to the right. */
export const SUN: [number, number, number] = [0.4, 0.8, -0.45];

const MIST = "#dfeaeb";

// Hazy and pale: lots of mie haze, little rayleigh blue.
const sky = (
  <Sky sunPosition={SUN} turbidity={12} rayleigh={0.5} mieCoefficient={0.02} mieDirectionalG={0.3} />
);

export default function Showroom({ products, tier, onTap, children }: ShowroomProps) {
  const [declined, setDeclined] = useState(false);
  const effectsLow = tier === "low" || declined;
  const n = products.length;

  return (
    <Canvas
      dpr={effectsLow ? [1, 1.25] : [1, 2]}
      camera={{ fov: 50, position: [0, EYE_HEIGHT, 0], rotation: [0, 0, 0], near: 0.05, far: 2000 }}
    >
      <PerformanceMonitor onDecline={() => setDeclined(true)} />
      <fog attach="fog" args={[MIST, 20, 160]} />
      {sky}
      <Environment resolution={tier === "high" ? 256 : 64} frames={1}>
        {sky}
      </Environment>
      <directionalLight position={SUN} intensity={1.2} />
      <Water tier={effectsLow ? "low" : "high"} sun={SUN} />
      {products.map((p, i) => (
        <Pedestal key={p.id} position={slotPosition(i, n)} top={PEDESTAL_TOP} />
      ))}
      <Suspense fallback={null}>
        {products.map((p, i) => (
          <ProductModel key={p.id} product={p} tier={tier} index={i} count={n} onTap={onTap} />
        ))}
      </Suspense>
      {children}
    </Canvas>
  );
}
