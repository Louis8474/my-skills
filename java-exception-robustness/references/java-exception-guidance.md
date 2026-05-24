# Java Exception Robustness Guidance

## Catching rule

Catch when one of these is true:

- you can recover;
- you can add useful context;
- you must translate a boundary error;
- you must cleanup or close resources;
- you are at an orchestration boundary that owns failure policy.

Otherwise, propagate.

## Resource handling

Use try-with-resources for `AutoCloseable` resources. Use `finally` for resources that need paired acquire/release but do not fit try-with-resources, such as explicit locks.

## Checked vs unchecked

- Checked exceptions fit recoverable conditions the caller is expected to handle.
- Unchecked exceptions fit programming errors, violated preconditions, or unrecoverable conditions.

## Boundary policy

At service/event/task boundaries, define whether a failure discards the unit of work, retries, logs and continues, or stops the process. Avoid broad catches in leaf code.
