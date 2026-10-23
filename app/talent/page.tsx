import type { Metadata } from "next";
import { supabase } from "../../lib/supabase";
import { getShowcaseProfiles } from "../../lib/profiles";
import TalentClient, { type Talent } from "./talent-client";

export const metadata: Metadata = { title: "Talent" };

/**
 * Talent search isn't open yet. We still render the real page (with real
 * profiles) behind a blur, so it previews what's coming without being usable.
 */
export default async function TalentPage() {
  const { data } = supabase
    ? await supabase.from("profiles").select("slug, full_name, headline, location, status, positioning, photo_path, profile_proof_points (content, position), profile_projects (name, position)").eq("is_published", true).eq("is_discoverable", true).order("updated_at", { ascending: false })
    : { data: [] };

  let people = (data || []) as Talent[];
  if (people.length < 3) {
    const showcase = await getShowcaseProfiles(3);
    const extra: Talent[] = showcase.filter((p) => !people.some((row) => row.slug === p.slug)).map((p) => ({
      slug: p.slug, full_name: p.name, headline: p.headline, location: p.location, status: p.status, positioning: p.positioning, photo_path: null,
      profile_proof_points: p.proofs.map((content, index) => ({ content, position: index + 1 })),
      profile_projects: p.projects.map((project, index) => ({ name: project.name, position: index + 1 })),
    }));
    people = [...people, ...extra];
  }

  return <div className="comingSoon">
    <div className="comingSoonPreview" inert aria-hidden="true"><TalentClient people={people} /></div>
    <div className="comingSoonOverlay" role="dialog" aria-labelledby="talent-soon-title">
      <div className="comingSoonCard">
        <span className="comingSoonTag">Coming soon</span>
        <h1 id="talent-soon-title">Talent search is almost here</h1>
        <p>Founders will be able to browse POW profiles by role, location and availability. Build yours now and you&apos;ll be in it from day one.</p>
        <div className="comingSoonActions"><a className="homeHeroPrimary" href="/show-pow">Build your POW</a><a className="homePowExample" href="/">Back to home</a></div>
      </div>
    </div>
  </div>;
}
