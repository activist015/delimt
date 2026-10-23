import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "./logo.svg";
import { captureReferral } from "./profileReferral";

export function Arrow({ down = false }) {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={down ? { transform: "rotate(90deg)" } : undefined}><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function useMarketingPage(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    try { captureReferral(window.localStorage, window.location.search); } catch { /* A private browser may disable storage. */ }
    const frame = window.requestAnimationFrame(() => {
      const target = window.location.hash.slice(1);
      if (target) document.getElementById(target)?.scrollIntoView();
      else window.scrollTo(0, 0);
    });
    return () => { document.title = previousTitle; window.cancelAnimationFrame(frame); };
  }, [title]);
}

export function MarketingHeader({ page = "home" }) {
  return <header className="mk-header mk-container">
    <Link className="mk-brand" to="/" aria-label="Delimt home"><img src={logo} alt="delimt" width="120" height="40" /></Link>
    <nav className="mk-main-nav" aria-label="Main navigation">
      {page === "home" ? <><a href="#how-it-works">How it works</a><a href="#android">Android</a><a href="#faq">FAQ</a></> : <><Link to="/">Home</Link>{page === "download" ? <a href="#setup">Installation guide</a> : <Link to="/download">Android download</Link>}</>}
      <Link to="/pricing" aria-current={page === "pricing" ? "page" : undefined}>Pricing</Link>
    </nav>
    <Link className="mk-open-app" to="/app">Open web app <Arrow /></Link>
  </header>;
}

export function MarketingFooter() {
  return <footer className="mk-footer mk-container">
    <Link className="mk-brand" to="/" aria-label="Delimt home"><img src={logo} alt="delimt" width="120" height="40" /></Link>
    <nav aria-label="Footer navigation"><Link to="/download">Android</Link><Link to="/pricing">Pricing</Link><Link to="/blog">Blog</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href="mailto:hello@delimt.com">Contact</a></nav>
    <span>© 2026 delimt</span>
  </footer>;
}

const examples = [
  { habit: "Scrolling", app: "Instagram", reason: "More creating. Less scrolling.", icon: "camera" },
  { habit: "Shopping", app: "Jumia", reason: "I want to keep money for what matters.", icon: "bag" },
];

export function PauseDemo() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];

  return <figure className="mk-demo mk-enter">
    <div className="mk-phone" aria-label={`Example pause screen for ${example.app}`}>
      <div className="mk-phone-camera" aria-hidden="true" />
      <div className="mk-phone-screen">
        <div className="mk-phone-status" aria-hidden="true"><span>9:30</span><span>▴ ▰ ▰</span></div>
        <img className="mk-phone-logo" src={logo} alt="delimt" width="120" height="40" />
        <div className="mk-demo-app"><span className="mk-demo-app-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{example.icon === "camera" ? <><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r=".6" /></> : <><path d="M6 7h12l1 13H5L6 7Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2m-6 3a3 3 0 0 0 6 0" /></>}</svg></span><span>{example.app}</span></div>
        <p className="mk-phone-eyebrow">A MOMENT TO CHOOSE</p>
        <p className="mk-phone-title">Before you<br />open {example.app}.</p>
        <div className="mk-phone-reason" key={example.app}><span>YOUR REASON</span><p>{example.reason}</p></div>
        <div className="mk-phone-actions" aria-hidden="true"><span>Talk to Delimt <Arrow /></span><span>← Leave {example.app}</span></div>
        <div className="mk-phone-home" aria-hidden="true" />
      </div>
    </div>
    <figcaption>Example pause screen</figcaption>
    <div className="mk-demo-switch" aria-label="Choose an example habit">{examples.map((item, index) => <button type="button" key={item.habit} aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.habit}</button>)}</div>
  </figure>;
}
