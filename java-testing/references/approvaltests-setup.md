# ApprovalTests Setup and Baseline Safety

Use this before Golden Master or ApprovalTests work. Approval tests are powerful in legacy systems because they capture broad current behavior, but unsafe baselines can freeze garbage. Review first; approve second.

## When to Use

Use ApprovalTests for complex textual outputs: HTML, JSON, XML, reports, generated SQL, logs, or serialized DTO snapshots. Prefer normal assertions for small scalar behavior.

## Dependency Setup

Preserve existing build conventions. If dependency versions are managed by Maven `dependencyManagement`, a BOM, Gradle platform, or `libs.versions.toml`, add ApprovalTests through that mechanism.

Maven:

```xml
<dependency>
    <groupId>com.approvaltests</groupId>
    <artifactId>approvaltests</artifactId>
    <version>22.3.3</version>
    <scope>test</scope>
</dependency>
```

Gradle:

```groovy
dependencies {
    testImplementation 'com.approvaltests:approvaltests:22.3.3'
}
```

If the project already uses JUnit 5, keep the JUnit 5 runner/engine setup. If it uses JUnit 4, write JUnit 4 tests unless there is an explicit migration decision.

## Reporters

Reporters control how diffs are shown locally.

- Local development: use a reporter that opens a diff tool when available.
- CI: avoid reporters that require a GUI or interactive approval.
- Team setting: prefer reporters that work consistently across operating systems, or document local alternatives.

Do not make CI depend on an IDE-specific reporter.

## Approved vs Received Files

ApprovalTests commonly creates:

- `*.approved.*`: committed baseline that represents reviewed current behavior.
- `*.received.*`: transient output from the latest failing run.

Commit approved files only after human review. Do not commit received files; add ignore rules for them if the project does not already have them.

Typical ignore rule:

```gitignore
*.received.*
```

## Baseline Review Workflow

1. Generate the received artifact from a focused characterization test.
2. Inspect the full received output, not just the diff summary.
3. Scrub volatile values before approval.
4. Rename or approve only after confirming it represents current behavior worth pinning.
5. Commit the test and approved baseline together.

If the output reveals a bug, document it as current behavior. Do not silently fix the production code while creating the baseline.

## Scrubbers

Use scrubbers before approval whenever output includes volatile or environment-specific data:

- timestamps and dates
- UUIDs and random IDs
- absolute paths
- machine names or usernames
- order-dependent collections when ordering is not part of behavior
- generated ports, durations, or thread IDs

Prefer deterministic production output when possible. Use scrubbers when changing production code would be too risky for the characterization step.

## CI Behavior

CI should fail when received output differs from approved output. That failure is the safety net.

- Ensure approved baselines are available in the repository.
- Ensure received files are available as CI artifacts or logs when practical.
- Do not auto-approve in CI.
- Keep output deterministic enough that CI is not flaky.

## Commit and Ignore Rules

Commit:

- test source files
- reviewed `*.approved.*` baselines
- scrubber/helper code needed by the tests
- ignore rules for transient received files

Do not commit:

- `*.received.*`
- local diff-tool configuration unless it is already a team convention
- broad golden masters that include unrelated system output

## Safety Rule

Golden Master scope should be narrow enough to support the planned change. A huge baseline nobody can review is not a safety net; it's a blindfold.
