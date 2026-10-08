import { buildPwa } from './scripts/build-pwa.mjs'
import { resolve } from 'node:path'
import { globSync, readFileSync } from 'node:fs'

const appIcons = [...new Set(globSync('app/**/*.vue').flatMap(path => [...readFileSync(path, 'utf8').matchAll(/i-lucide-([a-z0-9-]+)/g)].map(match => `lucide:${match[1]}`)))]

export default defineNuxtConfig({
  compatibilityDate: '2026-10-08',
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  icon: { clientBundle: { icons: appIcons } },
  routeRules: { '/offline-shell': { ssr: false } },
  colorMode: { preference: 'system', storage: 'cookie', storageKey: 'myhabit-color-mode' },
  // vue-tsc is not yet compatible with the selected TypeScript 7 release; keep SFC compilation in Vite and run the shared TypeScript typecheck separately.
  typescript: { strict: true, typeCheck: false },
  runtimeConfig: {
    public: {
      supabaseConfigured: Boolean(process.env.NUXT_PUBLIC_SUPABASE_URL && process.env.NUXT_PUBLIC_SUPABASE_KEY),
      workspaceV3Ready: process.env.NUXT_PUBLIC_WORKSPACE_V3_READY === 'true'
    }
  },
  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY || 'not-configured-public-key',
    types: resolve(process.cwd(), 'app/types/database.types.ts'),
    redirect: false,
    useSsrCookies: true
  },
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'th',
    locales: [
      { code: 'th', language: 'th-TH', name: 'ไทย', file: 'th.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' }
    ],
    langDir: '../app/locales'
  },
  app: {
    head: {
      title: 'Myhabit — สร้างจังหวะที่ใช่ในทุกวัน',
      htmlAttrs: { lang: 'th' },
      meta: [
        { name: 'description', content: 'ติดตามกิจวัตร งาน และเป้าหมาย ด้วยจังหวะที่เป็นของคุณ' },
        { name: 'theme-color', content: '#F5F3EE' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap' }
      ]
    }
  },
  hooks: { 'nitro:build:public-assets': async nitro => { await buildPwa(nitro.options.output.publicDir) } },
  nitro: {
    // Nitro 2.13.4 misses Nuxt's internal renderer inline rule on Windows because resolved paths use backslashes.
    externals: { inline: [/[\\/]node_modules[\\/]nuxt[\\/]dist[\\/]/] }
  },
  vite: { build: { target: 'es2022' } }
})
