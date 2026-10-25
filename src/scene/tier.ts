export type Tier = "high" | "low";
export type TierInput = {
  saveData?: boolean;
  effectiveType?: string;
  deviceMemory?: number;
  gpuTier?: number;
  isIOS: boolean;
};

const SLOW_NETWORKS = new Set(["slow-2g", "2g", "3g"]);

export function pickTier(i: TierInput): Tier {
  const weakGpu = i.gpuTier !== undefined && i.gpuTier <= 1;
  // iOS hides network and memory signals, so only the GPU decides there.
  if (i.isIOS) return weakGpu ? "low" : "high";
  if (
    i.saveData ||
    (i.effectiveType !== undefined && SLOW_NETWORKS.has(i.effectiveType)) ||
    (i.deviceMemory !== undefined && i.deviceMemory <= 4) ||
    weakGpu
  ) {
    return "low";
  }
  return "high";
}

type NavExtras = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

export function readTierInput(nav: Navigator, gpuTier: number | undefined): TierInput {
  const n = nav as NavExtras;
  return {
    saveData: n.connection?.saveData,
    effectiveType: n.connection?.effectiveType,
    deviceMemory: n.deviceMemory,
    gpuTier,
    isIOS:
      /iPad|iPhone|iPod/.test(n.userAgent) ||
      (n.platform === "MacIntel" && n.maxTouchPoints > 1),
  };
}

/**
 * detect-gpu result → gpuTier for pickTier. FALLBACK (benchmark CDN failed, or GPU not in the list)
 * and SSR mean "unknown", not "weak". Blocklisted or no WebGL is weak.
 */
export function gpuTierFromResult(r: { tier: number; type: string }): number | undefined {
  if (r.type === "BENCHMARK") return r.tier;
  if (r.type === "BLOCKLISTED" || r.type === "WEBGL_UNSUPPORTED") return 0;
  return undefined;
}
