# Continuous deployment

You can create custom continuous deployment (CD) workflows directly in your GitHub repository with GitHub Actions.

## About continuous deployment

*Continuous deployment* (CD) is the practice of using automation to publish and deploy software updates. As part of the typical CD process, the code is automatically built and tested before deployment.

Continuous deployment is often coupled with continuous integration. For more information about continuous integration, see [Continuous integration](/en/actions/automating-builds-and-tests/about-continuous-integration).

## About continuous deployment using GitHub Actions

You can set up a GitHub Actions workflow to deploy your software product. To verify that your product works as expected, your workflow can build the code in your repository and run your tests before deploying.

You can configure your CD workflow to run when an event occurs (for example, when new code is pushed to the default branch of your repository), on a set schedule, manually, or when an external event occurs using the repository dispatch webhook. For more information about when your workflow can run, see [Events that trigger workflows](/en/actions/using-workflows/events-that-trigger-workflows).

GitHub Actions provides features that give you more control over deployments. For example, you can use environments to require approval for a job to proceed, restrict which branches can trigger a workflow, or limit access to secrets. You can use concurrency to limit your CD pipeline to a maximum of one in-progress deployment and one pending deployment. For more information about these features, see [Deploying with GitHub Actions](/en/actions/deployment/about-deployments/deploying-with-github-actions) and [Managing environments for deployment](/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment).

## Workflow templates and third-party actions

GitHub offers deployment workflow templates for several popular services, such as Azure Web App. To learn how to get started using a workflow template, see [Using workflow templates](/en/actions/learn-github-actions/using-starter-workflows) or [browse the full list of deployment workflow templates](https://github.com/actions/starter-workflows/tree/main/deployments). You can also check out our more detailed guides for specific deployment workflows, such as [Deploying Node.js to Azure App Service](/en/actions/deployment/deploying-to-your-cloud-provider/deploying-to-azure/deploying-nodejs-to-azure-app-service).

Many service providers also offer actions on GitHub Marketplace for deploying to their service. For the full list, see [GitHub Marketplace](https://github.com/marketplace?category=deployment\&type=actions).

## Next steps

If your GitHub Actions workflows need to access resources from a cloud provider that supports OpenID Connect (OIDC), you can configure your workflows to authenticate directly to the cloud provider. This will let you stop storing these credentials as long-lived secrets and provide other security benefits. For more information, see [OpenID Connect](/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect).