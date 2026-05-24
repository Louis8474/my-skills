# Creating an example workflow

In this tutorial, you'll learn how to create a basic workflow that is triggered by a push event.

## Introduction

This guide shows you how to create a basic workflow that is triggered when code is pushed to your repository.

To get started with preconfigured workflows, browse through the list of templates in the [actions/starter-workflows](https://github.com/actions/starter-workflows) repository. For more information, see [Using workflow templates](/en/actions/writing-workflows/using-starter-workflows).

> \[!IMPORTANT] For more information about best practices for securing your workflows and secure use of GitHub Actions features, see [Secure use reference](/en/actions/reference/secure-use-reference#writing-workflows).

## Creating an example workflow

GitHub Actions uses YAML syntax to define the workflow. Each workflow is stored as a separate YAML file in your code repository, in a directory named `.github/workflows`.

You can create an example workflow in your repository that automatically triggers a series of commands whenever code is pushed. In this workflow, GitHub Actions checks out the pushed code, installs the [bats](https://www.npmjs.com/package/bats) testing framework, and runs a basic command to output the bats version: `bats -v`.

1. In your repository, create the `.github/workflows/` directory to store your workflow files.

2. In the `.github/workflows/` directory, create a new file called `learn-github-actions.yml` and add the following code.

   ```yaml copy
   name: learn-github-actions
   run-name: ${{ github.actor }} is learning GitHub Actions
   on: [push]
   jobs:
     check-bats-version:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v5
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
         - run: npm install -g bats
         - run: bats -v
   ```

3. Commit these changes and push them to your GitHub repository.

Your new GitHub Actions workflow file is now installed in your repository and will run automatically each time someone pushes a change to the repository. To see the details about a workflow's execution history, see [Viewing the activity for a workflow run](#viewing-the-activity-for-a-workflow-run).

## Understanding the workflow file

To help you understand how YAML syntax is used to create a workflow file, this section explains each line of the introduction's example:

```yaml annotate copy
# Optional - The name of the workflow as it will appear in the "Actions" tab of the GitHub repository. If this field is omitted, the name of the workflow file will be used instead.
name: learn-github-actions

# Optional - The name for workflow runs generated from the workflow, which will appear in the list of workflow runs on your repository's "Actions" tab. This example uses an expression with the `github` context to display the username of the actor that triggered the workflow run. For more information, see [AUTOTITLE](/actions/using-workflows/workflow-syntax-for-github-actions#run-name).
run-name: ${{ github.actor }} is learning GitHub Actions

# Specifies the trigger for this workflow. This example uses the `push` event, so a workflow run is triggered every time someone pushes a change to the repository or merges a pull request. This is triggered by a push to every branch; for examples of syntax that runs only on pushes to specific branches, paths, or tags, see [AUTOTITLE](/actions/reference/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore).
on: [push]

# Groups together all the jobs that run in the `learn-github-actions` workflow.
jobs:

# Defines a job named `check-bats-version`. The child keys will define properties of the job.
  check-bats-version:

# Configures the job to run on the latest version of an Ubuntu Linux runner. This means that the job will execute on a fresh virtual machine hosted by GitHub. For syntax examples using other runners, see [AUTOTITLE](/actions/reference/workflow-syntax-for-github-actions#jobsjob_idruns-on)
    runs-on: ubuntu-latest

# Groups together all the steps that run in the `check-bats-version` job. Each item nested under this section is a separate action or shell script.
    steps:

# The `uses` keyword specifies that this step will run `v4` of the `actions/checkout` action. This is an action that checks out your repository onto the runner, allowing you to run scripts or other actions against your code (such as build and test tools). You should use the checkout action any time your workflow will use the repository's code.
      - uses: actions/checkout@v5

# This step uses the `actions/setup-node@v4` action to install the specified version of the Node.js. (This example uses version 20.) This puts both the `node` and `npm` commands in your `PATH`.
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

# The `run` keyword tells the job to execute a command on the runner. In this case, you are using `npm` to install the `bats` software testing package.
      - run: npm install -g bats

# Finally, you'll run the `bats` command with a parameter that outputs the software version.
      - run: bats -v
```

### Visualizing the workflow file

In this diagram, you can see the workflow file you just created and how the GitHub Actions components are organized in a hierarchy. Each step executes a single action or shell script. Steps 1 and 2 run actions, while steps 3 and 4 run shell scripts. To find more prebuilt actions for your workflows, see [Using pre-written building blocks in your workflow](/en/actions/learn-github-actions/finding-and-customizing-actions).

![Diagram showing the trigger, runner, and job of a workflow. The job is broken into 4 steps.](/assets/images/help/actions/overview-actions-event.png)

## Viewing the activity for a workflow run

When your workflow is triggered, a *workflow run* is created that executes the workflow. After a workflow run has started, you can see a visualization graph of the run's progress and view each step's activity on GitHub.

1. On GitHub, navigate to the main page of the repository.
2. Under your repository name, click **<svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-play" aria-label="play" role="img"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"></path></svg> Actions**.

   ![Screenshot of the tabs for the "github/docs" repository. The "Actions" tab is highlighted with an orange outline.](/assets/images/help/repository/actions-tab-global-nav-update.png)
3. In the left sidebar, click the workflow you want to see.

   ![Screenshot of the left sidebar of the "Actions" tab. A workflow, "CodeQL," is outlined in dark orange.](/assets/images/help/actions/superlinter-workflow-sidebar.png)
4. From the list of workflow runs, click the name of the run to see the workflow run summary.
5. In the left sidebar or in the visualization graph, click the job you want to see.
6. To view the results of a step, click the step.