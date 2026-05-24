# Security Reference

---

# OpenID Connect reference

Find information about using OpenID Connect (OIDC) to authenticate GitHub Actions workflows with cloud providers.

## OIDC token claims

To see all the claims supported by GitHub's OIDC provider, review the `claims_supported` entries at
<https://token.actions.githubusercontent.com/.well-known/openid-configuration>.

The OIDC token includes the following claims.

### Standard audience, issuer, and subject claims

| Claim | Claim type | Description                                                                                                                                                                                                                                      |
| ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `aud` | Audience   | By default, this is the URL of the repository owner, such as the organization that owns the repository. You can set a custom audience with a toolkit command: [`core.getIDToken(audience)`](https://www.npmjs.com/package/@actions/core/v/1.6.0) |
| `iss` | Issuer     | The issuer of the OIDC token: `https://token.actions.githubusercontent.com`                                                                                                                                                                      |
| `sub` | Subject    | Defines the subject claim that is to be validated by the cloud provider. This setting is essential for making sure that access tokens are only allocated in a predictable way.                                                                   |

### Additional standard JOSE header parameters and claims

| Header Parameter | Parameter type | Description                                                  |
| ---------------- | -------------- | ------------------------------------------------------------ |
| `alg`            | Algorithm      | The algorithm used by the OIDC provider.                     |
| `kid`            | Key identifier | Unique key for the OIDC token.                               |
| `typ`            | Type           | Describes the type of token. This is a JSON Web Token (JWT). |

| Claim | Claim type           | Description                                |
| ----- | -------------------- | ------------------------------------------ |
| `exp` | Expires at           | Identifies the expiry time of the JWT.     |
| `iat` | Issued at            | The time when the JWT was issued.          |
| `jti` | JWT token identifier | Unique identifier for the OIDC token.      |
| `nbf` | Not before           | JWT is not valid for use before this time. |

### Custom claims provided by GitHub

| Claim                   | Description                                                                                                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actor`                 | The personal account that initiated the workflow run.                                                                                                                                                                                                                                       |
| `actor_id`              | The ID of personal account that initiated the workflow run.                                                                                                                                                                                                                                 |
| `base_ref`              | The target branch of the pull request in a workflow run.                                                                                                                                                                                                                                    |
|                         |                                                                                                                                                                                                                                                                                             |
| `check_run_id`          | The check run ID of the current job.                                                                                                                                                                                                                                                        |
|                         |                                                                                                                                                                                                                                                                                             |
|                         |                                                                                                                                                                                                                                                                                             |
|                         |                                                                                                                                                                                                                                                                                             |
| `environment`           | The name of the environment used by the job. If the `environment` claim is included (also via `include_claim_keys`), an environment is required and must be provided.                                                                                                                       |
| `event_name`            | The name of the event that triggered the workflow run.                                                                                                                                                                                                                                      |
| `head_ref`              | The source branch of the pull request in a workflow run.                                                                                                                                                                                                                                    |
| `job_workflow_ref`      | For jobs using a reusable workflow, the ref path to the reusable workflow. For more information, see [Using OpenID Connect with reusable workflows](/en/actions/deployment/security-hardening-your-deployments/using-openid-connect-with-reusable-workflows).                               |
| `job_workflow_sha`      | For jobs using a reusable workflow, the commit SHA for the reusable workflow file.                                                                                                                                                                                                          |
| `ref`                   | *(Reference)* The git ref that triggered the workflow run.                                                                                                                                                                                                                                  |
| `ref_type`              | The type of `ref`, for example: "branch".                                                                                                                                                                                                                                                   |
| `repository_visibility` | The visibility of the repository where the workflow is running. Accepts the following values: `internal`, `private`, or `public`.                                                                                                                                                           |
| `repository`            | The repository from where the workflow is running.                                                                                                                                                                                                                                          |
| `repository_id`         | The ID of the repository from where the workflow is running.                                                                                                                                                                                                                                |
| `repository_owner`      | The name of the organization in which the `repository` is stored.                                                                                                                                                                                                                           |
| `repository_owner_id`   | The ID of the organization in which the `repository` is stored.                                                                                                                                                                                                                             |
|                         |                                                                                                                                                                                                                                                                                             |
| `repo_property_*`       | Custom properties defined at the organization or enterprise level that are included as claims in the OIDC token, prefixed with `repo_property_`. For more information, see [Including repository custom properties in OIDC tokens](#including-repository-custom-properties-in-oidc-tokens). |
|                         |                                                                                                                                                                                                                                                                                             |
| `run_id`                | The ID of the workflow run that triggered the workflow.                                                                                                                                                                                                                                     |
| `run_number`            | The number of times this workflow has been run.                                                                                                                                                                                                                                             |
| `run_attempt`           | The number of times this workflow run has been retried.                                                                                                                                                                                                                                     |
| `runner_environment`    | The type of runner used by the job. Accepts the following values: `github-hosted` or `self-hosted`.                                                                                                                                                                                         |
| `workflow`              | The name of the workflow.                                                                                                                                                                                                                                                                   |
| `workflow_ref`          | The ref path to the workflow. For example, `octocat/hello-world/.github/workflows/my-workflow.yml@refs/heads/my_branch`.                                                                                                                                                                    |
| `workflow_sha`          | The commit SHA for the workflow file.                                                                                                                                                                                                                                                       |

## OIDC claims used to define trust conditions on cloud roles

Audience and subject claims are typically used in combination while setting conditions on the cloud role/resources to scope its access to the GitHub workflows.

* **Audience:** By default, this value uses the URL of the organization or repository owner. This can be used to set a condition that only the workflows in the specific organization can access the cloud role.
* **Subject:** By default, has a predefined format and is a concatenation of some of the key metadata about the workflow, such as the GitHub organization, repository, branch, or associated [`job`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idenvironment) environment. See [Example subject claims](#example-subject-claims) to see how the subject claim is assembled from concatenated metadata.

If you need more granular trust conditions, you can customize the subject (`sub`) claim that's included with the JWT. For more information, see [Customizing the token claims](#customizing-the-token-claims).

There are also many additional claims supported in the OIDC token that can be used for setting these conditions. In addition, your cloud provider could allow you to assign a role to the access tokens, letting you specify even more granular permissions.

> \[!NOTE]
> To control how your cloud provider issues access tokens, you **must** define at least one condition, so that untrusted repositories can’t request access tokens for your cloud resources.

## Example subject claims

The following examples demonstrate how to use "Subject" as a condition, and explain how the "Subject" is assembled from concatenated metadata. The [subject](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims) uses information from the [`job` context](/en/actions/learn-github-actions/contexts#job-context), and instructs your cloud provider that access token requests may only be granted for requests from workflows running in specific branches, environments. The following sections describe some common subjects you can use.

### Filtering for a specific environment

The subject claim includes the environment name when the job references an environment.

You can configure a subject that filters for a specific [environment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment) name. In this example, the workflow run must have originated from a job that has an environment named `Production`, in a repository named `octo-repo` that is owned by the `octo-org` organization:

* Syntax: `repo:ORG-NAME/REPO-NAME:environment:ENVIRONMENT-NAME`
* Example: `repo:octo-org/octo-repo:environment:Production`

### Filtering for `pull_request` events

The subject claim includes the `pull_request` string when the workflow is triggered by a pull request event, but only if the job doesn't reference an environment.

You can configure a subject that filters for the [`pull_request`](/en/actions/using-workflows/events-that-trigger-workflows#pull_request) event. In this example, the workflow run must have been triggered by a `pull_request` event in a repository named `octo-repo` that is owned by the `octo-org` organization:

* Syntax: `repo:ORG-NAME/REPO-NAME:pull_request`
* Example: `repo:octo-org/octo-repo:pull_request`

### Filtering for a specific branch

The subject claim includes the branch name of the workflow, but only if the job doesn't reference an environment, and if the workflow is not triggered by a pull request event.

You can configure a subject that filters for a specific branch name. In this example, the workflow run must have originated from a branch named `demo-branch`, in a repository named `octo-repo` that is owned by the `octo-org` organization:

* Syntax:  `repo:ORG-NAME/REPO-NAME:ref:refs/heads/BRANCH-NAME`
* Example: `repo:octo-org/octo-repo:ref:refs/heads/demo-branch`

### Filtering for a specific tag

The subject claim includes the tag name of the workflow, but only if the job doesn't reference an environment, and if the workflow is not triggered by a pull request event.

You can create a subject that filters for specific tag. In this example, the workflow run must have originated with a tag named `demo-tag`, in a repository named `octo-repo` that is owned by the `octo-org` organization:

* Syntax: `repo:ORG-NAME/REPO-NAME:ref:refs/tags/TAG-NAME`
* Example: `repo:octo-org/octo-repo:ref:refs/tags/demo-tag`

### Filtering for metadata containing `:`

Any `:` within the metadata values will be replaced with `%3A` in the subject claim.

You can configure a subject that includes metadata containing colons. In this example, the workflow run must have originated from a job that has an environment named `Production:V1`, in a repository named `octo-repo` that is owned by the `octo-org` organization:

* Syntax: `repo:ORG-NAME/REPO-NAME:environment:ENVIRONMENT-NAME`
* Example: `repo:octo-org/octo-repo:environment:Production%3AV1`

## Configuring the subject in your cloud provider

To configure the subject in your cloud provider's trust relationship, you must add the subject string to its trust configuration. The following examples demonstrate how various cloud providers can accept the same `repo:octo-org/octo-repo:ref:refs/heads/demo-branch` subject in different ways:

| Cloud provider        | Example                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Amazon Web Services   | `"token.actions.githubusercontent.com:sub": "repo:octo-org/octo-repo:ref:refs/heads/demo-branch"` |
| Azure                 | `repo:octo-org/octo-repo:ref:refs/heads/demo-branch`                                              |
| Google Cloud Platform | `(assertion.sub=='repo:octo-org/octo-repo:ref:refs/heads/demo-branch')`                           |
| HashiCorp Vault       | `bound_subject="repo:octo-org/octo-repo:ref:refs/heads/demo-branch"`                              |

For more information about configuring specific cloud providers, see the guides listed in [Security hardening your deployments](/en/actions/how-tos/security-for-github-actions/security-hardening-your-deployments).

## Customizing the token claims

You can security harden your OIDC configuration by customizing the claims that are included with the JWT. These customizations allow you to define more granular trust conditions on your cloud roles when allowing your workflows to access resources hosted in the cloud:

* You can customize values for `audience` claims. See [Customizing the `audience` value](#customizing-the-audience-value).

* You can customize the format of your OIDC configuration by setting conditions on the subject (`sub`) claim that require JWT tokens to originate from a specific repository, reusable workflow, or other source.

* You can define granular OIDC policies by using additional OIDC token claims, such as `repository_id` and `repository_visibility`. See [OpenID Connect](/en/actions/concepts/security/openid-connect#understanding-the-oidc-token).

* You can include repository custom properties as claims in OIDC tokens, enabling attribute-based access control policies. See [Including repository custom properties in OIDC tokens](#including-repository-custom-properties-in-oidc-tokens).

### Customizing the `audience` value

When you use custom actions in your workflows, those actions may use the GitHub Actions Toolkit to enable you to supply a custom value for the `audience` claim. Some cloud providers also use this in their official login actions to enforce a default value for the `audience` claim. For example, the [GitHub Action for Azure Login](https://github.com/Azure/login/blob/master/action.yml) provides a default `aud` value of `api://AzureADTokenExchange`, or it allows you to set a custom `aud` value in your workflows. For more information on the GitHub Actions Toolkit, see the [OIDC token](https://github.com/actions/toolkit/tree/main/packages/core#oidc-token) section in the documentation.

If you do not want to use the default `aud` value offered by an action, you can provide a custom value for the `audience` claim. This allows you to set a condition that only workflows in a specific repository or organization can access the cloud role. If the action you are using supports this, you can use the `with` keyword in your workflow to pass a custom `aud` value to the action. For more information, see [Metadata syntax reference](/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs).

### Including repository custom properties in OIDC tokens

> \[!NOTE]
> This feature is currently in public preview and is subject to change.

Organization and enterprise admins can select repository custom properties to include as claims in Actions OIDC tokens. Once a custom property is added to the OIDC configuration, every repository in the organization or enterprise that has a value set for that property will automatically include it in its OIDC tokens. The property name appears in the token prefixed with `repo_property_`.

This allows you to create attribute-based access control (ABAC) policies in your cloud provider that bind directly to your repository metadata, reducing configuration drift and eliminating the need to manage separate access configuration for each repository.

#### Prerequisites for including custom properties

* Custom properties must already be defined at the organization or enterprise level.
* You must be an organization admin or enterprise admin.
* After adding a custom property to the OIDC configuration, all repositories in the organization or enterprise that have a value set for that property will automatically include it in their OIDC tokens.

#### Adding a custom property to OIDC token claims

You can manage which custom properties are included in OIDC tokens using the settings UI or the REST API.

* **Using the settings UI:**

  Navigate to your organization's or enterprise's Actions OIDC settings to view and configure which custom properties are included in OIDC tokens.

* **Using the REST API:**

  To add a custom property to your organization's OIDC token claims, send a `POST` request to:

#### Example token with a custom property

After a custom property is added to the OIDC configuration, repositories with a value set for that property will include it in their tokens. In the following example, the `workspace_id` custom property appears as `repo_property_workspace_id` in the token:

```json
{
  "sub": "repo:my-org/my-repo:ref:refs/heads/main",
  "aud": "https://github.com/my-org",
  "repository": "my-org/my-repo",
  "repo_property_workspace_id": "ws-abc123"
}
```

You can use these `repo_property_*` claims as conditions in your cloud provider's trust policy. For an example, see [Example: Filtering on a repository custom property](#example-filtering-on-a-repository-custom-property).

### Customizing the subject claims for an organization or repository

To help improve security, compliance, and standardization, you can customize the standard claims to suit your required access conditions. If your cloud provider supports conditions on subject claims, you can create a condition that checks whether the `sub` value matches the path of the reusable workflow, such as `"job_workflow_ref:octo-org/octo-automation/.github/workflows/oidc.yml@refs/heads/main"`. The exact format will vary depending on your cloud provider's OIDC configuration. To configure the matching condition on GitHub, you can use the REST API to require that the `sub` claim must always include a specific custom claim, such as `job_workflow_ref`. You can use the REST API to apply a customization template for the OIDC subject claim; for example, you can require that the `sub` claim within the OIDC token must always include a specific custom claim, such as `job_workflow_ref`. For more information, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc).

> \[!NOTE]
> When the organization template is applied, it will not affect any workflows already using OIDC unless their repository has opted in to custom organization templates. For all repositories, existing and new, the repository owner will need to use the repository-level REST API to opt in to receive this configuration by setting `use_default` to `false`. Alternatively, the repository owner could use the REST API to apply a different configuration specific to the repository. For more information, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

Customizing the claims results in a new format for the entire `sub` claim, which replaces the default predefined `sub` format in the token described in [Example subject claims](#example-subject-claims).

> \[!NOTE]
> The `sub` claim uses the shortened form `repo` (for example, `repo:ORG-NAME/REPO-NAME`) instead of `repository` to reference the repository.
> Any `:` within the context value will be replaced with `%3A`.

The following example templates demonstrate various ways to customize the subject claim. To configure these settings on GitHub, admins use the REST API to specify a list of claims that must be included in the subject (`sub`) claim.

To apply this configuration, submit a request to the API endpoint and include the required configuration in the request body. For organizations, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-an-organization), and for repositories, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

To customize your subject claims, you should first create a matching condition in your cloud provider's OIDC configuration, before customizing the configuration using the REST API. Once the configuration is completed, each time a new job runs, the OIDC token generated during that job will follow the new customization template. If the matching condition doesn't exist in the cloud provider's OIDC configuration before the job runs, the generated token might not be accepted by the cloud provider, since the cloud conditions may not be synchronized.

#### Example: Allowing repository based on visibility and owner

This example template allows the `sub` claim to have a new format, using `repository_owner` and `repository_visibility`:

```json
{
   "include_claim_keys": [
       "repository_owner",
       "repository_visibility"
   ]
}
```

In your cloud provider's OIDC configuration, configure the `sub` condition to require that claims must include specific values for `repository_owner` and `repository_visibility`. For example: `"sub": "repository_owner:monalisa:repository_visibility:private"`. The approach lets you restrict cloud role access to only private repositories within an organization or enterprise.

#### Example: Allowing access to all repositories with a specific owner

This example template enables the `sub` claim to have a new format with only the value of `repository_owner`.

To apply this configuration, submit a request to the API endpoint and include the required configuration in the request body. For organizations, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-an-organization), and for repositories, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

