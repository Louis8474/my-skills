# Use Actions Runner Controller

---

# Get started with Actions Runner Controller

In this tutorial, you'll try out the basics of Actions Runner Controller.

## Prerequisites

In order to use ARC, ensure you have the following.

* A Kubernetes cluster
  * For a managed cloud environment, you can use AKS. For more information, see [Azure Kubernetes Service](https://azure.microsoft.com/en-us/products/kubernetes-service) in the Azure documentation.
  * For a local setup, you can use minikube or kind. For more information, see [minikube start](https://minikube.sigs.k8s.io/docs/start/) in the minikube documentation and [kind](https://kind.sigs.k8s.io/) in the kind documentation.

* Helm 3
  * For more information, see [Installing Helm](https://helm.sh/docs/intro/install/) in the Helm documentation.

* While it is not required for ARC to be deployed, we recommend ensuring you have implemented a way to collect and retain logs from the controller, listeners, and ephemeral runners before deploying ARC in production workflows.

## Installing Actions Runner Controller

1. To install the operator and the custom resource definitions (CRDs) in your cluster, do the following.

   1. In your Helm chart, update the `NAMESPACE` value to the location you want your operator pods to be created. This namespace must allow access to the Kubernetes API server.
   2. Install the Helm chart.

   The following example installs the latest version of the chart. To install a specific version, you can pass the `--version` argument along with the version of the chart you wish to install. You can find the list of releases in the [GitHub Container Registry](https://github.com/actions/actions-runner-controller/pkgs/container/actions-runner-controller-charts%2Fgha-runner-scale-set-controller).

   ```bash copy
   NAMESPACE="arc-systems"
   helm install arc \
       --namespace "${NAMESPACE}" \
       --create-namespace \
       oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller
   ```

   For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set-controller/values.yaml) in the ARC documentation.

2. To enable ARC to authenticate to GitHub, generate a personal access token (classic). For more information, see [Authenticating ARC to the GitHub API](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/authenticating-to-the-github-api#deploying-using-personal-access-token-classic-authentication).

## Configuring a runner scale set

1. To configure your runner scale set, run the following command in your terminal, using values from your ARC configuration.

   When you run the command, keep the following in mind.

   * Update the `INSTALLATION_NAME` value carefully. You will use the installation name as the value of `runs-on` in your workflows. For more information, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idruns-on).

   * Update the `NAMESPACE` value to the location you want the runner pods to be created.

   * Set `GITHUB_CONFIG_URL` to the URL of your repository, organization, or enterprise. This is the entity that the runners will belong to.

   * Set `GITHUB_PAT` to a GitHub personal access token with the `repo` and `admin:org` scopes for repository and organization runners.

   * This example command installs the latest version of the Helm chart. To install a specific version, you can pass the `--version` argument with the version of the chart you wish to install. You can find the list of releases in the [GitHub Container Registry](https://github.com/actions/actions-runner-controller/pkgs/container/actions-runner-controller-charts%2Fgha-runner-scale-set).

     > \[!NOTE]
     >
     > * As a security best practice, create your runner pods in a different namespace than the namespace containing your operator pods.
     > * As a security best practice, create Kubernetes secrets and pass the secret references. Passing your secrets in plain text via the CLI can pose a security risk. For more information, see [Deploying runner scale sets with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller).

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

     For additional Helm configuration options, see [`values.yaml`](https://github.com/actions/actions-runner-controller/blob/master/charts/gha-runner-scale-set/values.yaml) in the ARC documentation.

2. From your terminal, run the following command to check your installation.

   ```bash copy
   helm list -A
   ```

   You should see an output similar to the following.

   ```bash
   NAME            NAMESPACE       REVISION        UPDATED                                 STATUS          CHART                                       APP VERSION
   arc             arc-systems     1               2023-04-12 11:45:59.152090536 +0000 UTC deployed        gha-runner-scale-set-controller-0.4.0       0.4.0
   arc-runner-set  arc-runners     1               2023-04-12 11:46:13.451041354 +0000 UTC deployed        gha-runner-scale-set-0.4.0                  0.4.0
   ```

3. To check the manager pod, run the following command in your terminal.

   ```bash copy
   kubectl get pods -n arc-systems
   ```

   If everything was installed successfully, the status of the pods shows as **Running**.

   ```bash
   NAME                                                   READY   STATUS    RESTARTS   AGE
   arc-gha-runner-scale-set-controller-594cdc976f-m7cjs   1/1     Running   0          64s
   arc-runner-set-754b578d-listener                       1/1     Running   0          12s
   ```

If your installation was not successful, see [Troubleshooting Actions Runner Controller errors](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/troubleshooting-actions-runner-controller-errors) for troubleshooting information.

## Using runner scale sets

Now you will create and run a simple test workflow that uses the runner scale set runners.

1. In a repository, create a workflow similar to the following example. The `runs-on` value should match the Helm installation name you used when you installed the autoscaling runner set.

   For more information on adding workflows to a repository, see [Quickstart for GitHub Actions](/en/actions/quickstart#creating-your-first-workflow).

   ```yaml copy
   name: Actions Runner Controller Demo
   on:
     workflow_dispatch:

   jobs:
     Explore-GitHub-Actions:
       # You need to use the INSTALLATION_NAME from the previous step
       runs-on: arc-runner-set
       steps:
       - run: echo "🎉 This job uses runner scale set runners!"
   ```

2. Once you've added the workflow to your repository, manually trigger the workflow. For more information, see [Manually running a workflow](/en/actions/managing-workflow-runs/manually-running-a-workflow).

3. To view the runner pods being created while the workflow is running, run the following command from your terminal.

   ```bash copy
   kubectl get pods -n arc-runners -w
   ```

   A successful output will look similar to the following.

   ```bash
   NAMESPACE     NAME                                                  READY   STATUS    RESTARTS      AGE
   arc-runners   arc-runner-set-rmrgw-runner-p9p5n                     1/1     Running   0             21s
   ```

## Next steps

Actions Runner Controller can help you efficiently manage your GitHub Actions runners. Ready to get started? Here are some helpful resources for taking your next steps with ARC:

* For detailed authentication information, see [Authenticating ARC to the GitHub API](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/authenticating-to-the-github-api).
* For help using ARC runners in your workflows, see [Using Actions Runner Controller runners in a workflow](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/using-actions-runner-controller-runners-in-a-workflow).
* For deployment information, see [Deploying runner scale sets with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller).

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

# Troubleshooting Actions Runner Controller errors

Learn how to troubleshoot Actions Runner Controller errors.

## Logging

The Actions Runner Controller (ARC) resources, which include the controller, listener, and runners, write logs to standard output (`stdout`). We recommend you implement a logging solution to collect and store these logs. Having logs available can help you or GitHub support with troubleshooting and debugging. For more information, see [Logging Architecture](https://kubernetes.io/docs/concepts/cluster-administration/logging/) in the Kubernetes documentation.

## Resources labels

Labels are added to the resources created by Actions Runner Controller, which include the controller, listener, and runner pods. You can use these labels to filter resources and to help with troubleshooting.

### Controller pod

The following labels are applied to the controller pod.

```yaml
app.kubernetes.io/component=controller-manager
app.kubernetes.io/instance=<controller installation name>
app.kubernetes.io/name=gha-runner-scale-set-controller
app.kubernetes.io/part-of=gha-runner-scale-set-controller
app.kubernetes.io/version=<chart version>
```

### Listener pod

The following labels are applied to listener pods.

```yaml
actions.github.com/enterprise= # Will be populated if githubConfigUrl is an enterprise URL
actions.github.com/organization= # Will be populated if githubConfigUrl is an organization URL
actions.github.com/repository= # Will be populated if githubConfigUrl is a repository URL
actions.github.com/scale-set-name= # Runners scale set name
actions.github.com/scale-set-namespace= # Runners namespace
app.kubernetes.io/component=runner-scale-set-listener
app.kubernetes.io/part-of=gha-runner-scale-set
app.kubernetes.io/version= # Chart version
```

### Runner pod

The following labels are applied to runner pods.

```yaml
actions-ephemeral-runner= # True | False
actions.github.com/organization= # Will be populated if githubConfigUrl is an organization URL
actions.github.com/scale-set-name= # Runners scale set name
actions.github.com/scale-set-namespace= # Runners namespace
app.kubernetes.io/component=runner
app.kubernetes.io/part-of=gha-runner-scale-set
app.kubernetes.io/version= # Chart version
```

## Checking the logs of the controller and runner set listener

To check the logs of the controller pod, you can use the following command.

```bash copy
kubectl logs -n <CONTROLLER_NAMESPACE> -l app.kubernetes.io/name=gha-runner-scale-set-controller
```

To check the logs of the runner set listener, you can use the following command.

```bash copy
kubectl logs -n <CONTROLLER_NAMESPACE> -l auto-scaling-runner-set-namespace=arc-systems -l auto-scaling-runner-set-name=arc-runner-set
```

## Using the charts from the `master` branch

We recommend you use the charts from the latest release instead of the `master` branch. The `master` branch is highly unstable, and we cannot guarantee that the charts in the `master` branch will work at any given time.

## Troubleshooting the listener pod

If the controller pod is running, but the listener pod is not, inspect the logs of the controller first and see if there are any errors. If there are no errors and the runner set listener pod is still not running, ensure the controller pod has access to the Kubernetes API server in your cluster.

If you have a proxy configured or you're using a sidecar proxy that's automatically injected, such as [Istio](https://istio.io/), ensure it's configured to allow traffic from the controller container (manager) to the Kubernetes API server.

If you have installed the autoscaling runner set, but the listener pod is not created, verify that the `githubConfigSecret` you provided is correct and that the `githubConfigUrl` you provided is accurate. See [Authenticating ARC to the GitHub API](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/authenticating-to-the-github-api) and [Deploying runner scale sets with Actions Runner Controller](/en/actions/hosting-your-own-runners/managing-self-hosted-runners-with-actions-runner-controller/deploying-runner-scale-sets-with-actions-runner-controller) for more information.

## Runner pods are recreated after a canceled workflow run

Once a workflow run is canceled, the following events happen.

* The cancellation signal is sent to the runners directly.
* The runner application terminates, which also terminates the runner pods.
* On the next poll, the cancellation signal is received by the listener.

There might be a slight delay between when the runners receive the signal and when the listener receives the signal. When runner pods start terminating, the listener tries to bring up new runners to match the desired number of runners according to the state it's in. However, when the listener receives the cancellation signal, it will act to reduce the number of runners. Eventually the listener will scale back down to the desired number of runners. In the meantime, you may see extra runners.

## Error: `Name must have up to n characters`

ARC uses the generated names of certain resources as labels for other resources. Because of this requirement, ARC limits resource names to 63 characters.

Because part of the resource name is defined by you, ARC imposes a limit on the number of characters you can use for the installation name and namespace.

```bash
Error: INSTALLATION FAILED: execution error at (gha-runner-scale-set/templates/autoscalingrunnerset.yaml:5:5): Name must have up to 45 characters

Error: INSTALLATION FAILED: execution error at (gha-runner-scale-set/templates/autoscalingrunnerset.yaml:8:5): Namespace must have up to 63 characters
```

## Error: `Access to the path /home/runner/_work/_tool is denied`

You may see this error if you're using Kubernetes mode with persistent volumes. This error occurs if the runner container is running with a non-root user and is causing a permissions mismatch with the mounted volume.

To fix this, you can do one of the following things.

* Use a volume type that supports `securityContext.fsGroup`. `hostPath` volumes do not support this property, whereas `local` volumes and other types of volumes do support it. Update the `fsGroup` of your runner pod to match the GID of the runner. You can do this by updating the `gha-runner-scale-set` helm chart values to include the following. Replace `VERSION` with the version of the `actions-runner` container image you want to use.

  ```yaml copy
  template:
    spec:
      securityContext:
        fsGroup: 123
      containers:
        - name: runner
          image: ghcr.io/actions/actions-runner:latest
          command: ["/home/runner/run.sh"]
  ```

* If updating the `securityContext` of your runner pod is not a viable solution, you can work around the issue by using `initContainers` to change the mounted volume's ownership, as follows.

  ```yaml copy
  template:
    spec:
      initContainers:
        - name: kube-init
          image: ghcr.io/actions/actions-runner:latest
          command: ["sudo", "chown", "-R", "1001:123", "/home/runner/_work"]
      volumeMounts:
        - name: work
          mountPath: /home/runner/_work
      containers:
        - name: runner
          image: ghcr.io/actions/actions-runner:latest
          command: ["/home/runner/run.sh"]
  ```

## Error: `failed to get access token for GitHub App auth: 401 Unauthorized`

A `401 Unauthorized` error when attempting to obtain an access token for a GitHub App could be a result of a Network Time Protocol (NTP) drift. Ensure that your Kubernetes system is accurately syncing with an NTP server and that there isn't a significant time drift. There is more leeway if your system time is behind GitHub's time, but if the environment is more than a few seconds ahead, 401 errors will occur when using GitHub App.

## Runner group limits

You can have a maximum of 10,000 self-hosted runners in one runner group. If this limit is reached, adding a new runner will not be possible.

## Runner updates

> \[!WARNING] Any updates released for the software, including major, minor, or patch releases, are considered as an available update. If you do not perform a software update within 30 days, the GitHub Actions service will not queue jobs to your runner. In addition, if a critical security update is required, the GitHub Actions service will not queue jobs to your runner until it has been updated.

Validate that your runner software version and/or custom runner image(s) in use are running the latest version.

For more information, see [Self-hosted runners reference](/en/actions/reference/runners/self-hosted-runners).

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