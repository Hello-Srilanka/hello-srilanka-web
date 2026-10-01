# Find Yours: chaos, rewind, planning, clarity

## Scope and integration

Only chapter 03's visual narrative and its handoff were redesigned. The existing headline, chapter navigation, typography and cream/forest/clay palette are retained. The landing-page interest preview now presents a compact image of the customer-format sample itinerary. The map, culture, story, memories and subsequent chapters are unchanged by this work.

`FindYours` now wraps the existing `PersonalizationExperience` passed from `app/page.tsx`. There is **one** compact portrait preview of the planner’s real PNG export, with full-size and download links. The animated choices remain illustrative; no customer draft or saved trip is overwritten.

Created:

- `components/find-yours/FindYoursExperience.tsx`: composition, accessible narrative, natural-flow fallback and live planner slot.
- `components/find-yours/JourneyScene.tsx`: reusable SVG map, routes, tabletop, laptop, suitcase, passport, preferences and phone.
- `components/find-yours/useFindYoursScroll.ts`: scoped GSAP/ScrollTrigger lifecycle and scrubbed sequence.
- `components/find-yours/find-yours.module.css`: scoped visual and responsive styles.
- `lib/find-yours/journey.ts`: sample routes derived from existing destinations and geography.
- `lib/planner/interests.ts`: existing planner interest data extracted for shared use.
- `tests/find-yours.browser.cjs`: browser integration coverage.
- This document.

Modified:

- `components/FindYours.tsx`: compatibility export for the new composition.
- `components/PersonalizationExperience.tsx`: shared interest import, SSR-stable image opacity and explicit button tab order for reduced-motion hydration.
- `app/page.tsx`: nests the existing preview inside the chapter's transition.

## Desktop sequence

One scroll trigger controls a 100-unit master timeline with **550vh of pinned travel**. No scene autoplay, wheel interception or additional animation clock is used. A paused sub-timeline represents the unplanned journey so exactly the same route, vehicle, indicators and pins run backwards during rewind.

| Timeline | Visual behavior |
| --- | --- |
| 0–17 | Original question establishes, then reduces toward the upper left. |
| 9–23 | Island emerges; suitcase and passport arrive near BIA. |
| 20–43 | BIA → Colombo → Ella → Galle → Kandy → Yala → Mirissa. Direct illustrative connectors cross and double back. A car follows the drawing path. |
| 43–49 | Complete freeze: six of seven day blocks fade, the budget strip is depleted, rain conflicts with a coastal activity. |
| 49–63 | Burnt-orange return arrow turns; route undraws, car reverses, pins recede, days/budget restore and weather clears. |
| 62–72 | Map shrinks into a laptop on a tabletop. Coffee, notebook, suitcase and passport establish the at-home reveal. |
| 72–82 | Nature, Culture and Wildlife select sequentially. Their icons move from the choices to matching map stops. Seven days and balanced pace appear as minimal inputs. |
| 79–87 | BIA → Kandy → Ella → Udawalawe → Mirissa → Galle draws in a continuous southbound sequence. Ordered days and activity icons assemble alongside it. Budget settles and all day blocks are available. |
| 86–93 | Same map and route move into the phone; the phone lifts, luggage closes and the passport moves toward it. |
| 93–100 | Laptop enlarges; its bezel leaves the frame while the actual planner DOM enlarges inside it. Controls unlock at the end. Pin releases directly into the same DOM and normal page flow. |

SVG connectors illustrate order, **not roads, journey estimates or transport routing**. Days, budget and weather are symbolic. This deterministic example adds no recommendation engine, live weather or fabricated prices.

## Responsive and accessible behavior

- Desktop/tablet enhancement requires width ≥768px, height ≥650px and no reduced-motion preference. Tablet omits the notebook. The itinerary retains its natural content height after pin release. A viewport-relative zoom origin and a scoped ResizeObserver keep the handoff and pin spacing correct as day accordions or export views change height.
- Narrow/short screens use an ordinary vertical sequence: question, messy map, rewind cue, home/preferences, clean route/day list, phone, actual planner. Optional CSS view-timeline entry motion is short and scroll-driven; unsupported browsers show the static content.
- Reduced motion uses the same meaningful static sequence, with no pin or rewind motion. Changing the OS preference or crossing breakpoints reverts GSAP styles and restores focusability.
- SVG scenes are decorative and `aria-hidden`. Equivalent HTML descriptions convey their meaning; fallback preferences and day lists are readable HTML.
- A keyboard-visible “Skip to your planner” link jumps to the live preview and focuses its heading. Hidden preview controls are inert until the handoff. There are no fake interactive SVG controls.
- The server-rendered fallback remains available without JavaScript.

## Performance and maintenance

Uses the existing GSAP stack, coastline projection, destination metadata, planner interests and Lucide icons. No dependencies, textures, video, extra WebGL canvas, per-frame React state or physics were added. Only SVG attributes, opacity and transforms update during the scrub. MatchMedia tears down listeners, pinning and styles on unmount/breakpoint changes. Late upstream pins refresh before this chapter using a lower refresh priority.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
PLAYWRIGHT_MODULE=/path/to/playwright node tests/find-yours.browser.cjs
```

Browser checks cover Chromium desktop/tablet, WebKit desktop, both engines on mobile, reduced motion, short viewports, no-JavaScript fallback, dynamic preference/viewport changes, freeze and rewind, selection, route assembly, transfer into the phone, reverse scrolling, keyboard skip, the actual itinerary export image, console errors and horizontal overflow. Optional `BASE_URL` and `SCREENSHOTS_DIR` environment variables select a server and capture final planner views.

Visual screenshots were also inspected at 1440×900, 1024×768, 768×1024 and 390×844. Lint has one existing unrelated `MoveUpRight` unused-import warning in `components/Hero.tsx`.

Verified locally: all 10 browser configurations passed (4 pinned Chromium/WebKit configurations and 6 natural-flow configurations); 23 unit tests passed; standalone typecheck and production build passed. ESLint completed with zero errors and the existing Hero warning. Browser console/error and horizontal-overflow assertions passed.

## Customer-output sample image

`PersonalizationExperience.tsx` displays a compact portrait PNG beside the original headline, capped at 440px wide on desktop and 360px on mobile. The large interactive result is no longer mounted on the landing page. Visitors can open the original image in a new tab or download it.

`lib/planner/landing-sample.ts` supplies a seven-day, two-adult sample using the existing generator and validator. `scripts/prepare-planner-sample.cjs` opens that sample in the real `/plan` result and saves the original customer-export PNG and manifest into `public/images/planner-sample/`. Regenerate with a running local site and `PLAYWRIGHT_MODULE=/path/to/playwright node scripts/prepare-planner-sample.cjs` when the output format changes.

The preview adds no runtime canvas generation, API calls or storage writes. The planner's result and export components retain their original behavior. The sample is labelled within the exported image; prices and availability are not fabricated.

`tests/landing-sample.browser.cjs` checks compact dimensions, mobile overflow, full-size opening and downloading, then verifies byte-for-byte equality with a freshly generated customer PNG export. The animated map remains an illustrative route separate from the planner's preset sample.
