# Publish Packages

---

# Publishing Docker images

In this tutorial, you'll learn how to publish Docker images to a registry, such as Docker Hub or GitHub Packages, as part of your continuous integration (CI) workflow.

## Introduction

This guide shows you how to create a workflow that performs a Docker build, and then publishes Docker images to Docker Hub or GitHub Packages. With a single workflow, you can publish images to a single registry or to multiple registries.

> \[!NOTE]
> If you want to push to another third-party Docker registry, the example in the [Publishing images to GitHub Packages](#publishing-images-to-github-packages) section can serve as a good template.

## Prerequisites

We recommend that you have a basic understanding of workflow configuration options and how to create a workflow file. For more information, see [Writing workflows](/en/actions/learn-github-actions).

You might also find it helpful to have a basic understanding of the following:

* [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions)
* [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication)
* [Working with the Container registry](/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## About image configuration

This guide assumes that you have a complete definition for a Docker image stored in a GitHub repository. For example, your repository must contain a *Dockerfile*, and any other files needed to perform a Docker build to create an image.

You can use pre-defined annotation keys to add metadata including a description, a license, and a source repository to your container image. For more information, see [Working with the Container registry](/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#labelling-container-images).

In this guide, we will use the Docker `build-push-action` action to build the Docker image and push it to one or more Docker registries. For more information, see [`build-push-action`](https://github.com/marketplace/actions/build-and-push-docker-images).

## Publishing images to Docker Hub

> \[!NOTE]
> Docker Hub normally imposes rate limits on both push and pull operations which will affect jobs on self-hosted runners. However, GitHub-hosted runners are not subject to these limits based on an agreement between GitHub and Docker.

Each time you create a new release on GitHub, you can trigger a workflow to publish your image. The workflow in the example below runs when the `release` event triggers with the `published` activity type.

In the example workflow below, we use the Docker `login-action` and `build-push-action` actions to build the Docker image and, if the build succeeds, push the built image to Docker Hub.

To push to Docker Hub, you will need to have a Docker Hub account, and have a Docker Hub repository created. For more information, see [Pushing a Docker container image to Docker Hub](https://docs.docker.com/docker-hub/quickstart/#step-3-build-and-push-an-image-to-docker-hub) in the Docker documentation.

The `login-action` options required for Docker Hub are:

* `username` and `password`: This is your Docker Hub username and password. We recommend storing your Docker Hub username and password as secrets so they aren't exposed in your workflow file. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

The `metadata-action` option required for Docker Hub is:

* `images`: The namespace and name for the Docker image you are building/pushing to Docker Hub.

The `build-push-action` options required for Docker Hub are:

* `tags`: The tag of your new image in the format `DOCKER-HUB-NAMESPACE/DOCKER-HUB-REPOSITORY:VERSION`. You can set a single tag as shown below, or specify multiple tags in a list.
* `push`: If set to `true`, the image will be pushed to the registry if it is built successfully.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Publish Docker image

on:
  release:
    types: [published]

jobs:
  push_to_registry:
    name: Push Docker image to Docker Hub
    runs-on: ubuntu-latest
    permissions:
      packages: write
      contents: read
      attestations: write
      id-token: write
    steps:
      - name: Check out the repo
        uses: actions/checkout@v5

      - name: Log in to Docker Hub
        uses: docker/login-action@f4ef78c080cd8ba55a85445d5b36e214a81df20a
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata (tags, labels) for Docker
        id: meta
        uses: docker/metadata-action@9ec57ed1fcdbf14dcef7dfbe97b2010124a938b7
        with:
          images: my-docker-hub-namespace/my-docker-hub-repository

      - name: Build and push Docker image
        id: push
        uses: docker/build-push-action@3b5e8027fcad23fda98b2e3ac259d8d67585f671
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Generate artifact attestation
        uses: actions/attest@v4
        with:
          subject-name: index.docker.io/my-docker-hub-namespace/my-docker-hub-repository
          subject-digest: ${{ steps.push.outputs.digest }}
          push-to-registry: true
```

The above workflow checks out the GitHub repository, uses the `login-action` to log in to the registry, and then uses the `build-push-action` action to: build a Docker image based on your repository's `Dockerfile`; push the image to Docker Hub, and apply a tag to the image.

In the last step, it generates an artifact attestation for the image, which increases supply chain security. For more information, see [Using artifact attestations to establish provenance for builds](/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds).

## Publishing images to GitHub Packages

Each time you create a new release on GitHub, you can trigger a workflow to publish your image. The workflow in the example below runs when a change is pushed to the `release` branch.

In the example workflow below, we use the Docker `login-action`, `metadata-action`, and `build-push-action` actions to build the Docker image, and if the build succeeds, push the built image to GitHub Packages.

The `login-action` options required for GitHub Packages are:

* `registry`: Must be set to `ghcr.io`.
* `username`: You can use the `${{ github.actor }}` context to automatically use the username of the user that triggered the workflow run. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts#github-context).
* `password`: You can use the automatically-generated `GITHUB_TOKEN` secret for the password. For more information, see [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication).

The `metadata-action` option required for GitHub Packages is:

* `images`: The namespace and name for the Docker image you are building.

The `build-push-action` options required for GitHub Packages are:

* `context`: Defines the build's context as the set of files located in the specified path.
* `push`: If set to `true`, the image will be pushed to the registry if it is built successfully.
* `tags` and `labels`: These are populated by output from `metadata-action`.

> \[!NOTE]
>
> * This workflow uses actions that are not certified by GitHub. They are provided by a third-party and are governed by separate terms of service, privacy policy, and support documentation.
> * GitHub recommends pinning actions to a commit SHA. To get a newer version, you will need to update the SHA. You can also reference a tag or branch, but the action may change without warning.

```yaml annotate copy
#
name: Create and publish a Docker image

# Configures this workflow to run every time a change is pushed to the branch called `release`.
on:
  push:
    branches: ['release']

# Defines two custom environment variables for the workflow. These are used for the Container registry domain, and a name for the Docker image that this workflow builds.
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

# There is a single job in this workflow. It's configured to run on the latest available version of Ubuntu.
jobs:
  build-and-push-image:
    runs-on: ubuntu-latest
    # Sets the permissions granted to the `GITHUB_TOKEN` for the actions in this job.
    permissions:
      contents: read
      packages: write
      attestations: write
      id-token: write
      #
    steps:
      - name: Checkout repository
        uses: actions/checkout@v5
      # Uses the `docker/login-action` action to log in to the Container registry registry using the account and password that will publish the packages. Once published, the packages are scoped to the account defined here.
      - name: Log in to the Container registry
        uses: docker/login-action@65b78e6e13532edd9afa3aa52ac7964289d1a9c1
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      # This step uses [docker/metadata-action](https://github.com/docker/metadata-action#about) to extract tags and labels that will be applied to the specified image. The `id` "meta" allows the output of this step to be referenced in a subsequent step. The `images` value provides the base name for the tags and labels.
      - name: Extract metadata (tags, labels) for Docker
        id: meta
        uses: docker/metadata-action@9ec57ed1fcdbf14dcef7dfbe97b2010124a938b7
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
      # This step uses the `docker/build-push-action` action to build the image, based on your repository's `Dockerfile`. If the build succeeds, it pushes the image to GitHub Packages.
      # It uses the `context` parameter to define the build's context as the set of files located in the specified path. For more information, see [Usage](https://github.com/docker/build-push-action#usage) in the README of the `docker/build-push-action` repository.
      # It uses the `tags` and `labels` parameters to tag and label the image with the output from the "meta" step.
      - name: Build and push Docker image
        id: push
        uses: docker/build-push-action@f2a1d5e99d037542a71f64918e516c093c6f3fc4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
      
      # This step generates an artifact attestation for the image, which is an unforgeable statement about where and how it was built. It increases supply chain security for people who consume the image. For more information, see [Using artifact attestations to establish provenance for builds](/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds).
      - name: Generate artifact attestation
        uses: actions/attest@v4
        with:
          subject-name: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME}}
          subject-digest: ${{ steps.push.outputs.digest }}
          push-to-registry: true
      
```

The above workflow is triggered by a push to the "release" branch. It checks out the GitHub repository, and uses the `login-action` to log in to the Container registry. It then extracts labels and tags for the Docker image. Finally, it uses the `build-push-action` action to build the image and publish it on the Container registry.

## Publishing images to Docker Hub and GitHub Packages

In a single workflow, you can publish your Docker image to multiple registries by using the `login-action` and `build-push-action` actions for each registry.

The following example workflow uses the steps from the previous sections ([Publishing images to Docker Hub](#publishing-images-to-docker-hub) and [Publishing images to GitHub Packages](#publishing-images-to-github-packages)) to create a single workflow that pushes to both registries.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Publish Docker image

on:
  release:
    types: [published]

jobs:
  push_to_registries:
    name: Push Docker image to multiple registries
    runs-on: ubuntu-latest
    permissions:
      packages: write
      contents: read
    steps:
      - name: Check out the repo
        uses: actions/checkout@v5

      - name: Log in to Docker Hub
        uses: docker/login-action@f4ef78c080cd8ba55a85445d5b36e214a81df20a
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Log in to the Container registry
        uses: docker/login-action@65b78e6e13532edd9afa3aa52ac7964289d1a9c1
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels) for Docker
        id: meta
        uses: docker/metadata-action@9ec57ed1fcdbf14dcef7dfbe97b2010124a938b7
        with:
          images: |
            my-docker-hub-namespace/my-docker-hub-repository
            ghcr.io/${{ github.repository }}

      - name: Build and push Docker images
        id: push
        uses: docker/build-push-action@3b5e8027fcad23fda98b2e3ac259d8d67585f671
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

The above workflow checks out the GitHub repository, uses the `login-action` twice to log in to both registries and generates tags and labels with the `metadata-action` action.
Then the `build-push-action` action builds and pushes the Docker image to Docker Hub and the Container registry.

> \[!NOTE]
> When pushing to multiple registries:
>
> * Image digests may differ between registries, making attestation verification difficult.
> * To maintain a consistent digest and allow a single attestation to verify all copies, push to one registry first and use a tool like [`crane copy`](https://github.com/google/go-containerregistry/blob/main/cmd/crane/doc/crane_copy.md) to replicate the image elsewhere.
> * If you choose to build and push to each registry separately instead, you must generate a distinct attestation for each one to ensure your artifacts remain verifiable.
---

# Publishing Java packages with Gradle

In this tutorial, you'll learn how to use Gradle to publish Java packages to a registry as part of your continuous integration (CI) workflow.

## Introduction

This guide shows you how to create a workflow that publishes Java packages to GitHub Packages and the Maven Central Repository. With a single workflow, you can publish packages to a single repository or to multiple repositories.

> \[!WARNING] The examples used in this guide refer to the Legacy OSSRH service. See [Publishing](https://central.sonatype.org/faq/what-is-different-between-central-portal-and-legacy-ossrh/#publishing) in the Maven Central Repository documentation.

## Prerequisites

We recommend that you have a basic understanding of workflow files and configuration options. For more information, see [Writing workflows](/en/actions/learn-github-actions).

For more information about creating a CI workflow for your Java project with Gradle, see [Building and testing Java with Gradle](/en/actions/automating-builds-and-tests/building-and-testing-java-with-gradle).

You may also find it helpful to have a basic understanding of the following:

* [Working with the Apache Maven registry](/en/packages/working-with-a-github-packages-registry/working-with-the-apache-maven-registry)
* [Store information in variables](/en/actions/learn-github-actions/variables)
* [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions)
* [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication)

## About package configuration

The `groupId` and `artifactId` fields in the `MavenPublication` section of the *build.gradle* file create a unique identifier for your package that registries use to link your package to a registry. This is similar to the `groupId` and `artifactId` fields of the Maven *pom.xml* file. For more information, see the [Maven Publish Plugin](https://docs.gradle.org/current/userguide/publishing_maven.html) in the Gradle documentation.

The *build.gradle* file also contains configuration for the distribution management repositories that Gradle will publish packages to. Each repository must have a name, a deployment URL, and credentials for authentication.

## Publishing packages to the Maven Central Repository

Each time you create a new release, you can trigger a workflow to publish your package. The workflow in the example below runs when the `release` event triggers with type `created`. The workflow publishes the package to the Maven Central Repository if CI tests pass. For more information on the `release` event, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#release).

You can define a new Maven repository in the publishing block of your *build.gradle* file that points to your package repository. For example, if you were deploying to the Maven Central Repository through the OSSRH hosting project, your *build.gradle* could specify a repository with the name `"OSSRH"`.

```groovy copy
plugins {
  ...
  id 'maven-publish'
}

publishing {
  ...

  repositories {
    maven {
      name = "OSSRH"
      url = "https://oss.sonatype.org/service/local/staging/deploy/maven2/"
      credentials {
        username = System.getenv("MAVEN_USERNAME")
        password = System.getenv("MAVEN_PASSWORD")
      }
    }
  }
}
```

With this configuration, you can create a workflow that publishes your package to the Maven Central Repository by running the `gradle publish` command. In the deploy step, you’ll need to set environment variables for the username and password or token that you use to authenticate to the Maven repository. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

```yaml copy

# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Publish package to the Maven Central Repository
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          java-version: '11'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@017a9effdb900e5b5b2fddfb590a105619dca3c3 # v4.4.2

      - name: Publish package
        run: ./gradlew publish
        env:
          MAVEN_USERNAME: ${{ secrets.OSSRH_USERNAME }}
          MAVEN_PASSWORD: ${{ secrets.OSSRH_TOKEN }}
```

This workflow performs the following steps:

1. Checks out a copy of project's repository.
2. Sets up the Java JDK.
3. Sets up the Gradle environment. The [`gradle/actions/setup-gradle`](https://github.com/gradle/actions) action takes care of caching state between workflow runs, and provides a detailed summary of all Gradle executions.
4. Executes the Gradle `publish` task to publish to the `OSSRH` Maven repository. The `MAVEN_USERNAME` environment variable will be set with the contents of your `OSSRH_USERNAME` secret, and the `MAVEN_PASSWORD` environment variable will be set with the contents of your `OSSRH_TOKEN` secret.

   For more information about using secrets in your workflow, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

## Publishing packages to GitHub Packages

Each time you create a new release, you can trigger a workflow to publish your package. The workflow in the example below runs when the `release` event triggers with type `created`. The workflow publishes the package to GitHub Packages if CI tests pass. For more information on the `release` event, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#release).

You can define a new Maven repository in the publishing block of your *build.gradle* that points to GitHub Packages. In that repository configuration, you can also take advantage of environment variables set in your CI workflow run. You can use the `GITHUB_ACTOR` environment variable as a username, and you can set the `GITHUB_TOKEN` environment variable with your `GITHUB_TOKEN` secret.

The `GITHUB_TOKEN` secret is set to an access token for the repository each time a job in a workflow begins. You should set the permissions for this access token in the workflow file to grant read access for the `contents` permission and write access for the `packages` permission. For more information, see [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication).

For example, if your organization is named "octocat" and your repository is named "hello-world", then the GitHub Packages configuration in *build.gradle* would look similar to the below example.

```groovy copy
plugins {
  ...
  id 'maven-publish'
}

publishing {
  ...

  repositories {
    maven {
      name = "GitHubPackages"
      url = "https://maven.pkg.github.com/octocat/hello-world"
      credentials {
        username = System.getenv("GITHUB_ACTOR")
        password = System.getenv("GITHUB_TOKEN")
      }
    }
  }
}
```

With this configuration, you can create a workflow that publishes your package to GitHub Packages by running the `gradle publish` command.

```yaml copy

# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Publish package to GitHub Packages
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-java@v4
        with:
          java-version: '11'
          distribution: 'temurin'
      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@017a9effdb900e5b5b2fddfb590a105619dca3c3 # v4.4.2

      - name: Publish package
        run: ./gradlew publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This workflow performs the following steps:

1. Checks out a copy of project's repository.
2. Sets up the Java JDK.
3. Sets up the Gradle environment. The [`gradle/actions/setup-gradle`](https://github.com/gradle/actions) action takes care of caching state between workflow runs, and provides a detailed summary of all Gradle executions.
4. Executes the Gradle `publish` task to publish to GitHub Packages. The `GITHUB_TOKEN` environment variable will be set with the content of the `GITHUB_TOKEN` secret. The `permissions` key specifies the access that the `GITHUB_TOKEN` secret will allow.

   For more information about using secrets in your workflow, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

## Publishing packages to the Maven Central Repository and GitHub Packages

You can publish your packages to both the Maven Central Repository and GitHub Packages by configuring each in your *build.gradle* file.

Ensure your *build.gradle* file includes a repository for both your GitHub repository and your Maven Central Repository provider.

For example, if you deploy to the Central Repository through the OSSRH hosting project, you might want to specify it in a distribution management repository with the `name` set to `OSSRH`. If you deploy to GitHub Packages, you might want to specify it in a distribution management repository with the `name` set to `GitHubPackages`.

If your organization is named "octocat" and your repository is named "hello-world", then the configuration in *build.gradle* would look similar to the below example.

```groovy copy
plugins {
  ...
  id 'maven-publish'
}

publishing {
  ...

  repositories {
    maven {
      name = "OSSRH"
      url = "https://oss.sonatype.org/service/local/staging/deploy/maven2/"
      credentials {
        username = System.getenv("MAVEN_USERNAME")
        password = System.getenv("MAVEN_PASSWORD")
      }
    }
    maven {
      name = "GitHubPackages"
      url = "https://maven.pkg.github.com/octocat/hello-world"
      credentials {
        username = System.getenv("GITHUB_ACTOR")
        password = System.getenv("GITHUB_TOKEN")
      }
    }
  }
}
```

With this configuration, you can create a workflow that publishes your package to both the Maven Central Repository and GitHub Packages by running the `gradle publish` command.

```yaml copy

# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Publish package to the Maven Central Repository and GitHub Packages
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v5
      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          java-version: '11'
          distribution: 'temurin'
      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@017a9effdb900e5b5b2fddfb590a105619dca3c3 # v4.4.2

      - name: Publish package
        run: ./gradlew publish
        env: 
          MAVEN_USERNAME: ${{ secrets.OSSRH_USERNAME }}
          MAVEN_PASSWORD: ${{ secrets.OSSRH_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This workflow performs the following steps:

1. Checks out a copy of project's repository.
2. Sets up the Java JDK.
3. Sets up the Gradle environment. The [`gradle/actions/setup-gradle`](https://github.com/gradle/actions) action takes care of caching state between workflow runs, and provides a detailed summary of all Gradle executions.
4. Executes the Gradle `publish` task to publish to the `OSSRH` Maven repository and GitHub Packages. The `MAVEN_USERNAME` environment variable will be set with the contents of your `OSSRH_USERNAME` secret, and the `MAVEN_PASSWORD` environment variable will be set with the contents of your `OSSRH_TOKEN` secret. The `GITHUB_TOKEN` environment variable will be set with the content of the `GITHUB_TOKEN` secret. The `permissions` key specifies the access that the `GITHUB_TOKEN` secret will allow.

   For more information about using secrets in your workflow, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).
---

# Publishing Java packages with Maven

In this tutorial, you'll learn how to use Maven to publish Java packages to a registry as part of your continuous integration (CI) workflow.

## Introduction

This guide shows you how to create a workflow that publishes Java packages to GitHub Packages and the Maven Central Repository. With a single workflow, you can publish packages to a single repository or to multiple repositories.

> \[!WARNING] The examples used in this guide refer to the Legacy OSSRH service. See [Publishing](https://central.sonatype.org/faq/what-is-different-between-central-portal-and-legacy-ossrh/#publishing) in the Maven Central Repository documentation.

## Prerequisites

We recommend that you have a basic understanding of workflow files and configuration options. For more information, see [Writing workflows](/en/actions/learn-github-actions).

For more information about creating a CI workflow for your Java project with Maven, see [Building and testing Java with Maven](/en/actions/automating-builds-and-tests/building-and-testing-java-with-maven).

You may also find it helpful to have a basic understanding of the following:

* [Working with the Apache Maven registry](/en/packages/working-with-a-github-packages-registry/working-with-the-apache-maven-registry)
* [Store information in variables](/en/actions/learn-github-actions/variables)
* [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions)
* [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication)

## About package configuration

The `groupId` and `artifactId` fields in the *pom.xml* file create a unique identifier for your package that registries use to link your package to a registry. For more information see [Guide to uploading artifacts to the Central Repository](https://maven.apache.org/repository/guide-central-repository-upload.html) in the Apache Maven documentation.

> \[!WARNING] Your Apache Maven package must follow the naming convention, and therefore the `artifactId` field should only contain lowercase letters, digits, or hyphens. For more information, see [Naming convention of Maven coordinates](https://maven.apache.org/guides/mini/guide-naming-conventions.html) in the maven.apache.org documentation. If you use uppercase letters in the artifact name, you'll get a *422 Unprocessable Entity* response.

The *pom.xml* file also contains configuration for the distribution management repositories that Maven will deploy packages to. Each repository must have a name and a deployment URL. Authentication for these repositories can be configured in the *.m2/settings.xml* file in the home directory of the user running Maven.

You can use the `setup-java` action to configure the deployment repository as well as authentication for that repository. For more information, see [`setup-java`](https://github.com/actions/setup-java).

## Publishing packages to the Maven Central Repository

Each time you create a new release, you can trigger a workflow to publish your package. The workflow in the example below runs when the `release` event triggers with type `created`. The workflow publishes the package to the Maven Central Repository if CI tests pass. For more information on the `release` event, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#release).

In this workflow, you can use the `setup-java` action. This action installs the given version of the JDK into the `PATH`, but it also configures a Maven *settings.xml* for publishing packages. By default, the settings file will be configured for GitHub Packages, but it can be configured to deploy to another package registry, such as the Maven Central Repository. If you already have a distribution management repository configured in *pom.xml*, then you can specify that `id` during the `setup-java` action invocation.

For example, if you were deploying to the Maven Central Repository through the OSSRH hosting project, your *pom.xml* could specify a distribution management repository with the `id` of `ossrh`.

```xml copy
<project ...>
  ...
  <distributionManagement>
    <repository>
      <id>ossrh</id>
      <name>Central Repository OSSRH</name>
      <url>https://oss.sonatype.org/service/local/staging/deploy/maven2/</url>
    </repository>
  </distributionManagement>
</project>
```

With this configuration, you can create a workflow that publishes your package to the Maven Central Repository by specifying the repository management `id` to the `setup-java` action. You’ll also need to provide environment variables that contain the username and password to authenticate to the repository.

In the deploy step, you’ll need to set the environment variables to the username that you authenticate with to the repository, and to a secret that you’ve configured with the password or token to authenticate with. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

```yaml copy
name: Publish package to the Maven Central Repository
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Set up Maven Central Repository
        uses: actions/setup-java@v4
        with:
          java-version: '11'
          distribution: 'temurin'
          server-id: ossrh
          server-username: MAVEN_USERNAME
          server-password: MAVEN_PASSWORD
      - name: Publish package
        run: mvn --batch-mode deploy
        env:
          MAVEN_USERNAME: ${{ secrets.OSSRH_USERNAME }}
          MAVEN_PASSWORD: ${{ secrets.OSSRH_TOKEN }}
```

This workflow performs the following steps:

1. Checks out a copy of project's repository.
2. Sets up the Java JDK, and also configures the Maven *settings.xml* file to add authentication for the `ossrh` repository using the `MAVEN_USERNAME` and `MAVEN_PASSWORD` environment variables.
3. Runs the `mvn --batch-mode deploy` command to publish to the `ossrh` repository. The `MAVEN_USERNAME` environment variable will be set with the contents of your `OSSRH_USERNAME` secret, and the `MAVEN_PASSWORD` environment variable will be set with the contents of your `OSSRH_TOKEN` secret.

   For more information about using secrets in your workflow, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

## Publishing packages to GitHub Packages

Each time you create a new release, you can trigger a workflow to publish your package. The workflow in the example below runs when the `release` event triggers with type `created`. The workflow publishes the package to GitHub Packages if CI tests pass. For more information on the `release` event, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#release).

In this workflow, you can use the `setup-java` action. This action installs the given version of the JDK into the `PATH`, and also sets up a Maven *settings.xml* for publishing the package to GitHub Packages. The generated *settings.xml* defines authentication for a server with an `id` of `github`, using the `GITHUB_ACTOR` environment variable as the username and the `GITHUB_TOKEN` environment variable as the password. The `GITHUB_TOKEN` environment variable is assigned the value of the special `GITHUB_TOKEN` secret.

The `GITHUB_TOKEN` secret is set to an access token for the repository each time a job in a workflow begins. You should set the permissions for this access token in the workflow file to grant read access for the `contents` permission and write access for the `packages` permission. For more information, see [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication).

For a Maven-based project, you can make use of these settings by creating a distribution repository in your *pom.xml* file with an `id` of `github` that points to your GitHub Packages endpoint.

For example, if your organization is named "octocat" and your repository is named "hello-world", then the GitHub Packages configuration in *pom.xml* would look similar to the below example.

```xml copy
<project ...>
  ...
  <distributionManagement>
    <repository>
      <id>github</id>
      <name>GitHub Packages</name>
      <url>https://maven.pkg.github.com/octocat/hello-world</url>
    </repository>
  </distributionManagement>
</project>
```

With this configuration, you can create a workflow that publishes your package to GitHub Packages by making use of the automatically generated *settings.xml*.

```yaml copy
name: Publish package to GitHub Packages
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-java@v4
        with:
          java-version: '11'
          distribution: 'temurin'
      - name: Publish package
        run: mvn --batch-mode deploy
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This workflow performs the following steps:

1. Checks out a copy of project's repository.
2. Sets up the Java JDK, and also automatically configures the Maven *settings.xml* file to add authentication for the `github` Maven repository to use the `GITHUB_TOKEN` environment variable.
3. Runs the `mvn --batch-mode deploy` command to publish to GitHub Packages. The `GITHUB_TOKEN` environment variable will be set with the contents of the `GITHUB_TOKEN` secret. The `permissions` key specifies the access granted to the `GITHUB_TOKEN`.

   For more information about using secrets in your workflow, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

## Publishing packages to the Maven Central Repository and GitHub Packages

You can publish your packages to both the Maven Central Repository and GitHub Packages by using the `setup-java` action for each registry.

Ensure your *pom.xml* file includes a distribution management repository for both your GitHub repository and your Maven Central Repository provider. For example, if you deploy to the Central Repository through the OSSRH hosting project, you might want to specify it in a distribution management repository with the `id` set to `ossrh`, and you might want to specify GitHub Packages in a distribution management repository with the `id` set to `github`.

```yaml copy
name: Publish package to the Maven Central Repository and GitHub Packages
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v5
      - name: Set up Java for publishing to Maven Central Repository
        uses: actions/setup-java@v4
        with:
          java-version: '11'
          distribution: 'temurin'
          server-id: ossrh
          server-username: MAVEN_USERNAME
          server-password: MAVEN_PASSWORD
      - name: Publish to the Maven Central Repository
        run: mvn --batch-mode deploy
        env:
          MAVEN_USERNAME: ${{ secrets.OSSRH_USERNAME }}
          MAVEN_PASSWORD: ${{ secrets.OSSRH_TOKEN }}
      - name: Set up Java for publishing to GitHub Packages
        uses: actions/setup-java@v4
        with:
          java-version: '11'
          distribution: 'temurin'
      - name: Publish to GitHub Packages
        run: mvn --batch-mode deploy
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This workflow calls the `setup-java` action twice. Each time the `setup-java` action runs, it overwrites the Maven *settings.xml* file for publishing packages. For authentication to the repository, the *settings.xml* file references the distribution management repository `id`, and the username and password.

This workflow performs the following steps:

1. Checks out a copy of project's repository.
2. Calls `setup-java` the first time. This configures the Maven *settings.xml* file for the `ossrh` repository, and sets the authentication options to environment variables that are defined in the next step.
3. Runs the `mvn --batch-mode deploy` command to publish to the `ossrh` repository. The `MAVEN_USERNAME` environment variable will be set with the contents of your `OSSRH_USERNAME` secret, and the `MAVEN_PASSWORD` environment variable will be set with the contents of your `OSSRH_TOKEN` secret.
4. Calls `setup-java` the second time. This automatically configures the Maven *settings.xml* file for GitHub Packages.
5. Runs the `mvn --batch-mode deploy` command to publish to GitHub Packages. The `GITHUB_TOKEN` environment variable will be set with the contents of the `GITHUB_TOKEN` secret. The `permissions` key specifies the access granted to the `GITHUB_TOKEN`.

   For more information about using secrets in your workflow, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).
---

# Publishing Node.js packages

In this tutorial, you'll learn how to publish Node.js packages to a registry as part of your continuous integration (CI) workflow.

## Introduction

This guide shows you how to create a workflow that publishes Node.js packages to the GitHub Packages and npm registries after continuous integration (CI) tests pass.

## Prerequisites

We recommend that you have a basic understanding of workflow configuration options and how to create a workflow file. For more information, see [Writing workflows](/en/actions/learn-github-actions).

For more information about creating a CI workflow for your Node.js project, see [Building and testing Node.js](/en/actions/automating-builds-and-tests/building-and-testing-nodejs).

You may also find it helpful to have a basic understanding of the following:

* [Working with the npm registry](/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
* [Store information in variables](/en/actions/learn-github-actions/variables)
* [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions)
* [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication)

## About package configuration

The `name` and `version` fields in the `package.json` file create a unique identifier that registries use to link your package to a registry. You can add a summary for the package listing page by including a `description` field in the `package.json` file. For more information, see [Creating a package.json file](https://docs.npmjs.com/creating-a-package-json-file) and [Creating Node.js modules](https://docs.npmjs.com/creating-node-js-modules) in the npm documentation.

When a local `.npmrc` file exists and has a `registry` value specified, the `npm publish` command uses the registry configured in the `.npmrc` file. You can use the `setup-node` action to create a local `.npmrc` file on the runner that configures the default registry and scope. The `setup-node` action also accepts an authentication token as input, used to access private registries or publish node packages. For more information, see [`setup-node`](https://github.com/actions/setup-node/).

You can specify the Node.js version installed on the runner using the `setup-node` action.

If you add steps in your workflow to configure the `publishConfig` fields in your `package.json` file, you don't need to specify the registry-url using the `setup-node` action, but you will be limited to publishing the package to one registry. For more information, see [publishConfig](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#publishconfig) in the npm documentation.

## Publishing packages to the npm registry

You can trigger a workflow to publish your package every time you publish a new release. The process in the following example is executed when the release event of type `published` is triggered. If the CI tests pass, the process uploads the package to the npm registry. For more information, see [Managing releases in a repository](/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release).

To perform authenticated operations against the npm registry in your workflow, you'll need to store your npm authentication token as a secret. For example, create a repository secret called `NPM_TOKEN`. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

By default, npm uses the `name` field of the `package.json` file to determine the name of your published package. When publishing to a global namespace, you only need to include the package name. For example, you would publish a package named `my-package` to `https://www.npmjs.com/package/my-package`.

If you're publishing a package that includes a scope prefix, include the scope in the name of your `package.json` file. For example, if your npm scope prefix is "octocat" and the package name is "hello-world", the `name` in your `package.json` file should be `@octocat/hello-world`. If your npm package uses a scope prefix and the package is public, you need to use the option `npm publish --access public`. This is an option that npm requires to prevent someone from publishing a private package unintentionally.

If you would like to publish your package with provenance, include the `--provenance` flag with your `npm publish` command. This allows you to publicly and verifiably establish where and how your package was built, which increases supply chain security for people who consume your package. For more information, see [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements) in the npm documentation.

This example stores the `NPM_TOKEN` secret in the `NODE_AUTH_TOKEN` environment variable. When the `setup-node` action creates an `.npmrc` file, it references the token from the `NODE_AUTH_TOKEN` environment variable.

```yaml copy
name: Publish Package to npmjs
on:
  release:
    types: [published]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v5
      # Setup .npmrc file to publish to npm
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

In the example above, the `setup-node` action creates an `.npmrc` file on the runner with the following contents:

```shell
//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
registry=https://registry.npmjs.org/
always-auth=true
```

Please note that you need to set the `registry-url` to `https://registry.npmjs.org/` in `setup-node` to properly configure your credentials.

## Publishing packages to GitHub Packages

You can trigger a workflow to publish your package every time you publish a new release. The process in the following example is executed when the release event of type `published` is triggered. If the CI tests pass, the process uploads the package to GitHub Packages. For more information, see [Managing releases in a repository](/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release).

### Configuring the destination repository

Linking your package to GitHub Packages using the `repository` key is optional. If you choose not to provide the `repository` key in your `package.json` file, then your package will not be linked to a repository when it is published, but you can choose to connect the package to a repository later.

If you do provide the `repository` key in your `package.json` file, then the repository in that key is used as the destination npm registry for GitHub Packages. For example, publishing the below `package.json` results in a package named `my-package` published to the `octocat/my-other-repo` GitHub repository.

```json
{
  "name": "@octocat/my-package",
  "repository": {
    "type": "git",
    "url": "https://github.com/octocat/my-other-repo.git"
  },
}
```

### Authenticating to the destination repository

To perform authenticated operations against the GitHub Packages registry in your workflow, you can use the `GITHUB_TOKEN`. The `GITHUB_TOKEN` secret is set to an access token for the repository each time a job in a workflow begins. You should set the permissions for this access token in the workflow file to grant read access for the `contents` permission and write access for the `packages` permission. For more information, see [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication).

If you want to publish your package to a different repository, you must use a personal access token (classic) that has permission to write to packages in the destination repository. For more information, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) and [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

### Example workflow

This example stores the `GITHUB_TOKEN` secret in the `NODE_AUTH_TOKEN` environment variable. When the `setup-node` action creates an `.npmrc` file, it references the token from the `NODE_AUTH_TOKEN` environment variable.

```yaml copy
name: Publish package to GitHub Packages
on:
  release:
    types: [published]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v5
      # Setup .npmrc file to publish to GitHub Packages
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://npm.pkg.github.com'
          # Defaults to the user or organization that owns the workflow file
          scope: '@octocat'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The `setup-node` action creates an `.npmrc` file on the runner. When you use the `scope` input to the `setup-node` action, the `.npmrc` file includes the scope prefix. By default, the `setup-node` action sets the scope in the `.npmrc` file to the account that contains that workflow file.

```shell
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
@octocat:registry=https://npm.pkg.github.com
always-auth=true
```

## Publishing packages using Yarn

If you use the Yarn package manager, you can install and publish packages using Yarn.

```yaml copy
name: Publish Package to npmjs
on:
  release:
    types: [published]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      # Setup .npmrc file to publish to npm
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
          # Defaults to the user or organization that owns the workflow file
          scope: '@octocat'
      - run: yarn
      - run: yarn npm publish // for Yarn version 1, use `yarn publish` instead
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

To authenticate with the registry during publishing, ensure your authentication token is also defined in your `yarnrc.yml` file. For more information, see the [Settings](https://yarnpkg.com/configuration/yarnrc#npmAuthToken) article in the Yarn documentation.