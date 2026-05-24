# Manage Workflow Runs

---

# Approving workflow runs from forks

You can manually approve workflow runs that have been triggered by a contributor's pull request.

Workflow runs triggered by a contributor's pull request from a fork may require manual approval from a maintainer with write access. You can configure workflow approval requirements for a [repository](/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#configuring-required-approval-for-workflows-from-public-forks), [organization](/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#configuring-required-approval-for-workflows-from-public-forks), or [enterprise](/en/enterprise-cloud@latest/admin/policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#enforcing-a-policy-for-fork-pull-requests-in-your-enterprise).

Workflow runs that have been awaiting approval for more than 30 days are automatically deleted.

## Approving workflow runs on a pull request from a public fork

Maintainers with write access to a repository can use the following procedure to review and run workflows on pull requests from contributors that require approval.

1. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-git-pull-request" aria-label="git-pull-request" role="img"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path></svg> Pull requests**.

   ![Screenshot of the main page of a repository. In the horizontal navigation bar, a tab, labeled "Pull requests," is outlined in dark orange.](/assets/images/help/repository/repo-tabs-pull-requests-global-nav-update.png)
2. In the list of pull requests, click the pull request you'd like to review.
3. On the pull request, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-file-diff" aria-label="file-diff" role="img"><path d="M1 1.75C1 .784 1.784 0 2.75 0h7.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V4.664a.25.25 0 0 0-.073-.177l-2.914-2.914a.25.25 0 0 0-.177-.073ZM8 3.25a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0V7h-1.5a.75.75 0 0 1 0-1.5h1.5V4A.75.75 0 0 1 8 3.25Zm-3 8a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"></path></svg> Files changed**.

   ![Screenshot of the tabs for a pull request. The "Files changed" tab is outlined in dark orange.](/assets/images/help/pull_requests/pull-request-tabs-changed-files.png)
4. Inspect the proposed changes in the pull request and ensure that you are comfortable running your workflows on the pull request branch. You should be especially alert to any proposed changes in the `.github/workflows/` directory that affect workflow files.
5. If you are comfortable with running workflows on the pull request branch, return to the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-comment-discussion" aria-label="comment-discussion" role="img"><path d="M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.458 1.458 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25v-5.5C0 1.784.784 1 1.75 1ZM1.5 2.75v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm13 2a.25.25 0 0 0-.25-.25h-.5a.75.75 0 0 1 0-1.5h.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 14.25 12H14v1.543a1.458 1.458 0 0 1-2.487 1.03L9.22 12.28a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l2.22 2.22v-2.19a.75.75 0 0 1 .75-.75h1a.25.25 0 0 0 .25-.25Z"></path></svg> Conversation** tab, and in the section "*n* workflow(s) awaiting approval", click **Approve workflows to run**.
---

# Canceling a workflow run

You can cancel a workflow run, including all jobs and steps, that is in progress.

## Canceling a workflow run

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the `queued` or `in progress` run that you want to cancel.
5. In the upper-right corner of the workflow, click **Cancel workflow**.
   ![Screenshot showing the summary for a workflow that is currently running. The "Cancel workflow" button is highlighted with a dark orange outline.](/assets/images/help/repository/cancel-check-suite-updated.png)

## Next steps

To learn about the process GitHub uses to cancel a workflow run, as well as the ways you can free up related resources, see [Workflow cancellation reference](/en/actions/reference/workflow-cancellation-reference).
---

# Deleting a workflow run

You can delete a workflow run that has been completed, or is more than two weeks old.

Write access to the repository is required to perform these steps.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)

4. To delete a workflow run, select <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="Show options" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>, then click **Delete workflow run**.

   ![Screenshot of a list of workflow runs. To the right of a run, an icon of three horizontal dots is highlighted with an orange outline.](/assets/images/help/settings/workflow-delete-run.png)

5. Review the confirmation prompt and click **Yes, permanently delete this workflow run**.
---

