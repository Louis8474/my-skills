# Java API Boundaries

## Boundary checklist

- Who calls this API?
- Which parts are stable promises?
- Which classes are implementation details?
- Can clients observe or mutate internal state?
- What exceptions are part of the contract?
- Does the API need binary/source compatibility?

## Visibility guidance

| Visibility | Use when |
|---|---|
| `private` | Implementation detail inside a class. |
| package-private | Collaborator inside a package/module boundary. |
| `protected` | Subclass contract is intentional and documented. |
| `public` | External consumers are intended and support is accepted. |

## Module guidance

Java modules strongly encapsulate non-exported packages. Export API packages only. Use qualified exports/opens when reflection or integration needs are real and narrow.

## Compatibility cautions

- Removing public methods/classes is breaking.
- Narrowing visibility is breaking for external consumers.
- Changing exception behavior can be breaking if clients rely on it.
- Returning mutable internals creates long-term compatibility and safety problems.
