# Migrating from self-hosted runners to GitHub-hosted runners

Learn how to assess your current CI infrastructure and migrate workflows from self-hosted runners to GitHub-hosted runners.

You can run workflows on GitHub-hosted or self-hosted runners, or use a mixture of runner types.

This tutorial shows you how to assess your current use of runners, then migrate workflows from self-hosted runners to GitHub-hosted runners efficiently.

## 1. Assess your current CI infrastructure

Migrating from self-hosted runners to GitHub-hosted larger runners begins with a thorough assessment of your current CI infrastructure. If you take the time to match specifications and environments carefully, you will minimize the time spent fixing problems when you start running workflows on different runners.

1. Create an inventory of each machine specification used to run workflows, including CPU cores, RAM, storage, chip architecture, and operating system.
2. Note if any of the runners are part of a runner group or have a label. You can use this information to simplify migration of workflows to new runners.
3. Document any custom images and pre-installed dependencies that workflows rely on, as these will influence your migration strategy.
4. Identify which workflows currently target self-hosted runners, and why. For example, in GitHub Actions usage metrics, use the **Jobs** tab and filter by runner label (such as `self-hosted` or a custom label) to see which repositories and jobs are using that label. If you need to validate specific workflow files, you can also use code search to find workflow files that reference `runs-on: self-hosted` or other self-hosted labels.
5. Identify workflows that access private network resources (for example, internal package registries, private APIs, databases, or on-premises services), since these may require additional networking configuration.

## 2. Map your processing requirements to GitHub-hosted runner types

GitHub offers managed runners in multiple operating systems—Linux, Windows, and macOS—with options for GPU-enabled machines. See [Larger runners reference](/en/actions/reference/runners/larger-runners).

1. Map each distinct machine specification in your inventory to a suitable GitHub-hosted runner specification.
2. Make a note of any self-hosted runners where there is no suitable GitHub-hosted runner.
3. Exclude any workflows that must continue to run on self-hosted runners from your migration plans.

## 3. Estimate capacity requirements

Before you provision GitHub-hosted runners, estimate how much compute capacity your workflows will need. Reviewing your current self-hosted runner usage helps you choose appropriate runner sizes, set concurrency limits, and forecast potential cost changes.

1. In the upper-right corner of GitHub, click your profile picture, then click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-organization" aria-label="organization" role="img"><path d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75Zm-.25-1.75c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75Zm4 3A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"></path></svg> Organizations**.

2. Click the name of your organization.

3. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-graph" aria-label="graph" role="img"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path></svg> Insights**.

   ![Screenshot of the horizontal navigation bar for an organization. A tab, labeled with a graph icon and "Insights," is outlined in dark orange.](/assets/images/help/organizations/org-nav-insights-tab.png)

4. In the "Insights" navigation menu, click **Actions Usage Metrics**.

5. Click on the tab that contains the metrics you would like to view. See [About GitHub Actions metrics](/en/actions/concepts/metrics).

6. Review the following data points to estimate hosted runner capacity:

   * **Total minutes consumed**: Helps you estimate baseline compute demand.
   * **Number of workflow runs**: Identifies peak activity times that may require more concurrency.
   * **Job distribution across OS types**: Ensures you provision the right mix of Linux, Windows, and macOS runners.
   * **Runner labels (Jobs tab)**: Filter by a runner label to understand where a label is used.

7. Convert your findings into a capacity plan:

   * Match high-usage workflows to larger runner sizes where appropriate.
   * Identify workflows that may benefit from pre-built or custom images to reduce runtime.
   * Estimate concurrency by determining how many jobs typically run simultaneously.

8. Make a note of any gaps:

   * Workflows with hard dependencies your current hosted runner images do not support.
   * Jobs with unusually long runtimes or bespoke environment needs. (You may need custom images for these.)

Your capacity plan will guide how many runners to provision, which machine types to use, and how to configure runner groups and policies in the next steps.

## 4. Configure runner groups and policies

After estimating your capacity needs, configure runner groups and access policies so your GitHub-hosted runners are available to the right organizations and workflows.

Configuring runner groups before provisioning runners helps ensure that migration doesn’t accidentally open access too broadly or create unexpected cost increases.

