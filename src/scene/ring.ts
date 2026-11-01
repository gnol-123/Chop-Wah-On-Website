// Heading h => view direction (sin h, 0, -cos h). Slot 0 sits at h = 0.
export const RING_RADIUS = 3;
export const BASE_TOP = 0.06;
export const EYE_HEIGHT = 0.75;
export const FACING_THRESHOLD = 0.2;
/** Leaving the faced product needs this multiple of the facing threshold. */
export const FACING_EXIT = 1.3;
/** Letting go within this many radians of a slot pulls the view onto it: every heading still counted as faced. */
export const MAGNET = FACING_THRESHOLD * FACING_EXIT;
/** Camera zoom while a product is faced. */
export const FACE_ZOOM = 1.12;
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

/** Point `offset` m to the viewer's right of a slot (viewer at the origin facing it), `height` m above the base top. */
export function calloutAnchor(
  index: number,
  count: number,
  offset: number,
  height: number,
): [number, number, number] {
  const h = slotHeading(index, count);
  const [x, , z] = slotPosition(index, count);
  return [x + offset * Math.cos(h), BASE_TOP + height, z + offset * Math.sin(h)];
}

/** Index of the product faced, or null. `prev` (already faced) stays faced out to threshold * FACING_EXIT. */
export function facedIndex(
  heading: number,
  count: number,
  threshold = FACING_THRESHOLD,
  prev: number | null = null,
): number | null {
  if (count <= 0) return null;
  const step = TAU / count;
  const n = Math.round(heading / step);
  const i = ((n % count) + count) % count;
  const limit = i === prev ? threshold * FACING_EXIT : threshold;
  return Math.abs(wrap(heading - n * step)) < limit ? i : null;
}

export function snapHeading(heading: number, count: number): number {
  if (count <= 0) return heading;
  const step = TAU / count;
  return Math.round(heading / step) * step;
}

/** Nearest slot's heading (same turn as `heading`) when within `radius`, else null. */
export function magnetHeading(heading: number, count: number, radius = MAGNET): number | null {
  const h = snapHeading(heading, count);
  return count > 0 && Math.abs(heading - h) < radius ? h : null;
}

export const azimuthFromHeading = (h: number): number => -h;
export const headingFromAzimuth = (a: number): number => -a;

export const isTap = (dragPx: number): boolean => dragPx < TAP_SLOP_PX;
