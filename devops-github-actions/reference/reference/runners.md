# Runners Reference

---

# GitHub-hosted runners reference

Find information about GitHub-hosted runners, including their specifications and customization options.

## Supported runners and hardware resources

Ranges of GitHub-hosted runners are available for use in public and private repositories.

For lists of available runners, see:

* [Standard runners for **public** repositories](#standard-github-hosted-runners-for-public-repositories)
* [Standard runners for **private** repositories](#standard-github-hosted-runners-for--private-repositories)

GitHub-hosted Linux runners support hardware acceleration for Android SDK tools, which makes running Android tests much faster and consumes fewer minutes. For more information on Android hardware acceleration, see [Configure hardware acceleration for the Android Emulator](https://developer.android.com/studio/run/emulator-acceleration) in the Android Developers documentation.

> \[!NOTE]
> The `-latest` runner images are the latest stable images that GitHub provides, and might not be the most recent version of the operating system available from the operating system vendor.

> \[!WARNING]
> Beta and Deprecated Images are provided "as-is", "with all faults" and "as available" and are excluded from the service level agreement and warranty. Beta Images may not be covered by customer support.

### Standard GitHub-hosted runners for public repositories

For public repositories, jobs using the workflow labels shown in the table below will run with the associated specifications. With the exception of single-CPU runners, each GitHub-hosted runner is a new virtual machine (VM) hosted by GitHub. Single-CPU runners are hosted in a container on a shared VM—see [GitHub-hosted runners reference](/en/actions/reference/runners/github-hosted-runners#single-cpu-runners). Use of the standard GitHub-hosted runners is free and unlimited on public repositories.

<table style="width:100%">
  <thead>
    <tr>
      <th scope="col"><b>Virtual machine / container</b></th>
      <th scope="col"><b>Processor (CPU)</b></th>
      <th scope="col"><b>Memory (RAM)</b></th>
      <th scope="col"><b>Storage (SSD)</b></th>
      <th scope="col"><b>Architecture</b></th>
      <th scope="col"><b>Workflow label</b></th>
    </tr>
  </thead>
  <tbody>
    <tr>
          <td>Linux</td>
          <td>1</td>
          <td>5 GB</td>
          <td>14 GB</td>
          <td> x64 </td>
          <td>
            <code>ubuntu-slim</code>
          </td>
        </tr>
    <tr>
      <td>Linux</td>
      <td>4</td>
      <td>16 GB</td>
      <td>14 GB</td>
      <td> x64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md">ubuntu-latest</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md">ubuntu-24.04</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2204-Readme.md">ubuntu-22.04</a></code>
      </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>4</td>
      <td>16 GB</td>
      <td>14 GB</td>
      <td> x64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md">windows-latest</a></code>,
         <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md">windows-2025</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-VS2026-Readme.md">windows-2025-vs2026</a></code> (public preview),
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2022-Readme.md">windows-2022</a></code>
      </td>
    </tr>
    <tr>
      <td>Linux</td>
      <td>4</td>
      <td>16 GB</td>
      <td>14 GB</td>
      <td> arm64 </td>
      <td>
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-ubuntu-24-image.md">ubuntu-24.04-arm</a></code>,
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-ubuntu-22-image.md">ubuntu-22.04-arm</a></code>
      </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>4</td>
      <td>16 GB</td>
      <td>14 GB</td>
      <td>arm64</td>
      <td>
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-windows-11-image.md">windows-11-arm</a></code>
      </td>
    </tr>
    <tr>
      <td>macOS</td>
      <td>4</td>
      <td>14 GB</td>
      <td>14 GB</td>
      <td> Intel </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md">macos-15-intel</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md">macos-26-intel</a></code>
      </td>
    </tr>
    <tr>
      <td>macOS</td>
      <td>3 (M1)</td>
      <td>7 GB</td>
      <td>14 GB</td>
      <td> arm64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md">macos-latest</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-14-arm64-Readme.md">macos-14</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md">macos-15</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md">macos-26</a></code>
      </td>
    </tr>
  </tbody>

</table>

### Standard GitHub-hosted runners for  private repositories

For  private repositories, jobs using the workflow labels shown in the table below will run on virtual machines with the associated specifications. These runners use your GitHub account's allotment of free minutes, and are then charged at the per minute rates. See [Actions runner pricing](/en/billing/reference/actions-minute-multipliers).

<table style="width:100%">
  <thead>
    <tr>
      <th scope="col"><b>Virtual Machine</b></th>
      <th scope="col"><b>Processor (CPU)</b></th>
      <th scope="col"><b>Memory (RAM)</b></th>
      <th scope="col"><b>Storage (SSD)</b></th>
      <th scope="col"><b>Architecture</b></th>
      <th scope="col"><b>Workflow label</b></th>
    </tr>
  </thead>
  <tbody>
    <tr>
          <td>Linux</td>
          <td>1</td>
          <td>5 GB</td>
          <td>14 GB</td>
          <td> x64 </td>
          <td>
            <code>ubuntu-slim</code>
          </td>
        </tr>
    <tr>
      <td>Linux</td>
      <td>2</td>
      <td>8 GB</td>
      <td>14 GB</td>
      <td> x64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md">ubuntu-latest</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md">ubuntu-24.04</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2204-Readme.md">ubuntu-22.04</a></code>
      </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>2</td>
      <td>8 GB</td>
      <td>14 GB</td>
      <td> x64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md">windows-latest</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md">windows-2025</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/windows/Windows2022-Readme.md">windows-2022</a></code>
      </td>
    </tr>
    <tr>
      <td>Linux</td>
      <td>2</td>
      <td>8 GB</td>
      <td>14 GB</td>
      <td> arm64 </td>
      <td>
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-ubuntu-24-image.md">ubuntu-24.04-arm</a></code>,
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-ubuntu-22-image.md">ubuntu-22.04-arm</a></code>
      </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>2</td>
      <td>8 GB</td>
      <td>14 GB</td>
      <td> arm64 </td>
      <td>
        <code><a href="https://github.com/actions/partner-runner-images/blob/main/images/arm-windows-11-image.md">windows-11-arm</a></code>
      </td>
    </tr>
    <tr>
      <td>macOS</td>
      <td>4</td>
      <td>14 GB</td>
      <td>14 GB</td>
      <td> Intel </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md">macos-15-intel</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md">macos-26-intel</a></code>
      </td>
    </tr>
    <tr>
      <td>macOS</td>
      <td>3 (M1)</td>
      <td>7 GB</td>
      <td>14 GB</td>
      <td> arm64 </td>
      <td>
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md">macos-latest</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-14-arm64-Readme.md">macos-14</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md">macos-15</a></code>,
        <code><a href="https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md">macos-26</a></code>
      </td>
    </tr>
  </tbody>
</table>

Workflow logs list the runner used to run a job. For more information, see [Viewing workflow run history](/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history).

### Limitations for arm64 macOS runners

* All actions provided by GitHub are compatible with arm64 GitHub-hosted runners. However, community actions may not be compatible with arm64 and need to be manually installed at runtime.
* Nested-virtualization is not supported due to the limitation of Apple's Virtualization Framework.
* Networking capabilities such as Azure private networking and assigning static IPs are not currently available for macOS larger runners.
* The arm64 macOS runners do not have a static UUID/UDID assigned to them because Apple does not support this feature. However, Intel MacOS runners are assigned a static UDID, specifically `4203018E-580F-C1B5-9525-B745CECA79EB`. If you are building and signing on the same host you plan to test the build on, you can sign with a [development provisioning profile](https://developer.apple.com/help/account/provisioning-profiles/create-a-development-provisioning-profile/). If you do require a static UDID, you can use Intel runners and add their UDID to your Apple Developer account.

### Single-CPU runners

Single-CPU GitHub-hosted runners are available in both public and private repositories. These runners—specified using the workflow label `ubuntu-slim`—offer a lower-cost option for running lightweight operations. This type of runner is optimized for automation tasks, issue operations and short-running jobs. They are not suitable for typical heavyweight CI/CD builds.

`ubuntu-slim` runners execute Actions workflows in Ubuntu Linux, inside a container rather than a full VM instance. When the job begins, GitHub automatically provisions a new container for that job. All steps in the job execute in the container, allowing the steps in that job to share information using the runner's file system. When the job has finished, the container is automatically decommissioned. Each container provides hypervisor level 2 isolation.

> \[!NOTE]
> The container for `ubuntu-slim` runners runs in unprivileged mode. This means that some operations requiring elevated privileges—such as mounting file systems, using Docker-in-Docker, or accessing low-level kernel features—are not supported.

A minimal set of tools is installed on the `ubuntu-slim` runner image, appropriate for lightweight tasks. For details on what software is installed on the `ubuntu-slim` image, see the [README file](https://github.com/actions/runner-images/blob/main/images/ubuntu-slim/ubuntu-slim-Readme.md) in the `actions/runner-images` repository.

#### Usage limits

Single-CPU runners follow the same concurrency model as other GitHub-hosted standard runners. See [Actions limits](/en/actions/reference/limits#job-concurrency-limits-for-github-hosted-runners). The concurrency for the runners is determined by your plan.

The job timeout for single-CPU runners is 15 minutes. If a job reaches this limit, the job is terminated and fails.

### Larger runners

Customers on GitHub Team and GitHub Enterprise Cloud plans can choose from a range of managed virtual machines that have more resources than the [standard GitHub-hosted runners](/en/actions/how-tos/using-github-hosted-runners/using-github-hosted-runners/about-github-hosted-runners#supported-runners-and-hardware-resources). These machines are referred to as "larger runners." They offer the following advanced features:

* More RAM, CPU, and disk space
* Static IP addresses
* Azure private networking
* The ability to group runners
* Autoscaling to support concurrent workflows
* GPU-powered runners

These larger runners are hosted by GitHub and have the runner application and other tools preinstalled.

For more information, see [Using larger runners](/en/actions/using-github-hosted-runners/about-larger-runners).

## Administrative privileges

The Linux and macOS virtual machines both run using passwordless `sudo`. When you need to execute commands or install tools that require more privileges than the current user, you can use `sudo` without needing to provide a password. For more information, see the [Sudo Manual](https://www.sudo.ws/man/1.8.27/sudo.man.html).

Windows virtual machines are configured to run as administrators with User Account Control (UAC) disabled. For more information, see [How User Account Control works](https://docs.microsoft.com/windows/security/identity-protection/user-account-control/how-user-account-control-works) in the Windows documentation.

## IP addresses

To get a list of IP address ranges that GitHub Actions uses for GitHub-hosted runners, you can use the GitHub REST API. For more information, see the `actions` key in the response of the `GET /meta` endpoint. For more information, see [REST API endpoints for meta data](/en/rest/meta/meta#get-github-meta-information).

Windows and Ubuntu runners are hosted in Azure and subsequently have the same IP address ranges as the Azure datacenters. macOS runners are hosted in GitHub's own macOS cloud.

Since there are so many IP address ranges for GitHub-hosted runners, we do not recommend that you use these as allowlists for your internal resources. Instead, we recommend you use larger runners with a static IP address range, or self-hosted runners. For more information, see [Using larger runners](/en/actions/using-github-hosted-runners/about-larger-runners) or [Self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners).

The list of GitHub Actions IP addresses returned by the API is updated once a week.

## Communication requirements for GitHub-hosted runners

A GitHub-hosted runner must establish connections to GitHub-owned endpoints to perform essential communication operations. In addition, your runner may require access to additional networks that you specify or utilize within an action.

To ensure proper communications for GitHub-hosted runners between networks within your configuration, ensure that the following communications are allowed.

> \[!NOTE]
> Some of the domains listed are configured using `CNAME` records. Some firewalls might require you to add rules recursively for all `CNAME` records. Note that the `CNAME` records might change in the future, and that only the domains listed will remain constant.

**Needed for essential operations:**

```shell copy
github.com
api.github.com
*.actions.githubusercontent.com
```

**Needed for downloading actions:**

```shell copy
codeload.github.com
```

**Needed for uploading/downloading job summaries, logs, workflow artifacts, and caches:**

```shell copy
results-receiver.actions.githubusercontent.com
*.blob.core.windows.net
```

**Needed for runner version updates:**

```shell copy
objects.githubusercontent.com
objects-origin.githubusercontent.com
github-releases.githubusercontent.com
github-registry-files.githubusercontent.com
```

**Needed for retrieving OIDC tokens:**

```shell copy
*.actions.githubusercontent.com
```

**Needed for downloading or publishing packages or containers to GitHub Packages:**

```shell copy
*.pkg.github.com
pkg-containers.githubusercontent.com
ghcr.io
```

**Needed for Git Large File Storage**

```shell copy
github-cloud.githubusercontent.com
github-cloud.s3.amazonaws.com
```

**Needed for jobs for Dependabot updates**

```shell copy
dependabot-actions.githubapp.com
```

**Needed for downloading release assets:**

```shell copy
release-assets.githubusercontent.com
```

**Needed for VNet:**

```shell copy
api.snapcraft.io
```

## File systems

GitHub executes actions and shell commands in specific directories on the virtual machine. The file paths on virtual machines are not static. Use the environment variables GitHub provides to construct file paths for the `home`, `workspace`, and `workflow` directories.

| Directory             | Environment variable | Description                                                                                                                                                     |
| --------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home`                | `HOME`               | Contains user-related data. For example, this directory could contain credentials from a login attempt.                                                         |
| `workspace`           | `GITHUB_WORKSPACE`   | Actions and shell commands execute in this directory. An action can modify the contents of this directory, which subsequent actions can access.                 |
| `workflow/event.json` | `GITHUB_EVENT_PATH`  | The `POST` payload of the webhook event that triggered the workflow. GitHub rewrites this each time an action executes to isolate file content between actions. |

For a list of the environment variables GitHub creates for each workflow, see [Store information in variables](/en/actions/learn-github-actions/variables#default-environment-variables).

### Docker container filesystem

Actions that run in Docker containers have static directories under the `/github` path. However, we strongly recommend using the default environment variables to construct file paths in Docker containers.

GitHub reserves the `/github` path prefix and creates three directories for actions.

* `/github/home`
* `/github/workspace` - **Note:** GitHub Actions must be run by the default Docker user (root). Ensure your Dockerfile does not set the `USER` instruction, otherwise you will not be able to access `GITHUB_WORKSPACE`.
* `/github/workflow`
---

# Larger runners reference

Find information about larger runners, including their specifications and customization options.

## Machine sizes for larger runners

You can choose from several specifications for larger runners.

### Specifications for general larger runners

| CPU | Memory (RAM) | Storage (SSD) | Architecture | Operating system (OS) |
| --- | ------------ | ------------- | ------------ | --------------------- |
| 5   | 14 GB        | 14 GB         | arm64 (M2)   | macOS                 |
| 12  | 30 GB        | 14 GB         | x64 (Intel)  | macOS                 |
| 2   | 8 GB         | 75 GB         | x64, arm64   | Ubuntu                |
| 4   | 16 GB        | 150 GB        | x64, arm64   | Ubuntu, Windows       |
| 8   | 32 GB        | 300 GB        | x64, arm64   | Ubuntu, Windows       |
| 16  | 64 GB        | 600 GB        | x64, arm64   | Ubuntu, Windows       |
| 32  | 128 GB       | 1200 GB       | x64, arm64   | Ubuntu, Windows       |
| 64  | 208 GB       | 2040 GB       | arm64        | Ubuntu, Windows       |
| 64  | 256 GB       | 2040 GB       | x64          | Ubuntu, Windows       |
| 96  | 384 GB       | 2040 GB       | x64          | Ubuntu, Windows       |

> \[!NOTE] The 4-vCPU Windows runner only works with the Windows Server 2025 or the Base Windows 11 Desktop image.

> \[!NOTE] The 5-vCPU macOS runner is in public preview and subject to change.

### Specifications for GPU larger runners

| CPU | GPU | GPU card | Memory (RAM) | GPU memory (VRAM) | Storage (SSD) | Operating system (OS) |
| --- | --- | -------- | ------------ | ----------------- | ------------- | --------------------- |
| 4   | 1   | Tesla T4 | 28 GB        | 16 GB             | 176 GB        | Ubuntu, Windows       |

## Runner images

Larger runners run on virtual machines (VMs), and GitHub installs a virtual hard disk (VHD) on this machine during the VM creation process. You can choose from different VM images to install on your runners.

**GitHub-owned images:** These images are maintained by GitHub and are available for Linux x64, Windows x64, and macOS (x64 and arm) runners. For more information on these images and a full list of included tools for each runner operating system, see the [GitHub Actions Runner Images](https://github.com/actions/runner-images) repository.

**Partner Images:** Partner images are not managed by GitHub and are pulled from the Azure Marketplace. See below for resources on where to find more information and to report issues for partner images.

* [Base Windows 11 desktop image](https://azuremarketplace.microsoft.com/en-us/marketplace/apps/microsoftwindowsdesktop.windows-11?tab=Overview).
* [NVIDIA GPU-Optimized VMI](https://azuremarketplace.microsoft.com/en-us/marketplace/apps/nvidia.ngc_azure_17_11)
* [Data Science Virtual Machine - Windows 2019](https://azuremarketplace.microsoft.com/en-us/marketplace/apps/microsoft-dsvm.dsvm-win-2019?tab=overview).
* arm64 images: [`actions/partner-runner-images` repository](https://github.com/actions/partner-runner-images).

## Available macOS larger runners and labels

The following machines are available for macOS larger runners.

| Runner Size | Architecture | Processor (CPU)                   | Memory (RAM) | Storage (SSD) | Workflow label                                                                                                                      |
| ----------- | ------------ | --------------------------------- | ------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Large       | Intel        | 12                                | 30 GB        | 14 GB         | <code>macos-latest-large</code>, <code>macos-14-large</code>, <code>macos-15-large</code> (latest), <code>macos-26-large</code>     |
| XLarge      | arm64 (M2)   | 5 (+ 8 GPU hardware acceleration) | 14 GB        | 14 GB         | <code>macos-latest-xlarge</code>, <code>macos-14-xlarge</code>, <code>macos-15-xlarge</code> (latest), <code>macos-26-xlarge</code> |

## Limitations for macOS larger runners

* All actions provided by GitHub are compatible with arm64 GitHub-hosted runners. However, community actions may not be compatible with arm64 and need to be manually installed at runtime.
* Nested-virtualization is not supported due to the limitation of Apple's Virtualization Framework.
* Networking capabilities such as Azure private networking and assigning static IPs are not currently available for macOS larger runners.
* The arm64 macOS runners do not have a static UUID/UDID assigned to them because Apple does not support this feature. However, Intel MacOS runners are assigned a static UDID, specifically `4203018E-580F-C1B5-9525-B745CECA79EB`. If you are building and signing on the same host you plan to test the build on, you can sign with a [development provisioning profile](https://developer.apple.com/help/account/provisioning-profiles/create-a-development-provisioning-profile/). If you do require a static UDID, you can use Intel runners and add their UDID to your Apple Developer account.

## Networking for larger runners

By default, larger runners receive a dynamic IP address that changes for each job run. Optionally, GitHub Enterprise Cloud customers can configure their larger runners to receive static IP addresses from GitHub's IP address pool. For more information, see [About GitHub's IP addresses](/en/authentication/keeping-your-account-and-data-secure/about-githubs-ip-addresses).

When enabled, instances of the larger runner will receive IP addresses from specific ranges that are unique to the runner, allowing you to use the ranges to configure a firewall allowlist. You can use up to 10 larger runners with static IP address ranges in total across all your larger runners. For more information, see [Managing larger runners](/en/actions/using-github-hosted-runners/managing-larger-runners#networking-for-larger-runners).

If you would like to use more than 10 larger runners with static IP address ranges, please contact us through the [GitHub Support portal](https://support.github.com).

> \[!NOTE]
> If runners are unused for more than 90 days, their IP address ranges are automatically removed and cannot be recovered.
---

# Self-hosted runners reference

Find information about setting up and using self-hosted runners.

## Requirements for self-hosted runner machines

You can use a machine as a self-hosted runner as long as it meets these requirements:

* You can install and run the self-hosted runner application on the machine. See [Supported operating systems](#supported-operating-systems) and [Supported processor architectures](#supported-processor-architectures).
* The machine can communicate with GitHub Actions.
* The machine has enough hardware resources for the type of workflows you plan to run. The self-hosted runner application itself only requires minimal resources.
* If you want to run workflows that use Docker container actions or service containers, you must use a Linux machine and Docker must be installed.

### Supported operating systems

#### Linux

* Red Hat Enterprise Linux 8 or later
* CentOS 8 or later
* Oracle Linux 8 or later
* Fedora 29 or later
* Debian 10 or later
* Ubuntu 20.04 or later
* Linux Mint 20 or later
* openSUSE 15.2 or later
* SUSE Enterprise Linux (SLES) 15 SP2 or later

#### Windows

* Windows 10 64-bit
* Windows 11 64-bit
* Windows Server 2016 64-bit
* Windows Server 2019 64-bit
* Windows Server 2022 64-bit

#### macOS

* macOS 11.0 (Big Sur) or later

### Supported processor architectures

* `x64` - Linux, macOS, Windows.
* `ARM64` - Linux, macOS, Windows (currently in public preview).
* `ARM32` - Linux.

## Routing precedence for self-hosted runners

When routing a job to a self-hosted runner, GitHub looks for a runner that matches the job's `runs-on` labels and groups:

* If GitHub finds an online and idle runner that matches the job's `runs-on` labels and groups, the job is then assigned and sent to the runner.
  * If the runner doesn't pick up the assigned job within 60 seconds, the job is re-queued so that a new runner can accept it.
* If GitHub doesn't find an online and idle runner that matches the job's `runs-on` labels and groups, then the job will remain queued until a runner comes online.
* If the job remains queued for more than 24 hours, the job will fail.

## Autoscaling

Autoscaling allows you to dynamically adjust the number of self-hosted runners based on demand. This helps optimize resource utilization and ensures sufficient runner capacity during peak times while reducing costs during periods of low activity. There are multiple approaches to implementing autoscaling for self-hosted runners, each with different trade-offs in terms of complexity, reliability, and responsiveness.

### Actions Runner Controller

GitHub-hosted runners inherently autoscale based on your needs. GitHub-hosted runners can be a low-maintenance and cost-effective alternative to developing or implementing autoscaling solutions. For more information, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners/about-github-hosted-runners).

Actions Runner Controller (ARC) is the reference implementation of GitHub's scale set APIs and the recommended Kubernetes-based solution for autoscaling self-hosted runners. ARC provides a complete, production-ready autoscaling solution for teams running GitHub Actions in Kubernetes environments.

GitHub recommends ARC for organizations with Kubernetes infrastructure and teams that have Kubernetes expertise. ARC handles the full lifecycle of runners within your cluster, from provisioning to job execution to cleanup.

For more information, see [Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/about-actions-runner-controller) and [Support for Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/about-support-for-actions-runner-controller).

### GitHub Actions Runner Scale Set Client

The GitHub Actions Runner Scale Set Client is a standalone Go-based module that empowers platform teams, integrators, and infrastructure providers to build custom autoscaling solutions for GitHub Actions runners across VMs, containers, on-premise infrastructure, and cloud services, with support for Windows, Linux, and macOS platforms.

The client orchestrates GitHub API interactions for scale sets while leaving infrastructure provisioning to you. You define how runners are created, scaled, and destroyed, and configure runners with multiple labels for flexible job routing and targeting. This gives organizations granular control over runner lifecycle management and real-time telemetry for job execution.

The client is designed to work out of the box with basic configurations, allowing teams to quickly implement autoscaling. However, its true power lies in its flexibility—the client is built to be extended and customized to meet each organization's specific infrastructure requirements, compliance constraints, and operational workflows. Whether you need simple scaling logic or complex, multi-environment provisioning strategies, the client adapts to your needs.

The GitHub Actions Runner Scale Set Client is an open source project. The [actions/scaleset repository](https://github.com/actions/scaleset) contains the complete source code, comprehensive documentation, and practical examples to help you get started. You'll find implementation guides, sample configurations for various infrastructure scenarios, and reference architectures demonstrating how to integrate the client with different provisioning systems. The repository also includes contributing guidelines for teams interested in extending the client or sharing their autoscaling patterns with the community.

> **Note:** The Runner Scale Set Client is not a replacement for Actions Runner Controller (ARC), which remains the reference implementation of the scale set APIs and the recommended Kubernetes solution for autoscaling runners. Instead, the client is a complementary tool for interfacing with the same scale set APIs to build custom autoscaling solutions outside of Kubernetes.

### Ephemeral runners for autoscaling

GitHub recommends implementing autoscaling with ephemeral self-hosted runners; autoscaling with persistent self-hosted runners is not recommended. In certain cases, GitHub cannot guarantee that jobs are not assigned to persistent runners while they are shut down. With ephemeral runners, this can be guaranteed because GitHub only assigns one job to a runner.

This approach allows you to manage your runners as ephemeral systems, since you can use automation to provide a clean environment for each job. This helps limit the exposure of any sensitive resources from previous jobs, and also helps mitigate the risk of a compromised runner receiving new jobs.

> \[!WARNING]The runner application log files for ephemeral runners must be forwarded to an external log storage solution for troubleshooting and diagnostic purposes. While it is not required for ephemeral runners to be deployed, GitHub recommends ensuring runner logs are forwarded and preserved externally before deploying an ephemeral runner autoscaling solution in a production environment. For more information, see [Monitoring and troubleshooting self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/monitoring-and-troubleshooting-self-hosted-runners#reviewing-the-self-hosted-runner-application-log-files).

To add an ephemeral runner to your environment, include the `--ephemeral` parameter when registering your runner using `config.sh`. For example:

```shell
./config.sh --url https://github.com/octo-org --token example-token --ephemeral
```

The GitHub Actions service will then automatically de-register the runner after it has processed one job. You can then create your own automation that wipes the runner after it has been de-registered.

> \[!NOTE]
> If a job is labeled for a certain type of runner, but none matching that type are available, the job does not immediately fail at the time of queueing. Instead, the job will remain queued until the 24 hour timeout period expires.

Alternatively, you can create ephemeral, just-in-time runners using the REST API. For more information, see [REST API endpoints for self-hosted runners](/en/rest/actions/self-hosted-runners).

### Runner software updates on self-hosted runners

By default, self-hosted runners will automatically perform a software update whenever a new version of the runner software is available. If you use ephemeral runners in containers then this can lead to repeated software updates when a new runner version is released. Turning off automatic updates allows you to update the runner version on the container image directly on your own schedule.

To turn off automatic software updates and install software updates yourself, specify the `--disableupdate` flag when registering your runner using `config.sh`. For example:

```shell
./config.sh --url https://github.com/YOUR-ORGANIZATION --token EXAMPLE-TOKEN --disableupdate
```

If you disable automatic updates, you must still update your runner version regularly. New functionality in GitHub Actions requires changes in both the GitHub Actions service *and* the runner software. The runner may not be able to correctly process jobs that take advantage of new features in GitHub Actions without a software update.

If you disable automatic updates, you will be required to update your runner version within 30 days of a new version being made available. You may want to subscribe to notifications for releases in the [`actions/runner` repository](https://github.com/actions/runner/releases). For more information, see [Configuring notifications](/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/configuring-notifications#about-custom-notifications).

For instructions on how to install the latest runner version, see the installation instructions for [the latest release](https://github.com/actions/runner/releases).

> \[!WARNING] Any updates released for the software, including major, minor, or patch releases, are considered as an available update. If you do not perform a software update within 30 days, the GitHub Actions service will not queue jobs to your runner. In addition, if a critical security update is required, the GitHub Actions service will not queue jobs to your runner until it has been updated.

### Webhooks for autoscaling

You can create your own autoscaling environment by using payloads received from the [`workflow_job`](/en/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_job) webhook. This webhook is available at the repository, organization, and enterprise levels, and the payload for this event contains an `action` key that corresponds to the stages of a workflow job's life-cycle; for example when jobs are `queued`, `in_progress`, and `completed`. You must then create your own scaling automation in response to these webhook payloads.

* For more information about the `workflow_job` webhook, see [Webhook events and payloads](/en/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_job).
* To learn how to work with webhooks, see [Webhooks documentation](/en/webhooks).

> **Note:** This approach relies on the timeliness of webhook delivery for making scaling decisions, which can introduce delays and reliability concerns. Consider using Actions Controller or the Scale Set Client for larger volume autoscaling scenarios.

### Authentication requirements

You can register and delete repository and organization self-hosted runners using [the API](/en/rest/actions/self-hosted-runners). To authenticate to the API, your autoscaling implementation can use an access token or a GitHub app.

Your access token will require the following scope:

* For private repositories, use an access token with the [`repo` scope](/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps#available-scopes).
* For public repositories, use an access token with the [`public_repo` scope](/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps#available-scopes).
* For organizations, use an access token with the [`admin:org` scope](/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps#available-scopes).

To authenticate using a GitHub App, it must be assigned the following permissions:

* For repositories, assign the `administration` permission.
* For organizations, assign the `organization_self_hosted_runners` permission.

You can register and delete enterprise self-hosted runners using [the API](/en/rest/actions/self-hosted-runners). To authenticate to the API, your autoscaling implementation can use an access token.

Your access token will require the `manage_runners:enterprise` scope.

## Communication

Self-hosted runners connect to GitHub to receive job assignments and download new versions of the runner application.

The GitHub Actions runner application is open source. You can contribute and file issues in the [runner](https://github.com/actions/runner) repository.  When a new version is released, the runner application automatically updates itself when a job is assigned to the runner, or within a week of release if the runner hasn't been assigned any jobs.

### Requirements for communication with GitHub

* The self-hosted runner application must be running on the host machine to accept and run GitHub Actions jobs.
* The host machine must have appropriate network access with at least 70 kilobits per second upload and download speed.
* The host machine must be able to make outbound HTTPS connections over port 443.
* Depending on the function of the workflows assigned to your self-hosted runner, the host machine must be able to communicate with the GitHub domains listed below.

### Accessible domains by function

> \[!NOTE]
> Some of the domains listed are configured using `CNAME` records. Some firewalls might require you to add rules recursively for all `CNAME` records. Note that the `CNAME` records might change in the future, and that only the domains listed will remain constant.

**Needed for essential operations:**

```shell copy
github.com
api.github.com
*.actions.githubusercontent.com
```

**Needed for downloading actions:**

```shell copy
codeload.github.com
```

**Needed for uploading/downloading job summaries, logs, workflow artifacts, and caches:**

```shell copy
results-receiver.actions.githubusercontent.com
*.blob.core.windows.net
```

**Needed for runner version updates:**

```shell copy
objects.githubusercontent.com
objects-origin.githubusercontent.com
github-releases.githubusercontent.com
github-registry-files.githubusercontent.com
```

**Needed for retrieving OIDC tokens:**

```shell copy
*.actions.githubusercontent.com
```

**Needed for downloading or publishing packages or containers to GitHub Packages:**

```shell copy
*.pkg.github.com
pkg-containers.githubusercontent.com
ghcr.io
```

**Needed for Git Large File Storage**

```shell copy
github-cloud.githubusercontent.com
github-cloud.s3.amazonaws.com
```

**Needed for jobs for Dependabot updates**

```shell copy
dependabot-actions.githubapp.com
```

**Needed for downloading release assets:**

```shell copy
release-assets.githubusercontent.com
```

**Needed for VNet:**

```shell copy
api.snapcraft.io
```

In addition, your workflow may require access to other network resources.

If you use an IP address allow list for your GitHub organization or enterprise account, you must add your self-hosted runner's IP address to the allow list. See [Managing allowed IP addresses for your organization](/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-allowed-ip-addresses-for-your-organization#using-github-actions-with-an-ip-allow-list) or [Enforcing policies for security settings in your enterprise](/en/enterprise-cloud@latest/admin/policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-security-settings-in-your-enterprise) in the GitHub Enterprise Cloud documentation.