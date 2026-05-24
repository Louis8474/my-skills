#!/usr/bin/env python3
"""Pack an extracted ODP directory with mimetype first and uncompressed."""

from __future__ import annotations

import argparse
from pathlib import Path

from odp_common import pack_dir_as_odp


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output_odp", type=Path)
    args = parser.parse_args()
    pack_dir_as_odp(args.source_dir, args.output_odp)
    print(args.output_odp)


if __name__ == "__main__":
    main()
