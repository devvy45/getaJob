"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./show-pow.module.css";
import profileStyles from "../p/ayush-goel/profile.module.css";
import { supabase } from "../../lib/supabase";

type Project = { name: string; story: string };
type ImportedProfile = {
  name: string; headline: string; location: string; positioning: string; proofs: string[]; projects: Project[];
  linkedin: string; twitter: string; telegram: string; email: string;
};
const steps = ["About you", "Your proof", "Your work"];

export default function ShowPowPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(false);
  const [previewTab, setPreviewTab] = useState<"profile" | "work">("profile");
  const [validationMessage, setValidationMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [photo, setPhoto] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [publishState, setPublishState] = useState<"idle" | "working" | "error">("idle");
  const [publishMessage, setPublishMessage] = useState("");
  const [restoreComplete, setRestoreComplete] = useState(false);
  const [shouldAutoPublish, setShouldAutoPublish] = useState(false);
  const [autoPublishStarted, setAutoPublishStarted] = useState(false);
  const [existingSlug, setExistingSlug] = useState("");
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null);
  const [resumeState, setResumeState] = useState<"idle" | "reading" | "error" | "done">("idle");
  const [resumeMessage, setResumeMessage] = useState("");
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(""); const [headline, setHeadline] = useState(""); const [location, setLocation] = useState(""); const [status, setStatus] = useState("Open to work");
  const [discoverable, setDiscoverable] = useState(false);
  const [linkedin, setLinkedin] = useState(""); const [twitter, setTwitter] = useState(""); const [telegram, setTelegram] = useState(""); const [email, setEmail] = useState("");
  const [positioning, setPositioning] = useState(""); const [proofs, setProofs] = useState(["", "", ""]); const [projects, setProjects] = useState<Project[]>([{ name: "", story: "" }]);
  const changePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
    setPhotoFile(file);
  };
  const updateProof = (index: number, value: string) => setProofs((current) => current.map((proof, i) => i === index ? value : proof));
  const updateProject = (index: number, key: keyof Project, value: string) => setProjects((current) => current.map((project, i) => i === index ? { ...project, [key]: value } : project));
  const importResume = async (event: ChangeEvent<HTMLInputElement>) => {
    const resume = event.target.files?.[0];
    if (!resume) return;
    setResumeState("reading");
    setResumeMessage("");
    setInvalidFields([]);
    const body = new FormData();
    body.append("resume", resume);
    try {
      const response = await fetch("/api/pow-prefill", { method: "POST", body });
      const result = await response.json() as { profile?: ImportedProfile; error?: string };
      if (!response.ok || !result.profile) throw new Error(result.error || "We could not read that résumé. You can fill the form manually.");
      const profile = result.profile;
      setName(profile.name || name);
      setHeadline(profile.headline || headline);
      setLocation(profile.location || location);
      setPositioning(profile.positioning || positioning);
      if (profile.proofs.length) setProofs([...profile.proofs.slice(0, 4), ...Array(Math.max(0, 3 - profile.proofs.length)).fill("")]);
      if (profile.projects.length) setProjects(profile.projects.slice(0, 3));
      setLinkedin(profile.linkedin || linkedin);
      setTwitter(profile.twitter || twitter);
      setTelegram(profile.telegram || telegram);
      setEmail(profile.email || email);
      setResumeState("done");
      setResumeMessage("Details added from your résumé. Review every field before continuing.");
    } catch (error) {
      setResumeState("error");
      setResumeMessage(error instanceof Error ? error.message : "We could not read that résumé. You can fill the form manually.");
    } finally {
      event.target.value = "";
    }
  };
  const validateStep = () => {
    const missing: string[] = [];
    if (step === 0) {
      if (!name.trim()) missing.push("name");
      if (!headline.trim()) missing.push("headline");
      if (!location.trim()) missing.push("location");
    }
    if (step === 1) {
      if (!positioning.trim()) missing.push("positioning");
      proofs.slice(0, 3).forEach((proof, index) => { if (!proof.trim()) missing.push(`proof-${index}`); });
    }
    if (step === 2) {
      const hasContact = [linkedin, twitter, telegram, email].some((value) => value.trim());
      if (!projects[0]?.name.trim()) missing.push("project-name");
      if (!projects[0]?.story.trim()) missing.push("project-story");
      if (!hasContact) missing.push("contact");
      if (!discoverable) missing.push("discoverable");
      const urls = [linkedin, twitter, telegram].filter(Boolean);
      if (urls.some((value) => !/^https:\/\/[^\s]+$/i.test(value))) { setInvalidFields(["contact"]); setValidationMessage("Use complete URLs starting with https:// for LinkedIn, X, or Telegram."); return false; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setInvalidFields(["contact"]); setValidationMessage("Enter a valid email address."); return false; }
    }
    setInvalidFields(missing);
    if (missing.length) { setValidationMessage("Please fill all mandatory fields."); return false; }
    setValidationMessage(""); return true;
  };
  const continueStep = () => { if (!validateStep()) return; step === 2 ? setPreview(true) : setStep((current) => current + 1); };
  const publishProfile = async () => {
    if (!supabase) { setPublishState("error"); setPublishMessage("Supabase is not configured yet."); return; }
    setPublishState("working"); setPublishMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      try {
        window.sessionStorage.setItem("getajob-pow-draft", JSON.stringify({ name, headline, location, status, discoverable, linkedin, twitter, telegram, email, positioning, proofs, projects, photo, autoPublish: true }));
      } catch {
        setPublishState("error"); setPublishMessage("Your draft could not be kept during sign-in. Please try again with a smaller photo."); return;
      }
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });
      if (error) { setPublishState("error"); setPublishMessage("Google sign-in needs to be enabled in Supabase first."); }
      return;
    }
    let photoPath: string | null = existingPhotoPath;
    const fileToUpload = photoFile || (photo && !existingPhotoPath ? new File([await (await fetch(photo)).blob()], "profile-photo.jpg", { type: "image/jpeg" }) : null);
    if (fileToUpload) {
      const extension = fileToUpload.name.split(".").pop() || "jpg";
      photoPath = `${user.id}/avatar-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from("profile-photos").upload(photoPath, fileToUpload, { upsert: true });
      if (error) { setPublishState("error"); setPublishMessage("Your photo could not be uploaded. Please try again."); return; }
    }
    const slugBase = (name || user.email || "profile").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "profile";
    const slug = existingSlug || `${slugBase}-${user.id.slice(0, 6)}`;
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, slug, full_name: name || "Your name", headline, location, status, positioning, linkedin_url: linkedin, x_url: twitter, telegram_url: telegram, email, photo_path: photoPath, is_published: true, is_discoverable: discoverable, updated_at: new Date().toISOString() });
    if (profileError) { setPublishState("error"); setPublishMessage("Your profile could not be saved yet. Please try again."); return; }
    await supabase.from("profile_proof_points").delete().eq("profile_id", user.id);
    await supabase.from("profile_projects").delete().eq("profile_id", user.id);
    const proofRows = proofs.filter(Boolean).map((content, index) => ({ profile_id: user.id, position: index + 1, content }));
    const projectRows = projects.filter((project) => project.name).map((project, index) => ({ profile_id: user.id, position: index + 1, name: project.name, story: project.story }));
    if (proofRows.length) await supabase.from("profile_proof_points").insert(proofRows);
    if (projectRows.length) await supabase.from("profile_projects").insert(projectRows);
    window.sessionStorage.removeItem("getajob-pow-draft");
    window.location.href = `/p/${slug}`;
  };
  useEffect(() => {
    const saved = window.sessionStorage.getItem("getajob-pow-draft");
    if (!saved) { setRestoreComplete(true); return; }
    try {
      const draft = JSON.parse(saved);
      setName(draft.name || ""); setHeadline(draft.headline || ""); setLocation(draft.location || ""); setStatus(draft.status || "Open to work"); setDiscoverable(Boolean(draft.discoverable)); setLinkedin(draft.linkedin || ""); setTwitter(draft.twitter || ""); setTelegram(draft.telegram || ""); setEmail(draft.email || ""); setPositioning(draft.positioning || ""); setProofs(draft.proofs || ["", "", ""]); setProjects(draft.projects || [{ name: "", story: "" }]); setPhoto(draft.photo || ""); setPreview(Boolean(draft.autoPublish)); setShouldAutoPublish(Boolean(draft.autoPublish));
    } catch { window.sessionStorage.removeItem("getajob-pow-draft"); }
    setRestoreComplete(true);
  }, []);
  useEffect(() => {
    if (searchParams.get("edit") !== "1" || !supabase) return;
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*, profile_proof_points (*), profile_projects (*)").eq("id", user.id).single();
      if (!data) return;
      const profile = data as { slug: string; full_name: string; headline: string | null; location: string | null; status: string | null; positioning: string | null; linkedin_url: string | null; x_url: string | null; telegram_url: string | null; email: string | null; photo_path: string | null; is_discoverable: boolean; profile_proof_points: { position: number; content: string }[]; profile_projects: { position: number; name: string; story: string }[]; };
      setExistingSlug(profile.slug); setExistingPhotoPath(profile.photo_path); setName(profile.full_name); setHeadline(profile.headline || ""); setLocation(profile.location || ""); setStatus(profile.status || "Open to work"); setDiscoverable(Boolean(profile.is_discoverable)); setPositioning(profile.positioning || ""); setLinkedin(profile.linkedin_url || ""); setTwitter(profile.x_url || ""); setTelegram(profile.telegram_url || ""); setEmail(profile.email || ""); setProofs((profile.profile_proof_points || []).sort((a, b) => a.position - b.position).map((item) => item.content)); setProjects((profile.profile_projects || []).sort((a, b) => a.position - b.position).map((item) => ({ name: item.name, story: item.story || "" }))); if (profile.photo_path) setPhoto(supabase.storage.from("profile-photos").getPublicUrl(profile.photo_path).data.publicUrl);
    };
    void loadProfile();
  }, [searchParams]);
  useEffect(() => {
    if (!restoreComplete || !shouldAutoPublish || autoPublishStarted) return;
    const continuePublishing = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPublishState("error"); setPublishMessage("Google sign-in did not finish. Please try again."); return; }
      setAutoPublishStarted(true);
      await publishProfile();
    };
    void continuePublishing();
  }, [restoreComplete, shouldAutoPublish, autoPublishStarted]);
  if (preview) {
    const completedProjects = projects.filter((project) => project.name);
    return <main className={profileStyles.page}><nav className={profileStyles.nav}><a className={profileStyles.logo} href="/">getajob</a><div className={profileStyles.tabs} role="tablist"><button className={previewTab === "profile" ? profileStyles.selected : ""} onClick={() => setPreviewTab("profile")}>Profile</button><button className={previewTab === "work" ? profileStyles.selected : ""} onClick={() => setPreviewTab("work")}>Work</button></div><button className={profileStyles.share} onClick={() => setPreview(false)}>Edit POW</button></nav>{previewTab === "profile" ? <section className={profileStyles.profileView}><div className={profileStyles.intro}><p className={profileStyles.kicker}>{headline || "Your headline"}</p><h1>Hi, I&apos;m {name || "you"}.</h1><p className={profileStyles.lede}>{positioning || "Your one-line positioning will appear here."}</p><p className={profileStyles.label}>The short version</p>{proofs.filter(Boolean).length ? <ul className={profileStyles.summary}>{proofs.filter(Boolean).map((proof) => <li key={proof}>{proof}</li>)}</ul> : <p className={profileStyles.lede}>Add 3–4 proof points to make your work easy to understand.</p>}<div className={profileStyles.meta}>{linkedin && <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}{twitter && <a href={twitter} target="_blank" rel="noreferrer">𝕏</a>}{telegram && <a href={telegram} target="_blank" rel="noreferrer">Telegram</a>}{email && <a href={`mailto:${email}`}>Email</a>}<span>{location || "Location"} · {status}</span></div><div className={styles.publishRow}><button className={styles.publish} type="button" onClick={publishProfile} disabled={publishState === "working"}>{publishState === "working" ? "Publishing…" : "Publish profile"}</button>{publishMessage && <span>{publishMessage}</span>}</div></div>{photo ? <img className={profileStyles.photo} src={photo} alt="Profile preview" /> : <div className={styles.photoPlaceholder}>{(name || "Y").slice(0, 1)}</div>}</section> : <section className={profileStyles.workView}><div><p className={profileStyles.kicker}>Selected work</p><h1>Things I&apos;ve built.</h1></div>{completedProjects.length ? completedProjects.map((project, index) => <article key={project.name}><span>0{index + 1}</span><div><h2>{project.name}</h2><p>{project.story || "Add the context, contribution, and outcome."}</p></div><strong>{project.story || "Your project story will show here."}</strong></article>) : <p>Add a project to show how you work.</p>}<div className={profileStyles.outcomes}><span>{publishMessage || "Preview · not published"}</span><button className={styles.publish} type="button" onClick={publishProfile} disabled={publishState === "working"}>{publishState === "working" ? "Publishing…" : "Publish profile"}</button></div></section>}</main>;
  }
  return <main className={styles.page}><nav className={styles.nav}><a className={styles.logo} href="/">getajob</a><a href="/jobs">Back to jobs</a></nav><section className={styles.shell}><aside className={styles.intro}><p className={styles.eyebrow}>Show POW</p><h1>Make your edge easy to <em>understand.</em></h1><p>Turn your strongest work into a profile founders and hiring teams can actually assess.</p><ol>{steps.map((label, index) => <li className={index === step ? styles.current : index < step ? styles.done : ""} key={label}><span>0{index + 1}</span>{label}</li>)}</ol></aside><section className={styles.formCard}>
    {step === 0 && <><p className={styles.step}>01 / About you</p><h2>Start with the basics.</h2><p className={styles.helper}>A clear profile starts with who you are, what you do, and where you are based.</p><section className={styles.resumeImport} aria-labelledby="resume-import-title"><div><p id="resume-import-title">Save time — prefill from your résumé</p><span>Upload a PDF and we&apos;ll add what we can. You review and edit every field.</span></div><input ref={resumeInputRef} type="file" accept="application/pdf,.pdf" onChange={importResume} /><button type="button" className={styles.importButton} onClick={() => resumeInputRef.current?.click()} disabled={resumeState === "reading"}>{resumeState === "reading" ? "Reading résumé…" : "Upload PDF"}</button><small>By uploading, you agree that AI may extract profile details from your résumé.</small>{resumeMessage && <p className={`${styles.resumeMessage} ${resumeState === "error" ? styles.resumeError : ""}`} role={resumeState === "error" ? "alert" : "status"}>{resumeMessage}</p>}</section><label className={styles.photoUpload}><input type="file" accept="image/png,image/jpeg,image/webp" onChange={changePhoto} />{photo ? <img src={photo} alt="Selected profile" /> : <span>+</span>}<div><strong>{photo ? "Profile photo selected" : "Add a profile photo"}</strong><small>JPG, PNG, or WEBP</small></div></label><label>Name <b>*</b><input className={invalidFields.includes("name") ? styles.invalid : ""} type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoFocus /></label><label>What do you do? <b>*</b><input className={invalidFields.includes("headline") ? styles.invalid : ""} type="text" required value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Growth & GTM at an early-stage startup" /></label><div className={styles.two}><label>Location <b>*</b><input className={invalidFields.includes("location") ? styles.invalid : ""} type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Delhi NCR, India" /></label><label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option>Open to work</option><option>Hiring</option><option>Not looking</option></select></label></div></>}
    {step === 1 && <><p className={styles.step}>02 / Your proof</p><h2>Show what you&apos;ve done.</h2><p className={styles.helper}>Use 3–4 specific examples. Numbers and outcomes make the strongest case.</p><label>Your positioning <b>*</b><textarea className={invalidFields.includes("positioning") ? styles.invalid : ""} required value={positioning} onChange={(e) => setPositioning(e.target.value)} placeholder="I build…" rows={3} /></label><div className={styles.proofs}>{proofs.map((proof, index) => <label key={index}>Proof point {index + 1}{index < 3 && <> <b>*</b></>}<textarea className={invalidFields.includes(`proof-${index}`) ? styles.invalid : ""} required={index < 3} value={proof} onChange={(e) => updateProof(index, e.target.value)} placeholder="e.g. Built a community from 0 to 1,000 members…" rows={2} /></label>)}</div>{proofs.length < 4 && <button className={styles.add} type="button" onClick={() => setProofs((current) => [...current, ""])}>+ Add another proof point</button>}</>}
    {step === 2 && <><p className={styles.step}>03 / Your work</p><h2>Show how you work.</h2><p className={styles.helper}>Context → what you did → outcome. Add up to three projects.</p>{projects.map((project, index) => <div className={styles.project} key={index}><label>Project {index + 1}{index === 0 && <> <b>*</b></>}<input className={index === 0 && invalidFields.includes("project-name") ? styles.invalid : ""} type="text" required={index === 0} value={project.name} onChange={(e) => updateProject(index, "name", e.target.value)} placeholder="Project, company, or initiative" /></label><label>Story{index === 0 && <> <b>*</b></>}<textarea className={index === 0 && invalidFields.includes("project-story") ? styles.invalid : ""} required={index === 0} value={project.story} onChange={(e) => updateProject(index, "story", e.target.value)} placeholder="Context → what you did → outcome" rows={4} /></label></div>)}{projects.length < 3 && <button className={styles.add} type="button" onClick={() => setProjects((current) => [...current, { name: "", story: "" }])}>+ Add another project</button>}<div className={styles.socialFields}><p className={styles.sectionLabel}>Where can people reach you? <b>*</b></p><div className={styles.two}><label>LinkedIn URL<input className={invalidFields.includes("contact") ? styles.invalid : ""} type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/you" /></label><label>X URL<input className={invalidFields.includes("contact") ? styles.invalid : ""} type="url" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/you" /></label></div><div className={styles.two}><label>Telegram URL<input className={invalidFields.includes("contact") ? styles.invalid : ""} type="url" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/you" /></label><label>Email<input className={invalidFields.includes("contact") ? styles.invalid : ""} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></label></div></div><label className={`${styles.discovery} ${invalidFields.includes("discoverable") ? styles.discoveryInvalid : ""}`}><input type="checkbox" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} /><span><strong>List me in Find Talent <b>*</b></strong><small>Make this profile public and searchable by founders and hiring teams. Your status still shows whether you&apos;re open to work.</small></span></label></>}
    <footer>{validationMessage && <p className={styles.validation} role="alert">{validationMessage}</p>}<div className={styles.footerActions}>{step > 0 && <button className={styles.back} type="button" onClick={() => { setValidationMessage(""); setInvalidFields([]); setStep((current) => current - 1); }}>Back</button>}<button className={styles.next} type="button" onClick={continueStep}>{step === 2 ? "Preview your POW" : "Continue →"}</button></div></footer>
  </section></section></main>;
}
