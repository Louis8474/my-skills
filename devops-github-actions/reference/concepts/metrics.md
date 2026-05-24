# About GitHub Actions metrics

Learn about the GitHub Actions metrics available for your organizations and repositories.

## About GitHub Actions metrics

GitHub Actions metrics provide insights into how your workflows and jobs are performing at the organization and repository levels. There are two types of metrics to help you analyze different aspects of your workflows:

* **GitHub Actions usage metrics:** Usage metrics help you track how many minutes your workflows and jobs consume. You can use this data to understand the cost of running Actions and ensure you're staying within your plan limits. This is especially useful for identifying high-usage workflows or repositories.
* **GitHub Actions performance metrics:** Performance metrics focus on the efficiency and reliability of your workflows and jobs. With performance metrics, you can monitor key indicators like job run times, queue times, and failure rates to identify bottlenecks, slow-running jobs, or frequently failing workflows.

## Enabling access to GitHub Actions metrics

Organization owners can create custom organization roles to allow people to view GitHub Actions usage metrics for their organization. To provide users with access, select the "View organization Actions metrics" role when creating a custom organization role. For more information, see [Permissions of custom organization roles](/en/organizations/managing-peoples-access-to-your-organization-with-roles/about-custom-organization-roles).

## About GitHub Actions usage metrics

GitHub Actions usage metrics enable you to analyze how your organization is using Actions minutes. You can view usage information related to:

* **Workflows**. View usage data for each workflow in your organization, and use this information to identify opportunities for optimization, such as refactoring a workflow or using a larger runner.
* **Jobs**. See which jobs are the most resource-intensive and where they are running.
* **Repositories**. Get a high-level snapshot of each repository in your organization and their volume of Actions minutes usage.
* **Runtime OS**. Understand how runners for each operating system are using Actions minutes and what types of operating systems your workflows are running on most often.
* **Runner type**. Compare how your self-hosted runners and GitHub-hosted runners use Actions minutes and the volume of workflow runs for each type of runner.

## About GitHub Actions performance metrics

GitHub Actions performance metrics enables you to analyze the efficiency and reliability of your workflows. You can view performance information such as average run times, average queue times, and failure rates, related to:

* **Workflows**. View performance data for each workflow in your organization, including average run time and job failures. Use this information to identify inefficient workflows and run stability.
* **Jobs**. View performance data for each individual job to, including average run time, average queue time, and job failures. Use this information to identify inefficient jobs.
* **Repositories**. Get a high-level snapshot of each repository in your organization and their average performance metrics.
* **Runtime OS**. Understand how runners for each operating system are performing.
* **Runner type**. Compare the performance of self-hosted runners and GitHub-hosted runners, to make decisions about runner types.

## Next steps

To learn how to find metrics for your organization or repository, see [Viewing GitHub Actions metrics](/en/actions/how-tos/administering-github-actions/viewing-github-actions-metrics).