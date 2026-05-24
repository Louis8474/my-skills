#!/usr/bin/env python3
"""Convert a flat .fodt to a zipped .odt package."""

from __future__ import annotations

import argparse
from pathlib import Path

from odt_common import unpack_flat_odf


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_fodt", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    args = parser.parse_args()
    unpack_flat_odf(args.input_fodt, args.output)
    print(args.output)


if __name__ == "__main__":
    main()
