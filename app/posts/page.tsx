import Link from 'next/link';
import { listPosts } from '@/lib/ekcms';

export const metadata = { title: 'Posts' };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function Posts({ searchParams }: Props) {
  const page = Math.max(1, Math.floor(Number((await searchParams).page)) || 1);
  const { posts, hasMore } = await listPosts(page);
  return (
    <>
      <h1>Posts</h1>
      {posts.length === 0 && <p>No posts here.</p>}
      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/posts/${p.data.slug}`}>{p.data.title}</Link>
            {p.data.excerpt && <p>{p.data.excerpt}</p>}
          </li>
        ))}
      </ul>
      <nav aria-label="Pagination">
        {page > 1 && <Link href={page === 2 ? '/posts' : `/posts?page=${page - 1}`}>Previous</Link>}
        {hasMore && <Link href={`/posts?page=${page + 1}`}>Next</Link>}
      </nav>
    </>
  );
}
