"use client";

import { Suspense, use, useMemo, useState } from "react";
import type { Job } from "../../lib/jobs";
import { JOB_CATEGORIES } from "../../lib/jobs";
import ShareButton from "../share-button";
import styles from "./jobs.module.css";

const filters = ["All roles", ...JOB_CATEGORIES];

function JobsBoard({ jobs: jobsPromise }: { jobs: Promise<Job[]> }) {
  const jobs = use(jobsPromise);
  const [category, setCategory] = useState("All roles");
  const visibleJobs = useMemo(() => jobs.filter((job) => category === "All roles" || job.category === category), [jobs, category]);
  const showingExamples = visibleJobs.length > 0 && visibleJobs.every((job) => job.isSample);

  return <>
    <div className={styles.controls}><div className={styles.filters} aria-label="Job categories">{filters.map((filter) => <button className={category === filter ? styles.selected : ""} onClick={() => setCategory(filter)} type="button" key={filter}>{filter}</button>)}</div><span className={styles.sort}><b>{visibleJobs.length}</b> {showingExamples ? "example roles" : "active roles"} · latest first</span></div>
    <section className={styles.layout} aria-label="Job listings"><div className={styles.feed}>{visibleJobs.map((job) => <article className={styles.card} key={job.id} itemScope itemType="https://schema.org/JobPosting"><div className={styles.person}><div className={styles.avatar} style={{ backgroundColor: job.accent }}>{job.initials}</div><div className={styles.personInfo}><h2>{job.personName}</h2><p>{job.personHeadline}</p><span>{job.postedAt}</span></div><a className={styles.apply} href={job.sourceUrl} target="_blank" rel="noopener noreferrer">Apply <span>↗</span></a></div><div className={styles.rule} /><div className={styles.role}><p className={styles.roleLabel}>Hiring now</p><h3 itemProp="title">{job.role}</h3><p className={styles.meta}>{job.company} · {job.location}</p></div><p className={styles.excerpt} itemProp="description">{job.excerpt}</p><div className={styles.cardFoot}>{job.isSample && <span className={styles.sampleTag}>Example</span>}<span className={styles.categoryTag}>{job.category}</span><ShareButton jobId={job.id} className={styles.share} company={job.company} role={job.role} /></div></article>)}{!visibleJobs.length && <p className={styles.empty}>No active roles in this category right now. Check back soon.</p>}</div></section>
  </>;
}

function JobsLoading() {
  return <section className={styles.layout} aria-busy="true" aria-label="Loading jobs"><div className={styles.feed}>{[0, 1, 2, 3].map((card) => <div className={`${styles.card} ${styles.cardLoading}`} key={card} />)}</div></section>;
}

export default function JobsClient({ jobs }: { jobs: Promise<Job[]> }) {
  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Primary navigation"><a className={styles.logo} href="/jobs">getajob</a><div className={styles.navLinks}><a className={styles.active} href="/jobs">Jobs</a><a href="/talent">Talent</a></div></nav>
    <header className={styles.jobsHero}><div><p className={styles.eyebrow}>Founder-posted roles</p><h1>Find the role that <em>moves you forward.</em></h1><p>Curated early-stage opportunities, directly from founders and hiring teams—not buried in job-board noise.</p></div><a className={styles.powCta} href="/show-pow"><p>Build your POW</p><strong>A résumé says where you&apos;ve been. <em>POW</em> shows what you can do.</strong><small>Build a shareable profile around proof, outcomes, and the work you want to be hired for.</small><b>→</b></a></header>
    <Suspense fallback={<JobsLoading />}><JobsBoard jobs={jobs} /></Suspense>
    <section className={styles.powClosing}><p>Tired of applying to hundreds of jobs and hearing nothing back?</p><h2>Build your POW—and give recruiters a reason to reach out.</h2><a href="/show-pow">Build your POW <span>→</span></a></section>
    <footer className={styles.footer}><span>getajob</span><p>High signal roles. Proof-first talent.</p></footer>
  </main>;
}
