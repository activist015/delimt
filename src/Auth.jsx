import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";
import logo from "./logo.svg";

export default function Auth() {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("delimt_ref", ref);
  }, []);

  const applyReferral = async (newUserId) => {
    const refCode = localStorage.getItem("delimt_ref");
    if (!refCode) return;

    await supabase
      .from("profiles")
      .update({ referred_by: refCode })
      .eq("id", newUserId);

    const { data: referrer } = await supabase
      .from("profiles")
      .select("id, referral_count")
      .eq("referral_code", refCode)
      .single();

    if (referrer) {
      await supabase
        .from("profiles")
        .update({ referral_count: (referrer.referral_count || 0) + 1 })
        .eq("id", referrer.id);
    }
    localStorage.removeItem("delimt_ref");
  };

  const handle = async () => {
    if (!email.includes("@") || password.length < 6) {
      setError("Valid email and password (6+ chars) required");
      return;
    }
    setLoading(true);
    setError("");

    if (mode === "signup") {
      const { data, error } = await signUp(email, password, name);
      if (error) {
        setError(error.message);
      } else {
        if (data?.user) await applyReferral(data.user.id);
        navigate("/app");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) { setError(error.message); }
      else { navigate("/app"); }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success, redirect happens automatically.
    // Referral + welcome email are handled in AppShell on landing.
  };

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <div style={s.glow} />

      <nav style={s.nav}>
        <a href="/"><img src={logo} alt="delimt" style={{ height: 36 }} /></a>
      </nav>

      <div style={s.container}>
        <div style={s.card}>
          <div style={s.label}>
            {mode === "signin" ? "WELCOME BACK" : "CREATE ACCOUNT"}
          </div>
          <h1 style={s.h1}>
            {mode === "signin"
              ? <>Sign in to <span style={s.red}>delimt</span></>
              : <>Start fighting <span style={s.red}>your habits</span></>
            }
          </h1>

          {error && <div style={s.error}>{error}</div>}

          {/* GOOGLE SIGN IN */}
          <button onClick={handleGoogle} disabled={googleLoading} style={s.googleBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.69-2.26 1.1-3.71 1.1-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.14c-.22-.69-.35-1.43-.35-2.14s.13-1.45.35-2.14V7.02H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.98l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.02l3.66 2.84c.87-2.6 3.3-4.48 6.16-4.48z"/>
            </svg>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>OR</span>
            <div style={s.dividerLine} />
          </div>

          <div style={s.form}>
            {mode === "signup" && (
              <div style={s.field}>
                <label style={s.fieldLabel}>YOUR NAME</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should delimt call you?"
                  style={s.input}
                />
              </div>
            )}

            <div style={s.field}>
              <label style={s.fieldLabel}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={s.input}
                onKeyDown={(e) => e.key === "Enter" && handle()}
              />
            </div>

            <div style={s.field}>
              <label style={s.fieldLabel}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6+ characters"
                style={s.input}
                onKeyDown={(e) => e.key === "Enter" && handle()}
              />
            </div>

            <button onClick={handle} disabled={loading} style={s.btn}>
              {loading ? "..." : mode === "signin" ? "Sign In →" : "Create Account →"}
            </button>
          </div>

          <div style={s.toggle}>
            {mode === "signin" ? (
              <span style={s.toggleText}>
                No account?{" "}
                <button onClick={() => { setMode("signup"); setError(""); }} style={s.toggleBtn}>
                  Sign up free
                </button>
              </span>
            ) : (
              <span style={s.toggleText}>
                Already have one?{" "}
                <button onClick={() => { setMode("signin"); setError(""); }} style={s.toggleBtn}>
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>
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
  glow: { position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 700, height: 400, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse,rgba(255,51,51,0.10) 0%,transparent 70%)" },
  nav: { position: "relative", zIndex: 10, padding: "20px 40px", borderBottom: "1px solid #141414" },
  container: { position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 80px)", padding: "40px 24px" },
  card: { width: "100%", maxWidth: 440, background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 16, padding: 40 },
  label: { fontSize: 10, letterSpacing: "4px", color: "#FF3333", marginBottom: 16 },
  h1: { fontSize: 28, fontWeight: 900, lineHeight: 1.2, marginBottom: 28 },
  red: { color: "#FF3333" },
  error: { background: "#1a0505", border: "1px solid #3a1010", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#FF6666", marginBottom: 20 },
  googleBtn: { width: "100%", padding: "12px", background: "#fff", border: "none", borderRadius: 8, color: "#333", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  divider: { display: "flex", alignItems: "center", gap: 12, margin: "20px 0" },
  dividerLine: { flex: 1, height: 1, background: "#1a1a1a" },
  dividerText: { fontSize: 10, color: "#444", letterSpacing: "2px" },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  fieldLabel: { fontSize: 10, letterSpacing: "3px", color: "#666" },
  input: { padding: "12px 14px", background: "#0a0a0a", border: "1px solid #222", borderRadius: 8, color: "#e8e8e0", fontSize: 14, fontFamily: "'DM Mono',monospace", outline: "none" },
  btn: { padding: "14px", background: "#FF3333", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace", letterSpacing: "1px", marginTop: 8 },
  toggle: { marginTop: 24, textAlign: "center" },
  toggleText: { fontSize: 13, color: "#444" },
  toggleBtn: { background: "none", border: "none", color: "#FF3333", cursor: "pointer", fontSize: 13, fontFamily: "'DM Mono',monospace", textDecoration: "underline" },
};