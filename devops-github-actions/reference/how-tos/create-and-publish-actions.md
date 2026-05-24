# Create And Publish Actions

---

# Creating a third party CLI action

Learn how to develop an action to set up a CLI on GitHub Actions runners.

## Introduction

You can write an action to provide a way for users to access your servers via a configured CLI environment on GitHub Actions runners.

Your action should:

* Make it simple for users to specify the version of the CLI to install
* Support multiple operating systems
* Run in an efficient fashion to minimize run-time and associated costs
* Work across GitHub-hosted and self-hosted runners
* Leverage community tooling when possible

This article will demonstrate how to write an action that retrieves a specific version of your CLI, installs it, adds it to the path, and (optionally) caches it. This type of action (an action that sets up a tool) is often named `setup-$TOOL`.

## Prerequisites

You should have an understanding of how to write a custom action. For more information, see [Managing custom actions](/en/actions/how-tos/creating-and-publishing-actions/managing-custom-actions).

## Example

The following script demonstrates how you can get a user-specified version as input, download and extract the specific version of your CLI, then add the CLI to the path.

GitHub provides [`actions/toolkit`](https://github.com/actions/toolkit), which is a set of packages that helps you create actions. This example uses the [`actions/core`](https://github.com/actions/toolkit/tree/main/packages/core) and [`actions/tool-cache`](https://github.com/actions/toolkit/tree/main/packages/tool-cache) packages.

```javascript copy
const core = require('@actions/core');
const tc = require('@actions/tool-cache');

async function setup() {
  // Get version of tool to be installed
  const version = core.getInput('version');

  // Download the specific version of the tool, e.g. as a tarball
  const pathToTarball = await tc.downloadTool(getDownloadURL());

  // Extract the tarball onto the runner
  const pathToCLI = await tc.extractTar(pathToTarball);

  // Expose the tool by adding it to the PATH
  core.addPath(pathToCLI)
}

module.exports = setup
```

To use this script, replace `getDownloadURL` with a function that downloads your CLI. You will also need to create an actions metadata file (`action.yml`) that accepts a `version` input and that runs this script. For full details about how to create an action, see [Creating a JavaScript action](/en/actions/creating-actions/creating-a-javascript-action).

## Further reading

This pattern is employed in several actions. For more examples, see:

* [`ruby/setup-ruby`](https://github.com/ruby/setup-ruby)
* [`google-github-actions/setup-gcloud`](https://github.com/google-github-actions/setup-gcloud)
* [`hashicorp/setup-terraform`](https://github.com/hashicorp/setup-terraform)
---

# Managing custom actions

Learn how to create and manage your own actions, and customize actions shared by the GitHub community.

## Choosing a location for your action

If you're developing an action for other people to use, we recommend keeping the action in its own repository instead of bundling it with other application code. This allows you to version, track, and release the action just like any other software.

Storing an action in its own repository makes it easier for the GitHub community to discover the action, narrows the scope of the code base for developers fixing issues and extending the action, and decouples the action's versioning from the versioning of other application code.

If you're building an action that you don't plan to make available to others, you  can store the action's files in any location in your repository. If you plan to combine action, workflow, and application code in a single repository, we recommend storing actions in the `.github` directory. For example, `.github/actions/action-a` and `.github/actions/action-b`.

## Ensuring compatibility with other platforms

Many people access GitHub at a domain other than GitHub.com, such as GHE.com or a custom domain for GitHub Enterprise Server.

To ensure that your action is compatible with other platforms, do not use any hard-coded references to API URLs such as `https://api.github.com`. Instead, you can:

* Use environment variables (see [Variables reference](/en/actions/reference/variables-reference#default-environment-variables)):

  * For the REST API, use the `GITHUB_API_URL` environment variable.
  * For GraphQL, use the `GITHUB_GRAPHQL_URL` environment variable.

* Use a toolkit such as [`@actions/github`](https://github.com/actions/toolkit/tree/main/packages/github), which can automatically set the correct URLs.

## Using release management for actions

If you're developing an action for other people to use, we recommend using release management to control how you distribute updates. Users can expect an action's patch version to include necessary critical fixes and security patches, while still remaining compatible with their existing workflows. You should consider releasing a new major version whenever your changes affect compatibility.

Under this release management approach, users should not be referencing an action's default branch, as it's likely to contain the latest code and consequently might be unstable. Instead, you can recommend that your users specify a major version when using your action, and only direct them to a more specific version if they encounter issues.

To use a specific action version, users can configure their GitHub Actions workflow to target a tag, a commit's SHA, or a branch named for a release.

### Using tags for release management

> \[!NOTE] If you have enabled immutable releases to help prevent supply chain attacks and accidental changes to your releases, instead see [Using immutable releases and tags to manage your action's releases](/en/actions/how-tos/create-and-publish-actions/using-immutable-releases-and-tags-to-manage-your-actions-releases).

We recommend using tags for actions release management. Using this approach, your users can easily distinguish between major and minor versions:

1. Develop and validate a release on a release branch (for example, `release/v1`).
2. Create a release with a release tag using semantic versioning (for example, `v1.0.1`). For more information, see [Managing releases in a repository](/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).
3. Move the major version tag (for example, `v1`) to point to the Git ref of the current release. For more information, see [Git basics - tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging).
4. Introduce a new major version tag (for example, `v2`) for changes that will break existing workflows, such as changing an action's inputs.

#### Syntax for referencing tags

This example demonstrates how a user can reference a major version tag:

```yaml
steps:
    - uses: actions/javascript-action@v1
```

This example demonstrates how a user can reference a specific patch release tag:

```yaml
steps:
    - uses: actions/javascript-action@v1.0.1
```

### Using branches for release management

If you prefer to use branch names for release management, this example demonstrates how to reference a named branch:

```yaml
steps:
    - uses: actions/javascript-action@v1-beta
```

### Using a commit's SHA for release management

Each Git commit receives a calculated SHA value, which is unique and immutable. Your action's users might prefer to rely on a commit's SHA value, as this approach can be more reliable than specifying a tag, which could be deleted or moved. However, this means that users will not receive further updates made to the action. You must use a commit's full SHA value, and not an abbreviated value.

```yaml
steps:
    - uses: actions/javascript-action@a824008085750b8e136effc585c3cd6082bd575f
```

## Creating a README file for your action

We recommend creating a README file to help people learn how to use your action. You can include this information in your `README.md`:

* A detailed description of what the action does
* Required input and output arguments
* Optional input and output arguments
* Secrets the action uses
* Environment variables the action uses
* An example of how to use your action in a workflow
---

# Publishing actions in GitHub Marketplace

You can publish actions in GitHub Marketplace and share actions you've created with the GitHub community.

## Prerequisites

> \[!NOTE]
> You must accept the terms of service to publish actions in GitHub Marketplace.

Before you can publish an action, you'll need to create an action in your repository. For more information, see [Reusing automations](/en/actions/creating-actions).

When you plan to publish your action to GitHub Marketplace, you'll need to ensure that the repository only includes the metadata file, code, and files necessary for the action. Creating a single repository for the action allows you to tag, release, and package the code in a single unit. GitHub also uses the action's metadata on your GitHub Marketplace page.

Actions are published to GitHub Marketplace immediately and aren't reviewed by GitHub as long as they meet these requirements:

* The action must be in a public repository.
* Each repository must contain a single action metadata file (`action.yml` or `action.yaml`) at the root.
  * Repositories may include other actions metadata files in sub-folders, but they will not be automatically listed in the marketplace.
* Each repository must *not* contain any workflow files.
* The `name` in the action's metadata file must be unique.
  * The `name` cannot match an existing action name published on GitHub Marketplace.
  * The `name` cannot match a user or organization on GitHub, unless the user or organization owner is publishing the action. For example, only the GitHub organization can publish an action named `github`.
  * The `name` cannot match an existing GitHub Marketplace category.
  * GitHub reserves the names of GitHub features.

## Publishing an action

You can add the action you've created to GitHub Marketplace by tagging it as a new release and publishing it.

To draft a new release and publish the action to GitHub Marketplace, follow these instructions:

1. On GitHub, navigate to the main page of the repository.

2. Navigate to the action metadata file in your repository (`action.yml`), and you'll see a banner to publish the action to GitHub Marketplace. Click **Draft a release**.

3. Under "Release Action", select **Publish this Action to the GitHub Marketplace**.

   > \[!NOTE]
   > The "Publish" checkbox is disabled if the account that owns the repository has not yet accepted the GitHub Marketplace Developer Agreement. If you own the repository or are an organization owner, click the link to "accept the GitHub Marketplace Developer Agreement", then accept the agreement. If there is no link, send the organization owner a link to this "Release Action" page and ask them to accept the agreement.

4. If the labels in your metadata file contain any problems, you will see an error message or a warning message. Address them by updating your metadata file. Once complete, you will see an "Everything looks good!" message.

5. Select the **Primary Category** dropdown menu and click a category that will help people find your action in GitHub Marketplace.

6. Optionally, select the **Another Category** dropdown menu and click a secondary category.

7. In the tag field, type a version for your action. This helps people know what changes or features the release includes. People will see the version in the action's dedicated GitHub Marketplace page.

8. In the title field, type a release title.

9. Complete all other fields and click **Publish release**. Publishing requires you to use two-factor authentication. For more information, see [Configuring two-factor authentication](/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication).

## Removing an action from GitHub Marketplace

To remove a published action from GitHub Marketplace, you'll need to update each published release. Perform the following steps for each release of the action you've published to GitHub Marketplace.

1. On GitHub, navigate to the main page of the repository.
2. To the right of the list of files, click **Releases**.

   ![Screenshot of the main page of a repository. A link, labeled "Releases", is highlighted with an orange outline.](/assets/images/help/releases/release-link.png)
3. Next to the release you want to edit, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-pencil" aria-label="Edit" role="img"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"></path></svg>.

   ![Screenshot of a release in the releases list. A pencil icon is highlighted with an orange outline.](/assets/images/help/releases/edit-release-pencil.png)
4. Select **Publish this action to the GitHub Marketplace** to remove the check from the box.
5. Click **Update release** at the bottom of the page.

## Transferring an action repository

You can transfer an action repository to another user or organization. For more information, see [Transferring a repository](/en/repositories/creating-and-managing-repositories/transferring-a-repository).

When a repository admin transfers an action repository, GitHub automatically creates a redirect from the previous URL to the new URL, meaning workflows that use the affected action do not need to be updated.

Actions published on GitHub Marketplace are linked to a repository by their unique `name` identifier, meaning you can publish new releases of an action from the transferred repository under the same GitHub Marketplace listing. If an action repository is deleted, the GitHub Marketplace listing is also deleted, and the unique `name` identifier becomes available.

> \[!NOTE]
> The "Verified" badge seen on an organization's GitHub profile is different from the verified creator badge on GitHub Marketplace. If you transfer an action repository, the GitHub Marketplace listing will lose the verified creator badge unless the new owner is also a verified creator.

## About badges in GitHub Marketplace

Actions with the <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-verified" aria-label="The verified badge" role="img"><path d="m9.585.52.929.68c.153.112.331.186.518.215l1.138.175a2.678 2.678 0 0 1 2.24 2.24l.174 1.139c.029.187.103.365.215.518l.68.928a2.677 2.677 0 0 1 0 3.17l-.68.928a1.174 1.174 0 0 0-.215.518l-.175 1.138a2.678 2.678 0 0 1-2.241 2.241l-1.138.175a1.17 1.17 0 0 0-.518.215l-.928.68a2.677 2.677 0 0 1-3.17 0l-.928-.68a1.174 1.174 0 0 0-.518-.215L3.83 14.41a2.678 2.678 0 0 1-2.24-2.24l-.175-1.138a1.17 1.17 0 0 0-.215-.518l-.68-.928a2.677 2.677 0 0 1 0-3.17l.68-.928c.112-.153.186-.331.215-.518l.175-1.14a2.678 2.678 0 0 1 2.24-2.24l1.139-.175c.187-.029.365-.103.518-.215l.928-.68a2.677 2.677 0 0 1 3.17 0ZM7.303 1.728l-.927.68a2.67 2.67 0 0 1-1.18.489l-1.137.174a1.179 1.179 0 0 0-.987.987l-.174 1.136a2.677 2.677 0 0 1-.489 1.18l-.68.928a1.18 1.18 0 0 0 0 1.394l.68.927c.256.348.424.753.489 1.18l.174 1.137c.078.509.478.909.987.987l1.136.174a2.67 2.67 0 0 1 1.18.489l.928.68c.414.305.979.305 1.394 0l.927-.68a2.67 2.67 0 0 1 1.18-.489l1.137-.174a1.18 1.18 0 0 0 .987-.987l.174-1.136a2.67 2.67 0 0 1 .489-1.18l.68-.928a1.176 1.176 0 0 0 0-1.394l-.68-.927a2.686 2.686 0 0 1-.489-1.18l-.174-1.137a1.179 1.179 0 0 0-.987-.987l-1.136-.174a2.677 2.677 0 0 1-1.18-.489l-.928-.68a1.176 1.176 0 0 0-1.394 0ZM11.28 6.78l-3.75 3.75a.75.75 0 0 1-1.06 0L4.72 8.78a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L7 8.94l3.22-3.22a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path></svg>, or verified creator badge, indicate that GitHub has verified the creator of the action as a partner organization. Partners can email <a href="mailto:partnerships@github.com"><partnerships@github.com></a> to request the verified creator badge.

![Screenshot of GitHub Actions with the verified creator badge.](/assets/images/marketplace/verified-creator-badge-for-actions.png)
---

# Releasing and maintaining actions

You can leverage automation and open source best practices to release and maintain actions.

## Introduction

After you create an action, you'll want to continue releasing new features while working with community contributions. This tutorial describes an example process you can follow to release and maintain actions in open source. The example:

* Leverages GitHub Actions for continuous integration, dependency updates, release management, and task automation.
* Provides confidence through automated tests and build badges.
* Indicates how the action can be used, ideally as part of a broader workflow.
* Signal what type of community contributions you welcome. (For example, issues, pull requests, or vulnerability reports.)

For an applied example of this process, see [actions/javascript-action](https://github.com/actions/javascript-action).

## Developing and releasing actions

In this section, we discuss an example process for developing and releasing actions and show how to use GitHub Actions to automate the process.

### About JavaScript actions

JavaScript actions are Node.js repositories with metadata. However, JavaScript actions have additional properties compared to traditional Node.js projects:

* Dependent packages are committed alongside the code, typically in a compiled and minified form. This means that automated builds and secure community contributions are important.

* Tagged releases can be published directly to GitHub Marketplace and consumed by workflows across GitHub.

* Many actions make use of GitHub's APIs and third party APIs, so we encourage robust end-to-end testing.

### Setting up GitHub Actions workflows

To support the developer process in the next section, add two GitHub Actions workflows to your repository:

1. Add a workflow that triggers when a commit is pushed to a feature branch or to `main` or when a pull request is created. Configure the workflow to run your unit and integration tests. For an example, see [this workflow](https://github.com/actions/javascript-action/blob/main/.github/workflows/ci.yml).
2. Add a workflow that triggers when a release is published or edited. Configure the workflow to ensure semantic tags are in place. You can use an action like [JasonEtco/build-and-tag-action](https://github.com/JasonEtco/build-and-tag-action) to compile and bundle the JavaScript and metadata file and force push semantic major, minor, and patch tags. For more information about semantic tags, see [About semantic versioning](https://docs.npmjs.com/about-semantic-versioning).

   > \[!NOTE]
   > If you enable immutable releases for your repository, you cannot use this action to force push tags tied to releases on GitHub. To learn how to manage your releases with immutable releases, see [Using immutable releases and tags to manage your action's releases](/en/actions/how-tos/create-and-publish-actions/using-immutable-releases-and-tags-to-manage-your-actions-releases).

### Example developer process

Here is an example process that you can follow to automatically run tests, create a release and publish to GitHub Marketplace, and publish your action.

1. Do feature work in branches per GitHub flow. For more information, see [GitHub flow](/en/get-started/using-github/github-flow).
   * Whenever a commit is pushed to the feature branch, your testing workflow will automatically run the tests.

2. Create pull requests to the `main` branch to initiate discussion and review, merging when ready.

   * When a pull request is opened, either from a branch or a fork, your testing workflow will again run the tests, this time with the merge commit.

   * **Note:** for security reasons, workflows triggered by `pull_request` from forks have restricted `GITHUB_TOKEN` permissions and do not have access to secrets. If your tests or other workflows triggered upon pull request require access to secrets, consider using a different event like a [manual trigger](/en/actions/using-workflows/events-that-trigger-workflows#manual-events) or a [`pull_request_target`](/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target). For more information, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#pull-request-events-for-forked-repositories).

3. Create a semantically tagged release.  You may also publish to GitHub Marketplace with a simple checkbox.  For more information, see [Managing releases in a repository](/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release) and [Publishing actions in GitHub Marketplace](/en/actions/creating-actions/publishing-actions-in-github-marketplace#publishing-an-action).

   * When a release is published or edited, your release workflow will automatically take care of compilation and adjusting tags.

   * We recommend creating releases using semantically versioned tags – for example, `v1.1.3` – and keeping major (`v1`) and minor (`v1.1`) tags current to the latest appropriate commit. For more information, see [Managing custom actions](/en/actions/how-tos/create-and-publish-actions/manage-custom-actions#using-release-management-for-actions) and [About semantic versioning](https://docs.npmjs.com/about-semantic-versioning).

### Results

Unlike some other automated release management strategies, this process intentionally does not commit dependencies to the `main` branch, only to the tagged release commits. By doing so, you encourage users of your action to reference named tags or `sha`s, and you help ensure the security of third party pull requests by doing the build yourself during a release.

Using semantic releases means that the users of your actions can pin their workflows to a version and know that they might continue to receive the latest stable, non-breaking features, depending on their comfort level.

## Working with the community

GitHub provides tools and guides to help you work with the open source community. Here are a few tools we recommend setting up for healthy bidirectional communication. By providing the following signals to the community, you encourage others to use, modify, and contribute to your action:

* Maintain a `README` with plenty of usage examples and guidance. For more information, see [About the repository README file](/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes).
* Include a workflow status badge in your `README` file. For more information, see [Adding a workflow status badge](/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge). Also visit [shields.io](https://shields.io/) to learn about other badges that you can add.
* Add community health files like `CODE_OF_CONDUCT`, `CONTRIBUTING`, and `SECURITY`. For more information, see [Creating a default community health file](/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file#supported-file-types).
* Keep issues current by utilizing actions like [actions/stale](https://github.com/actions/stale).
* Use GitHub's security features to communicate about vulnerabilities and how to fix them. For more information, see [Secure use reference](/en/actions/security-guides/using-githubs-security-features-to-secure-your-use-of-github-actions#protecting-actions-youve-created).

## Further reading

Examples where similar patterns are employed include:

* [github/super-linter](https://github.com/github/super-linter)
* [octokit/request-action](https://github.com/octokit/request-action)
* [actions/javascript-action](https://github.com/actions/javascript-action)
---

# Setting exit codes for actions

You can use exit codes to set the status of an action. GitHub displays statuses to indicate passing or failing actions.

## About exit codes

GitHub uses the exit code to set the action's check run status, which can be `success` or `failure`.

| Exit status                       | Check run status | Description                                                                                                                                                                                           |
| --------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`                               | `success`        | The action completed successfully and other tasks that depend on it can begin.                                                                                                                        |
| Nonzero value (any integer but 0) | `failure`        | Any other exit code indicates the action failed. When an action fails, all concurrent actions are canceled and future actions are skipped. The check run and check suite both get a `failure` status. |

## Setting a failure exit code in a JavaScript action

If you are creating a JavaScript action, you can use the actions toolkit [`@actions/core`](https://github.com/actions/toolkit/tree/main/packages/core) package to log a message and set a failure exit code. For example:

```javascript
try {
  // something
} catch (error) {
  core.setFailed(error.message);
}
```

For more information, see [Creating a JavaScript action](/en/actions/creating-actions/creating-a-javascript-action).

## Setting a failure exit code in a Docker container action

If you are creating a Docker container action, you can set a failure exit code in your `entrypoint.sh` script. For example:

```shell
if <condition> ; then
  echo "Game over!"
  exit 1
fi
```

For more information, see [Creating a Docker container action](/en/actions/creating-actions/creating-a-docker-container-action).
---

# Using immutable releases and tags to manage your action's releases

Learn how you can use a combination of immutable releases on GitHub and Git tags to manage your action's releases.

If you enable immutable releases on your action's repository, you can manage your action's releases as follows:

1. To start the release cycle, develop and validate a potential release for your action on a release branch.
2. Determine how you want to share your changes:
   * If you are ready to share an unchangeable version of your action, create a release on GitHub with a release-specific tag (for example, `v1.0.0`). See [Managing releases in a repository](/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release).
   * If you want to be able to update the Git tag of a release later, do not create a release on GitHub. Instead, create a tag as follows:
     * If your release contains breaking changes for existing workflows, create a major version tag (for example, `v1`).
     * If your release contains new backwards-compatible functionality, create a minor version tag (for example, `v1.1`).
     * If your release contains backwards-compatible bug fixes, create a patch version tag (for example, `v1.1.1`).
3. For Git tags that are not tied to a release on GitHub, ensure users have access to the latest compatible version of your action by updating them as follows:

   * For a major version, update the tag to point to the Git ref of the latest related minor version or patch version.
   * For a minor version, update the tag to point to the Git ref of the latest related patch version.

   To move an existing Git tag to the most recent commit, force push the tag with the following commands:

   ```bash copy
   git tag -f TAG-NAME
   git push -f --tags
   ```