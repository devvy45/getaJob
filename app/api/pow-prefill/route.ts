const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_REQUESTS_PER_HOUR = 10;
const requestsByAddress = new Map<string, number[]>();

type ResumeProject = { name?: unknown; points?: unknown; story?: unknown };
type ResumeProfile = {
  name?: unknown;
  headline?: unknown;
  location?: unknown;
  positioning?: unknown;
  proofs?: unknown;
  projects?: unknown;
  linkedin?: unknown;
  twitter?: unknown;
  telegram?: unknown;
  email?: unknown;
};

const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    headline: { type: "string" },
    location: { type: "string" },
    positioning: { type: "string" },
    proofs: { type: "array", items: { type: "string" } },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, points: { type: "array", items: { type: "string" } } },
        required: ["name", "points"],
      },
    },
    linkedin: { type: "string" },
    twitter: { type: "string" },
    telegram: { type: "string" },
    email: { type: "string" },
  },
  required: ["name", "headline", "location", "positioning", "proofs", "projects", "linkedin", "twitter", "telegram", "email"],
};

function limitAddress(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (requestsByAddress.get(address) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= MAX_REQUESTS_PER_HOUR) return false;
  requestsByAddress.set(address, [...recent, now]);
  return true;
}

function asText(value: unknown, maximum = 500) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function asUrl(value: unknown) {
  let text = asText(value, 300);
  if (!text) return "";
  if (!/^https?:\/\//i.test(text) && /^(www\.)?(linkedin\.com|x\.com|twitter\.com|t\.me)\//i.test(text)) text = `https://${text}`;
  text = text.replace(/^http:\/\//i, "https://");
  return /^https:\/\/[^\s]+$/i.test(text) ? text : "";
}

/**
 * Résumés often hide links behind words like "LinkedIn". Those URLs live in the
 * PDF's link annotations, not in the visible text, so we read them directly
 * (including from compressed object streams) and hand them to the model.
 */
/** Inflates a PDF stream, keeping whatever decodes even if the stream has trailing junk. */
async function inflate(data: Uint8Array): Promise<string> {
  const decoder = new TextDecoder("latin1");
  let text = "";
  try {
    const reader = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate")).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
  } catch {
    // Images, fonts, or trailing bytes: keep what decoded so far.
  }
  return text;
}

async function extractPdfLinks(bytes: Uint8Array): Promise<string[]> {
  const found = new Set<string>();
  const scan = (text: string) => {
    for (const match of text.matchAll(/\/URI\s*\(([^)]{4,300})\)/g)) found.add(match[1].replace(/\\([()\\])/g, "$1"));
    for (const match of text.matchAll(/mailto:[^\s)>\]]+/g)) found.add(match[0]);
  };
  const raw = new TextDecoder("latin1").decode(bytes);
  scan(raw);
  // Link annotations only end up compressed inside object streams (/Type /ObjStm),
  // so we skip page content, images and fonts to keep CPU time low.
  const streams = raw.matchAll(/<<(?:(?!>>)[\s\S]){0,400}?\/ObjStm[\s\S]{0,400}?>>\s*stream\r?\n/g);
  let checked = 0;
  for (const match of streams) {
    if (checked++ > 60 || found.size > 40) break;
    if (!match[0].includes("/FlateDecode")) continue;
    const start = (match.index ?? 0) + match[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0 || end - start > 2_000_000) continue;
    let stop = end;
    while (stop > start && (bytes[stop - 1] === 0x0a || bytes[stop - 1] === 0x0d)) stop -= 1;
    const text = await inflate(bytes.subarray(start, stop));
    if (text.includes("/URI") || text.includes("mailto:")) scan(text);
  }
  return [...found]
    .map((link) => link.trim())
    .filter((link) => /^(https?:\/\/|mailto:)/i.test(link))
    .slice(0, 30);
}

function normalizeProfile(value: ResumeProfile) {
  const proofs = Array.isArray(value.proofs)
    ? value.proofs.map((proof) => asText(proof, 360)).filter(Boolean).slice(0, 4)
    : [];
  const projects = Array.isArray(value.projects)
    ? value.projects.map((project) => {
      const item = (project || {}) as ResumeProject;
      const points = Array.isArray(item.points)
        ? item.points.map((point) => asText(point, 220)).filter(Boolean).slice(0, 4)
        : asText(item.story, 1200).split(/\n+/).map((line) => line.trim()).filter(Boolean);
      return { name: asText(item.name, 150), story: points.map((point) => point.replace(/^[-•*]\s*/, "")).join("\n") };
    }).filter((project) => project.name || project.story).slice(0, 5)
    : [];
  return {
    name: asText(value.name, 120),
    headline: asText(value.headline, 180),
    location: asText(value.location, 120),
    positioning: asText(value.positioning, 500),
    proofs,
    projects,
    linkedin: asUrl(value.linkedin),
    twitter: asUrl(value.twitter),
    telegram: asUrl(value.telegram),
    email: asText(value.email, 200),
  };
}

function toBase64(bytes: Uint8Array) {
  let output = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    output += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(output);
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "Résumé prefill is not configured yet." }, { status: 503 });
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return Response.json({ error: "Choose a PDF résumé to continue." }, { status: 400 });
  }
  if (!limitAddress(request)) return Response.json({ error: "Please wait before trying another résumé." }, { status: 429 });

  try {
    const formData = await request.formData();
    const resume = formData.get("resume");
    if (!(resume instanceof File)) return Response.json({ error: "Choose a PDF résumé to continue." }, { status: 400 });
    if (resume.type !== "application/pdf" && !resume.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "For now, upload a PDF résumé." }, { status: 400 });
    }
    if (!resume.size) return Response.json({ error: "That file is empty. Try another PDF." }, { status: 400 });
    if (resume.size > MAX_FILE_BYTES) return Response.json({ error: "Use a PDF smaller than 8 MB." }, { status: 400 });

    const bytes = new Uint8Array(await resume.arrayBuffer());
    const links = await extractPdfLinks(bytes);
    const prompt = `Turn this résumé into a crisp proof-of-work profile. Use only facts in the résumé. Never invent, infer, or embellish.

Style for every field:
- Plain, simple words. No buzzwords ("passionate", "results-driven", "leveraged", "spearheaded", "synergy").
- No repetition: each fact appears once across the whole profile. Proof points and project points must not restate each other.
- Lead with the result or the number when there is one. Keep numbers exactly as written.
- Start points with a strong verb (Built, Grew, Ran, Shipped, Led, Cut). No trailing period.

Fields:
- name: full name.
- headline: current role or focus, max 8 words (e.g. "Growth & community lead, Web3").
- location: city and country if given.
- positioning: one first-person line, max 20 words, only if the résumé supports it; otherwise "".
- proofs: the 3–4 strongest achievements across the whole résumé, each max 16 words, with numbers or scope where present.
- projects: up to 5 roles, companies, or projects, most impressive first. name = company or project (add role only if short). points = 2–4 crisp points, each max 18 words, covering context, what they did, and the outcome. However the résumé phrases it (paragraphs, labels like "Context:" or "Outcome:", long bullets), rewrite it as these short points.
- linkedin, twitter, telegram, email: only if present in the résumé or in the link list below. Return full URLs (https://…). twitter means an x.com or twitter.com profile URL.

Links found inside the PDF (may be hidden behind words like "LinkedIn"):
${links.length ? links.join("\n") : "(none)"}

Return empty strings or empty arrays for anything unavailable.`;
    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "application/pdf", data: toBase64(bytes) } }] }],
      generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.1 },
    });
    let response: Response | undefined;
    let lastStatus = 0;
    for (const model of ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"]) {
      const attempt = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: requestBody,
      });
      if (attempt.ok) { response = attempt; break; }
      lastStatus = attempt.status;
      if (attempt.status !== 429 && attempt.status !== 503) {
        console.error("[pow-prefill] Gemini request failed", attempt.status);
        break;
      }
    }
    if (!response) {
      console.error("[pow-prefill] Gemini request unavailable", lastStatus);
      return Response.json({ error: "Résumé prefill is briefly unavailable. Please try again in a moment, or fill the form manually." }, { status: 502 });
    }
    const payload = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    if (!text) return Response.json({ error: "We could not find profile details in that PDF. You can fill the form manually." }, { status: 422 });
    let extracted: ResumeProfile;
    try { extracted = JSON.parse(text) as ResumeProfile; } catch { return Response.json({ error: "We could not structure that résumé. You can fill the form manually." }, { status: 422 }); }
    const profile = normalizeProfile(extracted);
    // Fill any socials the model missed straight from the PDF's own links.
    const pick = (pattern: RegExp) => links.find((link) => pattern.test(link)) || "";
    if (!profile.linkedin) profile.linkedin = asUrl(pick(/linkedin\.com\/in\//i));
    if (!profile.twitter) profile.twitter = asUrl(pick(/^(https?:\/\/)?(www\.)?(x|twitter)\.com\/[A-Za-z0-9_]+\/?$/i));
    if (!profile.telegram) profile.telegram = asUrl(pick(/t\.me\//i));
    if (!profile.email) profile.email = pick(/^mailto:/i).replace(/^mailto:/i, "").split("?")[0];
    return Response.json({ profile });
  } catch (error) {
    console.error("[pow-prefill]", error);
    return Response.json({ error: "Something went wrong while reading your résumé. You can fill the form manually." }, { status: 500 });
  }
}
