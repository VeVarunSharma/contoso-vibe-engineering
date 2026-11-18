output "database_host" {
  description = "Private hostname of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.blog.fqdn
}

output "resource_group_name" {
  description = "Resource group containing the Octocat Blog resources."
  value       = azurerm_resource_group.blog.name
}

output "web_app_name" {
  description = "Name of the deployed Azure Web App."
  value       = azurerm_linux_web_app.blog.name
}

output "web_app_url" {
  description = "HTTPS URL of the deployed Octocat Blog app."
  value       = "https://${azurerm_linux_web_app.blog.default_hostname}"
}
