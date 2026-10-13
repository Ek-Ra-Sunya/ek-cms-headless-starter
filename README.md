# EK CMS headless starter

A minimal Next.js site (App Router, TypeScript) that reads one EK CMS site's published content over the EK CMS API: the home page, pages with their sections, the menu, site settings and blog posts.

Headless access is part of the EK CMS Pro plan. Developer docs: https://cms.ekrasunya.com/developers

## Get a site ID and API key

1. Sign in to your EK CMS dashboard and open **API keys**.
2. Copy the **Site ID** shown on that page.
3. Create a key. The full key (`ekcms_pk_...`) is shown once, so copy it then.

A key can be revoked on the same page. It stops working at once.

## Setup

Requires pnpm and Node.js 22.22.2 or later on 22, or 24.15 or later.

```bash
pnpm install
cp .env.example .env.local
# fill in EKCMS_SITE and EKCMS_API_KEY
pnpm dev
```

| Variable | Value |
| --- | --- |
| `EKCMS_API_URL` | `https://ekcms-api.ekrasunya.com/api/v1` |
| `EKCMS_SITE` | Your site ID, sent as the `x-site-id` header |
| `EKCMS_API_KEY` | Your API key, sent as the `x-api-key` header |

## How it works

- `lib/ekcms.ts` is the only file that talks to the API. It imports `server-only`, so the build fails if a client component imports it, and the key never reaches the browser.
- Every fetch is cached for 300 seconds (`next: { revalidate }`). Change `REVALIDATE` to suit how often you publish.
- Pages render per request, so `pnpm build` needs no credentials. API responses still come from the cache.
- `app/Sections.tsx` renders each section's heading and text and shows its raw data. Replace it with your own component per section `type`.

| Route | API calls |
| --- | --- |
| `/` | `/pages/home`, or the oldest page from `/pages` if there is none, then its sections |
| `/[slug]` | `/pages/:slug`, `/pages/:pageId/sections` |
| `/posts?page=` | `/posts?type=blog`, 20 per page with Next and Previous links |
| `/posts/[slug]` | `/posts/by-slug/:slug` |
| every page | `/site-config`, `/menu-items` |

## Deploy

**Vercel:** import the repository, add the three variables under Project Settings, Environment Variables, and deploy.

**Node:** set the three variables, then:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start   # listens on PORT, default 3000
```

## Rate limits and errors

Requests are rate limited per client IP over a one minute window. All requests from your server share one IP, so keep the cache on. Responses carry `x-ratelimit-limit`, `x-ratelimit-remaining` and `x-ratelimit-reset` headers.

Errors return JSON with `status: "error"`, a `code` and a `message`. `lib/ekcms.ts` throws them as `EkcmsError` (a 404 returns `null` instead).

| Status | Code | Meaning |
| --- | --- | --- |
| 401 | `API_KEY_REQUIRED` | No key was sent |
| 401 | `API_KEY_INVALID` | The key is unknown, revoked or belongs to another site |
| 403 | `HEADLESS_NOT_ENTITLED` | The site is not on the Pro plan |
| 429 | `RATE_LIMITED` | Too many requests in the current minute |

## License

MIT
