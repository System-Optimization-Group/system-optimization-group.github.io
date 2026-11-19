import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// For GitHub Pages project sites set SITE / BASE_PATH in the workflow,
// e.g. SITE=https://user.github.io BASE_PATH=/repo-name
export default defineConfig({
  site: process.env.SITE || 'https://example.org',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  // Interface languages. English has no URL prefix; others live under /<locale>/.
  // Keep in sync with `langs` in src/i18n/ui.ts.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-hant', 'zh-hans'],
    routing: { prefixDefaultLocale: false },
  },
  // sitemap-index.xml + sitemap-0.xml, with hreflang alternates for each language version.
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', 'zh-hans': 'zh-Hans', 'zh-hant': 'zh-Hant-HK' },
      },
      filter: (page) => !/\/404\/?$/.test(page),
    }),
  ],
});
