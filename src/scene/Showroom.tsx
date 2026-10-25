"use client";

import { Environment, Loader, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { type Product } from "~/products";
import { ProductModel } from "./ProductModel";
import { EYE_HEIGHT } from "./ring";
import { RingControls } from "./RingControls";
import { HORIZON, SkyDome } from "./SkyDome";
import { type Tier } from "./tier";
import { Water } from "./Water";

export type ShowroomProps = {
  products: Product[];
  tier: Tier;
  onTap?: (index: number) => void;
  controls: ComponentProps<typeof RingControls>;
  loadingText: string;
};

/** Sun direction, shared by the sky and the water. About 30° up, 30° right of slot 0. */
export const SUN: [number, number, number] = [0.43, 0.5, -0.75];

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

export default function Showroom({ products, tier, onTap, controls, loadingText }: ShowroomProps) {
  const [declined, setDeclined] = useState(false);
  const effectsLow = tier === "low" || declined;
  const n = products.length;

  return (
    <>
      <Canvas
        shadows={!effectsLow}
        dpr={effectsLow ? [1, 1.25] : [1, 2]}
        // Below 1 so label whites and highlights hold. The sky skips tone mapping, so this only moves the lit world.
        gl={{ toneMappingExposure: 0.8 }}
        camera={{ fov: 50, position: [0, EYE_HEIGHT, 0], rotation: [0, 0, 0], near: 0.05, far: 2000 }}
      >
        <fog attach="fog" args={[HORIZON, 30, 180]} />
        <SkyDome sun={SUN} />
        <Environment resolution={tier === "high" ? 256 : 64} frames={1}>
          <SkyDome sun={SUN} />
        </Environment>
        <directionalLight
          position={SUN}
          intensity={1}
          color="#fff3e2"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-4.5}
          shadow-camera-right={4.5}
          shadow-camera-top={4.5}
          shadow-camera-bottom={-4.5}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
          shadow-radius={4}
        />
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
        <RingControls {...controls} />
      </Canvas>
      <Loader
        // Under the header (z-10) and above the overlay, which Hero renders first.
        containerStyles={{ background: "#dfeaeb", zIndex: 5 }}
        barStyles={{ background: "#2385b1" }}
        innerStyles={{ background: "#c7d9dd" }}
        // Matches Hero's loading line (text-xs text-ink, Kantumruy Pro).
        dataStyles={{ color: "#5a6a70", fontFamily: "var(--font-kantumruy)", fontSize: "0.75rem" }}
        dataInterpolation={() => loadingText}
      />
    </>
  );
}
