"""Generate the offline tactical replay GIFs used by the referee real-quiz mode.

The clips are schematic teaching diagrams, not official FIBA footage. They are
checked in so the quiz works offline; rerun this script after changing a scene.
"""

from __future__ import annotations

import math
import sys
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


def centre_label(draw: ImageDraw.ImageDraw) -> None:
    draw.text((266, 292), "CENTRE LINE", font=FONT_SMALL, fill=MUTED)


def tag(draw: ImageDraw.ImageDraw, x: float, y: float, text: str, colour: str = INK) -> None:
    box = draw.textbbox((0, 0), text, font=FONT_SMALL)
    draw.rounded_rectangle((x - 6, y - 4, x + box[2] - box[0] + 6, y + box[3] - box[1] + 8), 8, fill=WHITE, outline=colour, width=2)
    draw.text((x, y), text, font=FONT_SMALL, fill=colour)


def eight_second_pass(frame: int) -> Image.Image:
    image, draw = base("BACKCOURT COUNT", frame)
    t = frame / (FRAMES - 1)
    centre_label(draw)
    clock(draw, f"{min(8, 1 + int(t / 0.8 * 7.99))}")
    player(draw, 170, 215, "A3", PRIMARY)
    player(draw, 430, 165, "A6", PRIMARY, "up")
    player(draw, 250, 240, "B3", DEFENCE, "wide")
    if t < 0.6:
        ball(draw, 194, 228 - abs(math.sin(t * math.pi * 6)) * 22)
    else:
        bx, by = point((195, 200), (420, 140), (t - 0.6) / 0.4)
        ball(draw, bx, by - 30 * math.sin(math.pi * (t - 0.6) / 0.4))
    arrow(draw, (200, 270), (420, 270))
    return image


def deliberate_kick(frame: int) -> Image.Image:
    image, draw = base("PASSING LANE", frame)
    t = frame / (FRAMES - 1)
    clock(draw, "16")
    player(draw, 370, 140, "A4", PRIMARY)
    player(draw, 545, 255, "A7", PRIMARY, "up")
    player(draw, 455, 190, "B2", DEFENCE)
    kick = 0 if t < 0.25 else min(1.0, (t - 0.25) / 0.15)
    draw.line((462, 205, 462 + 24 * kick, 214 + 14 * kick), fill=DEFENCE, width=8)
    if t < 0.42:
        bx, by = point((392, 150), (482, 226), t / 0.42)
    else:
        bx, by = point((484, 228), (430, 300), (t - 0.42) / 0.58)
    ball(draw, bx, by)
    if 0.4 < t < 0.6:
        draw.ellipse((470, 214, 498, 242), outline="#F3BD5B", width=4)
    return image


def rim_grab_interference(frame: int) -> Image.Image:
    image, draw = base("BALL ON THE RING", frame)
    t = frame / (FRAMES - 1)
    tag(draw, 458, 300, "3PT LINE", MUTED)
    player(draw, 405, 225, "A2", PRIMARY, "up" if t < 0.2 else "down")
    player(draw, 525, 160, "A9", PRIMARY)
    lift = 22 * math.sin(math.pi * min(1.0, max(0.0, (t - 0.5) / 0.5)))
    if t < 0.42:
        bx, by = point((410, 186), (590, 186), t / 0.42)
        ball(draw, bx, by - 55 * math.sin(math.pi * t / 0.42))
    else:
        ball(draw, 588 + 4 * math.sin(t * math.pi * 6), 186)
    player(draw, 560, 245 - lift, "B8", DEFENCE, "up" if t > 0.5 else "down")
    if t > 0.55:
        draw.line((574, 210 - lift, 590, 198), fill=DEFENCE, width=7)
        draw.ellipse((574, 180, 610, 212), outline="#F3BD5B", width=4)
    return image


