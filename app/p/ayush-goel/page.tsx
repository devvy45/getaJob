import type { Metadata } from "next";
import styles from "./profile.module.css";

export const metadata: Metadata = {
  title: "Ayush Goel — POW profile | getajob",
  description: "Founder and growth operator building products, communities, and growth engines for early-stage tech startups.",
};

const proof = ["Building GetAJob, a proof-first talent network.", "Built EigenTribe from 0 → 1,000+ members.", "Led 16+ developer events across 7 countries.", "Helped generate 1M+ organic impressions around EigenLayer.", "Open to Growth, GTM, Community, Product Marketing, and Partnerships roles."];
const structuredData = { "@context": "https://schema.org", "@type": "Person", name: "Ayush Goel", jobTitle: "Founder, GetAJob | Growth & GTM", description: "I build products, communities, and growth engines for early-stage tech startups.", address: { "@type": "PostalAddress", addressLocality: "Delhi NCR, India" }, sameAs: ["https://www.linkedin.com/in/ayushhgoel7/", "https://x.com/ayushhgoel7", "https://t.me/ayushhgoel7"] };

export default function AyushProfile() {
  return <main className={styles.page} itemScope itemType="https://schema.org/Person">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <nav className={styles.nav} aria-label="Profile navigation"><a className={styles.logo} href="/jobs">getajob</a><div className={styles.tabs}><a className={styles.selected} href="#profile">Profile</a><a href="#work">Work</a></div><a className={styles.share} href="/jobs">Jobs</a></nav>
    <section className={styles.profileView} id="profile"><div className={styles.intro}><p className={styles.kicker} itemProp="jobTitle">Founder, GetAJob · Growth &amp; GTM</p><h1>Hi, I&apos;m <span itemProp="name">Ayush</span>.</h1><p className={styles.lede} itemProp="description">I build products, communities, and growth engines for early-stage tech startups.</p><p className={styles.label}>The short version</p><ul className={styles.summary}>{proof.map((item) => <li key={item}>{item}</li>)}</ul><div className={styles.meta}><a href="https://www.linkedin.com/in/ayushhgoel7/" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://x.com/ayushhgoel7" target="_blank" rel="noreferrer">𝕏</a><a href="https://t.me/ayushhgoel7" target="_blank" rel="noreferrer">Telegram</a><a href="mailto:ayushgoyal1124@gmail.com">Email</a><span>Delhi NCR, India · Open to work</span></div></div><img className={styles.photo} src="/profiles/ayush-goel.png" alt="Ayush Goel" itemProp="image" /></section>
    <section className={styles.workView} id="work"><div><p className={styles.kicker}>Selected work</p><h1>Things I&apos;ve built.</h1></div><article><span>01</span><div><h2>GetAJob</h2><p>Founder · 2026—Present</p></div><strong>Building a proof-first talent network from a curated jobs product.</strong></article><article><span>02</span><div><h2>EigenTribe / EigenLayer</h2><p>Community Lead · 2025—2026</p></div><strong>Built a global developer community, ecosystem programs, and growth loops.</strong></article><div className={styles.outcomes}><span>1,000+ members</span><span>16+ events</span><span>7 countries</span><span>1M+ impressions</span></div></section>
  </main>;
}
