import colorsys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source" / "forest-background-original.png"
OUT_NO_GRASS = ROOT / "assets" / "sprites" / "forest_background_no_grass.png"
GRASS_OUT = ROOT / "assets" / "sprites" / "grass_layer.png"
GRASS_TOP = 780


def is_checker_background(pixel: tuple[int, int, int]) -> bool:
    r, g, b = pixel
    max_c = max(pixel)
    min_c = min(pixel)
    saturation = max_c - min_c
    return saturation < 18 and min_c > 216


def is_light_background_artifact(pixel: tuple[int, int, int]) -> bool:
    r, g, b = pixel
    max_c = max(pixel)
    min_c = min(pixel)
    saturation = max_c - min_c
    return saturation < 36 and min_c > 190


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


def is_grass(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a < 20:
        return False
    if is_light_background_artifact((r, g, b)):
        return False

    # In the bottom band the useful non-grass detail is mostly the warm brown
    # tree trunks. Everything else visible there belongs to the grass layer,
    # including dark pencil strokes between the green and yellow blades.
    hue, saturation, value = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    hue *= 360
    is_trunk = 15 <= hue <= 46 and saturation > 0.16 and value > 0.25
    return not is_trunk


def grass_mask(image: Image.Image, top: int = GRASS_TOP) -> Image.Image:
    width, height = image.size
    pixels = image.load()
    mask = Image.new("L", (width, height), 0)
    mask_pixels = mask.load()

    for y in range(max(0, top), height):
        for x in range(width):
            if is_grass(pixels[x, y]):
                mask_pixels[x, y] = pixels[x, y][3]

    mask = mask.filter(ImageFilter.GaussianBlur(0.2))
    mask_pixels = mask.load()
    for y in range(max(0, top), height):
        for x in range(width):
            if is_light_background_artifact(pixels[x, y][:3]):
                mask_pixels[x, y] = 0

    return mask


def apply_alpha_mask(image: Image.Image, mask: Image.Image) -> Image.Image:
    layer = image.copy()
    layer.putalpha(mask)
    return layer


def remove_alpha_mask(image: Image.Image, mask: Image.Image) -> Image.Image:
    result = image.copy()
    alpha = result.getchannel("A")
    result.putalpha(ImageChops.subtract(alpha, mask))
    return result


def main() -> None:
    image = ImageOps.exif_transpose(Image.open(SOURCE)).convert("RGBA")
    background = checker_background_mask(image)
    alpha = ImageOps.invert(background)
    alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.35))
    image.putalpha(alpha)

    sprite = trim_vertical(image)

    grass = grass_mask(sprite)
    apply_alpha_mask(sprite, grass).save(GRASS_OUT)
    remove_alpha_mask(sprite, grass).save(OUT_NO_GRASS)
    print(f"{OUT_NO_GRASS.name}: {sprite.size[0]}x{sprite.size[1]}")


if __name__ == "__main__":
    main()
