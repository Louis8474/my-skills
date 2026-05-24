#!/usr/bin/env python3
"""
Batch translate subtitle text via opencode. Accepts .txt or .srt input.
For .srt: extracts text, splits into ~100-line chunks, translates each using
chunk-translator skill, then combines back into a bilingual SRT.
For .txt: splits and translates, outputs a matching _chinese.txt file.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from datetime import datetime

CHUNK_SIZE = 100
MAX_LOOKAHEAD = 30
MIN_SIZE = 30
MAX_SIZE = 100
SCRIPT_DIR = Path(__file__).resolve().parent
RUN_OPENCODE = SCRIPT_DIR / "run_opencode.py"
EXTRACT_SCRIPT = SCRIPT_DIR / "extract-subtitle-text.ps1"
COMBINE_SCRIPT = SCRIPT_DIR / "combine-subtitles.ps1"

SENTENCE_END_RE = re.compile(r'[.?!]$')


def load_config() -> dict:
    config_path = SCRIPT_DIR / "config.json"
    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def process_chunk(idx, chunk_name, expected_file, cmd, output_dir):
    start_time = time.time()
    try:
        proc = subprocess.run(cmd, cwd=str(output_dir), capture_output=True)
        elapsed = time.time() - start_time
        if proc.returncode == 0 and expected_file.exists():
            return (idx, chunk_name, "success", elapsed, expected_file)
        else:
            return (idx, chunk_name, "failed", elapsed, expected_file)
    except FileNotFoundError:
        return (idx, chunk_name, "error", 0, expected_file)
    except Exception:
        return (idx, chunk_name, "error", time.time() - start_time, expected_file)


def setup_logging(log_dir: Path) -> logging.Logger:
    logger = logging.getLogger("batch_translate")
    logger.setLevel(logging.DEBUG)

    log_path = log_dir / "batch_translate.log"
    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(fh)

    ch = logging.StreamHandler(sys.stderr)
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(ch)

    return logger


def split_into_chunks(lines: list[str], chunk_size: int, sentence_boundary: bool = True,
                      max_lookahead: int = MAX_LOOKAHEAD) -> list[list[str]]:
    chunks = []
    i = 0
    total = len(lines)

    while i < total:
        target = i + chunk_size
        if target >= total:
            chunks.append((i, total, lines[i:]))
            break

        if not sentence_boundary:
            chunks.append((i, target, lines[i:target]))
            i = target
            continue

        boundary = target
        search_end = min(target + max_lookahead, total)
        for j in range(target, search_end):
            stripped = lines[j].rstrip("\n\r")
            if stripped and SENTENCE_END_RE.search(stripped):
                boundary = j + 1
                break

        chunks.append((i, boundary, lines[i:boundary]))
        i = boundary

    return chunks


def run_powershell(script: Path, params: list[str], workdir: Path,
                   logger: logging.Logger, timeout: int = 120) -> bool:
    cmd = ["powershell", "-ExecutionPolicy", "Bypass", "-File", str(script)] + params
    logger.info("Running: %s", " ".join(cmd))
    try:
        proc = subprocess.run(
            cmd, cwd=str(workdir),
            capture_output=True, encoding='utf-8',
            timeout=timeout,
        )
        if proc.stdout and proc.stdout.strip():
            logger.info("%s", proc.stdout.strip())
        if proc.stderr and proc.stderr.strip():
            logger.warning("%s", proc.stderr.strip())
        if proc.returncode != 0:
            logger.error("PowerShell exit code: %d", proc.returncode)
            return False
        return True
    except subprocess.TimeoutExpired:
        logger.error("PowerShell script timed out after %ds", timeout)
        return False
    except FileNotFoundError:
        logger.error("PowerShell not found on PATH")
        return False
    except Exception as e:
        logger.error("PowerShell error: %s", e)
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Split subtitle text into chunks, translate via opencode chunk-translator skill, aggregate results"
    )
    parser.add_argument("input_file", help="Path to input .srt or English .txt file")
    parser.add_argument("--no-sentence-boundary", action="store_true",
                        help="Disable sentence-boundary detection; use exact chunk_size splits")
    parser.add_argument("--max-lookahead", type=int, default=MAX_LOOKAHEAD,
                        help="Max lines to look ahead for sentence boundary (default: 30)")
    parser.add_argument("--output-dir", default="chunks", help="Directory for chunk files (default: chunks/)")
    parser.add_argument("--timeout", type=int, default=600, help="Timeout per chunk in seconds (default: 600)")
    parser.add_argument("--log-filter", choices=["none", "quiet", "minimal"], default="minimal",
                        help="Log filter level for opencode output (default: minimal)")
    parser.add_argument("--no-extract", action="store_true",
                        help="Skip SRT text extraction, treat input as raw TXT")
    parser.add_argument("--no-combine", action="store_true",
                        help="Skip final bilingual SRT combination")

    args = parser.parse_args()

    config = load_config()
    tl_config = config.get("translation", {})

    thread_num = tl_config.get("thread_num", 4)
    chunk_size = str(tl_config.get("chunk_size", CHUNK_SIZE))
    if chunk_size != "auto":
        try:
            chunk_size = int(chunk_size)
        except ValueError:
            print(f"ERROR: Invalid chunk-size in config: {chunk_size}", file=sys.stderr)
            sys.exit(1)
    min_size = tl_config.get("min_size", MIN_SIZE)
    max_size = tl_config.get("max_size", MAX_SIZE)
    input_path = Path(args.input_file).resolve()
    if not input_path.exists():
        print(f"ERROR: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    is_srt = input_path.suffix.lower() == '.srt'
    original_srt_path = input_path if is_srt else None

    workspace_stem = original_srt_path.stem if (is_srt and not args.no_extract) else input_path.stem
    workspace_dir = input_path.parent / f"{workspace_stem}_workspace"
    workspace_dir.mkdir(parents=True, exist_ok=True)

    if args.output_dir == "chunks":
        output_dir = workspace_dir / "chunks"
    else:
        output_dir = Path(args.output_dir)
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    logger = setup_logging(output_dir)

    if is_srt and not args.no_extract:
        extract_script = EXTRACT_SCRIPT.resolve()
        logger.info("Extracting text from SRT: %s", input_path.name)
        if not run_powershell(extract_script, ["-InputFile", str(input_path)],
                              input_path.parent, logger):
            logger.error("SRT text extraction failed")
            sys.exit(1)
        extracted_txt = input_path.parent / f"{input_path.stem}_original.txt"
        if not extracted_txt.exists():
            logger.error("Extracted text file not found: %s", extracted_txt)
            sys.exit(1)
        moved_txt = workspace_dir / f"{original_srt_path.stem}_original.txt"
        shutil.move(str(extracted_txt), str(moved_txt))
        input_path = moved_txt
        logger.info("Using extracted text: %s", input_path.name)

    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    total_lines = len(lines)
    logger.info("Input file: %s (%d lines)", input_path.name, total_lines)

    actual_chunk_size = chunk_size
    if chunk_size == "auto":
        auto_size = total_lines // thread_num
        actual_chunk_size = max(min_size, min(auto_size, max_size))
        logger.info("Auto chunk: total_lines=%d, thread_num=%d, auto=%d, clamped=[%d, %d] -> %d",
                    total_lines, thread_num, auto_size, min_size, max_size, actual_chunk_size)

    chunks = split_into_chunks(
        lines, actual_chunk_size,
        sentence_boundary=not args.no_sentence_boundary,
        max_lookahead=args.max_lookahead,
    )
    chunk_count = len(chunks)
    boundary_mode = "sentence-boundary" if not args.no_sentence_boundary else "fixed"
    logger.info("Split into %d chunks (chunk_size=%d, mode=%s)", chunk_count, actual_chunk_size, boundary_mode)

    results = []
    tasks = []

    for idx, (line_start, line_end, chunk_lines) in enumerate(chunks, 1):
        chunk_name = f"chunk_{idx:03d}"
        chunk_file = output_dir / f"{chunk_name}.txt"
        expected_file = output_dir / f"{chunk_name}_chinese.txt"
        log_file = output_dir / f"{chunk_name}_opencode.log"

        logger.info("Writing %s (lines %d-%d, %d lines)", chunk_file.name, line_start + 1, line_end, len(chunk_lines))
        with open(chunk_file, "w", encoding="utf-8") as f:
            f.writelines(chunk_lines)

        prompt = f"使用skill: chunk-translator, 翻译文件 {chunk_file}"

        cmd = [
            sys.executable, RUN_OPENCODE,
            "--prompt", prompt,
            "--expected-file", str(expected_file),
            "--workdir", str(output_dir),
            "--log-file", str(log_file),
            "--timeout", str(args.timeout),
            "--log-filter", args.log_filter,
        ]

        tasks.append((idx, chunk_name, expected_file, cmd))

    logger.info("Starting parallel translation with %d threads", thread_num)

    executor = ThreadPoolExecutor(max_workers=thread_num)
    try:
        futures_map = {}
        for idx, chunk_name, expected_file, cmd in tasks:
            future = executor.submit(process_chunk, idx, chunk_name, expected_file, cmd, output_dir)
            futures_map[future] = (idx, chunk_name)
            logger.info("  Submitted [%d/%d] %s", idx, chunk_count, chunk_name)

        completed = 0
        for future in as_completed(futures_map):
            idx, chunk_name = futures_map[future]
            try:
                result = future.result()
                results.append(result)
                completed += 1
                pct = completed * 100 // chunk_count
                status, elapsed = result[2], result[3]
                if status == "success":
                    print(f"[PROGRESS] {completed}/{chunk_count} ({pct}%) {chunk_name} OK ({elapsed:.1f}s)")
                    logger.info("  [OK] [%d/%d] %s completed in %.1fs", idx, chunk_count, chunk_name, elapsed)
                else:
                    print(f"[PROGRESS] {completed}/{chunk_count} ({pct}%) {chunk_name} FAIL ({elapsed:.1f}s)")
                    logger.error("  [FAIL] [%d/%d] %s (%.1fs)", idx, chunk_count, chunk_name, elapsed)
            except Exception as e:
                completed += 1
                pct = completed * 100 // chunk_count
                print(f"[PROGRESS] {completed}/{chunk_count} ({pct}%) {chunk_name} ERROR")
                logger.error("  [ERROR] [%d/%d] %s: %s", idx, chunk_count, chunk_name, e)
                results.append((idx, chunk_name, "error", 0, output_dir / f"{chunk_name}_chinese.txt"))

    except KeyboardInterrupt:
        logger.warning("Interrupted by user, shutting down...")
        executor.shutdown(wait=False, cancel_futures=True)
        sys.exit(5)
    finally:
        executor.shutdown(wait=False)

    results.sort(key=lambda r: r[0])

    logger.info("=" * 60)
    logger.info("Summary:")
    all_success = True
    for idx, name, status, elapsed, _ in results:
        logger.info("  Chunk %d | %-20s | %-8s | %6.1fs", idx, name, status, elapsed)
        if status != "success":
            all_success = False

    if not all_success:
        logger.error("Some chunks failed. See logs in %s for details.", output_dir)
        sys.exit(1)

    base_name = input_path.stem
    final_output = workspace_dir / f"{base_name}_chinese.txt"
    with open(final_output, "w", encoding="utf-8") as outf:
        for idx, _, _, _, chunk_output_path in results:
            with open(chunk_output_path, "r", encoding="utf-8") as inf:
                outf.write(inf.read().rstrip("\n"))
                outf.write("\n")

    logger.info("Aggregated output: %s (%d bytes)", final_output.name, final_output.stat().st_size)
    logger.info("Done.")

    if original_srt_path and not args.no_combine:
        combine_script = COMBINE_SCRIPT.resolve()
        chinese_txt = workspace_dir / f"{input_path.stem}_chinese.txt"
        original_txt = workspace_dir / f"{original_srt_path.stem}_original.txt"
        logger.info("Combining back to bilingual SRT...")
        if not run_powershell(combine_script, [
            "-InputFile", str(original_srt_path),
            "-OriginalText", str(original_txt),
            "-ChineseText", str(chinese_txt),
        ], original_srt_path.parent, logger):
            logger.error("SRT combination failed")
            sys.exit(1)


if __name__ == "__main__":
    main()
