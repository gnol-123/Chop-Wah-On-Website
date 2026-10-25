import { describe, expect, it } from "vitest";
import { gpuTierFromResult, pickTier, readTierInput } from "./tier";

describe("pickTier", () => {
  it("defaults to high", () => expect(pickTier({ isIOS: false })).toBe("high"));
  it.each([
    { saveData: true },
    { effectiveType: "3g" },
    { effectiveType: "2g" },
    { effectiveType: "slow-2g" },
    { deviceMemory: 4 },
    { gpuTier: 1 },
  ])("low for %o", (i) => expect(pickTier({ isIOS: false, ...i })).toBe("low"));
  it("high for good signals", () =>
    expect(pickTier({ isIOS: false, effectiveType: "4g", deviceMemory: 8, gpuTier: 2 })).toBe("high"));
  it("iOS ignores network and memory, honours gpuTier", () => {
    expect(pickTier({ isIOS: true, deviceMemory: 2, effectiveType: "3g", gpuTier: 3 })).toBe("high");
    expect(pickTier({ isIOS: true, gpuTier: 1 })).toBe("low");
  });
});

describe("readTierInput", () => {
  it("reads signals and detects iOS", () => {
    const nav = {
      userAgent: "x",
      platform: "MacIntel",
      maxTouchPoints: 5,
      deviceMemory: 4,
      connection: { saveData: true, effectiveType: "4g" },
    } as unknown as Navigator;
    expect(readTierInput(nav, 2)).toEqual({
      saveData: true,
      effectiveType: "4g",
      deviceMemory: 4,
      gpuTier: 2,
      isIOS: true,
    });
  });
  it("non-iOS", () => {
    const nav = { userAgent: "Android", platform: "Linux", maxTouchPoints: 5 } as unknown as Navigator;
    expect(readTierInput(nav, undefined).isIOS).toBe(false);
  });
});

describe("gpuTierFromResult", () => {
  it.each([
    [{ tier: 2, type: "BENCHMARK" }, 2],
    [{ tier: 1, type: "FALLBACK" }, undefined],
    [{ tier: 0, type: "SSR" }, undefined],
    [{ tier: 0, type: "BLOCKLISTED" }, 0],
    [{ tier: 0, type: "WEBGL_UNSUPPORTED" }, 0],
  ])("%o -> %s", (r, want) => expect(gpuTierFromResult(r)).toBe(want));
  it("a CDN failure doesn't force low", () =>
    expect(pickTier({ isIOS: false, gpuTier: gpuTierFromResult({ tier: 1, type: "FALLBACK" }) })).toBe("high"));
});
