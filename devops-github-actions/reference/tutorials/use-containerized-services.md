# Use Containerized Services

---

# Creating a Docker container action

In this tutorial, you'll learn how to build a Docker container action.

## Introduction

In this guide, you'll learn about the basic components needed to create and use a packaged Docker container action. To focus this guide on the components needed to package the action, the functionality of the action's code is minimal. The action prints "Hello World" in the logs or "Hello \[who-to-greet]" if you provide a custom name.

Once you complete this project, you should understand how to build your own Docker container action and test it in a workflow.

Self-hosted runners must use a Linux operating system and have Docker installed to run Docker container actions. For more information about the requirements of self-hosted runners, see [Self-hosted runners](/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners#requirements-for-self-hosted-runner-machines).

> \[!WARNING]
> When creating workflows and actions, you should always consider whether your code might execute untrusted input from possible attackers. Certain contexts should be treated as untrusted input, as an attacker could insert their own malicious content. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#understanding-the-risk-of-script-injections).

## Prerequisites

* You must create a repository on GitHub and clone it to your workstation. For more information, see [Creating a new repository](/en/repositories/creating-and-managing-repositories/creating-a-new-repository) and [Cloning a repository](/en/repositories/creating-and-managing-repositories/cloning-a-repository).
* If your repository uses Git LFS, you must include the objects in archives of your repository. For more information, see [Managing Git LFS objects in archives of your repository](/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-git-lfs-objects-in-archives-of-your-repository).
* You may find it helpful to have a basic understanding of GitHub Actions, environment variables and the Docker container filesystem. For more information, see [Store information in variables](/en/actions/learn-github-actions/variables) and [GitHub-hosted runners](/en/enterprise-cloud@latest/actions/using-github-hosted-runners/about-github-hosted-runners#docker-container-filesystem).

## Creating a Dockerfile

In your new `hello-world-docker-action` directory, create a new `Dockerfile` file. Make sure that your filename is capitalized correctly (use a capital `D` but not a capital `f`) if you're having issues. For more information, see [Dockerfile support for GitHub Actions](/en/actions/creating-actions/dockerfile-support-for-github-actions).

**Dockerfile**

```dockerfile copy
# Container image that runs your code
FROM alpine:3.10

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY entrypoint.sh /entrypoint.sh

# Code file to execute when the docker container starts up (`entrypoint.sh`)
ENTRYPOINT ["/entrypoint.sh"]
```

## Creating an action metadata file

Create a new `action.yml` file in the `hello-world-docker-action` directory you created above. For more information, see [Metadata syntax reference](/en/actions/creating-actions/metadata-syntax-for-github-actions).

**action.yml**

```yaml copy
# action.yml
name: 'Hello World'
description: 'Greet someone and record the time'
inputs:
  who-to-greet:  # id of input
    description: 'Who to greet'
    required: true
    default: 'World'
outputs:
  time: # id of output
    description: 'The time we greeted you'
runs:
  using: 'docker'
  image: 'Dockerfile'
  args:
    - ${{ inputs.who-to-greet }}
```

This metadata defines one `who-to-greet` input and one `time` output parameter. To pass inputs to the Docker container, you should declare the input using `inputs` and pass the input in the `args` keyword. Everything you include in `args` is passed to the container, but for better discoverability for users of your action, we recommended using inputs.

GitHub will build an image from your `Dockerfile`, and run commands in a new container using this image.

## Writing the action code

You can choose any base Docker image and, therefore, any language for your action. The following shell script example uses the `who-to-greet` input variable to print "Hello \[who-to-greet]" in the log file.

Next, the script gets the current time and sets it as an output variable that actions running later in a job can use. In order for GitHub to recognize output variables, you must write them to the `$GITHUB_OUTPUT` environment file: `echo "<output name>=<value>" >> $GITHUB_OUTPUT`. For more information, see [Workflow commands for GitHub Actions](/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-output-parameter).

1. Create a new `entrypoint.sh` file in the `hello-world-docker-action` directory.

2. Add the following code to your `entrypoint.sh` file.

   **entrypoint.sh**

   ```shell copy
   #!/bin/sh -l

   echo "Hello $1"
   time=$(date)
   echo "time=$time" >> $GITHUB_OUTPUT

   ```

   If `entrypoint.sh` executes without any errors, the action's status is set to `success`. You can also explicitly set exit codes in your action's code to provide an action's status. For more information, see [Setting exit codes for actions](/en/actions/creating-actions/setting-exit-codes-for-actions).

3. Make your `entrypoint.sh` file executable. Git provides a way to explicitly change the permission mode of a file so that it doesn’t get reset every time there is a clone/fork.

   ```shell copy
   git add entrypoint.sh
   git update-index --chmod=+x entrypoint.sh
   ```

4. Optionally, to check the permission mode of the file in the git index, run the following command.

   ```shell copy
   git ls-files --stage entrypoint.sh
   ```

   An output like `100755 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 0       entrypoint.sh` means the file has the executable permission. In this example, `755` denotes the executable permission.

## Creating a README

To let people know how to use your action, you can create a README file. A README is most helpful when you plan to share your action publicly, but is also a great way to remind you or your team how to use the action.

In your `hello-world-docker-action` directory, create a `README.md` file that specifies the following information:

* A detailed description of what the action does.
* Required input and output arguments.
* Optional input and output arguments.
* Secrets the action uses.
* Environment variables the action uses.
* An example of how to use your action in a workflow.

**README.md**

```markdown copy
# Hello world docker action

This action prints "Hello World" or "Hello" + the name of a person to greet to the log.

## Inputs

## `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## Outputs

## `time`

The time we greeted you.

## Example usage

uses: actions/hello-world-docker-action@v2
with:
  who-to-greet: 'Mona the Octocat'
```

## Commit, tag, and push your action

From your terminal, commit your `action.yml`, `entrypoint.sh`, `Dockerfile`, and `README.md` files.

It's best practice to also add a version tag for releases of your action. For more information on versioning your action, see [About custom actions](/en/actions/creating-actions/about-custom-actions#using-release-management-for-actions).

```shell copy
git add action.yml entrypoint.sh Dockerfile README.md
git commit -m "My first action is ready"
git tag -a -m "My first action release" v1
git push --follow-tags
```

## Testing out your action in a workflow

Now you're ready to test your action out in a workflow.

* When an action is in a private repository, you can control who can access it. For more information, see [Managing GitHub Actions settings for a repository](/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#allowing-access-to-components-in-a-private-repository).
* When an action is in an internal repository, the action can only be used in workflows in the same repository.
* Public actions can be used by workflows in any repository.

### Example using a public action

The following workflow code uses the completed *hello world* action in the public [`actions/hello-world-docker-action`](https://github.com/actions/hello-world-docker-action) repository. Copy the following workflow example code into a `.github/workflows/main.yml` file, but replace the `actions/hello-world-docker-action` with your repository and action name. You can also replace the `who-to-greet` input with your name. Public actions can be used even if they're not published to GitHub Marketplace. For more information, see [Publishing actions in GitHub Marketplace](/en/actions/creating-actions/publishing-actions-in-github-marketplace#publishing-an-action).

**.github/workflows/main.yml**

```yaml copy
on: [push]

jobs:
  hello_world_job:
    runs-on: ubuntu-latest
    name: A job to say hello
    steps:
      - name: Hello world action step
        id: hello
        uses: actions/hello-world-docker-action@v2
        with:
          who-to-greet: 'Mona the Octocat'
      # Use the output from the `hello` step
      - name: Get the output time
        run: echo "The time was ${{ steps.hello.outputs.time }}"
```

### Example using a private action

Copy the following example workflow code into a `.github/workflows/main.yml` file in your action's repository. You can also replace the `who-to-greet` input with your name. This private action can't be published to GitHub Marketplace, and can only be used in this repository.

**.github/workflows/main.yml**

```yaml copy
on: [push]

jobs:
  hello_world_job:
    runs-on: ubuntu-latest
    name: A job to say hello
    steps:
      # To use this repository's private action,
      # you must check out the repository
      - name: Checkout
        uses: actions/checkout@v5
      - name: Hello world action step
        uses: ./ # Uses an action in the root directory
        id: hello
        with:
          who-to-greet: 'Mona the Octocat'
      # Use the output from the `hello` step
      - name: Get the output time
        run: echo "The time was ${{ steps.hello.outputs.time }}"
```

From your repository, click the **Actions** tab, and select the latest workflow run. Under **Jobs** or in the visualization graph, click **A job to say hello**.

Click **Hello world action step**, and you should see "Hello Mona the Octocat" or the name you used for the `who-to-greet` input printed in the log. To see the timestamp, click **Get the output time**.

## Accessing files created by a container action

When a container action runs, it will automatically map the default working directory (`GITHUB_WORKSPACE`) on the runner with the `/github/workspace` directory on the container. Any files added to this directory on the container will be available to any subsequent steps in the same job. For example, if you have a container action that builds your project, and you would like to upload the build output as an artifact, you can use the following steps.

**workflow\.yml**

```yaml copy
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5

      # Output build artifacts to /github/workspace on the container.
      - name: Containerized Build
        uses: ./.github/actions/my-container-action

      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: workspace_artifacts
          path: ${{ github.workspace }}
```

For more information about uploading build output as an artifact, see [Store and share data with workflow artifacts](/en/actions/using-workflows/storing-workflow-data-as-artifacts).

## Example Docker container actions on GitHub.com

You can find many examples of Docker container actions on GitHub.com.

* [github/issue-metrics](https://github.com/github/issue-metrics)
* [microsoft/infersharpaction](https://github.com/microsoft/infersharpaction)
* [microsoft/ps-docs](https://github.com/microsoft/ps-docs)
---

# Creating PostgreSQL service containers

You can create a PostgreSQL service container to use in your workflow. This guide shows examples of creating a PostgreSQL service for jobs that run in containers or directly on the runner machine.

## Introduction

This guide shows you workflow examples that configure a service container using the Docker Hub `postgres` image. The workflow runs a script that connects to the PostgreSQL service, creates a table, and then populates it with data. To test that the workflow creates and populates the PostgreSQL table, the script prints the data from the table to the console.

> \[!NOTE]
> If your workflows use Docker container actions, job containers, or service containers, then you must use a Linux runner:
>
> * If you are using GitHub-hosted runners, you must use an Ubuntu runner.
> * If you are using self-hosted runners, you must use a Linux machine as your runner and Docker must be installed.

## Prerequisites

You should be familiar with how service containers work with GitHub Actions and the networking differences between running jobs directly on the runner or in a container. For more information, see [Communicating with Docker service containers](/en/actions/using-containerized-services/about-service-containers).

You may also find it helpful to have a basic understanding of YAML, the syntax for GitHub Actions, and PostgreSQL. For more information, see:

* [Writing workflows](/en/actions/learn-github-actions)
* [PostgreSQL tutorial](https://www.postgresqltutorial.com/) in the PostgreSQL documentation

## Running jobs in containers

Configuring jobs to run in a container simplifies networking configurations between the job and the service containers. Docker containers on the same user-defined bridge network expose all ports to each other, so you don't need to map any of the service container ports to the Docker host. You can access the service container from the job container using the label you configure in the workflow.

You can copy this workflow file to the `.github/workflows` directory of your repository and modify it as needed.

```yaml copy
name: PostgreSQL service example
on: push

jobs:
  # Label of the container job
  container-job:
    # Containers must run in Linux based operating systems
    runs-on: ubuntu-latest
    # Docker Hub image that `container-job` executes in
    container: node:20-bookworm-slim

    # Service containers to run with `container-job`
    services:
      # Label used to access the service container
      postgres:
        # Docker Hub image
        image: postgres
        # Provide the password for postgres
        env:
          POSTGRES_PASSWORD: postgres
        # Set health checks to wait until postgres has started
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      # Downloads a copy of the code in your repository before running CI tests
      - name: Check out repository code
        uses: actions/checkout@v5

      # Performs a clean installation of all dependencies in the `package.json` file
      # For more information, see https://docs.npmjs.com/cli/ci.html
      - name: Install dependencies
        run: npm ci

      - name: Connect to PostgreSQL
        # Runs a script that creates a PostgreSQL table, populates
        # the table with data, and then retrieves the data.
        run: node client.js
        # Environment variables used by the `client.js` script to create a new PostgreSQL table.
        env:
          # The hostname used to communicate with the PostgreSQL service container
          POSTGRES_HOST: postgres
          # The default PostgreSQL port
          POSTGRES_PORT: 5432
```

### Configuring the runner job for jobs in containers

This workflow configures a job that runs in the `node:20-bookworm-slim` container and uses the `ubuntu-latest`  GitHub-hosted runner as the Docker host for the container. For more information about the `node:20-bookworm-slim` container, see the [node image](https://hub.docker.com/_/node) on Docker Hub.

The workflow configures a service container with the label `postgres`. All services must run in a container, so each service requires that you specify the container `image`. This example uses the `postgres` container image, provides the default PostgreSQL password, and includes health check options to make sure the service is running. For more information, see the [postgres image](https://hub.docker.com/_/postgres) on Docker Hub.

```yaml copy
jobs:
  # Label of the container job
  container-job:
    # Containers must run in Linux based operating systems
    runs-on: ubuntu-latest
    # Docker Hub image that `container-job` executes in
    container: node:20-bookworm-slim

    # Service containers to run with `container-job`
    services:
      # Label used to access the service container
      postgres:
        # Docker Hub image
        image: postgres
        # Provide the password for postgres
        env:
          POSTGRES_PASSWORD: postgres
        # Set health checks to wait until postgres has started
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
```

### Configuring the steps for jobs in containers

The workflow performs the following steps:

1. Checks out the repository on the runner
2. Installs dependencies
3. Runs a script to create a client

```yaml copy
steps:
  # Downloads a copy of the code in your repository before running CI tests
  - name: Check out repository code
    uses: actions/checkout@v5

  # Performs a clean installation of all dependencies in the `package.json` file
  # For more information, see https://docs.npmjs.com/cli/ci.html
  - name: Install dependencies
    run: npm ci

  - name: Connect to PostgreSQL
    # Runs a script that creates a PostgreSQL table, populates
    # the table with data, and then retrieves the data.
    run: node client.js
    # Environment variable used by the `client.js` script to create
    # a new PostgreSQL client.
    env:
      # The hostname used to communicate with the PostgreSQL service container
      POSTGRES_HOST: postgres
      # The default PostgreSQL port
      POSTGRES_PORT: 5432
```

The *client.js* script looks for the `POSTGRES_HOST` and `POSTGRES_PORT` environment variables to create the client. The workflow sets those two environment variables as part of the "Connect to PostgreSQL" step to make them available to the *client.js* script. For more information about the script, see [Testing the PostgreSQL service container](#testing-the-postgresql-service-container).

The hostname of the PostgreSQL service is the label you configured in your workflow, in this case, `postgres`. Because Docker containers on the same user-defined bridge network open all ports by default, you'll be able to access the service container on the default PostgreSQL port 5432.

## Running jobs directly on the runner machine

When you run a job directly on the runner machine, you'll need to map the ports on the service container to ports on the Docker host. You can access service containers from the Docker host using `localhost` and the Docker host port number.

You can copy this workflow file to the `.github/workflows` directory of your repository and modify it as needed.

```yaml copy
name: PostgreSQL Service Example
on: push

jobs:
  # Label of the runner job
  runner-job:
    # You must use a Linux environment when using service containers or container jobs
    runs-on: ubuntu-latest

    # Service containers to run with `runner-job`
    services:
      # Label used to access the service container
      postgres:
        # Docker Hub image
        image: postgres
        # Provide the password for postgres
        env:
          POSTGRES_PASSWORD: postgres
        # Set health checks to wait until postgres has started
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          # Maps tcp port 5432 on service container to the host
          - 5432:5432

    steps:
      # Downloads a copy of the code in your repository before running CI tests
      - name: Check out repository code
        uses: actions/checkout@v5

      # Performs a clean installation of all dependencies in the `package.json` file
      # For more information, see https://docs.npmjs.com/cli/ci.html
      - name: Install dependencies
        run: npm ci

      - name: Connect to PostgreSQL
        # Runs a script that creates a PostgreSQL table, populates
        # the table with data, and then retrieves the data
        run: node client.js
        # Environment variables used by the `client.js` script to create
        # a new PostgreSQL table.
        env:
          # The hostname used to communicate with the PostgreSQL service container
          POSTGRES_HOST: localhost
          # The default PostgreSQL port
          POSTGRES_PORT: 5432
```

### Configuring the runner job for jobs directly on the runner machine

The example uses the `ubuntu-latest`  GitHub-hosted runner as the Docker host.

The workflow configures a service container with the label `postgres`. All services must run in a container, so each service requires that you specify the container `image`. This example uses the `postgres` container image, provides the default PostgreSQL password, and includes health check options to make sure the service is running. For more information, see the [postgres image](https://hub.docker.com/_/postgres) on Docker Hub.

The workflow maps port 5432 on the PostgreSQL service container to the Docker host. For more information about the `ports` keyword, see [Communicating with Docker service containers](/en/actions/using-containerized-services/about-service-containers#mapping-docker-host-and-service-container-ports).

```yaml copy
jobs:
  # Label of the runner job
  runner-job:
    # You must use a Linux environment when using service containers or container jobs
    runs-on: ubuntu-latest

    # Service containers to run with `runner-job`
    services:
      # Label used to access the service container
      postgres:
        # Docker Hub image
        image: postgres
        # Provide the password for postgres
        env:
          POSTGRES_PASSWORD: postgres
        # Set health checks to wait until postgres has started
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          # Maps tcp port 5432 on service container to the host
          - 5432:5432
```

### Configuring the steps for jobs directly on the runner machine

The workflow performs the following steps:

1. Checks out the repository on the runner
2. Installs dependencies
3. Runs a script to create a client

```yaml copy
steps:
  # Downloads a copy of the code in your repository before running CI tests
  - name: Check out repository code
    uses: actions/checkout@v5

  # Performs a clean installation of all dependencies in the `package.json` file
  # For more information, see https://docs.npmjs.com/cli/ci.html
  - name: Install dependencies
    run: npm ci

  - name: Connect to PostgreSQL
    # Runs a script that creates a PostgreSQL table, populates
    # the table with data, and then retrieves the data
    run: node client.js
    # Environment variables used by the `client.js` script to create
    # a new PostgreSQL table.
    env:
      # The hostname used to communicate with the PostgreSQL service container
      POSTGRES_HOST: localhost
      # The default PostgreSQL port
      POSTGRES_PORT: 5432
```

The *client.js* script looks for the `POSTGRES_HOST` and `POSTGRES_PORT` environment variables to create the client. The workflow sets those two environment variables as part of the "Connect to PostgreSQL" step to make them available to the *client.js* script. For more information about the script, see [Testing the PostgreSQL service container](#testing-the-postgresql-service-container).

The hostname is `localhost` or `127.0.0.1`.

## Testing the PostgreSQL service container

You can test your workflow using the following script, which connects to the PostgreSQL service and adds a new table with some placeholder data. The script then prints the values stored in the PostgreSQL table to the terminal. Your script can use any language you'd like, but this example uses Node.js and the `pg` npm module. For more information, see the [npm pg module](https://www.npmjs.com/package/pg).

You can modify *client.js* to include any PostgreSQL operations needed by your workflow. In this example, the script connects to the PostgreSQL service, adds a table to the `postgres` database, inserts some placeholder data, and then retrieves the data.

Add a new file called *client.js* to your repository with the following code.

```javascript copy
const { Client } = require('pg');

const pgclient = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
});

