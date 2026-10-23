import type { Metadata } from "next";
import { Suspense, cache } from "react";
import SiteNav from "./components/site-nav";
import { DEFAULT_TTL_DAYS, fetchJobs, jobStats, pickFeaturedJobs, type Job } from "../lib/jobs";
import { getShowcaseProfiles } from "../lib/profiles";
import { storyPoints } from "../lib/story";

export const metadata: Metadata = { title: { absolute: "getajob · The startup talent network" } };

// One fetch per request, shared by every section below.
const loadJobs = cache(() => fetchJobs());
const loadProfiles = cache(() => getShowcaseProfiles(3));

const newestFirst = (jobs: Job[]) => [...jobs].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
const list = (items: string[]) => items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
const initials = (name: string) => name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

/* ---------- Hero ---------- */

async function HeroLive() {
  const [jobs, profiles] = await Promise.all([loadJobs(), loadProfiles()]);
  const stats = jobStats(jobs);
  const job = newestFirst(jobs)[0];
  const profile = profiles[0];
  return <>
    <p className="heroStats">
      {stats.total > 0 && <span><b>{stats.total}</b> open {stats.total === 1 ? "role" : "roles"}</span>}
      {stats.thisWeek > 0 && <span><b>{stats.thisWeek}</b> posted this week</span>}
      <span>removed after {stats.ttlDays} days</span>
    </p>
    {(job || profile) && <div className="heroCards" aria-hidden="true">
      {job && <a className="heroJobCard" href={`/jobs/${job.id}`} tabIndex={-1}>
        <span className="heroJobTop"><i style={{ backgroundColor: job.accent }}>{job.initials}</i><span><b>{job.personName}</b><small>{job.personHeadline}</small></span><em>{job.postedAt}</em></span>
        <strong>{job.role}</strong>
        <small>{[job.company, job.location].filter(Boolean).join(" · ")}</small>
        <span className="heroJobActions"><u>Share</u><u>Apply ↗</u></span>
      </a>}
      {profile && <a className="heroPowCard" href={`/p/${profile.slug}`} tabIndex={-1}>
        <span className="homePowToggle"><i>Profile</i><i>Work</i></span>
        <span className="homePowStatus">{(profile.status === "Open to work" || profile.status === "Hiring") && <span className={profile.status === "Hiring" ? "statusHiring" : ""} />}{[profile.status, profile.location].filter(Boolean).join(" · ")}</span>
        <strong>Hi, I&apos;m {profile.name}.</strong>
        {profile.headline && <mark>{profile.headline}</mark>}
        <ul>{profile.proofs.filter(Boolean).slice(0, 2).map((proof) => <li key={proof}>{proof}</li>)}</ul>
      </a>}
    </div>}
  </>;
}

function HeroLoading() {
  return <>
    <p className="heroStats"><span>Loading open roles…</span></p>
    <div className="heroCards heroCardsLoading" aria-hidden="true"><span className="heroJobCard" /><span className="heroPowCard" /></div>
  </>;
}

/* ---------- Open roles ---------- */

async function JobsSource() {
  const stats = jobStats(await loadJobs());
  return stats.sources.length ? <p>From founders&apos; posts on {list(stats.sources)}</p> : null;
}

async function FeaturedJobs() {
  const jobs = await loadJobs();
  const featured = pickFeaturedJobs(jobs);
  if (!featured.length) return <p className="homeEmpty">No open roles right now. Check back soon.</p>;
  return <>
    <div className="homeJobsList">{featured.map((job) => <a className="homeJob" href={`/jobs/${job.id}`} key={job.id}><span>{job.company}</span><strong>{job.role}</strong><small>{job.location}</small><i>{job.postedAt} ↗</i></a>)}</div>
    <a className="homeViewAll" href="/jobs">See all {jobs.length} open {jobs.length === 1 ? "role" : "roles"} <span aria-hidden="true">→</span></a>
  </>;
}

function FeaturedJobsLoading() {
  return <div className="homeJobsList" aria-busy="true" aria-label="Loading jobs">{[0, 1, 2, 3].map((row) => <div className="homeJob homeJobLoading" key={row}><span /><strong /><small /><i /></div>)}</div>;
}

/* ---------- POW ---------- */

async function PowExample() {
  const profile = (await loadProfiles())[0];
  if (!profile) return null;
  const projects = profile.projects.filter((p) => p.name).slice(0, 2);
  return <a className="homePowCard powWorkCard" href={`/p/${profile.slug}?view=work`} aria-label={`Example profile: ${profile.name}, work tab`}>
    <span className="homePowToggle homePowToggleWork" aria-hidden="true"><i>Profile</i><i>Work</i></span>
    <span className="powWorkTitle">What {firstName(profile.name)} has built.</span>
    {projects.map((project, index) => <span className="powWorkItem" key={project.name}>
      <em>{String(index + 1).padStart(2, "0")}</em>
      <b>{project.name}</b>
      {storyPoints(project.story).slice(0, 2).map((point) => <span key={point}>{point}</span>)}
    </span>)}
  </a>;
}

async function PowExampleLink() {
  const profile = (await loadProfiles())[0];
  return profile ? <a className="homePowExample" href={`/p/${profile.slug}`}>See an example <span aria-hidden="true">↗</span></a> : null;
}

