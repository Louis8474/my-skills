# Secure Your Work

---

# Configuring OpenID Connect in Amazon Web Services

Use OpenID Connect within your workflows to authenticate with Amazon Web Services.

## Overview

OpenID Connect (OIDC) allows your GitHub Actions workflows to access resources in Amazon Web Services (AWS), without needing to store the AWS credentials as long-lived GitHub secrets.

This guide explains how to configure AWS to trust GitHub's OIDC as a federated identity, and includes a workflow example for the [`aws-actions/configure-aws-credentials`](https://github.com/aws-actions/configure-aws-credentials) that uses tokens to authenticate to AWS and access resources.

> \[!NOTE]
> Support for custom claims for OIDC is unavailable in AWS.

## Prerequisites

* To learn the basic concepts of how GitHub uses OpenID Connect (OIDC), and its architecture and benefits, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

* Before proceeding, you must plan your security strategy to ensure that access tokens are only allocated in a predictable way. To control how your cloud provider issues access tokens, you **must** define at least one condition, so that untrusted repositories can’t request access tokens for your cloud resources. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud).

## Adding the identity provider to AWS

To add the GitHub OIDC provider to IAM, see the [AWS documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html).

* For the provider URL: Use `https://token.actions.githubusercontent.com`
* For the "Audience": Use `sts.amazonaws.com` if you are using the [official action](https://github.com/aws-actions/configure-aws-credentials).

### Configuring the role and trust policy

To configure the role and trust in IAM, see the AWS documentation [Configure AWS Credentials for GitHub Actions](https://github.com/aws-actions/configure-aws-credentials#configure-aws-credentials-for-github-actions) and [Configuring a role for GitHub OIDC identity provider](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html#idp_oidc_Create_GitHub).

> \[!NOTE]
> AWS Identity and Access Management (IAM) recommends that users evaluate the IAM condition key, `token.actions.githubusercontent.com:sub`, in the trust policy of any role that trusts GitHub’s OIDC identity provider (IdP). Evaluating this condition key in the role trust policy limits which GitHub actions are able to assume the role.

Edit the trust policy, adding the `sub` field to the validation conditions. For example:

```json copy
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:octo-org/octo-repo:ref:refs/heads/octo-branch"
  }
}
```

If you use a workflow with an environment, the `sub` field must reference the environment name: `repo:ORG-NAME/REPO-NAME:environment:ENVIRONMENT-NAME`. For more information, see [OpenID Connect reference](/en/actions/reference/openid-connect-reference#filtering-for-a-specific-environment).

> \[!NOTE]
> When environments are used in workflows or in OIDC policies, we recommend adding protection rules to the environment for additional security. For example, you can configure deployment rules on an environment to restrict which branches and tags can deploy to the environment or access environment secrets. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment#deployment-protection-rules).

```json copy
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:octo-org/octo-repo:environment:prod"
  }
}
```

In the following example, `StringLike` is used with a wildcard operator (`*`) to allow any branch, pull request merge branch, or environment from the `octo-org/octo-repo` organization and repository to assume a role in AWS.

```json copy
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::123456123456:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": "repo:octo-org/octo-repo:*"
                },
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                }
            }
        }
    ]
}
```

## Updating your GitHub Actions workflow

To update your workflows for OIDC, you will need to make two changes to your YAML:

1. Add permissions settings for the token.
2. Use the [`aws-actions/configure-aws-credentials`](https://github.com/aws-actions/configure-aws-credentials) action to exchange the OIDC token (JWT) for a cloud access token.

### Adding permissions settings

The job or workflow run requires a `permissions` setting with [`id-token: write`](/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token) to allow GitHub's OIDC provider to create a JSON Web Token for every run.

> \[!NOTE] Setting `id-token: write` in the workflow’s permissions does not give the workflow permission to modify or write to any resources. Instead, it only allows the workflow to request (fetch) and use (set) an OIDC token for an action or step. This token is then used to authenticate with external services using a short-lived access token.

For detailed information on required permissions, configuration examples, and advanced scenarios, see [OpenID Connect reference](/en/actions/reference/openid-connect-reference##workflow-permissions-for-the-requesting-the-oidc-token).

### Requesting the access token

The `aws-actions/configure-aws-credentials` action receives a JWT from the GitHub OIDC provider, and then requests an access token from AWS. For more information, see the AWS [documentation](https://github.com/aws-actions/configure-aws-credentials).

* `BUCKET-NAME`: Replace this with the name of your S3 bucket.
* `AWS-REGION`: Replace this with the name of your AWS region.
* `ROLE-TO-ASSUME`: Replace this with your AWS role. For example, `arn:aws:iam::1234567890:role/example-role`

```yaml copy
# Sample workflow to access AWS resources when workflow is tied to branch
# The workflow creates a static website using Amazon S3
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
name: AWS example workflow
on:
  push
env:
  BUCKET_NAME : "BUCKET-NAME"
  AWS_REGION : "AWS-REGION"
# permission can be added at job level or workflow level
permissions:
  id-token: write   # This is required for requesting the JWT
  contents: read    # This is required for actions/checkout
jobs:
  S3PackageUpload:
    runs-on: ubuntu-latest
    steps:
      - name: Git clone the repository
        uses: actions/checkout@v5
      - name: configure aws credentials
        uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
        with:
          role-to-assume: ROLE-TO-ASSUME
          role-session-name: samplerolesession
          aws-region: ${{ env.AWS_REGION }}
      # Upload a file to AWS s3
      - name: Copy index.html to s3
        run: |
          aws s3 cp ./index.html s3://${{ env.BUCKET_NAME }}/
```

## Further reading

* [Using OpenID Connect with reusable workflows](/en/actions/deployment/security-hardening-your-deployments/using-openid-connect-with-reusable-workflows)
* [Self-hosted runners reference](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/communicating-with-self-hosted-runners)
---

# Configuring OpenID Connect in Azure

Use OpenID Connect within your workflows to authenticate with Azure.

## Overview

OpenID Connect (OIDC) allows your GitHub Actions workflows to access resources in Azure, without needing to store the Azure credentials as long-lived GitHub secrets.

This guide gives an overview of how to configure Azure to trust GitHub's OIDC as a federated identity, and includes a workflow example for the [`azure/login`](https://github.com/Azure/login) action that uses tokens to authenticate to Azure and access resources.

## Prerequisites

* To learn the basic concepts of how GitHub uses OpenID Connect (OIDC), and its architecture and benefits, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

* Before proceeding, you must plan your security strategy to ensure that access tokens are only allocated in a predictable way. To control how your cloud provider issues access tokens, you **must** define at least one condition, so that untrusted repositories can’t request access tokens for your cloud resources. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud).

## Adding the federated credentials to Azure

GitHub's OIDC provider works with Azure's workload identity federation. For an overview, see Microsoft's documentation at [Workload identity federation](https://docs.microsoft.com/en-us/azure/active-directory/develop/workload-identity-federation).

To configure the OIDC identity provider in Azure, you will need to perform the following configuration. For instructions on making these changes, refer to [the Azure documentation](https://docs.microsoft.com/en-us/azure/developer/github/connect-from-azure).

In the following procedure, you will create an application for Microsoft Entra ID (previously known as Azure AD).

1. Create an Entra ID application and a service principal.
2. Add federated credentials for the Entra ID application.
3. Create GitHub secrets for storing Azure configuration.

Additional guidance for configuring the identity provider:

* For security hardening, make sure you've reviewed [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud). For an example, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-subject-in-your-cloud-provider).
* For the `audience` setting, `api://AzureADTokenExchange` is the recommended value, but you can also specify other values here.

## Updating your GitHub Actions workflow

To update your workflows for OIDC, you will need to make two changes to your YAML:

1. Add permissions settings for the token.
2. Use the [`azure/login`](https://github.com/Azure/login) action to exchange the OIDC token (JWT) for a cloud access token.

> \[!NOTE]
> When environments are used in workflows or in OIDC policies, we recommend adding protection rules to the environment for additional security. For example, you can configure deployment rules on an environment to restrict which branches and tags can deploy to the environment or access environment secrets. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment#deployment-protection-rules).

### Adding permissions settings

The job or workflow run requires a `permissions` setting with [`id-token: write`](/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token) to allow GitHub's OIDC provider to create a JSON Web Token for every run.

> \[!NOTE] Setting `id-token: write` in the workflow’s permissions does not give the workflow permission to modify or write to any resources. Instead, it only allows the workflow to request (fetch) and use (set) an OIDC token for an action or step. This token is then used to authenticate with external services using a short-lived access token.

For detailed information on required permissions, configuration examples, and advanced scenarios, see [OpenID Connect reference](/en/actions/reference/openid-connect-reference##workflow-permissions-for-the-requesting-the-oidc-token).

### Requesting the access token

The [`azure/login`](https://github.com/Azure/login) action receives a JWT from the GitHub OIDC provider, and then requests an access token from Azure. For more information, see the [`azure/login`](https://github.com/Azure/login) documentation.

The following example exchanges an OIDC ID token with Azure to receive an access token, which can then be used to access cloud resources.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
name: Run Azure Login with OIDC
on: [push]

permissions:
  id-token: write
  contents: read
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 'Az CLI login'
        uses: azure/login@8c334a195cbb38e46038007b304988d888bf676a
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: 'Run az commands'
        run: |
          az account show
          az group list
```

## Further reading

* [Using OpenID Connect with reusable workflows](/en/actions/deployment/security-hardening-your-deployments/using-openid-connect-with-reusable-workflows)
* [Self-hosted runners reference](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/communicating-with-self-hosted-runners)
---

# Configuring OpenID Connect in cloud providers

Use OpenID Connect within your workflows to authenticate with cloud providers.

## Overview

OpenID Connect (OIDC) allows your GitHub Actions workflows to access resources in your cloud provider, without having to store any credentials as long-lived GitHub secrets.

To use OIDC, you will first need to configure your cloud provider to trust GitHub's OIDC as a federated identity, and must then update your workflows to authenticate using tokens.

## Prerequisites

* To learn the basic concepts of how GitHub uses OpenID Connect (OIDC), and its architecture and benefits, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

* Before proceeding, you must plan your security strategy to ensure that access tokens are only allocated in a predictable way. To control how your cloud provider issues access tokens, you **must** define at least one condition, so that untrusted repositories can’t request access tokens for your cloud resources. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud).

## Updating your GitHub Actions workflow

To update your workflows for OIDC, you will need to make two changes to your YAML:

1. Add permissions settings for the token.
2. Use the official action from your cloud provider to exchange the OIDC token (JWT) for a cloud access token.

If your cloud provider doesn't yet offer an official action, you can update your workflows to perform these steps manually.

> \[!NOTE]
> When environments are used in workflows or in OIDC policies, we recommend adding protection rules to the environment for additional security. For example, you can configure deployment rules on an environment to restrict which branches and tags can deploy to the environment or access environment secrets. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment#deployment-protection-rules).

### Adding permissions settings

The job or workflow run requires a `permissions` setting with [`id-token: write`](/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token) to allow GitHub's OIDC provider to create a JSON Web Token for every run.

> \[!NOTE] Setting `id-token: write` in the workflow’s permissions does not give the workflow permission to modify or write to any resources. Instead, it only allows the workflow to request (fetch) and use (set) an OIDC token for an action or step. This token is then used to authenticate with external services using a short-lived access token.

For detailed information on required permissions, configuration examples, and advanced scenarios, see [OpenID Connect reference](/en/actions/reference/openid-connect-reference##workflow-permissions-for-the-requesting-the-oidc-token).

### Using official actions

If your cloud provider has created an official action for using OIDC with GitHub Actions, it will allow you to easily exchange the OIDC token for an access token. You can then update your workflows to use this token when accessing cloud resources.

For example, Alibaba Cloud created [`aliyun/configure-aliyun-credentials-action`](https://github.com/aliyun/configure-aliyun-credentials-action) to integrate with using OIDC with GitHub.

## Using custom actions

If your cloud provider doesn't have an official action, or if you prefer to create custom scripts, you can manually request the JSON Web Token (JWT) from GitHub's OIDC provider.

If you're not using an official action, then GitHub recommends that you use the Actions core toolkit. Alternatively, you can use the following environment variables to retrieve the token: `ACTIONS_ID_TOKEN_REQUEST_TOKEN`, `ACTIONS_ID_TOKEN_REQUEST_URL`.

To update your workflows using this approach, you will need to make three changes to your YAML:

1. Add permissions settings for the token.
2. Add code that requests the OIDC token from GitHub's OIDC provider.
3. Add code that exchanges the OIDC token with your cloud provider for an access token.

### Requesting the JWT using the Actions core toolkit

The following example demonstrates how to use `actions/github-script` with the `core` toolkit to request the JWT from GitHub's OIDC provider. For more information, see [Creating a JavaScript action](/en/actions/creating-actions/creating-a-javascript-action#adding-actions-toolkit-packages).

```yaml
jobs:
  job:
    environment: Production
    runs-on: ubuntu-latest
    steps:
    - name: Install OIDC Client from Core Package
      run: npm install @actions/core@1.6.0 @actions/http-client
    - name: Get Id Token
      uses: actions/github-script@v8
      id: idtoken
      with:
        script: |
          const coredemo = require('@actions/core')
          let id_token = await coredemo.getIDToken()
          coredemo.setOutput('id_token', id_token)
```

### Requesting the JWT using environment variables

The following example demonstrates how to use environment variables to request a JSON Web Token.

For your deployment job, you will need to define the token settings, using `actions/github-script` with the `core` toolkit. For more information, see [Creating a JavaScript action](/en/actions/creating-actions/creating-a-javascript-action#adding-actions-toolkit-packages).

For example:

```yaml
jobs:
  job:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/github-script@v8
      id: script
      timeout-minutes: 10
      with:
        debug: true
        script: |
          const token = process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN']
          const runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL']
          core.setOutput('TOKEN', token.trim())
          core.setOutput('IDTOKENURL', runtimeUrl.trim())
```

You can then use `curl` to retrieve a JWT from the GitHub OIDC provider. For example:

```yaml
    - run: |
        IDTOKEN=$(curl -H "Authorization: Bearer ${{steps.script.outputs.TOKEN}}" ${{steps.script.outputs.IDTOKENURL}}  -H "Accept: application/json; api-version=2.0" -H "Content-Type: application/json" -d "{}" | jq -r '.value')
        echo $IDTOKEN
        jwtd() {
            if [[ -x $(command -v jq) ]]; then
                jq -R 'split(".") | .[0],.[1] | @base64d | fromjson' <<< "${1}"
                echo "Signature: $(echo "${1}" | awk -F'.' '{print $3}')"
            fi
        }
        jwtd $IDTOKEN
        echo "idToken=${IDTOKEN}" >> $GITHUB_OUTPUT
      id: tokenid
```

### Getting the access token from the cloud provider

You will need to present the OIDC JSON web token to your cloud provider in order to obtain an access token.

For each deployment, your workflows must use cloud login actions (or custom scripts) that fetch the OIDC token and present it to your cloud provider. The cloud provider then validates the claims in the token; if successful, it provides a cloud access token that is available only to that job run. The provided access token can then be used by subsequent actions in the job to connect to the cloud and deploy to its resources.

The steps for exchanging the OIDC token for an access token will vary for each cloud provider.

### Accessing resources in your cloud provider

Once you've obtained the access token, you can use specific cloud actions or scripts to authenticate to the cloud provider and deploy to its resources. These steps could differ for each cloud provider.

For example, Alibaba Cloud maintains their own instructions for OIDC authentication. For more information, see [Overview of OIDC-based SSO](https://www.alibabacloud.com/help/en/ram/user-guide/overview-of-oidc-based-sso) in the Alibaba Cloud documentation.

In addition, the default expiration time of this access token could vary between each cloud and can be configurable at the cloud provider's side.

## Further reading

* [Using OpenID Connect with reusable workflows](/en/actions/deployment/security-hardening-your-deployments/using-openid-connect-with-reusable-workflows)
* [Self-hosted runners reference](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/communicating-with-self-hosted-runners)
---

# Configuring OpenID Connect in Google Cloud Platform

Use OpenID Connect within your workflows to authenticate with Google Cloud Platform.

## Overview

OpenID Connect (OIDC) allows your GitHub Actions workflows to access resources in Google Cloud Platform (GCP), without needing to store the GCP credentials as long-lived GitHub secrets.

This guide gives an overview of how to configure GCP to trust GitHub's OIDC as a federated identity, and includes a workflow example for the [`google-github-actions/auth`](https://github.com/google-github-actions/auth) action that uses tokens to authenticate to GCP and access resources.

## Prerequisites

* To learn the basic concepts of how GitHub uses OpenID Connect (OIDC), and its architecture and benefits, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

* Before proceeding, you must plan your security strategy to ensure that access tokens are only allocated in a predictable way. To control how your cloud provider issues access tokens, you **must** define at least one condition, so that untrusted repositories can’t request access tokens for your cloud resources. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud).

## Adding a Google Cloud Workload Identity Provider

To configure the OIDC identity provider in GCP, you will need to perform the following configuration. For instructions on making these changes, refer to [the GCP documentation](https://github.com/google-github-actions/auth).

1. Create a new identity pool.
2. Configure the mapping and add conditions.
3. Connect the new pool to a service account.

Additional guidance for configuring the identity provider:

* For security hardening, make sure you've reviewed [Configuring the OIDC trust with the cloud](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud). For an example, see [Configuring the subject in your cloud provider](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-subject-in-your-cloud-provider).
* For the service account to be available for configuration, it needs to be assigned to the `roles/iam.workloadIdentityUser` role. For more information, see [the GCP documentation](https://cloud.google.com/iam/docs/workload-identity-federation?_ga=2.114275588.-285296507.1634918453#conditions).
* The Issuer URL to use: `https://token.actions.githubusercontent.com`

## Updating your GitHub Actions workflow

To update your workflows for OIDC, you will need to make two changes to your YAML:

1. Add permissions settings for the token.
2. Use the [`google-github-actions/auth`](https://github.com/google-github-actions/auth) action to exchange the OIDC token (JWT) for a cloud access token.

> \[!NOTE]
> When environments are used in workflows or in OIDC policies, we recommend adding protection rules to the environment for additional security. For example, you can configure deployment rules on an environment to restrict which branches and tags can deploy to the environment or access environment secrets. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment#deployment-protection-rules).

### Adding permissions settings

The job or workflow run requires a `permissions` setting with [`id-token: write`](/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token) to allow GitHub's OIDC provider to create a JSON Web Token for every run.

> \[!NOTE] Setting `id-token: write` in the workflow’s permissions does not give the workflow permission to modify or write to any resources. Instead, it only allows the workflow to request (fetch) and use (set) an OIDC token for an action or step. This token is then used to authenticate with external services using a short-lived access token.

For detailed information on required permissions, configuration examples, and advanced scenarios, see [OpenID Connect reference](/en/actions/reference/openid-connect-reference##workflow-permissions-for-the-requesting-the-oidc-token).

### Requesting the access token

The `google-github-actions/auth` action receives a JWT from the GitHub OIDC provider, and then requests an access token from GCP. For more information, see the GCP [documentation](https://github.com/google-github-actions/auth).

This example has a job called `Get_OIDC_ID_token` that uses actions to request a list of services from GCP.

* `WORKLOAD-IDENTITY-PROVIDER`: Replace this with the path to your identity provider in GCP. For example, `projects/example-project-id/locations/global/workloadIdentityPools/name-of-pool/providers/name-of-provider`
* `SERVICE-ACCOUNT`: Replace this with the name of your service account in GCP.

This action exchanges a GitHub OIDC token for a Google Cloud access token, using [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation).

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
name: List services in GCP
on:
  pull_request:
    branches:
      - main

permissions:
  id-token: write

jobs:
  Get_OIDC_ID_token:
    runs-on: ubuntu-latest
    steps:
    - id: 'auth'
      name: 'Authenticate to GCP'
      uses: 'google-github-actions/auth@f1e2d3c4b5a6f7e8d9c0b1a2c3d4e5f6a7b8c9d0'
      with:
          create_credentials_file: 'true'
          workload_identity_provider: 'WORKLOAD-IDENTITY-PROVIDER'
          service_account: 'SERVICE-ACCOUNT'
    - id: 'gcloud'
      name: 'gcloud'
      run: |-
        gcloud auth login --brief --cred-file="${{ steps.auth.outputs.credentials_file_path }}"
        gcloud services list
```

## Further reading

* [Using OpenID Connect with reusable workflows](/en/actions/deployment/security-hardening-your-deployments/using-openid-connect-with-reusable-workflows)
* [Self-hosted runners reference](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/communicating-with-self-hosted-runners)
---

# Configuring OpenID Connect in HashiCorp Vault

Use OpenID Connect within your workflows to authenticate with HashiCorp Vault.

## Overview

OpenID Connect (OIDC) allows your GitHub Actions workflows to authenticate with a HashiCorp Vault to retrieve secrets.

This guide gives an overview of how to configure HashiCorp Vault to trust GitHub's OIDC as a federated identity, and demonstrates how to use this configuration in the [hashicorp/vault-action](https://github.com/hashicorp/vault-action) action to retrieve secrets from HashiCorp Vault.

## Prerequisites

* To learn the basic concepts of how GitHub uses OpenID Connect (OIDC), and its architecture and benefits, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

* Before proceeding, you must plan your security strategy to ensure that access tokens are only allocated in a predictable way. To control how your cloud provider issues access tokens, you **must** define at least one condition, so that untrusted repositories can’t request access tokens for your cloud resources. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud).

## Adding the identity provider to HashiCorp Vault

To use OIDC with HashiCorp Vault, you will need to add a trust configuration for the GitHub OIDC provider. For more information, see the HashiCorp Vault [documentation](https://www.vaultproject.io/docs/auth/jwt).

To configure your Vault server to accept JSON Web Tokens (JWT) for authentication:

1. Enable the JWT `auth` method, and use `write` to apply the configuration to your Vault.
   For `oidc_discovery_url` and `bound_issuer` parameters, use `https://token.actions.githubusercontent.com`. These parameters allow the Vault server to verify the received JSON Web Tokens (JWT) during the authentication process.

   ```shell copy
   vault auth enable jwt
   ```

   ```shell copy
   vault write auth/jwt/config \
     bound_issuer="https://token.actions.githubusercontent.com" \
     oidc_discovery_url="https://token.actions.githubusercontent.com"
   ```

2. Configure a policy that only grants access to the specific paths your workflows will use to retrieve secrets. For more advanced policies, see the HashiCorp Vault [Policies documentation](https://www.vaultproject.io/docs/concepts/policies).

   ```shell copy
   vault policy write myproject-production - <<EOF
   # Read-only permission on 'secret/data/production/*' path

   path "secret/data/production/*" {
     capabilities = [ "read" ]
   }
   EOF
   ```

3. Configure roles to group different policies together. If the authentication is successful, these policies are attached to the resulting Vault access token.

   ```shell copy
   vault write auth/jwt/role/myproject-production -<<EOF
   {
     "role_type": "jwt",
     "user_claim": "actor",
     "bound_claims": {
       "repository": "user-or-org-name/repo-name"
     },
     "policies": ["myproject-production"],
     "ttl": "10m"
   }
   EOF
   ```

* `ttl` defines the validity of the resulting access token.
* Ensure that the `bound_claims` parameter is defined for your security requirements, and has at least one condition. Optionally, you can also set the `bound_subject` as well as the `bound_audiences` parameter.
* To check arbitrary claims in the received JWT payload, the `bound_claims` parameter contains a set of claims and their required values. In the above example, the role will accept any incoming authentication requests from the `repo-name` repository owned by the `user-or-org-name` account.
* To see all the available claims supported by GitHub's OIDC provider, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud).

For more information, see the HashiCorp Vault [documentation](https://www.vaultproject.io/docs/auth/jwt).

## Updating your GitHub Actions workflow

To update your workflows for OIDC, you will need to make two changes to your YAML:

1. Add permissions settings for the token.
2. Use the [`hashicorp/vault-action`](https://github.com/hashicorp/vault-action) action to exchange the OIDC token (JWT) for a cloud access token.

> \[!NOTE]
> When environments are used in workflows or in OIDC policies, we recommend adding protection rules to the environment for additional security. For example, you can configure deployment rules on an environment to restrict which branches and tags can deploy to the environment or access environment secrets. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment#deployment-protection-rules).

To add OIDC integration to your workflows that allow them to access secrets in Vault, you will need to add the following code changes:

* Grant permission to fetch the token from the GitHub OIDC provider:
  * The workflow needs `permissions:` settings with the `id-token` value set to `write`. This lets you fetch the OIDC token from every job in the workflow.
* Request the JWT from the GitHub OIDC provider, and present it to HashiCorp Vault to receive an access token:
  * You can use the [`hashicorp/vault-action`](https://github.com/hashicorp/vault-action) action to fetch the JWT and receive the access token from Vault, or you could use the [Actions toolkit](https://github.com/actions/toolkit/) to fetch the tokens for your job.

This example demonstrates how to use OIDC with the official action to request a secret from HashiCorp Vault.

### Adding permissions settings

The job or workflow run requires a `permissions` setting with [`id-token: write`](/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token) to allow GitHub's OIDC provider to create a JSON Web Token for every run.

> \[!NOTE] Setting `id-token: write` in the workflow’s permissions does not give the workflow permission to modify or write to any resources. Instead, it only allows the workflow to request (fetch) and use (set) an OIDC token for an action or step. This token is then used to authenticate with external services using a short-lived access token.

For detailed information on required permissions, configuration examples, and advanced scenarios, see [OpenID Connect reference](/en/actions/reference/openid-connect-reference##workflow-permissions-for-the-requesting-the-oidc-token).

> \[!NOTE]
> When the `permissions` key is used, all unspecified permissions are set to *no access*, with the exception of the metadata scope, which always gets *read* access. As a result, you may need to add other permissions, such as `contents: read`. See [Automatic token authentication](/en/actions/security-guides/automatic-token-authentication) for more information.

### Requesting the access token

The `hashicorp/vault-action` action receives a JWT from the GitHub OIDC provider, and then requests an access token from your HashiCorp Vault instance to retrieve secrets. For more information, see the HashiCorp Vault GitHub Action [documentation](https://github.com/hashicorp/vault-action).

This example demonstrates how to create a job that requests a secret from HashiCorp Vault.

* `VAULT-URL`: Replace this with the URL of your HashiCorp Vault.
* `VAULT-NAMESPACE`: Replace this with the Namespace you've set in HashiCorp Vault. For example: `admin`.
* `ROLE-NAME`: Replace this with the role you've set in the HashiCorp Vault trust relationship.
* `SECRET-PATH`: Replace this with the path to the secret you're retrieving from HashiCorp Vault. For example: `secret/data/production/ci npmToken`.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
jobs:
  retrieve-secret:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Retrieve secret from Vault
        uses: hashicorp/vault-action@9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b
        with:
          method: jwt
          url: VAULT-URL
          namespace: VAULT-NAMESPACE # HCP Vault and Vault Enterprise only
          role: ROLE-NAME
          secrets: SECRET-PATH

      - name: Use secret from Vault
        run: |
          # This step has access to the secret retrieved above; see hashicorp/vault-action for more details.
```

> \[!NOTE]
>
> * If your Vault server is not accessible from the public network, consider using a self-hosted runner with other available Vault [auth methods](https://www.vaultproject.io/docs/auth). For more information, see [Self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners).
> * `VAULT-NAMESPACE` must be set for a Vault Enterprise (including HCP Vault) deployment. For more information, see [Vault namespace](https://www.vaultproject.io/docs/enterprise/namespaces).

### Revoking the access token

By default, the Vault server will automatically revoke access tokens when their TTL is expired, so you don't have to manually revoke the access tokens. However, if you do want to revoke access tokens immediately after your job has completed or failed, you can manually revoke the issued token using the [Vault API](https://www.vaultproject.io/api/auth/token#revoke-a-token-self).

1. Set the `exportToken` option to `true` (default: `false`). This exports the issued Vault access token as an environment variable: `VAULT_TOKEN`.
2. Add a step to call the [Revoke a Token (Self)](https://www.vaultproject.io/api/auth/token#revoke-a-token-self) Vault API to revoke the access token.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
jobs:
  retrieve-secret:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Retrieve secret from Vault
        uses: hashicorp/vault-action@9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b
        with:
          exportToken: true
          method: jwt
          url: VAULT-URL
          role: ROLE-NAME
          secrets: SECRET-PATH

      - name: Use secret from Vault
        run: |
          # This step has access to the secret retrieved above; see hashicorp/vault-action for more details.

      - name: Revoke token
        # This step always runs at the end regardless of the previous steps result
        if: always()
        run: |
          curl -X POST -sv -H "X-Vault-Token: ${{ env.VAULT_TOKEN }}" \
            VAULT-URL/v1/auth/token/revoke-self
```

## Further reading

* [Using OpenID Connect with reusable workflows](/en/actions/deployment/security-hardening-your-deployments/using-openid-connect-with-reusable-workflows)
* [Self-hosted runners reference](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/communicating-with-self-hosted-runners)
---

# Configuring OpenID Connect in JFrog

Use OpenID Connect within your workflows to authenticate with JFrog.

## Overview

OpenID Connect (OIDC) allows your GitHub Actions workflows to authenticate with [JFrog](https://jfrog.com/) to download and publish artifacts without storing JFrog passwords, tokens, or API keys in GitHub.

This guide gives an overview of how to configure JFrog to trust GitHub's OIDC as a federated identity, and demonstrates how to use this configuration in a GitHub Actions workflow.

For an example GitHub Actions workflow, see [Sample GitHub Actions Integration](https://jfrog.com/help/r/jfrog-platform-administration-documentation/sample-github-actions-integration) in the JFrog documentation.

For an example GitHub Actions workflow using the JFrog CLI, see [`build-publish.yml`](https://github.com/jfrog/jfrog-github-oidc-example/blob/main/.github/workflows/build-publish.yml) in the `jfrog-github-oidc-example` repository.

## Prerequisites

* To learn the basic concepts of how GitHub uses OpenID Connect (OIDC), and its architecture and benefits, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

* Before proceeding, you must plan your security strategy to ensure that access tokens are only allocated in a predictable way. To control how your cloud provider issues access tokens, you **must** define at least one condition, so that untrusted repositories can’t request access tokens for your cloud resources. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud).

* To be secure, you need to set a Claims JSON in JFrog when configuring identity mappings. For more information, see [AUTOTITLE](https://jfrog.com/help/r/jfrog-platform-administration-documentation/configure-identity-mappings) and [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#customizing-the-token-claims).

  For example, you can set `iss` to `https://token.actions.githubusercontent.com`, and the `repository` to something like "octo-org/octo-repo"\`. This will ensure only Actions workflows from the specified repository will have access to your JFrog platform. The following is an example Claims JSON when configuring identity mappings.

  ```json copy
  {
      "iss": "https://token.actions.githubusercontent.com",
      "repository": "octo-org/octo-repo"
  }
  ```

## Adding the identity provider to JFrog

To use OIDC with JFrog, establish a trust relationship between GitHub Actions and the JFrog platform. For more information about this process, see [OpenID Connect Integration](https://jfrog.com/help/r/jfrog-platform-administration-documentation/openid-connect-integration) in the JFrog documentation.

1. Sign in to your JFrog Platform.
2. Configure trust between JFrog and your GitHub Actions workflows.
3. Configure identity mappings.

## Updating your GitHub Actions workflow

### Authenticating with JFrog using OIDC

In your GitHub Actions workflow file, ensure you are using the provider name and audience you configured in the JFrog Platform.

The following example uses the placeholders `YOUR_PROVIDER_NAME` and `YOUR_AUDIENCE`.

```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
permissions:
  id-token: write
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Set up JFrog CLI with OIDC
        id: setup-jfrog-cli
        uses: jfrog/setup-jfrog-cli@29fa5190a4123350e81e2a2e8d803b2a27fed15e
        with:
          JF_URL: ${{ env.JF_URL }}
          oidc-provider-name: 'YOUR_PROVIDER_NAME'
          oidc-audience: 'YOUR_AUDIENCE' # This is optional

      - name: Upload artifact
        run: jf rt upload "dist/*.zip" my-repo/

```

> \[!TIP]
> When OIDC authentication is used, the `setup-jfrog-cli` action automatically provides `oidc-user` and `oidc-token` as step outputs.
> These can be used for other integrations that require authentication with JFrog.
> To reference these outputs, ensure the step has an explicit `id` defined (for example `id: setup-jfrog-cli`).

### Using OIDC Credentials in other steps

```yaml
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
      - name: Sign in to Artifactory Docker registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.JF_URL }}
          username: ${{ steps.setup-jfrog-cli.outputs.oidc-user }}
          password: ${{ steps.setup-jfrog-cli.outputs.oidc-token }}
```

## Further reading

* [OpenID Connect Integration](https://jfrog.com/help/r/jfrog-platform-administration-documentation/openid-connect-integration) in the JFrog documentation
* [Identity Mappings](https://jfrog.com/help/r/jfrog-platform-administration-documentation/identity-mappings) in the JFrog documentation
* [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
---

# Configuring OpenID Connect in Octopus Deploy

Use OpenID Connect within your workflows to authenticate with Octopus Deploy.

## Overview

OpenID Connect (OIDC) allows your GitHub Actions workflows to authenticate with [Octopus Deploy](https://octopus.com/) to push packages, create releases or trigger deployments without storing Octopus Deploy passwords or API keys as long-lived GitHub secrets.

This guide provides an overview of how to configure Octopus Deploy to trust GitHub's OIDC as a federated identity, and includes a workflow example for the [`octopusdeploy/login`](https://github.com/OctopusDeploy/login) action that uses tokens to authenticate to your Octopus Deploy instance.

## Prerequisites

* To learn the basic concepts of how GitHub uses OpenID Connect (OIDC), and its architecture and benefits, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

* Before proceeding, you must plan your security strategy to ensure that access tokens are only allocated in a predictable way. To control how your cloud provider issues access tokens, you **must** define at least one condition, so that untrusted repositories can’t request access tokens for your cloud resources. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud).

## Adding the identity provider to Octopus Deploy

To use OIDC with Octopus Deploy, first establish a trust relationship between GitHub Actions and your Octopus Deploy instance. For more information about this process, see [Using OpenID Connect with the Octopus API](https://octopus.com/docs/octopus-rest-api/openid-connect) in the Octopus Deploy documentation.

1. Sign in to your Octopus Deploy instance.
2. Create or open the Service Account that will be granted access via the token request.
3. Configure a new OIDC Identity, defining the relevant subject that the GitHub Actions workflow token request will be validated against.

## Updating your GitHub Actions workflow

To update your workflows for OIDC, you will need to make two changes to your YAML:

1. Add permissions settings for the token.
2. Use the [`OctopusDeploy/login`](https://github.com/OctopusDeploy/login) action to exchange the OIDC token (JWT) for a cloud access token.

> \[!NOTE]
> When environments are used in workflows or in OIDC policies, we recommend adding protection rules to the environment for additional security. For example, you can configure deployment rules on an environment to restrict which branches and tags can deploy to the environment or access environment secrets. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment#deployment-protection-rules).

### Adding permissions settings

The job or workflow run requires a `permissions` setting with [`id-token: write`](/en/actions/security-guides/automatic-token-authentication#modifying-the-permissions-for-the-github_token) to allow GitHub's OIDC provider to create a JSON Web Token for every run.

> \[!NOTE] Setting `id-token: write` in the workflow’s permissions does not give the workflow permission to modify or write to any resources. Instead, it only allows the workflow to request (fetch) and use (set) an OIDC token for an action or step. This token is then used to authenticate with external services using a short-lived access token.

For detailed information on required permissions, configuration examples, and advanced scenarios, see [OpenID Connect reference](/en/actions/reference/openid-connect-reference##workflow-permissions-for-the-requesting-the-oidc-token).

### Requesting the access token

The [`OctopusDeploy/login`](https://github.com/OctopusDeploy/login) action receives a JWT from the GitHub OIDC provider, and then requests an access token from your Octopus Server instance. For more information, see the [`OctopusDeploy/login`](https://github.com/OctopusDeploy/login) documentation.

The following example exchanges an OIDC ID token with your Octopus Deploy instance to receive an access token, which can then be used to access your Octopus Deploy resources. Be sure to replace the `server` and `service_account_id` details appropriately for your scenario.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

jobs:
  create_release_in_octopus:
    runs-on: ubuntu-latest
    name: Create a release in Octopus
    permissions:
      # You might need to add other permissions here like `contents: read` depending on what else your job needs to do
      id-token: write # This is required to obtain an ID token from GitHub Actions for the job
    steps:
      - name: Login to Octopus
        uses: OctopusDeploy/login@34b6dcc1e86fa373c14e6a28c5507d221e4de629 #v1.0.2
        with:
          server: https://my.octopus.app
          service_account_id: 5be4ac10-2679-4041-a8b0-7b05b445e19e

      - name: Create a release in Octopus
        uses: OctopusDeploy/create-release-action@fe13cc69c1c037cb7bb085981b152f5e35257e1f #v3.2.2
        with:
          space: Default
          project: My Octopus Project
```

## Further reading

* [Using OpenID Connect with reusable workflows](/en/actions/deployment/security-hardening-your-deployments/using-openid-connect-with-reusable-workflows)
* [Self-hosted runners reference](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/communicating-with-self-hosted-runners)
---

# Configuring OpenID Connect in PyPI

Use OpenID Connect within your workflows to authenticate with PyPI.

## Overview

OpenID Connect (OIDC) allows your GitHub Actions workflows to authenticate with [PyPI](https://pypi.org) to publish Python packages.

This guide gives an overview of how to configure PyPI to trust GitHub's OIDC as a federated identity, and demonstrates how to use this configuration in the [`pypa/gh-action-pypi-publish`](https://github.com/marketplace/actions/pypi-publish) action to publish packages to PyPI (or other Python package repositories) without any manual API token management.

## Prerequisites

* To learn the basic concepts of how GitHub uses OpenID Connect (OIDC), and its architecture and benefits, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

* Before proceeding, you must plan your security strategy to ensure that access tokens are only allocated in a predictable way. To control how your cloud provider issues access tokens, you **must** define at least one condition, so that untrusted repositories can’t request access tokens for your cloud resources. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud).

## Adding the identity provider to PyPI

To use OIDC with PyPI, add a trust configuration that links each project on PyPI to each repository and workflow combination that's allowed to publish for it.

1. Sign in to PyPI and navigate to the trusted publishing settings for the project you'd like to configure. For a project named `myproject`, this will be at `https://pypi.org/manage/project/myproject/settings/publishing/`.

2. Configure a trust relationship between the PyPI project and a GitHub repository (and workflow within the repository). For example, if your GitHub repository is at `myorg/myproject` and your release workflow is defined in `release.yml` with an environment of `release`, you should use the following settings for your trusted publisher on PyPI.

   > \[!NOTE]
   > Enter these values carefully. Giving the incorrect user, repository, or workflow the ability to publish to your PyPI project is equivalent to sharing an API token.

   * Owner: `myorg`
   * Repository name: `myproject`
   * Workflow name: `release.yml`
   * (Optionally) a GitHub Actions environment name: `release`

## Updating your GitHub Actions workflow

Once your trusted publisher is registered on PyPI, you can update your release workflow to use trusted publishing.

> \[!NOTE]
> When environments are used in workflows or in OIDC policies, we recommend adding protection rules to the environment for additional security. For example, you can configure deployment rules on an environment to restrict which branches and tags can deploy to the environment or access environment secrets. For more information, see [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment#deployment-protection-rules).

The [`pypa/gh-action-pypi-publish`](https://github.com/marketplace/actions/pypi-publish) action has built-in support for trusted publishing, which can be enabled by giving its containing job the `id-token: write` permission and omitting `username` and `password`.

The following example uses the `pypa/gh-action-pypi-publish` action to exchange an OIDC token for a PyPI API token, which is then used to upload a package's release distributions to PyPI.

```yaml copy
# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
jobs:
  release-build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-python@v5
        with:
          python-version: "3.x"

      - name: build release distributions
        run: |
          # NOTE: put your own distribution build steps here.
          python -m pip install build
          python -m build

      - name: upload windows dists
        uses: actions/upload-artifact@v4
        with:
          name: release-dists
          path: dist/

  pypi-publish:
    runs-on: ubuntu-latest
    needs:
      - release-build
    permissions:
      id-token: write

    steps:
      - name: Retrieve release distributions
        uses: actions/download-artifact@v5
        with:
          name: release-dists
          path: dist/

      - name: Publish release distributions to PyPI
        uses: pypa/gh-action-pypi-publish@3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f
```
---

# Using OpenID Connect with reusable workflows

You can use reusable workflows with OIDC to standardize and security harden your deployment steps.

## About reusable workflows

Rather than copying and pasting deployment jobs from one workflow to another, you can create a reusable workflow that performs the deployment steps. A reusable workflow can be used by another workflow if it meets one of the access requirements described in [Reuse workflows](/en/actions/using-workflows/reusing-workflows#access-to-reusable-workflows).

You should be familiar with the concepts described in [Reuse workflows](/en/actions/using-workflows/reusing-workflows) and [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).

## Defining the trust conditions

When combined with OpenID Connect (OIDC), reusable workflows let you enforce consistent deployments across your repository, organization, or enterprise. You can do this by defining trust conditions on cloud roles based on reusable workflows. The available options will vary depending on your cloud provider:

* **Using `job_workflow_ref`:**
  * To create trust conditions based on reusable workflows, your cloud provider must support custom claims for `job_workflow_ref`. This allows your cloud provider to identify which repository the job originally came from.
  * For clouds that only support the standard claims (audience (`aud`) and subject (`sub`)), you can use the API to customize the `sub` claim to include `job_workflow_ref`. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#customizing-the-token-claims). Support for custom claims is currently available for Google Cloud Platform and HashiCorp Vault.

* **Customizing the token claims:**
  * You can configure more granular trust conditions by customizing the subject (`sub`) claim that's included with the JWT. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#customizing-the-token-claims).

## How the token works with reusable workflows

During a workflow run, GitHub's OIDC provider presents an OIDC token to the cloud provider which contains information about the job. If that job is part of a reusable workflow, the token will include the standard claims that contain information about the calling workflow, and will also include a custom claim called `job_workflow_ref` that contains information about the called workflow.

For example, the following OIDC token is for a job that was part of a called workflow. The `workflow`, `ref`, and other attributes describe the caller workflow, while `job_workflow_ref` refers to the called workflow:

```yaml copy
{
  "typ": "JWT",
  "alg": "RS256",
  "x5t": "example-thumbprint",
  "kid": "example-key-id"
}
{
  "jti": "example-id",
  "sub": "repo:octo-org/octo-repo:environment:prod",
  "aud": "https://github.com/octo-org",
  "ref": "refs/heads/main",
  "sha": "example-sha",
  "repository": "octo-org/octo-repo",
  "repository_owner": "octo-org",
  "actor_id": "12",
  "repository_id": "74",
  "repository_owner_id": "65",
  "run_id": "example-run-id",
  "run_number": "10",
  "run_attempt": "2",
  "actor": "octocat",
  "workflow": "example-workflow",
  "head_ref": "",
  "base_ref": "",
  "event_name": "workflow_dispatch",
  "ref_type": "branch",
  "job_workflow_ref": "octo-org/octo-automation/.github/workflows/oidc.yml@refs/heads/main",
  "iss": "https://token.actions.githubusercontent.com",
  "nbf": 1632492967,
  "exp": 1632493867,
  "iat": 1632493567
}
```

If your reusable workflow performs deployment steps, then it will typically need access to a specific cloud role, and you might want to allow any repository in your organization to call that reusable workflow. To permit this, you'll create the trust condition that allows any repository and any caller workflow, and then filter on the organization and the called workflow. See the next section for some examples.

## Examples

**Filtering for reusable workflows within a specific repository**

You can configure a custom claim that filters for any reusable workflow in a specific repository. In this example, the workflow run must have originated from a job defined in a reusable workflow in the `octo-org/octo-automation` repository, and in any repository that is owned by the `octo-org` organization.

* **Subject:**
  * Syntax: `repo:ORG_NAME/*`
  * Example: `repo:octo-org/*`

* **Custom claim:**
  * Syntax: `job_workflow_ref:ORG_NAME/REPO_NAME`
  * Example: `job_workflow_ref:octo-org/octo-automation@*`

**Filtering for a specific reusable workflow at a specific ref**

You can configure a custom claim that filters for a specific reusable workflow. In this example, the workflow run must have originated from a job defined in the reusable workflow `octo-org/octo-automation/.github/workflows/deployment.yml`, and in any repository that is owned by the `octo-org` organization.

* **Subject:**
  * Syntax: `repo:ORG_NAME/*`
  * Example: `repo:octo-org/*`

* **Custom claim:**
  * Syntax: `job_workflow_ref:ORG_NAME/REPO_NAME/.github/workflows/WORKFLOW_FILE@ref`
  * Example: `job_workflow_ref:octo-org/octo-automation/.github/workflows/deployment.yml@ 10040c56a8c0253d69db7c1f26a0d227275512e2`
---

# Enforcing artifact attestations with a Kubernetes admission controller

Use an admission controller to enforce artifact attestations in your Kubernetes cluster.

> \[!NOTE] Before proceeding, ensure you have enabled build provenance for container images, including setting the `push-to-registry` attribute in the [`attest` action](https://github.com/actions/attest) as documented in [Generating build provenance for container images](/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds#generating-build-provenance-for-container-images). This is required for the Policy Controller to verify the attestation.

## Getting started with Kubernetes admission controller

To set up an admission controller for enforcing GitHub artifact attestations, you need to:

1. [Deploy the Sigstore Policy Controller](#deploy-the-sigstore-policy-controller).
2. [Add the GitHub `TrustRoot` and a `ClusterImagePolicy` to your cluster](#add-the-github-trustroot-and-a-clusterimagepolicy).
3. [Enable the policy in your namespace](#enable-the-policy-in-your-namespace).

### Deploy the Sigstore Policy Controller

The Sigstore Policy Controller has been packaged and made available via a [Helm chart](https://github.com/sigstore/helm-charts). Before you begin, ensure you have the following prerequisites:

* A Kubernetes cluster with version 1.27 or later
* [Helm](https://helm.sh/docs/intro/install/) 3.0 or later
* [kubectl](https://kubernetes.io/docs/tasks/tools/)

First, install the Helm chart that deploys the Sigstore Policy Controller:

```bash copy
helm upgrade policy-controller --install --atomic \
  --create-namespace --namespace artifact-attestations \
  oci://ghcr.io/sigstore/helm-charts/policy-controller \
  --version 0.10.5
```

This installs the Policy Controller into the `artifact-attestations` namespace. At this point, no policies have been configured, and it will not enforce any attestations.

### Add the GitHub `TrustRoot` and a `ClusterImagePolicy`

Once the policy controller has been deployed, you need to add the GitHub `TrustRoot` and a `ClusterImagePolicy` to your cluster. Use the Helm chart we provide to do this. Make sure to replace `MY-ORGANIZATION` with your GitHub organization's name (e.g., `github` or `octocat-inc`).

```bash copy
helm upgrade trust-policies --install --atomic \
 --namespace artifact-attestations \
 oci://ghcr.io/github/artifact-attestations-helm-charts/trust-policies \
 --version v0.7.0 \
 --set policy.enabled=true \
 --set policy.organization=MY-ORGANIZATION
```

You've now installed the GitHub trust root, and an artifact attestation policy into your cluster. This policy will reject artifacts that have not originated from within your GitHub organization.

### Enable the policy in your namespace

> \[!WARNING]
> This policy will not be enforced until you specify which namespaces it should apply to.

Each namespace in your cluster can independently enforce policies. To enable enforcement in a namespace, you can add the following label to the namespace:

```yaml
metadata:
  labels:
    policy.sigstore.dev/include: "true"
```

After the label is added, the GitHub artifact attestation policy will be enforced in the namespace.

Alternatively, you may run:

```bash copy
kubectl label namespace MY-NAMESPACE policy.sigstore.dev/include=true
```

### Matching images

By default, the policy installed with the `trust-policies` Helm chart will verify attestations for all images before admitting them into the cluster. If you only intend to enforce attestations for a subset of images, you can use the Helm values `policy.images` and `policy.exemptImages` to specify a list of images to match against. These values can be set to a list of glob patterns that match the image names. The globbing syntax uses Go [filepath](https://pkg.go.dev/path/filepath#Match) semantics, with the addition of `**` to match any character sequence, including slashes.

For example, to enforce attestations for images that match the pattern `ghcr.io/MY-ORGANIZATION/*` and admit `busybox` without a valid attestation, you can run:

```bash copy
helm upgrade trust-policies --install --atomic \
 --namespace artifact-attestations \
 oci://ghcr.io/github/artifact-attestations-helm-charts/trust-policies \
 --version v0.7.0 \
 --set policy.enabled=true \
 --set policy.organization=MY-ORGANIZATION \
 --set-json 'policy.exemptImages=["index.docker.io/library/busybox**"]' \
 --set-json 'policy.images=["ghcr.io/MY-ORGANIZATION/**"]'
```

All patterns must use the fully-qualified name, even if the images originate from Docker Hub. In this example, if we want to exempt the image `busybox`, we must provide the full name including the domain and double-star glob to match all image versions: `index.docker.io/library/busybox**`.

Note that any image you intend to admit *must* have a matching glob pattern in the `policy.images` list. If an image does not match any pattern, it will be rejected. Additionally, if an image matches both `policy.images` and `policy.exemptImages`, it will be rejected.

### Advanced usage

To see the full set of options you may configure with the Helm chart, you can run either of the following commands.
For policy controller options:

```bash copy
helm show values oci://ghcr.io/sigstore/helm-charts/policy-controller --version 0.10.5
```

For trust policy options:

```bash copy
helm show values oci://ghcr.io/github/artifact-attestations-helm-charts/trust-policies --version v0.7.0
```

For more information on the Sigstore Policy Controller, see the [Sigstore Policy Controller documentation](https://docs.sigstore.dev/policy-controller/overview/).
---

# Using artifact attestations and reusable workflows to achieve SLSA v1 Build Level 3

Building software with reusable workflows and artifact attestations can streamline your supply chain security and help you achieve SLSA v1.0 Build Level 3.

## Prerequisites

Before starting this guide, you should be familiar with:

* The usage and security benefits of artifact attestations. See [Artifact attestations](/en/actions/concepts/security/artifact-attestations).
* Generating artifact attestations. See [Using artifact attestations to establish provenance for builds](/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds).
* Writing and using reusable workflows. See [Reuse workflows](/en/actions/using-workflows/reusing-workflows).

## Step 1: Configuring your builds

First, we need to build with both artifact attestations and a reusable workflow.

### Building with a reusable workflow

If you aren't already using reusable workflows to build your software, you'll need to take your build steps and move them into a reusable workflow.

### Building with artifact attestations

The reusable workflow you use to build your software must also generate artifact attestations to establish build provenance.

When you use a reusable workflow to generate artifact attestations, both the calling workflow and the reusable workflow need to have the following permissions.

```yaml copy
permissions:
  attestations: write
  contents: read
  id-token: write
```

If you are building container images, you will also need to include the `packages: write` permission.

## Step 2: Verifying artifact attestations built with a reusable workflow

To verify the artifact attestations generated with your builds, you can use [`gh attestation verify`](https://cli.github.com/manual/gh_attestation_verify) from the GitHub CLI.

The `gh attestation verify` command requires either `--owner` or `--repo` flags to be used with it. These flags do two things.

* They tell `gh attestation verify` where to fetch the attestation from. This will always be your caller workflow.
* They tell `gh attestation verify` where the workflow that did the signing came from. This will always be the workflow that uses the [`attest` action](https://github.com/actions/attest), which may be a reusable workflow.

You can use optional flags with the `gh attestation verify` command.

* If your reusable workflow is not in the same repository as the caller workflow, use the `--signer-repo` flag to specify the repository that contains the reusable workflow.
* If you would like to require an artifact attestation to be signed with a specific workflow, use the `--signer-workflow` flag to indicate the workflow file that should be used.

For example, if your calling workflow is `ORGANIZATION_NAME/REPOSITORY_NAME/.github/workflows/calling.yml` and it uses `REUSABLE_ORGANIZATION_NAME/REUSABLE_REPOSITORY_NAME/.github/workflows/reusable.yml` you could do:

```bash copy
gh attestation verify -o ORGANIZATION_NAME --signer-repo REUSABLE_ORGANIZATION_NAME/REUSABLE_REPOSITORY_NAME PATH/TO/YOUR/BUILD/ARTIFACT-BINARY
```

Or if you want to specify the exact workflow:

```bash copy
gh attestation verify -o ORGANIZATION_NAME --signer-workflow REUSABLE_ORGANIZATION_NAME/REUSABLE_REPOSITORY_NAME/.github/workflows/reusable.yml PATH/TO/YOUR/BUILD/ARTIFACT-BINARY
```
---

# Managing the lifecycle of artifact attestations

Search for and delete attestations that you no longer need.

Attestations are only meaningful when they are linked to artifacts that people consume. To keep your attestations relevant and manageable, you should delete attestations that are no longer needed, such as:

* Attestations created by accident
* Attestations linked to artifacts that no longer exist
* Attestations linked to artifacts that consumers should no longer trust

When consumers have a verification process in place, deleting an attestation can prevent the associated artifact from being used. Consider setting up automations to ensure that attestations are deleted when the associated artifact is removed from an external service (for example, an image is deleted from a container registry).

## Finding attestations

1. Navigate to the repository where the attestation was produced.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, under "Management," click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-verified" aria-label="verified" role="img"><path d="m9.585.52.929.68c.153.112.331.186.518.215l1.138.175a2.678 2.678 0 0 1 2.24 2.24l.174 1.139c.029.187.103.365.215.518l.68.928a2.677 2.677 0 0 1 0 3.17l-.68.928a1.174 1.174 0 0 0-.215.518l-.175 1.138a2.678 2.678 0 0 1-2.241 2.241l-1.138.175a1.17 1.17 0 0 0-.518.215l-.928.68a2.677 2.677 0 0 1-3.17 0l-.928-.68a1.174 1.174 0 0 0-.518-.215L3.83 14.41a2.678 2.678 0 0 1-2.24-2.24l-.175-1.138a1.17 1.17 0 0 0-.215-.518l-.68-.928a2.677 2.677 0 0 1 0-3.17l.68-.928c.112-.153.186-.331.215-.518l.175-1.14a2.678 2.678 0 0 1 2.24-2.24l1.139-.175c.187-.029.365-.103.518-.215l.928-.68a2.677 2.677 0 0 1 3.17 0ZM7.303 1.728l-.927.68a2.67 2.67 0 0 1-1.18.489l-1.137.174a1.179 1.179 0 0 0-.987.987l-.174 1.136a2.677 2.677 0 0 1-.489 1.18l-.68.928a1.18 1.18 0 0 0 0 1.394l.68.927c.256.348.424.753.489 1.18l.174 1.137c.078.509.478.909.987.987l1.136.174a2.67 2.67 0 0 1 1.18.489l.928.68c.414.305.979.305 1.394 0l.927-.68a2.67 2.67 0 0 1 1.18-.489l1.137-.174a1.18 1.18 0 0 0 .987-.987l.174-1.136a2.67 2.67 0 0 1 .489-1.18l.68-.928a1.176 1.176 0 0 0 0-1.394l-.68-.927a2.686 2.686 0 0 1-.489-1.18l-.174-1.137a1.179 1.179 0 0 0-.987-.987l-1.136-.174a2.677 2.677 0 0 1-1.18-.489l-.928-.68a1.176 1.176 0 0 0-1.394 0ZM11.28 6.78l-3.75 3.75a.75.75 0 0 1-1.06 0L4.72 8.78a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L7 8.94l3.22-3.22a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path></svg> Attestations**.
4. The attestations are sorted by creation date, newest first. Use the "Search or filter" bar to search for an attestation or filter the results.

### Searching and filtering

Enter **free text** to search by subject name. This returns all attestations with subject names that partially match your search string. Multiple attestations can have the same subject name.

Use the `created` filter to filter by creation date. To enter a custom date range, click today's date then edit the default query.

* For example: `created:<2025-04-03`.
* Supported operators: `> <`.

Use the `predicate` filter to filter by the kind of attestation. A predicate is the type of claim that an attestation makes about an artifact, such as "this artifact was built during a particular workflow run and originates from this repository."

* Provenance attestations were created with the `attest` action.
* SBOM attestations were created with the `attest` action using the `sbom-path` input.
* Custom predicate type patterns are **not** supported in the search field, but are supported by the API.

## Deleting attestations

Before deleting an attestation, we recommend downloading a copy of it. Once the attestation is deleted, consumers with a verification process in place will **no longer be able to use the associated artifact**, and you will no longer be able to find the attestation on GitHub.

1. In the list of attestations, select the checkbox next to the attestations you want to delete. You can select multiple attestations at a time.
2. Click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-trash" aria-label="trash" role="img"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path></svg> Delete**.
3. Read the message, then confirm by clicking **Delete attestations**.

## Managing attestations with the API

To manage attestations in bulk with the REST API, see [REST API endpoints for artifact attestations](/en/rest/users/attestations).
---

# Using artifact attestations to establish provenance for builds

Artifact attestations enable you to increase the supply chain security of your builds by establishing where and how your software was built.

## Prerequisites

Before you start generating artifact attestations, you need to understand what they are and when you should use them. See [Artifact attestations](/en/actions/concepts/security/artifact-attestations).

## Generating artifact attestations for your builds

You can use GitHub Actions to generate artifact attestations that establish build provenance for artifacts such as binaries and container images.

To generate an artifact attestation, you must:

* Ensure you have the appropriate permissions configured in your workflow.
* Include a step in your workflow that uses the [`attest` action](https://github.com/actions/attest).

When you run your updated workflows, they will build your artifacts and generate an artifact attestation that establishes build provenance. You can view attestations in your repository's **Actions** tab. For more information, see the [`attest`](https://github.com/actions/attest) repository.

### Generating build provenance for binaries

1. In the workflow that builds the binary you would like to attest, add the following permissions.

   ```yaml
   permissions:
     id-token: write
     contents: read
     attestations: write
   ```

2. After the step where the binary has been built, add the following step.

   ```yaml
   - name: Generate artifact attestation
     uses: actions/attest@v4
     with:
       subject-path: 'PATH/TO/ARTIFACT'
   ```

   The value of the `subject-path` parameter should be set to the path to the binary you want to attest.

### Generating build provenance for container images

1. In the workflow that builds the container image you would like to attest, add the following permissions.

   ```yaml
   permissions:
     id-token: write
     contents: read
     attestations: write
     packages: write
   ```

2. After the step where the image has been built, add the following step.

   ```yaml
   - name: Generate artifact attestation
     uses: actions/attest@v4
     with:
       subject-name: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
       subject-digest: 'sha256:fedcba0...'
       push-to-registry: true
   ```

   The value of the `subject-name` parameter should specify the fully-qualified image name. For example, `ghcr.io/user/app` or `acme.azurecr.io/user/app`. Do not include a tag as part of the image name.

   The value of the `subject-digest` parameter should be set to the SHA256 digest of the subject for the attestation, in the form `sha256:HEX_DIGEST`. If your workflow uses `docker/build-push-action`, you can use the [`digest`](https://github.com/docker/build-push-action?tab=readme-ov-file#outputs) output from that step to supply the value. For more information on using outputs, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idoutputs).

## Generating an attestation for a software bill of materials (SBOM)

You can generate signed SBOM attestations for workflow artifacts.

To generate an attestation for an SBOM, you must:

* Ensure you have the appropriate permissions configured in your workflow.
* Create an SBOM for your artifact. For more information, see [`anchore-sbom-action`](https://github.com/marketplace/actions/anchore-sbom-action) in the GitHub Marketplace.
* Include a step in your workflow that uses the [`attest` action](https://github.com/actions/attest) with the `sbom-path` input.

When you run your updated workflows, they will build your artifacts and generate an SBOM attestation. You can view attestations in your repository's **Actions** tab. For more information, see the [`attest`](https://github.com/actions/attest) repository.

### Generating an SBOM attestation for binaries

1. In the workflow that builds the binary you would like to attest, add the following permissions.

   ```yaml
   permissions:
     id-token: write
     contents: read
     attestations: write
   ```

2. After the step where the binary has been built, add the following step.

   ```yaml
   - name: Generate SBOM attestation
     uses: actions/attest@v4
     with:
       subject-path: 'PATH/TO/ARTIFACT'
       sbom-path: 'PATH/TO/SBOM'
   ```

   The value of the `subject-path` parameter should be set to the path of the binary the SBOM describes. The value of the `sbom-path` parameter should be set to the path of the SBOM file you generated.

### Generating an SBOM attestation for container images

1. In the workflow that builds the container image you would like to attest, add the following permissions.

   ```yaml
   permissions:
     id-token: write
     contents: read
     attestations: write
     packages: write
   ```

2. After the step where the image has been built, add the following step.

   ```yaml
   - name: Generate SBOM attestation
     uses: actions/attest@v4
     with:
       subject-name: ${{ env.REGISTRY }}/PATH/TO/IMAGE
       subject-digest: 'sha256:fedcba0...'
       sbom-path: 'sbom.json'
       push-to-registry: true
   ```

   The value of the `subject-name` parameter should specify the fully-qualified image name. For example, `ghcr.io/user/app` or `acme.azurecr.io/user/app`. Do not include a tag as part of the image name.

   The value of the `subject-digest` parameter should be set to the SHA256 digest of the subject for the attestation, in the form `sha256:HEX_DIGEST`. If your workflow uses `docker/build-push-action`, you can use the [`digest`](https://github.com/docker/build-push-action?tab=readme-ov-file#outputs) output from that step to supply the value. For more information on using outputs, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idoutputs).

   The value of the `sbom-path` parameter should be set to the path to the JSON-formatted SBOM file you want to attest.

## Uploading artifacts to the linked artifacts page

We recommend uploading attested assets to your organization's linked artifacts page. This page displays artifacts' build history, deployment records, and storage details. You can use this data to prioritize security alerts or quickly connect vulnerable artifacts to their owning team, source code, and build run. For more information, see [About linked artifacts](/en/code-security/concepts/supply-chain-security/linked-artifacts).

The [attest](https://github.com/actions/attest) action automatically creates storage records on the linked artifacts page if both:

* The `push-to-registry` option is set to `true`
* The workflow that includes the action has the `artifact-metadata: write` permission

For an example workflow, see [Uploading storage and deployment data to the linked artifacts page](/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/upload-linked-artifacts#generating-an-attestation).

## Verifying artifact attestations with the GitHub CLI

You can validate artifact attestations for binaries and container images and validate SBOM attestations using the GitHub CLI. For more information, see the [`attestation`](https://cli.github.com/manual/gh_attestation) section of the GitHub CLI manual.

> \[!NOTE]These commands assume you are in an online environment. If you are in an offline or air-gapped environment, see [Verifying attestations offline](/en/actions/security-guides/verifying-attestations-offline).

### Verifying an artifact attestation for binaries

To verify artifact attestations for **binaries**, use the following GitHub CLI command.

```bash copy
gh attestation verify PATH/TO/YOUR/BUILD/ARTIFACT-BINARY -R ORGANIZATION_NAME/REPOSITORY_NAME
```

### Verifying an artifact attestation for container images

To verify artifact attestations for **container images**, you must provide the image's FQDN prefixed with `oci://` instead of the path to a binary. You can use the following GitHub CLI command.

```bash copy
docker login ghcr.io

gh attestation verify oci://ghcr.io/ORGANIZATION_NAME/IMAGE_NAME:test -R ORGANIZATION_NAME/REPOSITORY_NAME
```

### Verifying an attestation for SBOMs

To verify SBOM attestations, you have to provide the `--predicate-type` flag to reference a non-default predicate. For more information, see [Vetted predicates](https://github.com/in-toto/attestation/tree/main/spec/predicates#vetted-predicates) in the `in-toto/attestation` repository.

For example, the [`attest` action](https://github.com/actions/attest) currently supports either SPDX or CycloneDX SBOM predicates. To verify an SBOM attestation in the SPDX format, you can use the following GitHub CLI command.

```bash copy
gh attestation verify PATH/TO/YOUR/BUILD/ARTIFACT-BINARY \
  -R ORGANIZATION_NAME/REPOSITORY_NAME \
  --predicate-type https://spdx.dev/Document/v2.3
```

To view more information on the attestation, reference the `--format json` flag. This can be especially helpful when reviewing SBOM attestations.

```bash copy
gh attestation verify PATH/TO/YOUR/BUILD/ARTIFACT-BINARY \
  -R ORGANIZATION_NAME/REPOSITORY_NAME \
  --predicate-type https://spdx.dev/Document/v2.3 \
  --format json \
  --jq '.[].verificationResult.statement.predicate'
```

## Next steps

To keep your attestations relevant and manageable, you should delete attestations that are no longer needed. See [Managing the lifecycle of artifact attestations](/en/actions/how-tos/security-for-github-actions/using-artifact-attestations/managing-the-lifecycle-of-artifact-attestations).

You can also generate release attestations to help consumers verify the integrity and origin of your releases. For more information, see [Immutable releases](/en/code-security/supply-chain-security/understanding-your-software-supply-chain/immutable-releases).
---

# Verifying attestations offline

Artifact attestations can be verified without an internet connection.

## Prerequisites

Before starting this guide, you should be generating artifact attestations for your builds. See [Using artifact attestations to establish provenance for builds](/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds).

## Step 1: Download attestation bundle

First, get the attestation bundle from the attestation API.

You can do so with the following command from a machine that is online:

```bash copy
gh attestation download PATH/TO/YOUR/BUILD/ARTIFACT-BINARY -R ORGANIZATION_NAME/REPOSITORY_NAME
```

Here is example output from that command:

```bash
Wrote attestations to file sha256:ae57936def59bc4c75edd3a837d89bcefc6d3a5e31d55a6fa7a71624f92c3c3b.jsonl.
Any previous content has been overwritten

The trusted metadata is now available at sha256:ae57936def59bc4c75edd3a837d89bcefc6d3a5e31d55a6fa7a71624f92c3c3b.jsonl
```

## Step 2: Download trusted roots

Next, get the key material from the trusted roots.

Artifact attestations uses the Sigstore public good instance for public repositories, and GitHub's Sigstore instance for private repositories. You can use one command to get both trusted roots:

```bash copy
gh attestation trusted-root > trusted_root.jsonl
```

### Updating trusted root information in an offline environment

It's best practice to generate a new `trusted_root.jsonl` file any time you are importing new signed material into your offline environment.

The key material in `trusted_root.jsonl` does not have a built-in expiration date, so anything signed before you generate the trusted root file will continue to successfully verify. Anything signed after the file is generated will verify until that Sigstore instance rotates its key material, which typically happens a few times per year. You will not know if key material has been revoked since you last generated the trusted root file.

## Step 3: Perform offline verification

Now, you are ready to verify the artifact offline.

You should import into your offline environment:

* GitHub CLI
* Your artifact
* The bundle file
* The trusted root file

You can then perform offline verification with the following command:

```bash copy
gh attestation verify PATH/TO/YOUR/BUILD/ARTIFACT-BINARY -R ORGANIZATION_NAME/REPOSITORY_NAME --bundle sha256:ae57936def59bc4c75edd3a837d89bcefc6d3a5e31d55a6fa7a71624f92c3c3b.jsonl --custom-trusted-root trusted_root.jsonl
```