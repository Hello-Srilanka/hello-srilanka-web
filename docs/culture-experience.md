# The Living Thread of Sri Lanka

## Scroll-through photograph update

Every photograph now has a scroll position. The featured image, selected thumbnail and accessible image description change together; reverse scrolling restores preceding photos. Clicking a thumbnail seeks to its photograph in the pinned timeline so subsequent scrolling continues from that position. Chapter links start at the first photograph.

`lib/culture/timeline.ts` derives chapter duration from the supplied image counts (1, 1, 2, 5, 1, 3). The desktop sequence has 760vh of scroll travel, giving the five-photo craft chapter more time than a single-photo chapter. Crossfades between chapters retain the continuous thread and illustration animation. Gallery updates occur only at photo boundaries, without React renders on every desktop animation frame.

On phones at least 650px high, multi-photo galleries stay visible beneath the navigation while normal page scrolling advances their photographs. Reduced-motion and short-screen layouts retain direct thumbnail selection without adding a pinned gallery. No text has been added to the presentation.

`tests/culture-photos.browser.cjs` checks all 13 photos forward and backward on desktop and mobile, selected thumbnails, visibility during mobile scrolling, click-to-seek, overflow, browser exceptions and the reduced-motion fallback. The original browser suite now reads the shared timeline and checks natural exit rather than the previously removed footer link.


## Combined artwork and photography update

The current version pairs six original SVG illustrations with all 13 supplied photographs. Each chapter has a large headline, a supporting illustration and its photo gallery. The illustrations depict an oil vessel and botanicals, torchlit procession, dancer and drums, woven cloth, tea and cinnamon, and lanterns. Scroll-driven illustration movement accompanies the existing photo transitions and cultural thread. Thumbnails still select every supplied photo.

Small visible text has been removed: entry/masthead labels, chapter keywords and numbers, subject labels, descriptions, subtitles, photo captions, image counters and final supporting copy. Chapter navigation uses six visual dots, retaining descriptive accessible link names. The final Explore the stories link remains at a readable 20px. Existing user removals of the section footer and intro support text remain preserved. No map or other landing-page components were changed.

`CultureArtwork.tsx` is restored; `CultureExperience.tsx`, `CultureGallery.tsx` and the CSS module compose and style the combined visuals. Notes below are historical and are superseded by this update.


## Photography update

The original six code-drawn SVG illustrations have been replaced with all **13 user-supplied images** in `public/images/culture`, preserving the source files unchanged. Chapter counts: Ayurveda 1, Perahera 1, dance 2, craft 5, tea 1, festivals 3. `lib/culture/images.ts` contains explicit filenames and image descriptions. `CultureGallery.tsx` replaces the removed `CultureArtwork.tsx`; multi-image chapters provide keyboard-accessible thumbnail buttons, a selected-state indicator, image counter and gentle photo crossfades. The pinned scene adds a small scroll-driven photo zoom. The continuous SVG thread, chapter navigation and desktop/mobile/reduced-motion layouts remain.

Craft and festival captions now describe the supplied photographs more broadly; festival photographs are not all labelled Vesak, and the masked dance photograph is not labelled Kandyan. Original uploaded files total approximately 1.94 MB. Images use lazy-loaded Next Image with `unoptimized` because the project image loader expects pre-existing numbered WebP variants; no new image service or dependency is required.

The notes below describe the original implementation; the photography update supersedes its illustration-specific details.


## Placement and scope

`CultureExperience` replaces the **Get a little lost** photographic editorial and nine-item experience accordion shown in the request. It follows the existing map and full-width photographic story, before Find Yours. The `#experiences` anchor remains valid for existing links and map cards. The label is **02 — CULTURE** because this story belongs to the existing Experience chapter; the five main page chapters retain their numbering.

The map, flight, destination data/artwork, hero, navigation components, planner, and footer are unchanged. A scoped CSS rule temporarily hides the outer journey indicator while the pinned Culture stage occupies the viewport, avoiding two competing numbered indicators. It returns on leaving the stage.

