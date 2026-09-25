# HelloSriLanka

A cinematic Sri Lanka travel website with a working, read-only itinerary planner, built with Next.js 16.3.5, App Router, TypeScript, Tailwind CSS 4, and Lucide React. Server Components compose the page; interaction-specific components use the client boundary.

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

The application now requires a Next.js **Node server**, because itinerary generation runs on the server. The old `out/` directory is no longer the deployable application.

```sh
npm run build
npm run start
```

The build uses Next.js’s Webpack compiler. Serve media with correct MIME types and byte-range support.

## Planning MVP

Every existing planning CTA opens `/plan`:

**Your moments → your rhythm → your time → your budget → your comforts → your journey → generation → read-only itinerary → PNG export.**

- Dates or 1–21 relative days; arrival/departure locations and optional local flight times; adults, children and conditional ages.
- Discovery starts with six photographic experience cards, with four more available to explore. Selections update a travel postcard and preference summary. Three pace choices show illustrative morning/midday/evening examples.
- Dates and traveller counters come after discovery. Flight details are expandable; children’s ages appear only when relevant. The budget covers time in Sri Lanka, excluding international flights. Budget and comforts have separate chapters, including photographic stay preferences, transport choices and optional personal notes.
- Review opens with a personalised photo brief. Edit links return directly to review after validating the edited chapter. Existing device-local drafts migrate to the new chapter order without discarding their answers or completed itinerary.
- Accessible labelled controls, visible progress, review edit links, refresh recovery and temporary session persistence. Optional account creation uses Supabase Auth.
- Full-width expandable itinerary cards with flexible periods, connected transfers, overnight suggestions, provider/source links, qualified costs, assumptions and caveats. **No maps**, per the MVP scope. No itinerary editing, chat, sharing or booking management.
- Whole-trip and selected-day PNG preview, optional costs, 1440 × 1920 output, pagination and individual downloads. The dedicated text layout avoids cross-origin image dependencies; fonts have a bounded system-font fallback.
- In-progress preferences are kept in this tab's session storage for up to two hours and removed when the itinerary is ready. Account sign-in currently does not create permanent trip history.

### Live generation or sample mode

Copy `.env.example` to `.env.local`, then configure:

```dotenv
OPENAI_API_KEY=your_server_side_key
OPENAI_RESEARCH_MODEL=gpt-6-sol
OPENAI_COMPOSE_MODEL=gpt-6-sol
```

With no API key, or with `ITINERARY_MODE=sample`, the complete interface uses explicitly labelled illustrative results. Sample routes are presets; interests affect themes, but special requirements, prices, availability and route suitability are **not** live-verified. Sample mode never falls back silently after a live failure.

Live generation uses the OpenAI Responses API with reviewed Supabase knowledge when configured. Web-search research fills gaps, followed by strict structured output. Model selection is configurable. The implementation follows the official [web-search guide](https://developers.openai.com/api/docs/guides/tools-web-search) and [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs).

Research requests official tourism, attraction, transport and hotel sources; it preserves tool-returned URLs and server-recorded retrieval timestamps. The composition stage treats that content as untrusted data, uses only collected source IDs, and provides direct researched provider links. Supabase stores reviewed stay candidates, but there is no booking or live availability service. Missing quotes remain unknown; unknown currency conversions cannot be assumed. Every cost is a subtotal for the whole group for one activity, leg or night in the requested currency.

### Accounts and maintained knowledge

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for environment variables, the SQL migration, email confirmation, and the one-time step to grant an account admin access. Sign-up, sign-in, sign-out and the protected `/admin` review page use Supabase Auth and Row Level Security. Every approved fact has a source, review date and expiry; unreviewed or expired facts do not enter itinerary generation. The catalogue starts empty until an admin adds and approves records.

`lib/planner/validation.ts` verifies response shape, day count, arrival/departure connections, overnight continuity, duplicate activities, chronological periods, time budgets, flight windows, sourced journey estimates with buffers, source references and cost arithmetic. Major costs remain explicitly unknown; the server does not call a partial subtotal a complete budget. Conflicts are shown before returning a finished itinerary.

### Hosting and request recovery

`POST /api/itinerary` streams newline-delimited JSON containing real processing stages, then a validated result or an error. A client-generated UUID is saved **before** the request. Concurrent calls with the same ID join the existing request or return its saved result. Network interruption retains the ID for reconnection; a terminal failure permits a fresh retry. Preferences cannot be changed under an existing ID.

The MVP targets a persistent Node process with filesystem access. Request records, including generated itineraries, are private files in the OS temporary directory by default. Records expire after 24 hours and are cleaned on subsequent requests; this is not permanent trip storage. Set `ITINERARY_CACHE_DIR` to a shared persistent filesystem for multiple Node instances that need to deduplicate across processes. Ephemeral, isolated serverless filesystems do **not** provide cross-instance deduplication; use a shared durable job store before deploying that topology. Allow at least 240 seconds for generation and disable response buffering. The provider deadline is 200 seconds; stale requests can be retried after 220 seconds.

A basic per-process hourly limit is included. A public deployment should enforce a shared gateway rate limit and provider spending limits. No API key is exposed to browser code. Live preferences are sent to the AI provider, as explained before generation; avoid entering personal contact or medical details.

### Planner code and checks

- `components/planner/`: visual discovery form, responsive travel postcard, lifecycle, results and export preview.
- `lib/planner/discovery.ts`: chapter definitions, preference-to-story copy, chapter validation and legacy draft migration.
- `lib/planner/`: types, preference validation, sample data, provider calls, itinerary validation and canvas layout.
- `app/api/itinerary/route.ts`: server endpoint and request recovery.
- `lib/knowledge/` and `app/admin/`: reviewed fact retrieval and admin editing.
- `app/plan/planner.css`: scoped extension of the existing design tokens.

```sh
npm test
npm run lint
npm run typecheck
npm run build
# With Playwright and its Chromium installed:
TEST_BASE_URL=http://127.0.0.1:3001 node tests/planner.browser.cjs
```

The browser script accepts `PLAYWRIGHT_MODULE`, `TEST_BROWSER_PATH`, and `TEST_ARTIFACTS` for externally installed browser tooling. Browser test dependencies do not ship in the application.

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

All planning CTAs link to the working `/plan` flow. The landing-page interest selector remains an independent visual demonstration. Travel Guides, Privacy, Terms and social channels are clearly inactive placeholders pending their real destinations.

## Performance and validation

- Prerendered landing/planning pages plus a dynamic server endpoint; server-rendered essential copy.
- Responsive, locally optimized WebP assets; no third-party image requests.
- Two locally hosted fonts; no Google Fonts network dependency.
- Width/height or aspect-ratio reservations prevent image-driven layout shifts.
- Dynamic GSAP/Lenis loading, no WebGL or continuous carousel playback.
- Keyboard focus styles, skip link, labelled navigation, descriptive alt text, reduced-motion fallbacks, and short-viewport mobile-menu scrolling.
- Complete planner checks cover form validation, persistence, generation recovery, responsive results and PNG exports.

See `VALIDATION.md` for final checks and their limits. Real-user Core Web Vitals require field measurements after public deployment; local checks are lab evidence only.