/* ---------- Talent ---------- */

async function TalentMock() {
  const [jobs, profiles] = await Promise.all([loadJobs(), loadProfiles()]);
  const stats = jobStats(jobs);
  const searchHint = [...stats.categories.slice(0, 2).map((c) => c.toLowerCase()), ...stats.locations.slice(0, 1)].join(", ");
  const chips = stats.categories.slice(0, 3);
  return <div className="talentMock" aria-hidden="true">
    <div className="talentMockSearch"><span>⌕</span>{searchHint ? `${searchHint}…` : "Search by role, result or location"}</div>
    <div className="talentMockChips">
      {chips.map((chip, index) => <i className={index === 0 ? "on" : ""} key={chip}>{chip}</i>)}
      <i className="dot">Open to work</i>
      {stats.locations[0] && <i>{stats.locations[0]}</i>}
    </div>
    {profiles.length > 0 && <div className="talentMockList">{profiles.map((person) => <div key={person.slug}>
      {person.photoUrl ? <img src={person.photoUrl} alt="" /> : <b>{initials(person.name)}</b>}
      <span><strong>{person.headline || person.name}</strong><small>{[person.proofs.find(Boolean), person.location].filter(Boolean).join(" · ")}</small></span>
      {person.status && <em className={person.status === "Open to work" ? "open" : person.status === "Hiring" ? "hiring" : ""}>{person.status}</em>}
    </div>)}</div>}
  </div>;
}

/* ---------- Page ---------- */

export default function Home() {
  return <main className="homePage">
    <SiteNav />
    <section className="heroNew">
      <div className="heroCopy">
        <h1>The startup talent network</h1>
        <div className="heroActions"><a className="homeHeroPrimary" href="#jobs">Find a job</a><a className="homeHeroCta" href="/show-pow">Build your POW</a></div>
      </div>
      <Suspense fallback={<HeroLoading />}><HeroLive /></Suspense>
    </section>

    <section className="homeJobs homeSection" id="jobs" aria-labelledby="jobs-title">
      <header><h2 id="jobs-title">Open roles</h2><Suspense fallback={null}><JobsSource /></Suspense></header>
      <Suspense fallback={<FeaturedJobsLoading />}><FeaturedJobs /></Suspense>
    </section>

    <section className="homePow homeSection" id="pow" aria-labelledby="pow-title">
      <div className="homePowCopy">
        <h2 id="pow-title">All your work, on one link</h2>
        <ol className="homePowSteps">
          <li><b>Upload your résumé.</b> We fill in the profile.</li>
          <li><b>Edit the points.</b> Short, numbers first.</li>
          <li><b>Share your link.</b> In every application.</li>
        </ol>
        <div className="homeHeroActions"><a className="homeHeroPrimary" href="/show-pow">Build your POW</a><Suspense fallback={null}><PowExampleLink /></Suspense></div>
      </div>
      <div className="powAnnotated">
        <Suspense fallback={<div className="homePowCard powWorkCard powCardLoading" aria-hidden="true" />}><PowExample /></Suspense>
        <ul className="powNotes">
          <li><b>Results</b>Your best points, numbers first</li>
          <li><b>Projects</b>What you did, what changed</li>
          <li><b>Vouches</b>From people you worked with <em>soon</em></li>
        </ul>
      </div>
    </section>

    <section className="homeTalent homeSection" id="talent" aria-labelledby="talent-title">
      <div className="talentCopy">
        <h2 id="talent-title">Find talent</h2>
        <p>Browse people by what they&apos;ve done, not by keywords on a résumé. Filter by role, location and availability, then contact them directly.</p>
        <ul className="talentPoints">
          <li><b>See the work first</b>Results and projects on every profile</li>
          <li><b>Filter fast</b>Role, location, open to work</li>
          <li><b>Reach out directly</b>LinkedIn, X and email, no middlemen</li>
        </ul>
        <div className="homeHeroActions"><a className="homeHeroPrimary" href="/talent">Browse profiles</a><a className="homePowExample" href="/show-pow">Looking for work? Build your POW <span aria-hidden="true">↗</span></a></div>
      </div>
      <Suspense fallback={<div className="talentMock talentMockLoading" aria-hidden="true" />}><TalentMock /></Suspense>
    </section>

    <section className="homeWhy" aria-labelledby="why-title">
      <h2 id="why-title">Why this isn&apos;t like other <em>job boards.</em></h2>
      <div>
        <article><span>Hand-picked</span><p>Every role comes from a founder&apos;s or hiring team&apos;s own post, not scraped from other boards.</p></article>
        <article><span>Always current</span><p>Roles are removed after {DEFAULT_TTL_DAYS} days, so everything here is still hiring.</p></article>
        <article><span>Direct</span><p>You apply on the founder&apos;s post. No portals, no recruiters in between.</p></article>
        <article><span>Proof over résumés</span><p>Profiles show results and projects, so founders see what you&apos;ve actually done.</p></article>
      </div>
    </section>

    <footer className="homeFooter">
      <div><span>getajob</span><p>The startup talent network</p></div>
      <nav aria-label="Footer"><a href="/jobs">Jobs</a><a href="/show-pow">Build your POW</a></nav>
    </footer>
  </main>;
}
