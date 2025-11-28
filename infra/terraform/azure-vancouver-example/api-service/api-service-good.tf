# ✅ SCENARIO B: The Engineered Response

resource "azurerm_linux_function_app" "payment_api" {
  name                = "secure-payment-api"
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id    = azurerm_app_service_plan.asp.id
  location            = "East US"

  # ✅ SUCCESS 1: Managed Identity (Identity as Perimeter)
  identity {
    type = "SystemAssigned"
  }

  # ✅ SUCCESS 2: Secrets via Key Vault References
  app_settings = {
    "STRIPE_API_KEY" = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.stripe.id})"
    "DB_CONN"        = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.db_conn.id})"
  }

  site_config {
    # ✅ SUCCESS 3: Modern Security Standards
    http2_enabled = true
    minimum_tls_version = "1.2"
  }

  # ✅ SUCCESS 4: FinOps Happy
  tags = {
    CostCenter = "Payments-Team"
    Owner      = "Ve Sharma"
  }
}