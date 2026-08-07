"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction, signupAction } from "@/actions/auth";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success" | "info";
  } | null>(null);

  /* Login fields */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  /* Signup fields — matches Flask: email + password + confirm (no name) */
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await loginAction(loginEmail, loginPassword);
    setLoading(false);
    if (res.success) {
      router.push(next);
    } else {
      setMessage({ text: res.message ?? "Login failed.", type: "error" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);
    /* name arg left blank — Flask auth also doesn't collect a name on signup */
    const res = await signupAction(signupEmail, signupPassword, "");
    setLoading(false);
    if (res.success) {
      if (res.loggedIn) {
        router.push(next);
      } else {
        setMessage({ text: res.message ?? "Account created! Please log in.", type: "success" });
        switchTab("login");
      }
    } else {
      setMessage({ text: res.message ?? "Signup failed.", type: "error" });
    }
  };

  const switchTab = (t: "login" | "signup") => {
    setTab(t);
    setMessage(null);
  };

  return (
    <>
      <style>{`
        /* ── Auth page ──────────────────────────────────────────────────────────
           Mirrors Flask auth.html inline style block exactly.
           Navbar + Footer are rendered by the auth layout (same as public),
           so this container just needs to centre the card vertically in the
           remaining viewport space — matching Flask's auth-container rules.
           Uses auth-specific class names (auth-form-group, auth-btn, etc.)
           to avoid conflicts with the product-page .form-group rules in
           style.css and the review section's .form-group / .auth-btn rules.
        ───────────────────────────────────────────────────────────────────── */
        .auth-page {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 80vh;
          padding: 3rem;
          margin-top: -25px; /* matches Flask auth-container margin-top */
        }

        /* White card */
        .auth-card {
          background: #fff;
          width: 100%;
          max-width: 420px;
          padding: 1.5rem 2.5rem;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.06);
          position: relative;
          overflow: hidden;
        }

        /* Tabs */
        .auth-tabs {
          display: flex;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
        }
        .auth-tab {
          flex: 1;
          padding: 1rem;
          text-align: center;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          color: #888;
          transition: all 0.3s ease;
          border: none;
          border-bottom: 2px solid transparent;
          background: none;
          font-family: 'DM Sans', sans-serif;
        }
        .auth-tab.active {
          color: var(--crimson, #c7566a);
          border-bottom-color: var(--crimson, #c7566a);
        }

        /* Alert / flash messages */
        .auth-alert {
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .auth-alert.error   { background: #fee2e2; color: #ef4444; }
        .auth-alert.success { background: #ecfdf5; color: #10b981; }
        .auth-alert.info    { background: #eff6ff; color: #1d4ed8; }

        /* Forms — hidden/shown by tab state instead of CSS class toggling */
        .auth-form-panel {
          display: none;
        }
        .auth-form-panel.active {
          display: block;
          animation: authFadeIn 0.5s ease;
        }
        @keyframes authFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Field groups */
        .auth-form-group {
          margin-bottom: 1.2rem;
        }
        .auth-form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          font-size: 0.9rem;
          color: #555;
        }
        .auth-form-group input {
          width: 100%;
          padding: 0.85rem 1rem;
          border: 1px solid #e1e1e1;
          border-radius: 12px;
          outline: none;
          transition: border-color 0.3s, box-shadow 0.3s;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          background: #fff;
          color: #333;
          box-sizing: border-box;
        }
        .auth-form-group input:focus {
          border-color: var(--crimson, #c7566a);
          box-shadow: 0 0 0 4px rgba(139, 26, 42, 0.05);
        }

        /* Submit button */
        .auth-btn {
          width: 100%;
          padding: 1rem;
          background: var(--crimson, #c7566a);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'DM Sans', sans-serif;
          margin-top: 0;
        }
        .auth-btn:hover:not(:disabled) {
          background: #a13d4e;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(139, 26, 42, 0.2);
        }
        .auth-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Footer text inside card (forgot / terms) */
        .auth-card-footer {
          margin-top: 1rem;
          text-align: center;
          font-size: 0.9rem;
          color: #666;
        }
        .auth-card-footer a {
          color: var(--crimson, #c7566a);
          text-decoration: none;
          font-weight: 600;
        }
        .auth-card-footer a:hover {
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .auth-card { padding: 1.5rem; }
          .auth-page  { padding: 2rem 1rem; }
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab${tab === "login" ? " active" : ""}`}
              onClick={() => switchTab("login")}
            >
              Login
            </button>
            <button
              className={`auth-tab${tab === "signup" ? " active" : ""}`}
              onClick={() => switchTab("signup")}
            >
              Sign Up
            </button>
          </div>

          {/* Flash / alert message */}
          {message && (
            <div className={`auth-alert ${message.type}`}>{message.text}</div>
          )}

          {/* ── Login form ─────────────────────────────────────────────────── */}
          <form
            onSubmit={handleLogin}
            className={`auth-form-panel${tab === "login" ? " active" : ""}`}
          >
            <div className="auth-form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                type="email"
                id="login-email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="auth-form-group">
              <label htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading && tab === "login" ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* ── Sign Up form ───────────────────────────────────────────────── */}
          <form
            onSubmit={handleSignup}
            className={`auth-form-panel${tab === "signup" ? " active" : ""}`}
          >
            <div className="auth-form-group">
              <label htmlFor="signup-email">Email Address</label>
              <input
                type="email"
                id="signup-email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="auth-form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="auth-form-group">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <input
                type="password"
                id="signup-confirm"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading && tab === "signup" ? "Creating…" : "Create Account"}
            </button>
            <div className="auth-card-footer">
              <p>
                By signing up, you agree to our{" "}
                <a href="/terms">Terms</a> and{" "}
                <a href="/privacy">Privacy</a>.
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
