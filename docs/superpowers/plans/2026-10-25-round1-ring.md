# 3D Product Ring (Round 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A live, phone-first Khmer/English landing page where the visitor stands in a ring of 3D products under a sky, on water, and turns to browse them.

**Architecture:** A T3 Next.js app. The `[lang]` route serves Khmer (`/km`, default) and English (`/en`). The page renders the header, footer and product text on the server. A client-only React Three Fiber canvas holds the scene: sky, water, pedestals, products and camera. Pure TypeScript modules hold the ring maths and the device-tier rules, and they're unit-tested. drei `CameraControls` drives both modes: turning in place in the ring, and orbiting a product.

**Tech Stack:** Next.js (App Router) via create-t3-app, TypeScript, Tailwind, tRPC (empty), React Three Fiber, drei, three, Vitest, Playwright, pnpm, @gltf-transform/cli, Railway.

**Spec:** `docs/superpowers/specs/2026-10-25-hero-ring-design.md`

## In plain English

We build the site in nine steps, and each one ends with a commit.

1. **Starter project.** Create an empty T3 project.
2. **Page shell.** Add the frame of the page: Khmer and English addresses, the Khmer font, a header with the logo and language switch, and a footer.
3. **Products and models.** Copy in the two 3D models, make smaller phone versions of them, and write the product list (names, sizes, descriptions, all placeholder copy for now).
4. **Ring maths and phone check.** Write and test the maths: where each pedestal goes, which product the visitor is facing, and which way to ease when they let go. Write and test the rule that decides whether a phone gets the full or the light version.
5. **The world.** Build the sky, the water, the pedestals and the products standing on them, at both quality levels.
6. **Movement.** Add turning, snapping to products, tapping a product to fly in, orbiting it, and coming back. This includes the phone's back gesture and the keyboard.
7. **On-screen text.** Add the cards that appear when facing a product, the zoomed-in panel with size chips and the order button, and a plain list for phones that can't do 3D.
8. **Phone check.** Look at everything at phone size, tune sizes and spacing, and check the jar's colour under the sky.
9. **Go live.** Get it running on Railway. You connect GitHub to Railway, and I ask before pushing.
10. **Automatic checks** (done right after step 2). GitHub runs the lint, type check, unit tests and browser tests on every push and pull request. Railway only deploys once those pass.

## Global Constraints

- **Package manager:** pnpm. Never npm or yarn in this repo.
- **Node:** v26 locally, pinned to `24.x` (LTS) for Railway via `engines.node` in `package.json`. The code must run on both.
- **Git:** commit at the end of every task, and end each message with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **Never push**, never amend, never rewrite history. Pushing happens only in Task 9, after the owner says yes.
- **Read-only folders:** never edit anything in `C:\Users\SL\Desktop\CWH-site` or `C:\Users\SL\Desktop\Chop-Wah-On sales tracking\`. Copying files out is fine.
- **Never read `.env` files.**
- **Locales:** `km` (default) and `en`. Every user-visible string comes from `src/i18n.ts` or `src/products.ts`. No hardcoded copy in components.
- **Copy:** placeholder text is marked with a leading `[placeholder]` in both locales, so the owner can grep for it.
- **Khmer typography:** Kantumruy Pro via `next/font/google`, subsets `khmer` and `latin`. Body `line-height` at least `1.7`.
- **No database, auth or Supabase** this round.
- **Palette** (Tailwind theme tokens in the global CSS, from the spec's "Look" section):
  - `mist` `#dfeaeb`, `mist-deep` `#c7d9dd`
  - `brand` `#2385b1`, `brand-light` `#3094bf`
  - `ink` `#5a6a70`, `ink-soft` `#8a9aa0`
  - Panels are white or pale and translucent, never dark. No gold accent.
- **Heading style:** thin grey word plus bold blue word, using Kantumruy Pro 300 (`ink`) and 700 (`brand`).
- **Scene constants** (in `src/scene/ring.ts`): `RING_RADIUS = 3`, `PEDESTAL_TOP = 0.9`, `EYE_HEIGHT = 1.3`, `FACING_THRESHOLD = 0.35` (radians), `TAP_SLOP_PX = 6`. Tune values in Task 8 only.
- **Model extensions:** the GLBs need `EXT_texture_webp`, `KHR_materials_transmission`, `KHR_materials_volume` and `KHR_materials_ior`. Load them with drei `useGLTF` (meshopt decoder on).

