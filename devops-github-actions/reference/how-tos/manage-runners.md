# Manage Runners

---

# Using an API gateway with OIDC

You can use OpenID Connect (OIDC) tokens to authenticate your workflow.

## Using an API gateway with OIDC

With GitHub Actions, you can use OpenID Connect (OIDC) tokens to authenticate your workflow outside of GitHub Actions. For example, you could run an API gateway on the edge of your private network that authenticates incoming requests with the OIDC token and then makes API requests on behalf of your workflow in your private network.

The following diagram gives an overview of this solution's architecture:

![Diagram of an OIDC gateway architecture, starting with a GitHub Actions runner and ending with a private network's private service.](/assets/images/help/actions/actions-oidc-gateway.png)

It's important that you verify not just that the OIDC token came from GitHub Actions, but that it came specifically from your expected workflows, so that other GitHub Actions users aren't able to access services in your private network. You can use OIDC claims to create these conditions. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#defining-trust-conditions-on-cloud-roles-using-oidc-claims).

The main disadvantages of this approach are that you must implement the API gateway to make requests on your behalf, and you must run the gateway on the edge of your network.

The following advantages apply.

* You don't need to configure any firewalls, or modify the routing of your private network.
* The API gateway is stateless and scales horizontally to handle high availability and high throughput.

For more information, see [a reference implementation of an API Gateway](https://github.com/github/actions-oidc-gateway-example) in the github/actions-oidc-gateway repository. This implementation requires customization for your use case and is not ready-to-run as-is). For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).
---

# Using WireGuard to create a network overlay

You can create an overlay network between your runner and a service in your private network.

## Using WireGuard to create a network overlay

If you don't want to maintain separate infrastructure for an API Gateway, you can create an overlay network between your runner and a service in your private network, by running WireGuard in both places.

There are various disadvantages to this approach:

* To reach WireGuard running on your private service, you will need a well-known IP address and port that your workflow can reference: this can either be a public IP address and port, a port mapping on a network gateway, or a service that dynamically updates DNS.
* WireGuard doesn't handle NAT traversal out of the box, so you'll need to identify a way to provide this service.
* This connection is one-to-one, so if you need high availability or high throughput you'll need to build that on top of WireGuard.
* You'll need to generate and securely store keys for both the runner and your private service. WireGuard uses UDP, so your network must support UDP traffic.

There are some advantages too, as you can run WireGuard on an existing server so you don't have to maintain separate infrastructure, and it's well supported on GitHub-hosted runners.

## Example: Configuring WireGuard

This example workflow configures WireGuard to connect to a private service.

For this example, the WireGuard instance running in the private network has this configuration:

* Overlay network IP address of `192.168.1.1`
* Public IP address and port of `1.2.3.4:56789`
* Public key `examplepubkey1234...`

The WireGuard instance in the GitHub Actions runner has this configuration:

* Overlay network IP address of `192.168.1.2`
* Private key stores as an GitHub Actions secret under `WIREGUARD_PRIVATE_KEY`

```yaml
name: WireGuard example

on:
  workflow_dispatch:

jobs:
  wireguard_example:
    runs-on: ubuntu-latest
    steps:
      - run: sudo apt install wireguard

      - run: echo "${{ secrets.WIREGUARD_PRIVATE_KEY }}" > privatekey

      - run: sudo ip link add dev wg0 type wireguard

      - run: sudo ip address add dev wg0 192.168.1.2 peer 192.168.1.1

      - run: sudo wg set wg0 listen-port 48123 private-key privatekey peer examplepubkey1234... allowed-ips 0.0.0.0/0 endpoint 1.2.3.4:56789

      - run: sudo ip link set up dev wg0

      - run: curl -vvv http://192.168.1.1
```

For more information, see [WireGuard's Quick Start](https://www.wireguard.com/quickstart/), as well as [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions) for how to securely store keys.

### Using Tailscale to create a network overlay

Tailscale is a commercial product built on top of WireGuard. This option is very similar to WireGuard, except Tailscale is more of a complete product experience instead of an open source component.

Its disadvantages are similar to WireGuard: The connection is one-to-one, so you might need to do additional work for high availability or high throughput. You still need to generate and securely store keys. The protocol is still UDP, so your network must support UDP traffic.

However, there are some advantages over WireGuard: NAT traversal is built-in, so you don't need to expose a port to the public internet. It is by far the quickest of these options to get up and running, since Tailscale provides an GitHub Actions workflow with a single step to connect to the overlay network.

For more information, see the [Tailscale GitHub Action](https://github.com/tailscale/github-action), as well as [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions) for how to securely store keys.
---

# Customizing GitHub-hosted runners

You can install additional software on GitHub-hosted runners as a part of your workflow.

If you require additional software packages on GitHub-hosted runners, you can create a job that installs the packages as part of your workflow.

To see which packages are already installed by default, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#preinstalled-software).

This guide demonstrates how to create a job that installs additional software on a GitHub-hosted runner.

## Installing software on Ubuntu runners

The following example demonstrates how to install an `apt` package as part of a job.

```yaml
name: Build on Ubuntu
on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository code
        uses: actions/checkout@v5
      - name: Install jq tool
        run: |
          sudo apt-get update
          sudo apt-get install jq
```

> \[!NOTE]
> Always run `sudo apt-get update` before installing a package. In case the `apt` index is stale, this command fetches and re-indexes any available packages, which helps prevent package installation failures.

## Installing software on macOS runners

The following example demonstrates how to install Brew packages and casks as part of a job.

```yaml
name: Build on macOS
on: push

jobs:
  build:
    runs-on: macos-latest
    steps:
      - name: Check out repository code
        uses: actions/checkout@v5
      - name: Install GitHub CLI
        run: |
          brew update
          brew install gh
      - name: Install Microsoft Edge
        run: |
          brew update
          brew install --cask microsoft-edge
```

## Installing software on Windows runners

The following example demonstrates how to use [Chocolatey](https://community.chocolatey.org/packages) to install the GitHub CLI as part of a job.

```yaml
name: Build on Windows
on: push
jobs:
  build:
    runs-on: windows-latest
    steps:
      - run: choco install gh
      - run: gh version
```
---

# Using GitHub-hosted runners

You can assign a job to run on a virtual machine hosted by GitHub.

## Using a GitHub-hosted runner

To use a GitHub-hosted runner, create a job and use `runs-on` to specify the type of runner that will process the job, such as `ubuntu-latest`, `windows-latest`, or `macos-latest`. For the full list of runner types, see [GitHub-hosted runners reference](/en/actions/reference/github-hosted-runners-reference#supported-runners-and-hardware-resources). If you have `repo: write` access to a repository, you can view a list of the runners available to use in workflows in the repository. For more information, see [Viewing available runners for a repository](#viewing-available-runners-for-a-repository).

When the job begins, GitHub automatically provisions a new VM for that job. All steps in the job execute on the VM, allowing the steps in that job to share information using the runner's filesystem. You can run workflows directly on the VM or in a Docker container. When the job has finished, the VM is automatically decommissioned.

The following diagram demonstrates how two jobs in a workflow are executed on two different GitHub-hosted runners.

![Diagram of a workflow that consists of two jobs. One job runs on Ubuntu and the other runs on Windows.](/assets/images/help/actions/overview-github-hosted-runner.png)

The following example workflow has two jobs, named `Run-npm-on-Ubuntu` and `Run-PSScriptAnalyzer-on-Windows`. When this workflow is triggered, GitHub provisions a new virtual machine for each job.

* The job named `Run-npm-on-Ubuntu` is executed on a Linux VM, because the job's `runs-on:` specifies `ubuntu-latest`.
* The job named `Run-PSScriptAnalyzer-on-Windows` is executed on a Windows VM, because the job's `runs-on:` specifies `windows-latest`.

```yaml copy
name: Run commands on different operating systems
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  Run-npm-on-Ubuntu:
    name: Run npm on Ubuntu
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm help

  Run-PSScriptAnalyzer-on-Windows:
    name: Run PSScriptAnalyzer on Windows
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v5
      - name: Install PSScriptAnalyzer module
        shell: pwsh
        run: |
          Set-PSRepository PSGallery -InstallationPolicy Trusted
          Install-Module PSScriptAnalyzer -ErrorAction Stop
      - name: Get list of rules
        shell: pwsh
        run: |
          Get-ScriptAnalyzerRule
```

While the job runs, the logs and output can be viewed in the GitHub UI:

![Screenshot of a workflow run. The steps for the "Run PSScriptAnalyzer on Windows" job are displayed.](/assets/images/help/repository/actions-runner-output.png)

The GitHub Actions runner application is open source. You can contribute and file issues in the [runner](https://github.com/actions/runner) repository.

## Viewing available runners for a repository

If you have `repo: write` access to a repository, you can view a list of the runners available to the repository.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, under the "Management" section, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-server" aria-label="server" role="img"><path d="M1.75 1h12.5c.966 0 1.75.784 1.75 1.75v4c0 .372-.116.717-.314 1 .198.283.314.628.314 1v4a1.75 1.75 0 0 1-1.75 1.75H1.75A1.75 1.75 0 0 1 0 12.75v-4c0-.358.109-.707.314-1a1.739 1.739 0 0 1-.314-1v-4C0 1.784.784 1 1.75 1ZM1.5 2.75v4c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-4a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25Zm.25 5.75a.25.25 0 0 0-.25.25v4c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-4a.25.25 0 0 0-.25-.25ZM7 4.75A.75.75 0 0 1 7.75 4h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 4.75ZM7.75 10h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM3 4.75A.75.75 0 0 1 3.75 4h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 4.75ZM3.75 10h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"></path></svg> Runners**.
4. Review the list of available GitHub-hosted runners for the repository.
5. Optionally, to copy a runner's label to use it in a workflow, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More options" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg> to the right of the runner, then click **Copy label**.

> \[!NOTE]
> Enterprise and organization owners can create runners from this page. To create a new runner, click **New runner** at the top right of the list of runners to add runners to the repository.
>
> For more information, see [Managing larger runners](/en/actions/using-github-hosted-runners/managing-larger-runners) and [Adding self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners).
---

# Viewing your current jobs

Monitor how GitHub-hosted runners are processing jobs in your organization or enterprise, and identify any related constraints.

## Viewing active jobs in your organization or enterprise

You can get a list of all jobs currently running on GitHub-hosted runners in your organization or enterprise.

1. Navigate to the main page of the organization or repository.

2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.

3. In the left sidebar, click **Actions**, then click **Runners**.

4. In the "Runners" table, click the entry for **GitHub-hosted runners**. This entry will only be present if you're using GitHub-hosted runners.

5. Review the "Active jobs" section, which contains a list of all jobs currently running on GitHub-hosted runners.

## Viewing queued jobs in your organization or enterprise

GitHub-hosted runners allow you to run jobs concurrently, and the maximum number of concurrent jobs will vary depending on your plan. If you reach the maximum number of concurrent jobs, any new jobs will start to enter a queue. To find out more about the number of concurrent jobs available to your plan, see [Billing and usage](/en/actions/learn-github-actions/usage-limits-billing-and-administration).

The following procedure demonstrates how to check the maximum number of concurrent jobs you can run.

1. Navigate to the main page of the organization or repository.

2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.

3. In the left sidebar, click **Actions**, then click **Runners**.

4. In the "Runners" table, click the entry for **GitHub-hosted runners**. This entry will only be present if you're using GitHub-hosted runners.

5. Review the "All jobs usage" section, which lists the number of active jobs and the maximum number of jobs you can run.
---

# Controlling access to larger runners

You can use policies to limit access to larger runners that have been added to an organization or enterprise.

> \[!NOTE]
> The information and instructions in this article only apply to larger runners with Linux and Windows operating systems.

## Managing access to larger runners

> \[!NOTE]
> Before your workflows can send jobs to larger runners, you must first configure permissions for the runner group. See the following sections for more information.

Runner groups are used to control which repositories can run jobs on your larger runners. You must manage access to the group from each level of the management hierarchy, depending on where you've defined the larger runner:

* **Runners at the enterprise level:** By default, repositories in an organization do not have access to enterprise-level runner groups. To give repositories access to enterprise runner groups, organization owners must configure each enterprise runner group and choose which repositories have access.
* **Runners at the organization level:** By default, all repositories in an organization are granted access to organization-level runner groups. To restrict which repositories have access, organization owners must configure organization runner groups and choose which repositories have access.

For example, the following diagram has a runner group named `grp-ubuntu-24.04-16core` at the enterprise level. Before the repository named `octo-repo` can use the runners in the group, you must first configure the group at the enterprise level to allow access to the `octo-org` organization. You must then configure the group at the organization level to allow access to `octo-repo`.

![Diagram showing a runner group defined at the enterprise level with an organization configuration that allows access for two repositories.](/assets/images/help/actions/hosted-runner-mgmt.png)

## Creating a runner group for an organization

> \[!WARNING]
> If you are using a Fixed IP range, we recommend that you only use larger runners with private repositories. Forks of your repository can potentially run dangerous code on your larger runner by creating a pull request that executes the code in a workflow.

> \[!NOTE]
> When creating a runner group, you must choose a policy that defines which repositories have access to the runner group. To change which repositories and workflows can access the runner group, organization owners can set a policy for the organization. For more information, see [Enforcing policies for GitHub Actions in your enterprise](/en/enterprise-cloud@latest/admin/policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#disabling-repository-level-self-hosted-runners).

All organizations have a single default runner group. Organization owners using the GitHub Team plan can create additional organization-level runner groups.

If no group is specified during the registration process, runners are automatically added to the default group. You can later move the runner from the default group to a custom group.

For information about how to create a runner group with the REST API, see [REST API endpoints for GitHub Actions](/en/rest/actions#self-hosted-runner-groups).

1. On GitHub, navigate to the main page of the organization.

2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)

3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runner groups**.

4. In the "Runner groups" section, click **New runner group**.

5. Enter a name for your runner group.

6. Assign a policy for repository access.

   You can configure a runner group to be accessible to a specific list of repositories, or to all repositories in the organization. By default, only private repositories can access runners in a runner group, but you can override this. This setting can't be overridden if configuring an organization's runner group that was shared by an enterprise.

7. Click **Create group** to create the group and apply the policy.

## Changing which repositories can access a runner group

> \[!WARNING]
> If you are using a Fixed IP range, we recommend that you only use larger runners with private repositories. Forks of your repository can potentially run dangerous code on your larger runner by creating a pull request that executes the code in a workflow.

For runner groups in an organization, you can change what repositories in the organization can access a runner group.

1. Navigate to the main page of the organization where your runner groups are located.

2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.

3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runner groups**.

4. In the list of groups, click the runner group you'd like to configure.

5. Under "Repository access," use the dropdown menu to click **Selected repositories**.
   1. To the right of the dropdown menu, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="The Gear icon" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>.
   2. In the popup, use the checkboxes to select repositories that can access this runner group.

6. Click **Save group**.

## Configuring private network access for larger runners

You can use GitHub-hosted runners in an Azure VNET. This enables you to use GitHub-managed infrastructure for CI/CD while providing you with full control over the networking policies of your runners. For more information about Azure VNET, see [What is Azure Virtual Network?](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview) in the Azure documentation.

If you have configured your organization to connect to an Azure VNET, you can give runner groups access to the virtual network. For more information, see [Private networking with GitHub-hosted runners](/en/actions/using-github-hosted-runners/connecting-to-a-private-network/about-private-networking-with-github-hosted-runners#using-an-azure-virtual-network-vnet).

## Changing the name of a runner group

1. Navigate to the main page of the organization where your runner groups are located.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runner groups**.
4. In the list of groups, click the runner group you'd like to configure.
5. Enter the new runner group name in the text field under "Group name."
6. Click **Save**.

## Moving a runner to a group

If you don't specify a runner group during the registration process, your new runners are automatically assigned to the default group, and can then be moved to another group.

1. On GitHub, navigate to the main page of the organization.
2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the "Runners" list, click the runner that you want to configure.
5. Select the **Runner group** drop-down.
6. In "Move runner to group", choose a destination group for the runner.

## Removing a runner group

In order to remove a runner group, you must first move or remove all of the runners from the group.

1. Navigate to the main page of the organization where your runner groups are located.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runner groups**.
4. In the list of groups, to the right of the group you want to delete, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="The horizontal kebab icon" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>.
5. To remove the group, click **Remove group**.
6. Review the confirmation prompts, and click **Remove this runner group**.
---

# Managing larger runners

You can configure larger runners for your organization or enterprise.

> \[!NOTE]
>
> * The information and instructions in this article only apply to larger runners with Linux and Windows operating systems.

## Adding a larger runner to an organization

Organization owners can add a larger runner to an organization and control which repositories can use it. When you create a new runner for an organization, by default, all repositories in the organization have access to the runner. To limit which repositories can use the runner, assign it to a runner group with access to specific repositories. For more information, see [Allowing repositories to access larger runners](#allowing-repositories-to-access-larger-runners).

You can choose an operating system and a hardware configuration from the list of available options. When new instances of this runner are deployed through autoscaling, they'll use the same operating system and hardware configuration you've defined here.

New runners are automatically assigned to the default group, or you can choose which group the runners must join during the runner creation process. In addition, you can modify the runner's group membership after you've registered the runner. For more information, see [Controlling access to larger runners](/en/actions/using-github-hosted-runners/controlling-access-to-larger-runners).

1. On GitHub, navigate to the main page of the organization.

2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)

3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.

4. Click **New runner**, then click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-mark-github" aria-label="mark-github" role="img"><path d="M6.766 11.695C4.703 11.437 3.25 9.904 3.25 7.92c0-.806.281-1.677.75-2.258-.203-.532-.172-1.662.062-2.129.626-.081 1.469.258 1.969.726.594-.194 1.219-.291 1.985-.291.765 0 1.39.097 1.953.274.484-.451 1.343-.79 1.969-.709.218.435.25 1.564.046 2.113.5.613.766 1.436.766 2.274 0 1.984-1.453 3.485-3.547 3.759.531.355.891 1.129.891 2.016v1.678c0 .484.39.758.859.564C13.781 14.824 16 11.905 16 8.291 16 3.726 12.406 0 7.984 0 3.562 0 0 3.726 0 8.291c0 3.581 2.203 6.55 5.172 7.663A.595.595 0 0 0 6 15.389v-1.291c-.219.097-.5.162-.75.162-1.031 0-1.641-.581-2.078-1.662-.172-.435-.36-.693-.719-.742-.187-.016-.25-.097-.25-.193 0-.194.313-.339.625-.339.453 0 .844.29 1.25.887.313.468.641.678 1.031.678.391 0 .641-.146 1-.516.266-.275.469-.517.657-.678Z"></path></svg> New GitHub-hosted runner**.

5. Complete the required details to configure your new runner:

   * **Name:** Enter a name for your new runner. For easier identification, this should indicate its hardware and operating configuration, such as `ubuntu-24.04-16core`.

   * **Platform:** Choose a platform from the available options. Once you've selected a platform, you will be able to choose a specific image.

     If you are building a custom image, the platform that you select for your runner must match the platform of the image you want to build. The platform of the runner can be one of the following:

     * Linux x64
     * Linux ARM64
     * Windows x64

   * **Image:** Choose an image from the available options. Once you've selected an image, you will be able to choose a specific size.
     * **GitHub-owned:** For images managed by GitHub, select an image under this tab.
     * **Partner:** For images managed by a partner, select an image under this tab. ex: Base Windows 11 desktop, GPU-optimized, and arm64 images are located under this tab.
     * **Custom:** For images that are created by your organization or enterprise, select an image under this tab. Custom images are created by running a workflow on an image-building runner that you, your organization, or your enterprise have set up. For more information, see [Installing custom images](/en/actions/how-tos/manage-runners/larger-runners/use-custom-images#installing-custom-images).

   * **Size:** Choose a hardware configuration from the list of available options. The available sizes depend on the image that you selected in a previous step. For GPU runners, select a size under the **GPU-powered** tab.

   * **Maximum concurrency:** Choose the maximum number of jobs that can be active at any time.

   * **Runner group:** Choose the group that your runner will be a member of. This group will host multiple instances of your runner, as they scale up and down to suit demand.

   > \[!NOTE]
   > The names of larger runners can dictate their functionality. For example, to use a larger runner for code scanning default setup, the runner must be named `code-scanning`. For more information on code scanning with larger runners, see [Configuring larger runners for default setup](/en/code-security/code-scanning/managing-your-code-scanning-configuration/configuring-larger-runners-for-default-setup).

6. Click **Create runner**.

7. To allow repositories to access your larger runners, add them to the list of repositories that can use it. For more information, see [Allowing repositories to access larger runners](#allowing-repositories-to-access-larger-runners).

## Allowing repositories to access larger runners

Repositories are granted access to larger runners through runner groups. Enterprise administrators can choose which organizations are granted access to enterprise-level runner groups, and organization owners control repository-level access to all larger runners.

Organization owners can use and configure enterprise-level runner groups for the repositories in their organization, or they can create organization-level runner groups to control access.

* **For enterprise-level runner groups:** By default, repositories in an organization do not have access to enterprise-level runner groups. To give repositories access to enterprise runner groups, organization owners must configure each enterprise runner group and choose which repositories have access.
* **For organization-level runner groups:** By default, all repositories in an organization are granted access to organization-level runner groups. To restrict which repositories have access, organization owners must configure organization runner groups and choose which repositories have access.

Once a repository has access to larger runners, the larger runners can be added to workflow files. For more information, see [Running jobs on larger runners](/en/actions/using-github-hosted-runners/running-jobs-on-larger-runners).

1. Navigate to the main page of the organization where your runner groups are located.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runner groups**.
4. Select a runner group from either list on the page. Organization-level runner groups are listed at the top of the page, and enterprise-level runner groups are listed under "Shared by the Enterprise."
5. On the runner group page, under "Repository access," select **All repositories** or **Selected repositories**. If you choose to grant access to specific repositories, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="The Settings gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>, then select the repositories you would like to grant access to from the list.

> \[!WARNING]
> If you are using a Fixed IP range, we recommend that you only use larger runners with private repositories. Forks of your repository can potentially run dangerous code on your larger runner by creating a pull request that executes the code in a workflow.
> For more information, see [Controlling access to larger runners](/en/actions/using-github-hosted-runners/controlling-access-to-larger-runners).

## Changing the name of a larger runner

> \[!NOTE]
> The names of larger runners can dictate their functionality. For example, to use a larger runner for code scanning default setup, the runner must be named `code-scanning`. For more information on code scanning with larger runners, see [Configuring larger runners for default setup](/en/code-security/code-scanning/managing-your-code-scanning-configuration/configuring-larger-runners-for-default-setup).

1. On GitHub, navigate to the main page of the organization.
2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the list of runners, select the runner you would like to edit.
5. Enter a new name for the runner in the text field under "Name."
6. Click **Save**.

## Changing the size of a larger runner

1. On GitHub, navigate to the main page of the organization.
2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the list of runners, select the runner you would like to edit.
5. Select a new size for the runner from the list of available options under "Size." The available sizes depend on the image that is installed on the runner.
6. Click **Save**.

## Changing the image of a larger runner

1. On GitHub, navigate to the main page of the organization.
2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the list of runners, select the runner you would like to edit.
5. Select a new image for the runner from the list of available options under "Image." The available images are limited to GitHub-owned images.
6. Click **Save**.

## Configuring autoscaling for larger runners

You can control the maximum number of jobs allowed to run concurrently for specific runner sets. Setting this field to a higher value can help prevent workflows being blocked due to parallelism.

1. On GitHub, navigate to the main page of the organization.
2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the list of runners, select the runner you would like to edit.
5. In the "Capacity" section, under "Maximum concurrency", enter the maximum number of jobs you would like to allow to run at the same time.
6. Click **Save**.

## Creating static IP addresses for larger runners

> \[!NOTE]
> To use static IP addresses, your organization must use GitHub Enterprise Cloud. For more information about how you can try GitHub Enterprise Cloud for free, see [Setting up a trial of GitHub Enterprise Cloud](/en/enterprise-cloud@latest/admin/overview/setting-up-a-trial-of-github-enterprise-cloud).

You can enable static IP addresses for larger runners. When you do this, the larger runners are assigned static IP address ranges. All IP addresses in the range assigned are usable. By default, you can configure up to 10 different larger runners with IP ranges for your account. If you would like to use more than 10 larger runners with static IP address ranges, please contact us through the [GitHub Support portal](https://support.github.com).

The number of available IP addresses in the assigned ranges does not restrict number of concurrent jobs specified for autoscaling. Within a runner pool, there is a load balancer which allows for high reuse of the IP addresses in the assigned ranges. This ensures your workflows can run concurrently at scale while each machine is assigned a static IP address.

1. On GitHub, navigate to the main page of the organization.
2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the list of runners, select the runner you would like to edit.
5. To assign static IP addresses to the runner, under "Networking," check **Assign unique & static public IP address ranges for this runner**.
6. Click **Save**.
---

# Using custom images

Create, manage, and use custom images for GitHub-hosted larger runners in your organization or enterprise.

> \[!NOTE]
> Custom images are in public preview and subject to change.

## Custom images

You can create a custom image to define the exact environment that your GitHub-hosted larger runners use. Custom images let you preinstall tools, dependencies, and configurations to speed up workflows and improve consistency across jobs.

When your runner uses a custom image, it acts as a “pre-warmed” environment, allowing workflows to complete quicker, by downloading packages and binaries once during image creation instead of every time a workflow is run. For more information about custom images, see [Runner images](/en/actions/concepts/runners/github-hosted-runners#runner-images).

The process of using a custom image involves three main steps:

1. [Setting up an image-generation runner](#setting-up-an-image-generation-runner): Create a larger runner to build and store your custom image.
2. [Generating a custom image](#generating-a-custom-image): Generate your custom image by running a workflow using the image-generation runner.
3. [Installing custom images](#installing-custom-images): Create a runner that uses your custom image.

## Prerequisites

Before you can create custom images, make sure the following requirements are met.

* **Policy**: Custom images must be enabled for your organization or enterprise. Enterprise owners can manage access to custom images and set retention policies in the Actions policy settings. For more information, see [Enforcing policies for GitHub Actions in your enterprise](/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#custom-images).
* **Permissions**: To create and manage custom images, you must be an organization or enterprise owner, or have the `CI/CD Admin` role, or have a role with the following fine-grained permissions.

  * View organization hosted runner custom images
  * Manage organization hosted runner custom images
  * Manage organization runners and runner groups

  For more information, see [Permissions of custom organization roles](/en/organizations/managing-peoples-access-to-your-organization-with-roles/about-custom-organization-roles).

## Setting up an image-generation runner

To create a custom image, you must first set up an image-generation runner. When you create the runner, the platform that you select for your runner must match the platform of the image you want to build. The platform of the runner can be Linux x64, Linux ARM64, or Windows x64.

1. Create a larger runner:
   * For organizations, see [Adding a larger runner to an organization](/en/actions/how-tos/manage-runners/larger-runners/manage-larger-runners#adding-a-larger-runner-to-an-organization).
   * For enterprises, see [Adding a larger runner to an enterprise](/en/actions/how-tos/manage-runners/larger-runners/manage-larger-runners#adding-a-larger-runner-to-an-enterprise).
2. When configuring the runner, select the following configurations for your image-generation runner:
   * **Platform**: Select a supported platform that matches the platform of the image you plan to create (Linux x64, Linux ARM64, or Windows x64).
   * **Image**: Select an image to build on, then enable the checkbox **Enable this runner to generate custom images**.
     * You can start from a GitHub-owned image or choose a base image to start from a clean OS.
     * For ARM64 platforms, you can also select an ARM-maintained image with preinstalled tooling.
   * **Runner group**: Select the group for your runner to be a member of. Once the custom image is created, only runners in this runner group can generate new versions of that image.

## Generating a custom image

After you create an image-generation runner, run a workflow that includes the `snapshot` keyword to generate a custom image.

To configure a workflow for image generation:

* Set the `runs-on` value to the name of the image-generation runner that you created.
* Add the `snapshot` keyword to the job, using either the string syntax or mapping syntax shown below.
  * Each job that includes the `snapshot` keyword creates a separate image. To generate only one image or image version, include all workflow steps in a single job.
  * Each successful run of a job that includes the `snapshot` keyword creates a new version of that image.

> \[!NOTE]
> GitHub recommends configuring image generation as a scheduled workflow on a weekly basis. This approach ensures dependencies remain up-to-date and have the latest security patches. For more information, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows#schedule).

It can take some time for your image to be fully generated and ready to use after the workflow completes. Provisioning time varies based on runner size and configuration, and may take several hours for larger runners.

The image is generated only when the job completes successfully. This prevents new image versions from being created when a workflow fails or ends in an incomplete state.

Once the image is generated, it is available for use in your workflows. For more information about managing custom images, see [Managing custom images](#managing-custom-images).

### String syntax

You can use the string syntax with `snapshot` to define the image name. This method creates a new image or adds a new version to an existing image with the same name. You cannot specify a version number using this syntax.

```yaml
jobs: 
  build:
    runs-on: my-image-generation-runner
    snapshot: my-custom-image
    steps:
      # Add any steps to download and setup any dependencies here
```

### Mapping syntax

You can use the mapping syntax with `snapshot` to define both the `image-name` and the optional `version`. When you specify a major version, the minor versioning automatically increments if that major version already exists. Patch versions are not supported.

```yaml
jobs: 
  build:
    runs-on: my-image-generation-runner
    snapshot: 
        image-name: my-custom-image
        version: 2.*
    steps:
      # Add any steps to download and setup any dependencies here
```

## Versioning

When you generate custom images, GitHub automatically assigns version numbers to help you manage updates and track image history.

### Default behavior

If an image with the specified name does not exist in your organization or enterprise, GitHub creates it with an initial version number of 1.0.0.
If an image with the same name already exists, GitHub creates a new version by incrementing the minor version number (for example, 1.1.0, 1.2.0, etc.).

If you do not specify a version in your YAML file, image generation uses this default behavior.

### Specifying a version in your workflow

If you include a version in the YAML mapping, GitHub checks the major version number first.

* If the specified major version already exists, the new image uses the next minor version (for example, 1.0 becomes 1.1).
* If the major version does not exist, GitHub creates a new major version (for example, 2.0).

Patch versions are not supported.

### Latest tag

The most recent workflow run for an image is always tagged as latest.
If you specify an older major version in the YAML (for example, version: 1.\* when a 2.0 version exists), GitHub generates a new minor version under the older major version and marks it as latest.

> \[!NOTE]
> GitHub-hosted larger runner creation does not support wildcards in image version selection.

## Billing and storage for custom images

Jobs that use custom images are billed at the same per-minute rate as the larger runner that uses the image. Storage for custom images is billed separately through GitHub Actions storage.

If you rebuild images frequently and retain older versions, your storage usage can grow quickly because each successful workflow job that includes the `snapshot` keyword creates a new image version. For more information, see [GitHub Actions billing](/en/billing/concepts/product-billing/github-actions#custom-image-storage) and [Enforcing policies for GitHub Actions in your enterprise](/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#custom-images-retention-policies).

## Managing custom images

You can view detailed information about each image, delete unused images or specific versions, and track image versions over time.

1. On GitHub, navigate to the main page of the organization.
2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Custom images**.
4. On the "Custom images" page, you can view all custom images that have been created in your organization or enterprise.
5. To view details about a specific image, click the image name.

## Installing custom images

Once your custom image is ready, you can install it on a new GitHub-hosted larger runner.

1. Follow the steps for creating a larger runner:
   * For organizations, see [Adding a larger runner to an organization](/en/actions/how-tos/manage-runners/larger-runners/manage-larger-runners#adding-a-larger-runner-to-an-organization).
   * For enterprises, see [Adding a larger runner to an enterprise](/en/actions/how-tos/manage-runners/larger-runners/manage-larger-runners#adding-a-larger-runner-to-an-enterprise).

2. When configuring the runner:
   * **Platform**: Select the same platform that you used to generate the image (Linux x64, Linux ARM64, or Windows x64).
   * **Image**: Select the **Custom** tab, then choose your custom image from the list.
     * If you don’t see your image, make sure you’ve selected the correct platform and that you’re creating the runner at the same level (organization or enterprise) where the image was generated.
   * **Image version**: Choose **Latest** to automatically use the most recent version, or select a specific version number to pin the runner to that version.
     * If you select **Latest**, your runner automatically updates when a new version of the image becomes available. If you pin the runner to a specific version, you’ll need to edit the runner manually to upgrade later.
   * **Size**: Choose a runner size with storage equal to or larger than your image’s size. For example, if the image was generated on an 8-core runner, select an 8-core or larger to run this image.
   * **Runner group**: Assign the runner to a runner group that is shared with the repositories that need to use this image.

3. In your GitHub Actions workflow job, set the `runs-on` key to the name of your runner.

   ```yaml
   jobs: 
     build:
       runs-on: my-custom-runner
       steps:
       # Add any steps for your workflow here
   ```

4. Run your workflow to verify that it completes successfully. The job logs will show the image name and version in the "Set up job" section.

## Security best practices for custom images

To prevent unauthorized changes to your images, follow these best practices.

* **Use dedicated runner groups for image generation.** Runners that generate production images must remain in a dedicated runner group. Do not share runner groups between production and development or test repositories, as anyone with access to a development or test repository could inject malicious code into a production image.
* **Do not allow public repositories to access image-generation runners.** Limit the repositories that can use image-generation runners to only those that require it, and review access regularly.
* **Apply least privilege to repositories.** Avoid granting organization-wide `write` access for repositories that have access to image-generation runners. Because images can be generated from any branch, anyone with write access could create a branch with arbitrary code and trigger image generation.
---

# Running jobs on larger runners

You can speed up your workflows by configuring them to run on larger runners.

## Running jobs on your runner

<div class="ghd-tool linux">

Once your runner type has been defined, you can update your workflow YAML files to send jobs to your newly created runner instances for processing. You can use runner groups or labels to define where your jobs run.

> \[!NOTE]
> Larger runners are automatically assigned a default label that corresponds to the runner name. You cannot add custom labels to larger runners, but you can use the default labels or the runner's group to send jobs to specific types of runners.

Only owner or administrator accounts can see the runner settings. Non-administrative users can contact the organization owner to find out which runners are enabled. Your organization owner can create new runners and runner groups, as well as configure permissions to specify which repositories can access a runner group. For more information, see [Managing larger runners](/en/actions/using-github-hosted-runners/managing-larger-runners#allowing-repositories-to-access-a-runner-group).

</div>

<div class="ghd-tool windows">

Once your runner type has been defined, you can update your workflow YAML files to send jobs to your newly created runner instances for processing. You can use runner groups or labels to define where your jobs run.

> \[!NOTE]
> Larger runners are automatically assigned a default label that corresponds to the runner name. You cannot add custom labels to larger runners, but you can use the default labels or the runner's group to send jobs to specific types of runners.

Only owner or administrator accounts can see the runner settings. Non-administrative users can contact the organization owner to find out which runners are enabled. Your organization owner can create new runners and runner groups, as well as configure permissions to specify which repositories can access a runner group. For more information, see [Managing larger runners](/en/actions/using-github-hosted-runners/managing-larger-runners#allowing-repositories-to-access-a-runner-group).

</div>

<div class="ghd-tool mac">

Once your runner type has been defined, you can update your workflow YAML files to send jobs to runner instances for processing. To run jobs on macOS larger runners, update the `runs-on` key in your workflow YAML files to use one of the GitHub-defined labels for macOS runners. For more information, see [Available macOS larger runners](#available-macos-larger-runners).

</div>

<div class="ghd-tool mac">

## Available macOS larger runners

Use the labels in the table below to run your workflows on the corresponding macOS larger runner.

| Runner Size | Architecture | Processor (CPU)                   | Memory (RAM) | Storage (SSD) | Workflow label                                                                                                                      |
| ----------- | ------------ | --------------------------------- | ------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Large       | Intel        | 12                                | 30 GB        | 14 GB         | <code>macos-latest-large</code>, <code>macos-14-large</code>, <code>macos-15-large</code> (latest), <code>macos-26-large</code>     |
| XLarge      | arm64 (M2)   | 5 (+ 8 GPU hardware acceleration) | 14 GB        | 14 GB         | <code>macos-latest-xlarge</code>, <code>macos-14-xlarge</code>, <code>macos-15-xlarge</code> (latest), <code>macos-26-xlarge</code> |

</div>

## Viewing available runners for a repository

If you have `repo: write` access to a repository, you can view a list of the runners available to the repository.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, under the "Management" section, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-server" aria-label="server" role="img"><path d="M1.75 1h12.5c.966 0 1.75.784 1.75 1.75v4c0 .372-.116.717-.314 1 .198.283.314.628.314 1v4a1.75 1.75 0 0 1-1.75 1.75H1.75A1.75 1.75 0 0 1 0 12.75v-4c0-.358.109-.707.314-1a1.739 1.739 0 0 1-.314-1v-4C0 1.784.784 1 1.75 1ZM1.5 2.75v4c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-4a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25Zm.25 5.75a.25.25 0 0 0-.25.25v4c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-4a.25.25 0 0 0-.25-.25ZM7 4.75A.75.75 0 0 1 7.75 4h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 4.75ZM7.75 10h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM3 4.75A.75.75 0 0 1 3.75 4h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 4.75ZM3.75 10h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"></path></svg> Runners**.
4. Review the list of available runners for the repository.
5. Optionally, to copy a runner's label to use it in a workflow, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More options" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg> to the right of the runner, then click **Copy label**.

> \[!NOTE]
> Enterprise and organization owners can create runners from this page. To create a new runner, click **New runner** at the top right of the list of runners to add runners to the repository.
>
> For more information, see [Managing larger runners](/en/actions/using-github-hosted-runners/managing-larger-runners) and [Adding self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners).

<div class="ghd-tool linux">

## Using groups to control where jobs are run

In this example, Ubuntu runners have been added to a group called `ubuntu-runners`. The `runs-on` key sends the job to any available runner in the `ubuntu-runners` group:

```yaml
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on: 
      group: ubuntu-runners
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v
```

</div>

<div class="ghd-tool windows">

## Using groups to control where jobs are run

In this example, Ubuntu runners have been added to a group called `ubuntu-runners`. The `runs-on` key sends the job to any available runner in the `ubuntu-runners` group:

```yaml
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on: 
      group: ubuntu-runners
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v
```

</div>

<div class="ghd-tool linux">

## Using labels to control where jobs are run

You can implicitly pass a label to the `runs-on` key by using the syntax `runs-on: LABEL`. Alternatively, you can use the `labels` key, as shown in the example below.

In this example, the `runs-on` key sends the job to any available runner that has been assigned the `ubuntu-24.04-16core` label:

```yaml
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on:
      labels: ubuntu-24.04-16core
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v
```

Anyone with write access to an Actions-enabled repository can find out the labels for the runners that are available in that repository. See [Running jobs on larger runners](/en/actions/using-github-hosted-runners/about-larger-runners/running-jobs-on-larger-runners#viewing-available-runners-for-a-repository).

</div>

<div class="ghd-tool windows">

## Using labels to control where jobs are run

You can implicitly pass a label to the `runs-on` key by using the syntax `runs-on: LABEL`. Alternatively, you can use the `labels` key, as shown in the example below.

In this example, the `runs-on` key sends the job to any available runner that has been assigned the `windows-2022-16core` label:

```yaml
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on:
      labels: windows-2022-16core
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v
```

Anyone with write access to an Actions-enabled repository can find out the labels for the runners that are available in that repository. See [Running jobs on larger runners](/en/actions/using-github-hosted-runners/about-larger-runners/running-jobs-on-larger-runners#viewing-available-runners-for-a-repository).

</div>

<div class="ghd-tool mac">

## Targeting macOS larger runners in a workflow

To run your workflows on macOS larger runners, set the value of the `runs-on` key to a label associated with a macOS larger runner. For a list of macOS larger runner labels, see [Available macOS larger runners](#available-macos-larger-runners).

In this example, the workflow uses a label that is associated with macOS XL runners. The `runs-on` key sends the job to any available runner with a matching label:

```yaml
name: learn-github-actions-testing
on: [push]
jobs:
  build:
    runs-on: macos-26-xlarge
    steps:
      - uses: actions/checkout@v5
      - name: Build
        run: swift build
      - name: Run tests
        run: swift test
```

</div>

<div class="ghd-tool linux">

## Using labels and groups to control where jobs are run

When you combine groups and labels, the runner must meet both requirements to be eligible to run the job.

In this example, a runner group called `ubuntu-runners` is populated with Ubuntu runners, which have also been assigned the label `ubuntu-24.04-16core`. The `runs-on` key combines `group` and `labels` so that the job is routed to any available runner within the group that also has a matching label:

```yaml
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on:
      group: ubuntu-runners
      labels: ubuntu-24.04-16core
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v
```

</div>

<div class="ghd-tool windows">

## Using labels and groups to control where jobs are run

When you combine groups and labels, the runner must meet both requirements to be eligible to run the job.

In this example, a runner group called `ubuntu-runners` is populated with Ubuntu runners, which have also been assigned the label `ubuntu-24.04-16core`. The `runs-on` key combines `group` and `labels` so that the job is routed to any available runner within the group that also has a matching label:

```yaml
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on:
      group: ubuntu-runners
      labels: ubuntu-24.04-16core
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v
```

</div>

## Troubleshooting larger runners

<div class="ghd-tool linux">

If you notice the jobs that target your larger runners are delayed or not running, there are several factors that may be causing this.

* **Concurrency settings:** You may have reached your maximum concurrency limit. If you would like to enable more jobs to run in parallel, you can update your autoscaling settings to a larger number. For more information, see [Managing larger runners](/en/actions/using-github-hosted-runners/managing-larger-runners#configuring-autoscaling-for-larger-runners).
* **Repository permissions:** Ensure you have the appropriate repository permissions enabled for your larger runners. By default, enterprise runners are not available at the repository level and must be manually enabled by an organization administrator. For more information, see [Managing larger runners](/en/actions/using-github-hosted-runners/managing-larger-runners#allowing-repositories-to-access-larger-runners).
* **Billing information:** You must have a valid credit card on file in order to use larger runners. After adding a credit card to your account, it can take up to 10 minutes to enable the use of your larger runners. For more information, see [Managing your payment and billing information](/en/billing/managing-your-billing/managing-your-payment-and-billing-information).
* **Spending limit:** Your GitHub Actions spending limit must be set to a value greater than zero. For more information, see [Setting up budgets to control spending on metered products](/en/billing/managing-billing-for-github-actions/managing-your-spending-limit-for-github-actions).
* **Fair use policy:** GitHub has a fair use policy that begins to throttle jobs based on several factors, such as how many jobs you are running or how many jobs are running across the entirety of GitHub Actions.
* **Job queue to assign time:** Job queue to assign time refers to the time between a job request and GitHub assigning a VM to execute the job. Standard GitHub-hosted runners utilizing prescribed YAML workflow labels (such as `ubuntu-latest`) are always in a "warm" state. With larger runners, a warm VM may not be ready to pick up a job on first request as the pools for these machines are smaller. As a result, GitHub may need to create a new VM, which increases the queue to assign time. Once a runner is in use, VMs are ready for subsequent workflow runs within 5 minutes. If not used again within that time, a subset of those machines remains warm, reducing the queue to assign time for future workflow runs over the next 24 hours. The higher the volume of jobs you run, the more VMs will remain in the warm pool.

</div>

<div class="ghd-tool windows">

If you notice the jobs that target your larger runners are delayed or not running, there are several factors that may be causing this.

* **Concurrency settings:** You may have reached your maximum concurrency limit. If you would like to enable more jobs to run in parallel, you can update your autoscaling settings to a larger number. For more information, see [Managing larger runners](/en/actions/using-github-hosted-runners/managing-larger-runners#configuring-autoscaling-for-larger-runners).
* **Repository permissions:** Ensure you have the appropriate repository permissions enabled for your larger runners. By default, enterprise runners are not available at the repository level and must be manually enabled by an organization administrator. For more information, see [Managing larger runners](/en/actions/using-github-hosted-runners/managing-larger-runners#allowing-repositories-to-access-larger-runners).
* **Billing information:** You must have a valid credit card on file in order to use larger runners. After adding a credit card to your account, it can take up to 10 minutes to enable the use of your larger runners. For more information, see [Managing your payment and billing information](/en/billing/managing-your-billing/managing-your-payment-and-billing-information).
* **Spending limit:** Your GitHub Actions spending limit must be set to a value greater than zero. For more information, see [Setting up budgets to control spending on metered products](/en/billing/managing-billing-for-github-actions/managing-your-spending-limit-for-github-actions).
* **Fair use policy:** GitHub has a fair use policy that begins to throttle jobs based on several factors, such as how many jobs you are running or how many jobs are running across the entirety of GitHub Actions.
* **Job queue to assign time:** Job queue to assign time refers to the time between a job request and GitHub assigning a VM to execute the job. Standard GitHub-hosted runners utilizing prescribed YAML workflow labels (such as `ubuntu-latest`) are always in a "warm" state. With larger runners, a warm VM may not be ready to pick up a job on first request as the pools for these machines are smaller. As a result, GitHub may need to create a new VM, which increases the queue to assign time. Once a runner is in use, VMs are ready for subsequent workflow runs within 5 minutes. If not used again within that time, a subset of those machines remains warm, reducing the queue to assign time for future workflow runs over the next 24 hours. The higher the volume of jobs you run, the more VMs will remain in the warm pool.

</div>

<div class="ghd-tool mac">

Because macOS arm64 does not support Node 12, macOS larger runners automatically use Node 16 to execute any JavaScript action written for Node 12. Some community actions may not be compatible with Node 16. If you use an action that requires a different Node version, you may need to manually install a specific version at runtime.

> \[!NOTE]
> ARM-powered runners are currently in public preview and are subject to change.

</div>
---

# Adding self-hosted runners

You can add a self-hosted runner to a repository, an organization, or an enterprise.

> \[!WARNING]
> We recommend that you only use self-hosted runners with private repositories. This is because forks of your public repository can potentially run dangerous code on your self-hosted runner machine by creating a pull request that executes the code in a workflow.
>
> For more information, see [Secure use reference](/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions).

## Prerequisites

Before you add a self-hosted runner, you should understand what they are and how they work. See [Self-hosted runners](/en/actions/concepts/runners/about-self-hosted-runners).

Additionally, you must meet the following requirements:

* You must have access to the machine you will use as a self-hosted runner in your environment.

## Adding a self-hosted runner to a repository

You can add self-hosted runners to a single repository. To add a self-hosted runner to a user repository, you must be the repository owner. For an organization repository, you must be an organization owner or have admin access to the repository.

For information about how to add a self-hosted runner with the REST API, see [REST API endpoints for self-hosted runners](/en/rest/actions/self-hosted-runners).

> \[!NOTE]
> Organization owners can choose which repositories are allowed to create repository-level self-hosted runners.
>
> For more information, see [Disabling or limiting GitHub Actions for your organization](/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#limiting-the-use-of-self-hosted-runners).

1. On GitHub, navigate to the main page of the repository.

2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.](/assets/images/help/repository/repo-actions-settings.png)

3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.

4. Click **New self-hosted runner**.

5. Select the operating system image and architecture of your self-hosted runner machine.

   ![Screenshot of the choice of operating system and architecture. These options are highlighted with a dark orange outline.](/assets/images/help/actions/creating-selfhosted-runner.png)

6. You will see instructions showing you how to download the runner application and install it on your self-hosted runner machine.

   Open a shell on your self-hosted runner machine and run each shell command in the order shown.

   > \[!NOTE]
   > On Windows, if you want to install the self-hosted runner application as a service, you must open a shell with administrator privileges. We also recommend that you use `C:\actions-runner` as the directory for the self-hosted runner application so that Windows system accounts can access the runner directory.

   The instructions walk you through completing these tasks:

   * Downloading and extracting the self-hosted runner application.
   * Running the `config` script to configure the self-hosted runner application and register it with GitHub Actions. The `config` script requires the destination URL and an automatically-generated time-limited token to authenticate the request. The token expires after one hour.
     * On Windows, the `config` script also asks if you would like to install the self-hosted runner application as a service. For Linux and macOS, you can install a service after you finish adding the runner. For more information, see [Configuring the self-hosted runner application as a service](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service).
   * Running the self-hosted runner application to connect the machine to GitHub Actions.

### Checking that your self-hosted runner was successfully added

After completing the steps to add a self-hosted runner, the runner and its status are now listed under "Runners".

The self-hosted runner application must be active for the runner to accept jobs. When the runner application is connected to GitHub and ready to receive jobs, you will see the following message on the machine's terminal.

```shell
√ Connected to GitHub

2019-10-24 05:45:56Z: Listening for Jobs
```

For more information, see [Monitoring and troubleshooting self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/monitoring-and-troubleshooting-self-hosted-runners).

## Adding a self-hosted runner to an organization

You can add self-hosted runners at the organization level, where they can be used to process jobs for multiple repositories in an organization. To add a self-hosted runner to an organization, you must be an organization owner. For information about how to add a self-hosted runner with the REST API, see [REST API endpoints for self-hosted runners](/en/rest/actions/self-hosted-runners).

1. On GitHub, navigate to the main page of the organization.

2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)

3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.

4. Click **New runner**, then click **New self-hosted runner**.

5. Select the operating system image and architecture of your self-hosted runner machine.

   ![Screenshot of the choice of operating system and architecture. These options are highlighted with a dark orange outline.](/assets/images/help/actions/creating-selfhosted-runner.png)

6. You will see instructions showing you how to download the runner application and install it on your self-hosted runner machine.

   Open a shell on your self-hosted runner machine and run each shell command in the order shown.

   > \[!NOTE]
   > On Windows, if you want to install the self-hosted runner application as a service, you must open a shell with administrator privileges. We also recommend that you use `C:\actions-runner` as the directory for the self-hosted runner application so that Windows system accounts can access the runner directory.

   The instructions walk you through completing these tasks:

   * Downloading and extracting the self-hosted runner application.
   * Running the `config` script to configure the self-hosted runner application and register it with GitHub Actions. The `config` script requires the destination URL and an automatically-generated time-limited token to authenticate the request. The token expires after one hour.
     * On Windows, the `config` script also asks if you would like to install the self-hosted runner application as a service. For Linux and macOS, you can install a service after you finish adding the runner. For more information, see [Configuring the self-hosted runner application as a service](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service).
   * Running the self-hosted runner application to connect the machine to GitHub Actions.

### Checking that your self-hosted runner was successfully added

After completing the steps to add a self-hosted runner, the runner and its status are now listed under "Runners".

The self-hosted runner application must be active for the runner to accept jobs. When the runner application is connected to GitHub and ready to receive jobs, you will see the following message on the machine's terminal.

```shell
√ Connected to GitHub

2019-10-24 05:45:56Z: Listening for Jobs
```

For more information, see [Monitoring and troubleshooting self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/monitoring-and-troubleshooting-self-hosted-runners).

> \[!NOTE]
> For security reasons, public repositories can't use runners in a runner group by default, but you can override this in the runner group's settings. For more information, see [Managing access to self-hosted runners using groups](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/managing-access-to-self-hosted-runners-using-groups#changing-the-access-policy-of-a-self-hosted-runner-group).

## Adding a self-hosted runner to an enterprise

If you use GitHub Enterprise Cloud, you can add self-hosted runners to an enterprise, where they can be assigned to multiple organizations. The organization owner can control which repositories can use it. For more information, see the [GitHub Enterprise Cloud documentation](/en/enterprise-cloud@latest/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners#adding-a-self-hosted-runner-to-an-enterprise).

## Next steps

You can set up automation to scale the number of self-hosted runners. For more information, see [Self-hosted runners reference](/en/actions/reference/self-hosted-runners-reference#autoscaling).
---

# Using labels with self-hosted runners

You can use labels to organize your self-hosted runners based on their characteristics.

For information on how to use labels to route jobs to specific types of self-hosted runners, see [Using self-hosted runners in a workflow](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/using-self-hosted-runners-in-a-workflow). You can also route jobs to runners in a specific group. For more information, see [Choosing the runner for a job](/en/actions/using-jobs/choosing-the-runner-for-a-job#targeting-runners-in-a-group).

A self-hosted runner can be located in either your repository, organization, or enterprise account settings on GitHub. To manage a self-hosted runner, you must have the following permissions, depending on where the self-hosted runner was added:

* **User repository:** You must be the repository owner.
* **Organization:** You must be an organization owner.
* **Organization repository:** You must be an organization owner, or have admin access to the repository.

## Creating a custom label

You can create custom labels for runners at the repository and organization levels.

* [Creating a custom label for a repository runner](#creating-a-custom-label-for-a-repository-runner)
* [Creating a custom label for an organization runner](#creating-a-custom-label-for-an-organization-runner)

> \[!NOTE]
> Labels are case-insensitive.

### Creating a custom label for a repository runner

1. Navigate to the main page of the repository where your self-hosted runner group is registered.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the list of runners, click on the name of the runner you'd like to configure.
5. In the "Labels" section, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="The Gear icon" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>.
6. In the "Find or create a label" field, type the name of your new label and click **Create new label**. The custom label is created and assigned to the self-hosted runner. Custom labels can be removed from self-hosted runners, but they currently can't be manually deleted. Any unused labels that are not assigned to a runner will be automatically deleted within 24 hours.

### Creating a custom label for an organization runner

1. Navigate to the main page of the organization where your self-hosted runner group is registered.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the list of runners, click on the name of the runner you'd like to configure.
5. In the "Labels" section, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="The Gear icon" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>.
6. In the "Find or create a label" field, type the name of your new label and click **Create new label**. The custom label is created and assigned to the self-hosted runner. Custom labels can be removed from self-hosted runners, but they currently can't be manually deleted. Any unused labels that are not assigned to a runner will be automatically deleted within 24 hours.

## Assigning a label to a self-hosted runner

You can assign labels to self-hosted runners at the repository and organization levels.

* [Assigning a label to a repository runner](#assigning-a-label-to-a-repository-runner)
* [Assigning a label to an organization runner](#assigning-a-label-to-an-organization-runner)

### Assigning a label to a repository runner

1. Navigate to the main page of the repository where your self-hosted runner group is registered.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the "Labels" section, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="The Gear icon" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>.
5. To assign a label to your self-hosted runner, in the "Find or create a label" field, click the label.

### Assigning a label to an organization runner

1. Navigate to the main page of the organization where your self-hosted runner group is registered.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the "Labels" section, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="The Gear icon" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>.
5. To assign a label to your self-hosted runner, in the "Find or create a label" field, click the label.

## Removing a custom label from a self-hosted runner

You can remove custom labels from self-hosted runners at the repository and organization levels.

* [Removing a custom label from a repository runner](#removing-a-custom-label-from-a-repository-runner)
* [Removing a custom label from an organization runner](#removing-a-custom-label-from-an-organization-runner)

### Removing a custom label from a repository runner

1. Navigate to the main page of the repository where your self-hosted runner group is registered.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the "Labels" section, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="The Gear icon" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>.
5. In the "Find or create a label" field, assigned labels are marked with the <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="The Check icon" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg> icon. Click on a marked label to unassign it from your self-hosted runner.

### Removing a custom label from an organization runner

1. Navigate to the main page of the organization where your self-hosted runner group is registered.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the "Labels" section, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="The Gear icon" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>.
5. In the "Find or create a label" field, assigned labels are marked with the <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-check" aria-label="The Check icon" role="img"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg> icon. Click on a marked label to unassign it from your self-hosted runner.

## Programmatically assign labels

You can programmatically assign labels to a self-hosted runner after the runner is created, or during its initial configuration.

* To programmatically assign labels to an existing self-hosted runner, you must use the REST API. For more information, see [REST API endpoints for self-hosted runners](/en/rest/actions/self-hosted-runners).
* To programmatically assign labels to a self-hosted runner during the initial runner configuration, you can pass label names to the `config` script using the `labels` parameter.

  > \[!NOTE]
  > You cannot use the `config` script to assign labels to an existing self-hosted runner.

  For example, this command assigns a label named `gpu` when configuring a new self-hosted runner:

  ```shell
  ./config.sh --url <REPOSITORY_URL> --token <REGISTRATION_TOKEN> --labels gpu
  ```

  The label is created if it does not already exist. You can also use this approach to assign the default labels to runners, such as `x64` or `linux`. When default labels are assigned using the configuration script, GitHub Actions accepts them as given and does not validate that the runner is actually using that operating system or architecture.

  You can use comma separation to assign multiple labels. For example:

  ```shell
  ./config.sh --url <REPOSITORY_URL> --token <REGISTRATION_TOKEN> --labels gpu,x64,linux
  ```

  > \[!NOTE]
  > If you replace an existing runner, then you must reassign any custom labels.
---

# Configuring the self-hosted runner application as a service

You can configure the self-hosted runner application as a service to automatically start the runner application when the machine starts.

<div class="ghd-tool linux">

> \[!NOTE]
> You must add a runner to GitHub before you can configure the self-hosted runner application as a service.
> For more information, see [Adding self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners).

For Linux systems that use `systemd`, you can use the `svc.sh` script that is created after successfully adding the runner to install and manage using the application as a service.

On the runner machine, open a shell in the directory where you installed the self-hosted runner application. Use the commands below to install and manage the self-hosted runner service.

</div>

<div class="ghd-tool windows">

> \[!NOTE]
> Configuring the self-hosted runner application as a service on Windows is part of the application configuration process. If you have already configured the self-hosted runner application but did not choose to configure it as a service, you must remove the runner from GitHub and re-configure the application. When you re-configure the application, choose the option to configure the application as a service.
>
> For more information, see [Removing self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/removing-self-hosted-runners) and [Adding self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners).

You can manage the runner service in the Windows **Services** application, or you can use PowerShell to run the commands below.

</div>

<div class="ghd-tool mac">

> \[!NOTE]
> You must add a runner to GitHub before you can configure the self-hosted runner application as a service.
> For more information, see [Adding self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners).

On the runner machine, open a shell in the directory where you installed the self-hosted runner application. Use the commands below to install and manage the self-hosted runner service.

</div>

<div class="ghd-tool linux">

## Installing the service

1. Stop the self-hosted runner application if it is currently running.

2. Install the service with the following command:

   ```shell
   sudo ./svc.sh install
   ```

3. Alternatively, the command takes an optional `user` argument to install the service as a different user.

   ```shell
   ./svc.sh install USERNAME
   ```

</div>

<div class="ghd-tool mac">

## Installing the service

1. Stop the self-hosted runner application if it is currently running.
2. Install the service with the following command:

   ```shell
   ./svc.sh install
   ```

</div>

## Starting the service

Start the service with the following command:

<div class="ghd-tool linux">

```shell
sudo ./svc.sh start
```

> \[!NOTE]
> On Debian-based Linux systems (such as Debian or Ubuntu) with `needrestart` enabled, you can prevent `needrestart` from restarting the runner service during a workflow job by configuring it to ignore the runner service. Run the following command:
>
> ```bash
> echo '$nrconf{override_rc}{qr(^actions\.runner\..+\.service$)} = 0;' | sudo tee /etc/needrestart/conf.d/actions_runner_services.conf
> ```

</div>

<div class="ghd-tool windows">

```shell
Start-Service "actions.runner.*"
```

</div>

<div class="ghd-tool mac">

```shell
./svc.sh start
```

</div>

## Checking the status of the service

Check the status of the service with the following command:

<div class="ghd-tool linux">

```shell
sudo ./svc.sh status
```

</div>

<div class="ghd-tool windows">

```shell
Get-Service "actions.runner.*"
```

</div>

<div class="ghd-tool mac">

```shell
./svc.sh status
```

</div>

For more information on viewing the status of your self-hosted runner, see [Monitoring and troubleshooting self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/monitoring-and-troubleshooting-self-hosted-runners).

## Stopping the service

Stop the service with the following command:

<div class="ghd-tool linux">

```shell
sudo ./svc.sh stop
```

</div>

<div class="ghd-tool windows">

```shell
Stop-Service "actions.runner.*"
```

</div>

<div class="ghd-tool mac">

```shell
./svc.sh stop
```

</div>

## Uninstalling the service

1. Stop the service if it is currently running.
2. Uninstall the service with the following command:

    <div class="ghd-tool linux">

   ```shell
   sudo ./svc.sh uninstall
   ```

    </div>

    <div class="ghd-tool windows">

   ```shell
   Remove-Service "actions.runner.*"
   ```

    </div>

    <div class="ghd-tool mac">

   ```shell
   ./svc.sh uninstall
   ```

    </div>

<div class="ghd-tool linux">

## Customizing the self-hosted runner service

If you don't want to use the above default `systemd` service configuration, you can create a customized service or use whichever service mechanism you prefer. Consider using the `serviced` template at `actions-runner/bin/actions.runner.service.template` as a reference. If you use a customized service, the self-hosted runner service must always be invoked using the `runsvc.sh` entry point.

</div>

<div class="ghd-tool mac">

## Customizing the self-hosted runner service

If you don't want to use the above default launchd service configuration, you can create a customized service or use whichever service mechanism you prefer. Consider using the `plist` template at `actions-runner/bin/actions.runner.plist.template` as a reference. If you use a customized service, the self-hosted runner service must always be invoked using the `runsvc.sh` entry point.

</div>
---

# Customizing the containers used by jobs

You can customize how your self-hosted runner invokes a container for a job.

> \[!NOTE]
> This feature is currently in public preview and is subject to change.

## About container customization

GitHub Actions allows you to run a job within a container, using the `container:` statement in your workflow file. For more information, see [Running jobs in a container](/en/actions/using-jobs/running-jobs-in-a-container). To process container-based jobs, the self-hosted runner creates a container for each job.

GitHub Actions supports commands that let you customize the way your containers are created by the self-hosted runner. For example, you can use these commands to manage the containers through Kubernetes or Podman, and you can also customize the `docker run` or `docker create` commands used to invoke the container. The customization commands are run by a script, which is automatically triggered when a specific environment variable is set on the runner. For more information, see [Triggering the customization script](#triggering-the-customization-script) below.

This customization is only available for Linux-based self-hosted runners, and root user access is not required.

## Container customization commands

GitHub Actions includes the following commands for container customization:

* [`prepare_job`](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/customizing-the-containers-used-by-jobs#prepare_job): Called when a job is started.
* [`cleanup_job`](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/customizing-the-containers-used-by-jobs#cleanup_job): Called at the end of a job.
* [`run_container_step`](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/customizing-the-containers-used-by-jobs#run_container_step): Called once for each container action in the job.
* [`run_script_step`](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/customizing-the-containers-used-by-jobs#run_script_step): Runs any step that is not a container action.

Each of these customization commands must be defined in its own JSON file. The file name must match the command name, with the extension `.json`. For example, the `prepare_job` command is defined in `prepare_job.json`. These JSON files will then be run together on the self-hosted runner, as part of the main `index.js` script. This process is described in more detail in [Generating the customization script](#generating-the-customization-script).

These commands also include configuration arguments, explained below in more detail.

### `prepare_job`

The `prepare_job` command is called when a job is started. GitHub Actions passes in any job or service containers the job has. This command will be called if you have any service or job containers in the job.

GitHub Actions assumes that you will do the following tasks in the `prepare_job` command:

* Prune anything from previous jobs, if needed.
* Create a network, if needed.
* Pull the job and service containers.
* Start the job container.
* Start the service containers.
* Write to the response file any information that GitHub Actions will need:
  * Required: State whether the container is an `alpine` linux container (using the `isAlpine` boolean).
  * Optional: Any context fields you want to set on the job context, otherwise they will be unavailable for users to use. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts#job-context).
* Return `0` when the health checks have succeeded and the job/service containers are started.

#### Arguments for `prepare_job`

* `jobContainer`: **Optional**. An object containing information about the specified job container.
  * `image`: **Required**. A string containing the Docker image.
  * `workingDirectory`: **Required**. A string containing the absolute path of the working directory.
  * `createOptions`: **Optional**. The optional *create* options specified in the YAML. For more information, see [Running jobs in a container](/en/actions/using-jobs/running-jobs-in-a-container#example-running-a-job-within-a-container).
  * `environmentVariables`: **Optional**. Sets a map of key environment variables.
  * `userMountVolumes`: **Optional**. An array of user mount volumes set in the YAML. For more information, see [Running jobs in a container](/en/actions/using-jobs/running-jobs-in-a-container#example-running-a-job-within-a-container).
    * `sourceVolumePath`: **Required**. The source path to the volume that will be mounted into the Docker container.
    * `targetVolumePath`: **Required**. The target path to the volume that will be mounted into the Docker container.
    * `readOnly`: **Required**. Determines whether or not the mount should be read-only.
  * `systemMountVolumes`: **Required**. An array of mounts to mount into the container, same fields as above.
    * `sourceVolumePath`: **Required**. The source path to the volume that will be mounted into the Docker container.
    * `targetVolumePath`: **Required**. The target path to the volume that will be mounted into the Docker container.
    * `readOnly`: **Required**. Determines whether or not the mount should be read-only.
  * `registry` **Optional**. The Docker registry credentials for a private container registry.
    * `username`: **Optional**. The username of the registry account.
    * `password`: **Optional**. The password to the registry account.
    * `serverUrl`: **Optional**. The registry URL.
  * `portMappings`: **Optional**. A key value hash of *source:target* ports to map into the container.
* `services`: **Optional**. An array of service containers to spin up.
  * `contextName`: **Required**. The name of the service in the Job context.
  * `image`: **Required**. A string containing the Docker image.
  * `createOptions`: **Optional**. The optional *create* options specified in the YAML. For more information, see [Running jobs in a container](/en/actions/using-jobs/running-jobs-in-a-container#example-running-a-job-within-a-container).
  * `environmentVariables`: **Optional**. Sets a map of key environment variables.
  * `userMountVolumes`: **Optional**. An array of mounts to mount into the container, same fields as above.
    * `sourceVolumePath`: **Required**. The source path to the volume that will be mounted into the Docker container.
    * `targetVolumePath`: **Required**. The target path to the volume that will be mounted into the Docker container.
    * `readOnly`: **Required**. Determines whether or not the mount should be read-only.
  * `registry` **Optional**. The Docker registry credentials for the private container registry.
    * `username`: **Optional**. The username of the registry account.
    * `password`: **Optional**. The password to the registry account.
    * `serverUrl`: **Optional**. The registry URL.
  * `portMappings`: **Optional**. A key value hash of *source:target* ports to map into the container.

#### Example input for `prepare_job`

```json copy
{
  "command": "prepare_job",
  "responseFile": "/users/octocat/runner/_work/{guid}.json",
  "state": {},
  "args": {
    "jobContainer": {
      "image": "node:18"
      "workingDirectory": "/__w/octocat-test2/octocat-test2",
      "createOptions": "--cpus 1",
      "environmentVariables": {
        "NODE_ENV": "development"
      },
      "userMountVolumes": [
        {
          "sourceVolumePath": "my_docker_volume",
          "targetVolumePath": "/volume_mount",
          "readOnly": false
        }
      ],
      "systemMountVolumes": [
        {
          "sourceVolumePath": "/home/octocat/git/runner/_layout/_work",
          "targetVolumePath": "/__w",
          "readOnly": false
        },
        {
          "sourceVolumePath": "/home/octocat/git/runner/_layout/externals",
          "targetVolumePath": "/__e",
          "readOnly": true
        },
        {
          "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_temp",
          "targetVolumePath": "/__w/_temp",
          "readOnly": false
        },
        {
          "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_actions",
          "targetVolumePath": "/__w/_actions",
          "readOnly": false
        },
        {
          "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_tool",
          "targetVolumePath": "/__w/_tool",
          "readOnly": false
        },
        {
          "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_temp/_github_home",
          "targetVolumePath": "/github/home",
          "readOnly": false
        },
        {
          "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_temp/_github_workflow",
          "targetVolumePath": "/github/workflow",
          "readOnly": false
        }
      ],
      "registry": {
        "username": "octocat",
        "password": "examplePassword",
        "serverUrl": "https://index.docker.io/v1"
      },
      "portMappings": { "80": "801" }
    },
    "services": [
      {
        "contextName": "redis",
        "image": "redis",
        "createOptions": "--cpus 1",
        "environmentVariables": {},
        "userMountVolumes": [],
        "portMappings": { "80": "801" },
        "registry": {
          "username": "octocat",
          "password": "examplePassword",
          "serverUrl": "https://index.docker.io/v1"
        }
      }
    ]
  }
}
```

#### Example output for `prepare_job`

This example output is the contents of the `responseFile` defined in the input above.

```json copy
{
  "state": {
    "network": "example_network_53269bd575972817b43f7733536b200c",
    "jobContainer": "82e8219701fe096a35941d869cf3d71af1d943b5d8bdd718857fb87ac3042480",
    "serviceContainers": {
      "redis": "60972d9aa486605e66b0dad4abb678dc3d9116f536579e418176eedb8abb9105"
    }
  },
  "context": {
    "container": {
      "id": "82e8219701fe096a35941d869cf3d71af1d943b5d8bdd718857fb87ac3042480",
      "network": "example_network_53269bd575972817b43f7733536b200c"
    },
    "services": {
      "redis": {
        "id": "60972d9aa486605e66b0dad4abb678dc3d9116f536579e418176eedb8abb9105",
        "ports": {
          "8080": "8080"
        },
        "network": "example_network_53269bd575972817b43f7733536b200c"
      }
    },
    "isAlpine": true
  }
}
```

### `cleanup_job`

The `cleanup_job` command is called at the end of a job. GitHub Actions assumes that you will do the following tasks in the `cleanup_job` command:

* Stop any running service or job containers (or the equivalent pod).
* Stop the network (if one exists).
* Delete any job or service containers (or the equivalent pod).
* Delete the network (if one exists).
* Cleanup anything else that was created for the job.

#### Arguments for `cleanup_job`

No arguments are provided for `cleanup_job`.

#### Example input for `cleanup_job`

```json copy
{
  "command": "cleanup_job",
  "responseFile": null,
  "state": {
    "network": "example_network_53269bd575972817b43f7733536b200c",
    "jobContainer": "82e8219701fe096a35941d869cf3d71af1d943b5d8bdd718857fb87ac3042480",
    "serviceContainers": {
      "redis": "60972d9aa486605e66b0dad4abb678dc3d9116f536579e418176eedb8abb9105"
    }
  },
  "args": {}
}
```

#### Example output for `cleanup_job`

No output is expected for `cleanup_job`.

### `run_container_step`

The `run_container_step` command is called once for each container action in your job. GitHub Actions assumes that you will do the following tasks in the `run_container_step` command:

* Pull or build the required container (or fail if you cannot).
* Run the container action and return the exit code of the container.
* Stream any step logs output to stdout and stderr.
* Cleanup the container after it executes.

#### Arguments for `run_container_step`

* `image`: **Optional**. A string containing the docker image. Otherwise a dockerfile must be provided.
* `dockerfile`: **Optional**. A string containing the path to the dockerfile, otherwise an image must be provided.
* `entryPointArgs`: **Optional**. A list containing the entry point args.
* `entryPoint`: **Optional**. The container entry point to use if the default image entrypoint should be overwritten.
* `workingDirectory`: **Required**. A string containing the absolute path of the working directory.
* `createOptions`: **Optional**. The optional *create* options specified in the YAML. For more information, see [Running jobs in a container](/en/actions/using-jobs/running-jobs-in-a-container#example-running-a-job-within-a-container).
* `environmentVariables`: **Optional**. Sets a map of key environment variables.
* `prependPath`: **Optional**. An array of additional paths to prepend to the `$PATH` variable.
* `userMountVolumes`: **Optional**. an array of user mount volumes set in the YAML. For more information, see [Running jobs in a container](/en/actions/using-jobs/running-jobs-in-a-container#example-running-a-job-within-a-container).
  * `sourceVolumePath`: **Required**. The source path to the volume that will be mounted into the Docker container.
  * `targetVolumePath`: **Required**. The target path to the volume that will be mounted into the Docker container.
  * `readOnly`: **Required**. Determines whether or not the mount should be read-only.
* `systemMountVolumes`: **Required**. An array of mounts to mount into the container, using the same fields as above.
  * `sourceVolumePath`: **Required**. The source path to the volume that will be mounted into the Docker container.
  * `targetVolumePath`: **Required**. The target path to the volume that will be mounted into the Docker container.
  * `readOnly`: **Required**. Determines whether or not the mount should be read-only.
* `registry` **Optional**. The Docker registry credentials for a private container registry.
  * `username`: **Optional**. The username of the registry account.
  * `password`: **Optional**. The password to the registry account.
  * `serverUrl`: **Optional**. The registry URL.
* `portMappings`: **Optional**. A key value hash of the *source:target* ports to map into the container.

#### Example input for image

If you're using a Docker image, you can specify the image name in the `"image":` parameter.

```json copy
{
  "command": "run_container_step",
  "responseFile": null,
  "state": {
    "network": "example_network_53269bd575972817b43f7733536b200c",
    "jobContainer": "82e8219701fe096a35941d869cf3d71af1d943b5d8bdd718857fb87ac3042480",
    "serviceContainers": {
      "redis": "60972d9aa486605e66b0dad4abb678dc3d9116f536579e418176eedb8abb9105"
    }
  },
  "args": {
    "image": "node:18",
    "dockerfile": null,
    "entryPointArgs": ["-f", "/dev/null"],
    "entryPoint": "tail",
    "workingDirectory": "/__w/octocat-test2/octocat-test2",
    "createOptions": "--cpus 1",
    "environmentVariables": {
      "NODE_ENV": "development"
    },
    "prependPath": ["/foo/bar", "bar/foo"],
    "userMountVolumes": [
      {
        "sourceVolumePath": "my_docker_volume",
        "targetVolumePath": "/volume_mount",
        "readOnly": false
      }
    ],
    "systemMountVolumes": [
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work",
        "targetVolumePath": "/__w",
        "readOnly": false
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/externals",
        "targetVolumePath": "/__e",
        "readOnly": true
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_temp",
        "targetVolumePath": "/__w/_temp",
        "readOnly": false
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_actions",
        "targetVolumePath": "/__w/_actions",
        "readOnly": false
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_tool",
        "targetVolumePath": "/__w/_tool",
        "readOnly": false
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_temp/_github_home",
        "targetVolumePath": "/github/home",
        "readOnly": false
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_temp/_github_workflow",
        "targetVolumePath": "/github/workflow",
        "readOnly": false
      }
    ],
    "registry": null,
    "portMappings": { "80": "801" }
  }
}
```

#### Example input for Dockerfile

If your container is defined by a Dockerfile, this example demonstrates how to specify the path to a `Dockerfile` in your input, using the `"dockerfile":` parameter.

```json copy
{
  "command": "run_container_step",
  "responseFile": null,
  "state": {
    "network": "example_network_53269bd575972817b43f7733536b200c",
    "jobContainer": "82e8219701fe096a35941d869cf3d71af1d943b5d8bdd718857fb87ac3042480",
    "services": {
      "redis": "60972d9aa486605e66b0dad4abb678dc3d9116f536579e418176eedb8abb9105"
    }
  },
  "args": {
    "image": null,
    "dockerfile": "/__w/_actions/foo/dockerfile",
    "entryPointArgs": ["hello world"],
    "entryPoint": "echo",
    "workingDirectory": "/__w/octocat-test2/octocat-test2",
    "createOptions": "--cpus 1",
    "environmentVariables": {
      "NODE_ENV": "development"
    },
    "prependPath": ["/foo/bar", "bar/foo"],
    "userMountVolumes": [
      {
        "sourceVolumePath": "my_docker_volume",
        "targetVolumePath": "/volume_mount",
        "readOnly": false
      }
    ],
    "systemMountVolumes": [
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work",
        "targetVolumePath": "/__w",
        "readOnly": false
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/externals",
        "targetVolumePath": "/__e",
        "readOnly": true
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_temp",
        "targetVolumePath": "/__w/_temp",
        "readOnly": false
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_actions",
        "targetVolumePath": "/__w/_actions",
        "readOnly": false
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_tool",
        "targetVolumePath": "/__w/_tool",
        "readOnly": false
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_temp/_github_home",
        "targetVolumePath": "/github/home",
        "readOnly": false
      },
      {
        "sourceVolumePath": "/home/octocat/git/runner/_layout/_work/_temp/_github_workflow",
        "targetVolumePath": "/github/workflow",
        "readOnly": false
      }
    ],
    "registry": null,
    "portMappings": { "80": "801" }
  }
}
```

#### Example output for `run_container_step`

No output is expected for `run_container_step`.

### `run_script_step`

GitHub Actions assumes that you will do the following tasks:

* Invoke the provided script inside the job container and return the exit code.
* Stream any step log output to stdout and stderr.

#### Arguments for `run_script_step`

* `entryPointArgs`: **Optional**. A list containing the entry point arguments.
* `entryPoint`: **Optional**. The container entry point to use if the default image entrypoint should be overwritten.
* `prependPath`: **Optional**. An array of additional paths to prepend to the `$PATH` variable.
* `workingDirectory`: **Required**. A string containing the absolute path of the working directory.
* `environmentVariables`: **Optional**. Sets a map of key environment variables.

#### Example input for `run_script_step`

```json copy
{
  "command": "run_script_step",
  "responseFile": null,
  "state": {
    "network": "example_network_53269bd575972817b43f7733536b200c",
    "jobContainer": "82e8219701fe096a35941d869cf3d71af1d943b5d8bdd718857fb87ac3042480",
    "serviceContainers": {
      "redis": "60972d9aa486605e66b0dad4abb678dc3d9116f536579e418176eedb8abb9105"
    }
  },
  "args": {
    "entryPointArgs": ["-e", "/runner/temp/example.sh"],
    "entryPoint": "bash",
    "environmentVariables": {
      "NODE_ENV": "development"
    },
    "prependPath": ["/foo/bar", "bar/foo"],
    "workingDirectory": "/__w/octocat-test2/octocat-test2"
  }
}
```

#### Example output for `run_script_step`

No output is expected for `run_script_step`.

## Generating the customization script

GitHub has created an example repository that demonstrates how to generate customization scripts for Docker and Kubernetes.

> \[!NOTE]
> The resulting scripts are available for testing purposes, and you will need to determine whether they are appropriate for your requirements.

1. Clone the [actions/runner-container-hooks](https://github.com/actions/runner-container-hooks) repository to your self-hosted runner.

2. The `examples/` directory contains some existing customization commands, each with its own JSON file. You can review these examples and use them as a starting point for your own customization commands.

   * `prepare_job.json`
   * `run_script_step.json`
   * `run_container_step.json`

3. Build the npm packages. These commands generate the `index.js` files inside `packages/docker/dist` and `packages/k8s/dist`.

   ```shell
   npm install && npm run bootstrap && npm run build-all
   ```

When the resulting `index.js` is triggered by GitHub Actions, it will run the customization commands defined in the JSON files. To trigger the `index.js`, you will need to add it to your `ACTIONS_RUNNER_REQUIRE_JOB_CONTAINER` environment variable, as described in the next section.

## Triggering the customization script

The custom script must be located on the runner, but should not be stored in the self-hosted runner application directory (that is, the directory into which you downloaded and unpacked the runner software). The scripts are executed in the security context of the service account that's running the runner service.

> \[!NOTE]
> The triggered script is processed synchronously, so it will block job execution while running.

The script is automatically executed when the runner has the following environment variable containing an absolute path to the script:

* `ACTIONS_RUNNER_CONTAINER_HOOKS`: The script defined in this environment variable is triggered when a job has been assigned to a runner, but before the job starts running.

To set this environment variable, you can either add it to the operating system, or add it to a file named `.env` within the self-hosted runner application directory. For example, the following `.env` entry will have the runner automatically run the script at `/Users/octocat/runner/index.js` before each container-based job runs:

```bash
ACTIONS_RUNNER_CONTAINER_HOOKS=/Users/octocat/runner/index.js
```

If you want to ensure that your job always runs inside a container, and subsequently always applies your container customizations, you can set the `ACTIONS_RUNNER_REQUIRE_JOB_CONTAINER` variable on the self hosted runner to `true`. This will fail jobs that do not specify a job container.

## Troubleshooting

### No timeout setting

There is currently no timeout setting available for the script executed by `ACTIONS_RUNNER_CONTAINER_HOOKS`. As a result, you could consider adding timeout handling to your script.

### Reviewing the workflow run log

To confirm whether your scripts are executing, you can review the logs for that job. For more information on checking the logs, see [Using workflow run logs](/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs#viewing-logs-to-diagnose-failures).
---

# Managing access to self-hosted runners using groups

You can use policies to limit access to self-hosted runners that have been added to an organization.

## Creating a self-hosted runner group for an organization

> \[!WARNING]
> We recommend that you only use self-hosted runners with private repositories. This is because forks of your public repository can potentially run dangerous code on your self-hosted runner machine by creating a pull request that executes the code in a workflow.
>
> For more information, see [Secure use reference](/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions).

> \[!NOTE]
> When creating a runner group, you must choose a policy that defines which repositories have access to the runner group. To change which repositories and workflows can access the runner group, organization owners can set a policy for the organization. For more information, see [Enforcing policies for GitHub Actions in your enterprise](/en/enterprise-cloud@latest/admin/policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#disabling-repository-level-self-hosted-runners).

All organizations have a single default runner group. Organization owners using the GitHub Team plan can create additional organization-level runner groups.

If no group is specified during the registration process, runners are automatically added to the default group. You can later move the runner from the default group to a custom group.

For information about how to create a runner group with the REST API, see [REST API endpoints for GitHub Actions](/en/rest/actions#self-hosted-runner-groups).

1. On GitHub, navigate to the main page of the organization.

2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)

3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runner groups**.

4. In the "Runner groups" section, click **New runner group**.

5. Enter a name for your runner group.

6. Assign a policy for repository access.

   You can configure a runner group to be accessible to a specific list of repositories, or to all repositories in the organization. By default, only private repositories can access runners in a runner group, but you can override this. This setting can't be overridden if configuring an organization's runner group that was shared by an enterprise.

7. Click **Create group** to create the group and apply the policy.

## Changing which repositories can access a runner group

> \[!WARNING]
> We recommend that you only use self-hosted runners with private repositories. This is because forks of your public repository can potentially run dangerous code on your self-hosted runner machine by creating a pull request that executes the code in a workflow.
>
> For more information, see [Secure use reference](/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions).

For runner groups in an organization, you can change what repositories in the organization can access a runner group.

1. Navigate to the main page of the organization where your runner groups are located.

2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.

3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runner groups**.

4. In the list of groups, click the runner group you'd like to configure.

5. Under "Repository access," use the dropdown menu to click **Selected repositories**.
   1. To the right of the dropdown menu, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="The Gear icon" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>.
   2. In the popup, use the checkboxes to select repositories that can access this runner group.

6. Click **Save group**.

## Changing the name of a runner group

1. Navigate to the main page of the organization where your runner groups are located.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runner groups**.
4. In the list of groups, click the runner group you'd like to configure.
5. Enter the new runner group name in the text field under "Group name."
6. Click **Save**.

## Automatically adding a self-hosted runner to a group

You can use the configuration script to automatically add a new runner to a group. For example, this command registers a new runner and uses the `--runnergroup` parameter to add it to a group named `rg-runnergroup`.

```shell
./config.sh --url $org_or_enterprise_url --token $token --runnergroup rg-runnergroup
```

The command will fail if the runner group doesn't exist:

```shell
Could not find any self-hosted runner group named "rg-runnergroup".
```

<span id="moving-a-runner-to-a-group"></a>

## Moving a self-hosted runner to a group

If you don't specify a runner group during the registration process, your new runners are automatically assigned to the default group, and can then be moved to another group.

1. On GitHub, navigate to the main page of the organization.
2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the "Runners" list, click the runner that you want to configure.
5. Select the **Runner group** drop-down.
6. In "Move runner to group", choose a destination group for the runner.

## Removing a self-hosted runner group

In order to remove a runner group, you must first move or remove all of the runners from the group.

1. Navigate to the main page of the organization where your runner groups are located.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runner groups**.
4. In the list of groups, to the right of the group you want to delete, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="The horizontal kebab icon" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>.
5. To remove the group, click **Remove group**.
6. Review the confirmation prompts, and click **Remove this runner group**.
---

# Monitoring and troubleshooting self-hosted runners

You can monitor your self-hosted runners to view their activity and diagnose common issues.

## Checking access levels

You may not be able to create a self-hosted runner for an organization-owned repository.

Organization owners can choose which repositories are allowed to create repository-level self-hosted runners.

For more information, see [Disabling or limiting GitHub Actions for your organization](/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#limiting-the-use-of-self-hosted-runners).

## Checking the status of a self-hosted runner

A self-hosted runner can be located in either your repository, organization, or enterprise account settings on GitHub. To manage a self-hosted runner, you must have the following permissions, depending on where the self-hosted runner was added:

* **User repository:** You must be the repository owner.
* **Organization:** You must be an organization owner.
* **Organization repository:** You must be an organization owner, or have admin access to the repository.

1. In your organization or repository, navigate to the main page and click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**.

2. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.

3. Under "Runners", you can view a list of registered runners, including the runner's name, labels, and status.

   The status can be one of the following:

   * **Idle:** The runner is connected to GitHub and is ready to execute jobs.
   * **Active:** The runner is currently executing a job.
   * **Offline:** The runner is not connected to GitHub. This could be because the machine is offline, the self-hosted runner application is not running on the machine, or the self-hosted runner application cannot communicate with GitHub.

## Troubleshooting network connectivity

### Checking self-hosted runner network connectivity

You can use the self-hosted runner application's `config` script with the `--check` parameter to check that a self-hosted runner can access all required network services on GitHub.

In addition to `--check`, you must provide two arguments to the script:

* `--url` with the URL to your GitHub repository, organization, or enterprise. For example, `--url https://github.com/octo-org/octo-repo`.
* `--pat` with the value of a personal access token (classic), which must have the `workflow` scope, or a fine-grained personal access token with workflows read and write access. For example, `--pat ghp_abcd1234`. For more information, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

For example:

<div class="ghd-tool mac">

```shell
./config.sh --check --url URL --pat ghp_abcd1234
```

</div>

<div class="ghd-tool linux">

```shell
./config.sh --check --url URL --pat ghp_abcd1234
```

</div>

<div class="ghd-tool windows">

```powershell
config.cmd --check --url https://github.com/YOUR-ORG/YOUR-REPO --pat GHP_ABCD1234
```

</div>

The script tests each service, and outputs either a `PASS` or `FAIL` for each one. If you have any failing checks, you can see more details on the problem in the log file for the check. The log files are located in the `_diag` directory where you installed the runner application, and the path of the log file for each check is shown in the console output of the script.

If you have any failing checks, you should also verify that your self-hosted runner machine meets all the communication requirements. For more information, see [Self-hosted runners reference](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/communicating-with-self-hosted-runners).

### Disabling TLS certificate verification

By default, the self-hosted runner application verifies the TLS certificate for GitHub. If you encounter network problems, you may wish to disable TLS certificate verification for testing purposes.

To disable TLS certification verification in the self-hosted runner application, set the `GITHUB_ACTIONS_RUNNER_TLS_NO_VERIFY` environment variable to `1` before configuring and running the self-hosted runner application.

<div class="ghd-tool linux">

```shell
export GITHUB_ACTIONS_RUNNER_TLS_NO_VERIFY=1
./config.sh --url https://github.com/YOUR-ORG/YOUR-REPO --token
./run.sh
```

</div>

<div class="ghd-tool mac">

```shell
export GITHUB_ACTIONS_RUNNER_TLS_NO_VERIFY=1
./config.sh --url https://github.com/YOUR-ORG/YOUR-REPO --token
./run.sh
```

</div>

<div class="ghd-tool windows">

```powershell
[Environment]::SetEnvironmentVariable('GITHUB_ACTIONS_RUNNER_TLS_NO_VERIFY', '1')
./config.cmd --url https://github.com/YOUR-ORG/YOUR-REPO --token
./run.cmd
```

</div>

> \[!WARNING]
> Disabling TLS verification is not recommended since TLS provides privacy and data integrity between the self-hosted runner application and GitHub. We recommend that you install the GitHub certificate in the operating system certificate store for your self-hosted runner. For guidance on how to install the GitHub certificate, check with your operating system vendor.

> \[!NOTE]
> For GitHub-hosted larger runners using Azure private networking, see the TLS interception requirements in [Configuring private networking for GitHub-hosted runners in your organization](/en/organizations/managing-organization-settings/configuring-private-networking-for-github-hosted-runners-in-your-organization#prerequisites).

## Reviewing the self-hosted runner application log files

You can monitor the status of the self-hosted runner application and its activities. Log files are kept in the `_diag` directory where you installed the runner application, and a new log is generated each time the application is started. The filename begins with `Runner_`, and is followed by a UTC timestamp of when the application was started.

> \[!WARNING]
> Runner application log files for ephemeral runners must be forwarded and preserved externally for troubleshooting and diagnostic purposes. For more information about ephemeral runners and autoscaling self-hosted runners, see [Self-hosted runners reference](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/autoscaling-with-self-hosted-runners#using-ephemeral-runners-for-autoscaling).

For detailed logs on workflow job executions, see the next section describing the `Worker_` files.

## Reviewing a job's log file

The self-hosted runner application creates a detailed log file for each job that it processes. These files are stored in the `_diag` directory where you installed the runner application, and the filename begins with `Worker_`.

<div class="ghd-tool linux">

## Using journalctl to check the self-hosted runner application service

For Linux-based self-hosted runners running the application using a service, you can use `journalctl` to monitor their real-time activity. The default systemd-based service uses the following naming convention: `actions.runner.<org>-<repo>.<runnerName>.service`. This name is truncated if it exceeds 80 characters, so the preferred way of finding the service's name is by checking the *.service* file. For example:

```shell
$ cat ~/actions-runner/.service
actions.runner.octo-org-octo-repo.runner01.service
```

If this fails due to the service being installed elsewhere, you can find the service name in the list of running services. For example, on most Linux systems you can use the `systemctl` command:

```shell
$ systemctl --type=service | grep actions.runner
actions.runner.octo-org-octo-repo.hostname.service loaded active running GitHub Actions Runner (octo-org-octo-repo.hostname)
```

You can use `journalctl` to monitor the real-time activity of the self-hosted runner:

```shell
sudo journalctl -u actions.runner.octo-org-octo-repo.runner01.service -f
```

In this example output, you can see `runner01` start, receive a job named `testAction`, and then display the resulting status:

```shell
Feb 11 14:57:07 runner01 runsvc.sh[962]: Starting Runner listener with startup type: service
Feb 11 14:57:07 runner01 runsvc.sh[962]: Started listener process
Feb 11 14:57:07 runner01 runsvc.sh[962]: Started running service
Feb 11 14:57:16 runner01 runsvc.sh[962]: √ Connected to GitHub
Feb 11 14:57:17 runner01 runsvc.sh[962]: 2020-02-11 14:57:17Z: Listening for Jobs
Feb 11 16:06:54 runner01 runsvc.sh[962]: 2020-02-11 16:06:54Z: Running job: testAction
Feb 11 16:07:10 runner01 runsvc.sh[962]: 2020-02-11 16:07:10Z: Job testAction completed with result: Succeeded
```

To view the `systemd` configuration, you can locate the service file here: `/etc/systemd/system/actions.runner.<org>-<repo>.<runnerName>.service`.
If you want to customize the self-hosted runner application service, do not directly modify this file. Follow the instructions described in [Configuring the self-hosted runner application as a service](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service#customizing-the-self-hosted-runner-service).

</div>

<div class="ghd-tool mac">

## Using `launchd` to check the self-hosted runner application service

For macOS-based self-hosted runners running the application as a service, you can use `launchctl` to monitor their real-time activity. The default launchd-based service uses the following naming convention: `actions.runner.<org>-<repo>.<runnerName>`. This name is truncated if it exceeds 80 characters, so the preferred way of finding the service's name is by checking the *.service* file in the runner directory:

```shell
% cat ~/actions-runner/.service
/Users/exampleUsername/Library/LaunchAgents/actions.runner.octo-org-octo-repo.runner01.plist
```

The `svc.sh` script uses `launchctl` to check whether the application is running. For example:

```shell
$ ./svc.sh status
status actions.runner.example.runner01:
/Users/exampleUsername/Library/LaunchAgents/actions.runner.example.runner01.plist
Started:
379 0 actions.runner.example.runner01
```

The resulting output includes the process ID and the name of the application’s `launchd` service.

To view the `launchd` configuration, you can locate the service file here: `/Users/exampleUsername/Library/LaunchAgents/actions.runner.<repoName>.<runnerName>.service`.
If you want to customize the self-hosted runner application service, do not directly modify this file. Follow the instructions described in [Configuring the self-hosted runner application as a service](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service#customizing-the-self-hosted-runner-service-1).

</div>

<div class="ghd-tool windows">

## Using PowerShell to check the self-hosted runner application service

For Windows-based self-hosted runners running the application as a service, you can use PowerShell to monitor their real-time activity. The service uses the naming convention `GitHub Actions Runner (<org>-<repo>.<runnerName>)`. You can also find the service's name by checking the *.service* file in the runner directory:

```powershell
PS C:\actions-runner> Get-Content .service
actions.runner.octo-org-octo-repo.runner01.service
```

You can view the status of the runner in the Windows *Services* application (`services.msc`). You can also use PowerShell to check whether the service is running:

```powershell
PS C:\actions-runner> Get-Service "actions.runner.octo-org-octo-repo.runner01.service" | Select-Object Name, Status
Name                                                  Status
----                                                  ------
actions.runner.octo-org-octo-repo.runner01.service    Running
```

You can use PowerShell to check the recent activity of the self-hosted runner. In this example output, you can see the application start, receive a job named `testAction`, and then display the resulting status:

```powershell
PS C:\actions-runner> Get-EventLog -LogName Application -Source ActionsRunnerService

   Index Time          EntryType   Source                 InstanceID Message
   ----- ----          ---------   ------                 ---------- -------
     136 Mar 17 13:45  Information ActionsRunnerService          100 2020-03-17 13:45:48Z: Job Greeting completed with result: Succeeded
     135 Mar 17 13:45  Information ActionsRunnerService          100 2020-03-17 13:45:34Z: Running job: testAction
     134 Mar 17 13:41  Information ActionsRunnerService          100 2020-03-17 13:41:54Z: Listening for Jobs
     133 Mar 17 13:41  Information ActionsRunnerService          100 û Connected to GitHub
     132 Mar 17 13:41  Information ActionsRunnerService            0 Service started successfully.
     131 Mar 17 13:41  Information ActionsRunnerService          100 Starting Actions Runner listener
     130 Mar 17 13:41  Information ActionsRunnerService          100 Starting Actions Runner Service
     129 Mar 17 13:41  Information ActionsRunnerService          100 create event log trace source for actions-runner service
```

</div>

## Monitoring the automatic update process

We recommend that you regularly check the automatic update process, as the self-hosted runner will not be able to process jobs if it falls below a certain version threshold. The self-hosted runner application automatically updates itself, but note that this process does not include any updates to the operating system or other software; you will need to separately manage these updates.

You can view the update activities in the `Runner_` log files. For example:

```shell
[Feb 12 12:37:07 INFO SelfUpdater] An update is available.
```

In addition, you can find more information in the *SelfUpdate* log files located in the `_diag` directory where you installed the runner application.

<div class="ghd-tool linux">

## Troubleshooting containers in self-hosted runners

### Checking that Docker is installed

If your jobs require containers, then the self-hosted runner must be Linux-based and needs to have Docker installed. Check that your self-hosted runner has Docker installed and that the service is running.

You can use `systemctl` to check the service status:

```shell
$ sudo systemctl is-active docker.service
active
```

If Docker is not installed, then dependent actions will fail with the following errors:

```shell
[2020-02-13 16:56:10Z INFO DockerCommandManager] Which: 'docker'
[2020-02-13 16:56:10Z INFO DockerCommandManager] Not found.
[2020-02-13 16:56:10Z ERR  StepsRunner] Caught exception from step: System.IO.FileNotFoundException: File not found: 'docker'
```

### Checking the Docker permissions

If your job fails with the following error:

```shell
dial unix /var/run/docker.sock: connect: permission denied
```

Check that the self-hosted runner's service account has permission to use the Docker service. You can identify this account by checking the configuration of the self-hosted runner in `systemd`. For example:

```shell
$ sudo systemctl show -p User actions.runner.octo-org-octo-repo.runner01.service
User=runner-user
```

</div>

### Checking which Docker engine is installed on the runner

If your build fails with the following error:

```shell
Error: Input required and not supplied: java-version
```

Check which Docker engine is installed on your self-hosted runner. To pass the inputs of an action into the Docker container, the runner uses environment variables that might contain dashes as part of their names. The action may not be able to get the inputs if the Docker engine is not a binary executable, but is instead a shell wrapper or a link (for example, a Docker engine installed on Linux using `snap`). To address this error, configure your self-hosted runner to use a different Docker engine.

To check if your Docker engine was installed using `snap`, use the `which` command. In the following example, the Docker engine was installed using `snap`:

```shell
$ which docker
/snap/bin/docker
```
---

# Removing self-hosted runners

You can permanently remove a self-hosted runner from a repository.

## Removing a runner from a repository

> \[!NOTE]
>
> * This procedure permanently removes the self-hosted runner. If you only want to temporarily stop a runner from being assigned jobs, you can either shut down the machine or stop the `run` application. The runner will remain assigned in an "Offline" state, and won't execute any jobs until you restart the runner using the `run` application.
> * A self-hosted runner is automatically removed from GitHub if it has not connected to GitHub Actions for more than 14 days. An ephemeral self-hosted runner is automatically removed from GitHub if it has not connected to GitHub Actions for more than 1 day.
> * Just-in-time (JIT) runners can only run a single job. If JIT runners never run a job, they will automatically be removed. To remove a JIT runner before automatic removal, you must remove the JIT runner on GitHub.

To remove a self-hosted runner from a user repository you must be the repository owner. Organization owners can remove a runner from a repository in the organization.

We recommend that you also have access to the self-hosted runner machine.

For information about how to remove a self-hosted runner with the REST API, see [REST API endpoints for self-hosted runners](/en/rest/actions/self-hosted-runners).

Alternatively, if you don't have access to the repository or organization on GitHub to remove a runner, but you would like to re-use the runner machine, then you can delete the `.runner` file inside the self-hosted runner application directory (that is, the directory into which you downloaded and unpacked the runner software). This allows the runner to be registered without having to re-download the self-hosted runner application.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.](/assets/images/help/repository/repo-actions-settings.png)
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the list of runners, click on the name of the runner you'd like to configure.
5. Click **Remove**.
6. You will see instructions for removing the self-hosted runner. Complete either of the following steps to remove the runner, depending on whether it is still accessible:

   * **If you have access to the runner machine:** Follow the on-screen instructions for your machine's operating system to run the removal command. The instructions include the required URL and an automatically-generated, time-limited token.

     The removal command does the following tasks:

     * Removes the runner from GitHub.
     * Removes any self-hosted runner application configuration files on the machine.
     * Removes any services configured if not running in interactive mode.

   * **If you don't have access to the machine:** Click **Force remove this runner** to force GitHub to remove the runner.

## Removing a runner from an organization

> \[!NOTE]
>
> * This procedure permanently removes the self-hosted runner. If you only want to temporarily stop a runner from being assigned jobs, you can either shut down the machine or stop the `run` application. The runner will remain assigned in an "Offline" state, and won't execute any jobs until you restart the runner using the `run` application.
> * A self-hosted runner is automatically removed from GitHub if it has not connected to GitHub Actions for more than 14 days. An ephemeral self-hosted runner is automatically removed from GitHub if it has not connected to GitHub Actions for more than 1 day.
> * Just-in-time (JIT) runners can only run a single job. If JIT runners never run a job, they will automatically be removed. To remove a JIT runner before automatic removal, you must remove the JIT runner on GitHub.

To remove a self-hosted runner from an organization, you must be an organization owner. We recommend that you also have access to the self-hosted runner machine. For information about how to remove a self-hosted runner with the REST API, see [REST API endpoints for self-hosted runners](/en/rest/actions/self-hosted-runners).

Alternatively, if you don't have access to the repository or organization on GitHub to remove a runner, but you would like to re-use the runner machine, then you can delete the `.runner` file inside the self-hosted runner application directory (that is, the directory into which you downloaded and unpacked the runner software). This allows the runner to be registered without having to re-download the self-hosted runner application.

1. On GitHub, navigate to the main page of the organization.
2. Under your organization name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-gear" aria-label="gear" role="img"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg> Settings**. If you cannot see the "Settings" tab, select the **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)
3. In the left sidebar, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**, then click **Runners**.
4. In the list of runners, click on the name of the runner you'd like to configure.
5. Click **Remove**.
6. You will see instructions for removing the self-hosted runner. Complete either of the following steps to remove the runner, depending on whether it is still accessible:

   * **If you have access to the runner machine:** Follow the on-screen instructions for your machine's operating system to run the removal command. The instructions include the required URL and an automatically-generated, time-limited token.

     The removal command does the following tasks:

     * Removes the runner from GitHub.
     * Removes any self-hosted runner application configuration files on the machine.
     * Removes any services configured if not running in interactive mode.

   * **If you don't have access to the machine:** Click **Force remove this runner** to force GitHub to remove the runner.

## Removing a runner from an enterprise

If you use GitHub Enterprise Cloud, you can also remove runners from an enterprise. For more information, see the [GitHub Enterprise Cloud documentation](/en/enterprise-cloud@latest/actions/hosting-your-own-runners/managing-self-hosted-runners/removing-self-hosted-runners#removing-a-runner-from-an-enterprise).
---

# Running scripts before or after a job

Scripts can automatically execute on a self-hosted runner, directly before or after a job.

## About pre- and post-job scripts

You can automatically execute scripts on a self-hosted runner, either before a job runs, or after a job finishes running. You could use these scripts to support the job's requirements, such as building or tearing down a runner environment, or cleaning out directories. You could also use these scripts to track telemetry of how your runners are used.

The custom scripts are automatically triggered when a specific environment variable is set on the runner; the environment variable must contain the absolute path to the script. For more information, see [Triggering the scripts](#triggering-the-scripts) below.

The following scripting languages are supported:

* **Bash:** Uses `bash` and can fallback to `sh`. Executes by running `-e {pathtofile}`.
* **PowerShell:** Uses `pwsh` and can fallback to `powershell`. Executes by running `-command \". '{pathtofile}'\"`.

## Writing the scripts

Your custom scripts can use the following features:

* **Variables:** Scripts have access to the default variables. The full webhook event payload can be found in `GITHUB_EVENT_PATH`. For more information, see [Variables reference](/en/actions/reference/variables-reference#default-environment-variables).
* **Workflow commands:** Scripts can use workflow commands. For more information, see [Workflow commands for GitHub Actions](/en/actions/using-workflows/workflow-commands-for-github-actions). Scripts can also use environment files. For more information, see [Environment files](/en/actions/using-workflows/workflow-commands-for-github-actions#environment-files).

Your script files must use a file extension for the relevant language, such as `.sh` or `.ps1`, in order to run successfully.

> \[!NOTE]
> Avoid using your scripts to output sensitive information to the console, as anyone with read access to the repository might be able to see the output in the UI logs.

### Handling exit codes

For pre-job scripts, exit code `0` indicates that the script completed successfully, and the job will then proceed to run. If there is any other exit code, the job will not run and will be marked as failed. To see the results of your pre-job scripts, check the logs for `Set up runner` entries. For more information on checking the logs, see [Using workflow run logs](/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs#viewing-logs-to-diagnose-failures).

The [`continue-on-error`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idcontinue-on-error) setting is not supported for use by these scripts.

## Triggering the scripts

The custom scripts must be located on the runner, but should not be stored in the `actions-runner` application directory. The scripts are executed in the security context of the service account that's running the runner service.

> \[!NOTE]
> The triggered scripts are processed synchronously, so they will block job execution while they are running.

The scripts are automatically executed when the runner has the following environment variables containing an absolute path to the script:

* `ACTIONS_RUNNER_HOOK_JOB_STARTED`: The script defined in this environment variable is triggered when a job has been assigned to a runner, but before the job starts running.
* `ACTIONS_RUNNER_HOOK_JOB_COMPLETED`: The script defined in this environment variable is triggered at the end of the job, after all the steps defined in the workflow have run.

To set these environment variables, you can either add them to the operating system, or add them to a file named `.env` within the self-hosted runner application directory (that is, the directory into which you downloaded and unpacked the runner software). Note that any change to the `.env` file will require restarting the runner.
For example, the following `.env` entry will have the runner automatically run a script, saved as `/opt/runner/cleanup_script.sh` on the runner machine, before each job runs:

```bash
ACTIONS_RUNNER_HOOK_JOB_STARTED=/opt/runner/cleanup_script.sh
```

> \[!NOTE]
> The script defined in `ACTIONS_RUNNER_HOOK_JOB_COMPLETED` is executed at the end of the job, before the job completes. This makes it unsuitable for use cases that may interrupt a runner, such as deleting the runner machine as part of an autoscaling implementation.

## Troubleshooting

### Permission denied

If you get a "permission denied" error when you attempt to run a script, make sure that the script is executable. For example, in a terminal on Linux or macOS you can use the following command to make a file executable.

```bash
chmod +x PATH/TO/FILE
```

For information about using workflows to run scripts, see [Adding scripts to your workflow](/en/actions/writing-workflows/choosing-what-your-workflow-does/adding-scripts-to-your-workflow).

### No timeout setting

There is currently no timeout setting available for scripts executed by `ACTIONS_RUNNER_HOOK_JOB_STARTED` or `ACTIONS_RUNNER_HOOK_JOB_COMPLETED`. As a result, you could consider adding timeout handling to your script.

### Reviewing the workflow run log

To confirm whether your scripts are executing, you can review the logs for that job. The scripts will be listed within separate steps for either `Set up runner` or `Complete runner`, depending on which environment variable is triggering the script. For more information on checking the logs, see [Using workflow run logs](/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs#viewing-logs-to-diagnose-failures).
---

# Using self-hosted runners in a workflow

To use self-hosted runners in a workflow, you can use labels or groups to specify the runner for a job.

## Viewing available runners for a repository

If you have `repo: write` access to a repository, you can view a list of the runners available to the repository.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, under the "Management" section, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-server" aria-label="server" role="img"><path d="M1.75 1h12.5c.966 0 1.75.784 1.75 1.75v4c0 .372-.116.717-.314 1 .198.283.314.628.314 1v4a1.75 1.75 0 0 1-1.75 1.75H1.75A1.75 1.75 0 0 1 0 12.75v-4c0-.358.109-.707.314-1a1.739 1.739 0 0 1-.314-1v-4C0 1.784.784 1 1.75 1ZM1.5 2.75v4c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-4a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25Zm.25 5.75a.25.25 0 0 0-.25.25v4c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-4a.25.25 0 0 0-.25-.25ZM7 4.75A.75.75 0 0 1 7.75 4h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 4.75ZM7.75 10h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM3 4.75A.75.75 0 0 1 3.75 4h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 4.75ZM3.75 10h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"></path></svg> Runners**.
4. Click the **Self hosted** tab at the top of the list of runners.
5. Review the list of available self-hosted runners for the repository. This list includes both self-hosted runners and runner scale sets created with Actions Runner Controller. For more information, see [Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/about-actions-runner-controller).
6. Optionally, to copy a runner's label to use it in a workflow, click <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="More options" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg> to the right of the runner, then click **Copy label**.

> \[!NOTE]
> Enterprise and organization owners can create runners from this page. To create a new runner, click **New runner** at the top right of the list of runners to add runners to the repository.
>
> For more information, see [Managing larger runners](/en/actions/using-github-hosted-runners/managing-larger-runners) and [Adding self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners).

## Using default labels to route jobs

A self-hosted runner automatically receives certain labels when it is added to GitHub Actions. These are used to indicate its operating system and hardware platform:

* `self-hosted`: Default label applied to self-hosted runners.
* `linux`, `windows`, or `macOS`: Applied depending on operating system.
* `x64`, `ARM`, or `ARM64`: Applied depending on hardware architecture.

You can use your workflow's YAML to send jobs to a combination of these labels. In this example, a self-hosted runner that matches all three labels will be eligible to run the job:

```yaml
runs-on: [self-hosted, linux, ARM64]
```

* `self-hosted` - Run this job on a self-hosted runner.
* `linux` - Only use a Linux-based runner.
* `ARM64` - Only use a runner based on ARM64 hardware.

To create individual self-hosted runners without the default labels, pass the `--no-default-labels` flag when you create the runner.

## Using custom labels to route jobs

You can create custom labels and assign them to your self-hosted runners at any time. Custom labels let you send jobs to particular types of self-hosted runners, based on how they're labeled.

For example, if you have a job that requires a specific type of graphics hardware, you can create a custom label called `gpu` and assign it to the runners that have the hardware installed. A self-hosted runner that matches all the assigned labels will then be eligible to run the job.

This example shows a job that combines default and custom labels:

```yaml
runs-on: [self-hosted, linux, x64, gpu]
```

* `self-hosted` - Run this job on a self-hosted runner.
* `linux` - Only use a Linux-based runner.
* `x64` - Only use a runner based on x64 hardware.
* `gpu` - This custom label has been manually assigned to self-hosted runners with the GPU hardware installed.

These labels operate cumulatively, so a self-hosted runner must have all four labels to be eligible to process the job.

## Using groups to route jobs

In this example, Ubuntu runners have been added to a group called `ubuntu-runners`. The `runs-on` key sends the job to any available runner in the `ubuntu-runners` group:

```yaml
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on: 
      group: ubuntu-runners
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v
```

## Using labels and groups to route jobs

When you combine groups and labels, the runner must meet both requirements to be eligible to run the job.

In this example, a runner group called `ubuntu-runners` is populated with Ubuntu runners, which have also been assigned the label `ubuntu-24.04-16core`. The `runs-on` key combines `group` and `labels` so that the job is routed to any available runner within the group that also has a matching label:

```yaml
name: learn-github-actions
on: [push]
jobs:
  check-bats-version:
    runs-on:
      group: ubuntu-runners
      labels: ubuntu-24.04-16core
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '14'
      - run: npm install -g bats
      - run: bats -v
```
---

# Authenticating ARC to the GitHub API

Authenticate Actions Runner Controller to the GitHub API.

You can authenticate Actions Runner Controller (ARC) to the GitHub API by using a GitHub App or by using a personal access token (classic).

> \[!NOTE]
> You cannot authenticate using a GitHub App for runners at the enterprise level. For more information, see [Managing access to self-hosted runners using groups](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/managing-access-to-self-hosted-runners-using-groups#about-runner-groups).

## Authenticating ARC with a GitHub App

1. Create a GitHub App that is owned by an organization. For more information, see [Registering a GitHub App](/en/apps/creating-github-apps/creating-github-apps/creating-a-github-app). Configure the GitHub App as follows.

   1. For "Homepage URL," enter `https://github.com/actions/actions-runner-controller`.

   2. Under "Permissions," click **Repository permissions**. Then use the dropdown menus to select the following access permissions.
      * **Administration:** Read and write

        > \[!NOTE]
        > `Administration: Read and write` is only required when configuring Actions Runner Controller to register at the repository scope. It is not required to register at the organization scope.

      * **Metadata:** Read-only

   3. Under "Permissions," click **Organization permissions**. Then use the dropdown menus to select the following access permissions.
      * **Self-hosted runners:** Read and write

2. After creating the GitHub App, on the GitHub App's page, note the value for "App ID". You will use this value later.

3. Under "Private keys", click **Generate a private key**, and save the `.pem` file. You will use this key later.

4. In the menu at the top-left corner of the page, click **Install app**, and next to your organization, click **Install** to install the app on your organization.

5. After confirming the installation permissions on your organization, note the app installation ID. You will use it later. You can find the app installation ID on the app installation page, which has the following URL format:

   `https://github.com/organizations/ORGANIZATION/settings/installations/INSTALLATION_ID`

6. Register the app ID, installation ID, and the downloaded `.pem` private key file from the previous steps to Kubernetes as a secret.

   To create a Kubernetes secret with the values of your GitHub App, run the following command.

   > \[!NOTE]
   > Create the secret in the same namespace where the `gha-runner-scale-set` chart is installed. In this example, the namespace is `arc-runners` to match the quickstart documentation. For more information, see [Get started with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/quickstart-for-actions-runner-controller#configuring-a-runner-scale-set).

   ```bash copy
   kubectl create secret generic pre-defined-secret \
      --namespace=arc-runners \
      --from-literal=github_app_id=123456 \
      --from-literal=github_app_installation_id=654321 \
      --from-literal=github_app_private_key='-----BEGIN RSA PRIVATE KEY-----********'
   ```

   Then using the `githubConfigSecret` property in your copy of the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file, pass the secret name as a reference.

   ```yaml
   githubConfigSecret: pre-defined-secret
   ```

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

## Authenticating ARC with a personal access token (classic)

ARC can use personal access tokens (classic) to register self-hosted runners.

1. Create a personal access token (classic) with the required scopes. The required scopes are different depending on whether you are registering runners at the repository or organization level. For more information on how to create a personal access token (classic), see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#creating-a-personal-access-token-classic).

   The following is the list of required personal access token scopes for ARC runners.

   * Repository runners: `repo`
   * Organization runners: `admin:org`

2. To create a Kubernetes secret with the value of your personal access token (classic), use the following command.

   > \[!NOTE]
   > Create the secret in the same namespace where the `gha-runner-scale-set` chart is installed. In this example, the namespace is `arc-runners` to match the quickstart documentation. For more information, see [Get started with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/quickstart-for-actions-runner-controller#configuring-a-runner-scale-set).

   ```bash copy
   kubectl create secret generic pre-defined-secret \
      --namespace=arc-runners \
      --from-literal=github_token='YOUR-PAT'
   ```

3. In your copy of the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file, pass the secret name as a reference.

   ```yaml
   githubConfigSecret: pre-defined-secret
   ```

   For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

## Authenticating ARC with a fine-grained personal access token

ARC can use fine-grained personal access tokens to register self-hosted runners.

1. Create a fine-grained personal access token with the required scopes. The required scopes are different depending on whether you are registering runners at the repository or organization level. For more information on how to create a fine-grained personal access token, see [Managing your personal access tokens](/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#creating-a-fine-grained-personal-access-token).

   The following is the list of required personal access token scopes for ARC runners.

   * Repository runners:
     * **Administration:** Read and write

   * Organization runners:
     * **Administration:** Read
     * **Self-hosted runners:** Read and write

2. To create a Kubernetes secret with the value of your fine-grained personal access token, use the following command.

   > \[!NOTE]
   > Create the secret in the same namespace where the `gha-runner-scale-set` chart is installed. In this example, the namespace is `arc-runners` to match the quickstart documentation. For more information, see [Get started with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/quickstart-for-actions-runner-controller#configuring-a-runner-scale-set).

   ```bash copy
   kubectl create secret generic pre-defined-secret \
      --namespace=arc-runners \
      --from-literal=github_token='YOUR-PAT'
   ```

3. In your copy of the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file, pass the secret name as a reference.

   ```yaml
   githubConfigSecret: pre-defined-secret
   ```

   For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

## Authenticating ARC with vault secrets

> \[!NOTE]
> Vault integration is currently available in public preview with support for Azure Key Vault.

Starting with gha-runner-scale-set version 0.12.0, ARC supports retrieving GitHub credentials from an external vault. Vault integration is configured per runner scale set. This means you can run some scale sets using Kubernetes secrets while others use vault-based secrets, depending on your security and operational requirements.

### Enabling Vault Integration

To enable vault integration for a runner scale set:

1. **Set the `githubConfigSecret` field** in your `values.yaml` file to the name of the secret key stored in your vault. This value must be a string.
2. **Uncomment and configure the `keyVault` section** in your `values.yaml` file with the appropriate provider and access details.
3. **Provide the required certificate** (`.pfx`) to both the controller and the listener. You can do this by:
   \*Rebuilding the controller image with the certificate included, or
   \*Mounting the certificate as a volume in both the controller and the listener using the `listenerTemplate` and `controllerManager` fields.

### Secret Format

The secret stored in Azure Key Vault must be in JSON format. The structure depends on the type of authentication you are using:

#### Example: GitHub Token

```json
{
  "github_token": "TOKEN"
}
```

#### Example: GitHub App

```json
{
  "github_app_id": "APP_ID_OR_CLIENT_ID",
  "github_app_installation_id": "INSTALLATION_ID",
  "github_app_private_key": "PRIVATE_KEY"
}
```

### Configuring `values.yaml` for Vault Integration

The certificate is stored as a .pfx file and mounted to the container at /akv/cert.pfx. Below is an example of how to configure the keyVault section to use this certificate for authentication:

```yaml
keyVault:
  type: "azure_key_vault"
  proxy:
    https:
      url: "PROXY_URL"
      credentialSecretRef: "PROXY_CREDENTIALS_SECRET_NAME"
    http: {}
    noProxy: []
  azureKeyVault:
    clientId: <AZURE_CLIENT_ID>
    tenantId: <AZURE_TENANT_ID>
    url: <AZURE_VAULT_URL>
    certificatePath: "/akv/cert.pfx"
```

### Providing the Certificate to the Controller and Listener

ARC requires a `.pfx` certificate to authenticate with the vault. This certificate must be made available to both the controller and the listener components during controller installation.
You can do this by mounting the certificate as a volume using the `controllerManager` and `listenerTemplate` fields in your `values.yaml` file:

```yaml
volumes:
  - name: cert-volume
    secret:
      secretName: my-cert-secret
volumeMounts:
  - mountPath: /akv
    name: cert-volume
    readOnly: true

listenerTemplate:
  volumeMounts:
    - name: cert-volume
      mountPath: /akv/certs
      readOnly: true
  volumes:
    - name: cert-volume
      secret:
        secretName: my-cert-secret
```

The code below is an example of a scale set `values.yml` file.

```yaml
listenerTemplate:
  spec:
    containers:
      - name: listener
        volumeMounts:
          - name: cert-volume
            mountPath: /akv
            readOnly: true
    volumes:
      - name: cert-volume
        secret:
          secretName: my-cert-secret
```

## Legal notice

Portions have been adapted from <https://github.com/actions/actions-runner-controller/> under the Apache-2.0 license:

```text
Copyright 2019 Moto Ishizawa

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
---

# Deploying runner scale sets with Actions Runner Controller

Deploy runner scale sets with Actions Runner Controller, and use advanced configuration options to tailor Actions Runner Controller to your needs.

## Deploying a runner scale set

To deploy a runner scale set, you must have ARC up and running. For more information, see [Get started with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/quickstart-for-actions-runner-controller).

You can deploy runner scale sets with ARC's Helm charts or by deploying the necessary manifests. Using ARC's Helm charts is the preferred method, especially if you do not have prior experience using ARC.

> \[!NOTE]
>
> * As a security best practice, create your runner pods in a different namespace than the namespace containing your operator pods.
> * As a security best practice, create Kubernetes secrets and pass the secret references. Passing your secrets in plain text via the CLI can pose a security risk.
> * We recommend running production workloads in isolation. GitHub Actions workflows are designed to run arbitrary code, and using a shared Kubernetes cluster for production workloads could pose a security risk.
> * Ensure you have implemented a way to collect and retain logs from the controller, listeners, and ephemeral runners.

1. To configure your runner scale set, run the following command in your terminal, using values from your ARC configuration.

   When you run the command, keep the following in mind.

   * Update the `INSTALLATION_NAME` value carefully. You can use the installation name as the value of [`runs-on`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idruns-on) in your workflows.
   * Update the `NAMESPACE` value to the location you want the runner pods to be created.
   * Set the `GITHUB_CONFIG_URL` value to the URL of your repository, organization, or enterprise. This is the entity that the runners will belong to.
   * This example command installs the latest version of the Helm chart. To install a specific version, you can pass the `--version` argument with the version of the chart you want to install. You can find the list of releases in the [`actions-runner-controller`](https://github.com/actions/actions-runner-controller/pkgs/container/actions-runner-controller-charts%2Fgha-runner-scale-set) repository.

     ```bash copy
     INSTALLATION_NAME="arc-runner-set"
     NAMESPACE="arc-runners"
     GITHUB_CONFIG_URL="https://github.com/<your_enterprise/org/repo>"
     GITHUB_PAT="<PAT>"
     helm install "${INSTALLATION_NAME}" \
         --namespace "${NAMESPACE}" \
         --create-namespace \
         --set githubConfigUrl="${GITHUB_CONFIG_URL}" \
         --set githubConfigSecret.github_token="${GITHUB_PAT}" \
         oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set
     ```

     For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

2. To check your installation, run the following command in your terminal.

   ```bash copy
   helm list -A
   ```

   You should see an output similar to the following.

   ```bash
   NAME            NAMESPACE       REVISION        UPDATED                                 STATUS          CHART                                       APP VERSION
   arc             arc-systems     1               2023-04-12 11:45:59.152090536 +0000 UTC deployed        gha-runner-scale-set-controller-0.4.0       0.4.0
   arc-runner-set  arc-systems     1               2023-04-12 11:46:13.451041354 +0000 UTC deployed        gha-runner-scale-set-0.4.0                  0.4.0
   ```

3. To check the manager pod, run the following command in your terminal.

   ```bash copy
   kubectl get pods -n arc-systems
   ```

   If the installation was successful, the pods will show the `Running` status.

   ```bash
   NAME                                                   READY   STATUS    RESTARTS   AGE
   arc-gha-runner-scale-set-controller-594cdc976f-m7cjs   1/1     Running   0          64s
   arc-runner-set-754b578d-listener                       1/1     Running   0          12s
   ```

If your installation was not successful, see [Troubleshooting Actions Runner Controller errors](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/troubleshooting-actions-runner-controller-errors) for troubleshooting information.

## Using advanced configuration options

ARC offers several advanced configuration options.

### Configuring the runner scale set name

> \[!NOTE]
> Runner scale set names are unique within the runner group they belong to. If you want to deploy multiple runner scale sets with the same name, they must belong to different runner groups.

To configure the runner scale set name, you can define an `INSTALLATION_NAME` or set the value of `runnerScaleSetName` in your copy of the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file.

```yaml
## The name of the runner scale set to create, which defaults to the Helm release name
runnerScaleSetName: "my-runners"
```

Make sure to pass the `values.yaml` file in your `helm install` command. See the [Helm Install](https://helm.sh/docs/helm/helm_install/) documentation for more details.

### Choosing runner destinations

Runner scale sets can be deployed at the repository, organization, or enterprise levels.

To deploy runner scale sets to a specific level, set the value of `githubConfigUrl` in your copy of the `values.yaml` to the URL of your repository, organization, or enterprise.

The following example shows how to configure ARC to add runners to `octo-org/octo-repo`.

```yaml
githubConfigUrl: "https://github.com/octo-ent/octo-org/octo-repo"
```

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

### Using a GitHub App for authentication

If you are not using enterprise-level runners, you can use GitHub Apps to authenticate with the GitHub API. For more information, see [Authenticating ARC to the GitHub API](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/authenticating-to-the-github-api).

> \[!NOTE]
> Given the security risk associated with exposing your private key in plain text in a file on disk, we recommend creating a Kubernetes secret and passing the reference instead.

You can either create a Kubernetes secret, or specify values in your [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file.

#### Option 1: Create a Kubernetes secret (recommended)

Once you have created your GitHub App, create a Kubernetes secret and pass the reference to that secret in your copy of the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file.

> \[!NOTE]
> Create the secret in the same namespace where the `gha-runner-scale-set` chart is installed. In this example, the namespace is `arc-runners` to match the quickstart documentation. For more information, see [Get started with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/quickstart-for-actions-runner-controller#configuring-a-runner-scale-set).

```bash
kubectl create secret generic pre-defined-secret \
  --namespace=arc-runners \
  --from-literal=github_app_id=123456 \
  --from-literal=github_app_installation_id=654321 \
  --from-file=github_app_private_key=private-key.pem
```

In your copy of the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) pass the secret name as a reference.

```yaml
githubConfigSecret: pre-defined-secret
```

#### Option 2: Specify values in your `values.yaml` file

Alternatively, you can specify the values of `app_id`, `installation_id` and `private_key` in your copy of the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file.

```yaml
## githubConfigSecret is the Kubernetes secret to use when authenticating with GitHub API.
## You can choose to use a GitHub App or a personal access token (classic)
githubConfigSecret:
  ## GitHub Apps Configuration
  ## IDs must be strings, use quotes
  github_app_id: "123456"
  github_app_installation_id: "654321"
  github_app_private_key: |
    -----BEGIN RSA PRIVATE KEY-----
    ...
    HkVN9...
    ...
    -----END RSA PRIVATE KEY-----
```

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

### Managing access with runner groups

You can use runner groups to control which organizations or repositories have access to your runner scale sets. For more information on runner groups, see [Managing access to self-hosted runners using groups](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/managing-access-to-self-hosted-runners-using-groups).

To add a runner scale set to a runner group, you must already have a runner group created. Then set the `runnerGroup` property in your copy of the `values.yaml` file. The following example adds a runner scale set to the Octo-Group runner group.

```yaml
runnerGroup: "Octo-Group"
```

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

### Configuring an outbound proxy

To force HTTP traffic for the controller and runners to go through your outbound proxy, set the following properties in your Helm chart.

```yaml
proxy:
  http:
    url: http://proxy.com:1234
    credentialSecretRef: proxy-auth # a Kubernetes secret with `username` and `password` keys
  https:
    url: http://proxy.com:1234
    credentialSecretRef: proxy-auth # a Kubernetes secret with `username` and `password` keys
  noProxy:
    - example.com
    - example.org
```

ARC supports using anonymous or authenticated proxies. If you use authenticated proxies, you will need to set the `credentialSecretRef` value to reference a Kubernetes secret. You can create a secret with your proxy credentials with the following command.

> \[!NOTE]
> Create the secret in the same namespace where the `gha-runner-scale-set` chart is installed. In this example, the namespace is `arc-runners` to match the quickstart documentation. For more information, see [Get started with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/quickstart-for-actions-runner-controller#configuring-a-runner-scale-set).

```bash copy
  kubectl create secret generic proxy-auth \
    --namespace=arc-runners \
    --from-literal=username=proxyUsername \
    --from-literal=password=proxyPassword \
```

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

### Setting the maximum and minimum number of runners

The `maxRunners` and `minRunners` properties provide you with a range of options to customize your ARC setup.

> \[!NOTE]
> ARC does not support scheduled maximum and minimum configurations. You can use a cron job or any other scheduling solution to update the configuration on a schedule.

#### Example: Unbounded number of runners

If you comment out both the `maxRunners` and `minRunners` properties, ARC will scale up to the number of jobs assigned to the runner scale set and will scale down to 0 if there aren't any active jobs.

```yaml
## maxRunners is the max number of runners the auto scaling runner set will scale up to.
# maxRunners: 0

## minRunners is the min number of idle runners. The target number of runners created will be
## calculated as a sum of minRunners and the number of jobs assigned to the scale set.
# minRunners: 0
```

#### Example: Minimum number of runners

You can set the `minRunners` property to any number and ARC will make sure there is always the specified number of runners active and available to take jobs assigned to the runner scale set at all times.

```yaml
## maxRunners is the max number of runners the auto scaling runner set will scale up to.
# maxRunners: 0

## minRunners is the min number of idle runners. The target number of runners created will be
## calculated as a sum of minRunners and the number of jobs assigned to the scale set.
minRunners: 20
```

#### Example: Set maximum and minimum number of runners

In this configuration, Actions Runner Controller will scale up to a maximum of `30` runners and will scale down to `20` runners when the jobs are complete.

> \[!NOTE]
> The value of `minRunners` can never exceed that of `maxRunners`, unless `maxRunners` is commented out.

```yaml
## maxRunners is the max number of runners the auto scaling runner set will scale up to.
maxRunners: 30

## minRunners is the min number of idle runners. The target number of runners created will be
## calculated as a sum of minRunners and the number of jobs assigned to the scale set.
minRunners: 20
```

#### Example: Jobs queue draining

In certain scenarios you might want to drain the jobs queue to troubleshoot a problem or to perform maintenance on your cluster. If you set both properties to `0`, Actions Runner Controller will not create new runner pods when new jobs are available and assigned.

```yaml
## maxRunners is the max number of runners the auto scaling runner set will scale up to.
maxRunners: 0

## minRunners is the min number of idle runners. The target number of runners created will be
## calculated as a sum of minRunners and the number of jobs assigned to the scale set.
minRunners: 0
```

### Custom TLS certificates

> \[!NOTE]
> If you are using a custom runner image that is not based on the `Debian` distribution, the following instructions will not work.

Some environments require TLS certificates that are signed by a custom certificate authority (CA). Since the custom certificate authority certificates are not bundled with the controller or runner containers, you must inject them into their respective trust stores.

```yaml
githubServerTLS:
  certificateFrom:
    configMapKeyRef:
      name: config-map-name
      key: ca.crt
  runnerMountPath: /usr/local/share/ca-certificates/
```

When you do this, ensure you are using the Privacy Enhanced Mail (PEM) format and that the extension of your certificate is `.crt`. Anything else will be ignored.

The controller executes the following actions.

* Creates a `github-server-tls-cert` volume containing the certificate specified in `certificateFrom`.
* Mounts that volume on path `runnerMountPath/<certificate name>`.
* Sets the `NODE_EXTRA_CA_CERTS` environment variable to that same path.
* Sets the `RUNNER_UPDATE_CA_CERTS` environment variable to `1` (as of version `2.303.0`, this will instruct the runner to reload certificates on the host).

ARC observes values set in the runner pod template and does not overwrite them.

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

### Using a private container registry

> \[!WARNING]
> This Actions Runner Controller customization option may be outside the scope of what GitHub Support can assist with and may cause unexpected behavior when configured incorrectly.
>
> For more information about what GitHub Support can assist with, see [Support for Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/about-support-for-actions-runner-controller).

To use a private container registry, you can copy the controller image and runner image to your private container registry. Then configure the links to those images and set the `imagePullPolicy` and `imagePullSecrets` values.

#### Configuring the controller image

You can update your copy of the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set-controller/values.yaml) file and set the `image` properties as follows.

```yaml
image:
  repository: "custom-registry.io/gha-runner-scale-set-controller"
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: "0.4.0"

imagePullSecrets:
  - name: <registry-secret-name>
```

The listener container inherits the `imagePullPolicy` defined for the controller.

#### Configuring the runner image

You can update your copy of the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file and set the `template.spec` properties to configure the runner pod for your specific use case.

> \[!NOTE]
> The runner container must be named `runner`. Otherwise, it will not be configured properly to connect to GitHub.

The following is a sample configuration:

```yaml
template:
  spec:
    containers:
      - name: runner
        image: "custom-registry.io/actions-runner:latest"
        imagePullPolicy: Always
        command: ["/home/runner/run.sh"]
    imagePullSecrets:
      - name: <registry-secret-name>
```

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

### Updating the pod specification for the runner pod

> \[!WARNING]
> This Actions Runner Controller customization option may be outside the scope of what GitHub Support can assist with and may cause unexpected behavior when configured incorrectly.
>
> For more information about what GitHub Support can assist with, see [Support for Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/about-support-for-actions-runner-controller).

You can fully customize the PodSpec of the runner pod and the controller will apply the configuration you specify. The following is an example pod specification.

```yaml
template:
  spec:
    containers:
      - name: runner
        image: ghcr.io/actions/actions-runner:latest
        command: ["/home/runner/run.sh"]
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
        securityContext:
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            add:
              - NET_ADMIN
```

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

### Updating the pod specification for the listener pod

> \[!WARNING]
> This Actions Runner Controller customization option may be outside the scope of what GitHub Support can assist with and may cause unexpected behavior when configured incorrectly.
>
> For more information about what GitHub Support can assist with, see [Support for Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/about-support-for-actions-runner-controller).

You can customize the PodSpec of the listener pod and the controller will apply the configuration you specify. The following is an example pod specification.

> \[!NOTE]
> It's important to not change the `listenerTemplate.spec.containers.name` value of the listener container. Otherwise, the configuration you specify will be applied to a new sidecar container.

```yaml
listenerTemplate:
  spec:
    containers:
    # If you change the name of the container, the configuration will not be applied to the listener,
    # and it will be treated as a sidecar container.
    - name: listener
      securityContext:
        runAsUser: 1000
      resources:
        limits:
          cpu: "1"
          memory: 1Gi
        requests:
          cpu: "1"
          memory: 1Gi
```

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

## Using Docker-in-Docker or Kubernetes mode for containers

> \[!WARNING]
> This Actions Runner Controller customization option may be outside the scope of what GitHub Support can assist with and may cause unexpected behavior when configured incorrectly.
>
> For more information about what GitHub Support can assist with, see [Support for Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/about-support-for-actions-runner-controller).

If you are using container jobs and services or container actions, you must set the `containerMode` value to `dind` or `kubernetes`. To use a custom container mode, comment out or remove `containerMode`, and add your desired configuration to the `template` section. See [Customizing container modes](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller#customizing-container-modes).

* For more information on container jobs and services, see [Running jobs in a container](/en/actions/using-jobs/running-jobs-in-a-container).
* For more information on container actions, see [Creating a Docker container action](/en/actions/creating-actions/creating-a-docker-container-action).

### Using Docker-in-Docker mode

> \[!NOTE]
> The Docker-in-Docker container requires privileged mode. For more information, see [Configure a Security Context for a Pod or Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) in the Kubernetes documentation.
>
> By default, the `dind` container uses the `docker:dind` image, which runs the Docker daemon as root. You can replace this image with `docker:dind-rootless` as long as you are aware of the [known limitations](https://docs.docker.com/engine/security/rootless/#known-limitations) and run the pods with `--privileged` mode. To learn how to customize the Docker-in-Docker configuration, see [Customizing container modes](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller#customizing-container-modes).

Docker-in-Docker mode is a configuration that allows you to run Docker inside a Docker container. In this configuration, for each runner pod created, ARC creates the following containers.

* An `init` container
* A `runner` container
* A `dind` container

To enable Docker-in-Docker mode, set the `containerMode.type` to `dind` as follows.

```yaml
containerMode:
  type: "dind"
```

The `template.spec` will be updated to the following default configuration.

For versions of Kubernetes `>= v1.29`, sidecar container will be used to run docker daemon.

```yaml
template:
  spec:
    initContainers:
      - name: init-dind-externals
        image: ghcr.io/actions/actions-runner:latest
        command: ["cp", "-r", "/home/runner/externals/.", "/home/runner/tmpDir/"]
        volumeMounts:
          - name: dind-externals
            mountPath: /home/runner/tmpDir
      - name: dind
        image: docker:dind
        args:
          - dockerd
          - --host=unix:///var/run/docker.sock
          - --group=$(DOCKER_GROUP_GID)
        env:
          - name: DOCKER_GROUP_GID
            value: "123"
        securityContext:
          privileged: true
        restartPolicy: Always
        startupProbe:
          exec:
            command:
              - docker
              - info
          initialDelaySeconds: 0
          failureThreshold: 24
          periodSeconds: 5
        volumeMounts:
          - name: work
            mountPath: /home/runner/_work
          - name: dind-sock
            mountPath: /var/run
          - name: dind-externals
            mountPath: /home/runner/externals
    containers:
      - name: runner
        image: ghcr.io/actions/actions-runner:latest
        command: ["/home/runner/run.sh"]
        env:
          - name: DOCKER_HOST
            value: unix:///var/run/docker.sock
          - name: RUNNER_WAIT_FOR_DOCKER_IN_SECONDS
            value: "120"
        volumeMounts:
          - name: work
            mountPath: /home/runner/_work
          - name: dind-sock
            mountPath: /var/run
    volumes:
      - name: work
        emptyDir: {}
      - name: dind-sock
        emptyDir: {}
      - name: dind-externals
        emptyDir: {}
```

For versions of Kubernetes `< v1.29`, the following configuration will be applied:

```yaml
template:
  spec:
    initContainers:
      - name: init-dind-externals
        image: ghcr.io/actions/actions-runner:latest
        command:
          ["cp", "-r", "/home/runner/externals/.", "/home/runner/tmpDir/"]
        volumeMounts:
          - name: dind-externals
            mountPath: /home/runner/tmpDir
    containers:
      - name: runner
        image: ghcr.io/actions/actions-runner:latest
        command: ["/home/runner/run.sh"]
        env:
          - name: DOCKER_HOST
            value: unix:///var/run/docker.sock
        volumeMounts:
          - name: work
            mountPath: /home/runner/_work
          - name: dind-sock
            mountPath: /var/run
      - name: dind
        image: docker:dind
        args:
          - dockerd
          - --host=unix:///var/run/docker.sock
          - --group=$(DOCKER_GROUP_GID)
        env:
          - name: DOCKER_GROUP_GID
            value: "123"
        securityContext:
          privileged: true
        volumeMounts:
          - name: work
            mountPath: /home/runner/_work
          - name: dind-sock
            mountPath: /var/run
          - name: dind-externals
            mountPath: /home/runner/externals
    volumes:
      - name: work
        emptyDir: {}
      - name: dind-sock
        emptyDir: {}
      - name: dind-externals
        emptyDir: {}
```

The values in `template.spec` are automatically injected and cannot be overridden. If you want to customize this setup, you must unset `containerMode.type`, then copy this configuration and apply it directly in your copy of the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file.

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

### Using Kubernetes mode

In Kubernetes mode, ARC uses runner container hooks to create a new pod in the same namespace to run the service, container job, or action.

#### Prerequisites

Kubernetes mode supports two approaches for sharing job data between the runner pod and the container job pod. You can use persistent volumes, which remain the recommended option for scenarios requiring concurrent write access, or you can use container lifecycle hooks to restore and export job filesystems between pods without relying on RWX volumes. The lifecycle hook approach improves portability and performance by leveraging local storage and is ideal for clusters without shared storage.

#### Configuring Kubernetes mode with persistent volumes

To use Kubernetes mode, you must create persistent volumes that the runner pods can claim and use a solution that automatically provisions these volumes on demand. For testing, you can use a solution like [OpenEBS](https://github.com/openebs/openebs).

To enable Kubernetes mode, set the `containerMode.type` to `kubernetes` in your [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file.

```yaml
containerMode:
  type: "kubernetes"
  kubernetesModeWorkVolumeClaim:
    accessModes: ["ReadWriteOnce"]
    storageClassName: "dynamic-blob-storage"
    resources:
      requests:
        storage: 1Gi
```

For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC repository.

#### Configuring Kubernetes mode with container lifecycle hooks

To enable Kubernetes mode using container lifecycle hooks, set the `containerMode.type` to `kubernetes-novolume` in your `values.yaml` file:

```yaml
containerMode:
  type: "kubernetes-novolume"
```

> \[!NOTE]
> When using `kubernetes-novolume` mode, the container must run as `root` to support lifecycle hook operations.

#### Troubleshooting Kubernetes mode

When Kubernetes mode is enabled, workflows that are not configured with a container job will fail with an error similar to:

```bash
Jobs without a job container are forbidden on this runner, please add a 'container:' to your job or contact your self-hosted runner administrator.
```

To allow jobs without a job container to run, set `ACTIONS_RUNNER_REQUIRE_JOB_CONTAINER` to `false` on your runner container. This instructs the runner to disable this check.

> \[!WARNING]
> Allowing jobs to run without a container in `kubernetes` or `kubernetes-novolume` mode can give the >runner pod elevated privileges with the Kubernetes API server, including the ability to create pods and access secrets. Before changing this default, we recommend carefully reviewing the potential security implications.

```yaml
  template:
    spec:
      containers:
        - name: runner
          image: ghcr.io/actions/actions-runner:latest
          command: ["/home/runner/run.sh"]
          env:
            - name: ACTIONS_RUNNER_REQUIRE_JOB_CONTAINER
              value: "false"
```

### Customizing container modes

When you set the `containerMode` in the `values.yaml` file for the [`gha-runner-scale-set` helm chart](https://github.com/actions/actions-runner-controller/blob/5347e2c2c80fbc45be7390eab117e861d30776d1/charts/gha-runner-scale-set/values.yaml#L77), you can use either of the following values:

* `dind` or
* `kubernetes`

Depending on which value you set for the `containerMode`, a configuration will automatically be injected into the `template` section of the `values.yaml` file for the `gha-runner-scale-set` helm chart.

* See the [`dind` configuration](https://github.com/actions/actions-runner-controller/blob/5347e2c2c80fbc45be7390eab117e861d30776d1/charts/gha-runner-scale-set/values.yaml#L110).
* See the [`kubernetes` configuration](https://github.com/actions/actions-runner-controller/blob/5347e2c2c80fbc45be7390eab117e861d30776d1/charts/gha-runner-scale-set/values.yaml#L160).

To customize the spec, comment out or remove `containerMode`, and append the configuration you want in the `template` section.

#### Example: running `dind-rootless`

Before deciding to run `dind-rootless`, make sure you are aware of [known limitations](https://docs.docker.com/engine/security/rootless/#known-limitations).

For versions of Kubernetes >= v1.29, sidecar container will be used to run docker daemon.

```yaml
## githubConfigUrl is the GitHub url for where you want to configure runners
## ex: https://github.com/myorg/myrepo or https://github.com/myorg
githubConfigUrl: "https://github.com/actions/actions-runner-controller"

## githubConfigSecret is the k8s secrets to use when auth with GitHub API.
## You can choose to use GitHub App or a PAT token
githubConfigSecret: my-super-safe-secret

## maxRunners is the max number of runners the autoscaling runner set will scale up to.
maxRunners: 5

## minRunners is the min number of idle runners. The target number of runners created will be
## calculated as a sum of minRunners and the number of jobs assigned to the scale set.
minRunners: 0

runnerGroup: "my-custom-runner-group"

## name of the runner scale set to create. Defaults to the helm release name
runnerScaleSetName: "my-awesome-scale-set"

## template is the PodSpec for each runner Pod
## For reference: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#PodSpec
template:
  spec:
    initContainers:
    - name: init-dind-externals
      image: ghcr.io/actions/actions-runner:latest
      command: ["cp", "-r", "/home/runner/externals/.", "/home/runner/tmpDir/"]
      volumeMounts:
        - name: dind-externals
          mountPath: /home/runner/tmpDir
    - name: init-dind-rootless
      image: docker:dind-rootless
      command:
        - sh
        - -c
        - |
          set -x
          cp -a /etc/. /dind-etc/
          echo 'runner:x:1001:1001:runner:/home/runner:/bin/ash' >> /dind-etc/passwd
          echo 'runner:x:1001:' >> /dind-etc/group
          echo 'runner:100000:65536' >> /dind-etc/subgid
          echo 'runner:100000:65536' >> /dind-etc/subuid
          chmod 755 /dind-etc;
          chmod u=rwx,g=rx+s,o=rx /dind-home
          chown 1001:1001 /dind-home
      securityContext:
        runAsUser: 0
      volumeMounts:
        - mountPath: /dind-etc
          name: dind-etc
        - mountPath: /dind-home
          name: dind-home
    - name: dind
      image: docker:dind-rootless
      args:
        - dockerd
        - --host=unix:///run/user/1001/docker.sock
      securityContext:
        privileged: true
        runAsUser: 1001
        runAsGroup: 1001
      restartPolicy: Always
      startupProbe:
        exec:
          command:
            - docker
            - info
        initialDelaySeconds: 0
        failureThreshold: 24
        periodSeconds: 5
      volumeMounts:
        - name: work
          mountPath: /home/runner/_work
        - name: dind-sock
          mountPath: /run/user/1001
        - name: dind-externals
          mountPath: /home/runner/externals
        - name: dind-etc
          mountPath: /etc
        - name: dind-home
          mountPath: /home/runner
    containers:
    - name: runner
      image: ghcr.io/actions/actions-runner:latest
      command: ["/home/runner/run.sh"]
      env:
        - name: DOCKER_HOST
          value: unix:///run/user/1001/docker.sock
      securityContext:
        privileged: true
        runAsUser: 1001
        runAsGroup: 1001
      volumeMounts:
        - name: work
          mountPath: /home/runner/_work
        - name: dind-sock
          mountPath: /run/user/1001
    volumes:
    - name: work
      emptyDir: {}
    - name: dind-externals
      emptyDir: {}
    - name: dind-sock
      emptyDir: {}
    - name: dind-etc
      emptyDir: {}
    - name: dind-home
      emptyDir: {}
```

For versions of Kubernetes `< v1.29`, the following configuration will be applied:

```yaml
## githubConfigUrl is the GitHub url for where you want to configure runners
## ex: https://github.com/myorg/myrepo or https://github.com/myorg
githubConfigUrl: "https://github.com/actions/actions-runner-controller"

## githubConfigSecret is the k8s secrets to use when auth with GitHub API.
## You can choose to use GitHub App or a PAT token
githubConfigSecret: my-super-safe-secret

## maxRunners is the max number of runners the autoscaling runner set will scale up to.
maxRunners: 5

## minRunners is the min number of idle runners. The target number of runners created will be
## calculated as a sum of minRunners and the number of jobs assigned to the scale set.
minRunners: 0

runnerGroup: "my-custom-runner-group"

## name of the runner scale set to create. Defaults to the helm release name
runnerScaleSetName: "my-awesome-scale-set"

## template is the PodSpec for each runner Pod
## For reference: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#PodSpec
template:
  spec:
    initContainers:
    - name: init-dind-externals
      image: ghcr.io/actions/actions-runner:latest
      command: ["cp", "-r", "/home/runner/externals/.", "/home/runner/tmpDir/"]
      volumeMounts:
        - name: dind-externals
          mountPath: /home/runner/tmpDir
    - name: init-dind-rootless
      image: docker:dind-rootless
      command:
        - sh
        - -c
        - |
          set -x
          cp -a /etc/. /dind-etc/
          echo 'runner:x:1001:1001:runner:/home/runner:/bin/ash' >> /dind-etc/passwd
          echo 'runner:x:1001:' >> /dind-etc/group
          echo 'runner:100000:65536' >> /dind-etc/subgid
          echo 'runner:100000:65536' >> /dind-etc/subuid
          chmod 755 /dind-etc;
          chmod u=rwx,g=rx+s,o=rx /dind-home
          chown 1001:1001 /dind-home
      securityContext:
        runAsUser: 0
      volumeMounts:
        - mountPath: /dind-etc
          name: dind-etc
        - mountPath: /dind-home
          name: dind-home
    containers:
    - name: runner
      image: ghcr.io/actions/actions-runner:latest
      command: ["/home/runner/run.sh"]
      env:
        - name: DOCKER_HOST
          value: unix:///run/user/1001/docker.sock
      securityContext:
        privileged: true
        runAsUser: 1001
        runAsGroup: 1001
      volumeMounts:
        - name: work
          mountPath: /home/runner/_work
        - name: dind-sock
          mountPath: /run/user/1001
    - name: dind
      image: docker:dind-rootless
      args:
        - dockerd
        - --host=unix:///run/user/1001/docker.sock
      securityContext:
        privileged: true
        runAsUser: 1001
        runAsGroup: 1001
      volumeMounts:
        - name: work
          mountPath: /home/runner/_work
        - name: dind-sock
          mountPath: /run/user/1001
        - name: dind-externals
          mountPath: /home/runner/externals
        - name: dind-etc
          mountPath: /etc
        - name: dind-home
          mountPath: /home/runner
    volumes:
    - name: work
      emptyDir: {}
    - name: dind-externals
      emptyDir: {}
    - name: dind-sock
      emptyDir: {}
    - name: dind-etc
      emptyDir: {}
    - name: dind-home
      emptyDir: {}
```

#### Understanding runner-container-hooks

When the runner detects a workflow run that uses a container job, service container, or Docker action, it will call runner-container-hooks to create a new pod. The runner relies on runner-container-hooks to call the Kubernetes APIs and create a new pod in the same namespace as the runner pod. This newly created pod will be used to run the container job, service container, or Docker action. For more information, see the [`runner-container-hooks`](https://github.com/actions/runner-container-hooks) repository.

#### Configuring hook extensions

As of ARC version 0.4.0, runner-container-hooks support hook extensions. You can use these to configure the pod created by runner-container-hooks. For example, you could use a hook extension to set a security context on the pod. Hook extensions allow you to specify a YAML file that is used to update the [PodSpec](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.26/#podspec-v1-core) of the pod created by runner-container-hooks.

There are two options to configure hook extensions.

* Store in your **custom runner image**. You can store the PodSpec in a YAML file anywhere in your custom runner image. For more information, see [Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/about-actions-runner-controller#creating-your-own-runner-image).
* Store in a **ConfigMap**. You can create a config map with the PodSpec and mount that config map in the runner container. For more information, see [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/) in the Kubernetes documentation.

> \[!NOTE]
> With both options, you must set the `ACTIONS_RUNNER_CONTAINER_HOOK_TEMPLATE` environment variable in the runner container spec to point to the path of the YAML file mounted in the runner container.

##### Example: Using config map to set securityContext

Create a config map in the same namespace as the runner pods. For example:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hook-extension
  namespace: arc-runners
data:
  content: |
    metadata:
      annotations:
        example: "extension"
    spec:
      containers:
        - name: "$job" # Target the job container
          securityContext:
            runAsUser: 1000
```

* The `.metadata.labels` and `metadata.annotations` fields will be appended as is, unless their keys are reserved. You cannot override the `.metadata.name` and `metadata.namespace` fields.
* The majority of the PodSpec fields are applied from the specified template, and will override the values passed from your Helm chart `values.yaml` file.
* If you specify additional volumes they will be appended to the default volumes specified by the runner.
* The `spec.containers` are merged based on the names assigned to them.
  * If the name of the container is `$job`:
    * The `spec.containers.name` and `spec.containers.image` fields are ignored.
    * The `spec.containers.env`, `spec.containers.volumeMounts`, and `spec.containers.ports` fields are appended to the default container spec created by the hook.
    * The rest of the fields are applied as provided.
  * If the name of the container is not `$job`, the fields will be added to the pod definition as they are.

## Enabling metrics

> \[!NOTE]
> Metrics for ARC are available as of version gha-runner-scale-set-0.5.0.

ARC can emit metrics about your runners, your jobs, and time spent on executing your workflows. Metrics can be used to identify congestion, monitor the health of your ARC deployment, visualize usage trends, optimize resource consumption, among many other use cases. Metrics are emitted by the controller-manager and listener pods in Prometheus format. For more information, see [Exposition formats](https://prometheus.io/docs/instrumenting/exposition_formats/) in the Prometheus documentation.

To enable metrics for ARC, configure the `metrics` property in the [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set-controller/values.yaml) file of the `gha-runner-scale-set-controller` chart.

The following is an example configuration.

```yaml
metrics:
  controllerManagerAddr: ":8080"
  listenerAddr: ":8080"
  listenerEndpoint: "/metrics"
```

> \[!NOTE]
> If the `metrics:` object is not provided or is commented out, the following flags will be applied to the controller-manager and listener pods with empty values: `--metrics-addr`, `--listener-metrics-addr`, `--listener-metrics-endpoint`. This will disable metrics for ARC.

Once these properties are configured, your controller-manager and listener pods emit metrics via the listenerEndpoint bound to the ports that you specify in your [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set-controller/values.yaml) file. In the above example, the endpoint is `/metrics` and the port is `:8080`. You can use this endpoint to scrape metrics from your controller-manager and listener pods.

To turn off metrics, update your [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set-controller/values.yaml) file by removing or commenting out the `metrics:` object and its properties.

### Available metrics for ARC

The following table shows the metrics emitted by the controller-manager and listener pods.

> \[!NOTE]
> The metrics that the controller-manager emits pertain to the controller runtime and are not owned by GitHub.

| Owner              | Metric                                       | Type      | Description                                                                                                 |
| ------------------ | -------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| controller-manager | gha\_controller\_pending\_ephemeral\_runners | gauge     | Number of ephemeral runners in a pending state                                                              |
| controller-manager | gha\_controller\_running\_ephemeral\_runners | gauge     | Number of ephemeral runners in a running state                                                              |
| controller-manager | gha\_controller\_failed\_ephemeral\_runners  | gauge     | Number of ephemeral runners in a failed state                                                               |
| controller-manager | gha\_controller\_running\_listeners          | gauge     | Number of listeners in a running state                                                                      |
| listener           | gha\_assigned\_jobs                          | gauge     | Number of jobs assigned to the runner scale set                                                             |
| listener           | gha\_running\_jobs                           | gauge     | Number of jobs running or queued to run                                                                     |
| listener           | gha\_registered\_runners                     | gauge     | Number of runners registered by the runner scale set                                                        |
| listener           | gha\_busy\_runners                           | gauge     | Number of registered runners currently running a job                                                        |
| listener           | gha\_min\_runners                            | gauge     | Minimum number of runners configured for the runner scale set                                               |
| listener           | gha\_max\_runners                            | gauge     | Maximum number of runners configured for the runner scale set                                               |
| listener           | gha\_desired\_runners                        | gauge     | Number of runners desired (scale up / down target) by the runner scale set                                  |
| listener           | gha\_idle\_runners                           | gauge     | Number of registered runners not running a job                                                              |
| listener           | gha\_started\_jobs\_total                    | counter   | Total number of jobs started since the listener became ready \[1]                                           |
| listener           | gha\_completed\_jobs\_total                  | counter   | Total number of jobs completed since the listener became ready \[1]                                         |
| listener           | gha\_job\_startup\_duration\_seconds         | histogram | Number of seconds spent waiting for workflow job to get started on the runner owned by the runner scale set |
| listener           | gha\_job\_execution\_duration\_seconds       | histogram | Number of seconds spent executing workflow jobs by the runner scale set                                     |

\[1]: Listener metrics that have the counter type are reset when the listener pod restarts.

## Upgrading ARC

Because there is no support for upgrading or deleting CRDs with Helm, it is not possible to use Helm to upgrade ARC. For more information, see [Custom Resource Definitions](https://helm.sh/docs/chart_best_practices/custom_resource_definitions/#some-caveats-and-explanations) in the Helm documentation. To upgrade ARC to a newer version, you must complete the following steps.

1. Uninstall all installations of `gha-runner-scale-set`.
2. Wait for resources cleanup.
3. Uninstall ARC.
4. If there is a change in CRDs from the version you currently have installed, to the upgraded version, remove all CRDs associated with `actions.github.com` API group.
5. Reinstall ARC again.

For more information, see [Deploying a runner scale set](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller#deploying-a-runner-scale-set).

If you would like to upgrade ARC but are concerned about downtime, you can deploy ARC in a high availability configuration to ensure runners are always available. For more information, see [High availability and automatic failover](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller#high-availability-and-automatic-failover).

> \[!NOTE]
> Transitioning from the [community supported version of ARC](https://github.com/actions/actions-runner-controller/discussions/2775) to the GitHub supported version is a substantial architectural change. The GitHub supported version involves a redesign of many components of ARC. It is not a minor software upgrade. For these reasons, we recommend testing the new versions in a staging environment that matches your production environment first. This will ensure stability and reliability of the setup before deploying in production.

### Deploying a canary image

You can test features before they are released by using canary releases of the controller-manager container image. Canary images are published with tag format `canary-SHORT_SHA`. For more information, see [`gha-runner-scale-set-controller`](https://github.com/actions/actions-runner-controller/pkgs/container/gha-runner-scale-set-controller) on the Container registry.

> \[!NOTE]
>
> * You must use Helm charts on your local file system.
> * You cannot use the released Helm charts.

1. Update the `tag` in the [gha-runner-scale-set-controller `values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set-controller/values.yaml) file to: `canary-SHORT_SHA`
2. Update the field `appVersion` in the [`Chart.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/Chart.yaml) file for `gha-runner-scale-set` to: `canary-SHORT_SHA`
3. Re-install ARC using the updated Helm chart and `values.yaml` files.

## High availability and automatic failover

ARC can be deployed in a high availability (active-active) configuration. If you have two distinct Kubernetes clusters deployed in separate regions, you can deploy ARC in both clusters and configure runner scale sets to use the same `runnerScaleSetName`. In order to do this, each runner scale set must be assigned to a distinct runner group. For example, you can have two runner scale sets each named `arc-runner-set`, as long as one runner scale set belongs to `runner-group-A` and the other runner scale set belongs to `runner-group-B`. For information on assigning runner scale sets to runner groups, see [Managing access to self-hosted runners using groups](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/managing-access-to-self-hosted-runners-using-groups).

If both runner scale sets are online, jobs assigned to them will be distributed arbitrarily (assignment race). You cannot configure the job assignment algorithm. If one of the clusters goes down, the runner scale set in the other cluster will continue to acquire jobs normally without any intervention or configuration change.

## Using ARC across organizations

A single installation of Actions Runner Controller allows you to configure one or more runner scale sets. These runner scale sets can be registered to a repository, organization, or enterprise. You can also use runner groups to control the permissions boundaries of these runner scale sets.

As a best practice, create a unique namespace for each organization. You could also create a namespace for each runner group or each runner scale set. You can install as many runner scale sets as needed in each namespace. This will provide you the highest levels of isolation and improve your security. You can use GitHub Apps for authentication and define granular permissions for each runner scale set.

## Legal notice

Portions have been adapted from <https://github.com/actions/actions-runner-controller/> under the Apache-2.0 license:

```text
Copyright 2019 Moto Ishizawa

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
---

# Using Actions Runner Controller runners in a workflow

Use Actions Runner Controller runners in a workflow file.

## Using ARC runners in a workflow file

To assign jobs to run on a runner scale set, you can specify the name of the scale set as the value for the `runs-on` key in your GitHub Actions workflow file.

For example, the following configuration for a runner scale set has the `INSTALLATION_NAME` value set to `arc-runner-set`.

```bash
# Using a Personal Access Token (PAT)
INSTALLATION_NAME="arc-runner-set"
NAMESPACE="arc-runners"
GITHUB_CONFIG_URL="https://github.com/<your_enterprise/org/repo>"
GITHUB_PAT="<PAT>"
helm install "${INSTALLATION_NAME}" \
    --namespace "${NAMESPACE}" \
    --create-namespace \
    --set githubConfigUrl="${GITHUB_CONFIG_URL}" \
    --set githubConfigSecret.github_token="${GITHUB_PAT}" \
    oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set
```

To use this configuration in a workflow, set the value of the `runs-on` key in your workflow to `arc-runner-set`, similar to the following example.

```yaml
jobs:
  job_name:
    runs-on: arc-runner-set
```

## Using runner scale set names

Runner scale set names are unique within the runner group they belong to. To deploy multiple runner scale sets with the same name, they must belong to different runner groups. For more information about specifying runner scale set names, see [Deploying runner scale sets with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller).

You can use the installation name of the runner scale set, or define the value of the `runnerScaleSetName` field in your [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file, as your `runs-on` target. You can also assign multiple labels to a scale set to enable more flexible job routing. To configure labels for a runner scale set, set the `runnerScaleSetLabels` value in your `values.yaml` file. For more information, see [Deploying runner scale sets with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller#scaling-runners).

## Using labels to target runner scale sets

You can also assign multiple labels to a runner scale set and use them to target runners in your workflow. To configure labels for a runner scale set, set the `runnerScaleSetLabels` values in your `values.yaml` file.

```yaml
runnerScaleSetLabels:
  - linux
  - gpu
  - private-network
```

To target a runner scale set with specific labels, specify the labels as an array in the `runs-on` key of your workflow.

```yaml
jobs:
  job_name:
    runs-on: [linux, gpu, private-network]
```

## Legal notice

Portions have been adapted from <https://github.com/actions/actions-runner-controller/> under the Apache-2.0 license:

```text
Copyright 2019 Moto Ishizawa

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
---

# Using proxy servers with a runner

You can configure runners in isolated environments to use a proxy server for secure communication with GitHub.

## Configuring a proxy for Linux and Windows runners

If your runner needs to communicate via a proxy server, you can configure proxy settings using environment variables or system-level configurations.

| Variable      | Description                                                                                                                                                                             | Example                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `https_proxy` | Proxy URL for HTTPS traffic. You can include basic authentication if required.                                                                                                          | `http://proxy.local`<br>`http://192.168.1.1:8080`<br>`http://username:password@proxy.local` |
| `http_proxy`  | Proxy URL for HTTP traffic. You can include basic authentication if required.                                                                                                           | `http://proxy.local`<br>`http://192.168.1.1:8080`<br>`http://username:password@proxy.local` |
| `no_proxy`    | A comma-separated list of hosts or IP addresses that should bypass the proxy. Some clients only honor IP addresses when connections are made directly to the IP rather than a hostname. | `example.com`<br>`example.com,myserver.local:443,example.org`                               |

The proxy environment variables are read when the runner application starts, so you must set the environment variables before configuring or starting the runner application. If your proxy configuration changes, you must restart the runner application.

On Windows machines, the proxy environment variable names are case-insensitive. On Linux and macOS machines, we recommend that you use all lowercase environment variables. If you have an environment variable in both lowercase and uppercase on Linux or macOS, for example `https_proxy` and `HTTPS_PROXY`, the self-hosted runner application uses the lowercase environment variable.

The connection between self-hosted runners and GitHub is over HTTPS (port 443).

### Example configurations

> \[!NOTE]
> To avoid issues, it's good practice to treat environment variables as case sensitive, irrespective of the behavior of the operating system and shell you are using.

#### Linux and macOS

Set proxy environment variables for your runner.

```shell copy
export https_proxy=http://proxy.local:8080
export http_proxy=http://proxy.local:8080
export no_proxy=example.com,localhost,127.0.0.1
```

#### Windows

On Windows, you can configure proxy settings either by setting environment variables or by using the [netsh command](https://learn.microsoft.com/en-us/windows/win32/winhttp/netsh-exe-commands#set-advproxy).
The netsh approach applies to applications and services that rely on the WinHTTP API.

Setting environment variables is still required for runners that use private networking. Whether you also need to configure netsh depends on the applications used in your workflows.

```shell copy
netsh winhttp set advproxy setting-scope=machine settings={\"Proxy\":\"proxy.local:8080\",\"ProxyBypass\":\"168.63.129.16;169.254.169.254\",\"AutoconfigUrl\":\"\",\"AutoDetect\":false} 
```

When configuring this during custom image generation, use `setting-scope=machine` to ensure the proxy settings persist after reboots and during VM imaging.

### Making proxy settings persistent

When setting these environment variables during custom image generation, ensure the configuration persists across reboots or image rebuilds.

#### Linux and macOS

Write the variables to `/etc/environment`.

```shell
 echo 'http_proxy=http://proxy.local' >> /etc/environment
```

#### Windows

Set the system-wide environment variables.

```shell copy
[Environment]::SetEnvironmentVariable("http_proxy", "http://proxy.local", "Machine")
```

## Configuring a proxy for Azure runners

If your runner is hosted in Azure, either as a self-hosted runner or a GitHub-hosted larger runner deployed with private networking, you may need to configure a proxy to allow outbound connectivity to GitHub services while maintaining network isolation.

You should add Azure metadata and management IPs to your `no_proxy` list to ensure the runner can access required Azure services. These endpoints allow Azure VMs to retrieve configuration and identity information needed for proper operation.

The two Azure IPs are:

* 168.63.129.16 (see [Azure IP address 168.63.129.16 overview](https://learn.microsoft.com/en-us/azure/virtual-network/what-is-ip-address-168-63-129-16?tabs=linux))
* 169.254.169.254 (see [Azure Instance Metadata Service](https://learn.microsoft.com/en-us/azure/virtual-machines/instance-metadata-service?tabs=linux))

## Using a .env file to set the proxy configuration

> \[!NOTE]
> Using a `.env` file to set the proxy configuration cannot be done on a GitHub-hosted runner.

On self-hosted runners, you can configure proxy settings by adding the variables to a `.env` file in the self-hosted runner application directory (the directory where you downloaded and unpacked the runner software). This approach is useful when the runner is configured to run as a service under a system account. When the runner starts, it reads the variables set in `.env` for the proxy configuration.

### Example `.env` proxy configuration

```shell copy
https_proxy=http://proxy.local:8080
no_proxy=example.com,myserver.local:443
```

## Setting proxy configuration for Docker containers

If you use Docker container actions or service containers in your workflows, you might also need to configure Docker to use your proxy server in addition to setting the above environment variables.

For information on the required Docker configuration, see [Configure Docker to use a proxy server](https://docs.docker.com/network/proxy/) in the Docker documentation.