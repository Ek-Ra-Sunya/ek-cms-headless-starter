import { notFound } from 'next/navigation';
import { getPage, getSections } from '@/lib/ekcms';
import { Sections } from '../Sections';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const page = await getPage((await params).slug);
  return { title: page?.title };
}

export default async function CmsPage({ params }: Props) {
  const page = await getPage((await params).slug);
  if (!page) notFound();
  return (
    <>
      <h1>{page.title}</h1>
      <Sections sections={await getSections(page.id)} />
    </>
  );
}
