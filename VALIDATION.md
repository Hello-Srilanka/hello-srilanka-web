# Planner MVP validation — 17 September 2026

Validated the production Next.js Node server at `http://127.0.0.1:3001`. **No maps are implemented**, following the updated MVP scope. The earlier landing-page reports below are historical; their static-export and absent-planner statements no longer describe the application.

## Passed

- `npm run build`: Next.js 16.3.5 production build succeeds; `/plan` is prerendered and `/api/itinerary` is a dynamic server endpoint.
- `npm run lint`: no errors or warnings. Strict TypeScript also passes during the production build.
- `npm test`: nine test groups covering preferences, all 1–21 sample durations, dates, conditional ages, per-person budget arithmetic, overnight/transfer continuity, duplicate activities, invalid sources, unsupported journey estimates, overloaded days, flight windows, invalid model output, explicit conflicts and mocked provider success/failure paths.
- Chromium 1440 × 1000 and 390 × 844: landing CTA → welcome → validated form → review/edit → server-generated sample → expandable itinerary → export preview → actual PNG downloads.
- Refresh preserves form answers, children’s ages and completed itineraries. New-trip flow works and keeps access to the last saved itinerary.
- A disconnected generation stream retains its request ID; retry reconnects using that ID. Concurrent POSTs with one ID return the same generated result and timestamp. Invalid API preferences return 400.
- Day cards open and close correctly; itinerary has no editing or map controls.
- PNG downloads are 1440 × 1920. Whole-trip and selected-day exports work; the estimated-cost toggle regenerates the images.
- A 21-day overview splits into multiple full-resolution pages. Instrumented canvas checks confirm every day reaches export and every text draw fits within the available width and image bounds.
- 320px narrow viewport: no horizontal result overflow. Blocked fonts and photos retain working, paginated text-based export. System font fallback works.
- Blocked localStorage displays the device-storage warning. Keyboard Enter/Space operate welcome and checkbox controls.
- No uncaught page errors during the full browser flow. Screenshots of desktop/mobile welcome, interests, review, results and export were reviewed; a downloaded selected-day image was visually inspected for readability and clipping.
- `git diff --check`: no whitespace errors.

Repeat browser checks with `tests/planner.browser.cjs`; see README for external Playwright paths. Review artifacts are saved under `/private/tmp/hellosrilanka-planner-review` in this workspace session.

## Limits and remaining setup

- No real provider key was available. OpenAI Responses API request structure, search/source handling, structured output and failure paths were tested with mocked responses; **a billable live research run has not been verified**. Configure the server-only `OPENAI_API_KEY` and a supported `OPENAI_MODEL` to test live itinerary quality.
- Sample routes are explicitly illustrative. They do not establish real-world route feasibility, accessibility, prices, availability or booking status.
- There is no map, booking engine or live hotel inventory integration. Live generation researches provider websites and returns links; date-specific quotes remain unknown when unavailable.
- Browser checks use Chromium viewport emulation, not physical iOS Safari. Mobile save-to-Photos behavior may vary by browser; an open-full-size-image fallback is available.
- The new server endpoint requires Node hosting with appropriate response timeouts and filesystem access. Multi-instance or ephemeral serverless deployment needs shared durable request storage; the default OS temporary directory is for a single Node host. See README for retention and rate-limit details.

---

# Landing-page validation

## Hero film — 17 September 2026

Validated the final static production export in local Chromium, served with HTTP byte-range support. The original landing-page checks below are retained as the earlier baseline.

