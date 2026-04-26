'use client';

import DOMPurify from 'dompurify';

/**
 * RenderHTML — renders HTML content safely
 * Used to display rich text content from the CMS editor
 */

interface RenderHTMLProps {
  html: string;
  className?: string;
  as?: 'div' | 'span' | 'p';
}

export default function RenderHTML({
  html,
  className = '',
  as: Tag = 'div',
}: RenderHTMLProps) {
  if (!html) return null;

  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'figure', 'figcaption', 'video', 'source', 'iframe'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style', 'target', 'rel', 'width', 'height', 'frameborder', 'allowfullscreen', 'loading'],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
