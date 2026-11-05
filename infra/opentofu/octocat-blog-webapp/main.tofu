terraform {
  # Targets the OpenTofu 1.x CLI. Files use the `.tofu` extension so this module
  # is resolved by OpenTofu independently of the Terraform variant.
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

locals {
  effective_tags = merge(
    {
      Environment = var.environment
      CostCenter  = "Engineering"
      Owner       = var.owner
    },
    var.tags,
  )
}

resource "azurerm_resource_group" "this" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.effective_tags
}

resource "azurerm_service_plan" "this" {
  name                = "${var.web_app_name}-plan"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  os_type             = "Linux"
  sku_name            = var.app_service_plan_sku_name
  tags                = local.effective_tags
}

resource "azurerm_linux_web_app" "this" {
  name                = var.web_app_name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  service_plan_id     = azurerm_service_plan.this.id
  https_only          = true
  tags                = local.effective_tags

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    ENABLE_ORYX_BUILD              = "true"
    SCM_DO_BUILD_DURING_DEPLOYMENT = "true"
    WEBSITE_NODE_DEFAULT_VERSION   = "~20"
    WEBSITES_PORT                  = "3000"
  }

  site_config {
    always_on           = true
    http2_enabled       = true
    minimum_tls_version = "1.2"

    application_stack {
      node_version = "20-lts"
    }
  }
}
