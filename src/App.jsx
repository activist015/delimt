import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { useAuth } from "./AuthContext";
import logo from "./logo.svg";
import { getFoundingCount } from "./referral";
import { supabase } from "./supabase";

const HABITS = ["Doom Scrolling", "Impulse Buying", "Texting Your Ex", "Late Night Snacking", "Procrastinating"];
const FOUNDING_LIMIT = 50;

export default function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeHabit, setActiveHabit] = useState(0);
  const [foundingCount, setFoundingCount] = useState(0);
  const [hoveredHabit, setHoveredHabit] = useState(null);
  const [payEmail, setPayEmail] = useState("");
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);

  // Capture referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("delimt_ref", ref);
  }, []);

  // Redirect logged-in users to app
  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  // Cycle habits
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHabit((i) => (i + 1) % HABITS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Load founding count
  useEffect(() => {
    getFoundingCount().then(setFoundingCount);
  }, []);

  const spotsLeft = Math.max(0, FOUNDING_LIMIT - foundingCount);

  const flwConfig = {
    public_key: import.meta.env.VITE_FLW_PUBLIC_KEY,
    tx_ref: `delimt-${Date.now()}`,
    amount: 49,
    currency: "USD",
    payment_options: "card",
    customer: { email: payEmail, name: "delimt Founding Member" },
    customizations: {
      title: "delimt Founding Member",
      description: "Lifetime access — 50 spots only",
      logo: "https://delimt.com/favicon.svg",
    },
  };

  const handleFlutterPayment = useFlutterwave(flwConfig);

  const handleFoundingPay = () => {
    if (!payEmail.includes("@")) { setPayError("Enter a valid email"); return; }
    setPayError("");
    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();
        if (response.status === "successful") {
          await supabase.from("waitlist").insert({
            email: payEmail,
            referral_code: payEmail.split("@")[0] + Math.random().toString(36).slice(2, 6),
            tier: "founding",
            position: 0,
          }).catch(() => {});
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: payEmail, type: "founding" }),
          });
          setPaySuccess(true);
          setFoundingCount((c) => c + 1);
        }
      },
      onClose: () => {},
    });
  };

  // Show nothing while checking auth
  if (loading) return (
    <div style={{ background: "#080808", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF3333", fontFamily: "monospace", fontSize: 12, letterSpacing: "4px" }}>
      LOADING...
    </div>
  );

  // Don't render landing if logged in (redirect happening)
  if (user) return null;

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <div style={s.glow} />

      {/* NAV */}
      <nav style={s.nav} className="landing-nav">
        <img src={logo} alt="delimt" style={{ height: 36 }} />
        <div style={s.navRight}>
          <Link to="/blog" style={s.navLink} className="landing-nav-optional">Blog</Link>
          <Link to="/auth" style={s.navLink}>Sign in</Link>
          <Link to="/download" style={s.navCta}>Get the Android app →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.pill}>The AI that fights you for your own good</div>
        <h1 style={s.h1}>
          Stop <span style={s.red}>{HABITS[activeHabit]}</span><br />
          <span style={s.dim}>before it stops you.</span>
        </h1>
        <p style={s.sub}>
          Pause the apps you choose. Talk through the urge with AI, remember
          your reason, and give yourself a moment to choose differently.
        </p>
        <div style={s.heroCtas}>
          <Link to="/download" style={s.btnPrimary}>Download for Android ↓</Link>
          <Link to="/app" style={s.btnSecondary}>Use the web app</Link>
        </div>
        <p style={s.hint}>Android APK available now · iPhone and desktop can use the web app</p>
      </section>

      {/* HOW IT WORKS */}
      <section style={s.section}>
        <div style={s.sectionLabel}>HOW IT WORKS</div>
        <div style={s.steps}>
          {[
            { n: "01", title: "Choose a habit and your reason", desc: "Tell Delimt what you want to change and what you want to make room for." },
            { n: "02", title: "Set a boundary on Android", desc: "Choose the apps you want to pause and enable app protection. Delimt steps in when you open one." },
            { n: "03", title: "Take a moment to choose", desc: "See your reason, talk through the urge with AI, and log how it went. You can also start a conversation yourself." },
          ].map((step) => (
            <div key={step.n} style={s.step}>
              <div style={s.stepNum}>{step.n}</div>
              <div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HABITS */}
      <section style={s.section}>
        <div style={s.sectionLabel}>WHAT DELIMT FIGHTS</div>
        <div style={s.habits}>
          {[
            "Doom Scrolling", "Impulse Buying",
            "Texting Your Ex", "Late Night Snacking",
            "Procrastinating", "More coming...",
          ].map((label) => (
            <div
              key={label}
              style={{
                ...s.habitCard,
                borderColor: hoveredHabit === label ? "#FF3333" : "#1a1a1a",
                background: hoveredHabit === label ? "#160a0a" : "#0f0f0f",
              }}
              onMouseEnter={() => setHoveredHabit(label)}
              onMouseLeave={() => setHoveredHabit(null)}
            >
              <span style={s.habitLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ANDROID DOWNLOAD */}
      <section style={s.section}>
        <div style={s.sectionLabel}>DELIMT, WITH YOU</div>
        <div style={s.installGrid}>
          <div style={s.installCard}>
            <div style={s.installTitle}>The Android app</div>
            <div style={s.installSteps}>
              Download the APK, sign in, and choose which apps to pause. The installation guide walks you through app protection.
            </div>
            <Link to="/download" style={{ ...s.navLink, color: "#f0f0e8", display: "inline-block", marginTop: 18 }}>Download & installation guide →</Link>
          </div>
          <div style={s.installCard}>
            <div style={s.installTitle}>iPhone and desktop</div>
            <div style={s.installSteps}>
              Use Delimt in your browser for conversations, habits, and history. App blocking is available in the Android app.
            </div>
            <Link to="/app" style={{ ...s.navLink, color: "#f0f0e8", display: "inline-block", marginTop: 18 }}>Open the web app →</Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={s.section}>
        <div style={s.sectionLabel}>PRICING</div>
        <div style={s.pricing}>
          {/* Free */}
          <div style={s.priceCard}>
            <div style={s.planName}>Free</div>
            <div style={s.planPrice}>$0<span style={s.planPer}>/mo</span></div>
            <div style={s.planPerks}>
              {["3 interventions/day", "2 habits", "Basic AI pushback", "Streaks & history"].map((p) => (
                <div key={p} style={s.planPerk}>✓ {p}</div>
              ))}
            </div>
            <Link to="/download" style={{ ...s.btnFounding, marginTop: 16, display: "block", textAlign: "center", textDecoration: "none" }}>
              Get started free →
            </Link>
          </div>

          {/* Pro */}
          <div style={{ ...s.priceCard, borderColor: "#FF333355" }}>
            <div style={s.planBadge}>MOST POPULAR</div>
            <div style={s.planName}>Pro</div>
            <div style={s.planPrice}>$9<span style={s.planPer}>/mo</span></div>
            <div style={s.planPerks}>
              {["Unlimited interventions", "Unlimited habits", "Deep psychology profile", "Chrome Extension (soon)", "Priority support"].map((p) => (
                <div key={p} style={s.planPerk}>✓ {p}</div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: "#555", letterSpacing: "1px" }}>
              Coming soon
            </div>
          </div>

          {/* Founding */}
          <div style={{ ...s.priceCard, borderColor: "#FF3333", background: "#0f0505" }}>
            <div style={{ ...s.planBadge, background: "#FF3333" }}>
              🔥 {spotsLeft} SPOTS LEFT
            </div>
            <div style={s.planName}>Founding Member</div>
            <div style={s.planPrice}>$49<span style={s.planPer}> once</span></div>
            <div style={s.planPerks}>
              {["Everything in Pro, forever", "Lifetime access", "Shape the product", "Founding badge", "30-day refund guarantee"].map((p) => (
                <div key={p} style={s.planPerk}>✓ {p}</div>
              ))}
            </div>
            {!paySuccess ? (
              spotsLeft > 0 ? (
                <div style={{ marginTop: 16 }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={payEmail}
                    onChange={(e) => { setPayEmail(e.target.value); setPayError(""); }}
                    style={s.payInput}
                  />
                  {payError && <div style={s.payError}>{payError}</div>}
                  <button onClick={handleFoundingPay} style={s.btnFounding}>
                    Claim Your Spot →
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 16, fontSize: 12, color: "#666" }}>
                  All spots claimed
                </div>
              )
            ) : (
              <div style={s.paySuccess}>
                ✓ You're a Founding Member. Check your email.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section style={s.quoteSection}>
        <div style={s.quote}>
          "I didn't need another app that tracks my screen time.<br />
          I needed something that <span style={s.red}>actually fights back.</span>"
        </div>
        <div style={s.quoteAuthor}>— What our first users are saying</div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerTop}>
          <img src={logo} alt="delimt" style={{ height: 28, opacity: 0.6 }} />
          <div style={s.footerLinks}>
            <Link to="/download" style={s.footerLink}>Android download</Link>
            <Link to="/blog" style={s.footerLink}>Blog</Link>
            <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
            <Link to="/terms" style={s.footerLink}>Terms of Service</Link>
            <a href="https://x.com/DelimtLabs" target="_blank" rel="noreferrer" style={s.footerLink}>
              X / Twitter
            </a>
          </div>
        </div>
        <span style={s.footerText}>
          © 2026 delimt · Built to fight your worst habits
        </span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; }
        @media (max-width:600px) {
          .landing-nav { padding:18px 20px!important; }
          .landing-nav img { height:28px!important; }
          .landing-nav>div { gap:12px!important; }
          .landing-nav a { font-size:11px!important; letter-spacing:0!important; }
          .landing-nav-optional { display:none; }
        }
      `}</style>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#080808", color: "#e8e8e0", fontFamily: "'DM Mono','Courier New',monospace", position: "relative", overflowX: "hidden" },
  grid: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,51,51,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,51,51,0.03) 1px,transparent 1px)", backgroundSize: "44px 44px" },
  glow: { position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 700, height: 400, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse,rgba(255,51,51,0.10) 0%,transparent 70%)" },
  nav: { position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #141414" },
  navRight: { display: "flex", alignItems: "center", gap: 20 },
  navLink: { fontSize: 13, color: "#888", textDecoration: "none", letterSpacing: "1px" },
  navCta: { fontSize: 13, color: "#fff", background: "#FF3333", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700, letterSpacing: "1px" },
  hero: { position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" },
  pill: { display: "inline-block", fontSize: 11, letterSpacing: "3px", color: "#888", textTransform: "uppercase", border: "1px solid #222", borderRadius: 20, padding: "6px 16px", marginBottom: 28 },
  h1: { fontSize: "clamp(32px,7vw,64px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: "-1px", minHeight: "2.5em" },
  red: { color: "#FF3333" },
  dim: { color: "#a0a69b" },
  sub: { fontSize: 16, color: "#a0a69b", lineHeight: 1.8, maxWidth: 520, margin: "0 auto 40px" },
  heroCtas: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 },
  btnPrimary: { padding: "16px 32px", background: "#FF3333", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 700, letterSpacing: "1px" },
  btnSecondary: { padding: "16px 32px", background: "transparent", border: "1px solid #333", color: "#aaa", borderRadius: 8, textDecoration: "none", fontSize: 14, letterSpacing: "1px" },
  hint: { fontSize: 12, color: "#a0a69b", letterSpacing: "1px" },
  section: { position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "60px 24px", borderTop: "1px solid #111" },
  sectionLabel: { fontSize: 10, letterSpacing: "4px", color: "#FF3333", textTransform: "uppercase", marginBottom: 32 },
  steps: { display: "flex", flexDirection: "column", gap: 28 },
  step: { display: "flex", gap: 24, alignItems: "flex-start" },
  stepNum: { fontSize: 11, color: "#FF3333", letterSpacing: "2px", minWidth: 32, paddingTop: 2 },
  stepTitle: { fontSize: 17, fontWeight: 700, marginBottom: 6 },
  stepDesc: { fontSize: 14, color: "#a0a69b", lineHeight: 1.7 },
  habits: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 },
  habitCard: { padding: "20px 18px", borderRadius: 10, border: "1px solid #1a1a1a", background: "#0f0f0f", display: "flex", alignItems: "center", transition: "all 0.2s" },
  habitLabel: { fontSize: 13, fontWeight: 600 },
  installGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 16 },
  installCard: { background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12, padding: 24 },
  installTitle: { fontSize: 15, fontWeight: 700, marginBottom: 10 },
  installSteps: { fontSize: 13, color: "#a0a69b", lineHeight: 1.8 },
  pricing: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 },
  priceCard: { background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12, padding: 24, position: "relative" },
  planBadge: { fontSize: 10, letterSpacing: "2px", color: "#FF3333", background: "#1a0505", borderRadius: 4, padding: "3px 8px", display: "inline-block", marginBottom: 12 },
  planName: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  planPrice: { fontSize: 36, fontWeight: 900, color: "#FF3333", marginBottom: 20 },
  planPer: { fontSize: 14, color: "#666" },
  planPerks: { display: "flex", flexDirection: "column", gap: 10 },
  planPerk: { fontSize: 13, color: "#888" },
  btnFounding: { width: "100%", padding: "14px", background: "#FF3333", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace", letterSpacing: "1px" },
  payInput: { width: "100%", padding: "12px 14px", background: "#0a0a0a", border: "1px solid #222", borderRadius: 8, color: "#e8e8e0", fontSize: 13, fontFamily: "'DM Mono',monospace", outline: "none", marginBottom: 10 },
  payError: { color: "#FF6666", fontSize: 12, marginBottom: 8 },
  paySuccess: { marginTop: 16, color: "#4CAF50", fontSize: 12, textAlign: "center", lineHeight: 1.6 },
  quoteSection: { position: "relative", zIndex: 1, textAlign: "center", padding: "60px 24px", borderTop: "1px solid #111" },
  quote: { fontSize: "clamp(16px,3vw,24px)", lineHeight: 1.6, color: "#ccc", maxWidth: 600, margin: "0 auto 16px", fontStyle: "italic" },
  quoteAuthor: { fontSize: 12, color: "#444", letterSpacing: "2px" },
  footer: { position: "relative", zIndex: 1, borderTop: "1px solid #111", padding: "24px 40px", display: "flex", flexDirection: "column", gap: 16 },
  footerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  footerLinks: { display: "flex", gap: 20, flexWrap: "wrap" },
  footerLink: { fontSize: 12, color: "#555", textDecoration: "none", letterSpacing: "1px" },
  footerText: { fontSize: 12, color: "#333", letterSpacing: "1px" },
};
