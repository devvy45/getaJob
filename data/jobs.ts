export type Job = {
  id: string;
  personName: string;
  personHeadline: string;
  company: string;
  role: string;
  category: "Engineering" | "Product" | "Design" | "Growth" | "Marketing" | "HR" | "Operations";
  location: string;
  excerpt: string;
  postedAt: string;
  publishedAt: string;
  sourceUrl: string;
  initials: string;
  accent: string;
};

// This is the only file you need to edit to add, update, or remove jobs for now.
export const jobs: Job[] = [
  {
    id: "krea-founding-engineer",
    personName: "Victor Perez",
    personHeadline: "Co-founder at Krea",
    company: "Krea",
    role: "Founding Engineer",
    category: "Engineering",
    location: "San Francisco / Remote",
    excerpt: "We’re looking for an early engineer who wants to build creative tools used by millions of people.",
    postedAt: "2d ago",
    publishedAt: "2026-08-24",
    sourceUrl: "#",
    initials: "VP",
    accent: "#d56e53",
  },
  {
    id: "vercel-devex",
    personName: "Lee Robinson",
    personHeadline: "VP of Developer Experience at Vercel",
    company: "Vercel",
    role: "Developer Experience",
    category: "Product",
    location: "Remote",
    excerpt: "We’re looking for someone who cares deeply about making developers faster and more confident.",
    postedAt: "3d ago",
    publishedAt: "2026-08-23",
    sourceUrl: "#",
    initials: "LR",
    accent: "#8f6759",
  },
  {
    id: "posthog-product-engineer",
    personName: "James Hawkins",
    personHeadline: "Co-founder at PostHog",
    company: "PostHog",
    role: "Product Engineer",
    category: "Engineering",
    location: "Remote",
    excerpt: "Join a small product team working on tools that help engineers understand their users.",
    postedAt: "5d ago",
    publishedAt: "2026-08-21",
    sourceUrl: "#",
    initials: "JH",
    accent: "#bd6144",
  },
  {
    id: "razorpay-product-manager",
    personName: "Rahil Shah",
    personHeadline: "Product leader at Razorpay",
    company: "Razorpay",
    role: "Product Manager, New Bets",
    category: "Product",
    location: "Bengaluru",
    excerpt: "We’re hiring a product thinker to take ambitious new ideas from zero to one.",
    postedAt: "6d ago",
    publishedAt: "2026-08-20",
    sourceUrl: "#",
    initials: "RS",
    accent: "#de865a",
  },
  {
    id: "clay-growth-lead",
    personName: "Kareem Amin",
    personHeadline: "Co-founder at Clay",
    company: "Clay",
    role: "Growth Lead",
    category: "Growth",
    location: "New York / Remote",
    excerpt: "We’re looking for a creative operator to help a fast-growing product reach its next chapter.",
    postedAt: "7d ago",
    publishedAt: "2026-08-19",
    sourceUrl: "#",
    initials: "KA",
    accent: "#a65b48",
  },
];

export const fallbackJobs = jobs;
