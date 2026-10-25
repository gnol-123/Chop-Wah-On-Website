# Dreamy Scene (Round 1.5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the hero scene's look: a blue, dreamy sky with clouds, retuned water, products sitting on a small base at the water line instead of a column, a more realistic render, and text that pops up beside the product you're looking at.

**Architecture:** Same R3F scene. The drei `<Sky>` is replaced by a code-built sky dome (gradient plus shader clouds), which also feeds the environment map and the water's reflection. `Pedestal.tsx` becomes `Base.tsx`, a low disc at the water line; the camera drops so the products fill the view. The faced-product card moves out of the screen corners into a drei `<Html>` callout anchored beside the product in 3D (still real DOM text).

**Tech Stack:** Next.js 15, React Three Fiber 9, drei 10, three 0.186, Tailwind 4, Vitest, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-25-hero-ring-design.md`, overridden by the owner's feedback below. Task 4 updates the spec to match.

## In plain English

The owner looked at round 1 and asked for four changes:

1. **Sky.** It's a white haze. It should be a blue sky with clouds, dreamy.
2. **Water.** Fine, could use a bit of tweaking.
3. **Bases, not pedestals.** Each product sits on a little base on top of the water, not a tall column. The whole render should look more realistic.
4. **Text pops up.** While looking around, the text for the product you're facing pops up next to it.

Then the owner flagged that the Miracle Lady jar is the old model (mint cream, wrong proportions). The improved jar exists only as ingredients in the 3D workspace, so we build a new jar file from them and swap it in.

We do it in six steps, each ending with a commit (step 4 happens in the 3D workspace, which has no git):

1. **Sky and water.** Paint a blue sky with soft clouds in code (no image download), make the water bluer to match, and retune the sun and fog so it all feels like one dreamy place.
2. **Bases and realism.** Swap the columns for a low disc sitting at the water line, lower the camera so the products fill the view, and add soft shadows so the products feel like they're really standing there.
3. **Pop-up text.** When you face a product, a card with its name, short description and sizes pops up beside it in the scene. Tap it to open the product. It goes away when you turn.
4. **New jar model.** In the 3D workspace, build a new jar file with the true shape (56 mm tall), the neutral pearl cream and the corrected cap, following the workspace's handoff.
5. **Jar on the site.** Copy it in, make the phone version, re-check its size next to the bottle, and check its colours under the new sky.
6. **Check and tune.** Look at it on phone and desktop sizes, both quality levels, tune by eye, and update the design doc.

Not doing: the handoff's optional Part C (porting the jar's ray tracer into the scene). It's a big job, heavy on phones, and the new GLB fixes the reported problems. Revisit if the GLB still doesn't read as thick acrylic.

## Global Constraints

- **Branch:** `feat/dreamy-scene`. Commit at the end of every task with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **Never push**, amend, or rewrite history.
- **Package manager:** pnpm. **No new dependencies.** Everything here is three, drei and CSS.
- **Never read `.env` files.** Never edit the sales tracker. In `C:\Users\SL\Desktop\CWH-site` only Task 4 writes, and only the files it names. CWH-site has no git.
- **Text:** all user-visible text is real DOM text from `src/i18n.ts` / `src/products.ts`, never drawn into the canvas. drei `<Html>` counts as DOM.
- **Sky:** built in code, no texture download. One sky source drives the visible sky, the `<Environment>` map, and the water's reflection.
- **Palette (UI):** `mist` `#dfeaeb`, `brand` `#2385b1`, `ink` `#5a6a70`, `ink-soft` `#8a9aa0`. Panels white/pale translucent, never dark.
- **Tiers:** `high` and `low` (`src/scene/tier.ts`). Shadows and mirror water are high-only. `?tier=high|low` forces a tier in dev.
- **Dev server:** one is already running at `http://localhost:3000` (hot reload). Use it; don't start another. Check visuals with the Playwright MCP browser at 1280×800 and 390×844, and save screenshots under `.playwright-mcp/` (gitignored).
- **Checks before each commit:** `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass. `pnpm e2e` before the Task 3 and Task 4 commits (it builds and serves on port 3000, so stop the dev server first or set `PLAYWRIGHT_BASE_URL=http://localhost:3000` to test against it).

## Review Focus

