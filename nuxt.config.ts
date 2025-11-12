// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/content'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  nitro: {
    prerender: {
      routes: ['/rss.xml'],
      crawlLinks: true
    }
  },

  compatibilityDate: '2025-01-15',

  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        noPropertyAccessFromIndexSignature: true,
        exactOptionalPropertyTypes: true,
        noFallthroughCasesInSwitch: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        allowUnusedLabels: false,
        allowUnreachableCode: false
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
