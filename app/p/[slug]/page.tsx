import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import PowProfile, { type PowProfileData } from "../../components/pow-profile";

type Profile = { slug:string; full_name:string; headline:string | null; location:string | null; status:string | null; positioning:string | null; linkedin_url:string | null; x_url:string | null; telegram_url:string | null; email:string | null; photo_path:string | null; profile_proof_points:{position:number;content:string}[]; profile_projects:{position:number;name:string;story:string | null}[] };

async function getProfile(slug:string) {
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("*, profile_proof_points (*), profile_projects (*) ").eq("slug", slug).eq("is_published", true).eq("is_discoverable", true).single();
  return data as Profile | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug:string }> }): Promise<Metadata> {
  const { slug } = await params; const profile = await getProfile(slug);
  if (!profile) return { title:"Profile not found" };
  return { title:profile.full_name, description:profile.positioning || profile.headline || `Proof-of-work profile for ${profile.full_name}.` };
}

export default async function PublicProfile({ params, searchParams }: { params: Promise<{ slug:string }>; searchParams: Promise<{ view?:string }> }) {
  const { slug } = await params; const { view } = await searchParams; const profile = await getProfile(slug);
  if (!profile) notFound();
  const proof = [...(profile.profile_proof_points || [])].sort((a,b) => a.position-b.position);
  const projects = [...(profile.profile_projects || [])].sort((a,b) => a.position-b.position);
  const photoUrl = profile.photo_path ? supabase?.storage.from("profile-photos").getPublicUrl(profile.photo_path).data.publicUrl : null;
  const structuredData = { "@context":"https://schema.org", "@type":"Person", name:profile.full_name, jobTitle:profile.headline, description:profile.positioning, address:profile.location ? { "@type":"PostalAddress", addressLocality:profile.location } : undefined, sameAs:[profile.linkedin_url,profile.x_url,profile.telegram_url].filter(Boolean), url:`/p/${profile.slug}` };
  const data: PowProfileData = {
    name: profile.full_name, headline: profile.headline || "", location: profile.location || "", status: profile.status || "", positioning: profile.positioning || "",
    proofs: proof.map((item) => item.content), projects: projects.map((item) => ({ name: item.name, story: item.story || "" })),
    linkedin: profile.linkedin_url || "", x: profile.x_url || "", telegram: profile.telegram_url || "", email: profile.email || "", photoUrl,
  };
  return <div itemScope itemType="https://schema.org/Person">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <PowProfile data={data} initialTab={view === "work" ? "work" : "profile"} syncUrl action={<a href="/jobs">Jobs</a>} />
  </div>;
}
