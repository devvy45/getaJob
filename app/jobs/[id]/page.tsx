import { notFound } from "next/navigation";
import { fetchJobs } from "../../../lib/jobs";
import styles from "../jobs.module.css";
import ShareButton from "../../share-button";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const jobs = await fetchJobs();
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Primary navigation">
        <a className={styles.logo} href="/">getajob</a>
        <div className={styles.navLinks}>
          <a className={styles.active} href="/jobs">Jobs</a>
          <a href="/talent">Talent</a>
        </div>
      </nav>
      <div style={{ paddingBottom: 47, fontSize: 14, color: "#bda596" }}>
        <a href="/jobs" style={{ color: "#ff9674" }}>← All jobs</a>
      </div>
      <div style={{ maxWidth: 720 }}>
        <article className={styles.card} style={{ minHeight: 0 }}>
          <div className={styles.person}>
            <div className={styles.avatar} style={{ backgroundColor: job.accent }}>
              {job.initials}
            </div>
            <div>
              <h2>{job.personName}</h2>
              <p>{job.personHeadline}</p>
              <span>{job.postedAt}</span>
            </div>
            <a
              className={styles.corner}
              href={job.sourceUrl}
              aria-label={`Open ${job.personName}'s original post`}
            >
              ↗
            </a>
          </div>
          <div className={styles.rule} />
          <div className={styles.role}>
            <p className={styles.roleLabel}>Hiring for</p>
            <h3>{job.role}</h3>
            <p className={styles.meta}>
              {job.company} · {job.location} · {job.category}
            </p>
          </div>
          <p className={styles.excerpt}>{job.excerpt}</p>
          <div className={styles.cardActions}>
            <a className={styles.action} href={job.sourceUrl}>
              View original post <span>↗</span>
            </a>
            <ShareButton
              jobId={job.id}
              className={styles.share}
              company={job.company}
              role={job.role}
            />
          </div>
        </article>
      </div>
      <footer className={styles.footer}>
        <span>getajob</span>
        <p>High signal roles for asymmetric career bets.</p>
      </footer>
    </main>
  );
}
