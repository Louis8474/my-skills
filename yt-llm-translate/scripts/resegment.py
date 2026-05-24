#!/usr/bin/env python3
"""Resegment SRT subtitles by punctuation marks (comma, period, etc.)
and split long lines into independent subtitle entries with interpolated timestamps.

Usage:
    python resegment_srt.py sample.srt [output.srt] [--max-len 62]
"""

import os
import re
import sys

MAX_LINE_LEN = 62
SPLIT_PUNCT = re.compile(r'[,\.!?;](?=\s|$)')


def parse_srt(filepath):
    entries = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    blocks = content.strip().split('\n\n')
    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) < 3:
            continue
        time_line = lines[1]
        match = re.match(
            r'(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})',
            time_line
        )
        if not match:
            continue
        start_ms = _to_ms(match.group(1), match.group(2), match.group(3), match.group(4))
        end_ms = _to_ms(match.group(5), match.group(6), match.group(7), match.group(8))
        text = '\n'.join(lines[2:])
        text = re.sub(r'\[music\]', '', text, flags=re.IGNORECASE).strip()
        entries.append((start_ms, end_ms, text))

    return entries


def _to_ms(h, m, s, ms):
    return int(h) * 3600000 + int(m) * 60000 + int(s) * 1000 + int(ms)


def _to_time(ms):
    h = ms // 3600000
    ms %= 3600000
    m = ms // 60000
    ms %= 60000
    s = ms // 1000
    ms = ms % 1000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def build_full_text(entries):
    texts = [t for _, _, t in entries]
    full_text = ' '.join(texts)

    char_to_ms = [0] * (len(full_text) + 1)

    pos = 0
    for i, (start_ms, end_ms, text) in enumerate(entries):
        text_len = len(text)
        duration = end_ms - start_ms
        if text_len > 0:
            for j in range(text_len):
                t = start_ms + int((j / text_len) * duration)
                char_to_ms[pos + j] = t
            char_to_ms[pos + text_len] = end_ms
        else:
            char_to_ms[pos] = end_ms

        pos += text_len

        if i < len(entries) - 1:
            char_to_ms[pos] = end_ms
            pos += 1

    return full_text, char_to_ms


def segment_by_punctuation(full_text):
    segments = []
    search_start = 0

    for m in SPLIT_PUNCT.finditer(full_text):
        punct_pos = m.start()
        end = punct_pos + 1

        raw = full_text[search_start:end]

        content_start = search_start
        while content_start < end and full_text[content_start] == ' ':
            content_start += 1

        clean_text = full_text[content_start:end]

        if clean_text:
            segments.append((clean_text, content_start, end))

        search_start = end

    if search_start < len(full_text):
        content_start = search_start
        while content_start < len(full_text) and full_text[content_start] == ' ':
            content_start += 1
        clean_text = full_text[content_start:]
        if clean_text:
            segments.append((clean_text, content_start, len(full_text)))

    return segments


def split_long_segments(segments, max_len=MAX_LINE_LEN):
    result = []
    for text, content_start, content_end in segments:
        result.extend(_split_one(text, content_start, content_end, max_len))
    return result


def _split_one(text, content_start, content_end, max_len):
    if len(text) <= max_len:
        return [(text, content_start, content_end)]

    mid = len(text) // 2
    spaces = [i for i, c in enumerate(text) if c == ' ']

    if not spaces:
        cut = max_len
        left = text[:cut]
        right = text[cut:]
        return (
            _split_one(left, content_start, content_start + cut, max_len) +
            _split_one(right, content_start + cut, content_end, max_len)
        )

    best_space = None
    best_score = float('inf')
    for space_pos in spaces:
        left_len = space_pos
        right_len = len(text) - space_pos - 1
        if left_len <= max_len and right_len <= max_len:
            score = abs(left_len - right_len)
            if score < best_score:
                best_score = score
                best_space = space_pos

    if best_space is None:
        best_space = min(spaces, key=lambda s: abs(s - mid))

    left_text = text[:best_space]
    right_text = text[best_space + 1:]

    left_end = content_start + best_space
    right_start = content_start + best_space + 1

    return (
        _split_one(left_text, content_start, left_end, max_len) +
        _split_one(right_text, right_start, content_end, max_len)
    )


