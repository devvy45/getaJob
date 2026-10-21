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
  isSample?: boolean;
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
    publishedAt: "",
    sourceUrl: "https://www.krea.ai/careers",
    initials: "VP",
    accent: "#d56e53",
    isSample: true,
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
    publishedAt: "",
    sourceUrl: "https://vercel.com/careers",
    initials: "LR",
    accent: "#8f6759",
    isSample: true,
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
    publishedAt: "",
    sourceUrl: "https://posthog.com/careers",
    initials: "JH",
    accent: "#bd6144",
    isSample: true,
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
    publishedAt: "",
    sourceUrl: "https://razorpay.com/jobs/",
    initials: "RS",
    accent: "#de865a",
    isSample: true,
  },
];

export const fallbackJobs = jobs;
