# Create Actions

---

# Creating a composite action

In this tutorial, you'll learn how to build a composite action.

## Introduction

In this guide, you'll learn about the basic components needed to create and use a packaged composite action. To focus this guide on the components needed to package the action, the functionality of the action's code is minimal. The action prints "Hello World" and then "Goodbye", or if you provide a custom name, it prints "Hello \[who-to-greet]" and then "Goodbye". The action also maps a random number to the `random-number` output variable, and runs a script named `goodbye.sh`.

Once you complete this project, you should understand how to build your own composite action and test it in a workflow.

> \[!WARNING]
> When creating workflows and actions, you should always consider whether your code might execute untrusted input from possible attackers. Certain contexts should be treated as untrusted input, as an attacker could insert their own malicious content. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#understanding-the-risk-of-script-injections).

### Composite actions and reusable workflows

Composite actions allow you to collect a series of workflow job steps into a single action which you can then run as a single job step in multiple workflows. Reusable workflows provide another way of avoiding duplication, by allowing you to run a complete workflow from within other workflows. For more information, see [Reusing workflow configurations](/en/actions/using-workflows/avoiding-duplication).

## Prerequisites

> \[!NOTE]
> This example explains how to create a composite action within a separate repository. However, it is possible to create a composite action within the same repository. For more information, see [Creating a composite action](/en/actions/creating-actions/creating-a-composite-action#creating-a-composite-action-within-the-same-repository).

Before you begin, you'll create a repository on GitHub.

1. Create a new public repository on GitHub. You can choose any repository name, or use the following `hello-world-composite-action` example. You can add these files after your project has been pushed to GitHub. For more information, see [Creating a new repository](/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

2. Clone your repository to your computer. For more information, see [Cloning a repository](/en/repositories/creating-and-managing-repositories/cloning-a-repository).

3. From your terminal, change directories into your new repository.

   ```shell copy
   cd hello-world-composite-action
   ```

4. In the `hello-world-composite-action` repository, create a new file called `goodbye.sh` with example code:

   ```shell copy
   echo "echo Goodbye" > goodbye.sh
   ```

5. From your terminal, make `goodbye.sh` executable.

   <div class="ghd-tool linux">

   ```shell copy
   chmod +x goodbye.sh
   ```

   </div>

   <div class="ghd-tool mac">

   ```shell copy
   chmod +x goodbye.sh
   ```

   </div>

   <div class="ghd-tool windows">

   ```shell copy
   git add --chmod=+x -- goodbye.sh
   ```

   </div>

6. From your terminal, check in your `goodbye.sh` file.

   <div class="ghd-tool linux">

   ```shell copy
   git add goodbye.sh
   git commit -m "Add goodbye script"
   git push
   ```

   </div>

   <div class="ghd-tool mac">

   ```shell copy
   git add goodbye.sh
   git commit -m "Add goodbye script"
   git push
   ```

   </div>

   <div class="ghd-tool windows">

   ```shell copy
   git commit -m "Add goodbye script"
   git push
   ```

   </div>

## Creating an action metadata file

1. In the `hello-world-composite-action` repository, create a new file called `action.yml` and add the following example code. For more information about this syntax, see [Metadata syntax reference](/en/actions/creating-actions/metadata-syntax-for-github-actions#runs-for-composite-actions).

   ```yaml copy
   name: 'Hello World'
   description: 'Greet someone'
   inputs:
     who-to-greet:  # id of input
       description: 'Who to greet'
       required: true
       default: 'World'
   outputs:
     random-number:
       description: "Random number"
       value: ${{ steps.random-number-generator.outputs.random-number }}
   runs:
     using: "composite"
     steps:
       - name: Set Greeting
         run: echo "Hello $INPUT_WHO_TO_GREET."
         shell: bash
         env:
           INPUT_WHO_TO_GREET: ${{ inputs.who-to-greet }}

       - name: Random Number Generator
         id: random-number-generator
         run: echo "random-number=$(echo $RANDOM)" >> $GITHUB_OUTPUT
         shell: bash

       - name: Set GitHub Path
         run: echo "$GITHUB_ACTION_PATH" >> $GITHUB_PATH
         shell: bash
         env:
           GITHUB_ACTION_PATH: ${{ github.action_path }}

       - name: Run goodbye.sh
         run: goodbye.sh
         shell: bash

   ```

   This file defines the `who-to-greet` input, maps the random generated number to the `random-number` output variable, adds the action's path to the runner system path (to locate the `goodbye.sh` script during execution), and runs the `goodbye.sh` script.

   For more information about managing outputs, see [Metadata syntax reference](/en/actions/creating-actions/metadata-syntax-for-github-actions#outputs-for-composite-actions).

   For more information about how to use `github.action_path`, see [Contexts reference](/en/actions/learn-github-actions/contexts#github-context).

2. From your terminal, check in your `action.yml` file.

   ```shell copy
   git add action.yml
   git commit -m "Add action"
   git push
   ```

3. From your terminal, add a tag. This example uses a tag called `v1`. For more information, see [About custom actions](/en/actions/creating-actions/about-custom-actions#using-release-management-for-actions).

   ```shell copy
   git tag -a -m "Description of this release" v1
   git push --follow-tags
   ```

## Testing out your action in a workflow

The following workflow code uses the completed hello world action that you made in [Creating a composite action](/en/actions/creating-actions/creating-a-composite-action#creating-an-action-metadata-file).

Copy the workflow code into a `.github/workflows/main.yml` file in another repository, replacing `OWNER` and `SHA` with the repository owner and the SHA of the commit you want to use, respectively. You can also replace the `who-to-greet` input with your name.

```yaml copy
on: [push]

jobs:
  hello_world_job:
    runs-on: ubuntu-latest
    name: A job to say hello
    steps:
      - uses: actions/checkout@v5
      - id: foo
        uses: OWNER/hello-world-composite-action@SHA
        with:
          who-to-greet: 'Mona the Octocat'
      - run: echo random-number "$RANDOM_NUMBER"
        shell: bash
        env:
          RANDOM_NUMBER: ${{ steps.foo.outputs.random-number }}
```

From your repository, click the **Actions** tab, and select the latest workflow run. The output should include: "Hello Mona the Octocat", the result of the "Goodbye" script, and a random number.

## Creating a composite action within the same repository

1. Create a new subfolder called `hello-world-composite-action`, this can be placed in any subfolder within the repository. However, it is recommended that this be placed in the `.github/actions` subfolder to make organization easier.

2. In the `hello-world-composite-action` folder, do the same steps to create the `goodbye.sh` script

   ```shell copy
   echo "echo Goodbye" > goodbye.sh
   ```

   <div class="ghd-tool linux">

   ```shell copy
   chmod +x goodbye.sh
   ```

   </div>

   <div class="ghd-tool mac">

   ```shell copy
   chmod +x goodbye.sh
   ```

   </div>

   <div class="ghd-tool windows">

   ```shell copy
   git add --chmod=+x -- goodbye.sh
   ```

   </div>

   <div class="ghd-tool linux">

   ```shell copy
   git add goodbye.sh
   git commit -m "Add goodbye script"
   git push
   ```

   </div>

   <div class="ghd-tool mac">

   ```shell copy
   git add goodbye.sh
   git commit -m "Add goodbye script"
   git push
   ```

   </div>

   <div class="ghd-tool windows">

   ```shell copy
   git commit -m "Add goodbye script"
   git push
   ```

   </div>

3. In the `hello-world-composite-action` folder, create the `action.yml` file based on the steps in [Creating a composite action](/en/actions/creating-actions/creating-a-composite-action#creating-an-action-metadata-file).

4. When using the action, use the relative path to the folder where the composite action's `action.yml` file is located in the `uses` key. The below example assumes it is in the `.github/actions/hello-world-composite-action` folder.

```yaml copy
on: [push]

jobs:
  hello_world_job:
    runs-on: ubuntu-latest
    name: A job to say hello
    steps:
      - uses: actions/checkout@v5
      - id: foo
        uses: ./.github/actions/hello-world-composite-action
        with:
          who-to-greet: 'Mona the Octocat'
      - run: echo random-number "$RANDOM_NUMBER"
        shell: bash
        env:
          RANDOM_NUMBER: ${{ steps.foo.outputs.random-number }}
```

## Example composite actions on GitHub

You can find many examples of composite actions on GitHub.

* [microsoft/action-python](https://github.com/microsoft/action-python)
* [microsoft/gpt-review](https://github.com/microsoft/gpt-review)
* [tailscale/github-action](https://github.com/tailscale/github-action)
---

# Creating a JavaScript action

In this tutorial, you'll learn how to build a JavaScript action using the actions toolkit.

## Introduction

In this guide, you'll learn about the basic components needed to create and use a packaged JavaScript action. To focus this guide on the components needed to package the action, the functionality of the action's code is minimal. The action prints "Hello World" in the logs or "Hello \[who-to-greet]" if you provide a custom name.

This guide uses the GitHub Actions Toolkit Node.js module to speed up development. For more information, see the [actions/toolkit](https://github.com/actions/toolkit) repository.

Once you complete this project, you should understand how to build your own JavaScript action and test it in a workflow.

To ensure your JavaScript actions are compatible with all GitHub-hosted runners (Ubuntu, Windows, and macOS), the packaged JavaScript code you write should be pure JavaScript and not rely on other binaries. JavaScript actions run directly on the runner and use binaries that already exist in the runner image.

> \[!WARNING]
> When creating workflows and actions, you should always consider whether your code might execute untrusted input from possible attackers. Certain contexts should be treated as untrusted input, as an attacker could insert their own malicious content. For more information, see [Secure use reference](/en/actions/security-guides/security-hardening-for-github-actions#understanding-the-risk-of-script-injections).

## Prerequisites

Before you begin, you'll need to download Node.js and create a public GitHub repository.

1. Download and install Node.js 20.x, which includes npm.

   <https://nodejs.org/en/download/>

2. Create a new public repository on GitHub and call it "hello-world-javascript-action". For more information, see [Creating a new repository](/en/repositories/creating-and-managing-repositories/creating-a-new-repository).

3. Clone your repository to your computer. For more information, see [Cloning a repository](/en/repositories/creating-and-managing-repositories/cloning-a-repository).

4. From your terminal, change directories into your new repository.

   ```shell copy
   cd hello-world-javascript-action
   ```

5. From your terminal, initialize the directory with npm to generate a `package.json` file.

   ```shell copy
   npm init -y
   ```

## Creating an action metadata file

Create a new file named `action.yml` in the `hello-world-javascript-action` directory with the following example code. For more information, see [Metadata syntax reference](/en/actions/creating-actions/metadata-syntax-for-github-actions).

```yaml copy
name: Hello World
description: Greet someone and record the time

inputs:
  who-to-greet: # id of input
    description: Who to greet
    required: true
    default: World

outputs:
  time: # id of output
    description: The time we greeted you

runs:
  using: node20
  main: dist/index.js
```

This file defines the `who-to-greet` input and `time` output. It also tells the action runner how to start running this JavaScript action.

## Adding actions toolkit packages

The actions toolkit is a collection of Node.js packages that allow you to quickly build JavaScript actions with more consistency.

The toolkit [`@actions/core`](https://github.com/actions/toolkit/tree/main/packages/core) package provides an interface to the workflow commands, input and output variables, exit statuses, and debug messages.

The toolkit also offers a [`@actions/github`](https://github.com/actions/toolkit/tree/main/packages/github) package that returns an authenticated Octokit REST client and access to GitHub Actions contexts.

The toolkit offers more than the `core` and `github` packages. For more information, see the [actions/toolkit](https://github.com/actions/toolkit) repository.

At your terminal, install the actions toolkit `core` and `github` packages.

```shell copy
npm install @actions/core @actions/github
```

You should now see a `node_modules` directory and a `package-lock.json` file which track any installed dependencies and their versions. You should not commit the `node_modules` directory to your repository.

## Writing the action code

This action uses the toolkit to get the `who-to-greet` input variable required in the action's metadata file and prints "Hello \[who-to-greet]" in a debug message in the log. Next, the script gets the current time and sets it as an output variable that actions running later in a job can use.

GitHub Actions provide context information about the webhook event, Git refs, workflow, action, and the person who triggered the workflow. To access the context information, you can use the `github` package. The action you'll write will print the webhook event payload to the log.

Add a new file called `src/index.js`, with the following code.

```javascript copy
import * as core from "@actions/core";
import * as github from "@actions/github";

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput("who-to-greet");
  core.info(`Hello ${nameToGreet}!`);

  // Get the current time and set it as an output variable
  const time = new Date().toTimeString();
  core.setOutput("time", time);

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  core.info(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
```

If an error is thrown in the above `index.js` example, `core.setFailed(error.message);` uses the actions toolkit [`@actions/core`](https://github.com/actions/toolkit/tree/main/packages/core) package to log a message and set a failing exit code. For more information, see [Setting exit codes for actions](/en/actions/creating-actions/setting-exit-codes-for-actions).

## Creating a README

To let people know how to use your action, you can create a README file. A README is most helpful when you plan to share your action publicly, but is also a great way to remind you or your team how to use the action.

In your `hello-world-javascript-action` directory, create a `README.md` file that specifies the following information:

* A detailed description of what the action does.
* Required input and output arguments.
* Optional input and output arguments.
* Secrets the action uses.
* Environment variables the action uses.
* An example of how to use your action in a workflow.

````markdown copy
# Hello world JavaScript action

This action prints "Hello World" or "Hello" + the name of a person to greet to the log.

## Inputs

### `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## Outputs

### `time`

The time we greeted you.

## Example usage

```yaml
uses: actions/hello-world-javascript-action@e76147da8e5c81eaf017dede5645551d4b94427b
with:
  who-to-greet: Mona the Octocat
```
````

## Commit, tag, and push your action

GitHub downloads each action run in a workflow during runtime and executes it as a complete package of code before you can use workflow commands like `run` to interact with the runner machine. This means you must include any package dependencies required to run the JavaScript code. For example, this action uses `@actions/core` and `@actions/github` packages.

Checking in your `node_modules` directory can cause problems. As an alternative, you can use tools such as [`rollup.js`](https://github.com/rollup/rollup) or [`@vercel/ncc`](https://github.com/vercel/ncc) to combine your code and dependencies into one file for distribution.

1. Install `rollup` and its plugins by running this command in your terminal.

   `npm install --save-dev rollup @rollup/plugin-commonjs @rollup/plugin-node-resolve`

2. Create a new file called `rollup.config.js` in the root of your repository with the following code.

   ```javascript copy
   import commonjs from "@rollup/plugin-commonjs";
   import { nodeResolve } from "@rollup/plugin-node-resolve";

   const config = {
     input: "src/index.js",
     output: {
       esModule: true,
       file: "dist/index.js",
       format: "es",
       sourcemap: true,
     },
     plugins: [commonjs(), nodeResolve({ preferBuiltins: true })],
   };

   export default config;
   ```

3. Compile your `dist/index.js` file.

   `rollup --config rollup.config.js`

   You'll see a new `dist/index.js` file with your code and any dependencies.

4. From your terminal, commit the updates.

   ```shell copy
   git add src/index.js dist/index.js rollup.config.js package.json package-lock.json README.md action.yml
   git commit -m "Initial commit of my first action"
   git tag -a -m "My first action release" v1.1
   git push --follow-tags
   ```

When you commit and push your code, your updated repository should look like this:

```text
hello-world-javascript-action/
├── action.yml
├── dist/
│   └── index.js
├── package.json
├── package-lock.json
├── README.md
├── rollup.config.js
└── src/
    └── index.js
```

## Testing out your action in a workflow

Now you're ready to test your action out in a workflow.

Public actions can be used by workflows in any repository. When an action is in a private repository, the repository settings dictate whether the action is available only within the same repository or also to other repositories owned by the same user or organization. For more information, see [Managing GitHub Actions settings for a repository](/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository).

### Example using a public action

This example demonstrates how your new public action can be run from within an external repository.

Copy the following YAML into a new file at `.github/workflows/main.yml`, and update the `uses: octocat/hello-world-javascript-action@1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b` line with your username and the name of the public repository you created above. You can also replace the `who-to-greet` input with your name.

```yaml copy
on:
  push:
    branches:
      - main

jobs:
  hello_world_job:
    name: A job to say hello
    runs-on: ubuntu-latest

    steps:
      - name: Hello world action step
        id: hello
        uses: octocat/hello-world-javascript-action@1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b
        with:
          who-to-greet: Mona the Octocat

      # Use the output from the `hello` step
      - name: Get the output time
        run: echo "The time was ${{ steps.hello.outputs.time }}"
```

When this workflow is triggered, the runner will download the `hello-world-javascript-action` action from your public repository and then execute it.

### Example using a private action

Copy the workflow code into a `.github/workflows/main.yml` file in your action's repository. You can also replace the `who-to-greet` input with your name.

```yaml copy
on:
  push:
    branches:
      - main

jobs:
  hello_world_job:
    name: A job to say hello
    runs-on: ubuntu-latest

    steps:
      # To use this repository's private action,
      # you must check out the repository
      - name: Checkout
        uses: actions/checkout@v5

      - name: Hello world action step
        uses: ./ # Uses an action in the root directory
        id: hello
        with:
          who-to-greet: Mona the Octocat

      # Use the output from the `hello` step
      - name: Get the output time
        run: echo "The time was ${{ steps.hello.outputs.time }}"
```

From your repository, click the **Actions** tab, and select the latest workflow run. Under **Jobs** or in the visualization graph, click **A job to say hello**.

Click **Hello world action step**, and you should see "Hello Mona the Octocat" or the name you used for the `who-to-greet` input printed in the log. To see the timestamp, click **Get the output time**.

## Template repositories for creating JavaScript actions

GitHub provides template repositories for creating JavaScript and TypeScript actions. You can use these templates to quickly get started with creating a new action that includes tests, linting, and other recommended practices.

* [`javascript-action` template repository](https://github.com/actions/javascript-action)
* [`typescript-action` template repository](https://github.com/actions/typescript-action)

## Example JavaScript actions on GitHub.com

You can find many examples of JavaScript actions on GitHub.com.

* [DevExpress/testcafe-action](https://github.com/DevExpress/testcafe-action)
* [duckduckgo/privacy-configuration](https://github.com/duckduckgo/privacy-configuration)