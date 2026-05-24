# Java Clean Code Guidance

## Official-source notes

- Oracle Java Code Conventions exist but are archived and last revised in 1999; use them as historical baseline for naming/layout, not as complete modern guidance.
- Dev.java is the modern Java learning source for language features and idioms.

## Naming baseline

| Identifier | Convention |
|---|---|
| Package | lowercase, domain-oriented |
| Class | noun or noun phrase, UpperCamelCase |
| Interface | role/capability name, UpperCamelCase |
| Method | verb or verb phrase, lowerCamelCase |
| Variable | meaningful lowerCamelCase |
| Constant | UPPER_SNAKE_CASE |

## Java readability checklist

- One class should have a clear reason to exist.
- Public methods should read as the class API, not expose internal workflow accidents.
- Local variables should explain intermediate concepts, not repeat obvious operations.
- Prefer guard clauses when they flatten exceptional paths.
- Use records for transparent immutable data carriers when the Java version supports them and behavior is minimal.
- Use comments for constraints, domain rationale, protocol quirks, or non-obvious tradeoffs.
