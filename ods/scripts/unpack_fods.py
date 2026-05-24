#!/usr/bin/env python3
"""Convert a flat .fods to a zipped .ods package."""

from __future__ import annotations

import argparse
from pathlib import Path

from ods_common import unpack_flat_odf


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_fods", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    args = parser.parse_args()
    unpack_flat_odf(args.input_fods, args.output)
    print(args.output)


if __name__ == "__main__":
    main()
