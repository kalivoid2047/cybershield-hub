"""Renders the project logo (frontend/public/favicon.svg) to the PNG sources that
flutter_launcher_icons needs. Run from the mobile/ folder, then:

    dart run flutter_launcher_icons

Requires Pillow. The shapes are transcribed from the SVG (32x32 viewBox):
  - navy tile           #07111f
  - shield outline      #2dd4ff, stroke 2
  - tick                #2ee59d, stroke 2.2
"""
from pathlib import Path

from PIL import Image, ImageDraw

BG = (7, 17, 31, 255)
SHIELD = (45, 212, 255, 255)
TICK = (46, 229, 157, 255)
SS = 4  # supersampling factor for smooth edges
OUT = Path(__file__).resolve().parent.parent / "assets" / "icon"


def cubic(p0, p1, p2, p3, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((
            u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
        ))
    return pts


def shield_points():
    # M16 5 l9 3.5 v6.6 c0 5.4-3.6 9.4-9 11.9 c-5.4-2.5-9-6.5-9-11.9 V8.5 L16 5z
    pts = [(16, 5), (25, 8.5), (25, 15.1)]
    pts += cubic((25, 15.1), (25, 20.5), (21.4, 24.5), (16, 27))[1:]
    pts += cubic((16, 27), (10.6, 24.5), (7, 20.5), (7, 15.1))[1:]
    pts += [(7, 8.5), (16, 5)]
    return pts


TICK_POINTS = [(12, 15.5), (15, 18.5), (20, 12.5)]


def stroke(draw, pts, width, color, mapper):
    mapped = [mapper(p) for p in pts]
    w = width * mapper.scale
    draw.line(mapped, fill=color, width=round(w), joint="curve")
    r = w / 2
    for x, y in (mapped[0], mapped[-1]) if pts is TICK_POINTS else mapped:
        draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


class Mapper:
    """Maps logo coordinates (centred on the shield) to canvas pixels."""

    def __init__(self, size, shield_height_fraction):
        # Shield spans y 5..27 (22 units) centred on (16, 16).
        self.scale = size * shield_height_fraction / 22
        self.size = size

    def __call__(self, p):
        return (self.size / 2 + (p[0] - 16) * self.scale, self.size / 2 + (p[1] - 16) * self.scale)


def render(size, shield_fraction, background):
    canvas = size * SS
    img = Image.new("RGBA", (canvas, canvas), BG if background else (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    mapper = Mapper(canvas, shield_fraction)
    stroke(draw, shield_points(), 2, SHIELD, mapper)
    stroke(draw, TICK_POINTS, 2.2, TICK, mapper)
    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # Full-bleed square for iOS and legacy Android (the OS applies its own rounding).
    render(1024, 0.56, True).convert("RGB").save(OUT / "icon.png")
    # Adaptive-icon foreground: the launcher masks to a circle/squircle and only the
    # centre ~66% is guaranteed visible, so the shield stays well inside that.
    render(1024, 0.46, False).save(OUT / "icon_foreground.png")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
