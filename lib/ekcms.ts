import 'server-only';

/**
 * EK CMS API client. `server-only` makes the build fail if a client component
 * imports this file, so the API key can never reach the browser bundle.
 */

/** Seconds a response may be served from the cache before it is refetched. */
const REVALIDATE = 300;

export type Page = { id: string; title: string; slug: string; showInMenu?: boolean; createdAt?: string };
export type Section = { id: string; pageId: string; type: string; order: number; data: Record<string, unknown> };
export type Post = {
  id: string;
  createdAt: string;
  data: { title?: string; slug?: string; excerpt?: string; body?: string; content?: string; coverImageUrl?: string; publishedAt?: string };
};
export type MenuItem = { id: string; label: string; url?: string | null; pageSlug?: string | null; children?: MenuItem[] };
export type SiteConfig = { site?: { name?: string; tagline?: string } };

/** An error response from the API, carrying its machine-readable code. */
export class EkcmsError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(`${status} ${code}: ${message}`);
  }
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in.`);
  return value;
}

type Envelope<T> = { data: T; meta?: { total: number } };

/** GETs one API path and returns its `{ data, meta }` envelope. Returns null on 404. */
async function request<T>(path: string): Promise<Envelope<T> | null> {
  const res = await fetch(`${env('EKCMS_API_URL')}${path}`, {
    headers: { 'x-site-id': env('EKCMS_SITE'), 'x-api-key': env('EKCMS_API_KEY') },
    next: { revalidate: REVALIDATE },
  });
  if (res.status === 404) return null;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new EkcmsError(res.status, body?.code ?? 'UNKNOWN', body?.message ?? res.statusText);
  return body as Envelope<T>;
}

const get = async <T>(path: string) => (await request<T>(path))?.data ?? null;

const seg = encodeURIComponent;

export const getSiteConfig = () => get<SiteConfig>('/site-config');
export const getMenu = async () => (await get<MenuItem[]>('/menu-items')) ?? [];
export const getPage = (slug: string) => get<Page>(`/pages/${seg(slug)}`);
export const listPosts = async () => (await get<Post[]>('/posts?type=blog&limit=20')) ?? [];
export const getPost = (slug: string) => get<Post>(`/posts/by-slug/${seg(slug)}`);

export async function getSections(pageId: string): Promise<Section[]> {
  const rows = (await get<Section[]>(`/pages/${seg(pageId)}/sections`)) ?? [];
  return rows.sort((a, b) => a.order - b.order);
}

/** The page with slug "home", else the oldest published page. */
export async function getHomePage(): Promise<Page | null> {
  const home = await getPage('home');
  if (home) return home;
  // /pages lists newest first, so the oldest page is the last one.
  const total = (await request<Page[]>('/pages?limit=1'))?.meta?.total ?? 0;
  if (total === 0) return null;
  return (await get<Page[]>(`/pages?limit=1&offset=${total - 1}`))?.[0] ?? null;
}
