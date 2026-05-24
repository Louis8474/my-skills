# COMMAND_GRAMMAR

This grammar defines the accepted command language. It must be parsed and executed by markdown-native primitives, not by invoking an external RSS command binary.

## 1. Command Tree

```text
[optional "rss" prefix] [GLOBAL_FLAGS...] <COMMAND>

COMMAND :=
  feed <feed-subcommand>
| fetch [--feed <feed_ref>]
| read [read_flags...]
| ls [read_flags...]                     # alias of read
| article <article_ref>
| show <article_ref>                     # semantic alias of article
| mark <article_ref> [mark_flags...]
| search <query> [search_flags...]
| export <export-subcommand>
| analyse [analyse_flags...]
| analyze [analyse_flags...]             # alias of analyse
| digest [digest_flags...]
| label <article_ref> [--auto]
| stats
| completions <shell>
| config show
```

Feed subtree:

```text
feed add <url> [-n|--name <name>] [-t|--tags <tag>]...
feed rm <feed_ref>
feed ls [--tag <tag>]
feed import <file> [--dry-run]
feed tag <feed_ref> <comma_tags> [--remove]
```

Export subtree:

```text
export opml [-o|--output <path>]
export json [-f|--feed <feed_ref>] [-o|--output <path>]
export md   [-f|--feed <feed_ref>] [-o|--output <path>]
```

Global flags (must appear before the root command token):

```text
--json
--no-color
--db <path>
-q|--quiet
-v|--verbose
--concurrency <n>=1
```

## 2. Canonical Names And Aliases

- `ls` (root) -> canonical `read`
- `analyze` -> canonical `analyse`
- `show` -> canonical command behavior of `article` (same handler and output command id `article.show`)
- `feed ls` is a separate canonical subcommand under `feed`

Normalization order:

1. parse command token path
2. apply alias map at the matched command node
3. dispatch canonical command

## 3. Flags

### Global flags

| Flag | Type | Cardinality | Default | Notes |
|---|---|---|---|---|
| `--json` | bool | single | false | forces JSON mode |
| `--no-color` | bool | single | false | only affects human mode |
| `--db <path>` | path | single | none | store path override |
| `-q/--quiet` | bool | single | false | suppresses info logging |
| `-v/--verbose` | bool | single | false | enables debug logging unless quiet |
| `--concurrency <n>` | int | single | `10` | parser requires `n >= 1`; env key `RSS_CONCURRENCY` |

### Command-local flags

| Command | Flag | Type | Cardinality | Default |
|---|---|---|---|---|
| `feed add` | `-n/--name` | string | single | none |
| `feed add` | `-t/--tags` | string | repeatable | `[]` |
| `feed ls` | `--tag` | string | single | none |
| `feed import` | `--dry-run` | bool | single | false |
| `feed tag` | `--remove` | bool | single | false |
| `fetch` | `-f/--feed` | string | single | none |
| `read/ls` | `-f/--feed` | string | single | none |
| `read/ls` | `-n/--limit` | usize | single | `20` |
| `read/ls` | `-u/--unread` | bool | single | false |
| `read/ls` | `-s/--starred` | bool | single | false |
| `read/ls` | `--since` | string | single | none |
| `read/ls` | `--today` | bool | single | false |
| `read/ls` | `--label` | string | single | none |
| `mark` | `--read` | bool | single | false |
| `mark` | `--star` | bool | single | false |
| `mark` | `--label` | string | single | none |
| `search` | `-f/--feed` | string | single | none |
| `search` | `-n/--limit` | usize | single | none |
| `search` | `--field` | string | single | none |
| `export json/md` | `-f/--feed` | string | single | none |
| `export *` | `-o/--output` | path | single | none |
| `analyse` | `-f/--feed` | string | single | none |
| `analyse` | `-p/--prompt` | string | single | none |
| `analyse` | `--today` | bool | single | false |
| `analyse` | `-n/--limit` | usize | single | none (runtime default 20) |
| `digest` | `-f/--feed` | string | single | none |
| `digest` | `-p/--prompt` | string | single | none |
| `label` | `--auto` | bool | single | false |

Repeated single-value options are rejected by parser (example: `read --limit 1 --limit 2` -> parse error, exit 2).

## 4. Constraint Sets

