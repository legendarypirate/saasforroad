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

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Build TipTap HTML from a standart section (body, or legacy paragraphs + bullets). */
export function standartSectionToHtml(section: {
  body?: string;
  paragraphs?: string[];
  bullets?: string[];
}): string {
  if (!isEmptyRichText(section.body)) return section.body!;

  const parts: string[] = [];
  for (const paragraph of section.paragraphs ?? []) {
    if (!paragraph?.trim()) continue;
    if (isHtml(paragraph)) parts.push(paragraph);
    else parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  }
  const bullets = (section.bullets ?? []).filter((b) => b?.trim());
  if (bullets.length > 0) {
    parts.push(
      `<ul>${bullets
        .map((b) => (isHtml(b) ? `<li>${b}</li>` : `<li>${escapeHtml(b)}</li>`))
        .join('')}</ul>`,
    );
  }
  return parts.join('');
}
