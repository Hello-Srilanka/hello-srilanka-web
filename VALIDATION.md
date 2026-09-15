# Landing-page validation

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

One unthrottled localhost production sample measured CLS at approximately 0.008. This is a lab observation, not a field Core Web Vitals claim. Public-network LCP/INP/CLS and the final film must be measured after deployment and real footage integration.

## Deliberate limits

- Original hero footage was not supplied. The live default is an optimized photograph with a complete, configurable video architecture. Actual-file autoplay, encoding and mobile-film behavior must be rechecked when final footage is added.
- `/plan` intentionally returns 404 because the requested scope explicitly excludes its implementation.
- Travel Guides, Privacy, Terms and social destinations are inactive placeholders awaiting real URLs.
- The canonical origin is a documented placeholder.
- Automated accessibility scans supplement the keyboard and visual checks; they do not constitute formal accessibility certification.
- The interactive browser connector was unavailable. Testing and screenshots used isolated Playwright-controlled Chrome against the local static export.