```json
{
   "include_claim_keys": [
       "repository_owner"
   ]
}

```

In your cloud provider's OIDC configuration, configure the `sub` condition to require that claims must include a specific value for `repository_owner`. For example: `"sub": "repository_owner:monalisa"`

#### Example: Requiring a reusable workflow

This example template allows the `sub` claim to have a new format that contains the value of the `job_workflow_ref` claim. This enables an enterprise to use reusable workflows to enforce consistent deployments across its organizations and repositories.

To apply this configuration, submit a request to the API endpoint and include the required configuration in the request body. For organizations, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-an-organization), and for repositories, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

```json
  {
     "include_claim_keys": [
         "job_workflow_ref"
     ]
  }
```

In your cloud provider's OIDC configuration, configure the `sub` condition to require that claims must include a specific value for `job_workflow_ref`. For example: `"sub": "job_workflow_ref:octo-org/octo-automation/.github/workflows/oidc.yml@refs/heads/main"`.

#### Example: Requiring a reusable workflow and other claims

The following example template combines the requirement of a specific reusable workflow with additional claims.

To apply this configuration, submit a request to the API endpoint and include the required configuration in the request body. For organizations, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-an-organization), and for repositories, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

This example also demonstrates how to use `"context"` to define your conditions. This is the part that follows the repository in the default `sub` format. For example, when the job references an environment, the context contains: `environment:ENVIRONMENT-NAME`.

