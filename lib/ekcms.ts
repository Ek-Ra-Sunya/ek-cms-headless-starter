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

type Envelope<T> = { data: T; meta?: { total: number; hasMore: boolean } };

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

/** The most a list endpoint returns per request (PaginationQueryDto caps limit at 100). */
const MAX_LIMIT = 100;

/**
 * Every paginated list fetch goes through here: one page of `path`. The API
 * defaults to 20 items when no limit is sent, so callers always pass one.
 */
async function list<T>(path: string, limit: number, offset = 0) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await request<T[]>(`${path}${sep}limit=${limit}&offset=${offset}`);
  return { items: res?.data ?? [], total: res?.meta?.total ?? 0, hasMore: res?.meta?.hasMore ?? false };
}

/** Every item of a paginated list, following `hasMore` at the largest page size. */
async function listAll<T>(path: string): Promise<T[]> {
  const all: T[] = [];
  for (let more = true; more; ) {
    const page = await list<T>(path, MAX_LIMIT, all.length);
    all.push(...page.items);
    more = page.hasMore && page.items.length > 0;
  }
  return all;
}

const seg = encodeURIComponent;

export const getSiteConfig = () => get<SiteConfig>('/site-config');
/** The menu is one tree, not a paginated list. */
export const getMenu = async () => (await get<MenuItem[]>('/menu-items')) ?? [];
export const getPage = (slug: string) => get<Page>(`/pages/${seg(slug)}`);
export const getPost = (slug: string) => get<Post>(`/posts/by-slug/${seg(slug)}`);

export const POSTS_PER_PAGE = 20;

/** One page (1-based) of published blog posts, newest first, with `hasMore` for paging. */
export async function listPosts(page: number) {
  const { items, hasMore } = await list<Post>('/posts?type=blog', POSTS_PER_PAGE, (page - 1) * POSTS_PER_PAGE);
  return { posts: items, hasMore };
}

/** All sections of a page, in editor order. */
export async function getSections(pageId: string): Promise<Section[]> {
  const rows = await listAll<Section>(`/pages/${seg(pageId)}/sections`);
  return rows.sort((a, b) => a.order - b.order);
}

/** The page with slug "home", else the oldest published page. */
export async function getHomePage(): Promise<Page | null> {
  const home = await getPage('home');
  if (home) return home;
  // /pages lists newest first, so the oldest page is the last one.
  const { total } = await list<Page>('/pages', 1);
  if (total === 0) return null;
  return (await list<Page>('/pages', 1, total - 1)).items[0] ?? null;
}
