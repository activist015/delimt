import { Link, Navigate } from "react-router-dom";
import { Arrow, MarketingHeader, MarketingFooter, PauseDemo, useMarketingPage } from "./marketing";
import "./marketing.css";

const steps = [
  ["01", "Choose your habit", "Add your own reason for changing it. Something you want to make room for."],
  ["02", "Set your boundaries", "Choose the Android apps you want to pause and turn on app protection."],
  ["03", "Make your next choice", "See your reason, talk through the urge, and log how it went."],
];

export default function App() {
  useMarketingPage("Delimt · A pause before the autopilot.");

  if (window.location.hash === "#pricing") return <Navigate to={`/pricing${window.location.search}`} replace />;

  return <div className="mk-page">
    <a className="mk-skip" href="#main">Skip to content</a>
    <MarketingHeader />
    <main id="main">
      <section className="mk-hero mk-container" aria-labelledby="hero-title">
        <div className="mk-hero-copy mk-enter">
          <p className="mk-eyebrow"><span className="mk-dot" /> ANDROID / EARLY ACCESS</p>
          <h1 id="hero-title">A <span>pause</span> before<br className="mk-desktop-break" /> the autopilot.</h1>
          <p className="mk-lead">Pause the apps you choose. Talk through the urge. Make room for what matters.</p>
          <div className="mk-hero-actions">
            <Link className="mk-button" to="/download">Download for Android <Arrow down /></Link>
            <Link className="mk-text-link" to="/app">Try the web app <Arrow /></Link>
          </div>
          <p className="mk-caption">Android APK · Early access</p>
        </div>
        <PauseDemo />
      </section>

      <div className="mk-feature-strip mk-container" aria-label="Delimt features">
        <span>App pauses</span><i aria-hidden="true" /><span>AI conversations</span><i aria-hidden="true" /><span>Personal reasons</span><i aria-hidden="true" /><span>Progress history</span>
      </div>

      <section className="mk-how mk-container" id="how-it-works" aria-labelledby="how-title">
        <p className="mk-eyebrow">HOW IT WORKS</p>
        <h2 id="how-title">Small pause. Different choice.</h2>
        <ol className="mk-steps">
          {steps.map(([number, title, description]) => <li key={number}>
            <span className="mk-step-number">{number}</span>
            <div><h3>{title}</h3><p>{description}</p></div>
          </li>)}
        </ol>
      </section>

      <section className="mk-reason mk-container" aria-labelledby="reason-title">
        <div className="mk-conversation-example" aria-label="Example of a personal reason and an AI message">
          <div className="mk-example-reason"><p className="mk-eyebrow">YOUR REASON</p><p>More creating.<br />Less scrolling.</p></div>
          <div className="mk-example-message"><span className="mk-small-mark" aria-hidden="true">D<span>•</span></span><p>What could you do for yourself instead, right now?</p></div>
          <span className="mk-example-label">Example conversation</span>
        </div>
        <div className="mk-reason-copy">
          <p className="mk-eyebrow">SOMETHING TO COME BACK TO</p>
          <h2 id="reason-title">Your reason.<br />Right when you need it.</h2>
          <p>A short conversation to interrupt a familiar pattern. Each habit has its own reason, in your words.</p>
          <p className="mk-control-note">You stay in control.</p>
          <Link className="mk-text-link" to="/download#setup">See how to set it up <Arrow /></Link>
        </div>
      </section>

      <section className="mk-platform mk-container" id="android" aria-labelledby="android-title">
        <div><p className="mk-eyebrow">DELIMT, WITH YOU</p><h2 id="android-title">On your phone.<br />At the moment it matters.</h2></div>
        <div className="mk-platform-options">
          <div><span className="mk-platform-label">ANDROID</span><h3>A pause before the app opens.</h3><p>Choose which apps to pause. The download guide walks you through installation and app protection.</p><Link className="mk-text-link" to="/download">Get the Android app <Arrow /></Link></div>
          <div><span className="mk-platform-label">IPHONE & DESKTOP</span><h3>A conversation, wherever you are.</h3><p>Use the web app for your habits, AI conversations, and history. App blocking is available on Android.</p><Link className="mk-text-link" to="/app">Open the web app <Arrow /></Link></div>
        </div>
      </section>

      <section className="mk-faq mk-container" id="faq" aria-labelledby="faq-title">
        <div className="mk-faq-intro"><p className="mk-eyebrow">A FEW THINGS TO KNOW</p><h2 id="faq-title">Before you begin.</h2></div>
        <div className="mk-faq-items">
          <details><summary>Does it work on iPhone?<span className="mk-plus" aria-hidden="true" /></summary><p>You can use Delimt in your browser on iPhone for habits, AI conversations, and history. Pausing other apps is available in the Android APK.</p></details>
          <details><summary>Why does Delimt need Accessibility?<span className="mk-plus" aria-hidden="true" /></summary><p>Android Accessibility lets Delimt recognise when an app you selected opens and show the pause screen. You choose the apps and enable the permission yourself. <Link to="/download#setup">Read the setup guide.</Link></p></details>
          <details><summary>Can I turn protection off?<span className="mk-plus" aria-hidden="true" /></summary><p>Yes. You can change your selected apps in Delimt or turn off Delimt app protection in Android Accessibility settings.</p></details>
          <details><summary>Does the AI need internet?<span className="mk-plus" aria-hidden="true" /></summary><p>Yes, AI conversations need an internet connection. Your account lets you access your habits and history in the app and on the web.</p></details>
        </div>
      </section>

      <section className="mk-final mk-container" aria-labelledby="final-title"><p className="mk-eyebrow">ONE MOMENT IS A START</p><h2 id="final-title">Make your next tap intentional.</h2><Link className="mk-button" to="/download">Download for Android <Arrow down /></Link><p className="mk-caption">Your habits. Your boundaries. Your choice.</p></section>
    </main>
    <MarketingFooter />
  </div>;
}
