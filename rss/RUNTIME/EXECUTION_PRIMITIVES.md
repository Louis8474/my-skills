# EXECUTION_PRIMITIVES

This file defines execution primitives for the markdown-native runtime.
These primitives execute all in-scope commands directly and do not delegate command execution to external RSS command executables.

## Runtime Convention

- `CTX_DIR`: per-invocation temp directory.
- `STORE_PATH`: resolved store path.
- `STORE_JSON`: `"$CTX_DIR/store.json"`.
- `NEXT_JSON`: `"$CTX_DIR/store.next.json"`.
- `OUT_JSON`: `"$CTX_DIR/out.json"`.

Each primitive returns:

- `ok=true` and optional payload file path.
- `ok=false` with mapped `error_id` and exit code.

## P1 Resolve Paths

- purpose: compute `STORE_PATH`, `output_mode`, and runtime dirs.
- command:

```bash
mkdir -p "$CTX_DIR"
if [ -z "${STORE_PATH:-}" ]; then
  : "${RUNTIME_DEFAULT_STORE_PATH:?required}"
  STORE_PATH="$RUNTIME_DEFAULT_STORE_PATH"
fi
mkdir -p "$(dirname "$STORE_PATH")"
if [ -f "$STORE_PATH" ]; then
  IS_FIRST_RUN=false
else
  IS_FIRST_RUN=true
fi
```

- failures: `E_COMMAND_VALIDATION` (1) if path resolution fails or runtime directories cannot be created.
- note: `RUNTIME_DEFAULT_STORE_PATH` is computed from the runtime's platform data-directory strategy.
- context output: set `is_first_run = !exists(STORE_PATH)` at invocation start.
- context output: initialize `onboarding_status=not_offered` and `onboarding_step=0` when missing.

## P2 Load Store

- purpose: load existing store or initialize empty store.
- command:

```bash
if [ ! -f "$STORE_PATH" ]; then
  printf '{"version":1,"feeds":[],"articles":[]}' > "$STORE_JSON"
else
  jq -e '.' "$STORE_PATH" > "$STORE_JSON"
fi
```

- failures: `E_STORE_LOAD` (3).
- first-run behavior: when no store file exists, runtime initializes empty in-memory store state; first mutating command persists it via `P3 Save Store`.

## P3 Save Store (Atomic)

- purpose: atomic store commit.
- command:

```bash
jq -e '.' "$NEXT_JSON" > "$STORE_PATH.tmp" && mv "$STORE_PATH.tmp" "$STORE_PATH"
```

- failures: `E_STORE_SAVE` (3).

## P4 Resolve Feed Reference

- purpose: resolve feed reference using canonical order: exact id -> exact url -> case-insensitive name -> unique prefix.
- command template:

```bash
python3 - "$STORE_JSON" "$FEED_REF" <<'PY'
import json, sys
store=json.load(open(sys.argv[1]))
ref=sys.argv[2]
feeds=store.get('feeds',[])
# exact id
for f in feeds:
    if f.get('id')==ref:
        print(f['id']); raise SystemExit(0)
# exact url
for f in feeds:
    if f.get('url')==ref:
        print(f['id']); raise SystemExit(0)
# case-insensitive name
for f in feeds:
    if (f.get('name') or '').lower()==ref.lower():
        print(f['id']); raise SystemExit(0)
# prefix
m=[f['id'] for f in feeds if f.get('id','').startswith(ref)]
if len(m)==1:
    print(m[0]); raise SystemExit(0)
if len(m)==0:
    print("No feed found", file=sys.stderr); raise SystemExit(11)
print("Ambiguous feed id", file=sys.stderr); raise SystemExit(12)
PY
```

- failures:
  - code 11 -> `E_COMMAND_ID_NOT_FOUND` (1)
  - code 12 -> `E_COMMAND_ID_AMBIGUOUS` (1)

## P5 Resolve Article Reference

- purpose: resolve article id by exact id then unique prefix.
- command template mirrors P4 with article list.
- failures map to `E_COMMAND_ID_NOT_FOUND` / `E_COMMAND_ID_AMBIGUOUS` (1).

## P6 Read/List/Filter Articles

- purpose: produce read result set with filters and limit.
- command template:

```bash
jq --arg feed_id "$FILTER_FEED_ID" \
   --arg label "$FILTER_LABEL" \
   --arg since "$FILTER_SINCE" \
   --argjson unread "$FILTER_UNREAD" \
   --argjson starred "$FILTER_STARRED" \
   --argjson today "$FILTER_TODAY" \
   --argjson limit "$FILTER_LIMIT" '
  .articles
  | map(select(($feed_id=="" or .feedId==$feed_id)
               and (if $unread then (.read|not) else true end)
               and (if $starred then .starred else true end)
               and (if $label=="" then true else (.labels|index($label)!=null) end)
        ))
  | sort_by(.publishedAt // "") | reverse
  | .[:$limit]
' "$STORE_JSON" > "$OUT_JSON"
```

- `--since` validation: parse as datetime before jq; invalid parse => `E_COMMAND_VALIDATION` (1).

## P7 Search Articles

- purpose: full-text or field-restricted search.
- command template: `jq` with `ascii_downcase` against `title/summary/content/author`.
- failures: `E_COMMAND_VALIDATION` (1) on invalid field handling policy.

## P8 Feed Add/Remove/Tag/Import

- `feed add`:
  - validate URL scheme (`http|https`), reject duplicates.
  - create UUID and append feed object.
  - optionally call P10 initial fetch (non-fatal; set `fetchOk=false` on failure).
