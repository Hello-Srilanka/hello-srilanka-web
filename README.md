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

The production build exports static HTML, CSS, JavaScript, and responsive photography into `out/`. Deploy that folder to a static host. To inspect it locally:

```sh
python3 -m http.server 4173 --directory out
```

Open http://localhost:4173. The build uses Next.js's supported Webpack compiler because the current environment blocks Turbopack's CSS worker process during production compilation.

## Creative direction: five chapters

The visual rhythm alternates immersive photography with generous, quiet space. Anton supplies expressive condensed headlines; locally hosted DM Sans supplies readable body copy. Warm Sand, Deep Jungle, Ink, and restrained Cinnamon/Saffron accents form the palette in `app/globals.css`.

1. **Arrive** — full-viewport train journey, clear navigation, oversized destination-first typography, and two obvious actions.
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

## Replace the hero film

`lib/media.ts` is the hero media configuration. The film paths intentionally default to `null`, so no missing video file is requested. The supplied local photograph is the ready-to-use fallback.

Place final films in `public/media/` and set:

```ts
heroVideo: {
  desktop: '/media/sri-lanka-desktop.mp4',
  mobile: '/media/sri-lanka-mobile.mp4',
}
```

Recommended deliverables: muted H.264 MP4, 20–30 second seamless loop, desktop 1080p at roughly 3–5 MB and a separate portrait/mobile cut around 1–2 MB. Keep people and experiences at the heart of the edit. These are production targets, not supplied footage.

`HeroMedia` implements autoplay, muted, loop, playsInline, object-cover, preload="none", poster/error/play-rejection fallback, a pause/play control, offscreen pausing, reduced-motion and data-saver checks. Mobile never downloads the desktop film when a mobile source is absent. Set either source to `null` to use photography on that device class. Final-film playback must be checked again after the real files are supplied.

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
