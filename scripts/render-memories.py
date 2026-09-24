#!/usr/bin/env python3
"""Create the 40-second Island Memories photo film, without changing the website.

Requires FFmpeg plus Pillow, numpy, scipy, fonttools and brotli in a Python venv.
Run from any directory: python scripts/render-memories.py
Outputs a 1080p MP4 with an original instrumental score and a silent 720p web copy.
"""
import json
import math
from pathlib import Path
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/images/community'
OUT = ROOT / 'outputs/island-memories'
WIDTH, HEIGHT, FPS, SECONDS = 1920, 1080, 30, 40
SAND, JUNGLE, CINNAMON, SAFFRON = '#F5F0E6', '#12372A', '#A84D35', '#E99A3E'
ORDER = [
    'matt-dany', 'anton-lecock', 'raissa-lara', 'isuru-ranasinha',
    'eddy-billard', 'simmel', 'kirsty-barnby', 'sander-traa',
    'praveen-maleesha-5XS', 'petr-sevcovic', 'pasha-chusovitin',
    'praveen-maleesha-gCj', 'morgan-nott', 'thilina-alagiyawanna',
    'tom-paisley', 'wietse-jongsma', 'tomas-malik', 'zoshua-colah',
    'chathura-anuradha', 'lou-lou-b-photo',
]
TITLES = [
    (0.5, 5.9, 'SOME JOURNEYS\nSTAY WITH YOU.'),
    (6.4, 12.5, 'THE LITTLE\nDETOURS.'),
    (13.0, 19.2, 'THE PEOPLE.\nTHE FEELING.'),
    (20.0, 27.6, 'MOMENTS YOU WISH\nYOU COULD KEEP.'),
    (28.0, 30.2, 'THE JOURNEY\nENDS.'),
    (30.5, 33.7, 'THE FEELING\nSTAYS.'),
]


def font(source, destination, weight=None):
    face = TTFont(source)
    if weight is not None and 'fvar' in face:
        face = instantiateVariableFont(face, {'wght': weight})
    face.flavor = None
    face.save(destination)
    return str(destination)


def tracked(draw, text, xy, face, fill, spacing=4, centered=False):
    width = sum(draw.textlength(char, font=face) for char in text) + spacing * (len(text) - 1)
    x, y = xy
    if centered:
        x -= width / 2
    for char in text:
        draw.text((round(x), y), char, font=face, fill=fill, anchor='lt')
        x += draw.textlength(char, font=face) + spacing