pgclient.connect();

const table = 'CREATE TABLE student(id SERIAL PRIMARY KEY, firstName VARCHAR(40) NOT NULL, lastName VARCHAR(40) NOT NULL, age INT, address VARCHAR(80), email VARCHAR(40))'
const text = 'INSERT INTO student(firstname, lastname, age, address, email) VALUES($1, $2, $3, $4, $5) RETURNING *'
const values = ['Mona the', 'Octocat', 9, '88 Colin P Kelly Jr St, San Francisco, CA 94107, United States', 'octocat@github.com']

pgclient.query(table, (err, res) => {
    if (err) throw err
});

pgclient.query(text, values, (err, res) => {
    if (err) throw err
});

pgclient.query('SELECT * FROM student', (err, res) => {
    if (err) throw err
    console.log(err, res.rows) // Print the data in student table
    pgclient.end()
});
```

The script creates a new connection to the PostgreSQL service, and uses the `POSTGRES_HOST` and `POSTGRES_PORT` environment variables to specify the PostgreSQL service IP address and port. If `host` and `port` are not defined, the default host is `localhost` and the default port is 5432.

The script creates a table and populates it with placeholder data. To test that the `postgres` database contains the data, the script prints the contents of the table to the console log.

When you run this workflow, you should see the following output in the "Connect to PostgreSQL" step, which confirms that you successfully created the PostgreSQL table and added data:

```text
null [ { id: 1,
    firstname: 'Mona the',
    lastname: 'Octocat',
    age: 9,
    address:
     '88 Colin P Kelly Jr St, San Francisco, CA 94107, United States',
    email: 'octocat@github.com' } ]
