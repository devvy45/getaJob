import { supabase } from "../../lib/supabase";
import TalentClient, { type Talent } from "./talent-client";

export default async function TalentPage() {
  const { data } = supabase
    ? await supabase.from("profiles").select("slug, full_name, headline, location, status, positioning, photo_path, profile_proof_points (content, position), profile_projects (name, position)").eq("is_published", true).eq("is_discoverable", true).order("updated_at", { ascending: false })
    : { data: [] };

  return <TalentClient people={(data || []) as Talent[]} />;
}
