import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, Check, Layers3 } from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
export function AuthPage({ returnTo }: { returnTo: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        username: String(values.get("username") || "")
          .trim()
          .toLowerCase(),
        redirect: false,
      });
      if (!result?.ok || result.error)
        throw new Error(
          "Unable to continue. Check your username, or try again in a few minutes.",
        );
      window.location.assign(returnTo);
    } catch (e) {
      setError((e as Error).message);
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
              <Check /> Choose your username
            </span>
            <span>
              <Check /> Pick your workspace
            </span>
            <span>
              <Check /> Make something together
            </span>
          </div>
        </div>
        <span className="story-footer">
          <a href="https://rmitnct.club" target="_blank" rel="noreferrer">
            rmitnct.club ↗
          </a>{" "}
          · Built for shared ideas.
        </span>
      </section>
      <main className="entry-content">
        <div className="auth-card">
          <span className="auth-icon">
            <Layers3 />
          </span>
          <p className="eyebrow">01 / YOUR USERNAME</p>
          <h2>Welcome back.</h2>
          <p className="muted">
            Enter your username, then choose a workspace. New here? Your profile
            is created automatically.
          </p>
          <form onSubmit={submit}>
            <label>
              Username
              <input
                name="username"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                minLength={3}
                maxLength={32}
                pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]*"
                placeholder="e.g. myngoc0703"
                aria-describedby="username-hint"
              />
            </label>
            <p className="muted" id="username-hint">
              3–32 letters, numbers, dots, underscores or hyphens. Uppercase and
              lowercase use the same profile.
            </p>
            {error && (
              <p className="request-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "Opening your workspaces…" : "Continue"}
              <ArrowRight />
            </button>
          </form>
          <p className="muted">
            No password required. Anyone who knows a username can use that
            profile and its workspaces.
          </p>
        </div>
      </main>
    </div>
  );
}
