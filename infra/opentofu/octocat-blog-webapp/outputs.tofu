output "resource_group_name" {
  description = "Name of the created resource group."
  value       = azurerm_resource_group.this.name
}

output "service_plan_id" {
  description = "ID of the Azure App Service plan."
  value       = azurerm_service_plan.this.id
}

output "web_app_default_hostname" {
  description = "Default hostname of the web app."
  value       = "https://${azurerm_linux_web_app.this.default_hostname}"
}

output "web_app_id" {
  description = "Resource ID of the web app."
  value       = azurerm_linux_web_app.this.id
}

output "web_app_name" {
  description = "Name of the web app."
  value       = azurerm_linux_web_app.this.name
}

output "web_app_principal_id" {
  description = "Principal ID for the system-assigned managed identity."
  value       = azurerm_linux_web_app.this.identity[0].principal_id
}
