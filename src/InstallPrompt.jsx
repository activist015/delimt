import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setShow(false);
  };

  if (installed || !show) return null;

  return (
    <div style={s.bar}>
      <div style={s.left}>
        <span style={s.icon}>⚡</span>
        <div>
          <div style={s.title}>Install delimt</div>
          <div style={s.sub}>Add to home screen for instant access</div>
        </div>
      </div>
      <div style={s.btns}>
        <button onClick={() => setShow(false)} style={s.dismiss}>Later</button>
        <button onClick={handleInstall} style={s.install}>Install</button>
      </div>
    </div>
  );
}

const s = {
  bar: {
    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
    background: "#0f0f0f", borderTop: "1px solid #FF333333",
    padding: "16px 20px", display: "flex",
    alignItems: "center", justifyContent: "space-between",
    fontFamily: "'DM Mono',monospace",
    animation: "slideUp 0.3s ease",
  },
  left: { display: "flex", alignItems: "center", gap: 12 },
  icon: { fontSize: 24 },
  title: { fontSize: 14, fontWeight: 700, color: "#e8e8e0", marginBottom: 2 },
  sub: { fontSize: 11, color: "#666", letterSpacing: "1px" },
  btns: { display: "flex", gap: 10 },
  dismiss: { padding: "8px 14px", background: "none", border: "1px solid #222", borderRadius: 6, color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "monospace" },
  install: { padding: "8px 16px", background: "#FF3333", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "monospace" },
};