```
---

# Creating Redis service containers

You can use service containers to create a Redis client in your workflow. This guide shows examples of creating a Redis service for jobs that run in containers or directly on the runner machine.

## Introduction

This guide shows you workflow examples that configure a service container using the Docker Hub `redis` image. The workflow runs a script to create a Redis client and populate the client with data. To test that the workflow creates and populates the Redis client, the script prints the client's data to the console.

> \[!NOTE]
> If your workflows use Docker container actions, job containers, or service containers, then you must use a Linux runner:
>
> * If you are using GitHub-hosted runners, you must use an Ubuntu runner.
> * If you are using self-hosted runners, you must use a Linux machine as your runner and Docker must be installed.

## Prerequisites

You should be familiar with how service containers work with GitHub Actions and the networking differences between running jobs directly on the runner or in a container. For more information, see [Communicating with Docker service containers](/en/actions/using-containerized-services/about-service-containers).

You may also find it helpful to have a basic understanding of YAML, the syntax for GitHub Actions, and Redis. For more information, see:

* [Writing workflows](/en/actions/learn-github-actions)
* [Getting Started with Redis](https://redis.io/learn/howtos/quick-start) in the Redis documentation

## Running jobs in containers

Configuring jobs to run in a container simplifies networking configurations between the job and the service containers. Docker containers on the same user-defined bridge network expose all ports to each other, so you don't need to map any of the service container ports to the Docker host. You can access the service container from the job container using the label you configure in the workflow.

You can copy this workflow file to the `.github/workflows` directory of your repository and modify it as needed.

```yaml copy
name: Redis container example
on: push

