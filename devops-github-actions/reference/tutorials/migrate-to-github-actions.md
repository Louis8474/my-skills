# Migrate To Github Actions

---

# Migrating from Azure DevOps with GitHub Actions Importer

Learn how to use GitHub Actions Importer to automate the migration of your Azure DevOps pipelines to GitHub Actions.

## About migrating from Azure DevOps with GitHub Actions Importer

The instructions below will guide you through configuring your environment to use GitHub Actions Importer to migrate Azure DevOps pipelines to GitHub Actions.

### Prerequisites

* An Azure DevOps account or organization with projects and pipelines that you want to convert to GitHub Actions workflows.
* Access to create an Azure DevOps personal access token for your account or organization.
* An environment where you can run Linux-based containers, and can install the necessary tools.
  * Docker is [installed](https://docs.docker.com/get-docker/) and running.

  * [GitHub CLI](https://cli.github.com) is installed.
  > \[!NOTE]
  > The GitHub Actions Importer container and CLI do not need to be installed on the same server as your CI platform.

### Limitations

There are some limitations when migrating from Azure DevOps to GitHub Actions with GitHub Actions Importer:

* GitHub Actions Importer requires version 5.0 of the Azure DevOps API, available in either Azure DevOps Services or Azure DevOps Server 2019. Older versions of Azure DevOps Server are not compatible.
* Tasks that are implicitly added to an Azure DevOps pipeline, such as checking out source code, may be added to a GitHub Actions Importer audit as a GUID name. To find the friendly task name for a GUID, you can use the following URL: `https://dev.azure.com/:organization/_apis/distributedtask/tasks/:guid`.

#### Manual tasks

Certain Azure DevOps constructs must be migrated manually from Azure DevOps into GitHub Actions configurations. These include:

* Organization, repository, and environment secrets
* Service connections such as OIDC Connect, GitHub Apps, and personal access tokens
* Unknown tasks
* Self-hosted agents
* Environments
* Pre-deployment approvals

For more information on manual migrations, see [Migrating from Azure Pipelines to GitHub Actions](/en/actions/migrating-to-github-actions/manually-migrating-to-github-actions/migrating-from-azure-pipelines-to-github-actions).

#### Unsupported tasks

GitHub Actions Importer does not support migrating the following tasks:

* Pre-deployment gates
* Post-deployment gates
* Post-deployment approvals
* Some resource triggers

## Installing the GitHub Actions Importer CLI extension

1. Install the GitHub Actions Importer CLI extension:

   ```bash copy
   gh extension install github/gh-actions-importer
   ```

2. Verify that the extension is installed:

   ```bash
   $ gh actions-importer -h
   Options:
     -?, -h, --help  Show help and usage information

   Commands:
     update     Update to the latest version of GitHub Actions Importer.
     version    Display the version of GitHub Actions Importer.
     configure  Start an interactive prompt to configure credentials used to authenticate with your CI server(s).
     audit      Plan your CI/CD migration by analyzing your current CI/CD footprint.
     forecast   Forecast GitHub Actions usage from historical pipeline utilization.
     dry-run    Convert a pipeline to a GitHub Actions workflow and output its yaml file.
     migrate    Convert a pipeline to a GitHub Actions workflow and open a pull request with the changes.
   ```

## Configuring credentials

The `configure` CLI command is used to set required credentials and options for GitHub Actions Importer when working with Azure DevOps and GitHub.

1. Create a GitHub personal access token (classic). For more information, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic).

   Your token must have the `workflow` scope.

   After creating the token, copy it and save it in a safe location for later use.

2. Create an Azure DevOps personal access token. For more information, see [Use personal access tokens](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops\&tabs=Windows#create-a-pat) in the Azure DevOps documentation. The token must have the following scopes:

   * Agents Pool: `Read`
   * Build: `Read`
   * Code: `Read`
   * Release: `Read`
   * Service Connections: `Read`
   * Task Groups: `Read`
   * Variable Groups: `Read`

   After creating the token, copy it and save it in a safe location for later use.

3. In your terminal, run the GitHub Actions Importer `configure` CLI command:

   ```shell
   gh actions-importer configure
   ```

   The `configure` command will prompt you for the following information:

   * For "Which CI providers are you configuring?", use the arrow keys to select `Azure DevOps`, press <kbd>Space</kbd> to select it, then press <kbd>Enter</kbd>.
   * For "Personal access token for GitHub", enter the value of the personal access token (classic) that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the GitHub instance", press <kbd>Enter</kbd> to accept the default value (`https://github.com`).
   * For "Personal access token for Azure DevOps", enter the value for the Azure DevOps personal access token that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the Azure DevOps instance", press <kbd>Enter</kbd> to accept the default value (`https://dev.azure.com`).
   * For "Azure DevOps organization name", enter the name for your Azure DevOps organization, and press <kbd>Enter</kbd>.
   * For "Azure DevOps project name", enter the name for your Azure DevOps project, and press <kbd>Enter</kbd>.

   An example of the `configure` command is shown below:

   ```shell
   $ gh actions-importer configure
   ✔ Which CI providers are you configuring?: Azure DevOps
   Enter the following values (leave empty to omit):
   ✔ Personal access token for GitHub: ***************
   ✔ Base url of the GitHub instance: https://github.com
   ✔ Personal access token for Azure DevOps: ***************
   ✔ Base url of the Azure DevOps instance: https://dev.azure.com
   ✔ Azure DevOps organization name: :organization
   ✔ Azure DevOps project name: :project
   Environment variables successfully updated.
   ```

4. In your terminal, run the GitHub Actions Importer `update` CLI command to connect to the GitHub Packages Container registry and ensure that the container image is updated to the latest version:

   ```shell
   gh actions-importer update
   ```

   The output of the command should be similar to below:

   ```shell
   Updating ghcr.io/actions-importer/cli:latest...
   ghcr.io/actions-importer/cli:latest up-to-date
   ```

## Perform an audit of Azure DevOps

You can use the `audit` command to get a high-level view of all projects in an Azure DevOps organization.

The `audit` command performs the following steps:

1. Fetches all of the projects defined in an Azure DevOps organization.
2. Converts each pipeline to its equivalent GitHub Actions workflow.
3. Generates a report that summarizes how complete and complex of a migration is possible with GitHub Actions Importer.

### Running the audit command

To perform an audit of an Azure DevOps organization, run the following command in your terminal:

```shell
gh actions-importer audit azure-devops --output-dir tmp/audit
```

### Inspecting the audit results

The files in the specified output directory contain the results of the audit. See the `audit_summary.md` file for a summary of the audit results.

The audit summary has the following sections.

#### Pipelines

The "Pipelines" section contains a high-level statistics regarding the conversion rate done by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Pipelines" section:

* **Successful** pipelines had 100% of the pipeline constructs and individual items converted automatically to their GitHub Actions equivalent.
* **Partially successful** pipelines had all of the pipeline constructs converted, however, there were some individual items that were not converted automatically to their GitHub Actions equivalent.
* **Unsupported** pipelines are definition types that are not supported by GitHub Actions Importer.
* **Failed** pipelines encountered a fatal error when being converted. This can occur for one of three reasons:
  * The pipeline was originally misconfigured and not valid.
  * GitHub Actions Importer encountered an internal error when converting it.
  * There was an unsuccessful network response that caused the pipeline to be inaccessible, which is often due to invalid credentials.

#### Build steps

The "Build steps" section contains an overview of individual build steps that are used across all pipelines, and how many were automatically converted by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Build steps" section:

* A **known** build step is a step that was automatically converted to an equivalent action.
* An **unknown** build step is a step that was not automatically converted to an equivalent action.
* An **unsupported** build step is a step that is either:
  * Fundamentally not supported by GitHub Actions.
  * Configured in a way that is incompatible with GitHub Actions.
* An **action** is a list of the actions that were used in the converted workflows. This can be important for:
  * If you use GitHub Enterprise Server, gathering the list of actions to sync to your instance.
  * Defining an organization-level allowlist of actions that are used. This list of actions is a comprehensive list of actions that your security or compliance teams may need to review.

#### Manual tasks

The "Manual tasks" section contains an overview of tasks that GitHub Actions Importer is not able to complete automatically, and that you must complete manually.

Listed below are some key terms that can appear in the "Manual tasks" section:

* A **secret** is a repository or organization-level secret that is used in the converted pipelines. These secrets must be created manually in GitHub Actions for these pipelines to function properly. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).
* A **self-hosted runner** refers to a label of a runner that is referenced in a converted pipeline that is not a GitHub-hosted runner. You will need to manually define these runners for these pipelines to function properly.

#### Files

The final section of the audit report provides a manifest of all the files that were written to disk during the audit.

Each pipeline file has a variety of files included in the audit, including:

* The original pipeline as it was defined in GitHub.
* Any network responses used to convert the pipeline.
* The converted workflow file.
* Stack traces that can be used to troubleshoot a failed pipeline conversion.

Additionally, the `workflow_usage.csv` file contains a comma-separated list of all actions, secrets, and runners that are used by each successfully converted pipeline. This can be useful for determining which workflows use which actions, secrets, or runners, and can be useful for performing security reviews.

## Forecast potential GitHub Actions usage

You can use the `forecast` command to forecast potential GitHub Actions usage by computing metrics from completed pipeline runs in Azure DevOps.

### Running the forecast command

To perform a forecast of potential GitHub Actions usage, run the following command in your terminal. By default, GitHub Actions Importer includes the previous seven days in the forecast report.

```shell
gh actions-importer forecast azure-devops --output-dir tmp/forecast_reports
```

### Inspecting the forecast report

The `forecast_report.md` file in the specified output directory contains the results of the forecast.

Listed below are some key terms that can appear in the forecast report:

* The **job count** is the total number of completed jobs.
* The **pipeline count** is the number of unique pipelines used.
* **Execution time** describes the amount of time a runner spent on a job. This metric can be used to help plan for the cost of GitHub-hosted runners.

  This metric is correlated to how much you should expect to spend in GitHub Actions. This will vary depending on the hardware used for these minutes. You can use the [GitHub Actions pricing calculator](https://github.com/pricing/calculator) to estimate the costs.
* **Queue time** metrics describe the amount of time a job spent waiting for a runner to be available to execute it.
* **Concurrent jobs** metrics describe the amount of jobs running at any given time. This metric can be used to define the number of runners you should configure.

Additionally, these metrics are defined for each queue of runners in Azure DevOps. This is especially useful if there is a mix of hosted or self-hosted runners, or high or low spec machines, so you can see metrics specific to different types of runners.

## Perform a dry-run migration

You can use the `dry-run` command to convert an Azure DevOps pipeline to an equivalent GitHub Actions workflow. A dry run creates the output files in a specified directory, but does not open a pull request to migrate the pipeline.

If there is anything that GitHub Actions Importer was not able to convert automatically, such as unknown build steps or a partially successful pipeline, you might want to create custom transformers to further customize the conversion process. For more information, see [Extending GitHub Actions Importer with custom transformers](/en/actions/migrating-to-github-actions/automated-migrations/extending-github-actions-importer-with-custom-transformers).

### Running the dry-run command for a build pipeline

To perform a dry run of migrating your Azure DevOps build pipeline to GitHub Actions, run the following command in your terminal, replacing `pipeline_id` with the ID of the pipeline you are converting.

```shell
gh actions-importer dry-run azure-devops pipeline --pipeline-id :pipeline_id --output-dir tmp/dry-run
```

You can view the logs of the dry run and the converted workflow files in the specified output directory.

### Running the dry-run command for a release pipeline

To perform a dry run of migrating your Azure DevOps release pipeline to GitHub Actions, run the following command in your terminal, replacing `pipeline_id` with the ID of the pipeline you are converting.

```shell
gh actions-importer dry-run azure-devops release --pipeline-id :pipeline_id --output-dir tmp/dry-run
```

You can view the logs of the dry run and the converted workflow files in the specified output directory.

## Perform a production migration

You can use the `migrate` command to convert an Azure DevOps pipeline and open a pull request with the equivalent GitHub Actions workflow.

### Running the migrate command for a build pipeline

To migrate an Azure DevOps build pipeline to GitHub Actions, run the following command in your terminal, replacing the `target-url` value with the URL for your GitHub repository, and `pipeline_id` with the ID of the pipeline you are converting.

```shell
gh actions-importer migrate azure-devops pipeline --pipeline-id :pipeline_id --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate
```

The command's output includes the URL of the pull request that adds the converted workflow to your repository. An example of a successful output is similar to the following:

```shell
$ gh actions-importer migrate azure-devops pipeline --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate --azure-devops-project my-azure-devops-project
[2022-08-20 22:08:20] Logs: 'tmp/migrate/log/actions-importer-20220916-014033.log'
[2022-08-20 22:08:20] Pull request: 'https://github.com/octo-org/octo-repo/pull/1'
```

### Running the migrate command for a release pipeline

To migrate an Azure DevOps release pipeline to GitHub Actions, run the following command in your terminal, replacing the `target-url` value with the URL for your GitHub repository, and `pipeline_id` with the ID of the pipeline you are converting.

```shell
gh actions-importer migrate azure-devops release --pipeline-id :pipeline_id --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate
```

The command's output includes the URL of the pull request that adds the converted workflow to your repository. An example of a successful output is similar to the following:

```shell
$ gh actions-importer migrate azure-devops release --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate --azure-devops-project my-azure-devops-project
[2022-08-20 22:08:20] Logs: 'tmp/migrate/log/actions-importer-20220916-014033.log'
[2022-08-20 22:08:20] Pull request: 'https://github.com/octo-org/octo-repo/pull/1'
```

### Inspecting the pull request

The output from a successful run of the `migrate` command contains a link to the new pull request that adds the converted workflow to your repository.

Some important elements of the pull request include:

* In the pull request description, a section called **Manual steps**, which lists steps that you must manually complete before you can finish migrating your pipelines to GitHub Actions. For example, this section might tell you to create any secrets used in your workflows.
* The converted workflows file. Select the **Files changed** tab in the pull request to view the workflow file that will be added to your GitHub repository.

When you are finished inspecting the pull request, you can merge it to add the workflow to your GitHub repository.

## Reference

This section contains reference information on environment variables, optional arguments, and supported syntax when using GitHub Actions Importer to migrate from Azure DevOps.

### Configuration environment variables

GitHub Actions Importer uses environment variables for its authentication configuration. These variables are set when following the configuration process using the `configure` command. For more information, see the [Configuring credentials](#configuring-credentials) section.

GitHub Actions Importer uses the following environment variables to connect to your Azure DevOps instance:

* `GITHUB_ACCESS_TOKEN`: The personal access token (classic) used to create pull requests with a converted workflow (requires the `workflow` scope).
* `GITHUB_INSTANCE_URL`: The URL to the target GitHub instance (for example, `https://github.com`).
* `AZURE_DEVOPS_ACCESS_TOKEN`: The personal access token used to authenticate with your Azure DevOps instance. This token requires the following scopes:
  * Build: `Read`
  * Agent Pools: `Read`
  * Code: `Read`
  * Release: `Read`
  * Service Connections: `Read`
  * Task Groups: `Read`
  * Variable Groups: `Read`
* `AZURE_DEVOPS_PROJECT`: The project name or GUID to use when migrating a pipeline. If you'd like to perform an audit on all projects, this is optional.
* `AZURE_DEVOPS_ORGANIZATION`: The organization name of your Azure DevOps instance.
* `AZURE_DEVOPS_INSTANCE_URL`: The URL to the Azure DevOps instance, such as `https://dev.azure.com`.

These environment variables can be specified in a `.env.local` file that is loaded by GitHub Actions Importer when it is run.

### Optional arguments

There are optional arguments you can use with the GitHub Actions Importer subcommands to customize your migration.

#### `--source-file-path`

You can use the `--source-file-path` argument with the `forecast`, `dry-run`, or `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from source control. The `--source-file-path` argument tells GitHub Actions Importer to use the specified source file path instead.

For example:

```shell
gh actions-importer dry-run azure-devops pipeline --output-dir ./output/ --source-file-path ./path/to/azure_devops/pipeline.yml
```

#### `--config-file-path`

You can use the `--config-file-path` argument with the `audit`, `dry-run`, and `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from source control. The `--config-file-path` argument tells GitHub Actions Importer to use the specified source files instead.

The `--config-file-path` argument can also be used to specify which repository a converted reusable workflow or composite action should be migrated to.

##### Audit example

In this example, GitHub Actions Importer uses the specified YAML configuration file as the source file to perform an audit.

```shell
gh actions-importer audit azure-devops pipeline --output-dir ./output/ --config-file-path ./path/to/azure_devops/config.yml
```

To audit an Azure DevOps instance using a configuration file, the configuration file must be in the following format and each `repository_slug` must be unique:

```yaml
source_files:
  - repository_slug: azdo-project/1
    path: file.yml
  - repository_slug: azdo-project/2
    paths: path.yml
```

You can generate the `repository_slug` for a pipeline by combining the Azure DevOps organization name, project name, and the pipeline ID. For example, `my-organization-name/my-project-name/42`.

##### Dry run example

In this example, GitHub Actions Importer uses the specified YAML configuration file as the source file to perform a dry run.

The pipeline is selected by matching the `repository_slug` in the configuration file to the value of the `--azure-devops-organization` and `--azure-devops-project` option. The `path` is then used to pull the specified source file.

```shell
gh actions-importer dry-run azure-devops pipeline --output-dir ./output/ --config-file-path ./path/to/azure_devops/config.yml
```

##### Specify the repository of converted reusable workflows and composite actions

GitHub Actions Importer uses the YAML file provided to the `--config-file-path` argument to determine the repository that converted reusable workflows and composite actions are migrated to.

To begin, you should run an audit without the `--config-file-path` argument:

```shell
gh actions-importer audit azure-devops --output-dir ./output/
```

The output of this command will contain a file named `config.yml` that contains a list of all the reusable workflows and composite actions that were converted by GitHub Actions Importer. For example, the `config.yml` file may have the following contents:

```yaml
reusable_workflows:
  - name: my-reusable-workflow.yml
    target_url: https://github.com/octo-org/octo-repo
    ref: main

composite_actions:
  - name: my-composite-action.yml
    target_url: https://github.com/octo-org/octo-repo
    ref: main
```

You can use this file to specify which repository and ref a reusable workflow or composite action should be added to. You can then use the `--config-file-path` argument to provide the `config.yml` file to GitHub Actions Importer. For example, you can use this file when running a `migrate` command to open a pull request for each unique repository defined in the config file:

```shell
gh actions-importer migrate azure-devops pipeline --config-file-path config.yml --target-url https://github.com/my-org/my-repo
```

### Supported syntax for Azure DevOps pipelines

The following table shows the type of properties that GitHub Actions Importer is currently able to convert.

| Azure Pipelines       | GitHub Actions                                                                                                                             | Status              |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :------------------ |
| condition             | <ul><li>`jobs.<job_id>.if`</li><li>`jobs.<job_id>.steps[*].if`</li></ul>                                                                   | Supported           |
| container             | <ul><li>`jobs.<job_id>.container`</li><li>`jobs.<job_id>.name`</li></ul>                                                                   | Supported           |
| continuousIntegration | <ul><li>`on.<push>.<branches>`</li><li>`on.<push>.<tags>`</li><li>`on.<push>.paths`</li></ul>                                              | Supported           |
| job                   | <ul><li>`jobs.<job_id>`</li></ul>                                                                                                          | Supported           |
| pullRequest           | <ul><li>`on.<pull_request>.<branches>`</li><li>`on.<pull_request>.paths`</li></ul>                                                         | Supported           |
| stage                 | <ul><li>`jobs`</li></ul>                                                                                                                   | Supported           |
| steps                 | <ul><li>`jobs.<job_id>.steps`</li></ul>                                                                                                    | Supported           |
| strategy              | <ul><li>`jobs.<job_id>.strategy.fail-fast`</li><li>`jobs.<job_id>.strategy.max-parallel`</li><li>`jobs.<job_id>.strategy.matrix`</li></ul> | Supported           |
| timeoutInMinutes      | <ul><li>`jobs.<job_id>.timeout-minutes`</li></ul>                                                                                          | Supported           |
| variables             | <ul><li>`env`</li><li>`jobs.<job_id>.env`</li><li>`jobs.<job_id>.steps.env`</li></ul>                                                      | Supported           |
| manual deployment     | <ul><li>`jobs.<job_id>.environment`</li></ul>                                                                                              | Partially supported |
| pool                  | <ul><li>`runners`</li><li>`self hosted runners`</li></ul>                                                                                  | Partially supported |
| services              | <ul><li>`jobs.<job_id>.services`</li></ul>                                                                                                 | Partially supported |
| strategy              | <ul><li>`jobs.<job_id>.strategy`</li></ul>                                                                                                 | Partially supported |
| triggers              | <ul><li>`on`</li></ul>                                                                                                                     | Partially supported |
| pullRequest           | <ul><li>`on.<pull_request>.<tags>`</li></ul>                                                                                               | Unsupported         |
| schedules             | <ul><li>`on.schedule`</li><li>`on.workflow_run`</li></ul>                                                                                  | Unsupported         |
| triggers              | <ul><li>`on.<event_name>.types`</li></ul>                                                                                                  | Unsupported         |

For more information about supported Azure DevOps tasks, see the [`github/gh-actions-importer` repository](https://github.com/github/gh-actions-importer/blob/main/docs/azure_devops/index.md).

### Environment variable mapping

GitHub Actions Importer uses the mapping in the table below to convert default Azure DevOps environment variables to the closest equivalent in GitHub Actions.

| Azure Pipelines                             | GitHub Actions                                      |
| :------------------------------------------ | :-------------------------------------------------- |
| `$(Agent.BuildDirectory)`                   | `${{ runner.workspace }}`                           |
| `$(Agent.HomeDirectory)`                    | `${{ env.HOME }}`                                   |
| `$(Agent.JobName)`                          | `${{ github.job }}`                                 |
| `$(Agent.OS)`                               | `${{ runner.os }}`                                  |
| `$(Agent.ReleaseDirectory)`                 | `${{ github.workspace}}`                            |
| `$(Agent.RootDirectory)`                    | `${{ github.workspace }}`                           |
| `$(Agent.ToolsDirectory)`                   | `${{ runner.tool_cache }}`                          |
| `$(Agent.WorkFolder)`                       | `${{ github.workspace }}`                           |
| `$(Build.ArtifactStagingDirectory)`         | `${{ runner.temp }}`                                |
| `$(Build.BinariesDirectory)`                | `${{ github.workspace }}`                           |
| `$(Build.BuildId)`                          | `${{ github.run_id }}`                              |
| `$(Build.BuildNumber)`                      | `${{ github.run_number }}`                          |
| `$(Build.DefinitionId)`                     | `${{ github.workflow }}`                            |
| `$(Build.DefinitionName)`                   | `${{ github.workflow }}`                            |
| `$(Build.PullRequest.TargetBranch)`         | `${{ github.base_ref }}`                            |
| `$(Build.PullRequest.TargetBranch.Name)`    | `${{ github.base_ref }}`                            |
| `$(Build.QueuedBy)`                         | `${{ github.actor }}`                               |
| `$(Build.Reason)`                           | `${{ github.event_name }}`                          |
| `$(Build.Repository.LocalPath)`             | `${{ github.workspace }}`                           |
| `$(Build.Repository.Name)`                  | `${{ github.repository }}`                          |
| `$(Build.Repository.Provider)`              | `GitHub`                                            |
| `$(Build.Repository.Uri)`                   | `${{ github.server.url }}/${{ github.repository }}` |
| `$(Build.RequestedFor)`                     | `${{ github.actor }}`                               |
| `$(Build.SourceBranch)`                     | `${{ github.ref }}`                                 |
| `$(Build.SourceBranchName)`                 | `${{ github.ref }}`                                 |
| `$(Build.SourceVersion)`                    | `${{ github.sha }}`                                 |
| `$(Build.SourcesDirectory)`                 | `${{ github.workspace }}`                           |
| `$(Build.StagingDirectory)`                 | `${{ runner.temp }}`                                |
| `$(Pipeline.Workspace)`                     | `${{ runner.workspace }}`                           |
| `$(Release.DefinitionEnvironmentId)`        | `${{ github.job }}`                                 |
| `$(Release.DefinitionId)`                   | `${{ github.workflow }}`                            |
| `$(Release.DefinitionName)`                 | `${{ github.workflow }}`                            |
| `$(Release.Deployment.RequestedFor)`        | `${{ github.actor }}`                               |
| `$(Release.DeploymentID)`                   | `${{ github.run_id }}`                              |
| `$(Release.EnvironmentId)`                  | `${{ github.job }}`                                 |
| `$(Release.EnvironmentName)`                | `${{ github.job }}`                                 |
| `$(Release.Reason)`                         | `${{ github.event_name }}`                          |
| `$(Release.RequestedFor)`                   | `${{ github.actor }}`                               |
| `$(System.ArtifactsDirectory)`              | `${{ github.workspace }}`                           |
| `$(System.DefaultWorkingDirectory)`         | `${{ github.workspace }}`                           |
| `$(System.HostType)`                        | `build`                                             |
| `$(System.JobId)`                           | `${{ github.job }}`                                 |
| `$(System.JobName)`                         | `${{ github.job }}`                                 |
| `$(System.PullRequest.PullRequestId)`       | `${{ github.event.number }}`                        |
| `$(System.PullRequest.PullRequestNumber)`   | `${{ github.event.number }}`                        |
| `$(System.PullRequest.SourceBranch)`        | `${{ github.ref }}`                                 |
| `$(System.PullRequest.SourceRepositoryUri)` | `${{ github.server.url }}/${{ github.repository }}` |
| `$(System.PullRequest.TargetBranch)`        | `${{ github.event.base.ref }}`                      |
| `$(System.PullRequest.TargetBranchName)`    | `${{ github.event.base.ref }}`                      |
| `$(System.StageAttempt)`                    | `${{ github.run_number }}`                          |
| `$(System.TeamFoundationCollectionUri)`     | `${{ github.server.url }}/${{ github.repository }}` |
| `$(System.WorkFolder)`                      | `${{ github.workspace }}`                           |

### Templates

You can transform Azure DevOps templates with GitHub Actions Importer.

#### Limitations

GitHub Actions Importer is able to transform Azure DevOps templates with some limitations.

* Azure DevOps templates used under the `stages`, `deployments`, and `jobs` keys are converted into reusable workflows in GitHub Actions. For more information, see [Reuse workflows](/en/actions/using-workflows/reusing-workflows).
* Azure DevOps templates used under the `steps` key are converted into composite actions. For more information, see [Creating a composite action](/en/actions/creating-actions/creating-a-composite-action).
* If you currently have job templates that reference other job templates, GitHub Actions Importer converts the templates into reusable workflows. Because reusable workflows cannot reference other reusable workflows, this is invalid syntax in GitHub Actions. You must manually correct nested reusable workflows.
* If a template references an external Azure DevOps organization or GitHub repository, you must use the `--credentials-file` option to provide credentials to access this template. For more information, see [Supplemental arguments and settings](/en/actions/migrating-to-github-actions/automated-migrations/supplemental-arguments-and-settings#using-a-credentials-file-for-authentication).
* You can dynamically generate YAML using `each` expressions with the following caveats:
  * Nested `each` blocks are not supported and cause the parent `each` block to be unsupported.
  * `each` and contained `if` conditions are evaluated at transformation time, because GitHub Actions does not support this style of insertion.
  * `elseif` blocks are unsupported. If this functionality is required, you must manually correct them.
  * Nested `if` blocks are supported, but `if/elseif/else` blocks nested under an `if` condition are not.
  * `if` blocks that use predefined Azure DevOps variables are not supported.

#### Supported templates

GitHub Actions Importer supports the templates listed in the table below.

| Azure Pipelines                                                            | GitHub Actions               |              Status |
| :------------------------------------------------------------------------- | :--------------------------- | ------------------: |
| Extending from a template                                                  | `Reusable workflow`          |           Supported |
| Job templates                                                              | `Reusable workflow`          |           Supported |
| Stage templates                                                            | `Reusable workflow`          |           Supported |
| Step templates                                                             | `Composite action`           |           Supported |
| Task groups in classic editor                                              | Varies                       |           Supported |
| Templates in a different Azure DevOps organization, project, or repository | Varies                       |           Supported |
| Templates in a GitHub repository                                           | Varies                       |           Supported |
| Variable templates                                                         | `env`                        |           Supported |
| Conditional insertion                                                      | `if` conditions on job/steps | Partially supported |
| Iterative insertion                                                        | Not applicable               | Partially supported |
| Templates with parameters                                                  | Varies                       | Partially supported |

#### Template file path names

GitHub Actions Importer can extract templates with relative or dynamic file paths with variable, parameter, and iterative expressions in the file name. However, there must be a default value set.

##### Variable file path name example

```yaml
# File: azure-pipelines.yml
variables:
- template: 'templates/vars.yml'

steps:
- template: "./templates/$"
```

```yaml
# File: templates/vars.yml
variables:
  one: 'simple_step.yml'
```

##### Parameter file path name example

```yaml
parameters:
- name: template
  type: string
  default: simple_step.yml

steps:
- template: "./templates/${{ parameters.template }}"
```

##### Iterative file path name example

```yaml
parameters:
- name: steps
  type: object
  default:
  - build_step
  - release_step
steps:
- ${{ each step in parameters.steps }}:
    - template: "$-variables.yml"
```

#### Template parameters

GitHub Actions Importer supports the parameters listed in the table below.

| Azure Pipelines | GitHub Actions                             | Status              |
| :-------------- | :----------------------------------------- | :------------------ |
| string          | `inputs.string`                            | Supported           |
| number          | `inputs.number`                            | Supported           |
| boolean         | `inputs.boolean`                           | Supported           |
| object          | `inputs.string` with `fromJSON` expression | Partially supported |
| step            | `step`                                     | Partially supported |
| stepList        | `step`                                     | Partially supported |
| job             | `job`                                      | Partially supported |
| jobList         | `job`                                      | Partially supported |
| deployment      | `job`                                      | Partially supported |
| deploymentList  | `job`                                      | Partially supported |
| stage           | `job`                                      | Partially supported |
| stageList       | `job`                                      | Partially supported |

> \[!NOTE]
> A template used under the `step` key with this parameter type is only serialized as a composite action if the steps are used at the beginning or end of the template steps. A template used under the `stage`, `deployment`, and `job` keys with this parameter type are not transformed into a reusable workflow, and instead are serialized as a standalone workflow.

## Legal notice

Portions have been adapted from <https://github.com/github/gh-actions-importer/> under the MIT license:

```text
MIT License

Copyright (c) 2022 GitHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
---

# Migrating from Bamboo with GitHub Actions Importer

Learn how to use GitHub Actions Importer to automate the migration of your Bamboo pipelines to GitHub Actions.

## About migrating from Bamboo with GitHub Actions Importer

The instructions below will guide you through configuring your environment to use GitHub Actions Importer to migrate Bamboo pipelines to GitHub Actions.

### Prerequisites

* A Bamboo account or organization with projects and pipelines that you want to convert to GitHub Actions workflows.
* Bamboo version of 7.1.1 or greater.
* Access to create a Bamboo personal access token for your account or organization.
* An environment where you can run Linux-based containers, and can install the necessary tools.
  * Docker is [installed](https://docs.docker.com/get-docker/) and running.

  * [GitHub CLI](https://cli.github.com) is installed.
  > \[!NOTE]
  > The GitHub Actions Importer container and CLI do not need to be installed on the same server as your CI platform.

### Limitations

There are some limitations when migrating from Bamboo to GitHub Actions with GitHub Actions Importer:

* GitHub Actions Importer relies on the YAML specification generated by the Bamboo Server to perform migrations. When Bamboo does not support exporting something to YAML, the missing information is not migrated.
* Trigger conditions are unsupported. When GitHub Actions Importer encounters a trigger with a condition, the condition is surfaced as a comment and the trigger is transformed without it.
* Bamboo Plans with customized settings for storing artifacts are not transformed. Instead, artifacts are stored and retrieved using the [`upload-artifact`](https://github.com/actions/upload-artifact) and [`download-artifact`](https://github.com/actions/download-artifact) actions.
* Disabled plans must be disabled manually in the GitHub UI. For more information, see [Disabling and enabling a workflow](/en/actions/using-workflows/disabling-and-enabling-a-workflow).
* Disabled jobs are transformed with a `if: false` condition which prevents it from running. You must remove this to re-enable the job.
* Disabled tasks are not transformed because they are not included in the exported plan when using the Bamboo API.
* Bamboo provides options to clean up build workspaces after a build is complete. These are not transformed because it is assumed GitHub-hosted runners or ephemeral self-hosted runners will automatically handle this.
* The hanging build detection options are not transformed because there is no equivalent in GitHub Actions. The closest option is `timeout-minutes` on a job, which can be used to set the maximum number of minutes to let a job run. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idtimeout-minutes).
* Pattern match labeling is not transformed because there is no equivalent in GitHub Actions.
* All artifacts are transformed into an `actions/upload-artifact`, regardless of whether they are `shared` or not, so they can be downloaded from any job in the workflow.
* Permissions are not transformed because there is no suitable equivalent in GitHub Actions.
* If the Bamboo version is between 7.1.1 and 8.1.1, project and plan variables will not be migrated.

#### Manual tasks

Certain Bamboo constructs must be migrated manually. These include:

* Masked variables
* Artifact expiry settings

## Installing the GitHub Actions Importer CLI extension

1. Install the GitHub Actions Importer CLI extension:

   ```bash copy
   gh extension install github/gh-actions-importer
   ```

2. Verify that the extension is installed:

   ```bash
   $ gh actions-importer -h
   Options:
     -?, -h, --help  Show help and usage information

   Commands:
     update     Update to the latest version of GitHub Actions Importer.
     version    Display the version of GitHub Actions Importer.
     configure  Start an interactive prompt to configure credentials used to authenticate with your CI server(s).
     audit      Plan your CI/CD migration by analyzing your current CI/CD footprint.
     forecast   Forecast GitHub Actions usage from historical pipeline utilization.
     dry-run    Convert a pipeline to a GitHub Actions workflow and output its yaml file.
     migrate    Convert a pipeline to a GitHub Actions workflow and open a pull request with the changes.
   ```

## Configuring credentials

The `configure` CLI command is used to set required credentials and options for GitHub Actions Importer when working with Bamboo and GitHub.

1. Create a GitHub personal access token (classic). For more information, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic).

   Your token must have the `workflow` scope.

   After creating the token, copy it and save it in a safe location for later use.

2. Create a Bamboo personal access token. For more information, see [Personal Access Tokens](https://confluence.atlassian.com/bamboo/personal-access-tokens-976779873.html) in the Bamboo documentation.

   Your token must have the following permissions, depending on which resources will be transformed.

   | Resource Type          |                                                                                                                                                           View                                                                                                                                                          |                                                                                                                                                                                                         View Configuration                                                                                                                                                                                                         |                                                                                                                                                                                                                Edit                                                                                                                                                                                                                |
   | :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
   | Build Plan             | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Required" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg> |                                                       <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Required" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>                                                      |                                                       <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Required" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>                                                      |
   | Deployment Project     | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Required" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg> |                                                       <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Required" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>                                                      | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-x" aria-label="Not required" role="img"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg> |
   | Deployment Environment | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="Required" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg> | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-x" aria-label="Not required" role="img"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg> | <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-x" aria-label="Not required" role="img"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg> |

   After creating the token, copy it and save it in a safe location for later use.

3. In your terminal, run the GitHub Actions Importer `configure` CLI command:

   ```shell
   gh actions-importer configure
   ```

   The `configure` command will prompt you for the following information:

   * For "Which CI providers are you configuring?", use the arrow keys to select `Bamboo`, press <kbd>Space</kbd> to select it, then press <kbd>Enter</kbd>.
   * For "Personal access token for GitHub", enter the value of the personal access token (classic) that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the GitHub instance", press <kbd>Enter</kbd> to accept the default value (`https://github.com`).
   * For "Personal access token for Bamboo", enter the value for the Bamboo personal access token that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the Bamboo instance", enter the URL for your Bamboo Server or Bamboo Data Center instance, and press <kbd>Enter</kbd>.

   An example of the `configure` command is shown below:

   ```shell
   $ gh actions-importer configure
   ✔ Which CI providers are you configuring?: Bamboo
   Enter the following values (leave empty to omit):
   ✔ Personal access token for GitHub: ***************
   ✔ Base url of the GitHub instance: https://github.com
   ✔ Personal access token for Bamboo: ********************
   ✔ Base url of the Bamboo instance: https://bamboo.example.com
   Environment variables successfully updated.
   ```

4. In your terminal, run the GitHub Actions Importer `update` CLI command to connect to GitHub Packages Container registry and ensure that the container image is updated to the latest version:

   ```shell
   gh actions-importer update
   ```

   The output of the command should be similar to below:

   ```shell
   Updating ghcr.io/actions-importer/cli:latest...
   ghcr.io/actions-importer/cli:latest up-to-date
   ```

## Perform an audit of Bamboo

You can use the `audit` command to get a high-level view of all projects in a Bamboo organization.

The `audit` command performs the following steps:

1. Fetches all of the projects defined in a Bamboo organization.
2. Converts each pipeline to its equivalent GitHub Actions workflow.
3. Generates a report that summarizes how complete and complex of a migration is possible with GitHub Actions Importer.

### Running the audit command

To perform an audit of a Bamboo instance, run the following command in your terminal:

```shell
gh actions-importer audit bamboo --output-dir tmp/audit
```

### Inspecting the audit results

The files in the specified output directory contain the results of the audit. See the `audit_summary.md` file for a summary of the audit results.

The audit summary has the following sections.

#### Pipelines

The "Pipelines" section contains a high-level statistics regarding the conversion rate done by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Pipelines" section:

* **Successful** pipelines had 100% of the pipeline constructs and individual items converted automatically to their GitHub Actions equivalent.
* **Partially successful** pipelines had all of the pipeline constructs converted, however, there were some individual items that were not converted automatically to their GitHub Actions equivalent.
* **Unsupported** pipelines are definition types that are not supported by GitHub Actions Importer.
* **Failed** pipelines encountered a fatal error when being converted. This can occur for one of three reasons:
  * The pipeline was originally misconfigured and not valid.
  * GitHub Actions Importer encountered an internal error when converting it.
  * There was an unsuccessful network response that caused the pipeline to be inaccessible, which is often due to invalid credentials.

#### Build steps

The "Build steps" section contains an overview of individual build steps that are used across all pipelines, and how many were automatically converted by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Build steps" section:

* A **known** build step is a step that was automatically converted to an equivalent action.
* An **unknown** build step is a step that was not automatically converted to an equivalent action.
* An **unsupported** build step is a step that is either:
  * Fundamentally not supported by GitHub Actions.
  * Configured in a way that is incompatible with GitHub Actions.
* An **action** is a list of the actions that were used in the converted workflows. This can be important for:
  * If you use GitHub Enterprise Server, gathering the list of actions to sync to your instance.
  * Defining an organization-level allowlist of actions that are used. This list of actions is a comprehensive list of actions that your security or compliance teams may need to review.

#### Manual tasks

The "Manual tasks" section contains an overview of tasks that GitHub Actions Importer is not able to complete automatically, and that you must complete manually.

Listed below are some key terms that can appear in the "Manual tasks" section:

* A **secret** is a repository or organization-level secret that is used in the converted pipelines. These secrets must be created manually in GitHub Actions for these pipelines to function properly. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).
* A **self-hosted runner** refers to a label of a runner that is referenced in a converted pipeline that is not a GitHub-hosted runner. You will need to manually define these runners for these pipelines to function properly.

#### Files

The final section of the audit report provides a manifest of all the files that were written to disk during the audit.

Each pipeline file has a variety of files included in the audit, including:

* The original pipeline as it was defined in GitHub.
* Any network responses used to convert the pipeline.
* The converted workflow file.
* Stack traces that can be used to troubleshoot a failed pipeline conversion.

Additionally, the `workflow_usage.csv` file contains a comma-separated list of all actions, secrets, and runners that are used by each successfully converted pipeline. This can be useful for determining which workflows use which actions, secrets, or runners, and can be useful for performing security reviews.

## Forecasting usage

You can use the `forecast` command to forecast potential GitHub Actions usage by computing metrics from completed pipeline runs in your Bamboo instance.

### Running the forecast command

To perform a forecast of potential GitHub Actions usage, run the following command in your terminal. By default, GitHub Actions Importer includes the previous seven days in the forecast report.

```shell
gh actions-importer forecast bamboo --output-dir tmp/forecast_reports
```

### Forecasting a project

To limit the forecast to the plans and deployments environments associated with a project, you can use the `--project` option, where the value is set to a build project key.

For example:

```shell
gh actions-importer forecast bamboo --project PAN --output-dir tmp/forecast_reports
```

### Inspecting the forecast report

The `forecast_report.md` file in the specified output directory contains the results of the forecast.

Listed below are some key terms that can appear in the forecast report:

* The **job count** is the total number of completed jobs.
* The **pipeline count** is the number of unique pipelines used.
* **Execution time** describes the amount of time a runner spent on a job. This metric can be used to help plan for the cost of GitHub-hosted runners.
  * This metric is correlated to how much you should expect to spend in GitHub Actions. This will vary depending on the hardware used for these minutes. You can use the [GitHub Actions pricing calculator](https://github.com/pricing/calculator) to estimate the costs.
* **Queue time** metrics describe the amount of time a job spent waiting for a runner to be available to execute it.
* **Concurrent jobs** metrics describe the amount of jobs running at any given time. This metric can be used to

## Perform a dry-run migration of a Bamboo pipeline

You can use the `dry-run` command to convert a Bamboo pipeline to an equivalent GitHub Actions workflow. A dry-run creates the output files in a specified directory, but does not open a pull request to migrate the pipeline.

### Running a dry-run migration for a build plan

To perform a dry run of migrating your Bamboo build plan to GitHub Actions, run the following command in your terminal, replacing `:my_plan_slug` with the plan's project and plan key in the format `<projectKey>-<planKey>` (for example: `PAN-SCRIP`).

```shell
gh actions-importer dry-run bamboo build --plan-slug :my_plan_slug --output-dir tmp/dry-run
```

### Running a dry-run migration for a deployment project

To perform a dry run of migrating your Bamboo deployment project to GitHub Actions, run the following command in your terminal, replacing `:my_deployment_project_id` with the ID of the deployment project you are converting.

```shell
gh actions-importer dry-run bamboo deployment --deployment-project-id :my_deployment_project_id --output-dir tmp/dry-run
```

You can view the logs of the dry run and the converted workflow files in the specified output directory.

If there is anything that GitHub Actions Importer was not able to convert automatically, such as unknown build steps or a partially successful pipeline, you might want to create custom transformers to further customize the conversion process. For more information, see [Extending GitHub Actions Importer with custom transformers](/en/actions/migrating-to-github-actions/automated-migrations/extending-github-actions-importer-with-custom-transformers).

## Perform a production migration of a Bamboo pipeline

You can use the `migrate` command to convert a Bamboo pipeline and open a pull request with the equivalent GitHub Actions workflow.

### Running the migrate command for a build plan

To migrate a Bamboo build plan to GitHub Actions, run the following command in your terminal, replacing the `target-url` value with the URL for your GitHub repository, and `:my_plan_slug` with the plan's project and plan key in the format `<projectKey>-<planKey>`.

```shell
gh actions-importer migrate bamboo build --plan-slug :my_plan_slug --target-url :target_url --output-dir tmp/migrate
```

The command's output includes the URL to the pull request that adds the converted workflow to your repository. An example of a successful output is similar to the following:

```shell
$ gh actions-importer migrate bamboo build --plan-slug :PROJECTKEY-PLANKEY --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate
[2022-08-20 22:08:20] Logs: 'tmp/migrate/log/actions-importer-20220916-014033.log'
[2022-08-20 22:08:20] Pull request: 'https://github.com/octo-org/octo-repo/pull/1'
```

### Running the migrate command for a deployment project

To migrate a Bamboo deployment project to GitHub Actions, run the following command in your terminal, replacing the `target-url` value with the URL for your GitHub repository, and `:my_deployment_project_id` with the ID of the deployment project you are converting.

```shell
gh actions-importer migrate bamboo deployment --deployment-project-id :my_deployment_project_id --target-url :target_url --output-dir tmp/migrate
```

The command's output includes the URL to the pull request that adds the converted workflow to your repository. An example of a successful output is similar to the following:

```shell
$ gh actions-importer migrate bamboo deployment --deployment-project-id 123 --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate
[2023-04-20 22:08:20] Logs: 'tmp/migrate/log/actions-importer-20230420-014033.log'
[2023-04-20 22:08:20] Pull request: 'https://github.com/octo-org/octo-repo/pull/1'
```

### Inspecting the pull request

The output from a successful run of the `migrate` command contains a link to the new pull request that adds the converted workflow to your repository.

Some important elements of the pull request include:

* In the pull request description, a section called **Manual steps**, which lists steps that you must manually complete before you can finish migrating your pipelines to GitHub Actions. For example, this section might tell you to create any secrets used in your workflows.
* The converted workflows file. Select the **Files changed** tab in the pull request to view the workflow file that will be added to your GitHub repository.

When you are finished inspecting the pull request, you can merge it to add the workflow to your GitHub repository.

## Reference

This section contains reference information on environment variables, optional arguments, and supported syntax when using GitHub Actions Importer to migrate from Bamboo.

### Using environment variables

GitHub Actions Importer uses environment variables for its authentication configuration. These variables are set when following the configuration process using the `configure` command. For more information, see the [Configuring credentials](#configuring-credentials) section.

GitHub Actions Importer uses the following environment variables to connect to your Bamboo instance:

* `GITHUB_ACCESS_TOKEN`: The personal access token (classic) used to create pull requests with a converted workflow (requires `repo` and `workflow` scopes).
* `GITHUB_INSTANCE_URL`: The URL to the target GitHub instance (for example, `https://github.com`).
* `BAMBOO_ACCESS_TOKEN`: The Bamboo personal access token used to authenticate with your Bamboo instance.
* `BAMBOO_INSTANCE_URL`: The URL to the Bamboo instance (for example, `https://bamboo.example.com`).

These environment variables can be specified in a `.env.local` file that is loaded by GitHub Actions Importer when it is run.

### Optional arguments

There are optional arguments you can use with the GitHub Actions Importer subcommands to customize your migration.

#### `--source-file-path`

You can use the `--source-file-path` argument with the `dry-run` or `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from the Bamboo instance. The `--source-file-path` argument tells GitHub Actions Importer to use the specified source file path instead.

For example:

```shell
gh actions-importer dry-run bamboo build --plan-slug IN-COM -o tmp/bamboo --source-file-path ./path/to/my/bamboo/file.yml
```

#### `--config-file-path`

You can use the `--config-file-path` argument with the `audit`, `dry-run`, and `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from the Bamboo instance. The `--config-file-path` argument tells GitHub Actions Importer to use the specified source files instead.

##### Audit example

In this example, GitHub Actions Importer uses the specified YAML configuration file to perform an audit.

```bash
gh actions-importer audit bamboo -o tmp/bamboo --config-file-path "./path/to/my/bamboo/config.yml"
```

To audit a Bamboo instance using a config file, the config file must be in the following format, and each `repository_slug` must be unique:

```yaml
source_files:
  - repository_slug: IN/COM
    path: path/to/one/source/file.yml
  - repository_slug: IN/JOB
    path: path/to/another/source/file.yml
```

##### Dry run example

In this example, GitHub Actions Importer uses the specified YAML configuration file as the source file to perform a dry run.

The repository slug is built using the `--plan-slug` option. The source file path is matched and pulled from the specified source file.

```bash
gh actions-importer dry-run bamboo build --plan-slug IN-COM -o tmp/bamboo --config-file-path "./path/to/my/bamboo/config.yml"
```

### Supported syntax for Bamboo pipelines

The following table shows the type of properties that GitHub Actions Importer is currently able to convert.

| Bamboo                              | GitHub Actions                                  |              Status |
| :---------------------------------- | :---------------------------------------------- | ------------------: |
| `environments`                      | `jobs`                                          |           Supported |
| `environments.<environment_id>`     | `jobs.<job_id>`                                 |           Supported |
| `<job_id>.artifacts`                | `jobs.<job_id>.steps.actions/upload-artifact`   |           Supported |
| `<job_id>.artifact-subscriptions`   | `jobs.<job_id>.steps.actions/download-artifact` |           Supported |
| `<job_id>.docker`                   | `jobs.<job_id>.container`                       |           Supported |
| `<job_id>.final-tasks`              | `jobs.<job_id>.steps.if`                        |           Supported |
| `<job_id>.requirements`             | `jobs.<job_id>.runs-on`                         |           Supported |
| `<job_id>.tasks`                    | `jobs.<job_id>.steps`                           |           Supported |
| `<job_id>.variables`                | `jobs.<job_id>.env`                             |           Supported |
| `stages`                            | `jobs.<job_id>.needs`                           |           Supported |
| `stages.<stage_id>.final`           | `jobs.<job_id>.if`                              |           Supported |
| `stages.<stage_id>.jobs`            | `jobs`                                          |           Supported |
| `stages.<stage_id>.jobs.<job_id>`   | `jobs.<job_id>`                                 |           Supported |
| `stages.<stage_id>.manual`          | `jobs.<job_id>.environment`                     |           Supported |
| `triggers`                          | `on`                                            |           Supported |
| `dependencies`                      | `jobs.<job_id>.steps.<gh cli step>`             | Partially Supported |
| `branches`                          | Not applicable                                  |         Unsupported |
| `deployment.deployment-permissions` | Not applicable                                  |         Unsupported |
| `environment-permissions`           | Not applicable                                  |         Unsupported |
| `notifications`                     | Not applicable                                  |         Unsupported |
| `plan-permissions`                  | Not applicable                                  |         Unsupported |
| `release-naming`                    | Not applicable                                  |         Unsupported |
| `repositories`                      | Not applicable                                  |         Unsupported |

For more information about supported Bamboo concept and plugin mappings, see the [`github/gh-actions-importer` repository](https://github.com/github/gh-actions-importer/blob/main/docs/bamboo/index.md).

### Environment variable mapping

GitHub Actions Importer uses the mapping in the table below to convert default Bamboo environment variables to the closest equivalent in GitHub Actions.

| Bamboo                                           | GitHub Actions                                                                        |
| :----------------------------------------------- | :------------------------------------------------------------------------------------ |
| `bamboo.agentId`                                 | `${{ github.runner_name }}`                                                           |
| `bamboo.agentWorkingDirectory`                   | `${{ github.workspace }}`                                                             |
| `bamboo.buildKey`                                | `${{ github.workflow }}-${{ github.job }}`                                            |
| `bamboo.buildNumber`                             | `${{ github.run_id }}`                                                                |
| `bamboo.buildPlanName`                           | `${{ github.repository }}-${{ github.workflow }}-${{ github.job }`                    |
| `bamboo.buildResultKey`                          | `${{ github.workflow }}-${{ github.job }}-${{ github.run_id }}`                       |
| `bamboo.buildResultsUrl`                         | `${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}` |
| `bamboo.build.working.directory`                 | `${{ github.workspace }}`                                                             |
| `bamboo.deploy.project`                          | `${{ github.repository }}`                                                            |
| `bamboo.ManualBuildTriggerReason.userName`       | `${{ github.actor }}`                                                                 |
| `bamboo.planKey`                                 | `${{ github.workflow }}`                                                              |
| `bamboo.planName`                                | `${{ github.repository }}-${{ github.workflow }}`                                     |
| `bamboo.planRepository.branchDisplayName`        | `${{ github.ref }}`                                                                   |
| `bamboo.planRepository.<position>.branch`        | `${{ github.ref }}`                                                                   |
| `bamboo.planRepository.<position>.branchName`    | `${{ github.ref }}`                                                                   |
| `bamboo.planRepository.<position>.name`          | `${{ github.repository }}`                                                            |
| `bamboo.planRepository.<position>.repositoryUrl` | `${{ github.server }}/${{ github.repository }}`                                       |
| `bamboo.planRepository.<position>.revision`      | `${{ github.sha }}`                                                                   |
| `bamboo.planRepository.<position>.username`      | `${{ github.actor}}`                                                                  |
| `bamboo.repository.branch.name`                  | `${{ github.ref }}`                                                                   |
| `bamboo.repository.git.branch`                   | `${{ github.ref }}`                                                                   |
| `bamboo.repository.git.repositoryUrl`            | `${{ github.server }}/${{ github.repository }}`                                       |
| `bamboo.repository.pr.key`                       | `${{ github.event.pull_request.number }}`                                             |
| `bamboo.repository.pr.sourceBranch`              | `${{ github.event.pull_request.head.ref }}`                                           |
| `bamboo.repository.pr.targetBranch`              | `${{ github.event.pull_request.base.ref }}`                                           |
| `bamboo.resultsUrl`                              | `${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}` |
| `bamboo.shortJobKey`                             | `${{ github.job }}`                                                                   |
| `bamboo.shortJobName`                            | `${{ github.job }}`                                                                   |
| `bamboo.shortPlanKey`                            | `${{ github.workflow }}`                                                              |
| `bamboo.shortPlanName`                           | `${{ github.workflow }}`                                                              |

> \[!NOTE]
> Unknown variables are transformed to `${{ env.<variableName> }}` and must be replaced or added under `env` for proper operation. For example, `${bamboo.jira.baseUrl}` will become `${{ env.jira_baseUrl }}`.

### System Variables

System variables used in tasks are transformed to the equivalent bash shell variable and are assumed to be available. For example, `${system.<variable.name>}` will be transformed to `$variable_name`. We recommend you verify this to ensure proper operation of the workflow.

## Legal notice

Portions have been adapted from <https://github.com/github/gh-actions-importer/> under the MIT license:

```text
MIT License

Copyright (c) 2022 GitHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
---

# Migrating from Bitbucket Pipelines with GitHub Actions Importer

Learn how to use GitHub Actions Importer to automate the migration of your Bitbucket pipelines to GitHub Actions.

## About migrating from Bitbucket Pipelines with GitHub Actions Importer

The instructions below will guide you through configuring your environment to use GitHub Actions Importer to migrate Bitbucket Pipelines to GitHub Actions.

### Prerequisites

* An environment where you can run Linux-based containers, and can install the necessary tools.
  * Docker is [installed](https://docs.docker.com/get-docker/) and running.

  * [GitHub CLI](https://cli.github.com) is installed.
  > \[!NOTE]
  > The GitHub Actions Importer container and CLI do not need to be installed on the same server as your CI platform.

### Limitations

There are some limitations when migrating from Bitbucket Pipelines to GitHub Actions with GitHub Actions Importer.

* Images in a private AWS ECR are not supported.
* The Bitbucket Pipelines option `size` is not supported. If additional runner resources are required in GitHub Actions, consider using larger runners. For more information, see [Using larger runners](/en/actions/using-github-hosted-runners/about-larger-runners).
* Metrics detailing the queue time of jobs is not supported by the `forecast` command.
* Bitbucket [after-scripts](https://support.atlassian.com/bitbucket-cloud/docs/step-options/#After-script) are supported using GitHub Actions `always()` in combination with checking the `steps.<step_id>.conclusion` of the previous step. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts#steps-context).

  The following is an example of using the `always()` with `steps.<step_id>.conclusion`.

  ```yaml
    - name: After Script 1
      run: |-
        echo "I'm after the script ran!"
        echo "We should be grouped!"
      id: after-script-1
      if: "${{ always() }}"
    - name: After Script 2
      run: |-
        echo "this is really the end"
        echo "goodbye, for now!"
      id: after-script-2
      if: "${{ steps.after-script-1.conclusion == 'success' && always() }}"
  ```

### Manual tasks

Certain Bitbucket Pipelines constructs must be migrated manually. These include:

* Secured repository, workspace, and deployment variables
* SSH keys

## Installing the GitHub Actions Importer CLI extension

1. Install the GitHub Actions Importer CLI extension:

   ```bash copy
   gh extension install github/gh-actions-importer
   ```

2. Verify that the extension is installed:

   ```bash
   $ gh actions-importer -h
   Options:
     -?, -h, --help  Show help and usage information

   Commands:
     update     Update to the latest version of GitHub Actions Importer.
     version    Display the version of GitHub Actions Importer.
     configure  Start an interactive prompt to configure credentials used to authenticate with your CI server(s).
     audit      Plan your CI/CD migration by analyzing your current CI/CD footprint.
     forecast   Forecast GitHub Actions usage from historical pipeline utilization.
     dry-run    Convert a pipeline to a GitHub Actions workflow and output its yaml file.
     migrate    Convert a pipeline to a GitHub Actions workflow and open a pull request with the changes.
   ```

## Configuring credentials

The `configure` CLI command is used to set required credentials and options for GitHub Actions Importer when working with Bitbucket Pipelines and GitHub.

1. Create a GitHub personal access token (classic). For more information, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic).

   Your token must have the `workflow` scope.

   After creating the token, copy it and save it in a safe location for later use.

2. Create a Workspace Access Token for Bitbucket Pipelines. For more information, see [Workspace Access Token permissions](https://support.atlassian.com/bitbucket-cloud/docs/workspace-access-token-permissions/) in the Bitbucket documentation. Your token must have the `read` scope for pipelines, projects, and repositories.

3. In your terminal, run the GitHub Actions Importer `configure` CLI command:

   ```shell
   gh actions-importer configure
   ```

   The `configure` command will prompt you for the following information:

   * For "Which CI providers are you configuring?", use the arrow keys to select `Bitbucket`, press <kbd>Space</kbd> to select it, then press <kbd>Enter</kbd>.
   * For "Personal access token for GitHub", enter the value of the personal access token (classic) that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the GitHub instance", press <kbd>Enter</kbd> to accept the default value (`https://github.com`).
   * For "Personal access token for Bitbucket", enter the Workspace Access Token that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the Bitbucket instance", enter the URL for your Bitbucket instance, and press <kbd>Enter</kbd>.

   An example of the `configure` command is shown below:

   ```shell
   $ gh actions-importer configure
   ✔ Which CI providers are you configuring?: Bitbucket
   Enter the following values (leave empty to omit):
   ✔ Personal access token for GitHub: ***************
   ✔ Base url of the GitHub instance: https://github.com
   ✔ Personal access token for Bitbucket: ********************
   ✔ Base url of the Bitbucket instance: https://bitbucket.example.com
   Environment variables successfully updated.
   ```

4. In your terminal, run the GitHub Actions Importer `update` CLI command to connect to GitHub Packages Container registry and ensure that the container image is updated to the latest version:

   ```shell
   gh actions-importer update
   ```

   The output of the command should be similar to below:

   ```shell
   Updating ghcr.io/actions-importer/cli:latest...
   ghcr.io/actions-importer/cli:latest up-to-date
   ```

## Perform an audit of the Bitbucket instance

You can use the audit command to get a high-level view of pipelines in a Bitbucket instance.

The audit command performs the following steps.

1. Fetches all of the pipelines for a workspace.
2. Converts pipeline to its equivalent GitHub Actions workflow.
3. Generates a report that summarizes how complete and complex of a migration is possible with GitHub Actions Importer.

### Running the audit command

To perform an audit run the following command in your terminal, replacing `:workspace` with the name of the Bitbucket workspace to audit.

```bash
gh actions-importer audit bitbucket --workspace :workspace --output-dir tmp/audit
```

Optionally, a `--project-key` option can be provided to the audit command to limit the results to only pipelines associated with a project.

In the below example command `:project_key` should be replaced with the key of the project that should be audited. Project keys can be found in Bitbucket on the workspace projects page.

```bash
gh actions-importer audit bitbucket --workspace :workspace --project-key :project_key --output-dir tmp/audit
```

### Inspecting the audit results

The files in the specified output directory contain the results of the audit. See the `audit_summary.md` file for a summary of the audit results.

The audit summary has the following sections.

#### Pipelines

The "Pipelines" section contains a high-level statistics regarding the conversion rate done by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Pipelines" section:

* **Successful** pipelines had 100% of the pipeline constructs and individual items converted automatically to their GitHub Actions equivalent.
* **Partially successful** pipelines had all of the pipeline constructs converted, however, there were some individual items that were not converted automatically to their GitHub Actions equivalent.
* **Unsupported** pipelines are definition types that are not supported by GitHub Actions Importer.
* **Failed** pipelines encountered a fatal error when being converted. This can occur for one of three reasons:
  * The pipeline was originally misconfigured and not valid.
  * GitHub Actions Importer encountered an internal error when converting it.
  * There was an unsuccessful network response that caused the pipeline to be inaccessible, which is often due to invalid credentials.

#### Build steps

The "Build steps" section contains an overview of individual build steps that are used across all pipelines, and how many were automatically converted by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Build steps" section:

* A **known** build step is a step that was automatically converted to an equivalent action.
* An **unknown** build step is a step that was not automatically converted to an equivalent action.
* An **unsupported** build step is a step that is either:
  * Fundamentally not supported by GitHub Actions.
  * Configured in a way that is incompatible with GitHub Actions.
* An **action** is a list of the actions that were used in the converted workflows. This can be important for:
  * If you use GitHub Enterprise Server, gathering the list of actions to sync to your instance.
  * Defining an organization-level allowlist of actions that are used. This list of actions is a comprehensive list of actions that your security or compliance teams may need to review.

#### Manual tasks

The "Manual tasks" section contains an overview of tasks that GitHub Actions Importer is not able to complete automatically, and that you must complete manually.

Listed below are some key terms that can appear in the "Manual tasks" section:

* A **secret** is a repository or organization-level secret that is used in the converted pipelines. These secrets must be created manually in GitHub Actions for these pipelines to function properly. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).
* A **self-hosted runner** refers to a label of a runner that is referenced in a converted pipeline that is not a GitHub-hosted runner. You will need to manually define these runners for these pipelines to function properly.

#### Files

The final section of the audit report provides a manifest of all the files that were written to disk during the audit.

Each pipeline file has a variety of files included in the audit, including:

* The original pipeline as it was defined in GitHub.
* Any network responses used to convert the pipeline.
* The converted workflow file.
* Stack traces that can be used to troubleshoot a failed pipeline conversion.

Additionally, the `workflow_usage.csv` file contains a comma-separated list of all actions, secrets, and runners that are used by each successfully converted pipeline. This can be useful for determining which workflows use which actions, secrets, or runners, and can be useful for performing security reviews.

## Forecasting usage

You can use the `forecast` command to forecast potential GitHub Actions usage by computing metrics from completed pipeline runs in your Bitbucket instance.

### Running the forecast command

To perform a forecast of potential GitHub Actions usage, run the following command in your terminal, replacing `:workspace` with the name of the Bitbucket workspace to forecast. By default, GitHub Actions Importer includes the previous seven days in the forecast report.

```shell
gh actions-importer forecast bitbucket --workspace :workspace --output-dir tmp/forecast_reports
```

### Forecasting a project

To limit the forecast to a project, you can use the `--project-key` option. Replace the value for the `:project_key` with the project key for the project to forecast.

```shell
gh actions-importer forecast bitbucket --workspace :workspace --project-key :project_key --output-dir tmp/forecast_reports
```

### Inspecting the forecast report

The `forecast_report.md` file in the specified output directory contains the results of the forecast.

Listed below are some key terms that can appear in the forecast report:

* The **job count** is the total number of completed jobs.
* The **pipeline count** is the number of unique pipelines used.
* **Execution time** describes the amount of time a runner spent on a job. This metric can be used to help plan for the cost of GitHub-hosted runners.
  * This metric is correlated to how much you should expect to spend in GitHub Actions. This will vary depending on the hardware used for these minutes. You can use the [GitHub Actions pricing calculator](https://github.com/pricing/calculator) to estimate the costs.
* **Concurrent jobs** metrics describe the amount of jobs running at any given time.

## Performing a dry-run migration

You can use the dry-run command to convert a Bitbucket pipeline to an equivalent GitHub Actions workflow(s). A dry-run creates the output files in a specified directory, but does not open a pull request to migrate the pipeline.

### Running the dry-run command

To perform a dry run of migrating a Bitbucket pipeline to GitHub Actions, run the following command in your terminal, replacing `:workspace` with the name of the workspace and `:repo` with the name of the repository in Bitbucket.

```bash
gh actions-importer dry-run bitbucket --workspace :workspace --repository :repo --output-dir tmp/dry-run
```

### Inspecting the converted workflows

You can view the logs of the dry run and the converted workflow files in the specified output directory.

If there is anything that GitHub Actions Importer was not able to convert automatically, such as unknown build steps or a partially successful pipeline, you might want to create custom transformers to further customize the conversion process. For more information, see [Extending GitHub Actions Importer with custom transformers](/en/actions/migrating-to-github-actions/automated-migrations/extending-github-actions-importer-with-custom-transformers).

## Performing a production migration

You can use the migrate command to convert a Bitbucket pipeline and open a pull request with the equivalent GitHub Actions workflow(s).

### Running the migrate command

To migrate a Bitbucket pipeline to GitHub Actions, run the following command in your terminal, replacing the following values.

* Replace `target-url` value with the URL for your GitHub repository.
* Replace `:repo` with the name of the repository in Bitbucket.
* Replace `:workspace` with the name of the workspace.

```bash
gh actions-importer migrate bitbucket --workspace :workspace --repository :repo --target-url https://github.com/:owner/:repo --output-dir tmp/dry-run
```

The command's output includes the URL of the pull request that adds the converted workflow to your repository. An example of a successful output is similar to the following:

```bash
gh actions-importer migrate bitbucket --workspace actions-importer --repository custom-trigger --target-url https://github.com/valet-dev-testing/demo-private --output-dir tmp/bitbucket
[2023-07-18 09:56:06] Logs: 'tmp/bitbucket/log/valet-20230718-165606.log'
[2023-07-18 09:56:24] Pull request: 'https://github.com/valet-dev-testing/demo-private/pull/55'
```

### Inspecting the pull request

The output from a successful run of the `migrate` command contains a link to the new pull request that adds the converted workflow to your repository.

Some important elements of the pull request include:

* In the pull request description, a section called **Manual steps**, which lists steps that you must manually complete before you can finish migrating your pipelines to GitHub Actions. For example, this section might tell you to create any secrets used in your workflows.
* The converted workflows file. Select the **Files changed** tab in the pull request to view the workflow file that will be added to your GitHub repository.

When you are finished inspecting the pull request, you can merge it to add the workflow to your GitHub repository.

## Reference

This section contains reference information on environment variables, optional arguments, and supported syntax when using GitHub Actions Importer to migrate from Bitbucket Pipelines.

### Using environment variables

GitHub Actions Importer uses environment variables for its authentication configuration. These variables are set when following the configuration process using the `configure` command. For more information, see the [Configuring credentials](#configuring-credentials) section.

GitHub Actions Importer uses the following environment variables to connect to your Bitbucket instance.

* `GITHUB_ACCESS_TOKEN`: The personal access token (classic) used to create pull requests with a transformed workflow (requires `repo` and `workflow` scopes).
* `GITHUB_INSTANCE_URL`: The url to the target GitHub instance. (e.g. `https://github.com`)
* `BITBUCKET_ACCESS_TOKEN`: The workspace access token with read scopes for pipeline, project, and repository.

These environment variables can be specified in a `.env.local` file that will be loaded by GitHub Actions Importer at run time. The distribution archive contains a `.env.local.template` file that can be used to create these files.

### Optional arguments

There are optional arguments you can use with the GitHub Actions Importer subcommands to customize your migration.

#### `--source-file-path`

You can use the `--source-file-path` argument with the `dry-run` or `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from the Bitbucket instance. The `--source-file-path` argument tells GitHub Actions Importer to use the specified source file path instead.

For example:

```bash
gh actions-importer dry-run bitbucket --workspace :workspace --repository :repo --output-dir tmp/dry-run --source-file-path path/to/my/pipeline/file.yml
```

#### `--config-file-path`

You can use the `--config-file-path` argument with the `audit`, `dry-run`, and `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from the Bitbucket instance. The `--config-file-path` argument tells GitHub Actions Importer to use the specified source files instead.

### Audit example

In this example, GitHub Actions Importer uses the specified YAML configuration file to perform an audit.

```bash
gh actions-importer audit bitbucket --workspace :workspace --output-dir tmp/audit --config-file-path "path/to/my/bitbucket/config.yml"
```

To audit a Bitbucket instance using a config file, the config file must be in the following format, and each `repository_slug` must be unique:

```yaml
source_files:
  - repository_slug: repo_name
    path: path/to/one/source/file.yml
  - repository_slug: another_repo_name
    path: path/to/another/source/file.yml
```

## Supported syntax for Bitbucket Pipelines

The following table shows the type of properties that GitHub Actions Importer is currently able to convert.

| Bitbucket                 | GitHub Actions                                  |      Status |
| :------------------------ | :---------------------------------------------- | ----------: |
| `after-script`            | `jobs.<job_id>.steps[*]`                        |   Supported |
| `artifacts`               | `actions/upload-artifact` & `download-artifact` |   Supported |
| `caches`                  | `actions/cache`                                 |   Supported |
| `clone`                   | `actions/checkout`                              |   Supported |
| `condition`               | `job.<job_id>.steps[*].run`                     |   Supported |
| `deployment`              | `jobs.<job_id>.environment`                     |   Supported |
| `image`                   | `jobs.<job_id>.container`                       |   Supported |
| `max-time`                | `jobs.<job_id>.steps[*].timeout-minutes`        |   Supported |
| `options.docker`          | None                                            |   Supported |
| `options.max-time`        | `jobs.<job_id>.steps[*].timeout-minutes`        |   Supported |
| `parallel`                | `jobs.<job_id>`                                 |   Supported |
| `pipelines.branches`      | `on.push`                                       |   Supported |
| `pipelines.custom`        | `on.workflow_dispatch`                          |   Supported |
| `pipelines.default`       | `on.push`                                       |   Supported |
| `pipelines.pull-requests` | `on.pull_requests`                              |   Supported |
| `pipelines.tags`          | `on.tags`                                       |   Supported |
| `runs-on`                 | `jobs.<job_id>.runs-on`                         |   Supported |
| `script`                  | `job.<job_id>.steps[*].run`                     |   Supported |
| `services`                | `jobs.<job_id>.service`                         |   Supported |
| `stage`                   | `jobs.<job_id>`                                 |   Supported |
| `step`                    | `jobs.<job_id>.steps[*]`                        |   Supported |
| `trigger`                 | `on.workflow_dispatch`                          |   Supported |
| `fail-fast`               | None                                            | Unsupported |
| `oidc`                    | None                                            | Unsupported |
| `options.size`            | None                                            | Unsupported |
| `size`                    | None                                            | Unsupported |

### Environment variable mapping

GitHub Actions Importer uses the mapping in the table below to convert default Bitbucket environment variables to the closest equivalent in GitHub Actions.

| Bitbucket                               | GitHub Actions                                              |
| :-------------------------------------- | :---------------------------------------------------------- |
| `CI`                                    | `true`                                                      |
| `BITBUCKET_BUILD_NUMBER`                | `${{ github.run_number }}`                                  |
| `BITBUCKET_CLONE_DIR`                   | `${{ github.workspace }}`                                   |
| `BITBUCKET_COMMIT`                      | `${{ github.sha }}`                                         |
| `BITBUCKET_WORKSPACE`                   | `${{ github.repository_owner }}`                            |
| `BITBUCKET_REPO_SLUG`                   | `${{ github.repository }}`                                  |
| `BITBUCKET_REPO_UUID`                   | `${{ github.repository_id }}`                               |
| `BITBUCKET_REPO_FULL_NAME`              | `${{ github.repository_owner }}`/`${{ github.repository }}` |
| `BITBUCKET_BRANCH`                      | `${{ github.ref }}`                                         |
| `BITBUCKET_TAG`                         | `${{ github.ref }}`                                         |
| `BITBUCKET_PR_ID`                       | `${{ github.event.pull_request.number }}`                   |
| `BITBUCKET_PR_DESTINATION_BRANCH`       | `${{ github.event.pull_request.base.ref }}`                 |
| `BITBUCKET_GIT_HTTP_ORIGIN`             | `${{ github.event.repository.clone_url }}`                  |
| `BITBUCKET_GIT_SSH_ORIGIN`              | `${{ github.event.repository.ssh_url }}`                    |
| `BITBUCKET_EXIT_CODE`                   | `${{ job.status }}`                                         |
| `BITBUCKET_STEP_UUID`                   | `${{ job.github_job }}`                                     |
| `BITBUCKET_PIPELINE_UUID`               | `${{ github.workflow }}`                                    |
| `BITBUCKET_PROJECT_KEY`                 | `${{ github.repository_owner }}`                            |
| `BITBUCKET_PROJECT_UUID`                | `${{ github.repository_owner }}`                            |
| `BITBUCKET_STEP_TRIGGERER_UUID`         | `${{ github.actor_id }}`                                    |
| `BITBUCKET_SSH_KEY_FILE`                | `${{ github.workspace }}/.ssh/id_rsa`                       |
| `BITBUCKET_STEP_OIDC_TOKEN`             | No Mapping                                                  |
| `BITBUCKET_DEPLOYMENT_ENVIRONMENT`      | No Mapping                                                  |
| `BITBUCKET_DEPLOYMENT_ENVIRONMENT_UUID` | No Mapping                                                  |
| `BITBUCKET_BOOKMARK`                    | No Mapping                                                  |
| `BITBUCKET_PARALLEL_STEP`               | No Mapping                                                  |
| `BITBUCKET_PARALLEL_STEP_COUNT`         | No Mapping                                                  |

### System Variables

System variables used in tasks are transformed to the equivalent bash shell variable and are assumed to be available. For example, `${system.<variable.name>}` will be transformed to `$variable_name`. We recommend you verify this to ensure proper operation of the workflow.

## Legal notice

Portions have been adapted from <https://github.com/github/gh-actions-importer/> under the MIT license:

```text
MIT License

Copyright (c) 2022 GitHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
---

# Migrating from CircleCI with GitHub Actions Importer

Learn how to use GitHub Actions Importer to automate the migration of your CircleCI pipelines to GitHub Actions.

## About migrating from CircleCI with GitHub Actions Importer

The instructions below will guide you through configuring your environment to use GitHub Actions Importer to migrate CircleCI pipelines to GitHub Actions.

### Prerequisites

* A CircleCI account or organization with projects and pipelines that you want to convert to GitHub Actions workflows.
* Access to create a CircleCI personal API token for your account or organization.
* An environment where you can run Linux-based containers, and can install the necessary tools.
  * Docker is [installed](https://docs.docker.com/get-docker/) and running.

  * [GitHub CLI](https://cli.github.com) is installed.
  > \[!NOTE]
  > The GitHub Actions Importer container and CLI do not need to be installed on the same server as your CI platform.

### Limitations

There are some limitations when migrating from CircleCI to GitHub Actions with GitHub Actions Importer:

* Automatic caching in between jobs of different workflows is not supported.
* The `audit` command is only supported when you use a CircleCI organization account. The `dry-run` and `migrate` commands can be used with a CircleCI organization or user account.

#### Manual tasks

Certain CircleCI constructs must be migrated manually. These include:

* Contexts
* Project-level environment variables
* Unknown job properties
* Unknown orbs

## Installing the GitHub Actions Importer CLI extension

1. Install the GitHub Actions Importer CLI extension:

   ```bash copy
   gh extension install github/gh-actions-importer
   ```

2. Verify that the extension is installed:

   ```bash
   $ gh actions-importer -h
   Options:
     -?, -h, --help  Show help and usage information

   Commands:
     update     Update to the latest version of GitHub Actions Importer.
     version    Display the version of GitHub Actions Importer.
     configure  Start an interactive prompt to configure credentials used to authenticate with your CI server(s).
     audit      Plan your CI/CD migration by analyzing your current CI/CD footprint.
     forecast   Forecast GitHub Actions usage from historical pipeline utilization.
     dry-run    Convert a pipeline to a GitHub Actions workflow and output its yaml file.
     migrate    Convert a pipeline to a GitHub Actions workflow and open a pull request with the changes.
   ```

## Configuring credentials

The `configure` CLI command is used to set required credentials and options for GitHub Actions Importer when working with CircleCI and GitHub.

1. Create a GitHub personal access token (classic). For more information, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic).

   Your token must have the `workflow` scope.

   After creating the token, copy it and save it in a safe location for later use.

2. Create a CircleCI personal API token. For more information, see [Managing API Tokens](https://circleci.com/docs/managing-api-tokens/#creating-a-personal-api-token) in the CircleCI documentation.

   After creating the token, copy it and save it in a safe location for later use.

3. In your terminal, run the GitHub Actions Importer `configure` CLI command:

   ```shell
   gh actions-importer configure
   ```

   The `configure` command will prompt you for the following information:

   * For "Which CI providers are you configuring?", use the arrow keys to select `CircleCI`, press <kbd>Space</kbd> to select it, then press <kbd>Enter</kbd>.
   * For "Personal access token for GitHub", enter the value of the personal access token (classic) that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the GitHub instance", press <kbd>Enter</kbd> to accept the default value (`https://github.com`).
   * For "Personal access token for CircleCI", enter the value for the CircleCI personal API token that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the CircleCI instance", press <kbd>Enter</kbd> to accept the default value (`https://circleci.com`).
   * For "CircleCI organization name", enter the name for your CircleCI organization, and press <kbd>Enter</kbd>.

   An example of the `configure` command is shown below:

   ```shell
   $ gh actions-importer configure
   ✔ Which CI providers are you configuring?: CircleCI
   Enter the following values (leave empty to omit):
   ✔ Personal access token for GitHub: ***************
   ✔ Base url of the GitHub instance: https://github.com
   ✔ Personal access token for CircleCI: ********************
   ✔ Base url of the CircleCI instance: https://circleci.com
   ✔ CircleCI organization name: mycircleciorganization
   Environment variables successfully updated.
   ```

4. In your terminal, run the GitHub Actions Importer `update` CLI command to connect to GitHub Packages Container registry and ensure that the container image is updated to the latest version:

   ```shell
   gh actions-importer update
   ```

   The output of the command should be similar to below:

   ```shell
   Updating ghcr.io/actions-importer/cli:latest...
   ghcr.io/actions-importer/cli:latest up-to-date
   ```

## Perform an audit of CircleCI

You can use the `audit` command to get a high-level view of all projects in a CircleCI organization.

The `audit` command performs the following steps:

1. Fetches all of the projects defined in a CircleCI organization.
2. Converts each pipeline to its equivalent GitHub Actions workflow.
3. Generates a report that summarizes how complete and complex of a migration is possible with GitHub Actions Importer.

### Running the audit command

To perform an audit of a CircleCI organization, run the following command in your terminal:

```shell
gh actions-importer audit circle-ci --output-dir tmp/audit
```

### Inspecting the audit results

The files in the specified output directory contain the results of the audit. See the `audit_summary.md` file for a summary of the audit results.

The audit summary has the following sections.

#### Pipelines

The "Pipelines" section contains a high-level statistics regarding the conversion rate done by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Pipelines" section:

* **Successful** pipelines had 100% of the pipeline constructs and individual items converted automatically to their GitHub Actions equivalent.
* **Partially successful** pipelines had all of the pipeline constructs converted, however, there were some individual items that were not converted automatically to their GitHub Actions equivalent.
* **Unsupported** pipelines are definition types that are not supported by GitHub Actions Importer.
* **Failed** pipelines encountered a fatal error when being converted. This can occur for one of three reasons:
  * The pipeline was originally misconfigured and not valid.
  * GitHub Actions Importer encountered an internal error when converting it.
  * There was an unsuccessful network response that caused the pipeline to be inaccessible, which is often due to invalid credentials.

#### Build steps

The "Build steps" section contains an overview of individual build steps that are used across all pipelines, and how many were automatically converted by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Build steps" section:

* A **known** build step is a step that was automatically converted to an equivalent action.
* An **unknown** build step is a step that was not automatically converted to an equivalent action.
* An **unsupported** build step is a step that is either:
  * Fundamentally not supported by GitHub Actions.
  * Configured in a way that is incompatible with GitHub Actions.
* An **action** is a list of the actions that were used in the converted workflows. This can be important for:
  * If you use GitHub Enterprise Server, gathering the list of actions to sync to your instance.
  * Defining an organization-level allowlist of actions that are used. This list of actions is a comprehensive list of actions that your security or compliance teams may need to review.

#### Manual tasks

The "Manual tasks" section contains an overview of tasks that GitHub Actions Importer is not able to complete automatically, and that you must complete manually.

Listed below are some key terms that can appear in the "Manual tasks" section:

* A **secret** is a repository or organization-level secret that is used in the converted pipelines. These secrets must be created manually in GitHub Actions for these pipelines to function properly. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).
* A **self-hosted runner** refers to a label of a runner that is referenced in a converted pipeline that is not a GitHub-hosted runner. You will need to manually define these runners for these pipelines to function properly.

#### Files

The final section of the audit report provides a manifest of all the files that were written to disk during the audit.

Each pipeline file has a variety of files included in the audit, including:

* The original pipeline as it was defined in GitHub.
* Any network responses used to convert the pipeline.
* The converted workflow file.
* Stack traces that can be used to troubleshoot a failed pipeline conversion.

Additionally, the `workflow_usage.csv` file contains a comma-separated list of all actions, secrets, and runners that are used by each successfully converted pipeline. This can be useful for determining which workflows use which actions, secrets, or runners, and can be useful for performing security reviews.

## Forecast potential GitHub Actions usage

You can use the `forecast` command to forecast potential GitHub Actions usage by computing metrics from completed pipeline runs in CircleCI.

### Running the forecast command

To perform a forecast of potential GitHub Actions usage, run the following command in your terminal. By default, GitHub Actions Importer includes the previous seven days in the forecast report.

```shell
gh actions-importer forecast circle-ci --output-dir tmp/forecast_reports
```

### Inspecting the forecast report

The `forecast_report.md` file in the specified output directory contains the results of the forecast.

Listed below are some key terms that can appear in the forecast report:

* The **job count** is the total number of completed jobs.
* The **pipeline count** is the number of unique pipelines used.
* **Execution time** describes the amount of time a runner spent on a job. This metric can be used to help plan for the cost of GitHub-hosted runners.

  This metric is correlated to how much you should expect to spend in GitHub Actions. This will vary depending on the hardware used for these minutes. You can use the [GitHub Actions pricing calculator](https://github.com/pricing/calculator) to estimate the costs.
* **Queue time** metrics describe the amount of time a job spent waiting for a runner to be available to execute it.
* **Concurrent jobs** metrics describe the amount of jobs running at any given time. This metric can be used to define the number of runners you should configure.

Additionally, these metrics are defined for each queue of runners in CircleCI. This is especially useful if there is a mix of hosted or self-hosted runners, or high or low spec machines, so you can see metrics specific to different types of runners.

## Perform a dry-run migration of a CircleCI pipeline

You can use the `dry-run` command to convert a CircleCI pipeline to an equivalent GitHub Actions workflow. A dry-run creates the output files in a specified directory, but does not open a pull request to migrate the pipeline.

To perform a dry run of migrating your CircleCI project to GitHub Actions, run the following command in your terminal, replacing `my-circle-ci-project` with the name of your CircleCI project.

```shell
gh actions-importer dry-run circle-ci --output-dir tmp/dry-run --circle-ci-project my-circle-ci-project
```

You can view the logs of the dry run and the converted workflow files in the specified output directory.

If there is anything that GitHub Actions Importer was not able to convert automatically, such as unknown build steps or a partially successful pipeline, you might want to create custom transformers to further customize the conversion process. For more information, see [Extending GitHub Actions Importer with custom transformers](/en/actions/migrating-to-github-actions/automated-migrations/extending-github-actions-importer-with-custom-transformers).

## Perform a production migration of a CircleCI pipeline

You can use the `migrate` command to convert a CircleCI pipeline and open a pull request with the equivalent GitHub Actions workflow.

### Running the migrate command

To migrate a CircleCI pipeline to GitHub Actions, run the following command in your terminal, replacing the `target-url` value with the URL for your GitHub repository, and `my-circle-ci-project` with the name of your CircleCI project.

```shell
gh actions-importer migrate circle-ci --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate --circle-ci-project my-circle-ci-project
```

The command's output includes the URL to the pull request that adds the converted workflow to your repository. An example of a successful output is similar to the following:

```shell
$ gh actions-importer migrate circle-ci --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate --circle-ci-project my-circle-ci-project
[2022-08-20 22:08:20] Logs: 'tmp/migrate/log/actions-importer-20220916-014033.log'
[2022-08-20 22:08:20] Pull request: 'https://github.com/octo-org/octo-repo/pull/1'
```

### Inspecting the pull request

The output from a successful run of the `migrate` command contains a link to the new pull request that adds the converted workflow to your repository.

Some important elements of the pull request include:

* In the pull request description, a section called **Manual steps**, which lists steps that you must manually complete before you can finish migrating your pipelines to GitHub Actions. For example, this section might tell you to create any secrets used in your workflows.
* The converted workflows file. Select the **Files changed** tab in the pull request to view the workflow file that will be added to your GitHub repository.

When you are finished inspecting the pull request, you can merge it to add the workflow to your GitHub repository.

## Reference

This section contains reference information on environment variables, optional arguments, and supported syntax when using GitHub Actions Importer to migrate from CircleCI.

### Using environment variables

GitHub Actions Importer uses environment variables for its authentication configuration. These variables are set when following the configuration process using the `configure` command. For more information, see the [Configuring credentials](#configuring-credentials) section.

GitHub Actions Importer uses the following environment variables to connect to your CircleCI instance:

* `GITHUB_ACCESS_TOKEN`: The personal access token (classic) used to create pull requests with a converted workflow (requires `repo` and `workflow` scopes).
* `GITHUB_INSTANCE_URL`: The URL to the target GitHub instance (for example, `https://github.com`).
* `CIRCLE_CI_ACCESS_TOKEN`: The CircleCI personal API token used to authenticate with your CircleCI instance.
* `CIRCLE_CI_INSTANCE_URL`: The URL to the CircleCI instance (for example, `https://circleci.com`). If the variable is left unset, `https://circleci.com` is used as the default value.
* `CIRCLE_CI_ORGANIZATION`: The organization name of your CircleCI instance.
* `CIRCLE_CI_PROVIDER`: The location where your pipeline's source file is stored (such as `github`). Currently, only GitHub is supported.
* `CIRCLE_CI_SOURCE_GITHUB_ACCESS_TOKEN` (Optional): The personal access token (classic) used to authenticate with your source GitHub instance (requires `repo` scope). If not provided, the value of `GITHUB_ACCESS_TOKEN` is used instead.
* `CIRCLE_CI_SOURCE_GITHUB_INSTANCE_URL` (Optional): The URL to the source GitHub instance. If not provided, the value of `GITHUB_INSTANCE_URL` is used instead.

These environment variables can be specified in a `.env.local` file that is loaded by GitHub Actions Importer when it is run.

### Optional arguments

There are optional arguments you can use with the GitHub Actions Importer subcommands to customize your migration.

#### `--source-file-path`

You can use the `--source-file-path` argument with the `forecast`, `dry-run`, or `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from source control. The `--source-file-path` argument tells GitHub Actions Importer to use the specified source file path instead.

For example:

```shell
gh actions-importer dry-run circle-ci --output-dir ./output/ --source-file-path ./path/to/.circleci/config.yml
```

If you would like to supply multiple source files when running the `forecast` subcommand, you can use pattern matching in the file path value. For example, `gh forecast --source-file-path ./tmp/previous_forecast/jobs/*.json` supplies GitHub Actions Importer with any source files that match the `./tmp/previous_forecast/jobs/*.json` file path.

#### `--config-file-path`

You can use the `--config-file-path` argument with the `audit`, `dry-run`, and `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from source control. The `--config-file-path` argument tells GitHub Actions Importer to use the specified source files instead.

The `--config-file-path` argument can also be used to specify which repository a converted composite action should be migrated to.

##### Audit example

In this example, GitHub Actions Importer uses the specified YAML configuration file to perform an audit.

```bash
gh actions-importer audit circle-ci --output-dir ./output/ --config-file-path ./path/to/circle-ci/config.yml
```

To audit a CircleCI instance using a config file, the config file must be in the following format, and each `repository_slug` must be unique:

```yaml
source_files:
  - repository_slug: circle-org-name/circle-project-name
    path: path/to/.circleci/config.yml
  - repository_slug: circle-org-name/some-other-circle-project-name
    path: path/to/.circleci/config.yml
```

##### Dry run example

In this example, GitHub Actions Importer uses the specified YAML configuration file as the source file to perform a dry run.

The pipeline is selected by matching the `repository_slug` in the config file to the value of the `--circle-ci-organization` and `--circle-ci-project` options. The `path` is then used to pull the specified source file.

```bash
gh actions-importer dry-run circle-ci --circle-ci-project circle-org-name/circle-project-name --output-dir ./output/ --config-file-path ./path/to/circle-ci/config.yml
```

##### Specify the repository of converted composite actions

GitHub Actions Importer uses the YAML file provided to the `--config-file-path` argument to determine the repository that converted composite actions are migrated to.

To begin, you should run an audit without the `--config-file-path` argument:

```bash
gh actions-importer audit circle-ci --output-dir ./output/
```

The output of this command will contain a file named `config.yml` that contains a list of all the composite actions that were converted by GitHub Actions Importer. For example, the `config.yml` file may have the following contents:

```yaml
composite_actions:
  - name: my-composite-action.yml
    target_url: https://github.com/octo-org/octo-repo
    ref: main
```

You can use this file to specify which repository and ref a reusable workflow or composite action should be added to. You can then use the `--config-file-path` argument to provide the `config.yml` file to GitHub Actions Importer. For example, you can use this file when running a `migrate` command to open a pull request for each unique repository defined in the config file:

```bash
gh actions-importer migrate circle-ci --circle-ci-project my-project-name --output-dir output/ --config-file-path config.yml --target-url https://github.com/my-org/my-repo
```

#### `--include-from`

You can use the `--include-from` argument with the `audit` subcommand.

The `--include-from` argument specifies a file that contains a line-delimited list of repositories to include in the audit of a CircleCI organization. Any repositories that are not included in the file are excluded from the audit.

For example:

```bash
gh actions-importer audit circle-ci --output-dir ./output/ --include-from repositories.txt
```

The file supplied for this parameter must be a line-delimited list of repositories, for example:

```text
repository_one
repository_two
repository_three
```

### Supported syntax for CircleCI pipelines

The following table shows the type of properties that GitHub Actions Importer is currently able to convert.

| CircleCI Pipelines | GitHub Actions                                                                        | Status              |
| :----------------- | :------------------------------------------------------------------------------------ | :------------------ |
| cron triggers      | <ul><li>`on.schedule`</li></ul>                                                       | Supported           |
| environment        | <ul><li>`env`</li><li>`jobs.<job_id>.env`</li><li>`jobs.<job_id>.steps.env`</li></ul> | Supported           |
| executors          | <ul><li>`runs-on`</li></ul>                                                           | Supported           |
| jobs               | <ul><li>`jobs`</li></ul>                                                              | Supported           |
| job                | <ul><li>`jobs.<job_id>`</li><li>`jobs.<job_id>.name`</li></ul>                        | Supported           |
| matrix             | <ul><li>`jobs.<job_id>.strategy`</li><li>`jobs.<job_id>.strategy.matrix`</li></ul>    | Supported           |
| parameters         | <ul><li>`env`</li><li>`workflow-dispatch.inputs`</li></ul>                            | Supported           |
| steps              | <ul><li>`jobs.<job_id>.steps`</li></ul>                                               | Supported           |
| when, unless       | <ul><li>`jobs.<job_id>.if`</li></ul>                                                  | Supported           |
| triggers           | <ul><li>`on`</li></ul>                                                                | Supported           |
| executors          | <ul><li>`container`</li><li>`services`</li></ul>                                      | Partially Supported |
| orbs               | <ul><li>`actions`</li></ul>                                                           | Partially Supported |
| executors          | <ul><li>`self hosted runners`</li></ul>                                               | Unsupported         |
| setup              | Not applicable                                                                        | Unsupported         |
| version            | Not applicable                                                                        | Unsupported         |

For more information about supported CircleCI concept and orb mappings, see the [`github/gh-actions-importer` repository](https://github.com/github/gh-actions-importer/blob/main/docs/circle_ci/index.md).

### Environment variable mapping

GitHub Actions Importer uses the mapping in the table below to convert default CircleCI environment variables to the closest equivalent in GitHub Actions.

| CircleCI                           | GitHub Actions                              |
| :--------------------------------- | :------------------------------------------ |
| `CI`                               | `$CI`                                       |
| `CIRCLE_BRANCH`                    | `${{ github.ref }}`                         |
| `CIRCLE_JOB`                       | `${{ github.job }}`                         |
| `CIRCLE_PR_NUMBER`                 | `${{ github.event.number }}`                |
| `CIRCLE_PR_REPONAME`               | `${{ github.repository }}`                  |
| `CIRCLE_PROJECT_REPONAME`          | `${{ github.repository }}`                  |
| `CIRCLE_SHA1`                      | `${{ github.sha }}`                         |
| `CIRCLE_TAG`                       | `${{ github.ref }}`                         |
| `CIRCLE_USERNAME`                  | `${{ github.actor }}`                       |
| `CIRCLE_WORKFLOW_ID`               | `${{ github.run_number }}`                  |
| `CIRCLE_WORKING_DIRECTORY`         | `${{ github.workspace }}`                   |
| `<< pipeline.id >>`                | `${{ github.workflow }}`                    |
| `<< pipeline.number >>`            | `${{ github.run_number }}`                  |
| `<< pipeline.project.git_url >>`   | `$GITHUB_SERVER_URL/$GITHUB_REPOSITORY`     |
| `<< pipeline.project.type >>`      | `github`                                    |
| `<< pipeline.git.tag >>`           | `${{ github.ref }}`                         |
| `<< pipeline.git.branch >>`        | `${{ github.ref }}`                         |
| `<< pipeline.git.revision >>`      | `${{ github.event.pull_request.head.sha }}` |
| `<< pipeline.git.base_revision >>` | `${{ github.event.pull_request.base.sha }}` |

## Legal notice

Portions have been adapted from <https://github.com/github/gh-actions-importer/> under the MIT license:

```text
MIT License

Copyright (c) 2022 GitHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
---

# Migrating from GitLab with GitHub Actions Importer

Learn how to use GitHub Actions Importer to automate the migration of your GitLab pipelines to GitHub Actions.

## About migrating from GitLab with GitHub Actions Importer

The instructions below will guide you through configuring your environment to use GitHub Actions Importer to migrate GitLab pipelines to GitHub Actions.

### Prerequisites

* A GitLab account or organization with pipelines and jobs that you want to convert to GitHub Actions workflows.
* Access to create a GitLab personal access token for your account or organization.
* An environment where you can run Linux-based containers, and can install the necessary tools.
  * Docker is [installed](https://docs.docker.com/get-docker/) and running.

  * [GitHub CLI](https://cli.github.com) is installed.
  > \[!NOTE]
  > The GitHub Actions Importer container and CLI do not need to be installed on the same server as your CI platform.

### Limitations

There are some limitations on migrating processes automatically from GitLab pipelines to GitHub Actions with GitHub Actions Importer.

* Automatic caching in between jobs of different workflows is not supported.
* The `audit` command is only supported when using an organization account. However, the `dry-run` and `migrate` commands can be used with an organization or user account.

#### Manual tasks

Certain GitLab constructs must be migrated manually. These include:

* Masked project or group variable values
* Artifact reports

For more information on manual migrations, see [Migrating from GitLab CI/CD to GitHub Actions](/en/actions/migrating-to-github-actions/manually-migrating-to-github-actions/migrating-from-gitlab-cicd-to-github-actions).

## Installing the GitHub Actions Importer CLI extension

1. Install the GitHub Actions Importer CLI extension:

   ```bash copy
   gh extension install github/gh-actions-importer
   ```

2. Verify that the extension is installed:

   ```bash
   $ gh actions-importer -h
   Options:
     -?, -h, --help  Show help and usage information

   Commands:
     update     Update to the latest version of GitHub Actions Importer.
     version    Display the version of GitHub Actions Importer.
     configure  Start an interactive prompt to configure credentials used to authenticate with your CI server(s).
     audit      Plan your CI/CD migration by analyzing your current CI/CD footprint.
     forecast   Forecast GitHub Actions usage from historical pipeline utilization.
     dry-run    Convert a pipeline to a GitHub Actions workflow and output its yaml file.
     migrate    Convert a pipeline to a GitHub Actions workflow and open a pull request with the changes.
   ```

## Configuring credentials

The `configure` CLI command is used to set required credentials and options for GitHub Actions Importer when working with GitLab and GitHub.

1. Create a GitHub personal access token (classic). For more information, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic).

   Your token must have the `workflow` scope.

   After creating the token, copy it and save it in a safe location for later use.

2. Create a GitLab personal access token. For more information, see [Personal access tokens](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#create-a-personal-access-token) in the GitLab documentation.

   Your token must have the `read_api` scope.

   After creating the token, copy it and save it in a safe location for later use.

3. In your terminal, run the GitHub Actions Importer `configure` CLI command:

   ```shell
   gh actions-importer configure
   ```

   The `configure` command will prompt you for the following information:

   * For "Which CI providers are you configuring?", use the arrow keys to select `GitLab`, press <kbd>Space</kbd> to select it, then press <kbd>Enter</kbd>.
   * For "Personal access token for GitHub", enter the value of the personal access token (classic) that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the GitHub instance", press <kbd>Enter</kbd> to accept the default value (`https://github.com`).
   * For "Private token for GitLab", enter the value for the GitLab personal access token that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the GitLab instance", enter the URL of your GitLab instance, and press <kbd>Enter</kbd>.

   An example of the output of the `configure` command is shown below.

   ```shell
   $ gh actions-importer configure
   ✔ Which CI providers are you configuring?: GitLab
   Enter the following values (leave empty to omit):
   ✔ Personal access token for GitHub: ***************
   ✔ Base url of the GitHub instance: https://github.com
   ✔ Private token for GitLab: ***************
   ✔ Base url of the GitLab instance: http://localhost
   Environment variables successfully updated.
   ```

4. In your terminal, run the GitHub Actions Importer `update` CLI command to connect to GitHub Packages Container registry and ensure that the container image is updated to the latest version:

   ```shell
   gh actions-importer update
   ```

   The output of the command should be similar to below:

   ```shell
   Updating ghcr.io/actions-importer/cli:latest...
   ghcr.io/actions-importer/cli:latest up-to-date
   ```

## Perform an audit of GitLab

You can use the `audit` command to get a high-level view of all pipelines in a GitLab server.

The `audit` command performs the following steps:

1. Fetches all of the projects defined in a GitLab server.
2. Converts each pipeline to its equivalent GitHub Actions workflow.
3. Generates a report that summarizes how complete and complex of a migration is possible with GitHub Actions Importer.

### Prerequisites for the audit command

In order to use the `audit` command, you must have a personal access token configured with a GitLab organization account.

### Running the audit command

To perform an audit of a GitLab server, run the following command in your terminal, replacing `my-gitlab-namespace` with the namespace or group you are auditing:

```shell
gh actions-importer audit gitlab --output-dir tmp/audit --namespace my-gitlab-namespace
```

### Inspecting the audit results

The files in the specified output directory contain the results of the audit. See the `audit_summary.md` file for a summary of the audit results.

The audit summary has the following sections.

#### Pipelines

The "Pipelines" section contains a high-level statistics regarding the conversion rate done by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Pipelines" section:

* **Successful** pipelines had 100% of the pipeline constructs and individual items converted automatically to their GitHub Actions equivalent.
* **Partially successful** pipelines had all of the pipeline constructs converted, however, there were some individual items that were not converted automatically to their GitHub Actions equivalent.
* **Unsupported** pipelines are definition types that are not supported by GitHub Actions Importer.
* **Failed** pipelines encountered a fatal error when being converted. This can occur for one of three reasons:
  * The pipeline was originally misconfigured and not valid.
  * GitHub Actions Importer encountered an internal error when converting it.
  * There was an unsuccessful network response that caused the pipeline to be inaccessible, which is often due to invalid credentials.

#### Build steps

The "Build steps" section contains an overview of individual build steps that are used across all pipelines, and how many were automatically converted by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Build steps" section:

* A **known** build step is a step that was automatically converted to an equivalent action.
* An **unknown** build step is a step that was not automatically converted to an equivalent action.
* An **unsupported** build step is a step that is either:
  * Fundamentally not supported by GitHub Actions.
  * Configured in a way that is incompatible with GitHub Actions.
* An **action** is a list of the actions that were used in the converted workflows. This can be important for:
  * If you use GitHub Enterprise Server, gathering the list of actions to sync to your instance.
  * Defining an organization-level allowlist of actions that are used. This list of actions is a comprehensive list of actions that your security or compliance teams may need to review.

#### Manual tasks

The "Manual tasks" section contains an overview of tasks that GitHub Actions Importer is not able to complete automatically, and that you must complete manually.

Listed below are some key terms that can appear in the "Manual tasks" section:

* A **secret** is a repository or organization-level secret that is used in the converted pipelines. These secrets must be created manually in GitHub Actions for these pipelines to function properly. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).
* A **self-hosted runner** refers to a label of a runner that is referenced in a converted pipeline that is not a GitHub-hosted runner. You will need to manually define these runners for these pipelines to function properly.

#### Files

The final section of the audit report provides a manifest of all the files that were written to disk during the audit.

Each pipeline file has a variety of files included in the audit, including:

* The original pipeline as it was defined in GitHub.
* Any network responses used to convert the pipeline.
* The converted workflow file.
* Stack traces that can be used to troubleshoot a failed pipeline conversion.

Additionally, the `workflow_usage.csv` file contains a comma-separated list of all actions, secrets, and runners that are used by each successfully converted pipeline. This can be useful for determining which workflows use which actions, secrets, or runners, and can be useful for performing security reviews.

## Forecast potential build runner usage

You can use the `forecast` command to forecast potential GitHub Actions usage by computing metrics from completed pipeline runs in your GitLab server.

### Running the forecast command

To perform a forecast of potential GitHub Actions usage, run the following command in your terminal, replacing `my-gitlab-namespace` with the namespace or group you are forecasting. By default, GitHub Actions Importer includes the previous seven days in the forecast report.

```shell
gh actions-importer forecast gitlab --output-dir tmp/forecast --namespace my-gitlab-namespace
```

### Forecasting an entire namespace

To forecast an entire namespace and all of its subgroups, you must specify each subgroup in the `--namespace` argument or `NAMESPACE` environment variable.

For example:

```shell
gh actions-importer forecast gitlab --namespace my-gitlab-namespace my-gitlab-namespace/subgroup-one my-gitlab-namespace/subgroup-two ...
```

### Inspecting the forecast report

The `forecast_report.md` file in the specified output directory contains the results of the forecast.

Listed below are some key terms that can appear in the forecast report:

* The **job count** is the total number of completed jobs.
* The **pipeline count** is the number of unique pipelines used.
* **Execution time** describes the amount of time a runner spent on a job. This metric can be used to help plan for the cost of GitHub-hosted runners.
  * This metric is correlated to how much you should expect to spend in GitHub Actions. This will vary depending on the hardware used for these minutes. You can use the [GitHub Actions pricing calculator](https://github.com/pricing/calculator) to estimate the costs.
* **Queue time** metrics describe the amount of time a job spent waiting for a runner to be available to execute it.
* **Concurrent jobs** metrics describe the amount of jobs running at any given time. This metric can be used to define the number of runners you should configure.

Additionally, these metrics are defined for each queue of runners in GitLab. This is especially useful if there is a mix of hosted or self-hosted runners, or high or low spec machines, so you can see metrics specific to different types of runners.

## Perform a dry-run migration of a GitLab pipeline

You can use the `dry-run` command to convert a GitLab pipeline to its equivalent GitHub Actions workflow.

### Running the dry-run command

You can use the `dry-run` command to convert a GitLab pipeline to an equivalent GitHub Actions workflow. A dry-run creates the output files in a specified directory, but does not open a pull request to migrate the pipeline.

To perform a dry run of migrating your GitLab pipelines to GitHub Actions, run the following command in your terminal, replacing `my-gitlab-project` with your GitLab project slug, and `my-gitlab-namespace` with the namespace or group (full group path for subgroups, e.g. `my-org/my-team`) you are performing a dry run for.

```shell
gh actions-importer dry-run gitlab --output-dir tmp/dry-run --namespace my-gitlab-namespace --project my-gitlab-project
```

### Inspecting the converted workflows

You can view the logs of the dry run and the converted workflow files in the specified output directory.

If there is anything that GitHub Actions Importer was not able to convert automatically, such as unknown build steps or a partially successful pipeline, you might want to create custom transformers to further customize the conversion process. For more information, see [Extending GitHub Actions Importer with custom transformers](/en/actions/migrating-to-github-actions/automated-migrations/extending-github-actions-importer-with-custom-transformers).

## Perform a production migration of a GitLab pipeline

You can use the `migrate` command to convert a GitLab pipeline and open a pull request with the equivalent GitHub Actions workflow.

### Running the migrate command

To migrate a GitLab pipeline to GitHub Actions, run the following command in your terminal, replacing the following values:

* `target-url` value with the URL for your GitHub repository
* `my-gitlab-project` with your GitLab project slug
* `my-gitlab-namespace` with the namespace or group you are migrating (full path for subgroups, e.g. `my-org/my-team`)

```shell
gh actions-importer migrate gitlab --target-url https://github.com/:owner/:repo --output-dir tmp/migrate --namespace my-gitlab-namespace --project my-gitlab-project
```

The command's output includes the URL to the pull request that adds the converted workflow to your repository. An example of a successful output is similar to the following:

```shell
$ gh actions-importer migrate gitlab --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate --namespace octo-org --project monas-project
[2022-08-20 22:08:20] Logs: 'tmp/migrate/log/actions-importer-20220916-014033.log'
[2022-08-20 22:08:20] Pull request: 'https://github.com/octo-org/octo-repo/pull/1'
```

### Inspecting the pull request

The output from a successful run of the `migrate` command contains a link to the new pull request that adds the converted workflow to your repository.

Some important elements of the pull request include:

* In the pull request description, a section called **Manual steps**, which lists steps that you must manually complete before you can finish migrating your pipelines to GitHub Actions. For example, this section might tell you to create any secrets used in your workflows.
* The converted workflows file. Select the **Files changed** tab in the pull request to view the workflow file that will be added to your GitHub repository.

When you are finished inspecting the pull request, you can merge it to add the workflow to your GitHub repository.

## Reference

This section contains reference information on environment variables, optional arguments, and supported syntax when using GitHub Actions Importer to migrate from GitLab.

### Using environment variables

GitHub Actions Importer uses environment variables for its authentication configuration. These variables are set when following the configuration process using the `configure` command. For more information, see the [Configuring credentials](#configuring-credentials) section.

GitHub Actions Importer uses the following environment variables to connect to your GitLab instance:

* `GITHUB_ACCESS_TOKEN`: The personal access token (classic) used to create pull requests with a converted workflow (requires the `workflow` scope).
* `GITHUB_INSTANCE_URL`: The URL to the target GitHub instance (for example, `https://github.com`).
* `GITLAB_ACCESS_TOKEN`: The GitLab personal access token used to view GitLab resources.
* `GITLAB_INSTANCE_URL`: The URL of the GitLab instance.
* `NAMESPACE`: The namespaces or groups that contain the GitLab pipelines.

These environment variables can be specified in a `.env.local` file that is loaded by GitHub Actions Importer when it is run.

### Using optional arguments

There are optional arguments you can use with the GitHub Actions Importer subcommands to customize your migration.

#### `--source-file-path`

You can use the `--source-file-path` argument with the `forecast`, `dry-run`, or `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from source control. The `--source-file-path` argument tells GitHub Actions Importer to use the specified source file path instead.

For example:

```shell
gh actions-importer dry-run gitlab --output-dir output/ --namespace my-gitlab-namespace --project my-gitlab-project --source-file-path path/to/.gitlab-ci.yml
```

If you would like to supply multiple source files when running the `forecast` subcommand, you can use pattern matching in the file path value. The following example supplies GitHub Actions Importer with any source files that match the `./tmp/previous_forecast/jobs/*.json` file path.

```shell
gh actions-importer forecast gitlab --output-dir output/ --namespace my-gitlab-namespace --project my-gitlab-project --source-file-path ./tmp/previous_forecast/jobs/*.json
```

#### `--config-file-path`

You can use the `--config-file-path` argument with the `audit`, `dry-run`, and `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from source control. The `--config-file-path` argument tells GitHub Actions Importer to use the specified source files instead.

The `--config-file-path` argument can also be used to specify which repository a converted reusable workflow should be migrated to.

##### Audit example

In this example, GitHub Actions Importer uses the specified YAML configuration file to perform an audit.

```shell
gh actions-importer audit gitlab --output-dir path/to/output/ --namespace my-gitlab-namespace --config-file-path path/to/gitlab/config.yml
```

To audit a GitLab instance using a configuration file, the file must be in the following format, and each `repository_slug` value must be unique:

```yaml
source_files:
  - repository_slug: namespace/project-name
    path: path/to/.gitlab-ci.yml
  - repository_slug: namespace/some-other-project-name
    path: path/to/.gitlab-ci.yml
```

##### Dry run example

In this example, GitHub Actions Importer uses the specified YAML configuration file as the source file to perform a dry run.

The pipeline is selected by matching the `repository_slug` in the configuration file to the value of the `--namespace` and `--project` options. The `path` is then used to pull the specified source file.

```shell
gh actions-importer dry-run gitlab --namespace my-gitlab-namespace --project my-gitlab-project-name --output-dir ./output/ --config-file-path ./path/to/gitlab/config.yml
```

##### Specify the repository of converted reusable workflows

GitHub Actions Importer uses the YAML file provided to the `--config-file-path` argument to determine the repository that converted reusable workflows are migrated to.

To begin, you should run an audit without the `--config-file-path` argument:

```shell
gh actions-importer audit gitlab --output-dir ./output/
```

The output of this command will contain a file named `config.yml` that contains a list of all the composite actions that were converted by GitHub Actions Importer. For example, the `config.yml` file may have the following contents:

```yaml
reusable_workflows:
  - name: my-reusable-workflow.yml
    target_url: https://github.com/octo-org/octo-repo
    ref: main
```

You can use this file to specify which repository and ref a reusable workflow or composite action should be added to. You can then use the `--config-file-path` argument to provide the `config.yml` file to GitHub Actions Importer. For example, you can use this file when running a `migrate` command to open a pull request for each unique repository defined in the config file:

```shell
gh actions-importer migrate gitlab --project my-project-name --output-dir output/ --config-file-path config.yml --target-url https://github.com/my-org/my-repo
```

### Supported syntax for GitLab pipelines

The following table shows the type of properties GitHub Actions Importer is currently able to convert. For more details about how GitLab pipeline syntax aligns with GitHub Actions, see [Migrating from GitLab CI/CD to GitHub Actions](/en/actions/migrating-to-github-actions/manually-migrating-to-github-actions/migrating-from-gitlab-cicd-to-github-actions).

| GitLab Pipelines                        | GitHub Actions                                                                                          | Status              |
| :-------------------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------ |
| `after_script`                          | `jobs.<job_id>.steps`                                                                                   | Supported           |
| `auto_cancel_pending_pipelines`         | `concurrency`                                                                                           | Supported           |
| `before_script`                         | `jobs.<job_id>.steps`                                                                                   | Supported           |
| `build_timeout` or `timeout`            | `jobs.<job_id>.timeout-minutes`                                                                         | Supported           |
| `default`                               | Not applicable                                                                                          | Supported           |
| `image`                                 | `jobs.<job_id>.container`                                                                               | Supported           |
| `job`                                   | `jobs.<job_id>`                                                                                         | Supported           |
| `needs`                                 | `jobs.<job_id>.needs`                                                                                   | Supported           |
| `only_allow_merge_if_pipeline_succeeds` | `on.pull_request`                                                                                       | Supported           |
| `resource_group`                        | `jobs.<job_id>.concurrency`                                                                             | Supported           |
| `schedule`                              | `on.schedule`                                                                                           | Supported           |
| `script`                                | `jobs.<job_id>.steps`                                                                                   | Supported           |
| `stages`                                | `jobs`                                                                                                  | Supported           |
| `tags`                                  | `jobs.<job_id>.runs-on`                                                                                 | Supported           |
| `variables`                             | `env`, `jobs.<job_id>.env`                                                                              | Supported           |
| Run pipelines for new commits           | `on.push`                                                                                               | Supported           |
| Run pipelines manually                  | `on.workflow_dispatch`                                                                                  | Supported           |
| `environment`                           | `jobs.<job_id>.environment`                                                                             | Partially supported |
| `include`                               | Files referenced in an `include` statement are merged into a single job graph before being transformed. | Partially supported |
| `only` or `except`                      | `jobs.<job_id>.if`                                                                                      | Partially supported |
| `parallel`                              | `jobs.<job_id>.strategy`                                                                                | Partially supported |
| `rules`                                 | `jobs.<job_id>.if`                                                                                      | Partially supported |
| `services`                              | `jobs.<job_id>.services`                                                                                | Partially supported |
| `workflow`                              | `if`                                                                                                    | Partially supported |

For information about supported GitLab constructs, see the [`github/gh-actions-importer` repository](https://github.com/github/gh-actions-importer/blob/main/docs/gitlab/index.md).

### Environment variables syntax

GitHub Actions Importer uses the mapping in the table below to convert default GitLab environment variables to the closest equivalent in GitHub Actions.

| GitLab                                        | GitHub Actions                                                                        |
| :-------------------------------------------- | :------------------------------------------------------------------------------------ |
| `CI_API_V4_URL`                               | `${{ github.api_url }}`                                                               |
| `CI_BUILDS_DIR`                               | `${{ github.workspace }}`                                                             |
| `CI_COMMIT_BRANCH`                            | `${{ github.ref }}`                                                                   |
| `CI_COMMIT_REF_NAME`                          | `${{ github.ref }}`                                                                   |
| `CI_COMMIT_REF_SLUG`                          | `${{ github.ref }}`                                                                   |
| `CI_COMMIT_SHA`                               | `${{ github.sha }}`                                                                   |
| `CI_COMMIT_SHORT_SHA`                         | `${{ github.sha }}`                                                                   |
| `CI_COMMIT_TAG`                               | `${{ github.ref }}`                                                                   |
| `CI_JOB_ID`                                   | `${{ github.job }}`                                                                   |
| `CI_JOB_MANUAL`                               | `${{ github.event_name == 'workflow_dispatch' }}`                                     |
| `CI_JOB_NAME`                                 | `${{ github.job }}`                                                                   |
| `CI_JOB_STATUS`                               | `${{ job.status }}`                                                                   |
| `CI_JOB_URL`                                  | `${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}` |
| `CI_JOB_TOKEN`                                | `${{ github.token }}`                                                                 |
| `CI_NODE_INDEX`                               | `${{ strategy.job-index }}`                                                           |
| `CI_NODE_TOTAL`                               | `${{ strategy.job-total }}`                                                           |
| `CI_PIPELINE_ID`                              | `${{ github.repository}}/${{ github.workflow }}`                                      |
| `CI_PIPELINE_IID`                             | `${{ github.workflow }}`                                                              |
| `CI_PIPELINE_SOURCE`                          | `${{ github.event_name }}`                                                            |
| `CI_PIPELINE_TRIGGERED`                       | `${{ github.actions }}`                                                               |
| `CI_PIPELINE_URL`                             | `${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}` |
| `CI_PROJECT_DIR`                              | `${{ github.workspace }}`                                                             |
| `CI_PROJECT_ID`                               | `${{ github.repository }}`                                                            |
| `CI_PROJECT_NAME`                             | `${{ github.event.repository.name }}`                                                 |
| `CI_PROJECT_NAMESPACE`                        | `${{ github.repository_owner }}`                                                      |
| `CI_PROJECT_PATH_SLUG`                        | `${{ github.repository }}`                                                            |
| `CI_PROJECT_PATH`                             | `${{ github.repository }}`                                                            |
| `CI_PROJECT_ROOT_NAMESPACE`                   | `${{ github.repository_owner }}`                                                      |
| `CI_PROJECT_TITLE`                            | `${{ github.event.repository.full_name }}`                                            |
| `CI_PROJECT_URL`                              | `${{ github.server_url }}/${{ github.repository }}`                                   |
| `CI_REPOSITORY_URL`                           | `${{ github.event.repository.clone_url }}`                                            |
| `CI_RUNNER_EXECUTABLE_ARCH`                   | `${{ runner.os }}`                                                                    |
| `CI_SERVER_HOST`                              | `${{ github.server_url }}`                                                            |
| `CI_SERVER_URL`                               | `${{ github.server_url }}`                                                            |
| `CI_SERVER`                                   | `${{ github.actions }}`                                                               |
| `GITLAB_CI`                                   | `${{ github.actions }}`                                                               |
| `GITLAB_USER_EMAIL`                           | `${{ github.actor }}`                                                                 |
| `GITLAB_USER_ID`                              | `${{ github.actor }}`                                                                 |
| `GITLAB_USER_LOGIN`                           | `${{ github.actor }}`                                                                 |
| `GITLAB_USER_NAME`                            | `${{ github.actor }}`                                                                 |
| `TRIGGER_PAYLOAD`                             | `${{ github.event_path }}`                                                            |
| `CI_MERGE_REQUEST_ASSIGNEES`                  | `${{ github.event.pull_request.assignees }}`                                          |
| `CI_MERGE_REQUEST_ID`                         | `${{ github.event.pull_request.number }}`                                             |
| `CI_MERGE_REQUEST_IID`                        | `${{ github.event.pull_request.number }}`                                             |
| `CI_MERGE_REQUEST_LABELS`                     | `${{ github.event.pull_request.labels }}`                                             |
| `CI_MERGE_REQUEST_MILESTONE`                  | `${{ github.event.pull_request.milestone }}`                                          |
| `CI_MERGE_REQUEST_PROJECT_ID`                 | `${{ github.repository }}`                                                            |
| `CI_MERGE_REQUEST_PROJECT_PATH`               | `${{ github.repository }}`                                                            |
| `CI_MERGE_REQUEST_PROJECT_URL`                | `${{ github.server_url }}/${{ github.repository }}`                                   |
| `CI_MERGE_REQUEST_REF_PATH`                   | `${{ github.ref }}`                                                                   |
| `CI_MERGE_REQUEST_SOURCE_BRANCH_NAME`         | `${{ github.event.pull_request.head.ref }}`                                           |
| `CI_MERGE_REQUEST_SOURCE_BRANCH_SHA`          | `${{ github.event.pull_request.head.sha}}`                                            |
| `CI_MERGE_REQUEST_SOURCE_PROJECT_ID`          | `${{ github.event.pull_request.head.repo.full_name }}`                                |
| `CI_MERGE_REQUEST_SOURCE_PROJECT_PATH`        | `${{ github.event.pull_request.head.repo.full_name }}`                                |
| `CI_MERGE_REQUEST_SOURCE_PROJECT_URL`         | `${{ github.event.pull_request.head.repo.url }}`                                      |
| `CI_MERGE_REQUEST_TARGET_BRANCH_NAME`         | `${{ github.event.pull_request.base.ref }}`                                           |
| `CI_MERGE_REQUEST_TARGET_BRANCH_SHA`          | `${{ github.event.pull_request.base.sha }}`                                           |
| `CI_MERGE_REQUEST_TITLE`                      | `${{ github.event.pull_request.title }}`                                              |
| `CI_EXTERNAL_PULL_REQUEST_IID`                | `${{ github.event.pull_request.number }}`                                             |
| `CI_EXTERNAL_PULL_REQUEST_SOURCE_REPOSITORY`  | `${{ github.event.pull_request.head.repo.full_name }}`                                |
| `CI_EXTERNAL_PULL_REQUEST_TARGET_REPOSITORY`  | `${{ github.event.pull_request.base.repo.full_name }}`                                |
| `CI_EXTERNAL_PULL_REQUEST_SOURCE_BRANCH_NAME` | `${{ github.event.pull_request.head.ref }}`                                           |
| `CI_EXTERNAL_PULL_REQUEST_SOURCE_BRANCH_SHA`  | `${{ github.event.pull_request.head.sha }}`                                           |
| `CI_EXTERNAL_PULL_REQUEST_TARGET_BRANCH_NAME` | `${{ github.event.pull_request.base.ref }}`                                           |
| `CI_EXTERNAL_PULL_REQUEST_TARGET_BRANCH_SHA`  | `${{ github.event.pull_request.base.sha }}`                                           |

## Legal notice

Portions have been adapted from <https://github.com/github/gh-actions-importer/> under the MIT license:

```text
MIT License

Copyright (c) 2022 GitHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
---

# Migrating from Jenkins with GitHub Actions Importer

Learn how to use GitHub Actions Importer to automate the migration of your Jenkins pipelines to GitHub Actions.

## About migrating from Jenkins with GitHub Actions Importer

The instructions below will guide you through configuring your environment to use GitHub Actions Importer to migrate Jenkins pipelines to GitHub Actions.

### Prerequisites

* A Jenkins account or organization with pipelines and jobs that you want to convert to GitHub Actions workflows.
* Access to create a Jenkins personal API token for your account or organization.
* An environment where you can run Linux-based containers, and can install the necessary tools.
  * Docker is [installed](https://docs.docker.com/get-docker/) and running.

  * [GitHub CLI](https://cli.github.com) is installed.
  > \[!NOTE]
  > The GitHub Actions Importer container and CLI do not need to be installed on the same server as your CI platform.

### Limitations

There are some limitations when migrating from Jenkins to GitHub Actions with GitHub Actions Importer. For example, you must migrate the following constructs manually:

* Mandatory build tools
* Scripted pipelines
* Secrets
* Self-hosted runners
* Unknown plugins

For more information on manual migrations, see [Migrating from Jenkins to GitHub Actions](/en/actions/migrating-to-github-actions/manually-migrating-to-github-actions/migrating-from-jenkins-to-github-actions).

## Installing the GitHub Actions Importer CLI extension

1. Install the GitHub Actions Importer CLI extension:

   ```bash copy
   gh extension install github/gh-actions-importer
   ```

2. Verify that the extension is installed:

   ```bash
   $ gh actions-importer -h
   Options:
     -?, -h, --help  Show help and usage information

   Commands:
     update     Update to the latest version of GitHub Actions Importer.
     version    Display the version of GitHub Actions Importer.
     configure  Start an interactive prompt to configure credentials used to authenticate with your CI server(s).
     audit      Plan your CI/CD migration by analyzing your current CI/CD footprint.
     forecast   Forecast GitHub Actions usage from historical pipeline utilization.
     dry-run    Convert a pipeline to a GitHub Actions workflow and output its yaml file.
     migrate    Convert a pipeline to a GitHub Actions workflow and open a pull request with the changes.
   ```

## Configuring credentials

The `configure` CLI command is used to set required credentials and options for GitHub Actions Importer when working with Jenkins and GitHub.

1. Create a GitHub personal access token (classic). For more information, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic).

   Your token must have the `workflow` scope.

   After creating the token, copy it and save it in a safe location for later use.

2. Create a Jenkins API token. For more information, see [Authenticating scripted clients](https://www.jenkins.io/doc/book/system-administration/authenticating-scripted-clients/) in the Jenkins documentation.

   After creating the token, copy it and save it in a safe location for later use.

3. In your terminal, run the GitHub Actions Importer `configure` CLI command:

   ```shell
   gh actions-importer configure
   ```

   The `configure` command will prompt you for the following information:

   * For "Which CI providers are you configuring?", use the arrow keys to select `Jenkins`, press <kbd>Space</kbd> to select it, then press <kbd>Enter</kbd>.
   * For "Personal access token for GitHub", enter the value of the personal access token (classic) that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the GitHub instance", press <kbd>Enter</kbd> to accept the default value (`https://github.com`).
   * For "Personal access token for Jenkins", enter the value for the Jenkins personal API token that you created earlier, and press <kbd>Enter</kbd>.
   * For "Username of Jenkins user", enter your Jenkins username and press <kbd>Enter</kbd>.
   * For "Base url of the Jenkins instance", enter the URL of your Jenkins instance, and press <kbd>Enter</kbd>.

   An example of the `configure` command is shown below:

   ```shell
   $ gh actions-importer configure
   ✔ Which CI providers are you configuring?: Jenkins
   Enter the following values (leave empty to omit):
   ✔ Personal access token for GitHub: ***************
   ✔ Base url of the GitHub instance: https://github.com
   ✔ Personal access token for Jenkins: ***************
   ✔ Username of Jenkins user: admin
   ✔ Base url of the Jenkins instance: https://localhost
   Environment variables successfully updated.
   ```

4. In your terminal, run the GitHub Actions Importer `update` CLI command to connect to GitHub Packages Container registry and ensure that the container image is updated to the latest version:

   ```shell
   gh actions-importer update
   ```

   The output of the command should be similar to below:

   ```shell
   Updating ghcr.io/actions-importer/cli:latest...
   ghcr.io/actions-importer/cli:latest up-to-date
   ```

## Perform an audit of Jenkins

You can use the `audit` command to get a high-level view of all pipelines in a Jenkins server.

The `audit` command performs the following steps:

1. Fetches all of the projects defined in a Jenkins server.
2. Converts each pipeline to its equivalent GitHub Actions workflow.
3. Generates a report that summarizes how complete and complex of a migration is possible with GitHub Actions Importer.

### Running the audit command

To perform an audit of a Jenkins server, run the following command in your terminal:

```shell
gh actions-importer audit jenkins --output-dir tmp/audit
```

### Inspecting the audit results

The files in the specified output directory contain the results of the audit. See the `audit_summary.md` file for a summary of the audit results.

The audit summary has the following sections.

#### Pipelines

The "Pipelines" section contains a high-level statistics regarding the conversion rate done by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Pipelines" section:

* **Successful** pipelines had 100% of the pipeline constructs and individual items converted automatically to their GitHub Actions equivalent.
* **Partially successful** pipelines had all of the pipeline constructs converted, however, there were some individual items that were not converted automatically to their GitHub Actions equivalent.
* **Unsupported** pipelines are definition types that are not supported by GitHub Actions Importer.
* **Failed** pipelines encountered a fatal error when being converted. This can occur for one of three reasons:
  * The pipeline was originally misconfigured and not valid.
  * GitHub Actions Importer encountered an internal error when converting it.
  * There was an unsuccessful network response that caused the pipeline to be inaccessible, which is often due to invalid credentials.

#### Build steps

The "Build steps" section contains an overview of individual build steps that are used across all pipelines, and how many were automatically converted by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Build steps" section:

* A **known** build step is a step that was automatically converted to an equivalent action.
* An **unknown** build step is a step that was not automatically converted to an equivalent action.
* An **unsupported** build step is a step that is either:
  * Fundamentally not supported by GitHub Actions.
  * Configured in a way that is incompatible with GitHub Actions.
* An **action** is a list of the actions that were used in the converted workflows. This can be important for:
  * If you use GitHub Enterprise Server, gathering the list of actions to sync to your instance.
  * Defining an organization-level allowlist of actions that are used. This list of actions is a comprehensive list of actions that your security or compliance teams may need to review.

#### Manual tasks

The "Manual tasks" section contains an overview of tasks that GitHub Actions Importer is not able to complete automatically, and that you must complete manually.

Listed below are some key terms that can appear in the "Manual tasks" section:

* A **secret** is a repository or organization-level secret that is used in the converted pipelines. These secrets must be created manually in GitHub Actions for these pipelines to function properly. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).
* A **self-hosted runner** refers to a label of a runner that is referenced in a converted pipeline that is not a GitHub-hosted runner. You will need to manually define these runners for these pipelines to function properly.

#### Files

The final section of the audit report provides a manifest of all the files that were written to disk during the audit.

Each pipeline file has a variety of files included in the audit, including:

* The original pipeline as it was defined in GitHub.
* Any network responses used to convert the pipeline.
* The converted workflow file.
* Stack traces that can be used to troubleshoot a failed pipeline conversion.

Additionally, the `workflow_usage.csv` file contains a comma-separated list of all actions, secrets, and runners that are used by each successfully converted pipeline. This can be useful for determining which workflows use which actions, secrets, or runners, and can be useful for performing security reviews.

## Forecast potential build runner usage

You can use the `forecast` command to forecast potential GitHub Actions usage by computing metrics from completed pipeline runs in your Jenkins server.

### Prerequisites for running the forecast command

In order to run the `forecast` command against a Jenkins instance, you must install the [`paginated-builds` plugin](https://plugins.jenkins.io/paginated-builds) on your Jenkins server. This plugin allows GitHub Actions Importer to efficiently retrieve historical build data for jobs that have a large number of builds. Because Jenkins does not provide a method to retrieve paginated build data, using this plugin prevents timeouts from the Jenkins server that can occur when fetching a large amount of historical data. The `paginated-builds` plugin is open source, and exposes a REST API endpoint to fetch build data in pages, rather than all at once.

To install the `paginated-builds` plugin:

1. On your Jenkins instance, navigate to `https://<your-jenkins-instance>/pluginManager/available`.
2. Search for the `paginated-builds` plugin.
3. Check the box on the left and select **Install without restart**.

### Running the forecast command

To perform a forecast of potential GitHub Actions, run the following command in your terminal. By default, GitHub Actions Importer includes the previous seven days in the forecast report.

```shell
gh actions-importer forecast jenkins --output-dir tmp/forecast
```

### Inspecting the forecast report

The `forecast_report.md` file in the specified output directory contains the results of the forecast.

Listed below are some key terms that can appear in the forecast report:

* The **job count** is the total number of completed jobs.
* The **pipeline count** is the number of unique pipelines used.
* **Execution time** describes the amount of time a runner spent on a job. This metric can be used to help plan for the cost of GitHub-hosted runners.
  * This metric is correlated to how much you should expect to spend in GitHub Actions. This will vary depending on the hardware used for these minutes. You can use the [GitHub Actions pricing calculator](https://github.com/pricing/calculator) to estimate the costs.
* **Queue time** metrics describe the amount of time a job spent waiting for a runner to be available to execute it.
* **Concurrent jobs** metrics describe the amount of jobs running at any given time. This metric can be used to define the number of runners you should configure.

Additionally, these metrics are defined for each queue of runners in Jenkins. This is especially useful if there is a mix of hosted or self-hosted runners, or high or low spec machines, so you can see metrics specific to different types of runners.

## Perform a dry-run migration of a Jenkins pipeline

You can use the `dry-run` command to convert a Jenkins pipeline to its equivalent GitHub Actions workflow.

### Running the dry-run command

You can use the `dry-run` command to convert a Jenkins pipeline to an equivalent GitHub Actions workflow. A dry-run creates the output files in a specified directory, but does not open a pull request to migrate the pipeline.

To perform a dry run of migrating your Jenkins pipelines to GitHub Actions, run the following command in your terminal, replacing `my-jenkins-project` with the URL of your Jenkins job.

```shell
gh actions-importer dry-run jenkins --source-url my-jenkins-project --output-dir tmp/dry-run
```

### Inspecting the converted workflows

You can view the logs of the dry run and the converted workflow files in the specified output directory.

If there is anything that GitHub Actions Importer was not able to convert automatically, such as unknown build steps or a partially successful pipeline, you might want to create custom transformers to further customize the conversion process. For more information, see [Extending GitHub Actions Importer with custom transformers](/en/actions/migrating-to-github-actions/automated-migrations/extending-github-actions-importer-with-custom-transformers).

## Perform a production migration of a Jenkins pipeline

You can use the `migrate` command to convert a Jenkins pipeline and open a pull request with the equivalent GitHub Actions workflow.

### Running the migrate command

To migrate a Jenkins pipeline to GitHub Actions, run the following command in your terminal, replacing the `target-url` value with the URL for your GitHub repository, and `my-jenkins-project` with the URL for your Jenkins job.

```shell
gh actions-importer migrate jenkins --target-url https://github.com/:owner/:repo --output-dir tmp/migrate --source-url my-jenkins-project
```

The command's output includes the URL to the pull request that adds the converted workflow to your repository. An example of a successful output is similar to the following:

```shell
$ gh actions-importer migrate jenkins --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate --source-url http://localhost:8080/job/monas_dev_work/job/monas_freestyle
[2022-08-20 22:08:20] Logs: 'tmp/migrate/log/actions-importer-20220916-014033.log'
[2022-08-20 22:08:20] Pull request: 'https://github.com/octo-org/octo-repo/pull/1'
```

### Inspecting the pull request

The output from a successful run of the `migrate` command contains a link to the new pull request that adds the converted workflow to your repository.

Some important elements of the pull request include:

* In the pull request description, a section called **Manual steps**, which lists steps that you must manually complete before you can finish migrating your pipelines to GitHub Actions. For example, this section might tell you to create any secrets used in your workflows.
* The converted workflows file. Select the **Files changed** tab in the pull request to view the workflow file that will be added to your GitHub repository.

When you are finished inspecting the pull request, you can merge it to add the workflow to your GitHub repository.

## Reference

This section contains reference information on environment variables, optional arguments, and supported syntax when using GitHub Actions Importer to migrate from Jenkins.

### Using environment variables

GitHub Actions Importer uses environment variables for its authentication configuration. These variables are set when following the configuration process using the `configure` command. For more information, see the [Configuring credentials](#configuring-credentials) section.

GitHub Actions Importer uses the following environment variables to connect to your Jenkins instance:

* `GITHUB_ACCESS_TOKEN`: The personal access token (classic) used to create pull requests with a converted workflow (requires `repo` and `workflow` scopes).

* `GITHUB_INSTANCE_URL`: The URL to the target GitHub instance (for example, `https://github.com`).

* `JENKINS_ACCESS_TOKEN`: The Jenkins API token used to view Jenkins resources.

  > \[!NOTE]
  > This token requires access to all jobs that you want to migrate or audit. In cases where a folder or job does not inherit access control lists from their parent, you must grant explicit permissions or full admin privileges.

* `JENKINS_USERNAME`: The username of the user account that created the Jenkins API token.

* `JENKINS_INSTANCE_URL`: The URL of the Jenkins instance.

* `JENKINSFILE_ACCESS_TOKEN` (Optional) The API token used to retrieve the contents of a `Jenkinsfile` stored in the build repository. This requires the `repo` scope. If this is not provided, the `GITHUB_ACCESS_TOKEN` will be used instead.

These environment variables can be specified in a `.env.local` file that is loaded by GitHub Actions Importer when it is run.

### Using optional arguments

There are optional arguments you can use with the GitHub Actions Importer subcommands to customize your migration.

#### `--source-file-path`

You can use the `--source-file-path` argument with the `forecast`, `dry-run`, or `migration` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from source control. The `--source-file-path` argument tells GitHub Actions Importer to use the specified source file path instead. You can use this option for Jenkinsfile and multibranch pipelines.

If you would like to supply multiple source files when running the `forecast` subcommand, you can use pattern matching in the file path value. For example, `gh forecast --source-file-path ./tmp/previous_forecast/jobs/*.json` supplies GitHub Actions Importer with any source files that match the `./tmp/previous_forecast/jobs/*.json` file path.

##### Jenkinsfile pipeline example

In this example, GitHub Actions Importer uses the specified Jenkinsfile as the source file to perform a dry run.

```shell
gh actions-importer dry-run jenkins --output-dir path/to/output/ --source-file-path path/to/Jenkinsfile --source-url :url_to_jenkins_job
```

#### `--config-file-path`

You can use the `--config-file-path` argument with the `audit`, `dry-run`, and `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from source control. The `--config-file-path` argument tells GitHub Actions Importer to use the specified source files instead.

When you use the `--config-file-path` option with the `dry-run` or `migrate` subcommands, GitHub Actions Importer matches the repository slug to the job represented by the `--source-url` option to select the pipeline. It uses the `config-file-path` to pull the specified source file.

##### Audit example

In this example, GitHub Actions Importer uses the specified YAML configuration file to perform an audit.

```shell
gh actions-importer audit jenkins --output-dir path/to/output/ --config-file-path path/to/jenkins/config.yml
```

To audit a Jenkins instance using a config file, the config file must be in the following format, and each `repository_slug` value must be unique:

```yaml
source_files:
  - repository_slug: pipeline-name
    path: path/to/Jenkinsfile
  - repository_slug: multi-branch-pipeline-name
    branches:
      - branch: main
        path: path/to/Jenkinsfile
      - branch: node
        path: path/to/Jenkinsfile
```

### Supported syntax for Jenkins pipelines

The following tables show the type of properties GitHub Actions Importer is currently able to convert. For more details about how Jenkins pipeline syntax aligns with GitHub Actions, see [Migrating from Jenkins to GitHub Actions](/en/actions/migrating-to-github-actions/manually-migrating-to-github-actions/migrating-from-jenkins-to-github-actions).

For information about supported Jenkins plugins, see the [`github/gh-actions-importer` repository](https://github.com/github/gh-actions-importer/blob/main/docs/jenkins/index.md).

#### Supported syntax for Freestyle pipelines

| Jenkins           | GitHub Actions            | Status              |
| :---------------- | :------------------------ | :------------------ |
| docker template   | `jobs.<job_id>.container` | Supported           |
| build             | `jobs`                    | Partially supported |
| build environment | `env`                     | Partially supported |
| build triggers    | `on`                      | Partially supported |
| general           | `runners`                 | Partially supported |

#### Supported syntax for Jenkinsfile pipelines

| Jenkins     | GitHub Actions                  | Status              |
| :---------- | :------------------------------ | :------------------ |
| docker      | `jobs.<job_id>.container`       | Supported           |
| stage       | `jobs.<job_id>`                 | Supported           |
| agent       | `runners`                       | Partially supported |
| environment | `env`                           | Partially supported |
| stages      | `jobs`                          | Partially supported |
| steps       | `jobs.<job_id>.steps`           | Partially supported |
| triggers    | `on`                            | Partially supported |
| when        | `jobs.<job_id>.if`              | Partially supported |
| inputs      | `inputs`                        | Unsupported         |
| matrix      | `jobs.<job_id>.strategy.matrix` | Unsupported         |
| options     | `jobs.<job_id>.strategy`        | Unsupported         |
| parameters  | `inputs`                        | Unsupported         |

### Environment variables syntax

GitHub Actions Importer uses the mapping in the table below to convert default Jenkins environment variables to the closest equivalent in GitHub Actions.

| Jenkins           | GitHub Actions                                                                        |
| :---------------- | :------------------------------------------------------------------------------------ |
| `${BUILD_ID}`     | `${{ github.run_id }}`                                                                |
| `${BUILD_NUMBER}` | `${{ github.run_id }}`                                                                |
| `${BUILD_TAG}`    | `${{ github.workflow }}-${{ github.run_id }}`                                         |
| `${BUILD_URL}`    | `${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}` |
| `${JENKINS_URL}`  | `${{ github.server_url }}`                                                            |
| `${JOB_NAME}`     | `${{ github.workflow }}`                                                              |
| `${WORKSPACE}`    | `${{ github.workspace }}`                                                             |

## Legal notice

Portions have been adapted from <https://github.com/github/gh-actions-importer/> under the MIT license:

```text
MIT License

Copyright (c) 2022 GitHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
---

# Migrating from Travis CI with GitHub Actions Importer

Learn how to use GitHub Actions Importer to automate the migration of your Travis CI pipelines to GitHub Actions.

## About migrating from Travis CI with GitHub Actions Importer

The instructions below will guide you through configuring your environment to use GitHub Actions Importer to migrate Travis CI pipelines to GitHub Actions.

### Prerequisites

* A Travis CI account or organization with pipelines and jobs that you want to convert to GitHub Actions workflows.
* Access to create a Travis CI API access token for your account or organization.
* An environment where you can run Linux-based containers, and can install the necessary tools.
  * Docker is [installed](https://docs.docker.com/get-docker/) and running.

  * [GitHub CLI](https://cli.github.com) is installed.
  > \[!NOTE]
  > The GitHub Actions Importer container and CLI do not need to be installed on the same server as your CI platform.

### Limitations

There are some limitations when migrating from Travis CI pipelines to GitHub Actions with GitHub Actions Importer.

#### Manual tasks

Certain Travis CI constructs must be migrated manually. These include:

* Secrets
* Unknown job properties

For more information on manual migrations, see [Migrating from Travis CI to GitHub Actions](/en/actions/migrating-to-github-actions/manually-migrating-to-github-actions/migrating-from-travis-ci-to-github-actions).

#### Travis CI project languages

GitHub Actions Importer transforms Travis CI project languages by adding a set of preconfigured build tools and a default build script to the transformed workflow. If no language is explicitly declared, GitHub Actions Importer assumes a project language is Ruby.

For a list of the project languages supported by GitHub Actions Importer, see [Supported project languages](#supported-project-languages).

## Installing the GitHub Actions Importer CLI extension

1. Install the GitHub Actions Importer CLI extension:

   ```bash copy
   gh extension install github/gh-actions-importer
   ```

2. Verify that the extension is installed:

   ```bash
   $ gh actions-importer -h
   Options:
     -?, -h, --help  Show help and usage information

   Commands:
     update     Update to the latest version of GitHub Actions Importer.
     version    Display the version of GitHub Actions Importer.
     configure  Start an interactive prompt to configure credentials used to authenticate with your CI server(s).
     audit      Plan your CI/CD migration by analyzing your current CI/CD footprint.
     forecast   Forecast GitHub Actions usage from historical pipeline utilization.
     dry-run    Convert a pipeline to a GitHub Actions workflow and output its yaml file.
     migrate    Convert a pipeline to a GitHub Actions workflow and open a pull request with the changes.
   ```

## Configuring credentials

The `configure` CLI command is used to set required credentials and options for GitHub Actions Importer when working with Travis CI and GitHub.

1. Create a GitHub personal access token (classic). For more information, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic).

   Your token must have the `workflow` scope.

   After creating the token, copy it and save it in a safe location for later use.

2. Create a Travis CI API access token. For more information, see [Get your Travis CI API token](https://docs.travis-ci.com/user/migrate/travis-migrate-to-apps-gem-guide/#4-get-your-travis-ci-api-token) in the Travis CI documentation.

   After creating the token, copy it and save it in a safe location for later use.

3. In your terminal, run the GitHub Actions Importer `configure` CLI command:

   ```shell
   gh actions-importer configure
   ```

   The `configure` command will prompt you for the following information:

   * For "Which CI providers are you configuring?", use the arrow keys to select `Travis CI`, press <kbd>Space</kbd> to select it, then press <kbd>Enter</kbd>.
   * For "Personal access token for GitHub", enter the value of the personal access token (classic) that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the GitHub instance", press <kbd>Enter</kbd> to accept the default value (`https://github.com`).
   * For "Personal access token for Travis CI", enter the value for the Travis CI API access token that you created earlier, and press <kbd>Enter</kbd>.
   * For "Base url of the Travis CI instance", enter the URL of your Travis CI instance, and press <kbd>Enter</kbd>.
   * For "Travis CI organization name", enter the name of your Travis CI organization, and press <kbd>Enter</kbd>.

   An example of the output of the `configure` command is shown below.

   ```shell
   $ gh actions-importer configure
   ✔ Which CI providers are you configuring?: Travis CI
   Enter the following values (leave empty to omit):
   ✔ Personal access token for GitHub: ***************
   ✔ Base url of the GitHub instance: https://github.com
   ✔ Personal access token for Travis CI: ***************
   ✔ Base url of the Travis CI instance: https://travis-ci.com
   ✔ Travis CI organization name: actions-importer-labs
   Environment variables successfully updated.
   ```

4. In your terminal, run the GitHub Actions Importer `update` CLI command to connect to GitHub Packages Container registry and ensure that the container image is updated to the latest version:

   ```shell
   gh actions-importer update
   ```

   The output of the command should be similar to below:

   ```shell
   Updating ghcr.io/actions-importer/cli:latest...
   ghcr.io/actions-importer/cli:latest up-to-date
   ```

## Perform an audit of Travis CI

You can use the `audit` command to get a high-level view of all pipelines in a Travis CI server.

The `audit` command performs the following steps:

1. Fetches all of the projects defined in a Travis CI server.
2. Converts each pipeline to its equivalent GitHub Actions workflow.
3. Generates a report that summarizes how complete and complex of a migration is possible with GitHub Actions Importer.

### Running the audit command

To perform an audit of a Travis CI server, run the following command in your terminal:

```shell
gh actions-importer audit travis-ci --output-dir tmp/audit
```

### Inspecting the audit results

The files in the specified output directory contain the results of the audit. See the `audit_summary.md` file for a summary of the audit results.

The audit summary has the following sections.

#### Pipelines

The "Pipelines" section contains a high-level statistics regarding the conversion rate done by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Pipelines" section:

* **Successful** pipelines had 100% of the pipeline constructs and individual items converted automatically to their GitHub Actions equivalent.
* **Partially successful** pipelines had all of the pipeline constructs converted, however, there were some individual items that were not converted automatically to their GitHub Actions equivalent.
* **Unsupported** pipelines are definition types that are not supported by GitHub Actions Importer.
* **Failed** pipelines encountered a fatal error when being converted. This can occur for one of three reasons:
  * The pipeline was originally misconfigured and not valid.
  * GitHub Actions Importer encountered an internal error when converting it.
  * There was an unsuccessful network response that caused the pipeline to be inaccessible, which is often due to invalid credentials.

#### Build steps

The "Build steps" section contains an overview of individual build steps that are used across all pipelines, and how many were automatically converted by GitHub Actions Importer.

Listed below are some key terms that can appear in the "Build steps" section:

* A **known** build step is a step that was automatically converted to an equivalent action.
* An **unknown** build step is a step that was not automatically converted to an equivalent action.
* An **unsupported** build step is a step that is either:
  * Fundamentally not supported by GitHub Actions.
  * Configured in a way that is incompatible with GitHub Actions.
* An **action** is a list of the actions that were used in the converted workflows. This can be important for:
  * If you use GitHub Enterprise Server, gathering the list of actions to sync to your instance.
  * Defining an organization-level allowlist of actions that are used. This list of actions is a comprehensive list of actions that your security or compliance teams may need to review.

#### Manual tasks

The "Manual tasks" section contains an overview of tasks that GitHub Actions Importer is not able to complete automatically, and that you must complete manually.

Listed below are some key terms that can appear in the "Manual tasks" section:

* A **secret** is a repository or organization-level secret that is used in the converted pipelines. These secrets must be created manually in GitHub Actions for these pipelines to function properly. For more information, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).
* A **self-hosted runner** refers to a label of a runner that is referenced in a converted pipeline that is not a GitHub-hosted runner. You will need to manually define these runners for these pipelines to function properly.

#### Files

The final section of the audit report provides a manifest of all the files that were written to disk during the audit.

Each pipeline file has a variety of files included in the audit, including:

* The original pipeline as it was defined in GitHub.
* Any network responses used to convert the pipeline.
* The converted workflow file.
* Stack traces that can be used to troubleshoot a failed pipeline conversion.

Additionally, the `workflow_usage.csv` file contains a comma-separated list of all actions, secrets, and runners that are used by each successfully converted pipeline. This can be useful for determining which workflows use which actions, secrets, or runners, and can be useful for performing security reviews.

## Forecast potential build runner usage

You can use the `forecast` command to forecast potential GitHub Actions usage by computing metrics from completed pipeline runs in your Travis CI server.

### Running the forecast command

To perform a forecast of potential GitHub Actions usage, run the following command in your terminal. By default, GitHub Actions Importer includes the previous seven days in the forecast report.

```shell
gh actions-importer forecast travis-ci --output-dir tmp/forecast
```

### Inspecting the forecast report

The `forecast_report.md` file in the specified output directory contains the results of the forecast.

Listed below are some key terms that can appear in the forecast report:

* The **job count** is the total number of completed jobs.
* The **pipeline count** is the number of unique pipelines used.
* **Execution time** describes the amount of time a runner spent on a job. This metric can be used to help plan for the cost of GitHub-hosted runners.
  * This metric is correlated to how much you should expect to spend in GitHub Actions. This will vary depending on the hardware used for these minutes. You can use the [GitHub Actions pricing calculator](https://github.com/pricing/calculator) to estimate the costs.
* **Queue time** metrics describe the amount of time a job spent waiting for a runner to be available to execute it.
* **Concurrent jobs** metrics describe the amount of jobs running at any given time. This metric can be used to define the number of runners you should configure.

Additionally, these metrics are defined for each queue of runners in Travis CI. This is especially useful if there is a mix of hosted or self-hosted runners, or high or low spec machines, so you can see metrics specific to different types of runners.

## Perform a dry-run migration of a Travis CI pipeline

You can use the `dry-run` command to convert a Travis CI pipeline to an equivalent GitHub Actions workflow. A dry-run creates the output files in a specified directory, but does not open a pull request to migrate the pipeline.

To perform a dry run of migrating your Travis CI pipelines to GitHub Actions, run the following command in your terminal, replacing `my-travis-ci-repository` with the name of your Travis CI repository.

```shell
gh actions-importer dry-run travis-ci --travis-ci-repository my-travis-ci-repository --output-dir tmp/dry-run
```

You can view the logs of the dry run and the converted workflow files in the specified output directory.

If there is anything that GitHub Actions Importer was not able to convert automatically, such as unknown build steps or a partially successful pipeline, you might want to create custom transformers to further customize the conversion process. For more information, see [Extending GitHub Actions Importer with custom transformers](/en/actions/migrating-to-github-actions/automated-migrations/extending-github-actions-importer-with-custom-transformers).

## Perform a production migration of a Travis CI pipeline

You can use the `migrate` command to convert a Travis CI pipeline and open a pull request with the equivalent GitHub Actions workflow.

### Running the migrate command

To migrate a Travis CI pipeline to GitHub Actions, run the following command in your terminal, replacing the `target-url` value with the URL for your GitHub repository, and `my-travis-ci-repository` with the name of your Travis CI repository.

```shell
gh actions-importer migrate travis-ci --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate --travis-ci-repository my-travis-ci-repository
```

The command's output includes the URL to the pull request that adds the converted workflow to your repository. An example of a successful output is similar to the following:

```shell
$ gh actions-importer migrate travis-ci --target-url https://github.com/octo-org/octo-repo --output-dir tmp/migrate --travis-ci-repository my-travis-ci-repository
[2022-08-20 22:08:20] Logs: 'tmp/migrate/log/actions-importer-20220916-014033.log'
[2022-08-20 22:08:20] Pull request: 'https://github.com/octo-org/octo-repo/pull/1'
```

### Inspecting the pull request

The output from a successful run of the `migrate` command contains a link to the new pull request that adds the converted workflow to your repository.

Some important elements of the pull request include:

* In the pull request description, a section called **Manual steps**, which lists steps that you must manually complete before you can finish migrating your pipelines to GitHub Actions. For example, this section might tell you to create any secrets used in your workflows.
* The converted workflows file. Select the **Files changed** tab in the pull request to view the workflow file that will be added to your GitHub repository.

When you are finished inspecting the pull request, you can merge it to add the workflow to your GitHub repository.

## Reference

This section contains reference information on environment variables, optional arguments, and supported syntax when using GitHub Actions Importer to migrate from Travis CI.

### Using environment variables

GitHub Actions Importer uses environment variables for its authentication configuration. These variables are set when following the configuration process using the `configure` command. For more information, see the [Configuring credentials](#configuring-credentials) section.

GitHub Actions Importer uses the following environment variables to connect to your Travis CI instance:

* `GITHUB_ACCESS_TOKEN`: The personal access token (classic) used to create pull requests with a converted workflow (requires the `workflow` scope).
* `GITHUB_INSTANCE_URL`: The URL to the target GitHub instance (for example, `https://github.com`).
* `TRAVIS_CI_ACCESS_TOKEN`: The Travis CI API access token used to view Travis CI resources.
* `TRAVIS_CI_ORGANIZATION`: The organization name of your Travis CI instance.
* `TRAVIS_CI_INSTANCE_URL`: The URL of the Travis CI instance.
* `TRAVIS_CI_SOURCE_GITHUB_ACCESS_TOKEN`: (Optional) The personal access token used to authenticate with your source GitHub instance. If not provided, `GITHUB_ACCESS_TOKEN` will be used instead.
* `TRAVIS_CI_SOURCE_GITHUB_INSTANCE_URL`: (Optional) The URL to the source GitHub instance, such as <https://github.com>. If not provided, `GITHUB_INSTANCE_URL` will be used instead.

These environment variables can be specified in a `.env.local` file that is loaded by GitHub Actions Importer when it is run.

### Using optional arguments

There are optional arguments you can use with the GitHub Actions Importer subcommands to customize your migration.

#### `--source-file-path`

You can use the `--source-file-path` argument with the `forecast`, `dry-run`, or `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from source control. The `--source-file-path` argument tells GitHub Actions Importer to use the specified source file path instead.

For example:

```shell
gh actions-importer dry-run travis-ci --output-dir ./path/to/output/ --travis-ci-repository my-travis-ci-repository --source-file-path ./path/to/.travis.yml
```

#### `--allow-inactive-repositories`

You can use this argument to specify whether GitHub Actions Importer should include inactive repositories in an audit. If this option is not set, inactive repositories are not included in audits.

```shell
gh actions-importer dry-run travis-ci --output-dir ./path/to/output/ --travis-ci-repository my-travis-ci-repository --allow-inactive-repositories
```

#### `--config-file-path`

You can use the `--config-file-path` argument with the `audit`, `dry-run`, and `migrate` subcommands.

By default, GitHub Actions Importer fetches pipeline contents from source control. The `--config-file-path` argument tells GitHub Actions Importer to use the specified source files instead.

##### Audit example

In this example, GitHub Actions Importer uses the specified YAML configuration file to perform an audit.

```shell
gh actions-importer audit travis-ci --output-dir ./path/to/output/ --config-file-path ./path/to/travis-ci/config.yml
```

To audit a Travis CI instance using a configuration file, the file must be in the following format and each `repository_slug` value must be unique:

```yaml
source_files:
  - repository_slug: travis-org-name/travis-repo-name
    path: path/to/.travis.yml
  - repository_slug: travis-org-name/some-other-travis-repo-name
    path: path/to/.travis.yml
```

##### Dry run example

In this example, GitHub Actions Importer uses the specified YAML configuration file as the source file to perform a dry run.

The pipeline is selected by matching the `repository_slug` in the configuration file to the value of the `--travis-ci-repository` option. The `path` is then used to pull the specified source file.

```shell
gh actions-importer dry-run travis-ci --travis-ci-repository travis-org-name/travis-repo-name --output-dir ./output/ --config-file-path ./path/to/travis-ci/config.yml
```

### Supported project languages

GitHub Actions Importer supports migrating Travis CI projects in the following languages.

<ul style="-webkit-column-count: 3; -moz-column-count: 3; column-count: 3;">
<li><code>android</code></li>
<li><code>bash</code></li>
<li><code>c</code></li>
<li><code>clojure</code></li>
<li><code>c++</code></li>
<li><code>crystal</code></li>
<li><code>c#</code></li>
<li><code>d</code></li>
<li><code>dart</code></li>
<li><code>elixir</code></li>
<li><code>erlang</code></li>
<li><code>generic</code></li>
<li><code>go</code></li>
<li><code>groovy</code></li>
<li><code>haskell</code></li>
<li><code>haxe</code></li>
<li><code>java</code></li>
<li><code>julia</code></li>
<li><code>matlab</code></li>
<li><code>minimal</code></li>
<li><code>nix</code></li>
<li><code>node_js</code></li>
<li><code>objective-c</code></li>
<li><code>perl</code></li>
<li><code>perl6</code></li>
<li><code>php</code></li>
<li><code>python</code></li>
<li><code>r</code></li>
<li><code>ruby</code></li>
<li><code>rust</code></li>
<li><code>scala</code></li>
<li><code>sh</code></li>
<li><code>shell</code></li>
<li><code>smalltalk</code></li>
<li><code>swift</code></li>
</ul>

### Supported syntax for Travis CI pipelines

The following table shows the type of properties GitHub Actions Importer is currently able to convert. For more details about how Travis CI pipeline syntax aligns with GitHub Actions, see [Migrating from Travis CI to GitHub Actions](/en/actions/migrating-to-github-actions/manually-migrating-to-github-actions/migrating-from-travis-ci-to-github-actions).

| Travis CI             | GitHub Actions                                                                                                           |              Status |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------- | ------------------: |
| branches              | <ul><li>`on.<push>.<branches>`</li>                                                                                      |           Supported |
| build\_pull\_requests | <ul><li>`on.<pull_request>`</li>                                                                                         |           Supported |
| env                   | <ul><li>`env`</li> <li>`jobs.<job_id>.env`</li><li>`jobs.<job_id>.steps.env`</li>                                        |           Supported |
| if                    | <ul><li>`jobs.<job_id>.if`</li></ul>                                                                                     |           Supported |
| job                   | <ul><li>`jobs.<job_id>`</li><li>`jobs.<job_id>.name`</li></ul>                                                           |           Supported |
| matrix                | <ul><li>`jobs.<job_id>.strategy`</li><li>`jobs.<job_id>.strategy.fail-fast`</li><li>`jobs.<job_id>.strategy.matrix`</li> |           Supported |
| os & dist             | <ul><li>`runners`</li></ul>                                                                                              |           Supported |
| scripts               | <ul><li>`jobs.<job_id>.steps`</li></ul>                                                                                  |           Supported |
| stages                | <ul><li>`jobs`</li></ul>                                                                                                 |           Supported |
| env                   | <ul><li>`on`</li>                                                                                                        | Partially supported |
| branches              | <ul><li>`on.<push>.<tags>`</li><li>`on.<push>.paths`</li>                                                                |         Unsupported |
| build\_pull\_requests | <ul><li>`on.<pull_request>.<branches>`</li><li>`on.<pull_request>.<tags>`</li><li>`on.<pull_request>.paths`</li>         |         Unsupported |
| cron triggers         | <ul><li>`on.schedule`</li><li>`on.workflow_run`</li></ul>                                                                |         Unsupported |
| env                   | <ul><li>`jobs.<job_id>.timeout-minutes`</li><li>`on.<event_name>.types`</li>                                             |         Unsupported |
| job                   | <ul><li>`jobs.<job_id>.container`</li>                                                                                   |         Unsupported |
| os & dist             | <ul><li>`self hosted runners`</li></ul>                                                                                  |         Unsupported |

For information about supported Travis CI constructs, see the [`github/gh-actions-importer` repository](https://github.com/github/gh-actions-importer/blob/main/docs/travis_ci/index.md).

### Environment variables syntax

GitHub Actions Importer uses the mapping in the table below to convert default Travis CI environment variables to the closest equivalent in GitHub Actions.

| Travis CI                     | GitHub Actions                                                                        |
| :---------------------------- | :------------------------------------------------------------------------------------ |
| `$CONTINUOUS_INTEGRATION`     | `$CI`                                                                                 |
| `$USER`                       | `${{ github.actor }}`                                                                 |
| `$HOME`                       | `${{ github.workspace }}`                                                             |
| `$TRAVIS_BRANCH`              | `${{ github.ref }}`                                                                   |
| `$TRAVIS_BUILD_DIR`           | `${{ github.workspace }}`                                                             |
| `$TRAVIS_BUILD_ID`            | `${{ github.run_number }}`                                                            |
| `$TRAVIS_BUILD_NUMBER`        | `${{ github.run_id }}`                                                                |
| `$TRAVIS_COMMIT`              | `${{ github.sha }}`                                                                   |
| `$TRAVIS_EVENT_TYPE`          | `${{ github.event_name }}`                                                            |
| `$TRAVIS_PULL_REQUEST_BRANCH` | `${{ github.base_ref }}`                                                              |
| `$TRAVIS_PULL_REQUEST`        | `${{ github.event.number }}`                                                          |
| `$TRAVIS_PULL_REQUEST_SHA`    | `${{ github.head.sha }}`                                                              |
| `$TRAVIS_PULL_REQUEST_SLUG`   | `${{ github.repository }}`                                                            |
| `$TRAVIS_TAG`                 | `${{ github.ref }}`                                                                   |
| `$TRAVIS_OS_NAME`             | `${{ runner.os }}`                                                                    |
| `$TRAVIS_JOB_ID`              | `${{ github.job }}`                                                                   |
| `$TRAVIS_REPO_SLUG`           | `${{ github.repository_owner/github.repository }}`                                    |
| `$TRAVIS_BUILD_WEB_URL`       | `${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}` |

## Legal notice

Portions have been adapted from <https://github.com/github/gh-actions-importer/> under the MIT license:

```text
MIT License

Copyright (c) 2022 GitHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
---

# Automating migration with GitHub Actions Importer

Use GitHub Actions Importer to plan and automate your migration to GitHub Actions.

## About GitHub Actions Importer

You can use GitHub Actions Importer to plan and automatically migrate your CI/CD supported pipelines to GitHub Actions.

GitHub Actions Importer is distributed as a Docker container, and uses a [GitHub CLI](https://cli.github.com) extension to interact with the container.

Any workflow that is converted by the GitHub Actions Importer should be inspected for correctness before using it as a production workload. The goal is to achieve an 80% conversion rate for every workflow, however, the actual conversion rate will depend on the makeup of each individual pipeline that is converted.

## Supported CI platforms

You can use GitHub Actions Importer to migrate from the following platforms:

* Azure DevOps
* Bamboo
* Bitbucket Pipelines
* CircleCI
* GitLab (both cloud and self-hosted)
* Jenkins
* Travis CI

## Prerequisites

GitHub Actions Importer has the following requirements:

* An environment where you can run Linux-based containers, and can install the necessary tools.
  * Docker is [installed](https://docs.docker.com/get-docker/) and running.

  * [GitHub CLI](https://cli.github.com) is installed.
  > \[!NOTE]
  > The GitHub Actions Importer container and CLI do not need to be installed on the same server as your CI platform.

### Installing the GitHub Actions Importer CLI extension

1. Install the GitHub Actions Importer CLI extension:

   ```bash copy
   gh extension install github/gh-actions-importer
   ```

2. Verify that the extension is installed:

   ```bash
   $ gh actions-importer -h
   Options:
     -?, -h, --help  Show help and usage information

   Commands:
     update     Update to the latest version of GitHub Actions Importer.
     version    Display the version of GitHub Actions Importer.
     configure  Start an interactive prompt to configure credentials used to authenticate with your CI server(s).
     audit      Plan your CI/CD migration by analyzing your current CI/CD footprint.
     forecast   Forecast GitHub Actions usage from historical pipeline utilization.
     dry-run    Convert a pipeline to a GitHub Actions workflow and output its yaml file.
     migrate    Convert a pipeline to a GitHub Actions workflow and open a pull request with the changes.
   ```

### Updating the GitHub Actions Importer CLI

To ensure you're running the latest version of GitHub Actions Importer, you should regularly run the `update` command:

```bash
gh actions-importer update
```

### Authenticating at the command line

You must configure credentials that allow GitHub Actions Importer to communicate with GitHub and your current CI server. You can configure these credentials using environment variables or a `.env.local` file. The environment variables can be configured in an interactive prompt, by running the following command:

```bash
gh actions-importer configure
```

## Using the GitHub Actions Importer CLI

Use the subcommands of `gh actions-importer` to begin your migration to GitHub Actions, including `audit`, `forecast`, `dry-run`, and `migrate`.

### Auditing your existing CI pipelines

The `audit` subcommand can be used to plan your CI/CD migration by analyzing your current CI/CD footprint. This analysis can be used to plan a timeline for migrating to GitHub Actions.

To run an audit, use the following command to determine your available options:

```bash
$ gh actions-importer audit -h
Description:
  Plan your CI/CD migration by analyzing your current CI/CD footprint.

[...]

Commands:
  azure-devops  An audit will output a list of data used in an Azure DevOps instance.
  bamboo        An audit will output a list of data used in a Bamboo instance.
  circle-ci     An audit will output a list of data used in a CircleCI instance.
  gitlab        An audit will output a list of data used in a GitLab instance.
  jenkins       An audit will output a list of data used in a Jenkins instance.
  travis-ci     An audit will output a list of data used in a Travis CI instance.
```

### Forecasting usage

The `forecast` subcommand reviews historical pipeline usage to create a forecast of GitHub Actions usage.

To run a forecast, use the following command to determine your available options:

```bash
$ gh actions-importer forecast -h
Description:
  Forecasts GitHub Actions usage from historical pipeline utilization.

[...]

Commands:
  azure-devops  Forecasts GitHub Actions usage from historical Azure DevOps pipeline utilization.
  bamboo        Forecasts GitHub Actions usage from historical Bamboo pipeline utilization.
  jenkins       Forecasts GitHub Actions usage from historical Jenkins pipeline utilization.
  gitlab        Forecasts GitHub Actions usage from historical GitLab pipeline utilization.
  circle-ci     Forecasts GitHub Actions usage from historical CircleCI pipeline utilization.
  travis-ci     Forecasts GitHub Actions usage from historical Travis CI pipeline utilization.
  github        Forecasts GitHub Actions usage from historical GitHub pipeline utilization.
```

### Testing the migration process

The `dry-run` subcommand can be used to convert a pipeline to its GitHub Actions equivalent, and then write the workflow to your local filesystem.

To perform a dry run, use the following command to determine your available options:

```bash
$ gh actions-importer dry-run -h
Description:
  Convert a pipeline to a GitHub Actions workflow and output its yaml file.

[...]

Commands:
  azure-devops  Convert an Azure DevOps pipeline to a GitHub Actions workflow and output its yaml file.
  bamboo        Convert a Bamboo pipeline to GitHub Actions workflows and output its yaml file.
  circle-ci     Convert a CircleCI pipeline to GitHub Actions workflows and output the yaml file(s).
  gitlab        Convert a GitLab pipeline to a GitHub Actions workflow and output the yaml file.
  jenkins       Convert a Jenkins job to a GitHub Actions workflow and output its yaml file.
  travis-ci     Convert a Travis CI pipeline to a GitHub Actions workflow and output its yaml file.
```

### Migrating a pipeline to GitHub Actions

The `migrate` subcommand can be used to convert a pipeline to its GitHub Actions equivalent and then create a pull request with the contents.

To run a migration, use the following command to determine your available options:

```bash
$ gh actions-importer migrate -h
Description:
  Convert a pipeline to a GitHub Actions workflow and open a pull request with the changes.

[...]

Commands:
  azure-devops  Convert an Azure DevOps pipeline to a GitHub Actions workflow and open a pull request with the changes.
  bamboo        Convert a Bamboo pipeline to GitHub Actions workflows and open a pull request with the changes.
  circle-ci     Convert a CircleCI pipeline to GitHub Actions workflows and open a pull request with the changes.
  gitlab        Convert a GitLab pipeline to a GitHub Actions workflow and open a pull request with the changes.
  jenkins       Convert a Jenkins job to a GitHub Actions workflow and open a pull request with the changes.
  travis-ci     Convert a Travis CI pipeline to a GitHub Actions workflow and open a pull request with the changes.
```

## Performing self-serve migrations using IssueOps

You can use GitHub Actions and GitHub Issues to run CLI commands for GitHub Actions Importer. This allows you to migrate your CI/CD workflows without installing software on your local machine. This approach is especially useful for organizations that want to enable self-service migrations to GitHub Actions. Once IssueOps is configured, users can open an issue with the relevant template to migrate pipelines to GitHub Actions.

For more information about setting up self-serve migrations with IssueOps, see the [`actions/importer-issue-ops`](https://github.com/actions/importer-issue-ops) template repository.

## Using the GitHub Actions Importer labs repository

The GitHub Actions Importer labs repository contains platform-specific learning paths that teach you how to use GitHub Actions Importer and how to approach migrations to GitHub Actions. You can use this repository to learn how to use GitHub Actions Importer to help plan, forecast, and automate your migration to GitHub Actions.

To learn more, see the [GitHub Actions Importer labs repository](https://github.com/actions/importer-labs/tree/main#readme).

## Legal notice

Portions have been adapted from <https://github.com/github/gh-actions-importer/> under the MIT license:

```text
MIT License

Copyright (c) 2022 GitHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
---

# Migrating from Azure Pipelines to GitHub Actions

GitHub Actions and Azure Pipelines share several configuration similarities, which makes migrating to GitHub Actions relatively straightforward.

## Introduction

Azure Pipelines and GitHub Actions both allow you to create workflows that automatically build, test, publish, release, and deploy code. Azure Pipelines and GitHub Actions share some similarities in workflow configuration:

* Workflow configuration files are written in YAML and are stored in the code's repository.
* Workflows include one or more jobs.
* Jobs include one or more steps or individual commands.
* Steps or tasks can be reused and shared with the community.

For more information, see [Understanding GitHub Actions](/en/actions/learn-github-actions/understanding-github-actions).

## Key differences

When migrating from Azure Pipelines, consider the following differences:

* Azure Pipelines supports a legacy *classic editor*, which lets you define your CI configuration in a GUI editor instead of creating the pipeline definition in a YAML file. GitHub Actions uses YAML files to define workflows and does not support a graphical editor.
* Azure Pipelines allows you to omit some structure in job definitions. For example, if you only have a single job, you don't need to define the job and only need to define its steps. GitHub Actions requires explicit configuration, and YAML structure cannot be omitted.
* Azure Pipelines supports *stages* defined in the YAML file, which can be used to create deployment workflows. GitHub Actions requires you to separate stages into separate YAML workflow files.
* On-premises Azure Pipelines build agents can be selected with capabilities. GitHub Actions self-hosted runners can be selected with labels.

## Migrating jobs and steps

Jobs and steps in Azure Pipelines are very similar to jobs and steps in GitHub Actions. In both systems, jobs have the following characteristics:

* Jobs contain a series of steps that run sequentially.
* Jobs run on separate virtual machines or in separate containers.
* Jobs run in parallel by default, but can be configured to run sequentially.

## Migrating script steps

You can run a script or a shell command as a step in a workflow. In Azure Pipelines, script steps can be specified using the `script` key, or with the `bash`, `powershell`, or `pwsh` keys. Scripts can also be specified as an input to the [Bash task](https://docs.microsoft.com/azure/devops/pipelines/tasks/utility/bash?view=azure-devops) or the [PowerShell task](https://docs.microsoft.com/azure/devops/pipelines/tasks/utility/powershell?view=azure-devops).

In GitHub Actions, all scripts are specified using the `run` key. To select a particular shell, you can specify the `shell` key when providing the script. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsrun).

Below is an example of the syntax for each system.

### Azure Pipelines syntax for script steps

```yaml
jobs:
  - job: scripts
    pool:
      vmImage: 'windows-latest'
    steps:
      - script: echo "This step runs in the default shell"
      - bash: echo "This step runs in bash"
      - pwsh: Write-Host "This step runs in PowerShell Core"
      - task: PowerShell@2
        inputs:
          script: Write-Host "This step runs in PowerShell"
```

### GitHub Actions syntax for script steps

```yaml
jobs:
  scripts:
    runs-on: windows-latest
    steps:
      - run: echo "This step runs in the default shell"
      - run: echo "This step runs in bash"
        shell: bash
      - run: Write-Host "This step runs in PowerShell Core"
        shell: pwsh
      - run: Write-Host "This step runs in PowerShell"
        shell: powershell
```

## Differences in script error handling

In Azure Pipelines, scripts can be configured to error if any output is sent to `stderr`. GitHub Actions does not support this configuration.

GitHub Actions configures shells to "fail fast" whenever possible, which stops the script immediately if one of the commands in a script exits with an error code. In contrast, Azure Pipelines requires explicit configuration to exit immediately on an error. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#exit-codes-and-error-action-preference).

## Differences in the default shell on Windows

In Azure Pipelines, the default shell for scripts on Windows platforms is the Command shell (*cmd.exe*). In GitHub Actions, the default shell for scripts on Windows platforms is PowerShell. PowerShell has several differences in built-in commands, variable expansion, and flow control.

If you're running a simple command, you might be able to run a Command shell script in PowerShell without any changes. But in most cases, you will either need to update your script with PowerShell syntax or instruct GitHub Actions to run the script with the Command shell instead of PowerShell. You can do this by specifying `shell` as `cmd`.

Below is an example of the syntax for each system.

### Azure Pipelines syntax using CMD by default

```yaml
jobs:
  - job: run_command
    pool:
      vmImage: 'windows-latest'
    steps:
      - script: echo "This step runs in CMD on Windows by default"
```

### GitHub Actions syntax for specifying CMD

```yaml
jobs:
  run_command:
    runs-on: windows-latest
    steps:
      - run: echo "This step runs in PowerShell on Windows by default"
      - run: echo "This step runs in CMD on Windows explicitly"
        shell: cmd
```

For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#using-a-specific-shell).

## Migrating conditionals and expression syntax

Azure Pipelines and GitHub Actions can both run steps conditionally. In Azure Pipelines, conditional expressions are specified using the `condition` key. In GitHub Actions, conditional expressions are specified using the `if` key.

Azure Pipelines uses functions within expressions to execute steps conditionally. In contrast, GitHub Actions uses an infix notation. For example, you must replace the `eq` function in Azure Pipelines with the `==` operator in GitHub Actions.

Below is an example of the syntax for each system.

### Azure Pipelines syntax for conditional expressions

```yaml
jobs:
  - job: conditional
    pool:
      vmImage: 'ubuntu-latest'
    steps:
      - script: echo "This step runs with str equals 'ABC' and num equals 123"
        condition: and(eq(variables.str, 'ABC'), eq(variables.num, 123))
```

### GitHub Actions syntax for conditional expressions

```yaml
jobs:
  conditional:
    runs-on: ubuntu-latest
    steps:
      - run: echo "This step runs with str equals 'ABC' and num equals 123"
        if: ${{ env.str == 'ABC' && env.num == 123 }}
```

For more information, see [Evaluate expressions in workflows and actions](/en/actions/learn-github-actions/expressions).

## Dependencies between jobs

Both Azure Pipelines and GitHub Actions allow you to set dependencies for a job. In both systems, jobs run in parallel by default, but job dependencies can be specified explicitly. In Azure Pipelines, this is done with the `dependsOn` key. In GitHub Actions, this is done with the `needs` key.

Below is an example of the syntax for each system. The workflows start a first job named `initial`, and when that job completes, two jobs named `fanout1` and `fanout2` will run. Finally, when those jobs complete, the job `fanin` will run.

### Azure Pipelines syntax for dependencies between jobs

```yaml
jobs:
  - job: initial
    pool:
      vmImage: 'ubuntu-latest'
    steps:
      - script: echo "This job will be run first."
  - job: fanout1
    pool:
      vmImage: 'ubuntu-latest'
    dependsOn: initial
    steps:
      - script: echo "This job will run after the initial job, in parallel with fanout2."
  - job: fanout2
    pool:
      vmImage: 'ubuntu-latest'
    dependsOn: initial
    steps:
      - script: echo "This job will run after the initial job, in parallel with fanout1."
  - job: fanin
    pool:
      vmImage: 'ubuntu-latest'
    dependsOn: [fanout1, fanout2]
    steps:
      - script: echo "This job will run after fanout1 and fanout2 have finished."
```

### GitHub Actions syntax for dependencies between jobs

```yaml
jobs:
  initial:
    runs-on: ubuntu-latest
    steps:
      - run: echo "This job will be run first."
  fanout1:
    runs-on: ubuntu-latest
    needs: initial
    steps:
      - run: echo "This job will run after the initial job, in parallel with fanout2."
  fanout2:
    runs-on: ubuntu-latest
    needs: initial
    steps:
      - run: echo "This job will run after the initial job, in parallel with fanout1."
  fanin:
    runs-on: ubuntu-latest
    needs: [fanout1, fanout2]
    steps:
      - run: echo "This job will run after fanout1 and fanout2 have finished."
```

For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idneeds).

## Migrating tasks to actions

Azure Pipelines uses *tasks*, which are application components that can be re-used in multiple workflows. GitHub Actions uses *actions*, which can be used to perform tasks and customize your workflow. In both systems, you can specify the name of the task or action to run, along with any required inputs as key/value pairs.

Below is an example of the syntax for each system.

### Azure Pipelines syntax for tasks

```yaml
jobs:
  - job: run_python
    pool:
      vmImage: 'ubuntu-latest'
    steps:
      - task: UsePythonVersion@0
        inputs:
          versionSpec: '3.7'
          architecture: 'x64'
      - script: python script.py
```

### GitHub Actions syntax for actions

```yaml
jobs:
  run_python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-python@v5
        with:
          python-version: '3.7'
          architecture: 'x64'
      - run: python script.py
```

You can find actions that you can use in your workflow in [GitHub Marketplace](https://github.com/marketplace?type=actions), or you can create your own actions. For more information, see [Reusing automations](/en/actions/creating-actions).
---

# Migrating from CircleCI to GitHub Actions

GitHub Actions and CircleCI share several similarities in configuration, which makes migration to GitHub Actions relatively straightforward.

## Introduction

CircleCI and GitHub Actions both allow you to create workflows that automatically build, test, publish, release, and deploy code. CircleCI and GitHub Actions share some similarities in workflow configuration:

* Workflow configuration files are written in YAML and stored in the repository.
* Workflows include one or more jobs.
* Jobs include one or more steps or individual commands.
* Steps or tasks can be reused and shared with the community.

For more information, see [Understanding GitHub Actions](/en/actions/learn-github-actions/understanding-github-actions).

## Key differences

When migrating from CircleCI, consider the following differences:

* CircleCI’s automatic test parallelism automatically groups tests according to user-specified rules or historical timing information. This functionality is not built into GitHub Actions.
* Actions that execute in Docker containers are sensitive to permissions problems since containers have a different mapping of users. You can avoid many of these problems by not using the `USER` instruction in your *Dockerfile*. For more information about the Docker filesystem on GitHub-hosted runners, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#docker-container-filesystem).

## Migrating workflows and jobs

CircleCI defines `workflows` in the *config.yml* file, which allows you to configure more than one workflow. GitHub requires one workflow file per workflow, and as a consequence, does not require you to declare `workflows`. You'll need to create a new workflow file for each workflow configured in *config.yml*.

Both CircleCI and GitHub Actions configure `jobs` in the configuration file using similar syntax. If you configure any dependencies between jobs using `requires` in your CircleCI workflow, you can use the equivalent GitHub Actions `needs` syntax. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idneeds).

## Migrating orbs to actions

Both CircleCI and GitHub Actions provide a mechanism to reuse and share tasks in a workflow. CircleCI uses a concept called orbs, written in YAML, to provide tasks that people can reuse in a workflow. GitHub Actions has powerful and flexible reusable components called actions, which you build with either JavaScript files or Docker images. You can create actions by writing custom code that interacts with your repository in any way you'd like, including integrating with GitHub's APIs and any publicly available third-party API. For example, an action can publish npm modules, send SMS alerts when urgent issues are created, or deploy production-ready code. For more information, see [Reusing automations](/en/actions/creating-actions).

CircleCI can reuse pieces of workflows with YAML anchors and aliases. GitHub Actions supports YAML anchors and aliases for reusability, and also provides matrices for running jobs with different configurations. For more information about matrices, see [Running variations of jobs in a workflow](/en/actions/using-jobs/using-a-matrix-for-your-jobs).

## Using Docker images

Both CircleCI and GitHub Actions support running steps inside of a Docker image.

CircleCI provides a set of pre-built images with common dependencies. These images have the `USER` set to `circleci`, which causes permissions to conflict with GitHub Actions.

We recommend that you move away from CircleCI's pre-built images when you migrate to GitHub Actions. In many cases, you can use actions to install the additional dependencies you need.

For more information about the Docker filesystem, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#docker-container-filesystem).

For more information about the tools and packages available on GitHub-hosted runner images, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-software).

## Using variables and secrets

CircleCI and GitHub Actions support setting variables in the configuration file and creating secrets using the CircleCI or GitHub UI.

For more information, see [Variables reference](/en/actions/reference/variables-reference#default-environment-variables) and [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

## Caching

CircleCI and GitHub Actions provide a method to manually cache files in the configuration file.

Below is an example of the syntax for each system.

### CircleCI syntax for caching

```yaml
- restore_cache:
    keys:
      - v1-npm-deps-{{ checksum "package-lock.json" }}
      - v1-npm-deps-
```

### GitHub Actions syntax for caching

```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: v1-npm-deps-${{ hashFiles('**/package-lock.json') }}
    restore-keys: v1-npm-deps-
```

GitHub Actions does not have an equivalent of CircleCI’s Docker Layer Caching (or DLC).

## Persisting data between jobs

Both CircleCI and GitHub Actions provide mechanisms to persist data between jobs.

Below is an example in CircleCI and GitHub Actions configuration syntax.

### CircleCI syntax for persisting data between jobs

```yaml
- persist_to_workspace:
    root: workspace
    paths:
      - math-homework.txt

...

- attach_workspace:
    at: /tmp/workspace
```

### GitHub Actions syntax for persisting data between jobs

```yaml
- name: Upload math result for job 1
  uses: actions/upload-artifact@v4
  with:
    name: homework
    path: math-homework.txt

...

- name: Download math result for job 1
  uses: actions/download-artifact@v5
  with:
    name: homework
```

For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

## Using databases and service containers

Both systems enable you to include additional containers for databases, caching, or other dependencies.

In CircleCI, the first image listed in the *config.yaml* is the primary image used to run commands. GitHub Actions uses explicit sections: use `container` for the primary container, and list additional containers in `services`.

Below is an example in CircleCI and GitHub Actions configuration syntax.

### CircleCI syntax for using databases and service containers

```yaml
---
version: 2.1

jobs:

  ruby-26:
    docker:
      - image: circleci/ruby:2.6.3-node-browsers-legacy
        environment:
          PGHOST: localhost
          PGUSER: administrate
          RAILS_ENV: test
      - image: postgres:10.1-alpine
        environment:
          POSTGRES_USER: administrate
          POSTGRES_DB: ruby26
          POSTGRES_PASSWORD: ""

    working_directory: ~/administrate

    steps:
      - checkout

      # Bundle install dependencies
      - run: bundle install --path vendor/bundle

      # Wait for DB
      - run: dockerize -wait tcp://localhost:5432 -timeout 1m

      # Setup the environment
      - run: cp .sample.env .env

      # Setup the database
      - run: bundle exec rake db:setup

      # Run the tests
      - run: bundle exec rake

workflows:
  version: 2
  build:
    jobs:
      - ruby-26
...

- attach_workspace:
    at: /tmp/workspace
```

### GitHub Actions syntax for using databases and service containers

<!-- markdownlint-disable search-replace -->

```yaml
name: Containers

on: [push]

jobs:
  build:

    runs-on: ubuntu-latest
    container: circleci/ruby:2.6.3-node-browsers-legacy

    env:
      PGHOST: postgres
      PGUSER: administrate
      RAILS_ENV: test

    services:
      postgres:
        image: postgres:10.1-alpine
        env:
          POSTGRES_USER: administrate
          POSTGRES_DB: ruby25
          POSTGRES_PASSWORD: ""
        ports:
          - 5432:5432
        # Add a health check
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
      # This Docker file changes sets USER to circleci instead of using the default user, so we need to update file permissions for this image to work on GH Actions.
      # See https://docs.github.com/actions/using-github-hosted-runners/about-github-hosted-runners#docker-container-filesystem

      - name: Setup file system permissions
        run: sudo chmod -R 777 $GITHUB_WORKSPACE /github /__w/_temp
      - uses: actions/checkout@v5
      - name: Install dependencies
        run: bundle install --path vendor/bundle
      - name: Setup environment configuration
        run: cp .sample.env .env
      - name: Setup database
        run: bundle exec rake db:setup
      - name: Run tests
        run: bundle exec rake
```

<!-- markdownlint-enable search-replace -->

For more information, see [Communicating with Docker service containers](/en/actions/using-containerized-services/about-service-containers).

## Complete Example

Below is a real-world example. The left shows the actual CircleCI *config.yml* for the [thoughtbot/administrator](https://github.com/thoughtbot/administrate) repository. The right shows the GitHub Actions equivalent.

### Complete example for CircleCI

```yaml
---
version: 2.1

commands:
  shared_steps:
    steps:
      - checkout

      # Restore Cached Dependencies
      - restore_cache:
          name: Restore bundle cache
          key: administrate-{{ checksum "Gemfile.lock" }}

      # Bundle install dependencies
      - run: bundle install --path vendor/bundle

      # Cache Dependencies
      - save_cache:
          name: Store bundle cache
          key: administrate-{{ checksum "Gemfile.lock" }}
          paths:
            - vendor/bundle

      # Wait for DB
      - run: dockerize -wait tcp://localhost:5432 -timeout 1m

      # Setup the environment
      - run: cp .sample.env .env

      # Setup the database
      - run: bundle exec rake db:setup

      # Run the tests
      - run: bundle exec rake

default_job: &default_job
  working_directory: ~/administrate
  steps:
    - shared_steps
    # Run the tests against multiple versions of Rails
    - run: bundle exec appraisal install
    - run: bundle exec appraisal rake

jobs:
  ruby-25:
    <<: *default_job
    docker:
      - image: circleci/ruby:2.5.0-node-browsers
        environment:
          PGHOST: localhost
          PGUSER: administrate
          RAILS_ENV: test
      - image: postgres:10.1-alpine
        environment:
          POSTGRES_USER: administrate
          POSTGRES_DB: ruby25
          POSTGRES_PASSWORD: ""

  ruby-26:
    <<: *default_job
    docker:
      - image: circleci/ruby:2.6.3-node-browsers-legacy
        environment:
          PGHOST: localhost
          PGUSER: administrate
          RAILS_ENV: test
      - image: postgres:10.1-alpine
        environment:
          POSTGRES_USER: administrate
          POSTGRES_DB: ruby26
          POSTGRES_PASSWORD: ""

workflows:
  version: 2
  multiple-rubies:
    jobs:
      - ruby-26
      - ruby-25
```

### Complete example for GitHub Actions

```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Containers

on: [push]

jobs:
  build:

    strategy:
      matrix:
        ruby: ['2.5', '2.6.3']

    runs-on: ubuntu-latest

    env:
      PGHOST: localhost
      PGUSER: administrate
      RAILS_ENV: test

    services:
      postgres:
        image: postgres:10.1-alpine
        env:
          POSTGRES_USER: administrate
          POSTGRES_DB: ruby25
          POSTGRES_PASSWORD: ""
        ports:
          - 5432:5432
        # Add a health check
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
      - uses: actions/checkout@v5
      - name: Setup Ruby
        uses: eregon/use-ruby-action@ec02537da5712d66d4d50a0f33b7eb52773b5ed1
        with:
          ruby-version: ${{ matrix.ruby }}
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: vendor/bundle
          key: administrate-${{ matrix.image }}-${{ hashFiles('Gemfile.lock') }}
      - name: Install postgres headers
        run: |
          sudo apt-get update
          sudo apt-get install libpq-dev
      - name: Install dependencies
        run: bundle install --path vendor/bundle
      - name: Setup environment configuration
        run: cp .sample.env .env
      - name: Setup database
        run: bundle exec rake db:setup
      - name: Run tests
        run: bundle exec rake
      - name: Install appraisal
        run: bundle exec appraisal install
      - name: Run appraisal
        run: bundle exec appraisal rake
```
---

# Migrating from GitLab CI/CD to GitHub Actions

GitHub Actions and GitLab CI/CD share several configuration similarities, which makes migrating to GitHub Actions relatively straightforward.

## Introduction

GitLab CI/CD and GitHub Actions both allow you to create workflows that automatically build, test, publish, release, and deploy code. GitLab CI/CD and GitHub Actions share some similarities in workflow configuration:

* Workflow configuration files are written in YAML and are stored in the code's repository.
* Workflows include one or more jobs.
* Jobs include one or more steps or individual commands.
* Jobs can run on either managed or self-hosted machines.

There are a few differences, and this guide will show you the important differences so that you can migrate your workflow to GitHub Actions.

## Jobs

Jobs in GitLab CI/CD are very similar to jobs in GitHub Actions. In both systems, jobs have the following characteristics:

* Jobs contain a series of steps or scripts that run sequentially.
* Jobs can run on separate machines or in separate containers.
* Jobs run in parallel by default, but can be configured to run sequentially.

You can run a script or a shell command in a job. In GitLab CI/CD, script steps are specified using the `script` key. In GitHub Actions, all scripts are specified using the `run` key.

Below is an example of the syntax for each system.

### GitLab CI/CD syntax for jobs

```yaml
job1:
  variables:
    GIT_CHECKOUT: "true"
  script:
    - echo "Run your script here"
```

### GitHub Actions syntax for jobs

```yaml
jobs:
  job1:
    steps:
      - uses: actions/checkout@v5
      - run: echo "Run your script here"
```

## Runners

Runners are machines on which the jobs run. Both GitLab CI/CD and GitHub Actions offer managed and self-hosted variants of runners. In GitLab CI/CD, `tags` are used to run jobs on different platforms, while in GitHub Actions it is done with the `runs-on` key.

Below is an example of the syntax for each system.

### GitLab CI/CD syntax for runners

```yaml
windows_job:
  tags:
    - windows
  script:
    - echo Hello, %USERNAME%!

linux_job:
  tags:
    - linux
  script:
    - echo "Hello, $USER!"
```

### GitHub Actions syntax for runners

```yaml
windows_job:
  runs-on: windows-latest
  steps:
    - run: echo Hello, %USERNAME%!

linux_job:
  runs-on: ubuntu-latest
  steps:
    - run: echo "Hello, $USER!"
```

For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idruns-on).

## Docker images

Both GitLab CI/CD and GitHub Actions support running jobs in a Docker image. In GitLab CI/CD, Docker images are defined with an `image` key, while in GitHub Actions it is done with the `container` key.

Below is an example of the syntax for each system.

### GitLab CI/CD syntax for Docker images

```yaml
my_job:
  image: node:20-bookworm-slim
```

### GitHub Actions syntax for Docker images

```yaml
jobs:
  my_job:
    container: node:20-bookworm-slim
```

For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idcontainer).

## Condition and expression syntax

GitLab CI/CD uses `rules` to determine if a job will run for a specific condition. GitHub Actions uses the `if` keyword to prevent a job from running unless a condition is met.

Below is an example of the syntax for each system.

### GitLab CI/CD syntax for conditions and expressions

```yaml
deploy_prod:
  stage: deploy
  script:
    - echo "Deploy to production server"
  rules:
    - if: '$CI_COMMIT_BRANCH == "master"'
```

### GitHub Actions syntax for conditions and expressions

```yaml
jobs:
  deploy_prod:
    if: contains( github.ref, 'master')
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to production server"
```

For more information, see [Evaluate expressions in workflows and actions](/en/actions/learn-github-actions/expressions).

## Dependencies between Jobs

Both GitLab CI/CD and GitHub Actions allow you to set dependencies for a job. In both systems, jobs run in parallel by default, but job dependencies in GitHub Actions can be specified explicitly with the `needs` key. GitLab CI/CD also has a concept of `stages`, where jobs in a stage run concurrently, but the next stage will start when all the jobs in the previous stage have completed. You can recreate this scenario in GitHub Actions with the `needs` key.

Below is an example of the syntax for each system. The workflows start with two jobs named `build_a` and `build_b` running in parallel, and when those jobs complete, another job called `test_ab` will run. Finally, when `test_ab` completes, the `deploy_ab` job will run.

### GitLab CI/CD syntax for dependencies between jobs

```yaml
stages:
  - build
  - test
  - deploy

build_a:
  stage: build
  script:
    - echo "This job will run first."

build_b:
  stage: build
  script:
    - echo "This job will run first, in parallel with build_a."

test_ab:
  stage: test
  script:
    - echo "This job will run after build_a and build_b have finished."

deploy_ab:
  stage: deploy
  script:
    - echo "This job will run after test_ab is complete"
```

### GitHub Actions syntax for dependencies between jobs

```yaml
jobs:
  build_a:
    runs-on: ubuntu-latest
    steps:
      - run: echo "This job will be run first."

  build_b:
    runs-on: ubuntu-latest
    steps:
      - run: echo "This job will be run first, in parallel with build_a"

  test_ab:
    runs-on: ubuntu-latest
    needs: [build_a,build_b]
    steps:
      - run: echo "This job will run after build_a and build_b have finished"

  deploy_ab:
    runs-on: ubuntu-latest
    needs: [test_ab]
    steps:
      - run: echo "This job will run after test_ab is complete"
```

For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idneeds).

## Scheduling workflows

Both GitLab CI/CD and GitHub Actions allow you to run workflows at a specific interval. In GitLab CI/CD, pipeline schedules are configured with the UI, while in GitHub Actions you can trigger a workflow on a scheduled interval with the "on" key.

For more information, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#scheduled-events).

## Variables and secrets

GitLab CI/CD and GitHub Actions support setting variables in the pipeline or workflow configuration file, and creating secrets using the GitLab or GitHub UI.

For more information, see [Store information in variables](/en/actions/learn-github-actions/variables) and [Secrets](/en/actions/security-for-github-actions/security-guides/about-secrets).

## Caching

GitLab CI/CD and GitHub Actions provide a method in the configuration file to manually cache workflow files.

Below is an example of the syntax for each system.

### GitLab CI/CD syntax for caching

```yaml
image: node:latest

cache:
  key: $CI_COMMIT_REF_SLUG
  paths:
    - .npm/

before_script:
  - npm ci --cache .npm --prefer-offline

test_async:
  script:
    - node ./specs/start.js ./specs/async.spec.js
```

### GitHub Actions syntax for caching

```yaml
jobs:
  test_async:
    runs-on: ubuntu-latest
    steps:
    - name: Cache node modules
      uses: actions/cache@v4
      with:
        path: ~/.npm
        key: v1-npm-deps-${{ hashFiles('**/package-lock.json') }}
        restore-keys: v1-npm-deps-
```

## Artifacts

Both GitLab CI/CD and GitHub Actions can upload files and directories created by a job as artifacts. In GitHub Actions, artifacts can be used to persist data across multiple jobs.

Below is an example of the syntax for each system.

### GitLab CI/CD syntax for artifacts

```yaml
script:
artifacts:
  paths:
    - math-homework.txt
```

### GitHub Actions syntax for artifacts

```yaml
- name: Upload math result for job 1
  uses: actions/upload-artifact@v4
  with:
    name: homework
    path: math-homework.txt
```

For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

## Databases and service containers

Both systems enable you to include additional containers for databases, caching, or other dependencies.

In GitLab CI/CD, a container for the job is specified with the `image` key, while GitHub Actions uses the `container` key. In both systems, additional service containers are specified with the `services` key.

Below is an example of the syntax for each system.

### GitLab CI/CD syntax for databases and service containers

```yaml
container-job:
  variables:
    POSTGRES_PASSWORD: postgres
    # The hostname used to communicate with the
    # PostgreSQL service container
    POSTGRES_HOST: postgres
    # The default PostgreSQL port
    POSTGRES_PORT: 5432
  image: node:20-bookworm-slim
  services:
    - postgres
  script:
    # Performs a clean installation of all dependencies
    # in the `package.json` file
    - npm ci
    # Runs a script that creates a PostgreSQL client,
    # populates the client with data, and retrieves data
    - node client.js
  tags:
    - docker
```

### GitHub Actions syntax for databases and service containers

```yaml
jobs:
  container-job:
    runs-on: ubuntu-latest
    container: node:20-bookworm-slim

    services:
      postgres:
        image: postgres
        env:
          POSTGRES_PASSWORD: postgres

    steps:
      - name: Check out repository code
        uses: actions/checkout@v5

      # Performs a clean installation of all dependencies
      # in the `package.json` file
      - name: Install dependencies
        run: npm ci

      - name: Connect to PostgreSQL
        # Runs a script that creates a PostgreSQL client,
        # populates the client with data, and retrieves data
        run: node client.js
        env:
          # The hostname used to communicate with the
          # PostgreSQL service container
          POSTGRES_HOST: postgres
          # The default PostgreSQL port
          POSTGRES_PORT: 5432
```

For more information, see [Communicating with Docker service containers](/en/actions/using-containerized-services/about-service-containers).
---

# Migrating from Jenkins to GitHub Actions

GitHub Actions and Jenkins share multiple similarities, which makes migration to GitHub Actions relatively straightforward.

## Introduction

Jenkins and GitHub Actions both allow you to create workflows that automatically build, test, publish, release, and deploy code. Jenkins and GitHub Actions share some similarities in workflow configuration:

* Jenkins creates workflows using *Declarative Pipelines*, which are similar to GitHub Actions workflow files.
* Jenkins uses *stages* to run a collection of steps, while GitHub Actions uses jobs to group one or more steps or individual commands.
* Jenkins and GitHub Actions support container-based builds. For more information, see [Creating a Docker container action](/en/actions/creating-actions/creating-a-docker-container-action).
* Steps or tasks can be reused and shared with the community.

For more information, see [Understanding GitHub Actions](/en/actions/learn-github-actions/understanding-github-actions).

## Key differences

* Jenkins has two types of syntax for creating pipelines: Declarative Pipeline and Scripted Pipeline. GitHub Actions uses YAML to create workflows and configuration files. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions).
* Jenkins deployments are typically self-hosted, with users maintaining the servers in their own data centers. GitHub Actions offers a hybrid cloud approach by hosting its own runners that you can use to run jobs, while also supporting self-hosted runners. For more information, see [Self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners).

## Comparing capabilities

### Distributing your builds

Jenkins lets you send builds to a single build agent, or you can distribute them across multiple agents. You can also classify these agents according to various attributes, such as operating system types.

Similarly, GitHub Actions can send jobs to GitHub-hosted or self-hosted runners, and you can use labels to classify runners according to various attributes. For more information, see [Understanding GitHub Actions](/en/actions/learn-github-actions/understanding-github-actions#runners) and [Self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners).

### Using sections to organize pipelines

Jenkins splits its Declarative Pipelines into multiple sections. Similarly, GitHub Actions organizes its workflows into separate sections. The table below compares Jenkins sections with the GitHub Actions workflow.

| Jenkins Directives                                              | GitHub Actions                                                                                                                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`agent`](https://jenkins.io/doc/book/pipeline/syntax/#agent)   | [`jobs.<job_id>.runs-on`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idruns-on) <br> [`jobs.<job_id>.container`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idcontainer) |
| [`post`](https://jenkins.io/doc/book/pipeline/syntax/#post)     | None                                                                                                                                                                                                                             |
| [`stages`](https://jenkins.io/doc/book/pipeline/syntax/#stages) | [`jobs`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobs)                                                                                                                                                    |
| [`steps`](https://jenkins.io/doc/book/pipeline/syntax/#steps)   | [`jobs.<job_id>.steps`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idsteps)                                                                                                                          |

## Using directives

Jenkins uses directives to manage *Declarative Pipelines*. These directives define the characteristics of your workflow and how it will execute. The table below demonstrates how these directives map to concepts within GitHub Actions.

| Jenkins Directives                                                                         | GitHub Actions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`environment`](https://jenkins.io/doc/book/pipeline/syntax/#environment)                  | [`jobs.<job_id>.env`](/en/actions/using-workflows/workflow-syntax-for-github-actions#env) <br> [`jobs.<job_id>.steps[*].env`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsenv)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| [`options`](https://jenkins.io/doc/book/pipeline/syntax/#options)                          | [`jobs.<job_id>.strategy`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategy) <br> [`jobs.<job_id>.strategy.fail-fast`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategyfail-fast) <br> [`jobs.<job_id>.timeout-minutes`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idtimeout-minutes)                                                                                                                                                                                                                                                                                                                                                                                                                    |
| [`parameters`](https://jenkins.io/doc/book/pipeline/syntax/#options)                       | [`inputs`](/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs) <br> [`outputs`](/en/actions/creating-actions/metadata-syntax-for-github-actions#outputs-for-docker-container-and-javascript-actions)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| [`triggers`](https://jenkins.io/doc/book/pipeline/syntax/#triggers)                        | [`on`](/en/actions/using-workflows/workflow-syntax-for-github-actions#on) <br> [`on.<event_name>.types`](/en/actions/using-workflows/workflow-syntax-for-github-actions#onevent_nametypes) <br> [<code>on.\<push>.\<branches\|tags></code>](/en/actions/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#onpushbranchestagsbranches-ignoretags-ignore) <br> [<code>on.\<pull\_request>.\<branches></code>](/en/actions/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#onpull_requestpull_request_targetbranchesbranches-ignore) <br> [<code>on.\<push\|pull\_request>.paths</code>](/en/actions/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore) |
| [`triggers { upstreamprojects() }`](https://jenkins.io/doc/book/pipeline/syntax/#triggers) | [`jobs.<job_id>.needs`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idneeds)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| [Jenkins cron syntax](https://jenkins.io/doc/book/pipeline/syntax/#cron-syntax)            | [`on.schedule`](/en/actions/using-workflows/workflow-syntax-for-github-actions#onschedule)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| [`stage`](https://jenkins.io/doc/book/pipeline/syntax/#stage)                              | [`jobs.<job_id>`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_id) <br> [`jobs.<job_id>.name`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idname)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| [`tools`](https://jenkins.io/doc/book/pipeline/syntax/#tools)                              | [Specifications for GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-software)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [`input`](https://jenkins.io/doc/book/pipeline/syntax/#input)                              | [`inputs`](/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [`when`](https://jenkins.io/doc/book/pipeline/syntax/#when)                                | [`jobs.<job_id>.if`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idif)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Using sequential stages

### Parallel job processing

Jenkins can run the `stages` and `steps` in parallel, while GitHub Actions currently only runs jobs in parallel.

| Jenkins Parallel                                                    | GitHub Actions                                                                                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [`parallel`](https://jenkins.io/doc/book/pipeline/syntax/#parallel) | [`jobs.<job_id>.strategy.max-parallel`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategymax-parallel) |

### Matrix

Both GitHub Actions and Jenkins let you use a matrix to define various system combinations.

| Jenkins                                                                  | GitHub Actions                                                                                                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`axis`](https://jenkins.io/doc/book/pipeline/syntax/#matrix-axes)       | [`strategy/matrix`](/en/actions/using-workflows/about-workflows#using-a-build-matrix) <br> [`context`](/en/actions/learn-github-actions/contexts) |
| [`stages`](https://jenkins.io/doc/book/pipeline/syntax/#matrix-stages)   | [`steps-context`](/en/actions/learn-github-actions/contexts#steps-context)                                                                        |
| [`excludes`](https://jenkins.io/doc/book/pipeline/syntax/#matrix-stages) | None                                                                                                                                              |

### Using steps to execute tasks

Jenkins groups `steps` together in `stages`. Each of these steps can be a script, function, or command, among others. Similarly, GitHub Actions uses `jobs` to execute specific groups of `steps`.

| Jenkins                                                       | GitHub Actions                                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`steps`](https://jenkins.io/doc/book/pipeline/syntax/#steps) | [`jobs.<job_id>.steps`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idsteps) |

## Examples of common tasks

### Scheduling a pipeline to run with `cron`

#### Jenkins pipeline with `cron`

```yaml
pipeline {
  agent any
  triggers {
    cron('H/15 * * * 1-5')
  }
}
```

#### GitHub Actions workflow with `cron`

```yaml
on:
  schedule:
    - cron: '*/15 * * * 1-5'
```

For more information about `schedule` events and accepted cron syntax, see [Events that trigger workflows](/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

### Configuring environment variables in a pipeline

#### Jenkins pipeline with an environment variable

```yaml
pipeline {
  agent any
  environment {
    MAVEN_PATH = '/usr/local/maven'
  }
}
```

#### GitHub Actions workflow with an environment variable

```yaml
jobs:
  maven-build:
    env:
      MAVEN_PATH: '/usr/local/maven'
```

### Building from upstream projects

#### Jenkins pipeline that builds from an upstream project

```yaml
pipeline {
  triggers {
    upstream(
      upstreamProjects: 'job1,job2',
      threshold: hudson.model.Result.SUCCESS
    )
  }
}
```

#### GitHub Actions workflow that builds from an upstream project

```yaml
jobs:
  job1:
  job2:
    needs: job1
  job3:
    needs: [job1, job2]
```

### Building with multiple operating systems

#### Jenkins pipeline that builds with multiple operating systems

```yaml
pipeline {
  agent none
  stages {
    stage('Run Tests') {
      matrix {
        axes {
          axis {
            name: 'PLATFORM'
            values: 'macos', 'linux'
          }
        }
        agent { label "${PLATFORM}" }
        stages {
          stage('test') {
            tools { nodejs "node-20" }
            steps {
              dir("scripts/myapp") {
                sh(script: "npm install -g bats")
                sh(script: "bats tests")
              }
            }
          }
        }
      }
    }
  }
}
```

#### GitHub Actions workflow that builds with multiple operating systems

```yaml
name: demo-workflow
on:
  push:
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g bats
      - run: bats tests
        working-directory: ./scripts/myapp
```
---

# Migrating from Travis CI to GitHub Actions

GitHub Actions and Travis CI share multiple similarities, which helps make it relatively straightforward to migrate to GitHub Actions.

## Introduction

This guide helps you migrate from Travis CI to GitHub Actions. It compares their concepts and syntax, describes the similarities, and demonstrates their different approaches to common tasks.

## Before you start

Before starting your migration to GitHub Actions, it would be useful to become familiar with how it works:

* For a quick example that demonstrates a GitHub Actions job, see [Quickstart for GitHub Actions](/en/actions/quickstart).
* To learn the essential GitHub Actions concepts, see [Understanding GitHub Actions](/en/actions/learn-github-actions/understanding-github-actions).

## Comparing job execution

To give you control over when CI tasks are executed, a GitHub Actions *workflow* uses *jobs* that run in parallel by default. Each job contains *steps* that are executed in a sequence that you define. If you need to run setup and cleanup actions for a job, you can define steps in each job to perform these.

## Key similarities

GitHub Actions and Travis CI share certain similarities, and understanding these ahead of time can help smooth the migration process.

### Using YAML syntax

Travis CI and GitHub Actions both use YAML to create jobs and workflows, and these files are stored in the code's repository. For more information on how GitHub Actions uses YAML, see [Understanding GitHub Actions](/en/actions/learn-github-actions/understanding-github-actions#create-an-example-workflow).

### Custom variables

Travis CI lets you set variables and share them between stages. Similarly, GitHub Actions lets you define variables for a workflow. For more information, see [Store information in variables](/en/actions/learn-github-actions/variables).

### Default variables

Travis CI and GitHub Actions both include default environment variables that you can use in your YAML files. For GitHub Actions, you can see these listed in [Variables reference](/en/actions/reference/variables-reference#default-environment-variables).

### Parallel job processing

Travis CI can use `stages` to run jobs in parallel. Similarly, GitHub Actions runs `jobs` in parallel. For more information, see [Workflows](/en/actions/using-workflows/about-workflows#creating-dependent-jobs).

### Status badges

Travis CI and GitHub Actions both support status badges, which let you indicate whether a build is passing or failing.
For more information, see [Adding a workflow status badge](/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge).

### Using a matrix

Travis CI and GitHub Actions both support a matrix, allowing you to perform testing using combinations of operating systems and software packages. For more information, see [Running variations of jobs in a workflow](/en/actions/using-jobs/using-a-matrix-for-your-jobs).

Below is an example comparing the syntax for each system.

#### Travis CI syntax for a matrix

```yaml
matrix:
  include:
    - rvm: '2.5'
    - rvm: '2.6.3'
```

#### GitHub Actions syntax for a matrix

```yaml
jobs:
  build:
    strategy:
      matrix:
        ruby: ['2.5', '2.6.3']
```

### Targeting specific branches

Travis CI and GitHub Actions both allow you to target your CI to a specific branch. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushbranchestagsbranches-ignoretags-ignore).

Below is an example of the syntax for each system.

#### Travis CI syntax for targeting specific branches

```yaml
branches:
  only:
    - main
    - 'mona/octocat'
```

#### GitHub Actions syntax for targeting specific branches

```yaml
on:
  push:
    branches:
      - main
      - 'mona/octocat'
```

### Checking out submodules

Travis CI and GitHub Actions both allow you to control whether submodules are included in the repository clone.

Below is an example of the syntax for each system.

#### Travis CI syntax for checking out submodules

```yaml
git:
  submodules: false
```

#### GitHub Actions syntax for checking out submodules

```yaml
- uses: actions/checkout@v5
  with:
    submodules: false
```

### Using environment variables in a matrix

Travis CI and GitHub Actions can both add custom variables to a test matrix, which allows you to refer to the variable in a later step.

In GitHub Actions, you can use the `include` key to add custom environment variables to a matrix. In this example, the matrix entries for `node-version` are each configured to use different values for the `site` and `datacenter` environment variables. The `Echo site details` step then uses `env: ${{ matrix.env }}` to refer to the custom variables:

```yaml
name: Node.js CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
       include:
         - node-version: '14.x'
           site: "prod"
           datacenter: "site-a"
         - node-version: '16.x'
           site: "dev"
           datacenter: "site-b"
    steps:
      - name: Echo site details
        env:
          SITE: ${{ matrix.site }}
          DATACENTER: ${{ matrix.datacenter }}
        run: echo $SITE $DATACENTER
```

## Key features in GitHub Actions

When migrating from Travis CI, consider the following key features in GitHub Actions:

### Storing secrets

GitHub Actions allows you to store secrets and reference them in your jobs. GitHub Actions organizations can limit which repositories can access organization secrets. Deployment protection rules can require manual approval for a workflow to access environment secrets. For more information, see [Secrets](/en/actions/security-for-github-actions/security-guides/about-secrets).

### Sharing files between jobs and workflows

GitHub Actions includes integrated support for artifact storage, allowing you to share files between jobs in a workflow. You can also save the resulting files and share them with other workflows. For more information, see [Understanding GitHub Actions](/en/actions/learn-github-actions/essential-features-of-github-actions#sharing-data-between-jobs).

### Hosting your own runners

If your jobs require specific hardware or software, GitHub Actions allows you to host your own runners and send your jobs to them for processing. GitHub Actions also lets you use policies to control how these runners are accessed, granting access at the organization or repository level. For more information, see [Managing self-hosted runners](/en/actions/how-tos/managing-self-hosted-runners).

### Concurrent jobs and execution time

The concurrent jobs and workflow execution times in GitHub Actions can vary depending on your GitHub plan. For more information, see [Billing and usage](/en/actions/learn-github-actions/usage-limits-billing-and-administration).

### Using different languages in GitHub Actions

When working with different languages in GitHub Actions, you can create a step in your job to set up your language dependencies. For more information about working with a particular language, see [Building and testing your code](/en/actions/use-cases-and-examples/building-and-testing).

## Executing scripts

GitHub Actions can use `run` steps to run scripts or shell commands. To use a particular shell, you can specify the `shell` type when providing the path to the script. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsrun).

For example:

```yaml
steps:
  - name: Run build script
    run: ./.github/scripts/build.sh
    shell: bash
```

## Error handling in GitHub Actions

When migrating to GitHub Actions, there are different approaches to error handling that you might need to be aware of.

### Script error handling

GitHub Actions stops a job immediately if one of the steps returns an error code. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#exit-codes-and-error-action-preference).

### Job error handling

GitHub Actions uses `if` conditionals to execute jobs or steps in certain situations. For example, you can run a step when another step results in a `failure()`. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#example-using-status-check-functions). You can also use [`continue-on-error`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idcontinue-on-error) to prevent a workflow run from stopping when a job fails.

## Migrating syntax for conditionals and expressions

To run jobs under conditional expressions, Travis CI and GitHub Actions share a similar `if` condition syntax. GitHub Actions lets you use the `if` conditional to prevent a job or step from running unless a condition is met. For more information, see [Evaluate expressions in workflows and actions](/en/actions/learn-github-actions/expressions).

This example demonstrates how an `if` conditional can control whether a step is executed:

```yaml
jobs:
  conditional:
    runs-on: ubuntu-latest
    steps:
      - run: echo "This step runs with str equals 'ABC' and num equals 123"
        if: env.str == 'ABC' && env.num == 123
```

## Migrating phases to steps

Where Travis CI uses *phases* to run *steps*, GitHub Actions has *steps* which execute *actions*. You can find prebuilt actions in the [GitHub Marketplace](https://github.com/marketplace?type=actions), or you can create your own actions. For more information, see [Reusing automations](/en/actions/creating-actions).

Below is an example of the syntax for each system.

### Travis CI syntax for phases and steps

```yaml
language: python
python:
  - "3.7"

script:
  - python script.py
```

### GitHub Actions syntax for steps and actions

```yaml
jobs:
  run_python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-python@v5
        with:
          python-version: '3.7'
          architecture: 'x64'
      - run: python script.py
```

## Caching dependencies

Travis CI and GitHub Actions let you manually cache dependencies for later reuse.

These examples demonstrate the cache syntax for each system.

### Travis CI syntax for caching

```yaml
language: node_js
cache: npm
```

### GitHub Actions syntax for caching

```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: v1-npm-deps-${{ hashFiles('**/package-lock.json') }}
    restore-keys: v1-npm-deps-
```

## Examples of common tasks

This section compares how GitHub Actions and Travis CI perform common tasks.

### Configuring environment variables

You can create custom environment variables in a GitHub Actions job.

#### Travis CI syntax for an environment variable

```yaml
env:
  - MAVEN_PATH="/usr/local/maven"
```

#### GitHub Actions workflow with an environment variable

```yaml
jobs:
  maven-build:
    env:
      MAVEN_PATH: '/usr/local/maven'
```

### Building with Node.js

#### Travis CI for building with Node.js

```yaml
install:
  - npm install
script:
  - npm run build
  - npm test
```

#### GitHub Actions workflow for building with Node.js

```yaml
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
          node-version: '16.x'
      - run: npm install
      - run: npm run build
      - run: npm test
```

## Next steps

To continue learning about the main features of GitHub Actions, see [Writing workflows](/en/actions/learn-github-actions).