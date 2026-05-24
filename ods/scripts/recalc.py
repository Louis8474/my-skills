#!/usr/bin/env python3
"""Recalculate an ODS with LibreOffice and validate formula/error references."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from ods_common import find_soffice


def run(command: list[str]) -> None:
    result = subprocess.run(command, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if result.returncode != 0:
        print(result.stdout, file=sys.stderr)
        raise SystemExit(result.returncode)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ods", type=Path)
    parser.add_argument("--outdir", type=Path, default=Path("qa"))
    args = parser.parse_args()
    args.outdir.mkdir(parents=True, exist_ok=True)
    target = args.outdir / args.ods.name
    shutil.copyfile(args.ods, target)
    soffice = find_soffice()
    profile = tempfile.mkdtemp(prefix="odf-soffice-")
    try:
        run(
            [
                soffice,
                f"-env:UserInstallation=file://{profile}",
                "--headless",
                "--convert-to",
                "ods",
                "--outdir",
                str(args.outdir),
                str(target),
            ]
        )
    finally:
        shutil.rmtree(profile, ignore_errors=True)
    print(target)
    validate = Path(__file__).with_name("validate_refs.py")
    run([sys.executable, str(validate), str(target)])


if __name__ == "__main__":
    main()