def closeout_landing(frame: int) -> Image.Image:
    image, draw = base("CLOSE-OUT", frame)
    t = frame / (FRAMES - 1)
    tag(draw, 458, 300, "3PT LINE", MUTED)
    lift = 30 * math.sin(math.pi * min(1.0, t / 0.7))
    player(draw, 405, 220 - lift, "A6", PRIMARY, "up" if t < 0.7 else "down")
    bx6, by6 = point((530, 175), (420, 252), t / 0.55)
    player(draw, bx6, by6, "B6", DEFENCE, "up")
    if t < 0.18:
        ball(draw, 410, 180 - lift)
    elif t < 0.55:
        bx, by = point((412, 170), (586, 188), (t - 0.18) / 0.37)
        ball(draw, bx, by - 50 * math.sin(math.pi * (t - 0.18) / 0.37))
    else:
        ball(draw, *point((586, 188), (540, 120), (t - 0.55) / 0.45))
    arrow(draw, (522, 205), (442, 245), DEFENCE)
    if t > 0.7:
        draw.ellipse((395, 236, 437, 268), outline="#F3BD5B", width=4)
    return image


def wedged_ball(frame: int) -> Image.Image:
    image, draw = base("SHOT AT THE BASKET", frame)
    t = frame / (FRAMES - 1)
    draw.rounded_rectangle((36, 78, 140, 124), 10, fill=INK)
    draw.text((48, 88), "AP", font=FONT_TITLE, fill="#F3BD5B")
    arrow(draw, (82, 101), (126, 101), "#F3BD5B")
    player(draw, 450, 220, "A5", PRIMARY, "up" if t < 0.2 else "down")
    player(draw, 545, 245, "A8", PRIMARY, "up" if t > 0.5 else "down")
    player(draw, 545, 145, "B5", DEFENCE, "up" if t > 0.5 else "down")
    if t < 0.45:
        bx, by = point((455, 185), (598, 178), t / 0.45)
        ball(draw, bx, by - 55 * math.sin(math.pi * t / 0.45))
    else:
        ball(draw, 598, 178)
        if t > 0.55:
            draw.ellipse((582, 162, 614, 194), outline="#F3BD5B", width=4)
    return image


def buzzer_rebound(frame: int) -> Image.Image:
    image, draw = base("SHOT-CLOCK SEQUENCE", frame)
    t = frame / (FRAMES - 1)
    clock(draw, "1.0" if t < 0.4 else "0.0")
    if t >= 0.4:
        draw.text((132, 88), "BUZZER", font=FONT_TITLE, fill=DEFENCE)
    player(draw, 420, 220, "A4", PRIMARY, "up" if t < 0.2 else "down")
    bx2, by2 = point((545, 255), (470, 250), max(0.0, (t - 0.82) / 0.18))
    player(draw, bx2, by2, "B2", DEFENCE, "up" if 0.6 < t < 0.85 else "down")
    if t < 0.15:
        ball(draw, 425, 182)
    elif t < 0.55:
        bx, by = point((425, 182), (597, 178), (t - 0.15) / 0.4)
        ball(draw, bx, by - 50 * math.sin(math.pi * (t - 0.15) / 0.4))
    elif t < 0.75:
        ball(draw, *point((595, 178), (548, 222), (t - 0.55) / 0.2))
    else:
        ball(draw, bx2 + 2, by2 - 36)
    if 0.5 < t < 0.6:
        draw.line((600, 170, 600, 184), fill="#F3BD5B", width=5)
    return image


def straddle_pass_back(frame: int) -> Image.Image:
    image, draw = base("BACKCOURT COUNT", frame)
    t = frame / (FRAMES - 1)
    centre_label(draw)
    clock(draw, f"{min(7, 5 + int(t * 2.99))}")
    draw.ellipse((300, 238, 314, 246), fill=INK)
    draw.ellipse((326, 238, 340, 246), fill=INK)
    player(draw, 320, 210, "A6", PRIMARY, "up" if t < 0.6 else "down")
    player(draw, 180, 190, "A9", PRIMARY)
    player(draw, 390, 200, "B6", DEFENCE, "wide")
    if t < 0.35:
        ball(draw, *point((200, 185), (318, 176), t / 0.35))
    elif t < 0.55:
        ball(draw, 320, 176)
    else:
        ball(draw, *point((318, 180), (200, 185), (t - 0.55) / 0.45))
    arrow(draw, (300, 270), (200, 270))
    return image


