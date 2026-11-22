variable "cost_center" {
  description = "Cost center used to tag the deployed resources."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "production"
}

variable "location" {
  description = "Azure region for all resources."
  type        = string
  default     = "Canada Central"
}

variable "name_prefix" {
  description = "Globally unique lowercase prefix for Azure resource names."
  type        = string
  default     = "octocat-blog"

  validation {
    condition     = can(regex("^[a-z0-9-]{3,30}$", var.name_prefix))
    error_message = "name_prefix must contain 3-30 lowercase letters, numbers, or hyphens."
  }
}

variable "owner" {
  description = "Owner used to tag the deployed resources."
  type        = string
}
