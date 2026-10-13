import Link from 'next/link';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { getMenu, getSiteConfig, type MenuItem } from '@/lib/ekcms';
import './globals.css';

export async function generateMetadata() {
  await connection();
  const config = await getSiteConfig();
  return { title: config?.site?.name ?? 'EK CMS site', description: config?.site?.tagline };
}

/** A menu item links to its CMS page when it has one, else to its own URL. */
const href = (item: MenuItem) => (item.pageSlug ? `/${item.pageSlug}` : (item.url ?? '#'));

function Menu({ items }: { items: MenuItem[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <Link href={href(item)}>{item.label}</Link>
          {item.children?.length ? <Menu items={item.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Render per request so a build needs no API credentials. API responses are
  // still cached for the revalidate window set in lib/ekcms.ts.
  await connection();
  const [config, menu] = await Promise.all([getSiteConfig(), getMenu()]);
  return (
    <html lang="en">
      <body>
        <header>
          <Link href="/">
            <strong>{config?.site?.name ?? 'Home'}</strong>
          </Link>
          <nav aria-label="Main">
            <Menu items={menu} />
            <Link href="/posts">Posts</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
