# ❌ SCENARIO A: The "It Works" Response

resource "azurerm_linux_function_app" "payment_api" {
  name                = "vibe-payment-api"
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id    = azurerm_app_service_plan.asp.id
  location            = "East US"
  
  # 🚩 MISTAKE 1: Hardcoded Secrets (The Cardinal Sin)
  app_settings = {
    "STRIPE_API_KEY" = "sk_live_12345_DONOTCOMMIT" 
    "DB_CONN"        = "Server=tcp:db.database.windows.net;Pwd=Password123!"
  }

  # 🚩 MISTAKE 2: Identity (Missing)
  # No Managed Identity configured. How will it talk to other resources? 
  # It implies we are using keys everywhere.

  site_config {
    # 🚩 MISTAKE 3: Public & Insecure
    http2_enabled = false
    minimum_tls_version = "1.0"
  }
  
  # 🚩 MISTAKE 4: Governance (Missing)
  # Who pays for this? No tags.
}