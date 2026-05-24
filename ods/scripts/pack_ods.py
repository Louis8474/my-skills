#!/usr/bin/env python3
"""Pack an extracted ODS directory with mimetype first and uncompressed."""

from __future__ import annotations

import argparse
from pathlib import Path

from ods_common import pack_dir_as_ods


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("output_ods", type=Path)
    args = parser.parse_args()
    pack_dir_as_ods(args.source_dir, args.output_ods)
    print(args.output_ods)


if __name__ == "__main__":
    main()
