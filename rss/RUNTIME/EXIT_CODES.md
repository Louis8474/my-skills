# EXIT_CODES

## Canonical Exit Map

| Exit code | Terminal state(s) | Meaning | Primary error class |
|---:|---|---|---|
| 0 | `T_SUCCESS` | Command completed successfully | success |
| 1 | `T_COMMAND_FAILURE` | Command/runtime validation error | command |
| 2 | `T_PARSE_FAILURE`, `T_NETWORK_FAILURE` | parse failure or fetch network failure | parse/network |
| 3 | `T_STORE_FAILURE` | Store read/write/lock/json error | store |
| 4 | `T_ANALYSIS_FAILURE` | local analysis capability/invocation/response failure | analysis |
| 100 | `T_PANIC` | Panic terminal | panic |

## Resolution Rules

1. Parse failures occur before command dispatch and return exit 2.
2. Runtime command errors return exit 1 unless explicitly classified as network/store/analysis.
   This includes `E_COMMAND_BINARY_FORBIDDEN` when execution attempts to call an external RSS command binary.
3. `fetch` returns exit 2 only when all selected feeds fail network fetch.
4. Partial fetch failure (some feeds succeed) returns exit 0 with per-feed error details in payload.
5. Unexpected runtime panic exits 100 via panic boundary handling.
