import { useState } from "react";
import { Link } from "react-router-dom";
import { androidSizeLabel, isAndroidReleaseReady } from "./androidRelease";
import androidRelease from "./android-release.json";
import { Arrow, MarketingHeader, MarketingFooter, useMarketingPage } from "./marketing";
import "./marketing.css";
import "./download.css";

export default function Download() {
  const [downloadOpened, setDownloadOpened] = useState(false);
  const ready = isAndroidReleaseReady(androidRelease);

  useMarketingPage("Download Delimt for Android");

  return <div className="mk-page dl-page">
    <a className="dl-skip" href="#download-main">Skip to download</a>
    <MarketingHeader page="download" />

    <main id="download-main">
      <section className="dl-hero" aria-labelledby="download-title">
        <div className="dl-intro">
          <p className="dl-eyebrow"><span /> ANDROID / EARLY ACCESS</p>
          <h1 id="download-title">A pause.<br />Then <em>your choice.</em></h1>
          <p className="dl-lead">Before the scroll, the checkout, the usual excuse. Delimt gives you a moment to remember what matters to you.</p>
          <div className="dl-mobile-download">
            {ready
              ? <a className="dl-button" href={androidRelease.url} onClick={() => setDownloadOpened(true)}>Download APK <Arrow down /></a>
              : <button className="dl-button" disabled>Download is being prepared</button>}
            <p className="dl-file-meta">{ready ? `Version ${androidRelease.version} · ${androidSizeLabel(androidRelease.byteSize)} · APK` : "Android APK · Early access"}</p>
            <p className="dl-download-status" role="status">{downloadOpened ? "Open delimt-android.apk from your downloads, then follow the guide below." : "Install directly on your Android phone."}</p>
            <div className="dl-web-note">On iPhone or desktop? <Link to="/app">Use the web app <Arrow /></Link></div>
          </div>
          <a className="dl-text-link" href="#setup">Get set up in a few minutes <Arrow /></a>
          <div className="dl-capabilities" aria-label="What you can do">
            <p><span>01</span> Pause the apps you choose.</p>
            <p><span>02</span> Talk through the urge with AI.</p>
            <p><span>03</span> See your wins and progress.</p>
          </div>
        </div>

        <aside className="dl-download" aria-label="Android APK download">
          <div className="dl-download-top">
            <img src="/favicon.svg" className="dl-app-icon" alt="" />
            <div><h2>Delimt for Android</h2><p>Your habits. Your boundaries.</p></div>
          </div>
          <div className="dl-pause" aria-hidden="true"><span /><span /></div>
          <p className="dl-download-copy">Take a little space<br />between the urge<br />and the next tap.</p>
          {ready
            ? <a className="dl-button" href={androidRelease.url} onClick={() => setDownloadOpened(true)}>Download APK <Arrow down /></a>
            : <button className="dl-button" disabled>Download is being prepared</button>}
          <p className="dl-file-meta">{ready ? `Version ${androidRelease.version} · ${androidSizeLabel(androidRelease.byteSize)} · APK` : "Android APK · Early access"}</p>
          <p className="dl-download-status" role="status">{downloadOpened ? "Open delimt-android.apk from your downloads, then follow the guide below." : "Install directly on your Android phone."}</p>
          <div className="dl-web-note">On iPhone or desktop? <Link to="/app">Use the web app <Arrow /></Link><small>App blocking is available in the Android app.</small></div>
        </aside>
      </section>

      <section className="dl-setup" id="setup" aria-labelledby="setup-title">
        <div className="dl-section-intro"><p className="dl-eyebrow">MAKE IT YOURS</p><h2 id="setup-title">Download. Set a boundary.<br />Give yourself a moment.</h2><p>The same Delimt account works on the web and in the Android app.</p></div>
        <ol className="dl-steps">
          <li><span className="dl-step-number">01</span><div><h3>Install the APK</h3><p>Download the file above and open <strong>delimt-android.apk</strong>. If Android asks, allow the browser you used to install this app. You can turn that permission off after installation.</p></div></li>
          <li><span className="dl-step-number">02</span><div><h3>Sign in and choose a habit</h3><p>Use your Delimt account or create one. Add a habit and your own reason for changing it.</p></div></li>
          <li><span className="dl-step-number">03</span><div><h3>Turn on app protection</h3><p>In Delimt, open <strong>Apps → Set up app protection</strong>. In Android Accessibility settings, find <strong>Delimt app protection</strong> under installed or downloaded apps and turn it on. Labels can vary by phone.</p>
            <details><summary>Android says “Restricted setting”</summary><p>Only allow this access if you trust Delimt. Open <strong>Settings → Apps → Delimt → ⋮ → Allow restricted settings</strong>, then return to Accessibility to enable protection.</p><a href="https://support.google.com/android/answer/12623953" target="_blank" rel="noreferrer">Read Android’s instructions <Arrow /></a></details>
          </div></li>
          <li><span className="dl-step-number">04</span><div><h3>Choose which apps to pause</h3><p>Return to Delimt and connect an app to your habit. Open that app to try the pause screen. You can review or turn off protection in your settings.</p></div></li>
        </ol>
      </section>

      <section className="dl-permissions" aria-labelledby="permission-title">
        <p className="dl-eyebrow">YOU STAY IN CONTROL</p>
        <h2 id="permission-title">A boundary you choose.</h2>
        <p>Delimt uses Android Accessibility to recognise the apps you select and show the pause screen. You can turn this permission off in Android settings. AI conversations need an internet connection.</p>
        <Link to="/privacy">Read our privacy policy <Arrow /></Link>
      </section>

      {ready && <details className="dl-file-details"><summary>Download details and file checksum</summary><dl><dt>Version</dt><dd>{androidRelease.version} {androidRelease.versionCode ? `(build ${androidRelease.versionCode})` : ""}</dd><dt>File size</dt><dd>{androidSizeLabel(androidRelease.byteSize)}</dd><dt>SHA-256</dt><dd className="dl-checksum">{androidRelease.sha256}</dd></dl><p>The checksum identifies this exact APK file.</p></details>}
    </main>

    <MarketingFooter />
  </div>;
}
