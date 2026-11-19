// Prefix internal links with the configured base path (needed on GitHub Pages project sites).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (path: string) => (/^(https?:|mailto:)/.test(path) ? path : `${base}${path}`);
