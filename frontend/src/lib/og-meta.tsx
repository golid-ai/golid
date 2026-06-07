import { Meta } from "@solidjs/meta";

/** Public site origin for Open Graph (must be absolute for iMessage, Slack, etc.). */
export const OG_SITE_BASE = (import.meta.env.VITE_OG_URL || "https://golid.ai").replace(/\/$/, "");

export const DEFAULT_OG_IMAGE_URL = `${OG_SITE_BASE}/images/golid-og.png`;

export const DEFAULT_OG_TITLE = "Golid";

export const DEFAULT_OG_DESCRIPTION =
  "Production-ready Go + SolidJS starter. Auth, 70+ components, SSR, real-time events, and one-command deployment.";

/** Ensure og:image is absolute for link previews when the API returns a path. */
export function toAbsoluteOgImage(url: string | undefined | null): string | undefined {
  const u = url?.trim();
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${OG_SITE_BASE}${path}`;
}

/** Build an absolute URL for a backend-served Open Graph image. */
export function toAbsoluteApiOgImage(path: string, apiOrigin = import.meta.env.VITE_API_URL || ""): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const origin = (apiOrigin || OG_SITE_BASE).replace(/\/$/, "");
  return `${origin}${cleanPath}`;
}

/** Route-level Open Graph + Twitter title/description (og:url / og:image come from RootLayout). */
export function OgSocialMeta(props: { title: string; description: string }) {
  return (
    <>
      <Meta property="og:title" content={props.title} />
      <Meta property="og:description" content={props.description} />
      <Meta name="twitter:title" content={props.title} />
      <Meta name="twitter:description" content={props.description} />
    </>
  );
}
