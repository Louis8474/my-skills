#!/usr/bin/env python3
"""Extract visible text labels from an ODG file."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from odg_common import NS, element_text, iter_pages, page_name, parse_xml_from_zip


def extract(path: Path) -> list[dict[str, Any]]:
    root = parse_xml_from_zip(path, "content.xml")
    result = []
    for index, page in enumerate(iter_pages(root), start=1):
        labels = []
        for paragraph in page.findall(".//text:p", NS):
            value = element_text(paragraph)
            if value:
                labels.append(value)
        result.append({"page": index, "name": page_name(page), "text": labels})
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odg", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    data = extract(args.odg)
    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return
    for page in data:
        print(f"## {page['page']}. {page['name']}")
        for label in page["text"]:
            print(label)


if __name__ == "__main__":
    main()