# Disabling and enabling a workflow

You can disable and re-enable a workflow using the GitHub UI, the REST API, or GitHub CLI.

Disabling a workflow allows you to stop a workflow from being triggered without having to delete the file from the repo. You can easily re-enable the workflow again on GitHub.

Temporarily disabling a workflow can be useful in many scenarios. These are a few examples where disabling a workflow might be helpful:

* A workflow error that produces too many or wrong requests, impacting external services negatively.
* A workflow that is not critical and is consuming too many minutes on your account.
* A workflow that sends requests to a service that is down.
* Workflows on a forked repository that aren't needed (for example, scheduled workflows).

> \[!WARNING]
> To prevent unnecessary workflow runs, scheduled workflows may be disabled automatically. When a public repository is forked, scheduled workflows are disabled by default. In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days.

You can also disable and enable a workflow using the REST API. For more information, see [REST API endpoints for workflows](/en/rest/actions/workflows).

## Disabling a workflow

<div class="ghd-tool webui">

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to disable.
4. Click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="Show workflow options" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg> to display a dropdown menu and click **Disable workflow**.

   ![Screenshot of a workflow. The "Show workflow options" button, shown with a kebab icon, and the "Disable workflow" menu item are outlined in orange.](/assets/images/help/repository/actions-disable-workflow-2022.png)

</div>

<div class="ghd-tool cli">

> \[!NOTE]
> To learn more about GitHub CLI, see [About GitHub CLI](/en/github-cli/github-cli/about-github-cli).

To disable a workflow, use the `workflow disable` subcommand. Replace `workflow` with either the name, ID, or file name of the workflow you want to disable. For example, `"Link Checker"`, `1234567`, or `"link-check-test.yml"`. If you don't specify a workflow, GitHub CLI returns an interactive menu for you to choose a workflow.

```shell
gh workflow disable WORKFLOW
```

</div>

## Enabling a workflow

<div class="ghd-tool webui">

You can re-enable a workflow that was previously disabled.

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. In the left sidebar, click the workflow you want to enable.

   ![Screenshot of the "Actions" page. In the left sidebar, a workflow name is highlighted with an outline in dark orange.](/assets/images/help/repository/actions-select-disabled-workflow-2022.png)

4. Click **Enable workflow**.

</div>

<div class="ghd-tool cli">

To enable a workflow, use the `workflow enable` subcommand. Replace `workflow` with either the name, ID, or file name of the workflow you want to enable. For example, `"Link Checker"`, `1234567`, or `"link-check-test.yml"`. If you don't specify a workflow, GitHub CLI returns an interactive menu for you to choose a workflow.

```shell
gh workflow enable WORKFLOW
```

</div>
---

# Downloading workflow artifacts

You can download archived artifacts before they automatically expire.

By default, GitHub stores build logs and artifacts for 90 days, and you can customize this retention period, depending on the type of repository. For more information, see [Managing GitHub Actions settings for a repository](/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-repository).

Read access to the repository is required to perform these steps.

<div class="ghd-tool webui">

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the run to see the workflow run summary.
5. In the "Artifacts" section, click the artifact you want to download.

   ![Screenshot of the "Artifacts" section of a workflow run. The name of an artifact generated by the run, "artifact," is outlined in orange.](/assets/images/help/repository/artifact-drop-down-updated.png)

</div>

<div class="ghd-tool cli">

> \[!NOTE]
> To learn more about GitHub CLI, see [About GitHub CLI](/en/github-cli/github-cli/about-github-cli).

GitHub CLI will download each artifact into separate directories based on the artifact name. If only a single artifact is specified, it will be extracted into the current directory.

To download all artifacts generated by a workflow run, use the `run download` subcommand. Replace `run-id` with the ID of the run that you want to download artifacts from. If you don't specify a `run-id`, GitHub CLI returns an interactive menu for you to choose a recent run.

```shell
gh run download RUN_ID
```

