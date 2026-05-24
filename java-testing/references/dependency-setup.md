# Dependency Setup for Java Legacy Tests

Use this reference when a project lacks usable test dependencies or the stack is unclear. First preserve what exists; only propose setup changes when characterization tests cannot be written with the current stack.

## Detection Checklist

- Build tool: `pom.xml`, `build.gradle`, `build.gradle.kts`, parent POMs, Gradle convention plugins.
- Java release: compiler source/target, `maven.compiler.release`, Gradle toolchain, CI matrix.
- Test framework: JUnit 4 (`junit:junit`), JUnit 5 (`org.junit.jupiter`), JUnit Platform/Vintage, TestNG.
- Mockito: `mockito-core`, `mockito-junit-jupiter`, `mockito-inline`, existing PowerMock usage.
- Version management: Maven parent/BOM/dependencyManagement or Gradle version catalog/platform.

Treat Java level, JUnit family, and Mockito major version as independent axes. Java 8 can use JUnit 5; Java 17 can still use JUnit 4.

## Compatibility Baselines

| Axis | Baseline guidance |
|---|---|
| Java 8 | Compatible with JUnit 4.13.x, JUnit 5.x, and Mockito 3.x. Avoid Mockito 5. |
| Java 11 | Compatible with JUnit 4.13.x, JUnit 5.x, and Mockito 5.x. |
| Java 17 / 21 | Compatible with JUnit 4.13.x, JUnit 5.x, JUnit 6, and Mockito 5.x. |
| JUnit 4.13.x | Use `@Test`, `@Before`, `@After`, `@RunWith`; add Vintage only when running JUnit 4 tests on JUnit Platform. |
| JUnit 5.x | Use Jupiter API/engine, `@BeforeEach`, `@ExtendWith(MockitoExtension.class)`. |
| JUnit 6 | Requires Java 17+; use only when the project is already Java 17+ or explicitly upgrading. |
| Mockito 3 | Safe default for Java 8; use `mockito-core` plus runner/rule or manual initialization. |
| Mockito 5 | Requires Java 11+; supports modern inline mock maker behavior. |

If a proposed combination violates these baselines, call it out and choose a compatible alternative.

## Maven Guidance

Prefer the project's existing management mechanism:

- If a parent POM or `<dependencyManagement>` controls versions, add dependencies without hardcoded versions when that is the local convention.
- If a BOM is already imported, use its managed coordinates.
- If no management exists, propose explicit versions and explain they are local test-scope additions.

Common test dependencies:

```xml
<!-- JUnit 4 -->
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.13.2</version>
    <scope>test</scope>
</dependency>

<!-- JUnit 5 -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.2</version>
    <scope>test</scope>
</dependency>

<!-- Mockito for JUnit 5 -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.12.0</version>
    <scope>test</scope>
</dependency>
```

For Java 8, use Mockito 3.x instead of Mockito 5.x. For JUnit 6, require Java 17+ and follow the project's JUnit Platform setup.

## Gradle Guidance

Prefer the project's existing Gradle style:

- If `libs.versions.toml` exists, add aliases there instead of inline versions.
- If convention plugins configure test dependencies, update the convention plugin rather than one leaf module when appropriate.
- If a platform/BOM is used, keep versions in the platform.
- Match Groovy vs Kotlin DSL already in use.

Groovy DSL examples:

```groovy
dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.2'
    testImplementation 'org.mockito:mockito-junit-jupiter:5.12.0'
}

test {
    useJUnitPlatform()
}
```

JUnit 4 example:

```groovy
dependencies {
    testImplementation 'junit:junit:4.13.2'
    testImplementation 'org.mockito:mockito-core:3.12.4' // Java 8-safe
}
```

Version catalog example:

```toml
[versions]
junit-jupiter = "5.10.2"
mockito = "5.12.0"

[libraries]
junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit-jupiter" }
mockito-junit-jupiter = { module = "org.mockito:mockito-junit-jupiter", version.ref = "mockito" }
```

## Static and Final Mocking

Static/final mocking is a dependency choice, not only a test-code choice.

- Prefer seams, wrappers, or dependency injection before static mocking.
- Mockito inline mock maker enables final/static mocking in modern Mockito; verify whether the project already uses it.
- Older Java 8/JUnit 4 projects may use PowerMock. Do not introduce PowerMock casually; it increases runner coupling and can block migration.
- If static/final mocking is unavoidable, document why a seam was not feasible and choose versions compatible with the detected Java/JUnit stack.

## Recommendation Format

When proposing dependency changes, state:

1. Detected Java level, build tool, JUnit family, and Mockito major version.
2. Whether versions are managed by parent/BOM/version catalog.
3. Minimal dependencies required for the specific characterization technique.
4. Any compatibility caveat or migration risk.
