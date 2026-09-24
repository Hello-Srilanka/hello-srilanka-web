# Island Memories — HelloSriLanka

A 40-second cinematic photo film made from all 20 supplied photographs.

- `hello-srilanka-island-memories-1080p.mp4`: 1920 × 1080, 30 fps, H.264 with an original stereo instrumental score.
- `hello-srilanka-island-memories-web.mp4`: smaller 1280 × 720 silent copy for web use.
- `island-memories-poster.jpg`: an opening frame with the title.
- `island-memories-end-card.png`: the final brand composition.
- `edit-manifest.json`: source photographs, title timing, fonts, colours and soundtrack information.
- `review-*.jpg`: visual review frames from the render.

The film uses Anton and DM Sans from the website's installed font packages, Warm Sand, Deep Jungle, Cinnamon and a small Saffron accent. Full photographs remain visible throughout the gentle camera moves; the background uses a blurred extension of the same image. Titles fade and move slightly, with soft dissolves between photographs.

The soundtrack is an original synthesized ambient composition with soft keys and sustained chords. No external music recordings or voiceovers are used. The source photos are unchanged. This is an animated photo film; people and scenery within the photographs are not generatively animated.

The 1080p video is copied to `public/media/island-memories-1080p.mp4` and used as the full-viewport background on `/memories`. It starts muted, with pause and sound controls. The homepage hero is separate. If re-rendering, copy the new master into that public media path to update the website version.

## Re-render

Requires FFmpeg and a Python environment with Pillow, numpy, scipy, fonttools and brotli:

```sh
python scripts/render-memories.py
```

The script resolves source images and fonts relative to the repository and overwrites these generated outputs.
