"use client";

import Script from "next/script";
import { FormEvent, useEffect, useState } from "react";

const ENDPOINT =
  "https://iipazmwbtctblpyszspb.supabase.co/functions/v1/headless-form-submit/hli_2aa0483e69264a02a84aefdeafcb7e08";
const VIDEO_URL = "https://player.vimeo.com/video/1090722248?h=6293b704d4&title=0&byline=0&portrait=0";

function AccessForm({ close }: { close: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setSubmitting(true);
    setError("");
    const data = new FormData(form);
    const fields = Object.fromEntries(data.entries());
    fields.aNDZhRbsS5X79lSyZGvw_1 = data.has("aNDZhRbsS5X79lSyZGvw_1") ? "Yes" : "No";
    fields.aNDZhRbsS5X79lSyZGvw_2 = data.has("aNDZhRbsS5X79lSyZGvw_2") ? "Yes" : "No";

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields,
          attribution: { pageUrl: window.location.href, referrer: document.referrer || null },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || result.error || "Submission failed");
      }
      window.location.assign("/video-page-2417-2491");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not submit your details. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="if-modal" role="dialog" aria-modal="true" aria-labelledby="if-form-title">
      <button className="if-modal-backdrop" type="button" onClick={close} aria-label="Close access form" />
      <div className="if-modal-card">
        <button className="if-modal-close" type="button" onClick={close} aria-label="Close access form">×</button>
        <img className="if-modal-photo" src="/images/interview-funnel/sally-orange.jpeg" alt="Sally Blyth" />
        <h2 id="if-form-title">The 3 deadly mistakes buyers make when purchasing property</h2>
        <p className="if-modal-intro">Enter your details below for instant access.</p>
        <form className="if-access-form" onSubmit={submit}>
          <div className="if-fields-two">
            <label>First name<input name="first_name" autoComplete="given-name" /></label>
            <label>Last name<input name="last_name" autoComplete="family-name" /></label>
          </div>
          <label>Phone<input name="phone" type="tel" autoComplete="tel" /></label>
          <label>Email <span aria-hidden="true">*</span><input name="email" type="email" autoComplete="email" required /></label>
          <input className="if-honeypot" name="vx_company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <label className="if-check">
            <input name="aNDZhRbsS5X79lSyZGvw_1" type="checkbox" />
            <span>I consent to receive SMS notifications and alerts from Baxter &amp; Mason Property Buyers Agency. Message frequency varies. Message &amp; data rates may apply. Reply STOP to unsubscribe or HELP for help or inquiries.</span>
          </label>
          <label className="if-check">
            <input name="aNDZhRbsS5X79lSyZGvw_2" type="checkbox" />
            <span>By checking this box, I agree to receive occasional automated marketing messages from Baxter &amp; Mason Property Buyers Agency.</span>
          </label>
          {error ? <p className="if-form-error" role="alert">{error}</p> : null}
          <button className="if-submit" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "YES! Give me full access NOW!"}
          </button>
          <p className="if-legal"><a href="/privacy-statement-buyers-agent-sunshine-coast">Privacy Statement</a> · <a href="/terms--conditions">Terms &amp; Conditions</a></p>
        </form>
      </div>
    </div>
  );
}

