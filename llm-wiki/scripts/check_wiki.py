#!/usr/bin/env python3
"""
Naive LLM Wiki health check.

This is intentionally simple and dependency-free.
It checks basic Markdown vault hygiene:
- required files;
- broken wikilinks outside fenced code blocks;
- content pages missing frontmatter;
- orphan content pages.

It also surfaces non-failing human review warnings for synthesis pages.
"""

from pathlib import Path
import re
import sys

def slug_to_candidates(link: str):
    clean = link.split("|")[0].strip()
    if clean.endswith(".md"):
        return [clean]
    return [clean + ".md", clean.replace(" ", "-").lower() + ".md"]

def strip_fenced_code_blocks(text: str) -> str:
    stripped = []
    in_fence = False
    fence_marker = ""

    for line in text.splitlines():
        marker = line.lstrip()[:3]
        if marker in {"```", "~~~"}:
            if not in_fence:
                in_fence = True
                fence_marker = marker
            elif marker == fence_marker:
                in_fence = False
                fence_marker = ""
            stripped.append("")
            continue

        stripped.append("" if in_fence else line)

    return "\n".join(stripped)

def parse_frontmatter(text: str):
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, {}

    end = None
    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end = index
            break

    if end is None:
        return {}, {}

    data = {}
    list_items = {}
    current_key = None

    for line in lines[1:end]:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        if not line.startswith((" ", "\t")) and ":" in line:
            key, value = line.split(":", 1)
            current_key = key.strip()
            data[current_key] = value.strip()
            continue

        if current_key and stripped.startswith("- "):
            list_items.setdefault(current_key, []).append(stripped[2:].strip())

    return data, list_items

def clean_scalar(value: str) -> str:
    return value.strip().strip('"').strip("'")

def is_missing_or_empty_list(data, list_items, key: str) -> bool:
    if key not in data:
        return True

    if list_items.get(key):
        return False

    value = clean_scalar(data[key])
    if value in {"", "[]"}:
        return True
    if value.startswith("[") and value.endswith("]"):
        return not value[1:-1].strip()
    return False

def int_frontmatter_value(data, key: str) -> int:
    try:
        return int(clean_scalar(data.get(key, "0")))
    except ValueError:
        return 0

def has_heading(text: str, heading: str) -> bool:
    pattern = rf"^##\s+{re.escape(heading)}\s*$"
    return re.search(pattern, text, flags=re.MULTILINE) is not None

def extract_section(text: str, heading: str) -> str:
    lines = text.splitlines()
    start = None

    for index, line in enumerate(lines):
        if re.match(rf"^##\s+{re.escape(heading)}\s*$", line):
            start = index + 1
            break

    if start is None:
        return ""

    end = len(lines)
    for index in range(start, len(lines)):
        if re.match(r"^##\s+", lines[index]):
            end = index
            break

    return "\n".join(lines[start:end])

def split_table_row(line: str):
    stripped = line.strip()
    if not stripped.startswith("|") or not stripped.endswith("|"):
        return []
    return [cell.strip() for cell in stripped.strip("|").split("|")]

def is_separator_row(cells) -> bool:
    if not cells:
        return False
    return all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in cells)

def normalize_header(value: str) -> str:
    return clean_scalar(value).lower().replace(" ", "_")

def parse_claim_rows(text: str):
    section = extract_section(text, "Claims")
    if not section:
        return []

    table_lines = [line for line in section.splitlines() if line.strip().startswith("|")]
    if len(table_lines) < 2:
        return []

    headers = [normalize_header(cell) for cell in split_table_row(table_lines[0])]
    separator = split_table_row(table_lines[1])
    if not headers or not is_separator_row(separator):
        return []

    rows = []
    for line in table_lines[2:]:
        cells = split_table_row(line)
        if len(cells) != len(headers):
            continue
        rows.append(dict(zip(headers, cells)))

    return rows

def is_empty_or_placeholder(value: str) -> bool:
    normalized = clean_scalar(value).lower()
    return normalized in {"", "[]", "todo", "todo.", "placeholder", "n/a", "none"}

