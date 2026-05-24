# STATE_MACHINE

## Session Machine

### State: `S0_START`

- purpose: initialize execution
- transitions:
  - `STATE: S0_START`
    `ON: invoke`
    `IF: argv provided`
    `DO: capture argv; init runtime context`
    `GOTO: S1_LOAD_CONFIG`

### State: `S1_LOAD_CONFIG`

- actions: load `config.toml` when present; missing config is non-fatal and treated as empty config; apply env fallbacks if unset
- transitions:
  - `STATE: S1_LOAD_CONFIG`
    `ON: config_loaded`
    `IF: always`
    `DO: set effective env keys; run P1 Resolve Paths (includes default store-path bootstrap when unset and computes is_first_run = !exists(STORE_PATH))`
    `GOTO: S2_PARSE`

### State: `S2_PARSE`

- actions: parse argv via command grammar
- transitions:
  - `STATE: S2_PARSE`
    `ON: parse_ok`
    `IF: command recognized`
    `DO: normalize aliases; store parsed_args`
    `GOTO: S2_ONBOARDING_GATE`
  - `STATE: S2_PARSE`
    `ON: parse_error`
    `IF: onboarding_status == offered and argv is affirmative/negative natural-language reply`
    `DO: capture onboarding decision`
    `GOTO: C_ONBOARDING_EXEC`
  - `STATE: S2_PARSE`
    `ON: parse_error`
    `IF: clap parser failure and not onboarding reply`
    `DO: record E_PARSE_*; set exit_code=2`
    `GOTO: T_PARSE_FAILURE`

### State: `S2_ONBOARDING_GATE`

- actions: run `P14 First-Run Onboarding` (non-blocking offer/guide policy)
- transitions:
  - `STATE: S2_ONBOARDING_GATE`
    `ON: onboarding_offer_emitted`
    `IF: is_first_run == true and onboarding_status == not_offered`
    `DO: set onboarding_status=offered; append onboarding offer to response/meta`
    `GOTO: S3_DISPATCH`
  - `STATE: S2_ONBOARDING_GATE`
    `ON: onboarding_not_applicable`
    `IF: onboarding already handled or not first run`
    `DO: none`
    `GOTO: S3_DISPATCH`

### State: `S3_DISPATCH`

- actions: map canonical command to handler family
- transitions:
  - `STATE: S3_DISPATCH`
    `ON: dispatch_ready`
    `IF: command in feed family`
    `DO: set command_family=feed`
    `GOTO: C_FEED_EXEC`
  - `STATE: S3_DISPATCH`
    `ON: dispatch_ready`
    `IF: command in fetch family`
    `DO: set command_family=fetch`
    `GOTO: C_FETCH_EXEC`
  - `STATE: S3_DISPATCH`
    `ON: dispatch_ready`
    `IF: command in article/read/search family`
    `DO: set command_family=article`
    `GOTO: C_ARTICLE_EXEC`
  - `STATE: S3_DISPATCH`
    `ON: dispatch_ready`
    `IF: command in export family`
    `DO: set command_family=export`
    `GOTO: C_EXPORT_EXEC`
  - `STATE: S3_DISPATCH`
    `ON: dispatch_ready`
    `IF: command in llm family`
    `DO: set command_family=llm`
    `GOTO: C_LLM_EXEC`
  - `STATE: S3_DISPATCH`
    `ON: dispatch_ready`
    `IF: command in system family`
    `DO: set command_family=system`
    `GOTO: C_SYSTEM_EXEC`

## Command Machines

### `C_ONBOARDING_EXEC`

- purpose: process onboarding yes/no replies and drive 3-step starter guidance
- actions:
  - run `P14 First-Run Onboarding` decision/progression logic
  - on accepted onboarding, emit next guided command from fixed sequence:
    1. `config show`
    2. `feed add <url> [-n name]`
    3. `read --unread --limit 20`
- success transition:
  - `GOTO: S4_FORMAT_SUCCESS`
- failure transitions:
  - none (onboarding handling is non-fatal and does not map to command/network/store/analysis terminals)

### `C_FEED_EXEC`

- actions:
  - run `P2 Load Store`
  - execute `feed add/rm/ls/import/tag` via primitives (`P4`, `P8`, `P9`, `P10`)
  - run `P3 Save Store` on mutating paths
- failure transitions:
  - store load/save failure -> `T_STORE_FAILURE` (`exit 3`)
  - command validation/domain failure -> `T_COMMAND_FAILURE` (`exit 1`)
  - network failure during initial fetch in `feed add` does not fail command; recorded as `fetchOk=false`
- success transition:
  - `GOTO: S4_FORMAT_SUCCESS`

