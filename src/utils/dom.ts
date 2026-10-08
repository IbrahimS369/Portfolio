/** Escape untrusted text before inserting into HTML templates. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only allow http(s) URLs into href attributes. */
export function safeUrl(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:' ? u.href : '';
  } catch {
    return '';
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