To download a specific artifact from a run, use the `run download` subcommand. Replace `run-id` with the ID of the run that you want to download artifacts from. Replace `artifact-name` with the name of the artifact that you want to download.

```shell
gh run download RUN_ID -n ARTIFACT_NAME
```

You can specify more than one artifact.

```shell
gh run download RUN_ID> -n ARTIFACT_NAME-1 -n ARTIFACT_NAME-2
```

To download specific artifacts across all runs in a repository, use the `run download` subcommand.

```shell
gh run download -n ARTIFACT_NAME-1 ARTIFACT_NAME-2
```

</div>
---

# Managing caches

You can monitor, filter, and delete dependency caches created from your workflows.

This article describes managing caches with the GitHub web interface, but you can also manage them:

* Using the REST API. See [REST API endpoints for GitHub Actions cache](/en/rest/actions/cache).
* With the `gh cache` subcommand from the command line. See the [GitHub CLI documentation](https://cli.github.com/manual/gh_cache).

## Viewing cache entries

You can use the web interface to view a list of cache entries for a repository. In the cache list, you can see how much disk space each cache is using, when the cache was created, and when the cache was last used.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, under the "Management" section, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-cache" aria-label="cache" role="img"><path d="M2.5 5.724V8c0 .248.238.7 1.169 1.159.874.43 2.144.745 3.62.822a.75.75 0 1 1-.078 1.498c-1.622-.085-3.102-.432-4.204-.975a5.565 5.565 0 0 1-.507-.28V12.5c0 .133.058.318.282.551.227.237.591.483 1.101.707 1.015.447 2.47.742 4.117.742.406 0 .802-.018 1.183-.052a.751.751 0 1 1 .134 1.494C8.89 15.98 8.45 16 8 16c-1.805 0-3.475-.32-4.721-.869-.623-.274-1.173-.619-1.579-1.041-.408-.425-.7-.964-.7-1.59v-9c0-.626.292-1.165.7-1.591.406-.42.956-.766 1.579-1.04C4.525.32 6.195 0 8 0c1.806 0 3.476.32 4.721.869.623.274 1.173.619 1.579 1.041.408.425.7.964.7 1.59 0 .626-.292 1.165-.7 1.591-.406.42-.956.766-1.578 1.04C11.475 6.68 9.805 7 8 7c-1.805 0-3.475-.32-4.721-.869a6.15 6.15 0 0 1-.779-.407Zm0-2.224c0 .133.058.318.282.551.227.237.591.483 1.101.707C4.898 5.205 6.353 5.5 8 5.5c1.646 0 3.101-.295 4.118-.742.508-.224.873-.471 1.1-.708.224-.232.282-.417.282-.55 0-.133-.058-.318-.282-.551-.227-.237-.591-.483-1.101-.707C11.102 1.795 9.647 1.5 8 1.5c-1.646 0-3.101.295-4.118.742-.508.224-.873.471-1.1.708-.224.232-.282.417-.282.55Z"></path><path d="M14.49 7.582a.375.375 0 0 0-.66-.313l-3.625 4.625a.375.375 0 0 0 .295.606h2.127l-.619 2.922a.375.375 0 0 0 .666.304l3.125-4.125A.375.375 0 0 0 15.5 11h-1.778l.769-3.418Z"></path></svg> Caches**.
4. Review the list of cache entries for the repository.

   * To search for cache entries used for a specific branch, click the **Branch** dropdown menu and select a branch. The cache list will display all of the caches used for the selected branch.
   * To search for cache entries with a specific cache key, use the syntax `key: key-name` in the **Filter caches** field. The cache list will display caches from all branches where the key was used.

   ![Screenshot of the list of cache entries.](/assets/images/help/repository/actions-cache-entry-list.png)

## Deleting cache entries

Users with `write` access to a repository can use the GitHub web interface to delete cache entries.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, under the "Management" section, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-cache" aria-label="cache" role="img"><path d="M2.5 5.724V8c0 .248.238.7 1.169 1.159.874.43 2.144.745 3.62.822a.75.75 0 1 1-.078 1.498c-1.622-.085-3.102-.432-4.204-.975a5.565 5.565 0 0 1-.507-.28V12.5c0 .133.058.318.282.551.227.237.591.483 1.101.707 1.015.447 2.47.742 4.117.742.406 0 .802-.018 1.183-.052a.751.751 0 1 1 .134 1.494C8.89 15.98 8.45 16 8 16c-1.805 0-3.475-.32-4.721-.869-.623-.274-1.173-.619-1.579-1.041-.408-.425-.7-.964-.7-1.59v-9c0-.626.292-1.165.7-1.591.406-.42.956-.766 1.579-1.04C4.525.32 6.195 0 8 0c1.806 0 3.476.32 4.721.869.623.274 1.173.619 1.579 1.041.408.425.7.964.7 1.59 0 .626-.292 1.165-.7 1.591-.406.42-.956.766-1.578 1.04C11.475 6.68 9.805 7 8 7c-1.805 0-3.475-.32-4.721-.869a6.15 6.15 0 0 1-.779-.407Zm0-2.224c0 .133.058.318.282.551.227.237.591.483 1.101.707C4.898 5.205 6.353 5.5 8 5.5c1.646 0 3.101-.295 4.118-.742.508-.224.873-.471 1.1-.708.224-.232.282-.417.282-.55 0-.133-.058-.318-.282-.551-.227-.237-.591-.483-1.101-.707C11.102 1.795 9.647 1.5 8 1.5c-1.646 0-3.101.295-4.118.742-.508.224-.873.471-1.1.708-.224.232-.282.417-.282.55Z"></path><path d="M14.49 7.582a.375.375 0 0 0-.66-.313l-3.625 4.625a.375.375 0 0 0 .295.606h2.127l-.619 2.922a.375.375 0 0 0 .666.304l3.125-4.125A.375.375 0 0 0 15.5 11h-1.778l.769-3.418Z"></path></svg> Caches**.
4. To the right of the cache entry you want to delete, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-trash" aria-label="Delete cache" role="img"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path></svg>.

   ![Screenshot of the list of cache entries. A trash can icon, used to delete a cache, is highlighted with a dark orange outline.](/assets/images/help/repository/actions-cache-delete.png)

## Force deleting cache entries

Caches have branch scope restrictions in place, which means some caches have limited usage options. For more information on cache scope restrictions, see [Dependency caching reference](/en/actions/reference/dependency-caching-reference#restrictions-for-accessing-a-cache). If caches limited to a specific branch are using a lot of storage quota, it may cause caches from the `default` branch to be created and deleted at a high frequency.

For example, a repository could have many new pull requests opened, each with their own caches that are restricted to that branch. These caches could take up the majority of the cache storage for that repository. Once a repository has reached its maximum cache storage, the cache eviction policy will create space by deleting the caches in order of last access date, from oldest to most recent. In order to prevent cache thrashing when this happens, you can set up workflows to delete caches on a faster cadence than the cache eviction policy will. You can use the GitHub CLI to delete caches for specific branches.

The following example workflow uses `gh cache` to delete up to 100 caches created by a branch once a pull request is closed.

To run the following example on cross-repository pull requests or pull requests from forks, you can trigger the workflow with the `pull_request_target` event. If you do use `pull_request_target` to trigger the workflow, there are security considerations to keep in mind. For more information, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target).

```yaml
name: Cleanup github runner caches on closed pull requests
on:
  pull_request:
    types:
      - closed

jobs:
  cleanup:
    runs-on: ubuntu-latest
    permissions:
      actions: write
    steps:
      - name: Cleanup
        run: |
          echo "Fetching list of cache keys"
          cacheKeysForPR=$(gh cache list --ref $BRANCH --limit 100 --json id --jq '.[].id')

          ## Setting this to not fail the workflow while deleting cache keys.
          set +e
          echo "Deleting caches..."
          for cacheKey in $cacheKeysForPR
          do
              gh cache delete $cacheKey
          done
          echo "Done"
        env:
          GH_TOKEN: ${{ github.token }}
          GH_REPO: ${{ github.repository }}
          BRANCH: refs/pull/${{ github.event.pull_request.number }}/merge
```

Alternatively, you can use the API to automatically list or delete all caches on your own cadence. For more information, see [REST API endpoints for GitHub Actions cache](/en/rest/actions/cache#about-the-cache-in-github-actions).
---

# Manually running a workflow

When a workflow is configured to run on the workflow_dispatch event, you can run the workflow using the Actions tab on GitHub, GitHub CLI, or the REST API.

## Configuring a workflow to run manually

To run a workflow manually, the workflow must be configured to run on the `workflow_dispatch` event.

To trigger the `workflow_dispatch` event, your workflow must be in the default branch. For more information about configuring the `workflow_dispatch` event, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch).

Write access to the repository is required to perform these steps.

## Running a workflow

<div class="ghd-tool webui">

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. In the left sidebar, click the name of the workflow you want to run.

   ![Screenshot of the "Actions" page. In the left sidebar, a workflow name is highlighted with an outline in dark orange.](/assets/images/help/repository/actions-select-workflow-2022.png)

4. Above the list of workflow runs, click the **Run workflow** button.

   > \[!NOTE]
   > To see the **Run workflow** button, your workflow file must use the `workflow_dispatch` event trigger. Only workflow files that use the `workflow_dispatch` event trigger will have the option to run the workflow manually using the **Run workflow** button. For more information about configuring the `workflow_dispatch` event, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch).

   ![Screenshot of a workflow page. Above the list of workflow runs, a button, labeled "Run workflow", is outlined in dark orange.](/assets/images/help/actions/actions-workflow-dispatch.png)

