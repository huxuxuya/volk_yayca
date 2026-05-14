from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source" / "daughter-drawing.png"
OUT = ROOT / "assets" / "sprites"

SPRITES = {
    "rabbit.png": (245, 1070, 745, 1495),
    "hill_big.png": (675, 470, 1170, 1135),
    "button_up.png": (45, 1240, 245, 1585),
    "button_forward.png": (235, 1240, 440, 1585),
    "background_shape.png": (495, 20, 1160, 590),
}


def extract_pencil_lines(crop: Image.Image) -> Image.Image:
    crop = ImageOps.exif_transpose(crop).convert("RGB")
    gray = ImageOps.grayscale(crop)

    # Estimate the uneven paper tone locally, then keep only darker pencil strokes.
    paper = gray.filter(ImageFilter.GaussianBlur(19))
    dark_strokes = ImageChops.subtract(paper, gray)
    alpha = dark_strokes.point(lambda value: max(0, min(255, int((value - 5) * 13))))
    alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.45))

    ink = Image.new("RGBA", crop.size, (50, 47, 42, 255))
    ink.putalpha(alpha)
    return ink


def trim_transparent(image: Image.Image, padding: int = 12) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return image

    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE)
    extracted = {}

    for name, box in SPRITES.items():
        crop = source.crop(box)
        sprite = trim_transparent(extract_pencil_lines(crop))
        sprite.save(OUT / name)
        extracted[name] = sprite
        print(f"{name}: {sprite.size[0]}x{sprite.size[1]}")

    small_hill = extracted["hill_big.png"].resize((300, 403), Image.Resampling.LANCZOS)
    small_hill.save(OUT / "hill_small.png")
    print(f"hill_small.png: {small_hill.size[0]}x{small_hill.size[1]}")


if __name__ == "__main__":
    main()
