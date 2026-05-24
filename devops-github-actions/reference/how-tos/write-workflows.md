# Write Workflows

---

# Adding scripts to your workflow

You can use GitHub Actions workflows to run scripts.

You can use a GitHub Actions workflow to run scripts and shell commands, which are then executed on the assigned runner. This example demonstrates how to use the `run` keyword to execute the command `npm install -g bats` on the runner.

```yaml
jobs:
  example-job:
    runs-on: ubuntu-latest
    steps:
      - run: npm install -g bats
```

To use a workflow to run a script stored in your repository you must first check out the repository to the runner. Having done this, you can use the `run` keyword to run the script on the runner. The following example runs two scripts, each in a separate job step. The location of the scripts on the runner is specified by setting a default working directory for run commands. For more information, see [Setting a default shell and working directory](/en/actions/using-jobs/setting-default-values-for-jobs).

```yaml
jobs:
  example-job:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./scripts
    steps:
      - name: Check out the repository to the runner
        uses: actions/checkout@v5
      - name: Run a script
        run: ./my-script.sh
      - name: Run another script
        run: ./my-other-script.sh
```

Any scripts that you want a workflow job to run must be executable. You can do this either within the workflow by passing the script as an argument to the interpreter that will run the script - for example, `run: bash script.sh` - or by making the file itself executable. You can give the file the execute permission by using the command `git update-index --chmod=+x PATH/TO/YOUR/script.sh` locally, then committing and pushing the file to the repository. Alternatively, for workflows that are run on Linux and Mac runners, you can add a command to give the file the execute permission in the workflow job, prior to running the script:

```yaml
jobs:
  example-job:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./scripts
    steps:
      - name: Check out the repository to the runner
        uses: actions/checkout@v5
      - name: Make the script files executable
        run: chmod +x my-script.sh my-other-script.sh
      - name: Run the scripts
        run: |
          ./my-script.sh
          ./my-other-script.sh
```

For more information about the `run` keyword, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsrun).
---

# Deploying to a specific environment

Specify a deployment environment in your workflow.

## Prerequisites