jobs:
  # Label of the container job
  container-job:
    # Containers must run in Linux based operating systems
    runs-on: ubuntu-latest
    # Docker Hub image that `container-job` executes in
    container: node:20-bookworm-slim

    # Service containers to run with `container-job`
    services:
      # Label used to access the service container
      redis:
        # Docker Hub image
        image: redis
        # Set health checks to wait until redis has started
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      # Downloads a copy of the code in your repository before running CI tests
      - name: Check out repository code
        uses: actions/checkout@v5

      # Performs a clean installation of all dependencies in the `package.json` file
      # For more information, see https://docs.npmjs.com/cli/ci.html
      - name: Install dependencies
        run: npm ci

      - name: Connect to Redis
        # Runs a script that creates a Redis client, populates
        # the client with data, and retrieves data
        run: node client.js
        # Environment variable used by the `client.js` script to create a new Redis client.
        env:
          # The hostname used to communicate with the Redis service container
          REDIS_HOST: redis
          # The default Redis port
          REDIS_PORT: 6379
```

### Configuring the container job

This workflow configures a job that runs in the `node:20-bookworm-slim` container and uses the `ubuntu-latest`  GitHub-hosted runner as the Docker host for the container. For more information about the `node:20-bookworm-slim` container, see the [node image](https://hub.docker.com/_/node) on Docker Hub.

The workflow configures a service container with the label `redis`. All services must run in a container, so each service requires that you specify the container `image`. This example uses the `redis` container image, and includes health check options to make sure the service is running. Append a tag to the image name to specify a version, e.g. `redis:6`. For more information, see the [redis image](https://hub.docker.com/_/redis) on Docker Hub.

```yaml copy
jobs:
  # Label of the container job
  container-job:
    # Containers must run in Linux based operating systems
    runs-on: ubuntu-latest
    # Docker Hub image that `container-job` executes in
    container: node:20-bookworm-slim

    # Service containers to run with `container-job`
    services:
      # Label used to access the service container
      redis:
        # Docker Hub image
        image: redis
        # Set health checks to wait until redis has started
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
```

### Configuring the steps for the container job

The workflow performs the following steps:

1. Checks out the repository on the runner
2. Installs dependencies
3. Runs a script to create a client

```yaml copy
steps:
  # Downloads a copy of the code in your repository before running CI tests
  - name: Check out repository code
    uses: actions/checkout@v5

  # Performs a clean installation of all dependencies in the `package.json` file
  # For more information, see https://docs.npmjs.com/cli/ci.html
  - name: Install dependencies
    run: npm ci

  - name: Connect to Redis
    # Runs a script that creates a Redis client, populates
    # the client with data, and retrieves data
    run: node client.js
    # Environment variable used by the `client.js` script to create a new Redis client.
    env:
      # The hostname used to communicate with the Redis service container
      REDIS_HOST: redis
      # The default Redis port
      REDIS_PORT: 6379
