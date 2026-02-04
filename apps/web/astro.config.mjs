import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import { defineConfig, fontProviders } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
// import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://strapi2front.elevenestudio.com',
  // Use to generate your sitemap and canonical URLs in your final build.
  integrations: [
    starlight({
      title: 'strapi2front',
      description: 'Generate TypeScript types, services, and actions from your Strapi schema',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/elevenestudio/strapi2front' },
      ],
      editLink: {
        baseUrl: 'https://github.com/elevenestudio/strapi2front/edit/main/apps/web/',
      },
      // Disable the default 404 route (we have our own)
      disable404Route: true,
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'docs' },
            { label: 'Quick Start', slug: 'docs/quick-start' },
            { label: 'Installation', slug: 'docs/installation' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'Config File', slug: 'docs/configuration/config-file' },
            { label: 'Output Structure', slug: 'docs/configuration/output-structure' },
            { label: 'Features', slug: 'docs/configuration/features' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Types', slug: 'docs/guides/types' },
            { label: 'Services', slug: 'docs/guides/services' },
            { label: 'Zod Schemas', slug: 'docs/guides/schemas' },
            { label: 'Relations', slug: 'docs/guides/relations' },
            { label: 'Media Upload', slug: 'docs/guides/media' },
          ],
        },
        {
          label: 'Framework Integrations',
          items: [
            { label: 'Astro', slug: 'docs/integrations/astro' },
            { label: 'Next.js', slug: 'docs/integrations/nextjs' },
            { label: 'Nuxt', slug: 'docs/integrations/nuxt' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'CLI Commands', slug: 'docs/reference/cli' },
            { label: 'Config Options', slug: 'docs/reference/config' },
            { label: 'Generated Types', slug: 'docs/reference/types' },
          ],
        },
      ],
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        es: {
          label: 'Español',
        },
      },
      customCss: [
        './src/styles/starlight.css',
      ],
    }),
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