5. Select the **Branch** dropdown menu and click a branch to run the workflow on.

6. If the workflow requires input, fill in the fields.

7. Click **Run workflow**.

</div>

<div class="ghd-tool cli">

> \[!NOTE]
> To learn more about GitHub CLI, see [About GitHub CLI](/en/github-cli/github-cli/about-github-cli).

To run a workflow, use the `workflow run` subcommand. Replace the `workflow` parameter with either the name, ID, or file name of the workflow you want to run. For example, `"Link Checker"`, `1234567`, or `"link-check-test.yml"`. If you don't specify a workflow, GitHub CLI returns an interactive menu for you to choose a workflow.

```shell
gh workflow run WORKFLOW
```

If your workflow accepts inputs, GitHub CLI will prompt you to enter them. Alternatively, you can use `-f` or `-F` to add an input in `key=value` format. Use `-F` to read from a file.

```shell
gh workflow run greet.yml -f name=mona -f greeting=hello -F data=@myfile.txt
```

You can also pass inputs as JSON by using standard input.

```shell
echo '{"name":"mona", "greeting":"hello"}' | gh workflow run greet.yml --json
```

To run a workflow on a branch other than the repository's default branch, use the `--ref` flag.

```shell
gh workflow run WORKFLOW --ref BRANCH
```