def tap_in_three(frame: int) -> Image.Image:
    image, draw = base("THREE-POINT ATTEMPT", frame)
    t = frame / (FRAMES - 1)
    tag(draw, 458, 300, "3PT LINE", MUTED)
    player(draw, 420, 135, "A2", PRIMARY, "up" if t < 0.25 else "down")
    lift = 20 * math.sin(math.pi * min(1.0, max(0.0, (t - 0.2) / 0.45)))
    player(draw, 535, 235 - lift, "A7", PRIMARY, "up")
    player(draw, 585, 262, "B2", DEFENCE)
    if t < 0.4:
        bx, by = point((428, 100), (538, 170), t / 0.4)
        ball(draw, bx, by - 35 * math.sin(math.pi * t / 0.4 * 0.6))
    elif t < 0.8:
        bx, by = point((540, 172), (592, 195), (t - 0.4) / 0.4)
        ball(draw, bx, by - 40 * math.sin(math.pi * (t - 0.4) / 0.4))
    else:
        ball(draw, *point((592, 195), (592, 222), (t - 0.8) / 0.2))
    if 0.36 < t < 0.5:
        draw.ellipse((522, 154, 556, 188), outline="#F3BD5B", width=4)
    return image


def semicircle_drive(frame: int) -> Image.Image:
    image, draw = base("DRIVE TO THE BASKET", frame)
    t = frame / (FRAMES - 1)
    draw.arc((542, 145, 642, 245), 90, 270, fill=DEFENCE, width=3)
    tag(draw, 478, 258, "SEMICIRCLE", DEFENCE)
    player(draw, 545, 205, "B4", DEFENCE)
    player(draw, 560, 105, "A8", PRIMARY, "up")
    lift = 22 * math.sin(math.pi * min(1.0, max(0.0, (t - 0.35) / 0.5)))
    ax, ay = point((360, 215), (508, 207), t / 0.7)
    player(draw, ax, ay - lift, "A3", PRIMARY, "up" if t > 0.35 else "down")
    if t < 0.35:
        ball(draw, ax + 22, ay + 12 - abs(math.sin(t * math.pi * 6)) * 18)
    elif t < 0.5:
        ball(draw, ax, ay - lift - 34)
    else:
        ball(draw, *point((480, 165), (552, 125), (t - 0.5) / 0.3))
    if t > 0.7:
        draw.ellipse((510, 186, 540, 226), outline="#F3BD5B", width=4)
    return image


def free_throw_tip(frame: int) -> Image.Image:
    image, draw = base("LAST FREE THROW", frame)
    t = frame / (FRAMES - 1)
    draw.rounded_rectangle((36, 78, 146, 124), 10, fill=INK)
    draw.text((48, 88), "FT 2/2", font=FONT_TITLE, fill="#F3BD5B")
    player(draw, 478, 204, "A1", PRIMARY, "up" if t < 0.2 else "down")
    player(draw, 540, 105, "B3", DEFENCE)
    player(draw, 540, 303, "B4", DEFENCE)
    lift = 20 * math.sin(math.pi * min(1.0, max(0.0, (t - 0.45) / 0.45)))
    player(draw, 585, 290 - lift - 40 * min(1.0, max(0.0, (t - 0.4) / 0.2)), "A8", PRIMARY, "up" if t > 0.45 else "down")
    if t < 0.38:
        bx, by = point((482, 168), (588, 190), t / 0.38)
        ball(draw, bx, by - 40 * math.sin(math.pi * t / 0.38))
    elif t < 0.6:
        ball(draw, *point((588, 190), (572, 222), (t - 0.38) / 0.22))
    elif t < 0.82:
        ball(draw, *point((572, 222), (592, 192), (t - 0.6) / 0.22))
    else:
        ball(draw, *point((592, 195), (592, 222), (t - 0.82) / 0.18))
    if 0.36 < t < 0.48:
        draw.ellipse((574, 180, 610, 212), outline="#F3BD5B", width=4)
    return image


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def info_box(draw: ImageDraw.ImageDraw, x: float, text: str, width: float = 104) -> None:
    draw.rounded_rectangle((x, 78, x + width, 124), 10, fill=INK)
    box = draw.textbbox((0, 0), text, font=FONT_TITLE)
    draw.text((x + width / 2 - (box[2] - box[0]) / 2, 89), text, font=FONT_TITLE, fill="#F3BD5B")


