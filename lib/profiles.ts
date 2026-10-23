import type { PowProfileData } from "../app/components/pow-profile";
import { featuredProfile, featuredProfileSlug } from "../data/featured-profile";
import { supabase } from "./supabase";

export type ShowcaseProfile = PowProfileData & { slug: string };

type Row = {
  slug: string; full_name: string; headline: string | null; location: string | null; status: string | null; positioning: string | null;
  linkedin_url: string | null; x_url: string | null; telegram_url: string | null; email: string | null; photo_path: string | null;
  profile_proof_points: { position: number; content: string }[] | null;
  profile_projects: { position: number; name: string; story: string | null }[] | null;
};

/** Public profiles for the homepage: newest real ones from Supabase, then the featured profile. */
export async function getShowcaseProfiles(limit = 3): Promise<ShowcaseProfile[]> {
  const profiles: ShowcaseProfile[] = [];
  if (supabase) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("slug, full_name, headline, location, status, positioning, linkedin_url, x_url, telegram_url, email, photo_path, profile_proof_points (position, content), profile_projects (position, name, story)")
        .eq("is_published", true)
        .eq("is_discoverable", true)
        .order("updated_at", { ascending: false })
        .limit(limit);
      for (const row of (data || []) as Row[]) {
        profiles.push({
          slug: row.slug,
          name: row.full_name,
          headline: row.headline || "",
          location: row.location || "",
          status: row.status || "",
          positioning: row.positioning || "",
          proofs: [...(row.profile_proof_points || [])].sort((a, b) => a.position - b.position).map((p) => p.content),
          projects: [...(row.profile_projects || [])].sort((a, b) => a.position - b.position).map((p) => ({ name: p.name, story: p.story || "" })),
          linkedin: row.linkedin_url || "", x: row.x_url || "", telegram: row.telegram_url || "", email: row.email || "",
          photoUrl: row.photo_path ? supabase.storage.from("profile-photos").getPublicUrl(row.photo_path).data.publicUrl : null,
        });
      }
    } catch (error) {
      console.error("[profiles] Could not load public profiles:", error);
    }
  }
  if (profiles.length < limit && !profiles.some((p) => p.slug === featuredProfileSlug)) {
    profiles.push({ ...featuredProfile, slug: featuredProfileSlug });
  }
  return profiles.slice(0, limit);
}
