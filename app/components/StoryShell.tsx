import Script from 'next/script';

/**
 * The chrome around the success story pages: the loader, header, closing call to action and
 * footer, exactly as the hand-written story pages carried them (webp logos, main.js v60).
 *
 * BlogShell predates the current header, so the stories get their own shell rather than
 * inheriting the older png logos and footer blurb.
 */

const LOGO_DIR = '/images/logos%20and%20sally%20stuff';

const socials: ReadonlyArray<readonly [string, string, string]> = [
  [
    'https://www.linkedin.com/company/baxter-mason-property-buyers-agent/',
    'LinkedIn',
    'M5 4.5A2.5 2.5 0 1 1 5 9.5 2.5 2.5 0 0 1 5 4.5ZM4 10.5h2v10H4v-10Zm6 0h1.9v1.4h.1c.3-.5 1-.9 2.1-.9 2.2 0 2.6 1.4 2.6 3.3v6.2H14v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.6H8v-10Z',
  ],
  [
    'https://www.facebook.com/BaxterandMason',
    'Facebook',
    'M14 8.5h2.5l-.4 3H14v8.5h-3.5V11.5H9V8.5h1.5V6.8c0-2.4 1.4-3.8 3.7-3.8.7 0 1.4.1 2.1.2v2.7h-1.5c-.9 0-1.1.4-1.1 1.1v1.7Z',
  ],
  [
    'https://www.instagram.com/baxter_and_mason_property_ba/',
    'Instagram',
    'M8 3.5h8A4.5 4.5 0 0 1 20.5 8v8A4.5 4.5 0 0 1 16 20.5H8A4.5 4.5 0 0 1 3.5 16V8A4.5 4.5 0 0 1 8 3.5Zm0 2A2.5 2.5 0 0 0 5.5 8v8A2.5 2.5 0 0 0 8 18.5h8a2.5 2.5 0 0 0 2.5-2.5V8A2.5 2.5 0 0 0 16 5.5H8Zm9.25 1.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5Zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5Z',
  ],
  [
    'https://www.youtube.com/@BaxterMasonPropertyBuyersAgent',
    'YouTube',
    'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18 5 12 5 12 5s-6 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C6 18.9 12 19 12 19s6 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z',
  ],
  [
    'https://www.tiktok.com/@baxterandmason',
    'TikTok',
    'M14.5 4.5c.5 1.8 1.8 3.2 3.5 3.7v3.1a6.8 6.8 0 0 1-3.5-.9v6.6a5.4 5.4 0 1 1-5.4-5.4c.3 0 .6 0 .9.1v3.3a2.2 2.2 0 1 0 1.6 2.1V4.5h2.9Z',
  ],
];

function StoryHeader() {
  return (
    <>
      <div className="site-loader" id="siteLoader" role="presentation" aria-hidden="true">
        <div className="site-loader-inner">
          <img
            loading="eager"
            decoding="async"
            className="site-loader-logo"
            src={`${LOGO_DIR}/Baxter-and-Mason-logo-color-clear.webp?v=3`}
            alt="Baxter &amp; Mason Property Buyers Agent"
            width={320}
            height={80}
          />
          <div className="site-loader-bar">
            <span />
          </div>
        </div>
      </div>

      <header className="nav" id="nav">
        <div className="wrap">
          <a className="logo" href="/">
            <img
              loading="eager"
              decoding="async"
              width={515}
              height={118}
              className="logo-img logo-img--color"
              src={`${LOGO_DIR}/Baxter-and-Mason-logo-color-clear.webp?v=3`}
              alt="Baxter & Mason Property Buyers Agent"
            />
            <img
              loading="lazy"
              decoding="async"
              width={350}
              height={180}
              className="logo-img logo-img--light"
              src={`${LOGO_DIR}/Baxter-and-Mason-logo-light-clear.webp`}
              alt=""
              aria-hidden="true"
            />
          </a>
          <nav className="links" id="menu">
            <div className="nav-item has-drop">
              <button className="l drop-toggle" type="button" aria-expanded="false">
                About <span className="drop-chevron" />
              </button>
              <div className="drop-menu">
                <a href="/what-we-do-buyers-agent-sunshine-coast">What We Do</a>
                <a href="/sunshine-coast-buyers-agent">Why Work With Us</a>
                <a href="/property-coaching-sunshine-coast-buyers-agent">Coaching</a>
                <a href="/investment-expertise-sunshine-coast">Investment</a>
                <a href="/commercial-property-acquisition-sunshine-coast-buyers-agent">Commercial</a>
                <a href="/empowering-women-through-property-sunshine-coast">Empowering Women</a>
                <a href="/our-people-buyers-agent-sunshine-coast">Our People</a>
                <a href="/privacy-statement-buyers-agent-sunshine-coast">Privacy Policy</a>
                <a href="/terms--conditions">Terms &amp; Conditions</a>
              </div>
            </div>
            <div className="nav-item has-drop">
              <button className="l drop-toggle" type="button" aria-expanded="false">
                Services <span className="drop-chevron" />
              </button>
              <div className="drop-menu">
                <a href="/services">Our Services</a>
                <a href="/suburbs-we-buy-in">Suburbs We Buy In</a>
              </div>
            </div>
            <a className="l" href="/success-stories-buyers-agent-sunshine-coast">
              Success Stories
            </a>
            <div className="nav-item has-drop">
              <button className="l drop-toggle" type="button" aria-expanded="false">
                Resources <span className="drop-chevron" />
              </button>
              <div className="drop-menu">
                <a href="/free-guides-and-downloads">Free Guides</a>
                <a href="/FAQ-Buyers-Agent-Sunshine-Coast">FAQ</a>
                <a href="/blogs-buyers-agent-sunshine-coast">Blog</a>
                <a href="/google-reviews-buyers-agent-sunshine-coast">Client Reviews</a>
              </div>
            </div>
            <a className="l" href="/contact">
              Contact
            </a>
            <a className="btn nav-mobile-cta" href="/book-a-free-discovery-call">
              Book a discovery call <span className="ar">→</span>
            </a>
          </nav>
          <a className="btn nav-desktop-cta" href="/book-a-free-discovery-call">
            Book a discovery call <span className="ar">→</span>
          </a>
          <button className="burger" id="burger" aria-label="Menu" aria-expanded="false">
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
    </>
  );
}

