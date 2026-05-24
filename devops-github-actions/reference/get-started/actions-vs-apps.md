# GitHub Actions vs GitHub Apps

Learn about the key differences between GitHub Actions and GitHub Apps to help you decide which is right for your use cases.

GitHub Marketplace offers both GitHub Actions and GitHub Apps, each of which can be valuable automation and workflow tools. Understanding the differences and the benefits of each option will allow you to select the best fit for your job.

GitHub Apps:

* Run persistently and can react to events quickly.
* Work great when persistent data is needed.
* Work best with API requests that aren't time consuming.
* Run on a server or compute infrastructure that you provide.

GitHub Actions:

* Provide automation that can perform continuous integration and continuous deployment.
* Can run directly on runner machines or in Docker containers.
* Can include access to a clone of your repository, enabling deployment and publishing tools, code formatters, and command line tools to access your code.
* Don't require you to deploy code or serve an app.
* Have a simple interface to create and use secrets, which enables actions to interact with third-party services without needing to store the credentials of the person using the action.