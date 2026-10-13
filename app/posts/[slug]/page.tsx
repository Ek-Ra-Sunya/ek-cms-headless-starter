import { notFound } from 'next/navigation';
import { getPost } from '@/lib/ekcms';
import { isHtml, sanitizeHtml } from '@/lib/sanitize-html';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const post = await getPost((await params).slug);
  return { title: post?.data.title, description: post?.data.excerpt };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const { title, coverImageUrl, publishedAt, body, content } = post.data;
  const text = body ?? content ?? '';
  return (
    <article>
      <h1>{title}</h1>
      <time dateTime={publishedAt ?? post.createdAt}>{new Date(publishedAt ?? post.createdAt).toDateString()}</time>
      {/* eslint-disable-next-line @next/next/no-img-element -- CMS image URLs are presigned and short-lived */}
      {coverImageUrl && <img src={coverImageUrl} alt="" />}
      {isHtml(text) ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />
      ) : (
        text
          .split(/\n\s*\n/)
          .filter(Boolean)
          .map((p, i) => <p key={i}>{p}</p>)
      )}
    </article>
  );
}
