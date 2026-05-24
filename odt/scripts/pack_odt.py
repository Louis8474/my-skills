#!/usr/bin/env python3
"""Pack an extracted ODT directory with mimetype first and uncompressed."""

from __future__ import annotations

import argparse
from pathlib import Path

from odt_common import pack_dir_as_odt


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output_odt", type=Path)
    args = parser.parse_args()
    pack_dir_as_odt(args.source_dir, args.output_odt)
    print(args.output_odt)


if __name__ == "__main__":
    main()