```json
{
   "include_claim_keys": [
       "repo",
       "context",
       "job_workflow_ref"
   ]
}
```

In your cloud provider's OIDC configuration, configure the `sub` condition to require that claims must include specific values for `repo`, `context`, and `job_workflow_ref`.

This customization template requires that the `sub` uses the following format: `repo:ORG-NAME/REPO-NAME:environment:ENVIRONMENT-NAME:job_workflow_ref:REUSABLE-WORKFLOW-PATH`.
For example: `"sub": "repo:octo-org/octo-repo:environment:prod:job_workflow_ref:octo-org/octo-automation/.github/workflows/oidc.yml@refs/heads/main"`

#### Example: Granting access to a specific repository

This example template lets you grant cloud access to all the workflows in a specific repository, across all branches/tags and environments.

To apply this configuration, submit a request to the API endpoint and include the required configuration in the request body. For organizations, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-an-organization), and for repositories, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

```json
{
   "include_claim_keys": [
       "repo"
   ]
}
```

In your cloud provider's OIDC configuration, configure the `sub` condition to require a `repo` claim that matches the required value.

#### Example: Using system-generated GUIDs

This example template enables predictable OIDC claims with system-generated GUIDs that do not change between renames of entities (such as renaming a repository).

To apply this configuration, submit a request to the API endpoint and include the required configuration in the request body. For organizations, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-an-organization), and for repositories, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

