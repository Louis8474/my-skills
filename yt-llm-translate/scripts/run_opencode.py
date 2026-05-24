#!/usr/bin/env python3
"""Run opencode with a prompt, wait for completion, then verify file generation."""

import argparse
import json
import re
import subprocess
import sys
import time
import logging
from pathlib import Path
from datetime import datetime

SCRIPTS_DIR = Path(__file__).resolve().parent


def _load_config() -> dict:
    config_path = SCRIPTS_DIR / "config.json"
    if not config_path.exists():
        return {}
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def build_command(prompt: str, workdir: str | None, oc_path: str, model: str | None) -> list[str]:
    oc_path = str(Path(oc_path).expanduser())

    opencode_args = ["run", prompt, "--print-logs", "--dangerously-skip-permissions"]
    if model:
        opencode_args.extend(["--model", model])
    if workdir:
        opencode_args.extend(["--dir", str(Path(workdir).resolve())])

    if oc_path.endswith(".ps1"):
        return ["powershell", "-ExecutionPolicy", "Bypass", "-File", oc_path] + opencode_args
    else:
        return [oc_path] + opencode_args


def setup_logging(log_path: Path) -> logging.Logger:
    logger = logging.getLogger("run_opencode")
    logger.setLevel(logging.DEBUG)

    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    ch = logging.StreamHandler(sys.stderr)
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    return logger


FILTER_PATTERNS_MINIMAL = re.compile(
    r"service=(?:bus\s+type=(?:message\.part\.(?:delta|updated)|file\.(?:watcher\.updated|edited)|session\.(?:status|diff))"
    r"|permission\s+permission=.*(?:evaluate|evaluated)"
    r"|tool\.registry\s+status)"
)

_UNESCAPE_RE = re.compile(r"\\([^\w\s.:/\\-])")


def unescape_path(path_str: str) -> str:
    return _UNESCAPE_RE.sub(r"\1", path_str)


def build_filter(level: str):
    if level == "none":
        return lambda _line: True

    patterns = [FILTER_PATTERNS_MINIMAL]
    if level == "quiet":
        patterns.append(re.compile(
            r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\s*\+\d+ms\s+INFO"
        ))

    def should_write(line: str) -> bool:
        for p in patterns:
            if p.search(line):
                return False
        return True

    return should_write


def main():
    parser = argparse.ArgumentParser(
        description="Run opencode with a prompt and verify file generation"
    )
    parser.add_argument("--prompt", required=True, help="Prompt message to send to opencode")
    parser.add_argument("--expected-file", required=True, help="File path to check after completion")
    parser.add_argument("--workdir", default=None, help="Working directory")
    parser.add_argument("--log-file", default="opencode_run.log", help="Log file path")
    parser.add_argument("--timeout", type=int, default=600, help="Timeout in seconds (0 = no limit)")
    parser.add_argument("--log-filter", choices=["none", "quiet", "minimal"], default="minimal",
                        help="Log filter level for console and log file")

    args = parser.parse_args()

    config = _load_config()
    oc_path = config.get("opencode_path")
    if not oc_path:
        print("ERROR: opencode path not configured. Set opencode_path in config.json", file=sys.stderr)
        sys.exit(4)
    oc_path = Path(oc_path).expanduser()
    if not oc_path.exists():
        print(f"ERROR: opencode not found at: {oc_path}", file=sys.stderr)
        sys.exit(4)

    model = config.get("model")

    log_path = Path(args.log_file)
    logger = setup_logging(log_path)

    cmd = build_command(args.prompt, args.workdir, str(oc_path), model)
    logger.info("opencode path: %s", oc_path)
    logger.info("Command: %s", " ".join(cmd))
    logger.info("Expected file: %s", args.expected_file)
    logger.info("Working directory: %s", args.workdir or Path.cwd())
    logger.info("Log filter level: %s", args.log_filter)

    log_filter_fn = build_filter(args.log_filter)
    workdir = str(Path(args.workdir).resolve()) if args.workdir else None

    with open(log_path, "a", encoding="utf-8") as log_f:
        log_f.write(f"\n{'='*60}\n")
        log_f.write(f"Run started at {datetime.now().isoformat()}\n")
        log_f.write(f"opencode path: {oc_path}\n")
        log_f.write(f"Command: {' '.join(cmd)}\n")
        log_f.write(f"{'='*60}\n\n")

    start_time = time.time()

    try:
        timeout = args.timeout if args.timeout > 0 else None
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            cwd=workdir,
            bufsize=1,
        )

        with open(log_path, "a", encoding="utf-8") as log_f:
            for line in process.stdout:
                if log_filter_fn(line):
                    try:
                        sys.stdout.write(line)
                    except UnicodeEncodeError:
                        sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
                    sys.stdout.flush()
                    log_f.write(line)
                    log_f.flush()

        returncode = process.wait(timeout=timeout)
        elapsed = time.time() - start_time

        logger.info("opencode exited with code %d after %.1f seconds", returncode, elapsed)

        expected = Path(args.expected_file).resolve()
        if not expected.exists():
            unescaped = Path(unescape_path(args.expected_file)).resolve()
            if unescaped != expected:
                logger.info("Exact path not found, trying unescaped: %s", unescaped)
                expected = unescaped

        if expected.exists():
            file_size = expected.stat().st_size
            logger.info("SUCCESS: File found at %s (%d bytes)", expected, file_size)
            sys.exit(0)
        else:
            logger.error("FAILURE: Expected file not found: %s", expected)
            sys.exit(1)

    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()
        elapsed = time.time() - start_time
        logger.error("TIMEOUT: opencode did not complete within %d seconds (elapsed: %.1f)", args.timeout, elapsed)
        sys.exit(3)

    except FileNotFoundError:
        logger.error("ERROR: powershell not found. Ensure PowerShell is installed and in PATH.")
        sys.exit(4)

    except KeyboardInterrupt:
        logger.warning("Interrupted by user")
        process.terminate()
        process.wait()
        sys.exit(5)

    except Exception as e:
        logger.error("Unexpected error: %s", e)
        sys.exit(6)


if __name__ == "__main__":
    main()
