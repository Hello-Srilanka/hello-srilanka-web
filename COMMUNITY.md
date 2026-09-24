# Island Memories

Island Memories lives at `/memories`, linked as Memories from the main navigation and footer. `/community` redirects to the new address, preserving story fragments. The simple, centered memory wall uses sand and sage surfaces, cinnamon display typography, full-frame photography and short, evocative captions. The promotional sidebar and preview banner have been removed; preview details remain in the composer, profile and Community spirit dialog.

## Run

```sh
npm install
npm run dev
```

Open `http://localhost:3000/memories`. Production: `npm run build` then `npm start`. Checks: `npm run lint`, `npm run typecheck`, `npm test`.

## What works

- Photo moments, longer stories, and questions; up to four photos with descriptions.
- Image preparation in the browser: JPG/PNG/WebP, maximum 12 MB each, resized to 1,400 pixels and re-encoded to remove metadata.
- Photo galleries, comments, likes, bookmarks, profile editing, and a personal journal.
- Search, experience and destination filters, latest stories, questions, saved inspiration, and progressive feed loading.
- Story links, draft-discard confirmation, local post deletion, and hiding/restoring sample posts.
- Native dialogs with keyboard focus management, responsive layouts, reduced-motion support, and labelled controls.

## Preview boundary

Profiles, posts, images, comments, likes, bookmarks and hidden posts are saved in this browser's IndexedDB (`hellosrilanka-community-preview`). They are not sent to a server or visible to other travellers. Clearing browser site data clears the journal; private browsing and storage limits can prevent persistence. Keep one editing tab open: this preview does not synchronize concurrent tabs or devices.

Seed travellers, posts, conversations and engagement counts are illustrative. The interface labels the preview, local publishing, and local reporting explicitly. A report hides a post on this device; it does not contact a moderator. A local post link only resolves in the browser that holds the post. Public sample story links work for all visitors to the same site.

There are no new accounts, authentication providers, databases hosted on a server, moderation services, or community backend endpoints. Existing planner functionality is unchanged. A shared release needs those services before opening real public posting.

## Code and assets

- `app/memories/page.tsx`: server route and metadata; `noindex` during the preview.
- `app/community/page.tsx`: redirect for existing community links.
- `app/community/community.css`: responsive community visual system.
- `components/community/Community.tsx`: connected feed, filters, profile, sharing, and preview state.
- `components/community/MemoryFilm.tsx`: the original 1920×1080, 40-second film with its built-in titles and soundtrack, muted autoplay, sound and pause controls, poster fallback, and reduced-motion handling. It plays once, then stops with a Replay control and a softly revealed Explore the memories link; the link is available immediately when motion or video playback is unavailable. The video pauses offscreen; Watch film opens the same full-resolution file with browser playback controls. The accessible page heading remains in HTML. The home navigation is reused above the film, while sharing and profile controls begin the feed. On smaller screens the film keeps its title area visible instead of cropping those words away.
- `PostCard`, `PostDetail`, `PostComposer`, `CommunityDialog`: reusable interactive UI.
- `lib/community/model.ts`: types, filtering and validation.
- `lib/community/storage.ts`: serialized IndexedDB persistence and image processing.
- `lib/community/data.ts`: editable illustrative contributors, stories and photo references.

The header uses the existing temporary wordmark. Replace it alongside the main site's brand when the final logo is ready.

All 20 supplied JPGs in `public/images/community/` appear in the feed. The original files are preserved. `node scripts/prepare-memory-images.mjs` creates responsive WebP copies in its `optimized/` subfolder and records dimensions in `lib/community/photos.json`. Captions and credits are in `lib/community/data.ts`; credits follow the supplied filenames. The profiles and captions remain illustrative. No precise location is assigned from an unverified photograph.

Feed photographs use their native aspect ratios; the detail viewer, upload previews and gallery thumbnails use `object-fit: contain`. Hovering does not zoom or crop photographs. Each supplied photo has a credit and a full-resolution original link in its viewer. All 20 memories are available on the initial feed, with below-fold images lazy-loaded. New uploads also retain their aspect ratios.

Motion is limited to like/save feedback and notifications; CSS handles image and button hover states. The community adds no animation libraries and does not run GSAP, Lenis or Embla on the feed.

## Validation

Validated locally in Chromium at 1,440, 820, 390 and 320 pixels wide: no community horizontal overflow, missing images, or browser runtime errors. Exercised search, destination filtering, likes, bookmarks, reload persistence, gallery navigation, comments, copying links, profile editing, photo upload with description, post creation/deletion, hiding/restoring stories, draft-discard confirmation, keyboard focus cycling, and reduced motion. Homepage navigation to the community and story deep links also passed.

Automated axe WCAG A/AA checks found no violations in the feed, story detail, composer, profile, guidelines, or sharing dialog. This is automated Chromium coverage, not a claim of a complete accessibility or cross-browser audit. Lint, TypeScript, all 13 unit tests, and the production build passed. No community dependencies were added.
