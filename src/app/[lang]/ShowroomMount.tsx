"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { products } from "~/products";
import { type Tier } from "~/scene/tier";

const Showroom = dynamic(() => import("~/scene/Showroom"), { ssr: false });

// Temporary mount until Hero (Task 6) picks the tier properly.
export function ShowroomMount() {
  return (
    <Suspense>
      <Mount />
    </Suspense>
  );
}

function Mount() {
  const q = useSearchParams().get("tier");
  // Dev-only override for checking tiers: ?tier=high|low
  const tier: Tier = process.env.NODE_ENV !== "production" && q === "low" ? "low" : "high";
  return <Showroom products={products} tier={tier} />;
}
