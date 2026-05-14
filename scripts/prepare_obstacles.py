from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "source"
OUT_DIR = ROOT / "assets" / "sprites"

OBSTACLES = {
    "obstacle_hill.png": SOURCE_DIR / "obstacle-hill-original.png",
    "obstacle_anthill.png": SOURCE_DIR / "obstacle-anthill-original.png",
}


def is_checker_background(pixel: tuple[int, int, int]) -> bool:
    max_c = max(pixel)
    min_c = min(pixel)
    saturation = max_c - min_c
    return saturation < 18 and min_c > 216


def remove_checker_background(image: Image.Image) -> Image.Image:
    rgba = ImageOps.exif_transpose(image).convert("RGBA")
    rgb = rgba.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    alpha = Image.new("L", (width, height), 255)
    alpha_pixels = alpha.load()

    for y in range(height):
        for x in range(width):
            if is_checker_background(pixels[x, y]):
                alpha_pixels[x, y] = 0

    alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.35))
    rgba.putalpha(alpha)
    return trim(rgba)


def trim(image: Image.Image, padding: int = 18) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return image

    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def make_preview(files: list[str]) -> None:
    thumbs = []
    for filename in files:
        image = Image.open(OUT_DIR / filename).convert("RGBA")
        image.thumbnail((300, 220))
        tile = Image.new("RGBA", (340, 270), (244, 237, 220, 255))
        tile.alpha_composite(image, ((tile.width - image.width) // 2, 18))
        ImageDraw.Draw(tile).text((12, 242), filename, fill=(40, 40, 40))
        thumbs.append(tile.convert("RGB"))

    sheet = Image.new("RGB", (340 * len(thumbs), 270), (244, 237, 220))
    for index, thumb in enumerate(thumbs):
        sheet.paste(thumb, (index * 340, 0))
    sheet.save(OUT_DIR / "obstacles_preview.jpg", quality=92)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    written = []

    for filename, source in OBSTACLES.items():
        sprite = remove_checker_background(Image.open(source))
        sprite.save(OUT_DIR / filename)
        written.append(filename)
        print(f"{filename}: {sprite.size[0]}x{sprite.size[1]}")

    make_preview(written)


if __name__ == "__main__":
    main()
