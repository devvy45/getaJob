"use client";

import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import styles from "./talent.module.css";

export type Talent = {
  slug: string;
  full_name: string;
  headline: string | null;
  location: string | null;
  status: string | null;
  positioning: string | null;
  photo_path: string | null;
  profile_proof_points: { content: string; position: number }[];
  profile_projects: { name: string; position: number }[];
};

export default function TalentClient({ people }: { people: Talent[] }) {
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("All profiles");
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people.filter((person) => {
      const matchesStatus = availability === "All profiles" || person.status === availability;
      const content = [person.full_name, person.headline, person.location, person.positioning, ...(person.profile_proof_points || []).map((proof) => proof.content)].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!needle || content.includes(needle));
    });
  }, [people, query, availability]);

  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Primary navigation"><a className={styles.logo} href="/jobs">getajob</a><div className={styles.links}><a href="/jobs">Jobs</a><a className={styles.active} href="/talent">Talent</a></div></nav>
    <header className={styles.hero}><p className={styles.eyebrow}>Find talent</p><h1>Meet people with <em>receipts.</em></h1><p>Proof-first profiles for teams that want to see the work, the outcomes, and the person behind the résumé.</p><div className={styles.searchRow}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search growth, community, Delhi, partnerships…" aria-label="Search talent" /><select value={availability} onChange={(event) => setAvailability(event.target.value)} aria-label="Filter talent by availability"><option>All profiles</option><option>Open to work</option><option>Not looking</option><option>Hiring</option></select></div></header>
    <section className={styles.resultsHeader}><p>{matches.length} {matches.length === 1 ? "profile" : "profiles"} with visible proof</p><span>Search by craft, outcome, or location</span></section>
    <section className={styles.list} aria-label="Public POW profiles">{matches.length ? matches.map((person) => { const photo = person.photo_path ? supabase?.storage.from("profile-photos").getPublicUrl(person.photo_path).data.publicUrl : null; const proofs = [...(person.profile_proof_points || [])].sort((a, b) => a.position - b.position).slice(0, 2); const projectCount = (person.profile_projects || []).length; return <a className={styles.card} href={`/p/${person.slug}`} key={person.slug} itemScope itemType="https://schema.org/Person"><div className={styles.cardTop}>{photo ? <img src={photo} alt={`${person.full_name}'s profile`} itemProp="image" /> : <div className={styles.avatar} aria-hidden="true">{person.full_name[0]}</div>}<span className={styles.status}>{person.status || "Profile"}</span></div><div className={styles.person}><h2 itemProp="name">{person.full_name}</h2><p className={styles.headline} itemProp="jobTitle">{person.headline || "Proof-of-work profile"}</p><p className={styles.location}>{person.location || "Location not shared"}</p></div><p className={styles.positioning} itemProp="description">{person.positioning || "Open this profile to see their work and proof points."}</p>{proofs.length > 0 && <div className={styles.proofs}><p>Selected proof</p><ul>{proofs.map((proof) => <li key={proof.content}>{proof.content}</li>)}</ul></div>}<footer><span>{projectCount ? `${projectCount} ${projectCount === 1 ? "work example" : "work examples"}` : "POW profile"}</span><strong>View profile ↗</strong></footer></a>; }) : <div className={styles.empty}>{query ? <><h2>No profiles match that search.</h2><p>Try a role, skill, outcome, or location instead.</p></> : <><h2>The network is taking shape.</h2><p>The first public proof-of-work profiles will appear here soon.</p><a href="/show-pow">Build your POW ↗</a></>}</div>}</section>
  </main>;
}