- mutually-exclusive groups: none defined by app-level parser metadata
- required-together groups: none
- depends-on groups: none
- forbidden-with groups: none

Validation beyond parse:

- `--concurrency` must parse as positive integer (`>=1`)
- `--since` accepted as string at parse phase; semantic datetime validation happens in command handler

## 5. Inheritance Rules

- Global flags are parsed at root command level and passed to all command handlers through context.
- Subcommands do not redefine global flags.
- Root flags must appear before command path (`--json feed ls` valid; `feed ls --json` parse error).

## 6. Positional Argument Rules

| Command | Positional schema |
|---|---|
| `feed add` | `<url>` required |
| `feed rm` | `<feed_ref>` required |
| `feed import` | `<file>` required |
| `feed tag` | `<feed_ref> <comma_tags>` both required |
| `article/show` | `<article_ref>` required |
| `mark` | `<article_ref>` required |
| `search` | `<query>` required |
| `completions` | `<shell>` required |
| `config` | subcommand `show` required |

`--` separator behavior:

- standard end-of-options token is supported.
- edge-case verified: `search -- --today` treats `--today` as query string, not as flag.

Unknown extra tokens cause parse errors.

## 7. Precedence Rules

### Baseline

1. built-in defaults
2. config file (`$XDG_CONFIG_HOME/rss/config.toml` or platform equivalent) when present; missing file is non-fatal and treated as empty config
3. environment variables
4. command flags

### Key-level effective rules

- `RSS_DB`: config key `db` is first copied to env if env missing; final path resolution is `--db` > `RSS_DB` > runtime default data-dir store path (platform strategy).
- `RSS_CONCURRENCY`: default `10`; env value parsed by parser; `--concurrency` overrides env/config.
- `RSS_MAX_ARTICLE_CHARS`: used by LLM context builder; default `2000`.
- `RSS_ANALYSIS_SPECS_DIR`: optional override for analysis spec directory; default `<skill_root>/ANALYSIS_SPECS`.
- `RSS_LLM_BACKEND`: local analysis backend selector; default `agent`.

Output mode precedence (runtime canonical):

1. `--json` flag
2. non-TTY stdout => JSON
3. `RSS_OUTPUT` (`json` or `human`) when stdout is TTY
4. human default

## 8. Parse Ambiguity Resolution

- Command token ambiguity:
  - root `ls` resolves to `read` alias.
  - `feed ls` resolves to feed listing subcommand.
- Alias collisions: none in current command tree.
- Repeated single flags: parser error, no last-write-wins behavior.
- Runtime feed reference resolution (`feed_ref`): exact id -> exact URL -> case-insensitive name -> unique id prefix; else error.
- Runtime article reference resolution (`article_ref`): exact id -> unique id prefix; else error.

## 9. Parse Error Mapping

| Parse error class | Error ID | Exit | Notes |
|---|---|---:|---|
| unknown root/subcommand | `E_PARSE_UNKNOWN_COMMAND` | 2 | parser parse failure |
| unexpected argument in command scope | `E_PARSE_UNEXPECTED_ARG` | 2 | example: root flag after command path |
| missing required positional/subcommand | `E_PARSE_MISSING_REQUIRED` | 2 | parser usage error |
| repeated non-repeatable option | `E_PARSE_DUPLICATE_FLAG` | 2 | example: duplicate `--limit` |
| invalid typed option (e.g. concurrency) | `E_PARSE_INVALID_VALUE` | 2 | includes custom parser rejection |

Runtime semantic validation errors (e.g., invalid `--since` date) map to command errors (`exit 1`) via `ERRORS.md`.

Onboarding exception:

- when `onboarding_status=offered` and the raw input is an affirmative/negative natural-language reply, parser failure can be intercepted by the state machine onboarding path (`C_ONBOARDING_EXEC`) instead of exiting with parse failure.

## 10. Conformance Cases

- alias expansion: `ls --limit 1` equals `read --limit 1`
- repeated flag behavior: `read --limit 1 --limit 2` fails parse (exit 2)
- precedence: `RSS_CONCURRENCY=5 --concurrency 20 config show` yields `20`
- positional edge: `search -- --today` treats `--today` as query literal
- global flag placement: `feed ls --json` fails parse; `--json feed ls` succeeds
