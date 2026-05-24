# Manage Your Work

---

# Commenting on an issue when a label is added

You can use GitHub Actions to automatically comment on issues when a specific label is applied.

## Introduction

This tutorial demonstrates how to use the GitHub CLI to comment on an issue when a specific label is applied. For example, when the `help wanted` label is added to an issue, you can add a comment to encourage contributors to work on the issue. For more information about GitHub CLI, see [Using GitHub CLI in workflows](/en/actions/using-workflows/using-github-cli-in-workflows).

In the tutorial, you will first make a workflow file that uses the `gh issue comment` command to comment on an issue. Then, you will customize the workflow to suit your needs.

## Creating the workflow

1. Choose a repository where you want to apply this project management workflow. You can use an existing repository that you have write access to, or you can create a new repository. For more information about creating a repository, see [Creating a new repository](/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

2. In your repository, create a file called `.github/workflows/YOUR_WORKFLOW.yml`, replacing `YOUR_WORKFLOW` with a name of your choice. This is a workflow file. For more information about creating new files on GitHub, see [Creating new files](/en/repositories/working-with-files/managing-files/creating-new-files).

3. Copy the following YAML contents into your workflow file.

   ```yaml copy
   name: Add comment
   on:
     issues:
       types:
         - labeled
   jobs:
     add-comment:
       if: github.event.label.name == 'help wanted'
       runs-on: ubuntu-latest
       permissions:
         issues: write
       steps:
         - name: Add comment
           run: gh issue comment "$NUMBER" --body "$BODY"
           env:
             GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             GH_REPO: ${{ github.repository }}
             NUMBER: ${{ github.event.issue.number }}
             BODY: >
               This issue is available for anyone to work on.
               **Make sure to reference this issue in your pull request.**
               :sparkles: Thank you for your contribution! :sparkles:
   ```

4. Customize the parameters in your workflow file:
   * Replace `help wanted` in `if: github.event.label.name == 'help wanted'` with the label that you want to act on. If you want to act on more than one label, separate the conditions with `||`. For example, `if: github.event.label.name == 'bug' || github.event.label.name == 'fix me'` will comment whenever the `bug` or `fix me` labels are added to an issue.
   * Change the value for `BODY` to the comment that you want to add. GitHub flavored markdown is supported. For more information about markdown, see [Basic writing and formatting syntax](/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax).

5. Commit your workflow file to the default branch of your repository. For more information, see [Creating new files](/en/repositories/working-with-files/managing-files/creating-new-files).

## Testing the workflow

Every time an issue in your repository is labeled, this workflow will run. If the label that was added is one of the labels that you specified in your workflow file, the `gh issue comment` command will add the comment that you specified to the issue.

Test your workflow by applying your specified label to an issue.

1. Open an issue in your repository. For more information, see [Creating an issue](/en/issues/tracking-your-work-with-issues/creating-an-issue).
2. Label the issue with the specified label in your workflow file. For more information, see [Managing labels](/en/issues/using-labels-and-milestones-to-track-work/managing-labels#applying-labels-to-issues-and-pull-requests).
3. To see the workflow run triggered by labeling the issue, view the history of your workflow runs. For more information, see [Viewing workflow run history](/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history).
4. When the workflow completes, the issue that you labeled should have a comment added.

## Next steps

* To learn more about additional things you can do with the GitHub CLI, like editing existing comments, visit the [GitHub CLI Manual](https://cli.github.com/manual/).
---

# Adding labels to issues

You can use GitHub Actions to automatically label issues.

## Introduction

This tutorial demonstrates how to use the GitHub CLI in a workflow to label newly opened or reopened issues. For example, you can add the `triage` label every time an issue is opened or reopened. Then, you can see all issues that need to be triaged by filtering for issues with the `triage` label.

The GitHub CLI allows you to easily use the GitHub API in a workflow.

In the tutorial, you will first make a workflow file that uses the GitHub CLI. Then, you will customize the workflow to suit your needs.

## Creating the workflow

1. Choose a repository where you want to apply this project management workflow. You can use an existing repository that you have write access to, or you can create a new repository. For more information about creating a repository, see [Creating a new repository](/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

2. In your repository, create a file called `.github/workflows/YOUR_WORKFLOW.yml`, replacing `YOUR_WORKFLOW` with a name of your choice. This is a workflow file. For more information about creating new files on GitHub, see [Creating new files](/en/repositories/working-with-files/managing-files/creating-new-files).

3. Copy the following YAML contents into your workflow file.

   ```yaml copy
   name: Label issues
   on:
     issues:
       types:
         - reopened
         - opened
   jobs:
     label_issues:
       runs-on: ubuntu-latest
       permissions:
         issues: write
       steps:
         - run: gh issue edit "$NUMBER" --add-label "$LABELS"
           env:
             GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             GH_REPO: ${{ github.repository }}
             NUMBER: ${{ github.event.issue.number }}
             LABELS: triage
   ```

4. Customize the `env` values in your workflow file:
   * The `GH_TOKEN`, `GH_REPO`, and `NUMBER` values are automatically set using the `github` and `secrets` contexts. You do not need to change these.
   * Change the value for `LABELS` to the list of labels that you want to add to the issue. The label(s) must exist for your repository. Separate multiple labels with commas. For example, `help wanted,good first issue`. For more information about labels, see [Managing labels](/en/issues/using-labels-and-milestones-to-track-work/managing-labels#applying-labels-to-issues-and-pull-requests).

5. Commit your workflow file to the default branch of your repository. For more information, see [Creating new files](/en/repositories/working-with-files/managing-files/creating-new-files).

## Testing the workflow

Every time an issue in your repository is opened or reopened, this workflow will add the labels that you specified to the issue.

Test out your workflow by creating an issue in your repository.

1. Create an issue in your repository. For more information, see [Creating an issue](/en/issues/tracking-your-work-with-issues/creating-an-issue).
2. To see the workflow run that was triggered by creating the issue, view the history of your workflow runs. For more information, see [Viewing workflow run history](/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history).
3. When the workflow completes, the issue that you created should have the specified labels added.

## Next steps

* To learn more about additional things you can do with the GitHub CLI, see the [GitHub CLI manual](https://cli.github.com/manual/).
* To learn more about different events that can trigger your workflow, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#issues).
* [Search GitHub](https://github.com/search?q=path%3A.github%2Fworkflows+gh+issue+edit\&type=code) for examples of workflows using `gh issue edit`.
---

# Closing inactive issues

You can use GitHub Actions to comment on or close issues that have been inactive for a certain period of time.

## Introduction

This tutorial demonstrates how to use the [`actions/stale` action](https://github.com/marketplace/actions/close-stale-issues) to comment on and close issues that have been inactive for a certain period of time. For example, you can comment if an issue has been inactive for 30 days to prompt participants to take action. Then, if no additional activity occurs after 14 days, you can close the issue.

In the tutorial, you will first make a workflow file that uses the [`actions/stale` action](https://github.com/marketplace/actions/close-stale-issues). Then, you will customize the workflow to suit your needs.

## Creating the workflow

1. Choose a repository where you want to apply this project management workflow. You can use an existing repository that you have write access to, or you can create a new repository. For more information about creating a repository, see [Creating a new repository](/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

2. In your repository, create a file called `.github/workflows/YOUR_WORKFLOW.yml`, replacing `YOUR_WORKFLOW` with a name of your choice. This is a workflow file. For more information about creating new files on GitHub, see [Creating new files](/en/repositories/working-with-files/managing-files/creating-new-files).

3. Copy the following YAML contents into your workflow file.

   ```yaml copy
   name: Close inactive issues
   on:
     schedule:
       - cron: "30 1 * * *"

   jobs:
     close-issues:
       runs-on: ubuntu-latest
       permissions:
         issues: write
         pull-requests: write
       steps:
         - uses: actions/stale@v10
           with:
             days-before-issue-stale: 30
             days-before-issue-close: 14
             stale-issue-label: "stale"
             stale-issue-message: "This issue is stale because it has been open for 30 days with no activity."
             close-issue-message: "This issue was closed because it has been inactive for 14 days since being marked as stale."
             days-before-pr-stale: -1
             days-before-pr-close: -1
             repo-token: ${{ secrets.GITHUB_TOKEN }}
   ```

4. Customize the parameters in your workflow file:
   * Change the value for `on.schedule` to dictate when you want this workflow to run. In the example above, the workflow will run every day at 1:30 UTC. For more information about scheduled workflows, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#scheduled-events).
   * Change the value for `days-before-issue-stale` to the number of days without activity before the `actions/stale` action labels an issue. If you never want this action to label issues, set this value to `-1`.
   * Change the value for `days-before-issue-close` to the number of days without activity before the `actions/stale` action closes an issue. If you never want this action to close issues, set this value to `-1`.
   * Change the value for `stale-issue-label` to the label that you want to apply to issues that have been inactive for the amount of time specified by `days-before-issue-stale`.
   * Change the value for `stale-issue-message` to the comment that you want to add to issues that are labeled by the `actions/stale` action.
   * Change the value for `close-issue-message` to the comment that you want to add to issues that are closed by the `actions/stale` action.

5. Commit your workflow file to the default branch of your repository. For more information, see [Creating new files](/en/repositories/working-with-files/managing-files/creating-new-files).

## Expected results

Based on the `schedule` parameter (for example, every day at 1:30 UTC), your workflow will find issues that have been inactive for the specified period of time and will add the specified comment and label. Additionally, your workflow will close any previously labeled issues if no additional activity has occurred for the specified period of time.

> \[!NOTE]
> The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour. If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour.

You can view the history of your workflow runs to see this workflow run periodically. For more information, see [Viewing workflow run history](/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history).

This workflow will only label and/or close 30 issues at a time in order to avoid exceeding a rate limit. You can configure this with the `operations-per-run` setting. For more information, see the [`actions/stale` action documentation](https://github.com/marketplace/actions/close-stale-issues).

## Next steps

* To learn more about additional things you can do with the `actions/stale` action, like closing inactive pull requests, ignoring issues with certain labels or milestones, or only checking issues with certain labels, see the [`actions/stale` action documentation](https://github.com/marketplace/actions/close-stale-issues).
* [Search GitHub](https://github.com/search?q=%22uses%3A+actions%2Fstale%22\&type=code) for examples of workflows using this action.
---

# Scheduling issue creation

You can use GitHub Actions to create an issue on a regular basis for things like daily meetings or quarterly reviews.

## Introduction

This tutorial demonstrates how to use the GitHub CLI to create an issue on a regular basis. For example, you can create an issue each week to use as the agenda for a team meeting. For more information about GitHub CLI, see [Using GitHub CLI in workflows](/en/actions/using-workflows/using-github-cli-in-workflows).

In the tutorial, you will first make a workflow file that uses the GitHub CLI. Then, you will customize the workflow to suit your needs.

## Creating the workflow

1. Choose a repository where you want to apply this project management workflow. You can use an existing repository that you have write access to, or you can create a new repository. For more information about creating a repository, see [Creating a new repository](/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

2. In your repository, create a file called `.github/workflows/YOUR_WORKFLOW.yml`, replacing `YOUR_WORKFLOW` with a name of your choice. This is a workflow file. For more information about creating new files on GitHub, see [Creating new files](/en/repositories/working-with-files/managing-files/creating-new-files).

3. Copy the following YAML contents into your workflow file.

   ```yaml copy
   name: Weekly Team Sync
   on:
     schedule:
       - cron: 20 07 * * 1

   jobs:
     create_issue:
       name: Create team sync issue
       runs-on: ubuntu-latest
       permissions:
         issues: write
       steps:
         - name: Create team sync issue
           run: |
             if [[ $CLOSE_PREVIOUS == true ]]; then
               previous_issue_number=$(gh issue list \
                 --label "$LABELS" \
                 --json number \
                 --jq '.[0].number')
               if [[ -n $previous_issue_number ]]; then
                 gh issue close "$previous_issue_number"
                 gh issue unpin "$previous_issue_number"
               fi
             fi
             new_issue_url=$(gh issue create \
               --title "$TITLE" \
               --assignee "$ASSIGNEES" \
               --label "$LABELS" \
               --body "$BODY")
             if [[ $PINNED == true ]]; then
               gh issue pin "$new_issue_url"
             fi
           env:
             GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             GH_REPO: ${{ github.repository }}
             TITLE: Team sync
             ASSIGNEES: monalisa,doctocat,hubot
             LABELS: weekly sync,docs-team
             BODY: |
               ### Agenda

               - [ ] Start the recording
               - [ ] Check-ins
               - [ ] Discussion points
               - [ ] Post the recording

               ### Discussion Points
               Add things to discuss below

               - [Work this week](https://github.com/orgs/github/projects/3)
             PINNED: false
             CLOSE_PREVIOUS: false
   ```

4. Customize the parameters in your workflow file:
   * Change the value for `on.schedule` to dictate when you want this workflow to run. In the example above, the workflow will run every Monday at 7:20 UTC. For more information about scheduled workflows, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#scheduled-events).
   * Change the value for `ASSIGNEES` to the list of GitHub usernames that you want to assign to the issue.
   * Change the value for `LABELS` to the list of labels that you want to apply to the issue.
   * Change the value for `TITLE` to the title that you want the issue to have.
   * Change the value for `BODY` to the text that you want in the issue body. The `|` character allows you to use a multi-line value for this parameter.
   * If you want to pin this issue in your repository, set `PINNED` to `true`. For more information about pinned issues, see [Pinning an issue to your repository](/en/issues/tracking-your-work-with-issues/pinning-an-issue-to-your-repository).
   * If you want to close the previous issue generated by this workflow each time a new issue is created, set `CLOSE_PREVIOUS` to `true`. The workflow will close the most recent issue that has the labels defined in the `labels` field. To avoid closing the wrong issue, use a unique label or combination of labels.

5. Commit your workflow file to the default branch of your repository. For more information, see [Creating new files](/en/repositories/working-with-files/managing-files/creating-new-files).

## Expected results

Based on the `schedule` parameter (for example, every Monday at 7:20 UTC), your workflow will create a new issue with the assignees, labels, title, and body that you specified. If you set `PINNED` to `true`, the workflow will pin the issue to your repository. If you set `CLOSE_PREVIOUS` to true, the workflow will close the most recent issue with matching labels.

> \[!NOTE]
> The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour. If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour.

You can view the history of your workflow runs to see this workflow run periodically. For more information, see [Viewing workflow run history](/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history).

## Next steps

* To learn more about additional things you can do with the GitHub CLI, like using an issue template, see the [`gh issue create` documentation](https://cli.github.com/manual/gh_issue_create).
* [Search GitHub Marketplace](https://github.com/marketplace?category=\&type=actions\&verification=\&query=schedule+issue) for actions related to scheduled issues.