## Review Focus

These are the failure modes most likely to bite a phone visitor that no unit test covers. Each line has a pinning test in the task that owns it.

1. **Android back gesture while zoomed into a product.** Expected: it closes the product view and stays on the site. Pinned in Task 6 (`back button closes product view`).
2. **Khmer text on a 360 px wide phone.** Khmer has no spaces between words, so long lines can push the page sideways. Expected: no horizontal scroll. Pinned in Task 7 (`no horizontal overflow at 360px in km`).
3. **A model file fails to load** (404, dropped connection). Expected: the visitor sees the plain product list, not a blank screen. Pinned in Task 7 (`model load failure shows product list`).
4. **A drag that ends with the finger over a product.** Expected: it turns the view and doesn't open the product. Pinned in Task 4 (`isTap`) and wired in Task 6.
5. **Reduced motion turned on.** Expected: the camera cuts instead of flying, and no snap animation plays. Pinned in Task 6 (`reduced motion disables transitions`).

---

### Task 1: Scaffold the T3 project

**Model:** sonnet

**Files:**
- Create: the T3 scaffold (`package.json`, `next.config.js`, `src/`, `tsconfig.json`, …), `vitest.config.ts`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `.gitignore` (merge the scaffold's entries, and keep `.superpowers/`)

**Interfaces:**
- Produces:
  - **Scripts:** `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm test` (Vitest, `src/**/*.test.ts`, node environment), `pnpm e2e` (Playwright, `tests/e2e`, Chromium only).
  - **Router:** an empty tRPC `appRouter` in `src/server/api/root.ts`.

- [ ] **Step 1: Scaffold into a temp dir.** The repo isn't empty, so create the app in the scratchpad and copy it in. Use `pnpm create t3-app@latest cwh --CI --trpc --tailwind --appRouter --noGit`. Copy everything except `.git` into the repo root, merge `.gitignore`, then run `pnpm install`.
- [ ] **Step 2: Strip the example.** Delete the example `post` router, its client usage and the demo page content. Keep `appRouter` with no procedures, the tRPC route handler and the React provider.
- [ ] **Step 3: Pin Node.** Add `"engines": { "node": "24.x" }` to `package.json`.
- [ ] **Step 4: Add Vitest and Playwright.**
  - Install `vitest`, `@playwright/test` and Playwright Chromium as dev dependencies.
  - `playwright.config.ts` uses `webServer: { command: "pnpm build && pnpm start", port: 3000, reuseExistingServer: true }`.
- [ ] **Step 5: Write a placeholder smoke test.** `tests/e2e/smoke.spec.ts` contains a test `home responds` that does `page.goto("/")` and checks the response status is below 400. (Task 2 replaces it.)
- [ ] **Step 6: Verify.** Run `pnpm build && pnpm e2e`. Expected: the build succeeds and 1 test passes. `pnpm test` exits 0 with no tests found (`passWithNoTests: true` in the Vitest config).
- [ ] **Step 7: Commit.** `chore: scaffold T3 app with vitest and playwright`

---

### Task 2: Locales, font and page shell

**Model:** sonnet

**Files:**
- Create:
  - `src/i18n.ts`
  - `src/app/[lang]/layout.tsx`, `src/app/[lang]/page.tsx`
  - `src/components/Header.tsx`, `src/components/LangSwitch.tsx`, `src/components/Footer.tsx`
  - `public/logo.png`
- Delete: `src/app/layout.tsx`, `src/app/page.tsx`. `[lang]/layout.tsx` becomes the root layout.
- Modify: `next.config.js`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces from `src/i18n.ts`:
  ```ts
  export const locales = ["km", "en"] as const;
  export type Locale = (typeof locales)[number];
  export const defaultLocale: Locale = "km";
  export function isLocale(x: string): x is Locale;
  export type Dict = { brand: string; dragHint: string; loading: string; sizes: string; order: string; orderSoon: string; back: string; products: string; footer: string; webglFallback: string };
  export const dict: Record<Locale, Dict>;
  ```
- Produces from the page: `src/app/[lang]/page.tsx` receives `params: Promise<{ lang: string }>`. It calls `notFound()` unless `isLocale`, and exports `generateStaticParams` and `dynamicParams = false`.

- [ ] **Step 1: Write the failing e2e tests** in `tests/e2e/smoke.spec.ts`:
  - `root redirects to km`: `goto("/")` ends at `/km`, and `html[lang]` is `km`.
  - `en works`: `goto("/en")` gives `html[lang]` of `en`.
  - `switch goes to en`: on `/km`, clicking the link named `EN` ends at `/en`.
  - `unknown locale 404s`: `goto("/fr")` returns status 404.
- [ ] **Step 2: Run them to see them fail.** `pnpm e2e`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `src/i18n.ts`: the dictionaries with `[placeholder]` copy in both locales. `brand` is `"ជប់វ៉ាអន"` / `"Chop Wah On"`, marked placeholder.
  - The `next.config.js` redirect is `{ source: "/", destination: "/km", permanent: false }`.
  - The layout sets `<html lang={lang}>`, applies Kantumruy Pro, and wraps everything in the tRPC provider, `Header` and `Footer`.
  - `LangSwitch` is a client component. It swaps the first path segment using `usePathname`. Labels are `ខ្មែរ` and `EN`, and it marks the current one with `aria-current`.
  - `Header` shows the logo top-left and `LangSwitch` top-right.
  - **Logo:** `logo/logo-512.png` is the company logo, already cut to a transparent circle at 512 px. Copy it to `public/logo.png` (shown with `next/image` at about 44 px) and to `src/app/icon.png` (favicon). Never commit `logo/logo enhanced.png` (the 23 MB original; it's gitignored).
  - **Palette:** register the palette tokens and set the page background to a `mist` → `mist-deep` gradient.
- [ ] **Step 4: Run the tests again.** `pnpm e2e`. Expected: 4 tests pass.
- [ ] **Step 5: Commit.** `feat: km/en routes, Khmer font, header and footer`

---

### Task 3: Product registry and model assets

**Model:** sonnet

**Files:**
- Create:
  - `public/models/crocodile-oil-46ml.glb`, `public/models/miracle-lady-cream-jar.glb` (copied from `C:\Users\SL\Desktop\CWH-site\models\`)
  - `public/models/*.low.glb`, generated by the script
  - `scripts/compress-models.mjs`
  - `src/products.ts`, `src/products.test.ts`
- Modify: `package.json` (add a `models:low` script and the `@gltf-transform/cli` dev dependency)

**Interfaces:**
- Produces from `src/products.ts`:
  ```ts
  export type ProductText = { name: string; short: string; long: string };
  export type Product = {
    id: string;                       // "crocodile-oil", "miracle-lady"
    model: { high: string; low: string }; // public URLs, e.g. "/models/crocodile-oil-46ml.glb"
    displayScale: number;             // crocodile 4, miracle-lady 6 (starting values; models are ~13 cm and ~5 cm tall)
    sizes: string[];                  // crocodile ["25ml", "46ml"], miracle-lady ["3g", "30g"]
    // km names (real, from the owner's promo): crocodile "ប្រេងក្រពើ", miracle-lady "គ្រីមគុជខ្យង"; en names "Crocodile Oil", "Miracle Lady Cream". Descriptions stay [placeholder].
    text: Record<Locale, ProductText>;
  };
  export const products: Product[];   // array order = ring order
  ```

- [ ] **Step 1: Write the failing test** in `src/products.test.ts`:
  - `every product has text in every locale`: for each product and each locale, `name`, `short` and `long` aren't empty.
  - `model files exist`: for each product, `fs.existsSync("public" + model.high)` and the same for `model.low` are both true.
  - `low models are smaller`: the `.low.glb` file size is smaller than the `.glb` size.
  - `ids are unique`.
- [ ] **Step 2: Run it to see it fail.** `pnpm test`. Expected: FAIL, because the module isn't there yet.
- [ ] **Step 3: Write the compression script.** `scripts/compress-models.mjs` runs, for each `public/models/*.glb` that isn't `*.low.glb`, `gltf-transform optimize <in> <name>.low.glb --compress meshopt --texture-compress webp --texture-size 1024` (via `execFileSync` on the local binary). It then runs `gltf-transform validate` on each output and exits non-zero if there are errors. Wire it up as `pnpm models:low`.
- [ ] **Step 4: Copy the models, generate, and write the registry.** Copy the two GLBs, run `pnpm models:low`, then write `src/products.ts` with `[placeholder]` copy in both locales.
- [ ] **Step 5: Run the test again.** `pnpm test`. Expected: 4 tests pass.
- [ ] **Step 6: Commit.** `feat: product registry, models and phone-size variants`

---

### Task 4: Ring maths and device tier

**Model:** sonnet

**Files:**
- Create: `src/scene/ring.ts`, `src/scene/ring.test.ts`, `src/scene/tier.ts`, `src/scene/tier.test.ts`

**Interfaces:**
- Produces from `src/scene/ring.ts`. Heading convention: heading `h` means the view direction is `(sin h, 0, -cos h)`, and slot 0 sits at `h = 0`.
  ```ts
  export const RING_RADIUS = 3, PEDESTAL_TOP = 0.9, EYE_HEIGHT = 1.3, FACING_THRESHOLD = 0.35, TAP_SLOP_PX = 6;
  export function slotHeading(index: number, count: number): number;          // 2π·index/count
  export function slotPosition(index: number, count: number, radius = RING_RADIUS): [number, number, number]; // y = 0
  export function facedIndex(heading: number, count: number, threshold = FACING_THRESHOLD): number | null;
  export function snapHeading(heading: number, count: number): number;        // nearest slot heading, unwrapped to be numerically closest to `heading`
  export function azimuthFromHeading(h: number): number;                      // camera-controls azimuthAngle = -h
  export function headingFromAzimuth(a: number): number;
  export function isTap(dragPx: number): boolean;                             // dragPx < TAP_SLOP_PX
  ```
- Produces from `src/scene/tier.ts`:
  ```ts
  export type Tier = "high" | "low";
  export type TierInput = { saveData?: boolean; effectiveType?: string; deviceMemory?: number; gpuTier?: number; isIOS: boolean };
  export function pickTier(i: TierInput): Tier;
  export function readTierInput(nav: Navigator, gpuTier: number | undefined): TierInput; // isIOS: /iPad|iPhone|iPod/ in UA, or MacIntel with maxTouchPoints > 1
  ```

- [ ] **Step 1: Write the failing tests.** Use `toBeCloseTo` for floats.
  - **`ring.test.ts`:**
    - `slotHeading(1,2) = π` and `slotHeading(1,4) = π/2`.
    - `slotPosition(0,2,3) ≈ [0,0,-3]` and `slotPosition(1,4,3) ≈ [3,0,0]`.
    - `facedIndex`:
      - `facedIndex(0.1,2) = 0`, `facedIndex(-3.1,2) = 1` (wrap), and `facedIndex(2π+0.05,2) = 0`.
      - `facedIndex(π/2,2) = null`, `facedIndex(0,0) = null`, and `facedIndex(2,1) = null` (outside the threshold).
    - `snapHeading`:
      - `snapHeading(2π+0.2,2) ≈ 2π`, `snapHeading(-0.2,2) ≈ 0` and `snapHeading(1.7,2) ≈ π`.
      - `snapHeading(5,0) = 5`.
    - `headingFromAzimuth(azimuthFromHeading(1.2)) ≈ 1.2` and `azimuthFromHeading(1) = -1`.
    - `isTap(5) = true` and `isTap(6) = false`.
  - **`tier.test.ts`:**
    - `pickTier({isIOS:false}) = "high"`.
    - Each of these alone gives `low`: `saveData`, `effectiveType "3g"`, `"2g"`, `"slow-2g"`, `deviceMemory 4` and `gpuTier 1`.
    - `effectiveType "4g"`, `deviceMemory 8` and `gpuTier 2` together give `high`.
    - iOS: `{isIOS:true, deviceMemory:2, effectiveType:"3g", gpuTier:3}` gives `high`, and `{isIOS:true, gpuTier:1}` gives `low`.
- [ ] **Step 2: Run them to see them fail.** `pnpm test`. Expected: FAIL.
- [ ] **Step 3: Implement both modules.** Normalise angles to `(-π, π]` before comparing.
- [ ] **Step 4: Run them again.** `pnpm test`. Expected: all pass.
- [ ] **Step 5: Commit.** `feat: ring maths and device tier selection`

---

### Task 5: The world (sky, water, pedestals, products)

**Model:** opus

**Files:**
- Create:
  - `src/scene/Showroom.tsx` (the canvas root)
  - `src/scene/Water.tsx`, `src/scene/Pedestal.tsx`, `src/scene/ProductModel.tsx`
  - `public/textures/waternormals.jpg`
- Modify: `src/app/[lang]/page.tsx` (temporary mount, replaced by `Hero` in Task 6)

**Interfaces:**
- Consumes: `products` and `Product` (Task 3); `slotPosition`, `PEDESTAL_TOP`, `EYE_HEIGHT` and `Tier` (Task 4).
- Produces:
  ```ts
  // Showroom.tsx ("use client"), default export, mounted via next/dynamic with ssr: false
  export type ShowroomProps = { products: Product[]; tier: Tier; children?: React.ReactNode }; // children = controls (Task 6), rendered inside <Canvas>
  // ProductModel.tsx
  export function ProductModel(p: { product: Product; tier: Tier; index: number; count: number; onTap?: (index: number) => void }): JSX.Element;
  export const SUN: [number, number, number]; // exported from Showroom.tsx, shared by Sky and Water
  ```

- [ ] **Step 1: Install the 3D libraries.** `pnpm add three @react-three/fiber @react-three/drei` and `pnpm add -D @types/three`. Download `examples/textures/waternormals.jpg` from the three.js GitHub repo, at the tag matching the installed `three` version, into `public/textures/` (MIT licence).
- [ ] **Step 2: Build `Showroom`.**
  - **Canvas:** `dpr` capped at `[1, 2]` on `high` and `[1, 1.25]` on `low`. Camera fov 50 at `[0, EYE_HEIGHT, 0]`.
  - **Sky:** a visible drei `<Sky sunPosition={SUN} />`, tuned hazy and pale to match the `mist` palette (high `turbidity`, low `rayleigh`, the sun fairly high, and fog in `mist` toward the horizon), plus `<Environment resolution={tier === "high" ? 256 : 64} frames={1}>` containing the same `<Sky>`, so products reflect it.
  - **Ground:** `<Water tier>`.
  - **Products:** for each product at `slotPosition(i, n)`, a `<Pedestal>` with its top at `PEDESTAL_TOP` (rising from below the water), and `<ProductModel>` sitting on it.
  - **Suspense:** wrap only the product models in `<Suspense>`, so the world shows before the models finish loading.
  - **Performance:** drei `<PerformanceMonitor onDecline>` switches an internal `effectsLow` state to true. `effectsLow` starts as `tier === "low"`, lowers the dpr and swaps the water. It never swaps models.
- [ ] **Step 3: Build `Water`.**
  - **`high`:** three.js `Water` from `three/examples/jsm/objects/Water.js` on a large plane at `y = 0`, using `waternormals.jpg`, `sunDirection` from `SUN`, and animated time.
  - **`low`** (or `effectsLow`): a `meshPhysicalMaterial` plane with a blue-green tint, low roughness and envMap reflections. It has no mirror pass.
- [ ] **Step 4: Build `ProductModel`.** It uses `useGLTF(tier === "high" ? model.high : model.low)` on a cloned scene, scaled by `displayScale`, with its base on `PEDESTAL_TOP` and rotated to face the centre. `onTap` fires from `onClick` only when `isTap(e.delta)`.
- [ ] **Step 5: Mount and check it.** Temporarily mount `<Showroom tier="high">` in the page. Run `pnpm dev` and take a Playwright MCP screenshot at 390×844 on `/km`. Expected: sky, water, two pedestals, and the bottle visible straight ahead. Glass isn't white and chrome isn't grey. Check `?tier=low` too: add a dev-only query override, read in the page, for checking tiers.
- [ ] **Step 6: Verify the build.** `pnpm build && pnpm test && pnpm e2e`. Expected: all pass.
- [ ] **Step 7: Commit.** `feat: sky, water, pedestals and product models`

---

### Task 6: Movement (ring turning, snap, focus, back)

**Model:** opus

**Files:**
- Create: `src/scene/RingControls.tsx`, `src/scene/Hero.tsx`
- Modify: `src/app/[lang]/page.tsx` (mount `Hero`), `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes:
  - From `ring.ts`: `facedIndex`, `snapHeading`, `slotHeading`, `slotPosition`, `azimuthFromHeading`, `headingFromAzimuth` and `EYE_HEIGHT`.
  - From Task 5: `Showroom` with its `children` slot, and `ProductModel`'s `onTap`.
- Produces:
  ```ts
  // RingControls.tsx — rendered as Showroom children
  export function RingControls(p: { count: number; selected: number | null; focusTarget: (i: number) => THREE.Vector3; onFaced: (i: number | null) => void; onSelect: (i: number | null) => void; reducedMotion: boolean }): JSX.Element;
  // Hero.tsx ("use client") — owns UI state; Task 7 adds the overlay into it
  export function Hero(p: { lang: Locale }): JSX.Element;
  // Hero state: faced: number | null, selected: number | null, tier: Tier
  ```
- **Behaviour (from the spec):**
  - **Ring mode:** drei `<CameraControls>` sits with the camera at `[0, EYE_HEIGHT, 0]` and the target `1e-4` ahead. Azimuth turns only: polar is locked near π/2, dolly and truck are off, and one-finger touch rotates.
  - **Facing:** in `useFrame`, `onFaced(facedIndex(headingFromAzimuth(azimuthAngle), count))`, called only when the value changes.
  - **Snap:** on the `rest` event in ring mode, call `rotateAzimuthTo(azimuthFromHeading(snapHeading(h, count)), !reducedMotion)`.
  - **Keyboard:**
    - `ArrowLeft` and `ArrowRight` rotate one slot.
    - `Enter` calls `onSelect(faced)`.
    - `Escape` calls `onSelect(null)`.
  - **Focus mode:** when `selected` is set, `setLookAt` puts the camera about 1.2 m from the product on the ring side, slightly above, with the target at `focusTarget(i)` (the centre of the product's world bounding box). Orbit is on, polar is limited to 30°–100°, and dolly works within a small range.
  - **Back to the ring:** restore the ring pose at the stored heading.
  - **History:** entering focus calls `history.pushState({ cwhFocus: id }, "", "#" + id)`. A `popstate` with no `cwhFocus` calls `onSelect(null)`. The back control (Task 7) calls `history.back()` when the state was pushed.
  - **Reduced motion:** read with `matchMedia("(prefers-reduced-motion: reduce)")`. It passes `false` for every transition argument, and `smoothTime` is 0.
  - **Tier:** chosen in `Hero` with `pickTier(readTierInput(navigator, gpu.tier))`, where `gpu` comes from drei `useDetectGPU` inside `Suspense`. If GPU detection throws or takes more than 2 s (its benchmark data comes from a CDN), use `gpuTier: undefined`. The dev-only `?tier=` override from Task 5 still applies.

- [ ] **Step 1: Write the failing e2e tests.** `Hero` exposes the state as `data-faced`, `data-selected` and `data-reduced-motion` attributes on its root element (`data-testid="hero"`), so the tests don't depend on WebGL picking.
  - `faces first product on load`: `/km` gives `data-faced="0"`.
  - `arrow turns to next product`: press `ArrowRight`, then wait for `data-faced="1"`.
  - `enter opens and escape closes`: `Enter` gives `data-selected="0"` and the URL hash `#crocodile-oil`. `Escape` gives `data-selected=""`.
  - `back button closes product view`: `Enter`, then `page.goBack()`. The URL is still `/km`, and `data-selected=""`.
  - `reduced motion disables transitions`: with `page.emulateMedia({ reducedMotion: "reduce" })`, `ArrowRight` gives `data-faced="1"` within 100 ms.
- [ ] **Step 2: Run them to see them fail.** `pnpm e2e`. Expected: the new tests fail.
- [ ] **Step 3: Implement `RingControls` and `Hero`.** Mount `Hero` in the page in place of the temporary `Showroom`.
- [ ] **Step 4: Run the tests again.** `pnpm e2e`. Expected: all pass. Then take a manual Playwright MCP check at 390×844: drag turns the view, letting go eases onto a product, and tapping the bottle flies in.
- [ ] **Step 5: Commit.** `feat: ring turning, snap, product focus and back navigation`

---

### Task 7: On-screen text, fallback list and loader

**Model:** sonnet

**Files:**
- Create: `src/scene/Overlay.tsx`, `src/components/ProductList.tsx`, `src/scene/webgl.ts`
- Modify: `src/scene/Hero.tsx`, `src/app/[lang]/page.tsx`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `Hero` state (Task 6), `dict` and `Locale` (Task 2), `products` (Task 3).
- Produces:
  ```ts
  export function Overlay(p: { lang: Locale; faced: number | null; selected: number | null; onOpen: (i: number) => void; onBack: () => void }): JSX.Element;
  export function ProductList(p: { lang: Locale; visible: boolean }): JSX.Element; // server-renderable; sr-only when !visible
  export function hasWebGL(): boolean; // try webgl2, then webgl
  ```
- **Behaviour:**
  - **Facing card:** while `faced !== null && selected === null`, show the name and size chips under the product (bottom-centre), and the `short` description sliding in from the side. On phones, the side card sits above the bottom card, not beside it.
  - **Focus panel:** while `selected !== null`, a panel shows the name, selectable size chips (local state, first selected by default), `long`, an order button and a back button.
    - The order button is disabled, with `dict.orderSoon` as its label hint.
    - The back button calls `onBack`.
    - The panel is a bottom sheet on narrow screens and a side panel at ≥ 768 px.
  - **Drag hint:** `dict.dragHint` shows until the first drag.
  - **Loader:** drei `<Loader />` shows while models load.
  - **Fallback list:** `ProductList` is always rendered in the page (server) for screen readers and search engines. It's visible when `hasWebGL()` is false or when an error boundary around the canvas catches a load error. In that case, the canvas and overlay aren't shown.
  - **Khmer line breaking:** text containers use `overflow-wrap: anywhere` so Khmer can't overflow.

- [ ] **Step 1: Write the failing e2e tests:**
  - `facing card shows product name`: within `getByTestId("overlay")`, the text of `products[0].text.km.name` is visible on `/km`, and the English name is visible on `/en`. Scope to the overlay, because the `sr-only` list also contains the names and Playwright treats 1 px elements as visible.
  - `focus panel has sizes and disabled order`: press `Enter`. The `25ml` and `46ml` buttons are visible, and the order button is disabled.
  - `no horizontal overflow at 360px in km`: with the viewport at 360×740 on `/km`, after `Enter`, `document.documentElement.scrollWidth <= 360`.
  - `model load failure shows product list`: with `page.route("**/*.glb", r => r.abort())`, `getByTestId("product-list")` gets `data-visible="true"` and contains both product names.
- [ ] **Step 2: Run them to see them fail.** `pnpm e2e`. Expected: the new tests fail.
- [ ] **Step 3: Implement it.** Use only Tailwind; no new UI libraries.
  - **Panels:** light translucent panels with `backdrop-blur`.
  - **Name:** product names follow the thin-grey plus bold-blue heading style (for example ប្រេង**ក្រពើ**). Store the split as `name` plus an optional `nameEmphasis` suffix in `ProductText`, and update Task 3's type and test.
  - **Chips and button:** size chips are outlined in `brand`, and the selected chip is filled `brand`. The order button is `brand` filled.
- [ ] **Step 4: Run the tests again.** `pnpm e2e`. Expected: all pass.
- [ ] **Step 5: Commit.** `feat: product cards, focus panel, fallback list and loader`

---

### Task 8: Phone-size visual pass

**Model:** opus

**Files:**
- Modify: `src/scene/ring.ts` (constants only), `src/products.ts` (`displayScale` only), and scene components (lighting and materials only)
- Create: `docs/screenshots/round1-*.png`

- [ ] **Step 1: Screenshot both tiers.** At 390×844 and 1440×900, screenshot `/km` with `?tier=high` and `?tier=low` in three states: ring, facing each product, and focused on each product.
- [ ] **Step 2: Tune by eye.**
  - A faced product fills about 35–45% of the viewport height on the phone.
  - The other product isn't visible while one is faced.
  - Cards don't cover the product.
  - Adjust `RING_RADIUS`, `EYE_HEIGHT`, `displayScale` and the fov.
  - If you change a ring constant, update `ring.test.ts` (Task 4) to match, then re-run `pnpm test`.
- [ ] **Step 3: Check the jar's colour.** Compare the Miracle Lady jar under the sky with `C:\Users\SL\Desktop\CWH-site\3d\products\miracle-lady-cream-jar\ref\photo.jpg`. If the cream colour is clearly off, **don't edit CWH-site**. Note it for the owner, with a screenshot, in the final report.
- [ ] **Step 4: Check the download sizes.** In the Playwright network log for `/km?tier=low`, the total of `.glb` + `.jpg` + JS is below 4 MB. Record the high and low totals in the commit message.
- [ ] **Step 5: Verify.** `pnpm test && pnpm e2e`. Expected: all pass.
- [ ] **Step 6: Commit.** `style: tune ring layout for phones` (include the size totals).

---

### Task 10: GitHub CI (runs right after Task 2)

**Model:** sonnet

Run this task immediately after Task 2, before Task 3. It's numbered 10 only because it was added after the plan was written.

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `package.json` (add a `typecheck` script), `playwright.config.ts` (WebGL launch flags)

**Interfaces:**
- Produces: the CI workflow named `CI`, with one job `check`. Task 9 waits on it before deploying.
- Produces: `pnpm typecheck` (`tsc --noEmit`).

- [ ] **Step 1: Make WebGL reliable in headless Chromium.** Recent Chromium no longer falls back to SwiftShader on its own. In `playwright.config.ts`, set `use.launchOptions.args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"]`. Every WebGL test from Task 5 on depends on this, locally and in CI.
- [ ] **Step 2: Add the `typecheck` script.** Then run `pnpm typecheck`. Expected: it exits 0.
- [ ] **Step 3: Write `.github/workflows/ci.yml`.**
  - **Triggers:** `push` to `main` and `pull_request`, with `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`.
  - **Job `check`** on `ubuntu-latest`, with a 20-minute timeout and env `SKIP_ENV_VALIDATION: 1` (T3's env check; there are no env vars this round). Steps, in this order:
    1. `actions/checkout@v4`
    2. `pnpm/action-setup@v4`
    3. `actions/setup-node@v4` with `node-version: 24` and `cache: pnpm`
    4. `pnpm install --frozen-lockfile`
    5. `pnpm lint`
    6. `pnpm typecheck`
    7. `pnpm test`
    8. `pnpm exec playwright install --with-deps chromium`
    9. `pnpm e2e`
  - **On failure:** upload `playwright-report/` with `actions/upload-artifact@v4` (`if: failure()`, retention 7 days).
  - **Package manager:** add `"packageManager": "pnpm@<installed version>"` to `package.json` so `pnpm/action-setup` picks the same version.
- [ ] **Step 4: Rehearse the CI steps locally.** With `CI=true SKIP_ENV_VALIDATION=1`, run steps 4–9 in the same order locally (`--frozen-lockfile` included). Expected: every step passes. Then validate the workflow syntax with `pnpm dlx @action-validator/cli .github/workflows/ci.yml`. Expected: no errors.
- [ ] **Step 5: Commit.** `ci: lint, typecheck, unit and e2e tests on GitHub Actions`

The first real CI run happens on the push in Task 9.

---

### Task 9: Go live on Railway

**Model:** sonnet (the controller runs this one; it needs the owner)

**Files:** none, unless the deploy surfaces a fix.

- [ ] **Step 1: Pre-flight.** `pnpm build && pnpm start` locally with `PORT=4123`. `curl -I localhost:4123/km` returns 200.
- [ ] **Step 2: Owner logs in.** Ask the owner to run `! gh auth login` and `! railway login`.
- [ ] **Step 3: Owner approves the push.** Show `git log --oneline origin/main..main` (or the full log if the remote is empty) and ask: "OK to push `main` to `gnol-123/Chop-Wah-On-Website`?" Push only on a yes.
- [ ] **Step 4: CI goes green.** Run `gh run watch` on the push's `CI` run. Expected: the `check` job passes. If it fails, fix it before deploying.
- [ ] **Step 5: Owner connects Railway.** In the Railway dashboard, they create a project and deploy from GitHub repo `gnol-123/Chop-Wah-On-Website`, then turn on **Wait for CI** in the service settings so a red build never deploys. Then they generate a domain. Then run `railway link` locally so the logs are readable.
- [ ] **Step 6: Verify live.** `railway logs` shows `Ready`. Then:
  - `curl -I https://<domain>/` gives a 307 to `/km`.
  - `/km` and `/en` return 200.
  - Run the Playwright smoke suite against the domain: `PLAYWRIGHT_BASE_URL=https://<domain> pnpm e2e` (`playwright.config.ts` reads that variable and skips `webServer` when it's set).
- [ ] **Step 7: Owner checks a real phone.** Ask the owner to open the domain on a real phone and report how it looks and feels.

---

## Self-review notes

- **Spec coverage:**
  - Experience states: Tasks 6–7. Header and footer: Task 2. Sky and water: Task 5. Pedestals placed by code: Task 5.
  - Device tiers: Tasks 3, 4 and 5. Runtime downgrade: Task 5.
  - i18n and font: Task 2. Accessibility (keys, reduced motion, fallback): Tasks 6–7.
  - Loading: Task 7. Jar check: Task 8. Deploy: Task 9. Placeholder copy: Tasks 2–3.
- **Deviation from the spec:** the logo comes from the tracker's `frontend/public/logo.png` instead of a blank placeholder. It's the team's real logo, and the owner can swap it.
- **Deviation from the spec:** Node is pinned to 24 LTS on Railway, not 26, so the deploy runs on a long-term-support Node.
