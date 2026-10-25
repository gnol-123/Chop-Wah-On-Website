import { Html } from "@react-three/drei";
import { useEffect, useState } from "react";

import { ProductName } from "~/components/ProductList";
import { type Locale } from "~/i18n";
import { type Product } from "~/products";
import { calloutAnchor } from "./ring";

const panel = "rounded-2xl bg-white/80 px-4 py-3 text-sm [overflow-wrap:anywhere]";
const width = "w-[min(16rem,80vw)]";

/** Same breakpoint as RingControls and the sheet in Overlay (Tailwind md). */
function useWide() {
  // Client-only component: read the breakpoint up front so desktop never mounts the phone layout first.
  const [wide, setWide] = useState(() => matchMedia("(min-width: 48rem)").matches);
  useEffect(() => {
    const mq = matchMedia("(min-width: 48rem)");
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

/** Floating name above the faced product (tap to open it), with a description to each side, or below on phones. */
export function Callout({ product, lang, index, count, footprint, height, onOpen }: Props) {
  const wide = useWide();
  const t = product.text[lang];
  const side = footprint + 0.15;
  return (
    <>
      <Html position={calloutAnchor(index, count, 0, height + 0.1)} zIndexRange={[4, 4]}>
        <div className="-translate-x-1/2 -translate-y-full">
          <button
            type="button"
            data-testid="callout"
            onClick={onOpen}
            className="animate-pop block w-[min(20rem,90vw)] text-center text-3xl tracking-widest [overflow-wrap:anywhere] [text-shadow:0_0_10px_#fff] md:w-[28rem] md:text-5xl"
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
        <Html position={calloutAnchor(index, count, 0, -0.08)} zIndexRange={[4, 4]} pointerEvents="none">
          <div className="flex -translate-x-1/2 flex-col gap-2 text-center">
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
