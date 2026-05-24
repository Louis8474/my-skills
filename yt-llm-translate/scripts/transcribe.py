#!/usr/bin/env python3
"""Transcribe a video file using OpenAI Whisper and output <stem>.en.srt."""

import argparse
import json
import shutil
import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
CONFIG_PATH = SCRIPT_DIR / "config.json"


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"[WARN] Failed to parse config.json: {e}", file=sys.stderr)
        return {}


def _format_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    parser = argparse.ArgumentParser(description="Transcribe video to SRT via Whisper")
    parser.add_argument("video_path", help="Path to the video file (MP4 etc.)")
    parser.add_argument("--model", help="Whisper model size (tiny/base/small/medium/large)")
    parser.add_argument("--language", help="Language code (e.g. en, zh)")
    args = parser.parse_args()

    video = Path(args.video_path).resolve()
    if not video.exists():
        print(f"[ERROR] Video not found: {video}")
        sys.exit(1)

    config = load_config()
    whisper_cfg = config.get("whisper", {})
    model_name = args.model or whisper_cfg.get("model", "small")
    language = args.language or whisper_cfg.get("language", "en")

    try:
        import whisper
    except ImportError:
        print("[ERROR] openai-whisper is not installed.", file=sys.stderr)
        print("Run: pip install openai-whisper", file=sys.stderr)
        sys.exit(1)

    # copy to temp safe name to avoid special characters (?, !, etc.) that break ffmpeg
    safe_name = f"_tmp_transcribe_{int(time.time())}.mp4"
    safe_path = video.parent / safe_name
    original_stem = video.stem

    try:
        print(f"[INFO] Copying to temp file to avoid filename issues: {safe_path}")
        shutil.copy2(video, safe_path)

        print(f"[INFO] Loading Whisper model '{model_name}'...")
        t0 = time.time()
        model = whisper.load_model(model_name)
        print(f"[INFO] Model loaded in {time.time() - t0:.1f}s")
        print(f"[INFO] Transcribing (language={language})...")

        result = model.transcribe(str(safe_path), language=language)

        # write .srt
        srt_path = video.parent / f"{original_stem}.srt"
        with open(srt_path, 'w', encoding='utf-8') as f:
            for i, seg in enumerate(result["segments"], 1):
                start = _format_ts(seg["start"])
                end = _format_ts(seg["end"])
                text = seg["text"].strip()
                f.write(f"{i}\n{start} --> {end}\n{text}\n\n")
        print(f"[INFO] SRT written: {srt_path}")

        # rename to .en.srt
        en_srt_path = srt_path.with_suffix(".en.srt")
        if srt_path.exists():
            srt_path.replace(en_srt_path)
            print(f"[INFO] Renamed to: {en_srt_path}")

        duration = time.time() - t0
        seg_count = len(result["segments"])
        print(f"[INFO] Transcription complete: {seg_count} segments in {duration:.1f}s")

    finally:
        if safe_path.exists():
            safe_path.unlink()
            print(f"[INFO] Cleaned up temp file: {safe_path}")


if __name__ == "__main__":
    main()
