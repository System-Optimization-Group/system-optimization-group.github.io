// Date formatting per interface language. `locale` is an Intl locale such as
// 'en-GB', 'zh-Hans-CN', 'zh-Hant-HK' (see meta[lang].intl in src/i18n/ui.ts).
const fmt = (d: Date, locale: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { ...o, timeZone: 'UTC' }).format(d);

export const fmtDate = (d: Date, locale: string) => fmt(d, locale, { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtShortDate = (d: Date, locale: string) => fmt(d, locale, { day: 'numeric', month: 'short', year: 'numeric' });
