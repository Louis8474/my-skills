#!/usr/bin/env python3
"""Convert a zipped .odp to a flat .fodp (single XML, Git-friendly)."""

from __future__ import annotations

import argparse
from pathlib import Path

from odp_common import pack_flat_odf


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odp", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    args = parser.parse_args()
    pack_flat_odf(args.input_odp, args.output)
    print(args.output)


if __name__ == "__main__":
    main()
