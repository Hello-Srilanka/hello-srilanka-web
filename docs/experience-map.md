# Sri Lanka arrival experience

The landing page's existing “02 — EXPERIENCE” introduction now leads into a scroll-controlled arrival at Bandaranaike International Airport and an interactive dimensional map. The original headline, fonts, palette, navbar, planner links, five following story panels and editorial experience browser are retained.

## Files

Created:

| File | Purpose |
| --- | --- |
| `components/experience-map/SriLankaExperience.tsx` | Introduction, map composition, semantic destination buttons and keyboard/touch interaction |
| `components/experience-map/useExperienceScroll.ts` | GSAP scrubbed timeline, pin, skip action, reduced-motion branch and cleanup |
| `components/experience-map/IslandArtwork.tsx` | SVG fallback, airport, airplane, route, ocean and lazy WebGL lifecycle |
| `components/experience-map/createIslandScene.ts` | Three.js extruded coastline and low-poly highlands; on-demand rendering for visibility and resize |
| `components/experience-map/DestinationCard.tsx` | Persistent hover/focus/tap card using existing photos and a real page anchor |
| `components/experience-map/DestinationRoutes.tsx` | Dotted SVG routes and moving arrowheads from BIA to all destinations |
| `components/experience-map/experience-map.module.css` | Scoped responsive styling |
| `lib/experience-map/destinations.ts` | 33 typed destinations plus airport coordinates |
| `lib/experience-map/coastline.json` | Locally stored, simplified island boundaries |
| `lib/experience-map/geography.ts` | Shared geographic projection, elevation and marker collision separation |
| `lib/experience-map/flight.ts` | Desktop/mobile cubic flight routes, arc-length lookup and tangent heading |
| `lib/experience-map/destinationRoutes.ts` | Geographic onward curves, arc-length lookup, arrow headings and post-landing timing |
| `lib/experience-map/SOURCES.md` | Coordinate references, coastline provenance and attribution |
| `tests/experience-map.test.cjs` | Geographic coverage, camera/projection alignment, landing, tangent and marker separation tests |
| `tests/experience-map.browser.cjs` | Production browser integration and screenshot checks |
| `docs/experience-map.md` | This implementation record |

Modified: `app/page.tsx`, `package.json`, `package-lock.json`.

Added dependencies: `three@^0.186.1` and development types `@types/three@^0.186.0`. GSAP and Lenis were already installed. The Three.js module loads near the section; no extra React renderer, camera controls, model downloads, mapping APIs or post-processing libraries are used.

## Scroll stages

| Progress | Behavior |
| --- | --- |
| 0–14% | Existing large headline establishes the chapter |
| 14–46% | Headline gently moves/scales/fades |
| 22–70% | Aircraft follows the drawn curved route, rotates with its tangent and slows into BIA |
| 25–58% | Island and ocean become visible independently of the aircraft |
| 42–69% | “The journey begins here” bridges the typography and map |
| 57–75% | Airport label/runway arrive; restrained touchdown ring |
| 65–83% | Final heading and island composition settle |
| 70.5–94% | Dotted routes draw from BIA to all 33 destinations, with tangent-aligned arrowheads |
| 74–94% | Destination markers appear progressively |
| 94–100% | Map controls become interactive; normal scrolling then continues into the existing stories |

Desktop/tablet pin distance is 340vh; phone distance is 280vh, plus the visible stage. Scrub smoothing is 0.45 seconds. There is no autoplay flight or wheel interception in the map. Reverse scrolling retraces the flight and retracts the onward routes. The controller supports an optional skip control, but does not require it to be present.

Each onward route starts at the exact BIA landing point and ends at the destination's geographic anchor. Dotted lines reveal with an SVG mask while arrowheads move along the same curve at the revealed distance. Nearby routes finish first, followed by longer journeys; every route finishes before map interaction begins. All 33 routes remain available; selecting a place emphasises its route. Reduced motion shows the completed routes immediately. The same overlay works with WebGL and the SVG fallback, without adding dependencies or frame-by-frame React updates.

The reported stationary-aircraft issue was reproduced at a 600px viewport height: a short-viewport condition had chosen the static branch. That condition was removed. Only `prefers-reduced-motion` selects the static experience. Aircraft opacity is also independent of the island reveal, and phones use a shorter approach so the plane enters the visible area earlier.

## Destinations

- Arrival: Bandaranaike International Airport / Katunayake.
- Culture: Colombo, Kandy, Anuradhapura, Polonnaruwa, Jaffna, Galle, Dambulla, Sigiriya, Temple of the Tooth, Galle Fort.
- Hill country: Nuwara Eliya, Ella, Haputale, Adam's Peak / Sri Pada.
- Wildlife: Yala, Udawalawe, Wilpattu, Minneriya national parks and Pinnawala.
- Coast: Negombo, Bentota, Hikkaduwa, Unawatuna, Mirissa, Weligama, Hiriketiya, Arugam Bay, Pasikuda, Trincomalee.
- Nature: Horton Plains, Knuckles Mountain Range, Sinharaja Rainforest, Kitulgala.

