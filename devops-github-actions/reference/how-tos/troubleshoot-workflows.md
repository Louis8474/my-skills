# Troubleshooting workflows

You can use the tools in GitHub Actions to debug your workflows.

## Initial troubleshooting suggestions

There are several ways you can troubleshoot failed workflow runs.

> \[!NOTE] If you are on a GitHub Copilot Free subscription, this will count towards your monthly chat message limit.

### Using GitHub Copilot

To open a chat with GitHub Copilot about a failed workflow run, you can either:

* Next to the failed check in the merge box, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="kebab-horizontal" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>**, then click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-copilot" aria-label="copilot" role="img"><path d="M7.998 15.035c-4.562 0-7.873-2.914-7.998-3.749V9.338c.085-.628.677-1.686 1.588-2.065.013-.07.024-.143.036-.218.029-.183.06-.384.126-.612-.201-.508-.254-1.084-.254-1.656 0-.87.128-1.769.693-2.484.579-.733 1.494-1.124 2.724-1.261 1.206-.134 2.262.034 2.944.765.05.053.096.108.139.165.044-.057.094-.112.143-.165.682-.731 1.738-.899 2.944-.765 1.23.137 2.145.528 2.724 1.261.566.715.693 1.614.693 2.484 0 .572-.053 1.148-.254 1.656.066.228.098.429.126.612.012.076.024.148.037.218.924.385 1.522 1.471 1.591 2.095v1.872c0 .766-3.351 3.795-8.002 3.795Zm0-1.485c2.28 0 4.584-1.11 5.002-1.433V7.862l-.023-.116c-.49.21-1.075.291-1.727.291-1.146 0-2.059-.327-2.71-.991A3.222 3.222 0 0 1 8 6.303a3.24 3.24 0 0 1-.544.743c-.65.664-1.563.991-2.71.991-.652 0-1.236-.081-1.727-.291l-.023.116v4.255c.419.323 2.722 1.433 5.002 1.433ZM6.762 2.83c-.193-.206-.637-.413-1.682-.297-1.019.113-1.479.404-1.713.7-.247.312-.369.789-.369 1.554 0 .793.129 1.171.308 1.371.162.181.519.379 1.442.379.853 0 1.339-.235 1.638-.54.315-.322.527-.827.617-1.553.117-.935-.037-1.395-.241-1.614Zm4.155-.297c-1.044-.116-1.488.091-1.681.297-.204.219-.359.679-.242 1.614.091.726.303 1.231.618 1.553.299.305.784.54 1.638.54.922 0 1.28-.198 1.442-.379.179-.2.308-.578.308-1.371 0-.765-.123-1.242-.37-1.554-.233-.296-.693-.587-1.713-.7Z"></path><path d="M6.25 9.037a.75.75 0 0 1 .75.75v1.501a.75.75 0 0 1-1.5 0V9.787a.75.75 0 0 1 .75-.75Zm4.25.75v1.501a.75.75 0 0 1-1.5 0V9.787a.75.75 0 0 1 1.5 0Z"></path></svg> Explain error**.
* In the merge box, click on the failed check. At the top of the workflow run summary page, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-copilot" aria-label="copilot" role="img"><path d="M7.998 15.035c-4.562 0-7.873-2.914-7.998-3.749V9.338c.085-.628.677-1.686 1.588-2.065.013-.07.024-.143.036-.218.029-.183.06-.384.126-.612-.201-.508-.254-1.084-.254-1.656 0-.87.128-1.769.693-2.484.579-.733 1.494-1.124 2.724-1.261 1.206-.134 2.262.034 2.944.765.05.053.096.108.139.165.044-.057.094-.112.143-.165.682-.731 1.738-.899 2.944-.765 1.23.137 2.145.528 2.724 1.261.566.715.693 1.614.693 2.484 0 .572-.053 1.148-.254 1.656.066.228.098.429.126.612.012.076.024.148.037.218.924.385 1.522 1.471 1.591 2.095v1.872c0 .766-3.351 3.795-8.002 3.795Zm0-1.485c2.28 0 4.584-1.11 5.002-1.433V7.862l-.023-.116c-.49.21-1.075.291-1.727.291-1.146 0-2.059-.327-2.71-.991A3.222 3.222 0 0 1 8 6.303a3.24 3.24 0 0 1-.544.743c-.65.664-1.563.991-2.71.991-.652 0-1.236-.081-1.727-.291l-.023.116v4.255c.419.323 2.722 1.433 5.002 1.433ZM6.762 2.83c-.193-.206-.637-.413-1.682-.297-1.019.113-1.479.404-1.713.7-.247.312-.369.789-.369 1.554 0 .793.129 1.171.308 1.371.162.181.519.379 1.442.379.853 0 1.339-.235 1.638-.54.315-.322.527-.827.617-1.553.117-.935-.037-1.395-.241-1.614Zm4.155-.297c-1.044-.116-1.488.091-1.681.297-.204.219-.359.679-.242 1.614.091.726.303 1.231.618 1.553.299.305.784.54 1.638.54.922 0 1.28-.198 1.442-.379.179-.2.308-.578.308-1.371 0-.765-.123-1.242-.37-1.554-.233-.296-.693-.587-1.713-.7Z"></path><path d="M6.25 9.037a.75.75 0 0 1 .75.75v1.501a.75.75 0 0 1-1.5 0V9.787a.75.75 0 0 1 .75-.75Zm4.25.75v1.501a.75.75 0 0 1-1.5 0V9.787a.75.75 0 0 1 1.5 0Z"></path></svg> Explain error**.

