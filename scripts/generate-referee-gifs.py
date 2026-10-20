"""Generate the offline tactical replay GIFs used by the referee real-quiz mode.

The clips are schematic teaching diagrams, not official FIBA footage. They are
checked in so the quiz works offline; rerun this script after changing a scene.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


WIDTH, HEIGHT = 640, 360
FRAMES = 32
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "referee"

INK = "#182019"
MUTED = "#6D776F"
PRIMARY = "#275C3B"
PRIMARY_SOFT = "#DCEBDD"
COURT = "#EDF5EC"
COURT_LINE = "#87A08D"
DEFENCE = "#B8574F"
BALL = "#E99135"
WHITE = "#FFFFFF"


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    names = ["arialbd.ttf" if bold else "arial.ttf", "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"]
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


FONT_SMALL = font(15)
FONT_LABEL = font(16, True)
FONT_TITLE = font(18, True)
FONT_CLOCK = font(27, True)


def ease(value: float) -> float:
    return value * value * (3 - 2 * value)


def lerp(start: float, end: float, value: float) -> float:
    return start + (end - start) * ease(max(0.0, min(1.0, value)))


def point(start: tuple[float, float], end: tuple[float, float], value: float) -> tuple[float, float]:
    return lerp(start[0], end[0], value), lerp(start[1], end[1], value)


def base(title: str, frame: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (WIDTH, HEIGHT), WHITE)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((20, 16, WIDTH - 20, 52), 15, fill=PRIMARY)
    draw.text((38, 25), f"TACTICAL REPLAY  •  {title}", font=FONT_SMALL, fill=WHITE)
    draw.rounded_rectangle((20, 64, WIDTH - 20, HEIGHT - 20), 22, fill=COURT, outline=PRIMARY_SOFT, width=3)
    draw.line((WIDTH / 2, 64, WIDTH / 2, HEIGHT - 20), fill=COURT_LINE, width=3)
    draw.ellipse((WIDTH / 2 - 48, 148, WIDTH / 2 + 48, 244), outline=COURT_LINE, width=3)
    draw.rectangle((500, 128, 620, 280), outline=COURT_LINE, width=3)
    draw.arc((442, 90, 670, 318), 90, 270, fill=COURT_LINE, width=3)
    draw.line((595, 175, 595, 217), fill=INK, width=5)
    draw.ellipse((580, 186, 604, 204), outline=BALL, width=4)
    progress = (frame + 1) / FRAMES
    draw.rounded_rectangle((437, 29, 590, 37), 4, fill="#4F765C")
    draw.rounded_rectangle((437, 29, 437 + 153 * progress, 37), 4, fill="#F3BD5B")
    return image, draw


def player(draw: ImageDraw.ImageDraw, x: float, y: float, label: str, colour: str, arms: str = "down") -> None:
    x, y = int(x), int(y)
    if arms == "up":
        draw.line((x - 8, y - 12, x - 20, y - 34), fill=colour, width=7)
        draw.line((x + 8, y - 12, x + 20, y - 34), fill=colour, width=7)
    elif arms == "wide":
        draw.line((x - 8, y - 11, x - 27, y - 5), fill=colour, width=7)
        draw.line((x + 8, y - 11, x + 27, y - 5), fill=colour, width=7)
    else:
        draw.line((x - 7, y + 3, x - 15, y + 23), fill=colour, width=7)
        draw.line((x + 7, y + 3, x + 15, y + 23), fill=colour, width=7)
    draw.ellipse((x - 20, y - 20, x + 20, y + 20), fill=colour, outline=WHITE, width=3)
    box = draw.textbbox((0, 0), label, font=FONT_LABEL)
    draw.text((x - (box[2] - box[0]) / 2, y - 9), label, font=FONT_LABEL, fill=WHITE)


def ball(draw: ImageDraw.ImageDraw, x: float, y: float) -> None:
    x, y = int(x), int(y)
    draw.ellipse((x - 9, y - 9, x + 9, y + 9), fill=BALL, outline=INK, width=2)
    draw.arc((x - 7, y - 8, x + 7, y + 8), 85, 275, fill=INK, width=1)
    draw.line((x - 8, y, x + 8, y), fill=INK, width=1)


def arrow(draw: ImageDraw.ImageDraw, start: tuple[float, float], end: tuple[float, float], colour: str = MUTED) -> None:
    draw.line((*start, *end), fill=colour, width=4)
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    for offset in (-0.55, 0.55):
        tip = (end[0] - 14 * math.cos(angle + offset), end[1] - 14 * math.sin(angle + offset))
        draw.line((*end, *tip), fill=colour, width=4)


def clock(draw: ImageDraw.ImageDraw, value: str) -> None:
    draw.rounded_rectangle((36, 78, 118, 124), 10, fill=INK)
    box = draw.textbbox((0, 0), value, font=FONT_CLOCK)
    draw.text((77 - (box[2] - box[0]) / 2, 85), value, font=FONT_CLOCK, fill="#F3BD5B")


def ground_roll(frame: int) -> Image.Image:
    image, draw = base("GROUND PLAY", frame)
    t = frame / (FRAMES - 1)
    x = lerp(205, 350, min(t / 0.65, 1))
    angle = 0 if t < 0.62 else lerp(0, 150, (t - 0.62) / 0.38)
    player(draw, x, 205, "A3", PRIMARY)
    ball(draw, x + 26 * math.cos(math.radians(angle)), 205 + 22 * math.sin(math.radians(angle)))
    arrow(draw, (205, 250), (350, 250))
    if t > 0.62:
        draw.arc((310, 160, 405, 255), 40, 310, fill=MUTED, width=4)
    return image


def slide_and_pass(frame: int) -> Image.Image:
    image, draw = base("GROUND PLAY", frame)
    t = frame / (FRAMES - 1)
    x = lerp(190, 310, min(t / 0.58, 1))
    player(draw, x, 230, "A4", PRIMARY)
    player(draw, 465, 140, "A7", PRIMARY)
    if t < 0.62:
        ball(draw, x + 22, 218)
    else:
        bx, by = point((332, 218), (442, 152), (t - 0.62) / 0.38)
        ball(draw, bx, by)
        arrow(draw, (335, 208), (430, 158))
    return image


def airborne_new_control(frame: int) -> Image.Image:
    image, draw = base("AIRBORNE CATCH", frame)
    t = frame / (FRAMES - 1)
    draw.text((266, 292), "CENTRE LINE", font=FONT_SMALL, fill=MUTED)
    px, py = point((395, 190), (270, 214), t)
    lift = 24 * math.sin(math.pi * t)
    player(draw, px, py - lift, "B6", DEFENCE, "up")
    if t < 0.42:
        bx, by = point((520, 125), (405, 157), t / 0.42)
    else:
        bx, by = px, py - lift - 34
    ball(draw, bx, by)
    arrow(draw, (405, 258), (268, 258))
    return image


def airborne_throw_in(frame: int) -> Image.Image:
    image, draw = base("THROW-IN CATCH", frame)
    t = frame / (FRAMES - 1)
    draw.text((266, 292), "CENTRE LINE", font=FONT_SMALL, fill=MUTED)
    player(draw, 565, 90, "A5", PRIMARY)
    px, py = point((410, 178), (272, 212), t)
    lift = 26 * math.sin(math.pi * t)
    player(draw, px, py - lift, "A9", PRIMARY, "up")
    if t < 0.42:
        bx, by = point((545, 105), (420, 150), t / 0.42)
    else:
        bx, by = px, py - lift - 34
    ball(draw, bx, by)
    arrow(draw, (410, 258), (268, 258))
    return image


def guarded_count(frame: int) -> Image.Image:
    image, draw = base("CLOSELY GUARDED", frame)
    t = frame / (FRAMES - 1)
    count = min(5, 1 + int(t * 5))
    clock(draw, f"{count}")
    sway = 8 * math.sin(t * math.pi * 4)
    player(draw, 330 + sway, 205, "A9", PRIMARY)
    player(draw, 395 + sway / 2, 205, "B4", DEFENCE, "wide")
    bx = 340 + sway
    by = 238 - abs(math.sin(t * math.pi * 5)) * 32
    if 0.68 < t < 0.82:
        bx += 24
    ball(draw, bx, by)
    draw.line((360, 270, 385, 270), fill=MUTED, width=3)
    draw.text((363, 276), "<1m", font=FONT_SMALL, fill=MUTED)
    return image


def vertical_cylinder(frame: int) -> Image.Image:
    image, draw = base("VERTICALITY", frame)
    t = frame / (FRAMES - 1)
    dx = lerp(410, 430, t)
    jump = 28 * math.sin(math.pi * t)
    player(draw, dx, 210 - jump, "B5", DEFENCE, "up")
    ax, ay = point((315, 225), (402, 194), t)
    player(draw, ax, ay, "A2", PRIMARY, "up")
    ball(draw, ax + 4, ay - 38)
    draw.rounded_rectangle((398, 132, 462, 254), 25, outline=DEFENCE, width=3)
    return image


def clear_path_contact(frame: int) -> Image.Image:
    image, draw = base("TRANSITION PLAY", frame)
    t = frame / (FRAMES - 1)
    ax, ay = point((210, 215), (500, 190), t)
    bx, by = point((150, 240), (440, 214), t)
    player(draw, ax, ay, "A11", PRIMARY)
    player(draw, bx, by, "B11", DEFENCE)
    ball(draw, ax + 24, ay + 12)
    if t > 0.62:
        draw.line((bx + 14, by - 4, ax - 15, ay + 5), fill=DEFENCE, width=7)
        draw.ellipse((ax - 25, ay - 5, ax - 11, ay + 9), outline="#F3BD5B", width=4)
    arrow(draw, (210, 286), (515, 286))
    return image


def shot_clock_release(frame: int) -> Image.Image:
    image, draw = base("SHOT-CLOCK SEQUENCE", frame)
    t = frame / (FRAMES - 1)
    clock(draw, "0.2" if t < 0.45 else "0.0")
    player(draw, 205, 220, "A4", PRIMARY)
    player(draw, 365, 210, "A6", PRIMARY, "up")
    if t < 0.42:
        bx, by = point((228, 205), (350, 178), t / 0.42)
    elif t < 0.62:
        bx, by = 365, 172
    else:
        bx, by = point((365, 172), (545, 112), (t - 0.62) / 0.38)
    ball(draw, bx, by)
    if t >= 0.45:
        draw.text((132, 88), "BUZZER", font=FONT_TITLE, fill=DEFENCE)
    return image


def safe_rim_hang(frame: int) -> Image.Image:
    image, draw = base("AT THE RIM", frame)
    t = frame / (FRAMES - 1)
    player(draw, 560, 250, "B8", DEFENCE)
    if t < 0.45:
        ax, ay = point((475, 220), (575, 165), t / 0.45)
        player(draw, ax, ay, "A8", PRIMARY, "up")
        ball(draw, ax + 15, ay - 35)
    elif t < 0.78:
        player(draw, 575, 155, "A8", PRIMARY, "up")
        ball(draw, 594, 205)
        draw.line((568, 133, 584, 190), fill=PRIMARY, width=6)
    else:
        ax, ay = point((575, 155), (525, 225), (t - 0.78) / 0.22)
        player(draw, ax, ay, "A8", PRIMARY)
        ball(draw, 594, 205)
    return image


def endline_exchange(frame: int) -> Image.Image:
    image, draw = base("ENDLINE THROW-IN", frame)
    t = frame / (FRAMES - 1)
    draw.line((115, 308, 575, 308), fill=INK, width=5)
    draw.text((36, 309), "ENDLINE", font=FONT_SMALL, fill=MUTED)
    x1 = lerp(190, 300, min(t / 0.45, 1))
    player(draw, x1, 326, "B1", DEFENCE)
    player(draw, 405, 326, "B2", DEFENCE)
    if t < 0.48:
        ball(draw, x1 + 24, 315)
    elif t < 0.7:
        bx, by = point((325, 315), (382, 315), (t - 0.48) / 0.22)
        ball(draw, bx, by)
    else:
        bx, by = point((405, 315), (478, 252), (t - 0.7) / 0.3)
        ball(draw, bx, by)
    arrow(draw, (190, 342), (405, 342))
    return image


SCENES = {
    "ground-roll-travel.gif": ground_roll,
    "legal-slide-pass.gif": slide_and_pass,
    "airborne-new-control.gif": airborne_new_control,
    "airborne-throw-in.gif": airborne_throw_in,
    "guarded-five-seconds.gif": guarded_count,
    "vertical-cylinder.gif": vertical_cylinder,
    "clear-path-contact.gif": clear_path_contact,
    "shot-clock-release.gif": shot_clock_release,
    "safe-rim-hang.gif": safe_rim_hang,
    "endline-exchange.gif": endline_exchange,
}


def save_gif(name: str, scene) -> None:
    frames = [scene(i).quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for i in range(FRAMES)]
    frames[0].save(
        OUTPUT / name,
        save_all=True,
        append_images=frames[1:],
        duration=85,
        loop=0,
        optimize=True,
        disposal=2,
    )


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, scene in SCENES.items():
        save_gif(name, scene)
        print(f"generated {name}")


if __name__ == "__main__":
    main()
