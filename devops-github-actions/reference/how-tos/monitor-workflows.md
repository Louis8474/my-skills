# Monitor Workflows

---

# Adding a workflow status badge

You can display a status badge in your repository to indicate the status of your workflows.

> \[!NOTE]
> Workflow badges in a private repository are not accessible externally, so you won't be able to embed them or link to them from an external site.

A status badge shows whether a workflow is currently failing or passing. A common place to add a status badge is in the `README.md` file of your repository, but you can add it to any web page you'd like. By default, badges display the status of your default branch. If there are no workflow runs on your default branch, it will display the status of the most recent run across all branches. You can display the status of a workflow run for a specific branch or event using the `branch` and `event` query parameters in the URL.

![Screenshot of a workflow status badge. From right to left it shows: the GitHub logo, workflow name ("GitHub Actions Demo"), and status ("passing").](/assets/images/help/repository/actions-workflow-status-badge.png)

To add a workflow status badge to your `README.md` file, first find the URL for the status badge you would like to display. Then you can use Markdown to display the badge as an image in your `README.md` file. For more information about image markup in Markdown, see [Basic writing and formatting syntax](/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#images).

## Using the UI

You can create a workflow status badge directly on the UI using the workflow file name, branch parameter, and event parameter.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. On the right side of the page, next to the "Filter workflow runs" field, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="Show workflow options" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg> to display a dropdown menu and click **Create status badge**.
5. Optionally, select a branch if you want to display the status badge for a branch different from the default branch.
6. Optionally, select the event that will trigger the workflow.
7. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-copy" aria-label="copy" role="img"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg> Copy status badge Markdown**.
8. Copy the Markdown into your `README.md` file.

## Using the workflow file name

You can build the URL for a workflow status badge using the name of the workflow file:

```text
https://github.com/OWNER/REPOSITORY/actions/workflows/WORKFLOW-FILE/badge.svg
```

To display the workflow status badge in your `README.md` file, use the Markdown markup for embedding images. For more information about image markup in Markdown, see [Basic writing and formatting syntax](/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#images).

For example, add the following Markdown to your `README.md` file to add a status badge for a workflow with the file path `.github/workflows/main.yml`. The `OWNER` of the repository is the `github` organization and the `REPOSITORY` name is `docs`.

```markdown
![example workflow](https://github.com/github/docs/actions/workflows/main.yml/badge.svg)
```

## Using the `branch` parameter

To display the status of a workflow run for a specific branch, add `?branch=BRANCH-NAME` to the end of the status badge URL.

For example, add the following Markdown to your `README.md` file to display a status badge for a branch with the name `feature-1`.

```markdown
![example branch parameter](https://github.com/github/docs/actions/workflows/main.yml/badge.svg?branch=feature-1)
```

## Using the `event` parameter

To display the status of workflow runs triggered by the `push` event, add `?event=push` to the end of the status badge URL.

For example, add the following Markdown to your `README.md` file to display a badge with the status of workflow runs triggered by the `push` event, which will show the status of the build for the current state of that branch.

```markdown
![example event parameter](https://github.com/github/docs/actions/workflows/main.yml/badge.svg?event=push)
```
---

# Enabling debug logging

If the workflow logs do not provide enough detail to diagnose why a workflow, job, or step is not working as expected, you can enable additional debug logging.

These extra logs are enabled by setting secrets or variables in the repository containing the workflow, so the same permissions requirements will apply:

* To create secrets or variables on GitHub for an organization repository, you must have `write` access. For a personal account repository, you must be a repository collaborator.
* To create secrets or variables for an environment in a personal account repository, you must be the repository owner. To create secrets or variables for an environment in an organization repository, you must have `admin` access. For more information on environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).
* Organization owners can create secrets or variables at the organization level.

For more information on setting secrets and variables, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions) and [Store information in variables](/en/actions/learn-github-actions/variables).

Additionally, anyone who has access to run a workflow can enable runner diagnostic logging and step debug logging for a workflow re-run. For more information, see [Re-running workflows and jobs](/en/actions/managing-workflow-runs/re-running-workflows-and-jobs).

## Enabling runner diagnostic logging

Runner diagnostic logging provides additional log files that contain information about how a runner is executing a job. Two extra log files are added to the log archive:

* The runner process log, which includes information about coordinating and setting up runners to execute jobs.
* The worker process log, which logs the execution of a job.

