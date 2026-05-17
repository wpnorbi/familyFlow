from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_path")
    parser.add_argument("output_path")
    parser.add_argument("--max-pixel-size", type=int, default=0)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = Path(args.input_path)
    output_path = Path(args.output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(input_path) as image:
        converted = image.convert("RGB")

        if args.max_pixel_size and max(converted.size) > args.max_pixel_size:
            converted.thumbnail((args.max_pixel_size, args.max_pixel_size), Image.Resampling.LANCZOS)

        converted.save(output_path, format="WEBP", quality=80, method=6)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
