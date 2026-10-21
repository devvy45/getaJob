const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_REQUESTS_PER_HOUR = 10;
const requestsByAddress = new Map<string, number[]>();

type ResumeProject = { name?: unknown; story?: unknown };
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
        properties: { name: { type: "string" }, story: { type: "string" } },
        required: ["name", "story"],
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
  const text = asText(value, 300);
  return /^https:\/\/[^\s]+$/i.test(text) ? text : "";
}

function normalizeProfile(value: ResumeProfile) {
  const proofs = Array.isArray(value.proofs)
    ? value.proofs.map((proof) => asText(proof, 360)).filter(Boolean).slice(0, 4)
    : [];
  const projects = Array.isArray(value.projects)
    ? value.projects.map((project) => {
      const item = (project || {}) as ResumeProject;
      return { name: asText(item.name, 150), story: asText(item.story, 1200) };
    }).filter((project) => project.name || project.story).slice(0, 3)
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

    const prompt = `Extract only facts that appear in this résumé into the requested profile fields. Do not infer, embellish, or invent details.\n\nFor headline, write the person's current role or professional focus in one concise line. For positioning, write a first-person one-line statement only when the résumé supports it; otherwise return an empty string. Create up to four specific proof points containing outcomes, numbers, or scope where present. Create up to three work projects; each story should briefly state context, contribution, and outcome using only résumé facts. Only return a social URL if it is explicitly printed in the résumé. Return empty strings or empty arrays for unavailable information.`;
    const bytes = new Uint8Array(await resume.arrayBuffer());
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
    return Response.json({ profile: normalizeProfile(extracted) });
  } catch (error) {
    console.error("[pow-prefill]", error);
    return Response.json({ error: "Something went wrong while reading your résumé. You can fill the form manually." }, { status: 500 });
  }
}
