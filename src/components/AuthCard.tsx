import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

interface Props {
  mode: "login" | "register";
  /** Same-origin relative path to return to after sign-in (used by the OAuth consent flow). */
  next?: string | undefined;
}

/** Only allow same-origin relative paths as a post-login redirect. */
function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
}

export function AuthCard({ mode, next }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const returnTo = safeNext(next);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${returnTo ?? "/developer/dashboard"}`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login successful");
      }
      if (returnTo) window.location.href = returnTo;
      else void navigate({ to: "/developer/dashboard" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${returnTo ?? ""}`,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Unable to sign in. Please try again.");
      return;
    }
    if (result.redirected) return;
    if (returnTo) window.location.href = returnTo;
    else void navigate({ to: "/developer/dashboard" });
  };

  const resetPassword = async () => {
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/developer/login`,
    });
    if (error) toast.error(error.message);
    else {
      setResetSent(true);
      toast.success("Password reset email sent");
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="font-display text-2xl">
          {mode === "login" ? "Developer Sign In" : "Create a Developer Account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Access your dashboard, embeds and analytics."
            : "Generate embed links and track plays on your own site."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" ? (
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Developer name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="mt-1 w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm outline-none focus:border-ring"
              />
            </div>
          ) : null}
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm outline-none focus:border-ring"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-sm outline-none focus:border-ring"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="mt-3 w-full rounded-xl border border-border bg-surface-2 px-6 py-3 text-sm font-semibold disabled:opacity-60"
        >
          Continue with Google
        </button>

        {mode === "login" ? (
          <button
            type="button"
            onClick={resetPassword}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {resetSent ? "Reset email sent" : "Forgot your password?"}
          </button>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              No account yet?{" "}
              <Link to="/developer/register" className="text-primary hover:underline">
                Register
              </Link>
            </>
          ) : (
            <>
              Already registered?{" "}
              <Link to="/developer/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
