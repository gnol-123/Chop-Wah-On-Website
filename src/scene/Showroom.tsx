"use client";

import { Environment, PerformanceMonitor, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState, type ReactNode } from "react";

import { type Product } from "~/products";
import { ProductModel } from "./ProductModel";
import { EYE_HEIGHT } from "./ring";
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

// The sky's own colour at the horizon (sampled), so the far water melts into it with no seam.
const HAZE = "#f3f5f5";

// Hazy and pale: lots of mie haze, little rayleigh blue.
const sky = (
  <Sky sunPosition={SUN} turbidity={12} rayleigh={0.5} mieCoefficient={0.02} mieDirectionalG={0.3} />
);

// ponytail: fixed wait after the models mount; key it off renderer.compileAsync if slow phones still trip it.
const SETTLE_MS = 2000;

function After({ ms, children }: { ms: number; children: ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setOn(true), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return on ? children : null;
}

export default function Showroom({ products, tier, onTap, children }: ShowroomProps) {
  const [declined, setDeclined] = useState(false);
  const effectsLow = tier === "low" || declined;
  const n = products.length;

  return (
    <Canvas
      dpr={effectsLow ? [1, 1.25] : [1, 2]}
      camera={{ fov: 50, position: [0, EYE_HEIGHT, 0], rotation: [0, 0, 0], near: 0.05, far: 2000 }}
    >
      <fog attach="fog" args={[HAZE, 5, 60]} />
      {sky}
      <Environment resolution={tier === "high" ? 256 : 64} frames={1}>
        {sky}
      </Environment>
      <directionalLight position={SUN} intensity={1.2} />
      <Water tier={effectsLow ? "low" : "high"} sun={SUN} />
      <Suspense fallback={null}>
        {products.map((p, i) => (
          <ProductModel key={p.id} product={p} tier={tier} index={i} count={n} onTap={onTap} />
        ))}
        {/* Not until the models are in and their textures and shaders are on the GPU: that
            first-frame stall isn't a slow device. */}
        <After ms={SETTLE_MS}>
          <PerformanceMonitor onDecline={() => setDeclined(true)} />
        </After>
      </Suspense>
      {children}
    </Canvas>
  );
}