```

The *client.js* script looks for the `REDIS_HOST` and `REDIS_PORT` environment variables to create the client. The workflow sets those two environment variables as part of the "Connect to Redis" step to make them available to the *client.js* script. For more information about the script, see [Testing the Redis service container](#testing-the-redis-service-container).

The hostname of the Redis service is the label you configured in your workflow, in this case, `redis`. Because Docker containers on the same user-defined bridge network open all ports by default, you'll be able to access the service container on the default Redis port 6379.

## Running jobs directly on the runner machine

When you run a job directly on the runner machine, you'll need to map the ports on the service container to ports on the Docker host. You can access service containers from the Docker host using `localhost` and the Docker host port number.

You can copy this workflow file to the `.github/workflows` directory of your repository and modify it as needed.

```yaml copy
name: Redis runner example
on: push

jobs:
  # Label of the runner job
  runner-job:
    # You must use a Linux environment when using service containers or container jobs
    runs-on: ubuntu-latest

    # Service containers to run with `runner-job`
    services:
      # Label used to access the service container
      redis:
        # Docker Hub image
        image: redis
        # Set health checks to wait until redis has started
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          # Maps port 6379 on service container to the host
          - 6379:6379

    steps:
      # Downloads a copy of the code in your repository before running CI tests
      - name: Check out repository code
        uses: actions/checkout@v5

      # Performs a clean installation of all dependencies in the `package.json` file
      # For more information, see https://docs.npmjs.com/cli/ci.html
      - name: Install dependencies
        run: npm ci

      - name: Connect to Redis
        # Runs a script that creates a Redis client, populates
        # the client with data, and retrieves data
        run: node client.js
        # Environment variable used by the `client.js` script to create
        # a new Redis client.
        env:
          # The hostname used to communicate with the Redis service container
          REDIS_HOST: localhost
          # The default Redis port
          REDIS_PORT: 6379
