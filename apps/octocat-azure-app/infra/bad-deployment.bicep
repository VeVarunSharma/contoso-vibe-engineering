// ============================================================================
// ❌ BAD DEPLOYMENT — What happens WITHOUT the SRE Agent
// ============================================================================
// This is what a typical "ship it fast" deployment looks like.
// Every anti-pattern here would be caught and fixed by the SRE Agent.
// ============================================================================

param location string = resourceGroup().location

// 🚩 No tags on any resources — impossible to track costs or ownership

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'octocat-plan'
  location: location
  sku: {
    // 🚩 Free tier in production — no SLA, no deployment slots, no scaling
    name: 'F1'
    tier: 'Free'
  }
}

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: 'octocat-azure-app'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    // 🚩 HTTPS not enforced — users can connect over plain HTTP
    httpsOnly: false
    siteConfig: {
      // 🚩 TLS 1.0 — vulnerable to BEAST, POODLE, and other attacks
      minTlsVersion: '1.0'
      // 🚩 HTTP/2 disabled — slower performance
      http20Enabled: false
      // 🚩 FTP enabled — insecure file transfer protocol exposed
      ftpsState: 'AllAllowed'
      // 🚩 Remote debugging ON in production — massive security hole
      remoteDebuggingEnabled: true
      // 🚩 alwaysOn not set — app goes to sleep, cold starts for users
      alwaysOn: false
      // 🚩 No health check path — Azure can't detect if app is unhealthy

      appSettings: [
        {
          // 🚩 SECRET HARDCODED — visible in Azure Portal, deployment logs,
          //    source control, ARM exports, and to anyone with Reader access
          name: 'DATABASE_URL'
          value: 'postgresql://admin:P@ssw0rd123!@prod-db.postgres.database.azure.com:5432/octocatdb?sslmode=require'
        }
        {
          // 🚩 API key in plain text — should be in Key Vault
          name: 'GITHUB_API_TOKEN'
          value: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
        {
          // 🚩 Another hardcoded secret
          name: 'STRIPE_SECRET_KEY'
          value: 'sk_live_xxxxxxxxxxxxxxxxxxxxxxxx'
        }
      ]
    }
  }
  // 🚩 No Managed Identity — using hardcoded credentials instead
  // 🚩 No tags — can't track cost, ownership, or environment
}

// 🚩 No deployment slots — deploying straight to production
// 🚩 No Application Insights — flying blind with no telemetry
// 🚩 No diagnostic settings — no logs going anywhere
// 🚩 No alerts — nobody knows when things break
// 🚩 No auto-scale rules — can't handle traffic spikes
// 🚩 No rollback plan — if deployment fails, manual intervention required

// What could go wrong?
// 1. Secrets leak via source control, Azure Portal, or ARM template exports
// 2. TLS 1.0 fails PCI compliance and security audits
// 3. FTP + remote debugging = open attack surface
// 4. No monitoring means outages go undetected for hours
// 5. No slots means every deployment is a YOLO to production
// 6. Free tier goes down under any real traffic
// 7. No rollback means scrambling to fix forward under pressure
