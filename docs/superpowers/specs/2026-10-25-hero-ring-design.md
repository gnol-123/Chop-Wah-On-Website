# Chop Wah On site: 3D product ring (round 1)

## Intent

Customer-facing site for Chop Wah On. The landing page puts the visitor in a 3D scene: they stand in the centre of a ring of products, under an open blue sky, with the products on low bases at the water line. They turn to look around. The products are the owner's own 3D models, built to match the real packaging. The site is mainly in Khmer, with English as the second language, and is designed phone-first.

Round 1 is the landing page only, live on Railway. Ordering, payment and the tracker link come later, and round 1 must not block them.

## Goals (round 1)

- New T3 project in this repo, live on Railway.
- Landing page with the 3D product ring. Built phone-first, and works on desktop too.
- Quality adjusts to the device: full-res models and effects on capable phones, a compressed version on weaker ones.
- Khmer and English, with Khmer as the default.

## Non-goals (round 1)

- Cart, checkout, ABA PayWay, posting to the sales tracker.
- Supabase, database, auth. Nothing gets connected this round.
- Pages other than the landing page.
- New 3D models. Only the two finished ones are used.

## Anti-goals

- **Fake paid orders.** In later rounds, the tracker only receives orders that PayWay's server-to-server callback has confirmed, never ones a browser redirect reports.
- **Heavy or broken on phones.** A page that stutters on a mid-range Android phone, or downloads too much over mobile data, has failed.
- **Bad Khmer rendering.** No tofu boxes, broken subscripts or clipped line height.
- **Products that look fake.** No grey chrome from a missing environment map, and no white glass from nothing behind it. See `CWH-site/3d/README.md`.

## Experience

There are three states. The mockup is `.superpowers/brainstorm/*/content/hero-flow.html`. Its colours are placeholders (see "Look"); the scene is sky and water.

1. **Ring.** The camera sits at the centre, at eye height just above the water, and only turns left and right. Dragging (mouse) or swiping (touch) turns the view. Products sit on low bases spaced evenly around the ring, standing in calm blue water under the sky. With two products, they face each other across the ring.
2. **Facing.** When a product is roughly centred in view, a floating label appears: its name in a stylised face above, the short description to the left and the detail to the right. On phones both sit below the product. The descriptions emerge from behind the product. Tapping the name opens it. Looking away hides the label.
3. **Product.** Clicking or tapping a product flies the camera in, and dragging now orbits the product. A panel shows the name, selectable size chips, a longer description and an order button. The order button is visible but does nothing this round. A back control, or Escape, returns to the ring at the same heading.

The header has the logo top-left and the `ខ្មែរ | EN` switch top-right. There's a minimal footer. All text is real page text, never drawn into the canvas.

## Decided by the owner

- **Stack:** T3 via `create-t3-app`: Next.js (App Router), TypeScript, Tailwind and tRPC. No ORM and no NextAuth this round. tRPC stays even though it has no procedures yet; remove the example router.
- **Hosting:** Railway. One service runs the Next.js server (frontend and API). Round 1 goes live there.
- **Scene:** a blue, dreamy sky with soft clouds (a code shader dome), with the products on low bases at the water line. Exposure is held low (0.8) so the sky and products are not bright.
- **Bases:** the code places them. Products are spaced evenly and re-spaced as products are added.
- **Device quality:** phones are the main target. Capable devices get full-res, and weaker ones get a compressed version.
- **Later rounds:** ABA PayWay for payment (KHQR and cards). On a verified PayWay callback, our server posts the order to the sales tracker. Supabase is on standby for auth or storage. Its likely first job is recording processed PayWay transactions, so duplicate callbacks don't post duplicate orders.
- **Product data (later):** the sales tracker database holds products and prices, and becomes the source of truth for them.
- **Content:** the owner writes the Khmer and English copy. Until then, use clearly marked placeholder copy.
- **Git:** the owner allows commits in this repo during implementation, so commit after each task. Pushing to GitHub happens only at the deploy step, and only with the owner's go-ahead at that point.

## Builder's calls (decided by Claude, owner can override)