```

### Configuring the runner job

The example uses the `ubuntu-latest`  GitHub-hosted runner as the Docker host.

The workflow configures a service container with the label `redis`. All services must run in a container, so each service requires that you specify the container `image`. This example uses the `redis` container image, and includes health check options to make sure the service is running. Append a tag to the image name to specify a version, e.g. `redis:6`. For more information, see the [redis image](https://hub.docker.com/_/redis) on Docker Hub.

The workflow maps port 6379 on the Redis service container to the Docker host. For more information about the `ports` keyword, see [Communicating with Docker service containers](/en/actions/using-containerized-services/about-service-containers#mapping-docker-host-and-service-container-ports).

```yaml copy
jobs:
  # Label of the runner job
  runner-job:
    # You must use a Linux environment when using service containers or container jobs
    runs-on: ubuntu-latest

    # Service containers to run with `runner-job`
    services:
      # Label used to access the service container
      redis:
        # Docker Hub image
        image: redis
        # Set health checks to wait until redis has started
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          # Maps port 6379 on service container to the host
          - 6379:6379
```

### Configuring the steps for the runner job

The workflow performs the following steps:

1. Checks out the repository on the runner
2. Installs dependencies
3. Runs a script to create a client

```yaml copy
steps:
  # Downloads a copy of the code in your repository before running CI tests
  - name: Check out repository code
    uses: actions/checkout@v5

  # Performs a clean installation of all dependencies in the `package.json` file
  # For more information, see https://docs.npmjs.com/cli/ci.html
  - name: Install dependencies
    run: npm ci

  - name: Connect to Redis
    # Runs a script that creates a Redis client, populates
    # the client with data, and retrieves data
    run: node client.js
    # Environment variable used by the `client.js` script to create
    # a new Redis client.
    env:
      # The hostname used to communicate with the Redis service container
      REDIS_HOST: localhost
      # The default Redis port
      REDIS_PORT: 6379
