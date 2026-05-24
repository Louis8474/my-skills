"""yt-llm-translate entry point.

Usage:
    python entry.py <youtube_url>

Pipeline: download.ps1 -> [transcribe.py fallback] -> srt-punctuator -> resegment.py -> batch_translate.py

All output files (MP4, SRT) go to the user's current working directory.
"""

import sys
import json
import time
import subprocess
import threading
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
CONFIG_PATH = SCRIPTS_DIR / "config.json"
RUN_OPENCODE = SCRIPTS_DIR / "run_opencode.py"


def load_config():
    if not CONFIG_PATH.exists():
        return {}
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"[WARN] Failed to parse config.json: {e}", file=sys.stderr)
        return {}


def _stream_subprocess(cmd, cwd=None, label="", timeout=None):
    """Run a command with real-time stdout/stderr streaming. Returns exit code."""
    if label:
        print(f"[RUN] {label}")

    workdir = str(cwd) if cwd else None
    t_start = time.time()

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=workdir,
        bufsize=1,
    )

    def _reader(stream, dest):
        try:
            for line in iter(stream.readline, ""):
                dest.write(line)
                dest.flush()
        except (ValueError, OSError):
            pass
        finally:
            stream.close()

    t_out = threading.Thread(target=_reader, args=(proc.stdout, sys.stdout), daemon=True)
    t_err = threading.Thread(target=_reader, args=(proc.stderr, sys.stderr), daemon=True)
    t_out.start()
    t_err.start()

    try:
        returncode = proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()
        print(f"\n[TIMEOUT] Command timed out after {timeout}s")
        returncode = -1

    t_out.join(timeout=3)
    t_err.join(timeout=3)

    elapsed = time.time() - t_start
    if label:
        status = "OK" if returncode == 0 else f"FAIL ({returncode})"
        print(f"[{status}] {label} ({elapsed:.1f}s)")

    return returncode


def needs_punctuation(srt_path: Path) -> bool:
    config = load_config()
    punct_cfg = config.get("punctuation_check", {})
    expected_per_lines = punct_cfg.get("expected_per_lines", 1.0 / 3)
    threshold_factor = punct_cfg.get("threshold_factor", 0.4)

    with open(srt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    blocks = content.strip().split('\n\n')
    text_lines = []

    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) < 3:
            continue
        for line in lines[2:]:
            stripped = line.strip()
            if stripped:
                text_lines.append(stripped)

    if not text_lines:
        return False

    punct_count = sum(line.count(c) for line in text_lines for c in ('.', '?', '!'))
    expected = len(text_lines) * expected_per_lines
    threshold = expected * threshold_factor

    return punct_count < threshold


def invoke_srt_punctuator(srt_path: Path, cwd: Path) -> bool:
    prompt = f"使用skill: srt-punctuator, 为这个SRT字幕文件添加英文标点符号 {srt_path}"
    log_file = cwd / "srt_punctuator.log"

    cmd = [
        sys.executable, str(RUN_OPENCODE),
        "--prompt", prompt,
        "--expected-file", str(srt_path),
        "--workdir", str(cwd),
        "--log-file", str(log_file),
        "--timeout", "600",
    ]

    rc = _stream_subprocess(cmd, cwd=cwd, label=f"srt-punctuator {srt_path.name}", timeout=600)
    return rc == 0


def invoke_batch_translate(srt_path: Path, cwd: Path) -> bool:
    batch_script = SCRIPTS_DIR / "batch_translate.py"
    cmd = [
        sys.executable, str(batch_script), str(srt_path),
    ]

    rc = _stream_subprocess(cmd, cwd=cwd, label=f"batch_translate {srt_path.name}")
    return rc == 0


def invoke_resegment(srt_path: Path, cwd: Path) -> bool:
    resegment_script = SCRIPTS_DIR / "resegment.py"
    cmd = [sys.executable, str(resegment_script), str(srt_path)]

    rc = _stream_subprocess(cmd, cwd=cwd, label=f"resegment {srt_path.name}")
    return rc == 0


