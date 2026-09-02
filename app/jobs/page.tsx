"use client";

import { useEffect, useMemo, useState } from "react";
import type { Job } from "../../lib/jobs";
import { JOB_CATEGORIES } from "../../lib/jobs";
import ShareButton from "../share-button";
import styles from "./jobs.module.css";

const filters = ["All roles", ...JOB_CATEGORIES];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All roles");
  const [talentPoolOpen, setTalentPoolOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => setJobs(data.jobs ?? []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const visibleJobs = useMemo(
    () =>
      jobs
        .filter((job) => category === "All roles" || job.category === category)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [jobs, category],
  );

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Primary navigation">
        <a className={styles.logo} href="/">getajob</a>
        <div className={styles.navLinks}>
          <a className={styles.active} href="/jobs">Jobs</a>
          <a href="/#about">About</a>
        </div>
      </nav>
      <div className={styles.controls}>
        <div className={styles.filters} aria-label="Job categories">
          {filters.map((filter) => (
            <button
              className={category === filter ? styles.selected : ""}
              onClick={() => setCategory(filter)}
              type="button"
              key={filter}
            >
              {filter}
            </button>
          ))}
        </div>
        <span className={styles.sort}>
          Sorted by <b>latest</b>
        </span>
      </div>
      <div className={styles.layout}>
        <section className={styles.feed} aria-label="Job listings">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <article className={styles.card} key={`skeleton-${i}`}>
                <div className={styles.person}>
                  <div className={styles.avatar} style={{ backgroundColor: "#3d3430" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 18, width: "60%", background: "#3d3430", borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 14, width: "40%", background: "#3d3430", borderRadius: 4 }} />
                  </div>
                </div>
              </article>
            ))}
          {!loading &&
            visibleJobs.map((job) => (
              <article className={styles.card} key={job.id}>
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
                    className={styles.share}
                    company={job.company}
                    role={job.role}
                  />
                </div>
              </article>
            ))}
          {!loading && visibleJobs.length === 0 && (
            <p className={styles.empty}>
              No active roles in this category right now. Check back soon.
            </p>
          )}
        </section>
        <aside className={styles.sidebar}>
          <section>
            <h2>
              Not seeing the right <em>bet?</em>
            </h2>
            <p>
              Join the talent pool. When a curated role matches your profile,
              we&apos;ll reach out directly.
            </p>
            <button
              className={styles.sideAction}
              type="button"
              onClick={() => {
                setSubmitted(false);
                setTalentPoolOpen(true);
              }}
            >
              Join the talent pool <span>→</span>
            </button>
          </section>
          <section>
            <h3>Want to reach out?</h3>
            <p>
              Looking for a referral, or hiring for an early team? Send the role
              or context and I&apos;ll help where I can.
            </p>
            <div className={styles.contactLinks}>
              <a
                href="https://t.me/ayushhgoel7"
                target="_blank"
                rel="noreferrer"
                aria-label="Message Ayush on Telegram"
              >
                ◢ Telegram
              </a>
              <a
                href="https://x.com/ayushhgoel7"
                target="_blank"
                rel="noreferrer"
                aria-label="Message Ayush on X"
              >
                𝕏 X
              </a>
              <a
                href="mailto:ayushgoyal1124@gmail.com"
                aria-label="Email Ayush"
              >
                ✉ Email
              </a>
            </div>
          </section>
        </aside>
      </div>
      {talentPoolOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={() => setTalentPoolOpen(false)}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="talent-pool-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className={styles.close}
              type="button"
              onClick={() => setTalentPoolOpen(false)}
              aria-label="Close talent pool form"
            >
              ×
            </button>
            {submitted ? (
              <div className={styles.success}>
                <p className={styles.eyebrow}>You&apos;re in the pool</p>
                <h2 id="talent-pool-title">
                  We&apos;ll keep an eye out for your next <em>bet.</em>
                </h2>
                <p>
                  We&apos;ll reach out when a role that fits comes through.
                </p>
                <button
                  className={styles.done}
                  type="button"
                  onClick={() => setTalentPoolOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className={styles.eyebrow}>getajob talent pool</p>
                <h2 id="talent-pool-title">
                  Make your next <em>bet</em> count.
                </h2>
                <p>
                  Share your profile. When a relevant high-signal role comes up,
                  we&apos;ll reach out directly.
                </p>
                <form
                  className={styles.talentForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    fetch(
                      "https://docs.google.com/forms/d/e/1FAIpQLSddYhzZcxiVpui3UDOQo6Qhjfy7Cpz0QWl5AOjZ_OmC6uPVVg/formResponse",
                      {
                        method: "POST",
                        mode: "no-cors",
                        body: new FormData(event.currentTarget),
                      },
                    );
                    setSubmitted(true);
                  }}
                >
                  <div className={styles.twoFields}>
                    <label>
                      Name
                      <input name="entry.1600574984" required />
                    </label>
                    <label>
                      Email
                      <input name="entry.199455003" type="email" required />
                    </label>
                  </div>
                  <label>
                    LinkedIn URL
                    <input
                      name="entry.1081885048"
                      type="url"
                      placeholder="linkedin.com/in/you"
                      required
                    />
                  </label>
                  <label>
                    Current role / company
                    <input name="entry.2124011543" required />
                  </label>
                  <fieldset>
                    <legend>Roles you&apos;re looking for</legend>
                    <div className={styles.checks}>
                      {[
                        "Engineering",
                        "Product",
                        "Design",
                        "Growth",
                        "Marketing",
                        "Operations",
                        "HR / People",
                        "Sales / GTM",
                        "Founder's office",
                      ].map((role) => (
                        <label key={role}>
                          <input
                            type="checkbox"
                            name="entry.1270492965"
                            value={role}
                          />
                          {role}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label>
                    Anything else?
                    <textarea
                      name="entry.2049024585"
                      rows={3}
                      placeholder="Preferences, location, open to..."
                    />
                  </label>
                  <button className={styles.action} type="submit">
                    Submit <span>→</span>
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
      <footer className={styles.footer}>
        <span>getajob</span>
        <p>High signal roles for asymmetric career bets.</p>
      </footer>
    </main>
  );
}
