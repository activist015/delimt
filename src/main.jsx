import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { inject } from "@vercel/analytics";
import { AuthProvider, useAuth } from "./AuthContext";
import App from "./App.jsx";
import Auth from "./Auth.jsx";
import Blog from "./Blog.jsx";
import BlogPost from "./BlogPost.jsx";
import AppShell from "./AppShell.jsx";
import Privacy from "./Privacy";
import Terms from "./Terms";

inject();

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("SW registration failed:", err);
    });
  });
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ background: "#080808", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF3333", fontFamily: "monospace", letterSpacing: "4px", fontSize: 12 }}>
      LOADING...
    </div>
  );
  return user ? children : <Navigate to="/auth" />;
}

function Root() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/app" element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          } />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);