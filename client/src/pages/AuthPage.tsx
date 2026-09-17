import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, Check, Layers3, ShieldCheck } from "lucide-react";
import { api } from "../api";
import { BrandLogo } from "../components/BrandLogo";
export function AuthPage({ returnTo }: { returnTo: string }) {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      if (mode !== "login") {
        const result = await api<{ recoveryCode: string }>(
          mode === "register" ? "/register" : "/recover",
          { method: "POST", body: JSON.stringify(values) },
        );
        setRecovery(result.recoveryCode);
      } else {
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });
        if (result?.error)
          throw new Error(
            "Unable to sign in. Check your email and password, or try again later.",
          );
        window.location.assign(returnTo);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="entry-layout">
      <section className="entry-story">
        <BrandLogo />
        <div className="story-body">
          <span className="eyebrow">RMIT NEO CULTURE TECH / PLANNER</span>
          <h1>
            Good ideas.
            <br />
            Shared focus.
            <br />
            <em>Real progress.</em>
          </h1>
          <p>
            From your first club project to your next big launch. A shared place
            to plan, build, and make it happen.
          </p>
          <div className="story-points">
            <span>
              <Check /> A clear plan for today
            </span>
            <span>
              <Check /> One board, shared ownership
            </span>
            <span>
              <Check /> Your team, in sync
            </span>
          </div>
        </div>
        <span className="story-footer">
          <a href="https://rmitnct.club" target="_blank" rel="noreferrer">
            rmitnct.club ↗
          </a>{" "}
          ·
          <Layers3 size={18} /> Your next chapter starts here.
        </span>
      </section>
      <section className="entry-content">
        <div className="auth-card">
          <span className="eyebrow">YOUR TEAM’S NEXT CHAPTER</span>
          <h2>
            {recovery
              ? "Keep your recovery key safe"
              : mode === "login"
                ? "Welcome back."
                : mode === "register"
                  ? "Make room for progress."
                  : "Recover your account."}
          </h2>
          <p className="muted">
            {recovery
              ? "This key lets you reset your password. Store it in your password manager; it is only shown once."
              : mode === "login"
                ? "Sign in to pick up where you left off."
                : mode === "register"
                  ? "Create your account, then start or join a workspace."
                  : "Use the recovery key saved when you created your account."}
          </p>
          {recovery ? (
            <>
              <code className="recovery-key">{recovery}</code>
              <button
                className="secondary"
                onClick={() => {
                  const blob = new Blob(
                    [`NEO recovery key\n${recovery}\nKeep this private.\n`],
                    { type: "text/plain" },
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "neo-recovery-key.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                  setSaved(true);
                }}
              >
                Download recovery key
              </button>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={saved}
                  onChange={(e) => setSaved(e.target.checked)}
                />{" "}
                I have saved my recovery key
              </label>
              <button
                className="primary"
                disabled={!saved}
                onClick={() => {
                  setRecovery("");
                  setMode("login");
                }}
              >
                Continue to sign in <ArrowRight />
              </button>
            </>
          ) : (
            <form onSubmit={submit}>
              {mode === "register" && (
                <label>
                  Your name
                  <input
                    name="name"
                    autoComplete="name"
                    maxLength={80}
                    required
                    placeholder="How should we call you?"
                  />
                </label>
              )}
              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  placeholder="you@example.com"
                />
              </label>
              {mode === "recover" && (
                <label>
                  Recovery key
                  <input name="recoveryCode" autoComplete="off" required />
                </label>
              )}
              <label>
                {mode === "recover" ? "New password" : "Password"}
                <input
                  type="password"
                  name="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={12}
                  maxLength={72}
                  required
                  placeholder="At least 12 characters"
                />
              </label>
              {error && (
                <p className="request-error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign in"
                    : mode === "register"
                      ? "Create account"
                      : "Reset password"}
                <ArrowRight />
              </button>
            </form>
          )}
          {!recovery && (
            <div className="auth-links">
              <button
                onClick={() => {
                  setMode(mode === "register" ? "login" : "register");
                  setError("");
                }}
              >
                {mode === "register"
                  ? "Already have an account? Sign in"
                  : "New to NEO? Create an account"}
              </button>
              <button
                onClick={() => {
                  setMode(mode === "recover" ? "login" : "recover");
                  setError("");
                }}
              >
                {mode === "recover"
                  ? "Back to sign in"
                  : "Forgot your password?"}
              </button>
            </div>
          )}
          <div className="auth-footnote">
            <ShieldCheck size={16} /> Your workspace is only visible to its
            members.
          </div>
        </div>
      </section>
    </div>
  );
}
