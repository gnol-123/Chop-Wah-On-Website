import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { PlaneGeometry, RepeatWrapping, TextureLoader, Vector3 } from "three";
import { Water as WaterImpl } from "three/examples/jsm/objects/Water.js";

import { type Tier } from "./tier";

type Sun = [number, number, number];
const SIZE = 2000;
const TINT = "#5f8f94";

/** Calm water at y = 0. `high` is a mirror with moving normals; `low` a tinted reflective plane. */
export function Water({ tier, sun }: { tier: Tier; sun: Sun }) {
  return tier === "high" ? <MirrorWater sun={sun} /> : <TintedWater />;
}

function MirrorWater({ sun }: { sun: Sun }) {
  const { water, markStale } = useMemo(() => {
    // Loaded without suspending, so the world shows before the normals arrive.
    const normals = new TextureLoader().load("/textures/waternormals.jpg");
    normals.wrapS = normals.wrapT = RepeatWrapping;
    const w = new WaterImpl(new PlaneGeometry(SIZE, SIZE), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: normals,
      sunDirection: new Vector3(...sun).normalize(),
      sunColor: 0xffffff,
      waterColor: TINT,
      distortionScale: 0.6,
      fog: true,
    });
    w.material.uniforms.size!.value = 8;
    w.rotation.x = -Math.PI / 2;

    // The transmission pass renders opaque objects too, which would redraw the
    // mirror a second time per frame from the same camera. Draw it once per frame.
    const drawMirror = w.onBeforeRender.bind(w);
    let fresh = false;
    w.onBeforeRender = (...args) => {
      if (fresh) return;
      fresh = true;
      drawMirror(...args);
    };
    return { water: w, markStale: () => (fresh = false) };
  }, [sun]);

  useEffect(
    () => () => {
      water.geometry.dispose();
      water.material.uniforms.normalSampler!.value.dispose();
      water.material.uniforms.mirrorSampler!.value.dispose();
      water.material.dispose();
    },
    [water],
  );

  useFrame((_, delta) => {
    water.material.uniforms.time!.value += delta * 0.4;
    markStale();
  });

  return <primitive object={water} />;
}

function TintedWater() {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[SIZE, SIZE]} />
      <meshPhysicalMaterial color={TINT} roughness={0.08} metalness={0} clearcoat={1} />
    </mesh>
  );
}
