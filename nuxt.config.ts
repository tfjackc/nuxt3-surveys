export default defineNuxtConfig({
  devtools: {
    enabled: true,

    timeline: {
      enabled: true
    }
  },
  modules: [
    '@pinia/nuxt',
    'vuetify-nuxt-module'
  ],
  css: ['~/assets/css/main.css'],
  build: {
    transpile: ['@arcgis/core']
  },
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            colors: {
              primary: '#1867C0',
              secondary: '#5CBBF6',
            },
          },
        },
      },
      icons: {
        defaultSet: 'mdi',
      }
    }
  }
});