import { getHomePage, getSections } from '@/lib/ekcms';
import { Sections } from './Sections';

export default async function Home() {
  const page = await getHomePage();
  if (!page) return <p>This site has no published pages yet.</p>;
  return (
    <>
      <h1>{page.title}</h1>
      <Sections sections={await getSections(page.id)} />
    </>
  );
}
