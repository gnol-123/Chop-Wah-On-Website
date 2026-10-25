import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Box3, MathUtils, Spherical, Vector3 } from "three";

import {
  EYE_HEIGHT,
  PEDESTAL_TOP,
  azimuthFromHeading,
  facedIndex,
  headingFromAzimuth,
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
};

const { ACTION } = CameraControlsImpl;
const TAU = 2 * Math.PI;
/** `a` shifted by whole turns to sit closest to `ref`. */
const near = (a: number, ref: number) => a - TAU * Math.round((a - ref) / TAU);

// Ring: stand still and turn. Focus: orbit the product and dolly a little.
// ponytail: feel values (speeds, focus distance) are first guesses, tune in Task 8.
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
  minDistance: 0.8,
  maxDistance: 1.8,
  azimuthRotateSpeed: 1,
  mouseButtons: { left: ACTION.ROTATE, middle: ACTION.DOLLY, right: ACTION.NONE, wheel: ACTION.DOLLY },
  touches: { one: ACTION.TOUCH_ROTATE, two: ACTION.TOUCH_DOLLY, three: ACTION.NONE },
} as const;
const FOCUS_BACK = 1.15; // horizontal metres from the product towards the ring centre
const FOCUS_UP = 0.35;

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

export function RingControls({ count, selected, onFaced, onSelect, reducedMotion }: Props) {
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
    const f = facedIndex(headingFromAzimuth(c.azimuthAngle), count);
    if (f === faced.current) return;
    faced.current = f;
    onFaced(f);
  };
  useFrame(reportFaced);

  const snap = () => {
    const c = ref.current;
    if (!c || selected !== null || dragging.current) return;
    const h = snapHeading(headingFromAzimuth(c.azimuthAngle), count);
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

    if (selected === null) {
      flyTo(c, RING_EYE, ringTarget(ringHeading.current), anim);
      return;
    }
    ringHeading.current = slotHeading(selected, count);
    const target = new Vector3();
    const obj = scene.getObjectByName(`product-${selected}`);
    const box = obj ? new Box3().setFromObject(obj) : null;
    if (box && !box.isEmpty()) box.getCenter(target);
    // Model still loading: aim at the pedestal top instead.
    else target.set(...slotPosition(selected, count)).setY(PEDESTAL_TOP + 0.15);
    // ponytail: target fixed at fly-in; a model that finishes loading mid-focus isn't re-aimed.
    const back = new Vector3(-target.x, 0, -target.z).normalize().multiplyScalar(FOCUS_BACK);
    flyTo(c, target.clone().add(back).setY(target.y + FOCUS_UP), target, anim);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the selection drives the flight
  }, [selected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = ref.current;
      if (!c) return;
      if (e.target instanceof Element && e.target.closest("a, button, input, select, textarea")) return;
      if (e.key === "Escape") return onSelect(null);
      if (selected !== null) return;
      if (e.key === "Enter") {
        if (faced.current != null) onSelect(faced.current);
        return;
      }
      const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      // From where the camera is headed, so quick repeat presses each count.
      const h = snapHeading(headingFromAzimuth(c.getSpherical(sph, true).theta), count);
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
      smoothTime={reducedMotion ? 0 : 0.25}
      {...(selected === null ? RING : FOCUS)}
      onControlStart={() => (dragging.current = true)}
      onControlEnd={() => {
        dragging.current = false;
        // Already at rest (finger held still before letting go): no rest event will come.
        if (!ref.current?.active) snap();
      }}
      onRest={snap}
    />
  );
}
