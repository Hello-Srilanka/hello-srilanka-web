# HelloSriLanka

A cinematic, editorial **public landing page only**, built with Next.js 16.3.5, App Router, TypeScript, Tailwind CSS 4, and Lucide React. Server Components compose the page; interaction-specific components use the client boundary.

## Run locally

Requires Node.js 20.9 or later (Node 24 was used for validation).

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

```sh
npm run lint
npm run typecheck
npm run build
```

The production build exports static HTML, CSS, JavaScript, responsive photography and the hero films into `out/`. Deploy that folder to a static host with video MIME types and HTTP byte-range support. To inspect HTML and photography locally (use `npm run dev` or a byte-range-capable server for video seeking):

```sh
python3 -m http.server 4173 --directory out
```

Open http://localhost:4173. The build uses Next.js's supported Webpack compiler because the current environment blocks Turbopack's CSS worker process during production compilation.

## Creative direction: five chapters

The visual rhythm alternates immersive photography with generous, quiet space. Anton supplies expressive condensed headlines; locally hosted DM Sans supplies readable body copy. Warm Sand, Deep Jungle, Ink, and restrained Cinnamon/Saffron accents form the palette in `app/globals.css`.

1. **Arrive** — full-viewport Sri Lanka film, clear navigation, oversized destination-first typography, and two obvious actions.
2. **Experience** — an editorial introduction, one five-scene cinematic sequence, asymmetric coastal imagery, and nine expandable experience categories.
3. **Find yours** — an uncluttered question followed by a tactile travel profile. Interest selections change its image and caption; selections live only in component memory.
4. **Understand** — four contrasting example journeys, a connected four-stage route, and a travel companion expressed as a travel journal.
5. **Go** — a warm Negombo sunset returns to the emotional opening and the main planning CTA.

## Components and motion ownership

- `Navbar`, `ChapterIndicator`, `Hero`, `HeroMedia`, `Brand`
- `ExperienceStory`, `ExperienceEditorial`
- `FindYours`, `PersonalizationExperience`
- `JourneyExamples`, `HowItWorks`, `TravelCompanion`
- `FinalJourneyCTA`, `Footer`, `PageMotion`

**Motion for React:** mobile menu transitions, category photograph crossfades, interest buttons, and profile-image changes. CSS handles straightforward link and CTA hover states.

**GSAP + ScrollTrigger:** two signature scroll moments only: `ExperienceStory` pins one sequence and reveals five photographs; `FindYours` gradually deepens the question's ink. GSAP is imported asynchronously. It does not animate elements owned by Motion.

**Lenis:** `PageMotion` adds short-duration wheel smoothing on fine-pointer devices, synchronized with GSAP's ticker. Touch scrolling remains native. Reduced motion disables Lenis completely.

**Embla:** `JourneyExamples` supports swipe, previous/next buttons, profile selector buttons, and left/right arrow keys. No automatic advancement.

**Reduced motion:** both GSAP moments are disabled, every story image becomes part of the natural document, Motion transitions resolve immediately, the hero remains a still image, and all selectors retain their functionality. Without JavaScript, essential destination/product text, all five story photographs, native anchor links, and `/plan` CTAs remain available.

## Hero film

The opening now plays a 24.5-second silent film edited from the supplied Sri Lanka footage: mountains, train, coast, food, heritage, a procession, friends and a quiet return to the mountains. The last mountain frame continues into the opening shot for a visually continuous loop. The headline remains HTML above the footage.

`lib/media.ts` maps the 1080p desktop and independently framed 720 × 1280 mobile films, each in WebM and MP4. Final assets are in `public/media/`; the opening-frame posters include a portrait version and responsive landscape WebPs. See [edit notes and re-render instructions](public/media/README.md), [the edit decisions](scripts/hero-edit.json) and [the renderer](scripts/render-hero.py).

`HeroMedia` selects a device version before mounting video, supports muted inline autoplay and looping, and offers a pause/play control. It pauses offscreen or when the tab is hidden, preserves manual pause, uses MP4 if WebM fails, and falls back to the poster if neither format plays. Reduced-motion, data-saver and 2G connections receive only the still image. Viewport changes select the appropriate film. Browsers that block autoplay retain a manual play button.

## Replace photography

- Source images and responsive WebP variants: `public/images/`.
- Photograph credits, original source links, and licenses: `public/images/CREDITS.md`.
- Experience and journey image mappings: `lib/content.ts`.
- Profile mappings: `components/PersonalizationExperience.tsx`.
- Hero mapping: `lib/media.ts`.
- Other editorial images are named directly in their matching components.

Images use `next/image` with the static loader in `lib/image-loader.ts`. For every base `name.webp`, provide `name-480.webp`, `name-768.webp`, `name-1200.webp`, `name-1600.webp`, and `name-2000.webp`. The browser selects the correct variant from `sizes`. Keep aspect ratios consistent across variants, update descriptive alt text, and preserve source credits. The hero is preloaded; below-fold images load lazily with reserved dimensions.

## Replace the logo

Replace the temporary text inside `components/Brand.tsx` with the final Journey Mark asset. Preserve its home anchor and accessible name. `.wordmark` and `.wordmark-footer` control the two placements. No final illustrated logo has been invented.

## Metadata and placeholder destinations

`app/layout.tsx` contains title, description, Open Graph/Twitter metadata and a **placeholder canonical origin** of `https://hellosrilanka.com`. Replace it with the final production domain before a public launch.

All planning CTAs link to `/plan`. That route is intentionally absent. There is no authentication, persistence, analytics, AI integration, itinerary generation, dashboard, or backend API. The interest selector is a visual demonstration only. Travel Guides, Privacy, Terms and social channels are clearly inactive placeholders pending their real destinations.

## Performance and validation

- Static HTML export; server-rendered essential copy.
- Responsive, locally optimized WebP assets; no third-party image requests.
- Two locally hosted fonts; no Google Fonts network dependency.
- Width/height or aspect-ratio reservations prevent image-driven layout shifts.
- Dynamic GSAP/Lenis loading, no WebGL or continuous carousel playback.
- Keyboard focus styles, skip link, labelled navigation, descriptive alt text, reduced-motion fallbacks, and short-viewport mobile-menu scrolling.
- No planner is implemented. Its intentional `/plan` 404 is excluded from landing-page success checks.

See `VALIDATION.md` for final checks and their limits. Real-user Core Web Vitals require field measurements after public deployment; local checks are lab evidence only.