## Content and original artwork

All six chapters are readable HTML, configured in `lib/culture/chapters.ts`:

| Chapter | Subject | Original SVG composition |
| --- | --- | --- |
| HEAL | Sri Lankan Ayurveda and wellness | Suspended clay vessel, oil drop, botanical leaves and stone bowl |
| CELEBRATE | Kandy Esala Perahera | Abstract procession, hand drums, torchlight and architectural backdrop |
| MOVE | Kandyan dance and drumming | Sculptural dancer, pleated costume silhouette and tapered geta bera forms |
| MAKE | Sri Lankan handloom weaving | Warp, coloured weft, geometric cloth and wooden shuttle |
| TASTE | Ceylon tea, spice and cuisine | Tea sprig, hillside contours, cinnamon quills, cup and steam |
| GLOW | Vesak | Faceted paper lanterns with hanging streamers and progressively revealed light |

The final frame links **Explore the stories** to the existing `/memories` route. That route contains traveller stories; a dedicated long-form culture destination does not yet exist.

These are original contemporary interpretations, not copied illustrations or detailed reconstructions of ceremonial costumes. No religious symbolism is assigned to the ornamental shapes. No elephant imagery or medical efficacy claims are used. The final chapter specifically represents Vesak, without mixing it with New Year traditions.

## Motion and accessibility

At 768px and above, with a viewport at least 600px high and motion enabled, GSAP/ScrollTrigger pins a single stage beneath the existing navigation. It uses 480vh of scroll travel, plus the stage (approximately 570vh total). Intro, six chapters and final statement occupy one stage. Scene centres are 0%, 15.5%, 28.5%, 42.5%, 56.5%, 70.5%, 85.5% and 100%. Crossfades overlap for 4.4% around each boundary. Reverse scrolling reverses the sequence.

One persistent SVG path interpolates between equal-size sets of curve points: introductory loop, botanical stem, procession route, sweeping dance arc, woven rows, tea stem/cinnamon curl, lantern cord, and an exiting thread. No paid morph plugin is required. Scroll progress also assembles leaves, lowers an oil drop, reveals procession figures, turns the dancer slightly, weaves cloth, raises steam and lights lanterns.

Chapter links seek timeline positions, update the URL fragment and retain keyboard focus. Direct chapter URLs and history changes are supported. The component stops these custom link events from reaching Lenis's document-level anchor handler, which otherwise attempts a second incompatible scroll to the overlaid DOM panel.

Inactive pinned scenes are `inert` and `aria-hidden`; exactly one is accessible at a time. All artwork is decorative and the cultural information remains in HTML. The always-available **Continue your journey** link leaves the sequence.

Below 768px, on short screens, or with reduced motion, the chapters flow normally. The thread becomes a vertical line, chapter navigation remains sticky, and all scenes are accessible. Mobile artwork has a small one-time entrance reveal when motion is enabled. Reduced motion disables that reveal and all pinning. The same natural layout is server rendered and works without JavaScript.

## Performance and files

No dependencies added. Uses existing fonts, colour/spacing tokens, GSAP and Lenis integration. SVG only: no new renderer, textures, video or perpetual animation loop. Animation initializes within 1200px of the section. Observers, media-query contexts, pinning and history listeners are cleaned up on unmount or motion/breakpoint changes.

Created:
- `components/culture/CultureExperience.tsx` — semantic layout, chapter links, final CTA
- `components/culture/CultureArtwork.tsx` — six original artworks
- `components/culture/CultureThread.tsx` — persistent path and curve interpolation
- `components/culture/useCultureScroll.ts` — lazy timeline, accessibility and cleanup
- `components/culture/culture.module.css` — responsive styles and scroll-driven artwork details
- `lib/culture/chapters.ts` — content and timeline stops
- `tests/culture.browser.cjs` — responsive, navigation, scroll, fallback and cleanup checks
- `docs/culture-experience.md` — implementation and reference notes

