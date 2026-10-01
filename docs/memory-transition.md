# Itinerary to memories

The landing page continues directly from the existing compact customer itinerary PNG in chapter 03. The original PersonalizationExperience markup, PNG, full-size view and download are unchanged. The experience now leads from the memory wall to the footer; the former Understand and sunset CTA sections have been removed at the user's request. Planner generation and the real Memories page are unchanged.

## Scroll sequence

The existing Find Yours GSAP timeline now has a second 100-unit segment. The original segment retains its 550vh scroll distance; the new memory story adds 550vh. Both use the **same pin**, so there are no competing nested ScrollTriggers. The new segment scrubs in both directions and holds its final state before the pin releases.

| New segment | Visible behavior |
| --- | --- |
| 0–10 | Existing headline and compact, clickable itinerary establish. |
| 10–30 | Four left-to-right masks reveal photos exactly over selected day rows. |
| 26–50 | Headline and original paper dissolve while those photo elements enlarge and detach. |
| 40–62 | Four lightly rotated photographs spread across the viewport with restrained vertical movement. |
| 59–74 | The forest-green phone returns; the same four photographs collect in its gallery. |
| 72.5–82 | A selection outline identifies the train photograph; it expands into a small composer with its existing caption, #slow tag and illustrated share confirmation. |
| 82–96 | The photographs leave the phone and move into wall positions. Four existing community cards arrive, the temporary Yours labels fade, and the selected card receives one subtle bookmark fill. |
| 95–100 | The wall and “MEMORIES ARE / WHAT WE / BRING HOME.” invitation hold still. |

The photo wrappers retain their DOM identities throughout the desktop transformation. Position targets are measured on construction/refresh. The document-row anchors are coordinates in the current 1440 × 1920 exported PNG, with day labels derived from `createLandingSample()` rather than another itinerary dataset.

## Photos, community reuse and routing

The four itinerary moments use existing local assets: Negombo sunset, Sigiriya, Matt Dany's train photograph from `long-way-to-ella`, and Galle lighthouse. They correspond to sample days 1, 3, 5 and 6. These illustrate possible memories; they are not customer-submitted photographs or verified bookings.

Four additional posts come directly from `seedPosts`: `tea-country-voices`, `a-table-in-the-shade`, `steps-into-stillness`, and `one-more-wave`. Their photos, titles, tags and author metadata are reused. The lightweight `MemoryPreviewCard` uses the existing CommunityPost/Author types and shared Avatar component, with compatible colours, borders, typography and metadata. It does not mount the feed, storage or publishing logic.

Both final CTAs use normal Next links to `/memories`. The real page has no composer deep link, so Share yours opens the existing experience where its Share a memory control is available. Existing post previews link to `/memories#post=<id>`. The three landing-only illustrative moments link to `/memories`; no nonexistent detail routes are created. The scroll-simulated Share and bookmark effects never write to storage or publish anything.

## Responsive behavior and access

- Desktop: asymmetric three-column wall with eight cards. Short desktop viewports show six larger cards.
- Tablet (768–1100px): six cards in two columns, less visual overlap and a quieter phone scene.
- Mobile below 768px: natural vertical flow through the unchanged itinerary, a four-photo collection, phone composer, two-column memory wall and invitation. Supporting browsers use short CSS scroll reveals; there is no long mobile pin.
- Reduced motion, short viewports below 650px and no JavaScript: the same meaningful static sequence remains visible and usable.
- Both stories have keyboard-accessible skip links. Hidden planner/wall controls are inert until their handoff. Focus moves to the corresponding heading when skipped. Decorative phone UI is aria-hidden; semantic text describes the transformation. Actual memory links retain visible focus.

## Performance

No dependencies, canvas, WebGL, video, polling, external requests or per-frame React updates were added. The eight preview cards use local, responsive, lazy-loaded Next images and the existing image loader. GSAP uses transform movement, opacity and four simple row masks. Width/height animate on only four photo wrappers so their crops can change from document rows to photos and phone cells. Targets are measured only on setup/refresh; no layout reads happen in the animation update loop. Match-media cleanup restores natural layout when the viewport or motion preference changes.

## Files

Created:

- `components/memory-transition/MemoryTransition.tsx` — semantic composition and phone.
- `components/memory-transition/memories.ts` — sample-day photo bindings and curated existing posts.
- `components/memory-transition/motion.ts` — reversible timeline and accessibility handoffs.
- `components/memory-transition/memory-transition.module.css` — desktop stage, asymmetric wall and fallbacks.
- `components/community/MemoryPreviewCard.tsx` and `memory-preview.module.css` — read-only PostCard companion.
- `tests/memory-transition.browser.cjs` — real-browser integration checks.
- This document.

Modified for this feature:

- `app/page.tsx` — wraps the existing PersonalizationExperience in MemoryTransition.
- `components/find-yours/useFindYoursScroll.ts` — appends the sequence to the existing timeline and adds the memory skip handler.
- `tests/find-yours.browser.cjs` — scopes the planner-link assertion to the existing personalization copy now that the wrapper contains additional links.

Other pre-existing working-tree changes are outside this feature.

## Verification and limits

Browser runner:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright SCREENSHOTS_DIR=/tmp/screenshots node tests/memory-transition.browser.cjs
```

The runner checks row alignment, continuity into the phone, illustrative sharing, loaded local imagery, card text fitting, link destinations, reverse scrolling, keyboard skip, pin release, horizontal overflow and console errors. It covers Chromium widths 375, 390, 430, 768, 1024, 1280, 1440 and 1920, plus WebKit desktop/mobile, reduced motion and no JavaScript. The existing Find Yours and exact-export browser checks remain applicable.

Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build` for repository checks. There is an existing unrelated unused `MoveUpRight` warning in `components/Hero.tsx`.

Verified locally on 2026-10-01:

- New memory browser checks: all 13 viewport/browser/motion configurations passed, with no horizontal overflow or new console errors.
- Existing Find Yours browser checks: all 10 configurations passed, including reverse scrolling and keyboard skip.
- Compact sample browser checks: desktop/mobile full-size view and download passed; the PNG remains byte-identical to the customer planner export.
- Live desktop → reduced motion → mobile → desktop switching restored the correct wall layout and accessible controls.
- All 23 unit tests, TypeScript and the production build passed. Lint had zero errors and the one pre-existing Hero warning.
- Desktop, tablet, phone/composer, mobile wall and closing invitation screenshots were inspected.

If the sample PNG is regenerated with a different layout, update its four row anchors in `memories.ts` and verify their alignment visually. This remains an illustrative journey and curated preview, not a live community feed. Route changes use the existing normal navigation; no new page-transition system or publishing feature was introduced.
