# HelloSriLanka opening film

24.5 seconds, 30 fps, silent. No baked-in text or logos. Edited from the user's local footage; originals are unchanged. Source filenames and trim/crop/grade settings are recorded in `scripts/hero-edit.json`.

## Deliverables

- `sri-lanka-desktop.mp4` / `.webm`: 1920 × 1080 landscape, H.264 / VP9.
- `sri-lanka-mobile.mp4` / `.webm`: 720 × 1280 portrait, individually framed shots and a moving crop following the train.
- `hero-poster-mobile.webp`: portrait opening frame.
- `../images/hero-film.webp` and responsive sizes: landscape opening frame.

Browsers choose WebM when supported, with MP4 fallback. MP4 files have their index at the front for progressive playback. Neither version contains an audio track. The mobile film is selected before a video element is mounted, so phones do not first fetch the desktop film.

## Edit

| Time | Scene |
| --- | --- |
| 0–3 s | Mountain ridge: a quiet opening |
| 3–7 s | Train across the viaduct, slowed to 80% speed |
| 7–9.5 s | Ocean surf and tropical coastline |
| 9.5–10.8 s | Brief food close-up |
| 10.8–12.8 s | Sigiriya, slowed to 80% speed |
| 12.8–14 s | Hilltop stupa |
| 14–17.7 s | Procession and drummers |
| 17.7–21.7 s | Friends dancing |
| 21.2–24.5 s | Half-second dissolve into the mountains; quiet close |

Seven clean cuts and one restrained dissolve. The mountain shot at the end finishes at source time 3.6 s; the opening begins at 3.6 s, continuing the same camera movement across the loop boundary. Shot-level contrast and saturation adjustments keep the cameras visually consistent without a heavy colour effect.

The train, procession and friends receive 11.7 of 24.5 seconds before accounting for the closing dissolve, approximately half of the montage. The supplied selection has no surfing, food preparation, market interaction or wild-habitat wildlife. `15959813_1920_1080_60fps.mp4` was deliberately omitted: the elephant is in a managed visitor area, contrary to the brief's wildlife direction. No substitute wildlife was invented. The food source is 960 × 540 and the friends source is 1280 × 720; these shots are upscaled for the desktop deliverable, so their original detail remains lower than the 4K landscape sources.

## Re-render

Install FFmpeg with libx264, libvpx-vp9 and libwebp support, then run from the repository root:

```sh
python3 scripts/render-hero.py '/path/to/hello srilanka vidoes copy'
```

Use `--ffmpeg /path/to/ffmpeg` for a nonstandard binary location or `--target mobile` / `--target desktop` for just one version. The script uses temporary intermediate files and reads the originals without modifying them. Only the finished assets are written into `public/`.

Footage was supplied by the user for this edit. Original creators and acquisition URLs were not included in the supplied folder; no third-party attribution or license claim is inferred from filenames.