export function InterviewLanding() {
  const [formOpen, setFormOpen] = useState(false);
  useEffect(() => {
    if (!formOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setFormOpen(false); };
    document.body.classList.add("if-modal-open");
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("if-modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [formOpen]);

  return (
    <main className="if-page if-landing">
      <link rel="stylesheet" href="/css/interview-funnel.css?v=1" />
      <link rel="stylesheet" href="/css/interview-funnel-font-fix.css?v=1" />
      <section className="if-topbar">▶ FREE 43-MINUTE VIDEO REPORT<br /><span>Claim your FREE Pass Now!</span></section>
      <section className="if-hero">
        <div className="if-hero-shade" />
        <div className="if-hero-copy">
          <h1>REVEALED!</h1>
          <h2>The <em>3 Deadly Mistakes</em> buyers make<br />when <em>Purchasing Property</em></h2>
          <p>That keep them searching and<br /><em>missing out on their DREAM HOME!</em></p>
          <button className="if-cta" type="button" onClick={() => setFormOpen(true)}>
            <strong>GRAB YOUR PASS NOW</strong><span>Click HERE for this video report</span>
          </button>
        </div>
      </section>
      <section className="if-story">
        <div>
          <h2>IT&apos;S TRUE!</h2>
          <p><strong><em>I&apos;m Sally Blyth from Baxter and Mason and here&apos;s the cold hard truth:</em></strong></p>
          <p>Buying property isn&apos;t what it used to be.</p>
          <p>The old ways of searching, hoping, and waiting for the perfect house? They&apos;re dead—and they&apos;re costing you time, money, and opportunities.</p>
          <p>I&apos;ve seen buyers lose their dream homes—and their minds—because they didn&apos;t know what I know.</p>
          <p>After 20+ years of experience, hundreds of deals, and learning every hidden pitfall in the market, I&apos;m lifting the lid.</p>
          <p>In just 43 minutes, I&apos;ll show you the 3 critical mistakes that are keeping you locked out of the market—and exactly how to avoid them.</p>
          <p>Click below to watch it now—before another opportunity passes you by.</p>
        </div>
        <div className="if-story-side">
          <img src="/images/interview-funnel/sally-orange.jpeg" alt="Sally Blyth, Baxter & Mason Property Buyers Agent" />
          <button className="if-cta if-cta-small" type="button" onClick={() => setFormOpen(true)}>
            <strong>GRAB YOUR PASS NOW</strong><span>Click here for this video report</span>
          </button>
        </div>
      </section>
      <footer className="if-footer">This website is not affiliated with, endorsed, authorized, or sponsored by Facebook.<br />This page is a standalone page created to provide information and is not officially associated with Facebook.</footer>
      {formOpen ? <AccessForm close={() => setFormOpen(false)} /> : null}
    </main>
  );
}

function Countdown() {
  const [remaining, setRemaining] = useState(24 * 60 * 60 - 1);
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const hours = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  return <div className="if-countdown"><span><strong>{hours}</strong>hours</span><span><strong>{minutes}</strong>minutes</span><span><strong>{seconds}</strong>seconds</span></div>;
}

export function InterviewVideo({ compact = false }: { compact?: boolean }) {
  return (
    <main className={`if-page if-video-page${compact ? " if-special" : ""}`}>
      <link rel="stylesheet" href="/css/interview-funnel.css?v=1" />
      <link rel="stylesheet" href="/css/interview-funnel-font-fix.css?v=1" />
      <Script src="/js/main.js?v=57" strategy="afterInteractive" />
      <div className="if-video-shell">
        <div className="if-video-banner">
          {compact ? "▶ Break Free From Your HABITS to Transform Your Life ◀" : <><strong>▶ 43-MINUTE VIDEO REPORT:</strong><br />🏡 Don&apos;t get stuck house-hunting forever! The secrets to buying smarter are in this video.</>}
        </div>
        <div className="if-video-grid">
          <div className="if-video-frame"><iframe src={VIDEO_URL} title="The 3 deadly property-buying mistakes — Sally Blyth" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /></div>
          {!compact ? <aside className="if-presenter">
            <img src="/images/interview-funnel/sally-white.jpeg" alt="Sally Blyth" />
            <h2>Presented by – Sally Blyth</h2>
            <ul><li>Extensive real estate experience</li><li>Champion for single women in property</li><li>Founder of Baxter &amp; Mason Property Buyers Agent</li></ul>
            <h3>Access to this private case study ends in</h3>
            <Countdown />
            <p><strong>IMPORTANT:</strong><br />Keep this page open if you want to finish the case study in this session.</p>
          </aside> : null}
        </div>
        <div className="if-video-bottom">
          <h1>{compact ? "If this is you and you want to do something about it, join me on a free strategy call." : "🏡 Feel like the perfect home is always just out of reach? I’ll help you see what’s holding you back—and how to beat the market."}</h1>
          <a className="if-book-cta js-book-call" href="/book-a-free-discovery-call">{compact ? "YES! I’d love to have a strategy call →" : "YES! Sally, I Want To Find Out More →"}</a>
        </div>
      </div>
    </main>
  );
}