```json
  {
     "include_claim_keys": [
         "repository_id"
     ]
  }
```

In your cloud provider's OIDC configuration, configure the `sub` condition to require a `repository_id` claim that matches the required value.

or:

```json
{
   "include_claim_keys": [
       "repository_owner_id"
   ]
}
```

In your cloud provider's OIDC configuration, configure the `sub` condition to require a `repository_owner_id` claim that matches the required value.

#### Example: Context value with `:`

This example demonstrates how to handle context value with `:`. For example, when the job references an environment named `production:eastus`.

To apply this configuration, submit a request to the API endpoint and include the required configuration in the request body. For organizations, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-an-organization), and for repositories, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

```json
{
   "include_claim_keys": [
       "environment",
       "repository_owner"
   ]
}
```

In your cloud provider's OIDC configuration, configure the `sub` condition to require that claims must include a specific value for `environment` and `repository_owner`. For example: `"sub": "environment:production%3Aeastus:repository_owner:octo-org"`.

#### Example: Filtering on a repository custom property

This example template allows the `sub` claim to include a repository custom property claim. Custom properties included in OIDC tokens appear prefixed with `repo_property_` in the token, but the `include_claim_keys` value uses the full claim name as it appears in the token.

To apply this configuration, submit a request to the API endpoint and include the required configuration in the request body. For organizations, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-an-organization), and for repositories, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

```json
{
   "include_claim_keys": [
       "repo_property_workspace_id"
   ]
}
```

In your cloud provider's OIDC configuration, configure the `sub` condition to require that claims must include a specific value for `repo_property_workspace_id`. For example: `"sub": "repo_property_workspace_id:ws-abc123"`.

#### Resetting organization template customizations

This example template resets the subject claims to the default format. This template effectively opts out of any organization-level customization policy.

To apply this configuration, submit a request to the API endpoint and include the required configuration in the request body. For organizations, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-an-organization), and for repositories, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

```json
{
   "include_claim_keys": [
       "repo",
       "context"
   ]
}
```

In your cloud provider's OIDC configuration, configure the `sub` condition to require that claims must include specific values for `repo` and `context`.

#### Resetting repository template customizations

All repositories in an organization have the ability to opt in or opt out of (organization and repository-level) customized `sub` claim templates.

