# Reuse Automations

---

# Creating workflow templates for your organization

Learn how you can create workflow templates to help people in your team add new workflows more easily.

## Creating workflow templates

This procedure demonstrates how to create a workflow template and metadata file. The metadata file describes how the workflow templates will be presented to users when they are creating a new workflow.

1. If it doesn't already exist, create a new repository named `.github` in your organization.

2. Create a directory named `workflow-templates`.

3. Create your new workflow file inside the `workflow-templates` directory.

   If you need to refer to a repository's default branch, you can use the `$default-branch` placeholder. When a workflow is created the placeholder will be automatically replaced with the name of the repository's default branch.

   For example, this file named `octo-organization-ci.yml` demonstrates a basic workflow.

   ```yaml copy
   name: Octo Organization CI

   on:
     push:
       branches: [ $default-branch ]
     pull_request:
       branches: [ $default-branch ]

   jobs:
     build:
       runs-on: ubuntu-latest

       steps:
         - uses: actions/checkout@v5

         - name: Run a one-line script
           run: echo Hello from Octo Organization
   ```

4. Create a metadata file inside the `workflow-templates` directory. The metadata file must have the same name as the workflow file, but instead of the `.yml` extension, it must be appended with `.properties.json`. For example, this file named `octo-organization-ci.properties.json` contains the metadata for a workflow file named `octo-organization-ci.yml`:

   ```json copy
   {
       "name": "Octo Organization Workflow",
       "description": "Octo Organization CI workflow template.",
       "iconName": "example-icon",
       "categories": [
           "Go"
       ],
       "filePatterns": [
           "package.json$",
           "^Dockerfile",
           ".*\\.md$"
       ]
   }
   ```

   * `name` - **Required.** The name of the workflow. This is displayed in the list of available workflows.
   * `description` - **Required.** The description of the workflow. This is displayed in the list of available workflows.
   * `iconName` - **Optional.** Specifies an icon for the workflow that is displayed in the list of workflows. `iconName` can be one of the following types:
     * An SVG file that is stored in the `workflow-templates` directory. To reference a file, the value must be the file name without the file extension. For example, an SVG file named `example-icon.svg` is referenced as `example-icon`.
     * An icon from GitHub's set of [Octicons](https://primer.style/octicons/). To reference an octicon, the value must be `octicon <icon name>`. For example, `octicon smiley`.
   * `categories` - **Optional.** Defines the categories that the workflow is shown under. You can use category names from the following lists:
     * General category names from the [starter-workflows](https://github.com/actions/starter-workflows/blob/main/README.md#categories) repository.
     * Linguist languages from the list in the [linguist](https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml) repository.
     * Supported tech stacks from the list in the [starter-workflows](https://github.com/github-starter-workflows/repo-analysis-partner/blob/main/tech_stacks.yml) repository.
   * `filePatterns` - **Optional.** Allows the workflow to be used if the user's repository has a file in its root directory that matches a defined regular expression.

5. To add another workflow template, add your files to the same `workflow-templates` directory.

## Next steps

* For reference information about workflow templates, see [Reusing workflow configurations](/en/actions/reference/workflows-and-actions/reusing-workflow-configurations#workflow-templates).
---

# Reuse workflows

Learn how to avoid duplication when creating a workflow by reusing existing workflows.

## Creating a reusable workflow

Reusable workflows are YAML-formatted files, very similar to any other workflow file. As with other workflow files, you locate reusable workflows in the `.github/workflows` directory of a repository. Subdirectories of the `workflows` directory are not supported.

For a workflow to be reusable, the values for `on` must include `workflow_call`:

```yaml
on:
  workflow_call:
```

## Using inputs and secrets in a reusable workflow

You can define inputs and secrets, which can be passed from the caller workflow and then used within the called workflow. There are three stages to using an input or a secret in a reusable workflow.

1. In the reusable workflow, use the `inputs` and `secrets` keywords to define inputs or secrets that will be passed from a caller workflow.

   ```yaml
   on:
     workflow_call:
       inputs:
         config-path:
           required: true
           type: string
       secrets:
         personal_access_token:
           required: true
   ```

   For details of the syntax for defining inputs and secrets, see [`on.workflow_call.inputs`](/en/actions/using-workflows/workflow-syntax-for-github-actions#onworkflow_callinputs) and [`on.workflow_call.secrets`](/en/actions/using-workflows/workflow-syntax-for-github-actions#onworkflow_callsecrets).

2. In the reusable workflow, reference the input or secret that you defined in the `on` key in the previous step.

   > \[!NOTE]
   > If the secrets are inherited by using `secrets: inherit` in the calling workflow, you can reference them even if they are not explicitly defined in the `on` key. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idsecretsinherit).

   ```yaml
   jobs:
     reusable_workflow_job:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/labeler@v6
         with:
           repo-token: ${{ secrets.personal_access_token }}
           configuration-path: ${{ inputs.config-path }}
   ```

   In the example above, `personal_access_token` is a secret that's defined at the repository or organization level.

   > \[!WARNING]
   > Environment secrets cannot be passed from the caller workflow as `on.workflow_call` does not support the `environment` keyword. If you include `environment` in the reusable workflow at the job level, the environment secret will be used, and not the secret passed from the caller workflow. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment#environment-secrets) and [Workflow syntax for GitHub Actions](/en/actions/writing-workflows/workflow-syntax-for-github-actions#onworkflow_call).

3. Pass the input or secret from the caller workflow.

   To pass named inputs to a called workflow, use the `with` keyword in a job. Use the `secrets` keyword to pass named secrets. For inputs, the data type of the input value must match the type specified in the called workflow (either boolean, number, or string).

   ```yaml
   jobs:
     call-workflow-passing-data:
       uses: octo-org/example-repo/.github/workflows/reusable-workflow.yml@main
       with:
         config-path: .github/labeler.yml
       secrets:
         personal_access_token: ${{ secrets.token }}
   ```

   Workflows that call reusable workflows in the same organization or enterprise can use the `inherit` keyword to implicitly pass the secrets.

   ```yaml
   jobs:
     call-workflow-passing-data:
       uses: octo-org/example-repo/.github/workflows/reusable-workflow.yml@main
       with:
         config-path: .github/labeler.yml
       secrets: inherit
   ```

### Example reusable workflow

This reusable workflow file named `workflow-B.yml` (we'll refer to this later in the [example caller workflow](#example-caller-workflow)) takes an input string and a secret from the caller workflow and uses them in an action.

```yaml copy
name: Reusable workflow example

on:
  workflow_call:
    inputs:
      config-path:
        required: true
        type: string
    secrets:
      token:
        required: true

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/labeler@v6
      with:
        repo-token: ${{ secrets.token }}
        configuration-path: ${{ inputs.config-path }}
```

## Calling a reusable workflow

You call a reusable workflow by using the `uses` keyword. Unlike when you are using actions within a workflow, you call reusable workflows directly within a job, and not from within job steps.

[`jobs.<job_id>.uses`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_iduses)

You reference reusable workflow files using one of the following syntaxes:

* `{owner}/{repo}/.github/workflows/{filename}@{ref}` for reusable workflows in public and private repositories.
* `./.github/workflows/{filename}` for reusable workflows in the same repository.

In the first option, `{ref}` can be a SHA, a release tag, or a branch name. If a release tag and a branch have the same name, the release tag takes precedence over the branch name. Using the commit SHA is the safest option for stability and security. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#reusing-third-party-workflows).

If you use the second syntax option (without `{owner}/{repo}` and `@{ref}`) the called workflow is from the same commit as the caller workflow. Ref prefixes such as `refs/heads` and `refs/tags` are not allowed. You cannot use contexts or expressions in this keyword.

You can call multiple workflows, referencing each in a separate job.

```yaml
jobs:
  call-workflow-1-in-local-repo:
    uses: octo-org/this-repo/.github/workflows/workflow-1.yml@172239021f7ba04fe7327647b213799853a9eb89
  call-workflow-2-in-local-repo:
    uses: ./.github/workflows/workflow-2.yml
  call-workflow-in-another-repo:
    uses: octo-org/another-repo/.github/workflows/workflow.yml@v1
```

### Example caller workflow

This workflow file calls two workflow files. The second of these, `workflow-B.yml` (shown in the [example reusable workflow](#example-reusable-workflow)), is passed an input (`config-path`) and a secret (`token`).

```yaml copy
name: Call a reusable workflow

on:
  pull_request:
    branches:
      - main

jobs:
  call-workflow:
    uses: octo-org/example-repo/.github/workflows/workflow-A.yml@v1

  call-workflow-passing-data:
    permissions:
      contents: read
      pull-requests: write
    uses: octo-org/example-repo/.github/workflows/workflow-B.yml@main
    with:
      config-path: .github/labeler.yml
    secrets:
      token: ${{ secrets.GITHUB_TOKEN }}
```

## Passing inputs and secrets to a reusable workflow

To pass named inputs to a called workflow, use the `with` keyword in a job. Use the `secrets` keyword to pass named secrets. For inputs, the data type of the input value must match the type specified in the called workflow (either boolean, number, or string).

```yaml
jobs:
  call-workflow-passing-data:
    uses: octo-org/example-repo/.github/workflows/reusable-workflow.yml@main
    with:
      config-path: .github/labeler.yml
    secrets:
      personal_access_token: ${{ secrets.token }}
```

Workflows that call reusable workflows in the same organization or enterprise can use the `inherit` keyword to implicitly pass the secrets.

```yaml
jobs:
  call-workflow-passing-data:
    uses: octo-org/example-repo/.github/workflows/reusable-workflow.yml@main
    with:
      config-path: .github/labeler.yml
    secrets: inherit
```

## Using a matrix strategy with a reusable workflow

Jobs using the matrix strategy can call a reusable workflow.

A matrix strategy lets you use variables in a single job definition to automatically create multiple job runs that are based on the combinations of the variables. For example, you can use a matrix strategy to pass different inputs to a reusable workflow. For more information about matrices, see [Running variations of jobs in a workflow](/en/actions/using-jobs/using-a-matrix-for-your-jobs).

This example job below calls a reusable workflow and references the matrix context by defining the variable `target` with the values `[dev, stage, prod]`. It will run three jobs, one for each value in the variable.

```yaml copy
jobs:
  ReusableMatrixJobForDeployment:
    strategy:
      matrix:
        target: [dev, stage, prod]
    uses: octocat/octo-repo/.github/workflows/deployment.yml@main
    with:
      target: ${{ matrix.target }}
```

## Nesting reusable workflows

You can connect a maximum of ten levels of workflows - that is, the top-level caller workflow and up to nine levels of reusable workflows. For example: *caller-workflow\.yml* → *called-workflow-1.yml* → *called-workflow-2.yml* → *called-workflow-3.yml* → ... → *called-workflow-9.yml*.

Loops in the workflow tree are not permitted.

> \[!NOTE] Nested reusable workflows require all workflows in the chain to be accessible to the caller, and permissions can only be maintained or reduced—not elevated—throughout the chain. For more information, see [Reusing workflow configurations](/en/actions/reference/reusable-workflows-reference#access-and-permissions-for-nested-workflows).

From within a reusable workflow you can call another reusable workflow.

```yaml copy
name: Reusable workflow

on:
  workflow_call:

jobs:
  call-another-reusable:
    uses: octo-org/example-repo/.github/workflows/another-reusable.yml@v1
```

## Passing secrets to nested workflows

You can use `jobs.<job_id>.secrets` in a calling workflow to pass named secrets to a directly called workflow. Alternatively, you can use `jobs.<job_id>.secrets.inherit` to pass all of the calling workflow's secrets to a directly called workflow. For more information, see the section [Reuse workflows](/en/actions/using-workflows/reusing-workflows#passing-inputs-and-secrets-to-a-reusable-workflow) above, and the reference article [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idsecretsinherit). Secrets are only passed to directly called workflow, so in the workflow chain A > B > C, workflow C will only receive secrets from A if they have been passed from A to B, and then from B to C.

In the following example, workflow A passes all of its secrets to workflow B, by using the `inherit` keyword, but workflow B only passes one secret to workflow C. Any of the other secrets passed to workflow B are not available to workflow C.

```yaml
jobs:
  workflowA-calls-workflowB:
    uses: octo-org/example-repo/.github/workflows/B.yml@main
    secrets: inherit # pass all secrets
```

```yaml
jobs:
  workflowB-calls-workflowC:
    uses: different-org/example-repo/.github/workflows/C.yml@main
    secrets:
      repo-token: ${{ secrets.personal_access_token }} # pass just this secret
```

## Using outputs from a reusable workflow

A reusable workflow may generate data that you want to use in the caller workflow. To use these outputs, you must specify them as the outputs of the reusable workflow.

If a reusable workflow that sets an output is executed with a matrix strategy, the output will be the output set by the last successful completing reusable workflow of the matrix which actually sets a value.
That means if the last successful completing reusable workflow sets an empty string for its output, and the second last successful completing reusable workflow sets an actual value for its output, the output will contain the value of the second last completing reusable workflow.

The following reusable workflow has a single job containing two steps. In each of these steps we set a single word as the output: "hello" and "world." In the `outputs` section of the job, we map these step outputs to job outputs called: `output1` and `output2`. In the `on.workflow_call.outputs` section we then define two outputs for the workflow itself, one called `firstword` which we map to `output1`, and one called `secondword` which we map to `output2`.

The `value` must be set to the value of a job-level output within the called workflow. Step-level outputs must first be mapped to job-level outputs as shown below.

For more information, see [Passing information between jobs](/en/actions/using-jobs/defining-outputs-for-jobs#overview) and [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#onworkflow_calloutputs).

```yaml copy
name: Reusable workflow

on:
  workflow_call:
    # Map the workflow outputs to job outputs
    outputs:
      firstword:
        description: "The first output string"
        value: ${{ jobs.example_job.outputs.output1 }}
      secondword:
        description: "The second output string"
        value: ${{ jobs.example_job.outputs.output2 }}

jobs:
  example_job:
    name: Generate output
    runs-on: ubuntu-latest
    # Map the job outputs to step outputs
    outputs:
      output1: ${{ steps.step1.outputs.firstword }}
      output2: ${{ steps.step2.outputs.secondword }}
    steps:
      - id: step1
        run: echo "firstword=hello" >> $GITHUB_OUTPUT
      - id: step2
        run: echo "secondword=world" >> $GITHUB_OUTPUT
```

We can now use the outputs in the caller workflow, in the same way you would use the outputs from a job within the same workflow. We reference the outputs using the names defined at the workflow level in the reusable workflow: `firstword` and `secondword`. In this workflow, `job1` calls the reusable workflow and `job2` prints the outputs from the reusable workflow ("hello world") to standard output in the workflow log.

```yaml copy
name: Call a reusable workflow and use its outputs

on:
  workflow_dispatch:

jobs:
  job1:
    uses: octo-org/example-repo/.github/workflows/called-workflow.yml@v1

  job2:
    runs-on: ubuntu-latest
    needs: job1
    steps:
      - run: echo ${{ needs.job1.outputs.firstword }} ${{ needs.job1.outputs.secondword }}
```

For more information on using job outputs, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idoutputs). If you want to share something other than a variable (e.g. a build artifact) between workflows, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

## Monitoring which workflows are being used

Organizations that use GitHub Enterprise Cloud can interact with the audit log via the GitHub REST API to monitor which workflows are being used. For more information, see [the GitHub Enterprise Cloud documentation](/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/reviewing-the-audit-log-for-your-organization#using-the-audit-log-api).

## Next steps

To find information on the intricacies of reusing workflows, see [Reusing workflow configurations](/en/actions/reference/reusable-workflows-reference).
---

# Sharing actions and workflows from your private repository

You can share an action or reusable workflow without publishing them publicly.

> \[!WARNING]
>
> * If you make a private repository accessible to GitHub Actions workflows in other repositories, outside collaborators on the other repositories can indirectly access the private repository, even though they do not have direct access to these repositories. The outside collaborators can view logs for workflow runs when actions or workflows from the private repository are used.
> * To allow runners to download these actions, GitHub passes a scoped installation token to the runner. This token has read access to the repository, and automatically expires after one hour.

## Sharing actions and workflows from your private repository

1. Store the action or reusable workflow in a private repository. For more information, see [About repositories](/en/repositories/creating-and-managing-repositories/about-repositories#about-repository-visibility).
2. On GitHub, navigate to the main page of the private repository.
3. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
4. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **General**.
5. To grant access to other private repositories, in the **Access** section at the bottom of the page, select **Accessible from repositories owned by 'USERNAME' user**.
6. Click **Save** to apply the settings.

## Next steps

To reuse your shared workflows, see [Reuse workflows](/en/actions/using-workflows/reusing-workflows).
---

# Sharing actions and workflows with your enterprise

You can share an action or reusable workflow with your enterprise without publishing the action or workflow publicly.

## Overview

If your organization is owned by an enterprise account, you can share actions and reusable workflows within your enterprise, without publishing them publicly, by allowing GitHub Actions workflows to access an internal or private repository that contains the action or reusable workflow.

Any actions or reusable workflows stored in the internal or private repository can be used in workflows defined in other internal or private repositories owned by the same organization, or by any organization owned by the enterprise. Actions and reusable workflows stored in internal repositories cannot be used in public repositories and actions and reusable workflows stored in private repositories cannot be used in public or internal repositories.

> \[!WARNING]
>
> * If you make a private repository accessible to GitHub Actions workflows in other repositories, outside collaborators on the other repositories can indirectly access the private repository, even though they do not have direct access to these repositories. The outside collaborators can view logs for workflow runs when actions or workflows from the private repository are used.
> * To allow runners to download these actions, GitHub passes a scoped installation token to the runner. This token has read access to the repository, and automatically expires after one hour.

## Sharing actions and workflows with your enterprise

1. Store the action or reusable workflow in an internal or private repository. For more information, see [About repositories](/en/enterprise-cloud@latest/repositories/creating-and-managing-repositories/about-repositories).
2. Configure the repository to allow access to workflows in other internal or private repositories. For more information, see [Managing GitHub Actions settings for a repository](/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#allowing-access-to-components-in-a-private-repository) and [Managing GitHub Actions settings for a repository](/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#allowing-access-to-components-in-an-internal-repository).

## Further reading

* [Enterprise accounts](/en/enterprise-cloud@latest/admin/overview/about-enterprise-accounts)
* [Reuse workflows](/en/enterprise-cloud@latest/actions/using-workflows/reusing-workflows)
---

# Sharing actions and workflows with your organization

You can share an action or reusable workflow with your organization without publishing the action or workflow publicly.

> \[!WARNING]
>
> * If you make a private repository accessible to GitHub Actions workflows in other repositories, outside collaborators on the other repositories can indirectly access the private repository, even though they do not have direct access to these repositories. The outside collaborators can view logs for workflow runs when actions or workflows from the private repository are used.
> * To allow runners to download these actions, GitHub passes a scoped installation token to the runner. This token has read access to the repository, and automatically expires after one hour.

## Sharing actions and workflows with your organization

1. Store the action or reusable workflow in a private repository. For more information, see [About repositories](/en/repositories/creating-and-managing-repositories/about-repositories#about-repository-visibility).
2. On GitHub, navigate to the main page of the private repository.
3. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
4. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **General**.
5. To grant access to other private repositories in the organization, in the **Access** section at the bottom of the page, select **Accessible from repositories in the 'ORGANIZATION-NAME' organization**.
6. Click **Save** to apply the settings.

## Next steps

To learn how to reuse your shared workflows, see [Reuse workflows](/en/actions/using-workflows/reusing-workflows).