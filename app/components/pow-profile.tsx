"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import styles from "./pow-profile.module.css";
import { storyPoints } from "../../lib/story";

export { storyPoints };

export type PowProject = { name: string; story: string };
export type PowProfileData = {
  name: string;
  headline: string;
  location: string;
  status: string;
  positioning: string;
  proofs: string[];
  projects: PowProject[];
  linkedin?: string;
  x?: string;
  telegram?: string;
  email?: string;
  photoUrl?: string | null;
};

type Tab = "profile" | "work";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Y";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export default function PowProfile({ data, initialTab = "profile", action, footer, syncUrl = false }: {
  data: PowProfileData;
  initialTab?: Tab;
  action?: ReactNode;
  footer?: ReactNode;
  syncUrl?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const proofs = data.proofs.map((p) => p.trim()).filter(Boolean);
  const projects = data.projects.filter((p) => p.name.trim());
  const firstName = data.name.trim().split(/\s+/)[0] || "you";
  const open = data.status === "Open to work";
  const hiring = data.status === "Hiring";

  const choose = (next: Tab) => {
    setTab(next);
    if (syncUrl) {
      const url = new URL(window.location.href);
      if (next === "work") url.searchParams.set("view", "work"); else url.searchParams.delete("view");
      window.history.replaceState(null, "", url);
    }
    window.scrollTo({ top: 0 });
  };

  const links = [
    data.linkedin && { label: "LinkedIn", href: data.linkedin },
    data.x && { label: "X", href: data.x },
    data.telegram && { label: "Telegram", href: data.telegram },
    data.email && { label: "Email", href: `mailto:${data.email}` },
  ].filter(Boolean) as { label: string; href: string }[];

  return <main className={styles.page}>
    <nav className={styles.nav} aria-label="Profile navigation">
      <a className={styles.logo} href="/">getajob</a>
      <div className={styles.toggle} role="tablist" aria-label="Profile sections" data-tab={tab}>
        <span className={styles.thumb} aria-hidden="true" />
        <button role="tab" aria-selected={tab === "profile"} className={tab === "profile" ? styles.on : ""} onClick={() => choose("profile")} type="button">Profile</button>
        <button role="tab" aria-selected={tab === "work"} className={tab === "work" ? styles.on : ""} onClick={() => choose("work")} type="button">Work</button>
      </div>
      <div className={styles.action}>{action}</div>
    </nav>

    {tab === "profile" ? <section className={styles.profileView} key="profile">
      <div className={styles.intro}>
        <p className={styles.status}><span className={open ? styles.dotOpen : hiring ? styles.dotHiring : styles.dot} />{[data.status, data.location].filter(Boolean).join(" · ")}</p>
        <h1>Hi, I&apos;m {data.name.trim() || "you"}.</h1>
        {data.headline.trim() && <p className={styles.title}><mark>{data.headline}</mark></p>}
        {data.positioning.trim().length > 2 && <p className={styles.lede}>{data.positioning}</p>}
        {proofs.length > 0 && <>
          <h2 className={styles.label}>The short version</h2>
          <ul className={styles.proofs}>{proofs.map((proof) => <li key={proof}>{proof}</li>)}</ul>
        </>}
        {links.length > 0 && <div className={styles.links}>{links.map((link) => <a key={link.label} href={link.href} target={link.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">{link.label}</a>)}</div>}
        {projects.length > 0 && <button className={styles.seeWork} type="button" onClick={() => choose("work")}>See {firstName}&apos;s work <span aria-hidden="true">→</span></button>}
        {footer}
      </div>
      {data.photoUrl
        ? <img className={styles.photo} src={data.photoUrl} alt={`${data.name}`} />
        : <div className={styles.monogram} aria-hidden="true"><i /><i /><b>{initials(data.name)}</b></div>}
    </section> : <section className={styles.workView} key="work">
      <header>
        <h2 className={styles.label}>Selected work</h2>
        <h1>What {firstName === "you" ? "you've" : `${firstName} has`} built.</h1>
      </header>
      {projects.length ? <ol className={styles.projects}>{projects.map((project, index) => {
        const points = storyPoints(project.story);
        return <li key={`${project.name}-${index}`}>
          <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
          <h3>{project.name}</h3>
          {points.length > 0 && <ul>{points.map((point) => <li key={point}>{point}</li>)}</ul>}
        </li>;
      })}</ol> : <p className={styles.lede}>No projects added yet.</p>}
      {footer}
    </section>}
  </main>;
}
