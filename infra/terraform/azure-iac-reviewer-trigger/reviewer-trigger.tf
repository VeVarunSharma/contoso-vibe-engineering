# Test fixture for manually triggering the Azure Terraform IaC Reviewer workflow.
# This file is intentionally minimal and should not be applied.

locals {
  azure_iac_reviewer_trigger = {
    CostCenter  = "Platform"
    Environment = "test"
    Owner       = "Copilot"
  }
}
