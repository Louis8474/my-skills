---
name: yt-llm-translate
description: Download YouTube videos and generate translated subtitles. Use this whenever the user provides a YouTube URL and asks to download the video, generate subtitles, translate subtitles, or create bilingual captions. Default translation target is Chinese. Even if the user only says "download this video" or "get subtitles for this," trigger this skill when a YouTube link is involved.
---

Run the entry script using the full path to the skill's scripts directory. Do not change the current working directory — output files should land in the user's workspace, not the skill directory.
All workflow steps (download, punctuator, translate) are handled by the scripts.

## Platform-specific Python command

Do NOT simply use `python` — on Windows this often resolves to the Microsoft Store stub which fails silently. Follow the order below to find a working Python executable:

1. **macOS / Linux**: `python3` (preferred, most reliable)
2. **Windows**:
   - First try `py` (the Python launcher, bypasses Store stub)
   - If that fails, run `where.exe python` to locate the real Python path — pick a path NOT under `Microsoft\WindowsApps` (e.g., `C:\Users\<user>\AppData\Local\Python\bin\python.exe`)
   - Use the discovered full path directly in the command

```
py "<path-to-skill>/scripts/entry.py" "<youtube_url>"
```

If `py` is not available:
```
"C:\Users\<user>\AppData\Local\Python\bin\python.exe" "<path-to-skill>/scripts/entry.py" "<youtube_url>"
```
