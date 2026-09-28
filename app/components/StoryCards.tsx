import type { Story } from '../lib/caseStudySource';
import { formatStoryDate, readTimeLabel } from '../lib/caseStudySource';
import { linkSuburbInExcerpt } from '../lib/linkSuburbs';

const REVEAL = ['rv', 'rv d1', 'rv d2'] as const;

/**
 * One card on the Success Stories page. A card whose summary names a serviced suburb links
 * that suburb, and a link cannot sit inside the card's own link, so those cards put the story
 * link on the heading instead. Both shapes are the ones the hand-written page used.
 */
export function StoryCard({ story, index }: { story: Story; index: number }) {
  const excerpt = linkSuburbInExcerpt(story.excerpt);
  const hasInnerLink = excerpt.linked;
  const tag = `${formatStoryDate(story.date, { padDay: false })} · ${readTimeLabel(story.readMinutes)}`;
  const first = index === 0;

  const figure = (
    <figure className="guide-card-img">
      <img
        loading={first ? 'eager' : 'lazy'}
        fetchPriority={first ? 'high' : undefined}
        decoding="async"
        src={story.image}
        alt={story.title}
        width={640}
        height={400}
      />
    </figure>
  );

  const cta = (
    <span className="guide-card-cta">
      Read story <span className="ar">→</span>
    </span>
  );

  return (
    <article className={`guide-card ${REVEAL[index % REVEAL.length]}`}>
      {hasInnerLink ? (
        <div className="guide-card-inner">
          {figure}
          <div className="guide-card-body">
            <span className="guide-card-tag">{tag}</span>
            <h3>
              <a className="guide-card-story-link" href={story.path}>
                {story.title}
              </a>
            </h3>
            <p dangerouslySetInnerHTML={{ __html: excerpt.html }} />
            {cta}
          </div>
        </div>
      ) : (
        <a className="guide-card-inner" href={story.path}>
          {figure}
          <div className="guide-card-body">
            <span className="guide-card-tag">{tag}</span>
            <h3>{story.title}</h3>
            <p dangerouslySetInnerHTML={{ __html: excerpt.html }} />
            {cta}
          </div>
        </a>
      )}
    </article>
  );
}