To view the progress of the workflow run, use the `run watch` subcommand and select the run from the interactive list.

```shell
gh run watch
```

</div>

## Running a workflow using the REST API

When using the REST API, you configure the `inputs` and `ref` as request body parameters. If the inputs are omitted, the default values defined in the workflow file are used.

> \[!NOTE]
> You can define up to 25  `inputs` for a `workflow_dispatch` event.

For more information about using the REST API, see [REST API endpoints for workflows](/en/rest/actions/workflows#create-a-workflow-dispatch-event).
---

# Removing workflow artifacts

You can reclaim used GitHub Actions storage by deleting artifacts before they expire on GitHub.

## Deleting an artifact

> \[!WARNING]
> Once you delete an artifact, it cannot be restored.

Write access to the repository is required to perform these steps.

By default, GitHub stores build logs and artifacts for 90 days, and this retention period can be customized. For more information, see [Billing and usage](/en/actions/learn-github-actions/usage-limits-billing-and-administration#artifact-and-log-retention-policy).

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the run to see the workflow run summary.
5. Under **Artifacts**, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-trash" aria-label="Remove artifact ARTIFACT-NAME" role="img"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path></svg> next to the artifact you want to remove.

   ![Screenshot showing artifacts created during a workflow run. A trash can icon, used to remove an artifact, is outlined in dark orange.](/assets/images/help/repository/actions-delete-artifact-updated.png)

## Setting the retention period for an artifact

Retention periods for artifacts and logs can be configured at the repository, organization, and enterprise level. For more information, see [Billing and usage](/en/actions/learn-github-actions/usage-limits-billing-and-administration#artifact-and-log-retention-policy).

You can also define a custom retention period for individual artifacts using the `actions/upload-artifact` action in a workflow. For more information, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts#configuring-a-custom-artifact-retention-period).

## Finding the expiration date of an artifact

You can use the API to confirm the date that an artifact is scheduled to be deleted. For more information, see the `expires_at` value returned by the REST API. For more information, see [REST API endpoints for GitHub Actions artifacts](/en/rest/actions/artifacts).

## Artifacts from deleted workflow runs

When a workflow run is deleted all artifacts associated with the run are also deleted from storage. You can delete a workflow run using the GitHub Actions UI, the REST API, or using the GitHub CLI, see: [Deleting a workflow run](/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/deleting-a-workflow-run), [Delete a workflow run](/en/rest/actions/workflow-runs?apiVersion=2022-11-28#delete-a-workflow-run), or [gh run delete](https://cli.github.com/manual/gh_run_delete).
---

# Re-running workflows and jobs

You can re-run a workflow run, all failed jobs in a workflow run, or specific jobs in a workflow run up to 30 days after its initial run.

> \[!NOTE]
> Re-run workflows use the privileges of the actor who initially triggered the workflow, not the privileges of the actor who initiated the re-run. The workflow will also use the same `GITHUB_SHA` (commit SHA) and `GITHUB_REF` (git ref) of the original event that triggered the workflow run.

## Re-running all the jobs in a workflow

<div class="ghd-tool webui">

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)

4. From the list of workflow runs, click the name of the run to see the workflow run summary.

5. In the upper-right corner of the workflow, re-run jobs.

   * If any jobs failed, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-sync" aria-label="sync" role="img"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path></svg> Re-run jobs** dropdown menu and click **Re-run all jobs**.
   * If no jobs failed, click **Re-run all jobs**.

6. Optionally, to enable runner diagnostic logging and step debug logging for the re-run, select **Enable debug logging**. For more information, see [Enabling debug logging](/en/actions/how-tos/monitor-workflows/enable-debug-logging).

7. Click **Re-run jobs**.

</div>

<div class="ghd-tool cli">

1. To re-run a failed workflow run, use the `run rerun` subcommand, replacing `RUN_ID` with the ID of the failed run that you want to re-run. If you don't specify a `run-id`, GitHub CLI returns an interactive menu for you to choose a recent failed run.

   ```shell copy
   gh run rerun RUN_ID
   ```

   To enable runner diagnostic logging and step debug logging for the re-run, use the `--debug` flag.

   ```shell copy
   gh run rerun RUN_ID --debug
   ```

2. To view the progress of the workflow run, use the `run watch` subcommand and select the run from the interactive list.

   ```shell copy
   gh run watch
   ```

</div>

## Re-running failed jobs in a workflow

<div class="ghd-tool webui">

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the run to see the workflow run summary.
5. In the upper-right corner of the workflow, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-sync" aria-label="sync" role="img"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path></svg> Re-run jobs** dropdown menu, and click **Re-run failed jobs**.
6. Optionally, to enable runner diagnostic logging and step debug logging for the re-run, select **Enable debug logging**. For more information, see [Enabling debug logging](/en/actions/how-tos/monitor-workflows/enable-debug-logging).
7. Click **Re-run jobs**.

</div>

<div class="ghd-tool cli">

To re-run failed jobs in a workflow run, use the `run rerun` subcommand with the `--failed` flag. Replace `RUN_ID` with the ID of the run for which you want to re-run failed jobs. If you don't specify a `run-id`, GitHub CLI returns an interactive menu for you to choose a recent failed run.

```shell
gh run rerun RUN_ID --failed
```

To enable runner diagnostic logging and step debug logging for the re-run, use the `--debug` flag.

```shell
gh run rerun RUN_ID --failed --debug
```

</div>

## Re-running a specific job in a workflow

<div class="ghd-tool webui">

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)

3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)

4. From the list of workflow runs, click the name of the run to see the workflow run summary.

5. Under the "Jobs" section of the left sidebar, next to the job that you want to re-run, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-sync" aria-label="The re-run icon" role="img"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path></svg>.

6. Optionally, to enable runner diagnostic logging and step debug logging for the re-run, select **Enable debug logging**. For more information, see [Enabling debug logging](/en/actions/how-tos/monitor-workflows/enable-debug-logging).

7. Click **Re-run jobs**.

</div>

<div class="ghd-tool cli">

To re-run a specific job in a workflow run, use the `run rerun` subcommand with the `--job` flag. Replace `JOB_ID` with the ID of the job that you want to re-run.

```shell
gh run rerun --job JOB_ID
```

To enable runner diagnostic logging and step debug logging for the re-run, use the `--debug` flag.

```shell
gh run rerun --job JOB_ID --debug
```

</div>

## Reviewing previous workflow runs

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the run to see the workflow run summary.
5. To the right of the run name, select the **Latest** dropdown menu and click a previous run attempt.
---

# Skipping workflow runs

You can skip workflow runs triggered by the push and pull_request events by including a command in your commit message.

> \[!NOTE]
> If a workflow is skipped due to [path filtering](/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore), [branch filtering](/en/actions/using-workflows/workflow-syntax-for-github-actions#onpull_requestpull_request_targetbranchesbranches-ignore) or a commit message (see below), then checks associated with that workflow will remain in a "Pending" state. A pull request that requires those checks to be successful will be blocked from merging.

Workflows that would otherwise be triggered using `on: push` or `on: pull_request` won't be triggered if you add any of the following strings to the commit message in a push, or the HEAD commit of a pull request:

* `[skip ci]`
* `[ci skip]`
* `[no ci]`
* `[skip actions]`
* `[actions skip]`

Alternatively, you can add a `skip-checks` trailer to your commit message. The trailers section should be included at the end of your commit message and be preceded by two empty lines. If you already have other trailers in your commit message, `skip-checks` should be last. You can use either of the following:

* `skip-checks:true`
* `skip-checks: true`

By default, Git automatically removes consecutive newlines. To leave the commit message exactly as you entered it, use the `--cleanup=verbatim` option on your commit. For more information, see [`--cleanup=<mode>`](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---cleanupltmodegt) in the Git documentation.

You won't be able to merge the pull request if your repository is configured to require specific checks to pass first. To allow the pull request to be merged you can push a new commit to the pull request without the skip instruction in the commit message.

> \[!NOTE]
> Skip instructions only apply to the `push` and `pull_request` events. For example, adding `[skip ci]` to a commit message won't stop a workflow that's triggered `on: pull_request_target` from running.

Skip instructions only apply to the workflow run(s) that would be triggered by the commit that contains the skip instructions. You can also disable a workflow from running. For more information, see [Disabling and enabling a workflow](/en/actions/managing-workflow-runs/disabling-and-enabling-a-workflow).