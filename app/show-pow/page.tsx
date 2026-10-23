"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./show-pow.module.css";
import PowProfile from "../components/pow-profile";
import GoogleSignIn, { googleClientId } from "../components/google-sign-in";
import LocationInput from "../components/location-input";
import PhoneInput, { guessCountry } from "../components/phone-input";
import { isValidPhoneNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/mobile";
import { supabase } from "../../lib/supabase";

type Project = { name: string; story: string };
type ImportedProfile = {
  name: string; headline: string; location: string; positioning: string; proofs: string[]; projects: Project[];
  linkedin: string; twitter: string; telegram: string; email: string;
};
const steps = ["About you", "Your proof", "Your work"];
const MAX_PROJECTS = 5;
const DEFAULT_PROJECT_SLOTS = 3;
const emptyProject = (): Project => ({ name: "", story: "" });
const withSlots = (list: Project[]) => [...list, ...Array.from({ length: Math.max(0, DEFAULT_PROJECT_SLOTS - list.length) }, emptyProject)].slice(0, MAX_PROJECTS);
const isUrl = (value: string) => /^https:\/\/[^\s]+\.[^\s]+$/i.test(value.trim());
const MAX_DRAFT_RESUME_BYTES = 3 * 1024 * 1024;
const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function ShowPowPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(false);
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
  const [positioning, setPositioning] = useState(""); const [proofs, setProofs] = useState(["", "", ""]); const [projects, setProjects] = useState<Project[]>(() => withSlots([]));
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
  const [resumeDragging, setResumeDragging] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResumePath, setExistingResumePath] = useState<string | null>(null);
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("IN");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  // Guess the country after mount; doing it during render would mismatch the server HTML.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPhoneCountry(guessCountry()); }, []);
  const importResume = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void importResumeFile(file);
  };
  const dropResume = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setResumeDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setResumeState("error");
      setResumeMessage("Drop a PDF résumé. Other formats aren't supported yet.");
      return;
    }
    void importResumeFile(file);
  };
  const importResumeFile = async (resume: File) => {
    if (resumeState === "reading") return;
    setResumeFileName(resume.name);
    setResumeFile(resume);
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
      if (profile.projects.length) setProjects(withSlots(profile.projects.slice(0, MAX_PROJECTS)));
      setLinkedin(profile.linkedin || linkedin);
      setTwitter(profile.twitter || twitter);
      setTelegram(profile.telegram || telegram);
      setEmail(profile.email || email);
      setResumeState("done");
      setResumeMessage("Details added from your résumé. Review every field before continuing.");
    } catch (error) {
      setResumeState("error");
      setResumeMessage(error instanceof Error ? error.message : "We could not read that résumé. You can fill the form manually.");
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
      if (!projects[0]?.name.trim()) missing.push("project-name");
      if (!projects[0]?.story.trim()) missing.push("project-story");
      if (!isUrl(linkedin)) missing.push("linkedin");
      if (!isUrl(twitter)) missing.push("twitter");
      if (!isEmail(email)) missing.push("email");
      if (telegram.trim() && !isUrl(telegram)) missing.push("telegram");
      if (phoneNumber.trim() && !isValidPhoneNumber(phoneNumber, phoneCountry)) missing.push("phone");
      const badLinks = (["linkedin", "twitter", "email", "telegram", "phone"] as const).filter((field) => missing.includes(field) && ({ linkedin, twitter, email, telegram, phone: phoneNumber })[field].trim());
      if (badLinks.length && missing.length === badLinks.length) {
        setInvalidFields(missing);
        setValidationMessage(badLinks.length === 1 && badLinks[0] === "email" ? "Enter a valid email address." : badLinks.length === 1 && badLinks[0] === "phone" ? "Enter a valid mobile number for the country you picked." : "Use full links starting with https://, like https://linkedin.com/in/you.");
        return false;
      }
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
    if (!user && googleClientId) {
      // Google popup: no page reload, so we just continue publishing once they're in.
      setPublishState("idle");
      setNeedsSignIn(true);
      return;
    }
    if (!user) {
      try {
        const resumeData = resumeFile && resumeFile.size <= MAX_DRAFT_RESUME_BYTES ? await fileToDataUrl(resumeFile) : "";
        window.sessionStorage.setItem("getajob-pow-draft", JSON.stringify({ name, headline, location, status, discoverable, linkedin, twitter, telegram, email, positioning, proofs, projects, photo, phoneCountry, phoneNumber, resumeData, resumeFileName: resumeData ? resumeFile?.name : "", autoPublish: true }));
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
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, slug, full_name: name || "Your name", headline, location, status, positioning, linkedin_url: linkedin, x_url: twitter, telegram_url: telegram, email, photo_path: photoPath, is_published: true, is_discoverable: true, updated_at: new Date().toISOString() });
    if (profileError) { setPublishState("error"); setPublishMessage("Your profile could not be saved yet. Please try again."); return; }
    await supabase.from("profile_proof_points").delete().eq("profile_id", user.id);
    await supabase.from("profile_projects").delete().eq("profile_id", user.id);
    const proofRows = proofs.filter(Boolean).map((content, index) => ({ profile_id: user.id, position: index + 1, content }));
    const projectRows = projects.filter((project) => project.name).map((project, index) => ({ profile_id: user.id, position: index + 1, name: project.name, story: project.story }));
    const proofResult = proofRows.length ? await supabase.from("profile_proof_points").insert(proofRows) : { error: null };
    const projectResult = projectRows.length ? await supabase.from("profile_projects").insert(projectRows) : { error: null };
    if (proofResult.error || projectResult.error) { setPublishState("error"); setPublishMessage("Your profile was saved, but some proof points or projects weren't. Please publish again."); return; }
    // Résumé and phone are private: stored separately, readable only by the owner.
    let resumePath = existingResumePath;
    if (resumeFile) {
      resumePath = `${user.id}/resume-${Date.now()}.pdf`;
      const { error } = await supabase.storage.from("resumes").upload(resumePath, resumeFile, { upsert: true, contentType: "application/pdf" });
      if (error) { setPublishState("error"); setPublishMessage("Your profile is live, but your résumé couldn't be saved. Please publish again."); return; }
    }
    const phone = phoneNumber.trim() ? parsePhoneNumberFromString(phoneNumber, phoneCountry)?.number || null : null;
    const { error: privateError } = await supabase.from("profile_private").upsert({ profile_id: user.id, phone, resume_path: resumePath, updated_at: new Date().toISOString() });
    if (privateError) { setPublishState("error"); setPublishMessage("Your profile is live, but your phone and résumé couldn't be saved. Please publish again."); return; }
    window.sessionStorage.removeItem("getajob-pow-draft");
    window.location.href = `/p/${slug}`;
  };
  useEffect(() => {
    const saved = window.sessionStorage.getItem("getajob-pow-draft");
    if (!saved) { setRestoreComplete(true); return; }
    try {
      const draft = JSON.parse(saved);
      setName(draft.name || ""); setHeadline(draft.headline || ""); setLocation(draft.location || ""); setStatus(draft.status || "Open to work"); setDiscoverable(Boolean(draft.discoverable)); setLinkedin(draft.linkedin || ""); setTwitter(draft.twitter || ""); setTelegram(draft.telegram || ""); setEmail(draft.email || ""); setPositioning(draft.positioning || ""); setProofs(draft.proofs || ["", "", ""]); setProjects(withSlots(draft.projects || [])); setPhoto(draft.photo || ""); setPreview(Boolean(draft.autoPublish)); setShouldAutoPublish(Boolean(draft.autoPublish));
      if (draft.phoneCountry) setPhoneCountry(draft.phoneCountry); setPhoneNumber(draft.phoneNumber || "");
      if (draft.resumeData) { void fetch(draft.resumeData).then((r) => r.blob()).then((blob) => { setResumeFile(new File([blob], draft.resumeFileName || "resume.pdf", { type: "application/pdf" })); setResumeFileName(draft.resumeFileName || "resume.pdf"); }); }
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
      setExistingSlug(profile.slug); setExistingPhotoPath(profile.photo_path); setName(profile.full_name); setHeadline(profile.headline || ""); setLocation(profile.location || ""); setStatus(profile.status || "Open to work"); setDiscoverable(Boolean(profile.is_discoverable)); setPositioning(profile.positioning || ""); setLinkedin(profile.linkedin_url || ""); setTwitter(profile.x_url || ""); setTelegram(profile.telegram_url || ""); setEmail(profile.email || ""); setProofs((profile.profile_proof_points || []).sort((a, b) => a.position - b.position).map((item) => item.content)); setProjects(withSlots((profile.profile_projects || []).sort((a, b) => a.position - b.position).map((item) => ({ name: item.name, story: item.story || "" })))); if (profile.photo_path) setPhoto(supabase.storage.from("profile-photos").getPublicUrl(profile.photo_path).data.publicUrl);
    };
    const loadPrivate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profile_private").select("phone, resume_path").eq("profile_id", user.id).maybeSingle();
      if (!data) return;
      setExistingResumePath(data.resume_path || null);
      const parsed = data.phone ? parsePhoneNumberFromString(data.phone) : undefined;
      if (parsed?.country) { setPhoneCountry(parsed.country); setPhoneNumber(parsed.formatNational()); }
    };
    void loadProfile();
    void loadPrivate();
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
    const publishControls = <div className={styles.publishRow}><button className={styles.publish} type="button" onClick={publishProfile} disabled={publishState === "working"}>{publishState === "working" ? "Publishing…" : "Publish profile"}</button><span className={publishState === "error" ? styles.publishError : ""}>{publishMessage || (needsSignIn ? "Sign in to publish. Your draft stays as it is." : "Preview. Only you can see this until you publish.")}</span>{needsSignIn && <div className={styles.publishSignIn}><GoogleSignIn text="continue_with" onSignedIn={() => { setNeedsSignIn(false); void publishProfile(); }} onError={(message) => { setPublishState("error"); setPublishMessage(message); }} /></div>}</div>;
    return <PowProfile
      data={{ name, headline, location, status, positioning, proofs, projects, linkedin, x: twitter, telegram, email, photoUrl: photo || null }}
      action={<button type="button" onClick={() => setPreview(false)}>Edit POW</button>}
      footer={publishControls}
    />;
  }
  return <main className={styles.page}><nav className={styles.nav}><a className={styles.logo} href="/">getajob</a><a href="/jobs">Back to jobs</a></nav><section className={styles.shell}><aside className={styles.intro}><p className={styles.eyebrow}>Show POW</p><h1>Make your edge easy to <em>understand.</em></h1><p>Turn your strongest work into a profile founders and hiring teams can actually assess.</p><ol>{steps.map((label, index) => <li className={index === step ? styles.current : index < step ? styles.done : ""} key={label}><span>0{index + 1}</span>{label}</li>)}</ol></aside><section className={styles.formCard}>
    {step === 0 && <><p className={styles.step}>01 / About you</p><h2>Start with the basics.</h2><p className={styles.helper}>A clear profile starts with who you are, what you do, and where you are based.</p><section className={`${styles.resumeImport} ${resumeDragging ? styles.resumeDragging : ""} ${resumeState === "reading" ? styles.resumeReading : ""}`} aria-labelledby="resume-import-title" onDragOver={(e) => { e.preventDefault(); setResumeDragging(true); }} onDragLeave={() => setResumeDragging(false)} onDrop={dropResume}><div className={styles.resumeIcon} aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 17v-6" /><path d="m9.5 13.5 2.5-2.5 2.5 2.5" /></svg></div><div className={styles.resumeCopy}><p id="resume-import-title">{resumeState === "reading" ? "Reading your résumé…" : resumeState === "done" ? "Résumé added" : "Prefill from your résumé"}</p><span>{resumeState === "reading" ? `${resumeFileName} — this takes a few seconds.` : resumeState === "done" ? `From ${resumeFileName}. Check each field below.` : "Drop a PDF here or upload one. You can edit everything after."}</span></div><input ref={resumeInputRef} className={styles.hiddenInput} type="file" accept="application/pdf,.pdf" onChange={importResume} tabIndex={-1} aria-hidden="true" /><button type="button" className={styles.importButton} onClick={() => resumeInputRef.current?.click()} disabled={resumeState === "reading"}>{resumeState === "reading" ? "Reading…" : resumeState === "done" ? "Use another PDF" : "Upload PDF"}</button>{resumeMessage && resumeState === "error" && <p className={`${styles.resumeMessage} ${styles.resumeError}`} role="alert">{resumeMessage}</p>}</section><label className={styles.photoUpload}><input className={styles.hiddenInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={changePhoto} />{photo ? <img src={photo} alt="Selected profile" /> : <span>+</span>}<div><strong>{photo ? "Profile photo selected" : "Add a profile photo"}</strong><small>JPG, PNG, or WEBP</small></div></label><label>Name <b>*</b><input className={invalidFields.includes("name") ? styles.invalid : ""} type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" /></label><label>What do you do? <b>*</b><input className={invalidFields.includes("headline") ? styles.invalid : ""} type="text" required value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Growth & GTM at an early-stage startup" /></label><div className={styles.two}><label>Location <b>*</b><LocationInput value={location} onChange={setLocation} invalid={invalidFields.includes("location")} /></label><label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option>Open to work</option><option>Hiring</option><option>Not looking</option></select></label></div></>}
    {step === 1 && <><p className={styles.step}>02 / Your proof</p><h2>Show what you&apos;ve done.</h2><p className={styles.helper}>Use 3–4 specific examples. Numbers and outcomes make the strongest case.</p><label>Your positioning <b>*</b><textarea className={invalidFields.includes("positioning") ? styles.invalid : ""} required value={positioning} onChange={(e) => setPositioning(e.target.value)} placeholder="I build…" rows={3} /></label><div className={styles.proofs}>{proofs.map((proof, index) => <label key={index}>Proof point {index + 1}{index < 3 && <> <b>*</b></>}<textarea className={invalidFields.includes(`proof-${index}`) ? styles.invalid : ""} required={index < 3} value={proof} onChange={(e) => updateProof(index, e.target.value)} placeholder="e.g. Built a community from 0 to 1,000 members…" rows={2} /></label>)}</div>{proofs.length < 4 && <button className={styles.add} type="button" onClick={() => setProofs((current) => [...current, ""])}>+ Add another proof point</button>}</>}
    {step === 2 && <><p className={styles.step}>03 / Your work</p><h2>Show how you work.</h2><p className={styles.helper}>Add 3 to 5 projects. Write one point per line: the context, what you did, and the outcome.</p>{projects.map((project, index) => <div className={styles.project} key={index}><label>Project {index + 1}{index === 0 && <> <b>*</b></>}<input className={index === 0 && invalidFields.includes("project-name") ? styles.invalid : ""} type="text" required={index === 0} value={project.name} onChange={(e) => updateProject(index, "name", e.target.value)} placeholder="Project, company, or initiative" /></label><label>What happened{index === 0 && <> <b>*</b></>}<textarea className={index === 0 && invalidFields.includes("project-story") ? styles.invalid : ""} required={index === 0} value={project.story} onChange={(e) => updateProject(index, "story", e.target.value)} placeholder={"Grew the community from 0 to 1,000 members\nRan 16 events across 7 countries\nNo paid acquisition"} rows={5} /></label></div>)}{projects.length < MAX_PROJECTS && <button className={styles.add} type="button" onClick={() => setProjects((current) => [...current, emptyProject()])}>+ Add another project</button>}<div className={styles.socialFields}><p className={styles.sectionLabel}>Where can people reach you?</p><div className={styles.two}><label>LinkedIn <b>*</b><input className={invalidFields.includes("linkedin") ? styles.invalid : ""} type="url" required value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/you" /></label><label>X <b>*</b><input className={invalidFields.includes("twitter") ? styles.invalid : ""} type="url" required value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/you" /></label></div><div className={styles.two}><label>Email <b>*</b><input className={invalidFields.includes("email") ? styles.invalid : ""} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></label><label>Telegram <small className={styles.optional}>optional</small><input className={invalidFields.includes("telegram") ? styles.invalid : ""} type="url" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/you" /></label></div><div className={styles.phoneField}><span>Phone</span><PhoneInput country={phoneCountry} number={phoneNumber} onCountry={setPhoneCountry} onNumber={setPhoneNumber} invalid={invalidFields.includes("phone")} /><small className={styles.fieldHint}>Only you can see this. It&apos;s never shown on your profile.</small></div></div></>}
    <footer>{validationMessage && <p className={styles.validation} role="alert">{validationMessage}</p>}<div className={styles.footerActions}>{step > 0 && <button className={styles.back} type="button" onClick={() => { setValidationMessage(""); setInvalidFields([]); setStep((current) => current - 1); }}>Back</button>}<button className={styles.next} type="button" onClick={continueStep}>{step === 2 ? "Preview your POW" : "Continue →"}</button></div></footer>
  </section></section></main>;
}
