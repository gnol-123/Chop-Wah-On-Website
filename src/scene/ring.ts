// Heading h => view direction (sin h, 0, -cos h). Slot 0 sits at h = 0.
export const RING_RADIUS = 3;
export const BASE_TOP = 0.06;
export const EYE_HEIGHT = 0.75;
export const FACING_THRESHOLD = 0.2;
export const TAP_SLOP_PX = 6;

const TAU = 2 * Math.PI;

/** Normalise to (-π, π]. */
function wrap(a: number): number {
  const r = a - TAU * Math.floor((a + Math.PI) / TAU);
  return r === -Math.PI ? Math.PI : r;
}

export function slotHeading(index: number, count: number): number {
  return (TAU * index) / count;
}

export function slotPosition(
  index: number,
  count: number,
  radius = RING_RADIUS,
): [number, number, number] {
  const h = slotHeading(index, count);
  return [radius * Math.sin(h), 0, -radius * Math.cos(h)];
}

export function facedIndex(
  heading: number,
  count: number,
  threshold = FACING_THRESHOLD,
): number | null {
  if (count <= 0) return null;
  const step = TAU / count;
  const n = Math.round(heading / step);
  if (Math.abs(wrap(heading - n * step)) >= threshold) return null;
  return ((n % count) + count) % count;
}

export function snapHeading(heading: number, count: number): number {
  if (count <= 0) return heading;
  const step = TAU / count;
  return Math.round(heading / step) * step;
}

export const azimuthFromHeading = (h: number): number => -h;
export const headingFromAzimuth = (a: number): number => -a;

export const isTap = (dragPx: number): boolean => dragPx < TAP_SLOP_PX;
