import { fetchJobs, pickFeaturedJobs } from "../lib/jobs";
import ShareButton from "./share-button";

const fallbackJobs = [
  { company: "Krea", role: "Founding Engineer", location: "San Francisco", postedAt: "2d ago" },
  { company: "Vercel", role: "Developer Experience", location: "Remote", postedAt: "3d ago" },
  { company: "PostHog", role: "Product Engineer", location: "Remote", postedAt: "5d ago" },
  { company: "Razorpay", role: "Product Manager, New Bets", location: "Bengaluru", postedAt: "6d ago" },
];

export default async function Home() {
  const allJobs = await fetchJobs();
  const featured = pickFeaturedJobs(allJobs);

  const displayJobs =
    featured.length > 0
      ? featured.map((j) => ({ company: j.company, role: j.role, location: j.location, postedAt: j.postedAt }))
      : fallbackJobs;

  return <main>
  <section className="hero"><div className="orb orb-one" /><div className="orb orb-two" /><div className="orb orb-three" />
    <nav className="nav" aria-label="Primary navigation"><a className="logo" href="/">getajob</a><div className="nav-links"><a className="active" href="/jobs">Jobs</a><a href="#about">About</a></div></nav>
    <div className="hero-copy"><p className="eyebrow">High signal / low noise</p><h1>Find your <em>asymmetry.</em></h1><p className="lede">Curated high-growth roles from early teams and startups, directly sourced from founders and hiring teams.</p></div>
  </section>
  <section className="jobs" id="active-jobs"><header className="jobs-header"><div><p className="eyebrow">The current signal</p><h2>Active jobs</h2></div><p>Hand-picked roles from the board.</p></header><div className="jobs-list">{displayJobs.map((job) => <div className="job" key={`${job.company}-${job.role}`}><a href="/jobs" style={{display:'contents'}}><span className="company">{job.company}</span><span className="role">{job.role}</span><span className="place">{job.location}</span><span className="age">{job.postedAt} ↗</span></a><ShareButton company={job.company} role={job.role} className="share-inline" /></div>)}</div><a className="view-all" href="/jobs">View all jobs <span>→</span></a></section>
  <section className="why" id="about"><p className="eyebrow">High signal by design</p><h2>Why this isn&apos;t like other <em>job portals.</em></h2><div className="reasons"><div><span>01</span><p>Every role is manually curated from founders and hiring teams—not scraped from job boards.</p></div><div><span>02</span><p>No listing stays live for more than 10 days, so the board stays current and actionable.</p></div><div><span>03</span><p>No spam, no fake listings, and no endless pages of roles that lead nowhere.</p></div></div></section>
  <footer><div><span>getajob</span><p>High signal roles for asymmetric career bets.</p></div></footer>
</main>;
}