def ap_box(draw: ImageDraw.ImageDraw, x: float) -> None:
    draw.rounded_rectangle((x, 78, x + 104, 124), 10, fill=INK)
    draw.text((x + 12, 88), "AP", font=FONT_TITLE, fill="#F3BD5B")
    arrow(draw, (x + 46, 101), (x + 90, 101), "#F3BD5B")


def sideline(draw: ImageDraw.ImageDraw) -> None:
    draw.line((115, 308, 575, 308), fill=INK, width=5)
    draw.text((36, 309), "SIDELINE", font=FONT_SMALL, fill=MUTED)


def board_flash(draw: ImageDraw.ImageDraw) -> None:
    draw.line((601, 205, 601, 219), fill="#F3BD5B", width=5)


def fingertip_deflection(frame: int) -> Image.Image:
    image, draw = base("PASSING LANE", frame)
    t = frame / (FRAMES - 1)
    clock(draw, "9")
    player(draw, 360, 150, "A3", PRIMARY)
    player(draw, 450, 195, "B4", DEFENCE, "up")
    ax, ay = point((535, 245), (505, 272), (t - 0.45) / 0.3)
    player(draw, ax, ay, "A8", PRIMARY, "up" if t > 0.6 else "down")
    if t < 0.4:
        ball(draw, *point((382, 158), (468, 162), t / 0.4))
    elif t < 0.75:
        ball(draw, *point((470, 162), (ax, ay - 36), (t - 0.4) / 0.35))
    else:
        ball(draw, ax, ay - 38)
    if 0.36 < t < 0.5:
        draw.ellipse((454, 146, 486, 178), outline="#F3BD5B", width=4)
    return image


def backboard_toss(frame: int) -> Image.Image:
    image, draw = base("AFTER THE DRIBBLE", frame)
    t = frame / (FRAMES - 1)
    player(draw, 470, 190, "B5", DEFENCE, "wide")
    player(draw, 520, 250, "A5", PRIMARY, "up" if 0.3 < t < 0.4 or 0.62 < t < 0.72 else "down")
    if t < 0.22 or t >= 0.72:
        ball(draw, 544, 266 - abs(math.sin(t * math.pi * 9)) * 26)
    elif t < 0.35:
        ball(draw, 520, 214)
        tag(draw, 420, 300, "DRIBBLE ENDED", MUTED)
    elif t < 0.55:
        bx, by = point((520, 214), (598, 212), (t - 0.35) / 0.2)
        ball(draw, bx, by - 30 * math.sin(math.pi * (t - 0.35) / 0.2))
    else:
        ball(draw, *point((598, 212), (520, 214), (t - 0.55) / 0.17))
    if 0.5 < t < 0.62:
        board_flash(draw)
    return image


