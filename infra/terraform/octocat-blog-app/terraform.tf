terraform {
  required_version = ">= 1.9.0"

  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
      # Latest stable version resolved from the Terraform Registry on 2026-11-18.
      version = "5.14.0"
    }
  }
}
