resource "azurerm_resource_group" "blog" {
  name     = "${local.resource_name}-rg"
  location = var.location
  tags     = local.tags
}

resource "azurerm_virtual_network" "blog" {
  name                = "${local.resource_name}-vnet"
  address_space       = ["10.20.0.0/16"]
  location            = azurerm_resource_group.blog.location
  resource_group_name = azurerm_resource_group.blog.name
  tags                = local.tags
}

resource "azurerm_subnet" "app" {
  name                 = "app-service"
  resource_group_name  = azurerm_resource_group.blog.name
  virtual_network_name = azurerm_virtual_network.blog.name
  address_prefixes     = ["10.20.1.0/24"]

  delegation {
    name = "app-service"

    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_subnet" "postgres" {
  name                 = "postgres"
  resource_group_name  = azurerm_resource_group.blog.name
  virtual_network_name = azurerm_virtual_network.blog.name
  address_prefixes     = ["10.20.2.0/24"]

  delegation {
    name = "postgres-flexible-server"

    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_private_dns_zone" "postgres" {
  name                = "${local.resource_name}.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.blog.name
  tags                = local.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                 = "${local.resource_name}-postgres"
  private_dns_zone_id  = azurerm_private_dns_zone.postgres.id
  virtual_network_id   = azurerm_virtual_network.blog.id
  registration_enabled = false
  tags                 = local.tags
}

resource "azurerm_postgresql_flexible_server" "blog" {
  name                          = "${local.resource_name}-postgres"
  location                      = azurerm_resource_group.blog.location
  resource_group_name           = azurerm_resource_group.blog.name
  version                       = "17"
  sku_name                      = "B_Standard_B1ms"
  storage_mb                    = 32768
  storage_tier                  = "P4"
  delegated_subnet_id           = azurerm_subnet.postgres.id
  private_dns_zone_id           = azurerm_private_dns_zone.postgres.id
  public_network_access_enabled = false

  authentication {
    active_directory_auth_enabled = true
    password_auth_enabled         = false
    tenant_id                     = data.azurerm_client_config.current.tenant_id
  }

  tags = local.tags

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]
}

resource "azurerm_postgresql_flexible_server_database" "blog" {
  name      = "octocat_blog"
  server_id = azurerm_postgresql_flexible_server.blog.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_service_plan" "blog" {
  name                = "${local.resource_name}-plan"
  location            = azurerm_resource_group.blog.location
  resource_group_name = azurerm_resource_group.blog.name
  os_type             = "Linux"
  sku_name            = "B1"
  tags                = local.tags
}

resource "azurerm_linux_web_app" "blog" {
  name                      = local.resource_name
  location                  = azurerm_resource_group.blog.location
  resource_group_name       = azurerm_resource_group.blog.name
  service_plan_id           = azurerm_service_plan.blog.id
  https_only                = true
  virtual_network_subnet_id = azurerm_subnet.app.id

  ftp_publish_basic_authentication_enabled       = false
  webdeploy_publish_basic_authentication_enabled = false

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    AZURE_POSTGRES_DATABASE         = azurerm_postgresql_flexible_server_database.blog.name
    AZURE_POSTGRES_HOST             = azurerm_postgresql_flexible_server.blog.fqdn
    AZURE_POSTGRES_MANAGED_IDENTITY = "true"
    AZURE_POSTGRES_USER             = local.resource_name
    NEXT_PUBLIC_APP_URL             = "https://${local.resource_name}.azurewebsites.net"
    NODE_ENV                        = "production"
    PORT                            = "3000"
    RUN_DATABASE_MIGRATIONS         = "true"
    SCM_DO_BUILD_DURING_DEPLOYMENT  = "false"
    WEBSITE_NODE_DEFAULT_VERSION    = "~22"
    WEBSITE_RUN_FROM_PACKAGE        = "1"
    WEBSITE_VNET_ROUTE_ALL          = "1"
  }

  site_config {
    always_on                         = true
    app_command_line                  = "node apps/octocat-blog-app/server.js"
    http2_enabled                     = true
    minimum_tls_version               = "1.2"
    scm_minimum_tls_version           = "1.2"
    vnet_route_all_enabled            = true
    health_check_path                 = "/"
    health_check_eviction_time_in_min = 5

    application_stack {
      node_version = "22-lts"
    }
  }

  logs {
    detailed_error_messages = true
    failed_request_tracing  = true

    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = local.tags
}

resource "azurerm_postgresql_flexible_server_active_directory_administrator" "blog" {
  server_name         = azurerm_postgresql_flexible_server.blog.name
  resource_group_name = azurerm_resource_group.blog.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  object_id           = azurerm_linux_web_app.blog.identity[0].principal_id
  principal_name      = local.resource_name
  principal_type      = "ServicePrincipal"
}
