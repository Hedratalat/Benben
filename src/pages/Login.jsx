// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import useAuth from "../store/Useauth";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

export default function Login({ onSuccess }) {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithPopup(auth, provider);

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      let role = "user";
      if (snap.exists()) {
        role = snap.data().role || "user";
      } else {
        await setDoc(userRef, {
          name: user.displayName || "",
          email: user.email,
          role: "user",
          createdAt: serverTimestamp(),
        });
      }

      onSuccess?.(user, role);
      navigate(role === "admin" ? "/dashboard" : "/", { replace: true });
    } catch (err) {
      console.error("Google sign-in failed:", err.code, err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err.code, err.message);
    } finally {
      setSigningOut(false);
    }
  };

  const initial = (user?.displayName || user?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <main className="grid min-h-screen place-items-center bg-page px-4 font-body">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-luxury sm:p-10">
        <div className="mx-auto mb-6 h-1 w-14 rounded-full bg-gold-cta" />

        {authLoading ? (
          /* checking if someone is already signed in (avoids a flash of the sign-in form) */
          <div className="space-y-4" aria-busy="true">
            <div className="mx-auto h-8 w-40 animate-pulse rounded-lg bg-surface-muted" />
            <div className="mx-auto h-4 w-56 animate-pulse rounded bg-surface-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-surface-muted" />
          </div>
        ) : user ? (
          /* ===== Already signed in ===== */
          <>
            <span
              aria-hidden="true"
              className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-cta font-heading text-2xl font-bold text-surface-dark"
            >
              {initial}
            </span>

            <h2 className="mt-5 font-heading text-3xl font-semibold tracking-wide text-heading">
              You're signed in
            </h2>
            {user.displayName && (
              <p className="mt-3 break-words font-medium text-heading">
                {user.displayName}
              </p>
            )}
            <p className="mt-1 mb-8 break-all text-sm text-muted">
              {user.email}
            </p>

            <div className="flex flex-col gap-3">
              {role === "admin" && (
                <Link
                  to="/dashboard"
                  className={`rounded-xl bg-gold-cta px-4 py-3.5 font-semibold text-surface-dark transition hover:shadow-luxury active:brightness-90 ${ring}`}
                >
                  Go to dashboard
                </Link>
              )}
              <Link
                to="/shop"
                className={`rounded-xl px-4 py-3.5 font-medium transition-colors ${ring} ${
                  role === "admin"
                    ? "border border-border-strong text-heading hover:bg-surface-muted"
                    : "bg-gold-cta text-surface-dark hover:shadow-luxury active:brightness-90"
                }`}
              >
                Continue shopping
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className={`rounded-xl border border-border-strong px-4 py-3.5 font-medium text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-60 ${ring}`}
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </>
        ) : (
          /* ===== Not signed in ===== */
          <>
            <h2 className="font-heading text-3xl font-semibold tracking-wide text-heading">
              Sign in
            </h2>
            <p className="mb-8 mt-3 text-muted">
              Sign in with your Google account to continue.
            </p>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3.5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-surface">
                <GoogleIcon />
              </span>
              {loading ? "Signing in..." : "Continue with Google"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