1. To enable runner diagnostic logging, set the following secret or variable in the repository that contains the workflow: `ACTIONS_RUNNER_DEBUG` to `true`. If both the secret and variable are set, the value of the secret takes precedence over the variable.
2. To download runner diagnostic logs, download the log archive of the workflow run. The runner diagnostic logs are contained in the `runner-diagnostic-logs` folder. For more information on downloading logs, see [Using workflow run logs](/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs#downloading-logs).

## Enabling step debug logging

Step debug logging increases the verbosity of a job's logs during and after a job's execution.

1. To enable step debug logging, set the following secret or variable in the repository that contains the workflow: `ACTIONS_STEP_DEBUG` to `true`. If both the secret and variable are set, the value of the secret takes precedence over the variable.
2. After setting the secret or variable, more debug events are shown in the step logs. For more information, see [Using workflow run logs](/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs#viewing-logs-to-diagnose-failures).

You can also use the `runner.debug` context to conditionally run steps only when debug logging is enabled. For more information, see [Contexts reference](/en/actions/reference/workflows-and-actions/contexts#runner-context).
---

# Using the visualization graph

Every workflow run generates a real-time graph that illustrates the run progress. You can use this graph to monitor and debug workflows.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)

4. From the list of workflow runs, click the name of the run to see the workflow run summary.

5. The graph displays each job in the workflow. An icon to the left of the job name indicates the status of the job. Lines between jobs indicate dependencies.

   ![Screenshot of the visualization graph of a workflow run.](/assets/images/help/actions/workflow-graph.png)

6. To view a job's log, click the job.
---

# Using workflow run logs

You can view, search, and download the logs for each job in a workflow run.

You can see whether a workflow run is in progress or complete from the workflow run page. You must be logged in to a GitHub account to view workflow run information, including for public repositories. For more information, see [Access permissions on GitHub](/en/get-started/learning-about-github/access-permissions-on-github).

If the run is complete, you can see whether the result was a success, failure, canceled, or neutral. If the run failed, you can view and search the build logs to diagnose the failure and re-run the workflow. You can also view billable job execution minutes, or download logs and build artifacts.

GitHub Actions use the Checks API to output statuses, results, and logs for a workflow. GitHub creates a new check suite for each workflow run. The check suite contains a check run for each job in the workflow, and each job includes steps. GitHub Actions are run as a step in a workflow. For more information about the Checks API, see [REST API endpoints for checks](/en/rest/checks).

> \[!NOTE]
> Ensure that you only commit valid workflow files to your repository. If `.github/workflows` contains an invalid workflow file, GitHub Actions generates a failed workflow run for every new commit.

## Viewing logs to diagnose failures

If your workflow run fails, you can see which step caused the failure and review the failed step's build logs to troubleshoot. You can see the time it took for each step to run. You can also copy a permalink to a specific line in the log file to share with your team. Read access to the repository is required to perform these steps.

In addition to the steps configured in the workflow file, GitHub adds two additional steps to each job to set up and complete the job's execution. These steps are logged in the workflow run with the names "Set up job" and "Complete job".

For jobs run on GitHub-hosted runners, "Set up job" records details of the runner image, and includes a link to the list of preinstalled tools that were present on the runner machine.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the run to see the workflow run summary.
5. Under **Jobs** or in the visualization graph, click the job you want to see.
6. Any failed steps are automatically expanded to display the results.
7. Optionally, to get a link to a specific line in the logs, click on the step's line number. You can then copy the link from the address bar of your web browser.

   ![Screenshot of the logs for a job. The logs for a failed step are expanded, and a line number is highlighted with an orange outline.](/assets/images/help/repository/copy-link-button-updated-2.png)

## Searching logs

You can search the build logs for a particular step. When you search logs, only expanded steps are included in the results. Read access to the repository is required to perform these steps.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the run to see the workflow run summary.
5. Under **Jobs** or in the visualization graph, click the job you want to see.
6. In the upper-right corner of the log output, in the **Search logs** search box, type a search query.

## Downloading logs

You can download the log files from your workflow run. You can also download a workflow's artifacts. For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts). Read access to the repository is required to perform these steps.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the run to see the workflow run summary.
5. Under **Jobs** or in the visualization graph, click the job you want to see.
6. In the upper right corner of the log, select the <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="Show options" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> dropdown menu, then click **Download log archive**.

   ![Screenshot of the log for a job. In the header, a gear icon is outlined in dark orange.](/assets/images/help/actions/download-logs-drop-down.png)

> \[!NOTE]
> When you download the log archive for a workflow that was partially re-run, the archive only includes the jobs that were re-run. To get a complete set of logs for jobs that were run from a workflow, you must download the log archives for the previous run attempts that ran the other jobs.

## Deleting logs

You can delete the log files from your workflow runs through the GitHub web interface or programmatically. Write access to the repository is required to perform these steps.

### Deleting logs via the GitHub web interface

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)

4. From the list of workflow runs, click the name of the run to see the workflow run summary.

5. In the upper-right corner, select the <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="Show workflow options" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg> dropdown menu, then click **Delete all logs**.

   ![Screenshot of the page for a workflow run. In the top-right corner, a button, labeled with a kebab icon, is outlined in dark orange.](/assets/images/help/actions/workflow-run-kebab-horizontal-icon.png)

6. Review the confirmation prompt.

After deleting logs, the **Delete all logs** button is removed to indicate that no log files remain in the workflow run.

### Deleting logs programmatically

You can use the following script to automatically delete all logs for a workflow. This can be a useful way to clean up logs for multiple workflow runs.

To run the example script below:

1. Copy the code example and save it to a file called `delete-logs.sh`.
2. Grant it the execute permission with `chmod +x delete-logs.sh`.
3. Run the following command, where `REPOSITORY_NAME` is the name of your repository and `WORKFLOW_NAME` is the file name of your workflow.

   ```shell copy
   ./delete-logs.sh REPOSITORY_NAME WORKFLOW_NAME
   ```

   For example, to delete all of the logs in the `monalisa/octocat` repository for the `.github/workflows/ci.yaml` workflow, you would run `./delete-logs.sh monalisa/octocat ci.yaml`.

#### Example script

```bash copy
#!/usr/bin/env bash

# Delete all logs for a given workflow
# Usage: delete-logs.sh <repository> <workflow-name>

set -oe pipefail

REPOSITORY=$1
WORKFLOW_NAME=$2

# Validate arguments
if [[ -z "$REPOSITORY" ]]; then
  echo "Repository is required"
  exit 1
fi

if [[ -z "$WORKFLOW_NAME" ]]; then
  echo "Workflow name is required"
  exit 1
fi

echo "Getting all completed runs for workflow $WORKFLOW_NAME in $REPOSITORY"

RUNS=$(
  gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$REPOSITORY/actions/workflows/$WORKFLOW_NAME/runs" \
    --paginate \
    --jq '.workflow_runs[] | select(.conclusion != "") | .id'
)

echo "Found $(echo "$RUNS" | wc -l) completed runs for workflow $WORKFLOW_NAME"

# Delete logs for each run
for RUN in $RUNS; do
  echo "Deleting logs for run $RUN"
  gh api \
    --silent \
    --method DELETE \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$REPOSITORY/actions/runs/$RUN/logs" || echo "Failed to delete logs for run $RUN"

  # Sleep for 100ms to avoid rate limiting
  sleep 0.1
done
```

## Viewing logs with GitHub CLI

> \[!NOTE]
> To learn more about GitHub CLI, see [About GitHub CLI](/en/github-cli/github-cli/about-github-cli).

To view the log for a specific job, use the `run view` subcommand. Replace `run-id` with the ID of run that you want to view logs for. GitHub CLI returns an interactive menu for you to choose a job from the run. If you don't specify `run-id`, GitHub CLI returns an interactive menu for you to choose a recent run, and then returns another interactive menu for you to choose a job from the run.

```shell
gh run view RUN_ID --log
```

You can also use the `--job` flag to specify a job ID. Replace `job-id` with the ID of the job that you want to view logs for.

```shell
gh run view --job JOB_ID --log
```

You can use `grep` to search the log. For example, this command will return all log entries that contain the word `error`.

```shell
gh run view --job JOB_ID --log | grep error
```

To filter the logs for any failed steps, use `--log-failed` instead of `--log`.

```shell
gh run view --job JOB_ID --log-failed
```
---

# Viewing job condition expression logs

Learn how to access and interpret expression evaluation logs for job-level if conditions in GitHub Actions.

When a job's `if` condition is evaluated, GitHub Actions logs the expression evaluation to help you understand the result. This is useful for debugging both why a job was skipped and why a job ran when you expected it to be skipped.

## Accessing expression logs

1. Navigate to the workflow run summary.
2. Click on the job.
3. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="The Gear icon" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>**.
4. Select **Download log archive**.
5. Extract the ZIP file and open the `JOB-NAME/system.txt` file.

## Understanding the log output

The system log shows the expression evaluation:

```text
Evaluating: (success() && ((github.repository == 'octo-org/octo-repo-prod')))
Expanded: (true && (('my-username/octo-repo-prod' == 'octo-org/octo-repo-prod')))
Result: false
```

| Line           | Description                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **Evaluating** | The original `if` expression from your workflow file.                                                    |
| **Expanded**   | The expression with context values substituted. This shows you exactly what values were used at runtime. |
| **Result**     | The final evaluation result (`true` or `false`).                                                         |

In this example, the expanded line reveals that `github.repository` was `'my-username/octo-repo-prod'` (not `'octo-org/octo-repo-prod'`), which caused the condition to evaluate to `false`.

> \[!NOTE]
> Expression logs are only available for job-level `if` conditions. For step-level conditions, you can enable debug logging to see expression evaluation in the job logs. For more information, see [Enabling debug logging](/en/actions/how-tos/monitor-workflows/enable-debug-logging).
---

# Viewing job execution time

You can view the execution time of a job, including the billable minutes that a job accrued.

Billable job execution minutes are only shown for jobs run on private repositories that use GitHub-hosted runners and are rounded up to the next minute. There are no billable minutes when using GitHub Actions in public repositories or for jobs run on self-hosted runners.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the run to see the workflow run summary.
5. Under the job summary, you can view the job's execution time.
6. To view details about the billable job execution time, in the left sidebar under "Run details", click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-stopwatch" aria-label="stopwatch" role="img"><path d="M5.75.75A.75.75 0 0 1 6.5 0h3a.75.75 0 0 1 0 1.5h-.75v1l-.001.041a6.724 6.724 0 0 1 3.464 1.435l.007-.006.75-.75a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734l-.75.75-.006.007a6.75 6.75 0 1 1-10.548 0L2.72 5.03l-.75-.75a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018l.75.75.007.006A6.72 6.72 0 0 1 7.25 2.541V1.5H6.5a.75.75 0 0 1-.75-.75ZM8 14.5a5.25 5.25 0 1 0-.001-10.501A5.25 5.25 0 0 0 8 14.5Zm.389-6.7 1.33-1.33a.75.75 0 1 1 1.061 1.06L9.45 8.861A1.503 1.503 0 0 1 8 10.75a1.499 1.499 0 1 1 .389-2.95Z"></path></svg> Usage**.

   > \[!NOTE]
   > The billable time shown does not include any minute multipliers. To view your total GitHub Actions usage, including minute multipliers, see [Viewing your usage of metered products and licenses](/en/billing/managing-billing-for-github-actions/viewing-your-github-actions-usage).
---

# Viewing workflow run history

You can view logs for each run of a workflow. Logs include the status for each job and step in a workflow.

Read access to the repository is required to perform these steps.

<div class="ghd-tool webui">

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the run to see the workflow run summary.

</div>

<div class="ghd-tool cli">

> \[!NOTE]
> To learn more about GitHub CLI, see [About GitHub CLI](/en/github-cli/github-cli/about-github-cli).

## Viewing recent workflow runs

To list the recent workflow runs, use the `run list` subcommand.

```shell
gh run list
```

To specify the maximum number of runs to return, you can use the `-L` or `--limit` flag . The default is `10`.

```shell
gh run list --limit 5
```

To only return runs for the specified workflow, you can use the `-w` or `--workflow` flag. Replace `workflow` with either the workflow name, workflow ID, or workflow file name. For example, `"Link Checker"`, `1234567`, or `"link-check-test.yml"`.

```shell
gh run list --workflow WORKFLOW
```

## Viewing details for a specific workflow run

To display details for a specific workflow run, use the `run view` subcommand. Replace `run-id` with the ID of the run that you want to view. If you don't specify a `run-id`, GitHub CLI returns an interactive menu for you to choose a recent run.

```shell
gh run view RUN_ID
```

To include job steps in the output, use the `-v` or `--verbose` flag.

```shell
gh run view RUN_ID --verbose
```

To view details for a specific job in the run, use the `-j` or `--job` flag. Replace `job-id` with the ID of the job that you want to view.

```shell
gh run view --job JOB_ID
```

To view the full log for a job, use the `--log` flag.

```shell
gh run view --job JOB_ID --log
```

Use the `--exit-status` flag to exit with a non-zero status if the run failed. For example:

```shell
gh run view 0451 --exit-status && echo "run pending or passed"
```

</div>