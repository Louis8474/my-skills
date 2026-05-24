# ERRORS

## Parse Errors (Parser-level)

| Error ID | Trigger | Typical message pattern | Exit |
|---|---|---|---:|
| `E_PARSE_UNKNOWN_COMMAND` | unknown command/subcommand | `unrecognized subcommand` | 2 |
| `E_PARSE_UNEXPECTED_ARG` | unexpected option placement/token | `unexpected argument` | 2 |
| `E_PARSE_MISSING_REQUIRED` | missing positional/subcommand | usage/help with required argument note | 2 |
| `E_PARSE_DUPLICATE_FLAG` | repeated non-repeatable option | `cannot be used multiple times` | 2 |
| `E_PARSE_INVALID_VALUE` | type/value parser failure | parse failure text (e.g. concurrency >= 1) | 2 |

## Runtime Command Errors

| Error ID | Trigger | Command class | Exit |
|---|---|---|---:|
| `E_COMMAND_VALIDATION` | invalid URL/date/filter/shell or not-found domain errors | feed/read/search/export/system | 1 |
| `E_COMMAND_ID_AMBIGUOUS` | ambiguous short/prefix id | feed/article commands | 1 |
| `E_COMMAND_ID_NOT_FOUND` | unresolved feed/article reference | feed/article/fetch/search | 1 |
| `E_COMMAND_BINARY_FORBIDDEN` | attempted execution via external RSS command binary | all in-scope commands | 1 |

## Network Errors

| Error ID | Trigger | Exit |
|---|---|---:|
| `E_NETWORK_FETCH_FAILED` | all selected feeds fail fetch request | 2 |
| `E_NETWORK_REQUEST_FAILED` | request transport error before response | 2 (fetch) or 4 (analysis commands) |

## Store Errors

| Error ID | Trigger | Exit |
|---|---|---:|
| `E_STORE_LOAD` | db read/parse/migration/load error | 3 |
| `E_STORE_SAVE` | write/rename/lock failure | 3 |
| `E_STORE_LOCK_TIMEOUT` | lock unavailable after retries | 3 |

## Local Analysis Errors

| Error ID | Trigger | Exit |
|---|---|---:|
| `E_ANALYSIS_CAPABILITY_UNAVAILABLE` | required local analysis capability is unavailable | 4 |
| `E_ANALYSIS_INVOKE_FAILED` | local analysis invocation failed | 4 |
| `E_ANALYSIS_RESPONSE_PARSE` | unable to parse local analysis response | 4 |

## Panic/Error Boundary

| Error ID | Trigger | Exit |
|---|---|---:|
| `E_PANIC` | unexpected panic through runtime panic boundary | 100 |
