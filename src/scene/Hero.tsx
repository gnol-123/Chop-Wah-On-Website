"use client";

import { useDetectGPU } from "@react-three/drei";
import dynamic from "next/dynamic";
import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { type Locale } from "~/i18n";
import { products } from "~/products";
import { RingControls } from "./RingControls";
import { pickTier, readTierInput, type Tier } from "./tier";

const Showroom = dynamic(() => import("./Showroom"), { ssr: false });

const GPU_TIMEOUT_MS = 2000;

class Catch extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function GpuProbe({ onTier }: { onTier: (gpuTier: number) => void }) {
  const { tier } = useDetectGPU();
  useEffect(() => onTier(tier), [tier, onTier]);
  return null;
}

type FocusState = { cwhFocus?: string } | null;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the overlay (Task 7) reads lang
export function Hero({ lang }: { lang: Locale }) {
  const [tier, setTier] = useState<Tier | null>(null);
  const [probing, setProbing] = useState(false);
  const [faced, setFaced] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  // True while the current history entry is one we pushed for the open product.
  const pushed = useRef(false);

  const decide = useCallback(
    (gpuTier?: number) => setTier((t) => t ?? pickTier(readTierInput(navigator, gpuTier))),
    [],
  );

  useEffect(() => {
    // Dev-only override for checking tiers: ?tier=high|low
    const q = new URLSearchParams(location.search).get("tier");
    if (process.env.NODE_ENV !== "production" && (q === "high" || q === "low")) {
      setTier(q);
      return;
    }
    setProbing(true);
    // detect-gpu fetches its benchmark data from a CDN; don't wait on it forever.
    const id = setTimeout(() => decide(undefined), GPU_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [decide]);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // The history entry decides what's open: Back closes the product, Forward (or a reload) reopens it.
  useEffect(() => {
    const sync = (state: FocusState) => {
      const i = products.findIndex((p) => p.id === state?.cwhFocus);
      pushed.current = i >= 0;
      setSelected(i >= 0 ? i : null);
    };
    sync(history.state as FocusState);
    const onPop = (e: PopStateEvent) => sync(e.state as FocusState);
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  /** Close the product view. Task 7's back button calls this too. */
  const back = useCallback(() => {
    if (!pushed.current) return setSelected(null);
    pushed.current = false; // a second Back before popstate lands must not leave the site
    history.back(); // popstate clears the selection
  }, []);

  const select = useCallback(
    (i: number | null) => {
      if (i === null) return back();
      const id = products[i]?.id;
      if (!id) return;
      history[pushed.current ? "replaceState" : "pushState"]({ cwhFocus: id }, "", `#${id}`);
      pushed.current = true;
      setSelected(i);
    },
    [back],
  );

  return (
    <div
      data-testid="hero"
      data-faced={faced ?? ""}
      data-selected={selected ?? ""}
      data-reduced-motion={String(reducedMotion)}
      className="absolute inset-0"
    >
      {probing && tier === null && (
        <Catch onError={() => decide(undefined)}>
          <Suspense fallback={null}>
            <GpuProbe onTier={decide} />
          </Suspense>
        </Catch>
      )}
      {tier && (
        <Showroom products={products} tier={tier} onTap={select}>
          <RingControls
            count={products.length}
            selected={selected}
            onFaced={setFaced}
            onSelect={select}
            reducedMotion={reducedMotion}
          />
        </Showroom>
      )}
    </div>
  );
}