function StoryFooter() {
  return (
    <>
      <section className="final final-rich" id="book">
        <div className="wrap">
          <div className="final-panel rv">
            <div className="final-main">
              <span className="eyebrow">Let&apos;s begin</span>
              <h2 className="display">Have a quiet, honest conversation first.</h2>
              <p className="sub">No obligation and no pressure. Just a chance to talk through what you want to buy.</p>
              <div className="final-chips">
                <span className="final-chip">Free · 15 min</span>
                <span className="final-chip">No obligation</span>
                <span className="final-chip">Sunshine Coast</span>
              </div>
              <div className="cta-row">
                <a className="btn lg" href="/book-a-free-discovery-call">
                  Book a discovery call <span className="ar">→</span>
                </a>
                <a className="btn glass lg" href="mailto:mail@baxtermason.com.au">
                  Email the Team
                </a>
              </div>
            </div>
            <div className="final-side">
              <div className="final-side-inner">
                <span className="final-side-label">Reach the team</span>
                <a className="final-link" href="tel:+61490744453">
                  <span className="final-link-k">Phone</span>
                  <span className="final-link-v">+61 490 744 453</span>
                </a>
                <a className="final-link" href="mailto:mail@baxtermason.com.au">
                  <span className="final-link-k">Email</span>
                  <span className="final-link-v">mail@baxtermason.com.au</span>
                </a>
                <div className="final-link is-static">
                  <span className="final-link-k">Office</span>
                  <span className="final-link-v">17 Baleara Street, Buddina QLD 4575</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="ft">
        <div className="wrap">
          <div className="ft-top">
            <div className="brand-col">
              <img
                loading="lazy"
                decoding="async"
                width={258}
                height={252}
                className="ft-logo"
                src={`${LOGO_DIR}/BM-circle-transparent.webp?v=4`}
                alt="Baxter & Mason"
              />
              <p className="blurb">
                An independent, woman-led buyers agency on the Sunshine Coast. We buy established homes, off-market
                listings and investment property from Caloundra to Noosa for first home buyers, relocators, downsizers and
                investors.
              </p>
              <div className="socials" aria-label="Follow Baxter and Mason on social media">
                {socials.map(([href, label, d]) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d={d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            <div className="ft-col">
              <h4>Explore</h4>
              <ul>
                <li>
                  <a href="/what-we-do-buyers-agent-sunshine-coast">What We Do</a>
                </li>
                <li>
                  <a href="/our-people-buyers-agent-sunshine-coast">Our People</a>
                </li>
                <li>
                  <a href="/services">Services</a>
                </li>
                <li>
                  <a href="/suburbs-we-buy-in">Suburbs We Buy In</a>
                </li>
                <li>
                  <a href="/success-stories-buyers-agent-sunshine-coast">Success Stories</a>
                </li>
                <li>
                  <a href="/google-reviews-buyers-agent-sunshine-coast">Client Reviews</a>
                </li>
              </ul>
            </div>
            <div className="ft-col">
              <h4>Contact</h4>
              <ul>
                <li>
                  <a href="tel:+61490744453">+61 490 744 453</a>
                </li>
                <li>
                  <a href="mailto:mail@baxtermason.com.au">mail@baxtermason.com.au</a>
                </li>
                <li>
                  17 Baleara Street
                  <br />
                  Buddina QLD 4575
                </li>
              </ul>
            </div>
            <div className="ft-col">
              <h4>Details</h4>
              <ul>
                <li>QLD Licence 4684962</li>
                <li>Sunshine Coast, Australia</li>
                <li>
                  <a href="/book-a-free-discovery-call">Book a discovery call</a>
                </li>
                <li>
                  <a href="/privacy-statement-buyers-agent-sunshine-coast">Privacy policy</a>
                </li>
                <li>
                  <a href="/terms--conditions">Terms &amp; Conditions</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="ft-bot">
            <span>&copy; 2026 Baxter &amp; Mason Property Buyers Agent</span>
            <span>Licensed buyers agent · QLD 4684962</span>
          </div>
        </div>
      </footer>
      <Script src="/js/main.js?v=60" strategy="afterInteractive" />
    </>
  );
}

/**
 * Tailwind's preflight comes in with the React layout (Website Lab's build writes it into
 * app/globals.css); the hand-written story pages never loaded it. Put back the browser defaults
 * those pages were drawn on, measured element by element against the live pages on 28 Sep 2026:
 * image baseline alignment, the nav buttons' normal line height, the burger's default type,
 * bold h3/h4 (story FAQs, footer column titles), and the cover photo's attribute height.
 * Element-level selectors, like preflight's own, so every class rule in styles.css still wins.
 */
const STATIC_PAGE_DEFAULTS = `
img,svg,video,canvas,audio,iframe,embed,object{vertical-align:baseline}
button{line-height:normal;font-size:revert;color:revert}
h3{font-size:1.17em;font-weight:bold}
h4{font-weight:bold}
.article-featured img{height:608px}
`;

export function StoryShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STATIC_PAGE_DEFAULTS }} />
      <StoryHeader />
      {children}
      <StoryFooter />
    </>
  );
}
