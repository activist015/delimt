import { Link } from "react-router-dom";
import logo from "./logo.svg";

export default function Privacy() {
  return (
    <div style={s.root}>
      <div style={s.grid} />
      <nav style={s.nav}>
        <Link to="/"><img src={logo} alt="delimt" style={{ height: 36 }} /></Link>
        <Link to="/" style={s.navBack}>← Back</Link>
      </nav>
      <div style={s.container}>
        <div style={s.label}>LEGAL</div>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.updated}>Last updated: June 2026</p>

        <p style={s.p}>
          delimt ("we", "our", "us") respects your privacy. This policy explains
          what data we collect, how we use it, and your rights.
        </p>

        <h2 style={s.h2}>What We Collect</h2>
        <p style={s.p}>
          When you create an account, we collect your email address and any
          name you provide. When you set up habits, we store the habit name,
          your stated reasons for wanting to stop, and your usual excuses —
          this information is used solely to personalize your AI interventions.
        </p>
        <p style={s.p}>
          We log intervention conversations and outcomes (resisted / gave in)
          to power your streak tracking and history.
        </p>

        <h2 style={s.h2}>How We Use Your Data</h2>
        <p style={s.p}>
          Your data is used exclusively to operate delimt: personalizing AI
          responses, tracking streaks, sending you product emails (welcome
          sequence, updates), and improving the product based on aggregated,
          anonymized usage patterns.
        </p>
        <p style={s.p}>
          We do not sell your data. We do not share your personal habit
          information with third parties for advertising purposes.
        </p>

        <h2 style={s.h2}>Third-Party Services</h2>
        <p style={s.p}>
          delimt uses the following third-party services to operate:
        </p>
        <ul style={s.ul}>
          <li style={s.li}>Supabase — database and authentication</li>
          <li style={s.li}>Groq — AI model processing for interventions</li>
          <li style={s.li}>Resend — transactional email delivery</li>
          <li style={s.li}>Flutterwave — payment processing</li>
          <li style={s.li}>Vercel — hosting and analytics</li>
        </ul>
        <p style={s.p}>
          Each of these providers has their own privacy policy governing how
          they process data on our behalf.
        </p>

        <h2 style={s.h2}>Data Retention</h2>
        <p style={s.p}>
          Your data is retained as long as your account is active. You may
          request deletion of your account and all associated data at any
          time by contacting us.
        </p>

        <h2 style={s.h2}>Your Rights</h2>
        <p style={s.p}>
          You can access, correct, or delete your personal information at any
          time through the Settings page, or by emailing us directly.
        </p>

        <h2 style={s.h2}>Children's Privacy</h2>
        <p style={s.p}>
          delimt is not intended for users under the age of 16. We do not
          knowingly collect data from children.
        </p>

        <h2 style={s.h2}>Changes to This Policy</h2>
        <p style={s.p}>
          We may update this policy as delimt evolves. Continued use of
          delimt after changes constitutes acceptance of the updated policy.
        </p>

        <h2 style={s.h2}>Contact</h2>
        <p style={s.p}>
          Questions about this policy? Email us at{" "}
          <a href="mailto:hello@delimt.com" style={s.link}>hello@delimt.com</a>
        </p>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; }
      `}</style>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#080808", color: "#e8e8e0", fontFamily: "'DM Mono','Courier New',monospace", position: "relative" },
  grid: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,51,51,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,51,51,0.03) 1px,transparent 1px)", backgroundSize: "44px 44px" },
  nav: { position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #141414" },
  navBack: { fontSize: 12, color: "#666", letterSpacing: "1px", textDecoration: "none" },
  container: { position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 100px" },
  label: { fontSize: 10, letterSpacing: "4px", color: "#FF3333", marginBottom: 16 },
  h1: { fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, marginBottom: 8 },
  updated: { fontSize: 12, color: "#444", marginBottom: 32 },
  h2: { fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12, color: "#e8e8e0" },
  p: { fontSize: 14, color: "#888", lineHeight: 1.9, marginBottom: 16 },
  ul: { paddingLeft: 20, marginBottom: 16 },
  li: { fontSize: 14, color: "#888", lineHeight: 1.9, marginBottom: 6 },
  link: { color: "#FF3333", textDecoration: "none" },
};