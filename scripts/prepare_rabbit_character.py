from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source" / "rabbit-character-original.png"
OUT = ROOT / "assets" / "sprites" / "rabbit_character.png"


def is_background(pixel: tuple[int, int, int]) -> bool:
    r, g, b = pixel
    max_c = max(pixel)
    min_c = min(pixel)
    saturation = max_c - min_c

    # The uploaded file has a baked-in transparent checkerboard: nearly white or
    # light neutral gray. Keep colored pencil and dark outline pixels.
    return saturation < 18 and min_c > 218


def edge_background_mask(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        idx = y * width + x
        if visited[idx] or not is_background(pixels[x, y]):
            return
        visited[idx] = 1
        queue.append((x, y))

    for x in range(width):
        push(x, 0)
        push(x, height - 1)
    for y in range(height):
        push(0, y)
        push(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height:
                push(nx, ny)

    return Image.frombytes("L", (width, height), bytes(visited)).point(lambda v: 255 if v else 0)


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


def main() -> None:
    image = ImageOps.exif_transpose(Image.open(SOURCE)).convert("RGBA")
    background = edge_background_mask(image)
    alpha = ImageOps.invert(background)
    alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.35))

    image.putalpha(alpha)
    sprite = trim(image).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    sprite.save(OUT)
    print(f"{OUT.name}: {sprite.size[0]}x{sprite.size[1]}")


if __name__ == "__main__":
    main()
