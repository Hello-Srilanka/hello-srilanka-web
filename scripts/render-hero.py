#!/usr/bin/env python3
"""Render the local footage without modifying originals. Requires FFmpeg on PATH.

python3 scripts/render-hero.py '/path/to/hello srilanka vidoes copy'
Use --ffmpeg /path/to/ffmpeg if it is not on PATH.
"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
EDIT = json.loads((ROOT / 'scripts/hero-edit.json').read_text())
FPS = EDIT['fps']


def run(*args):
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)


def render(source, target, scratch):
    mobile = target == 'mobile'
    width, height = (720, 1280) if mobile else (1920, 1080)
    parts = []
    for index, shot in enumerate(EDIT['shots']):
        output = scratch / f'{target}-{index}.mp4'
        filters = [f"setpts=(PTS-STARTPTS)/{shot['speed']}", f'fps={FPS}']
        if mobile:
            filters.append(f"crop=trunc(ih*9/16/2)*2:ih:'(iw-ow)*({shot['crop']})':0")
        filters.extend([f'scale={width}:{height}:flags=lanczos', 'setsar=1', shot['grade'], 'format=yuv420p'])
        print(f"{target}: {shot['scene']}", flush=True)
        run('-ss', shot['start'], '-i', source / shot['file'], '-map', '0:v:0', '-an',
            '-vf', ','.join(filters), '-frames:v', shot['frames'], '-c:v', 'libx264',
            '-preset', 'fast', '-crf', 16, '-threads', 4, '-video_track_timescale', 15360, output)
        parts.append(output)

    # Only the final transition dissolves. The remaining scene boundaries are hard cuts.
    end = scratch / f'{target}-end.mp4'
    offset = (EDIT['shots'][-2]['frames'] - EDIT['closing_dissolve_frames']) / FPS
    dissolve = EDIT['closing_dissolve_frames'] / FPS
    run('-i', parts[-2], '-i', parts[-1], '-filter_complex_threads', 2,
        '-filter_complex', f'[0:v][1:v]xfade=transition=fade:duration={dissolve}:offset={offset},format=yuv420p[v]',
        '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', 16,
        '-threads', 4, '-video_track_timescale', 15360, end)
    listing = scratch / f'{target}-concat.txt'
    listing.write_text(''.join(f"file '{p}'\n" for p in [*parts[:-2], end]))
    master = scratch / f'{target}-master.mp4'
    run('-f', 'concat', '-safe', 0, '-i', listing, '-c', 'copy', master)
    output = ROOT / 'public/media' / f'sri-lanka-{target}'
    frames = sum(s['frames'] for s in EDIT['shots']) - EDIT['closing_dissolve_frames']
    common = ['-i', master, '-map', '0:v:0', '-an', '-map_metadata', -1, '-frames:v', frames,
              '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709']
    print(f'Encoding {target} MP4 / WebM', flush=True)
    run(*common, '-c:v', 'libx264', '-preset', 'slow', '-crf', 27 if mobile else 26,
        '-maxrate', '800k' if mobile else '2000k', '-bufsize', '1600k' if mobile else '4000k',
        '-profile:v', 'high', '-g', 60, '-threads', 4, '-movflags', '+faststart', output.with_suffix('.mp4'))
    for pass_number in [1, 2]:
        run(*common, '-c:v', 'libvpx-vp9', '-crf', 40, '-b:v', '650k' if mobile else '1500k',
            '-row-mt', 1, '-cpu-used', 4 if pass_number == 1 else 3, '-g', 120, '-threads', 4,
            '-pass', pass_number, '-passlogfile', scratch / f'{target}-vp9',
            *(['-f', 'null', '/dev/null'] if pass_number == 1 else [output.with_suffix('.webm')]))
    # The poster is the exact opening composition, with responsive landscape variants.
    if mobile:
        run('-i', master, '-frames:v', 1, '-c:v', 'libwebp', '-quality', 84,
            ROOT / 'public/media/hero-poster-mobile.webp')
    else:
        for size in [None, 480, 768, 1200, 1600, 2000]:
            suffix = f'-{size}' if size else ''
            run('-i', master, '-frames:v', 1, '-vf', f'scale={size or width}:-1',
                '-c:v', 'libwebp', '-quality', 84, ROOT / f'public/images/hero-film{suffix}.webp')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
    parser.add_argument('--target', choices=['desktop', 'mobile', 'both'], default='both')
    args = parser.parse_args()
    if not args.ffmpeg:
        parser.error('FFmpeg is required; install it or pass --ffmpeg /path/to/ffmpeg')
    FFMPEG = args.ffmpeg
    for shot in EDIT['shots']:
        if not (args.source / shot['file']).is_file():
            parser.error(f"Missing source: {args.source / shot['file']}")
    (ROOT / 'public/media').mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='hello-hero-') as tmp:
        for target in (['desktop', 'mobile'] if args.target == 'both' else [args.target]):
            render(args.source, target, Path(tmp))
