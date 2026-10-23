"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import GoogleSignIn from "./google-sign-in";

type Me = { photo: string | null; initials: string; label: string };

function fromUser(user: User): Me {
  const meta = user.user_metadata || {};
  const name: string = meta.full_name || meta.name || user.email || "";
  const initials = name.split(/[\s@.]+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "Y";
  return { photo: meta.avatar_url || meta.picture || null, initials, label: name || "Your account" };
}

/** Site header: logo, plus Sign in, or a small profile photo with a menu once signed in. */
export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const load = async (user: User | null | undefined) => {
      if (!user) { setMe(null); return; }
      const base = fromUser(user);
      setMe(base);
      // Prefer the photo on their POW, if they've published one.
      const { data } = await client.from("profiles").select("photo_path, full_name").eq("id", user.id).maybeSingle();
      if (data?.photo_path) {
        setMe({ ...base, photo: client.storage.from("profile-photos").getPublicUrl(data.photo_path).data.publicUrl, label: data.full_name || base.label });
      }
    };
    void client.auth.getSession().then(({ data }) => load(data.session?.user));
    const { data } = client.auth.onAuthStateChange((_event, session) => { void load(session?.user); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  const signOut = async () => {
    await supabase?.auth.signOut();
    setOpen(false);
    setMe(null);
  };

  return <header className={`siteNav ${scrolled ? "siteNavScrolled" : ""}`}>
    <nav aria-label="Primary navigation">
      <a className="siteNavLogo" href="/">getajob</a>
      <div className="siteNavRight">
        {me
          ? <div className="siteNavMe" ref={menuRef}>
            <button className="siteNavAvatar" type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${me.label}`}>
              {me.photo ? <img src={me.photo} alt="" referrerPolicy="no-referrer" /> : <span>{me.initials}</span>}
            </button>
            {open && <div className="siteNavMenu" role="menu">
              <p>{me.label}</p>
              <a role="menuitem" href="/me">View profile</a>
              <a role="menuitem" href="/show-pow?edit=1">Edit POW</a>
              <button role="menuitem" type="button" onClick={signOut}>Sign out</button>
            </div>}
          </div>
          : <GoogleSignIn onSignedIn={() => { window.location.href = "/me"; }} />}
      </div>
    </nav>
  </header>;
}
