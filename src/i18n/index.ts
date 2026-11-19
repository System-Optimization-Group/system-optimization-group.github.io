import { langs, defaultLang, meta, ui, type Key, type Lang } from './ui';
import { site } from '../site.config';
import { url } from '../lib/url';

export { langs, meta, type Lang, type Key };

export const isLang = (s: string | undefined): s is Lang => !!s && (langs as readonly string[]).includes(s);

/** "/people" -> "/zh-hans/people" (plus the deploy base path). */
export const localize = (lang: Lang, path: string) =>
  url(lang === defaultLang ? path : `/${lang}${path === '/' ? '' : path}`);

/** Strip base path and language prefix: "/repo/zh-hant/people/x" -> "/people/x". */
export function pagePath(pathname: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let p = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const first = p.split('/')[1];
  if (isLang(first)) p = p.slice(first.length + 1);
  p = p.replace(/\/$/, '');
  return p || '/';
}

/** Site texts (tagline, about, ...) with per-language overrides from site.config.ts. */
function siteText(lang: Lang) {
  const o = site.translations?.[lang] ?? {};
  return {
    name: o.name ?? site.name,
    tagline: o.tagline ?? site.tagline,
    description: o.description ?? site.description,
    institution: o.institution ?? site.institution,
    address: o.address ?? site.address,
    about: o.about ?? site.about,
    join: o.join ?? site.join,
  };
}

/** Use in any page or component: `const { t, l, lang, intl, s } = useI18n(Astro);` */
export function useI18n(astro: { currentLocale?: string }) {
  const lang: Lang = isLang(astro.currentLocale) ? astro.currentLocale : defaultLang;
  const t = (key: Key, vars: Record<string, string | number> = {}) => {
    const s = ui[lang][key] ?? ui[defaultLang][key] ?? key;
    return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
  };
  return { lang, t, l: (path: string) => localize(lang, path), intl: meta[lang].intl, s: siteText(lang) };
}
