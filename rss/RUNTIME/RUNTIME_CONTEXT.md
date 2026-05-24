# RUNTIME_CONTEXT

## Extended Context Schema

- `argv`: raw argument vector
- `parsed_args`: canonical parsed command structure
- `canonical_command`: normalized command id (e.g., `read`, `feed.add`)
- `env`: selected effective env values
- `config`: parsed config file values before fallback application
- `cwd`: working directory
- `store_path`: resolved db path
- `is_first_run`: bool, computed at invocation start as `!exists(store_path)`
- `onboarding_status`: `not_offered|offered|accepted|declined|completed`
- `onboarding_step`: `0|1|2|3` for starter-guide progression
- `onboarding_commands`: fixed ordered list `["config show","feed add <url> [-n name]","read --unread --limit 20"]`
- `store_loaded`: bool
- `output_mode`: `json|human`
- `response_command`: envelope `command` field
- `response_data`: serialized payload
- `error_id`: canonical error from `ERRORS.md`
- `error_message`: human-readable failure detail
- `exit_code`: terminal exit code
- `artifacts`: file/network artifacts produced during execution
- `side_effect_log`: ordered side-effect entries
- `warnings`: non-fatal anomalies
- `rss_command_binary_invocation_forbidden`: always `true` during normal execution

## Effective Environment Keys

- `RSS_DB`
- `RSS_OUTPUT`
- `RSS_CONCURRENCY`
- `RSS_MAX_ARTICLE_CHARS`
- `RSS_ANALYSIS_SPECS_DIR`
- `RSS_LLM_BACKEND`
- `NO_COLOR`

## Side Effect Record Format

Each side effect record must include:

- `type`: `filesystem|network|env|subprocess`
- `action`: short action name (e.g., `store.save`, `fetch.http_get`, `llm.post_messages`)
- `inputs`: key parameters used
- `result`: `ok|error`
- `idempotency`: `idempotent|non_idempotent|conditionally_idempotent`
- `retry_policy`: explicit policy (`none`, fixed retries, bounded retries)
- `error_mapping`: target `error_id` and exit code

## Idempotency and Retry Policy

| Action | Idempotency | Retry policy | Notes |
|---|---|---|---|
| `feed.ls/read/search/stats/config/completions` | idempotent | none | read-only |
| `feed.add` | non_idempotent | none | duplicate URL returns command error |
| `feed.rm` | non_idempotent | none | second run fails not-found |
| `feed.tag --remove` | idempotent | none | safe repeat |
| `feed.tag` add tags | conditionally_idempotent | none | dedup prevents duplicates |
| `fetch` | conditionally_idempotent | none in app; per-feed errors captured | dedup prevents duplicate articles |
| `article/show` | idempotent after first | none | sets `read=true` |
| `mark --read` | idempotent | none | repeated true assignment |
| `mark --star` | non_idempotent | none | toggles value each run |
| `export * --output` | conditionally_idempotent | none | overwrites file with current data snapshot |
| `analyse/digest/label` local analysis calls | non_idempotent | none | model outputs vary |
| store lock acquisition in save | bounded retry | 4 attempts x 500ms | fails as store error on timeout |

## Guard Conditions

- missing parser-required args -> parse failure state
- unresolved feed/article ids -> command failure state
- missing required local analysis capability for selected backend -> analysis failure state
- network unavailable for fetch -> network failure if all targets fail
- filesystem write/read failures -> command/store failure as mapped
- panic path -> panic terminal with exit 100
- attempted external RSS command-binary invocation in command execution -> command failure (`E_COMMAND_BINARY_FORBIDDEN`)