def main():
    if len(sys.argv) < 2:
        print("Usage: python entry.py <youtube_url>")
        sys.exit(1)

    url = sys.argv[1]
    if 'youtube.com/watch?v=' in url and '&' in url:
        url = url.split('&')[0]
    user_cwd = Path.cwd()
    sys.stdout.reconfigure(errors='replace')
    sys.stderr.reconfigure(errors='replace')

    config = load_config()
    before_srt = set(user_cwd.glob("*.srt"))
    before_mp4 = set(user_cwd.glob("*.mp4"))

    # 1. download
    download_script = SCRIPTS_DIR / "download.ps1"
    if not download_script.exists():
        print(f"[FAIL] download.ps1 not found in {SCRIPTS_DIR}")
        sys.exit(1)

    t0 = time.time()
    rc = _stream_subprocess(
        ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File", str(download_script), url],
        cwd=user_cwd,
        label=f"download.ps1 {url}"
    )
    if rc != 0:
        sys.exit(rc)
    t1 = time.time()

    # find English SRT
    new_srt = sorted(set(user_cwd.glob("*.srt")) - before_srt)
    eng_srt = [p for p in new_srt if p.match("*.en.srt")]
    if not eng_srt:
        print("[INFO] No English SRT found after download, attempting Whisper transcription...")
        new_mp4 = sorted(set(user_cwd.glob("*.mp4")) - before_mp4)
        if not new_mp4:
            print("[INFO] No new MP4 found after download, nothing to transcribe")
            print("[DONE] All steps completed.")
            return
        mp4_path = new_mp4[0]

        whisper_timeout = config.get("whisper", {}).get("timeout", 1200)
        transcribe_script = SCRIPTS_DIR / "transcribe.py"
        rc = _stream_subprocess(
            [sys.executable, str(transcribe_script), str(mp4_path)],
            cwd=user_cwd,
            label=f"whisper transcribe {mp4_path.name}",
            timeout=whisper_timeout
        )
        if rc != 0:
            print("[ERROR] Whisper transcription failed")
            sys.exit(rc)

        after_eng_srt = sorted(set(user_cwd.glob("*.en.srt")) - before_srt)
        if not after_eng_srt:
            print("[ERROR] Whisper completed but no .en.srt was produced")
            sys.exit(1)
        eng_srt = after_eng_srt

    srt_path = eng_srt[0]

    # 2. punctuate
    t2 = time.time()
    if needs_punctuation(srt_path):
        if not invoke_srt_punctuator(srt_path, user_cwd):
            print("[ERROR] srt-punctuator failed, aborting")
            sys.exit(1)
    else:
        print("[INFO] English SRT already has sufficient punctuation, skipping srt-punctuator")
    t3 = time.time()

    # 3. resegment
    t4 = time.time()
    if not invoke_resegment(srt_path, user_cwd):
        print("[ERROR] resegment failed")
    t5 = time.time()

    # 4. translate
    t6 = time.time()
    if not invoke_batch_translate(srt_path, user_cwd):
        print("[ERROR] batch translate failed")
    t7 = time.time()

    # 5. finalize: rename subtitles and cleanup temp files
    finalize_script = SCRIPTS_DIR / "finalize-subtitles.ps1"
    workspace_dir = user_cwd / f"{srt_path.stem}_workspace"
    t9 = t7
    if not finalize_script.exists():
        print(f"[FAIL] finalize-subtitles.ps1 not found in {SCRIPTS_DIR}")
    else:
        t8 = time.time()
        rc = _stream_subprocess(
            ["powershell.exe", "-ExecutionPolicy", "Bypass", "-File", str(finalize_script),
             "-InputFile", str(srt_path),
             "-WorkspaceDir", str(workspace_dir)],
            cwd=user_cwd,
            label=f"finalize-subtitles {srt_path.name}"
        )
        t9 = time.time()
        if rc != 0:
            print(f"[WARN] finalize-subtitles.ps1 exited with code {rc} (non-fatal)")

    print(f"[TIME] total: {t9 - t0:.1f}s")
    print("[DONE] All steps completed.")


if __name__ == "__main__":
    main()
