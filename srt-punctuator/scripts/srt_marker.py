#!/usr/bin/env python3
"""
SRT Marker - prepare SRT for punctuation and finalize after punctuation.

Usage:
  python srt_marker.py prepare <input.srt> [<chunk_size>]
  python srt_marker.py finalize <original.srt> <punctuated.txt>
  python srt_marker.py finalize <original.srt> <work_dir> --from-chunks
"""

import json
import os
import re
import shutil
import sys

MARKER_RE = re.compile(r'<<(\d+)>>')

CHUNK_SIZE = 50


def parse_srt(path):
    """Parse an SRT file into list of (index, timestamp, text)."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    blocks = re.split(r'\n\n+', content.strip())

    entries = []
    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) < 2:
            continue
        idx = lines[0]
        timestamp = lines[1]
        text = ' '.join(lines[2:]).strip()
        entries.append((idx, timestamp, text))

    return entries


def _stem(path):
    return re.sub(r'\.srt$', '', os.path.basename(path), flags=re.IGNORECASE)


def _work_dir(srt_path):
    return os.path.join(os.path.dirname(srt_path) or '.', f'{_stem(srt_path)}.punc_work')


def _output_path(srt_path):
    return os.path.join(os.path.dirname(srt_path) or '.', f'{_stem(srt_path)}_punctuated.srt')


def _parse_and_write_marked(entries, dir_path, file_name, start_index=0):
    """Write entries as a marked single-line article to a file."""
    parts = []
    for i, (_idx, _ts, text) in enumerate(entries, start=start_index):
        parts.append(f'<<{i}>>{text}')
    marked = ' '.join(parts)
    full_path = os.path.join(dir_path, file_name)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(marked)
    return full_path


def prepare(srt_path, chunk_size=CHUNK_SIZE):
    """Split SRT text into marker-wrapped chunks for AI punctuation."""
    entries = parse_srt(srt_path)

    work_dir = _work_dir(srt_path)
    os.makedirs(work_dir, exist_ok=True)

    _parse_and_write_marked(entries, work_dir, 'marked.txt')

    chunks_dir = os.path.join(work_dir, 'chunks')
    os.makedirs(chunks_dir, exist_ok=True)

    total_chunks = (len(entries) + chunk_size - 1) // chunk_size
    for chunk_idx in range(total_chunks):
        start = chunk_idx * chunk_size
        end = min(start + chunk_size, len(entries))
        chunk_entries = entries[start:end]
        _parse_and_write_marked(
            chunk_entries,
            chunks_dir,
            f'chunk_{chunk_idx:03d}.txt',
            start_index=start
        )

    manifest = {
        'total_chunks': total_chunks,
        'chunk_size': chunk_size,
        'total_entries': len(entries)
    }
    manifest_path = os.path.join(work_dir, 'chunks.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print(f'Entries: {len(entries)}  Chunks: {total_chunks}  Chunk size: {chunk_size}')
    print(f'Chunks saved to: {chunks_dir}/')
    print(f'For each chunk_NNN.txt, add punctuation and save as chunk_NNN_punctuated.txt')


def finalize(srt_path, input_path, from_chunks=False):
    """Split punctuated text back into SRT entries and clean up."""
    if from_chunks:
        work_dir = input_path
        chunks_dir = os.path.join(work_dir, 'chunks')

        if not os.path.isdir(chunks_dir):
            print(f'Error: chunks directory not found: {chunks_dir}')
            sys.exit(1)

        manifest_path = os.path.join(work_dir, 'chunks.json')
        if not os.path.exists(manifest_path):
            print(f'Error: chunks.json not found in {work_dir}')
            sys.exit(1)

        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)

        chunk_parts = []
        for i in range(manifest['total_chunks']):
            chunk_path = os.path.join(chunks_dir, f'chunk_{i:03d}_punctuated.txt')
            if not os.path.exists(chunk_path):
                print(f'Error: missing punctuated chunk: {chunk_path}')
                print('Make sure all chunks have been processed before finalizing.')
                sys.exit(1)
            with open(chunk_path, 'r', encoding='utf-8') as f:
                chunk_parts.append(f.read().strip())

        marked_text = ' '.join(chunk_parts)
        print(f'Combined {len(chunk_parts)} chunks -> {len(marked_text)} chars')
    else:
        work_dir = _work_dir(srt_path)

        if not os.path.exists(input_path):
            print(f'Error: punctuated file not found: {input_path}')
            sys.exit(1)

        with open(input_path, 'r', encoding='utf-8') as f:
            marked_text = f.read().strip()

    output_path = _output_path(srt_path)

    if os.path.normpath(output_path) == os.path.normpath(srt_path):
        print(f'Error: output path would overwrite the original file: {output_path}')
        sys.exit(1)

    segments = {}
    for m in re.finditer(MARKER_RE, marked_text):
        idx = int(m.group(1))
        start = m.end()
        rest = marked_text[start:]
        next_m = re.search(MARKER_RE, rest)
        if next_m:
            end = start + next_m.start()
        else:
            end = len(marked_text)
        text = marked_text[start:end].strip()
        segments[idx] = text

    entries = parse_srt(srt_path)

    result_blocks = []
    for i, (idx, ts, original_text) in enumerate(entries):
        new_text = segments.get(i, original_text)
        result_blocks.append(f'{idx}\n{ts}\n{new_text}')

    result = '\n\n'.join(result_blocks)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f'Split {len(entries)} entries -> {output_path}')

    if os.path.getsize(output_path) == 0:
        print('Error: output file is empty, refusing to replace original')
        sys.exit(1)

    if os.path.exists(srt_path):
        os.remove(srt_path)
        print(f'Removed original: {srt_path}')

    os.rename(output_path, srt_path)
    print(f'Replaced: {srt_path}')

    if os.path.isdir(work_dir):
        shutil.rmtree(work_dir)
        print(f'Cleaned up {work_dir}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == 'prepare':
        if len(sys.argv) < 3:
            print('Usage: python srt_marker.py prepare <input.srt> [<chunk_size>]')
            sys.exit(1)
        chunk_size = CHUNK_SIZE
        if len(sys.argv) >= 4:
            chunk_size = int(sys.argv[3])
        prepare(sys.argv[2], chunk_size)

    elif cmd == 'finalize':
        if '--from-chunks' in sys.argv:
            if len(sys.argv) != 5:
                print('Usage: python srt_marker.py finalize <original.srt> <work_dir> --from-chunks')
                sys.exit(1)
            finalize(sys.argv[2], sys.argv[3], from_chunks=True)
        else:
            if len(sys.argv) != 4:
                print('Usage: python srt_marker.py finalize <original.srt> <punctuated.txt>')
                sys.exit(1)
            finalize(sys.argv[2], sys.argv[3])

    else:
        print(f'Unknown command: {cmd}')
        print(__doc__)
        sys.exit(1)
