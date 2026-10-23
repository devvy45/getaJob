"use client";

import { Suspense, use, useMemo, useState } from "react";
import type { Job } from "../../lib/jobs";
import { JOB_CATEGORIES } from "../../lib/jobs";
import ShareButton from "../share-button";
import SiteNav from "../components/site-nav";
import styles from "./jobs.module.css";

const ALL = "All roles";

function JobCard({ job }: { job: Job }) {
  return <article className={styles.card} itemScope itemType="https://schema.org/JobPosting">
    <div className={styles.person}>
      <div className={styles.avatar} style={{ backgroundColor: job.accent }} aria-hidden="true">{job.initials}</div>
      <div className={styles.personInfo}><h2>{job.personName}</h2><p>{job.personHeadline}</p></div>
      <time className={styles.posted}>{job.postedAt}</time>
    </div>
    <div className={styles.role}>
      <h3 itemProp="title"><a href={`/jobs/${job.id}`}>{job.role}</a></h3>
      <p className={styles.meta}><span>{job.company}</span><span>{job.location}</span></p>
    </div>
    <p className={styles.excerpt} itemProp="description">{job.excerpt}</p>
    <div className={styles.cardFoot}>
      {job.isSample && <span className={styles.sampleTag}>Example</span>}
      <span className={styles.categoryTag}>{job.category}</span>
      <ShareButton jobId={job.id} className={styles.share} company={job.company} role={job.role} />
      <a className={styles.apply} href={job.sourceUrl} target="_blank" rel="noopener noreferrer">Apply <span aria-hidden="true">↗</span></a>
    </div>
  </article>;
}

function JobsBoard({ jobs: jobsPromise }: { jobs: Promise<Job[]> }) {
  const jobs = use(jobsPromise);
  const [category, setCategory] = useState(ALL);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const job of jobs) map.set(job.category, (map.get(job.category) || 0) + 1);
    return map;
  }, [jobs]);
  // Only show categories that currently have roles, so no filter leads to an empty board.
  const filters = [ALL, ...JOB_CATEGORIES.filter((c) => counts.has(c))];
  const visibleJobs = useMemo(() => jobs.filter((job) => category === ALL || job.category === category), [jobs, category]);
  const showingExamples = visibleJobs.length > 0 && visibleJobs.every((job) => job.isSample);

  return <>
    <div className={styles.controls}>
      <div className={styles.filters} role="group" aria-label="Filter by category">
        {filters.map((filter) => <button className={category === filter ? styles.selected : ""} aria-pressed={category === filter} onClick={() => setCategory(filter)} type="button" key={filter}>
          {filter}<small>{filter === ALL ? jobs.length : counts.get(filter)}</small>
        </button>)}
      </div>
      <span className={styles.sort}>{visibleJobs.length} {showingExamples ? "example" : "open"} {visibleJobs.length === 1 ? "role" : "roles"}, newest first</span>
    </div>
    <section className={styles.feed} aria-label="Job listings">
      {visibleJobs.map((job) => <JobCard job={job} key={job.id} />)}
      {!visibleJobs.length && <p className={styles.empty}>No open roles right now. Check back soon.</p>}
    </section>
  </>;
}

function JobsLoading() {
  return <section className={styles.feed} aria-busy="true" aria-label="Loading jobs">{[0, 1, 2, 3].map((card) => <div className={`${styles.card} ${styles.cardLoading}`} key={card} />)}</section>;
}

export default function JobsClient({ jobs }: { jobs: Promise<Job[]> }) {
  return <><SiteNav /><main className={styles.page}>
    <header className={styles.jobsHero}>
      <div><p className={styles.eyebrow}>Founder-posted roles</p><h1>Find the role that <em>moves you forward.</em></h1><p>Curated early-stage opportunities, directly from founders and hiring teams—not buried in job-board noise.</p></div>
      <a className={styles.powCta} href="/show-pow"><p>Build your POW</p><strong>A résumé says where you&apos;ve been. <em>POW</em> shows what you can do.</strong><small>Build a shareable profile around proof, outcomes, and the work you want to be hired for.</small><b aria-hidden="true">→</b></a>
    </header>
    <Suspense fallback={<JobsLoading />}><JobsBoard jobs={jobs} /></Suspense>
    <section className={styles.powClosing}><p>Tired of applying to hundreds of jobs and hearing nothing back?</p><h2>Build your POW—and give recruiters a reason to reach out.</h2><a href="/show-pow">Build your POW <span aria-hidden="true">→</span></a></section>
    <footer className={styles.footer}><span>getajob</span><p>High signal roles. Proof-first talent.</p></footer>
  </main></>;
}
