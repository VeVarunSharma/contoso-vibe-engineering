# Octocat Blog Web App OpenTofu Module

This module provisions an Azure App Service plan and Linux Web App for the Octocat blog application. It is an OpenTofu-native variant of the Terraform module and uses the `.tofu` file extension so it is resolved by the OpenTofu CLI independently of the Terraform variant.

## Resources created

- Azure Resource Group
- Azure App Service Plan
- Azure Linux Web App with system-assigned managed identity
- HTTPS-only configuration with TLS 1.2 and HTTP/2 enabled

## Usage

The module targets the OpenTofu CLI:

```bash
tofu init
tofu plan
tofu apply
```

```hcl
module "octocat_blog_webapp" {
  source = "./infra/opentofu/octocat-blog-webapp"

  environment         = "dev"
  location            = "eastus"
  resource_group_name = "rg-octocat-blog-app"
  web_app_name        = "octocat-blog-app-001"
}
```

## Notes

- `web_app_name` must be globally unique within Azure.
- The module targets a Node.js 20 App Service runtime, which fits the Octocat blog app's Next.js deployment model.
- Secrets should be supplied through Azure Key Vault references instead of raw app settings.
- The provider lock file references the OpenTofu registry (`registry.opentofu.org`). For the Terraform-native module, see `infra/terraform/octocat-blog-webapp`.
