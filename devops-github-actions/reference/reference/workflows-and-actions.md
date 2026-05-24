# Workflows and Actions Reference

---

# Dependency caching reference

Find information on the functionality of dependency caching in workflows.

## `cache` action usage

The [`cache` action](https://github.com/actions/cache) will attempt the following sequence when restoring a cache:

1. First, it searches for an exact match to your provided `key`.
2. If no exact match is found, it will search for partial matches of the `key`.
3. If there is still no match found, and you've provided `restore-keys`, these keys will be checked sequentially for partial matches. For more information, see [Cache key matching](#cache-key-matching).

If there is an exact match to the provided `key`, this is considered a cache hit. If no cache exactly matches the provided `key`, this is considered a cache miss. On a cache miss, the action automatically creates a new cache if the job completes successfully. The new cache will use the `key` you provided and contains the files you specify in `path`. For more information about how this is handled, see [Cache hits and misses](#cache-hits-and-misses).

You cannot change the contents of an existing cache. Instead, you can create a new cache with a new key.

### Input parameters for the `cache` action

* `key`: **Required** The key created when saving a cache and the key used to search for a cache. It can be any combination of variables, context values, static strings, and functions. Keys have a maximum length of 512 characters, and keys longer than the maximum length will cause the action to fail.

* `path`: **Required** The path(s) on the runner to cache or restore.
  * You can specify a single path, or you can add multiple paths on separate lines. For example:

    ```yaml
    - name: Cache Gradle packages
      uses: actions/cache@v4
      with:
        path: |
          ~/.gradle/caches
          ~/.gradle/wrapper
    ```

  * You can specify either directories or single files, and glob patterns are supported.

  * You can specify absolute paths, or paths relative to the workspace directory.

* `restore-keys`: **Optional** A string containing alternative restore keys, with each restore key placed on a new line. If no cache hit occurs for `key`, these restore keys are used sequentially in the order provided to find and restore a cache. For example:

  ```yaml
  restore-keys: |
    npm-feature-${{ hashFiles('package-lock.json') }}
    npm-feature-
    npm-
  ```

* `enableCrossOsArchive`: **Optional** A boolean value that when enabled, allows Windows runners to save or restore caches independent of the operating system the cache was created on. If this parameter is not set, it defaults to `false`. For more information, see [Cross OS cache](https://github.com/actions/cache/blob/main/tips-and-workarounds.md#cross-os-cache) in the Actions Cache documentation.

> \[!NOTE]
> We recommend that you don't store any sensitive information, such as access tokens or login credentials, in files in the cache path. Anyone with read access can create a pull request on a repository and access the contents of a cache. Additionally, forks of a repository can create pull requests on the base branch and access caches on the base branch.

### Output parameters for the `cache` action

* `cache-hit`: A boolean value to indicate an exact match was found for the key.

### Cache hits and misses

When `key` exactly matches an existing cache, it's called a *cache hit*, and the action restores the cached files to the `path` directory.

When `key` doesn't match an existing cache, it's called a *cache miss*, and a new cache is automatically created if the job completes successfully.

When a cache miss occurs, the action also searches your specified `restore-keys` for any matches:

1. If you provide `restore-keys`, the `cache` action sequentially searches for any caches that match the list of `restore-keys`.
   * When there is an exact match, the action restores the files in the cache to the `path` directory.
   * If there are no exact matches, the action searches for partial matches of the restore keys. When the action finds a partial match, the most recent cache is restored to the `path` directory.
2. The `cache` action completes and the next step in the job runs.
3. If the job completes successfully, the action automatically creates a new cache with the contents of the `path` directory.

For a more detailed explanation of the cache matching process, see [Cache key matching](#cache-key-matching).

### Example using the `cache` action

This example creates a new cache when the packages in `package-lock.json` file change, or when the runner's operating system changes. The cache key uses contexts and expressions to generate a key that includes the runner's operating system and a SHA-256 hash of the `package-lock.json` file.

```yaml copy
name: Caching with npm
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: Cache node modules
        id: cache-npm
        uses: actions/cache@v4
        env:
          cache-name: cache-node-modules
        with:
          # npm cache files are stored in `~/.npm` on Linux/macOS
          path: ~/.npm
          key: ${{ runner.os }}-build-${{ env.cache-name }}-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-build-${{ env.cache-name }}-
            ${{ runner.os }}-build-
            ${{ runner.os }}-

      - if: ${{ steps.cache-npm.outputs.cache-hit != 'true' }}
        name: List the state of node modules
        continue-on-error: true
        run: npm list

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Test
        run: npm test
```

### Using contexts to create cache keys

A cache key can include any of the contexts, functions, literals, and operators supported by GitHub Actions. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts) and [Evaluate expressions in workflows and actions](/en/actions/learn-github-actions/expressions).

Using expressions to create a `key` allows you to automatically create a new cache when dependencies change.

For example, you can create a `key` using an expression that calculates the hash of an npm `package-lock.json` file. So, when the dependencies that make up the `package-lock.json` file change, the cache key changes and a new cache is automatically created.

```yaml
npm-${{ hashFiles('package-lock.json') }}
```

GitHub evaluates the expression `hash "package-lock.json"` to derive the final `key`.

```yaml
npm-d5ea0750
```

### Using the output of the `cache` action

You can use the output of the `cache` action to do something based on whether a cache hit or miss occurred. When an exact match is found for a cache for the specified `key`, the `cache-hit` output is set to `true`.

In the example workflow above, there is a step that lists the state of the Node modules if a cache miss occurred:

```yaml
- if: ${{ steps.cache-npm.outputs.cache-hit != 'true' }}
  name: List the state of node modules
  continue-on-error: true
  run: npm list
```

## Cache key matching

The `cache` action first searches for cache hits for `key` and the cache *version* in the branch containing the workflow run. If there is no hit, it searches for prefix-matches for `key`, and if there is still no hit, it searches for `restore-keys` and the *version*. If there are still no hits in the current branch, the `cache` action retries the same steps on the default branch. Please note that the scope restrictions apply during the search. For more information, see [Restrictions for accessing a cache](#restrictions-for-accessing-a-cache).

Cache version is a way to stamp a cache with metadata of the `path` and the compression tool used while creating the cache. This ensures that the consuming workflow run uniquely matches a cache it can actually decompress and use. For more information, see [Cache Version](https://github.com/actions/cache#cache-version) in the Actions Cache documentation.

`restore-keys` allows you to specify a list of alternate restore keys to use when there is a cache miss on `key`. You can create multiple restore keys ordered from the most specific to least specific. The `cache` action searches the `restore-keys` in sequential order. When a key doesn't match directly, the action searches for keys prefixed with the restore key. If there are multiple partial matches for a restore key, the action returns the most recently created cache.

### Example using multiple restore keys

```yaml
restore-keys: |
  npm-feature-${{ hashFiles('package-lock.json') }}
  npm-feature-
  npm-
```

The runner evaluates the expressions, which resolve to these `restore-keys`:

```yaml
restore-keys: |
  npm-feature-d5ea0750
  npm-feature-
  npm-
```

The restore key `npm-feature-` matches any key that starts with the string `npm-feature-`. For example, both of the keys `npm-feature-fd3052de` and `npm-feature-a9b253ff` match the restore key. The cache with the most recent creation date would be used. The keys in this example are searched in the following order:

1. **`npm-feature-d5ea0750`** matches a specific hash.
2. **`npm-feature-`** matches cache keys prefixed with `npm-feature-`.
3. **`npm-`** matches any keys prefixed with `npm-`.

#### Example of search priority

```yaml
key:
  npm-feature-d5ea0750
restore-keys: |
  npm-feature-
  npm-
```

For example, if a pull request contains a `feature` branch and targets the default branch (`main`), the action searches for `key` and `restore-keys` in the following order:

1. Key `npm-feature-d5ea0750` in the `feature` branch
2. Key `npm-feature-` in the `feature` branch
3. Key `npm-` in the `feature` branch
4. Key `npm-feature-d5ea0750` in the `main` branch
5. Key `npm-feature-` in the `main` branch
6. Key `npm-` in the `main` branch

## `setup-*` actions for specific package managers

If you are caching the package managers listed below, using their respective setup-\* actions requires minimal configuration and will create and restore dependency caches for you.

| Package managers    | setup-\* action for caching                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| npm, Yarn, pnpm     | [setup-node](https://github.com/actions/setup-node#caching-global-packages-data)                  |
| pip, pipenv, Poetry | [setup-python](https://github.com/actions/setup-python#caching-packages-dependencies)             |
| Gradle, Maven       | [setup-java](https://github.com/actions/setup-java#caching-packages-dependencies)                 |
| RubyGems            | [setup-ruby](https://github.com/ruby/setup-ruby#caching-bundle-install-automatically)             |
| Go `go.sum`         | [setup-go](https://github.com/actions/setup-go#caching-dependency-files-and-build-outputs)        |
| .NET NuGet          | [setup-dotnet](https://github.com/actions/setup-dotnet?tab=readme-ov-file#caching-nuget-packages) |

## Restrictions for accessing a cache

Access restrictions provide cache isolation and security by creating a logical boundary between different branches or tags.
Workflow runs can restore caches created in either the current branch or the default branch (usually `main`). If a workflow run is triggered for a pull request, it can also restore caches created in the base branch, including base branches of forked repositories. For example, if the branch `feature-b` has the base branch `feature-a`, a workflow run triggered on a pull request would have access to caches created in the default `main` branch, the base `feature-a` branch, and the current `feature-b` branch.

Workflow runs cannot restore caches created for child branches or sibling branches. For example, a cache created for the child `feature-b` branch would not be accessible to a workflow run triggered on the parent `main` branch. Similarly, a cache created for the `feature-a` branch with the base `main` would not be accessible to its sibling `feature-c` branch with the base `main`. Workflow runs also cannot restore caches created for different tag names. For example, a cache created for the tag `release-a` with the base `main` would not be accessible to a workflow run triggered for the tag `release-b` with the base `main`.

When a cache is created by a workflow run triggered on a pull request, the cache is created for the merge ref (`refs/pull/.../merge`). Because of this, the cache will have a limited scope and can only be restored by re-runs of the pull request. It cannot be restored by the base branch or other pull requests targeting that base branch.

Multiple workflow runs in a repository can share caches. A cache created for a branch in a workflow run can be accessed and restored from another workflow run for the same repository and branch.

## Usage limits and eviction policy

GitHub applies limits to cache storage and retention to manage storage costs and prevent abuse. Understanding these limits helps you optimize your cache usage.

### Default limits

GitHub will remove any cache entries that have not been accessed in over 7 days. There is no limit on the number of caches you can store, but the total size of all caches in a repository is limited. By default, the limit is 10 GB per repository, but this limit can be increased by enterprise owners, organization owners, or repository administrators. Any usage beyond 10 GB is billed to your account. Once a repository has reached its maximum cache storage, the cache eviction policy will create space by deleting the caches in order of last access date, from oldest to most recent.

If you exceed the limit, GitHub will save the new cache but will begin evicting caches until the total size is less than the repository limit. The cache eviction process may cause cache thrashing, where caches are created and deleted at a high frequency. To reduce this, you can review the caches for a repository and take corrective steps, such as removing caching from specific workflows or increasing your cache size. This functionality is only available to users with a payment method on file who opt in by configuring cache settings. See [Managing caches](/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-workflow-runs/manage-caches).

You can create cache entries at a rate of up to 200 uploads per minute per repository, and download them at a rate of 1500 downloads per minute per repository. If you exceed this rate, subsequent cache upload or download attempts will fail until the relevant rate limit resets. The time until the rate limit resets is returned in the `Retry-After` header of the response. See [Actions limits](/en/actions/reference/limits) for more information about GitHub Actions rate limits.

### Increasing cache size

If you want to reduce the rate at which cache entries are evicted, you can increase the storage limits for your cache in the Actions Settings. Repositories owned by users can configure up to 10 TB per repository. For repositories owned by organizations, the maximum configurable limit is determined by the organization's settings. For organizations owned by an enterprise, the maximum configurable limit is determined by the enterprise's settings. Increasing the limit beyond the default 10 GB will incur additional costs, if that storage is used.

For more information, see:

* [Managing GitHub Actions settings for a repository](/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#configuring-cache-settings-for-your-repository)
* [Disabling or limiting GitHub Actions for your organization](/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#managing-github-actions-cache-storage-for-your-organization)
* [Enforcing policies for GitHub Actions in your enterprise](/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise#artifact-and-log-retention)

Usage of additional storage is also controlled by budgets set for GitHub Actions or the Actions Cache Storage SKU. If you have limits configured, and you exceed a budget, your cache will become read-only until your billing status is resolved, or your usage goes beneath the free limit of 10GB by caches expiring or being explicitly deleted. For more information on how to set up budgets, see [Setting up budgets to control spending on metered products](/en/billing/how-tos/set-up-budgets).

Setting your Actions Cache Storage SKU budgets lower than the total cost of using your configured storage over your billing period can lead to your cache frequently going into read-only mode. For example, if your budget for the SKU is $0, and you've configured your repository's maximum cache size at 20GB, your cache will enter read-only mode as soon as storage exceeds the free threshold.

Below are some illustrative monthly costs to inform budgets you may wish to set for the Actions Cache Storage SKU.

| Cache size | Monthly cost (if fully utilized) |
| ---------- | -------------------------------- |
| 50GB       | $2.80                            |
| 200GB      | $13.30                           |
| 1000GB     | $69.30                           |

## Next steps

To manage your dependency caches, see [Managing caches](/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-workflow-runs/manage-caches).
---

# Deployments and environments

Find information about deployment protection rules, environment secrets, and environment variables.

## Deployment protection rules

Deployment protection rules require specific conditions to pass before a job referencing the environment can proceed. You can use deployment protection rules to require a manual approval, delay a job, or restrict the environment to certain branches. You can also create and implement custom protection rules powered by GitHub Apps to use third-party systems to control deployments referencing environments configured on GitHub.

Third-party systems can be observability systems, change management systems, code quality systems, or other manual configurations that you use to assess readiness before deployments are safely rolled out to environments.

> \[!NOTE]
> Any number of GitHub Apps-based deployment protection rules can be installed on a repository. However, a maximum of 6 deployment protection rules can be enabled on any environment at the same time.

### Required reviewers

Use required reviewers to require a specific person or team to approve workflow jobs that reference the environment. You can list up to six users or teams as reviewers. The reviewers must have at least read access to the repository. Only one of the required reviewers needs to approve the job for it to proceed.

You also have the option to prevent self-reviews for deployments to protected environments. If you enable this setting, users who initiate a deployment cannot approve the deployment job, even if they are a required reviewer. This ensures that deployments to protected environments are always reviewed by more than one person.

For more information on reviewing jobs that reference an environment with required reviewers, see [Reviewing deployments](/en/actions/managing-workflow-runs/reviewing-deployments).

> \[!NOTE]
> If you are on a GitHub Free, GitHub Pro, or GitHub Team plan, required reviewers are only available for public repositories.

### Wait timer

Use a wait timer to delay a job for a specific amount of time after the job is initially triggered. The time (in minutes) must be an integer between 1 and 43,200 (30 days). Wait time will not count towards your billable time.

> \[!NOTE]
> If you are on a GitHub Free, GitHub Pro, or GitHub Team plan, wait timers are only available for public repositories.

### Deployment branches and tags

Use deployment branches and tags to restrict which branches and tags can deploy to the environment. Below are the options for deployment branches and tags for an environment:

* **No restriction:** No restriction on which branch or tag can deploy to the environment.

* **Protected branches only:** Only branches with branch protection rules enabled can deploy to the environment. If no branch protection rules are defined for any branch in the repository, then all branches can deploy. For more information about branch protection rules, see [About protected branches](/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

  > \[!NOTE]
  > Deployment workflow runs triggered by tags with the same name as a protected branch and forks with branches that match the protected branch name cannot deploy to the environment.

* **Selected branches and tags:** Only branches and tags that match your specified name patterns can deploy to the environment.

  The deployment branch or tag rule is matched against the `GITHUB_REF` of the workflow run. For values of `GITHUB_REF` for each workflow trigger, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows). If you specify `releases/*` as a deployment branch or tag rule, only a `GITHUB_REF` whose name begins with `releases/` can deploy to the environment. Adding another branch rule for `refs/pull/*/merge` would also allow workflows triggered by `pull_request` events to deploy to the environment. Wildcard characters will not match `/`, to match branches or tags that begin with `release/` and contain an additional single slash, use `release/*/*`. For more information about syntax options for deployment branches, see the [Ruby `File.fnmatch` documentation](https://ruby-doc.org/core-2.5.1/File.html#method-c-fnmatch).

  > \[!NOTE]
  > Name patterns must be configured for branches or tags individually.

> \[!NOTE]
> Deployment branches and tags are available for all public repositories. For users on GitHub Pro or GitHub Team plans, deployment branches and tags are also available for private repositories.

### Allow administrators to bypass configured protection rules

By default, administrators can bypass the protection rules and force deployments to specific environments. For more information, see [Reviewing deployments](/en/actions/managing-workflow-runs/reviewing-deployments#bypassing-environment-protection-rules).

Alternatively, you can configure environments to disallow bypassing the protection rules for all deployments to the environment.

> \[!NOTE]
> Allowing administrators to bypass protection rules is only available for public repositories for users on GitHub Free, GitHub Pro, and GitHub Team plans.

### Custom deployment protection rules

> \[!NOTE]
> Custom deployment protection rules are currently in public preview and subject to change.

You can enable your own custom protection rules to gate deployments with third-party services. For example, you can use services such as Datadog, Honeycomb, and ServiceNow to provide automated approvals for deployments to GitHub. For more information, see [Creating custom deployment protection rules](/en/actions/deployment/protecting-deployments/creating-custom-deployment-protection-rules).

Once custom deployment protection rules have been created and installed on a repository, you can enable the custom deployment protection rule for any environment in the repository. For more information about configuring and enabling custom deployment protection rules, see [Configuring custom deployment protection rules](/en/actions/deployment/protecting-deployments/configuring-custom-deployment-protection-rules).

> \[!NOTE]
> Custom deployment protection rules are only available for public repositories for users on GitHub Free, GitHub Pro, and GitHub Team plans.

## Environment secrets

Secrets stored in an environment are only available to workflow jobs that reference the environment. If the environment requires approval, a job cannot access environment secrets until one of the required reviewers approves it. For more information about secrets, see [Secrets](/en/actions/security-for-github-actions/security-guides/about-secrets).

> \[!NOTE]
>
> * Workflows that run on self-hosted runners are not run in an isolated container, even if they use environments. Environment secrets should be treated with the same level of security as repository and organization secrets. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#hardening-for-self-hosted-runners).
> * If you are using GitHub Free, environment secrets are only available in public repositories. For access to environment secrets in private or internal repositories, you must use GitHub Pro, GitHub Team, or GitHub Enterprise. For more information on switching your plan, see [Upgrading your account's plan](/en/billing/managing-the-plan-for-your-github-account/upgrading-your-accounts-plan).

## Environment variables

Variables stored in an environment are only available to workflow jobs that reference the environment. These variables are only accessible using the [`vars`](/en/actions/learn-github-actions/contexts#vars-context) context. For more information, see [Store information in variables](/en/actions/learn-github-actions/variables).

> \[!NOTE]
> Environment variables are available for all public repositories. For users on GitHub Pro or GitHub Team plans, environment variables are also available for private repositories.
---

# Dockerfile support for GitHub Actions

When creating a Dockerfile for a Docker container action, you should be aware of how some Docker instructions interact with GitHub Actions and an action's metadata file.

### USER

Docker actions must be run by the default Docker user (root). Do not use the `USER` instruction in your `Dockerfile`, because you won't be able to access the `GITHUB_WORKSPACE` directory. For more information, see [Variables reference](/en/actions/reference/variables-reference#default-environment-variables) and [USER reference](https://docs.docker.com/engine/reference/builder/#user) in the Docker documentation.

### FROM

The first instruction in the `Dockerfile` must be `FROM`, which selects a Docker base image. For more information, see the [FROM reference](https://docs.docker.com/engine/reference/builder/#from) in the Docker documentation.

These are some best practices when setting the `FROM` argument:

* It's recommended to use official Docker images. For example, `python` or `ruby`.
* Use a version tag if it exists, preferably with a major version. For example, use `node:10` instead of `node:latest`.
* It's recommended to use Docker images based on the [Debian](https://www.debian.org/) operating system.

### WORKDIR

GitHub sets the working directory path in the `GITHUB_WORKSPACE` environment variable. It's recommended to not use the `WORKDIR` instruction in your `Dockerfile`. Before the action executes, GitHub will mount the `GITHUB_WORKSPACE` directory on top of anything that was at that location in the Docker image and set `GITHUB_WORKSPACE` as the working directory. For more information, see [Variables reference](/en/actions/reference/variables-reference#default-environment-variables) and the [WORKDIR reference](https://docs.docker.com/engine/reference/builder/#workdir) in the Docker documentation.

### ENTRYPOINT

If you define `entrypoint` in an action's metadata file, it will override the `ENTRYPOINT` defined in the `Dockerfile`. For more information, see [Metadata syntax reference](/en/actions/creating-actions/metadata-syntax-for-github-actions#runsentrypoint).

The Docker `ENTRYPOINT` instruction has a *shell* form and *exec* form. The Docker `ENTRYPOINT` documentation recommends using the *exec* form of the `ENTRYPOINT` instruction. For more information about *exec* and *shell* form, see the [ENTRYPOINT reference](https://docs.docker.com/engine/reference/builder/#entrypoint) in the Docker documentation.

You should not use `WORKDIR` to specify your entrypoint in your Dockerfile. Instead, you should use an absolute path. For more information, see [WORKDIR](#workdir).

If you configure your container to use the *exec* form of the `ENTRYPOINT` instruction, the `args` configured in the action's metadata file won't run in a command shell. If the action's `args` contain an environment variable, the variable will not be substituted. For example, using the following *exec* format will not print the value stored in `$GITHUB_SHA`, but will instead print `"$GITHUB_SHA"`.

```dockerfile
ENTRYPOINT ["echo $GITHUB_SHA"]
```

If you want variable substitution, then either use the *shell* form or execute a shell directly. For example, using the following *exec* format, you can execute a shell to print the value stored in the `GITHUB_SHA` environment variable.

```dockerfile
ENTRYPOINT ["sh", "-c", "echo $GITHUB_SHA"]
```

To supply `args` defined in the action's metadata file to a Docker container that uses the *exec* form in the `ENTRYPOINT`, we recommend creating a shell script called `entrypoint.sh` that you call from the `ENTRYPOINT` instruction:

#### Example *Dockerfile*

```dockerfile
# Container image that runs your code
FROM debian:9.5-slim

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY entrypoint.sh /entrypoint.sh

# Executes `entrypoint.sh` when the Docker container starts up
ENTRYPOINT ["/entrypoint.sh"]
```

#### Example *entrypoint.sh* file

Using the example Dockerfile above, GitHub will send the `args` configured in the action's metadata file as arguments to `entrypoint.sh`. Add the `#!/bin/sh` [shebang](https://en.wikipedia.org/wiki/Shebang_\(Unix\)) at the top of the `entrypoint.sh` file to explicitly use the system's [POSIX](https://en.wikipedia.org/wiki/POSIX)-compliant shell.

```shell
#!/bin/sh

# `$#` expands to the number of arguments and `$@` expands to the supplied `args`
printf '%d args:' "$#"
printf " '%s'" "$@"
printf '\n'
```

Your code must be executable. Make sure the `entrypoint.sh` file has `execute` permissions before using it in a workflow. You can modify the permission from your terminal using this command:

```shell
chmod +x entrypoint.sh
```

When an `ENTRYPOINT` shell script is not executable, you'll receive an error similar to this:

```shell
Error response from daemon: OCI runtime create failed: container_linux.go:348: starting container process caused "exec: \"/entrypoint.sh\": permission denied": unknown
```

### CMD

If you define `args` in the action's metadata file, `args` will override the `CMD` instruction specified in the `Dockerfile`. For more information, see [Metadata syntax reference](/en/actions/creating-actions/metadata-syntax-for-github-actions#runsargs).

If you use `CMD` in your `Dockerfile`, follow these guidelines:

1. Document required arguments in the action's README and omit them from the `CMD` instruction.
2. Use defaults that allow using the action without specifying any `args`.
3. If the action exposes a `--help` flag, or something similar, use that to make your action self-documenting.

## Supported Linux capabilities

GitHub Actions supports the default Linux capabilities that Docker supports. Capabilities can't be added or removed. For more information about the default Linux capabilities that Docker supports, see [Linux kernel capabilities](https://docs.docker.com/engine/security/#linux-kernel-capabilities) in the Docker documentation. To learn more about Linux capabilities, see [Overview of Linux capabilities](http://man7.org/linux/man-pages/man7/capabilities.7.html) in the Linux man-pages.
---

# Evaluate expressions in workflows and actions

Find information for expressions in GitHub Actions.

## Literals

As part of an expression, you can use `boolean`, `null`, `number`, or `string` data types.

| Data type | Literal value                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `boolean` | `true` or `false`                                                                                                                                                                                                                                                                           |
| `null`    | `null`                                                                                                                                                                                                                                                                                      |
| `number`  | Any number format supported by JSON.                                                                                                                                                                                                                                                        |
| `string`  | You don't need to enclose strings in `${{` and `}}`. However, if you do, you must use single quotes (`'`) around the string. To use a literal single quote, escape the literal single quote using an additional single quote (`''`). Wrapping with double quotes (`"`) will throw an error. |

Note that in conditionals, falsy values (`false`, `0`, `-0`, `""`, `''`, `null`) are coerced to `false` and truthy (`true` and other non-falsy values) are coerced to `true`.

### Example of literals

```yaml
env:
  myNull: ${{ null }}
  myBoolean: ${{ false }}
  myIntegerNumber: ${{ 711 }}
  myFloatNumber: ${{ -9.2 }}
  myHexNumber: ${{ 0xff }}
  myExponentialNumber: ${{ -2.99e-2 }}
  myString: Mona the Octocat
  myStringInBraces: ${{ 'It''s open source!' }}
```

## Operators

| Operator          | Description           |
| ----------------- | --------------------- |
| `( )`             | Logical grouping      |
| `[ ]`             | Index                 |
| `.`               | Property de-reference |
| `!`               | Not                   |
| `<`               | Less than             |
| `<=`              | Less than or equal    |
| `>`               | Greater than          |
| `>=`              | Greater than or equal |
| `==`              | Equal                 |
| `!=`              | Not equal             |
| `&&`              | And                   |
| <code>\|\|</code> | Or                    |

> \[!NOTE]
>
> * GitHub ignores case when comparing strings.
> * `steps.<step_id>.outputs.<output_name>` evaluates as a string. You need to use specific syntax to tell GitHub to evaluate an expression rather than treat it as a string. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts#steps-context).
> * For numerical comparison, the `fromJSON()` function can be used to convert a string to a number. For more information on the `fromJSON()` function, see [fromJSON](#fromjson).

GitHub performs loose equality comparisons.

* If the types do not match, GitHub coerces the type to a number. GitHub casts data types to a number using these conversions:

  | Type    | Result                                                                                            |
  | ------- | ------------------------------------------------------------------------------------------------- |
  | Null    | `0`                                                                                               |
  | Boolean | `true` returns `1` <br /> `false` returns `0`                                                     |
  | String  | Parsed from any legal JSON number format, otherwise `NaN`. <br /> Note: empty string returns `0`. |
  | Array   | `NaN`                                                                                             |
  | Object  | `NaN`                                                                                             |
* When `NaN` is one of the operands of any relational comparison (`>`, `<`, `>=`, `<=`), the result is always `false`. For more information, see the [NaN Mozilla docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN).
* GitHub ignores case when comparing strings.
* Objects and arrays are only considered equal when they are the same instance.

## Functions

GitHub offers a set of built-in functions that you can use in expressions. Some functions cast values to a string to perform comparisons. GitHub casts data types to a string using these conversions:

| Type    | Result                                        |
| ------- | --------------------------------------------- |
| Null    | `''`                                          |
| Boolean | `'true'` or `'false'`                         |
| Number  | Decimal format, exponential for large numbers |
| Array   | Arrays are not converted to a string          |
| Object  | Objects are not converted to a string         |

### contains

`contains( search, item )`

Returns `true` if `search` contains `item`. If `search` is an array, this function returns `true` if the `item` is an element in the array. If `search` is a string, this function returns `true` if the `item` is a substring of `search`. This function is not case sensitive. Casts values to a string.

#### Example using a string

`contains('Hello world', 'llo')` returns `true`.

#### Example using an object filter

`contains(github.event.issue.labels.*.name, 'bug')` returns `true` if the issue related to the event has a label "bug".

For more information, see [Object filters](#object-filters).

#### Example matching an array of strings

Instead of writing `github.event_name == "push" || github.event_name == "pull_request"`, you can use `contains()` with `fromJSON()` to check if an array of strings contains an `item`.

For example, `contains(fromJSON('["push", "pull_request"]'), github.event_name)` returns `true` if `github.event_name` is "push" or "pull\_request".

### startsWith

`startsWith( searchString, searchValue )`

Returns `true` when `searchString` starts with `searchValue`. This function is not case sensitive. Casts values to a string.

#### Example of `startsWith`

`startsWith('Hello world', 'He')` returns `true`.

### endsWith

`endsWith( searchString, searchValue )`

Returns `true` if `searchString` ends with `searchValue`. This function is not case sensitive. Casts values to a string.

#### Example of `endsWith`

`endsWith('Hello world', 'ld')` returns `true`.

### format

`format( string, replaceValue0, replaceValue1, ..., replaceValueN)`

Replaces values in the `string`, with the variable `replaceValueN`. Variables in the `string` are specified using the `{N}` syntax, where `N` is an integer. You must specify at least one `replaceValue` and `string`. There is no maximum for the number of variables (`replaceValueN`) you can use. Escape curly braces using double braces.

#### Example of `format`

```javascript
format('Hello {0} {1} {2}', 'Mona', 'the', 'Octocat')
```

Returns 'Hello Mona the Octocat'.

#### Example escaping braces

```javascript
format('{{Hello {0} {1} {2}!}}', 'Mona', 'the', 'Octocat')
```

Returns '{Hello Mona the Octocat!}'.

### join

`join( array, optionalSeparator )`

The value for `array` can be an array or a string. All values in `array` are concatenated into a string. If you provide `optionalSeparator`, it is inserted between the concatenated values. Otherwise, the default separator `,` is used. Casts values to a string.

#### Example of `join`

`join(github.event.issue.labels.*.name, ', ')` may return 'bug, help wanted'

### toJSON

`toJSON(value)`

Returns a pretty-print JSON representation of `value`. You can use this function to debug the information provided in contexts.

#### Example of `toJSON`

`toJSON(job)` might return `{ "status": "success" }`

### fromJSON

`fromJSON(value)`

Returns a JSON object or JSON data type for `value`. You can use this function to provide a JSON object as an evaluated expression or to convert any data type that can be represented in JSON or JavaScript, such as strings, booleans, null values, arrays, and objects.

#### Example returning a JSON object

This workflow sets a JSON matrix in one job, and passes it to the next job using an output and `fromJSON`.

```yaml copy
name: build
on: push
jobs:
  job1:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - id: set-matrix
        run: echo "matrix={\"include\":[{\"project\":\"foo\",\"config\":\"Debug\"},{\"project\":\"bar\",\"config\":\"Release\"}]}" >> $GITHUB_OUTPUT
  job2:
    needs: job1
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJSON(needs.job1.outputs.matrix) }}
    steps:
      - run: echo "Matrix - Project ${{ matrix.project }}, Config ${{ matrix.config }}"
```

#### Example returning a JSON data type

This workflow uses `fromJSON` to convert environment variables from a string to a Boolean or integer.

```yaml copy
name: print
on: push
env:
  continue: true
  time: 3
jobs:
  job1:
    runs-on: ubuntu-latest
    steps:
      - continue-on-error: ${{ fromJSON(env.continue) }}
        timeout-minutes: ${{ fromJSON(env.time) }}
        run: echo ...
```

The workflow uses the `fromJSON()` function to convert the environment variable `continue` from a string to a boolean, allowing it to determine whether to continue-on-error or not. Similarly, it converts the `time` environment variable from a string to an integer, setting the timeout for the job in minutes.

### hashFiles

`hashFiles(path)`

Returns a single hash for the set of files that matches the `path` pattern. You can provide a single `path` pattern or multiple `path` patterns separated by commas. The `path` is relative to the `GITHUB_WORKSPACE` directory and can only include files inside of the `GITHUB_WORKSPACE`. This function calculates an individual SHA-256 hash for each matched file, and then uses those hashes to calculate a final SHA-256 hash for the set of files. If the `path` pattern does not match any files, this returns an empty string. For more information about SHA-256, see [SHA-2](https://en.wikipedia.org/wiki/SHA-2).

You can use pattern matching characters to match file names. Pattern matching for `hashFiles` follows glob pattern matching and is case-insensitive on Windows. For more information about supported pattern matching characters, see the [Patterns](https://www.npmjs.com/package/@actions/glob#patterns) section in the `@actions/glob` documentation.

#### Examples with a single pattern

Matches any `package-lock.json` file in the repository.

`hashFiles('**/package-lock.json')`

Matches all `.js` files in the `src` directory at root level, but ignores any subdirectories of `src`.

`hashFiles('/src/*.js')`

Matches all `.rb` files in the `lib` directory at root level, including any subdirectories of `lib`.

`hashFiles('/lib/**/*.rb')`

#### Examples with multiple patterns

Creates a hash for any `package-lock.json` and `Gemfile.lock` files in the repository.

`hashFiles('**/package-lock.json', '**/Gemfile.lock')`

Creates a hash for all `.rb` files in the `lib` directory at root level, including any subdirectories of `lib`, but excluding `.rb` files in the `foo` subdirectory.

`hashFiles('/lib/**/*.rb', '!/lib/foo/*.rb')`

### case

`case( pred1, val1, pred2, val2, ..., default )`

Evaluates predicates in order and returns the value corresponding to the first predicate that evaluates to `true`. If no predicate matches, it returns the last argument as the default value.

#### Example with a single predicate

```yaml
env:
  MY_ENV_VAR: ${{ case(github.ref == 'refs/heads/main', 'production', 'development') }}
```

Sets `MY_ENV_VAR` to `production` when the ref is `refs/heads/main`, otherwise sets it to `development`.

#### Example with multiple predicates

```yaml
env:
  MY_ENV_VAR: |-
    ${{ case(
      github.ref == 'refs/heads/main', 'production',
      github.ref == 'refs/heads/staging', 'staging',
      startsWith(github.ref, 'refs/heads/feature/'), 'development',
      'unknown'
    ) }}
```

Sets `MY_ENV_VAR` based on the branch: `production` for `main`, `staging` for `staging`, `development` for branches starting with `feature/`, or `unknown` for all other branches.

## Status check functions

You can use the following status check functions as expressions in `if` conditionals. A default status check of `success()` is applied unless you include one of these functions. For more information about `if` conditionals, see [Workflow syntax for GitHub Actions](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idif) and [Metadata syntax reference](/en/actions/creating-actions/metadata-syntax-for-github-actions#runsstepsif).

Outside `if` conditionals, you can use `job.status` to access the job status. For more information, see [Contexts reference](/en/actions/reference/contexts-reference#job-context).

### success

Returns `true` when all previous steps have succeeded.

#### Example of `success`

```yaml
steps:
  ...
  - name: The job has succeeded
    if: ${{ success() }}
```

### always

Causes the step to always execute, and returns `true`, even when canceled. The `always` expression is best used at the step level or on tasks that you expect to run even when a job is canceled. For example, you can use `always` to send logs even when a job is canceled.

> \[!WARNING]
> Avoid using `always` for any task that could suffer from a critical failure, for example: getting sources, otherwise the workflow may hang until it times out. If you want to run a job or step regardless of its success or failure, use the recommended alternative: `if: ${{ !cancelled() }}`

#### Example of `always`

```yaml
if: ${{ always() }}
```

### cancelled

Returns `true` if the workflow was canceled.

#### Example of `cancelled`

```yaml
if: ${{ cancelled() }}
```

### failure

Returns `true` when any previous step of a job fails. If you have a chain of dependent jobs, `failure()` returns `true` if any ancestor job fails.

#### Example of `failure`

```yaml
steps:
  ...
  - name: The job has failed
    if: ${{ failure() }}
```

#### failure with conditions

You can include extra conditions for a step to run after a failure, but you must still include `failure()` to override the default status check of `success()` that is automatically applied to `if` conditions that don't contain a status check function.

##### Example of `failure` with conditions

```yaml
steps:
  ...
  - name: Failing step
    id: demo
    run: exit 1
  - name: The demo step has failed
    if: ${{ failure() && steps.demo.conclusion == 'failure' }}
```

## Object filters

You can use the `*` syntax to apply a filter and select matching items in a collection.

For example, consider an array of objects named `fruits`.

```json
[
  { "name": "apple", "quantity": 1 },
  { "name": "orange", "quantity": 2 },
  { "name": "pear", "quantity": 1 }
]
```

The filter `fruits.*.name` returns the array `[ "apple", "orange", "pear" ]`.

You may also use the `*` syntax on an object. For example, suppose you have an object named `vegetables`.

```json

{
  "scallions":
  {
    "colors": ["green", "white", "red"],
    "ediblePortions": ["roots", "stalks"],
  },
  "beets":
  {
    "colors": ["purple", "red", "gold", "white", "pink"],
    "ediblePortions": ["roots", "stems", "leaves"],
  },
  "artichokes":
  {
    "colors": ["green", "purple", "red", "black"],
    "ediblePortions": ["hearts", "stems", "leaves"],
  },
}
```

The filter `vegetables.*.ediblePortions` could evaluate to:

```json

[
  ["roots", "stalks"],
  ["hearts", "stems", "leaves"],
  ["roots", "stems", "leaves"],
]
```

Since objects don't preserve order, the order of the output cannot be guaranteed.
---

# Reusing workflow configurations

Find information about avoiding duplication when creating a workflow by reusing existing workflows.

## Reusable workflows

Reference information for reusable workflows.

### Access to reusable workflows

A reusable workflow can be used by another workflow if any of the following is true:

* Both workflows are in the same repository.
* The called workflow is stored in a public repository, and your organization allows you to use public reusable workflows.
* The called workflow is stored in a private repository and the settings for that repository allow it to be accessed. For more information, see [Sharing actions and workflows with your organization](/en/actions/creating-actions/sharing-actions-and-workflows-with-your-organization) and [Sharing actions and workflows from your private repository](/en/actions/creating-actions/sharing-actions-and-workflows-from-your-private-repository).

The following table shows the accessibility of reusable workflows to a caller workflow, depending on the visibility of the host repository.

| Caller repository | Accessible workflows repositories |
| ----------------- | --------------------------------- |
| `private`         | `private` and `public`            |
|                   |                                   |
| `public`          | `public`                          |

The **Actions permissions** on the callers repository's Actions settings page must be configured to allow the use of actions and reusable workflows - see [Managing GitHub Actions settings for a repository](/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#allowing-select-actions-and-reusable-workflows-to-run).

For private repositories, the **Access** policy on the Actions settings page of the called workflow's repository must be explicitly configured to allow access from repositories containing caller workflows - see [Managing GitHub Actions settings for a repository](/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#allowing-access-to-components-in-a-private-repository).

> \[!NOTE]
> To enhance security, GitHub Actions does not support redirects for actions or reusable workflows. This means that when the owner, name of an action's repository, or name of an action is changed, any workflows using that action with the previous name will fail.

### Limitations of reusable workflows

* You can connect up to ten levels of workflows. For more information, see [Nesting reusable workflows](/en/actions/how-tos/sharing-automations/reuse-workflows#nesting-reusable-workflows).

* You can call a maximum of 50 unique reusable workflows from a single workflow file. This limit includes any trees of nested reusable workflows that may be called starting from your top-level caller workflow file.

  For example, *top-level-caller-workflow\.yml* → *called-workflow-1.yml* → *called-workflow-2.yml* counts as 2 reusable workflows.

* Any environment variables set in an `env` context defined at the workflow level in the caller workflow are not propagated to the called workflow. For more information, see [Store information in variables](/en/actions/learn-github-actions/variables) and [Contexts reference](/en/actions/learn-github-actions/contexts#env-context).

* Similarly, environment variables set in the `env` context, defined in the called workflow, are not accessible in the `env` context of the caller workflow. Instead, you must use outputs of the reusable workflow. For more information, see [Using outputs from a reusable workflow](/en/actions/how-tos/sharing-automations/reuse-workflows#using-outputs-from-a-reusable-workflow).

* To reuse variables in multiple workflows, set them at the organization, repository, or environment levels and reference them using the `vars` context. For more information see [Store information in variables](/en/actions/learn-github-actions/variables) and [Contexts reference](/en/actions/learn-github-actions/contexts#vars-context).

* Reusable workflows are called directly within a job, and not from within a job step. You cannot, therefore, use `GITHUB_ENV` to pass values to job steps in the caller workflow.

### Supported keywords for jobs that call a reusable workflow

When you call a reusable workflow, you can only use the following keywords in the job containing the call:

* [`jobs.<job_id>.name`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idname)
* [`jobs.<job_id>.uses`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_iduses)
* [`jobs.<job_id>.with`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idwith)
* [`jobs.<job_id>.with.<input_id>`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idwithinput_id)
* [`jobs.<job_id>.secrets`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idsecrets)
* [`jobs.<job_id>.secrets.<secret_id>`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idsecretssecret_id)
* [`jobs.<job_id>.secrets.inherit`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idsecretsinherit)
* [`jobs.<job_id>.strategy`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategy)
* [`jobs.<job_id>.needs`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idneeds)
* [`jobs.<job_id>.if`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idif)
* [`jobs.<job_id>.concurrency`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idconcurrency)
* [`jobs.<job_id>.permissions`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idpermissions)

  > \[!NOTE]
  >
  > * If `jobs.<job_id>.permissions` is not specified in the calling job, the called workflow will have the default permissions for the `GITHUB_TOKEN`. For more information, see [Workflow syntax for GitHub Actions](/en/actions/reference/workflow-syntax-for-github-actions#permissions).
  > * The `GITHUB_TOKEN` permissions passed from the caller workflow can be only downgraded (not elevated) by the called workflow.
  > * If you use `jobs.<job_id>.concurrency.cancel-in-progress: true`, don't use the same value for `jobs.<job_id>.concurrency.group` in the called and caller workflows as this will cause the workflow that's already running to be cancelled. A called workflow uses the name of its caller workflow in ${{ github.workflow }}, so using this context as the value of `jobs.<job_id>.concurrency.group` in both caller and called workflows will cause the caller workflow to be cancelled when the called workflow runs.

### How reusable workflows use runners

#### GitHub-hosted runners

The assignment of GitHub-hosted runners is always evaluated using only the caller's context. Billing for GitHub-hosted runners is always associated with the caller. The caller workflow cannot use GitHub-hosted runners from the called repository. For more information, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners).

#### Self-hosted runners

Called workflows that are owned by the same user or organization as the caller workflow can access self-hosted runners from the caller's context. This means that a called workflow can access self-hosted runners that are:

* In the caller repository
* In the caller repository's organization, provided that the runner has been made available to the caller repository

### Access and permissions for nested workflows

A workflow that contains nested reusable workflows will fail if any of the nested workflows is inaccessible to the initial caller workflow. For more information, see [Access to reusable workflows](#access-to-reusable-workflows).

`GITHUB_TOKEN` permissions can only be the same or more restrictive in nested workflows. For example, in the workflow chain A > B > C, if workflow A has `package: read` token permission, then B and C cannot have `package: write` permission. For more information, see [Use GITHUB\\\_TOKEN for authentication in workflows](/en/actions/security-guides/automatic-token-authentication).

For information on how to use the API to determine which workflow files were involved in a particular workflow run, see [Reuse workflows](/en/actions/how-tos/sharing-automations/reuse-workflows#monitoring-which-workflows-are-being-used).

### Behavior of reusable workflows when re-running jobs

Reusable workflows from public repositories can be referenced using a SHA, a release tag, or a branch name. For more information, see [Reuse workflows](/en/actions/using-workflows/reusing-workflows#calling-a-reusable-workflow).

When you re-run a workflow that uses a reusable workflow and the reference is not a SHA, there are some behaviors to be aware of:

* Re-running all jobs in a workflow will use the reusable workflow from the specified reference. For more information about re-running all jobs in a workflow, see [Re-running workflows and jobs](/en/actions/managing-workflow-runs/re-running-workflows-and-jobs#re-running-all-the-jobs-in-a-workflow).
* Re-running failed jobs or a specific job in a workflow will use the reusable workflow from the same commit SHA of the first attempt. For more information about re-running failed jobs in a workflow, see [Re-running workflows and jobs](/en/actions/managing-workflow-runs/re-running-workflows-and-jobs#re-running-failed-jobs-in-a-workflow). For more information about re-running a specific job in a workflow, see [Re-running workflows and jobs](/en/actions/managing-workflow-runs/re-running-workflows-and-jobs#re-running-a-specific-job-in-a-workflow).

### `github` context

When a reusable workflow is triggered by a caller workflow, the `github` context is always associated with the caller workflow. The called workflow is automatically granted access to `github.token` and `secrets.GITHUB_TOKEN`. For more information about the `github` context, see [Contexts reference](/en/actions/learn-github-actions/contexts#github-context).

## Workflow templates

Reference information to use when creating workflow templates for your organization.

### Workflow template availability

You can use templates in repositories that match or have more restricted visibility than the template repository.

* Workflow templates in a public `.github` repository are available to all repository types.
* Workflow templates in an internal `.github` repository are only available to internal and private repositories.
* Workflow templates in a private `.github` repository are only available to private repositories.

### Granting access for private/internal repositories

If you're using a private or internal `.github` repository, you need to grant Read access to users or teams who should be able to use the templates.

### The `$default-branch` placeholder

If you need to refer to a repository's default branch, you can use the `$default-branch` placeholder in your workflow template. When a workflow is created the placeholder will be automatically replaced with the name of the repository's default branch.

### Example workflow template file

This file named `octo-organization-ci.yml` demonstrates a basic workflow.

```yaml copy
name: Octo Organization CI
on:
  push:
    branches: [ $default-branch ]
  pull_request:
    branches: [ $default-branch ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Run a one-line script
        run: echo Hello from Octo Organization
```

### Metadata file requirements

The metadata file must have the same name as the workflow file, but instead of the `.yml` extension, it must be appended with `.properties.json`. For example, this file named `octo-organization-ci.properties.json` contains the metadata for a workflow file named `octo-organization-ci.yml`:

```json copy
{
    "name": "Octo Organization Workflow",
    "description": "Octo Organization CI workflow template.",
    "iconName": "example-icon",
    "categories": [
        "Go"
    ],
    "filePatterns": [
        "package.json$",
        "^Dockerfile",
        ".*\\.md$"
    ]
}
```

* `name` - **Required.** The name of the workflow. This is displayed in the list of available workflows.

* `description` - **Required.** The description of the workflow. This is displayed in the list of available workflows.

* `iconName` - **Optional.** Specifies an icon for the workflow that is displayed in the list of workflows. `iconName` can be one of the following types:
  * An SVG file that is stored in the `workflow-templates` directory. To reference a file, the value must be the file name without the file extension. For example, an SVG file named `example-icon.svg` is referenced as `example-icon`.
  * An icon from GitHub's set of [Octicons](https://primer.style/octicons/). To reference an octicon, the value must be `octicon <icon name>`. For example, `octicon smiley`.

* `categories` - **Optional.** Defines the categories that the workflow is shown under. You can use category names from the following lists:
  * General category names from the [starter-workflows](https://github.com/actions/starter-workflows/blob/main/README.md#categories) repository.
  * Linguist languages from the list in the [linguist](https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml) repository.
  * Supported tech stacks from the list in the [starter-workflows](https://github.com/github-starter-workflows/repo-analysis-partner/blob/main/tech_stacks.yml) repository.

* `filePatterns` - **Optional.** Allows the workflow to be used if the user's repository has a file in its root directory that matches a defined regular expression.

## YAML anchors and aliases

You can use YAML anchors and aliases to reduce repetition in your workflows. An anchor (marked with `&`) identifies a piece of content that you want to reuse, while an alias (marked with `*`) repeats that content in another location.

For detailed information about anchors and aliases, see [Node Anchors and Aliases in the YAML specification](https://yaml.org/spec/1.2.2/#3222-anchors-and-aliases).

Here's an example that uses YAML anchors and aliases with environment variables:

```yaml
jobs:
  job1:
    env: &env_vars # Define the anchor on first use
      NODE_ENV: production
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    steps:
      - run: echo "Using production settings"

  job2:
    env: *env_vars # Reuse the environment variables
    steps:
      - run: echo "Same environment variables here"
```

This is equivalent to writing the following YAML without anchors and aliases:

```yaml
jobs:
  job1:
    env:
      NODE_ENV: production
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    steps:
      - run: echo "Using production settings"

  job2:
    env:
      NODE_ENV: production
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    steps:
      - run: echo "Same environment variables here"
```

You can also use anchors for more complex configurations, such as reusing an entire job configuration:

```yaml
jobs:
  test: &base_job # Define the anchor on first use
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      NODE_VERSION: '18'
    steps:
      - uses: actions/checkout@v5
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm test

  alt-test: *base_job # Reuse the entire job configuration
```
---

# Variables reference

Find information for supported variables, naming conventions, limits, and contexts in GitHub Actions workflows.

This article lists the supported variables you can use in GitHub Actions workflows, including environment variables, configuration variables, and default variables provided by GitHub. Use this reference to look up variable names, naming conventions, limits, and supported contexts when configuring your workflows.

For more information about variables, see [Variables](/en/actions/concepts/workflows-and-actions/variables).

## Default environment variables

The default environment variables that GitHub sets are available to every step in a workflow.

Because default environment variables are set by GitHub and not defined in a workflow, they are not accessible through the `env` context. However, most of the default variables have a corresponding, and similarly named, context property. For example, the value of the `GITHUB_REF` variable can be read during workflow processing using the `${{ github.ref }}` context property.

You can't overwrite the value of the default environment variables named `GITHUB_*` and `RUNNER_*`. Currently you can overwrite the value of the `CI` variable. However, it's not guaranteed that this will always be possible. For more information about setting environment variables, see [Store information in variables](/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#defining-environment-variables-for-a-single-workflow) and [Workflow commands for GitHub Actions](/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-environment-variable).

We strongly recommend that actions use variables to access the filesystem rather than using hardcoded file paths. GitHub sets variables for actions to use in all runner environments.

| Variable                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CI`                         | Always set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `GITHUB_ACTION`              | The name of the action currently running, or the [`id`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsid) of a step. For example, for an action, `__repo-owner_name-of-action-repo`.<br><br>GitHub removes special characters, and uses the name `__run` when the current step runs a script without an `id`. If you use the same script or action more than once in the same job, the name will include a suffix that consists of the sequence number preceded by an underscore. For example, the first script you run will have the name `__run`, and the second script will be named `__run_2`. Similarly, the second invocation of `actions/checkout` will be `actionscheckout2`.                                                                                                                                                                                                                |
| `GITHUB_ACTION_PATH`         | The path where an action is located. This property is only supported in composite actions. You can use this path to change directories to where the action is located and access other files in that same repository. For example, `/home/runner/work/_actions/repo-owner/name-of-action-repo/v1`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `GITHUB_ACTION_REPOSITORY`   | For a step executing an action, this is the owner and repository name of the action. For example, `actions/checkout`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `GITHUB_ACTIONS`             | Always set to `true` when GitHub Actions is running the workflow. You can use this variable to differentiate when tests are being run locally or by GitHub Actions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `GITHUB_ACTOR`               | The name of the person or app that initiated the workflow. For example, `octocat`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `GITHUB_ACTOR_ID`            | The account ID of the person or app that triggered the initial workflow run. For example, `1234567`. Note that this is different from the actor username.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `GITHUB_API_URL`             | Returns the API URL. For example: `https://api.github.com`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `GITHUB_BASE_REF`            | The name of the base ref or target branch of the pull request in a workflow run. This is only set when the event that triggers a workflow run is either `pull_request` or `pull_request_target`. For example, `main`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `GITHUB_ENV`                 | The path on the runner to the file that sets variables from workflow commands. The path to this file is unique to the current step and changes for each step in a job. For example, `/home/runner/work/_temp/_runner_file_commands/set_env_87406d6e-4979-4d42-98e1-3dab1f48b13a`. For more information, see [Workflow commands for GitHub Actions](/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-environment-variable).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `GITHUB_EVENT_NAME`          | The name of the event that triggered the workflow. For example, `workflow_dispatch`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `GITHUB_EVENT_PATH`          | The path to the file on the runner that contains the full event webhook payload. For example, `/github/workflow/event.json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `GITHUB_GRAPHQL_URL`         | Returns the GraphQL API URL. For example: `https://api.github.com/graphql`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `GITHUB_HEAD_REF`            | The head ref or source branch of the pull request in a workflow run. This property is only set when the event that triggers a workflow run is either `pull_request` or `pull_request_target`. For example, `feature-branch-1`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `GITHUB_JOB`                 | The [job\_id](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_id) of the current job. For example, `greeting_job`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `GITHUB_OUTPUT`              | The path on the runner to the file that sets the current step's outputs from workflow commands. The path to this file is unique to the current step and changes for each step in a job. For example, `/home/runner/work/_temp/_runner_file_commands/set_output_a50ef383-b063-46d9-9157-57953fc9f3f0`. For more information, see [Workflow commands for GitHub Actions](/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-output-parameter).                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `GITHUB_PATH`                | The path on the runner to the file that sets system `PATH` variables from workflow commands. The path to this file is unique to the current step and changes for each step in a job. For example, `/home/runner/work/_temp/_runner_file_commands/add_path_899b9445-ad4a-400c-aa89-249f18632cf5`. For more information, see [Workflow commands for GitHub Actions](/en/actions/using-workflows/workflow-commands-for-github-actions#adding-a-system-path).                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `GITHUB_REF`                 | The fully-formed ref of the branch or tag that triggered the workflow run. For workflows triggered by `push`, this is the branch or tag ref that was pushed. For workflows triggered by `pull_request` that were not merged, this is the pull request merge branch. If the pull request was merged, this is the head branch. For workflows triggered by `release`, this is the release tag created. For other triggers, this is the branch or tag ref that triggered the workflow run. This is only set if a branch or tag is available for the event type. The ref given is fully-formed, meaning that for branches the format is `refs/heads/<branch_name>`. For pull requests events except `pull_request_target` that were not merged, it is `refs/pull/<pr_number>/merge`. `pull_request_target` events have the `ref` from the base branch. For tags it is `refs/tags/<tag_name>`. For example, `refs/heads/feature-branch-1`. |
| `GITHUB_REF_NAME`            | The short ref name of the branch or tag that triggered the workflow run. This value matches the branch or tag name shown on GitHub. For example, `feature-branch-1`.<br><br>For pull requests that were not merged, the format is `<pr_number>/merge`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `GITHUB_REF_PROTECTED`       | `true` if branch protections or [rulesets](/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository) are configured for the ref that triggered the workflow run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `GITHUB_REF_TYPE`            | The type of ref that triggered the workflow run. Valid values are `branch` or `tag`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `GITHUB_REPOSITORY`          | The owner and repository name. For example, `octocat/Hello-World`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `GITHUB_REPOSITORY_ID`       | The ID of the repository. For example, `123456789`. Note that this is different from the repository name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `GITHUB_REPOSITORY_OWNER`    | The repository owner's name. For example, `octocat`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `GITHUB_REPOSITORY_OWNER_ID` | The repository owner's account ID. For example, `1234567`. Note that this is different from the owner's name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `GITHUB_RETENTION_DAYS`      | The number of days that workflow run logs and artifacts are kept. For example, `90`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `GITHUB_RUN_ATTEMPT`         | A unique number for each attempt of a particular workflow run in a repository. This number begins at 1 for the workflow run's first attempt, and increments with each re-run. For example, `3`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `GITHUB_RUN_ID`              | A unique number for each workflow run within a repository. This number does not change if you re-run the workflow run. For example, `1658821493`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `GITHUB_RUN_NUMBER`          | A unique number for each run of a particular workflow in a repository. This number begins at 1 for the workflow's first run, and increments with each new run. This number does not change if you re-run the workflow run. For example, `3`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `GITHUB_SERVER_URL`          | The URL of the GitHub server. For example: `https://github.com`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `GITHUB_SHA`                 | The commit SHA that triggered the workflow. The value of this commit SHA depends on the event that triggered the workflow. For more information, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows). For example, `ffac537e6cbbf934b08745a378932722df287a53`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `GITHUB_STEP_SUMMARY`        | The path on the runner to the file that contains job summaries from workflow commands. The path to this file is unique to the current step and changes for each step in a job. For example, `/home/runner/_layout/_work/_temp/_runner_file_commands/step_summary_1cb22d7f-5663-41a8-9ffc-13472605c76c`. For more information, see [Workflow commands for GitHub Actions](/en/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary).                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `GITHUB_TRIGGERING_ACTOR`    | The username of the user that initiated the workflow run. If the workflow run is a re-run, this value may differ from `github.actor`. Any workflow re-runs will use the privileges of `github.actor`, even if the actor initiating the re-run (`github.triggering_actor`) has different privileges.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `GITHUB_WORKFLOW`            | The name of the workflow. For example, `My test workflow`. If the workflow file doesn't specify a `name`, the value of this variable is the full path of the workflow file in the repository.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `GITHUB_WORKFLOW_REF`        | The ref path to the workflow. For example, `octocat/hello-world/.github/workflows/my-workflow.yml@refs/heads/my_branch`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `GITHUB_WORKFLOW_SHA`        | The commit SHA for the workflow file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `GITHUB_WORKSPACE`           | The default working directory on the runner for steps, and the default location of your repository when using the [`checkout`](https://github.com/actions/checkout) action. For example, `/home/runner/work/my-repo-name/my-repo-name`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `RUNNER_ARCH`                | The architecture of the runner executing the job. Possible values are `X86`, `X64`, `ARM`, or `ARM64`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `RUNNER_DEBUG`               | This is set only if [debug logging](/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging) is enabled, and always has the value of `1`. It can be useful as an indicator to enable additional debugging or verbose logging in your own job steps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `RUNNER_ENVIRONMENT`         | The environment of the runner executing the job. Possible values are: `github-hosted` for GitHub-hosted runners provided by GitHub, and `self-hosted` for self-hosted runners configured by the repository owner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `RUNNER_NAME`                | The name of the runner executing the job. This name may not be unique in a workflow run as runners at the repository and organization levels could use the same name. For example, `Hosted Agent`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `RUNNER_OS`                  | The operating system of the runner executing the job. Possible values are `Linux`, `Windows`, or `macOS`. For example, `Windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `RUNNER_TEMP`                | The path to a temporary directory on the runner. This directory is emptied at the beginning and end of each job. Note that files will not be removed if the runner's user account does not have permission to delete them. For example, `D:\a\_temp`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `RUNNER_TOOL_CACHE`          | The path to the directory containing preinstalled tools for GitHub-hosted runners. For more information, see [GitHub-hosted runners](/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-software). For example, `C:\hostedtoolcache\windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

> \[!NOTE]
> If you need to use a workflow run's URL from within a job, you can combine these variables: `$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID`

## Naming conventions for configuration variables

The following rules apply to configuration variable names:

* Can only contain alphanumeric characters (`[a-z]`, `[A-Z]`, `[0-9]`) or underscores (`_`). Spaces are not allowed.
* Must not start with the `GITHUB_` prefix.
* Must not start with a number.
* Are case insensitive when referenced. GitHub stores secret names as uppercase regardless of how they are entered.
* Must be unique to the repository, organization, or enterprise where they are created.

## Naming conventions for environment variables

When you set an environment variable, you cannot use any of the default environment variable names. For a complete list of default environment variables, see [Variables reference](/en/actions/reference/variables-reference#default-environment-variables) below. If you attempt to override the value of one of these default variables, the assignment is ignored.

> \[!NOTE]
> You can list the entire set of environment variables that are available to a workflow step by using <span style="white-space: nowrap;">`run: env`</span> in a step and then examining the output for the step.

## Configuration variable precedence

If a variable with the same name exists at multiple levels, the variable at the lowest level takes precedence. For example, if an organization-level variable has the same name as a repository-level variable, then the repository-level variable takes precedence. Similarly, if an organization, repository, and environment all have a variable with the same name, the environment-level variable takes precedence.

> \[!NOTE]
> Environment-level variables are only available on the runner after the job starts executing. This means that environment-level variables won't overwrite variables in the `env` and `vars` contexts.

For reusable workflows, the variables from the caller workflow's repository are used. Variables from the repository that contains the called workflow are not made available to the caller workflow.

## Limits for configuration variables

Individual variables are limited to 48 KB in size.

You can store up to 1,000 organization variables, 500 variables per repository, and 100 variables per environment. The total combined size limit for organization and repository variables is 256 KB per workflow run.

A workflow created in a repository can access the following number of variables:

* Up to 500 repository variables, if the total size of repository variables is less than 256 KB. If the total size of repository variables exceeds 256 KB, only the repository variables that fall below the limit will be available (as sorted alphabetically by variable name).
* Up to 1,000 organization variables, if the total combined size of repository and organization variables is less than 256 KB. If the total combined size of organization and repository variables exceeds 256 KB, only the organization variables that fall below that limit will be available (after accounting for repository variables and as sorted alphabetically by variable name).
* Up to 100 environment-level variables.

> \[!NOTE]
> Environment-level variables do not count toward the 256 KB total size limit. If you exceed the combined size limit for repository and organization variables and still need additional variables, you can use an environment and define additional variables in the environment.

## Supported contexts

You will commonly use either the `env` or `github` context to access variable values in parts of the workflow that are processed before jobs are sent to runners.

> \[!WARNING] Do not print the `github` context to logs. It contains sensitive information.

| Context  | Use case                                                                           | Example                                                              |
| -------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `env`    | Reference custom variables defined in the workflow.                                | <span style="white-space: nowrap;">`${{ env.MY_VARIABLE }}`</span>   |
| `github` | Reference information about the workflow run and the event that triggered the run. | <span style="white-space: nowrap;">`${{ github.repository }}`</span> |
---

# Workflow cancellation reference

Find information on the steps GitHub takes to cancel a workflow run.

When canceling a workflow run, you may be running other software that uses resources related to the workflow run. To help you free up resources related to the workflow run, it may help to understand the steps GitHub performs to cancel a workflow run.

1. To cancel the workflow run, the server re-evaluates `if` conditions for all currently running jobs. If the condition evaluates to `true`, the job will not get canceled. For example, the condition `if: always()` would evaluate to true and the job continues to run. When there is no condition, that is the equivalent of the condition `if: success()`, which only runs if the previous step finished successfully.
2. For jobs that need to be canceled, the server sends a cancellation message to all the runner machines with jobs that need to be canceled.
3. For jobs that continue to run, the server re-evaluates `if` conditions for the unfinished steps. If the condition evaluates to `true`, the step continues to run. You can use the `cancelled` expression to apply a status check of `cancelled()`. For more information, see [Evaluate expressions in workflows and actions](/en/actions/reference/evaluate-expressions-in-workflows-and-actions#cancelled).
4. For steps that need to be canceled, the runner machine sends `SIGINT/Ctrl-C` to the step's entry process (`node` for JavaScript actions, `docker` for container actions, and `bash/cmd/pwd` when using `run` in a step). If the process doesn't exit within 7500 ms, the runner will send `SIGTERM/Ctrl-Break` to the process, then wait for 2500 ms for the process to exit. If the process is still running, the runner kills the process tree.
5. After the 5 minute cancellation timeout period, the server will forcibly terminate all jobs and steps that are still running.