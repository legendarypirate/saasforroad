const API = process.env.NEXT_PUBLIC_API_URL || '';

/** Resolve stored file path or Cloudinary URL for display/download. */
export function resolveAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/assets/')) return `${API}${path}`;
  return `${API}/assets/${path}`;
}

/** @deprecated use resolveAssetUrl — kept for homepage image helper compatibility */
export function resolveImageUrl(path: string): string {
  if (!path) return '/logo.jpeg';
  return resolveAssetUrl(path) || path;
}
