# COMMANDS

Execution note: command strings are CLI-like syntax, but execution is markdown-native via `RUNTIME/EXECUTION_PRIMITIVES.md`. External RSS command binaries must not be invoked for these paths.

## Canonical Command Inventory

| Family | Source command path | Canonical path | Primitive path | Side effects |
|---|---|---|---|---|
| feed | `feed add <url> [-n name] [-t tag ...]` | `feed.add` | `P2 -> P8 (+ P9/P10 optional) -> P3 -> P13` | store write, optional initial network fetch |
| feed | `feed rm <id>` | `feed.rm` | `P2 -> P4 -> P8 -> P3 -> P13` | store write, deletes feed+articles |
| feed | `feed ls [--tag t]` | `feed.ls` | `P2 -> P13` | none |
| feed | `feed import <file> [--dry-run]` | `feed.import` | `P2 -> P8 -> (P3 if !dry-run) -> P13` | file read, optional store write |
| feed | `feed tag <id> <tags> [--remove]` | `feed.tag` | `P2 -> P4 -> P8 -> P3 -> P13` | store write |
| fetch | `fetch [-f/--feed id]` | `fetch` | `P2 -> P4(optional) -> P9/P10 -> P3 -> P13` | network requests, store write |
| read | `read [-f feed] [-n limit] [-u/--unread] [-s/--starred] [--since dt] [--today] [--label l]` | `read` | `P2 -> P4(optional) -> P6 -> P13` | none |
| article | `article <id>` | `article.show` | `P2 -> P5 -> mutate -> P3 -> P13` | store write (`read=true`) |
| article | `show <id>` | `article.show` | `P2 -> P5 -> mutate -> P3 -> P13` | store write (`read=true`) |
| mark | `mark <id> [--read] [--star] [--label l]` | `mark` | `P2 -> P5 -> mutate -> P3 -> P13` | store write |
| search | `search <query> [--feed id] [--limit n] [--field f]` | `search` | `P2 -> P4(optional) -> P7 -> P13` | none |
| export | `export opml [-o path]` | `export.opml` | `P2 -> P11 -> P13` | optional file write |
| export | `export json [-f feed] [-o path]` | `export.json` | `P2 -> P4(optional) -> P11 -> P13` | optional file write |
| export | `export md [-f feed] [-o path]` | `export.md` | `P2 -> P4(optional) -> P11 -> P13` | optional file write |
| llm | `analyse [-f feed] [-p prompt] [--today] [-n limit]` | `analyse` | `P2 -> context build -> P12 -> P13` | local analysis backend invocation (spec-guided) |
| llm | `digest [-f feed] [-p prompt]` | `digest` | `P2 -> P9/P10(fetch) -> context build -> P12 -> P13` | fetch + local analysis backend invocation |
| llm | `label <id> [--auto]` | `label` | `P2 -> P5 -> P12 -> mutate(optional) -> P3(optional) -> P13` | local analysis backend invocation, optional store write |
| system | `stats` | `stats` | `P2 -> stats calc -> P13` | none |
| system | `config show` | `config.show` | `config/env resolve -> P13` | none |
| system | `completions <shell>` | `completions` | `shell switch -> script render -> P13` | none |

Aliases: `ls` -> `read`, `analyze` -> `analyse`, `show` -> `article.show` (semantic alias via dispatcher).

Response `command` field in the P13 output envelope equals the canonical path. Exception: `digest` emits `analyse` (delegates to analyse handler).

## Command Families Discovered

- global parser/output context
- feed management
- fetch
- article browsing/mutation
- export
- LLM
- system
- onboarding (internal; `C_ONBOARDING_EXEC` via `P14`, intercepts parse errors when `onboarding_status=offered`)