Modified: `app/page.tsx`, replacing the `ExperienceEditorial` import/render with `CultureExperience`. The previous component remains in the repository but is no longer rendered here.

## Cultural references

Consulted for factual context, not copied wording or artwork:

- [Sri Lanka Tourism: Ayurveda](https://srilanka.travel/wellness-tourism/ayurveda) — herbs and oils in the Sri Lankan Ayurvedic tradition. No health-treatment claims repeated.
- [Central Province Tourism: Kandy Esala Perahera](https://tourism.cp.gov.lk/en/event/kandy-esala-perahera) — procession context, drummers, dancers and torchlight.
- [Central Province Tourism: Traditional dancing and drumming](https://tourism.cp.gov.lk/en/sri-lankan-traditional-dancing-and-drumming) — distinct regional traditions, Kandyan dance, hand-played tapered geta bera.
- [Sri Lanka Tourism: Traditional craftsmanship](https://srilanka.travel/essence?article=62) — handloom weaving and contemporary cloth production.
- [Sri Lanka Export Development Board: Ceylon tea](https://www.srilankabusiness.com/tea/about-tea/) and [cinnamon](https://www.srilankabusiness.com/spices/about/cinnamon-cultivation-sri-lanka.html) — tea and cinnamon context.
- [Sri Lanka Ministry of Mass Media: Vesak message](https://media.gov.lk/media-gallery/latest-news/3605-vesak-message) — Buddhist observance and lantern traditions.

The illustrations are deliberately abstract. A Sri Lankan cultural practitioner has not independently reviewed the finished artwork.

## Verification

Browser script accepts `BASE_URL`, `PLAYWRIGHT_MODULE`, `BROWSER=webkit` and optional `SCREENSHOTS` directory. It covers 375, 390, 430, 768, 1024, 1280, 1440 and 1920px; eight desktop frames; reverse scrolling; overlapping transitions; chapter navigation; final CTA and exit; overflow; reduced motion; no JavaScript; live preference/breakpoint cleanup; direct chapter links; and browser exceptions.

Validation results:
- `npm run typecheck`: passed.
- `npm run build`: passed; all seven routes generated.
- `npm test`: 23/23 passed, including the existing geographic/flight/route checks.
- `npm run lint`: zero errors; three existing unused-import warnings in `Hero.tsx` and `ExperienceStory.tsx`.
- Chromium and WebKit production runs: all eight requested widths passed, including scene progression, reverse scroll, crossfades, navigation and pin release. Reduced motion, no-JavaScript rendering, live breakpoint/preference cleanup and desktop deep links passed.
- Follow-up checks cover direct links on touch devices, reduced motion and short screens after correcting hydration-time anchor positioning.

A development-mode reduced-motion reload also exposed a hydration warning in the unchanged `PersonalizationExperience.tsx`: its existing Motion initial opacity depends on the client motion preference. That unrelated component is outside this change. The Culture component renders the same natural HTML on the server and client before enhancement.

Final production verification completed in both Chromium and WebKit: all eight widths, all fallback modes, touch/short-screen deep links, and the actual `/memories` CTA navigation passed. Both runs finished with zero browser exceptions or console errors. Temporary production verification server stopped; the existing localhost:3000 development server was retained.

Photography verification: all 13 distinct source images loaded successfully at 390px, 768px and 1440px; every thumbnail selected its photograph, with no horizontal overflow or browser exceptions. The final production build and typecheck passed; lint retained only the three existing unused-import warnings.

Combined-layout verification: all 13 photos load and all thumbnail controls work at 390px, 768px and 1440px without horizontal overflow or browser exceptions. Six illustrations render alongside the galleries; visible paragraph/caption text and navigation text are absent. Desktop stage bounds and the reduced-motion layout were checked. Typecheck and production build pass; lint has zero errors and the same three pre-existing unused-import warnings.