def double_foul_contact(frame: int) -> Image.Image:
    image, draw = base("ON THE DRIBBLE", frame)
    t = frame / (FRAMES - 1)
    clock(draw, "7")
    ax = lerp(350, 400, t / 0.5)
    player(draw, ax, 205, "A1", PRIMARY)
    player(draw, 462, 200, "B1", DEFENCE, "wide" if t < 0.5 else "down")
    ball(draw, ax - 24, 230 - abs(math.sin(t * math.pi * 8)) * 22)
    if t >= 0.5:
        draw.line((416, 196, 446, 194), fill=PRIMARY, width=7)
        draw.line((446, 214, 416, 216), fill=DEFENCE, width=7)
        draw.ellipse((428, 180, 456, 206), outline="#F3BD5B", width=4)
        draw.ellipse((406, 204, 434, 230), outline="#F3BD5B", width=4)
    return image


def ap_throw_in_count(frame: int) -> Image.Image:
    image, draw = base("THROW-IN", frame)
    t = frame / (FRAMES - 1)
    clock(draw, f"{min(5, 1 + int(t / 0.85 * 4.99))}")
    ap_box(draw, 130)
    sideline(draw)
    sway = 12 * math.sin(t * math.pi * 4)
    player(draw, 260 + sway, 225, "A2", PRIMARY)
    player(draw, 290 + sway, 252, "B2", DEFENCE, "wide")
    player(draw, 420 - sway, 215, "A7", PRIMARY)
    player(draw, 445 - sway, 245, "B7", DEFENCE, "wide")
    player(draw, 330, 326, "A4", PRIMARY)
    ball(draw, 354, 324)
    return image


def airball_recovery(frame: int) -> Image.Image:
    image, draw = base("SHOT AND REBOUND", frame)
    t = frame / (FRAMES - 1)
    ax, ay = point((450, 225), (540, 262), (t - 0.45) / 0.3)
    player(draw, 495, 180, "B10", DEFENCE, "up")
    player(draw, ax, ay, "A10", PRIMARY, "up" if t < 0.15 else "down")
    if t < 0.12:
        ball(draw, 455, 190)
    elif t < 0.55:
        bx, by = point((455, 190), (585, 262), (t - 0.12) / 0.43)
        ball(draw, bx, by - 60 * math.sin(math.pi * (t - 0.12) / 0.43))
    elif t < 0.75:
        ball(draw, *point((585, 262), (ax + 22, ay + 10), (t - 0.55) / 0.2))
    else:
        ball(draw, ax + 22, ay + 12 - abs(math.sin(t * math.pi * 9)) * 22)
    if t > 0.5:
        tag(draw, 500, 300, "NO RIM", MUTED)
    return image


def handed_throw_in(frame: int) -> Image.Image:
    image, draw = base("THROW-IN", frame)
    t = frame / (FRAMES - 1)
    sideline(draw)
    if t < 0.45:
        a6 = point((395, 220), (362, 280), t / 0.4)
    else:
        a6 = point((362, 280), (395, 225), (t - 0.75) / 0.25)
    player(draw, 425, 240, "B6", DEFENCE, "wide")
    player(draw, 330, 326, "A5", PRIMARY)
    player(draw, *a6, "A6", PRIMARY)
    if t < 0.45:
        ball(draw, 354, 322)
    elif t < 0.75:
        ball(draw, 348, 304)
        if t > 0.5:
            draw.ellipse((332, 288, 364, 320), outline="#F3BD5B", width=4)
    else:
        ball(draw, a6[0] + 22, a6[1] + 4)
    return image


def transition_reach(frame: int) -> Image.Image:
    image, draw = base("TRANSITION PLAY", frame)
    t = frame / (FRAMES - 1)
    clock(draw, "10")
    ax, ay = point((210, 200), (470, 200), t)
    bx, by = point((198, 240), (456, 238), t)
    player(draw, 548, 190, "B5", DEFENCE, "wide")
    player(draw, ax, ay, "A3", PRIMARY)
    player(draw, bx, by, "B3", DEFENCE)
    ball(draw, ax + 22, ay + 16 - abs(math.sin(t * math.pi * 8)) * 16)
    if t > 0.6:
        draw.line((bx + 12, by - 12, ax + 12, ay + 14), fill=DEFENCE, width=7)
        draw.ellipse((ax, ay + 2, ax + 26, ay + 28), outline="#F3BD5B", width=4)
    arrow(draw, (210, 286), (480, 286))
    return image


