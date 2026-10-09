# Culture story slider

The Culture section follows the island story on the home page and keeps the `#experiences` anchor. It shows an introduction, six cultural chapters and a final link to `/memories` in one viewport-height horizontal carousel. Normal page scrolling moves into and out of this section; it no longer pins the page or assigns vertical scroll distance to individual photos.

The existing Embla dependency handles drag/swipe and slide positioning. The introduction card opens the first story; compact previous and next arrows appear on desktop. On mobile, visitors can swipe or use the visible next-story peek. Left/right arrow keys also select a story. Direct `#culture-{id}` links reopen their story. The active slide alone is focusable and exposed to assistive technology. Manual navigation is announced through a polite live region.

Automatic playback advances every 5.5 seconds while the section is visible. The horizontal move and cinnamon SVG thread transition are brief, around half a second. Playback pauses while the pointer is over the carousel, while someone focuses or drags it, or while the browser tab is hidden; it resumes when that interaction ends. Manual navigation resets the timer for the selected story. Playback ends on the final slide and is unavailable with reduced motion. Reduced-motion navigation jumps directly to the selected story. A small `01 / 08` counter and thin progress line show the active story and when the next one will arrive.

Every supplied photograph remains available through the gallery thumbnails. Photo selection crossfades the image without moving the page. The six original SVG illustrations remain on larger screens; the smaller layout prioritizes the headline and photo so a story fits within the viewport. The section does not add a map or change the planner.

Relevant files:

- `components/culture/CultureExperience.tsx` — carousel, controls, autoplay, chapter navigation and deep links
- `components/culture/CultureGallery.tsx` — photo selection
- `components/culture/CultureArtwork.tsx` and `CultureThread.tsx` — illustration and thread
- `components/culture/culture.module.css` — responsive layout and motion
- `lib/culture/chapters.ts` and `images.ts` — story content and photograph descriptions
- `tests/culture.browser.cjs` and `tests/culture-photos.browser.cjs` — optional Playwright browser checks