```

The *client.js* script looks for the `REDIS_HOST` and `REDIS_PORT` environment variables to create the client. The workflow sets those two environment variables as part of the "Connect to Redis" step to make them available to the *client.js* script. For more information about the script, see [Testing the Redis service container](#testing-the-redis-service-container).

The hostname is `localhost` or `127.0.0.1`.

## Testing the Redis service container

You can test your workflow using the following script, which creates a Redis client and populates the client with some placeholder data. The script then prints the values stored in the Redis client to the terminal. Your script can use any language you'd like, but this example uses Node.js and the `redis` npm module. For more information, see the [npm redis module](https://www.npmjs.com/package/redis).

You can modify *client.js* to include any Redis operations needed by your workflow. In this example, the script creates the Redis client instance, adds placeholder data, then retrieves the data.

Add a new file called *client.js* to your repository with the following code.

```javascript copy
const redis = require("redis");

// Creates a new Redis client
// If REDIS_HOST is not set, the default host is localhost
// If REDIS_PORT is not set, the default port is 6379
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on("error", (err) => console.log("Error", err));

(async () => {
  await redisClient.connect();

  // Sets the key "octocat" to a value of "Mona the octocat"
  const setKeyReply = await redisClient.set("octocat", "Mona the Octocat");
  console.log("Reply: " + setKeyReply);
  // Sets a key to "species", field to "octocat", and "value" to "Cat and Octopus"
  const SetFieldOctocatReply = await redisClient.hSet("species", "octocat", "Cat and Octopus");
  console.log("Reply: " + SetFieldOctocatReply);
  // Sets a key to "species", field to "dinotocat", and "value" to "Dinosaur and Octopus"
  const SetFieldDinotocatReply = await redisClient.hSet("species", "dinotocat", "Dinosaur and Octopus");
  console.log("Reply: " + SetFieldDinotocatReply);
  // Sets a key to "species", field to "robotocat", and "value" to "Cat and Robot"
  const SetFieldRobotocatReply = await redisClient.hSet("species", "robotocat", "Cat and Robot");
  console.log("Reply: " + SetFieldRobotocatReply);

  try {
    // Gets all fields in "species" key
    const replies = await redisClient.hKeys("species");
    console.log(replies.length + " replies:");
    replies.forEach((reply, i) => {
        console.log("    " + i + ": " + reply);
    });
    await redisClient.quit();
  }
  catch (err) {
    // statements to handle any exceptions
  }
})();
```

The script creates a new Redis client using the `createClient` method, which accepts a `host` and `port` parameter. The script uses the `REDIS_HOST` and `REDIS_PORT` environment variables to set the client's IP address and port. If `host` and `port` are not defined, the default host is `localhost` and the default port is 6379.

The script uses the `set` and `hset` methods to populate the database with some keys, fields, and values. To confirm that the Redis client contains the data, the script prints the contents of the database to the console log.

When you run this workflow, you should see the following output in the "Connect to Redis" step confirming you created the Redis client and added data:

```shell
Reply: OK
Reply: 1
Reply: 1
Reply: 1
3 replies:
    0: octocat
    1: dinotocat
    2: robotocat