This opens a chat window with GitHub Copilot, where it will provide instructions to resolve the issue.

### Using workflow run logs

Each workflow run generates activity logs that you can view, search, and download. For more information, see [Using workflow run logs](/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs).

### Enabling debug logging

If the workflow logs do not provide enough detail to diagnose why a workflow, job, or step is not working as expected, you can enable additional debug logging. For more information, see [Enabling debug logging](/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging).

If your workflow uses specific tools or actions, enabling their debug or verbose logging options can help generate more detailed output for troubleshooting.
For example, you can use `npm install --verbose` for npm or `GIT_TRACE=1 GIT_CURL_VERBOSE=1 git ...` for git.

## Reviewing billing errors

Actions usage includes runner minutes and storage for [workflow artifacts](/en/actions/writing-workflows/choosing-what-your-workflow-does/storing-and-sharing-data-from-a-workflow). For more information, see [GitHub Actions billing](/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions).

### Setting a budget

Setting an Actions budget may help immediately unblock workflows failing due to billing or storage errors. It will allow further minutes and storage usage to be billed up to the set budget amount. To learn more, see [Setting up budgets to control spending on metered products](/en/billing/managing-your-billing/preventing-overspending).

## Reviewing GitHub Actions activity with metrics

To analyze the efficiency and reliability of your workflows using metrics, see [Viewing GitHub Actions metrics](/en/actions/administering-github-actions/viewing-github-actions-metrics).

## Troubleshooting workflow triggers

You can review your workflow's `on:` field to understand what is expected to trigger the workflow. For more information, see [Triggering a workflow](/en/actions/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow).

For a full list of available events, see [Events that trigger workflows](/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows).

### Triggering event conditions

Some triggering events only run from the default branch (i.e. `issues`, `schedule`). Workflow file versions that exist outside of the default branch will not trigger on these events.

Workflows will not run on `pull_request` activity if the pull request has a merge conflict.

Workflows that would otherwise be triggered on `push` or `pull_request` activity will be skipped if the commit message contains a skip annotation. For more information, see [Skipping workflow runs](/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/skipping-workflow-runs).

### Scheduled workflows running at unexpected times

Scheduled events can be delayed during periods of high loads of GitHub Actions workflow runs.

High load times include the start of every hour. If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour. For more information, see [Events that trigger workflows](/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule).

### Filtering and diff limits

Specific events allow for filtering by branch, tag, and/or paths you can customize. Workflow run creation will be skipped if the filter conditions apply to filter out the workflow.

You can use special characters with filters. For more information, see [Workflow syntax for GitHub Actions](/en/actions/writing-workflows/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet).

