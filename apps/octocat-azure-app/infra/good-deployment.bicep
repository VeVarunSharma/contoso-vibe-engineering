// ============================================================================
// ✅ GOOD DEPLOYMENT — Built with the Azure SRE Agent
// ============================================================================
// Every best practice from the SRE Agent is applied here:
// - Managed Identity & Key Vault for secrets
// - HTTPS-only with TLS 1.2+
// - Deployment slots for safe rollouts
// - Application Insights for full observability
// - Alerts, diagnostics, health checks, auto-scale
// - Proper tagging for cost management
// ============================================================================

param location string = resourceGroup().location
param appName string = 'octocat-azure-app'
param environment string = 'production'

// ── Tags applied to ALL resources ──────────────────────────────────────────
var commonTags = {
  Environment: environment
  CostCenter: 'platform-engineering'
  Owner: 'platform-team@contoso.com'
  Application: appName
  ManagedBy: 'bicep'
}

// ── Log Analytics Workspace ────────────────────────────────────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${appName}-logs'
  location: location
  tags: commonTags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// ── Application Insights ───────────────────────────────────────────────────
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights'
  location: location
  kind: 'web'
  tags: commonTags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ── Key Vault for secrets management ───────────────────────────────────────
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${appName}-kv'
  location: location
  tags: commonTags
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
  }
}

resource dbSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'database-url'
  properties: {
    value: 'REPLACE_VIA_CI_CD_PIPELINE' // Set securely via pipeline, never in source
  }
}

resource apiTokenSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'github-api-token'
  properties: {
    value: 'REPLACE_VIA_CI_CD_PIPELINE'
  }
}

// ── Key Vault Role Assignments ─────────────────────────────────────────────
// ✅ Grant Web App's Managed Identity access to Key Vault secrets
// Role: Key Vault Secrets User (4633458b-17de-408a-b874-0445c86b69e6)
resource keyVaultRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, webApp.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ✅ Grant Staging Slot's Managed Identity access to Key Vault secrets
resource keyVaultRoleAssignmentStaging 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, stagingSlot.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: stagingSlot.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── App Service Plan (Production-grade) ────────────────────────────────────
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${appName}-plan'
  location: location
  tags: commonTags
  sku: {
    // ✅ Premium tier: deployment slots, auto-scale, zone redundancy, SLA
    name: 'P1v3'
    tier: 'PremiumV3'
  }
  properties: {
    zoneRedundant: true // ✅ Spread across availability zones
  }
}

// ── Web App with full security defaults ────────────────────────────────────
resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: appName
  location: location
  tags: commonTags
  // ✅ Managed Identity — no passwords, Key Vault access via RBAC
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    // ✅ HTTPS enforced — all HTTP traffic redirected
    httpsOnly: true
    siteConfig: {
      // ✅ TLS 1.2 minimum — secure transport
      minTlsVersion: '1.2'
      // ✅ HTTP/2 enabled — better performance
      http20Enabled: true
      // ✅ FTP completely disabled — no insecure file access
      ftpsState: 'Disabled'
      // ✅ Remote debugging OFF — no attack surface
      remoteDebuggingEnabled: false
      // ✅ Always On — no cold starts for production users
      alwaysOn: true
      // ✅ Health check endpoint — Azure auto-restarts unhealthy instances
      healthCheckPath: '/health'

      appSettings: [
        {
          // ✅ Key Vault reference — secret never exposed in config
          name: 'DATABASE_URL'
          value: '@Microsoft.KeyVault(SecretUri=${dbSecret.properties.secretUri})'
        }
        {
          // ✅ Key Vault reference for API token
          name: 'GITHUB_API_TOKEN'
          value: '@Microsoft.KeyVault(SecretUri=${apiTokenSecret.properties.secretUri})'
        }
        {
          // ✅ Application Insights connected for full telemetry
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'ENVIRONMENT'
          value: environment
        }
        {
          name: 'APP_VERSION'
          value: '0.0.1'
        }
      ]
    }
  }
}

// ── Staging Deployment Slot ────────────────────────────────────────────────
// ✅ Never deploy directly to production — always go through staging first
resource stagingSlot 'Microsoft.Web/sites/slots@2023-01-01' = {
  parent: webApp
  name: 'staging'
  location: location
  tags: union(commonTags, { Slot: 'staging' })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      minTlsVersion: '1.2'
      http20Enabled: true
      ftpsState: 'Disabled'
      remoteDebuggingEnabled: false
      alwaysOn: true
      healthCheckPath: '/health'
      appSettings: [
        {
          name: 'DATABASE_URL'
          value: '@Microsoft.KeyVault(SecretUri=${dbSecret.properties.secretUri})'
        }
        {
          name: 'GITHUB_API_TOKEN'
          value: '@Microsoft.KeyVault(SecretUri=${apiTokenSecret.properties.secretUri})'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'ENVIRONMENT'
          value: 'staging'
        }
      ]
    }
  }
}

// ── Slot-sticky settings (don't swap with deployment) ──────────────────────
resource slotConfig 'Microsoft.Web/sites/config@2023-01-01' = {
  parent: webApp
  name: 'slotConfigNames'
  properties: {
    appSettingNames: [
      'ENVIRONMENT'
      'APPLICATIONINSIGHTS_CONNECTION_STRING'
    ]
  }
}

// ── Diagnostic Settings — logs to Log Analytics ────────────────────────────
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${appName}-diagnostics'
  scope: webApp
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      { category: 'AppServiceHTTPLogs', enabled: true }
      { category: 'AppServiceConsoleLogs', enabled: true }
      { category: 'AppServiceAppLogs', enabled: true }
      { category: 'AppServicePlatformLogs', enabled: true }
    ]
    metrics: [
      { category: 'AllMetrics', enabled: true }
    ]
  }
}

// ── Auto-scale rules ───────────────────────────────────────────────────────
resource autoScale 'Microsoft.Insights/autoscalesettings@2022-10-01' = {
  name: '${appName}-autoscale'
  location: location
  tags: commonTags
  properties: {
    targetResourceUri: appServicePlan.id
    enabled: true
    profiles: [
      {
        name: 'production-profile'
        capacity: {
          minimum: '2'  // ✅ Minimum 2 instances for high availability
          maximum: '10'
          default: '2'
        }
        rules: [
          {
            // ✅ Scale out when CPU > 70%
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 70
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
          {
            // ✅ Scale in when CPU < 30%
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: 30
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT10M'
            }
          }
        ]
      }
    ]
  }
}

// ── Alert: High error rate ─────────────────────────────────────────────────
resource errorAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${appName}-high-error-rate'
  location: 'global'
  tags: commonTags
  properties: {
    severity: 1
    enabled: true
    scopes: [webApp.id]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Http5xxErrors'
          metricName: 'Http5xx'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
  }
}

// ── Alert: High response time ──────────────────────────────────────────────
resource latencyAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${appName}-high-latency'
  location: 'global'
  tags: commonTags
  properties: {
    severity: 2
    enabled: true
    scopes: [webApp.id]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighLatency'
          metricName: 'HttpResponseTime'
          operator: 'GreaterThan'
          threshold: 2
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
  }
}

// ── Outputs ────────────────────────────────────────────────────────────────
output appUrl string = 'https://${webApp.properties.defaultHostName}'
output stagingUrl string = 'https://${stagingSlot.properties.defaultHostName}'
output appInsightsKey string = appInsights.properties.InstrumentationKey
