'use client';

import { useEffect } from 'react';
import {
  BLOG_INDEX_PATH,
  canonicalPostPathForCurrent,
} from '../lib/blogCanonical';

/**
 * Catch remaining blog-render / wrong-host blog navigations and keep them on
 * this site's canonical legacy URLs.
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
        window.location.assign(
          slug ? canonicalPostPathForCurrent(slug) : BLOG_INDEX_PATH,
        );
        return;
      }

      // Absolute blog URLs pointing at another of our hosts → stay on this host
      const crossHost = abs.match(
        /^https?:\/\/(?:(?:www\.)?baxtermason\.com\.au|baxter-mason-website\.vercel\.app|localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?)\/blog(\/[^?#]*)?/i,
      );
      if (crossHost && typeof window !== 'undefined') {
        const currentSlug = crossHost[1]
          ? decodeURIComponent(crossHost[1].replace(/^\//, '').replace(/\/$/, ''))
          : '';
        const path = currentSlug
          ? canonicalPostPathForCurrent(currentSlug)
          : BLOG_INDEX_PATH;
        const requestedPath = new URL(abs).pathname.replace(/\/$/, '') || '/';
        if (requestedPath !== path.replace(/\/$/, '')) {
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