For path filtering, evaluating diffs is limited to the first 300 files. If there are files changed that are not matched in the first 300 files returned by the filter, the workflow will not be run. For more information, see [Workflow syntax for GitHub Actions](/en/actions/writing-workflows/workflow-syntax-for-github-actions#git-diff-comparisons).

## Troubleshoot workflow execution

Workflow execution involves any issues seen after the workflow was triggered and a workflow run has been created.

### Debugging job conditions

If a job was skipped unexpectedly, or ran when you expected it to be skipped, you can view the expression evaluation to understand why:

1. Click on the job in the workflow run.
2. Download the log archive from the job's menu.
3. Open the `JOB-NAME/system.txt` file.
4. Look for the `Evaluating`, `Expanded`, and `Result` lines.

The `Expanded` line shows the actual runtime values that were substituted into your `if` condition, making it clear why the expression evaluated to `true` or `false`.

For more information, see [Viewing job condition expression logs](/en/actions/how-tos/monitor-workflows/view-job-condition-logs).

### Canceling Workflows

If standard cancellation through the [UI](/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/canceling-a-workflow) or [API](/en/rest/actions/workflow-runs?apiVersion=2022-11-28#cancel-a-workflow-run) does not process as expected, there may be a conditional statement configured for your running workflow job(s) that causes it to not cancel.

In these cases, you can leverage the API to force cancel the run. For more information, see [REST API endpoints for workflow runs](/en/rest/actions/workflow-runs?apiVersion=2022-11-28#force-cancel-a-workflow-run).

A common cause can be using the `always()` [status check function](/en/actions/writing-workflows/choosing-what-your-workflow-does/evaluate-expressions-in-workflows-and-actions#status-check-functions) which returns `true`, even on cancellation. An alternative is to use the inverse of the `cancelled()` function, `${{ !cancelled() }}`.

For more information, see [Using conditions to control job execution](/en/actions/writing-workflows/choosing-when-your-workflow-runs/using-conditions-to-control-job-execution) and [Canceling a workflow run](/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/canceling-a-workflow#steps-github-takes-to-cancel-a-workflow-run).

## Troubleshooting runners

### Defining runner labels

GitHub-hosted runners leverage [preset labels](/en/actions/using-github-hosted-runners/using-github-hosted-runners/about-github-hosted-runners#standard-github-hosted-runners-for-public-repositories) maintained through the [`actions/runner-images`](https://github.com/actions/runner-images?tab=readme-ov-file#available-images) repository.

We recommend using unique label names for larger and self-hosted runners. If a label matches to any of the existing preset labels, there can be runner assignment issues where there is no guarantee on which matching runner option the job will run on.

### Self-hosted runners

If you use self-hosted runners, you can view their activity and diagnose common issues.

For more information, see [Monitoring and troubleshooting self-hosted runners](/en/actions/how-tos/manage-runners/self-hosted-runners/monitor-and-troubleshoot).

## Networking troubleshooting suggestions

Our support is limited for network issues that involve:

* Your networks
* External networks
* Third-party systems
* General internet connectivity

To view GitHub's realtime platform status, check [GitHub Status](https://githubstatus.com/).

For other network-related issues, review your organization's network settings and verify the status of any third-party services you're accessing. If problems persist, consider reaching out to your network administrators for further assistance.

If you're unsure about the issue, contact GitHub Support. For details on how to contact support, see [Contacting GitHub Support](/en/support/contacting-github-support).

### DNS

Issues may occur from Domain Name System (DNS) configuration, resolution, or resolver problems. We recommend you review available logs, vendor documentation, or consult with your administrators for additional assistance.

### Firewalls

Activities may become blocked by firewalls. If this occurs, you may want to review available logs, vendor documentation, or consult with your administrators for additional assistance.

### Proxies

Activities could fail when using a proxy for communications. It's good practice to review available logs, vendor documentation, or consult with your administrators for additional assistance.

Refer to [Using proxy servers with a runner](/en/actions/how-tos/manage-runners/self-hosted-runners/use-proxy-servers) for information about configuring the runner application to utilize a proxy.

### Subnets

It is possible to encounter issues with subnets in use or overlaps with an existing network, such as within virtual cloud provider or Docker networks. In such cases, we recommend you review your network topology and subnets in use.

### Certificates

Issues may occur from self-signed or custom certificate chains and certificate stores. You can check that a certificate in use has not expired and is currently trusted. Certificates may be inspected with `curl` or similar tools. You can also review available logs, vendor documentation, or consult with your administrators for additional assistance.

### IP lists

IP allow or deny lists may disrupt expected communications. If there is a problem, you should review available logs, vendor documentation, or consult with your administrators for additional assistance.

For information on GitHub's IP addresses, such as those used by GitHub-hosted runners, see [About GitHub's IP addresses](/en/authentication/keeping-your-account-and-data-secure/about-githubs-ip-addresses).

Static IP addresses are available for use with GitHub-hosted larger runners. See [Managing larger runners](/en/actions/how-tos/manage-runners/larger-runners/manage-larger-runners) for more information.

### Operating systems and software applications

In addition to firewalls or proxies, customizations performed to GitHub-hosted runners, such as installing additional software packages, may result in communication disruptions. For information about available customization options, see [Customizing GitHub-hosted runners](/en/actions/how-tos/manage-runners/github-hosted-runners/customize-runners).

* For self-hosted runners, learn more about necessary endpoints in [Self-hosted runners reference](/en/actions/reference/runners/self-hosted-runners).

* For help configuring WireGuard, see [Using WireGuard to create a network overlay](/en/actions/how-tos/manage-runners/github-hosted-runners/connect-to-a-private-network/connect-with-wireguard).

* For details about configuring OpenID Connect (OIDC), see [Using an API gateway with OIDC](/en/actions/how-tos/manage-runners/github-hosted-runners/connect-to-a-private-network/connect-with-oidc).

### Azure private networking for GitHub-hosted runners

Issues may arise from the use of GitHub-hosted runners within your configured Azure Virtual Networks (VNETs) settings.

For troubleshooting advice, see [Troubleshooting Azure private network configurations for GitHub-hosted runners in your organization](/en/organizations/managing-organization-settings/troubleshooting-azure-private-network-configurations-for-github-hosted-runners-in-your-organization) or [Troubleshooting Azure private network configurations for GitHub-hosted runners in your enterprise](/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/troubleshooting-azure-private-network-configurations-for-github-hosted-runners-in-your-enterprise) in the GitHub Enterprise Cloud docs.