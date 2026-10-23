"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

/**
 * "Sign in with Google" using Google's own button and popup.
 * Google shows our domain (trygetajob.com) instead of the Supabase project address,
 * then we hand Google's ID token to Supabase with signInWithIdToken.
 * Needs VITE_GOOGLE_CLIENT_ID; without it, falls back to the regular redirect sign-in.
 */

type GoogleId = {
  initialize: (options: Record<string, unknown>) => void;
  renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
};
declare global {
  interface Window { google?: { accounts?: { id?: GoogleId } } }
}

export const googleClientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let scriptPromise: Promise<void> | null = null;
function loadGoogleScript() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { scriptPromise = null; reject(new Error("Google sign-in could not load")); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

/** Old flow: full-page redirect through Supabase. Used only if no client ID is set. */
export async function redirectSignIn(redirectTo: string) {
  if (!supabase) return { error: new Error("Sign-in is not configured.") };
  return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
}

export default function GoogleSignIn({ onSignedIn, onError, text = "signin", width }: {
  onSignedIn: () => void;
  onError?: (message: string) => void;
  text?: "signin" | "signin_with" | "continue_with";
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const callbacks = useRef({ onSignedIn, onError });
  useEffect(() => { callbacks.current = { onSignedIn, onError }; }, [onSignedIn, onError]);

  useEffect(() => {
    if (!googleClientId || !supabase) return;
    const client = supabase;
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleScript();
        const nonce = await makeNonce();
        if (cancelled || !ref.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          nonce: nonce.hashed,
          use_fedcm_for_button: true,
          callback: async ({ credential }: { credential: string }) => {
            const { error } = await client.auth.signInWithIdToken({ provider: "google", token: credential, nonce: nonce.raw });
            if (error) callbacks.current.onError?.("Google sign-in didn't finish. Please try again.");
            else callbacks.current.onSignedIn();
          },
        });
        window.google.accounts.id.renderButton(ref.current, { type: "standard", theme: "filled_black", shape: "pill", size: "medium", text, logo_alignment: "left", ...(width ? { width } : {}) });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [text, width]);

  if (!googleClientId || failed) {
    return <button className="siteNavSignIn" type="button" onClick={() => void redirectSignIn(`${window.location.origin}/me`)}>Sign in</button>;
  }
  return <div ref={ref} className="googleButton" />;
}
