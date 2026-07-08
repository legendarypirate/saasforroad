export function stripHtml(html: string): string {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

export function isEmptyRichText(html?: string | null): boolean {
  if (!html) return true;
  return stripHtml(html).length === 0;
}
