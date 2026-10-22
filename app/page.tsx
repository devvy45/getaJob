import { Suspense } from "react";
import { fetchJobs, pickFeaturedJobs } from "../lib/jobs";

const fallbackJobs = [
  { id: "krea-founding-engineer", company: "Krea", role: "Founding Engineer", location: "San Francisco / Remote", postedAt: "2d ago" },
  { id: "vercel-devex", company: "Vercel", role: "Developer Experience", location: "Remote", postedAt: "3d ago" },
  { id: "posthog-product-engineer", company: "PostHog", role: "Product Engineer", location: "Remote", postedAt: "5d ago" },
  { id: "razorpay-product-manager", company: "Razorpay", role: "Product Manager, New Bets", location: "Bengaluru", postedAt: "6d ago" },
];

async function FeaturedJobs() {
  const allJobs = await fetchJobs();
  const featured = pickFeaturedJobs(allJobs);
  const displayJobs = featured.length ? featured : fallbackJobs;
  return <div className="homeJobsList">{displayJobs.map((job) => <a className="homeJob" href="/jobs" key={job.id}><span>{job.company}</span><strong>{job.role}</strong><small>{job.location}</small><i>{job.postedAt} ↗</i></a>)}</div>;
}

function FeaturedJobsLoading() {
  return <div className="homeJobsList" aria-busy="true" aria-label="Loading jobs">{[0, 1, 2, 3].map((row) => <div className="homeJob homeJobLoading" key={row}><span /><strong /><small /><i /></div>)}</div>;
}

export default function Home() {
  return <main className="homePage">
    <section className="homeHero"><div className="homeOrb homeOrbOne" /><div className="homeOrb homeOrbTwo" /><div className="homeOrb homeOrbThree" />
      <nav className="homeNav" aria-label="Primary navigation"><a className="homeLogo" href="/">getajob</a><div className="homeNavLinks"><a href="/jobs">Jobs</a><a href="/talent">Talent</a></div></nav>
      <div className="homeHeroCopy"><p className="homeEyebrow">High signal / low noise</p><h1>Find your <em>asymmetry.</em></h1><p>Curated high-growth roles from early teams and startups, directly sourced from founders and hiring teams.</p><a className="homeHeroCta" href="/show-pow">Build your POW <span>→</span></a></div>
    </section>
    <section className="homeJobs" id="active-jobs"><header><div><p className="homeEyebrow">The current signal</p><h2>Active jobs</h2></div><p>Hand-picked roles from the board.</p></header><Suspense fallback={<FeaturedJobsLoading />}><FeaturedJobs /></Suspense><a className="homeViewAll" href="/jobs">View all jobs <span>→</span></a></section>
    <section className="homeWhy"><p className="homeEyebrow">High signal by design</p><h2>Why this isn&apos;t like other <em>job portals.</em></h2><div><article><span>01</span><p>Every role is manually curated from founders and hiring teams—not scraped from job boards.</p></article><article><span>02</span><p>Roles expire quickly, so the board stays current and actionable.</p></article><article><span>03</span><p>No spam, no fake listings, and no endless pages of roles that lead nowhere.</p></article></div></section>
    <footer className="homeFooter"><div><span>getajob</span><p>High signal roles. Proof-first talent.</p></div></footer>
  </main>;
}
