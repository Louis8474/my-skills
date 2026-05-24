# Billing and usage

There are usage limits for GitHub Actions workflows. Usage charges apply to repositories that go beyond the amount of free minutes and storage for a repository.

## About billing for GitHub Actions

GitHub Actions usage is free for standard GitHub-hosted runners in public repositories, and for self-hosted runners. See [Choosing the runner for a job](/en/actions/writing-workflows/choosing-where-your-workflow-runs/choosing-the-runner-for-a-job#standard-github-hosted-runners-for-public-repositories). For private repositories, each GitHub account receives a quota of free minutes and storage for use with GitHub-hosted runners, depending on the account's plan. Any usage beyond the included amounts is billed to your account. For more information, see [GitHub Actions billing](/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions).

## Availability

GitHub Actions is available on all GitHub products, but GitHub Actions is not available for private repositories owned by accounts using legacy per-repository plans. For more information, see [GitHub's plans](/en/get-started/learning-about-github/githubs-plans).

## Usage limits and policy

There are several limits on GitHub Actions usage when using GitHub-hosted runners. See [Actions limits](/en/actions/reference/actions-limits).

In addition to the usage limits, you must ensure that you use GitHub Actions within the [GitHub Terms of Service](/en/site-policy/github-terms/github-terms-of-service). For more information on GitHub Actions-specific terms, see the [GitHub Additional Product Terms](/en/site-policy/github-terms/github-terms-for-additional-products-and-features#a-actions-usage).

## GitHub Actions usage metrics

Organization owners and users with the "View organization Actions metrics" permission can view GitHub Actions usage metrics for their organization. These metrics can help you understand how and where your Actions minutes are being used. For more information, see [Viewing GitHub Actions metrics for your organization](/en/enterprise-cloud@latest/organizations/collaborating-with-groups-in-organizations/viewing-usage-metrics-for-github-actions).

When you view usage metrics, it is important to remember that GitHub Actions usage metrics do not apply minute multipliers to the metrics displayed. While they *can* help you understand your bill, their primary purpose is to help you understand how and where Actions minutes are being used in your organization.

For more information about minute multipliers, see [GitHub Actions billing](/en/billing/concepts/product-billing/github-actions#baseline-minute-costs).

## Billing for reusable workflows

If you reuse a workflow, billing is always associated with the caller workflow. Assignment of GitHub-hosted runners is always evaluated using only the caller's context. The caller cannot use GitHub-hosted runners from the called repository.

For more information see, [Reuse workflows](/en/actions/using-workflows/reusing-workflows).

## Next steps

You can manage your GitHub Actions usage and retention policies for your repository, organization, or enterprise account. For more information, see:

* [Managing GitHub Actions settings for a repository](/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
* [Configuring the retention period for GitHub Actions artifacts and logs in your organization](/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization)
* [Disabling or limiting GitHub Actions for your organization](/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization)
* [Enforcing policies for GitHub Actions in your enterprise](/en/enterprise-cloud@latest/admin/policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise)