import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";
import { applyPendingReferral } from "./profileReferral";
import { Icons } from "./icons";
import Dashboard from "./pages/Dashboard";
import Intervention from "./pages/Intervention";
import History from "./pages/History";
import Settings from "./pages/Settings";
import HabitSetup from "./pages/HabitSetup";
import logo from "./logo.svg";

export default function AppShell() {
  const { user } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [activeHabit, setActiveHabit] = useState(null);
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Apply a pending invitation after Google or email confirmation returns.
  // The database owns counters; this browser can update only its own claim.
  useEffect(() => {
    if (user?.id) void applyPendingReferral(supabase, user.id, localStorage);
  }, [user?.id]);

  // Send welcome email exactly once, regardless of signup method
  useEffect(() => {
    checkNewUserWelcome();
  }, []);

  const checkNewUserWelcome = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("welcome_email_sent")
      .eq("id", user.id)
      .single();

    if (profile && !profile.welcome_email_sent) {
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: user.email, type: "appWelcome" }),
      }).catch(() => {});

      await supabase
        .from("profiles")
        .update({ welcome_email_sent: true })
        .eq("id", user.id);
    }
  };

  // PWA install prompt logic
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;

    if (isStandalone) return;

    const dismissed = localStorage.getItem("delimt_install_dismissed");
    if (dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    if (isIOS) {
      setShowInstallBanner(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem("delimt_install_dismissed", "true");
  };

  const navigate = (p, data = {}) => {
    if (data.habit) setActiveHabit(data.habit);
    setPage(p);
    window.scrollTo(0, 0);
  };

  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

  return (
    <div style={s.root}>
      <div style={s.grid} />

      {/* INSTALL BANNER SPACER */}
      {showInstallBanner && <div style={{ height: 52 }} />}

      {/* INSTALL BANNER */}
      {showInstallBanner && (
        <div style={s.installBanner}>
          <div style={s.installContent}>
            <div style={s.installIcon}>⚡</div>
            <div style={s.installText}>
              <div style={s.installTitle}>Install delimt</div>
              <div style={s.installSub}>
                {isIOS
                  ? 'Tap Share → "Add to Home Screen"'
                  : "Add to your home screen — never lose it again"}
              </div>
            </div>
          </div>
          <div style={s.installActions}>
            {deferredPrompt && (
              <button onClick={handleInstall} style={s.installBtn}>
                Install
              </button>
            )}
            <button onClick={dismissInstall} style={s.dismissBtn}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* TOP NAV */}
      <nav style={s.nav}>
        <img src={logo} alt="delimt" style={{ height: 32 }} />
        <div style={s.navRight}>
          <span style={s.navEmail}>
            {user?.email?.split("@")[0]}
          </span>
          <button
            onClick={() => navigate("settings")}
            style={s.settingsBtn}
            title="Settings"
          >
            <Icons.Settings size={20} color="#555" />
          </button>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <div style={s.content}>
        {page === "dashboard" && (
          <Dashboard
            onStartIntervention={(habit) => navigate("intervention", { habit })}
            onNewHabit={() => setShowNewHabit(true)}
            onHistory={() => navigate("history")}
          />
        )}
        {page === "intervention" && (
          <Intervention
            habit={activeHabit}
            onDone={() => navigate("dashboard")}
          />
        )}
        {page === "history" && (
          <History onBack={() => navigate("dashboard")} />
        )}
        {page === "settings" && (
          <Settings onBack={() => navigate("dashboard")} />
        )}
      </div>

      {/* BOTTOM NAV */}
      {page !== "intervention" && (
        <div style={s.bottomNav}>
          {[
            { id: "dashboard", Icon: Icons.Habits, label: "Habits" },
            { id: "history", Icon: Icons.History, label: "History" },
            { id: "settings", Icon: Icons.Settings, label: "Settings" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              style={{
                ...s.bottomNavBtn,
                color: page === item.id ? "#FF3333" : "#444",
                borderTop: page === item.id
                  ? "2px solid #FF3333"
                  : "2px solid transparent",
              }}
            >
              <item.Icon size={20} color={page === item.id ? "#FF3333" : "#444"} />
              <span style={{ fontSize: 10, letterSpacing: "1px" }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* NEW HABIT MODAL */}
      {showNewHabit && (
        <HabitSetup
          onDone={() => { setShowNewHabit(false); }}
          onClose={() => setShowNewHabit(false)}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; overflow-x: hidden; }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#080808",
    color: "#e8e8e0",
    fontFamily: "'DM Mono','Courier New',monospace",
    position: "relative",
    paddingBottom: 80,
  },
  grid: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
    backgroundImage: "linear-gradient(rgba(255,51,51,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,51,51,0.03) 1px,transparent 1px)",
    backgroundSize: "44px 44px",
  },
  installBanner: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    background: "#FF3333",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  installContent: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  installIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  installText: {
    minWidth: 0,
  },
  installTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
  },
  installSub: {
    fontSize: 11,
    color: "#fff",
    opacity: 0.9,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  installActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  installBtn: {
    padding: "6px 14px",
    background: "#fff",
    border: "none",
    borderRadius: 6,
    color: "#FF3333",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Mono',monospace",
    whiteSpace: "nowrap",
  },
  dismissBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
    padding: "4px 6px",
    lineHeight: 1,
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #141414",
    background: "#080808",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  navEmail: {
    fontSize: 11,
    color: "#444",
    letterSpacing: "1px",
  },
  settingsBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: 600,
    margin: "0 auto",
    padding: "24px 20px",
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    background: "#080808",
    borderTop: "1px solid #141414",
    display: "flex",
    justifyContent: "space-around",
    padding: "8px 0 12px",
  },
  bottomNavBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontFamily: "'DM Mono',monospace",
    transition: "color 0.2s",
    padding: "4px 20px",
  },
};
