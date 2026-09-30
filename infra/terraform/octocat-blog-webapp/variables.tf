variable "app_service_plan_sku_name" {
  description = "SKU name for the Azure App Service plan."
  type        = string
  default     = "B1"
}

variable "environment" {
  description = "Environment name used for resource tags and naming."
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region for the resources."
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Name of the resource group that will host the blog web app."
  type        = string
  default     = "rg-octocat-blog-app"
}

variable "tags" {
  description = "Additional tags to apply to the created resources."
  type        = map(string)
  default     = {}
}

variable "web_app_name" {
  description = "Globally unique name for the Azure Web App."
  type        = string
  default     = "octocat-blog-app"
}
