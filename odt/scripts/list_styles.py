#!/usr/bin/env python3
"""List ODT styles from styles.xml and content.xml automatic styles."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

from odt_common import NS, parse_xml_from_zip, q


def collect(path: Path) -> dict[str, list[dict[str, str | None]]]:
    result: dict[str, list[dict[str, str | None]]] = defaultdict(list)
    for member in ("styles.xml", "content.xml"):
        root = parse_xml_from_zip(path, member)
        for style in root.findall(".//style:style", NS):
            family = style.attrib.get(q("style", "family"), "unknown")
            result[family].append(
                {
                    "name": style.attrib.get(q("style", "name")),
                    "display_name": style.attrib.get(q("style", "display-name")),
                    "parent": style.attrib.get(q("style", "parent-style-name")),
                    "source": member,
                }
            )
        for master in root.findall(".//style:master-page", NS):
            result["master-page"].append(
                {
                    "name": master.attrib.get(q("style", "name")),
                    "display_name": master.attrib.get(q("style", "display-name")),
                    "parent": master.attrib.get(q("style", "page-layout-name")),
                    "source": member,
                }
            )
    return dict(result)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odt", type=Path)
    args = parser.parse_args()
    print(json.dumps(collect(args.odt), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
