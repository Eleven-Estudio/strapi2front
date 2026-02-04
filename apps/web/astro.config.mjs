import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'
import { defineConfig, fontProviders } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
// import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  base: '.', // Set a path prefix
  site: 'https://strapi2front.elevenestudio.com',
  // Use to generate your sitemap and canonical URLs in your final build.
  integrations: [
    sitemap(),
    react(),
    //   sentry({
    //   dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
    //   sourceMapsUploadOptions: {
    //     project: 'proyecto-ejemplo',
    //     authToken: process.env.SENTRY_AUTH_TOKEN,
    //   },
    // }),
  ],
  devToolbar: {
    enabled: false
  },
  experimental: {
    fonts: [{
      provider: fontProviders.google(),
      name: "Geist Mono",
      weights: [300, 400, 500, 600, 700, 800, 900],
      cssVariable: "--font-geist"
    }]
  },
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'server',
  adapter: vercel()
})
