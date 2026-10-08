export default function OGImage() {
  return (
    <div style={{
      width: 1200, height: 630,
      background: "#080808",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Mono', monospace",
      position: "relative", overflow: "hidden",
    }}>
      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,51,51,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,51,51,0.05) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      {/* Glow */}
      <div style={{
        position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 500,
        background: "radial-gradient(ellipse, rgba(255,51,51,0.15) 0%, transparent 70%)",
      }} />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ fontSize: 18, letterSpacing: "6px", color: "#FF3333", marginBottom: 24, textTransform: "uppercase" }}>
          ⚡ delimt
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, color: "#e8e8e0", lineHeight: 1.1, marginBottom: 24 }}>
          The AI that fights you<br />
          <span style={{ color: "#FF3333" }}>for your own good.</span>
        </div>
        <div style={{ fontSize: 24, color: "#666", maxWidth: 700, margin: "0 auto" }}>
          Not a passive blocker. An active AI agent that argues<br />you out of your bad decisions in real time.
        </div>
        <div style={{ marginTop: 48, fontSize: 18, color: "#444", letterSpacing: "3px" }}>
          delimt.com
        </div>
      </div>
    </div>
  );
}