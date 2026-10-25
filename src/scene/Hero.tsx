"use client";

import dynamic from "next/dynamic";
import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Footer } from "~/components/Footer";
import { ProductList } from "~/components/ProductList";
import { dict, type Locale } from "~/i18n";
import { products } from "~/products";
import { Overlay } from "./Overlay";
import { pickTier, readTierInput, type Tier } from "./tier";
import { hasWebGL } from "./webgl";

// Everything three/R3F lives behind these two imports, out of the page's initial JS.
// lazy, not next/dynamic: Showroom only renders client-side, and lazy lets Hero's Suspense show the loading line.
const Showroom = lazy(() => import("./Showroom"));
const GpuProbe = dynamic(() => import("./GpuProbe"), { ssr: false });

const GPU_TIMEOUT_MS = 2000;

class Catch extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error(error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type FocusState = { cwhFocus?: string } | null;

export function Hero({ lang }: { lang: Locale }) {
  const [tier, setTier] = useState<Tier | null>(null);
  const [probing, setProbing] = useState(false);
  const [faced, setFaced] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dragged, setDragged] = useState(false);
  // No WebGL, or a model failed to load: show the plain product list instead.
  const [failed, setFailed] = useState(false);
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
    if (!hasWebGL()) setFailed(true);
  }, []);

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

  /** Close the product view. The overlay's back button calls this too. */
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

  // Until the canvas is up; drei's Loader (same look) takes over once the models start loading.
  const loading = (
    <div data-testid="loading" className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
      <div className="w-[100px] text-center">
        <div className="h-[3px] bg-mist-deep" />
        <p className="mt-[0.8em] text-xs whitespace-nowrap text-ink">{dict[lang].loading}</p>
      </div>
    </div>
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
      {!failed && tier === null && loading}
      {tier && !failed && (
        <>
          {/* Before the Showroom so its Loader (same z) covers the cards while models load. */}
          <Overlay lang={lang} selected={selected} onBack={back} hint={!dragged} />
          <Catch onError={() => setFailed(true)}>
            <Suspense fallback={loading}>
              <Showroom
                products={products}
                tier={tier}
                lang={lang}
                faced={faced}
                selected={selected}
                onTap={select}
                loadingText={dict[lang].loading}
                controls={{
                  count: products.length,
                  selected,
                  onFaced: setFaced,
                  onSelect: select,
                  reducedMotion,
                  onDrag: () => setDragged(true),
                }}
              />
            </Suspense>
          </Catch>
        </>
      )}
      <ProductList lang={lang} visible={failed} />
      {selected === null && <Footer t={dict[lang]} />}
    </div>
  );
}
