# ❌ SCENARIO A: The "It Works" Response

resource "azurerm_linux_function_app" "payment_api" {
  name                = "vibe-payment-api"
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id    = azurerm_app_service_plan.asp.id
  location            = "East US"
  
  app_settings = {
    "STRIPE_API_KEY" = "sk_live_12345_DONOTCOMMIT" 
    "DB_CONN"        = "Server=tcp:db.database.windows.net;Pwd=Password123!"
  }

  site_config {
    http2_enabled = false
    minimum_tls_version = "1.0"
  }
  
}