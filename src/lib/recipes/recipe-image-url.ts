export function buildRecipeImageUrl(rawUrl?: string | null): string | undefined {
  if (!rawUrl) return undefined;

  if (rawUrl.startsWith("/")) return rawUrl;
  if (!/^https?:\/\//i.test(rawUrl)) return rawUrl;

  return `/api/recipes/image?url=${encodeURIComponent(rawUrl)}`;
}
