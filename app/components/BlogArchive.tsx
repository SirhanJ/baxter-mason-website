'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const PER_PAGE = 9;

function stripScripts(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

function readPageFromUrl(): number {
  if (typeof window === 'undefined') return 1;
  const raw = new URLSearchParams(window.location.search).get('page');
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

type Props = {
  html: string;
};

export function BlogArchive({ html }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ready, setReady] = useState(false);

  const cleanHtml = useMemo(() => stripScripts(html), [html]);

  useEffect(() => {
    setPage(readPageFromUrl());
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root
      .querySelectorAll('[data-blog-load-sentinel]')
      .forEach((el) => el.remove());

    const cards = Array.from(
      root.querySelectorAll<HTMLElement>('[data-blog-load-index]'),
    );

    cards.forEach((card) => card.classList.remove('is-hidden-by-scroll'));

    const total = Math.max(1, Math.ceil(cards.length / PER_PAGE));
    setTotalPages(total);

    const safePage = Math.min(Math.max(1, page), total);
    if (safePage !== page) {
      setPage(safePage);
      return;
    }

    const start = (safePage - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    cards.forEach((card, i) => {
      card.hidden = !(i >= start && i < end);
      card.style.display = i >= start && i < end ? '' : 'none';
    });

    setReady(true);
  }, [cleanHtml, page]);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (page <= 1) url.searchParams.delete('page');
    else url.searchParams.set('page', String(page));
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [page, ready]);

  function goTo(next: number) {
    const clamped = Math.min(Math.max(1, next), totalPages);
    setPage(clamped);
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const pages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const set = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    return [...set]
      .filter((n) => n >= 1 && n <= totalPages)
      .sort((a, b) => a - b);
  }, [page, totalPages]);

  return (
    <div className="blog-archive">
      <div
        ref={rootRef}
        className="blog-archive-html"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />

      {totalPages > 1 ? (
        <nav className="blog-pagination" aria-label="Blog pages">
          <button
            type="button"
            className="blog-pagination-btn"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </button>

          <ol className="blog-pagination-list">
            {pages.map((n, idx) => {
              const prev = pages[idx - 1];
              const showEllipsis = prev != null && n - prev > 1;
              return (
                <li key={n} className="blog-pagination-item">
                  {showEllipsis ? (
                    <span className="blog-pagination-ellipsis" aria-hidden="true">
                      …
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={
                      n === page
                        ? 'blog-pagination-btn is-active'
                        : 'blog-pagination-btn'
                    }
                    onClick={() => goTo(n)}
                    aria-current={n === page ? 'page' : undefined}
                  >
                    {n}
                  </button>
                </li>
              );
            })}
          </ol>

          <button
            type="button"
            className="blog-pagination-btn"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