SENTENCE_END = re.compile(r'[.!?]$')


def merge_short_segments(segments, max_len=MAX_LINE_LEN):
    """Merge consecutive segments if combined length ≤ max_len.
    Segments ending with .!? won't merge forward, keeping sentence boundaries."""
    if not segments:
        return []

    result = []
    current_text = segments[0][0]
    current_start = segments[0][1]
    current_end = segments[0][2]

    for text, content_start, content_end in segments[1:]:
        combined = current_text + ' ' + text
        if len(combined) <= max_len and not SENTENCE_END.search(current_text):
            current_text = combined
            current_end = content_end
        else:
            result.append((current_text, current_start, current_end))
            current_text = text
            current_start = content_start
            current_end = content_end

    result.append((current_text, current_start, current_end))
    return result


def assign_timestamps(segments, char_to_ms):
    result = []
    for text, content_start, content_end in segments:
        start_ms = char_to_ms[content_start]
        end_ms = char_to_ms[content_end]
        if end_ms <= start_ms:
            end_ms = start_ms + 100
        result.append((text, start_ms, end_ms))
    return result


def write_srt(segments_with_times, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        for i, (text, start_ms, end_ms) in enumerate(segments_with_times, 1):
            f.write(f"{i}\n")
            f.write(f"{_to_time(start_ms)} --> {_to_time(end_ms)}\n")
            f.write(f"{text}\n")
            f.write("\n")


def main():
    args = sys.argv[1:]
    max_len = MAX_LINE_LEN

    if '--max-len' in args:
        idx = args.index('--max-len')
        max_len = int(args[args.index('--max-len') + 1])
        args.pop(idx + 1)
        args.pop(idx)

    if len(args) < 1:
        print("Usage: python resegment_srt.py <input.srt> [output.srt] [--max-len 62]")
        sys.exit(1)

    input_path = args[0]
    output_path = args[1] if len(args) > 1 else input_path.rsplit('.', 1)[0] + '_resegmented.srt'

    print(f"Input:  {input_path}")
    print(f"Output: {output_path}")
    print(f"Max line length: {max_len}")
    print()

    entries = parse_srt(input_path)
    if not entries:
        print("Error: No valid subtitle entries found.")
        sys.exit(1)
    print(f"Parsed {len(entries)} original subtitle entries")

    full_text, char_to_ms = build_full_text(entries)
    print(f"Reconstructed full text: {len(full_text)} characters")

    segments = segment_by_punctuation(full_text)
    print(f"After punctuation resegmentation: {len(segments)} segments")

    segments = split_long_segments(segments, max_len)
    print(f"After long-line splitting: {len(segments)} segments")

    segments = merge_short_segments(segments, max_len)
    print(f"After merging short segments: {len(segments)} segments")

    segments_with_times = assign_timestamps(segments, char_to_ms)

    write_srt(segments_with_times, output_path)

    bak_path = input_path.rsplit('.', 1)[0] + '-bak.srt'
    os.rename(input_path, bak_path)
    os.rename(output_path, input_path)
    output_path = input_path
    print(f"Backup:  {bak_path}")

    print(f"\n{'='*60}")
    print("Preview (first 8 entries):")
    print('='*60)
    for i, (text, start_ms, end_ms) in enumerate(segments_with_times[:8], 1):
        print(f"[{i}] {_to_time(start_ms)} --> {_to_time(end_ms)}")
        print(f"    {text}")
        print()
    if len(segments_with_times) > 8:
        print(f"... ({len(segments_with_times)} total segments)")
    print(f"Done. Output written to {output_path}")


if __name__ == '__main__':
    main()