1. **Callout clipped on a 360 px phone in Khmer.** The canvas wrapper hides overflow, so a callout that runs off-screen is silently cut. Expected: fully on screen. Pinned in Task 3 (`callout fits at 360px in km`).
2. **Callout left behind.** Turning away or opening the product must remove it, never leave it over the focus panel. Pinned in Task 3 (`callout follows the faced product`).
3. **Callout is the tap target.** The bottom name card goes away, so the callout must open the product. Pinned in Task 3 (`tapping callout opens product`).
4. **Environment map misses the sky dome.** If the dome sits outside the env cube camera's far plane, glass and chrome reflect black. Pinned in Task 1 (screenshot check of the bottle's pump cap).
5. **Reduced motion.** The pop animation must not play. Pinned in Task 3 (`callout does not animate with reduced motion`).

---

### Task 1: Sky dome, water and light

**Model:** opus (shader work and art direction).

**Files:**
- Create: `src/scene/SkyDome.tsx`
- Modify: `src/scene/Showroom.tsx` (replace drei `<Sky>`, fog, light, sun), `src/scene/Water.tsx` (tint, sun colour)

**Interfaces:**
- Produces: `export function SkyDome({ sun }: { sun: [number, number, number] }): JSX.Element` and `export const HORIZON: string` (the sky's colour at the horizon, used for fog). `SUN` stays exported from `Showroom.tsx`.

- [ ] **Step 1: Build `SkyDome`**

An inside-out sphere with a `ShaderMaterial` (`side: BackSide`, `depthWrite: false`, `fog: false`). Radius 400, so it sits inside drei `<Environment>`'s cube camera far plane (1000) and the main camera's far (2000). Fragment shader, by view direction:
- Vertical gradient: soft cornflower zenith (around `#6fa8dc`) to a pale, slightly warm horizon (around `#e6f1f6`). Start from these and tune by eye.
- Soft sun glow toward `sun`, no hard disc.
- Clouds: fbm value noise projected onto a plane above the viewer (direction `xz / y`), so they flatten and thin toward the horizon. Puffy white tops, faint lavender-grey undersides, low-ish coverage so blue dominates. Fade clouds out below about 3° elevation so the horizon stays clean.
- Below the horizon: hold the horizon colour (only the water's reflection sees it).
- A `time` uniform drifts the clouds slowly via `useFrame`. Dispose geometry and material on unmount.

- [ ] **Step 2: Wire it into `Showroom`**

Replace both `{sky}` uses (scene and `<Environment>` children) with `<SkyDome sun={SUN} />`. Set fog to `HORIZON` and push it out so near water keeps its colour (start `args={[HORIZON, 30, 180]}`). Lower the sun to about 25–35° elevation, off to one side of slot 0 so its glint isn't hidden behind the first product. Warm the directional light slightly (around `#fff3e2`).

- [ ] **Step 3: Retune water**

In `Water.tsx`: `TINT` to a sky-matched blue (start around `#3f7894`), `sunColor` warm white, keep `distortionScale` gentle. The low-tier `TintedWater` uses the same `TINT`. Water should read clearly blue and reflect the sky and clouds, with the far edge melting into `HORIZON`.

- [ ] **Step 4: Verify visually**

Screenshot `/en?tier=high` and `/en?tier=low` at 1280×800 and 390×844 (wait ~12 s for models). Pass when: sky is visibly blue with soft clouds; water is blue and reflects the clouds (high tier); no seam at the horizon; the bottle's chrome pump cap reflects sky, not black (Review Focus 4); no console errors.

- [ ] **Step 5: Checks and commit**

Run `pnpm lint && pnpm typecheck && pnpm test`. Expected: all pass.

```bash
git add src/scene/SkyDome.tsx src/scene/Showroom.tsx src/scene/Water.tsx
git commit -m "feat: blue sky dome with clouds, bluer water"
```

---

### Task 2: Bases at the water line, lower camera, shadows

**Model:** sonnet.

**Files:**
- Create: `src/scene/Base.tsx`
- Delete: `src/scene/Pedestal.tsx`
- Modify: `src/scene/ring.ts`, `src/scene/ring.test.ts`, `src/scene/ProductModel.tsx`, `src/scene/RingControls.tsx`, `src/scene/Showroom.tsx`

**Interfaces:**
- Consumes: `SkyDome`, `SUN` from Task 1.
- Produces: in `ring.ts`, `BASE_TOP = 0.06` replaces `PEDESTAL_TOP` (every import renamed); `EYE_HEIGHT = 0.75`. `export function Base({ position, radius }: { position: [number, number, number]; radius: number })`.

- [ ] **Step 1: Write the failing test**

In `src/scene/ring.test.ts`:

```ts
test("products sit low and the eye sees over them", () => {
  expect(BASE_TOP).toBeGreaterThan(0);
  expect(BASE_TOP).toBeLessThan(0.15);
  expect(EYE_HEIGHT).toBeLessThan(1);
});
```

- [ ] **Step 2: Run it, expect FAIL** (`BASE_TOP` not exported)

Run: `pnpm test src/scene/ring.test.ts`

- [ ] **Step 3: Implement**

- `ring.ts`: rename the constant, set the two values above.
- `Base.tsx`: a low disc of `radius`, top face at `BASE_TOP`, extending ~4 cm below the water so it reads as sitting in it, with a small bevel or slight taper on the edge (a `LatheGeometry` profile or a short tapered cylinder). Pale ceramic/stone look: `meshPhysicalMaterial`, colour around `#eef2f1`, roughness ~0.35, light clearcoat. `receiveShadow`.
- `ProductModel.tsx`: use `Base` instead of `Pedestal`; product group at `BASE_TOP`. Set `castShadow` on every mesh of the cloned model inside the existing `useMemo` traverse.
- `RingControls.tsx`: the loading fallback target uses `BASE_TOP + 0.3`. Re-check `FOCUS_UP` and `FOCUS_LIFT` by eye now the products are lower.
- `Showroom.tsx`: `<Canvas shadows={!effectsLow}>`. Directional light `castShadow` with an orthographic shadow camera covering the ring (about ±4.5 m), `shadow-mapSize` 1024, a small `shadow-bias` / `shadow-normalBias` to avoid acne. The shadow should fall softly across the base's top.
- Delete `Pedestal.tsx`.

- [ ] **Step 4: Run the test, expect PASS**

Run: `pnpm test`

- [ ] **Step 5: Verify visually**

Screenshot as in Task 1. Pass when: each product stands on a low disc at the water line (no column); the product fills a good share of the frame at both sizes with the horizon near the middle; high tier shows a soft product shadow on the base; the water reflects product and base.

- [ ] **Step 6: Checks and commit**

`pnpm lint && pnpm typecheck && pnpm test`, all pass.

```bash
git add -A src/scene
git commit -m "feat: low bases at the water line, lower camera, soft shadows"
```

---

### Task 3: Pop-up callout beside the faced product

**Model:** sonnet.

**Files:**
- Create: `src/scene/Callout.tsx`
- Modify: `src/scene/ring.ts`, `src/scene/ring.test.ts`, `src/scene/ProductModel.tsx`, `src/scene/Showroom.tsx`, `src/scene/Hero.tsx`, `src/scene/Overlay.tsx`, `src/styles/globals.css`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `BASE_TOP`, `slotHeading`, `slotPosition` from `ring.ts`.
- Produces:
  - `export function calloutAnchor(index: number, count: number, offset: number, height: number): [number, number, number]` in `ring.ts`: the world point `offset` metres to the viewer's right of slot `index`'s centre (viewer stands at the origin facing the slot), at `BASE_TOP + height`.
  - `Callout({ product, lang, onOpen }: { product: Product; lang: Locale; onOpen: () => void })` in `Callout.tsx`.
  - `ShowroomProps` gains `lang: Locale`, `faced: number | null`, `selected: number | null`.

- [ ] **Step 1: Write the failing unit test**

In `src/scene/ring.test.ts`. Slot 0 is at `(0, 0, -3)`, viewer faces −Z, so "right" is +X. Slot at a quarter turn of 4 (`h = π/2`, at `(3, 0, 0)`, facing +X) has "right" = +Z.

```ts
test("calloutAnchor sits to the viewer's right of the slot", () => {
  const [x, y, z] = calloutAnchor(0, 2, 0.5, 1);
  expect(x).toBeCloseTo(0.5);
  expect(y).toBeCloseTo(BASE_TOP + 1);
  expect(z).toBeCloseTo(-RING_RADIUS);
  const q = calloutAnchor(1, 4, 0.5, 0);
  expect(q[0]).toBeCloseTo(RING_RADIUS);
  expect(q[2]).toBeCloseTo(0.5);
});
```

- [ ] **Step 2: Run it, expect FAIL** (`calloutAnchor` not exported)

Run: `pnpm test src/scene/ring.test.ts`

- [ ] **Step 3: Implement `calloutAnchor`**, run `pnpm test`, expect PASS.

- [ ] **Step 4: Write the failing e2e tests**

In `tests/e2e/smoke.spec.ts`. The callout carries `data-testid="callout"`. Update existing tests that look for the faced card's name/short text inside `overlay` to look inside `hero` instead (the callout renders inside the canvas wrapper, not the overlay).

```ts
test("callout follows the faced product", async ({ page }) => {
  await page.goto("/en");
  const hero = page.getByTestId("hero");
  await expect(hero).toHaveAttribute("data-faced", "0", LOAD);
  const callout = page.getByTestId("callout");
  await expect(callout).toHaveCount(1);
  await expect(callout).toContainText(products[0]!.text.en.short);
  await page.keyboard.press("ArrowRight");
  await expect(hero).toHaveAttribute("data-faced", "1");
  await expect(callout).toContainText(products[1]!.text.en.short);
  await page.keyboard.press("Enter");
  await expect(hero).toHaveAttribute("data-selected", "1");
  await expect(callout).toHaveCount(0);
});

test("tapping callout opens product", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByTestId("hero")).toHaveAttribute("data-faced", "0", LOAD);
  await page.getByTestId("callout").click();
  await expect(page.getByTestId("hero")).toHaveAttribute("data-selected", "0");
});

test("callout fits at 360px in km", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/km");
  await expect(page.getByTestId("hero")).toHaveAttribute("data-faced", "0", LOAD);
  const box = (await page.getByTestId("callout").boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  const header = (await page.locator("header").boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(header.y + header.height);
  expect(box.y + box.height).toBeLessThanOrEqual(740);
});

test("callout does not animate with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(page.getByTestId("hero")).toHaveAttribute("data-faced", "0", LOAD);
  const name = await page.getByTestId("callout").evaluate((e) => getComputedStyle(e).animationName);
  expect(name).toBe("none");
});
```

- [ ] **Step 5: Run them, expect FAIL** (no `callout` test id)

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm e2e -g callout`

- [ ] **Step 6: Implement the callout**

- `globals.css`: add `--animate-pop` (≈0.3 s, fade in from `scale(0.9)` and a few px down, ease-out, `both`) next to `slide-in`, and turn it off under `prefers-reduced-motion` the same way.
- `Callout.tsx`: drei `<Html>` with `zIndexRange={[4, 4]}` (under the overlay at z-5 and the header at z-10). Content: one `<button data-testid="callout">` with the `panel` look from `Overlay.tsx` (white/70, blur, rounded-2xl), `animate-pop`, containing `ProductName`, the short text, and the size chips. Clicking calls `onOpen`. Max width ~16rem desktop, `min(16rem, 80vw)` phone; Khmer must wrap (`[overflow-wrap:anywhere]`).
  - Placement: on `md` and up, anchored at `calloutAnchor(index, count, footprint + 0.15, modelHeight * 0.6)`, the card's left edge at the anchor, vertically centred. Below `md`, anchored above the product top (`calloutAnchor(index, count, 0, modelHeight + 0.1)`), card centred horizontally with its bottom at the anchor. Read the breakpoint with `matchMedia("(min-width: 48rem)")` and a change listener, same breakpoint as `RingControls`.
- `ProductModel.tsx`: takes `faced`, `selected`, `lang`; renders `<Callout>` when `faced === index && selected === null`. It already measures the model's box; also return `height` (box `size.y * s`).
- `Showroom.tsx` / `Hero.tsx`: pass `lang`, `faced`, `selected` through.
- `Overlay.tsx`: remove the faced card block (bottom name card and short-text side card) and the now-unused `faced`/`onOpen` props. Keep the drag hint and `Focus`.

- [ ] **Step 7: Run all e2e, expect PASS**

Run: `PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm e2e`. Expected: all pass, including the existing `no horizontal overflow at 360px in km`.

- [ ] **Step 8: Verify visually** at 1280×800 and 390×844, in `km` and `en`: the callout pops in beside (desktop) or above (phone) the faced product, disappears while turning between products, and never covers the header.

- [ ] **Step 9: Checks and commit**

`pnpm lint && pnpm typecheck && pnpm test`, all pass.

```bash
git add src tests
git commit -m "feat: pop-up callout beside the faced product"
```

---

### Task 4: Jar v2 GLB (in CWH-site)

**Model:** opus.

**Spec:** `C:\Users\SL\Desktop\CWH-site\3d\products\miracle-lady-cream-jar\HANDOFF-website.md`, **Part A only**, steps 1–7. Its values are binding.

**Files (all in CWH-site):**
- Create: `3d/products/miracle-lady-cream-jar/build_v2.py`
- Overwrite: `models/miracle-lady-cream-jar.glb` (copy the old one to `models/_exp/miracle-lady-cream-jar.v1.glb` first)
- Modify: `3d/README.md` (short note in the jar section)
- Leave `build.py` unchanged.

**Interfaces:**
- Produces: `models/miracle-lady-cream-jar.glb`, true-scale metres, Y up, base at origin, front +Z, 56 mm tall, 53 mm front-to-back, ~1–1.5 MB, extensions `EXT_texture_webp`, `KHR_materials_transmission`, `KHR_materials_volume`, `KHR_materials_ior`.

- [ ] **Step 1:** Write `build_v2.py` per Part A steps 1–5.
- [ ] **Step 2:** Run it; run `python 3d/lib/gltf.py` (self-checks pass).
- [ ] **Step 3:** `npx --yes @gltf-transform/cli@4.1.1 validate models/miracle-lady-cream-jar.glb` → no errors. Print the bounding box: height 0.056 m, depth 0.053 m (±0.5 mm). File size 1–1.5 MB.
- [ ] **Step 4:** Render a quick visual check (`3d/preview.html` or Blender) to confirm hollows, cream, cap, threads, foil and back print are present and oriented right. Colour is judged on the site in Task 5, not here.
- [ ] **Step 5:** README note. No commit (CWH-site is not a git repo).

---

### Task 5: Jar v2 on the site

**Model:** sonnet.

**Spec:** the same handoff, **Part B**.

**Files:**
- Overwrite: `public/models/miracle-lady-cream-jar.glb`, `public/models/miracle-lady-cream-jar.low.glb`
- Modify: `src/products.ts` (`displayScale` for `miracle-lady`)

**Interfaces:**
- Consumes: Task 4's GLB; the scene from Tasks 1–3 (sky dome, bases, callout).

- [ ] **Step 1:** Copy the GLB in; run `pnpm models:low` (regenerates `.low.glb`, validates).
- [ ] **Step 2:** Re-check `displayScale` (jar is ~9% taller): smaller than the bottle but clearly readable when faced.
- [ ] **Step 3:** Screenshot the jar faced at `?tier=high` and `?tier=low`, next to `C:\Users\SL\Desktop\CWH-site\product-pics\DSC01355.JPG`. Pass when the cream reads pale rose-white (not mint) and the cap rose-gold. If the cream is off, adjust its albedo in `build_v2.py` (brightness, slight pink, never cyan), rebuild, repeat Step 1.
- [ ] **Step 4:** `pnpm lint && pnpm typecheck && pnpm test`, all pass.
- [ ] **Step 5: Commit**

```bash
git add public/models src/products.ts
git commit -m "feat: miracle lady jar v2 model"
```

---

### Task 6: Tune by eye and update the spec

**Model:** sonnet.

**Files:**
- Modify: scene constants as needed (`ring.ts`, `SkyDome.tsx`, `Water.tsx`, `Showroom.tsx`), `docs/superpowers/specs/2026-10-25-hero-ring-design.md`

- [ ] **Step 1: Screenshot pass.** `/km` and `/en`, `?tier=high` and `?tier=low`, 1280×800 and 390×844, faced on each product plus one focus view. Tune only constants: colours, cloud coverage, fog range, `EYE_HEIGHT`, `RING_RADIUS`, focus distances, light intensity. Look for: a jar colour that looks off under the blue sky (flag it, don't edit `CWH-site`), shadow acne, the callout overlapping the drag hint.

- [ ] **Step 2: Update the spec.** In the design doc, replace pedestal language with bases at the water line; the sky becomes "blue, dreamy, with soft clouds, built as a shader dome" (drop "hazy and pale"); the faced card becomes the in-scene callout. Keep it short.

- [ ] **Step 3: Full checks.** `pnpm lint && pnpm typecheck && pnpm test && PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm e2e`, all pass.

- [ ] **Step 4: Commit**

```bash
git add src docs
git commit -m "style: tune dreamy scene, update spec"
```