To opt out a repository and reset back to the default `sub` claim format, a repository administrator must use the REST API endpoint at [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

To configure repositories to use the default `sub` claim format, use the `PUT /repos/{owner}/{repo}/actions/oidc/customization/sub` REST API endpoint at with the following request body.

```json
{
   "use_default": true
}
```

#### Example: Configuring a repository to use an organization template

Once an organization has created a customized `sub` claim template, the REST API can be used to programmatically apply the template to repositories within the organization. A repository administrator can configure their repository to use the template created by the administrator of their organization.

To configure the repository to use the organization's template, a repository admin must use the `PUT /repos/{owner}/{repo}/actions/oidc/customization/sub` REST API endpoint at with the following request body. For more information, see [REST API endpoints for GitHub Actions OIDC](/en/rest/actions/oidc#set-the-customization-template-for-an-oidc-subject-claim-for-a-repository).

```json
{
   "use_default": false
}
```

## Debugging your OIDC claims

You can use the [`github/actions-oidc-debugger`](https://github.com/github/actions-oidc-debugger) action to visualize the claims that would be sent, before integrating with a cloud provider. This action requests a JWT and prints the claims included within the JWT that were received from GitHub Actions.

## Workflow permissions for the requesting the OIDC token

### Required permission

* The job or workflow must grant the [`id-token: write`](/en/actions/reference/workflow-syntax-for-github-actions#permissions) permission to allow GitHub's OIDC provider to create a JSON Web Token (JWT):

  ```yaml
  permissions:
    id-token: write
  ```

* Without `id-token: write`, the OIDC JWT ID token cannot be requested. This setting only enables fetching and setting the OIDC token; it does not grant write access to other resources.

### Setting permissions

* To fetch an OIDC token for a workflow, set the permission at the workflow level:

  ```yaml
  permissions:
    id-token: write # This is required for requesting the JWT
    contents: read # This is required for actions/checkout
  ```

* To fetch an OIDC token for a single job, set the permission within that job:

  ```yaml
  permissions:
    id-token: write # This is required for requesting the JWT
  ```

* Additional permissions may be required depending on workflow needs.

### Reusable workflows

* For reusable workflows owned by the same user, organization, or enterprise as the caller, the OIDC token generated in the reusable workflow is accessible from the caller's context.
* For reusable workflows outside your enterprise or organization, set the `permissions` setting for `id-token` to `write` explicitly at the caller workflow or job level. This ensures the OIDC token is only available to intended caller workflows.

## Methods for requesting the OIDC token

Custom actions can request the OIDC token using:

* The `getIDToken()` method from the Actions toolkit. For more information, see [OIDC Token](https://www.npmjs.com/package/@actions/core/v/1.6.0#oidc-token) in the npm package documentation.
* The following environment variables on the runner.

  | Variable                         | Description                                        |
  | -------------------------------- | -------------------------------------------------- |
  | `ACTIONS_ID_TOKEN_REQUEST_URL`   | The URL for GitHub's OIDC provider.                |
  | `ACTIONS_ID_TOKEN_REQUEST_TOKEN` | Bearer token for the request to the OIDC provider. |

  For example:

  ```shell copy
  curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=api://AzureADTokenExchange"
  ```
---

# Secrets reference

Find technical information about secrets in GitHub Actions.

## Naming your secrets

> \[!TIP]
> To help ensure that GitHub redacts your secrets in logs correctly, avoid using structured data as the values of secrets.

The following rules apply to secret names:

* Can only contain alphanumeric characters (`[a-z]`, `[A-Z]`, `[0-9]`) or underscores (`_`). Spaces are not allowed.
* Must not start with the `GITHUB_` prefix.
* Must not start with a number.
* Are case insensitive when referenced. GitHub stores secret names as uppercase regardless of how they are entered.
* Must be unique to the repository, organization, or enterprise where they are created.

If a secret with the same name exists at multiple levels, the secret at the lowest level takes precedence. For example, if an organization-level secret has the same name as a repository-level secret, then the repository-level secret takes precedence. Similarly, if an organization, repository, and environment all have a secret with the same name, the environment-level secret takes precedence.

## Limits for secrets

You can store up to 1,000 organization secrets, 100 repository secrets, and 100 environment secrets.

A workflow created in a repository can access the following number of secrets:

* All 100 repository secrets.
* If the repository is assigned access to more than 100 organization secrets, the workflow can only use the first 100 organization secrets (sorted alphabetically by secret name).
* All 100 environment secrets.

Secrets are limited to 48 KB in size. To store larger secrets, see [Using secrets in GitHub Actions](/en/actions/how-tos/security-for-github-actions/security-guides/using-secrets-in-github-actions#storing-large-secrets).

## When GitHub Actions reads secrets

Organization and repository secrets are read when a workflow run is queued, and environment secrets are read when a job referencing the environment starts.

## Automatically redacted secrets

GitHub automatically redacts the following sensitive information from workflow logs.

> \[!NOTE] If you would like other types of sensitive information to be automatically redacted, please reach out to us in our [community discussions](https://github.com/orgs/community/discussions?discussions_q=is%3Aopen+label%3AActions).

* 32-byte and 64-byte Azure keys
* Azure AD client app passwords
* Azure Cache keys
* Azure Container Registry keys
* Azure Function host keys
* Azure Search keys
* Database connection strings
* HTTP Bearer token headers
* JWTs
* NPM author tokens
* NuGet API keys
* v1 GitHub installation tokens
* v2 GitHub installation tokens (`ghp`, `gho`, `ghu`, `ghs`, `ghr`)
* v2 GitHub PATs

## Security

For security best practices using secrets, see [Secure use reference](/en/actions/reference/secure-use-reference#use-secrets-for-sensitive-information).
---

# Secure use reference

Security practices for writing workflows and using GitHub Actions features.

Find information about security best practices when you are writing workflows and using GitHub Actions security features.

## Writing workflows

### Use secrets for sensitive information

Because there are multiple ways a secret value can be transformed, automatic redaction is not guaranteed. Adhere to the following best practices to limit risks associated with secrets.

* **Principle of least privilege**
  * Any user with write access to your repository has read access to all secrets configured in your repository. Therefore, you should ensure that the credentials being used within workflows have the least privileges required.
  * Actions can use the `GITHUB_TOKEN` by accessing it from the `github.token` context. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts#github-context). You should therefore make sure that the `GITHUB_TOKEN` is granted the minimum required permissions. It's good security practice to set the default permission for the `GITHUB_TOKEN` to read access only for repository contents. The permissions can then be increased, as required, for individual jobs within the workflow file. For more information, see [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token).
* **Mask sensitive data**
  * Sensitive data should **never** be stored as plaintext in workflow files. Mask all sensitive information that is not a GitHub secret by using `::add-mask::VALUE`. This causes the value to be treated as a secret and redacted from logs. For more information about masking data, see [Workflow commands for GitHub Actions](/en/actions/using-workflows/workflow-commands-for-github-actions#masking-a-value-in-a-log).
* **Delete and rotate exposed secrets**
  * Redacting of secrets is performed by your workflow runners. This means a secret will only be redacted if it was used within a job and is accessible by the runner. If an unredacted secret is sent to a workflow run log, you should delete the log and rotate the secret. For information on deleting logs, see [Using workflow run logs](/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs#deleting-logs).
* **Never use structured data as a secret**
  * Structured data can cause secret redaction within logs to fail, because redaction largely relies on finding an exact match for the specific secret value. For example, do not use a blob of JSON, XML, or YAML (or similar) to encapsulate a secret value, as this significantly reduces the probability the secrets will be properly redacted. Instead, create individual secrets for each sensitive value.
* **Register all secrets used within workflows**
  * If a secret is used to generate another sensitive value within a workflow, that generated value should be formally [registered as a secret](https://github.com/actions/toolkit/tree/main/packages/core#setting-a-secret), so that it will be redacted if it ever appears in the logs. For example, if using a private key to generate a signed JWT to access a web API, be sure to register that JWT as a secret or else it won’t be redacted if it ever enters the log output.
  * Registering secrets applies to any sort of transformation/encoding as well. If your secret is transformed in some way (such as Base64 or URL-encoded), be sure to register the new value as a secret too.
* **Audit how secrets are handled**
  * Audit how secrets are used, to help ensure they’re being handled as expected. You can do this by reviewing the source code of the repository executing the workflow, and checking any actions used in the workflow. For example, check that they’re not sent to unintended hosts, or explicitly being printed to log output.
  * View the run logs for your workflow after testing valid/invalid inputs, and check that secrets are properly redacted, or not shown. It's not always obvious how a command or tool you’re invoking will send errors to `STDOUT` and `STDERR`, and secrets might subsequently end up in error logs. As a result, it is good practice to manually review the workflow logs after testing valid and invalid inputs. For information on how to clean up workflow logs that may unintentionally contain sensitive data, see [Using workflow run logs](/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs#deleting-logs).
* **Audit and rotate registered secrets**
  * Periodically review the registered secrets to confirm they are still required. Remove those that are no longer needed.
  * Rotate secrets periodically to reduce the window of time during which a compromised secret is valid.
* **Consider requiring review for access to secrets**
  * You can use required reviewers to protect environment secrets. A workflow job cannot access environment secrets until approval is granted by a reviewer. For more information about storing secrets in environments or requiring reviews for environments, see [Using secrets in GitHub Actions](/en/actions/security-guides/using-secrets-in-github-actions) and [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

### Good practices for mitigating script injection attacks

Recommended approaches for mitigating the risk of script injection in your workflows:

#### Use an action instead of an inline script

The recommended approach is to create a JavaScript action that processes the context value as an argument. This approach is not vulnerable to the injection attack, since the context value is not used to generate a shell script, but is instead passed to the action as an argument:

```yaml
uses: fakeaction/checktitle@v3
with:
  title: ${{ github.event.pull_request.title }}
```

#### Use an intermediate environment variable

For inline scripts, the preferred approach to handling untrusted input is to set the value of the expression to an intermediate environment variable. The following example uses Bash to process the `github.event.pull_request.title` value as an environment variable:

```yaml
      - name: Check PR title
        env:
          TITLE: ${{ github.event.pull_request.title }}
        run: |
          if [[ "$TITLE" =~ ^octocat ]]; then
          echo "PR title starts with 'octocat'"
          exit 0
          else
          echo "PR title did not start with 'octocat'"
          exit 1
          fi
```

In this example, the attempted script injection is unsuccessful, which is reflected by the following lines in the log:

```shell
   env:
     TITLE: a"; ls $GITHUB_WORKSPACE"
PR title did not start with 'octocat'
```

With this approach, the value of the `${{ github.event.pull_request.title }}` expression is stored in memory and used as a variable, and doesn't interact with the script generation process. In addition, consider using double quote shell variables to avoid [word splitting](https://github.com/koalaman/shellcheck/wiki/SC2086), but this is [one of many](https://mywiki.wooledge.org/BashPitfalls) general recommendations for writing shell scripts, and is not specific to GitHub Actions.

#### Using workflow templates for code scanning

Code scanning allows you to find security vulnerabilities before they reach production. GitHub provides workflow templates for code scanning. You can use these suggested workflows to construct your code scanning workflows, instead of starting from scratch. GitHub's workflow, the CodeQL analysis workflow, is powered by CodeQL. There are also third-party workflow templates available.

For more information, see [About code scanning](/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning) and [Configuring advanced setup for code scanning](/en/code-security/code-scanning/creating-an-advanced-setup-for-code-scanning/configuring-advanced-setup-for-code-scanning#configuring-code-scanning-using-third-party-actions).

#### Restricting permissions for tokens

To help mitigate the risk of an exposed token, consider restricting the assigned permissions. For more information, see [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token).

## Using third-party actions

The individual jobs in a workflow can interact with (and compromise) other jobs. For example, a job querying the environment variables used by a later job, writing files to a shared directory that a later job processes, or even more directly by interacting with the Docker socket and inspecting other running containers and executing commands in them.

This means that a compromise of a single action within a workflow can be very significant, as that compromised action would have access to all secrets configured on your repository, and may be able to use the `GITHUB_TOKEN` to write to the repository. Consequently, there is significant risk in sourcing actions from third-party repositories on GitHub. For information on some of the steps an attacker could take, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#potential-impact-of-a-compromised-runner).

You can help mitigate this risk by following these good practices:

* **Pin actions to a full-length commit SHA**

  Pinning an action to a full-length commit SHA is currently the only way to use an action as an immutable release. Pinning to a particular SHA helps mitigate the risk of a bad actor adding a backdoor to the action's repository, as they would need to generate a SHA-1 collision for a valid Git object payload. When selecting a SHA, you should verify it is from the action's repository and not a repository fork.

  For an example of using a full-length commit SHA in a workflow, see [Using pre-written building blocks in your workflow](/en/actions/how-tos/write-workflows/choose-what-workflows-do/find-and-customize-actions#using-shas).

  GitHub offers policies at the repository and organization level to require actions to be pinned to a full-length commit SHA:

  * To configure the policy at the repository level, see [Managing GitHub Actions settings for a repository](/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#managing-github-actions-permissions-for-your-repository).
  * To configure the policy at the organization level, see [Disabling or limiting GitHub Actions for your organization](/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#managing-github-actions-permissions-for-your-organization).

* **Audit the source code of the action**

  Ensure that the action is handling the content of your repository and secrets as expected. For example, check that secrets are not sent to unintended hosts, or are not inadvertently logged.

* **Pin actions to a tag only if you trust the creator**

  Although pinning to a commit SHA is the most secure option, specifying a tag is more convenient and is widely used. If you’d like to specify a tag, then be sure that you trust the action's creators. The ‘Verified creator’ badge on GitHub Marketplace is a useful signal, as it indicates that the action was written by a team whose identity has been verified by GitHub. Note that there is risk to this approach even if you trust the author, because a tag can be moved or deleted if a bad actor gains access to the repository storing the action.

### Reusing third-party workflows

The same principles described above for using third-party actions also apply to using third-party workflows. You can help mitigate the risks associated with reusing workflows by following the same good practices outlined above. For more information, see [Reuse workflows](/en/actions/using-workflows/reusing-workflows).

## GitHub's security features

GitHub provides many features to make your code more secure. You can use GitHub's built-in features to understand the actions your workflows depend on, ensure you are notified about vulnerabilities in the actions you consume, or automate the process of keeping the actions in your workflows up to date. If you publish and maintain actions, you can use GitHub to communicate with your community about vulnerabilities and how to fix them. For more information about security features that GitHub offers, see [GitHub security features](/en/code-security/getting-started/github-security-features#about-githubs-security-features).

### Using `CODEOWNERS` to monitor changes

You can use the `CODEOWNERS` feature to control how changes are made to your workflow files. For example, if all your workflow files are stored  `.github/workflows`, you can add this directory to the code owners list, so that any proposed changes to these files will first require approval from a designated reviewer.

For more information, see [About code owners](/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).

### Using OpenID Connect to access cloud resources

If your GitHub Actions workflows need to access resources from a cloud provider that supports OpenID Connect (OIDC), you can configure your workflows to authenticate directly to the cloud provider. This will let you stop storing these credentials as long-lived secrets and provide other security benefits. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

> \[!NOTE]
> Support for custom claims for OIDC is unavailable in AWS.

### Using Dependabot version updates to keep actions up to date

You can use Dependabot to ensure that references to actions and reusable workflows used in your repository are kept up to date. Actions are often updated with bug fixes and new features to make automated processes faster, safer, and more reliable. Dependabot takes the effort out of maintaining your dependencies as it does this automatically for you. For more information, see [Keeping your actions up to date with Dependabot](/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot) and [About Dependabot security updates](/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates).

### Preventing GitHub Actions from creating or approving pull requests

You can choose to allow or prevent GitHub Actions workflows from creating or approving pull requests. Allowing workflows, or any other automation, to create or approve pull requests could be a security risk if the pull request is merged without proper oversight.

For more information on how to configure this setting, see  [Disabling or limiting GitHub Actions for your organization](/en/github/setting-up-and-managing-organizations-and-teams/disabling-or-limiting-github-actions-for-your-organization#preventing-github-actions-from-creating-or-approving-pull-requests), and [Managing GitHub Actions settings for a repository](/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#preventing-github-actions-from-creating-or-approving-pull-requests).

### Using code scanning to secure workflows

Code scanning can automatically detect and suggest improvements for common vulnerable patterns used in GitHub Actions workflows.
For more information on how to enable code scanning, see [Configuring default setup for code scanning](/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning).

### Using OpenSSF Scorecards to secure workflow dependencies

[Scorecards](https://github.com/ossf/scorecard) is an automated security tool that flags risky supply chain practices. You can use the [Scorecards action](https://github.com/marketplace/actions/ossf-scorecard-action) and [workflow template](https://github.com/actions/starter-workflows) to follow best security practices. Once configured, the Scorecards action runs automatically on repository changes, and alerts developers about risky supply chain practices using the built-in code scanning experience. The Scorecards project runs a number of checks, including script injection attacks, token permissions, and pinned actions.

### Hardening for GitHub-hosted runners

GitHub-hosted runners take measures to help you mitigate security risks.

#### Reviewing the supply chain for GitHub-hosted runners

For GitHub-hosted runners created from images maintained by GitHub, you can view a software bill of materials (SBOM) to see what software was pre-installed on the runner. You can provide your users with the SBOM which they can run through a vulnerability scanner to validate if there are any vulnerabilities in the product. If you are building artifacts, you can include this SBOM in your bill of materials for a comprehensive list of everything that went into creating your software.

SBOMs are available for Ubuntu, Windows, and macOS runner images maintained by GitHub. You can locate the SBOM for your build in the release assets at <https://github.com/actions/runner-images/releases>. An SBOM with a filename in the format of `sbom.IMAGE-NAME.json.zip` can be found in the attachments of each release.

For third-party images, such as the images for ARM-powered runners, you can find details of the software that's included in the image in the [`actions/partner-runner-images` repository](https://github.com/actions/partner-runner-images).

#### Denying access to hosts

GitHub-hosted runners are provisioned with an `etc/hosts` file that blocks network access to various cryptocurrency mining pools and malicious sites. Hosts such as MiningMadness.com and cpu-pool.com are rerouted to localhost so that they do not present a significant security risk. For more information, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners).

### Hardening for self-hosted runners

**GitHub-hosted** runners execute code within ephemeral and clean isolated virtual machines, meaning there is no way to persistently compromise this environment, or otherwise gain access to more information than was placed in this environment during the bootstrap process.

**Self-hosted** runners for GitHub do not have guarantees around running in ephemeral clean virtual machines, and can be persistently compromised by untrusted code in a workflow.

As a result, self-hosted runners should almost [never be used for public repositories](/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) on GitHub, because any user can open pull requests against the repository and compromise the environment. Similarly, be cautious when using self-hosted runners on private or internal repositories, as anyone who can fork the repository and open a pull request (generally those with read access to the repository) are able to compromise the self-hosted runner environment, including gaining access to secrets and the `GITHUB_TOKEN` which, depending on its settings, can grant write access to the repository. Although workflows can control access to environment secrets by using environments and required reviews, these workflows are not run in an isolated environment and are still susceptible to the same risks when run on a self-hosted runner.

Organization owners can choose which repositories are allowed to create repository-level self-hosted runners.

For more information, see [Disabling or limiting GitHub Actions for your organization](/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#limiting-the-use-of-self-hosted-runners).

When a self-hosted runner is defined at the organization or enterprise level, GitHub can schedule workflows from multiple repositories onto the same runner. Consequently, a security compromise of these environments can result in a wide impact. To help reduce the scope of a compromise, you can create boundaries by organizing your self-hosted runners into separate groups. You can restrict what organizations and repositories can access runner groups. For more information, see [Managing access to self-hosted runners using groups](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/managing-access-to-self-hosted-runners-using-groups).

You should also consider the environment of the self-hosted runner machines:

* What sensitive information resides on the machine configured as a self-hosted runner? For example, private SSH keys, API access tokens, among others.
* Does the machine have network access to sensitive services? For example, Azure or AWS metadata services. The amount of sensitive information in this environment should be kept to a minimum, and you should always be mindful that any user capable of invoking workflows has access to this environment.

Some customers might attempt to partially mitigate these risks by implementing systems that automatically destroy the self-hosted runner after each job execution. However, this approach might not be as effective as intended, as there is no way to guarantee that a self-hosted runner only runs one job. Some jobs will use secrets as command-line arguments which can be seen by another job running on the same runner, such as `ps x -w`. This can lead to secret leaks.

#### Using just-in-time runners

To improve runner registration security, you can use the REST API to create ephemeral, just-in-time (JIT) runners. These self-hosted runners perform at most one job before being automatically removed from the repository, organization, or enterprise. For more information about configuring JIT runners, see [REST API endpoints for self-hosted runners](/en/rest/actions/self-hosted-runners#create-configuration-for-a-just-in-time-runner-for-an-organization).

> \[!NOTE]
> Re-using hardware to host JIT runners can risk exposing information from the environment. Use automation to ensure the JIT runner uses a clean environment. For more information, see [Self-hosted runners reference](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/autoscaling-with-self-hosted-runners#using-ephemeral-runners-for-autoscaling).

Once you have the config file from the REST API response, you can pass it to the runner at startup.

```shell
./run.sh --jitconfig ${encoded_jit_config}
```

#### Planning your management strategy for self-hosted runners

A self-hosted runner can be added to various levels in your GitHub hierarchy: the enterprise, organization, or repository level. This placement determines who will be able to manage the runner:

**Centralized management:**

* If you plan to have a centralized team own the self-hosted runners, then the recommendation is to add your runners at the highest mutual organization or enterprise level. This gives your team a single location to view and manage your runners.
* If you only have a single organization, then adding your runners at the organization level is effectively the same approach, but you might encounter difficulties if you add another organization in the future.

**Decentralized management:**

* If each team will manage their own self-hosted runners, then the recommendation is to add the runners at the highest level of team ownership. For example, if each team owns their own organization, then it will be simplest if the runners are added at the organization level too.
* You could also add runners at the repository level, but this will add management overhead and also increases the numbers of runners you need, since you cannot share runners between repositories.

#### Authenticating to your cloud provider

If you are using GitHub Actions to deploy to a cloud provider, or intend to use HashiCorp Vault for secret management, then it's recommended that you consider using OpenID Connect to create short-lived, well-scoped access tokens for your workflow runs. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

### Auditing GitHub Actions events

You can use the security log to monitor activity for your user account and the audit log to monitor activity in your organization. The security and audit log records the type of action, when it was run, and which personal account performed the action.

For example, you can use the audit log to track the `org.update_actions_secret` event, which tracks changes to organization secrets.

![Screenshot showing a search for "action:org.update\_actions\_secret" in the audit log for an organization. Two results are shown.](/assets/images/help/repository/audit-log-entries.png)

For the full list of events that you can find in the audit log for each account type, see the following articles:

* [Security log events](/en/authentication/keeping-your-account-and-data-secure/security-log-events)
* [Audit log events for your organization](/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization)

### Understanding dependencies in your workflows

You can use the dependency graph to explore the actions that the workflows in your repository use. The dependency graph is a summary of the manifest and lock files stored in a repository. It also recognizes files in `./github/workflows/` as manifests, which means that any actions or workflows referenced using the syntax `jobs[*].steps[*].uses` or `jobs.<job_id>.uses` will be parsed as dependencies.

The dependency graph shows the following information about actions used in workflows:

* The account or organization that owns the action.
* The workflow file that references the action.
* The version or SHA the action is pinned to.

In the dependency graph, dependencies are automatically sorted by vulnerability severity. If any of the actions you use have security advisories, they will display at the top of the list. You can navigate to the advisory from the dependency graph and access instructions for resolving the vulnerability.

The dependency graph is enabled for public repositories, and you can choose to enable it on private repositories. For more information about using the dependency graph, see [Exploring the dependencies of a repository](/en/code-security/supply-chain-security/understanding-your-software-supply-chain/exploring-the-dependencies-of-a-repository).

### Being aware of security vulnerabilities in actions you use

For actions available on the marketplace, GitHub reviews related security advisories and then adds those advisories to the GitHub Advisory Database. You can search the database for actions that you use to find information about existing vulnerabilities and instructions for how to fix them. To streamline your search, use the GitHub Actions filter in the [GitHub Advisory Database](https://github.com/advisories?query=type%3Areviewed+ecosystem%3Aactions).

You can set up your repositories so that you:

* Receive alerts when actions used in your workflows receive a vulnerability report. For more information, see [Monitoring the actions in your workflows](#monitoring-the-actions-in-your-workflows).
* Are warned about existing advisories when you add or update an action in a workflow. For more information, see [Screening actions for vulnerabilities in new or updated workflows](#screening-actions-for-vulnerabilities-in-new-or-updated-workflows).

#### Monitoring the actions in your workflows

You can use Dependabot to monitor the actions in your workflows and enable Dependabot alerts to notify you when an action you use has a reported vulnerability. Dependabot performs a scan of the default branch of the repositories where it is enabled to detect insecure dependencies. Dependabot generates Dependabot alerts when a new advisory is added to the GitHub Advisory Database or when an action you use is updated.

> \[!NOTE]
> Dependabot only creates alerts for vulnerable actions that use semantic versioning and will not create alerts for actions pinned to SHA values.

You can enable Dependabot alerts for your personal account, for a repository, or for an organization. For more information, see [Configuring Dependabot alerts](/en/code-security/dependabot/dependabot-alerts/configuring-dependabot-alerts).

You can view all open and closed Dependabot alerts and corresponding Dependabot security updates in your repository's Dependabot alerts tab. For more information, see [Viewing and updating Dependabot alerts](/en/code-security/dependabot/dependabot-alerts/viewing-and-updating-dependabot-alerts).

#### Screening actions for vulnerabilities in new or updated workflows

When you open pull requests to update your workflows, it is good practice to use dependency review to understand the security impact of changes you've made to the actions you use. Dependency review helps you understand dependency changes and the security impact of these changes at every pull request. It provides an easily understandable visualization of dependency changes with a rich diff on the "Files Changed" tab of a pull request. Dependency review informs you of:

* Which dependencies were added, removed, or updated, along with the release dates
* How many projects use these components
* Vulnerability data for these dependencies

If any of the changes you made to your workflows are flagged as vulnerable, you can avoid adding them to your project or update them to a secure version.

For more information about dependency review, see [About dependency review](/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review).

The "dependency review action" refers to the specific action that can report on differences in a pull request within the GitHub Actions context. See [`dependency-review-action`](https://github.com/actions/dependency-review-action). You can use the dependency review action in your repository to enforce dependency reviews on your pull requests. The action scans for vulnerable versions of dependencies introduced by package version changes in pull requests, and warns you about the associated security vulnerabilities. This gives you better visibility of what's changing in a pull request, and helps prevent vulnerabilities being added to your repository. For more information, see [About dependency review](/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review#about-the-dependency-review-action).

### Keeping the actions in your workflows secure and up to date

You can use Dependabot to ensure that references to actions and reusable workflows used in your repository are kept up to date. Actions are often updated with bug fixes and new features to make automated processes faster, safer, and more reliable. Dependabot takes the effort out of maintaining your dependencies as it does this automatically for you. For more information, see [Keeping your actions up to date with Dependabot](/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot) and [About Dependabot security updates](/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates).

The following features can automatically update the actions in your workflows.

* **Dependabot version updates** open pull requests to update actions to the latest version when a new version is released.
* **Dependabot security updates** open pull requests to update actions with reported vulnerabilities to the minimum patched version.

> \[!NOTE]
>
> * Dependabot only supports updates to GitHub Actions using the GitHub repository syntax, such as `actions/checkout@v5` or `actions/checkout@<commit>` . Dependabot will ignore actions or reusable workflows referenced locally (for example, `./.github/actions/foo.yml`).
> * Dependabot updates the version documentation of GitHub Actions when the comment is on the same line, such as `actions/checkout@<commit> #<tag or link>` or `actions/checkout@<tag> #<tag or link>`.
> * If the commit you use is not associated with any tag, Dependabot will update the GitHub Actions to the latest commit (which might differ from the latest release).
> * Docker Hub and GitHub Packages Container registry URLs are currently not supported. For example, references to Docker container actions using `docker://` syntax aren't supported.
> * Dependabot supports both public and private repositories for GitHub Actions. For private registry configuration options, see "`git`" in [Dependabot options reference](/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#git).

For information on how to configure Dependabot version updates, see [Configuring Dependabot version updates](/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates).

For information on how to configure Dependabot security updates, see [Configuring Dependabot security updates](/en/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates).

### Protecting actions you've created

GitHub enables collaboration between people who publish and maintain actions and vulnerability reporters in order to promote secure coding. Repository security advisories allow maintainers of public repositories to privately discuss and fix a security vulnerability in a project. After collaborating on a fix, repository maintainers can publish the security advisory to publicly disclose the security vulnerability to the project's community. By publishing security advisories, repository maintainers make it easier for their community to update package dependencies and research the impact of the security vulnerabilities.

If you are someone who maintains an action that is used in other projects, you can use the following GitHub features to enhance the security of the actions you've published.

* Use the dependants view in the Dependency graph to see which projects depend on your code. If you receive a vulnerability report, this will give you an idea of who you need to communicate with about the vulnerability and how to fix it. For more information, see [Exploring the dependencies of a repository](/en/code-security/supply-chain-security/understanding-your-software-supply-chain/exploring-the-dependencies-of-a-repository#dependents-view).
* Use repository security advisories to create a security advisory, privately collaborate to fix the vulnerability in a temporary private fork, and publish a security advisory to alert your community of the vulnerability once a patch is released. For more information, see [Configuring private vulnerability reporting for a repository](/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository) and [Creating a repository security advisory](/en/code-security/security-advisories/working-with-repository-security-advisories/creating-a-repository-security-advisory).