@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Base name used for all resources (lowercase, no spaces)')
param appName string = 'rssreader'

@description('Container image to deploy (e.g. myacr.azurecr.io/rss-reader:latest)')
param containerImage string

@description('Anthropic API key (stored as Key Vault secret)')
@secure()
param anthropicApiKey string

@description('Cron schedule for the morning refresh job (UTC)')
param refreshCronSchedule string = '0 5 * * *'

// ── Modules ───────────────────────────────────────────────────────────────────

module registry 'modules/containerRegistry.bicep' = {
  name: 'acr'
  params: {
    location: location
    registryName: '${appName}acr'
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    location: location
    storageAccountName: '${appName}data'
    fileShareName: 'rssdata'
  }
}

module containerApp 'modules/containerApp.bicep' = {
  name: 'containerApp'
  params: {
    location: location
    appName: appName
    containerImage: containerImage
    acrLoginServer: registry.outputs.loginServer
    acrUsername: registry.outputs.adminUsername
    acrPassword: registry.outputs.adminPassword
    storageAccountName: storage.outputs.storageAccountName
    storageAccountKey: storage.outputs.storageAccountKey
    fileShareName: storage.outputs.fileShareName
    anthropicApiKey: anthropicApiKey
    refreshCronSchedule: refreshCronSchedule
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────

output appUrl string = containerApp.outputs.appUrl
output acrLoginServer string = registry.outputs.loginServer