### `C_FETCH_EXEC`

- actions:
  - run `P2 Load Store`
  - resolve optional feed filter via `P4`
  - fetch feeds via `P9` and parse via `P10`
  - apply dedup/update logic and run `P3 Save Store`
- failure transitions:
  - empty feed set / unresolved feed -> `T_COMMAND_FAILURE` (`exit 1`)
  - all feeds failed network -> `T_NETWORK_FAILURE` (`exit 2`)
  - store read/write failure -> `T_STORE_FAILURE` (`exit 3`)
- partial-failure behavior:
  - some feeds fail, some succeed -> success terminal with per-feed errors in payload

### `C_ARTICLE_EXEC`

- includes `read`, `article/show`, `mark`, `search`
- actions:
  - run `P2 Load Store`
  - resolve runtime IDs and filters (`P4`, `P5`, `P6`, `P7`)
  - mutate article state where applicable (`article/show`, `mark`)
  - run `P3 Save Store` for mutating commands
- failure transitions:
  - parse-level datetime invalidity converted at runtime (`read --since`) -> `T_COMMAND_FAILURE` (`exit 1`)
  - unresolved/ambiguous IDs -> `T_COMMAND_FAILURE` (`exit 1`)
  - store failure -> `T_STORE_FAILURE` (`exit 3`)

### `C_EXPORT_EXEC`

- actions:
  - run `P2 Load Store`
  - build OPML/JSON/Markdown export via `P11`
  - optional write to output file
- failure transitions:
  - invalid feed filter / command validation -> `T_COMMAND_FAILURE` (`exit 1`)
  - output file write failure -> `T_COMMAND_FAILURE` (`exit 1`)
  - store load failure -> `T_STORE_FAILURE` (`exit 3`)

### `C_LLM_EXEC`

- commands: `analyse`, `digest`, `label`
- actions:
  - run `P2 Load Store`
  - resolve filters and build analysis context
  - resolve task spec (`ANALYSIS_SPECS/*`) and merge optional user prompt overrides
  - validate local analysis backend capability
  - invoke local analysis via `P12`
  - if `label --auto`, mutate labels and persist via `P3 Save Store`
- failure transitions:
  - missing local capability, invocation failure, or response-parse failure -> `T_ANALYSIS_FAILURE` (`exit 4`)
  - `digest` pre-fetch network failure is non-fatal; continue and let analysis determine final outcome
  - store load/save failure -> `T_STORE_FAILURE` (`exit 3`)

### `C_SYSTEM_EXEC`

- includes `stats`, `config show`, `completions`
- actions:
  - run `P2 Load Store` when command requires store data
  - compute stats/config or generate completion script
- failure transitions:
  - unsupported shell in completions -> `T_COMMAND_FAILURE` (`exit 1`)
  - store failure in stats/config -> `T_STORE_FAILURE` (`exit 3`)

## Output State

### State: `S4_FORMAT_SUCCESS`

- transitions:
  - `STATE: S4_FORMAT_SUCCESS`
    `ON: command_ok`
    `IF: output_mode == json`
    `DO: run P13 Output Envelope (json)`
    `GOTO: T_SUCCESS`
  - `STATE: S4_FORMAT_SUCCESS`
    `ON: command_ok`
    `IF: output_mode == human`
    `DO: run P13 Output Envelope (human)`
    `GOTO: T_SUCCESS`

### State: `S4_FORMAT_ERROR`

- transitions:
  - `STATE: S4_FORMAT_ERROR`
    `ON: command_err`
    `IF: output_mode == json`
    `DO: run P13 Output Envelope (json error)`
    `GOTO: terminal mapped by error class`
  - `STATE: S4_FORMAT_ERROR`
    `ON: command_err`
    `IF: output_mode == human`
    `DO: run P13 Output Envelope (human error)`
    `GOTO: terminal mapped by error class`

## Primitive Execution Guard

- command handling states must execute only primitives from `EXECUTION_PRIMITIVES.md`.
- invoking external RSS command binaries during normal command execution is invalid and maps to `T_COMMAND_FAILURE` with `E_COMMAND_BINARY_FORBIDDEN`.

## Panic Boundary

- unexpected runtime panic transitions to `T_PANIC` with `E_PANIC`.

## Terminal States

- `T_SUCCESS` -> exit 0
- `T_PARSE_FAILURE` -> exit 2
- `T_COMMAND_FAILURE` -> exit 1
- `T_NETWORK_FAILURE` -> exit 2
- `T_STORE_FAILURE` -> exit 3
- `T_ANALYSIS_FAILURE` -> exit 4
- `T_PANIC` -> exit 100
