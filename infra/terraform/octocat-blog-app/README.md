# Octocat Blog Azure deployment

This root module deploys the Octocat Blog as an Azure Linux Web App with a
private PostgreSQL Flexible Server. The Web App's system-assigned managed
identity is the PostgreSQL Entra administrator, so no database password is
created or stored.

## Resources

- Resource group and private virtual network
- App Service plan and Node.js 22 Linux Web App
- Private PostgreSQL 17 Flexible Server and database
- Private DNS zone and VNet integration
- Automatic Drizzle migrations during application startup

All resources use `Environment`, `CostCenter`, and `Owner` tags. Terraform
state is configured with the AzureRM backend so operators must provide an
existing state storage account at initialization.

## Prerequisites

- Azure subscription with permission to create the listed resources
- GitHub repository variables for the Azure tenant, subscription, and client
  IDs, plus the Terraform backend storage details
- A GitHub `production` environment with required reviewers

The Azure login identity needs permission to create App Service, PostgreSQL,
networking, and Entra administrator assignments. It also needs the
`Website Contributor` role and `Storage Blob Data Contributor` access to the
Terraform state container.

## Deploy manually

Authenticate with Azure, then provide backend configuration and required
variables:

```bash
cd infra/terraform/octocat-blog-app
terraform init \
  -backend-config="resource_group_name=$TF_STATE_RESOURCE_GROUP" \
  -backend-config="storage_account_name=$TF_STATE_STORAGE_ACCOUNT" \
  -backend-config="container_name=$TF_STATE_CONTAINER" \
  -backend-config="key=octocat-blog-app.tfstate"

terraform plan \
  -var='cost_center=engineering' \
  -var='owner=platform-team' \
  -out=tfplan

terraform apply tfplan
```

For production, set `name_prefix` to a globally unique prefix. Run
`.github/workflows/deploy-octocat-blog.yml` to build, apply Terraform, and
deploy the standalone Next.js package.

## Verify

After deployment:

1. Open `terraform output -raw web_app_url`.
2. Confirm the app returns `200` over HTTPS.
3. Open `/api/posts` and confirm the endpoint returns a valid response.
4. Check App Service logs for successful Drizzle migration startup.

The database has no public endpoint. Connectivity is limited to the App
Service VNet, and the app obtains short-lived Entra tokens through managed
identity.
