import { supabase } from "../../../lib/supabase";

const fields = ["slug", "name", "headline", "location", "availability", "positioning", "proof_points", "linkedin", "x", "telegram", "email"];

function escapeCsv(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

export async function GET(request: Request) {
  if (!supabase) return Response.json({ profiles: [] });
  const { data, error } = await supabase
    .from("profiles")
    .select("slug, full_name, headline, location, status, positioning, linkedin_url, x_url, telegram_url, email, profile_proof_points (content, position)")
    .eq("is_published", true)
    .eq("is_discoverable", true)
    .order("updated_at", { ascending: false });

  if (error) return Response.json({ profiles: [], error: "Failed to load public profiles" }, { status: 500 });
  const profiles = (data || []).map((profile) => ({
    slug: profile.slug,
    name: profile.full_name,
    headline: profile.headline,
    location: profile.location,
    availability: profile.status,
    positioning: profile.positioning,
    proof_points: [...(profile.profile_proof_points || [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position).map((proof: { content: string }) => proof.content).join(" | "),
    linkedin: profile.linkedin_url,
    x: profile.x_url,
    telegram: profile.telegram_url,
    email: profile.email,
  }));

  if (new URL(request.url).searchParams.get("format") === "csv") {
    const csv = [fields.join(","), ...profiles.map((profile) => fields.map((field) => escapeCsv(profile[field as keyof typeof profile])).join(","))].join("\n");
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=getajob-public-talent.csv" } });
  }
  return Response.json({ profiles });
}
