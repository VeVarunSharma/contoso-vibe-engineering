locals {
  resource_name = "${var.name_prefix}-${var.environment}"

  tags = {
    CostCenter  = var.cost_center
    Environment = var.environment
    Owner       = var.owner
  }
}
