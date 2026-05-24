---
name: codex-loop
description: Install or refresh the Codex Loop runtime for structured [[CODEX_LOOP ...]] activation with min="...", rounds="...", or goal="...". Use only for codex-loop setup, status, uninstall, or activation guidance.
---

# Codex Loop

## Procedures

**Step 1: Inspect current global Codex state**
1. Read `~/.codex/config.toml` only if it exists so you can explain whether `features.codex_hooks` was already enabled.
2. Read `~/.codex/codex-loop/config.toml` only if it exists so you can describe optional continuation guidance, goal confirmation settings, Stop hook timeout, and any string-based `pre_loop_continue` command.
3. When an active workspace is known, read the nearest `codex-loop.toml` from the current directory up to the workspace root if it exists. Treat it as a per-field project overlay over the global runtime config.
4. Do not hand-edit global hook files for normal setup; `codex-loop install` syncs the bundled hook commands into `~/.codex/hooks.json` while preserving unrelated hooks.

**Step 2: Install, refresh, or upgrade the runtime**
1. If `codex-loop` is not on `PATH`, install it:
   - `go install github.com/compozy/codex-loop/cmd/codex-loop@latest`
2. Execute:
   - `codex-loop install`
3. If the user asks to update an existing install, prefer:
   - `codex-loop upgrade`
   - or `codex-loop upgrade --version v0.1.1` for a pinned release.
4. Read the command output and report the runtime path, loop state path, managed hook config path, config path, and whether Codex plugin marketplace refresh ran or was skipped.
5. Tell the user to restart Codex so plugin lifecycle hooks and `features.codex_hooks` are reloaded.

**Step 3: Explain activation**
1. Tell the user that loop activation must be the first line of the prompt.
2. Tell the user that the header must contain exactly one limiter:
   - `[[CODEX_LOOP name="release-stress-qa" min="6h"]]`
   - `[[CODEX_LOOP name="release-stress-qa" rounds="3"]]`
   - `[[CODEX_LOOP name="release-stress-qa" goal="ship only after verification"]]`
3. Tell the user that goal loops run a configurable headless confirmation command before continuing or completing; the public command returns normal text and the default is `codex exec --yolo`.
4. Tell the user that model and reasoning are separate: `confirm_model="gpt-5.5"` and `confirm_reasoning_effort="xhigh"`.
5. Tell the user that codex-loop privately interprets the confirmation text into the internal verdict through a fixed `codex exec --output-schema` step; the default interpreter model is `gpt-5.4-mini`.
6. Tell the user that the task prompt starts on the next line and remains the source task for every continuation.
7. Tell the user that loop state is persisted under `~/.codex/codex-loop/loops/` and goal-check metadata is appended to `~/.codex/codex-loop/runs.jsonl`.

## Commands

- `codex-loop install`: install or refresh the local runtime under `~/.codex/codex-loop/` and sync managed hook registrations into `~/.codex/hooks.json`.
- `codex-loop upgrade`: download the latest GitHub release, verify checksums, replace the local CLI binary, refresh the managed runtime/hooks, and refresh the Codex plugin marketplace when the Codex CLI is available.
- `codex-loop upgrade --version v0.1.1`: install a pinned release with the same checks.
- `codex-loop status`: print active loop state as JSON.
- `codex-loop status --all`: include completed, superseded, and cut-short loops.
- `codex-loop uninstall`: remove the managed `~/.codex/codex-loop/` runtime directory and only the `codex-loop`-managed hook registrations.
- `codex-loop.toml`: optional project-local runtime config discovered from the hook CWD up to the workspace root. Fields defined there override the global `~/.codex/codex-loop/config.toml`; omitted fields inherit global/default values.
- `[pre_loop_continue]`: optional codex-loop runtime hook configured with a shell-like `command = ""` string that is parsed to argv and run synchronously inside the Stop handler before an automatic continuation prompt is emitted. Project-local `command = ""` disables a global pre-loop command for that project.
- `[goal]`: optional defaults for goal confirmation, including `confirm_model`, `confirm_reasoning_effort`, `confirm_command`, `timeout_seconds`, `interpret_model`, `interpret_reasoning_effort`, `interpret_timeout_seconds`, and `max_output_bytes`.
- `[hooks].stop_timeout_seconds`: managed Stop hook timeout written during `codex-loop install`; rerun install and restart Codex after changing it.

## Error Handling

- If `go install` fails, confirm Go is installed and available on `PATH`.
- If `codex-loop install` fails while updating `~/.codex/config.toml`, inspect that file for malformed TOML or filesystem permission problems.
- If activation does nothing after install, restart Codex and confirm the `codex-loop` plugin is installed and enabled.