def collect_synthesis_review_warnings(path: Path, text: str):
    data, list_items = parse_frontmatter(text)
    if clean_scalar(data.get("type", "")) != "synthesis":
        return []

    warnings = []
    prefix = f"{path}: "

    if "review_status" not in data:
        warnings.append(prefix + "review_status is missing")
    elif clean_scalar(data["review_status"]) == "needs_review":
        warnings.append(prefix + "review_status is needs_review")

    if "confidence" not in data:
        warnings.append(prefix + "confidence is missing")

    if is_missing_or_empty_list(data, list_items, "source_refs"):
        warnings.append(prefix + "source_refs is missing or empty")

    unsupported_claims = int_frontmatter_value(data, "unsupported_claims")
    if unsupported_claims > 0:
        warnings.append(prefix + f"unsupported_claims is {unsupported_claims}")

    low_confidence_claims = int_frontmatter_value(data, "low_confidence_claims")
    if low_confidence_claims > 0:
        warnings.append(prefix + f"low_confidence_claims is {low_confidence_claims}")

    if "claim_count" not in data:
        warnings.append(prefix + "claim_count is missing")

    claim_rows = parse_claim_rows(text)
    if not has_heading(text, "Claims"):
        warnings.append(prefix + "missing ## Claims section")
    elif "claim_count" in data:
        claim_count = int_frontmatter_value(data, "claim_count")
        if claim_count != len(claim_rows):
            warnings.append(
                prefix + f"claim_count is {claim_count}, but {len(claim_rows)} claim rows were found"
            )

    unsupported_rows = 0
    low_confidence_rows = 0

    for index, row in enumerate(claim_rows, start=1):
        claim_id = clean_scalar(row.get("id", ""))
        row_label = claim_id or f"row {index}"

        claim = clean_scalar(row.get("claim", ""))
        source_refs = clean_scalar(row.get("source_refs", ""))
        support_status = clean_scalar(row.get("support_status", "")).lower()
        confidence = clean_scalar(row.get("confidence", "")).lower()
        review_status = clean_scalar(row.get("review_status", "")).lower()

        if not claim_id:
            warnings.append(prefix + f"claim {row_label} is missing ID")
        if is_empty_or_placeholder(claim):
            warnings.append(prefix + f"claim {row_label} is missing Claim")
        if "source_refs" not in row:
            warnings.append(prefix + f"claim {row_label} is missing Source refs")
        elif is_empty_or_placeholder(source_refs):
            warnings.append(prefix + f"claim {row_label} has empty/TODO/placeholder Source refs")

        if not support_status:
            warnings.append(prefix + f"claim {row_label} is missing Support status")
        elif support_status in {"unsupported", "contradicted", "unclear"}:
            warnings.append(prefix + f"claim {row_label} support status is {support_status}")

        if support_status == "unsupported":
            unsupported_rows += 1

        if not confidence:
            warnings.append(prefix + f"claim {row_label} is missing Confidence")
        elif confidence == "low":
            warnings.append(prefix + f"claim {row_label} confidence is low")
            low_confidence_rows += 1

        if not review_status:
            warnings.append(prefix + f"claim {row_label} is missing Review status")
        elif review_status in {"needs_review", "revisit"}:
            warnings.append(prefix + f"claim {row_label} review status is {review_status}")

    if unsupported_claims != unsupported_rows:
        warnings.append(
            prefix + f"unsupported_claims is {unsupported_claims}, but {unsupported_rows} unsupported claim rows were found"
        )

    if low_confidence_claims != low_confidence_rows:
        warnings.append(
            prefix + f"low_confidence_claims is {low_confidence_claims}, but {low_confidence_rows} low-confidence claim rows were found"
        )

    if not has_heading(text, "Evidence base"):
        warnings.append(prefix + "missing ## Evidence base section")

    if not has_heading(text, "Limitations"):
        warnings.append(prefix + "missing ## Limitations section")

    return warnings

def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    wiki = root / "wiki"
    required = [wiki / "WIKI.md", wiki / "AGENTS.md", wiki / "index.md", wiki / "log.md"]
    special_pages = {"WIKI.md", "AGENTS.md", "index.md", "log.md"}
    problems = []
    review_warnings = []

    for path in required:
        if not path.exists():
            problems.append(f"MISSING required file: {path}")

    pages = list(wiki.rglob("*.md")) if wiki.exists() else []
    page_names = {p.name for p in pages}
    page_rel = {str(p.relative_to(wiki)) for p in pages}

    inbound = {p: 0 for p in pages}
    link_re = re.compile(r"\[\[([^\]]+)\]\]")

    for p in pages:
        text = p.read_text(encoding="utf-8", errors="ignore")
        rel = str(p.relative_to(wiki))
        is_special_page = rel in special_pages
        if not is_special_page and not text.startswith("---"):
            problems.append(f"NO FRONTMATTER: {p}")
        review_warnings.extend(collect_synthesis_review_warnings(p, text))
        link_text = strip_fenced_code_blocks(text)
        for m in link_re.finditer(link_text):
            link = m.group(1)
            candidates = slug_to_candidates(link)
            exists = any(c in page_names or c in page_rel for c in candidates)
            if not exists:
                problems.append(f"BROKEN LINK in {p}: [[{link}]]")
            else:
                for target in pages:
                    if target.name in candidates or str(target.relative_to(wiki)) in candidates:
                        inbound[target] += 1

    for p, count in inbound.items():
        rel = str(p.relative_to(wiki))
        if rel not in special_pages and count == 0:
            problems.append(f"POSSIBLE ORPHAN: {p}")

    if problems:
        print("LLM Wiki structural check: issues found")
        for problem in problems:
            print("-", problem)

    if review_warnings:
        print("LLM Wiki review warnings:")
        for warning in review_warnings:
            print("-", warning)

    if problems:
        return 1

    if review_warnings:
        print("LLM Wiki health check: OK (review warnings present)")
    else:
        print("LLM Wiki health check: OK")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