- `feed rm`:
  - resolve feed id, remove feed and dependent articles.
- `feed tag`:
  - add unique tags or remove tags.
- `feed import`:
  - parse OPML outlines with `xmlUrl` and import unless duplicate.

- recommended implementation language: `python3` one-shot scripts reading `STORE_JSON` and writing `NEXT_JSON`.
- failures: `E_COMMAND_VALIDATION` (1), `E_STORE_SAVE` (3).

## P9 Fetch HTTP

- purpose: GET feed URL with conditional headers.
- command:

```bash
curl -fsSL --max-time 30 --connect-timeout 10 \
  -H 'Accept: application/rss+xml, application/atom+xml, application/xml, text/xml, */*' \
  ${ETAG:+-H} ${ETAG:+"If-None-Match: $ETAG"} \
  ${LAST_MOD:+-H} ${LAST_MOD:+"If-Modified-Since: $LAST_MOD"} \
  "$FEED_URL" -D "$CTX_DIR/headers.txt" -o "$CTX_DIR/feed_body"
```

- failures: `E_NETWORK_FETCH_FAILED` (2) when all selected feeds fail.

## P10 Parse Feed Payload

- purpose: parse RSS/Atom/JSON feed and return normalized article objects.
- implementation requirement:
  - use `python3` parser script with stdlib XML/JSON handling.
  - normalize to canonical schema keys (`title`, `url`, `publishedAt`, `summary`, `content`, `contentHash`, etc.).
  - perform dedup equivalent (`url` and `contentHash` within same feed).
- failures: `E_COMMAND_VALIDATION` (1) for parse errors on initial add; `E_NETWORK_FETCH_FAILED` (2) for fetch command when all feeds fail.

## P11 Export Builders

- `export opml`: build XML string from feeds.
- `export json`: object with `articles`, `count`, `exportedAt`.
- `export md`: grouped markdown by feed.
- optional file write with overwrite semantics.
- failures: `E_COMMAND_VALIDATION` (1) for write errors.

## P12 LLM Invoke (Backend Adapter)

- purpose: `analyse`, `digest`, `label`.
- task-specific analysis spec resolution:
  - `analyse` -> `ANALYSIS_SPECS/ANALYSE.md`
  - `digest` -> `ANALYSIS_SPECS/DIGEST.md`
  - `label` -> `ANALYSIS_SPECS/LABEL.md`
  - base directory: `${RSS_ANALYSIS_SPECS_DIR:-$SKILL_ROOT/ANALYSIS_SPECS}`
  - missing spec file is non-fatal; runtime uses default behavior for that task.
- optional user prompt augmentation:
  - if command includes `--prompt` or natural-language modifiers (for example sentiment focus), merge this as additive instruction on top of the task spec.
- backend selection:
  - `RSS_LLM_BACKEND=agent` (default): execute local analysis runtime adapter without external API calls.
- command template (spec load):

```bash
spec_dir="${RSS_ANALYSIS_SPECS_DIR:-$SKILL_ROOT/ANALYSIS_SPECS}"
case "$CANONICAL_COMMAND" in
  analyse) spec_file="$spec_dir/ANALYSE.md" ;;
  digest)  spec_file="$spec_dir/DIGEST.md" ;;
  label)   spec_file="$spec_dir/LABEL.md" ;;
esac
if [ -r "$spec_file" ]; then
  cp "$spec_file" "$CTX_DIR/analysis_spec.md"
  SPEC_AVAILABLE=true
else
  SPEC_AVAILABLE=false
fi
```

- command template (local invoke):

```bash
llm.invoke_local_agent \
  --task "$CANONICAL_COMMAND" \
  --request "$CTX_DIR/llm_body.json" \
  --spec "$CTX_DIR/analysis_spec.md" \
  --spec-available "$SPEC_AVAILABLE" \
  --output "$CTX_DIR/llm_resp.json"
```

- failures: `E_ANALYSIS_CAPABILITY_UNAVAILABLE` or `E_ANALYSIS_INVOKE_FAILED` (4).

## P13 Output Envelope

- JSON mode:

```json
{"ok":<bool>,"command":"<command>","data":<data|null>,"error":<string|null>,"meta":{"count":<n|null>,"elapsedMs":<ms>}|null}
```

- Human mode: render readable tables/text; exact styling is non-normative.

## P14 First-Run Onboarding (Offer And Guided Steps)

- purpose: provide optional first-run guidance without changing command semantics.
- trigger:
  - offer onboarding when `is_first_run=true` and `onboarding_status=not_offered`.
  - run guided flow when `onboarding_status=accepted`.
- offer text (human-mode example):

```text
It looks like this is your first run. Do you want a 3-step quick start? (yes/no)
```

- accepted flow (exact starter commands, in order):
  1. `config show`
  2. `feed add <url> [-n name]`
  3. `read --unread --limit 20`
- progression rules:
  - on affirmative user reply: set `onboarding_status=accepted`, `onboarding_step=1`.
  - after each completed guided step: increment `onboarding_step`.
  - after step 3 completion: set `onboarding_status=completed`.
  - on negative user reply: set `onboarding_status=declined`; continue normal command flow.
  - if user ignores onboarding prompt, continue normal command flow (non-blocking).

## Prohibition

The runtime must not call:

- external RSS command executables

These are allowed only in verification workflows, never in normal command handling.
Any such attempt must raise `E_COMMAND_BINARY_FORBIDDEN` (exit 1).
