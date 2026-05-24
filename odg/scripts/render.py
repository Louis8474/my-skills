#!/usr/bin/env python3
"""Render/export an ODG file to PDF, SVG, and/or PNG with LibreOffice."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from odg_common import find_soffice


def run(command: list[str]) -> None:
    result = subprocess.run(command, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if result.returncode != 0:
        print(result.stdout, file=sys.stderr)
        raise SystemExit(result.returncode)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odg", type=Path)
    parser.add_argument("--outdir", type=Path, default=Path("qa"))
    parser.add_argument("--formats", default="pdf", help="comma-separated formats: pdf,svg,png")
    parser.add_argument("--png", action="store_true", help="shortcut to include png")
    args = parser.parse_args()
    args.outdir.mkdir(parents=True, exist_ok=True)
    formats = [fmt.strip() for fmt in args.formats.split(",") if fmt.strip()]
    if args.png and "png" not in formats:
        formats.append("png")
    soffice = find_soffice()
    for fmt in formats:
        profile = tempfile.mkdtemp(prefix="odf-soffice-")
        try:
            run(
                [
                    soffice,
                    f"-env:UserInstallation=file://{profile}",
                    "--headless",
                    "--convert-to",
                    fmt,
                    "--outdir",
                    str(args.outdir),
                    str(args.odg),
                ]
            )
        finally:
            shutil.rmtree(profile, ignore_errors=True)
        print(args.outdir / f"{args.odg.stem}.{fmt}")


if __name__ == "__main__":
    main()