- ESLint, strict TypeScript and the production static build pass.
- All four final encodes decode without FFmpeg errors: 24.5 seconds, 30 fps, no audio streams.
- Desktop is 1920 × 1080: MP4 5.92 MB, WebM 4.51 MB. Mobile is 720 × 1280: MP4 2.39 MB, WebM 1.98 MB (decimal MB).
- Both MP4 files have the `moov` index before the media payload for progressive playback.
- Actual-file autoplay, muted/inline attributes, loop playback, manual pause/resume, pause persistence through buffering events, offscreen pause/resume and device-source switching pass.
- 1440px desktop, 820px tablet, 390px phone and 320px narrow phone: no horizontal overflow; correct video dimensions and device source. A fresh phone load requests only the mobile film.
- The portrait poster loads on phones; reduced motion, data saver, 2G and disabled JavaScript request no video.
- Simulated WebM failure plays MP4; failure of both formats retains the poster; simulated blocked autoplay retains a working manual play button.
- No uncaught browser errors in the above scenarios.
- Visually inspected the opening, train, coast, procession and friends with the actual hero typography, plus contact sheets covering all nine shots in both compositions.
- Original clips remain outside the repository and unchanged. Edit decisions and re-render instructions are in `public/media/README.md` and `scripts/`.

Limits: Chromium mobile viewport emulation is not a physical iOS Safari test. Real-network performance and cross-browser autoplay policies still depend on the deployed host and device. Production hosting should serve video MIME types correctly and support HTTP byte ranges; Python's basic static server does not reliably support video seeking.

Validated 16 September 2026 against the static production export in isolated headless Chrome. Temporary browser tooling and screenshots are outside the application; no test-only dependencies ship with it.

## Passed

- ESLint: no errors or warnings.
- TypeScript: strict type check passes.
- Production build: Next.js 16.3.5, App Router, static export using Webpack.
- Desktop 1440 × 1000; tablet 820 × 1180; phone 390 × 844; narrow phone 320 × 740.
- No horizontal document overflow at each chapter in all four sizes.
- Every rendered photograph loads; hero poster fallback loads.
- Main and final planning CTAs remain visible; all planner anchors use `/plan`.
- Header, footer and chapter anchor targets resolve to existing page content.
- Upward and downward scrolling update the chapter indicator correctly.
- Keyboard skip link, visible focus, interest selection with Space, journey arrow controls, and carousel left/right keys work.
- Mobile navigation opens, closes on a destination, traps keyboard focus, and closes with Escape while restoring focus.
- Short landscape viewport 667 × 375: mobile menu scrolls and its last CTA is reachable.
- Interest selection changes its pressed state, image and caption without storage or network calls.
- Carousel navigation updates the selected profile; arrows and swipe use Embla.
- Reduced motion: no Lenis instance, no pinned scenes, no background video; all five story scenes and journey controls remain available.
- JavaScript disabled: main destination copy, hero CTA and static story scenes remain available.
- Axe WCAG 2 A/AA and WCAG 2.1 AA rules: zero automated violations at all four tested widths after contrast fixes.
- No uncaught browser errors.
- No backend, authentication, storage, planner route, dashboard or API endpoint was created.

## Performance considerations

Responsive WebP sources are selected through a static `next/image` loader. The hero is preloaded with cover-aware sizing; other photography is lazy loaded. Image regions reserve dimensions. Fonts are hosted locally. GSAP and Lenis are dynamically imported; touch input uses native scrolling. Server-rendered essential content remains available before hydration.

One unthrottled localhost production sample measured CLS at approximately 0.008 before the film was integrated. This is a lab observation, not a field Core Web Vitals claim. Public-network LCP/INP/CLS must be measured after deployment.

## Deliberate limits

- The hero film now uses the supplied footage; it omits the managed-area elephant shot and adapts the narrative to the available scenes. The food and friends clips have lower original resolution than the landscape clips; see the edit notes.
- `/plan` intentionally returns 404 because the requested scope explicitly excludes its implementation.
- Travel Guides, Privacy, Terms and social destinations are inactive placeholders awaiting real URLs.
- The canonical origin is a documented placeholder.
- Automated accessibility scans supplement the keyboard and visual checks; they do not constitute formal accessibility certification.
- The interactive browser connector was unavailable. Testing and screenshots used isolated Playwright-controlled Chrome against the local static export.
