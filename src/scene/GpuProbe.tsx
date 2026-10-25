"use client";

import { useDetectGPU } from "@react-three/drei";
import { useEffect } from "react";

import { gpuTierFromResult } from "./tier";

export default function GpuProbe({ onTier }: { onTier: (gpuTier: number | undefined) => void }) {
  const gpu = useDetectGPU();
  useEffect(() => onTier(gpuTierFromResult(gpu)), [gpu, onTier]);
  return null;
}