def compose_photo(path):
    original = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    background = ImageOps.fit(original, (WIDTH // 3, HEIGHT // 3), method=Image.Resampling.LANCZOS)
    background = background.filter(ImageFilter.GaussianBlur(18)).resize((WIDTH, HEIGHT), Image.Resampling.BICUBIC)
    background = Image.blend(background, Image.new('RGB', background.size, JUNGLE), 0.32)
    photo = ImageOps.contain(original, (int(WIDTH * .92), int(HEIGHT * .92)), Image.Resampling.LANCZOS)
    # A margin ensures even the maximum camera move never crops the foreground photo.
    shadow = Image.new('RGBA', (WIDTH, HEIGHT))
    x, y = (WIDTH-photo.width)//2, (HEIGHT-photo.height)//2
    ImageDraw.Draw(shadow).rectangle((x, y+9, x+photo.width, y+photo.height+9), fill=(4, 15, 12, 95))
    background = Image.alpha_composite(background.convert('RGBA'), shadow.filter(ImageFilter.GaussianBlur(20))).convert('RGB')
    background.paste(photo, (x, y))
    return background


def movement(frame, progress, index):
    progress = max(0, min(progress, 1))
    # Alternate an extremely gentle push-in and pull-back, with eased endpoints.
    eased = progress * progress * (3 - 2 * progress)
    zoom = 1 + .024 * (eased if index % 2 == 0 else 1-eased)
    width, height = WIDTH/zoom, HEIGHT/zoom
    x, y = (WIDTH-width)/2, (HEIGHT-height)/2
    return frame.transform((WIDTH, HEIGHT), Image.Transform.EXTENT, (x, y, x+width, y+height), Image.Resampling.BICUBIC)


def title_layer(text, display, sans):
    layer = Image.new('RGBA', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(layer)
    tracked(draw, 'HELLOSRILANKA  /  ISLAND MEMORIES', (108, 94), ImageFont.truetype(sans, 20), SAND, 3)
    draw.line((108, 145, 168, 145), fill=SAFFRON, width=3)
    size = 94
    while True:
        face = ImageFont.truetype(display, size)
        if max(draw.textlength(line, font=face) for line in text.split('\n')) <= 505:
            break
        size -= 1
    for index, line in enumerate(text.split('\n')):
        draw.text((108, 182 + index * (size+17)), line, font=face, fill=SAND, anchor='lt')
    draw.text((108, 986), 'Your Sri Lanka. Your way.', font=ImageFont.truetype(sans, 24), fill=SAND, anchor='lt')
    return layer


def closing_card(display, sans):
    card = Image.new('RGB', (WIDTH, HEIGHT), SAND)
    draw = ImageDraw.Draw(card)
    tracked(draw, 'THE FEELING STAYS.', (WIDTH/2, 286), ImageFont.truetype(sans, 22), CINNAMON, 5, True)
    face = ImageFont.truetype(display, 146)
    text = 'ISLAND MEMORIES'
    draw.text(((WIDTH-draw.textlength(text, font=face))/2, 388), text, font=face, fill=JUNGLE, anchor='lt')
    draw.line((WIDTH/2-38, 587, WIDTH/2+38, 587), fill=CINNAMON, width=3)
    text, face = 'Your Sri Lanka. Your way.', ImageFont.truetype(sans, 37)
    draw.text(((WIDTH-draw.textlength(text, font=face))/2, 637), text, font=face, fill=JUNGLE, anchor='lt')
    text, face = 'HelloSriLanka', ImageFont.truetype(sans, 39)
    draw.text(((WIDTH-draw.textlength(text, font=face))/2, 827), text, font=face, fill=JUNGLE, anchor='lt')
    return card


def soundtrack(target):
    """An original D-major ambient miniature: soft keys, slow pads and stereo echoes."""
    rate = 48000
    samples = int(SECONDS * rate)
    mix = np.zeros((samples, 2), dtype=np.float64)
    rng = np.random.default_rng(217)
    chords = [(50, 57, 61, 66), (47, 54, 57, 62), (43, 50, 54, 59),
              (45, 52, 57, 59), (50, 57, 61, 66), (43, 50, 54, 59), (50, 57, 62, 66)]

    def add(signal, start, pan=0):
        offset = int(start*rate)
        count = min(len(signal), samples-offset)
        if count <= 0:
            return
        angle = (pan+1)*math.pi/4
        mix[offset:offset+count, 0] += signal[:count]*math.cos(angle)
        mix[offset:offset+count, 1] += signal[:count]*math.sin(angle)

    for chord_index, chord in enumerate(chords):
        start = chord_index * 5.6
        t = np.arange(int(8.0*rate))/rate
        envelope = np.minimum(t/1.8, 1)*np.minimum((8-t)/3.2, 1)
        pad = np.zeros_like(t)
        for midi in chord:
            freq = 440*2**((midi-69)/12)
            pad += (np.sin(2*np.pi*freq*t)+.16*np.sin(2*np.pi*(freq*2+.14)*t))/len(chord)
        add(pad*envelope*.065, start, -.12 if chord_index%2 else .12)
        for n, note_index in enumerate([0, 2, 1, 3, 2, 1]):
            onset = start+.3+n*.83
            t = np.arange(int(4.5*rate))/rate
            frequency = 440*2**((chord[note_index]+12-69)/12)
            tone = sum(gain*np.sin(2*np.pi*frequency*harmonic*t+rng.uniform(-.05, .05))*np.exp(-t*(.75+harmonic*.24))
                       for harmonic, gain in [(1, 1), (2, .25), (3, .09), (4, .035)])
            tone *= (1-np.exp(-t/0.016))*.13*(.86 if n%2 else 1)
            add(tone, onset, (-.3, .28, -.1, .4, -.2, .1)[n])
    dry = mix.copy()
    for delay, gain in [(.137, .15), (.293, .12), (.479, .1), (.733, .08), (1.07, .06), (1.41, .04)]:
        offset = int(delay*rate)
        mix[offset:] += dry[:-offset, ::-1]*gain
    mix = sosfilt(butter(2, 4300, fs=rate, output='sos'), mix, axis=0)
    t = np.arange(samples)/rate
    envelope = np.minimum(t/2.2, 1)*np.clip((SECONDS-t)/4.2, 0, 1)
    mix *= envelope[:, None]
    mix *= .76/max(np.max(np.abs(mix)), .01)
    wavfile.write(target, rate, (mix*32767).astype(np.int16))


def run(*args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = []
    for prefix in ORDER:
        matching = list(SOURCE.glob(prefix+'*.jpg'))
        if len(matching) != 1:
            raise ValueError(f'Expected one source for {prefix}, found {len(matching)}')
        files.append(matching[0])
    assert set(files) == set(SOURCE.glob('*.jpg')), 'Every supplied photograph must appear exactly once.'
    with tempfile.TemporaryDirectory(prefix='island-memories-render-') as scratch:
        scratch = Path(scratch)
        display = font(ROOT/'node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2', scratch/'Anton.ttf')
        sans = font(ROOT/'node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2', scratch/'DM-Sans.ttf', 450)
        print('Preparing all 20 full-frame photographs and original music…', flush=True)
        photos = [compose_photo(path) for path in files]
        titles = [title_layer(text, display, sans) for _, _, text in TITLES]
        end = closing_card(display, sans)
        end.save(OUT/'island-memories-end-card.png')
        soundtrack(scratch/'score.wav')
        # Text stays on the left, separate from the central subjects in portrait shots.
        shade = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)
        shade[:, :, :3] = (9, 25, 19)
        shade[:, :, 3] = (np.clip(1-np.arange(WIDTH)/880, 0, 1)**1.8*170).astype(np.uint8)[None, :]
        shade = Image.fromarray(shade)
        master = OUT/'hello-srilanka-island-memories-1080p.mp4'
        command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                   '-s', f'{WIDTH}x{HEIGHT}', '-r', str(FPS), '-i', 'pipe:0', '-i', str(scratch/'score.wav'),
                   '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-threads', '4',
                   '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-af', 'loudnorm=I=-20:TP=-2:LRA=9',
                   '-t', str(SECONDS), '-movflags', '+faststart', '-metadata', 'title=Island Memories | HelloSriLanka',
                   '-metadata', 'comment=20 supplied photographs; Anton and DM Sans; original instrumental score.', str(master)]
        encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
        try:
            for index in range(SECONDS*FPS):
                t = index/FPS
                if t < 33.6:
                    current = min(19, int(t/1.6))
                    local = t-current*1.6
                    duration = 3.6 if current == 19 else 2.0
                    frame = movement(photos[current], local/duration, current)
                    if current > 0 and local < .4:
                        previous = movement(photos[current-1], (local+1.6)/2.0, current-1)
                        frame = Image.blend(previous, frame, local/.4)
                else:
                    frame = end.copy()
                    if t < 34:
                        previous = movement(photos[19], (t-30.4)/3.6, 19)
                        frame = Image.blend(previous, frame, (t-33.6)/.4)
                for title_index, (start, stop, _) in enumerate(TITLES):
                    if start <= t < stop:
                        opacity = min((t-start)/.4, (stop-t)/.4, 1)
                        eased = opacity*opacity*(3-2*opacity)
                        shaded = Image.alpha_composite(frame.convert('RGBA'), shade)
                        shifted = Image.new('RGBA', (WIDTH, HEIGHT))
                        shifted.paste(titles[title_index], (0, round((1-eased)*12)))
                        titled = Image.alpha_composite(shaded, shifted).convert('RGB')
                        frame = Image.blend(frame, titled, eased)
                if t < .4:
                    frame = Image.blend(Image.new('RGB', frame.size, JUNGLE), frame, t/.4)
                if index == 45:
                    frame.save(OUT/'island-memories-poster.jpg', quality=94)
                if index % 120 == 45:
                    frame.save(OUT/f'review-{index/FPS:04.1f}s.jpg', quality=88)
                encoder.stdin.write(frame.tobytes())
                if index % 90 == 0:
                    print(f'Rendering {t:04.1f}s / {SECONDS}s', flush=True)
        finally:
            encoder.stdin.close()
        if encoder.wait() != 0:
            raise RuntimeError('Video encoding failed')
        print('Encoding lightweight silent website copy…', flush=True)
        run('-i', master, '-an', '-vf', 'scale=1280:720', '-c:v', 'libx264', '-preset', 'fast', '-crf', '25',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', 4, OUT/'hello-srilanka-island-memories-web.mp4')
        (OUT/'edit-manifest.json').write_text(json.dumps({
            'title': 'Island Memories', 'seconds': SECONDS, 'fps': FPS, 'resolution': [WIDTH, HEIGHT],
            'fonts': ['Anton', 'DM Sans'], 'palette': [SAND, JUNGLE, CINNAMON, SAFFRON],
            'photographs': [path.name for path in files], 'titles': TITLES,
            'soundtrack': 'Original synthesized ambient composition in D major; no external recordings.',
            'full_frame': 'Foreground photographs remain entirely visible throughout all camera moves.',
        }, indent=2)+'\n')
        print(f'Finished: {master}', flush=True)


if __name__ == '__main__':
    main()
