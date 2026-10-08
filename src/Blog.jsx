import { Link } from "react-router-dom";
import logo from "./logo.svg";

const posts = [
  {
    slug: "why-accountability-apps-fail",
    title: "Why Every Accountability App Has Failed You",
    date: "May 14, 2026",
    read: "4 min read",
    excerpt: "Screen time limits. Blockers. Habit trackers. You've tried them all. Here's the real reason none of them worked — and what actually does.",
    tag: "Psychology",
  },
  {
    slug: "psychology-of-bad-habits",
    title: "The Psychology of Bad Habits (And Why Willpower Is a Lie)",
    date: "May 14, 2026",
    read: "5 min read",
    excerpt: "Willpower isn't a muscle you can train. It's a finite resource that runs out. Science has known this for decades. Your apps haven't caught up.",
    tag: "Science",
  },
  {
    slug: "building-delimt",
    title: "We're Building delimt — Here's the Full Story",
    date: "May 14, 2026",
    read: "3 min read",
    excerpt: "What happens when passive blockers aren't enough? You build something that actually fights back. This is why delimt exists.",
    tag: "Founder",
  },
  {
  slug: "how-to-use-delimt-pwa",
  title: "How to Use delimt on Your Phone (PWA Guide)",
  date: "June 9, 2026",
  read: "4 min read",
  excerpt: "delimt is a PWA — no App Store needed. Install it on your home screen in under 2 minutes and start your first intervention today.",
  tag: "Guide",
},
];

export default function Blog() {
  return (
    <div style={s.root}>
      <div style={s.grid} />
      <div style={s.glow} />

      {/* NAV */}
      <nav style={s.nav}>
        <Link to="/">
          <img src={logo} alt="delimt" style={{ height: 36 }} />
        </Link>
        <Link to="/" style={s.navBack}>← Back to delimt</Link>
      </nav>

      <div style={s.container}>
        <div style={s.header}>
          <div style={s.pill}>DELIMT BLOG</div>
          <h1 style={s.h1}>
            The science of <span style={s.red}>stopping.</span>
          </h1>
          <p style={s.sub}>
            Psychology, habits, and why your brain keeps winning.
          </p>
        </div>

        <div style={s.grid2}>
          {posts.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} style={s.cardLink}>
              <div style={s.card}>
                <div style={s.cardTop}>
                  <span style={s.tag}>{post.tag}</span>
                  <span style={s.read}>{post.read}</span>
                </div>
                <h2 style={s.cardTitle}>{post.title}</h2>
                <p style={s.cardExcerpt}>{post.excerpt}</p>
                <div style={s.cardFooter}>
                  <span style={s.date}>{post.date}</span>
                  <span style={s.more}>Read more →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <footer style={s.footer}>
        <img src={logo} alt="delimt" style={{ height: 28, opacity: 0.6 }} />
        <span style={s.footerText}>© 2026 delimt</span>
      </footer>

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
  glow: { position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 700, height: 400, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse,rgba(255,51,51,0.10) 0%,transparent 70%)" },
  nav: { position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #141414" },
  navBack: { fontSize: 12, color: "#666", letterSpacing: "1px", textDecoration: "none" },
  container: { position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "60px 24px" },
  header: { textAlign: "center", marginBottom: 60 },
  pill: { display: "inline-block", fontSize: 10, letterSpacing: "4px", color: "#FF3333", border: "1px solid #FF333333", borderRadius: 20, padding: "5px 14px", marginBottom: 20 },
  h1: { fontSize: "clamp(32px,6vw,52px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16 },
  red: { color: "#FF3333" },
  sub: { fontSize: 15, color: "#666", lineHeight: 1.7 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 },
  cardLink: { textDecoration: "none" },
  card: { background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12, padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 14, transition: "border-color 0.2s, background 0.2s", cursor: "pointer" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tag: { fontSize: 10, letterSpacing: "2px", color: "#FF3333", background: "#1a0505", borderRadius: 4, padding: "3px 8px" },
  read: { fontSize: 11, color: "#444", letterSpacing: "1px" },
  cardTitle: { fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: "#e8e8e0" },
  cardExcerpt: { fontSize: 13, color: "#666", lineHeight: 1.7, flex: 1 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #1a1a1a" },
  date: { fontSize: 11, color: "#444" },
  more: { fontSize: 12, color: "#FF3333", letterSpacing: "1px" },
  footer: { position: "relative", zIndex: 1, borderTop: "1px solid #111", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  footerText: { fontSize: 12, color: "#333" },
};