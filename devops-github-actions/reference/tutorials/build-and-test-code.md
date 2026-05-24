# Build And Test Code

---

# Building and testing Go

Learn how to create a continuous integration (CI) workflow to build and test your Go project.

## Introduction

This guide shows you how to build, test, and publish a Go package.

GitHub-hosted runners have a tools cache with preinstalled software, which includes the dependencies for Go. For a full list of up-to-date software and the preinstalled versions of Go, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#preinstalled-software).

## Prerequisites

You should already be familiar with YAML syntax and how it's used with GitHub Actions. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions).

We recommend that you have a basic understanding of the Go language. For more information, see [Getting started with Go](https://golang.org/doc/tutorial/getting-started).

## Using a Go workflow template

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a Go workflow template that should work for most Go projects. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "go".

5. Filter the selection of workflows by clicking **Continuous integration**.

6. On the "Go - by GitHub Actions" workflow, click **Configure**.

   ![Screenshot of the "Choose a workflow" page. The "Configure" button on the "Go" workflow is highlighted with an orange outline.](/assets/images/help/actions/starter-workflow-go.png)

7. Edit the workflow as required. For example, change the version of Go.

8. Click **Commit changes**.

   The `go.yml` workflow file is added to the `.github/workflows` directory of your repository.

## Specifying a Go version

The easiest way to specify a Go version is by using the `setup-go` action provided by GitHub. For more information see, the [`setup-go` action](https://github.com/actions/setup-go/).

To use a preinstalled version of Go on a GitHub-hosted runner, pass the relevant version to the `go-version` property of the `setup-go` action. This action finds a specific version of Go from the tools cache on each runner, and adds the necessary binaries to `PATH`. These changes will persist for the remainder of the job.

The `setup-go` action is the recommended way of using Go with GitHub Actions, because it helps ensure consistent behavior across different runners and different versions of Go. If you are using a self-hosted runner, you must install Go and add it to `PATH`.

### Using multiple versions of Go

```yaml copy
name: Go

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest
    strategy:
      matrix:
        go-version: [ '1.19', '1.20', '1.21.x' ]

    steps:
      - uses: actions/checkout@v5
      - name: Setup Go ${{ matrix.go-version }}
        uses: actions/setup-go@v5
        with:
          go-version: ${{ matrix.go-version }}
      # You can test your matrix by printing the current Go version
      - name: Display Go version
        run: go version
```

### Using a specific Go version

You can configure your job to use a specific version of Go, such as `1.20.8`. Alternatively, you can use semantic version syntax to get the latest minor release. This example uses the latest patch release of Go 1.21:

```yaml copy
      - name: Setup Go 1.21.x
        uses: actions/setup-go@v5
        with:
          # Semantic version range syntax or exact version of Go
          go-version: '1.21.x'
```

## Installing dependencies

You can use `go get` to install dependencies:

```yaml copy
    steps:
      - uses: actions/checkout@v5
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21.x'
      - name: Install dependencies
        run: |
          go get .
          go get example.com/octo-examplemodule
          go get example.com/octo-examplemodule@v1.3.4
```

### Caching dependencies

You can cache and restore dependencies using the [`setup-go` action](https://github.com/actions/setup-go). By default, caching is enabled when using the `setup-go` action.

The `setup-go` action searches for the dependency file, `go.sum`, in the repository root and uses the hash of the dependency file as a part of the cache key.

You can use the `cache-dependency-path` parameter for cases when multiple dependency files are used, or when they are located in different subdirectories.

```yaml copy
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.17'
          cache-dependency-path: subdir/go.sum
```

If you have a custom requirement or need finer controls for caching, you can use the [`cache` action](https://github.com/marketplace/actions/cache). For more information, see [Dependency caching reference](/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).

## Building and testing your code

You can use the same commands that you use locally to build and test your code. This example workflow demonstrates how to use `go build` and `go test` in a job:

```yaml copy
name: Go
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21.x'
      - name: Install dependencies
        run: go get .
      - name: Build
        run: go build -v ./...
      - name: Test with the Go CLI
        run: go test
```

## Packaging workflow data as artifacts

After a workflow completes, you can upload the resulting artifacts for analysis. For example, you may need to save log files, core dumps, test results, or screenshots. The following example demonstrates how you can use the `upload-artifact` action to upload test results.

For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

```yaml copy
name: Upload Go test results

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest
    strategy:
      matrix:
        go-version: [ '1.19', '1.20', '1.21.x' ]

    steps:
      - uses: actions/checkout@v5
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ matrix.go-version }}
      - name: Install dependencies
        run: go get .
      - name: Test with Go
        run: go test -json > TestResults-${{ matrix.go-version }}.json
      - name: Upload Go test results
        uses: actions/upload-artifact@v4
        with:
          name: Go-results-${{ matrix.go-version }}
          path: TestResults-${{ matrix.go-version }}.json
```
---

# Building and testing Java with Ant

Learn how to create a continuous integration (CI) workflow in GitHub Actions to build and test your Java project with Ant.

## Introduction

This guide shows you how to create a workflow that performs continuous integration (CI) for your Java project using the Ant build system. The workflow you create will allow you to see when commits to a pull request cause build or test failures against your default branch; this approach can help ensure that your code is always healthy. You can extend your CI workflow to upload artifacts from a workflow run.

GitHub-hosted runners have a tools cache with pre-installed software, which includes Java Development Kits (JDKs) and Ant. For a list of software and the pre-installed versions for JDK and Ant, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-software).

## Prerequisites

You should be familiar with YAML and the syntax for GitHub Actions. For more information, see:

* [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions)
* [Writing workflows](/en/actions/learn-github-actions)

We recommend that you have a basic understanding of Java and the Ant framework. For more information, see the [Apache Ant Manual](https://ant.apache.org/manual/).

## Using an Ant workflow template

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a workflow template for Ant that should work for most Java with Ant projects. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "Java with Ant".

5. On the "Java with Ant" workflow, click **Configure**.

6. Edit the workflow as required. For example, change the Java version.

7. Click **Commit changes**.

   The `ant.yml` workflow file is added to the `.github/workflows` directory of your repository.

### Specifying the Java version and architecture

The workflow template sets up the `PATH` to contain OpenJDK 8 for the x64 platform. If you want to use a different version of Java, or target a different architecture (`x64` or `x86`), you can use the `setup-java` action to choose a different Java runtime environment.

For example, to use version 11 of the JDK provided by Adoptium for the x64 platform, you can use the `setup-java` action and configure the `java-version`, `distribution` and `architecture` parameters to `'11'`, `'temurin'` and `x64`.

```yaml copy
steps:
  - uses: actions/checkout@v5
  - name: Set up JDK 11 for x64
    uses: actions/setup-java@v4
    with:
      java-version: '11'
      distribution: 'temurin'
      architecture: x64
```

For more information, see the [`setup-java`](https://github.com/actions/setup-java) action.

## Building and testing your code

You can use the same commands that you use locally to build and test your code.

The workflow template will run the default target specified in your `build.xml` file. Your default target will commonly be set to build classes, run tests and package classes into their distributable format, for example, a JAR file.

If you use different commands to build your project, or you want to run a different target, you can specify those. For example, you may want to run the `jar` target that's configured in your `build-ci.xml` file.

```yaml copy
steps:
  - uses: actions/checkout@v5
  - uses: actions/setup-java@v4
    with:
      java-version: '17'
      distribution: 'temurin'
  - name: Run the Ant jar target
    run: ant -noinput -buildfile build-ci.xml jar
```

## Packaging workflow data as artifacts

After your build has succeeded and your tests have passed, you may want to upload the resulting Java packages as a build artifact. This will store the built packages as part of the workflow run, and allow you to download them. Artifacts can help you test and debug pull requests in your local environment before they're merged. For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

Ant will usually create output files like JARs, EARs, or WARs in the `build/jar` directory. You can upload the contents of that directory using the `upload-artifact` action.

```yaml copy
steps:
  - uses: actions/checkout@v5
  - uses: actions/setup-java@v4
    with:
      java-version: '17'
      distribution: 'temurin'

  - run: ant -noinput -buildfile build.xml
  - uses: actions/upload-artifact@v4
    with:
      name: Package
      path: build/jar
```
---

# Building and testing Java with Gradle

Learn how to create a continuous integration (CI) workflow in GitHub Actions to build and test your Java project with Gradle.

## Introduction

This guide shows you how to create a workflow that performs continuous integration (CI) for your Java project using the Gradle build system. The workflow you create will allow you to see when commits to a pull request cause build or test failures against your default branch; this approach can help ensure that your code is always healthy. You can extend your CI workflow to cache files and upload artifacts from a workflow run.

GitHub-hosted runners have a tools cache with pre-installed software, which includes Java Development Kits (JDKs) and Gradle. For a list of software and the pre-installed versions for JDK and Gradle, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-software).

## Prerequisites

You should be familiar with YAML and the syntax for GitHub Actions. For more information, see:

* [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions)
* [Writing workflows](/en/actions/learn-github-actions)

We recommend that you have a basic understanding of Java and the Gradle framework. For more information, see the [Gradle User Manual](https://docs.gradle.org/current/userguide/userguide.html).

## Using a Gradle workflow template

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a workflow template for Gradle that should work for most Java with Gradle projects. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "Java with Gradle".

5. On the "Java with Gradle" workflow, click **Configure**.
   This workflow performs the following steps:

6. Checks out a copy of project's repository.

7. Sets up the Java JDK.

8. Sets up the Gradle environment. The [`gradle/actions/setup-gradle`](https://github.com/gradle/actions) action takes care of caching state between workflow runs, and provides a detailed summary of all Gradle executions.

9. The "Build with Gradle" step executes the `build` task using the [Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html).

10. Edit the workflow as required. For example, change the Java version.

    > \[!NOTE]
    >
    > * This workflow template contains an action that is not certified by GitHub. Actions provided by third parties are governed by separate terms of service, privacy policy, and support documentation.
    > * If you use actions from third parties you should use a version specified by a commit SHA. If the action is revised and you want to use the newer version, you will need to update the SHA. You can specify a version by referencing a tag or a branch, however the action may change without warning. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions).

11. Click **Commit changes**.

    The `gradle.yml` workflow file is added to the `.github/workflows` directory of your repository.

### Specifying the Java version and architecture

The workflow template sets up the `PATH` to contain OpenJDK 8 for the x64 platform. If you want to use a different version of Java, or target a different architecture (`x64` or `x86`), you can use the `setup-java` action to choose a different Java runtime environment.

For example, to use version 11 of the JDK provided by Adoptium for the x64 platform, you can use the `setup-java` action and configure the `java-version`, `distribution` and `architecture` parameters to `'11'`, `'temurin'` and `x64`.

```yaml copy
steps:
  - uses: actions/checkout@v5
  - name: Set up JDK 11 for x64
    uses: actions/setup-java@v4
    with:
      java-version: '11'
      distribution: 'temurin'
      architecture: x64
```

For more information, see the [`setup-java`](https://github.com/actions/setup-java) action.

## Building and testing your code

You can use the same commands that you use locally to build and test your code.

The workflow template will run the `build` task by default. In the default Gradle configuration, this command will download dependencies, build classes, run tests, and package classes into their distributable format, for example, a JAR file.

If you use different commands to build your project, or you want to use a different task, you can specify those. For example, you may want to run the `package` task that's configured in your `ci.gradle` file.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
steps:
  - uses: actions/checkout@v5
  - uses: actions/setup-java@v4
    with:
      java-version: '17'
      distribution: 'temurin'

  - name: Setup Gradle
    uses: gradle/actions/setup-gradle@017a9effdb900e5b5b2fddfb590a105619dca3c3 # v4.4.2

  - name: Build with Gradle
    run: ./gradlew -b ci.gradle package
```

## Caching dependencies

Your build dependencies can be cached to speed up your workflow runs. After a successful run, `gradle/actions/setup-gradle` caches important parts of the Gradle user home directory. In future jobs, the cache will be restored so that build scripts won't need to be recompiled and dependencies won't need to be downloaded from remote package repositories.

Caching is enabled by default when using the `gradle/actions/setup-gradle` action. For more information, see [`gradle/actions/setup-gradle`](https://github.com/gradle/actions/blob/main/setup-gradle/README.md#caching-build-state-between-jobs).

## Packaging workflow data as artifacts

After your build has succeeded and your tests have passed, you may want to upload the resulting Java packages as a build artifact. This will store the built packages as part of the workflow run, and allow you to download them. Artifacts can help you test and debug pull requests in your local environment before they're merged. For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

Gradle will usually create output files like JARs, EARs, or WARs in the `build/libs` directory. You can upload the contents of that directory using the `upload-artifact` action.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
steps:
  - uses: actions/checkout@v5
  - uses: actions/setup-java@v4
    with:
      java-version: '17'
      distribution: 'temurin'

  - name: Setup Gradle
    uses: gradle/actions/setup-gradle@017a9effdb900e5b5b2fddfb590a105619dca3c3 # v4.4.2

  - name: Build with Gradle
    run: ./gradlew build

  - name: Upload build artifacts
    uses: actions/upload-artifact@v4
    with:
      name: Package
      path: build/libs
```
---

# Building and testing Java with Maven

Learn how to create a continuous integration (CI) workflow in GitHub Actions to build and test your Java project with Maven.

## Introduction

This guide shows you how to create a workflow that performs continuous integration (CI) for your Java project using the Maven software project management tool. The workflow you create will allow you to see when commits to a pull request cause build or test failures against your default branch; this approach can help ensure that your code is always healthy. You can extend your CI workflow to cache files and upload artifacts from a workflow run.

GitHub-hosted runners have a tools cache with pre-installed software, which includes Java Development Kits (JDKs) and Maven. For a list of software and the pre-installed versions for JDK and Maven, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-software).

## Prerequisites

You should be familiar with YAML and the syntax for GitHub Actions. For more information, see:

* [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions)
* [Writing workflows](/en/actions/learn-github-actions)

We recommend that you have a basic understanding of Java and the Maven framework. For more information, see the [Maven Getting Started Guide](https://maven.apache.org/guides/getting-started/index.html) in the Maven documentation.

## Using a Maven workflow template

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a workflow template for Maven that should work for most Java with Maven projects. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "Java with Maven".

5. On the "Java with Maven" workflow, click **Configure**.

6. Edit the workflow as required. For example, change the Java version.

7. Click **Commit changes**.

   The `maven.yml` workflow file is added to the `.github/workflows` directory of your repository.

### Specifying the Java version and architecture

The workflow template sets up the `PATH` to contain OpenJDK 8 for the x64 platform. If you want to use a different version of Java, or target a different architecture (`x64` or `x86`), you can use the `setup-java` action to choose a different Java runtime environment.

For example, to use version 11 of the JDK provided by Adoptium for the x64 platform, you can use the `setup-java` action and configure the `java-version`, `distribution` and `architecture` parameters to `'11'`, `'temurin'` and `x64`.

```yaml copy
steps:
  - uses: actions/checkout@v5
  - name: Set up JDK 11 for x64
    uses: actions/setup-java@v4
    with:
      java-version: '11'
      distribution: 'temurin'
      architecture: x64
```

For more information, see the [`setup-java`](https://github.com/actions/setup-java) action.

## Building and testing your code

You can use the same commands that you use locally to build and test your code.

The workflow template will run the `package` target by default. In the default Maven configuration, this command will download dependencies, build classes, run tests, and package classes into their distributable format, for example, a JAR file.

If you use different commands to build your project, or you want to use a different target, you can specify those. For example, you may want to run the `verify` target that's configured in a `pom-ci.xml` file.

```yaml copy
steps:
  - uses: actions/checkout@v5
  - uses: actions/setup-java@v4
    with:
      java-version: '17'
      distribution: 'temurin'
  - name: Run the Maven verify phase
    run: mvn --batch-mode --update-snapshots verify
```

## Caching dependencies

You can cache your dependencies to speed up your workflow runs. After a successful run, your local Maven repository will be stored in a cache. In future workflow runs, the cache will be restored so that dependencies don't need to be downloaded from remote Maven repositories. You can cache dependencies simply using the [`setup-java` action](https://github.com/marketplace/actions/setup-java-jdk) or can use [`cache` action](https://github.com/actions/cache) for custom and more advanced configuration.

```yaml copy
steps:
  - uses: actions/checkout@v5
  - name: Set up JDK 17
    uses: actions/setup-java@v4
    with:
      java-version: '17'
      distribution: 'temurin'
      cache: maven
  - name: Build with Maven
    run: mvn --batch-mode --update-snapshots verify
```

This workflow will save the contents of your local Maven repository, located in the `.m2` directory of the runner's home directory. The cache key will be the hashed contents of `pom.xml`, so changes to `pom.xml` will invalidate the cache.

## Packaging workflow data as artifacts

After your build has succeeded and your tests have passed, you may want to upload the resulting Java packages as a build artifact. This will store the built packages as part of the workflow run, and allow you to download them. Artifacts can help you test and debug pull requests in your local environment before they're merged. For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

Maven will usually create output files like JARs, EARs, or WARs in the `target` directory. To upload those as artifacts, you can copy them into a new directory that contains artifacts to upload. For example, you can create a directory called `staging`. Then you can upload the contents of that directory using the `upload-artifact` action.

```yaml copy
steps:
  - uses: actions/checkout@v5
  - uses: actions/setup-java@v4
    with:
      java-version: '17'
      distribution: 'temurin'
  - run: mvn --batch-mode --update-snapshots verify
  - run: mkdir staging && cp target/*.jar staging
  - uses: actions/upload-artifact@v4
    with:
      name: Package
      path: staging
```
---

# Building and testing .NET

Learn how to create a continuous integration (CI) workflow to build and test your .NET project.

## Introduction

This guide shows you how to build, test, and publish a .NET package.

GitHub-hosted runners have a tools cache with preinstalled software, which includes the .NET Core SDK. For a full list of up-to-date software and the preinstalled versions of .NET Core SDK, see [software installed on GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners).

## Prerequisites

You should already be familiar with YAML syntax and how it's used with GitHub Actions. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions).

We recommend that you have a basic understanding of the .NET Core SDK. For more information, see [Getting started with .NET](https://dotnet.microsoft.com/learn).

## Using a .NET workflow template

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a workflow template for .NET that should work for most .NET projects. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "dotnet".

5. On the ".NET" workflow, click **Configure**.

6. Edit the workflow as required. For example, change the .NET version.

7. Click **Commit changes**.

   The `dotnet.yml` workflow file is added to the `.github/workflows` directory of your repository.

## Specifying a .NET version

To use a preinstalled version of the .NET Core SDK on a GitHub-hosted runner, use the `setup-dotnet` action. This action finds a specific version of .NET from the tools cache on each runner, and adds the necessary binaries to `PATH`. These changes will persist for the remainder of the job.

The `setup-dotnet` action is the recommended way of using .NET with GitHub Actions, because it ensures consistent behavior across different runners and different versions of .NET. If you are using a self-hosted runner, you must install .NET and add it to `PATH`. For more information, see the [`setup-dotnet`](https://github.com/marketplace/actions/setup-net-core-sdk) action.

### Using multiple .NET versions

```yaml
name: dotnet package

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest
    strategy:
      matrix:
        dotnet-version: [ '3.1.x', '6.0.x' ]

    steps:
      - uses: actions/checkout@v5
      - name: Setup dotnet ${{ matrix.dotnet-version }}
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ matrix.dotnet-version }}
      # You can test your matrix by printing the current dotnet version
      - name: Display dotnet version
        run: dotnet --version
```

### Using a specific .NET version

You can configure your job to use a specific version of .NET, such as `6.0.22`. Alternatively, you can use semantic version syntax to get the latest minor release. This example uses the latest minor release of .NET 6.

```yaml
    - name: Setup .NET 6.x
      uses: actions/setup-dotnet@v4
      with:
        # Semantic version range syntax or exact version of a dotnet version
        dotnet-version: '6.x'
```

## Installing dependencies

GitHub-hosted runners have the NuGet package manager installed. You can use the dotnet CLI to install dependencies from the NuGet package registry before building and testing your code. For example, the YAML below installs the `Newtonsoft` package.

```yaml
steps:
- uses: actions/checkout@v5
- name: Setup dotnet
  uses: actions/setup-dotnet@v4
  with:
    dotnet-version: '6.0.x'
- name: Install dependencies
  run: dotnet add package Newtonsoft.Json --version 12.0.1
```

### Caching dependencies

You can cache NuGet dependencies for future workflows using the optional `cache` input. For example, the YAML below caches the NuGet `global-packages` folder, and then installs the `Newtonsoft` package. A second optional input, `cache-dependency-path`, can be used to specify the path to a dependency file: `packages.lock.json`.

For more information, see [Dependency caching reference](/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).

```yaml
steps:
- uses: actions/checkout@v5
- name: Setup dotnet
  uses: actions/setup-dotnet@v4
  with:
    dotnet-version: '6.x'
    cache: true
- name: Install dependencies
  run: dotnet add package Newtonsoft.Json --version 12.0.1
```

> \[!NOTE]
> Depending on the number of dependencies, it may be faster to use the dependency cache. Projects with many large dependencies should see a performance increase as it cuts down the time required for downloading. Projects with fewer dependencies may not see a significant performance increase and may even see a slight decrease due to how NuGet installs cached dependencies. The performance varies from project to project.

## Building and testing your code

You can use the same commands that you use locally to build and test your code. This example demonstrates how to use `dotnet build` and `dotnet test` in a job:

```yaml
steps:
- uses: actions/checkout@v5
- name: Setup dotnet
  uses: actions/setup-dotnet@v4
  with:
    dotnet-version: '6.0.x'
- name: Install dependencies
  run: dotnet restore
- name: Build
  run: dotnet build --no-restore
- name: Test with the dotnet CLI
  run: dotnet test --no-build
```

## Packaging workflow data as artifacts

After a workflow completes, you can upload the resulting artifacts for analysis. For example, you may need to save log files, core dumps, test results, or screenshots. The following example demonstrates how you can use the `upload-artifact` action to upload test results.

For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

```yaml
name: dotnet package

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest
    strategy:
      matrix:
        dotnet-version: [ '3.1.x', '6.0.x' ]

      steps:
        - uses: actions/checkout@v5
        - name: Setup dotnet
          uses: actions/setup-dotnet@v4
          with:
            dotnet-version: ${{ matrix.dotnet-version }}
        - name: Install dependencies
          run: dotnet restore
        - name: Test with dotnet
          run: dotnet test --no-restore --logger trx --results-directory "TestResults-${{ matrix.dotnet-version }}"
        - name: Upload dotnet test results
          uses: actions/upload-artifact@v4
          with:
            name: dotnet-results-${{ matrix.dotnet-version }}
            path: TestResults-${{ matrix.dotnet-version }}
          # Use always() to always run this step to publish test results when there are test failures
          if: ${{ always() }}
```

## Publishing to package registries

You can configure your workflow to publish your .NET package to a package registry when your CI tests pass. You can use repository secrets to store any tokens or credentials needed to publish your binary. The following example creates and publishes a package to GitHub Packages using `dotnet core cli`.

```yaml
name: Upload dotnet package

on:
  release:
    types: [created]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      packages: write
      contents: read
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '6.0.x' # SDK Version to use.
          source-url: https://nuget.pkg.github.com/<owner>/index.json
        env:
          NUGET_AUTH_TOKEN: ${{secrets.GITHUB_TOKEN}}
      - run: dotnet build --configuration Release <my project>
      - name: Create the package
        run: dotnet pack --configuration Release <my project>
      - name: Publish the package to GPR
        run: dotnet nuget push <my project>/bin/Release/*.nupkg
```
---

# Building and testing Node.js

Learn how to create a continuous integration (CI) workflow to build and test your Node.js project.

## Introduction

This guide shows you how to create a continuous integration (CI) workflow that builds and tests Node.js code. If your CI tests pass, you may want to deploy your code or publish a package.

## Prerequisites

We recommend that you have a basic understanding of Node.js, YAML, workflow configuration options, and how to create a workflow file. For more information, see:

* [Writing workflows](/en/actions/learn-github-actions)
* [Getting started with Node.js](https://nodejs.org/en/docs/guides/getting-started-guide/)

## Using a Node.js workflow template

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a workflow template for Node.js that should work for most Node.js projects. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "Node.js".

5. Filter the selection of workflows by clicking **Continuous integration**.

6. On the "Node.js" workflow, click **Configure**.

7. Edit the workflow as required. For example, change the Node versions you want to use.

8. Click **Commit changes**.

   The `node.js.yml` workflow file is added to the `.github/workflows` directory of your repository.

## Specifying the Node.js version

The easiest way to specify a Node.js version is by using the `setup-node` action provided by GitHub. For more information see, [`setup-node`](https://github.com/actions/setup-node/).

The `setup-node` action takes a Node.js version as an input and configures that version on the runner. The `setup-node` action finds a specific version of Node.js from the tools cache on each runner and adds the necessary binaries to `PATH`, which persists for the rest of the job. Using the `setup-node` action is the recommended way of using Node.js with GitHub Actions because it ensures consistent behavior across different runners and different versions of Node.js. If you are using a self-hosted runner, you must install Node.js and add it to `PATH`.

The workflow template includes a matrix strategy that builds and tests your code with the Node.js versions listed in `node-version`. The 'x' in the version number is a wildcard character that matches the latest minor and patch release available for a version. Each version of Node.js specified in the `node-version` array creates a job that runs the same steps.

Each job can access the value defined in the matrix `node-version` array using the `matrix` context. The `setup-node` action uses the context as the `node-version` input. The `setup-node` action configures each job with a different Node.js version before building and testing code. For more information about matrix strategies and contexts, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix) and [Contexts reference](/en/actions/learn-github-actions/contexts).

```yaml copy
strategy:
  matrix:
    node-version: ['18.x', '20.x']

steps:
- uses: actions/checkout@v5
- name: Use Node.js ${{ matrix.node-version }}
  uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node-version }}
```

Alternatively, you can build and test with exact Node.js versions.

```yaml copy
strategy:
  matrix:
    node-version: ['10.17.0', '17.9.0']
```

Or, you can build and test using a single version of Node.js too.

```yaml copy
name: Node.js CI

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - run: npm run build --if-present
      - run: npm test
```

If you don't specify a Node.js version, GitHub uses the environment's default Node.js version.
For more information, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-software).

## Installing dependencies

GitHub-hosted runners have npm and Yarn dependency managers installed. You can use npm and Yarn to install dependencies in your workflow before building and testing your code. The Windows and Linux GitHub-hosted runners also have Grunt, Gulp, and Bower installed.

You can also cache dependencies to speed up your workflow. For more information, see [Dependency caching reference](/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).

### Example using npm

This example installs the versions in the `package-lock.json` or `npm-shrinkwrap.json` file and prevents updates to the lock file. Using `npm ci` is generally faster than running `npm install`. For more information, see [`npm ci`](https://docs.npmjs.com/cli/ci.html) and [Introducing `npm ci` for faster, more reliable builds](https://blog.npmjs.org/post/171556855892/introducing-npm-ci-for-faster-more-reliable).

```yaml copy
steps:
- uses: actions/checkout@v5
- name: Use Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
- name: Install dependencies
  run: npm ci
```

Using `npm install` installs the dependencies defined in the `package.json` file. For more information, see [`npm install`](https://docs.npmjs.com/cli/install).

```yaml copy
steps:
- uses: actions/checkout@v5
- name: Use Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
- name: Install dependencies
  run: npm install
```

### Example using Yarn

This example installs the dependencies defined in the `yarn.lock` file and prevents updates to the `yarn.lock` file. For more information, see [`yarn install`](https://yarnpkg.com/en/docs/cli/install).

```yaml copy
steps:
- uses: actions/checkout@v5
- name: Use Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
- name: Install dependencies
  run: yarn --frozen-lockfile
```

Alternatively, you can install the dependencies defined in the `package.json` file.

```yaml copy
steps:
- uses: actions/checkout@v5
- name: Use Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
- name: Install dependencies
  run: yarn
```

### Example using a private registry and creating the .npmrc file

You can use the `setup-node` action to create a local `.npmrc` file on the runner that configures the default registry and scope. The `setup-node` action also accepts an authentication token as input, used to access private registries or publish node packages. For more information, see [`setup-node`](https://github.com/actions/setup-node/).

To authenticate to your private registry, you'll need to store your npm authentication token as a secret. For example, create a repository secret called `NPM_TOKEN`. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

In the example below, the secret `NPM_TOKEN` stores the npm authentication token. The `setup-node` action configures the `.npmrc` file to read the npm authentication token from the `NODE_AUTH_TOKEN` environment variable. When using the `setup-node` action to create an `.npmrc` file, you must set the `NODE_AUTH_TOKEN` environment variable with the secret that contains your npm authentication token.

Before installing dependencies, use the `setup-node` action to create the `.npmrc` file. The action has two input parameters. The `node-version` parameter sets the Node.js version, and the `registry-url` parameter sets the default registry. If your package registry uses scopes, you must use the `scope` parameter. For more information, see [`npm-scope`](https://docs.npmjs.com/misc/scope).

```yaml copy
steps:
- uses: actions/checkout@v5
- name: Use Node.js
  uses: actions/setup-node@v4
  with:
    always-auth: true
    node-version: '20.x'
    registry-url: https://registry.npmjs.org
    scope: '@octocat'
- name: Install dependencies
  run: npm ci
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

The example above creates an `.npmrc` file with the following contents:

```shell
//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
@octocat:registry=https://registry.npmjs.org/
always-auth=true
```

### Example caching dependencies

You can cache and restore the dependencies using the [`setup-node` action](https://github.com/actions/setup-node).

The following example caches dependencies for npm.

```yaml copy
steps:
- uses: actions/checkout@v5
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
- run: npm install
- run: npm test
```

The following example caches dependencies for Yarn.

```yaml copy
steps:
- uses: actions/checkout@v5
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'yarn'
- run: yarn
- run: yarn test
```

The following example caches dependencies for pnpm (v6.10+).

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# NOTE: pnpm caching support requires pnpm version >= 6.10.0

steps:
- uses: actions/checkout@v5
- uses: pnpm/action-setup@0609f0983b7a228f052f81ef4c3d6510cae254ad
  with:
    version: 6.10.0
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'
- run: pnpm install
- run: pnpm test
```

If you have a custom requirement or need finer controls for caching, you can use the [`cache` action](https://github.com/marketplace/actions/cache). For more information, see [Dependency caching reference](/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).

## Building and testing your code

You can use the same commands that you use locally to build and test your code. For example, if you run `npm run build` to run build steps defined in your `package.json` file and `npm test` to run your test suite, you would add those commands in your workflow file.

```yaml copy
steps:
- uses: actions/checkout@v5
- name: Use Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
- run: npm install
- run: npm run build --if-present
- run: npm test
```

## Packaging workflow data as artifacts

You can save artifacts from your build and test steps to view after a job completes. For example, you may need to save log files, core dumps, test results, or screenshots. For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

## Publishing to package registries

You can configure your workflow to publish your Node.js package to a package registry after your CI tests pass. For more information about publishing to npm and GitHub Packages, see [Publishing Node.js packages](/en/actions/publishing-packages/publishing-nodejs-packages).
---

# Building and testing PowerShell

Learn how to create a continuous integration (CI) workflow to build and test your PowerShell project.

## Introduction

This guide shows you how to use PowerShell for CI. It describes how to use Pester, install dependencies, test your module, and publish to the PowerShell Gallery.

GitHub-hosted runners have a tools cache with pre-installed software, which includes PowerShell and Pester.

For a full list of up-to-date software and the pre-installed versions of PowerShell and Pester, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-software).

## Prerequisites

You should be familiar with YAML and the syntax for GitHub Actions. For more information, see [Writing workflows](/en/actions/learn-github-actions).

We recommend that you have a basic understanding of PowerShell and Pester. For more information, see:

* [Getting started with PowerShell](https://docs.microsoft.com/powershell/scripting/learn/ps101/01-getting-started)
* [Pester](https://pester.dev)

## Adding a workflow for Pester

To automate your testing with PowerShell and Pester, you can add a workflow that runs every time a change is pushed to your repository. In the following example, `Test-Path` is used to check that a file called `resultsfile.log` is present.

This example workflow file must be added to your repository's `.github/workflows/` directory:

```yaml
name: Test PowerShell on Ubuntu
on: push

jobs:
  pester-test:
    name: Pester test
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository code
        uses: actions/checkout@v5
      - name: Perform a Pester test from the command-line
        shell: pwsh
        run: Test-Path resultsfile.log | Should -Be $true
      - name: Perform a Pester test from the Tests.ps1 file
        shell: pwsh
        run: |
          Invoke-Pester Unit.Tests.ps1 -Passthru
```

* `shell: pwsh` - Configures the job to use PowerShell when running the `run` commands.

* `run: Test-Path resultsfile.log` - Check whether a file called `resultsfile.log` is present in the repository's root directory.

* `Should -Be $true` - Uses Pester to define an expected result. If the result is unexpected, then GitHub Actions flags this as a failed test. For example:

  ![Screenshot of a workflow run failure for a Pester test. Test reports "Expected $true, but got $false" and "Error: Process completed with exit code 1."](/assets/images/help/repository/actions-failed-pester-test-updated.png)

* `Invoke-Pester Unit.Tests.ps1 -Passthru` - Uses Pester to execute tests defined in a file called `Unit.Tests.ps1`. For example, to perform the same test described above, the `Unit.Tests.ps1` will contain the following:

  ```powershell
  Describe "Check results file is present" {
      It "Check results file is present" {
          Test-Path resultsfile.log | Should -Be $true
      }
  }
  ```

## PowerShell module locations

The table below describes the locations for various PowerShell modules in each GitHub-hosted runner.

<div class="ghd-tool rowheaders">

|                               | Ubuntu                                           | macOS                                             | Windows                                               |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------- |
| **PowerShell system modules** | `/opt/microsoft/powershell/7/Modules/*`          | `/usr/local/microsoft/powershell/7/Modules/*`     | `C:\program files\powershell\7\Modules\*`             |
| **PowerShell add-on modules** | `/usr/local/share/powershell/Modules/*`          | `/usr/local/share/powershell/Modules/*`           | `C:\Modules\*`                                        |
| **User-installed modules**    | `/home/runner/.local/share/powershell/Modules/*` | `/Users/runner/.local/share/powershell/Modules/*` | `C:\Users\runneradmin\Documents\PowerShell\Modules\*` |

</div>

> \[!NOTE]
> On Ubuntu runners, Azure PowerShell modules are stored in `/usr/share/` instead of the default location of PowerShell add-on modules (i.e. `/usr/local/share/powershell/Modules/`).

## Installing dependencies

GitHub-hosted runners have PowerShell 7 and Pester installed. You can use `Install-Module` to install additional dependencies from the PowerShell Gallery before building and testing your code.

> \[!NOTE]
> The pre-installed packages (such as Pester) used by GitHub-hosted runners are regularly updated, and can introduce significant changes. As a result, it is recommended that you always specify the required package versions by using `Install-Module` with `-MaximumVersion`.

You can also cache dependencies to speed up your workflow. For more information, see [Dependency caching reference](/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).

For example, the following job installs the `SqlServer` and `PSScriptAnalyzer` modules:

```yaml
jobs:
  install-dependencies:
    name: Install dependencies
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Install from PSGallery
        shell: pwsh
        run: |
          Set-PSRepository PSGallery -InstallationPolicy Trusted
          Install-Module SqlServer, PSScriptAnalyzer
```

> \[!NOTE]
> By default, no repositories are trusted by PowerShell. When installing modules from the PowerShell Gallery, you must explicitly set the installation policy for `PSGallery` to `Trusted`.

### Caching dependencies

You can cache PowerShell dependencies using a unique key, which allows you to restore the dependencies for future workflows with the [`cache`](https://github.com/marketplace/actions/cache) action. For more information, see [Dependency caching reference](/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).

PowerShell caches its dependencies in different locations, depending on the runner's operating system. For example, the `path` location used in the following Ubuntu example will be different for a Windows operating system.

```yaml
steps:
  - uses: actions/checkout@v5
  - name: Setup PowerShell module cache
    id: cacher
    uses: actions/cache@v4
    with:
      path: "~/.local/share/powershell/Modules"
      key: ${{ runner.os }}-SqlServer-PSScriptAnalyzer
  - name: Install required PowerShell modules
    if: steps.cacher.outputs.cache-hit != 'true'
    shell: pwsh
    run: |
      Set-PSRepository PSGallery -InstallationPolicy Trusted
      Install-Module SqlServer, PSScriptAnalyzer -ErrorAction Stop
```

## Testing your code

You can use the same commands that you use locally to build and test your code.

### Using PSScriptAnalyzer to lint code

The following example installs `PSScriptAnalyzer` and uses it to lint all `ps1` files in the repository. For more information, see [PSScriptAnalyzer on GitHub](https://github.com/PowerShell/PSScriptAnalyzer).

```yaml
  lint-with-PSScriptAnalyzer:
    name: Install and run PSScriptAnalyzer
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Install PSScriptAnalyzer module
        shell: pwsh
        run: |
          Set-PSRepository PSGallery -InstallationPolicy Trusted
          Install-Module PSScriptAnalyzer -ErrorAction Stop
      - name: Lint with PSScriptAnalyzer
        shell: pwsh
        run: |
          Invoke-ScriptAnalyzer -Path *.ps1 -Recurse -Outvariable issues
          $errors   = $issues.Where({$_.Severity -eq 'Error'})
          $warnings = $issues.Where({$_.Severity -eq 'Warning'})
          if ($errors) {
              Write-Error "There were $($errors.Count) errors and $($warnings.Count) warnings total." -ErrorAction Stop
          } else {
              Write-Output "There were $($errors.Count) errors and $($warnings.Count) warnings total."
          }
```

## Packaging workflow data as artifacts

You can upload artifacts to view after a workflow completes. For example, you may need to save log files, core dumps, test results, or screenshots. For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

The following example demonstrates how you can use the `upload-artifact` action to archive the test results received from `Invoke-Pester`. For more information, see the [`upload-artifact` action](https://github.com/actions/upload-artifact).

```yaml
name: Upload artifact from Ubuntu

on: [push]

jobs:
  upload-pester-results:
    name: Run Pester and upload results
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Test with Pester
        shell: pwsh
        run: Invoke-Pester Unit.Tests.ps1 -Passthru | Export-CliXml -Path Unit.Tests.xml
      - name: Upload test results
        uses: actions/upload-artifact@v4
        with:
          name: ubuntu-Unit-Tests
          path: Unit.Tests.xml
    if: ${{ always() }}
```

The `always()` function configures the job to continue processing even if there are test failures. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts#always).

## Publishing to PowerShell Gallery

You can configure your workflow to publish your PowerShell module to the PowerShell Gallery when your CI tests pass. You can use secrets to store any tokens or credentials needed to publish your package. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

The following example creates a package and uses `Publish-Module` to publish it to the PowerShell Gallery:

```yaml
name: Publish PowerShell Module

on:
  release:
    types: [created]

jobs:
  publish-to-gallery:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Build and publish
        env:
          NUGET_KEY: ${{ secrets.NUGET_KEY }}
        shell: pwsh
        run: |
          ./build.ps1 -Path /tmp/samplemodule
          Publish-Module -Path /tmp/samplemodule -NuGetApiKey $env:NUGET_KEY -Verbose
```
---

# Building and testing Python

Learn how to create a continuous integration (CI) workflow to build and test your Python project.

## Introduction

This guide shows you how to build, test, and publish a Python package.

GitHub-hosted runners have a tools cache with pre-installed software, which includes Python and PyPy. You don't have to install anything! For a full list of up-to-date software and the pre-installed versions of Python and PyPy, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-software).

## Prerequisites

You should be familiar with YAML and the syntax for GitHub Actions. For more information, see [Writing workflows](/en/actions/learn-github-actions).

We recommend that you have a basic understanding of Python, and pip. For more information, see:

* [Getting started with Python](https://www.python.org/about/gettingstarted/)
* [Pip package manager](https://pypi.org/project/pip/)

## Using a Python workflow template

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a workflow template for Python that should work if your repository already contains at least one `.py` file. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "Python application".

5. On the "Python application" workflow, click **Configure**.

6. Edit the workflow as required. For example, change the Python version.

7. Click **Commit changes**.

   The `python-app.yml` workflow file is added to the `.github/workflows` directory of your repository.

## Specifying a Python version

To use a pre-installed version of Python or PyPy on a GitHub-hosted runner, use the `setup-python` action. This action finds a specific version of Python or PyPy from the tools cache on each runner and adds the necessary binaries to `PATH`, which persists for the rest of the job. If a specific version of Python is not pre-installed in the tools cache, the `setup-python` action will download and set up the appropriate version from the [`python-versions`](https://github.com/actions/python-versions) repository.

Using the `setup-python` action is the recommended way of using Python with GitHub Actions because it ensures consistent behavior across different runners and different versions of Python. If you are using a self-hosted runner, you must install Python and add it to `PATH`. For more information, see the [`setup-python` action](https://github.com/marketplace/actions/setup-python).

The table below describes the locations for the tools cache in each GitHub-hosted runner.

<div class="ghd-tool rowheaders">

|                          | Ubuntu                          | Mac                                      | Windows                               |
| ------------------------ | ------------------------------- | ---------------------------------------- | ------------------------------------- |
| **Tool Cache Directory** | `/opt/hostedtoolcache/*`        | `/Users/runner/hostedtoolcache/*`        | `C:\hostedtoolcache\windows\*`        |
| **Python Tool Cache**    | `/opt/hostedtoolcache/Python/*` | `/Users/runner/hostedtoolcache/Python/*` | `C:\hostedtoolcache\windows\Python\*` |
| **PyPy Tool Cache**      | `/opt/hostedtoolcache/PyPy/*`   | `/Users/runner/hostedtoolcache/PyPy/*`   | `C:\hostedtoolcache\windows\PyPy\*`   |

</div>

If you are using a self-hosted runner, you can configure the runner to use the `setup-python` action to manage your dependencies. For more information, see [using setup-python with a self-hosted runner](https://github.com/actions/setup-python#using-setup-python-with-a-self-hosted-runner) in the `setup-python` README.

GitHub supports semantic versioning syntax. For more information, see [Using semantic versioning](https://docs.npmjs.com/about-semantic-versioning#using-semantic-versioning-to-specify-update-types-your-package-can-accept) and the [Semantic versioning specification](https://semver.org/).

### Using multiple Python versions

The following example uses a matrix for the job to set up multiple Python versions. For more information, see [Running variations of jobs in a workflow](/en/actions/using-jobs/using-a-matrix-for-your-jobs).

```yaml copy
name: Python package

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["pypy3.10", "3.9", "3.10", "3.11", "3.12", "3.13"]

    steps:
      - uses: actions/checkout@v5
      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      # You can test your matrix by printing the current Python version
      - name: Display Python version
        run: python -c "import sys; print(sys.version)"
```

### Using a specific Python version

You can configure a specific version of Python. For example, 3.12. Alternatively, you can use semantic version syntax to get the latest minor release. This example uses the latest minor release of Python 3.

```yaml copy
name: Python package

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5
      - name: Set up Python
        # This is the version of the action for setting up Python, not the Python version.
        uses: actions/setup-python@v5
        with:
          # Semantic version range syntax or exact version of a Python version
          python-version: '3.x'
          # Optional - x64 or x86 architecture, defaults to x64
          architecture: 'x64'
      # You can test your matrix by printing the current Python version
      - name: Display Python version
        run: python -c "import sys; print(sys.version)"
```

### Excluding a version

If you specify a version of Python that is not available, `setup-python` fails with an error such as: `##[error]Version 3.7 with arch x64 not found`. The error message includes the available versions.

You can also use the `exclude` keyword in your workflow if there is a configuration of Python that you do not wish to run. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategy).

```yaml copy
name: Python package

on: [push]

jobs:
  build:

    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        python-version: ["3.9", "3.11", "3.13", "pypy3.10"]
        exclude:
          - os: macos-latest
            python-version: "3.11"
          - os: windows-latest
            python-version: "3.11"
```

### Using the default Python version

We recommend using `setup-python` to configure the version of Python used in your workflows because it helps make your dependencies explicit. If you don't use `setup-python`, the default version of Python set in `PATH` is used in any shell when you call `python`. The default version of Python varies between GitHub-hosted runners, which may cause unexpected changes or use an older version than expected.

| GitHub-hosted runner | Description                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ubuntu               | Ubuntu runners have multiple versions of system Python installed under `/usr/bin/python` and `/usr/bin/python3`. The Python versions that come packaged with Ubuntu are in addition to the versions that GitHub installs in the tools cache.                                                                                    |
| Windows              | Excluding the versions of Python that are in the tools cache, Windows does not ship with an equivalent version of system Python. To maintain consistent behavior with other runners and to allow Python to be used out-of-the-box without the `setup-python` action, GitHub adds a few versions from the tools cache to `PATH`. |
| macOS                | The macOS runners have more than one version of system Python installed, in addition to the versions that are part of the tools cache. The system Python versions are located in the `/usr/local/Cellar/python/*` directory.                                                                                                    |

## Installing dependencies

GitHub-hosted runners have the pip package manager installed. You can use pip to install dependencies from the PyPI package registry before building and testing your code. For example, the YAML below installs or upgrades the `pip` package installer and the `setuptools` and `wheel` packages.

You can also cache dependencies to speed up your workflow. For more information, see [Dependency caching reference](/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).

```yaml copy
steps:
- uses: actions/checkout@v5
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.x'
- name: Install dependencies
  run: python -m pip install --upgrade pip setuptools wheel
```

### Requirements file

After you update `pip`, a typical next step is to install dependencies from `requirements.txt`. For more information, see [pip](https://pip.pypa.io/en/stable/cli/pip_install/#example-requirements-file).

```yaml copy
steps:
- uses: actions/checkout@v5
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.x'
- name: Install dependencies
  run: |
    python -m pip install --upgrade pip
    pip install -r requirements.txt
```

### Caching Dependencies

You can cache and restore the dependencies using the [`setup-python` action](https://github.com/actions/setup-python).

The following example caches dependencies for pip.

```yaml copy
steps:
- uses: actions/checkout@v5
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: 'pip'
- run: pip install -r requirements.txt
- run: pip test
```

By default, the `setup-python` action searches for the dependency file (`requirements.txt` for pip, `Pipfile.lock` for pipenv or `poetry.lock` for poetry) in the whole repository. For more information, see [Caching packages dependencies](https://github.com/actions/setup-python#caching-packages-dependencies) in the `setup-python` README.

If you have a custom requirement or need finer controls for caching, you can use the [`cache` action](https://github.com/marketplace/actions/cache). Pip caches dependencies in different locations, depending on the operating system of the runner. The path you'll need to cache may differ from the Ubuntu example above, depending on the operating system you use. For more information, see [Python caching examples](https://github.com/actions/cache/blob/main/examples.md#python---pip) in the `cache` action repository.

## Testing your code

You can use the same commands that you use locally to build and test your code.

### Testing with pytest and pytest-cov

This example installs or upgrades `pytest` and `pytest-cov`. Tests are then run and output in JUnit format while code coverage results are output in Cobertura. For more information, see [JUnit](https://junit.org/junit5/) and [Cobertura](https://cobertura.github.io/cobertura/).

```yaml copy
steps:
- uses: actions/checkout@v5
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.x'
- name: Install dependencies
  run: |
    python -m pip install --upgrade pip
    pip install -r requirements.txt
- name: Test with pytest
  run: |
    pip install pytest pytest-cov
    pytest tests.py --doctest-modules --junitxml=junit/test-results.xml --cov=com --cov-report=xml --cov-report=html
```

### Using Ruff to lint and/or format code

The following example installs or upgrades `ruff` and uses it to lint all files. For more information, see [Ruff](https://docs.astral.sh/ruff).

```yaml copy
steps:
- uses: actions/checkout@v5
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.x'
- name: Install the code linting and formatting tool Ruff
  run: pipx install ruff
- name: Lint code with Ruff
  run: ruff check --output-format=github --target-version=py39
- name: Check code formatting with Ruff
  run: ruff format --diff --target-version=py39
  continue-on-error: true
```

The formatting step has `continue-on-error: true` set. This will keep the workflow from failing if the formatting step doesn't succeed. Once you've addressed all of the formatting errors, you can remove this option so the workflow will catch new issues.

### Running tests with tox

With GitHub Actions, you can run tests with tox and spread the work across multiple jobs. You'll need to invoke tox using the `-e py` option to choose the version of Python in your `PATH`, rather than specifying a specific version. For more information, see [tox](https://tox.readthedocs.io/en/latest/).

```yaml copy
name: Python package

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest
    strategy:
      matrix:
        python: ["3.9", "3.11", "3.13"]

    steps:
      - uses: actions/checkout@v5
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python }}
      - name: Install tox and any other packages
        run: pip install tox
      - name: Run tox
        # Run tox using the version of Python in `PATH`
        run: tox -e py
```

## Packaging workflow data as artifacts

You can upload artifacts to view after a workflow completes. For example, you may need to save log files, core dumps, test results, or screenshots. For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

The following example demonstrates how you can use the `upload-artifact` action to archive test results from running `pytest`. For more information, see the [`upload-artifact` action](https://github.com/actions/upload-artifact).

```yaml copy
name: Python package

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.9", "3.10", "3.11", "3.12", "3.13"]

    steps:
      - uses: actions/checkout@v5
      - name: Setup Python # Set Python version
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      # Install pip and pytest
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pytest
      - name: Test with pytest
        run: pytest tests.py --doctest-modules --junitxml=junit/test-results-${{ matrix.python-version }}.xml
      - name: Upload pytest test results
        uses: actions/upload-artifact@v4
        with:
          name: pytest-results-${{ matrix.python-version }}
          path: junit/test-results-${{ matrix.python-version }}.xml
        # Use always() to always run this step to publish test results when there are test failures
        if: ${{ always() }}
```

## Publishing to PyPI

You can configure your workflow to publish your Python package to PyPI once your CI tests pass. This section demonstrates how you can use GitHub Actions to upload your package to PyPI each time you publish a release. For more information, see [Managing releases in a repository](/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).

The example workflow below uses [Trusted Publishing](https://docs.pypi.org/trusted-publishers/) to authenticate with PyPI, eliminating the need for a manually configured API token.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Upload Python Package

on:
  release:
    types: [published]

permissions:
  contents: read

jobs:
  release-build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-python@v5
        with:
          python-version: "3.x"

      - name: Build release distributions
        run: |
          # NOTE: put your own distribution build steps here.
          python -m pip install build
          python -m build

      - name: Upload distributions
        uses: actions/upload-artifact@v4
        with:
          name: release-dists
          path: dist/

  pypi-publish:
    runs-on: ubuntu-latest

    needs:
      - release-build

    permissions:
      # IMPORTANT: this permission is mandatory for trusted publishing
      id-token: write

    # Dedicated environments with protections for publishing are strongly recommended.
    environment:
      name: pypi
      # OPTIONAL: uncomment and update to include your PyPI project URL in the deployment status:
      # url: https://pypi.org/p/YOURPROJECT

    steps:
      - name: Retrieve release distributions
        uses: actions/download-artifact@v5
        with:
          name: release-dists
          path: dist/

      - name: Publish release distributions to PyPI
        uses: pypa/gh-action-pypi-publish@6f7e8d9c0b1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d
```

For more information about this workflow, including the PyPI settings
needed, see [Configuring OpenID Connect in PyPI](/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-pypi).
---

# Building and testing Ruby

You can create a continuous integration (CI) workflow to build and test your Ruby project.

## Introduction

This guide shows you how to create a continuous integration (CI) workflow that builds and tests a Ruby application. If your CI tests pass, you may want to deploy your code or publish a gem.

## Prerequisites

We recommend that you have a basic understanding of Ruby, YAML, workflow configuration options, and how to create a workflow file. For more information, see:

* [Learn GitHub Actions](/en/actions/learn-github-actions)
* [Ruby in 20 minutes](https://www.ruby-lang.org/en/documentation/quickstart/)

## Using a Ruby workflow template

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a workflow template for Ruby that should work for most Ruby projects. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "ruby".

5. Filter the selection of workflows by clicking **Continuous integration**.

6. On the "Ruby" workflow, click **Configure**.

7. Edit the workflow as required. For example, change the Ruby versions you want to use.

   > \[!NOTE]
   >
   > * This workflow template contains an action that is not certified by GitHub. Actions provided by third parties are governed by separate terms of service, privacy policy, and support documentation.
   > * If you use actions from third parties you should use a version specified by a commit SHA. If the action is revised and you want to use the newer version, you will need to update the SHA. You can specify a version by referencing a tag or a branch, however the action may change without warning. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions).

8. Click **Commit changes**.

   The `ruby.yml` workflow file is added to the `.github/workflows` directory of your repository.

## Specifying the Ruby version

The easiest way to specify a Ruby version is by using the `ruby/setup-ruby` action provided by the Ruby organization on GitHub. The action adds any supported Ruby version to `PATH` for each job run in a workflow. For more information and available Ruby versions, see [`ruby/setup-ruby`](https://github.com/ruby/setup-ruby).

Using Ruby's `ruby/setup-ruby` action is the recommended way of using Ruby with GitHub Actions because it ensures consistent behavior across different runners and different versions of Ruby.

The `setup-ruby` action takes a Ruby version as an input and configures that version on the runner.

```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
steps:
- uses: actions/checkout@v5
- uses: ruby/setup-ruby@ec02537da5712d66d4d50a0f33b7eb52773b5ed1
  with:
    ruby-version: '3.1' # Not needed with a .ruby-version file
- run: bundle install
- run: bundle exec rake
```

Alternatively, you can check a `.ruby-version` file into the root of your repository and `setup-ruby` will use the version defined in that file.

## Testing with multiple versions of Ruby

You can add a matrix strategy to run your workflow with more than one version of Ruby. For example, you can test your code against the latest patch releases of versions 3.1, 3.0, and 2.7.

```yaml
strategy:
  matrix:
    ruby-version: ['3.1', '3.0', '2.7']
```

Each version of Ruby specified in the `ruby-version` array creates a job that runs the same steps. The `${{ matrix.ruby-version }}` context is used to access the current job's version. For more information about matrix strategies and contexts, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions) and [Contexts reference](/en/actions/learn-github-actions/contexts).

The full updated workflow with a matrix strategy could look like this:

```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Ruby CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:

    runs-on: ubuntu-latest

    strategy:
      matrix:
        ruby-version: ['3.1', '3.0', '2.7']

    steps:
      - uses: actions/checkout@v5
      - name: Set up Ruby ${{ matrix.ruby-version }}
        uses: ruby/setup-ruby@ec02537da5712d66d4d50a0f33b7eb52773b5ed1
        with:
          ruby-version: ${{ matrix.ruby-version }}
      - name: Install dependencies
        run: bundle install
      - name: Run tests
        run: bundle exec rake
```

## Installing dependencies with Bundler

The `setup-ruby` action will automatically install bundler for you. The version is determined by your `gemfile.lock` file. If no version is present in your lockfile, then the latest compatible version will be installed.

```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
steps:
- uses: actions/checkout@v5
- uses: ruby/setup-ruby@ec02537da5712d66d4d50a0f33b7eb52773b5ed1
  with:
    ruby-version: '3.1'
- run: bundle install
```

### Caching dependencies

The `setup-ruby` actions provides a method to automatically handle the caching of your gems between runs.

To enable caching, set the following.

```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
steps:
- uses: ruby/setup-ruby@ec02537da5712d66d4d50a0f33b7eb52773b5ed1
  with:
    bundler-cache: true
```

This will configure bundler to install your gems to `vendor/cache`. For each successful run of your workflow, this folder will be cached by GitHub Actions and re-downloaded for subsequent workflow runs. A hash of your `gemfile.lock` and the Ruby version are used as the cache key. If you install any new gems, or change a version, the cache will be invalidated and bundler will do a fresh install.

**Caching without setup-ruby**

For greater control over caching, you can use the `actions/cache` action directly. For more information, see [Dependency caching reference](/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).

```yaml
steps:
- uses: actions/cache@v4
  with:
    path: vendor/bundle
    key: ${{ runner.os }}-gems-${{ hashFiles('**/Gemfile.lock') }}
    restore-keys: |
      ${{ runner.os }}-gems-
- name: Bundle install
  run: |
    bundle config path vendor/bundle
    bundle install --jobs 4 --retry 3
```

If you're using a matrix build, you will want to include the matrix variables in your cache key. For example, if you have a matrix strategy for different ruby versions (`matrix.ruby-version`) and different operating systems (`matrix.os`), your workflow steps might look like this:

```yaml
steps:
- uses: actions/cache@v4
  with:
    path: vendor/bundle
    key: bundle-use-ruby-${{ matrix.os }}-${{ matrix.ruby-version }}-${{ hashFiles('**/Gemfile.lock') }}
    restore-keys: |
      bundle-use-ruby-${{ matrix.os }}-${{ matrix.ruby-version }}-
- name: Bundle install
  run: |
    bundle config path vendor/bundle
    bundle install --jobs 4 --retry 3
```

## Matrix testing your code

The following example matrix tests all stable releases and head versions of MRI, JRuby and TruffleRuby on Ubuntu and macOS.

```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Matrix Testing

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ${{ matrix.os }}-latest
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu, macos]
        ruby: [2.5, 2.6, 2.7, head, debug, jruby, jruby-head, truffleruby, truffleruby-head]
    continue-on-error: ${{ endsWith(matrix.ruby, 'head') || matrix.ruby == 'debug' }}
    steps:
      - uses: actions/checkout@v5
      - uses: ruby/setup-ruby@ec02537da5712d66d4d50a0f33b7eb52773b5ed1
        with:
          ruby-version: ${{ matrix.ruby }}
      - run: bundle install
      - run: bundle exec rake
```

## Linting your code

The following example installs `rubocop` and uses it to lint all files. For more information, see [RuboCop](https://github.com/rubocop-hq/rubocop). You can [configure Rubocop](https://docs.rubocop.org/rubocop/configuration.html) to decide on the specific linting rules.

```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Linting

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: ruby/setup-ruby@ec02537da5712d66d4d50a0f33b7eb52773b5ed1
        with:
          ruby-version: '2.6'
      - run: bundle install
      - name: Rubocop
        run: rubocop -f github
```

Specifying `-f github` means that the RuboCop output will be in GitHub's annotation format. Any linting errors will show inline in the **Files changed** tab of the pull request that introduces them.

## Publishing Gems

You can configure your workflow to publish your Ruby package to any package registry you'd like when your CI tests pass.

You can store any access tokens or credentials needed to publish your package using repository secrets. The following example creates and publishes a package to `GitHub Package Registry` and `RubyGems`.

```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Ruby Gem

on:
  # Manually publish
  workflow_dispatch:
  # Alternatively, publish whenever changes are merged to the `main` branch.
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    name: Build + Publish
    runs-on: ubuntu-latest
    permissions:
      packages: write
      contents: read

    steps:
      - uses: actions/checkout@v5
      - name: Set up Ruby 2.6
        uses: ruby/setup-ruby@ec02537da5712d66d4d50a0f33b7eb52773b5ed1
        with:
          ruby-version: '2.6'
      - run: bundle install

      - name: Publish to GPR
        run: |
          mkdir -p $HOME/.gem
          touch $HOME/.gem/credentials
          chmod 0600 $HOME/.gem/credentials
          printf -- "---\n:github: ${GEM_HOST_API_KEY}\n" > $HOME/.gem/credentials
          gem build *.gemspec
          gem push --KEY github --host https://rubygems.pkg.github.com/${OWNER} *.gem
        env:
          GEM_HOST_API_KEY: "Bearer ${{secrets.GITHUB_TOKEN}}"
          OWNER: ${{ github.repository_owner }}

      - name: Publish to RubyGems
        run: |
          mkdir -p $HOME/.gem
          touch $HOME/.gem/credentials
          chmod 0600 $HOME/.gem/credentials
          printf -- "---\n:rubygems_api_key: ${GEM_HOST_API_KEY}\n" > $HOME/.gem/credentials
          gem build *.gemspec
          gem push *.gem
        env:
          GEM_HOST_API_KEY: "${{secrets.RUBYGEMS_AUTH_TOKEN}}"
```
---

# Building and testing Rust

Learn how to create a continuous integration (CI) workflow to build and test your Rust project.

## Introduction

This guide shows you how to build, test, and publish a Rust package.

GitHub-hosted runners have a tools cache with preinstalled software, which includes the dependencies for Rust. For a full list of up-to-date software and the preinstalled versions of Rust, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/using-github-hosted-runners/about-github-hosted-runners#preinstalled-software).

## Prerequisites

You should already be familiar with YAML syntax and how it's used with GitHub Actions. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions).

We recommend that you have a basic understanding of the Rust language. For more information, see [Getting started with Rust](https://www.rust-lang.org/learn).

## Using a Rust workflow template

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a Rust workflow template that should work for most basic Rust projects. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "Rust".

5. Filter the selection of workflows by clicking **Continuous integration**.

6. On the "Rust - by GitHub Actions" workflow, click **Configure**.

   ![Screenshot of the "Choose a workflow" page. The "Configure" button on the "Rust" workflow is highlighted with an orange outline.](/assets/images/help/actions/starter-workflow-rust.png)

7. Edit the workflow as required. For example, change the version of Rust.

8. Click **Commit changes**.

   The `rust.yml` workflow file is added to the `.github/workflows` directory of your repository.

## Specifying a Rust version

GitHub-hosted runners include a recent version of the Rust toolchain. You can use rustup to report on the version installed on a runner, override the version, and to install different toolchains. For more information, see [The rustup book](https://rust-lang.github.io/rustup/).

This example shows steps you could use to setup your runner environment to use the nightly build of rust and to report the version.

```yaml copy
      - name: Temporarily modify the rust toolchain version
        run: rustup override set nightly
      - name: Output rust version for educational purposes
        run: rustup --version
```

### Caching dependencies

You can cache and restore dependencies using the Cache action. This example assumes that your repository contains a `Cargo.lock` file.

```yaml copy
      - name: Cache
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            target
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
```

If you have custom requirements or need finer controls for caching, you should explore other configuration options for the [`cache` action](https://github.com/marketplace/actions/cache). For more information, see [Dependency caching reference](/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).

## Building and testing your code

You can use the same commands that you use locally to build and test your code. This example workflow demonstrates how to use `cargo build` and `cargo test` in a job:

```yaml copy
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        BUILD_TARGET: [release] # refers to a cargo profile
    outputs:
      release_built: ${{ steps.set-output.outputs.release_built }}
    steps:
      - uses: actions/checkout@v5
      - name: Build binaries in "${{ matrix.BUILD_TARGET }}" mode
        run: cargo build --profile ${{ matrix.BUILD_TARGET }}
      - name: Run tests in "${{ matrix.BUILD_TARGET }}" mode
        run: cargo test --profile ${{ matrix.BUILD_TARGET }}
```

The `release` keyword used in this example corresponds to a cargo profile. You can use any [profile](https://doc.rust-lang.org/cargo/reference/profiles.html) you have defined in your `Cargo.toml` file.

## Publishing your package or library to crates.io

Once you have setup your workflow to build and test your code, you can use a secret to login to [crates.io](https://crates.io/) and publish your package.

```yaml copy
      - name: Login into crates.io
        run: cargo login ${{ secrets.CRATES_IO }}
      - name: Build binaries in "release" mode
        run: cargo build -r
      - name: "Package for crates.io"
        run: cargo package # publishes a package as a tarball
      - name: "Publish to crates.io"
        run: cargo publish # publishes your crate as a library that can be added as a dependency
```

If there are any errors building and packaging the crate, check the metadata in your manifest, `Cargo.toml` file, see [The Manifest Format](https://doc.rust-lang.org/cargo/reference/manifest.html). You should also check your `Cargo.lock` file, see [Cargo.toml vs Cargo.lock](https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html).

## Packaging workflow data as artifacts

After a workflow completes, you can upload the resulting artifacts for analysis or to use in another workflow. You could add these example steps to the workflow to upload an application for use by another workflow.

```yaml copy
      - name: Upload release artifact
        uses: actions/upload-artifact@v4
        with:
          name: <my-app>
          path: target/${{ matrix.BUILD_TARGET }}/<my-app>
```

To use the uploaded artifact in a different job, ensure your workflows have the right permissions for the repository, see [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-for-github-actions/security-guides/automatic-token-authentication). You could use these example steps to download the app created in the previous workflow and publish it on GitHub.

```yaml copy
      - uses: actions/checkout@v5
      - name: Download release artifact
        uses: actions/download-artifact@v5
        with:
          name: <my-app>
          path: ./<my-app>
      - name: Publish built binary to GitHub releases
      - run: |
          gh release create --generate-notes ./<my-app>/<my-project>#<my-app>
```
---

# Building and testing Swift

Learn how to create a continuous integration (CI) workflow to build and test your Swift project.

## Introduction

This guide shows you how to build and test a Swift package.

GitHub-hosted runners have a tools cache with preinstalled software, and the Ubuntu and macOS runners include the dependencies for building Swift packages. For a full list of up-to-date software and the preinstalled versions of Swift and Xcode, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-software).

## Prerequisites

You should already be familiar with YAML syntax and how it's used with GitHub Actions. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions).

We recommend that you have a basic understanding of Swift packages. For more information, see [Swift Packages](https://developer.apple.com/documentation/xcode/swift-packages) in the Apple developer documentation.

## Using a Swift workflow template

To get started quickly, add a workflow template to the `.github/workflows` directory of your repository.

GitHub provides a workflow template for Swift that should work for most Swift projects. The subsequent sections of this guide give examples of how you can customize this workflow template.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Search for "swift".

5. Filter the selection of workflows by clicking **Continuous integration**.

6. On the "Swift" workflow, click **Configure**.

7. Edit the workflow as required. For example, change the branch on which the workflow will run.

8. Click **Commit changes**.

   The `swift.yml` workflow file is added to the `.github/workflows` directory of your repository.

## Specifying a Swift version

To use a specific preinstalled version of Swift on a GitHub-hosted runner, use the `swift-actions/setup-swift` action. This action finds a specific version of Swift from the tools cache on the runner and adds the necessary binaries to `PATH`. These changes will persist for the remainder of a job. For more information, see the [`swift-actions/setup-swift`](https://github.com/marketplace/actions/setup-swift) action.

If you are using a self-hosted runner, you must install your desired Swift versions and add them to `PATH`.

The examples below demonstrate using the `swift-actions/setup-swift` action.

### Using multiple Swift versions

You can configure your job to use multiple versions of Swift in a matrix.

```yaml copy

# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Swift

on: [push]

jobs:
  build:
    name: Swift ${{ matrix.swift }} on ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        swift: ["5.2", "5.3"]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: swift-actions/setup-swift@65540b95f51493d65f5e59e97dcef9629ddf11bf
        with:
          swift-version: ${{ matrix.swift }}
      - uses: actions/checkout@v5
      - name: Build
        run: swift build
      - name: Run tests
        run: swift test
```

### Using a single specific Swift version

You can configure your job to use a single specific version of Swift, such as `5.3.3`.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
steps:
  - uses: swift-actions/setup-swift@65540b95f51493d65f5e59e97dcef9629ddf11bf
    with:
      swift-version: "5.3.3"
  - name: Get swift version
    run: swift --version # Swift 5.3.3
```

## Building and testing your code

You can use the same commands that you use locally to build and test your code using Swift. This example demonstrates how to use `swift build` and `swift test` in a job:

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
steps:
  - uses: actions/checkout@v5
  - uses: swift-actions/setup-swift@65540b95f51493d65f5e59e97dcef9629ddf11bf
    with:
      swift-version: "5.3.3"
  - name: Build
    run: swift build
  - name: Run tests
    run: swift test
```
---

# Building and testing Xamarin applications

Learn how to create a continuous integration (CI) workflow in GitHub Actions to build and test your Xamarin application.

## Introduction

This guide shows you how to create a workflow that performs continuous integration (CI) for your Xamarin project. The workflow you create will allow you to see when commits to a pull request cause build or test failures against your default branch; this approach can help ensure that your code is always healthy.

For a full list of available Xamarin SDK versions on the GitHub Actions-hosted macOS runners, see the README file for the version of macOS you want to use in the [GitHub Actions Runner Images repository](https://github.com/actions/runner-images/tree/main/images/macos).

## Prerequisites

We recommend that you have a basic understanding of Xamarin, .NET Core SDK, YAML, workflow configuration options, and how to create a workflow file. For more information, see:

* [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions)
* [Getting started with .NET](https://dotnet.microsoft.com/learn)
* [Learn Xamarin](https://dotnet.microsoft.com/learn/xamarin)

## Building Xamarin.iOS apps

The example below demonstrates how to change the default Xamarin SDK versions and build a Xamarin.iOS application.

```yaml
name: Build Xamarin.iOS app

on: [push]

jobs:
  build:

    runs-on: macos-latest

    steps:
    - uses: actions/checkout@v5
    - name: Set default Xamarin SDK versions
      run: |
        $VM_ASSETS/select-xamarin-sdk-v2.sh --mono=6.12 --ios=14.10

    - name: Set default Xcode 12.3
      run: |
        XCODE_ROOT=/Applications/Xcode_12.3.0.app
        echo "MD_APPLE_SDK_ROOT=$XCODE_ROOT" >> $GITHUB_ENV
        sudo xcode-select -s $XCODE_ROOT

    - name: Setup .NET Core SDK 5.0.x
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '5.0.x'

    - name: Install dependencies
      run: nuget restore <sln_file_path>

    - name: Build
      run: msbuild <csproj_file_path> /p:Configuration=Debug /p:Platform=iPhoneSimulator /t:Rebuild
```

## Building Xamarin.Android apps

The example below demonstrates how to change default Xamarin SDK versions and build a Xamarin.Android application.

```yaml
name: Build Xamarin.Android app

on: [push]

jobs:
  build:

    runs-on: macos-latest

    steps:
    - uses: actions/checkout@v5
    - name: Set default Xamarin SDK versions
      run: |
        $VM_ASSETS/select-xamarin-sdk-v2.sh --mono=6.10 --android=10.2

    - name: Setup .NET Core SDK 5.0.x
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '5.0.x'

    - name: Install dependencies
      run: nuget restore <sln_file_path>

    - name: Build
      run: msbuild <csproj_file_path> /t:PackageForAndroid /p:Configuration=Debug
```

## Specifying a .NET version

To use a preinstalled version of the .NET Core SDK on a GitHub-hosted runner, use the `setup-dotnet` action. This action finds a specific version of .NET from the tools cache on each runner, and adds the necessary binaries to `PATH`. These changes will persist for the remainder of the job.

The `setup-dotnet` action is the recommended way of using .NET with GitHub Actions, because it ensures consistent behavior across different runners and different versions of .NET. If you are using a self-hosted runner, you must install .NET and add it to `PATH`. For more information, see the [`setup-dotnet`](https://github.com/marketplace/actions/setup-net-core-sdk) action.