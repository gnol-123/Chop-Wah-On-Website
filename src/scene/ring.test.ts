import { describe, expect, it } from "vitest";
import {
  BASE_TOP,
  EYE_HEIGHT,
  RING_RADIUS,
  azimuthFromHeading,
  calloutAnchor,
  facedIndex,
  headingFromAzimuth,
  isTap,
  slotHeading,
  slotPosition,
  snapHeading,
} from "./ring";

const TAU = 2 * Math.PI;

describe("ring", () => {
  it("slotHeading", () => {
    expect(slotHeading(1, 2)).toBeCloseTo(Math.PI);
    expect(slotHeading(1, 4)).toBeCloseTo(Math.PI / 2);
  });
  it("slotPosition", () => {
    const a = slotPosition(0, 2, 3);
    expect(a[0]).toBeCloseTo(0);
    expect(a[1]).toBeCloseTo(0);
    expect(a[2]).toBeCloseTo(-3);
    const p = slotPosition(1, 4, 3);
    expect(p[0]).toBeCloseTo(3);
    expect(p[1]).toBeCloseTo(0);
    expect(p[2]).toBeCloseTo(0);
  });
  it("facedIndex", () => {
    expect(facedIndex(0.1, 2)).toBe(0);
    expect(facedIndex(-3.1, 2)).toBe(1);
    expect(facedIndex(TAU + 0.05, 2)).toBe(0);
    expect(facedIndex(Math.PI / 2, 2)).toBeNull();
    // Past the threshold (0.2 rad, about half a phone's horizontal view): nothing faced.
    expect(facedIndex(0.25, 2)).toBeNull();
    expect(facedIndex(0, 0)).toBeNull();
    expect(facedIndex(2, 1)).toBeNull();
  });
  it("snapHeading", () => {
    expect(snapHeading(TAU + 0.2, 2)).toBeCloseTo(TAU);
    expect(snapHeading(-0.2, 2)).toBeCloseTo(0);
    expect(snapHeading(1.7, 2)).toBeCloseTo(Math.PI);
    expect(snapHeading(5, 0)).toBe(5);
  });
  it("azimuth conversion", () => {
    expect(headingFromAzimuth(azimuthFromHeading(1.2))).toBeCloseTo(1.2);
    expect(azimuthFromHeading(1)).toBe(-1);
  });
  it("isTap", () => {
    expect(isTap(5)).toBe(true);
    expect(isTap(6)).toBe(false);
  });
  it("products sit low and the eye sees over them", () => {
    expect(BASE_TOP).toBeGreaterThan(0);
    expect(BASE_TOP).toBeLessThan(0.15);
    expect(EYE_HEIGHT).toBeLessThan(1);
  });
  it("calloutAnchor sits to the viewer's right of the slot", () => {
    const [x, y, z] = calloutAnchor(0, 2, 0.5, 1);
    expect(x).toBeCloseTo(0.5);
    expect(y).toBeCloseTo(BASE_TOP + 1);
    expect(z).toBeCloseTo(-RING_RADIUS);
    const q = calloutAnchor(1, 4, 0.5, 0);
    expect(q[0]).toBeCloseTo(RING_RADIUS);
    expect(q[2]).toBeCloseTo(0.5);
  });
});
