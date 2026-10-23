import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchJobs } from "../../../lib/jobs";
import styles from "../jobs.module.css";
import ShareButton from "../../share-button";
import SiteNav from "../../components/site-nav";

type Params = Promise<{ id: string }>;

async function getJob(id: string) {
  const jobs = await fetchJobs();
  return { job: jobs.find((j) => j.id === id), jobs };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const { job } = await getJob(id);
  if (!job) return { title: "Role not found" };
  return { title: `${job.role} at ${job.company}`, description: job.excerpt };
}

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const { job, jobs } = await getJob(id);
  if (!job) notFound();

  const more = jobs.filter((j) => j.id !== job.id).slice(0, 4);

  return (
    <>
    <SiteNav />
    <main className={styles.page}>

      <a className={styles.back} href="/jobs"><span aria-hidden="true">←</span> All jobs</a>

      <div className={styles.detail}>
        <article className={styles.detailMain} itemScope itemType="https://schema.org/JobPosting">
          <div className={styles.person}>
            <div className={styles.avatar} style={{ backgroundColor: job.accent }} aria-hidden="true">{job.initials}</div>
            <div className={styles.personInfo}><h2>{job.personName}</h2><p>{job.personHeadline}</p></div>
            <time className={styles.posted}>{job.postedAt}</time>
          </div>
          <div className={styles.role}>
            <h3 itemProp="title">{job.role}</h3>
            <p className={styles.meta}><span>{job.company}</span><span>{job.location}</span><span>{job.category}</span></p>
          </div>
          <p className={styles.excerpt} itemProp="description">{job.excerpt}</p>
          <div className={styles.detailActions}>
            <a className={styles.apply} href={job.sourceUrl} target="_blank" rel="noopener noreferrer">Apply on the original post <span aria-hidden="true">↗</span></a>
            <ShareButton jobId={job.id} className={styles.share} company={job.company} role={job.role} />
          </div>
          <p className={styles.detailNote}>You&apos;ll apply directly with {job.personName.split(" ")[0]}. getajob never sits in between.</p>
        </article>

        {more.length > 0 && (
          <aside className={styles.more} aria-label="More open roles">
            <h4>More open roles</h4>
            <ul>
              {more.map((j) => (
                <li key={j.id}><a href={`/jobs/${j.id}`}><strong>{j.role}</strong><span>{j.company} · {j.location}</span></a></li>
              ))}
            </ul>
            <a className={styles.moreAll} href="/jobs">See all {jobs.length} roles</a>
          </aside>
        )}
      </div>

      <footer className={styles.footer}>
        <span>getajob</span>
        <p>High signal roles. Proof-first talent.</p>
      </footer>
    </main>
    </>
  );
}
