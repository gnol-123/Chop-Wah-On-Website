import { Html } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";

import { ProductName } from "~/components/ProductList";
import { type Locale } from "~/i18n";
import { type Product } from "~/products";
import { calloutAnchor, isTap } from "./ring";

const panel = "line-clamp-4 rounded-2xl bg-white/80 px-4 py-3 text-sm [overflow-wrap:anywhere]";
const width = "w-[min(16rem,80vw)]";

/** Room beside the product grows with the aspect (fixed vertical fov), so portrait tablets stack too. */
const WIDE = "(min-width: 50rem) and (min-aspect-ratio: 5/4)";

function useWide() {
  // Client-only component: read the breakpoint up front so desktop never mounts the phone layout first.
  const [wide, setWide] = useState(() => matchMedia(WIDE).matches);
  useEffect(() => {
    const mq = matchMedia(WIDE);
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return wide;
}

type Props = {
  product: Product;
  lang: Locale;
  index: number;
  count: number;
  /** Product footprint radius and height in metres (after displayScale). */
  footprint: number;
  height: number;
  onOpen: () => void;
};

/** Floating name above the faced product (tap to open it), with a description to each side, or docked at the bottom on phones. */
export function Callout({ product, lang, index, count, footprint, height, onOpen }: Props) {
  const wide = useWide();
  const t = product.text[lang];
  const side = footprint + 0.15;
  // Html shares the element the camera controls listen on: a drag that ends on the name is a turn, not a tap.
  const down = useRef({ x: 0, y: 0 });
  return (
    <>
      <Html position={calloutAnchor(index, count, 0, height + 0.1)} zIndexRange={[4, 4]}>
        <div className="-translate-x-1/2 -translate-y-full">
          <button
            type="button"
            data-testid="callout"
            onPointerDown={(e) => (down.current = { x: e.clientX, y: e.clientY })}
            onClick={(e) => {
              // detail 0: keyboard activation, which always opens.
              if (e.detail && !isTap(Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y))) return;
              onOpen();
            }}
            className="animate-pop block w-max max-w-[min(20rem,90vw)] text-center text-3xl tracking-widest [overflow-wrap:anywhere] [text-shadow:0_0_10px_#fff] [@media(min-width:48rem)_and_(min-height:30rem)]:max-w-[min(40rem,90vw)] [@media(min-width:48rem)_and_(min-height:30rem)]:text-5xl"
          >
            <ProductName t={t} />
          </button>
        </div>
      </Html>
      {wide ? (
        <>
          <Html position={calloutAnchor(index, count, -side, height * 0.5)} zIndexRange={[4, 4]} pointerEvents="none">
            <div className="-translate-x-full -translate-y-1/2">
              <p data-testid="callout-left" className={`${panel} ${width} text-right animate-emerge-left`}>
                {t.short}
              </p>
            </div>
          </Html>
          <Html position={calloutAnchor(index, count, side, height * 0.5)} zIndexRange={[4, 4]} pointerEvents="none">
            <div className="-translate-y-1/2">
              <p data-testid="callout-right" className={`${panel} ${width} animate-emerge-right`}>
                {t.detail}
              </p>
            </div>
          </Html>
        </>
      ) : (
        // Docked to the bottom of the canvas, growing up: HTML is fixed px while the 3D framing scales with height.
        <Html
          position={calloutAnchor(index, count, 0, 0)}
          calculatePosition={(_, __, size) => [size.width / 2, size.height]}
          zIndexRange={[4, 4]}
          pointerEvents="none"
        >
          <div className="flex -translate-x-1/2 -translate-y-full flex-col gap-2 pb-3 text-center">
            <p data-testid="callout-left" className={`${panel} ${width} animate-emerge-down`}>
              {t.short}
            </p>
            <p data-testid="callout-right" className={`${panel} ${width} animate-emerge-down`}>
              {t.detail}
            </p>
          </div>
        </Html>
      )}
    </>
  );
}
