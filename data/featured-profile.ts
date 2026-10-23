import type { PowProfileData } from "../app/components/pow-profile";

/** The hand-built profile at /p/ayush-goel. Also used as the homepage example until real profiles are public. */
export const featuredProfileSlug = "ayush-goel";

export const featuredProfile: PowProfileData = {
  name: "Ayush Goel",
  headline: "Founder, GetAJob · Growth & GTM",
  location: "Delhi NCR, India",
  status: "Hiring",
  positioning: "I build products, communities, and growth engines for early-stage tech startups.",
  proofs: [
    "Building GetAJob, a proof-first talent network.",
    "Built EigenTribe from 0 → 1,000+ members.",
    "Led 16+ developer events across 7 countries.",
    "Helped generate 1M+ organic impressions around EigenLayer.",
  ],
  projects: [
    { name: "GetAJob", story: "Founder, 2026–present\nBuilding a proof-first talent network on top of a curated jobs board" },
    { name: "EigenTribe / EigenLayer", story: "Community Lead, 2025–2026\nBuilt a global developer community, ecosystem programs, and growth loops\n1,000+ members, 16+ events across 7 countries, 1M+ impressions" },
  ],
  linkedin: "https://www.linkedin.com/in/ayushhgoel7/",
  x: "https://x.com/ayushhgoel7",
  telegram: "https://t.me/ayushhgoel7",
  email: "ayushgoyal1124@gmail.com",
  photoUrl: "/profiles/ayush-goel.png",
};
