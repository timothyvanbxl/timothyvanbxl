using 'main.bicep'

param location = 'westeurope'
param appName = 'rssreader'
// Set containerImage after first ACR push, e.g.:
// param containerImage = 'rssreaderacr.azurecr.io/rss-reader:latest'
param containerImage = 'placeholder/rss-reader:latest'
// Set via --parameters anthropicApiKey=... at deploy time (never commit secrets)
param anthropicApiKey = ''
param refreshCronSchedule = '0 5 * * *'
