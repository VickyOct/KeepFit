"""Extract the official referee signal figures shown in the real-quiz answers.

Each crop keeps the FIBA title, PlayPic figure, figure number and English motion
caption exactly as printed in Appendix A of the Official Basketball Rules 2026.
The PNGs are checked in so the quiz works offline; rerun this script against a
newer rulebook if FIBA republishes the signals.

Usage: python scripts/extract-referee-signals.py path/to/fiba-official-basketball-rules-2026-v1-1.pdf
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

import fitz
from PIL import Image, ImageChops


OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "referee" / "signals"
ZOOM = 4  # 288 dpi: sharp on 3x phone screens at the card width used in the app.
PADDING = 14

# name: (PDF page, clip rectangle in PDF points covering title, figure and caption)
SIGNALS = {
    "stop-clock": (63, (70, 258, 190, 448)),         # 1  Stop the clock
    "stop-clock-foul": (63, (188, 248, 304, 448)),   # 2  Stop the clock for foul
    "cancel-score": (64, (70, 311, 301, 512)),       # 11 Cancel score, cancel play
    "visible-count": (64, (304, 311, 536, 500)),     # 12 Visible count
    "direction-of-play": (64, (305, 515, 427, 756)), # 15 Direction of play and/or out-of-bounds
    "travelling": (65, (70, 108, 189, 297)),         # 17 Travelling
    "five-seconds": (65, (188, 325, 304, 514)),      # 21 5 seconds
    "shot-clock": (65, (424, 325, 540, 514)),        # 23 Shot clock
    "backcourt": (65, (70, 551, 302, 741)),          # 24 Ball returned to backcourt
    "number-11-15": (66, (305, 305, 423, 533)),      # Player No. 11 - 15
    "disruptive-foul": (69, (305, 92, 423, 306)),    # 54 Disruptive foul
    "two-free-throws": (70, (352, 108, 448, 346)),   # Reporting to table: 2 free throws
}


def trim(image: Image.Image) -> Image.Image:
    """Crop to the printed content so every card has the same white margin."""
    background = Image.new("RGB", image.size, "white")
    mask = ImageChops.difference(image, background).convert("L").point(lambda value: 255 if value > 12 else 0)
    left, top, right, bottom = mask.getbbox()
    content = image.crop((left, top, right, bottom))
    framed = Image.new("RGB", (content.width + PADDING * 2, content.height + PADDING * 2), "white")
    framed.paste(content, (PADDING, PADDING))
    return framed


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    doc = fitz.open(sys.argv[1])
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, (page_number, clip) in SIGNALS.items():
        pixmap = doc[page_number - 1].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), clip=fitz.Rect(*clip), alpha=False)
        image = trim(Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGB"))
        # The figures are flat illustrations, so a 96-colour palette keeps them crisp at a fraction of the size.
        image.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(OUTPUT / f"{name}.png", optimize=True)
        print(f"{name}.png {image.width}x{image.height}")


if __name__ == "__main__":
    main()