```
---

# Communicating with Docker service containers

Learn how to use Docker service containers to connect databases, web services, memory caches, and other tools to your workflow.

## Communicating with Docker service containers

Service containers are Docker containers that provide a simple and portable way for you to host services that you might need to test or operate your application in a workflow. For example, your workflow might need to run integration tests that require access to a database and memory cache.

You can configure service containers for each job in a workflow. GitHub creates a fresh Docker container for each service configured in the workflow, and destroys the service container when the job completes. Steps in a job can communicate with all service containers that are part of the same job. However, you cannot create and use service containers inside a composite action.

> \[!NOTE]
> If your workflows use Docker container actions, job containers, or service containers, then you must use a Linux runner:
>
> * If you are using GitHub-hosted runners, you must use an Ubuntu runner.
> * If you are using self-hosted runners, you must use a Linux machine as your runner and Docker must be installed.

You can configure jobs in a workflow to run directly on a runner machine or in a Docker container. Communication between a job and its service containers is different depending on whether a job runs directly on the runner machine or in a container.

### Running jobs in a container

When you run jobs in a container, GitHub connects service containers to the job using Docker's user-defined bridge networks. For more information, see [Bridge network driver](https://docs.docker.com/engine/network/drivers/bridge/) in the Docker documentation.

Running the job and services in a container simplifies network access. You can access a service container using the label you configure in the workflow. The hostname of the service container is automatically mapped to the label name. For example, if you create a service container with the label `redis`, the hostname of the service container is `redis`.

You don't need to configure any ports for service containers. By default, all containers that are part of the same Docker network expose all ports to each other, and no ports are exposed outside of the Docker network.

### Running jobs on the runner machine

When running jobs directly on the runner machine, you can access service containers using `localhost:<port>` or `127.0.0.1:<port>`. GitHub configures the container network to enable communication from the service container to the Docker host.

When a job runs directly on a runner machine, the service running in the Docker container does not expose its ports to the job on the runner by default. You need to map ports on the service container to the Docker host. For more information, see [Communicating with Docker service containers](/en/actions/using-containerized-services/about-service-containers#mapping-docker-host-and-service-container-ports).

## Creating service containers

You can use the `services` keyword to create service containers that are part of a job in your workflow. For more information, see [`jobs.<job_id>.services`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idservices).

This example creates a service called `redis` in a job called `container-job`. The Docker host in this example is the `node:16-bullseye` container.

```yaml copy
name: Redis container example
on: push

jobs:
  # Label of the container job
  container-job:
    # Containers must run in Linux based operating systems
    runs-on: ubuntu-latest
    # Docker Hub image that `container-job` executes in
    container: node:16-bullseye

    # Service containers to run with `container-job`
    services:
      # Label used to access the service container
      redis:
        # Docker Hub image
        image: redis
```

## Mapping Docker host and service container ports

If your job runs in a Docker container, you do not need to map ports on the host or the service container. If your job runs directly on the runner machine, you'll need to map any required service container ports to ports on the host runner machine.

You can map service containers ports to the Docker host using the `ports` keyword. For more information, see [`jobs.<job_id>.services`](/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idservices).

| Value of `ports` | Description                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| `8080:80`        | Maps TCP port 80 in the container to port 8080 on the Docker host.                |
| `8080:80/udp`    | Maps UDP port 80 in the container to port 8080 on the Docker host.                |
| `8080/udp`       | Maps a randomly chosen port on the Docker host to UDP port 8080 in the container. |

When you map ports using the `ports` keyword, GitHub uses the `--publish` command to publish the container’s ports to the Docker host. For more information, see [Docker container networking](https://docs.docker.com/config/containers/container-networking/) in the Docker documentation.

When you specify the container port but not the Docker host port, the container port is randomly assigned to a free port. GitHub sets the assigned container port in the service container context. For example, for a `redis` service container, if you configured the Docker host port 5432, you can access the corresponding container port using the `job.services.redis.ports[5432]` context. For more information, see [Contexts reference](/en/actions/learn-github-actions/contexts#job-context).

### Example mapping Redis ports

This example maps the service container `redis` port 6379 to the Docker host port 6379.

```yaml copy
name: Redis Service Example
on: push

jobs:
  # Label of the container job
  runner-job:
    # You must use a Linux environment when using service containers or container jobs
    runs-on: ubuntu-latest

    # Service containers to run with `runner-job`
    services:
      # Label used to access the service container
      redis:
        # Docker Hub image
        image: redis
        #
        ports:
          # Opens tcp port 6379 on the host and service container
          - 6379:6379
```

## Authenticating with image registries

You can specify credentials for your service containers in case you need to authenticate with an image registry. This allows you to use images from private registries or to [increase your DockerHub rate limit](https://www.docker.com/increase-rate-limits/).

Here’s an example of authenticating with Docker Hub and the GitHub Container registry:

```yaml copy
jobs:
  build:
    services:
      redis:
        # Docker Hub image
        image: redis
        ports:
          - 6379:6379
        credentials:
          username: ${{ secrets.dockerhub_username }}
          password: ${{ secrets.dockerhub_password }}
      db:
        # Private registry image
        image: ghcr.io/octocat/testdb:latest
        credentials:
          username: ${{ github.repository_owner }}
          password: ${{ secrets.ghcr_password }}
```

## Further reading

* [Creating Redis service containers](/en/actions/using-containerized-services/creating-redis-service-containers)
* [Creating PostgreSQL service containers](/en/actions/using-containerized-services/creating-postgresql-service-containers)