import Script from 'next/script';

const socialSvg = {
  linkedin:
    'M5 4.5A2.5 2.5 0 1 1 5 9.5 2.5 2.5 0 0 1 5 4.5ZM4 10.5h2v10H4v-10Zm6 0h1.9v1.4h.1c.3-.5 1-.9 2.1-.9 2.2 0 2.6 1.4 2.6 3.3v6.2H14v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.6H8v-10Z',
  facebook:
    'M14 8.5h2.5l-.4 3H14v8.5h-3.5V11.5H9V8.5h1.5V6.8c0-2.4 1.4-3.8 3.7-3.8.7 0 1.4.1 2.1.2v2.7h-1.5c-.9 0-1.1.4-1.1 1.1v1.7Z',
  instagram:
    'M8 3.5h8A4.5 4.5 0 0 1 20.5 8v8A4.5 4.5 0 0 1 16 20.5H8A4.5 4.5 0 0 1 3.5 16V8A4.5 4.5 0 0 1 8 3.5Zm0 2A2.5 2.5 0 0 0 5.5 8v8A2.5 2.5 0 0 0 8 18.5h8a2.5 2.5 0 0 0 2.5-2.5V8A2.5 2.5 0 0 0 16 5.5H8Zm9.25 1.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5Zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5Z',
  youtube:
    'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18 5 12 5 12 5s-6 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C6 18.9 12 19 12 19s6 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z',
  tiktok:
    'M14.5 4.5c.5 1.8 1.8 3.2 3.5 3.7v3.1a6.8 6.8 0 0 1-3.5-.9v6.6a5.4 5.4 0 1 1-5.4-5.4c.3 0 .6 0 .9.1v3.3a2.2 2.2 0 1 0 1.6 2.1V4.5h2.9Z',
};

export function SiteHeader() {
  return (
    <header className="nav" id="nav">
      <div className="wrap">
        <a className="logo" href="/index.html">
          <img
            className="logo-img logo-img--color"
            src="/images/logos%20and%20sally%20stuff/Baxter-and-Mason-logo-nav.png"
            alt="Baxter & Mason Property Buyers Agent"
          />
          <img
            className="logo-img logo-img--light"
            src="/images/logos%20and%20sally%20stuff/Baxter-and-Mason-logo-nav-light.png"
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
              <a href="/what-we-do.html">What We Do</a>
              <a href="/why-work-with-us.html">Why Work With Us</a>
              <a href="/coaching.html">Coaching</a>
              <a href="/investment.html">Investment</a>
              <a href="/commercial.html">Commercial</a>
              <a href="/empowering-women.html">Empowering Women</a>
              <a href="/our-people.html">Our People</a>
              <a href="/privacy.html">Privacy Policy</a>
              <a href="/terms.html">Terms &amp; Conditions</a>
            </div>
          </div>
          <a className="l" href="/services.html">
            Services
          </a>
          <a className="l" href="/success-stories.html">
            Success Stories
          </a>
          <div className="nav-item has-drop">
            <button className="l drop-toggle" type="button" aria-expanded="false">
              Resources <span className="drop-chevron" />
            </button>
            <div className="drop-menu">
              <a href="/free-guides.html">Free Guides</a>
              <a href="/faq.html">FAQ</a>
              <a href="/blog">Blog</a>
            </div>
          </div>
          <a className="l" href="/contact.html">
            Contact
          </a>
          <a className="btn nav-mobile-cta" href="/contact.html">
            Book a call <span className="ar">→</span>
          </a>
        </nav>
        <a className="btn nav-desktop-cta" href="/contact.html">
          Book a call <span className="ar">→</span>
        </a>
        <button className="burger" id="burger" aria-label="Menu" aria-expanded="false">
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <>
      <section className="final final-rich" id="book">
        <div className="wrap">
          <div className="final-panel rv">
            <div className="final-main">
              <span className="eyebrow">Let&apos;s begin</span>
              <h2 className="display">Have a quiet, honest conversation first.</h2>
              <p className="sub">
                No obligation and no pressure. Just a chance to talk through what you want to buy.
              </p>
              <div className="final-chips">
                <span className="final-chip">Free · 30 min</span>
                <span className="final-chip">No obligation</span>
                <span className="final-chip">Sunshine Coast</span>
              </div>
              <div className="cta-row">
                <a className="btn lg" href="/contact.html">
                  Book a free discovery call <span className="ar">→</span>
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
                className="ft-logo"
                src="/images/logos%20and%20sally%20stuff/B%26M-circle.png"
                alt="Baxter & Mason"
              />
              <p className="blurb">
                A woman-led buyers agency on the Sunshine Coast. We help women buy homes and
                new-build investments with straight talk and a sharp eye for detail.
              </p>
              <div className="socials" aria-label="Follow Baxter and Mason on social media">
                {(
                  [
                    ['linkedin', 'https://www.linkedin.com/company/baxter-mason-property-buyers-agent/', 'LinkedIn'],
                    ['facebook', 'https://www.facebook.com/BaxterandMason', 'Facebook'],
                    ['instagram', 'https://www.instagram.com/baxter_and_mason_property_ba/', 'Instagram'],
                    ['youtube', 'https://www.youtube.com/@BaxterMasonPropertyBuyersAgent', 'YouTube'],
                    ['tiktok', 'https://www.tiktok.com/@baxterandmason', 'TikTok'],
                  ] as const
                ).map(([key, href, label]) => (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d={socialSvg[key]} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            <div className="ft-col">
              <h4>Explore</h4>
              <ul>
                <li>
                  <a href="/what-we-do.html">What We Do</a>
                </li>
                <li>
                  <a href="/our-people.html">Our People</a>
                </li>
                <li>
                  <a href="/services.html">Services</a>
                </li>
                <li>
                  <a href="/success-stories.html">Success Stories</a>
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
                  <a href="/contact.html">Book a call</a>
                </li>
                <li>
                  <a href="/privacy.html">Privacy policy</a>
                </li>
                <li>
                  <a href="/terms.html">Terms &amp; Conditions</a>
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
      <Script src="/js/main.js" strategy="afterInteractive" />
    </>
  );
}

type BlogShellProps = {
  children: React.ReactNode;
  heroTitle?: React.ReactNode;
  heroSub?: string;
  showInsightsHead?: boolean;
};

export function BlogShell({
  children,
  heroTitle = (
    <>
      Property insights &amp; <span className="gi">tips</span>.
    </>
  ),
  heroSub = 'Smarter property decisions for Sunshine Coast buyers.',
  showInsightsHead = true,
}: BlogShellProps) {
  return (
    <>
      <SiteHeader />
      <section
        className="page-hero img-hero"
        style={{ backgroundImage: "url('/images/story-holiday.jpg')" }}
      >
        <div className="grain" />
        <div className="wrap">
          <div className="page-hero-copy">
            <span className="eyebrow rv">Blog</span>
            <h1 className="display rv d1">{heroTitle}</h1>
            {heroSub ? <p className="sub rv d2">{heroSub}</p> : null}
          </div>
        </div>
      </section>

      <section className="blk blog-page">
        <div className="wrap">
          {showInsightsHead ? (
            <div className="head">
              <span className="eyebrow rv">Insights</span>
              <h2 className="rv d1">Sunshine Coast buyers agent blog.</h2>
              <p className="intro rv d2">
                Practical notes on hot properties, competition, and finding a home that fits how you
                live.
              </p>
            </div>
          ) : null}
          <div className="vx-blog-embed rv d1">{children}</div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