- **3D library:** React Three Fiber and drei, not `<model-viewer>`. `HANDOFF.md` chose model-viewer for a single-model hero, but a scene with several models and a camera rig needs a proper scene graph.
- **Sky and water:** built in code with no extra download: a code-built shader dome for the sky (blue, soft clouds), and three.js `Water` (`three/examples/jsm/objects/Water`) for the reflective surface, with its normals texture. The same sky also lights the products through drei `<Environment>` rendering the same dome into an environment map, so chrome and glass reflect the sky they sit under. The water reflects it too. This replaces `studio.hdr` on the site.
- **Re-check the models under the sky:** the jar's cream colour was matched to the photo's cyan backdrop. Look at both products in the sky scene. If the jar looks off, its fix happens in `CWH-site` (re-tune `CREAM_BASE` in the jar's `build.py`). Flag it to the owner; don't edit `CWH-site` without asking.
- **Assets:** copy `crocodile-oil-46ml.glb` and `miracle-lady-cream-jar.glb` from `C:\Users\SL\Desktop\CWH-site\models\` into `public/models/`. The modelling pipeline stays in `CWH-site`. The GLBs require `EXT_texture_webp` and use transmission, volume and IOR, all of which the three.js `GLTFLoader` supports.
- **Device tiers:** two tiers, `high` and `low`.
  - **Choosing the tier, before load:** `low` if Save-Data is on, the connection is slow (`navigator.connection.effectiveType` is `2g` or `3g`), `navigator.deviceMemory` is 4 or less, or the GPU tier from drei's `useDetectGPU` is 1 or less. Otherwise `high`. Browsers without these APIs default to `high`, except iOS Safari, which uses the GPU tier only.
  - **What `low` changes:** compressed models (`*.low.glb`), a lower device pixel ratio cap, the water reflection replaced by a cheap tinted plane with a fresnel look, and a lower-resolution environment map.
  - **While running:** drei `PerformanceMonitor` drops `high` to `low` effects (pixel ratio and water first) if the frame rate stays low. It never re-downloads models mid-session.
  - **Compressed models:** generated by a committed script using `@gltf-transform/cli` (meshopt geometry plus smaller WebP textures). The outputs are committed beside the originals.
- **Scale:** models are true-scale metres (the bottle is about 13 cm tall). Each product gets a display scale so it reads well when faced. Starting defaults are a ring radius of 3 m and a base top at 0.06 m. Tune by eye on a phone screen.
- **Facing:** the product nearest the view direction, within a threshold angle, counts as faced. Turning is free, with a gentle magnet: letting go close to a product pulls the view onto it, and the camera zooms in very slightly while one is faced. Dragging has light inertia.
- **Bases:** a low shape built in code under each product. Later pass (owner): themed bases per product, pearls and clam shells for Miracle Lady, leaves for Crocodile Oil.
- **i18n:** an `app/[lang]/` route segment with `km` and `en`, where `/` redirects to `/km`. One plain dictionary per locale, no i18n library. `<html lang>` is set per locale. Switching language keeps the visitor on the same page.
- **Khmer font:** Kantumruy Pro via `next/font/google`, which covers Khmer and Latin. Line height must be generous enough for Khmer subscript consonants.
- **Product file:** one typed TS file listing each product with its id, model paths (full and low), display scale and ring order, plus its name, short description, long description and sizes in each locale. It stands in until the tracker supplies sizes and prices.
- **Accessibility:** arrow keys turn the ring, Enter opens the faced product, and Escape goes back. `prefers-reduced-motion` turns fly-ins into cuts. If WebGL fails, show the products as a plain list with the same text.
- **Loading:** show a progress indicator while models load. The canvas is client-only (a `dynamic` import with no SSR). The header, footer and product text render on the server.
- **Package manager and Node:** pnpm, which is installed. Node 26 locally, with the Node version pinned for Railway.
- **Tests:**
  - **Unit (Vitest):** the ring maths (placement angles, faced-product detection, wrap-around) and tier selection.
  - **Smoke (Playwright):** the page loads in both locales, the canvas is present and the language switch works.
  - **By hand:** on a real phone, after deploy.
- **Deploy:** Railway with a GitHub source, from repo `gnol-123/Chop-Wah-On-Website`. Neither the Railway CLI nor `gh` is installed. The owner connects the repo in the Railway dashboard. The builder prepares the config (Node version, build and start commands, `PORT`), then asks the owner before pushing.

## Sales tracker facts (read 2026-10-25, for later rounds)

Repo: `C:\Users\SL\Desktop\Chop-Wah-On sales tracking\ChopWahOn-Sales-Tracking`. We only read it, never edit it.

- **Stack:** an Express backend on Railway, using Firestore via firebase-admin. There are two brands, `cwo` and `health`, each with its own collections (`products` / `products_health`, `orders` / `orders_health`).
- **Products:** a product doc is `{ name: { en, km }, unitPrice, sku, active }`. Each product has one price and no sizes field, so each size is presumably its own product doc (for example 25ml and 46ml). The site will map each size chip to a tracker product id.
- **Orders:** the tracker's own frontend creates orders by writing to Firestore directly (`frontend/src/orders/saveOrder.ts`). The backend's `/orders` routes only hand out order numbers and send push notifications, and every route needs a Firebase staff login.
- **What's missing:** today there's no route the website can post an order to. The ordering round needs a new server-to-server route on the tracker backend. The website would sign in to it with a shared secret or a service account, and the route would hand out the order number, write the order and notify staff. That's a change to the tracker repo, planned there.

## Look (from the owner's reference post)

Reference: the owner's Pchum Ben promo post on the Chop Wah On Cambodia Facebook page (5 images, saved locally during brainstorming). The site follows its look.

- **Background:** a pale, misty blue-grey, sampled at `#dfeaeb` fading to `#c7d9dd`, with a soft blurred palm-leaf shadow. The scene sky is its own: blue, dreamy, with soft clouds.
- **Brand blue:** `#2385b1` (deep) and `#3094bf` (lighter). Used for emphasis words, prices and buttons.
- **Text:** dark slate grey, about `#5a6a70`, with a lighter grey for secondary text.
- **Panels:** light and airy (white or pale, slightly translucent), not dark. This replaces the dark mockup and its gold accent.
- **Khmer headings:** the post pairs one thin grey word with one bold blue word (ឈុត**ធំ**, ម៉ាស់**បិទមុខ**). Use the same weight and colour contrast for product names and headings. Kantumruy Pro has the weights for it (300 and 700).
- **Logo:** a blue circle with the gold handshake (Shake Hand Brand). The owner will put the file in the repo.
- **Not used:** the festive bunting and the "ប្រូម៉ូសិន ភ្ជុំបិណ្ឌ" badge. They're seasonal promo decorations, not the brand.

**Product facts from the post:**
- **Crocodile Oil:** Khmer name ប្រេងក្រពើ, sizes 25ml and 46ml.
- **Miracle Lady Cream:** Khmer name គ្រីមគុជខ្យង, sizes 3g and 30g.

## Left to the builder

- Visual styling within the "Look" section above.
- Camera easing curves and exact thresholds.
- Panel layout on narrow screens.
- Project file layout.

## Open (owner)

- **Logo:** the owner will put the logo file in the repo.
- **Copy:** final Khmer and English text for both products.
- **Brands:** whether the site covers CWO, CWO Health or both (from `HANDOFF.md`).
