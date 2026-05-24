#!/usr/bin/env python3
"""Convert a zipped .ods to a flat .fods (single XML, Git-friendly)."""

from __future__ import annotations

import argparse
from pathlib import Path

from ods_common import pack_flat_odf


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_ods", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    args = parser.parse_args()
    pack_flat_odf(args.input_ods, args.output)
    print(args.output)


if __name__ == "__main__":
    main()
