import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import logo from "./logo.svg";

export default function BlogPost() {
  const { slug } = useParams();
  const [content, setContent] = useState("");

  useEffect(() => {
    import(`./posts/${slug}.md?raw`)
      .then((mod) => setContent(mod.default))
      .catch(() => setContent("# Post not found"));
  }, [slug]);

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <div style={s.glow} />

      <nav style={s.nav}>
        <Link to="/"><img src={logo} alt="delimt" style={{ height: 36 }} /></Link>
        <Link to="/blog" style={s.navBack}>← All posts</Link>
      </nav>

      <div style={s.container}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 style={s.h1}>{children}</h1>,
            h2: ({ children }) => <h2 style={s.h2}>{children}</h2>,
            h3: ({ children }) => <h3 style={s.h3}>{children}</h3>,
            p: ({ children }) => <p style={s.p}>{children}</p>,
            strong: ({ children }) => <strong style={{ color: "#e8e8e0", fontWeight: 700 }}>{children}</strong>,
            em: ({ children }) => <em style={{ color: "#aaa" }}>{children}</em>,
            blockquote: ({ children }) => <blockquote style={s.blockquote}>{children}</blockquote>,
            ul: ({ children }) => <ul style={s.ul}>{children}</ul>,
            li: ({ children }) => <li style={s.li}>{children}</li>,
            hr: () => <hr style={s.hr} />,
          }}
        >
          {content}
        </ReactMarkdown>

        <div style={s.cta}>
          <div style={s.ctaText}>Ready to fight your worst habits?</div>
          <Link to="/" style={s.ctaBtn}>Join the delimt waitlist →</Link>
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
  container: { position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px" },
  h1: { fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, lineHeight: 1.2, marginBottom: 32, color: "#e8e8e0" },
  h2: { fontSize: 22, fontWeight: 700, marginTop: 48, marginBottom: 16, color: "#e8e8e0" },
  h3: { fontSize: 17, fontWeight: 700, marginTop: 32, marginBottom: 12, color: "#aaa" },
  p: { fontSize: 15, color: "#888", lineHeight: 1.9, marginBottom: 20 },
  blockquote: { borderLeft: "3px solid #FF3333", paddingLeft: 20, margin: "32px 0", fontStyle: "italic", color: "#aaa" },
  ul: { paddingLeft: 20, marginBottom: 20 },
  li: { fontSize: 15, color: "#888", lineHeight: 1.9, marginBottom: 8 },
  hr: { border: "none", borderTop: "1px solid #1a1a1a", margin: "40px 0" },
  cta: { marginTop: 64, padding: 32, background: "#0f0505", border: "1px solid #FF333355", borderRadius: 12, textAlign: "center" },
  ctaText: { fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#e8e8e0" },
  ctaBtn: { display: "inline-block", padding: "14px 28px", background: "#FF3333", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 700, letterSpacing: "1px" },
  footer: { position: "relative", zIndex: 1, borderTop: "1px solid #111", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  footerText: { fontSize: 12, color: "#333" },
};