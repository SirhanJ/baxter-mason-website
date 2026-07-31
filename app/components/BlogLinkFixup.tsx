'use client';

import { useEffect } from 'react';

/**
 * Catch remaining blog-render / wrong-host blog navigations and keep them on /blog/...
 * Works on localhost, Vercel, and baxtermason.com.au because links stay same-origin relative.
 */
export function BlogLinkFixup() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      const abs = anchor.href || '';
      const supabase = abs.match(
        /iipazmwbtctblpyszspb\.supabase\.co\/functions\/v1\/blog-render\/baxter-mason(?:\/([^?#/]+))?/i,
      );
      if (supabase) {
        event.preventDefault();
        event.stopPropagation();
        const slug = supabase[1] ? decodeURIComponent(supabase[1]) : '';
        window.location.assign(slug ? `/blog/${slug}` : '/blog');
        return;
      }

      // Absolute blog URLs pointing at another of our hosts → stay on this host
      const crossHost = abs.match(
        /^https?:\/\/(?:(?:www\.)?baxtermason\.com\.au|baxter-mason-website\.vercel\.app|localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?)\/blog(\/[^?#]*)?/i,
      );
      if (crossHost && typeof window !== 'undefined') {
        const path = `/blog${crossHost[1] || ''}`;
        if (`${window.location.origin}${path}` !== abs.split('?')[0].replace(/\/$/, '') && !abs.startsWith(window.location.origin)) {
          event.preventDefault();
          event.stopPropagation();
          window.location.assign(path);
        }
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
