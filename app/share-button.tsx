"use client";

import { useState } from "react";

type Props = {
  company: string;
  role: string;
  className?: string;
};

export default function ShareButton({ company, role, className }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.origin + "/jobs"
      : "/jobs";
  const shareText = `${role} at ${company} — via getajob`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
      } catch {
        // user cancelled or error — silently ignore
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard denied — silently ignore
    }
  }

  return (
    <button
      className={className}
      type="button"
      onClick={handleShare}
      aria-label={`Share ${role} at ${company}`}
      title="Share this role"
    >
      {copied ? "Copied" : "Share"} <span>↗</span>
    </button>
  );
}
