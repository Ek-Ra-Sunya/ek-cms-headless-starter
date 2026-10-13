import type { Section } from '@/lib/ekcms';

const text = (data: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) if (typeof data[k] === 'string' && data[k]) return data[k] as string;
  return '';
};

/**
 * Section data is free-form JSON shaped by the section type in the dashboard.
 * This renders the common heading and text fields and shows the raw data, so
 * you can see each shape and swap in your own component per `type`.
 */
export function Sections({ sections }: { sections: Section[] }) {
  return sections.map((s) => {
    const heading = text(s.data, 'title', 'heading');
    const body = text(s.data, 'subtitle', 'description', 'body', 'content');
    return (
      <section key={s.id} data-type={s.type}>
        {heading && <h2>{heading}</h2>}
        {body && <p>{body}</p>}
        <details>
          <summary>{s.type} section data</summary>
          <pre>{JSON.stringify(s.data, null, 2)}</pre>
        </details>
      </section>
    );
  });
}
