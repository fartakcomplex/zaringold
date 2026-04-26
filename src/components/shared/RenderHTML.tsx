'use client';

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

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