1. Create runner groups at the enterprise level to define who can use your hosted runners. See [Controlling access to larger runners](/en/enterprise-cloud@latest/actions/how-tos/manage-runners/larger-runners/control-access#creating-a-runner-group-for-an-enterprise).

   Use runner groups to scope access by organization, repository, or workflow. If you are migrating from self-hosted runners, consider reusing existing runner group names or labels where possible. This allows workflows to continue working without changes when you switch to GitHub-hosted runners.

2. Add new GitHub-hosted runners to the appropriate group and set concurrency limits based on the usage patterns you identified in step 3. For details on automatic scaling, see [Managing larger runners](/en/actions/how-tos/manage-runners/larger-runners/manage-larger-runners#configuring-autoscaling-for-larger-runners).

3. Review policy settings to ensure runners are only used by the intended workflows. For example, restricting use to specific repositories or preventing untrusted workflows from accessing more powerful machine types.

> \[!NOTE] macOS larger runners cannot be added to runner groups and must be referenced directly in your workflow files.

## 5. Set up GitHub-hosted runners

Next, provision your GitHub-hosted runners based on the machine types and capacity you identified earlier.

1. Choose the machine size and operating system that match your workflow requirements. For available images and specifications, see [Larger runners reference](/en/actions/reference/runners/larger-runners#runner-images).

2. Assign each runner to a runner group and configure concurrency limits to control how many jobs can run at the same time.

3. Select an image type:

   * Use GitHub-managed images for a maintained, frequently updated environment.
   * Use custom images when you need pre-installed dependencies to reduce setup time. See [Using custom images](/en/actions/how-tos/manage-runners/larger-runners/use-custom-images).

4. Apply any required customizations, such as environment variables, software installation, or startup scripts. For more examples, see [Customizing GitHub-hosted runners](/en/actions/how-tos/manage-runners/github-hosted-runners/customize-runners).

5. Optionally, configure private networking if runners must access internal resources. See [Private networking with GitHub-hosted runners](/en/enterprise-cloud@latest/actions/concepts/runners/private-networking).

### Configure private connectivity options

If your workflows need access to private resources (for example, internal package registries, private APIs, databases, or on-premises services), choose an approach that fits your network and security requirements.

#### Configure Azure Private Networking

Run GitHub-hosted runners inside an Azure Virtual Network (VNET) for secure access to internal resources.

1. Create an Azure Virtual Network (VNET) and configure subnets and network security groups for your runners.
2. Enable Azure private networking for your runner group. See [Configuring private networking for GitHub-hosted runners in your enterprise](/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/configuring-private-networking-for-github-hosted-runners-in-your-enterprise#1-add-a-new-network-configuration-for-your-enterprise)
3. Apply network configuration, such as NSGs and firewall rules, to control ingress and egress traffic.
4. Update workflow targeting to use the runner group that is configured for private networking.

For detailed instructions, see:

* [Configuring private networking for GitHub-hosted runners in your organization](/en/organizations/managing-organization-settings/configuring-private-networking-for-github-hosted-runners-in-your-organization)
* [Configuring private networking for GitHub-hosted runners in your enterprise](/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/configuring-private-networking-for-github-hosted-runners-in-your-enterprise)

#### Connect using a WireGuard overlay network

If Azure private networking is not applicable (for example, because your target network is on-premises or in another cloud), you can use a VPN overlay such as WireGuard to provide network-level access to private resources.

For detailed instructions and examples, see [Using WireGuard to create a network overlay](/en/actions/how-tos/manage-runners/github-hosted-runners/connect-to-a-private-network/connect-with-wireguard).

#### Use OIDC with an API gateway for trusted access to private resources

If you don’t need the runner to join your private network, you can use OIDC to establish trusted, short-lived access to a service you expose via an API gateway. This approach can reduce the need for long-lived secrets and limits network access to the specific endpoints your workflow needs.

For detailed instructions and examples, see [Using an API gateway with OIDC](/en/actions/how-tos/manage-runners/github-hosted-runners/connect-to-a-private-network/connect-with-oidc).

## 6. Update workflows to use the new runners

After your GitHub-hosted runners are configured, update your workflow files to target them.

1. Reuse existing labels if you assigned your new runners to the same runner group names your self-hosted runners used. In this case, workflows will automatically use the new runners without changes.

2. If you created new runner groups or labels, update the runs-on field in your workflow YAML files. For example:

   ```yaml
   jobs:
     build:
       runs-on: [github-larger-runner, linux-x64]
       steps:
         - name: Checkout code
           uses: actions/checkout@v5
         - name: Build project
           run: make build
   ```

3. Check for hard-coded references to self-hosted labels (such as `self-hosted`, `linux-x64`, or custom labels) and replace them with the appropriate GitHub-hosted runner labels.

4. Test each updated workflow to ensure it runs correctly on the new runners. Monitor for any issues related to environment differences or missing dependencies.

## 7. Remove unused self-hosted runners

After your workflows have been updated and tested on GitHub-hosted runners, remove any self-hosted runners that are no longer needed. This prevents jobs from accidentally targeting outdated infrastructure. See [Removing self-hosted runners](/en/actions/how-tos/manage-runners/self-hosted-runners/remove-runners).

Before you remove self-hosted runners, verify that you have fully migrated:

* In GitHub Actions usage metrics, use the **Jobs** tab and filter by runner label (for example, `self-hosted` or your custom labels) to confirm no repositories or jobs are still using self-hosted runners.