# Workflows and Actions

---

# Concurrency

Learn about running workflows and jobs simultaneously.

By default, GitHub Actions allows multiple jobs within the same workflow, multiple workflow runs within the same repository, and multiple workflow runs across a repository owner's account to run concurrently. This means that multiple instances of the same workflow or job can run at the same time, performing the same steps.

GitHub Actions also allows you to disable concurrent execution. This can be useful for controlling your account’s or organization’s resources in situations where running multiple workflows or jobs at the same time could cause conflicts or consume more Actions minutes and storage than expected. For example, you might want to prevent multiple deployments from running at the same time, or cancel linters checking outdated commits.

To start controlling concurrency in your own workflows with the `concurrency` keyword, see [Control the concurrency of workflows and jobs](/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/control-the-concurrency-of-workflows-and-jobs).
---

# Contexts

Learn about contexts in GitHub Actions.

## About contexts

Contexts are a way to access information about workflow runs, variables, runner environments, jobs, and steps. Each context is an object that contains properties, which can be strings or other objects.

Contexts, objects, and properties will vary significantly under different workflow run conditions. For example, the `matrix` context is only populated for jobs in a [matrix](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix).

You can access contexts using the expression syntax. For more information, see [Evaluate expressions in workflows and actions](/en/actions/learn-github-actions/expressions).

`${{ <context> }}`

> \[!WARNING]
> When creating workflows and actions, you should always consider whether your code might execute untrusted input from possible attackers. Certain contexts should be treated as untrusted input, as an attacker could insert their own malicious content. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#understanding-the-risk-of-script-injections).

## Determining when to use contexts

GitHub Actions includes a collection of variables called *contexts* and a similar collection of variables called *default variables*. These variables are intended for use at different points in the workflow:

* **Default environment variables:** These environment variables exist only on the runner that is executing your job. For more information, see [Store information in variables](/en/actions/learn-github-actions/variables#default-environment-variables).
* **Contexts:** You can use most contexts at any point in your workflow, including when *default variables* would be unavailable. For example, you can use contexts with expressions to perform initial processing before the job is routed to a runner for execution; this allows you to use a context with the conditional `if` keyword to determine whether a step should run. Once the job is running, you can also retrieve context variables from the runner that is executing the job, such as `runner.os`. For details of where you can use various contexts within a workflow, see [Contexts reference](/en/actions/reference/accessing-contextual-information-about-workflow-runs#context-availability).

The following example demonstrates how these different types of variables can be used together in a job:

```yaml copy
name: CI
on: push
jobs:
  prod-check:
    if: ${{ github.ref == 'refs/heads/main' }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to production server on branch $GITHUB_REF"
```

In this example, the `if` statement checks the [`github.ref`](/en/actions/learn-github-actions/contexts#github-context) context to determine the current branch name; if the name is `refs/heads/main`, then the subsequent steps are executed. The `if` check is processed by GitHub Actions, and the job is only sent to the runner if the result is `true`. Once the job is sent to the runner, the step is executed and refers to the [`$GITHUB_REF`](/en/actions/learn-github-actions/variables#default-environment-variables) variable from the runner.
---

# About custom actions

Actions are individual tasks that you can combine to create jobs and customize your workflow. You can create your own actions, or use and customize actions shared by the GitHub community.

## About custom actions

You can create actions by writing custom code that interacts with your repository in any way you'd like, including integrating with GitHub's APIs and any publicly available third-party API. For example, an action can publish npm modules, send SMS alerts when urgent issues are created, or deploy production-ready code.

You can write your own actions to use in your workflow or share the actions you build with the GitHub community. To share actions you've built with everyone, your repository must be public.

Actions can run directly on a machine or in a Docker container. You can define an action's inputs, outputs, and environment variables.

## Types of actions

> \[!NOTE]
> You can build Docker container, JavaScript, and composite actions. Actions require a metadata file to define the inputs, outputs, and runs configuration for your action. Action metadata files use YAML syntax, and the metadata filename must be either `action.yml` or `action.yaml`. The preferred format is `action.yml`.

<div class="ghd-tool rowheaders">

| Type              | Linux                                                                                                                                                                                                                                                                                                                    | macOS                                                                                                                                                                                                                                                                                                                                                                                                                               | Windows                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker container  | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Supported" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg> | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-x" aria-label="Not supported" role="img"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg> | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-x" aria-label="Not supported" role="img"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg> |
| JavaScript        | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Supported" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg> | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Supported" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>                                                                                                            | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Supported" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>                                                                                                            |
| Composite Actions | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Supported" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg> | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Supported" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>                                                                                                            | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Supported" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>                                                                                                            |

</div>

### Docker container actions

Docker containers package the environment with the GitHub Actions code. This creates a more consistent and reliable unit of work because the consumer of the action does not need to worry about the tools or dependencies.

A Docker container allows you to use specific versions of an operating system, dependencies, tools, and code. For actions that must run in a specific environment configuration, Docker is an ideal option because you can customize the operating system and tools. Because of the latency to build and retrieve the container, Docker container actions are slower than JavaScript actions.

Docker container actions can only execute on runners with a Linux operating system. Self-hosted runners must use a Linux operating system and have Docker installed to run Docker container actions. For more information about the requirements of self-hosted runners, see [Self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners#requirements-for-self-hosted-runner-machines).

### JavaScript actions

JavaScript actions can run directly on a runner machine, and separate the action code from the environment used to run the code. Using a JavaScript action simplifies the action code and executes faster than a Docker container action.

To ensure your JavaScript actions are compatible with all GitHub-hosted runners (Ubuntu, Windows, and macOS), the packaged JavaScript code you write should be pure JavaScript and not rely on other binaries. JavaScript actions run directly on the runner and use binaries that already exist in the runner image.

If you're developing a Node.js project, the GitHub Actions Toolkit provides packages that you can use in your project to speed up development. For more information, see the [actions/toolkit](https://github.com/actions/toolkit) repository.

### Composite Actions

A *composite* action allows you to combine multiple workflow steps within one action. For example, you can use this feature to bundle together multiple run commands into an action, and then have a workflow that executes the bundled commands as a single step using that action. To see an example, check out [Creating a composite action](/en/actions/creating-actions/creating-a-composite-action).

## Next steps

To learn about how to manage your custom actions, see [Managing custom actions](/en/actions/how-tos/administering-github-actions/managing-custom-actions).
---

# Dependency caching

Learn about dependency caching for workflow speed and efficiency.

## About workflow dependency caching

Workflow runs often reuse the same outputs or downloaded dependencies from one run to another. For example, package and dependency management tools such as Maven, Gradle, npm, and Yarn keep a local cache of downloaded dependencies.

Jobs on GitHub-hosted runners start in a clean runner image and must download dependencies each time, causing increased network utilization, longer runtime, and increased cost. To help speed up the time it takes to recreate files like dependencies, GitHub can cache files you frequently use in workflows.

> \[!NOTE]
> When using self-hosted runners, caches from workflow runs are stored on GitHub-owned cloud storage. A customer-owned storage solution is only available with GitHub Enterprise Server.

## Artifacts versus dependency caching

Artifacts and caching are similar because they provide the ability to store files on GitHub, but each feature offers different use cases and cannot be used interchangeably.

* Use caching when you want to reuse files that don't change often between jobs or workflow runs, such as build dependencies from a package management system.
* Use artifacts when you want to save files produced by a job to view after a workflow run has ended, such as built binaries or build logs.

For more information on workflow run artifacts, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

## Next steps

To implement dependency caching in your workflows, see [Dependency caching reference](/en/actions/reference/dependency-caching-reference).
---

# Deployment environments

You can create and deploy to different environments.

Environments are used to describe a general deployment target like `production`, `staging`, or `development`. When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. You can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, gate deployments with custom deployment protection rules, or limit access to secrets. For more information about creating environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

Each job in a workflow can reference a single environment. Any protection rules configured for the environment must pass before a job referencing the environment is sent to a runner. The job can access the environment's secrets only after the job is sent to a runner.

When a workflow references an environment, the environment will appear in the repository's deployments. For more information about viewing current and previous deployments, see [Viewing deployment history](/en/actions/deployment/managing-your-deployments/viewing-deployment-history).
---

# Expressions

You can evaluate expressions in workflows and actions.

## About expressions

You can use expressions to programmatically set environment variables in workflow files and access contexts. An expression can be any combination of literal values, references to a context, or functions. You can combine literals, context references, and functions using operators. For more information about contexts, see [Contexts reference](/en/actions/learn-github-actions/contexts).

Expressions are commonly used with the conditional `if` keyword in a workflow file to determine whether a step should run. When an `if` conditional is `true`, the step will run.

You need to use specific syntax to tell GitHub to evaluate an expression rather than treat it as a string.

`${{ <expression> }}`

> \[!NOTE]
> The exception to this rule is when you are using expressions in an `if` clause, where, optionally, you can usually omit `${{` and `}}`. For more information about `if` conditionals, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idif).

> \[!WARNING]
> When creating workflows and actions, you should always consider whether your code might execute untrusted input from possible attackers. Certain contexts should be treated as untrusted input, as an attacker could insert their own malicious content. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#understanding-the-risk-of-script-injections).

### Example setting an environment variable

```yaml
env:
  MY_ENV_VAR: ${{ <expression> }}
```

## Further reading

For technical reference information about expressions you can use in workflows and actions, see [Evaluate expressions in workflows and actions](/en/actions/reference/evaluate-expressions-in-workflows-and-actions).
---

# Notifications for workflow runs

You can subscribe to notifications about workflow runs that you trigger.

If you enable email or web notifications for GitHub Actions, you'll receive a notification when any workflow runs that you've triggered have completed. The notification will include the workflow run's status (including successful, failed, neutral, and canceled runs). You can also choose to receive a notification only when a workflow run has failed. For more information about enabling or disabling notifications, see [About notifications](/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/about-notifications).

Notifications for scheduled workflows are sent to the user who initially created the workflow.

* If a different user updates the cron syntax, in the `schedule` event in the workflow file, subsequent notifications will be sent to that user instead.
* If a scheduled workflow is disabled and then re-enabled, notifications will be sent to the user who re-enabled the workflow rather than the user who last modified the cron syntax.

You can also see the status of workflow runs on a repository's Actions tab. For more information, see [Managing workflow runs](/en/actions/managing-workflow-runs).
---

# Reusing workflow configurations

Learn how to avoid duplication when creating a workflow.

## Reusable workflows

Rather than copying and pasting from one workflow to another, you can make workflows reusable. You and anyone with access to the reusable workflow can then call the reusable workflow from another workflow.

Reusing workflows avoids duplication. This makes workflows easier to maintain and allows you to create new workflows more quickly by building on the work of others, just as you do with actions. Workflow reuse also promotes best practice by helping you to use workflows that are well designed, have already been tested, and have been proven to be effective. Your organization can build up a library of reusable workflows that can be centrally maintained.

The diagram below shows an in-progress workflow run that uses a reusable workflow.

* After each of three build jobs on the left of the diagram completes successfully, a dependent job called "Deploy" is run.
* The "Deploy" job calls a reusable workflow that contains three jobs: "Staging", "Review", and "Production."
* The "Production" deployment job only runs after the "Staging" job has completed successfully.
* When a job targets an environment, the workflow run displays a progress bar that shows the number of steps in the job. In the diagram below, the "Production" job contains 8 steps, with step 6 currently being processed.
* Using a reusable workflow to run deployment jobs allows you to run those jobs for each build without duplicating code in workflows.

![Diagram of a workflow calling a reusable workflow.](/assets/images/help/actions/reusable-workflows-ci-cd.png)

A workflow that uses another workflow is referred to as a "caller" workflow. The reusable workflow is a "called" workflow. One caller workflow can use multiple called workflows. Each called workflow is referenced in a single line. The result is that the caller workflow file may contain just a few lines of YAML, but may perform a large number of tasks when it's run. When you reuse a workflow, the entire called workflow is used, just as if it was part of the caller workflow.

If you reuse a workflow from a different repository, any actions in the called workflow run as if they were part of the caller workflow. For example, if the called workflow uses `actions/checkout`, the action checks out the contents of the repository that hosts the caller workflow, not the called workflow.

You can view the reused workflows referenced in your GitHub Actions workflows as dependencies in the dependency graph of the repository containing your workflows. For more information, see “[About the dependency graph](/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph).”

### Reusable workflows versus composite actions

Reusable workflows and composite actions both help you avoid duplicating workflow content. Whereas reusable workflows allow you to reuse an entire workflow, with multiple jobs and steps, composite actions combine multiple steps that you can then run within a job step, just like any other action.

Let's compare some aspects of each solution:

* **Workflow jobs** - Composite actions contain a series of steps that are run as a single step within the caller workflow. Unlike reusable workflows, they cannot contain jobs.
* **Logging** - When a composite action runs, the log will show just the step in the caller workflow that ran the composite action, not the individual steps within the composite action. With reusable workflows, every job and step is logged separately.
* **Specifying runners** - Reusable workflows contain one or more jobs. As with all workflow jobs, the jobs in a reusable workflow specify the type of machine on which the job will run. Therefore, if the steps must be run on a type of machine that might be different from the machine chosen for the calling workflow job, then you should use a reusable workflow, not a composite action.
* **Passing output to steps** - A composite action is run as a step within a workflow job, and you can have multiple steps before or after the step that runs the composite action. Reusable workflows are called directly within a job, and not from within a job step. You can't add steps to a job after calling a reusable workflow, so you can't use `GITHUB_ENV` to pass values to subsequent job steps in the caller workflow.

### Key differences between reusable workflows and composite actions

| Reusable workflows                                                                           | Composite actions                                                                                                            |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| A YAML file, very similar to any standard workflow file                                      | An action containing a bundle of workflow steps                                                                              |
| Each reusable workflow is a single file in the `.github/workflows` directory of a repository | Each composite action is a separate repository, or a directory, containing an `action.yml` file and, optionally, other files |
| Called by referencing a specific YAML file                                                   | Called by referencing a repository or directory in which the action is defined                                               |
| Called directly within a job, not from a step                                                | Run as a step within a job                                                                                                   |
| Can contain multiple jobs                                                                    | Does not contain jobs                                                                                                        |
| Each step is logged in real-time                                                             | Logged as one step even if it contains multiple steps                                                                        |
| Can connect a maximum of ten levels of workflows                                             | Can be nested to have up to 10 composite actions in one workflow                                                             |
| Can use secrets                                                                              | Cannot use secrets                                                                                                           |
| Cannot be published to the [marketplace](https://github.com/marketplace?type=actions)        | Can be published to the [marketplace](https://github.com/marketplace?type=actions)                                           |

## Workflow templates

Workflow templates allow everyone in your organization who has permission to create workflows to do so more quickly and easily. When people create a new workflow, they can choose a workflow template and some or all of the work of writing the workflow will be done for them. Within a workflow template, you can also reference reusable workflows to make it easy for people to benefit from reusing centrally managed workflow code.

If you use a commit SHA when referencing the reusable workflow, you can ensure that everyone who reuses that workflow will always be using the same YAML code. However, if you reference a reusable workflow by a tag or branch, be sure that you can trust that version of the workflow. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#reusing-third-party-workflows).

GitHub offers workflow templates for a variety of languages and tooling. When you set up workflows in your repository, GitHub analyzes the code in your repository and recommends workflows based on the language and framework in your repository. For example, if you use Node.js, GitHub will suggest a workflow template file that installs your Node.js packages and runs your tests. You can search and filter to find relevant workflow templates.

GitHub provides ready-to-use workflow templates for the following high level categories:

* **Deployment (CD)**. For more information, see [Continuous deployment](/en/actions/deployment/about-deployments/about-continuous-deployment).

- **Security**. For more information, see [Configuring advanced setup for code scanning](/en/code-security/code-scanning/creating-an-advanced-setup-for-code-scanning/configuring-advanced-setup-for-code-scanning#configuring-code-scanning-using-third-party-actions).

* **Continuous Integration (CI)**. For more information, see [Continuous integration](/en/actions/automating-builds-and-tests/about-continuous-integration).
* **Automation**. Automation workflow templates offer solutions for automating workflows, such as triaging pull requests and applying a label based on the paths that are modified in the pull request, or greeting users who are first time contributors to the repository.

Use these workflows as a starting place to build your custom workflow or use them as-is. You can browse the full list of workflow templates in the [actions/starter-workflows](https://github.com/actions/starter-workflows) repository.

For more information, see [Creating workflow templates for your organization](/en/actions/using-workflows/creating-starter-workflows-for-your-organization).

## YAML anchors and aliases

You can use YAML anchors and aliases to reduce repetition in your workflows. An anchor (marked with `&`) identifies a piece of content that you want to reuse, while an alias (marked with `*`) repeats that content in another location. Think of an anchor as creating a named template and an alias as using that template. This is particularly useful when you have jobs or steps that share common configurations.

For reference information and examples, see [Reusing workflow configurations](/en/actions/reference/workflows-and-actions/reusing-workflow-configurations#yaml-anchors-and-aliases).

## Next steps

To start reusing your workflows, see [Reuse workflows](/en/actions/how-tos/sharing-automations/reuse-workflows).

To find information on the intricacies of reusing workflows, see [Reusing workflow configurations](/en/actions/reference/reusable-workflows-reference).
---

# Variables

Learn about variables in GitHub Actions workflows.

## About

Variables provide a way to store and reuse non-sensitive configuration information. You can store any configuration data such as compiler flags, usernames, or server names as variables. Variables are interpolated on the runner machine that runs your workflow. Commands that run in actions or workflow steps can create, read, and modify variables.

You can set your own custom variables or use the default environment variables that GitHub sets automatically.

You can set a custom variable in two ways.

* To define an environment variable for use in a single workflow, you can use the `env` key in the workflow file. For more information, see [Defining environment variables for a single workflow](/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#defining-environment-variables-for-a-single-workflow).
* To define a configuration variable across multiple workflows, you can define it at the organization, repository, or environment level. When creating a variable in an organization, you can use a policy to limit access by repository. For example, you can grant access to all repositories, or limit access to only private repositories or a specified list of repositories. For more information, see [Defining configuration variables for multiple workflows](/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#defining-configuration-variables-for-multiple-workflows).

> \[!WARNING]
> By default, variables render unmasked in your build outputs. If you need greater security for sensitive information, such as passwords, use secrets instead. For more information, see [Secrets](/en/actions/security-for-github-actions/security-guides/about-secrets).

For reference documentation, see [Variables reference](/en/actions/reference/variables-reference).
---

# Workflow artifacts

Learn about storing and sharing data as artifacts of GitHub Actions workflows.

## About workflow artifacts

An artifact is a file or collection of files produced during a workflow run. Artifacts allow you to persist data after a job has completed, and share that data with another job in the same workflow. For example, you can use artifacts to save your build and test output after a workflow run has ended.

GitHub provides two actions that you can use to upload and download build artifacts, [upload-artifact](https://github.com/actions/upload-artifact) and [download-artifact](https://github.com/actions/download-artifact).

Common artifacts include:

* Log files and core dumps
* Test results, failures, and screenshots
* Binary or compressed files
* Stress test performance output and code coverage results

## Artifacts versus dependency caching

Artifacts and caching are similar because they provide the ability to store files on GitHub, but each feature offers different use cases and cannot be used interchangeably.

* Use caching when you want to reuse files that don't change often between jobs or workflow runs, such as build dependencies from a package management system.
* Use artifacts when you want to save files produced by a job to view after a workflow run has ended, such as built binaries or build logs.

For more information on dependency caching, see [Dependency caching reference](/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows#comparing-artifacts-and-dependency-caching).

## Generating artifact attestations for builds

Artifact attestations enable you to create unfalsifiable provenance and integrity guarantees for the software you build. In turn, people who consume your software can verify where and how your software was built.

When you generate artifact attestations with your software, you create cryptographically signed claims that establish your build's provenance and include the following information:

* A link to the workflow associated with the artifact
* The repository, organization, environment, commit SHA, and triggering event for the artifact
* Other information from the OIDC token used to establish provenance. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

You can also generate artifact attestations that include an associated software bill of materials (SBOM). Associating your builds with a list of the open source dependencies used in them provides transparency and enables consumers to comply with data protection standards.

You can access attestations after a build run, underneath the list of the artifacts the build produced.

For more information, see [Using artifact attestations to establish provenance for builds](/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds).

## Artifacts from deleted workflow runs

When a workflow run is deleted all artifacts associated with the run are also deleted from storage. You can delete a workflow run using the GitHub Actions UI, the REST API, or using the GitHub CLI, see: [Deleting a workflow run](/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/deleting-a-workflow-run), [Delete a workflow run](/en/rest/actions/workflow-runs?apiVersion=2022-11-28#delete-a-workflow-run), or [gh run delete](https://cli.github.com/manual/gh_run_delete).
---

# Workflows

Get a high-level overview of GitHub Actions workflows, including triggers, syntax, and advanced features.

## About workflows

A **workflow** is a configurable automated process that will run one or more jobs. Workflows are defined by a YAML file checked in to your repository and will run when triggered by an event in your repository, or they can be triggered manually, or at a defined schedule.

Workflows are defined in the `.github/workflows` directory in a repository. A repository can have multiple workflows, each of which can perform a different set of tasks such as:

* Building and testing pull requests
* Deploying your application every time a release is created
* Adding a label whenever a new issue is opened

## Workflow basics

A workflow must contain the following basic components:

1. One or more *events* that will trigger the workflow.
2. One or more *jobs*, each of which will execute on a *runner* machine and run a series of one or more *steps*.
3. Each step can either run a script that you define or run an action, which is a reusable extension that can simplify your workflow.

For more information on these basic components, see [Understanding GitHub Actions](/en/actions/learn-github-actions/understanding-github-actions#the-components-of-github-actions).

![Diagram of an event triggering Runner 1 to run Job 1, which triggers Runner 2 to run Job 2. Each of the jobs is broken into multiple steps.](/assets/images/help/actions/overview-actions-simple.png)

## Workflow triggers

Workflow triggers are events that cause a workflow to run. These events can be:

* Events that occur in your workflow's repository
* Events that occur outside of GitHub and trigger a `repository_dispatch` event on GitHub
* Scheduled times
* Manual

For example, you can configure your workflow to run when a push is made to the default branch of your repository, when a release is created, or when an issue is opened.

Workflow triggers are defined with the `on` key. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#on).

The following steps occur to trigger a workflow run:

1. An event occurs on your repository. The event has an associated commit SHA and Git ref.
2. GitHub searches the `.github/workflows` directory in the root of your repository for workflow files that are present in the associated commit SHA or Git ref of the event.
3. A workflow run is triggered for any workflows that have `on:` values that match the triggering event. Some events also require the workflow file to be present on the default branch of the repository in order to run.

Each workflow run will use the version of the workflow that is present in the associated commit SHA or Git ref of the event. When a workflow runs, GitHub sets the `GITHUB_SHA` (commit SHA) and `GITHUB_REF` (Git ref) environment variables in the runner environment. For more information, see [Store information in variables](/en/actions/learn-github-actions/variables).

For more information, see [Triggering a workflow](/en/actions/using-workflows/triggering-a-workflow).

## Next steps

To build your first workflow, see [Creating an example workflow](/en/actions/tutorials/creating-an-example-workflow).