You need to create an environment before you can use it in a workflow. See [Managing environments for deployment](/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment#creating-an-environment).

## Using an environment in a workflow

1. Open the workflow file you want to edit.

2. Use the following syntax to add a [`jobs.<job_id>.environment`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idenvironment) key to your workflow:

   ```yaml copy
   jobs:
     JOB-ID:
       environment: ENVIRONMENT-NAME
   ```

   The chosen job will now be subject to any rules configured for the specified environment.

3. Optionally, specify a deployment URL for the environment using the following syntax:

   ```yaml copy
   jobs:
     JOB-ID:
       environment:
           name: ENVIRONMENT-NAME
           url: URL
   ```

   The specified URL will appear:

   * On the deployments page for the repository
   * In the visualization graph for the workflow run
   * (If a pull request triggers the workflow) As a "View deployment" button in the pull request timeline

4. Optionally, prevent a deployment object from being created by adding the `deployment` property. When set to `false`, the job still has access to environment secrets and variables, but no GitHub deployment is created:

   ```yaml copy
   jobs:
     JOB-ID:
       environment:
           name: ENVIRONMENT-NAME
           deployment: false
   ```

   This is useful for CI or testing jobs that need environment secrets but aren't actually deploying anything. For more information, see [Deploying with GitHub Actions](/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments#using-environments-without-deployments).
---

# Using pre-written building blocks in your workflow

You can use and customize pre-written actions to power your workflow.

## Browsing Marketplace actions in the workflow editor

You can search and browse actions directly in your repository's workflow editor. From the sidebar, you can search for a specific action, view featured actions, and browse featured categories. You can also view the number of stars an action has received from the GitHub community.

1. In your repository, browse to the workflow file you want to edit.
2. In the upper right corner of the file view, to open the workflow editor, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-pencil" aria-label="Edit file" role="img"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"></path></svg>.
   ![Screenshot of a workflow file showing the header section. The pencil icon for editing files is highlighted with a dark orange outline.](/assets/images/help/repository/actions-edit-workflow-file.png)
3. To the right of the editor, use the GitHub Marketplace sidebar to browse actions. Actions with the <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-verified" aria-label="Creator verified by GitHub" role="img"><path d="m9.585.52.929.68c.153.112.331.186.518.215l1.138.175a2.678 2.678 0 0 1 2.24 2.24l.174 1.139c.029.187.103.365.215.518l.68.928a2.677 2.677 0 0 1 0 3.17l-.68.928a1.174 1.174 0 0 0-.215.518l-.175 1.138a2.678 2.678 0 0 1-2.241 2.241l-1.138.175a1.17 1.17 0 0 0-.518.215l-.928.68a2.677 2.677 0 0 1-3.17 0l-.928-.68a1.174 1.174 0 0 0-.518-.215L3.83 14.41a2.678 2.678 0 0 1-2.24-2.24l-.175-1.138a1.17 1.17 0 0 0-.215-.518l-.68-.928a2.677 2.677 0 0 1 0-3.17l.68-.928c.112-.153.186-.331.215-.518l.175-1.14a2.678 2.678 0 0 1 2.24-2.24l1.139-.175c.187-.029.365-.103.518-.215l.928-.68a2.677 2.677 0 0 1 3.17 0ZM7.303 1.728l-.927.68a2.67 2.67 0 0 1-1.18.489l-1.137.174a1.179 1.179 0 0 0-.987.987l-.174 1.136a2.677 2.677 0 0 1-.489 1.18l-.68.928a1.18 1.18 0 0 0 0 1.394l.68.927c.256.348.424.753.489 1.18l.174 1.137c.078.509.478.909.987.987l1.136.174a2.67 2.67 0 0 1 1.18.489l.928.68c.414.305.979.305 1.394 0l.927-.68a2.67 2.67 0 0 1 1.18-.489l1.137-.174a1.18 1.18 0 0 0 .987-.987l.174-1.136a2.67 2.67 0 0 1 .489-1.18l.68-.928a1.176 1.176 0 0 0 0-1.394l-.68-.927a2.686 2.686 0 0 1-.489-1.18l-.174-1.137a1.179 1.179 0 0 0-.987-.987l-1.136-.174a2.677 2.677 0 0 1-1.18-.489l-.928-.68a1.176 1.176 0 0 0-1.394 0ZM11.28 6.78l-3.75 3.75a.75.75 0 0 1-1.06 0L4.72 8.78a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L7 8.94l3.22-3.22a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path></svg> badge indicate GitHub has verified the creator of the action as a partner organization.
   ![Screenshot of a workflow in the file editor. The sidebar shows Marketplace actions. A "Creator verified by GitHub" badge is outlined in orange.](/assets/images/help/repository/actions-marketplace-sidebar.png)

## Adding an action to your workflow

You can add an action to your workflow by referencing the action in your workflow file. The actions you use in your workflow can be defined in:

* The same repository as your workflow file
* Any public repository
* A published Docker container image on Docker Hub

You can view the actions referenced in your GitHub Actions workflows as dependencies in the dependency graph of the repository containing your workflows. For more information, see “[About the dependency graph](/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph).”

> \[!NOTE]
> To enhance security, GitHub Actions does not support redirects for actions or reusable workflows. This means that when the owner, name of an action's repository, or name of an action is changed, any workflows using that action with the previous name will fail.

### Adding an action from GitHub Marketplace

An action's listing page includes the action's version and the workflow syntax required to use the action. To keep your workflow stable even when updates are made to an action, you can reference the version of the action to use by specifying the Git or Docker tag number in your workflow file.

1. Navigate to the action you want to use in your workflow.
2. Click to view the full marketplace listing for the action.
3. Under "Installation", click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-copy" aria-label="Copy to clipboard" role="img"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg> to copy the workflow syntax.
   ![Screenshot of the marketplace listing for an action. The "Copy to clipboard" icon for the action is highlighted with a dark orange outline.](/assets/images/help/repository/actions-sidebar-detailed-view.png)
4. Paste the syntax as a new step in your workflow. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idsteps).
5. If the action requires you to provide inputs, set them in your workflow. For information on inputs an action might require, see [Using pre-written building blocks in your workflow](/en/actions/learn-github-actions/finding-and-customizing-actions#using-inputs-and-outputs-with-an-action).

You can also enable Dependabot version updates for the actions that you add to your workflow. For more information, see [Keeping your actions up to date with Dependabot](/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot).

### Adding an action from the same repository

If an action is defined in the same repository where your workflow file uses the action, you can reference the action with either the ‌`{owner}/{repo}@{ref}` or `./path/to/dir` syntax in your workflow file.

Example repository file structure:

```shell
|-- hello-world (repository)
|   |__ .github
|       └── workflows
|           └── my-first-workflow.yml
|       └── actions
|           |__ hello-world-action
|               └── action.yml
```

The path is relative (`./`) to the default working directory (`github.workspace`, `$GITHUB_WORKSPACE`). If the action checks out the repository to a location different than the workflow, the relative path used for local actions must be updated.

Example workflow file:

```yaml
jobs:
  my_first_job:
    runs-on: ubuntu-latest
    steps:
      # This step checks out a copy of your repository.
      - name: My first step - check out repository
        uses: actions/checkout@v5
      # This step references the directory that contains the action.
      - name: Use local hello-world-action
        uses: ./.github/actions/hello-world-action
```

The `action.yml` file is used to provide metadata for the action. Learn about the content of this file in [Metadata syntax reference](/en/actions/creating-actions/metadata-syntax-for-github-actions).

### Adding an action from a different repository

If an action is defined in a different repository than your workflow file, you can reference the action with the `{owner}/{repo}@{ref}` syntax in your workflow file.

The action must be stored in a public repository.

```yaml
jobs:
  my_first_job:
    steps:
      - name: My first step
        uses: actions/setup-node@v4
```

### Referencing a container on Docker Hub

If an action is defined in a published Docker container image on Docker Hub, you must reference the action with the `docker://{image}:{tag}` syntax in your workflow file. To protect your code and data, we strongly recommend you verify the integrity of the Docker container image from Docker Hub before using it in your workflow.

```yaml
jobs:
  my_first_job:
    steps:
      - name: My first step
        uses: docker://alpine:3.8
```

For some examples of Docker actions, see the [Docker-image.yml workflow](https://github.com/actions/starter-workflows/blob/main/ci/docker-image.yml) and [Creating a Docker container action](/en/actions/creating-actions/creating-a-docker-container-action).

### Security hardening for using actions in your workflows

GitHub provides security features that you can use to increase the security of your workflows. You can use GitHub's built-in features to ensure you are notified about vulnerabilities in the actions you consume, or to automate the process of keeping the actions in your workflows up to date. For more information, see [Secure use reference](/en/actions/security-guides/using-githubs-security-features-to-secure-your-use-of-github-actions).

## Using release management for your custom actions

The creators of a community action have the option to use tags, branches, or SHA values to manage releases of the action. Similar to any dependency, you should indicate the version of the action you'd like to use based on your comfort with automatically accepting updates to the action.

You will designate the version of the action in your workflow file. Check the action's documentation for information on their approach to release management, and to see which tag, branch, or SHA value to use.

> \[!NOTE]
> We recommend that you use a SHA value when using third-party actions. However, it's important to note Dependabot will only create Dependabot alerts for vulnerable GitHub Actions that use semantic versioning. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions) and [About Dependabot alerts](/en/code-security/dependabot/dependabot-alerts/about-dependabot-alerts).

### Using tags

Tags are useful for letting you decide when to switch between major and minor versions, but these are more ephemeral and can be moved or deleted by the maintainer. This example demonstrates how to target an action that's been tagged as `v1.0.1`:

```yaml
steps:
  - uses: actions/javascript-action@v1.0.1
```

### Using SHAs

If you need more reliable versioning, you should use the SHA value associated with the version of the action. SHAs are immutable and therefore more reliable than tags or branches. However, this approach means you will not automatically receive updates for an action, including important bug fixes and security updates. You must use a commit's full SHA value, and not an abbreviated value. When selecting a SHA, you should verify it is from the action's repository and not a repository fork. This example targets an action's SHA:

```yaml
steps:
  - uses: actions/javascript-action@a824008085750b8e136effc585c3cd6082bd575f
```

### Using branches

Specifying a target branch for the action means it will always run the version currently on that branch. This approach can create problems if an update to the branch includes breaking changes. This example targets a branch named `@main`:

```yaml
steps:
  - uses: actions/javascript-action@main
```

For more information, see [About custom actions](/en/actions/creating-actions/about-custom-actions#using-release-management-for-actions).

## Using inputs and outputs with an action

An action often accepts or requires inputs and generates outputs that you can use. For example, an action might require you to specify a path to a file, the name of a label, or other data it will use as part of the action processing.

To see the inputs and outputs of an action, check the `action.yml` in the root directory of the repository.

In this example `action.yml`, the `inputs` keyword defines a required input called `file-path`, and includes a default value that will be used if none is specified. The `outputs` keyword defines an output called `results-file`, which tells you where to locate the results.

```yaml
name: "Example"
description: "Receives file and generates output"
inputs:
  file-path: # id of input
    description: "Path to test script"
    required: true
    default: "test-file.js"
outputs:
  results-file: # id of output
    description: "Path to results file"
```
---

# Passing information between jobs

You can define outputs to pass information from one job to another.

## Defining and using job outputs

1. Open the workflow file containing the job you want to get outputs from.

2. Use the `jobs.<job_id>.outputs` syntax to define the outputs for the job. For example, the following job defines the `output1` and `output2` outputs, which are mapped to the results of `step1` and `step2` respectively:

   ```yaml
   jobs:
     job1:
       runs-on: ubuntu-latest
       outputs:
         output1: ${{ steps.step1.outputs.test }}
         output2: ${{ steps.step2.outputs.test }}
       steps:
         - id: step1
           run: echo "test=hello" >> "$GITHUB_OUTPUT"
         - id: step2
           run: echo "test=world" >> "$GITHUB_OUTPUT"
   ```

3. In a separate job where you want to access those outputs, use the `jobs.<job_id>.needs` syntax to make it dependent on the original job. For example, the following job checks that `job1` is complete before running:

   ```yaml
   jobs:
     # Assume job1 is defined as above
     job2:
       runs-on: ubuntu-latest
       needs: job1
   ```

4. To access the outputs in the dependent job, use the `needs.<job_id>.outputs.<output_name>` syntax. For example, the following job accesses the `output1` and `output2` outputs defined in `job1`:

   ```yaml
   jobs:
     # Assume job1 is defined as above
     job2:
       runs-on: ubuntu-latest
       needs: job1
       steps:
         - env:
             OUTPUT1: ${{needs.job1.outputs.output1}}
             OUTPUT2: ${{needs.job1.outputs.output2}}
           run: echo "$OUTPUT1 $OUTPUT2"
   ```

## Next steps

To learn more about job outputs and the `needs` context, see the following sections of [Workflow syntax for GitHub Actions](/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idoutputs):

* [`jobs.<job_id>.outputs`](/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idoutputs)
* [`jobs.<job_id>.needs`](/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idneeds)
---

# Running variations of jobs in a workflow

Create a matrix to define variations for each job.

## About matrix strategies

A matrix strategy lets you use variables in a single job definition to automatically create multiple job runs that are based on the combinations of the variables. For example, you can use a matrix strategy to test your code in multiple versions of a language or on multiple operating systems.

## Adding a matrix strategy to your workflow job

Use `jobs.<job_id>.strategy.matrix` to define a matrix of different job configurations. Within your matrix, define one or more variables followed by an array of values. For example, the following matrix has a variable called `version` with the value `[10, 12, 14]` and a variable called `os` with the value `[ubuntu-latest, windows-latest]`:

```yaml
jobs:
  example_matrix:
    strategy:
      matrix:
        version: [10, 12, 14]
        os: [ubuntu-latest, windows-latest]
```

A job will run for each possible combination of the variables. In this example, the workflow will run six jobs, one for each combination of the `os` and `version` variables.

The above matrix will create the jobs in the following order.

* `{version: 10, os: ubuntu-latest}`
* `{version: 10, os: windows-latest}`
* `{version: 12, os: ubuntu-latest}`
* `{version: 12, os: windows-latest}`
* `{version: 14, os: ubuntu-latest}`
* `{version: 14, os: windows-latest}`

For reference information and examples, see [Workflow syntax for GitHub Actions](/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix).

## Using contexts to create matrices

To create matrices with information about workflow runs, variables, runner environments, jobs, and steps, access contexts using the `${{ <context> }}` expression syntax. For more information about contexts, see [Contexts reference](/en/actions/learn-github-actions/contexts).

For example, the following workflow triggers on the `repository_dispatch` event and uses information from the event payload to build the matrix. When a repository dispatch event is created with a payload like the one below, the matrix `version` variable will have a value of `[12, 14, 16]`. For more information about the `repository_dispatch` trigger, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#repository_dispatch).

```json
{
  "event_type": "test",
  "client_payload": {
    "versions": [12, 14, 16]
  }
}
```

```yaml
on:
  repository_dispatch:
    types:
      - test

jobs:
  example_matrix:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        version: ${{ github.event.client_payload.versions }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.version }}
```

## Expanding or adding matrix configurations

To expand existing matrix configurations or to add new configurations, use `jobs.<job_id>.strategy.matrix.include`. The value of `include` is a list of objects.

For example, consider the following matrix.

```yaml
strategy:
  matrix:
    fruit: [apple, pear]
    animal: [cat, dog]
    include:
      - color: green
      - color: pink
        animal: cat
      - fruit: apple
        shape: circle
      - fruit: banana
      - fruit: banana
        animal: cat
```

This will result in six jobs with the following matrix combinations.

* `{fruit: apple, animal: cat, color: pink, shape: circle}`
* `{fruit: apple, animal: dog, color: green, shape: circle}`
* `{fruit: pear, animal: cat, color: pink}`
* `{fruit: pear, animal: dog, color: green}`
* `{fruit: banana}`
* `{fruit: banana, animal: cat}`

Each `include` entry was applied in the following ways.

* `{color: green}` is added to all of the original matrix combinations because it can be added without overwriting any part of the original combinations.
* `{color: pink, animal: cat}` adds `color:pink` only to the original matrix combinations that include `animal: cat`. This overwrites the `color: green` that was added by the previous `include` entry.
* `{fruit: apple, shape: circle}` adds `shape: circle` only to the original matrix combinations that include `fruit: apple`.
* `{fruit: banana}` cannot be added to any original matrix combination without overwriting a value, so it is added as an additional matrix combination.
* `{fruit: banana, animal: cat}` cannot be added to any original matrix combination without overwriting a value, so it is added as an additional matrix combination. It does not add to the `{fruit: banana}` matrix combination because that combination was not one of the original matrix combinations.

For reference and example configurations, see [Workflow syntax for GitHub Actions](/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstrategymatrixinclude).

## Excluding matrix configurations

To remove specific configurations defined in the matrix, use `jobs.<job_id>.strategy.matrix.exclude`.

For example, the following workflow will run nine jobs: one job for each of the 12 configurations, minus the one excluded job that matches `{os: macos-latest, version: 12, environment: production}`, and the two excluded jobs that match `{os: windows-latest, version: 16}`.

```yaml
strategy:
  matrix:
    os: [macos-latest, windows-latest]
    version: [12, 14, 16]
    environment: [staging, production]
    exclude:
      - os: macos-latest
        version: 12
        environment: production
      - os: windows-latest
        version: 16
runs-on: ${{ matrix.os }}
```

For reference information, see [Workflow syntax for GitHub Actions](/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstrategymatrixexclude)

## Using an output to define two matrices

You can use the output from one job to define matrices for multiple jobs.

For example, the following workflow demonstrates how to define a matrix of values in one job, use that matrix in a second jobs to produce artifacts, and then consume those artifacts in a third job. Each artifact is associated with a value from the matrix.

```yaml copy
name: shared matrix
on:
  push:
  workflow_dispatch:

jobs:
  define-matrix:
    runs-on: ubuntu-latest

    outputs:
      colors: ${{ steps.colors.outputs.colors }}

    steps:
      - name: Define Colors
        id: colors
        run: |
          echo 'colors=["red", "green", "blue"]' >> "$GITHUB_OUTPUT"

  produce-artifacts:
    runs-on: ubuntu-latest
    needs: define-matrix
    strategy:
      matrix:
        color: ${{ fromJSON(needs.define-matrix.outputs.colors) }}

    steps:
      - name: Define Color
        env:
          color: ${{ matrix.color }}
        run: |
          echo "$color" > color
      - name: Produce Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.color }}
          path: color

  consume-artifacts:
    runs-on: ubuntu-latest
    needs:
    - define-matrix
    - produce-artifacts
    strategy:
      matrix:
        color: ${{ fromJSON(needs.define-matrix.outputs.colors) }}

    steps:
    - name: Retrieve Artifact
      uses: actions/download-artifact@v5
      with:
        name: ${{ matrix.color }}

    - name: Report Color
      run: |
        cat color
```

## Handling failures

To control how job failures are handled, use `jobs.<job_id>.strategy.fail-fast` and `jobs.<job_id>.continue-on-error`.

You can use `jobs.<job_id>.strategy.fail-fast` and `jobs.<job_id>.continue-on-error` together. For example, the following workflow will start four jobs. For each job, `continue-on-error` is determined by the value of `matrix.experimental`. If any of the jobs with `continue-on-error: false` fail, all jobs that are in progress or queued will be cancelled. If the job with `continue-on-error: true` fails, the other jobs will not be affected.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    continue-on-error: ${{ matrix.experimental }}
    strategy:
      fail-fast: true
      matrix:
        version: [6, 7, 8]
        experimental: [false]
        include:
          - version: 9
            experimental: true
```

For reference information see [`jobs.<job_id>.strategy.fail-fast`](/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstrategyfail-fast) and [`jobs.<job_id>.continue-on-error`](/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idcontinue-on-error).

## Defining the maximum number of concurrent jobs

To set the maximum number of jobs that can run simultaneously when using a `matrix` job strategy, use `jobs.<job_id>.strategy.max-parallel`.

For example, the following workflow will run a maximum of two jobs at a time, even if there are runners available to run all six jobs at once.

```yaml
jobs:
  example_matrix:
    strategy:
      max-parallel: 2
      matrix:
        version: [10, 12, 14]
        os: [ubuntu-latest, windows-latest]
```

For reference information, see [Workflow syntax for GitHub Actions](/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstrategymax-parallel).
---

# Setting a default shell and working directory

Define the default settings that will apply to all jobs in the workflow, or all steps in a job.

## Overview

Use `defaults` to create a `map` of default settings that will apply to all jobs in the workflow. You can also set default settings that are only available to a job. For more information, see [`jobs.<job_id>.defaults`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_iddefaults).

When more than one default setting is defined with the same name, GitHub uses the most specific default setting. For example, a default setting defined in a job will override a default setting that has the same name defined in a workflow.

## Setting default shell and working directory

You can use `defaults.run` to provide default `shell` and `working-directory` options for all [`run`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsrun) steps in a workflow. You can also set default settings for `run` that are only available to a job. For more information, see [`jobs.<job_id>.defaults.run`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_iddefaultsrun). You cannot use contexts or expressions in this keyword.

When more than one default setting is defined with the same name, GitHub uses the most specific default setting. For example, a default setting defined in a job will override a default setting that has the same name defined in a workflow.

### Example: Set the default shell and working directory

```yaml
defaults:
  run:
    shell: bash
    working-directory: ./scripts
```

## Setting default values for a specific job

Use `jobs.<job_id>.defaults` to create a `map` of default settings that will apply to all steps in the job. You can also set default settings for the entire workflow. For more information, see [`defaults`](/en/actions/using-workflows/workflow-syntax-for-github-actions#defaults).

When more than one default setting is defined with the same name, GitHub uses the most specific default setting. For example, a default setting defined in a job will override a default setting that has the same name defined in a workflow.

## Setting default shell and working directory for a job

Use `jobs.<job_id>.defaults.run` to provide default `shell` and `working-directory` to all `run` steps in the job.

You can provide default `shell` and `working-directory` options for all [`run`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsrun) steps in a job. You can also set default settings for `run` for the entire workflow. For more information, see [`defaults.run`](/en/actions/using-workflows/workflow-syntax-for-github-actions#defaultsrun).

These can be overridden at the `jobs.<job_id>.defaults.run` and `jobs.<job_id>.steps[*].run` levels.

When more than one default setting is defined with the same name, GitHub uses the most specific default setting. For example, a default setting defined in a job will override a default setting that has the same name defined in a workflow.

### Example: Setting default `run` step options for a job

```yaml
jobs:
  job1:
    runs-on: ubuntu-latest
    defaults:
      run:
        shell: bash
        working-directory: ./scripts
```
---

# Using GitHub CLI in workflows

You can script with GitHub CLI in GitHub Actions workflows.

> \[!NOTE]
> To learn more about GitHub CLI, see [About GitHub CLI](/en/github-cli/github-cli/about-github-cli).

GitHub CLI is preinstalled on all GitHub-hosted runners. For each step that uses GitHub CLI, you must set an environment variable called `GH_TOKEN` to a token with the required scopes.

You can execute any GitHub CLI command. For example, this workflow uses the `gh issue comment` subcommand to add a comment when an issue is opened.

```yaml copy
name: Comment when opened
on:
  issues:
    types:
      - opened
jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - run: gh issue comment $ISSUE --body "Thank you for opening this issue!"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ISSUE: ${{ github.event.issue.html_url }}
```

You can also execute API calls through GitHub CLI. For example, this workflow first uses the `gh api` subcommand to query the GraphQL API and parse the result. Then it stores the result in an environment variable that it can access in a later step. In the second step, it uses the `gh issue create` subcommand to create an issue containing the information from the first step.

```yaml copy
name: Report remaining open issues
on:
  schedule:
    # Daily at 8:20 UTC
    - cron: '20 8 * * *'
jobs:
  track_pr:
    runs-on: ubuntu-latest
    steps:
      - run: |
          numOpenIssues="$(gh api graphql -F owner=$OWNER -F name=$REPO -f query='
            query($name: String!, $owner: String!) {
              repository(owner: $owner, name: $name) {
                issues(states:OPEN){
                  totalCount
                }
              }
            }
          ' --jq '.data.repository.issues.totalCount')"

          echo 'NUM_OPEN_ISSUES='$numOpenIssues >> $GITHUB_ENV
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OWNER: ${{ github.repository_owner }}
          REPO: ${{ github.event.repository.name }}
      - run: |
          gh issue create --title "Issue report" --body "$NUM_OPEN_ISSUES issues remaining" --repo $GITHUB_REPOSITORY
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
---

# Using jobs in a workflow

Use workflows to run multiple jobs.

## Prerequisites

To implement jobs in your workflows, you need to understand what jobs are. See [Understanding GitHub Actions](/en/actions/get-started/understanding-github-actions#jobs).

## Setting an ID for a job

Use `jobs.<job_id>` to give your job a unique identifier. The key `job_id` is a string and its value is a map of the job's configuration data. You must replace `<job_id>` with a string that is unique to the `jobs` object. The `<job_id>` must start with a letter or `_` and contain only alphanumeric characters, `-`, or `_`.

### Example: Creating jobs

In this example, two jobs have been created, and their `job_id` values are `my_first_job` and `my_second_job`.

```yaml
jobs:
  my_first_job:
    name: My first job
  my_second_job:
    name: My second job
```

## Setting a name for a job

Use `jobs.<job_id>.name` to set a name for the job, which is displayed in the GitHub UI.

## Defining prerequisite jobs

Use `jobs.<job_id>.needs` to identify any jobs that must complete successfully before this job will run. It can be a string or array of strings. If a job fails or is skipped, all jobs that need it are skipped unless the jobs use a conditional expression that causes the job to continue. If a run contains a series of jobs that need each other, a failure or skip applies to all jobs in the dependency chain from the point of failure or skip onwards. If you would like a job to run even if a job it is dependent on did not succeed, use the `always()` conditional expression in `jobs.<job_id>.if`.

### Example: Requiring successful dependent jobs

```yaml
jobs:
  job1:
  job2:
    needs: job1
  job3:
    needs: [job1, job2]
```

In this example, `job1` must complete successfully before `job2` begins, and `job3` waits for both `job1` and `job2` to complete.

The jobs in this example run sequentially:

1. `job1`
2. `job2`
3. `job3`

### Example: Not requiring successful dependent jobs

```yaml
jobs:
  job1:
  job2:
    needs: job1
  job3:
    if: ${{ always() }}
    needs: [job1, job2]
```

In this example, `job3` uses the `always()` conditional expression so that it always runs after `job1` and `job2` have completed, regardless of whether they were successful. For more information, see [Evaluate expressions in workflows and actions](/en/actions/learn-github-actions/expressions#status-check-functions).

## Using a matrix to run jobs with different variables

To automatically run a job with different combinations of variables, such as operating systems or language versions, define a `matrix` strategy in your workflow.

For more information, see [Running variations of jobs in a workflow](/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/running-variations-of-jobs-in-a-workflow).
---

# Using secrets in GitHub Actions

Learn how to create secrets at the repository, environment, and organization levels for GitHub Actions workflows.

## Creating secrets for a repository

To create secrets or variables on GitHub for an organization repository, you must have `write` access. For a personal account repository, you must be a repository collaborator.

<div class="ghd-tool webui">

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.](/assets/images/help/repository/repo-actions-settings.png)
3. In the "Security" section of the sidebar, select **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-key-asterisk" aria-label="key-asterisk" role="img"><path d="M0 2.75A2.75 2.75 0 0 1 2.75 0h10.5A2.75 2.75 0 0 1 16 2.75v10.5A2.75 2.75 0 0 1 13.25 16H2.75A2.75 2.75 0 0 1 0 13.25ZM2.75 1.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.69-.56-1.25-1.25-1.25Z"></path><path d="M8 4a.75.75 0 0 1 .75.75V6.7l1.69-.975a.75.75 0 0 1 .75 1.3L9.5 8l1.69.976a.75.75 0 0 1-.75 1.298L8.75 9.3v1.951a.75.75 0 0 1-1.5 0V9.299l-1.69.976a.75.75 0 0 1-.75-1.3L6.5 8l-1.69-.975a.75.75 0 0 1 .75-1.3l1.69.976V4.75A.75.75 0 0 1 8 4Z"></path></svg> Secrets and variables**, then click **Actions**.
4. Click the **Secrets** tab.
   ![Screenshot of the "Actions secrets and variables" page. The "Secrets" tab is outlined in dark orange.](/assets/images/help/repository/actions-secrets-tab.png)
5. Click **New repository secret**.
6. In the **Name** field, type a name for your secret.
7. In the **Secret** field, enter the value for your secret.
8. Click **Add secret**.

If your repository has environment secrets or can access secrets from the parent organization, then those secrets are also listed on this page.

</div>

<div class="ghd-tool cli">

To add a repository secret, use the `gh secret set` subcommand. Replace `secret-name` with the name of your secret.

```shell
gh secret set SECRET_NAME
```

The CLI will prompt you to enter a secret value. Alternatively, you can read the value of the secret from a file.

```shell
gh secret set SECRET_NAME < secret.txt
```

To list all secrets for the repository, use the `gh secret list` subcommand.

</div>

## Creating secrets for an environment

To create secrets or variables for an environment in a personal account repository, you must be the repository owner. To create secrets or variables for an environment in an organization repository, you must have `admin` access. For more information on environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

<div class="ghd-tool webui">

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.](/assets/images/help/repository/repo-actions-settings.png)
3. In the left sidebar, click **Environments**.
4. Click on the environment that you want to add a secret to.
5. Under **Environment secrets**, click **Add secret**.
6. Type a name for your secret in the **Name** input box.
7. Enter the value for your secret.
8. Click **Add secret**.

</div>

<div class="ghd-tool cli">

To add a secret for an environment, use the `gh secret set` subcommand with the `--env` or `-e` flag followed by the environment name.

```shell
gh secret set --env ENV_NAME SECRET_NAME
```

To list all secrets for an environment, use the `gh secret list` subcommand with the `--env` or `-e` flag followed by the environment name.

```shell
gh secret list --env ENV_NAME
```

</div>

## Creating secrets for an organization

> \[!NOTE]
> Organization-level secrets and variables are not accessible by private repositories for GitHub Free. For more information about upgrading your GitHub subscription, see [Upgrading your account's plan](/en/billing/managing-billing-for-your-github-account/upgrading-your-github-subscription).

When creating a secret or variable in an organization, you can use a policy to limit access by repository. For example, you can grant access to all repositories, or limit access to only private repositories or a specified list of repositories.

Organization owners can create secrets or variables at the organization level.

<div class="ghd-tool webui">

1. On GitHub, navigate to the main page of the organization.

2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)

3. In the "Security" section of the sidebar, select **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-key-asterisk" aria-label="key-asterisk" role="img"><path d="M0 2.75A2.75 2.75 0 0 1 2.75 0h10.5A2.75 2.75 0 0 1 16 2.75v10.5A2.75 2.75 0 0 1 13.25 16H2.75A2.75 2.75 0 0 1 0 13.25ZM2.75 1.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.69-.56-1.25-1.25-1.25Z"></path><path d="M8 4a.75.75 0 0 1 .75.75V6.7l1.69-.975a.75.75 0 0 1 .75 1.3L9.5 8l1.69.976a.75.75 0 0 1-.75 1.298L8.75 9.3v1.951a.75.75 0 0 1-1.5 0V9.299l-1.69.976a.75.75 0 0 1-.75-1.3L6.5 8l-1.69-.975a.75.75 0 0 1 .75-1.3l1.69.976V4.75A.75.75 0 0 1 8 4Z"></path></svg> Secrets and variables**, then click **Actions**.

4. Click the **Secrets** tab.

   ![Screenshot of the "Actions secrets and variables" page. The "Secrets" tab is outlined in dark orange.](/assets/images/help/repository/actions-secrets-tab.png)

5. Click **New organization secret**.

6. Type a name for your secret in the **Name** input box.

7. Enter the **Value** for your secret.

8. From the **Repository access** dropdown list, choose an access policy.

9. Click **Add secret**.

</div>

<div class="ghd-tool cli">

> \[!NOTE]
> By default, GitHub CLI authenticates with the `repo` and `read:org` scopes. To manage organization secrets, you must additionally authorize the `admin:org` scope.
>
> ```shell
> gh auth login --scopes "admin:org"
> ```

To add a secret for an organization, use the `gh secret set` subcommand with the `--org` or `-o` flag followed by the organization name.

```shell
gh secret set --org ORG_NAME SECRET_NAME
```

By default, the secret is only available to private repositories. To specify that the secret should be available to all repositories within the organization, use the `--visibility` or `-v` flag.

```shell
gh secret set --org ORG_NAME SECRET_NAME --visibility all
```

To specify that the secret should be available to selected repositories within the organization, use the `--repos` or `-r` flag.

```shell
gh secret set --org ORG_NAME SECRET_NAME --repos REPO-NAME-1, REPO-NAME-2
```

To list all secrets for an organization, use the `gh secret list` subcommand with the `--org` or `-o` flag followed by the organization name.

```shell
gh secret list --org ORG_NAME
```

</div>

## Reviewing access to organization-level secrets

You can check which access policies are being applied to a secret in your organization.

1. On GitHub, navigate to the main page of the organization.
2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)
3. In the "Security" section of the sidebar, select **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-key-asterisk" aria-label="key-asterisk" role="img"><path d="M0 2.75A2.75 2.75 0 0 1 2.75 0h10.5A2.75 2.75 0 0 1 16 2.75v10.5A2.75 2.75 0 0 1 13.25 16H2.75A2.75 2.75 0 0 1 0 13.25ZM2.75 1.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.69-.56-1.25-1.25-1.25Z"></path><path d="M8 4a.75.75 0 0 1 .75.75V6.7l1.69-.975a.75.75 0 0 1 .75 1.3L9.5 8l1.69.976a.75.75 0 0 1-.75 1.298L8.75 9.3v1.951a.75.75 0 0 1-1.5 0V9.299l-1.69.976a.75.75 0 0 1-.75-1.3L6.5 8l-1.69-.975a.75.75 0 0 1 .75-1.3l1.69.976V4.75A.75.75 0 0 1 8 4Z"></path></svg> Secrets and variables**, then click **Actions**.
4. The list of secrets includes any configured permissions and policies. For more details about the configured permissions for each secret, click **Update**.

## Using secrets in a workflow

> \[!NOTE]
>
> * With the exception of `GITHUB_TOKEN`, secrets are not passed to the runner when a workflow is triggered from a forked repository.
> * Secrets are not automatically passed to reusable workflows. For more information, see [Reuse workflows](/en/actions/using-workflows/reusing-workflows#passing-inputs-and-secrets-to-a-reusable-workflow).
> * Secrets are not available to workflows triggered by Dependabot events. For more information, see [Troubleshooting Dependabot on GitHub Actions](/en/code-security/dependabot/troubleshooting-dependabot/troubleshooting-dependabot-on-github-actions#accessing-secrets).
> * If your GitHub Actions workflows need to access resources from a cloud provider that supports OpenID Connect (OIDC), you can configure your workflows to authenticate directly to the cloud provider. This will let you stop storing these credentials as long-lived secrets and provide other security benefits. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

> \[!WARNING] Mask all sensitive information that is not a GitHub secret by using `::add-mask::VALUE`. This causes the value to be treated as a secret and redacted from logs.

To provide an action with a secret as an input or environment variable, you can use the `secrets` context to access secrets you've created in your repository. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts) and [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions).

```yaml
steps:
  - name: Hello world action
    with: # Set the secret as an input
      super_secret: ${{ secrets.SuperSecret }}
    env: # Or as an environment variable
      super_secret: ${{ secrets.SuperSecret }}
```

Secrets cannot be directly referenced in `if:` conditionals. Instead, consider setting secrets as job-level environment variables, then referencing the environment variables to conditionally run steps in the job. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts#context-availability) and [`jobs.<job_id>.steps[*].if`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsif).

If a secret has not been set, the return value of an expression referencing the secret (such as `${{ secrets.SuperSecret }}` in the example) will be an empty string.

Avoid passing secrets between processes from the command line, whenever possible. Command-line processes may be visible to other users (using the `ps` command) or captured by [security audit events](https://docs.microsoft.com/windows-server/identity/ad-ds/manage/component-updates/command-line-process-auditing). To help protect secrets, consider using environment variables, `STDIN`, or other mechanisms supported by the target process.

If you must pass secrets within a command line, then enclose them within the proper quoting rules. Secrets often contain special characters that may unintentionally affect your shell. To escape these special characters, use quoting with your environment variables. For example:

### Example using Bash

```yaml
steps:
  - shell: bash
    env:
      SUPER_SECRET: ${{ secrets.SuperSecret }}
    run: |
      example-command "$SUPER_SECRET"
```

### Example using PowerShell

```yaml
steps:
  - shell: pwsh
    env:
      SUPER_SECRET: ${{ secrets.SuperSecret }}
    run: |
      example-command "$env:SUPER_SECRET"
```

### Example using Cmd.exe

```yaml
steps:
  - shell: cmd
    env:
      SUPER_SECRET: ${{ secrets.SuperSecret }}
    run: |
      example-command "%SUPER_SECRET%"
```

## Storing large secrets

To use secrets that are larger than 48 KB, you can use a workaround to store secrets in your repository and save the decryption passphrase as a secret on GitHub. For example, you can use `gpg` to encrypt a file containing your secret locally before checking the encrypted file in to your repository on GitHub. For more information, see the [gpg manpage](https://www.gnupg.org/gph/de/manual/r1023.html).

> \[!WARNING]
> Be careful that your secrets do not get printed when your workflow runs. When using this workaround, GitHub does not redact secrets that are printed in logs.

1. Run the following command from your terminal to encrypt the file containing your secret using `gpg` and the AES256 cipher algorithm. In this example, `my_secret.json` is the file containing the secret.

   ```shell
   gpg --symmetric --cipher-algo AES256 my_secret.json
   ```

2. You will be prompted to enter a passphrase. Remember the passphrase, because you'll need to create a new secret on GitHub that uses the passphrase as the value.

3. Create a new secret that contains the passphrase. For example, create a new secret with the name `LARGE_SECRET_PASSPHRASE` and set the value of the secret to the passphrase you used in the step above.

4. Copy your encrypted file to a path in your repository and commit it. In this example, the encrypted file is `my_secret.json.gpg`.

   > \[!WARNING]
   > Make sure to copy the encrypted `my_secret.json.gpg` file ending with the `.gpg` file extension, and **not** the unencrypted `my_secret.json` file.

   ```shell
   git add my_secret.json.gpg
   git commit -m "Add new secret JSON file"
   ```

5. Create a shell script in your repository to decrypt the secret file. In this example, the script is named `decrypt_secret.sh`.

   ```shell copy
   #!/bin/sh

   # Decrypt the file
   mkdir $HOME/secrets
   # --batch to prevent interactive command
   # --yes to assume "yes" for questions
   gpg --quiet --batch --yes --decrypt --passphrase="$LARGE_SECRET_PASSPHRASE" \
   --output $HOME/secrets/my_secret.json my_secret.json.gpg
   ```

6. Ensure your shell script is executable before checking it in to your repository.

   ```shell
   chmod +x decrypt_secret.sh
   git add decrypt_secret.sh
   git commit -m "Add new decryption script"
   git push
   ```

7. In your GitHub Actions workflow, use a `step` to call the shell script and decrypt the secret. To have a copy of your repository in the environment that your workflow runs in, you'll need to use the [`actions/checkout`](https://github.com/actions/checkout) action. Reference your shell script using the `run` command relative to the root of your repository.

   ```yaml
   name: Workflows with large secrets

   on: push

   jobs:
     my-job:
       name: My Job
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - name: Decrypt large secret
           run: ./decrypt_secret.sh
           env:
             LARGE_SECRET_PASSPHRASE: ${{ secrets.LARGE_SECRET_PASSPHRASE }}
         # This command is just an example to show your secret being printed
         # Ensure you remove any print statements of your secrets. GitHub does
         # not hide secrets that use this workaround.
         - name: Test printing your secret (Remove this step in production)
           run: cat $HOME/secrets/my_secret.json
   ```

## Storing Base64 binary blobs as secrets

You can use Base64 encoding to store small binary blobs as secrets. You can then reference the secret in your workflow and decode it for use on the runner. For the size limits, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions#limits-for-secrets).

> \[!NOTE]
>
> * Note that Base64 only converts binary to text, and is not a substitute for actual encryption.
> * Using another shell might require different commands for decoding the secret to a file. On Windows runners, we recommend [using a bash shell](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsshell) with `shell: bash` to use the commands in the `run` step above.

1. Use `base64` to encode your file into a Base64 string. For example:

   On macOS, you could run:

   ```shell
   base64 -i cert.der -o cert.base64
   ```

   On Linux, you could run:

   ```shell
   base64 -w 0 cert.der > cert.base64
   ```

2. Create a secret that contains the Base64 string. For example:

   ```shell
   $ gh secret set CERTIFICATE_BASE64 < cert.base64
   ✓ Set secret CERTIFICATE_BASE64 for octocat/octorepo
   ```

3. To access the Base64 string from your runner, pipe the secret to `base64 --decode`. For example:

   ```yaml
   name: Retrieve Base64 secret
   on:
     push:
       branches: [ octo-branch ]
   jobs:
     decode-secret:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - name: Retrieve the secret and decode it to a file
           env:
             CERTIFICATE_BASE64: ${{ secrets.CERTIFICATE_BASE64 }}
           run: |
             echo $CERTIFICATE_BASE64 | base64 --decode > cert.der
         - name: Show certificate information
           run: |
             openssl x509 -in cert.der -inform DER -text -noout
   ```

## Next steps

For reference information, see [Secrets reference](/en/actions/reference/secrets-reference).
---

# Store information in variables

GitHub sets default variables for each GitHub Actions workflow run. You can also set custom variables for use in a single workflow or multiple workflows.

## Defining environment variables for a single workflow

To set a custom environment variable for a single workflow, you can define it using the `env` key in the workflow file. The scope of a custom variable set by this method is limited to the element in which it is defined. You can define variables that are scoped for:

* The entire workflow, by using [`env`](/en/actions/using-workflows/workflow-syntax-for-github-actions#env) at the top level of the workflow file.
* The contents of a job within a workflow, by using [`jobs.<job_id>.env`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idenv).
* A specific step within a job, by using [`jobs.<job_id>.steps[*].env`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsenv).

```yaml copy
name: Greeting on variable day

on:
  workflow_dispatch

env:
  DAY_OF_WEEK: Monday

jobs:
  greeting_job:
    runs-on: ubuntu-latest
    env:
      Greeting: Hello
    steps:
      - name: "Say Hello Mona it's Monday"
        run: echo "$Greeting $First_Name. Today is $DAY_OF_WEEK!"
        env:
          First_Name: Mona
```

You can access `env` variable values using runner environment variables or using contexts. The example above shows three custom variables being used as runner environment variables in an `echo` command: `$DAY_OF_WEEK`, `$Greeting`, and `$First_Name`. The values for these variables are set, and scoped, at the workflow, job, and step level respectively. The interpolation of these variables happens on the runner.

The commands in the `run` steps of a workflow, or a referenced action, are processed by the shell you are using on the runner. The instructions in the other parts of a workflow are processed by GitHub Actions and are not sent to the runner. You can use either runner environment variables or contexts in `run` steps, but in the parts of a workflow that are not sent to the runner you must use contexts to access variable values. For more information, see [Using contexts to access variable values](#using-contexts-to-access-variable-values).

Because runner environment variable interpolation is done after a workflow job is sent to a runner machine, you must use the appropriate syntax for the shell that's used on the runner. In this example, the workflow specifies `ubuntu-latest`. By default, Linux runners use the bash shell, so you must use the syntax `$NAME`. By default, Windows runners use PowerShell, so you would use the syntax `$env:NAME`. For more information about shells, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsshell).

## Defining configuration variables for multiple workflows

You can create configuration variables for use across multiple workflows, and can define them at either the [organization](#creating-configuration-variables-for-an-organization), [repository](#creating-configuration-variables-for-a-repository), or [environment](#creating-configuration-variables-for-an-environment) level.

For example, you can use configuration variables to set default values for parameters passed to build tools at an organization level, but then allow repository owners to override these parameters on a case-by-case basis.

When you define configuration variables, they are automatically available in the `vars` context. For more information, see [Using the `vars` context to access configuration variable values](#using-the-vars-context-to-access-configuration-variable-values).

### Creating configuration variables for a repository

To create secrets or variables on GitHub for an organization repository, you must have `write` access. For a personal account repository, you must be a repository collaborator.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.](/assets/images/help/repository/repo-actions-settings.png)
3. In the "Security" section of the sidebar, select **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-key-asterisk" aria-label="key-asterisk" role="img"><path d="M0 2.75A2.75 2.75 0 0 1 2.75 0h10.5A2.75 2.75 0 0 1 16 2.75v10.5A2.75 2.75 0 0 1 13.25 16H2.75A2.75 2.75 0 0 1 0 13.25ZM2.75 1.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.69-.56-1.25-1.25-1.25Z"></path><path d="M8 4a.75.75 0 0 1 .75.75V6.7l1.69-.975a.75.75 0 0 1 .75 1.3L9.5 8l1.69.976a.75.75 0 0 1-.75 1.298L8.75 9.3v1.951a.75.75 0 0 1-1.5 0V9.299l-1.69.976a.75.75 0 0 1-.75-1.3L6.5 8l-1.69-.975a.75.75 0 0 1 .75-1.3l1.69.976V4.75A.75.75 0 0 1 8 4Z"></path></svg> Secrets and variables**, then click **Actions**.
4. Click the **Variables** tab.
   ![Screenshot of the "Actions secrets and variables" page. The "Variables" tab is outlined in dark orange.](/assets/images/help/repository/actions-variables-tab.png)
5. Click **New repository variable**.
6. In the **Name** field, enter a name for your variable.
7. In the **Value** field, enter the value for your variable.
8. Click **Add variable**.

### Creating configuration variables for an environment

To create secrets or variables for an environment in a personal account repository, you must be the repository owner. To create secrets or variables for an environment in an organization repository, you must have `admin` access. For more information on environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.](/assets/images/help/repository/repo-actions-settings.png)
3. In the left sidebar, click **Environments**.
4. Click on the environment that you want to add a variable to.
5. Under **Environment variables**, click **Add variable**.
6. In the **Name** field, enter a name for your variable.
7. In the **Value** field, enter the value for your variable.
8. Click **Add variable**.

### Creating configuration variables for an organization

> \[!NOTE]
> Organization-level secrets and variables are not accessible by private repositories for GitHub Free. For more information about upgrading your GitHub subscription, see [Upgrading your account's plan](/en/billing/managing-billing-for-your-github-account/upgrading-your-github-subscription).

When creating a secret or variable in an organization, you can use a policy to limit access by repository. For example, you can grant access to all repositories, or limit access to only private repositories or a specified list of repositories.

Organization owners can create secrets or variables at the organization level.

1. On GitHub, navigate to the main page of the organization.

2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)

3. In the "Security" section of the sidebar, select **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-key-asterisk" aria-label="key-asterisk" role="img"><path d="M0 2.75A2.75 2.75 0 0 1 2.75 0h10.5A2.75 2.75 0 0 1 16 2.75v10.5A2.75 2.75 0 0 1 13.25 16H2.75A2.75 2.75 0 0 1 0 13.25ZM2.75 1.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.69-.56-1.25-1.25-1.25Z"></path><path d="M8 4a.75.75 0 0 1 .75.75V6.7l1.69-.975a.75.75 0 0 1 .75 1.3L9.5 8l1.69.976a.75.75 0 0 1-.75 1.298L8.75 9.3v1.951a.75.75 0 0 1-1.5 0V9.299l-1.69.976a.75.75 0 0 1-.75-1.3L6.5 8l-1.69-.975a.75.75 0 0 1 .75-1.3l1.69.976V4.75A.75.75 0 0 1 8 4Z"></path></svg> Secrets and variables**, then click **Actions**.

4. Click the **Variables** tab.

   ![Screenshot of the "Actions secrets and variables" page. The "Variables" tab is outlined in dark orange.](/assets/images/help/repository/actions-variables-tab.png)

5. Click **New organization variable**.

6. In the **Name** field, enter a name for your variable.

7. In the **Value** field, enter the value for your variable.

8. From the **Repository access** dropdown list, choose an access policy.

9. Click **Add variable**.

## Using contexts to access variable values

Contexts are a way to access information about workflow runs, variables, runner environments, jobs, and steps. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts). There are many other contexts that you can use for a variety of purposes in your workflows. For details of where you can use specific contexts within a workflow, see [Contexts reference](/en/actions/learn-github-actions/contexts#context-availability).

You can access environment variable values using the `env` context and configuration variable values using the `vars` context.

### Using the `env` context to access environment variable values

In addition to runner environment variables, GitHub Actions allows you to set and read `env` key values using contexts. Environment variables and contexts are intended for use at different points in the workflow.

The `run` steps in a workflow, or in a referenced action, are processed by a runner. As a result, you can use runner environment variables here, using the appropriate syntax for the shell you are using on the runner - for example, `$NAME` for the bash shell on a Linux runner, or `$env:NAME` for PowerShell on a Windows runner. In most cases you can also use contexts, with the syntax `${{ CONTEXT.PROPERTY }}`, to access the same value. The difference is that the context will be interpolated and replaced by a string before the job is sent to a runner.

However, you cannot use runner environment variables in parts of a workflow that are processed by GitHub Actions and are not sent to the runner. Instead, you must use contexts. For example, an `if` conditional, which determines whether a job or step is sent to the runner, is always processed by GitHub Actions. You must therefore use a context in an `if` conditional statement to access the value of a variable.

```yaml copy
name: Conditional env variable

on: workflow_dispatch

env:
  DAY_OF_WEEK: Monday

jobs:
  greeting_job:
    runs-on: ubuntu-latest
    env:
      Greeting: Hello
    steps:
      - name: "Say Hello Mona it's Monday"
        if: ${{ env.DAY_OF_WEEK == 'Monday' }}
        run: echo "$Greeting $First_Name. Today is $DAY_OF_WEEK!"
        env:
          First_Name: Mona
```

In this modification of the earlier example, we've introduced an `if` conditional. The workflow step is now only run if `DAY_OF_WEEK` is set to "Monday". We access this value from the `if` conditional statement by using the [`env` context](/en/actions/learn-github-actions/contexts#env-context). The `env` context is not required for the variables referenced within the `run` command. They are referenced as runner environment variables and are interpolated after the job is received by the runner. We could, however, have chosen to interpolate those variables before sending the job to the runner, by using contexts. The resulting output would be the same.

```yaml
run: echo "${{ env.Greeting }} ${{ env.First_Name }}. Today is ${{ env.DAY_OF_WEEK }}!"
```

> \[!NOTE]
> Contexts are usually denoted using the dollar sign and curly braces, as `${{ context.property }}`. In an `if` conditional, the `${{` and `}}` are optional, but if you use them they must enclose the entire comparison statement, as shown above.

> \[!WARNING]
> When creating workflows and actions, you should always consider whether your code might execute untrusted input from possible attackers. Certain contexts should be treated as untrusted input, as an attacker could insert their own malicious content. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#understanding-the-risk-of-script-injections).

### Using the `vars` context to access configuration variable values

Configuration variables can be accessed across the workflow using `vars` context. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts#vars-context).

If a configuration variable has not been set, the return value of a context referencing the variable will be an empty string.

The following example shows using configuration variables with the `vars` context across a workflow. Each of the following configuration variables have been defined at the repository, organization, or environment levels.

```yaml copy
on:
  workflow_dispatch:
env:
  # Setting an environment variable with the value of a configuration variable
  env_var: ${{ vars.ENV_CONTEXT_VAR }}

jobs:
  display-variables:
    name: ${{ vars.JOB_NAME }}
    # You can use configuration variables with the `vars` context for dynamic jobs
    if: ${{ vars.USE_VARIABLES == 'true' }}
    runs-on: ${{ vars.RUNNER }}
    environment: ${{ vars.ENVIRONMENT_STAGE }}
    steps:
    - name: Use variables
      run: |
        echo "repository variable : $REPOSITORY_VAR"
        echo "organization variable : $ORGANIZATION_VAR"
        echo "overridden variable : $OVERRIDE_VAR"
        echo "variable from shell environment : $env_var"
      env:
        REPOSITORY_VAR: ${{ vars.REPOSITORY_VAR }}
        ORGANIZATION_VAR: ${{ vars.ORGANIZATION_VAR }}
        OVERRIDE_VAR: ${{ vars.OVERRIDE_VAR }}
        
    - name: ${{ vars.HELLO_WORLD_STEP }}
      if: ${{ vars.HELLO_WORLD_ENABLED == 'true' }}
      uses: actions/hello-world-javascript-action@main
      with:
        who-to-greet: ${{ vars.GREET_NAME }}
```

## Detecting the operating system

You can write a single workflow file that can be used for different operating systems by using the `RUNNER_OS` default environment variable and the corresponding context property <span style="white-space: nowrap;">`${{ runner.os }}`</span>. For example, the following workflow could be run successfully if you changed the operating system from `macos-latest` to `windows-latest` without having to alter the syntax of the environment variables, which differs depending on the shell being used by the runner.

```yaml copy
on: workflow_dispatch

jobs:
  if-Windows-else:
    runs-on: macos-latest
    steps:
      - name: condition 1
        if: runner.os == 'Windows'
        run: echo "The operating system on the runner is $env:RUNNER_OS."
      - name: condition 2
        if: runner.os != 'Windows'
        run: echo "The operating system on the runner is not Windows, it's $RUNNER_OS."
```

In this example, the two `if` statements check the `os` property of the `runner` context to determine the operating system of the runner. `if` conditionals are processed by GitHub Actions, and only steps where the check resolves as `true` are sent to the runner. Here one of the checks will always be `true` and the other `false`, so only one of these steps is sent to the runner. Once the job is sent to the runner, the step is executed and the environment variable in the `echo` command is interpolated using the appropriate syntax (`$env:NAME` for PowerShell on Windows, and `$NAME` for bash and sh on Linux and macOS). In this example, the statement `runs-on: macos-latest` means that the second step will be run.

## Passing values between steps and jobs in a workflow

If you generate a value in one step of a job, you can use the value in subsequent steps of the same job by assigning the value to an existing or new environment variable and then writing this to the `GITHUB_ENV` environment file. The environment file can be used directly by an action, or from a shell command in the workflow file by using the `run` keyword. For more information, see [Workflow commands for GitHub Actions](/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-environment-variable).

If you want to pass a value from a step in one job in a workflow to a step in another job in the workflow, you can define the value as a job output. You can then reference this job output from a step in another job. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idoutputs).

## Next steps

For reference information, see [Variables reference](/en/actions/reference/variables-reference).
---

# Using conditions to control job execution

Prevent a job from running unless your conditions are met.

You can use the `jobs.<job_id>.if` conditional to prevent a job from running unless a condition is met. You can use any supported context and expression to create a conditional. For more information on which contexts are supported in this key, see [Contexts reference](/en/actions/learn-github-actions/contexts#context-availability).

### Example: Only run job for a specific repository

This example uses `if` to control when the `production-deploy` job can run. It will only run if the repository is named `octo-repo-prod` and is within the `octo-org` organization. Otherwise, the job will be marked as *skipped*.

```yaml copy
name: example-workflow
on: [push]
jobs:
  production-deploy:
    if: ${{ github.repository == 'octo-org/octo-repo-prod' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
```

Skipped jobs display the message "This check was skipped."

> \[!NOTE]
> A job that is skipped will report its status as "Success". It will not prevent a pull request from merging, even if it is a required check.

To debug why a job was skipped or ran unexpectedly, you can view job condition expression logs. For more information, see [Viewing job condition expression logs](/en/actions/how-tos/monitor-workflows/view-job-condition-logs).
---

# Control the concurrency of workflows and jobs

Manage which workflows and jobs can run simultaneously.

## Using concurrency in different scenarios

You can use `jobs.<job_id>.concurrency` to ensure that only a single job or workflow using the same concurrency group will run at a time. A concurrency group can be any string or expression. Allowed expression contexts: [`github`](/en/actions/learn-github-actions/contexts#github-context), [`inputs`](/en/actions/learn-github-actions/contexts#inputs-context), [`vars`](/en/actions/learn-github-actions/contexts#vars-context), [`needs`](/en/actions/learn-github-actions/contexts#needs-context), [`strategy`](/en/actions/learn-github-actions/contexts#strategy-context), and [`matrix`](/en/actions/learn-github-actions/contexts#matrix-context). For more information about expressions, see [Evaluate expressions in workflows and actions](/en/actions/learn-github-actions/expressions).

You can also specify `concurrency` at the workflow level. For more information, see [`concurrency`](/en/actions/using-workflows/workflow-syntax-for-github-actions#concurrency).

This means that there can be at most one running and one pending job in a concurrency group at any time. When a concurrent job or workflow is queued, if another job or workflow using the same concurrency group in the repository is in progress, the queued job or workflow will be `pending`. Any existing `pending` job or workflow in the same concurrency group, if it exists, will be canceled and the new queued job or workflow will take its place.

To also cancel any currently running job or workflow in the same concurrency group, specify `cancel-in-progress: true`. To conditionally cancel currently running jobs or workflows in the same concurrency group, you can specify `cancel-in-progress` as an expression with any of the allowed expression contexts.

> \[!NOTE]
>
> * The concurrency group name is case insensitive. For example, `prod` and `Prod` will be treated as the same concurrency group.
> * Ordering is not guaranteed for jobs or workflow runs using concurrency groups. Jobs or workflow runs in the same concurrency group are handled in an arbitrary order.

### Example: Using concurrency and the default behavior

The default behavior of GitHub Actions is to allow multiple jobs or workflow runs to run concurrently. The `concurrency` keyword allows you to control the concurrency of workflow runs.

For example, you can use the `concurrency` keyword immediately after where trigger conditions are defined to limit the concurrency of entire workflow runs for a specific branch:

```yaml
on:
  push:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

You can also limit the concurrency of jobs within a workflow by using the `concurrency` keyword at the job level:

```yaml
on:
  push:
    branches:
      - main

jobs:
  job-1:
    runs-on: ubuntu-latest
    concurrency:
      group: example-group
      cancel-in-progress: true
```

### Example: Concurrency groups

Concurrency groups provide a way to manage and limit the execution of workflow runs or jobs that share the same concurrency key.

The `concurrency` key is used to group workflows or jobs together into a concurrency group. When you define a `concurrency` key, GitHub Actions ensures that only one workflow or job with that key runs at any given time. If a new workflow run or job starts with the same `concurrency` key, GitHub Actions will cancel any workflow or job already running with that key. The `concurrency` key can be a hard-coded string, or it can be a dynamic expression that includes context variables.

It is possible to define concurrency conditions in your workflow so that the workflow or job is part of a concurrency group.

This means that when a workflow run or job starts, GitHub will cancel any workflow runs or jobs that are already in progress in the same concurrency group. This is useful in scenarios where you want to prevent parallel runs for a certain set of a workflows or jobs, such as the ones used for deployments to a staging environment, in order to prevent actions that could cause conflicts or consume more resources than necessary.

In this example, `job-1` is part of a concurrency group named `staging_environment`. This means that if a new run of `job-1` is triggered, any runs of the same job in the `staging_environment` concurrency group that are already in progress will be cancelled.

```yaml
jobs:
  job-1:
    runs-on: ubuntu-latest
    concurrency:
      group: staging_environment
      cancel-in-progress: true
```

Alternatively, using a dynamic expression such as `concurrency: ci-${{ github.ref }}` in your workflow means that the workflow or job would be part of a concurrency group named `ci-` followed by the reference of the branch or tag that triggered the workflow. In this example, if a new commit is pushed to the main branch while a previous run is still in progress, the previous run will be cancelled and the new one will start:

```yaml
on:
  push:
    branches:
      - main

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

### Example: Using concurrency to cancel any in-progress job or run

To use concurrency to cancel any in-progress job or run in GitHub Actions, you can use the `concurrency` key with the `cancel-in-progress` option set to `true`:

```yaml
concurrency:
  group: ${{ github.ref }}
  cancel-in-progress: true
```

Note that in this example, without defining a particular concurrency group, GitHub Actions will cancel *any* in-progress run of the job or workflow.

### Example: Using a fallback value

If you build the group name with a property that is only defined for specific events, you can use a fallback value. For example, `github.head_ref` is only defined on `pull_request` events. If your workflow responds to other events in addition to `pull_request` events, you will need to provide a fallback to avoid a syntax error. The following concurrency group cancels in-progress jobs or runs on `pull_request` events only; if `github.head_ref` is undefined, the concurrency group will fallback to the run ID, which is guaranteed to be both unique and defined for the run.

```yaml
concurrency:
  group: ${{ github.head_ref || github.run_id }}
  cancel-in-progress: true
```

### Example: Only cancel in-progress jobs or runs for the current workflow

If you have multiple workflows in the same repository, concurrency group names must be unique across workflows to avoid canceling in-progress jobs or runs from other workflows. Otherwise, any previously in-progress or pending job will be canceled, regardless of the workflow.

To only cancel in-progress runs of the same workflow, you can use the `github.workflow` property to build the concurrency group:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Example: Only cancel in-progress jobs on specific branches

If you would like to cancel in-progress jobs on certain branches but not on others, you can use conditional expressions with `cancel-in-progress`. For example, you can do this if you would like to cancel in-progress jobs on development branches but not on release branches.

To only cancel in-progress runs of the same workflow when not running on a release branch, you can set `cancel-in-progress` to an expression similar to the following:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ !contains(github.ref, 'release/')}}
```

In this example, multiple pushes to a `release/1.2.3` branch would not cancel in-progress runs. Pushes to another branch, such as `main`, would cancel in-progress runs.

## Monitoring your current jobs in your organization or enterprise

To identify any constraints with concurrency or queuing, you can check how many jobs are currently being processed on the GitHub-hosted runners in your organization or enterprise. For more information, see [Viewing your current jobs](/en/actions/using-github-hosted-runners/monitoring-your-current-jobs).
---

# Triggering a workflow

How to automatically trigger GitHub Actions workflows

## Prerequisites

To learn more about workflows and triggering workflows, see [Workflows](/en/actions/concepts/workflows-and-actions/workflows).

## Triggering a workflow from a workflow

When you use the repository's `GITHUB_TOKEN` to perform tasks, events triggered by the `GITHUB_TOKEN`, with the exception of `workflow_dispatch` and `repository_dispatch`, will not create a new workflow run. This prevents you from accidentally creating recursive workflow runs. For example, if a workflow run pushes code using the repository's `GITHUB_TOKEN`, a new workflow will not run even when the repository contains a workflow configured to run when `push` events occur. For more information, see [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication).

If you do want to trigger a workflow from within a workflow run, you can use a GitHub App installation access token or a personal access token instead of `GITHUB_TOKEN` to trigger events that require a token.

If you use a GitHub App, you'll need to create a GitHub App and store the app ID and private key as secrets. For more information, see [Making authenticated API requests with a GitHub App in a GitHub Actions workflow](/en/apps/creating-github-apps/guides/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow). If you use a personal access token, you'll need to create a personal access token and store it as a secret. For more information about creating a personal access token, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token). For more information about storing secrets, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

To minimize your GitHub Actions usage costs, ensure that you don't create recursive or unintended workflow runs.

For example, the following workflow uses a personal access token (stored as a secret called `MY_TOKEN`) to add a label to an issue via GitHub CLI. Any workflows that run when a label is added will run once this step is performed.

```yaml
on:
  issues:
    types:
      - opened

jobs:
  label_issue:
    runs-on: ubuntu-latest
    steps:
      - env:
          GH_TOKEN: ${{ secrets.MY_TOKEN }}
          ISSUE_URL: ${{ github.event.issue.html_url }}
        run: |
          gh issue edit $ISSUE_URL --add-label "triage"
```

Conversely, the following workflow uses `GITHUB_TOKEN` to add a label to an issue. It will not trigger any workflows that run when a label is added.

```yaml
on:
  issues:
    types:
      - opened

jobs:
  label_issue:
    runs-on: ubuntu-latest
    steps:
      - env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ISSUE_URL: ${{ github.event.issue.html_url }}
        run: |
          gh issue edit $ISSUE_URL --add-label "triage"
```

## Using events to trigger workflows

Use the `on` key to specify what events trigger your workflow. For more information about events you can use, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows).

### Using a single event

For example, a workflow with the following `on` value will run when a push is made to any branch in the workflow's repository:

```yaml
on: push
```

### Using multiple events

You can specify a single event or multiple events. For example, a workflow with the following `on` value will run when a push is made to any branch in the repository or when someone forks the repository:

```yaml
on: [push, fork]
```

If you specify multiple events, only one of those events needs to occur to trigger your workflow. If multiple triggering events for your workflow occur at the same time, multiple workflow runs will be triggered.

### Using activity types and filters with multiple events

You can use activity types and filters to further control when your workflow will run. For more information, see [Using event activity types](#using-event-activity-types) and [Using filters](#using-filters). If you specify activity types or filters for an event and your workflow triggers on multiple events, you must configure each event separately. You must append a colon (`:`) to all events, including events without configuration.

For example, a workflow with the following `on` value will run when:

* A label is created
* A push is made to the `main` branch in the repository
* A push is made to a GitHub Pages-enabled branch

```yaml
on:
  label:
    types:
      - created
  push:
    branches:
      - main
  page_build:
```

## Using event activity types

Some events have activity types that give you more control over when your workflow should run. Use `on.<event_name>.types` to define the type of event activity that will trigger a workflow run.

For example, the `issue_comment` event has the `created`, `edited`, and `deleted` activity types. If your workflow triggers on the `label` event, it will run whenever a label is created, edited, or deleted. If you specify the `created` activity type for the `label` event, your workflow will run when a label is created but not when a label is edited or deleted.

```yaml
on:
  label:
    types:
      - created
```

If you specify multiple activity types, only one of those event activity types needs to occur to trigger your workflow. If multiple triggering event activity types for your workflow occur at the same time, multiple workflow runs will be triggered. For example, the following workflow triggers when an issue is opened or labeled. If an issue with two labels is opened, three workflow runs will start: one for the issue opened event and two for the two issue labeled events.

```yaml
on:
  issues:
    types:
      - opened
      - labeled
```

For more information about each event and their activity types, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows).

## Using filters

Some events have filters that give you more control over when your workflow should run.

For example, the `push` event has a `branches` filter that causes your workflow to run only when a push to a branch that matches the `branches` filter occurs, instead of when any push occurs.

```yaml
on:
  push:
    branches:
      - main
      - 'releases/**'
```

### Using filters to target specific branches for pull request events

When using the `pull_request` and `pull_request_target` events, you can configure a workflow to run only for pull requests that target specific branches.

Use the `branches` filter when you want to include branch name patterns or when you want to both include and exclude branch names patterns. Use the `branches-ignore` filter when you only want to exclude branch name patterns. You cannot use both the `branches` and `branches-ignore` filters for the same event in a workflow.

If you define both `branches`/`branches-ignore` and [`paths`/`paths-ignore`](/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore), the workflow will only run when both filters are satisfied.

The `branches` and `branches-ignore` keywords accept glob patterns that use characters like `*`, `**`, `+`, `?`, `!` and others to match more than one branch name. If a name contains any of these characters and you want a literal match, you need to escape each of these special characters with `\`. For more information about glob patterns, see the [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet).

#### Example: Including branches

The patterns defined in `branches` are evaluated against the Git ref's name. For example, the following workflow would run whenever there is a `pull_request` event for a pull request targeting:

* A branch named `main` (`refs/heads/main`)
* A branch named `mona/octocat` (`refs/heads/mona/octocat`)
* A branch whose name starts with `releases/`, like `releases/10` (`refs/heads/releases/10`)

```yaml
on:
  pull_request:
    # Sequence of patterns matched against refs/heads
    branches:
      - main
      - 'mona/octocat'
      - 'releases/**'
```

If a workflow is skipped due to branch filtering, [path filtering](/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore), or a [commit message](/en/actions/managing-workflow-runs/skipping-workflow-runs), then checks associated with that workflow will remain in a "Pending" state. A pull request that requires those checks to be successful will be blocked from merging.

#### Example: Excluding branches

When a pattern matches the `branches-ignore` pattern, the workflow will not run. The patterns defined in `branches-ignore` are evaluated against the Git ref's name. For example, the following workflow would run whenever there is a `pull_request` event unless the pull request is targeting:

* A branch named `mona/octocat` (`refs/heads/mona/octocat`)
* A branch whose name matches `releases/**-alpha`, like `releases/beta/3-alpha` (`refs/heads/releases/beta/3-alpha`) <!-- markdownlint-disable-line outdated-release-phase-terminology -->

```yaml
on:
  pull_request:
    # Sequence of patterns matched against refs/heads
    branches-ignore:
      - 'mona/octocat'
      - 'releases/**-alpha'
```

#### Example: Including and excluding branches

You cannot use `branches` and `branches-ignore` to filter the same event in a single workflow. If you want to both include and exclude branch patterns for a single event, use the `branches` filter along with the `!` character to indicate which branches should be excluded.

If you define a branch with the `!` character, you must also define at least one branch without the `!` character. If you only want to exclude branches, use `branches-ignore` instead.

The order that you define patterns matters.

* A matching negative pattern (prefixed with `!`) after a positive match will exclude the Git ref.
* A matching positive pattern after a negative match will include the Git ref again.

The following workflow will run on `pull_request` events for pull requests that target `releases/10` or `releases/beta/mona`, but not for pull requests that target `releases/10-alpha` or `releases/beta/3-alpha` because the negative pattern `!releases/**-alpha` follows the positive pattern. <!-- markdownlint-disable-line outdated-release-phase-terminology -->

```yaml
on:
  pull_request:
    branches:
      - 'releases/**'
      - '!releases/**-alpha'
```

### Using filters to target specific branches or tags for push events

When using the `push` event, you can configure a workflow to run on specific branches or tags.

Use the `branches` filter when you want to include branch name patterns or when you want to both include and exclude branch names patterns. Use the `branches-ignore` filter when you only want to exclude branch name patterns. You cannot use both the `branches` and `branches-ignore` filters for the same event in a workflow.

Use the `tags` filter when you want to include tag name patterns or when you want to both include and exclude tag names patterns. Use the `tags-ignore` filter when you only want to exclude tag name patterns. You cannot use both the `tags` and `tags-ignore` filters for the same event in a workflow.

If you define only `tags`/`tags-ignore` or only `branches`/`branches-ignore`, the workflow won't run for events affecting the undefined Git ref. If you define neither `tags`/`tags-ignore` or `branches`/`branches-ignore`, the workflow will run for events affecting either branches or tags. If you define both `branches`/`branches-ignore` and [`paths`/`paths-ignore`](/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore), the workflow will only run when both filters are satisfied.

The `branches`, `branches-ignore`, `tags`, and `tags-ignore` keywords accept glob patterns that use characters like `*`, `**`, `+`, `?`, `!` and others to match more than one branch or tag name. If a name contains any of these characters and you want a literal match, you need to *escape* each of these special characters with `\`. For more information about glob patterns, see the [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet).

#### Example: Including branches and tags

The patterns defined in `branches` and `tags` are evaluated against the Git ref's name. For example, the following workflow would run whenever there is a `push` event to:

* A branch named `main` (`refs/heads/main`)
* A branch named `mona/octocat` (`refs/heads/mona/octocat`)
* A branch whose name starts with `releases/`, like `releases/10` (`refs/heads/releases/10`)
* A tag named `v2` (`refs/tags/v2`)
* A tag whose name starts with `v1.`, like `v1.9.1` (`refs/tags/v1.9.1`)

```yaml
on:
  push:
    # Sequence of patterns matched against refs/heads
    branches:
      - main
      - 'mona/octocat'
      - 'releases/**'
    # Sequence of patterns matched against refs/tags
    tags:
      - v2
      - v1.*
```

#### Example: Excluding branches and tags

When a pattern matches the `branches-ignore` or `tags-ignore` pattern, the workflow will not run. The patterns defined in `branches` and `tags` are evaluated against the Git ref's name. For example, the following workflow would run whenever there is a `push` event, unless the `push` event is to:

* A branch named `mona/octocat` (`refs/heads/mona/octocat`)
* A branch whose name matches `releases/**-alpha`, like `releases/beta/3-alpha` (`refs/heads/releases/beta/3-alpha`) <!-- markdownlint-disable-line outdated-release-phase-terminology -->
* A tag named `v2` (`refs/tags/v2`)
* A tag whose name starts with `v1.`, like `v1.9` (`refs/tags/v1.9`)

```yaml
on:
  push:
    # Sequence of patterns matched against refs/heads
    branches-ignore:
      - 'mona/octocat'
      - 'releases/**-alpha'
    # Sequence of patterns matched against refs/tags
    tags-ignore:
      - v2
      - v1.*
```

#### Example: Including and excluding branches and tags

You can't use `branches` and `branches-ignore` to filter the same event in a single workflow. Similarly, you can't use `tags` and `tags-ignore` to filter the same event in a single workflow. If you want to both include and exclude branch or tag patterns for a single event, use the `branches` or `tags` filter along with the `!` character to indicate which branches or tags should be excluded.

If you define a branch with the `!` character, you must also define at least one branch without the `!` character. If you only want to exclude branches, use `branches-ignore` instead. Similarly, if you define a tag with the `!` character, you must also define at least one tag without the `!` character. If you only want to exclude tags, use `tags-ignore` instead.

The order that you define patterns matters.

* A matching negative pattern (prefixed with `!`) after a positive match will exclude the Git ref.
* A matching positive pattern after a negative match will include the Git ref again.

The following workflow will run on pushes to `releases/10` or `releases/beta/mona`, but not on `releases/10-alpha` or `releases/beta/3-alpha` because the negative pattern `!releases/**-alpha` follows the positive pattern. <!-- markdownlint-disable-line outdated-release-phase-terminology -->

```yaml
on:
  push:
    branches:
      - 'releases/**'
      - '!releases/**-alpha'
```

### Using filters to target specific paths for pull request or push events

When using the `push` and `pull_request` events, you can configure a workflow to run based on what file paths are changed. Path filters are not evaluated for pushes of tags.

Use the `paths` filter when you want to include file path patterns or when you want to both include and exclude file path patterns. Use the `paths-ignore` filter when you only want to exclude file path patterns. You cannot use both the `paths` and `paths-ignore` filters for the same event in a workflow. If you want to both include and exclude path patterns for a single event, use the `paths` filter prefixed with the `!` character to indicate which paths should be excluded.

> \[!NOTE]
> The order that you define `paths` patterns matters:
>
> * A matching negative pattern (prefixed with `!`) after a positive match will exclude the path.
> * A matching positive pattern after a negative match will include the path again.

If you define both `branches`/`branches-ignore` and `paths`/`paths-ignore`, the workflow will only run when both filters are satisfied.

The `paths` and `paths-ignore` keywords accept glob patterns that use the `*` and `**` wildcard characters to match more than one path name. For more information, see the [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet).

#### Example: Including paths

If at least one path matches a pattern in the `paths` filter, the workflow runs. For example, the following workflow would run anytime you push a JavaScript file (`.js`).

```yaml
on:
  push:
    paths:
      - '**.js'
```

If a workflow is skipped due to path filtering, [branch filtering](/en/actions/using-workflows/workflow-syntax-for-github-actions#onpull_requestpull_request_targetbranchesbranches-ignore), or a [commit message](/en/actions/managing-workflow-runs/skipping-workflow-runs), then checks associated with that workflow will remain in a "Pending" state. A pull request that requires those checks to be successful will be blocked from merging.

#### Example: Excluding paths

When all the path names match patterns in `paths-ignore`, the workflow will not run. If any path names do not match patterns in `paths-ignore`, even if some path names match the patterns, the workflow will run.

A workflow with the following path filter will only run on `push` events that include at least one file outside the `docs` directory at the root of the repository.

```yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
```

#### Example: Including and excluding paths

You cannot use `paths` and `paths-ignore` to filter the same event in a single workflow. If you want to both include and exclude path patterns for a single event, use the `paths` filter prefixed with the `!` character to indicate which paths should be excluded.

If you define a path with the `!` character, you must also define at least one path without the `!` character. If you only want to exclude paths, use `paths-ignore` instead.

The order that you define `paths` patterns matters:

* A matching negative pattern (prefixed with `!`) after a positive match will exclude the path.
* A matching positive pattern after a negative match will include the path again.

This example runs anytime the `push` event includes a file in the `sub-project` directory or its subdirectories, unless the file is in the `sub-project/docs` directory. For example, a push that changed `sub-project/index.js` or `sub-project/src/index.js` will trigger a workflow run, but a push changing only `sub-project/docs/readme.md` will not.

```yaml
on:
  push:
    paths:
      - 'sub-project/**'
      - '!sub-project/docs/**'
```

#### Git diff comparisons

> \[!NOTE]
> If you push more than 1,000 commits, or if GitHub does not generate the diff due to a timeout, the workflow will always run.

The filter determines if a workflow should run by evaluating the changed files and running them against the `paths-ignore` or `paths` list. If there are no files changed, the workflow will not run.

GitHub generates the list of changed files using two-dot diffs for pushes and three-dot diffs for pull requests:

* **Pull requests:** Three-dot diffs are a comparison between the most recent version of the topic branch and the commit where the topic branch was last synced with the base branch.
* **Pushes to existing branches:** A two-dot diff compares the head and base SHAs directly with each other.
* **Pushes to new branches:** A two-dot diff against the parent of the ancestor of the deepest commit pushed.

> \[!NOTE]
> Diffs are limited to 300 files. If there are files changed that aren't matched in the first 300 files returned by the filter, the workflow will not run. You may need to create more specific filters so that the workflow will run automatically.

For more information, see [About comparing branches in pull requests](/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-comparing-branches-in-pull-requests).

### Using filters to target specific branches for workflow run events

When using the `workflow_run` event, you can specify what branches the triggering workflow must run on in order to trigger your workflow.

The `branches` and `branches-ignore` filters accept glob patterns that use characters like `*`, `**`, `+`, `?`, `!` and others to match more than one branch name. If a name contains any of these characters and you want a literal match, you need to *escape* each of these special characters with `\`. For more information about glob patterns, see the [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet).

For example, a workflow with the following trigger will only run when the workflow named `Build` runs on a branch whose name starts with `releases/`:

```yaml
on:
  workflow_run:
    workflows: ["Build"]
    types: [requested]
    branches:
      - 'releases/**'
```

A workflow with the following trigger will only run when the workflow named `Build` runs on a branch that is not named `canary`:

```yaml
on:
  workflow_run:
    workflows: ["Build"]
    types: [requested]
    branches-ignore:
      - "canary"
```

You cannot use both the `branches` and `branches-ignore` filters for the same event in a workflow. If you want to both include and exclude branch patterns for a single event, use the `branches` filter along with the `!` character to indicate which branches should be excluded.

The order that you define patterns matters.

* A matching negative pattern (prefixed with `!`) after a positive match will exclude the branch.
* A matching positive pattern after a negative match will include the branch again.

For example, a workflow with the following trigger will run when the workflow named `Build` runs on a branch that is named `releases/10` or `releases/beta/mona` but will not `releases/10-alpha`, `releases/beta/3-alpha`, or `main`. <!-- markdownlint-disable-line outdated-release-phase-terminology -->

```yaml
on:
  workflow_run:
    workflows: ["Build"]
    types: [requested]
    branches:
      - 'releases/**'
      - '!releases/**-alpha'
```

## Defining inputs for manually triggered workflows

When using the `workflow_dispatch` event, you can optionally specify inputs that are passed to the workflow.

This trigger only receives events when the workflow file is on the default branch.
The triggered workflow receives the inputs in the `inputs` context. For more information, see [Contexts](/en/actions/learn-github-actions/contexts#inputs-context).

> \[!NOTE]
>
> * The workflow will also receive the inputs in the `github.event.inputs` context. The information in the `inputs` context and `github.event.inputs` context is identical except that the `inputs` context preserves Boolean values as Booleans instead of converting them to strings. The `choice` type resolves to a string and is a single selectable option.
> * The maximum number of top-level properties for `inputs` is 25 .
> * The maximum payload for `inputs` is 65,535 characters.

```yaml
on:
  workflow_dispatch:
    inputs:
      logLevel:
        description: 'Log level'
        required: true
        default: 'warning'
        type: choice
        options:
          - info
          - warning
          - debug
      print_tags:
        description: 'True to print to STDOUT'
        required: true
        type: boolean
      tags:
        description: 'Test scenario tags'
        required: true
        type: string
      environment:
        description: 'Environment to run tests against'
        type: environment
        required: true

jobs:
  print-tag:
    runs-on: ubuntu-latest
    if: ${{ inputs.print_tags }} 
    steps:
      - name: Print the input tag to STDOUT
        run: echo  The tags are ${{ inputs.tags }} 
```

## Defining inputs, outputs, and secrets for reusable workflows

You can define inputs and secrets that a reusable workflow should receive from a calling workflow. You can also specify outputs that a reusable workflow will make available to a calling workflow. For more information, see [Reuse workflows](/en/actions/using-workflows/reusing-workflows).

## Using event information

Information about the event that triggered a workflow run is available in the `github.event` context. The properties in the `github.event` context depend on the type of event that triggered the workflow. For example, a workflow triggered when an issue is labeled would have information about the issue and label.

### Viewing all properties of an event

Reference the webhook event documentation for common properties and example payloads. For more information, see [Webhook events and payloads](/en/webhooks-and-events/webhooks/webhook-events-and-payloads).

You can also print the entire `github.event` context to see what properties are available for the event that triggered your workflow:

```yaml
jobs:
  print_context:
    runs-on: ubuntu-latest
    steps:
      - env:
          EVENT_CONTEXT: ${{ toJSON(github.event) }}
        run: |
          echo $EVENT_CONTEXT
```

### Accessing and using event properties

You can use the `github.event` context in your workflow. For example, the following workflow runs when a pull request that changes `package*.json`, `.github/CODEOWNERS`, or `.github/workflows/**` is opened. If the pull request author (`github.event.pull_request.user.login`) is not `octobot` or `dependabot[bot]`, then the workflow uses the GitHub CLI to label and comment on the pull request (`github.event.pull_request.number`).

```yaml
on:
  pull_request:
    types:
      - opened
    paths:
      - '.github/workflows/**'
      - '.github/CODEOWNERS'
      - 'package*.json'

jobs:
  triage:
    if: >-
      github.event.pull_request.user.login != 'octobot' &&
      github.event.pull_request.user.login != 'dependabot[bot]'
    runs-on: ubuntu-latest
    steps:
      - name: "Comment about changes we can't accept"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR: ${{ github.event.pull_request.html_url }}
        run: |
          gh pr edit $PR --add-label 'invalid'
          gh pr comment $PR --body 'It looks like you edited `package*.json`, `.github/CODEOWNERS`, or `.github/workflows/**`. We do not allow contributions to these files. Please review our [contributing guidelines](https://github.com/octo-org/octo-repo/blob/main/CONTRIBUTING.md) for what contributions are accepted.'
```

For more information about contexts, see [Contexts reference](/en/actions/learn-github-actions/contexts). For more information about event payloads, see [Webhook events and payloads](/en/webhooks-and-events/webhooks/webhook-events-and-payloads).

## Further controlling how your workflow will run

If you want more granular control than events, event activity types, or event filters provide, you can use conditionals and environments to control whether individual jobs or steps in your workflow will run.

### Using conditionals

You can use conditionals to further control whether jobs or steps in your workflow will run.

#### Example using a value in the event payload

For example, if you want the workflow to run when a specific label is added to an issue, you can trigger on the `issues labeled` event activity type and use a conditional to check what label triggered the workflow. The following workflow will run when any label is added to an issue in the workflow's repository, but the `run_if_label_matches` job will only execute if the label is named `bug`.

```yaml
on:
  issues:
    types:
      - labeled

jobs:
  run_if_label_matches:
    if: github.event.label.name == 'bug'
    runs-on: ubuntu-latest
    steps:
      - run: echo 'The label was bug'
```

#### Example using event type

For example, if you want to run different jobs or steps depending on what event triggered the workflow, you can use a conditional to check whether a specific event type exists in the event context. The following workflow will run whenever an issue or pull request is closed. If the workflow ran because an issue was closed, the `github.event` context will contain a value for `issue` but not for `pull_request`. Therefore, the `if_issue` step will run but the `if_pr` step will not run. Conversely, if the workflow ran because a pull request was closed, the `if_pr` step will run but the `if_issue` step will not run.

```yaml
on:
  issues:
    types:
      - closed
  pull_request:
    types:
      - closed

jobs:
  state_event_type:
    runs-on: ubuntu-latest
    steps:
    - name: if_issue
      if: github.event.issue
      run: |
        echo An issue was closed
    - name: if_pr
      if: github.event.pull_request
      run: |
        echo A pull request was closed
```

For more information about what information is available in the event context, see [Using event information](#using-event-information). For more information about how to use conditionals, see [Evaluate expressions in workflows and actions](/en/actions/learn-github-actions/expressions).

### Using environments to manually trigger workflow jobs

If you want to manually trigger a specific job in a workflow, you can use an environment that requires approval from a specific team or user. First, configure an environment with required reviewers. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment). Then, reference the environment name in a job in your workflow using the `environment:` key. Any job referencing the environment will not run until at least one reviewer approves the job.

For example, the following workflow will run whenever there is a push to main. The `build` job will always run. The `publish` job will only run after the `build` job successfully completes (due to `needs: [build]`) and after all of the rules (including required reviewers) for the environment called `production` pass (due to `environment: production`).

```yaml
on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: build
        run: |
          echo 'building'

  publish:
    needs: [build]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: publish
        run: |
          echo 'publishing'
```

> \[!NOTE]
> Environments, environment secrets, and deployment protection rules are available in public repositories for all current GitHub plans. They are not available on legacy plans, such as Bronze, Silver, or Gold. For access to environments, environment secrets, and deployment branches in private or internal repositories, you must use GitHub Pro, GitHub Team, or GitHub Enterprise. If you are on a GitHub Free, GitHub Pro, or GitHub Team plan, other deployment protection rules, such as a wait timer or required reviewers, are only available for public repositories.

## Available events

For a full list of available events, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows).
---

# Choosing the runner for a job

Define the type of machine that will process a job in your workflow.

## Overview

Use `jobs.<job_id>.runs-on` to define the type of machine to run the job on.

* The destination machine can be either a [GitHub-hosted runner](#choosing-github-hosted-runners), [larger runner](#choosing-runners-in-a-group), or a [self-hosted runner](#choosing-self-hosted-runners).

- You can target runners based on the labels assigned to them, or their group membership, or a combination of these.

- You can provide `runs-on` as:
  * A single string
  * A single variable containing a string
  * An array of strings, variables containing strings, or a combination of both
  * A `key: value` pair using the `group` or `labels` keys

- If you specify an array of strings or variables, your workflow will execute on any runner that matches all of the specified `runs-on` values. For example, here the job will only run on a self-hosted runner that has the labels `linux`, `x64`, and `gpu`:

  ```yaml
  runs-on: [self-hosted, linux, x64, gpu]
  ```

  For more information, see [Choosing self-hosted runners](#choosing-self-hosted-runners).

- You can mix strings and variables in an array. For example:

  ```yaml
  on:
    workflow_dispatch:
      inputs:
        chosen-os:
          required: true
          type: choice
          options:
          - Ubuntu
          - macOS

  jobs:
    test:
      runs-on: [self-hosted, "${{ inputs.chosen-os }}"]
      steps:
      - run: echo Hello world!
  ```

- If you would like to run your workflow on multiple machines, use [`jobs.<job_id>.strategy`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategy).

> \[!NOTE]
> Quotation marks are not required around simple strings like `self-hosted`, but they are required for expressions like  `"${{ inputs.chosen-os }}"`.

## Choosing GitHub-hosted runners

If you use a GitHub-hosted runner, each job runs in a fresh instance of a runner image specified by `runs-on`.

The value for runs-on, when you are using a GitHub-hosted runner, is a runner label or the name of a runner group. The labels for the standard GitHub-hosted runners are shown in the following tables.

For more information, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners/about-github-hosted-runners).

### Standard GitHub-hosted runners for public repositories

For public repositories, jobs using the workflow labels shown in the table below will run with the associated specifications. With the exception of single-CPU runners, each GitHub-hosted runner is a new virtual machine (VM) hosted by GitHub. Single-CPU runners are hosted in a container on a shared VM—see [GitHub-hosted runners reference](/en/actions/reference/runners/github-hosted-runners#single-cpu-runners). Use of the standard GitHub-hosted runners is free and unlimited on public repositories.

<table style="width:100%">
  <thead>
    <tr>
      <th scope="col"><b>Virtual machine / container</b></th>
      <th scope="col"><b>Processor (CPU)</b></th>
      <th scope="col"><b>Memory (RAM)</b></th>
      <th scope="col"><b>Storage (SSD)</b></th>
      <th scope="col"><b>Architecture</b></th>
      <th scope="col"><b>Workflow label</b></th>
    </tr>
  </thead>
  <tbody>
    <tr>
          <td>Linux</td>
          <td>1</td>
          <td>5 GB</td>
          <td>14 GB</td>
          <td> x64 </td>
          <td>
            <code>ubuntu-slim</code>
          </td>
        </tr>
    <tr>
      <td>Linux</td>
      <td>4</td>
      <td>16 GB</td>
      <td>14 GB</td>
      <td> x64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md">ubuntu-latest</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md">ubuntu-24.04</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2204-Readme.md">ubuntu-22.04</a></code>
      </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>4</td>
      <td>16 GB</td>
      <td>14 GB</td>
      <td> x64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md">windows-latest</a></code>,
         <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md">windows-2025</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-VS2026-Readme.md">windows-2025-vs2026</a></code> (public preview),
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2022-Readme.md">windows-2022</a></code>
      </td>
    </tr>
    <tr>
      <td>Linux</td>
      <td>4</td>
      <td>16 GB</td>
      <td>14 GB</td>
      <td> arm64 </td>
      <td>
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-ubuntu-24-image.md">ubuntu-24.04-arm</a></code>,
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-ubuntu-22-image.md">ubuntu-22.04-arm</a></code>
      </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>4</td>
      <td>16 GB</td>
      <td>14 GB</td>
      <td>arm64</td>
      <td>
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-windows-11-image.md">windows-11-arm</a></code>
      </td>
    </tr>
    <tr>
      <td>macOS</td>
      <td>4</td>
      <td>14 GB</td>
      <td>14 GB</td>
      <td> Intel </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md">macos-15-intel</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md">macos-26-intel</a></code>
      </td>
    </tr>
    <tr>
      <td>macOS</td>
      <td>3 (M1)</td>
      <td>7 GB</td>
      <td>14 GB</td>
      <td> arm64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md">macos-latest</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-14-arm64-Readme.md">macos-14</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md">macos-15</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md">macos-26</a></code>
      </td>
    </tr>
  </tbody>

</table>

### Standard GitHub-hosted runners for  private repositories

For  private repositories, jobs using the workflow labels shown in the table below will run on virtual machines with the associated specifications. These runners use your GitHub account's allotment of free minutes, and are then charged at the per minute rates. See [Actions runner pricing](/en/billing/reference/actions-minute-multipliers).

<table style="width:100%">
  <thead>
    <tr>
      <th scope="col"><b>Virtual Machine</b></th>
      <th scope="col"><b>Processor (CPU)</b></th>
      <th scope="col"><b>Memory (RAM)</b></th>
      <th scope="col"><b>Storage (SSD)</b></th>
      <th scope="col"><b>Architecture</b></th>
      <th scope="col"><b>Workflow label</b></th>
    </tr>
  </thead>
  <tbody>
    <tr>
          <td>Linux</td>
          <td>1</td>
          <td>5 GB</td>
          <td>14 GB</td>
          <td> x64 </td>
          <td>
            <code>ubuntu-slim</code>
          </td>
        </tr>
    <tr>
      <td>Linux</td>
      <td>2</td>
      <td>8 GB</td>
      <td>14 GB</td>
      <td> x64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md">ubuntu-latest</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md">ubuntu-24.04</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2204-Readme.md">ubuntu-22.04</a></code>
      </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>2</td>
      <td>8 GB</td>
      <td>14 GB</td>
      <td> x64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md">windows-latest</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md">windows-2025</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2022-Readme.md">windows-2022</a></code>
      </td>
    </tr>
    <tr>
      <td>Linux</td>
      <td>2</td>
      <td>8 GB</td>
      <td>14 GB</td>
      <td> arm64 </td>
      <td>
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-ubuntu-24-image.md">ubuntu-24.04-arm</a></code>,
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-ubuntu-22-image.md">ubuntu-22.04-arm</a></code>
      </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>2</td>
      <td>8 GB</td>
      <td>14 GB</td>
      <td> arm64 </td>
      <td>
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-windows-11-image.md">windows-11-arm</a></code>
      </td>
    </tr>
    <tr>
      <td>macOS</td>
      <td>4</td>
      <td>14 GB</td>
      <td>14 GB</td>
      <td> Intel </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md">macos-15-intel</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md">macos-26-intel</a></code>
      </td>
    </tr>
    <tr>
      <td>macOS</td>
      <td>3 (M1)</td>
      <td>7 GB</td>
      <td>14 GB</td>
      <td> arm64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md">macos-latest</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-14-arm64-Readme.md">macos-14</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md">macos-15</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md">macos-26</a></code>
      </td>
    </tr>
  </tbody>
</table>

In addition to the standard GitHub-hosted runners, GitHub offers customers on GitHub Team and GitHub Enterprise Cloud plans a range of managed virtual machines with advanced features - for example, more cores and disk space, GPU-powered machines, and ARM-powered machines. For more information, see [Larger runners](/en/actions/using-github-hosted-runners/about-larger-runners/about-larger-runners).

> \[!NOTE]
> The `-latest` runner images are the latest stable images that GitHub provides, and might not be the most recent version of the operating system available from the operating system vendor.

> \[!WARNING]
> Beta and Deprecated Images are provided "as-is", "with all faults" and "as available" and are excluded from the service level agreement and warranty. Beta Images may not be covered by customer support.

#### Example: Specifying an operating system

```yaml
runs-on: ubuntu-latest
```

For more information, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners).

## Choosing self-hosted runners

To specify a self-hosted runner for your job, configure `runs-on` in your workflow file with self-hosted runner labels.

Self-hosted runners may have the `self-hosted` label. When setting up a self-hosted runner, by default we will include the label `self-hosted`. You may pass in the `--no-default-labels` flag to prevent the self-hosted label from being applied. Labels can be used to create targeting options for runners, such as operating system or architecture, we recommend providing an array of labels that begins with `self-hosted` (this must be listed first) and then includes additional labels as needed. When you specify an array of labels, jobs will be queued on runners that have all the labels that you specify.

> \[!NOTE] Actions Runner Controller does not support the `self-hosted` label.

#### Example: Using labels for runner selection

```yaml
runs-on: [self-hosted, linux]
```

For more information, see [Self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners) and [Using self-hosted runners in a workflow](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/using-self-hosted-runners-in-a-workflow).

## Choosing runners in a group

You can use `runs-on` to target runner groups, so that the job will execute on any runner that is a member of that group. For more granular control, you can also combine runner groups with labels.

Runner groups can only have [larger runners](/en/actions/using-github-hosted-runners/using-larger-runners/about-larger-runners) or [self-hosted runners](/en/actions/how-tos/managing-self-hosted-runners) as members.

#### Example: Using groups to control where jobs are run

In this example, Ubuntu runners have been added to a group called `ubuntu-runners`. The `runs-on` key sends the job to any available runner in the `ubuntu-runners` group:

```yaml
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on: 
      group: ubuntu-runners
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v
```

#### Example: Combining groups and labels

When you combine groups and labels, the runner must meet both requirements to be eligible to run the job.

In this example, a runner group called `ubuntu-runners` is populated with Ubuntu runners, which have also been assigned the label `ubuntu-24.04-16core`. The `runs-on` key combines `group` and `labels` so that the job is routed to any available runner within the group that also has a matching label:

```yaml
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on:
      group: ubuntu-runners
      labels: ubuntu-24.04-16core
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v
```
---

# Running jobs in a container

Use a container to run the steps in a job.

## Overview

Use `jobs.<job_id>.container` to create a container to run any steps in a job that don't already specify a container. If you have steps that use both script and container actions, the container actions will run as sibling containers on the same network with the same volume mounts.

If you do not set a `container`, all steps will run directly on the host specified by `runs-on` unless a step refers to an action configured to run in a container.

> \[!NOTE]
> The default shell for `run` steps inside a container is `sh` instead of `bash`. This can be overridden with [`jobs.<job_id>.defaults.run`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_iddefaultsrun) or [`jobs.<job_id>.steps[*].shell`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsshell).

### Example: Running a job within a container

```yaml copy
name: CI
on:
  push:
    branches: [ main ]
jobs:
  container-test-job:
    runs-on: ubuntu-latest
    container:
      image: node:18
      env:
        NODE_ENV: development
      ports:
        - 80
      volumes:
        - my_docker_volume:/volume_mount
      options: --cpus 1
    steps:
      - name: Check for dockerenv file
        run: (ls /.dockerenv && echo Found dockerenv) || (echo No dockerenv)
```

When you only specify a container image, you can omit the `image` keyword.

```yaml
jobs:
  container-test-job:
    runs-on: ubuntu-latest
    container: node:18
```

### Dockerfile instructions and overrides

A Dockerfile contains instructions and arguments that define the contents and startup behavior of a Docker container. For more information about the instructions Docker supports, see [Dockerfile reference](https://docs.docker.com/engine/reference/builder/) in the Docker documentation.

Some Docker instructions interact with GitHub Actions, and an action's metadata file can override some Docker instructions. Ensure that you are familiar with how your Dockerfile interacts with GitHub Actions to prevent any unexpected behavior.

For reference information, see [Dockerfile support for GitHub Actions](/en/actions/reference/dockerfile-support-for-github-actions).

## Defining the container image

Use `jobs.<job_id>.container.image` to define the Docker image to use as the container to run the action. The value can be the Docker Hub image name or a registry name.

> \[!NOTE]
> Docker Hub normally imposes rate limits on both push and pull operations which will affect jobs on self-hosted runners. However, GitHub-hosted runners are not subject to these limits based on an agreement between GitHub and Docker.

## Defining credentials for a container registry

If the image's container registry requires authentication to pull the image, you can use `jobs.<job_id>.container.credentials` to set a `map` of the `username` and `password`. The credentials are the same values that you would provide to the [`docker login`](https://docs.docker.com/engine/reference/commandline/login/) command.

### Example: Defining credentials for a container registry

```yaml
container:
  image: ghcr.io/owner/image
  credentials:
     username: ${{ github.actor }}
     password: ${{ secrets.github_token }}
```

## Using environment variables with a container

Use `jobs.<job_id>.container.env` to set a `map` of environment variables in the container.

## Exposing network ports on a container

Use `jobs.<job_id>.container.ports` to set an `array` of ports to expose on the container.

## Mounting volumes in a container

Use `jobs.<job_id>.container.volumes` to set an `array` of volumes for the container to use. You can use volumes to share data between services or other steps in a job. You can specify named Docker volumes, anonymous Docker volumes, or bind mounts on the host.

To specify a volume, you specify the source and destination path:

`<source>:<destinationPath>`.

The `<source>` is a volume name or an absolute path on the host machine, and `<destinationPath>` is an absolute path in the container.

### Example: Mounting volumes in a container

```yaml
volumes:
  - my_docker_volume:/volume_mount
  - /data/my_data
  - /source/directory:/destination/directory
```

## Setting container resource options

Use `jobs.<job_id>.container.options` to configure additional Docker container resource options. For a list of options, see [`docker create` options](https://docs.docker.com/engine/reference/commandline/create/#options).

> \[!WARNING]
> The `--network` and `--entrypoint` options are not supported.
---

# Using workflow templates

GitHub provides workflow templates for a variety of languages and tooling.

## Choosing and using a workflow template

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. If you already have a workflow in your repository, click **New workflow**.

4. The "Choose a workflow" page shows a selection of recommended workflow templates. Find the workflow template that you want to use, then click **Configure**. To help you find the workflow template that you want, you can search for keywords or filter by category.

5. If the workflow template contains comments detailing additional setup steps, follow these steps.

   There are guides to accompany many of the workflow templates for building and testing projects. For more information, see [Building and testing your code](/en/actions/automating-builds-and-tests).

6. Some workflow templates use secrets. For example, `${{ secrets.npm_token }}`. If the workflow template uses a secret, store the value described in the secret name as a secret in your repository. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

7. Optionally, make additional changes. For example, you might want to change the value of `on` when the workflow runs.

8. Click **Start commit**.

9. Write a commit message and decide whether to commit directly to the default branch or to open a pull request.

## Further reading

* [Continuous integration](/en/actions/automating-builds-and-tests/about-continuous-integration)

* [Managing workflow runs](/en/actions/managing-workflow-runs)

* [Monitor workflows](/en/actions/monitoring-and-troubleshooting-workflows/about-monitoring-and-troubleshooting)

* [GitHub Actions billing](/en/billing/managing-billing-for-github-actions)