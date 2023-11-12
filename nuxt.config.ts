export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    'vuetify-nuxt-module'
  ],
  css: ['~/assets/css/main.css'],
  build: {
    transpile: ['@arcgis/core']
  }
});