#!/usr/bin/env python3
"""
Extract text from a PDF for long chapters (> 20 pages).
Requires: pip install pymupdf

Usage:
  python extract_pdf_pages.py book.pdf --pages 45-72 --output chapter-03.txt
  python extract_pdf_pages.py book.pdf --output full-book.txt
"""

import argparse
import sys


def parse_page_range(range_str: str, total_pages: int) -> tuple[int, int]:
    """Convert '45-72' to (44, 71) — 0-based indices."""
    parts = range_str.split("-")
    if len(parts) != 2:
        print(f"Error: invalid range format '{range_str}'. Use 'start-end' (e.g. 45-72).")
        sys.exit(1)
    start = int(parts[0]) - 1  # PDF pages are 0-indexed
    end = int(parts[1]) - 1
    if start < 0 or end >= total_pages or start > end:
        print(f"Error: range {range_str} is out of bounds for the PDF ({total_pages} pages).")
        sys.exit(1)
    return start, end


def extract_text(pdf_path: str, page_start: int = None, page_end: int = None) -> str:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("Error: PyMuPDF is not installed. Run: pip install pymupdf")
        sys.exit(1)

    doc = fitz.open(pdf_path)
    total = doc.page_count
    start = page_start if page_start is not None else 0
    end = page_end if page_end is not None else total - 1

    print(f"Extracting pages {start + 1}–{end + 1} of {total} ({pdf_path})")

    texts = []
    for i in range(start, end + 1):
        page = doc[i]
        text = page.get_text()
        if text.strip():
            texts.append(f"--- Page {i + 1} ---\n{text}")

    doc.close()
    return "\n\n".join(texts)


def main():
    parser = argparse.ArgumentParser(description="Extract text from specific pages of a PDF.")
    parser.add_argument("pdf", help="Path to the PDF file")
    parser.add_argument("--pages", help="Page range (e.g. 45-72). If omitted, extracts everything.")
    parser.add_argument("--output", required=True, help="Output .txt file")
    args = parser.parse_args()

    try:
        import fitz
        doc = fitz.open(args.pdf)
        total = doc.page_count
        doc.close()
    except ImportError:
        print("Error: PyMuPDF is not installed. Run: pip install pymupdf")
        sys.exit(1)
    except Exception as e:
        print(f"Error opening the PDF: {e}")
        sys.exit(1)

    start, end = None, None
    if args.pages:
        start, end = parse_page_range(args.pages, total)

    text = extract_text(args.pdf, start, end)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(text)

    page_label = f"pages {(start or 0) + 1}–{(end if end is not None else total - 1) + 1}"
    print(f"Extracted text ({page_label}) saved to: {args.output}")
    print(f"Size: {len(text):,} characters")


if __name__ == "__main__":
    main()
