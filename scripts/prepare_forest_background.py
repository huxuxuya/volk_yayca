from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source" / "forest-background-original.png"
OUT = ROOT / "assets" / "sprites" / "forest_background.png"
PREVIEW = ROOT / "assets" / "sprites" / "forest_background_preview.jpg"


def is_checker_background(pixel: tuple[int, int, int]) -> bool:
    r, g, b = pixel
    max_c = max(pixel)
    min_c = min(pixel)
    saturation = max_c - min_c
    return saturation < 18 and min_c > 216


def checker_background_mask(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    mask = Image.new("L", (width, height), 0)
    mask_pixels = mask.load()

    for y in range(height):
        for x in range(width):
            if is_checker_background(pixels[x, y]):
                mask_pixels[x, y] = 255

    return mask


def trim_vertical(image: Image.Image, padding: int = 10) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return image

    _, top, _, bottom = bbox
    top = max(0, top - padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((0, top, image.width, bottom))


def main() -> None:
    image = ImageOps.exif_transpose(Image.open(SOURCE)).convert("RGBA")
    background = checker_background_mask(image)
    alpha = ImageOps.invert(background)
    alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.35))
    image.putalpha(alpha)

    sprite = trim_vertical(image)
    sprite.save(OUT)

    preview = Image.new("RGBA", sprite.size, (244, 237, 220, 255))
    preview.alpha_composite(sprite)
    preview.convert("RGB").save(PREVIEW, quality=92)
    print(f"{OUT.name}: {sprite.size[0]}x{sprite.size[1]}")


if __name__ == "__main__":
    main()
