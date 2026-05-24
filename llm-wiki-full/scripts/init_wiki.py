#!/usr/bin/env python3
"""
Deterministic LLM Wiki initializer for OpenClaw.

The helper is intentionally dependency-free and non-destructive: it creates
missing vault directories and files, but never overwrites existing files.
"""

from pathlib import Path
import argparse
import os
import sys


REQUIRED_DIRS = [
    Path("raw/inbox"),
    Path("raw/processed"),
    Path("raw/assets"),
    Path("wiki/sources"),
    Path("wiki/entities"),
    Path("wiki/concepts"),
    Path("wiki/syntheses"),
    Path("wiki/questions"),
]

REQUIRED_FILES = [
    Path("wiki/WIKI.md"),
    Path("wiki/AGENTS.md"),
    Path("wiki/index.md"),
    Path("wiki/log.md"),
]

FALLBACK_TEMPLATES = {
    "WIKI.md": "# WIKI.md - LLM Wiki Operating Schema\n\n",
    "AGENTS.md": "# AGENTS.md - LLM Wiki Agent Guidance\n\n",
    "index.md": "# Wiki Index\n\n",
    "log.md": "# Wiki Log\n\n",
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Initialize a non-destructive plain Markdown LLM Wiki vault."
    )
    parser.add_argument("target", nargs="?", help="Optional target workspace path.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview missing directories and files without writing them.",
    )
    return parser.parse_args()


def resolve_target(target_arg):
    if target_arg:
        return Path(target_arg).expanduser().resolve()

    env_target = os.environ.get("OPENCLAW_WORKSPACE")
    if env_target:
        return Path(env_target).expanduser().resolve()

    default_openclaw_workspace = Path("/home/node/.openclaw/workspace")
    if default_openclaw_workspace.exists():
        return default_openclaw_workspace.resolve()

    return Path.cwd().resolve()


def skill_root():
    return Path(__file__).resolve().parents[1]


def template_text(filename):
    template_path = skill_root() / "templates" / filename
    if template_path.exists():
        return template_path.read_text(encoding="utf-8")
    return FALLBACK_TEMPLATES[filename]


def format_items(items):
    if not items:
        return "  (none)"
    return "\n".join(f"  - {item}" for item in items)


def initialize(target, dry_run):
    created = []
    skipped = []

    for relative_dir in REQUIRED_DIRS:
        path = target / relative_dir
        if path.exists():
            skipped.append(f"{relative_dir}/")
            continue

        created.append(f"{relative_dir}/")
        if not dry_run:
            path.mkdir(parents=True, exist_ok=True)

    for relative_file in REQUIRED_FILES:
        path = target / relative_file
        if path.exists():
            skipped.append(str(relative_file))
            continue

        created.append(str(relative_file))
        if not dry_run:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(template_text(path.name), encoding="utf-8")

    return created, skipped


def print_summary(target, created, skipped, dry_run):
    print("Backend: plain Markdown fallback")
    print(f"Target: {target}")
    print("Created:")
    print(format_items(created))
    print("Skipped:")
    print(format_items(skipped))
    print(f"Dry run: {'yes' if dry_run else 'no'}")


def main():
    args = parse_args()
    target = resolve_target(args.target)

    try:
        created, skipped = initialize(target, args.dry_run)
        print_summary(target, created, skipped, args.dry_run)
        return 0
    except OSError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
