@description('Azure region')
param location string

@description('Base app name')
param appName string

@description('Container image URI')
param containerImage string

@description('ACR login server')
param acrLoginServer string

@description('ACR admin username')
param acrUsername string

@description('ACR admin password')
@secure()
param acrPassword string

@description('Storage account name for File Share mount')
param storageAccountName string

@description('Storage account key')
@secure()
param storageAccountKey string

@description('File share name')
param fileShareName string

@description('Anthropic API key')
@secure()
param anthropicApiKey string

@description('Cron expression for morning refresh job (UTC)')
param refreshCronSchedule string = '0 5 * * *'

// ── Container Apps Environment ─────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${appName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource caEnv 'Microsoft.App/managedEnvironments@2023-11-02-preview' = {
  name: '${appName}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ── Azure File Share storage for SQLite ─────────────────────────────────────

resource caStorage 'Microsoft.App/managedEnvironments/storages@2023-11-02-preview' = {
  parent: caEnv
  name: 'rssdata'
  properties: {
    azureFile: {
      accountName: storageAccountName
      accountKey: storageAccountKey
      shareName: fileShareName
      accessMode: 'ReadWrite'
    }
  }
}

// ── Main Container App (web server) ─────────────────────────────────────────

resource containerApp 'Microsoft.App/containerApps@2023-11-02-preview' = {
  name: '${appName}-app'
  location: location
  properties: {
    managedEnvironmentId: caEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      registries: [
        {
          server: acrLoginServer
          username: acrUsername
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password', value: acrPassword }
        { name: 'anthropic-api-key', value: anthropicApiKey }
        { name: 'storage-account-key', value: storageAccountKey }
      ]
    }
    template: {
      containers: [
        {
          name: 'rss-reader'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'ANTHROPIC_API_KEY', secretRef: 'anthropic-api-key' }
            { name: 'DB_PATH', value: '/data/data.db' }
            { name: 'NODE_ENV', value: 'production' }
          ]
          volumeMounts: [
            {
              volumeName: 'rssdata'
              mountPath: '/data'
            }
          ]
        }
      ]
      volumes: [
        {
          name: 'rssdata'
          storageType: 'AzureFile'
          storageName: 'rssdata'
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

// ── Scheduled Refresh Job (morning cron) ─────────────────────────────────────

resource refreshJob 'Microsoft.App/jobs@2023-11-02-preview' = {
  name: '${appName}-refresh'
  location: location
  properties: {
    environmentId: caEnv.id
    configuration: {
      triggerType: 'Schedule'
      scheduleTriggerConfig: {
        cronExpression: refreshCronSchedule
        parallelism: 1
        replicaCompletionCount: 1
      }
      registries: [
        {
          server: acrLoginServer
          username: acrUsername
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password', value: acrPassword }
        { name: 'anthropic-api-key', value: anthropicApiKey }
      ]
      replicaTimeout: 1800 // 30 minutes max
      replicaRetryLimit: 1
    }
    template: {
      containers: [
        {
          name: 'rss-refresh'
          image: containerImage
          command: ['node', '-e', 'import("./build/server/chunks/scheduler.js").then(m => m.runMorningRefresh()).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })']
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'ANTHROPIC_API_KEY', secretRef: 'anthropic-api-key' }
            { name: 'DB_PATH', value: '/data/data.db' }
            { name: 'NODE_ENV', value: 'production' }
          ]
          volumeMounts: [
            {
              volumeName: 'rssdata'
              mountPath: '/data'
            }
          ]
        }
      ]
      volumes: [
        {
          name: 'rssdata'
          storageType: 'AzureFile'
          storageName: 'rssdata'
        }
      ]
    }
  }
}

output appUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
