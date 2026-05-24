# Deploy

---

# Configuring custom deployment protection rules

Use GitHub Apps to automate protecting deployments with third-party systems.

> \[!NOTE]
> Custom deployment protection rules are currently in public preview and subject to change.

## About custom deployment protection rules

Custom deployment protection rules are powered by GitHub Apps. Once a deployment protection rule is configured and installed in a repository, it can be enabled for any environments in the repository.

After you enable a custom deployment protection rule on an environment, every time a workflow step targets that environment, the deployment protection rule will run automatically. For more information about targeting an environment for deployments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

When a custom deployment protection rule is triggered it will wait for up to 30 days for a webhook event response before it times out and the workflow job fails.

For more information about creating your own custom deployment protection rules, see [Creating custom deployment protection rules](/en/actions/deployment/protecting-deployments/creating-custom-deployment-protection-rules).

> \[!NOTE]
> Any number of GitHub Apps-based deployment protection rules can be installed on a repository. However, a maximum of 6 deployment protection rules can be enabled on any environment at the same time.

## Using existing custom deployment protection rules

You can choose to create your own custom deployment protection rules or you may use any existing custom deployment protection rules.

The following is a list of official partner implementations for deployment protection rules.

* Datadog: you can enforce protection rules on your GitHub Actions deployment workflows using Datadog monitors. For more information, see [Gating your GitHub Actions Deployments with Datadog Monitors](https://docs.datadoghq.com/continuous_integration/guides/github_gating/) in the Datadog documentation.
* Honeycomb: you can define thresholds to reject or approve deployments based on data you are sending to Honeycomb. For more information, see [the Honeycomb app](https://github.com/apps/honeycomb-io) in the GitHub Marketplace.
* New Relic: for more information, see [the New Relic app](https://github.com/apps/new-relic-gate) in the GitHub Marketplace.
* NCM NodeSource: for more information, see [the NCM NodeSource app](https://github.com/apps/ncm-nodesource) in the GitHub Marketplace.
* ServiceNow: for more information, see [GitHub integration with DevOps Change Velocity](https://www.servicenow.com/docs/bundle/utah-devops/page/product/enterprise-dev-ops/concept/github-integration-dev-ops.html) in the ServiceNow documentation.

## Prerequisites

In order for a custom deployment protection rule to be available to all environments in a repository, you must first install the custom deployment protection rule on the repository. For more information, see [Installing your own GitHub App](/en/apps/maintaining-github-apps/installing-github-apps).

After a custom deployment protection rule has been installed in a repository, it must be enabled for each environment where you want the rule to apply.

## Enabling custom deployment protection rules for the environment

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.](/assets/images/help/repository/repo-actions-settings.png)
3. In the left sidebar, click **Environments**.
4. Select the environment you want to configure.
5. Under "Deployment protection rules," check the box next to each custom deployment protection rule you want to enable for the environment.
6. Click **Save protection rules**.

Once a custom deployment protection rule has been enabled for an environment, it will automatically run whenever a workflow reaches a job that references the environment. You can see the results of an approval or rejection for your deployment by reviewing the details of the deployment. For more information, see [Reviewing deployments](/en/actions/managing-workflow-runs/reviewing-deployments).
---

# Deploying with GitHub Actions

GitHub Actions gives you fine-grained control over deployments with environments, concurrency groups, and protection rules.

## Prerequisites

You should be familiar with the syntax for GitHub Actions. For more information, see [Writing workflows](/en/actions/learn-github-actions).

## Triggering your deployment

You can use a variety of events to trigger your deployment workflow. Some of the most common are: `pull_request`, `push`, and `workflow_dispatch`.

For example, a workflow with the following triggers runs whenever:

* There is a push to the `main` branch.
* A pull request targeting the `main` branch is opened, synchronized, or reopened.
* Someone manually triggers it.

```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:
```

For more information, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows).

## Using environments

Environments are used to describe a general deployment target like `production`, `staging`, or `development`. When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. You can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, gate deployments with custom deployment protection rules, or limit access to secrets. For more information about creating environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

You can configure environments with protection rules and secrets. When a workflow job references an environment, the job won't start until all of the environment's protection rules pass. A job also cannot access secrets that are defined in an environment until all the deployment protection rules pass. To learn more, see [Using custom deployment protection rules](#using-custom-deployment-protection-rules) in this article.

## Using concurrency

Concurrency ensures that only a single job or workflow using the same concurrency group will run at a time. You can use concurrency so that an environment has a maximum of one deployment in progress and one deployment pending at a time. For more information about concurrency, see [Control the concurrency of workflows and jobs](/en/actions/using-jobs/using-concurrency).

## Using environments without deployments

By default, when a workflow job references an environment, GitHub creates a deployment object to track the deployment. You can opt out of deployment creation by setting `deployment` to `false` in the environment configuration. The valid values are `true` (default) and `false`. You can also use an expression, for example `deployment: ${{ github.ref_name == 'main' }}`.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    environment:
      name: staging
      deployment: false
    steps:
      - name: run tests
        env:
          API_KEY: ${{ secrets.API_KEY }}
        run: echo "Running tests with staging secrets"
```

When `deployment` is set to `false`:

* The job has full access to environment secrets and variables.
* No GitHub deployment object is created—the deployment history for the environment is not updated.
* Wait timer protection rules still apply—the job waits for the configured duration.
* Required reviewers still apply—reviewers must still approve before the job runs.

This is useful when you want to use environments for:

* **Organizing secrets**—group related secrets under an environment name without creating deployment records.
* **Access control**—restrict which branches can use certain secrets via environment branch policies, without deployment tracking.
* **CI and testing jobs**—reference an environment for its configuration without adding noise to the deployment history.

### Interaction with protection rules

The `deployment` property controls which protection rules apply:

| Protection rule                           | `deployment: true` (default)   | `deployment: false`       |
| ----------------------------------------- | ------------------------------ | ------------------------- |
| **None**                                  | Deployment created, job runs   | No deployment, job runs   |
| **Wait timer**                            | Wait timer enforced            | Wait timer still enforced |
| **Required reviewers**                    | Reviewers must approve         | Reviewers must approve    |
| **Custom deployment protection rule app** | App webhook sent, must approve | **Job fails with error**  |

Custom deployment protection rules (GitHub Apps) require a deployment object to function. If you set `deployment: false` on an environment that has custom deployment protection rules, the job will fail immediately with an annotation or error message explaining that the environment's protection rules are incompatible with `deployment: false`. Either remove `deployment: false` from your workflow, or remove the custom deployment protection rules from the environment.

Note that `concurrency` and `environment` are not connected. The concurrency value can be any string; it does not need to be an environment name. Additionally, if another workflow uses the same environment but does not specify concurrency, that workflow will not be subject to any concurrency rules.

For example, when the following workflow runs, it will be paused with the status `pending` if any job or workflow that uses the `production` concurrency group is in progress. It will also cancel any job or workflow that uses the `production` concurrency group and has the status `pending`. This means that there will be a maximum of one running and one pending job or workflow in that uses the `production` concurrency group.

```yaml
name: Deployment

concurrency: production

on:
  push:
    branches:
      - main

jobs:
  deployment:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: deploy
        # ...deployment-specific steps
```

You can also specify concurrency at the job level. This will allow other jobs in the workflow to proceed even if the concurrent job is `pending`.

```yaml
name: Deployment

on:
  push:
    branches:
      - main

jobs:
  deployment:
    runs-on: ubuntu-latest
    environment: production
    concurrency: production
    steps:
      - name: deploy
        # ...deployment-specific steps
```

You can also use `cancel-in-progress` to cancel any currently running job or workflow in the same concurrency group.

```yaml
name: Deployment

concurrency:
  group: production
  cancel-in-progress: true

on:
  push:
    branches:
      - main

jobs:
  deployment:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: deploy
        # ...deployment-specific steps
```

For guidance on writing deployment-specific steps, see [Finding deployment examples](#finding-deployment-examples).

## Viewing deployment history

When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. For more information about viewing deployments to environments, see [Viewing deployment history](/en/actions/deployment/managing-your-deployments/viewing-deployment-history).

Your organization can collect deployment records for all your builds in a single place by uploading data to the linked artifacts page. See [About linked artifacts](/en/code-security/concepts/supply-chain-security/linked-artifacts).

## Monitoring workflow runs

Every workflow run generates a real-time graph that illustrates the run progress. You can use this graph to monitor and debug deployments. For more information see, [Using the visualization graph](/en/actions/monitoring-and-troubleshooting-workflows/using-the-visualization-graph).

You can also view the logs of each workflow run and the history of workflow runs. For more information, see [Viewing workflow run history](/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history).

## Using required reviews in workflows

Jobs that reference an environment configured with required reviewers will wait for an approval before starting. While a job is awaiting approval, it has a status of "Waiting". If a job is not approved within 30 days, it will automatically fail.

For more information about environments and required approvals, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment). For information about how to review deployments with the REST API, see [REST API endpoints for workflow runs](/en/rest/actions/workflow-runs).

## Using custom deployment protection rules

> \[!NOTE]
> Custom deployment protection rules are currently in public preview and subject to change.

You can enable your own custom protection rules to gate deployments with third-party services. For example, you can use services such as Datadog, Honeycomb, and ServiceNow to provide automated approvals for deployments to GitHub.

Custom deployment protection rules are powered by GitHub Apps and run based on webhooks and callbacks. Approval or rejection of a workflow job is based on consumption of the `deployment_protection_rule` webhook. For more information, see [Webhook events and payloads](/en/webhooks-and-events/webhooks/webhook-events-and-payloads#deployment_protection_rule) and [Approving or rejecting deployments](/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-deployments/creating-custom-deployment-protection-rules#approving-or-rejecting-deployments).

Once you have created a custom deployment protection rule and installed it on your repository, the custom deployment protection rule will automatically be available for all environments in the repository.

Deployments to an environment can be approved or rejected based on the conditions defined in any external service like an approved ticket in an IT Service Management (ITSM) system, vulnerable scan result on dependencies, or stable health metrics of a cloud resource. The decision to approve or reject deployments is at the discretion of the integrating third-party application and the gating conditions you define in them. The following are a few use cases for which you can create a deployment protection rule.

* ITSM & Security Operations: you can check for service readiness by validating quality, security, and compliance processes that verify deployment readiness.
* Observability systems: you can consult monitoring or observability systems (Asset Performance Management Systems and logging aggregators, cloud resource health verification systems, etc.) for verifying the safety and deployment readiness.
* Code quality & testing tools: you can check for automated tests on CI builds which need to be deployed to an environment.

Alternatively, you can write your own protection rules for any of the above use cases or you can define any custom logic to safely approve or reject deployments from pre-production to production environments.

## Tracking deployments through apps

If your personal account or organization on GitHub is integrated with Microsoft Teams or Slack, you can track deployments that use environments through Microsoft Teams or Slack. For example, you can receive notifications through the app when a deployment is pending approval, when a deployment is approved, or when the deployment status changes. For more information about integrating Microsoft Teams or Slack, see [Featured GitHub integrations](/en/get-started/exploring-integrations/github-extensions-and-integrations#team-communication-tools).

You can also build an app that uses deployment and deployment status webhooks to track deployments. When a workflow job that references an environment runs, it creates a deployment object with the `environment` property set to the name of your environment. As the workflow progresses, it also creates deployment status objects with the `environment` property set to the name of your environment, the `environment_url` property set to the URL for environment (if specified in the workflow), and the `state` property set to the status of the job. For more information, see [GitHub Apps documentation](/en/apps) and [Webhook events and payloads](/en/webhooks-and-events/webhooks/webhook-events-and-payloads#deployment).

## Choosing a runner

You can run your deployment workflow on GitHub-hosted runners or on self-hosted runners. Traffic from GitHub-hosted runners can come from a [wide range of network addresses](/en/rest/meta/meta#get-github-meta-information). If you are deploying to an internal environment and your company restricts external traffic into private networks, GitHub Actions workflows running on GitHub-hosted runners may not be able to communicate with your internal services or resources. To overcome this, you can host your own runners. For more information, see [Self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners) and [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners).

## Displaying a status badge

You can use a status badge to display the status of your deployment workflow. A status badge shows whether a workflow is currently failing or passing. A common place to add a status badge is in the `README.md` file of your repository, but you can add it to any web page you'd like. By default, badges display the status of your default branch. If there are no workflow runs on your default branch, it will display the status of the most recent run across all branches. You can display the status of a workflow run for a specific branch or event using the `branch` and `event` query parameters in the URL.

![Screenshot of a workflow status badge. From right to left it shows: the GitHub logo, workflow name ("GitHub Actions Demo"), and status ("passing").](/assets/images/help/repository/actions-workflow-status-badge.png)

For more information, see [Adding a workflow status badge](/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge).

## Finding deployment examples

This article demonstrated features of GitHub Actions that you can add to your deployment workflows.

GitHub offers deployment workflow templates for several popular services, such as Azure Web App. To learn how to get started using a workflow template, see [Using workflow templates](/en/actions/learn-github-actions/using-starter-workflows) or [browse the full list of deployment workflow templates](https://github.com/actions/starter-workflows/tree/main/deployments). You can also check out our more detailed guides for specific deployment workflows, such as [Deploying Node.js to Azure App Service](/en/actions/deployment/deploying-to-your-cloud-provider/deploying-to-azure/deploying-nodejs-to-azure-app-service).

Many service providers also offer actions on GitHub Marketplace for deploying to their service. For the full list, see [GitHub Marketplace](https://github.com/marketplace?category=deployment\&type=actions).
---

# Creating custom deployment protection rules

Use GitHub Apps to automate protecting deployments with third-party systems.

## Prerequisites

> \[!NOTE]
> Custom deployment protection rules are currently in public preview and subject to change.

For general information about deployment protection rules, see [Deploying with GitHub Actions](/en/actions/concepts/use-cases/deploying-with-github-actions#using-custom-deployment-protection-rules).

## Creating a custom deployment protection rule with GitHub Apps

1. Create a GitHub App. For more information, see [Registering a GitHub App](/en/apps/creating-github-apps/creating-github-apps/creating-a-github-app). Configure the GitHub App as follows.
   1. Optionally, in the **Callback URL** text field under "Identifying and authorizing users," enter the callback URL. For more information, see [About the user authorization callback URL](/en/apps/creating-github-apps/creating-github-apps/about-the-user-authorization-callback-url).
   2. Under "Permissions," select **Repository permissions**.
   3. To the right of "Actions," click the drop down menu and select **Access: Read-only**.
      ![Screenshot of the "Repository permissions" section for a new GitHub App. The Actions permission shows "Read-only" and is outlined in orange.](/assets/images/help/actions/actions-repo-permissions-read-only.png)
   4. To the right of "Deployments," click the drop down menu and select **Access: Read and write**.
      ![Screenshot of the "Repository permissions" section for a new GitHub App. The Deployments permission shows "Read and write" and is outlined in orange.](/assets/images/help/actions/actions-deployments-repo-permissions-read-and-write.png)
   5. Under "Subscribe to events," select **Deployment protection rule**.
      ![Screenshot of the "Subscribe to events section" section for a new GitHub App. The checkbox for the Deployment protection rule is outlined in orange.](/assets/images/help/actions/actions-subscribe-to-events-deployment-protection-rules.png)

2. Install the custom deployment protection rule in your repositories and enable it for use. For more information, see [Configuring custom deployment protection rules](/en/actions/deployment/protecting-deployments/configuring-custom-deployment-protection-rules).

## Approving or rejecting deployments

Once a workflow reaches a job that references an environment that has the custom deployment protection rule enabled, GitHub sends a `POST` request to a URL you configure containing the `deployment_protection_rule` payload. You can write your deployment protection rule to automatically send REST API requests that approve or reject the deployment based on the `deployment_protection_rule` payload. Configure your REST API requests as follows.

Custom deployment protection rules are not compatible when a workflow job's environment is set to `deployment: false`. For more information, see [Deploying with GitHub Actions](/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments#interaction-with-protection-rules).

1. Validate the incoming `POST` request. For more information, see [Validating webhook deliveries](/en/webhooks-and-events/webhooks/securing-your-webhooks#validating-payloads-from-github).

2. Use a JSON Web Token to authenticate as a GitHub App. For more information, see [Authenticating as a GitHub App](/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app#about-authentication-as-a-github-app).

3. Using the installation ID from the `deployment_protection_rule` webhook payload, generate an install token. For more information, see [About authentication with a GitHub App](/en/developers/apps/building-github-apps/authenticating-with-github-apps#authenticating-as-a-github-app).

   ```shell
   curl --request POST \
   --url "https://api.github.com/app/installations/INSTALLATION_ID/ACCESS_TOKENS" \
   --header "Accept: application/vnd.github+json" \
   --header "Authorization: Bearer {jwt}" \
   --header "Content-Type: application/json" \
   --data \
   '{ \
      "repository_ids": [321], \
      "permissions": { \
         "deployments": "write" \
      } \
   }'
   ```

4. Optionally, to add a status report without taking any other action to GitHub, send a `POST` request to `/repos/OWNER/REPO/actions/runs/RUN_ID/deployment_protection_rule`. In the request body, omit the `state`. For more information, see [REST API endpoints for workflow runs](/en/rest/actions/workflow-runs#review-custom-deployment-protection-rules-for-a-workflow-run). You can post a status report on the same deployment up to 10 times. Status reports support Markdown formatting and can be up to 1024 characters long.

5. To approve or reject a request, send a `POST` request to `/repos/OWNER/REPO/actions/runs/RUN_ID/deployment_protection_rule`. In the request body, set the `state` property to either `approved` or `rejected`. For more information, see [REST API endpoints for workflow runs](/en/rest/actions/workflow-runs#review-custom-deployment-protection-rules-for-a-workflow-run).

6. Optionally, request the status of an approval for a workflow run by sending a `GET` request to `/repos/OWNER/REPOSITORY_ID/actions/runs/RUN_ID/approvals`. For more information, see [REST API endpoints for workflow runs](/en/rest/actions/workflow-runs#get-the-review-history-for-a-workflow-run).

7. Optionally, review the deployment on GitHub. For more information, see [Reviewing deployments](/en/actions/managing-workflow-runs/reviewing-deployments).

## Publishing custom deployment protection rules in the GitHub Marketplace

You can publish your GitHub App to the GitHub Marketplace to allow developers to discover suitable protection rules and install it across their GitHub repositories. Or you can browse existing custom deployment protection rules to suit your needs. For more information, see [About GitHub Marketplace for apps](/en/apps/publishing-apps-to-github-marketplace/github-marketplace-overview/about-github-marketplace) and [Listing an app on GitHub Marketplace](/en/apps/publishing-apps-to-github-marketplace/listing-an-app-on-github-marketplace).
---

# Managing environments for deployment

You can create environments and secure those environments with deployment protection rules. A job that references an environment must follow any protection rules for the environment before running or accessing the environment's secrets.

## Prerequisites

> \[!NOTE]
> Users with GitHub Free plans can only configure environments for public repositories. If you convert a repository from public to private, any configured protection rules or environment secrets will be ignored, and you will not be able to configure any environments. If you convert your repository back to public, you will have access to any previously configured protection rules and environment secrets.
>
> Organizations with GitHub Team and users with GitHub Pro can configure environments for private repositories. For more information, see [GitHub's plans](/en/get-started/learning-about-github/githubs-plans).

* For general information about environments, see [Deploying with GitHub Actions](/en/actions/concepts/use-cases/deploying-with-github-actions#using-environments).
* For information about available rules, see [Deployments and environments](/en/actions/reference/deployments-and-environments).

## Creating an environment

To configure an environment in a personal account repository, you must be the repository owner. To configure an environment in an organization repository, you must have `admin` access.

> \[!NOTE]
>
> * Creation of an environment in a private repository is available to organizations with GitHub Team and users with GitHub Pro.
> * Some features for environments have no or limited availability for private repositories. If you are unable to access a feature described in the instructions below, please see the documentation linked in the related step for availability information.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.](/assets/images/help/repository/repo-actions-settings.png)
3. In the left sidebar, click **Environments**.
4. Click **New environment**.
5. Enter a name for the environment, then click **Configure environment**. Environment names are not case sensitive. An environment name may not exceed 255 characters and must be unique within the repository.
6. Optionally, specify people or teams that must approve workflow jobs that use this environment. For more information, see [Deployments and environments](/en/actions/reference/deployments-and-environments#required-reviewers).
   1. Select **Required reviewers**.
   2. Enter up to 6 people or teams. Only one of the required reviewers needs to approve the job for it to proceed.
   3. Optionally, to prevent users from approving workflows runs that they triggered, select **Prevent self-review**.
   4. Click **Save protection rules**.
7. Optionally, specify the amount of time to wait before allowing workflow jobs that use this environment to proceed. For more information, see [Deployments and environments](/en/actions/reference/deployments-and-environments#wait-timer).
   1. Select **Wait timer**.
   2. Enter the number of minutes to wait.
   3. Click **Save protection rules**.
8. Optionally, disallow bypassing configured protection rules. For more information, see [Deployments and environments](/en/actions/reference/deployments-and-environments#allow-administrators-to-bypass-configured-protection-rules).
   1. Deselect **Allow administrators to bypass configured protection rules**.
   2. Click **Save protection rules**.
9. Optionally, enable any custom deployment protection rules that have been created with GitHub Apps. For more information, see [Deployments and environments](/en/actions/reference/deployments-and-environments#custom-deployment-protection-rules).
   1. Select the custom protection rule you want to enable.
   2. Click **Save protection rules**.
10. Optionally, specify what branches and tags can deploy to this environment. For more information, see [Deployments and environments](/en/actions/reference/deployments-and-environments#deployment-branches-and-tags).
    1. Select the desired option in the **Deployment branches** dropdown.

    2. If you chose **Selected branches and tags**, to add a new rule, click **Add deployment branch or tag rule**

    3. In the "Ref type" dropdown menu, depending on what rule you want to apply, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-git-branch" aria-label="git-branch" role="img"><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path></svg> Branch** or **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-tag" aria-label="tag" role="img"><path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"></path></svg> Tag**.

    4. Enter the name pattern for the branch or tag that you want to allow.

       > \[!NOTE]
       > Name patterns must be configured for branches or tags individually.

    5. Click **Add rule**.
11. Optionally, add environment secrets. These secrets are only available to workflow jobs that use the environment. Additionally, workflow jobs that use this environment can only access these secrets after any configured rules (for example, required reviewers) pass. For more information, see [Deployments and environments](/en/actions/reference/deployments-and-environments#environment-secrets).
    1. Under **Environment secrets**, click **Add Secret**.
    2. Enter the secret name.
    3. Enter the secret value.
    4. Click **Add secret**.
12. Optionally, add environment variables. These variables are only available to workflow jobs that use the environment, and are only accessible using the [`vars`](/en/actions/learn-github-actions/contexts#vars-context) context. For more information, see [Deployments and environments](/en/actions/reference/deployments-and-environments#environment-variables).
    1. Under **Environment variables**, click **Add Variable**.
    2. Enter the variable name.
    3. Enter the variable value.
    4. Click **Add variable**.

You can also create and configure environments through the REST API. For more information, see [REST API endpoints for deployment environments](/en/rest/deployments/environments), [REST API endpoints for GitHub Actions Secrets](/en/rest/actions/secrets), [REST API endpoints for GitHub Actions variables](/en/rest/actions/variables), and [REST API endpoints for deployment branch policies](/en/rest/deployments/branch-policies).

Running a workflow that references an environment that does not exist will create an environment with the referenced name. If the environment is created from running implicit page builds (for example, from a branch or folder source), the source branch will be added as a protection rule to the environment. Otherwise, the newly created environment will not have any protection rules or secrets configured. Anyone that can edit workflows in the repository can create environments via a workflow file, but only repository admins can configure the environment.

## Deleting an environment

To configure an environment in a personal account repository, you must be the repository owner. To configure an environment in an organization repository, you must have `admin` access.

Deleting an environment will delete all secrets and protection rules associated with the environment. Any jobs currently waiting because of protection rules from the deleted environment will automatically fail.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.](/assets/images/help/repository/repo-actions-settings.png)
3. In the left sidebar, click **Environments**.
4. Next to the environment that you want to delete, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-trash" aria-label="Delete environment" role="img"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path></svg>.
5. Click **I understand, delete this environment**.

You can also delete environments through the REST API. For more information, see [REST API endpoints for repositories](/en/rest/repos#environments).

## How environments relate to deployments

When a workflow job that references an environment runs, it creates a deployment object with the `environment` property set to the name of your environment. As the workflow progresses, it also creates deployment status objects with the `environment` property set to the name of your environment, the `environment_url` property set to the URL for environment (if specified in the workflow), and the `state` property set to the status of the job.

You can access these objects through the REST API or GraphQL API. You can also subscribe to these webhook events. For more information, see [REST API endpoints for repositories](/en/rest/repos#deployments), [Objects](/en/graphql/reference/objects#deployment) (GraphQL API), or [Webhook events and payloads](/en/webhooks-and-events/webhooks/webhook-events-and-payloads#deployment).

## Next steps

GitHub Actions provides several features for managing your deployments. For more information, see [Deploying with GitHub Actions](/en/actions/deployment/about-deployments/deploying-with-github-actions).
---

# Reviewing deployments

You can approve or reject jobs awaiting review.

## Approving or rejecting a job

1. Navigate to the workflow run that requires review. For more information about navigating to a workflow run, see [Viewing workflow run history](/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history).
2. If the run requires review, you will see a notification for the review request. On the notification, click **Review deployments**.
3. Select the job environment(s) to approve or reject. Optionally, leave a comment.
4. Approve or reject:
   * To approve the job, click **Approve and deploy**. Once a job is approved (and any other deployment protection rules have passed), the job will proceed. At this point, the job can access any secrets stored in the environment.
   * To reject the job, click **Reject**. If a job is rejected, the workflow will fail.

> \[!NOTE]
> If the targeted environment is configured to prevent self-approvals for deployments, you will not be able to approve a deployment from a workflow run you initiated. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment#required-reviewers).

## Bypassing deployment protection rules

If you have configured deployment protection rules that control whether software can be deployed to an environment, you can bypass these rules and force all pending jobs referencing the environment to proceed.

> \[!NOTE]
>
> * You cannot bypass deployment protection rules if the environment has been configured to prevent admins from bypassing configured protection rules. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment#creating-an-environment).
> * You can only bypass deployment protection rules during workflow execution when a job referencing the environment is in a "Pending" state.

1. Navigate to the workflow run. For more information about navigating to a workflow run, see [Viewing workflow run history](/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history).
2. To the right of **Deployment protection rules**, click **Start all waiting jobs**.
   ![Screenshot of the "Deployment protection rules" section with the "Start all waiting jobs" button outlined in orange.](/assets/images/actions-bypass-env-protection-rules.png)
3. In the pop-up window, select the environments for which you want to bypass deployment protection rules.
4. Under **Leave a comment**, enter a description for bypassing the deployment protection rules.
5. Click **I understand the consequences, start deploying**.
---

# Viewing deployment history

View current and previous deployments for your repository.

## Viewing your repository's deployment history

On the deployments page of your repository, you can view the following aspects of your deployments.

* Currently active deployments across various environments
* Deployments filtered by environment
* Your repository's full deployment history
* Associated commits that triggered the deployment
* Connected GitHub Actions workflow logs
* The deployment URL (if one exists)
* The source pull request and branch related to each deployment
* Deployment statuses. For more information about deployment statuses, see [REST API endpoints for deployments](/en/rest/deployments/deployments#about-deployments).

By default, the deployments page shows currently active deployments from select environments and a timeline of the latest deployments for all environments.

1. In the right-hand sidebar of the home page of your repository, click **Deployments**.
2. Once you are on the "Deployments" page, you can view the following information about your deployment history.
   * **To view recent deployments for a specific environment**, in the "Environments" section of the left sidebar, click an environment.
   * **To pin an environment to the top of the deployment history list**, repository administrators can click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-pin" aria-label="Pin environment" role="img"><path d="m11.294.984 3.722 3.722a1.75 1.75 0 0 1-.504 2.826l-1.327.613a3.089 3.089 0 0 0-1.707 2.084l-.584 2.454c-.317 1.332-1.972 1.8-2.94.832L5.75 11.311 1.78 15.28a.749.749 0 1 1-1.06-1.06l3.969-3.97-2.204-2.204c-.968-.968-.5-2.623.832-2.94l2.454-.584a3.08 3.08 0 0 0 2.084-1.707l.613-1.327a1.75 1.75 0 0 1 2.826-.504ZM6.283 9.723l2.732 2.731a.25.25 0 0 0 .42-.119l.584-2.454a4.586 4.586 0 0 1 2.537-3.098l1.328-.613a.25.25 0 0 0 .072-.404l-3.722-3.722a.25.25 0 0 0-.404.072l-.613 1.328a4.584 4.584 0 0 1-3.098 2.537l-2.454.584a.25.25 0 0 0-.119.42l2.731 2.732Z"></path></svg> to the right of the environment. You can pin up to ten environments.
   * **To view the commit that triggered a deployment**, in the deployment history list, click the commit message for the deployment you want to view.
     > \[!NOTE]Deployments from commits that originate from a fork outside of the repository will not show links to the source pull request and branch related to each deployment. For more information about forks, see [About forks](/en/pull-requests/collaborating-with-pull-requests/working-with-forks/about-forks).
   * **To view the URL for a deployment**, to the right of the commit message in the deployment history list, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-link-external" aria-label="Navigate to deployment URL" role="img"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path></svg>.
   * **To navigate to the workflow run logs associated with a deployment**, to the right of the commit message in the deployment history list, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="View logs" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>, then click **View logs**.
3. Optionally, to filter the deployment history list, create a filter.
   1. Click on the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-filter" aria-label="filter" role="img"><path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg> Filter** button.
   2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-plus" aria-label="plus" role="img"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path></svg> Add a filter**.
   3. Choose a qualifier you would like to filter the deployment history by.
   4. Depending on the qualifier you chose, fill out information in the "Operator" and "Value" columns.
   5. Optionally, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-plus" aria-label="plus" role="img"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path></svg> Add a filter** to add another filter.
   6. Click **Apply**.
---

# Deploying to Amazon Elastic Container Service

Learn how to deploy a project to Amazon Elastic Container Service (ECS) as part of a continuous deployment (CD) workflow.

## Prerequisites

Before creating your GitHub Actions workflow, you will first need to complete the following setup steps for Amazon ECR and ECS:

1. Create an Amazon ECR repository to store your images.

   For example, using [the AWS CLI](https://aws.amazon.com/cli/):

   ```bash copy
   aws ecr create-repository \
       --repository-name MY_ECR_REPOSITORY \
       --region MY_AWS_REGION

   ```

   Ensure that you use the same Amazon ECR repository name (represented here by `MY_ECR_REPOSITORY`) for the `ECR_REPOSITORY` variable in the workflow below.

   Ensure that you use the same AWS region value for the `AWS_REGION` (represented here by `MY_AWS_REGION`) variable in the workflow below.

2. Create an Amazon ECS task definition, cluster, and service.

   For details, follow the [Getting started wizard on the Amazon ECS console](https://us-east-2.console.aws.amazon.com/ecs/home?region=us-east-2#/firstRun), or the [Getting started guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started-fargate.html) in the Amazon ECS documentation.

   Ensure that you note the names you set for the Amazon ECS service and cluster, and use them for the `ECS_SERVICE` and `ECS_CLUSTER` variables in the workflow below.

3. Store your Amazon ECS task definition as a JSON file in your GitHub repository.

   The format of the file should be the same as the output generated by:

   ```bash copy

   aws ecs register-task-definition --generate-cli-skeleton

   ```

   Ensure that you set the `ECS_TASK_DEFINITION` variable in the workflow below as the path to the JSON file.

   Ensure that you set the `CONTAINER_NAME` variable in the workflow below as the container name in the `containerDefinitions` section of the task definition.

4. Create GitHub Actions secrets named `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to store the values for your Amazon IAM access key.

   For more information on creating secrets for GitHub Actions, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

   See the documentation for each action used below for the recommended IAM policies for the IAM user, and methods for handling the access key credentials.

5. Optionally, configure a deployment environment. Environments are used to describe a general deployment target like `production`, `staging`, or `development`. When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. You can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, gate deployments with custom deployment protection rules, or limit access to secrets. For more information about creating environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

## Creating the workflow

Once you've completed the prerequisites, you can proceed with creating the workflow.

The following example workflow demonstrates how to build a container image and push it to Amazon ECR. It then updates the task definition with the new image ID, and deploys the task definition to Amazon ECS.

Ensure that you provide your own values for all the variables in the `env` key of the workflow.

If you configured a deployment environment, change the value of `environment` to be the name of your environment. If you did not configure an environment or if your workflow is in a private repository and you do not use GitHub Enterprise Cloud, delete the `environment` key.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Deploy to Amazon ECS

on:
  push:
    branches:
      - main

env:
  AWS_REGION: MY_AWS_REGION                   # set this to your preferred AWS region, e.g. us-west-1
  ECR_REPOSITORY: MY_ECR_REPOSITORY           # set this to your Amazon ECR repository name
  ECS_SERVICE: MY_ECS_SERVICE                 # set this to your Amazon ECS service name
  ECS_CLUSTER: MY_ECS_CLUSTER                 # set this to your Amazon ECS cluster name
  ECS_TASK_DEFINITION: MY_ECS_TASK_DEFINITION # set this to the path to your Amazon ECS task definition
                                               # file, e.g. .aws/task-definition.json
  CONTAINER_NAME: MY_CONTAINER_NAME           # set this to the name of the container in the
                                               # containerDefinitions section of your task definition

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v5

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@0e613a0980cbf65ed5b322eb7a1e075d28913a83
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@62f4f872db3836360b72999f4b87f1ff13310f3a

      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          # Build a docker container and
          # push it to ECR so that it can
          # be deployed to ECS.
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@c804dfbdd57f713b6c079302a4c01db7017a36fc
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@df9643053eda01f169e64a0e60233aacca83799a
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

## Further reading

For the original workflow template, see [`aws.yml`](https://github.com/actions/starter-workflows/blob/main/deployments/aws.yml) in the GitHub Actions `starter-workflows` repository.

For more information on the services used in these examples, see the following documentation:

* [Security best practices in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html) in the Amazon AWS documentation.
* Official AWS [Configure AWS Credentials](https://github.com/aws-actions/configure-aws-credentials) action.
* Official AWS [Amazon ECR "Login"](https://github.com/aws-actions/amazon-ecr-login) action.
* Official AWS [Amazon ECS "Render Task Definition"](https://github.com/aws-actions/amazon-ecs-render-task-definition) action.
* Official AWS [Amazon ECS "Deploy Task Definition"](https://github.com/aws-actions/amazon-ecs-deploy-task-definition) action.
---

# Deploying to Azure Kubernetes Service

Learn how to deploy a project to Azure Kubernetes Service (AKS) as part of a continuous deployment (CD) workflow.

## Prerequisites

Before creating your GitHub Actions workflow, you will first need to complete the following setup steps:

1. Create a target AKS cluster and an Azure Container Registry (ACR). For more information, see [Quickstart: Deploy an AKS cluster by using the Azure portal - Azure Kubernetes Service](https://docs.microsoft.com/azure/aks/kubernetes-walkthrough-portal) and [Quickstart - Create registry in portal - Azure Container Registry](https://docs.microsoft.com/azure/container-registry/container-registry-get-started-portal) in the Azure documentation.

2. Create a secret called `AZURE_CREDENTIALS` to store your Azure credentials. For more information about how to find this information and structure the secret, see [the `Azure/login` action documentation](https://github.com/Azure/login#configure-a-service-principal-with-a-secret).

## Creating the workflow

Once you've completed the prerequisites, you can proceed with creating the workflow.

The following example workflow demonstrates how to build and deploy a project to Azure Kubernetes Service when code is pushed to your repository.

Under the workflow `env` key, change the following values:

* `AZURE_CONTAINER_REGISTRY` to the name of your container registry
* `PROJECT_NAME` to the name of your project
* `RESOURCE_GROUP` to the resource group containing your AKS cluster
* `CLUSTER_NAME` to the name of your AKS cluster

This workflow uses the `helm` render engine for the [`azure/k8s-bake` action](https://github.com/Azure/k8s-bake). If you will use the `helm` render engine, change the value of `CHART_PATH` to the path to your helm file. Change `CHART_OVERRIDE_PATH` to an array of override file paths. If you use a different render engine, update the input parameters sent to the `azure/k8s-bake` action.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Build and deploy to Azure Kubernetes Service

env:
  AZURE_CONTAINER_REGISTRY: MY_REGISTRY_NAME # set this to the name of your container registry
  PROJECT_NAME: MY_PROJECT_NAME              # set this to your project's name
  RESOURCE_GROUP: MY_RESOURCE_GROUP          # set this to the resource group containing your AKS cluster
  CLUSTER_NAME: MY_CLUSTER_NAME              # set this to the name of your AKS cluster
  REGISTRY_URL: MY_REGISTRY_URL              # set this to the URL of your registry
  # If you bake using helm:
  CHART_PATH: MY_HELM_FILE                   # set this to the path to your helm file
  CHART_OVERRIDE_PATH: MY_OVERRIDE_FILES     # set this to an array of override file paths

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v5

    - name: Azure Login
      uses: azure/login@14a755a4e2fd6dff25794233def4f2cf3f866955
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Build image on ACR
      uses: azure/CLI@61bb69d64d613b52663984bf12d6bac8fd7b3cc8
      with:
        azcliversion: 2.29.1
        inlineScript: |
          az configure --defaults acr=${{ env.AZURE_CONTAINER_REGISTRY }}
          az acr build -t -t ${{ env.REGISTRY_URL }}/${{ env.PROJECT_NAME }}:${{ github.sha }}

    - name: Gets K8s context
      uses: azure/aks-set-context@94ccc775c1997a3fcfbfbce3c459fec87e0ab188
      with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
          resource-group: ${{ env.RESOURCE_GROUP }}
          cluster-name: ${{ env.CLUSTER_NAME }}
      id: login

    - name: Configure deployment
      uses: azure/k8s-bake@61041e8c2f75c1f01186c8f05fb8b24e1fc507d8
      with:
        renderEngine: 'helm'
        helmChart: ${{ env.CHART_PATH }}
        overrideFiles: ${{ env.CHART_OVERRIDE_PATH }}
        overrides: |
          replicas:2
        helm-version: 'latest'
      id: bake

    - name: Deploys application
      uses: Azure/k8s-deploy@dd4bbd13a5abd2fc9ca8bdcb8aee152bb718fa78
      with:
        manifests: ${{ steps.bake.outputs.manifestsBundle }}
        images: |
          ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/${{ env.PROJECT_NAME }}:${{ github.sha }}
        imagepullsecrets: |
          ${{ env.PROJECT_NAME }}
```

## Further reading

* For the original workflow template, see [`azure-kubernetes-service.yml`](https://github.com/actions/starter-workflows/blob/main/deployments/azure-kubernetes-service.yml) in the GitHub Actions `starter-workflows` repository.
* The actions used to in this workflow are the official Azure [`Azure/login`](https://github.com/Azure/login),[`Azure/aks-set-context`](https://github.com/Azure/aks-set-context), [`Azure/CLI`](https://github.com/Azure/CLI), [`Azure/k8s-bake`](https://github.com/Azure/k8s-bake), and [`Azure/k8s-deploy`](https://github.com/Azure/k8s-deploy)actions.
* For more examples of GitHub Action workflows that deploy to Azure, see the [actions-workflow-samples](https://github.com/Azure/actions-workflow-samples) repository.
---

# Deploying to Azure Static Web App

Learn how to deploy a web app to Azure Static Web App as part of your continuous deployment (CD) workflows.

## Prerequisites

Before creating your GitHub Actions workflow, you will first need to complete the following setup steps:

1. Create an Azure Static Web App using the 'Other' option for deployment source. For more information, see [Quickstart: Building your first static site in the Azure portal](https://docs.microsoft.com/azure/static-web-apps/get-started-portal) in the Azure documentation.

2. Create a secret called `AZURE_STATIC_WEB_APPS_API_TOKEN` with the value of your static web app deployment token. For more information about how to find your deployment token, see [Reset deployment tokens in Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/deployment-token-management) in the Azure documentation.

## Creating the workflow

Once you've completed the prerequisites, you can proceed with creating the workflow.

The following example workflow demonstrates how to build and deploy an Azure static web app when there is a push to the `main` branch or when a pull request targeting `main` is opened, synchronized, or reopened. The workflow also tears down the corresponding pre-production deployment when a pull request targeting `main` is closed.

Under the workflow `env` key, change the following values:

* `APP_LOCATION` to the location of your client code
* `API_LOCATION` to the location of your API source code. If `API_LOCATION` is not relevant, you can delete the variable and the lines where it is used.
* `OUTPUT_LOCATION` to the location of your client code build output

For more information about these values, see [Build configuration for Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/build-configuration?tabs=github-actions) in the Azure documentation.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Deploy web app to Azure Static Web Apps

env:
  APP_LOCATION: "/" # location of your client code
  API_LOCATION: "api" # location of your api source code - optional
  OUTPUT_LOCATION: "build" # location of client code build output

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

permissions:
  issues: write
  contents: read
  pull-requests: write

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v5
        with:
          submodules: true
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@1a947af9992250f3bc2e68ad0754c0b0c11566c9
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: ${{ env.APP_LOCATION }}
          api_location: ${{ env.API_LOCATION }}
          output_location: ${{ env.OUTPUT_LOCATION }}

  close_pull_request:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request
    steps:
      - name: Close Pull Request
        uses: Azure/static-web-apps-deploy@1a947af9992250f3bc2e68ad0754c0b0c11566c9
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

## Further reading

* For the original workflow template, see [`azure-staticwebapp.yml`](https://github.com/actions/starter-workflows/blob/main/deployments/azure-staticwebapp.yml) in the GitHub Actions `starter-workflows` repository.
* The action used to deploy the web app is the official Azure [`Azure/static-web-apps-deploy`](https://github.com/Azure/static-web-apps-deploy) action.
* For more examples of GitHub Action workflows that deploy to Azure, see the [actions-workflow-samples](https://github.com/Azure/actions-workflow-samples) repository.
---

# Deploying Docker to Azure App Service

Learn how to deploy a Docker container to Azure App Service as part of your continuous deployment (CD) workflows.

## Prerequisites

Before creating your GitHub Actions workflow, you will first need to complete the following setup steps:

1. Create an Azure App Service plan.

   For example, you can use the Azure CLI to create a new App Service plan:

   ```bash copy
   az appservice plan create \
      --resource-group MY_RESOURCE_GROUP \
      --name MY_APP_SERVICE_PLAN \
      --is-linux
   ```

   In the command above, replace `MY_RESOURCE_GROUP` with your pre-existing Azure Resource Group, and `MY_APP_SERVICE_PLAN` with a new name for the App Service plan.

   See the Azure documentation for more information on using the [Azure CLI](https://docs.microsoft.com/cli/azure/):

   * For authentication, see [Sign in with Azure CLI](https://docs.microsoft.com/cli/azure/authenticate-azure-cli).
   * If you need to create a new resource group, see [az group](https://docs.microsoft.com/cli/azure/group?view=azure-cli-latest#az_group_create).

2. Create a web app.

   For example, you can use the Azure CLI to create an Azure App Service web app:

   ```shell copy
   az webapp create \
       --name MY_WEBAPP_NAME \
       --plan MY_APP_SERVICE_PLAN \
       --resource-group MY_RESOURCE_GROUP \
       --deployment-container-image-name nginx:latest
   ```

   In the command above, replace the parameters with your own values, where `MY_WEBAPP_NAME` is a new name for the web app.

3. Configure an Azure publish profile and create an `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

   Generate your Azure deployment credentials using a publish profile. For more information, see [Generate deployment credentials](https://docs.microsoft.com/azure/app-service/deploy-github-actions?tabs=applevel#generate-deployment-credentials) in the Azure documentation.

   In your GitHub repository, create a secret named `AZURE_WEBAPP_PUBLISH_PROFILE` that contains the contents of the publish profile. For more information on creating secrets, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

4. Set registry credentials for your web app.

   Create a personal access token (classic) with the `repo` and `read:packages` scopes. For more information, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

   Set `DOCKER_REGISTRY_SERVER_URL` to `https://ghcr.io`, `DOCKER_REGISTRY_SERVER_USERNAME` to the GitHub username or organization that owns the repository, and `DOCKER_REGISTRY_SERVER_PASSWORD` to your personal access token from above. This will give your web app credentials so it can pull the container image after your workflow pushes a newly built image to the registry. You can do this with the following Azure CLI command:

   ```shell
    az webapp config appsettings set \
        --name MY_WEBAPP_NAME \
        --resource-group MY_RESOURCE_GROUP \
        --settings DOCKER_REGISTRY_SERVER_URL=https://ghcr.io DOCKER_REGISTRY_SERVER_USERNAME=MY_REPOSITORY_OWNER DOCKER_REGISTRY_SERVER_PASSWORD=MY_PERSONAL_ACCESS_TOKEN
   ```

5. Optionally, configure a deployment environment. Environments are used to describe a general deployment target like `production`, `staging`, or `development`. When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. You can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, gate deployments with custom deployment protection rules, or limit access to secrets. For more information about creating environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

## Creating the workflow

Once you've completed the prerequisites, you can proceed with creating the workflow.

The following example workflow demonstrates how to build and deploy a Docker container to Azure App Service when there is a push to the `main` branch.

Ensure that you set `AZURE_WEBAPP_NAME` in the workflow `env` key to the name of the web app you created.

If you configured a deployment environment, change the value of `environment` to be the name of your environment. If you did not configure an environment or if your workflow is in a private repository and you do not use GitHub Enterprise Cloud, delete the `environment` key.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Build and deploy a container to an Azure Web App

env:
  AZURE_WEBAPP_NAME: MY_WEBAPP_NAME   # set this to your application's name

on:
  push:
    branches:
      - main

permissions:
  contents: 'read'
  packages: 'write'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b

      - name: Log in to GitHub container registry
        uses: docker/login-action@8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Lowercase the repo name
        run: echo "REPO=${GITHUB_REPOSITORY,,}" >>${GITHUB_ENV}

      - name: Build and push container image to registry
        uses: docker/build-push-action@9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f
        with:
          push: true
          tags: ghcr.io/${{ env.REPO }}:${{ github.sha }}
          file: ./Dockerfile

  deploy:
    runs-on: ubuntu-latest

    needs: build

    environment:
      name: 'production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Lowercase the repo name
        run: echo "REPO=${GITHUB_REPOSITORY,,}" >>${GITHUB_ENV}

      - name: Deploy to Azure Web App
        id: deploy-to-webapp
        uses: azure/webapps-deploy@85270a1854658d167ab239bce43949edb336fa7c
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          images: 'ghcr.io/${{ env.REPO }}:${{ github.sha }}'
```

## Further reading

* For the original workflow template, see [`azure-container-webapp.yml`](https://github.com/actions/starter-workflows/blob/main/deployments/azure-container-webapp.yml) in the GitHub Actions `starter-workflows` repository.
* The action used to deploy the web app is the official Azure [`Azure/webapps-deploy`](https://github.com/Azure/webapps-deploy) action.
* For more examples of GitHub Action workflows that deploy to Azure, see the [actions-workflow-samples](https://github.com/Azure/actions-workflow-samples) repository.
---

# Deploying to Google Kubernetes Engine

Learn how to deploy a project to Google Kubernetes Engine (GKE) as part of a continuous deployment (CD) workflow.

## Prerequisites

Before you proceed with creating the workflow, you will need to complete the following steps for your Kubernetes project. This guide assumes the root of your project already has a `Dockerfile` and a Kubernetes Deployment configuration file.

### Creating a GKE cluster

To create the GKE cluster, you will first need to authenticate using the `gcloud` CLI. For more information on this step, see the following articles:

* [`gcloud auth login`](https://cloud.google.com/sdk/gcloud/reference/auth/login)
* [`gcloud` CLI](https://cloud.google.com/sdk/gcloud/reference)
* [`gcloud` CLI and Cloud SDK](https://cloud.google.com/sdk/gcloud#the_gcloud_cli_and_cloud_sdk)

For example:

```shell copy
$ gcloud container clusters create $GKE_CLUSTER \
	--project=$GKE_PROJECT \
	--zone=$GKE_ZONE
```

### Enabling the APIs

Enable the Kubernetes Engine and Container Registry APIs. For example:

```shell copy
$ gcloud services enable \
	containerregistry.googleapis.com \
	container.googleapis.com
```

### Configuring a service account and storing its credentials

This procedure demonstrates how to create the service account for your GKE integration. It explains how to create the account, add roles to it, retrieve its keys, and store them as a base64-encoded encrypted repository secret named `GKE_SA_KEY`.

1. Create a new service account:

   ```shell copy
   gcloud iam service-accounts create $SA_NAME
   ```

2. Retrieve the email address of the service account you just created:

   ```shell copy
   gcloud iam service-accounts list
   ```

3. Add roles to the service account.

   > \[!NOTE]
   > Apply more restrictive roles to suit your requirements.

   ```shell copy
   gcloud projects add-iam-policy-binding $GKE_PROJECT \
     --member=serviceAccount:$SA_EMAIL \
     --role=roles/container.admin
   gcloud projects add-iam-policy-binding $GKE_PROJECT \
     --member=serviceAccount:$SA_EMAIL \
     --role=roles/storage.admin
   gcloud projects add-iam-policy-binding $GKE_PROJECT \
     --member=serviceAccount:$SA_EMAIL \
     --role=roles/container.clusterViewer
   ```

4. Download the JSON keyfile for the service account:

   ```shell copy
   gcloud iam service-accounts keys create key.json --iam-account=$SA_EMAIL
   ```

5. Store the service account key as a secret named `GKE_SA_KEY`:

   ```shell copy
   export GKE_SA_KEY=$(cat key.json | base64)
   ```

   For more information about how to store a secret, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

### Storing your project name

Store the name of your project as a secret named `GKE_PROJECT`. For more information about how to store a secret, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

### (Optional) Configuring kustomize

Kustomize is an optional tool used for managing YAML specs. After creating a `kustomization` file, the workflow below can be used to dynamically set fields of the image and pipe in the result to `kubectl`. For more information, see [kustomize usage](https://github.com/kubernetes-sigs/kustomize#usage).

### (Optional) Configure a deployment environment

Environments are used to describe a general deployment target like `production`, `staging`, or `development`. When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. You can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, gate deployments with custom deployment protection rules, or limit access to secrets. For more information about creating environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

## Creating the workflow

Once you've completed the prerequisites, you can proceed with creating the workflow.

The following example workflow demonstrates how to build a container image and push it to GCR. It then uses the Kubernetes tools (such as `kubectl` and `kustomize`) to pull the image into the cluster deployment.

Under the `env` key, change the value of `GKE_CLUSTER` to the name of your cluster, `GKE_ZONE` to your cluster zone, `DEPLOYMENT_NAME` to the name of your deployment, and `IMAGE` to the name of your image.

If you configured a deployment environment, change the value of `environment` to be the name of your environment. If you did not configure an environment or if your workflow is in a private repository and you do not use GitHub Enterprise Cloud, delete the `environment` key.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Build and Deploy to GKE

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: ${{ secrets.GKE_PROJECT }}
  GKE_CLUSTER: cluster-1    # Add your cluster name here.
  GKE_ZONE: us-central1-c   # Add your cluster zone here.
  DEPLOYMENT_NAME: gke-test # Add your deployment name here.
  IMAGE: static-site

jobs:
  setup-build-publish-deploy:
    name: Setup, Build, Publish, and Deploy
    runs-on: ubuntu-latest
    environment: production

    steps:
    - name: Checkout
      uses: actions/checkout@v5

    # Setup gcloud CLI
    - uses: google-github-actions/setup-gcloud@1bee7de035d65ec5da40a31f8589e240eba8fde5
      with:
        service_account_key: ${{ secrets.GKE_SA_KEY }}
        project_id: ${{ secrets.GKE_PROJECT }}

    # Configure Docker to use the gcloud command-line tool as a credential
    # helper for authentication
    - run: |-
        gcloud --quiet auth configure-docker

    # Get the GKE credentials so we can deploy to the cluster
    - uses: google-github-actions/get-gke-credentials@db150f2cc60d1716e61922b832eae71d2a45938f
      with:
        cluster_name: ${{ env.GKE_CLUSTER }}
        location: ${{ env.GKE_ZONE }}
        credentials: ${{ secrets.GKE_SA_KEY }}

    # Build the Docker image
    - name: Build
      run: |-
        docker build \
          --tag "gcr.io/$PROJECT_ID/$IMAGE:$GITHUB_SHA" \
          --build-arg GITHUB_SHA="$GITHUB_SHA" \
          --build-arg GITHUB_REF="$GITHUB_REF" \
          .

    # Push the Docker image to Google Container Registry
    - name: Publish
      run: |-
        docker push "gcr.io/$PROJECT_ID/$IMAGE:$GITHUB_SHA"

    # Set up kustomize
    - name: Set up Kustomize
      run: |-
        curl -sfLo kustomize https://github.com/kubernetes-sigs/kustomize/releases/download/v3.1.0/kustomize_3.1.0_linux_amd64
        chmod u+x ./kustomize

    # Deploy the Docker image to the GKE cluster
    - name: Deploy
      run: |-
        ./kustomize edit set image gcr.io/PROJECT_ID/IMAGE:TAG=gcr.io/$PROJECT_ID/$IMAGE:$GITHUB_SHA
        ./kustomize build . | kubectl apply -f -
        kubectl rollout status deployment/$DEPLOYMENT_NAME
        kubectl get services -o wide
```

## Further reading

For more information on the tools used in these examples, see the following documentation:

* For the full workflow template, see the ["Build and Deploy to GKE" workflow](https://github.com/actions/starter-workflows/blob/main/deployments/google.yml).
* The Kubernetes YAML customization engine: [Kustomize](https://kustomize.io/).
* [Deploying a containerized web application](https://cloud.google.com/kubernetes-engine/docs/tutorials/hello-app) in the Google Kubernetes Engine documentation.
---

# Deploying Java to Azure App Service

Learn how to deploy a Java project to Azure App Service as part of your continuous deployment (CD) workflows.

## Prerequisites

Before creating your GitHub Actions workflow, you will first need to complete the following setup steps:

1. Create an Azure App Service plan.

   For example, you can use the Azure CLI to create a new App Service plan:

   ```bash copy
   az appservice plan create \
      --resource-group MY_RESOURCE_GROUP \
      --name MY_APP_SERVICE_PLAN \
      --is-linux
   ```

   In the command above, replace `MY_RESOURCE_GROUP` with your pre-existing Azure Resource Group, and `MY_APP_SERVICE_PLAN` with a new name for the App Service plan.

   See the Azure documentation for more information on using the [Azure CLI](https://docs.microsoft.com/cli/azure/):

   * For authentication, see [Sign in with Azure CLI](https://docs.microsoft.com/cli/azure/authenticate-azure-cli).
   * If you need to create a new resource group, see [az group](https://docs.microsoft.com/cli/azure/group?view=azure-cli-latest#az_group_create).

2. Create a web app.

   For example, you can use the Azure CLI to create an Azure App Service web app with a Java runtime:

   ```bash copy
   az webapp create \
       --name MY_WEBAPP_NAME \
       --plan MY_APP_SERVICE_PLAN \
       --resource-group MY_RESOURCE_GROUP \
       --runtime "JAVA|11-java11"
   ```

   In the command above, replace the parameters with your own values, where `MY_WEBAPP_NAME` is a new name for the web app.

3. Configure an Azure publish profile and create an `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

   Generate your Azure deployment credentials using a publish profile. For more information, see [Generate deployment credentials](https://docs.microsoft.com/azure/app-service/deploy-github-actions?tabs=applevel#generate-deployment-credentials) in the Azure documentation.

   In your GitHub repository, create a secret named `AZURE_WEBAPP_PUBLISH_PROFILE` that contains the contents of the publish profile. For more information on creating secrets, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

4. Optionally, configure a deployment environment. Environments are used to describe a general deployment target like `production`, `staging`, or `development`. When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. You can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, gate deployments with custom deployment protection rules, or limit access to secrets. For more information about creating environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

## Creating the workflow

Once you've completed the prerequisites, you can proceed with creating the workflow.

The following example workflow demonstrates how to build and deploy a Java project to Azure App Service when there is a push to the `main` branch.

Ensure that you set `AZURE_WEBAPP_NAME` in the workflow `env` key to the name of the web app you created. If you want to use a Java version other than `11`, change `JAVA_VERSION`.

If you configured a deployment environment, change the value of `environment` to be the name of your environment. If you did not configure an environment or if your workflow is in a private repository and you do not use GitHub Enterprise Cloud, delete the `environment` key.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Build and deploy JAR app to Azure Web App

env:
  AZURE_WEBAPP_NAME: MY_WEBAPP_NAME   # set this to your application's name
  JAVA_VERSION: '11'                  # set this to the Java version to use

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - name: Set up Java version
        uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          cache: 'maven'

      - name: Build with Maven
        run: mvn clean install

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v4
        with:
          name: java-app
          path: '${{ github.workspace }}/target/*.jar'

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v5
        with:
          name: java-app

      - name: Deploy to Azure Web App
        id: deploy-to-webapp
        uses: azure/webapps-deploy@85270a1854658d167ab239bce43949edb336fa7c
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: '*.jar'
```

## Further reading

* For the original workflow template, see [`azure-webapps-java-jar.yml`](https://github.com/actions/starter-workflows/blob/main/deployments/azure-webapps-java-jar.yml) in the GitHub Actions `starter-workflows` repository.
* The action used to deploy the web app is the official Azure [`Azure/webapps-deploy`](https://github.com/Azure/webapps-deploy) action.
* For more examples of GitHub Action workflows that deploy to Azure, see the [actions-workflow-samples](https://github.com/Azure/actions-workflow-samples) repository.
---

# Deploying .NET to Azure App Service

Learn how to deploy a .NET project to Azure App Service as part of your continuous deployment (CD) workflows.

## Prerequisites

Before creating your GitHub Actions workflow, you will first need to complete the following setup steps:

1. Create an Azure App Service plan.

   For example, you can use the Azure CLI to create a new App Service plan:

   ```bash copy
   az appservice plan create \
      --resource-group MY_RESOURCE_GROUP \
      --name MY_APP_SERVICE_PLAN \
      --is-linux
   ```

   In the command above, replace `MY_RESOURCE_GROUP` with your pre-existing Azure Resource Group, and `MY_APP_SERVICE_PLAN` with a new name for the App Service plan.

   See the Azure documentation for more information on using the [Azure CLI](https://docs.microsoft.com/cli/azure/):

   * For authentication, see [Sign in with Azure CLI](https://docs.microsoft.com/cli/azure/authenticate-azure-cli).
   * If you need to create a new resource group, see [az group](https://docs.microsoft.com/cli/azure/group?view=azure-cli-latest#az_group_create).

2. Create a web app.

   For example, you can use the Azure CLI to create an Azure App Service web app with a .NET runtime:

   ```bash copy
   az webapp create \
       --name MY_WEBAPP_NAME \
       --plan MY_APP_SERVICE_PLAN \
       --resource-group MY_RESOURCE_GROUP \
       --runtime "DOTNET|5.0"
   ```

   In the command above, replace the parameters with your own values, where `MY_WEBAPP_NAME` is a new name for the web app.

3. Configure an Azure publish profile and create an `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

   Generate your Azure deployment credentials using a publish profile. For more information, see [Generate deployment credentials](https://docs.microsoft.com/azure/app-service/deploy-github-actions?tabs=applevel#generate-deployment-credentials) in the Azure documentation.

   In your GitHub repository, create a secret named `AZURE_WEBAPP_PUBLISH_PROFILE` that contains the contents of the publish profile. For more information on creating secrets, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

4. Optionally, configure a deployment environment. Environments are used to describe a general deployment target like `production`, `staging`, or `development`. When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. You can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, gate deployments with custom deployment protection rules, or limit access to secrets. For more information about creating environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

## Creating the workflow

Once you've completed the prerequisites, you can proceed with creating the workflow.

The following example workflow demonstrates how to build and deploy a .NET project to Azure App Service when there is a push to the `main` branch.

Ensure that you set `AZURE_WEBAPP_NAME` in the workflow `env` key to the name of the web app you created. If the path to your project is not the repository root, change `AZURE_WEBAPP_PACKAGE_PATH`. If you use a version of .NET other than `5`, change `DOTNET_VERSION`.

If you configured a deployment environment, change the value of `environment` to be the name of your environment. If you did not configure an environment or if your workflow is in a private repository and you do not use GitHub Enterprise Cloud, delete the `environment` key.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Build and deploy ASP.Net Core app to an Azure Web App

env:
  AZURE_WEBAPP_NAME: MY_WEBAPP_NAME   # set this to your application's name
  AZURE_WEBAPP_PACKAGE_PATH: '.'      # set this to the path to your web app project, defaults to the repository root
  DOTNET_VERSION: '5'                 # set this to the .NET Core version to use

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - name: Set up .NET Core
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Set up dependency caching for faster builds
        uses: actions/cache@v4
        with:
          path: ~/.nuget/packages
          key: ${{ runner.os }}-nuget-${{ hashFiles('**/packages.lock.json') }}
          restore-keys: |
            ${{ runner.os }}-nuget-

      - name: Build with dotnet
        run: dotnet build --configuration Release

      - name: dotnet publish
        run: dotnet publish -c Release -o ${{env.DOTNET_ROOT}}/myapp

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v4
        with:
          name: .net-app
          path: ${{env.DOTNET_ROOT}}/myapp

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v5
        with:
          name: .net-app

      - name: Deploy to Azure Web App
        id: deploy-to-webapp
        uses: azure/webapps-deploy@85270a1854658d167ab239bce43949edb336fa7c
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}
```

## Further reading

* For the original workflow template, see [`azure-webapps-dotnet-core.yml`](https://github.com/actions/starter-workflows/blob/main/deployments/azure-webapps-dotnet-core.yml) in the GitHub Actions `starter-workflows` repository.
* The action used to deploy the web app is the official Azure [`Azure/webapps-deploy`](https://github.com/Azure/webapps-deploy) action.
* For more examples of GitHub Action workflows that deploy to Azure, see the [actions-workflow-samples](https://github.com/Azure/actions-workflow-samples) repository.
---

# Deploying Node.js to Azure App Service

Learn how to deploy a Node.js project to Azure App Service as part of your continuous deployment (CD) workflows.

## Prerequisites

Before creating your GitHub Actions workflow, you will first need to complete the following setup steps:

1. Create an Azure App Service plan.

   For example, you can use the Azure CLI to create a new App Service plan:

   ```bash copy
   az appservice plan create \
      --resource-group MY_RESOURCE_GROUP \
      --name MY_APP_SERVICE_PLAN \
      --is-linux
   ```

   In the command above, replace `MY_RESOURCE_GROUP` with your pre-existing Azure Resource Group, and `MY_APP_SERVICE_PLAN` with a new name for the App Service plan.

   See the Azure documentation for more information on using the [Azure CLI](https://docs.microsoft.com/cli/azure/):

   * For authentication, see [Sign in with Azure CLI](https://docs.microsoft.com/cli/azure/authenticate-azure-cli).
   * If you need to create a new resource group, see [az group](https://docs.microsoft.com/cli/azure/group?view=azure-cli-latest#az_group_create).

2. Create a web app.

   For example, you can use the Azure CLI to create an Azure App Service web app with a Node.js runtime:

   ```bash copy
   az webapp create \
       --name MY_WEBAPP_NAME \
       --plan MY_APP_SERVICE_PLAN \
       --resource-group MY_RESOURCE_GROUP \
       --runtime "NODE|14-lts"
   ```

   In the command above, replace the parameters with your own values, where `MY_WEBAPP_NAME` is a new name for the web app.

3. Configure an Azure publish profile and create an `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

   Generate your Azure deployment credentials using a publish profile. For more information, see [Generate deployment credentials](https://docs.microsoft.com/azure/app-service/deploy-github-actions?tabs=applevel#generate-deployment-credentials) in the Azure documentation.

   In your GitHub repository, create a secret named `AZURE_WEBAPP_PUBLISH_PROFILE` that contains the contents of the publish profile. For more information on creating secrets, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

4. Optionally, configure a deployment environment. Environments are used to describe a general deployment target like `production`, `staging`, or `development`. When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. You can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, gate deployments with custom deployment protection rules, or limit access to secrets. For more information about creating environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

## Creating the workflow

Once you've completed the prerequisites, you can proceed with creating the workflow.

The following example workflow demonstrates how to build, test, and deploy the Node.js project to Azure App Service when there is a push to the `main` branch.

Ensure that you set `AZURE_WEBAPP_NAME` in the workflow `env` key to the name of the web app you created. If the path to your project is not the repository root, change `AZURE_WEBAPP_PACKAGE_PATH` to your project path. If you use a version of Node.js other than `10.x`, change `NODE_VERSION` to the version that you use.

If you configured a deployment environment, change the value of `environment` to be the name of your environment. If you did not configure an environment or if your workflow is in a private repository and you do not use GitHub Enterprise Cloud, delete the `environment` key.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

on:
  push:
    branches:
      - main

env:
  AZURE_WEBAPP_NAME: MY_WEBAPP_NAME   # set this to your application's name
  AZURE_WEBAPP_PACKAGE_PATH: '.'      # set this to the path to your web app project, defaults to the repository root
  NODE_VERSION: '14.x'                # set this to the node version to use

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v5

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: npm install, build, and test
      run: |
        npm install
        npm run build --if-present
        npm run test --if-present
    - name: Upload artifact for deployment job
      uses: actions/upload-artifact@v4
      with:
        name: node-app
        path: .

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
    - name: Download artifact from build job
      uses: actions/download-artifact@v5
      with:
        name: node-app

    - name: 'Deploy to Azure WebApp'
      id: deploy-to-webapp
      uses: azure/webapps-deploy@85270a1854658d167ab239bce43949edb336fa7c
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}
```

## Further reading

* For the original workflow template, see [`azure-webapps-node.yml`](https://github.com/actions/starter-workflows/blob/main/deployments/azure-webapps-node.yml) in the GitHub Actions `starter-workflows` repository.
* The action used to deploy the web app is the official Azure [`Azure/webapps-deploy`](https://github.com/Azure/webapps-deploy) action.
* For more examples of GitHub Action workflows that deploy to Azure, see the [actions-workflow-samples](https://github.com/Azure/actions-workflow-samples) repository.
* The [Create a Node.js web app in Azure](https://docs.microsoft.com/azure/app-service/quickstart-nodejs) quickstart in the Azure web app documentation demonstrates using Visual Studio Code with the [Azure App Service extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice).
---

# Deploying PHP to Azure App Service

Learn how to deploy a PHP project to Azure App Service as part of your continuous deployment (CD) workflows.

## Prerequisites

Before creating your GitHub Actions workflow, you will first need to complete the following setup steps:

1. Create an Azure App Service plan.

   For example, you can use the Azure CLI to create a new App Service plan:

   ```bash copy
   az appservice plan create \
      --resource-group MY_RESOURCE_GROUP \
      --name MY_APP_SERVICE_PLAN \
      --is-linux
   ```

   In the command above, replace `MY_RESOURCE_GROUP` with your pre-existing Azure Resource Group, and `MY_APP_SERVICE_PLAN` with a new name for the App Service plan.

   See the Azure documentation for more information on using the [Azure CLI](https://docs.microsoft.com/cli/azure/):

   * For authentication, see [Sign in with Azure CLI](https://docs.microsoft.com/cli/azure/authenticate-azure-cli).
   * If you need to create a new resource group, see [az group](https://docs.microsoft.com/cli/azure/group?view=azure-cli-latest#az_group_create).

2. Create a web app.

   For example, you can use the Azure CLI to create an Azure App Service web app with a PHP runtime:

   ```bash copy
   az webapp create \
       --name MY_WEBAPP_NAME \
       --plan MY_APP_SERVICE_PLAN \
       --resource-group MY_RESOURCE_GROUP \
       --runtime "php|7.4"
   ```

   In the command above, replace the parameters with your own values, where `MY_WEBAPP_NAME` is a new name for the web app.

3. Configure an Azure publish profile and create an `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

   Generate your Azure deployment credentials using a publish profile. For more information, see [Generate deployment credentials](https://docs.microsoft.com/azure/app-service/deploy-github-actions?tabs=applevel#generate-deployment-credentials) in the Azure documentation.

   In your GitHub repository, create a secret named `AZURE_WEBAPP_PUBLISH_PROFILE` that contains the contents of the publish profile. For more information on creating secrets, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

4. Optionally, configure a deployment environment. Environments are used to describe a general deployment target like `production`, `staging`, or `development`. When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. You can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, gate deployments with custom deployment protection rules, or limit access to secrets. For more information about creating environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

## Creating the workflow

Once you've completed the prerequisites, you can proceed with creating the workflow.

The following example workflow demonstrates how to build and deploy a PHP project to Azure App Service when there is a push to the `main` branch.

Ensure that you set `AZURE_WEBAPP_NAME` in the workflow `env` key to the name of the web app you created. If the path to your project is not the repository root, change `AZURE_WEBAPP_PACKAGE_PATH` to the path to your project. If you use a version of PHP other than `8.x`, change`PHP_VERSION` to the version that you use.

If you configured a deployment environment, change the value of `environment` to be the name of your environment. If you did not configure an environment or if your workflow is in a private repository and you do not use GitHub Enterprise Cloud, delete the `environment` key.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Build and deploy PHP app to Azure Web App

env:
  AZURE_WEBAPP_NAME: MY_WEBAPP_NAME   # set this to your application's name
  AZURE_WEBAPP_PACKAGE_PATH: '.'      # set this to the path to your web app project, defaults to the repository root
  PHP_VERSION: '8.x'                  # set this to the PHP version to use

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - name: Setup PHP
        uses: shivammathur/setup-php@1f2e3d4c5b6a7f8e9d0c1b2a3e4f5d6c7b8a9e0f
        with:
          php-version: ${{ env.PHP_VERSION }}

      - name: Check if composer.json exists
        id: check_files
        uses: andstor/file-existence-action@2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
        with:
          files: 'composer.json'

      - name: Get Composer Cache Directory
        id: composer-cache
        if: steps.check_files.outputs.files_exists == 'true'
        run: |
          echo "dir=$(composer config cache-files-dir)" >> $GITHUB_OUTPUT

      - name: Set up dependency caching for faster installs
        uses: actions/cache@v4
        if: steps.check_files.outputs.files_exists == 'true'
        with:
          path: ${{ steps.composer-cache.outputs.dir }}
          key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
          restore-keys: |
            ${{ runner.os }}-composer-

      - name: Run composer install if composer.json exists
        if: steps.check_files.outputs.files_exists == 'true'
        run: composer validate --no-check-publish && composer install --prefer-dist --no-progress

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v4
        with:
          name: php-app
          path: .

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v5
        with:
          name: php-app

      - name: 'Deploy to Azure Web App'
        id: deploy-to-webapp
        uses: azure/webapps-deploy@85270a1854658d167ab239bce43949edb336fa7c
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

## Further reading

* For the original workflow template, see [`azure-webapps-php.yml`](https://github.com/actions/starter-workflows/blob/main/deployments/azure-webapps-php.yml) in the GitHub Actions `starter-workflows` repository.
* The action used to deploy the web app is the official Azure [`Azure/webapps-deploy`](https://github.com/Azure/webapps-deploy) action.
* For more examples of GitHub Action workflows that deploy to Azure, see the [actions-workflow-samples](https://github.com/Azure/actions-workflow-samples) repository.
---

# Deploying Python to Azure App Service

Learn how to deploy a Python project to Azure App Service as part of your continuous deployment (CD) workflows.

## Prerequisites

Before creating your GitHub Actions workflow, you will first need to complete the following setup steps:

1. Create an Azure App Service plan.

   For example, you can use the Azure CLI to create a new App Service plan:

   ```bash copy
   az appservice plan create \
      --resource-group MY_RESOURCE_GROUP \
      --name MY_APP_SERVICE_PLAN \
      --is-linux
   ```

   In the command above, replace `MY_RESOURCE_GROUP` with your pre-existing Azure Resource Group, and `MY_APP_SERVICE_PLAN` with a new name for the App Service plan.

   See the Azure documentation for more information on using the [Azure CLI](https://docs.microsoft.com/cli/azure/):

   * For authentication, see [Sign in with Azure CLI](https://docs.microsoft.com/cli/azure/authenticate-azure-cli).
   * If you need to create a new resource group, see [az group](https://docs.microsoft.com/cli/azure/group?view=azure-cli-latest#az_group_create).

2. Create a web app.

   For example, you can use the Azure CLI to create an Azure App Service web app with a Python runtime:

   ```bash copy
   az webapp create \
       --name MY_WEBAPP_NAME \
       --plan MY_APP_SERVICE_PLAN \
       --resource-group MY_RESOURCE_GROUP \
       --runtime "python|3.8"
   ```

   In the command above, replace the parameters with your own values, where `MY_WEBAPP_NAME` is a new name for the web app.

3. Configure an Azure publish profile and create an `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

   Generate your Azure deployment credentials using a publish profile. For more information, see [Generate deployment credentials](https://docs.microsoft.com/azure/app-service/deploy-github-actions?tabs=applevel#generate-deployment-credentials) in the Azure documentation.

   In your GitHub repository, create a secret named `AZURE_WEBAPP_PUBLISH_PROFILE` that contains the contents of the publish profile. For more information on creating secrets, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

4. Add an app setting called `SCM_DO_BUILD_DURING_DEPLOYMENT` and set the value to `1`.

5. Optionally, configure a deployment environment. Environments are used to describe a general deployment target like `production`, `staging`, or `development`. When a GitHub Actions workflow deploys to an environment, the environment is displayed on the main page of the repository. You can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, gate deployments with custom deployment protection rules, or limit access to secrets. For more information about creating environments, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

## Creating the workflow

Once you've completed the prerequisites, you can proceed with creating the workflow.

The following example workflow demonstrates how to build and deploy a Python project to Azure App Service when there is a push to the `main` branch.

Ensure that you set `AZURE_WEBAPP_NAME` in the workflow `env` key to the name of the web app you created. If you use a version of Python other than `3.8`, change `PYTHON_VERSION` to the version that you use.

If you configured a deployment environment, change the value of `environment` to be the name of your environment. If you did not configure an environment or if your workflow is in a private repository and you do not use GitHub Enterprise Cloud, delete the `environment` key.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# GitHub recommends pinning actions to a commit SHA.
# To get a newer version, you will need to update the SHA.
# You can also reference a tag or branch, but the action may change without warning.

name: Build and deploy Python app to Azure Web App

env:
  AZURE_WEBAPP_NAME: MY_WEBAPP_NAME   # set this to your application's name
  PYTHON_VERSION: '3.8'               # set this to the Python version to use

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - name: Set up Python version
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Create and start virtual environment
        run: |
          python -m venv venv
          source venv/bin/activate

      - name: Set up dependency caching for faster installs
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install dependencies
        run: pip install -r requirements.txt

      # Optional: Add a step to run tests here (PyTest, Django test suites, etc.)

      - name: Upload artifact for deployment jobs
        uses: actions/upload-artifact@v4
        with:
          name: python-app
          path: |
            .
            !venv/
  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v5
        with:
          name: python-app
          path: .

      - name: 'Deploy to Azure Web App'
        id: deploy-to-webapp
        uses: azure/webapps-deploy@85270a1854658d167ab239bce43949edb336fa7c
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

## Further reading

* For the original workflow template, see [`azure-webapps-python.yml`](https://github.com/actions/starter-workflows/blob/main/deployments/azure-webapps-python.yml) in the GitHub Actions `starter-workflows` repository.
* The action used to deploy the web app is the official Azure [`Azure/webapps-deploy`](https://github.com/Azure/webapps-deploy) action.
* For more examples of GitHub Action workflows that deploy to Azure, see the [actions-workflow-samples](https://github.com/Azure/actions-workflow-samples) repository.
---

# Installing an Apple certificate on macOS runners for Xcode development

Learn how to sign Xcode apps within a continuous integration (CI) workflow by installing an Apple code signing certificate on GitHub Actions runners.

## Prerequisites

You should be familiar with YAML and the syntax for GitHub Actions. For more information, see:

* [Writing workflows](/en/actions/learn-github-actions)
* [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions)

You should have an understanding of Xcode app building and signing. For more information, see the [Apple developer documentation](https://developer.apple.com/documentation/).

## Creating secrets for your certificate and provisioning profile

The signing process involves storing certificates and provisioning profiles, transferring them to the runner, importing them to the runner's keychain, and using them in your build.

To use your certificate and provisioning profile on a runner, we strongly recommend that you use GitHub secrets. For more information on creating secrets and using them in a workflow, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions).

Create secrets in your repository or organization for the following items:

* Your Apple signing certificate.

  * This is your `p12` certificate file. For more information on exporting your signing certificate from Xcode, see the [Xcode documentation](https://help.apple.com/xcode/mac/current/#/dev154b28f09).

  * You should convert your certificate to Base64 when saving it as a secret. In this example, the secret is named `BUILD_CERTIFICATE_BASE64`.

  * Use the following command to convert your certificate to Base64 and copy it to your clipboard:

    ```shell
    base64 -i BUILD_CERTIFICATE.p12 | pbcopy
    ```

* The password for your Apple signing certificate.
  * In this example, the secret is named `P12_PASSWORD`.

* Your Apple provisioning profile.

  * For more information on exporting your provisioning profile from Xcode, see the [Xcode documentation](https://help.apple.com/xcode/mac/current/#/deva899b4fe5).

  * You should convert your provisioning profile to Base64 when saving it as a secret. In this example, the secret is named `BUILD_PROVISION_PROFILE_BASE64`.

  * Use the following command to convert your provisioning profile to Base64 and copy it to your clipboard:

    ```shell
    base64 -i PROVISIONING_PROFILE.mobileprovision | pbcopy
    ```

* A keychain password.

  * A new keychain will be created on the runner, so the password for the new keychain can be any new random string. In this example, the secret is named `KEYCHAIN_PASSWORD`.

## Add a step to your workflow

This example workflow includes a step that imports the Apple certificate and provisioning profile from the GitHub secrets, and installs them on the runner.

```yaml copy
name: App build
on: push

jobs:
  build_with_signing:
    runs-on: macos-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5
      - name: Install the Apple certificate and provisioning profile
        env:
          BUILD_CERTIFICATE_BASE64: ${{ secrets.BUILD_CERTIFICATE_BASE64 }}
          P12_PASSWORD: ${{ secrets.P12_PASSWORD }}
          BUILD_PROVISION_PROFILE_BASE64: ${{ secrets.BUILD_PROVISION_PROFILE_BASE64 }}
          KEYCHAIN_PASSWORD: ${{ secrets.KEYCHAIN_PASSWORD }}
        run: |
          # create variables
          CERTIFICATE_PATH=$RUNNER_TEMP/build_certificate.p12
          PP_PATH=$RUNNER_TEMP/build_pp.mobileprovision
          KEYCHAIN_PATH=$RUNNER_TEMP/app-signing.keychain-db

          # import certificate and provisioning profile from secrets
          echo -n "$BUILD_CERTIFICATE_BASE64" | base64 --decode -o $CERTIFICATE_PATH
          echo -n "$BUILD_PROVISION_PROFILE_BASE64" | base64 --decode -o $PP_PATH

          # create temporary keychain
          security create-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH
          security set-keychain-settings -lut 21600 $KEYCHAIN_PATH
          security unlock-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH

          # import certificate to keychain
          security import $CERTIFICATE_PATH -P "$P12_PASSWORD" -A -t cert -f pkcs12 -k $KEYCHAIN_PATH
          security set-key-partition-list -S apple-tool:,apple: -k "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH
          security list-keychain -d user -s $KEYCHAIN_PATH

          # apply provisioning profile
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          cp $PP_PATH ~/Library/MobileDevice/Provisioning\ Profiles
      - name: Build app
          # ...
```

> \[!NOTE]
> For iOS build targets, your provisioning profile should have the extension `.mobileprovision`. For macOS build targets, the extension should be `.provisionprofile`. The example workflow above should be updated to reflect your target platform.

## Required clean-up on self-hosted runners

GitHub-hosted runners are isolated virtual machines that are automatically destroyed at the end of the job execution. This means that the certificates and provisioning profile used on the runner during the job will be destroyed with the runner when the job is completed.

On self-hosted runners, the `$RUNNER_TEMP` directory is cleaned up at the end of the job execution, but the keychain and provisioning profile might still exist on the runner.

If you use self-hosted runners, you should add a final step to your workflow to help ensure that these sensitive files are deleted at the end of the job. The workflow step shown below is an example of how to do this.

```yaml
- name: Clean up keychain and provisioning profile
  if: ${{ always() }}
  run: |
    security delete-keychain $RUNNER_TEMP/app-signing.keychain-db
    rm ~/Library/MobileDevice/Provisioning\ Profiles/build_pp.mobileprovision
```