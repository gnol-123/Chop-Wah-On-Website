import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Box3, MathUtils, Spherical, Vector3 } from "three";

import {
  EYE_HEIGHT,
  BASE_TOP,
  FACE_ZOOM,
  azimuthFromHeading,
  facedIndex,
  headingFromAzimuth,
  magnetHeading,
  slotHeading,
  slotPosition,
  snapHeading,
} from "./ring";

type Props = {
  count: number;
  selected: number | null;
  onFaced: (i: number | null) => void;
  onSelect: (i: number | null) => void;
  reducedMotion: boolean;
  onDrag?: () => void;
};

const { ACTION } = CameraControlsImpl;
const TAU = 2 * Math.PI;
/** `a` shifted by whole turns to sit closest to `ref`. */
const near = (a: number, ref: number) => a - TAU * Math.round((a - ref) / TAU);

// Ring: stand still and turn. Focus: orbit the product and dolly a little.
// ponytail: feel values (speeds, focus distance) are first guesses; tune them on real phones.
const RING = {
  minPolarAngle: Math.PI / 2,
  maxPolarAngle: Math.PI / 2,
  minDistance: Number.EPSILON,
  maxDistance: Infinity,
  // Negative: dragging pulls the scene with the finger, like looking around.
  azimuthRotateSpeed: -0.4,
  mouseButtons: { left: ACTION.ROTATE, middle: ACTION.NONE, right: ACTION.NONE, wheel: ACTION.NONE },
  touches: { one: ACTION.TOUCH_ROTATE, two: ACTION.NONE, three: ACTION.NONE },
} as const;
const FOCUS = {
  minPolarAngle: MathUtils.degToRad(30),
  maxPolarAngle: MathUtils.degToRad(100),
  minDistance: 1.4,
  maxDistance: 3.2,
  azimuthRotateSpeed: 1,
  mouseButtons: { left: ACTION.ROTATE, middle: ACTION.DOLLY, right: ACTION.NONE, wheel: ACTION.DOLLY },
  touches: { one: ACTION.TOUCH_ROTATE, two: ACTION.TOUCH_DOLLY, three: ACTION.NONE },
} as const;
const SMOOTH = 0.25; // drag and keys
const SETTLE = 0.6; // the magnet: slower, a pull rather than a snap
const FOCUS_BACK = 2.4; // horizontal metres from the product towards the ring centre
const FOCUS_UP = 0.6;
/** Phones: the product sheet covers the bottom of the screen, so drop the camera this far (metres) to lift the product above it. */
const FOCUS_LIFT = 0.3;

const sph = new Spherical();

/** Point the controls at a pose, turning the short way round (setLookAt alone may spin a full turn). */
function flyTo(c: CameraControlsImpl, pos: Vector3, target: Vector3, anim: boolean) {
  const from = c.azimuthAngle;
  void c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, anim);
  void c.rotateAzimuthTo(near(c.getSpherical(sph, true).theta, from), anim);
}

/** Ring pose for heading h: eye at the centre, target a hair ahead. */
const ringTarget = (h: number) => new Vector3(1e-4 * Math.sin(h), EYE_HEIGHT, -1e-4 * Math.cos(h));
const RING_EYE = new Vector3(0, EYE_HEIGHT, 0);

export function RingControls({ count, selected, onFaced, onSelect, reducedMotion, onDrag }: Props) {
  const ref = useRef<CameraControlsImpl>(null);
  const scene = useThree((s) => s.scene);
  const faced = useRef<number | null | undefined>(undefined);
  const dragging = useRef(false);
  const ringHeading = useRef(0);
  const prevSelected = useRef<number | null>(null);
  const anim = !reducedMotion;

  const reportFaced = () => {
    const c = ref.current;
    if (!c || selected !== null) return;
    const f = facedIndex(headingFromAzimuth(c.azimuthAngle), count, undefined, faced.current ?? null);
    if (f === faced.current) return;
    faced.current = f;
    void c.zoomTo(f === null ? 1 : FACE_ZOOM, anim);
    onFaced(f);
  };
  useFrame(reportFaced);

  const snap = () => {
    const c = ref.current;
    if (!c || selected !== null || dragging.current) return;
    const h = magnetHeading(headingFromAzimuth(c.azimuthAngle), count);
    if (h === null) return;
    c.smoothTime = reducedMotion ? 0 : SETTLE;
    void c.rotateAzimuthTo(azimuthFromHeading(h), anim);
  };

  // Start in the ring, facing slot 0.
  useEffect(() => {
    void ref.current?.setLookAt(...RING_EYE.toArray(), ...ringTarget(0).toArray(), false);
  }, []);

  // Fly in on select, back to the ring on deselect.
  useEffect(() => {
    const c = ref.current;
    const prev = prevSelected.current;
    prevSelected.current = selected;
    if (!c || selected === prev) return;

    c.smoothTime = reducedMotion ? 0 : SMOOTH;
    if (selected === null) {
      void c.zoomTo(faced.current != null ? FACE_ZOOM : 1, anim);
      void c.setFocalOffset(0, 0, 0, anim);
      flyTo(c, RING_EYE, ringTarget(ringHeading.current), anim);
      return;
    }
    void c.zoomTo(1, anim);
    // Same breakpoint as the sheet in Overlay (Tailwind md).
    void c.setFocalOffset(0, matchMedia("(min-width: 48rem)").matches ? 0 : FOCUS_LIFT, 0, anim);
    ringHeading.current = slotHeading(selected, count);
    const target = new Vector3();
    const obj = scene.getObjectByName(`product-${selected}`);
    const box = obj ? new Box3().setFromObject(obj) : null;
    if (box && !box.isEmpty()) box.getCenter(target);
    // Model still loading: aim at the pedestal top instead.
    else target.set(...slotPosition(selected, count)).setY(BASE_TOP + 0.3);
    // ponytail: target fixed at fly-in; a model that finishes loading mid-focus isn't re-aimed.
    const back = new Vector3(-target.x, 0, -target.z).normalize().multiplyScalar(FOCUS_BACK);
    flyTo(c, target.clone().add(back).setY(target.y + FOCUS_UP), target, anim);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the selection drives the flight
  }, [selected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = ref.current;
      if (!c) return;
      const el = e.target instanceof Element ? e.target : null;
      // Typing never turns the ring. Focused buttons and links still get Escape and the arrows.
      if (el?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "Escape") return onSelect(null);
      if (selected !== null) return;
      if (e.key === "Enter" || e.key === " ") {
        // Let a focused control activate itself.
        if (el?.closest("a, button, summary, [role=button]")) return;
        e.preventDefault();
        if (faced.current != null) onSelect(faced.current);
        return;
      }
      const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      // From where the camera is headed, so quick repeat presses each count.
      const h = snapHeading(headingFromAzimuth(c.getSpherical(sph, true).theta), count);
      c.smoothTime = reducedMotion ? 0 : SMOOTH;
      void c.rotateAzimuthTo(azimuthFromHeading(h + (dir * TAU) / count), anim);
      reportFaced();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <CameraControls
      ref={ref}
      makeDefault
      smoothTime={reducedMotion ? 0 : SMOOTH}
      {...(selected === null ? RING : FOCUS)}
      onControlStart={() => {
        dragging.current = true;
        if (ref.current) ref.current.smoothTime = reducedMotion ? 0 : SMOOTH;
        onDrag?.();
      }}
      onControlEnd={() => {
        dragging.current = false;
        // Already at rest (finger held still before letting go): no rest event will come.
        if (!ref.current?.active) snap();
      }}
      onRest={snap}
    />
  );
}
