import Link from 'next/link';
import { listPosts } from '@/lib/ekcms';

export const metadata = { title: 'Posts' };

export default async function Posts() {
  const posts = await listPosts();
  return (
    <>
      <h1>Posts</h1>
      {posts.length === 0 && <p>No posts yet.</p>}
      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/posts/${p.data.slug}`}>{p.data.title}</Link>
            {p.data.excerpt && <p>{p.data.excerpt}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
