// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    mailgunWebhookKey: process.env.MAILGUN_HTTP_WEBHOOK_KEY || '',
    mailgunApiKey: process.env.MAILGUN_API_KEY || ''
  }
})
