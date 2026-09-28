import type { Story } from '../lib/caseStudySource';
import { formatStoryDate, readTimeLabel } from '../lib/caseStudySource';

/** The body of a single success story, the same markup the hand-written story pages used. */
export function StoryPage({ story, related }: { story: Story; related: Story[] }) {
  const date = formatStoryDate(story.date, { padDay: false });
  return (
    <article>
      <section className="page-hero img-hero" style={{ backgroundImage: `url('${story.heroImage}')` }}>
        <div className="grain" />
        <div className="wrap">
          <div className="page-hero-copy">
            <span className="eyebrow rv">Success Story</span>
            <h1 className="display rv d1">{story.title}</h1>
            <p className="sub rv d2">
              <span className="blog-meta">{date}</span> · <span className="blog-meta">Success Story</span> ·{' '}
              <span className="blog-meta">{readTimeLabel(story.readMinutes)}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="blk blog-article">
        <div className="wrap">
          <figure className="article-featured rv">
            <img
              loading="eager"
              fetchPriority="high"
              decoding="async"
              src={story.image}
              alt={story.imageAlt}
              width={1080}
              height={608}
            />
          </figure>
          <div className="blog-article-body rv" dangerouslySetInnerHTML={{ __html: story.bodyHtml }} />
          <div className="blog-author rv d1">
            <img loading="lazy" decoding="async" src="/images/sally-profile.webp" alt="Sally Blyth" width={64} height={64} />
            <div>
              <strong>Sally Blyth</strong>
              <p>
                Sally is the founder and director of Baxter &amp; Mason Property Buyers Agent. She bought her first
                property in 1996 and has been helping buyers, especially women building independence on their own, ever
                since.
              </p>
            </div>
          </div>
          <a className="blog-back rv d2" href="/success-stories-buyers-agent-sunshine-coast">
            <span className="ar">←</span> Back to success stories
          </a>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="blk article-related">
          <div className="wrap">
            <div className="head rv">
              <span className="eyebrow">Keep reading</span>
              <h2>More success stories</h2>
            </div>
            <div className="related-grid rv d1">
              {related.map((item) => (
                <a key={item.slug} className="related-card" href={item.path}>
                  <figure className="related-card-img">
                    <img loading="lazy" decoding="async" src={item.image} alt={item.title} width={240} height={180} />
                  </figure>
                  <div className="related-card-body">
                    <span className="related-card-date">{formatStoryDate(item.date, { padDay: false })}</span>
                    <h3>{item.title}</h3>
                    <span className="related-card-cta">
                      Read story <span className="ar">→</span>
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