def late_clock_hold(frame: int) -> Image.Image:
    image, draw = base("LATE GAME", frame)
    t = frame / (FRAMES - 1)
    clock(draw, "0:08")
    ax, ay = point((470, 238), (505, 225), t / 0.35)
    lift = 18 * math.sin(math.pi * clamp((t - 0.35) / 0.5))
    bx, by = point((420, 256), (468, 250), t / 0.35)
    player(draw, bx, by, "B", DEFENCE)
    player(draw, ax, ay - lift, "A4", PRIMARY, "up" if t > 0.3 else "down")
    if t > 0.4:
        draw.line((bx + 14, by - 8, ax - 6, ay - lift + 6), fill=DEFENCE, width=7)
        draw.ellipse((ax - 18, ay - lift - 6, ax + 6, ay - lift + 18), outline="#F3BD5B", width=4)
    if t < 0.65:
        ball(draw, ax, ay - lift - 36)
    elif t < 0.85:
        bx2, by2 = point((ax, ay - 36), (588, 190), (t - 0.65) / 0.2)
        ball(draw, bx2, by2 - 30 * math.sin(math.pi * (t - 0.65) / 0.2))
    else:
        ball(draw, *point((588, 190), (548, 136), (t - 0.85) / 0.15))
    return image


def offensive_rebound_14(frame: int) -> Image.Image:
    image, draw = base("OFFENSIVE REBOUND", frame)
    t = frame / (FRAMES - 1)
    clock(draw, "0:18")
    info_box(draw, 130, "SC OFF" if t < 0.66 else "SC 14")
    lift = 18 * math.sin(math.pi * clamp((t - 0.45) / 0.35))
    player(draw, 430, 210, "A2", PRIMARY, "up" if t < 0.15 else "down")
    player(draw, 535, 150, "B9", DEFENCE, "up" if t > 0.45 else "down")
    player(draw, 560, 252 - lift, "A9", PRIMARY, "up" if t > 0.45 else "down")
    if t < 0.12:
        ball(draw, 435, 174)
    elif t < 0.45:
        bx, by = point((435, 174), (588, 192), (t - 0.12) / 0.33)
        ball(draw, bx, by - 55 * math.sin(math.pi * (t - 0.12) / 0.33))
    elif t < 0.65:
        ball(draw, *point((588, 192), (560, 216 - lift), (t - 0.45) / 0.2))
    else:
        ball(draw, 560, 216 - lift)
    if 0.42 < t < 0.54:
        draw.ellipse((574, 180, 610, 212), outline="#F3BD5B", width=4)
    return image


def buzzer_catch_shoot(frame: int) -> Image.Image:
    image, draw = base("END OF PERIOD", frame)
    t = frame / (FRAMES - 1)
    clock(draw, "0.3" if t < 0.25 else "0.1" if t < 0.5 else "0.0")
    if t >= 0.5:
        draw.text((132, 88), "BUZZER", font=FONT_TITLE, fill=DEFENCE)
    sideline(draw)
    lift = 18 * math.sin(math.pi * clamp((t - 0.25) / 0.35))
    player(draw, 380, 326, "A2", PRIMARY)
    player(draw, 515, 205, "B7", DEFENCE, "up")
    player(draw, 470, 232 - lift, "A7", PRIMARY, "up")
    if t < 0.25:
        ball(draw, *point((402, 318), (470, 198), t / 0.25))
    elif t < 0.42:
        ball(draw, 470, 198 - lift)
    elif t < 0.85:
        bx, by = point((470, 190), (592, 195), (t - 0.42) / 0.43)
        ball(draw, bx, by - 55 * math.sin(math.pi * (t - 0.42) / 0.43))
    else:
        ball(draw, *point((592, 195), (592, 222), (t - 0.85) / 0.15))
    return image


