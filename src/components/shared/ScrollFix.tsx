'use client';

import { useEffect } from 'react';

/**
 * Fixes nested scroll container conflicts between html, body, and main.
 * Ensures only body handles the page scroll, while html is transparent.
 */
export default function ScrollFix() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Force html to be transparent to scrolling
    const applyFix = () => {
      // Remove any Tailwind-injected overflow from html
      html.style.setProperty('overflow', 'visible', 'important');
      html.style.setProperty('overflow-x', 'visible', 'important');
      html.style.setProperty('overflow-y', 'visible', 'important');
      html.style.setProperty('height', '100%', 'important');
      html.style.setProperty('position', 'relative', 'important');

      // Body is the main scroll container
      body.style.setProperty('overflow-y', 'auto', 'important');
      body.style.setProperty('overflow-x', 'hidden', 'important');
      body.style.setProperty('min-height', '100dvh', 'important');
      body.style.setProperty('overscroll-behavior', 'none', 'important');

      // Find and fix any main elements that shouldn't constrain scroll
      const mains = document.querySelectorAll('main');
      mains.forEach((main) => {
        const cs = getComputedStyle(main);
        if (cs.overflowY === 'hidden' || cs.overflowY === 'clip') {
          main.style.setProperty('overflow-y', 'visible', 'important');
          main.style.setProperty('overflow', 'visible', 'important');
        }
      });
    };

    // Apply immediately
    applyFix();

    // Also apply after Next.js finishes hydration (styles may be re-injected)
    const timer = setTimeout(applyFix, 100);
    const timer2 = setTimeout(applyFix, 500);
    const timer3 = setTimeout(applyFix, 1000);

    // Watch for style changes that might re-break scroll
    const observer = new MutationObserver((mutations) => {
      let needFix = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.target === document.head) {
          needFix = true;
          break;
        }
        if (m.type === 'attributes' && m.attributeName === 'style') {
          needFix = true;
          break;
        }
      }
      if (needFix) {
        requestAnimationFrame(applyFix);
      }
    });

    observer.observe(document.head, { childList: true, attributes: true, subtree: false });
    observer.observe(html, { attributes: true, attributeFilter: ['style', 'class'] });
    observer.observe(body, { attributes: true, attributeFilter: ['style', 'class'] });

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
      observer.disconnect();
    };
  }, []);

  return null;
}
