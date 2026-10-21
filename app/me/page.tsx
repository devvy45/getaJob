"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function MyProfilePage() {
  const [message, setMessage] = useState("Finding your profile…");

  useEffect(() => {
    const findProfile = async () => {
      if (!supabase) { setMessage("Profile service is not configured."); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/show-pow"; return; }
      const { data } = await supabase.from("profiles").select("slug").eq("id", user.id).single();
      window.location.href = data?.slug ? `/p/${data.slug}` : "/show-pow";
    };
    void findProfile();
  }, []);

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#27211f", color: "#f3eadc", fontFamily: "DM Sans, Arial, sans-serif" }}>{message}</main>;
}
