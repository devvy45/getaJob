import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import styles from "../ayush-goel/profile.module.css";

type Profile = { slug:string; full_name:string; headline:string | null; location:string | null; status:string | null; positioning:string | null; linkedin_url:string | null; x_url:string | null; telegram_url:string | null; email:string | null; photo_path:string | null; profile_proof_points:{position:number;content:string}[]; profile_projects:{position:number;name:string;story:string | null}[] };

async function getProfile(slug:string) {
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("*, profile_proof_points (*), profile_projects (*) ").eq("slug", slug).eq("is_published", true).eq("is_discoverable", true).single();
  return data as Profile | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug:string }> }): Promise<Metadata> {
  const { slug } = await params; const profile = await getProfile(slug);
  if (!profile) return { title:"POW profile — getajob" };
  return { title:`${profile.full_name} — POW profile | getajob`, description:profile.positioning || profile.headline || `Proof-of-work profile for ${profile.full_name}.` };
}

export default async function PublicProfile({ params, searchParams }: { params: Promise<{ slug:string }>; searchParams: Promise<{ view?:string }> }) {
  const { slug } = await params; const { view } = await searchParams; const profile = await getProfile(slug);
  if (!profile) notFound();
  const work = view === "work";
  const proof = [...(profile.profile_proof_points || [])].sort((a,b) => a.position-b.position);
  const projects = [...(profile.profile_projects || [])].sort((a,b) => a.position-b.position);
  const photoUrl = profile.photo_path ? supabase?.storage.from("profile-photos").getPublicUrl(profile.photo_path).data.publicUrl : null;
  const structuredData = { "@context":"https://schema.org", "@type":"Person", name:profile.full_name, jobTitle:profile.headline, description:profile.positioning, address:profile.location ? { "@type":"PostalAddress", addressLocality:profile.location } : undefined, sameAs:[profile.linkedin_url,profile.x_url,profile.telegram_url].filter(Boolean), url:`/p/${profile.slug}` };
  return <main className={styles.page} itemScope itemType="https://schema.org/Person"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><nav className={styles.nav}><a className={styles.logo} href="/jobs">getajob</a><div className={styles.tabs} role="tablist"><a className={!work ? styles.selected : ""} href={`/p/${slug}`}>Profile</a><a className={work ? styles.selected : ""} href={`/p/${slug}?view=work`}>Work</a></div><a className={styles.share} href="/jobs">Jobs</a></nav>{!work ? <section className={styles.profileView}><div className={styles.intro}><p className={styles.kicker} itemProp="jobTitle">{profile.headline}</p><h1>Hi, I&apos;m <span itemProp="name">{profile.full_name.split(" ")[0]}</span>.</h1><p className={styles.lede} itemProp="description">{profile.positioning}</p><p className={styles.label}>The short version</p><ul className={styles.summary}>{proof.map((item) => <li key={item.position}>{item.content}</li>)}</ul><div className={styles.meta}>{profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}{profile.x_url && <a href={profile.x_url} target="_blank" rel="noreferrer">𝕏</a>}{profile.telegram_url && <a href={profile.telegram_url} target="_blank" rel="noreferrer">Telegram</a>}{profile.email && <a href={`mailto:${profile.email}`}>Email</a>}<span>{profile.location} · {profile.status}</span></div></div>{photoUrl ? <img className={styles.photo} src={photoUrl} alt={`${profile.full_name}'s profile photo`} itemProp="image" /> : <div className={styles.photo} />}</section> : <section className={styles.workView}><div><p className={styles.kicker}>Selected work</p><h1>Things I&apos;ve built.</h1></div>{projects.map((project,index) => <article key={project.position}><span>0{index+1}</span><div><h2>{project.name}</h2><p>{project.story}</p></div><strong>{project.story}</strong></article>)}</section>}</main>;
}
