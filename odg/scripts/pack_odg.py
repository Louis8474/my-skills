#!/usr/bin/env python3
"""Pack an extracted ODG directory with mimetype first and uncompressed."""

from __future__ import annotations

import argparse
from pathlib import Path

from odg_common import pack_dir_as_odg


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output_odg", type=Path)
    args = parser.parse_args()
    pack_dir_as_odg(args.source_dir, args.output_odg)
    print(args.output_odg)


if __name__ == "__main__":
    main()
