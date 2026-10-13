import DOMPurify from 'isomorphic-dompurify';

/**
 * Post bodies are HTML from the EK CMS rich text editor, and the API returns
 * them as stored. Clean them before rendering: a tight allowlist of formatting,
 * links, lists and tables, with scripts, event handlers and javascript: URLs
 * stripped. Same rules as the EK CMS front end.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'colspan', 'rowspan'];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload', 'onmouseover'],
  });
}

/** Older posts store plain text with paragraphs split by blank lines. */
export const isHtml = (body: string) => /<[a-z][\s\S]*>/i.test(body);
