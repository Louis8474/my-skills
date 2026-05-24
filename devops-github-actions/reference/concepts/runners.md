# Runners

---

# Actions Runner Controller

You can host your own runners and customize the environment used to run jobs in your GitHub Actions workflows.

## About Actions Runner Controller

Actions Runner Controller (ARC) is a Kubernetes operator that orchestrates and scales self-hosted runners for GitHub Actions. For more information, see [Operator pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) in the Kubernetes documentation.

With ARC, you can create runner scale sets that automatically scale based on the number of workflows running in your repository, organization, or enterprise. Because controlled runners can be ephemeral and based on containers, new runner instances can scale up or down rapidly and cleanly. For more information about autoscaling, see [Self-hosted runners reference](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/autoscaling-with-self-hosted-runners).

The following diagram illustrates the architecture of ARC's autoscaling runner scale set mode.

> \[!NOTE]
> To view the following diagram in a larger size, see the [Autoscaling Runner Scale Sets mode](https://github.com/actions/actions-runner-controller/blob/master/docs/gha-runner-scale-set-controller/README.md#how-it-works) documentation in the Actions Runner Controller repository.

![Diagram showing ARC's autoscaling runner ScaleSet mode.](/assets/images/help/actions/arc-diagram.png)

<!-- The numbers in the ordered list below correspond to numbers in the above diagram, which is why we use explicit numbering here. -->

1. Actions Runner Controller is installed using the supplied Helm charts, and the controller manager pod is deployed in the specified namespace. A new AutoScalingRunnerSet resource is deployed via the supplied Helm charts or a customized manifest file. The AutoScalingRunnerSet Controller calls the GitHub's API to fetch the runner group ID that the runner scale set will belong to.
2. The AutoScalingRunnerSet Controller calls the API one more time to either fetch or create a runner scale set in the GitHub Actions service before creating the Runner ScaleSet Listener resource.
3. A Runner ScaleSet Listener pod is deployed by the AutoScalingListener Controller. In this pod, the listener application connects to the GitHub Actions Service to authenticate and establish an HTTPS long poll connection. The listener stays idle until it receives a `Job Available` message from the GitHub Actions Service.
4. When a workflow run is triggered from a repository, the GitHub Actions Service dispatches individual job runs to the runners or runner scale sets where the `runs-on` key matches the name of a runner scale set or the labels of a runner scale set or self-hosted runner.
5. When the Runner ScaleSet Listener receives the `Job Available` message, it checks whether it can scale up to the desired count. If it can, the Runner ScaleSet Listener acknowledges the message.
6. The Runner ScaleSet Listener uses a Service Account and a Role bound to that account to make an HTTPS call through the Kubernetes APIs to patch the Ephemeral RunnerSet resource with the number of desired replicas count.
7. The Ephemeral RunnerSet attempts to create new runners and the EphemeralRunner Controller requests a Just-in-Time (JIT) configuration token to register these runners. The controller attempts to create runner pods. If the pod's status is `failed`, the controller retries up to 5 times. After 24 hours the GitHub Actions Service unassigns the job if no runner accepts it.
8. Once the runner pod is created, the runner application in the pod uses the JIT configuration token to register itself with the GitHub Actions Service. It then establishes another HTTPS long poll connection to receive the job details it needs to execute.
9. The GitHub Actions Service acknowledges the runner registration and dispatches the job run details.
10. Throughout the job run execution, the runner continuously communicates the logs and job run status back to the GitHub Actions Service.
11. When the runner completes its job successfully, the EphemeralRunner Controller checks with the GitHub Actions Service to see if runner can be deleted. If it can, the Ephemeral RunnerSet deletes the runner.

## Actions Runner Controller components

ARC consists of a set of resources, some of which are created specifically for ARC. An ARC deployment applies these resources onto a Kubernetes cluster. Once applied, it creates a set of Pods that contain your self-hosted runners' containers. With ARC, GitHub can treat these runner containers as self-hosted runners and allocate jobs to them as needed.

Each resource that is deployed by ARC is given a name composed of:

* An installation name, which is the installation name you specify when you install the Helm chart.
* A resource identification suffix, which is a string that identifies the resource type. This value is not configurable.

> \[!NOTE]
> Different versions of Kubernetes have different length limits for names of resources. The length limit for the resource name is calculated by adding the length of the installation name and the length of the resource identification suffix. If the resource name is longer than the reserved length, you will receive an error.

### Resources deployed by `gha-runner-scale-set-controller`

| Template                                                | Resource Kind      | Name                                                        | Reserved Length | Description                                                                 | Notes                                                                                                                                                           |
| ------------------------------------------------------- | ------------------ | ----------------------------------------------------------- | --------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deployment.yaml`                                       | Deployment         | INSTALLATION\_NAME-gha-rs-controller                        | 18              | The resource running controller-manager                                     | The pods created by this resource have the ReplicaSet suffix and the Pod suffix.                                                                                |
| `serviceaccount.yaml`                                   | ServiceAccount     | INSTALLATION\_NAME-gha-rs-controller                        | 18              | This is created if `serviceAccount.create` in `values.yaml` is set to true. | The name can be customized in `values.yaml`                                                                                                                     |
| `manager_cluster_role.yaml`                             | ClusterRole        | INSTALLATION\_NAME-gha-rs-controller                        | 18              | ClusterRole for the controller manager                                      | This is created if the value of `flags.watchSingleNamespace` is empty.                                                                                          |
| `manager_cluster_role_binding.yaml`                     | ClusterRoleBinding | INSTALLATION\_NAME-gha-rs-controller                        | 18              | ClusterRoleBinding for the controller manager                               | This is created if the value of `flags.watchSingleNamespace` is empty.                                                                                          |
| `manager_single_namespace_controller_role.yaml`         | Role               | INSTALLATION\_NAME-gha-rs-controller-single-namespace       | 35              | Role for the controller manager                                             | This is created if the value of `flags.watchSingleNamespace` is set.                                                                                            |
| `manager_single_namespace_controller_role_binding.yaml` | RoleBinding        | INSTALLATION\_NAME-gha-rs-controller-single-namespace       | 35              | RoleBinding for the controller manager                                      | This is created if the value of `flags.watchSingleNamespace` is set.                                                                                            |
| `manager_single_namespace_watch_role.yaml`              | Role               | INSTALLATION\_NAME-gha-rs-controller-single-namespace-watch | 41              | Role for the controller manager for the namespace configured                | This is created if the value of `flags.watchSingleNamespace` is set.                                                                                            |
| `manager_single_namespace_watch_role_binding.yaml`      | RoleBinding        | INSTALLATION\_NAME-gha-rs-controller-single-namespace-watch | 41              | RoleBinding for the controller manager for the namespace configured         | This is created if the value of `flags.watchSingleNamespace` is set.                                                                                            |
| `manager_listener_role.yaml`                            | Role               | INSTALLATION\_NAME-gha-rs-controller-listener               | 26              | Role for the listener                                                       | This is always created.                                                                                                                                         |
| `manager_listener_role_binding.yaml `                   | RoleBinding        | INSTALLATION\_NAME-gha-rs-controller-listener               | 26              | RoleBinding for the listener                                                | This is always created and binds the listener role with the service account, which is either created by `serviceaccount.yaml` or configured with `values.yaml`. |

### Resources deployed by `gha-runner-scale-set`

| Template                             | Resource Kind        | Name                                    | Reserved Length | Description                                                                                                 | Notes                                                                                                              |
| ------------------------------------ | -------------------- | --------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `autoscalingrunnerset.yaml`          | AutoscalingRunnerSet | INSTALLATION\_NAME                      | 0               | Top level resource working with scale sets                                                                  | The name is limited to 45 characters in length.                                                                    |
| `no_permission_service_account.yaml` | ServiceAccount       | INSTALLATION\_NAME-gha-rs-no-permission | 21              | Service account mounted to the runner container                                                             | This is created if the container mode is not "kubernetes" and `template.spec.serviceAccountName` is not specified. |
| `githubsecret.yaml`                  | Secret               | INSTALLATION\_NAME-gha-rs-github-secret | 20              | Secret containing values needed to authenticate to the GitHub API                                           | This is created if `githubConfigSecret` is an object. If a string is provided, this secret will not be created.    |
| `manager_role.yaml`                  | Role                 | INSTALLATION\_NAME-gha-rs-manager       | 15              | Role provided to the manager to be able to reconcile on resources in the autoscaling runner set's namespace | This is always created.                                                                                            |
| `manager_role_binding.yaml`          | RoleBinding          | INSTALLATION\_NAME-gha-rs-manager       | 15              | Binding manager\_role to the manager service account.                                                       | This is always created.                                                                                            |
| `kube_mode_role.yaml`                | Role                 | INSTALLATION\_NAME-gha-rs-kube-mode     | 17              | Role providing necessary permissions for the hook                                                           | This is created when the container mode is set to "kubernetes" and `template.spec.serviceAccount` is not provided. |
| `kube_mode_serviceaccount.yaml`      | ServiceAccount       | INSTALLATION\_NAME-gha-rs-kube-mode     | 17              | Service account bound to the runner pod.                                                                    | This is created when the container mode is set to "kubernetes" and `template.spec.serviceAccount` is not provided. |

### About custom resources

ARC consists of several custom resource definitions (CRDs). For more information on custom resources, see [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) in the Kubernetes documentation. You can find the list of custom resource definitions used for ARC in the following API schema definitions.

* [actions.github.com/v1alpha1](https://pkg.go.dev/github.com/actions/actions-runner-controller/apis/actions.github.com/v1alpha1)
* [actions.summerwind.net/v1alpha1](https://pkg.go.dev/github.com/actions/actions-runner-controller/apis/actions.summerwind.net/v1alpha1)

Because custom resources are extensions of the Kubernetes API, they won't be available in a default Kubernetes installation. You will need to install these custom resources to use ARC. For more information on installing custom resources, see [Get started with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/quickstart-for-actions-runner-controller).

Once the custom resources are installed, you can deploy ARC into your Kubernetes cluster. For information about deploying ARC, see [Deploying runner scale sets with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller).

### About the runner container image

GitHub maintains a [minimal runner container image](https://github.com/actions/runner/pkgs/container/actions-runner). A new image will be published with every runner binaries release. The most recent image will have the runner binaries version and `latest` as tags.

This image contains the least amount of packages necessary for the container runtime and the runner binaries. To install additional software, you can create your own runner image. You can use ARC's runner image as a base, or use the corresponding setup actions. For instance, `actions/setup-java` for Java or `actions/setup-node` for Node.

You can find the definition of ARC's runner image in [this Dockerfile](https://github.com/actions/runner/blob/main/images/Dockerfile). To view the current base image, check the `FROM` line in the runner image Dockerfile, then search for that tag in the [`dotnet/dotnet-docker`](https://github.com/dotnet/dotnet-docker/tree/main/src/runtime-deps) repository.

For example, if the `FROM` line in the runner image Dockerfile is `mcr.microsoft.com/dotnet/runtime-deps:8.0-jammy AS build`, then you can find the base image in [`https://github.com/dotnet/dotnet-docker/blob/main/src/runtime-deps/8.0/jammy/amd64/Dockerfile`](https://github.com/dotnet/dotnet-docker/blob/main/src/runtime-deps/8.0/jammy/amd64/Dockerfile).

#### Creating your own runner image

You can create your own runner image that meets your requirements. Your runner image must fulfill the following conditions.

* Use a base image that can run the self-hosted runner application. See [Managing self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners).

* The [runner binary](https://github.com/actions/runner/releases) must be placed under `/home/runner/` and launched using `/home/runner/run.sh`.

* If you use Kubernetes mode, the [runner container hooks](https://github.com/actions/runner-container-hooks/releases) must be placed under `/home/runner/k8s`.

You can use the following example Dockerfile to start creating your own runner image.

```dockerfile copy
FROM mcr.microsoft.com/dotnet/runtime-deps:6.0 as build

# Replace value with the latest runner release version
# source: https://github.com/actions/runner/releases
# ex: 2.303.0
ARG RUNNER_VERSION=""
ARG RUNNER_ARCH="x64"
# Replace value with the latest runner-container-hooks release version
# source: https://github.com/actions/runner-container-hooks/releases
# ex: 0.3.1
ARG RUNNER_CONTAINER_HOOKS_VERSION=""

ENV DEBIAN_FRONTEND=noninteractive
ENV RUNNER_MANUALLY_TRAP_SIG=1
ENV ACTIONS_RUNNER_PRINT_LOG_TO_STDOUT=1

RUN apt update -y && apt install curl unzip -y

RUN adduser --disabled-password --gecos "" --uid 1001 runner \
    && groupadd docker --gid 123 \
    && usermod -aG sudo runner \
    && usermod -aG docker runner \
    && echo "%sudo ALL=(ALL:ALL) NOPASSWD:ALL" > /etc/sudoers \
    && echo "Defaults env_keep += \"DEBIAN_FRONTEND\"" >> /etc/sudoers

WORKDIR /home/runner

RUN curl -f -L -o runner.tar.gz https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz \
    && tar xzf ./runner.tar.gz \
    && rm runner.tar.gz

RUN curl -f -L -o runner-container-hooks.zip https://github.com/actions/runner-container-hooks/releases/download/v${RUNNER_CONTAINER_HOOKS_VERSION}/actions-runner-hooks-k8s-${RUNNER_CONTAINER_HOOKS_VERSION}.zip \
    && unzip ./runner-container-hooks.zip -d ./k8s \
    && rm runner-container-hooks.zip

USER runner
```

## Software installed in the ARC runner image

The ARC [runner image](https://github.com/actions/runner/pkgs/container/actions-runner) is bundled with the following software:

* [Runner binaries](https://github.com/actions/runner)
* [Runner container hooks](https://github.com/actions/runner-container-hooks)
* Docker (required for Docker-in-Docker mode)

For more information, see [ARC's runner image Dockerfile](https://github.com/actions/runner/blob/main/images/Dockerfile) in the Actions repository.

## Assets and releases

ARC is released as two Helm charts and one container image. The Helm charts are only published as Open Container Initiative (OCI) packages. ARC does not provide tarballs or Helm repositories via GitHub Pages.

You can find the latest releases of ARC's Helm charts and container image on GitHub Packages:

* [`gha-runner-scale-set-controller` Helm chart](https://github.com/actions/actions-runner-controller/pkgs/container/actions-runner-controller-charts%2Fgha-runner-scale-set-controller)
* [`gha-runner-scale-set` Helm chart](https://github.com/actions/actions-runner-controller/pkgs/container/actions-runner-controller-charts%2Fgha-runner-scale-set)
* [`gha-runner-scale-set-controller` container image](https://github.com/actions/actions-runner-controller/pkgs/container/gha-runner-scale-set-controller)

The supported runner image is released as a separate container image, which you can find at [`actions-runner`](https://github.com/actions/runner/pkgs/container/actions-runner) on GitHub Packages.

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

## Next steps

If you're new to ARC, see [Get started with Actions Runner Controller](/en/actions/tutorials/use-actions-runner-controller/get-started) to try out the basics.

When you're ready to use ARC to execute workflows, see [Using Actions Runner Controller runners in a workflow](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/using-actions-runner-controller-runners-in-a-workflow).

You can use the installation name of the runner scale set, or define the value of the `runnerScaleSetName` field in your [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) file, as your `runs-on` target. You can also assign multiple labels to a scale set to enable more flexible job routing. To configure labels for a runner scale set, set the `runnerScaleSetLabels` value in your `values.yaml` file. See [Using self-hosted runners in a workflow](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/using-self-hosted-runners-in-a-workflow).

You can scale runners statically or dynamically depending on your needs. See [Deploying runner scale sets with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller#scaling-runners).
---

# GitHub-hosted runners

GitHub offers hosted virtual machines to run workflows. The virtual machine contains an environment of tools, packages, and settings available for GitHub Actions to use.

## Overview of GitHub-hosted runners

Runners are the machines that execute jobs in a GitHub Actions workflow. For example, a runner can clone your repository locally, install testing software, and then run commands that evaluate your code.

GitHub provides runners that you can use to run your jobs, or you can [host your own runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners). With the exception of single-CPU runners, each GitHub-hosted runner is a new virtual machine (VM) hosted by GitHub. Single-CPU runners are hosted in a container on a shared VM—see [GitHub-hosted runners reference](/en/actions/reference/runners/github-hosted-runners#single-cpu-runners).

Each runner comes with the runner application and other tools preinstalled. GitHub-hosted runners are available with Ubuntu Linux, Windows, or macOS operating systems. When you use a GitHub-hosted runner, machine maintenance and upgrades are taken care of for you.

You can choose one of the standard GitHub-hosted runner options or, if you are on the GitHub Team or GitHub Enterprise Cloud plan, you can provision a runner with more cores, or a runner that's powered by a GPU processor. These machines are referred to as "larger runner." For more information, see [Larger runners](/en/enterprise-cloud@latest/actions/using-github-hosted-runners/about-larger-runners/about-larger-runners).

Larger runners also support custom images, which let you create and manage your own preconfigured VM images. For more information, see [Custom images](#custom-images).

Using GitHub-hosted runners requires network access with at least 70 kilobits per second upload and download speeds.

## Runner images

GitHub maintains our own set of VM images for our standard hosted runners. This includes the images for macOS, x64 linux and Windows images. The list of images and their included tools are managed in the [`actions/runner-images`](https://github.com/actions/runner-images) repository. Our arm64 images are partner images, and those are managed in the [`actions/partner-runner-images`](https://github.com/actions/partner-runner-images) repository.

### Preinstalled software for GitHub-owned images

The software tools included in our GitHub-owned images are updated weekly. The update process takes several days, and the list of preinstalled software on the `main` branch is updated after the whole deployment ends.

Workflow logs include a link to the preinstalled tools on the exact runner. To find this information in the workflow log, expand the `Set up job` section. Under that section, expand the `Runner Image` section. The link following `Included Software` will describe the preinstalled tools on the runner that ran the workflow.

For more information, see [Viewing workflow run history](/en/actions/monitoring-and-troubleshooting-workflows/viewing-workflow-run-history).

GitHub-hosted runners include the operating system's default built-in tools, in addition to the packages listed in the above references. For example, Ubuntu and macOS runners include `grep`, `find`, and `which`, among other default tools.

You can also view a software bill of materials (SBOM) for each build of the Windows and Ubuntu runner images. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#reviewing-the-supply-chain-for-github-hosted-runners).

We recommend using actions to interact with the software installed on runners. This approach has several benefits:

* Usually, actions provide more flexible functionality like version selection, ability to pass arguments, and parameters
* It ensures the tool versions used in your workflow will remain the same regardless of software updates

If there is a tool that you'd like to request, please open an issue at [actions/runner-images](https://github.com/actions/runner-images). This repository also contains announcements about all major software updates on runners.

> \[!NOTE]
>
> * You can also install additional software on GitHub-hosted runners. See [Customizing GitHub-hosted runners](/en/actions/using-github-hosted-runners/customizing-github-hosted-runners).
> * While nested virtualization is technically possible while using runners, it is not officially supported. Any use of nested VMs is experimental and done at your own risk, we offer no guarantees regarding stability, performance, or compatibility.

### Custom images

Custom images let you start with a GitHub-provided base image and build your own VM image that’s customized to your workflow needs. With custom images, you can:

* Build custom VM images using existing workflow YAML syntax.
* Pre-configure environments with approved tooling, security patches, and dependencies before workflows start.
* Create consistent, validated base environments across all builds.

Custom images can include repository code, container images, binaries, certificates, and other dependencies to create a consistent build environment across workflows. This helps you gain control over your supply chain. They help reduce setup time, improve build performance, and strengthen security by reducing the surface attack vector on your images. Administrators can also apply policies to manage image versions, retention, and age to meet organizational security and compliance requirements.

Custom images can only be used with larger runners. Jobs that use custom images are billed at the same per-minute rates as those runners. Storage for custom images is billed and metered through GitHub Actions storage. For more information, see [GitHub Actions billing](/en/billing/concepts/product-billing/github-actions#custom-image-storage).

To get started with custom images, see [Using custom images](/en/actions/how-tos/manage-runners/larger-runners/use-custom-images).

## Cloud hosts used by GitHub-hosted runners

GitHub hosts Linux and Windows runners on virtual machines in Microsoft Azure with the GitHub Actions runner application installed. The GitHub-hosted runner application is a fork of the Azure Pipelines Agent. Inbound ICMP packets are blocked for all Azure virtual machines, so ping or traceroute commands might not work. GitHub hosts macOS runners in Azure data centers.

## Workflow continuity

If GitHub Actions services are temporarily unavailable, then a workflow run is discarded if it has not been queued within 30 minutes of being triggered. For example, if a workflow is triggered and the GitHub Actions services are unavailable for 31 minutes or longer, then the workflow run will not be processed.

In addition, if the workflow run has been successfully queued, but has not been processed by a GitHub-hosted runner within 45 minutes, then the queued workflow run is discarded.

## The `etc/hosts` file

GitHub-hosted runners are provisioned with an `etc/hosts` file that blocks network access to various cryptocurrency mining pools and malicious sites. Hosts such as MiningMadness.com and cpu-pool.com are rerouted to localhost so that they do not present a significant security risk.
---

# Larger runners

Learn about the types and uses of GitHub-hosted larger runners.

## About larger runners

Customers on GitHub Team and GitHub Enterprise Cloud plans can choose from a range of managed virtual machines that have more resources than the [standard GitHub-hosted runners](/en/actions/how-tos/using-github-hosted-runners/using-github-hosted-runners/about-github-hosted-runners#supported-runners-and-hardware-resources). These machines are referred to as "larger runners." They offer the following advanced features:

* More RAM, CPU, and disk space
* Static IP addresses
* Azure private networking
* The ability to group runners
* Autoscaling to support concurrent workflows
* GPU-powered runners

These larger runners are hosted by GitHub and have the runner application and other tools preinstalled.

GitHub offers larger runners with macOS, Ubuntu, or Windows operating systems, and different features and sizes are available depending on which operating system you use.

## About larger runners for code scanning default setup

Consider configuring larger runners for code scanning default setup if:

* Your scans with standard GitHub-hosted runners are taking too long.
* Your scans with standard GitHub-hosted runners are returning memory or disk errors.
* You want to customize aspects of your code scanning runner, such as the runner size, runner image, and job concurrency, without using self-hosted runners.

For more information on configuring larger runners for code scanning default setup, see [Configuring larger runners for default setup](/en/code-security/how-tos/scan-code-for-vulnerabilities/manage-your-configuration/configuring-larger-runners-for-default-setup).

## About Ubuntu and Windows larger runners

Larger runners with Ubuntu or Windows operating systems are configured in your organization or enterprise. When you add a larger runner, you are defining a type of machine from a selection of available hardware specifications and operating system images.

With Ubuntu and Windows larger runners, you can:

* Assign runners static IP addresses from a specific range, allowing you to use this range to configure a firewall allowlist
* Control access to your resources by assigning runners to runner groups
* Use autoscaling to simplify runner management and control your costs
* Use your runners with Azure private networking

## About macOS larger runners

Larger runners with a macOS operating system are not manually added to your organization or enterprise, but are instead used by updating the `runs-on` key of a workflow file to one of the GitHub-defined macOS larger runner labels.

Since macOS larger runners are not preconfigured, they have limitations that Ubuntu and Windows larger runners do not. For more information, see [Larger runners reference](/en/actions/reference/larger-runners-reference#limitations-for-macos-larger-runners).

## Billing

> \[!NOTE]
> Larger runners are not eligible for the use of included minutes on private repositories. For both private and public repositories, when larger runners are in use, they will always be billed at the per-minute rate.

Compared to standard GitHub-hosted runners, larger runners are billed differently. Larger runners are only billed at the per-minute rate for the amount of time workflows are executed on them. There is no cost associated with creating a larger runner that is not being used by a workflow. For more information, see [Actions runner pricing](/en/billing/reference/actions-minute-multipliers).

## Next steps

To start using Windows or Ubuntu larger runners, see [Managing larger runners](/en/actions/how-tos/using-github-hosted-runners/using-larger-runners/managing-larger-runners).

To start using macOS larger runners, see [Running jobs on larger runners](/en/actions/how-tos/using-github-hosted-runners/using-larger-runners/running-jobs-on-larger-runners?platform=mac).

To find reference information about using larger runners, see [Larger runners reference](/en/actions/reference/larger-runners-reference).
---

# Private networking with GitHub-hosted runners

You can connect GitHub-hosted runners to resources on a private network, including package registries, secret managers, and other on-premises services.

## About GitHub-hosted runners networking

By default, GitHub-hosted runners have access to the public internet. However, you may also want these runners to access resources on your private network, such as a package registry, a secret manager, or other on-premise services.

GitHub-hosted runners are shared across all GitHub customers. However with private networking, you can configure hosted runners to be exclusively used to connect to your private network and resources while they are running your workflows.

There are a few different approaches you could take to configure this access, each with different advantages and disadvantages.

## Using an API Gateway with OIDC

With GitHub Actions, you can use OpenID Connect (OIDC) tokens to authenticate your workflow outside of GitHub Actions. For more information, see [Using an API gateway with OIDC](/en/actions/using-github-hosted-runners/connecting-to-a-private-network/using-an-api-gateway-with-oidc).

## Using WireGuard to create a network overlay

If you don't want to maintain separate infrastructure for an API Gateway, you can create an overlay network between your runner and a service in your private network, by running WireGuard in both places. For more information, see [Using WireGuard to create a network overlay](/en/actions/using-github-hosted-runners/connecting-to-a-private-network/using-wireguard-to-create-a-network-overlay).

## Using an Azure Virtual Network (VNET)

You can use GitHub-hosted runners in an Azure VNET. This enables you to use GitHub-managed infrastructure for CI/CD while providing you with full control over the networking policies of your runners. For more information about Azure VNET, see [What is Azure Virtual Network?](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview) in the Azure documentation.

Organization owners using the GitHub Team plan can configure Azure private networking for GitHub-hosted runners at the organization level. For more information, see [About Azure private networking for GitHub-hosted runners in your organization](/en/organizations/managing-organization-settings/about-azure-private-networking-for-github-hosted-runners-in-your-organization).
---

# Runner groups

Learn about what a runner group is, and how to use them to control access to runners at the organization level.

## About runner groups

To control access to runners at the organization level, organizations using the GitHub Team plan can use runner groups. Runner groups are used to collect sets of runners and create a security boundary around them.

When you grant access to a runner group, you can see the runner group listed in the organization's runner settings. Optionally, you can assign additional granular repository access policies to the runner group.

When new runners are created, they are automatically assigned to the default group unless otherwise specified. Runners can only be in one group at a time. You can move runners from one runner group to another.

## Next steps

To learn how to use runner groups to control access to larger runners, see [Controlling access to larger runners](/en/actions/how-tos/using-larger-runners/controlling-access-to-larger-runners).

For information on how to route jobs to runners in a specific group, see [Choosing the runner for a job](/en/actions/using-jobs/choosing-the-runner-for-a-job#choosing-runners-in-a-group).
---

# Runner scale sets

Learn about what a runner scale set is and how they can interact with the Actions Runner Controller.

## About runner scale sets

A runner scale set is a group of homogeneous runners that can be assigned jobs from GitHub Actions. The number of active runners owned by a runner scale set can be controlled by auto-scaling runner solutions such as Actions Runner Controller (ARC).

You can use runner groups to manage runner scale sets. Similar to self-hosted runners, you can add runner scale sets to existing runner groups. However, runner scale sets can belong to only one runner group at a time and can only have one label assigned to them.

To assign jobs to a runner scale set, you must configure your workflow to reference the runner scale set’s name. For more information, see [Using Actions Runner Controller runners in a workflow](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/using-actions-runner-controller-runners-in-a-workflow).

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

## Next steps

* For more information about the Actions Runner Controller as a concept, see [Actions Runner Controller](/en/actions/concepts/runners/about-actions-runner-controller).
* To learn about runner groups, see [Managing access to self-hosted runners using groups](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/managing-access-to-self-hosted-runners-using-groups).
---

# Self-hosted runners

You can host your own runners and customize the environment used to run jobs in your GitHub Actions workflows.

A self-hosted runner is a system that you deploy and manage to execute jobs from GitHub Actions on GitHub.

Self-hosted runners:

* Give you more control of hardware, operating system, and software tools than GitHub-hosted runners provide. Be aware that you are responsible for updating the operating system and all other software.
* Allow you to use machines and services that your company already maintains and pays to use.
* Are free to use with GitHub Actions, but you are responsible for the cost of maintaining your runner machines.
* Let you create custom hardware configurations that meet your needs with processing power or memory to run larger jobs, install software available on your local network.
* Receive automatic updates for the self-hosted runner application only, though you may disable automatic updates of the runner.
* Don't need to have a clean instance for every job execution.
* Can be physical, virtual, in a container, on-premises, or in a cloud.

You can use self-hosted runners anywhere in the management hierarchy. Repository-level runners are dedicated to a single repository, while organization-level runners can process jobs for multiple repositories in an organization. Organization owners can choose which repositories are allowed to create repository-level self-hosted runners. See [Disabling or limiting GitHub Actions for your organization](/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#limiting-the-use-of-self-hosted-runners). Finally, enterprise-level runners can be assigned to multiple organizations in an enterprise account.

## Next steps

To set up a self-hosted runner in your workspace, see [Adding self-hosted runners](/en/actions/how-tos/managing-self-hosted-runners/adding-self-hosted-runners).

To find information about the requirements and supported software and hardware for self-hosted runners, see [Self-hosted runners reference](/en/actions/reference/self-hosted-runners-reference).
---

# Support for Actions Runner Controller

What to know before you contact GitHub Support for assistance with Actions Runner Controller.

## Overview

The Actions Runner Controller (ARC) project [was adopted by GitHub](https://github.com/actions/actions-runner-controller/discussions/2072) to release as a new GitHub product. As a result, there are currently two ARC releases: the legacy community-maintained ARC and GitHub's Autoscaling Runner Sets.

GitHub only supports the latest Autoscaling Runner Sets version of ARC. Support for the legacy ARC is provided by the community in the [Actions Runner Controller](https://github.com/actions/actions-runner-controller) repository only.

## Scope of support for Actions Runner Controller

To ensure a smooth adoption of Actions Runner Controller, we recommend that organizations have a Kubernetes expert on staff. Many aspects of ARC installation, including container orchestration, networking, policy application, and integration with managed Kubernetes providers, fall outside GitHub Support’s scope and require in-depth Kubernetes knowledge. If your support request is outside of the scope of what our team can help you with, we may recommend next steps to resolve your issue outside of GitHub Support. Your support request is out of GitHub Support's scope if the request is primarily about:

* The legacy community-maintained version of ARC
* Installing, configuring, or maintaining dependencies
* Template spec customization
* Container orchestration, such as Kubernetes setup, networking, building images in ARC (DinD), etc.
* Applying Kubernetes policies
* Managed Kubernetes providers or provider-specific configurations
* [Runner Container Hooks](https://github.com/actions/runner-container-hooks) in conjunction with ARC's `kubernetes` mode
* Installation tooling other than Helm
* Storage provisioners and PersistentVolumeClaims (PVCs)
* Best practices, such as configuring metrics servers, image caching, etc.

While ARC may be deployed successfully with different tooling and configurations, your support request is possibly out of GitHub Support's scope if ARC has been deployed with:

* Installation tooling other than Helm
* Service account and/or template spec customization

For more information about contacting GitHub Support, see [Contacting GitHub Support](/en/support/contacting-github-support).

> \[!NOTE]
>
> * OpenShift clusters are in public preview. See guidance from [Red Hat](https://developers.redhat.com/articles/2025/02/17/how-securely-deploy-github-arc-openshift#arc_architecture) for configuration recommendations.
> * ARC is only supported on GitHub Enterprise Server versions 3.9 and greater.

## Working with GitHub Support for Actions Runner Controller

GitHub Support may ask questions about your Actions Runner Controller deployment and request that you collect and attach [controller logs, listener logs](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/troubleshooting-actions-runner-controller-errors#checking-the-logs-of-the-controller-and-runner-set-listener), runner logs, and Helm charts (`values.yaml`) to the support ticket.