def offensive_board_slap(frame: int) -> Image.Image:
    image, draw = base("BALL ON THE RING", frame)
    t = frame / (FRAMES - 1)
    lift = 20 * math.sin(math.pi * clamp((t - 0.45) / 0.4))
    player(draw, 470, 232, "A3", PRIMARY, "up" if t < 0.2 else "down")
    player(draw, 535, 150, "B9", DEFENCE)
    player(draw, 570, 250 - lift, "A9", PRIMARY, "up" if t > 0.45 else "down")
    if t < 0.42:
        bx, by = point((474, 196), (588, 186), t / 0.42)
        ball(draw, bx, by - 55 * math.sin(math.pi * t / 0.42))
    elif t < 0.7:
        ball(draw, 588 + 4 * math.sin(t * math.pi * 6), 186)
    else:
        ball(draw, *point((592, 195), (592, 222), (t - 0.7) / 0.3))
    if t > 0.52:
        draw.line((590, 216 - lift, 599, 213), fill=PRIMARY, width=7)
    if 0.52 < t < 0.7:
        board_flash(draw)
    return image


def expired_held_ball(frame: int) -> Image.Image:
    image, draw = base("SHOT-CLOCK SEQUENCE", frame)
    t = frame / (FRAMES - 1)
    clock(draw, "1" if t < 0.35 else "0")
    if t >= 0.35:
        draw.text((132, 88), "BUZZER", font=FONT_TITLE, fill=DEFENCE)
    ap_box(draw, 230)
    sway = 6 * math.sin(t * math.pi * 4)
    player(draw, 430 + sway, 210, "A6", PRIMARY)
    bx, by = point((525, 245), (482, 222), t / 0.6)
    player(draw, bx, by, "B6", DEFENCE)
    ball(draw, 454 + sway, 214)
    if t >= 0.6:
        draw.line((bx - 14, by - 6, 462 + sway, 214), fill=DEFENCE, width=7)
        draw.ellipse((438 + sway, 198, 470 + sway, 230), outline="#F3BD5B", width=4)
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
    "eight-second-pass.gif": eight_second_pass,
    "deliberate-kick.gif": deliberate_kick,
    "rim-grab-interference.gif": rim_grab_interference,
    "closeout-landing.gif": closeout_landing,
    "wedged-ball.gif": wedged_ball,
    "buzzer-rebound.gif": buzzer_rebound,
    "straddle-pass-back.gif": straddle_pass_back,
    "tap-in-three.gif": tap_in_three,
    "semicircle-drive.gif": semicircle_drive,
    "free-throw-tip.gif": free_throw_tip,
    "fingertip-deflection.gif": fingertip_deflection,
    "backboard-toss.gif": backboard_toss,
    "double-foul-contact.gif": double_foul_contact,
    "ap-throw-in-count.gif": ap_throw_in_count,
    "airball-recovery.gif": airball_recovery,
    "handed-throw-in.gif": handed_throw_in,
    "transition-reach.gif": transition_reach,
    "late-clock-hold.gif": late_clock_hold,
    "offensive-rebound-14.gif": offensive_rebound_14,
    "buzzer-catch-shoot.gif": buzzer_catch_shoot,
    "offensive-board-slap.gif": offensive_board_slap,
    "expired-held-ball.gif": expired_held_ball,
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
    # Optional GIF names limit the run, so unchanged clips are not re-encoded.
    names = sys.argv[1:] or list(SCENES)
    unknown = [name for name in names if name not in SCENES]
    if unknown:
        raise SystemExit(f"unknown scene: {', '.join(unknown)}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name in names:
        save_gif(name, SCENES[name])
        print(f"generated {name}")


if __name__ == "__main__":
    main()