Marker separation keeps 27px between hit-target centres. Fine leader lines retain the true geographic anchor. All 33 destinations remain visible and can be selected directly on the map. There are no existing destination detail routes, so cards link to `#experiences`.

## Mobile, accessibility and fallback

- Responsive compositions at 375, 390, 768, 1024, 1440 and 1920px; compact layouts also support a 600px-tall desktop viewport.
- Hover, focus and tap open the same card. Markers lift and scale to 1.13. Enter moves focus into the card; Escape closes it and restores marker focus. Closing a card does not reopen it through its focus handler.
- All destinations have named HTML buttons. An announced description, visible focus outlines and a keyboard help description accompany the map. Unrevealed controls are inert.
- Reduced motion uses normal document flow, a stationary aircraft at BIA and immediately available map controls.
- WebGL unavailability, context loss or lazy scene import failure retains the SVG map and HTML controls. With JavaScript disabled, the original introduction, SVG island and a semantic list of all destination descriptions remain available.
- There are no drag or zoom controls to capture page-scroll gestures.
- Geometry/materials, observers, listeners and GSAP media contexts are disposed on unmount. WebGL renders on demand while visible; animation updates DOM/SVG refs rather than React state every frame.

## Verification

Verified 2026-09-29:

- `npm run typecheck`: passed.
- `npm run build`: passed; all existing routes generated.
- `npm test`: 23/23 passed, including ten map regression tests.
- `npm run lint`: zero errors; three existing unused-import warnings in `components/Hero.tsx` and `components/ExperienceStory.tsx`.
- Production Chromium and WebKit: all six requested widths plus 1440×600 passed; no runtime/hydration console errors or horizontal page overflow.
- Verified continuous wheel scrolling, a Chromium touch swipe, exact landing, reverse scrolling, skip, release into all five existing stories, hover/tap, keyboard card access, Escape/focus restoration and direct marker selection.
- Both engines passed reduced-motion layouts at 390 and 1440px, simulated WebGL absence and a no-JavaScript destination list.
- Direct localhost:3000 wheel checks at heights 600, 820 and 1000px showed changing airplane transforms and no errors.

Browser tests use Playwright externally, following the repository's existing `PLAYWRIGHT_MODULE` convention. Run a production build on port 3002, then:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright node tests/experience-map.browser.cjs
PLAYWRIGHT_MODULE=/path/to/playwright TEST_BROWSER_ENGINE=webkit node tests/experience-map.browser.cjs
```

Use `TEST_BASE_URL` for a different server and `TEST_ARTIFACTS` for a screenshot output directory.

## Limits

Terrain is symbolic, not measured elevation; park markers represent areas, not navigation entrances. There is no free camera rotation or zoom. Browser verification uses desktop engines and emulated mobile viewports, not physical phones, and is not a measured 60fps guarantee. Existing development-only reduced-motion hydration diagnostics in the untouched `PersonalizationExperience.tsx` remain; production checks emitted none. No deployment or Git commit was performed.


## Supplied map images

The procedural landmark meshes and SVG sculptures have been removed. Map artwork now uses the 31 user-provided PNGs under `public/images/map/`, explicitly mapped in the existing destination records. Spelling variants (Seegiriya, Nuwaraeliya, Knuckels, Hortan Plains, Hirikatiya, Arugambay and Temple of tooth) map to the corresponding destination IDs.

All 31 files are used. Galle Fort shares `Galle.png`; Unawatuna has no supplied image and retains a plain marker. There are 32 image-backed destinations and 33 accessible destination controls. The generated airport terminal has also been removed; the original animated airplane and runway remain.

`LandmarkArtwork.tsx` renders transparent image overlays anchored through the existing geographic/collision layout. The same image layer works above both the WebGL island and the SVG island fallback. Hover, focus and tap share the existing selection/card behavior. CSS handles the subtle engagement lift; the existing scroll controller handles staggered reveal and reverse scrolling.

LOD: 32 images at >=1024px, 20 at 768–1023px, 15 primary images below 768px. Other destinations retain ordinary markers. The source PNGs are unchanged. Run `node scripts/prepare-map-images.mjs` after replacing a source image to regenerate the corresponding 160px, alpha-preserving WebP thumbnail. The marker uses these local thumbnails directly, avoiding the full-resolution PNG download and the site's photograph-specific image loader.

Removed: `lib/experience-map/landmarkModels.ts` and `components/experience-map/landmarks/createLandmarkLayer.ts`. Three.js now renders only the island on resize/visibility changes. There are no landmark textures, meshes, model downloads or idle animation loops.

## Ocean motion and enlarged composition

The map frame is enlarged together with the aircraft, routes and destination images, with separate placement for narrow and short viewports. `OceanWater.tsx` adds a coastline-masked teal wash, three staggered outward ripples and twelve slow current strokes. CSS drives the movement; an IntersectionObserver pauses it offscreen and a visibility listener pauses it in hidden tabs. Reduced motion renders static water. The water sits behind the canvas/SVG island and cannot intercept marker or card interactions. No WebGL render loop or additional dependency is needed.
