import Link from "next/link";
import { getLandingJobsPreview } from "@/lib/jobs-data";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { total, preview } = await getLandingJobsPreview();

  const since = new Date();
  since.setMonth(since.getMonth() - 1);
  const sinceStr = since.toISOString().split('T')[0];
  const twitterQuery = `(hiring OR "we're hiring" OR "looking for") (engineer OR designer OR developer OR marketer OR intern OR "full-stack") min_retweets:3 min_faves:26 -filter:retweets lang:en since:${sinceStr}`;
  const twitterUrl = `https://twitter.com/search?q=${encodeURIComponent(twitterQuery)}&f=live`;

  return (
    <main className="min-h-screen bg-[#d7cec6] px-4 py-4 text-[#121417] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <section className="mx-auto w-full max-w-[1550px] rounded-[1.2rem] border border-black/8 bg-[#d5ccc3] px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <h1 className="font-[family-name:var(--font-manrope)] text-[2.6rem] font-black uppercase leading-[0.88] tracking-[-0.04em] text-[#0f1115] sm:text-[4.4rem] lg:text-[7.4rem]">
              curated
              <br />
              high growth
              <br />
              roles
            </h1>
            <p className="mt-8 max-w-[660px] font-[family-name:var(--font-instrument-serif)] text-xl font-bold leading-[1.38] tracking-[-0.01em] text-[#121417] sm:text-[1.55rem] lg:text-[1.75rem]">
              Find roles from early team and recently funded startups where your work will matter.
            </p>
          </div>

          <div className="pb-2">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-black/65">
              high signal / low noise
            </p>
            <p className="mt-6 max-w-[560px] font-mono text-[0.82rem] uppercase leading-[1.65] tracking-[0.06em] text-black/50">
              built for people looking for asymmetric career bets.
              <br />
              optimizing for ownership, upside, and faster learning.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start gap-3 sm:flex-row sm:items-end justify-between sm:gap-5 border-b-[3px] border-black pb-4">
          <p className="font-mono text-[1.2rem] font-bold uppercase tracking-[0.08em] text-[#0f1115]">
            Active Jobs
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-black/55">
            total entries: {total.toLocaleString("en-US")}
          </p>
        </div>

        <div className="mt-7 space-y-0">
          {preview.map((job, index) => (
            <article
              key={job.id}
              className={`grid gap-6 border-b border-black/10 px-0 py-9 lg:grid-cols-[1.65fr_0.95fr_0.7fr] lg:items-center ${index === 0 ? "bg-white/16 px-5" : ""
                }`}
            >
              <div>
                <p className="font-mono text-[0.72rem] uppercase tracking-[0.1em] text-black/50">
                  {job.company}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-instrument-serif)] text-[1.7rem] font-bold leading-[1.08] tracking-[-0.02em] text-[#0f1115] sm:text-[2rem]">
                  {job.title}
                </h2>
              </div>

              <div className="font-mono">
                <p className="text-[0.72rem] uppercase tracking-[0.1em] text-black/45">location</p>
                <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-[1.45rem] font-semibold leading-tight tracking-[-0.02em] text-[#0f1115] sm:text-[1.65rem]">
                  {job.location || "Remote"}
                </p>
              </div>

              <div className="mt-4 w-full lg:mt-0 lg:justify-self-end lg:w-auto">
                <Link
                  href={job.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full sm:w-auto h-11 min-w-[10rem] items-center justify-center bg-black px-6 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[#ece7df]"
                >
                  apply
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 w-full">
          <Link
            href="/jobs"
            className="inline-flex h-14 w-full sm:w-auto sm:min-w-[22rem] items-center justify-center bg-black px-10 font-mono text-[0.82rem] uppercase tracking-[0.14em] text-[#ece7df]"
          >
            view all jobs
          </Link>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a
              href="https://www.workatastartup.com/jobs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full sm:w-auto h-11 sm:min-w-[14rem] items-center justify-center border border-black/20 bg-transparent px-6 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-[#0f1115] transition-colors hover:bg-black hover:text-[#ece7df]"
            >
              Work at YC startups
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full sm:w-auto h-11 sm:min-w-[14rem] items-center justify-center border border-black/20 bg-transparent px-6 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-[#0f1115] transition-colors hover:bg-black hover:text-[#ece7df]"
            >
              Find jobs on Twitter
            </a>
          </div>
        </div>

        <footer className="mt-16 grid gap-12 border-t border-black/14 pt-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <h3 className="font-[family-name:var(--font-manrope)] text-[2.6rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-[#0f1115] sm:text-[4.2rem]">
              optimize for
              <br />
              asymmetry.
            </h3>
            <p className="mt-6 max-w-[820px] font-mono text-[0.85rem] uppercase leading-[1.7] tracking-[0.06em] text-black/50">
              most roles are linear growth.
              <br />
              early startup bets are exponential.
              <br />
              we only list the latter.
            </p>
          </div>

          <div className="text-right">
            <div className="ml-auto h-20 w-44 bg-[repeating-linear-gradient(90deg,#0f1115_0_9px,transparent_9px_12px)]" />
            <p className="mt-5 font-mono text-[0.72rem] uppercase tracking-[0.06em] text-black/55">
              Asymmetric Jobs © 2026
              <br />
              all rights reserved.
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}
